-- 48: anonymous Share on /playground was failing with
--   "new row violates row-level security policy for table PGcode_playground_snippets"
--
-- Migration 32 only created authenticated owner-INSERT (WITH CHECK user_id = auth.uid()).
-- Playground.jsx sends user_id: session?.user?.id || null, so anonymous shares
-- sent user_id=NULL and were rejected because no anon policy existed.
--
-- Migration 16's intent (line 1-2): "Anyone with the slug can view / fork the
-- snippet (read-public via RLS)" — anonymous share is the intended UX.
--
-- Fix: allow anon INSERT only when user_id IS NULL (so an anon user can't
-- impersonate someone else by stuffing a stranger's UUID).

DROP POLICY IF EXISTS "PGcode_playground_snippets anon insert" ON public."PGcode_playground_snippets";
CREATE POLICY "PGcode_playground_snippets anon insert"
  ON public."PGcode_playground_snippets"
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
