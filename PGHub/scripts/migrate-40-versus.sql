-- Versus: real-time 1v1 coding races. A match is a short shareable code; the host
-- creates it, a friend joins via the link, both get the same problem and race to pass
-- every test. Live progress (tests passed, typing) travels over Supabase Realtime
-- broadcast — never persisted, never the code. This table holds the durable match state.
CREATE TABLE IF NOT EXISTS "PGcode_versus_matches" (
  id            text PRIMARY KEY,                 -- short join code, e.g. 7F3K9Q
  status        text NOT NULL DEFAULT 'waiting',  -- waiting | active | finished | abandoned
  difficulty    text,                             -- 'Any' | 'Easy' | 'Medium' | 'Hard'
  language      text NOT NULL DEFAULT 'python',
  time_limit_sec int NOT NULL DEFAULT 1500,
  powerup       text,                             -- selected power-up id (cosmetic edge)
  problem_id    text,                             -- chosen when the match starts
  host_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  host_name     text,
  guest_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name    text,
  host_passed   int DEFAULT 0,
  host_total    int DEFAULT 0,
  guest_passed  int DEFAULT 0,
  guest_total   int DEFAULT 0,
  winner        text,                             -- 'host' | 'guest' | 'draw' | null
  winner_id     uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

CREATE INDEX IF NOT EXISTS versus_status_idx ON "PGcode_versus_matches" (status, created_at DESC);

ALTER TABLE "PGcode_versus_matches" ENABLE ROW LEVEL SECURITY;

-- The join code is the shared secret. Anyone with it (any authenticated user) can read
-- the match to join and can update their own side. Kept simple for the invite model.
DROP POLICY IF EXISTS versus_read ON "PGcode_versus_matches";
CREATE POLICY versus_read ON "PGcode_versus_matches" FOR SELECT USING (true);

DROP POLICY IF EXISTS versus_insert ON "PGcode_versus_matches";
CREATE POLICY versus_insert ON "PGcode_versus_matches" FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS versus_update ON "PGcode_versus_matches";
CREATE POLICY versus_update ON "PGcode_versus_matches" FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id OR guest_id IS NULL)
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);
