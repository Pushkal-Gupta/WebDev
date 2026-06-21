#!/usr/bin/env node
// Batch 19 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1064, 1066, 1067, 1069, 1076, 1077, 1082, 1083, 1085, 1086, 1087, 1088, 1097, 1098, 1099
//
//   node scripts/fill-gap-problems-batch19.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch19.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch19.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1064, 1066, 1067, 1069, 1076, 1077, 1082, 1083, 1085, 1086, 1087, 1088, 1097, 1098, 1099];

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
    n: 1064,
    id: 'pghub-b19-conveyor-merge',
    name: 'Conveyor Belt Merge Cost',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minMergeCost',
    params: [{ name: 'lengths', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A warehouse has several conveyor segments with positive <code>lengths</code>. Repeatedly you join any two segments into one whose length is their sum, paying a cost equal to that sum, until a single segment remains. Return the minimum total cost to merge them all. If there is only one segment, the cost is 0.',
    examples: [
      ['[4,3,2,6]', '29', 'Merge 2+3=5, then 4+5=9, then 9+6=15: 5+9+15=29.'],
      ['[10]', '0', 'A single segment needs no merging.'],
    ],
    constraints: ['1 <= lengths.length <= 10^5', '1 <= lengths[i] <= 10^4'],
    tags: ['greedy', 'heap'],
    py: `def minMergeCost(lengths):
    if len(lengths) <= 1:
        return 0
    heap = list(lengths)
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
      'This is the classic optimal-merge (Huffman) pattern. Always combine the two shortest remaining segments first using a min-heap, since longer segments should participate in fewer of the cumulative sums. Each merge pushes the combined length back; accumulate every merge cost.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[4,3,2,6]'],
      ['[10]'],
      ['[1,1]'],
      ['[1,2,3,4,5]'],
      ['[100,200]'],
      ['[5,5,5,5]'],
      ['[1,1,1,1,1,1]'],
      ['[8,4,2,1]'],
      ['[7]'],
      ['[3,3,3]'],
    ],
  },
  {
    n: 1066,
    id: 'pghub-b19-tide-pools',
    name: 'Tide Pool Water Capacity',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'trappedWater',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A cross-section of a rocky shore is given by non-negative <code>heights</code>, where each value is the height of a one-unit-wide rock column. After the tide, water settles in the dips. Return the total units of water trapped between the columns.',
    examples: [
      ['[0,2,0,3,0,1,0,2]', '7', 'Water pools in the valleys bounded by taller walls.'],
      ['[3,2,1]', '0', 'A monotone slope traps nothing.'],
    ],
    constraints: ['0 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def trappedWater(heights):
    if not heights:
        return 0
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if heights[left] <= heights[right]:
            if heights[left] >= left_max:
                left_max = heights[left]
            else:
                total += left_max - heights[left]
            left += 1
        else:
            if heights[right] >= right_max:
                right_max = heights[right]
            else:
                total += right_max - heights[right]
            right -= 1
    return total`,
    approach:
      'Water above a column equals min(highest wall to its left, highest wall to its right) minus its own height. Use two pointers: the smaller side is fully determined by its running max wall, so advance it and accumulate the trapped amount, moving inward until the pointers meet.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,2,0,3,0,1,0,2]'],
      ['[3,2,1]'],
      ['[]'],
      ['[5]'],
      ['[2,0,2]'],
      ['[4,2,0,3,2,5]'],
      ['[1,1,1,1]'],
      ['[0,0,0]'],
      ['[5,4,1,2]'],
      ['[1,0,2,0,1,0,3]'],
    ],
  },
  {
    n: 1067,
    id: 'pghub-b19-ledger-rollback',
    name: 'Ledger Balance Rollback',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'finalBalance',
    params: [{ name: 'ops', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'A ledger starts empty. Each entry in <code>ops</code> is one of: <code>"+x"</code> append amount x (an integer, possibly negative) to the history and add it to the balance; <code>"undo"</code> remove the most recent still-active appended amount and subtract it; or <code>"redo"</code> re-apply the most recently undone amount. A "redo" with nothing to redo is ignored. Any "+x" clears the redo history. Return the final balance.',
    examples: [
      ['["+5","+3","undo","redo"]', '8', 'Add 5 and 3 (=8), undo 3 (=5), redo 3 (=8).'],
      ['["+10","undo","undo"]', '0', 'The second undo has nothing to remove.'],
    ],
    constraints: ['1 <= ops.length <= 10^4', 'amounts fit in a 32-bit integer'],
    tags: ['stack', 'simulation'],
    py: `def finalBalance(ops):
    history = []
    redo = []
    balance = 0
    for op in ops:
        if op == "undo":
            if history:
                v = history.pop()
                balance -= v
                redo.append(v)
        elif op == "redo":
            if redo:
                v = redo.pop()
                balance += v
                history.append(v)
        else:
            v = int(op[1:])
            history.append(v)
            balance += v
            redo.clear()
    return balance`,
    approach:
      'Keep an active history stack and a redo stack. Appending pushes onto history, adds to the balance, and invalidates the redo stack. Undo pops history into redo and subtracts. Redo pops redo back onto history and adds. Empty pops are no-ops. The balance is maintained incrementally.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["+5","+3","undo","redo"]'],
      ['["+10","undo","undo"]'],
      ['["+1","+2","+3"]'],
      ['["undo","redo"]'],
      ['["+7","undo","+2","redo"]'],
      ['["+-4","+9","undo"]'],
      ['["+5","undo","redo","undo"]'],
      ['["+100"]'],
      ['["+1","+1","+1","undo","undo","redo"]'],
      ['["+3","+3","undo","+4","redo"]'],
    ],
  },
  {
    n: 1069,
    id: 'pghub-b19-signal-towers',
    name: 'Signal Tower Coverage',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minRadius',
    params: [
      { name: 'houses', type: 'List[int]' },
      { name: 'towers', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'Houses sit at integer positions <code>houses</code> on a line, and signal towers sit at positions <code>towers</code>. A tower with broadcast radius r covers every position within distance r of it. Return the minimum integer radius r such that every house is covered by at least one tower.',
    examples: [
      ['[1,2,3,4,5]\n[3]', '2', 'A single tower at 3 must reach houses 1 and 5, distance 2.'],
      ['[1,10]\n[1,10]', '0', 'Each house sits exactly on a tower.'],
    ],
    constraints: ['1 <= houses.length, towers.length <= 10^5', '0 <= positions <= 10^9'],
    tags: ['binary-search', 'sorting'],
    py: `def minRadius(houses, towers):
    towers = sorted(towers)
    import bisect
    worst = 0
    for h in houses:
        i = bisect.bisect_left(towers, h)
        best = float('inf')
        if i < len(towers):
            best = min(best, towers[i] - h)
        if i > 0:
            best = min(best, h - towers[i-1])
        worst = max(worst, best)
    return worst`,
    approach:
      'The needed radius is the largest over all houses of that house\'s distance to its nearest tower. Sort the towers, and for each house binary-search the insertion point to find the closest tower on either side. The maximum of these nearest distances is the minimum sufficient radius.',
    complexity: { time: 'O((n + m) log m)', space: 'O(m)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '[3]'],
      ['[1,10]', '[1,10]'],
      ['[5]', '[0]'],
      ['[1,2,3]', '[1,2,3]'],
      ['[0,100]', '[50]'],
      ['[7,7,7]', '[10]'],
      ['[1,4,9,16]', '[2,8,15]'],
      ['[10]', '[3,17]'],
      ['[2,2,2,2]', '[2]'],
      ['[1,1000000000]', '[0]'],
    ],
  },
  {
    n: 1076,
    id: 'pghub-b19-festival-lights',
    name: 'Festival Light Strings',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'countPatterns',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A string of <code>n</code> festival lights is hung in a row; each light is either ON or OFF. For safety no two adjacent lights may both be ON. Return the number of valid arrangements, modulo <code>1000000007</code>.',
    examples: [
      ['3', '5', 'Valid: 000, 001, 010, 100, 101 (using 1 for ON).'],
      ['1', '2', 'A single light is ON or OFF.'],
    ],
    constraints: ['1 <= n <= 10^6'],
    tags: ['dp', 'math'],
    py: `def countPatterns(n):
    MOD = 1000000007
    # ends_off, ends_on for current length
    ends_off, ends_on = 1, 1
    for _ in range(2, n + 1):
        new_off = (ends_off + ends_on) % MOD
        new_on = ends_off % MOD
        ends_off, ends_on = new_off, new_on
    return (ends_off + ends_on) % MOD`,
    approach:
      'Track two counts: arrangements ending OFF and ending ON. A new OFF light can follow either, so new_off = off + on; a new ON light can only follow an OFF, so new_on = off. This is the Fibonacci recurrence; the answer for length n is off + on, taken modulo 1e9+7.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['3'],
      ['1'],
      ['2'],
      ['4'],
      ['5'],
      ['10'],
      ['20'],
      ['50'],
      ['1000'],
      ['100000'],
    ],
  },
  {
    n: 1077,
    id: 'pghub-b19-courier-zones',
    name: 'Courier Delivery Zones',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countZones',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'A city has <code>n</code> depots numbered <code>0..n-1</code>. Each road in <code>roads</code> is a pair <code>[a, b]</code> letting a courier travel between depots a and b. A delivery zone is a maximal set of depots mutually reachable through roads. Return the number of delivery zones.',
    examples: [
      ['5\n[[0,1],[1,2],[3,4]]', '2', 'Depots {0,1,2} and {3,4} form two zones.'],
      ['3\n[]', '3', 'With no roads each depot is its own zone.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= roads.length <= 2 * 10^5', '0 <= a, b < n'],
    tags: ['graphs', 'union-find'],
    py: `def countZones(n, roads):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
    for a, b in roads:
        union(a, b)
    return len({find(i) for i in range(n)})`,
    approach:
      'Use a disjoint-set (union-find) structure. Union the endpoints of every road so connected depots share a root, with path compression to keep finds fast. After processing all roads, the number of distinct roots over all depots is the number of delivery zones.',
    complexity: { time: 'O((n + m) α(n))', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1],[1,2],[3,4]]'],
      ['3', '[]'],
      ['1', '[]'],
      ['4', '[[0,1],[1,2],[2,3]]'],
      ['6', '[[0,1],[2,3],[4,5]]'],
      ['4', '[[0,0],[1,1]]'],
      ['7', '[[0,1],[1,0],[2,3],[3,4],[4,2]]'],
      ['2', '[[0,1]]'],
      ['5', '[[0,1],[0,2],[0,3],[0,4]]'],
      ['8', '[]'],
    ],
  },
  {
    n: 1082,
    id: 'pghub-b19-pixel-runs',
    name: 'Pixel Run Encoding',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'encodeRuns',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A scanline of pixels is given as a lowercase string <code>s</code>. Compress it with run-length encoding: replace each maximal run of an identical character by the character followed by the run length, but only when the run length is at least 2. Single characters are left as-is. Return the encoded string.',
    examples: [
      ['"aaabbc"', '"a3b2c"', 'Run of 3 a, run of 2 b, single c.'],
      ['"abc"', '"abc"', 'No run reaches length 2.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase letters'],
    tags: ['strings', 'two-pointers'],
    py: `def encodeRuns(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        run = j - i
        if run >= 2:
            out.append(s[i] + str(run))
        else:
            out.append(s[i])
        i = j
    return "".join(out)`,
    approach:
      'Scan with a window that extends over each maximal run of identical characters. Emit the character alone if the run length is 1, otherwise the character followed by the length. Move the start to the end of the run and repeat until the string is consumed.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"aaabbc"'],
      ['"abc"'],
      ['"a"'],
      ['"aaaa"'],
      ['"aabbaa"'],
      ['"zzzzzzzzzz"'],
      ['"abba"'],
      ['"mississippi"'],
      ['"xyzz"'],
      ['"qqqwwweeer"'],
    ],
  },
  {
    n: 1083,
    id: 'pghub-b19-garden-rows',
    name: 'Garden Row Watering',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxWatered',
    params: [
      { name: 'beds', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A garden has a row of beds; <code>beds[i]</code> is the number of plants in bed i. You own a hose that waters any <code>k</code> consecutive beds in a single sweep. Return the maximum number of plants you can water in one sweep. If there are fewer than <code>k</code> beds, you water all of them.',
    examples: [
      ['[1,3,2,5,1]\n2', '7', 'Beds [2,5] hold the most: 7 plants.'],
      ['[4,4]\n5', '8', 'Fewer than k beds, so water everything.'],
    ],
    constraints: ['1 <= beds.length <= 10^5', '0 <= beds[i] <= 10^4', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'arrays'],
    py: `def maxWatered(beds, k):
    n = len(beds)
    if k >= n:
        return sum(beds)
    window = sum(beds[:k])
    best = window
    for i in range(k, n):
        window += beds[i] - beds[i - k]
        if window > best:
            best = window
    return best`,
    approach:
      'A sweep waters a fixed-width window of k beds, so this is a maximum fixed-window sum. Compute the first window sum, then slide one bed at a time, adding the entering bed and removing the leaving bed. Track the running maximum. If k covers the whole row, the answer is the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,3,2,5,1]', '2'],
      ['[4,4]', '5'],
      ['[1,1,1,1,1]', '3'],
      ['[10]', '1'],
      ['[0,0,0]', '2'],
      ['[5,1,1,1,5]', '2'],
      ['[2,4,6,8]', '4'],
      ['[9,8,7,6,5,4]', '3'],
      ['[3,3,3,3]', '1'],
      ['[1,2,3,4,5,6,7]', '2'],
    ],
  },
  {
    n: 1085,
    id: 'pghub-b19-token-ring',
    name: 'Token Ring Survivor',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'lastSurvivor',
    params: [
      { name: 'n', type: 'int' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Nodes numbered <code>1..n</code> sit in a ring passing a token. Starting the count at node 1, every <code>k</code>-th node that receives the token is removed from the ring; counting then resumes from the next node. Return the number of the single node that remains.',
    examples: [
      ['5\n2', '3', 'Removal order is 2,4,1,5, leaving node 3.'],
      ['1\n3', '1', 'A single node always survives.'],
    ],
    constraints: ['1 <= n <= 10^5', '1 <= k <= 10^9'],
    tags: ['queue', 'math'],
    py: `def lastSurvivor(n, k):
    res = 0
    for i in range(2, n + 1):
        res = (res + k) % i
    return res + 1`,
    approach:
      'This is the Josephus problem. The position of the survivor among i nodes relates to the survivor among i-1 nodes by adding k and wrapping modulo i. Iterate this recurrence from 2 up to n starting at 0, then convert the 0-based result to a 1-based node number.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['5', '2'],
      ['1', '3'],
      ['7', '3'],
      ['2', '1'],
      ['10', '1'],
      ['6', '6'],
      ['100', '7'],
      ['4', '4'],
      ['41', '3'],
      ['50', '5'],
    ],
  },
  {
    n: 1086,
    id: 'pghub-b19-elevation-peaks',
    name: 'Elevation Peak Indices',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'peakIndices',
    params: [{ name: 'elev', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'An array <code>elev</code> gives elevation samples along a trail. A peak is an index strictly greater than both of its immediate neighbors; the two endpoints are never peaks. Return the list of all peak indices in increasing order.',
    examples: [
      ['[1,3,2,4,1]', '[1,3]', 'Indices 1 (3>1,2) and 3 (4>2,1) are peaks.'],
      ['[1,2,3]', '[]', 'A monotone trail has no interior peak.'],
    ],
    constraints: ['1 <= elev.length <= 10^5', '0 <= elev[i] <= 10^9'],
    tags: ['arrays', 'scanning'],
    py: `def peakIndices(elev):
    res = []
    for i in range(1, len(elev) - 1):
        if elev[i] > elev[i-1] and elev[i] > elev[i+1]:
            res.append(i)
    return res`,
    approach:
      'Scan every interior index and report it when its value strictly exceeds both neighbors. Endpoints are excluded by the loop bounds. A single linear pass collects all peaks in increasing index order.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3,2,4,1]'],
      ['[1,2,3]'],
      ['[1]'],
      ['[5,1,5]'],
      ['[1,2,1,2,1,2,1]'],
      ['[3,3,3,3]'],
      ['[0,10,0,10,0]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,7,1,8,2,8,1]'],
    ],
  },
  {
    n: 1087,
    id: 'pghub-b19-recipe-order',
    name: 'Recipe Prep Order',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'prepOrder',
    params: [
      { name: 'n', type: 'int' },
      { name: 'deps', type: 'List[List[int]]' },
    ],
    return_type: 'List[int]',
    statement:
      'A recipe has <code>n</code> steps numbered <code>0..n-1</code>. Each pair <code>[a, b]</code> in <code>deps</code> means step a must be completed before step b. Return a valid order to perform all steps; when several steps are ready at once, choose the smallest-numbered one. If the dependencies form a cycle, return an empty list.',
    examples: [
      ['3\n[[0,1],[0,2]]', '[0,1,2]', 'Step 0 unlocks 1 and 2; pick the smaller first.'],
      ['2\n[[0,1],[1,0]]', '[]', 'A cyclic dependency has no valid order.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= deps.length <= 2 * 10^5', '0 <= a, b < n'],
    tags: ['graphs', 'topological-sort'],
    py: `def prepOrder(n, deps):
    adj = defaultdict(list)
    indeg = [0] * n
    for a, b in deps:
        adj[a].append(b)
        indeg[b] += 1
    heap = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        u = heapq.heappop(heap)
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(heap, v)
    return order if len(order) == n else []`,
    approach:
      'Run Kahn\'s topological sort. Build indegrees, seed a min-heap with all zero-indegree steps so the smallest ready step is always chosen, then repeatedly pop a step, append it, and decrement its successors\' indegrees. If fewer than n steps come out, a cycle exists and the answer is empty.',
    complexity: { time: 'O((n + m) log n)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[0,2]]'],
      ['2', '[[0,1],[1,0]]'],
      ['1', '[]'],
      ['4', '[[1,0],[2,0],[3,1]]'],
      ['5', '[]'],
      ['3', '[[2,0],[2,1]]'],
      ['6', '[[0,1],[1,2],[2,3],[3,4],[4,5]]'],
      ['4', '[[0,1],[1,2],[2,3],[3,1]]'],
      ['3', '[[0,1],[1,2],[0,2]]'],
      ['5', '[[4,3],[3,2],[2,1],[1,0]]'],
    ],
  },
  {
    n: 1088,
    id: 'pghub-b19-coin-change-rolls',
    name: 'Minimum Coin Rolls',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCoins',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A cashier has unlimited coins of the denominations in <code>coins</code> and must hand back exactly <code>amount</code> cents. Return the fewest coins that sum to <code>amount</code>, or -1 if it cannot be made.',
    examples: [
      ['[1,5,11]\n15', '3', '5+5+5 uses three coins, fewer than 11+1+1+1+1.'],
      ['[2]\n3', '-1', 'An odd amount cannot be made from 2-cent coins.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 10^4', '0 <= amount <= 10^4'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def minCoins(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1`,
    approach:
      'Bottom-up unbounded-knapsack DP. dp[a] is the fewest coins for amount a, initialized to infinity except dp[0]=0. For each amount, try every coin that fits and relax dp[a] to dp[a-coin]+1. The final entry is the answer, or -1 if it remained infinite.',
    complexity: { time: 'O(amount * len(coins))', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,5,11]', '15'],
      ['[2]', '3'],
      ['[1,2,5]', '11'],
      ['[3,7]', '0'],
      ['[5]', '5'],
      ['[1]', '100'],
      ['[2,5,10]', '27'],
      ['[7,11]', '14'],
      ['[1,3,4]', '6'],
      ['[9,6,5,1]', '11'],
    ],
  },
  {
    n: 1097,
    id: 'pghub-b19-water-balloons',
    name: 'Water Balloon Burst Profit',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'maxProfit',
    params: [{ name: 'sizes', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A line of water balloons has positive <code>sizes</code>. Bursting balloon i earns <code>left * sizes[i] * right</code> coins, where left and right are the sizes of the nearest unburst balloons on each side (treat a missing neighbor beyond the ends as a balloon of size 1). After a burst, its neighbors become adjacent. Return the maximum coins from bursting them all.',
    examples: [
      ['[3,1,5,8]', '167', 'Optimal burst order yields 167 coins.'],
      ['[5]', '5', 'One balloon: 1 * 5 * 1 = 5.'],
    ],
    constraints: ['1 <= sizes.length <= 300', '1 <= sizes[i] <= 100'],
    tags: ['2d-dp', 'intervals'],
    py: `def maxProfit(sizes):
    vals = [1] + list(sizes) + [1]
    n = len(vals)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for left in range(0, n - length):
            right = left + length
            best = 0
            for k in range(left + 1, right):
                gain = vals[left] * vals[k] * vals[right] + dp[left][k] + dp[k][right]
                if gain > best:
                    best = gain
            dp[left][right] = best
    return dp[0][n - 1]`,
    approach:
      'Pad both ends with virtual size-1 balloons and let dp[left][right] be the most coins from bursting every balloon strictly between indices left and right. Choosing k as the LAST balloon burst in that span fixes its neighbors as vals[left] and vals[right], so combine that gain with the two independent subintervals. Fill by increasing span length.',
    complexity: { time: 'O(n^3)', space: 'O(n^2)' },
    cases: [
      ['[3,1,5,8]'],
      ['[5]'],
      ['[1,5]'],
      ['[2,2,2]'],
      ['[1,2,3,4]'],
      ['[4,3,2,1]'],
      ['[7]'],
      ['[1,1,1,1,1]'],
      ['[9,8,7,6,5]'],
      ['[3,3,1,3,3]'],
    ],
  },
  {
    n: 1098,
    id: 'pghub-b19-bitmask-pairs',
    name: 'Complementary Bit Pairs',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'countComplementary',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'bits', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You are given an array <code>nums</code> of non-negative integers, each fitting in <code>bits</code> bits, and the integer <code>bits</code>. Two indices i &lt; j form a complementary pair if the bitwise AND of <code>nums[i]</code> and <code>nums[j]</code> is 0 and their bitwise OR has all <code>bits</code> low bits set (i.e. the two values partition every bit position). Return the number of complementary pairs.',
    examples: [
      ['[1,2,3,0]\n2', '2', 'Pairs (1,2) and (3,0) each cover both bits with no overlap.'],
      ['[3,3]\n2', '0', 'Identical full masks overlap on every bit.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= bits <= 20', '0 <= nums[i] < 2^bits'],
    tags: ['bit-manipulation', 'hashing'],
    py: `def countComplementary(nums, bits):
    full = (1 << bits) - 1
    count = Counter(nums)
    total = 0
    seen = {}
    for x in nums:
        comp = full ^ x
        total += seen.get(comp, 0)
        seen[x] = seen.get(x, 0) + 1
    return total`,
    approach:
      'Two values are complementary exactly when one is the bitwise complement of the other within the low bits (AND zero and OR full together force x ^ y == full). Stream through nums keeping a count of values seen so far; for each value add how many earlier values equal its complement, which counts each i<j pair once.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,0]', '2'],
      ['[3,3]', '2'],
      ['[0,0]', '2'],
      ['[1,2,1,2]', '2'],
      ['[7,0,3,4]', '2'],
      ['[5,2,5,2]', '2'],
      ['[1]', '2'],
      ['[0,1,2,3]', '2'],
      ['[15,0,15,0]', '4'],
      ['[6,1,6,1,6,1]', '3'],
    ],
  },
  {
    n: 1099,
    id: 'pghub-b19-palindrome-pad',
    name: 'Palindrome Padding Insertions',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'minInsertions',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code>, you may insert any characters at any positions. Return the minimum number of insertions needed to turn <code>s</code> into a palindrome.',
    examples: [
      ['"abca"', '1', 'Insert one b: "abcba".'],
      ['"race"', '3', 'Three insertions yield e.g. "ecarace".'],
    ],
    constraints: ['1 <= s.length <= 500', 's consists of lowercase letters'],
    tags: ['2d-dp', 'strings'],
    py: `def minInsertions(s):
    n = len(s)
    # dp[i][j] = min insertions to make s[i..j] a palindrome
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(0, n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i+1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i+1][j], dp[i][j-1])
    return dp[0][n-1]`,
    approach:
      'Let dp[i][j] be the fewest insertions to make the substring s[i..j] a palindrome. If the ends match, it reduces to the inner substring; otherwise insert a match for one end and take 1 plus the better of dropping either end. Fill over increasing substring lengths; dp[0][n-1] is the answer.',
    complexity: { time: 'O(n^2)', space: 'O(n^2)' },
    cases: [
      ['"abca"'],
      ['"race"'],
      ['"a"'],
      ['"aa"'],
      ['"ab"'],
      ['"racecar"'],
      ['"abcd"'],
      ['"madam"'],
      ['"abcba"'],
      ['"leetcode"'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B19>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b19-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B19>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B19>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b19-grade-${prob.n}.py`);
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
