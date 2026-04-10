-- ── Sponsored posts tabel ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsored_posts (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name    text NOT NULL,
  business_logo_url text,
  sport_tag        text NOT NULL,  -- 'hardlopen', 'gym', 'fietsen', 'zwemmen', 'yoga', 'voetbal', 'algemeen'
  headline         text NOT NULL,
  description      text NOT NULL,
  image_url        text,
  cta_text         text NOT NULL DEFAULT 'Bekijk meer',
  cta_url          text NOT NULL,
  is_active        boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- Index voor actieve advertenties per sport
CREATE INDEX IF NOT EXISTS sponsored_posts_sport_idx ON sponsored_posts(sport_tag, is_active);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE sponsored_posts ENABLE ROW LEVEL SECURITY;

-- Iedereen mag actieve advertenties lezen (ingelogd)
CREATE POLICY "Actieve advertenties lezen" ON sponsored_posts
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- ── Testdata ──────────────────────────────────────────────────────────────────
INSERT INTO sponsored_posts (business_name, sport_tag, headline, description, image_url, cta_text, cta_url, is_active)
VALUES
  (
    'RunShop Amsterdam',
    'hardlopen',
    'Nieuwe hardloopschoenen nodig?',
    'Gratis verzending op alle schoenen boven €75. Speciaal voor Buddys gebruikers.',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'Bekijk aanbod',
    'https://runshop.nl',
    true
  ),
  (
    'FitLife Supplements',
    'gym',
    'Train harder met de juiste voeding',
    'Proteïne shakes en pre-workout speciaal samengesteld voor serieuze sporters.',
    'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80',
    'Shop nu',
    'https://fitlife.nl',
    true
  ),
  (
    'Triathlon Store NL',
    'triathlon',
    'Alles voor jouw Ironman',
    'Wetsuits, fietshelmen en loopschoenen — alles op één plek.',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    'Ontdek meer',
    'https://triathlonstore.nl',
    true
  );
