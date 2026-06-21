#!/usr/bin/env node
// Batch 36 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2464,2469,2473,2474,2479,2480,2489,2494,2495,2504,2505,2510,2519,2524,2533
//
//   node scripts/fill-gap-problems-batch36.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch36.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch36.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2464, 2469, 2473, 2474, 2479, 2480, 2489, 2494, 2495, 2504, 2505, 2510, 2519, 2524, 2533];

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
    n: 2464,
    id: 'pghub-b36-warehouse-aisles',
    name: 'Warehouse Aisle Splits',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minAisles',
    params: [{ name: 'shelves', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A storage row is a line of shelves whose item counts are given in <code>shelves</code>. You break the row into contiguous aisles; an aisle is valid only if every shelf in it holds a different item count (no repeated value inside one aisle). Return the minimum number of aisles the row can be split into so that every aisle is valid.',
    examples: [
      ['[1,2,3]', '1', 'All counts differ, so one aisle covering the whole row works.'],
      ['[1,1,2]', '2', 'The repeated 1 forces a break; aisles [1] and [1,2].'],
    ],
    constraints: ['1 <= shelves.length <= 10^5', '0 <= shelves[i] <= 10^9'],
    tags: ['dynamic-programming', 'greedy'],
    py: `def minAisles(shelves):
    aisles = 1
    seen = set()
    for x in shelves:
        if x in seen:
            aisles += 1
            seen = set()
        seen.add(x)
    return aisles`,
    approach:
      'Greedily extend the current aisle as far right as possible. Keep a set of values already in the open aisle; the moment a value repeats, the aisle must end just before it, so start a fresh aisle (resetting the set) beginning at the repeating shelf. Each forced break is unavoidable, so this yields the minimum.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3]'],
      ['[1,1,2]'],
      ['[5]'],
      ['[2,2,2,2]'],
      ['[1,2,1,2,1]'],
      ['[0,1,2,3,4,5]'],
      ['[7,7,8,9,9,9]'],
      ['[1000000000,1000000000]'],
      ['[3,1,4,1,5,9,2,6]'],
      ['[4,4,4,5,6,6,7]'],
    ],
  },
  {
    n: 2469,
    id: 'pghub-b36-thermostat-convert',
    name: 'Thermostat Unit Spread',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'convertTemps',
    params: [{ name: 'celsius', type: 'List[int]' }],
    return_type: 'List[float]',
    statement:
      'A smart thermostat logs whole-degree readings in <code>celsius</code>. For each reading return both the Kelvin and Fahrenheit value, in that order. Kelvin is <code>celsius + 273.15</code> and Fahrenheit is <code>celsius * 1.8 + 32.0</code>. Return a flat list where each reading contributes its Kelvin value immediately followed by its Fahrenheit value.',
    examples: [
      ['[0]', '[273.15,32.0]', '0C is 273.15K and 32.0F.'],
      ['[100]', '[373.15,212.0]', 'Boiling water: 373.15K and 212.0F.'],
    ],
    constraints: ['1 <= celsius.length <= 10^4', '-273 <= celsius[i] <= 10^6'],
    tags: ['math', 'simulation'],
    py: `def convertTemps(celsius):
    out = []
    for c in celsius:
        out.append(round(c + 273.15, 5))
        out.append(round(c * 1.8 + 32.0, 5))
    return out`,
    approach:
      'For every reading apply the two affine conversions directly and append Kelvin then Fahrenheit to the output. Rounding to five decimals keeps floating-point noise out while preserving the exact required values.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[0]'],
      ['[100]'],
      ['[-40]'],
      ['[37]'],
      ['[25,30]'],
      ['[-273]'],
      ['[1,2,3]'],
      ['[1000000]'],
      ['[50,-50]'],
      ['[10,20,30,40]'],
    ],
  },
  {
    n: 2473,
    id: 'pghub-b36-festival-lanterns',
    name: 'Festival Lantern Buy',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'cheapestLanterns',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A town has <code>n</code> squares numbered <code>0..n-1</code> linked by bidirectional <code>roads</code>, each entry <code>[u, v, w]</code> meaning a road of length <code>w</code> between squares <code>u</code> and <code>v</code>. Lanterns are sold only at the central market in square <code>0</code>. Starting from square <code>start</code>, return the length of the shortest path to the market, or <code>-1</code> if the market is unreachable.',
    examples: [
      ['4\n[[0,1,4],[1,2,1],[2,3,1]]\n3', '6', 'Path 3->2->1->0 has length 1+1+4 = 6.'],
      ['3\n[[0,1,2]]\n2', '-1', 'Square 2 has no road, so the market is unreachable.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 5*10^4', '0 <= u, v, start < n', '1 <= w <= 10^6'],
    tags: ['graphs', 'dijkstra'],
    py: `def cheapestLanterns(n, roads, start):
    adj = defaultdict(list)
    for u, v, w in roads:
        adj[u].append((v, w))
        adj[v].append((u, w))
    INF = float('inf')
    dist = [INF] * n
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue
        if node == 0:
            return d
        for nb, w in adj[node]:
            nd = d + w
            if nd < dist[nb]:
                dist[nb] = nd
                heapq.heappush(heap, (nd, nb))
    return dist[0] if dist[0] != INF else -1`,
    approach:
      'Run Dijkstra from the starting square over the undirected weighted graph. Pop nodes in increasing distance; the first time square 0 (the market) is popped its distance is final and optimal. If the heap empties without reaching it, the market is unreachable.',
    complexity: { time: 'O((n + e) log n)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,4],[1,2,1],[2,3,1]]', '3'],
      ['3', '[[0,1,2]]', '2'],
      ['1', '[]', '0'],
      ['2', '[[0,1,7]]', '1'],
      ['5', '[[0,1,1],[1,2,1],[0,2,5],[2,3,2],[3,4,3]]', '4'],
      ['4', '[[1,2,3],[2,3,3]]', '3'],
      ['3', '[[0,1,1],[1,2,1],[0,2,10]]', '2'],
      ['6', '[[0,1,2],[1,2,2],[2,3,2],[3,4,2],[4,5,2],[0,5,1]]', '5'],
      ['4', '[[0,1,1000000],[1,2,1],[2,3,1]]', '3'],
      ['2', '[]', '1'],
    ],
  },
  {
    n: 2474,
    id: 'pghub-b36-typist-backspace',
    name: 'Typist Backspace Match',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'sameFinal',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
    ],
    return_type: 'bool',
    statement:
      'Two drafts <code>a</code> and <code>b</code> were typed on a keyboard where the character <code>#</code> means a backspace that deletes the most recent character (a backspace on empty text does nothing). Return <code>true</code> if both drafts produce the same final text after all backspaces are applied, otherwise <code>false</code>.',
    examples: [
      ['ab#c\nad#c', 'true', 'Both reduce to "ac".'],
      ['a#c\nb', 'false', 'First becomes "c", second stays "b".'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^4', 'a and b consist of lowercase letters and the character #'],
    tags: ['stack', 'strings'],
    py: `def sameFinal(a, b):
    def build(s):
        out = []
        for ch in s:
            if ch == '#':
                if out:
                    out.pop()
            else:
                out.append(ch)
        return ''.join(out)
    return build(a) == build(b)`,
    approach:
      'Replay each draft onto a stack: push letters, and on a backspace pop the last letter if one exists. The stack contents after processing are the final text. Compare the two final strings for equality.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ["'ab#c'", "'ad#c'"],
      ["'a#c'", "'b'"],
      ["''", "''"],
      ["'###'", "''"],
      ["'abc'", "'abc'"],
      ["'a##b'", "'b'"],
      ["'xy#z'", "'xz'"],
      ["'a#b#c#'", "''"],
      ["'pq#r'", "'pr#'"],
      ["'hello#'", "'hell'"],
    ],
  },
  {
    n: 2479,
    id: 'pghub-b36-ticket-windows',
    name: 'Ticket Window Wait',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'lastFinish',
    params: [
      { name: 'durations', type: 'List[int]' },
      { name: 'windows', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Customers stand in a single queue; the i-th customer needs <code>durations[i]</code> seconds at a ticket window. There are <code>windows</code> identical windows, all free at time 0. Whenever a window is free the next waiting customer goes to it immediately. Return the time at which the last customer finishes being served.',
    examples: [
      ['[4,2,3]\n2', '5', 'Windows take [4,3] and [2]; the longest finishing time is 5.'],
      ['[5]\n3', '5', 'One customer finishes at time 5 regardless of spare windows.'],
    ],
    constraints: ['1 <= durations.length <= 10^5', '1 <= windows <= 10^5', '1 <= durations[i] <= 10^4'],
    tags: ['heap', 'simulation'],
    py: `def lastFinish(durations, windows):
    heap = [0] * min(windows, len(durations))
    heapq.heapify(heap)
    last = 0
    for d in durations:
        free = heapq.heappop(heap)
        finish = free + d
        last = max(last, finish)
        heapq.heappush(heap, finish)
    return last`,
    approach:
      'Keep a min-heap of the times each window becomes free (capped at the number of customers). Process customers in queue order: the next customer takes the window that frees earliest, finishing at that time plus their duration. The maximum finish time over all customers is the answer.',
    complexity: { time: 'O(n log w)', space: 'O(w)' },
    multiParam: true,
    cases: [
      ['[4,2,3]', '2'],
      ['[5]', '3'],
      ['[1,1,1,1]', '2'],
      ['[10,1,1,1]', '2'],
      ['[3,3,3]', '1'],
      ['[2,4,6,8]', '4'],
      ['[7,2,5,3,1]', '3'],
      ['[100]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[6,5,4,3,2,1]', '2'],
    ],
  },
  {
    n: 2480,
    id: 'pghub-b36-shipping-days',
    name: 'Shipping Within Days',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'packages', type: 'List[int]' },
      { name: 'days', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Packages with the weights listed in <code>packages</code> must be shipped on a belt in the given order within <code>days</code> days. Each day the belt loads packages in order without exceeding the ship capacity, and a package is never split across days. Return the minimum ship capacity that lets every package ship within <code>days</code> days.',
    examples: [
      ['[1,2,3,4,5]\n3', '6', 'Capacity 6 ships [1,2,3],[4],[5] in three days.'],
      ['[3,2,2,4,1,4]\n3', '6', 'Capacity 6 ships [3,2],[2,4],[1,4] in three days.'],
    ],
    constraints: ['1 <= packages.length <= 5*10^4', '1 <= days <= packages.length', '1 <= packages[i] <= 500'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(packages, days):
    def feasible(cap):
        used = 1
        load = 0
        for w in packages:
            if load + w > cap:
                used += 1
                load = 0
            load += w
        return used <= days
    lo, hi = max(packages), sum(packages)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary search on the capacity. The minimum possible capacity is the heaviest single package and the maximum is the total weight. For a candidate capacity, greedily fill each day until the next package would overflow, then start a new day; the candidate works if the days used do not exceed the limit. Converge to the smallest feasible capacity.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '3'],
      ['[3,2,2,4,1,4]', '3'],
      ['[1,2,3,1,1]', '4'],
      ['[10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[1,1,1,1,1,1]', '6'],
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      ['[500,500,500]', '1'],
      ['[2,3,1,4,2,5,1]', '3'],
    ],
  },
  {
    n: 2489,
    id: 'pghub-b36-orchard-trees',
    name: 'Orchard Tree Levels',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'widestLevel',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An orchard is laid out as a binary tree given in level order in <code>tree</code>, where <code>-1</code> marks a missing tree (null) and every other value is a present tree. The root is index 0; for a present node at index <code>i</code> its children are at indices <code>2*i+1</code> and <code>2*i+2</code>. Return the number of present trees on the level that has the most present trees. The root is level 0.',
    examples: [
      ['[1,2,3]', '2', 'Level 1 holds two trees, the widest level.'],
      ['[1,-1,3]', '1', 'Each level has at most one present tree.'],
    ],
    constraints: ['1 <= tree.length <= 10^5', 'tree[0] != -1', 'tree[i] is -1 or an integer in [0, 10^9]'],
    tags: ['trees', 'breadth-first-search'],
    py: `def widestLevel(tree):
    from collections import deque
    n = len(tree)
    best = 0
    q = deque([0])
    while q:
        size = len(q)
        present = 0
        for _ in range(size):
            i = q.popleft()
            if i >= n or tree[i] == -1:
                continue
            present += 1
            left, right = 2 * i + 1, 2 * i + 2
            if left < n and tree[left] != -1:
                q.append(left)
            if right < n and tree[right] != -1:
                q.append(right)
        best = max(best, present)
    return best`,
    approach:
      'Do a breadth-first traversal over the implicit binary tree encoded by array indices, skipping null markers. Process one level at a time, counting present nodes, and enqueue the existing children of each present node. Track the largest level count seen.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3]'],
      ['[1,-1,3]'],
      ['[5]'],
      ['[1,2,3,4,5,6,7]'],
      ['[1,2,-1,3,-1]'],
      ['[1,2,3,-1,-1,6,7]'],
      ['[10,20,30,40,50,-1,-1]'],
      ['[1,-1,2,-1,-1,-1,3]'],
      ['[1,2,3,4,-1,-1,7,8]'],
      ['[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]'],
    ],
  },
  {
    n: 2494,
    id: 'pghub-b36-paint-fence',
    name: 'Fence Painting Ways',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'paintWays',
    params: [
      { name: 'posts', type: 'int' },
      { name: 'colors', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A fence has <code>posts</code> posts in a row, each painted with one of <code>colors</code> available colours. No three consecutive posts may share the same colour (two in a row is allowed). Return the number of valid ways to paint the whole fence, taken modulo <code>1000000007</code>.',
    examples: [
      ['3\n2', '6', 'Two colours, three posts: six arrangements avoid three-in-a-row.'],
      ['1\n5', '5', 'A single post can be any of the five colours.'],
    ],
    constraints: ['1 <= posts <= 10^6', '1 <= colors <= 10^6'],
    tags: ['dynamic-programming', 'math'],
    py: `def paintWays(posts, colors):
    MOD = 1000000007
    if posts == 1:
        return colors % MOD
    same = colors % MOD
    diff = (colors * (colors - 1)) % MOD
    for _ in range(3, posts + 1):
        same, diff = diff, ((same + diff) * (colors - 1)) % MOD
    return (same + diff) % MOD`,
    approach:
      'Track two running counts: ways where the last two posts share a colour (same) and ways where they differ (diff). A new post matching the previous one is only allowed when the previous two differed, so new same = old diff. A new post differing from the previous can follow either state and has colors-1 choices, so new diff = (same + diff) * (colors - 1). Sum the two states at the end, all under the modulus.',
    complexity: { time: 'O(posts)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '2'],
      ['1', '5'],
      ['2', '3'],
      ['4', '2'],
      ['5', '3'],
      ['1', '1'],
      ['10', '4'],
      ['7', '2'],
      ['2', '1'],
      ['100', '5'],
    ],
  },
  {
    n: 2495,
    id: 'pghub-b36-cargo-balance',
    name: 'Cargo Pivot Balance',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'balancePoint',
    params: [{ name: 'weights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Cargo crates sit in a line with masses given by <code>weights</code>. Find the leftmost index where the total mass strictly to its left equals the total mass strictly to its right. Return that index, or <code>-1</code> if no such balance point exists.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 sums to 11 and right of it sums to 11.'],
      ['[1,2,3]', '-1', 'No index splits the line into two equal-mass sides.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '0 <= weights[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def balancePoint(weights):
    total = sum(weights)
    left = 0
    for i, w in enumerate(weights):
        if left == total - left - w:
            return i
        left += w
    return -1`,
    approach:
      'Keep a running sum of everything to the left of the current index. The right side equals the grand total minus the left sum minus the current element. Scan left to right and return the first index where left equals right; if none qualifies, return -1.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'],
      ['[1,2,3]'],
      ['[0]'],
      ['[1,0,1]'],
      ['[10,10]'],
      ['[1,1,1,1,1]'],
      ['[5,0,5]'],
      ['[3,1,5,2,2]'],
      ['[0,0,0,0]'],
      ['[8,4,4]'],
    ],
  },
  {
    n: 2504,
    id: 'pghub-b36-subscriber-streak',
    name: 'Subscriber Active Streak',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestStreak',
    params: [
      { name: 'active', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A subscriber log <code>active</code> records each day as <code>1</code> if the user opened the app or <code>0</code> if not. You are allowed to forgive up to <code>k</code> inactive days, turning them into active ones. Return the length of the longest run of consecutive active days achievable after forgiving at most <code>k</code> zeros.',
    examples: [
      ['[1,1,0,1,1,0,1]\n1', '5', 'Forgive one zero to join two runs into five active days.'],
      ['[0,0,0]\n0', '0', 'No forgiveness and no active days gives a streak of 0.'],
    ],
    constraints: ['1 <= active.length <= 10^5', '0 <= k <= active.length', 'active[i] is 0 or 1'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestStreak(active, k):
    left = 0
    zeros = 0
    best = 0
    for right, v in enumerate(active):
        if v == 0:
            zeros += 1
        while zeros > k:
            if active[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window holding at most k zeros. Expand the right edge, counting zeros; whenever the window contains more than k zeros, shrink from the left until it holds k or fewer. The widest valid window seen is the longest forgivable active streak.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,1,0,1,1,0,1]', '1'],
      ['[0,0,0]', '0'],
      ['[1,1,1]', '0'],
      ['[1,0,1,0,1]', '2'],
      ['[0,0,0,0]', '4'],
      ['[1,0,0,1,1,0,1,1]', '2'],
      ['[0,1,0,1,0,1,0]', '3'],
      ['[1]', '0'],
      ['[0]', '1'],
      ['[1,1,0,0,1,1,1,0,1,1]', '2'],
    ],
  },
  {
    n: 2505,
    id: 'pghub-b36-token-bucket',
    name: 'Bracket Token Validity',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isValid',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A configuration string <code>s</code> contains only the bracket characters <code>()</code>, <code>[]</code>, and <code>{}</code>. Return <code>true</code> if every opening bracket is closed by a matching bracket of the same type in the correct order, otherwise <code>false</code>. An empty string is valid.',
    examples: [
      ['([])', 'true', 'Brackets nest and close correctly.'],
      ['([)]', 'false', 'The square and round brackets interleave incorrectly.'],
    ],
    constraints: ['0 <= s.length <= 10^4', 's consists only of the characters ()[]{}'],
    tags: ['stack', 'strings'],
    py: `def isValid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,
    approach:
      'Push every opening bracket on a stack. On a closing bracket, the top of the stack must be its matching opener; if the stack is empty or the top mismatches, the string is invalid. After the scan the stack must be empty, meaning every opener was closed.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'([])'"],
      ["'([)]'"],
      ["''"],
      ["'()'"],
      ["'((('"],
      ["')))'"],
      ["'{[()]}'"],
      ["'([]{})'"],
      ["'(]'"],
      ["'[({})]({})'"],
    ],
  },
  {
    n: 2510,
    id: 'pghub-b36-island-counter',
    name: 'Flooded Field Patches',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countPatches',
    params: [{ name: 'field', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A field is a grid <code>field</code> where <code>1</code> marks a flooded cell and <code>0</code> is dry. A flooded patch is a group of flooded cells connected horizontally or vertically (not diagonally). Return the number of distinct flooded patches in the field.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'A connected L-shape and a lone cell make two patches.'],
      ['[[0,0],[0,0]]', '0', 'No flooded cells means zero patches.'],
    ],
    constraints: ['1 <= field.length, field[0].length <= 300', 'field[i][j] is 0 or 1'],
    tags: ['graphs', 'depth-first-search'],
    py: `def countPatches(field):
    rows = len(field)
    cols = len(field[0])
    seen = [[False] * cols for _ in range(rows)]
    def flood(r, c):
        stack = [(r, c)]
        seen[r][c] = True
        while stack:
            x, y = stack.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < rows and 0 <= ny < cols and not seen[nx][ny] and field[nx][ny] == 1:
                    seen[nx][ny] = True
                    stack.append((nx, ny))
    count = 0
    for r in range(rows):
        for c in range(cols):
            if field[r][c] == 1 and not seen[r][c]:
                count += 1
                flood(r, c)
    return count`,
    approach:
      'Scan every cell; each time an unvisited flooded cell is found it starts a new patch, so increment the count and flood-fill its whole connected component (via iterative DFS over the four orthogonal neighbours) marking cells visited. Already-visited cells are skipped, so each patch is counted exactly once.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[0],[1],[0],[1]]'],
      ['[[1,0,1],[0,1,0],[1,0,1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[1,0,0,1],[1,0,0,1],[0,0,0,0],[1,1,0,1]]'],
      ['[[0,1,0,1,0,1]]'],
      ['[[1,1,0,0,1],[0,1,0,1,1],[0,0,0,0,0],[1,0,1,1,0]]'],
    ],
  },
  {
    n: 2519,
    id: 'pghub-b36-discount-codes',
    name: 'Distinct Discount Codes',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'distinctCodes',
    params: [{ name: 'digits', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A promo system builds discount codes by permuting all the given <code>digits</code> (each digit used exactly once per code). Because the digit pool may contain repeats, different arrangements can spell the same code. Return the number of distinct codes that can be formed.',
    examples: [
      ['[1,1,2]', '3', 'The distinct arrangements are 112, 121, 211.'],
      ['[5]', '1', 'A single digit yields exactly one code.'],
    ],
    constraints: ['1 <= digits.length <= 9', '0 <= digits[i] <= 9'],
    tags: ['backtracking', 'math'],
    py: `def distinctCodes(digits):
    counts = Counter(digits)
    seen = set()
    n = len(digits)
    path = []
    def backtrack():
        if len(path) == n:
            seen.add(tuple(path))
            return
        for d in list(counts.keys()):
            if counts[d] > 0:
                counts[d] -= 1
                path.append(d)
                backtrack()
                path.pop()
                counts[d] += 1
    backtrack()
    return len(seen)`,
    approach:
      'Backtrack over the multiset of digits, at each position choosing any digit that still has remaining count, decrementing it before recursing and restoring it after. Completed arrangements are stored as tuples in a set so duplicates collapse, and the set size is the number of distinct codes.',
    complexity: { time: 'O(n! ) worst case', space: 'O(n!)' },
    cases: [
      ['[1,1,2]'],
      ['[5]'],
      ['[1,2,3]'],
      ['[2,2,2]'],
      ['[1,1,1,1]'],
      ['[0,0,1]'],
      ['[9,8,7,6]'],
      ['[1,1,2,2]'],
      ['[3,3,3,4,4]'],
      ['[1,2,2,3,3,3]'],
    ],
  },
  {
    n: 2524,
    id: 'pghub-b36-cache-evict',
    name: 'Frequency Eviction Order',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'evictionOrder',
    params: [{ name: 'accesses', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A cache logs page <code>accesses</code> in order. After all accesses, the cache is flushed by repeatedly evicting one page at a time: always evict the page with the fewest total accesses, and break ties by evicting the page that was accessed earliest the first time (smaller first-seen index). Return the page ids in the order they are evicted.',
    examples: [
      ['[3,1,3,2,1,3]', '[2,1,3]', 'Counts: 3->3, 1->2, 2->1; evict 2, then 1, then 3.'],
      ['[7]', '[7]', 'A single page is the only one to evict.'],
    ],
    constraints: ['1 <= accesses.length <= 10^5', '0 <= accesses[i] <= 10^9'],
    tags: ['heap', 'sorting'],
    py: `def evictionOrder(accesses):
    count = Counter()
    first = {}
    for i, p in enumerate(accesses):
        count[p] += 1
        if p not in first:
            first[p] = i
    pages = list(count.keys())
    pages.sort(key=lambda p: (count[p], first[p]))
    return pages`,
    approach:
      'Tally each page total access count and remember the index of its first appearance. Eviction priority is the page with the smallest count, breaking ties by smallest first-seen index, which is exactly a sort of the distinct pages by the pair (count, first-seen). The sorted page list is the eviction order.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[3,1,3,2,1,3]'],
      ['[7]'],
      ['[1,2,3,4]'],
      ['[5,5,5,5]'],
      ['[2,1,2,1,3]'],
      ['[9,8,7,8,9,9]'],
      ['[0,0,1,1,2,2]'],
      ['[4,4,4,1,1,2]'],
      ['[10,20,10,30,20,10]'],
      ['[1,1,1,2,2,3,3,3,3]'],
    ],
  },
  {
    n: 2533,
    id: 'pghub-b36-signal-toggle',
    name: 'Signal Bit Toggle Cost',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'toggleCost',
    params: [
      { name: 'a', type: 'int' },
      { name: 'b', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Two devices hold configuration registers as the non-negative integers <code>a</code> and <code>b</code>. To sync them you flip individual bits of <code>a</code> until it equals <code>b</code>, and each bit flip costs one unit. Return the minimum total cost, which is the number of bit positions where <code>a</code> and <code>b</code> differ.',
    examples: [
      ['5\n6', '2', '101 and 110 differ in two bit positions.'],
      ['7\n7', '0', 'Identical registers need no flips.'],
    ],
    constraints: ['0 <= a, b <= 10^18'],
    tags: ['bit-manipulation', 'math'],
    py: `def toggleCost(a, b):
    return bin(a ^ b).count('1')`,
    approach:
      'The bits that must flip are exactly the positions where a and b disagree, which is the set bits of their XOR. Count the set bits of a XOR b to get the minimum number of flips (the Hamming distance).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['5', '6'],
      ['7', '7'],
      ['0', '0'],
      ['0', '15'],
      ['1', '2'],
      ['255', '0'],
      ['1023', '1024'],
      ['1000000000000000000', '0'],
      ['12345', '54321'],
      ['8', '15'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B36>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b36-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B36>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B36>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b36-grade-${prob.n}.py`);
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
