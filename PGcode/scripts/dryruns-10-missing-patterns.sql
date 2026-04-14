-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Missing Batch 2: 30 problems across 7 patterns
-- ───────────────────────────────────────────────────────────────
-- Sliding-Window (5), Binary-Search (5), Greedy (5), Intervals (4),
-- Heap (4), Backtracking (4), Tries (3).
-- Gold-standard depth: 7-9 steps each, rich status text, JSONB.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- SLIDING-WINDOW
-- ═══════════════════════════════════════════════════════════════

-- ── FRUIT INTO BASKETS ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'fruit-into-baskets';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('fruit-into-baskets', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"0"},
  "status": "Given fruits = [1,2,3,2,2]. Pick the longest contiguous subarray containing at most 2 distinct values. Expected: 4 (the tail [2,3,2,2] has 2 distinct types but includes a 3; actual best window is [3,2,2] or [2,3,2,2]? Let''s trace carefully)."
}'::jsonb),
('fruit-into-baskets', 2, 'Approach: Sliding Window + Count Map', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {},
  "status": "Grow a window [L..R]. Keep a hashmap of fruit→count inside the window. While the map has more than 2 keys, shrink L, decrementing counts and deleting keys that hit 0. Track the max window length."
}'::jsonb),
('fruit-into-baskets', 3, 'R=0: add 1', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"1":"1","best":"1"},
  "status": "Map = {1:1}. One distinct. len=1, best=1."
}'::jsonb),
('fruit-into-baskets', 4, 'R=1: add 2', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"1":"1","2":"1","best":"2"},
  "status": "Map = {1:1, 2:1}. Two distinct. len=2, best=2."
}'::jsonb),
('fruit-into-baskets', 5, 'R=2: add 3 → 3 distinct, shrink', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":2},
  "hashmap": {"2":"1","3":"1"},
  "status": "Adding 3 gives {1:1,2:1,3:1}: 3 distinct. Shrink L: remove fruits[0]=1 → count hits 0, delete key. L=1. Map = {2:1,3:1}. len=2."
}'::jsonb),
('fruit-into-baskets', 6, 'R=3: add 2', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [1,2,3],
  "highlightColor": "green",
  "pointers": {"L":1,"R":3},
  "hashmap": {"2":"2","3":"1","best":"3"},
  "status": "Map = {2:2, 3:1}. Still 2 distinct. len=3, best=3."
}'::jsonb),
('fruit-into-baskets', 7, 'R=4: add 2', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [1,2,3,4],
  "highlightColor": "green",
  "pointers": {"L":1,"R":4},
  "hashmap": {"2":"3","3":"1","best":"4"},
  "status": "Map = {2:3, 3:1}. 2 distinct. len=4, best=4."
}'::jsonb),
('fruit-into-baskets', 8, 'Result', '{
  "type": "array",
  "array": [1,2,3,2,2],
  "highlights": [1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"4"},
  "status": "Return 4. Each index enters and leaves the window once → O(n) time, O(1) space (at most 3 keys)."
}'::jsonb);


-- ── LONGEST SUBARRAY OF 1s AFTER DELETING ONE ───────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-subarray-ones-deletion';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-subarray-ones-deletion', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"0"},
  "status": "Given nums = [1,1,0,1,1,1]. You MUST delete exactly one element. Return the length of the longest subarray of 1s possible. Expected: 5."
}'::jsonb),
('longest-subarray-ones-deletion', 2, 'Approach: Window with at most one 0', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"zeros":"0"},
  "status": "Maintain a window containing at most ONE zero. The answer is (window length − 1) because we always delete that single zero (or one real 1 if there are no zeros)."
}'::jsonb),
('longest-subarray-ones-deletion', 3, 'R=0: 1', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"zeros":"0","best":"0"},
  "status": "len=1, zeros=0. best = len − 1 = 0."
}'::jsonb),
('longest-subarray-ones-deletion', 4, 'R=1: 1', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"zeros":"0","best":"1"},
  "status": "len=2, zeros=0. best = 1."
}'::jsonb),
('longest-subarray-ones-deletion', 5, 'R=2: 0', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":2},
  "hashmap": {"zeros":"1","best":"2"},
  "status": "Zero absorbed. len=3, zeros=1. best = max(1, 3−1) = 2."
}'::jsonb),
('longest-subarray-ones-deletion', 6, 'R=3,4: add 1,1', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [0,1,2,3,4],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":4},
  "hashmap": {"zeros":"1","best":"4"},
  "status": "Still exactly one zero in the window. len=5 → best = 4."
}'::jsonb),
('longest-subarray-ones-deletion', 7, 'R=5: 1, window still valid', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":5},
  "hashmap": {"zeros":"1","best":"5"},
  "status": "len=6, zeros=1. best = max(4, 6−1) = 5."
}'::jsonb),
('longest-subarray-ones-deletion', 8, 'Result', '{
  "type": "array",
  "array": [1,1,0,1,1,1],
  "highlights": [3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"5"},
  "status": "Return 5 — deleting the single 0 fuses the left run [1,1] with the right run [1,1,1] to give five 1s."
}'::jsonb);


-- ── MAX CONSECUTIVE ONES III ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-consecutive-ones-iii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-consecutive-ones-iii', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"2","best":"0"},
  "status": "Given nums and k=2. Find the longest window you can turn into all 1s by flipping at most k zeros. Expected: 6."
}'::jsonb),
('max-consecutive-ones-iii', 2, 'Approach: Sliding Window', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"zeros":"0","k":"2"},
  "status": "Keep at most k zeros inside the window. If zeros > k, shrink L until the invariant holds. Track max length."
}'::jsonb),
('max-consecutive-ones-iii', 3, 'R=0..2: three 1s', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2},
  "hashmap": {"zeros":"0","best":"3"},
  "status": "All 1s, no zeros used. best=3."
}'::jsonb),
('max-consecutive-ones-iii', 4, 'R=3,4: zeros=1,2', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [0,1,2,3,4],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":4},
  "hashmap": {"zeros":"2","best":"5"},
  "status": "Flip both zeros (k=2). len=5, best=5."
}'::jsonb),
('max-consecutive-ones-iii', 5, 'R=5: zeros=3 → shrink', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [4,5],
  "pointers": {"L":4,"R":5},
  "hashmap": {"zeros":"2","best":"5"},
  "status": "Adding nums[5]=0 makes zeros=3 > k. Shrink: remove index 0,1,2,3 (skipping 1s, stopping after we drop one 0). L advances to 4. Window = [0,0], zeros=2."
}'::jsonb),
('max-consecutive-ones-iii', 6, 'R=6..9: four 1s streaming in', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [4,5,6,7,8,9],
  "highlightColor": "green",
  "pointers": {"L":4,"R":9},
  "hashmap": {"zeros":"2","best":"6"},
  "status": "Adding four 1s. len=6 → best=6. Window = [0,0,1,1,1,1] with 2 flips."
}'::jsonb),
('max-consecutive-ones-iii', 7, 'R=10: zeros=3 → shrink', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [6,7,8,9,10],
  "pointers": {"L":6,"R":10},
  "hashmap": {"zeros":"2","best":"6"},
  "status": "Adding nums[10]=0 pushes zeros to 3. Shrink past indices 4 and 5 (two zeros dropped? No — stop after the first). L=6. Window zeros=1+1=2."
}'::jsonb),
('max-consecutive-ones-iii', 8, 'Result', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1,1,0],
  "highlights": [4,5,6,7,8,9],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"6"},
  "status": "Return 6. The optimal window flips the two zeros at 4,5 and keeps the run of four 1s that follows."
}'::jsonb);


-- ── MINIMUM SIZE SUBARRAY SUM ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-size-subarray';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-size-subarray', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"7","best":"∞"},
  "status": "Given nums = [2,3,1,2,4,3], target = 7. Return the minimal length of a contiguous subarray with sum >= target. Expected: 2 ([4,3])."
}'::jsonb),
('minimum-size-subarray', 2, 'Approach: Expand then Shrink', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"sum":"0","best":"∞"},
  "status": "Grow R, accumulate sum. Whenever sum >= target, record length and shrink L to try to find a smaller valid window. All values positive → shrinking always decreases the sum monotonically."
}'::jsonb),
('minimum-size-subarray', 3, 'R=0: sum=2', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0],
  "pointers": {"L":0,"R":0},
  "hashmap": {"sum":"2","best":"∞"},
  "status": "2 < 7. Expand."
}'::jsonb),
('minimum-size-subarray', 4, 'R=1,2: sum=6', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0,1,2],
  "pointers": {"L":0,"R":2},
  "hashmap": {"sum":"6","best":"∞"},
  "status": "2+3+1 = 6 < 7."
}'::jsonb),
('minimum-size-subarray', 5, 'R=3: sum=8 ≥ 7, shrink', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":3},
  "hashmap": {"sum":"6","best":"4"},
  "status": "Sum=8, len=4. Record best=4. Shrink L: remove 2 → sum=6, L=1. 6 < 7, stop shrinking."
}'::jsonb),
('minimum-size-subarray', 6, 'R=4: sum=10, shrink twice', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"L":3,"R":4},
  "hashmap": {"sum":"6","best":"2"},
  "status": "Add 4 → sum=10, len=4, record. Shrink: drop 3 (sum=7,L=2,len=3,best=3). Drop 1 (sum=6,L=3,len=2). 6 < 7, stop. Wait — before stopping we recorded sum=7 len=3, then popped leaving sum<target. Actually len=3 update: best=3. Next step continues."
}'::jsonb),
('minimum-size-subarray', 7, 'R=5: sum=9, shrink to [4,3]', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {"L":4,"R":5},
  "hashmap": {"sum":"7","best":"2"},
  "status": "Add 3 → sum=9, len=3. Shrink: drop 2 → sum=7, L=4, len=2. best = min(3,2) = 2. Drop 4 → sum=3 < 7, stop."
}'::jsonb),
('minimum-size-subarray', 8, 'Result', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"2"},
  "status": "Return 2. Each pointer moves at most n times → O(n)."
}'::jsonb);


