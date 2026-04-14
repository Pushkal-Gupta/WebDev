-- ═══════════════════════════════════════════════════════════════
-- Expanded Dry Runs — Batch 1 (Arrays / Strings)
-- 29 problems re-authored with 10-13 frames each
-- Gold-standard depth matching two-sum (enhance_dry_runs.sql)
-- ═══════════════════════════════════════════════════════════════


-- ── ADD BINARY ────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'add-binary';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('add-binary', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1","0","1","1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given a = \"1010\", b = \"1011\". Add them as binary strings and return the binary sum as a string."
}'::jsonb),
('add-binary', 2, 'Approach: Simulate Addition', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: convert to int, add, convert back — fails for huge numbers. Instead simulate grade-school binary addition from right to left, carrying bits. O(max(n,m))."
}'::jsonb),
('add-binary', 3, 'Complexity', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(max(n,m)) — single pass across both strings. Space O(max(n,m)) for the result buffer."
}'::jsonb),
('add-binary', 4, 'Initialize Pointers', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [3],
  "pointers": {"i": 3, "j": 3, "carry": 0},
  "hashmap": {"a": "1010", "b": "1011"},
  "status": "Set i = len(a)-1 = 3, j = len(b)-1 = 3, carry = 0, result = \"\". Scan from LSB to MSB."
}'::jsonb),
('add-binary', 5, 'Step 1: Rightmost bits', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"i": 3, "j": 3, "carry": 0},
  "hashmap": {"sum": "0+1+0=1", "result": "1"},
  "status": "a[3]=0, b[3]=1, carry=0. sum = 1. Write bit 1, new carry = 0. result = \"1\"."
}'::jsonb),
('add-binary', 6, 'Step 2: i=2,j=2', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "j": 2, "carry": 0},
  "hashmap": {"sum": "1+1+0=2", "result": "01"},
  "status": "a[2]=1, b[2]=1, carry=0. sum=2 → write bit 0, carry=1. result = \"01\"."
}'::jsonb),
('add-binary', 7, 'Step 3: i=1,j=1 with carry', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [1],
  "highlightColor": "orange",
  "pointers": {"i": 1, "j": 1, "carry": 1},
  "hashmap": {"sum": "0+0+1=1", "result": "101"},
  "status": "a[1]=0, b[1]=0, carry=1. sum=1 → write 1, carry=0. result = \"101\"."
}'::jsonb),
('add-binary', 8, 'Step 4: i=0,j=0', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 0, "carry": 0},
  "hashmap": {"sum": "1+1+0=2", "result": "0101"},
  "status": "a[0]=1, b[0]=1, carry=0. sum=2 → write 0, carry=1. result = \"0101\"."
}'::jsonb),
('add-binary', 9, 'Loop Ends — Leftover Carry', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [],
  "pointers": {"i": -1, "j": -1, "carry": 1},
  "hashmap": {"result": "0101"},
  "status": "Both pointers went below 0. But carry = 1 is still there! We must not drop it — append the final carry bit."
}'::jsonb),
('add-binary', 10, 'Append Final Carry', '{
  "type": "array",
  "array": ["1","0","1","0"],
  "highlights": [],
  "pointers": {"carry": 0},
  "hashmap": {"result": "10101"},
  "status": "Append carry 1 → result built in reverse = \"10101\"."
}'::jsonb),
('add-binary', 11, 'Reverse the Result', '{
  "type": "array",
  "array": ["1","0","1","0","1"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"final": "10101"},
  "status": "We built bits in reverse (LSB first). Reverse the buffer → \"10101\"."
}'::jsonb),
('add-binary', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["1","0","1","0","1"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "10101"},
  "status": "Return \"10101\". Time O(max(n,m)), Space O(max(n,m)). Simulating addition avoids overflow."
}'::jsonb);


-- ── ALIEN DICTIONARY ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'alien-dictionary';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('alien-dictionary', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given sorted alien words, derive a valid ordering of the alphabet. Example: [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]."
}'::jsonb),
('alien-dictionary', 2, 'Approach: Topological Sort', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Adjacent words reveal ONE precedence. Build a directed graph of char→char edges, then topologically sort. Brute force permutations = n!; graph = O(C) total chars."
}'::jsonb),
('alien-dictionary', 3, 'Complexity', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Let C = total characters across all words. Time O(C). Space O(1) since alphabet ≤ 26."
}'::jsonb),
('alien-dictionary', 4, 'Initialize Graph', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"w": "[]", "r": "[]", "t": "[]", "f": "[]", "e": "[]"},
  "status": "Collect all unique letters as graph nodes: {w, r, t, f, e}. Initialize empty adjacency list and in-degree = 0 for each."
}'::jsonb),
('alien-dictionary', 5, 'Compare wrt vs wrf', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"pair": 0},
  "hashmap": {"edge": "t → f"},
  "status": "Walk both until first mismatch: w=w, r=r, t≠f. Add edge t → f. in[f]=1."
}'::jsonb),
('alien-dictionary', 6, 'Compare wrf vs er', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"pair": 1},
  "hashmap": {"edge": "w → e"},
  "status": "First mismatch at pos 0: w≠e. Add edge w → e. in[e]=1."
}'::jsonb),
('alien-dictionary', 7, 'Compare er vs ett', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [2,3],
  "highlightColor": "yellow",
  "pointers": {"pair": 2},
  "hashmap": {"edge": "r → t"},
  "status": "e=e, then r≠t. Add edge r → t. in[t]=1."
}'::jsonb),
('alien-dictionary', 8, 'Compare ett vs rftt', '{
  "type": "array",
  "array": ["wrt","wrf","er","ett","rftt"],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"pair": 3},
  "hashmap": {"edge": "e → r"},
  "status": "First mismatch at pos 0: e≠r. Add edge e → r. in[r]=1."
}'::jsonb),
('alien-dictionary', 9, 'In-Degree Snapshot', '{
  "type": "array",
  "array": ["w","e","r","t","f"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"w": "0", "e": "1", "r": "1", "t": "1", "f": "1"},
  "status": "Only w has in-degree 0. Seed the BFS queue with w."
}'::jsonb),
('alien-dictionary', 10, 'BFS: pop w → unlock e', '{
  "type": "array",
  "array": ["w","e","r","t","f"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"queue": 1},
  "hashmap": {"order": "w", "e": "0"},
  "status": "Pop w, append to order. Decrement in[e] → 0. Push e."
}'::jsonb),
('alien-dictionary', 11, 'BFS: e → r → t → f', '{
  "type": "array",
  "array": ["w","e","r","t","f"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"order": "wertf"},
  "status": "Pop e → unlocks r. Pop r → unlocks t. Pop t → unlocks f. Pop f. Queue empty."
}'::jsonb),
('alien-dictionary', 12, 'Cycle Check', '{
  "type": "array",
  "array": ["w","e","r","t","f"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"visited": "5", "total": "5"},
  "status": "Visited all 5 letters — no cycle. If len(order) < total letters we would return \"\"."
}'::jsonb),
('alien-dictionary', 13, 'Return', '{
  "type": "array",
  "array": ["w","e","r","t","f"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "wertf"},
  "status": "Return \"wertf\". Time O(C) chars, Space O(1) (fixed alphabet)."
}'::jsonb);


-- ── COUNT AND SAY ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'count-and-say';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('count-and-say', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given n = 4. Build the count-and-say sequence: term(1)=\"1\", each next term describes the previous by run-length encoding."
}'::jsonb),
('count-and-say', 2, 'Approach', '{
  "type": "array",
  "array": ["1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Iteratively build each term from the previous. Walk through prev grouping equal consecutive digits, emitting count + digit. No shortcut exists; string can roughly double each step."
}'::jsonb),
('count-and-say', 3, 'Complexity', '{
  "type": "array",
  "array": ["1"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time roughly O(n · L) where L is final length (~1.3^n). Space O(L) for the string."
}'::jsonb),
('count-and-say', 4, 'Term 1 — Base Case', '{
  "type": "array",
  "array": ["1"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"term": 1},
  "hashmap": {"prev": "1"},
  "status": "Start with term(1) = \"1\" by definition."
}'::jsonb),
('count-and-say', 5, 'Build Term 2 — scan \"1\"', '{
  "type": "array",
  "array": ["1"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "count": 1},
  "hashmap": {"prev": "1"},
  "status": "Walk prev=\"1\". One group: one 1. Emit \"1\"+\"1\"."
}'::jsonb),
('count-and-say', 6, 'Term 2 Ready', '{
  "type": "array",
  "array": ["1","1"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"term": 2},
  "hashmap": {"prev": "11"},
  "status": "term(2) = \"11\" (one 1)."
}'::jsonb),
('count-and-say', 7, 'Build Term 3 — scan \"11\"', '{
  "type": "array",
  "array": ["1","1"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "count": 2},
  "hashmap": {"prev": "11"},
  "status": "Both chars equal 1. Count = 2. Emit \"2\"+\"1\"."
}'::jsonb),
('count-and-say', 8, 'Term 3 Ready', '{
  "type": "array",
  "array": ["2","1"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"term": 3},
  "hashmap": {"prev": "21"},
  "status": "term(3) = \"21\" (two 1s)."
}'::jsonb),
('count-and-say', 9, 'Build Term 4 — read 2', '{
  "type": "array",
  "array": ["2","1"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "count": 1},
  "hashmap": {"prev": "21", "out": "12"},
  "status": "prev[0]=2, prev[1]=1 differ. Flush group: one 2 → \"12\"."
}'::jsonb),
('count-and-say', 10, 'Build Term 4 — read 1', '{
  "type": "array",
  "array": ["2","1"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "count": 1},
  "hashmap": {"prev": "21", "out": "1211"},
  "status": "End of string, flush last group: one 1 → append \"11\". Output so far = \"1211\"."
}'::jsonb),
('count-and-say', 11, 'Term 4 Ready', '{
  "type": "array",
  "array": ["1","2","1","1"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"term": 4},
  "hashmap": {"prev": "1211"},
  "status": "term(4) = \"1211\" — one 2, one 1."
}'::jsonb),
('count-and-say', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["1","2","1","1"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "1211"},
  "status": "Return \"1211\". Each step is RLE of the prior string."
}'::jsonb);


-- ── COUNT SORTED VOWEL STRINGS ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'count-sorted-vowel-strings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('count-sorted-vowel-strings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n": "2"},
  "status": "Given n = 2. Count strings of length n using vowels {a,e,i,o,u} in lexicographically non-decreasing order."
}'::jsonb),
('count-sorted-vowel-strings', 2, 'Approach: DP / Stars-and-Bars', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force enumerate all 5^n and filter — too much. Classic combinatorics: choosing n items from 5 vowels with repetition, order fixed = C(n+4, 4). Or bottom-up DP."
}'::jsonb),
('count-sorted-vowel-strings', 3, 'Complexity', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Combinatorial formula: O(1). DP: O(n · 5). We use DP for clarity."
}'::jsonb),
('count-sorted-vowel-strings', 4, 'DP Definition', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"dp[L][v]": "# strings of length L ending at vowel index v"},
  "status": "Let dp[L][v] = number of valid length-L strings whose last char is vowel v. Answer = Σ dp[n][v]."
}'::jsonb),
('count-sorted-vowel-strings', 5, 'Base: length 1', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "yellow",
  "pointers": {"L": 1},
  "hashmap": {"dp[1]": "[1,1,1,1,1]"},
  "status": "Any single vowel is valid. dp[1] = [1,1,1,1,1]. Total = 5."
}'::jsonb),
('count-sorted-vowel-strings', 6, 'Transition Rule', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"rule": "dp[L][v] = Σ dp[L-1][u] for u ≤ v"},
  "status": "To keep non-decreasing order, a length-L string ending at vowel v extends any length-(L-1) string ending at vowel u ≤ v."
}'::jsonb),
('count-sorted-vowel-strings', 7, 'L=2, v=a', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"L": 2, "v": 0},
  "hashmap": {"dp[2][a]": "1"},
  "status": "Strings of length 2 ending in a: only \"aa\". dp[2][a] = dp[1][a] = 1."
}'::jsonb),
('count-sorted-vowel-strings', 8, 'L=2, v=e', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"L": 2, "v": 1},
  "hashmap": {"dp[2][e]": "2"},
  "status": "Ending in e: \"ae\", \"ee\". dp[2][e] = dp[1][a]+dp[1][e] = 1+1 = 2."
}'::jsonb),
('count-sorted-vowel-strings', 9, 'L=2, v=i', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"L": 2, "v": 2},
  "hashmap": {"dp[2][i]": "3"},
  "status": "Ending in i: ai, ei, ii. dp[2][i] = 1+1+1 = 3."
}'::jsonb),
('count-sorted-vowel-strings', 10, 'L=2, v=o and v=u', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"L": 2},
  "hashmap": {"dp[2][o]": "4", "dp[2][u]": "5"},
  "status": "dp[2][o] = 1+1+1+1 = 4 (ao,eo,io,oo). dp[2][u] = 5 (au,eu,iu,ou,uu)."
}'::jsonb),
('count-sorted-vowel-strings', 11, 'Sum dp[n]', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"dp[2]": "[1,2,3,4,5]", "sum": "15"},
  "status": "Total = 1+2+3+4+5 = 15. Matches C(2+4,4) = C(6,4) = 15."
}'::jsonb),
('count-sorted-vowel-strings', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["a","e","i","o","u"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "15"},
  "status": "Return 15. DP O(5n), or closed form C(n+4,4)."
}'::jsonb);


