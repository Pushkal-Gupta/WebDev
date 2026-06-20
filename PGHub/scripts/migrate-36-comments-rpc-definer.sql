-- Fix: pgcode_comments_for_target was created SECURITY INVOKER but reads from
-- auth.users (for author_name). Anon callers got 401 "permission denied for
-- table users". Switching to SECURITY DEFINER lets the function read auth.users
-- via the owner role. Function body is read-only and parameterised, so this is
-- safe; the SET search_path lock-down already prevents schema-injection.

CREATE OR REPLACE FUNCTION pgcode_comments_for_target(
  p_target_kind TEXT, p_target_id TEXT, p_user_id UUID DEFAULT NULL
) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
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
