-- ══════════════════════════════════════════════════════════════════
-- STAP 1: Kolommen aanmaken (run dit eerst)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sport text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal  text;


-- ══════════════════════════════════════════════════════════════════
-- STAP 2: 25 nep-accounts aanmaken (run dit daarna)
-- Verwijderen: DELETE FROM profiles WHERE bio LIKE '%[SEED_TEST]%';
-- ══════════════════════════════════════════════════════════════════

SET session_replication_role = replica;

INSERT INTO public.profiles (id, full_name, username, region, age, gender, sport, goal, bio, avatar_url)
VALUES
  (gen_random_uuid(),'Lars van den Berg',  'larsvdberg',   'Amsterdam', 24,'man',  'Tennis',    'Wedstrijden spelen',        '[SEED_TEST]','https://i.pravatar.cc/300?img=1'),
  (gen_random_uuid(),'Emma de Vries',      'emmadvries',   'Rotterdam', 22,'vrouw','Hardlopen', '10km onder 50 min',         '[SEED_TEST]','https://i.pravatar.cc/300?img=2'),
  (gen_random_uuid(),'Niels Jansen',       'nielsjansen',  'Utrecht',   27,'man',  'Voetbal',   'Fit blijven',               '[SEED_TEST]','https://i.pravatar.cc/300?img=3'),
  (gen_random_uuid(),'Sophie Bakker',      'sophiebakker', 'Den Haag',  21,'vrouw','Padel',     'Toernooi winnen',           '[SEED_TEST]','https://i.pravatar.cc/300?img=4'),
  (gen_random_uuid(),'Daan Visser',        'daanvisser',   'Amsterdam', 29,'man',  'Fietsen',   '100km per week fietsen',    '[SEED_TEST]','https://i.pravatar.cc/300?img=5'),
  (gen_random_uuid(),'Lisa Smit',          'lisasmit',     'Eindhoven', 25,'vrouw','Zwemmen',   '1km open water',            '[SEED_TEST]','https://i.pravatar.cc/300?img=6'),
  (gen_random_uuid(),'Tom Meijer',         'tommeijer',    'Groningen', 23,'man',  'Gym',       'Spiermassa opbouwen',       '[SEED_TEST]','https://i.pravatar.cc/300?img=7'),
  (gen_random_uuid(),'Anna de Boer',       'annadeboer',   'Amsterdam', 26,'vrouw','Yoga',      'Elke dag bewegen',          '[SEED_TEST]','https://i.pravatar.cc/300?img=8'),
  (gen_random_uuid(),'Bram Peters',        'brampeters',   'Rotterdam', 31,'man',  'Futsal',    'Spelen met vrienden',       '[SEED_TEST]','https://i.pravatar.cc/300?img=9'),
  (gen_random_uuid(),'Julia van Dijk',     'juliavdijk',   'Utrecht',   20,'vrouw','Tennis',    'Ranking verbeteren',        '[SEED_TEST]','https://i.pravatar.cc/300?img=10'),
  (gen_random_uuid(),'Sander Hendriks',    'sanderh',      'Amsterdam', 28,'man',  'Hardlopen', 'Marathon finishen',         '[SEED_TEST]','https://i.pravatar.cc/300?img=11'),
  (gen_random_uuid(),'Fleur Mulder',       'fleurmulder',  'Den Haag',  24,'vrouw','Padel',     '3x per week sporten',       '[SEED_TEST]','https://i.pravatar.cc/300?img=12'),
  (gen_random_uuid(),'Joep Vermeer',       'joepvermeer',  'Tilburg',   33,'man',  'Voetbal',   'Recreatief blijven',        '[SEED_TEST]','https://i.pravatar.cc/300?img=13'),
  (gen_random_uuid(),'Noor de Groot',      'noordegroot',  'Amsterdam', 22,'vrouw','Fietsen',   'Meer buiten zijn',          '[SEED_TEST]','https://i.pravatar.cc/300?img=14'),
  (gen_random_uuid(),'Finn Dekker',        'finndekker',   'Rotterdam', 26,'man',  'Zwemmen',   'Sneller worden',            '[SEED_TEST]','https://i.pravatar.cc/300?img=15'),
  (gen_random_uuid(),'Lotte van der Laan', 'lottevdlaan',  'Utrecht',   19,'vrouw','Gym',       'Sterker worden',            '[SEED_TEST]','https://i.pravatar.cc/300?img=16'),
  (gen_random_uuid(),'Cas Bos',            'casbos',       'Amsterdam', 30,'man',  'Yoga',      'Stress verminderen',        '[SEED_TEST]','https://i.pravatar.cc/300?img=17'),
  (gen_random_uuid(),'Iris Brouwer',       'irisbrouwer',  'Nijmegen',  23,'vrouw','Tennis',    'Nieuwe mensen leren kennen','[SEED_TEST]','https://i.pravatar.cc/300?img=18'),
  (gen_random_uuid(),'Ruben Lam',          'rubenlam',     'Amsterdam', 25,'man',  'Hardlopen', 'Afvallen en fit worden',    '[SEED_TEST]','https://i.pravatar.cc/300?img=19'),
  (gen_random_uuid(),'Mila Wolff',         'milawolff',    'Den Haag',  27,'vrouw','Padel',     'Competitief spelen',        '[SEED_TEST]','https://i.pravatar.cc/300?img=20'),
  (gen_random_uuid(),'Jesse van Leeuwen',  'jessevl',      'Rotterdam', 24,'man',  'Voetbal',   'Plezier maken',             '[SEED_TEST]','https://i.pravatar.cc/300?img=21'),
  (gen_random_uuid(),'Amber Schulte',      'amberschulte', 'Amsterdam', 21,'vrouw','Fietsen',   'Toeren door Nederland',     '[SEED_TEST]','https://i.pravatar.cc/300?img=22'),
  (gen_random_uuid(),'Timo Dijkstra',      'timodijkstra', 'Groningen', 29,'man',  'Gym',       'Bulk fase afmaken',         '[SEED_TEST]','https://i.pravatar.cc/300?img=23'),
  (gen_random_uuid(),'Rosa Maas',          'rosamaas',     'Utrecht',   22,'vrouw','Zwemmen',   'Zwemdiploma A halen',       '[SEED_TEST]','https://i.pravatar.cc/300?img=24'),
  (gen_random_uuid(),'Max van den Heuvel', 'maxvdh',       'Amsterdam', 28,'man',  'Futsal',    'Teamgenoten vinden',        '[SEED_TEST]','https://i.pravatar.cc/300?img=25');

SET session_replication_role = DEFAULT;


-- ══════════════════════════════════════════════════════════════════
-- VERWIJDEREN (apart uitvoeren als je ze wilt weggooien)
-- ══════════════════════════════════════════════════════════════════
-- DELETE FROM profiles WHERE bio LIKE '%[SEED_TEST]%';