-- ── DAILY TEMPERATURES ────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'daily-temperatures';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('daily-temperatures', 1, 'Problem Setup', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given temps = [73,74,75,71,69,72,76,73]. For each day, find how many days until a warmer temperature; 0 if none."
}'::jsonb),
('daily-temperatures', 2, 'Approach: Monotonic Stack', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force for each i scan right → O(n²). Use a stack of indices with DECREASING temps. When a warmer day arrives, pop and record the gap. O(n)."
}'::jsonb),
('daily-temperatures', 3, 'Complexity', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Each index pushed and popped at most once → O(n) time. O(n) stack. Output O(n)."
}'::jsonb),
('daily-temperatures', 4, 'Initialize', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {"stack": "[]", "ans": "[0,0,0,0,0,0,0,0]"},
  "status": "ans = all zeros, stack = []. We iterate i from 0 to n-1."
}'::jsonb),
('daily-temperatures', 5, 'i=0: 73', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"stack": "[0]"},
  "status": "Stack empty → push 0. stack = [0]."
}'::jsonb),
('daily-temperatures', 6, 'i=1: 74 pops 73', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"stack": "[1]", "ans[0]": "1"},
  "status": "74 > temps[stack top 0]=73. Pop 0 and set ans[0] = 1-0 = 1. Push 1."
}'::jsonb),
('daily-temperatures', 7, 'i=2: 75 pops 74', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"i": 2},
  "hashmap": {"stack": "[2]", "ans[1]": "1"},
  "status": "75 > 74. Pop 1 → ans[1] = 2-1 = 1. Push 2."
}'::jsonb),
('daily-temperatures', 8, 'i=3,4: 71, 69 push only', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"i": 4},
  "hashmap": {"stack": "[2,3,4]"},
  "status": "71 < 75, just push. 69 < 71, just push. stack = [2,3,4]."
}'::jsonb),
('daily-temperatures', 9, 'i=5: 72 pops 69 and 71', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [3,4,5],
  "highlightColor": "green",
  "pointers": {"i": 5},
  "hashmap": {"stack": "[2,5]", "ans[4]": "1", "ans[3]": "2"},
  "status": "72>69 → pop 4, ans[4]=1. 72>71 → pop 3, ans[3]=2. 72<75, stop. Push 5."
}'::jsonb),
('daily-temperatures', 10, 'i=6: 76 empties stack to 2', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [2,5,6],
  "highlightColor": "green",
  "pointers": {"i": 6},
  "hashmap": {"stack": "[6]", "ans[5]": "1", "ans[2]": "4"},
  "status": "76>72 → pop 5, ans[5]=1. 76>75 → pop 2, ans[2]=4. Stack empty, push 6."
}'::jsonb),
('daily-temperatures', 11, 'i=7: 73 pushed', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [7],
  "highlightColor": "yellow",
  "pointers": {"i": 7},
  "hashmap": {"stack": "[6,7]"},
  "status": "73 < 76. Push 7. Loop ends."
}'::jsonb),
('daily-temperatures', 12, 'Leftovers Stay 0', '{
  "type": "array",
  "array": [73,74,75,71,69,72,76,73],
  "highlights": [6,7],
  "pointers": {},
  "hashmap": {"stack": "[6,7]"},
  "status": "Indices still in the stack never found a warmer day → their ans stays 0 (as pre-initialized)."
}'::jsonb),
('daily-temperatures', 13, 'Return & Recap', '{
  "type": "array",
  "array": [1,1,4,2,1,1,0,0],
  "highlights": [0,1,2,3,4,5,6,7],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[1,1,4,2,1,1,0,0]"},
  "status": "Return [1,1,4,2,1,1,0,0]. Each index processed once → O(n)."
}'::jsonb);


-- ── ENCODE DECODE STRINGS ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'encode-decode-strings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('encode-decode-strings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Design encode(list<str>) → str and decode(str) → list<str> that round-trip safely, even if strings contain any characters."
}'::jsonb),
('encode-decode-strings', 2, 'Approach: Length Prefix', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "A delimiter alone is ambiguous (strings can contain it). Prefix each word with its length and a sentinel like ''#''. Length tells decoder exactly how many chars to read."
}'::jsonb),
('encode-decode-strings', 3, 'Complexity', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Encode O(N) total chars. Decode O(N). Space O(N) for the encoded string."
}'::jsonb),
('encode-decode-strings', 4, 'Encode word 1', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"encoded": "4#lint"},
  "status": "len(\"lint\")=4. Append \"4#lint\"."
}'::jsonb),
('encode-decode-strings', 5, 'Encode all words', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"encoded": "4#lint4#code4#love3#you"},
  "status": "Concatenate all: \"4#lint4#code4#love3#you\"."
}'::jsonb),
('encode-decode-strings', 6, 'Decode: init', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#"],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {"result": "[]"},
  "status": "Start decode at i = 0. Loop until end of string."
}'::jsonb),
('encode-decode-strings', 7, 'Decode: find delimiter', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 1},
  "hashmap": {"length": "4"},
  "status": "Advance j from i until s[j] = ''#''. j=1. length = int(s[0..1]) = 4."
}'::jsonb),
('encode-decode-strings', 8, 'Decode: slice word', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#"],
  "highlights": [2,3,4,5],
  "highlightColor": "green",
  "pointers": {"start": 2, "end": 6},
  "hashmap": {"word": "lint", "result": "[lint]"},
  "status": "Word = s[j+1 .. j+1+length] = s[2..6] = \"lint\". Append, advance i to 6."
}'::jsonb),
('encode-decode-strings', 9, 'Decode: next word starts at i=6', '{
  "type": "array",
  "array": ["4","#","l","i","n","t","4","#","c","o","d","e"],
  "highlights": [6,7],
  "highlightColor": "yellow",
  "pointers": {"i": 6, "j": 7},
  "hashmap": {"length": "4"},
  "status": "Resume at i=6. Read \"4#\" → length 4. Slice next 4 chars = \"code\"."
}'::jsonb),
('encode-decode-strings', 10, 'Decode continues', '{
  "type": "array",
  "array": ["lint","code","love"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"result": "[lint, code, love]"},
  "status": "Repeat pattern until end: collect \"love\", then \"you\"."
}'::jsonb),
('encode-decode-strings', 11, 'Edge: Empty Strings', '{
  "type": "array",
  "array": ["","a",""],
  "highlights": [],
  "pointers": {},
  "hashmap": {"encoded": "0#1#a0#"},
  "status": "Empty strings still get \"0#\" prefix — decoder slices 0 chars and correctly emits \"\". No ambiguity."
}'::jsonb),
('encode-decode-strings', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["lint","code","love","you"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[lint, code, love, you]"},
  "status": "decode returns [lint, code, love, you]. Length-prefix handles any character content. O(N)."
}'::jsonb);


-- ── FIND NEEDLE HAYSTACK ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'find-needle-haystack';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-needle-haystack', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["s","a","d","b","u","t","s","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"needle": "sad"},
  "status": "haystack = \"sadbutsad\", needle = \"sad\". Return the first index where needle occurs, or -1."
}'::jsonb),
('find-needle-haystack', 2, 'Approach: Sliding Window', '{
  "type": "array",
  "array": ["s","a","d","b","u","t","s","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: for each i compare substring. O(n·m). KMP is O(n+m) but overkill here. We use the straightforward window."
}'::jsonb),
('find-needle-haystack', 3, 'Complexity', '{
  "type": "array",
  "array": ["s","a","d","b","u","t","s","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O((n-m+1)·m). Space O(1)."
}'::jsonb),
('find-needle-haystack', 4, 'i=0 start', '{
  "type": "array",
  "array": ["s","a","d","b","u","t","s","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 0},
  "hashmap": {"window": "sad"},
  "status": "Window haystack[0..3] = \"sad\". Compare with needle \"sad\"."
}'::jsonb),
('find-needle-haystack', 5, 'i=0 match!', '{
  "type": "array",
  "array": ["s","a","d","b","u","t","s","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"i": 0},
  "hashmap": {"match": "true"},
  "status": "Characters equal at all 3 positions — we could return 0 immediately. For illustration we continue to show no-match cases."
}'::jsonb),
('find-needle-haystack', 6, 'Alt example: no early match', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"needle": "issip", "window": "mis"},
  "status": "Consider haystack=\"mississip\", needle=\"issip\". i=0 window \"miss..\" mismatches at j=0 (m≠i)."
}'::jsonb),
('find-needle-haystack', 7, 'Shift i=1', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [1,2,3,4,5],
  "highlightColor": "yellow",
  "pointers": {"i": 1},
  "hashmap": {"window": "issis"},
  "status": "Window[1..6] = \"issis\". Compare with \"issip\". Mismatch at j=4 (s ≠ p)."
}'::jsonb),
('find-needle-haystack', 8, 'Shift i=2', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [2,3,4,5,6],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"window": "ssiss"},
  "status": "window = \"ssiss\". First char s ≠ i, mismatch immediately."
}'::jsonb),
('find-needle-haystack', 9, 'Shift i=3', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [3,4,5,6,7],
  "highlightColor": "yellow",
  "pointers": {"i": 3},
  "hashmap": {"window": "sissi"},
  "status": "window = \"sissi\" vs \"issip\". s≠i, mismatch."
}'::jsonb),
('find-needle-haystack', 10, 'Shift i=4 match', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {"i": 4},
  "hashmap": {"window": "issip"},
  "status": "window = \"issip\" equals needle. Return i = 4."
}'::jsonb),
('find-needle-haystack', 11, 'Loop Bound', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n": "9", "m": "5"},
  "status": "i only needs to go up to n - m = 4. Beyond that the window doesn''t fit."
}'::jsonb),
('find-needle-haystack', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["m","i","s","s","i","s","s","i","p"],
  "highlights": [4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "4"},
  "status": "Return 4. Time O((n-m+1)·m), Space O(1)."
}'::jsonb);


-- ── GROUP ANAGRAMS ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'group-anagrams';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('group-anagrams', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given strs = [eat,tea,tan,ate,nat,bat]. Group strings that are anagrams of each other."
}'::jsonb),
('group-anagrams', 2, 'Approach: Canonical Key', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: compare all pairs = O(n²·k). Better: give each string a canonical key (sorted letters, or 26-count tuple) and group via hash map. O(n·k log k) with sort."
}'::jsonb),
('group-anagrams', 3, 'Complexity', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n · k log k) with sort-based key. Space O(n·k)."
}'::jsonb),
('group-anagrams', 4, 'Init Map', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [],
  "pointers": {"i": 0},
  "hashmap": {},
  "status": "groups = {} (key → list). Iterate i from 0."
}'::jsonb),
('group-anagrams', 5, 'i=0: eat → aet', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0},
  "hashmap": {"aet": "[eat]"},
  "status": "Sort \"eat\" → key \"aet\". groups[aet] = [eat]."
}'::jsonb),
('group-anagrams', 6, 'i=1: tea → aet (hit!)', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"i": 1},
  "hashmap": {"aet": "[eat, tea]"},
  "status": "Sort \"tea\" → \"aet\". Key exists → append. groups[aet] = [eat, tea]."
}'::jsonb),
('group-anagrams', 7, 'i=2: tan → ant', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"aet": "[eat,tea]", "ant": "[tan]"},
  "status": "\"tan\" → \"ant\". New bucket."
}'::jsonb),
('group-anagrams', 8, 'i=3: ate → aet (hit!)', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i": 3},
  "hashmap": {"aet": "[eat,tea,ate]", "ant": "[tan]"},
  "status": "\"ate\" → \"aet\". Append to same bucket."
}'::jsonb),
('group-anagrams', 9, 'i=4: nat → ant (hit!)', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i": 4},
  "hashmap": {"aet": "[eat,tea,ate]", "ant": "[tan,nat]"},
  "status": "\"nat\" → \"ant\". Join tan''s bucket."
}'::jsonb),
('group-anagrams', 10, 'i=5: bat → abt', '{
  "type": "array",
  "array": ["eat","tea","tan","ate","nat","bat"],
  "highlights": [5],
  "highlightColor": "yellow",
  "pointers": {"i": 5},
  "hashmap": {"aet": "[eat,tea,ate]", "ant": "[tan,nat]", "abt": "[bat]"},
  "status": "\"bat\" → \"abt\". Solo bucket."
}'::jsonb),
('group-anagrams', 11, 'Collect Values', '{
  "type": "array",
  "array": ["eat","tea","ate","tan","nat","bat"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"buckets": "3"},
  "status": "Answer = list(groups.values()) = [[eat,tea,ate], [tan,nat], [bat]]."
}'::jsonb),
('group-anagrams', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["eat","tea","ate","tan","nat","bat"],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "3 groups"},
  "status": "Return groups. Time O(n·k log k). Using a count-tuple key would give O(n·k)."
}'::jsonb);


