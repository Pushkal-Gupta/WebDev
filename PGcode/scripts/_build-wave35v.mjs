#!/usr/bin/env node
// Build WAVE 35V: minimize-maximum-pair-sum-in-array + maximum-population-year

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
// PROBLEM 1: minimize-maximum-pair-sum-in-array (LC 1877)
//   minPairSum(nums: int[]) -> int
//   Pair up the 2n elements into n pairs; minimize the max pair sum.
//   Canonical: sort, pair smallest with largest (i with n-1-i), return max sum.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F375A);

  function ref(nums) {
    const arr = nums.slice().sort((a, b) => a - b);
    const n = arr.length;
    let best = 0;
    for (let i = 0; i < n / 2; i++) {
      const s = arr[i] + arr[n - 1 - i];
      if (s > best) best = s;
    }
    return best;
  }

  const cases = [];

  // LC sample 1: [3,5,2,3] -> pairs (2,5)(3,3) -> max(7,6) = 7
  cases.push([[3, 5, 2, 3]]);
  // LC sample 2: [3,5,4,2,4,6] -> sorted [2,3,4,4,5,6] -> pairs (2,6)(3,5)(4,4) -> max=8
  cases.push([[3, 5, 4, 2, 4, 6]]);

  // Minimum size (n=2).
  cases.push([[1, 1]]);
  cases.push([[1, 2]]);
  cases.push([[1, 100000]]);
  cases.push([[100000, 100000]]);

  // All equal.
  cases.push([[5, 5, 5, 5]]);
  cases.push([[7, 7, 7, 7, 7, 7]]);
  cases.push([[1, 1, 1, 1, 1, 1, 1, 1]]);

  // Two distinct values.
  cases.push([[1, 1, 2, 2]]); // pairs (1,2)(1,2) -> 3
  cases.push([[1, 1, 1, 100, 100, 100]]); // (1,100)(1,100)(1,100) -> 101

  // Already sorted ascending.
  cases.push([[1, 2, 3, 4, 5, 6]]);
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8]]);

  // Sorted descending.
  cases.push([[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]]);

  // Two extremes dominate.
  cases.push([[1, 1, 1, 1, 99999]]); // odd length is illegal per constraints; let's keep even
  cases.pop();
  cases.push([[1, 1, 1, 1, 1, 99999]]); // (1,99999)(1,1)(1,1) -> 100000
  cases.push([[1, 2, 3, 4, 5, 100000]]); // (1,100000)(2,5)(3,4) -> 100001

  // Big array, ascending.
  cases.push([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]]);

  // Big array, descending.
  cases.push([[16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]]);

  // Random with duplicates.
  cases.push([[1, 3, 5, 3, 1, 3, 5, 3]]); // sorted [1,1,3,3,3,3,5,5] -> pairs (1,5)(1,5)(3,3)(3,3) -> 6
  cases.push([[10, 20, 10, 20, 10, 20]]); // (10,20)(10,20)(10,20) -> 30

  // Pair-sum dominated by single big value at end.
  cases.push([[1, 1, 1, 1, 50000, 50000]]); // (1,50000)(1,50000)(1,1) -> 50001

  // Edge values near upper bound.
  cases.push([[100000, 1, 100000, 1]]); // (1,100000)(1,100000) -> 100001
  cases.push([[99999, 99998, 99997, 99996]]); // sorted [99996..99999] -> (99996,99999)(99997,99998) -> 199995

  // Mixed mid-range.
  cases.push([[50, 30, 20, 40, 10, 60]]); // sorted [10,20,30,40,50,60] -> (10,60)(20,50)(30,40) -> 70
  cases.push([[8, 2, 6, 4, 10, 12, 14, 16]]); // sorted [2,4,6,8,10,12,14,16] -> (2,16)(4,14)(6,12)(8,10) -> 18

  // Random LCG-generated cases.
  while (cases.length < 36) {
    let n = 2 + 2 * ((lcg() % 7) + 1); // even, 4..16
    const a = [];
    for (let i = 0; i < n; i++) {
      a.push(1 + (lcg() % 100000)); // 1..100000
    }
    cases.push([a]);
  }

  const test_cases = cases.map(([nums]) => ({
    inputs: [JSON.stringify(nums)],
    expected: JSON.stringify(ref(nums))
  }));

  return {
    slug: "minimize-maximum-pair-sum-in-array",
    obj: {
      description: "The **pair sum** of a pair `(a, b)` is equal to `a + b`. The **maximum pair sum** is the largest **pair sum** in a list of pairs.\n\nFor example, if we have pairs `(1, 5)`, `(2, 3)`, and `(4, 4)`, the maximum pair sum would be `max(1+5, 2+3, 4+4) = max(6, 5, 8) = 8`.\n\nGiven an array `nums` of **even** length `n`, pair up the elements of `nums` into `n / 2` pairs such that:\n\n- Each element of `nums` is in **exactly one** pair, and\n- The **maximum pair sum** is **minimized**.\n\nReturn the minimized **maximum pair sum** after optimally pairing up the elements.\n\n**Example 1**\n\n```\nInput:  nums = [3,5,2,3]\nOutput: 7\nExplanation: Sort -> [2,3,3,5]. Pair (2,5) and (3,3). Max pair sum = max(7, 6) = 7.\n```\n\n**Example 2**\n\n```\nInput:  nums = [3,5,4,2,4,6]\nOutput: 8\nExplanation: Sort -> [2,3,4,4,5,6]. Pair (2,6), (3,5), (4,4). Max = 8.\n```\n\nThis is **LeetCode 1877**. The canonical approach is **sort + pair-from-ends**: pair the smallest with the largest, second-smallest with second-largest, and so on. The maximum across these pairs is the answer. A short proof via the exchange argument shows this is optimal.",
      method_name: "minPairSum",
      params: [
        { name: "nums", type: "int[]" }
      ],
      return_type: "int",
      tags: ["array", "sorting", "two-pointers", "greedy"],
      pattern: "**Sort the array. Pair the i-th smallest with the i-th largest. The answer is the maximum of those n/2 pair sums.**\n\n**Why pair-from-ends is optimal — exchange argument.** Suppose an optimal pairing does NOT pair the smallest element `s` with the largest `L`. Then `s` is paired with some `x` and `L` is paired with some `y`, where `s <= x` and `y <= L`. The two relevant pair sums are `s + x` and `y + L`. After swapping (pair `s` with `L`, pair `x` with `y`), the new pair sums are `s + L` and `x + y`.\n\nWe must show that `max(s + L, x + y) <= max(s + x, y + L)`. Note:\n- `x + y <= y + L` (since `x <= L`), so `x + y <= max(s + x, y + L)`.\n- `s + L <= y + L` iff `s <= y`, which holds because `s` is the smallest. So `s + L <= y + L <= max(s + x, y + L)`.\n\nBoth new pair sums are bounded by the maximum of the original two, so the maximum did not increase. Therefore pairing smallest with largest is no worse. Repeat for the remaining elements.\n\n**The algorithm in three lines.**\n\n```\nsort(nums)\nreturn max(nums[i] + nums[n - 1 - i] for i in 0..n/2-1)\n```\n\n**Why we need to check ALL i, not just i=0.** Intuitively the (smallest, largest) pair seems like the dangerous one — but consider `nums = [1, 1, 1, 100, 100, 100]`. Sorted: same. Pairs: (1,100), (1,100), (1,100). All pair sums equal 101. Now consider `nums = [1, 1, 99, 100, 100, 100]`. Sorted: same. Pairs: (1,100), (1,100), (99,100) — last pair sum is 199, the max. So the max can fall on any pair, not just the first. Always scan all n/2 pairs.\n\n**Two-pointer realization (no max sweep needed conceptually).** Use `lo = 0`, `hi = n - 1`. While `lo < hi`, update `best = max(best, nums[lo] + nums[hi])`, then `lo++; hi--`. Same work as the for-loop above.\n\n**Worked example.** `nums = [3, 5, 4, 2, 4, 6]`. Sort -> `[2, 3, 4, 4, 5, 6]`.\n\n```\n  i=0: 2 + 6 = 8\n  i=1: 3 + 5 = 8\n  i=2: 4 + 4 = 8\n```\n\nMax = 8. Return **8**.\n\nAnother example. `nums = [3, 5, 2, 3]`. Sort -> `[2, 3, 3, 5]`.\n\n```\n  i=0: 2 + 5 = 7\n  i=1: 3 + 3 = 6\n```\n\nMax = 7. Return **7**.\n\n**Edge cases.**\n- **Minimum size n=2**: one pair, return `nums[0] + nums[1]`.\n- **All equal**: every pair sum is `2 * v`. Return `2 * v`.\n- **Two extremes**: `nums = [1, 1, 100000, 100000]`. Pair (1, 100000) twice. Max = 100001.\n- **Already sorted ascending or descending**: doesn't matter — sorting handles it; pair-from-ends gives the same answer regardless of input order.\n\n**Complexity.** Sort is `O(n log n)`. The pair scan is `O(n)`. Total `O(n log n)` time, `O(1)` extra space (if you sort in place) or `O(n)` (if you sort a copy).",
      follow_up: "**Variant 1 — minimize the SUM of pair sums.** Trivial: any pairing has total = sum(nums). All pairings tie.\n\n**Variant 2 — maximize the maximum pair sum.** Sort and pair LARGEST with second-largest, third with fourth, etc.; or equivalently, the answer is `nums[n-1] + nums[n-2]` (just take the top two). Even simpler: it's `max1 + max2`.\n\n**Variant 3 — minimize the AVERAGE pair sum.** Same as minimizing sum — invariant under pairing.\n\n**Variant 4 — minimize the MAXIMUM pair PRODUCT.** Sort + pair-from-ends still works under similar exchange logic, but the proof is subtler (consider negative values). For positive integers, pair smallest with largest as before.\n\n**Variant 5 — minimize the MAXIMUM pair DIFFERENCE.** Now you want adjacent values together: sort and pair consecutive elements `(nums[2i], nums[2i+1])`. The max difference is the largest adjacent gap.\n\n**Variant 6 — odd-length array, one element unpaired.** Choose which element to leave out (try each, or use a smarter argument). Likely the median or near-median.\n\n**Variant 7 — pair into k-tuples instead of pairs.** Minimize the maximum tuple sum. Equivalent to a bin-packing variant; NP-hard in general.\n\n**Variant 8 — minimize the kth-largest pair sum (not the max).** Replace 'max' with 'kth percentile'; the greedy may not extend cleanly.\n\n**Variant 9 — online / streaming.** Elements arrive one at a time; maintain the best pairing so far. Needs a data structure (e.g., sorted multiset) to efficiently update.\n\n**Implementation pitfalls.**\n1. **Not sorting first** — pair-from-ends only works on sorted input.\n2. **Pairing nums[i] with nums[i+1]** — that minimizes the SUM of pair sums (no — wait, it's invariant) but doesn't minimize the MAX. You'd get pairs (1,2),(3,4),... which has max sum = top two consecutive, often larger than pair-from-ends.\n3. **Returning the LAST pair sum** instead of the MAX — they happen to be equal in some inputs but not all.\n4. **Off-by-one on the loop range** — iterate `i` from 0 to `n/2 - 1` inclusive (n/2 iterations). Pair `(i, n-1-i)`.\n5. **Modifying the input array** — if the caller cares, sort a copy.\n6. **Overflow** — for nums[i] up to 10^5 and n up to 10^5, pair sums fit easily in int32.",
      complexity: {
        time: "**O(n log n)** — dominated by the sort. The pair-scan is `O(n)`.",
        space: "**O(1)** extra if you sort in place; **O(n)** if you sort a copy. Standard library sorts often use `O(log n)` recursion space.",
        notes: "If `nums[i]` is bounded by a small constant (say, <= 10^5), counting sort gives **O(n + V)** where `V` is the value range — beats comparison sort for large `n`.",
        optimal: "**O(n log n)** is optimal in the comparison-sort model. With counting sort (when values are bounded), **O(n + V)** is achievable."
      },
      constraints: [
        "n == nums.length",
        "2 <= n <= 10^5",
        "n is even",
        "1 <= nums[i] <= 10^5"
      ],
      hints: [
        "**Sort the array.** Once sorted, pair the smallest with the largest, second-smallest with second-largest, and so on.",
        "**Exchange argument.** Suppose the optimal pairing doesn't pair `min` with `max`. Show via swap that pairing them is no worse — both new pair sums are bounded by the max of the originals.",
        "**Compute the max across ALL pairs**, not just the first. With non-uniform input, the max can land on any pair.",
        "**Two-pointer.** `lo = 0, hi = n - 1`. While `lo < hi`, update `best = max(best, nums[lo] + nums[hi])`, then move both pointers inward.",
        "**Complexity.** `O(n log n)` sort + `O(n)` scan. Counting sort to `O(n + V)` if values are small.",
        "**Edge case: n = 2.** Single pair, return the sum directly. No sort needed if you special-case."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def minPairSum(self, nums: List[int]) -> int:\n        arr = sorted(nums)\n        n = len(arr)\n        best = 0\n        for i in range(n // 2):\n            s = arr[i] + arr[n - 1 - i]\n            if s > best:\n                best = s\n        return best\n",
        javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar minPairSum = function(nums) {\n    const arr = nums.slice().sort((a, b) => a - b);\n    const n = arr.length;\n    let best = 0;\n    for (let i = 0; i < n / 2; i++) {\n        const s = arr[i] + arr[n - 1 - i];\n        if (s > best) best = s;\n    }\n    return best;\n};\n",
        java: "import java.util.Arrays;\n\nclass Solution {\n    public int minPairSum(int[] nums) {\n        int[] arr = nums.clone();\n        Arrays.sort(arr);\n        int n = arr.length;\n        int best = 0;\n        for (int i = 0; i < n / 2; i++) {\n            int s = arr[i] + arr[n - 1 - i];\n            if (s > best) best = s;\n        }\n        return best;\n    }\n}\n",
        cpp: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minPairSum(vector<int>& nums) {\n        vector<int> arr = nums;\n        sort(arr.begin(), arr.end());\n        int n = (int)arr.size();\n        int best = 0;\n        for (int i = 0; i < n / 2; i++) {\n            int s = arr[i] + arr[n - 1 - i];\n            if (s > best) best = s;\n        }\n        return best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: maximum-population-year (LC 1854)
//   maximumPopulation(logs: int[][]) -> int
//   logs[i] = [birth, death). Find the year in [1950, 2050] with max alive population.
//   Tie-break: smallest year wins.
//   Canonical: difference array over year offsets, prefix sum, argmax.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F375B);

  function ref(logs) {
    // Year range per LC: 1950..2050 inclusive.
    const diff = new Array(101 + 1).fill(0); // index 0 = year 1950, index 100 = year 2050
    for (const [b, d] of logs) {
      diff[b - 1950] += 1;
      diff[d - 1950] -= 1;
    }
    let running = 0;
    let bestYear = 1950;
    let bestPop = 0;
    for (let i = 0; i <= 100; i++) {
      running += diff[i];
      if (running > bestPop) {
        bestPop = running;
        bestYear = 1950 + i;
      }
    }
    return bestYear;
  }

  const cases = [];

  // LC sample 1: [[1993,1999],[2000,2010]] -> 1993
  cases.push([[[1993, 1999], [2000, 2010]]]);
  // LC sample 2: [[1950,1961],[1960,1971],[1970,1981]] -> 1960
  cases.push([[[1950, 1961], [1960, 1971], [1970, 1981]]]);

  // Single log: pick birth year.
  cases.push([[[1950, 1951]]]);
  cases.push([[[2049, 2050]]]);
  cases.push([[[2000, 2050]]]);
  cases.push([[[1950, 2050]]]);

  // Two logs no overlap.
  cases.push([[[1950, 1960], [1970, 1980]]]); // pop=1 at 1950 (and tie-break smallest -> 1950)

  // Two logs overlapping.
  cases.push([[[1950, 1970], [1960, 1980]]]); // overlap 1960..1969 pop=2; answer 1960

  // All same birth.
  cases.push([[[2000, 2010], [2000, 2020], [2000, 2030]]]); // pop=3 starting 2000 -> 2000

  // Stacked starts at same year.
  cases.push([[[1990, 1991], [1990, 1992], [1990, 1993], [1990, 1994]]]); // pop=4 in 1990

  // Births at 1950 and deaths at 2050.
  cases.push([[[1950, 2050], [1950, 2050], [1950, 2050]]]); // pop=3 1950..2049 -> 1950

  // Single-year lifespans only.
  cases.push([[[2000, 2001], [2001, 2002], [2002, 2003]]]); // each year pop=1, tie -> 2000

  // Tie-break: prefer smallest year.
  cases.push([[[1990, 2000], [2010, 2020]]]); // pop=1 in 1990 and 2010 -> tie -> 1990

  // Decreasing population after peak.
  cases.push([[[1950, 2000], [1960, 1980], [1970, 1975]]]); // overlap 1970..1974 pop=3 -> 1970

  // Births spread across decades.
  cases.push([[[1955, 1965], [1960, 1970], [1965, 1975], [1970, 1980], [1975, 1985]]]); // peaks of 2 starting at multiple points -> earliest

  // Many short lifespans.
  cases.push([[[2000, 2001], [2000, 2001], [2000, 2001], [2001, 2002], [2001, 2002]]]); // pop=3 at 2000, pop=2 at 2001 -> 2000

  // Edge: birth=death-1 (minimum lifespan).
  cases.push([[[1950, 1951], [1950, 1951], [1950, 1951]]]);

  // Cluster around the middle of the range.
  cases.push([[[1990, 2010], [1995, 2005], [2000, 2002]]]); // overlap 2000..2001 pop=3 -> 2000

  // Stress: many overlapping centered.
  cases.push([[[1980, 2020], [1985, 2015], [1990, 2010], [1995, 2005], [2000, 2001]]]); // pop=5 at 2000 -> 2000

  // Births at 2049 (max possible birth).
  cases.push([[[2049, 2050]]]);

  // Births at very different ends.
  cases.push([[[1950, 1951], [2049, 2050]]]); // each pop=1 -> 1950

  // Many distinct birth years.
  cases.push([[[1950, 1960], [1955, 1965], [1960, 1970], [1965, 1975]]]);

  // Edge: all the same single-year lifespan starting at 1950.
  cases.push([[[1950, 1951], [1950, 1951], [1950, 1951], [1950, 1951]]]); // pop=4 at 1950

  // Two overlapping spans that share one common year.
  cases.push([[[1950, 2000], [2000, 2050]]]); // 2000 not counted for first; pop=1 in [1950,1999] and [2000,2049] -> tie -> 1950

  // Random LCG-generated cases.
  while (cases.length < 36) {
    const k = 1 + (lcg() % 15); // 1..15 logs
    const arr = [];
    for (let i = 0; i < k; i++) {
      const b = 1950 + (lcg() % 100); // 1950..2049
      const maxD = 2050;
      const d = b + 1 + (lcg() % Math.max(1, maxD - b)); // b+1..2050
      arr.push([b, Math.min(d, 2050)]);
    }
    cases.push([arr]);
  }

  const test_cases = cases.map(([logs]) => ({
    inputs: [JSON.stringify(logs)],
    expected: JSON.stringify(ref(logs))
  }));

  return {
    slug: "maximum-population-year",
    obj: {
      description: "You are given a 2D integer array `logs` where each `logs[i] = [birth_i, death_i]` indicates the birth and death years of the i-th person.\n\nThe **population** of some year `x` is the number of people alive during that year. A person is counted in year `x`'s population if `x` is in the **inclusive** range `[birth_i, death_i - 1]`. Note that the person is **not** counted in the year that they die.\n\nReturn the **earliest** year with the **maximum population**.\n\n**Example 1**\n\n```\nInput:  logs = [[1993,1999],[2000,2010]]\nOutput: 1993\nExplanation: Population by year:\n  1993..1998 -> 1 (first person alive)\n  1999       -> 0 (first person dies, second not yet born)\n  2000..2009 -> 1\nMax population = 1; earliest year = 1993.\n```\n\n**Example 2**\n\n```\nInput:  logs = [[1950,1961],[1960,1971],[1970,1981]]\nOutput: 1960\nExplanation: 1960 has population 2 (persons 1 and 2 overlap).\n```\n\nThis is **LeetCode 1854**. The canonical approach is a **difference array** over the fixed year range `[1950, 2050]`: increment at birth, decrement at death; prefix-sum gives per-year population; track the maximum and the earliest year achieving it.",
      method_name: "maximumPopulation",
      params: [
        { name: "logs", type: "int[][]" }
      ],
      return_type: "int",
      tags: ["array", "prefix-sum", "difference-array", "counting"],
      pattern: "**Difference array over the 101 years from 1950 to 2050. For each log, +1 at birth and -1 at death. Sweep left-to-right with a running sum; the year with the largest running sum (smallest year on tie) is the answer.**\n\n**Why a difference array.** Each log `[b, d]` says 'this person contributes +1 to the population of every year in `[b, d-1]`'. Naively iterating each year in the range is `O(N * (d - b))` total. The difference-array trick collapses each interval contribution to two operations: `diff[b] += 1`, `diff[d] -= 1`. After processing all logs, the prefix sum `prefix[i] = sum(diff[0..i])` gives the population at year `1950 + i`. Total work: `O(N)` to build the diff, `O(Y)` to sweep, where `Y = 101`.\n\n**Year-range trick.** The problem fixes years in `[1950, 2050]`. Allocate `diff` of length `Y + 1 = 102` (one extra for safe decrement at year 2050). Index `i` represents year `1950 + i`. So:\n\n```\nfor [b, d] in logs:\n    diff[b - 1950] += 1\n    diff[d - 1950] -= 1\n```\n\nNote: `d` can be as large as 2050, so `d - 1950 = 100`. The decrement at index 100 is fine; it offsets the previous +1 entries that contributed up to year 2049. The diff array doesn't need a 'past 2050' slot because we only sweep indices 0..100.\n\n**Sweep + argmax.**\n\n```\nrunning = 0\nbest_year = 1950\nbest_pop = 0\nfor i in 0..100:\n    running += diff[i]\n    if running > best_pop:\n        best_pop = running\n        best_year = 1950 + i\nreturn best_year\n```\n\n**Strict `>` for tie-break.** The problem asks for the *earliest* year with the maximum population. Since we sweep left-to-right (earliest first), `>` (strictly greater) ensures we only update when a NEW higher population is found. Equal populations later in the sweep don't overwrite the earliest year. Using `>=` would give the LATEST year with the max — wrong.\n\n**Worked example.** `logs = [[1950, 1961], [1960, 1971], [1970, 1981]]`.\n\nDiff (offset, length 102):\n- log [1950, 1961]: diff[0] += 1, diff[11] -= 1.\n- log [1960, 1971]: diff[10] += 1, diff[21] -= 1.\n- log [1970, 1981]: diff[20] += 1, diff[31] -= 1.\n\nSo diff[0]=1, diff[10]=1, diff[11]=-1, diff[20]=1, diff[21]=-1, diff[31]=-1, all else 0.\n\nSweep:\n- i=0 (year 1950): running=1, best=1950 with pop=1.\n- i=1..9 (years 1951..1959): running stays 1. Strict >, no update.\n- i=10 (year 1960): running=2, best=1960 with pop=2.\n- i=11 (year 1961): running=1. No update.\n- i=12..19: stays 1.\n- i=20 (year 1970): running=2. Equal to current best; no update.\n- i=21 (year 1971): running=1.\n- i=22..30: stays 1.\n- i=31 (year 1981): running=0.\n\nReturn **1960** — the earliest year with population 2.\n\n**Edge cases.**\n- **Single log**: max population is 1 at year `birth`. Return `birth`.\n- **Logs all disjoint**: max population is 1; earliest year is the smallest birth year.\n- **All logs share the same birth year**: max population is `n`; return that birth year.\n- **Two logs with overlapping single year**: e.g., `[[2000, 2001], [2000, 2001]]` -> diff[50]=+2, diff[51]=-2. Pop=2 at year 2000 only. Return 2000.\n- **Logs where `d - b` is small**: each contributes to only a few years; difference array still works correctly.\n\n**Why not sort birth/death events?** That works too — pair `(year, +1)` for birth and `(year, -1)` for death, sort by year (ties: death before birth? actually doesn't matter here since people don't count in year of death). Then sweep accumulating. But with a fixed bounded year range (101 years), the difference-array approach is cleaner and faster — no sort needed.\n\n**Complexity.** `O(N + Y)` where `N` is the number of logs and `Y = 101`. Both terms are tiny; problem is easily handled.",
      follow_up: "**Variant 1 — unbounded year range.** Now coordinate compression or a sort-and-sweep is needed. Sort all 2N events; sweep with a counter.\n\n**Variant 2 — return the maximum population, not the year.** Same algorithm; return `best_pop` instead of `best_year`.\n\n**Variant 3 — return ALL years with the max population.** Sweep, collect every year where `running == best_pop`. Return the list. (Requires a second pass after determining `best_pop`.)\n\n**Variant 4 — return the LATEST year with the maximum population.** Use `>=` instead of `>` in the comparison.\n\n**Variant 5 — include the year of death.** Treat the interval as `[birth, death]` instead of `[birth, death - 1]`. Adjust the diff: `diff[death - 1950 + 1] -= 1`.\n\n**Variant 6 — k-th most populated year.** Sweep to compute all populations; sort years by population desc; return the (k-1)-th. With ties, follow some tie-break rule.\n\n**Variant 7 — population averaged over a window.** Use the diff/prefix to compute population per year, then take a sliding-window average. `O(N + Y)`.\n\n**Variant 8 — population growth rate maximum.** Track `pop[i] - pop[i-1]`; the year with max delta is the answer. Equivalently, find the year with the most births (or fewest deaths). Trivial via the diff array.\n\n**Implementation pitfalls.**\n1. **Off-by-one on death year** — the person is not counted in their death year. `diff[death] -= 1` (BEFORE the offset adjustment) is correct; `diff[death - 1] -= 1` would include the death year, which is wrong.\n2. **Diff array size too small** — needs at least `Y + 1` entries to safely decrement at the largest possible death year.\n3. **Using `>=` instead of `>`** — gives the latest year with the max, not the earliest.\n4. **Off-by-one on the offset** — `index = year - 1950`. Year 1950 -> index 0; year 2050 -> index 100. Don't accidentally use `year - 1951` or `year - 1949`.\n5. **Wrong sweep range** — sweep i = 0..100 (inclusive) to cover years 1950..2050. Stopping at 99 misses year 2049 (or 2050).\n6. **Modifying input logs** — generally safe here, but don't write back to `logs[i]` if the caller cares.\n7. **Overflow on running sum** — N can be up to 100 in LC bounds; population fits trivially in int32.",
      complexity: {
        time: "**O(N + Y)** where N = number of logs and Y = 101 (the fixed year range). Both terms are small; total work is constant-bounded.",
        space: "**O(Y)** for the difference array (size 102). **O(1)** auxiliary if we count only running, best_year, best_pop.",
        notes: "If the year range were unbounded, we'd need event-sort: collect 2N events `(year, +-1)`, sort, sweep. That's `O(N log N)` time and `O(N)` space. For this problem the bounded range makes the diff-array form strictly faster.",
        optimal: "**O(N + Y)** is optimal for the bounded-range version. **O(N log N)** is optimal for the unbounded variant via event-sort."
      },
      constraints: [
        "1 <= logs.length <= 100",
        "1950 <= birth_i < death_i <= 2050"
      ],
      hints: [
        "**Difference array over year offsets.** Allocate an array of size 101 (or 102 for safety) representing years 1950..2050.",
        "**For each log [b, d]**: increment `diff[b - 1950]` by 1 and decrement `diff[d - 1950]` by 1. The decrement at year `d` correctly excludes the death year from the population.",
        "**Sweep left to right** with a running sum. The running sum at index `i` is the population at year `1950 + i`.",
        "**Track the earliest year with the maximum.** Use a STRICT `>` comparison so ties keep the earliest year, not the latest.",
        "**Why not sort events?** Works, but with a fixed 101-year range, the difference array is cleaner and `O(N + Y)` without sorting.",
        "**Off-by-one warning.** The problem says a person is alive in `[birth, death - 1]`, NOT including the death year. The diff entry `diff[d - 1950] -= 1` correctly handles this."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def maximumPopulation(self, logs: List[List[int]]) -> int:\n        diff = [0] * 102\n        for b, d in logs:\n            diff[b - 1950] += 1\n            diff[d - 1950] -= 1\n        running = 0\n        best_year = 1950\n        best_pop = 0\n        for i in range(101):\n            running += diff[i]\n            if running > best_pop:\n                best_pop = running\n                best_year = 1950 + i\n        return best_year\n",
        javascript: "/**\n * @param {number[][]} logs\n * @return {number}\n */\nvar maximumPopulation = function(logs) {\n    const diff = new Array(102).fill(0);\n    for (const [b, d] of logs) {\n        diff[b - 1950] += 1;\n        diff[d - 1950] -= 1;\n    }\n    let running = 0;\n    let bestYear = 1950;\n    let bestPop = 0;\n    for (let i = 0; i <= 100; i++) {\n        running += diff[i];\n        if (running > bestPop) {\n            bestPop = running;\n            bestYear = 1950 + i;\n        }\n    }\n    return bestYear;\n};\n",
        java: "class Solution {\n    public int maximumPopulation(int[][] logs) {\n        int[] diff = new int[102];\n        for (int[] log : logs) {\n            diff[log[0] - 1950] += 1;\n            diff[log[1] - 1950] -= 1;\n        }\n        int running = 0;\n        int bestYear = 1950;\n        int bestPop = 0;\n        for (int i = 0; i <= 100; i++) {\n            running += diff[i];\n            if (running > bestPop) {\n                bestPop = running;\n                bestYear = 1950 + i;\n            }\n        }\n        return bestYear;\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maximumPopulation(vector<vector<int>>& logs) {\n        vector<int> diff(102, 0);\n        for (const auto& log : logs) {\n            diff[log[0] - 1950] += 1;\n            diff[log[1] - 1950] -= 1;\n        }\n        int running = 0;\n        int bestYear = 1950;\n        int bestPop = 0;\n        for (int i = 0; i <= 100; i++) {\n            running += diff[i];\n            if (running > bestPop) {\n                bestPop = running;\n                bestYear = 1950 + i;\n            }\n        }\n        return bestYear;\n    }\n};\n"
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
    "// ===== WAVE 35V START =====",
    "// === WAVE 35V " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35V " + p1.slug + " END ===",
    "// === WAVE 35V " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35V " + p2.slug + " END ===",
    "// ===== WAVE 35V END =====",
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
if (src.indexOf("WAVE 35V START") !== -1) {
  console.error("WAVE 35V already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35U END marker and append block after it.
const ANCHOR = "// ===== WAVE 35U END =====";
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

console.log("DONE wave35v " + p1.slug + " + " + p2.slug);
