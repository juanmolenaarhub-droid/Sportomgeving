-- ══════════════════════════════════════════════════════════════════
-- POSTS FIX — Voer dit uit in Supabase → SQL Editor
-- Veilig om meerdere keren te draaien (IF NOT EXISTS)
-- Zorgt dat alle kolommen bestaan die PostComposer gebruikt
-- ══════════════════════════════════════════════════════════════════

-- content mag null zijn (voor media-only posts)
ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS type               text DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS sport_tag          text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS location_lat       numeric,
  ADD COLUMN IF NOT EXISTS location_lng       numeric,
  ADD COLUMN IF NOT EXISTS music              text,
  ADD COLUMN IF NOT EXISTS tagged_users       uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility         text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS comments_disabled  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_hidden       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS not_shareable      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_url          text,
  ADD COLUMN IF NOT EXISTS thumbnail_url      text,
  ADD COLUMN IF NOT EXISTS media_type         text DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS activity_name      text,
  ADD COLUMN IF NOT EXISTS calories           integer,
  ADD COLUMN IF NOT EXISTS activity_date      text,
  ADD COLUMN IF NOT EXISTS meetup_id          uuid,
  ADD COLUMN IF NOT EXISTS challenge_name     text,
  ADD COLUMN IF NOT EXISTS challenge_type     text,
  ADD COLUMN IF NOT EXISTS challenge_goal     text,
  ADD COLUMN IF NOT EXISTS challenge_start    text,
  ADD COLUMN IF NOT EXISTS challenge_end      text,
  ADD COLUMN IF NOT EXISTS question           text,
  ADD COLUMN IF NOT EXISTS answer_type        text,
  ADD COLUMN IF NOT EXISTS poll_options       text[],
  ADD COLUMN IF NOT EXISTS poll_duration_days integer,
  ADD COLUMN IF NOT EXISTS anonymous_answers  boolean DEFAULT false;

-- Zorg dat bestaande video-posts correct gelabeld zijn
UPDATE posts
SET media_type = 'video'
WHERE media_url IS NOT NULL
  AND media_type IS NULL
  AND (
    media_url ILIKE '%.mp4'
    OR media_url ILIKE '%.mov'
    OR media_url ILIKE '%.webm'
  );

-- INSERT en UPDATE policies
DROP POLICY IF EXISTS "Post aanmaken" ON posts;
CREATE POLICY "Post aanmaken" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Post bewerken eigen" ON posts;
CREATE POLICY "Post bewerken eigen" ON posts
  FOR UPDATE USING (user_id = auth.uid());

-- post-media storage bucket (publiek)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Post media publiek leesbaar"  ON storage.objects;
DROP POLICY IF EXISTS "Post media uploaden"          ON storage.objects;
DROP POLICY IF EXISTS "Post media updaten"           ON storage.objects;
DROP POLICY IF EXISTS "Post media verwijderen eigen" ON storage.objects;

CREATE POLICY "Post media publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Post media uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Post media updaten"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Post media verwijderen eigen"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
