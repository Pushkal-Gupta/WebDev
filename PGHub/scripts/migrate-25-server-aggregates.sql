-- migrate-25: server-side aggregation RPCs and a problem catalog view.
--
-- Goal: move the heaviest "fetch 500 rows + reduce in JS" work into Postgres
-- so the client downloads compact pre-aggregated JSON. This is the cheap SSR
-- adjacent without committing to Next.js.

-- ────────────────────────────────────────────────────────────────────────
-- 1) Problem catalog view (used by /tutorial name-resolution + filters).
--    Built once, indexed by id and a normalized-name expression.
-- ────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public."pgcode_problem_catalog_v" AS
SELECT
  p.id,
  p.name,
  p.topic_id,
  p.difficulty,
  p.roadmap_set,
  p.tags,
  -- lowercased + alphanumeric-only, matches the client's normName() exactly
  regexp_replace(lower(p.name), '[^a-z0-9]+', '', 'g') AS norm_name
FROM public."PGcode_problems" p;

CREATE INDEX IF NOT EXISTS idx_problems_norm_name
  ON public."PGcode_problems"
  ((regexp_replace(lower(name), '[^a-z0-9]+', '', 'g')));

-- ────────────────────────────────────────────────────────────────────────
-- 2) Single-call user stats RPC.
--    One round-trip → entire stats payload for Progress + Practice History.
-- ────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.pgcode_user_stats(uuid);
CREATE OR REPLACE FUNCTION public.pgcode_user_stats(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH
    user_progress AS (
      SELECT p.problem_id, p.is_completed, p.is_starred, p.status, p.last_solved_at,
             pr.difficulty, pr.topic_id, pr.roadmap_set
      FROM public."PGcode_user_progress" p
      JOIN public."PGcode_problems" pr ON pr.id = p.problem_id
      WHERE p.user_id = uid
    ),
    submissions AS (
      SELECT s.problem_id, s.verdict, s.language, s.created_at,
             pr.difficulty, pr.topic_id
      FROM public."PGcode_user_submissions" s
      LEFT JOIN public."PGcode_problems" pr ON pr.id = s.problem_id
      WHERE s.user_id = uid
    ),
    totals AS (
      SELECT
        COUNT(*) FILTER (WHERE is_completed AND difficulty = 'Easy')   AS easy_solved,
        COUNT(*) FILTER (WHERE is_completed AND difficulty = 'Medium') AS medium_solved,
        COUNT(*) FILTER (WHERE is_completed AND difficulty = 'Hard')   AS hard_solved,
        COUNT(*) FILTER (WHERE is_completed)                            AS total_solved,
        COUNT(*)                                                        AS total_attempted
      FROM user_progress
    ),
    sub_stats AS (
      SELECT
        COUNT(*)                                                          AS total_subs,
        COUNT(*) FILTER (WHERE verdict IN ('Accepted','success','accepted')) AS accepted_subs
      FROM submissions
    ),
    by_topic AS (
      SELECT topic_id,
             COUNT(*) FILTER (WHERE is_completed) AS solved,
             COUNT(*) AS total
      FROM user_progress
      GROUP BY topic_id
    ),
    daily AS (
      SELECT date_trunc('day', last_solved_at) AS day,
             difficulty,
             COUNT(*) AS n
      FROM user_progress
      WHERE is_completed AND last_solved_at IS NOT NULL
        AND last_solved_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1, 2
    )
  SELECT jsonb_build_object(
    'totals', (SELECT row_to_json(totals.*) FROM totals),
    'submissions', (SELECT row_to_json(sub_stats.*) FROM sub_stats),
    'by_topic', COALESCE((
      SELECT jsonb_object_agg(topic_id, jsonb_build_object('solved', solved, 'total', total))
      FROM by_topic
    ), '{}'::jsonb),
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('day', day, 'difficulty', difficulty, 'n', n) ORDER BY day)
      FROM daily
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pgcode_user_stats(uuid) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- 3) Recent submissions grouped by problem (used by PracticeHistory).
--    Returns at most `lim` problems with their most-recent submission summary.
-- ────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.pgcode_practice_history(uuid, int);
CREATE OR REPLACE FUNCTION public.pgcode_practice_history(uid uuid, lim int DEFAULT 200)
RETURNS TABLE (
  problem_id TEXT,
  problem_name TEXT,
  topic_id TEXT,
  difficulty TEXT,
  last_submitted_at TIMESTAMPTZ,
  last_verdict TEXT,
  submission_count INT,
  accepted_count INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_subs AS (
    SELECT s.problem_id, s.verdict, s.created_at,
           pr.name AS problem_name, pr.topic_id, pr.difficulty
    FROM public."PGcode_user_submissions" s
    LEFT JOIN public."PGcode_problems" pr ON pr.id = s.problem_id
    WHERE s.user_id = uid
  ),
  ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY problem_id ORDER BY created_at DESC) AS rn,
           COUNT(*) OVER (PARTITION BY problem_id) AS submission_count,
           COUNT(*) FILTER (WHERE verdict IN ('Accepted','success','accepted'))
             OVER (PARTITION BY problem_id) AS accepted_count
    FROM user_subs
  )
  SELECT problem_id, problem_name, topic_id, difficulty,
         created_at AS last_submitted_at,
         verdict AS last_verdict,
         submission_count::int,
         accepted_count::int
  FROM ranked
  WHERE rn = 1
  ORDER BY last_submitted_at DESC NULLS LAST
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION public.pgcode_practice_history(uuid, int) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- 4) Tutorial resolution RPC: given a list of normalized names, returns the
--    matching problem id+difficulty+topic in a single round-trip. Used by
--    /tutorial so the client doesn't need to fetch the entire problem catalog.
-- ────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.pgcode_resolve_tutorial(text[]);
CREATE OR REPLACE FUNCTION public.pgcode_resolve_tutorial(names text[])
RETURNS TABLE (
  norm_name TEXT,
  problem_id TEXT,
  problem_name TEXT,
  topic_id TEXT,
  difficulty TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (norm_name)
    norm_name, id, name, topic_id, difficulty
  FROM public."pgcode_problem_catalog_v"
  WHERE norm_name = ANY(names)
  ORDER BY norm_name, name;
$$;

GRANT EXECUTE ON FUNCTION public.pgcode_resolve_tutorial(text[]) TO anon, authenticated;
GRANT SELECT ON public."pgcode_problem_catalog_v" TO anon, authenticated;
