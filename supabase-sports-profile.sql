-- Add sport column to profiles table
-- Stores the user's primary sport as a display label (e.g. 'Hardlopen')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport text;
