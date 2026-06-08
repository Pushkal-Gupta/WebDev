#!/usr/bin/env node
// Build WAVE 35G: get-equal-substrings-within-budget + max-consecutive-ones-ii
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
// PROBLEM 1: get-equal-substrings-within-budget (LC 1208)
//   equalSubstring(s: str, t: str, maxCost: int) -> int
//   For each index i, cost[i] = |s[i] - t[i]|.
//   Find the maximum-length contiguous window whose cost sum is <= maxCost.
//   Classic sliding-window: expand right, shrink left while sum > maxCost.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F366A);

  function ref(s, t, maxCost) {
    const n = s.length;
    let left = 0;
    let cur = 0;
    let best = 0;
    for (let right = 0; right < n; right++) {
      cur += Math.abs(s.charCodeAt(right) - t.charCodeAt(right));
      while (cur > maxCost) {
        cur -= Math.abs(s.charCodeAt(left) - t.charCodeAt(left));
        left++;
      }
      if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
  }

  const cases = [];
  // LC sample 1: s = "abcd", t = "bcdf", maxCost = 3 -> 3
  cases.push(["abcd", "bcdf", 3]);
  // LC sample 2: s = "abcd", t = "cdef", maxCost = 3 -> 1
  cases.push(["abcd", "cdef", 3]);
  // LC sample 3: s = "abcd", t = "acde", maxCost = 0 -> 1
  cases.push(["abcd", "acde", 0]);
  // Identical strings -> whole string fits any budget >= 0
  cases.push(["aaaa", "aaaa", 0]);
  // Identical strings, length 1
  cases.push(["a", "a", 0]);
  // Single character, different
  cases.push(["a", "b", 0]);
  cases.push(["a", "b", 1]);
  cases.push(["a", "z", 25]);
  cases.push(["a", "z", 24]);
  // Maximum possible cost per pair (a vs z)
  cases.push(["az", "za", 25]);
  cases.push(["az", "za", 49]);
  cases.push(["az", "za", 50]);
  // Long identical
  cases.push(["abcdefghij", "abcdefghij", 5]);
  // Long with one expensive index in the middle
  cases.push(["aaaaaaaaaa", "aaaaaazaaa", 0]);
  cases.push(["aaaaaaaaaa", "aaaaaazaaa", 25]);
  cases.push(["aaaaaaaaaa", "aaaaaazaaa", 24]);
  // Two expensive indices at boundaries
  cases.push(["zaaaaaaaaz", "aaaaaaaaaa", 25]);
  cases.push(["zaaaaaaaaz", "aaaaaaaaaa", 50]);
  // Increasing cost pattern
  cases.push(["abcdef", "bdfhjl", 6]);
  cases.push(["abcdef", "bdfhjl", 15]);
  // Decreasing budget tightens the window
  cases.push(["abcdef", "bdfhjl", 1]);
  // Adversarial: alternating cheap-expensive
  cases.push(["azazaz", "aaaaaa", 25]);
  cases.push(["azazaz", "aaaaaa", 50]);
  cases.push(["azazaz", "aaaaaa", 75]);
  // Mixed alphabet
  cases.push(["krrgw", "zjxss", 19]);
  // Empty-cost run inside a costly string
  cases.push(["abcde", "abxde", 0]);
  cases.push(["abcde", "abxde", 21]);

  // Random LCG strings to push the count past 30.
  function randStr(n) {
    let out = "";
    for (let i = 0; i < n; i++) {
      out += String.fromCharCode(97 + (lcg() % 26));
    }
    return out;
  }
  while (cases.length < 35) {
    const n = 2 + (lcg() % 14);
    const a = randStr(n);
    const b = randStr(n);
    const budget = lcg() % 80;
    cases.push([a, b, budget]);
  }

  const test_cases = cases.map(([s, t, c]) => ({
    inputs: [JSON.stringify(s), JSON.stringify(t), String(c)],
    expected: String(ref(s, t, c))
  }));

  return {
    slug: "get-equal-substrings-within-budget",
    obj: {
      description: "You are given two strings `s` and `t` of the same length and an integer `maxCost`.\n\nYou want to change `s` to `t`. Changing the `i`-th character of `s` to the `i`-th character of `t` costs `|s[i] - t[i]|` (i.e., the absolute difference between the ASCII values of the characters).\n\nReturn the maximum length of a substring of `s` that can be changed to be the same as the corresponding substring of `t` with a cost less than or equal to `maxCost`. If there is no substring from `s` that can be changed to its corresponding substring from `t`, return `0`.\n\n**Example 1**\n\n```\nInput:  s = \"abcd\", t = \"bcdf\", maxCost = 3\nOutput: 3\nExplanation: \"abc\" of s can change to \"bcd\". That costs 3, so the maximum length is 3.\n```\n\n**Example 2**\n\n```\nInput:  s = \"abcd\", t = \"cdef\", maxCost = 3\nOutput: 1\nExplanation: Each character in s costs 2 to change to its match in t, so the maximum length is 1.\n```\n\n**Example 3**\n\n```\nInput:  s = \"abcd\", t = \"acde\", maxCost = 0\nOutput: 1\nExplanation: You cannot make any change, so the maximum length is 1.\n```\n\nThis is **LeetCode 1208**. The canonical solution is a **sliding window** over the cost array `c[i] = |s[i] - t[i]|`: expand the right pointer, shrink the left pointer while the window sum exceeds `maxCost`, and track the longest valid window.",
      method_name: "equalSubstring",
      params: [
        { name: "s", type: "str" },
        { name: "t", type: "str" },
        { name: "maxCost", type: "int" }
      ],
      return_type: "int",
      tags: ["string", "sliding-window", "two-pointers", "prefix-sum"],
      pattern: "**Sliding window over the per-index cost array — O(n) time, O(1) extra space.**\n\n**Reduction.** Define the per-index cost array `c[i] = |s[i] - t[i]|`. The question becomes: \"What is the longest contiguous subarray of `c` whose sum is `<= maxCost`?\" This is a textbook sliding-window problem because `c[i] >= 0` for every `i` — the window sum is monotone in window size for fixed left endpoint, so once the sum exceeds the budget, shrinking from the left is the only way to recover.\n\n**Algorithm.**\n\n```\nleft = 0\ncur  = 0      # current window-sum of c\nbest = 0\nfor right in [0..n-1]:\n    cur += |s[right] - t[right]|\n    while cur > maxCost:\n        cur -= |s[left] - t[left]|\n        left += 1\n    best = max(best, right - left + 1)\nreturn best\n```\n\nEach index is added to `cur` exactly once and removed at most once, so the loop is amortized `O(n)`.\n\n**Worked example.** `s = \"abcd\", t = \"bcdf\", maxCost = 3`. Costs: `c = [1, 1, 1, 2]`.\n\n```\nright = 0: cur = 1, window [0..0], len = 1, best = 1.\nright = 1: cur = 2, window [0..1], len = 2, best = 2.\nright = 2: cur = 3, window [0..2], len = 3, best = 3.\nright = 3: cur = 5 > 3.\n    Shrink: cur -= c[0] = 1 -> cur = 4. left = 1. Still > 3.\n    Shrink: cur -= c[1] = 1 -> cur = 3. left = 2.\n  Window [2..3], len = 2, best stays 3.\nReturn 3.\n```\n\n**Why a brute-force search is `O(n^2)`.** Trying every `(left, right)` pair and recomputing the sum is `n * n` work — fine for `n <= 200`, fatal for `n = 10^5`. The sliding window exploits the non-negativity of `c[i]` to keep total work linear.\n\n**Prefix-sum alternative.** Build `P[i] = c[0] + c[1] + ... + c[i-1]`. For each right index `r`, binary-search the smallest `l` with `P[r+1] - P[l] <= maxCost`, then `best = max(best, r+1 - l)`. This is `O(n log n)`. The sliding window beats it because it does not require sorting or random access — just two pointers.\n\n**Edge cases.** `maxCost = 0` -> the answer is the longest run of indices where `s[i] == t[i]`. Strings identical -> the whole string fits any budget. Single character -> the answer is `0` or `1` depending on whether `|s[0] - t[0]| <= maxCost`.\n\n**Why this is `O(n)`.** `left` and `right` are both monotonically non-decreasing across the loop. Each step advances exactly one of them. Total work across all iterations is at most `2n`.",
      follow_up: "**Variant 1 — return the actual substring (not just the length).** Track the `left` index that produced `best`; slice `s[left .. left + best - 1]`.\n\n**Variant 2 — minimum-length substring with cost AT LEAST `k`.** Symmetric sliding window — expand until cost `>= k`, shrink while still `>= k`, record `best = min(best, len)`.\n\n**Variant 3 — costs need not be `|s[i] - t[i]|`; they can be ANY non-negative array.** The same sliding window works because non-negativity is the only invariant used. For costs that can be negative, the sliding window fails and you need prefix-sum + balanced BST or monotone deque (Maximum Sum of K Consecutive Elements style).\n\n**Variant 4 — at most `K` cost-violating positions allowed.** Track a count of positions with `c[i] > 0` inside the window; shrink while count > K. Becomes LC 1004-style.\n\n**Variant 5 — modify any subset of indices (not contiguous).** Sort `c` ascending, take the longest prefix whose sum `<= maxCost`. The answer counts indices, not positions.\n\n**Variant 6 — circular `s` and `t`.** Concatenate `s + s` and run the sliding window on the doubled cost array; cap window length at `n` to avoid double-counting.\n\n**Implementation pitfalls.**\n1. **Off-by-one in the while condition.** Shrink while `cur > maxCost`, not `>=`. Equal cost is allowed.\n2. **Off-by-one in window length.** `right - left + 1` for inclusive bounds.\n3. **Using `s.charAt(right) - t.charAt(right)` without `Math.abs`.** Negative numbers break the budget check.\n4. **Allocating an explicit cost array.** Works but wastes O(n) space; absolute differences can be computed on the fly.\n5. **Reading `s.length` inside the loop in tight code.** Cache `n = s.length` for predictable performance in JS / Java.\n6. **Confusing `maxCost` with `maxLength`.** The budget is the SUM of cost values, not the number of changes."
,
      complexity: {
        time: "**O(n)** — the right pointer advances exactly `n` times and the left pointer advances at most `n` times, amortized over the loop.",
        space: "**O(1)** auxiliary — only the running sum `cur`, the indices `left` / `right`, and the best length. No cost array materialized.",
        notes: "Prefix-sum + binary search is `O(n log n)`. Materializing a cost array changes the space to `O(n)` but does not improve time. The sliding window is the canonical fit because `c[i] >= 0`.",
        optimal: "**O(n) time and O(1) space** is optimal — every index must be inspected at least once to decide whether the answer covers it."
      },
      constraints: [
        "1 <= s.length <= 10^5",
        "t.length == s.length",
        "0 <= maxCost <= 10^6",
        "s and t consist of only lowercase English letters."
      ],
      hints: [
        "**Reduce to the longest subarray with sum `<= maxCost`** by computing `c[i] = |s[i] - t[i]|`.",
        "**The cost array is non-negative.** Non-negative sliding-window applies — expand right, shrink left.",
        "**Maintain `cur` as the running window sum.** Update in `O(1)` per step.",
        "**Shrink while `cur > maxCost`, not while `>=`.** Equal-to-budget is a valid window.",
        "**Track `best = max(best, right - left + 1)`** after the shrink loop.",
        "**You do not need an explicit cost array.** Compute `|s[i] - t[i]|` on the fly to save memory."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def equalSubstring(self, s: str, t: str, maxCost: int) -> int:\n        n = len(s)\n        left = 0\n        cur = 0\n        best = 0\n        for right in range(n):\n            cur += abs(ord(s[right]) - ord(t[right]))\n            while cur > maxCost:\n                cur -= abs(ord(s[left]) - ord(t[left]))\n                left += 1\n            if right - left + 1 > best:\n                best = right - left + 1\n        return best\n",
        javascript: "/**\n * @param {string} s\n * @param {string} t\n * @param {number} maxCost\n * @return {number}\n */\nvar equalSubstring = function(s, t, maxCost) {\n    const n = s.length;\n    let left = 0;\n    let cur = 0;\n    let best = 0;\n    for (let right = 0; right < n; right++) {\n        cur += Math.abs(s.charCodeAt(right) - t.charCodeAt(right));\n        while (cur > maxCost) {\n            cur -= Math.abs(s.charCodeAt(left) - t.charCodeAt(left));\n            left++;\n        }\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n};\n",
        java: "public class Solution {\n    public int equalSubstring(String s, String t, int maxCost) {\n        int n = s.length();\n        int left = 0;\n        int cur = 0;\n        int best = 0;\n        for (int right = 0; right < n; right++) {\n            cur += Math.abs(s.charAt(right) - t.charAt(right));\n            while (cur > maxCost) {\n                cur -= Math.abs(s.charAt(left) - t.charAt(left));\n                left++;\n            }\n            if (right - left + 1 > best) best = right - left + 1;\n        }\n        return best;\n    }\n}\n",
        cpp: "#include <string>\n#include <cstdlib>\nusing namespace std;\n\nclass Solution {\npublic:\n    int equalSubstring(string s, string t, int maxCost) {\n        int n = (int)s.size();\n        int left = 0;\n        int cur = 0;\n        int best = 0;\n        for (int right = 0; right < n; right++) {\n            cur += abs((int)s[right] - (int)t[right]);\n            while (cur > maxCost) {\n                cur -= abs((int)s[left] - (int)t[left]);\n                left++;\n            }\n            if (right - left + 1 > best) best = right - left + 1;\n        }\n        return best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: max-consecutive-ones-ii (LC 487)
//   findMaxConsecutiveOnes(nums: int[]) -> int
//   Given a binary array, return the maximum number of consecutive 1s if you
//   can FLIP AT MOST ONE 0. Classic sliding window with a single "zero quota".
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F366B);

  function ref(nums) {
    const n = nums.length;
    let left = 0;
    let zeros = 0;
    let best = 0;
    for (let right = 0; right < n; right++) {
      if (nums[right] === 0) zeros++;
      while (zeros > 1) {
        if (nums[left] === 0) zeros--;
        left++;
      }
      if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
  }

  const cases = [];
  // LC sample 1: [1,0,1,1,0] -> 4 (flip the middle 0)
  cases.push([1, 0, 1, 1, 0]);
  // LC sample 2: [1,0,1,1,0,1] -> 4
  cases.push([1, 0, 1, 1, 0, 1]);
  // All ones -> length
  cases.push([1, 1, 1, 1, 1]);
  // Single 1
  cases.push([1]);
  // Single 0 -> 1 (flip it)
  cases.push([0]);
  // Single 0 array with one element
  cases.push([0, 0]);  // flip one -> 1 + 0 contiguous? After flipping one, [1,0] -> max run = 1; [0,1] -> max run = 1. Answer = 1.
  // Two zeros separated by long 1s
  cases.push([1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1]);
  // Two adjacent zeros
  cases.push([0, 0]);
  // Three zeros separated by single 1s
  cases.push([0, 1, 0, 1, 0]);
  // Mostly ones with one zero
  cases.push([1, 1, 1, 1, 0, 1, 1, 1, 1]);
  // Mostly zeros with one one
  cases.push([0, 0, 0, 1, 0, 0, 0]);
  // Long all-ones block
  cases.push([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  // Long all-zeros block -> answer is 1 (flip any single zero)
  cases.push([0, 0, 0, 0, 0]);
  // Leading zero
  cases.push([0, 1, 1, 1, 1]);
  // Trailing zero
  cases.push([1, 1, 1, 1, 0]);
  // Leading and trailing zeros
  cases.push([0, 1, 1, 1, 0]);
  // Alternating
  cases.push([1, 0, 1, 0, 1, 0, 1, 0]);
  cases.push([0, 1, 0, 1, 0, 1, 0, 1]);
  // Two-zero gap
  cases.push([1, 1, 0, 0, 1, 1]);
  // Three-zero gap
  cases.push([1, 1, 0, 0, 0, 1, 1]);
  // Length 2 cases
  cases.push([1, 0]);
  cases.push([0, 1]);
  cases.push([1, 1]);
  // Length 3 cases
  cases.push([1, 0, 1]);
  cases.push([0, 1, 0]);
  cases.push([1, 1, 0]);
  cases.push([0, 1, 1]);
  // Long pattern with isolated zeros
  cases.push([1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1]);

  // Random LCG cases.
  while (cases.length < 35) {
    const n = 1 + (lcg() % 16);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(lcg() % 2);
    }
    cases.push(arr);
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: String(ref(arr))
  }));

  return {
    slug: "max-consecutive-ones-ii",
    obj: {
      description: "Given a binary array `nums`, return the maximum number of consecutive `1`'s in the array if you can flip at most one `0`.\n\n**Example 1**\n\n```\nInput:  nums = [1,0,1,1,0]\nOutput: 4\nExplanation:\n- If we flip the first zero, we will get the maximum number of consecutive 1's. After flipping, the maximum number of consecutive 1's is 4.\n```\n\n**Example 2**\n\n```\nInput:  nums = [1,0,1,1,0,1]\nOutput: 4\n```\n\nThis is **LeetCode 487**. The canonical solution is a **sliding window with at most one zero** inside: expand the right pointer, shrink the left while the window holds more than one zero, track the longest valid window length.\n\n**Follow-up.** What if the input is an infinite stream — you cannot store all numbers? Maintain only the lengths of the last two consecutive-`1` runs and the gap between them; update in `O(1)` per element.",
      method_name: "findMaxConsecutiveOnes",
      params: [
        { name: "nums", type: "int[]" }
      ],
      return_type: "int",
      tags: ["array", "sliding-window", "two-pointers", "dp"],
      pattern: "**Sliding window with a single \"zero quota\" — O(n) time, O(1) extra space.**\n\n**Reduction.** Allowing one flip is equivalent to asking: \"What is the longest contiguous subarray that contains at most one `0`?\" Every `0` inside the window represents a position we plan to flip; we are allowed at most one such flip.\n\n**Algorithm.**\n\n```\nleft  = 0\nzeros = 0     # number of 0s currently inside [left..right]\nbest  = 0\nfor right in [0..n-1]:\n    if nums[right] == 0:\n        zeros += 1\n    while zeros > 1:\n        if nums[left] == 0:\n            zeros -= 1\n        left += 1\n    best = max(best, right - left + 1)\nreturn best\n```\n\nThe window invariant is `zeros <= 1`. When `right` brings in a second zero, we shrink from `left` until the window holds at most one zero again. `best` is the length of the longest such window seen so far.\n\n**Worked example.** `nums = [1, 0, 1, 1, 0]`.\n\n```\nright = 0: nums[0] = 1. zeros = 0. window = [0..0], len = 1, best = 1.\nright = 1: nums[1] = 0. zeros = 1. window = [0..1], len = 2, best = 2.\nright = 2: nums[2] = 1. zeros = 1. window = [0..2], len = 3, best = 3.\nright = 3: nums[3] = 1. zeros = 1. window = [0..3], len = 4, best = 4.\nright = 4: nums[4] = 0. zeros = 2 -> shrink.\n    nums[left=0] = 1; left = 1; zeros still 2.\n    nums[left=1] = 0; zeros = 1; left = 2.\n  window = [2..4], len = 3, best stays 4.\nReturn 4.\n```\n\n**Alternative — DP / `(prev, cur)` lengths.** Walk left-to-right keeping `cur` = current run of 1s and `prev` = the previous run of 1s ending at the most recent zero. At every step, `best = max(best, prev + 1 + cur)`. Reset `prev = cur`, `cur = 0` when a zero appears. Same `O(n)` time, also `O(1)` space, and especially clean for the streaming follow-up.\n\n**Streaming follow-up.** Track three values: `prev` (length of the run of 1s before the last 0), `cur` (length of the current run of 1s), and a boolean `sawZero` (did we ever see a zero?). On each new element:\n\n```\nif x == 1: cur += 1\nelse:      prev = cur; cur = 0; sawZero = True\nbest = max(best, prev + (1 if sawZero else 0) + cur)\n```\n\nMemory is constant — perfect for streams.\n\n**Brute-force comparison.** Trying every left/right pair is `O(n^2)`. Trying every flip position and computing the resulting run length is `O(n^2)`. The sliding window is `O(n)`.\n\n**Edge cases.** All ones -> `n` (no flip needed). All zeros -> `1` (flip any single zero). Single element -> `1`. Two zeros adjacent -> shrink kicks in immediately; the answer hinges on neighbouring 1s.",
      follow_up: "**Variant 1 — flip AT MOST `K` zeros.** This is LC 1004 (Max Consecutive Ones III). Replace the `while zeros > 1` condition with `while zeros > K`. The sliding window argument is identical.\n\n**Variant 2 — return the actual subarray (after flipping).** Track the `left` index that produced `best`; slice `nums[left .. left + best - 1]` and flip its single zero to one in the returned copy.\n\n**Variant 3 — infinite stream (the official LC follow-up).** Use the streaming `(prev, cur, sawZero)` recurrence above. Memory is `O(1)`; latency per element is `O(1)`.\n\n**Variant 4 — `K` distinct values allowed instead of `K` zeros.** Becomes Longest Subarray with At Most K Distinct (sliding window with a hashmap).\n\n**Variant 5 — circular array.** Concatenate `nums + nums` and run the same sliding window, capping the answer at `n` to avoid double-counting.\n\n**Variant 6 — flip cost depends on position.** Becomes a weighted knapsack / DP. Sliding window with constant zero quota no longer applies.\n\n**Implementation pitfalls.**\n1. **Off-by-one in the shrink condition.** Use `while zeros > 1`, not `>= 1`. The window IS allowed to hold one zero.\n2. **Forgetting to update `best` after the shrink.** Update best AFTER the inner while loop exits.\n3. **Resetting `zeros` to `0` instead of decrementing.** Only decrement when `nums[left] == 0`.\n4. **All-ones input returning `n - 1`.** A common off-by-one when the implementation always subtracts 1 from the window length. The flip is OPTIONAL — for an all-ones input, you flip nothing and return `n`.\n5. **All-zeros input returning `0`.** The correct answer is `1` (flip a single zero).\n6. **Confusing this with LC 1004 (K flips).** Don't generalize prematurely — `zeros > 1` is the bound here."
,
      complexity: {
        time: "**O(n)** — the right pointer advances exactly `n` times, the left pointer advances at most `n` times overall.",
        space: "**O(1)** auxiliary — only the indices, the zero counter, and the best length.",
        notes: "The `(prev, cur, sawZero)` DP is also `O(n)` time and `O(1)` space, and is the natural fit for the streaming follow-up.",
        optimal: "**O(n) time and O(1) space** is optimal — every element must be inspected at least once."
      },
      constraints: [
        "1 <= nums.length <= 10^5",
        "nums[i] is either 0 or 1."
      ],
      hints: [
        "**Re-frame the problem.** 'Flip at most one 0' = 'longest contiguous subarray with at most one 0 inside'.",
        "**Use a sliding window with a zero counter.** Expand right; when zero count > 1, shrink left.",
        "**Update `best` after the shrink** so the window always satisfies the at-most-one-zero invariant.",
        "**Decrement `zeros` only when `nums[left] == 0`** as you advance the left pointer.",
        "**All-ones input returns `n`** — the flip is optional. All-zeros input returns `1`.",
        "**Streaming variant:** track `(prev, cur, sawZero)` and recompute `best = prev + (sawZero ? 1 : 0) + cur` each step."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\n\nclass Solution:\n    def findMaxConsecutiveOnes(self, nums: List[int]) -> int:\n        left = 0\n        zeros = 0\n        best = 0\n        for right, x in enumerate(nums):\n            if x == 0:\n                zeros += 1\n            while zeros > 1:\n                if nums[left] == 0:\n                    zeros -= 1\n                left += 1\n            if right - left + 1 > best:\n                best = right - left + 1\n        return best\n",
        javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMaxConsecutiveOnes = function(nums) {\n    let left = 0;\n    let zeros = 0;\n    let best = 0;\n    for (let right = 0; right < nums.length; right++) {\n        if (nums[right] === 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] === 0) zeros--;\n            left++;\n        }\n        if (right - left + 1 > best) best = right - left + 1;\n    }\n    return best;\n};\n",
        java: "public class Solution {\n    public int findMaxConsecutiveOnes(int[] nums) {\n        int left = 0;\n        int zeros = 0;\n        int best = 0;\n        for (int right = 0; right < nums.length; right++) {\n            if (nums[right] == 0) zeros++;\n            while (zeros > 1) {\n                if (nums[left] == 0) zeros--;\n                left++;\n            }\n            if (right - left + 1 > best) best = right - left + 1;\n        }\n        return best;\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findMaxConsecutiveOnes(vector<int>& nums) {\n        int left = 0;\n        int zeros = 0;\n        int best = 0;\n        for (int right = 0; right < (int)nums.size(); right++) {\n            if (nums[right] == 0) zeros++;\n            while (zeros > 1) {\n                if (nums[left] == 0) zeros--;\n                left++;\n            }\n            if (right - left + 1 > best) best = right - left + 1;\n        }\n        return best;\n    }\n};\n"
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
    "// ===== WAVE 35G START =====",
    "// === WAVE 35G " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35G " + p1.slug + " END ===",
    "// === WAVE 35G " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35G " + p2.slug + " END ===",
    "// ===== WAVE 35G END =====",
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
if (src.indexOf("WAVE 35G START") !== -1) {
  console.error("WAVE 35G already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35F END marker and append block after it.
const ANCHOR = "// ===== WAVE 35F END =====";
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

console.log("DONE wave35g " + p1.slug + " + " + p2.slug);
