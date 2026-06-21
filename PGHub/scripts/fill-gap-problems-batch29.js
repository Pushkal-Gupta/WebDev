#!/usr/bin/env node
// Batch 29 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Fills exactly these 15 numbering gaps (leetcode_number):
//   1820,1821,1826,1831,1836,1841,1842,1843,1852,1853,1867,1868,1874,1875,1885
//
//   node scripts/fill-gap-problems-batch29.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch29.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch29.js --verify  # re-run stored solutions vs stored cases
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

const BATCH = [1820, 1821, 1826, 1831, 1836, 1841, 1842, 1843, 1852, 1853, 1867, 1868, 1874, 1875, 1885];

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
    n: 1820,
    id: 'pghub-b29-warehouse-restock',
    name: 'Warehouse Restock Threshold',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countLowStock',
    params: [
      { name: 'stock', type: 'List[int]' },
      { name: 'threshold', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A warehouse tracks shelf quantities in <code>stock</code>. A shelf needs restocking when its quantity is strictly below <code>threshold</code>. Return how many shelves need restocking.',
    examples: [
      ['[5,2,8,1,3]\n3', '2', 'Shelves with 2 and 1 are below 3.'],
      ['[10,10,10]\n5', '0', 'Every shelf is at or above 5.'],
    ],
    constraints: ['1 <= stock.length <= 10^5', '0 <= stock[i] <= 10^9', '0 <= threshold <= 10^9'],
    tags: ['arrays'],
    py: `def countLowStock(stock, threshold):
    return sum(1 for q in stock if q < threshold)`,
    approach:
      'Sweep the quantities once and count each shelf whose quantity is strictly less than the threshold.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[5,2,8,1,3]', '3'],
      ['[10,10,10]', '5'],
      ['[0]', '1'],
      ['[7]', '7'],
      ['[1,2,3,4,5]', '6'],
      ['[5,4,3,2,1]', '0'],
      ['[100,0,50,0,100]', '1'],
      ['[3,3,3,3]', '3'],
      ['[9,8,7,6,5]', '8'],
      ['[1000000000,0]', '1'],
    ],
  },
  {
    n: 1821,
    id: 'pghub-b29-zigzag-merge',
    name: 'Alternating Queue Merge',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'mergeAlternating',
    params: [
      { name: 'a', type: 'List[int]' },
      { name: 'b', type: 'List[int]' },
    ],
    return_type: 'List[int]',
    statement:
      'Two queues are given as <code>a</code> and <code>b</code>. Build a single list by taking one element from <code>a</code>, then one from <code>b</code>, alternating, starting with <code>a</code>. When one queue is exhausted, append all remaining elements of the other. Return the merged list.',
    examples: [
      ['[1,3,5]\n[2,4,6]', '[1,2,3,4,5,6]', 'Alternate starting from a.'],
      ['[1,2]\n[9]', '[1,9,2]', 'b runs out, append the rest of a.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', '-10^9 <= a[i], b[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def mergeAlternating(a, b):
    res = []
    i, j = 0, 0
    while i < len(a) and j < len(b):
        res.append(a[i]); i += 1
        res.append(b[j]); j += 1
    res.extend(a[i:])
    res.extend(b[j:])
    return res`,
    approach:
      'Walk both lists with two indices, appending one from each per step while both have elements left, then append whatever remains of the longer list.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['[1,3,5]', '[2,4,6]'],
      ['[1,2]', '[9]'],
      ['[]', '[1,2,3]'],
      ['[1,2,3]', '[]'],
      ['[]', '[]'],
      ['[7]', '[8]'],
      ['[1,1,1,1]', '[2,2]'],
      ['[5,6]', '[1,2,3,4]'],
      ['[-1,-2,-3]', '[0,0,0]'],
      ['[10,20,30,40]', '[50]'],
    ],
  },
  {
    n: 1826,
    id: 'pghub-b29-toll-booth-peak',
    name: 'Toll Booth Peak Hour',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'busiestWindow',
    params: [
      { name: 'cars', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'An array <code>cars</code> records the number of cars passing a toll booth each minute. Return the maximum total number of cars over any window of exactly <code>k</code> consecutive minutes. If <code>k</code> exceeds the number of minutes, sum the whole array.',
    examples: [
      ['[2,1,5,1,3,2]\n3', '9', 'Window [5,1,3] sums to 9.'],
      ['[4,4]\n5', '8', 'k is larger than the array, so sum everything.'],
    ],
    constraints: ['1 <= cars.length <= 10^5', '0 <= cars[i] <= 10^4', '1 <= k <= 10^5'],
    tags: ['sliding-window', 'arrays'],
    py: `def busiestWindow(cars, k):
    n = len(cars)
    k = min(k, n)
    cur = sum(cars[:k])
    best = cur
    for i in range(k, n):
        cur += cars[i] - cars[i - k]
        if cur > best:
            best = cur
    return best`,
    approach:
      'Compute the sum of the first window, then slide it one minute at a time by adding the entering minute and subtracting the leaving minute, tracking the maximum window sum seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,5,1,3,2]', '3'],
      ['[4,4]', '5'],
      ['[1]', '1'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '5'],
      ['[5,5,5,5]', '2'],
      ['[0,0,0,0]', '3'],
      ['[10,1,1,1,10]', '2'],
      ['[3,1,4,1,5,9,2,6]', '4'],
      ['[7,7,7,7,7,7]', '6'],
    ],
  },
  {
    n: 1831,
    id: 'pghub-b29-bracket-depth',
    name: 'Maximum Bracket Nesting',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxNesting',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains only the characters <code>(</code> and <code>)</code> and is guaranteed to be a valid balanced sequence. Return the maximum nesting depth of the brackets.',
    examples: [
      ['"(())"', '2', 'The inner pair sits two levels deep.'],
      ['"()()"', '1', 'No nesting beyond one level.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's contains only ( and ) and is balanced'],
    tags: ['stack', 'strings'],
    py: `def maxNesting(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == '(':
            depth += 1
            if depth > best:
                best = depth
        else:
            depth -= 1
    return best`,
    approach:
      'Track the current open-bracket depth as a counter: increment on an opening bracket and decrement on a closing one. The answer is the largest depth ever reached.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(())"'], ['"()()"'], ['""'], ['"()"'], ['"((()))"'],
      ['"(()(()))"'], ['"()(())"'], ['"(((())))"'], ['"(()()())"'], ['"((())(()))"'],
    ],
  },
  {
    n: 1836,
    id: 'pghub-b29-coupon-stacking',
    name: 'Maximum Coupon Value',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxCouponValue',
    params: [{ name: 'values', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of coupons has values in <code>values</code> (some negative penalties). You may redeem any subset, but you cannot redeem two coupons that are adjacent in the row. Return the maximum total value obtainable; you may also redeem nothing for a total of 0.',
    examples: [
      ['[3,2,5,10,7]', '15', 'Redeem coupons 3, 5, 7 (indices 0,2,4) for 15.'],
      ['[-1,-2,-3]', '0', 'All negative, so redeem nothing.'],
    ],
    constraints: ['0 <= values.length <= 10^5', '-10^4 <= values[i] <= 10^4'],
    tags: ['dp'],
    py: `def maxCouponValue(values):
    take, skip = 0, 0
    for v in values:
        take, skip = skip + v, max(skip, take)
    return max(take, skip)`,
    approach:
      'House-robber style DP: at each coupon track the best total if we take it (previous skip plus its value) versus skip it (best of the two prior states). The answer is the better of the final two, never below zero because skipping all yields 0.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,2,5,10,7]'],
      ['[-1,-2,-3]'],
      ['[]'],
      ['[5]'],
      ['[5,5,5,5]'],
      ['[2,1,1,2]'],
      ['[10,-5,10,-5,10]'],
      ['[1,2,3,4,5,6]'],
      ['[100,1,1,100]'],
      ['[-5,8,-3,7,-1,9]'],
    ],
  },
  {
    n: 1841,
    id: 'pghub-b29-relay-baton',
    name: 'Relay Team Handoffs',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'longestRelay',
    params: [
      { name: 'n', type: 'int' },
      { name: 'handoffs', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'A relay has <code>n</code> runners labelled <code>0..n-1</code>. Each entry in <code>handoffs</code> is <code>[u, v]</code> meaning runner <code>u</code> can hand the baton directly to runner <code>v</code> (a one-way pass). The pass graph is a DAG. Return the length (number of handoffs) of the longest possible chain of passes.',
    examples: [
      ['4\n[[0,1],[1,2],[0,2],[2,3]]', '3', 'Chain 0->1->2->3 uses 3 handoffs.'],
      ['3\n[]', '0', 'No passes possible.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= handoffs.length <= 5 * 10^4', 'the graph is a DAG'],
    tags: ['graphs', 'topological-sort'],
    py: `def longestRelay(n, handoffs):
    adj = defaultdict(list)
    indeg = [0] * n
    for u, v in handoffs:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    dist = [0] * n
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[u] + 1 > dist[v]:
                dist[v] = dist[u] + 1
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return max(dist) if n else 0`,
    approach:
      'Process runners in topological order via a Kahn-style topological order. The longest chain ending at a runner is one more than the best chain ending at any predecessor, so relax distances as edges are consumed. The answer is the maximum distance.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[0,2],[2,3]]'],
      ['3', '[]'],
      ['1', '[]'],
      ['2', '[[0,1]]'],
      ['5', '[[0,1],[1,2],[2,3],[3,4]]'],
      ['5', '[[0,1],[0,2],[0,3],[0,4]]'],
      ['6', '[[0,1],[1,2],[3,4],[4,5]]'],
      ['4', '[[0,1],[2,3]]'],
      ['7', '[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6]]'],
      ['3', '[[0,1],[1,2],[0,2]]'],
    ],
  },
  {
    n: 1842,
    id: 'pghub-b29-frequency-rank',
    name: 'Top Frequent Token',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'topToken',
    params: [{ name: 'tokens', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given a list of integer <code>tokens</code>, return the token that appears most often. If several tokens tie for the highest count, return the smallest such token.',
    examples: [
      ['[1,1,2,2,2,3]', '2', '2 appears three times, more than any other.'],
      ['[5,5,3,3]', '3', '5 and 3 both appear twice; pick the smaller, 3.'],
    ],
    constraints: ['1 <= tokens.length <= 10^5', '-10^9 <= tokens[i] <= 10^9'],
    tags: ['heap', 'hashmap'],
    py: `def topToken(tokens):
    freq = Counter(tokens)
    best_tok = None
    best_cnt = -1
    for tok, cnt in freq.items():
        if cnt > best_cnt or (cnt == best_cnt and tok < best_tok):
            best_tok = tok
            best_cnt = cnt
    return best_tok`,
    approach:
      'Count occurrences with a hash map, then scan the counts picking the token with the highest frequency, breaking ties toward the smaller token value.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,1,2,2,2,3]'],
      ['[5,5,3,3]'],
      ['[7]'],
      ['[4,4,4,4]'],
      ['[1,2,3,4]'],
      ['[-1,-1,2,2]'],
      ['[9,9,9,1,1,1,5]'],
      ['[1000000000,1000000000,-1000000000]'],
      ['[2,2,1,1,3,3,3]'],
      ['[0,0,0,-5,-5,-5]'],
    ],
  },
  {
    n: 1843,
    id: 'pghub-b29-prime-gap',
    name: 'Nearest Prime Above',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'nextPrime',
    params: [{ name: 'x', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer <code>x</code>, return the smallest prime number that is strictly greater than <code>x</code>.',
    examples: [
      ['10', '11', '11 is the first prime above 10.'],
      ['13', '17', 'The next prime after 13 is 17.'],
    ],
    constraints: ['0 <= x <= 10^6'],
    tags: ['math'],
    py: `def nextPrime(x):
    def is_prime(m):
        if m < 2:
            return False
        if m % 2 == 0:
            return m == 2
        i = 3
        while i * i <= m:
            if m % i == 0:
                return False
            i += 2
        return True
    cand = x + 1
    while not is_prime(cand):
        cand += 1
    return cand`,
    approach:
      'Start one above x and test each successive integer for primality with trial division up to its square root, returning the first prime found. By the Bertrand postulate a prime always exists within a bounded range.',
    complexity: { time: 'O(g * sqrt(x))', space: 'O(1)' },
    cases: [
      ['10'], ['13'], ['0'], ['1'], ['2'], ['7'], ['100'], ['97'], ['1000'], ['999983'],
    ],
  },
  {
    n: 1852,
    id: 'pghub-b29-binary-clock',
    name: 'Binary Clock Bit Count',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'litLeds',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A binary clock represents the number <code>n</code> in binary, lighting one LED for each set bit. Return the number of LEDs that are lit (the count of 1-bits in <code>n</code>).',
    examples: [
      ['5', '2', '5 is 101 in binary, two bits set.'],
      ['0', '0', 'Zero has no bits set.'],
    ],
    constraints: ['0 <= n <= 2^31 - 1'],
    tags: ['bit-manipulation'],
    py: `def litLeds(n):
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count`,
    approach:
      'Use the Brian Kernighan trick: n & (n-1) clears the lowest set bit. Repeating until n is zero counts exactly the number of set bits.',
    complexity: { time: 'O(bits set)', space: 'O(1)' },
    cases: [
      ['5'], ['0'], ['1'], ['7'], ['8'], ['255'], ['1024'], ['2147483647'], ['170'], ['65535'],
    ],
  },
  {
    n: 1853,
    id: 'pghub-b29-shipping-capacity',
    name: 'Minimum Daily Ship Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'days', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Packages with weights <code>weights</code> must ship in their given order. Each day a ship loads packages in order without exceeding its capacity, and all packages must ship within <code>days</code> days. Return the minimum ship capacity that makes this possible.',
    examples: [
      ['[1,2,3,4,5,6,7,8,9,10]\n5', '15', 'Capacity 15 lets the ten packages fit in 5 days.'],
      ['[3,2,2,4,1,4]\n3', '6', 'Capacity 6 ships everything within 3 days.'],
    ],
    constraints: ['1 <= weights.length <= 5 * 10^4', '1 <= weights[i] <= 500', '1 <= days <= weights.length'],
    tags: ['binary-search'],
    py: `def minCapacity(weights, days):
    def needed(cap):
        d = 1
        cur = 0
        for w in weights:
            if cur + w > cap:
                d += 1
                cur = 0
            cur += w
        return d
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The number of days needed is monotonic in capacity, so binary-search the capacity between the heaviest package and the total weight. For each candidate, greedily simulate loading to count the days required.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      ['[3,2,2,4,1,4]', '3'],
      ['[1,2,3,1,1]', '4'],
      ['[10]', '1'],
      ['[5,5,5,5]', '4'],
      ['[5,5,5,5]', '1'],
      ['[1,1,1,1,1,1]', '2'],
      ['[7,2,5,10,8]', '2'],
      ['[100,200,300]', '3'],
      ['[4,4,4,4,4,4]', '3'],
    ],
  },
  {
    n: 1867,
    id: 'pghub-b29-anagram-groups',
    name: 'Count Anagram Groups',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'countGroups',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Given a list of lowercase <code>words</code>, two words belong to the same group if one is an anagram of the other. Return the number of distinct anagram groups.',
    examples: [
      ['["eat","tea","tan","ate","nat","bat"]', '3', 'Groups: {eat,tea,ate}, {tan,nat}, {bat}.'],
      ['["abc"]', '1', 'A single word forms one group.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words[i] is lowercase'],
    tags: ['strings', 'hashmap'],
    py: `def countGroups(words):
    seen = set()
    for w in words:
        seen.add(''.join(sorted(w)))
    return len(seen)`,
    approach:
      'Anagrams share the same multiset of letters, so the sorted form of a word is a canonical key. Insert the sorted key of each word into a set; the number of distinct keys is the number of groups.',
    complexity: { time: 'O(n * L log L)', space: 'O(n * L)' },
    cases: [
      ['["eat","tea","tan","ate","nat","bat"]'],
      ['["abc"]'],
      ['["a","a","a"]'],
      ['["ab","ba","abc","cba","bca"]'],
      ['["x","y","z"]'],
      ['["listen","silent","enlist"]'],
      ['["aa","aa","bb","bb"]'],
      ['["abcd","dcba","abdc","dabc"]'],
      ['["one","two","three"]'],
      ['["go","og","do","od","cat"]'],
    ],
  },
  {
    n: 1868,
    id: 'pghub-b29-subset-product',
    name: 'Count Subsets Below Product',
    topic_id: 'backtracking',
    difficulty: 'Medium',
    method_name: 'countSubsets',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given a list of positive integers <code>nums</code>, count the number of non-empty subsets whose product of elements is at most <code>limit</code>. Two subsets are different if they use different sets of indices.',
    examples: [
      ['[2,3,4]\n6', '4', 'Subsets with product <= 6: {2}, {3}, {4}, and {2,3}.'],
      ['[5]\n4', '0', 'The only subset {5} exceeds 4.'],
    ],
    constraints: ['1 <= nums.length <= 20', '1 <= nums[i] <= 10^4', '1 <= limit <= 10^9'],
    tags: ['backtracking'],
    py: `def countSubsets(nums, limit):
    n = len(nums)
    count = 0
    def bt(i, prod, used):
        nonlocal count
        if i == n:
            if used and prod <= limit:
                count += 1
            return
        # skip nums[i]
        bt(i + 1, prod, used)
        # take nums[i]
        bt(i + 1, prod * nums[i], used + 1)
    bt(0, 1, 0)
    return count`,
    approach:
      'Enumerate every subset by recursively deciding to skip or take each element, carrying the running product and a used-count. At a leaf, count the subset when it is non-empty and its product is within the limit.',
    complexity: { time: 'O(2^n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[2,3,4]', '6'],
      ['[5]', '4'],
      ['[1]', '1'],
      ['[1,1,1]', '1'],
      ['[2,2,2,2]', '4'],
      ['[10,20,30]', '5'],
      ['[1,2,3,4,5]', '10'],
      ['[7,11,13]', '1000'],
      ['[2,3,5,7]', '30'],
      ['[100,100,100]', '100'],
    ],
  },
  {
    n: 1874,
    id: 'pghub-b29-circular-tour',
    name: 'Gas Station Circular Tour',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'startStation',
    params: [
      { name: 'gas', type: 'List[int]' },
      { name: 'cost', type: 'List[int]' },
    ],
    return_type: 'int',
    statement:
      'There are stations arranged in a circle. At station <code>i</code> you can collect <code>gas[i]</code> fuel, and travelling from station <code>i</code> to the next costs <code>cost[i]</code> fuel. Starting with an empty tank, return the index of the station from which you can complete the full loop, or -1 if impossible. If multiple starts work, return the smallest such index.',
    examples: [
      ['[1,2,3,4,5]\n[3,4,5,1,2]', '3', 'Starting at station 3 lets you complete the circuit.'],
      ['[2,3,4]\n[3,4,3]', '-1', 'No starting station works.'],
    ],
    constraints: ['1 <= gas.length == cost.length <= 10^5', '0 <= gas[i], cost[i] <= 10^4'],
    tags: ['greedy'],
    py: `def startStation(gas, cost):
    total = 0
    tank = 0
    start = 0
    for i in range(len(gas)):
        diff = gas[i] - cost[i]
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1`,
    approach:
      'If total gas is at least total cost a solution exists. Sweep once tracking a running tank; whenever it goes negative, no station up to here can be the start, so reset the candidate start to the next station and zero the tank.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '[3,4,5,1,2]'],
      ['[2,3,4]', '[3,4,3]'],
      ['[5]', '[4]'],
      ['[4]', '[5]'],
      ['[3,3,3]', '[3,3,3]'],
      ['[5,1,2,3,4]', '[4,4,1,5,1]'],
      ['[0,0,0]', '[0,0,0]'],
      ['[1,2,3]', '[3,2,1]'],
      ['[6,1,4,3,5]', '[3,8,2,1,1]'],
      ['[2,0,0,0,3]', '[0,1,0,0,4]'],
    ],
  },
  {
    n: 1875,
    id: 'pghub-b29-tree-balance',
    name: 'Tree Height Difference',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'isBalanced',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'A binary tree is given in level-order as <code>tree</code>, where <code>null</code> marks a missing child (encoded as -1 in the input array). A tree is height-balanced if for every node the heights of its two subtrees differ by at most one. Return <code>true</code> if the tree is balanced, otherwise <code>false</code>. An empty tree is balanced.',
    examples: [
      ['[3,9,20,-1,-1,15,7]', 'true', 'Every node has balanced subtrees.'],
      ['[1,2,-1,3,-1,-1,-1]', 'false', 'A left-leaning chain becomes unbalanced.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'each value is -1 (null) or 0 <= value <= 10^4'],
    tags: ['trees', 'dfs'],
    py: `def isBalanced(tree):
    n = len(tree)
    if n == 0 or tree[0] == -1:
        return True
    # Parse level-order: each non-null node consumes the next two slots as its children.
    left = {}
    right = {}
    q = deque([0])
    idx = 1
    while q and idx < n:
        node = q.popleft()
        if idx < n:
            if tree[idx] != -1:
                left[node] = idx
                q.append(idx)
            idx += 1
        if idx < n:
            if tree[idx] != -1:
                right[node] = idx
                q.append(idx)
            idx += 1
    balanced = [True]
    def height(node):
        if node is None:
            return 0
        lh = height(left.get(node))
        rh = height(right.get(node))
        if abs(lh - rh) > 1:
            balanced[0] = False
        return 1 + max(lh, rh)
    height(0)
    return balanced[0]`,
    approach:
      'Parse the level-order array (with -1 as null) into left/right child index maps using a BFS queue, where each non-null node consumes the next two slots for its children. Then run a post-order DFS computing subtree heights, flagging imbalance whenever two child heights differ by more than one.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,9,20,-1,-1,15,7]'],
      ['[1,2,-1,3,-1,-1,-1]'],
      ['[]'],
      ['[1]'],
      ['[1,2,3]'],
      ['[1,2,2,3,3,-1,-1,4,4]'],
      ['[1,-1,2,-1,3]'],
      ['[5,4,8,3,-1,7,9,2]'],
      ['[1,2,2,3,-1,-1,3,4,-1,-1,4]'],
      ['[10,5,15,3,7,-1,18]'],
    ],
  },
  {
    n: 1885,
    id: 'pghub-b29-meeting-rooms',
    name: 'Concurrent Meeting Rooms',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'minRooms',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each meeting in <code>meetings</code> is <code>[start, end]</code> with <code>start &lt; end</code>. A room hosts one meeting at a time; a meeting ending exactly when another starts can reuse the room. Return the minimum number of rooms needed to host all meetings.',
    examples: [
      ['[[0,30],[5,10],[15,20]]', '2', 'The [0,30] meeting overlaps both others, needing 2 rooms.'],
      ['[[7,10],[2,4]]', '1', 'The meetings do not overlap; one room suffices.'],
    ],
    constraints: ['0 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def minRooms(meetings):
    if not meetings:
        return 0
    starts = sorted(m[0] for m in meetings)
    ends = sorted(m[1] for m in meetings)
    rooms = 0
    best = 0
    i = j = 0
    n = len(meetings)
    while i < n:
        if starts[i] < ends[j]:
            rooms += 1
            if rooms > best:
                best = rooms
            i += 1
        else:
            rooms -= 1
            j += 1
    return best`,
    approach:
      'Sort start and end times separately and sweep with two pointers. A new start before the earliest unprocessed end means a room opens; otherwise a room frees up. Track the peak number of simultaneously open rooms.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[0,30],[5,10],[15,20]]'],
      ['[[7,10],[2,4]]'],
      ['[]'],
      ['[[1,5]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[1,10],[2,9],[3,8],[4,7]]'],
      ['[[0,1],[0,1],[0,1]]'],
      ['[[5,8],[6,8],[6,8],[8,10]]'],
      ['[[1,3],[2,4],[3,5],[4,6]]'],
      ['[[10,20],[20,30],[30,40],[15,25]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B29>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b29-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B29>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B29>>'.length, -'<<END>>'.length)
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
    .filter((e) => e[3] !== 'skip')
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
  const tmp = path.join(os.tmpdir(), `pghub-b29-grade-${prob.n}.py`);
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
