-- ── Creator systeem — Buddys ──────────────────────────────────────────────────

-- 1. Uitbreid bestaande profiles tabel
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_creator      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_verified boolean DEFAULT false;

-- 2. Creator profielen
CREATE TABLE IF NOT EXISTS creator_profiles (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status            text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_verified       boolean DEFAULT false,
  creator_category  text NOT NULL CHECK (creator_category IN ('personal_trainer','sport_influencer','coach','athlete','other')),
  bio_creator       text,
  website_url       text,
  instagram_url     text,
  tiktok_url        text,
  youtube_url       text,
  current_reach     integer DEFAULT 0,
  goals             text[],          -- ['challenges','coaching','promotions','community']
  sports            text[],          -- sport namen
  total_followers   integer DEFAULT 0,
  engagement_rate   numeric(5,2) DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

-- 3. Creator challenges
CREATE TABLE IF NOT EXISTS creator_challenges (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id           uuid REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  title                text NOT NULL,
  description          text NOT NULL,
  sport_tag            text NOT NULL,
  price                numeric(8,2) DEFAULT 0,
  duration_days        integer NOT NULL DEFAULT 30,
  max_participants     integer DEFAULT 100,
  current_participants integer DEFAULT 0,
  start_date           date NOT NULL,
  end_date             date,
  is_active            boolean DEFAULT true,
  created_at           timestamptz DEFAULT now()
);

-- 4. Challenge deelnemers
CREATE TABLE IF NOT EXISTS challenge_participants (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id     uuid REFERENCES creator_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at        timestamptz DEFAULT now(),
  completed        boolean DEFAULT false,
  completion_date  timestamptz,
  UNIQUE(challenge_id, user_id)
);

-- 5. Creator analytics (dagelijkse snapshots)
CREATE TABLE IF NOT EXISTS creator_analytics (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id        uuid REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  new_followers     integer DEFAULT 0,
  profile_views     integer DEFAULT 0,
  challenge_signups integer DEFAULT 0,
  total_revenue     numeric(10,2) DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  UNIQUE(creator_id, date)
);

-- ── Indexen ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS creator_profiles_user_idx ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS creator_challenges_creator_idx ON creator_challenges(creator_id, is_active);
CREATE INDEX IF NOT EXISTS challenge_participants_challenge_idx ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS challenge_participants_user_idx ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS creator_analytics_creator_date_idx ON creator_analytics(creator_id, date);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE creator_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_challenges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics     ENABLE ROW LEVEL SECURITY;

-- Creator profiles: iedereen mag lezen, alleen eigenaar mag schrijven
CREATE POLICY "Creator profielen lezen" ON creator_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Creator profiel aanmaken" ON creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creator profiel bijwerken" ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenges: iedereen mag actieve challenges lezen
CREATE POLICY "Actieve challenges lezen" ON creator_challenges
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Creator challenge aanmaken" ON creator_challenges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = creator_id AND user_id = auth.uid())
  );

CREATE POLICY "Creator challenge bijwerken" ON creator_challenges
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = creator_id AND user_id = auth.uid())
  );

-- Challenge deelnemers
CREATE POLICY "Deelnemers lezen" ON challenge_participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Deelnemen aan challenge" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics: alleen eigen creator mag lezen
CREATE POLICY "Creator analytics lezen" ON creator_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = creator_id AND user_id = auth.uid())
  );

-- ── Demo testdata ─────────────────────────────────────────────────────────────
-- Challenges (zonder echte user_id — voor UI preview)
-- Voer dit pas uit nadat je echte creator_profiles hebt aangemaakt
