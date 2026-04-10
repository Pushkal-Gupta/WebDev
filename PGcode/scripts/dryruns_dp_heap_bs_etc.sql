-- Dry runs: dp(5) + 2d-dp(3) + heap(4) + intervals(3) + greedy(3) + binary-search(4) + strings(1)
BEGIN;

DELETE FROM public."PGcode_interactive_dry_runs" WHERE problem_id IN (
  'climbing-stairs','house-robber','coin-change','longest-increasing-subseq','unique-paths',
  'longest-common-subseq','edit-distance','target-sum',
  'kth-largest-element','last-stone-weight','k-closest-points','task-scheduler',
  'insert-interval','merge-intervals','non-overlapping-intervals',
  'max-subarray','jump-game','gas-station',
  'search-rotated','find-min-rotated','koko-bananas','search-2d-matrix',
  'longest-palindromic-substring'
);

-- ================ DP ================

-- climbing-stairs n=5
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('climbing-stairs', 1, 'Base cases', '{"type":"array","array":[1,2,0,0,0],"highlights":[0,1],"hashmap":{"n":"5"},"status":"ways(1)=1, ways(2)=2."}'::jsonb),
('climbing-stairs', 2, 'ways(3) = 1 + 2 = 3', '{"type":"array","array":[1,2,3,0,0],"highlights":[2],"status":"dp[3] = dp[2] + dp[1] = 3."}'::jsonb),
('climbing-stairs', 3, 'ways(4) = 2 + 3 = 5', '{"type":"array","array":[1,2,3,5,0],"highlights":[3],"status":"dp[4] = dp[3] + dp[2] = 5."}'::jsonb),
('climbing-stairs', 4, 'ways(5) = 3 + 5 = 8', '{"type":"array","array":[1,2,3,5,8],"highlights":[4],"status":"dp[5] = dp[4] + dp[3] = 8. Answer: 8."}'::jsonb);

-- house-robber [2,7,9,3,1]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('house-robber', 1, 'Initial state', '{"type":"array","array":[2,7,9,3,1],"highlights":[0],"hashmap":{"prev1":"0","prev2":"0"},"status":"At house 0. Rob it: prev1 = max(0, 0+2) = 2."}'::jsonb),
('house-robber', 2, 'House 1 (7)', '{"type":"array","array":[2,7,9,3,1],"highlights":[1],"hashmap":{"prev1":"7","prev2":"2"},"status":"max(prev1=2, prev2=0+7) = 7."}'::jsonb),
('house-robber', 3, 'House 2 (9)', '{"type":"array","array":[2,7,9,3,1],"highlights":[2],"hashmap":{"prev1":"11","prev2":"7"},"status":"max(7, 2+9) = 11."}'::jsonb),
('house-robber', 4, 'House 3 (3)', '{"type":"array","array":[2,7,9,3,1],"highlights":[3],"hashmap":{"prev1":"11","prev2":"11"},"status":"max(11, 7+3) = 11."}'::jsonb),
('house-robber', 5, 'House 4 (1)', '{"type":"array","array":[2,7,9,3,1],"highlights":[4],"hashmap":{"prev1":"12","prev2":"11"},"status":"max(11, 11+1) = 12. Answer: 12."}'::jsonb);

