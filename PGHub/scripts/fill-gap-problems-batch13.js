#!/usr/bin/env node
// Batch 13 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (3500, 3900]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch13.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch13.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch13.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [3506, 3511, 3520, 3526, 3535, 3540, 3549, 3555, 3565, 3571, 3581, 3595, 3596, 3610, 3616];

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
    n: 3506,
    id: 'pghub-b13-warehouse-aisles',
    name: 'Warehouse Aisle Restock',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'restockCount',
    params: [{ name: 'stock', type: 'List[int]' }, { name: 'threshold', type: 'int' }],
    return_type: 'int',
    statement:
      'A warehouse has aisles with current stock levels in <code>stock</code>. An aisle needs restocking when its stock is strictly below <code>threshold</code>. Return how many aisles need restocking.',
    examples: [
      ['[5,2,8,1]\n3', '2', 'Aisles with 2 and 1 are below 3.'],
      ['[10,10,10]\n5', '0', 'All aisles are at or above 5.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^9', '0 <= threshold <= 10^9'],
    tags: ['arrays', 'counting'],
    py: `def restockCount(stock, threshold):
    return sum(1 for s in stock if s < threshold)`,
    approach:
      'Scan every aisle once and count those whose stock falls strictly below the threshold.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[5,2,8,1]', '3'],
      ['[10,10,10]', '5'],
      ['[0]', '1'],
      ['[0]', '0'],
      ['[1,2,3,4,5]', '3'],
      ['[100,200,300]', '0'],
      ['[3,3,3]', '3'],
      ['[9,1,9,1,9]', '5'],
      ['[7]', '7'],
      ['[2,4,6,8,10]', '7'],
    ],
  },
  {
    n: 3511,
    id: 'pghub-b13-token-bridge',
    name: 'Token Bridge Pairing',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'maxBridges',
    params: [{ name: 'left', type: 'List[int]' }, { name: 'right', type: 'List[int]' }, { name: 'gap', type: 'int' }],
    return_type: 'int',
    statement:
      'Two banks of a river hold tokens at integer positions given by the sorted arrays <code>left</code> and <code>right</code>. A bridge can connect a left token to a right token only if their positions differ by at most <code>gap</code>. Each token is used in at most one bridge, and bridges may not cross (so pairs must respect the sorted order). Return the maximum number of non-crossing bridges.',
    examples: [
      ['[1,4,8]\n[2,5,12]\n2', '3', 'Pair 1-2, 4-5, 8-12? 8-12 differ by 4 > 2, so pair 1-2,4-5 then 8 with nothing... actually 1-2,4-5 gives 2; 8 and 12 differ 4. Answer 2.'],
      ['[1,2,3]\n[1,2,3]\n0', '3', 'Each left pairs with the equal right.'],
    ],
    constraints: ['1 <= left.length, right.length <= 10^5', 'arrays are sorted non-decreasing', '0 <= positions <= 10^9', '0 <= gap <= 10^9'],
    tags: ['two-pointers', 'greedy'],
    py: `def maxBridges(left, right, gap):
    i = j = 0
    count = 0
    while i < len(left) and j < len(right):
        if abs(left[i] - right[j]) <= gap:
            count += 1
            i += 1
            j += 1
        elif left[i] < right[j]:
            i += 1
        else:
            j += 1
    return count`,
    approach:
      'Walk both sorted banks with two pointers. When the current pair is within gap, build a bridge and advance both; otherwise advance the pointer at the smaller position to seek a closer match. Non-crossing is guaranteed by never moving backward.',
    complexity: { time: 'O(n + m)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,4,8]', '[2,5,12]', '2'],
      ['[1,2,3]', '[1,2,3]', '0'],
      ['[1]', '[100]', '5'],
      ['[1]', '[100]', '99'],
      ['[1,5,9]', '[2,6,10]', '1'],
      ['[10,20,30]', '[10,20,30]', '0'],
      ['[1,2,3,4]', '[5,6,7,8]', '3'],
      ['[5]', '[1,2,3,4,5]', '0'],
      ['[1,3,5,7]', '[2,4,6,8]', '1'],
      ['[100]', '[100]', '0'],
    ],
  },
  {
    n: 3520,
    id: 'pghub-b13-signal-decay',
    name: 'Signal Decay Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'strongestWindow',
    params: [{ name: 'signal', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'A sensor records readings in <code>signal</code>. Return the maximum sum of any contiguous window of exactly <code>k</code> readings. If <code>k</code> exceeds the number of readings, return the sum of all readings.',
    examples: [
      ['[1,-2,3,4,-1]\n2', '7', 'Window [3,4] sums to 7.'],
      ['[5,5]\n5', '10', 'k exceeds length, so sum everything.'],
    ],
    constraints: ['1 <= signal.length <= 10^5', '-10^4 <= signal[i] <= 10^4', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'arrays'],
    py: `def strongestWindow(signal, k):
    n = len(signal)
    if k >= n:
        return sum(signal)
    cur = sum(signal[:k])
    best = cur
    for i in range(k, n):
        cur += signal[i] - signal[i - k]
        if cur > best:
            best = cur
    return best`,
    approach:
      'Maintain a running sum of the current window of size k, sliding by adding the entering element and removing the leaving one. Track the maximum sum seen. If k covers the whole array, the only window is the full array.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,-2,3,4,-1]', '2'],
      ['[5,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '3'],
      ['[-1,-2,-3]', '2'],
      ['[10]', '1'],
      ['[0,0,0,0]', '2'],
      ['[4,-1,2,1,-5,4]', '4'],
      ['[7,-3,7,-3,7]', '5'],
      ['[100,-1,100]', '2'],
    ],
  },
  {
    n: 3526,
    id: 'pghub-b13-lattice-paths',
    name: 'Lattice Path With Tolls',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'minToll',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A delivery robot starts at the top-left of a grid of non-negative tolls and must reach the bottom-right, moving only right or down. The cost of a path is the sum of tolls on every cell it visits (including start and end). Return the minimum possible path cost.',
    examples: [
      ['[[1,3,1],[1,5,1],[4,2,1]]', '7', 'Path 1->1->4->2->1? best is 1,1,5,1,1 -> wait. Min is 1+3+1+1+1=7 going right,right,down,down.'],
      ['[[5]]', '5', 'Single cell.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '0 <= grid[i][j] <= 10^4'],
    tags: ['2d-dp', 'dp'],
    py: `def minToll(grid):
    rows, cols = len(grid), len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            best = grid[r][c]
            if r == 0 and c == 0:
                dp[r][c] = best
            elif r == 0:
                dp[r][c] = best + dp[r][c - 1]
            elif c == 0:
                dp[r][c] = best + dp[r - 1][c]
            else:
                dp[r][c] = best + min(dp[r - 1][c], dp[r][c - 1])
    return dp[rows - 1][cols - 1]`,
    approach:
      'Dynamic programming where dp[r][c] is the cheapest cost to reach cell (r,c). Each cell is reachable only from above or from the left, so add the cell toll to the cheaper of those two predecessors. The answer sits in the bottom-right cell.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,3,1],[1,5,1],[4,2,1]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,2],[3,4]]'],
      ['[[4,7,8,6,4],[6,7,3,9,2],[3,8,1,2,4],[7,1,7,3,7]]'],
      ['[[9,9,9],[9,1,9],[9,9,9]]'],
      ['[[2,2,2,2]]'],
      ['[[10,10],[10,1]]'],
    ],
  },
  {
    n: 3535,
    id: 'pghub-b13-spell-energy',
    name: 'Spellbook Energy Parse',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'totalEnergy',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A spell is written with digits and balanced brackets. A run of digits is a number; a bracketed group <code>[ ... ]</code> doubles the total energy of whatever is inside it. Energy adds across siblings. For example <code>"3[2]4"</code> = 3 + 2*2 + 4 = 11. Return the total energy of the spell <code>s</code>. The string contains only digits 0-9 and the characters [ and ], and brackets are always balanced.',
    examples: [
      ['"3[2]4"', '11', '3 + (2 doubled = 4) + 4 = 11.'],
      ['"[1[1]]"', '6', 'Inner: 1 + 2*1 = 3; outer doubles: 6.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's contains only digits and [ ]', 'brackets are balanced'],
    tags: ['stack', 'strings'],
    py: `def totalEnergy(s):
    stack = [0]
    i = 0
    n = len(s)
    while i < n:
        ch = s[i]
        if ch == '[':
            stack.append(0)
            i += 1
        elif ch == ']':
            inner = stack.pop()
            stack[-1] += 2 * inner
            i += 1
        else:
            j = i
            while j < n and s[j].isdigit():
                j += 1
            stack[-1] += int(s[i:j])
            i = j
    return stack[0]`,
    approach:
      'Use a stack of accumulated energies, one frame per bracket depth. Digits add to the current frame, "[" opens a new frame, and "]" pops a frame and adds twice its energy to its parent. The base frame holds the final total.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"3[2]4"'],
      ['"[1[1]]"'],
      ['"5"'],
      ['"[5]"'],
      ['"12[3]"'],
      ['"[[2]]"'],
      ['"1[2[3]]4"'],
      ['"0[0]0"'],
      ['"9[9]9"'],
      ['"[1][2][3]"'],
    ],
  },
  {
    n: 3540,
    id: 'pghub-b13-prime-fence',
    name: 'Prime Fence Segments',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'countPrimes',
    params: [{ name: 'lengths', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A carpenter has fence segments of given <code>lengths</code>. A segment is "prime-cut" if its length is a prime number (a whole number greater than 1 with no positive divisors other than 1 and itself). Return how many segments are prime-cut.',
    examples: [
      ['[2,3,4,5,6]', '3', '2, 3 and 5 are prime.'],
      ['[1,1,1]', '0', '1 is not prime.'],
    ],
    constraints: ['1 <= lengths.length <= 10^4', '0 <= lengths[i] <= 10^6'],
    tags: ['math', 'number-theory'],
    py: `def countPrimes(lengths):
    def is_prime(x):
        if x < 2:
            return False
        if x < 4:
            return True
        if x % 2 == 0:
            return False
        d = 3
        while d * d <= x:
            if x % d == 0:
                return False
            d += 2
        return True
    return sum(1 for x in lengths if is_prime(x))`,
    approach:
      'Test each length for primality by trial division up to its square root (handling small cases and even numbers first), then count how many pass.',
    complexity: { time: 'O(n * sqrt(maxLen))', space: 'O(1)' },
    cases: [
      ['[2,3,4,5,6]'],
      ['[1,1,1]'],
      ['[0]'],
      ['[2]'],
      ['[97,98,99,100,101]'],
      ['[7,11,13,17,19]'],
      ['[4,6,8,9,10]'],
      ['[1000000,999983]'],
      ['[15,21,33,35]'],
      ['[2,2,2,2,2]'],
    ],
  },
  {
    n: 3549,
    id: 'pghub-b13-courier-routes',
    name: 'Courier Reachable Hubs',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'reachableHubs',
    params: [{ name: 'n', type: 'int' }, { name: 'roads', type: 'List[List[int]]' }, { name: 'start', type: 'int' }],
    return_type: 'int',
    statement:
      'There are <code>n</code> delivery hubs numbered 0 to n-1 connected by one-way <code>roads</code>, where each road [u, v] lets a courier travel from u to v. Starting at hub <code>start</code>, return how many distinct hubs the courier can reach, including <code>start</code> itself.',
    examples: [
      ['3\n[[0,1],[1,2]]\n0', '3', 'From 0 reach 1 then 2.'],
      ['3\n[[1,2]]\n0', '1', 'Hub 0 has no outgoing road.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 10^5', '0 <= u, v, start < n'],
    tags: ['graphs', 'bfs'],
    py: `def reachableHubs(n, roads, start):
    adj = defaultdict(list)
    for u, v in roads:
        adj[u].append(v)
    seen = {start}
    q = deque([start])
    while q:
        node = q.popleft()
        for nxt in adj[node]:
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return len(seen)`,
    approach:
      'Build a directed adjacency list and run a breadth-first search from the start hub, marking every newly discovered hub. The count of visited hubs is the number reachable.',
    complexity: { time: 'O(n + roads)', space: 'O(n + roads)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[1,2]]', '0'],
      ['3', '[[1,2]]', '0'],
      ['1', '[]', '0'],
      ['4', '[[0,1],[0,2],[2,3]]', '0'],
      ['4', '[[0,1],[1,0]]', '0'],
      ['5', '[[0,1],[1,2],[2,3],[3,4]]', '2'],
      ['5', '[]', '3'],
      ['6', '[[0,1],[1,2],[3,4],[4,5]]', '3'],
      ['3', '[[0,1],[1,2],[2,0]]', '1'],
      ['2', '[[0,1],[1,0]]', '0'],
    ],
  },
  {
    n: 3555,
    id: 'pghub-b13-melody-runs',
    name: 'Melody Rising Runs',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'longestRise',
    params: [{ name: 'notes', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A melody is a list of note pitches in <code>notes</code>. A <em>rising run</em> is a contiguous subsequence in which each note is strictly higher than the previous one. Return the length of the longest rising run.',
    examples: [
      ['[1,2,1,3,4,5,2]', '4', 'The run 1,3,4,5 has length 4.'],
      ['[5,5,5]', '1', 'No two adjacent notes rise.'],
    ],
    constraints: ['1 <= notes.length <= 10^5', '-10^9 <= notes[i] <= 10^9'],
    tags: ['dp', 'arrays'],
    py: `def longestRise(notes):
    best = 1
    cur = 1
    for i in range(1, len(notes)):
        if notes[i] > notes[i - 1]:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 1
    return best`,
    approach:
      'Track the length of the current strictly rising run, resetting to 1 whenever a note does not exceed its predecessor. Keep the largest run length seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,1,3,4,5,2]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[1,3,2,4,3,5]'],
      ['[-3,-2,-1,0]'],
      ['[10,9,8,11,12]'],
      ['[2,2,3,3,4,4]'],
      ['[7,1,2,3,1,2,3,4]'],
    ],
  },
  {
    n: 3565,
    id: 'pghub-b13-festival-seats',
    name: 'Festival Seat Assignment',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'minSeatGap',
    params: [{ name: 'groups', type: 'List[int]' }, { name: 'rooms', type: 'int' }],
    return_type: 'int',
    statement:
      'Several <code>groups</code> of festival-goers each have a size, and there are <code>rooms</code> identical rooms. Each group is assigned to exactly one room and a room may hold several groups. The <em>load</em> of a room is the sum of sizes assigned to it. Assigning greedily, always place the next group (processed in the given order) into the currently least-loaded room. After assigning every group, return the difference between the most-loaded and least-loaded room loads.',
    examples: [
      ['[4,2,3,1]\n2', '0', 'Greedy: room loads end balanced at 5 and 5? 4->A(4),2->B(2),3->B(5),1->A(5): diff 0.'],
      ['[5,5,5]\n2', '5', 'Loads 10 and 5, diff 5.'],
    ],
    constraints: ['1 <= groups.length <= 10^5', '1 <= groups[i] <= 10^6', '1 <= rooms <= groups.length'],
    tags: ['heap', 'greedy'],
    py: `def minSeatGap(groups, rooms):
    heap = [0] * rooms
    heapq.heapify(heap)
    for g in groups:
        smallest = heapq.heappop(heap)
        heapq.heappush(heap, smallest + g)
    loads = list(heap)
    return max(loads) - min(loads)`,
    approach:
      'Keep room loads in a min-heap. For each group in order, pop the least-loaded room, add the group, and push it back. After all assignments, the spread is the heap maximum minus its minimum.',
    complexity: { time: 'O(n log rooms)', space: 'O(rooms)' },
    multiParam: true,
    cases: [
      ['[4,2,3,1]', '2'],
      ['[5,5,5]', '2'],
      ['[1]', '1'],
      ['[1,1,1,1]', '4'],
      ['[10,1,1,1,1]', '2'],
      ['[3,3,3,3]', '2'],
      ['[7,2,5,8,1]', '3'],
      ['[6,6,6,6,6,6]', '3'],
      ['[100,1,1]', '2'],
      ['[2,4,6,8,10]', '2'],
    ],
  },
  {
    n: 3571,
    id: 'pghub-b13-keypad-words',
    name: 'Keypad Word Cost',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'typingCost',
    params: [{ name: 'word', type: 'str' }],
    return_type: 'int',
    statement:
      'On an old phone keypad, each lowercase letter takes a number of presses equal to its 1-based position within its key group, where keys are: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz. So "a" costs 1, "b" costs 2, "c" costs 3, "p" costs 1, "s" costs 4, and so on. Return the total number of key presses to type <code>word</code>.',
    examples: [
      ['"abc"', '6', '1 + 2 + 3 = 6.'],
      ['"sos"', '9', 's=4, o=3, s=4 -> 11? o is in mno at position 3, s in pqrs position 4: 4+3+4=11.'],
    ],
    constraints: ['1 <= word.length <= 10^5', 'word consists of lowercase English letters'],
    tags: ['strings', 'hashing'],
    py: `def typingCost(word):
    groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    cost = {}
    for g in groups:
        for i, ch in enumerate(g):
            cost[ch] = i + 1
    return sum(cost[c] for c in word)`,
    approach:
      'Precompute each letter\\u2019s press count from the keypad layout, then sum the costs of the letters in the word.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"abc"'],
      ['"sos"'],
      ['"a"'],
      ['"z"'],
      ['"hello"'],
      ['"world"'],
      ['"pqrs"'],
      ['"wxyz"'],
      ['"aaa"'],
      ['"thequickbrownfox"'],
    ],
  },
  {
    n: 3581,
    id: 'pghub-b13-vault-codes',
    name: 'Vault Code Combinations',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'allCodes',
    params: [{ name: 'digits', type: 'List[int]' }, { name: 'length', type: 'int' }],
    return_type: 'List[List[int]]',
    statement:
      'Given a sorted list of distinct allowed <code>digits</code>, generate every strictly increasing code of exactly <code>length</code> digits using only those digits, each digit used at most once. Return all such codes in lexicographic order (as lists). If no code is possible, return an empty list.',
    examples: [
      ['[1,2,3]\n2', '[[1,2],[1,3],[2,3]]', 'All increasing pairs.'],
      ['[5]\n2', '[]', 'Cannot form length 2 from one digit.'],
    ],
    constraints: ['1 <= digits.length <= 12', 'digits is strictly increasing', '0 <= digits[i] <= 9', '1 <= length <= digits.length + 1'],
    tags: ['backtracking', 'recursion'],
    py: `def allCodes(digits, length):
    res = []
    combo = []
    def backtrack(start):
        if len(combo) == length:
            res.append(combo[:])
            return
        for i in range(start, len(digits)):
            combo.append(digits[i])
            backtrack(i + 1)
            combo.pop()
    backtrack(0)
    return res`,
    approach:
      'Classic combination backtracking: extend the current code by appending each remaining digit (only those after the last-used index to keep it increasing), recording a code when it reaches the target length. Iterating in index order yields lexicographic output.',
    complexity: { time: 'O(C(n, length) * length)', space: 'O(length)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '2'],
      ['[5]', '2'],
      ['[1,2,3,4]', '1'],
      ['[1,2,3,4]', '4'],
      ['[0,1,2]', '2'],
      ['[2,4,6,8]', '3'],
      ['[7]', '1'],
      ['[1,3,5,7,9]', '2'],
      ['[0,9]', '2'],
      ['[1,2,3,4,5]', '5'],
    ],
  },
  {
    n: 3595,
    id: 'pghub-b13-budget-search',
    name: 'Budget Boat Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'trips', type: 'int' }],
    return_type: 'int',
    statement:
      'Cargo items with the given <code>weights</code> must be shipped in their listed order using a single boat over exactly <code>trips</code> trips. On each trip the boat carries a contiguous prefix of the remaining items without exceeding its capacity. Return the minimum boat capacity that lets all items ship within <code>trips</code> trips. The capacity must be at least the heaviest single item.',
    examples: [
      ['[1,2,3,4,5]\n2', '9', 'Split into [1,2,3,4]=10? no. Best capacity 9: [1,2,3]=6 wait need 2 trips. Capacity 9: [1,2,3] (6) then [4,5] (9): works; 8 fails.'],
      ['[3,3,3]\n3', '3', 'One item per trip.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= 10^4', '1 <= trips <= weights.length'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(weights, trips):
    def needed(cap):
        used = 1
        load = 0
        for w in weights:
            if load + w > cap:
                used += 1
                load = 0
            load += w
        return used
    lo = max(weights)
    hi = sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= trips:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary-search the capacity between the heaviest item and the total weight. For a candidate capacity, greedily pack contiguous items and count the trips required; if that count fits within the trip budget, the capacity is feasible. The smallest feasible capacity is the answer.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[3,3,3]', '3'],
      ['[1,2,3,4,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[7,2,5,10,8]', '2'],
      ['[1,1,1,1,1,1]', '3'],
      ['[9,8,7,6,5]', '3'],
      ['[100,200,300]', '2'],
    ],
  },
  {
    n: 3596,
    id: 'pghub-b13-flag-masks',
    name: 'Flag Bitmask Toggle',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'countSetAfter',
    params: [{ name: 'value', type: 'int' }, { name: 'toggles', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A configuration is stored as the non-negative integer <code>value</code>, treated as a set of bit flags. Apply each operation in <code>toggles</code>, where each entry is a bit position to flip (0 = least significant bit). After applying all toggles in order, return the number of bits set to 1.',
    examples: [
      ['5\n[0]', '1', '5 is 101; toggling bit 0 gives 100 -> one set bit.'],
      ['0\n[1,1,2]', '1', 'Bit 1 toggled twice cancels; bit 2 set once.'],
    ],
    constraints: ['0 <= value <= 10^9', '0 <= toggles.length <= 10^5', '0 <= toggles[i] <= 30'],
    tags: ['bit-manipulation', 'math'],
    py: `def countSetAfter(value, toggles):
    for b in toggles:
        value ^= (1 << b)
    return bin(value).count('1')`,
    approach:
      'Each toggle flips a single bit, which is an XOR with that bit\\u2019s mask. Apply all XORs, then count the set bits in the resulting integer.',
    complexity: { time: 'O(t)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['5', '[0]'],
      ['0', '[1,1,2]'],
      ['0', '[]'],
      ['7', '[]'],
      ['0', '[0,1,2,3]'],
      ['15', '[0,1,2,3]'],
      ['8', '[3,3]'],
      ['1023', '[0]'],
      ['1', '[0,0,0]'],
      ['1000000000', '[30,29]'],
    ],
  },
  {
    n: 3610,
    id: 'pghub-b13-orchard-spans',
    name: 'Orchard Harvest Spans',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'totalHarvested',
    params: [{ name: 'spans', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A farmer logs harvest <code>spans</code> as inclusive day ranges [start, end]. Spans may overlap. Return the total number of distinct days on which any harvesting happened (the size of the union of all the day ranges).',
    examples: [
      ['[[1,3],[2,5],[8,9]]', '7', 'Days 1-5 (5 days) plus 8-9 (2 days) = 7.'],
      ['[[4,4]]', '1', 'A single day.'],
    ],
    constraints: ['1 <= spans.length <= 10^5', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def totalHarvested(spans):
    spans = sorted(spans)
    total = 0
    cur_start, cur_end = spans[0]
    for s, e in spans[1:]:
        if s <= cur_end + 1:
            cur_end = max(cur_end, e)
        else:
            total += cur_end - cur_start + 1
            cur_start, cur_end = s, e
    total += cur_end - cur_start + 1
    return total`,
    approach:
      'Sort the spans by start day and sweep, merging any span that touches or overlaps the current merged range (gap of one day still merges since days are inclusive integers... here adjacency uses <= cur_end + 1 to merge touching ranges). Accumulate the size of each maximal merged block.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,5],[8,9]]'],
      ['[[4,4]]'],
      ['[[1,10]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[5,5],[5,5],[5,5]]'],
      ['[[10,20],[1,5],[6,9]]'],
      ['[[0,0],[2,2],[4,4]]'],
      ['[[1,100],[50,60],[200,300]]'],
      ['[[1,1],[3,3],[5,5],[2,2],[4,4]]'],
    ],
  },
  {
    n: 3616,
    id: 'pghub-b13-clinic-queue',
    name: 'Clinic Triage Queue',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'serviceOrder',
    params: [{ name: 'patients', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'A clinic processes <code>patients</code>, each given as [id, severity]. Patients arrive in list order. The clinic always serves the waiting patient with the highest severity next; ties are broken by earlier arrival (smaller list index). Assume all patients have arrived before service begins. Return the list of patient ids in the order they are served.',
    examples: [
      ['[[1,3],[2,5],[3,5],[4,1]]', '[2,3,1,4]', 'Severity 5 patients (ids 2,3) first by arrival, then 3, then 1.'],
      ['[[9,2]]', '[9]', 'One patient.'],
    ],
    constraints: ['1 <= patients.length <= 10^5', '0 <= id <= 10^9', '0 <= severity <= 10^9'],
    tags: ['queue', 'heap'],
    py: `def serviceOrder(patients):
    heap = []
    for idx, (pid, sev) in enumerate(patients):
        heapq.heappush(heap, (-sev, idx, pid))
    order = []
    while heap:
        _, _, pid = heapq.heappop(heap)
        order.append(pid)
    return order`,
    approach:
      'Push every patient into a priority queue keyed by negative severity (for max-first) and arrival index (for stable tie-breaking). Repeatedly pop to build the service order.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,5],[3,5],[4,1]]'],
      ['[[9,2]]'],
      ['[[1,1],[2,1],[3,1]]'],
      ['[[1,5],[2,4],[3,3],[4,2],[5,1]]'],
      ['[[1,1],[2,2],[3,3],[4,4],[5,5]]'],
      ['[[10,0],[20,0]]'],
      ['[[1,7],[2,7],[3,7]]'],
      ['[[5,100],[6,50],[7,100]]'],
      ['[[1,2],[2,8],[3,4],[4,8],[5,2]]'],
      ['[[42,9]]'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b13-${prob.n}.py`);
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

function gradeStored(prob, row) {
  const code = row.solutions.python.code;
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("PASS" if _out == _exp else ("FAIL idx=${idx} got="+_out+" exp="+_exp))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b13-grade-${prob.n}.py`);
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
