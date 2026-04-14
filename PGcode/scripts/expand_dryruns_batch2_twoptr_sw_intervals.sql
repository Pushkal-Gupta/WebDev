-- ═══════════════════════════════════════════════════════════════
-- Batch 2: Expanded Dry Runs — Two-Pointer / Sliding-Window / Intervals
-- 30 problems, 10-13 frames each, array renderer (gold-standard depth)
-- ═══════════════════════════════════════════════════════════════


-- ── BEST TIME TO BUY & SELL STOCK ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'best-time-to-buy-sell-stock';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('best-time-to-buy-sell-stock', 1, 'Problem Setup', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given prices = [7,1,5,3,6,4]. Buy once and sell once on a LATER day to maximize profit. Return max profit (0 if none). Expected: 5 (buy at 1, sell at 6)."
}'::jsonb),
('best-time-to-buy-sell-stock', 2, 'Brute Force', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Naive: for each buy day i, scan all later sell days j > i and track max(prices[j] - prices[i]). That is O(n²) time. We can do better."
}'::jsonb),
('best-time-to-buy-sell-stock', 3, 'Approach: Two Pointers (L=buy, R=sell)', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [],
  "pointers": {"L":0,"R":1},
  "hashmap": {"best":"0"},
  "status": "Use L (buy) and R (sell), R > L. If prices[R] > prices[L] we have a candidate profit; else move L to R (a lower buy). Advance R each step. O(n)."
}'::jsonb),
('best-time-to-buy-sell-stock', 4, 'Initialize', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [0,1],
  "pointers": {"L":0,"R":1},
  "hashmap": {"best":"0"},
  "status": "L=0 (buy 7), R=1 (sell 1). best = 0."
}'::jsonb),
('best-time-to-buy-sell-stock', 5, 'R=1: price dropped', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"L":1,"R":2},
  "hashmap": {"best":"0"},
  "status": "prices[R]=1 < prices[L]=7. A lower buy found. Move L to R=1, then R=2."
}'::jsonb),
('best-time-to-buy-sell-stock', 6, 'R=2: profit 4', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"L":1,"R":2},
  "hashmap": {"best":"4"},
  "status": "5 - 1 = 4 > 0. Update best = 4. Advance R=3."
}'::jsonb),
('best-time-to-buy-sell-stock', 7, 'R=3: profit 2', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,3],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":3},
  "hashmap": {"best":"4"},
  "status": "3 - 1 = 2, less than best (4). Do not update. R=4."
}'::jsonb),
('best-time-to-buy-sell-stock', 8, 'R=4: profit 5 — new best!', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,4],
  "highlightColor": "green",
  "pointers": {"L":1,"R":4},
  "hashmap": {"best":"5"},
  "status": "6 - 1 = 5 > 4. best = 5. R=5."
}'::jsonb),
('best-time-to-buy-sell-stock', 9, 'R=5: profit 3', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,5],
  "pointers": {"L":1,"R":5},
  "hashmap": {"best":"5"},
  "status": "4 - 1 = 3 < 5. No update. R reached end."
}'::jsonb),
('best-time-to-buy-sell-stock', 10, 'Termination', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,4],
  "highlightColor": "green",
  "pointers": {"L":1,"R":5},
  "hashmap": {"best":"5"},
  "status": "R is past the last index. Loop ends."
}'::jsonb),
('best-time-to-buy-sell-stock', 11, 'Construct Result', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"5"},
  "status": "Best buy=index 1 (price 1), sell=index 4 (price 6). Profit = 5."
}'::jsonb),
('best-time-to-buy-sell-stock', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [7,1,5,3,6,4],
  "highlights": [1,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"5"},
  "status": "Return 5. Time O(n), Space O(1)."
}'::jsonb);


-- ── CAR FLEET ─────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'car-fleet';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('car-fleet', 1, 'Problem Setup', '{
  "type": "array",
  "array": [10,8,0,5,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"12","speeds":"[2,4,1,1,3]"},
  "status": "target = 12. positions = [10,8,0,5,3], speeds = [2,4,1,1,3]. Cars can catch up but not pass. Count resulting fleets."
}'::jsonb),
('car-fleet', 2, 'Approach: Sort by position desc + Stack of times', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {"speeds":"[2,4,1,3,1]"},
  "status": "Sort cars by starting position descending. Compute each car''s arrival time (target-pos)/speed. Scan front to back: a following car with larger or equal time is slower → it forms its own fleet; else it merges into the fleet ahead."
}'::jsonb),
('car-fleet', 3, 'Complexity', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sorting dominates: O(n log n) time, O(n) space for times."
}'::jsonb),
('car-fleet', 4, 'Compute times', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {"note":"times[i] = (target-pos)/speed"},
  "status": "times = [(12-10)/2, (12-8)/4, (12-5)/1, (12-3)/3, (12-0)/1] = [1,1,7,3,12]."
}'::jsonb),
('car-fleet', 5, 'Initialize scan', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [0],
  "pointers": {"i":0},
  "hashmap": {"fleets":"0","leadTime":"-inf"},
  "status": "i=0. Front car time = 1 > leadTime. Starts a new fleet."
}'::jsonb),
('car-fleet', 6, 'i=0: fleet 1', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0},
  "hashmap": {"fleets":"1","leadTime":"1"},
  "status": "fleets=1. leadTime = 1."
}'::jsonb),
('car-fleet', 7, 'i=1: merges', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1},
  "hashmap": {"fleets":"1","leadTime":"1"},
  "status": "time=1 ≤ leadTime=1 → catches up. Merges into fleet ahead. No new fleet."
}'::jsonb),
('car-fleet', 8, 'i=2: new fleet', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i":2},
  "hashmap": {"fleets":"2","leadTime":"7"},
  "status": "time=7 > 1. Cannot catch up. New fleet. fleets=2, leadTime=7."
}'::jsonb),
('car-fleet', 9, 'i=3: merges', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i":3},
  "hashmap": {"fleets":"2","leadTime":"7"},
  "status": "time=3 ≤ 7 → catches fleet ahead. Merge."
}'::jsonb),
('car-fleet', 10, 'i=4: new fleet', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"fleets":"3","leadTime":"12"},
  "status": "time=12 > 7. Slowest, cannot catch up. New fleet. fleets=3."
}'::jsonb),
('car-fleet', 11, 'Termination', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [0,2,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"fleets":"3"},
  "status": "All processed. 3 fleets formed (heads at times 1, 7, 12)."
}'::jsonb),
('car-fleet', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [1,1,7,3,12],
  "highlights": [0,2,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "Return 3. Time O(n log n), Space O(n)."
}'::jsonb);


-- ── CONTAINER WITH MOST WATER ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'container-most-water';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('container-most-water', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"0"},
  "status": "heights = [1,8,6,2,5,4,8,3,7]. Pick two lines to form a container. Area = min(h[L],h[R]) * (R-L). Maximize. Expected: 49."
}'::jsonb),
('container-most-water', 2, 'Brute Force', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Check all pairs (i,j): O(n²). Too slow for large inputs."
}'::jsonb),
('container-most-water', 3, 'Approach: Two Pointers', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [],
  "pointers": {"L":0,"R":8},
  "hashmap": {"best":"0"},
  "status": "Start L=0, R=n-1 (widest). Move the SHORTER side inward — moving the taller side can never improve the min height while width shrinks. O(n)."
}'::jsonb),
('container-most-water', 4, 'L=0,R=8: area=8', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [0,8],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":8},
  "hashmap": {"best":"8"},
  "status": "min(1,7)*8 = 8. best=8. h[L]=1 shorter → L++."
}'::jsonb),
('container-most-water', 5, 'L=1,R=8: area=56 — wait, min=7*7', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,8],
  "highlightColor": "green",
  "pointers": {"L":1,"R":8},
  "hashmap": {"best":"49"},
  "status": "min(8,7)*7 = 49. best=49. h[R]=7 shorter → R--."
}'::jsonb),
('container-most-water', 6, 'L=1,R=7: area=18', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,7],
  "pointers": {"L":1,"R":7},
  "hashmap": {"best":"49"},
  "status": "min(8,3)*6 = 18. best unchanged. R--."
}'::jsonb),
('container-most-water', 7, 'L=1,R=6: area=40', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,6],
  "pointers": {"L":1,"R":6},
  "hashmap": {"best":"49"},
  "status": "min(8,8)*5 = 40. Heights equal; move either pointer. R--."
}'::jsonb),
('container-most-water', 8, 'L=1,R=5: area=16', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,5],
  "pointers": {"L":1,"R":5},
  "hashmap": {"best":"49"},
  "status": "min(8,4)*4 = 16. R--."
}'::jsonb),
('container-most-water', 9, 'L=1,R=4: area=15', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,4],
  "pointers": {"L":1,"R":4},
  "hashmap": {"best":"49"},
  "status": "min(8,5)*3 = 15. R--."
}'::jsonb),
('container-most-water', 10, 'L=1,R=3: area=4', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,3],
  "pointers": {"L":1,"R":3},
  "hashmap": {"best":"49"},
  "status": "min(8,2)*2 = 4. R--."
}'::jsonb),
('container-most-water', 11, 'L=1,R=2: area=6; pointers converge', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,2],
  "pointers": {"L":1,"R":2},
  "hashmap": {"best":"49"},
  "status": "min(8,6)*1 = 6. R-- makes L≥R. Loop ends."
}'::jsonb),
('container-most-water', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [1,8,6,2,5,4,8,3,7],
  "highlights": [1,8],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"49"},
  "status": "Return 49. Time O(n), Space O(1)."
}'::jsonb);


