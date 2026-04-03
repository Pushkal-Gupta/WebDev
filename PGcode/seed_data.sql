-- 1. Augment Schema to support tags/categories
ALTER TABLE public."PGcode_topics" ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public."PGcode_topics" ADD COLUMN IF NOT EXISTS group_name text;

-- Clear previous roadmap data to insert the fresh, massive tree
TRUNCATE TABLE public."PGcode_roadmap_edges" RESTART IDENTITY CASCADE;
TRUNCATE TABLE public."PGcode_topics" RESTART IDENTITY CASCADE;

-- 2. Insert Complete DSA Roadmap List
INSERT INTO public."PGcode_topics" (id, name, group_name, category, topic_video_url, position_x, position_y)
VALUES
-- Foundation
('arrays', 'Arrays & HashMaps\nTwo-sum, freq counts', 'Foundation', 'Structures', '3OamzN90kPg', 200, 0),
('strings', 'Strings\nManipulation, parsing', 'Foundation', 'Algorithms', '3OamzN90kPg', 600, 0),

-- Structures
('stack', 'Stack\nLIFO, monotonic', 'Structures', 'Structures', '3OamzN90kPg', 200, 150),
('queue', 'Queue\nFIFO, deque', 'Structures', 'Structures', '3OamzN90kPg', 600, 150),
('linkedlist', 'Linked List\nSingly, doubly, fast-slow', 'Structures', 'Structures', '3OamzN90kPg', 400, 250),

-- Algorithms
('two-pointers', 'Two Pointers\nOpposite ends, same dir', 'Algorithms', 'Algorithms', '3OamzN90kPg', 600, 350),
('binary-search', 'Binary Search\nSorted arrays, bounds', 'Algorithms', 'Algorithms', '3OamzN90kPg', 450, 450),
('sliding-window', 'Sliding Window\nSubarray, substring', 'Algorithms', 'Algorithms', '3OamzN90kPg', 750, 450),

-- Advanced
('trees', 'Trees\nBST, DFS, BFS, traversal', 'Advanced', 'Structures', '3OamzN90kPg', 200, 550),
('graphs', 'Graphs\nDFS, BFS, union-find', 'Advanced', 'Structures', '3OamzN90kPg', 500, 550),
('heap', 'Heap\nPriority queue', 'Advanced', 'Optimization', '3OamzN90kPg', 800, 550),

-- Optimization
('tries', 'Tries\nPrefix tree', 'Optimization', 'Structures', '3OamzN90kPg', 200, 700),
('dp', 'DP ★\nMemoization, tabulation', 'Optimization', 'Optimization', '3OamzN90kPg', 450, 750),
('backtracking', 'Backtracking ★\nPermutations, subsets', 'Optimization', 'Optimization', '3OamzN90kPg', 800, 750),
('greedy', 'Greedy\nLocal optimal choice', 'Optimization', 'Optimization', '3OamzN90kPg', 600, 850),
('intervals', 'Intervals\nMerge, sweep line', 'Optimization', 'Optimization', '3OamzN90kPg', 900, 850),

-- Expert
('2d-dp', '2D DP\nGrid, sequence DP', 'Expert', 'Optimization', '3OamzN90kPg', 400, 1000),
('advanced-graphs', 'Advanced Graphs\nDijkstra, topo sort', 'Expert', 'Structures', '3OamzN90kPg', 700, 1000),

-- Synthesis
('first-order', 'First-order thinking\nPattern recognition', 'Synthesis', 'Synthesis', '3OamzN90kPg', 500, 1150),
('math', 'Math\nPrimes, GCD, modulo', 'Synthesis', 'Math', '3OamzN90kPg', 300, 1250),
('bit-manipulation', 'Bit Manipulation\nAND, OR, XOR tricks', 'Synthesis', 'Math', '3OamzN90kPg', 550, 1250),
('geometry', 'Geo\nGeometry', 'Synthesis', 'Math', '3OamzN90kPg', 800, 1250)
ON CONFLICT (id) DO NOTHING;

-- 3. Map all roadmap edges
INSERT INTO public."PGcode_roadmap_edges" (source, target)
VALUES
-- Structure Forks
('arrays', 'stack'),
('strings', 'queue'),
('stack', 'linkedlist'),
('queue', 'linkedlist'),
('queue', 'two-pointers'),

-- Algorithm forks
('two-pointers', 'binary-search'),
('two-pointers', 'sliding-window'),

-- Advanced Integrations
('linkedlist', 'trees'),
('binary-search', 'trees'),
('binary-search', 'graphs'),
('sliding-window', 'graphs'),
('sliding-window', 'heap'),

-- Optimization Branches
('trees', 'tries'),
('graphs', 'dp'),
('graphs', 'backtracking'),
('heap', 'backtracking'),
('heap', 'intervals'),
('heap', 'greedy'),
('backtracking', 'intervals'),

-- Expert Level
('dp', '2d-dp'),
('greedy', '2d-dp'),
('backtracking', 'advanced-graphs'),
('intervals', 'advanced-graphs'),

-- Synthesis Convergence (Everything feeds first order thinking conceptually, but we can hook the expert rows)
('2d-dp', 'first-order'),
('advanced-graphs', 'first-order'),
('first-order', 'math'),
('first-order', 'bit-manipulation'),
('first-order', 'geometry')
ON CONFLICT DO NOTHING;
