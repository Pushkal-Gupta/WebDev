#!/usr/bin/env node
// Atomic splice: inject 2 viz fns before `export const RICH_CONTENT = {`
// and 2 problem entries before its closing `};`.
// Slugs: min-cost-climbing-stairs, wiggle-subsequence.
// (unique-paths already lives in RICH_CONTENT — intentionally skipped.)
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function minCostClimbingStairsViz(')
  || src.includes("'min-cost-climbing-stairs':")
  || src.includes('"min-cost-climbing-stairs":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function minCostClimbingStairsViz() {
  const cost = [10, 15, 20, 1, 5, 30, 7, 12, 4, 18, 9, 6];
  const n = cost.length;
  const frames = [];

  frames.push({
    array: cost.slice(),
    chip: [
      { label: 'cost', value: '[' + cost.join(',') + ']' },
      { label: 'rule', value: 'pay cost[i] then step 1 or 2', tone: 'violet' },
      { label: 'goal', value: 'reach top (past index n-1) cheapest', tone: 'pink' },
    ],
    caption: 'You may start at index 0 or 1 for free. At each step you pay the cost of the current stair, then jump 1 or 2 stairs forward. Minimum total cost to leave the staircase (reach position n).',
  });

  const dp = new Array(n + 1).fill(0);

  frames.push({
    array: dp.slice(),
    chip: [
      { label: 'dp', value: 'length n+1 = ' + (n + 1) },
      { label: 'meaning', value: 'dp[i] = min cost to REACH stair i', tone: 'violet' },
      { label: 'base', value: 'dp[0] = dp[1] = 0', tone: 'pink' },
    ],
    caption: 'dp[i] = minimum cost to stand at stair i without yet paying cost[i]. The two free starts give dp[0] = dp[1] = 0. Answer lives at dp[n] — the spot past the last stair.',
  });

  for (let i = 2; i <= n; i++) {
    const fromOne = dp[i - 1] + cost[i - 1];
    const fromTwo = dp[i - 2] + cost[i - 2];
    dp[i] = Math.min(fromOne, fromTwo);
    const tookOne = fromOne <= fromTwo;
    frames.push({
      array: dp.slice(),
      highlights: { [i]: 'pink', [i - 1]: tookOne ? 'mid' : 'low', [i - 2]: tookOne ? 'low' : 'mid' },
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'one step', value: 'dp[' + (i - 1) + '] + cost[' + (i - 1) + '] = ' + dp[i - 1] + ' + ' + cost[i - 1] + ' = ' + fromOne },
        { label: 'two step', value: 'dp[' + (i - 2) + '] + cost[' + (i - 2) + '] = ' + dp[i - 2] + ' + ' + cost[i - 2] + ' = ' + fromTwo },
        { label: 'pick', value: tookOne ? 'one (' + fromOne + ')' : 'two (' + fromTwo + ')', tone: 'pink' },
      ],
      caption: 'At stair ' + i + ': either pay cost[' + (i - 1) + ']=' + cost[i - 1] + ' to step from ' + (i - 1) + ', or pay cost[' + (i - 2) + ']=' + cost[i - 2] + ' to leap from ' + (i - 2) + '. Take the cheaper — dp[' + i + '] = ' + dp[i] + '.',
    });
  }

  frames.push({
    array: dp.slice(),
    highlights: { [n]: 'pink' },
    chip: [
      { label: 'answer', value: String(dp[n]), tone: 'pink' },
      { label: 'dp[n]', value: String(dp[n]) },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(1) with rolling pair' },
    ],
    caption: 'Result: ' + dp[n] + '. Only dp[i-1] and dp[i-2] are needed at any step, so two scalars replace the full array — space drops to O(1) without changing the logic.',
  });

  return { renderer: 'array', title: 'Min Cost Climbing Stairs — 1D DP with two-step lookback', frames };
}

