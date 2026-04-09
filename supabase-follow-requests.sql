-- ── Follow requests tabel ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message      text,
  status       text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS follow_requests_to_user_idx ON follow_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS follow_requests_from_user_idx ON follow_requests(from_user_id);

-- ── Follows tabel (na acceptatie) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);

-- ── Premium + open follow instelling op profiles ──────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium     boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_follow    boolean DEFAULT false;
-- open_follow = true → iedereen mag volgen zonder verzoek (Premium feature)

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- follow_requests: iedereen mag sturen, alleen jijzelf mag jouw inbox zien
CREATE POLICY "Eigen verzoeken zien" ON follow_requests FOR SELECT USING (
  auth.uid() = to_user_id OR auth.uid() = from_user_id
);
CREATE POLICY "Verzoek sturen" ON follow_requests FOR INSERT WITH CHECK (
  auth.uid() = from_user_id
);
CREATE POLICY "Status bijwerken" ON follow_requests FOR UPDATE USING (
  auth.uid() = to_user_id
);

-- follows: publiek leesbaar, alleen jijzelf mag jouw volg-relaties aanmaken
CREATE POLICY "Follows lezen" ON follows FOR SELECT USING (true);
CREATE POLICY "Volgen" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Ontvolgen" ON follows FOR DELETE USING (auth.uid() = follower_id);
