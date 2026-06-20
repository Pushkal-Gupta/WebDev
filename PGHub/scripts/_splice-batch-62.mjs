#!/usr/bin/env node
// Atomic splice: inject 3 viz fns before `export const RICH_CONTENT = {`
// and 3 problem entries before its closing `};`.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function deleteOperationForTwoStringsViz(')
  || src.includes("'delete-operation-for-two-strings':")
  || src.includes('"delete-operation-for-two-strings":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function deleteOperationForTwoStringsViz() {
  const word1 = 'sea';
  const word2 = 'eat';
  const m = word1.length, n = word2.length;
  const frames = [];

  frames.push({
    array: [word1, word2],
    chip: [
      { label: 'word1', value: '"' + word1 + '"' },
      { label: 'word2', value: '"' + word2 + '"' },
      { label: 'goal', value: 'min deletions to make them equal', tone: 'violet' },
    ],
    caption: 'Each deletion removes one char from either string. The minimum total deletions equals (m + n - 2*LCS): every char NOT in the longest common subsequence must die exactly once.',
  });

  // Build LCS DP table
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  frames.push({
    array: [word1, word2],
    chip: [
      { label: 'dp', value: '(m+1) x (n+1) zeros' },
      { label: 'meaning', value: 'dp[i][j] = LCS of word1[:i], word2[:j]', tone: 'violet' },
    ],
    caption: 'Build a 2D table where dp[i][j] is the LCS length of the first i chars of word1 and first j chars of word2. Row 0 and column 0 stay zero — LCS with an empty string is 0.',
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    frames.push({
      array: dp[i].slice(),
      chip: [
        { label: 'row', value: 'i=' + i + ' (word1[' + (i - 1) + ']="' + word1[i - 1] + '")', tone: 'violet' },
        { label: 'row dp', value: '[' + dp[i].join(',') + ']' },
      ],
      caption: 'Filled row i=' + i + '. At each cell: if word1[i-1] matches word2[j-1] we extend the diagonal LCS by 1; otherwise we inherit the better of (drop a char from word1) or (drop a char from word2).',
    });
  }

  const lcs = dp[m][n];

  frames.push({
    array: dp[m].slice(),
    chip: [
      { label: 'LCS', value: String(lcs), tone: 'pink' },
      { label: 'dp[m][n]', value: String(dp[m][n]) },
    ],
    caption: 'LCS length = dp[' + m + '][' + n + '] = ' + lcs + '. The shared subsequence "' + lcsString(word1, word2, dp) + '" is the largest chunk both strings agree on.',
  });

  const ans = m + n - 2 * lcs;
  frames.push({
    array: [word1, word2, '"' + lcsString(word1, word2, dp) + '"'],
    chip: [
      { label: 'm', value: String(m) },
      { label: 'n', value: String(n) },
      { label: '2*LCS', value: String(2 * lcs), tone: 'violet' },
    ],
    caption: 'Delete every non-LCS char from each string: (m - LCS) from word1 plus (n - LCS) from word2. Total = m + n - 2*LCS.',
  });

  frames.push({
    array: [word1, word2],
    chip: [
      { label: 'answer', value: String(ans), tone: 'pink' },
      { label: 'formula', value: 'm + n - 2*LCS = ' + m + ' + ' + n + ' - ' + (2 * lcs), tone: 'violet' },
    ],
    caption: 'Result: ' + ans + ' deletions. Why it works: any shared subsequence survives both strings unchanged — maximizing it minimizes the deletions on each side simultaneously.',
  });

  return { renderer: 'array', title: 'Delete Operation for Two Strings — LCS-based deletion count', frames };

  function lcsString(a, b, table) {
    let i = a.length, j = b.length;
    const chars = [];
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) { chars.push(a[i - 1]); i--; j--; }
      else if (table[i - 1][j] >= table[i][j - 1]) i--;
      else j--;
    }
    return chars.reverse().join('');
  }
}

