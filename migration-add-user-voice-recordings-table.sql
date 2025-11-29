-- Create table for storing user voice recordings
CREATE TABLE IF NOT EXISTS user_voice_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  audio_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate recordings for same name+voice+user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_voice_recordings_user_name_voice_unique 
ON user_voice_recordings(user_id, LOWER(name), voice_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_voice_recordings_user_id ON user_voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_recordings_name ON user_voice_recordings(LOWER(name));

-- Enable Row Level Security
ALTER TABLE user_voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own voice recordings"
  ON user_voice_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice recordings"
  ON user_voice_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice recordings"
  ON user_voice_recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice recordings"
  ON user_voice_recordings FOR DELETE
  USING (auth.uid() = user_id);

