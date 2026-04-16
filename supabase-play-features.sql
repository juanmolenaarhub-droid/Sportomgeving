-- ─── Play page features ──────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor

-- 1. Add sport_tags array column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sport_tags text[] DEFAULT '{}';

-- 2. Add view_count to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- 3. Add media_items for multi-media posts (array of {url, type, thumbnail_url?})
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_items jsonb DEFAULT '[]'::jsonb;

-- 4. Backfill sport_tags from existing sport_tag column
UPDATE posts
SET sport_tags = ARRAY[sport_tag]
WHERE sport_tag IS NOT NULL
  AND (sport_tags IS NULL OR sport_tags = '{}');

-- 5. Backfill media_items from existing media_url (single media → array of 1)
UPDATE posts
SET media_items = jsonb_build_array(
  jsonb_build_object(
    'url',           media_url,
    'type',          COALESCE(media_type, 'image'),
    'thumbnail_url', thumbnail_url
  )
)
WHERE media_url IS NOT NULL
  AND (media_items IS NULL OR media_items = '[]'::jsonb);

-- 6. viewed_posts table (to exclude already-viewed content in Voor jou feed)
CREATE TABLE IF NOT EXISTS viewed_posts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    uuid        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 7. RLS for viewed_posts
ALTER TABLE viewed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own viewed_posts" ON viewed_posts;
CREATE POLICY "Users manage own viewed_posts" ON viewed_posts
  FOR ALL USING (auth.uid() = user_id);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_posts_sport_tags   ON posts USING GIN(sport_tags);
CREATE INDEX IF NOT EXISTS idx_posts_view_count    ON posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_viewed_posts_user   ON viewed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created  ON posts(user_id, created_at DESC);