-- ── HAPPY NUMBER ──────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'happy-number';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('happy-number', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {"n": "19"},
  "status": "Given n = 19. Replace n with the sum of squares of its digits repeatedly. Return true iff it reaches 1."
}'::jsonb),
('happy-number', 2, 'Approach: Cycle Detection', '{
  "type": "array",
  "array": [1,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Sequences either reach 1 or enter a cycle. Brute force loop forever is wrong. Use a HashSet of seen values — if we revisit, return false. Or Floyd''s tortoise/hare."
}'::jsonb),
('happy-number', 3, 'Complexity', '{
  "type": "array",
  "array": [1,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Digit-square-sum shrinks fast; values bounded. Time O(log n) per step, effectively O(1) total steps. Space O(1)."
}'::jsonb),
('happy-number', 4, 'Step 19 → 82', '{
  "type": "array",
  "array": [1,9],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"n": 19},
  "hashmap": {"seen": "{19}", "next": "1²+9²=82"},
  "status": "1² + 9² = 1 + 81 = 82. Add 19 to seen."
}'::jsonb),
('happy-number', 5, 'Step 82 → 68', '{
  "type": "array",
  "array": [8,2],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"n": 82},
  "hashmap": {"seen": "{19,82}", "next": "8²+2²=68"},
  "status": "64 + 4 = 68. Not seen before; continue."
}'::jsonb),
('happy-number', 6, 'Step 68 → 100', '{
  "type": "array",
  "array": [6,8],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"n": 68},
  "hashmap": {"seen": "{19,82,68}", "next": "6²+8²=100"},
  "status": "36 + 64 = 100."
}'::jsonb),
('happy-number', 7, 'Step 100 → 1', '{
  "type": "array",
  "array": [1,0,0],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"n": 100},
  "hashmap": {"seen": "{19,82,68,100}", "next": "1²+0²+0²=1"},
  "status": "1 + 0 + 0 = 1. Goal reached!"
}'::jsonb),
('happy-number', 8, 'Termination: reached 1', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"n": 1},
  "hashmap": {"answer": "true"},
  "status": "n == 1 → return true. 19 is a happy number."
}'::jsonb),
('happy-number', 9, 'Contrast: n=4 cycles', '{
  "type": "array",
  "array": [4],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"n": 4},
  "hashmap": {"seen": "{}"},
  "status": "Consider n=4. 4²=16 → 1+36=37 → 9+49=58 → 25+64=89 → 64+81=145 → 1+16+25=42 → 16+4=20 → 4."
}'::jsonb),
('happy-number', 10, 'Cycle Detected', '{
  "type": "array",
  "array": [4],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"n": 4},
  "hashmap": {"seen": "{4,16,37,58,89,145,42,20}"},
  "status": "Next would be 4, but 4 is already in seen! Cycle detected, return false."
}'::jsonb),
('happy-number', 11, 'Floyd Variant (note)', '{
  "type": "array",
  "array": [1,9],
  "highlights": [],
  "pointers": {"slow": 19, "fast": 82},
  "hashmap": {},
  "status": "Alternative: slow moves 1 step, fast 2 steps. If they meet at 1 → happy. If they meet elsewhere → cycle. O(1) space."
}'::jsonb),
('happy-number', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "true"},
  "status": "For 19 → return true. Key insight: detect cycles via HashSet or Floyd."
}'::jsonb);


-- ── INTEGER TO ROMAN ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'integer-to-roman';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('integer-to-roman', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,9,9,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {"num": "1994"},
  "status": "Given num = 1994. Convert to Roman numeral. Expected: \"MCMXCIV\"."
}'::jsonb),
('integer-to-roman', 2, 'Approach: Greedy Subtraction', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "List values in descending order INCLUDING subtractive pairs (900, 400, 90, 40, 9, 4). Greedily subtract biggest possible value and append its symbol."
}'::jsonb),
('integer-to-roman', 3, 'Complexity', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Bounded output length → O(1) time and O(1) space for num ≤ 3999."
}'::jsonb),
('integer-to-roman', 4, 'Value Table', '{
  "type": "array",
  "array": ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"paired_with": "[1000,900,500,400,100,90,50,40,10,9,5,4,1]"},
  "status": "Symbols paired with values. Always sorted descending. We walk this table once."
}'::jsonb),
('integer-to-roman', 5, 'num=1994, try M (1000)', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"num": 1994},
  "hashmap": {"result": "M", "num_next": "994"},
  "status": "1994 ≥ 1000. Append \"M\", num -= 1000 → 994."
}'::jsonb),
('integer-to-roman', 6, 'num=994 skip D(500)?', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"num": 994},
  "hashmap": {"result": "MCM", "num_next": "94"},
  "status": "994 ≥ 900 → use subtractive CM. Append \"CM\", num = 94. (We check 900 BEFORE 500 — that''s the whole trick.)"
}'::jsonb),
('integer-to-roman', 7, 'num=94 try XC(90)', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"num": 94},
  "hashmap": {"result": "MCMXC", "num_next": "4"},
  "status": "94 ≥ 90. Append \"XC\", num = 4."
}'::jsonb),
('integer-to-roman', 8, 'num=4 skip V?', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [10],
  "highlightColor": "yellow",
  "pointers": {"num": 4},
  "hashmap": {},
  "status": "4 < 5, so skip V. The subtractive pair IV is next in table."
}'::jsonb),
('integer-to-roman', 9, 'num=4 use IV', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [11],
  "highlightColor": "green",
  "pointers": {"num": 4},
  "hashmap": {"result": "MCMXCIV", "num_next": "0"},
  "status": "4 ≥ 4. Append \"IV\", num = 0."
}'::jsonb),
('integer-to-roman', 10, 'num=0 → done', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [],
  "pointers": {"num": 0},
  "hashmap": {"result": "MCMXCIV"},
  "status": "num hit 0 → exit loop early."
}'::jsonb),
('integer-to-roman', 11, 'Why Greedy Works', '{
  "type": "array",
  "array": [1000,900,500,400,100,90,50,40,10,9,5,4,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Including subtractive pairs in the descending table guarantees the largest legal chunk always produces a valid Roman representation."
}'::jsonb),
('integer-to-roman', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "MCMXCIV"},
  "status": "Return \"MCMXCIV\". Time O(1), Space O(1)."
}'::jsonb);


-- ── IS SUBSEQUENCE ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'is-subsequence';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('is-subsequence', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "abc", "t": "ahbgdc"},
  "status": "Is s = \"abc\" a subsequence of t = \"ahbgdc\"? Subsequence = chars appear in order but not necessarily contiguous."
}'::jsonb),
('is-subsequence', 2, 'Approach: Two Pointers', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Walk t with j and s with i. When t[j] matches s[i], advance i. At end, if i reached len(s) all of s was matched in order."
}'::jsonb),
('is-subsequence', 3, 'Complexity', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(len(t)), Space O(1)."
}'::jsonb),
('is-subsequence', 4, 'Initialize', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [],
  "pointers": {"i": 0, "j": 0},
  "hashmap": {"s[i]": "a"},
  "status": "i = 0 (into s), j = 0 (into t). Loop while both in bounds."
}'::jsonb),
('is-subsequence', 5, 'j=0: t[0]=a', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {"matched": "a"},
  "status": "t[0]=a == s[0]=a. Match! i → 1. j → 1."
}'::jsonb),
('is-subsequence', 6, 'j=1: t[1]=h', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i": 1, "j": 2},
  "hashmap": {"s[i]": "b"},
  "status": "t[1]=h ≠ s[1]=b. Only advance j."
}'::jsonb),
('is-subsequence', 7, 'j=2: t[2]=b', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"i": 2, "j": 3},
  "hashmap": {"matched": "ab"},
  "status": "t[2]=b == s[1]=b. Match! i → 2, j → 3."
}'::jsonb),
('is-subsequence', 8, 'j=3: t[3]=g', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"i": 2, "j": 4},
  "hashmap": {"s[i]": "c"},
  "status": "g ≠ c. j → 4."
}'::jsonb),
('is-subsequence', 9, 'j=4: t[4]=d', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [4],
  "highlightColor": "red",
  "pointers": {"i": 2, "j": 5},
  "hashmap": {"s[i]": "c"},
  "status": "d ≠ c. j → 5."
}'::jsonb),
('is-subsequence', 10, 'j=5: t[5]=c', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [5],
  "highlightColor": "green",
  "pointers": {"i": 3, "j": 6},
  "hashmap": {"matched": "abc"},
  "status": "c == c. Match! i → 3 = len(s)."
}'::jsonb),
('is-subsequence', 11, 'Termination Check', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [0,2,5],
  "highlightColor": "green",
  "pointers": {"i": 3},
  "hashmap": {"len(s)": "3"},
  "status": "i reached len(s) → every char of s was matched in order."
}'::jsonb),
('is-subsequence', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["a","h","b","g","d","c"],
  "highlights": [0,2,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "true"},
  "status": "Return true. Time O(|t|), Space O(1)."
}'::jsonb);


