-- ═══════════════════════════════════════════════════════════════
-- Batch 6: DP + Greedy + Backtracking Dry Runs (29 problems)
-- Array-type renderer; 10-13 frames each
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── CLIMBING STAIRS (n=5) ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'climbing-stairs';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('climbing-stairs', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[],"pointers":{},"hashmap":{"n":"5"},"status":"Climb n=5 stairs, 1 or 2 steps at a time. Count distinct ways to reach step n."}'::jsonb),
('climbing-stairs', 2, 'Approach: Bottom-up DP', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"recurrence":"dp[i] = dp[i-1] + dp[i-2]"},"status":"To reach step i you either came from i-1 (1 step) or i-2 (2 steps). Sum their ways."}'::jsonb),
('climbing-stairs', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"time":"O(n)","space":"O(n)"},"status":"One pass filling dp[0..n]. Space can be reduced to O(1) with two rolling vars."}'::jsonb),
('climbing-stairs', 4, 'Base cases dp[0]=1, dp[1]=1', '{"type":"array","array":[1,1,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0,1],"highlightColor":"yellow","status":"One way to stand at step 0 (empty path); one way to reach step 1 (single 1-step)."}'::jsonb),
('climbing-stairs', 5, 'dp[2] = dp[1]+dp[0] = 2', '{"type":"array","array":[1,1,2,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[2],"hashmap":{"reads":"dp[1]=1, dp[0]=1"},"status":"Ways to reach step 2 = 1+1 = 2 (paths: 1+1, 2)."}'::jsonb),
('climbing-stairs', 6, 'dp[3] = dp[2]+dp[1] = 3', '{"type":"array","array":[1,1,2,3,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[3],"hashmap":{"reads":"dp[2]=2, dp[1]=1"},"status":"dp[3] = 2+1 = 3 (1+1+1, 1+2, 2+1)."}'::jsonb),
('climbing-stairs', 7, 'dp[4] = dp[3]+dp[2] = 5', '{"type":"array","array":[1,1,2,3,5,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[4],"hashmap":{"reads":"dp[3]=3, dp[2]=2"},"status":"dp[4] = 3+2 = 5."}'::jsonb),
('climbing-stairs', 8, 'dp[5] = dp[4]+dp[3] = 8', '{"type":"array","array":[1,1,2,3,5,8],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"hashmap":{"reads":"dp[4]=5, dp[3]=3"},"status":"dp[5] = 5+3 = 8."}'::jsonb),
('climbing-stairs', 9, 'Final dp table', '{"type":"array","array":[1,1,2,3,5,8],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0,1,2,3,4,5],"highlightColor":"green","status":"Notice the Fibonacci sequence 1,1,2,3,5,8 emerges naturally."}'::jsonb),
('climbing-stairs', 10, 'Extract answer', '{"type":"array","array":[1,1,2,3,5,8],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"highlightColor":"green","hashmap":{"answer":"8"},"status":"Answer = dp[n] = dp[5] = 8 distinct ways."}'::jsonb),
('climbing-stairs', 11, 'Return 8', '{"type":"array","array":[1,1,2,3,5,8],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"highlightColor":"green","hashmap":{"return":"8","time":"O(n)","space":"O(1) optimized"},"status":"Return 8. Linear time, constant space with rolling variables."}'::jsonb);

-- ─── CLIMBING STAIRS K (n=5, k=3) ──────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'climbing-stairs-k';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('climbing-stairs-k', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"n":"5","k":"3"},"status":"Generalized climbing stairs: each move is 1..k steps. Count ways to reach n."}'::jsonb),
('climbing-stairs-k', 2, 'Approach: Bottom-up DP with window', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"recurrence":"dp[i] = sum(dp[i-j] for j=1..k)"},"status":"Sum the last k entries of dp to get dp[i]."}'::jsonb),
('climbing-stairs-k', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"time":"O(n*k)","space":"O(n)"},"status":"Each cell reads up to k predecessors."}'::jsonb),
('climbing-stairs-k', 4, 'Base dp[0] = 1', '{"type":"array","array":[1,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0],"highlightColor":"yellow","status":"One empty path to step 0."}'::jsonb),
('climbing-stairs-k', 5, 'dp[1] = dp[0] = 1', '{"type":"array","array":[1,1,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[1],"hashmap":{"reads":"dp[0]"},"status":"Only one predecessor available (i-1)."}'::jsonb),
('climbing-stairs-k', 6, 'dp[2] = dp[1]+dp[0] = 2', '{"type":"array","array":[1,1,2,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[2],"hashmap":{"reads":"dp[1]+dp[0]"},"status":"Two predecessors (j=1,2 valid)."}'::jsonb),
('climbing-stairs-k', 7, 'dp[3] = dp[2]+dp[1]+dp[0] = 4', '{"type":"array","array":[1,1,2,4,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[3],"hashmap":{"reads":"dp[2]+dp[1]+dp[0]"},"status":"Full window of size k=3 now."}'::jsonb),
('climbing-stairs-k', 8, 'dp[4] = dp[3]+dp[2]+dp[1] = 7', '{"type":"array","array":[1,1,2,4,7,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[4],"hashmap":{"reads":"dp[3]+dp[2]+dp[1]"},"status":"4+2+1 = 7. Drop dp[0] out of window."}'::jsonb),
('climbing-stairs-k', 9, 'dp[5] = dp[4]+dp[3]+dp[2] = 13', '{"type":"array","array":[1,1,2,4,7,13],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"hashmap":{"reads":"7+4+2"},"status":"Slide window forward."}'::jsonb),
('climbing-stairs-k', 10, 'Final dp', '{"type":"array","array":[1,1,2,4,7,13],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0,1,2,3,4,5],"highlightColor":"green","status":"Tribonacci-style sequence."}'::jsonb),
('climbing-stairs-k', 11, 'Return dp[n] = 13', '{"type":"array","array":[1,1,2,4,7,13],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"highlightColor":"green","hashmap":{"answer":"13","time":"O(n*k)"},"status":"Return 13."}'::jsonb);

-- ─── COIN CHANGE (coins=[1,2,5], amount=6) ─────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'coin-change';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('coin-change', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"hashmap":{"coins":"[1,2,5]","amount":"6"},"status":"Min coins to make amount=6. Return -1 if impossible."}'::jsonb),
('coin-change', 2, 'Approach: Bottom-up DP', '{"type":"array","array":[0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"hashmap":{"recurrence":"dp[i] = 1 + min(dp[i-c]) for c in coins"},"status":"dp[i] = minimum coins to form amount i. Try every coin denomination."}'::jsonb),
('coin-change', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"hashmap":{"time":"O(amount*len(coins))","space":"O(amount)"},"status":"Fill amount+1 cells, each checks len(coins) options."}'::jsonb),
('coin-change', 4, 'Init: dp[0]=0, rest=INF(=99)', '{"type":"array","array":[0,99,99,99,99,99,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[0],"highlightColor":"yellow","status":"Zero coins needed for amount 0. Mark others unreachable."}'::jsonb),
('coin-change', 5, 'dp[1]: try coins — only 1 fits', '{"type":"array","array":[0,1,99,99,99,99,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[1],"hashmap":{"dp[1]":"1+dp[0]=1"},"status":"Coin 1: 1+dp[0]=1. Coins 2,5 too big."}'::jsonb),
('coin-change', 6, 'dp[2]: best via coin 2', '{"type":"array","array":[0,1,1,99,99,99,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[2],"hashmap":{"opts":"1+dp[1]=2 vs 1+dp[0]=1"},"status":"min(2,1)=1 using coin 2 directly."}'::jsonb),
('coin-change', 7, 'dp[3]: coin 1+dp[2] = 2', '{"type":"array","array":[0,1,1,2,99,99,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[3],"hashmap":{"opts":"1+dp[2]=2, 1+dp[1]=2"},"status":"dp[3] = 2 (either 1+2 or 2+1)."}'::jsonb),
('coin-change', 8, 'dp[4]: two 2s wins', '{"type":"array","array":[0,1,1,2,2,99,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[4],"hashmap":{"opts":"1+dp[3]=3, 1+dp[2]=2"},"status":"dp[4] = 2 (2+2)."}'::jsonb),
('coin-change', 9, 'dp[5] = 1 (single coin 5)', '{"type":"array","array":[0,1,1,2,2,1,99],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[5],"hashmap":{"opts":"1+dp[0]=1 via coin 5"},"status":"Coin 5 dominates."}'::jsonb),
('coin-change', 10, 'dp[6] = 1+dp[5] = 2', '{"type":"array","array":[0,1,1,2,2,1,2],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[6],"hashmap":{"opts":"1+dp[5]=2, 1+dp[4]=3, 1+dp[1]=2"},"status":"Best is 5+1 or 2+2+2, both use 2 coins."}'::jsonb),
('coin-change', 11, 'Final dp filled', '{"type":"array","array":[0,1,1,2,2,1,2],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[0,1,2,3,4,5,6],"highlightColor":"green","status":"All cells computed bottom-up."}'::jsonb),
('coin-change', 12, 'Return dp[amount] = 2', '{"type":"array","array":[0,1,1,2,2,1,2],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6"],"highlights":[6],"highlightColor":"green","hashmap":{"answer":"2"},"status":"If dp[amount] still INF return -1; else return dp[amount]=2."}'::jsonb);

-- ─── COIN CHANGE 2 (coins=[1,2,5], amount=5) ───────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'coin-change-2';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('coin-change-2', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"coins":"[1,2,5]","amount":"5"},"status":"Count the number of distinct coin combinations summing to amount."}'::jsonb),
('coin-change-2', 2, 'Approach: Unbounded knapsack', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"recurrence":"dp[i] += dp[i-c]"},"status":"Iterate coins in outer loop to avoid double counting orderings."}'::jsonb),
('coin-change-2', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"hashmap":{"time":"O(amount*coins)","space":"O(amount)"},"status":"1D dp suffices because coin order is fixed in outer loop."}'::jsonb),
('coin-change-2', 4, 'Init: dp[0]=1', '{"type":"array","array":[1,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0],"highlightColor":"yellow","status":"Empty set makes amount 0 in exactly one way."}'::jsonb),
('coin-change-2', 5, 'Coin 1: dp[i] += dp[i-1]', '{"type":"array","array":[1,1,1,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[1,2,3,4,5],"hashmap":{"coin":"1"},"status":"Only 1s: exactly one way per amount."}'::jsonb),
('coin-change-2', 6, 'Coin 2: dp[2] += dp[0]', '{"type":"array","array":[1,1,2,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[2],"hashmap":{"add":"dp[0]=1"},"status":"Add ways that use at least one 2 at amount 2."}'::jsonb),
('coin-change-2', 7, 'Coin 2: dp[3] += dp[1]', '{"type":"array","array":[1,1,2,2,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[3],"hashmap":{"add":"dp[1]=1"},"status":"dp[3] becomes 1+1 = 2."}'::jsonb),
('coin-change-2', 8, 'Coin 2: dp[4] += dp[2] = 2', '{"type":"array","array":[1,1,2,2,3,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[4],"hashmap":{"add":"dp[2]=2"},"status":"dp[4] = 1+2 = 3 (1111, 112, 22)."}'::jsonb),
('coin-change-2', 9, 'Coin 2: dp[5] += dp[3] = 2', '{"type":"array","array":[1,1,2,2,3,3],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"hashmap":{"add":"dp[3]=2"},"status":"dp[5] = 1+2 = 3 so far."}'::jsonb),
('coin-change-2', 10, 'Coin 5: dp[5] += dp[0]', '{"type":"array","array":[1,1,2,2,3,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"hashmap":{"coin":"5","add":"dp[0]=1"},"status":"Adds the combination that includes a single 5."}'::jsonb),
('coin-change-2', 11, 'Final dp', '{"type":"array","array":[1,1,2,2,3,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[0,1,2,3,4,5],"highlightColor":"green","status":"All coins processed."}'::jsonb),
('coin-change-2', 12, 'Return dp[amount] = 4', '{"type":"array","array":[1,1,2,2,3,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5"],"highlights":[5],"highlightColor":"green","hashmap":{"answer":"4"},"status":"Combos: 11111, 1112, 122, 5."}'::jsonb);

