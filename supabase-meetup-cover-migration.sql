-- Voeg cover_image_url kolom toe aan meetups tabel
ALTER TABLE meetups ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Storage bucket voor meetup covers (run dit in Supabase Studio > Storage als de bucket nog niet bestaat)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('meetup-covers', 'meetup-covers', true)
-- ON CONFLICT DO NOTHING;

-- Storage policy: alleen ingelogde gebruikers mogen uploaden
-- CREATE POLICY "meetup_covers_upload" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'meetup-covers' AND auth.role() = 'authenticated');

-- Storage policy: iedereen mag covers zien (public bucket)
-- CREATE POLICY "meetup_covers_read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'meetup-covers');
