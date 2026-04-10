import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Play, BookOpen, Zap, Clock, Target } from 'lucide-react';
import './LearningsSection.css';

// ─── Topic concept data: structured educational content per topic ───
const TOPIC_CONCEPTS = {
  'arrays': {
    overview: 'Arrays are the foundational data structure in programming. They store elements in contiguous memory locations, providing O(1) random access by index. Understanding arrays is essential before tackling any other data structure.',
    concepts: [
      {
        title: 'Static vs Dynamic Arrays',
        content: 'A static array has a fixed size determined at creation. A dynamic array (like Python\'s list or JavaScript\'s Array) can grow by allocating a new, larger block of memory and copying elements over. This amortized doubling strategy gives O(1) average append.',
        keyPoints: ['O(1) access by index', 'O(n) insert/delete in middle', 'O(1) amortized append for dynamic arrays', 'Cache-friendly due to contiguous memory'],
        complexity: { time: 'Access O(1), Search O(n), Insert O(n)', space: 'O(n)' },
      },
      {
        title: 'Hash Maps & Hash Sets',
        content: 'Hash maps store key-value pairs using a hash function to compute an index into an array of buckets. They provide O(1) average-case lookup, insertion, and deletion. Hash sets are similar but only store keys. Collision handling uses chaining or open addressing.',
        keyPoints: ['O(1) average lookup, insert, delete', 'Hash function maps keys to indices', 'Collisions resolved by chaining or probing', 'Trade memory for speed'],
        complexity: { time: 'Average O(1), Worst O(n)', space: 'O(n)' },
      },
      {
        title: 'Common Patterns',
        content: 'Array problems often use frequency counting (hash maps), prefix sums for range queries, or the two-pass technique. Sorting the array first can simplify many problems from O(n²) to O(n log n).',
        keyPoints: ['Frequency counting with hash maps', 'Prefix sums for range queries', 'Sort first to enable binary search or two pointers', 'In-place operations to achieve O(1) extra space'],
      },
    ],
  },
  'strings': {
    overview: 'Strings are sequences of characters, often treated as arrays of characters. String manipulation is one of the most common interview topics, requiring knowledge of character encoding, pattern matching, and efficient comparison techniques.',
    concepts: [
      {
        title: 'String Fundamentals',
        content: 'Strings in most languages are immutable — each modification creates a new string. This means naive string concatenation in a loop is O(n²). Use StringBuilder (Java), join() (Python), or array-based approaches for efficient building.',
        keyPoints: ['Immutable in Python, Java, JavaScript', 'Concatenation in loop is O(n²)', 'Use join() or StringBuilder for efficient building', 'ASCII values: a=97, A=65, 0=48'],
        complexity: { time: 'Comparison O(n), Concatenation O(n+m)', space: 'O(n) for new string' },
      },
      {
        title: 'Common String Techniques',
        content: 'Character frequency maps solve anagram and permutation problems. Two pointers handle palindrome checks. Sliding window finds substrings with specific properties. String hashing (Rabin-Karp) enables O(n) pattern matching.',
        keyPoints: ['Character frequency counting for anagrams', 'Two pointers from both ends for palindromes', 'Sliding window for substring problems', 'Convert to lowercase/strip non-alphanumeric for normalization'],
      },
    ],
  },
  'stack': {
    overview: 'A stack is a Last-In-First-Out (LIFO) data structure. Think of a stack of plates — you add and remove from the top. Stacks are fundamental for parsing expressions, backtracking, and maintaining state in recursive algorithms.',
    concepts: [
      {
        title: 'Stack Operations',
        content: 'The core operations are push (add to top), pop (remove from top), and peek (view top without removing). All three are O(1). Stacks can be implemented with arrays or linked lists.',
        keyPoints: ['Push, Pop, Peek — all O(1)', 'LIFO ordering', 'Used for function call stacks in recursion', 'Implemented with array or linked list'],
        complexity: { time: 'Push O(1), Pop O(1), Peek O(1)', space: 'O(n)' },
      },
      {
        title: 'Monotonic Stack',
        content: 'A monotonic stack maintains elements in sorted order (increasing or decreasing). When a new element violates the order, elements are popped until the invariant is restored. This pattern solves "next greater element" and "daily temperatures" type problems in O(n).',
        keyPoints: ['Maintains sorted order (increasing or decreasing)', 'Each element pushed and popped at most once → O(n) total', 'Solves next greater/smaller element problems', 'Used in histogram and stock span problems'],
      },
      {
        title: 'Expression Evaluation',
        content: 'Stacks naturally evaluate parenthesized expressions and Reverse Polish Notation (RPN). For matching brackets, push opening brackets and pop when closing brackets appear. For RPN, push numbers and apply operators to the top two elements.',
        keyPoints: ['Bracket matching: push open, pop on close', 'RPN: push numbers, pop two for operators', 'Infix to postfix conversion uses operator precedence', 'Nested structure problems map to stack depth'],
      },
    ],
  },
  'queue': {
    overview: 'A queue is a First-In-First-Out (FIFO) data structure. Like a line at a store — first person in is first person served. Queues are essential for BFS traversal, scheduling, and buffering.',
    concepts: [
      {
        title: 'Queue Operations & Variants',
        content: 'Core operations: enqueue (add to back), dequeue (remove from front), both O(1). A deque (double-ended queue) allows insertion and removal from both ends. Priority queues order elements by priority rather than arrival time.',
        keyPoints: ['Enqueue O(1), Dequeue O(1)', 'FIFO ordering', 'Deque: insert/remove from both ends', 'BFS uses a queue to explore level by level'],
        complexity: { time: 'Enqueue O(1), Dequeue O(1)', space: 'O(n)' },
      },
      {
        title: 'BFS with Queues',
        content: 'Breadth-First Search uses a queue to explore nodes level by level. Start by enqueuing the root/source, then repeatedly dequeue a node, process it, and enqueue its unvisited neighbors. This guarantees shortest path in unweighted graphs.',
        keyPoints: ['Level-order traversal of trees', 'Shortest path in unweighted graphs', 'Multi-source BFS for "rotting oranges" type problems', 'Track visited nodes to avoid cycles'],
      },
    ],
  },
  'linkedlist': {
    overview: 'A linked list stores elements in nodes, where each node contains data and a pointer to the next node. Unlike arrays, linked lists allow O(1) insertion/deletion at known positions but sacrifice random access.',
    concepts: [
      {
        title: 'Singly vs Doubly Linked Lists',
        content: 'A singly linked list has nodes with a next pointer only — traversal goes one direction. A doubly linked list adds a prev pointer, enabling backward traversal. Doubly linked lists are used in LRU caches and browser history.',
        keyPoints: ['O(1) insert/delete at head', 'O(n) access by index (no random access)', 'Doubly linked allows O(1) delete if node reference known', 'Sentinel/dummy head node simplifies edge cases'],
        complexity: { time: 'Access O(n), Insert at head O(1)', space: 'O(n)' },
      },
      {
        title: 'Common Techniques',
        content: 'The fast-and-slow pointer technique detects cycles (Floyd\'s algorithm) and finds the middle node. Reversing a linked list is a fundamental operation done iteratively by re-pointing next pointers. Merging two sorted lists is key for merge sort on linked lists.',
        keyPoints: ['Fast/slow pointers for cycle detection and midpoint', 'Iterative reversal: prev, current, next pattern', 'Dummy head to simplify insert/delete at head', 'Runner technique for kth-from-end problems'],
      },
    ],
  },
  'two-pointers': {
    overview: 'Two pointers is a technique where two indices traverse a data structure simultaneously. It reduces brute-force O(n²) solutions to O(n) by eliminating redundant comparisons. The array is usually sorted.',
    concepts: [
      {
        title: 'Opposite-Direction Pointers',
        content: 'Place one pointer at the start and one at the end. Move them toward each other based on a condition. Classic use: Two Sum on sorted array — if sum is too small, move left pointer right; if too large, move right pointer left.',
        keyPoints: ['Requires sorted input', 'O(n) time instead of O(n²) brute force', 'Three Sum: fix one, two-pointer on rest', 'Container With Most Water: move shorter side inward'],
        complexity: { time: 'O(n) single pass', space: 'O(1)' },
      },
      {
        title: 'Same-Direction Pointers',
        content: 'Both pointers start at the beginning and move right. One pointer (fast) explores ahead while the other (slow) marks a position. Used for removing duplicates in-place, partitioning, and the sliding window technique.',
        keyPoints: ['Remove duplicates: slow marks write position', 'Partition: Dutch National Flag algorithm', 'Linked list: find cycle, find middle', 'Often combined with sorting for optimal solutions'],
      },
    ],
  },
  'binary-search': {
    overview: 'Binary search halves the search space each step, achieving O(log n) time on sorted data. Beyond simple element lookup, it can be applied to any monotonic function to find boundaries and optimal values.',
    concepts: [
      {
        title: 'Classic Binary Search',
        content: 'Maintain low and high bounds. Compute mid = (low + high) // 2. Compare target with arr[mid]: if equal, found; if target < arr[mid], search left half; otherwise search right half. Terminates when low > high.',
        keyPoints: ['O(log n) time, O(1) space', 'Array must be sorted', 'Watch for integer overflow: use low + (high - low) // 2', 'Left-biased vs right-biased for duplicate handling'],
        complexity: { time: 'O(log n)', space: 'O(1)' },
      },
      {
        title: 'Binary Search on Answer',
        content: 'When the problem asks "what is the minimum/maximum value that satisfies a condition?", binary search on the answer space. Define a feasibility function that returns true/false, then find the boundary. Examples: Koko eating bananas, minimum capacity to ship packages.',
        keyPoints: ['Define search space: [min_possible, max_possible]', 'Write a feasibility/check function', 'Binary search to find the boundary', 'Works whenever feasibility is monotonic'],
      },
      {
        title: 'Rotated Array Variations',
        content: 'In a rotated sorted array, one half is always sorted. Compare arr[mid] with arr[low] to determine which half is sorted, then check if target lies in the sorted half. This pattern handles both search and find-minimum variants.',
        keyPoints: ['One half is always sorted after rotation', 'Compare mid with endpoints to identify sorted half', 'Find minimum: search toward unsorted half', 'Handle duplicates by shrinking bounds'],
      },
    ],
  },
  'sliding-window': {
    overview: 'The sliding window technique maintains a window (subarray/substring) that expands and contracts as it slides through the input. It converts O(n²) brute-force substring/subarray problems into O(n).',
    concepts: [
      {
        title: 'Fixed-Size Window',
        content: 'When the window size k is given, maintain a window of exactly k elements. Slide by adding the next element and removing the leftmost. Track running sum, max, or frequency map as the window moves.',
        keyPoints: ['Window size k is constant', 'Add right element, remove left element each step', 'Maintain running aggregate (sum, max, count)', 'O(n) time with O(1) or O(k) space'],
        complexity: { time: 'O(n)', space: 'O(1) or O(k)' },
      },
      {
        title: 'Variable-Size Window',
        content: 'Expand the window by moving the right pointer. When a constraint is violated, shrink by moving the left pointer. Track the optimal window seen so far. Used for "longest substring without repeating characters" and "minimum window substring" type problems.',
        keyPoints: ['Right pointer expands, left pointer contracts', 'Maintain a frequency map or counter', 'Update answer when window is valid', 'Each element added and removed at most once → O(n)'],
        complexity: { time: 'O(n)', space: 'O(k) where k = alphabet/unique elements' },
      },
    ],
  },
  'trees': {
    overview: 'Trees are hierarchical data structures with a root node and child nodes. Binary trees (at most 2 children per node) and Binary Search Trees (left < root < right) are the most common. Tree problems are fundamentally recursive.',
    concepts: [
      {
        title: 'Tree Traversals',
        content: 'Inorder (left, root, right) gives sorted order for BSTs. Preorder (root, left, right) is used for serialization and copying. Postorder (left, right, root) processes children before parent — useful for deletion and height calculation. Level-order uses BFS.',
        keyPoints: ['Inorder on BST → sorted output', 'Preorder for tree serialization', 'Postorder for bottom-up computations (height, delete)', 'Level-order (BFS) for breadth-first problems'],
        complexity: { time: 'O(n) for all traversals', space: 'O(h) where h = height' },
      },
      {
        title: 'BST Properties',
        content: 'In a BST, for every node: all values in the left subtree are less, and all values in the right subtree are greater. This enables O(log n) search, insert, and delete in balanced trees. Validation requires passing min/max bounds through recursion.',
        keyPoints: ['Search, Insert, Delete: O(log n) balanced, O(n) worst', 'Validate BST using min/max range at each node', 'Inorder successor: leftmost node in right subtree', 'Self-balancing variants: AVL, Red-Black trees'],
      },
      {
        title: 'Common Tree Patterns',
        content: 'Most tree problems follow one of: compute a value bottom-up (height, diameter), pass information top-down (path sum), or construct a tree from traversals. DFS is the natural approach for tree problems.',
        keyPoints: ['DFS recursion: base case at null node', 'Height = 1 + max(left_height, right_height)', 'Diameter passes through root of some subtree', 'Lowest Common Ancestor: where paths to targets diverge'],
      },
    ],
  },
  'tries': {
    overview: 'A trie (prefix tree) is a tree-like data structure for storing strings where each node represents a character. Tries enable efficient prefix matching, autocomplete, and word search operations.',
    concepts: [
      {
        title: 'Trie Structure',
        content: 'Each node has a map of children (character → node) and a boolean marking word ends. To insert a word, traverse/create nodes character by character. To search, traverse and check if the end node is marked. Prefix search just checks if the path exists.',
        keyPoints: ['Insert, Search, Prefix: O(m) where m = word length', 'Space: O(n × m) worst case for n words of length m', 'Each node has up to 26 children (lowercase English)', 'is_end flag marks complete words'],
        complexity: { time: 'O(m) per operation, m = word length', space: 'O(n × m)' },
      },
      {
        title: 'Applications',
        content: 'Tries power autocomplete systems, spell checkers, and IP routing tables. Combined with DFS/backtracking, they solve word search on boards and word break problems efficiently by pruning branches that don\'t match any prefix.',
        keyPoints: ['Autocomplete: traverse to prefix, DFS from there', 'Word search + trie: prune invalid paths early', 'Replace hash set lookups for prefix-heavy problems', 'Can store counts for frequency-based queries'],
      },
    ],
  },
  'graphs': {
    overview: 'Graphs model relationships between entities. They consist of vertices (nodes) and edges (connections). Graphs can be directed or undirected, weighted or unweighted, and are represented as adjacency lists or matrices.',
    concepts: [
      {
        title: 'Graph Representations',
        content: 'An adjacency list maps each node to its list of neighbors — space efficient for sparse graphs. An adjacency matrix uses a 2D array where matrix[i][j] indicates an edge — better for dense graphs or when edge existence checks are frequent.',
        keyPoints: ['Adjacency list: O(V + E) space', 'Adjacency matrix: O(V²) space', 'List is better for sparse graphs (most real-world)', 'Matrix enables O(1) edge existence check'],
      },
      {
        title: 'DFS and BFS',
        content: 'DFS explores as deep as possible before backtracking — uses a stack (or recursion). BFS explores level by level — uses a queue. DFS is natural for path finding and cycle detection. BFS finds shortest paths in unweighted graphs.',
        keyPoints: ['DFS: stack/recursion, O(V + E) time', 'BFS: queue, O(V + E) time, shortest path', 'Track visited set to avoid infinite loops', 'Connected components: run DFS/BFS from each unvisited node'],
        complexity: { time: 'O(V + E)', space: 'O(V)' },
      },
      {
        title: 'Common Graph Patterns',
        content: 'Number of islands = connected components on a grid. Topological sort orders nodes in a DAG respecting dependencies. Cycle detection uses DFS with a "visiting" state. Union-Find efficiently tracks connected components.',
        keyPoints: ['Grid problems: treat cells as nodes, 4-directional neighbors as edges', 'Topological sort: only for DAGs (directed acyclic graphs)', 'Cycle detection: 3 states — unvisited, visiting, visited', 'Union-Find with path compression and rank: near O(1) per op'],
      },
    ],
  },
  'heap': {
    overview: 'A heap is a complete binary tree that satisfies the heap property: in a min-heap, every parent is less than or equal to its children. Heaps efficiently support finding and extracting the minimum (or maximum) element.',
    concepts: [
      {
        title: 'Heap Operations',
        content: 'Insert: add element at the end, bubble up. Extract-min/max: remove root, move last element to root, bubble down. Heapify an array in O(n) by bubbling down from the last non-leaf node upward.',
        keyPoints: ['Insert: O(log n)', 'Extract min/max: O(log n)', 'Peek min/max: O(1)', 'Build heap from array: O(n)'],
        complexity: { time: 'Insert/Extract O(log n), Peek O(1)', space: 'O(n)' },
      },
      {
        title: 'Priority Queue Applications',
        content: 'Priority queues (implemented with heaps) solve "K-th largest/smallest" problems, merge K sorted lists, and optimize greedy algorithms. Use a max-heap of size K for the K-th largest, or a min-heap for the K-th smallest.',
        keyPoints: ['K-th largest: min-heap of size K', 'Merge K sorted: min-heap of K elements', 'Task scheduling with cooldowns', 'Two heaps (max + min) for running median'],
      },
    ],
  },
  'recursion': {
    overview: 'Recursion is a method where a function calls itself to solve smaller subproblems. Every recursive solution needs a base case (stopping condition) and a recursive case that moves toward the base case.',
    concepts: [
      {
        title: 'Recursion Fundamentals',
        content: 'Think of recursion as breaking a problem into: (1) the simplest case you can solve directly (base case), and (2) how to reduce any case to a simpler one (recursive case). The call stack tracks each recursive call\'s local state.',
        keyPoints: ['Base case prevents infinite recursion', 'Each call has its own local variables on the stack', 'Stack depth = recursion depth → O(h) space', 'Tail recursion can be optimized by some compilers'],
        complexity: { time: 'Depends on branching factor and depth', space: 'O(depth) for call stack' },
      },
      {
        title: 'Recursion to DP Pipeline',
        content: 'Many recursive solutions have overlapping subproblems — the same inputs are computed multiple times. Adding memoization (caching results) converts exponential recursion to polynomial DP. This is the "top-down" approach to dynamic programming.',
        keyPoints: ['Identify overlapping subproblems', 'Add memo dict/array to cache results', 'Top-down (memoization) vs bottom-up (tabulation)', 'Draw the recursion tree to visualize redundancy'],
      },
    ],
  },
  'dp': {
    overview: 'Dynamic Programming optimizes recursive solutions by storing results of subproblems to avoid redundant computation. It applies when a problem has optimal substructure (optimal solution built from optimal sub-solutions) and overlapping subproblems.',
    concepts: [
      {
        title: 'DP Framework',
        content: 'To solve a DP problem: (1) Define the state — what variables uniquely identify a subproblem. (2) Define the transition — how to compute a state from smaller states. (3) Define the base case. (4) Determine computation order.',
        keyPoints: ['State: what info do you need to make a decision?', 'Transition: recurrence relation between states', 'Base case: smallest subproblem with known answer', 'Top-down (memo) or bottom-up (tabulation)'],
      },
      {
        title: 'Common DP Patterns',
        content: 'Linear DP: dp[i] depends on previous indices (climbing stairs, house robber). Knapsack: include/exclude decisions (coin change, target sum). String DP: dp[i][j] for two strings (edit distance, LCS). Interval DP: dp[i][j] for subarray [i..j].',
        keyPoints: ['1D DP: fibonacci, climbing stairs, house robber', '0/1 Knapsack: coin change, target sum, subset sum', 'String matching: LCS, edit distance', 'Space optimization: often only need previous row/state'],
        complexity: { time: 'O(states × transition cost)', space: 'O(states), often reducible' },
      },
    ],
  },
  'backtracking': {
    overview: 'Backtracking systematically explores all possible solutions by building candidates incrementally and abandoning ("backtracking") candidates that cannot lead to a valid solution. It\'s a refined brute-force approach.',
    concepts: [
      {
        title: 'Backtracking Template',
        content: 'The pattern: (1) Choose — add an element to the current candidate. (2) Explore — recurse to extend the candidate. (3) Unchoose — remove the element and try the next option. Base case: when the candidate meets the goal, record it.',
        keyPoints: ['Choose → Explore → Unchoose pattern', 'Base case: candidate is complete or valid', 'Pruning: skip branches that can\'t lead to solutions', 'Time typically exponential: O(2ⁿ) or O(n!)'],
      },
      {
        title: 'Subsets, Permutations, Combinations',
        content: 'Subsets: at each index, include or exclude the element (2ⁿ subsets). Permutations: at each position, try all remaining elements (n! permutations). Combinations: like subsets but with a target size. The key difference is whether order matters and whether reuse is allowed.',
        keyPoints: ['Subsets: include/exclude → 2ⁿ total', 'Permutations: arrange all → n! total', 'Combinations: choose k from n → C(n,k) total', 'Sort input to handle duplicates and enable pruning'],
      },
    ],
  },
  'greedy': {
    overview: 'Greedy algorithms make the locally optimal choice at each step, hoping to find the global optimum. They work when the problem has the greedy-choice property: a locally optimal choice is part of some globally optimal solution.',
    concepts: [
      {
        title: 'Greedy Strategy',
        content: 'At each step, make the choice that looks best right now without considering future consequences. Greedy works for problems like interval scheduling (pick earliest ending), Huffman coding, and many graph algorithms (Dijkstra\'s, Prim\'s).',
        keyPoints: ['Sort by the greedy criterion first', 'Process items one by one, making the best local choice', 'Prove correctness by exchange argument or contradiction', 'If greedy doesn\'t work, try DP instead'],
      },
      {
        title: 'Common Greedy Problems',
        content: 'Jump Game: track the farthest reachable index. Gas Station: track running surplus. Task Scheduler: handle most frequent tasks first. These all share the pattern of maintaining a greedy invariant while scanning left to right.',
        keyPoints: ['Interval problems: sort by end time', 'Jump Game: greedy farthest reach', 'Gas Station: running sum of (gas - cost)', 'Activity selection: always pick earliest finish'],
        complexity: { time: 'Usually O(n log n) due to sorting', space: 'O(1) extra' },
      },
    ],
  },
  'intervals': {
    overview: 'Interval problems deal with ranges [start, end]. The key insight is almost always to sort intervals first — typically by start time, sometimes by end time — then scan through them maintaining merged/active intervals.',
    concepts: [
      {
        title: 'Merge & Insert Intervals',
        content: 'To merge overlapping intervals: sort by start, then iterate. If the current interval overlaps the previous, extend the previous. Otherwise, start a new group. Inserting a new interval follows the same logic after adding it to the list.',
        keyPoints: ['Sort by start time', 'Overlap check: a.end >= b.start', 'Merge: update end to max(a.end, b.end)', 'Insert: find position, merge affected intervals'],
        complexity: { time: 'O(n log n) for sorting', space: 'O(n) for result' },
      },
      {
        title: 'Interval Scheduling',
        content: 'To find the maximum number of non-overlapping intervals, sort by end time and greedily pick the earliest-ending interval that doesn\'t overlap the last picked. For minimum meeting rooms, use a min-heap tracking end times of active meetings.',
        keyPoints: ['Non-overlapping max: sort by end, greedy pick', 'Min rooms: sort by start, heap of end times', 'Erase minimum overlaps: total - max non-overlapping', 'Sweep line for complex interval intersection problems'],
      },
    ],
  },
  '2d-dp': {
    overview: '2D Dynamic Programming extends 1D DP by using a 2D table where dp[i][j] represents the optimal solution for some two-dimensional subproblem. Common in string matching, grid paths, and knapsack variants.',
    concepts: [
      {
        title: '2D DP Patterns',
        content: 'Grid DP: dp[i][j] = best value to reach cell (i,j). String DP: dp[i][j] = answer for s1[0..i] and s2[0..j]. Fill the table row by row, using previously computed values. Space can often be reduced to O(n) by keeping only the previous row.',
        keyPoints: ['Grid paths: dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'LCS: dp[i][j] from dp[i-1][j-1], dp[i-1][j], dp[i][j-1]', 'Edit distance: insert, delete, replace choices', 'Space optimization: keep only previous row'],
        complexity: { time: 'O(m × n)', space: 'O(m × n), reducible to O(n)' },
      },
    ],
  },
  'advanced-graphs': {
    overview: 'Advanced graph algorithms handle weighted shortest paths, minimum spanning trees, and complex connectivity problems. They build on BFS/DFS foundations with additional data structures like priority queues and union-find.',
    concepts: [
      {
        title: 'Shortest Path Algorithms',
        content: 'Dijkstra\'s finds shortest paths from a source in non-negative weighted graphs using a min-heap. Bellman-Ford handles negative weights in O(V×E). For K-stop constrained paths, modified Bellman-Ford or BFS with distance tracking works.',
        keyPoints: ['Dijkstra: O((V+E) log V) with min-heap', 'Bellman-Ford: O(V×E), handles negative weights', 'Floyd-Warshall: O(V³), all-pairs shortest paths', 'K-stops constraint: BFS with level tracking'],
        complexity: { time: 'Dijkstra O((V+E)logV)', space: 'O(V)' },
      },
      {
        title: 'Minimum Spanning Tree',
        content: 'Kruskal\'s: sort edges by weight, add to MST if it doesn\'t create a cycle (use Union-Find). Prim\'s: grow MST from a starting node using a min-heap to always add the cheapest edge to an unvisited node.',
        keyPoints: ['Kruskal: sort edges + Union-Find, O(E log E)', 'Prim: min-heap + visited set, O((V+E) log V)', 'MST has exactly V-1 edges', 'Swim in Rising Water: binary search + BFS, or Dijkstra-like'],
      },
    ],
  },
  'math': {
    overview: 'Math-based problems test number theory, digit manipulation, and mathematical properties. They often have elegant O(1) or O(log n) solutions that avoid brute force.',
    concepts: [
      {
        title: 'Number Theory Basics',
        content: 'Modular arithmetic, GCD (Euclidean algorithm), prime sieve, and power of 2 checks are common building blocks. Happy numbers use cycle detection (Floyd\'s). Digit sum problems use modular arithmetic.',
        keyPoints: ['GCD: Euclidean algorithm, O(log n)', 'Power of 2: n & (n-1) == 0', 'Happy number: detect cycle with fast/slow pointers', 'Modular arithmetic for large number problems'],
      },
    ],
  },
  'bit-manipulation': {
    overview: 'Bit manipulation operates directly on the binary representation of numbers using bitwise operators (AND, OR, XOR, NOT, shifts). It enables O(1) operations that would otherwise require loops.',
    concepts: [
      {
        title: 'Bitwise Operations',
        content: 'AND (&) masks bits. OR (|) sets bits. XOR (^) toggles bits and has special properties: a ^ a = 0, a ^ 0 = a. Left shift (<<) multiplies by 2. Right shift (>>) divides by 2. These operations work in O(1) time.',
        keyPoints: ['XOR: a ^ a = 0 (find single number)', 'AND with mask: check/clear specific bits', 'n & (n-1): removes lowest set bit', 'Count set bits: Brian Kernighan\'s algorithm'],
        complexity: { time: 'O(1) per operation', space: 'O(1)' },
      },
      {
        title: 'Common Patterns',
        content: 'Single Number: XOR all elements, pairs cancel out. Counting bits: use dp[i] = dp[i >> 1] + (i & 1). Reverse bits: swap bits from both ends. Power of 2: exactly one bit set.',
        keyPoints: ['Single number: XOR all → unpaired remains', 'Count bits for 0..n: DP using dp[i>>1]', 'Reverse bits: iterate 32 times, build result', 'Subsets via bitmask: iterate 0 to 2ⁿ-1'],
      },
    ],
  },
  'geometry': {
    overview: 'Geometry problems in coding interviews involve coordinate math, distance calculations, and spatial reasoning. They require careful handling of floating point precision and edge cases.',
    concepts: [
      {
        title: 'Distance & Closest Points',
        content: 'Euclidean distance: sqrt((x1-x2)² + (y1-y2)²). For comparison, use squared distance to avoid sqrt. K closest points: use a max-heap of size K with squared distances. Manhattan distance: |x1-x2| + |y1-y2|.',
        keyPoints: ['Use squared distance for comparisons (avoid sqrt)', 'K closest: max-heap of size K', 'Manhattan distance for grid problems', 'Cross product for orientation/area calculations'],
      },
    ],
  },
};

export default function LearningsSection({ topicId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('PGcode_topic_videos')
          .select('*')
          .eq('topic_id', topicId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        // Deduplicate by youtube_video_id
        const seen = new Set();
        const unique = (data || []).filter(v => {
          if (seen.has(v.youtube_video_id)) return false;
          seen.add(v.youtube_video_id);
          return true;
        });
        setVideos(unique);
      } catch (err) {
        console.error('Error fetching learning videos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [topicId]);

  if (loading) {
    return <div className="learnings-loading">Loading content...</div>;
  }

  const topicData = TOPIC_CONCEPTS[topicId];

  // Fallback if no concept data for this topic
  if (!topicData) {
    return (
      <div className="learnings-section">
        <p className="learnings-intro">
          Learning resources for this topic.
        </p>
        {videos.length > 0 && (
          <div className="video-list">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} expandedId={expandedId} onToggle={setExpandedId} />
            ))}
          </div>
        )}
        {videos.length === 0 && (
          <div className="learnings-empty">
            <p>No learning resources available for this topic yet.</p>
          </div>
        )}
      </div>
    );
  }

  // Interleave concepts and videos: concept, video, concept, video, ...
  const concepts = topicData.concepts || [];
  const sections = [];

  for (let i = 0; i < Math.max(concepts.length, videos.length); i++) {
    if (i < concepts.length) {
      sections.push({ type: 'concept', data: concepts[i], idx: i });
    }
    if (i < videos.length) {
      sections.push({ type: 'video', data: videos[i], idx: i });
    }
  }

  return (
    <div className="learnings-section">
      {/* Overview */}
      <div className="learnings-overview">
        <div className="overview-icon"><BookOpen size={20} /></div>
        <p className="overview-text">{topicData.overview}</p>
      </div>

      {/* Interleaved concepts + videos */}
      {sections.map((section, i) => {
        if (section.type === 'concept') {
          return <ConceptCard key={`c-${section.idx}`} concept={section.data} />;
        }
        return <VideoCard key={`v-${section.data.id}`} video={section.data} expandedId={expandedId} onToggle={setExpandedId} />;
      })}
    </div>
  );
}