-- ── FRUIT INTO BASKETS ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'fruit-into-baskets';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('fruit-into-baskets', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "fruits = [1,2,1,2,3,2,2]. Pick a contiguous subarray with at most 2 distinct values. Maximize length. Expected: 4."
}'::jsonb),
('fruit-into-baskets', 2, 'Approach: Sliding Window with counts', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"best":"0"},
  "status": "Expand R; keep a hashmap of fruit→count. When distinct count > 2, shrink L until back to ≤ 2."
}'::jsonb),
('fruit-into-baskets', 3, 'Complexity', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Each index enters and leaves the window once. O(n) time, O(1) space (at most 3 keys)."
}'::jsonb),
('fruit-into-baskets', 4, 'R=0: add 1', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"1":"1","best":"1"},
  "status": "window=[1]. distinct=1. best=1."
}'::jsonb),
('fruit-into-baskets', 5, 'R=1: add 2', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"1":"1","2":"1","best":"2"},
  "status": "window=[1,2]. distinct=2. best=2."
}'::jsonb),
('fruit-into-baskets', 6, 'R=2: add 1', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2},
  "hashmap": {"1":"2","2":"1","best":"3"},
  "status": "window=[1,2,1]. distinct=2. best=3."
}'::jsonb),
('fruit-into-baskets', 7, 'R=3: add 2', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"L":0,"R":3},
  "hashmap": {"1":"2","2":"2","best":"4"},
  "status": "window=[1,2,1,2]. distinct=2. best=4."
}'::jsonb),
('fruit-into-baskets', 8, 'R=4: add 3 → shrink', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0,1,2,3,4],
  "highlightColor": "red",
  "pointers": {"L":0,"R":4},
  "hashmap": {"1":"2","2":"2","3":"1"},
  "status": "3 introduced; distinct=3 > 2. Must shrink L until we remove a fruit entirely."
}'::jsonb),
('fruit-into-baskets', 9, 'Shrink: remove indices 0..2', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"L":3,"R":4},
  "hashmap": {"2":"1","3":"1","best":"4"},
  "status": "Drop s[0]=1 (cnt 1), s[1]=2, s[2]=1 (cnt 0, erase). L=3. distinct=2 again. window=[2,3], len=2."
}'::jsonb),
('fruit-into-baskets', 10, 'R=5: add 2', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [3,4,5],
  "pointers": {"L":3,"R":5},
  "hashmap": {"2":"2","3":"1","best":"4"},
  "status": "window=[2,3,2], len=3. best still 4."
}'::jsonb),
('fruit-into-baskets', 11, 'R=6: add 2', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [3,4,5,6],
  "highlightColor": "green",
  "pointers": {"L":3,"R":6},
  "hashmap": {"2":"3","3":"1","best":"4"},
  "status": "window=[2,3,2,2], len=4. Tie, best=4."
}'::jsonb),
('fruit-into-baskets', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [1,2,1,2,3,2,2],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"4"},
  "status": "Return 4. Time O(n), Space O(1)."
}'::jsonb);


-- ── GAS STATION ───────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'gas-station';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('gas-station', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [],
  "pointers": {},
  "hashmap": {"cost":"[3,4,5,1,2]"},
  "status": "gas = [1,2,3,4,5], cost = [3,4,5,1,2]. Find a start index s.t. a full clockwise loop is possible. Return -1 if none. Expected: 3."
}'::jsonb),
('gas-station', 2, 'Key Insight', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If total gas ≥ total cost, a solution exists. And the correct start is the index right after the last point where running tank drops below 0."
}'::jsonb),
('gas-station', 3, 'Approach: Single pass', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"tank":"0","total":"0","start":"0"},
  "status": "Maintain tank (current) and total (sum of diffs). If tank < 0, reset start=i+1, tank=0. O(n)."
}'::jsonb),
('gas-station', 4, 'i=0: diff=-2', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"i":0},
  "hashmap": {"diff":"-2","tank":"-2","total":"-2","start":"1"},
  "status": "gas-cost = 1-3 = -2. tank=-2 < 0. Reset start=1, tank=0."
}'::jsonb),
('gas-station', 5, 'i=1: diff=-2', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"diff":"-2","tank":"-2","total":"-4","start":"2"},
  "status": "2-4=-2. tank<0. Reset start=2, tank=0."
}'::jsonb),
('gas-station', 6, 'i=2: diff=-2', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i":2},
  "hashmap": {"diff":"-2","tank":"-2","total":"-6","start":"3"},
  "status": "3-5=-2. tank<0. Reset start=3, tank=0."
}'::jsonb),
('gas-station', 7, 'i=3: diff=+3', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3},
  "hashmap": {"diff":"+3","tank":"3","total":"-3","start":"3"},
  "status": "4-1=+3. tank=3 ≥ 0. Keep start=3."
}'::jsonb),
('gas-station', 8, 'i=4: diff=+3', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"diff":"+3","tank":"6","total":"0","start":"3"},
  "status": "5-2=+3. tank=6. total=0 ≥ 0 → feasible overall."
}'::jsonb),
('gas-station', 9, 'Termination', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"total":"0","start":"3"},
  "status": "Loop ends. total = 0 means overall gas = cost, a tour is possible."
}'::jsonb),
('gas-station', 10, 'Why start=3 works', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"note":"segments before 3 all failed"},
  "status": "Starts 0,1,2 each failed. start=3 accumulated tank≥0 to the end; the wraparound segment (indices 0..2) has total -6 but is compensated by the +6 we stored before we ever leave 3."
}'::jsonb),
('gas-station', 11, 'Construct Result', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "Return start = 3."
}'::jsonb),
('gas-station', 12, 'Complexity', '{
  "type": "array",
  "array": [1,2,3,4,5],
  "highlights": [3],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb);


-- ── HAND OF STRAIGHTS ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'hand-of-straights';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('hand-of-straights', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3,6,2,3,4,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"groupSize":"3"},
  "status": "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3. Partition into consecutive runs of size 3. Return true/false."
}'::jsonb),
('hand-of-straights', 2, 'Approach: Count + Greedy smallest', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts":"{1:1,2:2,3:2,4:1,6:1,7:1,8:1}"},
  "status": "Count each card. Process from smallest card: it MUST start a run, so decrement counts of v, v+1, …, v+k-1. If any missing, fail."
}'::jsonb),
('hand-of-straights', 3, 'Complexity', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n). Each card popped O(1) amortized. Total O(n log n)."
}'::jsonb),
('hand-of-straights', 4, 'Check size divides n', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n":"9","groupSize":"3"},
  "status": "n=9, 9 % 3 = 0. Could still fail; proceed."
}'::jsonb),
('hand-of-straights', 5, 'Start with 1', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"v":1},
  "hashmap": {"counts":"{1:0,2:1,3:1,4:1,6:1,7:1,8:1}"},
  "status": "Smallest=1. Remove 1,2,3. Group [1,2,3] formed."
}'::jsonb),
('hand-of-straights', 6, 'Start with 2', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [3,4,5],
  "highlightColor": "green",
  "pointers": {"v":2},
  "hashmap": {"counts":"{2:0,3:0,4:0,6:1,7:1,8:1}"},
  "status": "Smallest remaining=2 (count 1). Remove 2,3,4. Group [2,3,4] formed."
}'::jsonb),
('hand-of-straights', 7, 'Start with 6', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [6,7,8],
  "highlightColor": "green",
  "pointers": {"v":6},
  "hashmap": {"counts":"{6:0,7:0,8:0}"},
  "status": "Smallest=6. Remove 6,7,8. Group [6,7,8] formed."
}'::jsonb),
('hand-of-straights', 8, 'Counts empty?', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"counts":"{}"},
  "status": "All counts zero. Every card used exactly once."
}'::jsonb),
('hand-of-straights', 9, 'Counter-example reasoning', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"note":"if v+k not present, fail"},
  "status": "If at any step we could not decrement v+j (missing or count 0), we return false immediately."
}'::jsonb),
('hand-of-straights', 10, 'Termination', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [0,1,2,3,4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"groups":"3"},
  "status": "3 groups of 3 — exactly partitions the hand."
}'::jsonb),
('hand-of-straights', 11, 'Construct Result', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Return true."
}'::jsonb),
('hand-of-straights', 12, 'Complexity Recap', '{
  "type": "array",
  "array": [1,2,3,2,3,4,6,7,8],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n log n), Space O(n)."
}'::jsonb);