-- coin-change coins=[1,2,5], amount=11
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('coin-change', 1, 'Initialize dp array', '{"type":"array","array":[0,12,12,12,12,12,12,12,12,12,12,12],"highlights":[0],"hashmap":{"coins":"[1,2,5]","amount":"11"},"status":"dp[0]=0. All others = infinity (sentinel 12)."}'::jsonb),
('coin-change', 2, 'dp[1] = 1 (use coin 1)', '{"type":"array","array":[0,1,12,12,12,12,12,12,12,12,12,12],"highlights":[1],"status":"dp[1] = dp[0] + 1 = 1."}'::jsonb),
('coin-change', 3, 'dp[2] = 1 (use coin 2)', '{"type":"array","array":[0,1,1,12,12,12,12,12,12,12,12,12],"highlights":[2],"status":"dp[2] = min(dp[1]+1, dp[0]+1) = 1."}'::jsonb),
('coin-change', 4, 'dp[5] = 1 (use coin 5)', '{"type":"array","array":[0,1,1,2,2,1,12,12,12,12,12,12],"highlights":[5],"status":"dp[5] = min(dp[4]+1, dp[3]+1, dp[0]+1) = 1."}'::jsonb),
('coin-change', 5, 'dp[10] = 2 (5+5)', '{"type":"array","array":[0,1,1,2,2,1,2,2,3,3,2,12],"highlights":[10],"status":"dp[10] = dp[5] + 1 = 2."}'::jsonb),
('coin-change', 6, 'dp[11] = 3 (5+5+1)', '{"type":"array","array":[0,1,1,2,2,1,2,2,3,3,2,3],"highlights":[11],"status":"dp[11] = min(dp[10]+1, dp[9]+1, dp[6]+1) = 3. Answer: 3."}'::jsonb);

-- longest-increasing-subseq [10,9,2,5,3,7,101,18]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-increasing-subseq', 1, 'Start', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[0],"hashmap":{"dp":"[1,1,1,1,1,1,1,1]"},"status":"Every element starts as its own LIS of length 1."}'::jsonb),
('longest-increasing-subseq', 2, 'i=3 (5): check j<3', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[2,3],"hashmap":{"dp[3]":"2"},"status":"nums[2]=2 < 5, dp[3] = dp[2]+1 = 2."}'::jsonb),
('longest-increasing-subseq', 3, 'i=5 (7): best from 3 or 5', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[3,5],"hashmap":{"dp[5]":"3"},"status":"dp[5] = dp[3]+1 = 3 (chain 2->5->7)."}'::jsonb),
('longest-increasing-subseq', 4, 'i=6 (101): largest chain', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[5,6],"hashmap":{"dp[6]":"4"},"status":"dp[6] = dp[5]+1 = 4 (2->5->7->101)."}'::jsonb),
('longest-increasing-subseq', 5, 'i=7 (18)', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[5,7],"hashmap":{"dp[7]":"4"},"status":"dp[7] = dp[5]+1 = 4 (2->5->7->18)."}'::jsonb),
('longest-increasing-subseq', 6, 'Answer = max(dp) = 4', '{"type":"array","array":[10,9,2,5,3,7,101,18],"highlights":[2,3,5,6],"hashmap":{"answer":"4"},"status":"Longest strictly increasing subsequence has length 4."}'::jsonb);

-- unique-paths m=3, n=3
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('unique-paths', 1, 'Row 0: all 1s', '{"type":"array","array":[1,1,1],"highlights":[0,1,2],"hashmap":{"m":"3","n":"3","row":"0"},"status":"First row can only be reached one way (all rights)."}'::jsonb),
('unique-paths', 2, 'Row 1: dp[j] += dp[j-1]', '{"type":"array","array":[1,2,3],"highlights":[1,2],"hashmap":{"row":"1"},"status":"dp[1]=1+1=2, dp[2]=1+2=3."}'::jsonb),
('unique-paths', 3, 'Row 2', '{"type":"array","array":[1,3,6],"highlights":[1,2],"hashmap":{"row":"2","answer":"6"},"status":"dp[1]=1+2=3, dp[2]=3+3=6. Answer: 6 unique paths."}'::jsonb);

-- ================ 2D-DP ================

