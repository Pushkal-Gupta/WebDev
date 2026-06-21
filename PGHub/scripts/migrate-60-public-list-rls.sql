-- 60: fix public list sharing (P0). PGcode_user_lists only had an owner-select
-- RLS policy (migrate-32: USING user_id = auth.uid()), so a shared link
-- (#/lists/share/<slug>) returned nothing for anyone but the owner — the owner
-- saw it via the owner policy, masking the bug during self-testing. Add
-- permissive public-read policies so anyone can read a list (and its problems)
-- that the owner explicitly flagged is_public. Postgres ORs permissive policies,
-- so the existing owner-select policy is preserved.

-- Lists: allow reading rows the owner made public, to anyone (anon + authed).
DROP POLICY IF EXISTS "PGcode_user_lists public read" ON "PGcode_user_lists";
CREATE POLICY "PGcode_user_lists public read"
  ON "PGcode_user_lists"
  FOR SELECT
  TO public
  USING (is_public = true);

-- List problems: allow reading the items of any public list.
DROP POLICY IF EXISTS "PGcode_user_list_problems public read" ON "PGcode_user_list_problems";
CREATE POLICY "PGcode_user_list_problems public read"
  ON "PGcode_user_list_problems"
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM "PGcode_user_lists" l
      WHERE l.id = "PGcode_user_list_problems".list_id
        AND l.is_public = true
    )
  );

-- OWNER policies on PGcode_user_list_problems (this table is keyed by list_id,
-- not user_id, so migrate-32's owner policies skipped it). Without these, an
-- authenticated owner could neither SEE the items of their own PRIVATE list nor
-- ADD/REMOVE problems — the "can't add to a list even after login" bug. Ownership
-- is derived through the parent list. RLS is ORed, so this composes with the
-- public-read policy above.
ALTER TABLE "PGcode_user_list_problems" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PGcode_user_list_problems owner read" ON "PGcode_user_list_problems";
CREATE POLICY "PGcode_user_list_problems owner read"
  ON "PGcode_user_list_problems"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PGcode_user_lists" l
      WHERE l.id = "PGcode_user_list_problems".list_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PGcode_user_list_problems owner insert" ON "PGcode_user_list_problems";
CREATE POLICY "PGcode_user_list_problems owner insert"
  ON "PGcode_user_list_problems"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "PGcode_user_lists" l
      WHERE l.id = "PGcode_user_list_problems".list_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PGcode_user_list_problems owner update" ON "PGcode_user_list_problems";
CREATE POLICY "PGcode_user_list_problems owner update"
  ON "PGcode_user_list_problems"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PGcode_user_lists" l
      WHERE l.id = "PGcode_user_list_problems".list_id
        AND l.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PGcode_user_list_problems owner delete" ON "PGcode_user_list_problems";
CREATE POLICY "PGcode_user_list_problems owner delete"
  ON "PGcode_user_list_problems"
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PGcode_user_lists" l
      WHERE l.id = "PGcode_user_list_problems".list_id
        AND l.user_id = auth.uid()
    )
  );
