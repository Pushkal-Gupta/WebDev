-- Streak and monthly badges.
--
-- Until now the achievement catalog has lived only in src/lib/achievements.js
-- (client-side eligibility predicates) with PGcode_user_achievements holding
-- the earned rows per user. This migration introduces a server-side catalog
-- table so badges can be enumerated from SQL and joined against the
-- per-user earned table for queries like leaderboards and public profiles.
--
-- The catalog table is intentionally minimal: ids match the client catalog
-- exactly, so the client remains the source of truth for eligibility logic
-- while the server has a stable list of (id, title, description, category)
-- for relational queries.
--
-- Categories used:
--   solves   — total problem count milestones (first-solve, ten-solves, ...)
--   streak   — consecutive-day-solve streaks (streak-7, -30, -100, -365)
--   monthly  — solve N problems in a named calendar month (monthly-YYYYMM)
--   difficulty / topic / language / contest / curation / discovery / habit
--     — other badges that already existed client-side
--
-- Idempotent: table creation guarded by IF NOT EXISTS, seeds via
-- INSERT ... ON CONFLICT (id) DO UPDATE so re-running this migration
-- corrects any drift in titles / descriptions without duplicating rows.

CREATE TABLE IF NOT EXISTS public."PGcode_achievements" (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'misc',
  icon_name   TEXT,
  color       TEXT DEFAULT 'accent',
  threshold   INTEGER,
  month_key   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgcode_achievements_category
  ON public."PGcode_achievements"(category);

ALTER TABLE public."PGcode_achievements" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_public_read" ON public."PGcode_achievements";
CREATE POLICY "achievements_public_read"
  ON public."PGcode_achievements"
  FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- Streak badges (4 entries).
-- streak-7, streak-30, streak-100, streak-365 are the canonical set.
-- streak-60 already exists in the client catalog and is preserved here.
-- ---------------------------------------------------------------------------

INSERT INTO public."PGcode_achievements"
  (id, name, description, category, icon_name, color, threshold)
VALUES
  ('streak-7',   'Week Streak',    '7-day solve streak.',              'streak', 'Flame', 'hard', 7),
  ('streak-30',  'Month Streak',   '30-day solve streak.',             'streak', 'Flame', 'hard', 30),
  ('streak-60',  'Streak 60',      'Two straight months — 60 days.',   'streak', 'Flame', 'hard', 60),
  ('streak-100', 'Century Streak', '100-day solve streak. Rare air.',  'streak', 'Flame', 'hard', 100),
  ('streak-365', 'Year Streak',    '365-day solve streak. A full year of showing up.', 'streak', 'Flame', 'hard', 365)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      icon_name = EXCLUDED.icon_name,
      color = EXCLUDED.color,
      threshold = EXCLUDED.threshold;

-- ---------------------------------------------------------------------------
-- Monthly challenge badges — last 6 months plus the current month.
-- id format: monthly-YYYYMM. Threshold: 30 solves in the named month.
-- month_key stores the YYYYMM stamp so the client can match a badge to a
-- given calendar month without parsing the id string.
--
-- This block is fully idempotent — the WITH clause generates rows for
-- (today - 6 months) through (today) and INSERT...ON CONFLICT handles
-- repeated runs. Going forward, add a new month each cycle by re-running
-- this migration or appending a new row manually.
-- ---------------------------------------------------------------------------

WITH months AS (
  SELECT
    to_char(d, 'YYYYMM') AS yyyymm,
    to_char(d, 'FMMonth YYYY') AS pretty
  FROM generate_series(
    date_trunc('month', NOW()) - INTERVAL '6 months',
    date_trunc('month', NOW()),
    INTERVAL '1 month'
  ) AS d
)
INSERT INTO public."PGcode_achievements"
  (id, name, description, category, icon_name, color, threshold, month_key)
SELECT
  'monthly-' || yyyymm,
  pretty || ' Challenge',
  'Solve 30 problems during ' || pretty || '.',
  'monthly',
  'CalendarDays',
  'accent',
  30,
  yyyymm
FROM months
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      icon_name = EXCLUDED.icon_name,
      color = EXCLUDED.color,
      threshold = EXCLUDED.threshold,
      month_key = EXCLUDED.month_key;
