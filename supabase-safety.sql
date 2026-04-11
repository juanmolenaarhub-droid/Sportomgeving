-- ══════════════════════════════════════════════════════════════
-- SAFETY FEATURES: blocked_users · reports · deleted_conversations
-- Voer dit script uit in de Supabase SQL editor
-- ══════════════════════════════════════════════════════════════

-- ── 1. Geblokkeerde gebruikers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON blocked_users(blocked_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blokkeer lezen eigen rijen" ON blocked_users;
DROP POLICY IF EXISTS "Blokkeer invoegen" ON blocked_users;
DROP POLICY IF EXISTS "Blokkeer verwijderen eigen rijen" ON blocked_users;

CREATE POLICY "Blokkeer lezen eigen rijen" ON blocked_users
  FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "Blokkeer invoegen" ON blocked_users
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Blokkeer verwijderen eigen rijen" ON blocked_users
  FOR DELETE USING (blocker_id = auth.uid());


-- ── 2. Rapporten ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id  uuid REFERENCES follow_requests(id) ON DELETE SET NULL,
  category         text NOT NULL,
  description      text,
  status           text DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  admin_note       text,
  created_at       timestamptz DEFAULT now(),
  resolved_at      timestamptz,
  resolved_by      uuid REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS reports_reported_idx ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx   ON reports(status);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON reports(reporter_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rapport invoegen" ON reports;
DROP POLICY IF EXISTS "Rapport lezen eigen" ON reports;

CREATE POLICY "Rapport invoegen" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Rapport lezen eigen" ON reports
  FOR SELECT USING (reporter_id = auth.uid());


-- ── 3. Rapport teller + is_active op profiles ─────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active    boolean DEFAULT true;

-- Trigger: verhoog report_count bij elk nieuw rapport
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET report_count = report_count + 1
  WHERE id = NEW.reported_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_report ON reports;
CREATE TRIGGER on_new_report
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION increment_report_count();


-- ── 4. Soft delete van conversaties ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deleted_conversations (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  deleted_at      timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS deleted_conv_user_idx ON deleted_conversations(user_id);
CREATE INDEX IF NOT EXISTS deleted_conv_conv_idx ON deleted_conversations(conversation_id);

ALTER TABLE deleted_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verwijdering invoegen" ON deleted_conversations;
DROP POLICY IF EXISTS "Verwijdering lezen eigen" ON deleted_conversations;

CREATE POLICY "Verwijdering invoegen" ON deleted_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Verwijdering lezen eigen" ON deleted_conversations
  FOR SELECT USING (user_id = auth.uid());
