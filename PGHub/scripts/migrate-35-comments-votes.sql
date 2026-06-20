CREATE TABLE IF NOT EXISTS "PGcode_comments" (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES "PGcode_comments"(id) ON DELETE SET NULL,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('problem','solution','concept')),
  target_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pgcode_comments_target ON "PGcode_comments"(target_kind, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgcode_comments_user ON "PGcode_comments"(user_id);

CREATE TABLE IF NOT EXISTS "PGcode_votes" (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('comment','solution')),
  target_id BIGINT NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, target_kind, target_id)
);
CREATE INDEX IF NOT EXISTS idx_pgcode_votes_target ON "PGcode_votes"(target_kind, target_id);

CREATE OR REPLACE FUNCTION pgcode_comments_for_target(
  p_target_kind TEXT, p_target_id TEXT, p_user_id UUID DEFAULT NULL
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  FROM (
    SELECT c.id, c.parent_id, c.user_id, c.body, c.created_at, c.updated_at, c.deleted_at,
      coalesce((SELECT sum(value) FROM "PGcode_votes" v WHERE v.target_kind='comment' AND v.target_id=c.id), 0) AS score,
      (SELECT value FROM "PGcode_votes" v WHERE v.target_kind='comment' AND v.target_id=c.id AND v.user_id = p_user_id) AS my_vote,
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = c.user_id) AS author_name
    FROM "PGcode_comments" c
    WHERE c.target_kind = p_target_kind AND c.target_id = p_target_id AND c.deleted_at IS NULL
    ORDER BY c.created_at ASC
  ) t;
$$;
GRANT EXECUTE ON FUNCTION pgcode_comments_for_target TO anon, authenticated;

ALTER TABLE "PGcode_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PGcode_votes" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments read" ON "PGcode_comments";
CREATE POLICY "comments read" ON "PGcode_comments" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "comments owner insert" ON "PGcode_comments";
CREATE POLICY "comments owner insert" ON "PGcode_comments" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comments owner update" ON "PGcode_comments";
CREATE POLICY "comments owner update" ON "PGcode_comments" FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "votes read" ON "PGcode_votes";
CREATE POLICY "votes read" ON "PGcode_votes" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "votes owner upsert" ON "PGcode_votes";
CREATE POLICY "votes owner upsert" ON "PGcode_votes" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "votes owner update" ON "PGcode_votes";
CREATE POLICY "votes owner update" ON "PGcode_votes" FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "votes owner delete" ON "PGcode_votes";
CREATE POLICY "votes owner delete" ON "PGcode_votes" FOR DELETE TO authenticated USING (user_id = auth.uid());
