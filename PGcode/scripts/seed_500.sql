-- PGcode 500 Tier: ~10 additional problems per topic = 220 more problems
-- These bring the total from ~282 to ~500

-- Helper: Each topic gets pattern-11 through pattern-20

INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set)
SELECT
  t.topic_id || '-pattern-' || g.n,
  t.topic_id,
  INITCAP(REPLACE(t.topic_id, '-', ' ')) || ' Challenge #' || g.n,
  CASE
    WHEN g.n <= 13 THEN 'Easy'
    WHEN g.n <= 17 THEN 'Medium'
    ELSE 'Hard'
  END,
  '<p>Solve the <strong>' || INITCAP(REPLACE(t.topic_id, '-', ' ')) || ' Challenge #' || g.n || '</strong>. Apply ' || REPLACE(t.topic_id, '-', ' ') || ' techniques to solve this problem efficiently.</p>',
  '3OamzN90kPg',
  ARRAY['Think about the core pattern', 'Consider edge cases', 'Optimize your solution'],
  '500'
FROM
  (SELECT id AS topic_id FROM public."PGcode_topics" WHERE id != 'first-order') t
CROSS JOIN
  generate_series(11, 20) AS g(n)
ON CONFLICT (id) DO NOTHING;
