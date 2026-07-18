-- PGBattle: Random vs Custom match setup.
-- mode: 'random' (one global difficulty, existing behaviour) or 'custom' (per-question).
-- question_config: when custom, a JSON array — one entry per question:
--   [{ "difficulty": "Easy"|"Medium"|"Hard"|"Any", "hints": <int max hints allowed> }, ...]
ALTER TABLE "PGcode_versus_matches"
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS question_config jsonb;
