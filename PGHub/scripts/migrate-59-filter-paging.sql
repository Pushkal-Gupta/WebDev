-- 59: server-side STATUS filtering + correct paging fallback for ANY narrowing filter.
--
-- WHY (two live bugs this fixes):
--   Bug #1 (status-filter-only-current-page): the Practice "Status" filter is
--     applied client-side over just the rows of the CURRENT page, so a "Solved"
--     filter only ever shows solved problems that happen to fall in the page
--     you're looking at. Filtering must happen in the DB so the whole catalog is
--     considered. This migration adds a p_status param that joins
--     "PGcode_user_progress" for the current user (auth.uid()) and filters both
--     the count and the rows by the resolved status.
--   Bug #2 (topic-empty-pages / wrong range under filters): migrate-58 only
--     dropped number-bucket paging when a SEARCH was present. With a topic or
--     difficulty (or now status) filter active, the 'number' sort still paged by
--     NUMBER bucket, so pages whose number-window contained no matching rows came
--     back empty and the footer/pager reported the catalog number range. Fix:
--     number-bucket paging applies ONLY for the bare 'number' sort with NO
--     search, topic, difficulty, or status filter; any narrowing filter falls
--     back to POSITION paging and returns maxNumber = 0 so the client sizes the
--     pager by the real match count.
--
-- MUST be applied to the live DB. Until then the client RPC signature must NOT
-- send p_status (calling the current deployed function with an extra arg errors).
-- Builds on migrate-58-search-number-bucket-fix.sql.

-- Drop the prior 6-arg overload (migrate-58) so only the new 7-arg version
-- exists. Calls with 6 args still resolve to it via p_status's DEFAULT, and the
-- function name is no longer ambiguous for GRANT / PostgREST.
DROP FUNCTION IF EXISTS pgcode_problem_page(int, int, text, text[], text, text);

CREATE OR REPLACE FUNCTION pgcode_problem_page(
  p_limit      int      DEFAULT 100,
  p_offset     int      DEFAULT 0,
  p_topic_id   text     DEFAULT NULL,
  p_difficulty text[]   DEFAULT NULL,
  p_search     text     DEFAULT NULL,
  p_sort       text     DEFAULT 'topic', -- 'topic' | 'difficulty' | 'name' | 'number'
  p_status     text     DEFAULT NULL     -- 'not_started'|'attempted'|'solved'|'mastered'|'bookmarked'|'needs_revision'
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
  v_uid    uuid := auth.uid();
  v_search text := CASE WHEN p_search IS NULL OR length(trim(p_search)) = 0
                        THEN NULL
                        ELSE '%' || lower(trim(p_search)) || '%' END;
  v_status text := CASE WHEN p_status IS NULL OR length(trim(p_status)) = 0 OR p_status = 'all'
                        THEN NULL
                        ELSE p_status END;
  v_lo int := p_offset;            -- number-bucket lower bound (exclusive)
  v_hi int := p_offset + p_limit;  -- number-bucket upper bound (inclusive)
  -- Number-bucket paging only for a bare 'number' sort: NO search, topic,
  -- difficulty, or status filter. ANY narrowing filter falls back to position
  -- paging (and maxNumber = 0) so no empty pages and the client sizes the pager
  -- by the real match count.
  v_number_bucket boolean := (p_sort = 'number'
                              AND v_search     IS NULL
                              AND p_topic_id   IS NULL
                              AND p_difficulty IS NULL
                              AND v_status     IS NULL);
BEGIN
  -- Total count + max number over the active filter (incl. status via progress).
  -- Resolved status mirrors the client's legacyToStatus(): explicit status when
  -- present, else is_completed -> 'solved', is_starred -> 'bookmarked', else
  -- 'not_started' (and no progress row at all -> 'not_started').
  SELECT count(*), max(p.leetcode_number)
    INTO v_total, v_max
  FROM "PGcode_problems" p
  LEFT JOIN "PGcode_user_progress" up
    ON up.problem_id = p.id AND up.user_id = v_uid
  WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
    AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
    AND (v_search     IS NULL
         OR lower(p.name) LIKE v_search
         OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search))
    AND (v_status IS NULL OR coalesce(
           up.status,
           CASE WHEN up.is_completed THEN 'solved'
                WHEN up.is_starred   THEN 'bookmarked'
                ELSE 'not_started' END,
           'not_started') = v_status);

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
    -- 'number' sort whenever a search, topic, difficulty, or status filter is
    -- active (ordered by the chosen sort key).
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
    FROM (
      SELECT p.id, p.name, p.topic_id, p.difficulty, p.roadmap_set, p.leetcode_url, p.leetcode_number
      FROM "PGcode_problems" p
      LEFT JOIN "PGcode_user_progress" up
        ON up.problem_id = p.id AND up.user_id = v_uid
      WHERE (p_topic_id   IS NULL OR p.topic_id = p_topic_id)
        AND (p_difficulty IS NULL OR p.difficulty = ANY(p_difficulty))
        AND (v_search     IS NULL
             OR lower(p.name) LIKE v_search
             OR (p.leetcode_number IS NOT NULL AND p.leetcode_number::text LIKE v_search))
        AND (v_status IS NULL OR coalesce(
               up.status,
               CASE WHEN up.is_completed THEN 'solved'
                    WHEN up.is_starred   THEN 'bookmarked'
                    ELSE 'not_started' END,
               'not_started') = v_status)
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
  -- (return 0) under any narrowing filter so the client pages by match count.
  RETURN jsonb_build_object(
    'total', v_total,
    'rows', v_rows,
    'maxNumber', CASE WHEN v_number_bucket THEN coalesce(v_max, 0) ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_page(int, int, text, text[], text, text, text) TO anon, authenticated;