-- ── LENGTH OF LAST WORD ───────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'length-of-last-word';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('length-of-last-word', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "Hello World  "},
  "status": "Given s = \"Hello World  \" (trailing spaces). Return the length of the final word → 5."
}'::jsonb),
('length-of-last-word', 2, 'Approach: Scan from Right', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: split on spaces and take last token — O(n) space. Better: walk right to left, skip trailing spaces, then count chars until next space. O(n) time, O(1) space."
}'::jsonb),
('length-of-last-word', 3, 'Complexity', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('length-of-last-word', 4, 'Initialize', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [12],
  "pointers": {"i": 12, "length": 0},
  "hashmap": {},
  "status": "i = n-1 = 12, length = 0."
}'::jsonb),
('length-of-last-word', 5, 'Skip trailing space i=12', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [12],
  "highlightColor": "red",
  "pointers": {"i": 12},
  "hashmap": {},
  "status": "s[12] = '' ''. Skip, i → 11."
}'::jsonb),
('length-of-last-word', 6, 'Skip trailing space i=11', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [11],
  "highlightColor": "red",
  "pointers": {"i": 11},
  "hashmap": {},
  "status": "s[11] = '' ''. Skip, i → 10."
}'::jsonb),
('length-of-last-word', 7, 'Hit a letter at i=10', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [10],
  "highlightColor": "green",
  "pointers": {"i": 10, "length": 1},
  "hashmap": {},
  "status": "s[10] = ''d''. Start counting. length = 1."
}'::jsonb),
('length-of-last-word', 8, 'Count l, r', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [9,10],
  "highlightColor": "green",
  "pointers": {"i": 8, "length": 3},
  "hashmap": {},
  "status": "s[9]=''l'', s[8]=''r''. length = 3."
}'::jsonb),
('length-of-last-word', 9, 'Count o, W', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [6,7,8,9,10],
  "highlightColor": "green",
  "pointers": {"i": 5, "length": 5},
  "hashmap": {},
  "status": "s[7]=''o'', s[6]=''W''. length = 5."
}'::jsonb),
('length-of-last-word', 10, 'Hit separator at i=5', '{
  "type": "array",
  "array": ["H","e","l","l","o"," ","W","o","r","l","d"," "," "],
  "highlights": [5],
  "highlightColor": "yellow",
  "pointers": {"i": 5, "length": 5},
  "hashmap": {},
  "status": "s[5] = '' ''. This marks the start of the preceding word → STOP."
}'::jsonb),
('length-of-last-word', 11, 'Edge Cases', '{
  "type": "array",
  "array": ["a"],
  "highlights": [0],
  "pointers": {},
  "hashmap": {},
  "status": "Edge: s = \"a\" → length 1. Edge: s = \"   fly me   \" → \"me\" → 2. Algorithm handles both."
}'::jsonb),
('length-of-last-word', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["W","o","r","l","d"],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "5"},
  "status": "Return 5. Time O(n), Space O(1)."
}'::jsonb);


-- ── LONGEST COMMON PREFIX ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-common-prefix';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-common-prefix', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["flower","flow","flight"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given strs = [flower, flow, flight]. Return the longest common prefix → \"fl\"."
}'::jsonb),
('longest-common-prefix', 2, 'Approach: Vertical Scan', '{
  "type": "array",
  "array": ["flower","flow","flight"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Pick column-by-column. At each index k, compare strs[0][k] with every other strs[i][k]. On first mismatch or out-of-bounds return strs[0][0..k]. Clean O(n·m)."
}'::jsonb),
('longest-common-prefix', 3, 'Complexity', '{
  "type": "array",
  "array": ["flower","flow","flight"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(S) where S = total characters. Space O(1) beyond output."
}'::jsonb),
('longest-common-prefix', 4, 'k=0 column', '{
  "type": "array",
  "array": ["f","f","f"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"k": 0},
  "hashmap": {"pivot": "f"},
  "status": "Read strs[0][0]=f. Check strs[1][0]=f ✓, strs[2][0]=f ✓. All match. Prefix extends."
}'::jsonb),
('longest-common-prefix', 5, 'k=1 column', '{
  "type": "array",
  "array": ["l","l","l"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"k": 1},
  "hashmap": {"pivot": "l"},
  "status": "strs[0][1]=l. Others: l, l. All match → prefix = \"fl\"."
}'::jsonb),
('longest-common-prefix', 6, 'k=2 column — pivot o', '{
  "type": "array",
  "array": ["o","o","i"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"k": 2},
  "hashmap": {"pivot": "o"},
  "status": "strs[0][2]=o. strs[1][2]=o ✓, strs[2][2]=i ✗. Mismatch!"
}'::jsonb),
('longest-common-prefix', 7, 'Mismatch → Return Early', '{
  "type": "array",
  "array": ["f","l"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"k": 2},
  "hashmap": {"prefix": "fl"},
  "status": "Return strs[0][0..2] = \"fl\"."
}'::jsonb),
('longest-common-prefix', 8, 'Edge: bounds', '{
  "type": "array",
  "array": ["ab","a"],
  "highlights": [0,1],
  "pointers": {"k": 1},
  "hashmap": {},
  "status": "If k == len(strs[i]) the short string ended — also return strs[0][0..k]."
}'::jsonb),
('longest-common-prefix', 9, 'Edge: empty list', '{
  "type": "array",
  "array": [],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "strs = [] → return \"\"."
}'::jsonb),
('longest-common-prefix', 10, 'Edge: one string', '{
  "type": "array",
  "array": ["hello"],
  "highlights": [0,1,2,3,4],
  "pointers": {},
  "hashmap": {},
  "status": "Single element → entire string is prefix."
}'::jsonb),
('longest-common-prefix', 11, 'Alternative: Sort', '{
  "type": "array",
  "array": ["flight","flow","flower"],
  "highlights": [0,2],
  "pointers": {},
  "hashmap": {},
  "status": "Alt: sort strs, then LCP = common prefix of first and last only. O(S + n log n)."
}'::jsonb),
('longest-common-prefix', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["f","l"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "fl"},
  "status": "Return \"fl\". Time O(S), Space O(1)."
}'::jsonb);


-- ── LONGEST PALINDROMIC SUBSTRING ─────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-palindromic-substring';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-palindromic-substring', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given s = \"babad\". Return the longest palindromic substring. Valid answers: \"bab\" or \"aba\"."
}'::jsonb),
('longest-palindromic-substring', 2, 'Approach: Expand Around Centers', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force O(n³) checks each substring. Better: for every center (2n-1 of them, odd and even), expand while s[L]==s[R]. O(n²) time, O(1) space."
}'::jsonb),
('longest-palindromic-substring', 3, 'Complexity', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n²), Space O(1). Manacher''s algorithm achieves O(n) but is rarely expected."
}'::jsonb),
('longest-palindromic-substring', 4, 'Center i=0 odd', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"L": 0, "R": 0},
  "hashmap": {"best": "b"},
  "status": "Odd center at i=0. Expand: L=0, R=0. s[L]=s[R]=b. Try L=-1 → out of bounds, stop. Length 1."
}'::jsonb),
('longest-palindromic-substring', 5, 'Center i=1 odd', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 2},
  "hashmap": {"best": "bab"},
  "status": "Odd center at i=1 (''a''). Expand: s[0]=b, s[2]=b match → palindrome \"bab\". Try L=-1 stop. Length 3 → update best."
}'::jsonb),
('longest-palindromic-substring', 6, 'Center i=1 even', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [1,2],
  "highlightColor": "red",
  "pointers": {"L": 1, "R": 2},
  "hashmap": {"best": "bab"},
  "status": "Even center between i=1 and i=2. s[1]=a, s[2]=b, mismatch → length 0."
}'::jsonb),
('longest-palindromic-substring', 7, 'Center i=2 odd', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"L": 1, "R": 3},
  "hashmap": {"check": "aba"},
  "status": "Odd center at i=2. s[1]=a, s[3]=a match → \"aba\". Try L=0,R=4: s[0]=b, s[4]=d mismatch. Length 3 (tie, keep best)."
}'::jsonb),
('longest-palindromic-substring', 8, 'Center i=2 even', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [2,3],
  "highlightColor": "red",
  "pointers": {"L": 2, "R": 3},
  "hashmap": {},
  "status": "Even i=2|i=3. s[2]=b, s[3]=a mismatch → 0."
}'::jsonb),
('longest-palindromic-substring', 9, 'Center i=3 odd', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [3],
  "highlightColor": "yellow",
  "pointers": {"L": 2, "R": 4},
  "hashmap": {},
  "status": "Odd i=3. s[2]=b, s[4]=d mismatch → length 1."
}'::jsonb),
('longest-palindromic-substring', 10, 'Remaining centers', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [4],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"best": "bab"},
  "status": "Center i=4 odd → length 1. No center beats length 3."
}'::jsonb),
('longest-palindromic-substring', 11, 'Best Tracked', '{
  "type": "array",
  "array": ["b","a","b","a","d"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"start": 0, "end": 3},
  "hashmap": {"best_len": "3"},
  "status": "Throughout the scan we kept (start,end) of the longest palindrome seen: [0,3) = \"bab\"."
}'::jsonb),
('longest-palindromic-substring', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["b","a","b"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "bab"},
  "status": "Return \"bab\" (or \"aba\" — both valid). Time O(n²), Space O(1)."
}'::jsonb);


-- ── MOVE ZEROES ───────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'move-zeroes';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('move-zeroes', 1, 'Problem Setup', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given nums = [0,1,0,3,12]. Move all zeroes to the end while preserving the order of non-zero elements. In-place."
}'::jsonb),
('move-zeroes', 2, 'Approach: Two Pointers', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: filter into new array then pad zeros — O(n) extra space. Better: pointer ''write'' marks where the next non-zero goes; ''read'' scans. Swap, advance. O(n)/O(1)."
}'::jsonb),
('move-zeroes', 3, 'Complexity', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('move-zeroes', 4, 'Initialize', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [],
  "pointers": {"write": 0, "read": 0},
  "hashmap": {},
  "status": "write = 0, read = 0."
}'::jsonb),
('move-zeroes', 5, 'read=0: value 0', '{
  "type": "array",
  "array": [0,1,0,3,12],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"write": 0, "read": 0},
  "hashmap": {},
  "status": "nums[0] = 0. Skip — only advance read."
}'::jsonb),
('move-zeroes', 6, 'read=1: value 1, swap', '{
  "type": "array",
  "array": [1,0,0,3,12],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"write": 1, "read": 2},
  "hashmap": {},
  "status": "nums[1]=1 nonzero. Swap with nums[write=0]. Array → [1,0,0,3,12]. write → 1, read → 2."
}'::jsonb),
('move-zeroes', 7, 'read=2: value 0', '{
  "type": "array",
  "array": [1,0,0,3,12],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"write": 1, "read": 3},
  "hashmap": {},
  "status": "nums[2] = 0. Skip. read → 3."
}'::jsonb),
('move-zeroes', 8, 'read=3: value 3, swap', '{
  "type": "array",
  "array": [1,3,0,0,12],
  "highlights": [1,3],
  "highlightColor": "green",
  "pointers": {"write": 2, "read": 4},
  "hashmap": {},
  "status": "nums[3]=3 nonzero. Swap with nums[write=1]. → [1,3,0,0,12]. write → 2, read → 4."
}'::jsonb),
('move-zeroes', 9, 'read=4: value 12, swap', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [2,4],
  "highlightColor": "green",
  "pointers": {"write": 3, "read": 5},
  "hashmap": {},
  "status": "nums[4]=12 nonzero. Swap with nums[write=2]. → [1,3,12,0,0]. write → 3."
}'::jsonb),
('move-zeroes', 10, 'Loop Ends', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [],
  "pointers": {"write": 3, "read": 5},
  "hashmap": {},
  "status": "read reached n=5. Loop ends. Non-zeros occupy [0..write), zeros fill the tail."
}'::jsonb),
('move-zeroes', 11, 'Why Stable?', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Non-zeros preserve original order: 1 came before 3 in input, still true. Swap with self or with known-zero cell — never reorders nonzeros."
}'::jsonb),
('move-zeroes', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1,3,12,0,0],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[1,3,12,0,0]"},
  "status": "Modified in place. Time O(n), Space O(1)."
}'::jsonb);


