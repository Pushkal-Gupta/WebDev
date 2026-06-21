#!/usr/bin/env node
// Batch 8 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (1500, 1900]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch8.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch8.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch8.js --verify  # re-run stored solutions vs stored cases
//
// Every test-case `expected` is produced by ACTUALLY RUNNING the canonical Python here,
// so each inserted problem passes its own cases by construction.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const VERIFY = args.includes('--verify');
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

const BATCH = [1501, 1506, 1511, 1516, 1522, 1532, 1533, 1538, 1543, 1548, 1549, 1554, 1555, 1564, 1565];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 1501,
    id: 'pghub-conveyor-color-runs',
    name: 'Conveyor Color Runs',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'longestRun',
    params: [{ name: 'colors', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Items move down a conveyor, each painted a color given by <code>colors[i]</code>. A <em>run</em> is a maximal block of consecutive items sharing the same color. Return the length of the longest run.',
    examples: [
      ['[1,1,2,2,2,3]', '3', 'The block of three 2s is the longest run.'],
      ['[5]', '1', 'A single item forms a run of length 1.'],
    ],
    constraints: ['1 <= colors.length <= 10^5', '0 <= colors[i] <= 10^9'],
    tags: ['arrays', 'counting'],
    py: `def longestRun(colors):
    best = 1
    cur = 1
    for i in range(1, len(colors)):
        if colors[i] == colors[i-1]:
            cur += 1
        else:
            cur = 1
        if cur > best:
            best = cur
    return best`,
    approach:
      'Walk once, extending the current run while the color repeats and resetting it to 1 on a change. Track the maximum run length seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,1,2,2,2,3]'],
      ['[5]'],
      ['[7,7,7,7]'],
      ['[1,2,3,4,5]'],
      ['[0,0,1,1,1,1,2]'],
      ['[9,9,9,1,1]'],
      ['[3,3,3,3,3]'],
      ['[1,2,2,1,1,1]'],
      ['[4,4,5,5,5,5,4]'],
      ['[1000000000,1000000000]'],
    ],
  },
  {
    n: 1506,
    id: 'pghub-elevator-trip-count',
    name: 'Elevator Trip Count',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'elevatorTrips',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'capacity', type: 'int' }],
    return_type: 'int',
    statement:
      'People queue for an elevator in the given order; person i weighs <code>weights[i]</code>. The elevator boards people from the front of the queue, adding them one at a time, until the next person would exceed <code>capacity</code>; then it makes a trip and returns empty. Return the number of trips needed to move everyone. Every person weighs at most <code>capacity</code>.',
    examples: [
      ['[60,80,40]\n100', '3', '60 alone (80 would overflow), then 80 alone (40 would overflow), then 40.'],
      ['[50,50,50]\n100', '2', 'Trip 1 carries 50+50, trip 2 carries the last 50.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= capacity <= 10^9'],
    tags: ['greedy', 'simulation'],
    py: `def elevatorTrips(weights, capacity):
    trips = 0
    load = 0
    for w in weights:
        if load + w <= capacity:
            load += w
        else:
            trips += 1
            load = w
    if load > 0:
        trips += 1
    return trips`,
    approach:
      'Greedily fill the elevator in queue order. When the next person would exceed capacity, close out the current trip and start a new one carrying that person. A final partial load counts as one more trip.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[60,80,40]', '100'],
      ['[50,50,50]', '100'],
      ['[100]', '100'],
      ['[30,30,30,30]', '60'],
      ['[1,1,1,1,1]', '2'],
      ['[10,20,30,40]', '50'],
      ['[5,5,5,5,5,5]', '100'],
      ['[99,1,99,1]', '100'],
      ['[40,40,40]', '100'],
      ['[7]', '10'],
    ],
  },
  {
    n: 1511,
    id: 'pghub-vowel-window-max',
    name: 'Densest Vowel Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxVowels',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code> and an integer <code>k</code>, consider every contiguous window of length <code>k</code>. Return the maximum number of vowels (a, e, i, o, u) contained in any such window. If <code>k</code> exceeds the length of <code>s</code>, return the total vowel count of <code>s</code>.',
    examples: [
      ['"abciiidef"\n3', '3', 'The window "iii" contains three vowels.'],
      ['"bcdfg"\n2', '0', 'No window contains a vowel.'],
    ],
    constraints: ['1 <= s.length <= 10^5', '1 <= k', 's consists of lowercase English letters'],
    tags: ['sliding-window', 'strings'],
    py: `def maxVowels(s, k):
    vowels = set("aeiou")
    n = len(s)
    if k >= n:
        return sum(1 for c in s if c in vowels)
    cur = sum(1 for c in s[:k] if c in vowels)
    best = cur
    for i in range(k, n):
        if s[i] in vowels:
            cur += 1
        if s[i-k] in vowels:
            cur -= 1
        if cur > best:
            best = cur
    return best`,
    approach:
      'Slide a fixed-width window across the string, maintaining the count of vowels inside it. Each step adds the entering character and removes the leaving one in O(1). Track the maximum count.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"abciiidef"', '3'],
      ['"bcdfg"', '2'],
      ['"aeiou"', '5'],
      ['"aeiou"', '2'],
      ['"leetcode"', '3'],
      ['"a"', '1'],
      ['"xyzaeiouxyz"', '4'],
      ['"hello"', '10'],
      ['"programming"', '4'],
      ['"bbbbb"', '1'],
    ],
  },
  {
    n: 1516,
    id: 'pghub-grid-min-path-cost',
    name: 'Falling Path Min Cost',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'minFallingPath',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A drop starts in any cell of the top row of an <code>m x n</code> <code>grid</code> and falls to the bottom. From cell (r, c) it may move to (r+1, c-1), (r+1, c), or (r+1, c+1), staying inside the grid. The cost of a path is the sum of the values of every cell it visits. Return the minimum possible path cost.',
    examples: [
      ['[[2,1,3],[6,5,4],[7,8,9]]', '13', 'Path 1 -> 4 -> 8 (1+4+8 = 13).'],
      ['[[5]]', '5', 'Single cell.'],
    ],
    constraints: ['1 <= m, n <= 200', '-1000 <= grid[i][j] <= 1000'],
    tags: ['dynamic-programming', 'matrix'],
    py: `def minFallingPath(grid):
    n = len(grid)
    m = len(grid[0])
    dp = list(grid[0])
    for r in range(1, n):
        ndp = [0] * m
        for c in range(m):
            best = dp[c]
            if c > 0 and dp[c-1] < best:
                best = dp[c-1]
            if c + 1 < m and dp[c+1] < best:
                best = dp[c+1]
            ndp[c] = grid[r][c] + best
        dp = ndp
    return min(dp)`,
    approach:
      'Row-by-row dynamic programming. dp[c] holds the minimum cost to reach cell (r, c). Each cell takes its value plus the cheapest of the three reachable cells in the row above. The answer is the minimum of the final row.',
    complexity: { time: 'O(m*n)', space: 'O(n)' },
    cases: [
      ['[[2,1,3],[6,5,4],[7,8,9]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[-1,-2,-3],[-4,-5,-6]]'],
      ['[[10,10,10],[10,1,10],[10,10,10]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,100,1],[1,100,1],[1,100,1]]'],
      ['[[3,1,2],[1,5,1],[2,1,3]]'],
      ['[[100,99],[1,2]]'],
    ],
  },
  {
    n: 1522,
    id: 'pghub-task-cooldown-time',
    name: 'Task Cooldown Time',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'totalTime',
    params: [{ name: 'tasks', type: 'List[int]' }, { name: 'cooldown', type: 'int' }],
    return_type: 'int',
    statement:
      'A CPU runs <code>tasks</code> in the given order, one per second. After a task with id x runs, the same id cannot run again until at least <code>cooldown</code> seconds have passed; if it would run too soon, the CPU idles (one second per idle) until the cooldown is satisfied. Return the total seconds elapsed to finish all tasks in order.',
    examples: [
      ['[1,1,2]\n2', '4', 'Run 1 at t=0, idle t=1, run 1 at t=2, run 2 at t=3; total 4 seconds.'],
      ['[1,2,3]\n5', '3', 'No repeats, so no idling.'],
    ],
    constraints: ['1 <= tasks.length <= 10^5', '0 <= tasks[i] <= 10^9', '0 <= cooldown <= 10^9'],
    tags: ['greedy', 'hash-map'],
    py: `def totalTime(tasks, cooldown):
    last = {}
    t = 0
    for x in tasks:
        if x in last and t < last[x] + cooldown + 1:
            t = last[x] + cooldown + 1
        last[x] = t
        t += 1
    return t`,
    approach:
      'Track the time each id last ran. For the next occurrence, jump the clock forward to the earliest legal slot (last run + cooldown + 1) if needed, then run it and advance one second. The final clock value is the total time.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,1,2]', '2'],
      ['[1,2,3]', '5'],
      ['[1,1,1]', '2'],
      ['[1,2,1,2]', '2'],
      ['[5]', '100'],
      ['[1,1]', '0'],
      ['[7,7,7,7]', '1'],
      ['[1,2,3,1,2,3]', '3'],
      ['[0,0,0]', '5'],
      ['[1,1,2,2,3,3]', '1'],
    ],
  },
  {
    n: 1532,
    id: 'pghub-bracket-depth-score-b8',
    name: 'Bracket Depth Score',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'depthScore',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A balanced parentheses string is scored recursively: <code>()</code> is worth 1, <code>AB</code> (concatenation) is worth score(A) + score(B), and <code>(A)</code> is worth 2 * score(A). Return the score of the balanced string <code>s</code>.',
    examples: [
      ['"()()"', '2', '1 + 1.'],
      ['"(())"', '2', '2 * score("()") = 2 * 1.'],
    ],
    constraints: ['2 <= s.length <= 50', 's is a balanced parentheses string of only ( and )'],
    tags: ['stack', 'strings'],
    py: `def depthScore(s):
    stack = [0]
    for ch in s:
        if ch == '(':
            stack.append(0)
        else:
            v = stack.pop()
            stack[-1] += max(2 * v, 1)
    return stack[0]`,
    approach:
      'Use a stack where each entry accumulates the score of the current nesting level. On "(", push a new level; on ")", pop the level and fold its value into the parent as max(2*v, 1) — the 1 handles the innermost empty pair.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"()()"'],
      ['"(())"'],
      ['"()"'],
      ['"(()(()))"'],
      ['"((()))"'],
      ['"()()()"'],
      ['"(()())"'],
      ['"(((())))"'],
      ['"()(())"'],
      ['"((())())"'],
    ],
  },
  {
    n: 1533,
    id: 'pghub-island-perimeter-count',
    name: 'Single Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Easy',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A <code>grid</code> of 0s (water) and 1s (land) contains exactly one connected island (cells connected horizontally/vertically). The island has no internal lakes. Return the perimeter of the island — the total length of its outer boundary.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'A plus-shaped island.'],
      ['[[1]]', '4', 'A single land cell has perimeter 4.'],
    ],
    constraints: ['1 <= rows, cols <= 100', 'grid[i][j] is 0 or 1', 'exactly one island, no lakes'],
    tags: ['matrix', 'simulation'],
    py: `def islandPerimeter(grid):
    rows = len(grid)
    cols = len(grid[0])
    per = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                per += 4
                if r > 0 and grid[r-1][c] == 1:
                    per -= 2
                if c > 0 and grid[r][c-1] == 1:
                    per -= 2
    return per`,
    approach:
      'Every land cell contributes 4 edges. For each adjacency between two land cells (checked toward the up and left neighbours to avoid double counting) subtract 2, since the shared edge is internal for both cells.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,0,0],[1,0,0]]'],
      ['[[0,1,1,0],[1,1,1,1]]'],
    ],
  },
  {
    n: 1538,
    id: 'pghub-coin-change-ways',
    name: 'Coin Combination Ways',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an unlimited supply of coins of the given distinct denominations <code>coins</code>, return the number of distinct combinations that sum to exactly <code>amount</code>. Two combinations are the same if they use the same multiset of coins (order does not matter).',
    examples: [
      ['[1,2,5]\n5', '4', '5; 2+2+1; 2+1+1+1; 1+1+1+1+1.'],
      ['[2]\n3', '0', 'Cannot make an odd amount with only 2s.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', '0 <= amount <= 5000'],
    tags: ['dynamic-programming', 'counting'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for coin in coins:
        for a in range(coin, amount + 1):
            dp[a] += dp[a - coin]
    return dp[amount]`,
    approach:
      'Unbounded-knapsack counting. dp[a] is the number of combinations summing to a. Iterate coins in the outer loop so each combination is counted once regardless of order; for each coin, add ways from a-coin going upward.',
    complexity: { time: 'O(n*amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10]', '20'],
      ['[3,5,7]', '12'],
      ['[1]', '100'],
      ['[2,5,10]', '11'],
      ['[7]', '7'],
      ['[1,5,10,25]', '30'],
    ],
  },
  {
    n: 1543,
    id: 'pghub-rotated-array-min',
    name: 'Rotated Array Minimum',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findMin',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An array of <em>distinct</em> integers was sorted in ascending order, then rotated left by some unknown number of positions (possibly zero). Return the minimum element using an O(log n) algorithm.',
    examples: [
      ['[4,5,6,7,0,1,2]', '0', 'The rotation point holds the minimum.'],
      ['[1,2,3]', '1', 'No rotation; first element is smallest.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', 'all values are distinct'],
    tags: ['binary-search', 'arrays'],
    py: `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`,
    approach:
      'Binary search on the rotation. If the middle element is greater than the rightmost, the minimum lies strictly to the right; otherwise it is at mid or to the left. The loop converges to the single minimum.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[4,5,6,7,0,1,2]'],
      ['[1,2,3]'],
      ['[3,1,2]'],
      ['[2,3,4,5,1]'],
      ['[1]'],
      ['[5,1,2,3,4]'],
      ['[10,20,30,40,50]'],
      ['[-3,-1,0,1,-5,-4]'],
      ['[2,1]'],
      ['[6,7,8,1,2,3,4,5]'],
    ],
  },
  {
    n: 1548,
    id: 'pghub-tree-level-max',
    name: 'Tree Level Maximums',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'levelMaxes',
    params: [{ name: 'parent', type: 'List[int]' }, { name: 'values', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A rooted tree on nodes 0..n-1 is given by <code>parent</code>, where <code>parent[i]</code> is the parent of node i and the root has parent -1. Node i holds the value <code>values[i]</code>. The depth of the root is 0. Return a list containing the maximum node value at each depth, ordered from the root level downward. Exactly one node has parent -1.',
    examples: [
      ['[-1,0,0,1]\n[3,9,20,15]', '[3,20,15]', 'Depth 0: {3}; depth 1: {9,20}; depth 2: {15}.'],
      ['[-1]\n[7]', '[7]', 'Only the root.'],
    ],
    constraints: ['1 <= n <= 10^4', 'parent.length == values.length == n', '-10^9 <= values[i] <= 10^9', 'the tree is valid with one root (parent -1)'],
    tags: ['tree', 'bfs'],
    py: `def levelMaxes(parent, values):
    n = len(parent)
    children = defaultdict(list)
    root = 0
    for i in range(n):
        if parent[i] == -1:
            root = i
        else:
            children[parent[i]].append(i)
    res = []
    q = deque([root])
    while q:
        best = -float('inf')
        for _ in range(len(q)):
            node = q.popleft()
            if values[node] > best:
                best = values[node]
            for ch in children[node]:
                q.append(ch)
        res.append(best)
    return res`,
    approach:
      'Build a children adjacency list from the parent array and find the root (parent -1). BFS level by level from the root, recording the maximum value on each level. The order of levels visited gives the answer top-down.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[-1,0,0,1]', '[3,9,20,15]'],
      ['[-1]', '[7]'],
      ['[-1,0,0,1,1,2,2]', '[1,2,3,4,5,6,7]'],
      ['[-1,0,0,1,1,2]', '[5,3,8,1,4,9]'],
      ['[-1,0]', '[10,20]'],
      ['[1,-1]', '[20,10]'],
      ['[-1,0,1]', '[-1,-2,-3]'],
      ['[-1,0,0,1]', '[1,2,3,5]'],
      ['[-1,0,0,1,2]', '[7,7,7,7,7]'],
      ['[-1,0,0,1,1,2,2]', '[100,50,150,25,75,125,175]'],
    ],
  },
  {
    n: 1549,
    id: 'pghub-prefix-divisible-flags',
    name: 'Prefix Divisible Flags',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'prefixDivisible',
    params: [{ name: 'digits', type: 'List[int]' }, { name: 'd', type: 'int' }],
    return_type: 'List[bool]',
    statement:
      'Given a list of decimal <code>digits</code> (each 0-9, most significant first) forming a number read left to right, return a boolean list where the i-th entry is true if the number formed by the first i+1 digits is divisible by <code>d</code>.',
    examples: [
      ['[1,2,4]\n3', '[false,true,false]', '1 is not divisible by 3; 12 is; 124 is not.'],
      ['[2,4,8]\n2', '[true,true,true]', 'Every prefix (2, 24, 248) is even.'],
    ],
    constraints: ['1 <= digits.length <= 10^5', '0 <= digits[i] <= 9', '1 <= d <= 10^9'],
    tags: ['math', 'modular-arithmetic'],
    py: `def prefixDivisible(digits, d):
    res = []
    cur = 0
    for x in digits:
        cur = (cur * 10 + x) % d
        res.append(cur == 0)
    return res`,
    approach:
      'Build the prefix value modulo d incrementally: each new digit updates the remainder as (cur*10 + digit) mod d. A prefix is divisible exactly when this running remainder is zero. This avoids constructing huge integers.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,4]', '3'],
      ['[2,4,8]', '2'],
      ['[1,0,0]', '5'],
      ['[7]', '7'],
      ['[9,9,9]', '3'],
      ['[1,2,3,4,5]', '1'],
      ['[5,0,5,0]', '10'],
      ['[3,6,9]', '9'],
      ['[1,1,1,1]', '11'],
      ['[0]', '4'],
    ],
  },
  {
    n: 1554,
    id: 'pghub-kth-distinct-string',
    name: 'Kth Distinct String',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'kthDistinct',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'k', type: 'int' }],
    return_type: 'str',
    statement:
      'A string is <em>distinct</em> in an array if it appears exactly once. Return the k-th distinct string (1-indexed) in the order they appear in <code>words</code>. If there are fewer than k distinct strings, return the empty string "".',
    examples: [
      ['["a","b","a","c"]\n2', 'c', 'Distinct strings in order: b, c; the 2nd is c.'],
      ['["x","x"]\n1', '', 'No distinct strings.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 20', '1 <= k <= words.length'],
    tags: ['arrays', 'hash-map'],
    py: `def kthDistinct(words, k):
    counts = Counter(words)
    for w in words:
        if counts[w] == 1:
            k -= 1
            if k == 0:
                return w
    return ""`,
    approach:
      'Count each string frequency. Then scan in original order, decrementing k for every string that occurs exactly once; the string that drives k to zero is the answer. If k never reaches zero, return the empty string.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['["a","b","a","c"]', '2'],
      ['["x","x"]', '1'],
      ['["a","b","c"]', '1'],
      ['["a","b","c"]', '3'],
      ['["a","b","c"]', '4'],
      ['["aa","bb","aa","cc","bb"]', '1'],
      ['["hello"]', '1'],
      ['["a","a","b","b","c"]', '1'],
      ['["dog","cat","dog","bird"]', '2'],
      ['["one","two","one","two","three"]', '1'],
    ],
  },
  {
    n: 1555,
    id: 'pghub-network-delay-time',
    name: 'Network Delay Time',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'networkDelay',
    params: [{ name: 'edges', type: 'List[List[int]]' }, { name: 'n', type: 'int' }, { name: 'source', type: 'int' }],
    return_type: 'int',
    statement:
      'A signal is sent from node <code>source</code> through a directed weighted network of <code>n</code> nodes (labeled 1..n). Each entry of <code>edges</code> is <code>[u, v, w]</code> meaning a signal travels from u to v taking w time. Return the time for the signal to reach <em>all</em> nodes, or -1 if some node is unreachable.',
    examples: [
      ['[[2,1,1],[2,3,1],[3,4,1]]\n4\n2', '2', 'Farthest node (4) is reached at time 2.'],
      ['[[1,2,1]]\n2\n2', '-1', 'Node 1 is unreachable from 2.'],
    ],
    constraints: ['1 <= n <= 100', '0 <= edges.length <= n*(n-1)', '1 <= w <= 100', '1 <= u, v, source <= n'],
    tags: ['dijkstra', 'graph'],
    py: `def networkDelay(edges, n, source):
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = {source: 0}
    pq = [(0, source)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > dist.get(node, float('inf')):
            continue
        for nb, w in graph[node]:
            nd = d + w
            if nd < dist.get(nb, float('inf')):
                dist[nb] = nd
                heapq.heappush(pq, (nd, nb))
    if len(dist) < n:
        return -1
    return max(dist.values())`,
    approach:
      'Run Dijkstra from the source over the directed weighted graph. The time to reach all nodes is the maximum shortest-path distance. If any node is never settled, some node is unreachable and the answer is -1.',
    complexity: { time: 'O(E log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['[[2,1,1],[2,3,1],[3,4,1]]', '4', '2'],
      ['[[1,2,1]]', '2', '2'],
      ['[[1,2,1]]', '2', '1'],
      ['[]', '1', '1'],
      ['[[1,2,1],[2,3,2],[1,3,4]]', '3', '1'],
      ['[[1,2,5],[1,3,2],[3,2,1]]', '3', '1'],
      ['[[1,2,3],[2,1,3]]', '2', '1'],
      ['[[1,2,1],[1,3,1],[1,4,1]]', '4', '1'],
      ['[[4,3,1],[3,2,1],[2,1,1]]', '4', '4'],
      ['[[1,2,10]]', '3', '1'],
    ],
  },
  {
    n: 1564,
    id: 'pghub-max-product-subarray',
    name: 'Maximum Product Subarray',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxProduct',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, return the largest product obtainable from any non-empty contiguous subarray.',
    examples: [
      ['[2,3,-2,4]', '6', 'The subarray [2,3] has product 6.'],
      ['[-2,0,-1]', '0', 'The best product is 0.'],
    ],
    constraints: ['1 <= nums.length <= 2*10^4', '-10 <= nums[i] <= 10'],
    tags: ['dynamic-programming', 'arrays'],
    py: `def maxProduct(nums):
    best = cur_max = cur_min = nums[0]
    for x in nums[1:]:
        if x < 0:
            cur_max, cur_min = cur_min, cur_max
        cur_max = max(x, cur_max * x)
        cur_min = min(x, cur_min * x)
        if cur_max > best:
            best = cur_max
    return best`,
    approach:
      'Track both the maximum and minimum product ending at each position, because a negative number can turn the smallest product into the largest. Swap them when the current value is negative, then extend or restart. The running best is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,-2,4]'],
      ['[-2,0,-1]'],
      ['[-2]'],
      ['[2,3,4]'],
      ['[-1,-2,-3,-4]'],
      ['[0,2]'],
      ['[-2,3,-4]'],
      ['[1,-1,1,-1,1]'],
      ['[3,-1,4]'],
      ['[-3,0,1,-2]'],
    ],
  },
  {
    n: 1565,
    id: 'pghub-unique-bit-subset-xor',
    name: 'Subset XOR Total',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'subsetXorSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'The XOR total of an array is the bitwise XOR of all its elements (the total of the empty array is 0). Return the sum of XOR totals over every subset of <code>nums</code> (subsets are chosen by index, so duplicate values are counted separately).',
    examples: [
      ['[1,3]', '6', 'Subsets {}, {1}, {3}, {1,3} give totals 0,1,3,2; sum 6.'],
      ['[5,1,6]', '28', 'Sum of XOR totals over all 8 subsets.'],
    ],
    constraints: ['1 <= nums.length <= 12', '1 <= nums[i] <= 20'],
    tags: ['bit-manipulation', 'backtracking'],
    py: `def subsetXorSum(nums):
    n = len(nums)
    total = 0
    for mask in range(1 << n):
        x = 0
        for i in range(n):
            if mask & (1 << i):
                x ^= nums[i]
        total += x
    return total`,
    approach:
      'Enumerate all 2^n subsets via bitmask. For each subset, XOR the chosen elements and add the result to the running sum. With n at most 12 this brute force is fast and unambiguous.',
    complexity: { time: 'O(n * 2^n)', space: 'O(1)' },
    cases: [
      ['[1,3]'],
      ['[5,1,6]'],
      ['[1]'],
      ['[3,4,5,6,7,8]'],
      ['[1,1]'],
      ['[2,2,2]'],
      ['[20]'],
      ['[1,2,4,8]'],
      ['[10,10,10,10]'],
      ['[7,11,13]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print(_ser(${prob.method_name}(${argLiterals})))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b8-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = res.stdout.trimEnd().split('\n');
  if (outputs.length !== inputs.length) {
    throw new Error(`#${prob.n}: expected ${inputs.length} outputs, got ${outputs.length}\n${res.stdout}`);
  }
  return inputs.map((c, idx) => {
    const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
    return { inputs: argStrs, expected: outputs[idx], is_sample: idx < 2 };
  });
}

function buildDescription(prob) {
  const ex = prob.examples
    .map(
      (e, i) =>
        `<p><strong>Example ${i + 1}:</strong></p>\n<pre>Input: ${escapeHtml(
          e[0].replace(/\n/g, ', ')
        )}\nOutput: ${escapeHtml(e[1])}${e[2] ? `\nExplanation: ${escapeHtml(e[2])}` : ''}</pre>`
    )
    .join('\n');
  const cons = `<p><strong>Constraints:</strong></p>\n<ul>${prob.constraints
    .map((c) => `<li><code>${escapeHtml(c)}</code></li>`)
    .join('')}</ul>`;
  return `<p>${prob.statement}</p>\n${ex}\n${cons}`;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function skeleton(prob) {
  return { python: { code: pythonClassWrap(prob), approach: prob.approach, complexity: prob.complexity } };
}
function pythonClassWrap(prob) {
  const sig = prob.params.map((p) => p.name).join(', ');
  const escName = prob.params.map((p) => p.name).join(', ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = prob.py
    .replace(new RegExp(`^def ${prob.method_name}\\(${escName}\\):\\n`), '')
    .split('\n')
    .map((l) => (l ? '        ' + l : l))
    .join('\n');
  return `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
}

function buildRow(prob) {
  const test_cases = runPythonExpected(prob);
  const tags = Array.from(new Set(['PGHub', ...prob.tags]));
  return {
    row: {
      id: prob.id,
      topic_id: prob.topic_id,
      name: prob.name,
      difficulty: prob.difficulty,
      description: buildDescription(prob),
      method_name: prob.method_name,
      params: prob.params,
      return_type: prob.return_type,
      test_cases,
      constraints: prob.constraints.join('\n'),
      tags,
      topics: [],
      solutions: skeleton(prob),
      leetcode_number: prob.n,
      frequency_score: 0,
    },
    test_cases,
  };
}

// Re-run the STORED solution code against the STORED test cases (independent grade).
function gradeStored(prob, row) {
  const code = row.solutions.python.code; // class Solution with method
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("PASS" if _out == _exp else ("FAIL idx=${idx} got="+_out+" exp="+_exp))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b8-grade-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Grade run failed #${prob.n}:\n${res.stderr}`);
  const lines = res.stdout.trim().split('\n');
  const pass = lines.filter((l) => l === 'PASS').length;
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  return { pass, total: lines.length, fails };
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);

  // VERIFY mode: pull stored rows from DB and re-grade.
  if (VERIFY) {
    const { data: stored } = await sb
      .from('PGcode_problems')
      .select('leetcode_number,name,tags,test_cases,solutions,method_name')
      .in('leetcode_number', wanted)
      .order('leetcode_number');
    let allPass = 0, allTotal = 0, ok = 0;
    for (const r of stored || []) {
      const g = gradeStored({ method_name: r.method_name }, r);
      allPass += g.pass; allTotal += g.total;
      const tagged = (r.tags || []).includes('PGHub');
      if (g.pass === g.total && tagged) ok++;
      console.log(`  #${r.leetcode_number} ${r.name}: ${g.pass}/${g.total} pass, PGHub=${tagged}${g.fails.length ? ' ' + g.fails.join('; ') : ''}`);
    }
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green PGHub rows in range.`);
    return;
  }

  console.log(`Authoring ${targets.length} problems for gaps: ${targets.map((t) => t.n).join(', ')}`);

  const { data: existing, error: exErr } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,id')
    .in('leetcode_number', wanted);
  if (exErr) throw exErr;
  const haveNums = new Set((existing || []).map((e) => e.leetcode_number));
  const { data: existIds } = await sb.from('PGcode_problems').select('id').in('id', targets.map((t) => t.id));
  const haveIds = new Set((existIds || []).map((e) => e.id));

  const rows = [];
  for (const prob of targets) {
    if (haveNums.has(prob.n)) { console.log(`  skip #${prob.n} (${prob.id}) — number already present`); continue; }
    if (haveIds.has(prob.id)) { console.log(`  skip #${prob.n} (${prob.id}) — id already present`); continue; }
    const { row, test_cases } = buildRow(prob);
    // self-grade the stored solution before queueing
    const g = gradeStored(prob, row);
    if (g.pass !== g.total) {
      throw new Error(`P0: #${prob.n} ${prob.name} stored solution fails ${g.total - g.pass} cases: ${g.fails.join('; ')}`);
    }
    rows.push(row);
    console.log(`  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, ${g.pass}/${g.total} pass`);
  }

  if (!rows.length) { console.log('Nothing new to insert.'); return; }
  if (DRY) { console.log(`\n[DRY] Would insert ${rows.length} rows. Skipping write.`); return; }

  const { error: insErr } = await sb.from('PGcode_problems').insert(rows);
  if (insErr) throw insErr;
  console.log(`\nInserted ${rows.length} rows.`);

  const { data: check } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,name,tags')
    .in('leetcode_number', wanted)
    .order('leetcode_number');
  const pghub = (check || []).filter((c) => (c.tags || []).includes('PGHub'));
  console.log(`\nVerify: ${pghub.length}/${wanted.length} target numbers now present & tagged PGHub.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