-- ── SUBARRAY PRODUCT LESS THAN K ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'subarray-product-less-than-k';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('subarray-product-less-than-k', 1, 'Problem Setup', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"100","count":"0"},
  "status": "Given nums = [10,5,2,6], k = 100. Count contiguous subarrays whose product is strictly less than k. Expected: 8."
}'::jsonb),
('subarray-product-less-than-k', 2, 'Approach: Sliding Window (product)', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"prod":"1","count":"0"},
  "status": "Grow R, multiply into prod. While prod >= k, divide out nums[L] and advance L. After each R, every window ending at R and starting in [L..R] is valid → add (R−L+1) to count."
}'::jsonb),
('subarray-product-less-than-k', 3, 'R=0: prod=10', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"prod":"10","count":"1"},
  "status": "10 < 100. Valid windows ending at 0: [10]. count += 1 → 1."
}'::jsonb),
('subarray-product-less-than-k', 4, 'R=1: prod=50', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"prod":"50","count":"3"},
  "status": "50 < 100. 2 new subarrays: [5], [10,5]. count = 3."
}'::jsonb),
('subarray-product-less-than-k', 5, 'R=2: prod=100 → shrink', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":2},
  "hashmap": {"prod":"10","count":"5"},
  "status": "prod = 50*2 = 100 >= 100. Divide out nums[0]=10: prod=10, L=1. Now 10 < 100. Valid subarrays ending at 2: [2], [5,2]. count += 2 → 5."
}'::jsonb),
('subarray-product-less-than-k', 6, 'R=3: prod=60', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [1,2,3],
  "highlightColor": "green",
  "pointers": {"L":1,"R":3},
  "hashmap": {"prod":"60","count":"8"},
  "status": "10 * 6 = 60 < 100. 3 new subarrays: [6], [2,6], [5,2,6]. count += 3 → 8."
}'::jsonb),
('subarray-product-less-than-k', 7, 'Why count += (R−L+1)', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {"count":"8"},
  "status": "At each R, every starting index L..R yields a valid subarray ending at R (since the whole window has product < k, any suffix of it does too). Summing (R−L+1) over R uniquely counts every valid subarray exactly once (each is identified by its right endpoint)."
}'::jsonb),
('subarray-product-less-than-k', 8, 'Result', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {"count":"8"},
  "status": "Return 8. O(n) time, O(1) space."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- BINARY-SEARCH
-- ═══════════════════════════════════════════════════════════════

-- ── BINARY SEARCH ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'binary-search';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('binary-search', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"9"},
  "status": "Given a SORTED array nums = [-1,0,3,5,9,12] and target = 9. Return the index (or -1). Expected: 4."
}'::jsonb),
('binary-search', 2, 'Approach: Halve the Range', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [0,1,2,3,4,5],
  "pointers": {"lo":0,"hi":5},
  "hashmap": {},
  "status": "Maintain [lo..hi]. Compare nums[mid] to target: if equal → done; if smaller → target is in the right half; if larger → left half. Each step halves the range → O(log n)."
}'::jsonb),
('binary-search', 3, 'Iter 1: lo=0, hi=5, mid=2', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"mid":2,"hi":5},
  "hashmap": {"nums[mid]":"3"},
  "status": "mid = (0+5)/2 = 2. nums[2] = 3 < 9 → target lies in the right half. lo = mid + 1 = 3."
}'::jsonb),
('binary-search', 4, 'Iter 2: lo=3, hi=5, mid=4', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":3,"mid":4,"hi":5},
  "hashmap": {"nums[mid]":"9"},
  "status": "mid = (3+5)/2 = 4. nums[4] = 9 == target. Match!"
}'::jsonb),
('binary-search', 5, 'Found!', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"mid":4},
  "hashmap": {"answer":"4"},
  "status": "Return mid = 4."
}'::jsonb),
('binary-search', 6, 'Miss Example — target=6', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"lo":3,"mid":3,"hi":3},
  "hashmap": {"target":"6","nums[mid]":"5"},
  "status": "If target were 6: after converging to lo=3, hi=3, mid=3, nums[3]=5 < 6 → lo=4 > hi=3. Loop exits."
}'::jsonb),
('binary-search', 7, 'Miss Result', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"-1"},
  "status": "Return -1 when lo > hi without a match."
}'::jsonb),
('binary-search', 8, 'Complexity', '{
  "type": "array",
  "array": [-1,0,3,5,9,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(log n), space O(1). Use lo + (hi − lo)/2 instead of (lo+hi)/2 to avoid integer overflow in large arrays."
}'::jsonb);


-- ── FIRST AND LAST POSITION ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'first-last-position';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('first-last-position', 1, 'Problem Setup', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"8"},
  "status": "Given a sorted nums and target = 8. Return [firstIndex, lastIndex] of target, or [-1,-1]. Expected: [3,4]."
}'::jsonb),
('first-last-position', 2, 'Approach: Two Biased Binary Searches', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Run binary search twice: first bias LEFT (on equal, move hi=mid-1 and remember index) to find the leftmost 8; then bias RIGHT (on equal, move lo=mid+1) to find the rightmost 8."
}'::jsonb),
('first-last-position', 3, 'Left Search — Iter 1', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"mid":2,"hi":5},
  "hashmap": {"nums[mid]":"7","first":"-1"},
  "status": "mid=2, nums[2]=7 < 8 → lo=3."
}'::jsonb),
('first-last-position', 4, 'Left Search — Iter 2', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":3,"mid":4,"hi":5},
  "hashmap": {"nums[mid]":"8","first":"4"},
  "status": "nums[4]=8 == target. Record first=4. Bias left: hi = mid - 1 = 3."
}'::jsonb),
('first-last-position', 5, 'Left Search — Iter 3', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"lo":3,"mid":3,"hi":3},
  "hashmap": {"nums[mid]":"8","first":"3"},
  "status": "nums[3]=8 == target. Record first=3. hi = 2 → lo > hi, exit. first = 3."
}'::jsonb),
('first-last-position', 6, 'Right Search — Iter 1', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"mid":2,"hi":5},
  "hashmap": {"nums[mid]":"7","last":"-1"},
  "status": "Reset lo=0, hi=5. mid=2, nums[2]=7 < 8 → lo=3."
}'::jsonb),
('first-last-position', 7, 'Right Search — Iter 2', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [3,4,5],
  "highlightColor": "yellow",
  "pointers": {"lo":3,"mid":4,"hi":5},
  "hashmap": {"nums[mid]":"8","last":"4"},
  "status": "nums[4]=8 == target. Record last=4. Bias right: lo = mid + 1 = 5."
}'::jsonb),
('first-last-position', 8, 'Right Search — Iter 3', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [5],
  "highlightColor": "yellow",
  "pointers": {"lo":5,"mid":5,"hi":5},
  "hashmap": {"nums[mid]":"10","last":"4"},
  "status": "nums[5]=10 > 8 → hi=4 → lo > hi, exit. last = 4."
}'::jsonb),
('first-last-position', 9, 'Result', '{
  "type": "array",
  "array": [5,7,7,8,8,10],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[3,4]"},
  "status": "Return [3, 4]. Total time: O(log n)."
}'::jsonb);


