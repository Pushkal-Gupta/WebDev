#!/usr/bin/env node
// Batch 25 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1445, 1454, 1459, 1468, 1469, 1474, 1479, 1485, 1490, 1495, 1500, 1570, 1571, 1580, 1586
//
//   node scripts/fill-gap-problems-batch25.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch25.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch25.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1445, 1454, 1459, 1468, 1469, 1474, 1479, 1485, 1490, 1495, 1500, 1570, 1571, 1580, 1586];

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
    n: 1445,
    id: 'pghub-b25-ferry-loading',
    name: 'Ferry Loading Trips',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A ferry carries cars across a river. Car <code>i</code> weighs <code>weights[i]</code> and the ferry can hold at most <code>cap</code> total weight per trip. Cars board in the given order and a car only boards if it still fits within the remaining capacity for the current trip; otherwise the ferry departs and a fresh trip begins. Return the number of trips needed to move every car.',
    examples: [
      ['[3,2,2,4,1]\n5', '3', 'Trips carry (3,2), (2), (4,1).'],
      ['[5]\n5', '1', 'A single car exactly fills one trip.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= cap', '1 <= cap <= 10^9'],
    tags: ['greedy', 'arrays'],
    py: `def minTrips(weights, cap):
    trips = 1
    load = 0
    for w in weights:
        if load + w <= cap:
            load += w
        else:
            trips += 1
            load = w
    return trips`,
    approach:
      'Process cars in order keeping the load of the current trip. Add a car if it fits; otherwise close the trip, start a new one, and place the car there. Each overflow forces exactly one extra trip, so the running trip counter is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,2,2,4,1]', '5'],
      ['[5]', '5'],
      ['[1,1,1,1]', '2'],
      ['[2,2,2,2]', '4'],
      ['[10,10,10]', '10'],
      ['[1,2,3,4,5]', '6'],
      ['[7,3,3,7]', '10'],
      ['[4,4,4,4,4]', '8'],
      ['[6,1,1,1,1,1]', '6'],
      ['[2,2,2,2,2]', '6'],
    ],
  },
  {
    n: 1454,
    id: 'pghub-b25-relay-baton',
    name: 'Relay Baton Drops',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countDrops',
    params: [{ name: 'lanes', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Runners pass a baton down a line; <code>lanes[i]</code> is the running speed of runner <code>i</code>. A baton is dropped at a handoff whenever the next runner is strictly slower than the current one (a hard deceleration). Return the total number of dropped handoffs across the whole line.',
    examples: [
      ['[3,5,4,4,2]', '2', 'Drops happen at 5->4 and 4->2.'],
      ['[1,2,3]', '0', 'Speeds never decrease, so no drops.'],
    ],
    constraints: ['1 <= lanes.length <= 10^5', '1 <= lanes[i] <= 10^9'],
    tags: ['arrays', 'first-order'],
    py: `def countDrops(lanes):
    drops = 0
    for i in range(1, len(lanes)):
        if lanes[i] < lanes[i-1]:
            drops += 1
    return drops`,
    approach:
      'Walk adjacent pairs once. A drop occurs exactly when a runner is strictly slower than the previous runner, so count every position where the value decreases. A single linear pass with no extra storage suffices.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,5,4,4,2]'],
      ['[1,2,3]'],
      ['[5,4,3,2,1]'],
      ['[7]'],
      ['[2,2,2,2]'],
      ['[1,3,2,4,3,5]'],
      ['[9,1,9,1,9]'],
      ['[10,10,9,9,8]'],
      ['[1,1,2,2,1]'],
      ['[4,5,6,5,4,5]'],
    ],
  },
  {
    n: 1459,
    id: 'pghub-b25-vault-digits',
    name: 'Vault Digit Product Root',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'digitRoot',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A vault lock repeatedly transforms a number by replacing it with the product of its decimal digits, stopping once the value has a single digit. Given a non-negative integer <code>n</code>, return that final single digit (the multiplicative digital root).',
    examples: [
      ['39', '4', '3*9=27, then 2*7=14, then 1*4=4.'],
      ['7', '7', 'Already a single digit.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math', 'first-order'],
    py: `def digitRoot(n):
    while n >= 10:
        prod = 1
        while n > 0:
            prod *= n % 10
            n //= 10
        n = prod
    return n`,
    approach:
      'Repeatedly collapse the number into the product of its digits until a single digit remains. The inner loop extracts digits via mod and integer division; the outer loop reapplies the transform. A digit of 0 immediately collapses to 0 on the next round.',
    complexity: { time: 'O(log n) per round', space: 'O(1)' },
    cases: [
      ['39'],
      ['7'],
      ['0'],
      ['10'],
      ['25'],
      ['99'],
      ['277777788'],
      ['123456789'],
      ['1000000000'],
      ['68'],
    ],
  },
  {
    n: 1468,
    id: 'pghub-b25-shelf-stock',
    name: 'Shelf Restock Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestRun',
    params: [
      { name: 'stock', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A shelf is scanned hourly; <code>stock[i]</code> is 1 if the item was in stock that hour and 0 if it was out. A clerk may flip at most <code>k</code> out-of-stock hours to in-stock. Return the length of the longest contiguous run of in-stock hours achievable after at most <code>k</code> flips.',
    examples: [
      ['[1,0,1,1,0,1]\n1', '4', 'Flip one zero to join a run of four.'],
      ['[0,0,0]\n0', '0', 'No flips and nothing is in stock.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', 'stock[i] is 0 or 1', '0 <= k <= stock.length'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestRun(stock, k):
    left = 0
    zeros = 0
    best = 0
    for right, v in enumerate(stock):
        if v == 0:
            zeros += 1
        while zeros > k:
            if stock[left] == 0:
                zeros -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window that may contain at most k zeros. Expand the right edge counting zeros; when zeros exceed k, advance the left edge until the budget holds again. The widest valid window seen is the longest achievable in-stock run.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,0,1,1,0,1]', '1'],
      ['[0,0,0]', '0'],
      ['[1,1,1,1]', '0'],
      ['[0,0,0]', '3'],
      ['[1,0,0,1,0,1,1]', '2'],
      ['[1]', '0'],
      ['[0]', '1'],
      ['[1,0,1,0,1,0,1]', '2'],
      ['[0,1,0,1,0,1,0]', '3'],
      ['[1,1,0,0,1,1,0,1]', '1'],
    ],
  },
  {
    n: 1469,
    id: 'pghub-b25-elevator-floors',
    name: 'Elevator Reachable Floors',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'reachableFloors',
    params: [
      { name: 'floors', type: 'int' },
      { name: 'up', type: 'int' },
      { name: 'down', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A peculiar elevator in a building with floors <code>0..floors-1</code> can only move exactly <code>up</code> floors up or exactly <code>down</code> floors down per press, and may never leave the valid floor range. Starting at floor 0, return how many distinct floors are reachable (including floor 0).',
    examples: [
      ['10\n3\n2', '10', 'Combining +3 and -2 presses reaches every floor.'],
      ['5\n2\n2', '3', 'Only floors 0, 2 and 4 are reachable.'],
    ],
    constraints: ['1 <= floors <= 10^5', '1 <= up, down <= floors'],
    tags: ['graphs', 'first-order'],
    py: `def reachableFloors(floors, up, down):
    seen = [False] * floors
    seen[0] = True
    stack = [0]
    count = 1
    while stack:
        f = stack.pop()
        for nf in (f + up, f - down):
            if 0 <= nf < floors and not seen[nf]:
                seen[nf] = True
                count += 1
                stack.append(nf)
    return count`,
    approach:
      'Model floors as graph nodes with edges to floor+up and floor-down when inside range. A depth-first flood fill from floor 0 marks every floor reachable through any sequence of presses; the count of marked floors is the answer.',
    complexity: { time: 'O(floors)', space: 'O(floors)' },
    multiParam: true,
    cases: [
      ['10', '3', '2'],
      ['5', '2', '2'],
      ['1', '1', '1'],
      ['6', '3', '3'],
      ['7', '1', '1'],
      ['8', '4', '4'],
      ['9', '2', '3'],
      ['100', '7', '5'],
      ['12', '6', '4'],
      ['15', '5', '5'],
    ],
  },
  {
    n: 1474,
    id: 'pghub-b25-paint-rollers',
    name: 'Paint Roller Coverage',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'paintedLength',
    params: [{ name: 'strokes', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A wall is painted with rollers; each stroke is <code>[start, end]</code> covering the half-open segment from <code>start</code> to <code>end</code>. Strokes may overlap. Return the total length of wall that ends up painted (overlapping regions are counted once).',
    examples: [
      ['[[1,4],[2,6],[8,10]]', '7', 'Merged coverage is [1,6] and [8,10], lengths 5 and 2.'],
      ['[[0,1]]', '1', 'A single stroke of length one.'],
    ],
    constraints: ['1 <= strokes.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def paintedLength(strokes):
    arr = sorted(strokes)
    total = 0
    cur_lo, cur_hi = arr[0]
    for lo, hi in arr[1:]:
        if lo <= cur_hi:
            if hi > cur_hi:
                cur_hi = hi
        else:
            total += cur_hi - cur_lo
            cur_lo, cur_hi = lo, hi
    total += cur_hi - cur_lo
    return total`,
    approach:
      'Sort strokes by start, then sweep merging any stroke that overlaps the current merged segment by extending its right edge. When a gap appears, bank the finished segment length and start a new one. Sum the merged lengths so overlaps are counted only once.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,6],[8,10]]'],
      ['[[0,1]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[0,5],[5,10]]'],
      ['[[0,5],[6,10]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[2,8],[1,3],[7,9]]'],
      ['[[0,100]]'],
      ['[[1,2],[1,2],[1,2]]'],
    ],
  },
  {
    n: 1479,
    id: 'pghub-b25-token-bracket',
    name: 'Token Bracket Balance',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'minFixes',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code>. In one move you may flip any single character (turning a <code>(</code> into a <code>)</code> or vice versa). Return the minimum number of flips needed to make the whole string a balanced sequence of parentheses.',
    examples: [
      ['"())("', '2', 'Flip index 2 and index 3 to get "()()".'],
      ['"()"', '0', 'Already balanced.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's.length is even', 's consists of ( and )'],
    tags: ['stack', 'greedy'],
    py: `def minFixes(s):
    open_need = 0
    flips = 0
    for ch in s:
        if ch == '(':
            open_need += 1
        else:
            if open_need > 0:
                open_need -= 1
            else:
                flips += 1
                open_need += 1
    flips += open_need // 2
    return flips`,
    approach:
      'Scan left to right tracking unmatched open brackets. A close with no open to match must be flipped into an open, costing one flip and creating a new open. At the end, leftover unmatched opens pair up two at a time, each pair fixed by one flip.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"())("'],
      ['"()"'],
      ['"(("'],
      ['"))"'],
      ['"))(("'],
      ['"()()"'],
      ['"(())"'],
      ['")()("'],
      ['"(((())))"'],
      ['"))))(((("'],
    ],
  },
  {
    n: 1485,
    id: 'pghub-b25-trail-altitude',
    name: 'Trail Altitude Smoothing',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minRaise',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A hiking trail has marker altitudes in <code>heights</code>. To make the trail non-decreasing you may only raise markers (never lower them). Return the minimum total amount of altitude you must add across all markers so the sequence becomes non-decreasing.',
    examples: [
      ['[3,1,2,1]', '5', 'Raise to [3,3,3,3]: +0+2+1+2 = 5.'],
      ['[1,2,3]', '0', 'Already non-decreasing.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^9'],
    tags: ['dp', 'greedy'],
    py: `def minRaise(heights):
    total = 0
    prev = heights[0]
    for h in heights[1:]:
        if h < prev:
            total += prev - h
        else:
            prev = h
    return total`,
    approach:
      'Greedily fix each marker to be at least as high as the running maximum so far. Since markers can only rise, any marker below the previous required height is raised up to it, adding the deficit; otherwise it sets the new floor. Summing deficits gives the minimum total raise.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,2,1]'],
      ['[1,2,3]'],
      ['[5,4,3,2,1]'],
      ['[7]'],
      ['[2,2,2]'],
      ['[1,5,2,6,3]'],
      ['[10,1,1,1,1]'],
      ['[0,0,0,0]'],
      ['[1,3,2,4,3,5]'],
      ['[9,8,7,10,6]'],
    ],
  },
  {
    n: 1490,
    id: 'pghub-b25-warehouse-bins',
    name: 'Warehouse Bin Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'parcels', type: 'List[int]' },
      { name: 'days', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Parcels arrive on a conveyor in the order given by <code>parcels</code> and must be shipped within <code>days</code> days. Each day you load a contiguous prefix of the remaining parcels onto a single truck without exceeding its weight capacity. Return the minimum truck capacity that ships everything within the day limit.',
    examples: [
      ['[1,2,3,4,5]\n3', '6', 'Capacity 6 ships (1,2,3),(4),(5) in 3 days.'],
      ['[5,5,5]\n3', '5', 'Each day carries one parcel.'],
    ],
    constraints: ['1 <= parcels.length <= 10^5', '1 <= parcels[i] <= 10^4', '1 <= days <= parcels.length'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(parcels, days):
    def need(cap):
        d = 1
        load = 0
        for p in parcels:
            if load + p > cap:
                d += 1
                load = 0
            load += p
        return d
    lo = max(parcels)
    hi = sum(parcels)
    while lo < hi:
        mid = (lo + hi) // 2
        if need(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Capacity is monotone: any capacity that works keeps working when increased, so binary-search the answer between the heaviest single parcel and the total weight. For a candidate capacity, greedily fill each day until the next parcel would overflow, counting days, and accept the smallest capacity needing at most the day limit.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '3'],
      ['[5,5,5]', '3'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[3,2,2,4,1,4]', '3'],
      ['[1,1,1,1,1]', '2'],
      ['[10]', '1'],
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,1,1]', '4'],
      ['[9,8,7,6,5,4,3,2,1]', '3'],
    ],
  },
  {
    n: 1495,
    id: 'pghub-b25-spy-codes',
    name: 'Spy Code Subset XOR',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'totalXorSum',
    params: [{ name: 'codes', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A spy ring assigns each agent a numeric <code>code</code>. The signature of any subset of agents is the XOR of their codes (the empty subset has signature 0). Return the sum of the signatures over all <code>2^n</code> subsets of the given <code>codes</code>.',
    examples: [
      ['[1,3]', '6', 'Subset signatures are 0,1,3,2 which sum to 6.'],
      ['[5]', '5', 'Subsets {} and {5} give 0 and 5.'],
    ],
    constraints: ['1 <= codes.length <= 20', '0 <= codes[i] <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def totalXorSum(codes):
    n = len(codes)
    or_all = 0
    for c in codes:
        or_all |= c
    return or_all * (1 << (n - 1))`,
    approach:
      'Consider each bit independently. A bit contributes to a subset signature only when an odd number of subset elements have it set; across all subsets exactly half (2^(n-1)) of subsets do, provided at least one code has that bit. Hence each bit present in the OR of all codes contributes 2^(n-1) times, giving OR(codes) * 2^(n-1).',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3]'],
      ['[5]'],
      ['[1,2,3]'],
      ['[0,0,0]'],
      ['[8,1,2]'],
      ['[7,7,7]'],
      ['[1,1]'],
      ['[15,9,6,2]'],
      ['[1000000000,1]'],
      ['[4,8,16,32]'],
    ],
  },
  {
    n: 1500,
    id: 'pghub-b25-orchard-prune',
    name: 'Orchard Diameter Prune',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'orchardDiameter',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'An orchard is laid out as a tree of <code>n</code> plots numbered <code>0..n-1</code> connected by <code>edges</code>, each <code>[a, b]</code> a path between two plots. The distance between two plots is the number of paths on the route between them. Return the orchard diameter: the largest distance between any two plots.',
    examples: [
      ['4\n[[0,1],[1,2],[1,3]]', '2', 'Plots 2 and 3 are 2 paths apart through plot 1.'],
      ['1\n[]', '0', 'A lone plot has diameter 0.'],
    ],
    constraints: ['1 <= n <= 10^4', 'edges.length == n - 1', 'the edges form a tree'],
    tags: ['trees', 'graphs'],
    py: `def orchardDiameter(n, edges):
    if n == 1:
        return 0
    adj = defaultdict(list)
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    def bfs(src):
        dist = [-1] * n
        dist[src] = 0
        dq = deque([src])
        far = src
        while dq:
            u = dq.popleft()
            for v in adj[u]:
                if dist[v] == -1:
                    dist[v] = dist[u] + 1
                    if dist[v] > dist[far]:
                        far = v
                    dq.append(v)
        return far, dist[far]
    a, _ = bfs(0)
    _, d = bfs(a)
    return d`,
    approach:
      'Use the classic double-BFS for tree diameter. From any node, BFS to find the farthest node A; that node is guaranteed to be an endpoint of some longest path. A second BFS from A returns the maximum distance, which is the diameter.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[1,3]]'],
      ['1', '[]'],
      ['2', '[[0,1]]'],
      ['5', '[[0,1],[1,2],[2,3],[3,4]]'],
      ['6', '[[0,1],[0,2],[0,3],[3,4],[3,5]]'],
      ['7', '[[0,1],[1,2],[1,3],[3,4],[4,5],[4,6]]'],
      ['3', '[[0,1],[0,2]]'],
      ['8', '[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]'],
      ['5', '[[2,0],[2,1],[2,3],[2,4]]'],
      ['9', '[[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[7,8]]'],
    ],
  },
  {
    n: 1570,
    id: 'pghub-b25-sparse-dot',
    name: 'Sparse Vector Dot Product',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'sparseDot',
    params: [
      { name: 'a', type: 'List[int]' },
      { name: 'b', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'Two equal-length vectors <code>a</code> and <code>b</code> are mostly zeros. Return their dot product, the sum of <code>a[i] * b[i]</code> over all indices. Solve it efficiently by skipping positions where either vector is zero.',
    examples: [
      ['[1,0,0,2,3]\n[0,3,0,4,0]', '8', 'Only index 3 has both non-zero: 2*4 = 8.'],
      ['[0,0,0]\n[1,2,3]', '0', 'One vector is all zeros.'],
    ],
    constraints: ['1 <= a.length == b.length <= 10^5', '-1000 <= a[i], b[i] <= 1000'],
    tags: ['arrays', 'two-pointers'],
    py: `def sparseDot(a, b):
    nz = {i: v for i, v in enumerate(a) if v != 0}
    total = 0
    for i, v in nz.items():
        if b[i] != 0:
            total += v * b[i]
    return total`,
    approach:
      'Store the non-zero entries of one vector in a hash map keyed by index. Iterate those entries and multiply only where the other vector is also non-zero. Work scales with the count of non-zero positions rather than the full length.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,0,0,2,3]', '[0,3,0,4,0]'],
      ['[0,0,0]', '[1,2,3]'],
      ['[1,2,3]', '[4,5,6]'],
      ['[0,0,0]', '[0,0,0]'],
      ['[5]', '[5]'],
      ['[-1,0,2]', '[3,0,-4]'],
      ['[1,0,1,0,1]', '[0,1,0,1,0]'],
      ['[2,2,2,2]', '[1,1,1,1]'],
      ['[1000,0,1000]', '[1000,0,1000]'],
      ['[0,1,0,1,0,1]', '[1,0,1,0,1,0]'],
    ],
  },
  {
    n: 1571,
    id: 'pghub-b25-conveyor-cycle',
    name: 'Conveyor Belt Cycle',
    topic_id: 'linkedlist',
    difficulty: 'Medium',
    method_name: 'cycleLength',
    params: [{ name: 'next_belt', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A factory has belts numbered <code>0..n-1</code>; a parcel leaving belt <code>i</code> moves to belt <code>next_belt[i]</code> (or stops if <code>next_belt[i]</code> is <code>-1</code>). Starting a parcel on belt 0 and following the links, return the length of the cycle it eventually enters, or 0 if the parcel reaches a stop (no cycle).',
    examples: [
      ['[1,2,3,1]', '3', 'Belt 0 leads into cycle 1->2->3->1 of length 3.'],
      ['[1,2,-1]', '0', 'The parcel stops at belt 2.'],
    ],
    constraints: ['1 <= next_belt.length <= 10^5', '-1 <= next_belt[i] < next_belt.length'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def cycleLength(next_belt):
    slow = 0
    fast = 0
    while True:
        if next_belt[fast] == -1:
            return 0
        fast = next_belt[fast]
        if next_belt[fast] == -1:
            return 0
        fast = next_belt[fast]
        slow = next_belt[slow]
        if slow == fast:
            break
    length = 1
    cur = next_belt[slow]
    while cur != slow:
        cur = next_belt[cur]
        length += 1
    return length`,
    approach:
      "Apply Floyd's tortoise-and-hare on the functional graph of belt links. If a -1 stop is reached the parcel never cycles, so return 0. Once slow and fast meet inside a cycle, walk one pointer around until it returns to the meeting node to measure the cycle length.",
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,1]'],
      ['[1,2,-1]'],
      ['[0]'],
      ['[1,0]'],
      ['[1,2,3,4,2]'],
      ['[-1]'],
      ['[1,2,3,4,5,-1]'],
      ['[2,2,2]'],
      ['[1,2,3,4,0]'],
      ['[3,3,3,3]'],
    ],
  },
  {
    n: 1580,
    id: 'pghub-b25-festival-seats',
    name: 'Festival Seat Assignment',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'lastSeated',
    params: [
      { name: 'rows', type: 'int' },
      { name: 'order', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A festival hall has rows numbered <code>0..rows-1</code>, all empty. Guests arrive in the sequence <code>order</code>; each guest is seated in the currently emptiest row (fewest people), breaking ties by the smallest row number. Each entry in <code>order</code> is one arriving guest (its value is ignored). Return the row number assigned to the last guest.',
    examples: [
      ['3\n[1,1,1,1]', '0', 'Rows fill 0,1,2 then guest 4 returns to row 0.'],
      ['1\n[1,1]', '0', 'Only one row exists.'],
    ],
    constraints: ['1 <= rows <= 10^5', '1 <= order.length <= 10^5'],
    tags: ['heap', 'greedy'],
    py: `def lastSeated(rows, order):
    heap = [(0, r) for r in range(rows)]
    heapq.heapify(heap)
    last = -1
    for _ in order:
        cnt, r = heapq.heappop(heap)
        last = r
        heapq.heappush(heap, (cnt + 1, r))
    return last`,
    approach:
      'Maintain a min-heap of (occupancy, row) so the top is always the emptiest row, with row number as the natural tie-breaker. For each guest, pop the best row, record it, increment its count, and push it back. The last popped row is the answer.',
    complexity: { time: 'O(g log rows)', space: 'O(rows)' },
    multiParam: true,
    cases: [
      ['3', '[1,1,1,1]'],
      ['1', '[1,1]'],
      ['2', '[1,1,1]'],
      ['5', '[1]'],
      ['4', '[1,1,1,1]'],
      ['3', '[1,1,1,1,1,1,1]'],
      ['2', '[1,1,1,1]'],
      ['6', '[1,1,1,1,1]'],
      ['3', '[1,1]'],
      ['10', '[1,1,1,1,1,1,1,1,1,1,1,1]'],
    ],
  },
  {
    n: 1586,
    id: 'pghub-b25-grid-escape',
    name: 'Grid Escape Path Count',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'escapeRoutes',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A robot starts at the top-left of a grid and must reach the bottom-right, moving only right or down. A cell with value <code>1</code> is a wall the robot cannot enter; <code>0</code> is open. Return the number of distinct escape paths, modulo <code>1000000007</code>. If the start or end is a wall the answer is 0.',
    examples: [
      ['[[0,0,0],[0,1,0],[0,0,0]]', '2', 'Two paths avoid the central wall.'],
      ['[[0,1],[0,0]]', '1', 'Only the down-then-right path is open.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', 'grid[r][c] is 0 or 1'],
    tags: ['2d-dp', 'dp'],
    py: `def escapeRoutes(grid):
    MOD = 1000000007
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows-1][cols-1] == 1:
        return 0
    dp = [0] * cols
    dp[0] = 1
    for r in range(rows):
        if grid[r][0] == 1:
            dp[0] = 0
        for c in range(1, cols):
            if grid[r][c] == 1:
                dp[c] = 0
            else:
                dp[c] = (dp[c] + dp[c-1]) % MOD
    return dp[cols-1]`,
    approach:
      'Count paths with a rolling 1D DP where dp[c] holds the ways to reach the current row at column c. A wall zeroes its cell; otherwise the ways equal those from above (the existing dp[c]) plus from the left (dp[c-1]). The first column only inherits from above. Take the modulus throughout.',
    complexity: { time: 'O(rows * cols)', space: 'O(cols)' },
    cases: [
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[0,1],[0,0]]'],
      ['[[0]]'],
      ['[[1]]'],
      ['[[0,0],[0,0]]'],
      ['[[0,0,0,0]]'],
      ['[[0],[0],[0],[0]]'],
      ['[[0,0,0],[1,1,0],[0,0,0]]'],
      ['[[0,1,0],[0,1,0],[0,0,0]]'],
      ['[[1,0],[0,0]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B25>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b25-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B25>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B25>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b25-grade-${prob.n}.py`);
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
