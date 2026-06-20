#!/usr/bin/env node
// Build WAVE 35B: guess-number-higher-or-lower-ii + minimum-number-of-refueling-stops
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
// PROBLEM 1: guess-number-higher-or-lower-ii (LC 375)
//   getMoneyAmount(n: int) -> int
//   Classic interval DP: dp[i][j] = min over k in [i,j] of (k + max(dp[i][k-1], dp[k+1][j])).
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F361A);

  function ref(n) {
    if (n <= 1) return 0;
    // dp[i][j] = min money to guarantee a win on the range [i..j].
    const dp = [];
    for (let i = 0; i <= n + 1; i++) {
      const row = new Array(n + 2).fill(0);
      dp.push(row);
    }
    for (let len = 2; len <= n; len++) {
      for (let i = 1; i + len - 1 <= n; i++) {
        const j = i + len - 1;
        let best = Infinity;
        for (let k = i; k <= j; k++) {
          const left = k - 1 >= i ? dp[i][k - 1] : 0;
          const right = k + 1 <= j ? dp[k + 1][j] : 0;
          const cost = k + Math.max(left, right);
          if (cost < best) best = cost;
        }
        dp[i][j] = best;
      }
    }
    return dp[1][n];
  }

  const cases = [];
  // Canonical small values (LC examples + boundary).
  cases.push(1);
  cases.push(2);
  cases.push(3);
  cases.push(4);
  cases.push(5);
  cases.push(6);
  cases.push(7);
  cases.push(8);
  cases.push(9);
  cases.push(10);
  cases.push(11);
  cases.push(12);
  cases.push(13);
  cases.push(14);
  cases.push(15);
  cases.push(16);
  cases.push(17);
  cases.push(18);
  cases.push(19);
  cases.push(20);
  // Larger n (constraint says n <= 200; algorithm is O(n^3)).
  cases.push(25);
  cases.push(30);
  cases.push(40);
  cases.push(50);
  cases.push(60);
  cases.push(75);
  cases.push(100);

  // Random additions in [21..199] for spread.
  while (cases.length < 32) {
    const v = 21 + (lcg() % 179);
    if (!cases.includes(v)) cases.push(v);
  }

  const test_cases = cases.map((n) => ({
    inputs: [String(n)],
    expected: String(ref(n))
  }));

  return {
    slug: "guess-number-higher-or-lower-ii",
    obj: {
      description: "We are playing the **Guess Game**. The game is as follows:\n\n- I pick a number from `1` to `n`. You have to guess which number I picked.\n- Every time you guess wrong, I will tell you whether the number I picked is **higher or lower**.\n- However, when you guess a particular number `x`, and you guess wrong, you **pay $x**. You win the game when you guess the number I picked.\n\nGiven a particular `n`, return the **minimum amount of money you need to guarantee a win regardless of what number I pick**.\n\n**Example 1**\n\n```\nInput:  n = 10\nOutput: 16\nExplanation: One optimal strategy guarantees a win for at most $16.\n```\n\n**Example 2**\n\n```\nInput:  n = 1\nOutput: 0\nExplanation: Only one number to guess.\n```\n\n**Example 3**\n\n```\nInput:  n = 2\nOutput: 1\nExplanation: Guess 1; if wrong (you paid $1), the answer must be 2.\n```\n\nThis is **LeetCode 375**. The canonical solution is an **interval DP**: `dp[i][j]` = the minimum guaranteed cost on the range `[i..j]`. For each choice of guess `k` in `[i..j]`, the adversary forces the worst sub-range, so the recurrence is\n\n```\ndp[i][j] = min over k in [i..j] of (k + max(dp[i][k-1], dp[k+1][j]))\n```\n\nwith `dp[i][j] = 0` whenever `i >= j`.",
      method_name: "getMoneyAmount",
      params: [
        { name: "n", type: "int" }
      ],
      return_type: "int",
      tags: ["dynamic-programming", "math", "minimax", "interval-dp", "game-theory"],
      pattern: "**This is interval DP with a minimax twist — you minimize, the adversary maximizes.**\n\n**Step 1 — define the state.** Let `dp[i][j]` be the **minimum cost you must pay to guarantee a win** when the unknown number lies in the closed range `[i..j]`. Base case: `dp[i][i] = 0` (you already know the answer), and we also set `dp[i][j] = 0` whenever `i > j` (empty range — nothing to pay).\n\n**Step 2 — analyze one guess.** Suppose you stand on range `[i..j]` and you guess `k`. Three outcomes:\n1. You guessed correctly — pay 0 more, total contribution from this guess is 0.\n2. The hidden number is **lower** than `k` — you pay `k` (penalty for wrong guess) and then play on `[i..k-1]`. Cost: `k + dp[i][k-1]`.\n3. The hidden number is **higher** than `k` — you pay `k` and play on `[k+1..j]`. Cost: `k + dp[k+1][j]`.\n\nBecause the adversary chooses the worst sub-range, the cost of choosing guess `k` is\n\n```\ncost(k) = k + max(dp[i][k-1], dp[k+1][j])\n```\n\n(case 1 contributes 0, so it disappears under the `max`).\n\n**Step 3 — minimize over `k`.** You get to pick the best guess, so\n\n```\ndp[i][j] = min over k in [i..j] of (k + max(dp[i][k-1], dp[k+1][j]))\n```\n\n**Step 4 — bottom-up order.** `dp[i][j]` depends on smaller ranges (`[i..k-1]` and `[k+1..j]`), so iterate by **increasing range length**:\n\n```\nfor length in 2 .. n:\n    for i in 1 .. n - length + 1:\n        j = i + length - 1\n        dp[i][j] = min over k in [i..j] of (k + max(dp[i][k-1], dp[k+1][j]))\nreturn dp[1][n]\n```\n\n**Complexity.** `O(n^3)` time, `O(n^2)` space. With `n <= 200` the inner triple loop has roughly 8 * 10^6 ops — fast enough.\n\n**Why not binary search at the median?** Median minimizes the **expected** cost (if the number is uniform), not the **worst-case** cost. The DP is essential — the answer for `n = 10` is `16` (not the median-binary-search answer of `25`).\n\n**Worked example for n = 4.**\n\n```\nRange [1,2]: guess 1 -> 1 + max(0, dp[2,2]) = 1 + 0 = 1. Guess 2 -> 2 + max(dp[1,1], 0) = 2.\n             dp[1,2] = 1.\nRange [2,3]: guess 2 -> 2 + dp[3,3] = 2. Guess 3 -> 3 + dp[2,2] = 3.   dp[2,3] = 2.\nRange [3,4]: guess 3 -> 3 + dp[4,4] = 3. Guess 4 -> 4 + dp[3,3] = 4.   dp[3,4] = 3.\nRange [1,3]: guess 1 -> 1 + max(0, dp[2,3]) = 1 + 2 = 3.\n             guess 2 -> 2 + max(dp[1,1], dp[3,3]) = 2 + 0 = 2.\n             guess 3 -> 3 + max(dp[1,2], 0)        = 3 + 1 = 4.\n             dp[1,3] = 2.\nRange [2,4]: guess 2 -> 2 + max(0, dp[3,4]) = 2 + 3 = 5.\n             guess 3 -> 3 + max(dp[2,2], dp[4,4]) = 3 + 0 = 3.\n             guess 4 -> 4 + max(dp[2,3], 0)        = 4 + 2 = 6.\n             dp[2,4] = 3.\nRange [1,4]: guess 1 -> 1 + dp[2,4] = 4.\n             guess 2 -> 2 + max(0, dp[3,4]) = 2 + 3 = 5.\n             guess 3 -> 3 + max(dp[1,2], dp[4,4]) = 3 + 1 = 4.\n             guess 4 -> 4 + dp[1,3] = 6.\n             dp[1,4] = 4.\n```\n\n**Brute-force comparison.** Memoized recursion on `(i, j)` is `O(n^3)` time and `O(n^2)` space — the same as the bottom-up version. A naive `O(n!)` decision-tree enumeration is hopeless above `n = 10`.",
      follow_up: "**Variant 1 — minimize expected (rather than worst-case) cost.** Replace `max(left, right)` with `((k - i) * left + (j - k) * right) / (j - i + 1)`. The result is a different DP and the optimal strategy is closer to binary search at the median.\n\n**Variant 2 — bound the number of guesses.** Add a third dimension `dp[i][j][q]` = min cost given at most `q` guesses. Each transition decrements `q`. Useful for variants like 'you have at most 5 guesses'.\n\n**Variant 3 — variable penalty per guess.** Replace `k` in the recurrence with a cost function `c(k)`. The DP structure is unchanged.\n\n**Variant 4 — adversary biased lies.** If the adversary can lie at most `L` times, lift the DP into `dp[i][j][L]` and consider both branches independently.\n\n**Variant 5 — return the optimal guess at the root, not just the cost.** Track the argmin `k*` alongside `dp[1][n]`. Reconstruct the full strategy tree by recursing into `(i, k*-1)` and `(k*+1, j)`.\n\n**Variant 6 — Knuth optimization.** The optimal `k` at range `[i..j]` is non-decreasing in `j` (with `i` fixed) for this class of problems; you can speed the DP to `O(n^2)` using `opt[i][j-1] <= opt[i][j] <= opt[i+1][j]`. For `n <= 200` it is not needed.\n\n**Implementation pitfalls.**\n1. **Using `min(left, right)` instead of `max`.** You picked the wrong branch — the adversary chooses the worst-case sub-range, so it is a `max`.\n2. **Forgetting that case 1 (correct guess) costs 0.** It would be absorbed by the `max` only if both `left` and `right` are non-negative — which they are. Stating it explicitly does not change the answer but clarifies the recurrence.\n3. **Iterating by `i, j` directly instead of by interval length.** `dp[i][j]` depends on `dp[i][k-1]` and `dp[k+1][j]` — both smaller ranges. You must process shorter ranges first.\n4. **Off-by-one when `k == i` or `k == j`.** `dp[i][i-1]` and `dp[j+1][j]` must be 0; either pre-fill the table with zeros or guard in code.\n5. **Returning `dp[0][n-1]` on a 1-indexed table.** Indices for this DP are 1-indexed by convention; `dp[1][n]` is the answer.\n6. **Using `(low + high) / 2` greedy.** Median-guess is optimal for **expected** cost, not worst-case. For `n = 10` the median strategy costs 25; the DP answer is 16.",
      complexity: {
        time: "**O(n^3)** — there are `O(n^2)` ranges and each one tries `O(n)` choices of `k`. With `n <= 200` this is roughly 8 * 10^6 operations, well within typical limits.",
        space: "**O(n^2)** for the `dp` table of size `(n+2) * (n+2)`. The output is a single integer — `O(1)` aux. Bottom-up uses zero recursion stack; memoized recursion uses `O(n)` stack depth.",
        notes: "Knuth optimization can reduce the time to `O(n^2)` by exploiting monotonicity of the optimal split point. For `n <= 200` the speedup is unnecessary. Memoized top-down recursion is equally fast and often easier to write but uses `O(n)` extra stack space.",
        optimal: "**O(n^2) time with Knuth optimization** is the asymptotic best known. The standard interview answer is `O(n^3) / O(n^2)` — both bounds are accepted."
      },
      constraints: [
        "1 <= n <= 200",
        "The answer is the minimum money to GUARANTEE a win (worst-case, not expected)",
        "Penalty for a wrong guess of value k is exactly k dollars"
      ],
      hints: [
        "**Define `dp[i][j]` = minimum money to guarantee a win on the range `[i..j]`.** Base cases: `dp[i][i] = 0` and `dp[i][j] = 0` when `i > j`.",
        "**The adversary picks the worst sub-range after each wrong guess.** For a guess `k` in `[i..j]` the cost is `k + max(dp[i][k-1], dp[k+1][j])`.",
        "**You choose the best guess.** `dp[i][j] = min over k in [i..j] of (k + max(dp[i][k-1], dp[k+1][j]))`.",
        "**Iterate by increasing range length** so that smaller ranges are filled first.",
        "**Binary-search at the median is NOT optimal here** — median minimizes expected cost, but the problem asks for worst-case.",
        "**Time is O(n^3), space is O(n^2).** For `n <= 200`, this is fast enough; Knuth optimization gives `O(n^2)` if you need it."
      ],
      test_cases,
      solutions: {
        python: "class Solution:\n    def getMoneyAmount(self, n: int) -> int:\n        if n <= 1:\n            return 0\n        dp = [[0] * (n + 2) for _ in range(n + 2)]\n        for length in range(2, n + 1):\n            for i in range(1, n - length + 2):\n                j = i + length - 1\n                best = float('inf')\n                for k in range(i, j + 1):\n                    left = dp[i][k - 1] if k - 1 >= i else 0\n                    right = dp[k + 1][j] if k + 1 <= j else 0\n                    cost = k + max(left, right)\n                    if cost < best:\n                        best = cost\n                dp[i][j] = best\n        return dp[1][n]\n",
        javascript: "/**\n * @param {number} n\n * @return {number}\n */\nvar getMoneyAmount = function(n) {\n    if (n <= 1) return 0;\n    const dp = Array.from({length: n + 2}, () => new Array(n + 2).fill(0));\n    for (let length = 2; length <= n; length++) {\n        for (let i = 1; i + length - 1 <= n; i++) {\n            const j = i + length - 1;\n            let best = Infinity;\n            for (let k = i; k <= j; k++) {\n                const left = (k - 1 >= i) ? dp[i][k - 1] : 0;\n                const right = (k + 1 <= j) ? dp[k + 1][j] : 0;\n                const cost = k + Math.max(left, right);\n                if (cost < best) best = cost;\n            }\n            dp[i][j] = best;\n        }\n    }\n    return dp[1][n];\n};\n",
        java: "public class Solution {\n    public int getMoneyAmount(int n) {\n        if (n <= 1) return 0;\n        int[][] dp = new int[n + 2][n + 2];\n        for (int length = 2; length <= n; length++) {\n            for (int i = 1; i + length - 1 <= n; i++) {\n                int j = i + length - 1;\n                int best = Integer.MAX_VALUE;\n                for (int k = i; k <= j; k++) {\n                    int left = (k - 1 >= i) ? dp[i][k - 1] : 0;\n                    int right = (k + 1 <= j) ? dp[k + 1][j] : 0;\n                    int cost = k + Math.max(left, right);\n                    if (cost < best) best = cost;\n                }\n                dp[i][j] = best;\n            }\n        }\n        return dp[1][n];\n    }\n}\n",
        cpp: "#include <vector>\n#include <algorithm>\n#include <climits>\nusing namespace std;\n\nclass Solution {\npublic:\n    int getMoneyAmount(int n) {\n        if (n <= 1) return 0;\n        vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));\n        for (int length = 2; length <= n; length++) {\n            for (int i = 1; i + length - 1 <= n; i++) {\n                int j = i + length - 1;\n                int best = INT_MAX;\n                for (int k = i; k <= j; k++) {\n                    int left = (k - 1 >= i) ? dp[i][k - 1] : 0;\n                    int right = (k + 1 <= j) ? dp[k + 1][j] : 0;\n                    int cost = k + max(left, right);\n                    if (cost < best) best = cost;\n                }\n                dp[i][j] = best;\n            }\n        }\n        return dp[1][n];\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: minimum-number-of-refueling-stops (LC 871)
//   minRefuelStops(target: int, startFuel: int, stations: int[][]) -> int
//   Greedy + max-heap: at each station we cannot reach, refuel from the largest
//   tank seen so far. Return -1 if we cannot reach the target.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F361B);

  // Binary max-heap on numbers.
  function heapPush(h, v) {
    h.push(v);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p] >= h[i]) break;
      const t = h[p]; h[p] = h[i]; h[i] = t;
      i = p;
    }
  }
  function heapPop(h) {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      const n = h.length;
      while (true) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let best = i;
        if (l < n && h[l] > h[best]) best = l;
        if (r < n && h[r] > h[best]) best = r;
        if (best === i) break;
        const t = h[best]; h[best] = h[i]; h[i] = t;
        i = best;
      }
    }
    return top;
  }

  function ref(target, startFuel, stations) {
    if (startFuel >= target) return 0;
    let fuel = startFuel;
    let stops = 0;
    const heap = [];
    let i = 0;
    const n = stations.length;
    while (fuel < target) {
      while (i < n && stations[i][0] <= fuel) {
        heapPush(heap, stations[i][1]);
        i++;
      }
      if (heap.length === 0) return -1;
      fuel += heapPop(heap);
      stops++;
    }
    return stops;
  }

  const cases = [];
  // LC sample 1: target=1, startFuel=1, stations=[] -> 0
  cases.push([1, 1, []]);
  // LC sample 2: target=100, startFuel=1, stations=[[10,100]] -> -1
  cases.push([100, 1, [[10, 100]]]);
  // LC sample 3 (canonical) -> 2
  cases.push([100, 10, [[10, 60], [20, 30], [30, 30], [60, 40]]]);
  // Exact fuel from start
  cases.push([10, 10, []]);
  // Just enough with one stop
  cases.push([20, 10, [[5, 10]]]);
  // Need two stops
  cases.push([50, 10, [[10, 10], [20, 30]]]);
  // Skip a small station, prefer a large later one
  cases.push([60, 30, [[10, 5], [20, 60]]]);
  // Cannot reach because gap too wide
  cases.push([100, 20, [[10, 10], [50, 10]]]);
  // Long line of stations
  cases.push([200, 50, [[25, 25], [50, 50], [75, 50], [100, 50]]]);
  // Single station bridging the entire gap
  cases.push([100, 10, [[5, 90]]]);
  // No stations, cannot reach
  cases.push([100, 50, []]);
  // No stations, exact reach
  cases.push([100, 100, []]);
  // Many small stations, single large one preferred
  cases.push([100, 10, [[5, 5], [10, 5], [15, 5], [20, 70]]]);
  // Greedy refuel scenario
  cases.push([100, 25, [[25, 25], [50, 25], [75, 25]]]);
  // Single stop with exact fuel
  cases.push([100, 50, [[50, 50]]]);
  // Stations beyond target should be ignored (still valid)
  cases.push([50, 10, [[5, 40]]]);
  // Tight scenario
  cases.push([30, 1, [[1, 9], [10, 5], [15, 16]]]);
  // Heap picks last station first when smaller ones came earlier
  cases.push([60, 5, [[5, 5], [10, 5], [15, 50]]]);
  // Multiple ways but minimum stops
  cases.push([100, 25, [[10, 10], [20, 20], [30, 30], [60, 40]]]);
  // Long-distance scenario
  cases.push([500, 100, [[100, 100], [200, 100], [300, 100], [400, 100]]]);
  // Fuel barely enough
  cases.push([1000, 999, [[500, 1]]]);
  // Edge: target = startFuel
  cases.push([1, 1, [[1, 1]]]);
  // Edge: zero-fuel station included (but already reachable)
  cases.push([100, 100, [[10, 0]]]);
  // Need three stops
  cases.push([100, 10, [[5, 30], [20, 30], [50, 40]]]);

  // Random scenarios via LCG.
  while (cases.length < 30) {
    const target = 100 + (lcg() % 900);
    const startFuel = 10 + (lcg() % 200);
    const nStations = 1 + (lcg() % 8);
    const stations = [];
    let lastPos = 0;
    for (let k = 0; k < nStations; k++) {
      const step = 5 + (lcg() % 80);
      lastPos += step;
      if (lastPos >= target) break;
      const fuel = (lcg() % 100);
      stations.push([lastPos, fuel]);
    }
    // Sort by position (problem guarantees sorted input).
    stations.sort((a, b) => a[0] - b[0]);
    cases.push([target, startFuel, stations]);
  }

  const test_cases = cases.map(([target, startFuel, stations]) => ({
    inputs: [String(target), String(startFuel), JSON.stringify(stations)],
    expected: String(ref(target, startFuel, stations))
  }));

  return {
    slug: "minimum-number-of-refueling-stops",
    obj: {
      description: "A car travels from a starting position to a destination which is `target` miles east of the starting position.\n\nThere are gas stations along the way. The gas stations are represented as an array `stations` where `stations[i] = [position_i, fuel_i]` indicates that the `i`-th gas station is `position_i` miles east of the starting position and has `fuel_i` liters of gas.\n\nThe car starts with an infinite tank of gas, which initially has `startFuel` liters of fuel in it. It uses **1 liter of gas per mile** that it drives. When the car reaches a gas station, it may stop and refuel, transferring **all the gas from the station** into the car.\n\nReturn the **minimum number of refueling stops** the car must make in order to reach its destination. If it cannot reach the destination, return `-1`.\n\nNote that if the car reaches a gas station with `0` fuel left, the car can still refuel there. If the car reaches the destination with `0` fuel left, it is still considered to have arrived.\n\n**Example 1**\n\n```\nInput:  target = 1, startFuel = 1, stations = []\nOutput: 0\n```\n\n**Example 2**\n\n```\nInput:  target = 100, startFuel = 1, stations = [[10,100]]\nOutput: -1\nExplanation: We can reach station 0 at position 1 but cannot reach the station at position 10.\n```\n\n**Example 3**\n\n```\nInput:  target = 100, startFuel = 10, stations = [[10,60],[20,30],[30,30],[60,40]]\nOutput: 2\nExplanation: Drive to position 10, refuel 60 (total fuel 60). Drive to position 60, refuel 40 (total fuel 80). Drive to target.\n```\n\nThis is **LeetCode 871**. The canonical solution is **greedy with a max-heap**: walk through stations in order, push their fuel amounts onto the heap as you pass each one; whenever you cannot reach the next station (or the target), pop the largest fuel from the heap and count one refuel.",
      method_name: "minRefuelStops",
      params: [
        { name: "target", type: "int" },
        { name: "startFuel", type: "int" },
        { name: "stations", type: "int[][]" }
      ],
      return_type: "int",
      tags: ["array", "dynamic-programming", "greedy", "heap-priority-queue"],
      pattern: "**Defer the refuel decision: collect every station you pass into a max-heap, then refuel from the largest tank only when you must.**\n\n**Why greedy works.** Once you have passed a station, its fuel is available to you in the future — choosing it earlier vs later does not change reachability, only the order in which the count goes up. Among all stations you have passed, refueling from the **largest tank** dominates any other choice: it maximizes your reach for one stop.\n\n**Algorithm.**\n\n```\nfuel = startFuel\nstops = 0\nheap = []   # max-heap of fuel values\ni = 0       # next station index to consider\nwhile fuel < target:\n    # Drain every station we can already reach into the heap.\n    while i < len(stations) and stations[i][0] <= fuel:\n        heappush_max(heap, stations[i][1])\n        i += 1\n    # If the heap is empty, we cannot move forward.\n    if not heap:\n        return -1\n    # Refuel from the biggest tank available.\n    fuel += heappop_max(heap)\n    stops += 1\nreturn stops\n```\n\n**Why a max-heap is the right structure.** At any moment, the set of 'available but unused' stations is fluid: every station between the current position and `fuel` miles ahead is available. We do not know in advance which we will need. The max-heap supports `O(log n)` insert (when a new station becomes reachable) and `O(log n)` extract-max (when we run out of fuel). Total work across the entire trip is `O(n log n)`.\n\n**Why a min-heap is wrong.** It would refuel from the smallest tank first — guaranteed to maximize the number of stops, the opposite of the goal.\n\n**Why eager refueling at every station is wrong.** It would correctly minimize the number of remaining stations but does not minimize the number of stops — refueling from a tiny tank when a large one is available wastes a stop.\n\n**Worked example.** `target = 100, startFuel = 10, stations = [[10,60],[20,30],[30,30],[60,40]]`.\n\n```\nstart fuel=10, target=100\n  station 0 at pos 10 reachable; push 60.   heap = [60]\n  fuel(10) < target -> pop 60, fuel=70, stops=1\n  station 1 at pos 20 reachable; push 30.   heap = [30]\n  station 2 at pos 30 reachable; push 30.   heap = [30,30]\n  station 3 at pos 60 reachable; push 40.   heap = [40,30,30]\n  fuel(70) < target -> pop 40, fuel=110, stops=2\n  fuel(110) >= target -> done, return 2\n```\n\n**Alternative DP.** Let `dp[t]` be the maximum reachable distance using exactly `t` refuels. Process stations one at a time and update `dp` in reverse:\n\n```\ndp[0] = startFuel\nfor each station (pos, f):\n    for t = current_max_stops down to 0:\n        if dp[t] >= pos:\n            dp[t + 1] = max(dp[t + 1], dp[t] + f)\nreturn smallest t with dp[t] >= target, else -1\n```\n\n`O(n^2)` time, `O(n)` space. Equivalent to the heap solution but slower; useful when a priority queue is forbidden.\n\n**Brute-force comparison.** Try every subset of stations: `O(2^n)`. Useless above `n = 20`. Heap solution is the standard `O(n log n)` answer.\n\n**Edge cases.** `startFuel >= target`: answer is `0`. No stations and `startFuel < target`: answer is `-1`. A station with `fuel = 0`: heap accepts it but it never wins a tie-break unless every other tank is also `0`.",
      follow_up: "**Variant 1 — minimize total fuel cost instead of number of stops.** Each station now has a per-liter price; you choose how many liters to buy at each. This is a different DP that prices each interval against the cheapest gas seen so far.\n\n**Variant 2 — bounded tank capacity.** When `fuel` cannot exceed `C`, the heap solution still works but the refuel step must cap `fuel + popped` at `C`. The greedy argument survives because deferring refuels only helps when fuel does not overflow.\n\n**Variant 3 — multiple cars sharing fuel.** Reduces to a multi-commodity flow problem; not solvable greedily.\n\n**Variant 4 — stations in arbitrary order.** Sort by position first, then run the heap algorithm.\n\n**Variant 5 — return the indices of the stations used.** Track `(fuel, station_index)` pairs in the heap and pop the index alongside the value; collect into a result list.\n\n**Variant 6 — minimum stops with `k` allowed lookahead.** You can see only the next `k` stations at a time. Run a sliding-window variant of the heap.\n\n**Implementation pitfalls.**\n1. **Using a min-heap.** Refueling from the smallest tank maximizes stops — the opposite of the goal.\n2. **Refueling at every station you pass.** Wastes stops on tiny tanks; the heap delay is essential.\n3. **Stopping the loop on `fuel == target`.** The problem accepts arriving with `0` fuel, so the comparison must be `fuel < target` (strict), not `<=`.\n4. **Forgetting to push stations whose position equals the current `fuel` exactly.** Use `<=` in the 'add to heap' check; `<` would skip the boundary station.\n5. **Returning the number of stations passed instead of the number of refuels used.** Stops counts heap pops, not heap pushes.\n6. **Stations not sorted by position.** The problem guarantees this; if you ever face an unsorted input, sort first.\n7. **Overflow on large `target + startFuel + sum(fuel)`.** In Java / C++, use `long` for the running fuel total when constraints push 32-bit limits.",
      complexity: {
        time: "**O(n log n)** where `n = stations.length`. Each station is pushed onto the heap at most once and popped at most once; each operation is `O(log n)`. The outer `while` loop runs at most `n + 1` times.",
        space: "**O(n)** for the heap in the worst case (every station is reachable before any refuel is needed). Output is one integer — `O(1)`. The DP alternative also uses `O(n)` space.",
        notes: "The `O(n^2)` DP `dp[t] = max distance using t stops` is conceptually clean but slower. With `n <= 500` (typical LC constraint) both fit comfortably; `O(n log n)` is the standard interview answer.",
        optimal: "**O(n log n) time and O(n) space** is the standard optimal. No sub-`n log n` algorithm is known — every station must be considered, and selecting the maximum requires `Omega(log n)` per pop."
      },
      constraints: [
        "1 <= target, startFuel <= 10^9",
        "0 <= stations.length <= 500",
        "1 <= position_i < position_{i+1} < target",
        "1 <= fuel_i <= 10^9"
      ],
      hints: [
        "**The order in which you refuel from PAST stations does not matter — only the choice of WHICH past station.** Always pick the largest tank available.",
        "**Maintain a max-heap of the fuel amounts of every station you have passed.** Push as you pass, pop as you must refuel.",
        "**Drive until you cannot reach the next station** — then take one refuel from the heap. Repeat until fuel >= target or the heap is empty.",
        "**If the heap is empty and fuel < target, return -1** — no refuel is possible.",
        "**A min-heap reverses the greedy choice.** Always use a max-heap (or negate values in a Python min-heap).",
        "**Boundary: `startFuel >= target` returns 0.** No refuel needed."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\nimport heapq\n\n\nclass Solution:\n    def minRefuelStops(self, target: int, startFuel: int, stations: List[List[int]]) -> int:\n        if startFuel >= target:\n            return 0\n        heap = []  # python heapq is a min-heap; push negatives for max-heap\n        fuel = startFuel\n        stops = 0\n        i = 0\n        n = len(stations)\n        while fuel < target:\n            while i < n and stations[i][0] <= fuel:\n                heapq.heappush(heap, -stations[i][1])\n                i += 1\n            if not heap:\n                return -1\n            fuel += -heapq.heappop(heap)\n            stops += 1\n        return stops\n",
        javascript: "/**\n * @param {number} target\n * @param {number} startFuel\n * @param {number[][]} stations\n * @return {number}\n */\nvar minRefuelStops = function(target, startFuel, stations) {\n    if (startFuel >= target) return 0;\n    const heap = [];\n    const push = (v) => {\n        heap.push(v);\n        let i = heap.length - 1;\n        while (i > 0) {\n            const p = (i - 1) >> 1;\n            if (heap[p] >= heap[i]) break;\n            [heap[p], heap[i]] = [heap[i], heap[p]];\n            i = p;\n        }\n    };\n    const pop = () => {\n        const top = heap[0];\n        const last = heap.pop();\n        if (heap.length > 0) {\n            heap[0] = last;\n            let i = 0;\n            const n = heap.length;\n            while (true) {\n                const l = 2 * i + 1, r = 2 * i + 2;\n                let best = i;\n                if (l < n && heap[l] > heap[best]) best = l;\n                if (r < n && heap[r] > heap[best]) best = r;\n                if (best === i) break;\n                [heap[best], heap[i]] = [heap[i], heap[best]];\n                i = best;\n            }\n        }\n        return top;\n    };\n    let fuel = startFuel;\n    let stops = 0;\n    let i = 0;\n    const n = stations.length;\n    while (fuel < target) {\n        while (i < n && stations[i][0] <= fuel) {\n            push(stations[i][1]);\n            i++;\n        }\n        if (heap.length === 0) return -1;\n        fuel += pop();\n        stops++;\n    }\n    return stops;\n};\n",
        java: "import java.util.*;\n\npublic class Solution {\n    public int minRefuelStops(int target, int startFuel, int[][] stations) {\n        if (startFuel >= target) return 0;\n        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());\n        long fuel = startFuel;\n        int stops = 0;\n        int i = 0;\n        int n = stations.length;\n        while (fuel < target) {\n            while (i < n && stations[i][0] <= fuel) {\n                heap.offer(stations[i][1]);\n                i++;\n            }\n            if (heap.isEmpty()) return -1;\n            fuel += heap.poll();\n            stops++;\n        }\n        return stops;\n    }\n}\n",
        cpp: "#include <vector>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {\n        if (startFuel >= target) return 0;\n        priority_queue<int> heap;\n        long long fuel = startFuel;\n        int stops = 0;\n        int i = 0;\n        int n = (int)stations.size();\n        while (fuel < target) {\n            while (i < n && stations[i][0] <= fuel) {\n                heap.push(stations[i][1]);\n                i++;\n            }\n            if (heap.empty()) return -1;\n            fuel += heap.top();\n            heap.pop();\n            stops++;\n        }\n        return stops;\n    }\n};\n"
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
    "// ===== WAVE 35B START =====",
    "// === WAVE 35B " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35B " + p1.slug + " END ===",
    "// === WAVE 35B " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 35B " + p2.slug + " END ===",
    "// ===== WAVE 35B END =====",
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
if (src.indexOf("WAVE 35B START") !== -1) {
  console.error("WAVE 35B already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 35A END marker and append block after it.
const ANCHOR = "// ===== WAVE 35A END =====";
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

console.log("DONE wave35b " + p1.slug + " + " + p2.slug);