-- longest-common-subseq text1="abcde", text2="ace"
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-common-subseq', 1, 'Initialize 6x4 DP table', '{"type":"array","array":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"hashmap":{"text1":"abcde","text2":"ace","size":"6x4"},"status":"dp[0][*]=0, dp[*][0]=0. Row/col 0 are base cases."}'::jsonb),
('longest-common-subseq', 2, 'a matches a: dp[1][1]=1', '{"type":"array","array":[0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"highlights":[5],"hashmap":{"match":"a==a"},"status":"dp[1][1] = dp[0][0] + 1 = 1."}'::jsonb),
('longest-common-subseq', 3, 'Row 2 (b): no match', '{"type":"array","array":[0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],"hashmap":{},"status":"b != a,c,e: copy max of left/top."}'::jsonb),
('longest-common-subseq', 4, 'Row 3 (c): match at c', '{"type":"array","array":[0,0,0,0,0,1,1,1,0,1,1,1,0,1,2,2,0,0,0,0,0,0,0,0],"highlights":[14],"hashmap":{"match":"c==c"},"status":"dp[3][2] = dp[2][1] + 1 = 2."}'::jsonb),
('longest-common-subseq', 5, 'Row 5 (e): match at e', '{"type":"array","array":[0,0,0,0,0,1,1,1,0,1,1,1,0,1,2,2,0,1,2,2,0,1,2,3],"highlights":[23],"hashmap":{"answer":"3"},"status":"dp[5][3] = dp[4][2] + 1 = 3. LCS length = 3 (\"ace\")."}'::jsonb);

-- edit-distance word1="horse", word2="ros"
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('edit-distance', 1, 'Initialize base cases', '{"type":"array","array":[0,1,2,3,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0],"hashmap":{"word1":"horse","word2":"ros"},"status":"dp[i][0]=i, dp[0][j]=j."}'::jsonb),
('edit-distance', 2, 'h vs r: replace', '{"type":"array","array":[0,1,2,3,1,1,2,3,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0],"highlights":[5,6,7],"status":"No match. dp[1][j] = 1 + min of neighbors."}'::jsonb),
('edit-distance', 3, 'o vs o: match', '{"type":"array","array":[0,1,2,3,1,1,2,3,2,2,1,2,3,0,0,0,4,0,0,0,5,0,0,0],"highlights":[10],"hashmap":{"match":"o==o"},"status":"dp[2][2] = dp[1][1] = 1."}'::jsonb),
('edit-distance', 4, 'r vs r match, s vs s match', '{"type":"array","array":[0,1,2,3,1,1,2,3,2,2,1,2,3,2,2,2,4,3,3,3,5,4,4,3],"hashmap":{"answer":"3"},"status":"dp[5][3] = 3. Three operations: replace h->r, delete r, delete e."}'::jsonb);

-- target-sum nums=[1,1,1,1,1], target=3
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('target-sum', 1, 'Reformulate', '{"type":"array","array":[1,1,1,1,1],"hashmap":{"total":"5","target":"3","subset":"4"},"status":"sum(P) = (target + total)/2 = 4. Count subsets summing to 4."}'::jsonb),
('target-sum', 2, 'dp[0] = 1', '{"type":"array","array":[1,0,0,0,0],"highlights":[0],"hashmap":{"dp":"dp[s] = ways to hit s"},"status":"Empty subset sums to 0: one way."}'::jsonb),
('target-sum', 3, 'After num=1 (first): dp[1] = 1', '{"type":"array","array":[1,1,0,0,0],"highlights":[1],"status":"One way to reach sum 1."}'::jsonb),
('target-sum', 4, 'After num=1 (second): dp[2] = 1', '{"type":"array","array":[1,2,1,0,0],"status":"dp[1] now 2, dp[2] = 1."}'::jsonb),
('target-sum', 5, 'After 5 nums processed', '{"type":"array","array":[1,5,10,10,5],"highlights":[4],"hashmap":{"answer":"5"},"status":"dp[4] = 5 ways. Answer: 5."}'::jsonb);

-- ================ HEAP ================

