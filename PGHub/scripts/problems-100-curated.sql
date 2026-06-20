-- PGcode 100: curated subset of the original 200 marking the most important
-- interview-prep problems. Idempotent: re-running is a no-op once IDs match.
--
-- Every listed ID already exists in PGcode_problems (verified upfront). The
-- problems retain their full 4-language templates and reference solutions.
-- The cumulative UI filter still surfaces them in the 200/300/500 views.

BEGIN;

UPDATE public."PGcode_problems"
SET roadmap_set = '100'
WHERE id IN (
  -- Arrays & Hashing (8)
  'two-sum','contains-duplicate','valid-anagram','group-anagrams',
  'top-k-frequent','product-except-self','longest-consecutive','encode-decode-strings',

  -- Two Pointers (5)
  'valid-palindrome','two-sum-ii','three-sum','container-most-water','trapping-rain-water',

  -- Sliding Window (5)
  'best-time-to-buy-sell-stock','longest-substr-no-repeat','longest-repeating-char',
  'min-window-substring','permutation-in-string',

  -- Stack (6)
  'valid-parentheses','min-stack','eval-rpn','daily-temperatures',
  'car-fleet','largest-rect-histogram',

  -- Binary Search (5)
  'binary-search','search-2d-matrix','koko-bananas','find-min-rotated','search-rotated',

  -- Linked List (7)
  'reverse-linked-list','merge-two-sorted','linked-list-cycle','reorder-list',
  'remove-nth-from-end','lru-cache','merge-k-sorted-lists',

  -- Trees (9)
  'invert-binary-tree','max-depth-binary-tree','balanced-binary-tree','same-tree',
  'subtree-of-another','lowest-common-ancestor','level-order-traversal',
  'validate-bst','kth-smallest-bst',

  -- Tries (3)
  'implement-trie','design-add-search','word-search-ii',

  -- Heap / Priority Queue (4)
  'kth-largest-element','last-stone-weight','k-closest-points','task-scheduler',

  -- Backtracking (7)
  'subsets','combination-sum','permutations','word-search',
  'palindrome-partitioning','letter-combinations','n-queens',

  -- Graphs (7)
  'num-islands','clone-graph','pacific-atlantic','course-schedule',
  'course-schedule-ii','rotting-oranges','redundant-connection',

  -- Advanced Graphs (3)
  'network-delay','swim-in-water','cheapest-flights',

  -- 1-D DP (8)
  'climbing-stairs','house-robber','house-robber-ii','longest-palindromic-substring',
  'palindromic-substrings','decode-ways','coin-change','longest-increasing-subseq',

  -- 2-D DP (5)
  'unique-paths','longest-common-subseq','edit-distance','target-sum','word-break',

  -- Greedy (4)
  'max-subarray','jump-game','jump-game-ii','gas-station',

  -- Intervals (5)
  'insert-interval','merge-intervals','non-overlapping-intervals','meeting-rooms','minimum-arrows',

  -- Math & Geometry (5)
  'rotate-image','spiral-matrix','set-matrix-zeroes','happy-number','pow-x-n',

  -- Bit Manipulation (4)
  'single-number','number-of-1-bits','counting-bits','reverse-bits'
);

COMMIT;
