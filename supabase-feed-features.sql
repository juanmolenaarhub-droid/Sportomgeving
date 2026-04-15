-- ─── Feed features migration ──────────────────────────────────────────────────
-- Run this in the Supabase SQL editor

-- 1. account_type op profiles (open = zichtbaar in discovery, private = alleen voor buddies)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'open'
  CHECK (account_type IN ('open', 'private'));

-- 2. target_type / target_id op system_notifications voor deep linking
ALTER TABLE system_notifications
  ADD COLUMN IF NOT EXISTS target_type text,   -- 'post' | 'comment' | 'buddy_request' | 'meetup' | 'group'
  ADD COLUMN IF NOT EXISTS target_id   text;   -- UUID van het doelitem

-- 3. Zorg dat bestaande notifications een fallback-waarde hebben
UPDATE system_notifications
SET target_type = CASE
  WHEN type ILIKE '%meetup%'                                  THEN 'meetup'
  WHEN type ILIKE '%buddy%' OR type ILIKE '%request%'         THEN 'buddy_request'
  WHEN type ILIKE '%message%' OR type ILIKE '%chat%'          THEN 'message'
  WHEN type ILIKE '%like%' OR type ILIKE '%comment%' OR type ILIKE '%post%' THEN 'post'
  ELSE NULL
END
WHERE target_type IS NULL;

-- 4. Index voor snelle discovery-feed query
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_posts_user_created    ON posts(user_id, created_at DESC);
