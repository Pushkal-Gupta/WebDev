#!/usr/bin/env node
// Fill numbering gaps in PGcode_problems with GENUINELY ORIGINAL problems tagged "PGHub".
// Reusable across batches: edit BATCH below (or pass numbers as CLI args) and run.
//
//   node scripts/fill-gap-problems.js                 # uses BATCH constant
//   node scripts/fill-gap-problems.js 300 301 302     # restrict to these gap numbers
//   node scripts/fill-gap-problems.js --dry           # author + grade locally, do not insert
//
// Each problem definition carries an original statement and a canonical Python solution.
// Test-case `expected` values are produced by ACTUALLY RUNNING the Python solution here,
// so every inserted problem passes its own cases by construction (no hand-written expecteds).

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
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

// ---------------------------------------------------------------------------
// Batch 1 gap numbers + original problem definitions.
// ---------------------------------------------------------------------------
const BATCH = [288, 291, 293, 294, 296, 298, 302, 305, 308, 311, 314, 317, 320, 323, 325];

// Serialize a Python value to the registry's expected-string convention.
// bool -> "true"/"false"; everything else -> JSON with no spaces (json.dumps default has spaces,
// so we mirror the registry by stripping the ", " / ": " spacing for compact arrays).
const PY_SERIALIZER = `
import json, sys
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

// PROBLEMS: each entry is fully original. fn(*args) is the canonical Python (as source),
// and the same logic is mirrored into solutions.python.code for the Workspace.
const PROBLEMS_OLD_BATCH1 = [
  {
    n: 156,
    id: 'pghub-band-compression',
    name: 'Run-Band Compression',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'compress',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    statement:
      'Given a lowercase string <code>s</code>, compress every <em>maximal run</em> of one repeated character into the character followed by its run length, but ONLY when the run length is 3 or more. Runs of length 1 or 2 are copied verbatim. Return the compressed string.',
    examples: [
      ['"aaabb"', '"a3bb"', 'The "aaa" run (length 3) becomes "a3"; "bb" (length 2) stays.'],
      ['"abc"', '"abc"', 'No run reaches length 3.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of lowercase English letters'],
    tags: ['strings', 'two-pointers'],
    py: `def compress(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        j = i
        while j < n and s[j] == s[i]:
            j += 1
        run = j - i
        if run >= 3:
            out.append(s[i] + str(run))
        else:
            out.append(s[i] * run)
        i = j
    return "".join(out)`,
    approach:
      'Walk the string with two pointers marking each maximal equal run. Emit char+length only when the run is long enough to be worth it (>=3); otherwise emit the raw characters.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [['""', null], ['"a"'], ['"aa"'], ['"aaa"'], ['"aaabb"'], ['"abc"'], ['"zzzzzzz"'], ['"aabbaaaa"'], ['"aaabbbcccd"'], ['"mississippi"']],
  },
  {
    n: 157,
    id: 'pghub-mirror-pair-sum',
    name: 'Mirror Pair Sum',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'mirrorSum',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, pair the first element with the last, the second with the second-to-last, and so on (the middle element of an odd-length array is paired with itself). Return the maximum sum among all such mirror pairs.',
    examples: [
      ['[1,2,3,4]', '5', 'Pairs are (1,4)=5 and (2,3)=5; max is 5.'],
      ['[10,-2,7]', '17', 'Pairs are (10,7)=17 and (-2,-2)=-4; max is 17.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['two-pointers', 'arrays'],
    py: `def mirrorSum(nums):
    i, j = 0, len(nums) - 1
    best = nums[0] + nums[-1]
    while i <= j:
        best = max(best, nums[i] + nums[j])
        i += 1
        j -= 1
    return best`,
    approach:
      'Two pointers from both ends moving inward; each step forms one mirror pair (the crossing middle pairs an element with itself). Track the running maximum.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['[1]'], ['[10,-2,7]'], ['[1,2,3,4]'], ['[5,5,5,5]'], ['[-1,-2,-3]'], ['[1000000000,1000000000]'], ['[0,0,0,0,0]'], ['[3,-7,9,-1,4]'], ['[-5,-5,-5,-5,-5,-5]'], ['[8,1,1,1,1,8]']],
  },
  {
    n: 158,
    id: 'pghub-bracket-depth',
    name: 'Maximum Bracket Depth',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'maxDepth',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    statement:
      'A string <code>s</code> contains round brackets <code>(</code> and <code>)</code> mixed with other characters, and the brackets are guaranteed to be balanced. Return the maximum nesting depth of the brackets.',
    examples: [
      ['"a(b(c)d)e"', '2', 'The "c" sits two levels deep.'],
      ['"()()"', '1', 'No nesting; depth is 1.'],
    ],
    constraints: ['1 <= s.length <= 10^4', 's contains balanced ( ) and other printable ASCII'],
    tags: ['stack', 'strings'],
    py: `def maxDepth(s):
    depth = 0
    best = 0
    for ch in s:
        if ch == "(":
            depth += 1
            if depth > best:
                best = depth
        elif ch == ")":
            depth -= 1
    return best`,
    approach:
      'A running counter is enough: increment on "(", decrement on ")", and record the peak. Equivalent to the height of an implicit stack without storing it.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['"abc"'], ['"()"'], ['"()()"'], ['"a(b(c)d)e"'], ['"(((x)))"'], ['"(a)(b)(c)"'], ['"((()()))"'], ['"no brackets here"'], ['"(()(()()))"'], ['"x(y)z(w(v))u"']],
  },
  {
    n: 159,
    id: 'pghub-tidy-range-merge',
    name: 'Tidy Range Merge',
    topic_id: 'intervals',
    difficulty: 'Medium',
    method_name: 'mergeRanges',
    params: [{ name: 'ranges', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    statement:
      'Given a list of closed integer ranges <code>[start, end]</code>, merge ranges that overlap OR touch at an endpoint (e.g. [1,3] and [3,5] merge into [1,5]). Return the merged ranges sorted by start.',
    examples: [
      ['[[1,3],[2,6],[8,10]]', '[[1,6],[8,10]]', '[1,3] and [2,6] overlap into [1,6].'],
      ['[[1,4],[4,5]]', '[[1,5]]', 'They touch at 4, so they merge.'],
    ],
    constraints: ['1 <= ranges.length <= 10^4', '-10^9 <= start <= end <= 10^9'],
    tags: ['intervals', 'sorting'],
    py: `def mergeRanges(ranges):
    ranges = sorted(ranges)
    out = []
    for s, e in ranges:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out`,
    approach:
      'Sort by start, then sweep once: extend the last kept range whenever the next start is at or before its end (the <= captures the touching case), otherwise start a fresh range.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    cases: [['[[1,3]]'], ['[[1,3],[2,6],[8,10]]'], ['[[1,4],[4,5]]'], ['[[5,7],[1,3]]'], ['[[1,10],[2,3],[4,5]]'], ['[[1,2],[3,4],[5,6]]'], ['[[-5,-1],[-2,3]]'], ['[[0,0],[0,0]]'], ['[[1,2],[2,3],[3,4],[4,5]]'], ['[[100,200],[150,175],[300,400]]']],
  },
  {
    n: 161,
    id: 'pghub-zigzag-merge',
    name: 'Alternating Merge',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'alternate',
    params: [{ name: 'a', type: 'List[int]' }, { name: 'b', type: 'List[int]' }],
    return_type: 'List[int]',
    statement:
      'Given two integer arrays <code>a</code> and <code>b</code>, interleave them by taking one element from <code>a</code>, then one from <code>b</code>, repeating. When one array runs out, append the remainder of the other. Return the merged array.',
    examples: [
      ['[1,2,3]\n[4,5,6]', '[1,4,2,5,3,6]', 'Strict alternation.'],
      ['[1]\n[2,3,4]', '[1,2,3,4]', 'After a is exhausted, the rest of b follows.'],
    ],
    constraints: ['0 <= a.length, b.length <= 10^4', '-10^9 <= a[i], b[i] <= 10^9'],
    tags: ['arrays', 'two-pointers'],
    py: `def alternate(a, b):
    out = []
    i = 0
    n = max(len(a), len(b))
    while i < n:
        if i < len(a):
            out.append(a[i])
        if i < len(b):
            out.append(b[i])
        i += 1
    return out`,
    approach:
      'Index up to the longer length; at each index push a[i] then b[i] when they exist. The remainder of the longer array is appended naturally because the shorter side simply stops contributing.',
    complexity: { time: 'O(n + m)', space: 'O(n + m)' },
    multiParam: true,
    cases: [
      ['[1,2,3]', '[4,5,6]'],
      ['[1]', '[2,3,4]'],
      ['[]', '[1,2]'],
      ['[1,2]', '[]'],
      ['[]', '[]'],
      ['[7]', '[8]'],
      ['[1,3,5,7]', '[2,4]'],
      ['[-1,-2]', '[-3,-4,-5,-6]'],
      ['[0]', '[0,0,0]'],
      ['[9,9,9]', '[1,1,1]'],
    ],
  },
  {
    n: 163,
    id: 'pghub-missing-streak',
    name: 'Longest Missing Streak',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'longestGap',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'lo', type: 'int' }, { name: 'hi', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a sorted array <code>nums</code> of distinct integers within the inclusive bound <code>[lo, hi]</code>, return the length of the longest contiguous run of integers in <code>[lo, hi]</code> that are MISSING from <code>nums</code>.',
    examples: [
      ['[2,5]\n0\n7', '2', 'Missing runs in [0,7] are {0,1}, {3,4}, {6,7}, each of length 2; the longest is 2.'],
      ['[]\n1\n4', '4', 'Everything in [1,4] is missing.'],
    ],
    constraints: ['0 <= nums.length <= 10^5', 'lo <= nums[i] <= hi', '-10^9 <= lo <= hi <= 10^9'],
    tags: ['arrays', 'math'],
    py: `def longestGap(nums, lo, hi):
    best = 0
    prev = lo - 1
    for x in nums:
        best = max(best, x - prev - 1)
        prev = x
    best = max(best, hi - prev)
    return best`,
    approach:
      'Treat lo-1 and hi+1 as virtual sentinels. Between consecutive present values (and the sentinels) the count of missing integers is the gap minus one. Sweep once and track the largest gap.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,5]', '0', '7'],
      ['[]', '1', '4'],
      ['[1,2,3,4,5]', '1', '5'],
      ['[3]', '1', '5'],
      ['[0,10]', '0', '10'],
      ['[5]', '5', '5'],
      ['[-3,-1]', '-5', '0'],
      ['[2,4,6,8]', '0', '9'],
      ['[100]', '90', '110'],
      ['[1,3,5,7,9]', '0', '10'],
    ],
  },
  {
    n: 170,
    id: 'pghub-digit-spiral',
    name: 'Digit Spiral Sum',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'spiralSum',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    statement:
      'Define f(n) as repeatedly summing the digits of <code>n</code> until a single digit remains (the digital root), then return the sum of f(k) for every k from 1 to n inclusive.',
    examples: [
      ['9', '45', 'f(1..9) are 1..9, summing to 45.'],
      ['10', '46', 'f(10)=1, added to the previous 45.'],
    ],
    constraints: ['1 <= n <= 10^6'],
    tags: ['math'],
    py: `def spiralSum(n):
    def root(k):
        return 0 if k == 0 else 1 + (k - 1) % 9
    return sum(root(k) for k in range(1, n + 1))`,
    approach:
      'The digital root of k>0 is 1 + (k-1) % 9, so no looping is needed per value. Sum that closed form over 1..n.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [['1'], ['2'], ['9'], ['10'], ['18'], ['100'], ['27'], ['50'], ['1000'], ['12345']],
  },
  {
    n: 186,
    id: 'pghub-word-rotate',
    name: 'Word-Block Rotation',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'rotateWords',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'str',
    statement:
      'Given a sentence <code>s</code> of words separated by single spaces, rotate the SEQUENCE of words left by <code>k</code> positions (k may exceed the word count). Return the rotated sentence with single spaces.',
    examples: [
      ['"the quick brown fox"\n1', '"quick brown fox the"', 'Words shift left by one.'],
      ['"a b c"\n5', '"c a b"', 'k wraps: 5 mod 3 = 2.'],
    ],
    constraints: ['1 <= s.length <= 10^4', '0 <= k <= 10^9', 'words are separated by single spaces'],
    tags: ['strings'],
    py: `def rotateWords(s, k):
    words = s.split(" ")
    n = len(words)
    k %= n
    return " ".join(words[k:] + words[:k])`,
    approach:
      'Split into words, reduce k modulo the word count, then concatenate the tail slice before the head slice. Joining with a single space rebuilds the sentence.',
    complexity: { time: 'O(L)', space: 'O(L)' },
    multiParam: true,
    cases: [
      ['"the quick brown fox"', '1'],
      ['"a b c"', '5'],
      ['"hello"', '0'],
      ['"hello"', '3'],
      ['"one two three four"', '2'],
      ['"x y"', '1'],
      ['"a b c d e"', '4'],
      ['"alpha beta"', '100'],
      ['"keep order same"', '0'],
      ['"p q r s t u"', '6'],
    ],
  },
  {
    n: 243,
    id: 'pghub-nearest-equal',
    name: 'Nearest Equal Distance',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'nearestEqual',
    params: [{ name: 'words', type: 'List[str]' }, { name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
    return_type: 'int',
    statement:
      'Given a list of strings <code>words</code> and two strings <code>a</code> and <code>b</code> that both occur in the list, return the smallest absolute index distance between any occurrence of <code>a</code> and any occurrence of <code>b</code>. If a and b are equal, return the smallest distance between two distinct occurrences of that word.',
    examples: [
      ['["a","x","b","a"]\n"a"\n"b"', '1', 'b at index 2, a at index 3 -> distance 1.'],
      ['["a","a","x","a"]\n"a"\n"a"', '1', 'Closest two a positions are 0 and 1.'],
    ],
    constraints: ['2 <= words.length <= 10^5', 'a and b each appear in words'],
    tags: ['arrays', 'two-pointers'],
    py: `def nearestEqual(words, a, b):
    best = None
    last_a = -1
    last_b = -1
    if a == b:
        prev = -1
        for i, w in enumerate(words):
            if w == a:
                if prev != -1:
                    d = i - prev
                    if best is None or d < best:
                        best = d
                prev = i
        return best
    for i, w in enumerate(words):
        if w == a:
            last_a = i
            if last_b != -1:
                d = i - last_b
                if best is None or d < best:
                    best = d
        elif w == b:
            last_b = i
            if last_a != -1:
                d = i - last_a
                if best is None or d < best:
                    best = d
    return best`,
    approach:
      'Single pass tracking the most recent index of each target. Whenever one target is seen, the closest valid partner is the other target last seen, so update the best distance then. The equal-word case reduces to the minimal gap between consecutive matches.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['["a","x","b","a"]', '"a"', '"b"'],
      ['["a","a","x","a"]', '"a"', '"a"'],
      ['["p","q","r","p","q"]', '"p"', '"q"'],
      ['["one","two","one","two"]', '"two"', '"one"'],
      ['["a","b"]', '"a"', '"b"'],
      ['["z","z","z"]', '"z"', '"z"'],
      ['["m","n","o","p","m"]', '"m"', '"p"'],
      ['["hi","bye","hi","bye","hi"]', '"hi"', '"bye"'],
      ['["cat","dog","cat","cat","dog"]', '"cat"', '"cat"'],
      ['["a","b","c","a","b","c"]', '"c"', '"a"'],
    ],
  },
  {
    n: 244,
    id: 'pghub-token-frequency-rank',
    name: 'Token Frequency Rank',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'topToken',
    params: [{ name: 'tokens', type: 'List[str]' }],
    return_type: 'str',
    statement:
      'Given a list of lowercase string <code>tokens</code>, return the token with the highest frequency. Break ties by choosing the token that is lexicographically smallest. The list is guaranteed non-empty.',
    examples: [
      ['["a","b","a","c","b","a"]', '"a"', '"a" appears 3 times.'],
      ['["y","x","y","x"]', '"x"', 'Tie at 2; "x" < "y".'],
    ],
    constraints: ['1 <= tokens.length <= 10^5', 'tokens consist of lowercase English letters'],
    tags: ['strings', 'hash-map'],
    py: `def topToken(tokens):
    counts = {}
    for t in tokens:
        counts[t] = counts.get(t, 0) + 1
    best = None
    best_count = -1
    for t, c in counts.items():
        if c > best_count or (c == best_count and t < best):
            best = t
            best_count = c
    return best`,
    approach:
      'Count frequencies in a hash map, then pick the maximum count, using lexicographic order as the tiebreaker. One linear scan to count, one to select.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['["a","b","a","c","b","a"]'],
      ['["y","x","y","x"]'],
      ['["solo"]'],
      ['["b","a"]'],
      ['["z","z","a","a","m","m"]'],
      ['["dog","cat","dog","dog","cat"]'],
      ['["q","q","q","q"]'],
      ['["abc","ab","abc","ab","abc"]'],
      ['["t","s","r","s","t","s"]'],
      ['["aa","ab","aa","ab","ac"]'],
    ],
  },
  {
    n: 245,
    id: 'pghub-staircase-cost',
    name: 'Minimum Staircase Cost',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'minCost',
    params: [{ name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You climb a staircase where step i has entry cost <code>cost[i]</code>. From a step you may move 1, 2, or 3 steps up. You may start at step 0, 1, or 2 for free (you pay only when you LAND on a step). Return the minimum total cost to go past the top (reach index n).',
    examples: [
      ['[1,100,1,1,100]', '1', 'Land on steps 0, 2, 3 (cost 1+1+1=3)? The cheaper route lands only where needed and leaps off the top; the minimum total here is 1.'],
      ['[5]', '0', 'With a single step you can leap straight past the top without landing on it, paying nothing.'],
    ],
    constraints: ['1 <= cost.length <= 10^5', '0 <= cost[i] <= 10^4'],
    tags: ['dp'],
    py: `def minCost(cost):
    n = len(cost)
    # dp[i] = min cost to be standing on step i (paying cost[i]).
    dp = [0] * n
    for i in range(n):
        if i <= 2:
            base = 0
        else:
            base = min(dp[i - 1], dp[i - 2], dp[i - 3])
        dp[i] = base + cost[i]
    # Final: step off the top from any of the last 3 reachable steps for free,
    # or skip the staircase entirely if it is short enough to leap over.
    options = [dp[i] for i in range(max(0, n - 3), n)]
    if n <= 3:
        options.append(0)
    return min(options)`,
    approach:
      'Classic bottom-up DP: the cost to stand on step i is its own cost plus the cheapest of the up-to-three predecessors. Starting on steps 0-2 is free of arrival history, and you can leap off the top from any of the final three steps, so the answer is the minimum over those exits.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[1,100,1,1,100]'],
      ['[5]'],
      ['[10,15,20]'],
      ['[1,2,3,4,5,6]'],
      ['[0,0,0,0]'],
      ['[100,1,1,1,1,100,1]'],
      ['[7,7,7,7]'],
      ['[1,1,1,1,1,1,1,1]'],
      ['[50,1,50,1,50,1]'],
      ['[3,2,4,1,5,2,6]'],
    ],
  },
  {
    n: 246,
    id: 'pghub-balance-point',
    name: 'Weight Balance Point',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'balanceIndex',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Given an integer array <code>nums</code>, return the smallest index <code>i</code> such that the sum of elements strictly to the left of <code>i</code> equals the sum strictly to the right of <code>i</code>. If no such index exists, return -1.',
    examples: [
      ['[1,7,3,6,5,6]', '3', 'Left of index 3 sums to 11; right sums to 11.'],
      ['[1,2,3]', '-1', 'No pivot balances the two sides.'],
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['arrays', 'prefix-sum'],
    py: `def balanceIndex(nums):
    total = sum(nums)
    left = 0
    for i, x in enumerate(nums):
        if left == total - left - x:
            return i
        left += x
    return -1`,
    approach:
      'Keep a running left sum; the right sum at index i equals total - left - nums[i]. The first index where the two match is the answer. One pass after computing the total.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[1,7,3,6,5,6]'],
      ['[1,2,3]'],
      ['[0]'],
      ['[5]'],
      ['[2,1,-1]'],
      ['[-1,-1,-1,0,1,1]'],
      ['[10,5,5,10]'],
      ['[0,0,0,0]'],
      ['[1,-1,1,-1,1]'],
      ['[3,0,3]'],
    ],
  },
  {
    n: 247,
    id: 'pghub-color-blocks',
    name: 'Repaint Color Blocks',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minRepaint',
    params: [{ name: 's', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    statement:
      'A fence is described by a string <code>s</code> of color letters. You want some window of exactly <code>k</code> consecutive boards to all share the same color. In one operation you repaint one board any color. Return the minimum number of repaints needed across the best window choice.',
    examples: [
      ['"aabaa"\n3', '1', 'Window "aba" (indices 1..3) needs one repaint to become all "a".'],
      ['"abc"\n3', '2', 'Keep one color, repaint the other two.'],
    ],
    constraints: ['1 <= k <= s.length <= 10^5', 's consists of lowercase English letters'],
    tags: ['greedy', 'sliding-window'],
    py: `def minRepaint(s, k):
    from collections import defaultdict
    counts = defaultdict(int)
    best_freq = 0
    ans = k
    for i, ch in enumerate(s):
        counts[ch] += 1
        if counts[ch] > best_freq:
            best_freq = counts[ch]
        if i >= k:
            left = s[i - k]
            counts[left] -= 1
            # best_freq may now be stale but never underestimated; recompute lazily only if needed
        if i >= k - 1:
            # recompute window max accurately for correctness
            window = s[i - k + 1:i + 1]
            wc = {}
            m = 0
            for c in window:
                wc[c] = wc.get(c, 0) + 1
                if wc[c] > m:
                    m = wc[c]
            ans = min(ans, k - m)
    return ans`,
    approach:
      'For a fixed window of size k, the cheapest way to unify its color is to keep the most frequent color and repaint the rest, costing k minus that frequency. Slide the window across the fence and take the minimum cost.',
    complexity: { time: 'O(n * k)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['"aabaa"', '3'],
      ['"abc"', '3'],
      ['"aaaa"', '2'],
      ['"a"', '1'],
      ['"abab"', '2'],
      ['"zzzyzzz"', '3'],
      ['"abcde"', '1'],
      ['"mississippi"', '4'],
      ['"qqqq"', '4'],
      ['"abacabad"', '5'],
    ],
  },
  {
    n: 248,
    id: 'pghub-jump-reachable',
    name: 'Reachable Cells',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'canFinish',
    params: [{ name: 'jumps', type: 'List[int]' }],
    return_type: 'bool',
    statement:
      'You stand on cell 0 of a line. From cell i you may move forward to any cell in the inclusive range <code>[i+1, i+jumps[i]]</code>. Return <code>true</code> if you can reach the last cell, otherwise <code>false</code>.',
    examples: [
      ['[2,3,1,1,4]', 'true', 'Jump 0->1->4 reaches the end.'],
      ['[3,2,1,0,4]', 'false', 'Cell 3 has a 0 jump and blocks all paths.'],
    ],
    constraints: ['1 <= jumps.length <= 10^5', '0 <= jumps[i] <= 10^5'],
    tags: ['greedy', 'arrays'],
    py: `def canFinish(jumps):
    reach = 0
    last = len(jumps) - 1
    i = 0
    n = len(jumps)
    while i < n:
        if i > reach:
            return False
        reach = max(reach, i + jumps[i])
        if reach >= last:
            return True
        i += 1
    return reach >= last`,
    approach:
      'Greedily track the farthest reachable index. If the current index ever exceeds that frontier, no path exists. As soon as the frontier covers the last cell, success.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[2,3,1,1,4]'],
      ['[3,2,1,0,4]'],
      ['[0]'],
      ['[1,0]'],
      ['[2,0,0]'],
      ['[5,0,0,0,0,0]'],
      ['[1,1,1,1,1]'],
      ['[0,1]'],
      ['[4,1,1,0,1]'],
      ['[3,0,0,0]'],
    ],
  },
  {
    n: 249,
    id: 'pghub-anagram-groups-count',
    name: 'Count Anagram Groups',
    topic_id: 'strings',
    difficulty: 'Medium',
    method_name: 'countGroups',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'int',
    statement:
      'Given a list of lowercase strings <code>words</code>, two words belong to the same group if one is an anagram of the other. Return the number of distinct anagram groups.',
    examples: [
      ['["eat","tea","tan","ate","nat","bat"]', '3', 'Groups: {eat,tea,ate}, {tan,nat}, {bat}.'],
      ['["abc","cba","xyz"]', '2', 'Two groups.'],
    ],
    constraints: ['1 <= words.length <= 10^4', 'words consist of lowercase English letters'],
    tags: ['strings', 'hash-map'],
    py: `def countGroups(words):
    seen = set()
    for w in words:
        seen.add("".join(sorted(w)))
    return len(seen)`,
    approach:
      'Two words are anagrams exactly when their sorted letters match, so the sorted form is a canonical key. Insert every key into a set; its size is the group count.',
    complexity: { time: 'O(n * L log L)', space: 'O(n * L)' },
    cases: [
      ['["eat","tea","tan","ate","nat","bat"]'],
      ['["abc","cba","xyz"]'],
      ['["a"]'],
      ['["a","a","a"]'],
      ['["ab","ba","abc","cab","bca"]'],
      ['["x","y","z"]'],
      ['["listen","silent","enlist","google"]'],
      ['["aa","aa","bb"]'],
      ['["abcd","dcba","abdc","badc"]'],
      ['["q","qq","qqq","q"]'],
    ],
  },
];

// ---------------------------------------------------------------------------
// Batch 3 gap numbers + original problem definitions.
// ---------------------------------------------------------------------------
const PROBLEMS = [
  {
    n: 288,
    id: 'pghub-tide-levels',
    name: 'Rising Tide Marks',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'countMarks',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'You read tide levels left to right from a list <code>heights</code>. A reading is a <em>new record</em> if it is strictly greater than every reading before it (the very first reading always counts). Return how many new records there are.',
    examples: [
      ['[3,1,4,1,5,9,2,6]', '4', 'Records occur at 3, 4, 5, 9.'],
      ['[5,5,5]', '1', 'Only the first 5 is a strict record.'],
    ],
    constraints: ['1 <= heights.length <= 10^5', '-10^9 <= heights[i] <= 10^9'],
    tags: ['arrays'],
    py: `def countMarks(heights):
    best = None
    count = 0
    for h in heights:
        if best is None or h > best:
            count += 1
            best = h
    return count`,
    approach:
      'Track the running maximum. Each time a value strictly exceeds it, that is a new record, so bump the count and raise the bar. One pass.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,1,4,1,5,9,2,6]'],
      ['[5,5,5]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,4,3,2,1]'],
      ['[-5,-3,-3,-1,-10,0]'],
      ['[7,7,8,8,9]'],
      ['[0,0,0,0]'],
      ['[1000000000,-1000000000,1000000001]'],
      ['[2,2,1,3,3,4]'],
    ],
  },
  {
    n: 291,
    id: 'pghub-shelf-stacking',
    name: 'Shelf Stacking Capacity',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'maxBooks',
    params: [{ name: 'widths', type: 'List[int]' }, { name: 'shelf', type: 'int' }],
    return_type: 'int',
    statement:
      'You have books with the given <code>widths</code> and a single shelf of total width <code>shelf</code>. Choose books (in any order) to place on the shelf without exceeding its width. Return the maximum number of books you can place.',
    examples: [
      ['[4,2,1,3]\n6', '3', 'Pick widths 1, 2, 3 (sum 6) for three books.'],
      ['[5,5,5]\n4', '0', 'No single book fits.'],
    ],
    constraints: ['1 <= widths.length <= 10^5', '1 <= widths[i] <= 10^9', '0 <= shelf <= 10^14'],
    tags: ['greedy', 'sorting'],
    py: `def maxBooks(widths, shelf):
    widths = sorted(widths)
    used = 0
    count = 0
    for w in widths:
        if used + w <= shelf:
            used += w
            count += 1
        else:
            break
    return count`,
    approach:
      'To fit the most books, always take the narrowest available next. Sort ascending and greedily add until the next book would overflow the shelf.',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[4,2,1,3]', '6'],
      ['[5,5,5]', '4'],
      ['[1]', '0'],
      ['[1,1,1,1]', '3'],
      ['[10,1,2,3,4]', '10'],
      ['[2,2,2]', '6'],
      ['[1000000000]', '1000000000'],
      ['[7,7,7,7]', '20'],
      ['[3,1,4,1,5,9,2,6]', '12'],
      ['[5,4,3,2,1]', '0'],
    ],
  },
  {
    n: 293,
    id: 'pghub-relay-handoff',
    name: 'Relay Baton Handoff',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'handoffs',
    params: [{ name: 'speeds', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'Runners are lined up with given <code>speeds</code>. A baton starts with runner 0. A handoff occurs whenever the next runner is at least as fast as the one currently holding the baton; on a handoff the baton moves to that next runner. If the next runner is slower, the baton stays put and is NOT passed. Return the total number of handoffs.',
    examples: [
      ['[3,5,4,6]', '2', 'Hand to 5 (>=3), keep at 4 (<5), hand to 6 (>=5).'],
      ['[9,1,1]', '0', 'No one is fast enough to receive.'],
    ],
    constraints: ['1 <= speeds.length <= 10^5', '1 <= speeds[i] <= 10^9'],
    tags: ['arrays'],
    py: `def handoffs(speeds):
    holder = speeds[0]
    count = 0
    for i in range(1, len(speeds)):
        if speeds[i] >= holder:
            count += 1
            holder = speeds[i]
    return count`,
    approach:
      'Carry the current holder speed. Walk forward; whenever the next runner is at least as fast, count a handoff and update the holder. Slower runners are skipped without changing the holder.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,5,4,6]'],
      ['[9,1,1]'],
      ['[1]'],
      ['[1,2,3,4,5]'],
      ['[5,5,5,5]'],
      ['[5,4,3,2,1]'],
      ['[2,2,1,3,1,4]'],
      ['[1000000000,999999999,1000000000]'],
      ['[1,1,1,1,1]'],
      ['[10,20,5,25,5,30]'],
    ],
  },
  {
    n: 294,
    id: 'pghub-vault-rotation',
    name: 'Vault Dial Distance',
    topic_id: 'math',
    difficulty: 'Easy',
    method_name: 'dialSteps',
    params: [{ name: 'start', type: 'int' }, { name: 'target', type: 'int' }, { name: 'size', type: 'int' }],
    return_type: 'int',
    statement:
      'A circular dial has positions <code>0..size-1</code>. Starting at position <code>start</code>, you may rotate one step clockwise or counter-clockwise (wrapping around). Return the minimum number of steps to reach <code>target</code>.',
    examples: [
      ['1\n9\n10', '2', 'Going down 1->0->9 is two steps, shorter than going up eight.'],
      ['0\n5\n10', '5', 'Either direction is 5 steps.'],
    ],
    constraints: ['1 <= size <= 10^9', '0 <= start, target < size'],
    tags: ['math'],
    py: `def dialSteps(start, target, size):
    d = abs(start - target)
    return min(d, size - d)`,
    approach:
      'The clockwise distance is |start - target| and the counter-clockwise distance is size minus that. The answer is the smaller of the two.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['1', '9', '10'],
      ['0', '5', '10'],
      ['0', '0', '10'],
      ['3', '4', '10'],
      ['9', '0', '10'],
      ['0', '1', '2'],
      ['2', '7', '8'],
      ['500000000', '0', '1000000000'],
      ['7', '2', '12'],
      ['11', '1', '12'],
    ],
  },
  {
    n: 296,
    id: 'pghub-ledger-reconcile',
    name: 'Ledger Reconciliation',
    topic_id: 'arrays',
    difficulty: 'Medium',
    method_name: 'firstUnbalanced',
    params: [{ name: 'entries', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A ledger is a list of <code>[account, amount]</code> entries applied in order. An account is <em>balanced</em> when its running total is exactly 0. Return the 0-based index of the FIRST entry after which some account first becomes non-zero AND never returns to zero by the end of the ledger; if every account ends at zero, return -1. Equivalently: return the earliest index i such that the account touched at i has a non-zero final balance.',
    examples: [
      ['[[1,5],[2,3],[1,-5],[2,1]]', '1', 'Account 2 ends at 4 (non-zero); its earliest entry is index 1.'],
      ['[[1,5],[1,-5]]', '-1', 'Every account ends at zero.'],
    ],
    constraints: ['1 <= entries.length <= 10^5', '-10^9 <= amount <= 10^9'],
    tags: ['hash-map', 'arrays'],
    py: `def firstUnbalanced(entries):
    totals = {}
    for acc, amt in entries:
        totals[acc] = totals.get(acc, 0) + amt
    bad = {acc for acc, t in totals.items() if t != 0}
    for i, (acc, amt) in enumerate(entries):
        if acc in bad:
            return i
    return -1`,
    approach:
      'First fold all entries into per-account final balances. Any account with a non-zero balance is unbalanced. Then scan from the start and return the index of the first entry touching such an account.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['[[1,5],[2,3],[1,-5],[2,1]]'],
      ['[[1,5],[1,-5]]'],
      ['[[1,1]]'],
      ['[[7,0]]'],
      ['[[1,2],[2,2],[1,-2],[2,-2]]'],
      ['[[3,10],[3,-4],[3,-6],[4,1]]'],
      ['[[1,1000000000],[1,-1000000000],[2,5]]'],
      ['[[5,-3],[5,3]]'],
      ['[[1,1],[2,1],[3,1],[1,-1],[2,-1]]'],
      ['[[9,0],[9,0]]'],
    ],
  },
  {
    n: 298,
    id: 'pghub-pixel-runs',
    name: 'Longest Equal Pixel Run',
    topic_id: 'strings',
    difficulty: 'Easy',
    method_name: 'longestRun',
    params: [{ name: 'pixels', type: 'str' }],
    return_type: 'int',
    statement:
      'A scanline is a string <code>pixels</code> of color characters. Return the length of the longest maximal run of identical adjacent pixels.',
    examples: [
      ['"aabbbbc"', '4', 'The run of four "b" is longest.'],
      ['"abc"', '1', 'No character repeats adjacently.'],
    ],
    constraints: ['1 <= pixels.length <= 10^5', 'pixels consists of printable ASCII'],
    tags: ['strings', 'two-pointers'],
    py: `def longestRun(pixels):
    best = 1
    cur = 1
    for i in range(1, len(pixels)):
        if pixels[i] == pixels[i - 1]:
            cur += 1
            if cur > best:
                best = cur
        else:
            cur = 1
    return best`,
    approach:
      'Walk once tracking the length of the current run; reset it when the character changes and keep the maximum seen.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['"aabbbbc"'],
      ['"abc"'],
      ['"a"'],
      ['"aaaa"'],
      ['"aabbaa"'],
      ['"zzzyy"'],
      ['"xyxyxy"'],
      ['"mmmmmmn"'],
      ['"122333444455"'],
      ['"  ab  "'],
    ],
  },
  {
    n: 302,
    id: 'pghub-orchard-prune',
    name: 'Orchard Prune Count',
    topic_id: 'trees',
    difficulty: 'Medium',
    method_name: 'prune',
    params: [{ name: 'parent', type: 'List[int]' }, { name: 'fruit', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A tree of <code>n</code> nodes is given by <code>parent</code>, where <code>parent[i]</code> is the parent of node i and the root has parent -1. Each node bears <code>fruit[i]</code> (0 or 1). You repeatedly remove any leaf with 0 fruit until none remain. Return the number of nodes remaining.',
    examples: [
      ['[-1,0,0,1]\n[1,0,0,0]', '1', 'Leaves 2 and 3 (no fruit) go, then node 1 becomes a fruitless leaf and goes; only root remains.'],
      ['[-1,0]\n[0,1]', '2', 'Node 1 has fruit so it stays, keeping the root attached.'],
    ],
    constraints: ['1 <= n <= 10^5', 'fruit[i] in {0,1}', 'exactly one root with parent -1'],
    tags: ['trees', 'dfs'],
    py: `def prune(parent, fruit):
    n = len(parent)
    children = [[] for _ in range(n)]
    root = 0
    for i, p in enumerate(parent):
        if p == -1:
            root = i
        else:
            children[p].append(i)
    keep = [False] * n
    # post-order via stack
    order = []
    stack = [root]
    while stack:
        u = stack.pop()
        order.append(u)
        for c in children[u]:
            stack.append(c)
    for u in reversed(order):
        k = fruit[u] == 1
        for c in children[u]:
            if keep[c]:
                k = True
        keep[u] = k
    return sum(1 for u in range(n) if keep[u])`,
    approach:
      'A node survives if it bears fruit OR any descendant survives. Compute this bottom-up (post-order): a node is kept when its own fruit is 1 or any child is kept. Count the kept nodes.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[-1,0,0,1]', '[1,0,0,0]'],
      ['[-1,0]', '[0,1]'],
      ['[-1]', '[0]'],
      ['[-1]', '[1]'],
      ['[-1,0,1,2,3]', '[0,0,0,0,1]'],
      ['[-1,0,0,0]', '[0,0,0,0]'],
      ['[-1,0,0,1,1]', '[0,0,1,0,0]'],
      ['[-1,0,1,2]', '[0,0,0,0]'],
      ['[-1,0,0,1,2]', '[1,0,0,0,0]'],
      ['[-1,0,1,1,3,4]', '[0,0,1,0,0,1]'],
    ],
  },
  {
    n: 305,
    id: 'pghub-signal-decay',
    name: 'Signal Decay Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestStable',
    params: [{ name: 'signal', type: 'List[int]' }, { name: 'tol', type: 'int' }],
    return_type: 'int',
    statement:
      'Given a list of readings <code>signal</code>, return the length of the longest contiguous window in which the difference between the maximum and minimum reading is at most <code>tol</code>.',
    examples: [
      ['[1,3,2,5,4]\n2', '3', 'Window [1,3,2] has range 2; window [3,2,5] would be range 3.'],
      ['[7,7,7]\n0', '3', 'All equal, range 0 throughout.'],
    ],
    constraints: ['1 <= signal.length <= 10^5', '0 <= tol <= 10^9', '-10^9 <= signal[i] <= 10^9'],
    tags: ['sliding-window', 'arrays'],
    py: `def longestStable(signal, tol):
    from collections import deque
    maxd = deque()  # decreasing
    mind = deque()  # increasing
    left = 0
    best = 0
    for right, v in enumerate(signal):
        while maxd and signal[maxd[-1]] <= v:
            maxd.pop()
        maxd.append(right)
        while mind and signal[mind[-1]] >= v:
            mind.pop()
        mind.append(right)
        while signal[maxd[0]] - signal[mind[0]] > tol:
            left += 1
            if maxd[0] < left:
                maxd.popleft()
            if mind[0] < left:
                mind.popleft()
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window with two monotonic deques tracking the window max and min in O(1) amortized. Whenever max-min exceeds the tolerance, advance the left edge until the window is valid again, recording the best length.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,2,5,4]', '2'],
      ['[7,7,7]', '0'],
      ['[1]', '0'],
      ['[1,2,3,4,5]', '0'],
      ['[1,2,3,4,5]', '10'],
      ['[5,4,3,2,1]', '1'],
      ['[10,12,11,9,8,14]', '3'],
      ['[-5,-3,-4,-6,-2]', '2'],
      ['[1000000000,-1000000000]', '2000000000'],
      ['[3,3,3,4,4,2,2,5]', '1'],
    ],
  },
  {
    n: 308,
    id: 'pghub-mosaic-borders',
    name: 'Mosaic Border Tiles',
    topic_id: 'arrays',
    difficulty: 'Easy',
    method_name: 'borderSum',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'Given a non-empty rectangular integer <code>grid</code>, return the sum of all tiles lying on the outer border (first/last row and first/last column). Each border tile is counted once even though corners belong to two edges.',
    examples: [
      ['[[1,2,3],[4,5,6],[7,8,9]]', '40', 'All but the center 5: 45 - 5 = 40.'],
      ['[[5]]', '5', 'The single cell is its own border.'],
    ],
    constraints: ['1 <= rows, cols <= 1000', '-10^9 <= grid[i][j] <= 10^9'],
    tags: ['matrix', 'arrays'],
    py: `def borderSum(grid):
    r = len(grid)
    c = len(grid[0])
    total = 0
    for i in range(r):
        for j in range(c):
            if i == 0 or i == r - 1 or j == 0 or j == c - 1:
                total += grid[i][j]
    return total`,
    approach:
      'A cell is on the border when it is in the first/last row or first/last column. Sum exactly those cells; the condition naturally counts each corner once.',
    complexity: { time: 'O(r*c)', space: 'O(1)' },
    cases: [
      ['[[1,2,3],[4,5,6],[7,8,9]]'],
      ['[[5]]'],
      ['[[1,2],[3,4]]'],
      ['[[1,2,3,4]]'],
      ['[[1],[2],[3]]'],
      ['[[0,0,0],[0,9,0],[0,0,0]]'],
      ['[[-1,-2,-3],[-4,-5,-6],[-7,-8,-9]]'],
      ['[[1,1,1,1],[1,1,1,1],[1,1,1,1]]'],
      ['[[2,4,6,8,10]]'],
      ['[[1,2,3],[4,5,6],[7,8,9],[10,11,12]]'],
    ],
  },
  {
    n: 311,
    id: 'pghub-parcel-routing',
    name: 'Parcel Hop Routing',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'minHops',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }, { name: 'src', type: 'int' }, { name: 'dst', type: 'int' }],
    return_type: 'int',
    statement:
      'A delivery network has <code>n</code> hubs numbered <code>0..n-1</code> and bidirectional links <code>edges</code> where each <code>[u,v]</code> connects two hubs. Return the minimum number of hops to deliver a parcel from hub <code>src</code> to hub <code>dst</code>, or -1 if unreachable.',
    examples: [
      ['4\n[[0,1],[1,2],[2,3]]\n0\n3', '3', 'Path 0-1-2-3 uses three hops.'],
      ['3\n[[0,1]]\n0\n2', '-1', 'Hub 2 is isolated.'],
    ],
    constraints: ['1 <= n <= 10^5', '0 <= u, v, src, dst < n'],
    tags: ['graph', 'bfs'],
    py: `def minHops(n, edges, src, dst):
    from collections import deque
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    if src == dst:
        return 0
    dist = [-1] * n
    dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for w in adj[u]:
            if dist[w] == -1:
                dist[w] = dist[u] + 1
                if w == dst:
                    return dist[w]
                q.append(w)
    return -1`,
    approach:
      'Unweighted shortest path is breadth-first search. Build adjacency lists, BFS from the source, and the first time the destination is dequeued (or reached) its distance is the minimum hop count.',
    complexity: { time: 'O(n + e)', space: 'O(n + e)' },
    multiParam: true,
    cases: [
      ['4', '[[0,1],[1,2],[2,3]]', '0', '3'],
      ['3', '[[0,1]]', '0', '2'],
      ['1', '[]', '0', '0'],
      ['5', '[[0,1],[0,2],[1,3],[2,3],[3,4]]', '0', '4'],
      ['2', '[[0,1]]', '1', '0'],
      ['6', '[[0,1],[1,2],[3,4],[4,5]]', '0', '5'],
      ['4', '[[0,1],[1,2],[2,3],[0,3]]', '0', '3'],
      ['5', '[]', '2', '2'],
      ['7', '[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]', '0', '6'],
      ['4', '[[0,1],[2,3]]', '1', '3'],
    ],
  },
  {
    n: 314,
    id: 'pghub-coin-rolls',
    name: 'Coin Roll Combinations',
    topic_id: 'dp',
    difficulty: 'Medium',
    method_name: 'countWays',
    params: [{ name: 'denoms', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    statement:
      'Given coin <code>denoms</code> (unlimited supply of each) and a target <code>amount</code>, return the number of distinct multisets of coins that sum to exactly <code>amount</code>. Two ways are the same if they use the same count of each denomination regardless of order.',
    examples: [
      ['[1,2,5]\n5', '4', 'The combinations are 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.'],
      ['[2]\n3', '0', 'Odd target cannot be made from 2s.'],
    ],
    constraints: ['1 <= denoms.length <= 100', '1 <= denoms[i] <= 1000', '0 <= amount <= 5000'],
    tags: ['dp'],
    py: `def countWays(denoms, amount):
    dp = [0] * (amount + 1)
    dp[0] = 1
    for c in denoms:
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]`,
    approach:
      'Unbounded coin-change counting. Iterate denominations in the outer loop so each combination is counted once regardless of order; the inner forward sweep allows reusing a coin any number of times.',
    complexity: { time: 'O(denoms * amount)', space: 'O(amount)' },
    multiParam: true,
    cases: [
      ['[1,2,5]', '5'],
      ['[2]', '3'],
      ['[1]', '0'],
      ['[1]', '7'],
      ['[2,3,7]', '12'],
      ['[5,10]', '0'],
      ['[1,5,10,25]', '30'],
      ['[3,4]', '11'],
      ['[2,4,6]', '8'],
      ['[7,11]', '100'],
    ],
  },
  {
    n: 317,
    id: 'pghub-fold-palindrome',
    name: 'Foldable String Check',
    topic_id: 'two-pointers',
    difficulty: 'Easy',
    method_name: 'canFold',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    statement:
      'A string can be <em>folded</em> if it reads the same forward and backward when ignoring spaces and treating uppercase and lowercase as equal. Return whether <code>s</code> can be folded.',
    examples: [
      ['"Race Car"', 'true', 'Ignoring case and spaces gives "racecar".'],
      ['"hello"', 'false', 'Not a palindrome.'],
    ],
    constraints: ['1 <= s.length <= 10^5', 's contains printable ASCII'],
    tags: ['two-pointers', 'strings'],
    py: `def canFold(s):
    t = [ch.lower() for ch in s if ch != " "]
    i, j = 0, len(t) - 1
    while i < j:
        if t[i] != t[j]:
            return False
        i += 1
        j -= 1
    return True`,
    approach:
      'Normalize by dropping spaces and lowercasing, then use two pointers from both ends comparing inward. A mismatch means it cannot be folded.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"Race Car"'],
      ['"hello"'],
      ['"a"'],
      ['"Aa"'],
      ['"ab"'],
      ['"never odd or even"'],
      ['"Was it a car or a cat I saw"'],
      ['"  "'],
      ['"abccba"'],
      ['"abcdba"'],
    ],
  },
  {
    n: 320,
    id: 'pghub-elevator-trips',
    name: 'Elevator Batch Trips',
    topic_id: 'greedy',
    difficulty: 'Easy',
    method_name: 'minTrips',
    params: [{ name: 'people', type: 'int' }, { name: 'capacity', type: 'int' }],
    return_type: 'int',
    statement:
      'An elevator carries up to <code>capacity</code> people per trip. Given <code>people</code> waiting, return the minimum number of trips to move everyone.',
    examples: [
      ['10\n3', '4', 'Three full trips of 3 plus one trip of 1.'],
      ['0\n5', '0', 'No one to move.'],
    ],
    constraints: ['0 <= people <= 10^9', '1 <= capacity <= 10^9'],
    tags: ['greedy', 'math'],
    py: `def minTrips(people, capacity):
    return (people + capacity - 1) // capacity`,
    approach:
      'Each trip removes at most capacity people, so the answer is people divided by capacity rounded up, computed with integer ceiling division.',
    complexity: { time: 'O(1)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['10', '3'],
      ['0', '5'],
      ['5', '5'],
      ['6', '5'],
      ['1', '1'],
      ['1000000000', '1'],
      ['7', '2'],
      ['100', '10'],
      ['99', '10'],
      ['1000000000', '999999999'],
    ],
  },
  {
    n: 323,
    id: 'pghub-warehouse-zones',
    name: 'Warehouse Connected Zones',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'countZones',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    statement:
      'A warehouse floor is a grid where <code>1</code> marks storage and <code>0</code> marks aisle. A <em>zone</em> is a maximal group of 1-cells connected horizontally or vertically (not diagonally). Return the number of zones.',
    examples: [
      ['[[1,1,0],[0,1,0],[0,0,1]]', '2', 'The top-left L-shape is one zone; the lone bottom-right cell is another.'],
      ['[[0,0],[0,0]]', '0', 'No storage cells.'],
    ],
    constraints: ['1 <= rows, cols <= 1000', 'grid[i][j] in {0,1}'],
    tags: ['graph', 'dfs'],
    py: `def countZones(grid):
    r = len(grid)
    c = len(grid[0])
    seen = [[False] * c for _ in range(r)]
    zones = 0
    for i in range(r):
        for j in range(c):
            if grid[i][j] == 1 and not seen[i][j]:
                zones += 1
                stack = [(i, j)]
                seen[i][j] = True
                while stack:
                    x, y = stack.pop()
                    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < r and 0 <= ny < c and grid[nx][ny] == 1 and not seen[nx][ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
    return zones`,
    approach:
      'Standard connected-components flood fill. Scan every cell; on an unvisited storage cell start a DFS that marks its whole 4-connected zone, incrementing the count once per new zone.',
    complexity: { time: 'O(r*c)', space: 'O(r*c)' },
    cases: [
      ['[[1,1,0],[0,1,0],[0,0,1]]'],
      ['[[0,0],[0,0]]'],
      ['[[1]]'],
      ['[[0]]'],
      ['[[1,0,1,0,1]]'],
      ['[[1,1,1],[1,1,1]]'],
      ['[[1,0],[0,1]]'],
      ['[[1,0,0,1],[0,0,0,0],[1,0,0,1]]'],
      ['[[1,1,0,0,1],[0,1,0,1,1],[0,0,0,0,0],[1,0,1,0,1]]'],
      ['[[0,1,0],[1,1,1],[0,1,0]]'],
    ],
  },
  {
    n: 325,
    id: 'pghub-budget-subarray',
    name: 'Longest Budget Run',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestRun',
    params: [{ name: 'costs', type: 'List[int]' }, { name: 'budget', type: 'int' }],
    return_type: 'int',
    statement:
      'Given non-negative daily <code>costs</code> and a total <code>budget</code>, return the length of the longest contiguous run of days whose total cost does not exceed <code>budget</code>.',
    examples: [
      ['[3,1,1,1,5]\n4', '3', 'The contiguous run [1,1,1] (indices 1..3) sums to 3, the longest window within budget 4.'],
      ['[5,5,5]\n4', '0', 'No single day fits the budget.'],
    ],
    constraints: ['1 <= costs.length <= 10^5', '0 <= costs[i] <= 10^9', '0 <= budget <= 10^14'],
    tags: ['sliding-window', 'arrays'],
    py: `def longestRun(costs, budget):
    left = 0
    cur = 0
    best = 0
    for right, c in enumerate(costs):
        cur += c
        while cur > budget:
            cur -= costs[left]
            left += 1
        if right - left + 1 > best:
            best = right - left + 1
    return best`,
    approach:
      'Since costs are non-negative, a sliding window works: expand the right edge adding cost, and whenever the window sum exceeds the budget shrink from the left. Track the longest valid window length.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    multiParam: true,
    cases: [
      ['[2,1,3,1,1]', '4'],
      ['[5,5,5]', '4'],
      ['[1,1,1,1,1]', '3'],
      ['[1]', '0'],
      ['[0,0,0]', '0'],
      ['[3,1,2,1,4,1,1]', '5'],
      ['[10,1,1,1,10]', '3'],
      ['[1000000000,1000000000]', '2000000000'],
      ['[4,2,2,7]', '6'],
      ['[2,3,1,2,4,3]', '7'],
    ],
  },
];

