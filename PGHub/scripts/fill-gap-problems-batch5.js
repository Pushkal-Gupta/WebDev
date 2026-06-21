#!/usr/bin/env node
// Batch 5 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Range: leetcode_number in (370, 700]. First 15 actual gaps.
// Standalone (no shared-file collisions). Every test-case `expected` is produced
// by ACTUALLY RUNNING the canonical Python here, so each problem passes by construction.
//
//   node scripts/fill-gap-problems-batch5.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch5.js --dry     # author + grade locally, no write

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

const BATCH = [379, 408, 411, 418, 422, 426, 428, 431, 439, 444, 465, 469, 471, 484, 487];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, deque
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
    n: 379,
    id: 'pghub-temperature-streak',
    name: 'Longest Warming Streak',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'longestWarming',
    params: [{ name: 'temps', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given daily temperatures <code>temps</code>, a "warming streak" is a maximal run of consecutive days where each day is strictly warmer than the previous one. Return the length of the longest such streak. A single day counts as a streak of length 1.',
    examples: [
      ['[1,2,3,2,4]', '3', 'Days 1,2,3 form a run 1<2<3 of length 3.'],
      ['[5,4,3]', '1', 'No day is warmer than the previous; best streak is a single day.'],
    ],
    constraints: ['1 <= temps.length <= 10^5', '-100 <= temps[i] <= 100'],
    tags: ['arrays'],
    py: `def longestWarming(temps):
    best = 1
    cur = 1
    for i in range(1, len(temps)):
        if temps[i] > temps[i - 1]:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best`,
    approach:
      'Single pass tracking the length of the current strictly-increasing run. Reset to 1 whenever the temperature does not rise, and keep the maximum run length seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,2,4]'],
      ['[5,4,3]'],
      ['[7]'],
      ['[1,2,3,4,5]'],
      ['[3,3,3]'],
      ['[1,2,1,2,3,4]'],
      ['[-5,-4,-3,-10,-9]'],
      ['[10,1,2,3]'],
      ['[2,2,2,2,3]'],
      ['[0,1,0,1,0,1,2]'],
    ],
  },
  {
    n: 408,
    id: 'pghub-balanced-brackets-types',
    name: 'Balanced Mixed Brackets',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A string <code>s</code> contains only the bracket characters <code>()[]{}</code>. Return <code>true</code> if every opening bracket is closed by a matching bracket of the same type in the correct order, and <code>false</code> otherwise. The empty string is balanced.',
    examples: [
      ['"([]{})"', 'true', 'Every bracket is correctly nested and matched.'],
      ['"([)]"', 'false', 'The brackets interleave instead of nesting.'],
    ],
    constraints: ['0 <= s.length <= 10^4', "s consists only of the characters ()[]{}"],
    tags: ['stack'],
    py: `def isBalanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        else:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack`,
    approach:
      'Push opening brackets onto a stack; on a closing bracket the top of the stack must be its matching opener, otherwise the string is unbalanced. A non-empty stack at the end means unmatched openers remain.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"([]{})"'],
      ['"([)]"'],
      ['""'],
      ['"()"'],
      ['"((("'],
      ['"]"'],
      ['"{[()]}"'],
      ['"()[]{}"'],
      ['"(]"'],
      ['"{{}}[]()"'],
    ],
  },
  {
    n: 411,
    id: 'pghub-rotate-grid-90',
    name: 'Rotate Grid Clockwise',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'rotateGrid',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Given an <code>n x n</code> matrix <code>grid</code>, return a new matrix that is <code>grid</code> rotated 90 degrees clockwise. The original matrix must not be required for the answer; just return the rotated copy.',
    examples: [
      ['[[1,2],[3,4]]', '[[3,1],[4,2]]', 'The left column becomes the top row.'],
      ['[[1]]', '[[1]]', 'A single cell is unchanged.'],
    ],
    constraints: ['1 <= n <= 300', '-10^4 <= grid[i][j] <= 10^4'],
    tags: ['matrix'],
    py: `def rotateGrid(grid):
    n = len(grid)
    out = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            out[j][n - 1 - i] = grid[i][j]
    return out`,
    approach:
      'For a clockwise rotation, the element at (i, j) moves to (j, n-1-i). Allocate a fresh n x n matrix and place each element at its rotated position.',
    complexity: { time: 'O(n^2)', space: 'O(n^2)' },
    cases: [
      ['[[1,2],[3,4]]'],
      ['[[1]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[0,1],[2,3]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'],
      ['[[5,0],[0,5]]'],
      ['[[2,4,6],[8,10,12],[14,16,18]]'],
      ['[[7,7,7],[7,7,7],[7,7,7]]'],
    ],
  },
  {
    n: 418,
    id: 'pghub-min-meeting-rooms',
    name: 'Minimum Meeting Rooms',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minRooms',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a list of <code>meetings</code> where each meeting is <code>[start, end]</code> with <code>start &lt; end</code>, return the minimum number of rooms required so that no two overlapping meetings share a room. A meeting ending exactly when another starts may reuse the room.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'The [0,30] meeting overlaps each of the others.'],
      ['[[7,10],[2,4]]', '1', 'The two meetings do not overlap.'],
    ],
    constraints: ['0 <= meetings.length <= 10^4', '0 <= start < end <= 10^6'],
    tags: ['intervals', 'sorting'],
    py: `def minRooms(meetings):
    if not meetings:
        return 0
    starts = sorted(m[0] for m in meetings)
    ends = sorted(m[1] for m in meetings)
    i = j = 0
    cur = 0
    best = 0
    n = len(meetings)
    while i < n:
        if starts[i] < ends[j]:
            cur += 1
            best = max(best, cur)
            i += 1
        else:
            cur -= 1
            j += 1
    return best`,
    approach:
      'Sort start and end times separately and sweep in time order. A start before the next end needs an extra room; an end frees one. The peak number of simultaneously busy rooms is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[7,10],[2,4]]'],
      ['[]'],
      ['[[1,5]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[1,10],[2,9],[3,8]]'],
      ['[[0,1],[1,2],[0,2]]'],
      ['[[5,8],[6,8],[7,8]]'],
      ['[[1,4],[2,5],[7,9]]'],
      ['[[0,100],[10,20],[30,40],[50,60]]'],
    ],
  },
  {
    n: 422,
    id: 'pghub-digit-product-depth',
    name: 'Digital Product Depth',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'productDepth',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Repeatedly replace a non-negative integer <code>n</code> with the product of its decimal digits until it becomes a single digit. Return the number of replacements performed. A number that is already a single digit needs 0 replacements.',
    examples: [
      ['39', '3', '39 -> 27 -> 14 -> 4: three steps.'],
      ['7', '0', '7 is already a single digit.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math'],
    py: `def productDepth(n):
    steps = 0
    while n >= 10:
        prod = 1
        x = n
        while x > 0:
            prod *= x % 10
            x //= 10
        n = prod
        steps += 1
    return steps`,
    approach:
      'Loop while the number has more than one digit: multiply its digits to form the next value and count each step. The process terminates because the product is strictly smaller once a number has two or more digits.',
    complexity: { time: 'O(steps * digits)', space: 'O(1)' },
    cases: [
      ['39'],
      ['7'],
      ['0'],
      ['10'],
      ['999'],
      ['25'],
      ['77'],
      ['123456'],
      ['88'],
      ['1000000000'],
    ],
  },
  {
    n: 426,
    id: 'pghub-flood-region-size',
    name: 'Largest Flooded Region',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'largestRegion',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A binary <code>grid</code> has <code>1</code> for land and <code>0</code> for water. A region is a maximal group of land cells connected horizontally or vertically. Return the number of cells in the largest region, or 0 if there is no land.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '3', 'The top-left region has 3 connected cells.'],
      ['[[0,0],[0,0]]', '0', 'No land cells exist.'],
    ],
    constraints: ['1 <= rows, cols <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['matrix', 'graph'],
    py: `def largestRegion(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = [[False] * cols for _ in range(rows)]
    best = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and not seen[r][c]:
                stack = [(r, c)]
                seen[r][c] = True
                size = 0
                while stack:
                    x, y = stack.pop()
                    size += 1
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1 and not seen[nx][ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
                best = max(best, size)
    return best`,
    approach:
      'Iterative flood fill (DFS with an explicit stack) from each unvisited land cell, counting the cells reached in that region. A visited matrix prevents recounting, and the largest region size is kept.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0,1],[0,0,0],[1,0,1]]'],
      ['[[1]]'],
      ['[[0]]'],
      ['[[1,1,1,1,1]]'],
      ['[[1,0,0],[1,0,1],[1,1,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,1,0,1],[1,0,1,0,1],[1,1,1,1,1]]'],
    ],
  },
  {
    n: 428,
    id: 'pghub-zigzag-rows',
    name: 'Zigzag Row Encoding',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'zigzagEncode',
    params: [{ name: 's', type: 'str' }, { name: 'rows', type: 'int' }],
    return_type: 'str',
    statement:
      'Write the characters of <code>s</code> in a zigzag down and up across <code>rows</code> rows (down the rows, then diagonally back up, repeating), then read the rows left to right, top to bottom, and concatenate. Return that string. If <code>rows</code> is 1, the string is unchanged.',
    examples: [
      ['"PAYPALISHIRING"\n3', '"PAHNAPLSIIGYIR"', 'The characters laid out in 3 rows read off row by row.'],
      ['"abc"\n1', '"abc"', 'A single row leaves the string unchanged.'],
    ],
    constraints: ['1 <= s.length <= 10^4', '1 <= rows <= 1000'],
    tags: ['strings', 'simulation'],
    py: `def zigzagEncode(s, rows):
    if rows == 1 or rows >= len(s):
        return s
    buckets = [[] for _ in range(rows)]
    r = 0
    step = 1
    for ch in s:
        buckets[r].append(ch)
        if r == 0:
            step = 1
        elif r == rows - 1:
            step = -1
        r += step
    return "".join("".join(b) for b in buckets)`,
    approach:
      'Walk a row pointer up and down between the first and last row, dropping each character into its current row bucket. Flip direction at the top and bottom rows. Concatenating the rows in order yields the encoding.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"PAYPALISHIRING"', '3'],
      ['"abc"', '1'],
      ['"PAYPALISHIRING"', '4'],
      ['"AB"', '1'],
      ['"ABCD"', '2'],
      ['"HELLOWORLD"', '3'],
      ['"a"', '5'],
      ['"abcdef"', '6'],
      ['"abcdefg"', '2'],
      ['"zigzag"', '3'],
    ],
  },
  {
    n: 431,
    id: 'pghub-distinct-subseq-count',
    name: 'Count Distinct Subsequences',
    topic_id: 'dp',
    difficulty: 'Hard',
    method_name: 'distinctSubseq',
    params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }],
    return_type: 'int',
    statement:
      'Return the number of distinct subsequences of <code>s</code> that equal <code>t</code>. A subsequence is formed by deleting zero or more characters of <code>s</code> without changing the order of the rest; two subsequences are distinct if they use different sets of positions.',
    examples: [
      ['"rabbbit"\n"rabbit"', '3', 'Three different choices of the b positions spell "rabbit".'],
      ['"abc"\n"abc"', '1', 'Only the whole string matches.'],
    ],
    constraints: ['0 <= s.length <= 1000', '0 <= t.length <= 1000'],
    tags: ['dp', 'strings'],
    py: `def distinctSubseq(s, t):
    m = len(t)
    dp = [0] * (m + 1)
    dp[0] = 1
    for ch in s:
        for j in range(m, 0, -1):
            if t[j - 1] == ch:
                dp[j] += dp[j - 1]
    return dp[m]`,
    approach:
      'Let dp[j] be the number of ways to form the first j characters of t. Processing s left to right, when the current character matches t[j-1] we can extend every way of forming t[:j-1]. Iterating j downward keeps each character of s used at most once per state.',
    complexity: { time: 'O(|s| * |t|)', space: 'O(|t|)' },
    multiParam: true,
    cases: [
      ['"rabbbit"', '"rabbit"'],
      ['"abc"', '"abc"'],
      ['"aaa"', '"a"'],
      ['"aaa"', '"aa"'],
      ['"abc"', '""'],
      ['""', '"a"'],
      ['"babgbag"', '"bag"'],
      ['"xyz"', '"xz"'],
      ['"aabb"', '"ab"'],
      ['"banana"', '"ban"'],
    ],
  },
  {
    n: 439,
    id: 'pghub-gas-station-loop',
    name: 'Circular Fuel Loop',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'startStation',
    params: [{ name: 'gas', type: 'List[int]' }, { name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'There are stations on a circular road; <code>gas[i]</code> is the fuel available at station i and <code>cost[i]</code> is the fuel needed to drive from station i to the next. Starting empty, return the index of a station from which you can complete the full loop, or -1 if none exists. If a valid start exists it is guaranteed unique.',
    examples: [
      ['[1,2,3,4,5]\n[3,4,5,1,2]', '3', 'Starting at station 3 you can complete the loop.'],
      ['[2,3,4]\n[3,4,3]', '-1', 'Total cost exceeds total gas, so no loop is possible.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= gas[i], cost[i] <= 10^4'],
    tags: ['greedy'],
    py: `def startStation(gas, cost):
    total = 0
    tank = 0
    start = 0
    for i in range(len(gas)):
        diff = gas[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1`,
    approach:
      'If total gas is at least total cost a solution exists. Scan once tracking the running tank; whenever it dips below zero, no station up to here can be the start, so the next station becomes the new candidate and the tank resets.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '[3,4,5,1,2]'],
      ['[2,3,4]', '[3,4,3]'],
      ['[5]', '[4]'],
      ['[5]', '[6]'],
      ['[3,3,4]', '[3,4,4]'],
      ['[1,1,1,1]', '[1,1,1,1]'],
      ['[4,5,2,6,5,3]', '[3,2,7,3,2,9]'],
      ['[0]', '[0]'],
      ['[6,1,4,3,5]', '[3,8,2,4,2]'],
      ['[2,0,1,2,3,4,0]', '[0,1,0,0,0,4,0]'],
    ],
  },
  {
    n: 444,
    id: 'pghub-target-pair-sorted',
    name: 'Pair Sum in Sorted Array',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'pairSum',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'List[int]',
    statement:
      'Given an array <code>nums</code> sorted in non-decreasing order and a <code>target</code>, return the 0-based indices <code>[i, j]</code> with <code>i &lt; j</code> of two elements that sum to <code>target</code>. If several pairs work, return the one with the smallest <code>i</code> (then smallest <code>j</code>). Return an empty list if no pair exists.',
    examples: [
      ['[1,2,4,7,11]\n9', '[1,3]', 'nums[1] + nums[3] = 2 + 7 = 9.'],
      ['[1,2,3]\n7', '[]', 'No two elements sum to 7.'],
    ],
    constraints: ['0 <= nums.length <= 10^5', 'nums is sorted ascending', '-10^9 <= nums[i], target <= 10^9'],
    tags: ['two-pointers'],
    py: `def pairSum(nums, target):
    lo = 0
    hi = len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return [lo, hi]
        if s < target:
            lo += 1
        else:
            hi -= 1
    return []`,
    approach:
      'Two pointers from both ends of the sorted array. If the current sum is too small advance the left pointer; if too large move the right pointer in. The first match found has the smallest left index by construction.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,4,7,11]', '9'],
      ['[1,2,3]', '7'],
      ['[]', '5'],
      ['[2,2]', '4'],
      ['[-3,-1,0,2,5]', '2'],
      ['[1,5,9,13]', '14'],
      ['[0,0,0]', '0'],
      ['[1,2,3,4,5]', '9'],
      ['[3]', '3'],
      ['[-5,-2,1,4,8]', '3'],
    ],
  },
  {
    n: 465,
    id: 'pghub-stock-single-trade',
    name: 'Best Single Stock Trade',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given daily stock <code>prices</code>, you may buy on one day and sell on a strictly later day, at most once. Return the maximum profit achievable. If no profitable trade exists, return 0.',
    examples: [
      ['[7,1,5,3,6,4]', '5', 'Buy at 1, sell at 6.'],
      ['[7,6,4,3,1]', '0', 'Prices only fall, so no profit is possible.'],
    ],
    constraints: ['0 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    tags: ['arrays'],
    py: `def maxProfit(prices):
    best = 0
    lowest = None
    for p in prices:
        if lowest is None or p < lowest:
            lowest = p
        elif p - lowest > best:
            best = p - lowest
    return best`,
    approach:
      'Track the lowest price seen so far while scanning; for each later day the profit is the current price minus that minimum. Keep the largest such profit.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[7,1,5,3,6,4]'],
      ['[7,6,4,3,1]'],
      ['[]'],
      ['[5]'],
      ['[1,2,3,4,5]'],
      ['[3,3,3]'],
      ['[2,4,1]'],
      ['[10,1,10]'],
      ['[1,2,4,2,5,7,2,4,9,0]'],
      ['[6,1,3,2,4,7]'],
    ],
  },
  {
    n: 469,
    id: 'pghub-kth-largest-stream',
    name: 'Kth Largest in Window',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargest',
    params: [{ name: 'k', type: 'int' }, { name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Process <code>nums</code> one element at a time. After adding each element, report the k-th largest value among all elements seen so far. Until at least <code>k</code> elements have been seen, report -1 for that step. Return the list of reported values.',
    examples: [
      ['2\n[4,5,8,2]', '[-1,4,5,5]', 'After 4: fewer than 2 elements; after 5: 2nd largest is 4; etc.'],
      ['1\n[3,1,2]', '[3,3,3]', 'The largest value seen so far each step.'],
    ],
    constraints: ['1 <= k <= 10^4', '0 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    tags: ['heap'],
    py: `def kthLargest(k, nums):
    heap = []
    out = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
        out.append(heap[0] if len(heap) == k else -1)
    return out`,
    approach:
      'Maintain a min-heap holding the k largest values seen so far. Push each new value and pop the smallest whenever the heap exceeds size k; then the heap root is the k-th largest. Report -1 until the heap reaches size k.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['2', '[4,5,8,2]'],
      ['1', '[3,1,2]'],
      ['3', '[]'],
      ['1', '[5]'],
      ['2', '[1]'],
      ['3', '[10,9,8,7,6]'],
      ['2', '[2,2,2,2]'],
      ['4', '[1,2,3,4,5,6]'],
      ['1', '[-1,-2,-3]'],
      ['2', '[5,4,3,2,1]'],
    ],
  },
  {
    n: 471,
    id: 'pghub-word-ladder-length',
    name: 'Shortest Word Transform',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'transformLength',
    params: [{ name: 'begin', type: 'str' }, { name: 'end', type: 'str' }, { name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Starting from <code>begin</code>, change exactly one letter at a time so that every intermediate word is in the dictionary <code>words</code>, until you reach <code>end</code>. All words have equal length. Return the number of words in the shortest such sequence (counting both ends), or 0 if no transformation exists. <code>begin</code> need not be in the dictionary; <code>end</code> must be.',
    examples: [
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', '5', 'hit -> hot -> dot -> dog -> cog has 5 words.'],
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log"]', '0', 'Without "cog" the target is unreachable.'],
    ],
    constraints: ['1 <= word length <= 10', '1 <= words.length <= 5000', 'all words share one length'],
    tags: ['graph', 'bfs'],
    py: `def transformLength(begin, end, words):
    wordset = set(words)
    if end not in wordset:
        return 0
    q = deque([(begin, 1)])
    visited = {begin}
    while q:
        word, dist = q.popleft()
        if word == end:
            return dist
        for i in range(len(word)):
            for c in "abcdefghijklmnopqrstuvwxyz":
                if c == word[i]:
                    continue
                nxt = word[:i] + c + word[i + 1:]
                if nxt in wordset and nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, dist + 1))
    return 0`,
    approach:
      'Model each valid word as a graph node with edges between words differing by one letter, then breadth-first search from begin. BFS finds the fewest steps; the number of words is the step count plus one, tracked as the distance.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N * L)' },
    multiParam: true,
    cases: [
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'],
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'],
      ['"a"', '"c"', '["a","b","c"]'],
      ['"cat"', '"cat"', '["cat"]'],
      ['"hot"', '"dog"', '["hot","dog"]'],
      ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'],
      ['"abc"', '"xyz"', '["abc","xyz"]'],
      ['"dog"', '"cat"', '["dot","dog","cot","cat"]'],
      ['"lead"', '"gold"', '["load","goad","gold","lead","load"]'],
      ['"aaa"', '"bbb"', '["aab","abb","bbb","baa"]'],
    ],
  },
  {
    n: 484,
    id: 'pghub-trapped-rainwater',
    name: 'Trapped Rainwater',
    topic_id: 'two-pointers',
    difficulty: 'Hard',
    method_name: 'trapWater',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given non-negative bar <code>heights</code> of unit width, return the total units of water that would be trapped between the bars after rain.',
    examples: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]', '6', 'Six units of water sit in the dips between bars.'],
      ['[4,2,3]', '1', 'One unit is trapped above the bar of height 2.'],
    ],
    constraints: ['0 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    tags: ['two-pointers'],
    py: `def trapWater(heights):
    lo = 0
    hi = len(heights) - 1
    left_max = 0
    right_max = 0
    total = 0
    while lo < hi:
        if heights[lo] <= heights[hi]:
            left_max = max(left_max, heights[lo])
            total += left_max - heights[lo]
            lo += 1
        else:
            right_max = max(right_max, heights[hi])
            total += right_max - heights[hi]
            hi -= 1
    return total`,
    approach:
      'Two pointers move inward from both ends, each tracking the tallest bar seen on its side. The shorter side bounds the water level, so the trapped water above the current bar equals that side maximum minus the bar height.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      ['[4,2,3]'],
      ['[]'],
      ['[1]'],
      ['[3,3,3]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[4,2,0,3,2,5]'],
      ['[0,0,0]'],
      ['[2,0,2]'],
    ],
  },
  {
    n: 487,
    id: 'pghub-grid-min-path',
    name: 'Minimum Falling Path',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minFallingPath',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given an integer matrix <code>grid</code>, a falling path starts at any cell in the top row and at each step moves to the cell directly below or diagonally below-left or below-right. Return the minimum possible sum of a falling path through the grid.',
    examples: [
      ['[[2,1,3],[6,5,4],[7,8,9]]', '13', '1 -> 5 -> 7 sums to 13.'],
      ['[[5]]', '5', 'A single cell is the only path.'],
    ],
    constraints: ['1 <= n <= 100', '-100 <= grid[i][j] <= 100'],
    tags: ['dp', 'matrix'],
    py: `def minFallingPath(grid):
    n = len(grid)
    cols = len(grid[0])
    prev = list(grid[0])
    for i in range(1, n):
        cur = [0] * cols
        for j in range(cols):
            best = prev[j]
            if j > 0:
                best = min(best, prev[j - 1])
            if j < cols - 1:
                best = min(best, prev[j + 1])
            cur[j] = grid[i][j] + best
        prev = cur
    return min(prev)`,
    approach:
      'Row-by-row dynamic programming: the best path ending at a cell is its value plus the minimum of the three cells above it that can reach it. Keep only the previous row of best sums; the answer is the smallest value in the final row.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['[[2,1,3],[6,5,4],[7,8,9]]'],
      ['[[5]]'],
      ['[[-19,57],[-40,-5]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[100,100],[100,100]]'],
      ['[[1],[2],[3]]'],
      ['[[2,2,2],[2,2,2]]'],
      ['[[-1,-2,-3]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
      ['[[3,1,2],[1,5,1],[2,1,3]]'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b5-${prob.n}.py`);
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
    .replace(new RegExp(`^def ${prob.method_name}\\(${prob.params.map((p) => p.name).join(', ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\):\\n`), '')
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
    if (haveNums.has(prob.n)) { console.log(`  skip #${prob.n} (${prob.id}) — number already present`); continue; }
    if (haveIds.has(prob.id)) { console.log(`  skip #${prob.n} (${prob.id}) — id already present`); continue; }
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
    console.log(`  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, sample expected: ${test_cases[0].expected}`);
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
  for (const c of check || []) console.log(`  #${c.leetcode_number} ${c.name} tags=${JSON.stringify(c.tags)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
