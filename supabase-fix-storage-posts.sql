-- ══════════════════════════════════════════════════════════════
-- Fix: post-media storage + posts INSERT policy
-- Voer dit uit als posts/foto's niet werken
-- ══════════════════════════════════════════════════════════════

-- 1. Zorg dat post-media bucket bestaat en publiek is
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage policies voor post-media (verwijder en hermaak)
DROP POLICY IF EXISTS "Post media publiek leesbaar"    ON storage.objects;
DROP POLICY IF EXISTS "Post media uploaden"            ON storage.objects;
DROP POLICY IF EXISTS "Post media updaten"             ON storage.objects;
DROP POLICY IF EXISTS "Post media verwijderen eigen"   ON storage.objects;

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

-- 3. Zorg dat posts content nullable is (nodig voor foto/media posts)
ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;

-- 4. Voeg sport_tag kolom toe als die ontbreekt (voor display in feed)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sport_tag text;

-- 5. Controleer posts INSERT policy
DROP POLICY IF EXISTS "Post aanmaken" ON posts;
CREATE POLICY "Post aanmaken" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());
