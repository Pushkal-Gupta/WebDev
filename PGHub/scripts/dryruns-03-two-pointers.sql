-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Two-Pointers topic (Phase B, Session 3)
-- ───────────────────────────────────────────────────────────────
-- Covers the 9 two-pointer problems that don't yet have dry runs.
-- Already covered in enhance_dry_runs.sql: valid-palindrome.
-- ═══════════════════════════════════════════════════════════════


-- ── THREE SUM ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'three-sum';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('three-sum', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-1,0,1,2,-1,-4],
  "highlights": [],
  "pointers": {},
  "status": "Given nums = [-1,0,1,2,-1,-4]. Find all unique triplets (a,b,c) with a+b+c = 0."
}'::jsonb),

('three-sum', 2, 'Approach: Sort + Two Pointers', '{
  "type": "array",
  "array": [-1,0,1,2,-1,-4],
  "highlights": [],
  "pointers": {},
  "status": "Sort first. Then fix each index i and use two pointers (l, r) on the remaining suffix to find pairs summing to -nums[i]. Sort enables easy duplicate skipping. O(n²) time."
}'::jsonb),

('three-sum', 3, 'After Sorting', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [],
  "pointers": {},
  "status": "nums = [-4,-1,-1,0,1,2]. Indices 0..5."
}'::jsonb),

('three-sum', 4, 'i=0 (-4): l=1, r=5', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [0],
  "pointers": {"i": 0, "l": 1, "r": 5},
  "hashmap": {"target":"4", "sum":"-4+-1+2 = -3"},
  "status": "Need pair summing to 4. -1+2 = 1 < 4 → l++."
}'::jsonb),

('three-sum', 5, 'i=0: no triplet', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [0],
  "pointers": {"i": 0},
  "status": "Entire l/r sweep never reaches 4 (best is -1+2 = 1 and 1+2 = 3). No triplet with i=0."
}'::jsonb),

('three-sum', 6, 'i=1 (-1): l=2, r=5', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,2,5],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "l": 2, "r": 5},
  "hashmap": {"sum":"-1+-1+2 = 0"},
  "status": "Triplet! Record [-1,-1,2]. Advance both: l=3, r=4."
}'::jsonb),

('three-sum', 7, 'i=1: (l=3, r=4)', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,3,4],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "l": 3, "r": 4},
  "hashmap": {"sum":"-1+0+1 = 0"},
  "status": "Another triplet! Record [-1,0,1]. l=4, r=3 → pointers cross, done with i=1."
}'::jsonb),

('three-sum', 8, 'i=2: skip duplicate', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i": 2},
  "status": "nums[2] = -1 = nums[1]. Skip to avoid duplicate triplets."
}'::jsonb),

('three-sum', 9, 'i=3 onward', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [3],
  "pointers": {"i": 3},
  "status": "nums[3]=0. Need pair summing to 0 from suffix [1,2]. Min pair is 1+2 = 3 > 0, no solution. For i=4,5 the suffix is too short. Done."
}'::jsonb),

('three-sum', 10, 'Result', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [[-1,-1,2], [-1,0,1]]. Time O(n²), space O(1) beyond sort."
}'::jsonb);


-- ── CONTAINER WITH MOST WATER ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'container-most-water';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('container-most-water', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {},
  "status": "Given height = [1,8,6,2,5,4,8,3,7]. Pick two lines; the water volume is min(h[l],h[r]) * (r-l). Maximize it."
}'::jsonb),

('container-most-water', 2, 'Approach: Shrink Width Smartly', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {},
  "status": "Start with maximum width (ends). Moving the taller wall inward can never help — the limiting height stays the same or drops while the width shrinks. So always move the SHORTER wall inward."
}'::jsonb),

('container-most-water', 3, 'l=0, r=8', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [0,8],
  "pointers": {"l": 0, "r": 8},
  "hashmap": {"area":"min(1,7)*8 = 8", "best":"8"},
  "status": "h[0]=1 < h[8]=7. Move l (shorter side) right."
}'::jsonb),

('container-most-water', 4, 'l=1, r=8', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,8],
  "highlightColor": "yellow",
  "pointers": {"l": 1, "r": 8},
  "hashmap": {"area":"min(8,7)*7 = 49", "best":"49"},
  "status": "h[1]=8 > h[8]=7. Big improvement! Move r."
}'::jsonb),