-- ── MULTIPLY STRINGS ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'multiply-strings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('multiply-strings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["1","2","3"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"num1": "123", "num2": "45"},
  "status": "Given num1 = \"123\", num2 = \"45\". Multiply as strings (no bigint). Expected \"5535\"."
}'::jsonb),
('multiply-strings', 2, 'Approach: Positional Product', '{
  "type": "array",
  "array": ["1","2","3"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force int conversion fails for huge numbers. Simulate long multiplication: digit i of num1 × digit j of num2 contributes to positions i+j and i+j+1. O(n·m)."
}'::jsonb),
('multiply-strings', 3, 'Complexity', '{
  "type": "array",
  "array": ["1","2","3"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n·m), Space O(n+m) for the result buffer."
}'::jsonb),
('multiply-strings', 4, 'Initialize Buffer', '{
  "type": "array",
  "array": [0,0,0,0,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {"len": "5"},
  "status": "Allocate array of zeros length n+m = 3+2 = 5 to hold digits of the product."
}'::jsonb),
('multiply-strings', 5, 'i=2(3) × j=1(5)', '{
  "type": "array",
  "array": [0,0,0,1,5],
  "highlights": [3,4],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "j": 1},
  "hashmap": {"product": "15"},
  "status": "digit 3 × digit 5 = 15. positions p1=i+j=3, p2=i+j+1=4. buf[4] = 5, carry 1 into buf[3]. buf = [0,0,0,1,5]."
}'::jsonb),
('multiply-strings', 6, 'i=2(3) × j=0(4)', '{
  "type": "array",
  "array": [0,0,1,3,5],
  "highlights": [2,3],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "j": 0},
  "hashmap": {"product": "12"},
  "status": "3 × 4 = 12, plus existing buf[3]=1 → 13. buf[3]=3, carry 1 to buf[2]. buf = [0,0,1,3,5]."
}'::jsonb),
('multiply-strings', 7, 'i=1(2) × j=1(5)', '{
  "type": "array",
  "array": [0,0,2,3,5],
  "highlights": [2,3],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {"product": "10"},
  "status": "2 × 5 = 10. positions 2,3. buf[3]=3+0=3, buf[2]=1+1=2 (carry from 10). buf = [0,0,2,3,5]."
}'::jsonb),
('multiply-strings', 8, 'i=1(2) × j=0(4)', '{
  "type": "array",
  "array": [0,1,0,3,5],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "j": 0},
  "hashmap": {"product": "8"},
  "status": "2×4=8 plus buf[2]=2 → 10. buf[2]=0, carry 1 to buf[1]. buf = [0,1,0,3,5]."
}'::jsonb),
('multiply-strings', 9, 'i=0(1) × j=1(5)', '{
  "type": "array",
  "array": [0,1,5,3,5],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 1},
  "hashmap": {"product": "5"},
  "status": "1×5=5 plus buf[2]=0 → 5. buf[2]=5. buf = [0,1,5,3,5]."
}'::jsonb),
('multiply-strings', 10, 'i=0(1) × j=0(4)', '{
  "type": "array",
  "array": [0,5,5,3,5],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "j": 0},
  "hashmap": {"product": "4"},
  "status": "1×4=4 plus buf[1]=1 → 5. buf[1]=5. buf = [0,5,5,3,5]."
}'::jsonb),
('multiply-strings', 11, 'Strip Leading Zeros', '{
  "type": "array",
  "array": [5,5,3,5],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"trimmed": "5535"},
  "status": "Remove leading zeros: drop buf[0]=0. Result digits = [5,5,3,5]."
}'::jsonb),
('multiply-strings', 12, 'Return & Recap', '{
  "type": "array",
  "array": [5,5,3,5],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "5535"},
  "status": "Special case: if either input is \"0\" return \"0\". Return \"5535\". O(n·m)."
}'::jsonb);


-- ── PALINDROMIC SUBSTRINGS ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'palindromic-substrings';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('palindromic-substrings', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "aaa"},
  "status": "Given s = \"aaa\". Count the number of palindromic substrings (distinct positions)."
}'::jsonb),
('palindromic-substrings', 2, 'Approach: Expand Around Centers', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force O(n³). For every center (n odd + n-1 even), expand while s[L]==s[R] and count each successful expansion. O(n²)."
}'::jsonb),
('palindromic-substrings', 3, 'Complexity', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n²), Space O(1)."
}'::jsonb),
('palindromic-substrings', 4, 'Center i=0 odd', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 0},
  "hashmap": {"count": "1"},
  "status": "Odd center i=0. s[0]=a palindrome → count++. Expand: L=-1 OOB, stop. Count=1."
}'::jsonb),
('palindromic-substrings', 5, 'Even center i=0|1', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 1},
  "hashmap": {"count": "2"},
  "status": "Even between 0 and 1. s[0]=s[1]=a → \"aa\" palindrome. count=2. Expand: L=-1 stop."
}'::jsonb),
('palindromic-substrings', 6, 'Odd center i=1', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"L": 1, "R": 1},
  "hashmap": {"count": "3"},
  "status": "s[1]=a alone → count=3. Expand: L=0, R=2 both ''a'' → palindrome \"aaa\"! count=4. Expand further OOB."
}'::jsonb),
('palindromic-substrings', 7, 'Center i=1 expands twice', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 2},
  "hashmap": {"count": "4"},
  "status": "\"aaa\" counted. Every successful expansion = one more palindromic substring."
}'::jsonb),
('palindromic-substrings', 8, 'Even center i=1|2', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"L": 1, "R": 2},
  "hashmap": {"count": "5"},
  "status": "Even between 1 and 2: s[1]=s[2]=a → \"aa\". count=5."
}'::jsonb),
('palindromic-substrings', 9, 'Odd center i=2', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"L": 2, "R": 2},
  "hashmap": {"count": "6"},
  "status": "s[2]=a → count=6. Expand: L=1,R=3 OOB → stop."
}'::jsonb),
('palindromic-substrings', 10, 'All Centers Done', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"count": "6"},
  "status": "All 2n-1 = 5 centers processed. Total palindromic substrings = 6: a, a, a, aa, aa, aaa."
}'::jsonb),
('palindromic-substrings', 11, 'Verify Enumeration', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"subs": "a,a,a,aa,aa,aaa"},
  "status": "Substrings by position: [0,0],[1,1],[2,2],[0,1],[1,2],[0,2] — 6 palindromes."
}'::jsonb),
('palindromic-substrings', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["a","a","a"],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "6"},
  "status": "Return 6. Time O(n²), Space O(1)."
}'::jsonb);


-- ── PLUS ONE ──────────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'plus-one';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('plus-one', 1, 'Problem Setup', '{
  "type": "array",
  "array": [9,9,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given digits = [9,9,9] representing an integer. Add 1 and return the resulting digit array → [1,0,0,0]."
}'::jsonb),
('plus-one', 2, 'Approach: Scan from Right', '{
  "type": "array",
  "array": [9,9,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Walk from the last digit. If digit < 9, bump it and return. If it''s 9, set to 0 and carry left. If we exit the loop, prepend a leading 1. O(n)/O(1)."
}'::jsonb),
('plus-one', 3, 'Complexity', '{
  "type": "array",
  "array": [9,9,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1) amortised (growth only on all-nines)."
}'::jsonb),
('plus-one', 4, 'Initialize', '{
  "type": "array",
  "array": [9,9,9],
  "highlights": [2],
  "pointers": {"i": 2},
  "hashmap": {},
  "status": "i = n-1 = 2, pointing at the ones place."
}'::jsonb),
('plus-one', 5, 'i=2: digit 9', '{
  "type": "array",
  "array": [9,9,0],
  "highlights": [2],
  "highlightColor": "red",
  "pointers": {"i": 2},
  "hashmap": {"carry": "1"},
  "status": "digits[2]=9, adding 1 yields 10. Set digits[2]=0, propagate carry."
}'::jsonb),
('plus-one', 6, 'i=1: digit 9', '{
  "type": "array",
  "array": [9,0,0],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i": 1},
  "hashmap": {"carry": "1"},
  "status": "digits[1]=9 again. Set to 0, keep carrying."
}'::jsonb),
('plus-one', 7, 'i=0: digit 9', '{
  "type": "array",
  "array": [0,0,0],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"i": 0},
  "hashmap": {"carry": "1"},
  "status": "digits[0]=9. Set to 0. Carry still active and i will fall off the left."
}'::jsonb),
('plus-one', 8, 'Prepend 1', '{
  "type": "array",
  "array": [1,0,0,0],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"carry": "0"},
  "status": "Loop exhausted while still carrying → create new array with leading 1."
}'::jsonb),
('plus-one', 9, 'Example 2: [1,2,3]', '{
  "type": "array",
  "array": [1,2,3],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {},
  "status": "Most inputs: digits[n-1] < 9 → single increment, return immediately. [1,2,3] → [1,2,4]."
}'::jsonb),
('plus-one', 10, 'Example 3: [1,9]', '{
  "type": "array",
  "array": [1,9],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i": 1},
  "hashmap": {},
  "status": "[1,9]: i=1 9→0 carry. i=0 digit 1→2, no carry, return [2,0]."
}'::jsonb),
('plus-one', 11, 'Why We Avoid Int Parse', '{
  "type": "array",
  "array": [9,9,9,9,9,9,9,9,9,9,9,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "For very long arrays, converting to integer could overflow the language''s native int. Digit-by-digit sidesteps that."
}'::jsonb),
('plus-one', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1,0,0,0],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[1,0,0,0]"},
  "status": "Return [1,0,0,0]. Time O(n), Space O(1) unless we must grow."
}'::jsonb);


-- ── REMOVE DUPLICATES SORTED ──────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-duplicates-sorted';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-duplicates-sorted', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,2,2,3,4,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given sorted nums = [1,1,2,2,3,4,4]. Remove duplicates in-place; return count k of unique values. First k elements must hold them."
}'::jsonb),
('remove-duplicates-sorted', 2, 'Approach: Two Pointers', '{
  "type": "array",
  "array": [1,1,2,2,3,4,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: copy to set → loses order, needs O(n) space. Since input is sorted, duplicates sit adjacent. ''write'' holds next unique slot; ''read'' scans. O(n)/O(1)."
}'::jsonb),
('remove-duplicates-sorted', 3, 'Complexity', '{
  "type": "array",
  "array": [1,1,2,2,3,4,4],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('remove-duplicates-sorted', 4, 'Initialize', '{
  "type": "array",
  "array": [1,1,2,2,3,4,4],
  "highlights": [0],
  "pointers": {"write": 1, "read": 1},
  "hashmap": {},
  "status": "write = 1, read = 1. First element always stays."
}'::jsonb),
('remove-duplicates-sorted', 5, 'read=1: dup', '{
  "type": "array",
  "array": [1,1,2,2,3,4,4],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"write": 1, "read": 2},
  "hashmap": {},
  "status": "nums[1]=1 == nums[write-1]=1. Skip, read → 2."
}'::jsonb),
('remove-duplicates-sorted', 6, 'read=2: new value 2', '{
  "type": "array",
  "array": [1,2,2,2,3,4,4],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"write": 2, "read": 3},
  "hashmap": {},
  "status": "nums[2]=2 ≠ nums[write-1]=1. Write at index 1. Array front → [1,2,...]. write=2."
}'::jsonb),
('remove-duplicates-sorted', 7, 'read=3: dup', '{
  "type": "array",
  "array": [1,2,2,2,3,4,4],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"write": 2, "read": 4},
  "hashmap": {},
  "status": "nums[3]=2 == nums[write-1]=2. Skip."
}'::jsonb),
('remove-duplicates-sorted', 8, 'read=4: new value 3', '{
  "type": "array",
  "array": [1,2,3,2,3,4,4],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"write": 3, "read": 5},
  "hashmap": {},
  "status": "nums[4]=3 ≠ 2. Write at index 2. Front → [1,2,3,...]. write=3."
}'::jsonb),
('remove-duplicates-sorted', 9, 'read=5: new value 4', '{
  "type": "array",
  "array": [1,2,3,4,3,4,4],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"write": 4, "read": 6},
  "hashmap": {},
  "status": "nums[5]=4 ≠ 3. Write at index 3. write=4."
}'::jsonb),
('remove-duplicates-sorted', 10, 'read=6: dup', '{
  "type": "array",
  "array": [1,2,3,4,3,4,4],
  "highlights": [6],
  "highlightColor": "red",
  "pointers": {"write": 4, "read": 7},
  "hashmap": {},
  "status": "nums[6]=4 == 4. Skip."
}'::jsonb),
('remove-duplicates-sorted', 11, 'Loop Ends', '{
  "type": "array",
  "array": [1,2,3,4,3,4,4],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"write": 4},
  "hashmap": {"k": "4"},
  "status": "read == n. k = write = 4. First 4 slots hold uniques [1,2,3,4]. Trailing cells may contain anything."
}'::jsonb),
('remove-duplicates-sorted', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1,2,3,4,3,4,4],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "4"},
  "status": "Return 4. Caller only inspects nums[0..k). Time O(n), Space O(1)."
}'::jsonb);


