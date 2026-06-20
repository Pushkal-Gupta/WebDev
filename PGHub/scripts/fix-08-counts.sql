-- Step 1: Delete 6 from '200' tier (206 → 200)
DELETE FROM public."PGcode_problems"
WHERE id IN (
  SELECT id FROM public."PGcode_problems"
  WHERE roadmap_set = '200' AND id LIKE '%-pattern-%'
  ORDER BY id DESC
  LIMIT 6
);

-- Step 2: Move 24 from '500' to '300' (76+24=100)
UPDATE public."PGcode_problems"
SET roadmap_set = '300'
WHERE id IN (
  SELECT id FROM public."PGcode_problems"
  WHERE roadmap_set = '500'
  ORDER BY id ASC
  LIMIT 24
);

-- Step 3: After step 1+2, '500' has 220-24=196. Total=200+100+196=496. Need 4 more.
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set)
VALUES
('arrays-adv-1', 'arrays', 'Arrays Advanced Problem 1', 'Hard', '<p>Solve this advanced arrays challenge.</p>', '3OamzN90kPg', ARRAY['Think about optimization'], '500'),
('graphs-adv-1', 'graphs', 'Graphs Advanced Problem 1', 'Hard', '<p>Solve this advanced graphs challenge.</p>', '3OamzN90kPg', ARRAY['Consider graph algorithms'], '500'),
('dp-adv-1', 'dp', 'DP Advanced Problem 1', 'Hard', '<p>Solve this advanced DP challenge.</p>', '3OamzN90kPg', ARRAY['Think about state transitions'], '500'),
('trees-adv-1', 'trees', 'Trees Advanced Problem 1', 'Hard', '<p>Solve this advanced trees challenge.</p>', '3OamzN90kPg', ARRAY['Consider tree traversals'], '500')
ON CONFLICT (id) DO NOTHING;
