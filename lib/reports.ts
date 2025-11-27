import { createClient } from '@/lib/supabase-client';

export interface NameReport {
  id: string;
  name: string;
  report_content: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseReport {
  id: string;
  user_id: string;
  name: string;
  report_content: string;
  created_at: string;
  updated_at: string;
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
 * Save a report for a name
 */
export async function saveReport(name: string, reportContent: string, userId?: string): Promise<NameReport | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot save report.');
      return null;
    }

    const reportId = `report-${Date.now()}-${Math.random()}`;

    const newReport: DatabaseReport = {
      id: reportId,
      user_id: currentUserId,
      name: name.trim(),
      report_content: reportContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('name_reports')
      .insert([newReport])
      .select()
      .single();

    if (error) {
      console.error('Error saving report:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      report_content: data.report_content,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to save report:', error);
    throw error;
  }
}

/**
 * Update an existing report for a name (if it exists) or create a new one
 */
export async function upsertReport(name: string, reportContent: string, userId?: string): Promise<NameReport | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot save report.');
      return null;
    }

    // Check if a report already exists for this name
    const { data: existing } = await supabase
      .from('name_reports')
      .select('id, name, report_content, created_at, updated_at')
      .eq('user_id', currentUserId)
      .ilike('name', name.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update existing report
      const { data, error } = await supabase
        .from('name_reports')
        .update({
          report_content: reportContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', currentUserId)
        .select()
        .single();

      if (error) {
        console.error('Error updating report:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        report_content: data.report_content,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } else {
      // Create new report
      return await saveReport(name, reportContent, currentUserId);
    }
  } catch (error) {
    console.error('Failed to upsert report:', error);
    throw error;
  }
}

/**
 * Load all reports for the current user
 */
export async function loadReports(userId?: string): Promise<NameReport[]> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Returning empty array.');
      return [];
    }

    const { data, error } = await supabase
      .from('name_reports')
      .select('id, name, report_content, created_at, updated_at')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
      throw error;
    }

    return (data || []).map((item: DatabaseReport) => ({
      id: item.id,
      name: item.name,
      report_content: item.report_content,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    console.error('Failed to load reports:', error);
    return [];
  }
}

/**
 * Load a report by name for the current user
 */
export async function loadReportByName(name: string, userId?: string): Promise<NameReport | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot load report.');
      return null;
    }

    const { data, error } = await supabase
      .from('name_reports')
      .select('id, name, report_content, created_at, updated_at')
      .eq('user_id', currentUserId)
      .ilike('name', name.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error loading report by name:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      report_content: data.report_content,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to load report by name:', error);
    return null;
  }
}

/**
 * Load a specific report by ID
 */
export async function loadReportById(reportId: string, userId?: string): Promise<NameReport | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot load report.');
      return null;
    }

    const { data, error } = await supabase
      .from('name_reports')
      .select('id, name, report_content, created_at, updated_at')
      .eq('id', reportId)
      .eq('user_id', currentUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error loading report:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      report_content: data.report_content,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to load report:', error);
    return null;
  }
}

/**
 * Delete a report by ID
 */
export async function deleteReport(reportId: string, userId?: string): Promise<void> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot delete report.');
      return;
    }

    const { error } = await supabase
      .from('name_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete report:', error);
    throw error;
  }
}

