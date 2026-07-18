-- PGBattle: host-configurable match options.
-- allow_hints: when true, both players may open the problem's hints during the race
-- (default off so a match is a fair no-hints contest unless the host opts in).
ALTER TABLE "PGcode_versus_matches"
  ADD COLUMN IF NOT EXISTS allow_hints boolean NOT NULL DEFAULT false;