-- ── MEDIAN OF TWO SORTED ARRAYS ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'median-two-sorted';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('median-two-sorted', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"A":"[1,3]","B":"[2]"},
  "status": "Given two sorted arrays A=[1,3], B=[2]. Return the median of the merged sorted array in O(log(m+n)). Expected: 2."
}'::jsonb),
('median-two-sorted', 2, 'Approach: Binary Search a Partition', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"total":"3","half":"2"},
  "status": "Binary-search on the SHORTER array (A, size 2). Find a split i in A and j = half − i in B such that A[i−1] ≤ B[j] and B[j−1] ≤ A[i]. Then the median is determined by the boundary values."
}'::jsonb),
('median-two-sorted', 3, 'Setup Search Bounds', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [],
  "pointers": {"lo":0,"hi":2},
  "hashmap": {"half":"(2+1+1)/2 = 2"},
  "status": "Search i in [0..len(A)] = [0..2]. half = (m+n+1)/2 = 2."
}'::jsonb),
('median-two-sorted', 4, 'Iter 1: i=1, j=1', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [0,2],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"mid":1,"hi":2},
  "hashmap": {"A_left":"1","A_right":"3","B_left":"2","B_right":"∞"},
  "status": "mid = 1 → i=1, j=half−i=1. Left: A[0..0]=[1], B[0..0]=[2]. Right: A[1..]=[3], B[1..]=[]. Check A[i−1]=1 ≤ B[j]=∞ ✓ and B[j−1]=2 ≤ A[i]=3 ✓."
}'::jsonb),
('median-two-sorted', 5, 'Partition Valid', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [0,2,1],
  "highlightColor": "green",
  "pointers": {"i":1,"j":1},
  "hashmap": {"maxLeft":"max(1,2)=2","minRight":"min(3,∞)=3"},
  "status": "Left side holds {1,2}; right side holds {3}. total=3 is odd → median = maxLeft = 2."
}'::jsonb),
('median-two-sorted', 6, 'If Invalid: Adjust', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"rule":"A[i−1] > B[j] → hi = i − 1;  B[j−1] > A[i] → lo = i + 1"},
  "status": "If the check failed: when A[i−1] > B[j], A''s split is too far right, set hi = mid − 1. When B[j−1] > A[i], A''s split is too far left, set lo = mid + 1. Iterate until a valid partition is found."
}'::jsonb),
('median-two-sorted', 7, 'Even-Total Edge Case', '{
  "type": "array",
  "array": [1,2,3,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"total":"4","median":"(maxLeft + minRight) / 2"},
  "status": "When m+n is even, the median is the average of maxLeft and minRight across the valid partition."
}'::jsonb),
('median-two-sorted', 8, 'Result', '{
  "type": "array",
  "array": [1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "Return 2. Time O(log min(m,n)), space O(1)."
}'::jsonb);


-- ── REMOVE ELEMENT (binary-search / two-pointer variant) ─────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-element', 1, 'Problem Setup', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"val":"3"},
  "status": "Given nums = [3,2,2,3] and val = 3. Remove all occurrences in-place; return the new length k. Order of remaining elements doesn''t matter. Expected: k=2, nums[..k]=[2,2]."
}'::jsonb),
('remove-element', 2, 'Approach: Two-Pointer Overwrite', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {"k":0,"i":0},
  "hashmap": {},
  "status": "Walk i from left to right. Keep a write pointer k. If nums[i] != val, copy nums[i] to nums[k] and increment k. Final k is the new length."
}'::jsonb),
('remove-element', 3, 'i=0: nums[0]=3 == val, skip', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"k":0,"i":0},
  "hashmap": {},
  "status": "3 equals val → do not copy. k stays 0, i advances."
}'::jsonb),
('remove-element', 4, 'i=1: nums[1]=2, write', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"k":1,"i":1},
  "hashmap": {},
  "status": "nums[k=0] = nums[1] = 2. k=1."
}'::jsonb),
('remove-element', 5, 'i=2: nums[2]=2, write', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"k":2,"i":2},
  "hashmap": {},
  "status": "nums[k=1] = nums[2] = 2. k=2."
}'::jsonb),
('remove-element', 6, 'i=3: nums[3]=3 == val, skip', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"k":2,"i":3},
  "hashmap": {},
  "status": "3 equals val → skip."
}'::jsonb),
('remove-element', 7, 'Result', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"k":2},
  "hashmap": {"answer":"2"},
  "status": "Return k=2. nums[0..1] = [2,2]. The tail (indices ≥ k) is ignored."
}'::jsonb),
('remove-element', 8, 'Complexity', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), space O(1). Each element is visited once."
}'::jsonb);


-- ── TIME BASED KEY-VALUE STORE ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'time-based-key-value';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('time-based-key-value', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"key":"foo","timestamps":"[1,2,4]","values":"[bar,bar2,baz]"},
  "status": "Design TimeMap. After set(\"foo\",\"bar\",1), set(\"foo\",\"bar2\",2), set(\"foo\",\"baz\",4), answer get(\"foo\", 3) → the largest-timestamp value ≤ 3."
}'::jsonb),
('time-based-key-value', 2, 'Approach: Per-Key Sorted List + Binary Search', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"query_ts":"3"},
  "status": "Because set is called in nondecreasing timestamp order, each key maps to a sorted (timestamp, value) list. For get, binary-search for the largest timestamp ≤ query."
}'::jsonb),
('time-based-key-value', 3, 'get(foo, 3): init search', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [0,1,2],
  "pointers": {"lo":0,"hi":2},
  "hashmap": {"ans":"-1"},
  "status": "Run rightmost binary search: find largest index i with timestamps[i] ≤ 3."
}'::jsonb),
('time-based-key-value', 4, 'Iter 1: mid=1', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"mid":1,"hi":2},
  "hashmap": {"ts[mid]":"2","ans":"1"},
  "status": "timestamps[1] = 2 ≤ 3 → candidate. ans = mid = 1. Move right: lo = mid + 1 = 2."
}'::jsonb),
('time-based-key-value', 5, 'Iter 2: mid=2', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"lo":2,"mid":2,"hi":2},
  "hashmap": {"ts[mid]":"4","ans":"1"},
  "status": "timestamps[2] = 4 > 3 → too big. hi = mid − 1 = 1. lo > hi, exit."
}'::jsonb),
('time-based-key-value', 6, 'Final ans index = 1', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"value":"bar2"},
  "status": "timestamps[1] = 2, values[1] = \"bar2\". Return \"bar2\"."
}'::jsonb),
('time-based-key-value', 7, 'Edge: all timestamps > query', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"get(foo,0)":"\"\""},
  "status": "If no timestamp ≤ query, ans stays -1 → return empty string \"\"."
}'::jsonb),
('time-based-key-value', 8, 'Complexity', '{
  "type": "array",
  "array": [1,2,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "set: O(1) amortized (append to list). get: O(log N) per key. Space: O(N) entries across all keys."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- GREEDY
-- ═══════════════════════════════════════════════════════════════

-- ── JUMP GAME II ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'jump-game-ii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('jump-game-ii', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"jumps":"0"},
  "status": "Given nums = [2,3,1,1,4]. nums[i] is max jump length from i. Return minimum jumps to reach index n−1. Expected: 2."
}'::jsonb),
('jump-game-ii', 2, 'Approach: BFS-style Greedy', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {"i":0,"end":0,"far":0},
  "hashmap": {"jumps":"0"},
  "status": "Think of each jump as expanding a BFS frontier. Track the farthest reachable index `far`. When i reaches the current frontier `end`, commit a jump (jumps++) and extend `end` to `far`."
}'::jsonb),
('jump-game-ii', 3, 'i=0', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i":0,"end":0,"far":2},
  "hashmap": {"jumps":"0"},
  "status": "far = max(0, 0+2) = 2. i == end → jumps=1, end = far = 2."
}'::jsonb),
('jump-game-ii', 4, 'i=1', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1,"end":2,"far":4},
  "hashmap": {"jumps":"1"},
  "status": "far = max(2, 1+3) = 4. i < end, no jump yet."
}'::jsonb),
('jump-game-ii', 5, 'i=2', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i":2,"end":2,"far":4},
  "hashmap": {"jumps":"2"},
  "status": "far = max(4, 2+1) = 4. i == end → jumps=2, end = 4. We can already reach index 4 (last index). Loop ends (we stop before the last index)."
}'::jsonb),
('jump-game-ii', 6, 'Why This Is Optimal', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [0,1,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "At each jump we choose the position within the current frontier that gives the farthest next reach — a greedy choice that mirrors BFS level expansion and is provably optimal."
}'::jsonb),
('jump-game-ii', 7, 'Result', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"jumps":"2"},
  "status": "Return 2. Path: 0 → 1 → 4. O(n) time, O(1) space."
}'::jsonb);


-- ── LONGEST HAPPY STRING ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-happy-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-happy-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"a":"1","b":"1","c":"7"},
  "status": "Given a=1, b=1, c=7. Build a string using at most that many a/b/c letters with NO three same in a row. Expected length: 7 (e.g., ccaccbcc)."
}'::jsonb),
('longest-happy-string', 2, 'Approach: Greedy + Max-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(7,c),(1,b),(1,a)]","result":""},
  "status": "Always append the letter with the largest remaining count. BUT if the last two chars already equal that letter, use the 2nd-most-common instead to avoid a triple."
}'::jsonb),
('longest-happy-string', 3, 'Pop c twice: result=cc', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(5,c),(1,b),(1,a)]","result":"cc"},
  "status": "Top is c(7). Append cc (two copies allowed). c count → 5."
}'::jsonb),
('longest-happy-string', 4, 'Blocked on c → pick a', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(5,c),(1,b)]","result":"cca"},
  "status": "Top is still c but last two chars are cc → appending c would make ccc. Pop second-best a(1), append → cca. Push c back."
}'::jsonb),
('longest-happy-string', 5, 'Append cc again', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(3,c),(1,b)]","result":"ccacc"},
  "status": "Top c(5), last two are ca → safe. Append cc → ccacc. c → 3."
}'::jsonb),
('longest-happy-string', 6, 'Blocked on c → pick b', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(3,c)]","result":"ccaccb"},
  "status": "Last two cc → block c, pick b(1). Append b → ccaccb. b exhausted."
}'::jsonb),
('longest-happy-string', 7, 'Append cc one more time', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(1,c)]","result":"ccaccbcc"},
  "status": "Top c(3), last two cb → safe, append cc → ccaccbcc. c → 1."
}'::jsonb),
('longest-happy-string', 8, 'Terminate', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"result":"ccaccbcc","length":"8"},
  "status": "Only c left, last two are cc → would form ccc, and no alternative in heap. Stop. Actually best has length 7 or 8 depending on tiebreak; typical solver yields \"ccaccbcc\" length 8. Return that string."
}'::jsonb);


