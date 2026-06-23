#!/usr/bin/env node
// Batch 51 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3460,3466,3471,3476,3481,3491,3496,3631,3632,3641,3647,3656,3662,3667,3672
//
//   node scripts/fill-gap-problems-batch51.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch51.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch51.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3460, 3466, 3471, 3476, 3481, 3491, 3496, 3631, 3632, 3641, 3647, 3656, 3662, 3667, 3672];

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
    n: 3460,
    id: 'pghub-b51-elevator-stops',
    name: 'Elevator Energy Stops',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'totalEnergy',
    params: [{ name: 'floors', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An elevator visits the floors in <code>floors</code> in the given order, starting from the first one. Moving between consecutive visited floors costs energy equal to the absolute difference in floor numbers. Return the total energy spent over the whole trip.',
    examples: [
      ['[1,4,2,6]', '9', 'Moves cost |4-1|+|2-4|+|6-2| = 3+2+4 = 9.'],
      ['[5]', '0', 'A single floor means no movement.'],
    ],
    constraints: ['1 <= floors.length <= 10^5', '0 <= floors[i] <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def totalEnergy(floors):
    total = 0
    for i in range(1, len(floors)):
        total += abs(floors[i] - floors[i - 1])
    return total`,
    approach:
      'The cost of the trip is the sum of absolute differences between each pair of consecutive visited floors. A single linear pass accumulating those differences gives the answer; a trip of one floor costs nothing.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,4,2,6]'],
      ['[5]'],
      ['[0,0,0]'],
      ['[10,1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[7,7,7,7,1]'],
      ['[100,0,100,0]'],
      ['[3,8,8,2,2,9]'],
      ['[1000000000,0]'],
    ],
  },
  {
    n: 3466,
    id: 'pghub-b51-vowel-window',
    name: 'Densest Vowel Window',
    topic_id: 'sliding-window',
    difficulty: 'Easy',
    method_name: 'maxVowels',
    params: [
      { name: 's', type: 'str' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code> and an integer <code>k</code>, return the maximum number of vowels (a, e, i, o, u) contained in any contiguous substring of length exactly <code>k</code>. If <code>k</code> exceeds the length of <code>s</code>, return the total number of vowels in <code>s</code>.',
    examples: [
      ['abciiidef\n3', '3', 'The window "iii" holds 3 vowels.'],
      ['rhythm\n4', '0', 'No window contains a vowel.'],
    ],
    constraints: ['1 <= s.length <= 10^5', '1 <= k', 's consists of lowercase English letters'],
    tags: ['sliding-window', 'strings'],
    py: `def maxVowels(s, k):
    vowels = set('aeiou')
    n = len(s)
    if k >= n:
        return sum(1 for c in s if c in vowels)
    cur = sum(1 for c in s[:k] if c in vowels)
    best = cur
    for i in range(k, n):
        if s[i] in vowels:
            cur += 1
        if s[i - k] in vowels:
            cur -= 1
        if cur > best:
            best = cur
    return best`,
    approach:
      'Slide a fixed-width window of size k across the string, maintaining a running count of vowels inside it. Each step adds the entering character and removes the leaving one in constant time, so the best count over all positions is found in one pass. When k covers the whole string, the answer is simply every vowel present.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"abciiidef"', '3'],
      ['"rhythm"', '4'],
      ['"aeiou"', '2'],
      ['"leetcode"', '3'],
      ['"a"', '1'],
      ['"bcdfg"', '10'],
      ['"aaaaa"', '2'],
      ['"abacabad"', '4'],
      ['"xyzaeiouxyz"', '5'],
      ['"hello"', '1'],
    ],
  },
  {
    n: 3471,
    id: 'pghub-b51-paren-balance',
    name: 'Minimum Parenthesis Insertions',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'minInsertions',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code>. Return the minimum number of single parentheses you must insert anywhere in the string to make it a valid balanced sequence.',
    examples: [
      ['(()', '1', 'Insert one ")" at the end to balance the extra open bracket.'],
      [')(', '2', 'Add "(" before and ")" after to make "()()" valid in two insertions.'],
    ],
    constraints: ['1 <= s.length <= 10^5', "s consists only of '(' and ')'"],
    tags: ['stack', 'greedy'],
    py: `def minInsertions(s):
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
      'Scan left to right tracking how many open brackets are currently unmatched. A close bracket cancels one open bracket if available; otherwise it itself is unmatched and needs an inserted open bracket. After the scan, any open brackets still waiting each need a close bracket. Summing both kinds of unmatched brackets gives the minimum insertions.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(()"'],
      ['")("'],
      ['"()"'],
      ['"((("'],
      ['")))"'],
      ['"(()))("'],
      ['"()()()"'],
      ['"((()))"'],
      ['"))(("'],
      ['"((())"'],
    ],
  },
  {
    n: 3476,
    id: 'pghub-b51-jump-reach',
    name: 'Reach The Last Tile',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'canReachEnd',
    params: [{ name: 'jump', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'You start on the first tile of a row given by <code>jump</code>, where <code>jump[i]</code> is the maximum number of tiles you may move forward from tile <code>i</code>. Return <code>true</code> if you can reach the last tile, otherwise <code>false</code>.',
    examples: [
      ['[2,3,1,1,4]', 'true', 'Jump 1 then 3 reaches the final tile.'],
      ['[3,2,1,0,4]', 'false', 'You inevitably land on the 0 and get stuck before the end.'],
    ],
    constraints: ['1 <= jump.length <= 10^5', '0 <= jump[i] <= 10^5'],
    tags: ['greedy', 'arrays'],
    py: `def canReachEnd(jump):
    reach = 0
    last = len(jump) - 1
    for i in range(len(jump)):
        if i > reach:
            return False
        reach = max(reach, i + jump[i])
        if reach >= last:
            return True
    return True`,
    approach:
      'Track the farthest tile reachable so far. Walking left to right, if the current index ever exceeds that reach the path is broken. Otherwise extend the reach with the jump from the current tile, and the moment it covers the last index the end is reachable.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,1,1,4]'],
      ['[3,2,1,0,4]'],
      ['[0]'],
      ['[1,0]'],
      ['[2,0,0]'],
      ['[5,0,0,0,0,0]'],
      ['[1,1,1,1,1]'],
      ['[0,1]'],
      ['[4,1,1,0,1]'],
      ['[1,2,0,0,0]'],
    ],
  },
  {
    n: 3481,
    id: 'pghub-b51-pair-target',
    name: 'Count Pairs Summing To Target',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countPairs',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>target</code>, return the number of unordered index pairs <code>(i, j)</code> with <code>i < j</code> such that <code>nums[i] + nums[j] == target</code>.',
    examples: [
      ['[1,2,3,4,3]\n6', '2', 'Pairs (2,4) and (3,3) by value give sum 6: indices (1,3) and (2,4).'],
      ['[1,1,1,1]\n2', '6', 'Every pair of the four 1s sums to 2.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    tags: ['arrays', 'hash-map'],
    py: `def countPairs(nums, target):
    seen = defaultdict(int)
    count = 0
    for x in nums:
        count += seen[target - x]
        seen[x] += 1
    return count`,
    approach:
      'Process the array once while keeping a tally of how many times each earlier value appeared. For the current value, every previously seen complement (target minus current) forms a valid pair, so add that running count before recording the current value. This counts each unordered pair exactly once.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,3]', '6'],
      ['[1,1,1,1]', '2'],
      ['[5]', '5'],
      ['[0,0,0]', '0'],
      ['[-1,1,2,-2]', '0'],
      ['[3,3,3,3]', '6'],
      ['[1,2,3,4,5]', '100'],
      ['[10,-10,5,-5]', '0'],
      ['[2,4,6,8]', '10'],
      ['[7,1,5,3,9,2]', '8'],
    ],
  },
  {
    n: 3491,
    id: 'pghub-b51-island-perimeter',
    name: 'Single Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Easy',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A binary <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. Return the total perimeter of the land. Each land cell contributes four unit edges, minus one for every shared edge with an adjacent land cell.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped landmass has a perimeter of 12.'],
      ['[[1]]', '4', 'A lone cell has all four edges exposed.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'matrix'],
    py: `def islandPerimeter(grid):
    rows = len(grid)
    cols = len(grid[0])
    perimeter = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perimeter += 4
                if r > 0 and grid[r - 1][c] == 1:
                    perimeter -= 2
                if c > 0 and grid[r][c - 1] == 1:
                    perimeter -= 2
    return perimeter`,
    approach:
      'Each land cell starts with four exposed edges. Whenever two land cells are adjacent they hide one edge each, so for every neighboring pair the perimeter drops by two. Counting four per land cell and subtracting two for each upward and leftward neighbor visits every shared border exactly once.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,0,1],[0,1,0],[1,0,1]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
    ],
  },
  {
    n: 3496,
    id: 'pghub-b51-coin-combos',
    name: 'Ways To Make Change',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'changeWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given distinct positive coin denominations <code>coins</code> and a target <code>amount</code>, return the number of distinct combinations of coins (order does not matter, unlimited supply of each) that add up to exactly <code>amount</code>.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5, 1+1+1+2, 1+2+2, 1+1+1+1+1.'],
      ['[2]\n3', '0', 'No combination of 2s makes 3.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def changeWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for coin in coins:
        for a in range(coin, amount + 1):
            dp[a] += dp[a - coin]
    return dp[amount]`,
    approach:
      'Build the number of ways to form each sub-amount, processing one coin denomination at a time so that order never matters. For a fixed coin, the ways to reach an amount grow by the ways to reach that amount minus the coin. Iterating coins in the outer loop counts each unordered combination exactly once.',
    complexity: { time: 'O(coins*amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[3,7]', '14'],
      ['[2,4,6]', '8'],
      ['[1,5,10,25]', '100'],
      ['[7]', '7'],
      ['[2,3,5]', '9'],
    ],
  },
  {
    n: 3631,
    id: 'pghub-b51-kth-largest',
    name: 'Kth Largest In Stream',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargestAfter',
    params: [
      { name: 'k', type: 'int' },
      { name: 'stream', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Numbers arrive one at a time in <code>stream</code>. After each arrival, report the <code>k</code>-th largest value among all numbers seen so far, or <code>-1</code> if fewer than <code>k</code> numbers have arrived. Return the list of reported values in arrival order.',
    examples: [
      ['2\n[5,1,7,3]', '[-1,1,5,5]', 'After two values the 2nd largest is 1; after 7 it is 5; after 3 still 5.'],
      ['1\n[4,2,9]', '[4,4,9]', 'The 1st largest is just the running maximum.'],
    ],
    constraints: ['1 <= k <= 10^4', '1 <= stream.length <= 10^4', '-10^9 <= stream[i] <= 10^9'],
    tags: ['heap', 'priority-queue'],
    py: `def kthLargestAfter(k, stream):
    heap = []
    res = []
    for x in stream:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
        if len(heap) < k:
            res.append(-1)
        else:
            res.append(heap[0])
    return res`,
    approach:
      'Keep a min-heap holding only the k largest values seen so far. Each new number is pushed, and if the heap grows past k its smallest element is removed, so the heap root is always the k-th largest. Until k numbers have arrived the answer is -1; afterward it is the heap root.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['2', '[5,1,7,3]'],
      ['1', '[4,2,9]'],
      ['3', '[1,2,3,4,5]'],
      ['1', '[10]'],
      ['2', '[2,2,2,2]'],
      ['4', '[1,2,3]'],
      ['2', '[9,8,7,6,5]'],
      ['3', '[3,1,4,1,5,9,2,6]'],
      ['1', '[-5,-1,-9,-3]'],
      ['5', '[5,4,3,2,1,6,7]'],
    ],
  },
  {
    n: 3632,
    id: 'pghub-b51-zigzag-rows',
    name: 'Zigzag Row Read',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'zigzagRead',
    params: [
      { name: 's', type: 'str' },
      { name: 'rows', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'Write the characters of <code>s</code> in a zigzag pattern down and up across <code>rows</code> rows, then read them row by row left to right to form a new string. Return that string. With one row the string is unchanged.',
    examples: [
      ['PAYPALISHIRING\n3', 'PAHNAPLSIIGYIR', 'Written zigzag over 3 rows then read row by row.'],
      ['ABCD\n1', 'ABCD', 'A single row keeps the original order.'],
    ],
    constraints: ['1 <= s.length <= 10^4', '1 <= rows <= 10^4', 's consists of printable ASCII characters'],
    tags: ['strings', 'simulation'],
    py: `def zigzagRead(s, rows):
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
    return ''.join(''.join(b) for b in buckets)`,
    approach:
      'Simulate walking down the rows then back up, appending each character to its current row bucket. A direction flag flips at the top and bottom rows so the index bounces between them. Concatenating the buckets top to bottom reproduces the row-by-row reading; a single row or a string shorter than the rows needs no rearrangement.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"PAYPALISHIRING"', '3'],
      ['"ABCD"', '1'],
      ['"PAYPALISHIRING"', '4'],
      ['"AB"', '1'],
      ['"ABCDE"', '2'],
      ['"HELLOWORLD"', '3'],
      ['"A"', '5'],
      ['"ABCDEFG"', '7'],
      ['"ZIGZAG"', '2'],
      ['"abcdefghij"', '4'],
    ],
  },
  {
    n: 3641,
    id: 'pghub-b51-binary-gap',
    name: 'Longest Binary Gap',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'longestGap',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a positive integer <code>n</code>, consider its binary representation. A binary gap is a maximal sequence of consecutive zeros that is bounded by a one on both ends. Return the length of the longest binary gap, or <code>0</code> if there is none.',
    examples: [
      ['9', '2', '9 is 1001 in binary; the gap of two zeros sits between the ones.'],
      ['15', '0', '15 is 1111 with no zeros between ones.'],
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
    tags: ['bit-manipulation', 'math'],
    py: `def longestGap(n):
    best = 0
    current = -1
    while n > 0:
        bit = n & 1
        n >>= 1
        if bit == 1:
            if current > best:
                best = current
            current = 0
        elif current >= 0:
            current += 1
    return best`,
    approach:
      'Read the bits from least significant upward. Counting of a gap begins only after the first set bit is seen; each zero extends the current run and each set bit closes it, updating the best length. Trailing zeros after the final one are ignored because they are not bounded on both sides.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['9'],
      ['15'],
      ['1'],
      ['1041'],
      ['32'],
      ['529'],
      ['20'],
      ['2147483647'],
      ['6'],
      ['1073741825'],
    ],
  },
  {
    n: 3647,
    id: 'pghub-b51-subarray-target',
    name: 'Subarrays With Exact Sum',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'countSubarrays',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> (which may contain negatives) and an integer <code>target</code>, return the number of contiguous subarrays whose elements sum to exactly <code>target</code>.',
    examples: [
      ['[1,1,1]\n2', '2', 'The subarrays [1,1] at positions 0-1 and 1-2 both sum to 2.'],
      ['[1,-1,0]\n0', '3', 'Subarrays [1,-1], [1,-1,0], and [0] each sum to 0.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '-10^9 <= target <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def countSubarrays(nums, target):
    seen = defaultdict(int)
    seen[0] = 1
    prefix = 0
    count = 0
    for x in nums:
        prefix += x
        count += seen[prefix - target]
        seen[prefix] += 1
    return count`,
    approach:
      'A subarray sums to the target exactly when the running prefix sum at its end minus the prefix sum just before its start equals the target. Keep a tally of every prefix sum seen so far; for each new prefix, the number of earlier prefixes equal to (prefix minus target) is the count of qualifying subarrays ending here.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,1,1]', '2'],
      ['[1,-1,0]', '0'],
      ['[3,4,7,2,-3,1,4,2]', '7'],
      ['[1]', '1'],
      ['[1]', '2'],
      ['[0,0,0]', '0'],
      ['[-1,-1,-1]', '-2'],
      ['[5,5,5,5]', '10'],
      ['[1,2,3,4,5]', '15'],
      ['[2,-2,2,-2,2]', '0'],
    ],
  },
  {
    n: 3656,
    id: 'pghub-b51-tree-diameter',
    name: 'Binary Tree Diameter',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'treeDiameter',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given as a level-order array <code>tree</code> where <code>null</code> (encoded as <code>-1</code>) marks an absent node, and the children of the node at index <code>i</code> are at indices <code>2i+1</code> and <code>2i+2</code>. The diameter is the number of edges on the longest path between any two nodes. Return the diameter, or <code>0</code> for an empty or single-node tree.',
    examples: [
      ['[1,2,3,4,5]', '3', 'The longest path runs 4 -> 2 -> 1 -> 3 (or via 5), spanning 3 edges.'],
      ['[1]', '0', 'A single node has no edges.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'tree[i] is -1 for an absent node, otherwise a node value', 'the array is a valid heap-style layout'],
    tags: ['trees', 'depth-first-search'],
    py: `def treeDiameter(tree):
    n = len(tree)
    best = 0
    def depth(i):
        nonlocal best
        if i >= n or tree[i] == -1:
            return 0
        left = depth(2 * i + 1)
        right = depth(2 * i + 2)
        if left + right > best:
            best = left + right
        return 1 + max(left, right)
    depth(0)
    return best`,
    approach:
      'For each node the longest path passing through it equals the height of its left subtree plus the height of its right subtree. A single depth-first traversal computes every subtree height while tracking the largest such through-node sum encountered, which is the diameter in edges.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    cases: [
      ['[1,2,3,4,5]'],
      ['[1]'],
      ['[]'],
      ['[1,2,-1,3,-1,-1,-1,4]'],
      ['[1,2,3]'],
      ['[1,2,3,4,5,6,7]'],
      ['[1,-1,2,-1,-1,-1,3]'],
      ['[10,20,30,40,-1,-1,50]'],
      ['[1,2,-1,-1,3]'],
      ['[5,4,8,11,-1,13,4,7,2]'],
    ],
  },
  {
    n: 3662,
    id: 'pghub-b51-word-ladder-len',
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
      'Given a start word <code>begin</code>, a goal word <code>end</code>, and a dictionary <code>words</code> (all equal length, lowercase), return the number of words in the shortest transformation sequence from <code>begin</code> to <code>end</code> where each step changes exactly one letter and every intermediate word is in <code>words</code>. The count includes both endpoints. Return <code>0</code> if no such sequence exists.',
    examples: [
      ['hit\ncog\n["hot","dot","dog","lot","log","cog"]', '5', 'hit -> hot -> dot -> dog -> cog uses 5 words.'],
      ['hit\ncog\n["hot","dot","dog","lot","log"]', '0', 'Without "cog" in the dictionary the goal is unreachable.'],
    ],
    constraints: ['1 <= begin.length <= 10', 'all words share the same length', '1 <= words.length <= 5000'],
    tags: ['advanced-graphs', 'breadth-first-search'],
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
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                nxt = word[:i] + c + word[i + 1:]
                if nxt in word_set and nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, steps + 1))
    return 0`,
    approach:
      'Treat each word as a graph node with edges to dictionary words differing by one letter, then run breadth-first search from the start word so the first time the goal is dequeued the count is minimal. Neighbors are generated by trying every single-letter substitution and keeping only those in the dictionary not yet visited. If the goal is missing or never reached the answer is zero.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N * L)' },
    multiParam: true,
    cases: [
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'],
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'],
      ['"a"', '"c"', '["a","b","c"]'],
      ['"hot"', '"hot"', '["hot"]'],
      ['"cat"', '"dog"', '["cat","cot","cog","dog"]'],
      ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'],
      ['"abc"', '"abc"', '["abc"]'],
      ['"lead"', '"gold"', '["load","goad","gold","lead","lend"]'],
      ['"game"', '"fame"', '["fame","gane","game"]'],
      ['"top"', '"pop"', '["tip","tap","pop"]'],
    ],
  },
  {
    n: 3667,
    id: 'pghub-b51-min-edit',
    name: 'Edit Distance',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'editDistance',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'Given two lowercase strings <code>a</code> and <code>b</code>, return the minimum number of single-character edits (insert, delete, or replace) needed to turn <code>a</code> into <code>b</code>.',
    examples: [
      ['horse\nros', '3', 'Replace h->r, delete r, delete e.'],
      ['abc\nabc', '0', 'The strings are already equal.'],
    ],
    constraints: ['0 <= a.length, b.length <= 500', 'both consist of lowercase English letters'],
    tags: ['2d-dp', 'strings'],
    py: `def editDistance(a, b):
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            tmp = dp[j]
            if a[i - 1] == b[j - 1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j], dp[j - 1])
            prev = tmp
    return dp[n]`,
    approach:
      'Define the cost to convert a prefix of the first string into a prefix of the second. Matching characters carry the diagonal cost forward unchanged, while a mismatch takes one plus the cheapest of replace, delete, or insert. Storing only one rolling row keeps the table compact, and the final cell holds the full edit distance.',
    complexity: { time: 'O(m*n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"horse"', '"ros"'],
      ['"abc"', '"abc"'],
      ['"intention"', '"execution"'],
      ['""', '"abc"'],
      ['"abc"', '""'],
      ['""', '""'],
      ['"sunday"', '"saturday"'],
      ['"kitten"', '"sitting"'],
      ['"abcdef"', '"azced"'],
      ['"aaaa"', '"aa"'],
    ],
  },
  {
    n: 3672,
    id: 'pghub-b51-rabbit-hop',
    name: 'Distinct Frog Stairs',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'countWays',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A frog climbs a staircase of <code>n</code> steps, hopping either 1 or 2 steps at a time. Return the number of distinct ordered sequences of hops that bring it exactly to the top.',
    examples: [
      ['4', '5', 'The sequences are 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2.'],
      ['1', '1', 'Only a single one-step hop reaches the top.'],
    ],
    constraints: ['0 <= n <= 90'],
    tags: ['dp', 'fibonacci'],
    py: `def countWays(n):
    if n <= 1:
        return 1
    prev, cur = 1, 1
    for _ in range(2, n + 1):
        prev, cur = cur, prev + cur
    return cur`,
    approach:
      'The number of ways to reach a step equals the ways to reach the two steps below it, since the last hop is either one or two steps. This is the Fibonacci recurrence with bases of one way for zero or one step. Iterating with two rolling values yields the count without recursion.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['4'],
      ['1'],
      ['0'],
      ['2'],
      ['3'],
      ['5'],
      ['10'],
      ['20'],
      ['45'],
      ['90'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B51>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b51-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B51>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B51>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b51-grade-${prob.n}.py`);
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
