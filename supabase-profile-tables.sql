-- Voer dit uit in Supabase SQL Editor

-- ── saved_content ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_content (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('photo', 'video', 'post')),
  content_id   TEXT NOT NULL,
  saved_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_saved_content" ON saved_content;
CREATE POLICY "users_own_saved_content" ON saved_content
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_content_user_id_idx ON saved_content(user_id);

-- ── profile_views ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_owner_can_read_views" ON profile_views;
CREATE POLICY "profile_owner_can_read_views" ON profile_views
  FOR SELECT USING (auth.uid() = profile_user_id);

DROP POLICY IF EXISTS "anyone_can_insert_view" ON profile_views;
CREATE POLICY "anyone_can_insert_view" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_user_id);

CREATE INDEX IF NOT EXISTS profile_views_profile_user_id_idx ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS profile_views_viewer_user_id_idx  ON profile_views(viewer_user_id);
