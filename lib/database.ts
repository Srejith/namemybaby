import { createClient } from '@/lib/supabase-client';
import { NameItem } from '@/types';

export type TableName = 'generated_list' | 'shortlist' | 'maybe' | 'rejected';

interface DatabaseNameItem {
  id: string;
  name: string;
  gender?: string;
  inspiration?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch (error) {
    console.warn('Failed to get current user:', error);
    return null;
  }
}

/**
 * Load all names from a specific table for the current user
 */
export async function loadNamesFromTable(tableName: TableName, userId?: string): Promise<NameItem[]> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Returning empty array.');
      return [];
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('id, name, gender, inspiration')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error loading names from ${tableName}:`, error);
      throw error;
    }

    return (data || []).map((item: DatabaseNameItem) => ({
      id: item.id,
      name: item.name,
      gender: item.gender === 'Boy' || item.gender === 'Girl' ? item.gender : undefined,
      inspiration: item.inspiration || undefined,
    }));
  } catch (error) {
    console.error(`Failed to load names from ${tableName}:`, error);
    return [];
  }
}

/**
 * Insert a name into a table (with duplicate prevention)
 */
export async function insertNameToTable(tableName: TableName, name: string, userId?: string, gender?: 'Boy' | 'Girl', inspiration?: string): Promise<NameItem | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      // Fallback: return a local item without database persistence
      return {
        id: `${tableName}-${Date.now()}-${Math.random()}`,
        name: name.trim(),
        gender: gender,
        inspiration: inspiration || undefined,
      };
    }

    // Check for duplicates (case-insensitive) at database level for this user
    const { data: existing } = await supabase
      .from(tableName)
      .select('id, name')
      .eq('user_id', currentUserId)
      .ilike('name', name.trim())
      .single();

    if (existing) {
      throw new Error(`Name "${name.trim()}" already exists in ${tableName}`);
    }

    const newItem: DatabaseNameItem = {
      id: `${tableName}-${Date.now()}-${Math.random()}`,
      user_id: currentUserId,
      name: name.trim(),
      gender: gender || undefined,
      inspiration: inspiration || undefined,
    };

    const { data, error } = await supabase
      .from(tableName)
      .insert([newItem])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (if database has unique constraint on name)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error(`Name "${name.trim()}" already exists in ${tableName}`);
      }
      console.error(`Error inserting name to ${tableName}:`, error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      gender: data.gender === 'Boy' || data.gender === 'Girl' ? data.gender : undefined,
      inspiration: data.inspiration || undefined,
    };
  } catch (error) {
    console.error(`Failed to insert name to ${tableName}:`, error);
    throw error;
  }
}

/**
 * Insert multiple names into a table (with duplicate prevention)
 */
export async function insertNamesToTable(tableName: TableName, nameItems: Array<{ name: string; inspiration?: string }>, userId?: string, gender?: 'Boy' | 'Girl'): Promise<NameItem[]> {
  try {
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      // Fallback: return local items without database persistence
      return nameItems.map((item, index) => ({
        id: `${tableName}-${Date.now()}-${index}-${Math.random()}`,
        name: item.name.trim(),
        gender: gender,
        inspiration: item.inspiration || undefined,
      }));
    }

    const insertedItems: NameItem[] = [];
    
    for (const nameItem of nameItems) {
      try {
        const item = await insertNameToTable(tableName, nameItem.name, currentUserId, gender, nameItem.inspiration);
        if (item) {
          insertedItems.push(item);
        }
      } catch (error) {
        // Skip duplicates silently for batch insert
        console.warn(`Skipping duplicate name "${nameItem.name}" in ${tableName}`);
      }
    }

    return insertedItems;
  } catch (error) {
    console.error(`Failed to insert names to ${tableName}:`, error);
    // Fallback to local items
    return names.map((name, index) => ({
      id: `${tableName}-${Date.now()}-${index}-${Math.random()}`,
      name: name.trim(),
      gender: gender,
    }));
  }
}

/**
 * Delete a name from a table by ID (only for current user)
 */
export async function deleteNameFromTable(tableName: TableName, id: string, userId?: string): Promise<void> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      // Fallback: do nothing, app will handle UI update
      return;
    }

    // Only delete if the item belongs to the current user
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (error) {
      console.error(`Error deleting name from ${tableName}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Failed to delete name from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Move a name from one table to another (only for current user)
 */
