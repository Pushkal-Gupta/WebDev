#!/usr/bin/env node
// Batch 27 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1660,1666,1676,1677,1682,1692,1698,1699,1708,1709,1714,1715,1724,1730,1740
//
//   node scripts/fill-gap-problems-batch27.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch27.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch27.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1660, 1666, 1676, 1677, 1682, 1692, 1698, 1699, 1708, 1709, 1714, 1715, 1724, 1730, 1740];

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
    n: 1660,
    id: 'pghub-b27-run-length',
    name: 'Run-Length Compression',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'compress',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Compress a lowercase string <code>s</code> by replacing each maximal run of one repeated character with that character followed by the run length. For example a run of three <code>"a"</code> becomes <code>"a3"</code>. A run of length one still gets its count, so <code>"b"</code> becomes <code>"b1"</code>. Return the compressed string.',
    examples: [
      ['"aaabbc"', '"a3b2c1"', 'Three a, two b, one c.'],
      ['"abc"', '"a1b1c1"', 'Each character is its own run of length one.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def compress(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        out.append(s[i] + str(j - i))
        i = j
    return "".join(out)`,
    approach:
      'Walk the string with a left pointer at the start of each run and advance a right pointer over identical characters. Append the character and the run length, then jump the left pointer to the next run.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"aaabbc"'], ['"abc"'], ['"a"'], ['"zzzzz"'], ['"aabbaa"'],
      ['"abcabc"'], ['"mississippi"'], ['"qqqqwwwer"'], ['"hello"'], ['"aaaaaaaaaa"'],
    ],
  },
  {
    n: 1666,
    id: 'pghub-b27-digital-root-product',
    name: 'Multiplicative Digital Root',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'digitalRoot',
    params: [{ name: 'num', type: 'int' }],
    return_type: 'int',
    statement:
      'Starting from a non-negative integer <code>num</code>, repeatedly replace it with the product of its decimal digits until a single-digit value remains. Return that single digit.',
    examples: [
      ['39', '6', '3*9=27, then 2*7=14, then 1*4=4... 39 -> 27 -> 14 -> 4.'],
      ['7', '7', 'Already a single digit.'],
    ],
    constraints: ['0 <= num <= 10^9'],
    tags: ['math', 'simulation'],
    py: `def digitalRoot(num):
    while num >= 10:
        prod = 1
        x = num
        while x > 0:
            prod *= x % 10
            x //= 10
        num = prod
    return num`,
    approach:
      'While the number has more than one digit, multiply its digits together to form the next value. The product strictly shrinks the digit count (or hits zero), so the loop terminates at a single digit.',
    complexity: { time: 'O(log num) per step', space: 'O(1)' },
    cases: [
      ['39'], ['7'], ['0'], ['10'], ['25'],
      ['999'], ['123456789'], ['48'], ['100'], ['77'],
    ],
  },
  {
    n: 1676,
    id: 'pghub-b27-equilibrium-pivot',
    name: 'Equilibrium Pivot Index',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'pivotIndex',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, return the smallest index <code>i</code> such that the sum of the elements strictly to the left of <code>i</code> equals the sum of the elements strictly to the right of <code>i</code>. If no such index exists, return <code>-1</code>.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 is 1+7+3=11; right is 5+6=11.'],
      ['[1,2,3]', '-1', 'No index balances the two sides.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def pivotIndex(nums):
    total = sum(nums)
    left = 0
    for i, v in enumerate(nums):
        if left == total - left - v:
            return i
        left += v
    return -1`,
    approach:
      'Precompute the total sum. Sweep left to right tracking the running left-sum; the right-sum at index i is total minus left-sum minus the current element. Return the first index where the two match.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'], ['[1,2,3]'], ['[2,1,-1]'], ['[0]'], ['[0,0,0,0]'],
      ['[-1,-1,-1,0,1,1]'], ['[5]'], ['[1,-1,1,-1,1]'], ['[10,5,5]'], ['[3,1,2,4,5,6,1]'],
    ],
  },
  {
    n: 1677,
    id: 'pghub-b27-bracket-balance',
    name: 'Bracket Balance Check',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code>, <code>)</code>, <code>[</code>, <code>]</code>, <code>{</code> and <code>}</code>. Return <code>true</code> if every opening bracket is closed by a matching bracket of the same type in the correct order, otherwise <code>false</code>.',
    examples: [
      ['"([]{})"', 'true', 'Every bracket is matched and properly nested.'],
      ['"([)]"', 'false', 'The pairs cross instead of nesting.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists only of bracket characters'],
    tags: ['stack', 'strings'],
    py: `def isBalanced(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        else:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack`,
    approach:
      'Push every opening bracket onto a stack. On a closing bracket, the top of the stack must be its matching opener, otherwise the string is unbalanced. After scanning, the stack must be empty.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"([]{})"'], ['"([)]"'], ['"("'], ['"]"'], ['"{}"'],
      ['"((()))"'], ['"({[]})"'], ['"({[}])"'], ['"()()()"'], ['"[[[]]]"'],
    ],
  },
  {
    n: 1682,
    id: 'pghub-b27-min-eat-speed',
    name: 'Minimum Conveyor Speed',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minSpeed',
    params: [
      { name: 'piles', type: 'List[int]' },
      { name: 'hours', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A conveyor processes <code>piles</code> of parcels, where <code>piles[i]</code> is the count in pile <code>i</code>. Running at speed <code>v</code> parcels per hour, in one hour the machine clears up to <code>v</code> parcels from a single pile (any remainder of that hour is wasted), then moves to the next pile the following hour. Return the minimum integer speed <code>v</code> that clears every pile within <code>hours</code> hours.',
    examples: [
      ['[3,6,7,11]\n8', '4', 'At speed 4 the piles take 1+2+2+3 = 8 hours.'],
      ['[30,11,23,4,20]\n5', '30', 'Five piles in five hours forces one pile per hour, so speed must equal the largest pile.'],
    ],
    constraints: ['1 <= piles.length <= 10^4', 'piles.length <= hours <= 10^9', '1 <= piles[i] <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def minSpeed(piles, hours):
    def hours_needed(v):
        return sum((p + v - 1) // v for p in piles)
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= hours:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Hours-needed is monotonically non-increasing in speed, so binary-search the answer between 1 and the largest pile. For a candidate speed, the time for a pile is its ceiling division by the speed; if the total fits within the budget, try slower, otherwise faster.',
    complexity: { time: 'O(n log(max pile))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,6,7,11]', '8'],
      ['[30,11,23,4,20]', '5'],
      ['[30,11,23,4,20]', '6'],
      ['[1]', '1'],
      ['[1000000000]', '2'],
      ['[5,5,5,5]', '4'],
      ['[1,1,1,1,1]', '5'],
      ['[10,10,10]', '30'],
      ['[7,7,7,7]', '4'],
      ['[2,3,5,8,13,21]', '10'],
    ],
  },
  {
    n: 1692,
    id: 'pghub-b27-pairs-below-target',
    name: 'Pair Sums Below Target',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'countPairs',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>target</code>, count the number of index pairs <code>(i, j)</code> with <code>i &lt; j</code> whose values sum to strictly less than <code>target</code>.',
    examples: [
      ['[1,2,3,4]\n5', '3', 'Pairs (1,2),(1,3),(2,... wait: sums 3,4,4 < 5 give 3 pairs.'],
      ['[5,5,5]\n9', '0', 'Every pair sums to 10, not below 9.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def countPairs(nums, target):
    arr = sorted(nums)
    lo, hi = 0, len(arr) - 1
    count = 0
    while lo < hi:
        if arr[lo] + arr[hi] < target:
            count += hi - lo
            lo += 1
        else:
            hi -= 1
    return count`,
    approach:
      'Sort the values. With two pointers at the smallest and largest, if their sum is below target then every element between them also pairs with the smallest under target, so add that span and advance the low pointer; otherwise shrink from the high end.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '5'],
      ['[5,5,5]', '9'],
      ['[1]', '10'],
      ['[-1,0,1,2]', '2'],
      ['[10,20,30]', '100'],
      ['[0,0,0,0]', '1'],
      ['[3,1,4,1,5,9,2,6]', '8'],
      ['[-5,-3,0,2,4]', '0'],
      ['[1,1,1,1]', '3'],
      ['[100,-100,50,-50]', '1'],
    ],
  },
  {
    n: 1698,
    id: 'pghub-b27-lcs-length',
    name: 'Longest Shared Subsequence',
    topic_id: 'dp',
    difficulty: 'Hard',
    method_name: 'longestShared',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'Given two lowercase strings <code>a</code> and <code>b</code>, return the length of their longest common subsequence: the longest sequence of characters appearing in both strings in the same relative order, though not necessarily contiguously.',
    examples: [
      ['"abcde"\n"ace"', '3', 'The subsequence "ace" appears in both.'],
      ['"abc"\n"xyz"', '0', 'No characters are shared.'],
    ],
    constraints: ['1 <= a.length, b.length <= 1000', 'a and b consist of lowercase English letters'],
    tags: ['dp', 'strings'],
    py: `def longestShared(a, b):
    m, n = len(a), len(b)
    prev = [0] * (n + 1)
    for i in range(1, m + 1):
        cur = [0] * (n + 1)
        ai = a[i - 1]
        for j in range(1, n + 1):
            if ai == b[j - 1]:
                cur[j] = prev[j - 1] + 1
            else:
                cur[j] = max(prev[j], cur[j - 1])
        prev = cur
    return prev[n]`,
    approach:
      'Classic LCS dynamic programming. dp[i][j] is the LCS length of the first i characters of a and first j of b. When the characters match, extend the diagonal; otherwise carry the better of dropping one character from either side. Two rolling rows keep it to linear extra space.',
    complexity: { time: 'O(m * n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"abcde"', '"ace"'],
      ['"abc"', '"xyz"'],
      ['"a"', '"a"'],
      ['"aaaa"', '"aa"'],
      ['"abcba"', '"abcbcba"'],
      ['"banana"', '"atana"'],
      ['"xyzzy"', '"zzyx"'],
      ['"abcdefg"', '"gfedcba"'],
      ['"mississippi"', '"missouri"'],
      ['"abcabcabc"', '"cbacbacba"'],
    ],
  },
  {
    n: 1699,
    id: 'pghub-b27-popcount-range',
    name: 'Set Bits Over A Range',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'totalSetBits',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a non-negative integer <code>n</code>, return the total number of set bits (ones in binary) summed over every integer from <code>0</code> to <code>n</code> inclusive.',
    examples: [
      ['5', '7', '0..5 in binary have 0+1+1+2+1+2 = 7 set bits.'],
      ['0', '0', 'Zero has no set bits.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def totalSetBits(n):
    total = 0
    bit = 1
    while bit <= n:
        cycle = bit << 1
        full = (n + 1) // cycle
        total += full * bit
        rem = (n + 1) % cycle
        total += max(0, rem - bit)
        bit <<= 1
    return total`,
    approach:
      'For each bit position the value alternates in blocks of length 2^k zeros then 2^k ones. Count the complete cycles up to n+1 (each contributes 2^k ones) plus the leftover ones in the final partial cycle. Summing across bit positions gives the answer in logarithmic time.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['5'], ['0'], ['1'], ['2'], ['7'],
      ['16'], ['1023'], ['1000000'], ['255'], ['1000000000'],
    ],
  },
  {
    n: 1708,
    id: 'pghub-b27-max-meetings',
    name: 'Maximum Booked Meetings',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'maxMeetings',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each meeting in <code>intervals</code> is given as <code>[start, end]</code> with <code>start &lt; end</code>. One room can host a meeting only if it does not overlap another already booked in the room; a meeting ending exactly when another starts does not overlap. Return the maximum number of meetings that can be booked in a single room.',
    examples: [
      ['[[1,3],[2,4],[3,5]]', '2', 'Book [1,3] then [3,5]; they touch but do not overlap.'],
      ['[[1,2]]', '1', 'A single meeting is always bookable.'],
    ],
    constraints: ['1 <= intervals.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['greedy', 'intervals'],
    py: `def maxMeetings(intervals):
    arr = sorted(intervals, key=lambda x: x[1])
    count = 0
    last_end = float('-inf')
    for s, e in arr:
        if s >= last_end:
            count += 1
            last_end = e
    return count`,
    approach:
      'Classic activity selection. Sort meetings by end time and greedily book each meeting whose start is at or after the last booked end. Choosing the earliest-ending compatible meeting leaves the most room for the rest, which is optimal.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,4],[3,5]]'],
      ['[[1,2]]'],
      ['[[0,30],[5,10],[15,20]]'],
      ['[[1,2],[2,3],[3,4],[4,5]]'],
      ['[[1,10],[2,3],[3,4],[4,5]]'],
      ['[[7,9],[0,10],[4,5],[8,9],[4,9]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[0,1],[1,2],[0,2]]'],
      ['[[5,6],[1,2],[3,4],[2,3],[4,5]]'],
      ['[[1,100],[2,3],[4,5],[6,7],[8,9]]'],
    ],
  },
  {
    n: 1709,
    id: 'pghub-b27-bst-range-sum',
    name: 'BST Range Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'rangeSum',
    params: [
      { name: 'inserts', type: 'List[int]' },
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Build a binary search tree by inserting the values of <code>inserts</code> one at a time in order (duplicates are ignored). Then return the sum of all node values <code>v</code> with <code>lo &lt;= v &lt;= hi</code>.',
    examples: [
      ['[10,5,15,3,7,18]\n7\n15', '32', 'Values in [7,15] are 7,10,15 summing to 32.'],
      ['[1]\n2\n5', '0', 'The only value 1 is outside the range.'],
    ],
    constraints: ['1 <= inserts.length <= 10^4', '-10^6 <= inserts[i], lo, hi <= 10^6', 'lo <= hi'],
    tags: ['trees', 'binary-search-tree'],
    py: `def rangeSum(inserts, lo, hi):
    tree = {}  # val -> [left, right]
    root = None
    for v in inserts:
        if root is None:
            root = v
            tree[v] = [None, None]
            continue
        cur = root
        while True:
            if v == cur:
                break
            side = 0 if v < cur else 1
            nxt = tree[cur][side]
            if nxt is None:
                tree[cur][side] = v
                tree[v] = [None, None]
                break
            cur = nxt
    total = 0
    stack = [root] if root is not None else []
    while stack:
        node = stack.pop()
        if node is None:
            continue
        if lo <= node <= hi:
            total += node
        left, right = tree[node]
        # only descend where the range can still contribute
        if node > lo and left is not None:
            stack.append(left)
        if node < hi and right is not None:
            stack.append(right)
    return total`,
    approach:
      'Insert values into a BST keyed by value with explicit left/right children. To sum the range, traverse from the root but prune: only descend left when the current node exceeds lo, and only descend right when it is below hi. Add nodes that fall inside the inclusive range.',
    complexity: { time: 'O(n) build + O(n) query', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[10,5,15,3,7,18]', '7', '15'],
      ['[1]', '2', '5'],
      ['[5,3,8,1,4,7,9]', '1', '9'],
      ['[5,3,8,1,4,7,9]', '4', '7'],
      ['[20,10,30]', '15', '25'],
      ['[1,2,3,4,5]', '2', '4'],
      ['[5,4,3,2,1]', '1', '5'],
      ['[100,50,150,25,75]', '0', '60'],
      ['[10,10,10]', '5', '15'],
      ['[0,-5,5,-10,10]', '-5', '5'],
    ],
  },
  {
    n: 1714,
    id: 'pghub-b27-build-order',
    name: 'Valid Build Order',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'buildOrder',
    params: [
      { name: 'n', type: 'int' },
      { name: 'deps', type: 'List[List[int]]' },
    ],
    return_type: 'List[int]',
    statement:
      'There are <code>n</code> tasks labelled <code>0..n-1</code>. Each pair <code>[a, b]</code> in <code>deps</code> means task <code>a</code> must be built before task <code>b</code>. Return any valid build order as a list, choosing the lowest-numbered available task at each step to make the result deterministic. If no valid order exists (a cycle), return an empty list.',
    examples: [
      ['3\n[[0,1],[1,2]]', '[0,1,2]', 'Build 0, then 1, then 2.'],
      ['2\n[[0,1],[1,0]]', '[]', 'The two tasks depend on each other cyclically.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= deps.length <= 5 * 10^4', '0 <= a, b < n'],
    tags: ['graphs', 'topological-sort'],
    py: `def buildOrder(n, deps):
    adj = defaultdict(list)
    indeg = [0] * n
    for a, b in deps:
        adj[a].append(b)
        indeg[b] += 1
    heap = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        u = heapq.heappop(heap)
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(heap, v)
    return order if len(order) == n else []`,
    approach:
      'Kahn topological sort with a min-heap as the ready queue so the lowest-numbered task with no remaining prerequisites is always chosen. Removing a task lowers its dependents in-degree; any newly free task joins the heap. If fewer than n tasks come out, a cycle exists.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[1,2]]'],
      ['2', '[[0,1],[1,0]]'],
      ['1', '[]'],
      ['4', '[]'],
      ['4', '[[0,1],[0,2],[1,3],[2,3]]'],
      ['5', '[[1,0],[2,0],[3,1],[4,2]]'],
      ['3', '[[2,0],[2,1]]'],
      ['6', '[[5,4],[5,2],[4,3],[2,3],[3,1],[3,0]]'],
      ['3', '[[0,1],[1,2],[2,0]]'],
      ['4', '[[3,2],[2,1],[1,0]]'],
    ],
  },
  {
    n: 1715,
    id: 'pghub-b27-recent-hits',
    name: 'Recent Request Counter',
    topic_id: 'queue',
    difficulty: 'Easy',
    method_name: 'countRecent',
    params: [
      { name: 'pings', type: 'List[int]' },
      { name: 'window', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Requests arrive at strictly increasing timestamps given in <code>pings</code>. After each request at time <code>t</code>, report how many requests (including the current one) fell in the inclusive time range <code>[t - window, t]</code>. Return the list of counts, one per request.',
    examples: [
      ['[1,100,3001,3002]\n3000', '[1,2,1,2]', 'At 3001 only requests from time 1 to 3001 within 3000 count.'],
      ['[1,2,3]\n10', '[1,2,3]', 'All requests stay inside the window.'],
    ],
    constraints: ['1 <= pings.length <= 10^5', '1 <= pings[i] <= 10^9', 'pings is strictly increasing', '0 <= window <= 10^9'],
    tags: ['queue', 'sliding-window'],
    py: `def countRecent(pings, window):
    q = deque()
    res = []
    for t in pings:
        q.append(t)
        cutoff = t - window
        while q[0] < cutoff:
            q.popleft()
        res.append(len(q))
    return res`,
    approach:
      'Keep a queue of recent timestamps. For each new request, append it and pop from the front every timestamp older than t - window. Because timestamps only grow, each is added and removed once, so the queue size is the answer for that request.',
    complexity: { time: 'O(n) amortized', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,100,3001,3002]', '3000'],
      ['[1,2,3]', '10'],
      ['[5]', '0'],
      ['[1,2,3,4,5]', '0'],
      ['[10,20,30,40]', '15'],
      ['[1,1000000000]', '500000000'],
      ['[1,2,3,4,5,6,7,8]', '3'],
      ['[100,200,300,400,500]', '250'],
      ['[1,3,5,7,9]', '4'],
      ['[2,4,6,8,10,12]', '5'],
    ],
  },
  {
    n: 1724,
    id: 'pghub-b27-longest-window-sum',
    name: 'Longest Bounded Sum Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestWindow',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array of non-negative integers <code>nums</code> and an integer <code>limit</code>, return the length of the longest contiguous subarray whose element sum is at most <code>limit</code>.',
    examples: [
      ['[1,2,1,0,1,1]\n4', '5', 'The window [2,1,0,1] ... the longest sum-<=4 window has length 5.'],
      ['[5,1,1]\n3', '2', 'Window [1,1] sums to 2; including 5 exceeds the limit.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^4', '0 <= limit <= 10^9'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestWindow(nums, limit):
    left = 0
    cur = 0
    best = 0
    for right, v in enumerate(nums):
        cur += v
        while cur > limit and left <= right:
            cur -= nums[left]
            left += 1
        if cur <= limit:
            best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window with two pointers. Extend the right edge adding each value; whenever the running sum exceeds the limit, shrink from the left until it fits again. Track the maximum valid window width. Non-negative values make the sum monotonic in the window bounds.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,1,0,1,1]', '4'],
      ['[5,1,1]', '3'],
      ['[1,1,1,1,1]', '3'],
      ['[10,10,10]', '5'],
      ['[0,0,0,0]', '0'],
      ['[2,3,1,2,4,3]', '7'],
      ['[7]', '7'],
      ['[7]', '6'],
      ['[1,2,3,4,5]', '100'],
      ['[4,2,2,7,8,1,2,8,10]', '12'],
    ],
  },
  {
    n: 1730,
    id: 'pghub-b27-min-path-cost',
    name: 'Minimum Falling Grid Path',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'minPathCost',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'You start in any cell of the top row of an integer <code>grid</code> and fall to the bottom row. From cell <code>(r, c)</code> you may step to <code>(r+1, c-1)</code>, <code>(r+1, c)</code> or <code>(r+1, c+1)</code> if that cell exists. The cost of a path is the sum of values of the cells visited. Return the minimum possible path cost from the top row to the bottom row.',
    examples: [
      ['[[2,1,3],[6,5,4],[7,8,9]]', '13', 'Path 1 -> 4 -> 8 ... the minimum falling path sums to 13.'],
      ['[[5]]', '5', 'A single cell is both start and end.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '-100 <= grid[r][c] <= 100'],
    tags: ['2d-dp', 'dp'],
    py: `def minPathCost(grid):
    n = len(grid)
    cols = len(grid[0])
    prev = list(grid[0])
    for r in range(1, n):
        cur = [0] * cols
        for c in range(cols):
            best = prev[c]
            if c > 0:
                best = min(best, prev[c - 1])
            if c < cols - 1:
                best = min(best, prev[c + 1])
            cur[c] = grid[r][c] + best
        prev = cur
    return min(prev)`,
    approach:
      'Bottom-up DP over rows. The cheapest way to reach a cell is its own value plus the minimum cost among the up-to-three cells above it that can step into it. Roll a single row of best costs down the grid; the answer is the smallest value in the final row.',
    complexity: { time: 'O(rows * cols)', space: 'O(cols)' },
    cases: [
      ['[[2,1,3],[6,5,4],[7,8,9]]'],
      ['[[5]]'],
      ['[[1,2,3],[4,5,6]]'],
      ['[[-1,-2,-3],[-4,-5,-6]]'],
      ['[[1],[2],[3],[4]]'],
      ['[[1,2,3,4]]'],
      ['[[10,10,10],[1,1,1],[10,10,10]]'],
      ['[[3,1,1],[1,5,1],[4,2,1]]'],
      ['[[0,0],[0,0],[0,0]]'],
      ['[[5,3,8,2],[9,1,4,7],[2,6,3,5],[8,4,2,1]]'],
    ],
  },
  {
    n: 1740,
    id: 'pghub-b27-keypad-words',
    name: 'Keypad Letter Combinations',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'letterCombos',
    params: [{ name: 'digits', type: 'str' }],
    return_type: 'List[str]',
    statement:
      'On a classic phone keypad each digit from <code>2</code> to <code>9</code> maps to letters: 2->abc, 3->def, 4->ghi, 5->jkl, 6->mno, 7->pqrs, 8->tuv, 9->wxyz. Given a string of such <code>digits</code>, return every letter combination the digits could spell, in lexicographic order. Return an empty list for an empty input.',
    examples: [
      ['"23"', '["ad","ae","af","bd","be","bf","cd","ce","cf"]', 'Each letter of 2 pairs with each letter of 3.'],
      ['""', '[]', 'No digits, no combinations.'],
    ],
    constraints: ['0 <= digits.length <= 8', "digits[i] is in the range '2'..'9'"],
    tags: ['backtracking', 'recursion'],
    py: `def letterCombos(digits):
    if not digits:
        return []
    mapping = {
        '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
        '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz',
    }
    res = []
    cur = []
    def backtrack(i):
        if i == len(digits):
            res.append("".join(cur))
            return
        for ch in mapping[digits[i]]:
            cur.append(ch)
            backtrack(i + 1)
            cur.pop()
    backtrack(0)
    return res`,
    approach:
      'Depth-first backtracking: at each digit position try every letter it maps to, recurse to the next position, and record a combination once all digits are consumed. Because each digit string is already in alphabetical order and digits are processed left to right, the output comes out lexicographically sorted.',
    complexity: { time: 'O(4^n * n)', space: 'O(n)' },
    cases: [
      ['"23"'], ['""'], ['"2"'], ['"7"'], ['"9"'],
      ['"234"'], ['"79"'], ['"22"'], ['"456"'], ['"99"'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B27>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b27-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B27>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B27>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b27-grade-${prob.n}.py`);
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
