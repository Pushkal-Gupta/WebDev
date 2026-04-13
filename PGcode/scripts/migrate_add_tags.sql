-- Migration: Add tags column to PGcode_problems for pattern recognition
-- Run this in Supabase SQL Editor

ALTER TABLE public."PGcode_problems"
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_problems_tags ON public."PGcode_problems" USING GIN (tags);

-- ============================================================
-- Tag all existing problems with algorithmic pattern tags
-- Tags represent the PRIMARY technique used, not the topic
-- ============================================================

-- ARRAYS & HASHING
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-map', 'complement'] WHERE id = 'two-sum';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-set', 'duplicate-detection'] WHERE id = 'contains-duplicate';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-map', 'frequency-count'] WHERE id = 'valid-anagram';
UPDATE public."PGcode_problems" SET tags = ARRAY['boyer-moore', 'frequency-count'] WHERE id = 'majority-element';
UPDATE public."PGcode_problems" SET tags = ARRAY['math', 'hash-set'] WHERE id = 'missing-number';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-encoding', 'design'] WHERE id = 'encode-decode-strings';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-map', 'sorted-key'] WHERE id = 'group-anagrams';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-set', 'sequence-expansion'] WHERE id = 'longest-consecutive';
UPDATE public."PGcode_problems" SET tags = ARRAY['prefix-product', 'suffix-product'] WHERE id = 'product-except-self';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-map', 'frequency-count', 'heap'] WHERE id = 'top-k-frequent';
UPDATE public."PGcode_problems" SET tags = ARRAY['hash-set', 'matrix'] WHERE id = 'valid-sudoku';

-- STRINGS
UPDATE public."PGcode_problems" SET tags = ARRAY['string-manipulation', 'binary-math'] WHERE id = 'add-binary';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-search', 'brute-force'] WHERE id = 'find-needle-haystack';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-manipulation'] WHERE id = 'length-of-last-word';
UPDATE public."PGcode_problems" SET tags = ARRAY['prefix-matching'] WHERE id = 'longest-common-prefix';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-manipulation', 'math'] WHERE id = 'roman-to-integer';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'palindrome'] WHERE id = 'valid-palindrome-ii';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-simulation', 'counting'] WHERE id = 'count-and-say';
UPDATE public."PGcode_problems" SET tags = ARRAY['expand-from-center', 'palindrome', 'dp'] WHERE id = 'longest-palindromic-substring';
UPDATE public."PGcode_problems" SET tags = ARRAY['expand-from-center', 'palindrome', 'counting'] WHERE id = 'palindromic-substrings';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-manipulation', 'two-pointer'] WHERE id = 'reverse-words-in-string';
UPDATE public."PGcode_problems" SET tags = ARRAY['string-parsing', 'state-machine'] WHERE id = 'string-to-integer-atoi';

-- TWO POINTERS
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'subsequence'] WHERE id = 'is-subsequence';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'swap'] WHERE id = 'move-zeroes';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'in-place'] WHERE id = 'remove-duplicates-sorted';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'sorted-merge'] WHERE id = 'squares-sorted-array';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'palindrome'] WHERE id = 'valid-palindrome';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'greedy'] WHERE id = 'container-most-water';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'dutch-national-flag'] WHERE id = 'sort-colors';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'sorting', 'dedup'] WHERE id = 'three-sum';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'sorted-array'] WHERE id = 'two-sum-ii';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'monotonic-stack'] WHERE id = 'trapping-rain-water';
UPDATE public."PGcode_problems" SET tags = ARRAY['two-pointer', 'in-place'] WHERE id = 'remove-element';

-- BINARY SEARCH
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'classic'] WHERE id = 'binary-search';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'rotated-array'] WHERE id = 'find-min-rotated';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'search-on-answer'] WHERE id = 'koko-bananas';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'matrix'] WHERE id = 'search-2d-matrix';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'rotated-array'] WHERE id = 'search-rotated';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'bounds'] WHERE id = 'first-last-position';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'design'] WHERE id = 'time-based-key-value';
UPDATE public."PGcode_problems" SET tags = ARRAY['binary-search', 'divide-conquer'] WHERE id = 'median-two-sorted';

-- SLIDING WINDOW
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'max-profit'] WHERE id = 'best-time-to-buy-sell-stock';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'frequency-count'] WHERE id = 'longest-repeating-char';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'hash-set'] WHERE id = 'longest-substr-no-repeat';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'frequency-count', 'permutation'] WHERE id = 'permutation-in-string';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'hash-map', 'shrink-expand'] WHERE id = 'min-window-substring';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'counting'] WHERE id = 'max-consecutive-ones-iii';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'hash-map'] WHERE id = 'fruit-into-baskets';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'prefix-sum'] WHERE id = 'minimum-size-subarray';
UPDATE public."PGcode_problems" SET tags = ARRAY['sliding-window', 'product'] WHERE id = 'subarray-product-less-than-k';

