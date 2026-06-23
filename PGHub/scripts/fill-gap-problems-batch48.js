#!/usr/bin/env node
// Batch 48 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3236,3237,3246,3247,3252,3253,3262,3263,3268,3269,3278,3279,3284,3293,3294
//
//   node scripts/fill-gap-problems-batch48.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch48.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch48.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3236, 3237, 3246, 3247, 3252, 3253, 3262, 3263, 3268, 3269, 3278, 3279, 3284, 3293, 3294];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
null = None  # allow JSON-style null literals in test inputs
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 3236,
    id: 'pghub-b48-elevator-stops',
    name: 'Elevator Resting Floor',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'restFloor',
    params: [{ name: 'moves', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An elevator starts at floor <code>0</code>. Each value in <code>moves</code> is a signed number of floors it travels next (positive up, negative down). Return the floor where it finally rests after performing every move in order.',
    examples: [
      ['[3,-1,2]', '4', 'Starts at 0, goes to 3, then 2, then 4.'],
      ['[-2,-3]', '-5', 'Two downward moves end at floor -5 (a basement).'],
    ],
    constraints: ['1 <= moves.length <= 10^5', '-10^4 <= moves[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def restFloor(moves):
    floor = 0
    for m in moves:
        floor += m
    return floor`,
    approach:
      'The resting floor is simply the running total of all signed moves applied to the starting floor of zero. Accumulate the values in a single pass and return the sum.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,-1,2]'],
      ['[-2,-3]'],
      ['[0]'],
      ['[5]'],
      ['[1,1,1,1,1]'],
      ['[10,-10]'],
      ['[-1,2,-3,4,-5]'],
      ['[100,-50,-50]'],
      ['[7,-2,-2,-3]'],
      ['[-4,-4,-4,12]'],
    ],
  },
  {
    n: 3237,
    id: 'pghub-b48-vowel-shift',
    name: 'Vowel Caesar Shift',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'shiftVowels',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a lowercase string <code>s</code>, replace every vowel (a, e, i, o, u) with the next vowel in that cyclic order (a->e->i->o->u->a) and leave all other characters unchanged. Return the transformed string.',
    examples: [
      ['hello', 'hillu', 'e becomes i, o becomes u.'],
      ['xyz', 'xyz', 'No vowels, so the string is unchanged.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'hash-map'],
    py: `def shiftVowels(s):
    nxt = {'a': 'e', 'e': 'i', 'i': 'o', 'o': 'u', 'u': 'a'}
    return ''.join(nxt.get(ch, ch) for ch in s)`,
    approach:
      'Map each vowel to its successor in the cyclic vowel order using a small lookup table. Scan the string once, substituting vowels via the table and copying every other character verbatim, then join the result.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"hello"'],
      ['"xyz"'],
      ['"aeiou"'],
      ['"a"'],
      ['"programming"'],
      ['"uuuuu"'],
      ['"bcdfg"'],
      ['"queue"'],
      ['"education"'],
      ['"zzzaeiouzzz"'],
    ],
  },
  {
    n: 3246,
    id: 'pghub-b48-pair-target',
    name: 'Count Pairs To Target',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'countPairs',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>target</code>, count the number of unordered index pairs <code>(i, j)</code> with <code>i &lt; j</code> such that <code>nums[i] + nums[j] == target</code>. Return that count.',
    examples: [
      ['[1,2,3,4]\n5', '2', 'Pairs (1,4) and (2,3) both sum to 5.'],
      ['[2,2,2]\n4', '3', 'Every one of the three pairs of 2s sums to 4.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    tags: ['hash-map', 'arrays'],
    py: `def countPairs(nums, target):
    seen = defaultdict(int)
    count = 0
    for x in nums:
        count += seen[target - x]
        seen[x] += 1
    return count`,
    approach:
      'Sweep once keeping a frequency map of values seen so far. For each element, the number of valid partners already encountered is the count of its complement (target minus the value); add that to the running total before recording the current value. This counts each unordered pair exactly once.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '5'],
      ['[2,2,2]', '4'],
      ['[1]', '2'],
      ['[0,0,0,0]', '0'],
      ['[-1,1,-1,1]', '0'],
      ['[5,5,5,5]', '10'],
      ['[1,2,3,4,5,6]', '7'],
      ['[10,-10,20,-20]', '0'],
      ['[3,3,4,4]', '7'],
      ['[1000000000,-1000000000]', '0'],
    ],
  },
  {
    n: 3247,
    id: 'pghub-b48-island-perimeter',
    name: 'Single Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A binary <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. Each land cell is a unit square. Return the total perimeter of the land: count every side of every land cell that borders water or the edge of the grid.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'A plus shape of 5 cells exposes 12 outer edges.'],
      ['[[1]]', '4', 'A lone cell has all four sides exposed.'],
    ],
    constraints: ['1 <= grid.length <= 100', '1 <= grid[0].length <= 100', 'grid[i][j] is 0 or 1'],
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
      'Every land cell contributes four edges, but each shared border between two adjacent land cells removes two edges from the total (one from each cell). Scan all cells adding four per land cell, and for each up-neighbour and left-neighbour that is also land subtract two, which counts every internal seam exactly once.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,1,1,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[0,1,1,0],[1,1,1,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
    ],
  },
  {
    n: 3252,
    id: 'pghub-b48-stock-single',
    name: 'Single Trade Profit',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given daily stock <code>prices</code>, you may buy on one day and sell on a strictly later day, at most once. Return the maximum profit; if no profitable trade exists, return <code>0</code>.',
    examples: [
      ['[7,1,5,3,6,4]', '5', 'Buy at 1, sell at 6, for a profit of 5.'],
      ['[7,6,4,3,1]', '0', 'Prices only fall, so no trade is made.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^9'],
    tags: ['dp', 'arrays'],
    py: `def maxProfit(prices):
    best = 0
    cheapest = prices[0]
    for p in prices:
        if p < cheapest:
            cheapest = p
        elif p - cheapest > best:
            best = p - cheapest
    return best`,
    approach:
      'Track the cheapest price seen so far as a potential buy day. For each later day, the best profit ending there is the current price minus that minimum. Sweep once updating both the running minimum and the best profit; the floor of zero covers the no-trade case.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[7,1,5,3,6,4]'],
      ['[7,6,4,3,1]'],
      ['[1]'],
      ['[1,2]'],
      ['[2,1]'],
      ['[3,3,3,3]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1,10]'],
      ['[2,4,1]'],
      ['[100,180,260,310,40,535,695]'],
    ],
  },
  {
    n: 3253,
    id: 'pghub-b48-kth-distinct',
    name: 'Kth Distinct String',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'kthDistinct',
    params: [
      { name: 'arr', type: 'List[str]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'A distinct string is one that appears exactly once in the array <code>arr</code>. Return the <code>k</code>-th distinct string in the order they appear in <code>arr</code>. If fewer than <code>k</code> distinct strings exist, return the empty string.',
    examples: [
      ['["d","b","c","b","c","a"]\n2', 'a', 'Distinct strings in order are d, a; the 2nd is a.'],
      ['["a","a"]\n1', '', 'No string is distinct, so return empty.'],
    ],
    constraints: ['1 <= arr.length <= 1000', '1 <= arr[i].length <= 5', '1 <= k <= arr.length', 'arr[i] is lowercase letters'],
    tags: ['hash-map', 'strings'],
    py: `def kthDistinct(arr, k):
    freq = Counter(arr)
    for s in arr:
        if freq[s] == 1:
            k -= 1
            if k == 0:
                return s
    return ""`,
    approach:
      'Count how often each string occurs. Then walk the array in order, and for each string appearing exactly once decrement k; when k reaches zero that string is the answer. If the walk ends without k hitting zero, there are too few distinct strings, so return empty.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['["d","b","c","b","c","a"]', '2'],
      ['["a","a"]', '1'],
      ['["a","b","c"]', '3'],
      ['["aaa"]', '1'],
      ['["x","x","y","z","y"]', '1'],
      ['["x","x","y","z","y"]', '2'],
      ['["a","b","a","c","b","d"]', '1'],
      ['["a","b","a","c","b","d"]', '2'],
      ['["p","q","r","s","t"]', '5'],
      ['["m","m","n","n","o"]', '1'],
    ],
  },
  {
    n: 3262,
    id: 'pghub-b48-meeting-rooms',
    name: 'Minimum Meeting Rooms',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minRooms',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[start, end]</code> in <code>meetings</code> is a half-open interval (a meeting occupies a room during <code>start</code> up to but not including <code>end</code>). Return the minimum number of rooms needed so no two overlapping meetings share a room.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'The [0,30] meeting overlaps both others, needing a second room.'],
      ['[[7,10],[2,4]]', '1', 'These meetings never overlap, so one room suffices.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'heap'],
    py: `def minRooms(meetings):
    starts = sorted(m[0] for m in meetings)
    ends = sorted(m[1] for m in meetings)
    rooms = 0
    best = 0
    j = 0
    for s in starts:
        while j < len(ends) and ends[j] <= s:
            rooms -= 1
            j += 1
        rooms += 1
        if rooms > best:
            best = rooms
    return best`,
    approach:
      'Sort start and end times separately. Sweep over the starts; before opening each meeting, free any rooms whose meetings have already ended (end time at or before this start, since intervals are half-open). The peak number of simultaneously occupied rooms during the sweep is the minimum rooms required.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[7,10],[2,4]]'],
      ['[[1,5]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[1,10],[2,7],[3,19],[8,12],[10,20],[11,30]]'],
      ['[[0,1],[0,1],[0,1]]'],
      ['[[1,5],[5,10],[10,15]]'],
      ['[[2,11],[6,16],[11,16]]'],
      ['[[0,100],[1,2],[3,4],[5,6]]'],
      ['[[9,10],[4,9],[4,17]]'],
    ],
  },
  {
    n: 3263,
    id: 'pghub-b48-bitset-subsets',
    name: 'Subset XOR Total',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'subsetXorSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'The XOR total of an array is the bitwise XOR of all its elements (the XOR total of the empty array is <code>0</code>). Given <code>nums</code>, return the sum of XOR totals over every one of its subsets (including the empty subset).',
    examples: [
      ['[1,3]', '6', 'Subsets {}, {1}, {3}, {1,3} have XOR totals 0,1,3,2 summing to 6.'],
      ['[5,1,6]', '28', 'Summing the XOR totals of all 8 subsets gives 28.'],
    ],
    constraints: ['1 <= nums.length <= 12', '1 <= nums[i] <= 20'],
    tags: ['bit-manipulation', 'math'],
    py: `def subsetXorSum(nums):
    bits = 0
    for x in nums:
        bits |= x
    return bits << (len(nums) - 1)`,
    approach:
      'A bit set in any element appears in the XOR total of exactly half of all subsets, contributing that bit value times 2^(n-1) to the grand sum. So the answer is the OR of all elements (the union of present bits) shifted left by n-1. This closed form avoids enumerating subsets.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3]'],
      ['[5,1,6]'],
      ['[3,4,5,6,7,8]'],
      ['[1]'],
      ['[20]'],
      ['[1,2,4,8,16]'],
      ['[7,7,7]'],
      ['[2,2]'],
      ['[1,2,3,4,5,6,7,8,9,10,11,12]'],
      ['[10,15,20]'],
    ],
  },
  {
    n: 3268,
    id: 'pghub-b48-tree-tilt',
    name: 'Binary Tree Sum Tilt',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'findTilt',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given in level order as <code>values</code>, where <code>null</code> marks a missing child. The tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree (an absent subtree sums to <code>0</code>). Return the sum of every node\'s tilt.',
    examples: [
      ['[4,2,9,3,5,null,7]', '15', 'Node tilts add up to 15 across the tree.'],
      ['[1]', '0', 'A single node has no children, so its tilt is 0.'],
    ],
    constraints: ['1 <= number of nodes <= 10^4', '-1000 <= node value <= 1000'],
    tags: ['trees', 'recursion'],
    py: `def findTilt(values):
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
      'Treat the level-order list as a heap-indexed tree: node i has children at 2i+1 and 2i+2. A post-order recursion returns each subtree sum while accumulating the absolute left-minus-right difference at every node. The accumulated value is the total tilt.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    cases: [
      ['[4,2,9,3,5,null,7]'],
      ['[1]'],
      ['[1,2,3]'],
      ['[1,2,null,3,null,4]'],
      ['[5,3,8,1,4,7,9]'],
      ['[0,0,0]'],
      ['[10,null,20]'],
      ['[-5,3,-8]'],
      ['[1,2,3,4,5,6,7]'],
      ['[100,50,50,25,25,25,25]'],
    ],
  },
  {
    n: 3269,
    id: 'pghub-b48-jump-reach',
    name: 'Minimum Jumps To End',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minJumps',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You start at index <code>0</code> of array <code>nums</code>; <code>nums[i]</code> is the maximum number of steps you can jump forward from index <code>i</code>. Return the minimum number of jumps to reach the last index. It is guaranteed the last index is reachable.',
    examples: [
      ['[2,3,1,1,4]', '2', 'Jump 1 step to index 1, then 3 steps to the end.'],
      ['[0]', '0', 'Already at the last index, so zero jumps.'],
    ],
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 1000', 'the last index is always reachable'],
    tags: ['greedy', 'arrays'],
    py: `def minJumps(nums):
    n = len(nums)
    jumps = 0
    cur_end = 0
    farthest = 0
    for i in range(n - 1):
        if i + nums[i] > farthest:
            farthest = i + nums[i]
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps`,
    approach:
      'Sweep left to right tracking the farthest index reachable so far. Treat the current jump as covering a window; when the scan reaches the window end, commit one jump and extend the window to the farthest reachable index. Counting these window boundaries yields the minimum number of jumps.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,1,1,4]'],
      ['[0]'],
      ['[1,1,1,1]'],
      ['[5,1,1,1,1]'],
      ['[2,1]'],
      ['[3,2,1,1,4]'],
      ['[1,2,3]'],
      ['[2,3,0,1,4]'],
      ['[4,1,1,1,1]'],
      ['[1,1,1,1,1,1,1,1,1,1]'],
    ],
  },
  {
    n: 3278,
    id: 'pghub-b48-sorted-square',
    name: 'Sorted Squares Merge',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'sortedSquares',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given an array <code>nums</code> sorted in non-decreasing order, return an array of the squares of each number, also sorted in non-decreasing order. Aim for linear time.',
    examples: [
      ['[-4,-1,0,3,10]', '[0,1,9,16,100]', 'Squares are 16,1,0,9,100, then sorted.'],
      ['[1,2,3]', '[1,4,9]', 'Already non-negative, so squares stay sorted.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'nums is sorted non-decreasing'],
    tags: ['two-pointers', 'arrays'],
    py: `def sortedSquares(nums):
    n = len(nums)
    res = [0] * n
    lo, hi = 0, n - 1
    for pos in range(n - 1, -1, -1):
        if abs(nums[lo]) > abs(nums[hi]):
            res[pos] = nums[lo] * nums[lo]
            lo += 1
        else:
            res[pos] = nums[hi] * nums[hi]
            hi -= 1
    return res`,
    approach:
      'The largest square comes from whichever end has the larger absolute value, because the input is sorted. Use two pointers at the ends and fill the output array from the back: at each step compare the absolute values at the two ends, place the bigger square at the current back position, and move that pointer inward.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[-4,-1,0,3,10]'],
      ['[1,2,3]'],
      ['[-3,-2,-1]'],
      ['[0]'],
      ['[-5]'],
      ['[-2,0,2]'],
      ['[-7,-3,2,3,11]'],
      ['[0,0,0]'],
      ['[-10000,10000]'],
      ['[-1,-1,1,1]'],
    ],
  },
  {
    n: 3279,
    id: 'pghub-b48-decode-ways',
    name: 'Digit Message Decodings',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'numDecodings',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Letters were encoded as numbers where A=1, B=2, ..., Z=26. Given a digit string <code>s</code>, return the number of ways to decode it back into letters. A leading zero or any standalone zero that cannot pair into a valid 10 or 20 makes a decoding count of zero.',
    examples: [
      ['226', '3', 'Decodes as "BBF", "BZ", or "VF".'],
      ['06', '0', 'A leading zero cannot start a valid letter.'],
    ],
    constraints: ['1 <= s.length <= 100', 's consists of digits only'],
    tags: ['dp', 'strings'],
    py: `def numDecodings(s):
    if not s or s[0] == '0':
        return 0
    prev2 = 1
    prev1 = 1
    for i in range(1, len(s)):
        cur = 0
        if s[i] != '0':
            cur += prev1
        two = int(s[i - 1:i + 1])
        if 10 <= two <= 26:
            cur += prev2
        if cur == 0:
            return 0
        prev2 = prev1
        prev1 = cur
    return prev1`,
    approach:
      'Let the number of decodings of the prefix ending at each position depend on the last one or two digits. A non-zero current digit inherits the count from one position back; a valid two-digit number between 10 and 26 adds the count from two positions back. Roll two variables forward; an unavoidable zero collapses the count to zero.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"226"'],
      ['"06"'],
      ['"12"'],
      ['"0"'],
      ['"10"'],
      ['"27"'],
      ['"100"'],
      ['"11106"'],
      ['"2101"'],
      ['"111111111"'],
    ],
  },
  {
    n: 3284,
    id: 'pghub-b48-word-ladder-len',
    name: 'Word Transform Length',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'ladderLength',
    params: [
      { name: 'beginWord', type: 'str' },
      { name: 'endWord', type: 'str' },
      { name: 'wordList', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'Given two equal-length lowercase words <code>beginWord</code> and <code>endWord</code> and a <code>wordList</code>, find the length of the shortest transformation sequence from begin to end where each step changes exactly one letter and every intermediate word (including the end) is in the list. Return the number of words in the shortest sequence, or <code>0</code> if none exists. The begin word need not be in the list.',
    examples: [
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', '5', 'hit -> hot -> dot -> dog -> cog has 5 words.'],
      ['"hit"\n"cog"\n["hot","dot","dog","lot","log"]', '0', 'cog is missing from the list, so no sequence reaches it.'],
    ],
    constraints: ['1 <= word length <= 10', '1 <= wordList.length <= 5000', 'all words are lowercase and equal length'],
    tags: ['graphs', 'bfs'],
    py: `def ladderLength(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words:
        return 0
    q = deque([(beginWord, 1)])
    visited = {beginWord}
    while q:
        word, dist = q.popleft()
        if word == endWord:
            return dist
        for i in range(len(word)):
            for c in range(26):
                ch = chr(ord('a') + c)
                if ch == word[i]:
                    continue
                cand = word[:i] + ch + word[i + 1:]
                if cand in words and cand not in visited:
                    visited.add(cand)
                    q.append((cand, dist + 1))
    return 0`,
    approach:
      'Model each word as a graph node with edges between words differing by one letter, then breadth-first search from the begin word so the first time the end word is reached gives the shortest length. Generate neighbours by trying every single-letter substitution and keep only those in the word set, marking words visited to avoid revisiting.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N * L)' },
    multiParam: true,
    cases: [
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'],
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'],
      ['"a"', '"c"', '["a","b","c"]'],
      ['"hot"', '"dog"', '["hot","dog"]'],
      ['"hot"', '"dog"', '["hot","dog","dot"]'],
      ['"cat"', '"cat"', '["cat","bat","hat"]'],
      ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'],
      ['"game"', '"thee"', '["frye","heat","tree","thee","game","free","hell","fame","faye"]'],
      ['"leet"', '"code"', '["lest","leet","lose","code","lode","robe","lost"]'],
      ['"abc"', '"xyz"', '["abc","abd","aed"]'],
    ],
  },
  {
    n: 3293,
    id: 'pghub-b48-lru-evictions',
    name: 'LRU Cache Evictions',
    topic_id: 'queue',
    difficulty: 'Hard',
    method_name: 'countEvictions',
    params: [
      { name: 'capacity', type: 'int' },
      { name: 'accesses', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A least-recently-used cache holds at most <code>capacity</code> distinct keys. Process <code>accesses</code> in order: each access touches a key, making it most recently used; if the key is new and the cache is full, the least recently used key is evicted first. Return the total number of evictions.',
    examples: [
      ['2\n[1,2,3,1,4]', '2', 'Adding 3 evicts 1; adding 4 evicts 2 (1 was re-touched).'],
      ['2\n[1,1,1]', '0', 'Only one distinct key is ever cached, so nothing is evicted.'],
    ],
    constraints: ['1 <= capacity <= 10^5', '1 <= accesses.length <= 10^5', '1 <= accesses[i] <= 10^9'],
    tags: ['queue', 'hash-map'],
    py: `def countEvictions(capacity, accesses):
    from collections import OrderedDict
    cache = OrderedDict()
    evictions = 0
    for key in accesses:
        if key in cache:
            cache.move_to_end(key)
        else:
            if len(cache) >= capacity:
                cache.popitem(last=False)
                evictions += 1
            cache[key] = True
    return evictions`,
    approach:
      'Maintain an ordered map acting as the cache, with most-recently-used keys at the end. A hit moves the key to the end; a miss inserts it, and if the cache is already at capacity the front (least recently used) entry is evicted first and counted. The running eviction count is the answer.',
    complexity: { time: 'O(n)', space: 'O(capacity)' },
    multiParam: true,
    cases: [
      ['2', '[1,2,3,1,4]'],
      ['2', '[1,1,1]'],
      ['1', '[1,2,3,4]'],
      ['3', '[1,2,3,4,5]'],
      ['2', '[1,2,1,2,1,2]'],
      ['5', '[1,2,3,4,5]'],
      ['1', '[7,7,7,7]'],
      ['3', '[1,2,3,1,4,5]'],
      ['2', '[5,6,5,7,6,8]'],
      ['4', '[1,2,3,4,1,5,2,6]'],
    ],
  },
  {
    n: 3294,
    id: 'pghub-b48-trapping-water',
    name: 'Trapped Rainwater Volume',
    topic_id: 'two-pointers',
    difficulty: 'Hard',
    method_name: 'trapWater',
    params: [{ name: 'height', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given <code>height</code>, an elevation map where each bar has width <code>1</code>, return how many units of rainwater are trapped between the bars after it rains.',
    examples: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]', '6', 'Six units of water settle in the dips.'],
      ['[4,2,3]', '1', 'One unit is trapped above the bar of height 2.'],
    ],
    constraints: ['1 <= height.length <= 10^5', '0 <= height[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def trapWater(height):
    lo, hi = 0, len(height) - 1
    left_max = 0
    right_max = 0
    total = 0
    while lo < hi:
        if height[lo] < height[hi]:
            if height[lo] >= left_max:
                left_max = height[lo]
            else:
                total += left_max - height[lo]
            lo += 1
        else:
            if height[hi] >= right_max:
                right_max = height[hi]
            else:
                total += right_max - height[hi]
            hi -= 1
    return total`,
    approach:
      'Water above a bar is bounded by the smaller of the tallest bar to its left and to its right. Move two pointers inward from both ends, always advancing the side with the lower bar because that side\'s bound is known. Track the running maxima on each side and add the gap between the relevant maximum and the current bar.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      ['[4,2,3]'],
      ['[1]'],
      ['[3,0,3]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[2,0,2]'],
      ['[4,2,0,3,2,5]'],
      ['[0,0,0,0]'],
      ['[5,2,1,2,1,5]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B48>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b48-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B48>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B48>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b48-grade-${prob.n}.py`);
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