-- ── INSERT INTERVAL ───────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'insert-interval';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('insert-interval', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"newInterval":"[4,8]"},
  "status": "Sorted non-overlapping intervals. Insert [4,8] and merge. Expected: [[1,2],[3,10],[12,16]]."
}'::jsonb),
('insert-interval', 2, 'Approach: 3 phases', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {},
  "status": "Phase 1: copy intervals ending BEFORE newInterval.start. Phase 2: merge all overlapping intervals into new. Phase 3: copy the rest. O(n)."
}'::jsonb),
('insert-interval', 3, 'Phase 1, i=0: [1,2] ends before 4', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0},
  "hashmap": {"result":"[[1,2]]"},
  "status": "intervals[0].end=2 < 4 → append as-is."
}'::jsonb),
('insert-interval', 4, 'Phase 1 ends at i=1', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1},
  "hashmap": {"result":"[[1,2]]"},
  "status": "intervals[1].end=5 ≥ 4 → enter merge phase."
}'::jsonb),
('insert-interval', 5, 'Phase 2, i=1: overlap with [3,5]', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1},
  "hashmap": {"new":"[3,8]"},
  "status": "intervals[1].start=3 ≤ 8 → overlap. new = [min(4,3), max(8,5)] = [3,8]."
}'::jsonb),
('insert-interval', 6, 'Phase 2, i=2: overlap with [6,7]', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i":2},
  "hashmap": {"new":"[3,8]"},
  "status": "6 ≤ 8 → overlap. new = [min(3,6), max(8,7)] = [3,8]."
}'::jsonb),
('insert-interval', 7, 'Phase 2, i=3: overlap with [8,10]', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i":3},
  "hashmap": {"new":"[3,10]"},
  "status": "8 ≤ 8 → overlap. new = [3, max(8,10)] = [3,10]."
}'::jsonb),
('insert-interval', 8, 'Phase 2 ends at i=4', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [4],
  "pointers": {"i":4},
  "hashmap": {"new":"[3,10]"},
  "status": "intervals[4].start=12 > 10 → no more overlap. Push new=[3,10] into result."
}'::jsonb),
('insert-interval', 9, 'After merge', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [],
  "pointers": {"i":4},
  "hashmap": {"result":"[[1,2],[3,10]]"},
  "status": "Merged block appended. Enter phase 3."
}'::jsonb),
('insert-interval', 10, 'Phase 3, i=4: copy [12,16]', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"result":"[[1,2],[3,10],[12,16]]"},
  "status": "Copy remaining intervals unchanged."
}'::jsonb),
('insert-interval', 11, 'Termination + Result', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[[1,2],[3,10],[12,16]]"},
  "status": "i past end. Done."
}'::jsonb),
('insert-interval', 12, 'Complexity', '{
  "type": "array",
  "array": ["[1,2]","[3,5]","[6,7]","[8,10]","[12,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n) single pass, Space O(n) for output."
}'::jsonb);


-- ── INTERVAL LIST INTERSECTIONS ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'interval-list-intersections';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('interval-list-intersections', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"B":"[[1,5],[8,12],[15,24],[25,26]]"},
  "status": "Two sorted, disjoint interval lists A and B. Return pairwise intersections."
}'::jsonb),
('interval-list-intersections', 2, 'Approach: Two pointers (i over A, j over B)', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [],
  "pointers": {"i":0,"j":0},
  "hashmap": {},
  "status": "Overlap of A[i] and B[j] is [max(starts), min(ends)] when max(starts) ≤ min(ends). Advance the one with smaller end."
}'::jsonb),
('interval-list-intersections', 3, 'Complexity', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Each pointer advances at most n/m times. O(n+m) time."
}'::jsonb),
('interval-list-intersections', 4, 'i=0,j=0: A[0,2] ∩ B[1,5] = [1,2]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0,"j":0},
  "hashmap": {"B[j]":"[1,5]","result":"[[1,2]]"},
  "status": "max(0,1)=1, min(2,5)=2. 1≤2 → record [1,2]. A ends first → i++."
}'::jsonb),
('interval-list-intersections', 5, 'i=1,j=0: A[5,10] ∩ B[1,5] = [5,5]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i":1,"j":0},
  "hashmap": {"B[j]":"[1,5]","result":"[[1,2],[5,5]]"},
  "status": "max(5,1)=5, min(10,5)=5 → [5,5]. B ends first → j++."
}'::jsonb),
('interval-list-intersections', 6, 'i=1,j=1: A[5,10] ∩ B[8,12] = [8,10]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i":1,"j":1},
  "hashmap": {"B[j]":"[8,12]","result":"[[1,2],[5,5],[8,10]]"},
  "status": "max(5,8)=8, min(10,12)=10 → [8,10]. A ends first → i++."
}'::jsonb),
('interval-list-intersections', 7, 'i=2,j=1: A[13,23] ∩ B[8,12]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i":2,"j":1},
  "hashmap": {"B[j]":"[8,12]"},
  "status": "max(13,8)=13, min(23,12)=12. 13 > 12 → NO overlap. B ends first → j++."
}'::jsonb),
('interval-list-intersections', 8, 'i=2,j=2: A[13,23] ∩ B[15,24] = [15,23]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i":2,"j":2},
  "hashmap": {"B[j]":"[15,24]","result":"…[15,23]"},
  "status": "[15,23]. A ends first → i++."
}'::jsonb),
('interval-list-intersections', 9, 'i=3,j=2: A[24,25] ∩ B[15,24] = [24,24]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3,"j":2},
  "hashmap": {"result":"…[24,24]"},
  "status": "max(24,15)=24, min(25,24)=24 → [24,24]. B ends first → j++."
}'::jsonb),
('interval-list-intersections', 10, 'i=3,j=3: A[24,25] ∩ B[25,26] = [25,25]', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3,"j":3},
  "hashmap": {"result":"…[25,25]"},
  "status": "[25,25]. A ends first → i++."
}'::jsonb),
('interval-list-intersections', 11, 'Termination', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [],
  "pointers": {"i":4,"j":3},
  "hashmap": {},
  "status": "i past end of A. Loop ends."
}'::jsonb),
('interval-list-intersections', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["A:[0,2]","A:[5,10]","A:[13,23]","A:[24,25]"],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]"},
  "status": "Time O(n+m), Space O(k)."
}'::jsonb);


-- ── INTERVAL SCHEDULING MAXIMIZATION ──────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'interval-scheduling-maximization';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('interval-scheduling-maximization', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Pick the maximum number of non-overlapping intervals."
}'::jsonb),
('interval-scheduling-maximization', 2, 'Approach: Sort by END, greedy', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort by end time ascending. Pick earliest-ending; skip any that overlap; pick the next compatible; repeat. Classic exchange-argument proof."
}'::jsonb),
('interval-scheduling-maximization', 3, 'After sort by end', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"lastEnd":"-inf","count":"0"},
  "status": "Already sorted: ends 3,4,5,6,7,9."
}'::jsonb),
('interval-scheduling-maximization', 4, 'i=0: pick [1,3]', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0},
  "hashmap": {"lastEnd":"3","count":"1"},
  "status": "start=1 ≥ -inf → pick. count=1. lastEnd=3."
}'::jsonb),
('interval-scheduling-maximization', 5, 'i=1: [2,4] overlaps', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"lastEnd":"3","count":"1"},
  "status": "start=2 < 3. Skip."
}'::jsonb),
('interval-scheduling-maximization', 6, 'i=2: pick [3,5]', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i":2},
  "hashmap": {"lastEnd":"5","count":"2"},
  "status": "start=3 ≥ 3 → pick (touching at boundary allowed). count=2. lastEnd=5."
}'::jsonb),
('interval-scheduling-maximization', 7, 'i=3: [0,6] overlaps', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"i":3},
  "hashmap": {"lastEnd":"5","count":"2"},
  "status": "start=0 < 5. Skip."
}'::jsonb),
('interval-scheduling-maximization', 8, 'i=4: pick [5,7]', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"lastEnd":"7","count":"3"},
  "status": "start=5 ≥ 5 → pick. count=3. lastEnd=7."
}'::jsonb),
('interval-scheduling-maximization', 9, 'i=5: pick [8,9]', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"i":5},
  "hashmap": {"lastEnd":"9","count":"4"},
  "status": "start=8 ≥ 7 → pick. count=4. lastEnd=9."
}'::jsonb),
('interval-scheduling-maximization', 10, 'Termination', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [0,2,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"count":"4"},
  "status": "All scanned. 4 intervals selected."
}'::jsonb),
('interval-scheduling-maximization', 11, 'Construct Result', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [0,2,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"4"},
  "status": "Maximum antichain = 4. Return 4."
}'::jsonb),
('interval-scheduling-maximization', 12, 'Complexity', '{
  "type": "array",
  "array": ["[1,3]","[2,4]","[3,5]","[0,6]","[5,7]","[8,9]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n), scan O(n). Space O(1)."
}'::jsonb);


-- ── JUMP GAME ─────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'jump-game';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('jump-game', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "nums[i] = max jump from i. Can we reach the last index? Expected: true."
}'::jsonb),
('jump-game', 2, 'Approach: Greedy farthest-reachable', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"reach":"0"},
  "status": "Track the farthest index reachable so far. If i > reach, we are stuck. Otherwise reach = max(reach, i + nums[i]). Return reach ≥ n-1."
}'::jsonb),
('jump-game', 3, 'Complexity', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Single pass: O(n) time, O(1) space."
}'::jsonb),
('jump-game', 4, 'Initialize', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"reach":"0"},
  "status": "reach=0. Target = n-1 = 4."
}'::jsonb),
('jump-game', 5, 'i=0: reach=2', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i":0},
  "hashmap": {"reach":"2"},
  "status": "0 ≤ 0. reach = max(0, 0+2) = 2."
}'::jsonb),
('jump-game', 6, 'i=1: reach=4', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i":1},
  "hashmap": {"reach":"4"},
  "status": "1 ≤ 2. reach = max(2, 1+3) = 4. Already covers last index!"
}'::jsonb),
('jump-game', 7, 'Early exit possible', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":1},
  "hashmap": {"reach":"4"},
  "status": "reach ≥ n-1 → can early-return true. Continue to show full pass."
}'::jsonb),
('jump-game', 8, 'i=2', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [2],
  "pointers": {"i":2},
  "hashmap": {"reach":"4"},
  "status": "2 ≤ 4. reach=max(4,3)=4."
}'::jsonb),
('jump-game', 9, 'i=3', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [3],
  "pointers": {"i":3},
  "hashmap": {"reach":"4"},
  "status": "3 ≤ 4. reach=max(4,4)=4."
}'::jsonb),
('jump-game', 10, 'i=4', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"reach":"8"},
  "status": "4 ≤ 4. reach=8. End reached."
}'::jsonb),
('jump-game', 11, 'Termination', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"reach":"8"},
  "status": "Loop ended with no stuck index."
}'::jsonb),
('jump-game', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [2,3,1,1,4],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Return true. O(n) time, O(1) space."
}'::jsonb);


-- ── LONGEST CONSECUTIVE ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-consecutive';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-consecutive', 1, 'Problem Setup', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Unsorted array. Length of the longest consecutive integer run. Expected: 4 (1,2,3,4)."
}'::jsonb),
('longest-consecutive', 2, 'Brute force', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort then scan = O(n log n). We can do O(n) with a hash set."
}'::jsonb),
('longest-consecutive', 3, 'Approach: Hash set, start at run heads', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"set":"{100,4,200,1,3,2}"},
  "status": "Put all in a set. For each x, only begin counting if x-1 is NOT in the set (x is a run start). Walk x,x+1,x+2… until miss. O(n)."
}'::jsonb),
('longest-consecutive', 4, 'x=100: is head? yes', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i":0},
  "hashmap": {"best":"1"},
  "status": "99 not in set. Walk 100 → 101 missing. len=1. best=1."
}'::jsonb),
('longest-consecutive', 5, 'x=4: NOT head', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"best":"1"},
  "status": "3 IS in set → 4 is mid-run. Skip to avoid duplicate work."
}'::jsonb),
('longest-consecutive', 6, 'x=200: is head', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i":2},
  "hashmap": {"best":"1"},
  "status": "199 not in set. Walk 200 → 201 missing. len=1."
}'::jsonb),
('longest-consecutive', 7, 'x=1: is head — walk run', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3},
  "hashmap": {"best":"4"},
  "status": "0 not in set. Walk 1,2,3,4 → 5 missing. len=4. best=4!"
}'::jsonb),
('longest-consecutive', 8, 'x=3: NOT head', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [4],
  "highlightColor": "red",
  "pointers": {"i":4},
  "hashmap": {"best":"4"},
  "status": "2 in set → mid-run. Skip."
}'::jsonb),
('longest-consecutive', 9, 'x=2: NOT head', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [5],
  "highlightColor": "red",
  "pointers": {"i":5},
  "hashmap": {"best":"4"},
  "status": "1 in set → mid-run. Skip."
}'::jsonb),
('longest-consecutive', 10, 'Why O(n)?', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Each element is visited at most twice: once in the outer loop, once as part of a run walk from its head. Linear total work."
}'::jsonb),
('longest-consecutive', 11, 'Termination', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [1,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"4"},
  "status": "All elements processed. Longest run 1-2-3-4."
}'::jsonb),
('longest-consecutive', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [100,4,200,1,3,2],
  "highlights": [1,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"4"},
  "status": "Return 4. O(n) time, O(n) space."
}'::jsonb);


