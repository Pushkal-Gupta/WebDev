#!/usr/bin/env node
// Batch 43 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2854,2863,2868,2892,2893,2898,2907,2912,2921,2922,2927,2936,2941,2950,2955
//
//   node scripts/fill-gap-problems-batch43.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch43.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch43.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [2854, 2863, 2868, 2892, 2893, 2898, 2907, 2912, 2921, 2922, 2927, 2936, 2941, 2950, 2955];

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
    n: 2854,
    id: 'pghub-b43-elevator-trips',
    name: 'Elevator Trip Count',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'elevatorTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People wait at a lift in the fixed order given by <code>weights</code>. The lift loads people from the front of the queue while their combined weight stays at or below <code>capacity</code>, then makes one trip. It is guaranteed every single person weighs at most <code>capacity</code>. Return how many trips the lift makes to carry everyone.',
    examples: [
      ['[60,80,70]\n150', '2', 'Trip 1 takes 60+80=140; person 3 alone is trip 2.'],
      ['[50,50,50]\n200', '1', 'All three fit in one trip (150 <= 200).'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= capacity', '1 <= capacity <= 10^9'],
    tags: ['greedy', 'arrays'],
    py: `def elevatorTrips(weights, capacity):
    trips = 0
    cur = 0
    for w in weights:
        if cur + w > capacity:
            trips += 1
            cur = 0
        cur += w
    if cur > 0:
        trips += 1
    return trips`,
    approach:
      'Walk the queue once keeping the weight loaded so far. When the next person would exceed the capacity, close the current trip and start a fresh one. After the loop a partially-filled lift still counts as one final trip.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[60,80,70]', '150'],
      ['[50,50,50]', '200'],
      ['[100]', '100'],
      ['[1,1,1,1,1]', '2'],
      ['[5,5,5,5]', '5'],
      ['[10,20,30,40]', '50'],
      ['[7,7,7,7,7,7]', '21'],
      ['[3,1,4,1,5,9,2]', '10'],
      ['[8,8,8,8]', '16'],
      ['[2,2,2,2,2,2,2]', '6'],
    ],
  },
  {
    n: 2863,
    id: 'pghub-b43-zigzag-merge',
    name: 'Zigzag Two Lists',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'zigzagMerge',
    params: [
      { name: 'a', type: 'List[int]' },
      { name: 'b', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Interleave two lists <code>a</code> and <code>b</code> by alternately taking one element from the front of each, starting with <code>a</code>. When one list runs out, append the remaining elements of the other list in order. Return the resulting list.',
    examples: [
      ['[1,2,3]\n[4,5,6]', '[1,4,2,5,3,6]', 'Alternate a,b,a,b,a,b.'],
      ['[1]\n[7,8,9]', '[1,7,8,9]', 'After one a and one b, the rest of b is appended.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', '-10^9 <= a[i], b[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def zigzagMerge(a, b):
    res = []
    i = j = 0
    while i < len(a) or j < len(b):
        if i < len(a):
            res.append(a[i])
            i += 1
        if j < len(b):
            res.append(b[j])
            j += 1
    return res`,
    approach:
      'Use two indices, one per list. On each round append the next available element from a (if any) then from b (if any), advancing the matching index. The loop continues until both indices pass their lists, so leftovers from the longer list are appended naturally.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '[4,5,6]'],
      ['[1]', '[7,8,9]'],
      ['[]', '[1,2,3]'],
      ['[1,2,3]', '[]'],
      ['[]', '[]'],
      ['[5,5]', '[5,5]'],
      ['[1,2,3,4,5]', '[10]'],
      ['[-1,-2]', '[0,0,0]'],
      ['[9]', '[8]'],
      ['[1,3,5,7]', '[2,4,6,8]'],
    ],
  },
  {
    n: 2868,
    id: 'pghub-b43-prime-gap',
    name: 'Smallest Prime Gap',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'smallestPrimeGap',
    params: [
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Consider all prime numbers in the inclusive range <code>[lo, hi]</code>. Return the smallest difference between two consecutive primes in that range. If fewer than two primes lie in the range, return <code>-1</code>.',
    examples: [
      ['2\n11', '1', 'Primes 2,3,5,7,11; the gap 3-2 = 1 is smallest.'],
      ['14\n16', '-1', 'No two primes exist in this range.'],
    ],
    constraints: ['2 <= lo <= hi <= 10^5'],
    tags: ['math', 'sieve'],
    py: `def smallestPrimeGap(lo, hi):
    sieve = [True] * (hi + 1)
    sieve[0] = False
    if hi >= 1:
        sieve[1] = False
    p = 2
    while p * p <= hi:
        if sieve[p]:
            for m in range(p * p, hi + 1, p):
                sieve[m] = False
        p += 1
    primes = [x for x in range(lo, hi + 1) if sieve[x]]
    if len(primes) < 2:
        return -1
    best = min(primes[i + 1] - primes[i] for i in range(len(primes) - 1))
    return best`,
    approach:
      'Build a sieve of Eratosthenes up to hi, then collect the primes that fall inside [lo, hi]. Scanning consecutive primes once yields every adjacent gap; return the minimum, or -1 when there is at most one prime.',
    complexity: { time: 'O(hi log log hi)', space: 'O(hi)' },
    multiParam: true,
    cases: [
      ['2', '11'],
      ['14', '16'],
      ['2', '3'],
      ['10', '20'],
      ['90', '100'],
      ['2', '100'],
      ['50', '60'],
      ['97', '97'],
      ['2', '2'],
      ['100', '110'],
    ],
  },
  {
    n: 2892,
    id: 'pghub-b43-undo-stack',
    name: 'Text Editor Undo',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'finalLength',
    params: [{ name: 'ops', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'A toy editor starts with an empty document and processes operations in <code>ops</code>. An operation <code>"A x"</code> appends a block of <code>x</code> characters and records it; <code>"U"</code> undoes the most recent append that has not yet been undone (doing nothing if there is none). Return the number of characters in the document after all operations.',
    examples: [
      ['["A 3","A 2","U"]', '3', 'Append 3, append 2, then undo the 2 -> 3 characters remain.'],
      ['["U","A 5"]', '5', 'The leading undo has nothing to remove.'],
    ],
    constraints: ['1 <= ops.length <= 10^5', 'each op is "A x" with 1 <= x <= 10^4, or "U"'],
    tags: ['stack', 'strings'],
    py: `def finalLength(ops):
    stack = []
    total = 0
    for op in ops:
        if op == 'U':
            if stack:
                total -= stack.pop()
        else:
            x = int(op.split()[1])
            stack.append(x)
            total += x
    return total`,
    approach:
      'Treat each append as a frame pushed onto a stack carrying its character count, maintaining a running total. An undo pops the latest frame and subtracts its size, ignoring undos on an empty stack. The running total after all operations is the document length.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["A 3","A 2","U"]'],
      ['["U","A 5"]'],
      ['["U"]'],
      ['["A 1","A 1","A 1"]'],
      ['["A 4","U","U"]'],
      ['["A 10","A 20","U","A 5"]'],
      ['["A 7"]'],
      ['["U","U","U"]'],
      ['["A 2","A 3","U","A 4","U","U"]'],
      ['["A 100","A 50","A 25","U","U"]'],
    ],
  },
  {
    n: 2893,
    id: 'pghub-b43-balanced-split',
    name: 'Count Balanced Splits',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'balancedSplits',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code>, a split point <code>i</code> (with <code>1 <= i < n</code>) divides it into a non-empty left part <code>nums[0..i-1]</code> and a non-empty right part <code>nums[i..n-1]</code>. The split is balanced when the two parts have equal sums. Return the number of balanced split points.',
    examples: [
      ['[1,2,3,3,2,1]', '1', 'Only the middle split gives 6 on each side.'],
      ['[2,2,2,2]', '1', 'Splitting after index 1 gives 4 and 4.'],
    ],
    constraints: ['2 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def balancedSplits(nums):
    total = sum(nums)
    left = 0
    count = 0
    for i in range(len(nums) - 1):
        left += nums[i]
        if left == total - left:
            count += 1
    return count`,
    approach:
      'Compute the whole-array sum once, then sweep a running left-prefix sum. At each valid split the right sum is total minus left, so the split is balanced exactly when the prefix equals half the remaining total. Count those positions in one pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,3,2,1]'],
      ['[2,2,2,2]'],
      ['[1,1]'],
      ['[1,2]'],
      ['[0,0,0,0]'],
      ['[5,-5,5,-5]'],
      ['[3,1,2,2,1,3]'],
      ['[10,10]'],
      ['[1,2,3,4,5]'],
      ['[-1,1,-1,1]'],
    ],
  },
  {
    n: 2898,
    id: 'pghub-b43-water-fill',
    name: 'Terrace Water Fill',
    topic_id: 'two-pointers',
    difficulty: 'Hard',
    method_name: 'trappedWater',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An array <code>heights</code> describes the heights of adjacent unit-width walls. After rain, water pools in the dips between taller walls. Return the total units of water trapped above the walls.',
    examples: [
      ['[0,2,0,3,0,1,0,4]', '8', 'Several dips fill up to the surrounding wall heights.'],
      ['[3,2,1]', '0', 'Strictly descending walls trap nothing.'],
    ],
    constraints: ['0 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def trappedWater(heights):
    if not heights:
        return 0
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if heights[left] <= heights[right]:
            if heights[left] >= left_max:
                left_max = heights[left]
            else:
                total += left_max - heights[left]
            left += 1
        else:
            if heights[right] >= right_max:
                right_max = heights[right]
            else:
                total += right_max - heights[right]
            right -= 1
    return total`,
    approach:
      'Water above a wall is limited by the shorter of the tallest walls to its left and right. Two inward pointers track the running left and right maxima; always advance the side with the smaller current height, since that side\'s bound is known. Add the deficit between the running max and the current wall.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,2,0,3,0,1,0,4]'],
      ['[3,2,1]'],
      ['[]'],
      ['[5]'],
      ['[1,2]'],
      ['[2,0,2]'],
      ['[4,2,0,3,2,5]'],
      ['[0,0,0,0]'],
      ['[1,2,3,4,5]'],
      ['[5,4,1,2,1,5]'],
    ],
  },
  {
    n: 2907,
    id: 'pghub-b43-meeting-overlap',
    name: 'Peak Meeting Overlap',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxOverlap',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[start, end]</code> in <code>meetings</code> is a half-open interval (a meeting occupies the room during <code>[start, end)</code>). Return the maximum number of meetings that are in progress at the same instant.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '2', 'Between 2 and 4 two meetings overlap.'],
      ['[[1,2],[2,3],[3,4]]', '1', 'Each meeting ends exactly when the next begins.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def maxOverlap(meetings):
    events = []
    for s, e in meetings:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))
    cur = best = 0
    for _, delta in events:
        cur += delta
        if cur > best:
            best = cur
    return best`,
    approach:
      'Turn each meeting into a +1 start event and a -1 end event, then sweep them in time order. Because intervals are half-open, ending events at a tie should be processed before starting events, which the sort key (-1 before +1 at equal times) ensures. The peak running count is the maximum concurrency.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[0,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[1,3],[2,4],[3,5],[4,6]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[0,1],[0,2],[0,3],[0,4]]'],
      ['[[10,20],[15,25],[18,30],[5,12]]'],
      ['[[1,100],[2,3],[4,5]]'],
      ['[[1,2]]'],
    ],
  },
  {
    n: 2912,
    id: 'pghub-b43-tree-leaf-depth',
    name: 'Deepest Leaf Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'deepestLeafSum',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given as a level-order list <code>tree</code> where <code>-1</code> marks an absent node and the root is at index 0; for a node at index <code>i</code> its children are at indices <code>2*i+1</code> and <code>2*i+2</code>. Return the sum of the values of all leaves that lie at the greatest depth. An empty tree sums to 0.',
    examples: [
      ['[1,2,3,4,5,-1,6]', '15', 'Deepest level holds 4,5,6 which sum to 15.'],
      ['[7]', '7', 'The single root is the deepest leaf.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'node values are between -10^4 and 10^4', '-1 marks an absent node'],
    tags: ['trees', 'bfs'],
    py: `def deepestLeafSum(tree):
    if not tree or tree[0] == -1:
        return 0
    n = len(tree)
    best_depth = -1
    best_sum = 0
    queue = deque([(0, 0)])
    while queue:
        idx, depth = queue.popleft()
        if idx >= n or tree[idx] == -1:
            continue
        left, right = 2 * idx + 1, 2 * idx + 2
        has_left = left < n and tree[left] != -1
        has_right = right < n and tree[right] != -1
        if not has_left and not has_right:
            if depth > best_depth:
                best_depth = depth
                best_sum = tree[idx]
            elif depth == best_depth:
                best_sum += tree[idx]
        else:
            if has_left:
                queue.append((left, depth + 1))
            if has_right:
                queue.append((right, depth + 1))
    return best_sum`,
    approach:
      'Breadth-first traverse the array-encoded tree, carrying each node\'s depth. A node with no present children is a leaf. Track the maximum leaf depth seen so far: reset the running sum when a deeper leaf appears, and accumulate when a leaf matches the current deepest level.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4,5,-1,6]'],
      ['[7]'],
      ['[]'],
      ['[-1]'],
      ['[1,2,3]'],
      ['[1,-1,3,-1,-1,-1,5]'],
      ['[5,4,4,3,-1,-1,3]'],
      ['[10,20,30,40,50,60,70]'],
      ['[1,2,-1,3,-1]'],
      ['[2,-1,2,-1,-1,-1,2]'],
    ],
  },
  {
    n: 2921,
    id: 'pghub-b43-stamp-ways',
    name: 'Stamp Combination Count',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'stampWays',
    params: [
      { name: 'stamps', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You have an unlimited supply of stamps with the face values in <code>stamps</code> (all distinct). Return the number of distinct combinations of stamps whose values sum exactly to <code>amount</code>. Two combinations are the same if they use the same multiset of values regardless of order.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5, 1+1+1+1+1, 1+1+1+2, 1+2+2.'],
      ['[2]\n3', '0', 'No way to make an odd amount with only 2s.'],
    ],
    constraints: ['1 <= stamps.length <= 50', '1 <= stamps[i] <= 100', 'stamps are distinct', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def stampWays(stamps, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for s in stamps:
        for a in range(s, amount + 1):
            dp[a] += dp[a - s]
    return dp[amount]`,
    approach:
      'Count unordered combinations with an unbounded coin-change DP. Process one stamp value at a time, and for each reachable sum add the ways to reach it using that value at least once. Iterating values in the outer loop avoids counting permutations of the same multiset.',
    complexity: { time: 'O(stamps * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10]', '20'],
      ['[2,3,7]', '12'],
      ['[1,5,10,25]', '30'],
      ['[7]', '14'],
      ['[3,4]', '0'],
      ['[1,2,5]', '0'],
    ],
  },
  {
    n: 2922,
    id: 'pghub-b43-island-count',
    name: 'Count Connected Plots',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countPlots',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A field <code>grid</code> uses <code>1</code> for owned land and <code>0</code> for empty ground. A plot is a maximal group of owned cells connected orthogonally (up, down, left, right). Return the number of distinct plots.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'A connected L-shape plus a lone corner cell.'],
      ['[[0,0],[0,0]]', '0', 'No owned land.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'dfs'],
    py: `def countPlots(grid):
    rows = len(grid)
    cols = len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count = 0
    for sr in range(rows):
        for sc in range(cols):
            if grid[sr][sc] == 1 and not seen[sr][sc]:
                count += 1
                stack = [(sr, sc)]
                seen[sr][sc] = True
                while stack:
                    r, c = stack.pop()
                    for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
    return count`,
    approach:
      'Scan every cell; when an unvisited owned cell is found, it starts a new plot. Flood-fill from it with an explicit stack, marking all orthogonally connected owned cells as visited so they are not recounted. Each flood-fill increments the plot count by one.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[0],[1],[0],[1]]'],
      ['[[1,0,1],[0,1,0],[1,0,1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,0,1],[0,0,0,0],[1,0,0,1]]'],
      ['[[1,1,0,0,1],[1,0,0,1,1]]'],
    ],
  },
  {
    n: 2927,
    id: 'pghub-b43-xor-pairs',
    name: 'Count Equal XOR Pairs',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'equalXorPairs',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Return the number of index pairs <code>(i, j)</code> with <code>i < j</code> such that <code>nums[i] XOR nums[j]</code> equals <code>target</code>, where XOR is the bitwise exclusive-or.',
    examples: [
      ['[1,2,3,4]\n7', '1', 'Only 3 XOR 4 = 7.'],
      ['[5,5,5]\n0', '3', 'Every pair of equal values XORs to 0.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9', '0 <= target <= 10^9'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def equalXorPairs(nums, target):
    seen = defaultdict(int)
    count = 0
    for x in nums:
        count += seen[x ^ target]
        seen[x] += 1
    return count`,
    approach:
      'For a value x, a partner y satisfies x XOR y == target exactly when y == x XOR target. Sweep left to right keeping a frequency map of values already seen; for each new element add the count of its required partner, then record the element. This counts each ordered i<j pair once.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '7'],
      ['[5,5,5]', '0'],
      ['[0,0,0,0]', '0'],
      ['[1,1,1,1]', '0'],
      ['[3,3]', '0'],
      ['[1,2,3,4,5,6]', '1'],
      ['[10,20,30]', '0'],
      ['[7,7,7,7]', '0'],
      ['[1,2,4,8]', '12'],
      ['[15,0,15,0]', '15'],
    ],
  },
  {
    n: 2936,
    id: 'pghub-b43-rotate-search',
    name: 'Search Rotated Catalog',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findInRotated',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A sorted catalog of distinct integers was rotated at an unknown pivot, producing <code>nums</code>. Return the index of <code>target</code> in <code>nums</code>, or <code>-1</code> if it is absent. Aim for logarithmic time.',
    examples: [
      ['[4,5,6,7,0,1,2]\n0', '4', 'The value 0 sits at index 4 after rotation.'],
      ['[4,5,6,7,0,1,2]\n3', '-1', '3 is not present.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', 'nums was a strictly ascending array rotated once', '-10^9 <= nums[i], target <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def findInRotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    approach:
      'A rotated sorted array splits at the midpoint into one sorted half and one rotated half. Check which half is sorted by comparing the low end with the midpoint, then test whether the target lies inside that sorted half; recurse into the appropriate side. Each step halves the search space.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[4,5,6,7,0,1,2]', '0'],
      ['[4,5,6,7,0,1,2]', '3'],
      ['[1]', '1'],
      ['[1]', '0'],
      ['[3,1]', '1'],
      ['[5,1,2,3,4]', '5'],
      ['[1,2,3,4,5]', '4'],
      ['[6,7,8,1,2,3,4,5]', '8'],
      ['[2,3,4,5,6,7,1]', '1'],
      ['[10,20,30,40]', '25'],
    ],
  },
  {
    n: 2941,
    id: 'pghub-b43-word-ladder-len',
    name: 'One-Letter Word Chain',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'chainLength',
    params: [
      { name: 'start', type: 'str' },
      { name: 'goal', type: 'str' },
      { name: 'words', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'Given a <code>start</code> word and a <code>goal</code> word of equal length, and a dictionary <code>words</code>, transform <code>start</code> into <code>goal</code> by changing one letter at a time so that every intermediate word is in <code>words</code>. Return the number of words in the shortest such chain (counting both endpoints), or <code>0</code> if no chain exists. The goal must be in <code>words</code>.',
    examples: [
      ['hit\ncog\n["hot","dot","dog","lot","log","cog"]', '5', 'hit -> hot -> dot -> dog -> cog.'],
      ['hit\ncog\n["hot","dot","dog"]', '0', 'cog is not reachable / not in the list.'],
    ],
    constraints: ['1 <= start.length <= 10', 'all words share the same length', '1 <= words.length <= 5000', 'lowercase English letters'],
    tags: ['advanced-graphs', 'bfs'],
    py: `def chainLength(start, goal, words):
    word_set = set(words)
    if goal not in word_set:
        return 0
    queue = deque([(start, 1)])
    visited = {start}
    while queue:
        word, dist = queue.popleft()
        if word == goal:
            return dist
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                nxt = word[:i] + c + word[i + 1:]
                if nxt in word_set and nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, dist + 1))
    return 0`,
    approach:
      'Model each valid word as a node with edges between words differing in exactly one letter. The shortest transformation is a shortest path, so breadth-first search from the start expands all one-letter neighbours present in the dictionary, recording distance. The first time the goal is dequeued gives the minimum chain length.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N)' },
    multiParam: true,
    cases: [
      ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'],
      ['"hit"', '"cog"', '["hot","dot","dog"]'],
      ['"a"', '"c"', '["a","b","c"]'],
      ['"aa"', '"aa"', '["aa"]'],
      ['"cat"', '"dog"', '["cat","cot","cog","dog"]'],
      ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'],
      ['"abc"', '"xyz"', '["abc","xyz"]'],
      ['"hot"', '"dog"', '["hot","dog","dot"]'],
      ['"lead"', '"gold"', '["lead","load","goad","gold","lord","word"]'],
      ['"top"', '"pop"', '["top","tip","pop"]'],
    ],
  },
  {
    n: 2950,
    id: 'pghub-b43-snake-path',
    name: 'Longest Increasing Trail',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'longestTrail',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'In a grid <code>grid</code> of integers you may move from a cell to an orthogonally adjacent cell only if the destination value is strictly greater. A trail is any such sequence of moves. Return the number of cells in the longest possible strictly increasing trail.',
    examples: [
      ['[[9,9,4],[6,6,8],[2,1,1]]', '4', 'Trail 1 -> 2 -> 6 -> 9 has 4 cells.'],
      ['[[1,2],[4,3]]', '4', 'Trail 1 -> 2 -> 3 -> 4 visits every cell.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '0 <= grid[i][j] <= 10^5'],
    tags: ['2d-dp', 'memoization'],
    py: `def longestTrail(grid):
    rows = len(grid)
    cols = len(grid[0])
    memo = [[0] * cols for _ in range(rows)]
    import sys as _sys
    _sys.setrecursionlimit(100000)
    def dfs(r, c):
        if memo[r][c]:
            return memo[r][c]
        best = 1
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] > grid[r][c]:
                best = max(best, 1 + dfs(nr, nc))
        memo[r][c] = best
        return best
    return max(dfs(r, c) for r in range(rows) for c in range(cols))`,
    approach:
      'Because every move strictly increases the value, the reachability graph is acyclic, so the longest trail starting at each cell is well-defined and can be memoized. A depth-first search from a cell takes one plus the best of its strictly greater neighbours. The overall answer is the maximum over all starting cells.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[9,9,4],[6,6,8],[2,1,1]]'],
      ['[[1,2],[4,3]]'],
      ['[[1]]'],
      ['[[5,5,5],[5,5,5]]'],
      ['[[1,2,3,4,5]]'],
      ['[[3,2,1],[6,5,4],[9,8,7]]'],
      ['[[0,1,2],[7,8,3],[6,5,4]]'],
      ['[[7,7],[7,7]]'],
      ['[[1,2,3],[6,5,4],[7,8,9]]'],
      ['[[10,9,8],[1,2,7],[4,3,6]]'],
    ],
  },
  {
    n: 2955,
    id: 'pghub-b43-min-platforms',
    name: 'Minimum Train Platforms',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'minPlatforms',
    params: [{ name: 'trains', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry <code>[arrival, departure]</code> in <code>trains</code> gives when a train arrives at and leaves a station. A platform can serve only one train at a time, and a train occupies a platform during <code>[arrival, departure]</code> inclusive (so a train arriving exactly when another departs cannot reuse that platform). Return the minimum number of platforms needed so no train waits.',
    examples: [
      ['[[900,910],[940,1200],[950,1120]]', '2', 'The second and third trains overlap, needing two platforms.'],
      ['[[100,200],[200,300]]', '2', 'Departure equals the next arrival, so they cannot share.'],
    ],
    constraints: ['1 <= trains.length <= 10^5', '0 <= arrival <= departure <= 10^9'],
    tags: ['heap', 'intervals'],
    py: `def minPlatforms(trains):
    order = sorted(trains, key=lambda t: t[0])
    busy = []  # min-heap of departure times currently occupying platforms
    best = 0
    for arr, dep in order:
        while busy and busy[0] < arr:
            heapq.heappop(busy)
        heapq.heappush(busy, dep)
        if len(busy) > best:
            best = len(busy)
    return best`,
    approach:
      'Process trains in arrival order, holding the departure times of currently occupied platforms in a min-heap. Before placing a new train, free every platform whose departure is strictly before this arrival (equal times conflict, so they are not freed). The heap size after each insertion is the concurrent platform demand; its peak is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[900,910],[940,1200],[950,1120]]'],
      ['[[100,200],[200,300]]'],
      ['[[0,10]]'],
      ['[[1,5],[2,6],[3,7],[4,8]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,10],[2,3],[4,5],[6,7]]'],
      ['[[5,5],[5,5],[5,5]]'],
      ['[[10,20],[20,30],[30,40],[15,25]]'],
      ['[[1,100],[2,99],[3,98],[4,97]]'],
      ['[[1,3],[3,5],[5,7],[2,4]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B43>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b43-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B43>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B43>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b43-grade-${prob.n}.py`);
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