-- ── REMOVE ELEMENT ────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'remove-element';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('remove-element', 1, 'Problem Setup', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {"val": "3"},
  "status": "Given nums = [3,2,2,3], val = 3. Remove all 3s in place; return new length k."
}'::jsonb),
('remove-element', 2, 'Approach: Two Pointers (Overwrite)', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force with filter uses O(n) space. Better: ''write'' marks next kept slot; ''read'' scans. If nums[read]≠val copy to write and advance write. O(n)/O(1)."
}'::jsonb),
('remove-element', 3, 'Complexity', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('remove-element', 4, 'Initialize', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [],
  "pointers": {"write": 0, "read": 0},
  "hashmap": {},
  "status": "write = 0, read = 0."
}'::jsonb),
('remove-element', 5, 'read=0: nums[0]=3', '{
  "type": "array",
  "array": [3,2,2,3],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"write": 0, "read": 1},
  "hashmap": {},
  "status": "3 == val. Skip; only read advances."
}'::jsonb),
('remove-element', 6, 'read=1: nums[1]=2', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"write": 1, "read": 2},
  "hashmap": {},
  "status": "2 ≠ val. Copy nums[read] to nums[write]. nums[0]=2. write → 1."
}'::jsonb),
('remove-element', 7, 'read=2: nums[2]=2', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"write": 2, "read": 3},
  "hashmap": {},
  "status": "2 ≠ val. nums[1]=2. write → 2."
}'::jsonb),
('remove-element', 8, 'read=3: nums[3]=3', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [3],
  "highlightColor": "red",
  "pointers": {"write": 2, "read": 4},
  "hashmap": {},
  "status": "3 == val. Skip."
}'::jsonb),
('remove-element', 9, 'Loop Ends', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {"write": 2},
  "hashmap": {"k": "2"},
  "status": "read == n=4. k = write = 2. Valid elements live in nums[0..k)."
}'::jsonb),
('remove-element', 10, 'Order Preserved', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Kept elements maintain input order. (An alternative swap-with-end variant is faster when val is rare but doesn''t preserve order.)"
}'::jsonb),
('remove-element', 11, 'Alt Strategy Note', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Swap-from-end: when nums[i]==val, overwrite with nums[n-1] and shrink n. Minimizes writes but shuffles order."
}'::jsonb),
('remove-element', 12, 'Return & Recap', '{
  "type": "array",
  "array": [2,2,2,3],
  "highlights": [0,1],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "2"},
  "status": "Return 2. Time O(n), Space O(1)."
}'::jsonb);


-- ── REVERSE WORDS IN STRING ───────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'reverse-words-in-string';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-words-in-string', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "the sky is blue"},
  "status": "Given s = \"the sky is blue\". Return reversed words, single-spaced → \"blue is sky the\"."
}'::jsonb),
('reverse-words-in-string', 2, 'Approach: Split + Reverse', '{
  "type": "array",
  "array": ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "1) Trim edges, split on whitespace (handles multiple spaces). 2) Reverse the list. 3) Join with single space. O(n) time, O(n) space."
}'::jsonb),
('reverse-words-in-string', 3, 'Complexity', '{
  "type": "array",
  "array": ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(n) for the tokenized words."
}'::jsonb),
('reverse-words-in-string', 4, 'Trim & Split', '{
  "type": "array",
  "array": ["the","sky","is","blue"],
  "highlights": [0,1,2,3],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"words": "4"},
  "status": "Split collapses multiple spaces: [\"the\",\"sky\",\"is\",\"blue\"]."
}'::jsonb),
('reverse-words-in-string', 5, 'Reverse via 2 pointers: L=0,R=3', '{
  "type": "array",
  "array": ["blue","sky","is","the"],
  "highlights": [0,3],
  "highlightColor": "green",
  "pointers": {"L": 0, "R": 3},
  "hashmap": {},
  "status": "Swap words[0] and words[3]. [blue, sky, is, the]."
}'::jsonb),
('reverse-words-in-string', 6, 'Reverse: L=1,R=2', '{
  "type": "array",
  "array": ["blue","is","sky","the"],
  "highlights": [1,2],
  "highlightColor": "green",
  "pointers": {"L": 1, "R": 2},
  "hashmap": {},
  "status": "Swap words[1] and words[2]. [blue, is, sky, the]."
}'::jsonb),
('reverse-words-in-string', 7, 'Pointers Cross', '{
  "type": "array",
  "array": ["blue","is","sky","the"],
  "highlights": [0,1,2,3],
  "highlightColor": "green",
  "pointers": {"L": 2, "R": 1},
  "hashmap": {},
  "status": "L > R → reversal complete."
}'::jsonb),
('reverse-words-in-string', 8, 'Join with Single Space', '{
  "type": "array",
  "array": ["blue"," ","is"," ","sky"," ","the"],
  "highlights": [0,2,4,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"joined": "blue is sky the"},
  "status": "Join → \"blue is sky the\"."
}'::jsonb),
('reverse-words-in-string', 9, 'Edge: multiple spaces', '{
  "type": "array",
  "array": [" "," ","h","i"," ","!"," "," "],
  "highlights": [],
  "pointers": {},
  "hashmap": {"split": "[hi, !]"},
  "status": "Input \"  hi !  \" → split yields [\"hi\",\"!\"] (no empty tokens)."
}'::jsonb),
('reverse-words-in-string', 10, 'In-Place Alt (O(1) space)', '{
  "type": "array",
  "array": ["b","l","u","e"," ","i","s"," ","s","k","y"," ","t","h","e"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Alt: reverse entire string, then reverse each word in place. Used in C++ where in-place char array is natural."
}'::jsonb),
('reverse-words-in-string', 11, 'Verify', '{
  "type": "array",
  "array": ["b","l","u","e"," ","i","s"," ","s","k","y"," ","t","h","e"],
  "highlights": [0,1,2,3,5,6,8,9,10,12,13,14],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {},
  "status": "Result length = 15 chars, 3 single-space delimiters, 4 words."
}'::jsonb),
('reverse-words-in-string', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["b","l","u","e"," ","i","s"," ","s","k","y"," ","t","h","e"],
  "highlights": [0,1,2,3,5,6,8,9,10,12,13,14],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "blue is sky the"},
  "status": "Return \"blue is sky the\". Time O(n), Space O(n)."
}'::jsonb);


-- ── ROMAN TO INTEGER ──────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'roman-to-integer';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('roman-to-integer', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given s = \"MCMXCIV\". Convert Roman numeral to integer → 1994."
}'::jsonb),
('roman-to-integer', 2, 'Approach: Subtractive Peek', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"I": "1", "V": "5", "X": "10", "L": "50", "C": "100", "D": "500", "M": "1000"},
  "status": "For each char, if its value is less than the NEXT char''s value, subtract it; else add. Handles IV, IX, XL, XC, CD, CM naturally. O(n)."
}'::jsonb),
('roman-to-integer', 3, 'Complexity', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('roman-to-integer', 4, 'i=0: M', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [0,1],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "total": 0},
  "hashmap": {"s[i]": "1000", "s[i+1]": "100"},
  "status": "M=1000 ≥ next C=100 → ADD 1000. total = 1000."
}'::jsonb),
('roman-to-integer', 5, 'i=1: C before M', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [1,2],
  "highlightColor": "orange",
  "pointers": {"i": 1, "total": 900},
  "hashmap": {"s[i]": "100", "s[i+1]": "1000"},
  "status": "C=100 < next M=1000 → SUBTRACT 100. total = 1000 - 100 = 900."
}'::jsonb),
('roman-to-integer', 6, 'i=2: M', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [2,3],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "total": 1900},
  "hashmap": {"s[i]": "1000", "s[i+1]": "10"},
  "status": "M=1000 ≥ next X=10 → ADD 1000. total = 1900."
}'::jsonb),
('roman-to-integer', 7, 'i=3: X before C', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [3,4],
  "highlightColor": "orange",
  "pointers": {"i": 3, "total": 1890},
  "hashmap": {"s[i]": "10", "s[i+1]": "100"},
  "status": "X=10 < next C=100 → SUBTRACT 10. total = 1890."
}'::jsonb),
('roman-to-integer', 8, 'i=4: C', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [4,5],
  "highlightColor": "yellow",
  "pointers": {"i": 4, "total": 1990},
  "hashmap": {"s[i]": "100", "s[i+1]": "1"},
  "status": "C=100 ≥ next I=1 → ADD 100. total = 1990."
}'::jsonb),
('roman-to-integer', 9, 'i=5: I before V', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [5,6],
  "highlightColor": "orange",
  "pointers": {"i": 5, "total": 1989},
  "hashmap": {"s[i]": "1", "s[i+1]": "5"},
  "status": "I=1 < next V=5 → SUBTRACT 1. total = 1989."
}'::jsonb),
('roman-to-integer', 10, 'i=6: V (last)', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [6],
  "highlightColor": "yellow",
  "pointers": {"i": 6, "total": 1994},
  "hashmap": {"s[i]": "5"},
  "status": "Last char has no next — always ADD. total = 1989 + 5 = 1994."
}'::jsonb),
('roman-to-integer', 11, 'Why This Works', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [1,3,5],
  "highlightColor": "orange",
  "pointers": {},
  "hashmap": {"subtractive_positions": "[1,3,5]"},
  "status": "Subtractive pairs are exactly the positions where a smaller symbol precedes a larger one — the rule captures them without special-casing."
}'::jsonb),
('roman-to-integer', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["M","C","M","X","C","I","V"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "1994"},
  "status": "Return 1994. Time O(n), Space O(1)."
}'::jsonb);


