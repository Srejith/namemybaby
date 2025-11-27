-- Migration to add user_name and partner_name columns to user_preferences table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.user_name IS 'The name of the user (parent)';
COMMENT ON COLUMN user_preferences.partner_name IS 'The name of the user''s partner (parent)';

