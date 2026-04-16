-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY COMPLETE — veilig opnieuw uitvoerbaar (idempotent)
-- Plak dit in één keer in Supabase SQL Editor en klik Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. NIEUWE TABELLEN ───────────────────────────────────────────────────────

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
  deadline        timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avg_requests_user   ON avg_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_avg_requests_status ON avg_requests (status);

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

-- ─── 2. HELPER FUNCTIES ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN auth.uid()::text = current_setting('app.admin_user_id', true);
END;
$$;

CREATE OR REPLACE FUNCTION is_blocked_by_or_blocking(other_user uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = other_user)
       OR (blocker_id = other_user AND blocked_id = auth.uid())
  );
END;
$$;

CREATE OR REPLACE FUNCTION set_avg_deadline()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.deadline := NEW.created_at + interval '30 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS avg_requests_set_deadline ON avg_requests;
CREATE TRIGGER avg_requests_set_deadline
  BEFORE INSERT ON avg_requests
  FOR EACH ROW EXECUTE FUNCTION set_avg_deadline();

CREATE OR REPLACE FUNCTION check_follow_request_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM follow_requests
    WHERE from_user_id = NEW.from_user_id
      AND created_at > now() - interval '24 hours'
  ) >= 20 THEN
    INSERT INTO security_events (user_id, event_type, metadata)
    VALUES (NEW.from_user_id, 'rate_limit_exceeded',
            jsonb_build_object('type', 'follow_request', 'timestamp', now()));
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_follow_request_rate_limit ON follow_requests;
CREATE TRIGGER enforce_follow_request_rate_limit
  BEFORE INSERT ON follow_requests
  FOR EACH ROW EXECUTE FUNCTION check_follow_request_rate_limit();

-- ─── 3. RLS AANZETTEN ─────────────────────────────────────────────────────────

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE avg_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts           ENABLE ROW LEVEL SECURITY;

-- ─── 4. POLICIES ─────────────────────────────────────────────────────────────

-- security_events
DROP POLICY IF EXISTS "security_events_admin_only" ON security_events;
CREATE POLICY "security_events_admin_only" ON security_events
  FOR ALL TO authenticated
  USING (is_admin());

-- avg_requests
DROP POLICY IF EXISTS "avg_requests_own_insert" ON avg_requests;
DROP POLICY IF EXISTS "avg_requests_admin_all"  ON avg_requests;
CREATE POLICY "avg_requests_own_insert" ON avg_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "avg_requests_admin_all" ON avg_requests
  FOR ALL TO authenticated
  USING (is_admin());

-- upload_log
DROP POLICY IF EXISTS "upload_log_admin_only" ON upload_log;
DROP POLICY IF EXISTS "upload_log_own_insert" ON upload_log;
CREATE POLICY "upload_log_admin_only" ON upload_log
  FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY "upload_log_own_insert" ON upload_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- reports
DROP POLICY IF EXISTS "reports_insert"       ON reports;
DROP POLICY IF EXISTS "reports_own_read"     ON reports;
DROP POLICY IF EXISTS "reports_admin_update" ON reports;
CREATE POLICY "reports_insert" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_own_read" ON reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR is_admin());
CREATE POLICY "reports_admin_update" ON reports
  FOR UPDATE TO authenticated
  USING (is_admin());

-- profiles
DROP POLICY IF EXISTS "profiles_public_read"          ON profiles;
DROP POLICY IF EXISTS "profiles_select"               ON profiles;
DROP POLICY IF EXISTS "profiles_read_authenticated"   ON profiles;
DROP POLICY IF EXISTS "profiles_own_write"            ON profiles;

CREATE POLICY "profiles_read_authenticated" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      is_active = true
      AND is_searchable = true
      AND NOT is_blocked_by_or_blocking(id)
    )
  );

CREATE POLICY "profiles_own_write" ON profiles
  FOR ALL TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- posts
DROP POLICY IF EXISTS "posts_select"          ON posts;
DROP POLICY IF EXISTS "posts_buddies_and_own" ON posts;
DROP POLICY IF EXISTS "posts_own_write"       ON posts;
DROP POLICY IF EXISTS "posts_own_delete"      ON posts;

CREATE POLICY "posts_buddies_and_own" ON posts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM matches
        WHERE status = 'accepted'
          AND (
            (from_user_id = auth.uid() AND to_user_id = posts.user_id)
            OR (to_user_id = auth.uid() AND from_user_id = posts.user_id)
          )
      )
      AND NOT is_blocked_by_or_blocking(user_id)
    )
  );

CREATE POLICY "posts_own_write" ON posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_own_delete" ON posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- follow_requests
DROP POLICY IF EXISTS "follow_requests_insert" ON follow_requests;
DROP POLICY IF EXISTS "follow_requests_send"   ON follow_requests;
CREATE POLICY "follow_requests_send" ON follow_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND NOT is_blocked_by_or_blocking(to_user_id)
  );

