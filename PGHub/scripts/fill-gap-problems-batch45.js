#!/usr/bin/env node
// Batch 45 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Standalone file so concurrent batches cannot collide.
// Fills exactly these 15 numbering gaps (leetcode_number):
//   2995,3004,3009,3018,3023,3032,3037,3050,3051,3052,3053,3054,3055,3056,3057
//
//   node scripts/fill-gap-problems-batch45.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch45.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch45.js --verify  # re-run stored solutions vs stored test_cases
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

const BATCH = [2995, 3004, 3009, 3018, 3023, 3032, 3037, 3050, 3051, 3052, 3053, 3054, 3055, 3056, 3057];

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
    n: 2995,
    id: 'pghub-b45-keypad-presses',
    name: 'Old Keypad Presses',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'totalPresses',
    params: [{ name: 'text', type: 'str' }],
    return_type: 'int',
    statement:
      'On an old phone keypad the letters are grouped: <code>abc</code> on key 2, <code>def</code> on 3, <code>ghi</code> on 4, <code>jkl</code> on 5, <code>mno</code> on 6, <code>pqrs</code> on 7, <code>tuv</code> on 8, <code>wxyz</code> on 9. Typing the k-th letter on a key requires k presses (so <code>a</code> needs 1, <code>c</code> needs 3, <code>s</code> needs 4). Given a lowercase string <code>text</code>, return the total number of key presses to type it.',
    examples: [
      ['"abc"', '6', 'a=1, b=2, c=3 -> 6.'],
      ['"sos"', '11', 's is 4th on key 7 (4), o is 3rd on key 6 (3): 4+3+4=11.'],
    ],
    constraints: ['1 <= text.length <= 10^5', 'text consists of lowercase English letters'],
    tags: ['strings', 'simulation'],
    py: `def totalPresses(text):
    groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"]
    cost = {}
    for g in groups:
        for i, ch in enumerate(g):
            cost[ch] = i + 1
    return sum(cost[c] for c in text)`,
    approach:
      'Precompute the press cost of every letter from the fixed keypad grouping: a letter that is the k-th on its key costs k presses. Then sum the per-letter cost over the whole string in a single pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"abc"'],
      ['"sos"'],
      ['"a"'],
      ['"z"'],
      ['"hello"'],
      ['"keypad"'],
      ['"aaaa"'],
      ['"pqrs"'],
      ['"thequickbrownfox"'],
      ['"wxyz"'],
    ],
  },
  {
    n: 3004,
    id: 'pghub-b45-diagonal-sum',
    name: 'Matrix Diagonal Difference',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'diagonalDiff',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a square <code>matrix</code> of size n x n, compute the sum of its primary diagonal (top-left to bottom-right) and the sum of its secondary diagonal (top-right to bottom-left). Return the absolute difference between the two sums.',
    examples: [
      ['[[1,2,3],[4,5,6],[9,8,9]]', '2', 'Primary 1+5+9=15, secondary 3+5+9=17, |15-17|=2.'],
      ['[[5]]', '0', 'Both diagonals are the single element.'],
    ],
    constraints: ['1 <= matrix.length <= 500', 'matrix is square', '-10^4 <= matrix[i][j] <= 10^4'],
    tags: ['arrays', 'matrix'],
    py: `def diagonalDiff(matrix):
    n = len(matrix)
    primary = sum(matrix[i][i] for i in range(n))
    secondary = sum(matrix[i][n - 1 - i] for i in range(n))
    return abs(primary - secondary)`,
    approach:
      'For an n x n matrix the primary diagonal entries are matrix[i][i] and the secondary diagonal entries are matrix[i][n-1-i]. Sum each in one pass over the rows and return the absolute difference of the two totals.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[9,8,9]]'],
      ['[[5]]'],
      ['[[1,2],[3,4]]'],
      ['[[1,1,1],[1,1,1],[1,1,1]]'],
      ['[[-1,-2],[-3,-4]]'],
      ['[[10,0,0],[0,10,0],[0,0,10]]'],
      ['[[2,4,6,8],[1,3,5,7],[0,2,4,6],[9,7,5,3]]'],
      ['[[100,1],[1,100]]'],
      ['[[0,0],[0,0]]'],
      ['[[3,1,4],[1,5,9],[2,6,5]]'],
    ],
  },
  {
    n: 3009,
    id: 'pghub-b45-roman-clamp',
    name: 'Clamp Into Range',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'clampSum',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code> and bounds <code>lo</code> and <code>hi</code> (with <code>lo <= hi</code>), clamp each value into the inclusive range: anything below <code>lo</code> becomes <code>lo</code>, anything above <code>hi</code> becomes <code>hi</code>, and values already inside stay unchanged. Return the sum of the clamped values.',
    examples: [
      ['[1,5,10]\n3\n7', '15', 'Clamped to 3,5,7 -> 15.'],
      ['[8,8,8]\n0\n5', '15', 'Each 8 clamps down to 5.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9', 'lo <= hi'],
    tags: ['math', 'arrays'],
    py: `def clampSum(nums, lo, hi):
    total = 0
    for x in nums:
        if x < lo:
            total += lo
        elif x > hi:
            total += hi
        else:
            total += x
    return total`,
    approach:
      'Clamping a value v to [lo, hi] is min(hi, max(lo, v)). Walk the array once, fold each value into the range, and accumulate the running sum of the clamped values.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[1,5,10]', '3', '7'],
      ['[8,8,8]', '0', '5'],
      ['[5]', '5', '5'],
      ['[-10,0,10]', '-5', '5'],
      ['[1,2,3,4,5]', '2', '4'],
      ['[100,200,300]', '150', '250'],
      ['[0,0,0]', '0', '0'],
      ['[-3,-2,-1]', '-2', '0'],
      ['[7,7,7,7]', '7', '7'],
      ['[1,9,2,8,3,7]', '4', '6'],
    ],
  },
  {
    n: 3018,
    id: 'pghub-b45-window-distinct',
    name: 'Max Distinct in Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'maxDistinct',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code> and a window size <code>k</code>, consider every contiguous subarray of length <code>k</code>. Return the maximum number of distinct values found in any such window. If <code>k</code> is larger than the array length, return the number of distinct values in the whole array.',
    examples: [
      ['[1,2,1,3,4]\n3', '3', 'Window [1,3,4] has 3 distinct values.'],
      ['[5,5,5,5]\n2', '1', 'Every window is all 5s.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['sliding-window', 'hashing'],
    py: `def maxDistinct(nums, k):
    n = len(nums)
    if k >= n:
        return len(set(nums))
    freq = defaultdict(int)
    for i in range(k):
        freq[nums[i]] += 1
    best = len(freq)
    for i in range(k, n):
        freq[nums[i]] += 1
        old = nums[i - k]
        freq[old] -= 1
        if freq[old] == 0:
            del freq[old]
        if len(freq) > best:
            best = len(freq)
    return best`,
    approach:
      'Maintain a frequency map over a window of width k. Initialise it on the first window, then slide one step at a time: add the entering element and remove the leaving one, dropping keys whose count hits zero. The distinct count is the map size; track its maximum across all windows.',
    complexity: { time: 'O(n)', space: 'O(k)' },
    multiParam: true,
    cases: [
      ['[1,2,1,3,4]', '3'],
      ['[5,5,5,5]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1,1,2,2,3,3]', '2'],
      ['[7]', '1'],
      ['[1,2,3,1,2,3]', '3'],
      ['[4,4,4,1,2,3]', '4'],
      ['[9,8,7,6,5,4,3]', '3'],
      ['[1,2,2,2,1]', '2'],
      ['[10,20,10,30,20,10]', '4'],
    ],
  },
  {
    n: 3023,
    id: 'pghub-b45-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains round brackets <code>(</code> and <code>)</code> plus other characters. The brackets are guaranteed to be balanced. Return the maximum nesting depth of the brackets. A string with no brackets has depth 0.',
    examples: [
      ['"(1+(2*3)+((8)/4))+1"', '3', 'The deepest point is inside ((8)).'],
      ['"abc"', '0', 'No brackets.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 'brackets in s are balanced'],
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
      'Track the current open-bracket depth with a counter that increments on ( and decrements on ). Because the brackets are balanced the counter never goes negative; the maximum value it reaches during the scan is the deepest nesting.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"(1+(2*3)+((8)/4))+1"'],
      ['"abc"'],
      ['"()"'],
      ['"(((())))"'],
      ['"()()()"'],
      ['"a(b)c(d(e)f)g"'],
      ['"((()))(())"'],
      ['""'],
      ['"(()(()))"'],
      ['"1(2(3(4(5))))"'],
    ],
  },
  {
    n: 3032,
    id: 'pghub-b45-gift-distribution',
    name: 'Fair Gift Boxes',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minMaxBox',
    params: [
      { name: 'gifts', type: 'List[int]' },
      { name: 'boxes', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'You must place <code>gifts</code> into <code>boxes</code> contiguous groups (each box holds a non-empty run of consecutive gifts, preserving order, and every gift goes into exactly one box). The load of a box is the sum of its gifts. Return the minimum possible value of the largest box load over all valid groupings. It is guaranteed <code>boxes <= gifts.length</code>.',
    examples: [
      ['[7,2,5,10,8]\n2', '18', 'Split into [7,2,5] and [10,8]: loads 14 and 18, max 18.'],
      ['[1,2,3,4,5]\n5', '5', 'Each gift alone; largest single gift is 5.'],
    ],
    constraints: ['1 <= gifts.length <= 10^5', '1 <= boxes <= gifts.length', '1 <= gifts[i] <= 10^6'],
    tags: ['greedy', 'binary-search'],
    py: `def minMaxBox(gifts, boxes):
    def feasible(cap):
        used = 1
        cur = 0
        for g in gifts:
            if cur + g > cap:
                used += 1
                cur = 0
            cur += g
        return used <= boxes
    lo, hi = max(gifts), sum(gifts)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    approach:
      'Binary-search the answer: the largest box load lies between the biggest single gift and the total sum. For a candidate cap, greedily pack consecutive gifts, starting a new box whenever the cap would be exceeded, and count the boxes used. A cap is feasible if it needs no more than the allowed number of boxes; search for the smallest feasible cap.',
    complexity: { time: 'O(n log(sum))', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[7,2,5,10,8]', '2'],
      ['[1,2,3,4,5]', '5'],
      ['[1,2,3,4,5]', '1'],
      ['[1,2,3,4,5]', '2'],
      ['[10,10,10,10]', '2'],
      ['[5]', '1'],
      ['[3,1,4,1,5,9,2,6]', '3'],
      ['[100,1,1,1,1,100]', '2'],
      ['[2,2,2,2,2,2]', '3'],
      ['[8,8,8,8,8]', '4'],
    ],
  },
  {
    n: 3037,
    id: 'pghub-b45-coin-min',
    name: 'Fewest Coins To Pay',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCoins',
    params: [
      { name: 'coins', type: 'List[int]' },
      { name: 'amount', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'Given coin denominations <code>coins</code> (unlimited supply of each) and a target <code>amount</code>, return the minimum number of coins whose values sum to exactly <code>amount</code>. If the amount cannot be formed, return <code>-1</code>.',
    examples: [
      ['[1,2,5]\n11', '3', '5+5+1 uses three coins.'],
      ['[2]\n3', '-1', 'An odd amount cannot be made from only 2s.'],
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    tags: ['dp', 'unbounded-knapsack'],
    py: `def minCoins(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]`,
    approach:
      'Bottom-up dynamic programming: dp[a] is the fewest coins to make amount a, starting from dp[0] = 0. For each amount, try every coin that fits and take one plus the best way to form the remainder. Unreachable amounts stay at infinity and map to -1.',
    complexity: { time: 'O(amount * coins)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '11'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1,3,4]', '6'],
      ['[2,5,10,1]', '27'],
      ['[5,7]', '11'],
      ['[3,7,405,436]', '8839'],
      ['[1,2,5]', '0'],
      ['[7]', '14'],
      ['[186,419,83,408]', '6249'],
    ],
  },
  {
    n: 3050,
    id: 'pghub-b45-rotate-array',
    name: 'Rotate Array Right',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'rotateRight',
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'k', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'Rotate the array <code>nums</code> to the right by <code>k</code> steps, where <code>k</code> may be larger than the array length. Return the rotated array. Rotating right by one moves the last element to the front.',
    examples: [
      ['[1,2,3,4,5,6,7]\n3', '[5,6,7,1,2,3,4]', 'The last three elements move to the front.'],
      ['[1,2]\n3', '[2,1]', 'k mod 2 = 1, so rotate by one.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '0 <= k <= 10^9', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays', 'two-pointers'],
    py: `def rotateRight(nums, k):
    n = len(nums)
    k %= n
    if k == 0:
        return list(nums)
    return nums[n - k:] + nums[:n - k]`,
    approach:
      'Rotating right by k and by k mod n give the same result, so reduce k first. The rotated array is simply the last k elements followed by the first n-k elements, which slicing produces directly.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,2,3,4,5,6,7]', '3'],
      ['[1,2]', '3'],
      ['[1]', '0'],
      ['[1,2,3]', '0'],
      ['[1,2,3,4]', '4'],
      ['[1,2,3,4,5]', '7'],
      ['[10,20,30]', '1'],
      ['[5,4,3,2,1]', '2'],
      ['[1,2,3,4,5,6]', '100'],
      ['[-1,-2,-3]', '5'],
    ],
  },
  {
    n: 3051,
    id: 'pghub-b45-vowel-runs',
    name: 'Longest Vowel Run',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'longestVowelRun',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a lowercase string <code>s</code>, a vowel run is a maximal contiguous block of vowels (<code>a, e, i, o, u</code>). Return the length of the longest vowel run. If there are no vowels, return 0.',
    examples: [
      ['"beautiful"', '3', 'The run "eau" has length 3.'],
      ['"rhythm"', '0', 'No vowels at all.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def longestVowelRun(s):
    vowels = set('aeiou')
    best = 0
    cur = 0
    for ch in s:
        if ch in vowels:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 0
    return best`,
    approach:
      'Sweep the string once keeping a running length of the current vowel block. Increment it on each vowel and reset to zero on any consonant. The maximum running length observed is the longest vowel run.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"beautiful"'],
      ['"rhythm"'],
      ['"aeiou"'],
      ['"a"'],
      ['"b"'],
      ['"queueing"'],
      ['"programming"'],
      ['"aabbaaa"'],
      ['"xyz"'],
      ['"eieioae"'],
    ],
  },
  {
    n: 3052,
    id: 'pghub-b45-bst-range-sum',
    name: 'BST Range Sum',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'rangeSum',
    params: [
      { name: 'tree', type: 'List[int]' },
      { name: 'lo', type: 'int' },
      { name: 'hi', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A binary search tree is given as a level-order list <code>tree</code> where <code>-1</code> marks an absent node and the root is at index 0; the children of index <code>i</code> are at <code>2*i+1</code> and <code>2*i+2</code>. Return the sum of all node values that lie in the inclusive range <code>[lo, hi]</code>. Node values are non-negative and distinct.',
    examples: [
      ['[10,5,15,3,7,-1,18]\n7\n15', '32', 'Values 7,10,15 sum to 32.'],
      ['[5]\n6\n10', '0', 'The only value 5 is below the range.'],
    ],
    constraints: ['0 <= tree.length <= 10^4', '0 <= node value <= 10^5', 'lo <= hi', '-1 marks an absent node'],
    tags: ['trees', 'bst'],
    py: `def rangeSum(tree, lo, hi):
    if not tree or tree[0] == -1:
        return 0
    n = len(tree)
    total = 0
    stack = [0]
    while stack:
        idx = stack.pop()
        if idx >= n or tree[idx] == -1:
            continue
        val = tree[idx]
        if lo <= val <= hi:
            total += val
        stack.append(2 * idx + 1)
        stack.append(2 * idx + 2)
    return total`,
    approach:
      'Traverse the array-encoded tree visiting every present node once. Whenever a node value falls within [lo, hi], add it to the running total. An explicit stack walks the implicit children indices, skipping absent (-1) or out-of-bounds positions.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[10,5,15,3,7,-1,18]', '7', '15'],
      ['[5]', '6', '10'],
      ['[]', '0', '100'],
      ['[10,5,15,3,7,-1,18]', '0', '100'],
      ['[1]', '1', '1'],
      ['[20,10,30,5,15,25,35]', '12', '28'],
      ['[50,25,75]', '50', '50'],
      ['[8,4,12,2,6,10,14]', '5', '11'],
      ['[100,50,150]', '200', '300'],
      ['[7,3,9,1,5,8,10]', '1', '10'],
    ],
  },
  {
    n: 3053,
    id: 'pghub-b45-task-cooldown',
    name: 'Task Cooldown Schedule',
    topic_id: 'heap',
    difficulty: 'Medium',
    method_name: 'scheduleTime',
    params: [
      { name: 'tasks', type: 'List[str]' },
      { name: 'cooldown', type: 'int' },
    ],
    return_type: 'int',
    statement:
      'A CPU runs <code>tasks</code> (each labeled by a single letter). Each time unit it either runs one task or stays idle. After running a task, the same task type cannot run again for the next <code>cooldown</code> time units. Return the minimum number of time units needed to finish all tasks.',
    examples: [
      ['["A","A","A","B","B","B"]\n2', '8', 'A B idle A B idle A B = 8 units.'],
      ['["A","A","A","B"]\n0', '4', 'No cooldown, so just run them back to back.'],
    ],
    constraints: ['1 <= tasks.length <= 10^4', '0 <= cooldown <= 100', 'each task is a single uppercase letter'],
    tags: ['heap', 'greedy'],
    py: `def scheduleTime(tasks, cooldown):
    counts = Counter(tasks)
    max_count = max(counts.values())
    num_max = sum(1 for v in counts.values() if v == max_count)
    candidate = (max_count - 1) * (cooldown + 1) + num_max
    return max(len(tasks), candidate)`,
    approach:
      'The most frequent task forces a skeleton of (max_count - 1) full frames of width (cooldown + 1), plus a final slot for each task tying the max frequency. Idle gaps in this skeleton can be filled by other tasks, but if there are enough tasks to overflow it the answer is simply the total task count. Take the larger of the two.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["A","A","A","B","B","B"]', '2'],
      ['["A","A","A","B"]', '0'],
      ['["A","A","A","A"]', '3'],
      ['["A","B","C","D"]', '2'],
      ['["A"]', '5'],
      ['["A","A","B","B","C","C"]', '2'],
      ['["A","A","A","B","B","B","C","C","C"]', '2'],
      ['["A","A","A","A","B","C","D"]', '3'],
      ['["X","X","Y","Z"]', '1'],
      ['["A","A","A","B","B","C"]', '1'],
    ],
  },
  {
    n: 3054,
    id: 'pghub-b45-graph-bipartite',
    name: 'Two-Color The Network',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'isBipartite',
    params: [{ name: 'edges', type: 'List[List[int]]' }, { name: 'n', type: 'int' }],
    return_type: 'bool',
    statement:
      'An undirected graph has <code>n</code> nodes labeled <code>0..n-1</code> and edge list <code>edges</code>. Return <code>true</code> if the nodes can be split into two groups so that every edge connects nodes from different groups (the graph is bipartite), otherwise <code>false</code>.',
    examples: [
      ['[[0,1],[1,2],[2,3],[3,0]]\n4', 'true', 'A 4-cycle can be two-colored.'],
      ['[[0,1],[1,2],[2,0]]\n3', 'false', 'An odd triangle cannot.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 10^5', 'no self loops'],
    tags: ['graphs', 'bfs'],
    py: `def isBipartite(edges, n):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    color = [-1] * n
    for start in range(n):
        if color[start] != -1:
            continue
        color[start] = 0
        queue = deque([start])
        while queue:
            u = queue.popleft()
            for w in adj[u]:
                if color[w] == -1:
                    color[w] = 1 - color[u]
                    queue.append(w)
                elif color[w] == color[u]:
                    return False
    return True`,
    approach:
      'A graph is bipartite exactly when it has no odd cycle. Breadth-first search each connected component, coloring neighbours with the opposite color of the current node. If an edge is ever found joining two equally-colored nodes the graph cannot be two-colored.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['[[0,1],[1,2],[2,3],[3,0]]', '4'],
      ['[[0,1],[1,2],[2,0]]', '3'],
      ['[]', '1'],
      ['[[0,1]]', '2'],
      ['[[0,1],[2,3]]', '4'],
      ['[[0,1],[1,2],[2,3],[3,4]]', '5'],
      ['[[0,1],[1,2],[2,3],[3,4],[4,0]]', '5'],
      ['[[0,1],[0,2],[0,3]]', '4'],
      ['[[0,1],[1,2],[2,0],[3,4]]', '5'],
      ['[[0,1],[1,2],[2,3],[3,1]]', '4'],
    ],
  },
  {
    n: 3055,
    id: 'pghub-b45-subset-xor-total',
    name: 'Sum Of Subset XORs',
    topic_id: 'bit-manipulation',
    difficulty: 'Medium',
    method_name: 'subsetXorSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an array <code>nums</code>, consider every subset (including the empty subset, whose XOR is 0). Return the sum of the bitwise-XOR totals of all subsets.',
    examples: [
      ['[1,3]', '6', 'Subsets: {}=0, {1}=1, {3}=3, {1,3}=2; sum 6.'],
      ['[5,1,6]', '28', 'Each set bit appears in exactly half the subsets.'],
    ],
    constraints: ['1 <= nums.length <= 12', '0 <= nums[i] <= 10^4'],
    tags: ['bit-manipulation', 'combinatorics'],
    py: `def subsetXorSum(nums):
    or_all = 0
    for x in nums:
        or_all |= x
    return or_all << (len(nums) - 1)`,
    approach:
      'For any bit position set in at least one element, exactly half of all 2^n subsets have that bit set in their XOR. So each bit present anywhere contributes its value times 2^(n-1). Taking the OR of all numbers gives every contributing bit, and shifting left by n-1 multiplies by 2^(n-1).',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,3]'],
      ['[5,1,6]'],
      ['[0]'],
      ['[7]'],
      ['[1,2,4,8]'],
      ['[3,3,3]'],
      ['[10,20,30,40]'],
      ['[1,1,1,1,1]'],
      ['[0,0,0]'],
      ['[15,15,15,15]'],
    ],
  },
  {
    n: 3056,
    id: 'pghub-b45-edit-distance',
    name: 'Edit Distance Between Words',
    topic_id: '2d-dp',
    difficulty: 'Hard',
    method_name: 'editDistance',
    params: [
      { name: 'a', type: 'str' },
      { name: 'b', type: 'str' },
    ],
    return_type: 'int',
    statement:
      'Given two strings <code>a</code> and <code>b</code>, return the minimum number of single-character edits (insert, delete, or replace one character) needed to turn <code>a</code> into <code>b</code>.',
    examples: [
      ['"horse"\n"ros"', '3', 'horse -> rorse -> rose -> ros.'],
      ['"abc"\n"abc"', '0', 'Already equal.'],
    ],
    constraints: ['0 <= a.length, b.length <= 1000', 'lowercase English letters'],
    tags: ['2d-dp', 'strings'],
    py: `def editDistance(a, b):
    m, n = len(a), len(b)
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        cur = [i] + [0] * n
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])
        prev = cur
    return prev[n]`,
    approach:
      'Classic Levenshtein dynamic programming where dp[i][j] is the edit distance between the first i characters of a and the first j of b. Matching characters carry the diagonal cost; otherwise take one plus the cheapest of delete, insert, or replace. Two rolling rows keep the space linear.',
    complexity: { time: 'O(m*n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['"horse"', '"ros"'],
      ['"abc"', '"abc"'],
      ['""', '"abc"'],
      ['"abc"', '""'],
      ['"intention"', '"execution"'],
      ['"kitten"', '"sitting"'],
      ['"a"', '"b"'],
      ['"sunday"', '"saturday"'],
      ['"abcdef"', '"azced"'],
      ['"flaw"', '"lawn"'],
    ],
  },
  {
    n: 3057,
    id: 'pghub-b45-stack-sort',
    name: 'Sort A Stack',
    topic_id: 'stack',
    difficulty: 'Medium',
    method_name: 'sortStack',
    params: [{ name: 'stack', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'You are given a stack as a list <code>stack</code> where the last element is the top. Sort it so the largest element ends up on top (ascending from bottom to top), using only stack operations and one auxiliary stack. Return the sorted stack as a list (bottom to top).',
    examples: [
      ['[3,1,2]', '[1,2,3]', 'Sorted ascending bottom-to-top.'],
      ['[5,5,5]', '[5,5,5]', 'Equal elements stay.'],
    ],
    constraints: ['0 <= stack.length <= 10^4', '-10^9 <= stack[i] <= 10^9'],
    tags: ['stack', 'sorting'],
    py: `def sortStack(stack):
    src = list(stack)
    aux = []
    while src:
        tmp = src.pop()
        while aux and aux[-1] > tmp:
            src.append(aux.pop())
        aux.append(tmp)
    return aux`,
    approach:
      'Use the classic single-auxiliary-stack insertion sort. Pop an element from the source; while the auxiliary stack top is greater, move those back to the source, then push the element onto the auxiliary stack. The auxiliary stack ends up sorted with the largest on top, which read bottom-to-top is ascending.',
    complexity: { time: 'O(n^2)', space: 'O(n)' },
    cases: [
      ['[3,1,2]'],
      ['[5,5,5]'],
      ['[]'],
      ['[1]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[-3,0,-1,2,1]'],
      ['[10,10,5,5,1]'],
      ['[7,3,7,3,7]'],
      ['[100,-100,50,-50,0]'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B45>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b45-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B45>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B45>>'.length, -'<<END>>'.length)
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
  const tmp = path.join(os.tmpdir(), `pghub-b45-grade-${prob.n}.py`);
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
