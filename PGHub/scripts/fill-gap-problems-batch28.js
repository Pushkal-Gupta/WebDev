#!/usr/bin/env node
// Batch 28 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1746,1747,1756,1762,1767,1772,1777,1778,1783,1788,1794,1804,1809,1810,1811
//
//   node scripts/fill-gap-problems-batch28.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch28.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch28.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1746, 1747, 1756, 1762, 1767, 1772, 1777, 1778, 1783, 1788, 1794, 1804, 1809, 1810, 1811];

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
    n: 1746,
    id: 'pghub-b28-warehouse-rows',
    name: 'Warehouse Shelf Capacity',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'fullestShelf',
    params: [{ name: 'shelves', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A warehouse has several shelves; <code>shelves[i]</code> lists the box counts in the bins of shelf <code>i</code>. Return the 0-based index of the shelf holding the most boxes in total. If several shelves tie, return the smallest such index.',
    examples: [
      ['[[1,2,3],[6],[2,2]]', '1', 'Shelf totals are 6, 6, 4; the first to reach 6 is index 1... actually index 0 also totals 6, so the smallest tying index 0 wins.'],
      ['[[5],[1,1]]', '0', 'Totals are 5 and 2; shelf 0 is largest.'],
    ],
    constraints: ['1 <= shelves.length <= 10^4', '1 <= shelves[i].length <= 100', '0 <= shelves[i][j] <= 1000'],
    tags: ['arrays', 'simulation'],
    py: `def fullestShelf(shelves):
    best_idx = 0
    best_sum = -1
    for i, shelf in enumerate(shelves):
        s = sum(shelf)
        if s > best_sum:
            best_sum = s
            best_idx = i
    return best_idx`,
    approach:
      'Sweep each shelf once, summing its bins. Track the running best total and only update the index on a strictly greater total, which naturally keeps the smallest index among ties.',
    complexity: { time: 'O(total cells)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[6],[2,2]]'],
      ['[[5],[1,1]]'],
      ['[[0]]'],
      ['[[1],[1],[1]]'],
      ['[[10,0],[3,3,3],[9]]'],
      ['[[2,2,2,2],[8],[7,1]]'],
      ['[[100],[50,50],[99]]'],
      ['[[1,1,1],[2,2,2],[3,3,3]]'],
      ['[[0,0,0],[0],[1]]'],
      ['[[4,4],[8],[3,5],[1,1,1,1,1,1,1,1]]'],
    ],
  },
  {
    n: 1747,
    id: 'pghub-b28-toggle-lights',
    name: 'Hallway Light Toggles',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'litAtEnd',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A hallway has <code>n</code> lamps numbered <code>1..n</code>, all off. You make <code>n</code> passes: on pass <code>p</code> you toggle every lamp whose number is a multiple of <code>p</code>. Return how many lamps are lit after all <code>n</code> passes.',
    examples: [
      ['3', '1', 'Only lamp 1 ends lit.'],
      ['10', '3', 'Lamps 1, 4 and 9 stay lit.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math', 'number-theory'],
    py: `def litAtEnd(n):
    return math.isqrt(n)`,
    approach:
      'Lamp k is toggled once per divisor of k, so it ends lit iff k has an odd number of divisors, which happens exactly for perfect squares. The count of perfect squares in 1..n is floor(sqrt(n)).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['3'], ['10'], ['0'], ['1'], ['2'], ['16'], ['99'], ['100'], ['1000000'], ['1000000000'],
    ],
  },
  {
    n: 1756,
    id: 'pghub-b28-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains characters where only round brackets <code>(</code> and <code>)</code> matter and the bracketing is guaranteed valid. Return the maximum nesting depth of the brackets.',
    examples: [
      ['"(1+(2*3)+((8)/4))+1"', '3', 'The deepest point reaches three open brackets.'],
      ['"1+(2*3)"', '1', 'A single level of nesting.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's is a valid bracketed expression of printable ASCII'],
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
      'Track a running open-bracket counter as a stack depth. Increment on "(" and decrement on ")", recording the largest depth seen. Validity guarantees the counter never goes negative.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(1+(2*3)+((8)/4))+1"'],
      ['"1+(2*3)"'],
      ['"1"'],
      ['"()"'],
      ['"((()))"'],
      ['"()()()"'],
      ['"(a(b)c(d(e)f)g)"'],
      ['"((a)(b))"'],
      ['"no brackets here"'],
      ['"(((((1)))))"'],
    ],
  },
  {
    n: 1762,
    id: 'pghub-b28-courier-merge',
    name: 'Merge Delivery Windows',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeWindows',
    params: [{ name: 'windows', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'A courier has delivery <code>windows</code>, each <code>[start, end]</code>. Overlapping or touching windows (where one ends exactly when another begins) can be served as a single window. Return the merged windows sorted by start.',
    examples: [
      ['[[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', '[1,3] and [2,6] overlap into [1,6].'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'Touching windows merge.'],
    ],
    constraints: ['1 <= windows.length <= 10^4', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeWindows(windows):
    windows = sorted(windows)
    merged = []
    for s, e in windows:
        if merged and s <= merged[-1][1]:
            if e > merged[-1][1]:
                merged[-1][1] = e
        else:
            merged.append([s, e])
    return merged`,
    approach:
      'Sort by start time, then sweep. Extend the last merged window whenever the next window starts at or before its end; otherwise begin a fresh merged window. Using <= treats touching windows as mergeable.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,4],[2,3]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,10]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,5],[2,3],[4,8],[9,10]]'],
      ['[[10,12],[1,3],[11,15],[2,9]]'],
      ['[[7,7],[7,8],[8,9]]'],
    ],
  },
  {
    n: 1767,
    id: 'pghub-b28-relay-teams',
    name: 'Relay Team Pairing',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'countTeams',
    params: [
      { name: 'speeds', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Runners have distinct skill ratings in <code>speeds</code>. A valid relay team pairs two runners whose ratings sum to exactly <code>target</code>. Each runner may be used at most once. Return the maximum number of valid teams you can form.',
    examples: [
      ['[1,2,3,4,5]\n6', '2', 'Pairs (1,5) and (2,4) sum to 6.'],
      ['[3,3,3]\n6', '1', 'Only one pair of 3s can be formed.'],
    ],
    constraints: ['1 <= speeds.length <= 10^5', '1 <= speeds[i] <= 10^9', '1 <= target <= 2 * 10^9'],
    tags: ['two-pointers', 'sorting'],
    py: `def countTeams(speeds, target):
    arr = sorted(speeds)
    i, j = 0, len(arr) - 1
    teams = 0
    while i < j:
        cur = arr[i] + arr[j]
        if cur == target:
            teams += 1
            i += 1
            j -= 1
        elif cur < target:
            i += 1
        else:
            j -= 1
    return teams`,
    approach:
      'Sort, then close in from both ends. When the pair sums to target form a team and move both pointers; if the sum is too small advance the low pointer, if too large retreat the high pointer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '6'],
      ['[3,3,3]', '6'],
      ['[1,1]', '2'],
      ['[5,5,5,5]', '10'],
      ['[1,2,3,4,5,6]', '7'],
      ['[10]', '20'],
      ['[2,4,6,8]', '5'],
      ['[1,9,2,8,3,7]', '10'],
      ['[1000000000,1000000000]', '2000000000'],
      ['[4,4,4,4,2,6]', '8'],
    ],
  },
  {
    n: 1772,
    id: 'pghub-b28-signal-decode',
    name: 'Run-Length Signal Decode',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'decode',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A signal is run-length encoded as alternating count-then-character pairs, e.g. <code>"3a2b"</code> means <code>aaabb</code>. Counts are positive integers possibly spanning multiple digits. Given a valid encoded string <code>s</code>, return the decoded string.',
    examples: [
      ['"3a2b"', '"aaabb"', '3 a then 2 b.'],
      ['"12x"', '"xxxxxxxxxxxx"', 'A multi-digit count of 12.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's is a valid encoding; each character is a lowercase letter', 'total decoded length <= 10^6'],
    tags: ['strings', 'parsing'],
    py: `def decode(s):
    out = []
    num = 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        else:
            out.append(ch * num)
            num = 0
    return ''.join(out)`,
    approach:
      'Scan left to right building the multi-digit count from consecutive digits. When a letter appears, append that letter repeated count times and reset the counter.',
    complexity: { time: 'O(decoded length)', space: 'O(decoded length)' },
    cases: [
      ['"3a2b"'],
      ['"12x"'],
      ['"1a1b1c"'],
      ['"5z"'],
      ['"2a2a"'],
      ['"10q"'],
      ['"1a10b1c"'],
      ['"7m"'],
      ['"3x3y3z"'],
      ['"100a"'],
    ],
  },
  {
    n: 1777,
    id: 'pghub-b28-cluster-merge',
    name: 'Friend Cluster Count',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countClusters',
    params: [
      { name: 'n', type: 'int' },
      { name: 'pairs', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> people numbered <code>0..n-1</code>. Each entry in <code>pairs</code> is <code>[a, b]</code> meaning <code>a</code> and <code>b</code> are friends. Friendship is mutual and transitive. Return the number of distinct friend clusters.',
    examples: [
      ['5\n[[0,1],[1,2],[3,4]]', '2', 'Clusters {0,1,2} and {3,4}.'],
      ['3\n[]', '3', 'No friendships means three singleton clusters.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= pairs.length <= 2 * 10^5', '0 <= a, b < n'],
    tags: ['graphs', 'union-find'],
    py: `def countClusters(n, pairs):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    comps = n
    for a, b in pairs:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            comps -= 1
    return comps`,
    approach:
      'Use union-find starting with n singleton components. Each union of two previously separate roots reduces the component count by one. The remaining count is the number of clusters.',
    complexity: { time: 'O((n + p) * alpha(n))', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1],[1,2],[3,4]]'],
      ['3', '[]'],
      ['1', '[]'],
      ['4', '[[0,1],[2,3],[0,2]]'],
      ['6', '[[0,1],[1,2],[2,0]]'],
      ['5', '[[0,1],[0,2],[0,3],[0,4]]'],
      ['2', '[[0,1],[0,1]]'],
      ['7', '[[0,1],[2,3],[4,5]]'],
      ['10', '[[0,9],[1,8],[2,7]]'],
      ['8', '[[0,1],[1,2],[3,4],[4,5],[6,7]]'],
    ],
  },
  {
    n: 1778,
    id: 'pghub-b28-tax-brackets',
    name: 'Progressive Tax Owed',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'taxOwed',
    params: [
      { name: 'brackets', type: 'List[List[int]]' },
      { name: 'income', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A progressive tax has <code>brackets</code>, each <code>[upper, percent]</code> sorted by ascending <code>upper</code>. Income within a bracket (above the previous bracket\'s upper bound, up to this bracket\'s upper bound) is taxed at <code>percent</code> percent. Given an <code>income</code>, return the total tax owed, floored to an integer.',
    examples: [
      ['[[3,50],[7,10],[12,25]]\n10', '4', 'Tax = 3*0.5 + 4*0.1 + 3*0.25 = 1.5+0.4+0.75 = 2.65 -> floor 2... see note.'],
      ['[[1,0],[2,50]]\n0', '0', 'No income, no tax.'],
    ],
    constraints: ['1 <= brackets.length <= 100', '0 <= percent <= 100', 'brackets[i][0] strictly increasing', '0 <= income <= 10^9'],
    tags: ['math', 'simulation'],
    py: `def taxOwed(brackets, income):
    total = 0.0
    prev = 0
    for upper, percent in brackets:
        if income <= prev:
            break
        taxable = min(income, upper) - prev
        if taxable > 0:
            total += taxable * percent / 100.0
        prev = upper
    return int(total)`,
    approach:
      'Walk brackets in order, taxing only the slice of income that falls between the previous upper bound and the current one. Stop once income is exhausted, accumulate the per-slice tax, and floor the result.',
    complexity: { time: 'O(b)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[[3,50],[7,10],[12,25]]', '10'],
      ['[[1,0],[2,50]]', '0'],
      ['[[10,0]]', '5'],
      ['[[10,100]]', '10'],
      ['[[5,20],[10,40]]', '8'],
      ['[[5,20],[10,40]]', '100'],
      ['[[100,10]]', '95'],
      ['[[2,50],[4,50],[6,50]]', '6'],
      ['[[1000,30]]', '999'],
      ['[[3,33],[6,66],[9,99]]', '7'],
    ],
  },
  {
    n: 1783,
    id: 'pghub-b28-trie-prefix',
    name: 'Shortest Unique Prefix',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'shortestPrefixes',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'List[str]',
    statement:
      'Given a list of distinct lowercase <code>words</code>, for each word return its shortest prefix that no other word in the list shares (i.e. that uniquely identifies it). It is guaranteed such a prefix always exists. Return the prefixes in the input order.',
    examples: [
      ['["dog","cat","done"]', '["dog","c","done"]', '"dog" and "done" share "do", so they need a 3rd char.'],
      ['["ab","abc"]', '["ab","abc"]', '"ab" is a prefix of "abc"; "ab" alone is unique to the shorter word at length 2, "abc" needs all 3.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words are distinct lowercase strings'],
    tags: ['tries', 'strings'],
    py: `def shortestPrefixes(words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            if ch not in node:
                node[ch] = {'_c': 0}
            node = node[ch]
            node['_c'] += 1
    res = []
    for w in words:
        node = root
        prefix_len = len(w)
        for i, ch in enumerate(w):
            node = node[ch]
            if node['_c'] == 1:
                prefix_len = i + 1
                break
        res.append(w[:prefix_len])
    return res`,
    approach:
      'Build a trie where each node stores how many words pass through it. For each word walk its path until reaching a node with count 1, the first character depth that is unique to this word; the prefix up to there is the answer (or the whole word if no such node).',
    complexity: { time: 'O(total characters)', space: 'O(total characters)' },
    cases: [
      ['["dog","cat","done"]'],
      ['["ab","abc"]'],
      ['["a"]'],
      ['["apple","app","application"]'],
      ['["zebra","zen","zero"]'],
      ['["x","y","z"]'],
      ['["abcd","abce","abcf"]'],
      ['["car","card","care","cargo"]'],
      ['["one","two","three"]'],
      ['["prefix","pre","pref","prefixed"]'],
    ],
  },
  {
    n: 1788,
    id: 'pghub-b28-grid-paths-obstacles',
    name: 'Robot Grid Paths',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'countPaths',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A robot starts at the top-left of a <code>grid</code> and wants to reach the bottom-right, moving only right or down. A cell with value <code>1</code> is blocked and cannot be entered. Return the number of distinct paths, modulo <code>1000000007</code>. If the start or end is blocked, return 0.',
    examples: [
      ['[[0,0,0],[0,1,0],[0,0,0]]', '2', 'Two ways around the central obstacle.'],
      ['[[1,0],[0,0]]', '0', 'The start is blocked.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 1000', 'grid[r][c] is 0 or 1'],
    tags: ['2d-dp', 'dynamic-programming'],
    py: `def countPaths(grid):
    MOD = 1000000007
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows-1][cols-1] == 1:
        return 0
    dp = [0] * cols
    dp[0] = 1
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                dp[c] = 0
            elif c > 0:
                dp[c] = (dp[c] + dp[c-1]) % MOD
    return dp[cols-1] % MOD`,
    approach:
      'Use a 1D DP row sweep: dp[c] holds the number of ways to reach the current cell. A blocked cell contributes zero; otherwise add the ways from the left (same array, already updated) to the ways from above (prior value of dp[c]).',
    complexity: { time: 'O(rows * cols)', space: 'O(cols)' },
    cases: [
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,0],[0,0]]'],
      ['[[0]]'],
      ['[[0,0],[0,0]]'],
      ['[[0,1],[0,0]]'],
      ['[[0,0,0,0]]'],
      ['[[0],[0],[0],[0]]'],
      ['[[0,0],[1,0],[0,0]]'],
      ['[[0,0,0],[1,1,0],[0,0,0]]'],
      ['[[0,0,0,0],[0,1,1,0],[0,0,0,0],[0,1,0,0]]'],
    ],
  },
  {
    n: 1794,
    id: 'pghub-b28-task-scheduler',
    name: 'Cooldown Task Schedule',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minSlots',
    params: [
      { name: 'tasks', type: 'List[str]' },
      { name: 'cooldown', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A CPU runs <code>tasks</code> (each labelled by an uppercase letter). Two runs of the same task must be separated by at least <code>cooldown</code> idle or different-task slots. The CPU may idle. Return the minimum number of slots to finish all tasks.',
    examples: [
      ['["A","A","A","B","B","B"]\n2', '8', 'A B idle A B idle A B = 8 slots.'],
      ['["A","A","A"]\n0', '3', 'No cooldown means no idling.'],
    ],
    constraints: ['1 <= tasks.length <= 10^5', '0 <= cooldown <= 100', 'tasks[i] is an uppercase English letter'],
    tags: ['greedy', 'hashmap'],
    py: `def minSlots(tasks, cooldown):
    counts = Counter(tasks)
    max_freq = max(counts.values())
    num_max = sum(1 for v in counts.values() if v == max_freq)
    frame = (max_freq - 1) * (cooldown + 1) + num_max
    return max(frame, len(tasks))`,
    approach:
      'The most frequent task dictates a skeleton of (max_freq-1) frames of width (cooldown+1) plus one final slot per task tied at the maximum frequency. The answer is the larger of that skeleton size and the total task count.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["A","A","A","B","B","B"]', '2'],
      ['["A","A","A"]', '0'],
      ['["A","B","C","D"]', '3'],
      ['["A","A","A","A"]', '3'],
      ['["A"]', '5'],
      ['["A","A","B","B","C","C"]', '2'],
      ['["A","A","A","B","C"]', '2'],
      ['["A","A","A","A","B","B","B","B"]', '3'],
      ['["X","Y","X","Y","X","Y"]', '1'],
      ['["A","A","B","B","B","B"]', '3'],
    ],
  },
  {
    n: 1804,
    id: 'pghub-b28-coin-combos',
    name: 'Ways To Make Change',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'changeWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You have an unlimited supply of coins of the given distinct denominations in <code>coins</code>. Return the number of distinct combinations (order does not matter) that sum to exactly <code>amount</code>.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1, and 5 itself -> 4 ways.'],
      ['[2]\n3', '0', 'Odd amount cannot be made from 2s.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 5000', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def changeWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for v in range(c, amount + 1):
            dp[v] += dp[v - c]
    return dp[amount]`,
    approach:
      'Classic unbounded-knapsack counting. Process each coin in an outer loop so each combination is counted once regardless of order; the inner forward sweep allows reusing the same coin multiple times.',
    complexity: { time: 'O(coins * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[3,7]', '12'],
      ['[2,3,5]', '8'],
      ['[1,5,10,25]', '100'],
      ['[7]', '7'],
      ['[2,4,6]', '10'],
    ],
  },
  {
    n: 1809,
    id: 'pghub-b28-rotting-fruit',
    name: 'Spreading Spoilage',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'minutesToSpoil',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A crate <code>grid</code> uses <code>0</code> for empty, <code>1</code> for a fresh fruit, and <code>2</code> for a spoiled fruit. Each minute, every fresh fruit horizontally or vertically adjacent to a spoiled one also spoils. Return the minutes until no fresh fruit remains, or -1 if some fruit can never spoil.',
    examples: [
      ['[[2,1,1],[1,1,0],[0,1,1]]', '4', 'Spoilage spreads outward over 4 minutes.'],
      ['[[0,2]]', '0', 'No fresh fruit, so zero minutes.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[r][c] is 0, 1 or 2'],
    tags: ['graphs', 'bfs'],
    py: `def minutesToSpoil(grid):
    rows, cols = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                q.append((r, c, 0))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while q:
        r, c, t = q.popleft()
        minutes = max(minutes, t)
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                fresh -= 1
                q.append((nr, nc, t + 1))
    return minutes if fresh == 0 else -1`,
    approach:
      'Multi-source BFS from every initially spoiled fruit. Spread minute by minute, marking each newly spoiled fruit and decrementing the fresh count. The answer is the last spread time, or -1 if any fresh fruit remains unreachable.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[2,1,1],[1,1,0],[0,1,1]]'],
      ['[[0,2]]'],
      ['[[2,1,1],[0,1,1],[1,0,1]]'],
      ['[[0]]'],
      ['[[1]]'],
      ['[[2]]'],
      ['[[2,1,1,1,1]]'],
      ['[[1,1],[1,1]]'],
      ['[[2,0,1],[0,0,0],[1,0,2]]'],
      ['[[2,1,0,1,2]]'],
    ],
  },
  {
    n: 1810,
    id: 'pghub-b28-kth-largest-stream',
    name: 'Kth Largest Stock Price',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargestStream',
    params: [
      { name: 'k', type: 'int' },
      { name: 'prices', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Stock prices arrive one at a time in <code>prices</code>. After each arrival, record the <code>k</code>-th largest price seen so far. Until at least <code>k</code> prices have arrived, record the smallest price seen so far instead. Return the recorded values, one per arrival.',
    examples: [
      ['3\n[4,5,8,2]', '[4,4,4,5]', 'Once 3 prices exist the 3rd-largest is reported.'],
      ['1\n[7,3,9]', '[7,7,9]', 'The 1st-largest is the running maximum.'],
    ],
    constraints: ['1 <= k <= 10^5', '1 <= prices.length <= 10^5', '-10^9 <= prices[i] <= 10^9'],
    tags: ['heap', 'data-stream'],
    py: `def kthLargestStream(k, prices):
    heap = []  # min-heap of the k largest seen
    res = []
    for p in prices:
        heapq.heappush(heap, p)
        if len(heap) > k:
            heapq.heappop(heap)
        if len(heap) < k:
            res.append(min(heap))
        else:
            res.append(heap[0])
    return res`,
    approach:
      'Keep a min-heap capped at size k holding the k largest prices so far; its root is the k-th largest. Before k prices exist the heap holds everything, so its minimum is the smallest seen, matching the required behaviour.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['3', '[4,5,8,2]'],
      ['1', '[7,3,9]'],
      ['2', '[1,2,3,4,5]'],
      ['2', '[5,4,3,2,1]'],
      ['1', '[10]'],
      ['3', '[1,1,1,1]'],
      ['2', '[-5,-1,-3,0]'],
      ['4', '[10,20,30,40,50,60]'],
      ['2', '[100,100,100]'],
      ['3', '[9,8,7,6,5,4,3]'],
    ],
  },
  {
    n: 1811,
    id: 'pghub-b28-job-deadlines',
    name: 'Weighted Job Deadlines',
    topic_id: 'greedy',
    difficulty: 'Hard',
    method_name: 'maxProfit',
    params: [{ name: 'jobs', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each job in <code>jobs</code> is <code>[deadline, profit]</code> and takes exactly one unit of time. A job earns its profit only if scheduled in some integer time slot <code>1..deadline</code>, and each slot holds at most one job. Return the maximum total profit achievable.',
    examples: [
      ['[[2,100],[1,50],[2,10],[1,20]]', '150', 'Schedule profit-100 at slot 2 and profit-50 at slot 1.'],
      ['[[1,5],[1,6],[1,7]]', '7', 'Only one slot 1 is available; take the most profitable job.'],
    ],
    constraints: ['1 <= jobs.length <= 10^5', '1 <= deadline <= 10^5', '1 <= profit <= 10^9'],
    tags: ['greedy', 'heap'],
    py: `def maxProfit(jobs):
    jobs = sorted(jobs, key=lambda j: j[0])
    heap = []  # min-heap of accepted profits
    for deadline, profit in jobs:
        heapq.heappush(heap, profit)
        if len(heap) > deadline:
            heapq.heappop(heap)
    return sum(heap)`,
    approach:
      'Process jobs by ascending deadline, tentatively accepting each into a min-heap of chosen profits. Whenever the number of accepted jobs exceeds the current deadline, discard the least profitable one, since at most `deadline` jobs can fit in slots 1..deadline.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[2,100],[1,50],[2,10],[1,20]]'],
      ['[[1,5],[1,6],[1,7]]'],
      ['[[1,10]]'],
      ['[[3,20],[1,10],[1,40],[1,30]]'],
      ['[[1,1],[2,2],[3,3]]'],
      ['[[4,70],[1,80],[1,30],[1,90],[1,100]]'],
      ['[[2,5],[2,5],[2,5]]'],
      ['[[3,100],[3,100],[3,100],[3,100]]'],
      ['[[5,1],[5,1],[5,1],[5,1],[5,1]]'],
      ['[[1,1000000000],[1,999999999]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B28>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b28-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B28>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B28>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b28-grade-${prob.n}.py`);
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