function minimumFallingPathSumViz() {
  const matrix = [[2, 1, 3], [6, 5, 4], [7, 8, 9]];
  const n = matrix.length;
  const frames = [];

  frames.push({
    array: matrix.flat(),
    chip: [
      { label: 'matrix', value: 'n x n grid' },
      { label: 'rule', value: 'step to row+1 col-1 | col | col+1', tone: 'violet' },
    ],
    caption: 'Start in any cell of row 0; at each step you may move to the cell directly below, or diagonally below-left, or diagonally below-right. Minimize the sum of cells visited.',
  });

  const dp = matrix.map(row => row.slice());

  frames.push({
    array: dp[0].slice(),
    chip: [
      { label: 'row', value: '0 (base case)', tone: 'violet' },
      { label: 'dp[0]', value: '[' + dp[0].join(',') + ']' },
    ],
    caption: 'Base case: dp[0][j] = matrix[0][j] for every column. The cost of "starting" at any top cell is just that cell\\'s value.',
  });

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const above = dp[i - 1][j];
      const left = j > 0 ? dp[i - 1][j - 1] : Infinity;
      const right = j < n - 1 ? dp[i - 1][j + 1] : Infinity;
      dp[i][j] = matrix[i][j] + Math.min(above, left, right);
    }
    frames.push({
      array: dp[i].slice(),
      chip: [
        { label: 'row', value: 'i=' + i, tone: 'violet' },
        { label: 'dp[i]', value: '[' + dp[i].map(v => v === Infinity ? 'inf' : v).join(',') + ']' },
      ],
      caption: 'Row ' + i + ': for each column j, add matrix[i][j] to the minimum of the three legal predecessors in row ' + (i - 1) + ' (directly above and the two diagonals). Edge columns have only two predecessors.',
    });
  }

  const ans = Math.min(...dp[n - 1]);
  frames.push({
    array: dp[n - 1].slice(),
    chip: [
      { label: 'last row dp', value: '[' + dp[n - 1].join(',') + ']' },
      { label: 'min', value: String(ans), tone: 'pink' },
    ],
    caption: 'Last row holds the minimum falling-path sum that ends at each column. Take the overall min across those columns to allow ending anywhere on the bottom.',
  });

  frames.push({
    array: dp.flat(),
    chip: [
      { label: 'answer', value: String(ans), tone: 'pink' },
      { label: 'time', value: 'O(n^2)', tone: 'violet' },
      { label: 'space', value: 'O(n) rolling rows possible' },
    ],
    caption: 'Result: ' + ans + '. The DP visits each cell once; you only need the previous row to compute the next, so space drops to O(n).',
  });

  return { renderer: 'array', title: 'Minimum Falling Path Sum — row-by-row DP with three predecessors', frames };
}

function houseRobberIVViz() {
  const nums = [2, 3, 5, 9];
  const k = 2;
  const frames = [];

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'k', value: String(k) },
      { label: 'goal', value: 'rob >= k non-adjacent houses, minimize max', tone: 'violet' },
    ],
    caption: 'Pick at least k houses, no two adjacent. Among all valid pickings the "capability" is the MAX amount in your selection. Find the smallest capability that still admits a valid k-pick.',
  });

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'observation', value: 'capability is monotone', tone: 'violet' },
      { label: 'method', value: 'binary search on the answer', tone: 'pink' },
    ],
    caption: 'If capability C is feasible (some k-pick stays <= C) then any C\\' > C is also feasible — strict monotonicity. So binary-search the smallest feasible C in [min(nums), max(nums)].',
  });

  let lo = Math.min(...nums), hi = Math.max(...nums);

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi) },
      { label: 'range', value: '[' + lo + ', ' + hi + ']', tone: 'violet' },
    ],
    caption: 'Bounds: capability is at least min(nums) (must pick at least one house) and at most max(nums) (the entire array is always feasible if k <= ceil(n/2)).',
  });

  function feasible(cap) {
    let count = 0, i = 0;
    while (i < nums.length) {
      if (nums[i] <= cap) { count++; i += 2; }
      else i++;
    }
    return count >= k;
  }

  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const ok = feasible(mid);
    frames.push({
      array: nums.map(v => v <= mid ? v : -v),
      highlights: Object.fromEntries(nums.map((v, idx) => [idx, v <= mid ? 'low' : 'pink'])),
      chip: [
        { label: 'mid (cap)', value: String(mid), tone: 'violet' },
        { label: 'eligible', value: '[' + nums.map(v => v <= mid ? v : 'X').join(',') + ']' },
        { label: 'feasible?', value: ok ? 'yes' : 'no', tone: ok ? 'violet' : 'pink' },
      ],
      caption: 'Try capability ' + mid + '. Houses with value <= ' + mid + ' are eligible. Greedy scan: take the leftmost eligible house, skip its neighbour, repeat. ' + (ok ? 'Counted >= k.' : 'Counted < k.'),
    });
    if (ok) hi = mid; else lo = mid + 1;
    frames.push({
      array: nums.slice(),
      chip: [
        { label: 'lo', value: String(lo) },
        { label: 'hi', value: String(hi) },
        { label: 'shrink', value: ok ? 'cap can be smaller' : 'cap must be bigger', tone: 'violet' },
      ],
      caption: ok ? 'Feasible at ' + mid + ' — try smaller: hi = mid.' : 'Infeasible at ' + mid + ' — need bigger: lo = mid + 1.',
    });
  }

  frames.push({
    array: nums.slice(),
    highlights: Object.fromEntries(nums.map((v, idx) => [idx, v <= lo ? 'mid' : 'pink'])),
    chip: [
      { label: 'answer', value: String(lo), tone: 'pink' },
      { label: 'pick', value: '[' + nums.filter(v => v <= lo).join(',') + '] (greedy)' },
    ],
    caption: 'Smallest feasible capability = ' + lo + '. The greedy "take if eligible, skip neighbour" is optimal because skipping the leftmost eligible house can only hurt: any later valid pick remains valid after committing the leftmost.',
  });

  return { renderer: 'array', title: 'House Robber IV — binary search on capability + greedy check', frames };
}

