-- ============================================================
-- VERHALEN & REELS TABELLEN — Buddy Platform
-- Voer dit uit in Supabase → SQL Editor
-- ============================================================

-- ── STORIES (Verhalen) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url   text NOT NULL,
  media_type  text NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Index voor snel ophalen van actieve verhalen
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories(expires_at);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verhalen zijn publiek leesbaar (actief)" ON stories;
DROP POLICY IF EXISTS "Gebruiker mag eigen verhaal aanmaken" ON stories;
DROP POLICY IF EXISTS "Gebruiker mag eigen verhaal verwijderen" ON stories;

-- Alleen niet-verlopen verhalen zijn zichtbaar
CREATE POLICY "Verhalen zijn publiek leesbaar (actief)"
  ON stories FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Gebruiker mag eigen verhaal aanmaken"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen verhaal verwijderen"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);


-- ── REELS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url     text NOT NULL,
  thumbnail_url text,
  caption       text,
  sport_tag     text,
  view_count    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index voor sorteren op nieuwste
CREATE INDEX IF NOT EXISTS reels_created_at_idx ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS reels_user_id_idx ON reels(user_id);

-- RLS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reels zijn publiek leesbaar" ON reels;
DROP POLICY IF EXISTS "Gebruiker mag eigen reel aanmaken" ON reels;
DROP POLICY IF EXISTS "Gebruiker mag eigen reel verwijderen" ON reels;
DROP POLICY IF EXISTS "View count mag worden bijgewerkt" ON reels;

CREATE POLICY "Reels zijn publiek leesbaar"
  ON reels FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag eigen reel aanmaken"
  ON reels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen reel verwijderen"
  ON reels FOR DELETE
  USING (auth.uid() = user_id);

-- Iedereen mag view_count ophogen (voor weergaves tellen)
CREATE POLICY "View count mag worden bijgewerkt"
  ON reels FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ── STORAGE BUCKETS ───────────────────────────────────────
-- Maak een 'stories' bucket aan in Supabase Storage (via dashboard)
-- en een 'reels' bucket. Voeg dan onderstaande policies toe:

-- Stories bucket policies
DROP POLICY IF EXISTS "Stories zijn publiek leesbaar" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag eigen story uploaden" ON storage.objects;

CREATE POLICY "Stories zijn publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Gebruiker mag eigen story uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stories' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Reels bucket policies
DROP POLICY IF EXISTS "Reels zijn publiek leesbaar" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag eigen reel uploaden" ON storage.objects;

CREATE POLICY "Reels zijn publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reels');

CREATE POLICY "Gebruiker mag eigen reel uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