-- kth-largest-element [3,2,1,5,6,4] k=2
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('kth-largest-element', 1, 'Empty min-heap', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[0],"hashmap":{"heap":"[]","k":"2"},"status":"Scan left to right, keep heap size <= k."}'::jsonb),
('kth-largest-element', 2, 'Push 3', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[0],"hashmap":{"heap":"[3]"},"status":""}'::jsonb),
('kth-largest-element', 3, 'Push 2, size > k, pop min', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[1],"hashmap":{"heap":"[3]","note":"popped 2"},"status":"Heap now holds the top-2 seen."}'::jsonb),
('kth-largest-element', 4, 'Push 1, pop min', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[2],"hashmap":{"heap":"[3]","note":"popped 1"},"status":""}'::jsonb),
('kth-largest-element', 5, 'Push 5', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[3],"hashmap":{"heap":"[3,5]"},"status":"Heap size equals k."}'::jsonb),
('kth-largest-element', 6, 'Push 6, pop 3', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[4],"hashmap":{"heap":"[5,6]","popped":"3"},"status":""}'::jsonb),
('kth-largest-element', 7, 'Push 4, pop 4', '{"type":"array","array":[3,2,1,5,6,4],"highlights":[5],"hashmap":{"heap":"[5,6]","popped":"4"},"status":"4 < 5 (heap min), discarded."}'::jsonb),
('kth-largest-element', 8, 'Answer = heap top = 5', '{"type":"array","array":[3,2,1,5,6,4],"hashmap":{"heap":"[5,6]","answer":"5"},"status":"The 2nd largest is 5."}'::jsonb);

-- last-stone-weight [2,7,4,1,8,1]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('last-stone-weight', 1, 'Initial max-heap', '{"type":"array","array":[2,7,4,1,8,1],"hashmap":{"heap":"[8,7,4,2,1,1]"},"status":"Heapify all stones into a max-heap."}'::jsonb),
('last-stone-weight', 2, 'Pop 8 and 7, push 1', '{"type":"array","array":[],"hashmap":{"heap":"[4,2,1,1,1]","diff":"1"},"status":"8 vs 7 -> 1. Push 1 back."}'::jsonb),
('last-stone-weight', 3, 'Pop 4 and 2, push 2', '{"type":"array","array":[],"hashmap":{"heap":"[2,1,1,1]","diff":"2"},"status":"4 vs 2 -> 2. Push 2."}'::jsonb),
('last-stone-weight', 4, 'Pop 2 and 1, push 1', '{"type":"array","array":[],"hashmap":{"heap":"[1,1,1]","diff":"1"},"status":""}'::jsonb),
('last-stone-weight', 5, 'Pop 1 and 1, equal — destroy both', '{"type":"array","array":[],"hashmap":{"heap":"[1]"},"status":"Equal stones destroy each other."}'::jsonb),
('last-stone-weight', 6, 'One stone remains', '{"type":"array","array":[],"hashmap":{"answer":"1"},"status":"Return 1."}'::jsonb);

-- k-closest-points points=[[1,3],[-2,2],[5,-1],[-2,4]], k=2
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('k-closest-points', 1, 'Compute squared distances', '{"type":"array","array":[10,8,26,20],"hashmap":{"points":"[[1,3],[-2,2],[5,-1],[-2,4]]","k":"2"},"status":"Distances: 10, 8, 26, 20."}'::jsonb),
('k-closest-points', 2, 'Push (10, [1,3])', '{"type":"array","array":[10,8,26,20],"highlights":[0],"hashmap":{"heap(max)":"[10]"},"status":"Heap key is negative distance (max-heap of k smallest)."}'::jsonb),
('k-closest-points', 3, 'Push (8, [-2,2])', '{"type":"array","array":[10,8,26,20],"highlights":[1],"hashmap":{"heap":"[10,8]"},"status":"Heap full."}'::jsonb),
('k-closest-points', 4, 'Push 26, pop 26', '{"type":"array","array":[10,8,26,20],"highlights":[2],"hashmap":{"heap":"[10,8]","discarded":"26"},"status":"26 > heap max 10, but we want k closest — pop the farthest (still 26 itself)."}'::jsonb),
('k-closest-points', 5, 'Push 20, pop 20', '{"type":"array","array":[10,8,26,20],"highlights":[3],"hashmap":{"heap":"[10,8]","discarded":"20"},"status":""}'::jsonb),
('k-closest-points', 6, 'Extract answer', '{"type":"array","array":[10,8,26,20],"hashmap":{"answer":"[[-2,2],[1,3]]"},"status":"Return the two closest points."}'::jsonb);

