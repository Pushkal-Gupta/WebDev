-- Seed Learning Videos — Topic-specific DSA videos
-- Sources: NeetCode, William Fiset, Greg Hogg, freeCodeCamp

-- Create table if not exists (also in migrate_v2.sql, but safe to re-run)
CREATE TABLE IF NOT EXISTS public."PGcode_topic_videos" (
  id SERIAL PRIMARY KEY,
  topic_id TEXT REFERENCES public."PGcode_topics"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  source TEXT DEFAULT 'learnings'
);

-- Clear previous video seeds
TRUNCATE TABLE public."PGcode_topic_videos" RESTART IDENTITY CASCADE;

INSERT INTO public."PGcode_topic_videos" (topic_id, title, youtube_video_id, sort_order, source)
VALUES

-- ═══════════════════════════════════════════════
-- Arrays & HashMaps
-- ═══════════════════════════════════════════════
('arrays', 'Static Arrays, Dynamic Arrays, and Strings - NeetCode DSA Course', 'TQMvBTKn2p0', 1, 'learnings'),
('arrays', 'Hash Tables: Hash Functions, Sets, & Maps - NeetCode DSA Course', 'iZyxNEBpqFY', 2, 'learnings'),
('arrays', 'Arrays & Hashing - NeetCode', 'KLlXCFG5TnA', 3, 'learnings'),
('arrays', 'Data Structures Easy to Advanced - William Fiset (freeCodeCamp)', 'RBSGKlAvoiM', 4, 'learnings'),

