-- Final dry runs: 27 remaining problems
BEGIN;

DELETE FROM public."PGcode_interactive_dry_runs" WHERE problem_id IN (
  'alien-dictionary','network-delay','swim-in-water','cheapest-flights',
  'subsets','combination-sum','permutations','word-search',
  'single-number','number-of-1-bits','counting-bits','reverse-bits',
  'clone-graph','num-islands','course-schedule','rotting-oranges','pacific-atlantic',
  'happy-number','rotate-image','set-matrix-zeroes','spiral-matrix',
  'implement-trie','design-add-search','word-search-ii',
  'word-break','hand-of-straights','meeting-rooms','level-order-traversal'
);

-- ============== DP remainder ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('word-break', 1, 'Initialize dp', '{"type":"array","array":["l","e","e","t","c","o","d","e"],"hashmap":{"dict":"leet, code","dp":"[T,F,F,F,F,F,F,F,F]"},"status":"dp[0] = True (empty prefix)."}'::jsonb),
('word-break', 2, 'i=4: check prefixes', '{"type":"array","array":["l","e","e","t","c","o","d","e"],"highlights":[0,1,2,3],"hashmap":{"s[0:4]":"leet","dp[4]":"True"},"status":"dp[0]=True and \"leet\" in dict. dp[4] = True."}'::jsonb),
('word-break', 3, 'i=8: check prefixes', '{"type":"array","array":["l","e","e","t","c","o","d","e"],"highlights":[4,5,6,7],"hashmap":{"s[4:8]":"code","dp[8]":"True"},"status":"dp[4]=True and \"code\" in dict. dp[8] = True."}'::jsonb),
('word-break', 4, 'Answer = dp[n] = True', '{"type":"array","array":["l","e","e","t","c","o","d","e"],"hashmap":{"answer":"true"},"status":""}'::jsonb);

-- ============== Tree remainder ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('level-order-traversal', 1, 'Push root into queue', '{"type":"tree","nodes":[{"id":"a","value":3,"state":"current"},{"id":"b","value":9,"state":"unvisited"},{"id":"c","value":20,"state":"unvisited"},{"id":"d","value":15,"state":"unvisited"},{"id":"e","value":7,"state":"unvisited"}],"edges":[{"parent":"a","child":"b","side":"left"},{"parent":"a","child":"c","side":"right"},{"parent":"c","child":"d","side":"left"},{"parent":"c","child":"e","side":"right"}],"hashmap":{"queue":"[3]","result":"[]"},"status":"BFS from root."}'::jsonb),
('level-order-traversal', 2, 'Level 0: [3]', '{"type":"tree","nodes":[{"id":"a","value":3,"state":"visited"},{"id":"b","value":9,"state":"unvisited"},{"id":"c","value":20,"state":"unvisited"},{"id":"d","value":15,"state":"unvisited"},{"id":"e","value":7,"state":"unvisited"}],"edges":[{"parent":"a","child":"b","side":"left"},{"parent":"a","child":"c","side":"right"},{"parent":"c","child":"d","side":"left"},{"parent":"c","child":"e","side":"right"}],"hashmap":{"queue":"[9,20]","result":"[[3]]"},"status":"Pop 3. Push its children 9 and 20."}'::jsonb),
('level-order-traversal', 3, 'Level 1: [9, 20]', '{"type":"tree","nodes":[{"id":"a","value":3,"state":"visited"},{"id":"b","value":9,"state":"visited"},{"id":"c","value":20,"state":"visited"},{"id":"d","value":15,"state":"unvisited"},{"id":"e","value":7,"state":"unvisited"}],"edges":[{"parent":"a","child":"b","side":"left"},{"parent":"a","child":"c","side":"right"},{"parent":"c","child":"d","side":"left"},{"parent":"c","child":"e","side":"right"}],"hashmap":{"queue":"[15,7]","result":"[[3],[9,20]]"},"status":"Pop 9 (no children). Pop 20, push 15 and 7."}'::jsonb),
('level-order-traversal', 4, 'Level 2: [15, 7]', '{"type":"tree","nodes":[{"id":"a","value":3,"state":"visited"},{"id":"b","value":9,"state":"visited"},{"id":"c","value":20,"state":"visited"},{"id":"d","value":15,"state":"visited"},{"id":"e","value":7,"state":"visited"}],"edges":[{"parent":"a","child":"b","side":"left"},{"parent":"a","child":"c","side":"right"},{"parent":"c","child":"d","side":"left"},{"parent":"c","child":"e","side":"right"}],"hashmap":{"result":"[[3],[9,20],[15,7]]"},"status":"Leaves. Queue empty. Done."}'::jsonb);