-- ─── COMBINATION SUM (candidates=[2,3,6,7], target=7) ──────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'combination-sum';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('combination-sum', 1, 'Problem Setup', '{"type":"array","array":[2,3,6,7],"labels":["c0","c1","c2","c3"],"hashmap":{"target":"7","path":"[]"},"status":"Find all unique combinations (candidates may repeat) summing to target."}'::jsonb),
('combination-sum', 2, 'Approach: Backtracking', '{"type":"array","array":[2,3,6,7],"labels":["c0","c1","c2","c3"],"hashmap":{"choice":"pick cand[i] (stay at i) or skip (i+1)"},"status":"Staying at i allows repeats; moving i+1 avoids duplicate combinations."}'::jsonb),
('combination-sum', 3, 'Complexity', '{"type":"array","array":[2,3,6,7],"labels":["c0","c1","c2","c3"],"hashmap":{"time":"O(2^t)","space":"O(t)"},"status":"Exponential in target depth; path length bounded by target/min(cand)."}'::jsonb),
('combination-sum', 4, 'Pick 2 → remain 5', '{"type":"array","array":[2,3,6,7],"highlights":[0],"highlightColor":"blue","hashmap":{"path":"[2]","remain":"5"},"status":"Choose cand[0]=2, stay at i=0 for repeats."}'::jsonb),
('combination-sum', 5, 'Pick 2 again → remain 3', '{"type":"array","array":[2,3,6,7],"highlights":[0],"highlightColor":"blue","hashmap":{"path":"[2,2]","remain":"3"},"status":"Still at i=0."}'::jsonb),
('combination-sum', 6, 'Pick 2 again → remain 1', '{"type":"array","array":[2,3,6,7],"highlights":[0],"highlightColor":"blue","hashmap":{"path":"[2,2,2]","remain":"1"},"status":"Next picks overshoot. Backtrack."}'::jsonb),
('combination-sum', 7, 'Backtrack, try i=1 (3) → remain 0', '{"type":"array","array":[2,3,6,7],"highlights":[0,1],"highlightColor":"green","hashmap":{"path":"[2,2,3]","remain":"0","found":"[2,2,3]"},"status":"Hit target! Record combination."}'::jsonb),
('combination-sum', 8, 'Backtrack fully, try 7', '{"type":"array","array":[2,3,6,7],"highlights":[3],"highlightColor":"green","hashmap":{"path":"[7]","remain":"0","found2":"[7]"},"status":"Skipping earlier branches, pick cand[3]=7 directly."}'::jsonb),
('combination-sum', 9, 'Explored all branches', '{"type":"array","array":[2,3,6,7],"hashmap":{"results":"[[2,2,3],[7]]"},"status":"All recursion branches exhausted."}'::jsonb),
('combination-sum', 10, 'Pruning: remain<0 stops', '{"type":"array","array":[2,3,6,7],"hashmap":{"note":"sort cand + early stop"},"status":"Sorting enables skipping candidates larger than remain."}'::jsonb),
('combination-sum', 11, 'Return results', '{"type":"array","array":[2,3,6,7],"highlightColor":"green","hashmap":{"answer":"[[2,2,3],[7]]"},"status":"Return list of all combinations."}'::jsonb);

-- ─── DECODE WAYS (s="226") ─────────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'decode-ways';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('decode-ways', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"s":"226"},"status":"Digits map 1->A..26->Z. Count ways to decode the string."}'::jsonb),
('decode-ways', 2, 'Approach: Bottom-up DP', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"recurrence":"dp[i] = (s[i-1] valid? dp[i-1]:0) + (s[i-2..i-1] in 10..26? dp[i-2]:0)"},"status":"Every position can consume 1 or 2 digits if they decode."}'::jsonb),
('decode-ways', 3, 'Complexity', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"time":"O(n)","space":"O(n)→O(1)"},"status":"Only last two cells needed."}'::jsonb),
('decode-ways', 4, 'Base dp[0]=1', '{"type":"array","array":[1,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"highlights":[0],"highlightColor":"yellow","status":"Empty prefix has one decoding."}'::jsonb),
('decode-ways', 5, 'dp[1]: s[0]=\"2\" valid → 1', '{"type":"array","array":[1,1,0,0],"labels":["dp0","dp1","dp2","dp3"],"highlights":[1],"hashmap":{"oneDigit":"2 ok"},"status":"dp[1] = dp[0] = 1."}'::jsonb),
('decode-ways', 6, 'dp[2]: s[1]=\"2\" ok; \"22\" ok', '{"type":"array","array":[1,1,2,0],"labels":["dp0","dp1","dp2","dp3"],"highlights":[2],"hashmap":{"oneDigit":"2 → +dp[1]=1","twoDigit":"22 → +dp[0]=1"},"status":"dp[2] = 1+1 = 2."}'::jsonb),
('decode-ways', 7, 'dp[3]: s[2]=\"6\" ok; \"26\" ok', '{"type":"array","array":[1,1,2,3],"labels":["dp0","dp1","dp2","dp3"],"highlights":[3],"hashmap":{"oneDigit":"6 → +dp[2]=2","twoDigit":"26 → +dp[1]=1"},"status":"dp[3] = 2+1 = 3."}'::jsonb),
('decode-ways', 8, 'Final dp', '{"type":"array","array":[1,1,2,3],"labels":["dp0","dp1","dp2","dp3"],"highlights":[0,1,2,3],"highlightColor":"green","status":"Decodings: BZ, VF, BBF."}'::jsonb),
('decode-ways', 9, 'Edge: leading 0', '{"type":"array","array":[1,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"note":"if s[0]==0 → 0 ways"},"status":"0 cannot start a valid decoding."}'::jsonb),
('decode-ways', 10, 'Edge: \"06\" invalid pair', '{"type":"array","array":[1,1,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"note":"two-digit must be 10..26"},"status":"Leading zero in a two-digit chunk invalidates it."}'::jsonb),
('decode-ways', 11, 'Return dp[n] = 3', '{"type":"array","array":[1,1,2,3],"labels":["dp0","dp1","dp2","dp3"],"highlights":[3],"highlightColor":"green","hashmap":{"answer":"3"},"status":"Return 3."}'::jsonb);

-- ─── EDIT DISTANCE (word1=\"horse\", word2=\"ros\") 2D flattened per row ──
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'edit-distance';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('edit-distance', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"word1":"horse","word2":"ros"},"status":"Min ops (insert/delete/replace) to transform word1 → word2."}'::jsonb),
('edit-distance', 2, 'Approach: 2D DP (rows=i, cols=j)', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"match":"dp[i-1][j-1]","else":"1+min(ins,del,rep)"},"status":"Each cell depends on left, top, diag."}'::jsonb),
('edit-distance', 3, 'Complexity', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"time":"O(m*n)","space":"O(m*n)"},"status":"Reducible to O(min(m,n))."}'::jsonb),
('edit-distance', 4, 'Row 0 base: dp[0][j] = j', '{"type":"array","array":[0,1,2,3],"labels":["j0","j1","j2","j3"],"highlights":[0,1,2,3],"highlightColor":"yellow","hashmap":{"row":"i=0"},"status":"Insert j chars to build word2 prefix from empty."}'::jsonb),
('edit-distance', 5, 'Row 1 (i=1, h): no match vs r/o/s', '{"type":"array","array":[1,1,2,3],"labels":["j0","j1","j2","j3"],"highlights":[1,2,3],"hashmap":{"row":"i=1","rule":"1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])"},"status":"dp[1]=[1,1,2,3]: replace h→r, then insert o, s."}'::jsonb),
('edit-distance', 6, 'Row 2 (i=2, o): match at j=2 (o)', '{"type":"array","array":[2,2,1,2],"labels":["j0","j1","j2","j3"],"highlights":[2],"hashmap":{"row":"i=2","match":"o==o at j=2"},"status":"dp[2][2] = dp[1][1] = 1. Neighbors elsewhere give [2,2,_,2]."}'::jsonb),
('edit-distance', 7, 'Row 3 (i=3, r): match at j=1 (r)', '{"type":"array","array":[3,2,2,2],"labels":["j0","j1","j2","j3"],"highlights":[1],"hashmap":{"row":"i=3","match":"r==r at j=1"},"status":"dp[3][1] = dp[2][0] = 2."}'::jsonb),
('edit-distance', 8, 'Row 4 (i=4, s): match at j=3 (s)', '{"type":"array","array":[4,3,3,2],"labels":["j0","j1","j2","j3"],"highlights":[3],"hashmap":{"row":"i=4","match":"s==s at j=3"},"status":"dp[4][3] = dp[3][2] = 2."}'::jsonb),
('edit-distance', 9, 'Row 5 (i=5, e): no match', '{"type":"array","array":[5,4,4,3],"labels":["j0","j1","j2","j3"],"highlights":[3],"hashmap":{"row":"i=5","reads":"dp[4][3]=2, dp[4][2]=3, dp[5][2]=4"},"status":"dp[5][3] = 1+min(2,3,4)=3."}'::jsonb),
('edit-distance', 10, 'Reconstruct ops', '{"type":"array","array":[5,4,4,3],"labels":["j0","j1","j2","j3"],"highlights":[3],"highlightColor":"green","hashmap":{"ops":"replace h→r, delete r, delete e"},"status":"Three operations."}'::jsonb),
('edit-distance', 11, 'Return dp[m][n] = 3', '{"type":"array","array":[5,4,4,3],"labels":["j0","j1","j2","j3"],"highlights":[3],"highlightColor":"green","hashmap":{"answer":"3","time":"O(m*n)"},"status":"Minimum edit distance is 3."}'::jsonb);

