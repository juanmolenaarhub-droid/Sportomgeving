-- ── Admin schema wijzigingen — Buddys ────────────────────────────────────────

-- 1. Uitbreid profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_seen_at        timestamptz,
  ADD COLUMN IF NOT EXISTS is_active           boolean DEFAULT true;

-- 2. Uitbreid matches (tijdstempels voor wachttijd analyse)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS requested_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at   timestamptz;

-- 3. Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type  text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_user_idx      ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_event_idx     ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS activity_log_created_idx   ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Alleen eigen events lezen (admin leest alles via service role)
CREATE POLICY "Eigen activity lezen" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Activity aanmaken" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. System notifications
CREATE TABLE IF NOT EXISTS system_notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message    text NOT NULL,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Iedereen mag actieve meldingen lezen
CREATE POLICY "Actieve meldingen lezen" ON system_notifications
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Alleen service role mag aanmaken (via admin dashboard)
-- INSERT wordt geblokkeerd voor normale users via RLS
-- Als je de admin dashboard INSERT wil laten werken via anon key:
CREATE POLICY "Admin melding aanmaken" ON system_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin melding bijwerken" ON system_notifications
  FOR UPDATE USING (true);
