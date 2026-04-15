-- ══════════════════════════════════════════════════════════════════
-- Video + Thumbnail kolommen — run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS media_type    text DEFAULT 'image';

-- Zet bestaande video-posts (media_url eindigt op .mp4/.mov) goed
UPDATE posts
SET media_type = 'video'
WHERE media_url IS NOT NULL
  AND (
    media_url ILIKE '%.mp4'
    OR media_url ILIKE '%.mov'
    OR media_url ILIKE '%.webm'
  );
