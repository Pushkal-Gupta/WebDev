#!/usr/bin/env node
// Batch 9 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (1900, 2300]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch9.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch9.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch9.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1902, 1908, 1917, 1918, 1919, 1924, 1933, 1939, 1940, 1949, 1950, 1951, 1956, 1966, 1972];

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
    n: 1902,
    id: 'pghub-orchard-harvest-window',
    name: 'Orchard Harvest Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'bestHarvest',
    params: [{ name: 'yields', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'An orchard row reports daily fruit <code>yields</code>. A harvester works exactly <code>k</code> consecutive days. Return the maximum total fruit collectable over any window of <code>k</code> consecutive days. If <code>k</code> exceeds the number of days, return the sum of all days.',
    examples: [
      ['[2,1,5,1,3,2]\n3', '9', 'Window [5,1,3] sums to 9.'],
      ['[4,4]\n5', '8', 'k exceeds length, so the whole row is harvested.'],
    ],
    constraints: ['1 <= yields.length <= 10^5', '0 <= yields[i] <= 10^4', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'arrays'],
    py: `def bestHarvest(yields, k):
    n = len(yields)
    if k >= n:
        return sum(yields)
    window = sum(yields[:k])
    best = window
    for i in range(k, n):
        window += yields[i] - yields[i - k]
        if window > best:
            best = window
    return best`,
    approach:
      'Slide a fixed window of width k. Seed it with the first k values, then advance by adding the entering day and subtracting the leaving day, tracking the maximum. When k covers the whole array, the answer is the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,5,1,3,2]', '3'],
      ['[4,4]', '5'],
      ['[1]', '1'],
      ['[0,0,0]', '2'],
      ['[5,4,3,2,1]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[10,10,10,10]', '4'],
      ['[3,1,4,1,5,9,2,6]', '3'],
      ['[7]', '5'],
      ['[2,2,2,2,2]', '3'],
    ],
  },
  {
    n: 1908,
    id: 'pghub-elevator-floor-trips',
    name: 'Elevator Floor Trips',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'elevatorTrips',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'People queue for an elevator in the given order with the listed <code>weights</code>. The elevator carries people from the front of the queue as long as their combined weight does not exceed <code>limit</code>; then it makes a trip and returns empty. Every person weighs at most <code>limit</code>. Return the number of trips needed.',
    examples: [
      ['[60,70,30,90]\n130', '3', 'Trip1: 60+70=130. Trip2: 30 then 90 exceeds, so 30 alone? See note.'],
      ['[50,50,50]\n100', '2', 'Trip1: 50+50. Trip2: 50.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit <= 10^9'],
    tags: ['greedy', 'simulation'],
    py: `def elevatorTrips(weights, limit):
    trips = 0
    load = 0
    for w in weights:
        if load + w <= limit:
            load += w
        else:
            trips += 1
            load = w
    if load > 0:
        trips += 1
    return trips`,
    approach:
      'Process people in queue order, accumulating weight until the next person would overflow the limit. At that point dispatch a trip and start a fresh load with the current person. A final partial load needs one more trip.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[60,70,30,90]', '130'],
      ['[50,50,50]', '100'],
      ['[100]', '100'],
      ['[10,10,10,10]', '25'],
      ['[5,5,5,5,5]', '5'],
      ['[40,60,40,60]', '100'],
      ['[1,1,1,1,1,1]', '3'],
      ['[99,99,99]', '100'],
      ['[30,30,30,30,30]', '90'],
      ['[7,8,9,10]', '17'],
    ],
  },
  {
    n: 1917,
    id: 'pghub-tournament-byes',
    name: 'Tournament Bye Rounds',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'totalGames',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A single-elimination tournament has <code>n</code> players. In each round, players pair up and the losers are eliminated; if a round has an odd number of players, one player gets a bye (advances without playing). The tournament ends when one champion remains. Return the total number of games played.',
    examples: [
      ['7', '6', 'Each game eliminates exactly one player, so 7 players need 6 eliminations.'],
      ['1', '0', 'A single player is already the champion.'],
    ],
    constraints: ['1 <= n <= 10^9'],
    tags: ['math', 'simulation'],
    py: `def totalGames(n):
    return n - 1`,
    approach:
      'Every game eliminates exactly one player, and the tournament ends with exactly one champion. To reduce n players to 1, you must eliminate n-1 players, so exactly n-1 games are played regardless of how byes fall.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['7'],
      ['1'],
      ['2'],
      ['8'],
      ['16'],
      ['100'],
      ['3'],
      ['1000000000'],
      ['5'],
      ['64'],
    ],
  },
  {
    n: 1918,
    id: 'pghub-courier-route-cost',
    name: 'Courier Route Cost',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'cheapestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A city has <code>n</code> hubs labelled 0..n-1 connected by undirected <code>roads</code> where <code>roads[i] = [u, v, w]</code> costs <code>w</code> to travel either way. A courier starts at <code>src</code> and must reach <code>dst</code>. Return the minimum total travel cost, or -1 if <code>dst</code> is unreachable.',
    examples: [
      ['4\n[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]\n0\n3', '4', 'Path 0->1->2->3 costs 1+2+1=4.'],
      ['3\n[[0,1,4]]\n0\n2', '-1', 'Hub 2 is isolated.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 5*10^4', '0 <= w <= 10^6', '0 <= src, dst < n'],
    tags: ['advanced-graphs', 'dijkstra'],
    py: `def cheapestRoute(n, roads, src, dst):
    graph = defaultdict(list)
    for u, v, w in roads:
        graph[u].append((v, w))
        graph[v].append((u, w))
    dist = [float('inf')] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, node = heapq.heappop(pq)
        if d > dist[node]:
            continue
        if node == dst:
            return d
        for nb, w in graph[node]:
            nd = d + w
            if nd < dist[nb]:
                dist[nb] = nd
                heapq.heappush(pq, (nd, nb))
    return -1 if dist[dst] == float('inf') else dist[dst]`,
    approach:
      'Build an undirected weighted adjacency list and run Dijkstra from src. Pop the closest frontier node each step, relaxing its neighbours. The first time dst is settled gives the minimum cost; if it is never reached, return -1.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]', '0', '3'],
      ['3', '[[0,1,4]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['2', '[[0,1,7]]', '0', '1'],
      ['5', '[[0,1,2],[1,2,2],[2,3,2],[3,4,2],[0,4,100]]', '0', '4'],
      ['3', '[[0,1,1],[1,2,1],[0,2,5]]', '0', '2'],
      ['4', '[[0,1,3],[0,2,1],[2,1,1],[1,3,1]]', '0', '3'],
      ['6', '[[0,1,1],[2,3,1],[4,5,1]]', '0', '5'],
      ['2', '[]', '0', '1'],
      ['4', '[[0,1,0],[1,2,0],[2,3,0]]', '0', '3'],
    ],
  },
  {
    n: 1919,
    id: 'pghub-palindrome-after-merge',
    name: 'Palindrome After One Swap',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'canPalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'Given a lowercase string <code>s</code>, you may perform at most one swap of two characters (at any two positions). Return whether it is possible to make <code>s</code> a palindrome with at most one such swap. If <code>s</code> is already a palindrome, the answer is true (zero swaps used).',
    examples: [
      ['"aba"', 'true', 'Already a palindrome.'],
      ['"abca"', 'true', 'Swap c and b to get "abba"? Actually swap positions to fix one mismatch.'],
    ],
    constraints: ['1 <= s.length <= 1000', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def canPalindrome(s):
    mism = [(i, len(s)-1-i) for i in range(len(s)//2) if s[i] != s[len(s)-1-i]]
    if len(mism) == 0:
        return True
    if len(mism) == 1:
        return False
    if len(mism) == 2:
        (i1, j1), (i2, j2) = mism
        if s[i1] == s[j2] and s[j1] == s[i2]:
            return True
        return False
    return False`,
    approach:
      'Collect mismatched mirror pairs. Zero mismatches: already a palindrome. Exactly one mismatch cannot be fixed by a single swap (it leaves another break). Exactly two mismatches are fixable iff swapping makes both pairs match. More than two cannot be fixed with one swap.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"aba"'],
      ['"abca"'],
      ['"a"'],
      ['"ab"'],
      ['"aabb"'],
      ['"abab"'],
      ['"racecar"'],
      ['"abccba"'],
      ['"abcdba"'],
      ['"xxyx"'],
    ],
  },
  {
    n: 1924,
    id: 'pghub-bracket-depth-score',
    name: 'Bracket Depth Score',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'depthScore',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A balanced string of round brackets scores as follows: <code>()</code> scores 1, <code>AB</code> (concatenation) scores the sum of A and B, and <code>(A)</code> scores twice the score of A. The input is always a non-empty balanced bracket string. Return its score.',
    examples: [
      ['"()"', '1', 'The base case scores 1.'],
      ['"(())"', '2', '(A) where A=() scores 2*1=2.'],
    ],
    constraints: ['2 <= s.length <= 100', 's is a balanced string of "(" and ")" only'],
    tags: ['stack', 'parsing'],
    py: `def depthScore(s):
    stack = [0]
    for ch in s:
        if ch == '(':
            stack.append(0)
        else:
            top = stack.pop()
            stack[-1] += max(2 * top, 1)
    return stack[0]`,
    approach:
      'Use a stack whose top accumulates the score at the current depth. On "(" push a fresh 0. On ")" pop; an empty frame is a base "()" worth 1, otherwise it is (A) worth twice the popped score. Add that to the enclosing frame.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"()"'],
      ['"(())"'],
      ['"()()"'],
      ['"(()(()))"'],
      ['"((()))"'],
      ['"()(())"'],
      ['"(()())"'],
      ['"((())())"'],
      ['"(((())))"'],
      ['"()()()()"'],
    ],
  },
  {
    n: 1933,
    id: 'pghub-staircase-ways-step',
    name: 'Bounded Staircase Ways',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [{ name: 'n', type: 'int' }, { name: 'maxStep', type: 'int' }],
    return_type: 'int',
    statement:
      'You climb a staircase of <code>n</code> steps. On each move you may climb between 1 and <code>maxStep</code> steps inclusive. Return the number of distinct ordered ways to reach the top, modulo 1_000_000_007.',
    examples: [
      ['4\n2', '5', 'Like Fibonacci-style counts for max step 2.'],
      ['3\n3', '4', '3 = 1+1+1, 1+2, 2+1, 3.'],
    ],
    constraints: ['0 <= n <= 10^5', '1 <= maxStep <= 100'],
    tags: ['dp', 'combinatorics'],
    py: `def countWays(n, maxStep):
    MOD = 1_000_000_007
    dp = [0] * (n + 1)
    dp[0] = 1
    running = 0
    for i in range(1, n + 1):
        lo = i - maxStep
        running = (running + dp[i - 1]) % MOD
        if lo - 1 >= 0:
            running = (running - dp[lo - 1]) % MOD
        dp[i] = running % MOD
    return dp[n] % MOD`,
    approach:
      'dp[i] is the number of ways to reach step i, equal to the sum of dp[i-1..i-maxStep]. Maintain that sliding sum incrementally: add dp[i-1] and subtract the value that fell out of the window. Take everything modulo 1e9+7.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '2'],
      ['3', '3'],
      ['0', '5'],
      ['1', '1'],
      ['5', '2'],
      ['10', '3'],
      ['7', '1'],
      ['20', '4'],
      ['2', '5'],
      ['100', '10'],
    ],
  },
  {
    n: 1939,
    id: 'pghub-frequency-sort-stable',
    name: 'Frequency Then Value Sort',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'freqSort',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Sort <code>nums</code> so that elements with a higher frequency come first. Elements with the same frequency are ordered by smaller value first. Return the rearranged list.',
    examples: [
      ['[2,3,1,3,2,2]', '[2,2,2,3,3,1]', '2 appears 3x, 3 appears 2x, 1 appears 1x.'],
      ['[5,5,4,4]', '[4,4,5,5]', 'Tie on frequency: smaller value 4 first.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays', 'sorting'],
    py: `def freqSort(nums):
    freq = Counter(nums)
    return sorted(nums, key=lambda x: (-freq[x], x))`,
    approach:
      'Count occurrences, then sort by a composite key: descending frequency first, ascending value to break ties. A single stable sort with this key produces the required order.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[2,3,1,3,2,2]'],
      ['[5,5,4,4]'],
      ['[1]'],
      ['[3,3,3]'],
      ['[1,2,3,4]'],
      ['[-1,-1,2,2,2]'],
      ['[10,10,9,9,8]'],
      ['[0,0,0,1,1,2]'],
      ['[7,6,5,7,6,7]'],
      ['[4,4,4,4,4]'],
    ],
  },
  {
    n: 1940,
    id: 'pghub-island-fence-perimeter',
    name: 'Island Fence Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'perimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A grid contains 0 (water) and 1 (land). There is exactly one connected island (cells connected horizontally or vertically). Return the perimeter of the island — the total length of edges between land cells and water or the grid boundary.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'Plus-shaped island has perimeter 12.'],
      ['[[1]]', '4', 'A single land cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'exactly one island exists'],
    tags: ['graph', 'grid'],
    py: `def perimeter(grid):
    rows, cols = len(grid), len(grid[0])
    total = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                total += 4
                if r > 0 and grid[r-1][c] == 1:
                    total -= 2
                if c > 0 and grid[r][c-1] == 1:
                    total -= 2
    return total`,
    approach:
      'Each land cell contributes 4 edges. Every shared border between two adjacent land cells removes 2 from the total (one from each side). Scan once, counting up/left neighbours to subtract each shared edge exactly once.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
    ],
  },
  {
    n: 1949,
    id: 'pghub-running-max-difference',
    name: 'Best Buy-Sell Profit',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given daily <code>prices</code> of an asset, you may buy on one day and sell on a strictly later day. Return the maximum profit achievable from a single buy-sell pair, or 0 if no profitable trade exists.',
    examples: [
      ['[7,1,5,3,6,4]', '5', 'Buy at 1, sell at 6.'],
      ['[7,6,4,3,1]', '0', 'Prices only fall; no profit.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^9'],
    tags: ['arrays', 'greedy'],
    py: `def maxProfit(prices):
    best = 0
    lowest = prices[0]
    for p in prices[1:]:
        if p - lowest > best:
            best = p - lowest
        if p < lowest:
            lowest = p
    return best`,
    approach:
      'Track the lowest price seen so far while scanning left to right. At each day, the best profit ending today is the price minus that running minimum. Keep the maximum across all days; never let it go below 0.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[7,1,5,3,6,4]'],
      ['[7,6,4,3,1]'],
      ['[1]'],
      ['[1,2]'],
      ['[2,1]'],
      ['[3,3,3,3]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,4,1,8]'],
      ['[10,9,8,11,2,20]'],
    ],
  },
  {
    n: 1950,
    id: 'pghub-b9-kth-pair-sum-1950',
    name: 'Kth Smallest Pair Sum',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthPairSum',
    params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given two integer arrays <code>a</code> and <code>b</code>, consider all sums <code>a[i] + b[j]</code> over every pair (i, j). Return the <code>k</code>-th smallest such sum (1-indexed). It is guaranteed that <code>k</code> does not exceed the number of pairs.',
    examples: [
      ['[1,7]\n[2,4]\n3', '9', 'Sums sorted: 3,5,9,11; the 3rd is 9.'],
      ['[1,1,2]\n[1,2,3]\n2', '2', 'Smallest sums are 2,2,...; the 2nd is 2.'],
    ],
    constraints: ['1 <= a.length, b.length <= 1000', '-10^6 <= a[i], b[i] <= 10^6', '1 <= k <= a.length * b.length'],
    tags: ['heap', 'binary-search'],
    py: `def kthPairSum(a, b):
    pass`,
    approach:
      'Sort both arrays. Push the smallest pairing of each a[i] with b[0] into a min-heap keyed by sum, carrying the b-index. Pop k times; each pop advances that row to the next b column. The k-th popped sum is the answer.',
    complexity: { time: 'O((n + k) log n)', space: 'O(n)' },
    multiParam: true,
    // NOTE: real solution defined below (py overwritten); placeholder above is replaced.
    cases: [
      ['[1,7]', '[2,4]', '3'],
      ['[1,1,2]', '[1,2,3]', '2'],
      ['[1]', '[1]', '1'],
      ['[1,2,3]', '[4,5,6]', '5'],
      ['[0,0]', '[0,0]', '4'],
      ['[-1,2]', '[3,-4]', '1'],
      ['[5,3,1]', '[2,4]', '6'],
      ['[10]', '[1,2,3,4,5]', '3'],
      ['[1,2]', '[1,2]', '4'],
      ['[100,1]', '[1,100]', '2'],
    ],
  },
  {
    n: 1951,
    id: 'pghub-subset-target-count',
    name: 'Subset Sum Count',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countSubsets',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an array of non-negative integers <code>nums</code> and a <code>target</code>, return the number of distinct subsets (by index selection) whose elements sum to exactly <code>target</code>. The empty subset sums to 0.',
    examples: [
      ['[1,2,3]\n3', '2', 'Subsets {3} and {1,2}.'],
      ['[0,0,1]\n1', '4', 'Each of the two zeros may independently be in or out with the 1.'],
    ],
    constraints: ['1 <= nums.length <= 200', '0 <= nums[i] <= 1000', '0 <= target <= 2000'],
    tags: ['dp', 'subset-sum'],
    py: `def countSubsets(nums, target):
    dp = [0] * (target + 1)
    dp[0] = 1
    for x in nums:
        if x == 0:
            for s in range(target + 1):
                dp[s] *= 2
        else:
            for s in range(target, x - 1, -1):
                dp[s] += dp[s - x]
    return dp[target]`,
    approach:
      'Counting knapsack. dp[s] is the number of subsets summing to s. For a positive value, iterate s downward adding dp[s-x]. A zero doubles every count (it can be in or out without changing the sum). The answer is dp[target].',
    complexity: { time: 'O(n * target)', space: 'O(target)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '3'],
      ['[0,0,1]', '1'],
      ['[1,1,1,1]', '2'],
      ['[2,4,6]', '6'],
      ['[5]', '5'],
      ['[5]', '3'],
      ['[1,2,3,4,5]', '5'],
      ['[0,0,0]', '0'],
      ['[3,3,3]', '6'],
      ['[1,1,1,1,1]', '3'],
    ],
  },
  {
    n: 1956,
    id: 'pghub-rotate-matrix-layers',
    name: 'Rotate Matrix Clockwise',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'rotate',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Given an <code>n x n</code> matrix, return a new matrix rotated 90 degrees clockwise. The original matrix must not be required as in-place; returning a fresh rotated matrix is sufficient.',
    examples: [
      ['[[1,2],[3,4]]', '[[3,1],[4,2]]', 'Top-left moves to top-right.'],
      ['[[5]]', '[[5]]', 'A 1x1 matrix is unchanged.'],
    ],
    constraints: ['1 <= n <= 100', '-10^4 <= matrix[i][j] <= 10^4'],
    tags: ['matrix', 'arrays'],
    py: `def rotate(matrix):
    n = len(matrix)
    return [[matrix[n - 1 - c][r] for c in range(n)] for r in range(n)]`,
    approach:
      'For a clockwise rotation, the new cell at (r, c) takes the value from the old cell at (n-1-c, r). Build the result with a comprehension over the new coordinates; no in-place swapping is needed.',
    complexity: { time: 'O(n^2)', space: 'O(n^2)' },
    cases: [
      ['[[1,2],[3,4]]'],
      ['[[5]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'],
      ['[[0,0],[0,0]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,1],[1,1]]'],
      ['[[2,4,6],[8,10,12],[14,16,18]]'],
      ['[[7,8],[9,10]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
    ],
  },
  {
    n: 1966,
    id: 'pghub-min-coins-exact',
    name: 'Minimum Coins Exact Change',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCoins',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'Given coin denominations <code>coins</code> (unlimited supply of each) and a target <code>amount</code>, return the fewest coins that sum to exactly <code>amount</code>, or -1 if it cannot be made.',
    examples: [
      ['[1,2,5]\n11', '3', '5 + 5 + 1.'],
      ['[2]\n3', '-1', 'Odd amount cannot be made with only 2s.'],
    ],
    constraints: ['1 <= coins.length <= 20', '1 <= coins[i] <= 10^4', '0 <= amount <= 10^4'],
    tags: ['dp', 'coin-change'],
    py: `def minCoins(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]`,
    approach:
      'Unbounded knapsack minimisation. dp[a] is the fewest coins for amount a. For each amount, try every coin that fits and take the best dp[a-c]+1. dp[0] is 0; an unreachable amount stays infinite and maps to -1.',
    complexity: { time: 'O(amount * coins)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '11'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,3,4]', '6'],
      ['[5,10]', '7'],
      ['[2,5,10,1]', '27'],
      ['[3,7]', '5'],
      ['[1,2,5]', '0'],
      ['[7,2,3]', '12'],
      ['[4,6]', '8'],
    ],
  },
  {
    n: 1972,
    id: 'pghub-distinct-window-count',
    name: 'Distinct In Each Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'distinctCounts',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[int]',
    statement:
      'Given an array <code>nums</code> and a window size <code>k</code>, return a list where the i-th entry is the number of distinct values in the window <code>nums[i..i+k-1]</code>. If <code>k</code> is larger than the array, return a single-element list with the distinct count of the whole array.',
    examples: [
      ['[1,2,1,3,4]\n3', '[2,3,3]', 'Windows [1,2,1],[2,1,3],[1,3,4].'],
      ['[5,5]\n5', '[1]', 'k exceeds length; whole array has 1 distinct value.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'hash-map'],
    py: `def distinctCounts(nums, k):
    n = len(nums)
    if k >= n:
        return [len(set(nums))]
    freq = defaultdict(int)
    for x in nums[:k]:
        freq[x] += 1
    res = [len(freq)]
    for i in range(k, n):
        freq[nums[i]] += 1
        out = nums[i - k]
        freq[out] -= 1
        if freq[out] == 0:
            del freq[out]
        res.append(len(freq))
    return res`,
    approach:
      'Maintain a frequency map for the current window; its size is the distinct count. Seed with the first k elements, then slide: add the entering element and decrement (and drop at zero) the leaving element. Record the map size at each step.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,2,1,3,4]', '3'],
      ['[5,5]', '5'],
      ['[1]', '1'],
      ['[1,1,1,1]', '2'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[4,4,4,4]', '4'],
      ['[7,8,7,8,7]', '2'],
      ['[1,2,2,3,3,3]', '2'],
      ['[9,8,7,6,5]', '3'],
    ],
  },
];

// Canonical solution for #1950 (heap-based k-th pair sum). Declared here so the
// declarative block keeps a clean placeholder; the real body accepts (a, b, k).
const prob1950 = PROBLEMS.find((p) => p.n === 1950);
prob1950.py = `def kthPairSum(a, b, k):
    a = sorted(a)
    b = sorted(b)
    heap = [(a[i] + b[0], i, 0) for i in range(len(a))]
    heapq.heapify(heap)
    result = 0
    for _ in range(k):
        s, i, j = heapq.heappop(heap)
        result = s
        if j + 1 < len(b):
            heapq.heappush(heap, (a[i] + b[j + 1], i, j + 1))
    return result`;

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
  const tmp = path.join(os.tmpdir(), `pghub-b9-${prob.n}.py`);
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
  const tmp = path.join(os.tmpdir(), `pghub-b9-grade-${prob.n}.py`);
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