function wiggleSubsequenceViz() {
  const nums = [1, 7, 4, 9, 2, 5, 3, 8, 6, 11, 4, 10];
  const n = nums.length;
  const frames = [];

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'wiggle', value: 'signs of consecutive diffs ALTERNATE', tone: 'violet' },
      { label: 'goal', value: 'longest wiggle subsequence', tone: 'pink' },
    ],
    caption: 'A wiggle sequence alternates between up and down differences. Pick a subsequence (preserve order, drop any elements) whose adjacent diffs strictly alternate sign. Maximize its length.',
  });

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'insight', value: 'count turning points', tone: 'violet' },
      { label: 'why', value: 'a flat stretch contributes only its endpoints', tone: 'pink' },
    ],
    caption: 'Greedy fact: the longest wiggle subsequence equals 1 plus the number of sign changes in the diff array. Equal consecutive values contribute zero — neither up nor down — so they collapse.',
  });

  let up = 1, down = 1;

  frames.push({
    array: nums.slice(),
    highlights: { 0: 'pink' },
    chip: [
      { label: 'up', value: String(up) },
      { label: 'down', value: String(down) },
      { label: 'meaning', value: 'longest wiggle ending UP / DOWN so far', tone: 'violet' },
    ],
    caption: 'Track two states: up = longest wiggle ending with a rising step; down = longest ending with a falling step. Both start at 1 (a single element is a trivial wiggle of length 1).',
  });

  for (let i = 1; i < n; i++) {
    const prevUp = up, prevDown = down;
    let action = 'flat';
    if (nums[i] > nums[i - 1]) {
      up = prevDown + 1;
      action = 'rising — extend a DOWN-ending wiggle';
    } else if (nums[i] < nums[i - 1]) {
      down = prevUp + 1;
      action = 'falling — extend an UP-ending wiggle';
    }
    frames.push({
      array: nums.slice(),
      highlights: { [i - 1]: 'low', [i]: 'pink' },
      chip: [
        { label: 'i', value: String(i), tone: 'violet' },
        { label: 'compare', value: 'nums[' + i + ']=' + nums[i] + ' vs nums[' + (i - 1) + ']=' + nums[i - 1] },
        { label: 'action', value: action },
        { label: 'up', value: String(up) },
        { label: 'down', value: String(down) },
      ],
      caption: 'Step ' + i + ': ' + action + '. ' + (action === 'flat' ? 'Equal values leave both counters untouched.' : 'The just-updated counter takes the OTHER counter + 1 — because to land an UP step you must follow something that ended DOWN, and vice versa.'),
    });
  }

  const ans = Math.max(up, down);

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'up', value: String(up) },
      { label: 'down', value: String(down) },
      { label: 'answer', value: String(ans), tone: 'pink' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(1)' },
    ],
    caption: 'Result: ' + ans + '. Why two scalars suffice: any longer wiggle ending at index i either ends UP (so its predecessor wiggle ended DOWN — read down + 1) or ends DOWN (read up + 1). No DP array needed.',
  });

  return { renderer: 'array', title: 'Wiggle Subsequence — two-state greedy on sign changes', frames };
}

