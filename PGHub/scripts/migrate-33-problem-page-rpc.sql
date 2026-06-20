-- 33: server-side pagination + filtering for /practice.
-- Client previously fetched all 3,788 problems then filtered locally — slow,
-- hangs the browser. Now Postgres does the filter + sort + slice in one shot.

-- Indexes to make filtered scans cheap.
CREATE INDEX IF NOT EXISTS idx_PGcode_problems_topic_id
  ON "PGcode_problems" (topic_id);
CREATE INDEX IF NOT EXISTS idx_PGcode_problems_difficulty
  ON "PGcode_problems" (difficulty);
CREATE INDEX IF NOT EXISTS idx_PGcode_problems_name_lower
  ON "PGcode_problems" (lower(name));
CREATE INDEX IF NOT EXISTS idx_PGcode_problems_roadmap_set
  ON "PGcode_problems" (roadmap_set);

-- One trip for both rows + total. Returns at most p_limit rows starting at
-- p_offset; respects topic / difficulty / search / sort filters. Anon-readable.
CREATE OR REPLACE FUNCTION pgcode_problem_page(
  p_limit      int      DEFAULT 100,
  p_offset     int      DEFAULT 0,
  p_topic_id   text     DEFAULT NULL,
  p_difficulty text[]   DEFAULT NULL,   -- ['Easy','Medium','Hard'] subset
  p_search     text     DEFAULT NULL,
  p_sort       text     DEFAULT 'topic' -- 'topic' | 'difficulty' | 'name'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_rows  jsonb;
  v_search text := CASE WHEN p_search IS NULL OR length(trim(p_search)) = 0
                        THEN NULL
                        ELSE '%' || lower(trim(p_search)) || '%' END;
BEGIN
  -- Total count (before slicing).
  SELECT count(*) INTO v_total
  FROM "PGcode_problems" p
  WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
    AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
    AND (v_search     IS NULL OR lower(p.name) LIKE v_search);

  -- Paged rows.
  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT p.id, p.name, p.topic_id, p.difficulty, p.roadmap_set, p.leetcode_url
    FROM "PGcode_problems" p
    WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
      AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
      AND (v_search     IS NULL OR lower(p.name) LIKE v_search)
    ORDER BY
      CASE WHEN p_sort = 'name'       THEN lower(p.name) END ASC NULLS LAST,
      CASE WHEN p_sort = 'difficulty' THEN
        CASE p.difficulty WHEN 'Easy' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Hard' THEN 2 ELSE 3 END
      END ASC NULLS LAST,
      CASE WHEN p_sort = 'topic'      THEN p.topic_id END ASC NULLS LAST,
      lower(p.name) ASC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_page TO anon, authenticated;
