-- 43: extend pgcode_problem_page to search by leetcode_number and return it.
-- The Practice list renders "<num>. <name>" but the RPC never selected
-- leetcode_number, and search only matched on name. Typing "107" now finds
-- problem #107 (Binary Tree Level Order Traversal II).

-- Helpful index for numeric lookups + the new 'number' sort.
CREATE INDEX IF NOT EXISTS idx_PGcode_problems_leetcode_number
  ON "PGcode_problems" (leetcode_number);

CREATE OR REPLACE FUNCTION pgcode_problem_page(
  p_limit      int      DEFAULT 100,
  p_offset     int      DEFAULT 0,
  p_topic_id   text     DEFAULT NULL,
  p_difficulty text[]   DEFAULT NULL,   -- ['Easy','Medium','Hard'] subset
  p_search     text     DEFAULT NULL,
  p_sort       text     DEFAULT 'topic' -- 'topic' | 'difficulty' | 'name' | 'number'
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
    AND (v_search     IS NULL
         OR lower(p.name) LIKE v_search
         OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search));

  -- Paged rows.
  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT p.id, p.name, p.topic_id, p.difficulty, p.roadmap_set, p.leetcode_url, p.leetcode_number
    FROM "PGcode_problems" p
    WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
      AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
      AND (v_search     IS NULL
           OR lower(p.name) LIKE v_search
           OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search))
    ORDER BY
      CASE WHEN p_sort = 'name'       THEN lower(p.name) END ASC NULLS LAST,
      CASE WHEN p_sort = 'difficulty' THEN
        CASE p.difficulty WHEN 'Easy' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Hard' THEN 2 ELSE 3 END
      END ASC NULLS LAST,
      CASE WHEN p_sort = 'topic'      THEN p.topic_id END ASC NULLS LAST,
      CASE WHEN p_sort = 'number'     THEN p.leetcode_number END ASC NULLS LAST,
      lower(p.name) ASC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_page TO anon, authenticated;
