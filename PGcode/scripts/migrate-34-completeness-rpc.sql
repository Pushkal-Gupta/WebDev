-- 34: problem-completeness audit RPC.
-- Reports per-problem editorial completeness across 6 fields so the admin
-- surface can prioritize backfill work. Safe to call from anon (read-only).

CREATE OR REPLACE FUNCTION pgcode_problem_completeness()
RETURNS TABLE (
  id text,
  name text,
  topic_id text,
  has_description boolean,
  has_hints boolean,
  has_test_cases boolean,
  has_50plus_cases boolean,
  has_solutions boolean,
  has_viz boolean,
  completeness_pct int,
  missing_fields text[]
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.name,
      p.topic_id,
      (p.description IS NOT NULL AND length(p.description) >= 100) AS has_description,
      (p.hints IS NOT NULL AND array_length(p.hints, 1) >= 3)      AS has_hints,
      CASE
        WHEN p.test_cases IS NULL THEN 0
        WHEN p.test_cases::text LIKE '[%' THEN jsonb_array_length(p.test_cases::jsonb)
        ELSE 0
      END AS tc_count,
      (p.solutions IS NOT NULL
        AND p.solutions::text NOT IN ('null', '{}')) AS has_solutions,
      (p.viz_steps IS NOT NULL
        AND p.viz_steps::text LIKE '[%'
        AND jsonb_array_length(p.viz_steps::jsonb) > 0) AS has_viz
    FROM "PGcode_problems" p
  ),
  flagged AS (
    SELECT
      b.id,
      b.name,
      b.topic_id,
      b.has_description,
      b.has_hints,
      (b.tc_count >= 1)  AS has_test_cases,
      (b.tc_count >= 50) AS has_50plus_cases,
      b.has_solutions,
      b.has_viz
    FROM base b
  )
  SELECT
    f.id,
    f.name,
    f.topic_id,
    f.has_description,
    f.has_hints,
    f.has_test_cases,
    f.has_50plus_cases,
    f.has_solutions,
    f.has_viz,
    round(
      100.0 * (
        (f.has_description)::int +
        (f.has_hints)::int +
        (f.has_test_cases)::int +
        (f.has_50plus_cases)::int +
        (f.has_solutions)::int +
        (f.has_viz)::int
      ) / 6.0
    )::int AS completeness_pct,
    ARRAY(
      SELECT m FROM (VALUES
        ('description', f.has_description),
        ('hints',       f.has_hints),
        ('test_cases',  f.has_test_cases),
        ('50plus_cases',f.has_50plus_cases),
        ('solutions',   f.has_solutions),
        ('viz',         f.has_viz)
      ) AS v(m, ok) WHERE NOT v.ok
    ) AS missing_fields
  FROM flagged f;
$$;

GRANT EXECUTE ON FUNCTION pgcode_problem_completeness() TO anon, authenticated;
