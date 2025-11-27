import { createClient } from './supabase-client';

/**
 * Check if audio file exists in database for given name, voice, and user
 */
export async function checkAudioFileExists(
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
      .from('voice_audio_files')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('voice_id', voiceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking audio file:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking audio file existence:', error);
    return false;
  }
}

/**
 * Get audio file from database
 */
export async function getAudioFile(
  name: string,
  voiceId: string,
  userId: string
): Promise<Blob | null> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('voice_audio_files')
      .select('audio_data')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('voice_id', voiceId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching audio file:', error);
      return null;
    }

    // Convert BYTEA to Blob
    const audioData = data.audio_data;
    
    // Supabase returns BYTEA as base64 string
    if (typeof audioData === 'string') {
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'audio/mpeg' });
    }

    // Handle ArrayBuffer or Uint8Array if returned
    if (audioData instanceof ArrayBuffer || audioData instanceof Uint8Array) {
      return new Blob([audioData], { type: 'audio/mpeg' });
    }

    return null;
  } catch (error) {
    console.error('Error getting audio file:', error);
    return null;
  }
}

/**
 * Save audio file to database via API route
 */
export async function saveAudioFile(
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
    formData.append('audio', audioBlob, `${name}_${voiceId}.mp3`);

    const response = await fetch('/api/voice-audio/save', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error saving audio file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving audio file:', error);
    return false;
  }
}