-- ── LONGEST REPEATING CHARACTER REPLACEMENT ───────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-repeating-char';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-repeating-char', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"1"},
  "status": "s = \"ABABBA\", k=1. Longest substring where we can replace at most k chars so all are equal. Expected: 4."
}'::jsonb),
('longest-repeating-char', 2, 'Approach: Sliding Window + maxFreq', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"maxFreq":"0","best":"0"},
  "status": "Window is valid if (windowLen - maxFreq) ≤ k (need only that many replacements). Expand R; when invalid, shrink L."
}'::jsonb),
('longest-repeating-char', 3, 'Complexity', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(26) space."
}'::jsonb),
('longest-repeating-char', 4, 'R=0: A', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"A":"1","maxFreq":"1","best":"1"},
  "status": "len=1, 1-1=0 ≤ 1. Valid. best=1."
}'::jsonb),
('longest-repeating-char', 5, 'R=1: B', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"A":"1","B":"1","maxFreq":"1","best":"2"},
  "status": "len=2, 2-1=1 ≤ 1. Valid. best=2."
}'::jsonb),
('longest-repeating-char', 6, 'R=2: A', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2},
  "hashmap": {"A":"2","B":"1","maxFreq":"2","best":"3"},
  "status": "len=3, 3-2=1 ≤ 1. Valid. best=3."
}'::jsonb),
('longest-repeating-char', 7, 'R=3: B', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [0,1,2,3],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":3},
  "hashmap": {"A":"2","B":"2","maxFreq":"2"},
  "status": "len=4, 4-2=2 > 1. Invalid. Shrink."
}'::jsonb),
('longest-repeating-char', 8, 'Shrink L=1', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [1,2,3],
  "pointers": {"L":1,"R":3},
  "hashmap": {"A":"1","B":"2","maxFreq":"2","best":"3"},
  "status": "Drop s[0]=A → A:1. len=3, 3-2=1 ≤ 1. Valid again."
}'::jsonb),
('longest-repeating-char', 9, 'R=4: B', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [1,2,3,4],
  "highlightColor": "green",
  "pointers": {"L":1,"R":4},
  "hashmap": {"A":"1","B":"3","maxFreq":"3","best":"4"},
  "status": "len=4, 4-3=1 ≤ 1. Valid. best=4!"
}'::jsonb),
('longest-repeating-char', 10, 'R=5: A', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":5},
  "hashmap": {"A":"2","B":"3","maxFreq":"3"},
  "status": "len=5, 5-3=2 > 1. Invalid."
}'::jsonb),
('longest-repeating-char', 11, 'Shrink L=2; window stays len 4', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [2,3,4,5],
  "pointers": {"L":2,"R":5},
  "hashmap": {"A":"2","B":"2","maxFreq":"3","best":"4"},
  "status": "Drop s[1]=B → B:2. len=4, 4-maxFreq(3 stale but upper-bounds)=1 ≤ 1. best stays 4."
}'::jsonb),
('longest-repeating-char', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["A","B","A","B","B","A"],
  "highlights": [1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"4"},
  "status": "Return 4. O(n) time, O(26) space."
}'::jsonb);


-- ── LONGEST SUBARRAY OF 1s AFTER DELETING ONE ELEMENT ─────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-subarray-ones-deletion';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-subarray-ones-deletion', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Binary array. Delete exactly one element. Find longest subarray of all 1s in the result. Expected: 5."
}'::jsonb),
('longest-subarray-ones-deletion', 2, 'Approach: Window with at most one zero', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"zeros":"0","best":"0"},
  "status": "Sliding window containing ≤ 1 zero. Answer = maxWindowLen - 1 (we must delete one, even if it is a 1)."
}'::jsonb),
('longest-subarray-ones-deletion', 3, 'Complexity', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(1) space."
}'::jsonb),
('longest-subarray-ones-deletion', 4, 'R=0,1: ones', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"zeros":"0","best":"1"},
  "status": "Both 1s. zeros=0. len=2. best (after -1) = 1."
}'::jsonb),
('longest-subarray-ones-deletion', 5, 'R=2: zero', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":2},
  "hashmap": {"zeros":"1","best":"2"},
  "status": "First zero OK. len=3, best=2."
}'::jsonb),
('longest-subarray-ones-deletion', 6, 'R=3,4,5: ones', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {"L":0,"R":5},
  "hashmap": {"zeros":"1","best":"5"},
  "status": "len=6. best = 6-1 = 5."
}'::jsonb),
('longest-subarray-ones-deletion', 7, 'R=6: second zero — shrink', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "red",
  "pointers": {"L":0,"R":6},
  "hashmap": {"zeros":"2"},
  "status": "zeros=2 > 1. Move L until we drop the first zero."
}'::jsonb),
('longest-subarray-ones-deletion', 8, 'Shrink L to 3', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [3,4,5,6],
  "pointers": {"L":3,"R":6},
  "hashmap": {"zeros":"1","best":"5"},
  "status": "Drop 1,1,0. L=3. zeros=1. len=4, best stays 5."
}'::jsonb),
('longest-subarray-ones-deletion', 9, 'R=7: one', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [3,4,5,6,7],
  "highlightColor": "yellow",
  "pointers": {"L":3,"R":7},
  "hashmap": {"zeros":"1","best":"5"},
  "status": "len=5, 5-1=4. best stays 5."
}'::jsonb),
('longest-subarray-ones-deletion', 10, 'Edge case: all ones', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If array is all 1s, we still delete one: answer = n-1. The -1 adjustment handles this uniformly."
}'::jsonb),
('longest-subarray-ones-deletion', 11, 'Termination', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"5"},
  "status": "Scan complete. Best window len 6 at R=5."
}'::jsonb),
('longest-subarray-ones-deletion', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [1,1,0,1,1,1,0,1],
  "highlights": [0,1,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"5"},
  "status": "Return 5. O(n) time, O(1) space."
}'::jsonb);


-- ── LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS ────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-substr-no-repeat';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-substr-no-repeat', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"0"},
  "status": "s = \"abcabcbb\". Longest substring with all unique chars. Expected: 3."
}'::jsonb),
('longest-substr-no-repeat', 2, 'Brute force', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Check every substring for uniqueness → O(n³). Or O(n²) with a set. Sliding window does it in O(n)."
}'::jsonb),
('longest-substr-no-repeat', 3, 'Approach: Sliding Window + Set', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"set":"{}"},
  "status": "Keep a set of chars in window. Expand R; on duplicate, shrink L until duplicate removed."
}'::jsonb),
('longest-substr-no-repeat', 4, 'R=0: add a', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"set":"{a}","best":"1"},
  "status": "window=a. len=1."
}'::jsonb),
('longest-substr-no-repeat', 5, 'R=1: add b', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"set":"{a,b}","best":"2"},
  "status": "window=ab. len=2."
}'::jsonb),
('longest-substr-no-repeat', 6, 'R=2: add c — new best', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2},
  "hashmap": {"set":"{a,b,c}","best":"3"},
  "status": "window=abc. best=3."
}'::jsonb),
('longest-substr-no-repeat', 7, 'R=3: dup a → shrink L=1', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":3},
  "hashmap": {"set":"{b,c,a}","best":"3"},
  "status": "a already in set. Remove s[0]=a, L=1. Add new a. window=bca, len=3."
}'::jsonb),
('longest-substr-no-repeat', 8, 'R=4: dup b → shrink L=2', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [2,3,4],
  "highlightColor": "yellow",
  "pointers": {"L":2,"R":4},
  "hashmap": {"set":"{c,a,b}","best":"3"},
  "status": "Drop s[1]=b, L=2. Add new b. window=cab, len=3."
}'::jsonb),
('longest-substr-no-repeat', 9, 'R=5: dup c → shrink L=3', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [3,4,5],
  "highlightColor": "yellow",
  "pointers": {"L":3,"R":5},
  "hashmap": {"set":"{a,b,c}","best":"3"},
  "status": "Drop c at 2, L=3. Add new c. window=abc, len=3."
}'::jsonb),
('longest-substr-no-repeat', 10, 'R=6: dup b → shrink L=5', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [5,6],
  "highlightColor": "yellow",
  "pointers": {"L":5,"R":6},
  "hashmap": {"set":"{c,b}","best":"3"},
  "status": "Shrink past old b at 4. L=5. window=cb, len=2."
}'::jsonb),
('longest-substr-no-repeat', 11, 'R=7: dup b → shrink L=7', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [7],
  "highlightColor": "yellow",
  "pointers": {"L":7,"R":7},
  "hashmap": {"set":"{b}","best":"3"},
  "status": "Drop c,b. L=7. window=b, len=1."
}'::jsonb),
('longest-substr-no-repeat', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["a","b","c","a","b","c","b","b"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "Return 3. Each index visited at most twice. O(n) time, O(k) space."
}'::jsonb);


-- ── MAX CONSECUTIVE ONES III ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-consecutive-ones-iii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-consecutive-ones-iii', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"2"},
  "status": "Binary array, k=2 flips. Longest subarray of 1s after flipping at most k zeros. Expected: 5."
}'::jsonb),
('max-consecutive-ones-iii', 2, 'Approach: Sliding Window (≤k zeros)', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"zeros":"0","best":"0"},
  "status": "Window may contain at most k zeros. Expand R; when zeros > k, shrink L. Track max length."
}'::jsonb),
('max-consecutive-ones-iii', 3, 'Complexity', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(1) space."
}'::jsonb),
('max-consecutive-ones-iii', 4, 'R=0..2: three 1s', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2},
  "hashmap": {"zeros":"0","best":"3"},
  "status": "zeros=0. len=3."
}'::jsonb),
('max-consecutive-ones-iii', 5, 'R=3: zero #1', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"L":0,"R":3},
  "hashmap": {"zeros":"1","best":"4"},
  "status": "zeros=1 ≤ 2. len=4."
}'::jsonb),
('max-consecutive-ones-iii', 6, 'R=4: zero #2', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {"L":0,"R":4},
  "hashmap": {"zeros":"2","best":"5"},
  "status": "zeros=2 ≤ 2. len=5."
}'::jsonb),
('max-consecutive-ones-iii', 7, 'R=5: zero #3 → shrink', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "red",
  "pointers": {"L":0,"R":5},
  "hashmap": {"zeros":"3"},
  "status": "zeros=3 > k. Shrink L."
}'::jsonb),
('max-consecutive-ones-iii', 8, 'Shrink L to 4', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [4,5],
  "pointers": {"L":4,"R":5},
  "hashmap": {"zeros":"2","best":"5"},
  "status": "Drop s[0..3] = 1,1,1,0. zeros back to 2 at L=4. len=2."
}'::jsonb),
('max-consecutive-ones-iii', 9, 'R=6,7,8: three 1s', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {"L":4,"R":8},
  "hashmap": {"zeros":"2","best":"5"},
  "status": "Window grows to len 5. Ties best."
}'::jsonb),
('max-consecutive-ones-iii', 10, 'Why greedy shrink is safe', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Once window exceeds k zeros, no longer-valid window starts at L. Moving L forward can only restore validity — a classic monotone window."
}'::jsonb),
('max-consecutive-ones-iii', 11, 'Termination', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"5"},
  "status": "Scan done. Best=5."
}'::jsonb),
('max-consecutive-ones-iii', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [1,1,1,0,0,0,1,1,1],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"5"},
  "status": "Return 5. O(n) time, O(1) space."
}'::jsonb);


