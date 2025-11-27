-- SQL Query to create user_preferences table in Supabase
-- Run this in your Supabase SQL Editor

-- Table: User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_country TEXT,
  living_country TEXT,
  religion TEXT,
  tone TEXT,
  alphabet_preferences TEXT,
  other_preferences TEXT,
  number_of_names_to_generate INTEGER DEFAULT 5 CHECK (number_of_names_to_generate >= 1 AND number_of_names_to_generate <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_preferences (though user_id is already the primary key)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Optional: Enable Row Level Security (RLS) for additional security
-- Uncomment the following lines if you want to enable RLS:

-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own preferences" ON user_preferences
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own preferences" ON user_preferences
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own preferences" ON user_preferences
--   FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete own preferences" ON user_preferences
--   FOR DELETE USING (auth.uid() = user_id);

