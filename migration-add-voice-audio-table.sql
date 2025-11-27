-- Create table for storing voice audio files
CREATE TABLE IF NOT EXISTS voice_audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  audio_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate audio files for same name+voice+user
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_audio_user_name_voice_unique 
ON voice_audio_files(user_id, LOWER(name), voice_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_audio_user_id ON voice_audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_name ON voice_audio_files(LOWER(name));

-- Enable Row Level Security (uncomment when ready to use RLS)
-- ALTER TABLE voice_audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies (uncomment when ready to use RLS)
-- CREATE POLICY "Users can view their own audio files"
--   ON voice_audio_files FOR SELECT
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own audio files"
--   ON voice_audio_files FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own audio files"
--   ON voice_audio_files FOR UPDATE
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own audio files"
--   ON voice_audio_files FOR DELETE
--   USING (auth.uid() = user_id);

