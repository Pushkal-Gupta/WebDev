#!/usr/bin/env node
// Batch 42 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
//
//   node scripts/fill-gap-problems-batch42.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch42.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch42.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [2964, 2969, 2978, 2979, 2984, 2985, 2986, 2987, 2988, 2989, 2990, 2991, 2992, 2993, 2994];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict
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
    n: 2964,
    id: 'pghub-b42-zigzag-merge',
    name: 'Zigzag Merge Two Lists',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'zigzagMerge',
    params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Interleave two integer lists <code>a</code> and <code>b</code> by alternately taking one element from each, starting with <code>a</code>. When one list runs out, append the remainder of the other. Return the merged list.',
    examples: [
      ['[1,3,5]\n[2,4,6]', '[1,2,3,4,5,6]', 'Take a[0], b[0], a[1], b[1], ...'],
      ['[1,2]\n[9]', '[1,9,2]', 'After b is exhausted, append the rest of a.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^5', '-10^9 <= a[i], b[i] <= 10^9'],
    tags: ['arrays', 'two-pointers'],
    py: `def zigzagMerge(a, b):
    out = []
    i = j = 0
    while i < len(a) and j < len(b):
        out.append(a[i]); i += 1
        out.append(b[j]); j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
    approach:
      'Walk both lists with two pointers, appending one element from a then one from b each round. Once a pointer reaches the end of its list, splice on whatever remains of the other list.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['[1,3,5]', '[2,4,6]'],
      ['[1,2]', '[9]'],
      ['[]', '[1,2,3]'],
      ['[1,2,3]', '[]'],
      ['[]', '[]'],
      ['[7]', '[8]'],
      ['[1,1,1]', '[2,2,2,2,2]'],
      ['[-1,-2]', '[-3,-4]'],
      ['[10,20,30,40]', '[5]'],
      ['[0]', '[0,0,0]'],
    ],
  },
  {
    n: 2969,
    id: 'pghub-b42-balanced-brackets-fix',
    name: 'Minimum Bracket Insertions',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'minInsertions',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a string <code>s</code> containing only the characters <code>(</code> and <code>)</code>, return the minimum number of brackets that must be inserted (anywhere) to make every bracket balanced.',
    examples: [
      ['"(()"', '1', 'Add one ")" to close the extra "(".'],
      ['"))("', '3', 'Two opens needed for the leading ")", then one close for the trailing "(".'],
    ],
    constraints: ['0 <= s.length <= 10^5', 's consists only of ( and )'],
    tags: ['stack', 'greedy'],
    py: `def minInsertions(s):
    open_count = 0
    inserts = 0
    for ch in s:
        if ch == "(":
            open_count += 1
        else:
            if open_count > 0:
                open_count -= 1
            else:
                inserts += 1
    return inserts + open_count`,
    approach:
      'Scan left to right tracking unmatched opens. Each ")" cancels an open if available, otherwise it needs an inserted "(". Any opens left unmatched at the end each need a ")". The sum is the answer.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(()"'],
      ['"))("'],
      ['"()"'],
      ['""'],
      ['"((("'],
      ['")))"'],
      ['"()()()"'],
      ['"(()))("'],
      ['")("'],
      ['"(((())"'],
    ],
  },
  {
    n: 2978,
    id: 'pghub-b42-digit-product-depth',
    name: 'Digit Product Depth',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'productDepth',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Repeatedly replace a non-negative integer <code>n</code> with the product of its digits until it becomes a single digit. Return how many replacements were needed (the <em>depth</em>). A number that is already one digit has depth 0.',
    examples: [
      ['39', '3', '39->27->14->4, three steps.'],
      ['7', '0', 'Already a single digit.'],
    ],
    constraints: ['0 <= n <= 10^9'],
    tags: ['math'],
    py: `def productDepth(n):
    depth = 0
    while n >= 10:
        prod = 1
        for ch in str(n):
            prod *= int(ch)
        n = prod
        depth += 1
    return depth`,
    approach:
      'While the number has more than one digit, multiply its digits together to form the next value and count the step. Multiplying by a zero digit collapses to a single digit quickly, so the loop terminates fast.',
    complexity: { time: 'O(depth * digits)', space: 'O(digits)' },
    cases: [
      ['39'],
      ['7'],
      ['0'],
      ['10'],
      ['999'],
      ['25'],
      ['77'],
      ['1000000000'],
      ['48'],
      ['123456789'],
    ],
  },
  {
    n: 2979,
    id: 'pghub-b42-window-distinct-max',
    name: 'Max Distinct in Fixed Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxDistinctWindow',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and a window size <code>k</code>, return the maximum number of distinct values found in any contiguous window of length exactly <code>k</code>. If <code>k</code> is larger than the array, return the count of distinct values in the whole array.',
    examples: [
      ['[1,2,1,3,4]\n3', '3', 'Window [1,3,4] has 3 distinct values.'],
      ['[5,5,5]\n2', '1', 'Every window of size 2 holds only the value 5.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['sliding-window', 'hash-map'],
    py: `def maxDistinctWindow(nums, k):
    n = len(nums)
    if k >= n:
        return len(set(nums))
    counts = defaultdict(int)
    for i in range(k):
        counts[nums[i]] += 1
    best = len(counts)
    for i in range(k, n):
        counts[nums[i]] += 1
        out = nums[i - k]
        counts[out] -= 1
        if counts[out] == 0:
            del counts[out]
        best = max(best, len(counts))
    return best`,
    approach:
      'Maintain a count map for the current window. Build the first window, then slide: add the entering element and remove the leaving one, dropping keys that hit zero. The number of live keys is the distinct count; track its maximum.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,2,1,3,4]', '3'],
      ['[5,5,5]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1]', '1'],
      ['[1,1,2,2,3,3]', '2'],
      ['[4,3,2,1]', '10'],
      ['[7,7,7,7]', '1'],
      ['[1,2,3,1,2,3]', '3'],
      ['[9,8,9,8,9]', '4'],
      ['[0,0,1,0,0]', '2'],
    ],
  },
  {
    n: 2984,
    id: 'pghub-b42-staircase-ways-skip',
    name: 'Staircase With Broken Steps',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'climbWays',
    params: [{ name: 'n', type: 'int' }, { name: 'broken', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You climb a staircase of <code>n</code> steps, taking 1 or 2 steps at a time, starting from step 0 and ending on step <code>n</code>. Some steps are broken and cannot be stepped on. Return the number of distinct ways to reach step <code>n</code>. Step 0 is never broken.',
    examples: [
      ['4\n[2]', '1', 'Only 0->1->3->4 (the 1+2+... paths avoiding step 2).'],
      ['3\n[]', '3', 'Standard climb: 1+1+1, 1+2, 2+1.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= broken.length <= n', '1 <= broken[i] <= n'],
    tags: ['dp'],
    py: `def climbWays(n, broken):
    bad = set(broken)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        if i in bad:
            dp[i] = 0
            continue
        dp[i] = dp[i - 1] + (dp[i - 2] if i >= 2 else 0)
    return dp[n]`,
    approach:
      'Classic step-counting DP where dp[i] is the number of ways to land on step i. Broken steps are forced to zero. Each reachable step sums the ways from one and two steps below, so paths through broken steps are never counted.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['4', '[2]'],
      ['3', '[]'],
      ['5', '[3]'],
      ['1', '[]'],
      ['2', '[1]'],
      ['6', '[2,4]'],
      ['10', '[]'],
      ['7', '[1,2]'],
      ['8', '[7]'],
      ['5', '[1,2,3,4,5]'],
    ],
  },
  {
    n: 2985,
    id: 'pghub-b42-rotate-grid-cw',
    name: 'Rotate Grid Clockwise',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rotateCW',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Given an <code>m x n</code> integer matrix <code>grid</code>, return a new matrix rotated 90 degrees clockwise. The result has dimensions <code>n x m</code>.',
    examples: [
      ['[[1,2],[3,4]]', '[[3,1],[4,2]]', 'The bottom row becomes the left column.'],
      ['[[1,2,3]]', '[[1],[2],[3]]', 'A single row becomes a single column.'],
    ],
    constraints: ['1 <= m, n <= 300', '-10^4 <= grid[i][j] <= 10^4'],
    tags: ['matrix-traversal'],
    topic_label: 'matrix-traversal',
    py: `def rotateCW(grid):
    m = len(grid)
    n = len(grid[0])
    return [[grid[m - 1 - r][c] for r in range(m)] for c in range(n)]`,
    approach:
      'A clockwise rotation maps output cell (c, r) to input cell (m-1-r, c). Build the n x m result directly with this index map, reading each original column from bottom to top into a new row.',
    complexity: { time: 'O(m * n)', space: 'O(m * n)' },
    cases: [
      ['[[1,2],[3,4]]'],
      ['[[1,2,3]]'],
      ['[[1],[2],[3]]'],
      ['[[5]]'],
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[1,2],[3,4],[5,6]]'],
      ['[[0,0],[0,0]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[1,2,3,4]]'],
      ['[[9,8],[7,6],[5,4],[3,2]]'],
    ],
  },
  {
    n: 2986,
    id: 'pghub-b42-xor-pair-target',
    name: 'Count XOR Pairs',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'countXorPairs',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code> and an integer <code>target</code>, count the number of index pairs <code>(i, j)</code> with <code>i &lt; j</code> such that <code>nums[i] XOR nums[j] == target</code>.',
    examples: [
      ['[1,2,3]\n1', '1', '2 XOR 3 = 1; no other pair matches.'],
      ['[5,5,5]\n0', '3', 'Every pair of equal values XORs to 0.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= nums[i] <= 10^9', '0 <= target <= 10^9'],
    tags: ['bit-manipulation', 'hash-map'],
    py: `def countXorPairs(nums, target):
    seen = defaultdict(int)
    count = 0
    for x in nums:
        count += seen[x ^ target]
        seen[x] += 1
    return count`,
    approach:
      'For a value x, its partner must equal x XOR target. Sweep once, and before recording x add the number of earlier elements equal to its required partner. This counts each ordered pair once with i < j.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '1'],
      ['[5,5,5]', '0'],
      ['[1,1,1,1]', '0'],
      ['[0]', '0'],
      ['[4,6,2,8]', '2'],
      ['[10,20,30]', '5'],
      ['[7,7,0,0]', '7'],
      ['[1,2,4,8,16]', '3'],
      ['[3,3,3,3,3]', '0'],
      ['[100,200,300,400]', '500'],
    ],
  },
  {
    n: 2987,
    id: 'pghub-b42-deepest-leaf-sum',
    name: 'Deepest Leaves Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'deepestLeavesSum',
    params: [{ name: 'tree', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A binary tree is given as a level-order array <code>tree</code> where <code>null</code> marks a missing node (use the value <code>-1</code> to mark missing nodes; all real values are non-negative). Return the sum of the values of the deepest leaves. An empty tree sums to 0.',
    examples: [
      ['[1,2,3,4,5,-1,6]', '15', 'Deepest level holds 4, 5, 6 -> 15.'],
      ['[10]', '10', 'The single root is the deepest leaf.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', 'tree[i] == -1 marks a missing node, else 0 <= tree[i]'],
    tags: ['trees', 'bfs'],
    py: `def deepestLeavesSum(tree):
    if not tree or tree[0] == -1:
        return 0
    # build children via array-index heap layout is not valid with -1 gaps,
    # so parse level by level.
    idx = 0
    level = [tree[0]]
    idx = 1
    last_sum = sum(level)
    while idx < len(tree):
        nxt = []
        for val in level:
            if val == -1:
                continue
            left = tree[idx] if idx < len(tree) else -1
            idx += 1
            right = tree[idx] if idx < len(tree) else -1
            idx += 1
            if left != -1:
                nxt.append(left)
            if right != -1:
                nxt.append(right)
        if nxt:
            last_sum = sum(nxt)
            level = nxt
        else:
            break
    return last_sum`,
    approach:
      'Parse the tree level by level: each real node on the current level consumes the next two slots of the array as its children, skipping -1 markers. Track the sum of the most recent non-empty level; when no children appear, that sum is the deepest-leaves sum.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,2,3,4,5,-1,6]'],
      ['[10]'],
      ['[]'],
      ['[-1]'],
      ['[1,2,3]'],
      ['[5,4,8,11,-1,13,4,7,2]'],
      ['[1,-1,2,-1,3]'],
      ['[0,0,0,0,0,0,0]'],
      ['[100,50,50]'],
      ['[1,2,-1,3,-1,-1,-1,4]'],
    ],
  },
  {
    n: 2988,
    id: 'pghub-b42-gift-split-fair',
    name: 'Fair Gift Split',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'fairSplit',
    params: [{ name: 'gifts', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Two friends split a pile of <code>gifts</code> (positive integer values). Sort gifts by value descending, then deal them one at a time, always giving the next gift to whichever friend currently has the smaller total (ties go to the first friend). Return the absolute difference between the two final totals.',
    examples: [
      ['[8,7,5,3]', '1', 'A gets 8+3=11, B gets 7+5=12, difference 1.'],
      ['[10]', '10', 'One gift goes entirely to one friend.'],
    ],
    constraints: ['1 <= gifts.length <= 10^5', '1 <= gifts[i] <= 10^6'],
    tags: ['greedy', 'sorting'],
    py: `def fairSplit(gifts):
    a = 0
    b = 0
    for g in sorted(gifts, reverse=True):
        if a <= b:
            a += g
        else:
            b += g
    return abs(a - b)`,
    approach:
      'A greedy longest-processing-time heuristic: hand out gifts largest first, each time to the currently lighter friend. This keeps the two totals close, and the final gap is their absolute difference.',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    cases: [
      ['[8,7,5,3]'],
      ['[10]'],
      ['[1,1,1,1]'],
      ['[5,5]'],
      ['[9,8,7,6,5]'],
      ['[100,1,1,1]'],
      ['[3,3,3]'],
      ['[10,20,30,40,50]'],
      ['[1]'],
      ['[6,5,4,3,2,1]'],
    ],
  },
  {
    n: 2989,
    id: 'pghub-b42-word-abbrev-match',
    name: 'Abbreviation Match',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'abbrevMatch',
    params: [{ name: 'word', type: 'str' }, { name: 'abbr', type: 'str' }],
    return_type: 'bool',
    statement:
      'An abbreviation replaces runs of letters with their count, e.g. "internationalization" -> "i18n". Given a <code>word</code> and an abbreviation <code>abbr</code> (letters and digits, no leading zero in any number), return whether <code>abbr</code> is a valid abbreviation of <code>word</code>.',
    examples: [
      ['"internationalization"\n"i18n"', 'true', '"i" + 18 skipped letters + "n" matches.'],
      ['"apple"\n"a2e"', 'false', '"a2e" implies a,?,?,e (length 4) but word is length 5.'],
    ],
    constraints: ['1 <= word.length <= 10^4', '1 <= abbr.length <= 10^4', 'abbr has no number with a leading zero'],
    tags: ['strings', 'two-pointers'],
    py: `def abbrevMatch(word, abbr):
    i = j = 0
    n = len(word)
    m = len(abbr)
    while j < m:
        ch = abbr[j]
        if ch.isdigit():
            if ch == "0":
                return False
            num = 0
            while j < m and abbr[j].isdigit():
                num = num * 10 + int(abbr[j])
                j += 1
            i += num
        else:
            if i >= n or word[i] != ch:
                return False
            i += 1
            j += 1
    return i == n`,
    approach:
      'Two pointers walk word and abbr. A digit run is parsed as a number and skips that many word characters (rejecting any leading zero). A letter must match the current word character exactly. The match succeeds only if both end together.',
    complexity: { time: 'O(|word| + |abbr|)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"internationalization"', '"i18n"'],
      ['"apple"', '"a2e"'],
      ['"word"', '"4"'],
      ['"word"', '"w3"'],
      ['"a"', '"1"'],
      ['"abc"', '"a1c"'],
      ['"abc"', '"abc"'],
      ['"abc"', '"a01c"'],
      ['"substitution"', '"s10n"'],
      ['"hello"', '"h4o"'],
    ],
  },
  {
    n: 2990,
    id: 'pghub-b42-island-perimeter',
    name: 'Island Perimeter',
    topic_id: 'graphs',
    difficulty: 'Easy',
    method_name: 'islandPerimeter',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a binary grid where <code>1</code> is land and <code>0</code> is water, return the total perimeter of the land cells. Each land cell contributes 4 minus 2 for every shared edge with an adjacent land cell.',
    examples: [
      ['[[0,1,0],[1,1,1],[0,1,0]]', '12', 'A plus-shaped island.'],
      ['[[1]]', '4', 'A single isolated land cell.'],
    ],
    constraints: ['1 <= rows, cols <= 100', 'grid[i][j] is 0 or 1'],
    tags: ['graph', 'matrix-traversal'],
    topic_label: 'grid-bfs',
    py: `def islandPerimeter(grid):
    rows = len(grid)
    cols = len(grid[0])
    per = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                per += 4
                if r > 0 and grid[r - 1][c] == 1:
                    per -= 2
                if c > 0 and grid[r][c - 1] == 1:
                    per -= 2
    return per`,
    approach:
      'Each land cell starts with 4 exposed edges. For every pair of horizontally or vertically adjacent land cells, the shared edge removes 2 from the total. Checking only the up and left neighbours counts each shared edge exactly once.',
    complexity: { time: 'O(rows * cols)', space: 'O(1)' },
    cases: [
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
      ['[[1]]'],
      ['[[1,1],[1,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1,0,1]]'],
      ['[[1,1,1,1]]'],
      ['[[1],[1],[1]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,1,0],[0,1,1]]'],
      ['[[0,1,1,0],[1,1,1,1],[0,1,1,0]]'],
    ],
  },
  {
    n: 2991,
    id: 'pghub-b42-trapping-three-buckets',
    name: 'Kth Largest Stream',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'kthLargestStream',
    params: [{ name: 'k', type: 'int' }, { name: 'stream', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Process the integers in <code>stream</code> one by one. After adding each value, record the current <code>k</code>-th largest value among everything added so far, or <code>-1</code> if fewer than <code>k</code> values have arrived. Return the list of recorded answers.',
    examples: [
      ['2\n[5,1,8,3]', '[-1,1,5,5]', 'After 5,1 the 2nd largest is 1; after 8 it is 5; after 3 still 5.'],
      ['1\n[4,9,2]', '[4,9,9]', 'The 1st largest is the running maximum.'],
    ],
    constraints: ['1 <= k <= 10^5', '0 <= stream.length <= 10^5', '-10^9 <= stream[i] <= 10^9'],
    tags: ['heap'],
    py: `def kthLargestStream(k, stream):
    heap = []
    out = []
    for x in stream:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
        out.append(heap[0] if len(heap) == k else -1)
    return out`,
    approach:
      'Keep a min-heap of the k largest values seen so far. Push each new value and pop the smallest whenever the heap exceeds size k. The heap root is the k-th largest once the heap is full, otherwise the answer is -1.',
    complexity: { time: 'O(n log k)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['2', '[5,1,8,3]'],
      ['1', '[4,9,2]'],
      ['3', '[1,2,3,4,5]'],
      ['2', '[]'],
      ['1', '[7]'],
      ['4', '[1,2,3]'],
      ['2', '[5,5,5,5]'],
      ['3', '[10,9,8,7,6,5]'],
      ['1', '[-1,-2,-3]'],
      ['2', '[3,1,4,1,5,9,2,6]'],
    ],
  },
  {
    n: 2992,
    id: 'pghub-b42-min-cost-paint-fence',
    name: 'Min Cost Paint Fence',
    topic_id: '2d-dp',
    difficulty: 'Medium',
    method_name: 'minPaintCost',
    params: [{ name: 'cost', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A fence has posts to paint; <code>cost[i]</code> gives the cost of painting post i in each of three colors. No two adjacent posts may share a color. Return the minimum total cost to paint every post. If there are no posts, the cost is 0.',
    examples: [
      ['[[1,5,3],[2,9,4]]', '5', 'Post 0 color 0 (1) + post 1 color 2 (4) = 5.'],
      ['[[7,7,7]]', '7', 'One post: pick the cheapest color.'],
    ],
    constraints: ['0 <= posts <= 10^5', 'cost[i].length == 3', '0 <= cost[i][j] <= 10^4'],
    tags: ['2d-dp'],
    topic_label: '2d-dp',
    py: `def minPaintCost(cost):
    if not cost:
        return 0
    prev = list(cost[0])
    for i in range(1, len(cost)):
        cur = [0, 0, 0]
        cur[0] = cost[i][0] + min(prev[1], prev[2])
        cur[1] = cost[i][1] + min(prev[0], prev[2])
        cur[2] = cost[i][2] + min(prev[0], prev[1])
        prev = cur
    return min(prev)`,
    approach:
      'DP over posts where the state is the minimum cost to reach each color at the current post. Each color can follow only the cheaper of the two other colors from the previous post. The answer is the minimum over the last post\'s three states.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[[1,5,3],[2,9,4]]'],
      ['[[7,7,7]]'],
      ['[]'],
      ['[[1,2,3],[1,2,3],[1,2,3]]'],
      ['[[0,0,0]]'],
      ['[[5,8,6],[19,14,13],[7,5,12],[14,15,17]]'],
      ['[[1,100,100],[100,1,100],[100,100,1]]'],
      ['[[3,1,2]]'],
      ['[[10,10,1],[1,10,10]]'],
      ['[[2,3,4],[5,1,6],[7,8,2],[3,9,1]]'],
    ],
  },
  {
    n: 2993,
    id: 'pghub-b42-lex-smallest-rotation',
    name: 'Lexicographically Smallest Rotation',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'smallestRotation',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a string <code>s</code>, consider all of its rotations (moving a prefix to the back). Return the lexicographically smallest rotation. The empty string returns itself.',
    examples: [
      ['"bca"', '"abc"', 'Rotating by 1 gives "cab", by 2 gives "abc" which is smallest.'],
      ['"aaa"', '"aaa"', 'All rotations are equal.'],
    ],
    constraints: ['0 <= s.length <= 2000', 's consists of printable ASCII characters'],
    tags: ['strings'],
    py: `def smallestRotation(s):
    if not s:
        return s
    n = len(s)
    best = s
    for i in range(1, n):
        cand = s[i:] + s[:i]
        if cand < best:
            best = cand
    return best`,
    approach:
      'Generate each of the n rotations by concatenating a suffix with its prefix, and keep the lexicographically smallest one seen. Straightforward comparison suffices for the given size bound.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['"bca"'],
      ['"aaa"'],
      ['""'],
      ['"a"'],
      ['"dcba"'],
      ['"banana"'],
      ['"zxy"'],
      ['"abab"'],
      ['"cba"'],
      ['"baca"'],
    ],
  },
  {
    n: 2994,
    id: 'pghub-b42-network-delay-time',
    name: 'Signal Broadcast Time',
    topic_id: 'advanced-graphs',
    difficulty: 'Hard',
    method_name: 'broadcastTime',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }, { name: 'source', type: 'int' }],
    return_type: 'int',
    statement:
      'A network has <code>n</code> nodes labeled 1..n. Each entry in <code>edges</code> is <code>[u, v, w]</code>: a one-way link from u to v that takes <code>w</code> time. A signal starts at <code>source</code>. Return the time for all nodes to receive it, or <code>-1</code> if some node is unreachable.',
    examples: [
      ['4\n[[1,2,1],[2,3,1],[3,4,1]]\n1', '3', 'The farthest node 4 is reached at time 3.'],
      ['2\n[[1,2,5]]\n2', '-1', 'Node 1 is unreachable from source 2.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 10^5', '1 <= w <= 100', '1 <= u, v, source <= n'],
    tags: ['advanced-graphs', 'dijkstra'],
    py: `def broadcastTime(n, edges, source):
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
    dist = {source: 0}
    heap = [(0, source)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, float("inf")):
            continue
        for nxt, w in graph[node]:
            nd = d + w
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                heapq.heappush(heap, (nd, nxt))
    if len(dist) < n:
        return -1
    return max(dist.values())`,
    approach:
      'Run Dijkstra from the source over the weighted directed graph to get the shortest signal-arrival time to every node. If any node is never reached the answer is -1; otherwise the broadcast finishes at the maximum arrival time.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['4', '[[1,2,1],[2,3,1],[3,4,1]]', '1'],
      ['2', '[[1,2,5]]', '2'],
      ['3', '[[1,2,1],[1,3,4],[2,3,1]]', '1'],
      ['1', '[]', '1'],
      ['3', '[[1,2,1]]', '1'],
      ['4', '[[1,2,2],[1,3,1],[3,4,3]]', '1'],
      ['5', '[[1,2,1],[2,3,1],[3,4,1],[4,5,1]]', '1'],
      ['3', '[[1,2,10],[2,1,10]]', '3'],
      ['2', '[[1,2,1],[2,1,1]]', '1'],
      ['6', '[[1,2,3],[1,3,2],[3,4,1],[4,5,2],[2,6,8]]', '1'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print(_ser(${prob.method_name}(${argLiterals})))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b42-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = res.stdout.trimEnd().split('\n');
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
  const body = prob.py
    .replace(new RegExp(`^def ${prob.method_name}\\(${prob.params.map((p) => p.name).join(', ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\):\\n`), '')
    .split('\n')
    .map((l) => (l ? '        ' + l : l))
    .join('\n');
  return `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
}

async function verify(wanted) {
  const { data: rows, error } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,id,name,tags,method_name,params,solutions,test_cases')
    .in('leetcode_number', wanted)
    .order('leetcode_number');
  if (error) throw error;
  let totalPass = 0;
  let totalCases = 0;
  let pghubRows = 0;
  for (const row of rows || []) {
    if ((row.tags || []).includes('PGHub')) pghubRows += 1;
    const code = row.solutions?.python?.code;
    const sig = (row.params || []).map((p) => p.name).join(', ');
    const callLines = (row.test_cases || [])
      .map((tc) => `    print(_ser(sol.${row.method_name}(${tc.inputs.join(', ')})))`)
      .join('\n');
    const program = `${PY_SERIALIZER}\n${code}\n\nsol = Solution()\nif True:\n${callLines}\n`;
    void sig;
    const tmp = path.join(os.tmpdir(), `pghub-b42-verify-${row.leetcode_number}.py`);
    fs.writeFileSync(tmp, program);
    const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
    if (res.status !== 0) {
      console.log(`  #${row.leetcode_number} ${row.name}: RUN ERROR\n${res.stderr}`);
      continue;
    }
    const outputs = res.stdout.trimEnd().split('\n');
    let pass = 0;
    (row.test_cases || []).forEach((tc, idx) => {
      totalCases += 1;
      if (outputs[idx] === tc.expected) {
        pass += 1;
        totalPass += 1;
      } else {
        console.log(`  #${row.leetcode_number} case ${idx}: expected ${tc.expected} got ${outputs[idx]}`);
      }
    });
    console.log(`  #${row.leetcode_number} ${row.name} [${(row.tags || []).join(',')}] ${pass}/${(row.test_cases || []).length}`);
  }
  console.log(`\nVERIFY: ${totalPass}/${totalCases} cases pass across ${(rows || []).length} rows; ${pghubRows} rows tagged PGHub.`);
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;

  if (VERIFY) {
    await verify(wanted);
    return;
  }

  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);
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
    const test_cases = runPythonExpected(prob);
    const tags = Array.from(new Set(['PGHub', ...prob.tags]));
    rows.push({
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
    });
    console.log(`  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, sample expected: ${test_cases[0].expected}`);
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
  for (const c of check || []) console.log(`  #${c.leetcode_number} ${c.name} tags=${JSON.stringify(c.tags)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