-- ─── HOUSE ROBBER ([2,7,9,3,1]) ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'house-robber';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('house-robber', 1, 'Problem Setup', '{"type":"array","array":[2,7,9,3,1],"labels":["h0","h1","h2","h3","h4"],"hashmap":{},"status":"Max money without robbing two adjacent houses."}'::jsonb),
('house-robber', 2, 'Approach: Linear DP', '{"type":"array","array":[2,7,9,3,1],"labels":["h0","h1","h2","h3","h4"],"hashmap":{"recurrence":"dp[i] = max(dp[i-1], dp[i-2]+nums[i])"},"status":"Either skip i or rob i (then add dp[i-2])."}'::jsonb),
('house-robber', 3, 'Complexity', '{"type":"array","array":[2,7,9,3,1],"labels":["h0","h1","h2","h3","h4"],"hashmap":{"time":"O(n)","space":"O(1) rolling"},"status":"Track prev1 and prev2 only."}'::jsonb),
('house-robber', 4, 'Init dp[0] = nums[0] = 2', '{"type":"array","array":[2,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[0],"highlightColor":"yellow","status":"Only one house → rob it."}'::jsonb),
('house-robber', 5, 'dp[1] = max(2, 7) = 7', '{"type":"array","array":[2,7,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[1],"hashmap":{"reads":"dp[0]=2, nums[1]=7"},"status":"Better to rob house 1 alone."}'::jsonb),
('house-robber', 6, 'dp[2] = max(7, 2+9) = 11', '{"type":"array","array":[2,7,11,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[2],"hashmap":{"reads":"dp[1]=7, dp[0]+nums[2]=11"},"status":"Rob 0 and 2."}'::jsonb),
('house-robber', 7, 'dp[3] = max(11, 7+3) = 11', '{"type":"array","array":[2,7,11,11,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[3],"hashmap":{"reads":"dp[2]=11, dp[1]+nums[3]=10"},"status":"Skip house 3."}'::jsonb),
('house-robber', 8, 'dp[4] = max(11, 11+1) = 12', '{"type":"array","array":[2,7,11,11,12],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[4],"hashmap":{"reads":"dp[3]=11, dp[2]+nums[4]=12"},"status":"Rob house 4 as well."}'::jsonb),
('house-robber', 9, 'Final dp', '{"type":"array","array":[2,7,11,11,12],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[0,1,2,3,4],"highlightColor":"green","status":"Sequence never decreases (monotone)."}'::jsonb),
('house-robber', 10, 'Path trace: rob 0,2,4', '{"type":"array","array":[2,7,9,3,1],"labels":["h0","h1","h2","h3","h4"],"highlights":[0,2,4],"highlightColor":"green","hashmap":{"sum":"2+9+1=12"},"status":"The robbed set realizes dp[n-1]."}'::jsonb),
('house-robber', 11, 'Return 12', '{"type":"array","array":[2,7,11,11,12],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[4],"highlightColor":"green","hashmap":{"answer":"12"},"status":"Return dp[n-1] = 12."}'::jsonb);

-- ─── HOUSE ROBBER II ([2,3,2]) circular ────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'house-robber-ii';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('house-robber-ii', 1, 'Problem Setup', '{"type":"array","array":[2,3,2],"labels":["h0","h1","h2"],"hashmap":{},"status":"Houses arranged in a circle: first and last are adjacent."}'::jsonb),
('house-robber-ii', 2, 'Approach: Split into two linear', '{"type":"array","array":[2,3,2],"labels":["h0","h1","h2"],"hashmap":{"idea":"max(rob(nums[0:n-1]), rob(nums[1:n]))"},"status":"Exclude either first or last house to break the cycle."}'::jsonb),
('house-robber-ii', 3, 'Complexity', '{"type":"array","array":[2,3,2],"labels":["h0","h1","h2"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Two passes of house-robber I."}'::jsonb),
('house-robber-ii', 4, 'Pass A: nums[0..n-2] = [2,3]', '{"type":"array","array":[2,3,0],"labels":["dp0","dp1","x"],"highlights":[0,1],"hashmap":{"exclude":"h2"},"status":"dp[0]=2, dp[1]=max(2,3)=3."}'::jsonb),
('house-robber-ii', 5, 'Pass A final = 3', '{"type":"array","array":[2,3,0],"labels":["dp0","dp1","x"],"highlights":[1],"highlightColor":"green","hashmap":{"passA":"3"},"status":"Pass A best = 3."}'::jsonb),
('house-robber-ii', 6, 'Pass B: nums[1..n-1] = [3,2]', '{"type":"array","array":[0,3,2],"labels":["x","dp0","dp1"],"highlights":[1,2],"hashmap":{"exclude":"h0"},"status":"dp[0]=3, dp[1]=max(3, 0+2)=3."}'::jsonb),
('house-robber-ii', 7, 'Pass B final = 3', '{"type":"array","array":[0,3,2],"labels":["x","dp0","dp1"],"highlights":[2],"highlightColor":"green","hashmap":{"passB":"3"},"status":"Pass B best = 3."}'::jsonb),
('house-robber-ii', 8, 'Combine: max(3,3) = 3', '{"type":"array","array":[2,3,2],"labels":["h0","h1","h2"],"highlights":[1],"highlightColor":"green","hashmap":{"answer":"3"},"status":"Take the better of the two passes."}'::jsonb),
('house-robber-ii', 9, 'Edge: n=1 → nums[0]', '{"type":"array","array":[5,0,0],"labels":["h0","","",""],"hashmap":{"case":"n<=1"},"status":"Handle single-house base case."}'::jsonb),
('house-robber-ii', 10, 'Edge: n=2 → max(a,b)', '{"type":"array","array":[5,9,0],"labels":["h0","h1",""],"hashmap":{"case":"n==2"},"status":"No circle benefit; just pick larger."}'::jsonb),
('house-robber-ii', 11, 'Return 3', '{"type":"array","array":[2,3,2],"labels":["h0","h1","h2"],"highlights":[1],"highlightColor":"green","hashmap":{"answer":"3","time":"O(n)"},"status":"Final answer 3."}'::jsonb);

