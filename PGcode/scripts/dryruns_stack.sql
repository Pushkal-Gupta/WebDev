-- ═══════════════════════════════════════════════════════════════
-- Dry Runs — Stack topic (Phase B, Session 5)
-- ───────────────────────────────────────────────────────────────
-- Covers the 5 stack problems without dry runs.
-- valid-parentheses already has one in enhance_dry_runs.sql.
-- Mix of StackQueueRenderer (pure stack problems) and ArrayRenderer
-- (monotonic-stack-on-array problems with stack in hashmap companion).
-- ═══════════════════════════════════════════════════════════════


-- ── MIN STACK ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'min-stack';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('min-stack', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Design a stack supporting push(x), pop(), top(), and getMin() — all in O(1)."
}'::jsonb),

('min-stack', 2, 'Approach: Auxiliary Min Stack', '{
  "type": "stack",
  "items": [],
  "operation": "Keep a parallel stack where minStack[i] = min(stack[0..i]). On push, also push min(current, new value). On pop, pop both. getMin() = minStack.top()."
}'::jsonb),

('min-stack', 3, 'push(-2)', '{
  "type": "stack",
  "items": [-2],
  "operation": "stack = [-2]. minStack = [-2]. getMin() → -2."
}'::jsonb),

('min-stack', 4, 'push(0)', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "stack = [-2, 0]. minStack = [-2, -2] (min of 0 and prev min −2 is still −2). getMin() → -2."
}'::jsonb),

('min-stack', 5, 'push(-3)', '{
  "type": "stack",
  "items": [-2, 0, -3],
  "operation": "stack = [-2, 0, -3]. minStack = [-2, -2, -3] (−3 is the new running min). getMin() → -3."
}'::jsonb),

('min-stack', 6, 'getMin()', '{
  "type": "stack",
  "items": [-2, 0, -3],
  "operation": "Return minStack.top() = -3. Constant time, no scanning."
}'::jsonb),

('min-stack', 7, 'pop()', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "Pop -3 from both stacks. stack = [-2, 0], minStack = [-2, -2]. Running min correctly reverts."
}'::jsonb),

('min-stack', 8, 'top()', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "Return stack.top() = 0."
}'::jsonb),

('min-stack', 9, 'getMin()', '{
  "type": "stack",
  "items": [-2, 0],
  "operation": "Return minStack.top() = -2. All operations O(1) time, O(n) extra space for the min stack."
}'::jsonb);


-- ── EVALUATE REVERSE POLISH NOTATION ────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'eval-rpn';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('eval-rpn', 1, 'Problem Setup', '{
  "type": "stack",
  "items": [],
  "operation": "Given tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]. Evaluate as Reverse Polish Notation. Expected: (2+1)*3 = 9."
}'::jsonb),

('eval-rpn', 2, 'Approach', '{
  "type": "stack",
  "items": [],
  "operation": "Scan left to right. If the token is a number, push. If it is an operator, pop the top two (b then a), compute a OP b, push the result. At the end the stack has exactly one value — the answer."
}'::jsonb),

('eval-rpn', 3, 'push 2', '{
  "type": "stack",
  "items": [2],
  "operation": "Token \"2\" → push."
}'::jsonb),

('eval-rpn', 4, 'push 1', '{
  "type": "stack",
  "items": [2, 1],
  "operation": "Token \"1\" → push."
}'::jsonb),

('eval-rpn', 5, 'apply +', '{
  "type": "stack",
  "items": [3],
  "operation": "Token \"+\". Pop b=1, pop a=2. Push a+b = 3. Note the order: b is the LAST popped, so the operation is a OP b, not b OP a (important for − and /)."
}'::jsonb),

('eval-rpn', 6, 'push 3', '{
  "type": "stack",
  "items": [3, 3],
  "operation": "Token \"3\" → push."
}'::jsonb),

('eval-rpn', 7, 'apply *', '{
  "type": "stack",
  "items": [9],
  "operation": "Pop b=3, a=3. Push a*b = 9."
}'::jsonb),

('eval-rpn', 8, 'Result', '{
  "type": "stack",
  "items": [9],
  "operation": "Tokens exhausted. Return stack.top() = 9. Time O(n)."
}'::jsonb);


-- ── DAILY TEMPERATURES ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'daily-temperatures';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('daily-temperatures', 1, 'Problem Setup', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {},
  "hashmap": {"ans":"[0,0,0,0,0,0,0,0]"},
  "status": "Given temperatures. For each day, return how many days until a warmer temperature. Expected: [1,1,4,2,1,1,0,0]."
}'::jsonb),