export async function moveNameBetweenTables(
  fromTable: TableName,
  toTable: TableName,
  id: string,
  sourceName?: string, // Optional: provide the name if moving from in-memory state
  userId?: string,
  sourceGender?: 'Boy' | 'Girl', // Optional: provide the gender if moving from in-memory state
  sourceInspiration?: string // Optional: provide the inspiration if moving from in-memory state
): Promise<NameItem | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      // Fallback: return a new item with the provided name or generate ID
      if (sourceName) {
        return {
          id: `${toTable}-${Date.now()}-${Math.random()}`,
          name: sourceName,
          gender: sourceGender,
          inspiration: sourceInspiration || undefined,
        };
      }
      return null;
    }

    // First, get the name from the source table (only if it belongs to current user)
    const { data: sourceItem, error: fetchError } = await supabase
      .from(fromTable)
      .select('name, gender, inspiration, user_id')
      .eq('id', id)
      .eq('user_id', currentUserId)
      .single();

    // Determine gender: use sourceItem gender if available, otherwise use sourceGender parameter
    const gender = sourceItem?.gender || sourceGender;
    // Determine inspiration: use sourceItem inspiration if available, otherwise use sourceInspiration parameter
    const inspiration = sourceItem?.inspiration || sourceInspiration;
    
    if (fetchError || !sourceItem) {
      // If not found in DB but we have sourceName, use it (case when moving from generated_list that might not be in DB yet)
      if (sourceName) {
        // Still check for duplicates in target table for this user
        const { data: existing } = await supabase
          .from(toTable)
          .select('id, name')
          .eq('user_id', currentUserId)
          .ilike('name', sourceName)
          .single();

        if (existing) {
          throw new Error(`Name "${sourceName}" already exists in ${toTable}`);
        }

        const newItem: DatabaseNameItem = {
          id: `${toTable}-${Date.now()}-${Math.random()}`,
          user_id: currentUserId,
          name: sourceName,
          gender: gender || undefined,
          inspiration: inspiration || undefined,
        };

        const { data: insertedItem, error: insertError } = await supabase
          .from(toTable)
          .insert([newItem])
          .select()
          .single();

        if (insertError) {
          if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
            throw new Error(`Name "${sourceName}" already exists in ${toTable}`);
          }
          throw insertError;
        }

        return {
          id: insertedItem.id,
          name: insertedItem.name,
          gender: insertedItem.gender === 'Boy' || insertedItem.gender === 'Girl' ? insertedItem.gender : undefined,
          inspiration: insertedItem.inspiration || undefined,
        };
      }
      throw new Error(`Name not found in ${fromTable}`);
    }

    // Check if name already exists in target table (case-insensitive) for this user
    const { data: existing } = await supabase
      .from(toTable)
      .select('id, name')
      .eq('user_id', currentUserId)
      .ilike('name', sourceItem.name)
      .single();

    if (existing) {
      throw new Error(`Name "${sourceItem.name}" already exists in ${toTable}`);
    }

    // Insert into target table
    const newItem: DatabaseNameItem = {
      id: `${toTable}-${Date.now()}-${Math.random()}`,
      user_id: currentUserId,
      name: sourceItem.name,
      gender: gender || undefined,
      inspiration: inspiration || undefined,
    };

    const { data: insertedItem, error: insertError } = await supabase
      .from(toTable)
      .insert([newItem])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        throw new Error(`Name "${sourceItem.name}" already exists in ${toTable}`);
      }
      throw insertError;
    }

    // Delete from source table (only if it belongs to current user)
    const { error: deleteError } = await supabase
      .from(fromTable)
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (deleteError) {
      // If delete fails, try to rollback by deleting from target table
      await supabase.from(toTable).delete().eq('id', insertedItem.id);
      throw deleteError;
    }

    return {
      id: insertedItem.id,
      name: insertedItem.name,
      gender: insertedItem.gender === 'Boy' || insertedItem.gender === 'Girl' ? insertedItem.gender : undefined,
      inspiration: insertedItem.inspiration || undefined,
    };
  } catch (error) {
    console.error(`Failed to move name from ${fromTable} to ${toTable}:`, error);
    throw error;
  }
}

