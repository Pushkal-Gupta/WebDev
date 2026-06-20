-- Phase 3: problem detail overhaul
-- Adds hints, editorial, video URL to problems.
-- Adds rich status taxonomy + denormalized status_changed_at to user_progress.
-- Creates PGcode_user_submissions (every Run/Submit logged).

-- 1. Problem-level content
ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS editorial_md TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS pattern TEXT,
  ADD COLUMN IF NOT EXISTS frequency_score INT DEFAULT 0;

-- 2. Status taxonomy on per-user progress
ALTER TABLE public."PGcode_user_progress"
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('not_started','attempted','solved','mastered','bookmarked','needs_revision')),
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hints_revealed INT DEFAULT 0;

-- Backfill status from existing is_completed/is_starred so the new pill shows real state
UPDATE public."PGcode_user_progress"
   SET status = CASE
     WHEN is_completed THEN 'solved'
     WHEN is_starred  THEN 'bookmarked'
     ELSE 'attempted'
   END,
   status_changed_at = COALESCE(status_changed_at, updated_at, NOW())
 WHERE status IS NULL;

-- 3. Submissions log
CREATE TABLE IF NOT EXISTS public."PGcode_user_submissions" (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_id TEXT NOT NULL,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  verdict TEXT NOT NULL,
  -- "Run" (against shown test cases) or "Submit" (full evaluation)
  kind TEXT NOT NULL DEFAULT 'submit' CHECK (kind IN ('run','submit')),
  cases_passed INT,
  cases_total INT,
  runtime_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_problem
  ON public."PGcode_user_submissions"(user_id, problem_id, created_at DESC);