('daily-temperatures', 2, 'Approach: Monotonic Decreasing Stack', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stack":"[]"},
  "status": "Hold INDICES of days still waiting for a warmer future. When today is warmer than the stack top, that waiting day has its answer (today − its index). Keep popping until the stack is empty or top is warmer than today. Then push today."
}'::jsonb),

('daily-temperatures', 3, 'i=0 (73)', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"stack":"[0]", "ans":"[0,0,0,0,0,0,0,0]"},
  "status": "Stack empty. Push index 0."
}'::jsonb),

('daily-temperatures', 4, 'i=1 (74): pop 0', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"stack":"[1]", "ans":"[1,0,0,0,0,0,0,0]"},
  "status": "74 > 73. Pop 0; ans[0] = 1 − 0 = 1. Push 1."
}'::jsonb),

('daily-temperatures', 5, 'i=2 (75): pop 1', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"stack":"[2]", "ans":"[1,1,0,0,0,0,0,0]"},
  "status": "75 > 74. Pop 1; ans[1] = 2 − 1 = 1. Push 2."
}'::jsonb),

('daily-temperatures', 6, 'i=3,4: push', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [3,4],
  "pointers": {"i": 4},
  "hashmap": {"stack":"[2,3,4]", "ans":"[1,1,0,0,0,0,0,0]"},
  "status": "71 < 75, push 3. 69 < 71, push 4. Stack is decreasing."
}'::jsonb),

('daily-temperatures', 7, 'i=5 (72): pop 4, then 3', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [3,4,5],
  "highlightColor": "yellow",
  "pointers": {"i": 5},
  "hashmap": {"stack":"[2,5]", "ans":"[1,1,0,2,1,0,0,0]"},
  "status": "72 > 69: pop 4, ans[4]=1. 72 > 71: pop 3, ans[3]=2. 72 < 75, stop. Push 5."
}'::jsonb),

('daily-temperatures', 8, 'i=6 (76): pop 5, then 2', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [2,5,6],
  "highlightColor": "yellow",
  "pointers": {"i": 6},
  "hashmap": {"stack":"[6]", "ans":"[1,1,4,2,1,1,0,0]"},
  "status": "76 > 72: pop 5, ans[5]=1. 76 > 75: pop 2, ans[2]=4. Stack empty. Push 6."
}'::jsonb),

('daily-temperatures', 9, 'i=7 (73): push', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [7],
  "pointers": {"i": 7},
  "hashmap": {"stack":"[6,7]", "ans":"[1,1,4,2,1,1,0,0]"},
  "status": "73 < 76, push 7. End of scan."
}'::jsonb),

('daily-temperatures', 10, 'Result', '{
  "type": "array",
  "array": [1,1,4,2,1,1,0,0],
  "highlights": [0,1,2,3,4,5,6,7],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"leftover":"[6,7]"},
  "status": "Return [1,1,4,2,1,1,0,0]. Days 6 and 7 never saw anything warmer → their answers stay 0. Each index is pushed and popped at most once → O(n)."
}'::jsonb);


-- ── LARGEST RECTANGLE IN HISTOGRAM ──────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'largest-rect-histogram';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('largest-rect-histogram', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"best":"0"},
  "status": "Given heights = [2,1,5,6,2,3]. Return the area of the largest rectangle fully inside the histogram. Expected: 10."
}'::jsonb),

('largest-rect-histogram', 2, 'Approach: Monotonic Increasing Stack', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"stack":"[]"},
  "status": "For each bar, find how far left and right it can extend (bounded by strictly shorter bars). Use an increasing stack of indices; when a shorter bar arrives, pop and compute area = h * (i − prev − 1) where prev is the new top (or −1 if empty)."
}'::jsonb),

('largest-rect-histogram', 3, 'i=0 (2)', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"stack":"[0]", "best":"0"},
  "status": "Stack empty. Push 0."
}'::jsonb),

('largest-rect-histogram', 4, 'i=1 (1): pop 0', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"stack":"[1]", "best":"2"},
  "status": "1 < 2. Pop 0, h = 2, width = i − (-1) − 1 = 1. area = 2. best = 2. Push 1."
}'::jsonb),

('largest-rect-histogram', 5, 'i=2,3: push', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [2,3],
  "pointers": {"i": 3},
  "hashmap": {"stack":"[1,2,3]", "best":"2"},
  "status": "5 > 1, push 2. 6 > 5, push 3. Increasing stack."
}'::jsonb),