('container-most-water', 5, 'l=1, r=7', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,7],
  "pointers": {"l": 1, "r": 7},
  "hashmap": {"area":"min(8,3)*6 = 18", "best":"49"},
  "status": "Smaller. h[r] shorter → r--."
}'::jsonb),

('container-most-water', 6, 'l=1, r=6', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,6],
  "pointers": {"l": 1, "r": 6},
  "hashmap": {"area":"min(8,8)*5 = 40", "best":"49"},
  "status": "Still short of 49. Either side same; move r."
}'::jsonb),

('container-most-water', 7, 'Continue inward', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"49"},
  "status": "Remaining sweeps (l=1..6) all produce smaller areas. best stays 49."
}'::jsonb),

('container-most-water', 8, 'Result', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,8],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return 49 (between indices 1 and 8). Time O(n), space O(1)."
}'::jsonb);


-- ── TRAPPING RAIN WATER ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'trapping-rain-water';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('trapping-rain-water', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"trapped":"0"},
  "status": "Given height = [0,1,0,2,1,0,1,3,2,1,2,1]. Return total water trapped after rain. Expected: 6."
}'::jsonb),

('trapping-rain-water', 2, 'Key Insight', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [],
  "pointers": {},
  "status": "Water above index i = min(maxLeft, maxRight) - height[i]. Two pointers track the current maxes from both sides, advancing whichever has the smaller max (we know that side is the limiting wall)."
}'::jsonb),

('trapping-rain-water', 3, 'l=0, r=11', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [0,11],
  "pointers": {"l": 0, "r": 11},
  "hashmap": {"maxL":"0","maxR":"1","trapped":"0"},
  "status": "maxL=0 < maxR=1 → process left. h[0]=0 updates maxL to 0. trapped += maxL - h[0] = 0. l++."
}'::jsonb),

('trapping-rain-water', 4, 'l=1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [1,11],
  "pointers": {"l": 1, "r": 11},
  "hashmap": {"maxL":"1","maxR":"1","trapped":"0"},
  "status": "h[1]=1 updates maxL. trapped += 0. l++."
}'::jsonb),

('trapping-rain-water', 5, 'l=2 traps 1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"l": 2, "r": 11},
  "hashmap": {"maxL":"1","maxR":"1","trapped":"1"},
  "status": "h[2]=0. maxL=1, so this cell holds 1 unit of water. trapped = 1. l++."
}'::jsonb),

('trapping-rain-water', 6, 'l=3 raises maxL', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [3],
  "pointers": {"l": 3, "r": 11},
  "hashmap": {"maxL":"2","maxR":"1","trapped":"1"},
  "status": "h[3]=2 → maxL=2. Now maxL > maxR so next iteration processes the RIGHT side."
}'::jsonb),

('trapping-rain-water', 7, 'r=10 traps 0', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [10],
  "pointers": {"l": 3, "r": 10},
  "hashmap": {"maxL":"2","maxR":"2","trapped":"1"},
  "status": "h[10]=2 → maxR=2, no trap. r--."
}'::jsonb),

('trapping-rain-water', 8, 'r=9 traps 1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [9],
  "highlightColor": "yellow",
  "pointers": {"l": 3, "r": 9},
  "hashmap": {"maxL":"2","maxR":"2","trapped":"2"},
  "status": "h[9]=1. maxR-h[9] = 1. trapped = 2. r--."
}'::jsonb),

('trapping-rain-water', 9, 'More traps', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [4,5,6,8],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"trapped":"6"},
  "status": "Continuing: index 8 traps 1, indices 4,5,6 trap 1+2+1 when the left side processes them. Total water collected = 6."
}'::jsonb),

('trapping-rain-water', 10, 'Result', '{
  "type": "array",
  "array": [0,1,0,2,1,0,1,3,2,1,2,1],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"trapped":"6"},
  "status": "Return 6. Time O(n), space O(1)."
}'::jsonb);


-- ── TWO SUM II (sorted) ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'two-sum-ii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('two-sum-ii', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"9"},
  "status": "Given numbers = [2,7,11,15] (sorted!) and target = 9. Return the 1-indexed positions of the pair that sums to target."
}'::jsonb),

('two-sum-ii', 2, 'Approach', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "status": "Because the array is sorted, two pointers from both ends work. If sum is too big, move r left (decrease). If too small, move l right (increase)."
}'::jsonb),

