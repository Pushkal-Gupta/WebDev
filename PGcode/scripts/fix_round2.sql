-- Round 2: more wrong-expected test cases revealed after round 1
BEGIN;

-- swim-in-water #8: [[0,2,1],[1,3,2],[2,4,3]] min-max path = 3 (via 0→1→3→2→3)
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{7,expected}', '"3"'::jsonb)
 WHERE id = 'swim-in-water';

-- top-k-frequent #8: [-1,-1,-2,-2,-3] k=2 → bucket-sort returns insertion order [-1,-2]
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{7,expected}', '"[-1,-2]"'::jsonb)
 WHERE id = 'top-k-frequent';

-- pacific-atlantic #5: [[1,2,3],[8,9,4],[7,6,5]] — true intersection includes (1,1), excludes (0,0)
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{4,expected}', '"[[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]"'::jsonb)
 WHERE id = 'pacific-atlantic';

-- gas-station #11: gas=[2,2] cost=[1,3] — total diff = 0, valid start = 0
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{10,expected}', '"0"'::jsonb)
 WHERE id = 'gas-station';

-- hand-of-straights #24: [1,2,4,5] size=2 → [1,2],[4,5] both valid → true
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{23,expected}', '"true"'::jsonb)
 WHERE id = 'hand-of-straights';

-- k-closest-points #8: tied [[0,1],[1,0]] dist=1, sorted output = [[1,0]] (deterministic)
-- Wait — sorted lex puts [-...] before [...]. [[0,1]] vs [[1,0]]: "[[0,1]]" < "[[1,0]]" so [[0,1]] is sorted-first.
-- But the heap-based solution kept (-1,1,0). Let me just force deterministic by replacing input.
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{7}', '{"inputs":["[[0,2],[1,0]]","1"],"expected":"[[1,0]]"}'::jsonb)
 WHERE id = 'k-closest-points';

-- last-stone-weight #23: [8,10,4,7,10,3,7,5] simulation → 0
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{22,expected}', '"0"'::jsonb)
 WHERE id = 'last-stone-weight';

-- car-fleet #23: 9 cars all speed 1, distinct positions, all distinct etas → 9 fleets
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{22,expected}', '"9"'::jsonb)
 WHERE id = 'car-fleet';

-- two-sum-ii #16: nums=[-3,-1,0,2,4,6] target=3 → -3+6=3 → 1-indexed [1,6]
UPDATE public."PGcode_problems"
   SET test_cases = jsonb_set(test_cases, '{15,expected}', '"[1,6]"'::jsonb)
 WHERE id = 'two-sum-ii';

COMMIT;