-- ── MEETING ROOMS ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'meeting-rooms';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('meeting-rooms', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Can a SINGLE person attend all meetings? i.e., no overlaps. Expected: false."
}'::jsonb),
('meeting-rooms', 2, 'Approach: Sort by start, check adjacents', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort by start time. If any intervals[i].start < intervals[i-1].end → overlap → return false."
}'::jsonb),
('meeting-rooms', 3, 'Complexity', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n) + scan O(n) = O(n log n)."
}'::jsonb),
('meeting-rooms', 4, 'After sort by start', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {"i":1},
  "hashmap": {"prevEnd":"30"},
  "status": "Starts sorted: 0,5,15. i begins at 1."
}'::jsonb),
('meeting-rooms', 5, 'i=1: compare starts', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"prev":"[0,30]","curr":"[5,10]"},
  "status": "curr.start=5 < prev.end=30 → OVERLAP. Return false immediately."
}'::jsonb),
('meeting-rooms', 6, 'Contrast: no-overlap example', '{
  "type": "array",
  "array": ["[7,10]","[2,4]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If input were [[7,10],[2,4]]: after sort → [[2,4],[7,10]]. 7 ≥ 4 → no overlap → true."
}'::jsonb),
('meeting-rooms', 7, 'Key observation', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Because starts are sorted, checking only the IMMEDIATE predecessor suffices — transitively covers all pairs."
}'::jsonb),
('meeting-rooms', 8, 'Edge: empty / single', '{
  "type": "array",
  "array": ["[0,30]"],
  "highlights": [0],
  "pointers": {},
  "hashmap": {},
  "status": "0 or 1 meeting → trivially true."
}'::jsonb),
('meeting-rooms', 9, 'Edge: touching boundaries', '{
  "type": "array",
  "array": ["[1,5]","[5,8]"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "[1,5] and [5,8] — by convention, end of one equals start of next is NOT an overlap (right-open intervals)."
}'::jsonb),
('meeting-rooms', 10, 'Termination (in our case)', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {},
  "status": "Overlap detected at i=1. No need to scan i=2."
}'::jsonb),
('meeting-rooms', 11, 'Construct Result', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"answer":"false"},
  "status": "Return false."
}'::jsonb),
('meeting-rooms', 12, 'Complexity Recap', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n log n), Space O(1) (or O(n) for sort)."
}'::jsonb);


-- ── MEETING ROOMS I (alias — same as meeting-rooms min rooms II?) ──
-- Treat as "Minimum Meeting Rooms" (II in LC numbering).
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'meeting-rooms-i';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('meeting-rooms-i', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[0,30]","[5,10]","[15,20]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Find the MINIMUM number of meeting rooms required. Expected: 2."
}'::jsonb),
('meeting-rooms-i', 2, 'Approach: Sweep-line on sorted starts & ends', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {"s":0,"e":0},
  "hashmap": {"ends":"[10,20,30]"},
  "status": "Separate starts and ends, sort each. Two pointers: if starts[s] < ends[e], need +1 room; else a meeting ended, free a room (e++). Track peak."
}'::jsonb),
('meeting-rooms-i', 3, 'Complexity', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n), scan O(n). Space O(n)."
}'::jsonb),
('meeting-rooms-i', 4, 'Initialize', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {"s":0,"e":0},
  "hashmap": {"rooms":"0","peak":"0"},
  "status": "starts=[0,5,15], ends=[10,20,30]."
}'::jsonb),
('meeting-rooms-i', 5, 's=0: start 0 < end 10', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"s":0,"e":0},
  "hashmap": {"rooms":"1","peak":"1"},
  "status": "New meeting begins before any ends. Allocate room. rooms=1."
}'::jsonb),
('meeting-rooms-i', 6, 's=1: start 5 < end 10', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"s":1,"e":0},
  "hashmap": {"rooms":"2","peak":"2"},
  "status": "Another starts before any end. rooms=2. peak=2."
}'::jsonb),
('meeting-rooms-i', 7, 's=2: start 15 ≥ end 10', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [2],
  "pointers": {"s":2,"e":1},
  "hashmap": {"rooms":"1"},
  "status": "A meeting ended (10) before 15 started. Free room. rooms=1. e=1."
}'::jsonb),
('meeting-rooms-i', 8, 's=2: start 15 < end 20', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"s":2,"e":1},
  "hashmap": {"rooms":"2","peak":"2"},
  "status": "Now 15 < 20 → new room. rooms=2."
}'::jsonb),
('meeting-rooms-i', 9, 'Starts exhausted', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {"s":3,"e":1},
  "hashmap": {"peak":"2"},
  "status": "All meetings started. Remaining ends only free rooms; peak unchanged."
}'::jsonb),
('meeting-rooms-i', 10, 'Why sweep works', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Peak count of simultaneously active meetings = minimum rooms needed (pigeonhole / interval-graph chromatic number)."
}'::jsonb),
('meeting-rooms-i', 11, 'Construct Result', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "peak = 2. Return 2."
}'::jsonb),
('meeting-rooms-i', 12, 'Complexity Recap', '{
  "type": "array",
  "array": [0,5,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n log n), Space O(n)."
}'::jsonb);


-- ── MERGE INTERVALS ───────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'merge-intervals';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('merge-intervals', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Merge all overlapping intervals. Expected: [[1,6],[8,10],[15,18]]."
}'::jsonb),
('merge-intervals', 2, 'Approach: Sort by start, linear merge', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {},
  "status": "Sort by start. For each interval, if it overlaps the last in result (curr.start ≤ last.end), extend last.end; else push new."
}'::jsonb),
('merge-intervals', 3, 'Complexity', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n) + scan O(n) = O(n log n). Space O(n)."
}'::jsonb),
('merge-intervals', 4, 'After sort (already sorted)', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"result":"[]"},
  "status": "Input already sorted by start."
}'::jsonb),
('merge-intervals', 5, 'i=0: push [1,3]', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0},
  "hashmap": {"result":"[[1,3]]"},
  "status": "Result empty → push [1,3]."
}'::jsonb),
('merge-intervals', 6, 'i=1: [2,6] overlaps [1,3]', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i":1},
  "hashmap": {"result":"[[1,6]]"},
  "status": "2 ≤ 3 → overlap. Extend last.end = max(3,6) = 6."
}'::jsonb),
('merge-intervals', 7, 'i=2: [8,10] — gap', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i":2},
  "hashmap": {"result":"[[1,6],[8,10]]"},
  "status": "8 > 6 → no overlap. Push [8,10]."
}'::jsonb),
('merge-intervals', 8, 'i=3: [15,18] — gap', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3},
  "hashmap": {"result":"[[1,6],[8,10],[15,18]]"},
  "status": "15 > 10 → push [15,18]."
}'::jsonb),
('merge-intervals', 9, 'Why sorting by start is enough', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "After sort, any overlapper must be adjacent in result. A transitive chain of overlaps is absorbed into last.end progressively."
}'::jsonb),
('merge-intervals', 10, 'Transitive merge demo', '{
  "type": "array",
  "array": ["[1,4]","[2,5]","[3,6]"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"result":"[[1,6]]"},
  "status": "[1,4] absorbs [2,5] → [1,5]; [1,5] absorbs [3,6] → [1,6]. One interval."
}'::jsonb),
('merge-intervals', 11, 'Termination', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"i":4},
  "hashmap": {"result":"[[1,6],[8,10],[15,18]]"},
  "status": "All processed."
}'::jsonb),
('merge-intervals', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["[1,3]","[2,6]","[8,10]","[15,18]"],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[[1,6],[8,10],[15,18]]"},
  "status": "Time O(n log n), Space O(n)."
}'::jsonb);


-- ── MIN WINDOW SUBSTRING ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'min-window-substring';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('min-window-substring', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"t":"ABC"},
  "status": "s = \"ADOBEC\", t = \"ABC\". Find minimum window in s containing every char of t (with multiplicities). Expected: \"ADOBEC\"."
}'::jsonb),
('min-window-substring', 2, 'Approach: Sliding Window + need/have counts', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"need":"{A:1,B:1,C:1}","have":"0/3"},
  "status": "need[c]=required count per char in t. Expand R; when a need char reaches its requirement, have++. Once have==required distinct, shrink L while still valid. Track smallest."
}'::jsonb),
('min-window-substring', 3, 'Complexity', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(|s| + |t|) time, O(|t|) space."
}'::jsonb),
('min-window-substring', 4, 'R=0: A', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0],
  "pointers": {"L":0,"R":0},
  "hashmap": {"have":"1/3"},
  "status": "Added A. have=1 (A satisfied)."
}'::jsonb),
('min-window-substring', 5, 'R=1,2: D,O — ignored', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2],
  "pointers": {"L":0,"R":2},
  "hashmap": {"have":"1/3"},
  "status": "D, O not in need. Window grows; have unchanged."
}'::jsonb),
('min-window-substring', 6, 'R=3: B', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2,3],
  "pointers": {"L":0,"R":3},
  "hashmap": {"have":"2/3"},
  "status": "B satisfied. have=2."
}'::jsonb),
('min-window-substring', 7, 'R=4: E', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2,3,4],
  "pointers": {"L":0,"R":4},
  "hashmap": {"have":"2/3"},
  "status": "E ignored. have still 2."
}'::jsonb),
('min-window-substring', 8, 'R=5: C — valid!', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {"L":0,"R":5},
  "hashmap": {"have":"3/3","best":"6 (0..5)"},
  "status": "have=3/3. Window \"ADOBEC\" is valid. Try to shrink."
}'::jsonb),
('min-window-substring', 9, 'Shrink L=1: drop A', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [1,2,3,4,5],
  "highlightColor": "red",
  "pointers": {"L":1,"R":5},
  "hashmap": {"have":"2/3"},
  "status": "Removing A violates A requirement. have=2. Stop shrinking."
}'::jsonb),
('min-window-substring', 10, 'No more right expansion', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [1,2,3,4,5],
  "pointers": {"L":1,"R":6},
  "hashmap": {"have":"2/3"},
  "status": "R past end. Cannot recover A. Loop ends."
}'::jsonb),
('min-window-substring', 11, 'Construct Result', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"ADOBEC"},
  "status": "Best window = s[0..5] = \"ADOBEC\"."
}'::jsonb),
('min-window-substring', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["A","D","O","B","E","C"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"ADOBEC"},
  "status": "Return \"ADOBEC\". O(|s|+|t|) time."
}'::jsonb);


