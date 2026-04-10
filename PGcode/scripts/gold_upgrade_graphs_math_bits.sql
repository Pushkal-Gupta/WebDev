-- Gold upgrade: graphs (5) + advanced-graphs (4) + math (4) + bit-manipulation (4)
BEGIN;

-- ============== graphs ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a reference of a node in a connected undirected graph, return a <strong>deep copy</strong> (clone) of the graph. Each node contains a value and a list of its neighbors.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
Explanation: 4 nodes forming a cycle 1-2-3-4-1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  adjList = [[]]
Output: [[]]
Explanation: One node with no neighbors.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The number of nodes is in the range <code>[0, 100]</code>.</li>
  <li>The graph is connected and undirected.</li>
</ul>
$$,
  hints = ARRAY[
    'DFS or BFS with a hash map { original_node : cloned_node } to avoid revisiting and to wire up cycles.',
    'On first visit, create the clone, store the mapping, then recurse on each neighbor and append the cloned neighbor.',
    'On revisit, simply return the existing clone — that''s how cycles are handled correctly.'
  ]
WHERE id = 'clone-graph';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an <code>m x n</code> 2D binary grid <code>grid</code> which represents a map of <code>'1'</code>s (land) and <code>'0'</code>s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]
Output: 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]
Output: 3</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == grid.length</code>, <code>n == grid[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 300</code></li>
</ul>
$$,
  hints = ARRAY[
    'Walk every cell. When you find a "1", increment the island counter and DFS/BFS to flood-fill the entire connected component.',
    'Mark visited land by overwriting "1" with "0" (or use a separate visited set).',
    'Total work O(m * n) — each cell is processed at most twice.'
  ]
WHERE id = 'num-islands';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There are a total of <code>numCourses</code> courses you have to take, labeled from <code>0</code> to <code>numCourses - 1</code>. You are given an array <code>prerequisites</code> where <code>prerequisites[i] = [a, b]</code> means you must take course <code>b</code> before course <code>a</code>. Return <code>true</code> if you can finish all courses.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  numCourses = 2, prerequisites = [[1,0]]
Output: true
Explanation: Take course 0, then 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Explanation: A cycle exists.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= numCourses &lt;= 2000</code></li>
  <li><code>0 &lt;= prerequisites.length &lt;= 5000</code></li>
</ul>
$$,
  hints = ARRAY[
    'This is cycle detection on a directed graph. If there''s a cycle, you can''t finish.',
    'Topological sort via Kahn''s algorithm: compute in-degrees, push all 0-degree nodes into a queue, pop and decrement neighbors.',
    'Alternative: DFS with three colors (unvisited / on-stack / done). Encountering an on-stack node means a cycle.'
  ]
WHERE id = 'course-schedule';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an <code>m x n</code> grid where each cell can have one of three values: <code>0</code> empty, <code>1</code> fresh orange, or <code>2</code> rotten orange. Every minute, any fresh orange that is adjacent (4-directionally) to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return <code>-1</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  grid = [[2,1,1],[1,1,0],[0,1,1]]
Output: 4</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  grid = [[2,1,1],[0,1,1],[1,0,1]]
Output: -1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == grid.length</code>, <code>n == grid[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 10</code></li>
</ul>
$$,
  hints = ARRAY[
    'Multi-source BFS: seed the queue with EVERY initially rotten cell at minute 0.',
    'Process the queue level by level; each level is one minute. Mark visited fresh cells as rotten and decrement the fresh count.',
    'After BFS, return the elapsed minutes if fresh count is 0, otherwise -1.'
  ]
WHERE id = 'rotting-oranges';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There is an <code>m x n</code> rectangular island that borders both the Pacific Ocean and the Atlantic Ocean. The Pacific touches the top and left edges; the Atlantic touches the bottom and right edges. You are given an <code>m x n</code> integer matrix <code>heights</code>. Water can flow from a cell to an adjacent one if the neighbor''s height is <strong>less than or equal</strong> to the current cell''s height. Return a list of grid coordinates where rain water can flow to BOTH oceans.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  heights = [[1]]
Output: [[0,0]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == heights.length</code>, <code>n == heights[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 200</code></li>
</ul>
$$,
  hints = ARRAY[
    'Reverse the flow: start from each ocean''s border cells and do BFS/DFS UPHILL (neighbor height >= current).',
    'Build two reachability sets — one for Pacific, one for Atlantic.',
    'The answer is the intersection of those two sets. O(m * n) time.'
  ]
WHERE id = 'pacific-atlantic';

-- ============== advanced-graphs ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given a list of strings <code>words</code> from an alien language''s dictionary, where the strings in <code>words</code> are <strong>sorted lexicographically</strong> by the rules of this language. Derive any order of letters of the alien language that is consistent with this. If no valid order exists, return <code>""</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  words = ["z","x","z"]
Output: ""
Explanation: Order is invalid → return empty string.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= words.length &lt;= 100</code></li>
  <li><code>1 &lt;= words[i].length &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'Build a directed graph: compare each adjacent pair of words; the first differing characters give an edge a → b.',
    'Edge case: if word A is a prefix of word B but A comes AFTER B (e.g. ["abc","ab"]), the ordering is invalid — return "".',
    'Run topological sort (Kahn''s or DFS). If a cycle exists return ""; otherwise return the topo order joined into a string.'
  ]
WHERE id = 'alien-dictionary';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given a network of <code>n</code> nodes, labeled from <code>1</code> to <code>n</code>. You are also given <code>times</code>, a list of travel times as directed edges <code>times[i] = [u, v, w]</code>, where <code>u</code> is the source, <code>v</code> is the target, and <code>w</code> is the time it takes for a signal to travel from <code>u</code> to <code>v</code>. We will send a signal from a given node <code>k</code>. Return the minimum time it takes for all <code>n</code> nodes to receive the signal, or <code>-1</code> if impossible.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Output: 2</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  times = [[1,2,1]], n = 2, k = 1
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= k &lt;= n &lt;= 100</code></li>
  <li><code>1 &lt;= times.length &lt;= 6000</code></li>
</ul>
$$,
  hints = ARRAY[
    'Single-source shortest path with non-negative weights → Dijkstra''s algorithm.',
    'Min-heap of (current_distance, node). Pop the smallest, relax outgoing edges, push improved neighbors.',
    'Answer is the maximum distance among all nodes (or -1 if any is still infinity).'
  ]
WHERE id = 'network-delay';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an <code>n x n</code> integer matrix <code>grid</code> where each value <code>grid[i][j]</code> represents the elevation at that point. Rain starts to fall and the water level rises uniformly. You can swim from a cell to a 4-directionally adjacent one if both cells are at or below the current water level. Starting from <code>(0,0)</code>, return the least time until you can reach <code>(n-1, n-1)</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  grid = [[0,2],[1,3]]
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]
Output: 16</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == grid.length</code></li>
  <li><code>1 &lt;= n &lt;= 50</code></li>
</ul>
$$,
  hints = ARRAY[
    'Modified Dijkstra: the "cost" to enter a cell is its elevation, and the path cost is the MAX elevation seen so far (not the sum).',
    'Min-heap keyed by max-elevation-on-path. Pop the smallest, push neighbors with max(current, grid[neighbor]).',
    'Stop when you pop (n-1, n-1) — that pop''s key is the answer.'
  ]
WHERE id = 'swim-in-water';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There are <code>n</code> cities connected by some number of <code>flights</code>. You are given <code>flights[i] = [from, to, price]</code>. You are also given three integers <code>src</code>, <code>dst</code>, and <code>k</code>, return the cheapest price from <code>src</code> to <code>dst</code> with at most <code>k</code> stops. If there is no such route, return <code>-1</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1
Output: 700</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0
Output: 500</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= n &lt;= 100</code></li>
  <li><code>0 &lt;= flights.length &lt;= n * (n - 1) / 2</code></li>
</ul>
$$,
  hints = ARRAY[
    'Bellman-Ford with at most k+1 iterations: each iteration relaxes all edges once, representing one additional stop.',
    'Use a snapshot of the previous iteration''s prices when relaxing — otherwise you might use more than the allowed stops in one iteration.',
    'Alternative: Dijkstra with state (cost, node, stops_remaining). Push to heap only when stops_remaining > 0.'
  ]
WHERE id = 'cheapest-flights';

-- ============== math ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Write an algorithm to determine if a number <code>n</code> is happy. A happy number is defined by the following process: starting with any positive integer, replace the number by the sum of the squares of its digits, repeat until the number equals 1, or it loops endlessly in a cycle that does not include 1. Return <code>true</code> if <code>n</code> is a happy number, otherwise <code>false</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 19
Output: true
Explanation: 1² + 9² = 82 → 8² + 2² = 68 → 6² + 8² = 100 → 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 2
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>
$$,
  hints = ARRAY[
    'The repeated transformation eventually either reaches 1 or revisits a previously seen number → cycle.',
    'Use a hash set of seen numbers; return false the moment you see a repeat.',
    'Floyd''s cycle detection (slow/fast pointers) gives O(1) extra space if you want to be fancy.'
  ]
WHERE id = 'happy-number';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an <code>n x n</code> 2D matrix representing an image, rotate the image by <strong>90 degrees</strong> (clockwise). You have to rotate the image <strong>in-place</strong>, which means you have to modify the input 2D matrix directly. <strong>DO NOT</strong> allocate another 2D matrix.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == matrix.length == matrix[i].length</code></li>
  <li><code>1 &lt;= n &lt;= 20</code></li>
</ul>
$$,
  hints = ARRAY[
    'Two-step trick: transpose the matrix (swap matrix[i][j] with matrix[j][i] for j > i), then reverse each row.',
    'Result is a 90° clockwise rotation. Both steps are O(n²) and in-place.',
    'Alternative: rotate four cells at a time in concentric layers — also in-place but trickier to write correctly.'
  ]
WHERE id = 'rotate-image';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an <code>m x n</code> integer matrix <code>matrix</code>, if an element is <code>0</code>, set its entire row and column to <code>0</code>. You must do it <strong>in-place</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  matrix = [[1,1,1],[1,0,1],[1,1,1]]
Output: [[1,0,1],[0,0,0],[1,0,1]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == matrix.length</code>, <code>n == matrix[0].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 200</code></li>
</ul>
$$,
  hints = ARRAY[
    'O(m+n) extra space: track which rows and columns contain a zero in two boolean arrays, then zero them out in a second pass.',
    'O(1) extra space: use the FIRST row and column themselves as marker arrays. Remember separately whether the first row/column originally had a zero.',
    'Two passes: first pass marks, second pass zeros. Be careful with the order — process the first row/column LAST.'
  ]
WHERE id = 'set-matrix-zeroes';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an <code>m x n</code> matrix, return all elements of the matrix in <strong>spiral order</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == matrix.length</code>, <code>n == matrix[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 10</code></li>
</ul>
$$,
  hints = ARRAY[
    'Maintain four boundaries: top, bottom, left, right. Walk top row L→R, right column T→B, bottom row R→L, left column B→T.',
    'Shrink the corresponding boundary after each side: top++, right--, bottom--, left++.',
    'Stop when top > bottom or left > right. Carefully guard the bottom row and left column to avoid double-traversal in single-row/column matrices.'
  ]
WHERE id = 'spiral-matrix';

-- ============== bit-manipulation ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a non-empty array of integers <code>nums</code>, every element appears <strong>twice</strong> except for one. Find that single one. You must implement a solution with linear runtime complexity and use only constant extra space.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [2,2,1]
Output: 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [4,1,2,1,2]
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 3 * 10<sup>4</sup></code></li>
  <li>Each element appears twice, except one which appears once.</li>
</ul>
$$,
  hints = ARRAY[
    'XOR has two key properties: a XOR a == 0, and a XOR 0 == a.',
    'XOR-folding the entire array cancels every paired element, leaving the unique one.',
    'Single pass, O(n) time, O(1) extra space.'
  ]
WHERE id = 'single-number';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Write a function that takes the binary representation of a positive integer and returns the number of set bits it has (also known as the Hamming weight).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 11  (binary 00000000000000000000000000001011)
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 128 (binary 00000000000000000000000010000000)
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The input must be a binary string of length 32.</li>
</ul>
$$,
  hints = ARRAY[
    'Naive: shift right 32 times and check the low bit each time.',
    'Brian Kernighan''s trick: while n > 0, do n &= n - 1 and increment a counter. Each iteration removes the lowest set bit, so the loop runs only popcount(n) times.',
    'Or just call Python''s bin(n).count("1"). Interviewers usually want the manual version though.'
  ]
WHERE id = 'number-of-1-bits';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer <code>n</code>, return an array <code>ans</code> of length <code>n + 1</code> such that for each <code>i</code> (<code>0 &lt;= i &lt;= n</code>), <code>ans[i]</code> is the number of <code>1</code>s in the binary representation of <code>i</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 2
Output: [0,1,1]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 5
Output: [0,1,1,2,1,2]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= n &lt;= 10<sup>5</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'DP: bits[i] = bits[i >> 1] + (i & 1). Each number reuses an answer for half its size.',
    'Single pass O(n) — far faster than calling popcount on every i.',
    'Alternative: bits[i] = bits[i & (i - 1)] + 1, exploiting the Kernighan identity.'
  ]
WHERE id = 'counting-bits';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Reverse the bits of a given 32-bit unsigned integer.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 00000010100101000001111010011100
Output:    964176192 (00111001011110000010100101000000)</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 11111111111111111111111111111101
Output: 3221225471 (10111111111111111111111111111111)</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>The input must be a binary string of length 32.</li>
</ul>
$$,
  hints = ARRAY[
    'Loop 32 times: shift result left by 1, OR in the lowest bit of n, then shift n right by 1.',
    'Watch the order: shift result first, THEN OR in the bit. Otherwise the lowest bit ends up in the wrong place.',
    'For repeated calls there is a divide-and-conquer trick that swaps adjacent halves of the bits, giving O(log w) but the loop is fine for one call.'
  ]
WHERE id = 'reverse-bits';

COMMIT;

SELECT topic_id, COUNT(*) FILTER (WHERE position('Example' in description) > 0) AS gold_count, COUNT(*) AS total
FROM public."PGcode_problems"
WHERE topic_id IN ('graphs','advanced-graphs','math','bit-manipulation')
GROUP BY topic_id ORDER BY topic_id;
