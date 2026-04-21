-- ══════════════════════════════════════════════════════════════════════
-- 30 seed video posts voor de Play pagina
-- Vereist: supabase-seed-accounts.sql moet al uitgevoerd zijn
--
-- Verwijderen:
--   DELETE FROM posts WHERE content LIKE '%[SEED_PLAY]%';
-- ══════════════════════════════════════════════════════════════════════

-- Seed-gebruikers geordend op username (a-z):
--  rn=1  amberschulte   Fietsen
--  rn=2  annadeboer     Yoga
--  rn=3  brampeters     Futsal
--  rn=4  casbos         Yoga
--  rn=5  daanvisser     Fietsen
--  rn=6  emmadvries     Hardlopen
--  rn=7  finndekker     Zwemmen
--  rn=8  fleurmulder    Padel
--  rn=9  irisbrouwer    Tennis
--  rn=10 jessevl        Voetbal
--  rn=11 joepvermeer    Voetbal
--  rn=12 juliavdijk     Tennis
--  rn=13 larsvdberg     Tennis
--  rn=14 lisasmit       Zwemmen
--  rn=15 lottevdlaan    Gym
--  rn=16 maxvdh         Futsal
--  rn=17 milawolff      Padel
--  rn=18 nielsjansen    Voetbal
--  rn=19 noordegroot    Fietsen
--  rn=20 rosamaas       Zwemmen
--  rn=21 rubenlam       Hardlopen
--  rn=22 sanderh        Hardlopen
--  rn=23 sophiebakker   Padel
--  rn=24 timodijkstra   Gym
--  rn=25 tommeijer      Gym

WITH su AS (
  SELECT id, row_number() OVER (ORDER BY username) AS rn
  FROM profiles
  WHERE bio LIKE '%[SEED_TEST]%'
)
INSERT INTO posts (
  id, user_id, content,
  sport_tag, sport_tags,
  media_url, media_type, media_items, thumbnail_url,
  likes_count, comments_count, view_count,
  location, created_at
)
VALUES

-- ── 1. amberschulte – Fietsen ────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=1),
 'Ochtendrit Amsterdam Bos 🚴‍♀️ 45km gedaan! Heerlijk uitwaaien voor de drukke week. [SEED_PLAY]',
 'Fietsen', ARRAY['Fietsen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 312, 22, 6240, 'Amsterdam', NOW() - INTERVAL '1 hour'),

-- ── 2. annadeboer – Yoga ────────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=2),
 'Morning flow afgemaakt ✨ 30 min yoga = de beste start van de dag. Wie doet mee? [SEED_PLAY]',
 'Yoga', ARRAY['Yoga'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 187, 14, 3820, 'Amsterdam', NOW() - INTERVAL '2 hours'),

-- ── 3. brampeters – Futsal ──────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=3),
 'Training met de jongens 🔥 nieuwe combo''s geoefend, weekend klaar! [SEED_PLAY]',
 'Futsal', ARRAY['Futsal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 445, 31, 8900, 'Rotterdam', NOW() - INTERVAL '3 hours'),

-- ── 4. casbos – Yoga ────────────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=4),
 'Pranayama sessie voor wedstrijddag 🧘‍♂️ even tot rust komen werkt echt. [SEED_PLAY]',
 'Yoga', ARRAY['Yoga'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 134, 11, 2610, 'Amsterdam', NOW() - INTERVAL '4 hours'),

-- ── 5. daanvisser – Fietsen ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=5),
 'Klim naar Amerongen gedaan 🚴‍♂️ benen doen het zwaar maar het hoofd is blij! [SEED_PLAY]',
 'Fietsen', ARRAY['Fietsen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 278, 19, 5540, 'Utrecht', NOW() - INTERVAL '5 hours'),

-- ── 6. emmadvries – Hardlopen ───────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=6),
 '10k PR gebroken! ⏱️ 48:22 🏃‍♀️ 3 maanden trainen betaalt zich eindelijk uit. [SEED_PLAY]',
 'Hardlopen', ARRAY['Hardlopen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 521, 43, 10420, 'Rotterdam', NOW() - INTERVAL '6 hours'),

-- ── 7. finndekker – Zwemmen ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=7),
 'Open water training in de Oosterschelde 💦 water was 14 graden maar prachtig! [SEED_PLAY]',
 'Zwemmen', ARRAY['Zwemmen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 298, 24, 5960, 'Rotterdam', NOW() - INTERVAL '10 hours'),

-- ── 8. fleurmulder – Padel ──────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=8),
 'Padel winst vandaag! 6-3 7-5 🎾 lob en smash eindelijk gelanded. [SEED_PLAY]',
 'Padel', ARRAY['Padel'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 344, 27, 6880, 'Den Haag', NOW() - INTERVAL '14 hours'),

