-- ============================================================
-- Migration v4: Puzzles — Run in the AUTH Supabase project
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- Puzzle bank (populated via import script from Lichess CC0 puzzle DB)
CREATE TABLE IF NOT EXISTS puzzles (
  id        text PRIMARY KEY,
  fen       text NOT NULL,
  moves     text NOT NULL,   -- space-separated UCI moves (e.g. "e2e4 d7d5 e4d5")
  rating    integer NOT NULL,
  themes    text[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS puzzles_rating_idx ON puzzles (rating);

ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "puzzles_public_read" ON puzzles FOR SELECT USING (true);

-- One row per user per puzzle (upsert on re-attempt)
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  user_id    uuid NOT NULL,
  puzzle_id  text NOT NULL REFERENCES puzzles(id),
  solved     boolean NOT NULL,
  time_taken integer,         -- seconds
  attempted_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, puzzle_id)
);

ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "puzzle_attempts_own" ON puzzle_attempts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Per-user puzzle Glicko-2 rating
CREATE TABLE IF NOT EXISTS user_puzzle_ratings (
  user_id     uuid PRIMARY KEY,
  rating      integer DEFAULT 1500,
  rd          numeric DEFAULT 350,
  volatility  numeric DEFAULT 0.06,
  games_played integer DEFAULT 0,
  wins        integer DEFAULT 0,
  losses      integer DEFAULT 0
);

ALTER TABLE user_puzzle_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "puzzle_ratings_select_all" ON user_puzzle_ratings
  FOR SELECT USING (true);

CREATE POLICY "puzzle_ratings_own_write" ON user_puzzle_ratings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