-- ── MINIMUM NUMBER OF PLATFORMS ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-number-of-platforms';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-number-of-platforms', 1, 'Problem Setup', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {},
  "hashmap": {"arr":"[900,940,950,1100,1500,1800]","dep":"[910,1200,1120,1130,1900,2000]"},
  "status": "Given arrival and departure times. Return the minimum platforms so no train waits. Expected: 3."
}'::jsonb),
('minimum-number-of-platforms', 2, 'Approach: Sort + Two Pointer Sweep', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {"i":0,"j":0},
  "hashmap": {"arr_sorted":"[900,940,950,1100,1500,1800]","dep_sorted":"[910,1120,1130,1200,1900,2000]"},
  "status": "Sort arrivals and departures independently. Merge-walk both: if next event is an arrival, platforms++; else platforms--. Track the max."
}'::jsonb),
('minimum-number-of-platforms', 3, 'i=0 arr=900 → platforms=1', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i":0,"j":0},
  "hashmap": {"platforms":"1","max":"1"},
  "status": "900 < 910 → arrival event. platforms=1."
}'::jsonb),
('minimum-number-of-platforms', 4, 'i=1 arr=940 → 2', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1,"j":0},
  "hashmap": {"platforms":"2","max":"2"},
  "status": "940 > 910? Yes → 910 departs first. Actually sort says dep[0]=910 < arr[1]=940 → departure event. platforms=0? Let''s redo: compare arr[i]=940 vs dep[j]=910. dep is smaller → platforms--; j=1. Now compare 940 vs 1120: arrival → platforms=1."
}'::jsonb),
('minimum-number-of-platforms', 5, 'Continue sweep', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i":2,"j":1},
  "hashmap": {"platforms":"2","max":"2"},
  "status": "arr=950 vs dep=1120 → arrival. platforms=2, max=2."
}'::jsonb),
('minimum-number-of-platforms', 6, 'Peak at 1100', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3,"j":1},
  "hashmap": {"platforms":"3","max":"3"},
  "status": "arr=1100 vs dep=1120 → arrival. platforms=3, max=3. Three trains concurrently present (940, 950, 1100)."
}'::jsonb),
('minimum-number-of-platforms', 7, 'Events drain', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [4,5],
  "pointers": {"i":6,"j":6},
  "hashmap": {"platforms":"0","max":"3"},
  "status": "Subsequent departures at 1120,1130,1200 drop platforms to 0 before arrivals 1500 and 1800 each briefly raise it to 1. max stays 3."
}'::jsonb),
('minimum-number-of-platforms', 8, 'Result', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "Return max = 3. Time O(n log n) for sort, O(n) for sweep."
}'::jsonb);


-- ── PARTITION LABELS ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'partition-labels';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('partition-labels', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s":"ababcbacadefegdehijhklij"},
  "status": "Partition the string so each letter appears in at most one part; return part sizes. Expected: [9,7,8]."
}'::jsonb),
('partition-labels', 2, 'Approach: Last-Index Map + Greedy', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"last(a)":"8","last(b)":"5","last(c)":"7","last(d)":"14","last(e)":"15","last(f)":"11","last(g)":"13","last(h)":"19","last(i)":"22","last(j)":"23","last(k)":"20","last(l)":"21"},
  "status": "Precompute last[c] = last index where character c appears. Sweep i, track end = max(end, last[s[i]]); when i == end, cut here."
}'::jsonb),
('partition-labels', 3, 'Sweep i=0..8, part 1', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [0,1,2,3,4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {"i":8,"end":8},
  "hashmap": {"start":"0","part":"9"},
  "status": "a → end=8. b → end=max(8,5)=8. c → end=max(8,7)=8. At i=8, i==end → cut. Part length = 8−0+1 = 9."
}'::jsonb),
('partition-labels', 4, 'i=9..15, part 2', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [9,10,11,12,13,14,15],
  "highlightColor": "green",
  "pointers": {"i":15,"end":15},
  "hashmap": {"start":"9","part":"7"},
  "status": "d → end=14. e → end=15. f → 15. g → 15. d → 15. e → 15. At i=15, cut. Length = 7."
}'::jsonb),
('partition-labels', 5, 'i=16..23, part 3', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [16,17,18,19,20,21,22,23],
  "highlightColor": "green",
  "pointers": {"i":23,"end":23},
  "hashmap": {"start":"16","part":"8"},
  "status": "h → 19. i → 22. j → 23. At i=23, cut. Length = 8."
}'::jsonb),
('partition-labels', 6, 'Why Greedy Works', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "A part must contain all occurrences of every letter it includes. Extending end to max(end, last[c]) is forced. Cutting as soon as i==end yields the smallest valid parts — so the maximum number of parts, equivalently partition."
}'::jsonb),
('partition-labels', 7, 'Result', '{
  "type": "array",
  "array": ["a","b","a","b","c","b","a","c","a","d","e","f","e","g","d","e","h","i","j","h","k","l","i","j"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"[9,7,8]"},
  "status": "Return [9, 7, 8]. Two linear passes → O(n) time, O(1) extra space (26-letter map)."
}'::jsonb);


-- ── VALID PARENTHESIS STRING ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-parenthesis-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-parenthesis-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s":"(*)"},
  "status": "Given s with ''('', '')'', ''*'' where ''*'' can be ''('', '')'', or empty. Return true if s can be made valid. Expected: true."
}'::jsonb),
('valid-parenthesis-string', 2, 'Approach: Range of Open Counts [lo..hi]', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [],
  "pointers": {"lo":0,"hi":0},
  "hashmap": {},
  "status": "Track two counters: lo = minimum possible number of unmatched ''('' so far (treat ''*'' as '')''), hi = maximum possible (treat ''*'' as ''(''). If hi ever drops below 0, impossible. Clamp lo to 0. At the end, return lo == 0."
}'::jsonb),
('valid-parenthesis-string', 3, 'i=0: ''(''', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"lo":1,"hi":1},
  "hashmap": {},
  "status": "Open paren. lo++, hi++ → lo=1, hi=1."
}'::jsonb),
('valid-parenthesis-string', 4, 'i=1: ''*''', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"lo":0,"hi":2},
  "hashmap": {},
  "status": "Wildcard: lo-- (treat as '')''), hi++ (treat as ''(''), clamp lo to 0. lo=0, hi=2."
}'::jsonb),
('valid-parenthesis-string', 5, 'i=2: '')''', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"lo":0,"hi":1},
  "hashmap": {},
  "status": "Close paren. lo-- (clamped to 0), hi--. lo=0, hi=1. hi never went negative → still feasible."
}'::jsonb),
('valid-parenthesis-string', 6, 'Check hi >= 0 After Each Step', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If at any character hi < 0, there are too many '')''s for even the most generous interpretation → return false immediately."
}'::jsonb),
('valid-parenthesis-string', 7, 'End: lo == 0?', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [],
  "pointers": {"lo":0,"hi":1},
  "hashmap": {"answer":"true"},
  "status": "lo = 0 means there exists an interpretation in which every ''('' is matched. Return true."
}'::jsonb),
('valid-parenthesis-string', 8, 'Result', '{
  "type": "array",
  "array": ["(","*",")"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Return true. O(n) time, O(1) space — no stack needed."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- INTERVALS
-- ═══════════════════════════════════════════════════════════════

-- ── INTERVAL LIST INTERSECTIONS ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'interval-list-intersections';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('interval-list-intersections', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [],
  "pointers": {},
  "hashmap": {"A":"[[0,2],[5,10],[13,23],[24,25]]","B":"[[1,5],[8,12],[15,24],[25,26]]"},
  "status": "Given two sorted lists of disjoint closed intervals. Return their intersection. Expected: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]."
}'::jsonb),
('interval-list-intersections', 2, 'Approach: Two Pointers over Intervals', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [],
  "pointers": {"i":0,"j":0},
  "hashmap": {},
  "status": "For A[i] and B[j], overlap = [max(A.start,B.start), min(A.end,B.end)]. If start ≤ end, push. Then advance whichever interval ends first (its end is discarded since the other list is sorted)."
}'::jsonb),
('interval-list-intersections', 3, 'i=0,j=0: A=[0,2], B=[1,5]', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"i":0,"j":0},
  "hashmap": {"overlap":"[1,2]"},
  "status": "lo=max(0,1)=1, hi=min(2,5)=2. 1 ≤ 2 → push [1,2]. A ends first → i=1."
}'::jsonb),
('interval-list-intersections', 4, 'i=1,j=0: A=[5,10], B=[1,5]', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {"i":1,"j":0},
  "hashmap": {"overlap":"[5,5]"},
  "status": "lo=5, hi=5. Push [5,5]. B ends first → j=1."
}'::jsonb),
('interval-list-intersections', 5, 'i=1,j=1: A=[5,10], B=[8,12]', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {"i":1,"j":1},
  "hashmap": {"overlap":"[8,10]"},
  "status": "lo=8, hi=10. Push [8,10]. A ends first → i=2."
}'::jsonb),
('interval-list-intersections', 6, 'i=2,j=1: A=[13,23], B=[8,12]', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [4,5],
  "pointers": {"i":2,"j":1},
  "hashmap": {"overlap":"none"},
  "status": "lo=13, hi=12. Start > end → no overlap. B ends first → j=2."
}'::jsonb),
('interval-list-intersections', 7, 'Continue through both lists', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [4,5,6,7],
  "highlightColor": "yellow",
  "pointers": {"i":3,"j":3},
  "hashmap": {"pushes":"[15,23],[24,24],[25,25]"},
  "status": "A=[13,23]∩B=[15,24]=[15,23]; A=[24,25]∩B=[15,24]=[24,24]; A=[24,25]∩B=[25,26]=[25,25]. After each push, advance the pointer of whichever ends first."
}'::jsonb),
('interval-list-intersections', 8, 'Result', '{
  "type": "array",
  "array": [0,2,5,10,13,23,24,25],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]"},
  "status": "Return 6 intersections. O(m+n) time."
}'::jsonb);


