-- Add C++ reference-solution column to the approaches table.
-- PGcode_problem_templates already uses (problem_id, language, code), so no
-- column change is needed there — C++ starters are inserted as new rows.

ALTER TABLE PGcode_solution_approaches
  ADD COLUMN IF NOT EXISTS code_cpp TEXT;
