-- ── Profiles tabel: zorg dat alle kolommen bestaan ──────────────────────────
-- Veilig om meerdere keren uit te voeren

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name   text,
  ADD COLUMN IF NOT EXISTS username    text,
  ADD COLUMN IF NOT EXISTS region      text,
  ADD COLUMN IF NOT EXISTS age         integer,
  ADD COLUMN IF NOT EXISTS bio         text,
  ADD COLUMN IF NOT EXISTS avatar_url  text,
  ADD COLUMN IF NOT EXISTS banner_url  text,
  ADD COLUMN IF NOT EXISTS gender      text,
  ADD COLUMN IF NOT EXISTS goal        text,
  ADD COLUMN IF NOT EXISTS region_lat  double precision,
  ADD COLUMN IF NOT EXISTS region_lng  double precision;

-- ── Trigger: maak automatisch een profiel aan bij elke nieuwe gebruiker ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Vul ontbrekende profielen op voor bestaande gebruikers ───────────────────
INSERT INTO public.profiles (id, username, full_name)
SELECT
  id,
  raw_user_meta_data->>'username',
  raw_user_meta_data->>'username'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profielen zijn publiek leesbaar" ON profiles;
DROP POLICY IF EXISTS "Gebruiker mag eigen profiel updaten" ON profiles;
DROP POLICY IF EXISTS "Gebruiker mag eigen profiel aanmaken" ON profiles;

CREATE POLICY "Profielen zijn publiek leesbaar"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Gebruiker mag eigen profiel updaten"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Gebruiker mag eigen profiel aanmaken"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
