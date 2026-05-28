-- Adds the user-visible LeetCode problem number (frontend_question_id) so the
-- catalog can display "1. Two Sum", "26. Remove Duplicates...", etc.
ALTER TABLE public."PGcode_problems"
  ADD COLUMN IF NOT EXISTS leetcode_number INT;

CREATE INDEX IF NOT EXISTS idx_pgcode_problems_leetcode_number
  ON public."PGcode_problems"(leetcode_number);