-- task-scheduler tasks=["A","A","A","B","B","B"], n=2
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('task-scheduler', 1, 'Count frequencies', '{"type":"array","array":[],"hashmap":{"A":"3","B":"3","n":"2"},"status":"Max frequency = 3. Count of tasks with max = 2."}'::jsonb),
('task-scheduler', 2, 'Apply formula', '{"type":"array","array":[],"hashmap":{"formula":"(3-1)*(2+1)+2 = 8","tasks.length":"6"},"status":"(max_freq - 1) * (n + 1) + count_max = 8."}'::jsonb),
('task-scheduler', 3, 'Result = max(formula, n_tasks)', '{"type":"array","array":[],"hashmap":{"answer":"8"},"status":"max(8, 6) = 8. Schedule: A B _ A B _ A B."}'::jsonb);

-- ================ INTERVALS ================

-- insert-interval intervals=[[1,3],[6,9]], new=[2,5]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('insert-interval', 1, 'Phase 1: push intervals ending before new', '{"type":"array","array":[1,3,6,9],"hashmap":{"new":"[2,5]","result":"[]"},"status":"[1,3] ends at 3 but 3 >= new.start=2, so overlap. Skip phase 1."}'::jsonb),
('insert-interval', 2, 'Phase 2: merge [1,3] with [2,5] -> [1,5]', '{"type":"array","array":[1,3,6,9],"highlights":[0,1],"hashmap":{"new":"[1,5]"},"status":"Expand newInterval to min/max."}'::jsonb),
('insert-interval', 3, '[6,9] starts after 5', '{"type":"array","array":[1,3,6,9],"highlights":[2,3],"hashmap":{"result":"[[1,5]]"},"status":"6 > 5. Push newInterval, then [6,9]."}'::jsonb),
('insert-interval', 4, 'Final result', '{"type":"array","array":[1,3,6,9],"hashmap":{"result":"[[1,5],[6,9]]"},"status":"Answer: [[1,5],[6,9]]."}'::jsonb);

-- merge-intervals [[1,3],[2,6],[8,10],[15,18]]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('merge-intervals', 1, 'Sort by start', '{"type":"array","array":[1,3,2,6,8,10,15,18],"hashmap":{"merged":"[]"},"status":"Already sorted: [[1,3],[2,6],[8,10],[15,18]]."}'::jsonb),
('merge-intervals', 2, 'Push [1,3]', '{"type":"array","array":[1,3,2,6,8,10,15,18],"highlights":[0,1],"hashmap":{"merged":"[[1,3]]"},"status":""}'::jsonb),
('merge-intervals', 3, '[2,6] overlaps [1,3]: extend to [1,6]', '{"type":"array","array":[1,3,2,6,8,10,15,18],"highlights":[2,3],"hashmap":{"merged":"[[1,6]]"},"status":"2 <= 3, extend end to max(3, 6) = 6."}'::jsonb),
('merge-intervals', 4, '[8,10] no overlap: push', '{"type":"array","array":[1,3,2,6,8,10,15,18],"highlights":[4,5],"hashmap":{"merged":"[[1,6],[8,10]]"},"status":"8 > 6, new entry."}'::jsonb),
('merge-intervals', 5, '[15,18] no overlap: push', '{"type":"array","array":[1,3,2,6,8,10,15,18],"highlights":[6,7],"hashmap":{"answer":"[[1,6],[8,10],[15,18]]"},"status":""}'::jsonb);

