-- Visual Dry Runs for key PGcode 300 problems

-- REVERSE LINKED LIST
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('reverse-linked-list', 1, 'Initial List', '{"type": "linked-list", "nodes": [{"value": 1, "state": "default"}, {"value": 2, "state": "default"}, {"value": 3, "state": "default"}, {"value": 4, "state": "default"}], "pointers": {"prev": -1, "curr": 0}, "status": "prev = null, curr = head (node 1). We will reverse pointers one by one."}'),
('reverse-linked-list', 2, 'Reverse first link', '{"type": "linked-list", "nodes": [{"value": 1, "state": "visited"}, {"value": 2, "state": "current"}, {"value": 3, "state": "default"}, {"value": 4, "state": "default"}], "pointers": {"prev": 0, "curr": 1}, "status": "Save next=2. Set 1.next=null (prev). Move prev=1, curr=2."}'),
('reverse-linked-list', 3, 'Reverse second link', '{"type": "linked-list", "nodes": [{"value": 1, "state": "visited"}, {"value": 2, "state": "visited"}, {"value": 3, "state": "current"}, {"value": 4, "state": "default"}], "pointers": {"prev": 1, "curr": 2}, "status": "Save next=3. Set 2.next=1 (prev). Move prev=2, curr=3."}'),
('reverse-linked-list', 4, 'Reverse third link', '{"type": "linked-list", "nodes": [{"value": 1, "state": "visited"}, {"value": 2, "state": "visited"}, {"value": 3, "state": "visited"}, {"value": 4, "state": "current"}], "pointers": {"prev": 2, "curr": 3}, "status": "Save next=4. Set 3.next=2 (prev). Move prev=3, curr=4."}'),
('reverse-linked-list', 5, 'Done!', '{"type": "linked-list", "nodes": [{"value": 4, "state": "current"}, {"value": 3, "state": "visited"}, {"value": 2, "state": "visited"}, {"value": 1, "state": "visited"}], "pointers": {}, "status": "curr is null. Return prev (node 4). List reversed: 4 -> 3 -> 2 -> 1."}')
ON CONFLICT DO NOTHING;

-- CLIMBING STAIRS
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('climbing-stairs', 1, 'Initialize DP', '{"type": "array", "array": [1, 1, 0, 0, 0], "highlights": [0, 1], "highlightColor": "green", "pointers": {}, "status": "n=4. dp[0]=1 (one way to stay at ground), dp[1]=1 (one way to reach step 1)."}'),
('climbing-stairs', 2, 'Calculate dp[2]', '{"type": "array", "array": [1, 1, 2, 0, 0], "highlights": [2], "highlightColor": "accent", "pointers": {"i": 2}, "status": "dp[2] = dp[1] + dp[0] = 1 + 1 = 2. Two ways to reach step 2."}'),
('climbing-stairs', 3, 'Calculate dp[3]', '{"type": "array", "array": [1, 1, 2, 3, 0], "highlights": [3], "highlightColor": "accent", "pointers": {"i": 3}, "status": "dp[3] = dp[2] + dp[1] = 2 + 1 = 3. Three ways to reach step 3."}'),
('climbing-stairs', 4, 'Calculate dp[4]', '{"type": "array", "array": [1, 1, 2, 3, 5], "highlights": [4], "highlightColor": "green", "pointers": {"i": 4}, "status": "dp[4] = dp[3] + dp[2] = 3 + 2 = 5. Answer: 5 ways to climb 4 stairs!"}')
ON CONFLICT DO NOTHING;

