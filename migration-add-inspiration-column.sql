-- Migration to add inspiration column to all name tables
-- Run this in your Supabase SQL Editor

ALTER TABLE generated_list
ADD COLUMN IF NOT EXISTS inspiration TEXT;

ALTER TABLE shortlist
ADD COLUMN IF NOT EXISTS inspiration TEXT;

ALTER TABLE maybe
ADD COLUMN IF NOT EXISTS inspiration TEXT;

ALTER TABLE rejected
ADD COLUMN IF NOT EXISTS inspiration TEXT;

-- Add comments for documentation
COMMENT ON COLUMN generated_list.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN shortlist.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN maybe.inspiration IS 'The inspiration or meaning behind the name';
COMMENT ON COLUMN rejected.inspiration IS 'The inspiration or meaning behind the name';

