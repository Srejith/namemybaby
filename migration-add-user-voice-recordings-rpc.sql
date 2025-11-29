-- Create a function to upsert user voice recordings with BYTEA support
CREATE OR REPLACE FUNCTION upsert_user_voice_recording(
  p_user_id UUID,
  p_name TEXT,
  p_voice_id TEXT,
  p_audio_data TEXT  -- Base64 encoded string
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_voice_recordings (user_id, name, voice_id, audio_data, updated_at)
  VALUES (p_user_id, p_name, p_voice_id, decode(p_audio_data, 'base64'), NOW())
  ON CONFLICT (user_id, LOWER(name), voice_id)
  DO UPDATE SET
    audio_data = decode(p_audio_data, 'base64'),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

