-- ============================================================
-- ROW LEVEL SECURITY - Buddy Platform
-- Voer dit uit in Supabase → SQL Editor
-- Veilig om meerdere keren uit te voeren
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profielen zijn publiek leesbaar" ON profiles;
DROP POLICY IF EXISTS "Gebruiker mag eigen profiel updaten" ON profiles;
DROP POLICY IF EXISTS "Gebruiker mag eigen profiel aanmaken" ON profiles;

CREATE POLICY "Profielen zijn publiek leesbaar"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag eigen profiel updaten"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Gebruiker mag eigen profiel aanmaken"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ── USER_SPORTS ───────────────────────────────────────────
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User sports zijn publiek leesbaar" ON user_sports;
DROP POLICY IF EXISTS "Gebruiker mag eigen sporten toevoegen" ON user_sports;
DROP POLICY IF EXISTS "Gebruiker mag eigen sporten updaten" ON user_sports;
DROP POLICY IF EXISTS "Gebruiker mag eigen sporten verwijderen" ON user_sports;

CREATE POLICY "User sports zijn publiek leesbaar"
  ON user_sports FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag eigen sporten toevoegen"
  ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen sporten updaten"
  ON user_sports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen sporten verwijderen"
  ON user_sports FOR DELETE USING (auth.uid() = user_id);


-- ── STORAGE BUCKET POLICIES ──────────────────────────────
DROP POLICY IF EXISTS "Avatars zijn publiek leesbaar" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden uploaden" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden updaten" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden verwijderen" ON storage.objects;

CREATE POLICY "Avatars zijn publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Gebruiker mag alleen eigen bestanden uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Gebruiker mag alleen eigen bestanden updaten"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Gebruiker mag alleen eigen bestanden verwijderen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