-- ─── INTERLEAVING STRING (s1=\"ab\", s2=\"cd\", s3=\"acbd\") row trace ──
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'interleaving-string';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('interleaving-string', 1, 'Problem Setup', '{"type":"array","array":[0,0,0],"labels":["j0","j1","j2"],"hashmap":{"s1":"ab","s2":"cd","s3":"acbd"},"status":"Is s3 an interleaving of s1 and s2 preserving order?"}'::jsonb),
('interleaving-string', 2, 'Approach: 2D DP over (i,j)', '{"type":"array","array":[0,0,0],"labels":["j0","j1","j2"],"hashmap":{"recurrence":"dp[i][j] = (dp[i-1][j] && s1[i-1]==s3[i+j-1]) || (dp[i][j-1] && s2[j-1]==s3[i+j-1])"},"status":"Cell true if either string can extend to current s3 char."}'::jsonb),
('interleaving-string', 3, 'Complexity', '{"type":"array","array":[0,0,0],"labels":["j0","j1","j2"],"hashmap":{"time":"O(m*n)","space":"O(m*n)"},"status":"Early return false if len(s1)+len(s2) != len(s3)."}'::jsonb),
('interleaving-string', 4, 'Row 0 (i=0): fill by s2', '{"type":"array","array":[1,1,1],"labels":["j0","j1","j2"],"highlights":[0,1,2],"highlightColor":"yellow","hashmap":{"s2":"cd","s3[:j]":"c, cd"},"status":"s2 prefix matches s3 prefix → all true."}'::jsonb),
('interleaving-string', 5, 'Row 1 (i=1, s1[0]=a)', '{"type":"array","array":[0,1,0],"labels":["j0","j1","j2"],"highlights":[1],"hashmap":{"j=0":"a!=c→F","j=1":"a==s3[1]? a vs c no; but dp[0][1]&&c==c ok for s2 path? check"},"status":"dp[1][0]: need a==s3[0]=a and dp[0][0]=T → T. Wait recompute."}'::jsonb),
('interleaving-string', 6, 'Recompute row 1 correctly', '{"type":"array","array":[1,1,0],"labels":["j0","j1","j2"],"highlights":[0,1],"hashmap":{"dp[1][0]":"a==a T","dp[1][1]":"dp[0][1]&&s2[0]==s3[1]? T&c==c T","dp[1][2]":"F"},"status":"dp[1] = [T,T,F]."}'::jsonb),
('interleaving-string', 7, 'Row 2 (i=2, s1[1]=b)', '{"type":"array","array":[0,1,1],"labels":["j0","j1","j2"],"highlights":[1,2],"hashmap":{"dp[2][1]":"dp[1][1]&&b==s3[2]=b T","dp[2][2]":"dp[2][1]&&d==d T"},"status":"dp[2] = [F,T,T]."}'::jsonb),
('interleaving-string', 8, 'Visualize 2D table', '{"type":"array","array":[1,1,1,1,1,0,0,1,1],"labels":["00","01","02","10","11","12","20","21","22"],"hashmap":{"size":"3x3"},"status":"Flattened row-major dp table."}'::jsonb),
('interleaving-string', 9, 'Final cell dp[m][n]', '{"type":"array","array":[1,1,1,1,1,0,0,1,1],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[8],"highlightColor":"green","hashmap":{"dp[2][2]":"true"},"status":"Last cell indicates whole s3 is an interleaving."}'::jsonb),
('interleaving-string', 10, 'Trace path a,c,b,d', '{"type":"array","array":[1,1,1,1,1,0,0,1,1],"labels":["00","01","02","10","11","12","20","21","22"],"highlightColor":"green","hashmap":{"path":"s1[0] s2[0] s1[1] s2[1]"},"status":"a (s1), c (s2), b (s1), d (s2) = acbd ✓"}'::jsonb),
('interleaving-string', 11, 'Return true', '{"type":"array","array":[1,1,1,1,1,0,0,1,1],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[8],"highlightColor":"green","hashmap":{"answer":"true"},"status":"Interleaving exists."}'::jsonb);

-- ─── JUMP GAME II ([2,3,1,1,4]) ────────────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'jump-game-ii';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('jump-game-ii', 1, 'Problem Setup', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"hashmap":{},"status":"Minimum jumps to reach the last index."}'::jsonb),
('jump-game-ii', 2, 'Approach: Greedy BFS levels', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"hashmap":{"idea":"track currentEnd and farthest reachable"},"status":"When i reaches currentEnd, spend a jump and set currentEnd=farthest."}'::jsonb),
('jump-game-ii', 3, 'Complexity', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Single pass greedy."}'::jsonb),
('jump-game-ii', 4, 'Init', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":0},"hashmap":{"jumps":"0","currEnd":"0","farthest":"0"},"status":"Starting state before iteration."}'::jsonb),
('jump-game-ii', 5, 'i=0: farthest = max(0, 0+2) = 2', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":0},"highlights":[0],"hashmap":{"jumps":"1","currEnd":"2","farthest":"2"},"status":"Reached currEnd → take a jump, set currEnd=farthest=2."}'::jsonb),
('jump-game-ii', 6, 'i=1: farthest = max(2, 1+3) = 4', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":1},"highlights":[1],"hashmap":{"farthest":"4"},"status":"Not yet at currEnd. Just update farthest."}'::jsonb),
('jump-game-ii', 7, 'i=2: farthest still 4; reached currEnd', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":2},"highlights":[2],"hashmap":{"jumps":"2","currEnd":"4"},"status":"i==currEnd → take jump; set currEnd=4."}'::jsonb),
('jump-game-ii', 8, 'i=3: farthest stays 4', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":3},"highlights":[3],"hashmap":{"farthest":"4"},"status":"No new reach."}'::jsonb),
('jump-game-ii', 9, 'i=4: at last index, stop', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"pointers":{"i":4},"highlights":[4],"highlightColor":"green","hashmap":{"jumps":"2"},"status":"Loop ends before another jump counted."}'::jsonb),
('jump-game-ii', 10, 'Path: 0 → 1 → 4', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"highlights":[0,1,4],"highlightColor":"green","hashmap":{"jumps":"2"},"status":"Two jumps realize the minimum."}'::jsonb),
('jump-game-ii', 11, 'Return 2', '{"type":"array","array":[2,3,1,1,4],"labels":["0","1","2","3","4"],"highlights":[4],"highlightColor":"green","hashmap":{"answer":"2"},"status":"Return min jumps = 2."}'::jsonb);

-- ─── LONGEST COMMON SUBSEQ (text1=\"abcde\", text2=\"ace\") row trace ──
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-common-subseq';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-common-subseq', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"text1":"abcde","text2":"ace"},"status":"Find length of longest subsequence common to both strings."}'::jsonb),
('longest-common-subseq', 2, 'Approach: 2D DP', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"match":"dp[i-1][j-1]+1","else":"max(dp[i-1][j], dp[i][j-1])"},"status":"Classic LCS recurrence on the two-string grid."}'::jsonb),
('longest-common-subseq', 3, 'Complexity', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"hashmap":{"time":"O(m*n)","space":"O(m*n)"},"status":"Size (m+1) x (n+1)."}'::jsonb),
('longest-common-subseq', 4, 'Row 0 base (all 0)', '{"type":"array","array":[0,0,0,0],"labels":["j0","j1","j2","j3"],"highlights":[0,1,2,3],"highlightColor":"yellow","hashmap":{"row":"i=0"},"status":"Empty text1 means 0 common chars."}'::jsonb),
('longest-common-subseq', 5, 'Row 1 (a): match j=1', '{"type":"array","array":[0,1,1,1],"labels":["j0","j1","j2","j3"],"highlights":[1],"hashmap":{"match":"a==a at j=1"},"status":"dp[1][1]=1; copy rightward."}'::jsonb),
('longest-common-subseq', 6, 'Row 2 (b): no match', '{"type":"array","array":[0,1,1,1],"labels":["j0","j1","j2","j3"],"highlights":[1,2,3],"hashmap":{"row":"i=2","rule":"max(top,left)"},"status":"b matches none of a,c,e → inherit."}'::jsonb),
('longest-common-subseq', 7, 'Row 3 (c): match j=2', '{"type":"array","array":[0,1,2,2],"labels":["j0","j1","j2","j3"],"highlights":[2],"hashmap":{"match":"c==c"},"status":"dp[3][2]=dp[2][1]+1=2."}'::jsonb),
('longest-common-subseq', 8, 'Row 4 (d): no match', '{"type":"array","array":[0,1,2,2],"labels":["j0","j1","j2","j3"],"hashmap":{"row":"i=4"},"status":"Same as row 3."}'::jsonb),
('longest-common-subseq', 9, 'Row 5 (e): match j=3', '{"type":"array","array":[0,1,2,3],"labels":["j0","j1","j2","j3"],"highlights":[3],"hashmap":{"match":"e==e"},"status":"dp[5][3]=dp[4][2]+1=3."}'::jsonb),
('longest-common-subseq', 10, 'Reconstruct subseq: a,c,e', '{"type":"array","array":[0,1,2,3],"labels":["j0","j1","j2","j3"],"highlights":[1,2,3],"highlightColor":"green","hashmap":{"lcs":"ace"},"status":"Backtrack from dp[m][n] following diagonal matches."}'::jsonb),
('longest-common-subseq', 11, 'Return 3', '{"type":"array","array":[0,1,2,3],"labels":["j0","j1","j2","j3"],"highlights":[3],"highlightColor":"green","hashmap":{"answer":"3"},"status":"LCS length is 3."}'::jsonb);

-- ─── LONGEST HAPPY STRING (a=1,b=1,c=7) ────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-happy-string';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-happy-string', 1, 'Problem Setup', '{"type":"array","array":[1,1,7],"labels":["a","b","c"],"hashmap":{"rule":"no aaa, bbb, ccc"},"status":"Build longest string using at most given counts, avoiding 3 same in a row."}'::jsonb),
('longest-happy-string', 2, 'Approach: Greedy with max-heap', '{"type":"array","array":[1,1,7],"labels":["a","b","c"],"hashmap":{"idea":"pick largest count; if same as last two, pick second largest"},"status":"Heap stores (-count, letter); ties broken to avoid triples."}'::jsonb),
('longest-happy-string', 3, 'Complexity', '{"type":"array","array":[1,1,7],"labels":["a","b","c"],"hashmap":{"time":"O((a+b+c) log 3)","space":"O(1)"},"status":"Constant heap size (3)."}'::jsonb),
('longest-happy-string', 4, 'Pick c,c → \"cc\"', '{"type":"array","array":[1,1,5],"labels":["a","b","c"],"highlights":[2],"hashmap":{"result":"cc","last2":"cc"},"status":"c has largest count; append twice."}'::jsonb),
('longest-happy-string', 5, 'Would be ccc; pick a instead', '{"type":"array","array":[0,1,5],"labels":["a","b","c"],"highlights":[0],"hashmap":{"result":"cca"},"status":"Avoid triple by using second-best letter."}'::jsonb),
('longest-happy-string', 6, 'Pick c,c again → \"ccaccc?\" avoid', '{"type":"array","array":[0,1,3],"labels":["a","b","c"],"highlights":[2],"hashmap":{"result":"ccacc"},"status":"Two more c appended."}'::jsonb),
('longest-happy-string', 7, 'Pick b (avoid ccc)', '{"type":"array","array":[0,0,3],"labels":["a","b","c"],"highlights":[1],"hashmap":{"result":"ccaccb"},"status":"b breaks the streak."}'::jsonb),
('longest-happy-string', 8, 'Pick c,c → \"ccaccbcc\"', '{"type":"array","array":[0,0,1],"labels":["a","b","c"],"highlights":[2],"hashmap":{"result":"ccaccbcc"},"status":"Two c added."}'::jsonb),
('longest-happy-string', 9, 'Only c left but last2=cc', '{"type":"array","array":[0,0,1],"labels":["a","b","c"],"hashmap":{"result":"ccaccbcc","blocked":"c"},"status":"Cannot append another c; no alternative letter."}'::jsonb),
('longest-happy-string', 10, 'Terminate loop', '{"type":"array","array":[0,0,1],"labels":["a","b","c"],"hashmap":{"result":"ccaccbcc"},"status":"Heap push of c skipped when triple would form."}'::jsonb),
('longest-happy-string', 11, 'Return \"ccaccbcc\"', '{"type":"array","array":[0,0,1],"labels":["a","b","c"],"highlightColor":"green","hashmap":{"answer":"ccaccbcc","len":"8"},"status":"Length 8 string returned."}'::jsonb);

-- ─── LONGEST INCREASING SUBSEQ ([10,9,2,5,3,7,101,18]) ─────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-increasing-subseq';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-increasing-subseq', 1, 'Problem Setup', '{"type":"array","array":[10,9,2,5,3,7,101,18],"labels":["0","1","2","3","4","5","6","7"],"hashmap":{},"status":"Find length of longest strictly increasing subsequence."}'::jsonb),
('longest-increasing-subseq', 2, 'Approach: O(n^2) DP', '{"type":"array","array":[1,1,1,1,1,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"hashmap":{"recurrence":"dp[i] = 1 + max(dp[j]) for j<i, nums[j]<nums[i]"},"status":"Each element alone forms an LIS of length 1."}'::jsonb),
('longest-increasing-subseq', 3, 'Complexity', '{"type":"array","array":[1,1,1,1,1,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"hashmap":{"time":"O(n^2)","space":"O(n)"},"status":"Patience sorting gives O(n log n)."}'::jsonb),
('longest-increasing-subseq', 4, 'i=1 (9): none < 9 except... 9<10 no', '{"type":"array","array":[1,1,1,1,1,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[1],"hashmap":{"dp[1]":"1"},"status":"No smaller predecessor; stay 1."}'::jsonb),
('longest-increasing-subseq', 5, 'i=3 (5): 2<5 → dp[3]=dp[2]+1', '{"type":"array","array":[1,1,1,2,1,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[3],"hashmap":{"dp[3]":"2"},"status":"Chain 2→5."}'::jsonb),
('longest-increasing-subseq', 6, 'i=4 (3): 2<3 → dp[4]=2', '{"type":"array","array":[1,1,1,2,2,1,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[4],"hashmap":{"dp[4]":"2"},"status":"Chain 2→3."}'::jsonb),
('longest-increasing-subseq', 7, 'i=5 (7): best j=3 → dp[5]=3', '{"type":"array","array":[1,1,1,2,2,3,1,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[5],"hashmap":{"dp[5]":"3"},"status":"Chain 2→5→7 or 2→3→7."}'::jsonb),
('longest-increasing-subseq', 8, 'i=6 (101): best j=5 → dp[6]=4', '{"type":"array","array":[1,1,1,2,2,3,4,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[6],"hashmap":{"dp[6]":"4"},"status":"Chain 2→5→7→101."}'::jsonb),
('longest-increasing-subseq', 9, 'i=7 (18): best j=5 → dp[7]=4', '{"type":"array","array":[1,1,1,2,2,3,4,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[7],"hashmap":{"dp[7]":"4"},"status":"Chain 2→5→7→18."}'::jsonb),
('longest-increasing-subseq', 10, 'Final dp', '{"type":"array","array":[1,1,1,2,2,3,4,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[0,1,2,3,4,5,6,7],"highlightColor":"green","status":"Maximum element is the answer."}'::jsonb),
('longest-increasing-subseq', 11, 'Return max(dp) = 4', '{"type":"array","array":[1,1,1,2,2,3,4,4],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7"],"highlights":[6,7],"highlightColor":"green","hashmap":{"answer":"4"},"status":"LIS length = 4."}'::jsonb);

-- ─── LONGEST PALINDROMIC SUBSEQ (s=\"bbbab\") ────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'longest-palindromic-subseq';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-palindromic-subseq', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0],"labels":["b","b","b","a","b"],"hashmap":{"s":"bbbab"},"status":"Longest palindromic subsequence (not substring)."}'::jsonb),
('longest-palindromic-subseq', 2, 'Approach: 2D DP over i,j', '{"type":"array","array":[0,0,0,0,0],"labels":["b","b","b","a","b"],"hashmap":{"match":"dp[i+1][j-1]+2","else":"max(dp[i+1][j], dp[i][j-1])"},"status":"Fill by increasing substring length."}'::jsonb),
('longest-palindromic-subseq', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0],"labels":["b","b","b","a","b"],"hashmap":{"time":"O(n^2)","space":"O(n^2)"},"status":"n x n table."}'::jsonb),
('longest-palindromic-subseq', 4, 'Length 1 diagonal (dp[i][i]=1)', '{"type":"array","array":[1,1,1,1,1],"labels":["b","b","b","a","b"],"highlights":[0,1,2,3,4],"highlightColor":"yellow","status":"Each single character is a palindrome of length 1."}'::jsonb),
('longest-palindromic-subseq', 5, 'Len 2: dp[0][1]=2 (bb)', '{"type":"array","array":[2,2,2,1,2],"labels":["01","12","23","34","..."],"highlights":[0,1],"hashmap":{"bb":"2","bb":"2","ba":"1","ab":"1"},"status":"Adjacent equal chars form length-2 palindromes."}'::jsonb),
('longest-palindromic-subseq', 6, 'Len 3: dp[0][2]=3 (bbb)', '{"type":"array","array":[3,3,1,2,0],"labels":["02","13","24","..."],"highlights":[0],"hashmap":{"match":"s[0]=s[2]=b"},"status":"bbb is length 3."}'::jsonb),
('longest-palindromic-subseq', 7, 'Len 3: dp[1][3]=3 (bb match at edges)', '{"type":"array","array":[3,3,1,2,0],"labels":["02","13","24","..."],"highlights":[1],"hashmap":{"s[1]=b, s[3]=a":"no match → max"},"status":"Actually b!=a; dp[1][3] = max(dp[2][3], dp[1][2]) = max(1,2) = 2. Wait — 1 at 24? len3 at 24 is bab → s[2]=b=s[4] so dp[2][4]=dp[3][3]+2=3."}'::jsonb),
('longest-palindromic-subseq', 8, 'Len 4: dp[0][3]=3, dp[1][4]=3', '{"type":"array","array":[3,3,3,0,0],"labels":["03","14","...","",""],"highlights":[0,1],"hashmap":{"bbba":"3","bbab":"3"},"status":"Edges b,a and b,b — take best inner."}'::jsonb),
('longest-palindromic-subseq', 9, 'Len 5: dp[0][4]: s[0]=s[4]=b', '{"type":"array","array":[4,0,0,0,0],"labels":["04","","","",""],"highlights":[0],"hashmap":{"match":"b==b","reads":"dp[1][3]+2"},"status":"dp[0][4] = dp[1][3] + 2 = 2+2 = 4."}'::jsonb),
('longest-palindromic-subseq', 10, 'Answer subseq: bbbb', '{"type":"array","array":[1,1,1,0,1],"labels":["b","b","b","a","b"],"highlights":[0,1,2,4],"highlightColor":"green","hashmap":{"lps":"bbbb"},"status":"Reconstructed palindromic subsequence of length 4."}'::jsonb),
('longest-palindromic-subseq', 11, 'Return 4', '{"type":"array","array":[4,0,0,0,0],"labels":["04","","","",""],"highlights":[0],"highlightColor":"green","hashmap":{"answer":"4"},"status":"dp[0][n-1] = 4."}'::jsonb);

-- ─── MAX PRODUCT SUBARRAY ([2,3,-2,4]) ─────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-product-subarray';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-product-subarray', 1, 'Problem Setup', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"hashmap":{},"status":"Find max product of a contiguous subarray."}'::jsonb),
('max-product-subarray', 2, 'Approach: Track max & min', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"hashmap":{"idea":"negatives flip; track both extremes"},"status":"Min can become max when multiplied by negative."}'::jsonb),
('max-product-subarray', 3, 'Complexity', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Rolling two variables plus an answer."}'::jsonb),
('max-product-subarray', 4, 'i=0: maxP=2, minP=2', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[0],"highlightColor":"yellow","hashmap":{"maxP":"2","minP":"2","ans":"2"},"status":"Seed with nums[0]."}'::jsonb),
('max-product-subarray', 5, 'i=1 (3): cands 2*3=6, 2*3=6', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[1],"hashmap":{"maxP":"6","minP":"3","ans":"6"},"status":"max(3,6,6)=6, min(3,6,6)=3."}'::jsonb),
('max-product-subarray', 6, 'i=2 (-2): candidates -12, -6', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[2],"hashmap":{"maxP":"-2","minP":"-12","ans":"6"},"status":"max(-2,-12,-6)=-2; min=-12."}'::jsonb),
('max-product-subarray', 7, 'i=3 (4): candidates -8, -48', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[3],"hashmap":{"maxP":"4","minP":"-48","ans":"6"},"status":"max(4,-8,-48)=4; min=-48. ans stays 6."}'::jsonb),
('max-product-subarray', 8, 'Track over entire scan', '{"type":"array","array":[2,6,-2,4],"labels":["p0","p1","p2","p3"],"hashmap":{"bestWindow":"[2,3]"},"status":"Best subarray was [2,3] with product 6."}'::jsonb),
('max-product-subarray', 9, 'Why track minP', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"hashmap":{"case":"if next is negative, minP*neg → large max"},"status":"Insurance for future sign flips."}'::jsonb),
('max-product-subarray', 10, 'Final ans = 6', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[0,1],"highlightColor":"green","hashmap":{"answer":"6"},"status":"Max product subarray = [2,3]."}'::jsonb),
('max-product-subarray', 11, 'Return 6', '{"type":"array","array":[2,3,-2,4],"labels":["0","1","2","3"],"highlights":[0,1],"highlightColor":"green","hashmap":{"answer":"6","time":"O(n)"},"status":"Return 6."}'::jsonb);

-- ─── MAX SUBARRAY ([-2,1,-3,4,-1,2,1,-5,4]) Kadane ─────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'max-subarray';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-subarray', 1, 'Problem Setup', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"hashmap":{},"status":"Find the contiguous subarray with largest sum."}'::jsonb),
('max-subarray', 2, 'Approach: Kadane DP', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"hashmap":{"recurrence":"dp[i] = max(nums[i], dp[i-1]+nums[i])"},"status":"Either extend current subarray or start fresh at i."}'::jsonb),
('max-subarray', 3, 'Complexity', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Track rolling currentSum and best."}'::jsonb),
('max-subarray', 4, 'i=0: dp=-2, best=-2', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[0],"highlightColor":"yellow","hashmap":{"cur":"-2","best":"-2"},"status":"Seed with first element."}'::jsonb),
('max-subarray', 5, 'i=1: max(1,-2+1)=1', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[1],"hashmap":{"cur":"1","best":"1"},"status":"Start fresh, prev negative drag dropped."}'::jsonb),
('max-subarray', 6, 'i=2: max(-3,1-3)=-2', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[2],"hashmap":{"cur":"-2","best":"1"},"status":"Extend; best unchanged."}'::jsonb),
('max-subarray', 7, 'i=3: max(4,-2+4)=4', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[3],"hashmap":{"cur":"4","best":"4"},"status":"Reset — prior sum negative."}'::jsonb),
('max-subarray', 8, 'i=4..6: 3,5,6', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[3,4,5,6],"hashmap":{"cur":"6","best":"6"},"status":"Running sum 4,3,5,6."}'::jsonb),
('max-subarray', 9, 'i=7: 6-5=1', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[7],"hashmap":{"cur":"1","best":"6"},"status":"Dip but still positive; best stays."}'::jsonb),
('max-subarray', 10, 'i=8: 1+4=5', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[8],"hashmap":{"cur":"5","best":"6"},"status":"Recovers but not beyond best."}'::jsonb),
('max-subarray', 11, 'Best subarray [3..6] = [4,-1,2,1]', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlights":[3,4,5,6],"highlightColor":"green","hashmap":{"sum":"6"},"status":"Max subarray identified."}'::jsonb),
('max-subarray', 12, 'Return 6', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"labels":["0","1","2","3","4","5","6","7","8"],"highlightColor":"green","hashmap":{"answer":"6"},"status":"Return best = 6."}'::jsonb);

-- ─── MIN COST CLIMBING STAIRS ([10,15,20]) ─────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'min-cost-climbing-stairs';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('min-cost-climbing-stairs', 1, 'Problem Setup', '{"type":"array","array":[10,15,20,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"cost":"[10,15,20]"},"status":"Reach top (index n) with min cost; can start at 0 or 1."}'::jsonb),
('min-cost-climbing-stairs', 2, 'Approach: Bottom-up DP', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"recurrence":"dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])"},"status":"dp[i] = min cost to stand at index i."}'::jsonb),
('min-cost-climbing-stairs', 3, 'Complexity', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Two rolling variables suffice."}'::jsonb),
('min-cost-climbing-stairs', 4, 'Base dp[0]=dp[1]=0', '{"type":"array","array":[0,0,0,0],"labels":["dp0","dp1","dp2","dp3"],"highlights":[0,1],"highlightColor":"yellow","status":"Free to start at either step 0 or 1."}'::jsonb),
('min-cost-climbing-stairs', 5, 'dp[2] = min(0+10, 0+15) = 10', '{"type":"array","array":[0,0,10,0],"labels":["dp0","dp1","dp2","dp3"],"highlights":[2],"hashmap":{"reads":"dp[1]+cost[1]=15, dp[0]+cost[0]=10"},"status":"Jump from 0 paying 10."}'::jsonb),
('min-cost-climbing-stairs', 6, 'dp[3] = min(10+20, 0+15) = 15', '{"type":"array","array":[0,0,10,15],"labels":["dp0","dp1","dp2","dp3"],"highlights":[3],"hashmap":{"reads":"dp[2]+cost[2]=30, dp[1]+cost[1]=15"},"status":"Skip from 1 paying 15."}'::jsonb),
('min-cost-climbing-stairs', 7, 'Final dp', '{"type":"array","array":[0,0,10,15],"labels":["dp0","dp1","dp2","dp3"],"highlights":[0,1,2,3],"highlightColor":"green","status":"Top is index n=3."}'::jsonb),
('min-cost-climbing-stairs', 8, 'Path trace: start at 1, jump to top', '{"type":"array","array":[10,15,20,0],"labels":["c0","c1","c2","top"],"highlights":[1,3],"highlightColor":"green","hashmap":{"cost":"15"},"status":"Min-cost path pays only cost[1]."}'::jsonb),
('min-cost-climbing-stairs', 9, 'Alt path: 0 → 2 → top = 10+20 = 30', '{"type":"array","array":[10,15,20,0],"labels":["c0","c1","c2","top"],"highlights":[0,2,3],"hashmap":{"cost":"30"},"status":"More expensive option."}'::jsonb),
('min-cost-climbing-stairs', 10, 'Return dp[n] = 15', '{"type":"array","array":[0,0,10,15],"labels":["dp0","dp1","dp2","dp3"],"highlights":[3],"highlightColor":"green","hashmap":{"answer":"15"},"status":"Return 15."}'::jsonb);

-- ─── N-QUEENS (n=4) backtracking, track queen cols per row ─────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'n-queens';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('n-queens', 1, 'Problem Setup', '{"type":"array","array":[-1,-1,-1,-1],"labels":["r0","r1","r2","r3"],"hashmap":{"n":"4"},"status":"Place n queens so no two attack. Array stores column of queen in each row (-1 = unplaced)."}'::jsonb),
('n-queens', 2, 'Approach: Backtracking', '{"type":"array","array":[-1,-1,-1,-1],"labels":["r0","r1","r2","r3"],"hashmap":{"sets":"cols, diag1(r+c), diag2(r-c)"},"status":"Try each column in current row; track attacked cols/diagonals in sets."}'::jsonb),
('n-queens', 3, 'Complexity', '{"type":"array","array":[-1,-1,-1,-1],"labels":["r0","r1","r2","r3"],"hashmap":{"time":"O(n!)","space":"O(n)"},"status":"Branching bounded by constraints."}'::jsonb),
('n-queens', 4, 'Row 0: place col 0', '{"type":"array","array":[0,-1,-1,-1],"labels":["r0","r1","r2","r3"],"highlights":[0],"highlightColor":"blue","status":"Try col 0 in row 0."}'::jsonb),
('n-queens', 5, 'Row 1: cols 0,1 attacked → try 2', '{"type":"array","array":[0,2,-1,-1],"labels":["r0","r1","r2","r3"],"highlights":[0,1],"highlightColor":"blue","status":"Col 0 blocked (same col), col 1 blocked (diag). Place at col 2."}'::jsonb),
('n-queens', 6, 'Row 2: every col attacked → backtrack', '{"type":"array","array":[0,2,-1,-1],"labels":["r0","r1","r2","r3"],"hashmap":{"conflict":"0,1,2,3 all hit"},"status":"Dead end; unwind row 1."}'::jsonb),
('n-queens', 7, 'Retry row 1 at col 3', '{"type":"array","array":[0,3,-1,-1],"labels":["r0","r1","r2","r3"],"highlights":[0,1],"highlightColor":"blue","status":"Alternative placement in row 1."}'::jsonb),
('n-queens', 8, 'Row 2 col 1 OK, row 3 fails → backtrack again', '{"type":"array","array":[0,3,1,-1],"labels":["r0","r1","r2","r3"],"highlights":[0,1,2],"highlightColor":"blue","status":"Partial solution; row 3 finds no safe column."}'::jsonb),
('n-queens', 9, 'Backtrack to row 0, try col 1', '{"type":"array","array":[1,3,0,2],"labels":["r0","r1","r2","r3"],"highlights":[0,1,2,3],"highlightColor":"green","status":"Solution found: [1,3,0,2]."}'::jsonb),
('n-queens', 10, 'Continue search → also [2,0,3,1]', '{"type":"array","array":[2,0,3,1],"labels":["r0","r1","r2","r3"],"highlights":[0,1,2,3],"highlightColor":"green","status":"Symmetric solution."}'::jsonb),
('n-queens', 11, 'Render boards', '{"type":"array","array":[1,3,0,2],"labels":["r0","r1","r2","r3"],"hashmap":{"board":"[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"]"},"status":"Convert col indices to strings."}'::jsonb),
('n-queens', 12, 'Return solutions', '{"type":"array","array":[1,3,0,2],"labels":["r0","r1","r2","r3"],"highlightColor":"green","hashmap":{"count":"2"},"status":"Return list of 2 distinct boards."}'::jsonb);

-- ─── PARTITION EQUAL SUBSET SUM ([1,5,11,5]) ───────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'partition-equal-subset';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('partition-equal-subset', 1, 'Problem Setup', '{"type":"array","array":[1,5,11,5],"labels":["0","1","2","3"],"hashmap":{"sum":"22","target":"11"},"status":"Can array be split into two equal-sum subsets? Total/2 = 11."}'::jsonb),
('partition-equal-subset', 2, 'Approach: 0/1 knapsack boolean DP', '{"type":"array","array":[0,0,0,0,0,0,0,0,0,0,0,0],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"hashmap":{"recurrence":"dp[s] ||= dp[s-num]"},"status":"dp[s] = can we form sum s? Iterate s descending."}'::jsonb),
('partition-equal-subset', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0,0,0,0,0,0,0],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"hashmap":{"time":"O(n*target)","space":"O(target)"},"status":"Early fail if sum is odd."}'::jsonb),
('partition-equal-subset', 4, 'Init dp[0]=true', '{"type":"array","array":[1,0,0,0,0,0,0,0,0,0,0,0],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[0],"highlightColor":"yellow","status":"Empty subset forms sum 0."}'::jsonb),
('partition-equal-subset', 5, 'Process num=1', '{"type":"array","array":[1,1,0,0,0,0,0,0,0,0,0,0],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[1],"hashmap":{"new":"dp[1]"},"status":"Reachable sums: {0,1}."}'::jsonb),
('partition-equal-subset', 6, 'Process num=5', '{"type":"array","array":[1,1,0,0,0,1,1,0,0,0,0,0],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[5,6],"hashmap":{"new":"5,6"},"status":"Sums: {0,1,5,6}."}'::jsonb),
('partition-equal-subset', 7, 'Process num=11', '{"type":"array","array":[1,1,0,0,0,1,1,0,0,0,0,1],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[11],"highlightColor":"green","hashmap":{"new":"11"},"status":"dp[11] becomes true — target reached!"}'::jsonb),
('partition-equal-subset', 8, 'Early termination possible', '{"type":"array","array":[1,1,0,0,0,1,1,0,0,0,0,1],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[11],"hashmap":{"note":"exit as soon as dp[target]=true"},"status":"No need to process remaining 5."}'::jsonb),
('partition-equal-subset', 9, 'Subset example: {11}', '{"type":"array","array":[1,5,11,5],"labels":["0","1","2","3"],"highlights":[2],"highlightColor":"green","hashmap":{"other":"{1,5,5}=11"},"status":"Two partitions with sum 11 each."}'::jsonb),
('partition-equal-subset', 10, 'Return true', '{"type":"array","array":[1,1,0,0,0,1,1,0,0,0,0,1],"labels":["0","1","2","3","4","5","6","7","8","9","10","11"],"highlights":[11],"highlightColor":"green","hashmap":{"answer":"true"},"status":"Return dp[target]."}'::jsonb);

-- ─── PERMUTATIONS ([1,2,3]) backtracking ───────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'permutations';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('permutations', 1, 'Problem Setup', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"path":"[]","used":"{}"},"status":"Return all permutations of distinct integers."}'::jsonb),
('permutations', 2, 'Approach: Backtracking with used-set', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"recurse":"for each unused i, pick → recurse → unpick"},"status":"Depth = n means a complete permutation."}'::jsonb),
('permutations', 3, 'Complexity', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"time":"O(n*n!)","space":"O(n)"},"status":"n! permutations, each length n to record."}'::jsonb),
('permutations', 4, 'Pick 1 → path=[1]', '{"type":"array","array":[1,2,3],"highlights":[0],"highlightColor":"blue","hashmap":{"path":"[1]","used":"{0}"},"status":"First choice."}'::jsonb),
('permutations', 5, 'Pick 2 → [1,2]', '{"type":"array","array":[1,2,3],"highlights":[0,1],"highlightColor":"blue","hashmap":{"path":"[1,2]","used":"{0,1}"},"status":"Extend."}'::jsonb),
('permutations', 6, 'Pick 3 → [1,2,3] ✓', '{"type":"array","array":[1,2,3],"highlights":[0,1,2],"highlightColor":"green","hashmap":{"result":"[1,2,3]"},"status":"Complete permutation recorded. Backtrack."}'::jsonb),
('permutations', 7, 'Backtrack, swap order → [1,3,2]', '{"type":"array","array":[1,2,3],"highlights":[0,2,1],"highlightColor":"green","hashmap":{"result":"[1,3,2]"},"status":"Unpick 2, pick 3 first then 2."}'::jsonb),
('permutations', 8, 'Root branch 2 → [2,1,3], [2,3,1]', '{"type":"array","array":[1,2,3],"highlights":[1],"highlightColor":"blue","hashmap":{"results":"[2,1,3],[2,3,1]"},"status":"Two permutations from this branch."}'::jsonb),
('permutations', 9, 'Root branch 3 → [3,1,2], [3,2,1]', '{"type":"array","array":[1,2,3],"highlights":[2],"highlightColor":"blue","hashmap":{"results":"[3,1,2],[3,2,1]"},"status":"Final branch."}'::jsonb),
('permutations', 10, 'All 6 permutations collected', '{"type":"array","array":[1,2,3],"highlightColor":"green","hashmap":{"total":"6=3!"},"status":"3! = 6 perms."}'::jsonb),
('permutations', 11, 'Return results', '{"type":"array","array":[1,2,3],"highlightColor":"green","hashmap":{"answer":"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"},"status":"Done."}'::jsonb);

