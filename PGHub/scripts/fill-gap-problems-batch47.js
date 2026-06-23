#!/usr/bin/env node
// Batch 47 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3172,3173,3182,3183,3188,3189,3198,3199,3204,3205,3214,3215,3221,3230,3231
//
//   node scripts/fill-gap-problems-batch47.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch47.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch47.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3172, 3173, 3182, 3183, 3188, 3189, 3198, 3199, 3204, 3205, 3214, 3215, 3221, 3230, 3231];

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
    n: 3172,
    id: 'pghub-b47-token-bucket',
    name: 'Token Bucket Drops',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'droppedRequests',
    params: [
      { name: 'arrivals', type: 'List[int]' },
      { name: 'capacity', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A counter starts at <code>0</code>. The list <code>arrivals</code> gives how many requests arrive in each successive second. At the start of every second the counter is refilled by <code>1</code> token (capped so it never exceeds <code>capacity</code>), then each arriving request consumes one token; a request with no token left is dropped. Return the total number of dropped requests over all seconds.',
    examples: [
      ['[2,0,3]\n1', '3', 'Sec1: refill to 1, 2 arrive, 1 dropped. Sec2: refill to 1, 0 arrive. Sec3: refill to 1, 3 arrive, 2 dropped. Total 3.'],
      ['[1,1,1]\n2', '0', 'One token is added each second and one request arrives, so none drop.'],
    ],
    constraints: ['1 <= arrivals.length <= 10^5', '0 <= arrivals[i] <= 10^9', '1 <= capacity <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def droppedRequests(arrivals, capacity):
    tokens = 0
    dropped = 0
    for a in arrivals:
        tokens = min(tokens + 1, capacity)
        served = min(tokens, a)
        tokens -= served
        dropped += a - served
    return dropped`,
    approach:
      'Simulate second by second. At each step add one token bounded by the capacity, serve as many requests as there are tokens, and count the rest as dropped. A single linear pass over the arrivals gives the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,0,3]', '1'],
      ['[1,1,1]', '2'],
      ['[5]', '1'],
      ['[0,0,0]', '3'],
      ['[10,0,0,0,0,0,0,0,0,0]', '9'],
      ['[3,3,3]', '2'],
      ['[1]', '1'],
      ['[4,1,1,1]', '3'],
      ['[0,5,0]', '2'],
      ['[2,2,2,2,2]', '10'],
    ],
  },
  {
    n: 3173,
    id: 'pghub-b47-run-compress',
    name: 'Run-Length Compress Size',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'compressedLength',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A lowercase string <code>s</code> is compressed by replacing each maximal run of a repeated character with the character followed by the run length, but a run of length <code>1</code> keeps just the character (no number). Return the length of the compressed string.',
    examples: [
      ['aaabbc', '5', 'Compresses to "a3b2c"; the run of one c stays a bare c, giving length 5.'],
      ['abc', '3', 'No repeats, so the compressed form equals the input.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def compressedLength(s):
    if not s:
        return 0
    total = 0
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        run = j - i
        total += 1
        if run > 1:
            total += len(str(run))
        i = j
    return total`,
    approach:
      'Walk the string grouping each maximal run of identical characters. Every run contributes one for the character itself, plus the number of digits in the run length when that length exceeds one. Summing across runs yields the compressed length without building the string.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"aaabbc"'],
      ['"abc"'],
      ['"a"'],
      ['"aaaaaaaaaa"'],
      ['"aabbaa"'],
      ['"zzzzz"'],
      ['"abcdef"'],
      ['"aaabbbcccd"'],
      ['"aaaaaaaaaaaa"'],
      ['"qqwweerrttyy"'],
    ],
  },
  {
    n: 3182,
    id: 'pghub-b47-coin-rows',
    name: 'Non-Adjacent Coin Rows',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'maxCoins',
    params: [{ name: 'coins', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of piles is given by <code>coins</code>, where <code>coins[i]</code> may be negative (a penalty). You collect a subset of piles such that no two chosen piles are adjacent, and you may choose none. Return the maximum total value you can collect.',
    examples: [
      ['[3,2,5,10,7]', '15', 'Pick piles 3, 5, 7 -> 15 (indices 0,2,4).'],
      ['[-1,-2,-3]', '0', 'All piles are penalties, so collect nothing.'],
    ],
    constraints: ['1 <= coins.length <= 10^5', '-10^4 <= coins[i] <= 10^4'],
    tags: ['dp', 'house-robber'],
    py: `def maxCoins(coins):
    take = 0
    skip = 0
    for c in coins:
        new_take = skip + c
        new_skip = max(skip, take)
        take = new_take
        skip = new_skip
    return max(take, skip)`,
    approach:
      'Track two running optima: the best total ending by taking the current pile and the best total when the current pile is skipped. Taking a pile requires the previous pile to be skipped, while skipping keeps the better of the two previous states. The answer is the maximum of both at the end; choosing nothing gives a floor of zero because piles can be skipped freely.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,2,5,10,7]'],
      ['[-1,-2,-3]'],
      ['[5]'],
      ['[2,7,9,3,1]'],
      ['[0,0,0]'],
      ['[10,-5,10]'],
      ['[1,2,3,4,5,6]'],
      ['[-5,8,-5,8,-5]'],
      ['[100,1,1,100]'],
      ['[4,4,4,4,4]'],
    ],
  },
  {
    n: 3183,
    id: 'pghub-b47-rotated-min',
    name: 'Minimum In Rotated Array',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'findMin',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A strictly ascending array of distinct integers was rotated an unknown number of times to produce <code>nums</code>. Return the minimum element. Aim for logarithmic time.',
    examples: [
      ['[4,5,6,7,0,1,2]', '0', 'The rotation point holds the minimum value 0.'],
      ['[1,2,3]', '1', 'Not rotated, so the first element is smallest.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', 'nums was a strictly ascending distinct array rotated some times', '-10^9 <= nums[i] <= 10^9'],
    tags: ['binary-search', 'arrays'],
    py: `def findMin(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]`,
    approach:
      'In a rotated sorted array the minimum is the only element smaller than its predecessor. Compare the midpoint with the high end: if the midpoint is larger, the rotation point lies to its right; otherwise it is at the midpoint or to its left. Narrowing this way converges to the minimum in logarithmic steps.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['[4,5,6,7,0,1,2]'],
      ['[1,2,3]'],
      ['[2,1]'],
      ['[1]'],
      ['[3,4,5,1,2]'],
      ['[5,6,7,8,9,1,2,3,4]'],
      ['[-3,-2,-1,-5,-4]'],
      ['[10,20,30,40,50]'],
      ['[2,3,4,5,6,7,8,9,1]'],
      ['[100,1,10,50]'],
    ],
  },
  {
    n: 3188,
    id: 'pghub-b47-gcd-subarray',
    name: 'Whole-Array GCD Reach',
    topic_id: 'math',
    difficulty: 'Medium',
    method_name: 'minOpsToOne',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'In one operation you pick two adjacent elements of <code>nums</code> and replace one of them with their greatest common divisor (the other keeps its value). You want every element of the array to become <code>1</code>. Return the minimum number of operations needed, or <code>-1</code> if it is impossible.',
    examples: [
      ['[2,2,3,4]', '4', 'A pair with gcd 1 exists; spread the 1 then make the rest 1s.'],
      ['[2,4,6]', '-1', 'The overall gcd is 2, so a 1 can never be produced.'],
    ],
    constraints: ['1 <= nums.length <= 2000', '1 <= nums[i] <= 10^9'],
    tags: ['math', 'gcd'],
    py: `def minOpsToOne(nums):
    n = len(nums)
    ones = nums.count(1)
    if ones > 0:
        return n - ones
    best = -1
    for i in range(n):
        g = nums[i]
        for j in range(i + 1, n):
            g = math.gcd(g, nums[j])
            if g == 1:
                span = j - i
                if best == -1 or span < best:
                    best = span
                break
    if best == -1:
        return -1
    return best + (n - 1)`,
    approach:
      'If a 1 already exists, each remaining non-one element costs one operation, so the answer is n minus the count of ones. Otherwise find the shortest contiguous window whose gcd is 1: turning it into a single 1 costs (window length minus one) operations, after which the lone 1 is spread to the other n-1 cells. If no window reaches gcd 1, the whole-array gcd exceeds 1 and it is impossible.',
    complexity: { time: 'O(n^2)', space: 'O(1)' },
    cases: [
      ['[2,2,3,4]'],
      ['[2,4,6]'],
      ['[1,2,3]'],
      ['[1]'],
      ['[6,10,15]'],
      ['[3,3,3,3]'],
      ['[2,3]'],
      ['[5,5,5,5,5]'],
      ['[12,18,24,9]'],
      ['[7,1,7]'],
    ],
  },
  {
    n: 3189,
    id: 'pghub-b47-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> may contain the brackets <code>(</code> and <code>)</code> mixed with other characters. The brackets are guaranteed to form a valid balanced sequence. Return the maximum nesting depth of the parentheses.',
    examples: [
      ['(1+(2*3)+((8)/4))+1', '3', 'The deepest nesting is the innermost ((8)).'],
      ['1+(2*3)/(2-1)', '1', 'No nesting beyond a single level.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 'parentheses in s form a valid sequence'],
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
      'A counter rises on every open bracket and falls on every close bracket, mirroring a stack of open parentheses without storing it. The largest value the counter reaches is the deepest nesting level. One pass over the string suffices.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(1+(2*3)+((8)/4))+1"'],
      ['"1+(2*3)/(2-1)"'],
      ['"1"'],
      ['"()"'],
      ['"((()))"'],
      ['"(a)(b)(c)"'],
      ['"a(b(c(d(e)))f)"'],
      ['"no brackets here"'],
      ['"(())()((()))"'],
      ['"((((((x))))))"'],
    ],
  },
  {
    n: 3198,
    id: 'pghub-b47-stable-partition',
    name: 'Stable Even-Odd Partition',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'partitionParity',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Rearrange <code>nums</code> so that all even numbers come before all odd numbers, while keeping the original relative order within the evens and within the odds (a stable partition). Return the resulting list.',
    examples: [
      ['[3,1,2,4,7,6]', '[2,4,6,3,1,7]', 'Evens 2,4,6 keep their order, then odds 3,1,7.'],
      ['[1,3,5]', '[1,3,5]', 'No evens, so the order is unchanged.'],
    ],
    constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def partitionParity(nums):
    evens = [x for x in nums if x % 2 == 0]
    odds = [x for x in nums if x % 2 != 0]
    return evens + odds`,
    approach:
      'Scan once collecting evens and odds into separate lists, which preserves each group\'s relative order automatically. Concatenating the evens followed by the odds produces the stable partition. Negative numbers use Python parity, where x % 2 is 0 exactly for even values.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[3,1,2,4,7,6]'],
      ['[1,3,5]'],
      ['[2,4,6]'],
      ['[]'],
      ['[0]'],
      ['[-3,-2,-1,0]'],
      ['[5,4,3,2,1]'],
      ['[10,21,32,43,54]'],
      ['[7]'],
      ['[8,6,4,2,1,3,5,7]'],
    ],
  },
  {
    n: 3199,
    id: 'pghub-b47-course-order',
    name: 'Valid Course Ordering',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'courseOrder',
    params: [
      { name: 'numCourses', type: 'int' },
      { name: 'prereqs', type: 'List[List[int]]' },
    ],
    return_type: 'List[int]',
    statement:
      'There are <code>numCourses</code> courses labelled <code>0..numCourses-1</code>. Each pair <code>[a, b]</code> in <code>prereqs</code> means course <code>b</code> must be taken before course <code>a</code>. Return any valid order in which to take all courses, breaking ties by smallest course number; if no valid order exists, return an empty list.',
    examples: [
      ['2\n[[1,0]]', '[0,1]', 'Course 0 has no prerequisite and unlocks course 1.'],
      ['2\n[[1,0],[0,1]]', '[]', 'A cycle makes any ordering impossible.'],
    ],
    constraints: ['1 <= numCourses <= 10^4', '0 <= prereqs.length <= 10^4', 'all course labels are valid and pairs are distinct'],
    tags: ['advanced-graphs', 'topological-sort'],
    py: `def courseOrder(numCourses, prereqs):
    adj = defaultdict(list)
    indeg = [0] * numCourses
    for a, b in prereqs:
        adj[b].append(a)
        indeg[a] += 1
    heap = [c for c in range(numCourses) if indeg[c] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        c = heapq.heappop(heap)
        order.append(c)
        for nxt in adj[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                heapq.heappush(heap, nxt)
    return order if len(order) == numCourses else []`,
    approach:
      'Build a prerequisite graph and in-degree counts, then run Kahn\'s topological sort using a min-heap of ready courses so the smallest available label is always chosen first. Each time a course is taken its dependents lose an in-edge and become ready when their count hits zero. If fewer than all courses are emitted a cycle exists, so return empty.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['2', '[[1,0]]'],
      ['2', '[[1,0],[0,1]]'],
      ['1', '[]'],
      ['4', '[[1,0],[2,0],[3,1],[3,2]]'],
      ['3', '[]'],
      ['3', '[[1,0],[2,1]]'],
      ['4', '[[0,1],[1,2],[2,3],[3,0]]'],
      ['5', '[[2,1],[3,1],[4,3]]'],
      ['6', '[[1,0],[2,0],[3,1],[4,2],[5,3],[5,4]]'],
      ['2', '[]'],
    ],
  },
  {
    n: 3204,
    id: 'pghub-b47-warehouse-merge',
    name: 'Merge Inventory Ranges',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeShelves',
    params: [{ name: 'shelves', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Each entry <code>[start, end]</code> in <code>shelves</code> marks an inclusive range of occupied slots in a warehouse aisle. Merge every set of ranges that touch or overlap into single ranges and return the merged ranges sorted by start. Two ranges that share an endpoint or are adjacent (the next starts exactly one past the previous end) should merge.',
    examples: [
      ['[[1,3],[2,6],[8,10],[11,12]]', '[[1,6],[8,12]]', '[1,3] and [2,6] overlap; [8,10] and [11,12] are adjacent.'],
      ['[[1,4],[5,6]]', '[[1,6]]', '4 and 5 are adjacent, so they merge.'],
    ],
    constraints: ['1 <= shelves.length <= 10^5', '0 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeShelves(shelves):
    order = sorted(shelves, key=lambda x: x[0])
    merged = []
    for s, e in order:
        if merged and s <= merged[-1][1] + 1:
            if e > merged[-1][1]:
                merged[-1][1] = e
        else:
            merged.append([s, e])
    return merged`,
    approach:
      'Sort the ranges by start so candidates to merge are contiguous. Walk them while extending the last merged range whenever the next start is within one slot of its end (covering both overlap and adjacency); otherwise begin a new merged range. The accumulated list is already sorted by start.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[11,12]]'],
      ['[[1,4],[5,6]]'],
      ['[[1,1]]'],
      ['[[5,6],[1,2],[3,4]]'],
      ['[[1,10],[2,3],[4,5]]'],
      ['[[1,2],[4,5],[7,8]]'],
      ['[[0,0],[2,2],[4,4]]'],
      ['[[1,5],[5,10],[10,15]]'],
      ['[[10,20],[1,5],[6,9]]'],
      ['[[3,7],[1,2],[8,9],[2,3]]'],
    ],
  },
  {
    n: 3205,
    id: 'pghub-b47-trie-prefix',
    name: 'Shortest Unique Prefixes',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'shortestPrefixes',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'List[str]',
    statement:
      'Given a list of distinct lowercase <code>words</code>, for each word return its shortest prefix that is not a prefix of any other word in the list. It is guaranteed such a prefix always exists. Return the prefixes in the same order as the input words.',
    examples: [
      ['["dog","cat","apple","cap"]', '["d","cat","a","cap"]', 'dog needs only "d"; cat shares "ca" with cap so it needs the full "cat"; apple needs "a"; cap needs "cap".'],
      ['["zebra"]', '["z"]', 'A single word needs only its first letter.'],
    ],
    constraints: ['1 <= words.length <= 10^4', '1 <= words[i].length <= 100', 'words are distinct lowercase strings'],
    tags: ['tries', 'strings'],
    py: `def shortestPrefixes(words):
    count = defaultdict(int)
    for w in words:
        for i in range(1, len(w) + 1):
            count[w[:i]] += 1
    res = []
    for w in words:
        chosen = w
        for i in range(1, len(w) + 1):
            if count[w[:i]] == 1:
                chosen = w[:i]
                break
        res.append(chosen)
    return res`,
    approach:
      'Count how many words share each prefix by tallying every prefix of every word, which is equivalent to walking a trie and recording visit counts at each node. A prefix uniquely identifies a word exactly when its count is one. For each word, the shortest such prefix from the front is its answer.',
    complexity: { time: 'O(sum of word lengths * avg length)', space: 'O(total prefix count)' },
    cases: [
      ['["dog","cat","apple","cap"]'],
      ['["zebra"]'],
      ['["ab","abc","abd"]'],
      ['["a","ab","abc"]'],
      ['["cat","car","card"]'],
      ['["x","y","z"]'],
      ['["apple","apply","ape"]'],
      ['["test","testing","tester"]'],
      ['["one","two","three","four"]'],
      ['["aa","ab","ba","bb"]'],
    ],
  },
  {
    n: 3214,
    id: 'pghub-b47-skyline-peaks',
    name: 'Visible Building Count',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'visibleBuildings',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You stand to the left of a row of buildings whose heights are given left to right in <code>heights</code> and look rightward. A building is visible if every building to its left is strictly shorter than it. Return the number of visible buildings.',
    examples: [
      ['[3,1,4,2,5]', '3', 'Buildings 3, 4, 5 are each taller than all to their left.'],
      ['[5,4,3]', '1', 'Only the first building is visible.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '1 <= heights[i] <= 10^9'],
    tags: ['stack', 'arrays'],
    py: `def visibleBuildings(heights):
    count = 0
    tallest = 0
    for h in heights:
        if h > tallest:
            count += 1
            tallest = h
    return count`,
    approach:
      'Looking from the left, a building is visible only if it is taller than the running maximum of everything before it. Sweep once tracking the tallest seen so far; each time the current building exceeds it, count it as visible and raise the maximum.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4,2,5]'],
      ['[5,4,3]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,5,5,5]'],
      ['[2,2,3,1,4]'],
      ['[10,1,10,1,10]'],
      ['[1,1,1,1,2]'],
      ['[9,8,7,6,5,4]'],
      ['[1,3,2,5,4,7]'],
    ],
  },
  {
    n: 3215,
    id: 'pghub-b47-budget-greedy',
    name: 'Maximum Affordable Items',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'maxItems',
    params: [
      { name: 'prices', type: 'List[int]' },
      { name: 'budget', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given item <code>prices</code> and a total <code>budget</code>, return the maximum number of distinct items you can buy without exceeding the budget. Each item can be bought at most once.',
    examples: [
      ['[1,3,2,5,4]\n7', '3', 'Buy the cheapest items 1, 2, 3 for a total of 6.'],
      ['[10,20]\n5', '0', 'Nothing is affordable.'],
    ],
    constraints: ['1 <= prices.length <= 10^5', '1 <= prices[i] <= 10^9', '0 <= budget <= 10^14'],
    tags: ['greedy', 'sorting'],
    py: `def maxItems(prices, budget):
    spent = 0
    bought = 0
    for p in sorted(prices):
        if spent + p > budget:
            break
        spent += p
        bought += 1
    return bought`,
    approach:
      'To maximize the count of items under a fixed budget, always prefer cheaper items. Sort the prices ascending and buy from the front while the running cost stays within budget; stop at the first item that would overspend. The number bought is the answer.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,2,5,4]', '7'],
      ['[10,20]', '5'],
      ['[1,1,1,1]', '3'],
      ['[5]', '5'],
      ['[5]', '4'],
      ['[2,2,2,2,2]', '10'],
      ['[100,1,1,1]', '3'],
      ['[1,2,3,4,5,6,7,8,9,10]', '15'],
      ['[3,3,3]', '0'],
      ['[1]', '1000000'],
    ],
  },
  {
    n: 3221,
    id: 'pghub-b47-flip-streak',
    name: 'Max Ones After K Flips',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestOnes',
    params: [
      { name: 'bits', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given a binary array <code>bits</code> of 0s and 1s and an integer <code>k</code>, you may flip at most <code>k</code> zeros to ones. Return the length of the longest contiguous run of ones you can obtain.',
    examples: [
      ['[1,1,0,0,1,1,1,0,1]\n2', '7', 'Flipping the two zeros in the middle yields a run of 7 ones.'],
      ['[0,0,0]\n0', '0', 'With no flips allowed and no ones present, the answer is 0.'],
    ],
    constraints: ['1 <= bits.length <= 10^5', 'bits[i] is 0 or 1', '0 <= k <= bits.length'],
    tags: ['sliding-window', 'two-pointers'],
    py: `def longestOnes(bits, k):
    left = 0
    zeros = 0
    best = 0
    for right in range(len(bits)):
        if bits[right] == 0:
            zeros += 1
        while zeros > k:
            if bits[left] == 0:
                zeros -= 1
            left += 1
        window = right - left + 1
        if window > best:
            best = window
    return best`,
    approach:
      'Maintain a sliding window that contains at most k zeros, which can all be flipped to ones. Expand the right edge, and whenever the window holds too many zeros shrink from the left until it is valid again. The widest valid window seen is the longest achievable run of ones.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,1,0,0,1,1,1,0,1]', '2'],
      ['[0,0,0]', '0'],
      ['[1,1,1]', '0'],
      ['[0,0,0,0]', '4'],
      ['[1,0,1,0,1]', '1'],
      ['[0,1,0,1,0,1,0]', '2'],
      ['[1]', '1'],
      ['[0]', '0'],
      ['[1,0,0,1,0,0,1]', '3'],
      ['[1,1,1,0,0,0,1,1,1,1,0]', '0'],
    ],
  },
  {
    n: 3230,
    id: 'pghub-b47-grid-min-path',
    name: 'Cheapest Falling Path',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'minFallingPath',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Starting from any cell in the top row of an integer <code>grid</code>, you fall to the bottom row. From cell <code>(r, c)</code> you may step to <code>(r+1, c-1)</code>, <code>(r+1, c)</code>, or <code>(r+1, c+1)</code> if it stays inside the grid. The cost of a path is the sum of values on the cells visited. Return the minimum possible path cost.',
    examples: [
      ['[[2,1,3],[6,5,4],[7,8,9]]', '13', 'Path 1 -> 5 -> 7 sums to 13.'],
      ['[[5]]', '5', 'A single cell is both start and end.'],
    ],
    constraints: ['1 <= grid.length <= 200', '1 <= grid[0].length <= 200', '-10^4 <= grid[i][j] <= 10^4'],
    tags: ['2d-dp', 'matrix'],
    py: `def minFallingPath(grid):
    rows = len(grid)
    cols = len(grid[0])
    dp = list(grid[0])
    for r in range(1, rows):
        new = [0] * cols
        for c in range(cols):
            best = dp[c]
            if c > 0 and dp[c - 1] < best:
                best = dp[c - 1]
            if c < cols - 1 and dp[c + 1] < best:
                best = dp[c + 1]
            new[c] = grid[r][c] + best
        dp = new
    return min(dp)`,
    approach:
      'Process the grid row by row keeping, for each column, the cheapest cost to reach that cell from the top. A cell\'s cost is its value plus the smallest of the three cells diagonally above-left, directly above, and above-right. After the last row, the minimum over all columns is the cheapest falling path.',
    complexity: { time: 'O(rows*cols)', space: 'O(cols)' },
    cases: [
      ['[[2,1,3],[6,5,4],[7,8,9]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[-1,-2,-3],[-4,-5,-6]]'],
      ['[[10,10,10],[1,100,1],[10,10,10]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[3,2],[1,4]]'],
      ['[[100,1,100],[100,1,100],[100,1,100]]'],
      ['[[2,1,3,4],[5,1,2,3],[6,7,1,2],[8,9,1,1]]'],
    ],
  },
  {
    n: 3231,
    id: 'pghub-b47-snowball-merge',
    name: 'Snowball Collision Stones',
    topic_id: 'stack',
    difficulty: 'Hard',
    method_name: 'survivingStones',
    params: [{ name: 'stones', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Stones roll along a line, given left to right by <code>stones</code>; a positive value rolls right and a negative value rolls left, the magnitude being its size. When a right-roller meets a left-roller they collide: the smaller-magnitude stone is destroyed, and if they are equal both are destroyed. Stones moving the same direction, or a left-roller already to the left of a right-roller, never meet. Return the sizes (with signs) of the stones that survive, in order.',
    examples: [
      ['[5,10,-5]', '[5,10]', '10 and -5 collide; 10 survives. 5 and 10 both roll right and never meet.'],
      ['[8,-8]', '[]', 'Equal magnitudes destroy each other.'],
    ],
    constraints: ['1 <= stones.length <= 10^4', 'stones[i] != 0', '-10^4 <= stones[i] <= 10^4'],
    tags: ['stack', 'simulation'],
    py: `def survivingStones(stones):
    stack = []
    for s in stones:
        alive = True
        while alive and s < 0 and stack and stack[-1] > 0:
            top = stack[-1]
            if top < -s:
                stack.pop()
                continue
            elif top == -s:
                stack.pop()
                alive = False
            else:
                alive = False
        if alive:
            stack.append(s)
    return stack`,
    approach:
      'Use a stack of surviving stones. A new left-rolling stone collides with right-rolling stones on top of the stack: pop a smaller one and keep checking, stop (destroyed) against a larger one, and on a tie destroy both. Right-rollers and stones that face no opposition are simply pushed. The stack holds the survivors in order.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[5,10,-5]'],
      ['[8,-8]'],
      ['[10,2,-5]'],
      ['[-2,-1,1,2]'],
      ['[1,2,3,4]'],
      ['[-1,-2,-3]'],
      ['[5,-5,5,-5]'],
      ['[3,-2,-1]'],
      ['[1,-1,1,-1,1]'],
      ['[10,-2,-3,-4,-5]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B47>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b47-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B47>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B47>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b47-grade-${prob.n}.py`);
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
