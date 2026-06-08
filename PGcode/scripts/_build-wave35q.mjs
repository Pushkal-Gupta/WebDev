#!/usr/bin/env node
// Build WAVE 35Q: uncrossed-lines + minimum-deletions-to-make-string-balanced
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: uncrossed-lines (LC 1035)
//   maxUncrossedLines(nums1: int[], nums2: int[]) -> int
//   Equivalent to the Longest Common Subsequence of nums1 and nums2.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F370A);

  function ref(a, b) {
    const m = a.length, n = b.length;
    // Space-optimized 1-D DP (rolling row).
    const prev = new Array(n + 1).fill(0);
    const curr = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          curr[j] = prev[j - 1] + 1;
        } else {
          curr[j] = Math.max(prev[j], curr[j - 1]);
        }
      }
      for (let j = 0; j <= n; j++) prev[j] = curr[j];
    }
    return prev[n];
  }

  const cases = [];

  // LC sample 1: nums1 = [1,4,2], nums2 = [1,2,4] -> 2
  cases.push([[1, 4, 2], [1, 2, 4]]);
  // LC sample 2: nums1 = [2,5,1,2,5], nums2 = [10,5,2,1,5,2] -> 3
  cases.push([[2, 5, 1, 2, 5], [10, 5, 2, 1, 5, 2]]);
  // LC sample 3: nums1 = [1,3,7,1,7,5], nums2 = [1,9,2,5,1] -> 2
  cases.push([[1, 3, 7, 1, 7, 5], [1, 9, 2, 5, 1]]);
  // Both length 1, equal.
  cases.push([[5], [5]]);
  // Both length 1, different.
  cases.push([[5], [7]]);
  // One empty-like: minimum LC constraint is length >= 1, but driver-style allows.
  cases.push([[1], [1, 2, 3, 4]]);
  cases.push([[1, 2, 3, 4], [4]]);
  // Identical arrays.
  cases.push([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]);
  // Reversed.
  cases.push([[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]]);
  // Disjoint values.
  cases.push([[1, 2, 3], [4, 5, 6]]);
  // All same single value.
  cases.push([[7, 7, 7], [7, 7]]);
  cases.push([[7, 7, 7, 7], [7]]);
  // Interleaved match.
  cases.push([[1, 2, 1, 2, 1], [2, 1, 2, 1, 2]]);
  // Longer subsequence.
  cases.push([[3, 1, 4, 1, 5, 9, 2, 6], [1, 4, 1, 5, 9]]);
  // Strict subsequence preserved.
  cases.push([[1, 2, 3, 4, 5, 6], [2, 4, 6]]);
  cases.push([[2, 4, 6], [1, 2, 3, 4, 5, 6]]);
  // Repeated duplicates.
  cases.push([[1, 1, 1, 1], [1, 1]]);
  cases.push([[1, 2, 1, 2], [2, 1, 2, 1]]);
  // No common element.
  cases.push([[10, 20, 30], [11, 21, 31]]);
  // Long with one match at the end.
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 100], [99, 100]]);
  // Common only at boundaries.
  cases.push([[5, 1, 2, 3, 5], [5, 9, 8, 7, 5]]);
  // Common in middle only.
  cases.push([[9, 8, 5, 7, 6], [4, 5, 3]]);
  // Both length 2.
  cases.push([[1, 2], [2, 1]]);
  cases.push([[1, 2], [1, 2]]);
  cases.push([[3, 3], [3, 3]]);
  // Length boundary mix.
  cases.push([[1, 4, 2, 3, 5], [4, 2, 3]]);
  // Bigger random-feel cases included below from LCG.

  // Random LCG cases.
  while (cases.length < 35) {
    const m = 1 + (lcg() % 10);
    const n = 1 + (lcg() % 10);
    const arr1 = [];
    const arr2 = [];
    for (let i = 0; i < m; i++) arr1.push(1 + (lcg() % 6));
    for (let i = 0; i < n; i++) arr2.push(1 + (lcg() % 6));
    cases.push([arr1, arr2]);
  }

  const test_cases = cases.map(([a, b]) => ({
    inputs: [JSON.stringify(a), JSON.stringify(b)],
    expected: JSON.stringify(ref(a, b))
  }));

  return {
    slug: "uncrossed-lines",
    obj: {
      description: "You are given two integer arrays `nums1` and `nums2`. We write the integers of `nums1` and `nums2` (in the order they are given) on two **separate horizontal lines**.\n\nWe may draw connecting lines: a straight line connecting two numbers `nums1[i]` and `nums2[j]` such that:\n\n- `nums1[i] == nums2[j]`, and\n- The line we draw does not intersect any other connecting (non-horizontal) line.\n\nNote that a connecting line cannot intersect even at the endpoints (each number can belong to **one** connecting line at most).\n\nReturn the **maximum number of connecting lines** we can draw in this way.\n\n**Example 1**\n\n```\nInput:  nums1 = [1,4,2], nums2 = [1,2,4]\nOutput: 2\nExplanation: We can draw 2 uncrossed lines as shown.\nIf we drew a line from 4-4 AND 2-2, they would intersect.\n```\n\n**Example 2**\n\n```\nInput:  nums1 = [2,5,1,2,5], nums2 = [10,5,2,1,5,2]\nOutput: 3\n```\n\n**Example 3**\n\n```\nInput:  nums1 = [1,3,7,1,7,5], nums2 = [1,9,2,5,1]\nOutput: 2\n```\n\nThis is **LeetCode 1035**. The canonical observation is that 'uncrossed lines' between two ordered sequences is **exactly the Longest Common Subsequence (LCS)** of the two sequences — drawing non-crossing matches corresponds to picking common elements that appear in the same relative order in both arrays.",
      method_name: "maxUncrossedLines",
      params: [
        { name: "nums1", type: "int[]" },
        { name: "nums2", type: "int[]" }
      ],
      return_type: "int",
      tags: ["array", "dynamic-programming", "lcs"],
      pattern: "**This is LCS in disguise — classic 2-D DP, O(M*N) time, optionally O(min(M, N)) space.**\n\n**Why uncrossed lines = LCS.** Two connecting lines `(i1, j1)` and `(i2, j2)` (with `i1 < i2` on line 1) do NOT cross iff `j1 < j2` on line 2. So a set of non-crossing connecting lines is exactly a set of index pairs `(i_k, j_k)` where the `i`s are strictly increasing AND the `j`s are strictly increasing — i.e., a common subsequence of `nums1` and `nums2`. Maximizing the count of such lines is maximizing the LENGTH of a common subsequence. This is the LCS problem.\n\n**Standard 2-D DP recurrence.** Let `dp[i][j]` = length of the longest common subsequence of `nums1[0..i-1]` and `nums2[0..j-1]`. Base: `dp[0][j] = dp[i][0] = 0`. Recurrence:\n\n```\nif nums1[i-1] == nums2[j-1]:\n    dp[i][j] = dp[i-1][j-1] + 1        # pair the matching elements\nelse:\n    dp[i][j] = max(dp[i-1][j], dp[i][j-1])   # skip one side\n```\n\nThe answer is `dp[M][N]`. Time `O(M*N)`, space `O(M*N)` (or `O(min(M,N))` with rolling rows).\n\n**Why the recurrence is correct.** Either we pair the last elements (when they match) and recurse on the strict prefixes, OR we skip the last element of one of the two arrays. The `max` covers all three options when there's no match; the `+1` branch is strictly optimal when the elements match (proof: any LCS that doesn't pair them can be transformed into one that does, without lowering the length).\n\n**Worked example.** `nums1 = [2,5,1,2,5]`, `nums2 = [10,5,2,1,5,2]`. Build the DP table (rows = `nums1`, cols = `nums2`):\n\n```\n      [] 10  5  2  1  5  2\n  []   0  0  0  0  0  0  0\n   2   0  0  0  1  1  1  1\n   5   0  0  1  1  1  2  2\n   1   0  0  1  1  2  2  2\n   2   0  0  1  2  2  2  3\n   5   0  0  1  2  2  3  3\n```\n\nAnswer = `dp[5][6] = 3`. Matches LC.\n\n**Space optimization (rolling row).** Only the previous row is needed:\n\n```\nprev = [0] * (n + 1)\ncurr = [0] * (n + 1)\nfor i in 1..m:\n    for j in 1..n:\n        if nums1[i-1] == nums2[j-1]:\n            curr[j] = prev[j-1] + 1\n        else:\n            curr[j] = max(prev[j], curr[j-1])\n    prev, curr = curr, prev   # swap; curr will be overwritten\n    # zero-out curr if your language doesn't auto-init (or do an explicit fill)\nreturn prev[n]\n```\n\nMemory: `O(min(M, N))` if you choose to put the shorter array in the inner dimension.\n\n**Brute-force baselines.**\n- **Recursion without memo**: `O(2^(M+N))` — exponential. Trivially infeasible past ~25 total length.\n- **Memoized recursion**: `O(M*N)` — same as bottom-up but with recursion overhead.\n- **Enumerate every subsequence pair**: `O(2^M * 2^N)` — completely infeasible.\n\nThe 2-D DP is THE answer for this problem family.\n\n**Why the 'uncrossed' framing is the standard LCS interpretation.** LCS captures 'common items in the same relative order'. Drawing crossings would mean reversing order on one side, which is exactly what LCS forbids.\n\n**Edge cases.**\n- **One array is length 1**: LCS = 1 if that element appears in the other; else 0.\n- **Identical arrays**: LCS = length of the array.\n- **Disjoint values**: no element of `nums1` equals any element of `nums2` — LCS = 0.\n- **All-equal arrays** (e.g., `[7,7,7]` vs `[7,7]`): LCS = `min(m, n) = 2`.\n- **One array is a subsequence of the other**: LCS = length of the shorter (subsequence) one.\n\n**Common bugs.**\n1. **Off-by-one on indices** — `nums1[i-1]` when iterating `i` from `1` to `m` is correct; `nums1[i]` would walk off the end.\n2. **Confusing LCS with longest common SUBSTRING** — substring requires contiguity; LCS does NOT. The two problems have different recurrences (substring resets to 0 on mismatch).\n3. **Forgetting the `max` when elements don't match** — leads to incorrect smaller answers.\n4. **Space-rolling the WRONG row** — when swapping `prev` and `curr`, ensure `curr` is reset for the next iteration (or overwritten cell-by-cell, which it is here since the inner loop touches every `curr[j]`).\n5. **Using `>=` instead of `==`** for the element-match check — values are integers, equality is strict.",
      follow_up: "**Variant 1 — reconstruct the actual line pairs.** Backtrack from `dp[M][N]`: at each step, if `nums1[i-1] == nums2[j-1]` and `dp[i][j] = dp[i-1][j-1] + 1`, record `(i-1, j-1)` and go to `(i-1, j-1)`. Otherwise move to whichever of `(i-1, j)` or `(i, j-1)` has the equal `dp` value.\n\n**Variant 2 — strings instead of int arrays.** Same algorithm with character comparisons. Time and space unchanged.\n\n**Variant 3 — LCS with weighted matches.** Each match `(i, j)` carries a weight `w(i, j)`; maximize the total weight of a non-crossing pairing. Recurrence: `dp[i][j] = max(dp[i-1][j-1] + w(i, j) if match, dp[i-1][j], dp[i][j-1])`. Same `O(M*N)`.\n\n**Variant 4 — LCS of THREE sequences.** `dp[i][j][k]` with `O(M*N*P)` time and space. For small alphabets, faster algorithms exist.\n\n**Variant 5 — bit-parallel Hunt–Szymanski / Hyyro algorithm.** Beats `O(M*N)` when the alphabet is small and one array is short. Runs in `O(M * ceil(N/W))` where `W` is the machine word size — practical speedups of 60x in benchmarks.\n\n**Variant 6 — LIS reduction (Hunt–Szymanski).** When elements of `nums2` are mostly unique, transform LCS to a Longest Increasing Subsequence problem on positions: for each value `v` in `nums1`, list `v`'s positions in `nums2` in DECREASING order; concatenate; LIS of this concatenation = LCS. Runs in `O((M + N) log N)`.\n\n**Variant 7 — output the EDIT distance instead.** The edit-distance recurrence is closely related; for two arrays of length `M` and `N`, `edit_dist = M + N - 2 * LCS` when only insertion/deletion are allowed.\n\n**Implementation pitfalls.**\n1. **Allocating `(M+1) * (N+1)` for huge arrays.** For LC constraints (M, N ≤ 500) the full 2-D table is fine, ~250K cells. For larger inputs use rolling rows.\n2. **Iterating `i` from `0` to `m-1` and indexing `dp[i+1][j+1]`** — works but doubles the off-by-one risk; prefer `1..m` iteration with `nums1[i-1]`.\n3. **Treating the empty array as a special case explicitly.** Not needed — `dp[0][*] = dp[*][0] = 0` handles it.\n4. **Using `==` on objects in a language that needs `.equals()`** (Java boxed Integer). Either unbox to `int[]` or use `equals()` consistently.\n5. **Mutating the input arrays** during the DP. Never needed; treat both as read-only.\n6. **Returning the table itself instead of `dp[M][N]`.** The answer is the bottom-right cell.\n7. **Failing to reset the `curr` row between iterations** when using rolling-row DP — only safe if every cell is unconditionally overwritten by the inner loop (which it is in the standard formulation).",
      complexity: {
        time: "**O(M * N)** where `M = len(nums1)` and `N = len(nums2)`. Every cell of the `(M+1) x (N+1)` DP table is filled in constant time.",
        space: "**O(M * N)** for the full table, or **O(min(M, N))** with rolling rows. The input arrays are read-only.",
        notes: "This is the canonical Longest Common Subsequence problem (LC 1143 'Longest Common Subsequence' is the identical computation on strings). The 'uncrossed lines' interpretation is just a geometric framing.",
        optimal: "**O(M * N) time is optimal for general LCS** under standard comparison-based models. **O(M + N) lower bound** is known but only the O(M*N) algorithm is universally applicable; faster algorithms (bit-parallel, four-Russians) exist for restricted inputs."
      },
      constraints: [
        "1 <= nums1.length, nums2.length <= 500",
        "1 <= nums1[i], nums2[j] <= 2000",
        "Each pairing must connect equal values: nums1[i] == nums2[j]",
        "Each index can participate in at most one connecting line"
      ],
      hints: [
        "**Uncrossed lines = Longest Common Subsequence.** Two matches `(i1, j1)` and `(i2, j2)` don't cross iff `(i1 < i2)` AND `(j1 < j2)` — i.e., the matched indices form an increasing pair on both sides.",
        "**Standard 2-D DP.** Let `dp[i][j]` = LCS length of `nums1[0..i-1]` and `nums2[0..j-1]`.",
        "**Recurrence**: if `nums1[i-1] == nums2[j-1]` then `dp[i][j] = dp[i-1][j-1] + 1`; else `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.",
        "**Answer is `dp[M][N]`** — the bottom-right cell of the DP table.",
        "**Space optimization**: only the previous row is needed, so `O(min(M, N))` space suffices with rolling rows.",
        "**This is NOT longest common SUBSTRING** — uncrossed lines do not require contiguous indices; the DP recurrence is different."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def maxUncrossedLines(self, nums1: List[int], nums2: List[int]) -> int:\n        m, n = len(nums1), len(nums2)\n        prev = [0] * (n + 1)\n        curr = [0] * (n + 1)\n        for i in range(1, m + 1):\n            for j in range(1, n + 1):\n                if nums1[i - 1] == nums2[j - 1]:\n                    curr[j] = prev[j - 1] + 1\n                else:\n                    curr[j] = max(prev[j], curr[j - 1])\n            prev, curr = curr, prev\n            for j in range(n + 1):\n                curr[j] = 0\n        return prev[n]\n",
        javascript: "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar maxUncrossedLines = function(nums1, nums2) {\n    const m = nums1.length, n = nums2.length;\n    let prev = new Array(n + 1).fill(0);\n    let curr = new Array(n + 1).fill(0);\n    for (let i = 1; i <= m; i++) {\n        for (let j = 1; j <= n; j++) {\n            if (nums1[i - 1] === nums2[j - 1]) {\n                curr[j] = prev[j - 1] + 1;\n            } else {\n                curr[j] = Math.max(prev[j], curr[j - 1]);\n            }\n        }\n        const tmp = prev; prev = curr; curr = tmp;\n        for (let j = 0; j <= n; j++) curr[j] = 0;\n    }\n    return prev[n];\n};\n",
        java: "class Solution {\n    public int maxUncrossedLines(int[] nums1, int[] nums2) {\n        int m = nums1.length, n = nums2.length;\n        int[] prev = new int[n + 1];\n        int[] curr = new int[n + 1];\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (nums1[i - 1] == nums2[j - 1]) {\n                    curr[j] = prev[j - 1] + 1;\n                } else {\n                    curr[j] = Math.max(prev[j], curr[j - 1]);\n                }\n            }\n            int[] tmp = prev; prev = curr; curr = tmp;\n            for (int j = 0; j <= n; j++) curr[j] = 0;\n        }\n        return prev[n];\n    }\n}\n",
        cpp: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxUncrossedLines(vector<int>& nums1, vector<int>& nums2) {\n        int m = (int) nums1.size(), n = (int) nums2.size();\n        vector<int> prev(n + 1, 0), curr(n + 1, 0);\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (nums1[i - 1] == nums2[j - 1]) {\n                    curr[j] = prev[j - 1] + 1;\n                } else {\n                    curr[j] = max(prev[j], curr[j - 1]);\n                }\n            }\n            swap(prev, curr);\n            fill(curr.begin(), curr.end(), 0);\n        }\n        return prev[n];\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: minimum-deletions-to-make-string-balanced (LC 1653)
//   minimumDeletions(s: str) -> int
//   s consists only of 'a' and 'b'. A balanced string has no 'b' followed by an 'a'.
//   Find the minimum deletions so the resulting string is balanced.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F370B);

  function ref(s) {
    // O(n) single pass: maintain count of 'b' seen so far and total deletions.
    // For every 'a' encountered, we either delete it (cost 1) OR delete all 'b's before it.
    // delete = min(delete + 1 [delete this 'a'], b_count [delete all preceding b's])
    // Equivalently: maintain b_count and del. On 'b': b_count++. On 'a': del = min(del + 1, b_count).
    let b = 0, del = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i);
      if (c === 'b') {
        b++;
      } else {
        // 'a'
        del = Math.min(del + 1, b);
      }
    }
    return del;
  }

  const cases = [];

  // LC sample 1: "aababbab" -> 2
  cases.push(["aababbab"]);
  // LC sample 2: "bbaaaaabb" -> 2
  cases.push(["bbaaaaabb"]);
  // Single char.
  cases.push(["a"]);
  cases.push(["b"]);
  // Already balanced (all a's).
  cases.push(["aaaa"]);
  // Already balanced (all b's).
  cases.push(["bbbb"]);
  // Already balanced (a's then b's).
  cases.push(["aaabbb"]);
  cases.push(["aaaaaabbbbbb"]);
  // Worst-case reversed: all b's then all a's.
  cases.push(["bbbbaaaa"]);
  cases.push(["ba"]);
  cases.push(["ab"]);
  // Alternating.
  cases.push(["ababab"]);
  cases.push(["bababa"]);
  cases.push(["abababab"]);
  cases.push(["babababa"]);
  // Two-char strings.
  cases.push(["aa"]);
  cases.push(["bb"]);
  // Trailing/leading clusters.
  cases.push(["aaabbba"]);
  cases.push(["abbba"]);
  cases.push(["baaab"]);
  cases.push(["bbaaa"]);
  cases.push(["aaaab"]);
  cases.push(["baaaa"]);
  // Longer mixed.
  cases.push(["aabbbaabbaa"]);
  cases.push(["bbaabbaabb"]);
  cases.push(["abbaabbaab"]);
  cases.push(["aabbabba"]);
  // Empty edge — LC says length >= 1, but the reference handles it.
  cases.push([""]);
  // Long uniform.
  cases.push(["a".repeat(20)]);
  cases.push(["b".repeat(20)]);
  // Long alternating.
  cases.push(["ab".repeat(10)]);
  cases.push(["ba".repeat(10)]);

  // Random LCG cases.
  while (cases.length < 40) {
    const n = 1 + (lcg() % 25);
    let s = "";
    for (let i = 0; i < n; i++) {
      s += ((lcg() % 2) === 0) ? "a" : "b";
    }
    cases.push([s]);
  }

  const test_cases = cases.map(([s]) => ({
    inputs: [JSON.stringify(s)],
    expected: JSON.stringify(ref(s))
  }));

  return {
    slug: "minimum-deletions-to-make-string-balanced",
    obj: {
      description: "You are given a string `s` consisting only of characters `'a'` and `'b'`.\n\nYou can delete any number of characters from `s` to make it **balanced**. A string is called **balanced** if there is **no pair of indices `(i, j)`** such that `i < j` and `s[i] == 'b'` and `s[j] == 'a'`.\n\nReturn the **minimum number of deletions** needed to make `s` balanced.\n\nEquivalently, a balanced string must consist of some (possibly empty) prefix of `'a'`s followed by some (possibly empty) suffix of `'b'`s — i.e., it matches the regex `a*b*`.\n\n**Example 1**\n\n```\nInput:  s = \"aababbab\"\nOutput: 2\nExplanation: You can delete s[2] = 'b' and s[6] = 'a' to obtain \"aaabbb\" (a*b*).\nThe deletions of count 2 are optimal.\n```\n\n**Example 2**\n\n```\nInput:  s = \"bbaaaaabb\"\nOutput: 2\nExplanation: Delete the two leading 'b's to obtain \"aaaaabb\" (already balanced).\n```\n\nThis is **LeetCode 1653**. The canonical solution is a **single O(N) pass** with a tiny DP: maintain `b_count` (number of `'b'`s seen so far) and `del` (minimum deletions to balance the prefix up to here). On every `'a'` encountered, we either delete THIS `'a'` (cost `del + 1`) or delete ALL previously-seen `'b'`s (cost `b_count`). Take the minimum.",
      method_name: "minimumDeletions",
      params: [
        { name: "s", type: "str" }
      ],
      return_type: "int",
      tags: ["string", "dynamic-programming", "stack"],
      pattern: "**One-pass O(N) DP — two integer counters, no extra arrays.**\n\n**Reformulation.** A 'balanced' string is exactly a prefix of `'a'`s followed by a suffix of `'b'`s — i.e., it matches `a*b*`. Equivalently, NO `'b'` is ever followed by an `'a'`. The complement of balanced is 'contains some `'b'` before some `'a'`'.\n\n**Two ways to think about it.**\n\n*Approach A — count prefix `'b'`s and suffix `'a'`s.* Choose a split index `k` (between 0 and n inclusive). Make positions `[0..k-1]` the `'a'` prefix and positions `[k..n-1]` the `'b'` suffix. To do this, delete all `'b'`s in `[0..k-1]` AND all `'a'`s in `[k..n-1]`. Compute prefix `'b'`-count and suffix `'a'`-count for every `k`; the answer is `min over k of (prefix_b[k] + suffix_a[k])`. O(N) time, O(N) space.\n\n*Approach B — single-pass DP.* Maintain two counters:\n- `b` = count of `'b'`s seen so far in the scan.\n- `del` = minimum deletions to balance the prefix scanned so far.\n\nOn encountering `s[i]`:\n- If `s[i] == 'b'`: just increment `b`. No new deletions are forced — `'b'`s never violate balance ON THEIR OWN.\n- If `s[i] == 'a'`: we have two choices.\n  1. Delete this `'a'`: new `del = del + 1`.\n  2. Keep this `'a'` but delete every `'b'` that came before: new `del = b`.\n  Pick the cheaper: `del = min(del + 1, b)`.\n\nWhy this is correct: any violating pair `(i, j)` with `i < j`, `s[i] == 'b'`, `s[j] == 'a'` is broken by either deleting the `'b'` (charged to some prior decision) or deleting the `'a'` (charged on the current step). The DP captures the global optimum because of the optimal-substructure: the cheapest balance of `s[0..i]` is determined by the cheapest balance of `s[0..i-1]` plus the local cost of `s[i]`.\n\n*Approach C — stack.* Use a stack that simulates the kept string. Pushing `'b'` is free. Pushing `'a'` is free if the top is `'a'` (still in the prefix). If the top is `'b'`, you must either pop the `'b'` (delete it) or skip the `'a'` (delete it). Take whichever increments your deletion counter the same; both lead to the same DP. Stack uses O(N) extra space.\n\n**Algorithm (Approach B).**\n\n```\nb, del = 0, 0\nfor c in s:\n    if c == 'b':\n        b += 1\n    else:  # c == 'a'\n        del = min(del + 1, b)\nreturn del\n```\n\n**Worked example.** `s = 'aababbab'`. Walk through:\n\n| i | s[i] | b | del          |\n|---|------|---|--------------|\n| 0 | a    | 0 | min(1, 0) = 0 |\n| 1 | a    | 0 | min(1, 0) = 0 |\n| 2 | b    | 1 | 0            |\n| 3 | a    | 1 | min(1, 1) = 1 |\n| 4 | b    | 2 | 1            |\n| 5 | b    | 3 | 1            |\n| 6 | a    | 3 | min(2, 3) = 2 |\n| 7 | b    | 4 | 2            |\n\nReturn `del = 2`. Matches LC.\n\n**Why `min(del + 1, b)`.** Intuitively, `b` is the cost of deleting all preceding `'b'`s (which would make ALL future `'a'`s free); `del + 1` is the cost of keeping all preceding state and deleting just THIS `'a'`. The DP value tracks the minimum of those alternatives for the prefix ending at the current index.\n\n**Brute-force baselines.**\n- **Try all `2^N` subsets of deletions and check balance**: O(2^N * N). Infeasible past ~25.\n- **Try every split point `k` with prefix/suffix sums**: O(N) time, O(N) space. Cleaner but uses more memory.\n- **Recursion with memo on `(i, lastKept)`**: O(N) states, O(1) per transition, but recursion overhead. Same answer.\n\nThe one-pass O(1)-space DP is the cleanest formulation.\n\n**Edge cases.**\n- **Empty string** (LC constraint `n >= 1` precludes this, but the algorithm returns 0 anyway). Balanced trivially.\n- **All `'a'`s** or **all `'b'`s**: balanced. Return 0.\n- **`s = 'a*b*'` already**: no work to do; the loop's `min(del+1, b)` naturally stays at 0 because either `b == 0` (no `'b'`s yet seen) so `min(del+1, 0) = 0`, OR all `'a'`s came first so `del` stays at 0 and there are no `'a'`s after the first `'b'`.\n- **`s = 'ba'`**: del = 1 (delete either char).\n- **`s = 'bababa'`**: alternating; del = 3 (delete every other char optimally).\n\n**Common bugs.**\n1. **Not initializing `b` and `del` to 0**. (Some refactors swap one out.)\n2. **Using `del = min(del, b)` without the `+ 1` on the delete-this-`'a'` branch.** That undercounts by 1 every time you encounter an `'a'` after a `'b'`.\n3. **Counting `'a'`s instead of `'b'`s** — the algorithm requires tracking the LEFT character ('b' here) because that's what blocks future right-chars ('a' here).\n4. **Treating empty string as a special case explicitly** — not needed; the loop is trivially empty and the counters stay at 0.\n5. **Mishandling Unicode or whitespace** — LC says input contains only `'a'` and `'b'`; defensive parsing isn't needed.",
      follow_up: "**Variant 1 — three-letter alphabet** (e.g., `'a'`, `'b'`, `'c'` and 'balanced' means `a*b*c*`). Extend the DP with two counters: `b` (count of `'b'`s seen) and `c` (count of `'c'`s seen). On `'a'`: `del = min(del + 1, b + c)`. On `'b'`: `del = min(del + 1, c)`; `b += 1`. On `'c'`: `c += 1`. Generalizes to any k-letter sorted alphabet with a k-1 counter DP.\n\n**Variant 2 — INSERT instead of DELETE.** Insert characters to balance. The answer becomes: 'how many `'a'`s appear after some `'b'`?' — you can fix each such `'a'` by inserting a `'b'` before each later `'a'` OR by inserting a `'a'` before each earlier `'b'`. Reduces to a similar one-pass count.\n\n**Variant 3 — DELETE or SWAP.** A swap of adjacent `b a` -> `a b` costs 1. This changes the problem dramatically; it's equivalent to bubble-sort distance, computable in `O(N log N)` via inversion counts (Fenwick tree).\n\n**Variant 4 — minimize the LONGEST balanced subsequence is removed.** Different optimization; harder to formalize.\n\n**Variant 5 — k-character window 'balanced'**: balanced means every window of size `k` has no `'b'` before `'a'`. A more local constraint; sliding-window DP applies.\n\n**Variant 6 — output the resulting balanced string** (not just the count). Track for each step which choice was made, then reconstruct the kept positions. `O(N)` extra memory for the bit-trail.\n\n**Variant 7 — multi-line input where each line is balanced independently**: trivial — sum the per-line answers. Useful for stream-processing variants.\n\n**Implementation pitfalls.**\n1. **Reading `s` with a stale iterator** when the string is huge — fine in practice for LC scale, just don't materialize a copy.\n2. **Using `del = b` unconditionally on `'a'`** instead of the `min`. That gives the right answer ONLY when `del + 1 >= b`, i.e., when there are already a lot of `'b'`s. The `min` captures both regimes.\n3. **Forgetting that `'b'`s alone don't cost anything** — the algorithm correctly increments `b` and leaves `del` alone.\n4. **Integer overflow**: `del` and `b` can each reach `n`; for LC's `n ≤ 10^5` this is well within `int`. For larger `n`, use `long`.\n5. **Off-by-one when interpreting 'balanced'**: the spec says NO `'b'` before any `'a'`. A single `'b'` followed by no `'a'` is balanced (b*). A single `'a'` followed by no `'b'` is also balanced (a*).\n6. **Trying to be clever with regex matching** (`s.match(/^a*b*$/)`) — that's a verifier, not a solver. You still need the DP for the count.\n7. **Adapting the algorithm to a SLIDING WINDOW** — irrelevant; this is a whole-string DP, not a window problem.",
      complexity: {
        time: "**O(N)** where `N = len(s)`. Single linear scan, constant work per character.",
        space: "**O(1)** auxiliary — two integer counters (`b` and `del`) plus a loop variable. The input string is read-only.",
        notes: "The single-pass DP is equivalent to the prefix-b/suffix-a formulation but uses no extra arrays. Stack-based implementations work too but use O(N) memory.",
        optimal: "**O(N) time and O(1) space** is tight. Every character must be examined at least once to determine its contribution to the deletion count."
      },
      constraints: [
        "1 <= s.length <= 10^5",
        "s[i] is either 'a' or 'b'",
        "A balanced string contains no pair (i, j) with i < j, s[i] = 'b', s[j] = 'a'",
        "Equivalently, balanced strings match the regex a*b*"
      ],
      hints: [
        "**A balanced string is `a*b*`** — some `'a'`s followed by some `'b'`s. Equivalently, no `'b'` is ever followed by an `'a'`.",
        "**Single-pass DP with two counters**: `b` = number of `'b'`s seen so far; `del` = minimum deletions to balance the prefix.",
        "**On `'b'`**: just increment `b`; deletions stay the same. A `'b'` never violates balance on its own.",
        "**On `'a'`**: choose between deleting this `'a'` (`del + 1`) and deleting all preceding `'b'`s (`b`). Take `min(del + 1, b)`.",
        "**Alternative**: compute prefix-`'b'`-count and suffix-`'a'`-count, then `answer = min over k of (prefix_b[k] + suffix_a[k])`.",
        "**Stack approach** works too: pushing keeps the kept string; popping or skipping increments the deletion counter. Same answer with O(N) extra space."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def minimumDeletions(self, s: str) -> int:\n        b = 0\n        delete = 0\n        for c in s:\n            if c == 'b':\n                b += 1\n            else:  # 'a'\n                delete = min(delete + 1, b)\n        return delete\n",
        javascript: "/**\n * @param {string} s\n * @return {number}\n */\nvar minimumDeletions = function(s) {\n    let b = 0, del = 0;\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (c === 'b') {\n            b++;\n        } else {\n            del = Math.min(del + 1, b);\n        }\n    }\n    return del;\n};\n",
        java: "class Solution {\n    public int minimumDeletions(String s) {\n        int b = 0, del = 0;\n        for (int i = 0; i < s.length(); i++) {\n            char c = s.charAt(i);\n            if (c == 'b') {\n                b++;\n            } else {\n                del = Math.min(del + 1, b);\n            }\n        }\n        return del;\n    }\n}\n",
        cpp: "#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minimumDeletions(string s) {\n        int b = 0, del = 0;\n        for (char c : s) {\n            if (c == 'b') {\n                b++;\n            } else {\n                del = min(del + 1, b);\n            }\n        }\n        return del;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 35Q START =====",
    "// === WAVE 35Q " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35Q " + p1.slug + " END ===",
    "// === WAVE 35Q " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35Q " + p2.slug + " END ===",
    "// ===== WAVE 35Q END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// Guard: don't double-write.
if (src.indexOf("WAVE 35Q START") !== -1) {
  console.error("WAVE 35Q already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35P END marker and append block after it.
const ANCHOR = "// ===== WAVE 35P END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave35q " + p1.slug + " + " + p2.slug);
