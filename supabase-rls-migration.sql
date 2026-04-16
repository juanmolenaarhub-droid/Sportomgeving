-- ─── TAAK 1: RLS policies fixen ───────────────────────────────────────────────
-- Voer dit uit NA supabase-security-tables.sql (trigger verwijst naar security_events).

-- ─── 1a. Helper functies ──────────────────────────────────────────────────────

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

CREATE OR REPLACE FUNCTION check_follow_request_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM follow_requests
    WHERE from_user_id = NEW.from_user_id
      AND created_at > now() - interval '24 hours'
  ) >= 20 THEN
    INSERT INTO security_events (user_id, event_type, metadata)
    VALUES (
      NEW.from_user_id,
      'rate_limit_exceeded',
      jsonb_build_object('type', 'follow_request', 'timestamp', now())
    );
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_follow_request_rate_limit ON follow_requests;
CREATE TRIGGER enforce_follow_request_rate_limit
  BEFORE INSERT ON follow_requests
  FOR EACH ROW EXECUTE FUNCTION check_follow_request_rate_limit();

-- ─── 1b. Publieke profielview ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id, username, full_name, bio, avatar_url, banner_url,
  region, sport, niveau, beschikbaarheid, last_seen_at,
  show_city, show_age, is_searchable, show_in_find,
  show_online_status, is_active, created_at
FROM profiles;
-- phone en birth_date zitten hier NIET in

-- ─── 1c. RLS policies per tabel ──────────────────────────────────────────────

-- PROFILES
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

-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select"       ON posts;
DROP POLICY IF EXISTS "posts_buddies_and_own" ON posts;
DROP POLICY IF EXISTS "posts_own_write"    ON posts;
DROP POLICY IF EXISTS "posts_own_delete"   ON posts;

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
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_own_delete" ON posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_own"    ON notifications;

CREATE POLICY "notifications_own" ON notifications
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- SYSTEM_NOTIFICATIONS — fix ongeldige policies
DROP POLICY IF EXISTS "system_notifications_insert" ON system_notifications;
DROP POLICY IF EXISTS "system_notifications_update" ON system_notifications;
CREATE POLICY "system_notifications_admin_write" ON system_notifications
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ACTIVITY_LOG
DROP POLICY IF EXISTS "activity_log_select"         ON activity_log;
DROP POLICY IF EXISTS "activity_log_own_and_admin"  ON activity_log;

CREATE POLICY "activity_log_own_and_admin" ON activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- FOLLOW_REQUESTS — blokkade check toevoegen
DROP POLICY IF EXISTS "follow_requests_insert"  ON follow_requests;
DROP POLICY IF EXISTS "follow_requests_send"    ON follow_requests;

CREATE POLICY "follow_requests_send" ON follow_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND NOT is_blocked_by_or_blocking(to_user_id)
  );

-- CREATOR tabellen
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_profiles_select" ON creator_profiles;
DROP POLICY IF EXISTS "creator_profiles_own"    ON creator_profiles;
CREATE POLICY "creator_profiles_own" ON creator_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE creator_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_challenges_select" ON creator_challenges;
DROP POLICY IF EXISTS "creator_challenges_own"    ON creator_challenges;
CREATE POLICY "creator_challenges_own" ON creator_challenges
  FOR ALL TO authenticated
  USING (creator_id = auth.uid());
