#!/usr/bin/env node
// Batch 30 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1891,1892,1973,1983,1988,1989,1990,1999,2004,2005,2010,2015,2020,2021,2026
//
//   node scripts/fill-gap-problems-batch30.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch30.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch30.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1891, 1892, 1973, 1983, 1988, 1989, 1990, 1999, 2004, 2005, 2010, 2015, 2020, 2021, 2026];

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
    n: 1891,
    id: 'pghub-b30-ticket-window',
    name: 'Cinema Ticket Window',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'waitTime',
    params: [
      { name: 'positions', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A single ticket window serves one person every minute. <code>positions[i]</code> is the number of tickets the person standing at index <code>i</code> in the queue wants to buy, and each ticket takes one minute. Everyone keeps their place until served completely. Return the number of minutes that pass before the person originally at index <code>k</code> finishes buying all of their tickets.',
    examples: [
      ['[2,3,2]\n2', '6', 'Person 0 takes 2 min, person 1 takes 3 min, then person 2 finishes after 1 more min: 2+3+1=6.'],
      ['[5,1,1,1]\n0', '5', 'Person 0 is first and needs 5 tickets, finishing at minute 5.'],
    ],
    constraints: ['1 <= positions.length <= 100', '1 <= positions[i] <= 100', '0 <= k < positions.length'],
    tags: ['math', 'simulation'],
    py: `def waitTime(positions, k):
    total = 0
    for i in range(k + 1):
        total += positions[i]
    return total`,
    approach:
      'Because the window serves people strictly in queue order and finishes each person before moving on, the person at index k waits for everyone ahead of them to be fully served plus their own tickets. Sum positions[0..k].',
    complexity: { time: 'O(k)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,3,2]', '2'],
      ['[5,1,1,1]', '0'],
      ['[1]', '0'],
      ['[4,4,4,4]', '3'],
      ['[10,1]', '1'],
      ['[3,1,4,1,5]', '4'],
      ['[100,100,100]', '2'],
      ['[1,1,1,1,1]', '0'],
      ['[7,2,9]', '2'],
      ['[2,2,2,2,2,2]', '5'],
    ],
  },
  {
    n: 1892,
    id: 'pghub-b30-balanced-brackets',
    name: 'Minimum Bracket Fixes',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'minFixes',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'You are given a string <code>s</code> containing only the characters <code>(</code> and <code>)</code>. In one move you may insert a single bracket anywhere in the string. Return the minimum number of insertions needed to make every bracket properly matched and balanced.',
    examples: [
      ['(()', '1', 'Insert one ) at the end to balance the open bracket.'],
      ['())(', '2', 'One insertion fixes the stray ), one fixes the trailing (.'],
    ],
    constraints: ['0 <= s.length <= 10^4', 's consists only of ( and )'],
    tags: ['stack', 'strings'],
    py: `def minFixes(s):
    open_count = 0
    inserts = 0
    for ch in s:
        if ch == '(':
            open_count += 1
        else:
            if open_count > 0:
                open_count -= 1
            else:
                inserts += 1
    return inserts + open_count`,
    approach:
      'Scan left to right tracking unmatched open brackets. A close bracket cancels an open one if available, otherwise it needs an insertion. Any open brackets left over at the end each need a matching close. The total is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'(()'"],
      ["'())('"],
      ["''"],
      ["'()'"],
      ["'((('"],
      ["')))'"],
      ["'()()'"],
      ["')('"],
      ["'(())'"],
      ["'(()))('"],
    ],
  },
  {
    n: 1973,
    id: 'pghub-b30-warehouse-aisles',
    name: 'Warehouse Aisle Capacity',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestAisle',
    params: [
      { name: 'shelves', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A warehouse aisle is a contiguous run of shelves; <code>shelves[i]</code> is the height of shelf <code>i</code>. A forklift can travel an aisle only if the difference between the tallest and shortest shelf in that aisle is at most <code>limit</code>. Return the length of the longest aisle the forklift can travel.',
    examples: [
      ['[3,5,4,8,9]\n2', '3', 'The run [3,5,4] has max-min = 2 which is within the limit.'],
      ['[1,1,1]\n0', '3', 'All shelves equal, so the whole aisle qualifies.'],
    ],
    constraints: ['1 <= shelves.length <= 10^5', '1 <= shelves[i] <= 10^9', '0 <= limit <= 10^9'],
    tags: ['sliding-window', 'queue'],
    py: `def longestAisle(shelves, limit):
    max_dq = deque()  # decreasing
    min_dq = deque()  # increasing
    left = 0
    best = 0
    for right, v in enumerate(shelves):
        while max_dq and shelves[max_dq[-1]] <= v:
            max_dq.pop()
        max_dq.append(right)
        while min_dq and shelves[min_dq[-1]] >= v:
            min_dq.pop()
        min_dq.append(right)
        while shelves[max_dq[0]] - shelves[min_dq[0]] > limit:
            left += 1
            if max_dq[0] < left:
                max_dq.popleft()
            if min_dq[0] < left:
                min_dq.popleft()
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Use a sliding window with two monotonic deques tracking the window maximum and minimum. Expand the right edge each step; whenever max-min exceeds the limit, advance the left edge and evict stale deque fronts. Track the widest valid window.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[3,5,4,8,9]', '2'],
      ['[1,1,1]', '0'],
      ['[10]', '5'],
      ['[8,2,4,7,2]', '4'],
      ['[1,5,9,13]', '3'],
      ['[4,4,4,4,4]', '0'],
      ['[100,1,100,1]', '50'],
      ['[2,4,6,8,10,12]', '6'],
      ['[7,3,3,7,3]', '4'],
      ['[1,2,3,4,5,6,7,8]', '1000000000'],
    ],
  },
  {
    n: 1983,
    id: 'pghub-b30-color-runs',
    name: 'Paint Roller Runs',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rollerStrokes',
    params: [{ name: 'wall', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A wall is described by <code>wall[i]</code>, the color id of segment <code>i</code> from left to right. A paint roller lays down one color across a contiguous stretch in a single stroke, and strokes may overlap earlier ones. Return the minimum number of strokes needed to paint the wall exactly as described, starting from a blank wall.',
    examples: [
      ['[1,1,2,2,1]', '3', 'Roll color 1 across the whole wall, then color 2 over the middle, then color 1 again over the last segment: 3 strokes.'],
      ['[5,5,5]', '1', 'A single stroke of color 5 covers everything.'],
    ],
    constraints: ['1 <= wall.length <= 10^5', '1 <= wall[i] <= 10^9'],
    tags: ['arrays', 'greedy'],
    py: `def rollerStrokes(wall):
    if not wall:
        return 0
    strokes = 1
    for i in range(1, len(wall)):
        if wall[i] != wall[i - 1]:
            strokes += 1
    return strokes`,
    approach:
      'Each maximal run of equal colors can be produced by extending or re-rolling, and overlapping strokes mean the minimum equals the number of color changes plus one. Count the boundaries where adjacent segments differ.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,1,2,2,1]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2,3,4]'],
      ['[7,7,7,7,7]'],
      ['[1,2,1,2,1,2]'],
      ['[3,3,1,1,3,3]'],
      ['[9,9,9,1]'],
      ['[2,4,4,4,2,2]'],
      ['[1,1,1,2,2,3,3,3,1]'],
    ],
  },
  {
    n: 1988,
    id: 'pghub-b30-river-crossing',
    name: 'River Stepping Stones',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minJumps',
    params: [{ name: 'stones', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of stepping stones crosses a river. <code>stones[i]</code> is the maximum number of stones you may leap forward from stone <code>i</code> in one jump (you must land on a stone). You start on stone 0 and want to reach the last stone. Return the minimum number of jumps needed, or <code>-1</code> if the last stone is unreachable.',
    examples: [
      ['[2,3,1,1,4]', '2', 'Jump from stone 0 to stone 1, then stone 1 to the last stone.'],
      ['[1,0,3]', '-1', 'From stone 1 you cannot move, so the last stone is unreachable.'],
    ],
    constraints: ['1 <= stones.length <= 10^4', '0 <= stones[i] <= 10^4'],
    tags: ['dp', 'greedy'],
    py: `def minJumps(stones):
    n = len(stones)
    if n == 1:
        return 0
    jumps = 0
    cur_end = 0
    farthest = 0
    for i in range(n - 1):
        farthest = max(farthest, i + stones[i])
        if i == cur_end:
            if farthest <= i:
                return -1
            jumps += 1
            cur_end = farthest
            if cur_end >= n - 1:
                return jumps
    return jumps if cur_end >= n - 1 else -1`,
    approach:
      'Greedy BFS-by-layers: track the farthest reachable index and the boundary of the current jump. When the scan reaches the boundary, commit a jump and extend the boundary to the farthest seen. If the boundary cannot advance, the end is unreachable.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,1,1,4]'],
      ['[1,0,3]'],
      ['[0]'],
      ['[1,1,1,1]'],
      ['[3,2,1,0,4]'],
      ['[5,1,1,1,1]'],
      ['[2,0,2,0,1]'],
      ['[1,2,3]'],
      ['[4,1,1,1,1,1]'],
      ['[2,1,0,0]'],
    ],
  },
  {
    n: 1989,
    id: 'pghub-b30-meeting-rooms',
    name: 'Conference Room Crunch',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxConcurrent',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry of <code>meetings</code> is a pair <code>[start, end]</code> giving the half-open interval <code>[start, end)</code> during which a meeting occupies a room. Return the maximum number of meetings that are in progress at the same instant, which is the minimum number of rooms required.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'At time 5 both [0,30] and [5,10] overlap, so two rooms are needed.'],
      ['[[1,2],[2,3],[3,4]]', '1', 'The meetings touch but never overlap, so one room suffices.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'heap'],
    py: `def maxConcurrent(meetings):
    events = []
    for s, e in meetings:
        events.append((s, 1))
        events.append((e, -1))
    events.sort()
    cur = 0
    best = 0
    for _, delta in events:
        cur += delta
        best = max(best, cur)
    return best`,
    approach:
      'Convert each meeting into a +1 start event and a -1 end event, then sort by time with ends ordered before starts at the same instant (since intervals are half-open). Sweep through and track the running count of active meetings.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[0,1]]'],
      ['[[0,10],[0,10],[0,10]]'],
      ['[[1,5],[2,6],[3,7],[4,8]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[5,10],[0,3],[3,5]]'],
      ['[[0,100],[10,20],[15,25],[18,30]]'],
      ['[[1,2],[1,2],[1,2],[1,2],[1,2]]'],
      ['[[0,1],[2,3],[4,5],[6,7]]'],
    ],
  },
  {
    n: 1990,
    id: 'pghub-b30-binary-gap',
    name: 'Longest Binary Gap',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'longestGap',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      "A binary gap is a maximal run of consecutive zeros bounded by ones at both ends in the binary representation of a positive integer <code>n</code>. Return the length of the longest binary gap, or <code>0</code> if there is none.",
    examples: [
      ['9', '2', 'Binary 1001 has one gap of length 2.'],
      ['15', '0', 'Binary 1111 has no zeros between ones.'],
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
    tags: ['bit-manipulation', 'math'],
    py: `def longestGap(n):
    bits = bin(n)[2:]
    best = 0
    cur = -1
    for b in bits:
        if b == '1':
            if cur >= 0:
                best = max(best, cur)
            cur = 0
        elif cur >= 0:
            cur += 1
    return best`,
    approach:
      'Read the binary digits left to right. Start counting zeros only after the first 1 is seen, and whenever another 1 closes a run, update the best length. Trailing zeros are ignored because they are not bounded by a 1 on the right.',
    complexity: { time: 'O(log n)', space: 'O(log n)' },
    cases: [
      ['9'],
      ['15'],
      ['1041'],
      ['32'],
      ['1'],
      ['2147483647'],
      ['66'],
      ['529'],
      ['8'],
      ['1162'],
    ],
  },
  {
    n: 1999,
    id: 'pghub-b30-token-rotation',
    name: 'Rotate Token Ring',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rotateRing',
    params: [
      { name: 'tokens', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Tokens are arranged in a ring given by the list <code>tokens</code>. Rotating the ring once to the right moves the last token to the front. Return the ring after rotating it <code>k</code> times to the right; <code>k</code> may be larger than the number of tokens.',
    examples: [
      ['[1,2,3,4,5]\n2', '[4,5,1,2,3]', 'Two right rotations bring 4 and 5 to the front.'],
      ['[7,8]\n3', '[8,7]', 'Three rotations on two tokens is the same as one rotation.'],
    ],
    constraints: ['1 <= tokens.length <= 10^5', '0 <= k <= 10^9', '-10^9 <= tokens[i] <= 10^9'],
    tags: ['arrays', 'math'],
    py: `def rotateRing(tokens, k):
    n = len(tokens)
    k %= n
    if k == 0:
        return tokens[:]
    return tokens[-k:] + tokens[:-k]`,
    approach:
      'A right rotation by k is equivalent to k mod n rotations. Slice the last k elements to the front and append the remaining prefix, handling the k=0 case to avoid an empty slice swallowing the whole list.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[7,8]', '3'],
      ['[1]', '100'],
      ['[1,2,3]', '0'],
      ['[4,5,6,7]', '4'],
      ['[10,20,30,40,50]', '7'],
      ['[-1,-2,-3]', '1'],
      ['[9,8,7,6,5,4]', '5'],
      ['[2,4,6,8]', '1000000000'],
      ['[100,200]', '1'],
    ],
  },
  {
    n: 2004,
    id: 'pghub-b30-island-perimeter',
    name: 'Lake Shoreline Length',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shoreline',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for water and <code>0</code> for land. All the water cells form a single connected lake (connected horizontally or vertically) with no land enclosed inside it. Return the total shoreline length: the number of unit edges where a water cell touches either land or the edge of the map.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped lake of 5 cells exposes 12 unit edges.'],
      ['[[1]]', '4', 'A lone water cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'matrix'],
    py: `def shoreline(grid):
    rows = len(grid)
    cols = len(grid[0])
    perim = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nr >= rows or nc < 0 or nc >= cols or grid[nr][nc] == 0:
                        perim += 1
    return perim`,
    approach:
      'Each water cell contributes 4 edges minus one for every adjacent water cell. Equivalently, scan every water cell and count each of its four sides that faces land or falls outside the grid; sum these exposed edges.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,0,1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[0,1,1,0],[1,1,1,1],[0,1,1,0]]'],
    ],
  },
  {
    n: 2005,
    id: 'pghub-b30-dna-decode',
    name: 'Decode DNA Strand',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'decodeStrand',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A DNA strand is compressed by run-length encoding: a positive integer followed by a single uppercase letter means that letter repeated that many times. Encodings are concatenated, e.g. <code>3A2C</code> means <code>AAACC</code>. Given an encoded string <code>s</code>, return the decoded strand. Counts may have multiple digits.',
    examples: [
      ['3A2C', 'AAACC', 'Three A characters followed by two C characters.'],
      ['10G', 'GGGGGGGGGG', 'Ten copies of G.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's is well-formed: count digits followed by one uppercase letter'],
    tags: ['strings', 'simulation'],
    py: `def decodeStrand(s):
    out = []
    num = 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        else:
            out.append(ch * num)
            num = 0
    return ''.join(out)`,
    approach:
      'Walk the string accumulating digits into a running count. When a letter is reached, append that letter repeated count times to the output and reset the count for the next token.',
    complexity: { time: 'O(total output length)', space: 'O(total output length)' },
    cases: [
      ["'3A2C'"],
      ["'10G'"],
      ["'1A1B1C'"],
      ["'5T'"],
      ["'2A2A2A'"],
      ["'12X3Y'"],
      ["'1Z'"],
      ["'4G4C4A4T'"],
      ["'100A'"],
      ["'7N2M9P'"],
    ],
  },
  {
    n: 2010,
    id: 'pghub-b30-fair-candy',
    name: 'Fair Candy Split',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'fairSplit',
    params: [
      { name: 'alice', type: 'List[int]' },
      { name: 'bob', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Alice and Bob each have a collection of candy bars; <code>alice[i]</code> and <code>bob[j]</code> are bar sizes. They want to swap exactly one bar each so that afterward both have the same total size. Return any pair <code>[a, b]</code> where <code>a</code> is the size Alice gives and <code>b</code> is the size Bob gives; if several work, return the one with the smallest <code>a</code>, then smallest <code>b</code>. Return an empty list if no swap works.',
    examples: [
      ['[1,1]\n[2,2]', '[1,2]', 'Alice gives a 1 and Bob gives a 2; both totals become 3.'],
      ['[2]\n[5]', '[]', 'No single swap can equalize totals of 2 and 5.'],
    ],
    constraints: ['1 <= alice.length, bob.length <= 10^4', '1 <= alice[i], bob[j] <= 10^5'],
    tags: ['arrays', 'math'],
    py: `def fairSplit(alice, bob):
    sa = sum(alice)
    sb = sum(bob)
    diff = sa - sb
    if diff % 2 != 0:
        return []
    half = diff // 2  # a - b must equal half
    bob_set = set(bob)
    best = None
    for a in alice:
        b = a - half
        if b in bob_set:
            cand = [a, b]
            if best is None or cand < best:
                best = cand
    return best if best is not None else []`,
    approach:
      'Swapping a (from Alice) for b (from Bob) changes Alice total by b-a, so balance requires a-b = (sumA-sumB)/2. The difference must be even; then for each Alice bar a, check whether b = a - half exists in Bob set, and keep the lexicographically smallest pair.',
    complexity: { time: 'O(n + m)', space: 'O(m)' },
    multiParam: true,
    cases: [
      ['[1,1]', '[2,2]'],
      ['[2]', '[5]'],
      ['[1,2,5]', '[2,4]'],
      ['[3,3,3]', '[3,3,3]'],
      ['[10,20]', '[5,15]'],
      ['[1]', '[1]'],
      ['[4,8,12]', '[2,6,10]'],
      ['[5,5,5,5]', '[1,1,1,1]'],
      ['[7]', '[3]'],
      ['[2,4,6,8]', '[1,3,5,7]'],
    ],
  },
  {
    n: 2015,
    id: 'pghub-b30-staircase-paint',
    name: 'Staircase Climbing Ways',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'climbWays',
    params: [
      { name: 'n', type: 'int' },
      { name: 'maxStep', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A staircase has <code>n</code> steps. From any step you may climb between 1 and <code>maxStep</code> steps at a time. Return the number of distinct ordered ways to climb from the ground to the top step.',
    examples: [
      ['4\n2', '5', 'With steps of size 1 or 2 there are 5 ways to climb 4 steps.'],
      ['3\n3', '4', 'Allowing leaps of 1, 2, or 3 gives 4 ways to climb 3 steps.'],
    ],
    constraints: ['0 <= n <= 1000', '1 <= maxStep <= 10'],
    tags: ['dp', 'recursion'],
    py: `def climbWays(n, maxStep):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        for s in range(1, maxStep + 1):
            if i - s >= 0:
                dp[i] += dp[i - s]
    return dp[n]`,
    approach:
      'Let dp[i] be the number of ways to reach step i. The ground (step 0) has one way. Each step is reachable from up to maxStep previous steps, so dp[i] sums dp[i-s] for every legal step size s.',
    complexity: { time: 'O(n*maxStep)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '2'],
      ['3', '3'],
      ['0', '5'],
      ['1', '1'],
      ['5', '2'],
      ['10', '1'],
      ['7', '3'],
      ['20', '2'],
      ['6', '6'],
      ['12', '4'],
    ],
  },
  {
    n: 2020,
    id: 'pghub-b30-kth-distinct',
    name: 'Kth Distinct Visitor',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'kthDistinct',
    params: [
      { name: 'visitors', type: 'List[str]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'A log lists visitor names in arrival order in <code>visitors</code>. A visitor is distinct if their name appears exactly once in the log. Return the name of the <code>k</code>-th distinct visitor in arrival order, or an empty string if fewer than <code>k</code> distinct visitors exist.',
    examples: [
      ['["ann","bob","ann","cara"]\n1', 'bob', 'The distinct names in order are bob, cara; the 1st is bob.'],
      ['["x","x","y"]\n2', '', 'Only y is distinct, so there is no 2nd distinct visitor.'],
    ],
    constraints: ['1 <= visitors.length <= 10^4', '1 <= k <= 10^4', 'names are non-empty lowercase strings'],
    tags: ['arrays', 'hashmap'],
    py: `def kthDistinct(visitors, k):
    counts = Counter(visitors)
    seen = 0
    for name in visitors:
        if counts[name] == 1:
            seen += 1
            if seen == k:
                return name
    return ''`,
    approach:
      'Count occurrences of every name, then walk the log in arrival order counting names that occur exactly once. Return the k-th such name, or an empty string if the count of distinct names is less than k.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['["ann","bob","ann","cara"]', '1'],
      ['["x","x","y"]', '2'],
      ['["x","x","y"]', '1'],
      ['["a","b","c"]', '3'],
      ['["a","a","b","b"]', '1'],
      ['["solo"]', '1'],
      ['["p","q","p","r","s","q"]', '2'],
      ['["m","n","o","m","n"]', '1'],
      ['["t","t","t"]', '1'],
      ['["d","e","f","g","d","e"]', '2'],
    ],
  },
  {
    n: 2021,
    id: 'pghub-b30-warehouse-routes',
    name: 'Cheapest Delivery Route',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'cheapestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A delivery network has <code>n</code> hubs numbered <code>0..n-1</code> and a list of directed <code>roads</code>, where <code>roads[i] = [from, to, cost]</code>. Return the minimum total cost to drive from hub <code>src</code> to hub <code>dst</code>, or <code>-1</code> if <code>dst</code> is unreachable. Costs are non-negative.',
    examples: [
      ['4\n[[0,1,5],[1,2,3],[0,2,10],[2,3,1]]\n0\n3', '9', 'Route 0->1->2->3 costs 5+3+1=9, cheaper than going direct to 2.'],
      ['2\n[[0,1,4]]\n1\n0', '-1', 'There is no road back from hub 1 to hub 0.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 5*10^4', '0 <= cost <= 10^4', '0 <= src, dst < n'],
    tags: ['advanced-graphs', 'heap'],
    py: `def cheapestRoute(n, roads, src, dst):
    graph = defaultdict(list)
    for f, t, c in roads:
        graph[f].append((t, c))
    dist = [float('inf')] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == dst:
            return d
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist[dst] if dist[dst] != float('inf') else -1`,
    approach:
      "Standard Dijkstra over a directed weighted graph. Use a min-heap keyed by accumulated cost, relax outgoing edges, and skip stale heap entries. The first time the destination is popped its distance is final because all costs are non-negative.",
    complexity: { time: 'O(E log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,5],[1,2,3],[0,2,10],[2,3,1]]', '0', '3'],
      ['2', '[[0,1,4]]', '1', '0'],
      ['1', '[]', '0', '0'],
      ['3', '[[0,1,1],[1,2,1],[0,2,5]]', '0', '2'],
      ['5', '[[0,1,2],[0,2,2],[1,3,2],[2,3,1],[3,4,3]]', '0', '4'],
      ['3', '[[0,1,7]]', '0', '2'],
      ['4', '[[0,1,1],[1,0,1],[2,3,1]]', '0', '3'],
      ['6', '[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5]]', '0', '3'],
      ['2', '[[0,1,0]]', '0', '1'],
      ['4', '[[0,1,3],[1,2,3],[2,0,3]]', '0', '3'],
    ],
  },
  {
    n: 2026,
    id: 'pghub-b30-tree-tilt',
    name: 'Binary Tree Tilt Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'totalTilt',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given in level order by <code>values</code>, where <code>null</code> marks a missing child (use <code>-1</code> here to mark an absent node). The tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree; an empty subtree sums to 0. Return the sum of every node\'s tilt.',
    examples: [
      ['[1,2,3]', '1', 'Node 1 has left sum 2 and right sum 3, tilt 1; leaves have tilt 0.'],
      ['[4]', '0', 'A single node has no children, so total tilt is 0.'],
    ],
    constraints: ['1 <= values.length <= 10^4', '-1 marks an absent node; real values are 0..1000'],
    tags: ['trees', 'recursion'],
    py: `def totalTilt(values):
    n = len(values)
    total = [0]
    def subtree_sum(i):
        if i >= n or values[i] == -1:
            return 0
        left = subtree_sum(2 * i + 1)
        right = subtree_sum(2 * i + 2)
        total[0] += abs(left - right)
        return values[i] + left + right
    subtree_sum(0)
    return total[0]`,
    approach:
      'Treat the level-order array as a heap-indexed tree (children of i are 2i+1 and 2i+2). Recursively compute each subtree sum; while returning, add the absolute left-right difference to a running tilt total.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    cases: [
      ['[1,2,3]'],
      ['[4]'],
      ['[1,2,3,4,5,6,7]'],
      ['[5,3,-1,1]'],
      ['[10,-1,20]'],
      ['[0,0,0]'],
      ['[1,-1,2,-1,-1,-1,3]'],
      ['[100,50,50,25,25,25,25]'],
      ['[2,1,1,1,1,1,1]'],
      ['[7,3,9,1,-1,8,10]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B30>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b30-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B30>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B30>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b30-grade-${prob.n}.py`);
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
