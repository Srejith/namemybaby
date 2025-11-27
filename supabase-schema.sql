-- Supabase Database Schema for Name My Baby Application
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Table 1: Generated List
CREATE TABLE IF NOT EXISTS generated_list (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Shortlist
CREATE TABLE IF NOT EXISTS shortlist (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Maybe
CREATE TABLE IF NOT EXISTS maybe (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Rejected
CREATE TABLE IF NOT EXISTS rejected (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique indexes for duplicate prevention (case-insensitive) per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_list_user_name_unique ON generated_list(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlist_user_name_unique ON shortlist(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_maybe_user_name_unique ON maybe(user_id, LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_rejected_user_name_unique ON rejected(user_id, LOWER(name));

-- Create indexes for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_list_user_id ON generated_list(user_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_user_id ON shortlist(user_id);
CREATE INDEX IF NOT EXISTS idx_maybe_user_id ON maybe(user_id);
CREATE INDEX IF NOT EXISTS idx_rejected_user_id ON rejected(user_id);

-- Table 5: User Preferences
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

-- Table 6: Name Reports
CREATE TABLE IF NOT EXISTS name_reports (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for name_reports
CREATE INDEX IF NOT EXISTS idx_name_reports_user_id ON name_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_name_reports_name ON name_reports(user_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_name_reports_created_at ON name_reports(created_at DESC);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE generated_list ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shortlist ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maybe ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rejected ENABLE ROW LEVEL SECURITY;

-- Create policies if using RLS (adjust based on your authentication needs)
-- Example: Allow all operations for authenticated users
-- CREATE POLICY "Allow all operations for authenticated users" ON generated_list
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON shortlist
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON maybe
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON rejected
--   FOR ALL USING (auth.role() = 'authenticated');

-- RLS policies for user_preferences (if RLS is enabled)
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own preferences" ON user_preferences
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own preferences" ON user_preferences
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own preferences" ON user_preferences
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own preferences" ON user_preferences
--   FOR DELETE USING (auth.uid() = user_id);

