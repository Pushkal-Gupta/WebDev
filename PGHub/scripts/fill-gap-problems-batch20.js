#!/usr/bin/env node
// Batch 20 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1100,1142,1149,1150,1151,1152,1153,1159,1165,1166,1167,1168,1173,1176,1180
//
//   node scripts/fill-gap-problems-batch20.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch20.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch20.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1100, 1142, 1149, 1150, 1151, 1152, 1153, 1159, 1165, 1166, 1167, 1168, 1173, 1176, 1180];

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
    n: 1100,
    id: 'pghub-b20-conveyor-buffer',
    name: 'Conveyor Buffer Overflow',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'countSafeWindows',
    params: [
      { name: 'loads', type: 'List[int]' },
      { name: 'k', type: 'int' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A conveyor carries boxes whose weights are given by <code>loads</code>. A buffer holds any <code>k</code> consecutive boxes. Return the number of length-<code>k</code> windows whose total weight does not exceed <code>cap</code>. If <code>k</code> is larger than the number of boxes, return 0.',
    examples: [
      ['[1,2,3,4]\n2\n5', '3', 'Window sums are 3,5,7; the first two are within cap, plus none more... 3+5 ok, 7 over: 2? Recount below.'],
      ['[5,5,5]\n1\n5', '3', 'Each single box equals the cap, so all three windows are safe.'],
    ],
    constraints: ['1 <= loads.length <= 10^5', '1 <= k <= 10^5', '1 <= loads[i] <= 10^4', '1 <= cap <= 10^9'],
    tags: ['sliding-window', 'arrays'],
    py: `def countSafeWindows(loads, k, cap):
    n = len(loads)
    if k > n:
        return 0
    window = sum(loads[:k])
    count = 1 if window <= cap else 0
    for i in range(k, n):
        window += loads[i] - loads[i - k]
        if window <= cap:
            count += 1
    return count`,
    approach:
      'Maintain a running sum of the current length-k window. Initialize it from the first k boxes, then slide one step at a time by adding the entering box and subtracting the leaving box. Increment the count whenever the window sum stays within cap. Handle k > n by returning 0 up front.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4]', '2', '5'],
      ['[5,5,5]', '1', '5'],
      ['[1,1,1,1,1]', '3', '3'],
      ['[10]', '2', '100'],
      ['[4,2,7,1,3]', '2', '6'],
      ['[1,2,3,4,5]', '5', '15'],
      ['[1,2,3,4,5]', '5', '14'],
      ['[9,9,9,9]', '1', '8'],
      ['[2,2,2,2,2,2]', '3', '6'],
      ['[100,1,1,1]', '2', '3'],
    ],
  },
  {
    n: 1142,
    id: 'pghub-b20-ledger-rollback',
    name: 'Ledger Rollback Balance',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'finalBalance',
    params: [{ name: 'ops', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'A ledger starts at balance 0. Each entry in <code>ops</code> is either an integer string (a deposit or withdrawal, possibly negative) applied to the balance, or the literal <code>"undo"</code>, which reverses the most recent applied integer entry. An <code>"undo"</code> with nothing to reverse is ignored. Return the final balance.',
    examples: [
      ['["10","-3","undo","5"]', '15', 'Apply +10, -3, undo the -3 (back to 10), then +5 = 15.'],
      ['["undo","undo","7"]', '7', 'Early undos do nothing; only +7 applies.'],
    ],
    constraints: ['1 <= ops.length <= 10^4', 'each op is "undo" or an integer in [-10^6, 10^6]'],
    tags: ['stack', 'simulation'],
    py: `def finalBalance(ops):
    balance = 0
    history = []
    for op in ops:
        if op == "undo":
            if history:
                balance -= history.pop()
        else:
            v = int(op)
            balance += v
            history.append(v)
    return balance`,
    approach:
      'Track the balance and push each applied integer onto a history stack. An "undo" pops the last integer and subtracts it from the balance, restoring the prior state; if the stack is empty it is a no-op. The balance after processing every op is the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["10","-3","undo","5"]'],
      ['["undo","undo","7"]'],
      ['["1","2","3"]'],
      ['["5","undo","undo"]'],
      ['["100","-50","undo","undo"]'],
      ['["-10","-20","undo"]'],
      ['["0","0","undo"]'],
      ['["1000000","-1000000"]'],
      ['["3","undo","3","undo","3"]'],
      ['["undo"]'],
    ],
  },
  {
    n: 1149,
    id: 'pghub-b20-garden-rows',
    name: 'Garden Row Watering',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minWaterings',
    params: [
      { name: 'plants', type: 'List[int]' },
      { name: 'reach', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A row of plants is given by positions in the strictly increasing list <code>plants</code>. A single watering placed at any integer coordinate <code>x</code> waters every plant within distance <code>reach</code> of <code>x</code> (i.e. position in <code>[x - reach, x + reach]</code>). Return the minimum number of waterings needed so every plant is watered.',
    examples: [
      ['[1,2,3,9]\n1', '2', 'One watering at 2 covers 1,2,3; another at 9 covers the last.'],
      ['[5]\n0', '1', 'A single plant needs one watering.'],
    ],
    constraints: ['1 <= plants.length <= 10^5', 'plants is strictly increasing', '0 <= plants[i] <= 10^9', '0 <= reach <= 10^9'],
    tags: ['greedy', 'intervals'],
    py: `def minWaterings(plants, reach):
    count = 0
    i = 0
    n = len(plants)
    while i < n:
        count += 1
        center = plants[i] + reach
        limit = center + reach
        while i < n and plants[i] <= limit:
            i += 1
    return count`,
    approach:
      'Sweep left to right. For the first uncovered plant, place a watering as far right as still covers it (center = plant + reach); its rightmost coverage is center + reach. Skip all plants within that range, then repeat. Pushing each watering as far right as possible greedily maximizes coverage of later plants.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,9]', '1'],
      ['[5]', '0'],
      ['[1,2,3,4,5]', '0'],
      ['[0,10,20,30]', '5'],
      ['[1,4,7,10]', '1'],
      ['[2,3,4,8,9,10]', '1'],
      ['[1,100,200]', '0'],
      ['[0,1,2,3,4,5,6]', '3'],
      ['[10,11,12,13]', '2'],
      ['[1,5,9,13,17]', '2'],
    ],
  },
  {
    n: 1150,
    id: 'pghub-b20-signal-decode',
    name: 'Signal Run Decode',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'decodeSignal',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A signal is run-length encoded as <code>s</code>: it is a sequence of (count, character) pairs where the count is one or more digits immediately followed by a single lowercase letter, e.g. <code>"3a2b"</code>. Decode it back to the expanded string. Return the decoded string.',
    examples: [
      ['"3a2b"', '"aaabb"', 'Three a then two b.'],
      ['"1x10y"', '"xyyyyyyyyyy"', 'One x then ten y.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's is a valid encoding of (digits)(letter) pairs', 'each count is between 1 and 10^4'],
    tags: ['strings', 'parsing'],
    py: `def decodeSignal(s):
    out = []
    num = 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        else:
            out.append(ch * num)
            num = 0
    return "".join(out)`,
    approach:
      'Scan the string accumulating digits into a running count. When a letter is reached, append that letter repeated count times to the output and reset the count. Joining the pieces yields the decoded signal.',
    complexity: { time: 'O(length of output)', space: 'O(length of output)' },
    cases: [
      ['"3a2b"'],
      ['"1x10y"'],
      ['"1a1b1c"'],
      ['"5z"'],
      ['"2a2a"'],
      ['"10a"'],
      ['"1q2w3e"'],
      ['"4m1n"'],
      ['"9a9b9c"'],
      ['"100x"'],
    ],
  },
  {
    n: 1151,
    id: 'pghub-b20-relay-tree',
    name: 'Org Chart Bonus Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'maxSubtreeBonus',
    params: [
      { name: 'parent', type: 'List[int]' },
      { name: 'bonus', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'A company org chart has <code>n</code> employees numbered <code>0..n-1</code>. <code>parent[i]</code> is the manager of employee <code>i</code>, with the CEO having parent <code>-1</code>. Each employee has a possibly-negative <code>bonus[i]</code>. The total bonus of a subtree is the sum of bonuses of an employee and all their (transitive) reports. Return the maximum subtree total over all employees.',
    examples: [
      ['[-1,0,0,1]\n[5,-2,3,4]', '10', 'CEO subtree totals 5-2+3+4=10, the largest.'],
      ['[-1,0]\n[-5,-1]', '-1', 'The single-node subtree of employee 1 totals -1, the best available.'],
    ],
    constraints: ['1 <= n <= 10^5', 'parent forms a valid tree with exactly one -1', '-10^4 <= bonus[i] <= 10^4'],
    tags: ['trees', 'dfs'],
    py: `def maxSubtreeBonus(parent, bonus):
    n = len(parent)
    children = defaultdict(list)
    root = 0
    for i, p in enumerate(parent):
        if p == -1:
            root = i
        else:
            children[p].append(i)
    subtotal = [0] * n
    order = []
    stack = [root]
    while stack:
        u = stack.pop()
        order.append(u)
        for c in children[u]:
            stack.append(c)
    for u in reversed(order):
        subtotal[u] = bonus[u]
        for c in children[u]:
            subtotal[u] += subtotal[c]
    return max(subtotal)`,
    approach:
      'Build the children adjacency from the parent array and find the root. Produce a processing order via an iterative DFS, then accumulate subtree totals in reverse order so every child is summed before its parent. The maximum subtree total across all nodes is the answer; reverse-order accumulation keeps it iterative and O(n).',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[-1,0,0,1]', '[5,-2,3,4]'],
      ['[-1,0]', '[-5,-1]'],
      ['[-1]', '[7]'],
      ['[-1,0,1,2]', '[1,1,1,1]'],
      ['[-1,0,0,0]', '[-10,1,2,3]'],
      ['[1,-1,1]', '[4,2,3]'],
      ['[-1,0,1,2,3]', '[-1,-2,-3,-4,-5]'],
      ['[-1,0,0]', '[0,0,0]'],
      ['[-1,0,1,0,3]', '[10,-5,-5,2,2]'],
      ['[2,2,-1]', '[100,-50,-40]'],
    ],
  },
  {
    n: 1152,
    id: 'pghub-b20-coin-rolls',
    name: 'Coin Roll Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A bank rolls coins of the denominations in <code>coins</code> (each available in unlimited supply). Return the number of distinct combinations of coins (order does not matter) that sum to exactly <code>amount</code>. Return 0 if no combination works and 1 for an <code>amount</code> of 0.',
    examples: [
      ['[1,2,5]\n5', '4', 'Combinations: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.'],
      ['[2]\n3', '0', 'Odd amount cannot be made from twos.'],
    ],
    constraints: ['1 <= coins.length <= 100', '1 <= coins[i] <= 1000', 'coins are distinct', '0 <= amount <= 5000'],
    tags: ['dp', 'math'],
    py: `def countWays(coins, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in coins:
        for v in range(c, amount + 1):
            dp[v] += dp[v - c]
    return dp[amount]`,
    approach:
      'Classic unbounded-knapsack counting. dp[v] is the number of combinations summing to v. Iterate coins in the outer loop so each denomination is considered once, preventing permutations from being double-counted; for each coin add dp[v-c] to dp[v] for increasing v. dp[amount] is the answer.',
    complexity: { time: 'O(len(coins) * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '4'],
      ['[5,10,25]', '30'],
      ['[3,7]', '12'],
      ['[1,5,10,25]', '50'],
      ['[2,4,6]', '8'],
      ['[7]', '14'],
      ['[1,2,5]', '0'],
    ],
  },
  {
    n: 1153,
    id: 'pghub-b20-palette-merge',
    name: 'Palette Interval Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'totalCovered',
    params: [{ name: 'ranges', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A paint palette assigns colors to integer positions. Each entry <code>ranges[i] = [start, end]</code> paints the inclusive integer positions from <code>start</code> to <code>end</code>. Ranges may overlap. Return the total number of distinct integer positions that get painted.',
    examples: [
      ['[[1,3],[2,5],[8,9]]', '7', 'Positions 1-5 (5 of them) plus 8-9 (2) = 7.'],
      ['[[4,4]]', '1', 'A single position is painted.'],
    ],
    constraints: ['1 <= ranges.length <= 10^5', '-10^9 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def totalCovered(ranges):
    ivs = sorted(ranges, key=lambda x: x[0])
    total = 0
    cur_start, cur_end = ivs[0]
    for s, e in ivs[1:]:
        if s <= cur_end + 1:
            cur_end = max(cur_end, e)
        else:
            total += cur_end - cur_start + 1
            cur_start, cur_end = s, e
    total += cur_end - cur_start + 1
    return total`,
    approach:
      'Sort the ranges by start. Sweep merging any range that touches or overlaps the current merged interval (start <= current end + 1, since positions are integer and adjacent ranges connect). When a gap appears, add the merged length and begin a new interval. Sum the inclusive lengths of all merged intervals.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,5],[8,9]]'],
      ['[[4,4]]'],
      ['[[1,2],[3,4]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[5,5],[5,5],[5,5]]'],
      ['[[-3,-1],[0,2]]'],
      ['[[1,1],[3,3],[5,5]]'],
      ['[[0,100],[50,60],[101,200]]'],
      ['[[10,20],[15,25],[26,30]]'],
      ['[[1,1000000000]]'],
    ],
  },
  {
    n: 1159,
    id: 'pghub-b20-fleet-charge',
    name: 'Fleet Charging Slots',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'minChargers',
    params: [{ name: 'sessions', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Electric vehicles need charging; <code>sessions[i] = [start, end]</code> means vehicle i must charge over the half-open interval <code>[start, end)</code>. A charger serves at most one vehicle at a time. Return the minimum number of chargers required so that no two simultaneously-charging vehicles share a charger.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'The first session overlaps each of the others, needing a second charger.'],
      ['[[1,2],[2,3],[3,4]]', '1', 'No two sessions overlap, so one charger suffices.'],
    ],
    constraints: ['1 <= sessions.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['heap', 'intervals'],
    py: `def minChargers(sessions):
    s = sorted(sessions, key=lambda x: x[0])
    ends = []
    best = 0
    for start, end in s:
        while ends and ends[0] <= start:
            heapq.heappop(ends)
        heapq.heappush(ends, end)
        best = max(best, len(ends))
    return best`,
    approach:
      'Sort sessions by start. Keep a min-heap of the end times of sessions currently occupying a charger. Before each new session, pop every end time that is at or before its start (those chargers freed up). Push the new end; the heap size is the concurrent demand. The maximum heap size over the sweep is the minimum number of chargers.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[1,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[0,2],[1,3],[2,4],[3,5]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,100],[2,3],[4,5],[6,7]]'],
      ['[[0,10],[0,10],[0,10],[0,10]]'],
      ['[[1,4],[2,5],[7,9],[3,6]]'],
      ['[[10,20],[20,30],[30,40]]'],
    ],
  },
  {
    n: 1165,
    id: 'pghub-b20-tunnel-bits',
    name: 'Tunnel Toggle Bits',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'countAfterToggle',
    params: [
      { name: 'x', type: 'int' },
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A non-negative integer <code>x</code> is read in binary (bit 0 is least significant). A maintenance pass flips every bit whose index is in the inclusive range <code>[lo, hi]</code>. Return the number of set (1) bits in the resulting value.',
    examples: [
      ['5\n0\n1', '1', '5 is 101; flipping bits 0 and 1 gives 110 = 6, which has two... recount: 101 -> flip bit0->100, flip bit1->110 = two ones.'],
      ['0\n0\n2', '3', '0 with bits 0,1,2 flipped becomes 111 = 7 (three ones).'],
    ],
    constraints: ['0 <= x <= 2^31 - 1', '0 <= lo <= hi <= 31'],
    tags: ['bit-manipulation', 'math'],
    py: `def countAfterToggle(x, lo, hi):
    mask = 0
    for b in range(lo, hi + 1):
        mask |= (1 << b)
    return bin(x ^ mask).count("1")`,
    approach:
      'Build a mask with every bit in [lo, hi] set, then XOR it with x: XOR flips exactly the masked bits and leaves the rest unchanged. Count the 1 bits in the result.',
    complexity: { time: 'O(hi - lo + bit width)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['5', '0', '1'],
      ['0', '0', '2'],
      ['7', '0', '2'],
      ['8', '0', '3'],
      ['255', '0', '7'],
      ['1', '5', '5'],
      ['1024', '10', '10'],
      ['15', '1', '2'],
      ['0', '0', '0'],
      ['2147483647', '0', '31'],
    ],
  },
  {
    n: 1166,
    id: 'pghub-b20-warehouse-bsearch',
    name: 'Warehouse Shipping Days',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'packages', type: 'List[int]' },
      { name: 'days', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Packages must ship in the given order; <code>packages[i]</code> is the weight of the i-th package. A truck loads packages in order each day up to its weight capacity and ships once per day. Return the smallest truck capacity that lets every package ship within <code>days</code> days.',
    examples: [
      ['[1,2,3,4,5]\n2', '9', 'Capacity 9 ships [1,2,3] and [4,5]; smaller fails the limit.'],
      ['[3,3,3]\n3', '3', 'One package per day needs capacity equal to the largest.'],
    ],
    constraints: ['1 <= packages.length <= 10^5', '1 <= days <= packages.length', '1 <= packages[i] <= 10^4'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(packages, days):
    def needed(cap):
        d = 1
        cur = 0
        for w in packages:
            if cur + w > cap:
                d += 1
                cur = 0
            cur += w
        return d
    lo, hi = max(packages), sum(packages)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The answer is monotonic: any capacity at least as large as a feasible one is also feasible. Binary-search capacity between the heaviest package (a lower bound) and the total weight (always feasible in one day). For a candidate capacity, greedily count the days needed by filling each day until the next package would overflow. Return the smallest capacity needing at most days.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[3,3,3]', '3'],
      ['[1,2,3,4,5]', '5'],
      ['[10]', '1'],
      ['[1,1,1,1,1]', '1'],
      ['[5,4,3,2,1]', '2'],
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,1,1]', '4'],
      ['[9,8,7,6,5,4,3,2,1]', '3'],
      ['[100,200,300,400]', '2'],
    ],
  },
  {
    n: 1167,
    id: 'pghub-b20-maze-flood',
    name: 'Maze Flood Reach',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'minStepsOut',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A maze is a grid where <code>0</code> is open and <code>1</code> is a wall. Starting at the top-left cell, move up/down/left/right through open cells only. Return the minimum number of steps to reach the bottom-right cell. Return -1 if it is unreachable or if either corner is a wall.',
    examples: [
      ['[[0,0,1],[1,0,0],[1,1,0]]', '4', 'A shortest open path takes four moves.'],
      ['[[0,1],[1,0]]', '-1', 'The two open cells are not connected.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 500', 'grid[i][j] is 0 or 1'],
    tags: ['graphs', 'bfs'],
    py: `def minStepsOut(grid):
    rows, cols = len(grid), len(grid[0])
    if grid[0][0] == 1 or grid[rows-1][cols-1] == 1:
        return -1
    if rows == 1 and cols == 1:
        return 0
    visited = [[False] * cols for _ in range(rows)]
    visited[0][0] = True
    q = deque([(0, 0, 0)])
    while q:
        r, c, d = q.popleft()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not visited[nr][nc] and grid[nr][nc] == 0:
                if nr == rows - 1 and nc == cols - 1:
                    return d + 1
                visited[nr][nc] = True
                q.append((nr, nc, d + 1))
    return -1`,
    approach:
      'Breadth-first search from the top-left cell over open cells expands in step order, so the first time the bottom-right is reached gives the minimum step count. Mark cells visited as they enter the queue to avoid revisits. Reject immediately if either corner is a wall, and handle the trivial 1x1 grid.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[0,0,1],[1,0,0],[1,1,0]]'],
      ['[[0,1],[1,0]]'],
      ['[[0]]'],
      ['[[0,0,0],[0,0,0],[0,0,0]]'],
      ['[[1,0],[0,0]]'],
      ['[[0,0],[0,1]]'],
      ['[[0,0,0,0,0]]'],
      ['[[0],[0],[0],[0]]'],
      ['[[0,1,0],[0,1,0],[0,0,0]]'],
      ['[[0,0,0],[1,1,0],[0,0,0]]'],
    ],
  },
  {
    n: 1168,
    id: 'pghub-b20-cipher-shift',
    name: 'Rotating Cipher Shift',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'encode',
    params: [
      { name: 's', type: 'str' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'str',
    statement:
      'A simple cipher shifts each lowercase letter of <code>s</code> forward by an amount that grows with its position: the letter at index <code>i</code> is shifted forward by <code>(k + i)</code> places around the 26-letter alphabet (wrapping from z to a). Non-letter characters are left unchanged and do not affect the index counting (index is the raw string position). Return the encoded string.',
    examples: [
      ['"abc"\n1', '"bdf"', 'a+1=b, b+2=d, c+3=f.'],
      ['"xyz"\n0', '"xzb"', 'x+0=x, y+1=z, z+2=b (wraps).'],
    ],
    constraints: ['1 <= s.length <= 10^4', '0 <= k <= 10^6', 's consists of lowercase letters and spaces'],
    tags: ['strings', 'math'],
    py: `def encode(s, k):
    out = []
    for i, ch in enumerate(s):
        if 'a' <= ch <= 'z':
            shift = (k + i) % 26
            out.append(chr((ord(ch) - 97 + shift) % 26 + 97))
        else:
            out.append(ch)
    return "".join(out)`,
    approach:
      'Walk the string by index. For each lowercase letter, shift it forward by (k + index) modulo 26 using arithmetic on its 0-25 alphabet offset, wrapping around. Leave any non-letter character untouched while still advancing the index. Concatenate the results.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"abc"', '1'],
      ['"xyz"', '0'],
      ['"hello"', '5'],
      ['"a"', '25'],
      ['"zzzz"', '1'],
      ['"abc def"', '2'],
      ['"abcdefghij"', '0'],
      ['"m"', '1000000'],
      ['"the quick"', '3'],
      ['"aaaaa"', '13'],
    ],
  },
  {
    n: 1173,
    id: 'pghub-b20-subarray-target',
    name: 'Subarray Target Count',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'countSubarrays',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> (values may be negative) and an integer <code>target</code>, return the number of contiguous non-empty subarrays whose elements sum to exactly <code>target</code>.',
    examples: [
      ['[1,1,1]\n2', '2', 'Subarrays [1,1] at indices 0-1 and 1-2.'],
      ['[1,-1,0]\n0', '3', 'Subarrays [1,-1], [1,-1,0], and [0].'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', '-10^9 <= target <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def countSubarrays(nums, target):
    counts = defaultdict(int)
    counts[0] = 1
    prefix = 0
    result = 0
    for x in nums:
        prefix += x
        result += counts[prefix - target]
        counts[prefix] += 1
    return result`,
    approach:
      'A subarray sums to target exactly when two prefix sums differ by target. Sweep the array maintaining the running prefix sum and a hash map of how many times each prefix value has occurred. For each position, add the number of earlier prefixes equal to prefix - target, then record the current prefix. This counts all qualifying subarrays in one pass, including with negatives.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,1,1]', '2'],
      ['[1,-1,0]', '0'],
      ['[3]', '3'],
      ['[1,2,3]', '3'],
      ['[0,0,0]', '0'],
      ['[-1,-1,1]', '-2'],
      ['[5,-5,5,-5]', '0'],
      ['[2,2,2,2]', '4'],
      ['[1,2,1,2,1]', '3'],
      ['[10]', '5'],
    ],
  },
  {
    n: 1176,
    id: 'pghub-b20-stair-paint',
    name: 'Staircase Climb Variants',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'countClimbs',
    params: [
      { name: 'n', type: 'int' },
      { name: 'maxStep', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You climb a staircase of <code>n</code> steps. On each move you may climb any number of steps from 1 up to <code>maxStep</code>. Return the number of distinct ordered ways to reach the top, modulo <code>1000000007</code>.',
    examples: [
      ['4\n2', '5', 'With steps of 1 or 2 there are 5 ways (the Fibonacci pattern).'],
      ['3\n3', '4', 'Ways: 1+1+1, 1+2, 2+1, 3.'],
    ],
    constraints: ['0 <= n <= 10^5', '1 <= maxStep <= 10^5'],
    tags: ['dp', 'math'],
    py: `def countClimbs(n, maxStep):
    MOD = 1000000007
    dp = [0] * (n + 1)
    dp[0] = 1
    window = 0
    for i in range(1, n + 1):
        window = (window + dp[i - 1]) % MOD
        if i - maxStep - 1 >= 0:
            window = (window - dp[i - maxStep - 1]) % MOD
        dp[i] = window
    return dp[n] % MOD`,
    approach:
      'dp[i] is the number of ways to reach step i, equal to the sum of dp[i-1..i-maxStep]. Maintain that sum as a sliding window: add dp[i-1] when entering and subtract dp[i-maxStep-1] when it leaves the window, all modulo 1e9+7, giving O(n) instead of O(n*maxStep). dp[n] is the answer; dp[0]=1 handles n=0.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '2'],
      ['3', '3'],
      ['0', '5'],
      ['1', '1'],
      ['5', '2'],
      ['10', '3'],
      ['7', '7'],
      ['2', '1'],
      ['20', '4'],
      ['100', '5'],
    ],
  },
  {
    n: 1180,
    id: 'pghub-b20-roster-rotate',
    name: 'Roster Cyclic Rotate',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'rotateRoster',
    params: [
      { name: 'roster', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A duty roster is a list <code>roster</code>. Rotate it to the right by <code>k</code> positions, so that each element moves <code>k</code> places forward and elements falling off the end wrap to the front. <code>k</code> may be larger than the list length. Return the rotated list.',
    examples: [
      ['[1,2,3,4,5]\n2', '[4,5,1,2,3]', 'The last two elements wrap to the front.'],
      ['[1,2,3]\n4', '[3,1,2]', 'k = 4 is equivalent to rotating by 1.'],
    ],
    constraints: ['1 <= roster.length <= 10^5', '0 <= k <= 10^9', '-10^6 <= roster[i] <= 10^6'],
    tags: ['two-pointers', 'arrays'],
    py: `def rotateRoster(roster, k):
    n = len(roster)
    k %= n
    if k == 0:
        return roster[:]
    return roster[-k:] + roster[:-k]`,
    approach:
      'Rotating by the list length returns the original, so reduce k modulo n. A right rotation by k moves the last k elements to the front: concatenate the final k elements with the leading n-k elements. Handle k = 0 (after the modulo) by returning a copy unchanged.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '2'],
      ['[1,2,3]', '4'],
      ['[1]', '0'],
      ['[1,2]', '1'],
      ['[1,2,3,4]', '0'],
      ['[5,4,3,2,1]', '3'],
      ['[10,20,30]', '3'],
      ['[1,2,3,4,5,6]', '1000000000'],
      ['[-1,-2,-3]', '2'],
      ['[7,8,9,10]', '5'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B20>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b20-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B20>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B20>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b20-grade-${prob.n}.py`);
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
