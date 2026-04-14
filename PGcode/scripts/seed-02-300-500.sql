-- Reset all existing problems to '200'
UPDATE public."PGcode_problems" SET roadmap_set = '200';

-- =============================================
-- PGCODE 300 TIER: Add ~94 more problems (300 - 206 = 94)
-- ~4-5 extra problems per topic
-- =============================================

INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url)
VALUES
-- Arrays (5 more)
('group-anagrams', 'arrays', 'Group Anagrams', 'Medium', '<p>Given an array of strings, group anagrams together.</p>', 'vzdNOK2oB2E', ARRAY['Sort each string and use as hash key'], '300', 'https://leetcode.com/problems/group-anagrams/'),
('top-k-frequent', 'arrays', 'Top K Frequent Elements', 'Medium', '<p>Given an integer array nums and an integer k, return the k most frequent elements.</p>', 'YPTqKIgVk-k', ARRAY['Use a hash map for frequency count', 'Use bucket sort or heap for top k'], '300', 'https://leetcode.com/problems/top-k-frequent-elements/'),
('product-except-self', 'arrays', 'Product of Array Except Self', 'Medium', '<p>Return an array where each element is the product of all other elements.</p>', 'bNvIQI2wAjk', ARRAY['Use prefix and suffix products'], '300', 'https://leetcode.com/problems/product-of-array-except-self/'),
('longest-consecutive', 'arrays', 'Longest Consecutive Sequence', 'Medium', '<p>Given an unsorted array, find the length of the longest consecutive elements sequence.</p>', 'P6RZZMu_maU', ARRAY['Use a hash set for O(1) lookup'], '300', 'https://leetcode.com/problems/longest-consecutive-sequence/'),
('encode-decode-strings', 'arrays', 'Encode and Decode Strings', 'Medium', '<p>Design an algorithm to encode a list of strings to a string and decode it back.</p>', 'B1k_sxOSgv8', ARRAY['Use length prefix encoding'], '300', 'https://leetcode.com/problems/encode-and-decode-strings/'),

