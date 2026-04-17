-- ─── Music metadata columns voor posts ───────────────────────────────────────
-- Veilig om meerdere keren te draaien (IF NOT EXISTS)

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS music_title  text,
  ADD COLUMN IF NOT EXISTS music_artist text;

-- RLS hoeft NIET aangepast — bestaande post-policies dekken alle kolommen al.