-- ── INTERVAL SCHEDULING MAXIMIZATION ─────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'interval-scheduling-maximization';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('interval-scheduling-maximization', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"intervals":"[[1,3],[2,4],[3,6],[5,7],[6,8]]"},
  "status": "Pick the largest set of mutually non-overlapping intervals. Expected: 3 (e.g., [1,3], [3,6]? No — [1,3],[3,6] touch; typical rule end ≤ start counts as non-overlap. Here answer is 3: [1,3],[3,6],[6,8])."
}'::jsonb),
('interval-scheduling-maximization', 2, 'Approach: Greedy by Earliest End', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sorted":"[[1,3],[2,4],[3,6],[5,7],[6,8]]"},
  "status": "Sort by END time. Walk through: if an interval starts at or after the last-selected end, pick it."
}'::jsonb),
('interval-scheduling-maximization', 3, 'Pick [1,3]', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"kept":"1","end":"3"},
  "status": "First interval always picked. end=3."
}'::jsonb),
('interval-scheduling-maximization', 4, 'Skip [2,4]', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [2,3],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"kept":"1","end":"3"},
  "status": "start=2 < end=3. Overlaps with [1,3] → skip."
}'::jsonb),
('interval-scheduling-maximization', 5, 'Pick [3,6]', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"kept":"2","end":"6"},
  "status": "start=3 ≥ end=3 → compatible. Pick. end=6."
}'::jsonb),
('interval-scheduling-maximization', 6, 'Skip [5,7]', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [6,7],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"kept":"2","end":"6"},
  "status": "start=5 < 6 → overlap, skip."
}'::jsonb),
('interval-scheduling-maximization', 7, 'Pick [6,8]', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [8,9],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"kept":"3","end":"8"},
  "status": "start=6 ≥ 6 → pick. end=8."
}'::jsonb),
('interval-scheduling-maximization', 8, 'Result', '{
  "type": "array",
  "array": [1,3,2,4,3,6,5,7,6,8],
  "highlights": [0,1,4,5,8,9],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "Keep [[1,3],[3,6],[6,8]] → 3 intervals. Sorting by end greedily maximizes remaining capacity, proven optimal by exchange argument."
}'::jsonb);


-- ── MEETING ROOMS I ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'meeting-rooms-i';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('meeting-rooms-i', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,30,5,10,15,20],
  "highlights": [],
  "pointers": {},
  "hashmap": {"intervals":"[[0,30],[5,10],[15,20]]"},
  "status": "Can a single person attend ALL meetings (no overlaps)? Expected: false."
}'::jsonb),
('meeting-rooms-i', 2, 'Approach: Sort + Adjacent Overlap Check', '{
  "type": "array",
  "array": [0,30,5,10,15,20],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sorted_by_start":"[[0,30],[5,10],[15,20]]"},
  "status": "Sort by start. If any consecutive pair has next.start < prev.end → overlap → return false. Else true."
}'::jsonb),
('meeting-rooms-i', 3, 'Pair [0,30] & [5,10]', '{
  "type": "array",
  "array": [0,30,5,10,15,20],
  "highlights": [0,1,2,3],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"prev.end":"30","cur.start":"5"},
  "status": "5 < 30 → OVERLAP detected. Cannot attend all."
}'::jsonb),
('meeting-rooms-i', 4, 'Early Return', '{
  "type": "array",
  "array": [0,30,5,10,15,20],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"false"},
  "status": "Return false immediately — no need to check the rest."
}'::jsonb),
('meeting-rooms-i', 5, 'Counterexample: [[7,10],[2,4]]', '{
  "type": "array",
  "array": [7,10,2,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sorted":"[[2,4],[7,10]]"},
  "status": "Sorted: [[2,4],[7,10]]. Pair check: 7 ≥ 4 → no overlap. Return true."
}'::jsonb),
('meeting-rooms-i', 6, 'Edge: [[1,5],[5,8]]', '{
  "type": "array",
  "array": [1,5,5,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Touching endpoints (end == next.start) do NOT count as overlap. Return true."
}'::jsonb),
('meeting-rooms-i', 7, 'Result', '{
  "type": "array",
  "array": [0,30,5,10,15,20],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"false"},
  "status": "For the given input, return false. O(n log n) time, O(1) extra space."
}'::jsonb);


-- ── MINIMUM ARROWS TO BURST BALLOONS ─────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-arrows';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-arrows', 1, 'Problem Setup', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"balloons":"[[10,16],[2,8],[1,6],[7,12]]"},
  "status": "Each balloon is a horizontal interval [xstart, xend]. An arrow shot at x bursts every balloon with xstart ≤ x ≤ xend. Minimum arrows? Expected: 2."
}'::jsonb),
('minimum-arrows', 2, 'Approach: Sort by End, Greedy Shots', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"sorted":"[[1,6],[2,8],[7,12],[10,16]]"},
  "status": "Sort by END. Shoot the first arrow at the first balloon''s end; this bursts all subsequent balloons whose start ≤ that end. When we see a balloon starting strictly after the current arrow, shoot a new one."
}'::jsonb),
('minimum-arrows', 3, 'Arrow 1 at x=6', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"arrow":"6","arrows":"1"},
  "status": "First balloon [1,6]: shoot at 6. Pop [1,6]."
}'::jsonb),
('minimum-arrows', 4, '[2,8] covered by x=6', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"arrow":"6","arrows":"1"},
  "status": "Next balloon [2,8]: 2 ≤ 6 ≤ 8 → already burst by arrow at 6. No new arrow."
}'::jsonb),
('minimum-arrows', 5, '[7,12]: start > 6, new arrow', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [6,7],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"arrow":"12","arrows":"2"},
  "status": "7 > 6 → first arrow misses. Shoot arrow 2 at end of [7,12], i.e., x=12."
}'::jsonb),
('minimum-arrows', 6, '[10,16] covered by x=12', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"arrow":"12","arrows":"2"},
  "status": "10 ≤ 12 ≤ 16 → burst by arrow 2."
}'::jsonb),
('minimum-arrows', 7, 'Why Sort by End?', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Placing each arrow as late as possible (at the earliest end) maximizes overlap with future balloons while still guaranteed to pop the current one. Standard activity-selection proof."
}'::jsonb),
('minimum-arrows', 8, 'Result', '{
  "type": "array",
  "array": [10,16,2,8,1,6,7,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "Return 2. O(n log n) for sort; O(n) sweep."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- HEAP
-- ═══════════════════════════════════════════════════════════════

-- ── FIND MEDIAN FROM DATA STREAM ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'find-median-data-stream';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-median-data-stream', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stream":"add 1, add 2, findMedian, add 3, findMedian"},
  "status": "Design MedianFinder supporting addNum and findMedian on a stream. Expected medians: 1.5, then 2."
}'::jsonb),
('find-median-data-stream', 2, 'Approach: Two Heaps', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[]","minHeap":"[]"},
  "status": "Keep a max-heap for the LOWER half and a min-heap for the UPPER half. Invariants: (1) every max-heap element ≤ every min-heap element; (2) size(max) == size(min) OR size(max) == size(min) + 1."
}'::jsonb),
('find-median-data-stream', 3, 'add(1)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[1]","minHeap":"[]"},
  "status": "Empty so far. Push into maxHeap. Size: (1,0) — valid."
}'::jsonb),
('find-median-data-stream', 4, 'add(2)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[1]","minHeap":"[2]"},
  "status": "2 > maxHeap.top=1, so push 2 into minHeap. Sizes (1,1) — balanced."
}'::jsonb),
('find-median-data-stream', 5, 'findMedian → 1.5', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[1]","minHeap":"[2]","median":"1.5"},
  "status": "Equal sizes → median = (max.top + min.top) / 2 = (1 + 2) / 2 = 1.5."
}'::jsonb),
('find-median-data-stream', 6, 'add(3)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[1]","minHeap":"[2,3]"},
  "status": "3 ≥ maxHeap.top=1 → push to minHeap. Sizes (1,2) — imbalance. Rebalance: pop min.top=2, push to maxHeap. Now (2,1)."
}'::jsonb),
('find-median-data-stream', 7, 'After Rebalance', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[2,1]","minHeap":"[3]"},
  "status": "maxHeap = {2,1} (root 2), minHeap = {3}. Invariants hold."
}'::jsonb),
('find-median-data-stream', 8, 'findMedian → 2', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"maxHeap":"[2,1]","minHeap":"[3]","median":"2"},
  "status": "Uneven sizes → median = maxHeap.top = 2."
}'::jsonb),
('find-median-data-stream', 9, 'Complexity', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "addNum: O(log n). findMedian: O(1). Space: O(n)."
}'::jsonb);


-- ── REORGANIZE STRING ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reorganize-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reorganize-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","a","a","b","b","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s":"aaabbc"},
  "status": "Rearrange s = \"aaabbc\" so no two adjacent characters are equal, or return \"\". Expected: e.g., \"ababac\"."
}'::jsonb),
('reorganize-string', 2, 'Feasibility Check', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"count(a)":"3","count(b)":"2","count(c)":"1","maxAllowed":"(6+1)/2 = 3"},
  "status": "If the most frequent character appears more than (n+1)/2 times → impossible, return \"\". Here a=3 ≤ 3 → feasible."
}'::jsonb),
('reorganize-string', 3, 'Approach: Max-Heap of Counts', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(3,a),(2,b),(1,c)]","result":""},
  "status": "Repeatedly pop the TOP TWO most frequent letters, emit them, decrement counts, push back if still positive. This guarantees no two identical letters end up adjacent."
}'::jsonb),
('reorganize-string', 4, 'Pop a,b → ab', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,a),(1,b),(1,c)]","result":"ab"},
  "status": "Append a then b. Decrement both. Push back."
}'::jsonb),
('reorganize-string', 5, 'Pop a,b → abab', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(1,a),(1,c)]","result":"abab"},
  "status": "a(2) & b(1) popped, b exhausted. Append \"ab\"."
}'::jsonb),
('reorganize-string', 6, 'Pop a,c → ababac', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[]","result":"ababac"},
  "status": "Append \"ac\". All counts exhausted."
}'::jsonb),
('reorganize-string', 7, 'Why it Works', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Taking the two highest-count letters on each step ensures the dominant letter is never used twice in a row. It also uses up supply evenly so we don''t run out of partners for the top letter."
}'::jsonb),
('reorganize-string', 8, 'Result', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"ababac"},
  "status": "Return \"ababac\" (one valid arrangement). Complexity: O(n log k) where k = alphabet size."
}'::jsonb);


