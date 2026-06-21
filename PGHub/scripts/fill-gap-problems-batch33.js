#!/usr/bin/env node
// Batch 33 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2173,2174,2175,2184,2189,2198,2199,2204,2205,2214,2219,2228,2229,2230,2237
//
//   node scripts/fill-gap-problems-batch33.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch33.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch33.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2173, 2174, 2175, 2184, 2189, 2198, 2199, 2204, 2205, 2214, 2219, 2228, 2229, 2230, 2237];

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
    n: 2173,
    id: 'pghub-b33-locker-toggle',
    name: 'Locker Hall Toggles',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'openLockers',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A hall has <code>n</code> lockers numbered <code>1</code> to <code>n</code>, all starting closed. Student <code>i</code> (for <code>i</code> from <code>1</code> to <code>n</code>) toggles every locker whose number is a multiple of <code>i</code>. After all <code>n</code> students have walked the hall, return how many lockers remain open.',
    examples: [
      ['3', '1', 'Locker 1 ends open; lockers 2 and 3 end closed.'],
      ['10', '3', 'Lockers 1, 4, and 9 (the perfect squares) stay open.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math', 'number-theory'],
    py: `def openLockers(n):
    return int(math.isqrt(n))`,
    approach:
      'A locker is toggled once per divisor of its number, ending open only if it has an odd number of divisors. Only perfect squares have an odd divisor count, so the answer is the count of perfect squares in [1, n], which is floor(sqrt(n)).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['3'],
      ['10'],
      ['0'],
      ['1'],
      ['2'],
      ['100'],
      ['99'],
      ['1000000000'],
      ['16'],
      ['17'],
    ],
  },
  {
    n: 2174,
    id: 'pghub-b33-cafeteria-queue',
    name: 'Cafeteria Tray Stack',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'finalTrays',
    params: [{ name: 'ops', type: 'List[str]' }],
    return_type: 'List[int]',
    statement:
      'A spring-loaded tray dispenser behaves like a stack. You process a list of operations <code>ops</code>: <code>"push X"</code> places tray with id <code>X</code> on top, and <code>"pop"</code> removes the top tray (a <code>"pop"</code> on an empty dispenser is ignored). Return the list of tray ids from bottom to top after all operations.',
    examples: [
      ['["push 1","push 2","pop","push 3"]', '[1,3]', 'Push 1, push 2, pop removes 2, push 3 leaves 1 then 3.'],
      ['["pop","push 5"]', '[5]', 'The first pop on an empty stack is ignored, then 5 is pushed.'],
    ],
    constraints: ['0 <= ops.length <= 10^4', 'each op is "pop" or "push X" where X is an integer'],
    tags: ['stack', 'simulation'],
    py: `def finalTrays(ops):
    stack = []
    for op in ops:
        if op == 'pop':
            if stack:
                stack.pop()
        else:
            _, x = op.split()
            stack.append(int(x))
    return stack`,
    approach:
      'Maintain a list acting as a stack. Parse each operation: push appends the parsed integer, pop removes the top only when the stack is non-empty. The final list, read left to right, is bottom to top.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["push 1","push 2","pop","push 3"]'],
      ['["pop","push 5"]'],
      ['[]'],
      ['["pop","pop","pop"]'],
      ['["push 7"]'],
      ['["push 1","push 2","push 3","pop","pop"]'],
      ['["push -4","push 10","pop","push 0"]'],
      ['["push 100","pop","pop","push 200"]'],
      ['["push 1","push 1","push 1"]'],
      ['["push 9","push 8","pop","push 7","pop","pop"]'],
    ],
  },
  {
    n: 2175,
    id: 'pghub-b33-elevator-loads',
    name: 'Elevator Load Windows',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxLoad',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People board an elevator in the order given by <code>weights</code>. The elevator carries exactly <code>k</code> consecutive people per trip. Return the maximum total weight carried in any single trip, i.e. the largest sum among all contiguous windows of length <code>k</code>. If fewer than <code>k</code> people exist, return <code>0</code>.',
    examples: [
      ['[2,1,5,1,3,2]\n3', '9', 'The window [5,1,3] sums to 9, the largest of any 3-person trip.'],
      ['[4,4]\n3', '0', 'There are not enough people to fill a trip of size 3.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= k <= 10^5', '0 <= weights[i] <= 10^4'],
    tags: ['sliding-window', 'arrays'],
    py: `def maxLoad(weights, k):
    n = len(weights)
    if k > n:
        return 0
    cur = sum(weights[:k])
    best = cur
    for i in range(k, n):
        cur += weights[i] - weights[i - k]
        if cur > best:
            best = cur
    return best`,
    approach:
      'Compute the sum of the first window of length k, then slide it across the array by adding the entering element and subtracting the leaving element. Track the maximum window sum seen. Guard the case where k exceeds the count of people.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,5,1,3,2]', '3'],
      ['[4,4]', '3'],
      ['[1]', '1'],
      ['[5,5,5,5]', '2'],
      ['[0,0,0,0]', '2'],
      ['[10,1,1,1,10]', '1'],
      ['[3,2,1,4,5,6]', '6'],
      ['[100]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[7,8,9,1,2,3]', '2'],
    ],
  },
  {
    n: 2184,
    id: 'pghub-b33-treasure-grid',
    name: 'Treasure Grid Paths',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'maxTreasure',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'You stand at the top-left cell of a grid of coin values and want to reach the bottom-right cell, moving only right or down. <code>grid[r][c]</code> is the number of coins collected when stepping on that cell (values may be negative, representing traps). Return the maximum total coins collectible along any valid path, including the start and end cells.',
    examples: [
      ['[[1,3,1],[1,5,1],[4,2,1]]', '12', 'Path 1->3->5->2->1 down the middle collects 12 coins.'],
      ['[[5]]', '5', 'A single cell grid yields its own value.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '-1000 <= grid[r][c] <= 1000'],
    tags: ['2d-dp', 'dp'],
    py: `def maxTreasure(grid):
    rows = len(grid)
    cols = len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            best = 0
            if r == 0 and c == 0:
                dp[r][c] = grid[r][c]
                continue
            options = []
            if r > 0:
                options.append(dp[r - 1][c])
            if c > 0:
                options.append(dp[r][c - 1])
            dp[r][c] = grid[r][c] + max(options)
    return dp[rows - 1][cols - 1]`,
    approach:
      'Classic grid DP: dp[r][c] holds the best coin total reaching that cell. Each cell is reachable from above or from the left, so take the larger predecessor and add the current cell value. The answer sits in the bottom-right cell.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,3,1],[1,5,1],[4,2,1]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[2,-5,1],[3,2,-1],[1,1,4]]'],
      ['[[10,10],[10,-100]]'],
      ['[[1,1,1,1],[1,1,1,1]]'],
      ['[[5,-3,2,1],[-2,4,-1,3],[1,2,3,-4]]'],
    ],
  },
  {
    n: 2189,
    id: 'pghub-b33-radio-frequencies',
    name: 'Radio Channel XOR',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'lostChannel',
    params: [{ name: 'channels', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A radio scanner should report every channel from <code>0</code> to <code>n</code>, but the list <code>channels</code> contains only <code>n</code> distinct numbers from that range, so exactly one channel is missing. Return the missing channel number.',
    examples: [
      ['[0,1,3]', '2', 'The range is 0..3 and 2 is absent.'],
      ['[1]', '0', 'The range is 0..1 and 0 is absent.'],
    ],
    constraints: ['1 <= channels.length <= 10^5', '0 <= channels[i] <= channels.length', 'all values distinct'],
    tags: ['bit-manipulation', 'math'],
    py: `def lostChannel(channels):
    x = len(channels)
    for i, v in enumerate(channels):
        x ^= i ^ v
    return x`,
    approach:
      'XOR all indices 0..n together with all values in the list. Every present number cancels with its index pairing, and the leftover is the missing number. Seeding with n accounts for the extra index of the full range.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,1,3]'],
      ['[1]'],
      ['[0]'],
      ['[3,0,1]'],
      ['[0,1,2,3,4,5,6,7,9]'],
      ['[9,8,7,6,5,4,3,2,1]'],
      ['[2,3,0,4]'],
      ['[5,4,3,2,1]'],
      ['[0,2]'],
      ['[10,0,1,2,3,4,5,6,7,8]'],
    ],
  },
  {
    n: 2198,
    id: 'pghub-b33-tournament-bracket',
    name: 'Knockout Tournament Rounds',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'totalMatches',
    params: [{ name: 'players', type: 'int' }],
    return_type: 'int',
    statement:
      'A single-elimination tournament starts with <code>players</code> competitors. In each round, players are paired off; if the count is odd, one player gets a bye (advances without playing). Every match eliminates exactly one player, and the tournament ends when one champion remains. Return the total number of matches played.',
    examples: [
      ['7', '6', 'Seven players must lose six matches to leave one champion.'],
      ['1', '0', 'A lone player is already the champion; no matches occur.'],
    ],
    constraints: ['1 <= players <= 10^9'],
    tags: ['math', 'simulation'],
    py: `def totalMatches(players):
    return players - 1`,
    approach:
      'Each match removes exactly one player, and the tournament ends with a single champion. Reaching one player from p players requires eliminating p-1 players, hence p-1 matches regardless of how byes are distributed.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['7'],
      ['1'],
      ['2'],
      ['8'],
      ['16'],
      ['100'],
      ['3'],
      ['1000000000'],
      ['5'],
      ['64'],
    ],
  },
  {
    n: 2199,
    id: 'pghub-b33-garden-watering',
    name: 'Garden Watering Reach',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minTaps',
    params: [
      { name: 'length', type: 'int' },
      { name: 'ranges', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A garden is a line from position <code>0</code> to position <code>length</code>. There is a tap at every integer position <code>0..length</code>; tap <code>i</code> waters the closed interval <code>[i - ranges[i], i + ranges[i]]</code>. Return the minimum number of taps to open so the whole garden is watered, or <code>-1</code> if it is impossible.',
    examples: [
      ['5\n[3,4,1,1,0,0]', '1', 'The tap at position 1 with range 4 covers [-3,5], watering the whole garden.'],
      ['3\n[0,0,0,0]', '-1', 'No tap reaches its neighbors, so gaps remain.'],
    ],
    constraints: ['1 <= length <= 10^4', 'ranges.length == length + 1', '0 <= ranges[i] <= 100'],
    tags: ['intervals', 'greedy'],
    py: `def minTaps(length, ranges):
    max_reach = [0] * (length + 1)
    for i, r in enumerate(ranges):
        left = max(0, i - r)
        right = min(length, i + r)
        if right > max_reach[left]:
            max_reach[left] = right
    taps = 0
    cur_end = 0
    farthest = 0
    i = 0
    while cur_end < length:
        while i <= cur_end:
            if max_reach[i] > farthest:
                farthest = max_reach[i]
            i += 1
        if farthest <= cur_end:
            return -1
        taps += 1
        cur_end = farthest
    return taps`,
    approach:
      'Convert each tap into the interval it covers and, for each left endpoint, record the farthest right reach. This reduces to a jump-game: greedily extend coverage in layers, counting a tap each time the current reach is exhausted. If coverage cannot grow, the garden is unwaterable.',
    complexity: { time: 'O(length)', space: 'O(length)' },
    multiParam: true,
    cases: [
      ['5', '[3,4,1,1,0,0]'],
      ['3', '[0,0,0,0]'],
      ['1', '[1,0]'],
      ['7', '[1,2,1,0,2,1,0,1]'],
      ['8', '[4,0,0,0,0,0,0,0,4]'],
      ['2', '[1,1,1]'],
      ['5', '[0,0,0,0,0,0]'],
      ['9', '[0,5,0,0,0,0,0,0,0,0]'],
      ['4', '[1,1,1,1,1]'],
      ['6', '[2,1,1,2,1,1,1]'],
    ],
  },
  {
    n: 2204,
    id: 'pghub-b33-relay-friends',
    name: 'Friendship Circles Count',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countCircles',
    params: [{ name: 'friends', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'There are <code>n</code> students whose mutual friendships form a symmetric matrix <code>friends</code> of size <code>n x n</code>; <code>friends[i][j] = 1</code> means students <code>i</code> and <code>j</code> are direct friends (and <code>friends[i][i] = 1</code>). Friendship is transitive: if A knows B and B knows C, all three share a circle. Return the number of distinct friendship circles.',
    examples: [
      ['[[1,1,0],[1,1,0],[0,0,1]]', '2', 'Students 0 and 1 form one circle; student 2 forms another.'],
      ['[[1,0],[0,1]]', '2', 'Neither student knows the other, giving two separate circles.'],
    ],
    constraints: ['1 <= n <= 200', 'friends[i][j] is 0 or 1', 'friends[i][j] == friends[j][i]', 'friends[i][i] == 1'],
    tags: ['graphs', 'union-find'],
    py: `def countCircles(friends):
    n = len(friends)
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
    for i in range(n):
        for j in range(i + 1, n):
            if friends[i][j] == 1:
                union(i, j)
    return len({find(i) for i in range(n)})`,
    approach:
      'Model students as nodes and friendships as edges; a circle is a connected component. Use union-find with path compression to merge directly connected students, then count the number of distinct set roots.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['[[1,1,0],[1,1,0],[0,0,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[1,0,0,1],[0,1,1,0],[0,1,1,0],[1,0,0,1]]'],
      ['[[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]]'],
      ['[[1,0,0],[0,1,0],[0,0,1]]'],
      ['[[1,1,0,0,0],[1,1,1,0,0],[0,1,1,0,0],[0,0,0,1,1],[0,0,0,1,1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0,1,0],[0,1,0,1],[1,0,1,0],[0,1,0,1]]'],
    ],
  },
  {
    n: 2205,
    id: 'pghub-b33-printer-jobs',
    name: 'Priority Printer Queue',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'printOrder',
    params: [{ name: 'jobs', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'A printer holds jobs each given as <code>[id, priority]</code>. It always prints the job with the highest priority next; ties are broken by the smaller id. Return the list of job ids in the order they are printed.',
    examples: [
      ['[[1,3],[2,5],[3,5]]', '[2,3,1]', 'Both jobs 2 and 3 have priority 5, so the smaller id 2 prints first, then 3, then job 1.'],
      ['[[7,1]]', '[7]', 'A single job prints by itself.'],
    ],
    constraints: ['1 <= jobs.length <= 10^5', '0 <= id <= 10^9', '0 <= priority <= 10^9', 'ids are distinct'],
    tags: ['heap', 'sorting'],
    py: `def printOrder(jobs):
    heap = [(-p, jid) for jid, p in jobs]
    heapq.heapify(heap)
    order = []
    while heap:
        _, jid = heapq.heappop(heap)
        order.append(jid)
    return order`,
    approach:
      'Push every job into a min-heap keyed by negated priority then id, so the highest priority (and on ties, the smallest id) surfaces first. Pop repeatedly to produce the print order.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,5],[3,5]]'],
      ['[[7,1]]'],
      ['[[1,1],[2,2],[3,3]]'],
      ['[[5,9],[4,9],[3,9]]'],
      ['[[10,0],[20,0],[30,0]]'],
      ['[[1,100],[2,50],[3,75]]'],
      ['[[9,2],[8,2],[7,3],[6,1]]'],
      ['[[100,5]]'],
      ['[[1,5],[2,5],[3,4],[4,4],[5,6]]'],
      ['[[3,3],[1,3],[2,3]]'],
    ],
  },
  {
    n: 2214,
    id: 'pghub-b33-mountain-peak',
    name: 'Mountain Peak Index',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'peakIndex',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A mountain array <code>heights</code> strictly increases to a single peak and then strictly decreases. Return the index of the peak element. The array always has at least three elements and exactly one peak.',
    examples: [
      ['[1,3,5,4,2]', '2', 'The peak value 5 is at index 2.'],
      ['[0,10,1]', '1', 'The peak value 10 is at index 1.'],
    ],
    constraints: ['3 <= heights.length <= 10^5', '0 <= heights[i] <= 10^9', 'forms a valid mountain'],
    tags: ['binary-search', 'arrays'],
    py: `def peakIndex(heights):
    lo, hi = 0, len(heights) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if heights[mid] < heights[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    approach:
      'Binary search on the slope: if the midpoint is still ascending (heights[mid] < heights[mid+1]) the peak lies to the right, otherwise it is at mid or to the left. Narrowing the bounds converges on the peak index in logarithmic time.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[1,3,5,4,2]'],
      ['[0,10,1]'],
      ['[1,2,3,4,5,3]'],
      ['[3,6,5,4,3,2,1]'],
      ['[1,2,1]'],
      ['[0,1,2,3,4,5,4]'],
      ['[10,20,30,40,50,1]'],
      ['[1,100,99,98,97]'],
      ['[2,4,6,8,10,12,11]'],
      ['[1,5,9,8,7,6,5,4,3]'],
    ],
  },
  {
    n: 2219,
    id: 'pghub-b33-string-compress',
    name: 'Run-Length Compress',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'compress',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Compress a string <code>s</code> by replacing each maximal run of one repeated character with that character followed by the run length, but only when doing so makes the run shorter or equal. A run of length <code>1</code> is written as just the character (no count). Return the compressed string.',
    examples: [
      ['aaabbc', 'a3b2c', 'Three a become a3, two b become b2, single c stays c.'],
      ['abc', 'abc', 'No character repeats, so nothing is compressed.'],
    ],
    constraints: ['0 <= s.length <= 10^4', 's consists of lowercase English letters'],
    tags: ['two-pointers', 'strings'],
    py: `def compress(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        count = j - i
        out.append(s[i])
        if count > 1:
            out.append(str(count))
        i = j
    return ''.join(out)`,
    approach:
      'Use two pointers to find each maximal run: i marks the run start and j advances over equal characters. Append the character, and append the run length only when it exceeds one. Move i to j and repeat to the end of the string.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'aaabbc'"],
      ["'abc'"],
      ["''"],
      ["'a'"],
      ["'aaaaaaaaaa'"],
      ["'aabbaabb'"],
      ["'zzzzz'"],
      ["'abcabcabc'"],
      ["'aaabbbcccddd'"],
      ["'pqqrrr'"],
    ],
  },
  {
    n: 2228,
    id: 'pghub-b33-coin-change-ways',
    name: 'Coin Combination Count',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an unlimited supply of coins with the denominations in <code>coins</code>, return the number of distinct combinations that sum to exactly <code>amount</code>. Two combinations are different only if they use a different multiset of coins; order does not matter.',
    examples: [
      ['[1,2,5]\n5', '4', 'The combinations are 5, 1+2+2, 1+1+1+2, and 1+1+1+1+1.'],
      ['[2]\n3', '0', 'No combination of 2-value coins sums to 3.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 5000', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    approach:
      'Unbounded knapsack counting. dp[a] is the number of ways to make amount a. Iterate coin denominations in the outer loop so each combination is counted once regardless of order; for each coin, add the ways to form a-c into dp[a].',
    complexity: { time: 'O(coins*amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[2,3,7]', '12'],
      ['[1]', '100'],
      ['[3,5]', '8'],
      ['[1,5,10,25]', '50'],
      ['[7,11]', '5'],
    ],
  },
  {
    n: 2229,
    id: 'pghub-b33-word-prefixes',
    name: 'Prefix Word Counter',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'countPrefixes',
    params: [
      { name: 'words', type: 'List[str]' },
      { name: 'queries', type: 'List[str]' },
    ],
    return_type: 'List[int]',
    statement:
      'You are given a dictionary <code>words</code> and a list of <code>queries</code>. For each query string, return how many words in the dictionary start with that query as a prefix. Return the answers in the same order as the queries.',
    examples: [
      ['["apple","app","apricot","banana"]\n["app","ban","x"]', '[2,1,0]', 'Two words start with "app", one with "ban", none with "x".'],
      ['["cat"]\n["cat","ca"]', '[1,1]', 'The single word "cat" matches both prefixes.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= queries.length <= 10^4', 'strings are lowercase, length 1..20'],
    tags: ['tries', 'strings'],
    py: `def countPrefixes(words, queries):
    root = {}
    for w in words:
        node = root
        for ch in w:
            if ch not in node:
                node[ch] = {'#': 0}
            node = node[ch]
            node['#'] += 1
    res = []
    for q in queries:
        node = root
        ok = True
        for ch in q:
            if ch not in node:
                ok = False
                break
            node = node[ch]
        res.append(node['#'] if ok else 0)
    return res`,
    approach:
      'Build a trie where each node stores a count of how many words pass through it. Inserting a word increments the count along its path. A prefix query walks down the trie; the count at the node where the prefix ends is the number of words sharing that prefix.',
    complexity: { time: 'O(total chars)', space: 'O(total chars)' },
    multiParam: true,
    cases: [
      ['["apple","app","apricot","banana"]', '["app","ban","x"]'],
      ['["cat"]', '["cat","ca"]'],
      ['["a","ab","abc"]', '["a","ab","abc","abcd"]'],
      ['["dog","door","dot"]', '["do","doo","d"]'],
      ['["zebra"]', '["x","y","z"]'],
      ['["one","two","three"]', '["t","th","tw"]'],
      ['["aa","aa","aa"]', '["a","aa"]'],
      ['["hello","help","helmet"]', '["hel","help","hello"]'],
      ['["xyz"]', '["xyz","xy","x","w"]'],
      ['["sun","sunny","sunshine"]', '["sun","sunn","suns"]'],
    ],
  },
  {
    n: 2230,
    id: 'pghub-b33-circular-route',
    name: 'Circular Fuel Route',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'startStation',
    params: [
      { name: 'fuel', type: 'List[int]' },
      { name: 'cost', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> stations arranged in a circle. At station <code>i</code> you can pick up <code>fuel[i]</code> units, and it costs <code>cost[i]</code> units to drive from station <code>i</code> to the next station. Starting with an empty tank, return the index of the first station (smallest index, if any work) from which you can complete a full clockwise loop, or <code>-1</code> if none exists.',
    examples: [
      ['[1,2,3,4,5]\n[3,4,5,1,2]', '3', 'Starting at station 3 lets the tank stay non-negative all the way around.'],
      ['[2,3,4]\n[3,4,3]', '-1', 'Total fuel is less than total cost, so no loop is possible.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= fuel[i], cost[i] <= 10^4'],
    tags: ['greedy', 'arrays'],
    py: `def startStation(fuel, cost):
    total = 0
    tank = 0
    start = 0
    for i in range(len(fuel)):
        diff = fuel[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1`,
    approach:
      'If total fuel is at least total cost a solution exists and is unique among greedy candidates. Sweep once tracking a running tank; whenever it dips below zero, no station up to here can be the start, so reset the candidate start to the next station. The final candidate is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '[3,4,5,1,2]'],
      ['[2,3,4]', '[3,4,3]'],
      ['[5]', '[4]'],
      ['[0]', '[0]'],
      ['[3,3,4]', '[3,4,4]'],
      ['[4,5,2,6,5,3]', '[3,2,7,3,2,9]'],
      ['[1,1,1,1]', '[1,1,1,1]'],
      ['[5,1,2,3,4]', '[4,4,1,5,1]'],
      ['[2,2,2,2]', '[3,1,2,2]'],
      ['[10,0,0]', '[3,3,3]'],
    ],
  },
  {
    n: 2237,
    id: 'pghub-b33-zigzag-list',
    name: 'Zigzag Reorder List',
    topic_id: 'linkedlist',
    difficulty: 'Medium',
    method_name: 'zigzag',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A singly linked list is given as its sequence of node values <code>values</code>. Reorder the list so that values alternate between the front and the back: the first node, then the last, then the second, then the second-last, and so on. Return the reordered sequence of values.',
    examples: [
      ['[1,2,3,4]', '[1,4,2,3]', 'Interleave from both ends: 1, 4, 2, 3.'],
      ['[1,2,3,4,5]', '[1,5,2,4,3]', 'With an odd length the middle element ends up last.'],
    ],
    constraints: ['0 <= values.length <= 10^5', '-10^9 <= values[i] <= 10^9'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def zigzag(values):
    left = 0
    right = len(values) - 1
    out = []
    take_left = True
    while left <= right:
        if take_left:
            out.append(values[left])
            left += 1
        else:
            out.append(values[right])
            right -= 1
        take_left = not take_left
    return out`,
    approach:
      'Walk the list from both ends with two pointers, alternately taking from the front and the back. This reproduces the classic reorder-list interleaving (split, reverse the second half, merge) but expressed directly on the value sequence.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4]'],
      ['[1,2,3,4,5]'],
      ['[]'],
      ['[7]'],
      ['[1,2]'],
      ['[10,20,30]'],
      ['[1,2,3,4,5,6]'],
      ['[-1,-2,-3,-4]'],
      ['[5,5,5,5,5]'],
      ['[100,200,300,400,500,600,700]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B33>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b33-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B33>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B33>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b33-grade-${prob.n}.py`);
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
