#!/usr/bin/env node
// Batch 24 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1350, 1355, 1364, 1369, 1384, 1398, 1412, 1421, 1426, 1427, 1428, 1429, 1430, 1435, 1440
//
//   node scripts/fill-gap-problems-batch24.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch24.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch24.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1350, 1355, 1364, 1369, 1384, 1398, 1412, 1421, 1426, 1427, 1428, 1429, 1430, 1435, 1440];

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
    n: 1350,
    id: 'pghub-b24-ticket-batches',
    name: 'Box Office Ticket Batches',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'fullBatches',
    params: [
      { name: 'tickets', type: 'List[int]' },
      { name: 'size', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A box office sells tickets in fixed batches of <code>size</code> seats. <code>tickets[i]</code> is the number of tickets requested at window <code>i</code>. A batch is fulfilled only when a window has at least <code>size</code> tickets to give out. Return the total number of complete batches handed out across all windows.',
    examples: [
      ['[7,3,10]\n3', '5', 'Windows fulfill 2 + 1 + 3 = 5 full batches of 3.'],
      ['[1,1]\n5', '0', 'Neither window reaches a full batch.'],
    ],
    constraints: ['1 <= tickets.length <= 10^5', '0 <= tickets[i] <= 10^9', '1 <= size <= 10^4'],
    tags: ['arrays', 'math'],
    py: `def fullBatches(tickets, size):
    total = 0
    for t in tickets:
        total += t // size
    return total`,
    approach:
      'Each window contributes floor(tickets[i] / size) complete batches independently of the others. Sum that integer division across every window in a single pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[7,3,10]', '3'],
      ['[1,1]', '5'],
      ['[0]', '1'],
      ['[100]', '10'],
      ['[5,5,5,5]', '5'],
      ['[9,9,9]', '3'],
      ['[1000000000]', '1'],
      ['[2,4,6,8]', '2'],
      ['[15,14,13]', '4'],
      ['[6,6,6,6,6,6]', '6'],
    ],
  },
  {
    n: 1355,
    id: 'pghub-b24-vowel-runs',
    name: 'Longest Vowel Run',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'longestVowelRun',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, a vowel run is a maximal block of consecutive characters that are all vowels (<code>a</code>, <code>e</code>, <code>i</code>, <code>o</code>, <code>u</code>). Return the length of the longest vowel run, or 0 if the string has no vowels.',
    examples: [
      ['"beautiful"', '3', 'The run "eau" has length 3.'],
      ['"rhythm"', '0', 'There are no vowels.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def longestVowelRun(s):
    vowels = set('aeiou')
    best = 0
    cur = 0
    for ch in s:
        if ch in vowels:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best`,
    approach:
      'Scan the string once, extending a running counter while the current character is a vowel and resetting it to zero otherwise. Track the maximum length the counter ever reaches.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"beautiful"'],
      ['"rhythm"'],
      ['"aeiou"'],
      ['"a"'],
      ['"queueing"'],
      ['"bcdfg"'],
      ['"aaeebb"'],
      ['"programming"'],
      ['"ooo"'],
      ['"xyzaeiooub"'],
    ],
  },
  {
    n: 1364,
    id: 'pghub-b24-elevator-load',
    name: 'Elevator Trip Planner',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People queue for an elevator with weights given in <code>weights</code>. The elevator carries at most two people per trip and their combined weight must not exceed <code>limit</code>. Every person fits alone. Return the minimum number of trips to move everyone.',
    examples: [
      ['[70,50,80,100]\n150', '3', 'Trips: (70,80) is over so pair lightest with heaviest: (100,50),(80),(70)... optimal is 3 trips.'],
      ['[60,60]\n100', '2', 'Together they exceed 100, so each rides alone.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit <= 10^6'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, limit):
    arr = sorted(weights)
    i, j = 0, len(arr) - 1
    trips = 0
    while i <= j:
        if i < j and arr[i] + arr[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights and use two pointers from the lightest and heaviest. Always send the heaviest person; if the lightest remaining person can ride with them, take both. Count one trip each iteration. This greedy pairing is optimal because the heaviest must travel and adding the lightest never wastes capacity.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[70,50,80,100]', '150'],
      ['[60,60]', '100'],
      ['[50]', '100'],
      ['[40,40,40,40]', '80'],
      ['[100,100,100]', '100'],
      ['[30,30,30,30,30]', '60'],
      ['[10,20,30,40,50]', '50'],
      ['[90,80,70,60,50,40]', '100'],
      ['[1,1,1,1,1,1,1]', '2'],
      ['[55,45,55,45]', '100'],
    ],
  },
  {
    n: 1369,
    id: 'pghub-b24-relay-baton',
    name: 'Relay Baton Reverse',
    topic_id: 'linkedlist',
    difficulty: 'Medium',
    method_name: 'reverseRelay',
    params: [{ name: 'order', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Runners pass a baton in the sequence given by <code>order</code>, modelled as a singly linked list where each runner points to the next. After the race the coach wants the baton path replayed backwards. Return the runner ids in reversed order. You must reverse the list by relinking nodes, not by reading the input array in reverse conceptually.',
    examples: [
      ['[3,1,4,1,5]', '[5,1,4,1,3]', 'The path is replayed from the last runner to the first.'],
      ['[9]', '[9]', 'A single runner reversed is itself.'],
    ],
    constraints: ['1 <= order.length <= 10^5', '-10^6 <= order[i] <= 10^6'],
    tags: ['linkedlist', 'recursion'],
    py: `class Node:
    __slots__ = ('val', 'next')
    def __init__(self, val):
        self.val = val
        self.next = None

def reverseRelay(order):
    head = None
    for v in reversed(order):
        node = Node(v)
        node.next = head
        head = node
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    out = []
    cur = prev
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out`,
    approach:
      'Build a singly linked list from the order, then reverse it in place with the classic three-pointer technique: walk the list flipping each next pointer to point at the previous node. Finally traverse from the new head to collect the reversed ids.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,1,4,1,5]'],
      ['[9]'],
      ['[1,2]'],
      ['[1,2,3,4,5,6]'],
      ['[-1,-2,-3]'],
      ['[0,0,0]'],
      ['[10,20,30,40]'],
      ['[7,7,8,8,9]'],
      ['[5,4,3,2,1]'],
      ['[100,-100,50,-50]'],
    ],
  },
  {
    n: 1384,
    id: 'pghub-b24-cipher-shift',
    name: 'Rolling Caesar Cipher',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'rollingShift',
    params: [
      { name: 's', type: 'str' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'A message <code>s</code> of lowercase letters is encoded with a rolling Caesar shift: the character at index <code>i</code> is shifted forward by <code>(k + i)</code> positions through the alphabet, wrapping from <code>z</code> back to <code>a</code>. Return the encoded string.',
    examples: [
      ['"abc"\n1', '"bdf"', 'a+1, b+2, c+3 give b, d, f.'],
      ['"z"\n1', '"a"', 'z shifted by 1 wraps to a.'],
    ],
    constraints: ['1 <= s.length <= 10^5', '0 <= k <= 10^9', 's consists of lowercase English letters'],
    tags: ['strings', 'math'],
    py: `def rollingShift(s, k):
    out = []
    for i, ch in enumerate(s):
        off = (ord(ch) - 97 + k + i) % 26
        out.append(chr(97 + off))
    return ''.join(out)`,
    approach:
      'For each character compute its zero-based alphabet position, add the base shift k plus the position index i, take the result modulo 26 to wrap, and map back to a letter. Build the output in a single pass.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"abc"', '1'],
      ['"z"', '1'],
      ['"hello"', '0'],
      ['"abcdef"', '25'],
      ['"zzzz"', '2'],
      ['"a"', '1000000000'],
      ['"xyz"', '3'],
      ['"programming"', '5'],
      ['"aaaaaa"', '1'],
      ['"qwerty"', '13'],
    ],
  },
  {
    n: 1398,
    id: 'pghub-b24-skyline-peaks',
    name: 'Skyline Visible Peaks',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'countVisible',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You walk along a row of buildings with heights in <code>heights</code> from left to right. A building is a visible peak if it is strictly taller than every building before it. Standing on a visible peak, you can also see the next building immediately to its right if that one is taller. Return the number of visible peaks (the strictly-increasing prefix maxima).',
    examples: [
      ['[3,1,4,1,5]', '3', 'Buildings 3, 4 and 5 each exceed all earlier buildings.'],
      ['[5,4,3]', '1', 'Only the first building is a peak.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '1 <= heights[i] <= 10^9'],
    tags: ['stack', 'arrays'],
    py: `def countVisible(heights):
    count = 0
    tallest = float('-inf')
    for h in heights:
        if h > tallest:
            count += 1
            tallest = h
    return count`,
    approach:
      'A building is visible exactly when it sets a new running maximum height as you scan left to right. Keep the tallest height seen so far; whenever the current building beats it, increment the count and update the maximum.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4,1,5]'],
      ['[5,4,3]'],
      ['[1,2,3,4,5]'],
      ['[7]'],
      ['[2,2,2,2]'],
      ['[1,3,2,5,4,7]'],
      ['[10,9,8,11,7,12]'],
      ['[100,1,1,1,1]'],
      ['[1,1,2,2,3,3]'],
      ['[4,5,4,6,4,7,4]'],
    ],
  },
  {
    n: 1412,
    id: 'pghub-b24-budget-split',
    name: 'Fair Budget Partition',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'canSplitFair',
    params: [{ name: 'costs', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'A team has project costs in <code>costs</code> to divide between two departments. Return <code>true</code> if the projects can be partitioned into two groups whose total costs are exactly equal, otherwise <code>false</code>.',
    examples: [
      ['[1,5,11,5]', 'true', '{1,5,5} and {11} both total 11.'],
      ['[1,2,5]', 'false', 'No partition gives equal halves.'],
    ],
    constraints: ['1 <= costs.length <= 200', '1 <= costs[i] <= 1000'],
    tags: ['dp', 'subset-sum'],
    py: `def canSplitFair(costs):
    total = sum(costs)
    if total % 2 != 0:
        return False
    target = total // 2
    reachable = 1  # bitset: bit i set means sum i is reachable
    for c in costs:
        reachable |= reachable << c
    return (reachable >> target) & 1 == 1`,
    approach:
      'This is the partition / subset-sum problem. The total must be even; the target is half of it. Track all reachable subset sums with an integer bitset where shifting by each cost folds that item in. Equal partition exists iff the target bit ends up set.',
    complexity: { time: 'O(n * sum / word)', space: 'O(sum)' },
    cases: [
      ['[1,5,11,5]'],
      ['[1,2,5]'],
      ['[2,2]'],
      ['[1]'],
      ['[3,3,3,3]'],
      ['[1,1,1,1,1,1]'],
      ['[10,20,30,40]'],
      ['[7,3,1,1]'],
      ['[100,100,50,50]'],
      ['[5,5,5,5,5]'],
    ],
  },
  {
    n: 1421,
    id: 'pghub-b24-orchard-rows',
    name: 'Orchard Harvest Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxHarvest',
    params: [
      { name: 'yields', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'An orchard has a single row of trees with fruit counts in <code>yields</code>. A harvester collects fruit from exactly <code>k</code> consecutive trees in one pass. Return the maximum total fruit obtainable from any window of <code>k</code> consecutive trees. If <code>k</code> exceeds the number of trees, return the sum of all trees.',
    examples: [
      ['[2,1,5,1,3,2]\n3', '9', 'The window [5,1,3] yields 9.'],
      ['[4,2]\n5', '6', 'k is larger than the row, so take everything.'],
    ],
    constraints: ['1 <= yields.length <= 10^5', '1 <= k <= 10^5', '0 <= yields[i] <= 10^4'],
    tags: ['sliding-window', 'arrays'],
    py: `def maxHarvest(yields, k):
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
      'Use a fixed-size sliding window. Seed it with the first k trees, then slide one tree at a time by adding the entering tree and subtracting the leaving one, tracking the best window sum. Handle the case where k covers the whole row separately.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,5,1,3,2]', '3'],
      ['[4,2]', '5'],
      ['[1,1,1,1]', '1'],
      ['[5]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[10,0,0,0,10]', '3'],
      ['[3,3,3,3,3]', '5'],
      ['[7,1,7,1,7,1]', '2'],
      ['[0,0,0,0]', '2'],
      ['[9,8,7,6,5,4,3]', '4'],
    ],
  },
  {
    n: 1426,
    id: 'pghub-b24-server-uptime',
    name: 'Server Uptime Median',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'runningMedians',
    params: [{ name: 'samples', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A monitor reads server uptime <code>samples</code> one at a time. After each reading you must report the median of all readings seen so far. When the count is even, report the lower of the two middle values. Return the list of reported medians in order.',
    examples: [
      ['[5,2,8,1]', '[5,2,5,2]', 'Medians after each prefix using the lower middle on ties.'],
      ['[3]', '[3]', 'A single sample is its own median.'],
    ],
    constraints: ['1 <= samples.length <= 10^5', '-10^6 <= samples[i] <= 10^6'],
    tags: ['heap', 'two-pointers'],
    py: `def runningMedians(samples):
    low = []   # max-heap via negatives, holds the smaller half
    high = []  # min-heap, holds the larger half
    out = []
    for x in samples:
        if not low or x <= -low[0]:
            heapq.heappush(low, -x)
        else:
            heapq.heappush(high, x)
        # rebalance so low has equal or one extra element
        if len(low) > len(high) + 1:
            heapq.heappush(high, -heapq.heappop(low))
        elif len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        out.append(-low[0])
    return out`,
    approach:
      'Maintain two heaps: a max-heap for the smaller half and a min-heap for the larger half, kept balanced so the smaller half never has more than one extra element. After inserting each sample and rebalancing, the lower median is always the top of the smaller-half heap.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[5,2,8,1]'],
      ['[3]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,2,2]'],
      ['[-1,-2,-3,-4]'],
      ['[10,1,9,2,8,3]'],
      ['[0,0,1,1]'],
      ['[7,7,7,1,1,1]'],
      ['[100,-100,50,-50,0]'],
    ],
  },
  {
    n: 1427,
    id: 'pghub-b24-paint-fence',
    name: 'Paint Fence Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'paintWays',
    params: [
      { name: 'posts', type: 'int' },
      { name: 'colors', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A fence has <code>posts</code> posts in a line and <code>colors</code> available paints. Each post is painted one color, and no three consecutive posts may share the same color (at most two in a row may match). Return the number of valid ways to paint the fence, modulo <code>1000000007</code>.',
    examples: [
      ['3\n2', '6', 'With 2 colors and 3 posts there are 6 valid paintings.'],
      ['1\n5', '5', 'A single post can take any of the 5 colors.'],
    ],
    constraints: ['1 <= posts <= 10^5', '1 <= colors <= 10^5'],
    tags: ['dp', 'math'],
    py: `def paintWays(posts, colors):
    MOD = 1000000007
    if posts == 1:
        return colors % MOD
    same = colors % MOD              # last two posts same color
    diff = (colors * (colors - 1)) % MOD  # last two posts differ
    for _ in range(3, posts + 1):
        new_same = diff
        new_diff = ((same + diff) * (colors - 1)) % MOD
        same, diff = new_same % MOD, new_diff
    return (same + diff) % MOD`,
    approach:
      'Track two states per position: the number of paintings whose last two posts share a color, and those whose last two differ. A new same-pair can only follow a differing pair; a new differing post can follow either state, in colors-1 ways. Roll these forward and sum at the end, all under the modulus.',
    complexity: { time: 'O(posts)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '2'],
      ['1', '5'],
      ['2', '3'],
      ['4', '2'],
      ['5', '3'],
      ['1', '1'],
      ['10', '1'],
      ['7', '4'],
      ['2', '1'],
      ['100', '100'],
    ],
  },
  {
    n: 1428,
    id: 'pghub-b24-warehouse-bins',
    name: 'Warehouse Bin Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minBinSize',
    params: [
      { name: 'items', type: 'List[int]' },
      { name: 'bins', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Items with sizes in <code>items</code> arrive in order and must be placed into <code>bins</code> bins. Each bin holds a contiguous block of items, every item goes into exactly one bin, and the order is preserved. Return the minimum possible capacity such that no bin\'s total size exceeds it.',
    examples: [
      ['[7,2,5,10,8]\n2', '18', 'Split as [7,2,5] and [10,8]; the larger sum 18 is minimized.'],
      ['[1,2,3,4,5]\n5', '5', 'Each item gets its own bin; capacity equals the largest item.'],
    ],
    constraints: ['1 <= items.length <= 10^5', '1 <= bins <= items.length', '1 <= items[i] <= 10^6'],
    tags: ['binary-search', 'greedy'],
    py: `def minBinSize(items, bins):
    def needed(cap):
        used = 1
        cur = 0
        for x in items:
            if cur + x > cap:
                used += 1
                cur = x
            else:
                cur += x
        return used
    lo = max(items)
    hi = sum(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= bins:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary search on the answer capacity. The smallest feasible capacity is at least the largest item and at most the total. For a candidate capacity, greedily pack items into bins counting how many are needed; if that fits within the bin budget the capacity is feasible. Shrink the search range until it converges.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[100,1,1,1,1]', '2'],
      ['[3,1,4,1,5,9,2,6]', '3'],
      ['[2,2,2,2,2,2]', '3'],
      ['[8,8,8,8]', '4'],
    ],
  },
  {
    n: 1429,
    id: 'pghub-b24-island-perimeter',
    name: 'Lake Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A lake map is a grid where <code>1</code> is land and <code>0</code> is water. The land cells form exactly one connected island (connected horizontally or vertically) with no internal lakes. Return the perimeter of the island.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped island has a perimeter of 12.'],
      ['[[1]]', '4', 'A single land cell has four exposed edges.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one island, no holes'],
    tags: ['graphs', 'grid'],
    py: `def islandPerimeter(grid):
    rows, cols = len(grid), len(grid[0])
    perim = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perim += 4
                if r > 0 and grid[r-1][c] == 1:
                    perim -= 2
                if c > 0 and grid[r][c-1] == 1:
                    perim -= 2
    return perim`,
    approach:
      'Every land cell starts with four edges. Each shared edge between two adjacent land cells removes two units of perimeter. Scan the grid once, adding four per land cell and subtracting two for each up-neighbor and left-neighbor that is also land (counting every shared edge exactly once).',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1]]'],
      ['[[1],[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1]]'],
      ['[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
    ],
  },
  {
    n: 1430,
    id: 'pghub-b24-maze-escape',
    name: 'Maze Escape Steps',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'escapeSteps',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A maze is a grid where <code>0</code> is an open cell and <code>1</code> is a wall. You start at the top-left cell and want to reach the bottom-right cell, moving up, down, left, or right between open cells. Return the minimum number of steps, or -1 if the exit is unreachable. The start or exit may themselves be walls, in which case return -1.',
    examples: [
      ['[[0,0,0],[1,1,0],[0,0,0]]', '4', 'A shortest path takes 4 steps to the exit.'],
      ['[[0,1],[1,0]]', '-1', 'Walls block every route to the exit.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', 'grid[i][j] is 0 or 1'],
    tags: ['advanced-graphs', 'bfs'],
    py: `def escapeSteps(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows-1][cols-1] == 1:
        return -1
    if rows == 1 and cols == 1:
        return 0
    seen = [[False] * cols for _ in range(rows)]
    seen[0][0] = True
    q = deque([(0, 0, 0)])
    while q:
        r, c, d = q.popleft()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and grid[nr][nc] == 0:
                if nr == rows - 1 and nc == cols - 1:
                    return d + 1
                seen[nr][nc] = True
                q.append((nr, nc, d + 1))
    return -1`,
    approach:
      'Breadth-first search from the start cell gives the shortest path on an unweighted grid. Expand cells in waves, marking visited cells and enqueuing open neighbors with one more step. Return the step count when the exit is dequeued first, or -1 if the queue empties without reaching it.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[0,0,0],[1,1,0],[0,0,0]]'],
      ['[[0,1],[1,0]]'],
      ['[[0]]'],
      ['[[1]]'],
      ['[[0,0],[0,0]]'],
      ['[[0,0,0,0],[1,1,1,0],[0,0,0,0],[0,1,1,1],[0,0,0,0]]'],
      ['[[0,1,0],[0,1,0],[0,0,0]]'],
      ['[[0,0,1],[1,0,1],[1,0,0]]'],
      ['[[1,0],[0,0]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
    ],
  },
  {
    n: 1435,
    id: 'pghub-b24-gift-codes',
    name: 'Gift Code Generator',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'giftCodes',
    params: [
      { name: 'letters', type: 'str' },
      { name: 'length', type: 'int' },
    ],
    return_type: 'List[str]',
    statement:
      'A promotion builds gift codes of exactly <code>length</code> characters using the distinct characters in <code>letters</code>. Each character may be reused any number of times. Return every possible code in lexicographic order (the input <code>letters</code> is given already sorted ascending).',
    examples: [
      ['"ab"\n2', '["aa","ab","ba","bb"]', 'All length-2 strings over {a,b}.'],
      ['"x"\n3', '["xxx"]', 'Only one character yields a single code.'],
    ],
    constraints: ['1 <= letters.length <= 6', '1 <= length <= 6', 'letters has distinct characters sorted ascending'],
    tags: ['backtracking', 'recursion'],
    py: `def giftCodes(letters, length):
    out = []
    cur = []
    def build(pos):
        if pos == length:
            out.append(''.join(cur))
            return
        for ch in letters:
            cur.append(ch)
            build(pos + 1)
            cur.pop()
    build(0)
    return out`,
    approach:
      'Backtrack position by position. At each position try every available character in order, recurse to fill the remaining positions, then undo the choice. Because letters are pre-sorted and explored in order, the generated codes come out lexicographically sorted.',
    complexity: { time: 'O(len(letters)^length * length)', space: 'O(length)' },
    multiParam: true,
    cases: [
      ['"ab"', '2'],
      ['"x"', '3'],
      ['"abc"', '1'],
      ['"ab"', '1'],
      ['"abc"', '2'],
      ['"a"', '1'],
      ['"xy"', '3'],
      ['"abcd"', '1'],
      ['"ab"', '3'],
      ['"pq"', '2'],
    ],
  },
  {
    n: 1440,
    id: 'pghub-b24-toll-roads',
    name: 'Toll Road Cheapest Path',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'cheapestWithStops',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
      { name: 'maxStops', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A road network has <code>n</code> cities numbered <code>0..n-1</code>. Each road is <code>[u, v, toll]</code>, a one-way road from <code>u</code> to <code>v</code> costing <code>toll</code>. Return the cheapest total toll to drive from <code>src</code> to <code>dst</code> using at most <code>maxStops</code> intermediate cities, or -1 if no such route exists.',
    examples: [
      ['4\n[[0,1,100],[1,2,100],[0,2,500],[2,3,100]]\n0\n3\n1', '600', 'Route 0->2->3 uses one stop for cost 600; the cheaper 0->1->2->3 needs two stops.'],
      ['2\n[]\n0\n1\n0', '-1', 'There are no roads to the destination.'],
    ],
    constraints: ['1 <= n <= 100', '0 <= roads.length <= n * (n - 1)', '0 <= toll <= 10^4', '0 <= maxStops < n'],
    tags: ['advanced-graphs', 'dp'],
    py: `def cheapestWithStops(n, roads, src, dst, maxStops):
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    for _ in range(maxStops + 1):
        nxt = dist[:]
        for u, v, w in roads:
            if dist[u] != INF and dist[u] + w < nxt[v]:
                nxt[v] = dist[u] + w
        dist = nxt
    return dist[dst] if dist[dst] != INF else -1`,
    approach:
      'This is a hop-bounded shortest path, solved with a Bellman-Ford style relaxation. Allowing at most maxStops intermediate cities means at most maxStops+1 edges, so run that many relaxation rounds. Each round relaxes every road from the previous round\'s distances (copied so a single round cannot chain extra edges).',
    complexity: { time: 'O(maxStops * E)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,100],[1,2,100],[0,2,500],[2,3,100]]', '0', '3', '1'],
      ['2', '[]', '0', '1', '0'],
      ['3', '[[0,1,100],[1,2,100],[0,2,500]]', '0', '2', '0'],
      ['3', '[[0,1,100],[1,2,100],[0,2,500]]', '0', '2', '1'],
      ['1', '[]', '0', '0', '0'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '3', '2'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '3', '1'],
      ['5', '[[0,1,5],[1,2,5],[2,3,5],[3,4,5],[0,4,100]]', '0', '4', '2'],
      ['5', '[[0,1,5],[1,2,5],[2,3,5],[3,4,5],[0,4,100]]', '0', '4', '4'],
      ['3', '[[0,1,10],[0,2,3],[2,1,2]]', '0', '1', '1'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B24>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b24-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B24>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B24>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b24-grade-${prob.n}.py`);
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
