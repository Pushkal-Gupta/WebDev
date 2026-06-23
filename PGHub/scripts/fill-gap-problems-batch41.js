#!/usr/bin/env node
// Batch 41 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2964,2969,2978,2979,2984,2985,2986,2987,2988,2989,2990,2991,2992,2993,2994
//
//   node scripts/fill-gap-problems-batch41.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch41.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch41.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2964, 2969, 2978, 2979, 2984, 2985, 2986, 2987, 2988, 2989, 2990, 2991, 2992, 2993, 2994];

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
    n: 2964,
    id: 'pghub-b41-shelf-weight-cap',
    name: 'Shelf Weight Capacity',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'heaviestUnder',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A set of boxes has the given <code>weights</code>. A shelf can hold any single box whose weight is at most <code>cap</code>. Return the weight of the heaviest box that fits on the shelf, or <code>-1</code> if no box fits.',
    examples: [
      ['[3,9,5,2]\n6', '5', 'Boxes weighing 3, 5 and 2 fit; the heaviest is 5.'],
      ['[10,12]\n4', '-1', 'No box is light enough.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= 10^9', '1 <= cap <= 10^9'],
    tags: ['arrays', 'math'],
    py: `def heaviestUnder(weights, cap):
    best = -1
    for w in weights:
        if w <= cap and w > best:
            best = w
    return best`,
    approach:
      'Scan every box once, ignoring any whose weight exceeds the capacity. Among those that fit, track the largest weight seen so far. If no box ever fits, the tracked value stays at its initial sentinel and minus one is returned.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,9,5,2]', '6'],
      ['[10,12]', '4'],
      ['[5]', '5'],
      ['[5]', '4'],
      ['[1,1,1]', '1'],
      ['[7,3,8,2,8]', '8'],
      ['[100,50,25]', '60'],
      ['[1000000000]', '1000000000'],
      ['[2,4,6,8,10]', '7'],
      ['[9,9,9]', '8'],
    ],
  },
  {
    n: 2969,
    id: 'pghub-b41-vowel-shift',
    name: 'Vowel Shift Cipher',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'shiftVowels',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a lowercase string <code>s</code>, replace every vowel (a, e, i, o, u) with the next vowel in the cyclic order a→e→i→o→u→a, leaving all other characters unchanged. Return the transformed string.',
    examples: [
      ['cat', 'cet', 'The vowel a becomes e.'],
      ['queue', 'qaiai', 'u to a, e to i, u to a, e to i; consonant q stays.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'simulation'],
    py: `def shiftVowels(s):
    nxt = {'a': 'e', 'e': 'i', 'i': 'o', 'o': 'u', 'u': 'a'}
    return ''.join(nxt.get(ch, ch) for ch in s)`,
    approach:
      'Build a fixed map from each vowel to the vowel that follows it in the cyclic a-e-i-o-u order, with u wrapping back to a. Walk the string once, substituting through the map when a character is a vowel and passing every other character through untouched.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'cat'"],
      ["'queue'"],
      ["'xyz'"],
      ["'aeiou'"],
      ["'a'"],
      ["'hello'"],
      ["'programming'"],
      ["'bcdfg'"],
      ["'uuuu'"],
      ["'education'"],
    ],
  },
  {
    n: 2978,
    id: 'pghub-b41-toll-booth-balance',
    name: 'Toll Booth Net Balance',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'canBalance',
    params: [{ name: 'flows', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'A row of toll booths records signed net car <code>flows</code> (positive means inbound, negative outbound). Return <code>true</code> if there exists a split point such that the sum of flows strictly to the left of it equals the sum of flows from that point onward, otherwise <code>false</code>. The split may be taken at any index from 0 to the array length.',
    examples: [
      ['[1,2,3,3,3]', 'true', 'Splitting after index 2 gives left 1+2+3=6 and right 3+3=6.'],
      ['[1,2]', 'false', 'No split point makes the two sides equal.'],
    ],
    constraints: ['1 <= flows.length <= 10^5', '-10^4 <= flows[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def canBalance(flows):
    total = sum(flows)
    left = 0
    if left * 2 == total:
        return True
    for x in flows:
        left += x
        if left * 2 == total:
            return True
    return False`,
    approach:
      'A split at some index balances when the running prefix sum equals exactly half the total, which is the same as twice the prefix equalling the total. Scan once accumulating the prefix sum, checking the empty-prefix case first and then after each element; any match means a valid split exists.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,3,3]'],
      ['[1,2]'],
      ['[0]'],
      ['[5,-5]'],
      ['[2,2,2,2]'],
      ['[1,-1,1,-1]'],
      ['[10]'],
      ['[3,1,2,2,2]'],
      ['[-2,-2,-4]'],
      ['[7,7]'],
    ],
  },
  {
    n: 2979,
    id: 'pghub-b41-conveyor-merge',
    name: 'Merge Sorted Conveyors',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'mergeConveyors',
    params: [{ name: 'belts', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'Several conveyor <code>belts</code> each deliver items in non-decreasing order of weight. Merge all belts into a single non-decreasing sequence of weights and return it.',
    examples: [
      ['[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', 'All items sorted together.'],
      ['[[]]', '[]', 'A single empty belt yields nothing.'],
    ],
    constraints: ['1 <= belts.length <= 10^4', '0 <= total items <= 10^5', '-10^9 <= weight <= 10^9'],
    tags: ['heap', 'linkedlist'],
    py: `def mergeConveyors(belts):
    heap = []
    for bi, belt in enumerate(belts):
        if belt:
            heapq.heappush(heap, (belt[0], bi, 0))
    out = []
    while heap:
        val, bi, idx = heapq.heappop(heap)
        out.append(val)
        if idx + 1 < len(belts[bi]):
            heapq.heappush(heap, (belts[bi][idx + 1], bi, idx + 1))
    return out`,
    approach:
      'Seed a min-heap with the first item of every non-empty belt, tagged by which belt and position it came from. Repeatedly pop the smallest, append it to the output, and push the next item from the same belt. Because each belt is already sorted, the heap always holds the global next-smallest candidate.',
    complexity: { time: 'O(N log k)', space: 'O(k)' },
    cases: [
      ['[[1,4,5],[1,3,4],[2,6]]'],
      ['[[]]'],
      ['[[1],[2],[3]]'],
      ['[[5,5,5],[5,5]]'],
      ['[[-3,0,7]]'],
      ['[[],[1,2],[]]'],
      ['[[10,20,30],[15,25,35]]'],
      ['[[1,1,1,1]]'],
      ['[[-9,-1],[-5,0],[2]]'],
      ['[[100],[1],[50]]'],
    ],
  },
  {
    n: 2984,
    id: 'pghub-b41-garden-water-days',
    name: 'Garden Watering Days',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minRate',
    params: [
      { name: 'plants', type: 'List[int]' },
      { name: 'days', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A gardener must water all <code>plants</code>, where <code>plants[i]</code> is the litres plant i needs. Each day the gardener picks an hourly rate r and waters exactly one plant, taking ceil(plants[i] / r) hours, but spends a whole day on that plant regardless. With only <code>days</code> days available (days is at least the number of plants), find the minimum integer rate r such that every plant can be fully watered, where the total hours across all plants must not exceed <code>days</code> times 8. Return that minimum rate r.',
    examples: [
      ['[8,16,24]\n3', '8', 'At rate 8 the hours are 1,2,3 summing to 6, within 3*8=24.'],
      ['[100]\n1', '13', 'ceil(100/13)=8 hours fits in one 8-hour day; rate 12 needs 9 hours.'],
    ],
    constraints: ['1 <= plants.length <= 10^4', '1 <= plants[i] <= 10^9', 'plants.length <= days <= 10^4'],
    tags: ['binary-search', 'greedy'],
    py: `def minRate(plants, days):
    budget = days * 8
    def hours(r):
        return sum((p + r - 1) // r for p in plants)
    lo, hi = 1, max(plants)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours(mid) <= budget:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The total watering hours is a non-increasing function of the rate, so the feasibility "hours within budget" is monotone and binary-searchable. Search the rate between one and the largest plant requirement; for each candidate sum the ceiling-division hours and move the bounds toward the smallest rate that keeps the total within the eight-hours-per-day budget.',
    complexity: { time: 'O(n log(max))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[8,16,24]', '3'],
      ['[100]', '1'],
      ['[1,1,1]', '3'],
      ['[1000000000]', '10000'],
      ['[5,5,5,5]', '4'],
      ['[3,6,7,11]', '5'],
      ['[2]', '1'],
      ['[10,10,10]', '3'],
      ['[7,7,7,7,7]', '5'],
      ['[1,2,3,4,5]', '6'],
    ],
  },
  {
    n: 2985,
    id: 'pghub-b41-island-cluster-count',
    name: 'Count Field Clusters',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countClusters',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A field is a <code>grid</code> of 0s and 1s where 1 marks a planted cell. Two planted cells belong to the same cluster if they are vertically or horizontally adjacent. Return the number of distinct clusters of planted cells.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'One connected L-shape and one isolated cell.'],
      ['[[0,0],[0,0]]', '0', 'Nothing is planted.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'dfs'],
    py: `def countClusters(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
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
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
    return count`,
    approach:
      'Treat each planted cell as a graph node connected to its four orthogonal neighbours. Walk every cell; when an unvisited planted cell is found, start a depth-first flood that marks its whole connected component as seen, and count that as one new cluster. The number of flood launches equals the number of clusters.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,0,1,0,1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,0,1],[0,0,0,0],[1,0,0,1]]'],
      ['[[1,1,0,0,1],[0,0,0,0,1],[1,0,1,0,0]]'],
      ['[[0]]'],
    ],
  },
  {
    n: 2986,
    id: 'pghub-b41-discount-tiers',
    name: 'Loyalty Discount Tiers',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minSpend',
    params: [
      { name: 'prices', type: 'List[int]' },
      { name: 'pass3', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You must obtain every item in the fixed order given by <code>prices</code>. For each item you may either pay its individual price, or buy a bundle pass that costs <code>pass3</code> and covers the current item plus the next two items (three items in total, fewer if the list ends sooner). Passes may be bought as often as you like and their coverage windows may overlap. Return the minimum total amount spent to cover all items.',
    examples: [
      ['[5,1,5]\n8', '8', 'One bundle pass for 8 covers all three items, cheaper than paying 5+1+5=11.'],
      ['[2,3]\n10', '5', 'Paying items individually for 2+3=5 beats the pass.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4', '0 <= pass3 <= 10^4'],
    tags: ['dp', 'arrays'],
    py: `def minSpend(prices, pass3):
    n = len(prices)
    INF = float('inf')
    # dp[i] = min cost to cover items i..n-1
    dp = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        pay = prices[i] + dp[i + 1]
        bundle = pass3 + dp[min(i + 3, n)]
        dp[i] = min(pay, bundle)
    return dp[0]`,
    approach:
      'Work backward over the items. At each starting item you choose the cheaper of two options: pay that item alone and continue from the next one, or buy a bundle pass that covers this item and the two after it and continue three positions ahead. Storing the best cost to cover the suffix from each index yields the optimal total at index zero in linear time.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[5,1,5]', '8'],
      ['[2,3]', '10'],
      ['[3]', '5'],
      ['[3]', '2'],
      ['[1,2,3,4,5,6]', '4'],
      ['[10,10,10,10]', '5'],
      ['[0,0,0]', '7'],
      ['[9,1,9,1,9]', '6'],
      ['[100,1,1,100]', '50'],
      ['[7,8,1,2,9,3,4]', '6'],
    ],
  },
  {
    n: 2987,
    id: 'pghub-b41-stack-span',
    name: 'Stock Price Span',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'priceSpans',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given daily stock <code>prices</code>, the span on a day is the number of consecutive days ending on that day (including it) for which the price was less than or equal to that day\'s price. Return the list of spans for every day.',
    examples: [
      ['[100,80,60,70,60,75,85]', '[1,1,1,2,1,4,6]', 'Classic stock span values.'],
      ['[10]', '[1]', 'A single day always has span 1.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def priceSpans(prices):
    spans = []
    stack = []  # holds (price, span)
    for p in prices:
        span = 1
        while stack and stack[-1][0] <= p:
            span += stack.pop()[1]
        stack.append((p, span))
        spans.append(span)
    return spans`,
    approach:
      'Keep a stack of price blocks paired with how many days they span, decreasing in price from bottom to top. For each new day, pop every block whose price is at most the current price and fold its span into the current count, then push the merged block. Each day pushes and pops at most once, giving linear total work.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[100,80,60,70,60,75,85]'],
      ['[10]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[3,3,3,3]'],
      ['[7,1,8,2,9]'],
      ['[0]'],
      ['[10,20,10,20,10]'],
      ['[6,5,5,6,6]'],
      ['[1000000000,1,1000000000]'],
    ],
  },
  {
    n: 2988,
    id: 'pghub-b41-xor-pair-target',
    name: 'XOR Pair Reaches Target',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'hasXorPair',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'bool',
    statement:
      'Given an array <code>nums</code> and an integer <code>target</code>, return <code>true</code> if there exist two distinct indices i and j such that <code>nums[i] XOR nums[j]</code> equals <code>target</code>, otherwise <code>false</code>.',
    examples: [
      ['[1,2,3]\n1', 'true', '2 XOR 3 equals 1.'],
      ['[5,5]\n3', 'false', 'The only pair XORs to 0.'],
    ],
    constraints: ['2 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9', '0 <= target <= 10^9'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def hasXorPair(nums, target):
    seen = set()
    for x in nums:
        if (x ^ target) in seen:
            return True
        seen.add(x)
    return False`,
    approach:
      'Because XOR is its own inverse, a value x pairs with another value y to reach the target exactly when y equals x XOR target. Scan the array keeping a set of values seen so far; for each new value check whether its required partner already appeared. Equal values needing target zero are handled naturally since duplicates are added one at a time.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '1'],
      ['[5,5]', '3'],
      ['[5,5]', '0'],
      ['[0,0]', '0'],
      ['[4,7,2,9]', '5'],
      ['[1,2,4,8]', '12'],
      ['[10,20,30]', '7'],
      ['[1000000000,1]', '1000000001'],
      ['[3,3,3,3]', '0'],
      ['[6,1,9,4]', '15'],
    ],
  },
  {
    n: 2989,
    id: 'pghub-b41-rope-cut-cost',
    name: 'Minimum Rope Joining Cost',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minJoinCost',
    params: [{ name: 'ropes', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You have <code>ropes</code> of the given lengths and must join them all into one rope. Joining two ropes costs the sum of their lengths and produces a single rope of that combined length. Return the minimum total cost to join all ropes into one. A single rope costs nothing.',
    examples: [
      ['[4,3,2,6]', '29', 'Greedily joining shortest pairs first minimises cost.'],
      ['[5]', '0', 'One rope needs no joins.'],
    ],
    constraints: ['1 <= ropes.length <= 10^5', '1 <= ropes[i] <= 10^4'],
    tags: ['greedy', 'heap'],
    py: `def minJoinCost(ropes):
    if len(ropes) <= 1:
        return 0
    heap = list(ropes)
    heapq.heapify(heap)
    total = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        s = a + b
        total += s
        heapq.heappush(heap, s)
    return total`,
    approach:
      'Each join adds the combined length to the running cost, and every rope contributes its length once per join it participates in, so shorter ropes should be joined earliest to be counted the most times. A min-heap repeatedly fuses the two currently shortest ropes, adding their sum to the cost and reinserting the merged rope until one remains.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[4,3,2,6]'],
      ['[5]'],
      ['[1,1]'],
      ['[1,2,3,4,5]'],
      ['[10,10,10,10]'],
      ['[7]'],
      ['[2,2,2,2,2,2]'],
      ['[8,4,6,12]'],
      ['[1,1,1,1,1,1,1,1]'],
      ['[100,200,300]'],
    ],
  },
  {
    n: 2990,
    id: 'pghub-b41-ledger-rollback',
    name: 'Ledger With Rollback',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'finalBalance',
    params: [{ name: 'ops', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'A simple ledger starts at balance 0 and processes string operations in <code>ops</code>. An operation <code>"+x"</code> or <code>"-x"</code> adds or subtracts the integer x from the balance and records the change. The operation <code>"undo"</code> reverts the most recent recorded change (and an undone change can itself not be undone again unless re-applied). An <code>"undo"</code> with no change to revert does nothing. Return the final balance.',
    examples: [
      ['["+5","+3","undo","-2"]', '3', 'Balance goes 5, 8, back to 5, then 3.'],
      ['["undo","undo"]', '0', 'Nothing to revert.'],
    ],
    constraints: ['1 <= ops.length <= 10^5', 'each op is "+x", "-x" (with |x| <= 10^9), or "undo"'],
    tags: ['stack', 'design'],
    py: `def finalBalance(ops):
    balance = 0
    history = []
    for op in ops:
        if op == 'undo':
            if history:
                balance -= history.pop()
        else:
            delta = int(op)
            balance += delta
            history.append(delta)
    return balance`,
    approach:
      'Keep the running balance plus a stack of the signed deltas actually applied. A plus or minus operation parses to an integer delta, adjusts the balance, and is pushed onto the history. An undo pops the last delta and subtracts it back out, doing nothing when the history is empty.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[\'+5\',\'+3\',\'undo\',\'-2\']'],
      ['[\'undo\',\'undo\']'],
      ['[\'+10\']'],
      ['[\'+1\',\'+1\',\'+1\',\'undo\',\'undo\']'],
      ['[\'-5\',\'-5\',\'undo\']'],
      ['[\'+100\',\'-30\',\'-20\']'],
      ['[\'undo\']'],
      ['[\'+7\',\'undo\',\'undo\',\'+7\']'],
      ['[\'-1000000000\',\'+1000000000\']'],
      ['[\'+2\',\'+3\',\'+4\',\'undo\',\'+10\']'],
    ],
  },
  {
    n: 2991,
    id: 'pghub-b41-word-ladder-len',
    name: 'Shortest Transform Steps',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'transformSteps',
    params: [
      { name: 'start', type: 'str' },
      { name: 'end', type: 'str' },
      { name: 'words', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'All words have the same length. Starting from <code>start</code>, in one step you may change a single character to any lowercase letter, but the resulting word must be in the allowed set <code>words</code> (the <code>end</code> word is also required to be in <code>words</code> to be reachable). Return the minimum number of steps to turn <code>start</code> into <code>end</code>, or <code>-1</code> if impossible. If <code>start</code> equals <code>end</code> the answer is 0.',
    examples: [
      ['["hit","cog",["hot","dot","dog","lot","log","cog"]]', '4', 'hit→hot→dot→dog→cog.'],
      ['["a","c",["b"]]', '-1', 'No path of allowed words connects a to c.'],
    ],
    constraints: ['1 <= word length <= 10', '0 <= words.length <= 5000', 'all words are lowercase and equal length'],
    tags: ['graphs', 'bfs'],
    py: `def transformSteps(start, end, words):
    if start == end:
        return 0
    word_set = set(words)
    if end not in word_set:
        return -1
    q = deque([(start, 0)])
    visited = {start}
    while q:
        word, steps = q.popleft()
        if word == end:
            return steps
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c == word[i]:
                    continue
                nxt = word[:i] + c + word[i + 1:]
                if nxt in word_set and nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, steps + 1))
    return -1`,
    approach:
      'Model each valid word as a node with edges to words differing in exactly one character. A breadth-first search from the start explores words in increasing step order, generating neighbours by trying every single-letter change and keeping only those present in the allowed set and not yet visited. The first time the end word is dequeued gives the shortest step count.',
    complexity: { time: 'O(N * L * 26)', space: 'O(N * L)' },
    multiParam: true,
    cases: [
      ['\'hit\'', '\'cog\'', '[\'hot\',\'dot\',\'dog\',\'lot\',\'log\',\'cog\']'],
      ['\'a\'', '\'c\'', '[\'b\']'],
      ['\'a\'', '\'a\'', '[]'],
      ['\'ab\'', '\'cd\'', '[\'ad\',\'cd\']'],
      ['\'cat\'', '\'dog\'', '[\'cot\',\'cog\',\'dog\',\'dot\']'],
      ['\'hot\'', '\'dog\'', '[\'dot\',\'dog\']'],
      ['\'red\'', '\'tax\'', '[\'ted\',\'tad\',\'tax\',\'red\']'],
      ['\'aaa\'', '\'aaa\'', '[\'aaa\']'],
      ['\'pig\'', '\'big\'', '[\'big\']'],
      ['\'lead\'', '\'gold\'', '[\'load\',\'goad\',\'gold\',\'lead\']'],
    ],
  },
  {
    n: 2992,
    id: 'pghub-b41-trapped-basins',
    name: 'Trapped Rainwater Basins',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'trappedWater',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A terrain is an array of non-negative bar <code>heights</code> of unit width. After rain, water collects in the dips. Return the total units of water trapped between the bars.',
    examples: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]', '6', 'Six units pool in the valleys.'],
      ['[4,2,3]', '1', 'One unit sits above the middle bar.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def trappedWater(heights):
    if not heights:
        return 0
    left, right = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if heights[left] < heights[right]:
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
      'Water above any bar is capped by the smaller of the tallest bar to its left and the tallest to its right. Two pointers advance inward from both ends, always moving the side with the lower bar; for that side the running maximum already bounds the water, so the difference between that maximum and the current bar accumulates into the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      ['[4,2,3]'],
      ['[1]'],
      ['[3,3,3]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[2,0,2]'],
      ['[5,0,5,0,5]'],
      ['[0,0,0]'],
      ['[4,2,0,3,2,5]'],
    ],
  },
  {
    n: 2993,
    id: 'pghub-b41-subarray-sum-k',
    name: 'Count Subarrays Summing K',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'countSubarrays',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>k</code>, return the number of contiguous subarrays whose elements sum to exactly <code>k</code>. The array may contain negative numbers.',
    examples: [
      ['[1,1,1]\n2', '2', 'The two adjacent pairs each sum to 2.'],
      ['[3,-1,-1,1]\n0', '2', 'Subarrays [-1,-1,1,...] summing to zero.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '-10^9 <= k <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def countSubarrays(nums, k):
    counts = defaultdict(int)
    counts[0] = 1
    prefix = 0
    result = 0
    for x in nums:
        prefix += x
        result += counts[prefix - k]
        counts[prefix] += 1
    return result`,
    approach:
      'A subarray sums to k exactly when the difference of two prefix sums equals k. Walk the array maintaining the running prefix sum and a frequency table of prefix sums seen so far; at each step the number of earlier prefixes equal to current minus k is how many subarrays ending here sum to k. Accumulate those counts, seeding the empty-prefix value.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,1,1]', '2'],
      ['[3,-1,-1,1]', '0'],
      ['[1,2,3]', '3'],
      ['[0,0,0]', '0'],
      ['[5]', '5'],
      ['[5]', '4'],
      ['[-1,-1,1]', '0'],
      ['[1,-1,1,-1,1]', '0'],
      ['[2,4,6]', '6'],
      ['[1,2,1,2,1]', '3'],
    ],
  },
  {
    n: 2994,
    id: 'pghub-b41-tree-tilt',
    name: 'Binary Tree Tilt Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'treeTilt',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given in level order as <code>values</code>, where <code>-1</code> marks an absent node and all real node values are non-negative. The tilt of a node is the absolute difference between the sum of all values in its left subtree and the sum of all values in its right subtree (a missing subtree sums to 0). Return the total tilt summed over every node. For a node at index <code>i</code> its children, when present, are at indices <code>2i+1</code> and <code>2i+2</code>.',
    examples: [
      ['[1,2,3]', '1', 'Root tilt |2-3|=1; leaves have tilt 0.'],
      ['[4]', '0', 'A single node has no subtrees.'],
    ],
    constraints: ['1 <= values.length <= 10^4', 'values[0] != -1', '-1 represents an absent node'],
    tags: ['trees', 'recursion'],
    py: `def treeTilt(values):
    n = len(values)
    total = [0]
    def subtree_sum(i):
        if i >= n or values[i] == -1:
            return 0
        left = subtree_sum(2 * i + 1)
        right = subtree_sum(2 * i + 2)
        total[0] += abs(left - right)
        return values[i] + left + right
    subtree_sum(0)
    return total[0]`,
    approach:
      'Compute each node\'s subtree sum with a post-order recursion over the complete-array layout: a node\'s subtree sum is its own value plus the sums of its left and right children. While returning, add the absolute difference of the two child subtree sums to a running total. Absent children contribute zero, and the accumulated total is the overall tilt.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    cases: [
      ['[1,2,3]'],
      ['[4]'],
      ['[1,2,3,4,5,-1,6]'],
      ['[0,0,0]'],
      ['[10,1,1]'],
      ['[5,3,8,1,4,7,9]'],
      ['[1,-1,2,-1,-1,-1,3]'],
      ['[100,50,50]'],
      ['[2,1,-1,1]'],
      ['[9,8,7,6,5,4,3]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B41>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b41-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B41>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B41>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b41-grade-${prob.n}.py`);
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
