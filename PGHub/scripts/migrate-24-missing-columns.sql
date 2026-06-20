-- migrate-24: schema/app drift fixes surfaced by the audit agent.
-- - PGcode_problem_templates was referenced by Workspace.jsx and TRUNCATED in
--   the seed, but never CREATE TABLE'd anywhere.
-- - solution_video_url / follow_up / constraints / topics columns are read by
--   the app but never added by any prior ALTER TABLE.

-- 1. The missing problem templates table (per-language starter code).
CREATE TABLE IF NOT EXISTS public."PGcode_problem_templates" (
  id BIGSERIAL PRIMARY KEY,
  problem_id TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (problem_id, language)
);

CREATE INDEX IF NOT EXISTS idx_problem_templates_problem
  ON public."PGcode_problem_templates"(problem_id);

-- 2. Problem-level columns the UI reads but were never declared.
ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS solution_video_url TEXT,
  ADD COLUMN IF NOT EXISTS follow_up TEXT,
  ADD COLUMN IF NOT EXISTS constraints TEXT,
  ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';