-- NUMBER OF ISLANDS (Graph BFS)
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('num-islands', 1, 'Grid Overview', '{"type": "graph", "nodes": [{"id": "0,0", "x": 50, "y": 50, "label": "1", "state": "unvisited"}, {"id": "0,1", "x": 150, "y": 50, "label": "1", "state": "unvisited"}, {"id": "0,2", "x": 250, "y": 50, "label": "0", "state": "visited"}, {"id": "1,0", "x": 50, "y": 150, "label": "1", "state": "unvisited"}, {"id": "1,1", "x": 150, "y": 150, "label": "0", "state": "visited"}, {"id": "1,2", "x": 250, "y": 150, "label": "1", "state": "unvisited"}], "edges": [], "directed": false, "status": "Grid has 1s (land) and 0s (water). We need to count connected groups of 1s."}'),
('num-islands', 2, 'BFS from (0,0)', '{"type": "graph", "nodes": [{"id": "0,0", "x": 50, "y": 50, "label": "1", "state": "current"}, {"id": "0,1", "x": 150, "y": 50, "label": "1", "state": "processing"}, {"id": "0,2", "x": 250, "y": 50, "label": "0", "state": "visited"}, {"id": "1,0", "x": 50, "y": 150, "label": "1", "state": "processing"}, {"id": "1,1", "x": 150, "y": 150, "label": "0", "state": "visited"}, {"id": "1,2", "x": 250, "y": 150, "label": "1", "state": "unvisited"}], "edges": [{"from": "0,0", "to": "0,1", "state": "traversed"}, {"from": "0,0", "to": "1,0", "state": "traversed"}], "directed": false, "status": "Start BFS from (0,0). Visit neighbors (0,1) and (1,0). Island count = 1."}'),
('num-islands', 3, 'Island 1 complete', '{"type": "graph", "nodes": [{"id": "0,0", "x": 50, "y": 50, "label": "1", "state": "visited"}, {"id": "0,1", "x": 150, "y": 50, "label": "1", "state": "visited"}, {"id": "0,2", "x": 250, "y": 50, "label": "0", "state": "visited"}, {"id": "1,0", "x": 50, "y": 150, "label": "1", "state": "visited"}, {"id": "1,1", "x": 150, "y": 150, "label": "0", "state": "visited"}, {"id": "1,2", "x": 250, "y": 150, "label": "1", "state": "unvisited"}], "edges": [{"from": "0,0", "to": "0,1", "state": "traversed"}, {"from": "0,0", "to": "1,0", "state": "traversed"}], "directed": false, "status": "BFS complete for island 1. Cells (0,0), (0,1), (1,0) all connected. Islands = 1."}'),
('num-islands', 4, 'Found island 2', '{"type": "graph", "nodes": [{"id": "0,0", "x": 50, "y": 50, "label": "1", "state": "visited"}, {"id": "0,1", "x": 150, "y": 50, "label": "1", "state": "visited"}, {"id": "0,2", "x": 250, "y": 50, "label": "0", "state": "visited"}, {"id": "1,0", "x": 50, "y": 150, "label": "1", "state": "visited"}, {"id": "1,1", "x": 150, "y": 150, "label": "0", "state": "visited"}, {"id": "1,2", "x": 250, "y": 150, "label": "1", "state": "current"}], "edges": [{"from": "0,0", "to": "0,1", "state": "traversed"}, {"from": "0,0", "to": "1,0", "state": "traversed"}], "directed": false, "status": "Found unvisited land at (1,2). Start new BFS. Islands = 2. Answer: 2 islands!"}')
ON CONFLICT DO NOTHING;

