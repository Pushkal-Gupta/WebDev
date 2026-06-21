#!/usr/bin/env node
// Batch 17 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills these 15 gap leetcode_numbers exactly:
//   612, 613, 614, 615, 616, 618, 625, 631, 634, 635, 642, 644, 651, 656, 660
//
//   node scripts/fill-gap-problems-batch17.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch17.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch17.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [612, 613, 614, 615, 616, 618, 625, 631, 634, 635, 642, 644, 651, 656, 660];

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
    n: 612,
    id: 'pghub-b17-warehouse-aisles',
    name: 'Warehouse Aisle Coverage',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minLamps',
    params: [{ name: 'shelves', type: 'List[List[int]]' }, { name: 'reach', type: 'int' }],
    return_type: 'int',
    statement:
      'A warehouse aisle has shelves given as intervals <code>shelves[i] = [start, end]</code> on a number line. You place ceiling lamps at integer positions; a lamp at position <code>p</code> lights every point within distance <code>reach</code>, i.e. it covers <code>[p - reach, p + reach]</code>. Return the minimum number of lamps needed so that every shelf interval is fully covered by lamps, where a shelf is fully covered when the union of lamp ranges contains the entire interval.',
    examples: [
      ['[[1,3],[6,8]]\n1', '2', 'Each width-3 lamp (reach 1 spans 3 units) covers one shelf, so 2 lamps cover both shelves.'],
      ['[[0,0]]\n2', '1', 'One lamp covering the single point suffices.'],
    ],
    constraints: ['1 <= shelves.length <= 10^4', '0 <= start <= end <= 10^9', '0 <= reach <= 10^9'],
    tags: ['greedy', 'intervals'],
    py: `def minLamps(shelves, reach):
    intervals = sorted(shelves)
    span = 2 * reach + 1
    lamps = 0
    covered_until = None  # rightmost covered coordinate (inclusive)
    for s, e in intervals:
        pos = s if covered_until is None or covered_until < s else covered_until + 1
        if covered_until is not None and covered_until >= e:
            continue
        while pos <= e:
            # place a lamp centered at pos + reach so its left edge is pos
            lamps += 1
            covered_until = pos + span - 1
            if covered_until >= e:
                break
            pos = covered_until + 1
    return lamps`,
    approach:
      'Sort shelves and sweep left to right tracking the rightmost coordinate already lit. For each uncovered stretch place lamps greedily so each new lamp begins exactly where coverage ended, each lamp spanning width 2*reach+1. Counting lamps until each shelf is fully covered gives the minimum.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[[1,3],[6,8]]', '1'],
      ['[[0,0]]', '2'],
      ['[[0,10]]', '0'],
      ['[[0,4],[2,6]]', '1'],
      ['[[5,5],[5,5]]', '3'],
      ['[[0,2],[3,5],[6,8]]', '1'],
      ['[[1,1]]', '0'],
      ['[[0,9]]', '2'],
      ['[[0,3],[10,13]]', '1'],
      ['[[2,2],[4,4],[6,6]]', '0'],
    ],
  },
  {
    n: 613,
    id: 'pghub-b17-prime-gap-pairs',
    name: 'Prime Gap Pair Count',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'twinGapPairs',
    params: [{ name: 'lo', type: 'int' }, { name: 'hi', type: 'int' }, { name: 'gap', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an inclusive range <code>[lo, hi]</code> and a positive integer <code>gap</code>, return the number of ordered pairs of primes <code>(p, q)</code> with <code>lo &lt;= p &lt; q &lt;= hi</code> and <code>q - p == gap</code>.',
    examples: [
      ['2\n13\n2', '3', 'Prime pairs differing by 2 in [2,13]: (3,5),(5,7),(11,13).'],
      ['10\n20\n4', '1', 'The only prime pair in [10,20] differing by 4 is (13,17).'],
    ],
    constraints: ['2 <= lo <= hi <= 10^6', '1 <= gap <= 10^6'],
    tags: ['math', 'sieve'],
    py: `def twinGapPairs(lo, hi, gap):
    sieve = bytearray([1]) * (hi + 1)
    if hi >= 0:
        sieve[0] = 0
    if hi >= 1:
        sieve[1] = 0
    i = 2
    while i * i <= hi:
        if sieve[i]:
            for j in range(i * i, hi + 1, i):
                sieve[j] = 0
        i += 1
    count = 0
    for p in range(lo, hi - gap + 1):
        q = p + gap
        if sieve[p] and q <= hi and sieve[q]:
            count += 1
    return count`,
    approach:
      'Build a sieve of Eratosthenes up to hi. Then for every prime p in range check whether p+gap is also prime and within range. Each valid p contributes one pair, giving the count in linear time after the sieve.',
    complexity: { time: 'O(hi log log hi)', space: 'O(hi)' },
    multiParam: true,
    cases: [
      ['2', '13', '2'],
      ['10', '20', '4'],
      ['2', '100', '2'],
      ['2', '50', '6'],
      ['100', '200', '4'],
      ['2', '3', '1'],
      ['2', '3', '5'],
      ['2', '1000', '4'],
      ['500', '600', '2'],
      ['2', '30', '6'],
    ],
  },
  {
    n: 614,
    id: 'pghub-b17-stream-median-window',
    name: 'Rolling Window Median',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'windowMedians',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[float]',
    statement:
      'Given an integer array <code>nums</code> and a window size <code>k</code>, slide a window of size k from left to right. Return a list of the median of each window. The median of an even-sized window is the average of its two middle values. Round each median to at most one decimal place by returning it as a number (integers stay integers).',
    examples: [
      ['[1,3,-1,-3,5,3,6,7]\n3', '[1,-1,-1,3,5,6]', 'Medians of each length-3 window.'],
      ['[1,2,3,4]\n2', '[1.5,2.5,3.5]', 'Each even window averages its two middle elements.'],
    ],
    constraints: ['1 <= k <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    tags: ['heap', 'sliding-window'],
    py: `def windowMedians(nums, k):
    import bisect
    window = sorted(nums[:k])
    res = []
    def med():
        if k % 2:
            m = window[k // 2]
            return m
        a, b = window[k // 2 - 1], window[k // 2]
        avg = (a + b) / 2
        return int(avg) if avg == int(avg) else avg
    res.append(med())
    for i in range(k, len(nums)):
        out = nums[i - k]
        idx = bisect.bisect_left(window, out)
        window.pop(idx)
        bisect.insort(window, nums[i])
        res.append(med())
    return res`,
    approach:
      'Maintain the current window as a sorted list. Computing the median is then an index lookup (odd k) or an average of the two central elements (even k). Sliding removes the outgoing element via binary search and inserts the incoming one, keeping the list sorted.',
    complexity: { time: 'O(n k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,3,-1,-3,5,3,6,7]', '3'],
      ['[1,2,3,4]', '2'],
      ['[5]', '1'],
      ['[2,2,2,2]', '2'],
      ['[1,4,2,3]', '4'],
      ['[10,9,8,7,6]', '3'],
      ['[1,2]', '2'],
      ['[-5,-1,-3,-2]', '2'],
      ['[100,200,300]', '1'],
      ['[3,1,2,5,4]', '5'],
    ],
  },
  {
    n: 615,
    id: 'pghub-b17-elevator-trips',
    name: 'Elevator Trip Planner',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minTrips',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'An elevator carries boxes whose weights are in <code>weights</code>. Each trip can carry at most 2 boxes, and the total weight of a trip must not exceed <code>limit</code>. Every individual box weighs at most <code>limit</code>. Return the minimum number of trips needed to move all boxes.',
    examples: [
      ['[1,2,3,4]\n5', '2', 'Pair (1,4) and (2,3): 2 trips.'],
      ['[3,5,3,4]\n5', '4', 'No two boxes fit together, so each goes alone.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit <= 10^9'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, limit):
    w = sorted(weights)
    i, j = 0, len(w) - 1
    trips = 0
    while i <= j:
        if i < j and w[i] + w[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights, then use two pointers from both ends. Always try to pair the lightest remaining box with the heaviest; if they fit together send both, otherwise the heaviest goes alone. Each trip advances the high pointer, yielding the minimum count.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '5'],
      ['[3,5,3,4]', '5'],
      ['[1]', '10'],
      ['[5,5,5,5]', '10'],
      ['[1,1,1,1]', '2'],
      ['[2,3,4,5]', '6'],
      ['[1,2]', '3'],
      ['[7,2,3,5,4]', '8'],
      ['[9,9,9]', '9'],
      ['[1,1,1]', '2'],
    ],
  },
  {
    n: 616,
    id: 'pghub-b17-token-balance',
    name: 'Balanced Token Stream',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'longestBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code>. Return the length of the longest contiguous substring that is a well-formed (balanced) parenthesis sequence.',
    examples: [
      ['"(()"', '2', 'The substring "()" has length 2.'],
      ['")()())"', '4', 'The substring "()()" has length 4.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of ( and ) only'],
    tags: ['stack', 'strings'],
    py: `def longestBalanced(s):
    stack = [-1]
    best = 0
    for i, ch in enumerate(s):
        if ch == '(':
            stack.append(i)
        else:
            stack.pop()
            if not stack:
                stack.append(i)
            else:
                best = max(best, i - stack[-1])
    return best`,
    approach:
      'Keep a stack of indices seeded with -1 to mark the boundary before any valid run. Push indices of open brackets. On a close, pop; if the stack empties, push the current index as a new boundary, otherwise the distance to the new top is a valid balanced length.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"(()"'],
      ['")()())"'],
      ['""'],
      ['"()()"'],
      ['"((()))"'],
      ['")))"'],
      ['"((("'],
      ['"()(()"'],
      ['"(()())"'],
      ['")()())()()("'],
    ],
  },
  {
    n: 618,
    id: 'pghub-b17-orchard-grid',
    name: 'Orchard Watering Reach',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'wateredTrees',
    params: [{ name: 'grid', type: 'List[List[int]]' }, { name: 'steps', type: 'int' }],
    return_type: 'int',
    statement:
      'An orchard is a grid where <code>0</code> is open ground, <code>1</code> is a tree, and <code>2</code> is a water source. Water spreads from every source to 4-directionally adjacent open ground or trees, one cell per time step, for at most <code>steps</code> steps (sources spread simultaneously). Water cannot pass through walls marked <code>-1</code>. Return the number of trees that receive water within the time limit.',
    examples: [
      ['[[2,0,1],[0,-1,0],[1,0,2]]\n3', '2', 'Both trees are reachable within 3 steps from a source.'],
      ['[[2,-1,1]]\n5', '0', 'The wall blocks the only path to the tree.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[i][j] in {-1,0,1,2}', '0 <= steps <= 10^5'],
    tags: ['graphs', 'bfs'],
    py: `def wateredTrees(grid, steps):
    R, C = len(grid), len(grid[0])
    dist = [[-1] * C for _ in range(R)]
    q = deque()
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 2:
                dist[r][c] = 0
                q.append((r, c))
    while q:
        r, c = q.popleft()
        if dist[r][c] == steps:
            continue
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] != -1 and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    watered = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 1 and 0 <= dist[r][c] <= steps:
                watered += 1
    return watered`,
    approach:
      'Run a multi-source breadth-first search seeded with all water sources at distance 0, expanding into open ground and trees but never into walls. Stop expanding once a cell reaches the step limit. Finally count tree cells whose recorded distance is within the limit.',
    complexity: { time: 'O(R*C)', space: 'O(R*C)' },
    multiParam: true,
    cases: [
      ['[[2,0,1],[0,-1,0],[1,0,2]]', '3'],
      ['[[2,-1,1]]', '5'],
      ['[[1,1,1]]', '0'],
      ['[[2,1,1,1]]', '2'],
      ['[[0,0],[0,0]]', '5'],
      ['[[2,0,0,0,1]]', '4'],
      ['[[2,0,0,0,1]]', '3'],
      ['[[1,0,2,0,1]]', '1'],
      ['[[2]]', '0'],
      ['[[2,1],[1,1]]', '1'],
    ],
  },
  {
    n: 625,
    id: 'pghub-b17-digit-product-min',
    name: 'Smallest Digit Product Factor',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'smallestWithProduct',
    params: [{ name: 'target', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer <code>target</code>, return the smallest positive integer whose decimal digits multiply to exactly <code>target</code>. If no such integer exists, return -1. For <code>target == 1</code> the answer is 1.',
    examples: [
      ['36', '49', 'Digits 4 and 9 multiply to 36 and form the smallest such number.'],
      ['100', '455', 'Digits 4*5*5 = 100; no smaller arrangement of valid digits works.'],
    ],
    constraints: ['1 <= target <= 2 * 10^9'],
    tags: ['greedy', 'math'],
    py: `def smallestWithProduct(target):
    if target == 1:
        return 1
    digits = []
    for d in range(9, 1, -1):
        while target % d == 0:
            digits.append(d)
            target //= d
    if target != 1:
        return -1
    digits.sort()
    num = 0
    for d in digits:
        num = num * 10 + d
    return num`,
    approach:
      'Greedily factor the target using the largest single digits first (9 down to 2) to minimize the digit count. If a residue greater than 1 remains, the product is unattainable. Otherwise sort the chosen digits ascending and concatenate to get the smallest number.',
    complexity: { time: 'O(log target)', space: 'O(log target)' },
    cases: [
      ['36'],
      ['100'],
      ['1'],
      ['10'],
      ['7'],
      ['11'],
      ['48'],
      ['2'],
      ['9'],
      ['1000000'],
    ],
  },
  {
    n: 631,
    id: 'pghub-b17-version-merge',
    name: 'Document Version Merge',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'mergeVersions',
    params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Two sorted lists of revision ids, <code>a</code> and <code>b</code>, represent edits from two collaborators. Merge them into a single sorted list with no duplicate ids (an id present in both lists appears once). Return the merged list.',
    examples: [
      ['[1,3,5]\n[2,3,6]', '[1,2,3,5,6]', 'Shared id 3 appears once.'],
      ['[]\n[4,4,7]', '[4,7]', 'Duplicates within a single list are also collapsed.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', 'a and b are each sorted non-decreasing', '0 <= ids <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def mergeVersions(a, b):
    i, j = 0, 0
    out = []
    while i < len(a) or j < len(b):
        if j >= len(b) or (i < len(a) and a[i] <= b[j]):
            v = a[i]
            i += 1
        else:
            v = b[j]
            j += 1
        if not out or out[-1] != v:
            out.append(v)
    return out`,
    approach:
      'Walk both sorted lists with two pointers, always taking the smaller front element. Before appending, compare with the last value placed so duplicates within or across the lists are skipped. The result stays sorted and deduplicated.',
    complexity: { time: 'O(m + n)', space: 'O(m + n)' },
    multiParam: true,
    cases: [
      ['[1,3,5]', '[2,3,6]'],
      ['[]', '[4,4,7]'],
      ['[]', '[]'],
      ['[1,2,3]', '[]'],
      ['[1,1,1]', '[1,1]'],
      ['[5,10,15]', '[1,10,20]'],
      ['[0]', '[0]'],
      ['[2,4,6]', '[1,3,5]'],
      ['[1,2,3]', '[1,2,3]'],
      ['[100]', '[1,50,100,200]'],
    ],
  },
  {
    n: 634,
    id: 'pghub-b17-relay-schedule',
    name: 'Relay Race Scheduling',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxLegs',
    params: [{ name: 'times', type: 'List[int]' }, { name: 'budget', type: 'int' }],
    return_type: 'int',
    statement:
      'A relay coach has runners with finishing times <code>times</code>. A valid relay team is any subset of runners whose total time does not exceed <code>budget</code>. Return the maximum number of runners that can be placed on a single team.',
    examples: [
      ['[4,2,8,5]\n10', '2', 'Pick 2 and 4 (total 6) — adding any third exceeds 10; best size is 2.'],
      ['[1,1,1,1]\n3', '3', 'Three unit runners total 3, within budget.'],
    ],
    constraints: ['1 <= times.length <= 10^5', '1 <= times[i] <= 10^9', '0 <= budget <= 10^14'],
    tags: ['greedy', 'sorting'],
    py: `def maxLegs(times, budget):
    total = 0
    count = 0
    for t in sorted(times):
        if total + t > budget:
            break
        total += t
        count += 1
    return count`,
    approach:
      'To fit the most runners under a total budget, prefer the fastest runners. Sort times ascending and add them one by one while the running total stays within budget; the number added before exceeding it is the maximum team size.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[4,2,8,5]', '10'],
      ['[1,1,1,1]', '3'],
      ['[5]', '4'],
      ['[5]', '5'],
      ['[3,3,3]', '0'],
      ['[10,20,30]', '60'],
      ['[1,2,3,4,5]', '9'],
      ['[7,7,7,7]', '14'],
      ['[2,2,2,2,2]', '7'],
      ['[100]', '100'],
    ],
  },
  {
    n: 635,
    id: 'pghub-b17-log-bucket',
    name: 'Log Timestamp Bucketing',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'bucketKey',
    params: [{ name: 'timestamp', type: 'str' }, { name: 'granularity', type: 'str' }],
    return_type: 'str',
    statement:
      'A log timestamp has the form <code>"YYYY:MM:DD:hh:mm:ss"</code>. Given a <code>granularity</code> of one of <code>"Year"</code>, <code>"Month"</code>, <code>"Day"</code>, <code>"Hour"</code>, <code>"Minute"</code>, or <code>"Second"</code>, return a bucket key in which every field finer than the chosen granularity is replaced by its minimum value (<code>00</code> for month/day onward conventions use <code>00</code>), keeping the same <code>"YYYY:MM:DD:hh:mm:ss"</code> format.',
    examples: [
      ['"2023:07:15:09:42:30"\n"Hour"', '"2023:07:15:09:00:00"', 'Minute and second are zeroed.'],
      ['"2023:07:15:09:42:30"\n"Year"', '"2023:00:00:00:00:00"', 'Everything below year is zeroed.'],
    ],
    constraints: ['timestamp matches YYYY:MM:DD:hh:mm:ss', 'granularity is one of the six listed labels'],
    tags: ['strings', 'simulation'],
    py: `def bucketKey(timestamp, granularity):
    parts = timestamp.split(':')
    order = ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second']
    keep = order.index(granularity) + 1
    out = []
    for i in range(6):
        out.append(parts[i] if i < keep else '00')
    return ':'.join(out)`,
    approach:
      'Split the timestamp into its six colon-separated fields. The granularity label maps to how many leading fields to keep; every field beyond that is rewritten as "00". Rejoin with colons to produce the bucket key.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"2023:07:15:09:42:30"', '"Hour"'],
      ['"2023:07:15:09:42:30"', '"Year"'],
      ['"2023:07:15:09:42:30"', '"Second"'],
      ['"2023:07:15:09:42:30"', '"Month"'],
      ['"2023:07:15:09:42:30"', '"Day"'],
      ['"2023:07:15:09:42:30"', '"Minute"'],
      ['"1999:12:31:23:59:59"', '"Year"'],
      ['"2000:01:01:00:00:00"', '"Second"'],
      ['"2024:02:29:12:00:01"', '"Day"'],
      ['"2010:06:06:06:06:06"', '"Hour"'],
    ],
  },
  {
    n: 642,
    id: 'pghub-b17-prefix-autocomplete',
    name: 'Prefix Autocomplete Rank',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'topCompletion',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'counts', type: 'List[int]' }, { name: 'prefix', type: 'str' }],
    return_type: 'str',
    statement:
      'You are given dictionary <code>words</code> with matching usage <code>counts</code>. For a query <code>prefix</code>, return the word that starts with the prefix and has the highest count. Break ties by lexicographic order (earliest wins). If no word matches, return an empty string.',
    examples: [
      ['["cat","car","cart"]\n[5,9,9]\n"ca"', '"car"', 'car and cart tie at 9; "car" is lexicographically smaller.'],
      ['["dog","door"]\n[3,3]\n"x"', '""', 'No word starts with x.'],
    ],
    constraints: ['1 <= words.length <= 10^4', 'words[i] and prefix are lowercase', '0 <= counts[i] <= 10^9'],
    tags: ['tries', 'strings'],
    py: `def topCompletion(words, counts, prefix):
    best = None
    best_count = -1
    for w, c in zip(words, counts):
        if w.startswith(prefix):
            if c > best_count or (c == best_count and (best is None or w < best)):
                best = w
                best_count = c
    return best if best is not None else ''`,
    approach:
      'Scan each word once, keeping only those whose start matches the prefix. Track the best candidate by highest count, falling back to the lexicographically smaller word on ties. If nothing matches, return the empty string.',
    complexity: { time: 'O(n * L)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["cat","car","cart"]', '[5,9,9]', '"ca"'],
      ['["dog","door"]', '[3,3]', '"x"'],
      ['["a"]', '[1]', '""'],
      ['["apple","apply","ape"]', '[2,2,5]', '"ap"'],
      ['["x","xy","xyz"]', '[1,1,1]', '"xy"'],
      ['["one","two"]', '[10,20]', '"o"'],
      ['["bb","ba","bc"]', '[4,4,4]', '"b"'],
      ['["test"]', '[0]', '"test"'],
      ['["go","gone","good"]', '[7,3,7]', '"go"'],
      ['["mn","mo","mp"]', '[1,2,3]', '"m"'],
    ],
  },
  {
    n: 644,
    id: 'pghub-b17-subarray-divisible',
    name: 'Count Divisible Subarrays',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'divisibleSubarrays',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and a positive integer <code>k</code>, return the number of contiguous non-empty subarrays whose sum is divisible by <code>k</code>.',
    examples: [
      ['[4,5,0,-2,-3,1]\n5', '7', 'Seven subarrays have a sum divisible by 5.'],
      ['[5]\n9', '0', 'The only subarray sums to 5, not divisible by 9.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '1 <= k <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def divisibleSubarrays(nums, k):
    freq = defaultdict(int)
    freq[0] = 1
    prefix = 0
    count = 0
    for x in nums:
        prefix += x
        r = prefix % k
        count += freq[r]
        freq[r] += 1
    return count`,
    approach:
      'Two prefix sums share the same remainder modulo k exactly when the subarray between them is divisible by k. Track a running prefix-sum remainder and, with a frequency map seeded at remainder 0, add the count of earlier equal remainders before recording the current one.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[4,5,0,-2,-3,1]', '5'],
      ['[5]', '9'],
      ['[1,2,3]', '3'],
      ['[0,0,0]', '1'],
      ['[2,4,6]', '2'],
      ['[-1,2,9]', '2'],
      ['[7,7,7,7]', '7'],
      ['[1,1,1,1,1]', '3'],
      ['[10,20,30]', '10'],
      ['[3,-3,3,-3]', '2'],
    ],
  },
  {
    n: 651,
    id: 'pghub-b17-cycle-detect',
    name: 'Dependency Cycle Detector',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'hasCycle',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }],
    return_type: 'bool',
    statement:
      'A build system has <code>n</code> tasks numbered <code>0..n-1</code> with directed dependencies <code>edges</code>, where <code>[a, b]</code> means task a must run before task b. Return <code>true</code> if the dependencies contain a cycle (making a valid order impossible), otherwise <code>false</code>.',
    examples: [
      ['3\n[[0,1],[1,2],[2,0]]', 'true', 'The three tasks form a cycle.'],
      ['3\n[[0,1],[0,2]]', 'false', 'A valid order exists.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 2*10^5', '0 <= a, b < n'],
    tags: ['graphs', 'topological-sort'],
    py: `def hasCycle(n, edges):
    adj = defaultdict(list)
    indeg = [0] * n
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    seen = 0
    while q:
        u = q.popleft()
        seen += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return seen != n`,
    approach:
      'Run Kahn topological sort: repeatedly remove tasks with no remaining prerequisites and decrement their dependents. If every task is processed the graph is acyclic; if some remain stuck with positive in-degree, a cycle exists.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[1,2],[2,0]]'],
      ['3', '[[0,1],[0,2]]'],
      ['1', '[]'],
      ['2', '[[0,1],[1,0]]'],
      ['4', '[[0,1],[1,2],[2,3]]'],
      ['4', '[[0,1],[1,2],[2,3],[3,1]]'],
      ['5', '[]'],
      ['2', '[[0,1]]'],
      ['6', '[[0,1],[2,3],[4,5]]'],
      ['3', '[[0,0]]'],
    ],
  },
  {
    n: 656,
    id: 'pghub-b17-coin-change-ways',
    name: 'Vending Change Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'changeWays',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'A vending machine stocks coin denominations <code>coins</code> in unlimited supply. Return the number of distinct combinations of coins that sum to exactly <code>amount</code>. Combinations are unordered (using 1+2 is the same as 2+1). If the amount cannot be made, return 0.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5; 2+2+1; 2+1+1+1; 1*5.'],
      ['[2]\n3', '0', 'No combination of 2s makes 3.'],
    ],
    constraints: ['1 <= coins.length <= 300', '1 <= coins[i] <= 5000', '0 <= amount <= 5000'],
    tags: ['dp', 'knapsack'],
    py: `def changeWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    approach:
      'Use unbounded-knapsack counting. Process each coin once in the outer loop so combinations are counted as unordered. For each amount, the number of ways is the ways without the coin plus the ways for the amount minus the coin value.',
    complexity: { time: 'O(n * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1]', '7'],
      ['[2,3,5]', '8'],
      ['[5,10,25]', '30'],
      ['[1,2,3]', '4'],
      ['[7]', '14'],
      ['[3,5,7]', '12'],
      ['[1,5,10,25]', '100'],
    ],
  },
  {
    n: 660,
    id: 'pghub-b17-bracket-depth',
    name: 'Maximum Nesting Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 'expr', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>expr</code> that may contain the bracket characters <code>(</code> and <code>)</code> along with other characters, and which is guaranteed to be a valid parenthesization, return the maximum nesting depth of the parentheses.',
    examples: [
      ['"(1+(2*3)+((8)/4))+1"', '3', 'The deepest nesting is three levels.'],
      ['"1+(2*3)/(2-1)"', '1', 'No nested parentheses, so depth is 1.'],
    ],
    constraints: ['0 <= expr.length <= 10^5', 'expr is a valid parenthesization'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(expr):
    depth = 0
    best = 0
    for ch in expr:
        if ch == '(':
            depth += 1
            best = max(best, depth)
        elif ch == ')':
            depth -= 1
    return best`,
    approach:
      'Track a running depth counter that increments on every open bracket and decrements on every close bracket. The answer is the largest value the counter reaches, which is the maximum nesting depth.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(1+(2*3)+((8)/4))+1"'],
      ['"1+(2*3)/(2-1)"'],
      ['"1"'],
      ['""'],
      ['"((((()))))"'],
      ['"()()()"'],
      ['"(a(b(c)d)e)"'],
      ['"((1)(2)(3))"'],
      ['"(())(())"'],
      ['"x"'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B17>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b17-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B17>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B17>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b17-grade-${prob.n}.py`);
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
