#!/usr/bin/env node
// Batch 18 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   663, 666, 681, 683, 694, 776, 800, 1055, 1056, 1057, 1058, 1059, 1060, 1062, 1063
//
//   node scripts/fill-gap-problems-batch18.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch18.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch18.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [663, 666, 681, 683, 694, 776, 800, 1055, 1056, 1057, 1058, 1059, 1060, 1062, 1063];

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
    n: 663,
    id: 'pghub-b18-warehouse-pallets',
    name: 'Warehouse Pallet Split',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'canSplitEqual',
    params: [{ name: 'weights', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'A row of pallets has positive weights given by <code>weights</code>. You want to cut the row at exactly one position between two adjacent pallets so the total weight on the left equals the total weight on the right. Return <code>true</code> if such a cut exists, otherwise <code>false</code>.',
    examples: [
      ['[1,2,3]', 'true', 'Cut after [1,2] gives 3 on each side.'],
      ['[2,2,1]', 'false', 'No single cut balances the two sides.'],
    ],
    constraints: ['2 <= weights.length <= 10^5', '1 <= weights[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def canSplitEqual(weights):
    total = sum(weights)
    if total % 2 != 0:
        return False
    half = total // 2
    running = 0
    for i in range(len(weights) - 1):
        running += weights[i]
        if running == half:
            return True
        if running > half:
            return False
    return False`,
    approach:
      'A balancing cut exists only if the total is even. Scan a running prefix sum and report true the moment it reaches half the total at a position that still leaves at least one pallet on the right. Since weights are positive, once the prefix passes half no later cut can balance.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3]'],
      ['[2,2,1]'],
      ['[5,5]'],
      ['[1,1,1,1]'],
      ['[10,1,1,1,1,1,1,1,1,1,1]'],
      ['[3,1,2]'],
      ['[100,100]'],
      ['[1,2,1]'],
      ['[4,1,1,1,1]'],
      ['[7,3,4]'],
    ],
  },
  {
    n: 666,
    id: 'pghub-b18-elevator-trips',
    name: 'Elevator Trip Planner',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [
      { name: 'people', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Each value in <code>people</code> is a person\'s weight. An elevator carries at most two people per trip and a combined weight of at most <code>limit</code>. Return the minimum number of trips needed to move everyone (each person weighs at most <code>limit</code>).',
    examples: [
      ['[70,50,80,50]\n120', '3', 'Pair 70+50 and 50 alone with 80? Best is 50+70, 50, 80 = 3 trips.'],
      ['[60,60]\n100', '2', 'Their combined weight exceeds the limit, so two trips.'],
    ],
    constraints: ['1 <= people.length <= 5 * 10^4', '1 <= people[i] <= limit <= 3 * 10^4'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(people, limit):
    people = sorted(people)
    i, j = 0, len(people) - 1
    trips = 0
    while i <= j:
        if people[i] + people[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort weights, then greedily pair the lightest remaining person with the heaviest. If together they fit, both ride; otherwise the heaviest rides alone. Either way the heaviest leaves on this trip. Count trips until pointers cross.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[70,50,80,50]', '120'],
      ['[60,60]', '100'],
      ['[100]', '100'],
      ['[1,2,3,4]', '5'],
      ['[5,5,5,5]', '10'],
      ['[3,2,2,1]', '3'],
      ['[10,10,10]', '15'],
      ['[1,1,1,1,1,1]', '2'],
      ['[40,60,90,10]', '100'],
      ['[25,25,25,25,25]', '50'],
    ],
  },
  {
    n: 681,
    id: 'pghub-b18-bracket-repair',
    name: 'Minimum Bracket Repairs',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'minRepairs',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code>. In one repair you may insert a single bracket anywhere in the string. Return the minimum number of insertions needed to make every bracket balanced.',
    examples: [
      ['"())"', '1', 'Insert one ( to get (()) or insert before to balance: 1 insertion.'],
      ['"((("', '3', 'Each open bracket needs a matching close.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists only of ( and )'],
    tags: ['stack', 'greedy'],
    py: `def minRepairs(s):
    open_count = 0
    insertions = 0
    for ch in s:
        if ch == '(':
            open_count += 1
        else:
            if open_count > 0:
                open_count -= 1
            else:
                insertions += 1
    return insertions + open_count`,
    approach:
      'Sweep left to right tracking unmatched open brackets. A close that has no open to pair with needs one inserted open before it. After the sweep, any leftover open brackets each need a matching close. The answer is the sum of both deficits.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"())"'],
      ['"((("'],
      ['""'],
      ['"()"'],
      ['")("'],
      ['"(()"'],
      ['"())("'],
      ['")))((("'],
      ['"(((())))"'],
      ['"()()()"'],
    ],
  },
  {
    n: 683,
    id: 'pghub-b18-orchard-bloom',
    name: 'Orchard First Full Bloom',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'firstBloomDay',
    params: [
      { name: 'bloom', type: 'List[int]' },
      { name: 'gap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> trees in a row. On day <code>bloom[i]</code> the tree at position <code>i+1</code> blooms (the array is a permutation of 1..n giving the day each position blooms). Return the earliest day on which there exist exactly two already-bloomed trees with precisely <code>gap</code> trees still un-bloomed strictly between them. If no such day exists, return -1.',
    examples: [
      ['[1,3,2]\n1', '2', 'On day 2 positions 1 and 3 are bloomed with one un-bloomed tree between them.'],
      ['[1,2,3]\n1', '-1', 'No day leaves exactly one gap between two bloomed trees.'],
    ],
    constraints: ['1 <= n <= 2 * 10^4', 'bloom is a permutation of 1..n', '0 <= gap <= n'],
    tags: ['arrays', 'simulation'],
    py: `def firstBloomDay(bloom, gap):
    n = len(bloom)
    day_pos = [0] * (n + 1)
    for pos, d in enumerate(bloom):
        day_pos[d] = pos + 1
    bloomed = [False] * (n + 2)
    for d in range(1, n + 1):
        p = day_pos[d]
        bloomed[p] = True
        for q in (p - gap - 1, p + gap + 1):
            if 1 <= q <= n and bloomed[q]:
                ok = True
                for mid in range(min(p, q) + 1, max(p, q)):
                    if bloomed[mid]:
                        ok = False
                        break
                if ok:
                    return d
    return -1`,
    approach:
      'Map each day to the position that blooms, then simulate day by day. When a position blooms, check the two candidate partner positions exactly gap+1 away on each side; if a partner is already bloomed and every tree strictly between them is still un-bloomed, that day is the answer.',
    complexity: { time: 'O(n * gap)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,2]', '1'],
      ['[1,2,3]', '1'],
      ['[1,4,3,2]', '2'],
      ['[2,1]', '0'],
      ['[1]', '0'],
      ['[3,1,2]', '0'],
      ['[5,1,4,2,3]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[4,2,1,3]', '0'],
      ['[6,5,4,3,2,1]', '3'],
    ],
  },
  {
    n: 694,
    id: 'pghub-b18-island-shapes',
    name: 'Distinct Island Shapes',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'distinctIslands',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a binary <code>grid</code> where <code>1</code> is land and <code>0</code> is water, an island is a maximal group of 1s connected horizontally or vertically. Two islands have the same shape if one can be translated (not rotated or reflected) onto the other. Return the number of distinct island shapes.',
    examples: [
      ['[[1,1,0],[0,0,0],[1,1,0]]', '1', 'Both islands are the same horizontal domino shape.'],
      ['[[1,0],[0,1]]', '1', 'Two single-cell islands share one shape.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 50', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'hashing'],
    py: `def distinctIslands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = set()
    shapes = set()
    def bfs(sr, sc):
        cells = []
        q = deque([(sr, sc)])
        seen.add((sr, sc))
        while q:
            r, c = q.popleft()
            cells.append((r - sr, c - sc))
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    q.append((nr, nc))
        return tuple(sorted(cells))
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and (r, c) not in seen:
                shapes.add(bfs(r, c))
    return len(shapes)`,
    approach:
      'Flood-fill each island with BFS, recording every land cell as an offset from the island top-left start cell. Sorting those offsets into a tuple yields a translation-invariant signature. The number of distinct signatures is the number of distinct shapes.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,1,0],[0,0,0],[1,1,0]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,1],[1,0]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[1]]'],
      ['[[1,1,1],[1,0,0],[0,0,0]]'],
      ['[[1,0,1],[1,0,1],[1,0,1]]'],
      ['[[1,1,0,1,1],[0,0,0,0,0]]'],
      ['[[1,1],[0,1],[1,1],[1,0]]'],
      ['[[1,1,1,1]]'],
    ],
  },
  {
    n: 776,
    id: 'pghub-b18-toll-roads',
    name: 'Toll Road Cheapest Path',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'minToll',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A country has <code>n</code> cities numbered <code>0..n-1</code> joined by bidirectional toll roads. Each road is <code>[u, v, t]</code> with toll <code>t</code>. The total toll of a trip is the <em>maximum</em> single road toll used along the path (the most expensive road on the route). Return the minimum possible such cost to travel from <code>src</code> to <code>dst</code>, or -1 if unreachable.',
    examples: [
      ['4\n[[0,1,5],[1,3,2],[0,2,1],[2,3,4]]\n0\n3', '4', 'Path 0-2-3 has max toll max(1,4)=4, better than 0-1-3 with max(5,2)=5.'],
      ['2\n[]\n0\n1', '-1', 'No road connects the two cities.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 5 * 10^4', '0 <= u, v < n', '1 <= t <= 10^6', '0 <= src, dst < n'],
    tags: ['graphs', 'dijkstra'],
    py: `def minToll(n, edges, src, dst):
    adj = defaultdict(list)
    for u, v, t in edges:
        adj[u].append((v, t))
        adj[v].append((u, t))
    INF = float('inf')
    best = [INF] * n
    best[src] = 0
    pq = [(0, src)]
    while pq:
        cost, u = heapq.heappop(pq)
        if cost > best[u]:
            continue
        if u == dst:
            return cost
        for v, t in adj[u]:
            nc = max(cost, t)
            if nc < best[v]:
                best[v] = nc
                heapq.heappush(pq, (nc, v))
    return best[dst] if best[dst] != INF else -1`,
    approach:
      'This is a minimax-path (bottleneck) problem. Run a Dijkstra variant where a path\'s cost is the maximum edge weight on it: relax neighbor v with max(current cost, edge toll) instead of a sum. The heap finalizes each city with its minimum bottleneck; return the cost when dst is popped.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,5],[1,3,2],[0,2,1],[2,3,4]]', '0', '3'],
      ['2', '[]', '0', '1'],
      ['1', '[]', '0', '0'],
      ['3', '[[0,1,2],[1,2,2]]', '0', '2'],
      ['3', '[[0,1,10],[0,2,3],[2,1,1]]', '0', '1'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '3'],
      ['5', '[[0,1,7],[1,2,7],[0,2,3],[2,3,2],[3,4,9]]', '0', '4'],
      ['2', '[[0,1,1000000]]', '0', '1'],
      ['4', '[[0,1,4],[1,2,4],[0,3,6],[3,2,6]]', '0', '2'],
      ['6', '[[0,1,1],[2,3,1]]', '0', '3'],
    ],
  },
  {
    n: 800,
    id: 'pghub-b18-color-blend',
    name: 'Nearest Tidy Color',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'nearestTidy',
    params: [{ name: 'color', type: 'str' }],
    return_type: 'str',
    statement:
      'A color is a 7-character hex string like <code>"#a1b2c3"</code>. A color is <em>tidy</em> when each of its three byte pairs has both nibbles equal (e.g. <code>"#aabbcc"</code>). Return the tidy color closest to <code>color</code>, where distance is the sum over the three channels of the squared difference of the byte values. If two tidy colors are equally close in a channel, choose the smaller byte value.',
    examples: [
      ['"#09f166"', '"#0011ee"', 'Each channel snaps to its nearest repeated-nibble byte.'],
      ['"#000000"', '"#000000"', 'Already tidy.'],
    ],
    constraints: ['color.length == 7', 'color[0] == #', 'remaining characters are lowercase hex digits 0-9 a-f'],
    tags: ['strings', 'math'],
    py: `def nearestTidy(color):
    hexd = "0123456789abcdef"
    def best(byte):
        chosen = None
        for d in range(16):
            val = d * 17
            dist = (val - byte) ** 2
            if chosen is None or dist < chosen[0]:
                chosen = (dist, val, d)
        return chosen[2]
    out = "#"
    for k in range(1, 7, 2):
        byte = int(color[k:k+2], 16)
        d = best(byte)
        out += hexd[d] + hexd[d]
    return out`,
    approach:
      'Tidy bytes are exactly the 16 values d*17 for hex digit d (0x00, 0x11, ... 0xff). For each of the three channels, read the byte, pick the tidy byte minimizing squared distance (ties broken toward the smaller value by scanning d ascending), and emit its doubled nibble.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['"#09f166"'],
      ['"#000000"'],
      ['"#ffffff"'],
      ['"#888888"'],
      ['"#7f7f7f"'],
      ['"#123456"'],
      ['"#abcdef"'],
      ['"#080808"'],
      ['"#0a0a0a"'],
      ['"#fedcba"'],
    ],
  },
  {
    n: 1055,
    id: 'pghub-b18-shelf-restock',
    name: 'Shelf Restock Sequence',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minPlacements',
    params: [
      { name: 'target', type: 'str' },
      { name: 'stock', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'You must build the string <code>target</code> on a shelf using copies of the string <code>stock</code>. Each placement lets you stamp a subsequence of <code>stock</code> onto the shelf, appended in order. Return the minimum number of placements needed to spell <code>target</code>, or -1 if it is impossible.',
    examples: [
      ['"abc"\n"abc"', '1', 'A single placement spells the whole target.'],
      ['"aabbcc"\n"abc"', '2', 'Two passes of "abc" cover the doubled letters.'],
    ],
    constraints: ['1 <= target.length <= 10^4', '1 <= stock.length <= 26', 'both consist of lowercase letters'],
    tags: ['greedy', 'two-pointers'],
    py: `def minPlacements(target, stock):
    stock_set = set(stock)
    for ch in target:
        if ch not in stock_set:
            return -1
    placements = 0
    i = 0
    n = len(target)
    while i < n:
        placements += 1
        j = 0
        m = len(stock)
        while i < n and j < m:
            if stock[j] == target[i]:
                i += 1
            j += 1
    return placements`,
    approach:
      'If any target character never appears in stock, it is impossible. Otherwise greedily make one pass over stock per placement, advancing through target whenever a character matches in order. Each placement consumes the longest target prefix that is a subsequence of stock; count placements until target is exhausted.',
    complexity: { time: 'O(len(target) * len(stock))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"abc"', '"abc"'],
      ['"aabbcc"', '"abc"'],
      ['"xyz"', '"abc"'],
      ['"aaa"', '"a"'],
      ['"abcabc"', '"abc"'],
      ['"cba"', '"abc"'],
      ['"a"', '"abc"'],
      ['"acb"', '"abc"'],
      ['"bbbb"', '"ab"'],
      ['"abacabad"', '"abcd"'],
    ],
  },
  {
    n: 1056,
    id: 'pghub-b18-token-bucket',
    name: 'Token Bucket Throttle',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxAccepted',
    params: [
      { name: 'times', type: 'List[int]' },
      { name: 'window', type: 'int' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Requests arrive at the non-decreasing timestamps in <code>times</code>. A throttle accepts a request only if, counting it, at most <code>cap</code> requests have been accepted within any window of <code>window</code> consecutive time units ending at this request (i.e. timestamps in the inclusive range <code>[t - window + 1, t]</code>). Rejected requests are dropped. Return the number of accepted requests.',
    examples: [
      ['[1,1,2,4]\n3\n2', '3', 'First two at t=1 accepted; t=2 would be the 3rd in window so rejected; t=4 accepted.'],
      ['[1,2,3]\n10\n5', '3', 'All fit comfortably under the cap.'],
    ],
    constraints: ['1 <= times.length <= 10^5', 'times is non-decreasing', '1 <= window <= 10^9', '1 <= cap <= 10^5'],
    tags: ['sliding-window', 'queue'],
    py: `def maxAccepted(times, window, cap):
    accepted = deque()
    count = 0
    for t in times:
        while accepted and accepted[0] <= t - window:
            accepted.popleft()
        if len(accepted) < cap:
            accepted.append(t)
            count += 1
    return count`,
    approach:
      'Maintain a queue of the timestamps of currently-accepted requests that still fall inside the rolling window. For each incoming request, evict accepted timestamps that have aged out, then accept it only if fewer than cap remain. Count acceptances.',
    complexity: { time: 'O(n)', space: 'O(cap)' },
    multiParam: true,
    cases: [
      ['[1,1,2,4]', '3', '2'],
      ['[1,2,3]', '10', '5'],
      ['[1,1,1,1]', '2', '1'],
      ['[0,0,0]', '1', '5'],
      ['[1,2,3,4,5]', '2', '1'],
      ['[1,3,5,7]', '3', '1'],
      ['[10,10,10,10,10]', '1', '3'],
      ['[1,2,2,2,3]', '2', '2'],
      ['[5]', '100', '1'],
      ['[1,2,3,4,5,6,7,8]', '4', '2'],
    ],
  },
  {
    n: 1057,
    id: 'pghub-b18-bus-bays',
    name: 'Bus Bay Assignment',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'maxBay',
    params: [{ name: 'arrivals', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Buses arrive at a depot; <code>arrivals[i] = [start, end]</code> means bus i occupies a bay during the half-open interval <code>[start, end)</code>. Bays are numbered from 1 upward. Each arriving bus takes the lowest-numbered free bay. Process buses in order of <code>start</code> (ties broken by <code>end</code>). Return the highest bay number ever used.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '2', 'First two overlap needing bays 1 and 2; the third reuses bay 1.'],
      ['[[1,2],[2,3]]', '1', 'They do not overlap, so one bay suffices.'],
    ],
    constraints: ['1 <= arrivals.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['heap', 'intervals'],
    py: `def maxBay(arrivals):
    buses = sorted(arrivals, key=lambda x: (x[0], x[1]))
    free = [1]
    in_use = []
    next_bay = 2
    max_bay = 0
    for start, end in buses:
        while in_use and in_use[0][0] <= start:
            _, bay = heapq.heappop(in_use)
            heapq.heappush(free, bay)
        if free:
            bay = heapq.heappop(free)
        else:
            bay = next_bay
            next_bay += 1
        max_bay = max(max_bay, bay)
        heapq.heappush(in_use, (end, bay))
    return max_bay`,
    approach:
      'Sort buses by start time. Keep a min-heap of free bay numbers and a min-heap of in-use bays keyed by release time. Before each bus, release bays whose end has passed back into the free pool. Assign the smallest free bay (or a fresh number), and track the maximum bay number assigned.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[1,2],[2,3]]'],
      ['[[0,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[1,3],[2,4],[3,5],[4,6]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,10],[2,3],[4,5],[6,7]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[1,100],[2,3],[3,4],[4,5],[5,6]]'],
      ['[[10,20],[10,20],[10,20],[10,20]]'],
    ],
  },
  {
    n: 1058,
    id: 'pghub-b18-relay-batons',
    name: 'Relay Baton Handoffs',
    topic_id: 'linkedlist',
    difficulty: 'Easy',
    method_name: 'reorderRelay',
    params: [{ name: 'runners', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A relay team is listed in <code>runners</code> as a sequence of runner ids. To balance the handoffs, reorder the team so the result alternates: first runner, last runner, second runner, second-to-last runner, and so on, weaving inward from both ends. Return the reordered list.',
    examples: [
      ['[1,2,3,4]', '[1,4,2,3]', 'Weave front and back inward.'],
      ['[1,2,3,4,5]', '[1,5,2,4,3]', 'The middle runner lands last.'],
    ],
    constraints: ['1 <= runners.length <= 10^4', '1 <= runners[i] <= 10^6'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def reorderRelay(runners):
    i, j = 0, len(runners) - 1
    out = []
    while i < j:
        out.append(runners[i])
        out.append(runners[j])
        i += 1
        j -= 1
    if i == j:
        out.append(runners[i])
    return out`,
    approach:
      'Use two pointers from the front and back, appending the front element then the back element each step, moving inward. When the pointers meet on a single middle element, append it once. This produces the inward-weaving order.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4]'],
      ['[1,2,3,4,5]'],
      ['[1]'],
      ['[1,2]'],
      ['[5,4,3,2,1]'],
      ['[10,20,30]'],
      ['[1,1,1,1]'],
      ['[7,8,9,10,11,12]'],
      ['[2,4,6,8,10,12,14]'],
      ['[100,200]'],
    ],
  },
  {
    n: 1059,
    id: 'pghub-b18-vault-dial',
    name: 'Vault Dial Reachability',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'minTurns',
    params: [
      { name: 'jammed', type: 'List[str]' },
      { name: 'target', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'A vault has a 4-wheel dial, each wheel showing a digit 0-9 that wraps around (9 and 0 are adjacent). One turn moves a single wheel up or down by one. Starting from <code>"0000"</code>, return the minimum number of turns to reach <code>target</code> without the dial ever showing any code in <code>jammed</code>. Return -1 if impossible.',
    examples: [
      ['["0201","0101","0102","1212","2002"]\n"0202"', '6', 'A shortest safe route needs six turns.'],
      ['["8888"]\n"0009"', '1', 'Turn the last wheel down from 0 to 9.'],
    ],
    constraints: ['0 <= jammed.length <= 500', 'each code is 4 digits', 'target is 4 digits'],
    tags: ['graphs', 'bfs'],
    py: `def minTurns(jammed, target):
    dead = set(jammed)
    if "0000" in dead:
        return -1
    if target == "0000":
        return 0
    visited = {"0000"}
    q = deque([("0000", 0)])
    while q:
        state, steps = q.popleft()
        for i in range(4):
            d = int(state[i])
            for nd in ((d + 1) % 10, (d - 1) % 10):
                nxt = state[:i] + str(nd) + state[i+1:]
                if nxt == target:
                    return steps + 1
                if nxt not in dead and nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, steps + 1))
    return -1`,
    approach:
      'Model each 4-digit code as a node; an edge connects codes differing by one wrapped step on a single wheel. BFS from "0000" gives the fewest turns to target. Skip jammed codes entirely; if the start or target is unreachable, return -1.',
    complexity: { time: 'O(10^4)', space: 'O(10^4)' },
    multiParam: true,
    cases: [
      ['["0201","0101","0102","1212","2002"]', '"0202"'],
      ['["8888"]', '"0009"'],
      ['[]', '"0000"'],
      ['["0000"]', '"8888"'],
      ['[]', '"1111"'],
      ['["1111"]', '"1111"'],
      ['["0001","0010","0100","1000"]', '"0001"'],
      ['[]', '"9999"'],
      ['["0009","0090","0900","9000","0099"]', '"0099"'],
      ['[]', '"5550"'],
    ],
  },
  {
    n: 1060,
    id: 'pghub-b18-missing-meter',
    name: 'Missing Meter Reading',
    topic_id: 'binary-search',
    difficulty: 'Easy',
    method_name: 'kthMissing',
    params: [
      { name: 'readings', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A meter logs strictly increasing positive readings in <code>readings</code>, but some readings were lost. Considering the gaps in the sequence relative to a perfect 1,2,3,... count starting at <code>readings[0]</code>, return the value of the <code>k</code>-th missing reading (1-indexed). It is guaranteed to exist.',
    examples: [
      ['[2,3,4,7,11]\n5', '9', 'Missing values are 5,6,8,9,10; the 5th is 9.'],
      ['[1,2,3,4]\n2', '6', 'Missing values continue 5,6,7,...; the 2nd is 6.'],
    ],
    constraints: ['1 <= readings.length <= 10^5', '1 <= readings[i] <= 10^7', 'readings is strictly increasing', '1 <= k <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def kthMissing(readings, k):
    base = readings[0]
    lo, hi = 0, len(readings)
    while lo < hi:
        mid = (lo + hi) // 2
        missing_before = readings[mid] - base - mid
        if missing_before < k:
            lo = mid + 1
        else:
            hi = mid
    return base + (lo - 1) + k`,
    approach:
      'Relative to a perfect run starting at readings[0], index i should hold base+i, so the number of missing values before index i is readings[i]-base-i. Binary-search the first index where that count reaches k, then the answer is base plus (that count of present values to the left) plus k.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,3,4,7,11]', '5'],
      ['[1,2,3,4]', '2'],
      ['[1]', '1'],
      ['[1]', '5'],
      ['[5,6,7,8,9]', '3'],
      ['[10,20]', '4'],
      ['[1,3,5,7,9]', '1'],
      ['[1,3,5,7,9]', '4'],
      ['[100,200,300]', '50'],
      ['[2,4]', '1'],
    ],
  },
  {
    n: 1062,
    id: 'pghub-b18-stamp-folds',
    name: 'Repeated Stamp Folds',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'longestRepeatLen',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A printing run produced the string <code>s</code>. A <em>stamp echo</em> is a substring that occurs at least twice in <code>s</code>, where the two occurrences may overlap. Return the length of the longest stamp echo, or 0 if no substring repeats.',
    examples: [
      ['"banana"', '3', '"ana" appears twice (overlapping).'],
      ['"abcd"', '0', 'No substring repeats.'],
    ],
    constraints: ['1 <= s.length <= 2000', 's consists of lowercase letters'],
    tags: ['dp', 'strings'],
    py: `def longestRepeatLen(s):
    n = len(s)
    # dp[i][j] = length of longest common suffix of s[:i] and s[:j], i < j
    prev = [0] * (n + 1)
    best = 0
    for i in range(1, n + 1):
        cur = [0] * (n + 1)
        for j in range(i + 1, n + 1):
            if s[i-1] == s[j-1]:
                cur[j] = prev[j-1] + 1
                if cur[j] > best:
                    best = cur[j]
        prev = cur
    return best`,
    approach:
      'Use the longest-common-substring DP between the string and itself, restricted to pairs of positions i<j so a substring is matched against a later occurrence (overlap allowed). dp[i][j] extends the common suffix when characters match; the maximum value is the longest repeated substring length.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['"banana"'],
      ['"abcd"'],
      ['"aaaa"'],
      ['"abcabc"'],
      ['"a"'],
      ['"mississippi"'],
      ['"abab"'],
      ['"xyzxyzx"'],
      ['"abacabad"'],
      ['"zzzazzz"'],
    ],
  },
  {
    n: 1063,
    id: 'pghub-b18-paint-fences',
    name: 'Paint Fences No Triple',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'paintWays',
    params: [
      { name: 'posts', type: 'int' },
      { name: 'colors', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You paint a row of <code>posts</code> fence posts using <code>colors</code> available colors. No three or more consecutive posts may share the same color (two in a row is allowed). Return the number of valid ways to paint all posts, modulo <code>1000000007</code>.',
    examples: [
      ['3\n2', '6', 'With 2 colors and 3 posts, 6 colorings avoid a monochrome triple.'],
      ['1\n5', '5', 'A single post can be any of the 5 colors.'],
    ],
    constraints: ['1 <= posts <= 10^6', '1 <= colors <= 10^6'],
    tags: ['dp', 'math'],
    py: `def paintWays(posts, colors):
    MOD = 1000000007
    if posts == 1:
        return colors % MOD
    # same: ways ending with last two posts same color
    # diff: ways ending with last two posts different colors
    same = colors % MOD
    diff = (colors * (colors - 1)) % MOD
    for _ in range(3, posts + 1):
        new_same = diff
        new_diff = ((same + diff) * (colors - 1)) % MOD
        same, diff = new_same % MOD, new_diff
    return (same + diff) % MOD`,
    approach:
      'Track two states per post: the number of colorings where the last two posts share a color (same) versus differ (diff). A new post matching the previous one is only allowed if the previous pair differed, so new_same = diff; a differing new post can follow either state in (colors-1) ways. Sum both states at the end, all modulo 1e9+7.',
    complexity: { time: 'O(posts)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '2'],
      ['1', '5'],
      ['2', '4'],
      ['4', '3'],
      ['1', '1'],
      ['5', '2'],
      ['10', '3'],
      ['2', '1'],
      ['7', '5'],
      ['100', '4'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B18>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b18-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B18>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B18>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b18-grade-${prob.n}.py`);
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