('two-sum-ii', 3, 'l=0, r=3', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,3],
  "pointers": {"l": 0, "r": 3},
  "hashmap": {"sum":"17 > 9"},
  "status": "2+15 = 17 > 9. Move r left."
}'::jsonb),

('two-sum-ii', 4, 'l=0, r=2', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,2],
  "pointers": {"l": 0, "r": 2},
  "hashmap": {"sum":"13 > 9"},
  "status": "2+11 = 13 > 9. Move r left."
}'::jsonb),

('two-sum-ii', 5, 'l=0, r=1 — Match', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"l": 0, "r": 1},
  "hashmap": {"sum":"9 ✓"},
  "status": "2+7 = 9. Found it!"
}'::jsonb),

('two-sum-ii', 6, 'Result', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [1,2] (1-indexed). Time O(n), space O(1)."
}'::jsonb);


-- ── REMOVE DUPLICATES FROM SORTED ARRAY ──────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-duplicates-sorted';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-duplicates-sorted', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,0,1,1,1,2,2,3,3,4],
  "highlights": [],
  "pointers": {},
  "status": "Given a SORTED array. Remove duplicates in-place and return the number of unique elements (the first k slots should hold the unique prefix)."
}'::jsonb),

('remove-duplicates-sorted', 2, 'Approach: Slow/Fast Pointers', '{
  "type": "array",
  "array": [0,0,1,1,1,2,2,3,3,4],
  "highlights": [],
  "pointers": {"slow": 0, "fast": 1},
  "status": "slow = write position of the next unique value. fast scans the array. When nums[fast] differs from nums[slow], advance slow and copy."
}'::jsonb),

('remove-duplicates-sorted', 3, 'fast=1: duplicate', '{
  "type": "array",
  "array": [0,0,1,1,1,2,2,3,3,4],
  "highlights": [0,1],
  "pointers": {"slow": 0, "fast": 1},
  "status": "nums[1]=0 == nums[slow]=0. Skip."
}'::jsonb),

('remove-duplicates-sorted', 4, 'fast=2: write', '{
  "type": "array",
  "array": [0,1,1,1,1,2,2,3,3,4],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"slow": 1, "fast": 2},
  "status": "nums[2]=1 ≠ nums[slow]=0. slow++, nums[slow]=1."
}'::jsonb),

('remove-duplicates-sorted', 5, 'fast=3,4: skip', '{
  "type": "array",
  "array": [0,1,1,1,1,2,2,3,3,4],
  "highlights": [3,4],
  "pointers": {"slow": 1, "fast": 4},
  "status": "nums[3]=1, nums[4]=1. Both equal nums[slow]. Skip."
}'::jsonb),

('remove-duplicates-sorted', 6, 'fast=5: write 2', '{
  "type": "array",
  "array": [0,1,2,1,1,2,2,3,3,4],
  "highlights": [2,5],
  "highlightColor": "yellow",
  "pointers": {"slow": 2, "fast": 5},
  "status": "nums[5]=2 ≠ 1. slow=2, nums[2]=2."
}'::jsonb),

('remove-duplicates-sorted', 7, 'fast=7: write 3', '{
  "type": "array",
  "array": [0,1,2,3,1,2,2,3,3,4],
  "highlights": [3,7],
  "highlightColor": "yellow",
  "pointers": {"slow": 3, "fast": 7},
  "status": "Skip fast=6 (dup 2). At fast=7, nums[7]=3 ≠ 2. slow=3, nums[3]=3."
}'::jsonb),

('remove-duplicates-sorted', 8, 'fast=9: write 4', '{
  "type": "array",
  "array": [0,1,2,3,4,2,2,3,3,4],
  "highlights": [4,9],
  "highlightColor": "yellow",
  "pointers": {"slow": 4, "fast": 9},
  "status": "Skip fast=8 (dup 3). nums[9]=4 ≠ 3. slow=4, nums[4]=4."
}'::jsonb),

('remove-duplicates-sorted', 9, 'Result', '{
  "type": "array",
  "array": [0,1,2,3,4,2,2,3,3,4],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {"slow": 4},
  "status": "Return slow+1 = 5. First 5 slots are the unique prefix [0,1,2,3,4]; trailing slots are ignored. Time O(n)."
}'::jsonb);


-- ── MOVE ZEROES ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'move-zeroes';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('move-zeroes', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {},
  "status": "Given nums = [0,1,0,3,12]. Move all 0s to the end while preserving the relative order of the non-zero elements. Must be in-place."
}'::jsonb),