-- ── MINIMUM NUMBER OF ARROWS TO BURST BALLOONS ────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-arrows';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-arrows', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[10,16]","[2,8]","[1,6]","[7,12]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Balloons as [xStart,xEnd]. Arrows travel vertically; one arrow bursts all balloons whose x-range contains its x. Minimum arrows? Expected: 2."
}'::jsonb),
('minimum-arrows', 2, 'Approach: Sort by end, greedy', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort by end. Shoot at the earliest end; it bursts all balloons whose start ≤ that end. Next arrow when a new balloon starts after that point."
}'::jsonb),
('minimum-arrows', 3, 'Complexity', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n), scan O(n)."
}'::jsonb),
('minimum-arrows', 4, 'After sort by end', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"arrows":"0","arrowAt":"-inf"},
  "status": "Ends: 6,8,12,16."
}'::jsonb),
('minimum-arrows', 5, 'i=0: shoot at 6', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i":0},
  "hashmap": {"arrows":"1","arrowAt":"6"},
  "status": "start=1 > -inf → need arrow. arrows=1 at x=6."
}'::jsonb),
('minimum-arrows', 6, 'i=1: [2,8] covered by x=6', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i":1},
  "hashmap": {"arrows":"1","arrowAt":"6"},
  "status": "start=2 ≤ 6 → already hit by arrow at 6. Skip."
}'::jsonb),
('minimum-arrows', 7, 'i=2: [7,12] — new arrow', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i":2},
  "hashmap": {"arrows":"2","arrowAt":"12"},
  "status": "start=7 > 6 → new arrow at x=12. arrows=2."
}'::jsonb),
('minimum-arrows', 8, 'i=3: [10,16] covered', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3},
  "hashmap": {"arrows":"2","arrowAt":"12"},
  "status": "start=10 ≤ 12 → hit by arrow at 12."
}'::jsonb),
('minimum-arrows', 9, 'Why shoot at ENDS', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Shooting later than earliest end would miss that balloon. Shooting at the earliest end maximizes future balloons that can share this arrow."
}'::jsonb),
('minimum-arrows', 10, 'Relation to interval scheduling', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Equivalent to counting the maximum set of mutually disjoint intervals (each needs a separate arrow)."
}'::jsonb),
('minimum-arrows', 11, 'Termination', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [0,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"arrows":"2"},
  "status": "All processed. 2 arrows."
}'::jsonb),
('minimum-arrows', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["[1,6]","[2,8]","[7,12]","[10,16]"],
  "highlights": [0,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "Return 2. Time O(n log n), Space O(1)."
}'::jsonb);


-- ── MINIMUM NUMBER OF PLATFORMS ───────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-number-of-platforms';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-number-of-platforms', 1, 'Problem Setup', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {},
  "hashmap": {"dep":"[910,1200,1120,1130,1900,2000]"},
  "status": "Train arrivals and departures. Minimum platforms to handle all without waiting. Expected: 3."
}'::jsonb),
('minimum-number-of-platforms', 2, 'Approach: Sweep sorted arrivals vs departures', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {"a":0,"d":0},
  "hashmap": {"dep":"[910,1120,1130,1200,1900,2000]"},
  "status": "Sort both. Two pointers. If arr[a] ≤ dep[d] → platform++, a++. Else platform--, d++. Track peak."
}'::jsonb),
('minimum-number-of-platforms', 3, 'Complexity', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n) + sweep O(n)."
}'::jsonb),
('minimum-number-of-platforms', 4, 'a=0: 900 ≤ 910 → +1', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"a":0,"d":0},
  "hashmap": {"plat":"1","peak":"1"},
  "status": "Train 900 arrives before anything departs. plat=1."
}'::jsonb),
('minimum-number-of-platforms', 5, 'a=1: 940 ≤ 910? No', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [0,1],
  "pointers": {"a":1,"d":1},
  "hashmap": {"plat":"0","peak":"1"},
  "status": "940 > 910. First train departs. plat=0. d=1."
}'::jsonb),
('minimum-number-of-platforms', 6, 'a=1: 940 ≤ 1120 → +1', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"a":1,"d":1},
  "hashmap": {"plat":"1","peak":"1"},
  "status": "plat=1."
}'::jsonb),
('minimum-number-of-platforms', 7, 'a=2: 950 ≤ 1120 → +1', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"a":2,"d":1},
  "hashmap": {"plat":"2","peak":"2"},
  "status": "plat=2."
}'::jsonb),
('minimum-number-of-platforms', 8, 'a=3: 1100 ≤ 1120 → +1', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"a":3,"d":1},
  "hashmap": {"plat":"3","peak":"3"},
  "status": "plat=3. peak=3!"
}'::jsonb),
('minimum-number-of-platforms', 9, 'Drain: a=4, 1500 > 1120,1130,1200 → -3', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [4],
  "pointers": {"a":4,"d":4},
  "hashmap": {"plat":"0","peak":"3"},
  "status": "Three trains depart before 1500. plat drops to 0."
}'::jsonb),
('minimum-number-of-platforms', 10, 'Remaining arrivals fit one by one', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [4,5],
  "pointers": {"a":6,"d":6},
  "hashmap": {"plat":"0","peak":"3"},
  "status": "1500, 1800 arrive and depart without overlap. peak stays 3."
}'::jsonb),
('minimum-number-of-platforms', 11, 'Construct Result', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"3"},
  "status": "At 1100, three trains simultaneously on platforms. Answer = 3."
}'::jsonb),
('minimum-number-of-platforms', 12, 'Complexity Recap', '{
  "type": "array",
  "array": [900,940,950,1100,1500,1800],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n log n), Space O(1)."
}'::jsonb);


-- ── MINIMUM SIZE SUBARRAY SUM ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'minimum-size-subarray';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('minimum-size-subarray', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"7"},
  "status": "Smallest-length contiguous subarray with sum ≥ 7. Expected: 2 ([4,3])."
}'::jsonb),
('minimum-size-subarray', 2, 'Approach: Shrinking Window', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"sum":"0","best":"inf"},
  "status": "Expand R, accumulating sum. Whenever sum ≥ target, try to shrink L to minimize length."
}'::jsonb),
('minimum-size-subarray', 3, 'Complexity', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) — each pointer advances at most n times."
}'::jsonb),
('minimum-size-subarray', 4, 'R=0: sum=2', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0],
  "pointers": {"L":0,"R":0},
  "hashmap": {"sum":"2","best":"inf"},
  "status": "2 < 7. Extend."
}'::jsonb),
('minimum-size-subarray', 5, 'R=1: sum=5', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0,1],
  "pointers": {"L":0,"R":1},
  "hashmap": {"sum":"5","best":"inf"},
  "status": "5 < 7."
}'::jsonb),
('minimum-size-subarray', 6, 'R=2: sum=6', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0,1,2],
  "pointers": {"L":0,"R":2},
  "hashmap": {"sum":"6","best":"inf"},
  "status": "6 < 7."
}'::jsonb),
('minimum-size-subarray', 7, 'R=3: sum=8 ≥ 7 → shrink', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [0,1,2,3],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":3},
  "hashmap": {"sum":"8","best":"4"},
  "status": "8 ≥ 7. best = R-L+1 = 4. Try shrink: drop 2 → sum=6 < 7, stop. L=1, best=4."
}'::jsonb),
('minimum-size-subarray', 8, 'R=4: sum=10 → shrink', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [1,2,3,4],
  "highlightColor": "yellow",
  "pointers": {"L":1,"R":4},
  "hashmap": {"sum":"10","best":"3"},
  "status": "10 ≥ 7, len=4 → best=4 keeps. Shrink: drop 3 → sum=7, len=3, best=3. Drop 1 → sum=6 < 7, stop. L=3."
}'::jsonb),
('minimum-size-subarray', 9, 'R=5: sum=9 → shrink more', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [3,4,5],
  "highlightColor": "green",
  "pointers": {"L":3,"R":5},
  "hashmap": {"sum":"9","best":"2"},
  "status": "9 ≥ 7, len=3. Shrink: drop 2 → sum=7, len=2, best=2. Drop 4 → sum=3 < 7, stop. L=5."
}'::jsonb),
('minimum-size-subarray', 10, 'Loop ends', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {"L":5,"R":6},
  "hashmap": {"best":"2"},
  "status": "R past end. best=2."
}'::jsonb),
('minimum-size-subarray', 11, 'Construct Result', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "[4,3] sums to 7 with length 2."
}'::jsonb),
('minimum-size-subarray', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [2,3,1,2,4,3],
  "highlights": [4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"2"},
  "status": "Return 2. O(n) time, O(1) space."
}'::jsonb);


