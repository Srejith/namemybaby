-- Migration: Add number_of_names_to_generate column to user_preferences table
-- Run this SQL in your Supabase SQL Editor if you already have existing tables

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS number_of_names_to_generate INTEGER DEFAULT 5;

-- Add check constraint to ensure values are between 1 and 10
ALTER TABLE user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_number_of_names_to_generate_check;

ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_number_of_names_to_generate_check 
CHECK (number_of_names_to_generate >= 1 AND number_of_names_to_generate <= 10);