-- ── 9. irisbrouwer – Tennis ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=9),
 'Backhand techniek sessie 🎾 probeer dit al weken, langzaam wordt het beter! [SEED_PLAY]',
 'Tennis', ARRAY['Tennis'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 213, 16, 4260, 'Nijmegen', NOW() - INTERVAL '18 hours'),

-- ── 10. jessevl – Voetbal ───────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=10),
 'Vrije trap doelpunt op training ⚽🎯 niet slecht toch? [SEED_PLAY]',
 'Voetbal', ARRAY['Voetbal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 612, 51, 12240, 'Rotterdam', NOW() - INTERVAL '22 hours'),

-- ── 11. joepvermeer – Voetbal ───────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=11),
 'Dribbel door 4 man heen 😤 klaar voor het echte werk zondag! [SEED_PLAY]',
 'Voetbal', ARRAY['Voetbal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 489, 38, 9780, 'Tilburg', NOW() - INTERVAL '26 hours'),

-- ── 12. juliavdijk – Tennis ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=12),
 'Slice serve oefening 🎾 consistenter dan vorige week, de coach is trots! [SEED_PLAY]',
 'Tennis', ARRAY['Tennis'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 167, 13, 3340, 'Utrecht', NOW() - INTERVAL '30 hours'),

-- ── 13. larsvdberg – Tennis ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=13),
 'Volley training bij het net ⚡ goede trainingspartner maakt echt verschil. [SEED_PLAY]',
 'Tennis', ARRAY['Tennis'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 234, 18, 4680, 'Amsterdam', NOW() - INTERVAL '36 hours'),

-- ── 14. lisasmit – Zwemmen ──────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=14),
 'Crawl techniek na coaching sessie 🏊‍♀️ arm entry veel beter, verschil is enorm! [SEED_PLAY]',
 'Zwemmen', ARRAY['Zwemmen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 145, 11, 2900, 'Eindhoven', NOW() - INTERVAL '48 hours'),

-- ── 15. lottevdlaan – Gym ───────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=15),
 'Deadlift PR vandaag: 120kg ✅ 6 weken core training betaalt zich eindelijk uit! [SEED_PLAY]',
 'Gym', ARRAY['Gym'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 567, 46, 11340, 'Utrecht', NOW() - INTERVAL '54 hours'),

-- ── 16. maxvdh – Futsal ─────────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=16),
 'Zaalvoetbal toernooi dit weekend 🔥 warming-up alvast klaar, the beker moet naar Amsterdam! [SEED_PLAY]',
 'Futsal', ARRAY['Futsal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 198, 15, 3960, 'Amsterdam', NOW() - INTERVAL '60 hours'),

-- ── 17. milawolff – Padel ───────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=17),
 'Padeltraining met coach 🏸 lob en smash uitgebreid geoefend, echt vooruitgang! [SEED_PLAY]',
 'Padel', ARRAY['Padel'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 276, 21, 5520, 'Den Haag', NOW() - INTERVAL '72 hours'),