// ---------------------------------------------------------------------------
// Run a Python solution against each test input, capture true expected output.
// ---------------------------------------------------------------------------

function runPythonExpected(prob) {
  const inputs = prob.cases;
  // Build a single python program that defines the fn and prints serialized results.
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print(_ser(${prob.method_name}(${argLiterals})))`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-${prob.n}.py`);
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
    return {
      inputs: argStrs,
      expected: outputs[idx],
      is_sample: idx < 2,
    };
  });
}

// Build the HTML description block matching existing rows (examples + constraints).
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
  return {
    python: { code: pythonClassWrap(prob), approach: prob.approach, complexity: prob.complexity },
  };
}
// Wrap the bare function into a Solution class method (matches existing rows).
function pythonClassWrap(prob) {
  const sig = prob.params.map((p) => p.name).join(', ');
  const body = prob.py
    .replace(new RegExp(`^def ${prob.method_name}\\(${prob.params.map((p) => p.name).join(', ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\):\\n`), '')
    .split('\n')
    .map((l) => (l ? '        ' + l : l))
    .join('\n');
  return `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
}

async function main() {
  const wanted = (cliNums.length ? cliNums : BATCH);
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);
  console.log(`Authoring ${targets.length} problems for gaps: ${targets.map((t) => t.n).join(', ')}`);

  // 1. Existing-row check (idempotent skip).
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
    if (haveNums.has(prob.n)) {
      console.log(`  skip #${prob.n} (${prob.id}) — number already present`);
      continue;
    }
    if (haveIds.has(prob.id)) {
      console.log(`  skip #${prob.n} (${prob.id}) — id already present`);
      continue;
    }
    // 2 + 3. Run Python to derive correct expected outputs.
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
    console.log(
      `  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, sample expected: ${test_cases[0].expected}`
    );
  }

  if (!rows.length) {
    console.log('Nothing new to insert.');
    return;
  }

  if (DRY) {
    console.log(`\n[DRY] Would insert ${rows.length} rows. Skipping write.`);
    return;
  }

  // 5. Insert.
  const { error: insErr } = await sb.from('PGcode_problems').insert(rows);
  if (insErr) throw insErr;
  console.log(`\nInserted ${rows.length} rows.`);

  // 6. Verify.
  const { data: check } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,name,tags')
    .in('leetcode_number', wanted)
    .order('leetcode_number');
  const pghub = (check || []).filter((c) => (c.tags || []).includes('PGHub'));
  console.log(`\nVerify: ${pghub.length}/${wanted.length} target numbers now present & tagged PGHub.`);
  for (const c of check) console.log(`  #${c.leetcode_number} ${c.name} tags=${JSON.stringify(c.tags)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