-- ============== GREEDY remainder ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('hand-of-straights', 1, 'hand=[1,2,3,6,2,3,4,7,8], size=3', '{"type":"array","array":[1,2,3,6,2,3,4,7,8],"hashmap":{"count":"{1:1,2:2,3:2,4:1,6:1,7:1,8:1}"},"status":"Count frequencies."}'::jsonb),
('hand-of-straights', 2, 'Smallest = 1: consume 1,2,3', '{"type":"array","array":[1,2,3,6,2,3,4,7,8],"highlights":[0,1,2],"hashmap":{"count":"{2:1,3:1,4:1,6:1,7:1,8:1}"},"status":"First run of 3 formed."}'::jsonb),
('hand-of-straights', 3, 'Smallest = 2: consume 2,3,4', '{"type":"array","array":[1,2,3,6,2,3,4,7,8],"highlights":[4,5,6],"hashmap":{"count":"{6:1,7:1,8:1}"},"status":"Second run of 3 formed."}'::jsonb),
('hand-of-straights', 4, 'Smallest = 6: consume 6,7,8', '{"type":"array","array":[1,2,3,6,2,3,4,7,8],"highlights":[3,7,8],"hashmap":{"count":"{}"},"status":"Third run of 3 formed."}'::jsonb),
('hand-of-straights', 5, 'All consumed. Return true', '{"type":"array","array":[1,2,3,6,2,3,4,7,8],"hashmap":{"answer":"true"},"status":""}'::jsonb);

-- ============== INTERVALS remainder ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('meeting-rooms', 1, 'Sort by start', '{"type":"array","array":[0,30,5,10,15,20],"hashmap":{"intervals":"[[0,30],[5,10],[15,20]]"},"status":"Already sorted."}'::jsonb),
('meeting-rooms', 2, 'Compare [0,30] with [5,10]', '{"type":"array","array":[0,30,5,10,15,20],"highlights":[0,1,2,3],"hashmap":{"check":"5 < 30"},"status":"Second meeting starts at 5 but first ends at 30. Conflict!"}'::jsonb),
('meeting-rooms', 3, 'Return false', '{"type":"array","array":[0,30,5,10,15,20],"hashmap":{"answer":"false"},"status":"Cannot attend all meetings."}'::jsonb);

