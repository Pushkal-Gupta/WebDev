#!/usr/bin/env node
// Batch 26 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1596,1597,1602,1607,1612,1613,1618,1623,1628,1634,1635,1644,1645,1650,1651
//
//   node scripts/fill-gap-problems-batch26.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch26.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch26.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1596, 1597, 1602, 1607, 1612, 1613, 1618, 1623, 1628, 1634, 1635, 1644, 1645, 1650, 1651];

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
    n: 1596,
    id: 'pghub-b26-vending-change',
    name: 'Vending Machine Change',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minCoins',
    params: [{ name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'A vending machine dispenses change using coins of value 25, 10, 5 and 1 cents and always prefers larger coins first. Given a change <code>amount</code> in cents, return the minimum number of coins it dispenses.',
    examples: [
      ['41', '4', '25 + 10 + 5 + 1 uses 4 coins.'],
      ['0', '0', 'No change means no coins.'],
    ],
    constraints: ['0 <= amount <= 10^6'],
    tags: ['greedy', 'math'],
    py: `def minCoins(amount):
    coins = [25, 10, 5, 1]
    count = 0
    for c in coins:
        count += amount // c
        amount %= c
    return count`,
    approach:
      'The coin set {25,10,5,1} is canonical, so a greedy largest-first strategy is optimal. Take as many of each coin as fit, carry the remainder down to the next coin, and sum the counts.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    cases: [
      ['41'], ['0'], ['99'], ['25'], ['6'], ['100'], ['37'], ['1'], ['88'], ['999999'],
    ],
  },
  {
    n: 1597,
    id: 'pghub-b26-elevator-trips',
    name: 'Elevator Group Trips',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minTrips',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'cap', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'People line up for an elevator with maximum load <code>cap</code> kilograms. Person <code>i</code> weighs <code>weights[i]</code>. To pack efficiently you may take any two people per trip as long as their combined weight does not exceed <code>cap</code>, otherwise a person rides alone. Return the minimum number of trips needed.',
    examples: [
      ['[60,80,40,90]\n130', '3', 'Pairing the lightest with the heaviest when it fits yields 3 trips.'],
      ['[50,50]\n100', '1', 'Both ride together in one trip.'],
    ],
    constraints: ['1 <= weights.length <= 10^5', '1 <= weights[i] <= cap <= 10^4'],
    tags: ['greedy', 'two-pointers'],
    py: `def minTrips(weights, cap):
    arr = sorted(weights)
    i, j = 0, len(arr) - 1
    trips = 0
    while i <= j:
        if i < j and arr[i] + arr[j] <= cap:
            i += 1
        j -= 1
        trips += 1
    return trips`,
    approach:
      'Sort the weights and use two pointers from the lightest and heaviest. The heaviest person always rides; if the lightest remaining person also fits with them, pair them. Each loop iteration is one trip.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[60,80,40,90]', '130'],
      ['[50,50]', '100'],
      ['[100]', '100'],
      ['[30,30,30,30]', '60'],
      ['[70,70,70]', '100'],
      ['[10,20,30,40,50]', '60'],
      ['[1,1,1,1,1,1]', '2'],
      ['[90,80,70,60,50]', '150'],
      ['[40,40,40,40,40]', '80'],
      ['[99,1,99,1]', '100'],
    ],
  },
  {
    n: 1602,
    id: 'pghub-b26-receipt-total',
    name: 'Receipt Running Maximum',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'maxRunningTotal',
    params: [{ name: 'amounts', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A receipt lists line-item amounts in <code>amounts</code> (some negative for refunds). As items are scanned the running total accumulates left to right. Return the largest running total the receipt ever shows; if every running total is negative, return the largest (closest to zero) among them.',
    examples: [
      ['[2,-1,3,-5,4]', '4', 'Running totals are 2,1,4,-1,3; the max is 4.'],
      ['[-3,-1,-2]', '-3', 'Running totals are -3,-4,-6; the max is -3.'],
    ],
    constraints: ['1 <= amounts.length <= 10^5', '-10^6 <= amounts[i] <= 10^6'],
    tags: ['arrays', 'prefix-sum'],
    py: `def maxRunningTotal(amounts):
    running = 0
    best = None
    for a in amounts:
        running += a
        if best is None or running > best:
            best = running
    return best`,
    approach:
      'Maintain a prefix sum as you sweep the items and track the maximum value the prefix sum attains. Initializing the best from the first running total handles all-negative receipts correctly.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,-1,3,-5,4]'],
      ['[-3,-1,-2]'],
      ['[5]'],
      ['[-5]'],
      ['[1,1,1,1]'],
      ['[10,-20,30,-40]'],
      ['[0,0,0]'],
      ['[-1,2,-3,4,-5]'],
      ['[100,-50,-50,1]'],
      ['[3,3,-10,3,3]'],
    ],
  },
  {
    n: 1607,
    id: 'pghub-b26-keypad-words',
    name: 'Keypad Letter Combinations',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'keypadCombos',
    params: [{ name: 'digits', type: 'str' }],
    return_type: 'List[str]',
    statement:
      'On a phone keypad digit 2 maps to "abc", 3 to "def", 4 to "ghi", 5 to "jkl", 6 to "mno", 7 to "pqrs", 8 to "tuv", and 9 to "wxyz". Given a string <code>digits</code> of digits 2-9, return every letter combination it could spell, in lexicographic order. An empty string yields an empty list.',
    examples: [
      ['"23"', '["ad","ae","af","bd","be","bf","cd","ce","cf"]', 'Each digit contributes one letter.'],
      ['""', '[]', 'No digits, no combinations.'],
    ],
    constraints: ['0 <= digits.length <= 8', 'digits[i] is in the range 2-9'],
    tags: ['backtracking', 'strings'],
    py: `def keypadCombos(digits):
    if not digits:
        return []
    mp = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}
    res = []
    def bt(i, cur):
        if i == len(digits):
            res.append(cur)
            return
        for ch in mp[digits[i]]:
            bt(i + 1, cur + ch)
    bt(0, '')
    return res`,
    approach:
      'Backtrack digit by digit, appending each possible letter for the current digit and recursing to the next. Because the keypad letters are already in alphabetical order, iterating them in order yields the combinations in lexicographic order.',
    complexity: { time: 'O(4^n * n)', space: 'O(n)' },
    cases: [
      ['"23"'], ['""'], ['"2"'], ['"7"'], ['"9"'], ['"234"'], ['"22"'], ['"79"'], ['"456"'], ['"2222"'],
    ],
  },
  {
    n: 1612,
    id: 'pghub-b26-spiral-read',
    name: 'Spiral Grid Readout',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'spiralOrder',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    statement:
      'A scanner reads a rectangular <code>grid</code> in clockwise spiral order: across the top row, down the right column, back along the bottom row, up the left column, then inward. Return the values in the order they are read.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '[1,2,3,6,9,8,7,4,5]', 'Clockwise spiral from the top-left.'],
      ['[[1,2],[3,4]]', '[1,2,4,3]', 'A 2x2 spiral.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 100', '-10^4 <= grid[r][c] <= 10^4'],
    tags: ['arrays', 'simulation'],
    py: `def spiralOrder(grid):
    res = []
    top, bottom = 0, len(grid) - 1
    left, right = 0, len(grid[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(grid[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(grid[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(grid[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(grid[r][left])
            left += 1
    return res`,
    approach:
      'Track four shrinking boundaries (top, bottom, left, right). Walk the top row rightward, the right column downward, the bottom row leftward, and the left column upward, contracting each boundary after use and guarding the last two passes to avoid re-reading cells.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,2],[3,4]]'],
      ['[[1]]'],
      ['[[1,2,3,4]]'],
      ['[[1],[2],[3],[4]]'],
      ['[[1,2,3],[4,5,6]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'],
      ['[[7,7],[7,7]]'],
      ['[[1,2,3],[8,9,4],[7,6,5]]'],
    ],
  },
  {
    n: 1613,
    id: 'pghub-b26-stock-span',
    name: 'Daily Price Span',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'priceSpan',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'For a stock with daily closing <code>prices</code>, the span on a day is the number of consecutive days ending that day (including it) on which the price was less than or equal to that day\'s price. Return the span for each day.',
    examples: [
      ['[100,80,60,70,75,85]', '[1,1,1,2,3,5]', 'On day 5 (price 85) the prior 4 days were all <= 85.'],
      ['[10,10,10]', '[1,2,3]', 'Equal prices extend the span.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '1 <= prices[i] <= 10^9'],
    tags: ['stack', 'monotonic-stack'],
    py: `def priceSpan(prices):
    res = [0] * len(prices)
    stack = []
    for i, p in enumerate(prices):
        while stack and prices[stack[-1]] <= p:
            stack.pop()
        res[i] = i - stack[-1] if stack else i + 1
        stack.append(i)
    return res`,
    approach:
      'Keep a stack of indices of strictly higher prices. For each day, pop every earlier day whose price is at most today\'s; the day now on top is the nearest taller earlier day, so the span is the distance to it (or the full prefix if none remains).',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[100,80,60,70,75,85]'],
      ['[10,10,10]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,1,2,1,2]'],
      ['[7,7,7,7]'],
      ['[3,1,4,1,5,9,2,6]'],
      ['[50,40,30,20,10]'],
      ['[1,3,2,5,4,7]'],
    ],
  },
  {
    n: 1618,
    id: 'pghub-b26-ticket-window',
    name: 'Booking Seat Selection',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'countAtLeast',
    params: [
      { name: 'seats', type: 'List[int]' },
      { name: 'price', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Seats are sold at prices given in sorted ascending <code>seats</code>. A customer with budget <code>price</code> can buy any seat costing at most <code>price</code>. Return how many seats are affordable.',
    examples: [
      ['[10,20,30,40]\n25', '2', 'Seats priced 10 and 20 are affordable.'],
      ['[5,5,5]\n4', '0', 'Nothing is within budget.'],
    ],
    constraints: ['1 <= seats.length <= 10^5', '1 <= seats[i] <= 10^9', 'seats is sorted ascending', '0 <= price <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def countAtLeast(seats, price):
    lo, hi = 0, len(seats)
    while lo < hi:
        mid = (lo + hi) // 2
        if seats[mid] <= price:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    approach:
      'Because the seat prices are sorted, binary-search for the first price that exceeds the budget. The index of that boundary is exactly the count of affordable seats (an upper-bound search).',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[10,20,30,40]', '25'],
      ['[5,5,5]', '4'],
      ['[5,5,5]', '5'],
      ['[1,2,3,4,5]', '0'],
      ['[1,2,3,4,5]', '100'],
      ['[1,2,3,4,5]', '3'],
      ['[10]', '10'],
      ['[2,4,6,8,10]', '7'],
      ['[1,1,1,1,1]', '1'],
      ['[100,200,300]', '150'],
    ],
  },
  {
    n: 1623,
    id: 'pghub-b26-palindrome-pair',
    name: 'Rearrange To Palindrome',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'canMakePalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'Given a lowercase string <code>s</code>, determine whether its characters can be rearranged into a palindrome. Return <code>true</code> if such a rearrangement exists, otherwise <code>false</code>.',
    examples: [
      ['"aabb"', 'true', 'Rearranges to "abba".'],
      ['"abc"', 'false', 'Three distinct single characters cannot pair up.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'hashmap'],
    py: `def canMakePalindrome(s):
    counts = Counter(s)
    odd = sum(1 for v in counts.values() if v % 2 == 1)
    return odd <= 1`,
    approach:
      'A multiset of characters forms a palindrome iff at most one character has an odd frequency (that one sits in the center). Count frequencies and check the number of odd counts is no more than one.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"aabb"'], ['"abc"'], ['"a"'], ['"aa"'], ['"aab"'], ['"racecar"'], ['"abcabc"'], ['"abcabcd"'], ['"zzz"'], ['"aabbccd"'],
    ],
  },
  {
    n: 1628,
    id: 'pghub-b26-flood-zones',
    name: 'Flooded Land Regions',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countIslands',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A map <code>grid</code> uses <code>1</code> for land and <code>0</code> for water. Land cells connected horizontally or vertically belong to the same island. Return the number of distinct islands.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'The L-shaped land is one island; the lone cell is another.'],
      ['[[0,0],[0,0]]', '0', 'All water.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 300', 'grid[r][c] is 0 or 1'],
    tags: ['graphs', 'dfs'],
    py: `def countIslands(grid):
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
                    for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and not seen[nr][nc]:
                            seen[nr][nc] = True
                            stack.append((nr, nc))
    return count`,
    approach:
      'Scan every cell; when an unvisited land cell is found, increment the island count and flood-fill its whole connected component with an iterative DFS over 4-directional neighbours, marking each visited so it is counted once.',
    complexity: { time: 'O(rows * cols)', space: 'O(rows * cols)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[1,0,1,0,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,1,0,0,1],[1,0,0,1,1],[0,0,1,0,0]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1,0,1],[0,0,0],[1,0,1]]'],
      ['[[1,1,1,1,1]]'],
    ],
  },
  {
    n: 1634,
    id: 'pghub-b26-budget-split',
    name: 'Fair Budget Partition',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'canSplitEqual',
    params: [{ name: 'costs', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'Two departments want to split a list of project <code>costs</code> so that each department pays the same total. Each project goes entirely to one department. Return <code>true</code> if an equal split is possible, otherwise <code>false</code>.',
    examples: [
      ['[1,5,11,5]', 'true', 'Split into {11} and {1,5,5}, each totaling 11.'],
      ['[1,2,5]', 'false', 'The total 8 is even, but no subset sums to 4.'],
    ],
    constraints: ['1 <= costs.length <= 200', '1 <= costs[i] <= 100'],
    tags: ['dp', 'subset-sum'],
    py: `def canSplitEqual(costs):
    total = sum(costs)
    if total % 2 == 1:
        return False
    target = total // 2
    dp = 1  # bitmask: bit k set means sum k is reachable
    for c in costs:
        dp |= dp << c
    return (dp >> target) & 1 == 1`,
    approach:
      'If the total is odd no equal split exists. Otherwise this is subset-sum for half the total. Represent reachable sums as bits of a big integer and shift-or by each cost; bit `target` set means that sum is achievable.',
    complexity: { time: 'O(n * sum / word)', space: 'O(sum)' },
    cases: [
      ['[1,5,11,5]'],
      ['[1,2,5]'],
      ['[2,2]'],
      ['[3]'],
      ['[1,1,1,1]'],
      ['[100,100]'],
      ['[1,2,3,4,5,6,7]'],
      ['[2,4,6,8]'],
      ['[10,10,10,10,10]'],
      ['[14,9,8,4,3,2]'],
    ],
  },
  {
    n: 1635,
    id: 'pghub-b26-cache-window',
    name: 'Distinct Visitors Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxDistinct',
    params: [
      { name: 'visitors', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A log records visitor ids in <code>visitors</code>. For a fixed window size <code>k</code>, return the maximum number of distinct visitor ids found in any contiguous window of exactly <code>k</code> entries. If <code>k</code> exceeds the log length, consider the whole log as the only window.',
    examples: [
      ['[1,2,1,3,4]\n3', '3', 'Window [1,3,4] has 3 distinct ids.'],
      ['[5,5,5]\n2', '1', 'Every window holds the same id.'],
    ],
    constraints: ['1 <= visitors.length <= 10^5', '1 <= visitors[i] <= 10^9', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'hashmap'],
    py: `def maxDistinct(visitors, k):
    n = len(visitors)
    k = min(k, n)
    freq = defaultdict(int)
    for i in range(k):
        freq[visitors[i]] += 1
    best = len(freq)
    for i in range(k, n):
        freq[visitors[i]] += 1
        out = visitors[i - k]
        freq[out] -= 1
        if freq[out] == 0:
            del freq[out]
        if len(freq) > best:
            best = len(freq)
    return best`,
    approach:
      'Maintain a frequency map over a sliding window of width k. Build the first window, then slide one step at a time: add the entering id and remove the leaving id (deleting it when its count hits zero). The map size is the distinct count; track its maximum.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,2,1,3,4]', '3'],
      ['[5,5,5]', '2'],
      ['[1]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[1,1,2,2,3,3]', '2'],
      ['[1,2,3,1,2,3]', '3'],
      ['[7,7,7,7]', '10'],
      ['[1,2,2,3,3,3,4]', '4'],
      ['[9,8,7,9,8,7]', '2'],
      ['[1,2,3,4,3,2,1]', '4'],
    ],
  },
  {
    n: 1644,
    id: 'pghub-b26-bridge-toll',
    name: 'Cheapest Bridge Crossing',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'cheapestCrossing',
    params: [
      { name: 'n', type: 'int' },
      { name: 'bridges', type: 'List[List[int]]' },
      { name: 'src', type: 'int' },
      { name: 'dst', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> islands numbered <code>0..n-1</code>. Each bridge in <code>bridges</code> is <code>[u, v, toll]</code> and can be crossed in both directions for <code>toll</code> coins. Return the minimum total toll to travel from island <code>src</code> to island <code>dst</code>, or -1 if it cannot be reached.',
    examples: [
      ['5\n[[0,1,4],[0,2,1],[2,1,1],[1,3,1]]\n0\n3', '3', 'Route 0-2-1-3 costs 1+1+1=3.'],
      ['3\n[[0,1,2]]\n0\n2', '-1', 'Island 2 is isolated.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= bridges.length <= 5 * 10^4', '0 <= u, v < n', '1 <= toll <= 10^6'],
    tags: ['advanced-graphs', 'dijkstra'],
    py: `def cheapestCrossing(n, bridges, src, dst):
    adj = defaultdict(list)
    for u, v, w in bridges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == dst:
            return d
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist[dst] if dist[dst] != INF else -1`,
    approach:
      'Build an undirected weighted adjacency list and run Dijkstra from src. A min-heap keyed by accumulated toll settles the cheapest-reachable island first; relax its bridges. Return the toll when dst is popped, or -1 if unreachable.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['5', '[[0,1,4],[0,2,1],[2,1,1],[1,3,1]]', '0', '3'],
      ['3', '[[0,1,2]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1]]', '0', '3'],
      ['4', '[[0,1,10],[1,2,10],[0,2,3],[2,3,3]]', '0', '3'],
      ['2', '[[0,1,5]]', '1', '0'],
      ['6', '[[0,1,7],[1,2,6],[0,3,1],[3,4,1],[4,2,1]]', '0', '2'],
      ['5', '[[0,1,2],[1,2,2],[2,3,2],[3,4,2],[0,4,100]]', '0', '4'],
      ['3', '[[0,1,1],[1,0,1]]', '0', '1'],
      ['7', '[[0,1,3],[1,6,3],[0,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1]]', '0', '6'],
    ],
  },
  {
    n: 1645,
    id: 'pghub-b26-xor-pair',
    name: 'Unpaired Sensor Reading',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'lonelyReading',
    params: [{ name: 'readings', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A sensor array reports <code>readings</code> where every value appears exactly twice except one value that appears once. Return the value that appears only once.',
    examples: [
      ['[4,1,2,1,2]', '4', 'Every value but 4 is paired.'],
      ['[7]', '7', 'A single unpaired reading.'],
    ],
    constraints: ['1 <= readings.length <= 10^5', 'readings.length is odd', '0 <= readings[i] <= 10^9'],
    tags: ['bit-manipulation', 'arrays'],
    py: `def lonelyReading(readings):
    acc = 0
    for r in readings:
        acc ^= r
    return acc`,
    approach:
      'XOR is associative and self-cancelling: a value XORed with itself is zero. XORing all readings together cancels every paired value, leaving only the single unpaired one.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[4,1,2,1,2]'],
      ['[7]'],
      ['[1,1,9]'],
      ['[5,5,3,3,8]'],
      ['[0]'],
      ['[10,20,10]'],
      ['[2,2,2,2,5]'],
      ['[100,200,100,300,200]'],
      ['[1,2,3,2,1]'],
      ['[999999,1,1]'],
    ],
  },
  {
    n: 1650,
    id: 'pghub-b26-paint-fence',
    name: 'Fence Painting Ways',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'paintWays',
    params: [
      { name: 'posts', type: 'int' },
      { name: 'colors', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A fence has <code>posts</code> posts in a row, each painted with one of <code>colors</code> colors. No three consecutive posts may share the same color. Return the number of ways to paint the fence, modulo <code>1000000007</code>.',
    examples: [
      ['3\n2', '6', 'With 2 colors and 3 posts, 6 valid colorings exist.'],
      ['1\n5', '5', 'One post can take any of 5 colors.'],
    ],
    constraints: ['1 <= posts <= 10^5', '1 <= colors <= 10^5'],
    tags: ['dp', 'math'],
    py: `def paintWays(posts, colors):
    MOD = 1000000007
    if posts == 1:
        return colors % MOD
    same = colors % MOD          # ways where last two posts share a color
    diff = (colors * (colors - 1)) % MOD  # ways where last two differ
    for _ in range(3, posts + 1):
        same, diff = diff, ((same + diff) * (colors - 1)) % MOD
    return (same + diff) % MOD`,
    approach:
      'Track two states per post: the count where the last two posts share a color (same) and where they differ (diff). A new post equal to the previous one is only legal if the prior pair differed, while a differing post can follow anything; roll the recurrence forward under the modulus.',
    complexity: { time: 'O(posts)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['3', '2'],
      ['1', '5'],
      ['2', '3'],
      ['4', '2'],
      ['5', '3'],
      ['1', '1'],
      ['2', '1'],
      ['7', '4'],
      ['10', '2'],
      ['100000', '99991'],
    ],
  },
  {
    n: 1651,
    id: 'pghub-b26-median-stream',
    name: 'Running Median Snapshots',
    topic_id: 'heap',
    difficulty: 'Hard',
    method_name: 'runningMedians',
    params: [{ name: 'stream', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Numbers arrive one at a time in <code>stream</code>. After each arrival, record the median of all numbers seen so far. When an odd count of numbers has arrived the median is the middle value; when the count is even the median is the lower of the two central values. Return the list of recorded medians, one per arrival.',
    examples: [
      ['[5,2,8,1]', '[5,2,5,2]', 'After each step the lower-middle median is recorded.'],
      ['[3]', '[3]', 'A single number is its own median.'],
    ],
    constraints: ['1 <= stream.length <= 10^5', '-10^9 <= stream[i] <= 10^9'],
    tags: ['heap', 'data-stream'],
    py: `def runningMedians(stream):
    low = []   # max-heap (store negatives) holding the smaller half
    high = []  # min-heap holding the larger half
    res = []
    for x in stream:
        if not low or x <= -low[0]:
            heapq.heappush(low, -x)
        else:
            heapq.heappush(high, x)
        # rebalance so len(low) == len(high) or len(low) == len(high)+1
        if len(low) > len(high) + 1:
            heapq.heappush(high, -heapq.heappop(low))
        elif len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        res.append(-low[0])
    return res`,
    approach:
      'Maintain two heaps: a max-heap for the lower half and a min-heap for the upper half, kept balanced so the lower half holds the lower-middle element. After each insertion rebalance by at most one move, then the lower-middle median is the top of the max-heap.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[5,2,8,1]'],
      ['[3]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,2,2]'],
      ['[-1,-5,3,0]'],
      ['[10,20,30,40,50,60]'],
      ['[1,3,2,4,6,5]'],
      ['[100,-100,50,-50,0]'],
      ['[7,7,7,1,1,1]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B26>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b26-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B26>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B26>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b26-grade-${prob.n}.py`);
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
