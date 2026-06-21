#!/usr/bin/env node
// Batch 22 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1225, 1228, 1229, 1230, 1231, 1236, 1241, 1242, 1243, 1244, 1245, 1246, 1256, 1257, 1258
//
//   node scripts/fill-gap-problems-batch22.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch22.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch22.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1225, 1228, 1229, 1230, 1231, 1236, 1241, 1242, 1243, 1244, 1245, 1246, 1256, 1257, 1258];

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
    n: 1225,
    id: 'pghub-b22-canteen-queue',
    name: 'Canteen Queue Wait',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'totalWait',
    params: [{ name: 'service', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A single canteen counter serves people one at a time. Person <code>i</code> needs <code>service[i]</code> minutes at the counter. People are served strictly in the given order. The wait of a person is the total service time of everyone served before them. Return the sum of all the waits.',
    examples: [
      ['[3,1,2]', '7', 'Waits are 0, 3, 4 which sum to 7.'],
      ['[5]', '0', 'A single person never waits.'],
    ],
    constraints: ['1 <= service.length <= 10^5', '1 <= service[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def totalWait(service):
    running = 0
    total = 0
    for t in service:
        total += running
        running += t
    return total`,
    approach:
      'Sweep the queue once tracking the cumulative service time consumed so far. Before serving each person, that cumulative value is exactly how long they waited, so add it to the answer, then add their own service time to the running total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,2]'],
      ['[5]'],
      ['[1,1,1,1]'],
      ['[10,20,30]'],
      ['[2,2]'],
      ['[7,3,4,1]'],
      ['[100,1,1]'],
      ['[1,2,3,4,5]'],
      ['[9,9,9,9,9]'],
      ['[4,1,1,1,1,1]'],
    ],
  },
  {
    n: 1228,
    id: 'pghub-b22-locker-toggle',
    name: 'Locker Toggle Survivors',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'openLockers',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'There are <code>n</code> lockers numbered <code>1..n</code>, all closed. Student <code>k</code> (for <code>k</code> from 1 to <code>n</code>) toggles every locker whose number is a multiple of <code>k</code> (open becomes closed and vice versa). Return how many lockers remain open after all <code>n</code> students have walked through.',
    examples: [
      ['10', '3', 'Lockers 1, 4 and 9 stay open.'],
      ['1', '1', 'The only locker is toggled once and stays open.'],
    ],
    constraints: ['1 <= n <= 10^9'],
    tags: ['math', 'number-theory'],
    py: `def openLockers(n):
    return int(math.isqrt(n))`,
    approach:
      'A locker is toggled once per divisor of its number, so it ends open only if it has an odd number of divisors. That happens exactly for perfect squares (the square root pairs with itself). The count of perfect squares in 1..n is floor(sqrt(n)).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['10'],
      ['1'],
      ['16'],
      ['25'],
      ['100'],
      ['2'],
      ['3'],
      ['99'],
      ['1000000'],
      ['50'],
    ],
  },
  {
    n: 1229,
    id: 'pghub-b22-thermostat-runs',
    name: 'Thermostat Stable Runs',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'longestStable',
    params: [
      { name: 'temps', type: 'List[int]' },
      { name: 'tol', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A thermostat logs hourly temperatures in <code>temps</code>. A run of consecutive readings is <em>stable</em> if the difference between its maximum and minimum reading is at most <code>tol</code>. Return the length of the longest stable run.',
    examples: [
      ['[1,3,2,8,9]\n2', '3', 'The run [1,3,2] spans a range of 2.'],
      ['[5,5,5]\n0', '3', 'Every reading is identical.'],
    ],
    constraints: ['1 <= temps.length <= 10^5', '0 <= temps[i] <= 10^6', '0 <= tol <= 10^6'],
    tags: ['arrays', 'sliding-window'],
    py: `def longestStable(temps, tol):
    max_dq = deque()
    min_dq = deque()
    left = 0
    best = 0
    for right, v in enumerate(temps):
        while max_dq and temps[max_dq[-1]] <= v:
            max_dq.pop()
        max_dq.append(right)
        while min_dq and temps[min_dq[-1]] >= v:
            min_dq.pop()
        min_dq.append(right)
        while temps[max_dq[0]] - temps[min_dq[0]] > tol:
            left += 1
            if max_dq[0] < left:
                max_dq.popleft()
            if min_dq[0] < left:
                min_dq.popleft()
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window over the readings while keeping monotonic deques of the window maximum and minimum. Whenever the spread exceeds the tolerance, advance the left edge and drop indices that fall out of the window. Track the largest valid window length seen.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,2,8,9]', '2'],
      ['[5,5,5]', '0'],
      ['[1]', '0'],
      ['[1,2,3,4,5]', '1'],
      ['[10,1,10,1]', '9'],
      ['[4,4,4,4]', '0'],
      ['[1,5,9,13]', '4'],
      ['[7,8,7,8,7]', '1'],
      ['[100,90,80,70]', '20'],
      ['[3,1,4,1,5,9,2,6]', '3'],
    ],
  },
  {
    n: 1230,
    id: 'pghub-b22-warehouse-rotate',
    name: 'Warehouse Aisle Rotation',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'rotateShelves',
    params: [
      { name: 'shelf', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A warehouse aisle is a circular shelf of items in <code>shelf</code>. Each night the whole shelf rotates right by <code>k</code> positions (the last item wraps to the front). Return the shelf order after the rotation. <code>k</code> may be larger than the shelf length.',
    examples: [
      ['[1,2,3,4,5]\n2', '[4,5,1,2,3]', 'The last two items wrap to the front.'],
      ['[7,8]\n3', '[8,7]', 'Rotating right by 3 on length 2 is the same as by 1.'],
    ],
    constraints: ['1 <= shelf.length <= 10^5', '0 <= k <= 10^9', '-10^6 <= shelf[i] <= 10^6'],
    tags: ['arrays', 'two-pointers'],
    py: `def rotateShelves(shelf, k):
    n = len(shelf)
    k %= n
    return shelf[n - k:] + shelf[:n - k]`,
    approach:
      'A right rotation by k is periodic with the shelf length, so reduce k modulo n first. The result is simply the last k items followed by the first n-k items, which array slicing produces directly.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[7,8]', '3'],
      ['[1]', '100'],
      ['[1,2,3]', '0'],
      ['[1,2,3]', '3'],
      ['[10,20,30,40]', '1'],
      ['[5,4,3,2,1]', '5'],
      ['[1,2,3,4,5,6]', '7'],
      ['[-1,-2,-3]', '2'],
      ['[9,8,7,6,5,4]', '13'],
    ],
  },
  {
    n: 1231,
    id: 'pghub-b22-coupon-stack',
    name: 'Coupon Stack Discount',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxDiscount',
    params: [
      { name: 'coupons', type: 'List[int]' },
      { name: 'budget', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You hold coupons each giving a discount of <code>coupons[i]</code> dollars, but redeeming coupon <code>i</code> costs <code>coupons[i]</code> loyalty points (the value equals the cost). You have <code>budget</code> loyalty points total. Choosing any subset of coupons whose total point cost does not exceed the budget, return the largest total discount achievable.',
    examples: [
      ['[3,5,8]\n10', '8', 'Pick the 8-coupon, or 3+5; both spend within budget for an 8 discount.'],
      ['[4,4,4]\n7', '4', 'Only one coupon fits in the budget.'],
    ],
    constraints: ['1 <= coupons.length <= 200', '1 <= coupons[i] <= 1000', '0 <= budget <= 10^5'],
    tags: ['dp', 'knapsack'],
    py: `def maxDiscount(coupons, budget):
    dp = [0] * (budget + 1)
    for c in coupons:
        for b in range(budget, c - 1, -1):
            cand = dp[b - c] + c
            if cand > dp[b]:
                dp[b] = cand
    return dp[budget]`,
    approach:
      'Because each coupon\'s discount equals its point cost, this is a 0/1 knapsack where weight equals value. Use a 1D DP indexed by points spent, iterating the budget downward per coupon so each is used at most once. dp[budget] is the best total discount.',
    complexity: { time: 'O(n * budget)', space: 'O(budget)' },
    multiParam: true,
    cases: [
      ['[3,5,8]', '10'],
      ['[4,4,4]', '7'],
      ['[1,2,3]', '0'],
      ['[10]', '5'],
      ['[10]', '10'],
      ['[2,3,5,7]', '10'],
      ['[1,1,1,1,1]', '3'],
      ['[6,7,8]', '13'],
      ['[5,5,5,5]', '20'],
      ['[9,8,4,2]', '11'],
    ],
  },
  {
    n: 1236,
    id: 'pghub-b22-festival-lanterns',
    name: 'Festival Lantern Pairs',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'countPairs',
    params: [
      { name: 'heights', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Lanterns hang at heights given in <code>heights</code>. Two lanterns form a balanced pair if the sum of their heights is at most <code>limit</code>. Return the number of unordered pairs of distinct lanterns (by index) that are balanced.',
    examples: [
      ['[1,2,3,4]\n5', '4', 'Pairs (1,2),(1,3),(1,4),(2,3) all sum to at most 5.'],
      ['[5,5]\n9', '0', 'Their sum of 10 exceeds the limit.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '1 <= heights[i] <= 10^6', '1 <= limit <= 2 * 10^6'],
    tags: ['two-pointers', 'sorting'],
    py: `def countPairs(heights, limit):
    arr = sorted(heights)
    i, j = 0, len(arr) - 1
    count = 0
    while i < j:
        if arr[i] + arr[j] <= limit:
            count += j - i
            i += 1
        else:
            j -= 1
    return count`,
    approach:
      'Sort the heights and use two pointers from both ends. If the lightest and heaviest remaining pair fits, then the lightest pairs with every lantern up to the heavy pointer, so add that count and advance the low pointer; otherwise drop the high pointer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '5'],
      ['[5,5]', '9'],
      ['[1,1,1,1]', '2'],
      ['[10,20,30]', '100'],
      ['[1]', '5'],
      ['[3,1,4,1,5]', '6'],
      ['[2,2,2,2]', '4'],
      ['[1,2,3,4,5,6]', '7'],
      ['[100,1,99,2]', '101'],
      ['[7,7,7,7,7]', '13'],
    ],
  },
  {
    n: 1241,
    id: 'pghub-b22-pipe-network',
    name: 'Pipe Network Components',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countNetworks',
    params: [
      { name: 'n', type: 'int' },
      { name: 'pipes', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'A plant has <code>n</code> tanks numbered <code>0..n-1</code>. Each pipe in <code>pipes</code> is <code>[a, b]</code> and connects tanks <code>a</code> and <code>b</code> bidirectionally. Two tanks share a network if water can flow between them through pipes. Return the number of separate networks.',
    examples: [
      ['5\n[[0,1],[1,2],[3,4]]', '2', 'Tanks {0,1,2} form one network and {3,4} another.'],
      ['3\n[]', '3', 'With no pipes each tank is its own network.'],
    ],
    constraints: ['1 <= n <= 2 * 10^4', '0 <= pipes.length <= 5 * 10^4', '0 <= a, b < n'],
    tags: ['graphs', 'union-find'],
    py: `def countNetworks(n, pipes):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    comps = n
    for a, b in pipes:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            comps -= 1
    return comps`,
    approach:
      'Use union-find starting with each tank as its own component. For every pipe, union the two endpoints; each successful union merges two components into one, reducing the count. The remaining component count is the number of networks.',
    complexity: { time: 'O((n + e) alpha(n))', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1],[1,2],[3,4]]'],
      ['3', '[]'],
      ['1', '[]'],
      ['4', '[[0,1],[1,2],[2,3]]'],
      ['6', '[[0,1],[2,3],[4,5]]'],
      ['4', '[[0,1],[0,1],[0,1]]'],
      ['7', '[[0,1],[1,2],[3,4],[5,6]]'],
      ['2', '[[0,1]]'],
      ['5', '[[0,0],[1,1]]'],
      ['8', '[[0,1],[2,3],[4,5],[6,7],[1,3]]'],
    ],
  },
  {
    n: 1242,
    id: 'pghub-b22-signal-decode',
    name: 'Signal Pulse Decode',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'decodeCount',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A signal is a string <code>s</code> of digits. Each pulse decodes to a letter where <code>"1"</code>-><code>A</code>, ..., <code>"26"</code>-><code>Z</code>. A pulse is one digit (1-9) or a two-digit group (10-26). Return the number of distinct ways to decode the whole signal, modulo <code>1000000007</code>. A signal that cannot be decoded yields 0.',
    examples: [
      ['"226"', '3', 'Decodings: 2 2 6, 22 6, 2 26.'],
      ['"06"', '0', 'A leading zero cannot start any pulse.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of digits 0-9'],
    tags: ['dp', 'strings'],
    py: `def decodeCount(s):
    MOD = 1000000007
    n = len(s)
    prev2 = 1
    prev1 = 1 if s[0] != '0' else 0
    if n == 1:
        return prev1
    for i in range(1, n):
        cur = 0
        if s[i] != '0':
            cur += prev1
        two = int(s[i-1:i+1])
        if 10 <= two <= 26:
            cur += prev2
        cur %= MOD
        prev2, prev1 = prev1, cur
    return prev1`,
    approach:
      'Classic linear DP: ways to decode the first i characters depends on whether the current digit forms a valid single pulse (1-9) and whether it joins the prior digit into a valid two-digit pulse (10-26). Roll two variables forward, taking the modulus at each step.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"226"'],
      ['"06"'],
      ['"12"'],
      ['"0"'],
      ['"10"'],
      ['"27"'],
      ['"1111"'],
      ['"100"'],
      ['"2626262626"'],
      ['"123456789"'],
    ],
  },
  {
    n: 1243,
    id: 'pghub-b22-tower-blocks',
    name: 'Stable Tower Blocks',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'visibleBlocks',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'You stack blocks left to right with heights given by <code>heights</code> and look at the stack from the right side. A block is visible from the right if no block to its right is at least as tall. Return the visible block heights in their original left-to-right order.',
    examples: [
      ['[3,7,8,4]', '[8,4]', 'From the right, 4 and 8 are visible; 3 and 7 are hidden by 8.'],
      ['[1,2,3]', '[3]', 'Only the rightmost, tallest block is visible.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '1 <= heights[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def visibleBlocks(heights):
    stack = []
    for h in reversed(heights):
        if not stack or h > stack[-1]:
            stack.append(h)
    return stack[::-1]`,
    approach:
      'Scan from the right keeping a monotonic stack of heights that are strictly increasing as we go leftward. A block is visible only if it is taller than every block already kept (those to its right). Reverse the collected stack to restore left-to-right order.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,7,8,4]'],
      ['[1,2,3]'],
      ['[5,4,3,2,1]'],
      ['[1]'],
      ['[2,2,2]'],
      ['[10,1,10,1,10]'],
      ['[4,3,2,5,1]'],
      ['[1,3,2,4,3,5]'],
      ['[9,8,7,6,10]'],
      ['[6,6,6,6,7]'],
    ],
  },
  {
    n: 1244,
    id: 'pghub-b22-garden-water',
    name: 'Garden Watering Reach',
    topic_id: 'greedy',
    difficulty: 'Hard',
    method_name: 'minTaps',
    params: [
      { name: 'length', type: 'int' },
      { name: 'reach', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A garden runs from position 0 to <code>length</code>. There is a tap at every integer position <code>0..length</code>; tap <code>i</code> when opened waters the closed interval <code>[i - reach[i], i + reach[i]]</code>. Return the minimum number of taps to open so the whole garden <code>[0, length]</code> is watered, or -1 if impossible.',
    examples: [
      ['5\n[3,4,1,1,0,0]', '1', 'The tap at position 1 reaches [-3,5], covering everything.'],
      ['3\n[0,0,0,0]', '-1', 'No tap reaches beyond its own position, leaving gaps.'],
    ],
    constraints: ['1 <= length <= 10^4', 'reach.length == length + 1', '0 <= reach[i] <= 100'],
    tags: ['greedy', 'intervals'],
    py: `def minTaps(length, reach):
    max_right = [0] * (length + 1)
    for i, r in enumerate(reach):
        lo = max(0, i - r)
        hi = min(length, i + r)
        if hi > max_right[lo]:
            max_right[lo] = hi
    taps = 0
    cur_end = 0
    farthest = 0
    i = 0
    while cur_end < length:
        while i <= cur_end:
            if max_right[i] > farthest:
                farthest = max_right[i]
            i += 1
        if farthest <= cur_end:
            return -1
        taps += 1
        cur_end = farthest
    return taps`,
    approach:
      'Convert each tap into the interval it covers, recording for every start position the farthest right edge reachable. Then run a greedy jump-game sweep: from the current covered end, extend to the farthest reachable edge among all starts within reach, count one tap per extension, and fail if no progress is possible.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[3,4,1,1,0,0]'],
      ['3', '[0,0,0,0]'],
      ['1', '[1,1]'],
      ['7', '[1,2,1,0,2,1,0,1]'],
      ['8', '[4,0,0,0,0,0,0,0,4]'],
      ['2', '[1,0,1]'],
      ['0', '[0]'],
      ['9', '[0,5,0,3,3,3,1,4,0,4]'],
      ['4', '[0,0,0,0,0]'],
      ['6', '[2,1,1,2,1,1,2]'],
    ],
  },
  {
    n: 1245,
    id: 'pghub-b22-binary-clock',
    name: 'Binary Clock Set Bits',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'litLeds',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'List[int]',
    statement:
      'A binary clock shows each minute index from <code>0</code> to <code>n</code> in binary on a row of LEDs. For each value from 0 to <code>n</code> inclusive, the number of lit LEDs equals its count of set bits. Return a list whose <code>i</code>-th entry is the number of set bits in <code>i</code>.',
    examples: [
      ['5', '[0,1,1,2,1,2]', 'Set-bit counts of 0..5.'],
      ['0', '[0]', 'Zero has no bits set.'],
    ],
    constraints: ['0 <= n <= 10^5'],
    tags: ['bit-manipulation', 'dp'],
    py: `def litLeds(n):
    res = [0] * (n + 1)
    for i in range(1, n + 1):
        res[i] = res[i >> 1] + (i & 1)
    return res`,
    approach:
      'Build the answer with a DP over the bit pattern: the set-bit count of i equals the count for i with its lowest bit removed (i >> 1) plus whether the lowest bit is set (i & 1). This fills the whole array in linear time.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['5'],
      ['0'],
      ['1'],
      ['2'],
      ['7'],
      ['8'],
      ['15'],
      ['16'],
      ['31'],
      ['100'],
    ],
  },
  {
    n: 1246,
    id: 'pghub-b22-museum-rooms',
    name: 'Museum Room Depths',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'maxDepth',
    params: [{ name: 'parent', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A museum\'s rooms form a tree. <code>parent[i]</code> is the room you enter to reach room <code>i</code>; the entrance room has parent <code>-1</code>. The depth of a room is the number of rooms on the path from the entrance to it (the entrance has depth 1). Return the maximum depth over all rooms.',
    examples: [
      ['[-1,0,0,1]', '3', 'Room 3 sits below 1 below the entrance 0.'],
      ['[-1]', '1', 'Only the entrance room exists.'],
    ],
    constraints: ['1 <= parent.length <= 10^5', 'exactly one entry equals -1', 'the structure forms a valid tree'],
    tags: ['trees', 'graphs'],
    py: `def maxDepth(parent):
    n = len(parent)
    children = defaultdict(list)
    root = 0
    for i, p in enumerate(parent):
        if p == -1:
            root = i
        else:
            children[p].append(i)
    best = 0
    stack = [(root, 1)]
    while stack:
        node, d = stack.pop()
        if d > best:
            best = d
        for c in children[node]:
            stack.append((c, d + 1))
    return best`,
    approach:
      'Build a children adjacency list from the parent array and find the entrance (parent -1). Do an iterative DFS carrying each room\'s depth, starting the entrance at depth 1. Track the deepest room reached.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[-1,0,0,1]'],
      ['[-1]'],
      ['[-1,0,1,2,3]'],
      ['[1,2,-1,2]'],
      ['[-1,0,0,0,0]'],
      ['[2,2,-1,2,3]'],
      ['[-1,0,1,1,2,2]'],
      ['[3,3,3,-1]'],
      ['[-1,0,1,0,3,4]'],
      ['[5,0,1,2,3,-1]'],
    ],
  },
  {
    n: 1256,
    id: 'pghub-b22-courier-routes',
    name: 'Courier Shortest Hops',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'shortestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A courier serves <code>n</code> hubs numbered <code>0..n-1</code>. Each road is <code>[u, v, w]</code>, a one-way road from <code>u</code> to <code>v</code> taking <code>w</code> minutes. Return the minimum total minutes to travel from <code>src</code> to <code>dst</code>, or -1 if <code>dst</code> is unreachable.',
    examples: [
      ['4\n[[0,1,4],[0,2,1],[2,1,1],[1,3,1]]\n0\n3', '3', 'Route 0->2->1->3 costs 1+1+1=3.'],
      ['2\n[]\n0\n1', '-1', 'There is no road to the destination.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 5 * 10^4', '0 <= u, v < n', '1 <= w <= 10^6'],
    tags: ['advanced-graphs', 'dijkstra'],
    py: `def shortestRoute(n, roads, src, dst):
    adj = defaultdict(list)
    for u, v, w in roads:
        adj[u].append((v, w))
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == dst:
            return d
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist[dst] if dist[dst] != INF else -1`,
    approach:
      'Run Dijkstra on the directed weighted graph from src. A min-heap keyed by accumulated distance always finalizes the closest unsettled hub; relax its outgoing roads. Return the distance once dst is popped, or -1 if it stays unreachable.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,4],[0,2,1],[2,1,1],[1,3,1]]', '0', '3'],
      ['2', '[]', '0', '1'],
      ['1', '[]', '0', '0'],
      ['3', '[[0,1,2],[1,2,3]]', '0', '2'],
      ['3', '[[0,1,5],[0,2,1],[2,1,1]]', '0', '1'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '3'],
      ['5', '[[0,1,10],[1,4,10],[0,2,1],[2,3,1],[3,4,1]]', '0', '4'],
      ['2', '[[1,0,5]]', '0', '1'],
      ['4', '[[0,1,2],[0,2,2],[1,3,2],[2,3,2]]', '0', '3'],
      ['6', '[[0,1,7],[1,2,6],[0,3,1],[3,4,1],[4,2,1]]', '0', '2'],
    ],
  },
  {
    n: 1257,
    id: 'pghub-b22-token-merge',
    name: 'Token Merge Minimum Cost',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'mergeCost',
    params: [{ name: 'tokens', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You have piles of tokens given in <code>tokens</code>. Repeatedly pick the two smallest piles and merge them into one pile whose size is their sum; the cost of a merge is that sum. Continue until a single pile remains. Return the minimum total merge cost.',
    examples: [
      ['[4,3,2,6]', '29', 'Merge 2+3=5, then 4+5=9, then 6+9=15; total 5+9+15=29.'],
      ['[10]', '0', 'A single pile needs no merges.'],
    ],
    constraints: ['1 <= tokens.length <= 10^4', '1 <= tokens[i] <= 10^4'],
    tags: ['heap', 'greedy'],
    py: `def mergeCost(tokens):
    if len(tokens) <= 1:
        return 0
    heap = list(tokens)
    heapq.heapify(heap)
    total = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        s = a + b
        total += s
        heapq.heappush(heap, s)
    return total`,
    approach:
      'This is the optimal-merge / Huffman pattern. Always combining the two smallest piles minimizes total cost because smaller piles then participate in more later merges. A min-heap yields the two smallest in log time; accumulate each merge sum.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[4,3,2,6]'],
      ['[10]'],
      ['[1,1]'],
      ['[1,2,3,4,5]'],
      ['[5,5,5,5]'],
      ['[1,1,1,1,1,1]'],
      ['[100,200,300]'],
      ['[2,2,2,2,2,2,2,2]'],
      ['[7,6,5,4,3,2,1]'],
      ['[9,1,9,1,9,1]'],
    ],
  },
  {
    n: 1258,
    id: 'pghub-b22-grid-treasure',
    name: 'Grid Treasure Collect',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'maxTreasure',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A treasure map is a grid where <code>grid[r][c]</code> is the gold at that cell (possibly negative for traps). Starting at the top-left and moving only right or down to the bottom-right, return the maximum total gold collected along a path (including both endpoints).',
    examples: [
      ['[[1,3,1],[1,5,1],[4,2,1]]', '12', 'Path 1->3->5->2->1 collects 12.'],
      ['[[5]]', '5', 'A single cell is both start and end.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '-1000 <= grid[r][c] <= 1000'],
    tags: ['2d-dp', 'dp'],
    py: `def maxTreasure(grid):
    rows, cols = len(grid), len(grid[0])
    NEG = float('-inf')
    dp = [NEG] * cols
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                dp[c] = grid[0][0]
            elif r == 0:
                dp[c] = dp[c-1] + grid[r][c]
            elif c == 0:
                dp[c] = dp[c] + grid[r][c]
            else:
                dp[c] = max(dp[c], dp[c-1]) + grid[r][c]
    return dp[cols-1]`,
    approach:
      'Standard grid DP where the best total to reach a cell is its gold plus the better of the cell above or to the left. Use a rolling one-row array updated left to right; the bottom-right entry is the answer. Handle the first row and column as base cases.',
    complexity: { time: 'O(rows * cols)', space: 'O(cols)' },
    cases: [
      ['[[1,3,1],[1,5,1],[4,2,1]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[1,-2],[ -3,4]]'],
      ['[[-1,-2,-3],[-4,-5,-6]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[10,10,2],[1,1,2],[1,1,10]]'],
      ['[[2,1,1],[1,1,1],[1,1,2]]'],
      ['[[5,-10,5],[5,-10,5],[5,5,5]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B22>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b22-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B22>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B22>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b22-grade-${prob.n}.py`);
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
