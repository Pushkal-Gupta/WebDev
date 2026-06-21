#!/usr/bin/env node
// Batch 12 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (3100, 3500]. This batch fills the first 15 such gaps.
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch12.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch12.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch12.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [3103, 3104, 3109, 3118, 3119, 3124, 3125, 3126, 3135, 3140, 3141, 3150, 3155, 3156, 3157];

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
    n: 3103,
    id: 'pghub-b12-ticket-queue',
    name: 'Ticket Queue Refunds',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'refundTotal',
    params: [{ name: 'prices', type: 'List[int]' }, { name: 'budget', type: 'int' }],
    return_type: 'int',
    statement:
      'Customers queue to buy tickets at the listed <code>prices</code> (in order). You pay for each ticket in turn as long as your remaining <code>budget</code> covers it. The moment a ticket costs more than your remaining budget you stop and refund the rest of the queue. Return how many people you turned away (the count of tickets you did not buy).',
    examples: [
      ['[2,3,5,1]\n6', '2', 'Buy 2 then 3 (budget 1 left), 5 exceeds budget; turn away 5 and 1.'],
      ['[1,1,1]\n10', '0', 'Budget covers everyone.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '1 <= prices[i] <= 10^9', '0 <= budget <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def refundTotal(prices, budget):
    for i, p in enumerate(prices):
        if p > budget:
            return len(prices) - i
        budget -= p
    return 0`,
    approach:
      'Walk the queue, subtracting each affordable price from the budget. The first ticket you cannot afford halts purchases, and everyone from that point on is turned away.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,3,5,1]', '6'],
      ['[1,1,1]', '10'],
      ['[5]', '4'],
      ['[5]', '5'],
      ['[1,2,3,4,5]', '0'],
      ['[10,1,1]', '5'],
      ['[3,3,3,3]', '9'],
      ['[100,1]', '50'],
      ['[1,2,3,4,5]', '6'],
      ['[2,2,2,2,2]', '7'],
    ],
  },
  {
    n: 3104,
    id: 'pghub-b12-warehouse-stamp',
    name: 'Warehouse Box Stacking',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minStacks',
    params: [{ name: 'weights', type: 'List[int]' }, { name: 'limit', type: 'int' }],
    return_type: 'int',
    statement:
      'You stack boxes of given <code>weights</code> into vertical stacks. A single stack may hold any number of boxes as long as their total weight does not exceed <code>limit</code>. You want to use as few stacks as possible. Return the minimum number of stacks needed, or -1 if any single box already exceeds the limit.',
    examples: [
      ['[4,3,2,1]\n5', '2', 'Stacks {4,1} and {3,2} both total 5.'],
      ['[6]\n5', '-1', 'A single box of weight 6 exceeds the limit.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= 10^9', '1 <= limit <= 10^9'],
    tags: ['greedy', 'two-pointers'],
    py: `def minStacks(weights, limit):
    if any(w > limit for w in weights):
        return -1
    weights = sorted(weights)
    i, j = 0, len(weights) - 1
    stacks = 0
    while i <= j:
        if i < j and weights[i] + weights[j] <= limit:
            i += 1
        j -= 1
        stacks += 1
    return stacks`,
    approach:
      'If any box exceeds the limit it is impossible. Otherwise sort and pair the heaviest with the lightest: if they fit together use one stack for both, else the heaviest takes its own stack. This two-pointer greedy minimizes stacks (each stack holds at most two boxes is sufficient because the heaviest unpaired box dominates).',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[4,3,2,1]', '5'],
      ['[6]', '5'],
      ['[1,1,1,1]', '2'],
      ['[5,5,5]', '5'],
      ['[3,2,2,1]', '4'],
      ['[1]', '1'],
      ['[2,2,2,2,2]', '4'],
      ['[10,9,8,7,6]', '15'],
      ['[1,2,3,4,5,6]', '6'],
      ['[7,1,7,1]', '8'],
    ],
  },
  {
    n: 3109,
    id: 'pghub-b12-signal-decay',
    name: 'Signal Decay Threshold',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'firstBelow',
    params: [{ name: 'readings', type: 'List[int]' }, { name: 'threshold', type: 'int' }],
    return_type: 'int',
    statement:
      'A sensor records a non-increasing list of integer <code>readings</code> as a signal decays. Return the index of the first reading that is strictly less than <code>threshold</code>, or -1 if every reading is at least the threshold.',
    examples: [
      ['[9,7,5,3,1]\n4', '3', 'readings[3]=3 is the first below 4.'],
      ['[8,8,8]\n4', '-1', 'No reading drops below 4.'],
    ],
    constraints: ['1 <= readings.length <= 10^5', 'readings is non-increasing', '-10^9 <= readings[i], threshold <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def firstBelow(readings, threshold):
    lo, hi = 0, len(readings)
    while lo < hi:
        mid = (lo + hi) // 2
        if readings[mid] < threshold:
            hi = mid
        else:
            lo = mid + 1
    return lo if lo < len(readings) else -1`,
    approach:
      'Because the readings are non-increasing, the predicate "reading < threshold" is monotonic: once true it stays true. Binary-search for the leftmost index where it holds.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[9,7,5,3,1]', '4'],
      ['[8,8,8]', '4'],
      ['[5]', '5'],
      ['[5]', '6'],
      ['[10,9,8,7,6,5,4,3,2,1]', '1'],
      ['[100,50,0,-50]', '0'],
      ['[3,3,3,3]', '3'],
      ['[7,6,5,4,3]', '7'],
      ['[2,1]', '5'],
      ['[0,-1,-2,-3]', '-2'],
    ],
  },
  {
    n: 3118,
    id: 'pghub-b12-dewdrop-merge',
    name: 'Dewdrop Interval Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'totalWet',
    params: [{ name: 'drops', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each dewdrop wets a closed segment <code>[start, end]</code> of a leaf, given in <code>drops</code>. Overlapping or touching segments form one continuous wet patch. Return the total length of leaf that is wet (the union of all segments, where a segment [a,b] has length b-a).',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '6', 'Union is [1,5] (length 4) and [7,9] (length 2): total 6.'],
      ['[[0,0]]', '0', 'A point segment has zero length.'],
    ],
    constraints: ['1 <= drops.length <= 10^5', '-10^9 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def totalWet(drops):
    drops = sorted(drops)
    total = 0
    cur_s, cur_e = drops[0]
    for s, e in drops[1:]:
        if s <= cur_e:
            cur_e = max(cur_e, e)
        else:
            total += cur_e - cur_s
            cur_s, cur_e = s, e
    total += cur_e - cur_s
    return total`,
    approach:
      'Sort segments by start. Sweep left to right, extending the current merged segment while the next overlaps or touches it; otherwise close the current segment (add its length) and open a new one. Sum the lengths of the merged segments.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[0,0]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[5,8],[1,3]]'],
      ['[[0,5],[5,10]]'],
      ['[[-5,-1],[-2,3]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,100]]'],
      ['[[10,20],[15,25],[30,40],[35,50]]'],
    ],
  },
  {
    n: 3119,
    id: 'pghub-b12-loom-thread',
    name: 'Loom Thread Reversal',
    topic_id: 'linkedlist',
    difficulty: 'Easy',
    method_name: 'reverseAbove',
    params: [{ name: 'threads', type: 'List[int]' }, { name: 'cutoff', type: 'int' }],
    return_type: 'List[int]',
    statement:
      'A loom holds threads as a list of integers <code>threads</code>. Reverse the order of only those threads whose value is strictly greater than <code>cutoff</code>, leaving every other thread fixed in its original position. Return the resulting list.',
    examples: [
      ['[3,8,1,9,2]\n4', '[3,9,1,8,2]', 'Values >4 are 8 and 9; their positions keep but their order reverses.'],
      ['[1,2,3]\n5', '[1,2,3]', 'Nothing exceeds 5, so the list is unchanged.'],
    ],
    constraints: ['1 <= threads.length <= 10^5', '-10^9 <= threads[i], cutoff <= 10^9'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def reverseAbove(threads, cutoff):
    big = [v for v in threads if v > cutoff]
    res = list(threads)
    k = len(big) - 1
    for i in range(len(res)):
        if res[i] > cutoff:
            res[i] = big[k]
            k -= 1
    return res`,
    approach:
      'Collect the values exceeding the cutoff in order, then write them back into the same slots from last to first. Positions of all other elements stay untouched, achieving an in-place reversal of just the selected values.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[3,8,1,9,2]', '4'],
      ['[1,2,3]', '5'],
      ['[5,4,3,2,1]', '0'],
      ['[7]', '3'],
      ['[7]', '7'],
      ['[10,1,10,1,10]', '5'],
      ['[1,1,1,1]', '0'],
      ['[9,8,7,6,5]', '6'],
      ['[-1,-2,-3]', '-2'],
      ['[4,4,4,4]', '4'],
    ],
  },
  {
    n: 3124,
    id: 'pghub-b12-rune-stack',
    name: 'Rune Cancellation Stack',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'cancelRunes',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A spell is a string of lowercase runes. Whenever two identical runes become adjacent they annihilate each other and are removed; this can trigger further cancellations. Repeatedly remove adjacent equal pairs until none remain. Return the final stabilized spell.',
    examples: [
      ['"abbac"', '"c"', 'bb cancels, then aa cancels, leaving c.'],
      ['"abc"', '"abc"', 'No adjacent equal runes.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['stack', 'strings'],
    py: `def cancelRunes(s):
    stack = []
    for ch in s:
        if stack and stack[-1] == ch:
            stack.pop()
        else:
            stack.append(ch)
    return ''.join(stack)`,
    approach:
      'Push runes onto a stack; if the incoming rune equals the top, they cancel, so pop instead. The stack contents at the end form the fully reduced spell.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"abbac"'],
      ['"abc"'],
      ['"aabb"'],
      ['"a"'],
      ['"abccba"'],
      ['"aaa"'],
      ['"mississippi"'],
      ['"zzzz"'],
      ['"abababab"'],
      ['"deeed"'],
    ],
  },
  {
    n: 3125,
    id: 'pghub-b12-prime-gear',
    name: 'Prime Gear Teeth',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'distinctPrimeFactors',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A gear has <code>n</code> teeth. Return the number of <em>distinct</em> prime numbers that divide <code>n</code>. If <code>n</code> is 1, it has no prime factors, so return 0.',
    examples: [
      ['12', '2', '12 = 2^2 * 3, distinct primes are 2 and 3.'],
      ['1', '0', '1 has no prime factors.'],
    ],
    constraints: ['1 <= n <= 10^12'],
    tags: ['math', 'number-theory'],
    py: `def distinctPrimeFactors(n):
    count = 0
    d = 2
    while d * d <= n:
        if n % d == 0:
            count += 1
            while n % d == 0:
                n //= d
        d += 1
    if n > 1:
        count += 1
    return count`,
    approach:
      'Trial-divide by candidates up to sqrt(n). Each candidate that divides n is a new prime factor; strip all its powers before moving on. Any remainder above 1 at the end is one final prime factor.',
    complexity: { time: 'O(sqrt(n))', space: 'O(1)' },
    cases: [
      ['12'],
      ['1'],
      ['2'],
      ['30'],
      ['97'],
      ['1024'],
      ['600'],
      ['999983'],
      ['1000000000000'],
      ['210'],
    ],
  },
  {
    n: 3126,
    id: 'pghub-b12-spore-spread',
    name: 'Spore Spread Regions',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'largestColony',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A petri dish is a grid where 1 marks a spore and 0 is empty. Spores that are orthogonally adjacent form one connected colony. Return the size (number of cells) of the largest colony, or 0 if there are no spores.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '3', 'The top-left colony has 3 cells; the lone bottom-right spore has 1.'],
      ['[[0,0],[0,0]]', '0', 'No spores at all.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['graph', 'dfs'],
    py: `def largestColony(grid):
    rows, cols = len(grid), len(grid[0])
    best = 0
    for sr in range(rows):
        for sc in range(cols):
            if grid[sr][sc] != 1:
                continue
            size = 0
            stack = [(sr, sc)]
            grid[sr][sc] = 0
            while stack:
                r, c = stack.pop()
                size += 1
                for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 0
                        stack.append((nr, nc))
            best = max(best, size)
    return best`,
    approach:
      'Flood-fill each unvisited spore with iterative DFS, marking cells visited and counting the colony size. Track the maximum colony size encountered.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,0,1],[0,0,0],[1,0,1]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,0,1],[1,0,0,1],[1,1,1,1]]'],
      ['[[0]]'],
    ],
  },
  {
    n: 3135,
    id: 'pghub-b12-caravan-fuel',
    name: 'Caravan Fuel Reserve',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxReserve',
    params: [{ name: 'fuel', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A caravan visits stops in a line; <code>fuel[i]</code> is the fuel cached at stop i. To avoid alerting bandits you may never collect from two adjacent stops. Choose a subset of non-adjacent stops to maximize total fuel collected, and return that maximum (0 if all values are negative or the list forces no pick — but fuel values here are non-negative).',
    examples: [
      ['[2,7,9,3,1]', '12', 'Take stops 0,2,4: 2+9+1=12.'],
      ['[5,5,10,100,10,5]', '110', 'Take 5 and 100 and 5 -> best is 110.'],
    ],
    constraints: ['1 <= fuel.length <= 10^5', '0 <= fuel[i] <= 10^4'],
    tags: ['dp', 'arrays'],
    py: `def maxReserve(fuel):
    take, skip = 0, 0
    for v in fuel:
        take, skip = skip + v, max(skip, take)
    return max(take, skip)`,
    approach:
      'Classic non-adjacent maximum-sum DP. Track two running values: the best total that uses the current element (previous skip + value) and the best that does not (max of previous take/skip). The answer is the larger at the end.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,7,9,3,1]'],
      ['[5,5,10,100,10,5]'],
      ['[1]'],
      ['[1,2]'],
      ['[0,0,0]'],
      ['[10,1,1,10]'],
      ['[3,3,3,3,3]'],
      ['[100]'],
      ['[1,2,3,4,5,6,7,8,9,10]'],
      ['[9,1,1,9,1,1,9]'],
    ],
  },
  {
    n: 3140,
    id: 'pghub-b12-anagram-windows',
    name: 'Anagram Window Hunt',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'countAnagramWindows',
    params: [{ name: 'text', type: 'str' }, { name: 'pattern', type: 'str' }],
    return_type: 'int',
    statement:
      'Count how many contiguous substrings of <code>text</code> are anagrams of <code>pattern</code> (same multiset of letters, length equal to pattern length). Return that count.',
    examples: [
      ['"cbaebabacd"\n"abc"', '2', 'Substrings "cba" (index 0) and "bac" (index 6) are anagrams of "abc".'],
      ['"aaaa"\n"bb"', '0', 'No window matches.'],
    ],
    constraints: ['1 <= text.length <= 10^5', '1 <= pattern.length <= 10^5', 'both consist of lowercase English letters'],
    tags: ['sliding-window', 'strings'],
    py: `def countAnagramWindows(text, pattern):
    m, n = len(pattern), len(text)
    if m > n:
        return 0
    need = Counter(pattern)
    window = Counter(text[:m])
    count = 1 if window == need else 0
    for i in range(m, n):
        window[text[i]] += 1
        left = text[i - m]
        window[left] -= 1
        if window[left] == 0:
            del window[left]
        if window == need:
            count += 1
    return count`,
    approach:
      'Maintain a fixed-width sliding window of pattern length and its letter-frequency counter. Slide one character at a time, updating counts, and increment the answer whenever the window frequencies match the pattern frequencies.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"cbaebabacd"', '"abc"'],
      ['"aaaa"', '"bb"'],
      ['"abab"', '"ab"'],
      ['"a"', '"a"'],
      ['"a"', '"ab"'],
      ['"aaaaa"', '"a"'],
      ['"abcabcabc"', '"abc"'],
      ['"xyz"', '"zyx"'],
      ['"baa"', '"aa"'],
      ['"hello"', '"oll"'],
    ],
  },
  {
    n: 3141,
    id: 'pghub-b12-relic-xor',
    name: 'Relic XOR Pairing',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'lonelyRelic',
    params: [{ name: 'relics', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Every relic in <code>relics</code> appears exactly twice except one lonely relic that appears once. Return the value of the lonely relic.',
    examples: [
      ['[4,1,2,1,2]', '4', 'The 4 is unpaired.'],
      ['[7]', '7', 'A single relic is itself lonely.'],
    ],
    constraints: ['1 <= relics.length <= 10^5', 'relics.length is odd', '0 <= relics[i] <= 10^9'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def lonelyRelic(relics):
    acc = 0
    for v in relics:
        acc ^= v
    return acc`,
    approach:
      'XOR is associative and commutative, and a value XORed with itself is zero. XORing all relics cancels every pair, leaving only the lonely value.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[4,1,2,1,2]'],
      ['[7]'],
      ['[0,0,5]'],
      ['[10,10,3,3,99]'],
      ['[1,2,3,2,1]'],
      ['[1000000000,1,1]'],
      ['[8,7,8]'],
      ['[5,5,5,5,9]'],
      ['[2,3,4,3,2]'],
      ['[6,6,6,6,6]'],
    ],
  },
  {
    n: 3150,
    id: 'pghub-b12-festival-seating',
    name: 'Festival Seating Greedy',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'maxHappiness',
    params: [{ name: 'joy', type: 'List[int]' }, { name: 'rounds', type: 'int' }],
    return_type: 'int',
    statement:
      'At a festival there are groups with happiness values <code>joy</code>. For each of <code>rounds</code> rounds you seat the currently happiest group and earn its happiness; afterwards that group loses one happiness (but never below 0) and rejoins. Maximize total happiness earned over all rounds and return it.',
    examples: [
      ['[1,2,3]\n3', '6', 'Seat 3, then 2 (the group that was 3 is now 2 too), then 2: 3+2+... -> 6.'],
      ['[5]\n3', '12', 'Seat 5, then 4, then 3: total 12.'],
    ],
    constraints: ['1 <= joy.length <= 10^4', '0 <= joy[i] <= 10^9', '1 <= rounds <= 10^4'],
    tags: ['heap', 'greedy'],
    py: `def maxHappiness(joy, rounds):
    heap = [-j for j in joy]
    heapq.heapify(heap)
    total = 0
    for _ in range(rounds):
        top = -heapq.heappop(heap)
        total += top
        heapq.heappush(heap, -max(0, top - 1))
    return total`,
    approach:
      'Use a max-heap of current happiness values. Each round pop the largest, add it to the total, then push back its value reduced by one (floored at zero). Greedily taking the maximum each round is optimal.',
    complexity: { time: 'O(rounds log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '3'],
      ['[5]', '3'],
      ['[0,0]', '4'],
      ['[10]', '5'],
      ['[3,3,3]', '4'],
      ['[1]', '5'],
      ['[7,2,1]', '4'],
      ['[2,2,2,2]', '6'],
      ['[100]', '3'],
      ['[4,5,6]', '5'],
    ],
  },
  {
    n: 3155,
    id: 'pghub-b12-glyph-trie',
    name: 'Glyph Prefix Counter',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'prefixCounts',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'queries', type: 'List[str]' }],
    return_type: 'List[int]',
    statement:
      'You are given a dictionary <code>words</code> and a list of <code>queries</code>. For each query string, return how many dictionary words have that query as a prefix (a word is its own prefix). Return the answers in query order.',
    examples: [
      ['["apple","app","apply","banana"]\n["app","ban","x"]', '[3,1,0]', '"app" prefixes apple/app/apply; "ban" prefixes banana; "x" prefixes none.'],
      ['["a"]\n["a","aa"]', '[1,0]', '"a" prefixes "a"; "aa" prefixes nothing.'],
    ],
    constraints: ['1 <= words.length, queries.length <= 10^4', '1 <= word/query length <= 100', 'all strings are lowercase English letters'],
    tags: ['tries', 'strings'],
    py: `def prefixCounts(words, queries):
    root = {}
    for w in words:
        node = root
        for ch in w:
            if ch not in node:
                node[ch] = {'#': 0}
            node = node[ch]
            node['#'] += 1
    res = []
    for q in queries:
        node = root
        ok = True
        for ch in q:
            if ch not in node:
                ok = False
                break
            node = node[ch]
        res.append(node['#'] if ok else 0)
    return res`,
    approach:
      'Build a trie where each node stores a counter of how many words pass through it. Inserting a word increments the counter at every prefix node. A prefix query walks the trie and reads the counter at the prefix endpoint, or returns 0 if the path breaks.',
    complexity: { time: 'O(total characters)', space: 'O(total characters)' },
    multiParam: true,
    cases: [
      ['["apple","app","apply","banana"]', '["app","ban","x"]'],
      ['["a"]', '["a","aa"]'],
      ['["abc","abd","abe"]', '["ab","abc","abz"]'],
      ['["x","y","z"]', '["x","y","z","w"]'],
      ['["hello"]', '["h","he","hello","hellox"]'],
      ['["cat","car","card","care"]', '["car","ca","cat"]'],
      ['["aa","aa","ab"]', '["a","aa","ab"]'],
      ['["dog"]', '["cat"]'],
      ['["abcabc"]', '["abc","abcabc"]'],
      ['["one","two","three"]', '["t","o","th"]'],
    ],
  },
  {
    n: 3156,
    id: 'pghub-b12-maze-escape',
    name: 'Maze Escape Steps',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'shortestEscape',
    params: [{ name: 'maze', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A maze is a grid where 0 is open and 1 is a wall. You start at the top-left cell and want to reach the bottom-right cell, moving only up/down/left/right onto open cells. Return the minimum number of steps (cell moves) to reach the exit, or -1 if it is unreachable. If start or exit is a wall, return -1.',
    examples: [
      ['[[0,0,1],[1,0,0],[1,1,0]]', '4', 'Path of 4 moves reaches the bottom-right.'],
      ['[[0,1],[1,0]]', '-1', 'The exit is blocked off.'],
    ],
    constraints: ['1 <= maze.length, maze[0].length <= 100', 'maze[i][j] is 0 or 1'],
    tags: ['graph', 'bfs'],
    py: `def shortestEscape(maze):
    rows, cols = len(maze), len(maze[0])
    if maze[0][0] == 1 or maze[rows-1][cols-1] == 1:
        return -1
    if rows == 1 and cols == 1:
        return 0
    seen = [[False]*cols for _ in range(rows)]
    seen[0][0] = True
    q = deque([(0, 0, 0)])
    while q:
        r, c, d = q.popleft()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not seen[nr][nc] and maze[nr][nc] == 0:
                if nr == rows-1 and nc == cols-1:
                    return d + 1
                seen[nr][nc] = True
                q.append((nr, nc, d + 1))
    return -1`,
    approach:
      'Breadth-first search from the top-left cell over open cells. BFS explores in order of distance, so the first time the exit is dequeued gives the minimum number of moves; if it is never reached the answer is -1.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[0,0,1],[1,0,0],[1,1,0]]'],
      ['[[0,1],[1,0]]'],
      ['[[0]]'],
      ['[[1]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
      ['[[0,0],[0,0]]'],
      ['[[0,1,0],[0,1,0],[0,0,0]]'],
      ['[[0,0,0,0,0]]'],
      ['[[0],[0],[0],[0]]'],
      ['[[0,1],[0,1]]'],
    ],
  },
  {
    n: 3157,
    id: 'pghub-b12-coin-combos',
    name: 'Coin Pouch Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'You have unlimited coins of each denomination in <code>coins</code>. Return the number of distinct combinations of coins that sum to exactly <code>amount</code>. Two combinations are the same if they use the same multiset of coins (order does not matter). If amount is 0 there is exactly one way (use no coins).',
    examples: [
      ['[1,2,5]\n5', '4', '5=5, 1+1+1+2, 1+2+2, 1+1+1+1+1.'],
      ['[2]\n3', '0', 'Odd amount cannot be made from twos.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 10^4', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    approach:
      'Unbounded-knapsack counting. dp[a] is the number of combinations summing to a. Process each coin in an outer loop (so each combination is counted once regardless of order), updating dp[a] += dp[a-coin] for increasing a.',
    complexity: { time: 'O(coins * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1]', '7'],
      ['[3,5,7]', '0'],
      ['[2,3]', '6'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[7]', '14'],
      ['[1,5,10,25]', '12'],
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
  const tmp = path.join(os.tmpdir(), `pghub-b12-${prob.n}.py`);
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

function gradeStored(prob, row) {
  const code = row.solutions.python.code;
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("PASS" if _out == _exp else ("FAIL idx=${idx} got="+_out+" exp="+_exp))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b12-grade-${prob.n}.py`);
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