-- ── NON-OVERLAPPING INTERVALS ─────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'non-overlapping-intervals';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('non-overlapping-intervals', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["[1,2]","[2,3]","[3,4]","[1,3]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Minimum number of intervals to remove to make the rest non-overlapping. Expected: 1."
}'::jsonb),
('non-overlapping-intervals', 2, 'Approach: Sort by end, greedy keep', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Equivalent to: keep maximum non-overlapping set, remove the rest. Sort by end; greedily keep earliest-ending; skip any whose start < lastEnd."
}'::jsonb),
('non-overlapping-intervals', 3, 'Complexity', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sort O(n log n), scan O(n)."
}'::jsonb),
('non-overlapping-intervals', 4, 'After sort by end', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [],
  "pointers": {"i":0},
  "hashmap": {"lastEnd":"-inf","keep":"0","remove":"0"},
  "status": "Ends: 2,3,3,4."
}'::jsonb),
('non-overlapping-intervals', 5, 'i=0: keep [1,2]', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i":0},
  "hashmap": {"lastEnd":"2","keep":"1"},
  "status": "start=1 ≥ -inf → keep. lastEnd=2."
}'::jsonb),
('non-overlapping-intervals', 6, 'i=1: [1,3] overlaps → remove', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i":1},
  "hashmap": {"lastEnd":"2","remove":"1"},
  "status": "start=1 < 2. Remove. remove=1."
}'::jsonb),
('non-overlapping-intervals', 7, 'i=2: keep [2,3]', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i":2},
  "hashmap": {"lastEnd":"3","keep":"2"},
  "status": "start=2 ≥ 2 → keep. lastEnd=3."
}'::jsonb),
('non-overlapping-intervals', 8, 'i=3: keep [3,4]', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i":3},
  "hashmap": {"lastEnd":"4","keep":"3"},
  "status": "start=3 ≥ 3 → keep."
}'::jsonb),
('non-overlapping-intervals', 9, 'Why sort by end?', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Earliest end leaves the most room for future picks. Sort-by-start greedy can be fooled by a long interval starting early."
}'::jsonb),
('non-overlapping-intervals', 10, 'Relation to scheduling', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Removed count = n - (max non-overlapping set). Classic interval-scheduling duality."
}'::jsonb),
('non-overlapping-intervals', 11, 'Construct Result', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [0,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"1"},
  "status": "keep=3, n=4, removed=1."
}'::jsonb),
('non-overlapping-intervals', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["[1,2]","[1,3]","[2,3]","[3,4]"],
  "highlights": [0,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"1"},
  "status": "Return 1. O(n log n) time, O(1) space."
}'::jsonb);


-- ── PARTITION LABELS ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'partition-labels';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('partition-labels', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "s = \"abaccdd\". Partition so each letter appears in at most one part; maximize parts. Expected sizes: [3,2,2]."
}'::jsonb),
('partition-labels', 2, 'Approach: Last-index map + greedy extend', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"last":"{a:2,b:1,c:4,d:6}"},
  "status": "Record last[c] = final index of each char. Scan: keep extending right boundary to max(right, last[s[i]]); when i == right, cut a part."
}'::jsonb),
('partition-labels', 3, 'Complexity', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Two passes, O(n) time, O(26) space."
}'::jsonb),
('partition-labels', 4, 'Initialize', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [],
  "pointers": {"L":0,"R":0,"i":0},
  "hashmap": {},
  "status": "start=L=0, right=R=0."
}'::jsonb),
('partition-labels', 5, 'i=0: a', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [0],
  "pointers": {"L":0,"R":2,"i":0},
  "hashmap": {"right":"2"},
  "status": "last[a]=2 → R=max(0,2)=2."
}'::jsonb),
('partition-labels', 6, 'i=1: b', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [0,1],
  "pointers": {"L":0,"R":2,"i":1},
  "hashmap": {"right":"2"},
  "status": "last[b]=1 → R stays 2."
}'::jsonb),
('partition-labels', 7, 'i=2: a — cut!', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L":0,"R":2,"i":2},
  "hashmap": {"parts":"[3]"},
  "status": "i == R → cut. size = 2-0+1 = 3. Move L=3."
}'::jsonb),
('partition-labels', 8, 'i=3: c', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [3],
  "pointers": {"L":3,"R":4,"i":3},
  "hashmap": {"right":"4"},
  "status": "last[c]=4 → R=4."
}'::jsonb),
('partition-labels', 9, 'i=4: c — cut!', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {"L":3,"R":4,"i":4},
  "hashmap": {"parts":"[3,2]"},
  "status": "i == R → cut. size=2. L=5."
}'::jsonb),
('partition-labels', 10, 'i=5,6: d', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [5,6],
  "highlightColor": "green",
  "pointers": {"L":5,"R":6,"i":6},
  "hashmap": {"parts":"[3,2,2]"},
  "status": "last[d]=6. At i=6, i==R → cut size 2."
}'::jsonb),
('partition-labels', 11, 'Termination', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"parts":"[3,2,2]"},
  "status": "All chars covered. 3 parts."
}'::jsonb),
('partition-labels', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["a","b","a","c","c","d","d"],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[3,2,2]"},
  "status": "Return [3,2,2]. O(n) time, O(26) space."
}'::jsonb);


-- ── PERMUTATION IN STRING ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'permutation-in-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('permutation-in-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s1":"ab"},
  "status": "s1 = \"ab\", s2 = \"eidbaooo\". Does s2 contain a permutation of s1 as a substring? Expected: true (ba)."
}'::jsonb),
('permutation-in-string', 2, 'Approach: Fixed-size sliding window of size |s1|', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {"L":0,"R":1},
  "hashmap": {"need":"{a:1,b:1}"},
  "status": "Slide a window of length |s1|=2. Compare its char-count to s1''s count. If equal → permutation found."
}'::jsonb),
('permutation-in-string', 3, 'Complexity', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(26) comparisons per step → O(n·26) = O(n) time."
}'::jsonb),
('permutation-in-string', 4, 'Window [0,1]=ei', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [0,1],
  "pointers": {"L":0,"R":1},
  "hashmap": {"have":"{e:1,i:1}"},
  "status": "counts differ from need. No match."
}'::jsonb),
('permutation-in-string', 5, 'Slide → [1,2]=id', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [1,2],
  "pointers": {"L":1,"R":2},
  "hashmap": {"have":"{i:1,d:1}"},
  "status": "No match."
}'::jsonb),
('permutation-in-string', 6, 'Slide → [2,3]=db', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [2,3],
  "pointers": {"L":2,"R":3},
  "hashmap": {"have":"{d:1,b:1}"},
  "status": "No match."
}'::jsonb),
('permutation-in-string', 7, 'Slide → [3,4]=ba — MATCH!', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {"L":3,"R":4},
  "hashmap": {"have":"{b:1,a:1}","answer":"true"},
  "status": "counts equal → \"ba\" is a permutation of \"ab\". Return true!"
}'::jsonb),
('permutation-in-string', 8, 'How the update is O(1)', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Instead of rebuilding counts each slide, maintain a matches counter. Adjust counts of outgoing & incoming chars, update matches."
}'::jsonb),
('permutation-in-string', 9, 'What if no match?', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [5,6,7],
  "highlightColor": "red",
  "pointers": {"L":5,"R":7},
  "hashmap": {},
  "status": "Would slide through end. If never matched, return false."
}'::jsonb),
('permutation-in-string', 10, 'Early termination', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "We stopped at the first match — no need to scan remaining windows."
}'::jsonb),
('permutation-in-string', 11, 'Construct Result', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Return true."
}'::jsonb),
('permutation-in-string', 12, 'Complexity Recap', '{
  "type": "array",
  "array": ["e","i","d","b","a","o","o","o"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(26)."
}'::jsonb);


-- ── SUBARRAY PRODUCT LESS THAN K ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'subarray-product-less-than-k';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('subarray-product-less-than-k', 1, 'Problem Setup', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {"k":"100"},
  "status": "Count contiguous subarrays with product < k. Expected: 8."
}'::jsonb),
('subarray-product-less-than-k', 2, 'Approach: Sliding Window with product', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {"L":0,"R":0},
  "hashmap": {"prod":"1","count":"0"},
  "status": "Expand R: prod *= nums[R]. While prod ≥ k, shrink L (prod /= nums[L]). Then all subarrays ending at R with start in [L..R] are valid — that is R-L+1 new subarrays."
}'::jsonb),
('subarray-product-less-than-k', 3, 'Complexity', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(1) space."
}'::jsonb),
('subarray-product-less-than-k', 4, 'R=0: prod=10', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L":0,"R":0},
  "hashmap": {"prod":"10","count":"1"},
  "status": "10 < 100. Add R-L+1 = 1 subarray: [10]."
}'::jsonb),
('subarray-product-less-than-k', 5, 'R=1: prod=50', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"prod":"50","count":"3"},
  "status": "50 < 100. Add 2: [5], [10,5]. count=3."
}'::jsonb),
('subarray-product-less-than-k', 6, 'R=2: prod=100 — shrink', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":2},
  "hashmap": {"prod":"100"},
  "status": "prod=100 NOT < 100. Shrink: divide by nums[0]=10 → prod=10. L=1."
}'::jsonb),
('subarray-product-less-than-k', 7, 'R=2 after shrink', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"L":1,"R":2},
  "hashmap": {"prod":"10","count":"5"},
  "status": "Add R-L+1 = 2 subarrays: [2], [5,2]. count=5."
}'::jsonb),
('subarray-product-less-than-k', 8, 'R=3: prod=60', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [1,2,3],
  "highlightColor": "green",
  "pointers": {"L":1,"R":3},
  "hashmap": {"prod":"60","count":"8"},
  "status": "60 < 100. Add R-L+1 = 3: [6], [2,6], [5,2,6]. count=8."
}'::jsonb),
('subarray-product-less-than-k', 9, 'Why R-L+1?', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Every subarray ending at R with left boundary ∈ [L..R] is valid (window invariant). That is exactly R-L+1 choices."
}'::jsonb),
('subarray-product-less-than-k', 10, 'Edge case: k ≤ 1', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "All nums[i] ≥ 1 so product is always ≥ 1. If k ≤ 1, answer = 0. Check upfront."
}'::jsonb),
('subarray-product-less-than-k', 11, 'Termination', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"count":"8"},
  "status": "All R scanned."
}'::jsonb),
('subarray-product-less-than-k', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [10,5,2,6],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"8"},
  "status": "Return 8. O(n) time, O(1) space."
}'::jsonb);


