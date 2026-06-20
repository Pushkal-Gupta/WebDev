-- 58: fix Practice search under the default "Number" sort.
-- migrate-53 pages the 'number' sort by NUMBER buckets (rows whose
-- leetcode_number is in (p_offset, p_offset + p_limit]). That bucket clause
-- also gated an active search, so searching for a title/number whose problem
-- lives outside the current page's bucket returned nothing — the search box
-- looked broken. Fix: when a search term is present we ignore the number
-- bucket and fall back to POSITION paging over the matched set (ordered by
-- leetcode_number), and we return maxNumber = 0 in that case so the client
-- sizes the pager by the match count, not the catalog's highest number.

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
  -- Number-bucket paging only applies for the 'number' sort WITHOUT a search.
  -- With a search active we page by position so matches in any bucket surface.
  v_number_bucket boolean := (p_sort = 'number' AND v_search IS NULL);
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

  IF v_number_bucket THEN
    -- Number-bucket page: rows whose leetcode_number is in (v_lo, v_hi].
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT p.id, p.name, p.topic_id, p.difficulty, p.roadmap_set, p.leetcode_url, p.leetcode_number
      FROM "PGcode_problems" p
      WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
        AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
        AND p.leetcode_number IS NOT NULL
        AND p.leetcode_number > v_lo
        AND p.leetcode_number <= v_hi
      ORDER BY p.leetcode_number ASC, lower(p.name) ASC
      LIMIT greatest(p_limit, 200)
    ) t;
  ELSE
    -- Position-based page. Covers name / difficulty / topic sorts, AND the
    -- 'number' sort when a search is active (ordered by number).
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
  END IF;

  -- maxNumber is only meaningful for true number-bucket paging; suppress it
  -- (return 0) when a search is active so the client pages by match count.
  RETURN jsonb_build_object(
    'total', v_total,
    'rows', v_rows,
    'maxNumber', CASE WHEN v_number_bucket THEN coalesce(v_max, 0) ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_page TO anon, authenticated;
