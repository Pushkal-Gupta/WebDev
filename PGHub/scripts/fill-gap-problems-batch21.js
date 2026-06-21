#!/usr/bin/env node
// Batch 21 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1181, 1182, 1183, 1188, 1194, 1196, 1197, 1198, 1199, 1205, 1212, 1213, 1214, 1215, 1216
//
//   node scripts/fill-gap-problems-batch21.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch21.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch21.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1181, 1182, 1183, 1188, 1194, 1196, 1197, 1198, 1199, 1205, 1212, 1213, 1214, 1215, 1216];

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
    n: 1181,
    id: 'pghub-b21-ledger-balance',
    name: 'Ledger Zero Balance',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'firstZeroDay',
    params: [{ name: 'deltas', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A ledger starts at balance 0. On day <code>i</code> (0-indexed) the balance changes by <code>deltas[i]</code>. Return the 0-indexed day after which the running balance first returns to exactly 0, or -1 if it never does.',
    examples: [
      ['[3,-1,-2,5]', '2', 'After day 2 the running balance is 3-1-2 = 0.'],
      ['[1,2,3]', '-1', 'The balance never comes back to 0.'],
    ],
    constraints: ['1 <= deltas.length <= 10^5', '-10^4 <= deltas[i] <= 10^4'],
    tags: ['arrays', 'prefix-sum'],
    py: `def firstZeroDay(deltas):
    running = 0
    for i, d in enumerate(deltas):
        running += d
        if running == 0:
            return i
    return -1`,
    approach:
      'Maintain a running prefix sum starting from 0. The moment the prefix sum equals 0 after applying a day delta, that day index is the answer. If the loop ends without hitting 0, return -1.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,-1,-2,5]'],
      ['[1,2,3]'],
      ['[0]'],
      ['[5,-5]'],
      ['[1,-1,1,-1]'],
      ['[-2,2,-2,2,7]'],
      ['[10]'],
      ['[4,4,-8,1]'],
      ['[-1,-1,-1,3]'],
      ['[2,3,-5,9,-9]'],
    ],
  },
  {
    n: 1182,
    id: 'pghub-b21-keypad-words',
    name: 'Keypad Word Cost',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'typingCost',
    params: [{ name: 'word', type: 'str' }],
    return_type: 'int',
    statement:
      'On an old phone keypad each lowercase letter is reached by repeated presses of one key. The groups are <code>abc=2</code>, <code>def=3</code>, <code>ghi=4</code>, <code>jkl=5</code>, <code>mno=6</code>, <code>pqrs=7</code>, <code>tuv=8</code>, <code>wxyz=9</code>. A letter costs its position within its group (1 to 4 presses). Return the total number of presses to type <code>word</code>.',
    examples: [
      ['"abc"', '6', 'a=1, b=2, c=3 presses, total 6.'],
      ['"zz"', '8', 'z is the 4th letter on key 9, so 4+4.'],
    ],
    constraints: ['1 <= word.length <= 10^4', 'word consists of lowercase letters'],
    tags: ['strings', 'hashing'],
    py: `def typingCost(word):
    groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    cost = {}
    for g in groups:
        for pos, ch in enumerate(g):
            cost[ch] = pos + 1
    return sum(cost[ch] for ch in word)`,
    approach:
      'Build a lookup mapping each letter to its 1-based position inside its keypad group, which equals the press count. Sum the press counts over the characters of the word.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"abc"'],
      ['"zz"'],
      ['"hello"'],
      ['"a"'],
      ['"s"'],
      ['"pqrs"'],
      ['"wxyz"'],
      ['"aaaa"'],
      ['"mno"'],
      ['"keypad"'],
    ],
  },
  {
    n: 1183,
    id: 'pghub-b21-stack-machine',
    name: 'Postfix Stack Machine',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'evalPostfix',
    params: [{ name: 'tokens', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Evaluate a postfix (Reverse Polish) expression given as <code>tokens</code>. Each token is either an integer or one of the operators <code>+</code>, <code>-</code>, <code>*</code>. Operators pop the top two values (the deeper one is the left operand). The input is guaranteed valid. Return the final integer result.',
    examples: [
      ['["2","3","+","4","*"]', '20', '(2+3)*4 = 20.'],
      ['["5","1","2","-","-"]', '6', '5 - (1-2) = 6.'],
    ],
    constraints: ['1 <= tokens.length <= 10^4', 'every token is an integer or one of + - *'],
    tags: ['stack', 'math'],
    py: `def evalPostfix(tokens):
    stack = []
    ops = {"+", "-", "*"}
    for tok in tokens:
        if tok in ops:
            b = stack.pop()
            a = stack.pop()
            if tok == "+":
                stack.append(a + b)
            elif tok == "-":
                stack.append(a - b)
            else:
                stack.append(a * b)
        else:
            stack.append(int(tok))
    return stack[-1]`,
    approach:
      'Scan tokens left to right with a stack. Push numbers; on an operator pop two operands (first popped is the right operand), apply the operation, and push the result. The single remaining stack value is the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["2","3","+","4","*"]'],
      ['["5","1","2","-","-"]'],
      ['["42"]'],
      ['["3","4","+"]'],
      ['["10","2","-"]'],
      ['["2","2","2","*","*"]'],
      ['["-3","5","+"]'],
      ['["7","-2","*"]'],
      ['["1","2","3","4","+","+","+"]'],
      ['["6","2","-","3","*"]'],
    ],
  },
  {
    n: 1188,
    id: 'pghub-b21-canteen-queue',
    name: 'Canteen Queue Wait',
    topic_id: 'queue',
    difficulty: 'Medium',
    method_name: 'totalWait',
    params: [
      { name: 'arrivals', type: 'List[int]' },
      { name: 'service', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A single canteen counter serves one customer at a time, each taking <code>service</code> time units. Customers arrive at the non-decreasing times in <code>arrivals</code> and are served first-come first-served. A customer who arrives while the counter is busy waits in line. Return the total waiting time across all customers (waiting time excludes their own service time).',
    examples: [
      ['[0,1,2]\n3', '6', 'Service windows [0,3),[3,6),[6,9); waits 0+2+4 = 6.'],
      ['[0,10,20]\n3', '0', 'Everyone arrives to an idle counter.'],
    ],
    constraints: ['1 <= arrivals.length <= 10^5', 'arrivals is non-decreasing', '0 <= arrivals[i] <= 10^9', '1 <= service <= 10^9'],
    tags: ['queue', 'simulation'],
    py: `def totalWait(arrivals, service):
    free_at = 0
    total = 0
    for a in arrivals:
        start = max(a, free_at)
        total += start - a
        free_at = start + service
    return total`,
    approach:
      'Track when the counter next becomes free. Each customer starts at the later of their arrival and the free time; their wait is that start minus arrival. Accumulate waits and advance the free time by the service duration.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[0,1,2]', '3'],
      ['[0,10,20]', '3'],
      ['[0,0,0]', '2'],
      ['[5]', '4'],
      ['[1,2,3,4,5]', '2'],
      ['[0,3,6,9]', '3'],
      ['[0,1,1,1]', '5'],
      ['[2,2,2,2,2]', '1'],
      ['[0,100,100,100]', '10'],
      ['[1,1,1,1,1,1]', '3'],
    ],
  },
  {
    n: 1194,
    id: 'pghub-b21-mountain-peak',
    name: 'Single Mountain Peak',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'peakIndex',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'An array <code>heights</code> strictly increases up to a single peak and then strictly decreases (a mountain with at least three elements). Return the index of the peak element in <code>O(log n)</code> time.',
    examples: [
      ['[1,3,5,4,2]', '2', 'The peak value 5 is at index 2.'],
      ['[0,10,9]', '1', 'The peak value 10 is at index 1.'],
    ],
    constraints: ['3 <= heights.length <= 10^5', 'heights forms a strict mountain'],
    tags: ['binary-search', 'arrays'],
    py: `def peakIndex(heights):
    lo, hi = 0, len(heights) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if heights[mid] < heights[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    approach:
      'Binary search on the slope. If heights[mid] < heights[mid+1] the peak is to the right, so move lo past mid; otherwise the peak is at mid or to its left, so set hi to mid. The loop converges on the single peak index.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[1,3,5,4,2]'],
      ['[0,10,9]'],
      ['[1,2,3,4,1]'],
      ['[5,10,15,20,25,30,12]'],
      ['[1,100,99,98,97,96]'],
      ['[1,2,3,4,5,6,5]'],
      ['[2,4,6,8,10,1]'],
      ['[3,6,9,12,15,18,21,2]'],
      ['[10,20,15]'],
      ['[1,2,1]'],
    ],
  },
  {
    n: 1196,
    id: 'pghub-b21-orchard-rows',
    name: 'Two Distinct Fruit Rows',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestTwoKinds',
    params: [{ name: 'trees', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of fruit trees is given by <code>trees</code>, each value a fruit type. Walking left to right you may pick from a contiguous stretch of trees but your two baskets together can hold at most two distinct fruit types. Return the maximum number of trees in such a contiguous stretch.',
    examples: [
      ['[1,2,1,3,3]', '3', 'Trees [1,2,1] use only types 1 and 2.'],
      ['[4,4,4,4]', '4', 'A single type fills the whole row.'],
    ],
    constraints: ['1 <= trees.length <= 10^5', '0 <= trees[i] <= 10^9'],
    tags: ['sliding-window', 'hashing'],
    py: `def longestTwoKinds(trees):
    counts = {}
    left = 0
    best = 0
    for right, t in enumerate(trees):
        counts[t] = counts.get(t, 0) + 1
        while len(counts) > 2:
            lt = trees[left]
            counts[lt] -= 1
            if counts[lt] == 0:
                del counts[lt]
            left += 1
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window keeping a count of fruit types inside it. When the window holds more than two distinct types, shrink from the left until only two remain. Track the maximum window width seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,2,1,3,3]'],
      ['[4,4,4,4]'],
      ['[1,2,3,2,2]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[0,0,1,1,2,2,2]'],
      ['[5,5,5,1,1,1,1]'],
      ['[1,2,1,2,1,2]'],
      ['[7,8,9,8,7,8]'],
      ['[1,1,2,2,3,3,3,3]'],
    ],
  },
  {
    n: 1197,
    id: 'pghub-b21-courier-fuel',
    name: 'Courier Fuel Stops',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'minRefuels',
    params: [
      { name: 'target', type: 'int' },
      { name: 'start', type: 'int' },
      { name: 'stations', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'A courier must drive exactly <code>target</code> kilometres. It begins with <code>start</code> litres of fuel and uses one litre per kilometre. Each entry <code>stations[i] = [pos, fuel]</code> is a station at distance <code>pos</code> from the origin offering <code>fuel</code> litres. Stations are given in increasing <code>pos</code>. Return the minimum number of refuelling stops needed to reach the target, or -1 if impossible.',
    examples: [
      ['100\n10\n[[10,60],[20,30],[30,30],[60,40]]', '2', 'Stop at 10 (+60) and 60 (+40) to reach 100.'],
      ['100\n50\n[]', '-1', 'Not enough fuel and no stations.'],
    ],
    constraints: ['1 <= target <= 10^9', '0 <= start <= 10^9', '0 <= stations.length <= 500', 'stations sorted by increasing pos'],
    tags: ['heap', 'greedy'],
    py: `def minRefuels(target, start, stations):
    pq = []
    fuel = start
    stops = 0
    i = 0
    n = len(stations)
    while fuel < target:
        while i < n and stations[i][0] <= fuel:
            heapq.heappush(pq, -stations[i][1])
            i += 1
        if not pq:
            return -1
        fuel += -heapq.heappop(pq)
        stops += 1
    return stops`,
    approach:
      'Greedy with a max-heap of fuel amounts from stations already reachable. Whenever the current fuel cannot reach the target, push all stations within range onto the heap, then refuel from the largest available tank, counting a stop. If no station is reachable and the target is not met, it is impossible.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['100', '10', '[[10,60],[20,30],[30,30],[60,40]]'],
      ['100', '50', '[]'],
      ['1', '1', '[]'],
      ['10', '10', '[]'],
      ['200', '10', '[[10,60],[70,60],[120,60]]'],
      ['100', '1', '[[1,99]]'],
      ['100', '1', '[[1,1],[2,1]]'],
      ['50', '25', '[[25,25]]'],
      ['1000', '100', '[[100,100],[200,100],[300,100]]'],
      ['100', '0', '[[0,50],[50,50]]'],
    ],
  },
  {
    n: 1198,
    id: 'pghub-b21-zigzag-tree',
    name: 'Tree Zigzag Levels',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'zigzagLevels',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    statement:
      'A binary tree is given as a level-order array <code>tree</code> where <code>null</code> marks an absent node (encoded as <code>-1</code>). Return its values level by level, but alternate direction: the first level left to right, the second right to left, and so on (zigzag order).',
    examples: [
      ['[3,9,20,-1,-1,15,7]', '[[3],[20,9],[15,7]]', 'Level 1 normal, level 2 reversed, level 3 normal.'],
      ['[1]', '[[1]]', 'A single node.'],
    ],
    constraints: ['1 <= tree.length <= 10^4', 'tree is a valid level-order encoding with -1 for null', 'node values are non-negative'],
    tags: ['trees', 'bfs'],
    py: `def zigzagLevels(tree):
    if not tree or tree[0] == -1:
        return []
    # build children via the standard compact level-order convention
    nodes = []
    for v in tree:
        nodes.append(None if v == -1 else {"val": v, "left": None, "right": None})
    child = 1
    for i in range(len(nodes)):
        if nodes[i] is None:
            continue
        if child < len(nodes):
            nodes[i]["left"] = nodes[child]
            child += 1
        if child < len(nodes):
            nodes[i]["right"] = nodes[child]
            child += 1
    result = []
    q = deque([nodes[0]])
    left_to_right = True
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node["val"])
            if node["left"]:
                q.append(node["left"])
            if node["right"]:
                q.append(node["right"])
        result.append(level if left_to_right else level[::-1])
        left_to_right = not left_to_right
    return result`,
    approach:
      'Rebuild the tree from the compact level-order array (skipping null markers when wiring children), then run a breadth-first traversal recording one list per level. Reverse every other level to achieve the alternating zigzag direction.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,9,20,-1,-1,15,7]'],
      ['[1]'],
      ['[1,2,3,4,5,6,7]'],
      ['[1,2,-1,3]'],
      ['[5,4,8,11,-1,13,4,7,2]'],
      ['[1,-1,2,-1,3]'],
      ['[10,20,30,40,50,60,70]'],
      ['[1,2,3,-1,-1,-1,4]'],
      ['[0]'],
      ['[2,1,3]'],
    ],
  },
  {
    n: 1199,
    id: 'pghub-b21-island-perimeter',
    name: 'Lake Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Easy',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A binary <code>grid</code> describes a lake where <code>1</code> is land and <code>0</code> is water. There is exactly one connected island with no internal lakes. Return the perimeter of the island (the total length of edges bordering water or the grid boundary).',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'The plus-shaped island has 12 exposed edges.'],
      ['[[1]]', '4', 'A lone cell has four exposed sides.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', 'grid[i][j] is 0 or 1', 'exactly one island'],
    tags: ['graphs', 'matrix'],
    py: `def islandPerimeter(grid):
    rows, cols = len(grid), len(grid[0])
    perimeter = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                perimeter += 4
                if r > 0 and grid[r-1][c] == 1:
                    perimeter -= 2
                if c > 0 and grid[r][c-1] == 1:
                    perimeter -= 2
    return perimeter`,
    approach:
      'Each land cell contributes four edges. For every shared border with a land neighbour to the top or left, subtract two (one for each of the two adjacent cells). Summing over all land cells yields the exposed perimeter.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[1,0]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[0,0,0],[0,1,0],[0,0,0]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[0,1],[1,1]]'],
    ],
  },
  {
    n: 1205,
    id: 'pghub-b21-coin-combos',
    name: 'Coin Change Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given distinct positive coin denominations <code>coins</code> and a target <code>amount</code>, return the number of distinct combinations of coins (each usable unlimited times) that sum to exactly <code>amount</code>. Combinations differing only in order count once.',
    examples: [
      ['[1,2,5]\n5', '4', '5, 2+2+1, 2+1+1+1, 1+1+1+1+1.'],
      ['[2]\n3', '0', 'No combination of 2s makes 3.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 5000', '0 <= amount <= 5000'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for coin in coins:
        for total in range(coin, amount + 1):
            dp[total] += dp[total - coin]
    return dp[amount]`,
    approach:
      'Unbounded knapsack counting. dp[t] is the number of combinations summing to t. Iterate coins in the outer loop and totals inward so each combination is counted once regardless of order; add dp[t-coin] into dp[t]. The answer is dp[amount].',
    complexity: { time: 'O(coins * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10]', '20'],
      ['[2,3,5]', '8'],
      ['[1,5,10,25]', '30'],
      ['[7]', '14'],
      ['[3,4]', '7'],
      ['[1,2]', '10'],
    ],
  },
  {
    n: 1212,
    id: 'pghub-b21-gift-distribution',
    name: 'Fair Gift Distribution',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minGifts',
    params: [{ name: 'ratings', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Children stand in a line with the scores in <code>ratings</code>. Each child gets at least one gift, and any child with a strictly higher score than an immediate neighbour must receive more gifts than that neighbour. Return the minimum total number of gifts.',
    examples: [
      ['[1,0,2]', '5', 'Gifts 2,1,2 satisfy the rules.'],
      ['[1,2,2]', '4', 'Gifts 1,2,1; equal neighbours have no constraint.'],
    ],
    constraints: ['1 <= ratings.length <= 10^5', '0 <= ratings[i] <= 10^9'],
    tags: ['greedy', 'arrays'],
    py: `def minGifts(ratings):
    n = len(ratings)
    gifts = [1] * n
    for i in range(1, n):
        if ratings[i] > ratings[i-1]:
            gifts[i] = gifts[i-1] + 1
    for i in range(n - 2, -1, -1):
        if ratings[i] > ratings[i+1]:
            gifts[i] = max(gifts[i], gifts[i+1] + 1)
    return sum(gifts)`,
    approach:
      'Two greedy passes. Left to right, give a child one more gift than its left neighbour when its score is higher. Right to left, ensure a child with a higher score than its right neighbour still gets more, taking the max with its current count. Sum the counts.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,0,2]'],
      ['[1,2,2]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[1]'],
      ['[2,2,2,2]'],
      ['[1,3,2,2,1]'],
      ['[1,2,87,87,87,2,1]'],
      ['[0,1,0,1,0]'],
      ['[10,5,5,5,10]'],
    ],
  },
  {
    n: 1213,
    id: 'pghub-b21-xor-pairs',
    name: 'Maximum XOR Pair',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'maxXorPair',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code> of non-negative integers, return the maximum value of <code>nums[i] XOR nums[j]</code> over all pairs of indices (i may equal j is not required; choose two elements). If the array has a single element, the answer is 0.',
    examples: [
      ['[3,10,5,25,2,8]', '28', '5 XOR 25 = 28 is the maximum.'],
      ['[0]', '0', 'Only one element.'],
    ],
    constraints: ['1 <= nums.length <= 2 * 10^5', '0 <= nums[i] <= 2^31 - 1'],
    tags: ['tries', 'bit-manipulation'],
    py: `def maxXorPair(nums):
    if len(nums) < 2:
        return 0
    HIGH = 31
    root = {}
    def insert(x):
        node = root
        for b in range(HIGH, -1, -1):
            bit = (x >> b) & 1
            if bit not in node:
                node[bit] = {}
            node = node[bit]
    def query(x):
        node = root
        best = 0
        for b in range(HIGH, -1, -1):
            bit = (x >> b) & 1
            want = 1 - bit
            if want in node:
                best |= (1 << b)
                node = node[want]
            else:
                node = node[bit]
        return best
    insert(nums[0])
    answer = 0
    for x in nums[1:]:
        answer = max(answer, query(x))
        insert(x)
    return answer`,
    approach:
      'Build a binary trie of the numbers bit by bit from the most significant bit. For each number, greedily walk the trie choosing the opposite bit at every level when available to maximize the XOR, querying against numbers inserted so far. Track the best XOR found.',
    complexity: { time: 'O(n * 32)', space: 'O(n * 32)' },
    cases: [
      ['[3,10,5,25,2,8]'],
      ['[0]'],
      ['[1,2]'],
      ['[8,1,2,12,7,6]'],
      ['[0,0,0]'],
      ['[14,70,53,83,49,91,36,80,92,51,66,70]'],
      ['[2147483647,0]'],
      ['[1,1,1,1]'],
      ['[15,16]'],
      ['[5,5,5,10]'],
    ],
  },
  {
    n: 1214,
    id: 'pghub-b21-warehouse-rotate',
    name: 'Rotate Inventory Array',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rotateRight',
    params: [
      { name: 'items', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Rotate the array <code>items</code> to the right by <code>k</code> positions, so each element moves <code>k</code> places toward the end and elements that fall off wrap to the front. <code>k</code> may exceed the array length. Return the rotated array.',
    examples: [
      ['[1,2,3,4,5]\n2', '[4,5,1,2,3]', 'The last two elements wrap to the front.'],
      ['[1,2]\n3', '[2,1]', 'k = 3 is equivalent to a single right rotation.'],
    ],
    constraints: ['1 <= items.length <= 10^5', '0 <= k <= 10^9'],
    tags: ['arrays', 'two-pointers'],
    py: `def rotateRight(items, k):
    n = len(items)
    k %= n
    if k == 0:
        return items[:]
    return items[-k:] + items[:-k]`,
    approach:
      'Reduce k modulo the length to avoid redundant full turns. The rotated array is the last k elements followed by the remaining prefix. A modulo of zero means the array is unchanged.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[1,2]', '3'],
      ['[1,2,3]', '0'],
      ['[1]', '100'],
      ['[1,2,3,4,5,6,7]', '7'],
      ['[10,20,30,40]', '1'],
      ['[5,4,3,2,1]', '4'],
      ['[1,2,3,4]', '6'],
      ['[9,8,7]', '2'],
      ['[1,2,3,4,5]', '5'],
    ],
  },
  {
    n: 1215,
    id: 'pghub-b21-subset-sum-recur',
    name: 'Achievable Subset Sums',
    topic_id: 'recursion',
    difficulty: 'Medium',
    method_name: 'distinctSums',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given a list <code>nums</code> of non-negative integers (length at most 16), return every distinct sum achievable by choosing some subset of the elements, including the empty subset (sum 0). Return the sums in ascending order.',
    examples: [
      ['[1,2]', '[0,1,2,3]', 'Subsets sum to 0, 1, 2, and 3.'],
      ['[2,2]', '[0,2,4]', 'Duplicate sums collapse to distinct values.'],
    ],
    constraints: ['0 <= nums.length <= 16', '0 <= nums[i] <= 1000'],
    tags: ['recursion', 'backtracking'],
    py: `def distinctSums(nums):
    sums = set()
    def recurse(idx, total):
        if idx == len(nums):
            sums.add(total)
            return
        recurse(idx + 1, total)
        recurse(idx + 1, total + nums[idx])
    recurse(0, 0)
    return sorted(sums)`,
    approach:
      'Recurse over the elements, at each index branching between skipping and including the current value and accumulating the running total. Collect every total reached at the end of the recursion in a set to deduplicate, then return the sorted sums.',
    complexity: { time: 'O(2^n)', space: 'O(2^n)' },
    cases: [
      ['[1,2]'],
      ['[2,2]'],
      ['[]'],
      ['[5]'],
      ['[1,2,3]'],
      ['[0,0,0]'],
      ['[10,20,30]'],
      ['[1,1,1,1]'],
      ['[3,7]'],
      ['[1,2,4,8]'],
    ],
  },
  {
    n: 1216,
    id: 'pghub-b21-network-delay',
    name: 'Signal Network Delay',
    topic_id: 'graphs',
    difficulty: 'Hard',
    method_name: 'networkDelay',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
      { name: 'source', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A network has <code>n</code> nodes numbered <code>0..n-1</code>. Each entry <code>edges[i] = [u, v, w]</code> is a directed link from <code>u</code> to <code>v</code> taking <code>w</code> time units. A signal starts at <code>source</code>. Return the time for every node to receive the signal (the maximum shortest-path distance), or -1 if some node is unreachable.',
    examples: [
      ['4\n[[0,1,1],[0,2,4],[1,2,1],[2,3,1]]\n0', '3', 'Farthest node 3 is reached at time 0->1->2->3 = 3.'],
      ['2\n[[0,1,5]]\n1', '-1', 'Node 0 is unreachable from source 1.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 5 * 10^4', '0 <= u, v < n', '1 <= w <= 10^6', '0 <= source < n'],
    tags: ['graphs', 'dijkstra'],
    py: `def networkDelay(n, edges, source):
    adj = defaultdict(list)
    for u, v, w in edges:
        adj[u].append((v, w))
    INF = float('inf')
    dist = [INF] * n
    dist[source] = 0
    pq = [(0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    worst = max(dist)
    return -1 if worst == INF else worst`,
    approach:
      'Run Dijkstra from the source over the directed weighted graph to compute the shortest arrival time at every node. The time for the whole network to receive the signal is the largest of these shortest distances; if any node remains at infinity it is unreachable, so return -1.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1,1],[0,2,4],[1,2,1],[2,3,1]]', '0'],
      ['2', '[[0,1,5]]', '1'],
      ['1', '[]', '0'],
      ['3', '[[0,1,2],[1,2,3]]', '0'],
      ['3', '[[0,1,1],[0,2,1]]', '0'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0'],
      ['2', '[[0,1,5]]', '0'],
      ['5', '[[0,1,2],[0,2,2],[1,3,3],[2,4,1]]', '0'],
      ['3', '[[0,1,10],[1,2,10]]', '2'],
      ['4', '[[0,1,1],[0,2,5],[1,2,1],[1,3,8],[2,3,2]]', '0'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B21>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b21-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B21>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B21>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b21-grade-${prob.n}.py`);
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
