-- ══════════════════════════════════════════════════════════════
-- POSTS (feed) + GROUPS
-- ══════════════════════════════════════════════════════════════

-- ── 1. Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content          text NOT NULL,
  activity_type    text,           -- 'run','cycle','swim','gym','yoga','football', etc.
  distance_km      numeric,
  duration_minutes integer,
  image_url        text,
  likes_count      integer DEFAULT 0,
  comments_count   integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_user_idx    ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts lezen" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Post aanmaken" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Post verwijderen eigen" ON posts
  FOR DELETE USING (user_id = auth.uid());

-- ── 2. Post likes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Like lezen" ON post_likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Like aanmaken" ON post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Like verwijderen" ON post_likes
  FOR DELETE USING (user_id = auth.uid());

-- Trigger: houd likes_count bij op posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like ON post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- ── 3. Post comments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments lezen" ON post_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Comment aanmaken" ON post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Comment verwijderen eigen" ON post_comments
  FOR DELETE USING (user_id = auth.uid());

-- Trigger: houd comments_count bij
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_comment ON post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Realtime voor posts en comments
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;

-- ── 4. Groups ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  sport        text,
  region       text,
  description  text,
  private      boolean DEFAULT false,
  created_by   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  member_count integer DEFAULT 1,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS groups_sport_idx  ON groups(sport);
CREATE INDEX IF NOT EXISTS groups_region_idx ON groups(region);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groepen lezen" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Groep aanmaken" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Groep bewerken eigen" ON groups
  FOR UPDATE USING (created_by = auth.uid());

-- ── 5. Group members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id   uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role       text DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leden lezen" ON group_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Lid worden" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Lid verlaten" ON group_members
  FOR DELETE USING (user_id = auth.uid());

-- Trigger: houd member_count bij
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_member_change ON group_members;
CREATE TRIGGER on_group_member_change
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
