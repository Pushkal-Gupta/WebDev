-- Round 3: more wrong-expected test cases
BEGIN;

-- swim-in-water #13: [[0,3],[2,1]] min-max = 2 (via 0→2→1)
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{12,expected}', '"2"'::jsonb)
 WHERE id = 'swim-in-water';

-- top-k-frequent #18: [3,0,1,0] k=2. counts {3:1,0:2,1:1}. dict-order: 3 inserted first → [0,3]
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{17,expected}', '"[0,3]"'::jsonb)
 WHERE id = 'top-k-frequent';

-- gas-station #18: gas=[6,1,4,3,5] cost=[3,8,2,4,2] → start=2
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{17,expected}', '"2"'::jsonb)
 WHERE id = 'gas-station';

-- k-closest-points #13: tied [[-1,-1],[1,1]] k=1, heap order pops first push, keeps second → [[1,1]]
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{12}', '{"inputs":["[[-1,-2],[1,1]]","1"],"expected":"[[1,1]]"}'::jsonb)
 WHERE id = 'k-closest-points';

-- two-sum-ii #18: [10,20,30,40,50] target=60. Two-pointer finds 10+50 first → [1,5]
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{17,expected}', '"[1,5]"'::jsonb)
 WHERE id = 'two-sum-ii';

COMMIT;
