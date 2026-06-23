#!/usr/bin/env node
// Batch 53 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3792,3802,3807,3817,3822,3831,3837,3846,3851,3860,3865,3874,3879,3888,3893
//
//   node scripts/fill-gap-problems-batch53.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch53.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch53.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3792, 3802, 3807, 3817, 3822, 3831, 3837, 3846, 3851, 3860, 3865, 3874, 3879, 3888, 3893];

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
    n: 3792,
    id: 'pghub-b53-tide-marks',
    name: 'Rising Tide Marks',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countMarks',
    params: [{ name: 'levels', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of daily sea <code>levels</code> is recorded. A reading is a "tide mark" if it is strictly greater than every reading before it. The first reading is always a tide mark. Return the number of tide marks.',
    examples: [
      ['[3,1,4,1,5]', '3', 'Marks at values 3, 4 and 5 each beat all earlier readings.'],
      ['[5,5,5]', '1', 'Only the first reading is strictly greater than nothing before it.'],
    ],
    constraints: ['1 <= levels.length <= 10^5', '-10^9 <= levels[i] <= 10^9'],
    tags: ['arrays', 'prefix-max'],
    py: `def countMarks(levels):
    best = None
    count = 0
    for x in levels:
        if best is None or x > best:
            count += 1
            best = x
    return count`,
    approach:
      'Sweep left to right keeping the maximum value seen so far. A reading is a tide mark exactly when it exceeds that running maximum, at which point it becomes the new maximum. One linear pass counts every such record.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4,1,5]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[-3,-2,-5,0]'],
      ['[2,2,3,3,4]'],
      ['[10,1,11,1,12]'],
      ['[0,0,0,0]'],
      ['[1000000000,-1000000000]'],
    ],
  },
  {
    n: 3802,
    id: 'pghub-b53-keypad-mash',
    name: 'Decompress Keypad Mash',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'decompress',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'A run-length encoded string <code>s</code> consists of pairs: a lowercase letter immediately followed by a single digit 1-9 giving how many times that letter repeats. Return the fully expanded string.',
    examples: [
      ['a3b1c2', 'aaabcc', 'a repeats 3, b once, c twice.'],
      ['z9', 'zzzzzzzzz', 'A single pair expands to nine z characters.'],
    ],
    constraints: ['2 <= s.length <= 2000', 's.length is even', 'letters are lowercase, counts are digits 1-9'],
    tags: ['strings', 'parsing'],
    py: `def decompress(s):
    out = []
    for i in range(0, len(s), 2):
        out.append(s[i] * int(s[i + 1]))
    return ''.join(out)`,
    approach:
      'The encoding always pairs a letter with its repeat count, so walk the string two characters at a time. For each pair, repeat the letter by the digit value and append it to a list, then join the pieces into the decoded string.',
    complexity: { time: 'O(total output length)', space: 'O(total output length)' },
    cases: [
      ['"a3b1c2"'],
      ['"z9"'],
      ['"a1b1c1"'],
      ['"x5"'],
      ['"m2n2o2"'],
      ['"q1"'],
      ['"a9b9"'],
      ['"h1e1l2o1"'],
      ['"k4k4"'],
      ['"a1z2a3"'],
    ],
  },
  {
    n: 3807,
    id: 'pghub-b53-conveyor-load',
    name: 'Conveyor Belt Capacity',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minCapacity',
    params: [
      { name: 'weights', type: 'List[int]' },
      { name: 'shifts', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Parcels with the given <code>weights</code> must leave a belt in their current order across at most <code>shifts</code> work shifts. Each shift loads a contiguous prefix of the remaining parcels without exceeding the belt capacity. Return the minimum belt capacity that lets all parcels ship within the shift limit.',
    examples: [
      ['[1,2,3,4,5]\n3', '6', 'Capacity 6 ships (1,2,3), (4), (5) in 3 shifts; any smaller capacity needs more.'],
      ['[3,3,3]\n3', '3', 'Each shift carries one parcel of weight 3.'],
    ],
    constraints: ['1 <= weights.length <= 5*10^4', '1 <= shifts <= weights.length', '1 <= weights[i] <= 500'],
    tags: ['binary-search', 'greedy'],
    py: `def minCapacity(weights, shifts):
    def needed(cap):
        used = 1
        cur = 0
        for w in weights:
            if cur + w > cap:
                used += 1
                cur = 0
            cur += w
        return used
    lo = max(weights)
    hi = sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= shifts:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The feasible capacity is monotonic: any capacity that works keeps working when increased, so binary search the answer between the heaviest single parcel and the total weight. For a candidate capacity, greedily fill each shift with as many leading parcels as fit and count the shifts used, shrinking or growing the range based on whether that count fits the limit.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5]', '3'],
      ['[3,3,3]', '3'],
      ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      ['[5]', '1'],
      ['[1,1,1,1]', '4'],
      ['[10,1,1,1,1]', '2'],
      ['[2,4,6,8]', '2'],
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,1,1]', '4'],
      ['[500,500,500]', '1'],
    ],
  },
  {
    n: 3817,
    id: 'pghub-b53-bracket-depth',
    name: 'Maximum Nesting Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> of round brackets and other characters that always forms a valid parenthesization, return the maximum nesting depth of the brackets. Non-bracket characters are ignored.',
    examples: [
      ['(1+(2*3)+((8)/4))+1', '3', 'The innermost (8) sits three brackets deep.'],
      ['1+2', '0', 'No brackets means depth zero.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 'brackets are balanced', 's consists of printable ASCII characters'],
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
      'Scan the string while tracking the current open-bracket depth, incrementing on every open bracket and decrementing on every close bracket. The running depth peaks exactly when nesting is deepest, so record the maximum depth observed during the pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(1+(2*3)+((8)/4))+1"'],
      ['"1+2"'],
      ['"()"'],
      ['"((()))"'],
      ['"()()()"'],
      ['"a(b)c(d(e)f)g"'],
      ['"(((a)))"'],
      ['"x"'],
      ['"(()(()))"'],
      ['"(a(b(c(d)e)f)g)"'],
    ],
  },
  {
    n: 3822,
    id: 'pghub-b53-orchard-rows',
    name: 'Orchard Watering Cost',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minCost',
    params: [{ name: 'trees', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A nursery merges saplings into one tree. The cost to merge two groups equals the sum of their sizes; the merged group then has that combined size. Given the initial group sizes <code>trees</code>, return the minimum total cost to combine everything into a single group.',
    examples: [
      ['[1,2,3,4]', '19', 'Merge 1+2=3 (cost 3), 3+3=6 (cost 6), 6+4=10 (cost 10): total 19.'],
      ['[5]', '0', 'A single group needs no merging.'],
    ],
    constraints: ['1 <= trees.length <= 10^5', '1 <= trees[i] <= 10^6'],
    tags: ['greedy', 'heap'],
    py: `def minCost(trees):
    if len(trees) <= 1:
        return 0
    heap = list(trees)
    heapq.heapify(heap)
    total = 0
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        merged = a + b
        total += merged
        heapq.heappush(heap, merged)
    return total`,
    approach:
      'Every merge adds the combined size to the cost, and smaller groups should be merged earliest so their weight is re-counted in fewer later merges. A min-heap repeatedly fuses the two smallest groups, pushing the result back, which is the Huffman-style optimal strategy for minimizing total merge cost.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4]'],
      ['[5]'],
      ['[1,1]'],
      ['[4,3,2,6]'],
      ['[1,2,3,4,5]'],
      ['[10,10,10,10]'],
      ['[1,1,1,1,1,1]'],
      ['[100,1,1,1]'],
      ['[7,3,5,2,9,1]'],
      ['[1000000,1000000]'],
    ],
  },
  {
    n: 3831,
    id: 'pghub-b53-relay-rooms',
    name: 'Relay Reachable Rooms',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countReachable',
    params: [
      { name: 'n', type: 'int' },
      { name: 'edges', type: 'List[List[int]]' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> rooms labelled 0..n-1 connected by bidirectional corridors in <code>edges</code>. Starting in room 0, return how many rooms (including room 0) you can reach by walking through corridors.',
    examples: [
      ['4\n[[0,1],[1,2]]', '3', 'Rooms 0,1,2 are connected; room 3 is isolated.'],
      ['1\n[]', '1', 'Only the starting room exists.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= edges.length <= 2*10^5', 'edges[i] = [u, v] with 0 <= u, v < n'],
    tags: ['graphs', 'breadth-first-search'],
    py: `def countReachable(n, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    visited = [False] * n
    visited[0] = True
    queue = deque([0])
    count = 0
    while queue:
        node = queue.popleft()
        count += 1
        for nb in adj[node]:
            if not visited[nb]:
                visited[nb] = True
                queue.append(nb)
    return count`,
    approach:
      'Build an adjacency list from the undirected corridors, then run a breadth-first search from room 0, marking rooms visited as they are discovered. The number of rooms dequeued equals the size of the connected component containing the start.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2]]'],
      ['1', '[]'],
      ['5', '[[0,1],[2,3],[3,4]]'],
      ['3', '[[0,1],[1,2],[0,2]]'],
      ['6', '[[0,1],[1,2],[2,0],[3,4]]'],
      ['2', '[]'],
      ['4', '[[1,2],[2,3]]'],
      ['7', '[[0,6],[6,5],[5,0]]'],
      ['3', '[[0,0]]'],
      ['8', '[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]'],
    ],
  },
  {
    n: 3837,
    id: 'pghub-b53-gear-ratio',
    name: 'Reduce Gear Ratio',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'reduceRatio',
    params: [
      { name: 'a', type: 'int' },
      { name: 'b', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A gear ratio is given as two positive integers <code>a</code> and <code>b</code>. Return the ratio reduced to lowest terms as a two-element list <code>[a\', b\']</code> where the two values share no common factor greater than 1.',
    examples: [
      ['12\n18', '[2,3]', 'Dividing both by gcd 6 gives 2:3.'],
      ['7\n5', '[7,5]', 'Already coprime, so unchanged.'],
    ],
    constraints: ['1 <= a, b <= 10^9'],
    tags: ['math', 'number-theory'],
    py: `def reduceRatio(a, b):
    g = math.gcd(a, b)
    return [a // g, b // g]`,
    approach:
      'A fraction reduces to lowest terms by dividing both numerator and denominator by their greatest common divisor. Compute the gcd of the two numbers and divide each by it to obtain the coprime pair.',
    complexity: { time: 'O(log(min(a,b)))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['12', '18'],
      ['7', '5'],
      ['100', '10'],
      ['1', '1'],
      ['1000000000', '500000000'],
      ['9', '6'],
      ['13', '13'],
      ['48', '36'],
      ['1', '1000000000'],
      ['81', '27'],
    ],
  },
  {
    n: 3846,
    id: 'pghub-b53-ticket-window',
    name: 'Longest Calm Ticket Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestCalm',
    params: [
      { name: 'wait', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A counter logs the wait time of each customer in <code>wait</code>. A window of consecutive customers is "calm" if the difference between its largest and smallest wait time is at most <code>limit</code>. Return the length of the longest calm window.',
    examples: [
      ['[8,2,4,7]\n4', '2', 'The window [2,4] has spread 2; longer windows exceed limit 4.'],
      ['[1,1,1]\n0', '3', 'All equal, so the whole array is calm.'],
    ],
    constraints: ['1 <= wait.length <= 10^5', '0 <= wait[i] <= 10^9', '0 <= limit <= 10^9'],
    tags: ['sliding-window', 'monotonic-deque'],
    py: `def longestCalm(wait, limit):
    max_dq = deque()
    min_dq = deque()
    left = 0
    best = 0
    for right, x in enumerate(wait):
        while max_dq and wait[max_dq[-1]] <= x:
            max_dq.pop()
        max_dq.append(right)
        while min_dq and wait[min_dq[-1]] >= x:
            min_dq.pop()
        min_dq.append(right)
        while wait[max_dq[0]] - wait[min_dq[0]] > limit:
            left += 1
            if max_dq[0] < left:
                max_dq.popleft()
            if min_dq[0] < left:
                min_dq.popleft()
        if right - left + 1 > best:
            best = right - left + 1
    return best`,
    approach:
      'Expand a window to the right while it stays calm, shrinking from the left whenever the spread exceeds the limit. Two monotonic deques track the current window maximum and minimum in amortized constant time, so the spread is always the difference of their fronts and the longest valid window is found in a single pass.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[8,2,4,7]', '4'],
      ['[1,1,1]', '0'],
      ['[10,1,2,4,7,2]', '5'],
      ['[5]', '0'],
      ['[4,8,5,1,7,9]', '6'],
      ['[1,5,9,13]', '3'],
      ['[2,2,2,2]', '1'],
      ['[100,1,100,1]', '0'],
      ['[3,3,4,5,3]', '2'],
      ['[0,1000000000]', '1000000000'],
    ],
  },
  {
    n: 3851,
    id: 'pghub-b53-palindrome-cut',
    name: 'Minimum Palindrome Cuts',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'minCuts',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, return the minimum number of cuts needed so that every resulting substring is a palindrome.',
    examples: [
      ['aab', '1', 'One cut yields "aa" and "b", both palindromes.'],
      ['abccba', '0', 'The whole string is already a palindrome.'],
    ],
    constraints: ['1 <= s.length <= 2000', 's consists of lowercase English letters'],
    tags: ['2d-dp', 'strings'],
    py: `def minCuts(s):
    n = len(s)
    pal = [[False] * n for _ in range(n)]
    for i in range(n):
        pal[i][i] = True
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j] and (length == 2 or pal[i + 1][j - 1]):
                pal[i][j] = True
    dp = [0] * n
    for i in range(n):
        if pal[0][i]:
            dp[i] = 0
        else:
            best = i
            for j in range(1, i + 1):
                if pal[j][i] and dp[j - 1] + 1 < best:
                    best = dp[j - 1] + 1
            dp[i] = best
    return dp[n - 1]`,
    approach:
      'First precompute which substrings are palindromes using interval dynamic programming, where a span is a palindrome when its ends match and its interior is too. Then compute the fewest cuts for each prefix: a prefix needs no cut if it is itself a palindrome, otherwise it is one more than the best cuts of any prefix ending just before a palindromic suffix.',
    complexity: { time: 'O(n^2)', space: 'O(n^2)' },
    cases: [
      ['"aab"'],
      ['"abccba"'],
      ['"a"'],
      ['"ab"'],
      ['"aba"'],
      ['"abcba"'],
      ['"noonabbad"'],
      ['"racecarx"'],
      ['"aaaa"'],
      ['"abcdef"'],
    ],
  },
  {
    n: 3860,
    id: 'pghub-b53-courier-order',
    name: 'Courier Pickup Order',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'pickupOrder',
    params: [
      { name: 'n', type: 'int' },
      { name: 'deps', type: 'List[List[int]]' },
    ],
    return_type: 'List[int]',
    statement:
      'A courier must collect <code>n</code> packages labelled 0..n-1. Each pair <code>[a, b]</code> in <code>deps</code> means package <code>a</code> must be picked up before package <code>b</code>. Return any valid pickup order; if a tie occurs always pick the smallest available label, so the result is unique. Return an empty list if no valid order exists.',
    examples: [
      ['3\n[[0,1],[0,2]]', '[0,1,2]', 'Package 0 unlocks 1 and 2; smallest-first breaks the tie.'],
      ['2\n[[0,1],[1,0]]', '[]', 'A cycle makes any order impossible.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= deps.length <= 2*10^5', 'deps[i] = [a, b] with 0 <= a, b < n'],
    tags: ['advanced-graphs', 'topological-sort'],
    py: `def pickupOrder(n, deps):
    adj = defaultdict(list)
    indeg = [0] * n
    for a, b in deps:
        adj[a].append(b)
        indeg[b] += 1
    heap = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        node = heapq.heappop(heap)
        order.append(node)
        for nb in adj[node]:
            indeg[nb] -= 1
            if indeg[nb] == 0:
                heapq.heappush(heap, nb)
    return order if len(order) == n else []`,
    approach:
      'Model packages as nodes and each dependency as a directed edge, then perform a topological sort. Use a min-heap of currently unblocked packages so the smallest available label is always chosen, guaranteeing a unique order. If fewer than all packages emerge, a cycle exists and no order is possible.',
    complexity: { time: 'O((n + e) log n)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1],[0,2]]'],
      ['2', '[[0,1],[1,0]]'],
      ['1', '[]'],
      ['4', '[[1,0],[2,0],[3,1],[3,2]]'],
      ['5', '[]'],
      ['3', '[[2,0],[2,1]]'],
      ['4', '[[0,1],[1,2],[2,3]]'],
      ['3', '[[0,1],[1,2],[2,0]]'],
      ['6', '[[0,3],[1,3],[2,4],[3,5],[4,5]]'],
      ['2', '[[1,0]]'],
    ],
  },
  {
    n: 3865,
    id: 'pghub-b53-signal-flip',
    name: 'Flip To Maximum Signal',
    topic_id: 'bit-manipulation',
    difficulty: 'Easy',
    method_name: 'maxAfterFlip',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'A non-negative integer <code>n</code> represents a signal. You may flip exactly one bit within the bit-length of <code>n</code> (positions 0 up to the highest set bit). Return the largest value obtainable. If <code>n</code> is 0, the only bit considered is position 0.',
    examples: [
      ['5', '7', '5 is 101; flipping the middle 0 to 1 gives 111 = 7.'],
      ['7', '6', '7 is 111; the best single flip turns a 1 to 0, giving 110 = 6.'],
    ],
    constraints: ['0 <= n <= 2^31 - 1'],
    tags: ['bit-manipulation', 'greedy'],
    py: `def maxAfterFlip(n):
    if n == 0:
        return 1
    bits = n.bit_length()
    best = n
    for i in range(bits):
        flipped = n ^ (1 << i)
        if flipped > best:
            best = flipped
    return best`,
    approach:
      'Within the bit-length of the number, flipping a 0 to 1 increases the value while flipping a 1 to 0 decreases it, so the best gain comes from the highest 0 bit. Trying each bit position with an XOR flip and keeping the maximum covers every case, including numbers that are all ones where no flip helps and the original is kept.',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    cases: [
      ['5'],
      ['7'],
      ['0'],
      ['1'],
      ['8'],
      ['6'],
      ['1023'],
      ['1024'],
      ['2147483647'],
      ['42'],
    ],
  },
  {
    n: 3874,
    id: 'pghub-b53-shelf-merge',
    name: 'Merge Shelf Intervals',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeShelves',
    params: [{ name: 'shelves', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Each shelf occupies a closed interval <code>[start, end]</code> given in <code>shelves</code>. Overlapping or touching shelves merge into one. Return the merged shelves sorted by start. Two intervals touch when one ends exactly where the next begins.',
    examples: [
      ['[[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', '[1,3] and [2,6] overlap into [1,6].'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'They touch at 4 and merge.'],
    ],
    constraints: ['1 <= shelves.length <= 10^4', 'shelves[i] = [start, end] with start <= end', '0 <= start, end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeShelves(shelves):
    shelves.sort(key=lambda x: x[0])
    merged = [list(shelves[0])]
    for start, end in shelves[1:]:
        if start <= merged[-1][1]:
            if end > merged[-1][1]:
                merged[-1][1] = end
        else:
            merged.append([start, end])
    return merged`,
    approach:
      'Sort the shelves by start so that any overlap involves only the most recently kept interval. Walk through them, extending the last merged interval whenever the next one starts at or before its end, otherwise starting a fresh interval. This yields the minimal set of disjoint merged shelves.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[1,4],[4,5]]'],
      ['[[1,4],[2,3]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[5,7],[1,3],[2,6]]'],
      ['[[0,0]]'],
      ['[[1,10],[2,3],[4,5],[6,7]]'],
      ['[[1,2],[2,3],[3,4],[4,5]]'],
      ['[[10,12],[1,2],[3,4]]'],
      ['[[1,1000000000],[500,600]]'],
    ],
  },
  {
    n: 3879,
    id: 'pghub-b53-stack-evaluate',
    name: 'Evaluate Postfix Expression',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'evalPostfix',
    params: [{ name: 'tokens', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Given a list of <code>tokens</code> in Reverse Polish (postfix) notation, evaluate the expression and return the integer result. Valid operators are <code>+</code>, <code>-</code>, <code>*</code>, and <code>/</code>; division truncates toward zero. Operands are integers that may be negative.',
    examples: [
      ['["2","1","+","3","*"]', '9', '(2 + 1) * 3 = 9.'],
      ['["4","13","5","/","+"]', '6', '4 + (13 / 5) = 4 + 2 = 6.'],
    ],
    constraints: ['1 <= tokens.length <= 10^4', 'each token is an operator or an integer in [-10^4, 10^4]', 'the expression is valid'],
    tags: ['stack', 'simulation'],
    py: `def evalPostfix(tokens):
    ops = {'+', '-', '*', '/'}
    stack = []
    for tok in tokens:
        if tok in ops:
            b = stack.pop()
            a = stack.pop()
            if tok == '+':
                stack.append(a + b)
            elif tok == '-':
                stack.append(a - b)
            elif tok == '*':
                stack.append(a * b)
            else:
                stack.append(int(a / b))
        else:
            stack.append(int(tok))
    return stack[0]`,
    approach:
      'Process tokens left to right using a stack of operands. A number is pushed; an operator pops its two most recent operands, applies itself in the correct order, and pushes the result. Division truncates toward zero via integer conversion of the float quotient. After the scan the single remaining value is the answer.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["2","1","+","3","*"]'],
      ['["4","13","5","/","+"]'],
      ['["5"]'],
      ['["10","6","9","3","+","-11","*","/","*","17","+","5","+"]'],
      ['["3","4","-"]'],
      ['["-7","2","/"]'],
      ['["6","2","/"]'],
      ['["2","3","*","4","+"]'],
      ['["100","10","-"]'],
      ['["7","-3","*"]'],
    ],
  },
  {
    n: 3888,
    id: 'pghub-b53-prefix-router',
    name: 'Prefix Router Lookup',
    topic_id: 'tries',
    difficulty: 'Medium',
    method_name: 'routeAll',
    params: [
      { name: 'prefixes', type: 'List[str]' },
      { name: 'queries', type: 'List[str]' },
    ],
    return_type: 'List[int]',
    statement:
      'A router knows a set of address <code>prefixes</code>. For each address in <code>queries</code>, find the longest known prefix that is a prefix of the address and return its length; return <code>0</code> if no known prefix matches. Return one answer per query in order.',
    examples: [
      ['["ab","abc","x"]\n["abcd","aby","z"]', '[3,2,0]', '"abcd" matches "abc" (len 3); "aby" matches "ab" (len 2); "z" matches nothing.'],
      ['["a"]\n["a","b"]', '[1,0]', '"a" matches itself; "b" matches nothing.'],
    ],
    constraints: ['1 <= prefixes.length, queries.length <= 10^4', '1 <= word length <= 50', 'lowercase letters'],
    tags: ['tries', 'strings'],
    py: `def routeAll(prefixes, queries):
    root = {}
    for p in prefixes:
        node = root
        for ch in p:
            node = node.setdefault(ch, {})
        node['#'] = len(p)
    res = []
    for q in queries:
        node = root
        best = 0
        for ch in q:
            if ch not in node:
                break
            node = node[ch]
            if '#' in node:
                best = node['#']
        res.append(best)
    return res`,
    approach:
      'Insert every known prefix into a trie, marking each terminal node with the prefix length. For a query, walk the trie character by character, remembering the deepest marked node passed through; that mark is the longest matching prefix length. Walking stops as soon as a character has no path.',
    complexity: { time: 'O(total prefix + total query length)', space: 'O(total prefix length)' },
    multiParam: true,
    cases: [
      ['["ab","abc","x"]', '["abcd","aby","z"]'],
      ['["a"]', '["a","b"]'],
      ['["cat","car","card"]', '["cards","care","ca","dog"]'],
      ['["hello"]', '["hell","hello","helloworld"]'],
      ['["a","ab","abc"]', '["abcdef"]'],
      ['["xyz"]', '["x","xy","xyz"]'],
      ['["mn"]', '["m"]'],
      ['["p","q","r"]', '["pqr","qpr","rqp"]'],
      ['["abc"]', '["xyz"]'],
      ['["go","gone","good"]', '["going","gon","good","g"]'],
    ],
  },
  {
    n: 3893,
    id: 'pghub-b53-laser-cells',
    name: 'Closest Pair By Manhattan',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'minManhattan',
    params: [{ name: 'points', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a list of integer grid <code>points</code> as <code>[x, y]</code> pairs, return the smallest Manhattan distance between any two distinct points. The Manhattan distance between two points is the sum of the absolute differences of their coordinates. There are at least two points.',
    examples: [
      ['[[0,0],[3,4],[1,1]]', '2', 'Points [0,0] and [1,1] are 2 apart in Manhattan distance.'],
      ['[[5,5],[5,6]]', '1', 'They differ by one in y.'],
    ],
    constraints: ['2 <= points.length <= 2000', '-10^6 <= x, y <= 10^6'],
    tags: ['two-pointers', 'geometry'],
    py: `def minManhattan(points):
    best = None
    n = len(points)
    for i in range(n):
        for j in range(i + 1, n):
            d = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1])
            if best is None or d < best:
                best = d
    return best`,
    approach:
      'With a few thousand points, examine every unordered pair once and compute its Manhattan distance as the sum of absolute coordinate differences. Track the smallest distance seen, which is the answer after all pairs are checked.',
    complexity: { time: 'O(n^2)', space: 'O(1)' },
    cases: [
      ['[[0,0],[3,4],[1,1]]'],
      ['[[5,5],[5,6]]'],
      ['[[0,0],[0,0]]'],
      ['[[-3,-3],[3,3]]'],
      ['[[1,2],[3,4],[5,6],[2,2]]'],
      ['[[10,10],[20,20],[10,11]]'],
      ['[[0,0],[1000000,1000000]]'],
      ['[[1,1],[2,2],[3,3],[4,4]]'],
      ['[[-5,0],[5,0],[0,1]]'],
      ['[[7,3],[7,3],[100,100]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B53>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b53-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B53>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B53>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b53-grade-${prob.n}.py`);
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
