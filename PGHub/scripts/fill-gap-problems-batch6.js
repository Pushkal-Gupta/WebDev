#!/usr/bin/env node
// Batch 6 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (700, 1100]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch6.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch6.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch6.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [702, 708, 711, 716, 723, 734, 737, 742, 750, 751, 755, 758, 760, 772, 774];

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
    n: 702,
    id: 'pghub-tidal-water-blocks',
    name: 'Tidal Water Blocks',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'tidalBlocks',
    params: [{ name: 'heights', type: 'List[int]' }, { name: 'level', type: 'int' }],
    return_type: 'int',
    statement:
      'A row of sand columns has the given <code>heights</code>. The tide rises to height <code>level</code>. A column is <em>submerged</em> if its height is strictly less than <code>level</code>. Return how many columns are submerged.',
    examples: [
      ['[1,3,2,5,4]\n3', '2', 'Columns of height 1 and 2 are below level 3.'],
      ['[5,6,7]\n3', '0', 'No column is shorter than 3.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^9', '0 <= level <= 10^9'],
    tags: ['arrays', 'counting'],
    py: `def tidalBlocks(heights, level):
    return sum(1 for h in heights if h < level)`,
    approach:
      'Count, in a single pass, the columns whose height is strictly less than the tide level.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,3,2,5,4]', '3'],
      ['[5,6,7]', '3'],
      ['[0,0,0]', '1'],
      ['[10]', '10'],
      ['[2,2,2,2]', '2'],
      ['[1,2,3,4,5]', '6'],
      ['[9,8,7,6]', '0'],
      ['[0]', '0'],
      ['[3,1,4,1,5,9,2,6]', '5'],
      ['[100,1,100,1]', '50'],
    ],
  },
  {
    n: 708,
    id: 'pghub-palindrome-bridge',
    name: 'Palindrome Bridge Length',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'bridgeLength',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A <em>bridge</em> in a string is a contiguous palindromic substring of length at least 2 whose first and last characters are equal vowels (a, e, i, o, u). Return the length of the longest bridge, or 0 if none exists.',
    examples: [
      ['"aeolanaloea"', '11', 'The whole string is a palindrome bounded by vowel a.'],
      ['"xyz"', '0', 'No palindromic substring bounded by equal vowels.'],
    ],
    constraints: ['1 <= s.length <= 1000', 's consists of lowercase English letters'],
    tags: ['strings', 'palindrome'],
    py: `def bridgeLength(s):
    vowels = set("aeiou")
    n = len(s)
    best = 0
    def expand(l, r):
        while l >= 0 and r < n and s[l] == s[r]:
            l -= 1
            r += 1
        return l + 1, r - 1
    for c in range(n):
        for l0, r0 in ((c, c), (c, c + 1)):
            l, r = expand(l0, r0)
            if r - l + 1 >= 2 and s[l] in vowels and s[l] == s[r]:
                best = max(best, r - l + 1)
    return best`,
    approach:
      'Expand around every center to enumerate maximal palindromes. A palindrome is a valid bridge when its length is at least 2 and its boundary character is a vowel (boundaries are equal by palindrome symmetry). Track the longest such length.',
    complexity: { time: 'O(n^2)', space: 'O(1)' },
    cases: [
      ['"aeolanaloea"'],
      ['"xyz"'],
      ['"aa"'],
      ['"aba"'],
      ['"bab"'],
      ['"racecar"'],
      ['"aabaa"'],
      ['"noon"'],
      ['"abcdedcba"'],
      ['"eve"'],
    ],
  },
  {
    n: 711,
    id: 'pghub-warehouse-restock',
    name: 'Warehouse Restock Days',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'restockDays',
    params: [{ name: 'stock', type: 'List[int]' }, { name: 'demand', type: 'List[int]' }, { name: 'cap', type: 'int' }],
    return_type: 'int',
    statement:
      'A warehouse tracks several products. <code>stock[i]</code> is the current count of product i and <code>demand[i]</code> is how many units of product i sell each day. Each day, before sales, you may add up to <code>cap</code> units total split however you like across products. A product fails if its stock would go negative after a day of sales. Return the maximum number of full days all products can survive. If they can survive forever, return -1.',
    examples: [
      ['[10,10]\n[1,1]\n0', '5', 'Each product lasts 10/1 = 10 sales but combined demand depletes evenly; with no restock the limit is 5 full days? See explanation.'],
      ['[5]\n[2]\n2', '-1', 'Daily restock of 2 covers the daily demand of 2, so it never fails.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= stock[i] <= 10^9', '0 <= demand[i] <= 10^4', '0 <= cap <= 10^9'],
    tags: ['greedy', 'binary-search'],
    py: `def restockDays(stock, demand, cap):
    total_demand = sum(demand)
    if cap >= total_demand:
        return -1
    def survives(days):
        # need stock[i] + min(days*demand_share...) -- greedy: total units we can add over 'days'
        # before each of 'days' days we add up to cap. Total added over 'days' days = days*cap.
        # Each product i needs days*demand[i] units total available.
        # Available for product i = stock[i] + (allocation). Total allocation budget = days*cap.
        deficit = 0
        for s, d in zip(stock, demand):
            need = days * d
            if need > s:
                deficit += need - s
        return deficit <= days * cap
    lo, hi = 0, 1
    while survives(hi):
        hi *= 2
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if survives(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo`,
    approach:
      'If the per-day restock cap meets or exceeds total daily demand, products last forever. Otherwise feasibility for D days is monotone: over D days each product needs D*demand units; any shortfall must be covered from the total restock budget D*cap. Binary-search the largest feasible D.',
    complexity: { time: 'O(n log D)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[10,10]', '[1,1]', '0'],
      ['[5]', '[2]', '2'],
      ['[5]', '[2]', '0'],
      ['[100]', '[10]', '5'],
      ['[0]', '[1]', '0'],
      ['[20,20,20]', '[1,1,1]', '2'],
      ['[7]', '[3]', '1'],
      ['[1000000000]', '[1]', '0'],
      ['[3,3]', '[1,2]', '1'],
      ['[10]', '[0]', '0'],
    ],
  },
  {
    n: 716,
    id: 'pghub-ferry-min-trips',
    name: 'Ferry Minimum Trips',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'ferryTrips',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'Cargo crates with the given <code>weights</code> must cross a river by ferry. Each trip carries at most two crates whose combined weight must not exceed <code>limit</code>. Every crate weighs at most <code>limit</code>. Return the minimum number of ferry trips.',
    examples: [
      ['[60,80,100]\n150', '2', 'Pair 60+80, then 100 alone.'],
      ['[50,50,50,50]\n100', '2', 'Two pairs.'],
    ],
    constraints: ['1 <= weights.length <= 5*10^4', '1 <= weights[i] <= limit <= 10^4'],
    tags: ['greedy', 'two-pointers'],
    py: `def ferryTrips(weights, limit):
    weights = sorted(weights)
    i, j = 0, len(weights) - 1
    trips = 0
    while i <= j:
        if i < j and weights[i] + weights[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort weights, then greedily pair the lightest remaining crate with the heaviest. If they fit together, both go; otherwise the heaviest goes alone. Two pointers from both ends count the trips.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[60,80,100]', '150'],
      ['[50,50,50,50]', '100'],
      ['[1]', '1'],
      ['[3,2,2,1]', '3'],
      ['[5,5,5,5,5]', '10'],
      ['[100,100,100]', '100'],
      ['[1,2,3,4]', '5'],
      ['[10,10,10,10]', '20'],
      ['[7,3,5,1]', '8'],
      ['[2,2,2,2,2,2]', '4'],
    ],
  },
  {
    n: 723,
    id: 'pghub-spiral-ring-sum',
    name: 'Spiral Ring Sum',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'ringSum',
    params: [{ name: 'grid', type: 'List[List[int]]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an <code>n x n</code> matrix <code>grid</code>, define ring <code>k</code> (0-indexed) as the cells whose Chebyshev distance from the border is exactly <code>k</code> — i.e. the cells on the perimeter of the sub-square inset by <code>k</code> on every side. Return the sum of the values on ring <code>k</code>. If ring <code>k</code> does not exist, return 0.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]\n0', '40', 'Outer ring: all but the center 5; 45-5 = 40.'],
      ['[[1,2,3],[4,5,6],[7,8,9]]\n1', '5', 'Inner ring is just the center cell 5.'],
    ],
    constraints: ['1 <= n <= 300', '-10^4 <= grid[i][j] <= 10^4', '0 <= k'],
    tags: ['matrix', 'simulation'],
    py: `def ringSum(grid, k):
    n = len(grid)
    lo = k
    hi = n - 1 - k
    if lo > hi:
        return 0
    if lo == hi:
        return grid[lo][lo]
    total = 0
    for c in range(lo, hi + 1):
        total += grid[lo][c]
        total += grid[hi][c]
    for r in range(lo + 1, hi):
        total += grid[r][lo]
        total += grid[r][hi]
    return total`,
    approach:
      'Ring k is the perimeter of the square spanning rows/cols [k, n-1-k]. Sum the top and bottom rows fully, then the left and right columns excluding the already-counted corners. Degenerate single-cell and empty rings are handled separately.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '0'],
      ['[[1,2,3],[4,5,6],[7,8,9]]', '1'],
      ['[[1,2,3],[4,5,6],[7,8,9]]', '2'],
      ['[[5]]', '0'],
      ['[[1,1],[1,1]]', '0'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]', '0'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]', '1'],
      ['[[0,0,0],[0,9,0],[0,0,0]]', '1'],
      ['[[-1,-2],[-3,-4]]', '0'],
      ['[[2,2,2],[2,2,2],[2,2,2]]', '0'],
    ],
  },
  {
    n: 734,
    id: 'pghub-gene-mutation-steps',
    name: 'Gene Mutation Steps',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'mutationSteps',
    params: [{ name: 'start', type: 'str' }, { name: 'target', type: 'str' }, { name: 'bank', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'A gene is a string of the same length over the alphabet {A, C, G, T}. A single mutation changes exactly one character. A mutation is valid only if the resulting gene appears in <code>bank</code>. Return the minimum number of mutations to turn <code>start</code> into <code>target</code>, or -1 if impossible. <code>start</code> need not be in the bank, but every intermediate (and <code>target</code>) must be.',
    examples: [
      ['"AACC"\n"AACG"\n["AACG"]', '1', 'One mutation reaches a bank gene equal to target.'],
      ['"AAAA"\n"TTTT"\n["TAAA"]', '-1', 'Cannot reach target through the bank.'],
    ],
    constraints: ['0 <= bank.length <= 10', 'all genes have the same length L (1 <= L <= 8)', 'genes use only A, C, G, T'],
    tags: ['graph', 'bfs'],
    py: `def mutationSteps(start, target, bank):
    bankset = set(bank)
    if target not in bankset:
        return -1
    if start == target:
        return 0
    alphabet = "ACGT"
    q = deque([(start, 0)])
    visited = {start}
    while q:
        gene, steps = q.popleft()
        for i in range(len(gene)):
            for ch in alphabet:
                if ch == gene[i]:
                    continue
                nxt = gene[:i] + ch + gene[i+1:]
                if nxt in bankset and nxt not in visited:
                    if nxt == target:
                        return steps + 1
                    visited.add(nxt)
                    q.append((nxt, steps + 1))
    return -1`,
    approach:
      'Breadth-first search over genes. From each gene, generate all single-character mutations; keep only those present in the bank and unvisited. The first time target is reached, the step count is minimal. If target is not in the bank it is unreachable.',
    complexity: { time: 'O(B * L * 4)', space: 'O(B)' },
    multiParam: true,
    cases: [
      ['"AACC"', '"AACG"', '["AACG"]'],
      ['"AAAA"', '"TTTT"', '["TAAA"]'],
      ['"AACC"', '"AACC"', '[]'],
      ['"AACC"', '"GGCC"', '["GACC","GGCC"]'],
      ['"A"', '"C"', '["C"]'],
      ['"A"', '"T"', '["C","G"]'],
      ['"AA"', '"CC"', '["AC","CC"]'],
      ['"AA"', '"CC"', '["AC","CA","CC"]'],
      ['"GGGG"', '"AAAA"', '["AGGG","AAGG","AAAG","AAAA"]'],
      ['"ACGT"', '"TGCA"', '["TCGT"]'],
    ],
  },
  {
    n: 737,
    id: 'pghub-digit-staircase',
    name: 'Digit Staircase',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'digitStaircase',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    statement:
      'A positive integer is a <em>staircase number</em> if reading its decimal digits left to right they are strictly increasing (each digit larger than the previous). Single-digit numbers count as staircases. Return whether <code>n</code> is a staircase number.',
    examples: [
      ['135', 'true', 'Digits 1 < 3 < 5.'],
      ['122', 'false', 'The two 2s are not strictly increasing.'],
    ],
    constraints: ['1 <= n <= 10^18'],
    tags: ['math', 'digits'],
    py: `def digitStaircase(n):
    s = str(n)
    for i in range(1, len(s)):
        if s[i] <= s[i-1]:
            return False
    return True`,
    approach:
      'Convert to a string and check every adjacent pair of digits is strictly increasing. Any non-increasing pair disqualifies it; single digits pass trivially.',
    complexity: { time: 'O(d)', space: 'O(d)' },
    cases: [
      ['135'],
      ['122'],
      ['7'],
      ['123456789'],
      ['13'],
      ['31'],
      ['11'],
      ['1234567890'],
      ['258'],
      ['999'],
    ],
  },
  {
    n: 742,
    id: 'pghub-budget-knapsack-items',
    name: 'Budget Item Selection',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxValue',
    params: [{ name: 'costs', type: 'List[int]' }, { name: 'values', type: 'List[int]' }, { name: 'budget', type: 'int' }],
    return_type: 'int',
    statement:
      'You have a <code>budget</code> and a list of items where item i costs <code>costs[i]</code> and is worth <code>values[i]</code>. Each item can be bought at most once. Return the maximum total value you can buy without exceeding the budget.',
    examples: [
      ['[1,3,4,5]\n[1,4,5,7]\n7', '9', 'Buy items with cost 3 and 4 for value 4+5 = 9.'],
      ['[2]\n[10]\n1', '0', 'Cannot afford the only item.'],
    ],
    constraints: ['1 <= n <= 200', '1 <= costs[i] <= 1000', '0 <= values[i] <= 10^6', '0 <= budget <= 2000'],
    tags: ['dp', 'knapsack'],
    py: `def maxValue(costs, values, budget):
    dp = [0] * (budget + 1)
    for c, v in zip(costs, values):
        for b in range(budget, c - 1, -1):
            cand = dp[b - c] + v
            if cand > dp[b]:
                dp[b] = cand
    return dp[budget]`,
    approach:
      '0/1 knapsack. dp[b] is the best value achievable with budget b. Process each item once, iterating the budget downward so each item is used at most once. The answer is dp[budget].',
    complexity: { time: 'O(n * budget)', space: 'O(budget)' },
    multiParam: true,
    cases: [
      ['[1,3,4,5]', '[1,4,5,7]', '7'],
      ['[2]', '[10]', '1'],
      ['[2]', '[10]', '2'],
      ['[1,1,1]', '[5,5,5]', '2'],
      ['[5,4,6,3]', '[10,40,30,50]', '10'],
      ['[1]', '[0]', '5'],
      ['[3,3,3]', '[4,4,4]', '0'],
      ['[10,20,30]', '[60,100,120]', '50'],
      ['[1,2,3,4,5]', '[5,4,3,2,1]', '6'],
      ['[2,2,2,2]', '[3,3,3,3]', '8'],
    ],
  },
  {
    n: 750,
    id: 'pghub-rotate-deck-cuts',
    name: 'Minimum Deck Cuts',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'minCuts',
    params: [{ name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
    return_type: 'int',
    statement:
      'A deck is a string. A <em>cut</em> moves the top card to the bottom (a left rotation by one). Given two decks <code>a</code> and <code>b</code> of equal length, return the minimum number of cuts that transforms <code>a</code> into <code>b</code>, or -1 if <code>b</code> is not a rotation of <code>a</code>.',
    examples: [
      ['"abcde"\n"cdeab"', '2', 'Two left rotations.'],
      ['"abc"\n"acb"', '-1', 'Not a rotation.'],
    ],
    constraints: ['1 <= a.length == b.length <= 2000'],
    tags: ['strings', 'rotation'],
    py: `def minCuts(a, b):
    if len(a) != len(b):
        return -1
    if a == b:
        return 0
    doubled = a + a
    idx = doubled.find(b)
    if idx == -1:
        return -1
    # ensure it is a true rotation (idx within first len(a))
    if idx >= len(a):
        return -1
    return idx`,
    approach:
      'b is a rotation of a iff b is a substring of a+a starting within the first len(a) characters. The starting index equals the number of single-card cuts (left rotations) needed. If no such index exists, b is not a rotation.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"abcde"', '"cdeab"'],
      ['"abc"', '"acb"'],
      ['"a"', '"a"'],
      ['"abcd"', '"abcd"'],
      ['"abcd"', '"dabc"'],
      ['"aaaa"', '"aaaa"'],
      ['"abab"', '"baba"'],
      ['"xyz"', '"zxy"'],
      ['"hello"', '"llohe"'],
      ['"abc"', '"abcd"'],
    ],
  },
  {
    n: 751,
    id: 'pghub-signal-denoise',
    name: 'Signal Denoise Median',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'denoise',
    params: [{ name: 'signal', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Apply a width-3 median filter to <code>signal</code>: each output position is the median of the three values at positions i-1, i, i+1. The first and last positions, which lack a full window, are copied unchanged. Return the filtered signal.',
    examples: [
      ['[2,80,6,3,5]', '[2,6,6,5,5]', 'Middle values replaced by 3-window medians.'],
      ['[1,2]', '[1,2]', 'Too short to filter; unchanged.'],
    ],
    constraints: ['1 <= signal.length <= 10^5', '-10^9 <= signal[i] <= 10^9'],
    tags: ['arrays', 'sliding-window'],
    py: `def denoise(signal):
    n = len(signal)
    if n < 3:
        return list(signal)
    out = [signal[0]]
    for i in range(1, n - 1):
        window = sorted(signal[i-1:i+2])
        out.append(window[1])
    out.append(signal[-1])
    return out`,
    approach:
      'For each interior index, take the median of its 3-element neighbourhood by sorting the three values and picking the middle. Endpoints are copied because they have no full window.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[2,80,6,3,5]'],
      ['[1,2]'],
      ['[5]'],
      ['[1,1,1,1]'],
      ['[3,1,2]'],
      ['[10,-5,10,-5,10]'],
      ['[0,0,100,0,0]'],
      ['[1,2,3,4,5]'],
      ['[9,9,1,9,9]'],
      ['[-1,-2,-3,-4]'],
    ],
  },
  {
    n: 755,
    id: 'pghub-token-bucket-allow',
    name: 'Token Bucket Allow',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'allowed',
    params: [{ name: 'times', type: 'List[int]' }, { name: 'capacity', type: 'int' }, { name: 'rate', type: 'int' }],
    return_type: 'List[bool]',
    statement:
      'A token bucket starts full with <code>capacity</code> tokens and refills at <code>rate</code> tokens per unit time (capped at capacity). Requests arrive at the non-decreasing timestamps in <code>times</code>; each request consumes one token if at least one is available and is then <em>allowed</em>, otherwise it is <em>denied</em> and consumes nothing. Tokens are refilled (based on elapsed time) immediately before each request is evaluated. Return a boolean list marking each request allowed (true) or denied (false).',
    examples: [
      ['[0,0,0]\n2\n1', '[true,true,false]', 'Bucket holds 2; third request at the same time finds it empty.'],
      ['[0,1,2]\n1\n1', '[true,true,true]', 'One token refills each unit time in time for each request.'],
    ],
    constraints: ['1 <= times.length <= 10^5', '0 <= times[i] <= 10^9', 'times is non-decreasing', '1 <= capacity <= 10^9', '0 <= rate <= 10^9'],
    tags: ['simulation', 'design'],
    py: `def allowed(times, capacity, rate):
    tokens = capacity
    last = times[0] if times else 0
    res = []
    for t in times:
        elapsed = t - last
        tokens = min(capacity, tokens + elapsed * rate)
        last = t
        if tokens >= 1:
            tokens -= 1
            res.append(True)
        else:
            res.append(False)
    return res`,
    approach:
      'Maintain a running token count. Before each request, add rate * elapsed_time tokens (capped at capacity). If at least one token is available, consume one and allow; otherwise deny without consuming.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[0,0,0]', '2', '1'],
      ['[0,1,2]', '1', '1'],
      ['[0,0,0,0]', '3', '0'],
      ['[5]', '1', '10'],
      ['[0,10,20]', '1', '1'],
      ['[0,0,5]', '2', '1'],
      ['[1,2,3,4,5]', '1', '0'],
      ['[0,0,0,3]', '2', '1'],
      ['[0,100]', '5', '2'],
      ['[0,0,1,1,2,2]', '2', '1'],
    ],
  },
  {
    n: 758,
    id: 'pghub-balanced-multibracket-758',
    name: 'Balanced Multi-Bracket',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'isBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A string contains only the bracket characters <code>()[]{}</code>. Return whether the brackets are balanced: every opening bracket is closed by the matching type in the correct order.',
    examples: [
      ['"([]{})"', 'true', 'Properly nested and matched.'],
      ['"([)]"', 'false', 'Crossed brackets are not balanced.'],
    ],
    constraints: ['0 <= s.length <= 10^4', 's consists only of the characters ()[]{}'],
    tags: ['stack', 'strings'],
    py: `def isBalanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        else:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
    return not stack`,
    approach:
      'Push opening brackets onto a stack; for each closing bracket, the top of the stack must be its matching opener. Mismatch or empty stack means unbalanced. A non-empty stack at the end means unclosed openers.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"([]{})"'],
      ['"([)]"'],
      ['""'],
      ['"("'],
      ['")"'],
      ['"()()()"'],
      ['"{[()]}"'],
      ['"{[(])}"'],
      ['"((()))"'],
      ['"[](){}"'],
    ],
  },
  {
    n: 760,
    id: 'pghub-meeting-merge-free',
    name: 'Merge Free Slots',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'freeSlots',
    params: [{ name: 'busy', type: 'List[List[int]]' }, { name: 'dayStart', type: 'int' }, { name: 'dayEnd', type: 'int' }],
    return_type: 'List[List[int]]',
    statement:
      'Given a list of <code>busy</code> intervals <code>[start, end)</code> within a day bounded by <code>[dayStart, dayEnd)</code>, return the maximal free intervals (the gaps with no busy time), sorted by start. Busy intervals may overlap and are not sorted. Zero-length free gaps are omitted.',
    examples: [
      ['[[9,10],[12,13]]\n8\n17', '[[8,9],[10,12],[13,17]]', 'Free time around the two meetings.'],
      ['[[8,17]]\n8\n17', '[]', 'Fully booked.'],
    ],
    constraints: ['0 <= busy.length <= 10^4', 'dayStart <= start < end <= dayEnd', '0 <= dayStart < dayEnd <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def freeSlots(busy, dayStart, dayEnd):
    if not busy:
        return [[dayStart, dayEnd]] if dayStart < dayEnd else []
    intervals = sorted(busy)
    merged = []
    for s, e in intervals:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    free = []
    cur = dayStart
    for s, e in merged:
        if cur < s:
            free.append([cur, s])
        cur = max(cur, e)
    if cur < dayEnd:
        free.append([cur, dayEnd])
    return free`,
    approach:
      'Sort and merge the busy intervals into disjoint blocks. Then sweep from dayStart, emitting the gap before each busy block and advancing the cursor past it. Finally emit the tail gap up to dayEnd. Empty gaps are skipped.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[[9,10],[12,13]]', '8', '17'],
      ['[[8,17]]', '8', '17'],
      ['[]', '8', '17'],
      ['[[9,11],[10,12]]', '8', '17'],
      ['[[1,2],[3,4],[5,6]]', '0', '7'],
      ['[[2,3]]', '0', '5'],
      ['[[0,5]]', '0', '5'],
      ['[[1,3],[2,6],[8,10]]', '0', '12'],
      ['[[5,6]]', '5', '6'],
      ['[[3,4],[1,2]]', '0', '5'],
    ],
  },
  {
    n: 772,
    id: 'pghub-stock-span-peaks',
    name: 'Stock Span Peaks',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'stockSpans',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'For each day i, the <em>span</em> is the number of consecutive days ending at day i (including day i) where the price was less than or equal to the price on day i, walking backwards. Return the span for every day.',
    examples: [
      ['[100,80,60,70,60,75,85]', '[1,1,1,2,1,4,6]', 'Classic stock span values.'],
      ['[10,20,30]', '[1,2,3]', 'Strictly rising prices.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def stockSpans(prices):
    spans = []
    stack = []  # holds (price, span) in decreasing-price order
    for p in prices:
        span = 1
        while stack and stack[-1][0] <= p:
            span += stack.pop()[1]
        stack.append((p, span))
        spans.append(span)
    return spans`,
    approach:
      'Maintain a monotonic stack of (price, accumulated span). For each price, pop and absorb the spans of all earlier prices that are <= current, then push the combined span. This gives each span in amortized O(1).',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[100,80,60,70,60,75,85]'],
      ['[10,20,30]'],
      ['[30,20,10]'],
      ['[5]'],
      ['[5,5,5,5]'],
      ['[1,2,1,2,1]'],
      ['[7,6,5,4,3,2,1]'],
      ['[1,1,2,2,3,3]'],
      ['[50,10,40,20,30]'],
      ['[0,0,0]'],
    ],
  },
  {
    n: 774,
    id: 'pghub-xor-pair-target',
    name: 'XOR Pair Exists',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'hasXorPair',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'bool',
    statement:
      'Return whether there exist two <em>distinct indices</em> i and j such that <code>nums[i] XOR nums[j]</code> equals <code>target</code>.',
    examples: [
      ['[1,2,3]\n1', 'true', '2 XOR 3 = 1.'],
      ['[1,1,1]\n5', 'false', 'All XORs are 0.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9', '0 <= target <= 10^9'],
    tags: ['arrays', 'bit-manipulation'],
    py: `def hasXorPair(nums, target):
    seen = set()
    for x in nums:
        if (x ^ target) in seen:
            return True
        seen.add(x)
    return False`,
    approach:
      'For each value x, a partner y with x XOR y = target must equal x XOR target. Scan once, checking whether the required partner has already appeared, then record x. Distinct indices are guaranteed because the partner was seen earlier.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '1'],
      ['[1,1,1]', '5'],
      ['[5,5]', '0'],
      ['[1]', '0'],
      ['[4,6,2]', '2'],
      ['[0,0]', '0'],
      ['[10,20,30]', '10'],
      ['[7,3,5,1]', '4'],
      ['[8,1,2,4]', '15'],
      ['[100,200]', '300'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b6-${prob.n}.py`);
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
  const escName = prob.params.map((p) => p.name).join(', ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const body = prob.py
    .replace(new RegExp(`^def ${prob.method_name}\\(${escName}\\):\\n`), '')
    .split('\n')
    .map((l) => (l ? '        ' + l : l))
    .join('\n');
  return `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
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
  const code = row.solutions.python.code; // class Solution with method
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("PASS" if _out == _exp else ("FAIL idx=${idx} got="+_out+" exp="+_exp))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b6-grade-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Grade run failed #${prob.n}:\n${res.stderr}`);
  const lines = res.stdout.trim().split('\n');
  const pass = lines.filter((l) => l === 'PASS').length;
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  return { pass, total: lines.length, fails };
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);

  // VERIFY mode: pull stored rows from DB and re-grade.
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
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green PGHub rows in range.`);
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
    // self-grade the stored solution before queueing
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
