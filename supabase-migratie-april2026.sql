-- ══════════════════════════════════════════════════════════════════
-- BUDDYS — Alles-in-één migratie (April 2026)
-- Voer dit uit in Supabase → SQL Editor
-- Veilig om meerdere keren te draaien (IF NOT EXISTS / IF EXISTS)
-- ══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- 1. POSTS — voeg ontbrekende kolommen toe + maak content nullable
-- ────────────────────────────────────────────────────────────────

ALTER TABLE posts ALTER COLUMN content DROP NOT NULL;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS type               text,
  ADD COLUMN IF NOT EXISTS sport_tag          text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS location_lat       numeric,
  ADD COLUMN IF NOT EXISTS location_lng       numeric,
  ADD COLUMN IF NOT EXISTS music              text,
  ADD COLUMN IF NOT EXISTS tagged_users       uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility         text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS comments_disabled  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_hidden       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS not_shareable      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_url          text,
  -- Activity extras
  ADD COLUMN IF NOT EXISTS activity_name      text,
  ADD COLUMN IF NOT EXISTS calories           integer,
  ADD COLUMN IF NOT EXISTS activity_date      text,
  -- Meetup link
  ADD COLUMN IF NOT EXISTS meetup_id          uuid,
  -- Challenge extras
  ADD COLUMN IF NOT EXISTS challenge_name     text,
  ADD COLUMN IF NOT EXISTS challenge_type     text,
  ADD COLUMN IF NOT EXISTS challenge_goal     text,
  ADD COLUMN IF NOT EXISTS challenge_start    text,
  ADD COLUMN IF NOT EXISTS challenge_end      text,
  -- Question/Poll extras
  ADD COLUMN IF NOT EXISTS question           text,
  ADD COLUMN IF NOT EXISTS answer_type        text,
  ADD COLUMN IF NOT EXISTS poll_options       text[],
  ADD COLUMN IF NOT EXISTS poll_duration_days integer,
  ADD COLUMN IF NOT EXISTS anonymous_answers  boolean DEFAULT false;

-- Voeg UPDATE policy toe (eigen posts bewerken)
DROP POLICY IF EXISTS "Post bewerken eigen" ON posts;
CREATE POLICY "Post bewerken eigen" ON posts
  FOR UPDATE USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 2. FOLLOW_REQUESTS — voeg ontbrekende kolommen toe
-- ────────────────────────────────────────────────────────────────

ALTER TABLE follow_requests
  ADD COLUMN IF NOT EXISTS sport         text,
  ADD COLUMN IF NOT EXISTS accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at   timestamptz;

-- Fix: status CHECK constraint stond 'rejected' toe maar code gebruikt 'declined'
-- Verwijder oude constraint en vervang door nieuwe die beide accepteert
ALTER TABLE follow_requests DROP CONSTRAINT IF EXISTS follow_requests_status_check;
ALTER TABLE follow_requests ADD CONSTRAINT follow_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'declined'));


-- ────────────────────────────────────────────────────────────────
-- 3. MATCHES — tabel bestaat al, voeg ontbrekende kolommen toe
-- ────────────────────────────────────────────────────────────────

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS sport        text,
  ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at  timestamptz;

