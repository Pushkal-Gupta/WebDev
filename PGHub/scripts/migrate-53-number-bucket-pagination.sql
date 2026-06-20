-- 53: number-bucket pagination for the Practice list's "Number" sort.
-- The catalog has gaps in leetcode_number (e.g. 1..100 has 100 problems, but
-- 101..200 has only 92). Position-based paging therefore made "page 2"
-- (positions 101..200) spill up to problem #208 to fill 100 rows, so the
-- "101-200" label clashed with the visible row numbers. When p_sort='number'
-- we now page by NUMBER buckets: page N shows problems whose leetcode_number
-- falls in (p_offset, p_offset + p_limit] — so "101-200" literally means
-- problems #101..#200 and the last row is #200. Other sorts keep position
-- paging. We also return maxNumber (over the same filter) so the client can
-- size the pager to ceil(maxNumber / pageSize) with no empty trailing pages.

CREATE OR REPLACE FUNCTION pgcode_problem_page(
  p_limit      int      DEFAULT 100,
  p_offset     int      DEFAULT 0,
  p_topic_id   text     DEFAULT NULL,
  p_difficulty text[]   DEFAULT NULL,
  p_search     text     DEFAULT NULL,
  p_sort       text     DEFAULT 'topic' -- 'topic' | 'difficulty' | 'name' | 'number'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total  int;
  v_max    int;
  v_rows   jsonb;
  v_search text := CASE WHEN p_search IS NULL OR length(trim(p_search)) = 0
                        THEN NULL
                        ELSE '%' || lower(trim(p_search)) || '%' END;
  v_lo int := p_offset;            -- number-bucket lower bound (exclusive)
  v_hi int := p_offset + p_limit;  -- number-bucket upper bound (inclusive)
BEGIN
  -- Total count + max number, both over the active filter.
  SELECT count(*), max(p.leetcode_number)
    INTO v_total, v_max
  FROM "PGcode_problems" p
  WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
    AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
    AND (v_search     IS NULL
         OR lower(p.name) LIKE v_search
         OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search));

  IF p_sort = 'number' THEN
    -- Number-bucket page: rows whose leetcode_number is in (v_lo, v_hi].
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT p.id, p.name, p.topic_id, p.difficulty, p.roadmap_set, p.leetcode_url, p.leetcode_number
      FROM "PGcode_problems" p
      WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
        AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
        AND (v_search     IS NULL
             OR lower(p.name) LIKE v_search
             OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search))
        AND p.leetcode_number IS NOT NULL
        AND p.leetcode_number > v_lo
        AND p.leetcode_number <= v_hi
      ORDER BY p.leetcode_number ASC, lower(p.name) ASC
      LIMIT greatest(p_limit, 200)
    ) t;
  ELSE
    -- Position-based page (name / difficulty / topic).
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
        lower(p.name) ASC
      LIMIT p_limit OFFSET p_offset
    ) t;
  END IF;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows, 'maxNumber', coalesce(v_max, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_page TO anon, authenticated;
