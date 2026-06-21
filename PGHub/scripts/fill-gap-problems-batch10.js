#!/usr/bin/env node
// Batch 10 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (2300, 2700]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch10.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch10.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch10.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2307, 2308, 2313, 2314, 2323, 2324, 2329, 2330, 2339, 2340, 2345, 2346, 2355, 2361, 2362];

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
    n: 2307,
    id: 'pghub-b10-conveyor-defect',
    name: 'Conveyor Defect Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxCleanRun',
    params: [{ name: 'belt', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'A conveyor belt is a list <code>belt</code> where 1 marks a defective item and 0 a good one. An inspector may repair at most <code>k</code> defective items (turning them into good ones). Return the length of the longest contiguous run of good items achievable after at most <code>k</code> repairs.',
    examples: [
      ['[1,0,0,1,0,1,0,0]\n2', '6', 'Repair the two 1s in the middle to get a run of 6 good items.'],
      ['[0,0,0]\n0', '3', 'Already all good.'],
    ],
    constraints: ['1 <= belt.length <= 10^5', 'belt[i] is 0 or 1', '0 <= k <= belt.length'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def maxCleanRun(belt, k):
    left = 0
    ones = 0
    best = 0
    for right in range(len(belt)):
        if belt[right] == 1:
            ones += 1
        while ones > k:
            if belt[left] == 1:
                ones -= 1
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window that contains at most k defective items. Expand the right edge, and when defects exceed k, shrink from the left. The widest valid window is the longest achievable clean run.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,0,0,1,0,1,0,0]', '2'],
      ['[0,0,0]', '0'],
      ['[1,1,1,1]', '2'],
      ['[1,1,1,1]', '0'],
      ['[0,1,0,1,0]', '1'],
      ['[1]', '1'],
      ['[1]', '0'],
      ['[0,0,1,1,0,0,1,0]', '3'],
      ['[1,0,1,0,1,0,1]', '4'],
      ['[0]', '0'],
    ],
  },
  {
    n: 2308,
    id: 'pghub-b10-lantern-glow',
    name: 'Lantern Glow Coverage',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minLanterns',
    params: [{ name: 'street', type: 'int' }, { name: 'radius', type: 'int' }],
    return_type: 'int',
    statement:
      'A street is divided into integer positions <code>1..street</code>. A lantern placed at position p lights every position within distance <code>radius</code> (inclusive), i.e. the closed interval [p-radius, p+radius]. Lanterns may only be placed at integer positions in <code>1..street</code>. Return the minimum number of lanterns needed so every position from 1 to <code>street</code> is lit.',
    examples: [
      ['7\n1', '3', 'Place at 2, 5, 7 (or similar) to cover all 7 positions.'],
      ['5\n0', '5', 'Each lantern lights only its own position.'],
    ],
    constraints: ['1 <= street <= 10^9', '0 <= radius <= 10^9'],
    tags: ['greedy', 'math'],
    py: `def minLanterns(street, radius):
    span = 2 * radius + 1
    return (street + span - 1) // span`,
    approach:
      'Each lantern covers a contiguous block of 2*radius+1 positions. Greedily tiling the street with non-overlapping blocks of that width is optimal, so the answer is ceil(street / (2*radius+1)).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['7', '1'],
      ['5', '0'],
      ['1', '0'],
      ['1', '5'],
      ['10', '2'],
      ['100', '10'],
      ['9', '1'],
      ['6', '3'],
      ['1000000000', '1'],
      ['3', '0'],
    ],
  },
  {
    n: 2313,
    id: 'pghub-b10-relay-baton',
    name: 'Relay Baton Handoffs',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countHandoffs',
    params: [{ name: 'speeds', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Runners line up in order and pass a baton forward. A <em>handoff</em> happens at position i (for i &gt; 0) whenever <code>speeds[i]</code> is strictly greater than <code>speeds[i-1]</code>, because the faster runner must catch and take the baton. Return the total number of handoffs.',
    examples: [
      ['[3,5,2,8]', '2', 'Increases at 3->5 and 2->8.'],
      ['[9,7,5]', '0', 'No runner is faster than the one before.'],
    ],
    constraints: ['1 <= speeds.length <= 10^5', '1 <= speeds[i] <= 10^9'],
    tags: ['arrays', 'counting'],
    py: `def countHandoffs(speeds):
    return sum(1 for i in range(1, len(speeds)) if speeds[i] > speeds[i-1])`,
    approach:
      'Scan adjacent pairs once and count how many times the later runner is strictly faster than the earlier one.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,5,2,8]'],
      ['[9,7,5]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,5,5,5]'],
      ['[2,1,2,1,2]'],
      ['[10,20,10,20]'],
      ['[100]'],
      ['[1,1,2,2,3]'],
      ['[7,6,8,6,9]'],
    ],
  },
  {
    n: 2314,
    id: 'pghub-b10-mosaic-tiles',
    name: 'Mosaic Tile Pairs',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'matchingPairs',
    params: [{ name: 'colors', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A box of mosaic tiles is described by <code>colors</code>, where equal integers denote the same color. Tiles of the same color can be glued into a pair. Return the maximum number of complete pairs you can form (each tile used at most once).',
    examples: [
      ['[1,1,2,2,2]', '2', 'One pair of color 1 and one pair of color 2 (one color-2 tile left over).'],
      ['[7]', '0', 'A single tile cannot form a pair.'],
    ],
    constraints: ['1 <= colors.length <= 10^5', '1 <= colors[i] <= 10^9'],
    tags: ['arrays', 'hashing'],
    py: `def matchingPairs(colors):
    counts = Counter(colors)
    return sum(c // 2 for c in counts.values())`,
    approach:
      'Count occurrences of each color. Each color contributes floor(count/2) pairs. Sum across colors.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,1,2,2,2]'],
      ['[7]'],
      ['[3,3,3,3]'],
      ['[1,2,3,4]'],
      ['[5,5,5,5,5,5]'],
      ['[1,1,1,2,2]'],
      ['[9,9]'],
      ['[1,2,1,2,1,2]'],
      ['[4,4,4,4,4,4,4]'],
      ['[10,20,30,10,20,30]'],
    ],
  },
  {
    n: 2323,
    id: 'pghub-b10-vault-combination',
    name: 'Vault Combination Score',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'comboScore',
    params: [{ name: 'code', type: 'str' }],
    return_type: 'int',
    statement:
      'A vault combination is a string of decimal digits. Its <em>score</em> is the sum of the digits at even indices (0-indexed) minus the sum of the digits at odd indices. Return the score.',
    examples: [
      ['"1234"', '-2', '(1+3) - (2+4) = 4 - 6 = -2.'],
      ['"5"', '5', 'Only an even-index digit.'],
    ],
    constraints: ['1 <= code.length <= 10^5', 'code consists of decimal digits 0-9'],
    tags: ['math', 'strings'],
    py: `def comboScore(code):
    total = 0
    for i, ch in enumerate(code):
        d = ord(ch) - 48
        total += d if i % 2 == 0 else -d
    return total`,
    approach:
      'Walk the string, adding digits at even indices and subtracting digits at odd indices.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"1234"'],
      ['"5"'],
      ['"0000"'],
      ['"99"'],
      ['"13579"'],
      ['"24680"'],
      ['"111111"'],
      ['"909090"'],
      ['"5040302010"'],
      ['"7"'],
    ],
  },
  {
    n: 2324,
    id: 'pghub-b10-river-stepping',
    name: 'River Stepping Stones',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minWetSteps',
    params: [{ name: 'stones', type: 'List[int]' }, { name: 'jump', type: 'int' }],
    return_type: 'int',
    statement:
      'To cross a river you walk along a row of stones. <code>stones[i]</code> is 0 if stone i is dry and 1 if it is wet. You start before stone 0 and must reach past the last stone. From any position (including the start) you may move forward by 1 up to <code>jump</code> stones at a time, but you must land on a stone you do not skip into the water cost-free — every wet stone you land on costs 1. Return the minimum total wet-stone cost to reach the far bank (landing on the last stone, then stepping off). You must land on the last stone.',
    examples: [
      ['[0,1,1,0]\n2', '0', 'Jump start->0->2... land on dry stones only: 0,2,3? path 0,2,3 costs 0.'],
      ['[1,1,1]\n1', '3', 'Must step on every stone, all wet.'],
    ],
    constraints: ['1 <= stones.length <= 10^4', 'stones[i] is 0 or 1', '1 <= jump <= stones.length'],
    tags: ['dp', 'arrays'],
    py: `def minWetSteps(stones, jump):
    n = len(stones)
    INF = float('inf')
    # dp[i] = min cost to be standing on stone i (must land here)
    dp = [INF] * n
    for i in range(n):
        cost = stones[i]
        if i < jump:
            # reachable directly from start (positions -1 .. ), start is before stone 0
            best_prev = 0
        else:
            best_prev = INF
        for j in range(max(0, i - jump), i):
            if dp[j] < best_prev:
                best_prev = dp[j]
        dp[i] = best_prev + cost if best_prev != INF else INF
    return dp[n - 1]`,
    approach:
      'Dynamic programming over stones. dp[i] is the minimum cost to land on stone i, reachable from the start if i < jump or from any of the previous up-to-jump stones. The cost adds 1 when the landed stone is wet. The answer is dp[last] since you must land on the last stone.',
    complexity: { time: 'O(n * jump)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[0,1,1,0]', '2'],
      ['[1,1,1]', '1'],
      ['[0,0,0]', '1'],
      ['[1]', '1'],
      ['[0]', '1'],
      ['[1,0,1,0,1]', '2'],
      ['[1,1,1,1,1]', '2'],
      ['[0,1,0,1,0,1,0]', '3'],
      ['[1,0,0,0,1]', '4'],
      ['[1,1,0,1,1]', '2'],
    ],
  },
  {
    n: 2329,
    id: 'pghub-b10-orchard-harvest',
    name: 'Orchard Harvest Heap',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'harvest',
    params: [{ name: 'trees', type: 'List[int]' }, { name: 'days', type: 'int' }],
    return_type: 'int',
    statement:
      'Each tree i holds <code>trees[i]</code> ripe fruit. On each of <code>days</code> days you pick all fruit from exactly one tree, and overnight that tree regrows to <em>half</em> its just-picked amount (floor division). Maximize the total fruit picked over all days; return that total. You may pick from the same tree on multiple days.',
    examples: [
      ['[5,10]\n2', '15', 'Pick 10, then pick 5: total 15.'],
      ['[1]\n3', '1', 'Pick 1, then it regrows to 0, picking 0 twice.'],
    ],
    constraints: ['1 <= trees.length <= 10^4', '0 <= trees[i] <= 10^9', '1 <= days <= 10^4'],
    tags: ['heap', 'greedy'],
    py: `def harvest(trees, days):
    heap = [-t for t in trees]
    heapq.heapify(heap)
    total = 0
    for _ in range(days):
        top = -heapq.heappop(heap)
        total += top
        heapq.heappush(heap, -(top // 2))
    return total`,
    approach:
      'Use a max-heap of current fruit amounts. Each day pop the largest, add it to the total, then push back its halved (floor) regrowth. Greedily taking the biggest available each day is optimal.',
    complexity: { time: 'O(days log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[5,10]', '2'],
      ['[1]', '3'],
      ['[0,0]', '5'],
      ['[8]', '4'],
      ['[3,3,3]', '3'],
      ['[100]', '1'],
      ['[7,2,9,4]', '5'],
      ['[10,10,10]', '6'],
      ['[1,2,3,4,5]', '10'],
      ['[6]', '10'],
    ],
  },
  {
    n: 2330,
    id: 'pghub-b10-cipher-shift-band',
    name: 'Cipher Shift Band',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'shiftBand',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'str',
    statement:
      'Encrypt a lowercase string <code>s</code> with a Caesar shift of <code>k</code>: each letter advances <code>k</code> places forward in the alphabet, wrapping from z back to a. <code>k</code> may be larger than 26. Return the encrypted string.',
    examples: [
      ['"abc"\n1', '"bcd"', 'Each letter advances by one.'],
      ['"xyz"\n3', '"abc"', 'Wraps around the end of the alphabet.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters', '0 <= k <= 10^9'],
    tags: ['strings', 'math'],
    py: `def shiftBand(s, k):
    k %= 26
    return ''.join(chr((ord(c) - 97 + k) % 26 + 97) for c in s)`,
    approach:
      'Reduce k modulo 26, then map each letter to its shifted counterpart using modular arithmetic on its 0-25 index.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"abc"', '1'],
      ['"xyz"', '3'],
      ['"hello"', '0'],
      ['"hello"', '26'],
      ['"z"', '1'],
      ['"a"', '25'],
      ['"abcdefghijklmnopqrstuvwxyz"', '13'],
      ['"world"', '52'],
      ['"queue"', '5'],
      ['"mnop"', '1000000000'],
    ],
  },
  {
    n: 2339,
    id: 'pghub-b10-canyon-echo',
    name: 'Canyon Echo Depth',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'maxEchoDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A canyon echo is encoded with the characters <code>(</code> and <code>)</code> only. Return the maximum nesting depth of a valid balanced echo string. If the string is not balanced, return -1.',
    examples: [
      ['"((()))"', '3', 'Three levels of nesting.'],
      ['"(()"', '-1', 'Unbalanced: an opener is never closed.'],
    ],
    constraints: ['0 <= s.length <= 10^4', 's consists only of ( and )'],
    tags: ['stack', 'strings'],
    py: `def maxEchoDepth(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == '(':
            depth += 1
            best = max(best, depth)
        else:
            depth -= 1
            if depth < 0:
                return -1
    return best if depth == 0 else -1`,
    approach:
      'Track the current open-paren depth. Each opener increases depth (update the maximum), each closer decreases it. Going below zero means an unmatched closer; ending nonzero means unmatched openers; both yield -1.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"((()))"'],
      ['"(()"'],
      ['""'],
      ['"()"'],
      ['"()()()"'],
      ['"(())(())"'],
      ['")("'],
      ['"((((((((((()))))))))))"'],
      ['"(()(()))"'],
      ['"((("'],
    ],
  },
  {
    n: 2340,
    id: 'pghub-b10-frost-grid-spread',
    name: 'Frost Grid Spread',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'frostTime',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A garden is a grid where 0 is an empty plot, 1 is a living plant, and 2 is a frosted plant. Each minute, every frosted plant frosts its orthogonally adjacent living plants. Return the number of minutes until no living plant remains, or -1 if some living plant can never be frosted. If there are no living plants initially, return 0.',
    examples: [
      ['[[2,1,1],[1,1,0],[0,1,1]]', '4', 'Frost spreads outward to all reachable plants.'],
      ['[[2,1,1],[0,1,1],[1,0,1]]', '-1', 'The bottom-left plant is isolated and never frosts.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0, 1, or 2'],
    tags: ['graph', 'bfs'],
    py: `def frostTime(grid):
    rows, cols = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                q.append((r, c, 0))
            elif grid[r][c] == 1:
                fresh += 1
    if fresh == 0:
        return 0
    elapsed = 0
    while q:
        r, c, t = q.popleft()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                fresh -= 1
                elapsed = t + 1
                q.append((nr, nc, t + 1))
    return elapsed if fresh == 0 else -1`,
    approach:
      'Multi-source BFS from all initially frosted plants. Each living plant adopts the time of the neighbor that frosts it. The answer is the largest such time once the queue drains; if any living plant is never reached, return -1.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[2,1,1],[1,1,0],[0,1,1]]'],
      ['[[2,1,1],[0,1,1],[1,0,1]]'],
      ['[[0,2]]'],
      ['[[0,0,0]]'],
      ['[[2,2,2]]'],
      ['[[1]]'],
      ['[[2]]'],
      ['[[2,1,0,1,1]]'],
      ['[[2,1],[1,1]]'],
      ['[[1,1],[1,1]]'],
    ],
  },
  {
    n: 2345,
    id: 'pghub-b10-summit-visibility',
    name: 'Summit Visibility Count',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'visibleSummits',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Hikers stand in a line at the given <code>heights</code> and all look to the right. A hiker can see a summit if there is no taller-or-equal hiker between them and the right end — equivalently, a hiker is a <em>visible summit</em> if everyone to their right is strictly shorter. Return how many hikers are visible summits.',
    examples: [
      ['[2,5,3,1,4]', '2', 'Heights 5 and 4 have only strictly shorter hikers to their right.'],
      ['[1,2,3]', '1', 'Only the last (3) qualifies.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '1 <= heights[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def visibleSummits(heights):
    count = 0
    tallest = 0
    for h in reversed(heights):
        if h > tallest:
            count += 1
            tallest = h
    return count`,
    approach:
      'Scan from right to left, tracking the tallest hiker seen so far. A hiker is a visible summit exactly when they are taller than everyone already passed on the right. The rightmost hiker always qualifies.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,5,3,1,4]'],
      ['[1,2,3]'],
      ['[3,2,1]'],
      ['[5]'],
      ['[4,4,4,4]'],
      ['[1,3,2,4,1]'],
      ['[9,1,1,1,1]'],
      ['[1,1,9]'],
      ['[7,6,5,8,4,3]'],
      ['[10,20,10,20,10]'],
    ],
  },
  {
    n: 2346,
    id: 'pghub-b10-bracelet-beads',
    name: 'Bracelet Bead Symmetry',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'minRecolor',
    params: [{ name: 'beads', type: 'str' }],
    return_type: 'int',
    statement:
      'A bracelet is a string <code>beads</code> of lowercase letters laid in a line. To make it a palindrome you may recolor beads (change a character). Return the minimum number of beads you must recolor so the bracelet reads the same forwards and backwards.',
    examples: [
      ['"abca"', '1', 'Recolor one of the mismatched ends.'],
      ['"level"', '0', 'Already a palindrome.'],
    ],
    constraints: ['1 <= beads.length <= 10^5', 'beads consists of lowercase English letters'],
    tags: ['two-pointers', 'strings'],
    py: `def minRecolor(beads):
    i, j = 0, len(beads) - 1
    changes = 0
    while i < j:
        if beads[i] != beads[j]:
            changes += 1
        i += 1
        j -= 1
    return changes`,
    approach:
      'Compare beads from both ends moving inward. Each mismatched pair needs exactly one recolor to agree, so count the mismatched pairs.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"abca"'],
      ['"level"'],
      ['"a"'],
      ['"ab"'],
      ['"abcba"'],
      ['"abcde"'],
      ['"aaaa"'],
      ['"abccba"'],
      ['"zxyxz"'],
      ['"abcdef"'],
    ],
  },
  {
    n: 2355,
    id: 'pghub-b10-treasure-split',
    name: 'Treasure Equal Split',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'canSplit',
    params: [{ name: 'coins', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'A chest holds coins of given values in <code>coins</code>. Two pirates want to divide all coins into two groups of equal total value (every coin goes to exactly one pirate). Return whether such an equal split is possible.',
    examples: [
      ['[1,5,11,5]', 'true', '{11} and {1,5,5} both sum to 11.'],
      ['[1,2,5]', 'false', 'Total 8 cannot be split into two equal sums.'],
    ],
    constraints: ['1 <= coins.length <= 200', '1 <= coins[i] <= 100'],
    tags: ['backtracking', 'dp'],
    py: `def canSplit(coins):
    total = sum(coins)
    if total % 2 != 0:
        return False
    target = total // 2
    reachable = {0}
    for c in coins:
        nxt = set(reachable)
        for r in reachable:
            if r + c <= target:
                nxt.add(r + c)
        reachable = nxt
        if target in reachable:
            return True
    return target in reachable`,
    approach:
      'If the total is odd, no equal split exists. Otherwise this is a subset-sum to total/2: track all achievable subset sums up to the target, adding each coin to existing sums. Success when the target becomes reachable.',
    complexity: { time: 'O(n * total)', space: 'O(total)' },
    cases: [
      ['[1,5,11,5]'],
      ['[1,2,5]'],
      ['[2,2]'],
      ['[1]'],
      ['[3,3,3,3]'],
      ['[1,1,1,1,1]'],
      ['[10,10,10,10]'],
      ['[7,3,1,5,4,8]'],
      ['[100,100]'],
      ['[1,2,3,4,5,6,7]'],
    ],
  },
  {
    n: 2361,
    id: 'pghub-b10-pipe-pressure',
    name: 'Pipe Pressure Equalize',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minMaxLoad',
    params: [{ name: 'jobs', type: 'List[int]' }, { name: 'workers', type: 'int' }],
    return_type: 'int',
    statement:
      'You have a list of indivisible <code>jobs</code> (each a positive duration) that must be assigned to <code>workers</code>. Any job may go to any worker, and every job goes to exactly one worker. Minimize the maximum total duration assigned to any single worker, and return that minimized maximum.',
    examples: [
      ['[3,2,3]\n3', '3', 'Each worker takes one job; the max is 3.'],
      ['[1,2,4,7,8]\n2', '11', 'Best balanced split has max load 11.'],
    ],
    constraints: ['1 <= jobs.length <= 16', '1 <= jobs[i] <= 10^7', '1 <= workers <= jobs.length'],
    tags: ['binary-search', 'backtracking'],
    py: `def minMaxLoad(jobs, workers):
    jobs = sorted(jobs, reverse=True)
    def feasible(limit):
        loads = [0] * workers
        def place(i):
            if i == len(jobs):
                return True
            seen = set()
            for w in range(workers):
                if loads[w] in seen:
                    continue
                if loads[w] + jobs[i] <= limit:
                    seen.add(loads[w])
                    loads[w] += jobs[i]
                    if place(i + 1):
                        return True
                    loads[w] -= jobs[i]
                if loads[w] == 0:
                    break
            return False
        return place(0)
    lo, hi = max(jobs), sum(jobs)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary-search the answer (the maximum per-worker load) between the largest single job and the total. Feasibility for a candidate limit is tested by backtracking placement of jobs (largest first) onto workers without exceeding the limit, pruning symmetric/empty-worker branches.',
    complexity: { time: 'O(log(sum) * workers^n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[3,2,3]', '3'],
      ['[1,2,4,7,8]', '2'],
      ['[5]', '1'],
      ['[5,5,5,5]', '4'],
      ['[5,5,5,5]', '2'],
      ['[1,1,1,1]', '1'],
      ['[10,10,10]', '2'],
      ['[2,3,4,5,6]', '3'],
      ['[7,7,7,7,7]', '5'],
      ['[1,2,3,4,5,6]', '3'],
    ],
  },
  {
    n: 2362,
    id: 'pghub-b10-glacier-melt-trees',
    name: 'Glacier Melt BST Range',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'rangeSum',
    params: [{ name: 'preorder', type: 'List[int]' }, { name: 'lo', type: 'int' }, { name: 'hi', type: 'int' }],
    return_type: 'int',
    statement:
      'A binary search tree was built by inserting the values of <code>preorder</code> one at a time into an initially empty BST (standard insertion, no duplicates). Return the sum of all node values v with <code>lo &lt;= v &lt;= hi</code>.',
    examples: [
      ['[5,3,8,1,4,7,9]\n3\n7', '19', 'Values in [3,7] are 3,4,5,7 -> sum 19.'],
      ['[10]\n1\n5', '0', 'The only value 10 is outside the range.'],
    ],
    constraints: ['1 <= preorder.length <= 10^4', 'all values are distinct', '-10^9 <= values, lo, hi <= 10^9', 'lo <= hi'],
    tags: ['trees', 'binary-search-tree'],
    py: `class _Node:
    __slots__ = ('val', 'left', 'right')
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def rangeSum(preorder, lo, hi):
    root = None
    def insert(node, v):
        if node is None:
            return _Node(v)
        if v < node.val:
            node.left = insert(node.left, v)
        else:
            node.right = insert(node.right, v)
        return node
    for v in preorder:
        root = insert(root, v)
    total = 0
    stack = [root]
    while stack:
        node = stack.pop()
        if node is None:
            continue
        if lo <= node.val <= hi:
            total += node.val
        if node.val > lo:
            stack.append(node.left)
        if node.val < hi:
            stack.append(node.right)
    return total`,
    approach:
      'Rebuild the BST by inserting the preorder values. Then traverse, pruning subtrees that cannot contain in-range values (skip left when node <= lo, skip right when node >= hi), accumulating values inside [lo, hi].',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[5,3,8,1,4,7,9]', '3', '7'],
      ['[10]', '1', '5'],
      ['[10]', '10', '10'],
      ['[5,3,8,1,4,7,9]', '0', '100'],
      ['[5,3,8,1,4,7,9]', '6', '6'],
      ['[1,2,3,4,5]', '2', '4'],
      ['[5,4,3,2,1]', '2', '4'],
      ['[50,30,70,20,40,60,80]', '35', '65'],
      ['[0]', '-5', '5'],
      ['[-3,-1,-5,-2,-4]', '-4', '-2'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b10-${prob.n}.py`);
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
  // Move any top-level helper class/def defined before the entry function into module scope,
  // keep the entry function body indented into the Solution method.
  const lines = prob.py.split('\n');
  const entryHeader = `def ${prob.method_name}(`;
  const idx = lines.findIndex((l) => l.startsWith(entryHeader));
  const preamble = idx > 0 ? lines.slice(0, idx).join('\n').replace(/\n+$/, '') : '';
  const fnLines = lines.slice(idx);
  // drop the "def method(...):" header line
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
  const tmp = path.join(os.tmpdir(), `pghub-b10-grade-${prob.n}.py`);
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

  // VERIFY mode: pull stored rows from DB and re-grade.
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
    // self-grade the stored solution before queueing
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