-- ─── POWER SET ITERATIVE (nums=[1,2,3]) bit-mask ──────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'power-set-iterative';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('power-set-iterative', 1, 'Problem Setup', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"n":"3","count":"2^3=8"},"status":"Generate all subsets iteratively using bitmasks."}'::jsonb),
('power-set-iterative', 2, 'Approach: Bitmask enumeration', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"idea":"mask in 0..2^n-1; bit j → include nums[j]"},"status":"Each integer 0..7 encodes a subset."}'::jsonb),
('power-set-iterative', 3, 'Complexity', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"time":"O(n*2^n)","space":"O(n*2^n)"},"status":"Output itself is exponential."}'::jsonb),
('power-set-iterative', 4, 'mask=000 → []', '{"type":"array","array":[1,2,3],"highlightColor":"blue","hashmap":{"mask":"000","subset":"[]"},"status":"No bits set."}'::jsonb),
('power-set-iterative', 5, 'mask=001 → [1]', '{"type":"array","array":[1,2,3],"highlights":[0],"highlightColor":"blue","hashmap":{"mask":"001","subset":"[1]"},"status":"Bit 0 set."}'::jsonb),
('power-set-iterative', 6, 'mask=010 → [2]', '{"type":"array","array":[1,2,3],"highlights":[1],"highlightColor":"blue","hashmap":{"mask":"010","subset":"[2]"},"status":"Bit 1 set."}'::jsonb),
('power-set-iterative', 7, 'mask=011 → [1,2]', '{"type":"array","array":[1,2,3],"highlights":[0,1],"highlightColor":"blue","hashmap":{"mask":"011","subset":"[1,2]"},"status":"Bits 0,1 set."}'::jsonb),
('power-set-iterative', 8, 'mask=100 → [3]', '{"type":"array","array":[1,2,3],"highlights":[2],"highlightColor":"blue","hashmap":{"mask":"100","subset":"[3]"},"status":"Bit 2 set."}'::jsonb),
('power-set-iterative', 9, 'mask=101 → [1,3]', '{"type":"array","array":[1,2,3],"highlights":[0,2],"highlightColor":"blue","hashmap":{"mask":"101","subset":"[1,3]"},"status":""}'::jsonb),
('power-set-iterative', 10, 'mask=110 → [2,3]', '{"type":"array","array":[1,2,3],"highlights":[1,2],"highlightColor":"blue","hashmap":{"mask":"110","subset":"[2,3]"},"status":""}'::jsonb),
('power-set-iterative', 11, 'mask=111 → [1,2,3]', '{"type":"array","array":[1,2,3],"highlights":[0,1,2],"highlightColor":"green","hashmap":{"mask":"111","subset":"[1,2,3]"},"status":"All bits set."}'::jsonb),
('power-set-iterative', 12, 'Return 8 subsets', '{"type":"array","array":[1,2,3],"highlightColor":"green","hashmap":{"count":"8"},"status":"Power set complete."}'::jsonb);