-- ============== BIT-MANIPULATION ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('single-number', 1, 'XOR fold', '{"type":"array","array":[4,1,2,1,2],"highlights":[0],"hashmap":{"result":"0"},"status":""}'::jsonb),
('single-number', 2, 'result ^= 4 = 4', '{"type":"array","array":[4,1,2,1,2],"highlights":[0],"hashmap":{"result":"4"},"status":""}'::jsonb),
('single-number', 3, 'result ^= 1 = 5', '{"type":"array","array":[4,1,2,1,2],"highlights":[1],"hashmap":{"result":"5"},"status":""}'::jsonb),
('single-number', 4, 'result ^= 2 = 7', '{"type":"array","array":[4,1,2,1,2],"highlights":[2],"hashmap":{"result":"7"},"status":""}'::jsonb),
('single-number', 5, 'result ^= 1 = 6', '{"type":"array","array":[4,1,2,1,2],"highlights":[3],"hashmap":{"result":"6"},"status":"1 cancels."}'::jsonb),
('single-number', 6, 'result ^= 2 = 4', '{"type":"array","array":[4,1,2,1,2],"highlights":[4],"hashmap":{"result":"4","answer":"4"},"status":"2 cancels. Unique value is 4."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('number-of-1-bits', 1, 'n = 11 (binary 1011)', '{"type":"array","array":[1,0,1,1],"hashmap":{"count":"0"},"status":""}'::jsonb),
('number-of-1-bits', 2, 'n & (n-1) clears lowest bit', '{"type":"array","array":[1,0,1,0],"hashmap":{"count":"1"},"status":"1011 & 1010 = 1010."}'::jsonb),
('number-of-1-bits', 3, 'Again', '{"type":"array","array":[1,0,0,0],"hashmap":{"count":"2"},"status":"1010 & 1001 = 1000."}'::jsonb),
('number-of-1-bits', 4, 'Again', '{"type":"array","array":[0,0,0,0],"hashmap":{"count":"3"},"status":"1000 & 0111 = 0000."}'::jsonb),
('number-of-1-bits', 5, 'n = 0, stop', '{"type":"array","array":[0,0,0,0],"hashmap":{"answer":"3"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('counting-bits', 1, 'bits[0] = 0', '{"type":"array","array":[0,0,0,0,0,0],"highlights":[0],"hashmap":{"n":"5"},"status":""}'::jsonb),
('counting-bits', 2, 'bits[1] = bits[0] + 1 = 1', '{"type":"array","array":[0,1,0,0,0,0],"highlights":[1],"hashmap":{"1 & 0":"0"},"status":""}'::jsonb),
('counting-bits', 3, 'bits[2] = bits[0] + 1 = 1', '{"type":"array","array":[0,1,1,0,0,0],"highlights":[2],"hashmap":{"2 & 1":"0"},"status":""}'::jsonb),
('counting-bits', 4, 'bits[3] = bits[2] + 1 = 2', '{"type":"array","array":[0,1,1,2,0,0],"highlights":[3],"hashmap":{"3 & 2":"2"},"status":""}'::jsonb),
('counting-bits', 5, 'bits[4] = bits[0] + 1 = 1', '{"type":"array","array":[0,1,1,2,1,0],"highlights":[4],"hashmap":{"4 & 3":"0"},"status":""}'::jsonb),
('counting-bits', 6, 'bits[5] = bits[4] + 1 = 2', '{"type":"array","array":[0,1,1,2,1,2],"highlights":[5],"hashmap":{"answer":"[0,1,1,2,1,2]"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('reverse-bits', 1, 'n = 0010...1100 (32 bits)', '{"type":"array","array":["0","0","1","0","...","1","1","0","0"],"hashmap":{"result":"0","i":"0"},"status":"Will reverse all 32 bits."}'::jsonb),
('reverse-bits', 2, 'Shift result left, OR low bit of n', '{"type":"array","array":[],"hashmap":{"result":"0","n":"001...110","i":"1"},"status":"Low bit of n is 0. Result stays 0."}'::jsonb),
('reverse-bits', 3, 'Continue for 32 iterations', '{"type":"array","array":[],"hashmap":{"result":"building...","i":"16"},"status":""}'::jsonb),
('reverse-bits', 4, 'All 32 bits processed', '{"type":"array","array":[],"hashmap":{"answer":"reversed int"},"status":""}'::jsonb);

-- ============== TRIES ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('implement-trie', 1, 'Empty trie', '{"type":"array","array":[],"hashmap":{"root":"{}"},"status":"Trie has only root."}'::jsonb),
('implement-trie', 2, 'insert(\"apple\")', '{"type":"array","array":[],"hashmap":{"trie":"a->p->p->l->e(end)"},"status":"Walk down creating nodes; mark last as end."}'::jsonb),
('implement-trie', 3, 'search(\"apple\") = true', '{"type":"array","array":[],"hashmap":{"walked":"a->p->p->l->e","end":"true"},"status":"Reached end flag."}'::jsonb),
('implement-trie', 4, 'search(\"app\") = false', '{"type":"array","array":[],"hashmap":{"walked":"a->p->p","end":"false"},"status":"No end flag at p."}'::jsonb),
('implement-trie', 5, 'startsWith(\"app\") = true', '{"type":"array","array":[],"hashmap":{"walked":"a->p->p"},"status":"Walk succeeds — don''t care about end flag."}'::jsonb),
('implement-trie', 6, 'insert(\"app\") then search = true', '{"type":"array","array":[],"hashmap":{"trie":"a->p->p(end)->l->e(end)"},"status":"Now both \"app\" and \"apple\" are full words."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('design-add-search', 1, 'Add bad, dad, mad', '{"type":"array","array":[],"hashmap":{"trie":"b->a->d / d->a->d / m->a->d"},"status":""}'::jsonb),
('design-add-search', 2, 'search(\"pad\") = false', '{"type":"array","array":[],"hashmap":{"walk":"p not found"},"status":""}'::jsonb),
('design-add-search', 3, 'search(\".ad\") tries all children', '{"type":"array","array":[],"hashmap":{"branches":"b,d,m"},"status":"Wildcard: recurse on every child."}'::jsonb),
('design-add-search', 4, 'Branch via b: b->a->d found', '{"type":"array","array":[],"hashmap":{"answer":"true"},"status":"First branch succeeds."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('word-search-ii', 1, 'Insert words into trie', '{"type":"array","array":[],"hashmap":{"words":"[oath,pea,eat,rain]"},"status":""}'::jsonb),
('word-search-ii', 2, 'DFS from each cell', '{"type":"array","array":[],"hashmap":{"found":"[]"},"status":"Walk board and trie in parallel."}'::jsonb),
('word-search-ii', 3, 'From (0,0)=o: follow trie', '{"type":"array","array":[],"hashmap":{"path":"o->a->t->h"},"status":""}'::jsonb),
('word-search-ii', 4, 'Found \"oath\"', '{"type":"array","array":[],"hashmap":{"found":"[oath]"},"status":"Record and clear."}'::jsonb),
('word-search-ii', 5, 'Found \"eat\"', '{"type":"array","array":[],"hashmap":{"found":"[oath,eat]"},"status":""}'::jsonb);

-- ============== BACKTRACKING ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('subsets', 1, 'Start dfs(0)', '{"type":"array","array":[1,2,3],"hashmap":{"path":"[]","result":"[]"},"status":""}'::jsonb),
('subsets', 2, 'Include 1, dfs(1)', '{"type":"array","array":[1,2,3],"highlights":[0],"hashmap":{"path":"[1]"},"status":""}'::jsonb),
('subsets', 3, 'Include 2, dfs(2)', '{"type":"array","array":[1,2,3],"highlights":[0,1],"hashmap":{"path":"[1,2]"},"status":""}'::jsonb),
('subsets', 4, 'Include 3 -> [1,2,3]', '{"type":"array","array":[1,2,3],"highlights":[0,1,2],"hashmap":{"result":"[[1,2,3]]"},"status":""}'::jsonb),
('subsets', 5, 'Backtrack, skip 3 -> [1,2]', '{"type":"array","array":[1,2,3],"highlights":[0,1],"hashmap":{"result":"[[1,2,3],[1,2]]"},"status":""}'::jsonb),
('subsets', 6, 'Continue tree', '{"type":"array","array":[1,2,3],"hashmap":{"result":"... 8 total subsets"},"status":""}'::jsonb),
('subsets', 7, 'All 2^3 = 8 subsets', '{"type":"array","array":[1,2,3],"hashmap":{"answer":"[[],[3],[2],[2,3],[1],[1,3],[1,2],[1,2,3]]"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('combination-sum', 1, 'dfs(0, 7)', '{"type":"array","array":[2,3,6,7],"hashmap":{"target":"7","path":"[]"},"status":""}'::jsonb),
('combination-sum', 2, 'Include 2, remaining 5', '{"type":"array","array":[2,3,6,7],"highlights":[0],"hashmap":{"path":"[2]","remaining":"5"},"status":""}'::jsonb),
('combination-sum', 3, 'Include 2 again, remaining 3', '{"type":"array","array":[2,3,6,7],"highlights":[0],"hashmap":{"path":"[2,2]","remaining":"3"},"status":""}'::jsonb),
('combination-sum', 4, 'Skip 2, include 3, remaining 0', '{"type":"array","array":[2,3,6,7],"highlights":[0,1],"hashmap":{"path":"[2,2,3]","result":"[[2,2,3]]"},"status":"First solution."}'::jsonb),
('combination-sum', 5, 'Backtrack, try path [7]', '{"type":"array","array":[2,3,6,7],"highlights":[3],"hashmap":{"path":"[7]","result":"[[2,2,3],[7]]"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('permutations', 1, 'dfs with used=[F,F,F]', '{"type":"array","array":[1,2,3],"hashmap":{"path":"[]"},"status":""}'::jsonb),
('permutations', 2, 'Pick 1', '{"type":"array","array":[1,2,3],"highlights":[0],"hashmap":{"path":"[1]","used":"[T,F,F]"},"status":""}'::jsonb),
('permutations', 3, 'Pick 2', '{"type":"array","array":[1,2,3],"highlights":[0,1],"hashmap":{"path":"[1,2]","used":"[T,T,F]"},"status":""}'::jsonb),
('permutations', 4, 'Pick 3 -> [1,2,3]', '{"type":"array","array":[1,2,3],"highlights":[0,1,2],"hashmap":{"result":"[[1,2,3]]"},"status":""}'::jsonb),
('permutations', 5, 'Continue all branches', '{"type":"array","array":[1,2,3],"hashmap":{"answer":"6 permutations"},"status":"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('word-search', 1, 'Start DFS from each cell', '{"type":"array","array":["A","B","C","E","S","F","C","S","A","D","E","E"],"hashmap":{"word":"ABCCED"},"status":"3x4 board flattened."}'::jsonb),
('word-search', 2, 'From (0,0) = A: matches word[0]', '{"type":"array","array":["A","B","C","E","S","F","C","S","A","D","E","E"],"highlights":[0],"hashmap":{"i":"1"},"status":""}'::jsonb),
('word-search', 3, 'Go right to B: matches word[1]', '{"type":"array","array":["A","B","C","E","S","F","C","S","A","D","E","E"],"highlights":[0,1],"hashmap":{"i":"2"},"status":""}'::jsonb),
('word-search', 4, 'Continue C->C->E->D', '{"type":"array","array":["A","B","C","E","S","F","C","S","A","D","E","E"],"highlights":[0,1,2,6,10,9],"hashmap":{"i":"6"},"status":"All 6 characters matched."}'::jsonb),
('word-search', 5, 'Return true', '{"type":"array","array":["A","B","C","E","S","F","C","S","A","D","E","E"],"hashmap":{"answer":"true"},"status":""}'::jsonb);

-- ============== GRAPHS ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('clone-graph', 1, 'Start BFS at node 1', '{"type":"array","array":[1,2,3,4],"hashmap":{"clones":"{1:1''}","queue":"[1]"},"status":""}'::jsonb),
('clone-graph', 2, 'Pop 1, clone neighbors 2,4', '{"type":"array","array":[1,2,3,4],"highlights":[0],"hashmap":{"clones":"{1,2,4}","queue":"[2,4]"},"status":""}'::jsonb),
('clone-graph', 3, 'Pop 2, clone neighbors 1,3', '{"type":"array","array":[1,2,3,4],"highlights":[1],"hashmap":{"clones":"{1,2,3,4}","queue":"[4,3]"},"status":"1 already cloned, reuse."}'::jsonb),
('clone-graph', 4, 'Pop remaining; graph cloned', '{"type":"array","array":[1,2,3,4],"hashmap":{"done":"true"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('num-islands', 1, 'Start scan, count=0', '{"type":"array","array":[1,1,0,1,0,0,1,1],"hashmap":{"count":"0"},"status":"Each cell = 1 land or 0 water."}'::jsonb),
('num-islands', 2, 'Found 1 at (0,0): DFS sink', '{"type":"array","array":[0,0,0,1,0,0,1,1],"highlights":[0,1],"hashmap":{"count":"1"},"status":"Connected component of 2 sunk."}'::jsonb),
('num-islands', 3, 'Found 1 at (1,1): DFS', '{"type":"array","array":[0,0,0,0,0,0,1,1],"highlights":[3],"hashmap":{"count":"2"},"status":""}'::jsonb),
('num-islands', 4, 'Found 1 at (2,2): DFS both', '{"type":"array","array":[0,0,0,0,0,0,0,0],"highlights":[6,7],"hashmap":{"count":"3"},"status":"Last island sunk."}'::jsonb),
('num-islands', 5, 'Answer = 3', '{"type":"array","array":[0,0,0,0,0,0,0,0],"hashmap":{"answer":"3"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('course-schedule', 1, 'Build graph + indegrees', '{"type":"array","array":[0,1,2,3],"hashmap":{"prereq":"[[1,0]]","indeg":"[0,1,0,0]"},"status":""}'::jsonb),
('course-schedule', 2, 'Queue = nodes with indeg 0', '{"type":"array","array":[0,1,2,3],"highlights":[0,2,3],"hashmap":{"queue":"[0,2,3]"},"status":""}'::jsonb),
('course-schedule', 3, 'Take 0, decrement 1''s indeg', '{"type":"array","array":[0,1,2,3],"highlights":[0],"hashmap":{"taken":"1","indeg[1]":"0"},"status":"Push 1."}'::jsonb),
('course-schedule', 4, 'Take remaining', '{"type":"array","array":[0,1,2,3],"hashmap":{"taken":"4"},"status":""}'::jsonb),
('course-schedule', 5, 'Taken == numCourses -> true', '{"type":"array","array":[0,1,2,3],"hashmap":{"answer":"true"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rotting-oranges', 1, 'Seed queue with rotten', '{"type":"array","array":[2,1,1,1,1,0,0,1,1],"highlights":[0],"hashmap":{"fresh":"6","queue":"[(0,0,0)]"},"status":"3x3 grid."}'::jsonb),
('rotting-oranges', 2, 'Min 1: rot neighbors', '{"type":"array","array":[2,2,1,2,1,0,0,1,1],"highlights":[1,3],"hashmap":{"fresh":"4","time":"1"},"status":""}'::jsonb),
('rotting-oranges', 3, 'Min 2', '{"type":"array","array":[2,2,2,2,2,0,0,1,1],"highlights":[2,4],"hashmap":{"fresh":"2","time":"2"},"status":""}'::jsonb),
('rotting-oranges', 4, 'Min 3', '{"type":"array","array":[2,2,2,2,2,0,0,2,1],"highlights":[7],"hashmap":{"fresh":"1","time":"3"},"status":""}'::jsonb),
('rotting-oranges', 5, 'Min 4', '{"type":"array","array":[2,2,2,2,2,0,0,2,2],"highlights":[8],"hashmap":{"fresh":"0","time":"4","answer":"4"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('pacific-atlantic', 1, 'Start from ocean borders', '{"type":"array","array":[1,2,2,3,5,3,2,3,4,4,2,4,5,3,1,6,7,1,4,5,5,1,1,2,4],"hashmap":{"pac":"top+left borders","atl":"bottom+right borders"},"status":"Reverse flow: water climbs UP from ocean."}'::jsonb),
('pacific-atlantic', 2, 'DFS from Pacific', '{"type":"array","array":[1,2,2,3,5,3,2,3,4,4,2,4,5,3,1,6,7,1,4,5,5,1,1,2,4],"highlights":[0,1,2,3,4,5,10,15,20],"hashmap":{"pac_reach":"9 cells"},"status":""}'::jsonb),
('pacific-atlantic', 3, 'DFS from Atlantic', '{"type":"array","array":[1,2,2,3,5,3,2,3,4,4,2,4,5,3,1,6,7,1,4,5,5,1,1,2,4],"highlights":[4,9,14,19,24,20,21,22,23],"hashmap":{"atl_reach":"9 cells"},"status":""}'::jsonb),
('pacific-atlantic', 4, 'Intersection = result', '{"type":"array","array":[1,2,2,3,5,3,2,3,4,4,2,4,5,3,1,6,7,1,4,5,5,1,1,2,4],"hashmap":{"answer":"7 points"},"status":"Cells reachable by both oceans."}'::jsonb);

-- ============== ADVANCED-GRAPHS ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('alien-dictionary', 1, 'Words: [wrt,wrf,er,ett,rftt]', '{"type":"array","array":[],"hashmap":{"adj":"{}","indeg":"{}"},"status":""}'::jsonb),
('alien-dictionary', 2, 'wrt vs wrf: t -> f', '{"type":"array","array":[],"hashmap":{"adj":"t:{f}","edge":"t->f"},"status":"First mismatch."}'::jsonb),
('alien-dictionary', 3, 'wrf vs er: w -> e', '{"type":"array","array":[],"hashmap":{"edge":"w->e"},"status":""}'::jsonb),
('alien-dictionary', 4, 'er vs ett: r -> t', '{"type":"array","array":[],"hashmap":{"edge":"r->t"},"status":""}'::jsonb),
('alien-dictionary', 5, 'ett vs rftt: e -> r', '{"type":"array","array":[],"hashmap":{"edge":"e->r"},"status":""}'::jsonb),
('alien-dictionary', 6, 'Topo sort', '{"type":"array","array":[],"hashmap":{"answer":"wertf"},"status":"w -> e -> r -> t -> f."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('network-delay', 1, 'Init dist[k]=0', '{"type":"array","array":[1,2,3,4],"hashmap":{"k":"2","dist":"[inf,inf,0,inf,inf]","heap":"[(0,2)]"},"status":""}'::jsonb),
('network-delay', 2, 'Pop (0,2), relax edges', '{"type":"array","array":[1,2,3,4],"highlights":[1],"hashmap":{"dist":"[inf,1,0,1,inf]","heap":"[(1,1),(1,3)]"},"status":""}'::jsonb),
('network-delay', 3, 'Pop (1,3), relax', '{"type":"array","array":[1,2,3,4],"highlights":[2],"hashmap":{"dist":"[inf,1,0,1,2]","heap":"[(1,1),(2,4)]"},"status":""}'::jsonb),
('network-delay', 4, 'Pop (2,4); done', '{"type":"array","array":[1,2,3,4],"hashmap":{"max_dist":"2","answer":"2"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('swim-in-water', 1, 'Start (0,0), t = grid[0][0]', '{"type":"array","array":[0,2,1,3],"highlights":[0],"hashmap":{"heap":"[(0,0,0)]"},"status":""}'::jsonb),
('swim-in-water', 2, 'Pop (0,0,0), push neighbors', '{"type":"array","array":[0,2,1,3],"highlights":[1,2],"hashmap":{"heap":"[(1,1,0),(2,0,1)]"},"status":"max(0, grid) for each neighbor."}'::jsonb),
('swim-in-water', 3, 'Pop (1,1,0); push (1,1)', '{"type":"array","array":[0,2,1,3],"highlights":[3],"hashmap":{"heap":"[(2,0,1),(3,1,1)]"},"status":""}'::jsonb),
('swim-in-water', 4, 'Reach (n-1,n-1) with t=3', '{"type":"array","array":[0,2,1,3],"hashmap":{"answer":"3"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('cheapest-flights', 1, 'Bellman-Ford init', '{"type":"array","array":[0,1,2,3],"hashmap":{"src":"0","dst":"3","prices":"[0,inf,inf,inf]"},"status":""}'::jsonb),
('cheapest-flights', 2, 'Iter 1 (0 stops)', '{"type":"array","array":[0,1,2,3],"hashmap":{"prices":"[0,100,inf,inf]"},"status":"Relax 0->1."}'::jsonb),
('cheapest-flights', 3, 'Iter 2 (1 stop allowed)', '{"type":"array","array":[0,1,2,3],"hashmap":{"prices":"[0,100,200,700]"},"status":"Relax 1->2, 1->3."}'::jsonb),
('cheapest-flights', 4, 'Answer = prices[3]', '{"type":"array","array":[0,1,2,3],"hashmap":{"answer":"700"},"status":""}'::jsonb);

-- ============== MATH ==============
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('happy-number', 1, 'n=19', '{"type":"array","array":[],"hashmap":{"slow":"19","fast":"19"},"status":""}'::jsonb),
('happy-number', 2, 'slow=82, fast=68', '{"type":"array","array":[],"hashmap":{"slow":"82","fast":"68"},"status":"1^2+9^2=82; 8^2+2^2=68."}'::jsonb),
('happy-number', 3, 'slow=68, fast=1', '{"type":"array","array":[],"hashmap":{"slow":"68","fast":"1"},"status":"68->100->1."}'::jsonb),
('happy-number', 4, 'fast == 1 -> happy', '{"type":"array","array":[],"hashmap":{"answer":"true"},"status":""}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('rotate-image', 1, 'Original 3x3', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"status":"[[1,2,3],[4,5,6],[7,8,9]]"}'::jsonb),
('rotate-image', 2, 'Transpose', '{"type":"array","array":[1,4,7,2,5,8,3,6,9],"hashmap":{"step":"transpose"},"status":"Swap matrix[i][j] with matrix[j][i]."}'::jsonb),
('rotate-image', 3, 'Reverse each row', '{"type":"array","array":[7,4,1,8,5,2,9,6,3],"hashmap":{"answer":"[[7,4,1],[8,5,2],[9,6,3]]"},"status":"Done."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('set-matrix-zeroes', 1, 'Original', '{"type":"array","array":[1,1,1,1,0,1,1,1,1],"highlights":[4],"status":"Zero at (1,1)."}'::jsonb),
('set-matrix-zeroes', 2, 'Mark row 1 and col 1 via markers', '{"type":"array","array":[1,0,1,0,0,1,1,1,1],"hashmap":{"first_row":"has 0","first_col":"has 0"},"status":""}'::jsonb),
('set-matrix-zeroes', 3, 'Zero out rows/cols using markers', '{"type":"array","array":[1,0,1,0,0,0,1,0,1],"status":""}'::jsonb),
('set-matrix-zeroes', 4, 'Final', '{"type":"array","array":[1,0,1,0,0,0,1,0,1],"status":"Row 1 and col 1 zeroed."}'::jsonb);

INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data) VALUES
('spiral-matrix', 1, '3x3 matrix', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"hashmap":{"top":"0","bottom":"2","left":"0","right":"2"},"status":""}'::jsonb),
('spiral-matrix', 2, 'Walk top row L->R', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"highlights":[0,1,2],"hashmap":{"result":"[1,2,3]","top":"1"},"status":""}'::jsonb),
('spiral-matrix', 3, 'Right column T->B', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"highlights":[5,8],"hashmap":{"result":"[1,2,3,6,9]","right":"1"},"status":""}'::jsonb),
('spiral-matrix', 4, 'Bottom row R->L', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"highlights":[7,6],"hashmap":{"result":"[1,2,3,6,9,8,7]","bottom":"1"},"status":""}'::jsonb),
('spiral-matrix', 5, 'Left column B->T', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"highlights":[3],"hashmap":{"result":"[1,2,3,6,9,8,7,4]","left":"1"},"status":""}'::jsonb),
('spiral-matrix', 6, 'Center (1,1)', '{"type":"array","array":[1,2,3,4,5,6,7,8,9],"highlights":[4],"hashmap":{"answer":"[1,2,3,6,9,8,7,4,5]"},"status":""}'::jsonb);

COMMIT;

SELECT COUNT(DISTINCT problem_id) AS problems_with_dryruns FROM public."PGcode_interactive_dry_runs";