function ConceptCard({ concept }) {
  return (
    <div className="concept-card">
      <h3 className="concept-title">{concept.title}</h3>
      <p className="concept-content">{concept.content}</p>

      {concept.keyPoints && (
        <div className="concept-keypoints">
          <div className="keypoints-label"><Zap size={13} /> Key Points</div>
          <ul className="keypoints-list">
            {concept.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {concept.complexity && (
        <div className="concept-complexity">
          <div className="complexity-item">
            <Clock size={12} />
            <span className="complexity-label">Time:</span>
            <span className="complexity-value">{concept.complexity.time}</span>
          </div>
          <div className="complexity-item">
            <Target size={12} />
            <span className="complexity-label">Space:</span>
            <span className="complexity-value">{concept.complexity.space}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, expandedId, onToggle }) {
  return (
    <div className="video-card">
      {expandedId === video.id ? (
        <div className="video-embed">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="video-thumbnail" onClick={() => onToggle(video.id)}>
          <img
            src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
            alt={video.title}
            loading="lazy"
          />
          <div className="play-overlay">
            <Play size={32} />
          </div>
        </div>
      )}
      <div className="video-info">
        <span className="video-title">{video.title}</span>
        <span className="video-source">{video.source === 'neetcode' ? 'NeetCode' : 'Learning Resource'}</span>
      </div>
    </div>
  );
}
