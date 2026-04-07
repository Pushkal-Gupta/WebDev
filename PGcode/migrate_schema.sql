-- Add missing columns to PGcode_problems for the 200-question expansion
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS visual_state_data JSONB;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_js TEXT;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_python TEXT;
ALTER TABLE public."PGcode_problems" ADD COLUMN IF NOT EXISTS solution_code_java TEXT;

-- Migration complete