-- ═══════════════════════════════════════════════
-- Strings
-- ═══════════════════════════════════════════════
('strings', 'Static Arrays, Dynamic Arrays, and Strings - NeetCode DSA Course', 'TQMvBTKn2p0', 1, 'learnings'),
('strings', 'String Problems Overview - NeetCode', 'WJres9mgiAk', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Stack
-- ═══════════════════════════════════════════════
('stack', 'Stacks & Queues - NeetCode DSA Course', 'vOx3vY1w4tM', 1, 'learnings'),
('stack', 'Stack Data Structure - William Fiset', 'L3ud3rXpIxA', 2, 'learnings'),
('stack', 'Stack Problems - NeetCode', 'cQ1Oz4ckceM', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Queue
-- ═══════════════════════════════════════════════
('queue', 'Stacks & Queues - NeetCode DSA Course', 'vOx3vY1w4tM', 1, 'learnings'),
('queue', 'Queue Data Structure - William Fiset', 'KxzhEQ-zpDc', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Linked List
-- ═══════════════════════════════════════════════
('linkedlist', 'Linked Lists - Singly & Doubly Linked - NeetCode DSA Course', 'dqLHTK7RuIo', 1, 'learnings'),
('linkedlist', 'Doubly Linked List - William Fiset', '-Yn5DU0_-lw', 2, 'learnings'),
('linkedlist', 'Linked List Problems - NeetCode', 'G0_I-ZF0S38', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Two Pointers
-- ═══════════════════════════════════════════════
('two-pointers', '2 Pointers Algorithm - NeetCode DSA Course', 'syTs9_w-pwA', 1, 'learnings'),
('two-pointers', 'Two Pointers Overview - NeetCode', 'cQ1Oz4ckceM', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Binary Search
-- ═══════════════════════════════════════════════
('binary-search', 'Binary Search - Traditional + Condition Based - NeetCode DSA Course', '9nmrkG6QtpQ', 1, 'learnings'),
('binary-search', 'Binary Search Overview - NeetCode', 'DnvWAd-RGhk', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Sliding Window
-- ═══════════════════════════════════════════════
('sliding-window', 'Sliding Window Algorithm - NeetCode DSA Course', 'GaXwHThEgGk', 1, 'learnings'),
('sliding-window', 'Sliding Window - NeetCode', '1pkOgXD63yU', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Trees
-- ═══════════════════════════════════════════════
('trees', 'Binary Trees & Binary Search Trees - NeetCode DSA Course', 'EPwWrs8OtfI', 1, 'learnings'),
('trees', 'Binary Search Tree - William Fiset', 'JfSdGQdAzq8', 2, 'learnings'),
('trees', 'Balanced Trees (AVL Tree) - William Fiset', 'q4fnJZr8ztY', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Tries
-- ═══════════════════════════════════════════════
('tries', 'Implement Trie - NeetCode', 'oobqoCJlHA0', 1, 'learnings'),
('tries', 'Trie Explained - NeetCode', 'K5pcpkEIRps', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Graphs
-- ═══════════════════════════════════════════════
('graphs', 'Graphs: Edge List, Adjacency Matrix, DFS, BFS - NeetCode DSA Course', '4jyESQDrpls', 1, 'learnings'),
('graphs', 'Breadth First Search - William Fiset', 'oDqjPvD54Ss', 2, 'learnings'),
('graphs', 'Depth First Search Algorithm - William Fiset', '7fujbpJ0LB4', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Heap
-- ═══════════════════════════════════════════════
('heap', 'Heaps & Priority Queues - NeetCode DSA Course', 'E2v9hBgG6gE', 1, 'learnings'),
('heap', 'Priority Queue Data Structure - William Fiset', 'wptevk0bshY', 2, 'learnings'),
('heap', 'Heap / Priority Queue - NeetCode', 'HqPJF2L5h9U', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Recursion
-- ═══════════════════════════════════════════════
('recursion', 'Recursion - Recursive Call Stacks & Algorithms - NeetCode DSA Course', 'TGT79h7e7tE', 1, 'learnings'),
('recursion', 'Recursion - NeetCode', 'IJDJ0kBx2LM', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- DP (Dynamic Programming)
-- ═══════════════════════════════════════════════
('dp', 'Recursion - Recursive Call Stacks & Algorithms - NeetCode DSA Course', 'TGT79h7e7tE', 1, 'learnings'),
('dp', '0/1 Knapsack Problem (DP) - William Fiset', 'cJ21moQpofY', 2, 'learnings'),
('dp', 'DP Patterns - NeetCode', 'oBt53YbR9Kk', 3, 'learnings'),

-- ═══════════════════════════════════════════════
-- Backtracking
-- ═══════════════════════════════════════════════
('backtracking', 'Recursive Backtracking - NeetCode DSA Course', 'L0NxT2i-LOY', 1, 'learnings'),
('backtracking', 'Backtracking - NeetCode', 'REOH22Xwdkk', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Greedy
-- ═══════════════════════════════════════════════
('greedy', 'Greedy Algorithms - NeetCode', 'bC7o8P_Aste', 1, 'learnings'),
('greedy', 'Jump Game - NeetCode', 'WGUKwdFMKOg', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Intervals
-- ═══════════════════════════════════════════════
('intervals', 'Merge Intervals - NeetCode', 'nONCGxWoUfM', 1, 'learnings'),
('intervals', 'Insert Interval - NeetCode', '44H3cEC2fFM', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- 2D DP
-- ═══════════════════════════════════════════════
('2d-dp', '2D Dynamic Programming - NeetCode', 'sSno9rV8Rhg', 1, 'learnings'),
('2d-dp', '0/1 Knapsack Problem (DP) - William Fiset', 'cJ21moQpofY', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Advanced Graphs
-- ═══════════════════════════════════════════════
('advanced-graphs', 'Dijkstra''s Shortest Path Algorithm - William Fiset', 'pSqmAO-m7Lk', 1, 'learnings'),
('advanced-graphs', 'Topological Sort Algorithm - William Fiset', 'eL-KzMXSXXI', 2, 'learnings'),
('advanced-graphs', 'Bellman-Ford Algorithm - William Fiset', 'lyw4FaxrwHg', 3, 'learnings'),
('advanced-graphs', 'Floyd Warshall All Pairs Shortest Path - William Fiset', '4NQ3HnhyNfQ', 4, 'learnings'),
('advanced-graphs', 'Prim''s MST Algorithm (Lazy) - William Fiset', 'jsmMtJpPnhU', 5, 'learnings'),

-- ═══════════════════════════════════════════════
-- Math
-- ═══════════════════════════════════════════════
('math', 'Math & Geometry - NeetCode', 'UcTKk2y_3dE', 1, 'learnings'),
('math', 'Power Set Generation - William Fiset', 'RnlHPR0lyOE', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Bit Manipulation
-- ═══════════════════════════════════════════════
('bit-manipulation', 'Bit Manipulation - NeetCode', 'HqPJF2L5h9U', 1, 'learnings'),
('bit-manipulation', 'Binary Numbers and Bit Manipulation - Greg Hogg', 'H_NCHm3wAMI', 2, 'learnings'),

-- ═══════════════════════════════════════════════
-- Geometry
-- ═══════════════════════════════════════════════
('geometry', 'Math & Geometry - NeetCode', 'UcTKk2y_3dE', 1, 'learnings');
