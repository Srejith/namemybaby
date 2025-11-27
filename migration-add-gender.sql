-- Migration: Add gender column to name tables
-- Run this SQL in your Supabase SQL Editor if you already have existing tables

-- Add gender column to generated_list
ALTER TABLE generated_list 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL;

-- Add gender column to shortlist
ALTER TABLE shortlist 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL;

-- Add gender column to maybe
ALTER TABLE maybe 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL;

-- Add gender column to rejected
ALTER TABLE rejected 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Boy', 'Girl')) DEFAULT NULL;