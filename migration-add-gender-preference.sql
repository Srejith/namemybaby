-- Migration to add baby_gender column to user_preferences table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS baby_gender TEXT CHECK (baby_gender IN ('Boy', 'Girl', 'I don''t know yet'));

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.baby_gender IS 'The gender of the baby: Boy, Girl, or I don''t know yet';

