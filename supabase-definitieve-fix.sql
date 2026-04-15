-- ══════════════════════════════════════════════════════════════════
-- DEFINITIEVE FIX — Voer dit uit in Supabase → SQL Editor
-- Veilig om meerdere keren te draaien (IF NOT EXISTS)
-- ══════════════════════════════════════════════════════════════════

-- 1. Posts tabel — alle ontbrekende kolommen toevoegen
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

-- 2. Posts policies
DROP POLICY IF EXISTS "Post aanmaken" ON posts;
CREATE POLICY "Post aanmaken" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Post bewerken eigen" ON posts;
CREATE POLICY "Post bewerken eigen" ON posts
  FOR UPDATE USING (user_id = auth.uid());

-- 3. post-media storage bucket aanmaken + policies
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

-- 4. system_notifications — kolommen voor per-user notificaties
ALTER TABLE system_notifications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type    text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link    text,
  ADD COLUMN IF NOT EXISTS read    boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS system_notifs_user_idx ON system_notifications(user_id);

DROP POLICY IF EXISTS "Eigen notificaties lezen"   ON system_notifications;
DROP POLICY IF EXISTS "Eigen notificaties updaten" ON system_notifications;
DROP POLICY IF EXISTS "Actieve meldingen lezen"    ON system_notifications;

CREATE POLICY "Eigen notificaties lezen" ON system_notifications
  FOR SELECT USING (
    (user_id = auth.uid() AND auth.role() = 'authenticated')
    OR (user_id IS NULL AND auth.role() = 'authenticated')
  );

CREATE POLICY "Eigen notificaties updaten" ON system_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════
-- KLAAR
-- ══════════════════════════════════════════════════════════════════