-- STACK
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'matching'] WHERE id = 'valid-parentheses';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'dedup'] WHERE id = 'remove-all-adjacent-duplicates';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'simulation'] WHERE id = 'asteroid-collision';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'monotonic-stack', 'sorting'] WHERE id = 'car-fleet';
UPDATE public."PGcode_problems" SET tags = ARRAY['monotonic-stack', 'next-greater'] WHERE id = 'daily-temperatures';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'recursion', 'string-decoding'] WHERE id = 'decode-string';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'rpn', 'expression'] WHERE id = 'eval-rpn';
UPDATE public."PGcode_problems" SET tags = ARRAY['stack', 'design', 'min-tracking'] WHERE id = 'min-stack';
UPDATE public."PGcode_problems" SET tags = ARRAY['monotonic-stack', 'histogram'] WHERE id = 'largest-rect-histogram';

-- QUEUE
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'stack-to-queue'] WHERE id = 'implement-queue-stacks';
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'sliding-window'] WHERE id = 'moving-average';
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'counting'] WHERE id = 'number-of-recent-calls';
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'counting'] WHERE id = 'number-recent-calls';
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'design', 'circular'] WHERE id = 'design-circular-queue';
UPDATE public."PGcode_problems" SET tags = ARRAY['queue', 'greedy', 'simulation'] WHERE id = 'dota2-senate';
UPDATE public."PGcode_problems" SET tags = ARRAY['deque', 'monotonic-deque', 'sliding-window'] WHERE id = 'sliding-window-maximum';

-- LINKED LIST
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'fast-slow'] WHERE id = 'linked-list-cycle';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'merge'] WHERE id = 'merge-two-sorted';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'reversal'] WHERE id = 'reverse-linked-list';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'carry-math'] WHERE id = 'add-two-numbers';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'hash-map', 'design'] WHERE id = 'lru-cache';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'two-pointer', 'n-ahead'] WHERE id = 'remove-nth-from-end';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'fast-slow', 'reversal'] WHERE id = 'reorder-list';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'pair-swap'] WHERE id = 'swap-nodes-pairs';
UPDATE public."PGcode_problems" SET tags = ARRAY['linked-list', 'heap', 'divide-conquer'] WHERE id = 'merge-k-sorted-lists';

-- TREES
UPDATE public."PGcode_problems" SET tags = ARRAY['tree', 'dfs', 'recursion'] WHERE id = 'invert-binary-tree';
UPDATE public."PGcode_problems" SET tags = ARRAY['tree', 'dfs', 'recursion'] WHERE id = 'max-depth-binary-tree';
UPDATE public."PGcode_problems" SET tags = ARRAY['tree', 'dfs', 'comparison'] WHERE id = 'same-tree';
UPDATE public."PGcode_problems" SET tags = ARRAY['tree', 'dfs', 'subtree-matching'] WHERE id = 'subtree-of-another';
UPDATE public."PGcode_problems" SET tags = ARRAY['tree', 'bfs', 'level-order'] WHERE id = 'level-order-traversal';

-- TRIES
UPDATE public."PGcode_problems" SET tags = ARRAY['trie', 'design'] WHERE id = 'implement-trie';
UPDATE public."PGcode_problems" SET tags = ARRAY['trie', 'dfs', 'wildcard'] WHERE id = 'design-add-search';
UPDATE public."PGcode_problems" SET tags = ARRAY['trie', 'dfs'] WHERE id = 'longest-word-in-dict';
UPDATE public."PGcode_problems" SET tags = ARRAY['trie', 'prefix-replacement'] WHERE id = 'replace-words';
UPDATE public."PGcode_problems" SET tags = ARRAY['trie', 'backtracking', 'matrix'] WHERE id = 'word-search-ii';

-- GRAPHS
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'dfs', 'cloning'] WHERE id = 'clone-graph';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'topological-sort', 'cycle-detection'] WHERE id = 'course-schedule';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'dfs', 'connected-components'] WHERE id = 'num-islands';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'dfs', 'multi-source'] WHERE id = 'pacific-atlantic';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'bfs', 'multi-source'] WHERE id = 'rotting-oranges';

-- HEAP
UPDATE public."PGcode_problems" SET tags = ARRAY['heap', 'min-heap'] WHERE id = 'kth-largest-element';
UPDATE public."PGcode_problems" SET tags = ARRAY['heap', 'simulation'] WHERE id = 'last-stone-weight';
UPDATE public."PGcode_problems" SET tags = ARRAY['heap', 'distance', 'quick-select'] WHERE id = 'k-closest-points';
UPDATE public."PGcode_problems" SET tags = ARRAY['heap', 'greedy', 'cooldown'] WHERE id = 'task-scheduler';

