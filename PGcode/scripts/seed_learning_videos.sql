-- Seed Learning Videos from NeetCode DSA Course Playlist
-- Playlist: https://www.youtube.com/playlist?list=PLKYEe2WisBTGq9T0wPulXz1otUsVeOGey

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
-- Arrays & HashMaps
('arrays', 'Static Arrays, Dynamic Arrays, and Strings - DSA Course Lecture 2', 'TQMvBTKn2p0', 1, 'learnings'),
('arrays', 'Hash Tables: Hash Functions, Sets, & Maps - DSA Course Lecture 4', 'iZyxNEBpqFY', 2, 'learnings'),
('arrays', 'Sorting: Bubble, Insertion, Selection, Merge, Quick, Counting Sort - DSA Course Lecture 10', 'gcRUIO-8r3U', 3, 'learnings'),
('arrays', 'Time & Space Complexity - Big O Notation - DSA Course Lecture 1', 'aWKEBEg55ps', 4, 'learnings'),

-- Strings
('strings', 'Static Arrays, Dynamic Arrays, and Strings - DSA Course Lecture 2', 'TQMvBTKn2p0', 1, 'learnings'),

-- Stack
('stack', 'Stacks & Queues - DSA Course Lecture 5', 'vOx3vY1w4tM', 1, 'learnings'),

-- Queue
('queue', 'Stacks & Queues - DSA Course Lecture 5', 'vOx3vY1w4tM', 1, 'learnings'),

-- Linked List
('linkedlist', 'Linked Lists - Singly & Doubly Linked - DSA Course Lecture 3', 'dqLHTK7RuIo', 1, 'learnings'),

-- Two Pointers
('two-pointers', '2 Pointers Algorithm - DSA Course Lecture 12', 'syTs9_w-pwA', 1, 'learnings'),

-- Binary Search
('binary-search', 'Binary Search - Traditional + Condition Based - DSA Course Lecture 7', '9nmrkG6QtpQ', 1, 'learnings'),

-- Sliding Window
('sliding-window', 'Sliding Window Algorithm - Variable Length + Fixed Length - DSA Course Lecture 13', 'GaXwHThEgGk', 1, 'learnings'),

-- Trees
('trees', 'Binary Trees & Binary Search Trees - DSA Course Lecture 8', 'EPwWrs8OtfI', 1, 'learnings'),

-- Tries
('tries', 'Binary Trees & Binary Search Trees - DSA Course Lecture 8', 'EPwWrs8OtfI', 1, 'learnings'),

-- Graphs
('graphs', 'Graphs: Edge List, Adjacency Matrix, Adjacency List, DFS, BFS - DSA Course Lecture 11', '4jyESQDrpls', 1, 'learnings'),

-- Heap
('heap', 'Heaps & Priority Queues - Heapify, Heap Sort, Heapq Library - DSA Course Lecture 9', 'E2v9hBgG6gE', 1, 'learnings'),

-- Recursion
('recursion', 'Recursion - Recursive Call Stacks & Algorithms - DSA Course Lecture 6', 'TGT79h7e7tE', 1, 'learnings'),

-- DP
('dp', 'Recursion - Recursive Call Stacks & Algorithms - DSA Course Lecture 6', 'TGT79h7e7tE', 1, 'learnings'),

-- Backtracking
('backtracking', 'Recursive Backtracking - DSA Course Lecture 14', 'L0NxT2i-LOY', 1, 'learnings'),

-- Greedy
('greedy', 'Sorting: Bubble, Insertion, Selection, Merge, Quick, Counting Sort - DSA Course Lecture 10', 'gcRUIO-8r3U', 1, 'learnings'),

-- Intervals
('intervals', 'Sorting: Bubble, Insertion, Selection, Merge, Quick, Counting Sort - DSA Course Lecture 10', 'gcRUIO-8r3U', 1, 'learnings'),

-- 2D DP
('2d-dp', 'Recursion - Recursive Call Stacks & Algorithms - DSA Course Lecture 6', 'TGT79h7e7tE', 1, 'learnings'),

-- Advanced Graphs
('advanced-graphs', 'Graphs: Edge List, Adjacency Matrix, Adjacency List, DFS, BFS - DSA Course Lecture 11', '4jyESQDrpls', 1, 'learnings'),

-- Math
('math', 'Time & Space Complexity - Big O Notation - DSA Course Lecture 1', 'aWKEBEg55ps', 1, 'learnings'),

-- Bit Manipulation
('bit-manipulation', 'Time & Space Complexity - Big O Notation - DSA Course Lecture 1', 'aWKEBEg55ps', 1, 'learnings'),

-- Geometry
('geometry', 'Time & Space Complexity - Big O Notation - DSA Course Lecture 1', 'aWKEBEg55ps', 1, 'learnings');

