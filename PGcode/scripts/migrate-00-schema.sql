-- Add missing columns to PGcode_problems for the 200-question expansion
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS visual_state_data JSONB;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_js TEXT;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_python TEXT;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_java TEXT;

-- Interactive dry-run frames (referenced by seed_data.sql and scripts/dryruns_*.sql)
CREATE TABLE IF NOT EXISTS public."PGcode_interactive_dry_runs" (
  id BIGSERIAL PRIMARY KEY,
  problem_id TEXT NOT NULL,
  step_number INT NOT NULL,
  title TEXT,
  visual_state_data JSONB,
  UNIQUE (problem_id, step_number)
);

-- In-frame questions linked to a specific dry-run step
CREATE TABLE IF NOT EXISTS public."PGcode_interactive_questions" (
  id BIGSERIAL PRIMARY KEY,
  dry_run_step_id BIGINT REFERENCES public."PGcode_interactive_dry_runs"(id) ON DELETE CASCADE,
  question TEXT,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  hint TEXT
);

-- Migration complete
