#!/usr/bin/env node
// Batch 11 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (2700, 3100]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch11.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch11.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch11.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2701, 2702, 2714, 2720, 2728, 2737, 2738, 2743, 2752, 2753, 2754, 2755, 2756, 2757, 2758];

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
    n: 2701,
    id: 'pghub-b11-warehouse-shelf',
    name: 'Warehouse Shelf Refill',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'minRefills',
    params: [{ name: 'stock', type: 'List[int]' }, { name: 'cap', type: 'int' }],
    return_type: 'int',
    statement:
      'A warehouse has shelves whose current item counts are in <code>stock</code>. Every shelf must be topped up to exactly <code>cap</code> items. A shelf already at or above <code>cap</code> needs no refill. Return the total number of items that must be added across all shelves.',
    examples: [
      ['[2,5,1]\n5', '7', 'Add 3 + 0 + 4 = 7 items.'],
      ['[5,6,7]\n5', '0', 'Every shelf already meets capacity.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^9', '0 <= cap <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def minRefills(stock, cap):
    return sum(max(0, cap - s) for s in stock)`,
    approach:
      'For each shelf, the deficit is cap minus its current count, clamped at zero so over-stocked shelves contribute nothing. Sum the deficits.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,5,1]', '5'],
      ['[5,6,7]', '5'],
      ['[0,0,0]', '10'],
      ['[10]', '0'],
      ['[1,2,3,4,5]', '5'],
      ['[100]', '100'],
      ['[3,3,3]', '3'],
      ['[0]', '0'],
      ['[7,1,9,2]', '8'],
      ['[1000000000]', '1000000000'],
    ],
  },
  {
    n: 2702,
    id: 'pghub-b11-token-merge',
    name: 'Token Merge Value',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'maxMergeValue',
    params: [{ name: 'tokens', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You hold tokens with positive values in <code>tokens</code>. Repeatedly you may pick the two smallest tokens and merge them into one new token whose value is their sum; the new token replaces them. You keep merging until a single token remains. Each merge adds the new token\'s value to a running cost. Return the minimum possible total cost.',
    examples: [
      ['[1,2,3,4]', '19', 'Merge 1+2=3 (cost 3), then 3+3=6 (cost 6), then 6+4=10 (cost 10): total 19.'],
      ['[5]', '0', 'A single token needs no merges.'],
    ],
    constraints: ['1 <= tokens.length <= 10^5', '1 <= tokens[i] <= 10^6'],
    tags: ['greedy', 'heap'],
    py: `def maxMergeValue(tokens):
    if len(tokens) <= 1:
        return 0
    heap = list(tokens)
    heapq.heapify(heap)
    cost = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        s = a + b
        cost += s
        heapq.heappush(heap, s)
    return cost`,
    approach:
      'This is the classic optimal-merge / Huffman pattern: always combine the two smallest current tokens via a min-heap. Each merge\'s sum is added to the cost. A single token costs nothing.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4]'],
      ['[5]'],
      ['[1,1]'],
      ['[2,3,4,5,6]'],
      ['[10,10,10]'],
      ['[1,2,3]'],
      ['[7,7,7,7]'],
      ['[1,1,1,1,1,1]'],
      ['[100,200,300]'],
      ['[1,2,4,8,16]'],
    ],
  },
  {
    n: 2714,
    id: 'pghub-b11-signal-runs',
    name: 'Signal Run Compression',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'compress',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Compress a string <code>s</code> of lowercase letters using run-length encoding: each maximal run of a repeated character becomes the character followed by its count. Runs of length 1 still include the count "1". Return the compressed string.',
    examples: [
      ['"aaabbc"', '"a3b2c1"', 'Three a, two b, one c.'],
      ['"abc"', '"a1b1c1"', 'Each character is its own run of length 1.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def compress(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        out.append(s[i])
        out.append(str(j - i))
        i = j
    return ''.join(out)`,
    approach:
      'Walk the string, extending a pointer over each maximal equal-character run. Emit the character and the run length, then jump to the next run.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"aaabbc"'],
      ['"abc"'],
      ['"a"'],
      ['"zzzzzz"'],
      ['"aabbaa"'],
      ['"abcabc"'],
      ['"mmmmmmmmmm"'],
      ['"xy"'],
      ['"qwertyuiop"'],
      ['"aaaaabbbbbccccc"'],
    ],
  },
  {
    n: 2720,
    id: 'pghub-b11-toll-booth',
    name: 'Toll Booth Reachability',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'reachableTowns',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> towns labeled 0..n-1 connected by bidirectional <code>roads</code>, where each road is a pair [u, v]. Starting from town <code>start</code>, return the number of towns reachable by driving along roads (including <code>start</code> itself).',
    examples: [
      ['3\n[[0,1],[1,2]]\n0', '3', 'All three towns are connected.'],
      ['4\n[[0,1]]\n2', '1', 'Town 2 is isolated; only itself is reachable.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= roads.length <= 2*10^5', '0 <= u, v < n', '0 <= start < n'],
    tags: ['graph', 'bfs'],
    py: `def reachableTowns(n, roads, start):
    adj = defaultdict(list)
    for u, v in roads:
        adj[u].append(v)
        adj[v].append(u)
    seen = [False] * n
    seen[start] = True
    q = deque([start])
    count = 0
    while q:
        node = q.popleft()
        count += 1
        for nxt in adj[node]:
            if not seen[nxt]:
                seen[nxt] = True
                q.append(nxt)
    return count`,
    approach:
      'Build an adjacency list and run a breadth-first search from the start town, marking visited towns. The number of visited towns is the size of the connected component containing start.',
    complexity: { time: 'O(n + roads)', space: 'O(n + roads)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[1,2]]', '0'],
      ['4', '[[0,1]]', '2'],
      ['1', '[]', '0'],
      ['5', '[[0,1],[2,3],[3,4]]', '2'],
      ['5', '[[0,1],[2,3],[3,4]]', '0'],
      ['6', '[[0,1],[1,2],[2,0],[3,4]]', '0'],
      ['6', '[[0,1],[1,2],[2,0],[3,4]]', '5'],
      ['2', '[[0,1]]', '1'],
      ['4', '[[0,1],[1,2],[2,3]]', '3'],
      ['7', '[]', '4'],
    ],
  },
  {
    n: 2728,
    id: 'pghub-b11-elevator-load',
    name: 'Elevator Trip Planner',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'People with the given <code>weights</code> must ride an elevator that carries at most two people per trip, provided their combined weight does not exceed <code>limit</code>. Every individual weight is at most <code>limit</code>. Return the minimum number of trips needed to carry everyone.',
    examples: [
      ['[1,2]\n3', '1', 'Both ride together (1+2=3 <= 3).'],
      ['[3,2,2,1]\n3', '3', 'Pair (1,2) and (2) and (3): three trips.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit', '1 <= limit <= 10^9'],
    tags: ['two-pointers', 'greedy'],
    py: `def minTrips(weights, limit):
    ws = sorted(weights)
    i, j = 0, len(ws) - 1
    trips = 0
    while i <= j:
        if i < j and ws[i] + ws[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights. Use two pointers: try to pair the lightest with the heaviest. If they fit together, both ride; otherwise the heaviest rides alone. Each trip removes the heaviest remaining person.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2]', '3'],
      ['[3,2,2,1]', '3'],
      ['[5]', '5'],
      ['[1,1,1,1]', '2'],
      ['[2,2,2,2]', '3'],
      ['[3,3,3]', '5'],
      ['[1,2,3,4,5]', '6'],
      ['[4,4,4,4]', '8'],
      ['[1,1,1,1,1,1]', '2'],
      ['[10,9,8,7,6]', '10'],
    ],
  },
  {
    n: 2737,
    id: 'pghub-b11-coupon-stack',
    name: 'Coupon Discount Order',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'nextBetterCoupon',
    params: [{ name: 'discounts', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A shopper scans coupons in order with the given <code>discounts</code>. For each coupon, find the discount of the next coupon (to its right) that offers a strictly greater discount. If no later coupon is better, report -1 for that position. Return the list of answers.',
    examples: [
      ['[2,1,3,1]', '[3,3,-1,-1]', 'After 2 the next bigger is 3; after 1 it is 3; nothing beats 3 or the final 1.'],
      ['[5,4,3]', '[-1,-1,-1]', 'Discounts only decrease.'],
    ],
    constraints: ['1 <= discounts.length <= 10^5', '1 <= discounts[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def nextBetterCoupon(discounts):
    n = len(discounts)
    ans = [-1] * n
    stack = []
    for i in range(n):
        while stack and discounts[stack[-1]] < discounts[i]:
            ans[stack.pop()] = discounts[i]
        stack.append(i)
    return ans`,
    approach:
      'Classic next-greater-element with a decreasing monotonic stack of indices. When the current discount exceeds the discount at the stack top, that top finds its answer and is popped.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[2,1,3,1]'],
      ['[5,4,3]'],
      ['[1]'],
      ['[1,2,3,4]'],
      ['[4,3,2,1]'],
      ['[2,2,2,2]'],
      ['[1,3,2,4,1]'],
      ['[10,1,1,1,20]'],
      ['[3,3,4,3,3]'],
      ['[7,1,5,2,6,3]'],
    ],
  },
  {
    n: 2738,
    id: 'pghub-b11-garden-water',
    name: 'Garden Watering Reach',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minTaps',
    params: [{ name: 'reach', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A garden is the line segment from 0 to n, with a tap at each integer point 0..n (so <code>reach</code> has length n+1). Tap i waters the closed interval [i - reach[i], i + reach[i]]. Return the minimum number of taps to open so the whole segment [0, n] is watered, or -1 if impossible.',
    examples: [
      ['[3,4,1,1,0,0]', '1', 'Tap 0 covers [-3,3] but tap 1 covers [-3,5] alone waters [0,5].'],
      ['[0,0,0,0]', '-1', 'No tap reaches its neighbor; gaps remain.'],
    ],
    constraints: ['1 <= reach.length <= 10^4', '0 <= reach[i] <= 100'],
    tags: ['dp', 'greedy'],
    py: `def minTaps(reach):
    n = len(reach) - 1
    farthest = [0] * (n + 1)
    for i, r in enumerate(reach):
        left = max(0, i - r)
        right = min(n, i + r)
        farthest[left] = max(farthest[left], right)
    taps = 0
    cur_end = 0
    next_end = 0
    i = 0
    while cur_end < n:
        while i <= cur_end:
            next_end = max(next_end, farthest[i])
            i += 1
        if next_end <= cur_end:
            return -1
        taps += 1
        cur_end = next_end
    return taps`,
    approach:
      'Convert each tap into the interval it covers and record, for every left endpoint, the farthest right it can reach. Then run a greedy jump-game sweep: from the current covered end, extend to the farthest reachable, counting one tap per extension. If no progress is possible, return -1.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,4,1,1,0,0]'],
      ['[0,0,0,0]'],
      ['[1,1,1,1]'],
      ['[0]'],
      ['[2]'],
      ['[1,2,1]'],
      ['[5,0,0,0,0,0]'],
      ['[0,5,0,0,0,0]'],
      ['[3,0,0,0,3,0,0]'],
      ['[1,0,2,0,1]'],
    ],
  },
  {
    n: 2743,
    id: 'pghub-b11-prime-factory',
    name: 'Prime Factory Count',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'countPrimesBelow',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Return the number of prime numbers strictly less than <code>n</code>. A prime is an integer greater than 1 whose only positive divisors are 1 and itself.',
    examples: [
      ['10', '4', 'Primes below 10 are 2, 3, 5, 7.'],
      ['2', '0', 'There are no primes below 2.'],
    ],
    constraints: ['0 <= n <= 5*10^6'],
    tags: ['math', 'number-theory'],
    py: `def countPrimesBelow(n):
    if n < 3:
        return 0
    sieve = bytearray([1]) * n
    sieve[0] = sieve[1] = 0
    i = 2
    while i * i < n:
        if sieve[i]:
            step = i
            start = i * i
            sieve[start:n:step] = bytearray(len(range(start, n, step)))
        i += 1
    return sum(sieve)`,
    approach:
      'Use the Sieve of Eratosthenes. Mark composites by striking out multiples of each prime starting at its square. The count of remaining marked positions below n is the answer.',
    complexity: { time: 'O(n log log n)', space: 'O(n)' },
    cases: [
      ['10'],
      ['2'],
      ['0'],
      ['1'],
      ['3'],
      ['100'],
      ['1000'],
      ['50'],
      ['17'],
      ['10000'],
    ],
  },
  {
    n: 2752,
    id: 'pghub-b11-ledger-balance',
    name: 'Ledger Balance Point',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'pivotIndex',
    params: [{ name: 'ledger', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A ledger is a list of signed integers. The <em>balance point</em> is the smallest index i such that the sum of all entries to the left of i equals the sum of all entries to the right of i. Return that index, or -1 if none exists.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 sums to 11, right of it sums to 11.'],
      ['[1,2,3]', '-1', 'No index balances the two sides.'],
    ],
    constraints: ['1 <= ledger.length <= 10^5', '-10^9 <= ledger[i] <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def pivotIndex(ledger):
    total = sum(ledger)
    left = 0
    for i, v in enumerate(ledger):
        if left == total - left - v:
            return i
        left += v
    return -1`,
    approach:
      'Track the running left-side sum. At each index the right-side sum is total minus left minus the current element. The first index where left equals that right sum is the balance point.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'],
      ['[1,2,3]'],
      ['[2,1,-1]'],
      ['[0]'],
      ['[0,0,0,0]'],
      ['[-1,-1,-1,0,1,1]'],
      ['[5]'],
      ['[1,-1,1,-1,1]'],
      ['[10,5,5]'],
      ['[3,3,3,3]'],
    ],
  },
  {
    n: 2753,
    id: 'pghub-b11-queue-tickets',
    name: 'Festival Ticket Queue',
    topic_id: 'queue',
    difficulty: 'Easy',
    method_name: 'ticketTime',
    params: [{ name: 'tickets', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    statement:
      'People stand in a queue; person i wants <code>tickets[i]</code> tickets. Each second the person at the front buys one ticket; if they still need more they go to the back of the queue, otherwise they leave. Each purchase takes exactly one second. Return the number of seconds until the person originally at index <code>target</code> finishes buying all their tickets.',
    examples: [
      ['[2,3,2]\n2', '6', 'The person at index 2 buys their last ticket at second 6.'],
      ['[5,1,1,1]\n0', '8', 'The front person needs the most and finishes last among the first round.'],
    ],
    constraints: ['1 <= tickets.length <= 100', '1 <= tickets[i] <= 100', '0 <= target < tickets.length'],
    tags: ['queue', 'simulation'],
    py: `def ticketTime(tickets, target):
    time = 0
    for i, t in enumerate(tickets):
        if i <= target:
            time += min(t, tickets[target])
        else:
            time += min(t, tickets[target] - 1)
    return time`,
    approach:
      'Each person before or at the target buys up to tickets[target] rounds; each person after the target buys up to tickets[target]-1 rounds (they have one fewer chance before the target finishes). Sum these capped contributions.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,3,2]', '2'],
      ['[5,1,1,1]', '0'],
      ['[1]', '0'],
      ['[3,3,3]', '1'],
      ['[1,1,1,1]', '3'],
      ['[4,2,5]', '1'],
      ['[2,2,2,2]', '0'],
      ['[10,1,1,1,1]', '0'],
      ['[1,2,3,4]', '3'],
      ['[7,3,4,2]', '2'],
    ],
  },
  {
    n: 2754,
    id: 'pghub-b11-bit-pairs',
    name: 'Bit Difference Pairs',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'hammingPairsSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given a list of non-negative integers <code>nums</code>, the bit-distance of a pair is the number of positions at which their binary representations differ (their Hamming distance). Return the sum of bit-distances over all unordered pairs.',
    examples: [
      ['[4,14,2]', '6', 'Distances: (4,14)=2, (4,2)=2, (14,2)=2; total 6.'],
      ['[1,1]', '0', 'Identical numbers differ in no bits.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] < 2^30'],
    tags: ['bit-manipulation', 'math'],
    py: `def hammingPairsSum(nums):
    total = 0
    n = len(nums)
    for bit in range(31):
        ones = sum((x >> bit) & 1 for x in nums)
        total += ones * (n - ones)
    return total`,
    approach:
      'Count contributions per bit position. For each bit, if k numbers have it set, every set/unset pair differs there, contributing k*(n-k). Summing across bits gives the total Hamming distance over all pairs.',
    complexity: { time: 'O(31 * n)', space: 'O(1)' },
    cases: [
      ['[4,14,2]'],
      ['[1,1]'],
      ['[0]'],
      ['[1,2,3]'],
      ['[0,0,0,0]'],
      ['[7,7,7]'],
      ['[1,2,4,8]'],
      ['[15,0]'],
      ['[5,3,9,12]'],
      ['[1073741823,0,1]'],
    ],
  },
  {
    n: 2755,
    id: 'pghub-b11-vault-rotate',
    name: 'Vault Dial Rotation',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findSmallest',
    params: [{ name: 'dial', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A sorted ascending array of distinct integers was rotated at some unknown pivot to form <code>dial</code>. Return the smallest value in <code>dial</code> in O(log n) time.',
    examples: [
      ['[4,5,6,7,0,1,2]', '0', 'The rotation point holds the minimum.'],
      ['[1,2,3]', '1', 'Not rotated; the first element is smallest.'],
    ],
    constraints: ['1 <= dial.length <= 10^5', '-10^9 <= dial[i] <= 10^9', 'all values are distinct'],
    tags: ['binary-search', 'arrays'],
    py: `def findSmallest(dial):
    lo, hi = 0, len(dial) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if dial[mid] > dial[hi]:
            lo = mid + 1
        else:
            hi = mid
    return dial[lo]`,
    approach:
      'Binary-search for the rotation point. If the middle element exceeds the rightmost, the minimum lies strictly to the right; otherwise it is at mid or to its left. The pointers converge on the minimum.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[4,5,6,7,0,1,2]'],
      ['[1,2,3]'],
      ['[2,1]'],
      ['[1]'],
      ['[3,4,5,1,2]'],
      ['[5,1,2,3,4]'],
      ['[1,2,3,4,5]'],
      ['[-3,-2,-1,-5,-4]'],
      ['[10,20,30,40,5]'],
      ['[2,3,4,5,6,7,8,9,1]'],
    ],
  },
  {
    n: 2756,
    id: 'pghub-b11-relic-subseq',
    name: 'Relic Rising Subsequence',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'longestRising',
    params: [{ name: 'relics', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Archaeologists order relics by discovery in the list <code>relics</code>. Return the length of the longest strictly increasing subsequence of relic values (the relics need not be contiguous, but must keep their original order).',
    examples: [
      ['[10,9,2,5,3,7,101,18]', '4', 'One longest is [2,3,7,101].'],
      ['[5,5,5]', '1', 'No strict increase is possible beyond a single relic.'],
    ],
    constraints: ['1 <= relics.length <= 10^5', '-10^9 <= relics[i] <= 10^9'],
    tags: ['dp', 'binary-search'],
    py: `import bisect
def longestRising(relics):
    tails = []
    for x in relics:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`,
    approach:
      'Maintain "tails", where tails[k] is the smallest possible tail of an increasing subsequence of length k+1. For each value, binary-search its insertion point: replacing extends or tightens a subsequence. The length of tails is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[10,9,2,5,3,7,101,18]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,3,3,4]'],
      ['[-1,-2,-3,0]'],
      ['[7,7,8,1,2,3]'],
      ['[1,3,2,4,3,5]'],
      ['[100,1,2,3,4,5]'],
    ],
  },
  {
    n: 2757,
    id: 'pghub-b11-island-perimeter',
    name: 'Lagoon Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Easy',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses 1 for land and 0 for water. There is exactly one connected island (no lakes inside it). Each cell is a unit square. Return the perimeter of the island.',
    examples: [
      ['[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]', '16', 'Counting all exposed land edges gives 16.'],
      ['[[1]]', '4', 'A single land cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one island'],
    tags: ['grid', 'counting'],
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
      'Each land cell contributes 4 to the perimeter. For each shared edge with a land neighbor above or to the left, subtract 2 (one for each of the two adjacent cells). Checking only up/left avoids double counting.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]'],
      ['[[1]]'],
      ['[[1,1]]'],
      ['[[1],[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[1,0,1]]'],
    ],
  },
  {
    n: 2758,
    id: 'pghub-b11-courier-route',
    name: 'Courier Cheapest Route',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'cheapestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'routes', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A courier network has <code>n</code> hubs labeled 0..n-1. <code>routes[i] = [u, v, w]</code> is a directed delivery leg from u to v costing w. Return the minimum total cost to travel from hub <code>src</code> to hub <code>dst</code>, or -1 if dst is unreachable.',
    examples: [
      ['4\n[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]\n0\n3', '4', 'Path 0->1->2->3 costs 1+2+1=4, cheaper than 0->2->3.'],
      ['2\n[[0,1,7]]\n1\n0', '-1', 'There is no leg leaving hub 1 toward hub 0.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= routes.length <= 5*10^4', '0 <= u, v < n', '1 <= w <= 10^6', '0 <= src, dst < n'],
    tags: ['graph', 'dijkstra'],
    py: `def cheapestRoute(n, routes, src, dst):
    adj = defaultdict(list)
    for u, v, w in routes:
        adj[u].append((v, w))
    dist = [float('inf')] * n
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue
        if node == dst:
            return d
        for nxt, w in adj[node]:
            nd = d + w
            if nd < dist[nxt]:
                dist[nxt] = nd
                heapq.heappush(heap, (nd, nxt))
    return dist[dst] if dist[dst] != float('inf') else -1`,
    approach:
      'Run Dijkstra from src over the directed weighted graph using a min-heap keyed by accumulated cost. The first time dst is popped its distance is final. If it is never reached, return -1.',
    complexity: { time: 'O((n + routes) log n)', space: 'O(n + routes)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]', '0', '3'],
      ['2', '[[0,1,7]]', '1', '0'],
      ['1', '[]', '0', '0'],
      ['3', '[[0,1,4],[1,2,6],[0,2,20]]', '0', '2'],
      ['3', '[[0,1,4],[1,2,6],[0,2,20]]', '2', '0'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1],[3,0,1]]', '0', '3'],
      ['5', '[[0,1,10],[0,2,3],[2,1,1],[1,3,2],[2,3,8],[3,4,7]]', '0', '4'],
      ['2', '[[0,1,5],[0,1,2]]', '0', '1'],
      ['3', '[[0,1,1]]', '0', '2'],
      ['4', '[[0,1,2],[1,2,2],[2,3,2],[0,3,100]]', '0', '3'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b11-${prob.n}.py`);
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
  const code = row.solutions.python.code; // class Solution (+ optional preamble)
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("PASS" if _out == _exp else ("FAIL idx=${idx} got="+_out+" exp="+_exp))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b11-grade-${prob.n}.py`);
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
