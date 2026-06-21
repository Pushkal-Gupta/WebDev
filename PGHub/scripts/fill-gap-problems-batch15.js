#!/usr/bin/env node
// Batch 15 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Target gap numbers: 489,490,499,505,510,512,527,531,533,534,536,544,545,548,549
//
//   node scripts/fill-gap-problems-batch15.js          # author + grade + insert (idempotent)
//   node scripts/fill-gap-problems-batch15.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch15.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [489, 490, 499, 505, 510, 512, 527, 531, 533, 534, 536, 544, 545, 548, 549];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
null = None
true = True
false = False
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 489,
    id: 'pghub-b15-warehouse-aisles',
    name: 'Warehouse Aisle Restock',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'restockCount',
    params: [{ name: 'stock', type: 'List[int]' }, { name: 'threshold', type: 'int' }],
    return_type: 'int',
    statement:
      'A warehouse has aisles whose current item counts are given in <code>stock</code>. An aisle must be restocked if its count is strictly below <code>threshold</code>. Return how many aisles need restocking.',
    examples: [
      ['[5,2,8,1]\n4', '2', 'Aisles with 2 and 1 are below 4.'],
      ['[10,10,10]\n5', '0', 'All aisles are above the threshold.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^9', '0 <= threshold <= 10^9'],
    tags: ['arrays', 'counting'],
    multiParam: true,
    py: `def restockCount(stock, threshold):
    return sum(1 for x in stock if x < threshold)`,
    approach: 'Iterate once and count the elements strictly less than the threshold.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[5,2,8,1]', '4'],
      ['[10,10,10]', '5'],
      ['[0]', '0'],
      ['[1,2,3,4,5]', '3'],
      ['[7]', '8'],
      ['[100,99,98]', '99'],
      ['[0,0,0,0]', '1'],
      ['[1000000000]', '999999999'],
      ['[3,3,3]', '3'],
      ['[9,1,9,1,9]', '5'],
    ],
  },
  {
    n: 490,
    id: 'pghub-b15-palindrome-merge',
    name: 'Mirrored String Builder',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'buildMirror',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a string <code>s</code>, build a palindrome by appending the reverse of <code>s</code> (excluding its last character) to <code>s</code>. Return the resulting string.',
    examples: [
      ['"abc"', '"abcba"', 'Append reverse of "ab" to "abc".'],
      ['"x"', '"x"', 'A single character mirrors to itself.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of printable ASCII characters'],
    tags: ['strings', 'two-pointers'],
    py: `def buildMirror(s):
    return s + s[-2::-1]`,
    approach: 'Concatenate s with s reversed minus its last character so the seam is not duplicated, yielding a palindrome.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"abc"'],
      ['"x"'],
      ['"ab"'],
      ['"hello"'],
      ['"aa"'],
      ['"12321"'],
      ['"racecar"'],
      ['"ab cd"'],
      ['"!?"'],
      ['"zzzz"'],
    ],
  },
  {
    n: 499,
    id: 'pghub-b15-token-stream',
    name: 'Balanced Token Stream',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isBalanced',
    params: [{ name: 'tokens', type: 'str' }],
    return_type: 'bool',
    statement:
      'A stream <code>tokens</code> contains only the characters <code>(</code>, <code>)</code>, <code>[</code>, and <code>]</code>. Return <code>true</code> if every bracket is properly closed by a matching bracket in the correct order, otherwise <code>false</code>.',
    examples: [
      ['"([])"', 'true', 'Brackets nest correctly.'],
      ['"([)]"', 'false', 'The pairs interleave incorrectly.'],
    ],
    constraints: ['0 <= tokens.length <= 10^4', 'tokens consists only of ()[] characters'],
    tags: ['stack', 'strings'],
    py: `def isBalanced(tokens):
    pairs = {')': '(', ']': '['}
    st = []
    for ch in tokens:
        if ch in '([':
            st.append(ch)
        else:
            if not st or st[-1] != pairs[ch]:
                return False
            st.pop()
    return not st`,
    approach: 'Push opening brackets on a stack; on a closing bracket verify the top matches and pop. The string is balanced iff the stack ends empty with no mismatch.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"([])"'],
      ['"([)]"'],
      ['""'],
      ['"("'],
      ['")"'],
      ['"()[]"'],
      ['"[[[]]]"'],
      ['"([]([]))"'],
      ['"]["'],
      ['"(((("'],
    ],
  },
  {
    n: 505,
    id: 'pghub-b15-courier-zones',
    name: 'Courier Zone Grouping',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'maxPairs',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'A courier loads parcels of given <code>weights</code> into bags. Each bag holds at most two parcels and the combined weight may not exceed <code>limit</code>. Return the minimum number of bags needed to carry all parcels.',
    examples: [
      ['[1,2,3,4]\n5', '2', 'Pair (1,4) and (2,3): 2 bags.'],
      ['[3,3,3]\n5', '3', 'No two parcels fit together, so 3 bags.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit', '1 <= limit <= 10^9'],
    tags: ['two-pointers', 'greedy'],
    multiParam: true,
    py: `def maxPairs(weights, limit):
    weights = sorted(weights)
    lo, hi = 0, len(weights) - 1
    bags = 0
    while lo <= hi:
        if lo < hi and weights[lo] + weights[hi] <= limit:
            lo += 1
        hi -= 1
        bags += 1
    return bags`,
    approach: 'Sort weights, then greedily pair the lightest remaining parcel with the heaviest. If they fit together, advance both pointers; otherwise the heaviest goes alone. Each step consumes one bag.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,4]', '5'],
      ['[3,3,3]', '5'],
      ['[5]', '5'],
      ['[1,1,1,1]', '2'],
      ['[2,4,6,8]', '10'],
      ['[9,8,7,6,5]', '14'],
      ['[1,2,3,4,5,6]', '7'],
      ['[10,10,10,10]', '10'],
      ['[1,9,2,8,3,7]', '10'],
      ['[4,4,4,4,4]', '8'],
    ],
  },
  {
    n: 510,
    id: 'pghub-b15-elevation-search',
    name: 'Peak Elevation Index',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'peakIndex',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An array <code>heights</code> strictly increases to a single peak and then strictly decreases. Return the index of the peak element.',
    examples: [
      ['[1,3,5,4,2]', '2', 'The value 5 at index 2 is the peak.'],
      ['[1,2,3]', '2', 'Strictly increasing: the peak is the last element.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', 'heights forms a strictly bitonic sequence'],
    tags: ['binary-search', 'arrays'],
    py: `def peakIndex(heights):
    lo, hi = 0, len(heights) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if heights[mid] < heights[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    approach: 'Binary search on the slope: if the midpoint is rising, the peak lies to the right; otherwise it is at the midpoint or left. Converge the bounds onto the peak index.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[1,3,5,4,2]'],
      ['[1,2,3]'],
      ['[3,2,1]'],
      ['[5]'],
      ['[1,5]'],
      ['[5,1]'],
      ['[1,2,3,4,5,3,1]'],
      ['[10,20,15,2]'],
      ['[1,100,99,98,97]'],
      ['[2,4,6,8,10,9]'],
    ],
  },
  {
    n: 512,
    id: 'pghub-b15-thermostat-window',
    name: 'Comfortable Streak',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestComfort',
    params: [{ name: 'temps', type: 'List[int]' }, { name: 'lo', type: 'int' }, { name: 'hi', type: 'int' }],
    return_type: 'int',
    statement:
      'Hourly readings are given in <code>temps</code>. A reading is comfortable if it lies within the inclusive range <code>[lo, hi]</code>. Return the length of the longest contiguous run of comfortable readings.',
    examples: [
      ['[18,22,25,30,21]\n20\n26', '2', 'Readings 22 and 25 form the longest comfortable run.'],
      ['[10,11,12]\n20\n30', '0', 'No reading is comfortable.'],
    ],
    constraints: ['1 <= temps.length <= 10^5', '-100 <= temps[i] <= 100', 'lo <= hi'],
    tags: ['sliding-window', 'arrays'],
    multiParam: true,
    py: `def longestComfort(temps, lo, hi):
    best = cur = 0
    for t in temps:
        if lo <= t <= hi:
            cur += 1
            best = max(best, cur)
        else:
            cur = 0
    return best`,
    approach: 'Scan once tracking the length of the current comfortable run, resetting it whenever a reading falls outside the range, and keep the maximum run length seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[18,22,25,30,21]', '20', '26'],
      ['[10,11,12]', '20', '30'],
      ['[21,22,23,24]', '20', '26'],
      ['[5]', '5', '5'],
      ['[1,2,3,4,5]', '2', '4'],
      ['[100,-100,50]', '-100', '100'],
      ['[0,0,0]', '0', '0'],
      ['[30,20,30,20,30]', '20', '20'],
      ['[15,25,35,25,15]', '20', '30'],
      ['[-5,-4,-3,-2]', '-4', '-2'],
    ],
  },
  {
    n: 527,
    id: 'pghub-b15-island-perimeter',
    name: 'Lake Shoreline Length',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shoreline',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. There is exactly one connected landmass with no internal lakes. Return the perimeter (shoreline length) of the landmass, counting each land edge adjacent to water or the grid border.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'A plus shape has 12 exposed edges.'],
      ['[[1]]', '4', 'A single cell exposes 4 edges.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one connected landmass'],
    tags: ['graphs', 'matrix'],
    py: `def shoreline(grid):
    rows, cols = len(grid), len(grid[0])
    per = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                per += 4
                if r > 0 and grid[r - 1][c] == 1:
                    per -= 2
                if c > 0 and grid[r][c - 1] == 1:
                    per -= 2
    return per`,
    approach: 'Each land cell contributes 4 edges. For every shared edge with a land neighbor above or to the left, subtract 2 (one from each cell). The remainder is the exposed perimeter.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[0,1,1,0],[0,1,1,0]]'],
    ],
  },
  {
    n: 531,
    id: 'pghub-b15-relay-chain',
    name: 'Relay Chain Reachability',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'canReach',
    params: [
      { name: 'n', type: 'int' },
      { name: 'links', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'bool',
    statement:
      'A relay network has <code>n</code> nodes numbered <code>0..n-1</code> connected by directed <code>links</code>, each <code>[a, b]</code> meaning a signal can pass from a to b. Return <code>true</code> if a signal starting at <code>src</code> can reach <code>dst</code>.',
    examples: [
      ['4\n[[0,1],[1,2],[2,3]]\n0\n3', 'true', 'The chain 0->1->2->3 connects source to destination.'],
      ['3\n[[0,1],[1,0]]\n0\n2', 'false', 'Node 2 is unreachable.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= links.length <= 10^5', '0 <= a, b, src, dst < n'],
    tags: ['graphs', 'bfs'],
    multiParam: true,
    py: `def canReach(n, links, src, dst):
    adj = defaultdict(list)
    for a, b in links:
        adj[a].append(b)
    seen = {src}
    dq = deque([src])
    while dq:
        u = dq.popleft()
        if u == dst:
            return True
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                dq.append(v)
    return dst in seen`,
    approach: 'Build a directed adjacency list and run BFS from the source, marking visited nodes. Return true as soon as the destination is dequeued or was reached.',
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
    cases: [
      ['4', '[[0,1],[1,2],[2,3]]', '0', '3'],
      ['3', '[[0,1],[1,0]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['2', '[[0,1]]', '1', '0'],
      ['5', '[[0,1],[0,2],[2,3],[3,4]]', '0', '4'],
      ['5', '[[0,1],[2,3]]', '0', '3'],
      ['3', '[[0,1],[1,2],[2,0]]', '2', '1'],
      ['4', '[[1,2],[2,3]]', '0', '3'],
      ['6', '[[0,1],[1,2],[3,4],[4,5]]', '3', '5'],
      ['2', '[]', '0', '1'],
    ],
  },
  {
    n: 533,
    id: 'pghub-b15-coin-change-ways',
    name: 'Token Combination Count',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [{ name: 'tokens', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    statement:
      'You have an unlimited supply of tokens with the distinct denominations in <code>tokens</code>. Return the number of distinct combinations (order does not matter) of tokens whose values sum exactly to <code>target</code>.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5; 2+2+1; 2+1+1+1; 1*5.'],
      ['[2]\n3', '0', 'No combination of 2s makes 3.'],
    ],
    constraints: ['1 <= tokens.length <= 100', '1 <= tokens[i] <= 1000', '0 <= target <= 5000'],
    tags: ['dp', 'combinatorics'],
    multiParam: true,
    py: `def countWays(tokens, target):
    dp = [0] * (target + 1)
    dp[0] = 1
    for t in tokens:
        for amt in range(t, target + 1):
            dp[amt] += dp[amt - t]
    return dp[target]`,
    approach: 'Unbounded-knapsack counting: dp[a] is the number of ways to form amount a. Process each denomination in the outer loop so order is ignored, accumulating ways into higher amounts.',
    complexity: { time: 'O(len(tokens) * target)', space: 'O(target)' },
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10]', '15'],
      ['[3,7]', '12'],
      ['[2,5,10]', '20'],
      ['[1,5,10,25]', '30'],
      ['[4]', '8'],
      ['[7,11]', '100'],
    ],
  },
  {
    n: 534,
    id: 'pghub-b15-rolling-median',
    name: 'Stream Median Tracker',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'runningMedians',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[float]',
    statement:
      'Process the integers in <code>nums</code> one at a time. After each insertion, record the median of all numbers seen so far. Return the list of medians (the median of an even count is the average of the two middle values).',
    examples: [
      ['[2,1,5,7,2,0,5]', '[2.0,1.5,2.0,3.5,2.0,2.0,2.0]', 'Median is recomputed after each insertion.'],
      ['[4]', '[4.0]', 'A single value is its own median.'],
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^6 <= nums[i] <= 10^6'],
    tags: ['heap', 'design'],
    py: `def runningMedians(nums):
    low = []   # max-heap (negated)
    high = []  # min-heap
    out = []
    for x in nums:
        if not low or x <= -low[0]:
            heapq.heappush(low, -x)
        else:
            heapq.heappush(high, x)
        if len(low) > len(high) + 1:
            heapq.heappush(high, -heapq.heappop(low))
        elif len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        if len(low) > len(high):
            out.append(float(-low[0]))
        else:
            out.append((-low[0] + high[0]) / 2.0)
    return out`,
    approach: 'Maintain a max-heap for the lower half and a min-heap for the upper half, rebalancing so their sizes differ by at most one. The median is the lower-half top, or the average of both tops when the halves are equal.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[2,1,5,7,2,0,5]'],
      ['[4]'],
      ['[1,2]'],
      ['[3,3,3,3]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[-10,0,10]'],
      ['[1000000,-1000000]'],
      ['[7,7,7,8,8]'],
      ['[0,0,0,0,0,0]'],
    ],
  },
  {
    n: 536,
    id: 'pghub-b15-bit-parity-grid',
    name: 'Even Parity Switches',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'flipsToEven',
    params: [{ name: 'masks', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Each value in <code>masks</code> is a non-negative integer representing a row of switches in binary (set bit = on). A row is "balanced" if it has an even number of on switches. For each unbalanced row, exactly one flip is needed to balance it. Return the total number of flips required across all rows.',
    examples: [
      ['[7,4,0]', '2', '7 has 3 on bits (1 flip), 4 has 1 (1 flip), 0 has 0 (balanced).'],
      ['[3,5,6]', '0', 'Each has an even count of on bits.'],
    ],
    constraints: ['1 <= masks.length <= 10^5', '0 <= masks[i] <= 2^31 - 1'],
    tags: ['bit-manipulation', 'math'],
    py: `def flipsToEven(masks):
    return sum(bin(m).count('1') & 1 for m in masks)`,
    approach: 'A row needs one flip exactly when its popcount is odd. Sum the low bit of each popcount across all rows.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[7,4,0]'],
      ['[3,5,6]'],
      ['[0]'],
      ['[1]'],
      ['[2147483647]'],
      ['[1,1,1,1]'],
      ['[15,15,15]'],
      ['[8,4,2,1]'],
      ['[1023,512,256]'],
      ['[6,9,12,3]'],
    ],
  },
  {
    n: 544,
    id: 'pghub-b15-meeting-merge',
    name: 'Conference Room Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeBookings',
    params: [{ name: 'bookings', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'A room has reservations given as <code>bookings</code>, each <code>[start, end]</code> with <code>start &lt; end</code>. Overlapping or touching reservations should be combined into one. Return the merged reservations sorted by start time.',
    examples: [
      ['[[1,3],[2,6],[8,10],[10,12]]', '[[1,6],[8,12]]', '[1,3] and [2,6] overlap; [8,10] and [10,12] touch.'],
      ['[[5,7]]', '[[5,7]]', 'A single booking is unchanged.'],
    ],
    constraints: ['1 <= bookings.length <= 10^4', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeBookings(bookings):
    bookings = sorted(bookings)
    merged = []
    for s, e in bookings:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged`,
    approach: 'Sort by start time, then sweep left to right. Extend the last merged interval whenever the next booking starts at or before its end; otherwise begin a new interval.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[10,12]]'],
      ['[[5,7]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[6,8],[1,9],[2,4],[4,7]]'],
      ['[[0,0]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[3,4],[1,2]]'],
      ['[[1,3],[5,7],[2,6]]'],
    ],
  },
  {
    n: 545,
    id: 'pghub-b15-spiral-readout',
    name: 'Spiral Matrix Readout',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'spiralRead',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'Given a 2D <code>matrix</code>, return all of its elements in clockwise spiral order, starting from the top-left corner.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '[1,2,3,6,9,8,7,4,5]', 'Spiral inward clockwise.'],
      ['[[1,2],[3,4]]', '[1,2,4,3]', 'A 2x2 spiral.'],
    ],
    constraints: ['1 <= matrix.length, matrix[0].length <= 100', '-1000 <= matrix[i][j] <= 1000'],
    tags: ['arrays', 'matrix'],
    py: `def spiralRead(matrix):
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1
    return res`,
    approach: 'Track four boundaries (top, bottom, left, right). Traverse the top row, right column, bottom row, and left column in turn, shrinking the corresponding boundary after each pass until the boundaries cross.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,2],[3,4]]'],
      ['[[1]]'],
      ['[[1,2,3,4]]'],
      ['[[1],[2],[3]]'],
      ['[[1,2,3],[4,5,6]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'],
      ['[[7,7],[7,7]]'],
    ],
  },
  {
    n: 548,
    id: 'pghub-b15-word-ladder-cost',
    name: 'Trail Mix Backtrack',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'subsetSums',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given a list of distinct positive integers <code>nums</code>, return the sorted list of all distinct subset sums, including the empty subset (sum 0).',
    examples: [
      ['[1,2]', '[0,1,2,3]', 'Subsets: {}, {1}, {2}, {1,2}.'],
      ['[5]', '[0,5]', 'Only the empty set and {5}.'],
    ],
    constraints: ['1 <= nums.length <= 16', '1 <= nums[i] <= 1000', 'all nums[i] are distinct'],
    tags: ['backtracking', 'bit-manipulation'],
    py: `def subsetSums(nums):
    sums = set()
    def backtrack(i, total):
        if i == len(nums):
            sums.add(total)
            return
        backtrack(i + 1, total)
        backtrack(i + 1, total + nums[i])
    backtrack(0, 0)
    return sorted(sums)`,
    approach: 'Recursively decide to include or exclude each element, recording the running total at the leaves. Deduplicate via a set, then return the sorted sums.',
    complexity: { time: 'O(2^n)', space: 'O(2^n)' },
    cases: [
      ['[1,2]'],
      ['[5]'],
      ['[1,2,3]'],
      ['[10,20,40]'],
      ['[7]'],
      ['[1,2,4,8]'],
      ['[3,6,9]'],
      ['[100,200]'],
      ['[1,5,11]'],
      ['[2,3,5,7]'],
    ],
  },
  {
    n: 549,
    id: 'pghub-b15-tree-tilt',
    name: 'Binary Tree Tilt Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'totalTilt',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given in level-order as <code>values</code>, where <code>null</code> marks a missing child. The tilt of a node is the absolute difference between the sum of its left subtree values and the sum of its right subtree values. Return the sum of every node tilt in the tree.',
    examples: [
      ['[1,2,3]', '1', 'Root tilt is |2-3|=1; leaves have tilt 0.'],
      ['[4,2,9,3,5,7]', '15', 'Sum of all node tilts.'],
    ],
    constraints: ['0 <= number of nodes <= 10^4', '-1000 <= node value <= 1000', 'values is a level-order array with null for gaps'],
    tags: ['trees', 'dfs'],
    py: `def totalTilt(values):
    if not values or values[0] is None:
        return 0
    # build tree from level-order with None gaps
    n = len(values)
    children = {}
    idx = 1
    nodes = list(range(n))
    for i in range(n):
        if values[i] is None:
            continue
        left = right = None
        if idx < n:
            if values[idx] is not None:
                left = idx
            idx += 1
        if idx < n:
            if values[idx] is not None:
                right = idx
            idx += 1
        children[i] = (left, right)
    total = [0]
    def dfs(i):
        if i is None or values[i] is None:
            return 0
        l, r = children.get(i, (None, None))
        ls = dfs(l)
        rs = dfs(r)
        total[0] += abs(ls - rs)
        return values[i] + ls + rs
    dfs(0)
    return total[0]`,
    approach: 'Reconstruct the tree from the level-order array (skipping null slots), then run a post-order DFS that returns each subtree sum. At every node accumulate the absolute difference between its left and right subtree sums.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3]'],
      ['[4,2,9,3,5,7]'],
      ['[]'],
      ['[5]'],
      ['[1,null,3]'],
      ['[1,2,null,4]'],
      ['[10,3,8,null,null,2,7]'],
      ['[0,0,0]'],
      ['[-5,3,-2]'],
      ['[1,2,3,4,5,6,7]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B15>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b15-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B15>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B15>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b15-grade-${prob.n}.py`);
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
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green PGHub rows. Target count ${wanted.length}.`);
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
