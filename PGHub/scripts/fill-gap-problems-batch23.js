#!/usr/bin/env node
// Batch 23 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1259, 1264, 1265, 1270, 1271, 1272, 1273, 1274, 1279, 1285, 1294, 1303, 1308, 1322, 1336
//
//   node scripts/fill-gap-problems-batch23.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch23.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch23.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1259, 1264, 1265, 1270, 1271, 1272, 1273, 1274, 1279, 1285, 1294, 1303, 1308, 1322, 1336];

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
    n: 1259,
    id: 'pghub-b23-elevator-stops',
    name: 'Elevator Idle Floors',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'idleFloors',
    params: [{ name: 'requests', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An elevator starts at floor 0 and serves floor requests strictly in the order given by <code>requests</code>. Travelling between two floors takes time equal to the absolute difference of their numbers. The elevator never waits except at the floors it stops on. Return the total travel time to serve every request in order.',
    examples: [
      ['[3,1,4]', '8', 'Travel 0->3 (3), 3->1 (2), 1->4 (3); total 3+2+3=8.'],
      ['[5]', '5', 'A single trip from floor 0 to floor 5.'],
    ],
    constraints: ['1 <= requests.length <= 10^5', '0 <= requests[i] <= 10^4'],
    tags: ['arrays', 'simulation'],
    py: `def idleFloors(requests):
    total = 0
    cur = 0
    for f in requests:
        total += abs(f - cur)
        cur = f
    return total`,
    approach:
      'Walk the request list once, tracking the elevator\'s current floor. The cost of each leg is the absolute difference between the next requested floor and the current one; accumulate those legs starting from floor 0.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4]'],
      ['[5]'],
      ['[0]'],
      ['[1,2,3,4,5]'],
      ['[10,0,10,0]'],
      ['[2,2,2]'],
      ['[7,3,9,1]'],
      ['[100,50,75]'],
      ['[0,0,0,0]'],
      ['[1,1000,1,1000]'],
    ],
  },
  {
    n: 1264,
    id: 'pghub-b23-palindrome-rearrange',
    name: 'Necklace Palindrome Check',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'canFormPalindrome',
    params: [{ name: 'beads', type: 'str' }],
    return_type: 'bool',
    statement:
      'A necklace is a string <code>beads</code> of lowercase letters that can be freely rearranged. Return <code>true</code> if the beads can be reordered into a palindrome, and <code>false</code> otherwise.',
    examples: [
      ['"aabb"', 'true', 'Rearranges to "abba".'],
      ['"abc"', 'false', 'Three distinct single beads cannot mirror.'],
    ],
    constraints: ['1 <= beads.length <= 10^5', 'beads consists of lowercase English letters'],
    tags: ['strings', 'hashing'],
    py: `def canFormPalindrome(beads):
    counts = Counter(beads)
    odd = sum(1 for c in counts.values() if c % 2 == 1)
    return odd <= 1`,
    approach:
      'A multiset of characters can form a palindrome exactly when at most one character has an odd frequency (that one sits in the middle). Count frequencies and check the number of odd counts is no more than one.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"aabb"'],
      ['"abc"'],
      ['"a"'],
      ['"aab"'],
      ['"abcabc"'],
      ['"aaa"'],
      ['"xxyyzz"'],
      ['"xxyyz"'],
      ['"zzzzzz"'],
      ['"abcdefg"'],
    ],
  },
  {
    n: 1265,
    id: 'pghub-b23-rainfall-trap',
    name: 'Rooftop Rain Capture',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'trapped',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of rooftops has heights given in <code>heights</code>. After a storm, water pools between taller rooftops. The water above column <code>i</code> rises to the lower of the tallest rooftop to its left and the tallest to its right, minus its own height (never below zero). Return the total units of trapped water.',
    examples: [
      ['[0,2,0,3,0,1]', '3', 'Columns between the 2 and 3 hold water up to the limiting wall.'],
      ['[3,2,1]', '0', 'Strictly decreasing rooftops trap nothing.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^5'],
    tags: ['two-pointers', 'arrays'],
    py: `def trapped(heights):
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    water = 0
    while left < right:
        if heights[left] < heights[right]:
            if heights[left] >= left_max:
                left_max = heights[left]
            else:
                water += left_max - heights[left]
            left += 1
        else:
            if heights[right] >= right_max:
                right_max = heights[right]
            else:
                water += right_max - heights[right]
            right -= 1
    return water`,
    approach:
      'Two pointers close in from both ends while tracking the tallest wall seen from each side. The shorter side bounds the water, so process that pointer: if the current rooftop beats the running max it becomes the new wall, otherwise it traps (wall - height) units.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,2,0,3,0,1]'],
      ['[3,2,1]'],
      ['[1]'],
      ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      ['[4,2,0,3,2,5]'],
      ['[5,5,5]'],
      ['[2,0,2]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[0,0,0,0]'],
    ],
  },
  {
    n: 1270,
    id: 'pghub-b23-subsequence-sum-target',
    name: 'Voucher Subset Sum',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'canReach',
    params: [
      { name: 'vouchers', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'bool',
    statement:
      'You hold gift vouchers with values in <code>vouchers</code>. Return <code>true</code> if some subset of them sums to exactly <code>target</code>, otherwise <code>false</code>. The empty subset sums to 0.',
    examples: [
      ['[3,34,4,12,5,2]\n9', 'true', 'The subset {4,5} sums to 9.'],
      ['[1,2,5]\n4', 'false', 'No subset reaches exactly 4.'],
    ],
    constraints: ['1 <= vouchers.length <= 200', '1 <= vouchers[i] <= 1000', '0 <= target <= 10^5'],
    tags: ['dp', 'subset-sum'],
    py: `def canReach(vouchers, target):
    reachable = 1
    for v in vouchers:
        if v <= target:
            reachable |= reachable << v
    return bool((reachable >> target) & 1)`,
    approach:
      'Classic subset-sum done with a bitmask: bit b of the mask is set when some subset sums to b. Starting with only bit 0 set, OR-in a left-shift by each voucher value to mark every new reachable sum. Test whether the target bit is set.',
    complexity: { time: 'O(n * target / 64)', space: 'O(target / 64)' },
    multiParam: true,
    cases: [
      ['[3,34,4,12,5,2]', '9'],
      ['[1,2,5]', '4'],
      ['[1,2,3]', '0'],
      ['[10]', '10'],
      ['[10]', '5'],
      ['[2,4,6,8]', '14'],
      ['[1,1,1,1]', '3'],
      ['[7,14,21]', '28'],
      ['[5,5,5,5]', '17'],
      ['[100,200,300]', '500'],
    ],
  },
  {
    n: 1271,
    id: 'pghub-b23-conveyor-windows',
    name: 'Conveyor Max Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxWindows',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Boxes move along a conveyor with weights in <code>weights</code>. A scanner reads every contiguous group of <code>k</code> boxes as the conveyor advances one box at a time. Return a list of the maximum weight seen in each window, from the leftmost window to the rightmost.',
    examples: [
      ['[1,3,-1,-3,5,3,6,7]\n3', '[3,3,5,5,6,7]', 'Sliding maxima across windows of size 3.'],
      ['[4,2]\n2', '[4]', 'Only one window of size 2 exists.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= k <= weights.length', '-10^4 <= weights[i] <= 10^4'],
    tags: ['sliding-window', 'queue'],
    py: `def maxWindows(weights, k):
    dq = deque()
    res = []
    for i, w in enumerate(weights):
        while dq and weights[dq[-1]] <= w:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            res.append(weights[dq[0]])
    return res`,
    approach:
      'Keep a deque of indices whose weights are monotonically decreasing. Push each new index after discarding smaller tail entries, drop the front when it leaves the window, and once the first full window is reached, the front index always holds the window maximum.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,3,-1,-3,5,3,6,7]', '3'],
      ['[4,2]', '2'],
      ['[1]', '1'],
      ['[9,8,7,6,5]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[5,5,5,5]', '3'],
      ['[-1,-2,-3,-4]', '2'],
      ['[2,1,2,1,2]', '5'],
      ['[10,9,8,7,6,5]', '3'],
      ['[3,3,3,1,1,1]', '4'],
    ],
  },
  {
    n: 1272,
    id: 'pghub-b23-firewall-rules',
    name: 'Firewall Rule Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeRules',
    params: [{ name: 'rules', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'A firewall has rules, each an inclusive port range <code>[start, end]</code> in <code>rules</code>. Overlapping or touching ranges (where one ends exactly where the next begins) cover a continuous block of ports. Return the merged list of non-overlapping ranges sorted by start.',
    examples: [
      ['[[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', 'The first two ranges overlap and merge.'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'Touching ranges join into one block.'],
    ],
    constraints: ['1 <= rules.length <= 10^4', '0 <= start <= end <= 10^6'],
    tags: ['intervals', 'sorting'],
    py: `def mergeRules(rules):
    rules.sort(key=lambda r: r[0])
    merged = []
    for s, e in rules:
        if merged and s <= merged[-1][1]:
            if e > merged[-1][1]:
                merged[-1][1] = e
        else:
            merged.append([s, e])
    return merged`,
    approach:
      'Sort the ranges by start. Sweep left to right keeping the last merged block: if the next range starts at or before that block\'s end it overlaps or touches, so extend the block\'s end; otherwise start a fresh block.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,2]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[1,4],[2,3]]'],
      ['[[0,0],[1,1],[2,2]]'],
      ['[[1,5],[6,10],[11,15]]'],
      ['[[10,12],[1,3],[2,11]]'],
      ['[[7,8],[1,5],[5,7],[8,9]]'],
    ],
  },
  {
    n: 1273,
    id: 'pghub-b23-bracket-balance',
    name: 'Mismatched Bracket Fix',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'minInsertions',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A code snippet uses only the brackets <code>(</code> and <code>)</code> in string <code>s</code>. Return the minimum number of bracket insertions (of either kind, anywhere) needed to make every bracket properly matched and nested.',
    examples: [
      ['"(()"', '1', 'Add one ")" to close the open bracket.'],
      ['"())("', '2', 'Add "(" then ")" to balance the stray brackets.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of "(" and ")" only'],
    tags: ['stack', 'greedy'],
    py: `def minInsertions(s):
    open_count = 0
    inserts = 0
    for ch in s:
        if ch == '(':
            open_count += 1
        else:
            if open_count > 0:
                open_count -= 1
            else:
                inserts += 1
    return inserts + open_count`,
    approach:
      'Scan once tracking how many open brackets currently await a close. A close bracket cancels one open if available, otherwise it needs an inserted open. At the end every still-open bracket needs an inserted close, so add the leftover opens to the running insert count.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(()"'],
      ['"())("'],
      ['"()"'],
      ['""'],
      ['"((("'],
      ['")))"'],
      ['"()()"'],
      ['")("'],
      ['"(()))("'],
      ['"((()))"'],
    ],
  },
  {
    n: 1274,
    id: 'pghub-b23-island-perimeter',
    name: 'Lake Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A lake is a grid where <code>1</code> is land and <code>0</code> is water; <code>grid</code> contains exactly one connected island with no internal lakes. Return the perimeter of the island (the number of unit edges of land cells that border water or the grid edge).',
    examples: [
      ['[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]', '16', 'The standard single-island perimeter.'],
      ['[[1]]', '4', 'A lone land cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one island'],
    tags: ['graphs', 'matrix'],
    py: `def islandPerimeter(grid):
    rows, cols = len(grid), len(grid[0])
    perimeter = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perimeter += 4
                if r > 0 and grid[r-1][c] == 1:
                    perimeter -= 2
                if c > 0 and grid[r][c-1] == 1:
                    perimeter -= 2
    return perimeter`,
    approach:
      'Each land cell contributes four edges. For every shared border with a land neighbor above or to the left, two edges (one from each cell) become internal, so subtract two per such adjacency. Checking only up and left avoids double counting.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]'],
      ['[[1]]'],
      ['[[1,1]]'],
      ['[[1],[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,1,1,1]]'],
      ['[[1,0,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
    ],
  },
  {
    n: 1279,
    id: 'pghub-b23-relay-baton',
    name: 'Relay Baton Handoffs',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'minHandoffs',
    params: [
      { name: 'n', type: 'int' },
      { name: 'links', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
      { name: 'finish', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A relay network has <code>n</code> runners numbered <code>0..n-1</code>. Each link <code>[a, b]</code> means runner <code>a</code> can hand the baton to runner <code>b</code> (one direction). Return the minimum number of handoffs needed to move the baton from <code>start</code> to <code>finish</code>, or -1 if it cannot reach. Starting at <code>finish</code> needs 0 handoffs.',
    examples: [
      ['4\n[[0,1],[1,2],[0,2],[2,3]]\n0\n3', '2', 'Path 0->2->3 uses two handoffs.'],
      ['3\n[[0,1]]\n0\n2', '-1', 'Runner 2 is unreachable.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= links.length <= 5 * 10^4', '0 <= a, b < n'],
    tags: ['advanced-graphs', 'bfs'],
    py: `def minHandoffs(n, links, start, finish):
    adj = defaultdict(list)
    for a, b in links:
        adj[a].append(b)
    if start == finish:
        return 0
    visited = [False] * n
    visited[start] = True
    q = deque([(start, 0)])
    while q:
        node, d = q.popleft()
        for nxt in adj[node]:
            if nxt == finish:
                return d + 1
            if not visited[nxt]:
                visited[nxt] = True
                q.append((nxt, d + 1))
    return -1`,
    approach:
      'Handoff count is path length in an unweighted directed graph, so breadth-first search from the start finds the minimum. Expand level by level, marking runners visited; the first time finish appears, the current depth plus one is the answer.',
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[0,2],[2,3]]', '0', '3'],
      ['3', '[[0,1]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['2', '[[0,1]]', '0', '1'],
      ['5', '[[0,1],[1,2],[2,3],[3,4]]', '0', '4'],
      ['5', '[[0,1],[0,2],[1,3],[2,3],[3,4]]', '0', '4'],
      ['3', '[[0,1],[1,2],[2,0]]', '1', '0'],
      ['4', '[[1,0],[2,1],[3,2]]', '0', '3'],
      ['6', '[[0,1],[1,2],[0,3],[3,4],[4,2],[2,5]]', '0', '5'],
      ['3', '[[0,0],[1,1]]', '0', '1'],
    ],
  },
  {
    n: 1285,
    id: 'pghub-b23-prime-sieve-range',
    name: 'Prime Count In Range',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'countPrimes',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Return the number of prime numbers strictly less than <code>n</code>. A prime is an integer greater than 1 with no positive divisors other than 1 and itself.',
    examples: [
      ['10', '4', 'The primes below 10 are 2, 3, 5, 7.'],
      ['2', '0', 'There are no primes below 2.'],
    ],
    constraints: ['0 <= n <= 5 * 10^6'],
    tags: ['math', 'sieve'],
    py: `def countPrimes(n):
    if n < 3:
        return 0
    sieve = bytearray([1]) * n
    sieve[0] = sieve[1] = 0
    for i in range(2, int(n ** 0.5) + 1):
        if sieve[i]:
            sieve[i*i::i] = bytearray(len(sieve[i*i::i]))
    return sum(sieve)`,
    approach:
      'Use the Sieve of Eratosthenes. Mark all numbers prime, then for each prime i clear its multiples starting at i squared. The count of remaining marks below n is the answer; handle tiny n as a base case.',
    complexity: { time: 'O(n log log n)', space: 'O(n)' },
    cases: [
      ['10'],
      ['2'],
      ['0'],
      ['1'],
      ['3'],
      ['20'],
      ['100'],
      ['1000'],
      ['5'],
      ['50'],
    ],
  },
  {
    n: 1294,
    id: 'pghub-b23-stock-single-trade',
    name: 'Single Trade Max Profit',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A stock\'s daily prices are in <code>prices</code>. You may buy on one day and sell on a strictly later day, at most once. Return the maximum profit achievable, or 0 if no profitable trade exists.',
    examples: [
      ['[7,1,5,3,6,4]', '5', 'Buy at 1, sell at 6 for a profit of 5.'],
      ['[7,6,4,3,1]', '0', 'Prices only fall, so make no trade.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    tags: ['arrays', 'greedy'],
    py: `def maxProfit(prices):
    min_so_far = float('inf')
    best = 0
    for p in prices:
        if p < min_so_far:
            min_so_far = p
        elif p - min_so_far > best:
            best = p - min_so_far
    return best`,
    approach:
      'Track the lowest price seen so far as the candidate buy day. For each later day, the profit of selling there is its price minus that minimum; keep the largest such profit. One pass suffices.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[7,1,5,3,6,4]'],
      ['[7,6,4,3,1]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,2,2]'],
      ['[3,8,1,9]'],
      ['[10,1,10]'],
      ['[1,2,1,2,1,2]'],
      ['[100,90,80,200]'],
    ],
  },
  {
    n: 1303,
    id: 'pghub-b23-kth-largest-stream',
    name: 'Tournament Kth Largest',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargestAfterEach',
    params: [
      { name: 'k', type: 'int' },
      { name: 'scores', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Players report scores one at a time in the order given by <code>scores</code>. After each report, the leaderboard wants the <code>k</code>-th largest score reported so far. If fewer than <code>k</code> scores have arrived, report <code>-1</code> for that step. Return the list of answers, one per reported score.',
    examples: [
      ['2\n[5,1,8,3]', '[-1,1,5,5]', 'After 5,1 the 2nd largest is 1; after 8 it is 5; after 3 still 5.'],
      ['1\n[4]', '[4]', 'The single score is its own largest.'],
    ],
    constraints: ['1 <= k <= 10^4', '1 <= scores.length <= 10^4', '0 <= scores[i] <= 10^9'],
    tags: ['heap', 'streaming'],
    py: `def kthLargestAfterEach(k, scores):
    heap = []
    res = []
    for s in scores:
        heapq.heappush(heap, s)
        if len(heap) > k:
            heapq.heappop(heap)
        res.append(heap[0] if len(heap) == k else -1)
    return res`,
    approach:
      'Maintain a min-heap holding the k largest scores seen so far. Push each new score and, if the heap exceeds k, pop the smallest. Once the heap holds exactly k elements its root is the k-th largest; before that report -1.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['2', '[5,1,8,3]'],
      ['1', '[4]'],
      ['3', '[1,2,3,4,5]'],
      ['2', '[10,10,10]'],
      ['1', '[3,2,1]'],
      ['4', '[1,2,3]'],
      ['2', '[7,7,8,9,1]'],
      ['3', '[5,4,3,2,1]'],
      ['1', '[0,0,0,0]'],
      ['2', '[100,1,50,75,25]'],
    ],
  },
  {
    n: 1308,
    id: 'pghub-b23-coin-change-ways',
    name: 'Vending Coin Combos',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A vending machine accepts coins of the distinct denominations in <code>coins</code>, with an unlimited supply of each. Return the number of distinct combinations of coins that sum to exactly <code>amount</code>. Combinations that differ only in order count as the same.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combos: 5; 2+2+1; 2+1+1+1; 1+1+1+1+1.'],
      ['[2]\n3', '0', 'No combination of 2s makes 3.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', '0 <= amount <= 5000'],
    tags: ['dp', 'counting'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    approach:
      'Unbounded-knapsack counting DP. Iterate coins on the outer loop so each combination is counted once regardless of order; for each coin sweep amounts upward, adding the number of ways to reach the smaller amount. dp[amount] is the result.',
    complexity: { time: 'O(n * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[3,7]', '10'],
      ['[1,5,10,25]', '12'],
      ['[2,4,6]', '8'],
      ['[7]', '14'],
      ['[1,2,5]', '0'],
    ],
  },
  {
    n: 1322,
    id: 'pghub-b23-word-ladder-bits',
    name: 'Gene Mutation Steps',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'minMutations',
    params: [
      { name: 'start', type: 'str' },
      { name: 'target', type: 'str' },
      { name: 'bank', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'A gene is a string of the characters <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code> of fixed length. One mutation changes a single character. A mutated gene is valid only if it appears in <code>bank</code>. Return the minimum number of mutations to turn <code>start</code> into <code>target</code>, or -1 if impossible. <code>start</code> need not be in the bank.',
    examples: [
      ['"AACCGGTT"\n"AACCGGTA"\n["AACCGGTA"]', '1', 'A single valid mutation reaches the target.'],
      ['"AACCGGTT"\n"AACCGGTA"\n[]', '-1', 'With an empty bank no mutation is valid.'],
    ],
    constraints: ['start.length == target.length', '1 <= start.length <= 8', '0 <= bank.length <= 10', 'genes use only A, C, G, T'],
    tags: ['graphs', 'bfs'],
    py: `def minMutations(start, target, bank):
    bank_set = set(bank)
    if target not in bank_set:
        return -1
    if start == target:
        return 0
    visited = {start}
    q = deque([(start, 0)])
    letters = "ACGT"
    while q:
        gene, steps = q.popleft()
        for i in range(len(gene)):
            for ch in letters:
                if ch == gene[i]:
                    continue
                nxt = gene[:i] + ch + gene[i+1:]
                if nxt == target:
                    return steps + 1
                if nxt in bank_set and nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, steps + 1))
    return -1`,
    approach:
      'Model genes as graph nodes with edges between single-character mutations, restricted to valid bank entries. Breadth-first search from the start finds the fewest mutations. Each step tries all positions and bases, enqueueing unvisited valid neighbors; the target must itself be in the bank.',
    complexity: { time: 'O(B * L * 4)', space: 'O(B)' },
    multiParam: true,
    cases: [
      ['"AACCGGTT"', '"AACCGGTA"', '["AACCGGTA"]'],
      ['"AACCGGTT"', '"AACCGGTA"', '[]'],
      ['"AACCGGTT"', '"AAACGGTA"', '["AACCGGTA","AACCGCTA","AAACGGTA"]'],
      ['"AA"', '"AA"', '["AA"]'],
      ['"AA"', '"TT"', '["AT","TT"]'],
      ['"AA"', '"TT"', '["TT"]'],
      ['"ACGT"', '"TGCA"', '["TCGT","TGGT","TGCT","TGCA"]'],
      ['"A"', '"C"', '["C"]'],
      ['"A"', '"G"', '["C","T"]'],
      ['"GGGG"', '"AAAA"', '["AGGG","AAGG","AAAG","AAAA"]'],
    ],
  },
  {
    n: 1336,
    id: 'pghub-b23-circular-subarray-max',
    name: 'Circular Banner Sum',
    topic_id: 'dp',
    difficulty: 'Hard',
    method_name: 'maxCircularSum',
    params: [{ name: 'banner', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A digital banner shows values in a circle given by <code>banner</code>, where the last position is adjacent to the first. Choose a non-empty contiguous arc (which may wrap around once) to maximize the sum of its values. Return that maximum sum.',
    examples: [
      ['[1,-2,3,-2]', '3', 'The single element 3 gives the best non-wrapping arc.'],
      ['[5,-3,5]', '10', 'The wrapping arc 5,(skip -3),5 sums to 10.'],
    ],
    constraints: ['1 <= banner.length <= 10^5', '-10^4 <= banner[i] <= 10^4'],
    tags: ['dp', 'kadane'],
    py: `def maxCircularSum(banner):
    total = 0
    cur_max = best_max = banner[0]
    cur_min = best_min = banner[0]
    for i, x in enumerate(banner):
        total += x
        if i == 0:
            continue
        cur_max = max(x, cur_max + x)
        best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x)
        best_min = min(best_min, cur_min)
    if best_max < 0:
        return best_max
    return max(best_max, total - best_min)`,
    approach:
      'The best arc is either non-wrapping (standard Kadane maximum subarray) or wrapping, which equals the total minus the minimum subarray. Run Kadane for both the max and min subarray in one pass. Guard the all-negative case where the min subarray is the whole array.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,-2,3,-2]'],
      ['[5,-3,5]'],
      ['[-3,-2,-1]'],
      ['[3,-1,2,-1]'],
      ['[3,-2,2,-3]'],
      ['[1,2,3,4]'],
      ['[-1,-2,-3,-4]'],
      ['[8,-1,-1,8]'],
      ['[2,-5,3]'],
      ['[-2,4,-5,4,-5,9,4]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B23>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b23-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B23>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B23>>'.length, -'<<END>>'.length)
  );
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
  const lines = prob.py.split('\n');
  const entryHeader = `def ${prob.method_name}(`;
  const idx = lines.findIndex((l) => l.startsWith(entryHeader));
  const preamble = idx > 0 ? lines.slice(0, idx).join('\n').replace(/\n+$/, '') : '';
  const fnLines = lines.slice(idx);
  const bodyLines = fnLines.slice(1);
  const body = bodyLines.map((l) => (l ? '        ' + l : l)).join('\n');
  const cls = `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
  return preamble ? `${preamble}\n\n\n${cls}` : cls;
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
  const code = row.solutions.python.code;
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("<<G>>" + ("PASS" if _out == _exp else ("FAIL idx=${idx} got="+repr(_out)+" exp="+repr(_exp))) + "<<E>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b23-grade-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Grade run failed #${prob.n}:\n${res.stderr}`);
  const lines = (res.stdout.match(/<<G>>([\s\S]*?)<<E>>/g) || []).map((m) =>
    m.slice('<<G>>'.length, -'<<E>>'.length)
  );
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
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green PGHub rows.`);
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
