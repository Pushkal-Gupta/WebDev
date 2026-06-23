#!/usr/bin/env node
// Batch 49 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3299,3308,3313,3322,3323,3328,3329,3338,3339,3344,3353,3358,3359,3368,3369
//
//   node scripts/fill-gap-problems-batch49.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch49.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch49.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3299, 3308, 3313, 3322, 3323, 3328, 3329, 3338, 3339, 3344, 3353, 3358, 3359, 3368, 3369];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
null = None
true = True
false = False
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 3299,
    id: 'pghub-b49-vowel-shift',
    name: 'Vowel-Shifted Word',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'shiftVowels',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a lowercase string <code>s</code>, replace every vowel (<code>a, e, i, o, u</code>) with the next vowel in the cyclic order <code>a -> e -> i -> o -> u -> a</code>, leaving all consonants unchanged. Return the resulting string.',
    examples: [
      ['hello', 'hillu', 'e advances to i and o advances to u.'],
      ['xyz', 'xyz', 'No vowels are present, so the string is unchanged.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'simulation'],
    py: `def shiftVowels(s):
    nxt = {'a': 'e', 'e': 'i', 'i': 'o', 'o': 'u', 'u': 'a'}
    return ''.join(nxt.get(c, c) for c in s)`,
    approach:
      'Build a map from each vowel to its cyclic successor, then map every character: vowels are translated through the table while consonants fall through unchanged. A single linear pass produces the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"programming"'],
      ['"xyz"'],
      ['"aeiou"'],
      ['"a"'],
      ['"hello"'],
      ['"banana"'],
      ['"rhythm"'],
      ['"queue"'],
      ['"education"'],
      ['"uuuuu"'],
    ],
  },
  {
    n: 3308,
    id: 'pghub-b49-altsum',
    name: 'Alternating Block Sum',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'blockSum',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You are given an integer array <code>nums</code> and a positive integer <code>k</code>. Split the array into consecutive blocks of length <code>k</code> (the final block may be shorter). Add the sum of every block at an even index (0-based) and subtract the sum of every block at an odd index. Return the final total.',
    examples: [
      ['[1,2,3,4,5], 2', '3', 'Blocks [1,2],[3,4],[5]. Total = (1+2) - (3+4) + 5 = 3.'],
      ['[10,20,30], 3', '60', 'A single block: 10+20+30 = 60.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '1 <= k <= nums.length'],
    tags: ['arrays', 'prefix-sum'],
    multiParam: true,
    py: `def blockSum(nums, k):
    total = 0
    for i in range(0, len(nums), k):
        block = sum(nums[i:i + k])
        if (i // k) % 2 == 0:
            total += block
        else:
            total -= block
    return total`,
    approach:
      'Walk the array in strides of k. Each stride defines one block; its block index is the start offset divided by k. Add the block sum when that index is even and subtract it when odd, accumulating the running total in one pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[10,20,30]', '3'],
      ['[5]', '1'],
      ['[1,1,1,1,1,1]', '1'],
      ['[-1,-2,-3,-4]', '2'],
      ['[4,4,4,4]', '4'],
      ['[2,3,5,7,11,13]', '3'],
      ['[100,-100,50]', '1'],
      ['[1,2,3,4,5,6,7]', '3'],
      ['[9,8,7,6,5,4,3,2,1]', '2'],
    ],
  },
  {
    n: 3313,
    id: 'pghub-b49-digit-spiral',
    name: 'Digital Persistence Length',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'persistence',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'The multiplicative persistence of a non-negative integer is the number of times you must replace the number by the product of its digits before reaching a single-digit value. Given <code>n</code>, return its multiplicative persistence.',
    examples: [
      ['39', '3', '39 -> 27 -> 14 -> 4, three steps.'],
      ['5', '0', 'Already a single digit, so zero steps.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math', 'simulation'],
    py: `def persistence(n):
    steps = 0
    while n >= 10:
        prod = 1
        for ch in str(n):
            prod *= int(ch)
        n = prod
        steps += 1
    return steps`,
    approach:
      'Repeatedly collapse the number into the product of its digits, counting each collapse, until a single digit remains. Because the product shrinks the magnitude quickly, only a handful of iterations are ever required.',
    complexity: { time: 'O(log n) per step, constant steps', space: 'O(1)' },
    cases: [
      ['39'],
      ['5'],
      ['0'],
      ['10'],
      ['999'],
      ['77'],
      ['25'],
      ['68'],
      ['277777788888899'],
      ['100'],
    ],
  },
  {
    n: 3322,
    id: 'pghub-b49-pair-target',
    name: 'Closest Sorted Pair Difference',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'closestPairSum',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You are given a <strong>sorted</strong> integer array <code>nums</code> and an integer <code>target</code>. Choose two distinct indices so their sum is as close to <code>target</code> as possible. Return that closest achievable sum; if two sums are equally close, return the smaller one.',
    examples: [
      ['[1,2,4,7], 6', '6', '2 + 4 = 6 hits the target exactly.'],
      ['[1,3,5], 9', '8', '3 + 5 = 8 is the closest, since 1+3=4 and 1+5=6 are farther.'],
    ],
    constraints: ['2 <= nums.length <= 10^5', 'nums is sorted in non-decreasing order', '-10^6 <= nums[i], target <= 10^6'],
    tags: ['two-pointers', 'arrays'],
    multiParam: true,
    py: `def closestPairSum(nums, target):
    lo, hi = 0, len(nums) - 1
    best = nums[0] + nums[1]
    while lo < hi:
        s = nums[lo] + nums[hi]
        if abs(s - target) < abs(best - target) or (abs(s - target) == abs(best - target) and s < best):
            best = s
        if s == target:
            return s
        elif s < target:
            lo += 1
        else:
            hi -= 1
    return best`,
    approach:
      'Because the array is sorted, sweep two pointers inward from both ends. Each pointer pair gives a candidate sum; keep the candidate that is closest to the target (breaking ties toward the smaller sum). Move the left pointer right when the sum is too small and the right pointer left when it is too large, halting on an exact hit.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,4,7]', '6'],
      ['[1,3,5]', '9'],
      ['[-3,-1,2,4]', '0'],
      ['[1,1,1,1]', '2'],
      ['[0,10]', '3'],
      ['[2,4,6,8,10]', '7'],
      ['[-5,-2,0,3,9]', '1'],
      ['[1,2,3,4,5]', '100'],
      ['[1,2,3,4,5]', '-100'],
      ['[10,20,30,40]', '55'],
    ],
  },
  {
    n: 3323,
    id: 'pghub-b49-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains the bracket characters <code>(</code>, <code>)</code>, <code>[</code>, <code>]</code>, <code>{</code>, <code>}</code> and possibly other characters. The brackets are guaranteed to form a valid, properly matched and nested sequence. Return the maximum nesting depth of any bracket.',
    examples: [
      ['a(b[c]d)e', '2', 'Inside ( ... ) we reach [ ... ], a depth of 2.'],
      ['x+y', '0', 'No brackets means depth 0.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 'brackets in s form a valid nested sequence'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(s):
    opens = set('([{')
    closes = set(')]}')
    depth = 0
    best = 0
    for c in s:
        if c in opens:
            depth += 1
            best = max(best, depth)
        elif c in closes:
            depth -= 1
    return best`,
    approach:
      'Scan the string while tracking the current open-bracket count as a running depth. Every opening bracket increments the depth (updating the best seen) and every closing bracket decrements it. Since the sequence is valid, the maximum value of this counter is the deepest nesting.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"a(b[c]d)e"'],
      ['"x+y"'],
      ['"((()))"'],
      ['"{[()]}"'],
      ['"()()()"'],
      ['"[{}([])]"'],
      ['"no brackets here"'],
      ['"(a(b(c(d))))"'],
      ['"[]{}()"'],
      ['"(((((())))))"'],
    ],
  },
  {
    n: 3328,
    id: 'pghub-b49-fuel-stops',
    name: 'Minimum Refuel Stops to Reach End',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minStops',
    params: [
      { name: 'fuel', type: 'List[int]' },
      { name: 'tank', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You travel along a line of stations <code>0..n-1</code>, starting at station <code>0</code> with a full tank holding <code>tank</code> units; moving from a station to the next consumes exactly 1 unit. Station <code>i</code> offers <code>fuel[i]</code> units that, if taken, refill your tank to full (capped at <code>tank</code>). Return the minimum number of refuels needed to reach the last station, or <code>-1</code> if it is impossible.',
    examples: [
      ['[0,0,4,0,0], 2', '1', 'Drive to station 2 (1 left), refuel to full there, then reach station 4.'],
      ['[0,0,0], 1', '-1', 'The tank empties before reaching station 1 and no station can help in time.'],
    ],
    constraints: ['1 <= fuel.length <= 10^4', '0 <= fuel[i] <= 10^4', '1 <= tank <= 10^4'],
    tags: ['greedy', 'heap'],
    multiParam: true,
    py: `def minStops(fuel, tank):
    n = len(fuel)
    pq = []
    cur = tank
    stops = 0
    for i in range(n):
        if i > 0:
            cur -= 1
        while cur < 0 and pq:
            cur += -heapq.heappop(pq)
            stops += 1
        if cur < 0:
            return -1
        if fuel[i] > 0:
            heapq.heappush(pq, -fuel[i])
    return stops`,
    approach:
      'Drive forward one station at a time, spending a unit of fuel per hop. Whenever the tank would go negative, retroactively "use" the largest fuel offer seen so far (kept in a max-heap), counting a stop, until the deficit is covered. If no offer can cover it, the trip is impossible; otherwise the heap-driven greedy uses the fewest possible refuels.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[0,0,4,0,0]', '2'],
      ['[0,0,0]', '1'],
      ['[5]', '1'],
      ['[0,3,0,3,0,0]', '2'],
      ['[10,0,0,0,0,0,0,0,0,0,0]', '5'],
      ['[0,1,1,1,1]', '1'],
      ['[0,0,0,0]', '4'],
      ['[2,0,2,0,2,0]', '3'],
      ['[0,0,0,9]', '2'],
      ['[3,0,0,0]', '2'],
    ],
  },
  {
    n: 3329,
    id: 'pghub-b49-distinct-window',
    name: 'Longest Window With At Most Two Distinct',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestTwoDistinct',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, return the length of the longest contiguous substring that contains at most two distinct characters.',
    examples: [
      ['eceba', '3', '"ece" uses only e and c, length 3.'],
      ['ccaabbb', '5', '"aabbb" uses a and b, length 5.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['sliding-window', 'hash-map'],
    py: `def longestTwoDistinct(s):
    counts = {}
    left = 0
    best = 0
    for right, c in enumerate(s):
        counts[c] = counts.get(c, 0) + 1
        while len(counts) > 2:
            d = s[left]
            counts[d] -= 1
            if counts[d] == 0:
                del counts[d]
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window with a character-count map. Expand the right edge each step; whenever more than two distinct characters appear, shrink from the left until only two remain. The widest valid window observed along the way is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"eceba"'],
      ['"ccaabbb"'],
      ['"a"'],
      ['"aaaaaa"'],
      ['"abcabcabc"'],
      ['"abaccc"'],
      ['"abababab"'],
      ['"zzzzyyyx"'],
      ['"abcdef"'],
      ['"aabbcc"'],
    ],
  },
  {
    n: 3338,
    id: 'pghub-b49-tiling-paths',
    name: 'Tiling Step Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'n', type: 'int' },
      { name: 'steps', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'You climb a staircase of <code>n</code> stairs. At each move you may climb any amount listed in <code>steps</code> (a list of allowed positive jump sizes). Return the number of distinct ordered ways to reach exactly stair <code>n</code>, taken modulo <code>1000000007</code>.',
    examples: [
      ['4, [1,2]', '5', 'The orderings of 1s and 2s summing to 4: (1+1+1+1),(1+1+2),(1+2+1),(2+1+1),(2+2).'],
      ['3, [2]', '0', 'Only 2-steps are allowed and they cannot reach an odd total.'],
    ],
    constraints: ['1 <= n <= 10^4', '1 <= steps.length <= 20', '1 <= steps[i] <= n', 'steps are distinct'],
    tags: ['dp', 'combinatorics'],
    multiParam: true,
    py: `def countWays(n, steps):
    MOD = 1000000007
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        total = 0
        for s in steps:
            if i - s >= 0:
                total += dp[i - s]
        dp[i] = total % MOD
    return dp[n]`,
    approach:
      'Let dp[i] be the number of ordered ways to reach stair i. Every way ends with some allowed step s, arriving from i-s, so dp[i] sums dp[i-s] over all valid steps. Fill the table from 0 to n, taking results modulo 1e9+7.',
    complexity: { time: 'O(n * |steps|)', space: 'O(n)' },
    cases: [
      ['4', '[1,2]'],
      ['3', '[2]'],
      ['5', '[1,3,5]'],
      ['1', '[1]'],
      ['10', '[1,2]'],
      ['7', '[1,2,3]'],
      ['6', '[2,3]'],
      ['8', '[4]'],
      ['12', '[1,2,4]'],
      ['20', '[3,5,7]'],
    ],
  },
  {
    n: 3339,
    id: 'pghub-b49-kth-merged',
    name: 'Kth Smallest Across Sorted Lists',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthSmallest',
    params: [
      { name: 'lists', type: 'List[List[int]]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You are given several individually sorted integer lists in <code>lists</code> and an integer <code>k</code>. Considering all elements merged together (keeping duplicates), return the <code>k</code>-th smallest value (1-indexed). It is guaranteed that the total element count is at least <code>k</code>.',
    examples: [
      ['[[1,4,7],[2,3,6]], 3', '3', 'Merged: 1,2,3,4,6,7; the 3rd is 3.'],
      ['[[5]], 1', '5', 'The single element is the 1st smallest.'],
    ],
    constraints: ['1 <= lists.length <= 10^3', '0 <= total elements <= 10^5', '1 <= k <= total elements', '-10^9 <= values <= 10^9'],
    tags: ['heap', 'merge'],
    multiParam: true,
    py: `def kthSmallest(lists, k):
    pq = []
    for li, lst in enumerate(lists):
        if lst:
            heapq.heappush(pq, (lst[0], li, 0))
    result = None
    for _ in range(k):
        val, li, idx = heapq.heappop(pq)
        result = val
        if idx + 1 < len(lists[li]):
            heapq.heappush(pq, (lists[li][idx + 1], li, idx + 1))
    return result`,
    approach:
      'Seed a min-heap with the head of every non-empty list. Pop the smallest k times; each pop yields the next element in global sorted order, and we push the successor from the same list. The k-th popped value is the answer, never materializing the full merge.',
    complexity: { time: 'O(k log L)', space: 'O(L)' },
    cases: [
      ['[[1,4,7],[2,3,6]]', '3'],
      ['[[5]]', '1'],
      ['[[1,2,3],[4,5,6]]', '5'],
      ['[[10],[20],[30]]', '2'],
      ['[[1,1,1],[1,1]]', '4'],
      ['[[-5,-1],[0,3]]', '1'],
      ['[[2,4,6,8]]', '3'],
      ['[[1],[2],[3],[4],[5]]', '5'],
      ['[[100,200],[150]]', '2'],
      ['[[1,3,5,7,9],[2,4,6,8,10]]', '10'],
    ],
  },
  {
    n: 3344,
    id: 'pghub-b49-min-speed',
    name: 'Minimum Eating Speed',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minSpeed',
    params: [
      { name: 'piles', type: 'List[int]' },
      { name: 'hours', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are stacks of items given by <code>piles</code> and a deadline of <code>hours</code> whole hours. At a chosen integer speed <code>v</code> per hour you process one pile each hour, consuming up to <code>v</code> items; if a pile has fewer than <code>v</code> left you still use the whole hour. Return the minimum integer speed that finishes every pile within <code>hours</code>. A valid speed always exists when <code>hours >= piles.length</code>.',
    examples: [
      ['[3,6,7,11], 8', '4', 'At speed 4 the piles take 1,2,2,3 = 8 hours.'],
      ['[30,11,23,4,20], 5', '30', 'Five piles in five hours forces one pile per hour, so speed must clear the largest.'],
    ],
    constraints: ['1 <= piles.length <= 10^4', 'piles.length <= hours <= 10^9', '1 <= piles[i] <= 10^9'],
    tags: ['binary-search', 'arrays'],
    multiParam: true,
    py: `def minSpeed(piles, hours):
    def hoursAt(v):
        return sum((p + v - 1) // v for p in piles)
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if hoursAt(mid) <= hours:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The total hours needed is monotonically non-increasing in speed, so binary-search the speed between 1 and the largest pile. For a candidate speed, sum the ceiling of each pile over the speed; if that fits the deadline, search lower, otherwise search higher. The lower bound converges to the minimum feasible speed.',
    complexity: { time: 'O(n log(max pile))', space: 'O(1)' },
    cases: [
      ['[3,6,7,11]', '8'],
      ['[30,11,23,4,20]', '5'],
      ['[30,11,23,4,20]', '6'],
      ['[1]', '1'],
      ['[1000000000]', '2'],
      ['[1,1,1,1]', '4'],
      ['[8,8,8]', '6'],
      ['[5,5,5,5,5]', '5'],
      ['[100,200,300]', '3'],
      ['[2,4,6,8,10]', '10'],
    ],
  },
  {
    n: 3353,
    id: 'pghub-b49-merge-busy',
    name: 'Total Busy Time After Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'busyTime',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'You are given a list of half-open time <code>intervals</code> as <code>[start, end)</code>. Overlapping or touching intervals describe a single continuous busy stretch. Return the total amount of time that is busy (the combined length after merging all overlaps).',
    examples: [
      ['[[1,3],[2,6],[8,10]]', '7', 'Merges to [1,6] (length 5) and [8,10] (length 2); total 7.'],
      ['[[1,4],[4,7]]', '6', 'Touching intervals merge into [1,7], length 6.'],
    ],
    constraints: ['1 <= intervals.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def busyTime(intervals):
    intervals = sorted(intervals)
    total = 0
    cs, ce = intervals[0]
    for s, e in intervals[1:]:
        if s <= ce:
            ce = max(ce, e)
        else:
            total += ce - cs
            cs, ce = s, e
    total += ce - cs
    return total`,
    approach:
      'Sort the intervals by start. Sweep through them maintaining one current merged interval: extend its end when the next interval starts at or before it, otherwise bank the current length and open a new interval. Adding the final interval gives the total busy time.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10]]'],
      ['[[1,4],[4,7]]'],
      ['[[5,10]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[0,10],[1,2],[3,4]]'],
      ['[[1,5],[2,3],[4,8],[10,12]]'],
      ['[[10,20],[5,15],[0,3]]'],
      ['[[1,100]]'],
      ['[[2,4],[1,3],[6,8],[7,9]]'],
      ['[[0,1],[1,2],[2,3],[3,4]]'],
    ],
  },
  {
    n: 3358,
    id: 'pghub-b49-xor-toggle',
    name: 'Single Unpaired Number',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'findSingle',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Every value in the integer array <code>nums</code> appears exactly twice except for one value that appears exactly once. Return that single unpaired value using only constant extra space.',
    examples: [
      ['[4,1,2,1,2]', '4', 'The 1s and 2s pair off, leaving 4.'],
      ['[7]', '7', 'A lone element is its own answer.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', 'nums.length is odd', '0 <= nums[i] <= 10^9', 'exactly one value appears once'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def findSingle(nums):
    acc = 0
    for x in nums:
        acc ^= x
    return acc`,
    approach:
      'XOR is associative and commutative, and any value XORed with itself is zero. Folding the whole array with XOR cancels every paired value and leaves only the element that appears once, using a single accumulator.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[4,1,2,1,2]'],
      ['[7]'],
      ['[1,1,9]'],
      ['[0,0,5]'],
      ['[10,20,10,30,20]'],
      ['[2,2,3,3,8]'],
      ['[100,100,1,2,2]'],
      ['[5,3,5,3,9]'],
      ['[6,6,7,7,1,1,42]'],
      ['[1000000,1000000,42]'],
    ],
  },
  {
    n: 3359,
    id: 'pghub-b49-color-island',
    name: 'Count Connected Color Regions',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countRegions',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a 2D integer <code>grid</code>, a region is a maximal group of cells sharing the same value, connected through up/down/left/right adjacency. Return the number of distinct regions in the grid.',
    examples: [
      ['[[1,1,2],[1,3,2]]', '3', 'The 1s form one region, the 2s another, and the single 3 a third.'],
      ['[[5]]', '1', 'A single cell is one region.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', '-10^9 <= grid[i][j] <= 10^9'],
    tags: ['graphs', 'flood-fill'],
    py: `def countRegions(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count = 0
    for r in range(rows):
        for c in range(cols):
            if seen[r][c]:
                continue
            count += 1
            val = grid[r][c]
            stack = [(r, c)]
            seen[r][c] = True
            while stack:
                cr, cc = stack.pop()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and grid[nr][nc] == val:
                        seen[nr][nc] = True
                        stack.append((nr, nc))
    return count`,
    approach:
      'Treat equal-valued, 4-adjacent cells as connected. Scan every cell; when an unvisited cell is found, start a new region and flood-fill it with an explicit stack, marking all reachable same-valued cells visited. The number of flood-fills started equals the region count.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,1,2],[1,3,2]]'],
      ['[[5]]'],
      ['[[1,2],[3,4]]'],
      ['[[7,7,7],[7,7,7]]'],
      ['[[1,2,1],[2,1,2],[1,2,1]]'],
      ['[[0,0,0,0]]'],
      ['[[1],[1],[2],[2],[1]]'],
      ['[[1,1,1],[2,2,1],[2,1,1]]'],
      ['[[9,8],[8,9],[9,8]]'],
      ['[[3,3,3,3],[3,1,1,3],[3,3,3,3]]'],
    ],
  },
  {
    n: 3368,
    id: 'pghub-b49-tree-levelmax',
    name: 'Largest Value In Each Tree Level',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'levelMaxes',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'A binary tree is given as a level-order array <code>root</code> where <code>null</code> marks a missing child (encode null as the JSON literal). Return a list giving the largest node value on each level, from the root level downward.',
    examples: [
      ['[1,3,2,5,3,null,9]', '[1,3,9]', 'Level maxima are 1, then max(3,2)=3, then max(5,3,9)=9.'],
      ['[10]', '[10]', 'A single node yields one level.'],
    ],
    constraints: ['1 <= number of nodes <= 10^4', '-10^9 <= node value <= 10^9'],
    tags: ['trees', 'bfs'],
    py: `def levelMaxes(root):
    if not root or root[0] is None:
        return []
    # Reconstruct the tree from its level-order array with explicit nulls.
    n = len(root)
    nodes = {0: root[0]}
    left = {}
    right = {}
    bfs = deque([0])
    i = 1
    while bfs and i < n:
        cur = bfs.popleft()
        if i < n:
            if root[i] is not None:
                lid = len(nodes)
                nodes[lid] = root[i]
                left[cur] = lid
                bfs.append(lid)
            i += 1
        if i < n:
            if root[i] is not None:
                rid = len(nodes)
                nodes[rid] = root[i]
                right[cur] = rid
                bfs.append(rid)
            i += 1
    result = []
    level = deque([0])
    while level:
        best = None
        for _ in range(len(level)):
            cur = level.popleft()
            v = nodes[cur]
            best = v if best is None else max(best, v)
            if cur in left:
                level.append(left[cur])
            if cur in right:
                level.append(right[cur])
        result.append(best)
    return result`,
    approach:
      'Reconstruct the tree from its level-order encoding, attaching non-null children in breadth-first order. Then run a level-order traversal, and for each level scan its nodes to capture the maximum value, appending one maximum per level to the result.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,3,2,5,3,null,9]'],
      ['[10]'],
      ['[1,2,3]'],
      ['[5,4,9,1,null,null,7]'],
      ['[0,-1,-2,-3]'],
      ['[100,50,200,25,75,150,300]'],
      ['[1,null,2,null,3]'],
      ['[7,7,7,7,7]'],
      ['[-5,-10,-3]'],
      ['[42,1,2,3,4,5,6,7,8]'],
    ],
  },
  {
    n: 3369,
    id: 'pghub-b49-subset-target',
    name: 'Subsets Summing To Target',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'countSubsets',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array of positive integers <code>nums</code> (values may repeat) and an integer <code>target</code>, return the number of distinct index-subsets whose elements sum exactly to <code>target</code>. Two subsets differing in which indices are chosen are counted separately even if their values match.',
    examples: [
      ['[1,2,2,3], 3', '3', 'Index pairs/sets summing to 3: {0,1}, {0,2}, and {3}.'],
      ['[5], 10', '0', 'No subset reaches 10.'],
    ],
    constraints: ['1 <= nums.length <= 20', '1 <= nums[i] <= 10^4', '1 <= target <= 10^6'],
    tags: ['backtracking', 'recursion'],
    multiParam: true,
    py: `def countSubsets(nums, target):
    count = 0
    n = len(nums)
    def dfs(i, remaining):
        nonlocal count
        if remaining == 0:
            count += 1
            return
        if i == n or remaining < 0:
            return
        dfs(i + 1, remaining - nums[i])
        dfs(i + 1, remaining)
    dfs(0, target)
    return count`,
    approach:
      'Depth-first search over each index deciding include-or-exclude. Track the remaining target; reaching exactly zero counts one valid subset, while overshooting or running out of elements prunes the branch. Because elements are positive, an overshoot can never recover, keeping the search bounded.',
    complexity: { time: 'O(2^n)', space: 'O(n)' },
    cases: [
      ['[1,2,2,3]', '3'],
      ['[5]', '10'],
      ['[1,1,1,1]', '2'],
      ['[2,4,6,8]', '10'],
      ['[3,3,3]', '6'],
      ['[1,2,3,4,5]', '5'],
      ['[10,20,30]', '40'],
      ['[1,1,1,1,1]', '3'],
      ['[7,7,7,7]', '14'],
      ['[1,2,4,8,16]', '15'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B49>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b49-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B49>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B49>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b49-grade-${prob.n}.py`);
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