-- Two Pointers (5 more)
('three-sum', 'two-pointers', 'Three Sum', 'Medium', '<p>Find all unique triplets that sum to zero.</p>', 'jzZsG8n2R9A', ARRAY['Sort array first', 'Use two pointers for each element'], '300', 'https://leetcode.com/problems/3sum/'),
('container-most-water', 'two-pointers', 'Container With Most Water', 'Medium', '<p>Find two lines that form a container holding the most water.</p>', 'UuiTKBwPgAo', ARRAY['Two pointers from both ends', 'Move the shorter line inward'], '300', 'https://leetcode.com/problems/container-with-most-water/'),
('trapping-rain-water', 'two-pointers', 'Trapping Rain Water', 'Hard', '<p>Given elevation map, compute how much water it can trap after raining.</p>', 'ZI2z5pq0TqA', ARRAY['Two pointer or stack approach', 'Track max left and max right'], '300', 'https://leetcode.com/problems/trapping-rain-water/'),
('two-sum-ii', 'two-pointers', 'Two Sum II - Input Array Is Sorted', 'Medium', '<p>Find two numbers in a sorted array that add up to target.</p>', '6WLGLk6j9xo', ARRAY['Use two pointers since array is sorted'], '300', 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/'),

-- Stack (5 more)
('min-stack', 'stack', 'Min Stack', 'Medium', '<p>Design a stack that supports push, pop, top, and retrieving the minimum element in O(1).</p>', 'qkLl7nAwDPo', ARRAY['Use two stacks: one for values, one for minimums'], '300', 'https://leetcode.com/problems/min-stack/'),
('eval-rpn', 'stack', 'Evaluate Reverse Polish Notation', 'Medium', '<p>Evaluate the value of an arithmetic expression in Reverse Polish Notation.</p>', 'iu0082c4HDE', ARRAY['Push numbers, pop two on operator'], '300', 'https://leetcode.com/problems/evaluate-reverse-polish-notation/'),
('daily-temperatures', 'stack', 'Daily Temperatures', 'Medium', '<p>Return array where each element says how many days until warmer temperature.</p>', 'cTBiBSnjO60', ARRAY['Use a monotonic decreasing stack'], '300', 'https://leetcode.com/problems/daily-temperatures/'),
('largest-rect-histogram', 'stack', 'Largest Rectangle in Histogram', 'Hard', '<p>Find the area of the largest rectangle in the histogram.</p>', 'zx5Sw9130L0', ARRAY['Use a stack to track indices'], '300', 'https://leetcode.com/problems/largest-rectangle-in-histogram/'),
('car-fleet', 'stack', 'Car Fleet', 'Medium', '<p>Count the number of car fleets that will arrive at the destination.</p>', 'Pr6T-3yB9QM', ARRAY['Sort by position, use stack to track fleets'], '300', 'https://leetcode.com/problems/car-fleet/'),

-- Binary Search (4 more)
('search-rotated', 'binary-search', 'Search in Rotated Sorted Array', 'Medium', '<p>Search for a target in a rotated sorted array.</p>', 'U8XENwh8Oy8', ARRAY['Modified binary search checking which half is sorted'], '300', 'https://leetcode.com/problems/search-in-rotated-sorted-array/'),
('find-min-rotated', 'binary-search', 'Find Minimum in Rotated Sorted Array', 'Medium', '<p>Find the minimum element in a rotated sorted array.</p>', 'nIVW4P8b1VA', ARRAY['Binary search comparing mid with right'], '300', 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/'),
('koko-bananas', 'binary-search', 'Koko Eating Bananas', 'Medium', '<p>Find minimum eating speed to finish all bananas within h hours.</p>', 'U2SozAs9RzA', ARRAY['Binary search on the answer (speed)'], '300', 'https://leetcode.com/problems/koko-eating-bananas/'),
('search-2d-matrix', 'binary-search', 'Search a 2D Matrix', 'Medium', '<p>Search for a value in a row-sorted and column-sorted matrix.</p>', 'Ber2pi2C0j0', ARRAY['Treat 2D matrix as 1D sorted array'], '300', 'https://leetcode.com/problems/search-a-2d-matrix/'),

-- Sliding Window (4 more)
('longest-substr-no-repeat', 'sliding-window', 'Longest Substring Without Repeating Characters', 'Medium', '<p>Find the length of the longest substring without repeating characters.</p>', 'wiGpQwVHdE0', ARRAY['Sliding window with a hash set'], '300', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'),
('longest-repeating-char', 'sliding-window', 'Longest Repeating Character Replacement', 'Medium', '<p>Find the longest substring with at most k character replacements.</p>', 'gqXU1UyA8pk', ARRAY['Track character frequencies in window', 'Window valid if length - maxFreq <= k'], '300', 'https://leetcode.com/problems/longest-repeating-character-replacement/'),
('min-window-substring', 'sliding-window', 'Minimum Window Substring', 'Hard', '<p>Find the minimum window in s that contains all characters of t.</p>', 'jSto0O4AJbM', ARRAY['Use two pointers with character frequency maps'], '300', 'https://leetcode.com/problems/minimum-window-substring/'),
('permutation-in-string', 'sliding-window', 'Permutation in String', 'Medium', '<p>Check if s2 contains a permutation of s1.</p>', 'UbyhOgBN834', ARRAY['Fixed size sliding window matching character counts'], '300', 'https://leetcode.com/problems/permutation-in-string/'),

-- Linked List (4 more)
('reverse-linked-list', 'linkedlist', 'Reverse Linked List', 'Easy', '<p>Reverse a singly linked list.</p>', 'G0_I-ZF0S38', ARRAY['Use three pointers: prev, curr, next'], '300', 'https://leetcode.com/problems/reverse-linked-list/'),
('merge-two-sorted', 'linkedlist', 'Merge Two Sorted Lists', 'Easy', '<p>Merge two sorted linked lists into one sorted list.</p>', 'XIdigk956u0', ARRAY['Compare heads, build result list'], '300', 'https://leetcode.com/problems/merge-two-sorted-lists/'),
('linked-list-cycle', 'linkedlist', 'Linked List Cycle', 'Easy', '<p>Determine if a linked list has a cycle.</p>', 'gBTe7lFR3vc', ARRAY['Floyd cycle detection: slow and fast pointers'], '300', 'https://leetcode.com/problems/linked-list-cycle/'),
('reorder-list', 'linkedlist', 'Reorder List', 'Medium', '<p>Reorder list: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → ...</p>', 'S5bfdUTrKLM', ARRAY['Find middle, reverse second half, merge alternating'], '300', 'https://leetcode.com/problems/reorder-list/'),

-- Trees (5 more)
('invert-binary-tree', 'trees', 'Invert Binary Tree', 'Easy', '<p>Invert a binary tree (swap left and right children).</p>', 'OnSn2XEQ4MY', ARRAY['Recursive: swap children then recurse'], '300', 'https://leetcode.com/problems/invert-binary-tree/'),
('max-depth-binary-tree', 'trees', 'Maximum Depth of Binary Tree', 'Easy', '<p>Find the maximum depth of a binary tree.</p>', 'hTM3phVI6YQ', ARRAY['DFS: return 1 + max(left depth, right depth)'], '300', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'),
('same-tree', 'trees', 'Same Tree', 'Easy', '<p>Check if two binary trees are identical.</p>', 'vRbbcPXNjTE', ARRAY['Compare nodes recursively'], '300', 'https://leetcode.com/problems/same-tree/'),
('subtree-of-another', 'trees', 'Subtree of Another Tree', 'Easy', '<p>Check if one tree is a subtree of another.</p>', 'E36O5SWp-LE', ARRAY['For each node, check if its subtree matches'], '300', 'https://leetcode.com/problems/subtree-of-another-tree/'),
('level-order-traversal', 'trees', 'Binary Tree Level Order Traversal', 'Medium', '<p>Return level order traversal of a binary tree.</p>', '6ZnyEApgFYg', ARRAY['BFS with queue, process level by level'], '300', 'https://leetcode.com/problems/binary-tree-level-order-traversal/'),

-- Graphs (5 more)
('num-islands', 'graphs', 'Number of Islands', 'Medium', '<p>Count the number of islands in a 2D grid.</p>', 'pV2kpPD66nE', ARRAY['DFS/BFS from each unvisited land cell'], '300', 'https://leetcode.com/problems/number-of-islands/'),
('clone-graph', 'graphs', 'Clone Graph', 'Medium', '<p>Return a deep copy of the graph.</p>', 'mQeF6bN8hMk', ARRAY['BFS/DFS with hash map for visited nodes'], '300', 'https://leetcode.com/problems/clone-graph/'),
('pacific-atlantic', 'graphs', 'Pacific Atlantic Water Flow', 'Medium', '<p>Find cells where water can flow to both Pacific and Atlantic oceans.</p>', 's-VkcjHqkGI', ARRAY['BFS from both oceans, find intersection'], '300', 'https://leetcode.com/problems/pacific-atlantic-water-flow/'),
('course-schedule', 'graphs', 'Course Schedule', 'Medium', '<p>Determine if you can finish all courses given prerequisites.</p>', 'EgI5nU9etnU', ARRAY['Topological sort or cycle detection with DFS'], '300', 'https://leetcode.com/problems/course-schedule/'),
('rotting-oranges', 'graphs', 'Rotting Oranges', 'Medium', '<p>Return the minimum time until all oranges rot.</p>', 'y704fEOx0s0', ARRAY['Multi-source BFS from all rotten oranges'], '300', 'https://leetcode.com/problems/rotting-oranges/'),

-- Heap (4 more)
('kth-largest-element', 'heap', 'Kth Largest Element in a Stream', 'Easy', '<p>Design a class to find the kth largest element in a stream.</p>', 'hOjcdrqMoQ8', ARRAY['Use a min-heap of size k'], '300', 'https://leetcode.com/problems/kth-largest-element-in-a-stream/'),
('last-stone-weight', 'heap', 'Last Stone Weight', 'Easy', '<p>Smash heaviest stones together until one or zero remain.</p>', 'B-QCq79-Vfw', ARRAY['Use a max-heap, pop two, push difference'], '300', 'https://leetcode.com/problems/last-stone-weight/'),
('k-closest-points', 'heap', 'K Closest Points to Origin', 'Medium', '<p>Find k closest points to origin.</p>', 'rI2EBUEMfTk', ARRAY['Use a max-heap of size k based on distance'], '300', 'https://leetcode.com/problems/k-closest-points-to-origin/'),
('task-scheduler', 'heap', 'Task Scheduler', 'Medium', '<p>Find minimum intervals to execute all tasks with cooldown.</p>', 's8p8ukTyA2I', ARRAY['Greedy: most frequent task first', 'Use max-heap'], '300', 'https://leetcode.com/problems/task-scheduler/'),

-- DP (5 more)
('climbing-stairs', 'dp', 'Climbing Stairs', 'Easy', '<p>You can climb 1 or 2 steps. How many ways to reach the top?</p>', 'Y0lT9Fck7qI', ARRAY['Fibonacci pattern: dp[i] = dp[i-1] + dp[i-2]'], '300', 'https://leetcode.com/problems/climbing-stairs/'),
('house-robber', 'dp', 'House Robber', 'Medium', '<p>Max money without robbing adjacent houses.</p>', '73r3KWiEvyk', ARRAY['dp[i] = max(dp[i-1], dp[i-2] + nums[i])'], '300', 'https://leetcode.com/problems/house-robber/'),
('coin-change', 'dp', 'Coin Change', 'Medium', '<p>Find fewest coins to make amount.</p>', 'H9bfqozjoqs', ARRAY['Bottom-up DP: for each amount, try each coin'], '300', 'https://leetcode.com/problems/coin-change/'),
('longest-increasing-subseq', 'dp', 'Longest Increasing Subsequence', 'Medium', '<p>Find the length of the longest strictly increasing subsequence.</p>', 'cjWnW0hdVeM', ARRAY['DP with binary search for O(n log n)'], '300', 'https://leetcode.com/problems/longest-increasing-subsequence/'),
('word-break', 'dp', 'Word Break', 'Medium', '<p>Determine if string can be segmented into dictionary words.</p>', 'Sx9NNgInc3A', ARRAY['DP: dp[i] = true if s[0..i] can be segmented'], '300', 'https://leetcode.com/problems/word-break/'),

-- Backtracking (4 more)
('subsets', 'backtracking', 'Subsets', 'Medium', '<p>Return all possible subsets of a set.</p>', 'REOH22Xwdkk', ARRAY['Include/exclude each element recursively'], '300', 'https://leetcode.com/problems/subsets/'),
('combination-sum', 'backtracking', 'Combination Sum', 'Medium', '<p>Find all unique combinations that sum to target.</p>', 'GBKI9VSKdGg', ARRAY['Backtrack with remaining target', 'Same element can be reused'], '300', 'https://leetcode.com/problems/combination-sum/'),
('permutations', 'backtracking', 'Permutations', 'Medium', '<p>Return all possible permutations of an array.</p>', 's7AvT7cGdSo', ARRAY['Swap elements and recurse'], '300', 'https://leetcode.com/problems/permutations/'),
('word-search', 'backtracking', 'Word Search', 'Medium', '<p>Search for a word in a 2D board of characters.</p>', 'pfiQ_PS1g8E', ARRAY['DFS from each cell matching first char', 'Mark visited cells'], '300', 'https://leetcode.com/problems/word-search/'),

-- Greedy (4 more)
('max-subarray', 'greedy', 'Maximum Subarray', 'Medium', '<p>Find the contiguous subarray with the largest sum.</p>', '5WZl3MMT0Eg', ARRAY['Kadanes algorithm: track current max and global max'], '300', 'https://leetcode.com/problems/maximum-subarray/'),
('jump-game', 'greedy', 'Jump Game', 'Medium', '<p>Determine if you can reach the last index.</p>', 'Yan0cv2cLy8', ARRAY['Track the farthest reachable index'], '300', 'https://leetcode.com/problems/jump-game/'),
('gas-station', 'greedy', 'Gas Station', 'Medium', '<p>Find the starting gas station index for a circular route.</p>', 'lJwbPZGo05A', ARRAY['If total gas >= total cost, solution exists', 'Track running surplus'], '300', 'https://leetcode.com/problems/gas-station/'),
('hand-of-straights', 'greedy', 'Hand of Straights', 'Medium', '<p>Check if hand can be rearranged into groups of consecutive cards.</p>', 'amnrMCVd2YI', ARRAY['Sort and greedily form groups from smallest'], '300', 'https://leetcode.com/problems/hand-of-straights/'),

-- Intervals (4 more)
('merge-intervals', 'intervals', 'Merge Intervals', 'Medium', '<p>Merge all overlapping intervals.</p>', '44H3cEC2fFM', ARRAY['Sort by start time', 'Merge if current overlaps previous'], '300', 'https://leetcode.com/problems/merge-intervals/'),
('insert-interval', 'intervals', 'Insert Interval', 'Medium', '<p>Insert a new interval into a sorted list of non-overlapping intervals.</p>', 'A8NUOmlJCNY', ARRAY['Add intervals before, merge overlapping, add after'], '300', 'https://leetcode.com/problems/insert-interval/'),
('non-overlapping-intervals', 'intervals', 'Non-overlapping Intervals', 'Medium', '<p>Find minimum number of intervals to remove for non-overlapping.</p>', 'nONCGxWoUfM', ARRAY['Sort by end time, greedy removal'], '300', 'https://leetcode.com/problems/non-overlapping-intervals/'),
('meeting-rooms', 'intervals', 'Meeting Rooms II', 'Medium', '<p>Find the minimum number of conference rooms required.</p>', 'FdzJmTCVyJU', ARRAY['Sort starts and ends separately', 'Track overlapping meetings'], '300', 'https://leetcode.com/problems/meeting-rooms-ii/'),

-- Tries (4 more)
('implement-trie', 'tries', 'Implement Trie', 'Medium', '<p>Implement a trie with insert, search, and startsWith.</p>', 'oobqoCJlHA0', ARRAY['Use nested hash maps or arrays for children'], '300', 'https://leetcode.com/problems/implement-trie-prefix-tree/'),
('word-search-ii', 'tries', 'Word Search II', 'Hard', '<p>Find all words from dictionary in a 2D board.</p>', 'asbcE9mZz_U', ARRAY['Build trie from words, DFS on board with trie'], '300', 'https://leetcode.com/problems/word-search-ii/'),
('design-add-search', 'tries', 'Design Add and Search Words', 'Medium', '<p>Design a data structure supporting add and search with wildcards.</p>', 'BTf05gs_8iU', ARRAY['Trie with DFS for wildcard matching'], '300', 'https://leetcode.com/problems/design-add-and-search-words-data-structure/'),

-- 2D DP (4 more)
('unique-paths', 'dp', 'Unique Paths', 'Medium', '<p>Count unique paths from top-left to bottom-right of grid.</p>', 'IlEsdxuD4lY', ARRAY['dp[i][j] = dp[i-1][j] + dp[i][j-1]'], '300', 'https://leetcode.com/problems/unique-paths/'),
('longest-common-subseq', '2d-dp', 'Longest Common Subsequence', 'Medium', '<p>Find the length of the longest common subsequence of two strings.</p>', 'Ua0GhsJSlWM', ARRAY['2D DP table comparing characters'], '300', 'https://leetcode.com/problems/longest-common-subsequence/'),
('edit-distance', '2d-dp', 'Edit Distance', 'Medium', '<p>Find minimum operations to convert one string to another.</p>', 'XYi2-LPrwm4', ARRAY['2D DP: insert, delete, replace operations'], '300', 'https://leetcode.com/problems/edit-distance/'),
('target-sum', '2d-dp', 'Target Sum', 'Medium', '<p>Find number of ways to assign +/- to reach target sum.</p>', 'g0npyaQtAQM', ARRAY['Subset sum variant with DP'], '300', 'https://leetcode.com/problems/target-sum/'),

-- Advanced Graphs (4 more)
('network-delay', 'advanced-graphs', 'Network Delay Time', 'Medium', '<p>Find time for all nodes to receive a signal (Dijkstra).</p>', 'EaphyqKU4PQ', ARRAY['Dijkstra shortest path from source'], '300', 'https://leetcode.com/problems/network-delay-time/'),
('swim-in-water', 'advanced-graphs', 'Swim in Rising Water', 'Hard', '<p>Find minimum time to swim from top-left to bottom-right.</p>', 'amvrKlMLuGY', ARRAY['Binary search + BFS or Dijkstra on grid'], '300', 'https://leetcode.com/problems/swim-in-rising-water/'),
('cheapest-flights', 'advanced-graphs', 'Cheapest Flights Within K Stops', 'Medium', '<p>Find cheapest flight with at most k stops.</p>', '5eIK3zUdYmE', ARRAY['Bellman-Ford with k+1 iterations'], '300', 'https://leetcode.com/problems/cheapest-flights-within-k-stops/'),
('alien-dictionary', 'advanced-graphs', 'Alien Dictionary', 'Hard', '<p>Determine character order from sorted alien language dictionary.</p>', '6kTZYvNNyps', ARRAY['Build graph from adjacent word pairs', 'Topological sort'], '300', 'https://leetcode.com/problems/alien-dictionary/'),

-- Math (4 more)
('rotate-image', 'math', 'Rotate Image', 'Medium', '<p>Rotate an n x n matrix by 90 degrees clockwise.</p>', 'fMSJSS7eO1w', ARRAY['Transpose then reverse each row'], '300', 'https://leetcode.com/problems/rotate-image/'),
('spiral-matrix', 'math', 'Spiral Matrix', 'Medium', '<p>Return all elements of the matrix in spiral order.</p>', 'BJnMZNwUk1M', ARRAY['Track four boundaries: top, bottom, left, right'], '300', 'https://leetcode.com/problems/spiral-matrix/'),
('set-matrix-zeroes', 'math', 'Set Matrix Zeroes', 'Medium', '<p>If element is 0, set its entire row and column to 0.</p>', 'T41rL0L3Pnw', ARRAY['Use first row and column as markers'], '300', 'https://leetcode.com/problems/set-matrix-zeroes/'),
('happy-number', 'math', 'Happy Number', 'Easy', '<p>Determine if a number is a happy number.</p>', 'ljz85bxOYJ0', ARRAY['Floyd cycle detection on digit sum sequence'], '300', 'https://leetcode.com/problems/happy-number/'),

-- Bit Manipulation (4 more)
('single-number', 'bit-manipulation', 'Single Number', 'Easy', '<p>Find the element that appears only once (others appear twice).</p>', 'qMPX1AOa83k', ARRAY['XOR all elements: pairs cancel out'], '300', 'https://leetcode.com/problems/single-number/'),
('number-of-1-bits', 'bit-manipulation', 'Number of 1 Bits', 'Easy', '<p>Count the number of 1 bits in an integer.</p>', '5Km3utixwZs', ARRAY['n & (n-1) removes lowest set bit'], '300', 'https://leetcode.com/problems/number-of-1-bits/'),
('counting-bits', 'bit-manipulation', 'Counting Bits', 'Easy', '<p>Return array where i-th element is number of 1s in binary of i.</p>', 'RyBM56RIWrM', ARRAY['dp[i] = dp[i >> 1] + (i & 1)'], '300', 'https://leetcode.com/problems/counting-bits/'),
('reverse-bits', 'bit-manipulation', 'Reverse Bits', 'Easy', '<p>Reverse bits of a 32-bit unsigned integer.</p>', 'UcoN6UjAI64', ARRAY['Shift result left, shift n right, add last bit'], '300', 'https://leetcode.com/problems/reverse-bits/')

ON CONFLICT (id) DO NOTHING;
