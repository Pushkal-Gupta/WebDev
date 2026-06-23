#!/usr/bin/env node
// Batch 50 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3383,3384,3385,3386,3390,3391,3400,3401,3406,3415,3416,3422,3431,3437,3450
//
//   node scripts/fill-gap-problems-batch50.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch50.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch50.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3383, 3384, 3385, 3386, 3390, 3391, 3400, 3401, 3406, 3415, 3416, 3422, 3431, 3437, 3450];

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
    n: 3383,
    id: 'pghub-b50-meeting-gap',
    name: 'Longest Free Gap',
    topic_id: 'intervals',
    difficulty: 'Easy',
    method_name: 'longestGap',
    params: [
      { name: 'meetings', type: 'List[List[int]]' },
      { name: 'dayEnd', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You have a workday that runs from minute <code>0</code> to minute <code>dayEnd</code>. Each entry <code>[start, end]</code> in <code>meetings</code> is an inclusive-start, exclusive-end busy block (they may overlap). Return the length of the longest stretch of time within <code>[0, dayEnd]</code> during which you are completely free.',
    examples: [
      ['[[1,3],[6,8]]\n10', '3', 'Free stretches are [0,1)=1, [3,6)=3, [8,10)=2; the longest is 3.'],
      ['[[0,10]]\n10', '0', 'The single meeting covers the whole day, leaving no free time.'],
    ],
    constraints: ['0 <= meetings.length <= 10^5', '0 <= start < end <= dayEnd', '1 <= dayEnd <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def longestGap(meetings, dayEnd):
    if not meetings:
        return dayEnd
    order = sorted(meetings, key=lambda x: x[0])
    best = 0
    cursor = 0
    for s, e in order:
        if s > cursor:
            best = max(best, s - cursor)
        cursor = max(cursor, e)
    if dayEnd > cursor:
        best = max(best, dayEnd - cursor)
    return best`,
    approach:
      'Sort meetings by start time and sweep a cursor that marks the latest busy minute reached so far. Before each meeting, the gap between the cursor and the meeting start is free time; track the largest. Extend the cursor past overlapping blocks using a running max of end times, and finally account for free time after the last meeting until dayEnd.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[[1,3],[6,8]]', '10'],
      ['[[0,10]]', '10'],
      ['[]', '5'],
      ['[[2,4],[3,6],[7,9]]', '12'],
      ['[[0,2],[2,4],[4,6]]', '6'],
      ['[[5,6]]', '10'],
      ['[[1,2],[8,9]]', '10'],
      ['[[0,1]]', '1'],
      ['[[3,5],[1,4]]', '10'],
      ['[[0,3],[5,8],[9,10]]', '10'],
    ],
  },
  {
    n: 3384,
    id: 'pghub-b50-digit-spread',
    name: 'Digit Spread Sum',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'digitSpread',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'For a non-negative integer <code>n</code>, the digit spread is the difference between its largest and smallest decimal digits. Return the sum of digit spreads of every integer from <code>0</code> to <code>n</code> inclusive.',
    examples: [
      ['12', '3', 'Spreads: 0..9 are 0 each, 10->1, 11->0, 12->1, summing to 3.'],
      ['9', '0', 'Single-digit numbers have equal max and min digit, so every spread is 0.'],
    ],
    constraints: ['0 <= n <= 10^6'],
    tags: ['math', 'simulation'],
    py: `def digitSpread(n):
    total = 0
    for x in range(n + 1):
        d = str(x)
        total += max(d) != min(d) and (int(max(d)) - int(min(d))) or 0
    return total`,
    approach:
      'For each value from 0 to n, look at its decimal digits, take the difference between the maximum and minimum digit, and accumulate. Comparing characters works because digit characters order the same as their numeric values. The loop is linear in n and each step costs digit-length work.',
    complexity: { time: 'O(n log n)', space: 'O(log n)' },
    cases: [
      ['12'],
      ['9'],
      ['0'],
      ['19'],
      ['100'],
      ['55'],
      ['21'],
      ['1000'],
      ['7'],
      ['250'],
    ],
  },
  {
    n: 3385,
    id: 'pghub-b50-reverse-blocks',
    name: 'Reverse Fixed Blocks',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'reverseBlocks',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Split <code>nums</code> into consecutive blocks of size <code>k</code> from the left. Reverse each full block in place; a trailing block with fewer than <code>k</code> elements is left unchanged. Return the resulting list.',
    examples: [
      ['[1,2,3,4,5]\n2', '[2,1,4,3,5]', 'Blocks [1,2] and [3,4] reverse; the lone 5 stays put.'],
      ['[1,2,3]\n4', '[1,2,3]', 'The only block is shorter than k, so nothing reverses.'],
    ],
    constraints: ['0 <= nums.length <= 10^5', '1 <= k <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def reverseBlocks(nums, k):
    res = list(nums)
    n = len(res)
    i = 0
    while i + k <= n:
        lo, hi = i, i + k - 1
        while lo < hi:
            res[lo], res[hi] = res[hi], res[lo]
            lo += 1
            hi -= 1
        i += k
    return res`,
    approach:
      'Copy the array, then step across it in strides of k. Whenever a full block of k elements remains, reverse it with a two-pointer swap from both ends toward the middle. Stop once fewer than k elements are left, leaving the tail untouched.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[1,2,3]', '4'],
      ['[1,2,3,4,5,6]', '3'],
      ['[]', '2'],
      ['[7]', '1'],
      ['[1,2,3,4]', '4'],
      ['[5,4,3,2,1]', '2'],
      ['[1,2,3,4,5,6,7]', '3'],
      ['[9,8,7,6]', '1'],
      ['[10,20,30,40,50,60,70,80]', '4'],
    ],
  },
  {
    n: 3386,
    id: 'pghub-b50-island-perimeter',
    name: 'Single Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A binary <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. Land cells connect orthogonally. The grid contains exactly one connected island and no internal lakes. Return the perimeter of the island.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped island has 12 exposed unit edges.'],
      ['[[1]]', '4', 'A single land cell has all four sides exposed.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one connected island, no lakes'],
    tags: ['graphs', 'matrix'],
    py: `def islandPerimeter(grid):
    rows = len(grid)
    cols = len(grid[0])
    perim = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perim += 4
                if r > 0 and grid[r - 1][c] == 1:
                    perim -= 2
                if c > 0 and grid[r][c - 1] == 1:
                    perim -= 2
    return perim`,
    approach:
      'Each land cell contributes four edges to the perimeter. Every shared edge between two adjacent land cells removes two units of perimeter (one from each cell). Scanning the grid and subtracting two for each up-neighbor and left-neighbor that is also land counts every shared edge exactly once.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,0]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
      ['[[1,1],[1,0]]'],
    ],
  },
  {
    n: 3390,
    id: 'pghub-b50-balanced-split',
    name: 'Balanced Split Count',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'balancedSplits',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      "A balanced string contains an equal number of the characters <code>'L'</code> and <code>'R'</code>. Split the string <code>s</code> (made only of <code>'L'</code> and <code>'R'</code>) into the maximum number of consecutive non-empty balanced substrings. Return that maximum count.",
    examples: [
      ['RLRRLLRLRL', '4', 'Splits into RL, RRLL, RL, RL — four balanced pieces.'],
      ['LLLLRRRR', '1', "The only balanced split is the whole string."],
    ],
    constraints: ['2 <= s.length <= 10^5', "s contains only 'L' and 'R'", 's has equal counts of L and R'],
    tags: ['strings', 'greedy'],
    py: `def balancedSplits(s):
    balance = 0
    count = 0
    for ch in s:
        balance += 1 if ch == 'R' else -1
        if balance == 0:
            count += 1
    return count`,
    approach:
      'Track a running balance that rises for one letter and falls for the other. Every time the balance returns to zero the prefix seen so far is balanced and can be cut off greedily, which maximizes the number of pieces. Counting the zero crossings gives the answer in one pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"RLRRLLRLRL"'],
      ['"LLLLRRRR"'],
      ['"RL"'],
      ['"LR"'],
      ['"RLRL"'],
      ['"RRLLRRLL"'],
      ['"LRLRLRLR"'],
      ['"RRRLLL"'],
      ['"LRRLLRRL"'],
      ['"RLLRRLLR"'],
    ],
  },
  {
    n: 3391,
    id: 'pghub-b50-kth-distinct',
    name: 'Kth Distinct Element',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'kthDistinct',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'An element of <code>nums</code> is distinct if it appears exactly once. Return the <code>k</code>-th distinct element in order of first appearance (1-indexed). If fewer than <code>k</code> distinct elements exist, return <code>-1</code>.',
    examples: [
      ['[1,2,2,3,4]\n2', '3', 'Distinct values in order are 1, 3, 4; the 2nd is 3.'],
      ['[5,5,5]\n1', '-1', 'No value appears exactly once.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays', 'hash-table'],
    py: `def kthDistinct(nums, k):
    freq = Counter(nums)
    seen = 0
    for x in nums:
        if freq[x] == 1:
            seen += 1
            if seen == k:
                return x
    return -1`,
    approach:
      'Count occurrences of every value, then walk the array in original order. Each value appearing exactly once is a distinct element; tally them and return the one that reaches rank k. Walking the array (not the counter) preserves first-appearance order. If the count never reaches k, return -1.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,2,3,4]', '2'],
      ['[5,5,5]', '1'],
      ['[1,2,3]', '3'],
      ['[1,2,3]', '4'],
      ['[7]', '1'],
      ['[4,4,3,3,2,1]', '1'],
      ['[1,1,2,2,3]', '1'],
      ['[9,8,8,7,9,6]', '2'],
      ['[10,20,10,30,40]', '3'],
      ['[2,2,2,2,1]', '1'],
    ],
  },
  {
    n: 3400,
    id: 'pghub-b50-coin-change-min',
    name: 'Fewest Coins To Total',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'fewestCoins',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given coin denominations <code>coins</code> (unlimited supply of each) and a target <code>amount</code>, return the minimum number of coins that sum exactly to <code>amount</code>. If the amount cannot be formed, return <code>-1</code>.',
    examples: [
      ['[1,2,5]\n11', '3', '11 = 5 + 5 + 1 uses three coins, the fewest possible.'],
      ['[2]\n3', '-1', 'No combination of 2s sums to an odd amount.'],
    ],
    constraints: ['1 <= coins.length <= 50', '1 <= coins[i] <= 1000', '0 <= amount <= 10^4'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def fewestCoins(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] <= amount else -1`,
    approach:
      'Build up the fewest coins needed for every sub-amount from 0 to the target. For each amount, try each coin: using that coin reduces the problem to the amount minus the coin value, so the cost is one plus the best for that smaller amount. The base case of zero needs no coins, and an amount left at the infinity sentinel is unreachable.',
    complexity: { time: 'O(amount * coins)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '11'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,3,4]', '6'],
      ['[5,10,25]', '30'],
      ['[2,5]', '8'],
      ['[7,3]', '14'],
      ['[1,5,10,25]', '63'],
      ['[3,7]', '5'],
      ['[2,4,6]', '0'],
    ],
  },
  {
    n: 3401,
    id: 'pghub-b50-search-2d',
    name: 'Search Sorted Matrix',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'searchMatrix',
    params: [
      { name: 'matrix', type: 'List[List[int]]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'bool',
    statement:
      'In <code>matrix</code> each row is sorted left to right and each column is sorted top to bottom. Return <code>true</code> if <code>target</code> appears in the matrix and <code>false</code> otherwise. Aim for time linear in the number of rows plus columns.',
    examples: [
      ['[[1,4,7],[2,5,8],[3,6,9]]\n5', 'true', '5 sits at the center of the matrix.'],
      ['[[1,4,7],[2,5,8],[3,6,9]]\n10', 'false', '10 exceeds every value present.'],
    ],
    constraints: ['1 <= matrix.length, matrix[0].length <= 300', '-10^9 <= matrix[i][j], target <= 10^9', 'rows and columns are each sorted ascending'],
    tags: ['binary-search', 'matrix'],
    py: `def searchMatrix(matrix, target):
    rows = len(matrix)
    cols = len(matrix[0])
    r = 0
    c = cols - 1
    while r < rows and c >= 0:
        v = matrix[r][c]
        if v == target:
            return True
        if v > target:
            c -= 1
        else:
            r += 1
    return False`,
    approach:
      'Start at the top-right corner. That cell is the largest in its row and the smallest in its column, so a comparison with the target tells you which direction to eliminate: if the cell is too big, drop the column; if too small, drop the row. Each step removes one row or column, giving a staircase search in O(rows + cols).',
    complexity: { time: 'O(rows + cols)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[[1,4,7],[2,5,8],[3,6,9]]', '5'],
      ['[[1,4,7],[2,5,8],[3,6,9]]', '10'],
      ['[[1]]', '1'],
      ['[[1]]', '2'],
      ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '3'],
      ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '13'],
      ['[[-5,-3],[-2,0]]', '-2'],
      ['[[1,2,3,4,5]]', '4'],
      ['[[1],[2],[3],[4]]', '3'],
      ['[[1,2],[3,4]]', '5'],
    ],
  },
  {
    n: 3406,
    id: 'pghub-b50-task-scheduler',
    name: 'Idle Slots With Cooldown',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'idleSlots',
    params: [
      { name: 'tasks', type: 'List[str]' },
      { name: 'cooldown', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A CPU runs single-letter <code>tasks</code>, one per time slot. Two runs of the same task must be separated by at least <code>cooldown</code> idle-or-other slots. Tasks can run in any order; idle slots may be inserted. Return the minimum number of idle slots needed to finish all tasks.',
    examples: [
      ['["A","A","A","B","B","B"]\n2', '0', 'Order AABBAB? No: ABABAB needs no idles since both letters fill the gaps.'],
      ['["A","A","A"]\n2', '4', 'A _ _ A _ _ A requires four idle slots.'],
    ],
    constraints: ['1 <= tasks.length <= 10^4', 'each task is a single uppercase letter', '0 <= cooldown <= 100'],
    tags: ['greedy', 'hash-table'],
    py: `def idleSlots(tasks, cooldown):
    freq = Counter(tasks)
    max_freq = max(freq.values())
    max_count = sum(1 for v in freq.values() if v == max_freq)
    frame = (max_freq - 1) * (cooldown + 1) + max_count
    total_slots = max(frame, len(tasks))
    return total_slots - len(tasks)`,
    approach:
      'The most frequent task forces a skeleton of (maxFreq - 1) frames of length (cooldown + 1), followed by one slot per task that shares the maximum frequency. The total time is the larger of this frame size and the number of tasks (the latter dominates when there are enough distinct tasks to fill gaps). Idle slots are the total time minus the number of real tasks.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["A","A","A","B","B","B"]', '2'],
      ['["A","A","A"]', '2'],
      ['["A","B","C","D"]', '2'],
      ['["A","A","A","A"]', '0'],
      ['["A","A","B","B"]', '1'],
      ['["A"]', '5'],
      ['["A","A","A","B","C"]', '2'],
      ['["A","A","B","B","C","C"]', '2'],
      ['["A","A","A","A","B","B","B","C"]', '3'],
      ['["X","Y","X","Y","X"]', '1'],
    ],
  },
  {
    n: 3415,
    id: 'pghub-b50-tree-tilt',
    name: 'Binary Tree Tilt',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'treeTilt',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      "A binary tree is given in level order as <code>values</code>, where <code>null</code> marks an absent node. The tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree (an empty subtree sums to 0). Return the sum of every node's tilt.",
    examples: [
      ['[1,2,3]', '1', 'Root tilt |2-3|=1; leaves have tilt 0. Total 1.'],
      ['[4,2,9,3,5,null,7]', '15', 'Tilts: node2 |3-5|=2, node9 |0-7|=7, root |(2+3+5)-(9+7)|=6; total 15.'],
    ],
    constraints: ['1 <= values.length <= 10^4', 'values encode a valid level-order binary tree', '-1000 <= node value <= 1000'],
    tags: ['trees', 'recursion'],
    py: `def treeTilt(values):
    n = len(values)
    total = [0]
    def subtree_sum(i):
        if i >= n or values[i] is None:
            return 0
        left = subtree_sum(2 * i + 1)
        right = subtree_sum(2 * i + 2)
        total[0] += abs(left - right)
        return values[i] + left + right
    subtree_sum(0)
    return total[0]`,
    approach:
      'Treat the level-order array as a heap-style tree where node i has children 2i+1 and 2i+2. A single recursive post-order pass returns each subtree sum; while unwinding, add the absolute difference of the left and right subtree sums to a running total. Missing children contribute zero, and the accumulated total is the answer.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    cases: [
      ['[1,2,3]'],
      ['[4,2,9,3,5,null,7]'],
      ['[1]'],
      ['[1,null,2]'],
      ['[5,3,8,1,4]'],
      ['[0,0,0]'],
      ['[10,-5,5]'],
      ['[2,1,1,1,1,1,1]'],
      ['[1,2,null,3]'],
      ['[7,3,3,1,1,1,1]'],
    ],
  },
  {
    n: 3416,
    id: 'pghub-b50-stack-sort',
    name: 'Sort Stack With One Helper',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'sortStack',
    params: [{ name: 'stack', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A <code>stack</code> is given as a list where the last element is the top. Sort it so the smallest value ends up at the bottom and the largest on top, using only one auxiliary stack and standard push/pop/peek operations (no sorting library, no other arrays of the elements). Return the sorted stack as a list with the top last.',
    examples: [
      ['[3,1,2]', '[1,2,3]', 'After sorting, 3 (largest) is on top.'],
      ['[5,4,3,2,1]', '[1,2,3,4,5]', 'A descending stack becomes ascending.'],
    ],
    constraints: ['0 <= stack.length <= 10^4', '-10^9 <= stack[i] <= 10^9'],
    tags: ['stack', 'sorting'],
    py: `def sortStack(stack):
    src = list(stack)
    aux = []
    while src:
        tmp = src.pop()
        while aux and aux[-1] > tmp:
            src.append(aux.pop())
        aux.append(tmp)
    return aux`,
    approach:
      'Repeatedly pop from the source stack into a temporary variable. Before placing it on the auxiliary stack, move back any auxiliary elements larger than it onto the source. This keeps the auxiliary stack sorted with the largest on top at every step, so when the source empties the auxiliary stack holds all elements in ascending order from bottom to top.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['[3,1,2]'],
      ['[5,4,3,2,1]'],
      ['[]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[2,2,1,1]'],
      ['[-3,5,-1,0,2]'],
      ['[10,30,20]'],
      ['[7,7,7]'],
      ['[100,-100,50,-50,0]'],
    ],
  },
  {
    n: 3422,
    id: 'pghub-b50-subset-xor',
    name: 'Count Zero-XOR Subsets',
    topic_id: 'bit-manipulation',
    difficulty: 'Hard',
    method_name: 'zeroXorSubsets',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Return the number of non-empty subsets of <code>nums</code> whose elements XOR together to <code>0</code>. Because the count can be large, return it modulo <code>1000000007</code>. Subsets are identified by index, so equal values at different positions are distinct.',
    examples: [
      ['[1,1]', '1', 'Only the subset {both 1s} XORs to 0.'],
      ['[1,2,3]', '1', 'The subset {1,2,3} XORs to 0; no other non-empty subset does.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9'],
    tags: ['bit-manipulation', 'linear-algebra'],
    py: `def zeroXorSubsets(nums):
    MOD = 1000000007
    basis = []
    for x in nums:
        cur = x
        for b in basis:
            cur = min(cur, cur ^ b)
        if cur:
            basis.append(cur)
            basis.sort(reverse=True)
    rank = len(basis)
    free = len(nums) - rank
    return (pow(2, free, MOD) - 1) % MOD`,
    approach:
      'Build a linear basis of the numbers over GF(2) using Gaussian elimination on their bits; the basis size is the rank r. The number of vectors in the span that equal any reachable target is 2^(n - r). Zero is always reachable (the empty combination), so 2^(n - r) subsets XOR to zero including the empty one; subtracting one removes the empty subset. All arithmetic is taken modulo 1e9+7.',
    complexity: { time: 'O(n * 30)', space: 'O(30)' },
    cases: [
      ['[1,1]'],
      ['[1,2,3]'],
      ['[0]'],
      ['[5]'],
      ['[1,2,4]'],
      ['[3,3,3,3]'],
      ['[0,0,0]'],
      ['[7,7]'],
      ['[1,2,3,3,2,1]'],
      ['[8,4,2,1,15]'],
    ],
  },
  {
    n: 3431,
    id: 'pghub-b50-word-ladder-len',
    name: 'Shortest Transform Length',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'transformLength',
    params: [
      { name: 'begin', type: 'str' },
      { name: 'end', type: 'str' },
      { name: 'words', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'You may change one letter at a time, and every intermediate word must be in the dictionary <code>words</code>. Return the number of words in the shortest transformation sequence from <code>begin</code> to <code>end</code> (counting both ends). If no sequence exists, return <code>0</code>. All words have the same length and consist of lowercase letters; <code>begin</code> need not be in the dictionary but <code>end</code> must.',
    examples: [
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', '5', 'hit -> hot -> dot -> dog -> cog has 5 words.'],
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log"]', '0', 'cog is missing, so no sequence reaches it.'],
    ],
    constraints: ['1 <= word length <= 10', '1 <= words.length <= 5000', 'all words share one length and are lowercase'],
    tags: ['advanced-graphs', 'bfs'],
    py: `def transformLength(begin, end, words):
    word_set = set(words)
    if end not in word_set:
        return 0
    queue = deque([(begin, 1)])
    visited = {begin}
    while queue:
        word, steps = queue.popleft()
        if word == end:
            return steps
        for i in range(len(word)):
            for ch in 'abcdefghijklmnopqrstuvwxyz':
                if ch == word[i]:
                    continue
                nxt = word[:i] + ch + word[i + 1:]
                if nxt in word_set and nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, steps + 1))
    return 0`,
    approach:
      'Model each word as a graph node with edges between words differing in exactly one letter. Breadth-first search from the start finds the fewest hops to the end. For each dequeued word, generate all single-letter variations, keep only those present in the dictionary and unvisited, and enqueue them with an incremented step count. The first time the end word is reached, its step count is the shortest length.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N * L)' },
    multiParam: true,
    cases: [
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'],
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'],
      ['"a"', '"c"', '["a","b","c"]'],
      ['"hot"', '"dog"', '["hot","dog"]'],
      ['"hit"', '"hit"', '["hit"]'],
      ['"cat"', '"dog"', '["cat","cot","cog","dog"]'],
      ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'],
      ['"abc"', '"abc"', '["abc"]'],
      ['"lead"', '"gold"', '["load","goad","gold","lead","lord"]'],
      ['"aaa"', '"bbb"', '["aab","abb","bbb"]'],
    ],
  },
  {
    n: 3437,
    id: 'pghub-b50-knight-min',
    name: 'Minimum Knight Moves',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'knightMoves',
    params: [
      { name: 'n', type: 'int' },
      { name: 'start', type: 'List[int]' },
      { name: 'target', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'On an <code>n x n</code> board with cells indexed <code>0..n-1</code> in each dimension, a knight moves in the usual L-shape. Given <code>start</code> as <code>[row, col]</code> and <code>target</code> as <code>[row, col]</code>, return the minimum number of moves to go from start to target, or <code>-1</code> if the target is unreachable while staying on the board.',
    examples: [
      ['8\n[0,0]\n[1,2]', '1', 'A single knight move reaches [1,2] from the corner.'],
      ['3\n[0,0]\n[1,1]', '-1', 'On a 3x3 board the center is unreachable by a knight from the corner.'],
    ],
    constraints: ['1 <= n <= 300', '0 <= start[i], target[i] < n'],
    tags: ['graphs', 'bfs'],
    py: `def knightMoves(n, start, target):
    sr, sc = start
    tr, tc = target
    if [sr, sc] == [tr, tc]:
        return 0
    moves = [(1, 2), (2, 1), (-1, 2), (-2, 1), (1, -2), (2, -1), (-1, -2), (-2, -1)]
    queue = deque([(sr, sc, 0)])
    visited = {(sr, sc)}
    while queue:
        r, c, d = queue.popleft()
        for dr, dc in moves:
            nr, nc = r + dr, c + dc
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
                if nr == tr and nc == tc:
                    return d + 1
                visited.add((nr, nc))
                queue.append((nr, nc, d + 1))
    return -1`,
    approach:
      'Breadth-first search over board cells treats each knight move as an edge of weight one, so the first time the target is dequeued gives the minimum move count. From each cell, try all eight L-shaped offsets, keep those inside the board and unvisited, and enqueue with one more move. If the queue empties without reaching the target, it is unreachable.',
    complexity: { time: 'O(n^2)', space: 'O(n^2)' },
    multiParam: true,
    cases: [
      ['8', '[0,0]', '[1,2]'],
      ['3', '[0,0]', '[1,1]'],
      ['8', '[0,0]', '[0,0]'],
      ['8', '[0,0]', '[7,7]'],
      ['5', '[0,0]', '[4,4]'],
      ['8', '[2,2]', '[3,4]'],
      ['1', '[0,0]', '[0,0]'],
      ['4', '[0,0]', '[3,3]'],
      ['8', '[0,0]', '[2,1]'],
      ['10', '[5,5]', '[5,7]'],
    ],
  },
  {
    n: 3450,
    id: 'pghub-b50-lru-window',
    name: 'Distinct In Sliding Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'distinctInWindows',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Given an array <code>nums</code> and window size <code>k</code>, return a list where the <code>i</code>-th entry is the count of distinct values in the window <code>nums[i..i+k-1]</code>. The output has <code>len(nums) - k + 1</code> entries. If <code>k</code> exceeds the array length, return an empty list.',
    examples: [
      ['[1,2,1,3,4]\n3', '[2,3,3]', 'Windows [1,2,1]->2, [2,1,3]->3, [1,3,4]->3.'],
      ['[1,1,1]\n2', '[1,1]', 'Every window of two equal values has one distinct element.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['sliding-window', 'hash-table'],
    py: `def distinctInWindows(nums, k):
    n = len(nums)
    if k > n:
        return []
    freq = defaultdict(int)
    res = []
    for i in range(n):
        freq[nums[i]] += 1
        if i >= k:
            old = nums[i - k]
            freq[old] -= 1
            if freq[old] == 0:
                del freq[old]
        if i >= k - 1:
            res.append(len(freq))
    return res`,
    approach:
      'Slide a fixed-size window while maintaining a frequency map of the elements inside it. Adding the incoming element increments its count; once the window is full, the element leaving on the left is decremented and dropped when its count hits zero. The number of distinct values is simply the size of the map, recorded once the window first fills and after each slide.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,2,1,3,4]', '3'],
      ['[1,1,1]', '2'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[5,5,5,5]', '2'],
      ['[1,2,3]', '4'],
      ['[7]', '1'],
      ['[1,2,2,3,3,3]', '2'],
      ['[4,3,2,1,2,3,4]', '3'],
      ['[10,20,10,20,10]', '2'],
    ],
  },
];

// Convert JSON literals (stored in the DB) into Python-valid literals for execution.
function toPy(literal) {
  return literal.replace(/\bnull\b/g, 'None').replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False');
}

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => toPy(a)).join(', ');
      return `    print("<<B50>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b50-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B50>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B50>>'.length, -'<<END>>'.length)
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
      const argLiterals = tc.inputs.map((a) => toPy(a)).join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("<<G>>" + ("PASS" if _out == _exp else ("FAIL idx=${idx} got="+repr(_out)+" exp="+repr(_exp))) + "<<E>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b50-grade-${prob.n}.py`);
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
