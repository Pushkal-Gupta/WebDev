#!/usr/bin/env node
// Batch 44 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2764,2773,2774,2775,2776,2777,2782,2783,2792,2793,2794,2795,2796,2797,2802
//
//   node scripts/fill-gap-problems-batch44.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch44.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch44.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [2764, 2773, 2774, 2775, 2776, 2777, 2782, 2783, 2792, 2793, 2794, 2795, 2796, 2797, 2802];

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
    n: 2764,
    id: 'pghub-b44-run-length',
    name: 'Run-Length Encode',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'runLength',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Compress a lowercase string <code>s</code> with run-length encoding: replace each maximal run of one repeated character by that character followed by the run length written in decimal. A run of length one still gets the digit <code>1</code>. Return the encoded string.',
    examples: [
      ['"aaabbc"', 'a3b2c1', 'Runs aaa, bb, c become a3, b2, c1.'],
      ['"abc"', 'a1b1c1', 'Three singleton runs.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def runLength(s):
    if not s:
        return ""
    out = []
    cur = s[0]
    count = 1
    for ch in s[1:]:
        if ch == cur:
            count += 1
        else:
            out.append(cur + str(count))
            cur = ch
            count = 1
    out.append(cur + str(count))
    return "".join(out)`,
    approach:
      'Scan the string once tracking the current run character and its length. When the next character differs, flush the current run as "char+length" and start a new run. Flush the final run after the loop.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"aaabbc"'],
      ['"abc"'],
      ['""'],
      ['"a"'],
      ['"aaaaaa"'],
      ['"aabbaa"'],
      ['"zzzzzzzzzz"'],
      ['"abcabc"'],
      ['"mississippi"'],
      ['"qwertyuiop"'],
    ],
  },
  {
    n: 2773,
    id: 'pghub-b44-second-largest',
    name: 'Second Largest Distinct',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'secondLargest',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Return the second largest <em>distinct</em> value in <code>nums</code>. If fewer than two distinct values exist, return <code>-1</code>.',
    examples: [
      ['[3,1,4,4,5]', '4', 'Distinct values sorted descending: 5,4,3,1; the second is 4.'],
      ['[7,7,7]', '-1', 'Only one distinct value.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays'],
    py: `def secondLargest(nums):
    first = None
    second = None
    for x in nums:
        if first is None or x > first:
            if first is not None:
                second = first
            first = x
        elif x != first and (second is None or x > second):
            second = x
    return second if second is not None else -1`,
    approach:
      'Track the largest and second-largest distinct values in a single pass. When a value exceeds the current maximum, the old maximum becomes the runner-up. Otherwise, if it differs from the maximum and beats the current runner-up, it updates the runner-up. Return -1 when no runner-up was found.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4,4,5]'],
      ['[7,7,7]'],
      ['[1]'],
      ['[5,4]'],
      ['[4,5]'],
      ['[-1,-2,-3]'],
      ['[10,10,9,9,8]'],
      ['[2,2,2,1]'],
      ['[100,50,100,50]'],
      ['[0,0,0,0,1]'],
    ],
  },
  {
    n: 2774,
    id: 'pghub-b44-longest-le-k',
    name: 'Longest Subarray Sum At Most K',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestAtMostK',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code> of non-negative integers and an integer <code>k</code>, return the length of the longest contiguous subarray whose sum is at most <code>k</code>.',
    examples: [
      ['[1,2,1,0,1,1]\n4', '5', 'The window [2,1,0,1] extends; the best length-5 window [1,2,1,0,1] sums to 5? choose [2,1,0,1,1]=5>4, so [1,2,1,0,1] no.'],
      ['[5,1,1]\n3', '2', 'The window [1,1] sums to 2 <= 3.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^4', '0 <= k <= 10^9'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestAtMostK(nums, k):
    left = 0
    cur = 0
    best = 0
    for right in range(len(nums)):
        cur += nums[right]
        while cur > k:
            cur -= nums[left]
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Use a sliding window with non-negative values, so growing the window can only increase the sum. Expand the right edge, and whenever the window sum exceeds k shrink from the left until it fits. The widest valid window seen is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,1,0,1,1]', '4'],
      ['[5,1,1]', '3'],
      ['[1,1,1,1]', '0'],
      ['[0,0,0,0]', '0'],
      ['[3,1,2,1,4]', '5'],
      ['[10]', '5'],
      ['[2,3,1,2,4,3]', '7'],
      ['[1,1,1,1,1]', '100'],
      ['[5,5,5,5]', '4'],
      ['[0,0,1,0,0]', '1'],
    ],
  },
  {
    n: 2775,
    id: 'pghub-b44-bracket-depth',
    name: 'Max Bracket Nesting Depth',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code>, <code>)</code>, and lowercase letters. The brackets are guaranteed to be balanced. Return the maximum nesting depth of the parentheses (the deepest level of nested brackets). A string with no brackets has depth 0.',
    examples: [
      ['"a(b(c)d)e"', '2', 'The inner (c) is nested two levels deep.'],
      ['"abc"', '0', 'No brackets.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's contains only "(", ")" and lowercase letters', 'brackets are balanced'],
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
      'Track the current open-bracket depth as a counter that increments on "(" and decrements on ")". Because the brackets are balanced, the counter stays non-negative; the maximum value it reaches is the deepest nesting.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"a(b(c)d)e"'],
      ['"abc"'],
      ['""'],
      ['"((()))"'],
      ['"()()()"'],
      ['"(a)(b)(c)"'],
      ['"(((x)))"'],
      ['"a(b)c(d(e)f)g"'],
      ['"()"'],
      ['"(()(()))"'],
    ],
  },
  {
    n: 2776,
    id: 'pghub-b44-min-coins-greedy',
    name: 'Canonical Coin Change',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minCoins',
    params: [{ name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'You have an unlimited supply of coins worth 1, 5, 10, and 25 units. Return the minimum number of coins needed to make exactly <code>amount</code> units. Making 0 needs 0 coins.',
    examples: [
      ['63', '6', '25+25+10+1+1+1 = 63 using 6 coins.'],
      ['0', '0', 'No coins needed.'],
    ],
    constraints: ['0 <= amount <= 10^9'],
    tags: ['greedy', 'math'],
    py: `def minCoins(amount):
    coins = [25, 10, 5, 1]
    count = 0
    for c in coins:
        count += amount // c
        amount %= c
    return count`,
    approach:
      'The coin system {1,5,10,25} is canonical, so a greedy choice is optimal: repeatedly take the largest coin not exceeding the remaining amount. Dividing by each denomination in descending order counts how many of that coin to use and leaves the remainder for smaller coins.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['63'],
      ['0'],
      ['25'],
      ['99'],
      ['1'],
      ['40'],
      ['7'],
      ['100'],
      ['11'],
      ['1000000000'],
    ],
  },
  {
    n: 2777,
    id: 'pghub-b44-factorial-zeros',
    name: 'Trailing Zeros of Factorial',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'trailingZeros',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Return the number of trailing zeros in <code>n!</code> (n factorial). For example, <code>5! = 120</code> has one trailing zero.',
    examples: [
      ['5', '1', '120 ends in one zero.'],
      ['10', '2', '3628800 ends in two zeros.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math'],
    py: `def trailingZeros(n):
    count = 0
    p = 5
    while p <= n:
        count += n // p
        p *= 5
    return count`,
    approach:
      'A trailing zero comes from a factor of 10 = 2 * 5, and factors of 5 are scarcer than factors of 2 in a factorial. Counting the multiples of 5, 25, 125, ... up to n (Legendre\'s formula) tallies the total power of 5, which equals the number of trailing zeros.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['5'],
      ['10'],
      ['0'],
      ['4'],
      ['25'],
      ['100'],
      ['1000'],
      ['7'],
      ['50'],
      ['1000000000'],
    ],
  },
  {
    n: 2782,
    id: 'pghub-b44-closest-pair-sum',
    name: 'Pair Sum Closest To Target',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'closestPairSum',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code> with at least two elements and an integer <code>target</code>, choose two distinct indices whose values sum as close as possible to <code>target</code>. Return that closest achievable sum. If two sums are equally close, return the smaller sum.',
    examples: [
      ['[1,3,5,8]\n7', '6', 'The pair 1+5=6 is closest to 7 (distance 1).'],
      ['[2,2,2]\n10', '4', 'Only sum available is 4.'],
    ],
    constraints: ['2 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def closestPairSum(nums, target):
    arr = sorted(nums)
    lo, hi = 0, len(arr) - 1
    best = None
    while lo < hi:
        s = arr[lo] + arr[hi]
        if best is None or abs(s - target) < abs(best - target) or (abs(s - target) == abs(best - target) and s < best):
            best = s
        if s < target:
            lo += 1
        elif s > target:
            hi -= 1
        else:
            return s
    return best`,
    approach:
      'Sort the array, then use two pointers from the ends. The current pair sum tells you which way to move: if it is below target advance the low pointer to increase it, if above move the high pointer down. Track the best sum by distance to target, breaking ties toward the smaller sum.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,5,8]', '7'],
      ['[2,2,2]', '10'],
      ['[1,2]', '3'],
      ['[-5,-2,0,4,9]', '1'],
      ['[10,20,30,40]', '0'],
      ['[1,1,1,1]', '2'],
      ['[5,5,5,5]', '11'],
      ['[-3,-1,2,6]', '4'],
      ['[100,200,300]', '450'],
      ['[0,0,0,0]', '5'],
    ],
  },
  {
    n: 2783,
    id: 'pghub-b44-int-sqrt',
    name: 'Integer Square Root',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'intSqrt',
    params: [{ name: 'x', type: 'int' }],
    return_type: 'int',
    statement:
      'Return the floor of the square root of a non-negative integer <code>x</code>, that is, the largest integer <code>r</code> with <code>r*r <= x</code>. Do not use any built-in square root function.',
    examples: [
      ['8', '2', '2*2=4 <= 8 but 3*3=9 > 8.'],
      ['16', '4', '4*4 = 16 exactly.'],
    ],
    constraints: ['0 <= x <= 10^18'],
    tags: ['binary-search', 'math'],
    py: `def intSqrt(x):
    if x < 2:
        return x
    lo, hi = 1, x
    ans = 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= x:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans`,
    approach:
      'Binary search the answer in the range [1, x]. For a candidate mid, if mid squared does not exceed x it is a feasible root and we record it while searching higher; otherwise search lower. The largest feasible value found is the integer square root.',
    complexity: { time: 'O(log x)', space: 'O(1)' },
    cases: [
      ['8'],
      ['16'],
      ['0'],
      ['1'],
      ['2'],
      ['99'],
      ['100'],
      ['2147483647'],
      ['1000000000000000000'],
      ['15'],
    ],
  },
  {
    n: 2792,
    id: 'pghub-b44-circular-rob',
    name: 'Circular Street Robber',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'circularRob',
    params: [{ name: 'houses', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Houses with non-negative loot values stand in a circle described by <code>houses</code>, so the first and last houses are adjacent. You may not rob two adjacent houses. Return the maximum total loot you can collect.',
    examples: [
      ['[2,3,2]', '3', 'Houses 0 and 2 are adjacent (circle), so you can take only one; best single is house 1 with 3.'],
      ['[1,2,3,1]', '4', 'Rob houses 0 and 2 for 1+3=4.'],
    ],
    constraints: ['1 <= houses.length <= 10^5', '0 <= houses[i] <= 10^4'],
    tags: ['dp'],
    py: `def circularRob(houses):
    n = len(houses)
    if n == 1:
        return houses[0]
    def rob_line(arr):
        prev = 0
        cur = 0
        for v in arr:
            prev, cur = cur, max(cur, prev + v)
        return cur
    return max(rob_line(houses[:-1]), rob_line(houses[1:]))`,
    approach:
      'Because the first and last houses are adjacent, at most one of them can be robbed. Solve two linear house-robber subproblems: one excluding the last house and one excluding the first. Each linear case uses a rolling DP where each house is either skipped or robbed plus the best two houses back. The answer is the larger of the two.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,2]'],
      ['[1,2,3,1]'],
      ['[0]'],
      ['[5,5]'],
      ['[1,2,3,4,5]'],
      ['[10,1,1,10]'],
      ['[2,7,9,3,1]'],
      ['[0,0,0,0]'],
      ['[100]'],
      ['[4,1,2,7,5,3,1]'],
    ],
  },
  {
    n: 2793,
    id: 'pghub-b44-bst-range-count',
    name: 'Count Values In Range',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'countInRange',
    params: [
      { name: 'tree', type: 'List[int]' },
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A binary tree is given as a level-order list <code>tree</code> where <code>-1</code> marks an absent node and the root is at index 0; the children of index <code>i</code> are at indices <code>2*i+1</code> and <code>2*i+2</code>. Return how many present nodes hold a value in the inclusive range <code>[lo, hi]</code>.',
    examples: [
      ['[5,3,8,1,4,-1,9]\n3\n8', '4', 'Values 5,3,8,4 lie in [3,8].'],
      ['[10]\n1\n5', '0', 'The only value 10 is out of range.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'node values are between 0 and 10^4', '-1 marks an absent node', '0 <= lo <= hi <= 10^4'],
    tags: ['trees'],
    py: `def countInRange(tree, lo, hi):
    count = 0
    for v in tree:
        if v != -1 and lo <= v <= hi:
            count += 1
    return count`,
    approach:
      'The level-order array already lists every node value, with -1 standing in for missing nodes. A single sweep over the array counts present values that fall within the inclusive range, ignoring the -1 placeholders.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[5,3,8,1,4,-1,9]', '3', '8'],
      ['[10]', '1', '5'],
      ['[]', '0', '100'],
      ['[-1]', '0', '100'],
      ['[1,2,3,4,5,6,7]', '0', '10000'],
      ['[1,2,3,4,5,6,7]', '4', '6'],
      ['[100,50,150,-1,-1,-1,200]', '50', '150'],
      ['[0,0,0,0]', '0', '0'],
      ['[3,1,5,-1,2,4,-1]', '2', '4'],
      ['[9999,1,9998,2,9997]', '9997', '9999'],
    ],
  },
  {
    n: 2794,
    id: 'pghub-b44-shortest-path-len',
    name: 'Shortest Hop Count',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shortestHops',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'An undirected graph has <code>n</code> nodes labelled <code>0..n-1</code> and edge list <code>edges</code> (each <code>[u, v]</code>). Return the minimum number of edges on a path from <code>src</code> to <code>dst</code>, or <code>-1</code> if <code>dst</code> is unreachable. The distance from a node to itself is 0.',
    examples: [
      ['4\n[[0,1],[1,2],[2,3]]\n0\n3', '3', 'Path 0-1-2-3 uses 3 edges.'],
      ['3\n[[0,1]]\n0\n2', '-1', 'Node 2 is isolated.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 2*10^5', '0 <= u, v, src, dst < n'],
    tags: ['graphs', 'bfs'],
    py: `def shortestHops(n, edges, src, dst):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    dist = [-1] * n
    dist[src] = 0
    queue = deque([src])
    while queue:
        node = queue.popleft()
        if node == dst:
            return dist[node]
        for nxt in adj[node]:
            if dist[nxt] == -1:
                dist[nxt] = dist[node] + 1
                queue.append(nxt)
    return dist[dst]`,
    approach:
      'In an unweighted graph the fewest-edges path is found by breadth-first search. Build an adjacency list, then BFS from the source recording each node\'s distance the first time it is reached. The recorded distance of the destination is the answer, or -1 if it was never reached.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[2,3]]', '0', '3'],
      ['3', '[[0,1]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['5', '[[0,1],[0,2],[1,3],[2,3],[3,4]]', '0', '4'],
      ['6', '[[0,1],[1,2],[3,4],[4,5]]', '0', '5'],
      ['4', '[[0,1],[1,2],[2,0]]', '0', '2'],
      ['2', '[[0,1],[0,1]]', '0', '1'],
      ['5', '[[0,1],[1,2],[2,3],[3,4],[0,4]]', '0', '4'],
      ['3', '[[0,1],[1,2]]', '2', '0'],
      ['7', '[[0,1],[1,2],[2,3],[4,5],[5,6]]', '0', '6'],
    ],
  },
  {
    n: 2795,
    id: 'pghub-b44-kth-largest',
    name: 'Kth Largest Element',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargest',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Return the <code>k</code>-th largest element in <code>nums</code> by value, where duplicates count toward the ordering (the 1st largest is the maximum). It is guaranteed that <code>1 <= k <= nums.length</code>.',
    examples: [
      ['[3,2,1,5,6,4]\n2', '5', 'Sorted descending: 6,5,4,3,2,1; the 2nd is 5.'],
      ['[1,1,1,1]\n3', '1', 'All elements are 1.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length', '-10^9 <= nums[i] <= 10^9'],
    tags: ['heap', 'sorting'],
    py: `def kthLargest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
    approach:
      'Maintain a min-heap of the k largest values seen so far. Push each element and, whenever the heap grows past size k, pop the smallest so only the top k survive. After processing everything, the heap root is the k-th largest element.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[3,2,1,5,6,4]', '2'],
      ['[1,1,1,1]', '3'],
      ['[1]', '1'],
      ['[5,4,3,2,1]', '1'],
      ['[5,4,3,2,1]', '5'],
      ['[7,7,7,8,8]', '2'],
      ['[-1,-2,-3,-4]', '2'],
      ['[10,20,30,40,50]', '3'],
      ['[2,1,2,1,2]', '4'],
      ['[100,99,98,97,96,95]', '6'],
    ],
  },
  {
    n: 2796,
    id: 'pghub-b44-total-set-bits',
    name: 'Total Set Bits',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'totalSetBits',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given a list of non-negative integers <code>nums</code>, return the total number of <code>1</code> bits in the binary representations of all the numbers combined.',
    examples: [
      ['[1,2,3]', '4', '1=1 (1), 2=10 (1), 3=11 (2); total 4.'],
      ['[0,0,0]', '0', 'No set bits.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9'],
    tags: ['bit-manipulation'],
    py: `def totalSetBits(nums):
    total = 0
    for x in nums:
        while x:
            x &= x - 1
            total += 1
    return total`,
    approach:
      'For each number, repeatedly clear the lowest set bit using the trick x & (x-1), counting one bit per clear. Summing across all numbers gives the total population count. Clearing the lowest bit runs once per set bit, so it is efficient.',
    complexity: { time: 'O(n * popcount)', space: 'O(1)' },
    cases: [
      ['[1,2,3]'],
      ['[0,0,0]'],
      ['[7]'],
      ['[255]'],
      ['[1,1,1,1]'],
      ['[1023,1023]'],
      ['[1000000000]'],
      ['[2,4,8,16]'],
      ['[0,1,2,3,4,5]'],
      ['[15,16,17]'],
    ],
  },
  {
    n: 2797,
    id: 'pghub-b44-distinct-perms',
    name: 'Distinct Permutation Count',
    topic_id: 'backtracking',
    difficulty: 'Hard',
    method_name: 'distinctPerms',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> of lowercase letters (possibly with repeats), return the number of <em>distinct</em> permutations of its characters. For example, <code>"aab"</code> has the 3 distinct permutations aab, aba, baa.',
    examples: [
      ['"aab"', '3', 'aab, aba, baa.'],
      ['"abc"', '6', 'All 6 orderings are distinct.'],
    ],
    constraints: ['1 <= s.length <= 10', 's consists of lowercase English letters'],
    tags: ['backtracking', 'math'],
    py: `def distinctPerms(s):
    counts = Counter(s)
    result = [0]
    n = len(s)
    def backtrack(remaining):
        if remaining == 0:
            result[0] += 1
            return
        for ch in list(counts.keys()):
            if counts[ch] > 0:
                counts[ch] -= 1
                backtrack(remaining - 1)
                counts[ch] += 1
    backtrack(n)
    return result[0]`,
    approach:
      'Build permutations one character at a time using backtracking over the multiset of remaining letters. At each position only distinct available characters are tried (each unique key in the count map), which avoids generating duplicate arrangements. Every completed arrangement adds one to the count.',
    complexity: { time: 'O(distinct_perms * n)', space: 'O(n)' },
    cases: [
      ['"aab"'],
      ['"abc"'],
      ['"a"'],
      ['"aaa"'],
      ['"aabb"'],
      ['"abcd"'],
      ['"aabbcc"'],
      ['"zzzz"'],
      ['"abab"'],
      ['"abcde"'],
    ],
  },
  {
    n: 2802,
    id: 'pghub-b44-merged-coverage',
    name: 'Total Covered Length',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'coveredLength',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[start, end]</code> in <code>intervals</code> covers the segment from <code>start</code> to <code>end</code> on a number line (with <code>start <= end</code>). Overlapping segments are merged. Return the total length of the number line covered by at least one interval.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '6', 'Merged into [1,5] (length 4) and [7,9] (length 2); total 6.'],
      ['[[1,2],[3,4]]', '2', 'Two disjoint length-1 segments.'],
    ],
    constraints: ['1 <= intervals.length <= 10^5', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def coveredLength(intervals):
    order = sorted(intervals, key=lambda x: x[0])
    total = 0
    cur_start, cur_end = order[0]
    for s, e in order[1:]:
        if s <= cur_end:
            if e > cur_end:
                cur_end = e
        else:
            total += cur_end - cur_start
            cur_start, cur_end = s, e
    total += cur_end - cur_start
    return total`,
    approach:
      'Sort intervals by start, then sweep merging any interval that begins at or before the current merged segment ends, extending the end as needed. When a gap appears, close the current segment by adding its length and begin a new one. Add the last segment after the sweep.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[1,2],[3,4]]'],
      ['[[0,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[5,5],[6,6]]'],
      ['[[0,100],[10,20],[30,40]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[10,20],[15,25],[24,30]]'],
      ['[[0,1000000000]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B44>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b44-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B44>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B44>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b44-grade-${prob.n}.py`);
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