-- RECURSION
UPDATE public."PGcode_problems" SET tags = ARRAY['recursion', 'memoization'] WHERE id = 'fibonacci-number';
UPDATE public."PGcode_problems" SET tags = ARRAY['recursion', 'bit-manipulation'] WHERE id = 'power-of-two';
UPDATE public."PGcode_problems" SET tags = ARRAY['recursion', 'digit-processing'] WHERE id = 'sum-of-digits';
UPDATE public."PGcode_problems" SET tags = ARRAY['recursion', 'divide-conquer', 'fast-exponentiation'] WHERE id = 'pow-x-n';

-- BACKTRACKING
UPDATE public."PGcode_problems" SET tags = ARRAY['backtracking', 'combination', 'dfs'] WHERE id = 'combination-sum';
UPDATE public."PGcode_problems" SET tags = ARRAY['backtracking', 'matrix', 'dfs'] WHERE id = 'word-search';

-- DP
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'fibonacci-pattern'] WHERE id = 'climbing-stairs';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'unbounded-knapsack'] WHERE id = 'coin-change';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'adjacent-exclusion'] WHERE id = 'house-robber';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'patience-sort', 'binary-search'] WHERE id = 'longest-increasing-subseq';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'grid-paths'] WHERE id = 'unique-paths';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'word-break', 'hash-set'] WHERE id = 'word-break';

-- 2D DP
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'edit-distance', 'string-matching'] WHERE id = 'edit-distance';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'lcs', 'subsequence'] WHERE id = 'longest-common-subseq';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'grid-paths', 'min-cost'] WHERE id = 'minimum-path-sum';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'knapsack', 'subset-sum'] WHERE id = 'target-sum';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'grid-paths', 'obstacles'] WHERE id = 'unique-paths-ii';

-- GREEDY
UPDATE public."PGcode_problems" SET tags = ARRAY['greedy', 'circular'] WHERE id = 'gas-station';
UPDATE public."PGcode_problems" SET tags = ARRAY['greedy', 'hash-map', 'grouping'] WHERE id = 'hand-of-straights';
UPDATE public."PGcode_problems" SET tags = ARRAY['greedy', 'dp'] WHERE id = 'jump-game';
UPDATE public."PGcode_problems" SET tags = ARRAY['dp', 'kadane', 'max-subarray'] WHERE id = 'max-subarray';

-- INTERVALS
UPDATE public."PGcode_problems" SET tags = ARRAY['intervals', 'insertion', 'merge'] WHERE id = 'insert-interval';
UPDATE public."PGcode_problems" SET tags = ARRAY['intervals', 'sorting', 'overlap'] WHERE id = 'meeting-rooms';
UPDATE public."PGcode_problems" SET tags = ARRAY['intervals', 'sorting', 'merge'] WHERE id = 'merge-intervals';
UPDATE public."PGcode_problems" SET tags = ARRAY['intervals', 'greedy', 'sorting'] WHERE id = 'non-overlapping-intervals';

-- ADVANCED GRAPHS
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'dijkstra', 'bfs'] WHERE id = 'cheapest-flights';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'dijkstra', 'shortest-path'] WHERE id = 'network-delay';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'topological-sort', 'bfs'] WHERE id = 'alien-dictionary';
UPDATE public."PGcode_problems" SET tags = ARRAY['graph', 'binary-search', 'bfs'] WHERE id = 'swim-in-water';

-- BIT MANIPULATION
UPDATE public."PGcode_problems" SET tags = ARRAY['bit-manipulation', 'dp'] WHERE id = 'counting-bits';
UPDATE public."PGcode_problems" SET tags = ARRAY['bit-manipulation', 'hamming-weight'] WHERE id = 'number-of-1-bits';
UPDATE public."PGcode_problems" SET tags = ARRAY['bit-manipulation', 'reversal'] WHERE id = 'reverse-bits';
UPDATE public."PGcode_problems" SET tags = ARRAY['bit-manipulation', 'xor'] WHERE id = 'single-number';

-- MATH
UPDATE public."PGcode_problems" SET tags = ARRAY['math', 'hash-set', 'cycle-detection'] WHERE id = 'happy-number';
UPDATE public."PGcode_problems" SET tags = ARRAY['matrix', 'rotation', 'in-place'] WHERE id = 'rotate-image';
UPDATE public."PGcode_problems" SET tags = ARRAY['matrix', 'marking', 'in-place'] WHERE id = 'set-matrix-zeroes';
UPDATE public."PGcode_problems" SET tags = ARRAY['matrix', 'simulation', 'spiral'] WHERE id = 'spiral-matrix';

-- GEOMETRY
UPDATE public."PGcode_problems" SET tags = ARRAY['geometry', 'overlap-detection'] WHERE id = 'rectangle-overlap';
UPDATE public."PGcode_problems" SET tags = ARRAY['geometry', 'distance', 'math'] WHERE id = 'valid-square';