-- non-overlapping-intervals [[1,2],[2,3],[3,4],[1,3]]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('non-overlapping-intervals', 1, 'Sort by end time', '{"type":"array","array":[1,2,2,3,1,3,3,4],"hashmap":{"after_sort":"[[1,2],[2,3],[1,3],[3,4]]"},"status":"Sort by end."}'::jsonb),
('non-overlapping-intervals', 2, 'Keep [1,2], end=2', '{"type":"array","array":[1,2,2,3,1,3,3,4],"highlights":[0,1],"hashmap":{"kept":"1","end":"2"},"status":""}'::jsonb),
('non-overlapping-intervals', 3, 'Keep [2,3], end=3', '{"type":"array","array":[1,2,2,3,1,3,3,4],"highlights":[2,3],"hashmap":{"kept":"2","end":"3"},"status":"2 >= 2."}'::jsonb),
('non-overlapping-intervals', 4, 'Discard [1,3] (start 1 < end 3)', '{"type":"array","array":[1,2,2,3,1,3,3,4],"highlights":[4,5],"hashmap":{"kept":"2"},"status":"Overlap — remove."}'::jsonb),
('non-overlapping-intervals', 5, 'Keep [3,4]', '{"type":"array","array":[1,2,2,3,1,3,3,4],"highlights":[6,7],"hashmap":{"kept":"3","answer":"1"},"status":"Total - kept = 4 - 3 = 1."}'::jsonb);

-- ================ GREEDY ================

-- max-subarray [-2,1,-3,4,-1,2,1,-5,4]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('max-subarray', 1, 'Start: current=-2, best=-2', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[0],"hashmap":{"current":"-2","best":"-2"},"status":""}'::jsonb),
('max-subarray', 2, 'i=1: max(1, -2+1) = 1', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[1],"hashmap":{"current":"1","best":"1"},"status":"Restart the subarray at 1."}'::jsonb),
('max-subarray', 3, 'i=3: restart at 4', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[3],"hashmap":{"current":"4","best":"4"},"status":""}'::jsonb),
('max-subarray', 4, 'i=5: 3+2 = 5', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[5],"hashmap":{"current":"5","best":"5"},"status":""}'::jsonb),
('max-subarray', 5, 'i=6: 5+1 = 6', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[6],"hashmap":{"current":"6","best":"6"},"status":""}'::jsonb),
('max-subarray', 6, 'Answer = 6', '{"type":"array","array":[-2,1,-3,4,-1,2,1,-5,4],"highlights":[3,4,5,6],"hashmap":{"answer":"6"},"status":"Best subarray: [4,-1,2,1]."}'::jsonb);

-- jump-game [2,3,1,1,4]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('jump-game', 1, 'farthest = 0', '{"type":"array","array":[2,3,1,1,4],"highlights":[0],"hashmap":{"farthest":"0"},"status":"At i=0, farthest = max(0, 0+2) = 2."}'::jsonb),
('jump-game', 2, 'i=1 within reach', '{"type":"array","array":[2,3,1,1,4],"highlights":[1],"hashmap":{"farthest":"4"},"status":"1 <= 2. farthest = max(2, 1+3) = 4."}'::jsonb),
('jump-game', 3, 'i=2', '{"type":"array","array":[2,3,1,1,4],"highlights":[2],"hashmap":{"farthest":"4"},"status":"2 <= 4. farthest = max(4, 3) = 4."}'::jsonb),
('jump-game', 4, 'i=4', '{"type":"array","array":[2,3,1,1,4],"highlights":[4],"hashmap":{"farthest":"8"},"status":"Reachable. Return true."}'::jsonb);

