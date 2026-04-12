-- ── Chat features schema — Buddys ────────────────────────────────────────────
-- Veilig om meerdere keren uit te voeren (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ─── 1. Uitbreid chat_messages ────────────────────────────────────────────────
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS image_url    text,
  ADD COLUMN IF NOT EXISTS read_at      timestamptz;

-- ─── 2. Training afspraken ───────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS training_appointments_conv_idx    ON training_appointments(conversation_id);
CREATE INDEX IF NOT EXISTS training_appointments_by_idx      ON training_appointments(proposed_by);
CREATE INDEX IF NOT EXISTS training_appointments_to_idx      ON training_appointments(proposed_to);

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

ALTER PUBLICATION supabase_realtime ADD TABLE training_appointments;

-- ─── 3. Emoji reacties ────────────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Reacties lezen"              ON message_reactions;
DROP POLICY IF EXISTS "Reactie aanmaken"            ON message_reactions;
DROP POLICY IF EXISTS "Eigen reactie verwijderen"   ON message_reactions;

-- Lezen: alleen als je deelnemer bent van de bijbehorende conversatie
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

ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- ─── 4. Supabase Storage bucket voor chat afbeeldingen ───────────────────────
-- Voer dit uit vanuit het Supabase dashboard of via de storage API.
-- Bucket ID: chat-images, public: true

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat afbeeldingen uploaden" ON storage.objects;
DROP POLICY IF EXISTS "Chat afbeeldingen lezen"    ON storage.objects;
DROP POLICY IF EXISTS "Eigen afbeelding verwijderen" ON storage.objects;

CREATE POLICY "Chat afbeeldingen uploaden" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Chat afbeeldingen lezen" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Eigen afbeelding verwijderen" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── 5. last_seen_at staat al in profiles (supabase-admin-schema.sql) ─────────
-- Zorg dat de kolom bestaat voor het geval het admin schema niet is uitgevoerd:
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- RLS policy zodat gebruiker eigen last_seen_at kan updaten
-- (profiles UPDATE policy staat al open voor eigen rij)