('move-zeroes', 2, 'Approach: Swap Non-Zeros Forward', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {"slow": 0, "fast": 0},
  "status": "slow = next write slot for non-zero. Walk fast; whenever nums[fast] != 0, swap(slow, fast) and slow++. The zeros end up naturally shifted right."
}'::jsonb),

('move-zeroes', 3, 'fast=0: zero, skip', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [0],
  "pointers": {"slow": 0, "fast": 0},
  "status": "nums[0]=0. Don''t swap, don''t advance slow."
}'::jsonb),

('move-zeroes', 4, 'fast=1: swap', '{
  "type": "array",
  "array": [1,0,0,3,12],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"slow": 1, "fast": 1},
  "status": "nums[1]=1 ≠ 0. Swap indices 0,1 → [1,0,0,3,12]. slow++."
}'::jsonb),

('move-zeroes', 5, 'fast=2: zero, skip', '{
  "type": "array",
  "array": [1,0,0,3,12],
  "highlights": [2],
  "pointers": {"slow": 1, "fast": 2},
  "status": "nums[2]=0. Skip."
}'::jsonb),

('move-zeroes', 6, 'fast=3: swap', '{
  "type": "array",
  "array": [1,3,0,0,12],
  "highlights": [1,3],
  "highlightColor": "yellow",
  "pointers": {"slow": 2, "fast": 3},
  "status": "nums[3]=3 ≠ 0. Swap indices 1,3 → [1,3,0,0,12]. slow++."
}'::jsonb),

('move-zeroes', 7, 'fast=4: swap', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [2,4],
  "highlightColor": "yellow",
  "pointers": {"slow": 3, "fast": 4},
  "status": "nums[4]=12 ≠ 0. Swap indices 2,4 → [1,3,12,0,0]. slow++."
}'::jsonb),

('move-zeroes', 8, 'Result', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [1,3,12,0,0]. Non-zero order preserved, zeros at the end. Time O(n), space O(1)."
}'::jsonb);


-- ── SORT COLORS ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sort-colors';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sort-colors', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {},
  "status": "Given nums = [2,0,2,1,1,0] (only values 0,1,2). Sort in-place to [0,0,1,1,2,2]. Must be one pass."
}'::jsonb),

('sort-colors', 2, 'Approach: Dutch National Flag', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {"low": 0, "mid": 0, "high": 5},
  "status": "Three pointers: low = next 0 slot, high = next 2 slot, mid scans. At mid: if 0 swap(low,mid)+both++; if 2 swap(mid,high)+high--; if 1 just mid++."
}'::jsonb),

('sort-colors', 3, 'mid=0: value 2', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [0,5],
  "highlightColor": "yellow",
  "pointers": {"low": 0, "mid": 0, "high": 4},
  "status": "nums[mid]=2. Swap(mid,high): [0,0,2,1,1,2]. high--. DO NOT advance mid (new value unchecked)."
}'::jsonb),

('sort-colors', 4, 'mid=0: value 0', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [0],
  "pointers": {"low": 1, "mid": 1, "high": 4},
  "status": "nums[mid]=0. Swap(low,mid) (no-op here). low++, mid++."
}'::jsonb),

('sort-colors', 5, 'mid=1: value 0', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [1],
  "pointers": {"low": 2, "mid": 2, "high": 4},
  "status": "Same: swap is a no-op. low++, mid++."
}'::jsonb),

('sort-colors', 6, 'mid=2: value 2', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [2,4],
  "highlightColor": "yellow",
  "pointers": {"low": 2, "mid": 2, "high": 3},
  "status": "Swap(mid,high): [0,0,1,1,2,2]. high--."
}'::jsonb),

('sort-colors', 7, 'mid=2,3: value 1', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [2,3],
  "pointers": {"low": 2, "mid": 4, "high": 3},
  "status": "Both values are 1. Just advance mid twice. mid > high → stop."
}'::jsonb),

('sort-colors', 8, 'Result', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [0,0,1,1,2,2]. One pass. Time O(n), space O(1)."
}'::jsonb);


-- ── SQUARES OF A SORTED ARRAY ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'squares-sorted-array';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('squares-sorted-array', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {},
  "status": "Given a sorted array (negatives allowed). Return squares sorted ascending. Expected: [0,1,9,16,100]."
}'::jsonb),

