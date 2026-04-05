-- ============================================================
-- Migration v10: Puzzle System Overhaul
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- 1. Add missing columns to puzzles table
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS popularity integer;
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS nb_plays integer;
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS opening_tags text;
ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS rating_deviation integer;

-- 2. GIN index on themes for efficient theme-based queries (WHERE themes @> ARRAY['fork'])
CREATE INDEX IF NOT EXISTS puzzles_themes_gin ON puzzles USING GIN (themes);

-- 3. Index on popularity for daily puzzle selection
CREATE INDEX IF NOT EXISTS puzzles_popularity_idx ON puzzles (popularity DESC NULLS LAST);

-- 4. Deterministic daily puzzle function (same puzzle for all users on same date)
CREATE OR REPLACE FUNCTION get_daily_puzzle(p_date date DEFAULT CURRENT_DATE)
RETURNS SETOF puzzles
LANGUAGE sql STABLE
AS $$
  SELECT p.* FROM puzzles p
  WHERE p.rating BETWEEN 1200 AND 1800
    AND p.popularity > 70
    AND p.nb_plays > 1000
  ORDER BY md5(p.id || p_date::text)
  LIMIT 1;
$$;

-- 5. Extend puzzle_attempts with rating tracking
ALTER TABLE puzzle_attempts ADD COLUMN IF NOT EXISTS rating_change integer;
ALTER TABLE puzzle_attempts ADD COLUMN IF NOT EXISTS puzzle_rating integer;

-- 6. Rating history table for performance chart
CREATE TABLE IF NOT EXISTS puzzle_rating_history (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL,
  rating      integer NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prh_user_time
  ON puzzle_rating_history (user_id, recorded_at DESC);

ALTER TABLE puzzle_rating_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'prh_own' AND tablename = 'puzzle_rating_history') THEN
    EXECUTE 'CREATE POLICY "prh_own" ON puzzle_rating_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 7. Reset puzzle ratings (fresh start with new puzzle database)
TRUNCATE user_puzzle_ratings;
