#!/usr/bin/env node
// Batch 32 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2098,2107,2112,2113,2118,2123,2128,2137,2142,2143,2152,2153,2158,2159,2168
//
//   node scripts/fill-gap-problems-batch32.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch32.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch32.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [2098, 2107, 2112, 2113, 2118, 2123, 2128, 2137, 2142, 2143, 2152, 2153, 2158, 2159, 2168];

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
    n: 2098,
    id: 'pghub-b32-locker-toggle',
    name: 'Open Locker Count',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'openLockers',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'There are <code>n</code> lockers numbered <code>1</code> through <code>n</code>, all starting closed. Student <code>k</code> (for each <code>k</code> from 1 to n) toggles every locker whose number is a multiple of <code>k</code>. After all n students pass, return how many lockers are left open.',
    examples: [
      ['10', '3', 'Lockers 1, 4 and 9 (the perfect squares up to 10) stay open.'],
      ['1', '1', 'The single locker is toggled once and ends open.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math', 'number-theory'],
    py: `def openLockers(n):
    if n <= 0:
        return 0
    return int(math.isqrt(n))`,
    approach:
      'A locker is toggled once per divisor of its number, so it ends open only when its number has an odd count of divisors. That happens exactly for perfect squares. The number of perfect squares in [1, n] is floor(sqrt(n)).',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['10'],
      ['1'],
      ['0'],
      ['100'],
      ['2'],
      ['3'],
      ['25'],
      ['99'],
      ['1000000000'],
      ['49'],
    ],
  },
  {
    n: 2107,
    id: 'pghub-b32-shelf-stack',
    name: 'Collapsing Plate Stack',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'finalStack',
    params: [{ name: 'plates', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'You stack plates one by one in the order given by <code>plates</code>; each value is a plate weight. After placing a plate, if it is strictly heavier than the plate directly beneath it, the lighter plate underneath is crushed and removed, and the check repeats against the new plate below. Return the weights remaining in the stack from bottom to top.',
    examples: [
      ['[3,1,4]', '[4]', 'Place 3, then 1 (1<3 so it rests on top), then 4 crushes the 1 then the 3, leaving [4].'],
      ['[5,4,3]', '[5,4,3]', 'Each plate is lighter than the one below it, so nothing is crushed.'],
    ],
    constraints: ['1 <= plates.length <= 10^5', '1 <= plates[i] <= 10^9'],
    tags: ['stack', 'simulation'],
    py: `def finalStack(plates):
    stack = []
    for p in plates:
        while stack and p > stack[-1]:
            stack.pop()
        stack.append(p)
    return stack`,
    approach:
      'Use a stack. For each incoming plate, pop every plate on top that is strictly lighter (it gets crushed), then push the current plate. The remaining stack from index 0 upward is the bottom-to-top answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,1,4]'],
      ['[5,4,3]'],
      ['[1]'],
      ['[2,2,2]'],
      ['[1,2,3,4]'],
      ['[4,1,1,5,2]'],
      ['[9,8,7,10]'],
      ['[1,3,2,4,1]'],
      ['[6,6,6,6]'],
      ['[10,1,2,3,4,5]'],
    ],
  },
  {
    n: 2112,
    id: 'pghub-b32-relay-baton',
    name: 'Relay Baton Pass',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'firstDrop',
    params: [
      { name: 'speeds', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Runners stand in a line and pass a baton from index 0 onward. The baton can be passed from runner <code>i</code> to runner <code>i+1</code> only if their speed difference <code>abs(speeds[i] - speeds[i+1])</code> is at most <code>limit</code>. Return the index of the last runner who successfully receives the baton (the baton starts at index 0).',
    examples: [
      ['[5,7,6,12]\n2', '2', 'Passes 5->7 (diff 2) and 7->6 (diff 1) succeed, but 6->12 (diff 6) fails, stopping at index 2.'],
      ['[3,3,3]\n0', '2', 'Every adjacent pair is equal, so the baton reaches the last runner.'],
    ],
    constraints: ['1 <= speeds.length <= 10^5', '0 <= limit <= 10^9', '1 <= speeds[i] <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def firstDrop(speeds, limit):
    last = 0
    for i in range(len(speeds) - 1):
        if abs(speeds[i] - speeds[i + 1]) <= limit:
            last = i + 1
        else:
            break
    return last`,
    approach:
      'Walk the line from the start. Each time the adjacent speed difference is within the limit, advance the holder index; the first time it exceeds the limit, stop. The recorded index is the last runner to hold the baton.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[5,7,6,12]', '2'],
      ['[3,3,3]', '0'],
      ['[1]', '5'],
      ['[10,1]', '3'],
      ['[1,2,3,4,5]', '1'],
      ['[4,4,4,4,9]', '0'],
      ['[100,98,99,200]', '3'],
      ['[1,1,1,1]', '0'],
      ['[7,3,8,1]', '10'],
      ['[2,4,6,8,10]', '1'],
    ],
  },
  {
    n: 2113,
    id: 'pghub-b32-spiral-sum',
    name: 'Spiral Layer Totals',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'spiralOrder',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'Given an <code>m x n</code> integer <code>matrix</code>, return all its elements collected in clockwise spiral order, starting from the top-left corner and moving right, down, left, and up, peeling inward layer by layer.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '[1,2,3,6,9,8,7,4,5]', 'Outer ring clockwise, then the center.'],
      ['[[1,2],[3,4]]', '[1,2,4,3]', 'Right, down, left around the 2x2.'],
    ],
    constraints: ['1 <= matrix.length, matrix[0].length <= 100', '-10^4 <= matrix[i][j] <= 10^4'],
    tags: ['arrays', 'matrix'],
    py: `def spiralOrder(matrix):
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1
    return res`,
    approach:
      'Maintain four boundaries (top, bottom, left, right). Traverse the top row rightward, the right column downward, the bottom row leftward, and the left column upward, shrinking the matching boundary after each pass. Guard the bottom and left passes so single rows or columns are not double counted.',
    complexity: { time: 'O(m*n)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,2],[3,4]]'],
      ['[[1]]'],
      ['[[1,2,3,4]]'],
      ['[[1],[2],[3]]'],
      ['[[1,2,3],[4,5,6]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[7,8,9,10],[6,1,2,11],[5,4,3,12]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,2,3,4,5]]'],
    ],
  },
  {
    n: 2118,
    id: 'pghub-b32-watered-plants',
    name: 'Garden Watering Splits',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'wateringSteps',
    params: [
      { name: 'plants', type: 'List[int]' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A row of plants needs watering; <code>plants[i]</code> is the water plant <code>i</code> needs. You walk from a tap on the far left to the far right, watering plants in order. You carry a can of size <code>capacity</code>. To water a plant you must already have enough water for it; if not, you walk all the way back to the tap, refill fully, and return. Return the total number of steps walked, where moving between adjacent positions (or the tap at position -1 and plant 0) is one step.',
    examples: [
      ['[2,2,3,3]\n5', '14', 'Water plants 0 and 1 (4 used), refill before plant 2, then water 2 and 3.'],
      ['[1,1,1]\n3', '3', 'One full can covers all three plants in a single pass of 3 steps.'],
    ],
    constraints: ['1 <= plants.length <= 10^5', '1 <= plants[i] <= capacity <= 10^9'],
    tags: ['two-pointers', 'simulation'],
    py: `def wateringSteps(plants, capacity):
    steps = 0
    water = capacity
    for i, need in enumerate(plants):
        if water >= need:
            water -= need
            steps += 1
        else:
            steps += i  # walk back to tap
            steps += i + 1  # walk from tap to plant i
            water = capacity - need
    return steps`,
    approach:
      'Track remaining water while sweeping left to right. If the current plant fits, water it with one forward step. Otherwise walk back to the tap (i steps) and return to plant i (i+1 steps), refill, then water. Sum all walking steps.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,2,3,3]', '5'],
      ['[1,1,1]', '3'],
      ['[1]', '1'],
      ['[5,5,5]', '5'],
      ['[2,4,5,1,2]', '6'],
      ['[3,3,3,3]', '3'],
      ['[1,2,3,4,5]', '15'],
      ['[4,4]', '4'],
      ['[1,1,1,4,2,3]', '4'],
      ['[7,7,7,7]', '7'],
    ],
  },
  {
    n: 2123,
    id: 'pghub-b32-coin-rows',
    name: 'Two Rows of Coins',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxCoins',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A board has exactly two rows and <code>n</code> columns; <code>grid[r][c]</code> is the coins in that cell. You start on cell <code>(0,0)</code> and must reach <code>(1,n-1)</code>. From a cell you may move right within the same row, or down from row 0 to row 1 (you may switch rows at most once, since there is no way back up). Return the maximum total coins you can collect, counting both the start and end cells.',
    examples: [
      ['[[1,2,5],[3,1,1]]', '10', 'Take 1,2,5 across the top then drop down to 1: 1+2+5+1+1... best path collects 10.'],
      ['[[9],[2]]', '11', 'With one column you collect both cells: 9+2.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= grid[r][c] <= 10^4'],
    tags: ['dp', 'prefix-sum'],
    py: `def maxCoins(grid):
    n = len(grid[0])
    top = grid[0]
    bottom = grid[1]
    # prefix sums
    pre_top = [0] * (n + 1)
    suf_bottom = [0] * (n + 1)
    for i in range(n):
        pre_top[i + 1] = pre_top[i] + top[i]
    for i in range(n - 1, -1, -1):
        suf_bottom[i] = suf_bottom[i + 1] + bottom[i]
    best = -1
    for j in range(n):
        total = pre_top[j + 1] + suf_bottom[j]
        if total > best:
            best = total
    return best`,
    approach:
      'The path goes right along the top until some column j, drops to the bottom row, then goes right to the end. So the score is the sum of top[0..j] plus bottom[j..n-1]. Precompute a top prefix sum and a bottom suffix sum, then take the maximum over every drop column j.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[[1,2,5],[3,1,1]]'],
      ['[[9],[2]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,1,1,1],[1,1,1,1]]'],
      ['[[5,0,0],[0,0,5]]'],
      ['[[2,3],[4,1]]'],
      ['[[10,1,1,1],[1,1,1,10]]'],
      ['[[3,3,3],[3,3,3]]'],
      ['[[7,2,1,8],[1,9,1,1]]'],
      ['[[100],[100]]'],
    ],
  },
  {
    n: 2128,
    id: 'pghub-b32-radio-towers',
    name: 'Radio Tower Coverage',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTowers',
    params: [
      { name: 'houses', type: 'List[int]' },
      { name: 'radius', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Houses sit at the integer coordinates given in <code>houses</code> along a road. A radio tower may be placed at any integer coordinate and covers every house within distance <code>radius</code> (inclusive). Return the minimum number of towers needed so that every house is covered.',
    examples: [
      ['[1,2,3,10]\n1', '2', 'One tower at 2 covers 1,2,3; another at 10 covers the last house.'],
      ['[5]\n0', '1', 'A single tower placed exactly at the house covers it.'],
    ],
    constraints: ['1 <= houses.length <= 10^5', '0 <= radius <= 10^9', '0 <= houses[i] <= 10^9'],
    tags: ['greedy', 'sorting'],
    py: `def minTowers(houses, radius):
    pts = sorted(houses)
    towers = 0
    i = 0
    n = len(pts)
    while i < n:
        towers += 1
        # place tower to cover pts[i] as far right as possible
        tower_pos = pts[i] + radius
        # skip houses covered by this tower
        while i < n and pts[i] <= tower_pos + radius:
            i += 1
    return towers`,
    approach:
      'Sort the houses. Greedily anchor each new tower at the leftmost uncovered house plus radius, so its coverage stretches as far right as possible (up to tower_pos + radius). Skip all houses within that reach, then repeat. This interval-covering greedy is optimal.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,10]', '1'],
      ['[5]', '0'],
      ['[1,1,1]', '0'],
      ['[0,5,10,15]', '2'],
      ['[1,2,3,4,5]', '1'],
      ['[10,1,20,2,30]', '3'],
      ['[100,200,300]', '0'],
      ['[1,3,5,7,9]', '2'],
      ['[0,1,2,3,4,5,6]', '10'],
      ['[8,2,6,4]', '1'],
    ],
  },
  {
    n: 2137,
    id: 'pghub-b32-anagram-groups',
    name: 'Anagram Family Sizes',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'largestFamily',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Two words belong to the same family if one is an anagram of the other (same letters with the same counts). Given a list of lowercase <code>words</code>, return the size of the largest anagram family.',
    examples: [
      ['["eat","tea","tan","ate","nat","bat"]', '3', 'The family {eat, tea, ate} has 3 members, the largest.'],
      ['["abc"]', '1', 'A single word forms a family of size 1.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words[i] is lowercase letters'],
    tags: ['strings', 'hashmap'],
    py: `def largestFamily(words):
    groups = defaultdict(int)
    for w in words:
        key = ''.join(sorted(w))
        groups[key] += 1
    return max(groups.values())`,
    approach:
      'Sort the letters of each word to build a canonical key shared by all anagrams. Count how many words map to each key, then return the largest count.',
    complexity: { time: 'O(n * L log L)', space: 'O(n)' },
    cases: [
      ['["eat","tea","tan","ate","nat","bat"]'],
      ['["abc"]'],
      ['["a","a","a","a"]'],
      ['["ab","ba","abc","cba","bca"]'],
      ['["x","y","z"]'],
      ['["listen","silent","enlist","google"]'],
      ['["aab","aba","baa","abb"]'],
      ['["one","two","three"]'],
      ['["loop","polo","pool","olop"]'],
      ['["cat","act","dog","god","tac","odg"]'],
    ],
  },
  {
    n: 2142,
    id: 'pghub-b32-circular-fuel',
    name: 'Circular Fuel Loop',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'startStation',
    params: [
      { name: 'fuel', type: 'List[int]' },
      { name: 'cost', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'On a circular track there are stations <code>0..n-1</code>. At station <code>i</code> you gain <code>fuel[i]</code> units, and driving from station <code>i</code> to the next costs <code>cost[i]</code> units. Starting with an empty tank, return the index of the first station (smallest index) from which you can complete a full loop, or <code>-1</code> if none exists.',
    examples: [
      ['[1,2,3,4,5]\n[3,4,5,1,2]', '3', 'Starting at station 3 you can complete the circuit; lower indices run out of fuel.'],
      ['[2,3,4]\n[3,4,3]', '-1', 'Total fuel is less than total cost, so no loop is possible.'],
    ],
    constraints: ['1 <= fuel.length <= 10^5', 'fuel.length == cost.length', '0 <= fuel[i], cost[i] <= 10^4'],
    tags: ['greedy', 'arrays'],
    py: `def startStation(fuel, cost):
    total = 0
    tank = 0
    start = 0
    for i in range(len(fuel)):
        diff = fuel[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1`,
    approach:
      'If total fuel is at least total cost, a unique answer exists. Sweep once tracking a running tank; whenever it dips below zero, no station up to here can be the start, so reset the candidate start to the next index and zero the tank. The surviving candidate is the smallest valid start.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '[3,4,5,1,2]'],
      ['[2,3,4]', '[3,4,3]'],
      ['[5]', '[5]'],
      ['[3]', '[4]'],
      ['[1,1,1,1]', '[1,1,1,1]'],
      ['[4,0,0]', '[1,1,1]'],
      ['[2,2,2,2]', '[1,1,1,5]'],
      ['[6,1,1]', '[1,1,1]'],
      ['[0,0,0]', '[0,0,0]'],
      ['[3,1,2,4]', '[2,2,2,2]'],
    ],
  },
  {
    n: 2143,
    id: 'pghub-b32-bst-range',
    name: 'BST Range Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'rangeSum',
    params: [
      { name: 'values', type: 'List[int]' },
      { name: 'low', type: 'int' },
      { name: 'high', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A binary search tree is given in level order by <code>values</code>, where <code>-1</code> marks an absent node (all real node values are non-negative and distinct). Return the sum of the values of every node whose value lies in the inclusive range <code>[low, high]</code>.',
    examples: [
      ['[10,5,15,3,7,-1,18]\n7\n15', '32', 'Nodes 7, 10 and 15 fall in [7,15]: 7+10+15=32.'],
      ['[1]\n2\n5', '0', 'The only node value 1 is outside [2,5].'],
    ],
    constraints: ['1 <= values.length <= 10^4', '0 <= low <= high <= 10^5', '-1 marks an absent node'],
    tags: ['trees', 'binary-search-tree'],
    py: `def rangeSum(values, low, high):
    n = len(values)
    total = 0
    def visit(i):
        nonlocal total
        if i >= n or values[i] == -1:
            return
        v = values[i]
        if low <= v <= high:
            total += v
        if v > low:
            visit(2 * i + 1)
        if v < high:
            visit(2 * i + 2)
    visit(0)
    return total`,
    approach:
      'Treat the level-order array as a heap-indexed BST (children of i are 2i+1 and 2i+2). Recurse from the root, adding any in-range value. Prune using BST order: only descend left when the current value exceeds low, and only descend right when it is below high.',
    complexity: { time: 'O(n)', space: 'O(h)' },
    multiParam: true,
    cases: [
      ['[10,5,15,3,7,-1,18]', '7', '15'],
      ['[1]', '2', '5'],
      ['[5,3,7]', '0', '10'],
      ['[8,4,12,2,6,10,14]', '5', '11'],
      ['[20,10,30]', '20', '20'],
      ['[50,30,70,20,40,60,80]', '0', '100'],
      ['[15,10,20,8,12,17,25]', '13', '18'],
      ['[100,50,150]', '200', '300'],
      ['[6,4,8,3,5,7,9]', '4', '8'],
      ['[42]', '42', '42'],
    ],
  },
  {
    n: 2152,
    id: 'pghub-b32-elevator-trips',
    name: 'Elevator Trip Planner',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'An elevator carries at most two people per trip and a combined weight of at most <code>limit</code>. Given the <code>weights</code> of the people waiting, return the minimum number of trips needed to take everyone up. Every individual weight is at most <code>limit</code>.',
    examples: [
      ['[1,2,2,3]\n3', '3', 'Pair (1,2) and (3) and (2): three trips, pairing the lightest with the heaviest where possible.'],
      ['[5,5,5]\n5', '3', 'No two people fit together, so each needs a separate trip.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= limit <= 10^9'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, limit):
    w = sorted(weights)
    i, j = 0, len(w) - 1
    trips = 0
    while i <= j:
        if i < j and w[i] + w[j] <= limit:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights and use two pointers from the lightest and heaviest. Each trip always takes the heaviest remaining person; if the lightest remaining also fits alongside, pair them. Advance pointers accordingly and count one trip each iteration.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,2,3]', '3'],
      ['[5,5,5]', '5'],
      ['[1]', '10'],
      ['[3,3,3,3]', '6'],
      ['[1,1,1,1]', '2'],
      ['[4,2,3,1]', '5'],
      ['[10,9,8,7]', '15'],
      ['[2,2,2,2,2]', '4'],
      ['[1,2,3,4,5,6]', '7'],
      ['[6,6,6]', '6'],
    ],
  },
  {
    n: 2153,
    id: 'pghub-b32-signal-decode',
    name: 'Beep Sequence Decode',
    topic_id: 'recursion',
    difficulty: 'Medium',
    method_name: 'countDecodings',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A message of beeps is a digit string <code>s</code>. Each letter A-Z maps to a number 1-26 (A=1 ... Z=26). Return the number of distinct ways the string can be decoded into letters. A leading zero or any standalone zero that cannot pair into a valid 10 or 20 makes that decoding impossible (contributes 0 ways).',
    examples: [
      ['12', '2', '"12" decodes as AB (1,2) or L (12): two ways.'],
      ['06', '0', 'A leading zero cannot start any letter, so there are no valid decodings.'],
    ],
    constraints: ['1 <= s.length <= 100', 's consists of digits only'],
    tags: ['recursion', 'dp'],
    py: `def countDecodings(s):
    n = len(s)
    if n == 0:
        return 0
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1 if s[0] != '0' else 0
    for i in range(2, n + 1):
        if s[i - 1] != '0':
            dp[i] += dp[i - 1]
        two = int(s[i - 2:i])
        if 10 <= two <= 26:
            dp[i] += dp[i - 2]
    return dp[n]`,
    approach:
      'Classic decode-ways DP. dp[i] is the number of decodings of the first i digits. A non-zero single digit extends dp[i-1]; a two-digit value between 10 and 26 extends dp[i-2]. Sum the valid transitions.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ["'12'"],
      ["'06'"],
      ["'226'"],
      ["'0'"],
      ["'10'"],
      ["'27'"],
      ["'1111'"],
      ["'100'"],
      ["'2626'"],
      ["'123456789'"],
    ],
  },
  {
    n: 2158,
    id: 'pghub-b32-segment-paint',
    name: 'Painted Segment Length',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'paintedLength',
    params: [{ name: 'segments', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each entry of <code>segments</code> is a pair <code>[start, end]</code> describing a painted stretch on a number line covering the points from <code>start</code> to <code>end</code>. Overlapping segments merge. Return the total length of the line that is painted (the sum of merged interval lengths).',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '7', 'The first two merge into [1,5] (length 4); [7,9] adds length 2... total covered length is 7.'],
      ['[[0,0]]', '0', 'A zero-length segment covers no length.'],
    ],
    constraints: ['1 <= segments.length <= 10^5', '-10^9 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def paintedLength(segments):
    segs = sorted(segments)
    total = 0
    cur_start, cur_end = segs[0]
    for s, e in segs[1:]:
        if s <= cur_end:
            cur_end = max(cur_end, e)
        else:
            total += cur_end - cur_start
            cur_start, cur_end = s, e
    total += cur_end - cur_start
    return total`,
    approach:
      'Sort segments by start. Sweep maintaining the current merged interval; if the next segment starts within it, extend the end, otherwise close the current interval (add its length) and open a new one. Add the final interval at the end.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[0,0]]'],
      ['[[1,10]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,5],[2,3],[4,8]]'],
      ['[[0,10],[0,10],[0,10]]'],
      ['[[-5,-1],[0,3]]'],
      ['[[1,3],[3,5],[5,7]]'],
      ['[[10,20],[5,8],[15,25]]'],
      ['[[0,1000000000]]'],
    ],
  },
  {
    n: 2159,
    id: 'pghub-b32-bridge-network',
    name: 'Network Cut Edges',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'countBridges',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'A computer network has <code>n</code> nodes numbered <code>0..n-1</code> connected by undirected <code>edges</code> (no duplicate edges, no self-loops). A bridge is an edge whose removal increases the number of connected components. Return the number of bridges in the network.',
    examples: [
      ['4\n[[0,1],[1,2],[2,3]]', '3', 'A path graph has every edge as a bridge.'],
      ['3\n[[0,1],[1,2],[2,0]]', '0', 'A triangle is 2-edge-connected, so it has no bridges.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 2*10^5', 'edges form a simple undirected graph'],
    tags: ['advanced-graphs', 'dfs'],
    py: `def countBridges(n, edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    disc = [-1] * n
    low = [0] * n
    timer = [0]
    bridges = [0]
    for start in range(n):
        if disc[start] != -1:
            continue
        # iterative DFS to avoid recursion limits
        stack = [(start, -1, iter(graph[start]))]
        disc[start] = low[start] = timer[0]
        timer[0] += 1
        while stack:
            node, parent, it = stack[-1]
            advanced = False
            for nxt in it:
                if nxt == parent:
                    continue
                if disc[nxt] == -1:
                    disc[nxt] = low[nxt] = timer[0]
                    timer[0] += 1
                    stack.append((nxt, node, iter(graph[nxt])))
                    advanced = True
                    break
                else:
                    low[node] = min(low[node], disc[nxt])
            if not advanced:
                stack.pop()
                if stack:
                    par = stack[-1][0]
                    low[par] = min(low[par], low[node])
                    if low[node] > disc[par]:
                        bridges[0] += 1
    return bridges[0]`,
    approach:
      "Run Tarjan's bridge-finding DFS. Track each node's discovery time and the lowest discovery time reachable from its subtree. An edge (parent, child) is a bridge when the child's low value exceeds the parent's discovery time. An explicit stack keeps it iterative for large graphs.",
    complexity: { time: 'O(n + E)', space: 'O(n + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[2,3]]'],
      ['3', '[[0,1],[1,2],[2,0]]'],
      ['1', '[]'],
      ['5', '[[0,1],[1,2],[2,0],[2,3],[3,4]]'],
      ['2', '[[0,1]]'],
      ['6', '[[0,1],[1,2],[2,3],[3,4],[4,5]]'],
      ['4', '[[0,1],[1,2],[2,3],[3,0]]'],
      ['5', '[]'],
      ['7', '[[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[2,3]]'],
      ['4', '[[0,1],[0,2],[0,3]]'],
    ],
  },
  {
    n: 2168,
    id: 'pghub-b32-xor-pairs',
    name: 'Equal XOR Pairs',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'countZeroXorPairs',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, return the number of index pairs <code>(i, j)</code> with <code>i &lt; j</code> such that <code>nums[i] XOR nums[j] == 0</code>. The XOR of two equal numbers is zero, so this counts pairs of equal values.',
    examples: [
      ['[1,2,1,3,1]', '3', 'The three 1s form 3 equal pairs; other values have no partner.'],
      ['[4,5,6]', '0', 'All values are distinct, so no pair XORs to zero.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9'],
    tags: ['bit-manipulation', 'hashmap'],
    py: `def countZeroXorPairs(nums):
    counts = Counter(nums)
    total = 0
    for c in counts.values():
        total += c * (c - 1) // 2
    return total`,
    approach:
      'Two numbers XOR to zero exactly when they are equal. Count occurrences of each value; a value appearing c times contributes c*(c-1)/2 pairs. Sum these combination counts.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,1,3,1]'],
      ['[4,5,6]'],
      ['[7]'],
      ['[2,2,2,2]'],
      ['[0,0,0]'],
      ['[1,1,2,2,3,3]'],
      ['[5,5,5,5,5]'],
      ['[10,20,10,20,10]'],
      ['[1,2,3,4,5,6,7,8]'],
      ['[9,9,9,1,1,2]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B32>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b32-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B32>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B32>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b32-grade-${prob.n}.py`);
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