-- Voeg UNIQUE constraint toe als die nog niet bestaat
-- (nodig voor ON CONFLICT in acceptBuddyRequest)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_from_user_id_to_user_id_key'
      AND conrelid = 'matches'::regclass
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT matches_from_user_id_to_user_id_key
      UNIQUE (from_user_id, to_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS matches_from_idx ON matches(from_user_id);
CREATE INDEX IF NOT EXISTS matches_to_idx   ON matches(to_user_id);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match lezen"    ON matches;
DROP POLICY IF EXISTS "Match aanmaken" ON matches;
DROP POLICY IF EXISTS "Match bijwerken" ON matches;

CREATE POLICY "Match lezen" ON matches
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Match aanmaken" ON matches
  FOR INSERT WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Match bijwerken" ON matches
  FOR UPDATE USING (from_user_id = auth.uid() OR to_user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 4. SYSTEM_NOTIFICATIONS — schema uitbreiden voor per-user notifs
-- ────────────────────────────────────────────────────────────────

ALTER TABLE system_notifications
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type       text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link       text,
  ADD COLUMN IF NOT EXISTS read       boolean DEFAULT false;

-- Index voor efficiënt opvragen per gebruiker
CREATE INDEX IF NOT EXISTS system_notifs_user_idx ON system_notifications(user_id);

-- Ververs RLS: gebruiker mag eigen notificaties lezen
DROP POLICY IF EXISTS "Actieve meldingen lezen" ON system_notifications;
DROP POLICY IF EXISTS "Eigen notificaties lezen" ON system_notifications;

CREATE POLICY "Eigen notificaties lezen" ON system_notifications
  FOR SELECT USING (
    (user_id = auth.uid() AND auth.role() = 'authenticated')
    OR (user_id IS NULL AND is_active = true AND auth.role() = 'authenticated')
  );

-- Gebruiker mag eigen notificaties als gelezen markeren
DROP POLICY IF EXISTS "Eigen notificaties updaten" ON system_notifications;
CREATE POLICY "Eigen notificaties updaten" ON system_notifications
  FOR UPDATE USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────────
-- 5. STORAGE — post-media bucket aanmaken + policies
-- ────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- post-media: lezen is publiek
DROP POLICY IF EXISTS "Post media publiek leesbaar" ON storage.objects;
CREATE POLICY "Post media publiek leesbaar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

-- post-media: uploaden voor authenticated users (in eigen folder)
DROP POLICY IF EXISTS "Post media uploaden" ON storage.objects;
CREATE POLICY "Post media uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media' AND
    auth.role() = 'authenticated'
  );

-- post-media: verwijderen eigen bestanden
DROP POLICY IF EXISTS "Post media verwijderen eigen" ON storage.objects;
CREATE POLICY "Post media verwijderen eigen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );


-- ────────────────────────────────────────────────────────────────
-- 6. STORAGE — avatars bucket policies fixen
--    (pad is 'avatars/userId.ext' of 'banners/userId.ext',
--     dus foldername[1] = 'avatars'/'banners', niet user ID)
-- ────────────────────────────────────────────────────────────────

-- Verwijder oude te-strenge upload policy
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden uploaden" ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden updaten"  ON storage.objects;
DROP POLICY IF EXISTS "Gebruiker mag alleen eigen bestanden verwijderen" ON storage.objects;

-- Nieuwe policy: elke ingelogde user mag uploaden naar avatars bucket
CREATE POLICY "Authenticated kan avatar uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated kan avatar updaten"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated kan avatar verwijderen"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');


-- ────────────────────────────────────────────────────────────────
-- 7. PROFILES — zorg dat beschikbaarheid kolom bestaat
-- ────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beschikbaarheid text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at    timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium      boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_follow     boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active       boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS report_count    integer DEFAULT 0;


-- ────────────────────────────────────────────────────────────────
-- 8. ACTIVITY_LOG — zorg dat tabel bestaat (nodig voor buddy req)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type  text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_user_idx    ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_event_idx   ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigen activity lezen" ON activity_log;
DROP POLICY IF EXISTS "Activity aanmaken"    ON activity_log;

CREATE POLICY "Eigen activity lezen" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Activity aanmaken" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- 9. CHAT — uitbreid chat_messages + afspraken + reacties
-- ────────────────────────────────────────────────────────────────

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS read_at      timestamptz;

CREATE TABLE IF NOT EXISTS training_appointments (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES follow_requests(id) ON DELETE CASCADE,
  proposed_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_to     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport           text,
  location        text,
  proposed_date   timestamptz NOT NULL,
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      timestamptz DEFAULT now(),
  responded_at    timestamptz
);

CREATE INDEX IF NOT EXISTS training_appointments_conv_idx ON training_appointments(conversation_id);
CREATE INDEX IF NOT EXISTS training_appointments_by_idx   ON training_appointments(proposed_by);
CREATE INDEX IF NOT EXISTS training_appointments_to_idx   ON training_appointments(proposed_to);

ALTER TABLE training_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Afspraak deelnemers lezen" ON training_appointments;
DROP POLICY IF EXISTS "Afspraak aanmaken"          ON training_appointments;
DROP POLICY IF EXISTS "Afspraak bijwerken"          ON training_appointments;

CREATE POLICY "Afspraak deelnemers lezen" ON training_appointments
  FOR SELECT USING (auth.uid() = proposed_by OR auth.uid() = proposed_to);
CREATE POLICY "Afspraak aanmaken" ON training_appointments
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);
CREATE POLICY "Afspraak bijwerken" ON training_appointments
  FOR UPDATE USING (auth.uid() = proposed_by OR auth.uid() = proposed_to);

CREATE TABLE IF NOT EXISTS message_reactions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_msg_idx  ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_idx ON message_reactions(user_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reacties lezen"            ON message_reactions;
DROP POLICY IF EXISTS "Reactie aanmaken"          ON message_reactions;
DROP POLICY IF EXISTS "Eigen reactie verwijderen" ON message_reactions;

CREATE POLICY "Reacties lezen" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN follow_requests fr ON fr.id = cm.conversation_id
      WHERE cm.id = message_id
        AND (fr.from_user_id = auth.uid() OR fr.to_user_id = auth.uid())
        AND fr.status = 'accepted'
    )
  );
CREATE POLICY "Reactie aanmaken" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigen reactie verwijderen" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Chat-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat afbeeldingen uploaden"    ON storage.objects;
DROP POLICY IF EXISTS "Chat afbeeldingen lezen"       ON storage.objects;
DROP POLICY IF EXISTS "Eigen afbeelding verwijderen"  ON storage.objects;

CREATE POLICY "Chat afbeeldingen uploaden"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Chat afbeeldingen lezen"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Eigen afbeelding verwijderen"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ════════════════════════════════════════════════════════════════
-- KLAAR — alle tabellen en policies zijn nu up-to-date
-- ════════════════════════════════════════════════════════════════
