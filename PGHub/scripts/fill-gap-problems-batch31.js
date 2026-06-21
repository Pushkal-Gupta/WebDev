#!/usr/bin/env node
// Batch 31 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2031,2036,2041,2046,2051,2052,2061,2066,2067,2072,2077,2082,2083,2084,2093
//
//   node scripts/fill-gap-problems-batch31.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch31.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch31.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2031, 2036, 2041, 2046, 2051, 2052, 2061, 2066, 2067, 2072, 2077, 2082, 2083, 2084, 2093];

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
    n: 2031,
    id: 'pghub-b31-stamp-pages',
    name: 'Passport Stamp Pages',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'pagesNeeded',
    params: [
      { name: 'stamps', type: 'int' },
      { name: 'perPage', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A passport page holds exactly <code>perPage</code> stamps. You have <code>stamps</code> stamps to place, filling each page before starting a new one. Return the number of pages required to hold every stamp.',
    examples: [
      ['7\n3', '3', 'Two full pages hold 6 stamps; the 7th stamp needs a third page.'],
      ['6\n3', '2', 'Six stamps fit exactly on two pages.'],
    ],
    constraints: ['0 <= stamps <= 10^9', '1 <= perPage <= 10^9'],
    tags: ['math'],
    py: `def pagesNeeded(stamps, perPage):
    return (stamps + perPage - 1) // perPage`,
    approach:
      'This is ceiling division: the number of pages is the smallest integer at least stamps/perPage. Compute it without floating point as (stamps + perPage - 1) // perPage, which also yields 0 when there are no stamps.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['7', '3'],
      ['6', '3'],
      ['0', '5'],
      ['1', '1'],
      ['10', '1'],
      ['100', '7'],
      ['999999999', '1000000000'],
      ['5', '5'],
      ['8', '3'],
      ['1000000000', '3'],
    ],
  },
  {
    n: 2036,
    id: 'pghub-b31-vowel-streak',
    name: 'Longest Vowel Streak',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'longestVowelRun',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, a vowel streak is a maximal run of consecutive vowels (<code>a</code>, <code>e</code>, <code>i</code>, <code>o</code>, <code>u</code>). Return the length of the longest vowel streak, or <code>0</code> if there are no vowels.',
    examples: [
      ['beautiful', '3', 'The run "eau" has three consecutive vowels.'],
      ['rhythm', '0', 'There are no vowels at all.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings'],
    py: `def longestVowelRun(s):
    vowels = set('aeiou')
    best = 0
    cur = 0
    for ch in s:
        if ch in vowels:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best`,
    approach:
      'Scan the string once, keeping a running length of the current vowel run. Reset it to zero on any consonant and track the maximum run length seen. This is a single linear pass with constant extra memory.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'beautiful'"],
      ["'rhythm'"],
      ["''"],
      ["'aeiou'"],
      ["'a'"],
      ["'xyz'"],
      ["'queue'"],
      ["'programming'"],
      ["'aaeexx'"],
      ["'bcdfgaeiou'"],
    ],
  },
  {
    n: 2041,
    id: 'pghub-b31-coin-change-ways',
    name: 'Vending Coin Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A vending machine accepts coins of the denominations listed in <code>coins</code>, each available in unlimited supply. Return the number of distinct combinations of coins that sum to exactly <code>amount</code>. Two combinations are the same if they use the same count of each denomination, regardless of order.',
    examples: [
      ['[1,2,5]\n5', '4', 'The combinations are 5, 2+2+1, 2+1+1+1, and 1+1+1+1+1.'],
      ['[2]\n3', '0', 'No combination of 2-coins can total an odd amount.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', '0 <= amount <= 5000'],
    tags: ['dp'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for x in range(c, amount + 1):
            dp[x] += dp[x - c]
    return dp[amount]`,
    approach:
      'Unbounded-knapsack counting DP. dp[x] is the number of ways to make x. Iterate denominations in the outer loop so each combination is counted once regardless of order, and for each coin add the ways to make x-coin into dp[x].',
    complexity: { time: 'O(coins * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[3,5,7]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[2,3,7]', '12'],
      ['[1]', '100'],
      ['[4,6]', '14'],
      ['[1,5,10,25]', '50'],
    ],
  },
  {
    n: 2046,
    id: 'pghub-b31-bridge-tolls',
    name: 'Cheapest Toll Bridge Route',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'cheapestRoute',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
      { name: 'dest', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> towns numbered <code>0</code> to <code>n-1</code>. Each entry of <code>roads</code> is <code>[u, v, toll]</code> describing a two-way road between towns <code>u</code> and <code>v</code> that costs <code>toll</code> to use. Return the minimum total toll to travel from town <code>start</code> to town <code>dest</code>, or <code>-1</code> if no route exists.',
    examples: [
      ['4\n[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]\n0\n3', '4', 'The route 0->1->2->3 costs 1+2+1 = 4, cheaper than going directly via the toll-5 road.'],
      ['3\n[[0,1,4]]\n0\n2', '-1', 'Town 2 is unreachable.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 10^5', '0 <= toll <= 10^6', '0 <= start, dest < n'],
    tags: ['advanced-graphs'],
    py: `def cheapestRoute(n, roads, start, dest):
    adj = defaultdict(list)
    for u, v, w in roads:
        adj[u].append((v, w))
        adj[v].append((u, w))
    dist = [float('inf')] * n
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == dest:
            return d
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return -1 if dist[dest] == float('inf') else dist[dest]`,
    approach:
      "Classic Dijkstra's shortest path on a weighted undirected graph. Build an adjacency list, then pop the closest unsettled town from a min-heap, relaxing each neighbor. Return the distance to dest, or -1 if it stays infinite.",
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,1],[1,2,2],[0,2,5],[2,3,1]]', '0', '3'],
      ['3', '[[0,1,4]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['5', '[[0,1,10],[1,4,10],[0,2,3],[2,3,4],[3,4,2]]', '0', '4'],
      ['2', '[[0,1,0]]', '0', '1'],
      ['4', '[[0,1,5],[1,2,5],[2,3,5],[0,3,100]]', '0', '3'],
      ['6', '[[0,1,7],[1,2,6],[0,2,9],[2,3,11],[3,4,2],[4,5,3]]', '0', '5'],
      ['3', '[[0,1,2],[1,2,2],[0,2,3]]', '0', '2'],
      ['4', '[[0,1,1],[1,2,1],[2,0,1]]', '0', '3'],
      ['5', '[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[0,4,10]]', '4', '0'],
    ],
  },
  {
    n: 2051,
    id: 'pghub-b31-shelf-balance',
    name: 'Balanced Shelf Split',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'pivotIndex',
    params: [{ name: 'weights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A shelf holds books with weights <code>weights</code> left to right. A balance point is an index where the total weight of books strictly to its left equals the total weight of books strictly to its right. Return the leftmost such index, or <code>-1</code> if none exists.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 sums to 1+7+3=11 and right sums to 5+6=11.'],
      ['[1,2,3]', '-1', 'No index splits the weights evenly.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '0 <= weights[i] <= 10^4'],
    tags: ['arrays'],
    py: `def pivotIndex(weights):
    total = sum(weights)
    left = 0
    for i, w in enumerate(weights):
        if left == total - left - w:
            return i
        left += w
    return -1`,
    approach:
      'Precompute the total sum. Sweep left to right tracking the running left-side sum; at each index the right-side sum is total minus left minus the current element. Return the first index where the two sides match.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'],
      ['[1,2,3]'],
      ['[2,1,-1]'],
      ['[0]'],
      ['[0,0,0,0]'],
      ['[5,5]'],
      ['[1,0,1]'],
      ['[10,1,2,3,4]'],
      ['[3,3,3,3,3]'],
      ['[1,1,1,1,1,1]'],
    ],
  },
  {
    n: 2052,
    id: 'pghub-b31-keypad-words',
    name: 'Phone Keypad Letter Count',
    topic_id: 'recursion',
    difficulty: 'Medium',
    method_name: 'countCombinations',
    params: [{ name: 'digits', type: 'str' }],
    return_type: 'int',
    statement:
      'On a classic phone keypad, digit <code>2</code> maps to 3 letters, ..., <code>7</code> and <code>9</code> map to 4 letters each, and the rest map to 3. Given a string <code>digits</code> of characters <code>2</code>-<code>9</code>, return how many distinct letter strings it could represent. Return <code>0</code> for the empty input.',
    examples: [
      ['23', '9', 'Digit 2 has 3 letters and digit 3 has 3 letters, giving 3*3 = 9 combinations.'],
      ['7', '4', 'Digit 7 maps to four letters.'],
    ],
    constraints: ['0 <= digits.length <= 12', 'digits consists of characters in the range 2-9'],
    tags: ['recursion', 'math'],
    py: `def countCombinations(digits):
    if not digits:
        return 0
    sizes = {'2':3,'3':3,'4':3,'5':3,'6':3,'7':4,'8':3,'9':4}
    total = 1
    for d in digits:
        total *= sizes[d]
    return total`,
    approach:
      'Each digit independently chooses one of its mapped letters, so the count is the product of the per-digit letter counts. Multiply the sizes together, treating the empty string as zero combinations by definition.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'23'"],
      ["'7'"],
      ["''"],
      ["'234'"],
      ["'79'"],
      ["'2'"],
      ["'999'"],
      ["'2345678'"],
      ["'77'"],
      ["'222222'"],
    ],
  },
  {
    n: 2061,
    id: 'pghub-b31-thermostat-sched',
    name: 'Thermostat Comfort Windows',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxComfort',
    params: [
      { name: 'temps', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A sensor logs hourly temperatures in <code>temps</code>. Comfort over a window is the sum of its temperatures. Return the maximum comfort over any contiguous window of exactly <code>k</code> hours. If <code>k</code> exceeds the number of readings, return <code>0</code>.',
    examples: [
      ['[1,12,-5,-6,50,3]\n4', '51', 'The window [-5,-6,50,3] sums to 42; the window [12,-5,-6,50] sums to 51, which is the max.'],
      ['[5,5,5]\n5', '0', 'There are fewer than 5 readings, so no valid window exists.'],
    ],
    constraints: ['1 <= temps.length <= 10^5', '1 <= k <= 10^5', '-10^4 <= temps[i] <= 10^4'],
    tags: ['sliding-window'],
    py: `def maxComfort(temps, k):
    n = len(temps)
    if k > n:
        return 0
    window = sum(temps[:k])
    best = window
    for i in range(k, n):
        window += temps[i] - temps[i - k]
        if window > best:
            best = window
    return best`,
    approach:
      'Fixed-size sliding window. Compute the first window sum, then slide one hour at a time by adding the entering reading and subtracting the leaving one, keeping the running maximum. Guard against k larger than the array.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,12,-5,-6,50,3]', '4'],
      ['[5,5,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[-1,-2,-3,-4]', '2'],
      ['[10]', '1'],
      ['[3,3,3,3]', '4'],
      ['[7,-1,7,-1,7]', '3'],
      ['[100,-100,100,-100]', '2'],
      ['[0,0,0,0,0]', '3'],
      ['[2,1,5,1,3,2]', '3'],
    ],
  },
  {
    n: 2066,
    id: 'pghub-b31-elevator-trips',
    name: 'Elevator Weight Trips',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People with the given <code>weights</code> wait for an elevator that carries at most two people per trip and at most <code>limit</code> total weight. Return the minimum number of trips to carry everyone. It is guaranteed every individual weight is at most <code>limit</code>.',
    examples: [
      ['[1,2]\n3', '1', 'Both people fit in one trip since 1+2 <= 3.'],
      ['[3,2,2,1]\n3', '3', 'Pair (1,2) and (2) and (3) — three trips minimize the count.'],
    ],
    constraints: ['1 <= weights.length <= 5*10^4', '1 <= weights[i] <= limit <= 3*10^4'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, limit):
    weights = sorted(weights)
    i, j = 0, len(weights) - 1
    trips = 0
    while i <= j:
        if weights[i] + weights[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights, then greedily pair the lightest remaining person with the heaviest. If they fit together, advance both pointers; otherwise the heaviest rides alone. Each iteration commits one trip, minimizing the total.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2]', '3'],
      ['[3,2,2,1]', '3'],
      ['[3,5,3,4]', '5'],
      ['[1]', '1'],
      ['[2,2,2,2]', '4'],
      ['[1,1,1,1,1]', '2'],
      ['[5,5,5,5]', '5'],
      ['[1,2,3,4,5]', '5'],
      ['[10,10,10]', '10'],
      ['[4,1,3,2,5,6]', '6'],
    ],
  },
  {
    n: 2067,
    id: 'pghub-b31-server-merge',
    name: 'Merge Server Logs',
    topic_id: 'linkedlist',
    difficulty: 'Easy',
    method_name: 'mergeSorted',
    params: [
      { name: 'a', type: 'List[int]' },
      { name: 'b', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Two servers each emit a list of timestamps already sorted in non-decreasing order, given as <code>a</code> and <code>b</code>. Return a single list containing all timestamps from both, sorted in non-decreasing order. Duplicates across the two lists are kept.',
    examples: [
      ['[1,3,5]\n[2,4,6]', '[1,2,3,4,5,6]', 'The two streams interleave into one sorted log.'],
      ['[]\n[7,8]', '[7,8]', 'Merging with an empty list returns the other list.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', '-10^9 <= values <= 10^9', 'each input list is sorted'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def mergeSorted(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
    approach:
      'Standard two-pointer merge, the core step of merge sort. Walk both sorted lists, repeatedly taking the smaller front element, then append whatever remains of the non-exhausted list. Stable on ties by preferring list a.',
    complexity: { time: 'O(m + n)', space: 'O(m + n)' },
    multiParam: true,
    cases: [
      ['[1,3,5]', '[2,4,6]'],
      ['[]', '[7,8]'],
      ['[1,2,3]', '[]'],
      ['[]', '[]'],
      ['[1,1,1]', '[1,1]'],
      ['[-5,0,5]', '[-3,0,3]'],
      ['[10]', '[1,2,3]'],
      ['[1,2,3,4]', '[5,6,7,8]'],
      ['[2,2,2]', '[2,2,2]'],
      ['[-1000000000]', '[1000000000]'],
    ],
  },
  {
    n: 2072,
    id: 'pghub-b31-lock-rotations',
    name: 'Combination Lock Distance',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'totalClicks',
    params: [
      { name: 'start', type: 'List[int]' },
      { name: 'target', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A combination lock has several wheels, each showing a digit 0-9 that wraps around (9 clicks to 0 is one click). Given the current digits <code>start</code> and the desired digits <code>target</code> of equal length, return the minimum total number of clicks across all wheels to reach the target.',
    examples: [
      ['[0,0,0]\n[1,2,3]', '6', 'Wheel costs are 1 + 2 + 3 = 6 clicks.'],
      ['[0]\n[9]', '1', 'Turning down one click wraps 0 to 9.'],
    ],
    constraints: ['1 <= start.length == target.length <= 10^4', '0 <= digits <= 9'],
    tags: ['math'],
    py: `def totalClicks(start, target):
    total = 0
    for s, t in zip(start, target):
        diff = abs(s - t)
        total += min(diff, 10 - diff)
    return total`,
    approach:
      'Each wheel is independent. The minimum clicks for one wheel is the smaller of the direct distance and the wrap-around distance, i.e. min(d, 10-d) where d is the absolute digit difference. Sum across all wheels.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[0,0,0]', '[1,2,3]'],
      ['[0]', '[9]'],
      ['[5]', '[5]'],
      ['[1,2,3]', '[1,2,3]'],
      ['[0,5]', '[5,0]'],
      ['[9,9,9]', '[0,0,0]'],
      ['[2,7]', '[8,1]'],
      ['[4]', '[6]'],
      ['[3,3,3,3]', '[8,8,8,8]'],
      ['[0,1,2,3,4]', '[9,8,7,6,5]'],
    ],
  },
  {
    n: 2077,
    id: 'pghub-b31-tournament-bracket',
    name: 'Tournament Bracket Rounds',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'roundsNeeded',
    params: [{ name: 'players', type: 'int' }],
    return_type: 'int',
    statement:
      'A single-elimination tournament has <code>players</code> competitors. In each round, players pair up and losers are eliminated; if the count is odd one player gets a bye to the next round. Return the number of rounds needed to crown a single winner. With one player, zero rounds are needed.',
    examples: [
      ['8', '3', 'Eight players reduce 8 -> 4 -> 2 -> 1 across three rounds.'],
      ['5', '3', 'Five players reduce 5 -> 3 -> 2 -> 1 across three rounds.'],
    ],
    constraints: ['1 <= players <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def roundsNeeded(players):
    rounds = 0
    while players > 1:
        players = (players + 1) // 2
        rounds += 1
    return rounds`,
    approach:
      'Each round roughly halves the field, rounding up to account for a bye when the count is odd. Repeatedly apply the ceiling-halving until one player remains, counting rounds. This equals the ceiling of log2 of the player count.',
    complexity: { time: 'O(log players)', space: 'O(1)' },
    cases: [
      ['8'],
      ['5'],
      ['1'],
      ['2'],
      ['3'],
      ['16'],
      ['17'],
      ['1000000000'],
      ['100'],
      ['7'],
    ],
  },
  {
    n: 2082,
    id: 'pghub-b31-paren-depth',
    name: 'Maximum Nesting Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> of characters that may include the brackets <code>(</code> and <code>)</code> mixed with other characters, and guaranteed to be properly balanced, return the maximum nesting depth of the parentheses. A string with no parentheses has depth <code>0</code>.',
    examples: [
      ['(1+(2*3)+((8)/4))+1', '3', 'The deepest point "((8))" sits at nesting depth 3.'],
      ['1+2', '0', 'There are no parentheses.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 'the parentheses in s are balanced'],
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
      'Treat the open parenthesis as a push and the close as a pop on an implicit stack; the stack height is the current depth. Track the maximum height reached during one linear scan. No explicit stack is needed, just a counter.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ["'(1+(2*3)+((8)/4))+1'"],
      ["'1+2'"],
      ["''"],
      ["'()()()'"],
      ["'((()))'"],
      ["'a(b(c)d)e'"],
      ["'(())()'"],
      ["'(((((())))))'"],
      ["'no brackets here'"],
      ["'(x)(y)((z))'"],
    ],
  },
  {
    n: 2083,
    id: 'pghub-b31-garden-prune',
    name: 'Garden Tree Pruning',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'countLeaves',
    params: [{ name: 'parent', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A rooted tree of <code>n</code> nodes (numbered <code>0</code> to <code>n-1</code>) is described by <code>parent</code>, where <code>parent[i]</code> is the parent of node <code>i</code> and the root has parent <code>-1</code>. A leaf is a node with no children. Return the number of leaves in the tree.',
    examples: [
      ['[-1,0,0,1,1]', '3', 'Node 0 is the root with children 1 and 2; node 1 has children 3 and 4. Leaves are 2, 3, 4.'],
      ['[-1]', '1', 'A single root node is itself a leaf.'],
    ],
    constraints: ['1 <= n <= 10^5', 'exactly one entry equals -1', 'parent describes a valid tree'],
    tags: ['trees'],
    py: `def countLeaves(parent):
    n = len(parent)
    has_child = [False] * n
    for p in parent:
        if p != -1:
            has_child[p] = True
    return sum(1 for i in range(n) if not has_child[i])`,
    approach:
      'A node is a leaf exactly when no other node names it as a parent. Mark every node that appears as a parent value, then count the nodes never marked. This avoids building an explicit child adjacency structure.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[-1,0,0,1,1]'],
      ['[-1]'],
      ['[-1,0,1,2,3]'],
      ['[-1,0,0,0,0]'],
      ['[1,-1]'],
      ['[-1,0,1,1,2,2]'],
      ['[2,2,-1]'],
      ['[-1,0,0,2,2,4,4]'],
      ['[-1,0,1,0,3]'],
      ['[3,3,3,-1]'],
    ],
  },
  {
    n: 2084,
    id: 'pghub-b31-word-anagram-groups',
    name: 'Anagram Group Count',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'groupCount',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Given a list of lowercase <code>words</code>, two words belong to the same group if one is an anagram of the other (same letters with the same multiplicities). Return the number of distinct anagram groups.',
    examples: [
      ['["eat","tea","tan","ate","nat","bat"]', '3', 'Groups: {eat,tea,ate}, {tan,nat}, {bat}.'],
      ['["abc"]', '1', 'A single word forms one group.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words[i] is lowercase English'],
    tags: ['strings'],
    py: `def groupCount(words):
    seen = set()
    for w in words:
        seen.add(''.join(sorted(w)))
    return len(seen)`,
    approach:
      'Two words are anagrams iff their sorted letter sequences are identical. Use each sorted word as a canonical key in a set; the number of distinct keys is the number of anagram groups.',
    complexity: { time: 'O(n * k log k)', space: 'O(n * k)' },
    cases: [
      ['["eat","tea","tan","ate","nat","bat"]'],
      ['["abc"]'],
      ['[""]'],
      ['["a","a","a"]'],
      ['["listen","silent","enlist"]'],
      ['["abc","cba","bca","xyz"]'],
      ['["ab","ba","abc"]'],
      ['["aa","aa","aa","bb"]'],
      ['["rat","tar","art","car"]'],
      ['["one","two","three","four"]'],
    ],
  },
  {
    n: 2093,
    id: 'pghub-b31-subset-sum-reach',
    name: 'Reachable Weight Targets',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'canReach',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'bool',
    statement:
      'Given a list of positive integers <code>nums</code>, return <code>true</code> if some subset of them sums to exactly <code>target</code>, and <code>false</code> otherwise. The empty subset sums to <code>0</code>.',
    examples: [
      ['[3,34,4,12,5,2]\n9', 'true', 'The subset {4,5} sums to 9.'],
      ['[1,2,5]\n4', 'false', 'No subset of {1,2,5} sums to 4.'],
    ],
    constraints: ['1 <= nums.length <= 200', '1 <= nums[i] <= 1000', '0 <= target <= 10^5'],
    tags: ['backtracking', 'dp'],
    py: `def canReach(nums, target):
    if target == 0:
        return True
    reachable = {0}
    for x in nums:
        nxt = set(reachable)
        for r in reachable:
            s = r + x
            if s == target:
                return True
            if s < target:
                nxt.add(s)
        reachable = nxt
    return target in reachable`,
    approach:
      'Subset-sum decision. Maintain the set of all sums reachable using a prefix of the numbers; for each new value, extend every reachable sum by it, pruning sums that exceed the target. Return true as soon as the target appears.',
    complexity: { time: 'O(n * target)', space: 'O(target)' },
    multiParam: true,
    cases: [
      ['[3,34,4,12,5,2]', '9'],
      ['[1,2,5]', '4'],
      ['[1]', '0'],
      ['[2,4,6]', '5'],
      ['[1,1,1,1]', '3'],
      ['[10,20,30]', '60'],
      ['[7]', '7'],
      ['[5,5,5]', '15'],
      ['[1,3,9,27]', '14'],
      ['[2,3,7,8,10]', '11'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B31>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b31-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B31>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B31>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b31-grade-${prob.n}.py`);
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