-- ── 18. nielsjansen – Voetbal ───────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=18),
 'Keeperstraining klaar ⚽ schoten blijven erin houden is vandaag gelukt! [SEED_PLAY]',
 'Voetbal', ARRAY['Voetbal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 321, 25, 6420, 'Utrecht', NOW() - INTERVAL '78 hours'),

-- ── 19. noordegroot – Fietsen ───────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=19),
 'Gran Fondo voorbereiding: 80km solo 🚴‍♀️ hartslag perfect, klaar voor de echte rit! [SEED_PLAY]',
 'Fietsen', ARRAY['Fietsen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 254, 19, 5080, 'Amsterdam', NOW() - INTERVAL '96 hours'),

-- ── 20. rosamaas – Zwemmen ──────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=20),
 'Zwemtechniek analyse 🏊‍♀️ slagfrequentie en slaglengte allebei verbeterd! [SEED_PLAY]',
 'Zwemmen', ARRAY['Zwemmen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 178, 13, 3560, 'Utrecht', NOW() - INTERVAL '120 hours'),

-- ── 21. rubenlam – Hardlopen ────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=21),
 'Intervaltraining klaar! 6x 1km op 4:20/km 🔥 zuur maar gelukt, marathon voorbereiding gaat goed! [SEED_PLAY]',
 'Hardlopen', ARRAY['Hardlopen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 389, 29, 7780, 'Amsterdam', NOW() - INTERVAL '144 hours'),

-- ── 22. sanderh – Hardlopen ─────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=22),
 'Lange duurloop: 25km door de Utrechtse Heuvelrug 🏃‍♂️ benen doen mee, hoofd ook! [SEED_PLAY]',
 'Hardlopen', ARRAY['Hardlopen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 312, 24, 6240, 'Amsterdam', NOW() - INTERVAL '168 hours'),

-- ── 23. sophiebakker – Padel ────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=23),
 'Toernooi Amsterdam Noord, kwartfinale gewonnen! 🏸 door naar de halve finale! [SEED_PLAY]',
 'Padel', ARRAY['Padel'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 445, 35, 8900, 'Den Haag', NOW() - INTERVAL '192 hours'),

-- ── 24. timodijkstra – Gym ──────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=24),
 'Pull day klaar 💪 bent rows, lat pulldown en bicep curl combo. Groningen gym crew weet het! [SEED_PLAY]',
 'Gym', ARRAY['Gym'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 234, 17, 4680, 'Groningen', NOW() - INTERVAL '216 hours'),

-- ── 25. tommeijer – Gym ─────────────────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=25),
 'Leg day recovery 🦵 foam roll sessie + eiwitshake, morgen weer vol gas! [SEED_PLAY]',
 'Gym', ARRAY['Gym'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 167, 12, 3340, 'Groningen', NOW() - INTERVAL '228 hours'),

-- ── 26. irisbrouwer – Tennis (2e post) ──────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=9),
 'Wedstrijd highlights van gisteren 🎾 mijn beste punt van dit jaar, trotse dag! [SEED_PLAY]',
 'Tennis', ARRAY['Tennis'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 289, 22, 5780, 'Nijmegen', NOW() - INTERVAL '240 hours'),

-- ── 27. jessevl – Voetbal (2e post) ─────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=10),
 'Goals compilatie van afgelopen week ⚽ uitgeknepen maar toch gescoord! [SEED_PLAY]',
 'Voetbal', ARRAY['Voetbal'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 534, 42, 10680, 'Rotterdam', NOW() - INTERVAL '252 hours'),

-- ── 28. emmadvries – Hardlopen (2e post) ────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=6),
 'Zonsopgang run ☀️ Rotterdam wakker terwijl ik al 8km gedaan heb, beste gevoel ooit! [SEED_PLAY]',
 'Hardlopen', ARRAY['Hardlopen'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 412, 32, 8240, 'Rotterdam', NOW() - INTERVAL '264 hours'),

-- ── 29. fleurmulder – Padel (2e post) ───────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=8),
 'Mixed doubles met nieuwe buddy 🤝🏸 top koppel gevonden via Buddys, eerste winst meteen! [SEED_PLAY]',
 'Padel', ARRAY['Padel'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 298, 23, 5960, 'Den Haag', NOW() - INTERVAL '288 hours'),

-- ── 30. lottevdlaan – Gym (2e post) ─────────────────────────────────────────
(gen_random_uuid(), (SELECT id FROM su WHERE rn=15),
 'Shoulder press progressie: 6 weken geleden vs vandaag 📈 +12.5kg, het werkt! [SEED_PLAY]',
 'Gym', ARRAY['Gym'],
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'video',
 '[{"url":"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4","type":"video","thumbnail_url":null}]'::jsonb,
 null, 445, 34, 8900, 'Utrecht', NOW() - INTERVAL '312 hours');


-- ══════════════════════════════════════════════════════════════════════
-- VERWIJDEREN (apart uitvoeren als je de seed data wilt weggooien)
-- ══════════════════════════════════════════════════════════════════════
-- DELETE FROM posts WHERE content LIKE '%[SEED_PLAY]%';
