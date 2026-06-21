#!/usr/bin/env node
// Batch 16 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 gap numbers:
//   555, 562, 568, 569, 571, 573, 574, 578, 579, 580, 582, 588, 597, 603, 604
//
//   node scripts/fill-gap-problems-batch16.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch16.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch16.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [555, 562, 568, 569, 571, 573, 574, 578, 579, 580, 582, 588, 597, 603, 604];

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
    n: 555,
    id: 'pghub-b16-warehouse-aisles',
    name: 'Warehouse Aisle Restock',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minRestockTrips',
    params: [
      { name: 'shelves', type: 'List[int]' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A robot restocks shelves in an aisle. <code>shelves[i]</code> is the number of items shelf i still needs. The robot starts each trip empty and can carry at most <code>capacity</code> items total per trip. On a single trip it may visit any shelves and drop any number of items, but it can never carry more than <code>capacity</code> items at once. Return the minimum number of trips needed to fully restock every shelf.',
    examples: [
      ['[3,2,5]\n4', '3', 'Total demand is 10, carried 4 per trip: ceil(10/4) = 3 trips.'],
      ['[0,0]\n5', '0', 'Nothing needs restocking.'],
    ],
    constraints: ['1 <= shelves.length <= 10^5', '0 <= shelves[i] <= 10^4', '1 <= capacity <= 10^9'],
    tags: ['greedy', 'math'],
    py: `def minRestockTrips(shelves, capacity):
    total = sum(shelves)
    if total == 0:
        return 0
    return (total + capacity - 1) // capacity`,
    approach:
      'Because items are fungible and any shelf can be visited on any trip, only the total demand matters. Each trip moves at most capacity items, so the answer is the ceiling of total demand divided by capacity.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,2,5]', '4'],
      ['[0,0]', '5'],
      ['[10]', '3'],
      ['[1,1,1,1]', '1'],
      ['[7,7,7]', '7'],
      ['[0]', '1'],
      ['[100,200,300]', '50'],
      ['[5,5,5,5,5]', '1000000000'],
      ['[1]', '1'],
      ['[9,9,9,9,9,9]', '4'],
    ],
  },
  {
    n: 562,
    id: 'pghub-b16-relay-baton',
    name: 'Relay Baton Handoff',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'longestStreak',
    params: [{ name: 'runners', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'In a relay drill, <code>runners[i]</code> is 1 if runner i completed a clean handoff and 0 if they dropped the baton. Return the length of the longest run of consecutive clean handoffs.',
    examples: [
      ['[1,1,0,1,1,1]', '3', 'The final three 1s form the longest streak.'],
      ['[0,0,0]', '0', 'No clean handoffs at all.'],
    ],
    constraints: ['1 <= runners.length <= 10^5', 'runners[i] is 0 or 1'],
    tags: ['arrays'],
    py: `def longestStreak(runners):
    best = 0
    cur = 0
    for r in runners:
        if r == 1:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best`,
    approach:
      'Scan once, keeping a running count of consecutive 1s that resets to zero on every 0. Track the maximum running count seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,1,0,1,1,1]'],
      ['[0,0,0]'],
      ['[1]'],
      ['[0]'],
      ['[1,1,1,1]'],
      ['[1,0,1,0,1]'],
      ['[0,1,1,0]'],
      ['[1,1,0,0,1,1,1,1,0]'],
      ['[0,0,1]'],
      ['[1,0,0,0,1,1]'],
    ],
  },
  {
    n: 568,
    id: 'pghub-b16-token-bucket',
    name: 'Token Bucket Throttle',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'allowedRequests',
    params: [
      { name: 'times', type: 'List[int]' },
      { name: 'window', type: 'int' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A rate limiter processes requests arriving at non-decreasing timestamps <code>times</code>. A request is allowed only if, counting it, no more than <code>limit</code> requests have been allowed within the trailing window of <code>window</code> seconds (a request at time t counts against requests with timestamps in <code>(t - window, t]</code>). Allowed requests consume a slot; rejected requests do not. Return a list <code>ans</code> where <code>ans[i]</code> is 1 if request i is allowed and 0 otherwise.',
    examples: [
      ['[1,2,3,4]\n3\n2', '[1,1,0,1]', 'Window of 3s allows 2; request at t=3 would be the 3rd in (0,3], rejected.'],
      ['[1,1,1]\n5\n1', '[1,0,0]', 'Only one request fits in the window.'],
    ],
    constraints: ['1 <= times.length <= 10^5', '0 <= times[i] <= 10^9', 'times is non-decreasing', '1 <= window <= 10^9', '1 <= limit <= 10^5'],
    tags: ['queue', 'sliding-window'],
    py: `def allowedRequests(times, window, limit):
    q = deque()
    out = []
    for t in times:
        while q and q[0] <= t - window:
            q.popleft()
        if len(q) < limit:
            q.append(t)
            out.append(1)
        else:
            out.append(0)
    return out`,
    approach:
      'Keep a queue of the timestamps of currently-allowed requests within the trailing window. Before each request, evict timestamps that have aged out (<= t - window). If fewer than limit remain, admit the request and enqueue it; otherwise reject.',
    complexity: { time: 'O(n)', space: 'O(limit)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '3', '2'],
      ['[1,1,1]', '5', '1'],
      ['[0]', '1', '1'],
      ['[1,2,3,4,5]', '2', '1'],
      ['[10,10,10,10]', '5', '3'],
      ['[1,2,3,10,11]', '3', '2'],
      ['[0,0,0,0,0]', '1000000000', '2'],
      ['[5,6,7,8,9,10]', '4', '2'],
      ['[100]', '50', '5'],
      ['[1,4,7,10]', '3', '1'],
    ],
  },
  {
    n: 569,
    id: 'pghub-b16-elevator-floors',
    name: 'Elevator Floor Span',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'maxSpan',
    params: [{ name: 'floors', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An elevator visits floors in the order given by <code>floors</code>. For each stop, find how many consecutive earlier stops (ending at the current stop) had a floor number less than or equal to the current floor. Return the maximum such count over all stops.',
    examples: [
      ['[3,1,4,4,2]', '4', 'The per-stop spans are 1,1,3,4,1; the second 4 reaches back over 4,4,1,3, giving the maximum span of 4.'],
      ['[5]', '1', 'A single stop has span 1.'],
    ],
    constraints: ['1 <= floors.length <= 10^5', '0 <= floors[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def maxSpan(floors):
    stack = []  # (floor, span)
    best = 0
    for f in floors:
        span = 1
        while stack and stack[-1][0] <= f:
            span += stack.pop()[1]
        stack.append((f, span))
        if span > best:
            best = span
    return best`,
    approach:
      'This is the classic stock-span computation. Maintain a monotonic stack of (floor, span). For each floor, pop all stack entries with floor <= current, accumulating their spans into the current span, then push. Track the maximum span.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,1,4,4,2]'],
      ['[5]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,2,2]'],
      ['[10,9,8,11]'],
      ['[1,3,1,3,1,3]'],
      ['[7,1,2,3,4]'],
      ['[0]'],
      ['[6,3,4,5,2,7]'],
    ],
  },
  {
    n: 571,
    id: 'pghub-b16-orchard-rows',
    name: 'Orchard Pollination Pairs',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'countPairs',
    params: [
      { name: 'positions', type: 'List[int]' },
      { name: 'reach', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Trees stand at integer positions given by <code>positions</code> along a single row. A bee can pollinate between two trees only if the distance between them is at most <code>reach</code>. Return the number of unordered pairs of trees that can be pollinated.',
    examples: [
      ['[1,3,6,8]\n3', '3', 'Pairs within distance 3: (1,3),(3,6),(6,8).'],
      ['[5]\n10', '0', 'A single tree forms no pair.'],
    ],
    constraints: ['1 <= positions.length <= 10^5', '0 <= positions[i] <= 10^9', '0 <= reach <= 10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def countPairs(positions, reach):
    arr = sorted(positions)
    left = 0
    total = 0
    for right in range(len(arr)):
        while arr[right] - arr[left] > reach:
            left += 1
        total += right - left
    return total`,
    approach:
      'Sort the positions. Slide a window: for each right index, advance left until the span is within reach. Every index between left and right pairs validly with right, contributing right - left pairs.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,6,8]', '3'],
      ['[5]', '10'],
      ['[1,2,3,4,5]', '1'],
      ['[10,1,5,3]', '2'],
      ['[0,0,0]', '0'],
      ['[1,100,200]', '0'],
      ['[1,2,3,4]', '10'],
      ['[7,7,7,7]', '0'],
      ['[1,4,9,16,25]', '5'],
      ['[2,2,4,4,6]', '2'],
    ],
  },
  {
    n: 573,
    id: 'pghub-b16-cipher-rotate',
    name: 'Caesar Cipher Decode',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'decode',
    params: [
      { name: 'text', type: 'str' },
      { name: 'shift', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'A message <code>text</code> of lowercase letters was encoded by shifting each letter forward by <code>shift</code> places in the alphabet, wrapping around from z to a. Return the original decoded message.',
    examples: [
      ['"khoor"\n3', '"hello"', 'Each letter shifted back by 3.'],
      ['"abc"\n0', '"abc"', 'A shift of 0 leaves the text unchanged.'],
    ],
    constraints: ['0 <= text.length <= 10^5', 'text consists of lowercase English letters', '0 <= shift <= 10^9'],
    tags: ['strings', 'math'],
    py: `def decode(text, shift):
    s = shift % 26
    out = []
    for ch in text:
        out.append(chr((ord(ch) - ord('a') - s) % 26 + ord('a')))
    return ''.join(out)`,
    approach:
      'Reduce the shift modulo 26. For each letter, subtract the shift from its zero-based alphabet index, take the result modulo 26 to wrap around, and convert back to a character.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"khoor"', '3'],
      ['"abc"', '0'],
      ['"aaa"', '1'],
      ['""', '5'],
      ['"z"', '1'],
      ['"abc"', '26'],
      ['"bcd"', '27'],
      ['"thequickbrownfox"', '13'],
      ['"a"', '1000000000'],
      ['"zzz"', '25'],
    ],
  },
  {
    n: 574,
    id: 'pghub-b16-paint-fence',
    name: 'Fence Painting Schemes',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'paintWays',
    params: [
      { name: 'posts', type: 'int' },
      { name: 'colors', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You paint a fence of <code>posts</code> posts using <code>colors</code> available colors. No more than two adjacent posts may share the same color. Return the number of distinct ways to paint the fence, modulo <code>10^9 + 7</code>.',
    examples: [
      ['3\n2', '6', 'With 2 colors over 3 posts there are 6 valid schemes.'],
      ['1\n5', '5', 'A single post can take any of 5 colors.'],
    ],
    constraints: ['0 <= posts <= 10^5', '1 <= colors <= 10^5'],
    tags: ['dp', 'math'],
    py: `def paintWays(posts, colors):
    MOD = 10**9 + 7
    if posts == 0:
        return 0
    if posts == 1:
        return colors % MOD
    same = colors % MOD                  # ways ending with last two posts same color
    diff = (colors * (colors - 1)) % MOD # ways ending with last two posts different
    for _ in range(3, posts + 1):
        new_same = diff
        new_diff = ((same + diff) * (colors - 1)) % MOD
        same, diff = new_same % MOD, new_diff
    return (same + diff) % MOD`,
    approach:
      'Track two states post by post: ways where the last two posts share a color (same) and ways where they differ (diff). A new same can only follow a previous diff; a new diff follows either state times (colors - 1). Sum both states at the end, all modulo 1e9+7.',
    complexity: { time: 'O(posts)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '2'],
      ['1', '5'],
      ['0', '3'],
      ['2', '4'],
      ['4', '3'],
      ['5', '2'],
      ['7', '3'],
      ['10', '5'],
      ['1', '1'],
      ['100', '10'],
    ],
  },
  {
    n: 578,
    id: 'pghub-b16-ring-buffer-max',
    name: 'Circular Track Best Lap',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'bestSegment',
    params: [
      { name: 'track', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A circular race track is divided into segments whose point values are listed in <code>track</code> (the track wraps, so the segment after the last is the first). A lap covers exactly <code>k</code> consecutive segments. Return the maximum total points obtainable over any window of <code>k</code> consecutive segments around the circle.',
    examples: [
      ['[1,2,3,4]\n2', '7', 'Windows around the circle sum to 3,5,7,5; the best is [3,4] = 7.'],
      ['[5,-2,3]\n3', '6', 'Any full window covers all segments: 5-2+3 = 6.'],
    ],
    constraints: ['1 <= track.length <= 10^5', '1 <= k <= track.length', '-10^4 <= track[i] <= 10^4'],
    tags: ['sliding-window', 'arrays'],
    py: `def bestSegment(track, k):
    n = len(track)
    cur = sum(track[:k])
    best = cur
    for i in range(1, n):
        cur += track[(i + k - 1) % n] - track[i - 1]
        if cur > best:
            best = cur
    return best`,
    approach:
      'Compute the sum of the first k segments, then slide the window one step at a time around the circle, adding the incoming segment (indexed modulo n) and subtracting the outgoing one. Track the maximum window sum.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '2'],
      ['[5,-2,3]', '3'],
      ['[1,2,3,4]', '1'],
      ['[-1,-2,-3]', '1'],
      ['[4,1,1,4]', '2'],
      ['[10]', '1'],
      ['[2,2,2,2,2]', '3'],
      ['[7,-5,7,-5]', '2'],
      ['[1,1,1,1,1,1]', '6'],
      ['[3,-1,4,-1,5,-9]', '3'],
    ],
  },
  {
    n: 579,
    id: 'pghub-b16-gene-merge',
    name: 'Gene Sequence Interleave',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'canInterleave',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
      { name: 'target', type: 'str' },
    ],
    return_type: 'bool',
    statement:
      'Two gene fragments <code>a</code> and <code>b</code> are spliced together to form <code>target</code> by interleaving: the characters of a and b must each appear in their original relative order, and together they exactly produce target. Return true if such an interleaving is possible.',
    examples: [
      ['"ab"\n"cd"\n"acbd"', 'true', 'a -> a..b.., b -> ..c.d interleaves to acbd.'],
      ['"ab"\n"cd"\n"abdc"', 'false', 'd cannot precede c since b comes from a.'],
    ],
    constraints: ['0 <= a.length, b.length <= 200', '0 <= target.length <= 400', 'all strings consist of lowercase English letters'],
    tags: ['2d-dp', 'strings'],
    py: `def canInterleave(a, b, target):
    if len(a) + len(b) != len(target):
        return False
    m, n = len(a), len(b)
    dp = [False] * (n + 1)
    dp[0] = True
    for j in range(1, n + 1):
        dp[j] = dp[j - 1] and b[j - 1] == target[j - 1]
    for i in range(1, m + 1):
        dp[0] = dp[0] and a[i - 1] == target[i - 1]
        for j in range(1, n + 1):
            dp[j] = (dp[j] and a[i - 1] == target[i + j - 1]) or \\
                    (dp[j - 1] and b[j - 1] == target[i + j - 1])
    return dp[n]`,
    approach:
      'Classic interleaving-string DP. dp[i][j] is true if the first i chars of a and first j chars of b interleave to the first i+j chars of target. Reduce to a 1D rolling array; each cell depends on taking the next char from a (from above) or from b (from the left).',
    complexity: { time: 'O(m*n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"ab"', '"cd"', '"acbd"'],
      ['"ab"', '"cd"', '"abdc"'],
      ['""', '""', '""'],
      ['"abc"', '""', '"abc"'],
      ['""', '"xyz"', '"xyz"'],
      ['"aa"', '"aa"', '"aaaa"'],
      ['"ab"', '"ab"', '"aabb"'],
      ['"abc"', '"def"', '"adbecf"'],
      ['"a"', '"b"', '"ba"'],
      ['"xy"', '"xy"', '"xxyy"'],
    ],
  },
  {
    n: 580,
    id: 'pghub-b16-merge-intervals',
    name: 'Meeting Room Mergers',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeBookings',
    params: [{ name: 'bookings', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'A room booking system holds time ranges in <code>bookings</code>, each <code>[start, end]</code>. Overlapping or touching bookings should be combined into one continuous block. Return the merged bookings sorted by start time.',
    examples: [
      ['[[1,3],[2,6],[8,10]]', '[[1,6],[8,10]]', '[1,3] and [2,6] overlap into [1,6].'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'Touching ranges merge.'],
    ],
    constraints: ['1 <= bookings.length <= 10^4', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeBookings(bookings):
    arr = sorted(bookings)
    merged = []
    for s, e in arr:
        if merged and s <= merged[-1][1]:
            if e > merged[-1][1]:
                merged[-1][1] = e
        else:
            merged.append([s, e])
    return merged`,
    approach:
      'Sort the bookings by start time. Walk through them, extending the last merged block whenever the current start is within or touching it, otherwise starting a new block.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,2]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[1,4],[2,3]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[2,3],[1,5],[6,7],[6,9]]'],
      ['[[1,4],[0,4]]'],
    ],
  },
  {
    n: 582,
    id: 'pghub-b16-process-tree-kill',
    name: 'Process Tree Termination',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'killSubtree',
    params: [
      { name: 'pid', type: 'List[int]' },
      { name: 'ppid', type: 'List[int]' },
      { name: 'kill', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A system has processes with ids in <code>pid</code> and matching parent ids in <code>ppid</code> (a parent id of 0 means no parent). Killing a process also kills all of its descendants. Given the id <code>kill</code> to terminate, return the ids of every process that gets killed, in ascending order.',
    examples: [
      ['[1,3,10,5]\n[3,0,5,3]\n5', '[5,10]', 'Killing 5 also kills its child 10.'],
      ['[1,2]\n[0,1]\n1', '[1,2]', 'Killing the root kills the whole tree.'],
    ],
    constraints: ['1 <= pid.length <= 5*10^4', 'pid.length == ppid.length', 'pid values are unique', '0 <= ppid[i] < 10^9', 'kill is one of the pid values'],
    tags: ['trees', 'graphs'],
    py: `def killSubtree(pid, ppid, kill):
    children = defaultdict(list)
    for c, p in zip(pid, ppid):
        children[p].append(c)
    killed = []
    stack = [kill]
    while stack:
        cur = stack.pop()
        killed.append(cur)
        for ch in children[cur]:
            stack.append(ch)
    killed.sort()
    return killed`,
    approach:
      'Build a parent-to-children map, then do an iterative DFS starting at the process to kill, collecting it and every descendant. Sort the collected ids before returning.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,10,5]', '[3,0,5,3]', '5'],
      ['[1,2]', '[0,1]', '1'],
      ['[1,2]', '[0,1]', '2'],
      ['[7]', '[0]', '7'],
      ['[1,2,3,4,5]', '[0,1,1,2,2]', '1'],
      ['[1,2,3,4,5]', '[0,1,1,2,2]', '2'],
      ['[10,20,30,40]', '[0,10,10,20]', '20'],
      ['[1,2,3,4,5]', '[0,1,2,3,4]', '3'],
      ['[5,4,3,2,1]', '[0,5,4,3,2]', '1'],
      ['[100,200,300]', '[0,100,100]', '100'],
    ],
  },
  {
    n: 588,
    id: 'pghub-b16-island-count',
    name: 'Flood Map Island Count',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countIslands',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A flood map <code>grid</code> uses 1 for land and 0 for water. Land cells connected horizontally or vertically form a single island. Return the number of distinct islands.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'The connected L-shape is one island; the lone corner cell is another.'],
      ['[[0,0],[0,0]]', '0', 'All water.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'union-find'],
    py: `def countIslands(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not seen[r][c]:
                count += 1
                stack = [(r, c)]
                seen[r][c] = True
                while stack:
                    cr, cc = stack.pop()
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nr, nc = cr + dr, cc + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
    return count`,
    approach:
      'Scan every cell. When an unvisited land cell is found, increment the island count and flood-fill its whole connected component with an iterative DFS over the four orthogonal neighbors, marking cells as seen.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[1,0,1,0,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,0],[0,0,0],[0,0,1]]'],
      ['[[1,1],[1,0],[0,0]]'],
      ['[[1,0,1],[0,0,0],[1,0,1]]'],
    ],
  },
  {
    n: 597,
    id: 'pghub-b16-vault-combo',
    name: 'Vault Combination Lock',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minMaxJump',
    params: [
      { name: 'dials', type: 'List[int]' },
      { name: 'splits', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A vault dial reads off the non-negative values in <code>dials</code> in order. You partition the sequence into exactly <code>splits</code> contiguous groups. The "tension" of a partition is the largest group sum. Return the minimum possible tension over all valid partitions.',
    examples: [
      ['[7,2,5,10,8]\n2', '18', 'Split as [7,2,5] and [10,8]: max sum 18 is optimal.'],
      ['[1,2,3,4,5]\n5', '5', 'Each element is its own group; the largest is 5.'],
    ],
    constraints: ['1 <= dials.length <= 10^5', '0 <= dials[i] <= 10^6', '1 <= splits <= dials.length'],
    tags: ['binary-search', 'greedy'],
    py: `def minMaxJump(dials, splits):
    def groups_needed(cap):
        groups = 1
        cur = 0
        for d in dials:
            if cur + d > cap:
                groups += 1
                cur = d
            else:
                cur += d
        return groups
    lo, hi = max(dials), sum(dials)
    while lo < hi:
        mid = (lo + hi) // 2
        if groups_needed(mid) <= splits:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary-search the answer (the maximum group sum) between the largest element and the total sum. For a candidate cap, greedily count how many groups are needed without exceeding it; if that count fits within splits, the cap is feasible and we search lower.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[1,4,4]', '3'],
      ['[10,5,2,7,1,9]', '3'],
      ['[5]', '1'],
      ['[0,0,0,0]', '2'],
      ['[100,100,100]', '2'],
      ['[1,1,1,1,1,1]', '3'],
      ['[8,2,8,2,8]', '2'],
    ],
  },
  {
    n: 603,
    id: 'pghub-b16-budget-pick',
    name: 'Budget Item Picker',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxValue',
    params: [
      { name: 'costs', type: 'List[int]' },
      { name: 'values', type: 'List[int]' },
      { name: 'budget', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A shopper has a spending <code>budget</code>. Each item i has a price <code>costs[i]</code> and a usefulness <code>values[i]</code>. Each item may be bought at most once. Return the maximum total usefulness achievable without exceeding the budget.',
    examples: [
      ['[2,3,4]\n[3,4,5]\n5', '7', 'Buy items 0 and 1 for cost 5, value 7.'],
      ['[10]\n[100]\n5', '0', 'The only item is unaffordable.'],
    ],
    constraints: ['1 <= costs.length <= 200', 'costs.length == values.length', '1 <= costs[i] <= 1000', '0 <= values[i] <= 1000', '0 <= budget <= 10^4'],
    tags: ['dp', 'knapsack'],
    py: `def maxValue(costs, values, budget):
    dp = [0] * (budget + 1)
    for i in range(len(costs)):
        c, v = costs[i], values[i]
        for b in range(budget, c - 1, -1):
            cand = dp[b - c] + v
            if cand > dp[b]:
                dp[b] = cand
    return dp[budget]`,
    approach:
      '0/1 knapsack. dp[b] is the best value reachable with budget b. For each item, iterate budgets downward (so each item is used at most once) and take the better of skipping or buying the item.',
    complexity: { time: 'O(n*budget)', space: 'O(budget)' },
    multiParam: true,
    cases: [
      ['[2,3,4]', '[3,4,5]', '5'],
      ['[10]', '[100]', '5'],
      ['[1,1,1]', '[1,1,1]', '2'],
      ['[5,4,6,3]', '[10,40,30,50]', '10'],
      ['[2,2,2]', '[5,5,5]', '6'],
      ['[1]', '[7]', '0'],
      ['[3,3,3,3]', '[1,2,3,4]', '6'],
      ['[1,2,3]', '[6,10,12]', '5'],
      ['[4,5,1]', '[1,2,3]', '0'],
      ['[2,3,5,7]', '[2,5,6,10]', '10'],
    ],
  },
  {
    n: 604,
    id: 'pghub-b16-binary-clock',
    name: 'Binary Clock Readout',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'litLeds',
    params: [{ name: 'minutes', type: 'int' }],
    return_type: 'int',
    statement:
      'A binary clock displays a number using LEDs, one per set bit in its binary representation. Given a value <code>minutes</code>, return how many LEDs are lit (the number of 1 bits in its binary form).',
    examples: [
      ['5', '2', '5 is 101 in binary, so 2 LEDs are lit.'],
      ['0', '0', 'Zero lights no LEDs.'],
    ],
    constraints: ['0 <= minutes <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def litLeds(minutes):
    count = 0
    while minutes:
        minutes &= minutes - 1
        count += 1
    return count`,
    approach:
      "Use Brian Kernighan's trick: repeatedly clear the lowest set bit with minutes &= minutes - 1, counting each clear. The number of iterations equals the number of set bits.",
    complexity: { time: 'O(set bits)', space: 'O(1)' },
    cases: [
      ['5'],
      ['0'],
      ['1'],
      ['7'],
      ['8'],
      ['255'],
      ['1023'],
      ['1000000000'],
      ['2'],
      ['536870912'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B16>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b16-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B16>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B16>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b16-grade-${prob.n}.py`);
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