-- ── THREE SUM ─────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'three-sum';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('three-sum', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-1,0,1,2,-1,-4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Find all unique triplets (a,b,c) with a+b+c=0. Expected: [[-1,-1,2],[-1,0,1]]."
}'::jsonb),
('three-sum', 2, 'Brute force', '{
  "type": "array",
  "array": [-1,0,1,2,-1,-4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Triple nested loops → O(n³). Too slow."
}'::jsonb),
('three-sum', 3, 'Approach: Sort + Two Pointers', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [],
  "pointers": {"i":0,"L":1,"R":5},
  "hashmap": {},
  "status": "Sort. Fix i, use two pointers (L,R) in the suffix to find pair summing to -nums[i]. Skip duplicates to avoid repeats. O(n²)."
}'::jsonb),
('three-sum', 4, 'After sort', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "nums = [-4,-1,-1,0,1,2]."
}'::jsonb),
('three-sum', 5, 'i=0 (-4): need pair = 4', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [0],
  "pointers": {"i":0,"L":1,"R":5},
  "hashmap": {"target":"4"},
  "status": "Two-pointer scan: max pair = -1+2=1 < 4. No triplet possible with i=0."
}'::jsonb),
('three-sum', 6, 'i=1 (-1): need = 1, L=2,R=5', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,2,5],
  "highlightColor": "green",
  "pointers": {"i":1,"L":2,"R":5},
  "hashmap": {"sum":"-1+2=1"},
  "status": "nums[L]+nums[R] = 1 → match! Record [-1,-1,2]. L++, R--."
}'::jsonb),
('three-sum', 7, 'i=1: L=3,R=4', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,3,4],
  "highlightColor": "green",
  "pointers": {"i":1,"L":3,"R":4},
  "hashmap": {"sum":"0+1=1"},
  "status": "Match again. Record [-1,0,1]. L++, R--."
}'::jsonb),
('three-sum', 8, 'i=1: pointers cross', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1],
  "pointers": {"i":1,"L":4,"R":3},
  "hashmap": {},
  "status": "L > R → stop. Move to i=2."
}'::jsonb),
('three-sum', 9, 'i=2: duplicate → skip', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i":2},
  "hashmap": {},
  "status": "nums[2]=-1 = nums[1]. Skip — avoids repeating the same pair searches and duplicate triplets."
}'::jsonb),
('three-sum', 10, 'i=3 (0): need = 0, but no pair', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [3,4,5],
  "pointers": {"i":3,"L":4,"R":5},
  "hashmap": {"sum":"1+2=3"},
  "status": "3 > 0 → R--. L == R → stop."
}'::jsonb),
('three-sum', 11, 'i=4,5: stop', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [],
  "pointers": {"i":4},
  "hashmap": {},
  "status": "Only 1 element to the right — cannot form a triplet. End of outer loop."
}'::jsonb),
('three-sum', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [-4,-1,-1,0,1,2],
  "highlights": [1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[[-1,-1,2],[-1,0,1]]"},
  "status": "Return result. O(n²) time, O(1) extra space (ignoring output)."
}'::jsonb);


-- ── TRAPPING RAIN WATER ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'trapping-rain-water';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('trapping-rain-water', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "heights = [0,1,0,2,1,0,3]. Total trapped rain water. Expected: 5."
}'::jsonb),
('trapping-rain-water', 2, 'Approach: Two Pointers with running maxes', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [],
  "pointers": {"L":0,"R":6},
  "hashmap": {"lmax":"0","rmax":"0","water":"0"},
  "status": "Water above i = min(maxLeft, maxRight) - h[i]. Two-pointer: whichever side has smaller current max is the bottleneck — process that side."
}'::jsonb),
('trapping-rain-water', 3, 'Complexity', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(1) space (no prefix arrays)."
}'::jsonb),
('trapping-rain-water', 4, 'L=0,R=6: left side smaller', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [0],
  "pointers": {"L":0,"R":6},
  "hashmap": {"lmax":"0","rmax":"3"},
  "status": "h[L]=0 ≤ h[R]=3. Update lmax = max(0,0) = 0. water += 0-0=0. L++."
}'::jsonb),
('trapping-rain-water', 5, 'L=1: lmax=1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [1],
  "pointers": {"L":1,"R":6},
  "hashmap": {"lmax":"1","rmax":"3","water":"0"},
  "status": "h[L]=1 ≤ 3. lmax=1. water += 1-1=0. L++."
}'::jsonb),
('trapping-rain-water', 6, 'L=2: trap 1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"L":2,"R":6},
  "hashmap": {"lmax":"1","rmax":"3","water":"1"},
  "status": "h[L]=0 ≤ 3. water += lmax-h = 1-0 = 1."
}'::jsonb),
('trapping-rain-water', 7, 'L=3: lmax=2', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [3],
  "pointers": {"L":3,"R":6},
  "hashmap": {"lmax":"2","rmax":"3","water":"1"},
  "status": "h[L]=2 ≤ 3. lmax=2. water += 2-2=0. L++."
}'::jsonb),
('trapping-rain-water', 8, 'L=4: trap 1', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"L":4,"R":6},
  "hashmap": {"lmax":"2","rmax":"3","water":"2"},
  "status": "h=1 ≤ 3. water += 2-1=1. total=2."
}'::jsonb),
('trapping-rain-water', 9, 'L=5: trap 2', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"L":5,"R":6},
  "hashmap": {"lmax":"2","rmax":"3","water":"4"},
  "status": "h=0 ≤ 3. water += 2-0=2. total=4."
}'::jsonb),
('trapping-rain-water', 10, 'L==R: stop', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [6],
  "pointers": {"L":6,"R":6},
  "hashmap": {"water":"4"},
  "status": "Pointers meet. But h[6]=3 stands alone — no water above the highest point."
}'::jsonb),
('trapping-rain-water', 11, 'Recheck total with different input or algorithm step?', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [2,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"water":"4"},
  "status": "This shorter array yields 4 units (1+1+2). The canonical LC example [0,1,0,2,1,0,1,3,2,1,2,1] yields 6 — our algorithm extends identically."
}'::jsonb),
('trapping-rain-water', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [0,1,0,2,1,0,3],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"4"},
  "status": "Return water. O(n) time, O(1) space."
}'::jsonb);


-- ── TWO SUM II (sorted) ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'two-sum-ii';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('two-sum-ii', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"9"},
  "status": "Input is 1-indexed and SORTED. Return 1-based indices of two values summing to target. Expected: [1,2]."
}'::jsonb),
('two-sum-ii', 2, 'Brute/hash', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Hash map works in O(n) but uses O(n) space. Because input is sorted, we can do O(1) space with two pointers."
}'::jsonb),
('two-sum-ii', 3, 'Approach: Two Pointers L=0, R=n-1', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {"L":0,"R":3},
  "hashmap": {},
  "status": "If sum < target → L++ (need larger). If sum > target → R-- (need smaller). If equal → done. O(n)."
}'::jsonb),
('two-sum-ii', 4, 'L=0,R=3: sum=17', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,3],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":3},
  "hashmap": {"sum":"17"},
  "status": "17 > 9. R--."
}'::jsonb),
('two-sum-ii', 5, 'L=0,R=2: sum=13', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,2],
  "highlightColor": "yellow",
  "pointers": {"L":0,"R":2},
  "hashmap": {"sum":"13"},
  "status": "13 > 9. R--."
}'::jsonb),
('two-sum-ii', 6, 'L=0,R=1: sum=9 — MATCH!', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {"sum":"9"},
  "status": "2+7 = 9. Found pair at indices 0,1 (0-indexed)."
}'::jsonb),
('two-sum-ii', 7, 'Convert to 1-based', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[1,2]"},
  "status": "Add 1 to each index → [1,2]."
}'::jsonb),
('two-sum-ii', 8, 'Why this monotone rule works', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If sum > target, every pair using R with any L ≤ current is too big → safely drop R. Symmetric argument for sum < target. Each step discards a whole row/column of a matrix."
}'::jsonb),
('two-sum-ii', 9, 'Edge: no solution', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "If L ≥ R before finding a match → return [-1,-1] (problem states a unique solution exists)."
}'::jsonb),
('two-sum-ii', 10, 'Edge: duplicates', '{
  "type": "array",
  "array": [3,3,5,8],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"target":"6"},
  "status": "[3,3] target 6 → L=0, R=1 meet instantly. Works naturally."
}'::jsonb),
('two-sum-ii', 11, 'Termination', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L":0,"R":1},
  "hashmap": {},
  "status": "Found in 3 iterations."
}'::jsonb),
('two-sum-ii', 12, 'Return + Complexity', '{
  "type": "array",
  "array": [2,7,11,15],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"[1,2]"},
  "status": "Return [1,2]. O(n) time, O(1) space."
}'::jsonb);


-- ── VALID PALINDROME ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-palindrome';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-palindrome', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["A"," ","m","a","n",","," ","a"," ","p","l","a","n"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Normalize (alphanumerics, case-insensitive), then check palindrome. Example demo will use simplified \"amanaplan\"."
}'::jsonb),
('valid-palindrome', 2, 'Preprocess', '{
  "type": "array",
  "array": ["a","m","a","n","a","p","l","a","n"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "After filtering: \"amanaplan\" (length 9). We will run two pointers on this."
}'::jsonb),
('valid-palindrome', 3, 'Approach: Two Pointers from ends', '{
  "type": "array",
  "array": ["a","m","a","n","a","p","l","a","n"],
  "highlights": [],
  "pointers": {"L":0,"R":8},
  "hashmap": {},
  "status": "Compare s[L] and s[R]. If equal → L++, R--. Else → not a palindrome. Continue until L ≥ R."
}'::jsonb),
('valid-palindrome', 4, 'Complexity', '{
  "type": "array",
  "array": ["a","m","a","n","a","p","l","a","n"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "O(n) time, O(1) extra space (work in place; skip non-alnum on the fly if desired)."
}'::jsonb),
('valid-palindrome', 5, 'L=0,R=8: a == n?', '{
  "type": "array",
  "array": ["a","m","a","n","a","p","l","a","n"],
  "highlights": [0,8],
  "highlightColor": "red",
  "pointers": {"L":0,"R":8},
  "hashmap": {},
  "status": "a ≠ n → NOT a palindrome. Return false."
}'::jsonb),
('valid-palindrome', 6, 'Switch to palindrome example', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [],
  "pointers": {"L":0,"R":6},
  "hashmap": {},
  "status": "Use s = \"racecar\" to showcase a successful path."
}'::jsonb),
('valid-palindrome', 7, 'L=0,R=6: r == r', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [0,6],
  "highlightColor": "green",
  "pointers": {"L":0,"R":6},
  "hashmap": {},
  "status": "Match. L++, R--."
}'::jsonb),
('valid-palindrome', 8, 'L=1,R=5: a == a', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [1,5],
  "highlightColor": "green",
  "pointers": {"L":1,"R":5},
  "hashmap": {},
  "status": "Match. L++, R--."
}'::jsonb),
('valid-palindrome', 9, 'L=2,R=4: c == c', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [2,4],
  "highlightColor": "green",
  "pointers": {"L":2,"R":4},
  "hashmap": {},
  "status": "Match. L++, R--."
}'::jsonb),
('valid-palindrome', 10, 'L=R=3: pointers meet', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"L":3,"R":3},
  "hashmap": {},
  "status": "Middle character: trivially equal. Loop terminates (L ≥ R)."
}'::jsonb),
('valid-palindrome', 11, 'Construct Result', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "No mismatches → palindrome confirmed."
}'::jsonb),
('valid-palindrome', 12, 'Return + Complexity', '{
  "type": "array",
  "array": ["r","a","c","e","c","a","r"],
  "highlights": [],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer":"true"},
  "status": "Return true. O(n) time, O(1) space."
}'::jsonb);