-- ── SORT CHARACTERS BY FREQUENCY ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sort-characters-by-frequency';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sort-characters-by-frequency', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["t","r","e","e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s":"tree"},
  "status": "Given s = \"tree\". Sort chars by decreasing frequency. Expected: \"eert\" or \"eetr\"."
}'::jsonb),
('sort-characters-by-frequency', 2, 'Approach: Count + Max-Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts":"{t:1, r:1, e:2}"},
  "status": "Count occurrences. Push (count, char) into a max-heap. Repeatedly pop and emit char*count."
}'::jsonb),
('sort-characters-by-frequency', 3, 'Build Heap', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,e),(1,t),(1,r)]"},
  "status": "Push all three (count, char) pairs. Root is (2, e)."
}'::jsonb),
('sort-characters-by-frequency', 4, 'Pop (2,e) → \"ee\"', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(1,t),(1,r)]","result":"ee"},
  "status": "Emit \"e\" twice."
}'::jsonb),
('sort-characters-by-frequency', 5, 'Pop (1,t) → \"eet\"', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(1,r)]","result":"eet"},
  "status": "Emit \"t\"."
}'::jsonb),
('sort-characters-by-frequency', 6, 'Pop (1,r) → \"eetr\"', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[]","result":"eetr"},
  "status": "Emit \"r\"."
}'::jsonb),
('sort-characters-by-frequency', 7, 'Alternative: Bucket Sort', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Because counts ≤ n, buckets[count] = list of chars yields O(n) total — faster than the heap''s O(n log k)."
}'::jsonb),
('sort-characters-by-frequency', 8, 'Result', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"eetr"},
  "status": "Return \"eetr\" (or any valid sort)."
}'::jsonb);


-- ── TOP K FREQUENT WORDS ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'top-k-frequent-words';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('top-k-frequent-words', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["i","love","leetcode","i","love","coding"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"2"},
  "status": "Return the k=2 most frequent words. Tie-break: lexicographically smaller first. Expected: [\"i\",\"love\"]."
}'::jsonb),
('top-k-frequent-words', 2, 'Approach: Count + Min-Heap of size k', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts":"{i:2, love:2, leetcode:1, coding:1}"},
  "status": "Compare by (count asc, word desc) so that on overflow we pop the WORST candidate. Keep heap size ≤ k."
}'::jsonb),
('top-k-frequent-words', 3, 'Push (2, i)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,i)]"},
  "status": "Heap size 1 ≤ 2."
}'::jsonb),
('top-k-frequent-words', 4, 'Push (2, love)', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,love),(2,i)]"},
  "status": "Size 2. Order by our key: smallest is (2, love) because \"love\" > \"i\" lexicographically means \"love\" loses in tiebreak (we want lex-smaller on TOP of output → worst at heap root)."
}'::jsonb),
('top-k-frequent-words', 5, 'Push (1, leetcode), pop worst', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,love),(2,i)]","popped":"(1,leetcode)"},
  "status": "Size > k. Root by our ordering is (1, leetcode) — lowest count → pop. Heap unchanged effectively."
}'::jsonb),
('top-k-frequent-words', 6, 'Push (1, coding), pop worst', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"heap":"[(2,love),(2,i)]","popped":"(1,coding)"},
  "status": "Same — count 1 loses."
}'::jsonb),
('top-k-frequent-words', 7, 'Extract & Reverse', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stack":"[love, i]"},
  "status": "Pop heap twice: first (2,love), then (2,i). Reverse list → [\"i\", \"love\"]."
}'::jsonb),
('top-k-frequent-words', 8, 'Result', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"[i, love]"},
  "status": "Return [\"i\", \"love\"]. Time O(n log k)."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- BACKTRACKING
-- ═══════════════════════════════════════════════════════════════

-- ── COMBINATION SUM II ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'combination-sum-ii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('combination-sum-ii', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[], t=8","state":"current"}],
  "edges": [],
  "hashmap": {"candidates":"[10,1,2,7,6,1,5]","target":"8"},
  "status": "Find all unique combinations summing to 8. Each number used at most once; no duplicate combinations in output. Expected: [[1,1,6],[1,2,5],[1,7],[2,6]]."
}'::jsonb),
('combination-sum-ii', 2, 'Approach: Sort + Backtrack with Skip-Duplicate', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"sorted:[1,1,2,5,6,7,10]","state":"unvisited"}],
  "edges": [],
  "hashmap": {},
  "status": "Sort so duplicates are adjacent. At each depth, iterate i from start..n; skip i > start AND arr[i] == arr[i-1] (same value already tried at this depth)."
}'::jsonb),
('combination-sum-ii', 3, 'Pick 1 at index 0', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"n1","value":"[1] t=7","state":"current"}],
  "edges": [{"parent":"root","child":"n1","side":"left"}],
  "hashmap": {"path":"[1]","remaining":"7"},
  "status": "Enter the ''1'' branch. Recurse with start=1."
}'::jsonb),
('combination-sum-ii', 4, 'Pick second 1 → [1,1] t=6', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"n1","value":"[1]","state":"visited"},{"id":"n2","value":"[1,1] t=6","state":"current"}],
  "edges": [{"parent":"root","child":"n1","side":"left"},{"parent":"n1","child":"n2","side":"left"}],
  "hashmap": {"path":"[1,1]","remaining":"6"},
  "status": "Take the second 1 (index 1)."
}'::jsonb),
('combination-sum-ii', 5, 'Pick 6 → [1,1,6] = 8 ✓', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"n1","value":"[1]","state":"visited"},{"id":"n2","value":"[1,1]","state":"visited"},{"id":"n3","value":"[1,1,6] ✓","state":"current"}],
  "edges": [{"parent":"root","child":"n1","side":"left"},{"parent":"n1","child":"n2","side":"left"},{"parent":"n2","child":"n3","side":"right"}],
  "hashmap": {"found":"[1,1,6]"},
  "status": "Hit target. Record combo. Backtrack."
}'::jsonb),
('combination-sum-ii', 6, 'Backtrack → [1,2], pick 5 → [1,2,5] ✓', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"n1","value":"[1]","state":"current"},{"id":"n4","value":"[1,2]","state":"visited"},{"id":"n5","value":"[1,2,5] ✓","state":"current"}],
  "edges": [{"parent":"root","child":"n1","side":"left"},{"parent":"n1","child":"n4","side":"right"},{"parent":"n4","child":"n5","side":"left"}],
  "hashmap": {"found":"[1,2,5]"},
  "status": "Pop back to n1 with path=[1]. Try next candidate 2, then 5 → sum 8."
}'::jsonb),
('combination-sum-ii', 7, 'Pick 7 → [1,7] ✓; skip second 1 at depth 0', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"current"},{"id":"n6","value":"[1,7] ✓","state":"current"},{"id":"skip","value":"skip i=1 (dup)","state":"unvisited"}],
  "edges": [{"parent":"root","child":"n6","side":"left"},{"parent":"root","child":"skip","side":"right"}],
  "hashmap": {"rule":"i>start && arr[i]==arr[i-1] → skip"},
  "status": "Also [1,7] found. At root, when moving past index 0 to index 1, both are ''1'' → skip to prevent a duplicate combination set."
}'::jsonb),
('combination-sum-ii', 8, 'Branch 2: pick 2 → [2,6] ✓', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"b2","value":"[2]","state":"visited"},{"id":"b2c","value":"[2,6] ✓","state":"current"}],
  "edges": [{"parent":"root","child":"b2","side":"right"},{"parent":"b2","child":"b2c","side":"left"}],
  "hashmap": {"found":"[2,6]"},
  "status": "From root, pick 2, then 6. Sum 8. Record."
}'::jsonb),
('combination-sum-ii', 9, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"done","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"[[1,1,6],[1,2,5],[1,7],[2,6]]"},
  "status": "Four unique combinations. Pruning: break when running sum > target (sorted). Time worst case O(2^n) but pruning makes it much faster."
}'::jsonb);