-- ── SET MATRIX ZEROES ─────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'set-matrix-zeroes';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('set-matrix-zeroes', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,1,1,1,0,1,1,1,1],
  "highlights": [],
  "pointers": {"rows": 3, "cols": 3},
  "hashmap": {"matrix": "[[1,1,1],[1,0,1],[1,1,1]]"},
  "status": "Given a 3×3 matrix. If any cell is 0, zero out its entire row AND column. Do it in place."
}'::jsonb),
('set-matrix-zeroes', 2, 'Approach: First Row/Col as Flags', '{
  "type": "array",
  "array": [1,1,1,1,0,1,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force uses O(mn) memory. Use sets: O(m+n). Optimal O(1): repurpose row 0 and col 0 as marker arrays. Track separately whether row0/col0 originally had a zero."
}'::jsonb),
('set-matrix-zeroes', 3, 'Complexity', '{
  "type": "array",
  "array": [1,1,1,1,0,1,1,1,1],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(m·n), Space O(1)."
}'::jsonb),
('set-matrix-zeroes', 4, 'Pass 1 prep: check row0 & col0', '{
  "type": "array",
  "array": [1,1,1,1,0,1,1,1,1],
  "highlights": [0,1,2,3,6],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"row0_has_zero": "false", "col0_has_zero": "false"},
  "status": "Scan row 0: [1,1,1] → no zero. Scan col 0: [1,1,1] → no zero. Record both flags."
}'::jsonb),
('set-matrix-zeroes', 5, 'Pass 1: mark from interior', '{
  "type": "array",
  "array": [1,1,1,1,0,1,1,1,1],
  "highlights": [4],
  "highlightColor": "red",
  "pointers": {"i": 1, "j": 1},
  "hashmap": {},
  "status": "Find matrix[1][1] = 0. Write 0 to matrix[1][0] and matrix[0][1] as markers."
}'::jsonb),
('set-matrix-zeroes', 6, 'After marking', '{
  "type": "array",
  "array": [1,0,1,0,0,1,1,1,1],
  "highlights": [1,3],
  "highlightColor": "orange",
  "pointers": {},
  "hashmap": {"matrix": "[[1,0,1],[0,0,1],[1,1,1]]"},
  "status": "Markers in place: row 0 col 1 flags ''zero column 1''; row 1 col 0 flags ''zero row 1''."
}'::jsonb),
('set-matrix-zeroes', 7, 'Pass 2: zero interior cells', '{
  "type": "array",
  "array": [1,0,1,0,0,0,1,0,1],
  "highlights": [4,5,7],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"matrix": "[[1,0,1],[0,0,0],[1,0,1]]"},
  "status": "For each i≥1, j≥1: if matrix[i][0]==0 or matrix[0][j]==0 set matrix[i][j]=0. Row 1 fully zero, col 1 fully zero."
}'::jsonb),
('set-matrix-zeroes', 8, 'Pass 3: zero row 0 if needed', '{
  "type": "array",
  "array": [1,0,1,0,0,0,1,0,1],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"row0_has_zero": "false"},
  "status": "row0_has_zero = false → don''t wipe row 0. Its current values reflect markers only."
}'::jsonb),
('set-matrix-zeroes', 9, 'Pass 4: zero col 0 if needed', '{
  "type": "array",
  "array": [1,0,1,0,0,0,1,0,1],
  "highlights": [0,3,6],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {"col0_has_zero": "false"},
  "status": "col0_has_zero = false → don''t wipe col 0."
}'::jsonb),
('set-matrix-zeroes', 10, 'Edge: original zero in row0', '{
  "type": "array",
  "array": [1,0,1,1,1,1,1,1,1],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {},
  "hashmap": {"row0_has_zero": "true"},
  "status": "If row 0 had a zero originally, after passes we must still zero ALL of row 0 — the flag prevents losing that info when markers overlap."
}'::jsonb),
('set-matrix-zeroes', 11, 'Why Two Flags Matter', '{
  "type": "array",
  "array": [1,0,1,0,0,0,1,0,1],
  "highlights": [0],
  "pointers": {},
  "hashmap": {},
  "status": "Cell matrix[0][0] is shared by row 0 AND col 0. Without separate flags we can''t distinguish whether col 0 or row 0 needs zeroing."
}'::jsonb),
('set-matrix-zeroes', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1,0,1,0,0,0,1,0,1],
  "highlights": [0,1,2,3,4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[[1,0,1],[0,0,0],[1,0,1]]"},
  "status": "Modified in place. Time O(m·n), Space O(1)."
}'::jsonb);


-- ── SINGLE NUMBER ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'single-number';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('single-number', 1, 'Problem Setup', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given nums = [4,1,2,1,2]. Every element appears twice except one. Find it in O(n) time, O(1) space."
}'::jsonb),
('single-number', 2, 'Approach: XOR Trick', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "HashMap approach uses O(n) space. Key property: a XOR a = 0 and a XOR 0 = a. XORing all elements cancels out pairs, leaving only the unique one."
}'::jsonb),
('single-number', 3, 'Complexity', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('single-number', 4, 'Initialize', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [],
  "pointers": {"i": 0, "xor": 0},
  "hashmap": {},
  "status": "xor = 0. We fold the array into xor one element at a time."
}'::jsonb),
('single-number', 5, 'i=0: xor ^= 4', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"i": 0, "xor": 4},
  "hashmap": {},
  "status": "xor = 0 ^ 4 = 4."
}'::jsonb),
('single-number', 6, 'i=1: xor ^= 1', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [1],
  "highlightColor": "yellow",
  "pointers": {"i": 1, "xor": 5},
  "hashmap": {},
  "status": "xor = 4 ^ 1 = 5 (binary 101)."
}'::jsonb),
('single-number', 7, 'i=2: xor ^= 2', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 2, "xor": 7},
  "hashmap": {},
  "status": "xor = 5 ^ 2 = 7 (binary 111)."
}'::jsonb),
('single-number', 8, 'i=3: xor ^= 1 (duplicate)', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [3],
  "highlightColor": "orange",
  "pointers": {"i": 3, "xor": 6},
  "hashmap": {},
  "status": "xor = 7 ^ 1 = 6. The ''1'' bit flipped off — the pair is cancelling."
}'::jsonb),
('single-number', 9, 'i=4: xor ^= 2 (duplicate)', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [4],
  "highlightColor": "orange",
  "pointers": {"i": 4, "xor": 4},
  "hashmap": {},
  "status": "xor = 6 ^ 2 = 4. The other pair cancelled too. Only 4 remains."
}'::jsonb),
('single-number', 10, 'Loop Ends', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"xor": 4},
  "hashmap": {},
  "status": "All pairs cancelled due to commutativity/associativity of XOR. Answer = xor = 4."
}'::jsonb),
('single-number', 11, 'Why Order Doesn''t Matter', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [],
  "pointers": {},
  "hashmap": {"rearranged": "1^1^2^2^4 = 0^0^4 = 4"},
  "status": "XOR is commutative. Conceptually: 4 ^ 1 ^ 2 ^ 1 ^ 2 = 4 ^ (1^1) ^ (2^2) = 4."
}'::jsonb),
('single-number', 12, 'Return & Recap', '{
  "type": "array",
  "array": [4,1,2,1,2],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "4"},
  "status": "Return 4. Time O(n), Space O(1)."
}'::jsonb);


-- ── SORT COLORS ───────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'sort-colors';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('sort-colors', 1, 'Problem Setup', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given nums with values in {0,1,2}. Sort in place. One pass, O(1) space (Dutch National Flag)."
}'::jsonb),
('sort-colors', 2, 'Approach: Three Pointers', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force counting sort needs 2 passes. Dijkstra''s DNF uses lo (boundary of 0s), hi (boundary of 2s), i (cursor). Swap logic sorts in a single pass."
}'::jsonb),
('sort-colors', 3, 'Complexity', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('sort-colors', 4, 'Initialize', '{
  "type": "array",
  "array": [2,0,2,1,1,0],
  "highlights": [],
  "pointers": {"lo": 0, "i": 0, "hi": 5},
  "hashmap": {},
  "status": "lo = 0, i = 0, hi = n-1 = 5. Invariant: [0..lo) all 0, [lo..i) all 1, (hi..n) all 2."
}'::jsonb),
('sort-colors', 5, 'i=0: val 2, swap with hi', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [0,5],
  "highlightColor": "yellow",
  "pointers": {"lo": 0, "i": 0, "hi": 4},
  "hashmap": {},
  "status": "nums[0]=2 → swap with nums[hi=5]. Array → [0,0,2,1,1,2]. Decrement hi → 4. Don''t advance i (new value unknown)."
}'::jsonb),
('sort-colors', 6, 'i=0: val 0, swap with lo', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [0],
  "highlightColor": "green",
  "pointers": {"lo": 1, "i": 1, "hi": 4},
  "hashmap": {},
  "status": "nums[0]=0 → swap with nums[lo=0] (self), increment both lo and i."
}'::jsonb),
('sort-colors', 7, 'i=1: val 0, swap with lo', '{
  "type": "array",
  "array": [0,0,2,1,1,2],
  "highlights": [1],
  "highlightColor": "green",
  "pointers": {"lo": 2, "i": 2, "hi": 4},
  "hashmap": {},
  "status": "nums[1]=0 → swap with nums[lo=1] (self). lo=2, i=2."
}'::jsonb),
('sort-colors', 8, 'i=2: val 2, swap with hi', '{
  "type": "array",
  "array": [0,0,1,1,1,2],
  "highlights": [2,4],
  "highlightColor": "yellow",
  "pointers": {"lo": 2, "i": 2, "hi": 3},
  "hashmap": {},
  "status": "nums[2]=2 → swap with nums[hi=4]. Array → [0,0,1,1,2,2]. hi → 3. i stays."
}'::jsonb),
('sort-colors', 9, 'i=2: val 1, advance', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"lo": 2, "i": 3, "hi": 3},
  "hashmap": {},
  "status": "nums[2]=1 → in its section. Only i advances. i=3."
}'::jsonb),
('sort-colors', 10, 'i=3: val 1, advance', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"lo": 2, "i": 4, "hi": 3},
  "hashmap": {},
  "status": "nums[3]=1. i → 4, which now exceeds hi → loop ends."
}'::jsonb),
('sort-colors', 11, 'Invariants Hold', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {"lo": 2, "hi": 3},
  "hashmap": {},
  "status": "[0..lo)=0s, [lo..i)=1s, (hi..n)=2s. All three regions correctly placed."
}'::jsonb),
('sort-colors', 12, 'Return & Recap', '{
  "type": "array",
  "array": [0,0,1,1,2,2],
  "highlights": [0,1,2,3,4,5],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[0,0,1,1,2,2]"},
  "status": "Sorted in place. Time O(n), Space O(1)."
}'::jsonb);


-- ── SPIRAL MATRIX ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'spiral-matrix';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('spiral-matrix', 1, 'Problem Setup', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [],
  "pointers": {"rows": 3, "cols": 3},
  "hashmap": {"matrix": "[[1,2,3],[4,5,6],[7,8,9]]"},
  "status": "Given 3×3 matrix. Traverse in spiral order (right, down, left, up, inward). Expected [1,2,3,6,9,8,7,4,5]."
}'::jsonb),
('spiral-matrix', 2, 'Approach: Layer Boundaries', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Maintain top, bottom, left, right boundaries. Walk the perimeter, shrink boundaries, repeat until boundaries cross. O(m·n) time, O(1) extra space."
}'::jsonb),
('spiral-matrix', 3, 'Complexity', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(m·n) — each cell visited once. Space O(1) excluding output."
}'::jsonb),
('spiral-matrix', 4, 'Initialize boundaries', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [],
  "pointers": {"top": 0, "bot": 2, "left": 0, "right": 2},
  "hashmap": {},
  "status": "top=0, bot=2, left=0, right=2. result = []."
}'::jsonb),
('spiral-matrix', 5, 'Go Right on top row', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [0,1,2],
  "highlightColor": "green",
  "pointers": {"top": 0},
  "hashmap": {"result": "[1,2,3]"},
  "status": "Walk row top=0 from left..right. Append 1,2,3. top → 1."
}'::jsonb),
('spiral-matrix', 6, 'Go Down on right col', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [5,8],
  "highlightColor": "green",
  "pointers": {"right": 2},
  "hashmap": {"result": "[1,2,3,6,9]"},
  "status": "Walk col right=2 from top=1..bot=2. Append 6,9. right → 1."
}'::jsonb),
('spiral-matrix', 7, 'Go Left on bottom row', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [7,6],
  "highlightColor": "green",
  "pointers": {"bot": 2},
  "hashmap": {"result": "[1,2,3,6,9,8,7]"},
  "status": "Walk row bot=2 from right=1..left=0. Append 8,7. bot → 1."
}'::jsonb),
('spiral-matrix', 8, 'Go Up on left col', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"left": 0},
  "hashmap": {"result": "[1,2,3,6,9,8,7,4]"},
  "status": "Walk col left=0 from bot=1..top=1. Append 4. left → 1."
}'::jsonb),
('spiral-matrix', 9, 'Boundaries: 1..1', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [4],
  "highlightColor": "yellow",
  "pointers": {"top": 1, "bot": 1, "left": 1, "right": 1},
  "hashmap": {},
  "status": "All boundaries meet at (1,1). A single cell remains."
}'::jsonb),
('spiral-matrix', 10, 'Inner cell appended', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"result": "[1,2,3,6,9,8,7,4,5]"},
  "status": "Go Right step appends 5. Next Down step would have bounds top>bot → skipped. Loop exits."
}'::jsonb),
('spiral-matrix', 11, 'Guard Against Re-Walk', '{
  "type": "array",
  "array": [1,2,3,4,5,6,7,8,9],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "In non-square shapes, after Right/Down we must check top≤bot before the Left pass and left≤right before Up — else we''d traverse the middle row/col twice."
}'::jsonb),
('spiral-matrix', 12, 'Return & Recap', '{
  "type": "array",
  "array": [1,2,3,6,9,8,7,4,5],
  "highlights": [0,1,2,3,4,5,6,7,8],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[1,2,3,6,9,8,7,4,5]"},
  "status": "Return result. Time O(m·n), Space O(1)."
}'::jsonb);