('largest-rect-histogram', 6, 'i=4 (2): pop 3', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack":"[1,2]", "best":"6"},
  "status": "2 < 6. Pop 3 (h=6). New top is 2, so width = 4 − 2 − 1 = 1. area = 6. best = 6."
}'::jsonb),

('largest-rect-histogram', 7, 'i=4 (2): pop 2', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [2,3,4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack":"[1,4]", "best":"10"},
  "status": "Still 2 < 5. Pop 2 (h=5). New top is 1, so width = 4 − 1 − 1 = 2. area = 5 * 2 = 10. best = 10. Finally push 4."
}'::jsonb),

('largest-rect-histogram', 8, 'i=5 (3): push', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [5],
  "pointers": {"i": 5},
  "hashmap": {"stack":"[1,4,5]", "best":"10"},
  "status": "3 > 2, push 5."
}'::jsonb),

('largest-rect-histogram', 9, 'Drain the stack', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [],
  "pointers": {"i": 6},
  "hashmap": {"stack":"[]", "best":"10"},
  "status": "End of array (treat i=n=6). Pop 5 h=3, width=6−4−1=1, area=3. Pop 4 h=2, width=6−1−1=4, area=8. Pop 1 h=1, width=6, area=6. None beat 10."
}'::jsonb),

('largest-rect-histogram', 10, 'Result', '{
  "type": "array",
  "array": [2,1,5,6,2,3],
  "highlights": [2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"best":"10"},
  "status": "Return 10 (bars at indices 2,3 with heights 5,6 form a 5×2 rectangle). Time O(n) — each index pushed and popped once."
}'::jsonb);


-- ── CAR FLEET ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'car-fleet';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('car-fleet', 1, 'Problem Setup', '{
  "type": "array",
  "array": [10,8,0,5,3],
  "labels": {"0":"pos"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"target":"12", "speed":"[2,4,1,1,3]"},
  "status": "Given target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]. Count the number of car fleets that arrive at the target. A faster car catches a slower one and merges into its fleet; it can never overtake."
}'::jsonb),

('car-fleet', 2, 'Approach: Sort + Monotonic Times', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "labels": {"0":"sorted desc"},
  "highlights": [],
  "pointers": {},
  "hashmap": {"times":"[1, 1, 7, 3, 12]"},
  "status": "Sort cars by position DESCENDING (closest to target first). Compute each car''s solo arrival time = (target − pos) / speed. Walk the sorted list and push times onto a stack: only push if strictly greater than current top — otherwise this car catches the one ahead and merges."
}'::jsonb),

('car-fleet', 3, 'Car at 10 (time 1.0)', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [0],
  "pointers": {"i": 0},
  "hashmap": {"stack":"[1.0]", "fleets":"1"},
  "status": "Stack empty. Push 1.0. fleets = 1."
}'::jsonb),

('car-fleet', 4, 'Car at 8 (time 1.0)', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [0,1],
  "highlightColor": "red",
  "pointers": {"i": 1},
  "hashmap": {"stack":"[1.0]", "fleets":"1"},
  "status": "time 1.0 ≤ top 1.0 → this car catches the one ahead, merges. Do NOT push. Still 1 fleet."
}'::jsonb),

('car-fleet', 5, 'Car at 5 (time 7.0)', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"stack":"[1.0, 7.0]", "fleets":"2"},
  "status": "7.0 > 1.0 → new fleet, push. fleets = 2."
}'::jsonb),

('car-fleet', 6, 'Car at 3 (time 3.0)', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [2,3],
  "highlightColor": "red",
  "pointers": {"i": 3},
  "hashmap": {"stack":"[1.0, 7.0]", "fleets":"2"},
  "status": "3.0 ≤ 7.0 → catches the car ahead. Merge."
}'::jsonb),

('car-fleet', 7, 'Car at 0 (time 12.0)', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack":"[1.0, 7.0, 12.0]", "fleets":"3"},
  "status": "12.0 > 7.0 → new fleet, push."
}'::jsonb),

('car-fleet', 8, 'Result', '{
  "type": "array",
  "array": [10,8,5,3,0],
  "highlights": [0,2,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"fleets":"3"},
  "status": "Return 3. Sort is O(n log n); the stack walk is O(n). Because we process cars from closest to farthest, a new fleet forms exactly when the current car is strictly slower than every fleet ahead of it."
}'::jsonb);


-- ── Sanity ────────────────────────────────────────────────────
SELECT problem_id, COUNT(*) AS step_count
FROM "PGcode_interactive_dry_runs"
WHERE problem_id IN (
  'min-stack','eval-rpn','daily-temperatures','largest-rect-histogram','car-fleet'
)
GROUP BY problem_id
ORDER BY problem_id;
