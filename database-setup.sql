-- ============================================================================
-- Name My Baby - Complete Database Setup
-- ============================================================================
-- This SQL file contains the complete database schema for the Name My Baby application.
-- Run this once in your Supabase SQL Editor to set up all tables, indexes, 
-- constraints, RPC functions, and RLS policies for a fresh project.
-- ============================================================================

-- ============================================================================
-- PART 1: CORE NAME TABLES
-- ============================================================================

-- Table 1: Generated List
CREATE TABLE IF NOT EXISTS generated_list (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  inspiration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Shortlist
CREATE TABLE IF NOT EXISTS shortlist (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  inspiration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Maybe
CREATE TABLE IF NOT EXISTS maybe (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  inspiration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Rejected
CREATE TABLE IF NOT EXISTS rejected (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  inspiration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON COLUMN generated_list.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN shortlist.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN maybe.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN rejected.inspiration IS 'The inspiration or meaning behind the name';

-- ============================================================================
-- PART 2: USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  partner_name TEXT,
  birth_country TEXT,
  living_country TEXT,
  religion TEXT,
  baby_gender TEXT CHECK (baby_gender IN ('Boy', 'Girl', 'I don''t know yet')),
  tone TEXT,
  alphabet_preferences TEXT,
  other_preferences TEXT,
  number_of_names_to_generate INTEGER DEFAULT 5 CHECK (number_of_names_to_generate >= 1 AND number_of_names_to_generate <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.user_name IS 'The name of the user (parent)';
COMMENT ON COLUMN user_preferences.partner_name IS 'The name of the user''s partner (parent)';
COMMENT ON COLUMN user_preferences.baby_gender IS 'The gender of the baby: Boy, Girl, or I don''t know yet';

-- ============================================================================
-- PART 3: NAME REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS name_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: VOICE AUDIO TABLES
-- ============================================================================

-- Table for storing ElevenLabs generated audio files
CREATE TABLE IF NOT EXISTS voice_audio_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  audio_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user voice recordings
CREATE TABLE IF NOT EXISTS user_voice_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  audio_data BYTEA NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Unique indexes for duplicate prevention (case-insensitive) per user on name tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_list_user_name_unique ON generated_list(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlist_user_name_unique ON shortlist(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_maybe_user_name_unique ON maybe(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_rejected_user_name_unique ON rejected(user_id, LOWER(name));

-- Indexes for user_id for faster queries on name tables
CREATE INDEX IF NOT EXISTS idx_generated_list_user_id ON generated_list(user_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_user_id ON shortlist(user_id);
CREATE INDEX IF NOT EXISTS idx_maybe_user_id ON maybe(user_id);
CREATE INDEX IF NOT EXISTS idx_rejected_user_id ON rejected(user_id);

-- Indexes for user_preferences (though user_id is already the primary key)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes for name_reports
CREATE INDEX IF NOT EXISTS idx_name_reports_user_id ON name_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_name_reports_name ON name_reports(user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_name_reports_created_at ON name_reports(created_at DESC);

-- Unique indexes for voice audio files (prevent duplicates for same name+voice+user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_audio_user_name_voice_unique 
ON voice_audio_files(user_id, LOWER(name), voice_id);

-- Indexes for voice audio files
CREATE INDEX IF NOT EXISTS idx_voice_audio_user_id ON voice_audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_name ON voice_audio_files(LOWER(name));

-- Unique indexes for user voice recordings (prevent duplicates for same name+voice+user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_voice_recordings_user_name_voice_unique 
ON user_voice_recordings(user_id, LOWER(name), voice_id);

-- Indexes for user voice recordings
CREATE INDEX IF NOT EXISTS idx_user_voice_recordings_user_id ON user_voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_recordings_name ON user_voice_recordings(LOWER(name));

-- ============================================================================
-- PART 6: RPC FUNCTIONS FOR AUDIO STORAGE
-- ============================================================================

-- Function to upsert voice audio files with BYTEA support
CREATE OR REPLACE FUNCTION upsert_voice_audio(
  p_user_id UUID,
  p_name TEXT,
  p_voice_id TEXT,
  p_audio_data TEXT  -- Base64 encoded string
)
RETURNS void AS $$
BEGIN
  INSERT INTO voice_audio_files (user_id, name, voice_id, audio_data, updated_at)
  VALUES (p_user_id, p_name, p_voice_id, decode(p_audio_data, 'base64'), NOW())
  ON CONFLICT (user_id, LOWER(name), voice_id)
  DO UPDATE SET
    audio_data = decode(p_audio_data, 'base64'),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to upsert user voice recordings with BYTEA support
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

-- ============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS for user_voice_recordings (already enabled)
ALTER TABLE user_voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_voice_recordings
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

-- Note: Other tables can have RLS enabled if needed by uncommenting the ALTER TABLE statements below

-- Enable RLS for name tables (uncomment if you want to enable RLS)
-- ALTER TABLE generated_list ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shortlist ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maybe ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rejected ENABLE ROW LEVEL SECURITY;

-- RLS Policies for name tables (uncomment if RLS is enabled)
-- CREATE POLICY "Users can view own names" ON generated_list FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own names" ON generated_list FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own names" ON generated_list FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own names" ON generated_list FOR DELETE USING (auth.uid() = user_id);

-- Repeat for shortlist, maybe, and rejected tables...

-- Enable RLS for user_preferences (uncomment if you want to enable RLS)
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences (uncomment if RLS is enabled)
-- CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for name_reports (uncomment if you want to enable RLS)
-- ALTER TABLE name_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for name_reports (uncomment if RLS is enabled)
-- CREATE POLICY "Users can view own reports" ON name_reports FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own reports" ON name_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own reports" ON name_reports FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own reports" ON name_reports FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for voice_audio_files (uncomment if you want to enable RLS)
-- ALTER TABLE voice_audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_audio_files (uncomment if RLS is enabled)
-- CREATE POLICY "Users can view their own audio files" ON voice_audio_files FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own audio files" ON voice_audio_files FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own audio files" ON voice_audio_files FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own audio files" ON voice_audio_files FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Your database is now set up with all required tables, indexes, constraints,
-- RPC functions, and RLS policies (where enabled).
-- 
-- Note: RLS is currently enabled only for user_voice_recordings table.
-- To enable RLS for other tables, uncomment the relevant ALTER TABLE and 
-- CREATE POLICY statements above.
-- ============================================================================

