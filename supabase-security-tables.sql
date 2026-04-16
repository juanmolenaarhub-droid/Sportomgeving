-- ─── TAAK 2: Nieuwe beveiligingstabellen ──────────────────────────────────────
-- Voer dit EERST uit (voor de RLS migration), want de trigger verwijst naar security_events.

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  event_type    text        NOT NULL CHECK (event_type IN (
    'rate_limit_exceeded', 'login_failed', 'login_success',
    'password_changed', 'email_changed', 'account_deleted',
    'suspicious_upload', 'blocked_user', 'report_submitted',
    'admin_action', 'session_revoked', 'avg_request'
  )),
  metadata      jsonb       DEFAULT '{}',
  ip_address    text,
  user_agent    text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user    ON security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type    ON security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events (created_at DESC);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "security_events_admin_only" ON security_events;
CREATE POLICY "security_events_admin_only" ON security_events
  FOR ALL TO authenticated
  USING (auth.uid()::text = current_setting('app.admin_user_id', true));

-- AVG/GDPR verzoeken
CREATE TABLE IF NOT EXISTS avg_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  user_email      text        NOT NULL,
  request_type    text        NOT NULL CHECK (request_type IN (
    'inzage', 'correctie', 'verwijdering', 'overdracht', 'bezwaar'
  )),
  status          text        DEFAULT 'open' CHECK (status IN ('open', 'in_behandeling', 'afgehandeld')),
  request_details text,
  admin_note      text,
  deadline        timestamptz GENERATED ALWAYS AS (created_at + interval '30 days') STORED,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avg_requests_user   ON avg_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_avg_requests_status ON avg_requests (status);

ALTER TABLE avg_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avg_requests_own_insert" ON avg_requests;
DROP POLICY IF EXISTS "avg_requests_admin_all"  ON avg_requests;
CREATE POLICY "avg_requests_own_insert" ON avg_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "avg_requests_admin_all" ON avg_requests
  FOR ALL TO authenticated
  USING (auth.uid()::text = current_setting('app.admin_user_id', true));

-- Upload log
CREATE TABLE IF NOT EXISTS upload_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  file_name         text        NOT NULL,
  file_type         text        NOT NULL,
  file_size_bytes   bigint      NOT NULL,
  bucket            text        NOT NULL,
  storage_path      text        NOT NULL,
  upload_status     text        DEFAULT 'success' CHECK (upload_status IN ('success', 'blocked', 'failed')),
  block_reason      text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upload_log_user    ON upload_log (user_id);
CREATE INDEX IF NOT EXISTS idx_upload_log_status  ON upload_log (upload_status);
CREATE INDEX IF NOT EXISTS idx_upload_log_created ON upload_log (created_at DESC);

ALTER TABLE upload_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upload_log_admin_only"  ON upload_log;
DROP POLICY IF EXISTS "upload_log_own_insert"  ON upload_log;
CREATE POLICY "upload_log_admin_only" ON upload_log
  FOR SELECT TO authenticated
  USING (auth.uid()::text = current_setting('app.admin_user_id', true));
CREATE POLICY "upload_log_own_insert" ON upload_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Zorg dat reports tabel de juiste RLS heeft (bestaat al via supabase-safety.sql)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_insert"       ON reports;
DROP POLICY IF EXISTS "reports_own_read"     ON reports;
DROP POLICY IF EXISTS "reports_admin_update" ON reports;
CREATE POLICY "reports_insert" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_own_read" ON reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR auth.uid()::text = current_setting('app.admin_user_id', true)
  );
CREATE POLICY "reports_admin_update" ON reports
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = current_setting('app.admin_user_id', true));
