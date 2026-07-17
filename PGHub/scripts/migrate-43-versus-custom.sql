-- PGBattle customization: per-player language, multi-question races, and a win mode.
-- Backwards compatible — existing single-language / single-question matches keep working
-- (host_language falls back to `language`, num_questions defaults to 1).
ALTER TABLE public."PGcode_versus_matches"
  ADD COLUMN IF NOT EXISTS host_language TEXT,
  ADD COLUMN IF NOT EXISTS guest_language TEXT,
  ADD COLUMN IF NOT EXISTS num_questions INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS problem_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS host_solved JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guest_solved JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS win_mode TEXT NOT NULL DEFAULT 'first';
