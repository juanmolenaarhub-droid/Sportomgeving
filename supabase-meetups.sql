-- ─────────────────────────────────────────────────────────────────────────────
-- MEETUPS SCHEMA
-- ─────────────────────────────────────────────────────────────────────────────

-- Hoofdtabel
CREATE TABLE IF NOT EXISTS meetups (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        uuid REFERENCES profiles(id) NOT NULL,
  sport             text NOT NULL,
  title             text NOT NULL,
  description       text,
  location_name     text NOT NULL,
  location_address  text,
  latitude          float NOT NULL,
  longitude         float NOT NULL,
  city              text NOT NULL,
  is_spontaneous    boolean DEFAULT false,
  date              date,
  time              time,
  expires_at        timestamptz,
  max_participants  integer DEFAULT 10,
  status            text DEFAULT 'open' CHECK (status IN ('open', 'vol', 'geannuleerd', 'afgerond', 'verlopen')),
  visibility        text DEFAULT 'publiek' CHECK (visibility IN ('publiek', 'alleen_buddies')),
  reminder_sent     boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- Deelnemers
CREATE TABLE IF NOT EXISTS meetup_participants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id   uuid REFERENCES meetups(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles(id) NOT NULL,
  status      text DEFAULT 'interesse' CHECK (status IN ('interesse', 'geaccepteerd', 'geweigerd')),
  message     text,
  joined_at   timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(meetup_id, user_id)
);

-- Berichten
CREATE TABLE IF NOT EXISTS meetup_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id  uuid REFERENCES meetups(id) ON DELETE CASCADE NOT NULL,
  sender_id  uuid REFERENCES profiles(id) NOT NULL,
  content    text NOT NULL,
  is_system  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXEN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meetups_creator      ON meetups(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetups_city         ON meetups(city);
CREATE INDEX IF NOT EXISTS idx_meetups_date         ON meetups(date);
CREATE INDEX IF NOT EXISTS idx_meetups_sport        ON meetups(sport);
CREATE INDEX IF NOT EXISTS idx_meetups_location     ON meetups(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_meetups_status       ON meetups(status);
CREATE INDEX IF NOT EXISTS idx_meetup_participants_meetup ON meetup_participants(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_participants_user   ON meetup_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meetup_messages_meetup     ON meetup_messages(meetup_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_messages ENABLE ROW LEVEL SECURITY;

-- Meetups lezen: publieke meetups voor iedereen, buddy-only meetups alleen voor buddies
CREATE POLICY "meetups_select" ON meetups FOR SELECT USING (
  visibility = 'publiek'
  OR creator_id = auth.uid()
  OR (
    visibility = 'alleen_buddies'
    AND (
      creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM follow_requests
        WHERE status = 'accepted'
          AND (
            (from_user_id = auth.uid() AND to_user_id = creator_id)
            OR (to_user_id = auth.uid() AND from_user_id = creator_id)
          )
      )
    )
  )
);

CREATE POLICY "meetups_insert" ON meetups FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "meetups_update" ON meetups FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "meetups_delete" ON meetups FOR DELETE USING (creator_id = auth.uid());

-- Deelnemers: iedereen mag lezen
CREATE POLICY "participants_select" ON meetup_participants FOR SELECT USING (true);

-- Deelnemer toevoegen: alleen jezelf, met status = 'interesse'
CREATE POLICY "participants_insert" ON meetup_participants FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Update: creator mag status wijzigen, user mag eigen rij bijwerken
CREATE POLICY "participants_update" ON meetup_participants FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM meetups WHERE id = meetup_id AND creator_id = auth.uid())
);

-- Delete: eigen rij verwijderen (verlaten)
CREATE POLICY "participants_delete" ON meetup_participants FOR DELETE USING (user_id = auth.uid());

-- Berichten: alleen geaccepteerde deelnemers + creator
CREATE POLICY "messages_select" ON meetup_messages FOR SELECT USING (
  sender_id = auth.uid()
  OR EXISTS (SELECT 1 FROM meetups WHERE id = meetup_id AND creator_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM meetup_participants
    WHERE meetup_id = meetup_messages.meetup_id
      AND user_id = auth.uid()
      AND status = 'geaccepteerd'
  )
);

CREATE POLICY "messages_insert" ON meetup_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM meetups WHERE id = meetup_id AND creator_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM meetup_participants
      WHERE meetup_id = meetup_messages.meetup_id
        AND user_id = auth.uid()
        AND status = 'geaccepteerd'
    )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE meetup_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE meetup_participants;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTOMATISCH VERLOPEN VAN SPONTANE MEETUPS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_spontaneous_meetups()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE meetups
  SET status = 'verlopen'
  WHERE is_spontaneous = true
    AND expires_at < now()
    AND status NOT IN ('geannuleerd', 'afgerond', 'verlopen');
END;
$$;
