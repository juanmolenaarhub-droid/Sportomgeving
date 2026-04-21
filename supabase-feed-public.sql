-- Maak alle posts leesbaar voor ingelogde gebruikers (public feed)
-- Vervangt de oude "buddies only" select policy

DROP POLICY IF EXISTS "posts_buddies_and_own"  ON posts;
DROP POLICY IF EXISTS "posts_select"           ON posts;
DROP POLICY IF EXISTS "Posts zijn zichtbaar"   ON posts;
DROP POLICY IF EXISTS "Post lezen"             ON posts;

CREATE POLICY "posts_public_read" ON posts
  FOR SELECT TO authenticated
  USING (true);
