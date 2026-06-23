#!/usr/bin/env node
// Batch 52 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   3682,3687,3696,3706,3711,3717,3730,3735,3744,3749,3758,3763,3773,3778,3787
//
//   node scripts/fill-gap-problems-batch52.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch52.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch52.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [3682, 3687, 3696, 3706, 3711, 3717, 3730, 3735, 3744, 3749, 3758, 3763, 3773, 3778, 3787];

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
    n: 3682,
    id: 'pghub-b52-warehouse-shelves',
    name: 'Warehouse Shelf Capacity',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'wastedSpace',
    params: [
      { name: 'boxes', type: 'List[int]' },
      { name: 'shelf', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Boxes of given heights in <code>boxes</code> are stacked left to right onto identical shelves of height <code>shelf</code>. A box always goes on the current shelf if it still fits; otherwise a fresh shelf is started and the box goes there. Return the total unused height summed across every shelf that was opened.',
    examples: [
      ['[3,4,2,5]\n7', '0', 'Shelf 1 holds 3+4=7 and shelf 2 holds 2+5=7, so both are exactly full with no waste.'],
      ['[5]\n10', '5', 'One shelf holds the single box of height 5, wasting 5.'],
    ],
    constraints: ['1 <= boxes.length <= 10^5', '1 <= boxes[i] <= shelf', '1 <= shelf <= 10^9'],
    tags: ['arrays', 'simulation'],
    py: `def wastedSpace(boxes, shelf):
    used = 0
    waste = 0
    for h in boxes:
        if used + h <= shelf:
            used += h
        else:
            waste += shelf - used
            used = h
    waste += shelf - used
    return waste`,
    approach:
      'Walk the boxes in order while tracking the height already used on the current shelf. A box that fits is added; otherwise the leftover of the finished shelf is added to the waste and a new shelf begins with that box. After the last box, the leftover of the final shelf is also counted.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[3,4,2,5]', '7'],
      ['[5]', '10'],
      ['[1,1,1,1]', '2'],
      ['[10,10,10]', '10'],
      ['[2,2,2,2,2]', '6'],
      ['[7,7,7]', '7'],
      ['[1,2,3,4,5]', '5'],
      ['[9,1,9,1]', '10'],
      ['[4,4,4,4,4,4]', '8'],
      ['[6,6,6,6]', '12'],
    ],
  },
  {
    n: 3687,
    id: 'pghub-b52-signal-decay',
    name: 'Signal Decay Threshold',
    topic_id: 'binary-search',
    difficulty: 'Medium',
    method_name: 'minPower',
    params: [
      { name: 'distances', type: 'List[int]' },
      { name: 'budget', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A transmitter of integer power <code>p</code> reaches a receiver at distance <code>d</code> only if <code>p >= d</code>, and serving it costs <code>ceil(d / p)</code> energy units. Given the receiver <code>distances</code> and an energy <code>budget</code>, return the minimum power <code>p</code> such that the total energy to serve every receiver is at most <code>budget</code>. The answer always exists because power equal to the largest distance costs one unit each.',
    examples: [
      ['[2,4,8]\n3', '8', 'With p=8 every cost is 1, totaling 3 <= 3.'],
      ['[1,1,1]\n3', '1', 'Power 1 serves each at cost 1, total 3.'],
    ],
    constraints: ['1 <= distances.length <= 10^5', '1 <= distances[i] <= 10^9', 'distances.length <= budget'],
    tags: ['binary-search', 'greedy'],
    py: `def minPower(distances, budget):
    lo, hi = 1, max(distances)
    def cost(p):
        total = 0
        for d in distances:
            if p < d:
                return budget + 1
            total += -(-d // p)
            if total > budget:
                return total
        return total
    while lo < hi:
        mid = (lo + hi) // 2
        if cost(mid) <= budget:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'The total energy is a non-increasing function of power: more power never increases any per-receiver cost. That monotonicity lets a binary search over the power value find the smallest power whose total cost fits the budget. The cost check rejects powers too weak to reach a receiver and short-circuits once the budget is exceeded.',
    complexity: { time: 'O(n log(maxD))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,4,8]', '3'],
      ['[1,1,1]', '3'],
      ['[10]', '1'],
      ['[3,3,3,3]', '4'],
      ['[5,10,15,20]', '4'],
      ['[1,2,3,4,5]', '5'],
      ['[100,1]', '2'],
      ['[6,6,6]', '6'],
      ['[8,4,2,1]', '4'],
      ['[1000000000]', '1'],
    ],
  },
  {
    n: 3696,
    id: 'pghub-b52-token-stack',
    name: 'Collapsing Token Stack',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'finalStack',
    params: [{ name: 'tokens', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Process the integers in <code>tokens</code> left to right onto a stack. Before pushing a value, if it equals the value currently on top of the stack, pop that top instead of pushing (the two annihilate). Otherwise push the value. Return the stack from bottom to top after all tokens are processed.',
    examples: [
      ['[1,2,2,1]', '[]', '2 cancels 2, then 1 cancels 1, leaving an empty stack.'],
      ['[3,3,5]', '[5]', 'The two 3s cancel; 5 remains.'],
    ],
    constraints: ['0 <= tokens.length <= 10^5', '-10^9 <= tokens[i] <= 10^9'],
    tags: ['stack', 'simulation'],
    py: `def finalStack(tokens):
    stack = []
    for t in tokens:
        if stack and stack[-1] == t:
            stack.pop()
        else:
            stack.append(t)
    return stack`,
    approach:
      'A stack naturally models the "cancel the matching top" rule. For each token, compare it with the current top; an equal top is popped to annihilate the pair, otherwise the token is pushed. The remaining stack, read bottom to top, is the result.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,2,1]'],
      ['[3,3,5]'],
      ['[]'],
      ['[7]'],
      ['[1,1,1]'],
      ['[1,2,3,4]'],
      ['[5,5,5,5]'],
      ['[2,2,3,3,2,2]'],
      ['[-1,-1,4,4,9]'],
      ['[1,2,2,3,3,1]'],
    ],
  },
  {
    n: 3706,
    id: 'pghub-b52-garden-water',
    name: 'Garden Sprinkler Coverage',
    topic_id: 'greedy',
    difficulty: 'Hard',
    method_name: 'minSprinklers',
    params: [
      { name: 'ranges', type: 'List[int]' },
      { name: 'n', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A garden is the segment from 0 to <code>n</code>. There is a sprinkler at every integer position <code>i</code> (0 to n); sprinkler <code>i</code> waters the closed interval <code>[i - ranges[i], i + ranges[i]]</code>. Return the minimum number of sprinklers needed to water the whole garden, or <code>-1</code> if it is impossible.',
    examples: [
      ['[3,4,1,1,0,0]\n5', '1', 'The sprinkler at position 1 with range 4 covers [-3,5], all of [0,5].'],
      ['[0,0,0,0]\n3', '-1', 'Every sprinkler has range 0, so gaps remain.'],
    ],
    constraints: ['1 <= n <= 10^4', 'ranges.length == n + 1', '0 <= ranges[i] <= 100'],
    tags: ['greedy', 'intervals'],
    py: `def minSprinklers(ranges, n):
    max_right = [0] * (n + 1)
    for i, r in enumerate(ranges):
        left = max(0, i - r)
        right = min(n, i + r)
        if right > max_right[left]:
            max_right[left] = right
    count = 0
    cur_end = 0
    farthest = 0
    i = 0
    while cur_end < n:
        while i <= cur_end:
            if max_right[i] > farthest:
                farthest = max_right[i]
            i += 1
        if farthest <= cur_end:
            return -1
        count += 1
        cur_end = farthest
    return count`,
    approach:
      'Convert each sprinkler into the interval it waters and, for every left endpoint, keep the farthest right it can reach. Then sweep greedily like a jump-game: from the covered prefix choose the reach that extends coverage the most, increment the count, and advance. If no interval can extend past the current end, the garden cannot be fully watered.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[3,4,1,1,0,0]', '5'],
      ['[0,0,0,0]', '3'],
      ['[1,1,1,1]', '3'],
      ['[2,1,0,1,2]', '4'],
      ['[5,0,0,0,0,0]', '5'],
      ['[0,2,1,0,0]', '4'],
      ['[1,2,1,0,2,1,0,0]', '7'],
      ['[4,0,0,0,4,0,0,0,4]', '8'],
      ['[0]', '0'],
      ['[3,1,1,0,1,1,1,1]', '7'],
    ],
  },
  {
    n: 3711,
    id: 'pghub-b52-relay-teams',
    name: 'Relay Team Formation',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'maxTeams',
    params: [
      { name: 'speeds', type: 'List[int]' },
      { name: 'limit', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Runners have speeds in <code>speeds</code>. Each relay team has at most two runners, and the sum of a team\'s speeds must not exceed <code>limit</code>. Return the minimum number of teams needed so every runner is placed in exactly one team.',
    examples: [
      ['[1,2,2,3]\n3', '3', 'Pair (1,2) and leave 2 and 3 alone: three teams.'],
      ['[3,5,3,4]\n5', '4', 'No two runners fit together, so each is its own team.'],
    ],
    constraints: ['1 <= speeds.length <= 10^5', '1 <= speeds[i] <= limit', '1 <= limit <= 10^9'],
    tags: ['two-pointers', 'greedy'],
    py: `def maxTeams(speeds, limit):
    speeds = sorted(speeds)
    i, j = 0, len(speeds) - 1
    teams = 0
    while i <= j:
        if i < j and speeds[i] + speeds[j] <= limit:
            i += 1
        j -= 1
        teams += 1
    return teams`,
    approach:
      'Sort the speeds, then pair the slowest remaining runner with the fastest remaining runner whenever they fit under the limit. If the fastest cannot be paired with the slowest, it must travel alone. Each step forms one team and shrinks the window from both ends, minimizing the team count.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,2,2,3]', '3'],
      ['[3,5,3,4]', '5'],
      ['[1,1,1,1]', '2'],
      ['[5]', '5'],
      ['[2,3,4,5,6]', '8'],
      ['[1,1,1,1,1,1]', '2'],
      ['[4,4,4,4]', '4'],
      ['[1,2,3,4,5,6,7,8]', '9'],
      ['[10,10,10]', '20'],
      ['[1,9,2,8,3,7]', '10'],
    ],
  },
  {
    n: 3717,
    id: 'pghub-b52-palindrome-removal',
    name: 'Palindromic Letter Trim',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'longestPalindromeLen',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> of lowercase and uppercase letters, return the length of the longest palindrome that can be built by reordering some of its characters. Each character may be used at most as many times as it appears, and letters are case-sensitive.',
    examples: [
      ['abccccdd', '7', 'Use d d c c c c plus one of a/b in the center: dccaccd has length 7.'],
      ['Aa', '1', 'A and a differ in case, so only a single character can be the palindrome.'],
    ],
    constraints: ['1 <= s.length <= 2000', 's consists of English letters'],
    tags: ['strings', 'hash-map'],
    py: `def longestPalindromeLen(s):
    counts = Counter(s)
    length = 0
    has_odd = False
    for c in counts.values():
        length += c - (c & 1)
        if c & 1:
            has_odd = True
    return length + (1 if has_odd else 0)`,
    approach:
      'A palindrome pairs characters symmetrically, so every character contributes its largest even count. If any character has an odd count, a single leftover can sit in the exact center, adding one. Summing the even parts and allowing at most one central odd character gives the longest achievable length.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"abccccdd"'],
      ['"Aa"'],
      ['"a"'],
      ['"aaaa"'],
      ['"abc"'],
      ['"aabbcc"'],
      ['"AaBbCc"'],
      ['"zzzzz"'],
      ['"racecar"'],
      ['"abababab"'],
    ],
  },
  {
    n: 3730,
    id: 'pghub-b52-meeting-overlap',
    name: 'Peak Concurrent Meetings',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'maxConcurrent',
    params: [{ name: 'meetings', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each meeting in <code>meetings</code> is a pair <code>[start, end]</code> meaning it occupies the half-open interval <code>[start, end)</code>. Return the maximum number of meetings that are in progress at the same instant.',
    examples: [
      ['[[1,4],[2,5],[7,9]]', '2', 'At time 2 the first two meetings overlap; the third is separate.'],
      ['[[1,2],[2,3],[3,4]]', '1', 'Each ends exactly when the next begins, so they never overlap.'],
    ],
    constraints: ['1 <= meetings.length <= 10^5', '0 <= start < end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def maxConcurrent(meetings):
    events = []
    for s, e in meetings:
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
      'Turn each meeting into a start event (+1) and an end event (-1), then sort all events by time with ends processed before starts at equal times so half-open intervals do not falsely overlap. Sweeping through the sorted events while maintaining a running count of active meetings yields the maximum simultaneous overlap.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,4],[2,5],[7,9]]'],
      ['[[1,2],[2,3],[3,4]]'],
      ['[[0,10]]'],
      ['[[1,5],[1,5],[1,5]]'],
      ['[[1,3],[2,6],[8,10],[15,18]]'],
      ['[[0,30],[5,10],[15,20]]'],
      ['[[1,2],[1,2],[1,2],[1,2]]'],
      ['[[5,7],[1,3],[2,4],[6,8]]'],
      ['[[10,20],[20,30],[30,40]]'],
      ['[[1,100],[2,3],[4,5],[6,7],[8,9]]'],
    ],
  },
  {
    n: 3735,
    id: 'pghub-b52-grid-treasure',
    name: 'Maximum Treasure Path',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'maxTreasure',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Starting at the top-left cell of <code>grid</code> and moving only right or down, collect the value of every cell you step on until you reach the bottom-right cell. Cell values may be negative. Return the maximum total value collectible over all valid paths.',
    examples: [
      ['[[1,3,1],[1,5,1],[4,2,1]]', '12', 'Path 1->3->5->2->1 collects 12.'],
      ['[[5]]', '5', 'A single cell is both start and end.'],
    ],
    constraints: ['1 <= grid.length, grid[0].length <= 200', '-1000 <= grid[i][j] <= 1000'],
    tags: ['2d-dp', 'matrix'],
    py: `def maxTreasure(grid):
    rows = len(grid)
    cols = len(grid[0])
    dp = [float('-inf')] * cols
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                dp[c] = grid[0][0]
            else:
                best = float('-inf')
                if r > 0:
                    best = max(best, dp[c])
                if c > 0:
                    best = max(best, dp[c - 1])
                dp[c] = best + grid[r][c]
    return dp[cols - 1]`,
    approach:
      'The best total at a cell is its own value plus the better of the best totals arriving from directly above or directly left. Filling the grid row by row with a single rolling array captures both predecessors, and the bottom-right cell holds the optimal path sum.',
    complexity: { time: 'O(rows*cols)', space: 'O(cols)' },
    cases: [
      ['[[1,3,1],[1,5,1],[4,2,1]]'],
      ['[[5]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,-2,3],[-4,5,-6],[7,-8,9]]'],
      ['[[0,0,0],[0,0,0]]'],
      ['[[10,10,2],[1,1,20],[1,1,1]]'],
      ['[[-5]]'],
      ['[[2,1,1],[1,1,1],[1,1,2]]'],
    ],
  },
  {
    n: 3744,
    id: 'pghub-b52-bracket-depth',
    name: 'Maximum Nesting Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> may contain the brackets <code>()</code>, <code>[]</code>, and <code>{}</code> mixed with other characters, and is guaranteed to be a valid balanced bracket sequence. Return the maximum nesting depth of the brackets.',
    examples: [
      ['(a[b]{c})', '2', 'The deepest nesting, such as the [ ] inside the ( ), reaches depth 2.'],
      ['abc', '0', 'No brackets means depth 0.'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's is a valid balanced bracket sequence possibly with other characters'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(s):
    opens = set('([{')
    closes = set(')]}')
    depth = 0
    best = 0
    for ch in s:
        if ch in opens:
            depth += 1
            if depth > best:
                best = depth
        elif ch in closes:
            depth -= 1
    return best`,
    approach:
      'Scan the string while tracking the current open-bracket depth: every opening bracket increases it and every closing bracket decreases it. Because the sequence is valid, the depth never goes negative, and the largest value the depth reaches is the maximum nesting depth.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(a[b]{c})"'],
      ['"abc"'],
      ['""'],
      ['"((()))"'],
      ['"()()()"'],
      ['"{[()]}"'],
      ['"a(b)c(d)e"'],
      ['"[[[[]]]]"'],
      ['"({[({[]})]})"'],
      ['"x(y[z]w)v"'],
    ],
  },
  {
    n: 3749,
    id: 'pghub-b52-courier-routes',
    name: 'Courier Reachable Hubs',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'reachableHubs',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'There are <code>n</code> hubs labeled 0 to n-1 and a list of directed <code>roads</code>, where each road <code>[u, v]</code> allows travel from hub u to hub v. A courier begins at hub <code>start</code>. Return the number of distinct hubs reachable from the start, including the start itself.',
    examples: [
      ['4\n[[0,1],[1,2],[3,0]]\n0', '3', 'From 0 you can reach 0, 1, and 2; hub 3 is not reachable.'],
      ['3\n[]\n1', '1', 'With no roads only the start hub is reachable.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= roads.length <= 2*10^5', '0 <= u, v, start < n'],
    tags: ['graphs', 'breadth-first-search'],
    py: `def reachableHubs(n, roads, start):
    adj = defaultdict(list)
    for u, v in roads:
        adj[u].append(v)
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt in adj[node]:
            if nxt not in visited:
                visited.add(nxt)
                queue.append(nxt)
    return len(visited)`,
    approach:
      'Build a directed adjacency list from the roads, then run a breadth-first search from the start hub, marking nodes as visited the first time they are dequeued or queued. The size of the visited set when the search ends is the number of reachable hubs.',
    complexity: { time: 'O(n + E)', space: 'O(n + E)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[3,0]]', '0'],
      ['3', '[]', '1'],
      ['1', '[]', '0'],
      ['5', '[[0,1],[0,2],[1,3],[2,4]]', '0'],
      ['5', '[[0,1],[1,0]]', '2'],
      ['6', '[[0,1],[1,2],[2,3],[3,4],[4,5]]', '2'],
      ['4', '[[1,2],[2,3]]', '0'],
      ['4', '[[0,1],[1,2],[2,0],[2,3]]', '0'],
      ['3', '[[0,0],[0,1],[1,1]]', '0'],
      ['7', '[[0,1],[0,2],[1,3],[2,3],[3,4],[5,6]]', '0'],
    ],
  },
  {
    n: 3758,
    id: 'pghub-b52-color-runs',
    name: 'Minimum Color Repaints',
    topic_id: 'dp',
    difficulty: 'Hard',
    method_name: 'minRepaints',
    params: [
      { name: 'colors', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A fence has panels with colors given in <code>colors</code> (colors are integers 0 to k-1). You may repaint any panel to any color at a cost of 1 per panel. Return the minimum number of repaints so that no two adjacent panels share the same color.',
    examples: [
      ['[1,1,1]\n3', '1', 'Repaint the middle panel to a different color: one repaint.'],
      ['[0,1,0,1]\n2', '0', 'Already alternating, no repaints needed.'],
    ],
    constraints: ['1 <= colors.length <= 10^5', '2 <= k <= 100', '0 <= colors[i] < k'],
    tags: ['dp', 'greedy'],
    py: `def minRepaints(colors, k):
    INF = float('inf')
    n = len(colors)
    prev = [0] * k
    for color in range(k):
        prev[color] = 0 if colors[0] == color else 1
    for i in range(1, n):
        best1 = INF
        best2 = INF
        arg1 = -1
        for c in range(k):
            if prev[c] < best1:
                best2 = best1
                best1 = prev[c]
                arg1 = c
            elif prev[c] < best2:
                best2 = prev[c]
        cur = [0] * k
        for color in range(k):
            base = best1 if color != arg1 else best2
            cur[color] = base + (0 if colors[i] == color else 1)
        prev = cur
    return min(prev)`,
    approach:
      'Let the cost of coloring the prefix ending at a panel depend on that panel\'s final color. For each panel and candidate color, the cost is the best cost of the previous panel using a different color plus one if the panel must be repainted. Tracking the two smallest previous-panel costs lets each transition pick the best different color in constant time, keeping the whole pass linear in panels.',
    complexity: { time: 'O(n*k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,1,1]', '3'],
      ['[0,1,0,1]', '2'],
      ['[0,0,0,0]', '2'],
      ['[2,2,2,2,2]', '3'],
      ['[0,1,2,0,1,2]', '3'],
      ['[1]', '5'],
      ['[0,0]', '2'],
      ['[3,3,3,3,3,3]', '4'],
      ['[0,1,1,1,0]', '2'],
      ['[5,5,5,5,5,5,5]', '10'],
    ],
  },
  {
    n: 3763,
    id: 'pghub-b52-prefix-product',
    name: 'Prefix Product Sign',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'signProducts',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given an integer array <code>nums</code>, return an array <code>signs</code> of the same length where <code>signs[i]</code> is the sign of the product of the first <code>i + 1</code> elements: <code>1</code> if positive, <code>-1</code> if negative, and <code>0</code> if zero.',
    examples: [
      ['[2,-3,4]', '[1,-1,-1]', 'Prefix products are 2, -6, -24 with signs 1, -1, -1.'],
      ['[1,0,5]', '[1,0,0]', 'Once a zero appears every later prefix product is zero.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['math', 'arrays'],
    py: `def signProducts(nums):
    res = []
    sign = 1
    for x in nums:
        if x == 0:
            sign = 0
        elif x < 0:
            sign = -sign if sign != 0 else 0
        res.append(sign)
    return res`,
    approach:
      'Track only the running sign of the prefix product, never the value itself. A zero element fixes the sign to zero for the rest of the array, a negative element flips a nonzero sign, and a positive element leaves it unchanged. Appending the current sign at each step builds the answer in one pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,-3,4]'],
      ['[1,0,5]'],
      ['[1]'],
      ['[-1]'],
      ['[0]'],
      ['[-2,-2,-2]'],
      ['[5,5,5,5]'],
      ['[3,-1,0,7,-2]'],
      ['[-1,-1,-1,-1]'],
      ['[1000000000,-1,1]'],
    ],
  },
  {
    n: 3773,
    id: 'pghub-b52-subset-xor',
    name: 'Subset XOR Total',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'subsetXorSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, the XOR total of a subset is the bitwise XOR of all its elements (the empty subset has total 0). Return the sum of the XOR totals over every subset of <code>nums</code> (subsets are distinguished by index, so duplicate values count separately).',
    examples: [
      ['[1,3]', '6', 'Subsets {}, {1}, {3}, {1,3} have totals 0, 1, 3, 2; their sum is 6.'],
      ['[5]', '5', 'Subsets {} and {5} give 0 + 5 = 5.'],
    ],
    constraints: ['1 <= nums.length <= 20', '0 <= nums[i] <= 10^9'],
    tags: ['bit-manipulation', 'math'],
    py: `def subsetXorSum(nums):
    bit_or = 0
    for x in nums:
        bit_or |= x
    return bit_or << (len(nums) - 1)`,
    approach:
      'Consider any single bit position. It is set in the OR of all numbers exactly when at least one element has it; in that case exactly half of all subsets have an odd number of elements carrying that bit, so that bit contributes to half the subset totals. The total sum therefore equals the OR of all numbers multiplied by two to the power of the count minus one.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3]'],
      ['[5]'],
      ['[1,1,1]'],
      ['[3,4,5,6,7,8]'],
      ['[0,0,0]'],
      ['[1,2,4,8]'],
      ['[10,20,30]'],
      ['[7,7]'],
      ['[1000000000]'],
      ['[1,2,3,4,5,6,7,8,9,10]'],
    ],
  },
  {
    n: 3778,
    id: 'pghub-b52-event-schedule',
    name: 'Maximize Attended Events',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'maxEvents',
    params: [{ name: 'events', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Each event in <code>events</code> is a pair <code>[start, end]</code> meaning it can be attended on any single integer day d with <code>start <= d <= end</code>. You may attend at most one event per day. Return the maximum number of events you can attend.',
    examples: [
      ['[[1,2],[2,3],[3,4]]', '3', 'Attend on days 1, 2, and 3 to cover all three events.'],
      ['[[1,2],[1,2],[1,2]]', '2', 'Only days 1 and 2 are available, so at most two events.'],
    ],
    constraints: ['1 <= events.length <= 10^5', '1 <= start <= end <= 10^5'],
    tags: ['heap', 'greedy'],
    py: `def maxEvents(events):
    events.sort()
    heap = []
    i = 0
    n = len(events)
    day = 0
    attended = 0
    max_day = max(e[1] for e in events)
    while i < n or heap:
        if not heap:
            day = max(day + 1, events[i][0])
        else:
            day += 1
        while i < n and events[i][0] <= day:
            heapq.heappush(heap, events[i][1])
            i += 1
        while heap and heap[0] < day:
            heapq.heappop(heap)
        if heap:
            heapq.heappop(heap)
            attended += 1
    return attended`,
    approach:
      'Process days in increasing order while keeping, in a min-heap, the end days of all events that have already started. Each day, drop events whose end day has passed, then attend the available event that ends soonest because it has the least flexibility. Greedily clearing the most urgent event each day maximizes the total attended.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [
      ['[[1,2],[2,3],[3,4]]'],
      ['[[1,2],[1,2],[1,2]]'],
      ['[[1,4],[4,4],[2,2],[3,4],[1,1]]'],
      ['[[1,1]]'],
      ['[[1,5],[1,5],[1,5],[1,5],[1,5]]'],
      ['[[1,2],[1,2]]'],
      ['[[1,100000]]'],
      ['[[2,3],[2,3],[2,3]]'],
      ['[[1,1],[2,2],[3,3]]'],
      ['[[1,3],[1,3],[1,3],[4,4]]'],
    ],
  },
  {
    n: 3787,
    id: 'pghub-b52-cycle-detect',
    name: 'Course Schedule Feasible',
    topic_id: 'advanced-graphs',
    difficulty: 'Medium',
    method_name: 'canFinish',
    params: [
      { name: 'numCourses', type: 'int' },
      { name: 'prerequisites', type: 'List[List[int]]' },
    ],
    return_type: 'bool',
    statement:
      'There are <code>numCourses</code> courses labeled 0 to numCourses-1. Each pair <code>[a, b]</code> in <code>prerequisites</code> means course b must be taken before course a. Return <code>true</code> if it is possible to finish all courses, otherwise <code>false</code>.',
    examples: [
      ['2\n[[1,0]]', 'true', 'Take course 0 then course 1.'],
      ['2\n[[1,0],[0,1]]', 'false', 'Each course requires the other, forming a cycle.'],
    ],
    constraints: ['1 <= numCourses <= 10^5', '0 <= prerequisites.length <= 10^5', '0 <= a, b < numCourses'],
    tags: ['advanced-graphs', 'topological-sort'],
    py: `def canFinish(numCourses, prerequisites):
    adj = defaultdict(list)
    indeg = [0] * numCourses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    queue = deque(i for i in range(numCourses) if indeg[i] == 0)
    taken = 0
    while queue:
        node = queue.popleft()
        taken += 1
        for nxt in adj[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return taken == numCourses`,
    approach:
      'Model courses as a directed graph from prerequisite to dependent course and run Kahn\'s topological sort: repeatedly take any course with no remaining prerequisites, then relax its dependents\' in-degrees. All courses can be finished exactly when every course gets taken; if a cycle exists some in-degrees never reach zero and fewer courses are taken.',
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['2', '[[1,0]]'],
      ['2', '[[1,0],[0,1]]'],
      ['1', '[]'],
      ['4', '[[1,0],[2,1],[3,2]]'],
      ['3', '[[0,1],[1,2],[2,0]]'],
      ['5', '[[1,0],[2,0],[3,1],[3,2],[4,3]]'],
      ['3', '[]'],
      ['4', '[[1,0],[2,1],[0,2]]'],
      ['6', '[[1,0],[2,1],[3,2],[4,3],[5,4]]'],
      ['2', '[[0,1],[1,0]]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B52>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b52-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B52>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B52>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b52-grade-${prob.n}.py`);
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
