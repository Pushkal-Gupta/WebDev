#!/usr/bin/env node
// Batch 34 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2238,2247,2252,2253,2254,2263,2268,2277,2282,2291,2292,2297,2298,2371,2372
//
//   node scripts/fill-gap-problems-batch34.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch34.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch34.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2238, 2247, 2252, 2253, 2254, 2263, 2268, 2277, 2282, 2291, 2292, 2297, 2298, 2371, 2372];

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
    n: 2238,
    id: 'pghub-b34-elevator-trips',
    name: 'Freight Elevator Trips',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A freight elevator carries crates whose masses are listed in <code>weights</code>. The elevator can hold any number of crates as long as their combined mass does not exceed <code>capacity</code>. Return the minimum number of trips needed to move every crate up. It is guaranteed every individual crate fits.',
    examples: [
      ['[3,2,2,1]\n3', '3', 'Pack [2,1], [3], [2]: three trips fit within capacity 3.'],
      ['[5,5,5]\n5', '3', 'Each crate fills the elevator, so one crate per trip.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= capacity <= 10^9'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, capacity):
    weights = sorted(weights)
    lo, hi = 0, len(weights) - 1
    trips = 0
    while lo <= hi:
        if weights[lo] + weights[hi] <= capacity:
            lo += 1
        hi -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the crates. Greedily pair the lightest remaining crate with the heaviest: if they fit together they share a trip, otherwise the heaviest goes alone. Either way the heaviest is removed each step. This minimizes trips because the heaviest crate must travel anyway and pairing it with the lightest possible partner never wastes capacity.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[3,2,2,1]', '3'],
      ['[5,5,5]', '5'],
      ['[1]', '10'],
      ['[4,4,4,4]', '8'],
      ['[1,2,3,4,5]', '5'],
      ['[2,2,2,2,2,2]', '4'],
      ['[10,1,1,1,1]', '10'],
      ['[3,3,3,3]', '6'],
      ['[1,1,1,1,1,1,1]', '2'],
      ['[7,6,5,4,3,2,1]', '8'],
    ],
  },
  {
    n: 2247,
    id: 'pghub-b34-signal-peaks',
    name: 'Sensor Signal Peaks',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countPeaks',
    params: [{ name: 'readings', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A sensor logs an integer at each tick into <code>readings</code>. A tick is a peak if its reading is strictly greater than the readings immediately before and after it. The first and last ticks are never peaks because they lack a neighbour on one side. Return the number of peaks.',
    examples: [
      ['[1,3,2,4,1]', '2', 'Index 1 (3) and index 3 (4) are each higher than both neighbours.'],
      ['[5,5,5]', '0', 'No reading is strictly greater than both neighbours.'],
    ],
    constraints: ['1 <= readings.length <= 10^5', '-10^9 <= readings[i] <= 10^9'],
    tags: ['arrays', 'first-order'],
    py: `def countPeaks(readings):
    count = 0
    for i in range(1, len(readings) - 1):
        if readings[i] > readings[i - 1] and readings[i] > readings[i + 1]:
            count += 1
    return count`,
    approach:
      'Scan every interior index and test the strict local-maximum condition against its two neighbours. Endpoints are excluded by starting at index 1 and stopping before the last index.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3,2,4,1]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[1,5,1,5,1,5,1]'],
      ['[3,3,3,4,3,3]'],
      ['[-1,-5,-1,-5,-1]'],
      ['[10,20,10,20,10,20,10]'],
    ],
  },
  {
    n: 2252,
    id: 'pghub-b34-vault-code',
    name: 'Rotary Vault Distance',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'dialDistance',
    params: [
      { name: 'code', type: 'List[int]' },
      { name: 'slots', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A circular vault dial has <code>slots</code> positions numbered <code>0</code> to <code>slots-1</code>. The pointer starts at position <code>0</code>. To enter <code>code</code> you rotate the pointer to each listed position in order, and rotating between two positions costs the shorter of the clockwise or counter-clockwise step count. Return the total number of steps to enter the whole code.',
    examples: [
      ['[3,1]\n10', '5', 'From 0 to 3 is 3 steps; from 3 to 1 is 2 steps; total 5.'],
      ['[9]\n10', '1', 'From 0, position 9 is one step counter-clockwise.'],
    ],
    constraints: ['1 <= code.length <= 10^4', '2 <= slots <= 10^9', '0 <= code[i] < slots'],
    tags: ['math', 'simulation'],
    py: `def dialDistance(code, slots):
    pos = 0
    total = 0
    for target in code:
        d = abs(target - pos)
        total += min(d, slots - d)
        pos = target
    return total`,
    approach:
      'Track the current pointer position. For each target the raw gap is the absolute difference; on a ring the actual cost is the smaller of that gap and going the other way (slots minus gap). Sum these and advance the pointer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,1]', '10'],
      ['[9]', '10'],
      ['[0]', '5'],
      ['[5,5,5]', '10'],
      ['[1,2,3,4]', '5'],
      ['[7,3,9,0]', '12'],
      ['[2,8]', '10'],
      ['[500000000]', '1000000000'],
      ['[1,1,1,1,1]', '6'],
      ['[4,4,0,4]', '12'],
    ],
  },
  {
    n: 2253,
    id: 'pghub-b34-garden-water',
    name: 'Garden Sprinkler Coverage',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minSprinklers',
    params: [
      { name: 'ranges', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A garden is a line of plots indexed <code>0</code> to <code>n-1</code> where <code>n = ranges.length</code>. A sprinkler sits on each plot; the one at plot <code>i</code> can water every plot from <code>i - ranges[i]</code> to <code>i + ranges[i]</code> inclusive. Return the minimum number of sprinklers to turn on so every plot is watered, or <code>-1</code> if it is impossible.',
    examples: [
      ['[1,2,1,0,2,1,0,1]', '3', 'Turning on sprinklers at plots 1, 4 and 7 covers the whole garden.'],
      ['[0,0,0]', '3', 'Each sprinkler waters only its own plot, so all three are needed.'],
    ],
    constraints: ['1 <= ranges.length <= 10^4', '0 <= ranges[i] <= 10^4'],
    tags: ['intervals', 'greedy'],
    py: `def minSprinklers(ranges):
    n = len(ranges)
    reach = [0] * n
    for i, r in enumerate(ranges):
        left = max(0, i - r)
        reach[left] = max(reach[left], i + r)
    count = 0
    i = 0
    covered = -1
    while i < n:
        best = -1
        j = i
        while j < n and j <= covered + 1:
            if reach[j] >= best:
                best = reach[j]
            j += 1
        if best <= covered:
            return -1
        count += 1
        covered = best
        i = covered + 1
    return count`,
    approach:
      'Convert each sprinkler into the interval it covers and record, for each starting plot, the farthest plot reachable when coverage begins at or before it. Then greedily, like jump-game-II, extend coverage one plot past the current frontier by choosing the sprinkler that reaches farthest among those that can start within the gap. If no sprinkler extends the frontier, coverage is impossible.',
    complexity: { time: 'O(n^2) worst case, O(n) typical', space: 'O(n)' },
    cases: [
      ['[1,2,1,0,2,1,0,1]'],
      ['[0,0,0]'],
      ['[3,0,0,0,0,0,0]'],
      ['[1]'],
      ['[0]'],
      ['[2,0,0,0,2]'],
      ['[1,1,1,1,1]'],
      ['[4,0,0,0,0]'],
      ['[0,0,0,0,1]'],
      ['[5,4,3,2,1,0,1,2,3,4]'],
    ],
  },
  {
    n: 2254,
    id: 'pghub-b34-token-stream',
    name: 'Balanced Substring Count',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestBalanced',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>a</code> and <code>b</code>. A substring is balanced if it contains an equal number of <code>a</code> and <code>b</code> characters. Return the length of the longest balanced substring.',
    examples: [
      ['aabb', '4', 'The whole string has two of each character.'],
      ['aaab', '2', 'The longest balanced piece is "ab" of length 2.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists only of the characters a and b'],
    tags: ['sliding-window', 'hashmap'],
    py: `def longestBalanced(s):
    first = {0: -1}
    bal = 0
    best = 0
    for i, ch in enumerate(s):
        bal += 1 if ch == 'a' else -1
        if bal in first:
            best = max(best, i - first[bal])
        else:
            first[bal] = i
    return best`,
    approach:
      'Treat a as +1 and b as -1 and track a running prefix balance. A substring is balanced exactly when the balance at its two endpoints is equal. Record the first index at which each balance value appears; whenever a balance repeats, the span between the first occurrence and now is balanced. Keep the longest such span.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'aabb'"],
      ["'aaab'"],
      ["''"],
      ["'a'"],
      ["'abab'"],
      ["'bbbb'"],
      ["'abba'"],
      ["'aabbaabb'"],
      ["'baab'"],
      ["'aaabbbab'"],
    ],
  },
  {
    n: 2263,
    id: 'pghub-b34-relay-network',
    name: 'Relay Network Reachability',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'reachableNodes',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A relay network has <code>n</code> stations numbered <code>0..n-1</code> connected by bidirectional links in <code>edges</code>, where each entry <code>[u, v]</code> links stations <code>u</code> and <code>v</code>. A broadcast begins at station <code>start</code> and spreads along links. Return the number of stations that receive the broadcast, including <code>start</code> itself.',
    examples: [
      ['5\n[[0,1],[1,2],[3,4]]\n0', '3', 'Stations 0, 1 and 2 are connected; 3 and 4 are a separate island.'],
      ['3\n[]\n2', '1', 'With no links only the starting station is reached.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 2*10^5', '0 <= u, v, start < n'],
    tags: ['graphs', 'bfs'],
    py: `def reachableNodes(n, edges, start):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    seen = [False] * n
    seen[start] = True
    stack = [start]
    count = 0
    while stack:
        node = stack.pop()
        count += 1
        for nb in adj[node]:
            if not seen[nb]:
                seen[nb] = True
                stack.append(nb)
    return count`,
    approach:
      'Build an undirected adjacency list and run a depth-first flood fill from the start station, marking each newly visited station so it is counted once. The size of the visited set is the number of reachable stations.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1],[1,2],[3,4]]', '0'],
      ['3', '[]', '2'],
      ['1', '[]', '0'],
      ['4', '[[0,1],[1,2],[2,3]]', '0'],
      ['6', '[[0,1],[2,3],[4,5]]', '4'],
      ['4', '[[0,1],[1,0],[2,3]]', '1'],
      ['5', '[[0,1],[0,2],[0,3],[0,4]]', '0'],
      ['7', '[[1,2],[2,3],[4,5]]', '0'],
      ['2', '[[0,1]]', '1'],
      ['5', '[[0,1],[1,2],[2,0],[3,4]]', '3'],
    ],
  },
  {
    n: 2268,
    id: 'pghub-b34-keypad-presses',
    name: 'Minimum Keypad Presses',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minPresses',
    params: [{ name: 'word', type: 'str' }],
    return_type: 'int',
    statement:
      'A phone keypad has 9 keys available for letters. You assign the 26 lowercase letters to keys so that each key holds some letters in a fixed order; typing the k-th letter on a key costs k presses. Every key must hold at most one letter at press-cost 1, at most one more at cost 2, and so on, and letters are assigned to minimize total typing. Given a <code>word</code>, return the minimum total number of presses to type it under the best possible assignment.',
    examples: [
      ['abcde', '5', 'Five distinct letters each get a cost-1 key, so five presses.'],
      ['aaa', '3', 'The single letter sits on a cost-1 key; three a presses cost 3.'],
    ],
    constraints: ['1 <= word.length <= 10^5', 'word consists of lowercase English letters'],
    tags: ['greedy', 'hashmap'],
    py: `def minPresses(word):
    freq = sorted(Counter(word).values(), reverse=True)
    total = 0
    for idx, f in enumerate(freq):
        cost = idx // 9 + 1
        total += cost * f
    return total`,
    approach:
      'Each key offers nine cheap slots (cost 1), then nine at cost 2, and so on. To minimize presses, the most frequent letters belong on the cheapest slots. Sort letter frequencies descending; the i-th letter (0-indexed) lands at press-cost floor(i/9)+1, so multiply each frequency by its slot cost and sum.',
    complexity: { time: 'O(n + k log k)', space: 'O(k)' },
    cases: [
      ["'abcde'"],
      ["'aaa'"],
      ["'a'"],
      ["'abcdefghijklmnopqrstuvwxyz'"],
      ["'aaaaabbbbcccdde'"],
      ["'zzzzzzzzzz'"],
      ["'abcabcabc'"],
      ["'thequickbrownfoxjumps'"],
      ["'mississippi'"],
      ["'aabbccddeeffgghhiijj'"],
    ],
  },
  {
    n: 2277,
    id: 'pghub-b34-stack-machine',
    name: 'Postfix Calculator',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'evalPostfix',
    params: [{ name: 'tokens', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Evaluate an arithmetic expression given in postfix (reverse Polish) notation as a list of <code>tokens</code>. Each token is either an integer or one of the operators <code>+</code>, <code>-</code>, <code>*</code>. An operator pops the two most recent values and pushes the result. Return the final value. Division is not used. The expression is guaranteed valid.',
    examples: [
      ['["2","3","+","4","*"]', '20', '(2 + 3) then times 4 equals 20.'],
      ['["5","1","2","+","-"]', '2', '1 + 2 = 3, then 5 - 3 = 2.'],
    ],
    constraints: ['1 <= tokens.length <= 10^4', 'tokens form a valid postfix expression with operators + - *'],
    tags: ['stack', 'simulation'],
    py: `def evalPostfix(tokens):
    stack = []
    for tok in tokens:
        if tok in ('+', '-', '*'):
            b = stack.pop()
            a = stack.pop()
            if tok == '+':
                stack.append(a + b)
            elif tok == '-':
                stack.append(a - b)
            else:
                stack.append(a * b)
        else:
            stack.append(int(tok))
    return stack[-1]`,
    approach:
      'Walk the tokens with a stack. Push numbers; on an operator pop the top two operands (the first popped is the right-hand side), apply the operator, and push the result. The lone remaining value is the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["2","3","+","4","*"]'],
      ['["5","1","2","+","-"]'],
      ['["42"]'],
      ['["3","4","5","*","-"]'],
      ['["10","2","-","3","*"]'],
      ['["-3","4","+"]'],
      ['["2","2","2","2","*","*","*"]'],
      ['["100","50","-","50","-"]'],
      ['["7","8","+","9","-"]'],
      ['["1","2","3","4","5","+","+","+","+"]'],
    ],
  },
  {
    n: 2282,
    id: 'pghub-b34-photo-frames',
    name: 'Largest Square Frame',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'largestSquare',
    params: [{ name: 'board', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A pegboard is given as a grid <code>board</code> of <code>0</code>s and <code>1</code>s, where <code>1</code> marks a usable cell. Return the area (number of cells) of the largest axis-aligned square made up entirely of usable cells, or <code>0</code> if there is none.',
    examples: [
      ['[[1,0,1],[1,1,1],[1,1,1]]', '4', 'A 2x2 block of usable cells gives area 4.'],
      ['[[0,0],[0,0]]', '0', 'No usable cells, so no square.'],
    ],
    constraints: ['1 <= board.length, board[0].length <= 300', 'board[i][j] is 0 or 1'],
    tags: ['2d-dp', 'matrix'],
    py: `def largestSquare(board):
    rows = len(board)
    cols = len(board[0])
    dp = [[0] * cols for _ in range(rows)]
    best = 0
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == 1:
                if r == 0 or c == 0:
                    dp[r][c] = 1
                else:
                    dp[r][c] = 1 + min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1])
                best = max(best, dp[r][c])
    return best * best`,
    approach:
      'Let dp[r][c] be the side length of the largest all-ones square whose bottom-right corner is (r,c). A usable cell extends the smallest of the squares ending directly above, left, and diagonally up-left by one. Track the maximum side and return its square as the area.',
    complexity: { time: 'O(rows*cols)', space: 'O(rows*cols)' },
    cases: [
      ['[[1,0,1],[1,1,1],[1,1,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1],[1]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[0,1,1,0],[1,1,1,1],[1,1,1,1],[0,1,1,0]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,1,0,1],[1,1,1,1],[0,1,1,1],[1,1,1,1]]'],
      ['[[0,0,0],[0,0,0]]'],
    ],
  },
  {
    n: 2291,
    id: 'pghub-b34-merge-logs',
    name: 'Merge Sorted Logs',
    topic_id: 'linkedlist',
    difficulty: 'Easy',
    method_name: 'mergeLogs',
    params: [
      { name: 'a', type: 'List[int]' },
      { name: 'b', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Two event logs <code>a</code> and <code>b</code> are each sorted in non-decreasing order by timestamp. Merge them into a single non-decreasing log containing every timestamp from both, preserving duplicates. Return the merged log.',
    examples: [
      ['[1,3,5]\n[2,4,6]', '[1,2,3,4,5,6]', 'Interleaving the two sorted logs yields one sorted log.'],
      ['[1,1]\n[1]', '[1,1,1]', 'Duplicates are kept.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', '-10^9 <= a[i], b[i] <= 10^9', 'a and b are sorted non-decreasing'],
    tags: ['linkedlist', 'two-pointers'],
    py: `def mergeLogs(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
    approach:
      'Classic two-pointer merge: walk both sorted logs at once, always appending the smaller current head (favouring a on ties to keep it stable), then append whatever tail remains in either log once one runs out.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['[1,3,5]', '[2,4,6]'],
      ['[1,1]', '[1]'],
      ['[]', '[2,4]'],
      ['[1,2,3]', '[]'],
      ['[]', '[]'],
      ['[5]', '[1]'],
      ['[1,4,7,10]', '[2,3,8,9]'],
      ['[-5,-1,0]', '[-3,-2,4]'],
      ['[2,2,2]', '[2,2]'],
      ['[1,10,100]', '[5,50,500]'],
    ],
  },
  {
    n: 2292,
    id: 'pghub-b34-coin-rows',
    name: 'Two-Row Coin Pickup',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxCoins',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A board has exactly two rows of cells given by <code>grid</code> (so <code>grid.length == 2</code>), each holding a non-negative coin count. You start above column 0 and move right one column at a time; in each column you may be in the top or bottom row, and switching rows is free. You collect the coins of every cell you stand on. Return the maximum coins collectible from column 0 through the last column.',
    examples: [
      ['[[1,2,3],[4,5,6]]', '15', 'Take the bottom row entirely: 4+5+6 = 15.'],
      ['[[5,0],[0,5]]', '10', 'Top of column 0 then bottom of column 1: 5+5 = 10.'],
    ],
    constraints: ['grid.length == 2', '1 <= grid[0].length <= 10^5', '0 <= grid[i][j] <= 10^4'],
    tags: ['dp', '2d-dp'],
    py: `def maxCoins(grid):
    cols = len(grid[0])
    top = grid[0][0]
    bot = grid[1][0]
    for c in range(1, cols):
        new_top = max(top, bot) + grid[0][c]
        new_bot = max(top, bot) + grid[1][c]
        top, bot = new_top, new_bot
    return max(top, bot)`,
    approach:
      'Process columns left to right keeping the best total achievable when ending in the top row versus the bottom row of the current column. Because switching rows within a column is free, each new cell adds to the better of the two previous-column totals. The answer is the larger of the two totals at the last column.',
    complexity: { time: 'O(cols)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6]]'],
      ['[[5,0],[0,5]]'],
      ['[[7],[3]]'],
      ['[[1,1,1,1],[1,1,1,1]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[10,0,10],[0,10,0]]'],
      ['[[3,2,1],[1,2,3]]'],
      ['[[9,9,9,9,9],[1,1,1,1,1]]'],
      ['[[2,8,1,9],[7,1,8,2]]'],
      ['[[100],[1]]'],
    ],
  },
  {
    n: 2297,
    id: 'pghub-b34-prefix-router',
    name: 'Longest Routing Prefix',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'matchPrefix',
    params: [
      { name: 'routes', type: 'List[str]' },
      { name: 'address', type: 'str' },
    ],
    return_type: 'str',
    statement:
      'A router holds a set of prefix <code>routes</code> (each a lowercase string). To route an <code>address</code> (also lowercase), the router picks the longest route that is a prefix of the address. Return that longest matching route, or an empty string if no route is a prefix of the address.',
    examples: [
      ['["a","ab","abc"]\nabcd', 'abc', 'All three are prefixes; the longest is "abc".'],
      ['["xy","z"]\nabc', '', 'Neither route is a prefix of "abc".'],
    ],
    constraints: ['0 <= routes.length <= 10^4', '1 <= address.length <= 10^4', 'routes and address are lowercase letters'],
    tags: ['tries', 'strings'],
    py: `def matchPrefix(routes, address):
    trie = {}
    END = '#'
    for r in routes:
        node = trie
        for ch in r:
            node = node.setdefault(ch, {})
        node[END] = True
    node = trie
    best = ''
    cur = []
    for ch in address:
        if ch not in node:
            break
        node = node[ch]
        cur.append(ch)
        if END in node:
            best = ''.join(cur)
    return best`,
    approach:
      'Insert every route into a trie, marking the end of each route. Then walk the address down the trie one character at a time; each time you pass a node flagged as a route end, record the path so far. Stop when the address leaves the trie. The last recorded route end is the longest matching prefix.',
    complexity: { time: 'O(total route length + address length)', space: 'O(total route length)' },
    multiParam: true,
    cases: [
      ['["a","ab","abc"]', "'abcd'"],
      ['["xy","z"]', "'abc'"],
      ['[]', "'abc'"],
      ['["abc"]', "'ab'"],
      ['["hello","he","hell"]', "'helloworld'"],
      ['["cat","car","card"]', "'cards'"],
      ['["a"]', "'a'"],
      ['["ab","abcd"]', "'abc'"],
      ['["dog","do","doge"]', "'doge'"],
      ['["x","xx","xxx","xxxx"]', "'xxx'"],
    ],
  },
  {
    n: 2298,
    id: 'pghub-b34-shelf-search',
    name: 'Shelf Rotation Search',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findBook',
    params: [
      { name: 'shelf', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A shelf of distinct book ids was sorted in increasing order, then rotated at some unknown pivot so it reads as a rotated sorted array <code>shelf</code>. Return the index of the book with id <code>target</code>, or <code>-1</code> if it is not on the shelf. Aim for logarithmic time.',
    examples: [
      ['[4,5,6,7,0,1,2]\n0', '4', 'Book 0 sits at index 4 after the rotation.'],
      ['[4,5,6,7,0,1,2]\n3', '-1', 'Book 3 is not on the shelf.'],
    ],
    constraints: ['1 <= shelf.length <= 10^5', 'shelf holds distinct integers and is a rotated sorted array', '-10^9 <= target, shelf[i] <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def findBook(shelf, target):
    lo, hi = 0, len(shelf) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if shelf[mid] == target:
            return mid
        if shelf[lo] <= shelf[mid]:
            if shelf[lo] <= target < shelf[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if shelf[mid] < target <= shelf[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    approach:
      'Binary search adapted for rotation: at each midpoint one half is guaranteed sorted. Decide which half is sorted by comparing the low end to the midpoint, then check whether the target falls inside that sorted half to choose which side to recurse on.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[4,5,6,7,0,1,2]', '0'],
      ['[4,5,6,7,0,1,2]', '3'],
      ['[1]', '1'],
      ['[1]', '0'],
      ['[5,1,2,3,4]', '1'],
      ['[3,4,5,1,2]', '5'],
      ['[6,7,8,1,2,3,4,5]', '8'],
      ['[2,3,4,5,6,7,1]', '7'],
      ['[10,20,30,40,50]', '40'],
      ['[2,1]', '2'],
    ],
  },
  {
    n: 2371,
    id: 'pghub-b34-xor-pairs',
    name: 'Single Unpaired Sensor',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'lonelySensor',
    params: [{ name: 'ids', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Every sensor reports an integer id into <code>ids</code>. Every id appears exactly twice except for one sensor whose id appears exactly once. Return the id of that single unpaired sensor. Solve it in linear time using constant extra space.',
    examples: [
      ['[4,1,2,1,2]', '4', 'Ids 1 and 2 are paired; 4 stands alone.'],
      ['[7]', '7', 'A single sensor is unpaired.'],
    ],
    constraints: ['1 <= ids.length <= 10^5', 'ids.length is odd', '0 <= ids[i] <= 10^9', 'exactly one id appears once; all others appear twice'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def lonelySensor(ids):
    acc = 0
    for x in ids:
        acc ^= x
    return acc`,
    approach:
      'XOR is associative and commutative, and any value XORed with itself cancels to zero. XOR every id together: the paired ids annihilate in pairs, leaving only the single unpaired id.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[4,1,2,1,2]'],
      ['[7]'],
      ['[1,1,9]'],
      ['[3,3,5,5,8]'],
      ['[0,0,42]'],
      ['[100,200,100]'],
      ['[1,2,3,2,1]'],
      ['[10,10,20,30,30]'],
      ['[999999999,1,1]'],
      ['[5,6,5,6,7,8,8]'],
    ],
  },
  {
    n: 2372,
    id: 'pghub-b34-job-scheduler',
    name: 'Profit Job Scheduler',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'maxProfit',
    params: [
      { name: 'jobs', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'You can work on at most one job per day. Each job in <code>jobs</code> is <code>[deadline, profit]</code>: the job earns <code>profit</code> if it is completed on or before its <code>deadline</code> (a day number starting at 1), and every job takes exactly one day. Return the maximum total profit obtainable by scheduling a subset of jobs.',
    examples: [
      ['[[2,100],[1,19],[2,27],[1,25]]', '127', 'Do job [1,25] on day 1 and [2,100] on day 2 for 125, or better: [2,27] and [2,100] is 127.'],
      ['[[1,5],[1,6],[1,7]]', '7', 'Only one day-1 slot; pick the highest profit, 7.'],
    ],
    constraints: ['1 <= jobs.length <= 10^5', '1 <= deadline <= 10^5', '1 <= profit <= 10^4'],
    tags: ['heap', 'greedy'],
    py: `def maxProfit(jobs):
    jobs = sorted(jobs, key=lambda j: j[0])
    heap = []
    for deadline, profit in jobs:
        heapq.heappush(heap, profit)
        if len(heap) > deadline:
            heapq.heappop(heap)
    return sum(heap)`,
    approach:
      'Process jobs in order of deadline. Maintain a min-heap of the profits of jobs tentatively scheduled. Push each job; if the number of scheduled jobs ever exceeds the current deadline (the maximum jobs doable by then), evict the lowest-profit job. The heap always holds the most profitable feasible set, so its sum is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[[2,100],[1,19],[2,27],[1,25]]'],
      ['[[1,5],[1,6],[1,7]]'],
      ['[[1,50]]'],
      ['[[3,10],[3,20],[3,30]]'],
      ['[[1,10],[2,20],[3,30]]'],
      ['[[1,100],[1,90],[1,80],[1,70]]'],
      ['[[4,5],[1,10],[1,8],[2,6],[2,7]]'],
      ['[[2,1],[2,1],[2,1],[2,1]]'],
      ['[[5,1],[5,2],[5,3],[5,4],[5,5]]'],
      ['[[1,1],[2,2],[3,3],[1,4],[2,5]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B34>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b34-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B34>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B34>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b34-grade-${prob.n}.py`);
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
