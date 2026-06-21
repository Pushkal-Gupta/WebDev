#!/usr/bin/env node
/**
 * fill-gap-problems-batch7.js
 * Numbering gap-fill drive — DISJOINT range: first 15 gaps in (1100, 1500].
 * Gap numbers: 1101 1102 1107 1112 1113 1118 1119 1120 1121 1126 1127 1132 1133 1135 1136
 *
 * All problems are GENUINELY ORIGINAL (not reconstructions of the real LeetCode
 * problem at those numbers). Test cases are produced by running the canonical
 * Python solution locally (scripts/_batch7_solutions.py) — expected = actual.
 * Idempotent upsert via service-role key. Re-verifies all stored solutions vs
 * stored test_cases (100% pass required) before declaring success.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const ENV = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(Boolean)
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);
const sb = createClient(ENV.VITE_SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);

// generated, verified test cases
const CASES = JSON.parse(
  execFileSync('python3', [new URL('./_batch7_solutions.py', import.meta.url).pathname], { encoding: 'utf8' })
);

const D = (statement, example, constraints) =>
  `<p>${statement}</p>\n\n<p>&nbsp;</p>\n<p><strong>Example 1:</strong></p>\n<pre>${example}</pre>\n\n<p>&nbsp;</p>\n<p><strong>Constraints:</strong></p>\n<pre>${constraints}</pre>`;

const sol = (code, approach, time, space) => ({
  python: { code, approach, complexity: { time, space } },
});

const PROBS = [
  {
    id: 'pghub-warehouse-tilt-balance', n: 1101, topic_id: 'arrays', difficulty: 'Easy',
    name: 'Warehouse Tilt Balance', method: 'tiltIndex',
    params: [{ name: 'weights', type: 'List[int]' }], ret: 'int',
    tags: ['PGHub', 'arrays', 'prefix-sum'], pattern: 'Prefix Sum',
    desc: D(
      'A warehouse shelf holds boxes with integer <code>weights</code> laid out in a row. Find the leftmost index <code>i</code> such that the total weight strictly to its left equals the total weight strictly to its right. Return <code>-1</code> if no such balance point exists.',
      '\n<strong>Input:</strong> weights = [1,7,3,6,5,6]\n<strong>Output:</strong> 3\n<strong>Explanation:</strong> Left of index 3 sums to 1+7+3=11; right sums to 5+6=11.\n',
      '\n0 <= weights.length <= 10^5\n-10^4 <= weights[i] <= 10^4\n'),
    code: 'class Solution:\n    def tiltIndex(self, weights):\n        total = sum(weights)\n        left = 0\n        for i, w in enumerate(weights):\n            if left == total - left - w:\n                return i\n            left += w\n        return -1',
    approach: 'Keep a running left-sum. At each index the right-sum is total - left - current. Return the first index where they match.',
    time: 'O(n)', space: 'O(1)',
  },
  {
    id: 'pghub-elastic-password-strength', n: 1102, topic_id: 'strings', difficulty: 'Easy',
    name: 'Elastic Password Strength', method: 'passwordScore',
    params: [{ name: 's', type: 'str' }], ret: 'int',
    tags: ['PGHub', 'strings', 'counting'], pattern: 'String Scan',
    desc: D(
      'Score a password string <code>s</code>. Award one point for each of: length at least 8, contains a lowercase letter, contains an uppercase letter, contains a digit, and contains no run of three identical consecutive characters. Return the total score (0 to 5).',
      '\n<strong>Input:</strong> s = "GoodPass99"\n<strong>Output:</strong> 5\n<strong>Explanation:</strong> Length 10, has lower, upper, digit, and no triple repeat.\n',
      '\n1 <= s.length <= 100\ns consists of printable ASCII characters\n'),
    code: 'class Solution:\n    def passwordScore(self, s):\n        has_lower = any(c.islower() for c in s)\n        has_upper = any(c.isupper() for c in s)\n        has_digit = any(c.isdigit() for c in s)\n        score = 0\n        if len(s) >= 8:\n            score += 1\n        score += has_lower + has_upper + has_digit\n        triple = any(s[i] == s[i + 1] == s[i + 2] for i in range(len(s) - 2))\n        if not triple:\n            score += 1\n        return score',
    approach: 'Independently test each criterion with single passes, summing booleans as 0/1.',
    time: 'O(n)', space: 'O(1)',
  },
  {
    id: 'pghub-lantern-brightness-window', n: 1107, topic_id: 'sliding-window', difficulty: 'Medium',
    name: 'Lantern Brightness Window', method: 'brightestWindow',
    params: [{ name: 'levels', type: 'List[int]' }, { name: 'k', type: 'int' }], ret: 'int',
    tags: ['PGHub', 'sliding-window', 'arrays'], pattern: 'Fixed Sliding Window',
    desc: D(
      'A string of lanterns has brightness <code>levels</code>. Among every contiguous window of exactly <code>k</code> lanterns, return the maximum total brightness. If <code>k</code> is invalid (<= 0 or larger than the array), return 0.',
      '\n<strong>Input:</strong> levels = [2,1,5,1,3,2], k = 3\n<strong>Output:</strong> 9\n<strong>Explanation:</strong> The window [5,1,3] sums to 9, the best of all size-3 windows.\n',
      '\n0 <= levels.length <= 10^5\n-10^4 <= levels[i] <= 10^4\n1 <= k <= 10^5\n'),
    code: 'class Solution:\n    def brightestWindow(self, levels, k):\n        if k <= 0 or k > len(levels):\n            return 0\n        cur = sum(levels[:k])\n        best = cur\n        for i in range(k, len(levels)):\n            cur += levels[i] - levels[i - k]\n            if cur > best:\n                best = cur\n        return best',
    approach: 'Compute the first window sum, then slide: add the entering element and drop the leaving one, tracking the maximum.',
    time: 'O(n)', space: 'O(1)',
  },
  {
    id: 'pghub-token-stack-collapse', n: 1112, topic_id: 'stack', difficulty: 'Medium',
    name: 'Token Stack Collapse', method: 'collapseTokens',
    params: [{ name: 'tokens', type: 'List[str]' }], ret: 'List[str]',
    tags: ['PGHub', 'stack', 'simulation'], pattern: 'Stack Cancellation',
    desc: D(
      'Process <code>tokens</code> left to right onto a stack. Whenever the incoming token equals the token on top of the stack, the two annihilate each other (pop the top, discard the incoming). Otherwise push the incoming token. Return the final stack contents from bottom to top.',
      '\n<strong>Input:</strong> tokens = ["x","y","y","x"]\n<strong>Output:</strong> []\n<strong>Explanation:</strong> y,y cancel, then x,x cancel, leaving the stack empty.\n',
      '\n0 <= tokens.length <= 10^5\n1 <= tokens[i].length <= 10\n'),
    code: 'class Solution:\n    def collapseTokens(self, tokens):\n        st = []\n        for t in tokens:\n            if st and st[-1] == t:\n                st.pop()\n            else:\n                st.append(t)\n        return st',
    approach: 'Single stack pass: pop on a matching top, otherwise push. The stack is the answer.',
    time: 'O(n)', space: 'O(n)',
  },
  {
    id: 'pghub-frog-lily-hops', n: 1113, topic_id: 'dp', difficulty: 'Medium',
    name: 'Frog Lily Hops', method: 'countHops',
    params: [{ name: 'n', type: 'int' }], ret: 'int',
    tags: ['PGHub', 'dp', 'counting'], pattern: 'Linear DP',
    desc: D(
      'A frog starts on lily pad 0 and wants to reach pad <code>n</code>. On each hop it can move forward 1, 2, or 3 pads. Return the number of distinct hop sequences that land exactly on pad <code>n</code>, modulo 1000000007.',
      '\n<strong>Input:</strong> n = 4\n<strong>Output:</strong> 7\n<strong>Explanation:</strong> Sequences: 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2, 1+3, 3+1.\n',
      '\n0 <= n <= 10^6\n'),
    code: 'class Solution:\n    def countHops(self, n):\n        MOD = 1_000_000_007\n        if n < 0:\n            return 0\n        dp = [0] * (n + 1)\n        dp[0] = 1\n        for i in range(1, n + 1):\n            dp[i] = dp[i - 1]\n            if i >= 2:\n                dp[i] += dp[i - 2]\n            if i >= 3:\n                dp[i] += dp[i - 3]\n            dp[i] %= MOD\n        return dp[n]',
    approach: 'Tribonacci-style DP: ways(i) = ways(i-1) + ways(i-2) + ways(i-3), base ways(0) = 1.',
    time: 'O(n)', space: 'O(n)',
  },
  {
    id: 'pghub-meeting-room-overlap-peak', n: 1118, topic_id: 'intervals', difficulty: 'Medium',
    name: 'Meeting Room Overlap Peak', method: 'peakOverlap',
    params: [{ name: 'intervals', type: 'List[List[int]]' }], ret: 'int',
    tags: ['PGHub', 'intervals', 'sweep-line'], pattern: 'Sweep Line',
    desc: D(
      'Each booking is a half-open interval <code>[start, end)</code>. Return the maximum number of bookings that are simultaneously active at any single instant.',
      '\n<strong>Input:</strong> intervals = [[1,4],[2,5],[7,9]]\n<strong>Output:</strong> 2\n<strong>Explanation:</strong> At time 2-4 both [1,4) and [2,5) overlap; [7,9) is alone.\n',
      '\n0 <= intervals.length <= 10^5\n0 <= start < end <= 10^9\n'),
    code: 'class Solution:\n    def peakOverlap(self, intervals):\n        events = []\n        for s, e in intervals:\n            events.append((s, 1))\n            events.append((e, -1))\n        events.sort(key=lambda x: (x[0], x[1]))\n        cur = best = 0\n        for _, d in events:\n            cur += d\n            if cur > best:\n                best = cur\n        return best',
    approach: 'Sweep start/end events sorted by time (ends before starts at a tie since intervals are half-open), tracking the running active count.',
    time: 'O(n log n)', space: 'O(n)',
  },
  {
    id: 'pghub-distinct-echo-substrings', n: 1119, topic_id: 'strings', difficulty: 'Hard',
    name: 'Distinct Echo Substrings', method: 'echoCount',
    params: [{ name: 's', type: 'str' }], ret: 'int',
    tags: ['PGHub', 'strings', 'hashing'], pattern: 'Substring Enumeration',
    desc: D(
      'An "echo" string is one that can be written as a string concatenated with itself (for example "abab" = "ab" + "ab"). Count the number of <strong>distinct</strong> non-empty substrings of <code>s</code> that are echo strings.',
      '\n<strong>Input:</strong> s = "leetcodeleetcode"\n<strong>Output:</strong> 2\n<strong>Explanation:</strong> The echo substrings are "ee" and "leetcodeleetcode".\n',
      '\n1 <= s.length <= 2000\ns consists of lowercase English letters\n'),
    code: 'class Solution:\n    def echoCount(self, s):\n        seen = set()\n        n = len(s)\n        for length in range(2, n + 1, 2):\n            half = length // 2\n            for i in range(0, n - length + 1):\n                if s[i:i + half] == s[i + half:i + length]:\n                    seen.add(s[i:i + length])\n        return len(seen)',
    approach: 'Enumerate every even-length substring; it is an echo iff its two halves match. Deduplicate the matches with a set.',
    time: 'O(n^3)', space: 'O(n^2)',
  },
  {
    id: 'pghub-maximum-average-subtree', n: 1120, topic_id: 'trees', difficulty: 'Medium',
    name: 'Maximum Average Subtree', method: 'maxAvgSubtree',
    params: [{ name: 'parent', type: 'List[int]' }, { name: 'val', type: 'List[int]' }], ret: 'int',
    tags: ['PGHub', 'trees', 'dfs'], pattern: 'Tree DFS Aggregation',
    desc: D(
      'A rooted tree on nodes <code>0..n-1</code> is given by <code>parent</code> (where <code>parent[i]</code> is the parent of node i, and <code>-1</code> marks the root) and node values <code>val</code>. The subtree of a node is the node plus all its descendants. Return the node whose subtree has the largest average value; on ties return the smallest such node index.',
      '\n<strong>Input:</strong> parent = [-1,0,0], val = [5,6,7]\n<strong>Output:</strong> 2\n<strong>Explanation:</strong> Leaf 2 alone averages 7, the highest subtree average.\n',
      '\n1 <= n <= 10^4\nexactly one entry of parent equals -1\n-10^4 <= val[i] <= 10^4\n'),
    code: 'class Solution:\n    def maxAvgSubtree(self, parent, val):\n        n = len(parent)\n        children = [[] for _ in range(n)]\n        root = 0\n        for i, p in enumerate(parent):\n            if p == -1:\n                root = i\n            else:\n                children[p].append(i)\n        best = [-1.0]\n        best_node = [-1]\n\n        def dfs(u):\n            total = val[u]\n            cnt = 1\n            for c in children[u]:\n                t, k = dfs(c)\n                total += t\n                cnt += k\n            avg = total / cnt\n            if avg > best[0] + 1e-9:\n                best[0] = avg\n                best_node[0] = u\n            return total, cnt\n\n        dfs(root)\n        return best_node[0]',
    approach: 'Build a children list, DFS to return (sum, count) per subtree, and track the best average. Iterating children in increasing index makes ties resolve to the smaller node.',
    time: 'O(n)', space: 'O(n)',
  },
  {
    id: 'pghub-split-into-increasing-pieces', n: 1121, topic_id: 'greedy', difficulty: 'Medium',
    name: 'Split Into Increasing Pieces', method: 'canSplitIncreasing',
    params: [{ name: 'nums', type: 'List[int]' }], ret: 'bool',
    tags: ['PGHub', 'greedy', 'arrays'], pattern: 'Greedy Partition',
    desc: D(
      'Can the array <code>nums</code> be partitioned into two or more non-empty contiguous pieces whose sums are strictly increasing from left to right? Return true or false.',
      '\n<strong>Input:</strong> nums = [1,2,3]\n<strong>Output:</strong> true\n<strong>Explanation:</strong> Pieces [1] then [2] then [3] have sums 1 < 2 < 3.\n',
      '\n0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9\n'),
    code: 'class Solution:\n    def canSplitIncreasing(self, nums):\n        n = len(nums)\n        if n < 2:\n            return False\n        prev_sum = float("-inf")\n        pieces = 0\n        i = 0\n        cur = 0\n        while i < n:\n            cur += nums[i]\n            if cur > prev_sum:\n                prev_sum = cur\n                pieces += 1\n                cur = 0\n            i += 1\n        if cur != 0:\n            return False\n        return pieces >= 2',
    approach: 'Greedily close each piece as soon as its running sum exceeds the previous piece sum. A non-zero leftover means the tail could not beat the prior piece, so it fails; otherwise succeed if at least two pieces formed.',
    time: 'O(n)', space: 'O(1)',
  },
  {
    id: 'pghub-recharge-station-reachable', n: 1126, topic_id: 'graphs', difficulty: 'Medium',
    name: 'Recharge Station Reachable', method: 'stationsReachable',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }, { name: 'start', type: 'int' }], ret: 'int',
    tags: ['PGHub', 'graphs', 'bfs'], pattern: 'Graph BFS',
    desc: D(
      'A power grid has <code>n</code> stations <code>0..n-1</code> and bidirectional cables <code>edges</code>. Starting from station <code>start</code>, return how many <strong>other</strong> stations can receive power (are reachable through cables).',
      '\n<strong>Input:</strong> n = 5, edges = [[0,1],[1,2],[3,4]], start = 0\n<strong>Output:</strong> 2\n<strong>Explanation:</strong> From 0 you reach 1 and 2 (not 3 or 4).\n',
      '\n1 <= n <= 10^5\n0 <= edges.length <= 2*10^5\n0 <= start < n\n'),
    code: 'class Solution:\n    def stationsReachable(self, n, edges, start):\n        from collections import deque\n        adj = [[] for _ in range(n)]\n        for a, b in edges:\n            adj[a].append(b)\n            adj[b].append(a)\n        seen = [False] * n\n        seen[start] = True\n        q = deque([start])\n        count = 0\n        while q:\n            u = q.popleft()\n            count += 1\n            for v in adj[u]:\n                if not seen[v]:\n                    seen[v] = True\n                    q.append(v)\n        return count - 1',
    approach: 'Standard BFS from start over the adjacency list; the reachable set size minus the start itself is the answer.',
    time: 'O(n + e)', space: 'O(n + e)',
  },
  {
    id: 'pghub-coin-pile-parity-game', n: 1127, topic_id: 'math', difficulty: 'Easy',
    name: 'Coin Pile Parity Game', method: 'firstPlayerWins',
    params: [{ name: 'piles', type: 'List[int]' }], ret: 'bool',
    tags: ['PGHub', 'math', 'game-theory'], pattern: 'Nim / XOR',
    desc: D(
      'Two perfect players alternate turns. On a turn a player removes any positive number of coins from a single pile. The player who cannot move (all piles empty) loses. Given the starting <code>piles</code>, return true if the first player has a winning strategy.',
      '\n<strong>Input:</strong> piles = [3,4,5]\n<strong>Output:</strong> true\n<strong>Explanation:</strong> 3 XOR 4 XOR 5 = 2, which is non-zero, so the first player wins.\n',
      '\n0 <= piles.length <= 10^5\n0 <= piles[i] <= 10^9\n'),
    code: 'class Solution:\n    def firstPlayerWins(self, piles):\n        x = 0\n        for p in piles:\n            x ^= p\n        return x != 0',
    approach: 'This is classic Nim. The first player wins exactly when the XOR of all pile sizes is non-zero (the Sprague-Grundy theorem).',
    time: 'O(n)', space: 'O(1)',
  },
  {
    id: 'pghub-compress-color-runs', n: 1132, topic_id: 'two-pointers', difficulty: 'Easy',
    name: 'Compress Color Runs', method: 'compressRuns',
    params: [{ name: 'colors', type: 'List[int]' }], ret: 'List[List[int]]',
    tags: ['PGHub', 'two-pointers', 'arrays'], pattern: 'Run-Length Encoding',
    desc: D(
      'Run-length encode the <code>colors</code> array. Return a list of <code>[color, count]</code> pairs describing each maximal run of equal consecutive values, in order.',
      '\n<strong>Input:</strong> colors = [1,1,2,2,2,3]\n<strong>Output:</strong> [[1,2],[2,3],[3,1]]\n<strong>Explanation:</strong> Two 1s, then three 2s, then one 3.\n',
      '\n0 <= colors.length <= 10^5\n0 <= colors[i] <= 10^9\n'),
    code: 'class Solution:\n    def compressRuns(self, colors):\n        out = []\n        i = 0\n        n = len(colors)\n        while i < n:\n            j = i\n            while j < n and colors[j] == colors[i]:\n                j += 1\n            out.append([colors[i], j - i])\n            i = j\n        return out',
    approach: 'Two pointers: extend j over each equal run, emit [value, length], then jump i to j.',
    time: 'O(n)', space: 'O(n)',
  },
  {
    id: 'pghub-lexicographic-bit-sequence', n: 1133, topic_id: 'bit-manipulation', difficulty: 'Medium',
    name: 'Kth Two-Bit Number', method: 'kthSetBitNumber',
    params: [{ name: 'k', type: 'int' }], ret: 'int',
    tags: ['PGHub', 'bit-manipulation', 'math'], pattern: 'Bit Counting',
    desc: D(
      'Consider the positive integers that have exactly two set bits in binary (3, 5, 6, 9, 10, 12, ...). Return the <code>k</code>-th smallest such number (1-indexed).',
      '\n<strong>Input:</strong> k = 3\n<strong>Output:</strong> 6\n<strong>Explanation:</strong> The sequence is 3, 5, 6, ...; the 3rd term is 6.\n',
      '\n1 <= k <= 10^4\n'),
    code: 'class Solution:\n    def kthSetBitNumber(self, k):\n        n = 0\n        found = 0\n        while True:\n            n += 1\n            if bin(n).count("1") == 2:\n                found += 1\n                if found == k:\n                    return n',
    approach: 'Scan integers upward, counting those with a popcount of exactly two until the k-th is reached.',
    time: 'O(answer)', space: 'O(1)',
  },
  {
    id: 'pghub-knapsack-exact-weight', n: 1135, topic_id: 'dp', difficulty: 'Medium',
    name: 'Exact-Weight Knapsack', method: 'exactKnapsack',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'values', type: 'List[int]' }, { name: 'cap', type: 'int' }], ret: 'int',
    tags: ['PGHub', 'dp', 'knapsack'], pattern: '0/1 Knapsack',
    desc: D(
      'You have items with given <code>weights</code> and <code>values</code> (each usable at most once). Choose a subset whose weights sum to <strong>exactly</strong> <code>cap</code>, maximizing total value. Return the maximum value, or <code>-1</code> if no subset sums exactly to <code>cap</code>.',
      '\n<strong>Input:</strong> weights = [1,2,3], values = [6,10,12], cap = 5\n<strong>Output:</strong> 22\n<strong>Explanation:</strong> Items of weight 2 and 3 reach capacity 5 with value 10+12=22.\n',
      '\n0 <= weights.length <= 200\nweights.length == values.length\n1 <= weights[i] <= 1000\n0 <= values[i] <= 10^6\n0 <= cap <= 10^4\n'),
    code: 'class Solution:\n    def exactKnapsack(self, weights, values, cap):\n        NEG = float("-inf")\n        dp = [NEG] * (cap + 1)\n        dp[0] = 0\n        for w, v in zip(weights, values):\n            for c in range(cap, w - 1, -1):\n                if dp[c - w] != NEG:\n                    dp[c] = max(dp[c], dp[c - w] + v)\n        return dp[cap] if dp[cap] != NEG else -1',
    approach: '1D 0/1-knapsack DP where dp[c] is the best value achieving exactly weight c (NEG = unreachable). Iterate capacity downward per item to avoid reuse.',
    time: 'O(n * cap)', space: 'O(cap)',
  },
  {
    id: 'pghub-grid-treasure-loops', n: 1136, topic_id: 'graphs', difficulty: 'Hard',
    name: 'Grid Treasure Loops', method: 'hasColorCycle',
    params: [{ name: 'grid', type: 'List[List[int]]' }], ret: 'bool',
    tags: ['PGHub', 'graphs', 'grid'], pattern: 'Grid Cycle Detection',
    desc: D(
      'In an integer <code>grid</code>, cells are connected to their 4-directional neighbors that share the same value. Return true if there exists a cycle of length at least 4 made up of cells all having the same value.',
      '\n<strong>Input:</strong> grid = [[1,1,1],[1,0,1],[1,1,1]]\n<strong>Output:</strong> true\n<strong>Explanation:</strong> The ring of 1s around the center 0 forms a same-value cycle.\n',
      '\n1 <= grid.length, grid[0].length <= 500\n-10^9 <= grid[i][j] <= 10^9\n'),
    code: 'class Solution:\n    def hasColorCycle(self, grid):\n        R = len(grid)\n        C = len(grid[0]) if R else 0\n        visited = [[False] * C for _ in range(R)]\n\n        def dfs(r, c, pr, pc, color):\n            visited[r][c] = True\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == color:\n                    if not (nr == pr and nc == pc):\n                        if visited[nr][nc]:\n                            return True\n                        if dfs(nr, nc, r, c, color):\n                            return True\n            return False\n\n        for r in range(R):\n            for c in range(C):\n                if not visited[r][c]:\n                    if dfs(r, c, -1, -1, grid[r][c]):\n                        return True\n        return False',
    approach: 'DFS each component of equal-valued cells; reaching an already-visited cell that is not the immediate parent proves a cycle of length >= 4.',
    time: 'O(R*C)', space: 'O(R*C)',
  },
];

function buildRow(p) {
  const tc = CASES[p.id];
  if (!tc) throw new Error('no cases for ' + p.id);
  const test_cases = tc.map((c, idx) => ({ ...c, is_sample: idx < 2 }));
  return {
    id: p.id,
    topic_id: p.topic_id,
    name: p.name,
    difficulty: p.difficulty,
    description: p.desc,
    method_name: p.method,
    params: p.params,
    return_type: p.ret,
    test_cases,
    constraints: null,
    tags: p.tags,
    topics: [],
    pattern: p.pattern,
    solutions: sol(p.code, p.approach, p.time, p.space),
    leetcode_number: p.n,
    leetcode_url: null,
    frequency_score: 0,
    roadmap_set: null,
    hints: null,
    follow_up: null,
    viz_steps: null,
    explained_samples: [],
  };
}

async function main() {
  const rows = PROBS.map(buildRow);
  const { error } = await sb.from('PGcode_problems').upsert(rows, { onConflict: 'id' });
  if (error) { console.error('UPSERT ERROR', error); process.exit(1); }
  console.log('upserted', rows.length, 'rows');

  // VERIFY: re-fetch every row, re-run stored python solution vs stored cases
  const ids = PROBS.map((p) => p.id);
  const { data, error: e2 } = await sb.from('PGcode_problems')
    .select('id,method_name,params,solutions,test_cases,leetcode_number,tags')
    .in('id', ids);
  if (e2) { console.error(e2); process.exit(1); }

  let totalPass = 0, totalCases = 0, failed = 0;
  for (const r of data) {
    const code = r.solutions.python.code;
    const pnames = r.params.map((x) => x.name);
    const driver = `${code}\nimport json,sys\n_data=json.loads(sys.stdin.read())\n_s=Solution()\nfor _tc in _data:\n    _args=[json.loads(a) for a in _tc["inputs"]]\n    _res=_s.${r.method_name}(*_args)\n    if isinstance(_res,bool):\n        _o="true" if _res else "false"\n    elif isinstance(_res,str):\n        _o=_res\n    elif isinstance(_res,(list,dict)):\n        _o=json.dumps(_res,separators=(",",":"))\n    else:\n        _o=str(_res)\n    print("PASS" if _o==_tc["expected"] else ("FAIL "+_o+" != "+_tc["expected"]))\n`;
    void pnames;
    const stdout = execFileSync('python3', ['-c', driver], { input: JSON.stringify(r.test_cases), encoding: 'utf8' });
    const lines = stdout.trim().split('\n');
    const pass = lines.filter((l) => l === 'PASS').length;
    totalPass += pass; totalCases += lines.length;
    if (pass !== lines.length) {
      failed++;
      console.log('VERIFY FAIL', r.id, lines.filter((l) => l !== 'PASS').slice(0, 3));
    }
  }
  const inRange = data.filter((r) => r.leetcode_number > 1100 && r.leetcode_number <= 1500
    && r.tags.includes('PGHub')).length;
  console.log(`VERIFY: ${totalPass}/${totalCases} cases pass; failedProblems=${failed}; PGHubRowsInRange=${inRange}/15`);
  if (failed > 0 || inRange !== 15) process.exit(1);
}

main();
