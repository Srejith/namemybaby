import { createClient } from './supabase-client';

/**
 * Check if user voice recording exists in database for given name, voice, and user
 */
export async function checkUserRecordingExists(
  name: string,
  voiceId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_voice_recordings')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('voice_id', voiceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user recording:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user recording existence:', error);
    return false;
  }
}

/**
 * Get user voice recording from database via API route
 */
export async function getUserRecording(
  name: string,
  voiceId: string,
  userId: string
): Promise<Blob | null> {
  try {
    // Use API route to handle BYTEA conversion on server side
    const params = new URLSearchParams({
      name,
      voice_id: voiceId,
      user_id: userId,
    });

    const response = await fetch(`/api/user-voice-recordings?${params.toString()}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Recording not found
      }
      console.error('Error fetching user recording:', response.statusText);
      return null;
    }

    // Get the audio blob from response with explicit MIME type
    const contentType = response.headers.get('content-type') || 'audio/webm';
    const blob = await response.blob();
    
    // Ensure blob has correct type - create new blob with explicit type
    if (blob.type !== contentType) {
      return new Blob([blob], { type: contentType });
    }
    
    // Validate blob has data
    if (blob.size === 0) {
      console.error('Received empty blob from API');
      return null;
    }
    
    return blob;
  } catch (error) {
    console.error('Error getting user recording:', error);
    return null;
  }
}

/**
 * Save user voice recording to database via API route
 */
export async function saveUserRecording(
  name: string,
  voiceId: string,
  audioBlob: Blob,
  userId: string
): Promise<boolean> {
  try {
    // Create FormData to send blob to server
    const formData = new FormData();
    formData.append('name', name);
    formData.append('voice_id', voiceId);
    formData.append('user_id', userId);
    formData.append('audio', audioBlob, `${name}_${voiceId}_user_recording.webm`);

    const response = await fetch('/api/user-voice-recordings/save', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error saving user recording:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving user recording:', error);
    return false;
  }
}

