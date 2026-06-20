-- migrate-46-submissions-notes-memory.sql
-- Adds memory_kb + notes to PGcode_user_submissions so the LeetCode-style
-- submission detail panel can show a Memory stat and persist per-submission
-- notes. Also installs a row-owner UPDATE policy so users can edit only their
-- own submission notes.

ALTER TABLE public."PGcode_user_submissions"
  ADD COLUMN IF NOT EXISTS memory_kb INT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

DROP POLICY IF EXISTS "users can update own submission notes" ON public."PGcode_user_submissions";
CREATE POLICY "users can update own submission notes" ON public."PGcode_user_submissions"
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
