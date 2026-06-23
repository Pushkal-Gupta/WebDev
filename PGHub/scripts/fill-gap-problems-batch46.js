#!/usr/bin/env node
// Batch 46 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3058,3059,3060,3061,3062,3063,3064,3073,3078,3087,3088,3089,3094,3166,3167
//
//   node scripts/fill-gap-problems-batch46.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch46.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch46.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3058, 3059, 3060, 3061, 3062, 3063, 3064, 3073, 3078, 3087, 3088, 3089, 3094, 3166, 3167];

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
    n: 3058,
    id: 'pghub-b46-warehouse-aisles',
    name: 'Warehouse Aisle Restock',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'restockTrips',
    params: [
      { name: 'demands', type: 'List[int]' },
      { name: 'cartSize', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A worker restocks aisles in the fixed order given by <code>demands</code>, where <code>demands[i]</code> is the number of boxes aisle <code>i</code> needs. The worker carries one cart holding at most <code>cartSize</code> boxes and never splits an aisle across trips: an aisle is served fully in a single trip. Starting empty, the worker keeps adding whole aisles to the cart while it still fits, otherwise returns to the depot (a new trip) and continues. Every aisle needs at most <code>cartSize</code> boxes. Return the number of trips made.',
    examples: [
      ['[3,3,3]\n5', '3', 'Each aisle alone fits, but no two aisles fit together, so three trips.'],
      ['[1,2,2,1]\n3', '2', 'Trip 1 serves 1+2; trip 2 serves 2+1.'],
    ],
    constraints: ['1 <= demands.length <= 10^5', '1 <= demands[i] <= cartSize', '1 <= cartSize <= 10^9'],
    tags: ['greedy', 'arrays'],
    py: `def restockTrips(demands, cartSize):
    trips = 0
    load = 0
    for d in demands:
        if load + d > cartSize:
            trips += 1
            load = 0
        load += d
    if load > 0:
        trips += 1
    return trips`,
    approach:
      'Sweep aisles in order, tracking the boxes currently in the cart. When the next aisle would overflow the cart, close the current trip and start fresh. A non-empty cart at the end is one final trip.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,3,3]', '5'],
      ['[1,2,2,1]', '3'],
      ['[5]', '5'],
      ['[1,1,1,1,1]', '2'],
      ['[4,4,4,4]', '4'],
      ['[2,3,5,1,1]', '6'],
      ['[10,10,10]', '10'],
      ['[1,1,1,1,1,1,1]', '3'],
      ['[7,2,2,2,7]', '8'],
      ['[6,6,6,6,6,6]', '12'],
    ],
  },
  {
    n: 3059,
    id: 'pghub-b46-pair-temperature',
    name: 'Closest Temperature Pair',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'closestPairDiff',
    params: [{ name: 'temps', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given a list <code>temps</code> of temperature readings, return the smallest absolute difference between any two distinct readings. There are always at least two readings.',
    examples: [
      ['[10,3,7,1]', '2', 'The pair 3 and 1 differ by 2, the minimum.'],
      ['[5,5,5]', '0', 'Two equal readings differ by 0.'],
    ],
    constraints: ['2 <= temps.length <= 10^5', '-10^9 <= temps[i] <= 10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def closestPairDiff(temps):
    s = sorted(temps)
    best = min(s[i + 1] - s[i] for i in range(len(s) - 1))
    return best`,
    approach:
      'After sorting, the closest pair is always adjacent, because any non-adjacent pair brackets an adjacent pair with a difference no larger. Sort once and scan consecutive differences for the minimum.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[10,3,7,1]'],
      ['[5,5,5]'],
      ['[1,100]'],
      ['[-5,-2,-9,-1]'],
      ['[0,0]'],
      ['[8,3,11,4,6]'],
      ['[1000000000,-1000000000]'],
      ['[2,4,6,8,10]'],
      ['[7,7,1,1]'],
      ['[3,1,4,1,5,9,2,6]'],
    ],
  },
  {
    n: 3060,
    id: 'pghub-b46-bracket-depth',
    name: 'Maximum Bracket Nesting',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxNesting',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code> and is guaranteed to be a valid balanced bracket sequence. Return the maximum nesting depth, i.e. the greatest number of brackets open at the same time.',
    examples: [
      ['(())', '2', 'The inner pair sits inside the outer pair.'],
      ['()()', '1', 'No pair is nested inside another.'],
    ],
    constraints: ['0 <= s.length <= 10^5', "s consists only of '(' and ')'", 's is a valid balanced sequence'],
    tags: ['stack', 'strings'],
    py: `def maxNesting(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == '(':
            depth += 1
            if depth > best:
                best = depth
        else:
            depth -= 1
    return best`,
    approach:
      'A balanced sequence needs no explicit stack: just track a running open-bracket count, incrementing on "(" and decrementing on ")". The peak value of that counter is the maximum nesting depth.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(())"'],
      ['"()()"'],
      ['""'],
      ['"((()))"'],
      ['"(()(()))"'],
      ['"()"'],
      ['"(()())"'],
      ['"((())())"'],
      ['"()(())()"'],
      ['"(((())))"'],
    ],
  },
  {
    n: 3061,
    id: 'pghub-b46-coin-rows',
    name: 'Skip-One Coin Collection',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxCoins',
    params: [{ name: 'coins', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Coins are laid in a row with values <code>coins</code>. You may pick any subset of coins but never two coins that are directly adjacent in the row. Return the maximum total value you can collect.',
    examples: [
      ['[2,7,9,3,1]', '12', 'Pick 2, 9, 1 for a total of 12.'],
      ['[5,5,10,100,10,5]', '110', 'Pick 5, 100, 5.'],
    ],
    constraints: ['0 <= coins.length <= 10^5', '0 <= coins[i] <= 10^4'],
    tags: ['dp', 'arrays'],
    py: `def maxCoins(coins):
    take = 0
    skip = 0
    for c in coins:
        new_take = skip + c
        new_skip = max(skip, take)
        take, skip = new_take, new_skip
    return max(take, skip)`,
    approach:
      'This is the classic house-robber recurrence. Keep two running values: the best total ending with the current coin taken, and the best ending with it skipped. Taking a coin builds on the previous skipped state; skipping keeps the better of the two previous states.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,7,9,3,1]'],
      ['[5,5,10,100,10,5]'],
      ['[]'],
      ['[7]'],
      ['[1,2]'],
      ['[0,0,0,0]'],
      ['[10,1,1,10]'],
      ['[3,2,5,10,7]'],
      ['[1,1,1,1,1,1]'],
      ['[100,1,1,1,100]'],
    ],
  },
  {
    n: 3062,
    id: 'pghub-b46-token-bucket',
    name: 'Token Bucket Admissions',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'admitted',
    params: [
      { name: 'arrivals', type: 'List[int]' },
      { name: 'rate', type: 'int' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A token bucket starts full with <code>capacity</code> tokens. At each tick listed in the strictly increasing array <code>arrivals</code> exactly one request arrives. Between consecutive ticks the bucket gains <code>rate</code> tokens per unit time, never exceeding <code>capacity</code>. A request is admitted if at least one token is available at its tick, consuming one token; otherwise it is rejected and consumes nothing. Return the number of admitted requests.',
    examples: [
      ['[0,1,2,3]\n0\n2', '2', 'No refill; only the first two requests find a token.'],
      ['[0,2,4]\n1\n1', '3', 'One token regenerates between each arrival.'],
    ],
    constraints: ['1 <= arrivals.length <= 10^5', 'arrivals strictly increasing, 0 <= arrivals[i] <= 10^9', '0 <= rate <= 10^4', '1 <= capacity <= 10^9'],
    tags: ['queue', 'simulation'],
    py: `def admitted(arrivals, rate, capacity):
    tokens = capacity
    prev = arrivals[0]
    count = 0
    for i, t in enumerate(arrivals):
        if i > 0:
            tokens = min(capacity, tokens + (t - prev) * rate)
            prev = t
        if tokens >= 1:
            tokens -= 1
            count += 1
    return count`,
    approach:
      'Replay the timeline in order. Before each arrival after the first, add the tokens regenerated since the previous tick, capped at the bucket capacity. If a whole token is available, admit and consume it; otherwise reject. Track admissions.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[0,1,2,3]', '0', '2'],
      ['[0,2,4]', '1', '1'],
      ['[0]', '0', '1'],
      ['[0,1,2,3,4]', '1', '3'],
      ['[0,10,20]', '5', '10'],
      ['[0,1,2,3,4,5]', '0', '5'],
      ['[1,2,3]', '2', '2'],
      ['[0,100]', '0', '1'],
      ['[0,1,2,3]', '1', '2'],
      ['[5,6,7,8,9,10]', '0', '3'],
    ],
  },
  {
    n: 3063,
    id: 'pghub-b46-roman-toll',
    name: 'Roman Numeral Toll',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'romanToInt',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A toll gate displays its fee as an uppercase Roman numeral <code>s</code> using the symbols I=1, V=5, X=10, L=50, C=100, D=500, M=1000. When a smaller symbol appears directly before a larger one it is subtracted (e.g. IV is 4). Return the integer value of the numeral.',
    examples: [
      ['"MCMXCIV"', '1994', 'M=1000, CM=900, XC=90, IV=4.'],
      ['"LVIII"', '58', 'L=50, V=5, III=3.'],
    ],
    constraints: ['1 <= s.length <= 15', 's is a valid Roman numeral in the range 1..3999'],
    tags: ['strings', 'math'],
    py: `def romanToInt(s):
    vals = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    total = 0
    for i, ch in enumerate(s):
        v = vals[ch]
        if i + 1 < len(s) and vals[s[i + 1]] > v:
            total -= v
        else:
            total += v
    return total`,
    approach:
      'Scan left to right. A symbol is subtracted when the symbol immediately after it has a larger value (the subtractive notation), otherwise it is added. Summing these signed values gives the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"MCMXCIV"'],
      ['"LVIII"'],
      ['"III"'],
      ['"IV"'],
      ['"IX"'],
      ['"XL"'],
      ['"XCIX"'],
      ['"MMMCMXCIX"'],
      ['"DCCCXC"'],
      ['"I"'],
    ],
  },
  {
    n: 3064,
    id: 'pghub-b46-sensor-window',
    name: 'Longest Stable Sensor Run',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestStable',
    params: [
      { name: 'readings', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A sensor logs the values in <code>readings</code>. A run is considered stable if the difference between its maximum and minimum value is at most <code>limit</code>. Return the length of the longest contiguous stable run.',
    examples: [
      ['[8,2,4,7]\n4', '2', 'The pair [2,4] spans 2; longer windows exceed the limit.'],
      ['[10,1,2,4,7,2]\n5', '4', 'The window [2,4,7,2] spans 5.'],
    ],
    constraints: ['1 <= readings.length <= 10^5', '0 <= readings[i] <= 10^9', '0 <= limit <= 10^9'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestStable(readings, limit):
    max_dq = deque()
    min_dq = deque()
    left = 0
    best = 0
    for right, v in enumerate(readings):
        while max_dq and readings[max_dq[-1]] <= v:
            max_dq.pop()
        max_dq.append(right)
        while min_dq and readings[min_dq[-1]] >= v:
            min_dq.pop()
        min_dq.append(right)
        while readings[max_dq[0]] - readings[min_dq[0]] > limit:
            left += 1
            if max_dq[0] < left:
                max_dq.popleft()
            if min_dq[0] < left:
                min_dq.popleft()
        if right - left + 1 > best:
            best = right - left + 1
    return best`,
    approach:
      'Slide a window with two monotonic deques tracking the current window maximum and minimum. Whenever the spread exceeds the limit, shrink from the left and evict deque heads that fall outside the window. The largest valid window width is the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[8,2,4,7]', '4'],
      ['[10,1,2,4,7,2]', '5'],
      ['[5]', '0'],
      ['[1,1,1,1]', '0'],
      ['[1,5,9,13]', '3'],
      ['[4,2,2,2,4,4,2,2]', '0'],
      ['[1,2,3,4,5]', '10'],
      ['[100,1,100,1]', '50'],
      ['[3,3,3,3,3]', '1'],
      ['[7,1,4,9,2,6,8,3]', '6'],
    ],
  },
  {
    n: 3073,
    id: 'pghub-b46-modular-power',
    name: 'Repeated Squaring Modulo',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'powMod',
    params: [
      { name: 'base', type: 'int' },
      { name: 'exp', type: 'int' },
      { name: 'mod', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Compute <code>(base ^ exp) mod mod</code> efficiently using only integer arithmetic. The exponent <code>exp</code> can be very large. If <code>mod</code> is 1 the result is always 0.',
    examples: [
      ['2\n10\n1000', '24', '2^10 = 1024, and 1024 mod 1000 = 24.'],
      ['7\n0\n5', '1', 'Any base to the power 0 is 1, then mod 5.'],
    ],
    constraints: ['0 <= base <= 10^9', '0 <= exp <= 10^18', '1 <= mod <= 10^9'],
    tags: ['math', 'bit-manipulation'],
    py: `def powMod(base, exp, mod):
    if mod == 1:
        return 0
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp >>= 1
    return result`,
    approach:
      'Use binary exponentiation: square the base repeatedly while walking the bits of the exponent, multiplying the accumulated result by the current base whenever the active bit is set. All products are reduced modulo mod to keep numbers small.',
    complexity: { time: 'O(log exp)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['2', '10', '1000'],
      ['7', '0', '5'],
      ['3', '5', '7'],
      ['10', '18', '1000000000'],
      ['5', '3', '1'],
      ['2', '1000000000', '1000000007'],
      ['0', '0', '13'],
      ['0', '5', '13'],
      ['123', '456', '789'],
      ['999999999', '2', '1000000007'],
    ],
  },
  {
    n: 3078,
    id: 'pghub-b46-grid-region-perimeter',
    name: 'Region Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for land and <code>0</code> for water, with exactly one connected land region (cells connected orthogonally) and no internal lakes. Return the perimeter of that region, counting each exposed cell edge as length 1.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'A plus shape exposes 12 unit edges.'],
      ['[[1]]', '4', 'A single cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one connected land region'],
    tags: ['graphs', 'arrays'],
    py: `def islandPerimeter(grid):
    rows = len(grid)
    cols = len(grid[0])
    perim = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perim += 4
                if r > 0 and grid[r - 1][c] == 1:
                    perim -= 2
                if c > 0 and grid[r][c - 1] == 1:
                    perim -= 2
    return perim`,
    approach:
      'Every land cell contributes four edges. For each shared border with an already-counted neighbour above or to the left, subtract two (one edge from each cell). Visiting cells once and looking only up and left avoids double counting.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1],[1,0]]'],
    ],
  },
  {
    n: 3087,
    id: 'pghub-b46-rotate-vault',
    name: 'Rotate Vault Dial',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findRotation',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A vault dial held a strictly ascending sequence of distinct integers that was then rotated left by some unknown number of positions, producing <code>nums</code>. Return the index of the smallest element, which equals the number of positions the array was rotated. Aim for logarithmic time.',
    examples: [
      ['[4,5,6,7,0,1,2]', '4', 'The smallest value 0 sits at index 4.'],
      ['[1,2,3]', '0', 'No rotation; the minimum is at the front.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', 'nums is a rotation of a strictly ascending array of distinct integers', '-10^9 <= nums[i] <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def findRotation(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    approach:
      'Binary search for the pivot. If the midpoint value exceeds the high end, the minimum lies strictly to the right of mid; otherwise it is at mid or to its left. Narrowing this way converges on the index of the smallest element.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[4,5,6,7,0,1,2]'],
      ['[1,2,3]'],
      ['[3,1,2]'],
      ['[2,3,4,5,1]'],
      ['[1]'],
      ['[5,1,2,3,4]'],
      ['[2,1]'],
      ['[6,7,8,9,1,2,3,4,5]'],
      ['[10,20,30,40,50]'],
      ['[30,40,50,10,20]'],
    ],
  },
  {
    n: 3088,
    id: 'pghub-b46-task-deadlines',
    name: 'Deadline Task Scheduler',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'maxProfit',
    params: [{ name: 'jobs', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[deadline, profit]</code> in <code>jobs</code> is a unit-length job that must run on its own integer time slot at or before its deadline; slots start at time 1. At most one job runs per slot. Return the maximum total profit achievable by choosing which jobs to schedule.',
    examples: [
      ['[[2,100],[1,19],[2,27],[1,25]]', '127', 'Schedule the profit-100 job in slot 2 and the profit-27 job in slot 1.'],
      ['[[1,50],[1,40],[1,30]]', '50', 'Only one slot at time 1 is usable; take the best.'],
    ],
    constraints: ['1 <= jobs.length <= 10^5', '1 <= deadline <= 10^5', '1 <= profit <= 10^9'],
    tags: ['heap', 'greedy'],
    py: `def maxProfit(jobs):
    order = sorted(jobs, key=lambda j: j[0])
    heap = []
    for deadline, profit in order:
        heapq.heappush(heap, profit)
        if len(heap) > deadline:
            heapq.heappop(heap)
    return sum(heap)`,
    approach:
      'Process jobs in increasing deadline order, keeping a min-heap of accepted profits. Tentatively accept each job; if accepting more jobs than the current deadline allows, drop the least profitable one from the heap. The heap always holds a feasible, maximum-profit selection, so its sum is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[2,100],[1,19],[2,27],[1,25]]'],
      ['[[1,50],[1,40],[1,30]]'],
      ['[[1,10]]'],
      ['[[3,1],[3,1],[3,1],[3,1]]'],
      ['[[1,5],[2,5],[3,5]]'],
      ['[[2,20],[2,20],[2,20]]'],
      ['[[4,70],[1,80],[1,30],[1,90],[3,60]]'],
      ['[[1,100],[2,200],[3,300]]'],
      ['[[5,1],[1,5],[2,4],[3,3],[4,2]]'],
      ['[[1,1000000000],[1,1]]'],
    ],
  },
  {
    n: 3089,
    id: 'pghub-b46-trie-autocomplete',
    name: 'Prefix Autocomplete Count',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'prefixCounts',
    params: [
      { name: 'words', type: 'List[str]' },
      { name: 'queries', type: 'List[str]' },
    ],
    return_type: 'List[int]',
    statement:
      'Given a dictionary <code>words</code> and a list of <code>queries</code>, for each query return how many dictionary words start with that query as a prefix. A word is a prefix of itself. Return the answers in query order.',
    examples: [
      ['["apple","app","apply","banana"]\n["app","ban","x"]', '[3,1,0]', '"app" prefixes apple/app/apply.'],
      ['["a"]\n["a","aa"]', '[1,0]', '"a" matches a; "aa" matches nothing.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= queries.length <= 10^4', 'words and queries are lowercase letters, length 1..20'],
    tags: ['tries', 'strings'],
    py: `def prefixCounts(words, queries):
    root = {}
    for w in words:
        node = root
        for ch in w:
            if ch not in node:
                node[ch] = {'_c': 0}
            node = node[ch]
            node['_c'] += 1
    res = []
    for q in queries:
        node = root
        ok = True
        for ch in q:
            if ch not in node:
                ok = False
                break
            node = node[ch]
        res.append(node['_c'] if ok else 0)
    return res`,
    approach:
      'Insert each word into a trie, storing at every node the number of words that pass through it. To answer a query, walk down the trie following the query characters; the count stored at the final node is exactly the number of words sharing that prefix, or zero if the path breaks.',
    complexity: { time: 'O(total characters)', space: 'O(total characters)' },
    multiParam: true,
    cases: [
      ['["apple","app","apply","banana"]', '["app","ban","x"]'],
      ['["a"]', '["a","aa"]'],
      ['["abc","abd","abe"]', '["ab","abc","abz"]'],
      ['["cat","car","card","dog"]', '["ca","car","do","d"]'],
      ['["x","y","z"]', '["x","w"]'],
      ['["hello","help","held"]', '["hel","help","helm"]'],
      ['["one"]', '["one","on","o"]'],
      ['["aa","aaa","aaaa"]', '["aa","aaa","a"]'],
      ['["red","green","blue"]', '["r","g","b","gr"]'],
      ['["test","testing","tester"]', '["test","tes","testi"]'],
    ],
  },
  {
    n: 3094,
    id: 'pghub-b46-tree-vertical-sum',
    name: 'Vertical Column Sums',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'verticalSums',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A binary tree is given as a level-order list <code>tree</code> where <code>-1</code> marks an absent node and the root is at index 0; for a node at index <code>i</code> its children are at indices <code>2*i+1</code> (left) and <code>2*i+2</code> (right). Assign the root column 0, a left child its parent column minus 1, and a right child plus 1. Return the sum of node values in each column, ordered from the leftmost column to the rightmost. An empty tree returns an empty list.',
    examples: [
      ['[1,2,3,4,5,6,7]', '[4,2,12,3,7]', 'Columns -2..2 sum to 4,2,12,3,7.'],
      ['[5]', '[5]', 'Single root in column 0.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'node values between -10^4 and 10^4', '-1 marks an absent node'],
    tags: ['trees', 'bfs'],
    py: `def verticalSums(tree):
    if not tree or tree[0] == -1:
        return []
    n = len(tree)
    col_sum = defaultdict(int)
    queue = deque([(0, 0)])
    while queue:
        idx, col = queue.popleft()
        if idx >= n or tree[idx] == -1:
            continue
        col_sum[col] += tree[idx]
        left, right = 2 * idx + 1, 2 * idx + 2
        if left < n and tree[left] != -1:
            queue.append((left, col - 1))
        if right < n and tree[right] != -1:
            queue.append((right, col + 1))
    return [col_sum[c] for c in range(min(col_sum), max(col_sum) + 1)]`,
    approach:
      'Breadth-first traverse the array-encoded tree, carrying each node\'s column index (left child decrements, right child increments). Accumulate values per column in a map, then emit the column sums from the minimum to the maximum column index.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4,5,6,7]'],
      ['[5]'],
      ['[]'],
      ['[-1]'],
      ['[1,2,3]'],
      ['[1,2,-1,3,-1]'],
      ['[10,-1,20,-1,-1,-1,30]'],
      ['[1,2,3,-1,4,5,-1]'],
      ['[3,9,20,-1,-1,15,7]'],
      ['[0,1,-1,2,-1,-1,-1,3]'],
    ],
  },
  {
    n: 3166,
    id: 'pghub-b46-flip-segments',
    name: 'Minimum Flips To Uniform',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minFlips',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A binary string <code>s</code> consists of <code>0</code> and <code>1</code>. In one operation you may flip every character from some chosen index to the end of the string (a suffix flip). Return the minimum number of operations needed to make all characters equal.',
    examples: [
      ['"00110"', '2', 'Boundaries between differing neighbours: 0|1 and 1|0 -> 2 flips.'],
      ['"0000"', '0', 'Already uniform.'],
    ],
    constraints: ['1 <= s.length <= 10^5', "s consists only of '0' and '1'"],
    tags: ['greedy', 'strings'],
    py: `def minFlips(s):
    flips = 0
    for i in range(1, len(s)):
        if s[i] != s[i - 1]:
            flips += 1
    return flips`,
    approach:
      'Each suffix flip can remove exactly one boundary between adjacent differing characters. The string is uniform precisely when no such boundary remains, so the minimum number of operations equals the count of adjacent differing pairs.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"00110"'],
      ['"0000"'],
      ['"1"'],
      ['"01"'],
      ['"010101"'],
      ['"111000"'],
      ['"1100"'],
      ['"0110"'],
      ['"1010101010"'],
      ['"00011000"'],
    ],
  },
  {
    n: 3167,
    id: 'pghub-b46-subset-equal-sum',
    name: 'Partition Into Equal Sums',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'canPartition',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'Given an array <code>nums</code> of non-negative integers, return <code>true</code> if the array can be split into two subsets whose sums are equal, and <code>false</code> otherwise.',
    examples: [
      ['[1,5,11,5]', 'true', 'Subsets [11] and [1,5,5] both sum to 11.'],
      ['[1,2,3,5]', 'false', 'Total is 11, which is odd, so no equal split exists.'],
    ],
    constraints: ['1 <= nums.length <= 200', '0 <= nums[i] <= 100'],
    tags: ['dp', 'subset-sum'],
    py: `def canPartition(nums):
    total = sum(nums)
    if total % 2 != 0:
        return False
    target = total // 2
    reachable = 1  # bit i set means sum i is reachable
    for x in nums:
        reachable |= reachable << x
    return (reachable >> target) & 1 == 1`,
    approach:
      'An equal split requires the total to be even; the goal is a subset summing to half. Track reachable subset sums as bits of a big integer: shifting by each value and OR-ing folds that value into every previously reachable sum. The target is reachable when its bit is set.',
    complexity: { time: 'O(n * sum / 64)', space: 'O(sum)' },
    cases: [
      ['[1,5,11,5]'],
      ['[1,2,3,5]'],
      ['[1,1]'],
      ['[2]'],
      ['[0,0]'],
      ['[3,3,3,4,5]'],
      ['[1,2,5]'],
      ['[100,100]'],
      ['[1,2,3,4,5,6,7]'],
      ['[2,2,2,2,2,2]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B46>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b46-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B46>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B46>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b46-grade-${prob.n}.py`);
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
