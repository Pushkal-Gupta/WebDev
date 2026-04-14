-- ============================================================
-- DIAGNOSTIC: what is actually in the live PGcode catalogue?
-- Paste the output of each block back so we know the true state.
-- Safe, read-only.
-- ============================================================

-- 1) Counts per topic + roadmap_set
SELECT topic_id, roadmap_set, COUNT(*) AS n
FROM public."PGcode_problems"
GROUP BY topic_id, roadmap_set
ORDER BY topic_id, roadmap_set;

-- 2) Per-problem completeness snapshot
SELECT
  id,
  topic_id,
  roadmap_set,
  (test_cases IS NOT NULL AND jsonb_array_length(test_cases) > 0) AS has_test_cases,
  (method_name IS NOT NULL) AS has_signature,
  COALESCE(array_length(hints, 1), 0) AS hint_count,
  LENGTH(description) AS desc_len
FROM public."PGcode_problems"
ORDER BY topic_id, id;

-- 3) Which problems have starter templates and in which languages
SELECT problem_id, array_agg(language ORDER BY language) AS langs
FROM public."PGcode_problem_templates"
GROUP BY problem_id
ORDER BY problem_id;

-- 4) Overall totals
SELECT
  (SELECT COUNT(*) FROM public."PGcode_problems") AS total_problems,
  (SELECT COUNT(DISTINCT problem_id) FROM public."PGcode_problem_templates") AS problems_with_templates,
  (SELECT COUNT(*) FROM public."PGcode_problems"
    WHERE test_cases IS NOT NULL AND jsonb_array_length(test_cases) > 0) AS problems_with_tests,
  (SELECT COUNT(*) FROM public."PGcode_problems" WHERE method_name IS NOT NULL) AS problems_with_signature;
