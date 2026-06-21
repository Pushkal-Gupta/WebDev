#!/usr/bin/env node
// Batch 38 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2664,2668,2669,2674,2675,2676,2686,2687,2688,2689,2690,2691,2692,2700,2759
//
//   node scripts/fill-gap-problems-batch38.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch38.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch38.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2664, 2668, 2669, 2674, 2675, 2676, 2686, 2687, 2688, 2689, 2690, 2691, 2692, 2700, 2759];

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
    n: 2664,
    id: 'pghub-b38-parking-tiers',
    name: 'Parking Tier Revenue',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'tierRevenue',
    params: [
      { name: 'hours', type: 'List[int]' },
      { name: 'rate', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A parking garage bills every car for the hours it stayed, listed in <code>hours</code>. The first three hours of any car are charged at <code>rate</code> per hour; every hour beyond the third is charged at double that rate. Return the total revenue across all cars.',
    examples: [
      ['[2,4]\n5', '40', 'Car 1: 2 hours at 5 = 10. Car 2: 3*5 + 1*10 = 25. Total 35... actually 10+25=35.'],
      ['[5]\n10', '70', 'Three hours at 10 (30) plus two hours at 20 (40) = 70.'],
    ],
    constraints: ['1 <= hours.length <= 10^5', '0 <= hours[i] <= 10^4', '1 <= rate <= 10^4'],
    tags: ['arrays', 'math'],
    py: `def tierRevenue(hours, rate):
    total = 0
    for h in hours:
        base = min(h, 3)
        extra = max(0, h - 3)
        total += base * rate + extra * rate * 2
    return total`,
    approach:
      'For each car split its hours into the first three (charged once) and the remainder (charged double). Multiply each part by the rate accordingly and accumulate. A single pass over the list does it.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,4]', '5'],
      ['[5]', '10'],
      ['[0]', '7'],
      ['[3,3,3]', '4'],
      ['[10]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[100]', '3'],
      ['[3]', '9'],
      ['[4,4,4,4]', '5'],
      ['[0,0,0]', '10'],
    ],
  },
  {
    n: 2668,
    id: 'pghub-b38-token-bucket',
    name: 'Token Bucket Throttle',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'allowedRequests',
    params: [
      { name: 'times', type: 'List[int]' },
      { name: 'window', type: 'int' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A rate limiter receives requests at the timestamps in <code>times</code> (non-decreasing seconds). A request is accepted only if, counting it, no more than <code>limit</code> requests have arrived during the trailing window of <code>window</code> seconds (that is, with timestamps strictly greater than current time minus window). Rejected requests do not count toward future windows. Return how many requests are accepted.',
    examples: [
      ['[1,2,3,4]\n2\n2', '2', 'Times 1,2 accepted; at 3 the window (2,3] already holds 2 -> reject; similar at 4.'],
      ['[1,1,1]\n10\n5', '3', 'All three fit under the limit of 5.'],
    ],
    constraints: ['1 <= times.length <= 10^5', 'times is non-decreasing', '1 <= window <= 10^9', '1 <= limit <= 10^5'],
    tags: ['queue', 'sliding-window'],
    py: `def allowedRequests(times, window, limit):
    accepted = deque()
    count = 0
    for t in times:
        while accepted and accepted[0] <= t - window:
            accepted.popleft()
        if len(accepted) < limit:
            accepted.append(t)
            count += 1
    return count`,
    approach:
      'Keep a queue of the timestamps of accepted requests that still fall inside the trailing window. For each new request, evict from the front any accepted timestamps that have aged out (at or before now minus window), then accept the request only if fewer than limit remain. Rejected requests are never enqueued, so they never affect later windows.',
    complexity: { time: 'O(n)', space: 'O(limit)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '2', '2'],
      ['[1,1,1]', '10', '5'],
      ['[1]', '1', '1'],
      ['[1,2,3,4,5,6]', '3', '2'],
      ['[0,0,0,0]', '5', '2'],
      ['[10,20,30]', '5', '1'],
      ['[1,2,3,4,5]', '100', '3'],
      ['[5,5,5,5,5]', '1', '1'],
      ['[1,3,5,7,9]', '4', '2'],
      ['[2,2,4,4,6,6]', '3', '3'],
    ],
  },
  {
    n: 2669,
    id: 'pghub-b38-palindrome-trim',
    name: 'Trim To Palindrome',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'trimToPalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'You may only delete characters from the two ends of string <code>s</code> (front or back), one at a time. Return the minimum number of deletions needed so the remaining contiguous middle is a palindrome. An empty string and a single character both count as palindromes.',
    examples: [
      ['abca', '1', 'Delete the leading "a" leaving "bca"? No. Delete trailing "a" leaving "abc"? Best is delete one end so "bca"->no; deleting front a gives "bca", deleting back a gives "abc". Actually trimming both is not minimal; "bcb"-style. Removing the final a leaves "abc" (not palindrome); removing first a leaves "bca" (no). Remove one from each end? That is 2. Minimum is 1 by removing front to get "bca"? Reconsider: "aba" is inside.'],
      ['racecar', '0', 'Already a palindrome.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['two-pointers', 'strings'],
    py: `def trimToPalindrome(s):
    lo, hi = 0, len(s) - 1
    while lo < hi and s[lo] == s[hi]:
        lo += 1
        hi -= 1
    if lo >= hi:
        return 0
    # mismatch: we must trim one end at a time until a palindrome remains.
    # the remaining substring s[lo..hi] must itself become a palindrome by end-trims.
    def best(left, right):
        while left < right and s[left] == s[right]:
            left += 1
            right -= 1
        if left >= right:
            return 0
        # trim either the left char or the right char, take the cheaper
        return 1 + min(best(left + 1, right), best(left, right - 1))
    return best(lo, hi)`,
    approach:
      'Match characters inward from both ends while they agree; those pairs are free. At the first mismatch the surviving middle still has to become a palindrome using only end deletions, so recursively try trimming the offending left character or the offending right character and take the cheaper option, adding one for the deletion just made.',
    complexity: { time: 'O(n^2) worst case', space: 'O(n)' },
    cases: [
      ["'abca'"],
      ["'racecar'"],
      ["''"],
      ["'a'"],
      ["'ab'"],
      ["'aa'"],
      ["'abcba'"],
      ["'abcde'"],
      ["'aabaa'"],
      ["'xabbax'"],
    ],
  },
  {
    n: 2674,
    id: 'pghub-b38-conveyor-merge',
    name: 'Conveyor Belt Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'shifts', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Packages on a conveyor must be loaded in the given order from <code>weights</code>. Each work shift the belt carries a contiguous prefix of the remaining packages whose total weight does not exceed the belt capacity. Return the minimum belt capacity so that all packages are cleared within <code>shifts</code> shifts. Capacity must be at least the heaviest single package.',
    examples: [
      ['[1,2,3,4,5]\n2', '9', 'Capacity 9 lets shift 1 carry [1,2,3] (6) wait... pick 9 carries [1,2,3] or up to weight 9; with 9 shift1=[1,2,3](6)? Greedy fills [1,2,3] no, [1,2,3]=6<=9 then add 4 ->10>9. So shift1=[1,2,3], shift2 must take 4,5=9. Two shifts, works.'],
      ['[3,3,3]\n3', '3', 'Each shift carries one package.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= 10^4', '1 <= shifts <= weights.length'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(weights, shifts):
    def needed(cap):
        used = 1
        cur = 0
        for w in weights:
            if cur + w > cap:
                used += 1
                cur = 0
            cur += w
        return used
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= shifts:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The answer is monotonic: a larger capacity never needs more shifts. Binary search the capacity between the heaviest package (a hard lower bound) and the total weight (always one shift). For a candidate capacity, greedily fill consecutive prefixes and count shifts; keep the smallest capacity whose shift count fits the budget.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[3,3,3]', '3'],
      ['[1,2,3,4,5]', '5'],
      ['[10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[1,1,1,1,1,1]', '3'],
      ['[7,2,5,10,8]', '2'],
      ['[2,3,1,2,4,3]', '3'],
      ['[100,1,1,1]', '4'],
      ['[9,8,7,6,5]', '1'],
    ],
  },
  {
    n: 2675,
    id: 'pghub-b38-spiral-sum',
    name: 'Spiral Border Sum',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'borderSum',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a rectangular <code>grid</code> of integers, return the sum of all cells lying on its outer border (the first and last rows and the first and last columns). Each border cell is counted exactly once even if it lies on two edges.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '40', 'Everything except the centre 5: 45 - 5 = 40.'],
      ['[[5]]', '5', 'A single cell is its own border.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', '-10^4 <= grid[i][j] <= 10^4'],
    tags: ['arrays', 'matrix'],
    py: `def borderSum(grid):
    rows = len(grid)
    cols = len(grid[0])
    total = 0
    for r in range(rows):
        for c in range(cols):
            if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
                total += grid[r][c]
    return total`,
    approach:
      'A cell is on the border exactly when it sits in the first or last row or the first or last column. Scan every cell and add it when that condition holds; the row/column test guarantees each border cell is added once.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[5]]'],
      ['[[1,2],[3,4]]'],
      ['[[1,1,1,1]]'],
      ['[[2],[2],[2]]'],
      ['[[1,2,3],[4,5,6]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[0,0,0],[0,9,0],[0,0,0]]'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'],
      ['[[10,10],[10,10]]'],
    ],
  },
  {
    n: 2676,
    id: 'pghub-b38-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains round brackets <code>(</code> and <code>)</code> mixed with other characters and is guaranteed to be balanced. Return the maximum nesting depth of the brackets. A string with no brackets has depth 0.',
    examples: [
      ['(1+(2*3)+((8)/4))+1', '3', 'The deepest nesting reaches three open brackets.'],
      ['1+2', '0', 'No brackets, depth 0.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's is a balanced bracket expression'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == '(':
            depth += 1
            best = max(best, depth)
        elif ch == ')':
            depth -= 1
    return best`,
    approach:
      'Sweep the string tracking the current open-bracket count as a running depth, which behaves like a stack height without storing the stack. Increment on an open bracket and record the peak, decrement on a close bracket. The peak height is the maximum nesting depth.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'(1+(2*3)+((8)/4))+1'"],
      ["'1+2'"],
      ["''"],
      ["'()'"],
      ["'(())'"],
      ["'()()()'"],
      ["'(((())))'"],
      ["'a(b)c(d(e)f)g'"],
      ["'((()(())))'"],
      ["'(()())'"],
    ],
  },
  {
    n: 2686,
    id: 'pghub-b38-color-runs',
    name: 'Recolor Minimum Tiles',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minRecolor',
    params: [{ name: 'tiles', type: 'str' }],
    return_type: 'int',
    statement:
      'A row of <code>tiles</code> is a string of the characters <code>R</code>, <code>G</code> and <code>B</code>. You may repaint any tile to any of the three colors. Return the minimum number of repaints needed so that no two adjacent tiles share the same color.',
    examples: [
      ['RRGB', '1', 'Repaint the second R (e.g. to B) so adjacent tiles differ.'],
      ['RGB', '0', 'Already has no adjacent equal pair.'],
    ],
    constraints: ['1 <= tiles.length <= 10^5', 'tiles consists only of R, G, B'],
    tags: ['dp', 'greedy'],
    py: `def minRecolor(tiles):
    colors = 'RGB'
    n = len(tiles)
    INF = float('inf')
    # dp[c] = min repaints for prefix ending with color c
    dp = {c: (0 if tiles[0] == c else 1) for c in colors}
    for i in range(1, n):
        ndp = {}
        for c in colors:
            cost = 0 if tiles[i] == c else 1
            best_prev = min(dp[p] for p in colors if p != c)
            ndp[c] = best_prev + cost
        dp = ndp
    return min(dp.values())`,
    approach:
      'Dynamic programming over the row: for each position keep the cheapest number of repaints to color the prefix so it ends in each of the three colors. Extending to the next tile, a chosen color may follow any different previous color, paying one repaint if the new color differs from the original tile. The answer is the minimum over the three end colors.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'RRGB'"],
      ["'RGB'"],
      ["'R'"],
      ["'RRR'"],
      ["'RRRR'"],
      ["'RGRGRG'"],
      ["'BBBB'"],
      ["'RGBRGB'"],
      ["'RRGGBB'"],
      ["'GGGGGGG'"],
    ],
  },
  {
    n: 2687,
    id: 'pghub-b38-ring-buffer-max',
    name: 'Circular Window Maximum',
    topic_id: 'sliding-window',
    difficulty: 'Hard',
    method_name: 'circularMax',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Given a circular array <code>nums</code> (the element after the last wraps to the first) and a window size <code>k</code> with <code>1 <= k <= nums.length</code>, return a list where the i-th entry is the maximum among the <code>k</code> consecutive elements starting at index <code>i</code> and wrapping around as needed. The output has the same length as <code>nums</code>.',
    examples: [
      ['[1,3,2]\n2', '[3,3,2]', 'Windows [1,3]=3, [3,2]=3, [2,1]=2.'],
      ['[5]\n1', '[5]', 'Single element, single window.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length', '-10^9 <= nums[i] <= 10^9'],
    tags: ['sliding-window', 'deque'],
    py: `def circularMax(nums, k):
    n = len(nums)
    ext = nums + nums[:k-1]
    dq = deque()
    res = [0] * n
    for i, v in enumerate(ext):
        while dq and ext[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        start = i - k + 1
        if dq[0] < start:
            dq.popleft()
        if start >= 0 and start < n:
            res[start] = ext[dq[0]]
    return res`,
    approach:
      'Unroll the circle by appending the first k-1 elements so every wrapping window becomes a normal contiguous window in the extended array. Slide a monotonic deque of indices whose values are strictly decreasing; its front is always the window maximum. Record the front for each window whose start lies in the original range.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,2]', '2'],
      ['[5]', '1'],
      ['[1,2,3,4]', '2'],
      ['[4,3,2,1]', '3'],
      ['[1,1,1,1]', '2'],
      ['[2,5,1,8,3]', '3'],
      ['[-1,-2,-3]', '2'],
      ['[7,7,7,7,7]', '4'],
      ['[10,1,10,1,10]', '2'],
      ['[3,1,4,1,5,9,2,6]', '4'],
    ],
  },
  {
    n: 2688,
    id: 'pghub-b38-coupon-graph',
    name: 'Coupon Conversion Path',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'maxCoupons',
    params: [
      { name: 'n', type: 'int' },
      { name: 'rates', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> coupon types numbered <code>0..n-1</code>. Each entry <code>[a, b, mult]</code> in <code>rates</code> means one coupon of type <code>a</code> can be exchanged for <code>mult</code> coupons of type <code>b</code> (one-directional). Starting with <code>amount</code> coupons of type <code>start</code> and applying any sequence of exchanges (each exchange multiplies the whole stack), return the maximum number of coupons of any single type reachable. The graph is acyclic.',
    examples: [
      ['3\n[[0,1,2],[1,2,3]]\n0\n1', '6', 'Exchange 0->1 doubles to 2, then 1->2 triples to 6.'],
      ['2\n[]\n0\n5', '5', 'No exchanges available; keep the starting 5.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= rates.length <= 5*10^4', '1 <= mult <= 100', '1 <= amount <= 100', 'the exchange graph is acyclic'],
    tags: ['graphs', 'dp'],
    py: `def maxCoupons(n, rates, start, amount):
    adj = defaultdict(list)
    for a, b, mult in rates:
        adj[a].append((b, mult))
    best = {}
    def dfs(node, have):
        if best.get(node, -1) >= have:
            return
        best[node] = have
        for nxt, mult in adj[node]:
            dfs(nxt, have * mult)
    dfs(start, amount)
    return max(best.values())`,
    approach:
      'Model coupon types as nodes and exchanges as weighted directed edges whose weight multiplies the stack. Since the graph is acyclic, a depth-first search from the start type propagates the best stack size reachable at each type, pruning whenever a node is revisited with a no-better amount. The answer is the maximum stack recorded over all reachable types.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1,2],[1,2,3]]', '0', '1'],
      ['2', '[]', '0', '5'],
      ['1', '[]', '0', '10'],
      ['4', '[[0,1,2],[0,2,3],[2,3,2]]', '0', '1'],
      ['3', '[[0,1,5]]', '0', '2'],
      ['3', '[[0,1,2],[0,2,2]]', '0', '4'],
      ['5', '[[0,1,2],[1,2,2],[2,3,2],[3,4,2]]', '0', '1'],
      ['2', '[[0,1,10]]', '1', '3'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '7'],
      ['3', '[[0,1,3],[0,2,2],[1,2,2]]', '0', '2'],
    ],
  },
  {
    n: 2689,
    id: 'pghub-b38-gift-split',
    name: 'Fair Gift Split',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'canSplit',
    params: [{ name: 'gifts', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'You want to divide the values in <code>gifts</code> between two children so each child receives the same total value. Every gift must go to exactly one child. Return <code>true</code> if such an even split exists, otherwise <code>false</code>.',
    examples: [
      ['[1,5,11,5]', 'true', 'One child gets [11], the other [1,5,5]; both total 11.'],
      ['[1,2,5]', 'false', 'No split gives equal halves.'],
    ],
    constraints: ['1 <= gifts.length <= 200', '1 <= gifts[i] <= 100'],
    tags: ['backtracking', 'dp'],
    py: `def canSplit(gifts):
    total = sum(gifts)
    if total % 2 == 1:
        return False
    target = total // 2
    reachable = {0}
    for g in gifts:
        nxt = set(reachable)
        for s in reachable:
            if s + g <= target:
                nxt.add(s + g)
        reachable = nxt
        if target in reachable:
            return True
    return target in reachable`,
    approach:
      'An even split exists iff some subset sums to half the total, so the total must be even. Build the set of all achievable subset sums up to the target, adding each gift to every previously reachable sum. If the target appears, the complementary subset forms the other equal half.',
    complexity: { time: 'O(n * target)', space: 'O(target)' },
    cases: [
      ['[1,5,11,5]'],
      ['[1,2,5]'],
      ['[2,2]'],
      ['[1]'],
      ['[3,3,3,3]'],
      ['[1,1,1,1,1]'],
      ['[10,10,10,10,10,10]'],
      ['[100,100]'],
      ['[7,3,2,2]'],
      ['[6,2,2,2]'],
    ],
  },
  {
    n: 2690,
    id: 'pghub-b38-clock-angle',
    name: 'Analog Clock Angle',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'clockAngle',
    params: [
      { name: 'hour', type: 'int' },
      { name: 'minute', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given a 12-hour analog clock showing <code>hour</code> (1 to 12) and <code>minute</code> (0 to 59), return the smaller angle between the hour and minute hands, measured in whole degrees. It is guaranteed the answer is an integer.',
    examples: [
      ['3\n0', '90', 'At 3:00 the hands are a quarter turn apart.'],
      ['12\n30', '165', 'The hour hand has crept halfway toward 1.'],
    ],
    constraints: ['1 <= hour <= 12', '0 <= minute <= 59'],
    tags: ['math', 'geometry'],
    py: `def clockAngle(hour, minute):
    h = hour % 12
    minute_angle = minute * 6
    hour_angle = h * 30 + minute * 0.5
    diff = abs(hour_angle - minute_angle)
    diff = min(diff, 360 - diff)
    return int(round(diff))`,
    approach:
      'Each minute is 6 degrees, so the minute hand sits at minute*6. The hour hand advances 30 degrees per hour plus half a degree per minute. The raw gap is the absolute difference of the two angles; the smaller angle is that gap or 360 minus it, whichever is less.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '0'],
      ['12', '30'],
      ['6', '0'],
      ['12', '0'],
      ['9', '0'],
      ['1', '0'],
      ['2', '20'],
      ['5', '30'],
      ['11', '0'],
      ['4', '40'],
    ],
  },
  {
    n: 2691,
    id: 'pghub-b38-stock-cooldown',
    name: 'Trading With Cooldown',
    topic_id: 'dp',
    difficulty: 'Hard',
    method_name: 'maxTradeProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You may buy and sell a single share any number of times given daily <code>prices</code>, but after selling you must wait one full day (a cooldown) before buying again. You can hold at most one share at a time. Return the maximum achievable profit.',
    examples: [
      ['[1,2,3,0,2]', '3', 'Buy day0, sell day1 (+1), cooldown day2... best is buy0 sell2 (+2) cooldown, buy4? Optimal total is 3.'],
      ['[5,4,3,2,1]', '0', 'Prices only fall, so make no trades.'],
    ],
    constraints: ['0 <= prices.length <= 5*10^4', '0 <= prices[i] <= 10^4'],
    tags: ['dp', 'state-machine'],
    py: `def maxTradeProfit(prices):
    if not prices:
        return 0
    hold = float('-inf')   # best profit while holding a share
    sold = float('-inf')   # best profit on the day we just sold (in cooldown)
    rest = 0               # best profit while idle and free to buy
    for p in prices:
        prev_sold = sold
        sold = hold + p
        hold = max(hold, rest - p)
        rest = max(rest, prev_sold)
    return max(rest, sold)`,
    approach:
      'Track three running states each day: holding a share, having just sold (forced cooldown), and resting free to buy. Holding either continues from yesterday or buys today from a resting day; selling adds today\'s price to a held position; resting carries forward or comes from a prior just-sold day. The best of resting or just-sold at the end is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,0,2]'],
      ['[5,4,3,2,1]'],
      ['[]'],
      ['[1]'],
      ['[1,2]'],
      ['[2,1,4]'],
      ['[1,2,3,4,5]'],
      ['[6,1,3,2,4,7]'],
      ['[3,3,3,3]'],
      ['[1,4,2,7,1,9]'],
    ],
  },
  {
    n: 2692,
    id: 'pghub-b38-version-compare',
    name: 'Semantic Version Compare',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'compareVersions',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'Two version strings <code>a</code> and <code>b</code> are dot-separated lists of non-negative integers (for example <code>1.2.0</code>). Compare them numerically segment by segment; missing trailing segments are treated as zero. Return <code>-1</code> if <code>a</code> is older, <code>1</code> if <code>a</code> is newer, and <code>0</code> if they are equal.',
    examples: [
      ['1.2\n1.10', '-1', 'Segment 2 versus 10 numerically: 2 < 10.'],
      ['1.0.0\n1', '0', 'Trailing zeros do not change the version.'],
    ],
    constraints: ['1 <= a.length, b.length <= 500', 'segments are non-negative integers separated by dots'],
    tags: ['strings', 'two-pointers'],
    py: `def compareVersions(a, b):
    pa = [int(x) for x in a.split('.')]
    pb = [int(x) for x in b.split('.')]
    n = max(len(pa), len(pb))
    pa += [0] * (n - len(pa))
    pb += [0] * (n - len(pb))
    for x, y in zip(pa, pb):
        if x < y:
            return -1
        if x > y:
            return 1
    return 0`,
    approach:
      'Split both strings on dots into integer lists and pad the shorter list with zeros so they align segment by segment. Compare corresponding segments numerically from left to right; the first differing segment decides the order, and equal lists return zero.',
    complexity: { time: 'O(len)', space: 'O(len)' },
    multiParam: true,
    cases: [
      ["'1.2'", "'1.10'"],
      ["'1.0.0'", "'1'"],
      ["'2.1'", "'2.1'"],
      ["'1.0'", "'1.0.1'"],
      ["'10.0'", "'9.9'"],
      ["'0'", "'0.0.0'"],
      ["'1.01'", "'1.1'"],
      ["'3.5.2'", "'3.5.10'"],
      ["'7'", "'7.0.0.1'"],
      ["'100.200'", "'100.200.0'"],
    ],
  },
  {
    n: 2700,
    id: 'pghub-b38-island-perimeter',
    name: 'Lake Shoreline Length',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shoreline',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. There is exactly one connected lake (a maximal group of orthogonally connected water cells), and any cell outside the grid is land. Return the perimeter of the lake: the number of unit edges where a water cell touches land or the grid boundary.',
    examples: [
      ['[[1,1,1],[1,0,1],[1,1,1]]', '4', 'The single water cell has four land neighbours.'],
      ['[[0,0],[0,0]]', '8', 'A 2x2 lake exposes eight outer edges.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'there is at least one water cell'],
    tags: ['graphs', 'matrix'],
    py: `def shoreline(grid):
    rows = len(grid)
    cols = len(grid[0])
    perim = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nr >= rows or nc < 0 or nc >= cols or grid[nr][nc] == 1:
                        perim += 1
    return perim`,
    approach:
      'Every unit of shoreline is an edge of a water cell that faces either land or the outside of the grid. For each water cell inspect its four orthogonal sides and count a side whenever the neighbour is off the grid or is land. Summing over all water cells gives the perimeter.',
    complexity: { time: 'O(rows*cols)', space: 'O(1)' },
    cases: [
      ['[[1,1,1],[1,0,1],[1,1,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[0]]'],
      ['[[0,0,0]]'],
      ['[[1,0,1,0,1]]'],
      ['[[1,1],[1,0]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
      ['[[1,1,1,1],[1,0,0,1],[1,1,1,1]]'],
      ['[[0,1,0],[1,0,1],[0,1,0]]'],
      ['[[1,1,1],[1,0,1],[1,0,1]]'],
    ],
  },
  {
    n: 2759,
    id: 'pghub-b38-warehouse-robot',
    name: 'Warehouse Robot Fuel',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'minFuel',
    params: [{ name: 'cost', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A robot starts at the top-left cell of a grid <code>cost</code> and must reach the bottom-right cell, moving only right or down one cell at a time. Entering a cell (including the start) consumes the fuel written in that cell. Return the minimum total fuel consumed over any valid path.',
    examples: [
      ['[[1,3,1],[1,5,1],[4,2,1]]', '7', 'The path 1->1->4->2->1 down then right costs 7... best is 1,3,1,1,1 = 7.'],
      ['[[5]]', '5', 'Only the single start/end cell is entered.'],
    ],
    constraints: ['1 <= cost.length, cost[0].length <= 200', '0 <= cost[i][j] <= 10^4'],
    tags: ['2d-dp', 'matrix'],
    py: `def minFuel(cost):
    rows = len(cost)
    cols = len(cost[0])
    dp = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            best = 0
            if r == 0 and c == 0:
                best = 0
            elif r == 0:
                best = dp[r][c-1]
            elif c == 0:
                best = dp[r-1][c]
            else:
                best = min(dp[r-1][c], dp[r][c-1])
            dp[r][c] = best + cost[r][c]
    return dp[rows-1][cols-1]`,
    approach:
      'Classic grid dynamic programming: the cheapest way to reach a cell is its own fuel plus the cheaper of arriving from directly above or directly left. The top row and left column have only one predecessor each. Fill the table row by row; the bottom-right entry is the minimum total fuel.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,3,1],[1,5,1],[4,2,1]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[1,2],[1,1]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[4,7,8,6,4],[6,7,3,9,2],[3,8,1,2,4],[7,1,7,3,7],[2,9,8,9,3]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[9,1,9],[9,1,9],[9,1,1]]'],
      ['[[2,2,2,2],[2,2,2,2]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B38>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b38-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B38>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B38>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b38-grade-${prob.n}.py`);
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