-- gas-station gas=[1,2,3,4,5], cost=[3,4,5,1,2]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('gas-station', 1, 'Check feasibility', '{"type":"array","array":[1,2,3,4,5],"hashmap":{"sum(gas)":"15","sum(cost)":"15","feasible":"true"},"status":"Total gas == total cost. Solution exists."}'::jsonb),
('gas-station', 2, 'i=0: tank = 1-3 = -2', '{"type":"array","array":[1,2,3,4,5],"highlights":[0],"hashmap":{"tank":"-2","start":"1"},"status":"Negative. Reset: start = 1."}'::jsonb),
('gas-station', 3, 'i=1: tank = 2-4 = -2', '{"type":"array","array":[1,2,3,4,5],"highlights":[1],"hashmap":{"tank":"-2","start":"2"},"status":"Reset start = 2."}'::jsonb),
('gas-station', 4, 'i=2: tank = 3-5 = -2', '{"type":"array","array":[1,2,3,4,5],"highlights":[2],"hashmap":{"tank":"-2","start":"3"},"status":"Reset start = 3."}'::jsonb),
('gas-station', 5, 'i=3,4: tank stays >= 0', '{"type":"array","array":[1,2,3,4,5],"highlights":[3,4],"hashmap":{"tank":"6","start":"3"},"status":"Walk without resets."}'::jsonb),
('gas-station', 6, 'Answer = 3', '{"type":"array","array":[1,2,3,4,5],"highlights":[3],"hashmap":{"answer":"3"},"status":"Return start = 3."}'::jsonb);

-- ================ BINARY-SEARCH ================

-- search-rotated [4,5,6,7,0,1,2] target=0
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('search-rotated', 1, 'lo=0, hi=6', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[0,3,6],"hashmap":{"lo":"0","mid":"3","hi":"6","target":"0"},"status":"mid=7. Left half [4..7] is sorted."}'::jsonb),
('search-rotated', 2, 'target not in left half', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4,6],"hashmap":{"lo":"4","hi":"6"},"status":"0 not in [4,7]. Recurse right."}'::jsonb),
('search-rotated', 3, 'lo=4, hi=6, mid=5', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4,5,6],"hashmap":{"mid":"5","value":"1"},"status":"nums[5]=1, target=0. Left half [0,1] sorted."}'::jsonb),
('search-rotated', 4, '0 in [0,1]: recurse left', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"hashmap":{"lo":"4","hi":"4"},"status":""}'::jsonb),
('search-rotated', 5, 'Found at index 4', '{"type":"array","array":[4,5,6,7,0,1,2],"highlights":[4],"hashmap":{"answer":"4"},"status":"nums[4] = 0. Return 4."}'::jsonb);

-- find-min-rotated [3,4,5,1,2]
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('find-min-rotated', 1, 'lo=0, hi=4', '{"type":"array","array":[3,4,5,1,2],"highlights":[0,2,4],"hashmap":{"lo":"0","mid":"2","hi":"4"},"status":"nums[2]=5 > nums[4]=2. Min is to the right."}'::jsonb),
('find-min-rotated', 2, 'lo = 3', '{"type":"array","array":[3,4,5,1,2],"highlights":[3,4],"hashmap":{"lo":"3","hi":"4","mid":"3"},"status":"nums[3]=1 <= nums[4]=2. Recurse left."}'::jsonb),
('find-min-rotated', 3, 'hi = 3, converged', '{"type":"array","array":[3,4,5,1,2],"highlights":[3],"hashmap":{"lo":"3","hi":"3","answer":"1"},"status":"Return nums[3] = 1."}'::jsonb);

