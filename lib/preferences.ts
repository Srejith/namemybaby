import { createClient } from '@/lib/supabase-client';
import { UserPreferences } from '@/types';

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
 * Load user preferences from the database
 */
export async function loadUserPreferences(userId?: string): Promise<UserPreferences | null> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot load preferences.');
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('user_name, partner_name, baby_gender, birth_country, living_country, religion, tone, alphabet_preferences, other_preferences, number_of_names_to_generate')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading user preferences:', error);
      throw error;
    }

    if (!data) {
      // Return default preferences if none exist
      return {
        userName: '',
        partnerName: '',
        birthCountry: '',
        livingCountry: '',
        religion: '',
        tone: '',
        alphabetPreferences: '',
        otherPreferences: '',
        numberOfNamesToGenerate: 5,
      };
    }

    // Map database column names to UserPreferences interface
    return {
      userName: data.user_name || '',
      partnerName: data.partner_name || '',
      babyGender: (data.baby_gender as 'Boy' | 'Girl' | "I don't know yet") || undefined,
      birthCountry: data.birth_country || '',
      livingCountry: data.living_country || '',
      religion: data.religion || '',
      tone: data.tone || '',
      alphabetPreferences: data.alphabet_preferences || '',
      otherPreferences: data.other_preferences || '',
      numberOfNamesToGenerate: data.number_of_names_to_generate || 5,
    };
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return null;
  }
}

/**
 * Save user preferences to the database (upsert)
 */
export async function saveUserPreferences(preferences: UserPreferences, userId?: string): Promise<void> {
  try {
    const supabase = createClient();
    const currentUserId = userId || await getCurrentUserId();

    if (!currentUserId) {
      console.warn('No authenticated user. Cannot save preferences.');
      throw new Error('User must be authenticated to save preferences');
    }

    // Map UserPreferences interface to database column names
    const preferencesData = {
      user_id: currentUserId,
      user_name: preferences.userName || null,
      partner_name: preferences.partnerName || null,
      baby_gender: preferences.babyGender || null,
      birth_country: preferences.birthCountry || null,
      living_country: preferences.livingCountry || null,
      religion: preferences.religion || null,
      tone: preferences.tone || null,
      alphabet_preferences: preferences.alphabetPreferences || null,
      other_preferences: preferences.otherPreferences || null,
      number_of_names_to_generate: preferences.numberOfNamesToGenerate || 5,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(preferencesData, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
}