('squares-sorted-array', 2, 'Key Insight', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {},
  "status": "Squares of a sorted array are NOT sorted (negatives flip). But the largest absolute value is always at one end. Two pointers from both ends; pick the bigger |val| and fill the result from the BACK."
}'::jsonb),

('squares-sorted-array', 3, 'l=0, r=4 → 100', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [0,4],
  "pointers": {"l": 0, "r": 4, "write": 4},
  "hashmap": {"result":"[_,_,_,_,100]"},
  "status": "|10| > |-4|. result[4] = 100. r--."
}'::jsonb),

('squares-sorted-array', 4, 'l=0, r=3 → 16', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [0,3],
  "pointers": {"l": 0, "r": 3, "write": 3},
  "hashmap": {"result":"[_,_,_,16,100]"},
  "status": "|-4| > |3|. result[3] = 16. l++."
}'::jsonb),

('squares-sorted-array', 5, 'l=1, r=3 → 9', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [1,3],
  "pointers": {"l": 1, "r": 3, "write": 2},
  "hashmap": {"result":"[_,_,9,16,100]"},
  "status": "|3| > |-1|. result[2] = 9. r--."
}'::jsonb),

('squares-sorted-array', 6, 'l=1, r=2 → 1', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [1,2],
  "pointers": {"l": 1, "r": 2, "write": 1},
  "hashmap": {"result":"[_,1,9,16,100]"},
  "status": "|-1| > |0|. result[1] = 1. l++."
}'::jsonb),

('squares-sorted-array', 7, 'l=2, r=2 → 0', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [2],
  "pointers": {"l": 2, "r": 2, "write": 0},
  "hashmap": {"result":"[0,1,9,16,100]"},
  "status": "Pointers meet. result[0] = 0."
}'::jsonb),

('squares-sorted-array', 8, 'Result', '{
  "type": "array",
  "array": [0,1,9,16,100],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return [0,1,9,16,100]. Time O(n), space O(n) for the output."
}'::jsonb);


-- ── IS SUBSEQUENCE ───────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'is-subsequence';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('is-subsequence', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "labels": {"0":"t"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"s":"abc"},
  "status": "Given s = \"abc\", t = \"ahbgdc\". Return true if s is a subsequence of t (characters of s appear in t in the same order, possibly with gaps)."
}'::jsonb),

('is-subsequence', 2, 'Approach: Two Pointers', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "labels": {"0":"t"},
  "highlights": [],
  "pointers": {"i": 0, "j": 0},
  "status": "i indexes s, j indexes t. Advance j every step. Advance i only when s[i] == t[j]. If i reaches len(s), return true."
}'::jsonb),

('is-subsequence', 3, 'j=0: match a', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {"s[i]":"b"},
  "status": "t[0]=a == s[0]=a. Both advance. i=1, j=1."
}'::jsonb),

('is-subsequence', 4, 'j=1: no match', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i": 1, "j": 2},
  "hashmap": {"s[i]":"b"},
  "status": "t[1]=h ≠ s[1]=b. Advance j only. j=2."
}'::jsonb),

('is-subsequence', 5, 'j=2: match b', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i": 2, "j": 3},
  "hashmap": {"s[i]":"c"},
  "status": "t[2]=b == s[1]=b. i=2, j=3."
}'::jsonb),

('is-subsequence', 6, 'j=3,4: no match', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [3,4],
  "highlightColor": "red",
  "pointers": {"i": 2, "j": 5},
  "status": "t[3]=g ≠ c, t[4]=d ≠ c. j advances to 5."
}'::jsonb),

('is-subsequence', 7, 'j=5: match c', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"i": 3, "j": 6},
  "status": "t[5]=c == s[2]=c. i=3 = len(s). All of s matched."
}'::jsonb),

('is-subsequence', 8, 'Result', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [0,2,5],
  "highlightColor": "green",
  "pointers": {},
  "status": "Return true. Indices 0, 2, 5 of t spell out s = \"abc\". Time O(|t|), space O(1)."
}'::jsonb);


-- ── Sanity ────────────────────────────────────────────────────
SELECT problem_id, COUNT(*) AS step_count
FROM "PGcode_interactive_dry_runs"
WHERE problem_id IN (
  'three-sum','container-most-water','trapping-rain-water','two-sum-ii',
  'remove-duplicates-sorted','move-zeroes','sort-colors','squares-sorted-array','is-subsequence'
)
GROUP BY problem_id
ORDER BY problem_id;