-- ── LETTER COMBINATIONS OF A PHONE NUMBER ────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'letter-combinations';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('letter-combinations', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"\"\"","state":"current"}],
  "edges": [],
  "hashmap": {"digits":"23","2":"abc","3":"def"},
  "status": "Given digits = \"23\". Return all letter combos. Expected: [ad,ae,af,bd,be,bf,cd,ce,cf] (9 entries)."
}'::jsonb),
('letter-combinations', 2, 'Approach: DFS Backtracking', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"\"\"","state":"current"}],
  "edges": [],
  "hashmap": {},
  "status": "At depth i, iterate the letters mapped to digits[i]. Append, recurse to depth i+1, then pop. When depth == len(digits), save the current string."
}'::jsonb),
('letter-combinations', 3, 'Depth 0: ''a'' branch', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"\"\"","state":"visited"},{"id":"a","value":"\"a\"","state":"current"}],
  "edges": [{"parent":"root","child":"a","side":"left"}],
  "hashmap": {"path":"a"},
  "status": "Pick ''a'' for digit 2."
}'::jsonb),
('letter-combinations', 4, 'Depth 1 under a: d,e,f', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"\"\"","state":"visited"},{"id":"a","value":"\"a\"","state":"visited"},{"id":"ad","value":"\"ad\" ✓","state":"current"},{"id":"ae","value":"\"ae\" ✓","state":"unvisited"},{"id":"af","value":"\"af\" ✓","state":"unvisited"}],
  "edges": [{"parent":"root","child":"a","side":"left"},{"parent":"a","child":"ad","side":"left"},{"parent":"a","child":"ae","side":"right"},{"parent":"a","child":"af","side":"right"}],
  "hashmap": {"saved":"[ad,ae,af]"},
  "status": "Each leaf at depth 2 saves a combo."
}'::jsonb),
('letter-combinations', 5, 'Backtrack to root, pick ''b''', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"\"\"","state":"current"},{"id":"b","value":"\"b\"","state":"current"}],
  "edges": [{"parent":"root","child":"b","side":"right"}],
  "hashmap": {"path":"b"},
  "status": "Pop ''a'', push ''b''."
}'::jsonb),
('letter-combinations', 6, 'Depth 1 under b: d,e,f', '{
  "type": "tree",
  "nodes": [{"id":"b","value":"\"b\"","state":"visited"},{"id":"bd","value":"\"bd\" ✓","state":"current"},{"id":"be","value":"\"be\" ✓","state":"unvisited"},{"id":"bf","value":"\"bf\" ✓","state":"unvisited"}],
  "edges": [{"parent":"b","child":"bd","side":"left"},{"parent":"b","child":"be","side":"right"},{"parent":"b","child":"bf","side":"right"}],
  "hashmap": {"saved":"[ad,ae,af,bd,be,bf]"},
  "status": "Three more combos."
}'::jsonb),
('letter-combinations', 7, 'Branch ''c'' same pattern', '{
  "type": "tree",
  "nodes": [{"id":"c","value":"\"c\"","state":"visited"},{"id":"cd","value":"\"cd\" ✓","state":"current"},{"id":"ce","value":"\"ce\" ✓","state":"unvisited"},{"id":"cf","value":"\"cf\" ✓","state":"unvisited"}],
  "edges": [{"parent":"c","child":"cd","side":"left"},{"parent":"c","child":"ce","side":"right"},{"parent":"c","child":"cf","side":"right"}],
  "hashmap": {"saved":"9 combos total"},
  "status": "Final three."
}'::jsonb),
('letter-combinations', 8, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"done","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"[ad,ae,af,bd,be,bf,cd,ce,cf]"},
  "status": "9 combinations. Time O(3^m · 4^n) where m/n are 3-letter / 4-letter digit counts."
}'::jsonb);


-- ── N-QUEENS ─────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'n-queens';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('n-queens', 1, 'Problem Setup', '{
  "type": "array",
  "array": [".",".",".","."],
  "highlights": [],
  "pointers": {"row":0},
  "hashmap": {"n":"4","row0":"....","row1":"....","row2":"....","row3":"...."},
  "status": "Place 4 queens on a 4×4 board so none attack each other. Return all distinct solutions. Expected: 2 solutions."
}'::jsonb),
('n-queens', 2, 'Approach: Row-by-Row Backtracking', '{
  "type": "array",
  "array": [".",".",".","."],
  "highlights": [],
  "pointers": {"row":0},
  "hashmap": {"cols":"∅","diag1":"∅","diag2":"∅"},
  "status": "For row r, try each column c: skip if c ∈ cols, r−c ∈ diag1, or r+c ∈ diag2. Otherwise place, recurse to r+1, then remove."
}'::jsonb),
('n-queens', 3, 'Row 0 col 0 conflicts, try col 1', '{
  "type": "array",
  "array": [".","Q",".","."],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"row":0},
  "hashmap": {"cols":"{1}","diag1":"{-1}","diag2":"{1}","row0":".Q..","row1":"....","row2":"....","row3":"...."},
  "status": "Col 0 works but leads to dead-end (try col 0 first in DFS — here we jump to showing the surviving branch). Placing at (0,1)."
}'::jsonb),
('n-queens', 4, 'Row 1: must skip cols 0,1,2', '{
  "type": "array",
  "array": [".",".",".","Q"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"row":1},
  "hashmap": {"cols":"{1,3}","diag1":"{-1,-2}","diag2":"{1,4}","row0":".Q..","row1":"...Q","row2":"....","row3":"...."},
  "status": "Col 0: diag2=1 conflict. Col 1: cols. Col 2: diag1=-1? 1-2=-1 ∈ diag1. Col 3 OK → place."
}'::jsonb),
('n-queens', 5, 'Row 2: only col 0 works', '{
  "type": "array",
  "array": ["Q",".",".","."],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"row":2},
  "hashmap": {"cols":"{0,1,3}","row0":".Q..","row1":"...Q","row2":"Q...","row3":"...."},
  "status": "Col 0 passes all three checks → place."
}'::jsonb),
('n-queens', 6, 'Row 3: col 2 works → SOLUTION 1', '{
  "type": "array",
  "array": [".",".","Q","."],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"row":3},
  "hashmap": {"row0":".Q..","row1":"...Q","row2":"Q...","row3":"..Q.","solutions":"1"},
  "status": "row=n → record this board. Backtrack."
}'::jsonb),
('n-queens', 7, 'Backtrack & Find Mirror Solution', '{
  "type": "array",
  "array": [".",".","Q","."],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"row":0},
  "hashmap": {"row0":"..Q.","row1":"Q...","row2":"...Q","row3":".Q..","solutions":"2"},
  "status": "Backtrack all the way. Try (0,2) as the starting column. By symmetry, (0,2)-(1,0)-(2,3)-(3,1) also works."
}'::jsonb),
('n-queens', 8, 'Pruning Power', '{
  "type": "array",
  "array": [".",".",".","."],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Three O(1) hash-set checks replace iterating prior queens. Huge prune for larger n (e.g., n=8 visits only ~2000 nodes vs 4^8 ≈ 65k without pruning)."
}'::jsonb),
('n-queens', 9, 'Result', '{
  "type": "array",
  "array": [".",".",".","."],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"2 solutions"},
  "status": "Return both board configurations."
}'::jsonb);


-- ── PALINDROME PARTITIONING ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'palindrome-partitioning';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('palindrome-partitioning', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"s=aab","state":"current"}],
  "edges": [],
  "hashmap": {"s":"aab"},
  "status": "Return all ways to partition s so every part is a palindrome. Expected: [[a,a,b],[aa,b]]."
}'::jsonb),
('palindrome-partitioning', 2, 'Approach: DFS over Cuts', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"start=0","state":"current"}],
  "edges": [],
  "hashmap": {},
  "status": "From position start, try every end ∈ [start..n-1]. If s[start..end] is a palindrome, add to path, recurse with start=end+1. When start == n, save path."
}'::jsonb),
('palindrome-partitioning', 3, 'Cut ''a'' at 0..0', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"visited"},{"id":"a","value":"[a] s=ab","state":"current"}],
  "edges": [{"parent":"root","child":"a","side":"left"}],
  "hashmap": {"path":"[a]"},
  "status": "\"a\" is a palindrome. Recurse on \"ab\"."
}'::jsonb),
('palindrome-partitioning', 4, 'Cut ''a'' again → [a,a]', '{
  "type": "tree",
  "nodes": [{"id":"a","value":"[a]","state":"visited"},{"id":"aa","value":"[a,a] s=b","state":"current"}],
  "edges": [{"parent":"a","child":"aa","side":"left"}],
  "hashmap": {"path":"[a,a]"},
  "status": "Another palindrome. Remaining \"b\"."
}'::jsonb),
('palindrome-partitioning', 5, 'Cut ''b'' → SOLUTION [a,a,b]', '{
  "type": "tree",
  "nodes": [{"id":"aa","value":"[a,a]","state":"visited"},{"id":"aab","value":"[a,a,b] ✓","state":"current"}],
  "edges": [{"parent":"aa","child":"aab","side":"left"}],
  "hashmap": {"saved":"[[a,a,b]]"},
  "status": "start == n. Save. Backtrack."
}'::jsonb),
('palindrome-partitioning', 6, 'Try [a,ab]? ab not palindrome', '{
  "type": "tree",
  "nodes": [{"id":"a","value":"[a]","state":"current"},{"id":"xab","value":"[a,ab] ✗","state":"unvisited"}],
  "edges": [{"parent":"a","child":"xab","side":"right"}],
  "hashmap": {"check":"ab reversed is ba → no"},
  "status": "Skip this branch."
}'::jsonb),
('palindrome-partitioning', 7, 'Backtrack to root, try [aa]', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"[]","state":"current"},{"id":"aaNode","value":"[aa] s=b","state":"current"}],
  "edges": [{"parent":"root","child":"aaNode","side":"right"}],
  "hashmap": {"path":"[aa]"},
  "status": "\"aa\" at 0..1 is a palindrome. Recurse on \"b\"."
}'::jsonb),
('palindrome-partitioning', 8, 'Cut ''b'' → SOLUTION [aa,b]', '{
  "type": "tree",
  "nodes": [{"id":"aaNode","value":"[aa]","state":"visited"},{"id":"aab2","value":"[aa,b] ✓","state":"current"}],
  "edges": [{"parent":"aaNode","child":"aab2","side":"left"}],
  "hashmap": {"saved":"[[a,a,b],[aa,b]]"},
  "status": "Save second solution."
}'::jsonb),
('palindrome-partitioning', 9, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"done","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"[[a,a,b],[aa,b]]"},
  "status": "Return 2 partitions. Branches prune immediately when a prefix isn''t a palindrome. Worst-case O(n · 2^n)."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- TRIES
-- ═══════════════════════════════════════════════════════════════

-- ── LONGEST WORD IN DICTIONARY ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-word-dictionary';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-word-dictionary', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"current"}],
  "edges": [],
  "hashmap": {"words":"[w,wo,wor,worl,world]"},
  "status": "Return the longest word that can be built one letter at a time by other words in the list. Tiebreak: lexicographically smallest. Expected: \"world\"."
}'::jsonb),
('longest-word-dictionary', 2, 'Approach: Trie + DFS Only Through End-Marked Chains', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"current"},{"id":"w","value":"w","state":"unvisited"}],
  "edges": [{"parent":"root","child":"w","side":"left"}],
  "hashmap": {},
  "status": "Insert all words. DFS from root, but only descend into a child whose node is marked as the end of SOME word. The deepest such chain is the answer."
}'::jsonb),
('longest-word-dictionary', 3, 'Visit w (end)', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"},{"id":"w","value":"w✓","state":"current"}],
  "edges": [{"parent":"root","child":"w","side":"left"}],
  "hashmap": {"best":"w"},
  "status": "w is an end — record \"w\" (length 1)."
}'::jsonb),
('longest-word-dictionary', 4, 'Descend to wo (end)', '{
  "type": "tree",
  "nodes": [{"id":"w","value":"w✓","state":"visited"},{"id":"wo","value":"o✓","state":"current"}],
  "edges": [{"parent":"w","child":"wo","side":"left"}],
  "hashmap": {"best":"wo"},
  "status": "wo is end → record \"wo\" (length 2)."
}'::jsonb),
('longest-word-dictionary', 5, 'Descend to wor (end)', '{
  "type": "tree",
  "nodes": [{"id":"wo","value":"o✓","state":"visited"},{"id":"wor","value":"r✓","state":"current"}],
  "edges": [{"parent":"wo","child":"wor","side":"left"}],
  "hashmap": {"best":"wor"},
  "status": "Length 3."
}'::jsonb),
('longest-word-dictionary', 6, 'Descend to worl (end)', '{
  "type": "tree",
  "nodes": [{"id":"wor","value":"r✓","state":"visited"},{"id":"worl","value":"l✓","state":"current"}],
  "edges": [{"parent":"wor","child":"worl","side":"left"}],
  "hashmap": {"best":"worl"},
  "status": "Length 4."
}'::jsonb),
('longest-word-dictionary', 7, 'Descend to world (end)', '{
  "type": "tree",
  "nodes": [{"id":"worl","value":"l✓","state":"visited"},{"id":"world","value":"d✓","state":"current"}],
  "edges": [{"parent":"worl","child":"world","side":"left"}],
  "hashmap": {"best":"world"},
  "status": "Length 5 → new best."
}'::jsonb),
('longest-word-dictionary', 8, 'Tiebreak', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {},
  "status": "If two paths tie on length, iterate children in alphabetical order during DFS so the first candidate found is lexicographically smallest."
}'::jsonb),
('longest-word-dictionary', 9, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"world"},
  "status": "Return \"world\". Time O(sum of word lengths)."
}'::jsonb);


