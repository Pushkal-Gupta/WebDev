#!/usr/bin/env node
// Batch 2 of the gap-fill drive. Fills numbering gaps in PGcode_problems with
// GENUINELY ORIGINAL problems tagged "PGHub". Same insert + local-grading logic
// as scripts/fill-gap-problems.js, isolated to its own file so concurrent batches
// editing the shared script don't collide.
//
//   node scripts/fill-gap-problems-batch2.js          # uses BATCH constant
//   node scripts/fill-gap-problems-batch2.js 250 251  # restrict to these numbers
//   node scripts/fill-gap-problems-batch2.js --dry     # author + grade locally, no insert
//
// Test-case `expected` values are produced by ACTUALLY RUNNING the Python solution
// here, so every inserted problem passes its own cases by construction.

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
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

const BATCH = [250, 251, 254, 255, 259, 265, 267, 270, 271, 272, 276, 277, 280, 281, 285];

const PY_SERIALIZER = `
import json, sys
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 250,
    id: 'pghub-plateau-count',
    name: 'Count Flat Plateaus',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countPlateaus',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A <em>plateau</em> is a maximal run of two or more equal consecutive elements in an array. Given an integer array <code>nums</code>, return how many plateaus it contains.',
    examples: [
      ['[1,2,2,3,3,3,4]', '2', 'The runs {2,2} and {3,3,3} are plateaus; the single 1 and 4 are not.'],
      ['[5,5,5,5]', '1', 'One maximal run of equal values.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays'],
    py: `def countPlateaus(nums):
    count = 0
    i = 0
    n = len(nums)
    while i < n:
        j = i
        while j < n and nums[j] == nums[i]:
            j += 1
        if j - i >= 2:
            count += 1
        i = j
    return count`,
    approach:
      'Sweep maximal equal runs with two pointers; a run of length two or more is one plateau. Counting runs is linear.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['[1]'], ['[5,5,5,5]'], ['[1,2,2,3,3,3,4]'], ['[1,2,3,4]'], ['[7,7]'], ['[0,0,1,1,2,2]'], ['[-3,-3,-3]'], ['[1,1,2,1,1]'], ['[9]'], ['[2,2,2,3,4,4]']],
  },
  {
    n: 251,
    id: 'pghub-vowel-window',
    name: 'Densest Vowel Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxVowels',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code> and an integer <code>k</code>, return the maximum number of vowels (a, e, i, o, u) contained in any window of exactly <code>k</code> consecutive characters.',
    examples: [
      ['"abciiidef"\n3', '3', 'The window "iii" holds 3 vowels.'],
      ['"leetcode"\n3', '2', 'The window "eet" holds 2 vowels.'],
    ],
    constraints: ['1 <= k <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['sliding-window', 'strings'],
    py: `def maxVowels(s, k):
    vowels = set("aeiou")
    cur = sum(1 for c in s[:k] if c in vowels)
    best = cur
    for i in range(k, len(s)):
        if s[i] in vowels:
            cur += 1
        if s[i - k] in vowels:
            cur -= 1
        if cur > best:
            best = cur
    return best`,
    approach:
      'Count vowels in the first window, then slide: add the entering character and drop the leaving one, tracking the peak. Each step is O(1).',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"abciiidef"', '3'],
      ['"leetcode"', '3'],
      ['"aeiou"', '5'],
      ['"bcdfg"', '2'],
      ['"a"', '1'],
      ['"rhythm"', '4'],
      ['"aaaaa"', '2'],
      ['"hellothere"', '4'],
      ['"xyzaeiou"', '3'],
      ['"programming"', '6'],
    ],
  },
  {
    n: 254,
    id: 'pghub-stable-shift',
    name: 'Stable Even-Odd Shift',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'stableShift',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given an integer array <code>nums</code>, return a new array with all even values first, then all odd values, while preserving the original relative order WITHIN each group (a stable partition by parity).',
    examples: [
      ['[3,1,2,4,7,6]', '[2,4,6,3,1,7]', 'Evens 2,4,6 keep their order; odds 3,1,7 keep theirs.'],
      ['[1,3,5]', '[1,3,5]', 'No evens, so order is unchanged.'],
    ],
    constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays'],
    py: `def stableShift(nums):
    evens = [x for x in nums if x % 2 == 0]
    odds = [x for x in nums if x % 2 != 0]
    return evens + odds`,
    approach:
      'A list comprehension preserves order, so collecting evens then odds in two passes yields a stable parity partition.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [['[]'], ['[3,1,2,4,7,6]'], ['[1,3,5]'], ['[2,4,6]'], ['[0]'], ['[-2,-3,-4,-5]'], ['[10,9,8,7,6]'], ['[1]'], ['[2,2,1,1,2,1]'], ['[-1,0,-1,0]']],
  },
  {
    n: 255,
    id: 'pghub-ledger-balance',
    name: 'Running Ledger Low Point',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'lowestBalance',
    params: [{ name: 'deltas', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A bank account starts at balance 0. Each entry in <code>deltas</code> is applied in order (deposits positive, withdrawals negative). Return the lowest balance the account ever held, including the starting balance of 0.',
    examples: [
      ['[5,-10,3]', '-5', 'Balances are 5, -5, -2; the minimum is -5.'],
      ['[1,2,3]', '0', 'The balance never drops below the starting 0.'],
    ],
    constraints: ['0 <= deltas.length <= 10^5', '-10^9 <= deltas[i] <= 10^9'],
    tags: ['prefix-sum', 'arrays'],
    py: `def lowestBalance(deltas):
    balance = 0
    low = 0
    for d in deltas:
        balance += d
        if balance < low:
            low = balance
    return low`,
    approach:
      'Accumulate a running balance and track the minimum seen so far, seeded with the starting 0. One linear pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['[]'], ['[5,-10,3]'], ['[1,2,3]'], ['[-1]'], ['[10,-5,-5,-5]'], ['[0,0,0]'], ['[-3,3,-3,3]'], ['[100]'], ['[-100]'], ['[2,-1,2,-5,1]']],
  },
  {
    n: 259,
    id: 'pghub-tower-visible',
    name: 'Visible Towers From Left',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'visibleTowers',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You look along a row of towers from the left. A tower is visible if it is strictly taller than every tower before it. Given <code>heights</code>, return how many towers are visible.',
    examples: [
      ['[3,1,4,1,5]', '3', 'Towers 3, 4, 5 each beat all earlier ones.'],
      ['[5,4,3]', '1', 'Only the first tower is visible.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^9'],
    tags: ['stack', 'arrays'],
    py: `def visibleTowers(heights):
    tallest = -1
    count = 0
    for h in heights:
        if h > tallest:
            count += 1
            tallest = h
    return count`,
    approach:
      'Track the tallest tower seen so far; each strictly taller tower is newly visible and raises the bar. A single pass suffices.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['[3,1,4,1,5]'], ['[5,4,3]'], ['[1]'], ['[1,2,3,4,5]'], ['[5,5,5,5]'], ['[0,0,1,0,2]'], ['[10,1,1,1,11]'], ['[7]'], ['[2,2,3,3,4]'], ['[9,8,7,6,5,4]']],
  },
  {
    n: 265,
    id: 'pghub-grid-diagonal-sum',
    name: 'Grid Diagonal Bands',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'diagonalSums',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'Given an <code>m x n</code> integer grid, group cells by the diagonal they lie on, where a diagonal is the set of cells with the same value of <code>row + col</code>. Return a list whose i-th entry is the sum of the diagonal with <code>row + col == i</code>, ordered from i = 0 upward.',
    examples: [
      ['[[1,2],[3,4]]', '[1,5,4]', 'Diagonal 0 is {1}, diagonal 1 is {2,3}=5, diagonal 2 is {4}.'],
      ['[[5]]', '[5]', 'A single cell forms diagonal 0.'],
    ],
    constraints: ['1 <= m, n <= 1000', '-10^9 <= grid[i][j] <= 10^9'],
    tags: ['matrix', 'arrays'],
    py: `def diagonalSums(grid):
    m = len(grid)
    n = len(grid[0])
    res = [0] * (m + n - 1)
    for i in range(m):
        for j in range(n):
            res[i + j] += grid[i][j]
    return res`,
    approach:
      'Cells on the same anti-diagonal share row+col, which ranges from 0 to m+n-2. Accumulate each cell into its diagonal bucket in one traversal.',
    complexity: { time: 'O(m*n)', space: 'O(m+n)' },
    cases: [
      ['[[1,2],[3,4]]'],
      ['[[5]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,1],[1,1]]'],
      ['[[0]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[10,20,30],[40,50,60]]'],
      ['[[2,0,2],[0,2,0],[2,0,2]]'],
    ],
  },
  {
    n: 267,
    id: 'pghub-coin-reach',
    name: 'Exact Coin Reach',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'canMake',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'bool',
    statement:
      'Given a list of positive coin denominations <code>coins</code> (each usable unlimited times) and a non-negative <code>target</code>, return <code>true</code> if some combination of coins sums exactly to <code>target</code>, otherwise <code>false</code>.',
    examples: [
      ['[3,5]\n8', 'true', '3 + 5 = 8.'],
      ['[3,5]\n7', 'false', 'No combination of 3s and 5s makes 7.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', '0 <= target <= 10^4'],
    tags: ['dp'],
    py: `def canMake(coins, target):
    reachable = [False] * (target + 1)
    reachable[0] = True
    for amt in range(1, target + 1):
        for c in coins:
            if c <= amt and reachable[amt - c]:
                reachable[amt] = True
                break
    return reachable[target]`,
    approach:
      'Unbounded subset-sum DP: amount 0 is reachable, and any amount is reachable if subtracting some coin leaves a reachable amount. Fill bottom-up to target.',
    complexity: { time: 'O(target * coins)', space: 'O(target)' },
    multiParam: true,
    cases: [
      ['[3,5]', '8'],
      ['[3,5]', '7'],
      ['[1]', '0'],
      ['[2]', '5'],
      ['[2]', '6'],
      ['[7,11]', '0'],
      ['[1,5,10]', '13'],
      ['[4,6]', '14'],
      ['[4,6]', '9'],
      ['[3,7,11]', '100'],
    ],
  },
  {
    n: 270,
    id: 'pghub-pair-product-sign',
    name: 'Sign of Pair Product',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'productSign',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, return the sign of the product of all its elements: <code>1</code> if the product is positive, <code>-1</code> if negative, and <code>0</code> if any element is zero. Do not compute the actual product.',
    examples: [
      ['[1,-2,-3,4]', '1', 'Two negatives make the product positive.'],
      ['[1,5,0,2]', '0', 'A zero forces the product to zero.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['math', 'arrays'],
    py: `def productSign(nums):
    sign = 1
    for x in nums:
        if x == 0:
            return 0
        if x < 0:
            sign = -sign
    return sign`,
    approach:
      'Track only the sign: a zero short-circuits to 0, and each negative flips the running sign. Avoids overflow and is linear.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['[1,-2,-3,4]'], ['[1,5,0,2]'], ['[-1]'], ['[1]'], ['[-1,-1,-1]'], ['[2,3,4]'], ['[0]'], ['[-5,5]'], ['[-2,-2,-2,-2]'], ['[1000000000,-1]']],
  },
  {
    n: 271,
    id: 'pghub-snake-decode',
    name: 'Snake Path Decode',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'snakeRead',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'Read an <code>m x n</code> grid in boustrophedon (snake) order: the first row left-to-right, the second row right-to-left, the third left-to-right, and so on. Return the values in that order.',
    examples: [
      ['[[1,2,3],[4,5,6]]', '[1,2,3,6,5,4]', 'Row 0 forward, row 1 reversed.'],
      ['[[1],[2],[3]]', '[1,2,3]', 'Single-column rows alternate but read identically.'],
    ],
    constraints: ['1 <= m, n <= 1000', '-10^9 <= grid[i][j] <= 10^9'],
    tags: ['matrix', 'simulation'],
    py: `def snakeRead(grid):
    out = []
    for i, row in enumerate(grid):
        if i % 2 == 0:
            out.extend(row)
        else:
            out.extend(reversed(row))
    return out`,
    approach:
      'Iterate rows; emit even-indexed rows as-is and odd-indexed rows reversed. Direct simulation of the snake traversal.',
    complexity: { time: 'O(m*n)', space: 'O(m*n)' },
    cases: [
      ['[[1,2,3],[4,5,6]]'],
      ['[[1],[2],[3]]'],
      ['[[1,2,3,4]]'],
      ['[[5]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,1],[2,2],[3,3],[4,4]]'],
      ['[[-1,-2,-3]]'],
      ['[[0,0],[0,0]]'],
      ['[[7,8,9],[10,11,12],[13,14,15]]'],
      ['[[1,2],[3,4]]'],
    ],
  },
  {
    n: 272,
    id: 'pghub-trim-tree-leaves',
    name: 'Prune Light Leaves',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'survivingNodes',
    params: [{ name: 'parent', type: 'List[int]' }, { name: 'value', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'A rooted tree on n nodes is given by <code>parent</code>, where <code>parent[i]</code> is the parent of node i and the root has parent <code>-1</code>. Each node has a <code>value</code>. Repeatedly remove any current leaf whose value is strictly less than <code>limit</code>, until no such leaf remains. Return how many nodes survive.',
    examples: [
      ['[-1,0,0,1]\n[10,1,9,2]\n5', '2', 'Leaf node 3 (value 2 < 5) is removed; node 1 (value 1) is now a leaf and removed; root node 0 (value 10) and node 2 (value 9) survive.'],
      ['[-1,0]\n[1,1]\n5', '0', 'Leaf node 1 (value 1) is pruned; the root then becomes a leaf with value 1 < 5 and is pruned too, leaving nobody.'],
    ],
    constraints: ['1 <= n <= 10^5', 'exactly one root with parent -1', '-10^9 <= value[i] <= 10^9'],
    tags: ['trees', 'graph'],
    py: `def survivingNodes(parent, value, limit):
    n = len(parent)
    children = [0] * n
    for p in parent:
        if p != -1:
            children[p] += 1
    alive = [True] * n
    from collections import deque
    q = deque(i for i in range(n) if children[i] == 0 and value[i] < limit)
    while q:
        node = q.popleft()
        if not alive[node]:
            continue
        alive[node] = False
        p = parent[node]
        if p != -1:
            children[p] -= 1
            if children[p] == 0 and value[p] < limit and alive[p]:
                q.append(p)
    return sum(1 for x in alive if x)`,
    approach:
      'Count children per node, then run a queue of current leaves below the limit. Removing a leaf decrements its parent child count; if the parent becomes a qualifying leaf it joins the queue. The root is pruned only if it itself becomes a low leaf. Linear in nodes.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[-1,0,0,1]', '[10,1,9,2]', '5'],
      ['[-1,0]', '[1,1]', '5'],
      ['[-1]', '[3]', '5'],
      ['[-1]', '[10]', '5'],
      ['[-1,0,1,2]', '[1,1,1,1]', '5'],
      ['[-1,0,0,0]', '[100,1,1,1]', '50'],
      ['[-1,0,1,1,2]', '[9,8,7,6,5]', '8'],
      ['[-1,0,0]', '[0,0,0]', '1'],
      ['[-1,0,1,2,3]', '[5,5,5,5,5]', '5'],
      ['[-1,0,0,2,2]', '[1,2,3,4,5]', '4'],
    ],
  },
  {
    n: 276,
    id: 'pghub-unique-skyline',
    name: 'Distinct Skyline Widths',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'distinctWidths',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given building <code>heights</code> from left to right, the <em>width</em> of a building is the number of buildings of the same height anywhere in the row. Return how many distinct width values occur.',
    examples: [
      ['[1,2,2,3,3,3]', '3', 'Height 1 has width 1, height 2 width 2, height 3 width 3 -> widths {1,2,3} -> 3 distinct.'],
      ['[5,5,7,7]', '1', 'Both heights have width 2 -> a single distinct width.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^9'],
    tags: ['hash-map', 'arrays'],
    py: `def distinctWidths(heights):
    counts = {}
    for h in heights:
        counts[h] = counts.get(h, 0) + 1
    return len(set(counts.values()))`,
    approach:
      'Tally how many times each height appears, then count the distinct frequency values. Two hash passes, both linear.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [['[1,2,2,3,3,3]'], ['[5,5,7,7]'], ['[1]'], ['[4,4,4,4]'], ['[1,2,3,4]'], ['[0,0,1,2,2,2]'], ['[9,9,9,8,8,7]'], ['[10]'], ['[2,2,3,3,4,4,5,5]'], ['[1,1,1,2,2,3]']],
  },
  {
    n: 277,
    id: 'pghub-meeting-overlap',
    name: 'Peak Concurrent Meetings',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxOverlap',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each meeting is a half-open interval <code>[start, end)</code>. Given a list of <code>meetings</code>, return the maximum number that are simultaneously in progress at any single moment.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '2', 'At time 2-4 both [1,4] and [2,5] run; [7,9] never overlaps them.'],
      ['[[0,1],[1,2],[2,3]]', '1', 'Each meeting ends exactly when the next begins, so they never overlap.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def maxOverlap(meetings):
    events = []
    for s, e in meetings:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))
    cur = 0
    best = 0
    for _, delta in events:
        cur += delta
        if cur > best:
            best = cur
    return best`,
    approach:
      'Convert to +1 start / -1 end events, sort by time with ends ordered before starts at equal times (half-open), and sweep, tracking the peak concurrency.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[0,1],[1,2],[2,3]]'],
      ['[[1,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[0,100],[10,20],[15,25],[50,60]]'],
      ['[[5,6],[5,6]]'],
      ['[[0,3],[1,2],[1,2],[2,4]]'],
      ['[[1,2],[2,3],[1,3]]'],
    ],
  },
  {
    n: 280,
    id: 'pghub-zip-checksum',
    name: 'Interleaved Checksum',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'checksum',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Compute a checksum of a digit string <code>s</code>: add each digit at an even index and subtract each digit at an odd index (0-based). Return the resulting integer.',
    examples: [
      ['"1234"', '-2', '1 - 2 + 3 - 4 = -2.'],
      ['"9"', '9', 'A single even-index digit.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of decimal digits'],
    tags: ['strings', 'math'],
    py: `def checksum(s):
    total = 0
    for i, ch in enumerate(s):
        d = ord(ch) - ord("0")
        if i % 2 == 0:
            total += d
        else:
            total -= d
    return total`,
    approach:
      'Walk the digits once, adding on even positions and subtracting on odd positions. Parity of the index decides the sign.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['"1234"'], ['"9"'], ['"0000"'], ['"55"'], ['"12345"'], ['"99999"'], ['"10101"'], ['"246810"'], ['"7"'], ['"31415926"']],
  },
  {
    n: 281,
    id: 'pghub-island-perimeter',
    name: 'Single Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'perimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A grid of 0s (water) and 1s (land) contains land cells. Return the total perimeter of the land: each land cell contributes 4, minus 1 for every shared edge with an adjacent land cell (up/down/left/right).',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped region has perimeter 12.'],
      ['[[1]]', '4', 'A lone cell has all four sides exposed.'],
    ],
    constraints: ['1 <= m, n <= 1000', 'grid[i][j] is 0 or 1'],
    tags: ['matrix', 'graph'],
    py: `def perimeter(grid):
    m = len(grid)
    n = len(grid[0])
    total = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == 1:
                total += 4
                if i > 0 and grid[i - 1][j] == 1:
                    total -= 2
                if j > 0 and grid[i][j - 1] == 1:
                    total -= 2
    return total`,
    approach:
      'Each land cell adds 4 edges; for every adjacency to an already-counted upper or left neighbor, subtract 2 (both cells lose that shared edge). One traversal counts each shared edge once.',
    complexity: { time: 'O(m*n)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,0,1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[0,1],[1,0]]'],
      ['[[1,0,1],[0,1,0],[1,0,1]]'],
    ],
  },
  {
    n: 285,
    id: 'pghub-binary-gap',
    name: 'Widest Binary Gap',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'widestGap',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A binary gap is a maximal run of consecutive 0 bits that is surrounded by 1 bits on both sides within the binary representation of a positive integer <code>n</code>. Return the length of the widest such gap, or 0 if none exists.',
    examples: [
      ['9', '2', '9 is 1001; the gap of two 0s sits between the 1s.'],
      ['15', '0', '15 is 1111; there are no internal zeros.'],
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
    tags: ['bit-manipulation', 'math'],
    py: `def widestGap(n):
    bits = bin(n)[2:]
    best = 0
    cur = -1
    for b in bits:
        if b == "1":
            if cur >= 0 and cur > best:
                best = cur
            cur = 0
        elif cur >= 0:
            cur += 1
    return best`,
    approach:
      'Scan the binary digits; start counting zeros only after the first 1, and finalize a gap each time a closing 1 appears. Track the longest closed run.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [['9'], ['15'], ['1'], ['1041'], ['32'], ['529'], ['20'], ['6'], ['2147483647'], ['1024']],
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
  const tmp = path.join(os.tmpdir(), `pghub-b2-${prob.n}.py`);
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
  const body = prob.py
    .replace(
      new RegExp(
        `^def ${prob.method_name}\\(${prob.params
          .map((p) => p.name)
          .join(', ')
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\):\\n`
      ),
      ''
    )
    .split('\n')
    .map((l) => (l ? '        ' + l : l))
    .join('\n');
  return `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);
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
    if (haveNums.has(prob.n)) {
      console.log(`  skip #${prob.n} (${prob.id}) — number already present`);
      continue;
    }
    if (haveIds.has(prob.id)) {
      console.log(`  skip #${prob.n} (${prob.id}) — id already present`);
      continue;
    }
    const test_cases = runPythonExpected(prob);
    const tags = Array.from(new Set(['PGHub', ...prob.tags]));
    rows.push({
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
    });
    console.log(
      `  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, sample expected: ${test_cases[0].expected}`
    );
  }

  if (!rows.length) {
    console.log('Nothing new to insert.');
    return;
  }

  if (DRY) {
    console.log(`\n[DRY] Would insert ${rows.length} rows. Skipping write.`);
    return;
  }

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
  for (const c of check) console.log(`  #${c.leetcode_number} ${c.name} tags=${JSON.stringify(c.tags)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