-- ─── ROTATE ARRAY ([1,2,3,4,5,6,7], k=3) three reversals ───────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'rotate-array';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rotate-array', 1, 'Problem Setup', '{"type":"array","array":[1,2,3,4,5,6,7],"labels":["0","1","2","3","4","5","6"],"hashmap":{"k":"3"},"status":"Rotate array right by k steps in-place."}'::jsonb),
('rotate-array', 2, 'Approach: Three reversals', '{"type":"array","array":[1,2,3,4,5,6,7],"labels":["0","1","2","3","4","5","6"],"hashmap":{"steps":"reverse all; reverse [0..k-1]; reverse [k..n-1]"},"status":"O(1) space trick."}'::jsonb),
('rotate-array', 3, 'Complexity', '{"type":"array","array":[1,2,3,4,5,6,7],"labels":["0","1","2","3","4","5","6"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Normalize k = k % n first."}'::jsonb),
('rotate-array', 4, 'Normalize k %= n', '{"type":"array","array":[1,2,3,4,5,6,7],"labels":["0","1","2","3","4","5","6"],"hashmap":{"k":"3","n":"7"},"status":"k already < n."}'::jsonb),
('rotate-array', 5, 'Reverse entire array', '{"type":"array","array":[7,6,5,4,3,2,1],"labels":["0","1","2","3","4","5","6"],"highlights":[0,1,2,3,4,5,6],"highlightColor":"yellow","status":"After full reverse."}'::jsonb),
('rotate-array', 6, 'Reverse first k=3 elements', '{"type":"array","array":[5,6,7,4,3,2,1],"labels":["0","1","2","3","4","5","6"],"highlights":[0,1,2],"highlightColor":"blue","status":"Subarray [0..2] reversed."}'::jsonb),
('rotate-array', 7, 'Reverse remaining [3..6]', '{"type":"array","array":[5,6,7,1,2,3,4],"labels":["0","1","2","3","4","5","6"],"highlights":[3,4,5,6],"highlightColor":"blue","status":"Suffix reversed."}'::jsonb),
('rotate-array', 8, 'Verify rotation', '{"type":"array","array":[5,6,7,1,2,3,4],"labels":["0","1","2","3","4","5","6"],"highlights":[0,1,2,3,4,5,6],"highlightColor":"green","hashmap":{"expected":"[5,6,7,1,2,3,4]"},"status":"Matches rotate-right-by-3."}'::jsonb),
('rotate-array', 9, 'Why three reversals work', '{"type":"array","array":[5,6,7,1,2,3,4],"labels":["0","1","2","3","4","5","6"],"hashmap":{"identity":"(A|B)^R = B^R|A^R; reverse each"},"status":"Algebraic identity of reversal."}'::jsonb),
('rotate-array', 10, 'Edge: k > n', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"k":"5 → 2"},"status":"Use modulo to avoid wasted rotations."}'::jsonb),
('rotate-array', 11, 'Return (in-place modifies)', '{"type":"array","array":[5,6,7,1,2,3,4],"labels":["0","1","2","3","4","5","6"],"highlightColor":"green","hashmap":{"time":"O(n)"},"status":"Array rotated in place."}'::jsonb);

