#!/usr/bin/env node
// Batch 37 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2534,2539,2548,2557,2590,2599,2604,2613,2628,2632,2633,2636,2638,2647,2655
//
//   node scripts/fill-gap-problems-batch37.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch37.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch37.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2534, 2539, 2548, 2557, 2590, 2599, 2604, 2613, 2628, 2632, 2633, 2636, 2638, 2647, 2655];

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
    n: 2534,
    id: 'pghub-b37-turnstile-flow',
    name: 'Turnstile Throughput',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'busiestMinute',
    params: [{ name: 'entries', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A turnstile logs the minute index of every person who passes through into <code>entries</code>, which is sorted in non-decreasing order. Return the minute in which the most people passed through. If several minutes tie, return the smallest such minute.',
    examples: [
      ['[1,1,2,2,2,5]', '2', 'Minute 2 had three people, more than any other minute.'],
      ['[4,4,7,7]', '4', 'Minutes 4 and 7 each had two people; return the smaller, 4.'],
    ],
    constraints: ['1 <= entries.length <= 10^5', '0 <= entries[i] <= 10^9', 'entries is sorted non-decreasing'],
    tags: ['arrays', 'hashmap'],
    py: `def busiestMinute(entries):
    counts = Counter(entries)
    best_minute = None
    best_count = -1
    for minute, c in counts.items():
        if c > best_count or (c == best_count and minute < best_minute):
            best_count = c
            best_minute = minute
    return best_minute`,
    approach:
      'Tally how many entries fall in each minute with a counter. Scan the tallies keeping the highest count, and on a tie keep the smaller minute. Returning that minute gives the earliest busiest minute.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,1,2,2,2,5]'],
      ['[4,4,7,7]'],
      ['[0]'],
      ['[3,3,3,3]'],
      ['[1,2,3,4,5]'],
      ['[5,5,6,6,6,7,7,7]'],
      ['[10,10,10,20,20]'],
      ['[0,0,1,1,2,2]'],
      ['[1000000000,1000000000]'],
      ['[2,2,2,3,3,4,4,4,4]'],
    ],
  },
  {
    n: 2539,
    id: 'pghub-b37-warehouse-pack',
    name: 'Two-Box Shipment',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'countShipments',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A warehouse ships items two at a time. Given item <code>weights</code> and a per-shipment weight <code>limit</code>, count the number of unordered pairs of distinct positions <code>(i, j)</code> whose combined weight is at most <code>limit</code>. Return that count.',
    examples: [
      ['[1,2,3,4]\n5', '4', 'Pairs (1,2),(1,3),(1,4),(2,3) all sum to 5 or less.'],
      ['[5,5,5]\n4', '0', 'No pair of items fits within the limit.'],
    ],
    constraints: ['2 <= weights.length <= 10^5', '1 <= weights[i] <= 10^9', '1 <= limit <= 2*10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def countShipments(weights, limit):
    weights = sorted(weights)
    lo, hi = 0, len(weights) - 1
    total = 0
    while lo < hi:
        if weights[lo] + weights[hi] <= limit:
            total += hi - lo
            lo += 1
        else:
            hi -= 1
    return total`,
    approach:
      'Sort the weights and use two pointers from both ends. If the lightest and heaviest remaining items fit, then the lightest pairs with every item between the two pointers, so add that span and advance the low pointer; otherwise the heaviest cannot pair with anyone lighter than the low pointer, so drop it.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '5'],
      ['[5,5,5]', '4'],
      ['[1,1]', '2'],
      ['[1,2,3,4,5]', '6'],
      ['[10,20,30]', '100'],
      ['[1,1,1,1]', '2'],
      ['[3,3,3,3]', '5'],
      ['[1,9,2,8,3,7]', '10'],
      ['[100,1,50,49,51]', '101'],
      ['[2,2,2,2,2]', '4'],
    ],
  },
  {
    n: 2548,
    id: 'pghub-b37-cipher-shift',
    name: 'Rolling Caesar Cipher',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'rollingCipher',
    params: [
      { name: 's', type: 'str' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'Encrypt a lowercase string <code>s</code> with a rolling Caesar shift: the character at index <code>i</code> is shifted forward by <code>(k + i) % 26</code> positions through the alphabet, wrapping from z back to a. Return the encrypted string.',
    examples: [
      ['abc\n1', 'bdf', 'a shifts by 1, b by 2, c by 3 give b, d, f.'],
      ['xyz\n0', 'xzb', 'x shifts by 0, y by 1 to z, z by 2 wrapping to b.'],
    ],
    constraints: ['1 <= s.length <= 10^5', '0 <= k <= 10^9', 's consists of lowercase English letters'],
    tags: ['strings', 'simulation'],
    py: `def rollingCipher(s, k):
    out = []
    for i, ch in enumerate(s):
        shift = (k + i) % 26
        out.append(chr((ord(ch) - 97 + shift) % 26 + 97))
    return ''.join(out)`,
    approach:
      'Walk the string with an index. Each character receives a position-dependent shift of (k+i) mod 26; convert the letter to a 0-25 value, add the shift modulo 26, and convert back. Concatenate the results.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ["'abc'", '1'],
      ["'xyz'", '0'],
      ["'a'", '25'],
      ["'hello'", '3'],
      ["'zzzz'", '1'],
      ["'abcdefghij'", '0'],
      ["'the'", '1000000000'],
      ["'aaaaaa'", '13'],
      ["'world'", '5'],
      ["'z'", '1'],
    ],
  },
  {
    n: 2557,
    id: 'pghub-b37-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains round brackets <code>(</code> and <code>)</code> mixed with other characters, and the brackets are guaranteed to be balanced. Return the maximum nesting depth of the brackets. The depth of unnested text is 0.',
    examples: [
      ['(a(b)c)', '2', 'The inner pair sits inside the outer pair, depth 2.'],
      ['ab(c)d', '1', 'A single, non-nested pair has depth 1.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's contains balanced round brackets and other characters'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == '(':
            depth += 1
            if depth > best:
                best = depth
        elif ch == ')':
            depth -= 1
    return best`,
    approach:
      'Scan the string maintaining a running open-bracket depth: increment on an opening bracket, decrement on a closing one. The answer is the largest depth ever reached. Because the brackets are balanced, the counter behaves like a stack size without needing an explicit stack.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'(a(b)c)'"],
      ["'ab(c)d'"],
      ["'abc'"],
      ["'((()))'"],
      ["'()()()'"],
      ["'(1+(2*3)+((8)/4))+1'"],
      ["'()(())((()))'"],
      ["'x'"],
      ["'(((((a)))))'"],
      ["'(a)(b)(c)'"],
    ],
  },
  {
    n: 2590,
    id: 'pghub-b37-river-crossing',
    name: 'Stepping-Stone Crossing',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minHops',
    params: [
      { name: 'stones', type: 'List[int]' },
      { name: 'reach', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Stepping stones lie along a river at the increasing positions in <code>stones</code>. You begin on the first stone and want to land on the last stone. From any stone you may jump to any later stone whose position is at most <code>reach</code> units farther. Return the minimum number of jumps, or <code>-1</code> if the far bank cannot be reached.',
    examples: [
      ['[0,2,5,6,9]\n3', '4', 'A reach of 3 forces 0->2->5->6->9, which is four jumps.'],
      ['[0,10]\n3', '-1', 'The gap of 10 exceeds the reach of 3, so the far stone is unreachable.'],
    ],
    constraints: ['2 <= stones.length <= 10^5', '0 <= stones[i] <= 10^9', 'stones is strictly increasing', '1 <= reach <= 10^9'],
    tags: ['greedy', 'arrays'],
    py: `def minHops(stones, reach):
    n = len(stones)
    jumps = 0
    cur = 0
    while cur < n - 1:
        farthest = cur
        nxt = cur
        while nxt + 1 < n and stones[nxt + 1] - stones[cur] <= reach:
            nxt += 1
            farthest = nxt
        if farthest == cur:
            return -1
        cur = farthest
        jumps += 1
    return jumps`,
    approach:
      'Greedy jump-game style: from the current stone extend as far right as the reach allows and jump to the farthest reachable stone, counting one jump. If no later stone is within reach the crossing is impossible. Always taking the farthest landing minimizes the number of jumps.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[0,2,5,6,9]', '3'],
      ['[0,10]', '3'],
      ['[0,1,2,3,4]', '1'],
      ['[0,3,6,9]', '3'],
      ['[0,5]', '5'],
      ['[0,1,5,6,10,11]', '5'],
      ['[0,2,4,6,8,10]', '4'],
      ['[0,1,2,100]', '50'],
      ['[0,4,4,4]', '4'],
      ['[0,7,14,21]', '7'],
    ],
  },
  {
    n: 2599,
    id: 'pghub-b37-server-load',
    name: 'Peak Server Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxWindowSum',
    params: [
      { name: 'load', type: 'List[int]' },
      { name: 'w', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A server reports its request count each second into <code>load</code>. Find the maximum total requests over any window of exactly <code>w</code> consecutive seconds. If <code>w</code> exceeds the number of seconds, return the sum of the whole array.',
    examples: [
      ['[2,1,5,1,3,2]\n3', '9', 'The window [5,1,3] sums to 9, the largest 3-second total.'],
      ['[4,4]\n5', '8', 'The window is longer than the data, so return the full sum 8.'],
    ],
    constraints: ['1 <= load.length <= 10^5', '0 <= load[i] <= 10^4', '1 <= w <= 10^5'],
    tags: ['sliding-window', 'arrays'],
    py: `def maxWindowSum(load, w):
    n = len(load)
    if w >= n:
        return sum(load)
    cur = sum(load[:w])
    best = cur
    for i in range(w, n):
        cur += load[i] - load[i - w]
        if cur > best:
            best = cur
    return best`,
    approach:
      'Use a fixed-size sliding window. Compute the first window sum, then slide one position at a time by adding the entering element and subtracting the leaving one, tracking the maximum. If the window is at least the array length, the answer is simply the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,5,1,3,2]', '3'],
      ['[4,4]', '5'],
      ['[1]', '1'],
      ['[5,5,5,5]', '2'],
      ['[1,2,3,4,5]', '1'],
      ['[10,0,0,0,10]', '2'],
      ['[3,3,3,3,3]', '5'],
      ['[9,8,7,6,5,4]', '3'],
      ['[0,0,0,0]', '2'],
      ['[1,2,3,4,5,6,7,8,9,10]', '4'],
    ],
  },
  {
    n: 2604,
    id: 'pghub-b37-tree-tilt',
    name: 'Binary Tree Tilt Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'totalTilt',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given as a level-order list <code>root</code> where <code>null</code> marks a missing child. The tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree. Return the sum of every node\'s tilt.',
    examples: [
      ['[4,2,9,3,5,null,7]', '15', 'Each node contributes the absolute left-vs-right subtree sum difference.'],
      ['[1]', '0', 'A single node has empty subtrees, so its tilt is 0.'],
    ],
    constraints: ['1 <= number of nodes <= 10^4', '-1000 <= node value <= 1000', 'null marks an absent child'],
    tags: ['trees', 'recursion'],
    py: `def totalTilt(root):
    if not root:
        return 0
    n = len(root)
    left = [2 * i + 1 for i in range(n)]
    right = [2 * i + 2 for i in range(n)]
    total = 0
    def subtree_sum(i):
        nonlocal total
        if i >= n or root[i] is None:
            return 0
        ls = subtree_sum(left[i])
        rs = subtree_sum(right[i])
        total += abs(ls - rs)
        return root[i] + ls + rs
    subtree_sum(0)
    return total`,
    approach:
      'Treat the level-order array as a complete-tree index map (children of i live at 2i+1 and 2i+2). Recurse to compute each subtree sum; while unwinding, add the absolute difference of the left and right child subtree sums to a running total. Return that total.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[4,2,9,3,5,None,7]'],
      ['[1]'],
      ['[1,2,3]'],
      ['[1,None,2]'],
      ['[5,3,8,1,4,None,None]'],
      ['[0,0,0]'],
      ['[10,-5,5]'],
      ['[1,2,3,4,5,6,7]'],
      ['[100]'],
      ['[2,1,3,None,None,None,4]'],
    ],
  },
  {
    n: 2613,
    id: 'pghub-b37-island-perimeter',
    name: 'Lake Shoreline Length',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shoreline',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. There is exactly one connected lake region of water (the zeros may also touch the grid border). Return the total shoreline length: the number of unit edges where a land cell touches either a water cell or the outside of the grid.',
    examples: [
      ['[[1,1],[1,0]]', '8', 'The three land cells expose eight edges to water or the border.'],
      ['[[1]]', '4', 'A lone land cell touches the outside on all four sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'grid contains at least one land cell'],
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
      'For every land cell, inspect its four orthogonal neighbours. Each neighbour that is off the grid or is water contributes one unit of shoreline. Summing over all land cells counts every land-to-water (or land-to-border) edge exactly once.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[1,1],[1,0]]'],
      ['[[1]]'],
      ['[[1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,0,1],[0,0,0],[1,0,1]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,0,1]]'],
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
      ['[[1,1,1,1,1]]'],
    ],
  },
  {
    n: 2628,
    id: 'pghub-b37-coin-change-ways',
    name: 'Ways to Make Change',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'changeWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You have an unlimited supply of coins with the distinct denominations in <code>coins</code>. Return the number of distinct combinations of coins that sum to exactly <code>amount</code>. Two combinations are the same if they use the same count of each denomination regardless of order.',
    examples: [
      ['[1,2,5]\n5', '4', 'The combinations are 5, 2+2+1, 2+1+1+1, and 1x5.'],
      ['[2]\n3', '0', 'No combination of 2-coins sums to an odd amount.'],
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
      'Unbounded-knapsack counting: dp[a] is the number of ways to form amount a. Process one coin at a time, updating amounts in increasing order so each coin can be reused. Iterating coins on the outer loop counts each unordered combination once, avoiding permutation double-counting.',
    complexity: { time: 'O(coins * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[3,7]', '12'],
      ['[1,5,10,25]', '100'],
      ['[2,4,6]', '8'],
      ['[7]', '14'],
      ['[1,2,5]', '0'],
    ],
  },
  {
    n: 2632,
    id: 'pghub-b37-gift-distribution',
    name: 'Fair Candy Handout',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'maxPerChild',
    params: [
      { name: 'piles', type: 'List[int]' },
      { name: 'children', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You have candy <code>piles</code> where <code>piles[i]</code> is the count in pile <code>i</code>. You may split a pile into smaller sub-piles but never merge piles. Each of the <code>children</code> children must receive exactly one sub-pile of the same size <code>x</code> (leftover candy is discarded). Return the largest <code>x</code> such that every child can be served, or <code>0</code> if it is impossible.',
    examples: [
      ['[8,5]\n3', '4', 'Pile 8 yields two piles of 4 and pile 5 yields one of 4: three children served.'],
      ['[1,1]\n5', '0', 'There is not enough candy to give five children a sub-pile each.'],
    ],
    constraints: ['1 <= piles.length <= 10^5', '1 <= piles[i] <= 10^9', '1 <= children <= 10^9'],
    tags: ['binary-search', 'greedy'],
    py: `def maxPerChild(piles, children):
    def feasible(x):
        total = 0
        for p in piles:
            total += p // x
            if total >= children:
                return True
        return total >= children
    lo, hi = 1, max(piles)
    ans = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans`,
    approach:
      'The number of children servable with sub-pile size x is monotonically non-increasing in x, so binary search the answer over x from 1 to the largest pile. For a candidate x, each pile yields floor(pile/x) sub-piles; if the total meets the child count, x is feasible and we try larger, else smaller.',
    complexity: { time: 'O(n log(max pile))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[8,5]', '3'],
      ['[1,1]', '5'],
      ['[10]', '1'],
      ['[5,5,5]', '6'],
      ['[1000000000]', '1000000000'],
      ['[7,7,7,7]', '4'],
      ['[3,9,12]', '5'],
      ['[2,4,6,8]', '10'],
      ['[100]', '7'],
      ['[6,6,6,6,6,6]', '9'],
    ],
  },
  {
    n: 2633,
    id: 'pghub-b37-power-set-size',
    name: 'Distinct Subset XORs',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'distinctXorCount',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code>, consider the XOR of every subset (the empty subset XORs to 0). Return the number of distinct XOR values achievable across all subsets.',
    examples: [
      ['[1,2]', '4', 'Subset XORs are 0, 1, 2, 3 — four distinct values.'],
      ['[1,1]', '2', 'Subsets give 0 and 1 only.'],
    ],
    constraints: ['1 <= nums.length <= 20', '0 <= nums[i] <= 1000'],
    tags: ['bit-manipulation', 'backtracking'],
    py: `def distinctXorCount(nums):
    seen = {0}
    for x in nums:
        seen |= {v ^ x for v in seen}
    return len(seen)`,
    approach:
      'Build the reachable XOR set incrementally. Start with {0}. For each number, every already-reachable value can either include or exclude it, producing the existing values plus those XORed with the number. Union them in; the final set size is the count of distinct subset XORs.',
    complexity: { time: 'O(2^min(n,bits))', space: 'O(reachable values)' },
    cases: [
      ['[1,2]'],
      ['[1,1]'],
      ['[0]'],
      ['[1,2,4]'],
      ['[3,3,3]'],
      ['[5]'],
      ['[1,2,3]'],
      ['[8,4,2,1]'],
      ['[7,7,7,7]'],
      ['[1,2,4,8,16]'],
    ],
  },
  {
    n: 2636,
    id: 'pghub-b37-meeting-overlap',
    name: 'Peak Concurrent Meetings',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxConcurrent',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each meeting in <code>meetings</code> is a half-open interval <code>[start, end)</code>. Return the maximum number of meetings that are in progress at the same instant. A meeting ending exactly when another begins do not overlap.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'At time 5 the first and second meetings overlap.'],
      ['[[1,2],[2,3],[3,4]]', '1', 'Consecutive meetings touch but never overlap.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def maxConcurrent(meetings):
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
      'Convert each meeting into a +1 start event and a -1 end event. Sort events by time, breaking ties so that ends (-1) are processed before starts (+1), which encodes the half-open rule that a meeting ending at t does not overlap one starting at t. Sweep, tracking the running count and its maximum.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[0,1]]'],
      ['[[0,10],[0,10],[0,10]]'],
      ['[[1,5],[2,6],[3,7],[4,8]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[5,10],[0,3],[3,5]]'],
      ['[[0,100],[10,20],[15,25],[18,19]]'],
      ['[[1,1000000000],[2,3],[4,5]]'],
      ['[[0,5],[5,10],[10,15],[0,15]]'],
    ],
  },
  {
    n: 2638,
    id: 'pghub-b37-package-merge',
    name: 'Merge Overlapping Deliveries',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeWindows',
    params: [{ name: 'windows', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Delivery time <code>windows</code> are given as <code>[start, end]</code> closed intervals. Merge every set of overlapping or touching windows into the fewest possible intervals and return them sorted by start. Two windows touch when one ends exactly where another begins.',
    examples: [
      ['[[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', '[1,3] and [2,6] overlap and merge into [1,6].'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'Touching intervals merge into one.'],
    ],
    constraints: ['1 <= windows.length <= 10^5', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeWindows(windows):
    windows = sorted(windows, key=lambda w: w[0])
    merged = [list(windows[0])]
    for s, e in windows[1:]:
        if s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged`,
    approach:
      'Sort the windows by start. Walk them keeping the last merged interval; if the next start is within (or touching) the last end, extend the last end to the larger of the two; otherwise begin a new interval. The classic interval-merge yields the minimal set.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,2]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,5],[6,10],[11,15]]'],
      ['[[1,4],[2,3]]'],
      ['[[10,20],[1,5],[6,9],[19,25]]'],
      ['[[1,1000000000],[500,600]]'],
    ],
  },
  {
    n: 2647,
    id: 'pghub-b37-task-cooldown',
    name: 'Task Scheduler Cooldown',
    topic_id: 'greedy',
    difficulty: 'Hard',
    method_name: 'minIntervals',
    params: [
      { name: 'tasks', type: 'List[str]' },
      { name: 'cooldown', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A CPU runs single-letter <code>tasks</code>, one per time unit. After running a given task it must wait at least <code>cooldown</code> time units before running that same task again, though it may run other tasks or sit idle in between. Return the minimum number of time units needed to finish all tasks.',
    examples: [
      ['["A","A","A","B","B","B"]\n2', '8', 'A B idle A B idle A B takes 8 units.'],
      ['["A","B","C"]\n2', '3', 'All tasks differ, so no idling is needed.'],
    ],
    constraints: ['1 <= tasks.length <= 10^5', 'tasks are single uppercase letters', '0 <= cooldown <= 100'],
    tags: ['greedy', 'hashmap'],
    py: `def minIntervals(tasks, cooldown):
    counts = Counter(tasks)
    max_freq = max(counts.values())
    num_max = sum(1 for c in counts.values() if c == max_freq)
    frame = (max_freq - 1) * (cooldown + 1) + num_max
    return max(frame, len(tasks))`,
    approach:
      'The bottleneck is the most frequent task. Lay out (max_freq-1) full frames of length cooldown+1, then append a final slot for every task tied at the maximum frequency. The answer is the larger of this frame length and the total task count, because once there are enough distinct tasks no idling is ever required.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["A","A","A","B","B","B"]', '2'],
      ['["A","B","C"]', '2'],
      ['["A","A","A"]', '0'],
      ['["A","A","A","A","B","C","D"]', '3'],
      ['["A"]', '5'],
      ['["A","B","A","B","A","B"]', '2'],
      ['["A","A","B","B","C","C"]', '1'],
      ['["A","A","A","A","A"]', '2'],
      ['["A","B","C","D","E","F"]', '0'],
      ['["A","A","A","B","B","B","C","C","C"]', '2'],
    ],
  },
  {
    n: 2655,
    id: 'pghub-b37-token-bucket',
    name: 'Token Bucket Throttle',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'allowedRequests',
    params: [
      { name: 'times', type: 'List[int]' },
      { name: 'window', type: 'int' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Requests arrive at the strictly increasing timestamps in <code>times</code>. A throttle accepts a request only if, counting it, no more than <code>cap</code> requests have been accepted within the trailing <code>window</code> time units (an interval of length <code>window</code> ending at the current time, inclusive). Rejected requests are dropped and do not count. Return how many requests are accepted.',
    examples: [
      ['[1,2,3,10]\n5\n2', '3', 'At times 1 and 2 accept; time 3 would be the third within window 5 so reject; time 10 accepts.'],
      ['[1,2,3]\n100\n1', '1', 'Only the first request fits the cap of one per window.'],
    ],
    constraints: ['1 <= times.length <= 10^5', 'times is strictly increasing', '0 <= times[i] <= 10^9', '1 <= window <= 10^9', '1 <= cap <= 10^5'],
    tags: ['queue', 'sliding-window'],
    py: `def allowedRequests(times, window, cap):
    accepted = deque()
    count = 0
    for t in times:
        while accepted and accepted[0] < t - window + 1:
            accepted.popleft()
        if len(accepted) < cap:
            accepted.append(t)
            count += 1
    return count`,
    approach:
      'Maintain a queue of the timestamps of recently accepted requests. For each arrival, evict accepted timestamps that have fallen outside the trailing window of length window. If the surviving count is below the cap, accept the request and enqueue its time; otherwise drop it. The total accepted is the answer.',
    complexity: { time: 'O(n)', space: 'O(cap)' },
    multiParam: true,
    cases: [
      ['[1,2,3,10]', '5', '2'],
      ['[1,2,3]', '100', '1'],
      ['[0]', '1', '1'],
      ['[1,2,3,4,5]', '2', '2'],
      ['[10,20,30,40]', '5', '1'],
      ['[1,2,3,4,5,6]', '3', '2'],
      ['[1,5,9,13]', '4', '5'],
      ['[1,1000000000]', '1000000000', '1'],
      ['[1,2,3,4,5,6,7,8,9,10]', '10', '3'],
      ['[5,6,7,8,9,10]', '3', '2'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B37>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b37-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B37>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B37>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b37-grade-${prob.n}.py`);
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
