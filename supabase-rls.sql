-- ============================================================
-- ROW LEVEL SECURITY voor Buddy Platform
-- Voer dit uit in Supabase → SQL Editor
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Iedereen mag profielen lezen (publiek platform)
CREATE POLICY "Profielen zijn publiek leesbaar"
  ON profiles FOR SELECT USING (true);

-- Alleen jijzelf mag je eigen profiel aanpassen
CREATE POLICY "Gebruiker mag eigen profiel updaten"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Supabase maakt automatisch een profiel aan bij registratie
CREATE POLICY "Gebruiker mag eigen profiel aanmaken"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- ── USER_SPORTS ───────────────────────────────────────────
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;

-- Iedereen mag sporten van gebruikers lezen
CREATE POLICY "User sports zijn publiek leesbaar"
  ON user_sports FOR SELECT USING (true);

-- Alleen jijzelf mag je eigen sporten beheren
CREATE POLICY "Gebruiker mag eigen sporten toevoegen"
  ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen sporten updaten"
  ON user_sports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen sporten verwijderen"
  ON user_sports FOR DELETE USING (auth.uid() = user_id);


-- ── POSTS ────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Iedereen mag posts lezen
CREATE POLICY "Posts zijn publiek leesbaar"
  ON posts FOR SELECT USING (true);

-- Alleen jijzelf mag posts aanmaken
CREATE POLICY "Gebruiker mag eigen posts aanmaken"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alleen jijzelf mag je eigen posts aanpassen of verwijderen
CREATE POLICY "Gebruiker mag eigen posts updaten"
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag eigen posts verwijderen"
  ON posts FOR DELETE USING (auth.uid() = user_id);


-- ── FOLLOWS ──────────────────────────────────────────────
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows zijn publiek leesbaar"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag zelf iemand volgen"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Gebruiker mag zelf unfollowen"
  ON follows FOR DELETE USING (auth.uid() = follower_id);


-- ── GROUPS ───────────────────────────────────────────────
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groepen zijn publiek leesbaar"
  ON groups FOR SELECT USING (true);

CREATE POLICY "Ingelogde gebruikers mogen groepen aanmaken"
  ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Alleen maker mag groep aanpassen"
  ON groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Alleen maker mag groep verwijderen"
  ON groups FOR DELETE USING (auth.uid() = created_by);


-- ── GROUP_MEMBERS ─────────────────────────────────────────
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groepsleden zijn publiek leesbaar"
  ON group_members FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag zichzelf toevoegen aan groep"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker mag zichzelf verwijderen uit groep"
  ON group_members FOR DELETE USING (auth.uid() = user_id);


-- ── CONVERSATIONS ─────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Alleen deelnemers mogen het gesprek zien
CREATE POLICY "Alleen deelnemers mogen gesprek zien"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Ingelogde gebruikers mogen gesprek starten"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id);


-- ── MESSAGES ─────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Alleen deelnemers van het gesprek mogen berichten lezen
CREATE POLICY "Alleen deelnemers mogen berichten lezen"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Deelnemer mag bericht sturen"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT user1_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM conversations WHERE id = conversation_id
    )
  );


-- ── STORAGE BUCKET POLICIES ──────────────────────────────
-- Zorg dat de 'avatars' bucket bestaat in Supabase Storage

-- Iedereen mag avatars/banners bekijken (publieke profielfotos)
CREATE POLICY "Avatars zijn publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Gebruiker mag alleen uploaden naar zijn eigen map
CREATE POLICY "Gebruiker mag alleen eigen bestanden uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Gebruiker mag alleen zijn eigen bestanden overschrijven
CREATE POLICY "Gebruiker mag alleen eigen bestanden updaten"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Gebruiker mag alleen zijn eigen bestanden verwijderen
CREATE POLICY "Gebruiker mag alleen eigen bestanden verwijderen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