-- ═══════════════════════════════════════════════
-- Greg Hogg — DSA Deep Dives (additional videos)
-- ═══════════════════════════════════════════════
INSERT INTO public."PGcode_topic_videos" (topic_id, title, youtube_video_id, sort_order, source)
VALUES
-- Arrays
('arrays', 'Binary Numbers and Bit Manipulation - Greg Hogg DSA Lecture 16', 'H_NCHm3wAMI', 5, 'learnings'),

-- Linked List
('linkedlist', 'Linked Lists - Singly & Doubly Linked (Greg Hogg)', 'dqLHTK7RuIo', 2, 'learnings'),

-- Two Pointers
('two-pointers', '2 Pointers Algorithm (Greg Hogg)', 'syTs9_w-pwA', 2, 'learnings'),

-- Binary Search
('binary-search', 'Binary Search - Traditional + Condition Based (Greg Hogg)', '9nmrkG6QtpQ', 2, 'learnings'),

-- Sliding Window
('sliding-window', 'Sliding Window Algorithm (Greg Hogg)', 'GaXwHThEgGk', 2, 'learnings'),

-- Trees
('trees', 'Binary Trees & Binary Search Trees (Greg Hogg)', 'EPwWrs8OtfI', 2, 'learnings'),

-- Graphs
('graphs', 'Graphs: Edge List, Adjacency Matrix, DFS, BFS (Greg Hogg)', '4jyESQDrpls', 2, 'learnings'),

-- Heap
('heap', 'Heaps & Priority Queues - Heapify, Heap Sort (Greg Hogg)', 'E2v9hBgG6gE', 2, 'learnings'),

-- Recursion
('recursion', 'Recursion - Recursive Call Stacks (Greg Hogg)', 'TGT79h7e7tE', 2, 'learnings'),

-- DP
('dp', 'Recursion & DP Foundation (Greg Hogg)', 'TGT79h7e7tE', 2, 'learnings'),

-- Backtracking
('backtracking', 'Recursive Backtracking (Greg Hogg)', 'L0NxT2i-LOY', 2, 'learnings'),

-- Bit Manipulation
('bit-manipulation', 'Binary Numbers and Bit Manipulation (Greg Hogg)', 'H_NCHm3wAMI', 2, 'learnings');

-- ═══════════════════════════════════════════════
-- William Fiset — Graph Theory & Data Structures
-- Channel: youtube.com/@WilliamFiset-videos
-- ═══════════════════════════════════════════════
INSERT INTO public."PGcode_topic_videos" (topic_id, title, youtube_video_id, sort_order, source)
VALUES
-- Full Courses (great for comprehensive learning)
('graphs', 'Graph Theory Full Course - William Fiset (freeCodeCamp)', '09_LlHjoEiY', 3, 'learnings'),
('arrays', 'Data Structures Easy to Advanced - William Fiset (freeCodeCamp)', 'RBSGKlAvoiM', 6, 'learnings'),

-- Graphs (deep dives)
('graphs', 'Breadth First Search - William Fiset', 'oDqjPvD54Ss', 4, 'learnings'),
('graphs', 'Depth First Search Algorithm - William Fiset', '7fujbpJ0LB4', 5, 'learnings'),

-- Advanced Graphs
('advanced-graphs', 'Dijkstra''s Shortest Path Algorithm - William Fiset', 'pSqmAO-m7Lk', 2, 'learnings'),
('advanced-graphs', 'Topological Sort Algorithm - William Fiset', 'eL-KzMXSXXI', 3, 'learnings'),
('advanced-graphs', 'Bellman-Ford Algorithm - William Fiset', 'lyw4FaxrwHg', 4, 'learnings'),
('advanced-graphs', 'Floyd Warshall All Pairs Shortest Path - William Fiset', '4NQ3HnhyNfQ', 5, 'learnings'),
('advanced-graphs', 'Prim''s MST Algorithm (Lazy) - William Fiset', 'jsmMtJpPnhU', 6, 'learnings'),

-- Trees
('trees', 'Binary Search Tree - William Fiset', 'JfSdGQdAzq8', 3, 'learnings'),
('trees', 'Balanced Trees (AVL Tree) - William Fiset', 'q4fnJZr8ztY', 4, 'learnings'),

-- Stack & Queue
('stack', 'Stack Data Structure - William Fiset', 'L3ud3rXpIxA', 2, 'learnings'),
('queue', 'Queue Data Structure - William Fiset', 'KxzhEQ-zpDc', 2, 'learnings'),

-- Heap
('heap', 'Priority Queue Data Structure - William Fiset', 'wptevk0bshY', 3, 'learnings'),

-- Linked List
('linkedlist', 'Doubly Linked List - William Fiset', '-Yn5DU0_-lw', 3, 'learnings'),

-- DP
('dp', '0/1 Knapsack Problem (DP) - William Fiset', 'cJ21moQpofY', 3, 'learnings'),
('2d-dp', '0/1 Knapsack Problem (DP) - William Fiset', 'cJ21moQpofY', 2, 'learnings'),

-- Math / Bit Manipulation
('math', 'Power Set Generation - William Fiset', 'RnlHPR0lyOE', 2, 'learnings');