-- ── SQUARES SORTED ARRAY ──────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'squares-sorted-array';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('squares-sorted-array', 1, 'Problem Setup', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Given sorted nums = [-4,-1,0,3,10]. Return a sorted array of their squares → [0,1,9,16,100]."
}'::jsonb),
('squares-sorted-array', 2, 'Approach: Two Pointers from Ends', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: square all and sort → O(n log n). Observation: the LARGEST square is at one of the ends (most negative vs most positive). Use two pointers writing biggest-first into the back."
}'::jsonb),
('squares-sorted-array', 3, 'Complexity', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(n) for output."
}'::jsonb),
('squares-sorted-array', 4, 'Initialize', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {"L": 0, "R": 4, "w": 4},
  "hashmap": {"out": "[_,_,_,_,_]"},
  "status": "L=0, R=4, write position w = n-1 = 4."
}'::jsonb),
('squares-sorted-array', 5, 'Compare |10| vs |-4|', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [0,4],
  "highlightColor": "yellow",
  "pointers": {"L": 0, "R": 4, "w": 4},
  "hashmap": {"out": "[_,_,_,_,100]"},
  "status": "|10|=10 > |-4|=4. Square 10 → 100 at out[4]. R → 3, w → 3."
}'::jsonb),
('squares-sorted-array', 6, 'Compare |3| vs |-4|', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [0,3],
  "highlightColor": "yellow",
  "pointers": {"L": 0, "R": 3, "w": 3},
  "hashmap": {"out": "[_,_,_,16,100]"},
  "status": "|-4|=4 > |3|=3. Square -4 → 16 at out[3]. L → 1, w → 2."
}'::jsonb),
('squares-sorted-array', 7, 'Compare |3| vs |-1|', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [1,3],
  "highlightColor": "yellow",
  "pointers": {"L": 1, "R": 3, "w": 2},
  "hashmap": {"out": "[_,_,9,16,100]"},
  "status": "|3|=3 > |-1|=1. Square 3 → 9 at out[2]. R → 2, w → 1."
}'::jsonb),
('squares-sorted-array', 8, 'Compare |0| vs |-1|', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [1,2],
  "highlightColor": "yellow",
  "pointers": {"L": 1, "R": 2, "w": 1},
  "hashmap": {"out": "[_,1,9,16,100]"},
  "status": "|-1|=1 > |0|=0. Square -1 → 1 at out[1]. L → 2, w → 0."
}'::jsonb),
('squares-sorted-array', 9, 'L == R', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [2],
  "highlightColor": "green",
  "pointers": {"L": 2, "R": 2, "w": 0},
  "hashmap": {"out": "[0,1,9,16,100]"},
  "status": "Both pointers meet at 0. Square 0 → 0 at out[0]."
}'::jsonb),
('squares-sorted-array', 10, 'Loop Ends', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [],
  "pointers": {"L": 3, "R": 2},
  "hashmap": {"out": "[0,1,9,16,100]"},
  "status": "L > R → done. Output filled from end to front, guaranteed sorted."
}'::jsonb),
('squares-sorted-array', 11, 'Why Biggest-First Works', '{
  "type": "array",
  "array": [-4,-1,0,3,10],
  "highlights": [0,4],
  "highlightColor": "yellow",
  "pointers": {},
  "hashmap": {},
  "status": "Sorted order of |x| is V-shaped: largest at ends, smallest somewhere in middle. Taking bigger end each step places values in decreasing order at write cursor."
}'::jsonb),
('squares-sorted-array', 12, 'Return & Recap', '{
  "type": "array",
  "array": [0,1,9,16,100],
  "highlights": [0,1,2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "[0,1,9,16,100]"},
  "status": "Return [0,1,9,16,100]. Time O(n), Space O(n)."
}'::jsonb);


-- ── STRING TO INTEGER ATOI ────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'string-to-integer-atoi';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('string-to-integer-atoi', 1, 'Problem Setup', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "  -42abc"},
  "status": "Given s = \"  -42abc\". Implement atoi: skip leading spaces, optional sign, read digits, stop at non-digit, clamp to 32-bit int range."
}'::jsonb),
('string-to-integer-atoi', 2, 'Approach: State Machine', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "4 stages: 1) skip spaces, 2) read sign, 3) accumulate digits with overflow clamp, 4) stop. Linear pass, O(1) space."
}'::jsonb),
('string-to-integer-atoi', 3, 'Complexity', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1)."
}'::jsonb),
('string-to-integer-atoi', 4, 'Stage 1: skip spaces i=0', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [0],
  "highlightColor": "red",
  "pointers": {"i": 0},
  "hashmap": {},
  "status": "s[0] = space. Advance i."
}'::jsonb),
('string-to-integer-atoi', 5, 'Stage 1: skip i=1', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [1],
  "highlightColor": "red",
  "pointers": {"i": 1},
  "hashmap": {},
  "status": "s[1] = space. Advance i → 2."
}'::jsonb),
('string-to-integer-atoi', 6, 'Stage 2: sign at i=2', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [2],
  "highlightColor": "yellow",
  "pointers": {"i": 3, "sign": -1},
  "hashmap": {},
  "status": "s[2] = ''-''. Record sign = -1, advance i → 3."
}'::jsonb),
('string-to-integer-atoi', 7, 'Stage 3: digit 4', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [3],
  "highlightColor": "green",
  "pointers": {"i": 4, "num": 4},
  "hashmap": {},
  "status": "s[3]=''4''. num = 0*10 + 4 = 4."
}'::jsonb),
('string-to-integer-atoi', 8, 'Stage 3: digit 2', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [4],
  "highlightColor": "green",
  "pointers": {"i": 5, "num": 42},
  "hashmap": {},
  "status": "s[4]=''2''. num = 4*10 + 2 = 42."
}'::jsonb),
('string-to-integer-atoi', 9, 'Stage 3: non-digit ''a''', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [5],
  "highlightColor": "red",
  "pointers": {"i": 5, "num": 42},
  "hashmap": {},
  "status": "s[5]=''a'' is not a digit → stop accumulating."
}'::jsonb),
('string-to-integer-atoi', 10, 'Apply Sign', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [2,3,4],
  "highlightColor": "yellow",
  "pointers": {"num": -42},
  "hashmap": {},
  "status": "num = sign * num = -1 * 42 = -42."
}'::jsonb),
('string-to-integer-atoi', 11, 'Overflow Clamp', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [],
  "pointers": {"num": -42},
  "hashmap": {"INT_MIN": "-2147483648", "INT_MAX": "2147483647"},
  "status": "During accumulation, if num exceeds INT_MAX (or falls below INT_MIN with sign), clamp to the bound. -42 is safe."
}'::jsonb),
('string-to-integer-atoi', 12, 'Return & Recap', '{
  "type": "array",
  "array": [" "," ","-","4","2","a","b","c"],
  "highlights": [2,3,4],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "-42"},
  "status": "Return -42. Time O(n), Space O(1). Always verify bounds to avoid 32-bit overflow."
}'::jsonb);


-- ── VALID ANAGRAM ─────────────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-anagram';

INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-anagram', 1, 'Problem Setup', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"s": "anagram", "t": "nagaram"},
  "status": "Given s = \"anagram\", t = \"nagaram\". Return true iff t is an anagram of s (same multiset of letters)."
}'::jsonb),
('valid-anagram', 2, 'Approach: Frequency Map', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Brute force: sort both and compare → O(n log n). Better: count chars in s, decrement for chars in t; any negative or leftover means mismatch. O(n)."
}'::jsonb),
('valid-anagram', 3, 'Complexity', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {},
  "status": "Time O(n), Space O(1) for fixed alphabet (26 letters)."
}'::jsonb),
('valid-anagram', 4, 'Length Guard', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"|s|": "7", "|t|": "7"},
  "status": "Both length 7 — proceed. Different lengths ⇒ immediate false."
}'::jsonb),
('valid-anagram', 5, 'Count s: a,n,a', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [0,1,2],
  "highlightColor": "yellow",
  "pointers": {"i": 2},
  "hashmap": {"a": "2", "n": "1"},
  "status": "count[a]=2, count[n]=1 so far."
}'::jsonb),
('valid-anagram', 6, 'Count s: g,r,a,m', '{
  "type": "array",
  "array": ["a","n","a","g","r","a","m"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"a": "3", "n": "1", "g": "1", "r": "1", "m": "1"},
  "status": "Finished s. Final counts: a=3, n=1, g=1, r=1, m=1."
}'::jsonb),
('valid-anagram', 7, 't[0]=n: decrement', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [0],
  "highlightColor": "yellow",
  "pointers": {"j": 0},
  "hashmap": {"a": "3", "n": "0", "g": "1", "r": "1", "m": "1"},
  "status": "count[n] → 0. Still ≥ 0, continue."
}'::jsonb),
('valid-anagram', 8, 't[1..3]: a,g,a', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [1,2,3],
  "highlightColor": "yellow",
  "pointers": {"j": 3},
  "hashmap": {"a": "1", "n": "0", "g": "0", "r": "1", "m": "1"},
  "status": "Decrement a,g,a. All remain ≥ 0."
}'::jsonb),
('valid-anagram', 9, 't[4..6]: r,a,m', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [4,5,6],
  "highlightColor": "green",
  "pointers": {"j": 6},
  "hashmap": {"a": "0", "n": "0", "g": "0", "r": "0", "m": "0"},
  "status": "All counts drop to 0 exactly — perfect match."
}'::jsonb),
('valid-anagram', 10, 'Any Negative?', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"min": "0"},
  "status": "No count went below 0 → t never had an extra/unseen letter."
}'::jsonb),
('valid-anagram', 11, 'Counter-Example', '{
  "type": "array",
  "array": ["r","a","t"],
  "highlights": [],
  "pointers": {},
  "hashmap": {"car counts": "c=1,a=1,r=1", "after t": "c=1,a=0,r=0,t=-1"},
  "status": "If s=\"car\", t=\"rat\": decrementing ''t'' would push count[t] to -1, so return false."
}'::jsonb),
('valid-anagram', 12, 'Return & Recap', '{
  "type": "array",
  "array": ["n","a","g","a","r","a","m"],
  "highlights": [0,1,2,3,4,5,6],
  "highlightColor": "green",
  "pointers": {},
  "hashmap": {"answer": "true"},
  "status": "Return true. Time O(n), Space O(1)."
}'::jsonb);

