-- ── Chat berichten tabel ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL,  -- = follow_request id
  sender_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_conv_idx ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON chat_messages(sender_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Alleen deelnemers van de match mogen lezen
CREATE POLICY "Chat lezen" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM follow_requests
      WHERE follow_requests.id = conversation_id
        AND (follow_requests.from_user_id = auth.uid() OR follow_requests.to_user_id = auth.uid())
        AND follow_requests.status = 'accepted'
    )
  );

-- Alleen de afzender mag sturen, en alleen in een geaccepteerde match
CREATE POLICY "Chat sturen" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM follow_requests
      WHERE follow_requests.id = conversation_id
        AND (follow_requests.from_user_id = auth.uid() OR follow_requests.to_user_id = auth.uid())
        AND follow_requests.status = 'accepted'
    )
  );

-- Realtime inschakelen voor live updates
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
