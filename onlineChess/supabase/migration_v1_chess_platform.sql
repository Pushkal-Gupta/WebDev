-- ============================================================
-- Migration v1: Chess Platform — Run in the AUTH Supabase project
-- Project: ykpjmvoyatcrlqyqbgfu (shared pushkalgupta.com auth)
-- ============================================================

-- ─── 1. chess_rooms ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chess_rooms (
  id            text PRIMARY KEY,
  host_id       uuid NOT NULL,
  host_name     text,
  host_color    text DEFAULT 'white',
  guest_id      uuid,
  guest_name    text,
  status        text DEFAULT 'waiting',   -- 'waiting' | 'playing' | 'finished'
  time_control  jsonb,
  current_fen   text DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn           text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE chess_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_all" ON chess_rooms
  FOR SELECT USING (true);

CREATE POLICY "rooms_insert_host" ON chess_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "rooms_update_participant" ON chess_rooms
  FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- ─── 2. chess_games ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chess_games (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Legacy single-player columns (kept for backward compat)
  user_id               uuid,
  color                 text,
  opponent              text,
  pgn                   text,
  timer_data            jsonb,
  -- New: structured result
  result                text,             -- 'white' | 'black' | 'draw'
  result_reason         text,             -- 'checkmate' | 'timeout' | 'resign' | 'stalemate' | 'draw'
  -- New: both players
  white_user_id         uuid,
  black_user_id         uuid,
  white_username        text,
  black_username        text,
  -- New: ratings at time of game
  white_rating          integer,
  black_rating          integer,
  white_rating_change   integer,
  black_rating_change   integer,
  -- New: metadata
  time_control_display  text,
  category              text,             -- 'bullet' | 'blitz' | 'rapid' | 'classical'
  is_rated              boolean DEFAULT false,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_participant" ON chess_games
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = white_user_id OR
    auth.uid() = black_user_id
  );

CREATE POLICY "games_insert_participant" ON chess_games
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() = white_user_id OR
    auth.uid() = black_user_id
  );

-- ─── 3. user_ratings (Glicko-2) ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_ratings (
  user_id       uuid NOT NULL,
  username      text,
  category      text NOT NULL,            -- 'bullet' | 'blitz' | 'rapid' | 'classical'
  rating        integer NOT NULL DEFAULT 1500,
  rd            numeric NOT NULL DEFAULT 350,
  volatility    numeric NOT NULL DEFAULT 0.06,
  games_played  integer NOT NULL DEFAULT 0,
  wins          integer NOT NULL DEFAULT 0,
  losses        integer NOT NULL DEFAULT 0,
  draws         integer NOT NULL DEFAULT 0,
  peak_rating   integer NOT NULL DEFAULT 1500,
  last_game_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, category)
);

ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings (for leaderboards, opponent info)
CREATE POLICY "ratings_select_all" ON user_ratings
  FOR SELECT USING (true);

-- Only the owner can write their own rating
CREATE POLICY "ratings_upsert_own" ON user_ratings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