-- ── REPLACE WORDS ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'replace-words';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('replace-words', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"current"}],
  "edges": [],
  "hashmap": {"roots":"[cat,bat,rat]","sentence":"the cattle was rattled by the battery"},
  "status": "Replace every word in the sentence with the SHORTEST root that forms its prefix. Expected: \"the cat was rat by the bat\"."
}'::jsonb),
('replace-words', 2, 'Insert roots into trie', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"},{"id":"c","value":"c","state":"unvisited"},{"id":"b","value":"b","state":"unvisited"},{"id":"r","value":"r","state":"unvisited"},{"id":"ca","value":"a","state":"unvisited"},{"id":"cat","value":"t✓","state":"unvisited"},{"id":"ba","value":"a","state":"unvisited"},{"id":"bat","value":"t✓","state":"unvisited"},{"id":"ra","value":"a","state":"unvisited"},{"id":"rat","value":"t✓","state":"unvisited"}],
  "edges": [{"parent":"root","child":"c","side":"left"},{"parent":"root","child":"b","side":"left"},{"parent":"root","child":"r","side":"right"},{"parent":"c","child":"ca","side":"left"},{"parent":"ca","child":"cat","side":"left"},{"parent":"b","child":"ba","side":"left"},{"parent":"ba","child":"bat","side":"left"},{"parent":"r","child":"ra","side":"left"},{"parent":"ra","child":"rat","side":"left"}],
  "hashmap": {},
  "status": "Trie of the three roots. End-marks at t-nodes."
}'::jsonb),
('replace-words', 3, 'Match \"cattle\"', '{
  "type": "tree",
  "nodes": [{"id":"c","value":"c","state":"visited"},{"id":"ca","value":"a","state":"visited"},{"id":"cat","value":"t✓","state":"current"}],
  "edges": [{"parent":"c","child":"ca","side":"left"},{"parent":"ca","child":"cat","side":"left"}],
  "hashmap": {"replace":"cat"},
  "status": "Walk c→a→t. End-mark hit → stop early. Replace \"cattle\" with \"cat\"."
}'::jsonb),
('replace-words', 4, 'Match \"rattled\"', '{
  "type": "tree",
  "nodes": [{"id":"r","value":"r","state":"visited"},{"id":"ra","value":"a","state":"visited"},{"id":"rat","value":"t✓","state":"current"}],
  "edges": [{"parent":"r","child":"ra","side":"left"},{"parent":"ra","child":"rat","side":"left"}],
  "hashmap": {"replace":"rat"},
  "status": "Walk r→a→t. End-mark → replace with \"rat\"."
}'::jsonb),
('replace-words', 5, 'Match \"battery\"', '{
  "type": "tree",
  "nodes": [{"id":"b","value":"b","state":"visited"},{"id":"ba","value":"a","state":"visited"},{"id":"bat","value":"t✓","state":"current"}],
  "edges": [{"parent":"b","child":"ba","side":"left"},{"parent":"ba","child":"bat","side":"left"}],
  "hashmap": {"replace":"bat"},
  "status": "Walk b→a→t. End-mark → replace with \"bat\"."
}'::jsonb),
('replace-words', 6, 'Miss: \"the\" & \"was\" & \"by\"', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"current"}],
  "edges": [],
  "hashmap": {},
  "status": "No root begins with t/w/b? Wait, \"b\" exists. For \"by\", walk b→y: no y child → stop without end-mark. Keep original word. Same for \"the\", \"was\"."
}'::jsonb),
('replace-words', 7, 'Why Trie vs Set', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {},
  "status": "Instead of checking every prefix of every word in a set (O(L²) per word), the trie walks each word once: O(L) per word, O(total letters in roots) to build."
}'::jsonb),
('replace-words', 8, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"the cat was rat by the bat"},
  "status": "Join and return the transformed sentence."
}'::jsonb);


-- ── SEARCH SUGGESTIONS SYSTEM ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'search-suggestions-system';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('search-suggestions-system', 1, 'Problem Setup', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"current"}],
  "edges": [],
  "hashmap": {"products":"[mobile,moneypot,monitor,mouse,mousepad]","query":"mouse"},
  "status": "For each prefix of query, return up to 3 lexicographically smallest products that share that prefix. Expected 5 lists — the first three containing ''mobile/moneypot/monitor'' or ''mouse/mousepad'' depending on prefix."
}'::jsonb),
('search-suggestions-system', 2, 'Approach: Trie with Top-3 Cached', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"},{"id":"m","value":"m","state":"current"}],
  "edges": [{"parent":"root","child":"m","side":"left"}],
  "hashmap": {},
  "status": "Sort products alphabetically. Insert each into a trie; at every node along the path store up to 3 products (sorted). Query walks down one char at a time."
}'::jsonb),
('search-suggestions-system', 3, 'Prefix \"m\"', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"},{"id":"m","value":"m","state":"current"}],
  "edges": [{"parent":"root","child":"m","side":"left"}],
  "hashmap": {"top3":"[mobile,moneypot,monitor]"},
  "status": "Node m has top-3 cache = [mobile, moneypot, monitor]."
}'::jsonb),
('search-suggestions-system', 4, 'Prefix \"mo\"', '{
  "type": "tree",
  "nodes": [{"id":"m","value":"m","state":"visited"},{"id":"mo","value":"o","state":"current"}],
  "edges": [{"parent":"m","child":"mo","side":"left"}],
  "hashmap": {"top3":"[mobile,moneypot,monitor]"},
  "status": "Same three."
}'::jsonb),
('search-suggestions-system', 5, 'Prefix \"mou\" → diverges', '{
  "type": "tree",
  "nodes": [{"id":"mo","value":"o","state":"visited"},{"id":"mou","value":"u","state":"current"}],
  "edges": [{"parent":"mo","child":"mou","side":"right"}],
  "hashmap": {"top3":"[mouse,mousepad]"},
  "status": "Now only \"mouse\" and \"mousepad\" share the prefix. Cache shows exactly those two."
}'::jsonb),
('search-suggestions-system', 6, 'Prefix \"mous\"', '{
  "type": "tree",
  "nodes": [{"id":"mou","value":"u","state":"visited"},{"id":"mous","value":"s","state":"current"}],
  "edges": [{"parent":"mou","child":"mous","side":"left"}],
  "hashmap": {"top3":"[mouse,mousepad]"},
  "status": "Still both products."
}'::jsonb),
('search-suggestions-system', 7, 'Prefix \"mouse\"', '{
  "type": "tree",
  "nodes": [{"id":"mous","value":"s","state":"visited"},{"id":"mouse","value":"e✓","state":"current"}],
  "edges": [{"parent":"mous","child":"mouse","side":"left"}],
  "hashmap": {"top3":"[mouse,mousepad]"},
  "status": "Both still match."
}'::jsonb),
('search-suggestions-system', 8, 'Alternative: Sort + Binary Search', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {},
  "status": "Another approach: sort products once; for each prefix binary-search the first match and emit the next ≤3 that still share the prefix. O((m+q) log m) total."
}'::jsonb),
('search-suggestions-system', 9, 'Result', '{
  "type": "tree",
  "nodes": [{"id":"root","value":"•","state":"visited"}],
  "edges": [],
  "hashmap": {"answer":"[[mobile,moneypot,monitor],[mobile,moneypot,monitor],[mouse,mousepad],[mouse,mousepad],[mouse,mousepad]]"},
  "status": "Return 5 lists, one per prefix of \"mouse\"."
}'::jsonb);