-- ─── ROTATE IMAGE (flatten 3x3 matrix) ─────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'rotate-image';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rotate-image', 1, 'Problem Setup', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"labels":["00","01","02","10","11","12","20","21","22"],"hashmap":{"n":"3"},"status":"Rotate nxn matrix 90° clockwise in-place."}'::jsonb),
('rotate-image', 2, 'Approach: Transpose + reverse rows', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"labels":["00","01","02","10","11","12","20","21","22"],"hashmap":{"steps":"transpose across main diag; reverse each row"},"status":"Equivalent to 90° clockwise."}'::jsonb),
('rotate-image', 3, 'Complexity', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"labels":["00","01","02","10","11","12","20","21","22"],"hashmap":{"time":"O(n^2)","space":"O(1)"},"status":"Touch every cell once."}'::jsonb),
('rotate-image', 4, 'Transpose swap (0,1)↔(1,0)', '{"type":"array","array":[1,4,3,2,5,6,7,8,9],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[1,3],"highlightColor":"blue","status":"Swap M[0][1] with M[1][0]."}'::jsonb),
('rotate-image', 5, 'Transpose swap (0,2)↔(2,0)', '{"type":"array","array":[1,4,7,2,5,6,3,8,9],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[2,6],"highlightColor":"blue","status":"Swap M[0][2] with M[2][0]."}'::jsonb),
('rotate-image', 6, 'Transpose swap (1,2)↔(2,1)', '{"type":"array","array":[1,4,7,2,5,8,3,6,9],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[5,7],"highlightColor":"blue","status":"Transpose complete."}'::jsonb),
('rotate-image', 7, 'Reverse row 0', '{"type":"array","array":[7,4,1,2,5,8,3,6,9],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[0,1,2],"highlightColor":"yellow","status":"Row 0: [1,4,7]→[7,4,1]."}'::jsonb),
('rotate-image', 8, 'Reverse row 1', '{"type":"array","array":[7,4,1,8,5,2,3,6,9],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[3,4,5],"highlightColor":"yellow","status":"Row 1: [2,5,8]→[8,5,2]."}'::jsonb),
('rotate-image', 9, 'Reverse row 2', '{"type":"array","array":[7,4,1,8,5,2,9,6,3],"labels":["00","01","02","10","11","12","20","21","22"],"highlights":[6,7,8],"highlightColor":"yellow","status":"Row 2: [3,6,9]→[9,6,3]."}'::jsonb),
('rotate-image', 10, 'Final matrix (verify)', '{"type":"array","array":[7,4,1,8,5,2,9,6,3],"labels":["00","01","02","10","11","12","20","21","22"],"highlightColor":"green","hashmap":{"expected":"[[7,4,1],[8,5,2],[9,6,3]]"},"status":"Matches 90° CW rotation."}'::jsonb),
('rotate-image', 11, 'Return (in-place)', '{"type":"array","array":[7,4,1,8,5,2,9,6,3],"labels":["00","01","02","10","11","12","20","21","22"],"highlightColor":"green","hashmap":{"time":"O(n^2)"},"status":"Done."}'::jsonb);

-- ─── SUBSETS (nums=[1,2,3]) backtracking ───────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'subsets';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('subsets', 1, 'Problem Setup', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"count":"2^n=8"},"status":"Generate all subsets."}'::jsonb),
('subsets', 2, 'Approach: DFS include/exclude', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"branch":"at index i: include or skip"},"status":"Each recursion saves current path as a subset."}'::jsonb),
('subsets', 3, 'Complexity', '{"type":"array","array":[1,2,3],"labels":["0","1","2"],"hashmap":{"time":"O(n*2^n)","space":"O(n)"},"status":"Output-bounded."}'::jsonb),
('subsets', 4, 'Start: path=[], save []', '{"type":"array","array":[1,2,3],"highlightColor":"blue","hashmap":{"path":"[]","result":"[[]]"},"status":"Record empty subset first."}'::jsonb),
('subsets', 5, 'Include 1 → [1]', '{"type":"array","array":[1,2,3],"highlights":[0],"highlightColor":"blue","hashmap":{"path":"[1]"},"status":"Recurse deeper."}'::jsonb),
('subsets', 6, 'Include 2 → [1,2]', '{"type":"array","array":[1,2,3],"highlights":[0,1],"highlightColor":"blue","hashmap":{"path":"[1,2]"},"status":""}'::jsonb),
('subsets', 7, 'Include 3 → [1,2,3]', '{"type":"array","array":[1,2,3],"highlights":[0,1,2],"highlightColor":"green","hashmap":{"path":"[1,2,3]"},"status":"Leaf; backtrack."}'::jsonb),
('subsets', 8, 'Backtrack: [1,3]', '{"type":"array","array":[1,2,3],"highlights":[0,2],"highlightColor":"green","hashmap":{"path":"[1,3]"},"status":"Skipped 2, picked 3."}'::jsonb),
('subsets', 9, 'Branch 2 (skip 1): [2],[2,3]', '{"type":"array","array":[1,2,3],"highlights":[1],"highlightColor":"green","hashmap":{"results":"[2],[2,3]"},"status":"Exclude first element."}'::jsonb),
('subsets', 10, 'Branch 3: [3]', '{"type":"array","array":[1,2,3],"highlights":[2],"highlightColor":"green","hashmap":{"result":"[3]"},"status":"Single element subset."}'::jsonb),
('subsets', 11, 'All 8 collected', '{"type":"array","array":[1,2,3],"highlightColor":"green","hashmap":{"count":"8"},"status":"[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]."}'::jsonb),
('subsets', 12, 'Return result', '{"type":"array","array":[1,2,3],"highlightColor":"green","hashmap":{"answer":"8 subsets"},"status":"Done."}'::jsonb);