-- koko-bananas piles=[3,6,7,11], h=8
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('koko-bananas', 1, 'lo=1, hi=11', '{"type":"array","array":[3,6,7,11],"hashmap":{"lo":"1","hi":"11","h":"8"},"status":"Binary search on k in [1, 11]."}'::jsonb),
('koko-bananas', 2, 'k=6: hours = 1+1+2+2 = 6', '{"type":"array","array":[3,6,7,11],"hashmap":{"k":"6","hours":"6"},"status":"6 <= 8: too slow is fine. hi = 6."}'::jsonb),
('koko-bananas', 3, 'k=3: hours = 1+2+3+4 = 10', '{"type":"array","array":[3,6,7,11],"hashmap":{"k":"3","hours":"10"},"status":"10 > 8. lo = 4."}'::jsonb),
('koko-bananas', 4, 'k=5: hours = 1+2+2+3 = 8', '{"type":"array","array":[3,6,7,11],"hashmap":{"k":"5","hours":"8"},"status":"8 <= 8. hi = 5."}'::jsonb),
('koko-bananas', 5, 'k=4: hours = 1+2+2+3 = 8', '{"type":"array","array":[3,6,7,11],"hashmap":{"k":"4","hours":"8"},"status":"8 <= 8. hi = 4. lo == hi."}'::jsonb),
('koko-bananas', 6, 'Answer = 4', '{"type":"array","array":[3,6,7,11],"hashmap":{"answer":"4"},"status":"Minimum feasible eating speed."}'::jsonb);

-- search-2d-matrix [[1,3,5,7],[10,11,16,20],[23,30,34,60]] target=3
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('search-2d-matrix', 1, 'Treat as flat array of 12', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"hashmap":{"lo":"0","hi":"11","target":"3"},"status":""}'::jsonb),
('search-2d-matrix', 2, 'mid=5, value=11', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[5],"hashmap":{"mid":"5"},"status":"11 > 3. hi = 4."}'::jsonb),
('search-2d-matrix', 3, 'mid=2, value=5', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[2],"hashmap":{"mid":"2"},"status":"5 > 3. hi = 1."}'::jsonb),
('search-2d-matrix', 4, 'mid=0, value=1', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[0],"hashmap":{"mid":"0"},"status":"1 < 3. lo = 1."}'::jsonb),
('search-2d-matrix', 5, 'mid=1, value=3 — match', '{"type":"array","array":[1,3,5,7,10,11,16,20,23,30,34,60],"highlights":[1],"hashmap":{"answer":"true"},"status":"Found target 3."}'::jsonb);

-- ================ STRINGS (1) ================

-- longest-palindromic-substring "babad"
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('longest-palindromic-substring', 1, 'Start', '{"type":"array","array":["b","a","b","a","d"],"highlights":[0],"hashmap":{"best":"(0,0)"},"status":"Expand around each center. Track longest palindrome."}'::jsonb),
('longest-palindromic-substring', 2, 'Center i=0: single b', '{"type":"array","array":["b","a","b","a","d"],"highlights":[0],"hashmap":{"best":"(0,1)","candidate":"b"},"status":"Single-char palindrome."}'::jsonb),
('longest-palindromic-substring', 3, 'Center i=1: expand (1,1)', '{"type":"array","array":["b","a","b","a","d"],"highlights":[0,1,2],"hashmap":{"best":"(0,3)","candidate":"bab"},"status":"s[0]=b == s[2]=b. Length 3."}'::jsonb),
('longest-palindromic-substring', 4, 'Center i=2: expand (2,2)', '{"type":"array","array":["b","a","b","a","d"],"highlights":[1,2,3],"hashmap":{"best":"(1,3)","candidate":"aba"},"status":"Length 3, same as before — keep first."}'::jsonb),
('longest-palindromic-substring', 5, 'Try even centers', '{"type":"array","array":["b","a","b","a","d"],"highlights":[0,1],"hashmap":{"ba":"no match"},"status":"b != a, no even palindrome here."}'::jsonb),
('longest-palindromic-substring', 6, 'Answer = \"bab\"', '{"type":"array","array":["b","a","b","a","d"],"highlights":[0,1,2],"hashmap":{"answer":"bab"},"status":"Longest palindromic substring."}'::jsonb);

COMMIT;

SELECT COUNT(DISTINCT problem_id) AS problems_with_dryruns FROM public."PGcode_interactive_dry_runs";
