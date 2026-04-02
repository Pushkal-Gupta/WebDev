-- ============================================================
-- Migration v8: Tournament System (Swiss + Arena)
-- Project: ykpjmvoyatcrlqyqbgfu
-- ============================================================

-- ─── 1. Tournaments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  format        text NOT NULL DEFAULT 'swiss',   -- 'swiss' | 'arena'
  category      text NOT NULL DEFAULT 'blitz',   -- 'bullet'|'blitz'|'rapid'|'classical'
  time_control  jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'upcoming', -- 'upcoming'|'registration'|'active'|'finished'
  num_rounds    integer DEFAULT 5,               -- Swiss only
  current_round integer DEFAULT 0,
  max_players   integer DEFAULT 32,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz,                     -- Arena only (duration)
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_all" ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert_auth" ON tournaments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tournaments_update_creator" ON tournaments
  FOR UPDATE USING (auth.uid() = created_by);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Tournament players (registrations) ───────────────────
CREATE TABLE IF NOT EXISTS tournament_players (
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  username      text NOT NULL,
  seed_rating   integer NOT NULL DEFAULT 1500,
  score         numeric NOT NULL DEFAULT 0,       -- points (1=win, 0.5=draw, 0=loss)
  buchholz      numeric NOT NULL DEFAULT 0,       -- tiebreak: sum of opponents' scores
  wins          integer NOT NULL DEFAULT 0,
  losses        integer NOT NULL DEFAULT 0,
  draws         integer NOT NULL DEFAULT 0,
  has_bye       boolean NOT NULL DEFAULT false,
  withdrawn     boolean NOT NULL DEFAULT false,
  joined_at     timestamptz DEFAULT now(),
  PRIMARY KEY (tournament_id, user_id)
);

ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tp_select_all"  ON tournament_players FOR SELECT USING (true);
CREATE POLICY "tp_insert_own"  ON tournament_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_delete_own"  ON tournament_players
  FOR DELETE USING (auth.uid() = user_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tournament_players;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. Tournament pairings ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_pairings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  round         integer NOT NULL,
  white_user_id uuid NOT NULL,
  black_user_id uuid,        -- NULL = bye
  room_id       text,        -- chess_rooms.id once game is created
  result        text,        -- 'white'|'black'|'draw'|'bye'|null (pending)
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE tournament_pairings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pairings_select_all" ON tournament_pairings FOR SELECT USING (true);
CREATE POLICY "pairings_update_auth" ON tournament_pairings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tournament_pairings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_t_status      ON tournaments (status);
CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_players (tournament_id);
CREATE INDEX IF NOT EXISTS idx_pair_tourn    ON tournament_pairings (tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_pair_room     ON tournament_pairings (room_id) WHERE room_id IS NOT NULL;
