-- Voeg beschikbaarheid kolom toe aan profiles tabel
-- Mogelijke waarden: 'ochtend', 'middag', 'avond', 'weekend'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beschikbaarheid text[] DEFAULT '{}';
