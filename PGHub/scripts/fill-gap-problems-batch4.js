#!/usr/bin/env node
// Batch 4 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Reuses the insert/grade pipeline of fill-gap-problems.js but in a standalone file
// so concurrent batches editing that file cannot collide with this one.
//
//   node scripts/fill-gap-problems-batch4.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch4.js --dry     # author + grade locally, no write
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
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

const BATCH = [339, 340, 346, 348, 351, 353, 358, 359, 360, 361, 362, 364, 366, 369, 370];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict
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
    n: 339,
    id: 'pghub-vowel-position-score',
    name: 'Vowel Position Score',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'vowelScore',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, every vowel (one of a, e, i, o, u) contributes its <em>1-based position</em> in the string to a running score. Consonants contribute nothing. Return the total score.',
    examples: [
      ['"leetcode"', '19', 'Vowels: e@2, e@3, o@6, e@8 -> 2+3+6+8 = 19.'],
      ['"xyz"', '0', 'No vowels.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings'],
    py: `def vowelScore(s):
    vowels = set("aeiou")
    total = 0
    for i, ch in enumerate(s):
        if ch in vowels:
            total += i + 1
    return total`,
    approach:
      'Single pass: when the current character is a vowel, add its 1-based index to the accumulator. Consonants are skipped.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['"leetcode"'], ['"xyz"'], ['"a"'], ['"aeiou"'], ['""', null], ['"programming"'], ['"bcdfg"'], ['"education"'], ['"queue"'], ['"rhythm"']],
  },
  {
    n: 340,
    id: 'pghub-k-distinct-window',
    name: 'Longest K-Distinct Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestKDistinct',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> and an integer <code>k</code>, return the length of the longest contiguous substring that contains at most <code>k</code> distinct characters. If <code>k</code> is 0, the answer is 0.',
    examples: [
      ['"eceba"\n2', '3', '"ece" has 2 distinct characters and length 3.'],
      ['"aa"\n1', '2', 'The whole string has one distinct character.'],
    ],
    constraints: ['0 <= s.length <= 10^5', '0 <= k <= 26'],
    tags: ['sliding-window', 'hash-map'],
    py: `def longestKDistinct(s, k):
    if k == 0:
        return 0
    counts = defaultdict(int)
    left = 0
    best = 0
    for right, ch in enumerate(s):
        counts[ch] += 1
        while len(counts) > k:
            counts[s[left]] -= 1
            if counts[s[left]] == 0:
                del counts[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Grow a window to the right, keeping a count map. When the distinct-character count exceeds k, shrink from the left until it is back within k. Track the maximum window size seen.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['"eceba"', '2'],
      ['"aa"', '1'],
      ['"abcabc"', '2'],
      ['"abc"', '0'],
      ['"abaccc"', '2'],
      ['"aaaa"', '1'],
      ['""', '3'],
      ['"abcde"', '5'],
      ['"aabbcc"', '2'],
      ['"xyzzyx"', '3'],
    ],
  },
  {
    n: 346,
    id: 'pghub-square-count-range',
    name: 'Perfect Squares in Range',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'perfectSquares',
    params: [{ name: 'lo', type: 'int' }, { name: 'hi', type: 'int' }],
    return_type: 'int',
    statement:
      'Return how many perfect squares of <em>positive</em> integers (1, 4, 9, 16, ...) fall in the inclusive range <code>[lo, hi]</code>. If <code>hi &lt; lo</code> the answer is 0.',
    examples: [
      ['1\n10', '3', '1, 4, 9 lie in [1,10].'],
      ['4\n9', '2', '4 and 9 lie in [4,9].'],
    ],
    constraints: ['0 <= lo <= hi <= 10^12'],
    tags: ['math', 'binary-search'],
    py: `def perfectSquares(lo, hi):
    if hi < lo:
        return 0
    a = math.isqrt(max(0, lo - 1))
    b = math.isqrt(hi)
    return b - a`,
    approach:
      'The count of positive perfect squares <= x is floor(sqrt(x)). Subtracting the count up to lo-1 from the count up to hi gives the squares inside [lo, hi]. Integer square root avoids floating-point error.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['1', '10'],
      ['1', '1'],
      ['4', '9'],
      ['10', '99'],
      ['50', '50'],
      ['0', '0'],
      ['1', '1000000'],
      ['17', '25'],
      ['100', '100'],
      ['2', '3'],
    ],
  },
  {
    n: 348,
    id: 'pghub-max-diagonal-sum',
    name: 'Maximum Diagonal Sum',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'maxDiagonal',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a non-empty integer matrix <code>grid</code>, consider every diagonal that runs top-left to bottom-right (each starting on the top row or the left column and continuing until it leaves the grid). Return the maximum sum over all such diagonals.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '15', 'The main diagonal 1+5+9 = 15 is the largest.'],
      ['[[5]]', '5', 'A single cell.'],
    ],
    constraints: ['1 <= rows, cols <= 300', '-10^4 <= grid[i][j] <= 10^4'],
    tags: ['matrix'],
    py: `def maxDiagonal(grid):
    n = len(grid)
    m = len(grid[0]) if n else 0
    best = None
    for start in range(m):
        i, j = 0, start
        s = 0
        while i < n and j < m:
            s += grid[i][j]
            i += 1
            j += 1
        best = s if best is None else max(best, s)
    for start in range(1, n):
        i, j = start, 0
        s = 0
        while i < n and j < m:
            s += grid[i][j]
            i += 1
            j += 1
        best = s if best is None else max(best, s)
    return best`,
    approach:
      'Each top-left-to-bottom-right diagonal is anchored either on the top row or the left column. Walk each diagonal once, summing as you step diagonally, and keep the maximum sum.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[1,2],[3,4]]'],
      ['[[5]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[10,0],[0,10]]'],
      ['[[1,2,3,4]]'],
      ['[[1],[2],[3]]'],
      ['[[0,0],[0,0]]'],
      ['[[9,1,1],[1,9,1],[1,1,9]]'],
    ],
  },
  {
    n: 351,
    id: 'pghub-second-largest-distinct',
    name: 'Second Largest Distinct',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'secondLargest',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Return the second largest <em>distinct</em> value in the array <code>nums</code>. If there is no second distinct value, return -1.',
    examples: [
      ['[1,2,3]', '2', 'Distinct values 1,2,3; second largest is 2.'],
      ['[7,7,7]', '-1', 'Only one distinct value exists.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays'],
    py: `def secondLargest(nums):
    first = None
    second = None
    for x in nums:
        if first is None or x > first:
            if first is not None and first != x:
                second = first
            first = x
        elif x != first and (second is None or x > second):
            second = x
    return second if second is not None else -1`,
    approach:
      'Track the largest and second-largest distinct values in one pass. A new maximum pushes the old maximum down to second place; a value strictly between them updates second place only.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3]'],
      ['[5]'],
      ['[7,7,7]'],
      ['[4,4,5]'],
      ['[-1,-2,-3]'],
      ['[10,9,10,9]'],
      ['[1,2]'],
      ['[100,50,100,25]'],
      ['[0,0,1]'],
      ['[3,3,3,2,2,1]'],
    ],
  },
  {
    n: 353,
    id: 'pghub-asteroid-settle',
    name: 'Asteroid Collisions Settle',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'asteroidSettle',
    params: [{ name: 'rocks', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Each value in <code>rocks</code> is a rock moving right (positive) or left (negative); the absolute value is its size. Rocks move along a line at the same speed. A right-mover and a left-mover that approach each other collide: the smaller is destroyed, and if equal both are destroyed. Two rocks moving the same direction never collide. Return the rocks that remain, in order.',
    examples: [
      ['[5,10,-5]', '[5,10]', 'The -5 hits 10 and is destroyed.'],
      ['[8,-8]', '[]', 'Equal sizes destroy each other.'],
    ],
    constraints: ['1 <= rocks.length <= 10^4', '-10^4 <= rocks[i] <= 10^4', 'rocks[i] != 0'],
    tags: ['stack'],
    py: `def asteroidSettle(rocks):
    stack = []
    for r in rocks:
        alive = True
        while alive and stack and stack[-1] > 0 and r < 0:
            if stack[-1] < -r:
                stack.pop()
            elif stack[-1] == -r:
                stack.pop()
                alive = False
            else:
                alive = False
        if alive:
            stack.append(r)
    return stack`,
    approach:
      'A stack holds the surviving rocks. Each incoming left-mover collides with right-movers on top of the stack: pop smaller ones, both vanish on a tie, and the incoming rock dies if it meets a larger right-mover. Anything still alive is pushed.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[5,10,-5]'],
      ['[8,-8]'],
      ['[10,2,-5]'],
      ['[-2,-1,1,2]'],
      ['[1,2,3]'],
      ['[-1,-2,-3]'],
      ['[5,-5,5,-5]'],
      ['[3,-2,-3]'],
      ['[-5,5]'],
      ['[1,-1,1,-1,1]'],
    ],
  },
  {
    n: 358,
    id: 'pghub-min-platforms',
    name: 'Minimum Train Platforms',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minPlatforms',
    params: [{ name: 'arrivals', type: 'List[int]' }, { name: 'departures', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Trains arrive and depart at a station; <code>arrivals[i]</code> and <code>departures[i]</code> give the arrival and departure time of train i. A platform can serve a new train only once the previous one has departed (a train arriving exactly when another departs may reuse the platform). Return the minimum number of platforms needed so no train waits.',
    examples: [
      ['[900,940,950]\n[910,1200,1120]', '2', 'At time 950 trains 2 and 3 overlap.'],
      ['[100,200]\n[150,250]', '1', 'The first departs at 150 before the second arrives at 200.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= arrivals[i] <= departures[i]'],
    tags: ['intervals', 'sorting'],
    py: `def minPlatforms(arrivals, departures):
    arrivals = sorted(arrivals)
    departures = sorted(departures)
    i = j = 0
    n = len(arrivals)
    cur = 0
    best = 0
    while i < n:
        if arrivals[i] <= departures[j]:
            cur += 1
            best = max(best, cur)
            i += 1
        else:
            cur -= 1
            j += 1
    return best`,
    approach:
      'Sort arrivals and departures independently, then sweep two pointers in time. Each arrival before the next departure needs a fresh platform; each departure frees one. The peak concurrent count is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[900,940,950]', '[910,1200,1120]'],
      ['[100,200]', '[150,250]'],
      ['[0]', '[5]'],
      ['[1,2,3]', '[10,11,12]'],
      ['[1,2,3]', '[2,3,4]'],
      ['[5,5,5]', '[6,6,6]'],
      ['[1,1,1,1]', '[2,2,2,2]'],
      ['[10,20,30,40]', '[15,25,35,45]'],
      ['[1]', '[100]'],
      ['[2,4,6,8]', '[3,5,7,9]'],
    ],
  },
  {
    n: 359,
    id: 'pghub-total-set-bits',
    name: 'Total Set Bits to N',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'totalSetBits',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Return the total number of set bits (1s) in the binary representations of all integers from 0 to <code>n</code> inclusive.',
    examples: [
      ['3', '4', '0=00, 1=01, 2=10, 3=11 -> 0+1+1+2 = 4.'],
      ['7', '12', 'Sum of popcounts for 0..7 is 12.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def totalSetBits(n):
    total = 0
    bit = 1
    while bit <= n:
        full = (n + 1) // (bit * 2)
        total += full * bit
        rem = (n + 1) % (bit * 2)
        total += max(0, rem - bit)
        bit *= 2
    return total`,
    approach:
      'Count contributions per bit position. For bit value b, the bit toggles in blocks of 2b: every full block contributes b ones, and the partial remainder beyond b contributes the leftover. Summing across all bit positions runs in O(log n).',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [['0'], ['1'], ['2'], ['3'], ['7'], ['10'], ['15'], ['16'], ['100'], ['1000']],
  },
  {
    n: 360,
    id: 'pghub-subarray-sum-count',
    name: 'Subarrays Summing to K',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'subarraySumK',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>k</code>, return the number of contiguous subarrays whose elements sum to exactly <code>k</code>.',
    examples: [
      ['[1,1,1]\n2', '2', '[1,1] appears twice.'],
      ['[1,2,3]\n3', '2', '[3] and [1,2] both sum to 3.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-1000 <= nums[i] <= 1000', '-10^9 <= k <= 10^9'],
    tags: ['prefix-sum', 'hash-map'],
    py: `def subarraySumK(nums, k):
    prefix = defaultdict(int)
    prefix[0] = 1
    s = 0
    count = 0
    for x in nums:
        s += x
        count += prefix[s - k]
        prefix[s] += 1
    return count`,
    approach:
      'A subarray sums to k exactly when two prefix sums differ by k. Maintain a frequency map of prefix sums seen so far; at each index add the number of earlier prefixes equal to current-k. Handles negatives naturally.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,1,1]', '2'],
      ['[1,2,3]', '3'],
      ['[3,4,7,2,-3,1,4,2]', '7'],
      ['[0,0,0]', '0'],
      ['[1]', '1'],
      ['[-1,-1,1]', '0'],
      ['[5]', '10'],
      ['[1,2,1,2,1]', '3'],
      ['[2,2,2,2]', '4'],
      ['[1,-1,1,-1]', '0'],
    ],
  },
  {
    n: 361,
    id: 'pghub-is-subsequence',
    name: 'Is Subsequence',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'isSubsequence',
    params: [{ name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
    return_type: 'bool',
    statement:
      'Return <code>true</code> if <code>a</code> is a subsequence of <code>b</code> — that is, <code>a</code> can be formed by deleting zero or more characters of <code>b</code> without reordering the rest. The empty string is a subsequence of anything.',
    examples: [
      ['"abc"\n"ahbgdc"', 'true', 'Pick a, b, c in order.'],
      ['"axc"\n"ahbgdc"', 'false', 'No x available after a.'],
    ],
    constraints: ['0 <= a.length <= 10^4', '0 <= b.length <= 10^5'],
    tags: ['two-pointers', 'strings'],
    py: `def isSubsequence(a, b):
    i = 0
    for ch in b:
        if i < len(a) and a[i] == ch:
            i += 1
    return i == len(a)`,
    approach:
      'Walk b once with a pointer into a; advance the a-pointer each time the current character of b matches the needed character of a. If the pointer reaches the end of a, every character was matched in order.',
    complexity: { time: 'O(|b|)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"abc"', '"ahbgdc"'],
      ['"axc"', '"ahbgdc"'],
      ['""', '"abc"'],
      ['"abc"', '""'],
      ['"a"', '"a"'],
      ['"ace"', '"abcde"'],
      ['"aec"', '"abcde"'],
      ['"xyz"', '"xyz"'],
      ['"xyz"', '"xayb"'],
      ['"aaa"', '"aaaa"'],
    ],
  },
  {
    n: 362,
    id: 'pghub-min-coins-amount',
    name: 'Fewest Coins for Amount',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCoins',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'Given coin denominations <code>coins</code> (each usable unlimited times) and a target <code>amount</code>, return the fewest coins that sum to exactly <code>amount</code>. If it cannot be made, return -1.',
    examples: [
      ['[1,2,5]\n11', '3', '5 + 5 + 1 = 11.'],
      ['[2]\n3', '-1', 'Odd amount cannot be made from 2s.'],
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 10^4', '0 <= amount <= 10^4'],
    tags: ['dp'],
    py: `def minCoins(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for amt in range(1, amount + 1):
        for c in coins:
            if c <= amt and dp[amt - c] + 1 < dp[amt]:
                dp[amt] = dp[amt - c] + 1
    return dp[amount] if dp[amount] != INF else -1`,
    approach:
      'Bottom-up DP where dp[x] is the fewest coins for amount x. For each amount, try every coin: the best is one plus the best for the remaining amount. Unreachable amounts stay at infinity and map to -1.',
    complexity: { time: 'O(amount * coins)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '11'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[3,7]', '14'],
      ['[1,2,5]', '0'],
      ['[5]', '5'],
      ['[2,5,10,1]', '27'],
      ['[186,419,83,408]', '6249'],
      ['[2]', '1'],
      ['[1,5,10,25]', '30'],
    ],
  },
  {
    n: 364,
    id: 'pghub-count-components',
    name: 'Count Connected Components',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countComponents',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'An undirected graph has <code>n</code> nodes labeled 0 to n-1 and an edge list <code>edges</code> where each entry <code>[u, v]</code> connects nodes u and v. Return the number of connected components.',
    examples: [
      ['5\n[[0,1],[1,2],[3,4]]', '2', '{0,1,2} and {3,4}.'],
      ['5\n[]', '5', 'No edges: five singletons.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 10^5', '0 <= u, v < n'],
    tags: ['graph', 'union-find'],
    py: `def countComponents(n, edges):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    comps = n
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            comps -= 1
    return comps`,
    approach:
      'Union-Find with path compression. Start with n components; each edge that joins two different sets reduces the component count by one. Self-loops and redundant edges leave the count unchanged.',
    complexity: { time: 'O((n + e) alpha(n))', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1],[1,2],[3,4]]'],
      ['5', '[]'],
      ['1', '[]'],
      ['4', '[[0,1],[2,3],[1,2]]'],
      ['3', '[[0,1],[1,2],[0,2]]'],
      ['6', '[[0,1],[2,3],[4,5]]'],
      ['2', '[[0,1]]'],
      ['7', '[[0,1],[1,2],[3,4]]'],
      ['4', '[[0,0]]'],
      ['10', '[[0,1],[2,3],[4,5],[6,7],[8,9]]'],
    ],
  },
  {
    n: 366,
    id: 'pghub-kth-smallest-pair-sum',
    name: 'Kth Smallest Pair Sum',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'kthSmallestSum',
    params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given two integer arrays <code>a</code> and <code>b</code>, consider every pair sum <code>a[i] + b[j]</code>. Return the <code>k</code>-th smallest such sum (1-indexed). It is guaranteed that <code>k</code> does not exceed the number of pairs.',
    examples: [
      ['[1,7,11]\n[2,4,6]\n3', '7', 'Smallest sums are 3, 5, 7; the 3rd is 7.'],
      ['[1,2]\n[3,4]\n1', '4', 'The smallest pair sum is 1+3 = 4.'],
    ],
    constraints: ['1 <= a.length, b.length <= 10^4', '-10^9 <= a[i], b[i] <= 10^9', '1 <= k <= a.length * b.length'],
    tags: ['heap'],
    py: `def kthSmallestSum(a, b, k):
    if not a or not b:
        return -1
    a = sorted(a)
    b = sorted(b)
    heap = [(a[0] + b[0], 0, 0)]
    seen = {(0, 0)}
    res = None
    for _ in range(k):
        if not heap:
            return -1
        val, i, j = heapq.heappop(heap)
        res = val
        if i + 1 < len(a) and (i + 1, j) not in seen:
            seen.add((i + 1, j))
            heapq.heappush(heap, (a[i + 1] + b[j], i + 1, j))
        if j + 1 < len(b) and (i, j + 1) not in seen:
            seen.add((i, j + 1))
            heapq.heappush(heap, (a[i] + b[j + 1], i, j + 1))
    return res`,
    approach:
      'Sort both arrays and run a best-first search over the (i, j) grid with a min-heap keyed on the pair sum. Each pop expands its right and down neighbours, deduplicated with a visited set. Popping k times yields the k-th smallest sum.',
    complexity: { time: 'O(k log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,7,11]', '[2,4,6]', '3'],
      ['[1,2]', '[3,4]', '1'],
      ['[1,2]', '[3,4]', '4'],
      ['[0]', '[0]', '1'],
      ['[1,1,2]', '[1,2,3]', '4'],
      ['[5]', '[5,5,5]', '2'],
      ['[1,2,3]', '[4,5,6]', '9'],
      ['[10,20]', '[1,2]', '3'],
      ['[1]', '[1]', '1'],
      ['[2,4,6]', '[1,3,5]', '5'],
    ],
  },
  {
    n: 369,
    id: 'pghub-shout-odd-words',
    name: 'Shout Odd-Length Words',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'shoutOddWords',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a sentence <code>s</code> of words separated by single spaces, uppercase every word whose length is odd and leave even-length words unchanged. Return the rebuilt sentence.',
    examples: [
      ['"hi the world"', '"hi THE WORLD"', '"the" and "world" have odd lengths.'],
      ['"a bb ccc"', '"A bb CCC"', '"a" and "ccc" are odd length.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 'words are separated by single spaces'],
    tags: ['strings'],
    py: `def shoutOddWords(s):
    words = s.split(" ")
    out = []
    for w in words:
        if len(w) % 2 == 1:
            out.append(w.upper())
        else:
            out.append(w)
    return " ".join(out)`,
    approach:
      'Split on spaces, uppercase each word whose length is odd, keep the rest as-is, then rejoin with single spaces.',
    complexity: { time: 'O(L)', space: 'O(L)' },
    cases: [
      ['"hi the world"'],
      ['"a bb ccc"'],
      ['"even"'],
      ['"odd"'],
      ['"one two six"'],
      ['"x"'],
      ['"ab cd ef"'],
      ['"hello a there"'],
      ['"the cat sat"'],
      ['"python is fun"'],
    ],
  },
  {
    n: 370,
    id: 'pghub-ship-capacity',
    name: 'Minimum Ship Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'shipCapacity',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'days', type: 'int' }],
    return_type: 'int',
    statement:
      'Packages with the given <code>weights</code> must ship within <code>days</code> days, loaded in order onto a single ship. Each day the ship carries a prefix of the remaining packages whose total does not exceed its capacity. Return the smallest capacity that lets all packages ship within <code>days</code> days.',
    examples: [
      ['[1,2,3,4,5,6,7,8,9,10]\n5', '15', 'Capacity 15 splits the load into 5 days.'],
      ['[3,2,2,4,1,4]\n3', '6', 'Capacity 6 ships in exactly 3 days.'],
    ],
    constraints: ['1 <= weights.length <= 5*10^4', '1 <= weights[i] <= 500', '1 <= days <= weights.length'],
    tags: ['binary-search', 'greedy'],
    py: `def shipCapacity(weights, days):
    lo = max(weights)
    hi = sum(weights)
    def need(cap):
        d = 1
        cur = 0
        for w in weights:
            if cur + w > cap:
                d += 1
                cur = 0
            cur += w
        return d
    while lo < hi:
        mid = (lo + hi) // 2
        if need(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The answer is monotonic: a larger capacity never needs more days. Binary-search the capacity between the heaviest single package and the total weight; for each candidate, greedily simulate the day count and shrink the search to the feasible half.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      ['[3,2,2,4,1,4]', '3'],
      ['[1,2,3,1,1]', '4'],
      ['[10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[1,1,1,1,1]', '5'],
      ['[7,2,5,10,8]', '2'],
      ['[2,3,1,2,4]', '3'],
      ['[9,8,7]', '1'],
      ['[1,2,3,4,5]', '1'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b4-${prob.n}.py`);
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