`;

const ENTRY_BLOCK = `  'delete-operation-for-two-strings': {
    tags: ['string', 'dynamic-programming', 'lcs'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'bloomberg', 'apple'],
    viz: deleteOperationForTwoStringsViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        lcs = dp[m][n]
        return m + n - 2 * lcs\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Compute LCS via classic 2D DP. Every char that is part of the LCS survives in both strings; everything else must be deleted exactly once. Answer = (m - LCS) + (n - LCS) = m + n - 2*LCS.',
      },
      javascript: {
        code: \`function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return m + n - 2 * dp[m][n];
}\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Same LCS table. Array.from + fill avoids accidental shared-row references. The formula collapses the bookkeeping into a single subtraction at the end.',
      },
      java: {
        code: \`class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return m + n - 2 * dp[m][n];
    }
}\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Primitive int[][] avoids boxing. charAt is O(1) on String. Space can be dropped to O(n) by keeping only the previous row.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = (int)word1.size(), n = (int)word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return m + n - 2 * dp[m][n];
    }
};\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Standard LCS in 2D vector. For tight memory: a single vector<int> prev(n+1) + int diag suffices, dropping space to O(n).',
      },
      c: {
        code: \`#include <string.h>
#include <stdlib.h>

int minDistance(char* word1, char* word2) {
    int m = (int)strlen(word1), n = (int)strlen(word2);
    int** dp = (int**)malloc((m + 1) * sizeof(int*));
    for (int i = 0; i <= m; i++) dp[i] = (int*)calloc(n + 1, sizeof(int));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
        }
    }
    int ans = m + n - 2 * dp[m][n];
    for (int i = 0; i <= m; i++) free(dp[i]);
    free(dp);
    return ans;
}\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Allocate row pointers + calloc zero-initialized rows. Remember to free both rows and the row-pointer array — leaking on each call kills LC memory limits fast.',
      },
      go: {
        code: \`func minDistance(word1, word2 string) int {
    m, n := len(word1), len(word2)
    dp := make([][]int, m+1)
    for i := range dp {
        dp[i] = make([]int, n+1)
    }
    for i := 1; i <= m; i++ {
        for j := 1; j <= n; j++ {
            if word1[i-1] == word2[j-1] {
                dp[i][j] = dp[i-1][j-1] + 1
            } else if dp[i-1][j] > dp[i][j-1] {
                dp[i][j] = dp[i-1][j]
            } else {
                dp[i][j] = dp[i][j-1]
            }
        }
    }
    return m + n - 2*dp[m][n]
}\`,
        complexity: { time: 'O(m*n)', space: 'O(m*n)' },
        approach: 'Byte indexing on string works for ASCII test data. Inline max via if/else dodges the function-call overhead from math.Max (which also forces float64 conversion).',
      },
    },
  },
  'minimum-falling-path-sum': {
    tags: ['array', 'dynamic-programming', 'matrix'],
    companies: ['amazon', 'google', 'microsoft', 'goldman-sachs', 'apple', 'meta'],
    viz: minimumFallingPathSumViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def minFallingPathSum(self, matrix: list[list[int]]) -> int:
        n = len(matrix)
        prev = matrix[0][:]
        for i in range(1, n):
            curr = [0] * n
            for j in range(n):
                best = prev[j]
                if j > 0:
                    best = min(best, prev[j - 1])
                if j < n - 1:
                    best = min(best, prev[j + 1])
                curr[j] = matrix[i][j] + best
            prev = curr
        return min(prev)\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Roll two rows: prev (row i-1 DP) and curr (row i). For each column take the min of the three legal predecessors and add the current cell. Edge columns simply skip the missing diagonal. Final answer is min over the last DP row.',
      },
      javascript: {
        code: \`function minFallingPathSum(matrix) {
  const n = matrix.length;
  let prev = matrix[0].slice();
  for (let i = 1; i < n; i++) {
    const curr = new Array(n);
    for (let j = 0; j < n; j++) {
      let best = prev[j];
      if (j > 0) best = Math.min(best, prev[j - 1]);
      if (j < n - 1) best = Math.min(best, prev[j + 1]);
      curr[j] = matrix[i][j] + best;
    }
    prev = curr;
  }
  return Math.min(...prev);
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Single-row rolling DP. Allocating curr per row keeps writes from clobbering the reads of prev. Math.min spread is fine for n up to ~10k before stack issues.',
      },
      java: {
        code: \`class Solution {
    public int minFallingPathSum(int[][] matrix) {
        int n = matrix.length;
        int[] prev = matrix[0].clone();
        for (int i = 1; i < n; i++) {
            int[] curr = new int[n];
            for (int j = 0; j < n; j++) {
                int best = prev[j];
                if (j > 0) best = Math.min(best, prev[j - 1]);
                if (j < n - 1) best = Math.min(best, prev[j + 1]);
                curr[j] = matrix[i][j] + best;
            }
            prev = curr;
        }
        int ans = Integer.MAX_VALUE;
        for (int v : prev) ans = Math.min(ans, v);
        return ans;
    }
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Primitive int[] avoids autoboxing. Final reduction with Integer.MAX_VALUE sentinel handles any n >= 1.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFallingPathSum(vector<vector<int>>& matrix) {
        int n = (int)matrix.size();
        vector<int> prev = matrix[0];
        for (int i = 1; i < n; i++) {
            vector<int> curr(n);
            for (int j = 0; j < n; j++) {
                int best = prev[j];
                if (j > 0) best = min(best, prev[j - 1]);
                if (j < n - 1) best = min(best, prev[j + 1]);
                curr[j] = matrix[i][j] + best;
            }
            prev = move(curr);
        }
        return *min_element(prev.begin(), prev.end());
    }
};\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'std::move on the row swap avoids per-row copy. min_element does the final reduction in a single pass.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <limits.h>

int minFallingPathSum(int** matrix, int matrixSize, int* matrixColSize) {
    int n = matrixSize;
    int* prev = (int*)malloc(n * sizeof(int));
    int* curr = (int*)malloc(n * sizeof(int));
    for (int j = 0; j < n; j++) prev[j] = matrix[0][j];
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < n; j++) {
            int best = prev[j];
            if (j > 0 && prev[j - 1] < best) best = prev[j - 1];
            if (j < n - 1 && prev[j + 1] < best) best = prev[j + 1];
            curr[j] = matrix[i][j] + best;
        }
        int* tmp = prev; prev = curr; curr = tmp;
    }
    int ans = INT_MAX;
    for (int j = 0; j < n; j++) if (prev[j] < ans) ans = prev[j];
    free(prev); free(curr);
    return ans;
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Two malloced rows, pointer-swap each iteration instead of memcpy. Manual min comparisons dodge the function-call overhead of a generic helper.',
      },
      go: {
        code: \`func minFallingPathSum(matrix [][]int) int {
    n := len(matrix)
    prev := make([]int, n)
    copy(prev, matrix[0])
    curr := make([]int, n)
    for i := 1; i < n; i++ {
        for j := 0; j < n; j++ {
            best := prev[j]
            if j > 0 && prev[j-1] < best {
                best = prev[j-1]
            }
            if j < n-1 && prev[j+1] < best {
                best = prev[j+1]
            }
            curr[j] = matrix[i][j] + best
        }
        prev, curr = curr, prev
    }
    ans := prev[0]
    for _, v := range prev[1:] {
        if v < ans {
            ans = v
        }
    }
    return ans
}\`,
        complexity: { time: 'O(n^2)', space: 'O(n)' },
        approach: 'Slice swap reuses both buffers across iterations — zero allocation inside the loop. Manual min beats math.Min (which is float64-only).',
      },
    },
  },
  'house-robber-iv': {
    tags: ['array', 'binary-search', 'greedy'],
    companies: ['google', 'amazon', 'microsoft', 'meta', 'apple'],
    viz: houseRobberIVViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def minCapability(self, nums: list[int], k: int) -> int:
        def feasible(cap: int) -> bool:
            count = i = 0
            n = len(nums)
            while i < n:
                if nums[i] <= cap:
                    count += 1
                    i += 2
                else:
                    i += 1
            return count >= k

        lo, hi = min(nums), max(nums)
        while lo < hi:
            mid = (lo + hi) // 2
            if feasible(mid):
                hi = mid
            else:
                lo = mid + 1
        return lo\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: 'Binary-search the answer on [min(nums), max(nums)]. For a candidate capability cap, a greedy scan robs every eligible house and skips its neighbour — this maximizes count under the non-adjacency rule. If count >= k, cap is feasible; shrink hi. Otherwise grow lo.',
      },
      javascript: {
        code: \`function minCapability(nums, k) {
  const feasible = (cap) => {
    let count = 0, i = 0;
    while (i < nums.length) {
      if (nums[i] <= cap) { count++; i += 2; }
      else i++;
    }
    return count >= k;
  };
  let lo = Math.min(...nums), hi = Math.max(...nums);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (feasible(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: '>> 1 instead of Math.floor for the midpoint — works because lo, hi fit in 32 bits per constraints. Closure captures nums so feasible doesn\\'t re-pass it on every call.',
      },
      java: {
        code: \`class Solution {
    public int minCapability(int[] nums, int k) {
        int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
        for (int v : nums) {
            if (v < lo) lo = v;
            if (v > hi) hi = v;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(nums, k, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private boolean feasible(int[] nums, int k, int cap) {
        int count = 0, i = 0, n = nums.length;
        while (i < n) {
            if (nums[i] <= cap) { count++; i += 2; }
            else i++;
        }
        return count >= k;
    }
}\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: 'Single-pass min/max instead of two stream reductions. mid = lo + (hi - lo) / 2 avoids the classic overflow when summing two large ints.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapability(vector<int>& nums, int k) {
        auto feasible = [&](int cap) {
            int count = 0, i = 0, n = (int)nums.size();
            while (i < n) {
                if (nums[i] <= cap) { count++; i += 2; }
                else i++;
            }
            return count >= k;
        };
        int lo = *min_element(nums.begin(), nums.end());
        int hi = *max_element(nums.begin(), nums.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: 'Lambda captures nums + k by reference — no copy. min_element/max_element are two passes; if you want one, fold it manually.',
      },
      c: {
        code: \`#include <stdbool.h>

static bool feasible(int* nums, int n, int k, int cap) {
    int count = 0, i = 0;
    while (i < n) {
        if (nums[i] <= cap) { count++; i += 2; }
        else i++;
    }
    return count >= k;
}

int minCapability(int* nums, int numsSize, int k) {
    int lo = nums[0], hi = nums[0];
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] < lo) lo = nums[i];
        if (nums[i] > hi) hi = nums[i];
    }
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(nums, numsSize, k, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: 'Same loop. static on the helper prevents external linkage. Constraints guarantee numsSize >= 1, so nums[0] is a safe seed for lo/hi.',
      },
      go: {
        code: \`func minCapability(nums []int, k int) int {
    feasible := func(cap int) bool {
        count, i, n := 0, 0, len(nums)
        for i < n {
            if nums[i] <= cap {
                count++
                i += 2
            } else {
                i++
            }
        }
        return count >= k
    }
    lo, hi := nums[0], nums[0]
    for _, v := range nums[1:] {
        if v < lo {
            lo = v
        }
        if v > hi {
            hi = v
        }
    }
    for lo < hi {
        mid := lo + (hi-lo)/2
        if feasible(mid) {
            hi = mid
        } else {
            lo = mid + 1
        }
    }
    return lo
}\`,
        complexity: { time: 'O(n log(maxVal))', space: 'O(1)' },
        approach: 'Closure captures nums + k. Single pass for min/max; binary search converges in log2(maxVal - minVal) iterations, each doing an O(n) scan.',
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
// Tokenizer: skip over string literals (', ", `) and // / /* */ comments
// so that braces inside code-template strings don't throw off the count.
let p = openBracePos;
while (p < src.length) {
  const ch = src[p];
  const ch2 = src[p + 1];
  // Line comment
  if (ch === '/' && ch2 === '/') {
    const nl = src.indexOf('\n', p + 2);
    p = nl < 0 ? src.length : nl + 1;
    continue;
  }
  // Block comment
  if (ch === '/' && ch2 === '*') {
    const end = src.indexOf('*/', p + 2);
    p = end < 0 ? src.length : end + 2;
    continue;
  }
  // String literal (', ")
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
  // Template literal `...` with ${...} expressions (which can contain braces)
  if (ch === '`') {
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '`') { p++; break; }
      if (src[p] === '$' && src[p + 1] === '{') {
        // recurse-by-loop: count nested braces until matching }
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
            // nested template — treat conservatively as opaque
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
console.log('Spliced viz fns + 3 entries into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