`;

const ENTRY_BLOCK = `  'min-cost-climbing-stairs': {
    tags: ['array', 'dynamic-programming'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'apple', 'bloomberg'],
    viz: minCostClimbingStairsViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def minCostClimbingStairs(self, cost: list[int]) -> int:
        n = len(cost)
        prev2, prev1 = 0, 0
        for i in range(2, n + 1):
            curr = min(prev1 + cost[i - 1], prev2 + cost[i - 2])
            prev2, prev1 = prev1, curr
        return prev1\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'dp[i] = min cost to REACH stair i (without paying its own cost yet). Base: dp[0] = dp[1] = 0 (free starts). Transition: dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]). Only the last two values are ever needed, so two scalars suffice — O(1) space.',
      },
      javascript: {
        code: \`function minCostClimbingStairs(cost) {
  const n = cost.length;
  let prev2 = 0, prev1 = 0;
  for (let i = 2; i <= n; i++) {
    const curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same rolling-pair DP. Loop runs to i = n so prev1 ends as dp[n] = cost to step OFF the staircase. Direct scalar assignment avoids array overhead.',
      },
      java: {
        code: \`class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int n = cost.length;
        int prev2 = 0, prev1 = 0;
        for (int i = 2; i <= n; i++) {
            int curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Primitive ints — zero allocation, zero boxing. Math.min on ints stays in the int domain.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int n = (int)cost.size();
        int prev2 = 0, prev1 = 0;
        for (int i = 2; i <= n; i++) {
            int curr = min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Stack-only ints. std::min on two ints compiles to a single conditional move on most modern compilers.',
      },
      c: {
        code: \`int minCostClimbingStairs(int* cost, int costSize) {
    int prev2 = 0, prev1 = 0;
    for (int i = 2; i <= costSize; i++) {
        int a = prev1 + cost[i - 1];
        int b = prev2 + cost[i - 2];
        int curr = a < b ? a : b;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'No allocations. Ternary min avoids a function call. Loop bound is i <= costSize so prev1 ends at the off-staircase position.',
      },
      go: {
        code: \`func minCostClimbingStairs(cost []int) int {
    n := len(cost)
    prev2, prev1 := 0, 0
    for i := 2; i <= n; i++ {
        a := prev1 + cost[i-1]
        b := prev2 + cost[i-2]
        curr := a
        if b < a {
            curr = b
        }
        prev2 = prev1
        prev1 = curr
    }
    return prev1
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Manual min beats math.Min (float64-only). Two scalars, no slice growth, no GC pressure.',
      },
    },
  },
  'wiggle-subsequence': {
    tags: ['array', 'dynamic-programming', 'greedy'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'apple', 'adobe'],
    viz: wiggleSubsequenceViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def wiggleMaxLength(self, nums: list[int]) -> int:
        n = len(nums)
        if n < 2:
            return n
        up = down = 1
        for i in range(1, n):
            if nums[i] > nums[i - 1]:
                up = down + 1
            elif nums[i] < nums[i - 1]:
                down = up + 1
        return max(up, down)\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Two-state greedy: up = longest wiggle ending on a rising step, down = ending on a falling step. A new rising step must extend something that previously ended falling, so up = down + 1 — and symmetric for the falling case. Equal values leave both counters untouched.',
      },
      javascript: {
        code: \`function wiggleMaxLength(nums) {
  const n = nums.length;
  if (n < 2) return n;
  let up = 1, down = 1;
  for (let i = 1; i < n; i++) {
    if (nums[i] > nums[i - 1]) up = down + 1;
    else if (nums[i] < nums[i - 1]) down = up + 1;
  }
  return Math.max(up, down);
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Single pass, two scalars. Equality branch is implicit (no else) — flat runs collapse, which is exactly what wiggle counting requires.',
      },
      java: {
        code: \`class Solution {
    public int wiggleMaxLength(int[] nums) {
        int n = nums.length;
        if (n < 2) return n;
        int up = 1, down = 1;
        for (int i = 1; i < n; i++) {
            if (nums[i] > nums[i - 1]) up = down + 1;
            else if (nums[i] < nums[i - 1]) down = up + 1;
        }
        return Math.max(up, down);
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Same greedy. Primitive ints, no autoboxing. Guard for n < 2 returns the trivial length (0 or 1).',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wiggleMaxLength(vector<int>& nums) {
        int n = (int)nums.size();
        if (n < 2) return n;
        int up = 1, down = 1;
        for (int i = 1; i < n; i++) {
            if (nums[i] > nums[i - 1]) up = down + 1;
            else if (nums[i] < nums[i - 1]) down = up + 1;
        }
        return max(up, down);
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Two ints + a single scan. Branchless variants exist but the if-else here is already perfectly predicted on real test data.',
      },
      c: {
        code: \`int wiggleMaxLength(int* nums, int numsSize) {
    if (numsSize < 2) return numsSize;
    int up = 1, down = 1;
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] > nums[i - 1]) up = down + 1;
        else if (nums[i] < nums[i - 1]) down = up + 1;
    }
    return up > down ? up : down;
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'No allocations, no headers needed beyond what LC supplies. Ternary at the end avoids a function call for the final max.',
      },
      go: {
        code: \`func wiggleMaxLength(nums []int) int {
    n := len(nums)
    if n < 2 {
        return n
    }
    up, down := 1, 1
    for i := 1; i < n; i++ {
        if nums[i] > nums[i-1] {
            up = down + 1
        } else if nums[i] < nums[i-1] {
            down = up + 1
        }
    }
    if up > down {
        return up
    }
    return down
}\`,
        complexity: { time: 'O(n)', space: 'O(1)' },
        approach: 'Idiomatic Go: explicit max via if. Two scalars, single pass, zero allocations.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
let p = openBracePos;
while (p < src.length) {
  const ch = src[p];
  const ch2 = src[p + 1];
  if (ch === '/' && ch2 === '/') {
    const nl = src.indexOf('\n', p + 2);
    p = nl < 0 ? src.length : nl + 1;
    continue;
  }
  if (ch === '/' && ch2 === '*') {
    const end = src.indexOf('*/', p + 2);
    p = end < 0 ? src.length : end + 2;
    continue;
  }
  if (ch === "'" || ch === '"') {
    const quote = ch;
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === quote) { p++; break; }
      p++;
    }
    continue;
  }
  if (ch === '`') {
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '`') { p++; break; }
      if (src[p] === '$' && src[p + 1] === '{') {
        p += 2;
        let nest = 1;
        while (p < src.length && nest > 0) {
          const c = src[p];
          if (c === '\\') { p += 2; continue; }
          if (c === "'" || c === '"') {
            const q = c; p++;
            while (p < src.length) {
              if (src[p] === '\\') { p += 2; continue; }
              if (src[p] === q) { p++; break; }
              p++;
            }
            continue;
          }
          if (c === '`') {
            p++;
            while (p < src.length && src[p] !== '`') {
              if (src[p] === '\\') { p += 2; continue; }
              p++;
            }
            p++;
            continue;
          }
          if (c === '{') nest++;
          else if (c === '}') nest--;
          p++;
        }
        continue;
      }
      p++;
    }
    continue;
  }
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) { closeIdx = p; break; }
  }
  p++;
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced 2 viz fns + 2 entries (min-cost-climbing-stairs, wiggle-subsequence) into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
console.log('  note:  unique-paths already present in RICH_CONTENT — intentionally skipped.');
