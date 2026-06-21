#!/usr/bin/env node
// Batch 35 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2377,2378,2387,2388,2394,2403,2408,2417,2422,2431,2436,2445,2450,2459,2461
//
//   node scripts/fill-gap-problems-batch35.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch35.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch35.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2377, 2378, 2387, 2388, 2394, 2403, 2408, 2417, 2422, 2431, 2436, 2445, 2450, 2459, 2461];

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
    n: 2377,
    id: 'pghub-b35-warehouse-aisles',
    name: 'Warehouse Aisle Stock',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'busiestAisle',
    params: [{ name: 'stock', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A warehouse has a row of aisles whose item counts are listed in <code>stock</code>. Return the index of the aisle holding the most items. If several aisles tie for the maximum, return the smallest such index.',
    examples: [
      ['[3,7,7,2]', '1', 'Aisles 1 and 2 both hold 7; the smaller index is 1.'],
      ['[5]', '0', 'Only one aisle exists.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^9'],
    tags: ['arrays'],
    py: `def busiestAisle(stock):
    best_idx = 0
    for i in range(1, len(stock)):
        if stock[i] > stock[best_idx]:
            best_idx = i
    return best_idx`,
    approach:
      'Scan once, tracking the index of the largest value seen so far. Only replace it on a strictly greater value, which naturally keeps the smallest index among ties.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,7,7,2]'],
      ['[5]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[0,0,0,0]'],
      ['[9,9,9,1]'],
      ['[2,2,8,8,2]'],
      ['[1000000000,1]'],
      ['[1,3,3,3,1]'],
      ['[4,4,4,4,5]'],
    ],
  },
  {
    n: 2378,
    id: 'pghub-b35-palindrome-rungs',
    name: 'Palindrome Ladder Count',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'countPalindromeWords',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'You are given a list of lowercase <code>words</code>. Return how many of them are palindromes, meaning the word reads the same forwards and backwards.',
    examples: [
      ['["level","cat","noon"]', '2', '"level" and "noon" are palindromes; "cat" is not.'],
      ['["ab","ba"]', '0', 'Neither word reads the same reversed.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words[i] is lowercase letters'],
    tags: ['strings', 'two-pointers'],
    py: `def countPalindromeWords(words):
    count = 0
    for w in words:
        if w == w[::-1]:
            count += 1
    return count`,
    approach:
      'For each word, compare it against its reverse; equal means palindrome. Tally the matches.',
    complexity: { time: 'O(total characters)', space: 'O(max word length)' },
    cases: [
      ['["level","cat","noon"]'],
      ['["ab","ba"]'],
      ['["a","b","c"]'],
      ['["racecar"]'],
      ['["abccba","abcba","abc"]'],
      ['["xx","yy","xy"]'],
      ['["madam","sir","rotor","wow"]'],
      ['["aaaa","aaa","aa","a"]'],
      ['["hello","world"]'],
      ['["deified","civic","kayak","banana"]'],
    ],
  },
  {
    n: 2387,
    id: 'pghub-b35-ticket-window',
    name: 'Ticket Queue Service Time',
    topic_id: 'queue',
    difficulty: 'Easy',
    method_name: 'serviceTime',
    params: [
      { name: 'durations', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People stand in a single line at a ticket window; person <code>i</code> (0-indexed) needs <code>durations[i]</code> minutes to be served, and they are served strictly in order. Return the minute count at which the person at index <code>target</code> finishes being served (service starts at minute 0).',
    examples: [
      ['[2,3,1]\n1', '5', 'Person 0 finishes at 2, person 1 finishes at 5.'],
      ['[4]\n0', '4', 'The only person finishes after 4 minutes.'],
    ],
    constraints: ['1 <= durations.length <= 10^5', '0 <= target < durations.length', '1 <= durations[i] <= 10^4'],
    tags: ['queue', 'arrays'],
    py: `def serviceTime(durations, target):
    elapsed = 0
    for i in range(target + 1):
        elapsed += durations[i]
    return elapsed`,
    approach:
      'Because service is strictly first-come, the finish time of the target person is simply the cumulative sum of service durations from the front of the line up to and including that person.',
    complexity: { time: 'O(target)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,3,1]', '1'],
      ['[4]', '0'],
      ['[1,1,1,1,1]', '4'],
      ['[5,5,5]', '2'],
      ['[10,1,1,1]', '0'],
      ['[3,3,3,3]', '3'],
      ['[2,2,2,2,2]', '2'],
      ['[7,8,9]', '1'],
      ['[1,2,3,4,5,6]', '5'],
      ['[100,1]', '1'],
    ],
  },
  {
    n: 2388,
    id: 'pghub-b35-toll-booths',
    name: 'Minimum Toll Coins',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minCoins',
    params: [{ name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'A toll machine accepts coins worth 1, 5, 10, 25, and 100 units. Return the minimum number of coins needed to pay exactly <code>amount</code> units.',
    examples: [
      ['30', '2', 'A 25-coin and a 5-coin pay 30 with two coins.'],
      ['7', '3', 'One 5-coin and two 1-coins.'],
    ],
    constraints: ['0 <= amount <= 10^9'],
    tags: ['greedy', 'math'],
    py: `def minCoins(amount):
    coins = [100, 25, 10, 5, 1]
    count = 0
    for c in coins:
        count += amount // c
        amount %= c
    return count`,
    approach:
      'This particular coin system is canonical, so a greedy pass works: repeatedly take as many of the largest coin as fit, then move to the next smaller coin. The denominations divide cleanly enough that greedy never overshoots an optimal count.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['30'],
      ['7'],
      ['0'],
      ['100'],
      ['99'],
      ['125'],
      ['1'],
      ['4'],
      ['250'],
      ['1000000000'],
    ],
  },
  {
    n: 2394,
    id: 'pghub-b35-cargo-balance',
    name: 'Cargo Hold Balance Point',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'balancePoint',
    params: [{ name: 'masses', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A cargo hold has bays in a row with masses <code>masses</code>. Return the smallest index <code>i</code> such that the total mass strictly left of <code>i</code> equals the total mass strictly right of <code>i</code>. If no such index exists, return <code>-1</code>.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 is 1+7+3=11; right is 5+6=11.'],
      ['[1,2,3]', '-1', 'No index splits the masses into equal halves.'],
    ],
    constraints: ['1 <= masses.length <= 10^5', '0 <= masses[i] <= 10^4'],
    tags: ['arrays', 'first-order'],
    py: `def balancePoint(masses):
    total = sum(masses)
    left = 0
    for i, m in enumerate(masses):
        if left == total - left - m:
            return i
        left += m
    return -1`,
    approach:
      'Keep a running sum of everything to the left. At each index the right sum is the grand total minus the left sum minus the current element; when those match, that index balances. Return the first such index.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'],
      ['[1,2,3]'],
      ['[2,1,-1]'],
      ['[0]'],
      ['[0,0,0,0]'],
      ['[5,5]'],
      ['[10,0,10]'],
      ['[1,1,1,1,1]'],
      ['[3,0,3]'],
      ['[8,4,4]'],
    ],
  },
  {
    n: 2403,
    id: 'pghub-b35-festival-stalls',
    name: 'Festival Stall Overlap',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxConcurrent',
    params: [{ name: 'bookings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each stall booking is <code>[start, end]</code> meaning the stall is occupied for the half-open time range from <code>start</code> (inclusive) to <code>end</code> (exclusive). Return the maximum number of stalls occupied at any single moment.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '2', 'Between time 2 and 4 both the first two bookings overlap.'],
      ['[[1,2],[2,3]]', '1', 'The first ends exactly when the second starts, so they never overlap.'],
    ],
    constraints: ['1 <= bookings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def maxConcurrent(bookings):
    events = []
    for s, e in bookings:
        events.append((s, 1))
        events.append((e, -1))
    events.sort()
    cur = 0
    best = 0
    for _, delta in events:
        cur += delta
        if cur > best:
            best = cur
    return best`,
    approach:
      'Turn each booking into a +1 event at its start and a -1 event at its end, then sweep the timeline in time order. Sorting puts an end (-1) before a start (+1) at the same instant because -1 sorts before +1, correctly treating the half-open boundary as non-overlapping. The running count peaks at the maximum concurrency.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[1,2],[2,3]]'],
      ['[[0,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[1,3],[2,4],[3,5],[4,6]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[0,2],[1,3],[2,4],[0,4]]'],
      ['[[1,100],[2,3],[4,5],[50,60]]'],
      ['[[10,20],[15,25],[18,30],[5,12]]'],
      ['[[1,2],[1,2],[1,2],[1,2],[1,2]]'],
    ],
  },
  {
    n: 2408,
    id: 'pghub-b35-water-tanks',
    name: 'Trapped Water Between Tanks',
    topic_id: 'two-pointers',
    difficulty: 'Hard',
    method_name: 'trappedWater',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of vertical walls has heights given by <code>heights</code>, each of unit width. After rain, water collects between walls. Return the total units of water trapped above the gaps.',
    examples: [
      ['[0,2,0,3,0,1,0,2]', '7', 'Water pools in the dips bounded by taller walls on both sides.'],
      ['[3,2,1]', '0', 'The strictly descending walls trap no water.'],
    ],
    constraints: ['0 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def trappedWater(heights):
    if not heights:
        return 0
    lo, hi = 0, len(heights) - 1
    left_max = right_max = 0
    total = 0
    while lo < hi:
        if heights[lo] <= heights[hi]:
            left_max = max(left_max, heights[lo])
            total += left_max - heights[lo]
            lo += 1
        else:
            right_max = max(right_max, heights[hi])
            total += right_max - heights[hi]
            hi -= 1
    return total`,
    approach:
      'Use two pointers moving inward while tracking the tallest wall seen from each side. The water above a position is bounded by the smaller of the two side maxima. Whichever side currently has the shorter wall is the limiting side, so its trapped amount is known and that pointer advances, accumulating water as it goes.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[0,2,0,3,0,1,0,2]'],
      ['[3,2,1]'],
      ['[]'],
      ['[5]'],
      ['[4,2,0,3,2,5]'],
      ['[1,1,1,1]'],
      ['[0,0,0]'],
      ['[5,4,3,2,1,2,3,4,5]'],
      ['[2,0,2]'],
      ['[10,0,10,0,10]'],
    ],
  },
  {
    n: 2417,
    id: 'pghub-b35-circuit-tree',
    name: 'Deepest Circuit Node',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'maxDepth',
    params: [{ name: 'parent', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A rooted tree of <code>n</code> nodes (numbered <code>0..n-1</code>) is given by <code>parent</code>, where <code>parent[i]</code> is the parent of node <code>i</code>, and the root has parent <code>-1</code>. Return the maximum depth of the tree, counting the number of nodes on the longest root-to-leaf path. An empty tree has depth 0.',
    examples: [
      ['[-1,0,0,1,1]', '3', 'Root 0 has children 1 and 2; node 1 has children 3 and 4, giving depth 3.'],
      ['[-1]', '1', 'A lone root has depth 1.'],
    ],
    constraints: ['0 <= n <= 10^5', 'exactly one entry equals -1 when n >= 1', 'the structure is a valid tree'],
    tags: ['trees', 'graphs'],
    py: `def maxDepth(parent):
    n = len(parent)
    if n == 0:
        return 0
    children = defaultdict(list)
    root = 0
    for i, p in enumerate(parent):
        if p == -1:
            root = i
        else:
            children[p].append(i)
    best = 0
    stack = [(root, 1)]
    while stack:
        node, d = stack.pop()
        if d > best:
            best = d
        for c in children[node]:
            stack.append((c, d + 1))
    return best`,
    approach:
      'Build a children map from the parent array and find the root. Then do an iterative depth-first traversal carrying each node depth, tracking the maximum depth reached.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[-1,0,0,1,1]'],
      ['[-1]'],
      ['[]'],
      ['[-1,0,1,2,3]'],
      ['[-1,0,0,0,0]'],
      ['[1,-1,1,2,2]'],
      ['[-1,0,1,1,3,3,5]'],
      ['[2,2,-1]'],
      ['[-1,0,0,2,2,4,4]'],
      ['[-1,0,1,0,3,4]'],
    ],
  },
  {
    n: 2422,
    id: 'pghub-b35-gene-mutation',
    name: 'Gene Mutation Steps',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'mutationSteps',
    params: [
      { name: 'start', type: 'str' },
      { name: 'end', type: 'str' },
      { name: 'bank', type: 'List[str]' },
    ],
    return_type: 'int',
    statement:
      'A gene is a length-8 string over the characters <code>A</code>, <code>C</code>, <code>G</code>, <code>T</code>. One mutation changes exactly one character. A mutation is valid only if the resulting gene is in the gene <code>bank</code>. Return the minimum number of mutations to turn <code>start</code> into <code>end</code>, or <code>-1</code> if impossible. <code>start</code> need not be in the bank, but every intermediate and <code>end</code> must be.',
    examples: [
      ['"AACCGGTT"\n"AACCGGTA"\n["AACCGGTA"]', '1', 'One character change reaches a banked gene.'],
      ['"AACCGGTT"\n"AAACGGTA"\n["AACCGGTA","AACCGCTA","AAACGGTA"]', '-1', 'AAACGGTA differs from every banked gene by more than one character, so it is unreachable.'],
    ],
    constraints: ['start.length == end.length == 8', '0 <= bank.length <= 10', 'genes use only A, C, G, T'],
    tags: ['graphs', 'bfs'],
    py: `def mutationSteps(start, end, bank):
    bank_set = set(bank)
    if end not in bank_set:
        return -1
    queue = deque([(start, 0)])
    seen = {start}
    chars = 'ACGT'
    while queue:
        gene, steps = queue.popleft()
        if gene == end:
            return steps
        for i in range(len(gene)):
            for ch in chars:
                if ch == gene[i]:
                    continue
                nxt = gene[:i] + ch + gene[i+1:]
                if nxt in bank_set and nxt not in seen:
                    seen.add(nxt)
                    queue.append((nxt, steps + 1))
    return -1`,
    approach:
      'Model genes as graph nodes with an edge between any two genes differing in a single character, restricted to genes present in the bank. Breadth-first search from the start gene finds the fewest mutations to reach the end. If the end is not bankable or unreachable, return -1.',
    complexity: { time: 'O(B * L * 4) where B is bank size and L is gene length', space: 'O(B)' },
    multiParam: true,
    cases: [
      ['"AACCGGTT"', '"AACCGGTA"', '["AACCGGTA"]'],
      ['"AACCGGTT"', '"AAACGGTA"', '["AACCGGTA","AACCGCTA","AAACGGTA"]'],
      ['"AACCGGTT"', '"AACCGGTT"', '[]'],
      ['"AAAAAAAA"', '"AAAAAAAC"', '["AAAAAAAC"]'],
      ['"AAAAAAAA"', '"CCCCCCCC"', '["AAAAAAAA"]'],
      ['"AACCTTGG"', '"AATTCCGG"', '["AATTCCGG","AACCTGGG","AACCTTGG"]'],
      ['"GGGGGGGG"', '"AAAAAAAA"', '["AGGGGGGG","AAGGGGGG","AAAGGGGG","AAAAGGGG","AAAAAGGG","AAAAAAGG","AAAAAAAG","AAAAAAAA"]'],
      ['"ACGTACGT"', '"ACGTACGA"', '["ACGTACGA"]'],
      ['"TTTTTTTT"', '"TTTTTTTA"', '["TTTTTTTG","TTTTTTTC"]'],
      ['"AACCGGTT"', '"TTCCGGTT"', '["TACCGGTT","TTCCGGTT"]'],
    ],
  },
  {
    n: 2431,
    id: 'pghub-b35-treasure-grid',
    name: 'Treasure Path Count',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'countPaths',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'An explorer starts at the top-left cell of a grid and wants to reach the bottom-right cell, moving only right or down. A cell with value <code>1</code> is blocked (impassable); a cell with value <code>0</code> is open. Return the number of distinct open paths from start to finish. If the start or finish is blocked, return 0.',
    examples: [
      ['[[0,0,0],[0,1,0],[0,0,0]]', '2', 'The single blocked center leaves exactly two routes.'],
      ['[[0,1],[0,0]]', '1', 'Only the down-then-right route avoids the block.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['2d-dp', 'matrix'],
    py: `def countPaths(grid):
    rows = len(grid)
    cols = len(grid[0])
    if grid[0][0] == 1 or grid[rows-1][cols-1] == 1:
        return 0
    dp = [[0] * cols for _ in range(rows)]
    dp[0][0] = 1
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                dp[r][c] = 0
                continue
            if r > 0:
                dp[r][c] += dp[r-1][c]
            if c > 0:
                dp[r][c] += dp[r][c-1]
    return dp[rows-1][cols-1]`,
    approach:
      'Let dp[r][c] be the number of ways to reach cell (r,c). The start has one way. Every open cell is reachable from the cell above plus the cell to the left; blocked cells contribute zero. Fill the table row by row and read the bottom-right count.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[0,1],[0,0]]'],
      ['[[0]]'],
      ['[[1]]'],
      ['[[0,0],[0,0]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
      ['[[0,1,0],[0,1,0],[0,0,0]]'],
      ['[[0,0],[1,0]]'],
      ['[[1,0],[0,0]]'],
      ['[[0,0,0,0],[0,0,0,0],[0,0,1,0],[0,0,0,0]]'],
    ],
  },
  {
    n: 2436,
    id: 'pghub-b35-quota-split',
    name: 'Fair Quota Threshold',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minLargestBatch',
    params: [
      { name: 'tasks', type: 'List[int]' },
      { name: 'workers', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A list of <code>tasks</code> sizes must be handed out as contiguous chunks to <code>workers</code> people, each person receiving a consecutive block in order. Distribute the tasks so the largest total any single worker receives is as small as possible, and return that minimized largest total.',
    examples: [
      ['[7,2,5,10,8]\n2', '18', 'Splitting as [7,2,5] and [10,8] gives maxima 14 and 18; the best max is 18.'],
      ['[1,2,3,4,5]\n5', '5', 'Each worker takes one task; the largest is 5.'],
    ],
    constraints: ['1 <= tasks.length <= 10^4', '1 <= workers <= tasks.length', '0 <= tasks[i] <= 10^6'],
    tags: ['binary-search', 'greedy'],
    py: `def minLargestBatch(tasks, workers):
    def feasible(cap):
        groups = 1
        cur = 0
        for t in tasks:
            if cur + t > cap:
                groups += 1
                cur = t
                if groups > workers:
                    return False
            else:
                cur += t
        return True
    lo = max(tasks)
    hi = sum(tasks)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary search on the answer: the largest batch total lies between the single biggest task and the total of all tasks. For a candidate cap, greedily fill consecutive workers without exceeding the cap and count how many workers are needed; if it fits within the worker limit the cap is feasible. Shrink toward the smallest feasible cap.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[10,10,10]', '3'],
      ['[10,10,10]', '1'],
      ['[5,5,5,5]', '2'],
      ['[1,1,1,1,1,1,1,1]', '3'],
      ['[100]', '1'],
      ['[0,0,0,0]', '2'],
      ['[2,3,1,2,4,3]', '3'],
    ],
  },
  {
    n: 2445,
    id: 'pghub-b35-relay-baton',
    name: 'Relay Baton Cycle Length',
    topic_id: 'linkedlist',
    difficulty: 'Medium',
    method_name: 'cycleLength',
    params: [{ name: 'next_runner', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Runners are numbered <code>0..n-1</code>. A baton starting at runner 0 is passed where <code>next_runner[i]</code> gives the runner who receives the baton after runner <code>i</code> (always a valid runner index). Following the passes from runner 0 eventually revisits a runner, forming a loop. Return the length of that loop (the number of distinct runners in the repeating cycle reached from runner 0).',
    examples: [
      ['[1,2,3,1]', '3', 'From 0 you reach 1,2,3,1,...; the cycle 1->2->3->1 has length 3.'],
      ['[0]', '1', 'Runner 0 passes to itself, a cycle of length 1.'],
    ],
    constraints: ['1 <= next_runner.length <= 10^5', '0 <= next_runner[i] < next_runner.length'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def cycleLength(next_runner):
    slow = fast = 0
    while True:
        slow = next_runner[slow]
        fast = next_runner[next_runner[fast]]
        if slow == fast:
            break
    length = 1
    cur = next_runner[slow]
    while cur != slow:
        cur = next_runner[cur]
        length += 1
    return length`,
    approach:
      "Treat the runner array as a functional graph and apply Floyd's tortoise-and-hare. The slow and fast pointers meet inside the cycle; from the meeting point, walk one full loop back to it, counting steps, to recover the cycle length.",
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,3,1]'],
      ['[0]'],
      ['[1,0]'],
      ['[1,2,3,4,0]'],
      ['[1,2,2]'],
      ['[2,2,3,3]'],
      ['[1,2,3,4,5,3]'],
      ['[0,0,0]'],
      ['[3,3,3,3]'],
      ['[1,2,3,4,5,6,7,0]'],
    ],
  },
  {
    n: 2450,
    id: 'pghub-b35-stock-span',
    name: 'Daily Price Span',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'priceSpans',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given daily <code>prices</code>, the span on a day is the number of consecutive days ending on that day (including itself) where the price was less than or equal to the price on that day, walking backwards. Return the list of spans for every day.',
    examples: [
      ['[100,80,60,70,60,75,85]', '[1,1,1,2,1,4,6]', 'On day 5 (price 75) the prior days 60,70,60 are all <=75, giving span 4.'],
      ['[10,20,30]', '[1,2,3]', 'Each day all prior prices are smaller, so spans grow.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^9'],
    tags: ['stack'],
    py: `def priceSpans(prices):
    spans = []
    stack = []
    for i, p in enumerate(prices):
        span = 1
        while stack and prices[stack[-1]] <= p:
            span += spans[stack[-1]]
            stack.pop()
        spans.append(span)
        stack.append(i)
    return spans`,
    approach:
      'Maintain a monotonic stack of day indices whose prices strictly exceed all those popped. For each new day, pop every earlier day whose price is at most today\'s, absorbing their spans (those days are dominated), then push today. The accumulated count is today\'s span.',
    complexity: { time: 'O(n) amortized', space: 'O(n)' },
    cases: [
      ['[100,80,60,70,60,75,85]'],
      ['[10,20,30]'],
      ['[5]'],
      ['[3,3,3,3]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[7,2,4,4,1,5]'],
      ['[10,10,9,11]'],
      ['[1,3,2,4,3,5]'],
      ['[8,6,7,5,7,9]'],
    ],
  },
  {
    n: 2459,
    id: 'pghub-b35-subset-xor',
    name: 'Maximum Subset XOR',
    topic_id: 'bit-manipulation',
    difficulty: 'Hard',
    method_name: 'maxSubsetXor',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given a list of non-negative integers <code>nums</code>, choose any subset (possibly empty) and take the XOR of its elements. Return the maximum XOR value achievable. The empty subset gives 0.',
    examples: [
      ['[3,5,6]', '7', 'XOR of 3 and 5 (and similar choices) reaches 7.'],
      ['[8]', '8', 'The best is the single element 8.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9'],
    tags: ['bit-manipulation', 'greedy'],
    py: `def maxSubsetXor(nums):
    basis = []
    for num in nums:
        cur = num
        for b in basis:
            cur = min(cur, cur ^ b)
        if cur > 0:
            basis.append(cur)
            basis.sort(reverse=True)
    result = 0
    for b in basis:
        result = max(result, result ^ b)
    return result`,
    approach:
      'Build a linear basis over GF(2) of the numbers using Gaussian elimination on their bits. Each number is reduced against the current basis; any nonzero remainder adds a new independent vector. The maximum achievable XOR is then assembled greedily from the basis by taking any vector that increases the running result.',
    complexity: { time: 'O(n * B^2) where B is bit width', space: 'O(B)' },
    cases: [
      ['[3,5,6]'],
      ['[8]'],
      ['[0]'],
      ['[1,2,4,8]'],
      ['[5,5,5]'],
      ['[1,1,1,1]'],
      ['[15,10,5]'],
      ['[7,11,13]'],
      ['[0,0,0,9]'],
      ['[1000000000,1,2,3]'],
    ],
  },
  {
    n: 2461,
    id: 'pghub-b35-event-priority',
    name: 'Top K Frequent Events',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'topKEvents',
    params: [
      { name: 'events', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Given a log of event codes <code>events</code> and an integer <code>k</code>, return the <code>k</code> most frequently occurring event codes. The result must be ordered by descending frequency; codes tied on frequency are ordered by smaller code value first.',
    examples: [
      ['[1,1,1,2,2,3]\n2', '[1,2]', 'Code 1 occurs 3 times and code 2 occurs twice, the two most frequent.'],
      ['[4,4,5,5,6]\n3', '[4,5,6]', 'Ties (4 and 5 occur twice) keep the smaller code first; 6 fills the third slot.'],
    ],
    constraints: ['1 <= events.length <= 10^5', '1 <= k <= number of distinct codes', '0 <= events[i] <= 10^9'],
    tags: ['heap', 'hashmap'],
    py: `def topKEvents(events, k):
    freq = Counter(events)
    items = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [code for code, _ in items[:k]]`,
    approach:
      'Count occurrences of each code, then order codes by descending count with the code value as a tiebreaker (smaller first). Take the first k codes. A heap could limit memory, but the sort makes the tie-breaking rule explicit and simple.',
    complexity: { time: 'O(n + m log m) where m is distinct codes', space: 'O(m)' },
    multiParam: true,
    cases: [
      ['[1,1,1,2,2,3]', '2'],
      ['[4,4,5,5,6]', '3'],
      ['[7]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[9,9,9,9]', '1'],
      ['[1,1,2,2,3,3]', '2'],
      ['[5,5,5,1,1,9,9,9,9]', '2'],
      ['[10,20,20,30,30,30]', '3'],
      ['[2,2,1,1,3]', '3'],
      ['[100,100,1,1,1,50]', '2'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B35>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b35-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B35>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B35>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b35-grade-${prob.n}.py`);
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