-- ─── TARGET SUM (nums=[1,1,1,1,1], target=3) ───────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'target-sum';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('target-sum', 1, 'Problem Setup', '{"type":"array","array":[1,1,1,1,1],"labels":["0","1","2","3","4"],"hashmap":{"target":"3","total":"5"},"status":"Assign + or - to each number to hit target sum."}'::jsonb),
('target-sum', 2, 'Approach: Reformulate to subset-sum', '{"type":"array","array":[1,1,1,1,1],"labels":["0","1","2","3","4"],"hashmap":{"P-N":"target","P+N":"total","P":"(total+target)/2=4"},"status":"Count subsets P summing to 4."}'::jsonb),
('target-sum', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"hashmap":{"time":"O(n*S)","space":"O(S)"},"status":"1D knapsack."}'::jsonb),
('target-sum', 4, 'Init dp[0]=1', '{"type":"array","array":[1,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[0],"highlightColor":"yellow","status":"One subset sums to 0 — the empty set."}'::jsonb),
('target-sum', 5, 'After num=1(1st)', '{"type":"array","array":[1,1,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[1],"hashmap":{"rule":"dp[s] += dp[s-num] desc"},"status":"dp[1] = dp[0] = 1."}'::jsonb),
('target-sum', 6, 'After num=1(2nd)', '{"type":"array","array":[1,2,1,0,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[1,2],"status":"dp[2]=dp[1]=1, dp[1]=dp[0]+dp[1]=2."}'::jsonb),
('target-sum', 7, 'After num=1(3rd)', '{"type":"array","array":[1,3,3,1,0],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[1,2,3],"status":"Pascal''s triangle row forming."}'::jsonb),
('target-sum', 8, 'After num=1(4th)', '{"type":"array","array":[1,4,6,4,1],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[1,2,3,4],"status":"Row C(4,k)."}'::jsonb),
('target-sum', 9, 'After num=1(5th)', '{"type":"array","array":[1,5,10,10,5],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[4],"highlightColor":"green","status":"Row C(5,k); dp[4]=C(5,4)=5."}'::jsonb),
('target-sum', 10, 'Edge: (total+target) odd or < 0', '{"type":"array","array":[1,5,10,10,5],"labels":["dp0","dp1","dp2","dp3","dp4"],"hashmap":{"case":"return 0"},"status":"Parity/feasibility guards."}'::jsonb),
('target-sum', 11, 'Return dp[P] = 5', '{"type":"array","array":[1,5,10,10,5],"labels":["dp0","dp1","dp2","dp3","dp4"],"highlights":[4],"highlightColor":"green","hashmap":{"answer":"5"},"status":"5 sign assignments hit target 3."}'::jsonb);

-- ─── UNIQUE PATHS (m=3, n=3) row traces ────────────────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'unique-paths';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('unique-paths', 1, 'Problem Setup', '{"type":"array","array":[0,0,0],"labels":["c0","c1","c2"],"hashmap":{"m":"3","n":"3"},"status":"Count unique paths from top-left to bottom-right moving only right or down."}'::jsonb),
('unique-paths', 2, 'Approach: 1D rolling DP', '{"type":"array","array":[0,0,0],"labels":["c0","c1","c2"],"hashmap":{"recurrence":"dp[j] += dp[j-1]"},"status":"Current row[j] = old row[j] (from above) + row[j-1] (from left)."}'::jsonb),
('unique-paths', 3, 'Complexity', '{"type":"array","array":[0,0,0],"labels":["c0","c1","c2"],"hashmap":{"time":"O(m*n)","space":"O(n)"},"status":"Single row rolls through."}'::jsonb),
('unique-paths', 4, 'Row 0: all 1s (base)', '{"type":"array","array":[1,1,1],"labels":["c0","c1","c2"],"highlights":[0,1,2],"highlightColor":"yellow","hashmap":{"row":"0"},"status":"Only one way along top edge (all rights)."}'::jsonb),
('unique-paths', 5, 'Row 1 j=0: stays 1', '{"type":"array","array":[1,1,1],"labels":["c0","c1","c2"],"highlights":[0],"hashmap":{"row":"1","j":"0"},"status":"Leftmost column also one path (all downs)."}'::jsonb),
('unique-paths', 6, 'Row 1 j=1: dp[1] += dp[0] = 2', '{"type":"array","array":[1,2,1],"labels":["c0","c1","c2"],"highlights":[1],"hashmap":{"reads":"top=1, left=1"},"status":"Two paths reach (1,1)."}'::jsonb),
('unique-paths', 7, 'Row 1 j=2: dp[2] += dp[1] = 3', '{"type":"array","array":[1,2,3],"labels":["c0","c1","c2"],"highlights":[2],"hashmap":{"reads":"top=1, left=2"},"status":"Three paths to (1,2)."}'::jsonb),
('unique-paths', 8, 'Row 2 j=0: stays 1', '{"type":"array","array":[1,2,3],"labels":["c0","c1","c2"],"highlights":[0],"hashmap":{"row":"2"},"status":"First column unchanged."}'::jsonb),
('unique-paths', 9, 'Row 2 j=1: dp[1] += dp[0] = 3', '{"type":"array","array":[1,3,3],"labels":["c0","c1","c2"],"highlights":[1],"hashmap":{"reads":"top=2, left=1"},"status":""}'::jsonb),
('unique-paths', 10, 'Row 2 j=2: dp[2] += dp[1] = 6', '{"type":"array","array":[1,3,6],"labels":["c0","c1","c2"],"highlights":[2],"highlightColor":"green","hashmap":{"reads":"top=3, left=3"},"status":"Answer cell filled."}'::jsonb),
('unique-paths', 11, 'Combinatorial check', '{"type":"array","array":[1,3,6],"labels":["c0","c1","c2"],"hashmap":{"formula":"C(m+n-2, m-1) = C(4,2) = 6"},"status":"Matches binomial coefficient."}'::jsonb),
('unique-paths', 12, 'Return 6', '{"type":"array","array":[1,3,6],"labels":["c0","c1","c2"],"highlights":[2],"highlightColor":"green","hashmap":{"answer":"6"},"status":"Final dp[n-1]."}'::jsonb);

-- ─── VALID PARENTHESIS STRING (s=\"(*))\") greedy ───────────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'valid-parenthesis-string';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('valid-parenthesis-string', 1, 'Problem Setup', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"hashmap":{"s":"(*))"},"status":"* may be (, ) or empty. Check if some choice makes s balanced."}'::jsonb),
('valid-parenthesis-string', 2, 'Approach: Greedy min/max open count', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"hashmap":{"lo":"min open","hi":"max open"},"status":"lo never negative; if hi<0 invalid; at end lo==0 → valid."}'::jsonb),
('valid-parenthesis-string', 3, 'Complexity', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"hashmap":{"time":"O(n)","space":"O(1)"},"status":"Single pass."}'::jsonb),
('valid-parenthesis-string', 4, 'Init lo=hi=0', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"pointers":{"i":0},"hashmap":{"lo":"0","hi":"0"},"status":"Before reading any char."}'::jsonb),
('valid-parenthesis-string', 5, 'i=0 \"(\": lo=1, hi=1', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"pointers":{"i":0},"highlights":[0],"hashmap":{"lo":"1","hi":"1"},"status":"Open paren increments both."}'::jsonb),
('valid-parenthesis-string', 6, 'i=1 \"*\": lo-1→0, hi+1→2', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"pointers":{"i":1},"highlights":[1],"hashmap":{"lo":"0","hi":"2"},"status":"Star: min drops, max rises, clamp lo at 0."}'::jsonb),
('valid-parenthesis-string', 7, 'i=2 \")\": lo→0, hi→1', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"pointers":{"i":2},"highlights":[2],"hashmap":{"lo":"0","hi":"1"},"status":"Close paren decrements both; lo clamped at 0."}'::jsonb),
('valid-parenthesis-string', 8, 'i=3 \")\": lo→0, hi→0', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"pointers":{"i":3},"highlights":[3],"hashmap":{"lo":"0","hi":"0"},"status":"hi still ≥ 0 so sequence remains salvageable."}'::jsonb),
('valid-parenthesis-string', 9, 'Check: hi never went negative', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"hashmap":{"maxHi":"2","minHi":"0"},"status":"No hard failure detected."}'::jsonb),
('valid-parenthesis-string', 10, 'Final lo = 0 → valid', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"highlightColor":"green","hashmap":{"lo":"0"},"status":"Assign *=( makes \"(())\", balanced."}'::jsonb),
('valid-parenthesis-string', 11, 'Return true', '{"type":"array","array":[40,42,41,41],"labels":["(","*",")",")"],"highlightColor":"green","hashmap":{"answer":"true"},"status":"Valid assignment exists."}'::jsonb);

-- ─── WORD BREAK (s=\"leetcode\", dict=[\"leet\",\"code\"]) ─────────
DELETE FROM "PGcode_interactive_dry_runs" WHERE problem_id = 'word-break';
INSERT INTO "PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('word-break', 1, 'Problem Setup', '{"type":"array","array":[0,0,0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"hashmap":{"s":"leetcode","dict":"[leet,code]"},"status":"Can s be segmented into dictionary words?"}'::jsonb),
('word-break', 2, 'Approach: Bottom-up DP', '{"type":"array","array":[0,0,0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"hashmap":{"recurrence":"dp[i] = any dp[j] && s[j:i] in dict"},"status":"dp[i] = true if s[0:i] is breakable."}'::jsonb),
('word-break', 3, 'Complexity', '{"type":"array","array":[0,0,0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"hashmap":{"time":"O(n^2*L)","space":"O(n)"},"status":"L = max word length."}'::jsonb),
('word-break', 4, 'Init dp[0]=true', '{"type":"array","array":[1,0,0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlights":[0],"highlightColor":"yellow","status":"Empty prefix trivially breakable."}'::jsonb),
('word-break', 5, 'i=1..3: no match', '{"type":"array","array":[1,0,0,0,0,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"hashmap":{"tried":"l, le, lee"},"status":"No dict word of those prefixes."}'::jsonb),
('word-break', 6, 'i=4: s[0:4]=\"leet\" in dict, dp[0]=T', '{"type":"array","array":[1,0,0,0,1,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlights":[4],"hashmap":{"word":"leet"},"status":"dp[4]=true."}'::jsonb),
('word-break', 7, 'i=5..7: no completion yet', '{"type":"array","array":[1,0,0,0,1,0,0,0,0],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"hashmap":{"tried":"c, co, cod"},"status":"dp[5..7] stay false."}'::jsonb),
('word-break', 8, 'i=8: s[4:8]=\"code\" in dict, dp[4]=T', '{"type":"array","array":[1,0,0,0,1,0,0,0,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlights":[8],"highlightColor":"green","hashmap":{"j":"4","word":"code"},"status":"dp[8]=true — s is segmentable."}'::jsonb),
('word-break', 9, 'Final dp', '{"type":"array","array":[1,0,0,0,1,0,0,0,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlights":[0,4,8],"highlightColor":"green","status":"Cut points at 0, 4, 8."}'::jsonb),
('word-break', 10, 'Segmentation: leet | code', '{"type":"array","array":[1,0,0,0,1,0,0,0,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlightColor":"green","hashmap":{"split":"leet | code"},"status":"Both pieces are in dict."}'::jsonb),
('word-break', 11, 'Return true', '{"type":"array","array":[1,0,0,0,1,0,0,0,1],"labels":["dp0","dp1","dp2","dp3","dp4","dp5","dp6","dp7","dp8"],"highlights":[8],"highlightColor":"green","hashmap":{"answer":"true"},"status":"Return dp[n]=true."}'::jsonb);

COMMIT;
