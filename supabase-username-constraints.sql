-- ─── Username constraints ─────────────────────────────────────────────────────
-- Run this migration once in Supabase SQL Editor.

-- 1. Unique constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Case-insensitive lookup index
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles (LOWER(username));

-- 3. Format check: 3-30 chars, lowercase letters / digits / underscore / dot
ALTER TABLE profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username ~ '^[a-z0-9_\.]{3,30}$');