-- INVERT BINARY TREE
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('invert-binary-tree', 1, 'Original Tree', '{"type": "tree", "nodes": [{"id": 1, "value": 4, "state": "unvisited"}, {"id": 2, "value": 2, "state": "unvisited"}, {"id": 3, "value": 7, "state": "unvisited"}, {"id": 4, "value": 1, "state": "unvisited"}, {"id": 5, "value": 3, "state": "unvisited"}], "edges": [{"parent": 1, "child": 2, "side": "left"}, {"parent": 1, "child": 3, "side": "right"}, {"parent": 2, "child": 4, "side": "left"}, {"parent": 2, "child": 5, "side": "right"}], "status": "Original tree: root=4, left subtree has 2(1,3), right has 7."}'),
('invert-binary-tree', 2, 'Swap root children', '{"type": "tree", "nodes": [{"id": 1, "value": 4, "state": "current"}, {"id": 3, "value": 7, "state": "processing"}, {"id": 2, "value": 2, "state": "processing"}, {"id": 4, "value": 1, "state": "unvisited"}, {"id": 5, "value": 3, "state": "unvisited"}], "edges": [{"parent": 1, "child": 3, "side": "left"}, {"parent": 1, "child": 2, "side": "right"}, {"parent": 2, "child": 4, "side": "left"}, {"parent": 2, "child": 5, "side": "right"}], "status": "Swap root children: 7 moves left, 2 moves right. Recurse on both."}'),
('invert-binary-tree', 3, 'Swap node 2 children', '{"type": "tree", "nodes": [{"id": 1, "value": 4, "state": "visited"}, {"id": 3, "value": 7, "state": "visited"}, {"id": 2, "value": 2, "state": "current"}, {"id": 5, "value": 3, "state": "processing"}, {"id": 4, "value": 1, "state": "processing"}], "edges": [{"parent": 1, "child": 3, "side": "left"}, {"parent": 1, "child": 2, "side": "right"}, {"parent": 2, "child": 5, "side": "left"}, {"parent": 2, "child": 4, "side": "right"}], "status": "Swap node 2 children: 3 moves left, 1 moves right. Tree is now fully inverted!"}'),
('invert-binary-tree', 4, 'Inverted!', '{"type": "tree", "nodes": [{"id": 1, "value": 4, "state": "visited"}, {"id": 3, "value": 7, "state": "visited"}, {"id": 2, "value": 2, "state": "visited"}, {"id": 5, "value": 3, "state": "visited"}, {"id": 4, "value": 1, "state": "visited"}], "edges": [{"parent": 1, "child": 3, "side": "left"}, {"parent": 1, "child": 2, "side": "right"}, {"parent": 2, "child": 5, "side": "left"}, {"parent": 2, "child": 4, "side": "right"}], "status": "Done! Tree inverted: root=4, left=7, right=2(3,1). Mirror image of original."}')
ON CONFLICT DO NOTHING;

-- MAX SUBARRAY (Kadane's)
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('max-subarray', 1, 'Initialize', '{"type": "array", "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "highlights": [], "pointers": {"i": 0}, "status": "Kadane''s Algorithm. currentMax = -2, globalMax = -2."}'),
('max-subarray', 2, 'Index 1', '{"type": "array", "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "highlights": [1], "highlightColor": "green", "pointers": {"i": 1}, "status": "currentMax = max(1, -2+1) = max(1, -1) = 1. globalMax = max(-2, 1) = 1."}'),
('max-subarray', 3, 'Index 3', '{"type": "array", "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "highlights": [3], "highlightColor": "green", "pointers": {"i": 3}, "status": "currentMax = max(4, -2+4) = 4. globalMax = max(1, 4) = 4. New subarray starts at 4."}'),
('max-subarray', 4, 'Index 5-6', '{"type": "array", "array": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "highlights": [3, 4, 5, 6], "highlightColor": "green", "pointers": {"i": 6}, "status": "After processing: subarray [4,-1,2,1] has sum 6. globalMax = 6. This is the answer!"}')
ON CONFLICT DO NOTHING;

-- MERGE INTERVALS
INSERT INTO public."PGcode_interactive_dry_runs" (problem_id, step_number, title, visual_state_data)
VALUES
('merge-intervals', 1, 'Sort intervals', '{"type": "array", "array": ["[1,3]", "[2,6]", "[8,10]", "[15,18]"], "highlights": [], "pointers": {}, "status": "Intervals sorted by start time: [1,3], [2,6], [8,10], [15,18]."}'),
('merge-intervals', 2, 'Merge [1,3] and [2,6]', '{"type": "array", "array": ["[1,6]", "[8,10]", "[15,18]"], "highlights": [0], "highlightColor": "green", "pointers": {"i": 0}, "status": "[1,3] and [2,6] overlap (2 <= 3). Merge into [1, max(3,6)] = [1,6]."}'),
('merge-intervals', 3, 'Check [8,10]', '{"type": "array", "array": ["[1,6]", "[8,10]", "[15,18]"], "highlights": [1], "pointers": {"i": 1}, "status": "[8,10] does NOT overlap with [1,6] (8 > 6). Keep separate."}'),
('merge-intervals', 4, 'Result', '{"type": "array", "array": ["[1,6]", "[8,10]", "[15,18]"], "highlights": [0, 1, 2], "highlightColor": "green", "pointers": {}, "status": "Done! Merged result: [[1,6], [8,10], [15,18]]. 4 intervals merged to 3."}')
ON CONFLICT DO NOTHING;
