#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 9 (30 problems).
// Focus: dynamic programming (1D + 2D).
// Same shape as batches 1..6: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch9.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, SVC);

const PAYLOAD = {
  'climbing-stairs': [
    {
      inputs: ['5'],
      expected: '8',
      explanation_md:
        'The canonical small case. `dp[i] = dp[i-1] + dp[i-2]` because the last step is either a `1` (from `i-1`) or a `2` (from `i-2`). Trace for `n = 5`: `dp = [1, 2, 3, 5, 8]` — exactly Fibonacci shifted by one. Two scalars suffice instead of a full array, giving **O(n)** time and **O(1)** space. The naive recursion `climb(i) = climb(i-1) + climb(i-2)` without memo is **O(2^n)** — a tree of repeated subproblems that DP collapses to a line.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'The smallest input. One stair, one way (a single `1` step). The base case `dp[0] = 1` returns immediately. Proves the recurrence handles `n = 1` without entering the loop — a brittle implementation that always reads `dp[i-2]` would index out of bounds on `n = 1`. The guard `if (n <= 1) return 1` (or seeding both `dp[0]` and `dp[1]`) is essential.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '2',
      explanation_md:
        'The two-stair case. Either `1 + 1` or a single `2` — two ways. Proves the second base case `dp[1] = 2` is required; without it the recurrence would skip the `single 2-step` count. This is also the smallest input where both terms of the recurrence `dp[i-1] + dp[i-2]` are needed and the answer matches the brute-force enumeration exactly.',
      viz_anchor: null,
    },
  ],

  'min-cost-climbing-stairs': [
    {
      inputs: ['[10,15,20]'],
      expected: '15',
      explanation_md:
        'The canonical LC example. `dp[i]` = min cost to **reach** step `i` (the top is `i == n`). Recurrence: `dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])`. Trace: `dp = [0, 0, 10, 15]`. The top is index 3; cheapest is starting at step 1 (`cost = 15`), jumping straight to the top. Return `15`. **O(n)** time, **O(1)** space with two rolling scalars. The cost is paid **on departure** from a step, not arrival — that subtle framing makes the recurrence clean.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,100,1,1,1,100,1,1,100,1]'],
      expected: '6',
      explanation_md:
        'The adversarial case. Naive "always pick the cheapest next step" would lock onto every `1` and hit the `100`s along the way. DP trace: `dp = [0, 0, 1, 2, 2, 3, 3, 4, 5, 6, 6]`. Optimal path: skip indices `1, 5, 8` (the 100s) by stepping 2 over each. Sum of paid costs = `1+1+1+1+1+1 = 6`. Proves the DP finds the globally optimal alternating pattern without trial-and-error — at each step it just compares "single step from prev" vs "double step from two back".',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0,0]'],
      expected: '0',
      explanation_md:
        'The all-zero edge case. Every step is free. `dp = [0, 0, 0, 0, 0]`. Return `0`. Proves the recurrence correctly handles zero costs without any special path. A brittle implementation that conflates "min cost" with "min steps taken" would return some positive count of steps here. The metric is **cost paid**, not steps walked.',
      viz_anchor: null,
    },
  ],

  'house-robber': [
    {
      inputs: ['[1,2,3,1]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. `dp[i] = max(dp[i-1], dp[i-2] + nums[i])` — at house `i`, either skip it or rob it plus the best up to `i-2`. Trace: `dp = [1, 2, 4, 4]`. Best: rob houses 0 and 2 (`1 + 3 = 4`). Return `4`. **O(n)** time, **O(1)** space with two rolling scalars (`prev`, `curr`). A greedy that always takes the largest available without checking adjacency would pick `3, 2` — adjacent → invalid, fall back to `3, 1` = `4` by luck. DP gets there without trial-and-error.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,7,9,3,1]'],
      expected: '12',
      explanation_md:
        'A greedy that grabs the largest available without checking adjacency would pick `9, 7` → adjacent → invalid, fall back to `9, 3` for total `12` — by luck, the right answer. But on `[2,7,9,3,1]` the correct DP trace is: `dp = [2, 7, 11, 11, 12]`. Houses 0+2+4 = `2+9+1 = 12`. The DP finds it without trial-and-error: at each index it just compares "skip" vs "take plus best two back". Return `12`.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-list edge case. No houses, no loot. Return `0`. Proves the algorithm short-circuits on empty input without trying to read `nums[0]`. A brittle implementation that initializes `prev = nums[0]` would crash on empty input. The `if (n == 0) return 0` guard (or letting the loop simply not execute) is essential.',
      viz_anchor: null,
    },
  ],

  'house-robber-ii': [
    {
      inputs: ['[2,3,2]'],
      expected: '3',
      explanation_md:
        'The canonical circular case. Houses form a cycle, so robbing house `0` and house `n-1` together is forbidden. Trick: run House Robber I twice — once on `nums[0..n-2]` (skip last) and once on `nums[1..n-1]` (skip first) — return the max. For `[2,3,2]`: skip-last range `[2,3]` → dp `[2,3]` → `3`. Skip-first range `[3,2]` → dp `[3,3]` → `3`. Return `max(3, 3) = 3`. Robbing all three would give `4` but houses 0 and 2 are adjacent in the cycle — invalid. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,1]'],
      expected: '4',
      explanation_md:
        'The case from House Robber I, now circular. Skip-last range `[1,2,3]` → dp `[1, 2, 4]` → `4`. Skip-first range `[2,3,1]` → dp `[2, 3, 3]` → `3`. Return `max(4, 3) = 4`. The answer matches the non-circular version because the optimal robbery (houses 0 and 2) does not include the last house — so the circular constraint is not binding here. Proves the two-pass max correctly identifies which constraint actually limits the heist.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-house edge case. No circular adjacency to worry about — rob the only house. Return `1`. Both subranges (`[0..n-2]` and `[1..n-1]`) are empty here, so the two-pass guard must handle the `n == 1` case directly. A brittle implementation that always slices both subranges would skip the lone house and return `0`. The guard `if (n == 1) return nums[0]` is mandatory.',
      viz_anchor: null,
    },
  ],

  'house-robber-iii': [
    {
      inputs: ['[3,2,3,null,3,null,1]'],
      expected: '7',
      explanation_md:
        'The canonical LC example. Tree-shaped robbery: a node and its direct children cannot both be robbed. DFS returning a pair `(rob_this, skip_this)`. `rob_this = node.val + left.skip + right.skip`. `skip_this = max(left.rob, left.skip) + max(right.rob, right.skip)`. For the tree, root `3` + the two grandchildren `3 + 1` = `7` beats robbing both children `2 + 3` = `5`. Return `7`. **O(n)** time, **O(h)** stack — single post-order pass, no global memo needed because each node\'s answer depends only on its two children.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,4,5,1,3,null,1]'],
      expected: '9',
      explanation_md:
        'A case where robbing the children beats robbing the root. Root `3` + grandchildren `1 + 3 + 1` = `8`. Children `4 + 5` = `9`. Return `9`. Proves the DFS correctly compares both choices at every node — a greedy that always takes the larger of `node.val` vs `sum_of_children` at each level would miss interactions between layers. The `(rob, skip)` pair carries enough state to make every decision locally optimal.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. No nodes to rob. The DFS returns `(0, 0)` at the null base. Return `max(0, 0) = 0`. Proves the algorithm handles empty input cleanly. A brittle implementation that always reads `root.val` first would NPE here. The pair-returning DFS pattern is what allows the empty-tree case to compose without a special guard.',
      viz_anchor: null,
    },
  ],

  'coin-change': [
    {
      inputs: ['[1,2,5]', '11'],
      expected: '3',
      explanation_md:
        'The canonical LC example. `dp[a]` = min coins for amount `a`, init to `infinity`. Recurrence: `dp[a] = min(dp[a - c] + 1)` over all coins `c` with `c <= a`. Trace key entries: `dp[0]=0, dp[1]=1, dp[2]=1, dp[5]=1, dp[6]=2, dp[10]=2, dp[11]=3` (5+5+1). Return `3`. **O(amount × coins)** time, **O(amount)** space. A greedy "always grab the largest coin" would pick `5+5+1 = 3` — correct here by luck — but fails on `[1,3,4]` for `6` (greedy 4+1+1=3 vs optimal 3+3=2).',
      viz_anchor: null,
    },
    {
      inputs: ['[2]', '3'],
      expected: '-1',
      explanation_md:
        'The "impossible" edge case. With only `2`-coins, no combination sums to `3`. `dp[1]` and `dp[3]` remain `infinity` after the loop. Return `-1`. Proves the algorithm correctly distinguishes unreachable amounts from reachable ones via the sentinel. A brittle implementation that returns `dp[amount]` without checking for the sentinel would return `infinity` (or a huge int), wrong.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '0'],
      expected: '0',
      explanation_md:
        'The zero-amount edge case. Zero coins make zero. `dp[0] = 0` is the base case. Return `0` immediately — no loop iterations. Proves the algorithm correctly handles the empty target. A brittle implementation that always loops `a = 1..amount` would still return `0` because the loop body never executes — but the base-case seeding is what makes that valid.',
      viz_anchor: null,
    },
  ],

  'coin-change-ii': [
    {
      inputs: ['5', '[1,2,5]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. **Count** the number of combinations (not min coins). Critical ordering: outer loop over coins, inner over amounts. `dp[a] += dp[a - c]` for each `c`. Trace: start `dp = [1,0,0,0,0,0]`. After coin 1: `[1,1,1,1,1,1]`. After coin 2: `[1,1,2,2,3,3]`. After coin 5: `[1,1,2,2,3,4]`. Return `dp[5] = 4`. Swapping the loop order would count **permutations** (e.g. `1+2` and `2+1` separately), giving `9`. Outer-coin order is mandatory for combinations.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '[2]'],
      expected: '0',
      explanation_md:
        'The "no combinations" case. Only `2`-coins, target `3` is odd. After processing coin 2: `dp = [1, 0, 1, 0]`. Return `dp[3] = 0`. Proves the algorithm correctly returns `0` for unreachable targets without using a separate sentinel — the count just stays zero. The base case `dp[0] = 1` (one way to make zero: empty multiset) is what propagates correctly through reachable amounts only.',
      viz_anchor: null,
    },
    {
      inputs: ['10', '[10]'],
      expected: '1',
      explanation_md:
        'The single-coin-equals-target case. Exactly one way: use the coin once. After processing coin 10: `dp[10] = dp[0] = 1`. Return `1`. Proves the algorithm correctly counts the single-coin solution. A brittle implementation that skips coins larger than the running amount inside the loop would still produce the right answer here, since coin 10 is exactly the target.',
      viz_anchor: null,
    },
  ],

  'partition-equal-subset-sum': [
    {
      inputs: ['[1,5,11,5]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Sum is `22`, half is `11`. Question reduces to: is there a subset summing to `11`? Subset sum via 1D DP: `dp[s]` = can we form sum `s`. Init `dp[0] = true`. For each num, iterate `s` from `target` **down** to `num` and set `dp[s] |= dp[s - num]`. After processing: `dp[11] = true` (subset `{11}` or `{1, 5, 5}`). Return `true`. **O(n × target)** time, **O(target)** space. Iterating `s` downward prevents reusing the same num twice within one iteration.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,5]'],
      expected: 'false',
      explanation_md:
        'A case where total sum is odd. Sum = `11`, half = `5.5` — non-integer. Return `false` immediately without entering the DP. Proves the parity check is the first-line guard. A brittle implementation that always runs the DP would still return `false` (no subset can sum to a non-integer), but the early exit saves **O(n × sum)** work on the most obvious negative cases.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: 'true',
      explanation_md:
        'The smallest positive case. Sum = `2`, half = `1`. After processing first `1`: `dp[1] = true`. After processing second `1`: still `dp[1] = true`. Return `true`. Proves the algorithm correctly handles duplicates without double-counting — the downward iteration over `s` prevents the second `1` from rebuilding off the first within one pass. The two `1`s naturally split into two equal subsets.',
      viz_anchor: null,
    },
  ],

  'target-sum': [
    {
      inputs: ['[1,1,1,1,1]', '3'],
      expected: '5',
      explanation_md:
        'The canonical LC example. Each number gets a `+` or `-`. Goal: count expressions equaling target. Reduce to subset sum: let `P` = positive set, `N` = negative set. `P - N = target` and `P + N = sum`, so `P = (sum + target) / 2`. Count subsets summing to `P`. For `[1,1,1,1,1]` and target `3`: `P = (5+3)/2 = 4`. Count subsets of size 4 (since each element is 1) = `C(5,4) = 5`. Return `5`. **O(n × P)** time, **O(P)** space — much faster than the **O(2^n)** brute-force enumeration of signs.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '1',
      explanation_md:
        'The smallest positive case. `P = (1+1)/2 = 1`. Subsets summing to `1`: just `{1}`. Return `1`. Proves the algorithm correctly reduces a single-element problem to the subset-count form. A brittle implementation that doesn\'t handle `target = sum` (so `N = 0`) would still work here because the DP naturally treats the empty subset as the `N = 0` case.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '2'],
      expected: '0',
      explanation_md:
        'An unreachable target. `sum = 1`, target = `2`. Since `|target| > sum`, no sign assignment can reach it. The guard `(sum + target) % 2 != 0 || abs(target) > sum` catches this and returns `0` immediately. Proves the parity + bound check is essential — without it, `P` would be non-integer or negative, the DP would index out of range or produce a garbage count.',
      viz_anchor: null,
    },
  ],

  'longest-increasing-subsequence': [
    {
      inputs: ['[10,9,2,5,3,7,101,18]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. **O(n log n)** patience-sort: maintain `tails` where `tails[k]` is the smallest possible tail of an increasing subsequence of length `k+1`. For each num, binary-search for the first tail `>= num` and replace it (or append if larger than all). Trace: `[10]` → `[9]` → `[2]` → `[2,5]` → `[2,3]` → `[2,3,7]` → `[2,3,7,101]` → `[2,3,7,18]`. Length `4`. Return `4`. The naive **O(n²)** DP `dp[i] = max(dp[j]+1 for j < i with nums[j] < nums[i])` also works but loses on large inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,7,7,7,7,7,7]'],
      expected: '1',
      explanation_md:
        'The all-equal edge case. Strictly increasing requires `<`, not `<=`. Every `7` replaces `tails[0]` with itself. `tails = [7]`. Return `1`. Proves the algorithm correctly enforces strict increase — a brittle implementation using `<=` in the binary search would build `tails = [7, 7, 7, ...]` and return `7`. The choice of `bisect_left` (vs `bisect_right`) encodes the strictness.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,0,3,2,3]'],
      expected: '4',
      explanation_md:
        'A case demonstrating the replacement step. Trace: `[0]` → `[0,1]` → `[0,1]` (replace `0` at pos 0 with same `0`) → `[0,1,3]` → `[0,1,2]` (replace `3` with smaller `2`) → `[0,1,2,3]`. Return `4`. The LIS isn\'t literally `tails` — but its length is. Proves the "replace with smaller" trick: it preserves length while leaving room for longer extensions. Critical insight: `tails` is not a valid subsequence, just a length tracker.',
      viz_anchor: null,
    },
  ],

  'longest-common-subsequence': [
    {
      inputs: ['"abcde"', '"ace"'],
      expected: '3',
      explanation_md:
        'The canonical LC example. 2D DP. `dp[i][j]` = LCS length for `text1[:i]` and `text2[:j]`. Recurrence: if last chars match, `dp[i][j] = dp[i-1][j-1] + 1`; else `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`. First rows of the table for `"abcde"` × `"ace"`: row `a`: `[0,1,1,1]`, row `c`: `[0,1,1,1]`, row `e`: `[0,1,1,2]`... ultimately `dp[5][3] = 3`. LCS is `"ace"`. **O(m × n)** time and space; **O(min(m,n))** with rolling rows.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"def"'],
      expected: '0',
      explanation_md:
        'The disjoint-alphabet case. No characters in common. Every cell in `dp` stays `0` because no match ever fires the `+1` branch, and `max(0, 0) = 0`. Return `dp[3][3] = 0`. Proves the algorithm correctly handles fully disjoint inputs without special-casing. A brittle implementation that always returns `min(m, n)` (as a quick upper bound) would falsely return `3` here.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abc"'],
      expected: '3',
      explanation_md:
        'The identical-strings case. Every position matches. The diagonal of `dp` builds `[0, 1, 2, 3]` straight to the corner. Return `3`. Proves the algorithm correctly handles full equality — the LCS equals the string itself. The match branch fires at every diagonal step; the max branch is never the deciding factor.',
      viz_anchor: null,
    },
  ],

  'edit-distance': [
    {
      inputs: ['"horse"', '"ros"'],
      expected: '3',
      explanation_md:
        'The canonical LC example. 2D DP. `dp[i][j]` = min ops to convert `word1[:i]` to `word2[:j]`. Match → `dp[i-1][j-1]`. Mismatch → `1 + min(dp[i-1][j-1] replace, dp[i-1][j] delete, dp[i][j-1] insert)`. First 3 rows of the table for `"horse"` × `"ros"`: row `""`: `[0,1,2,3]`, row `h`: `[1,1,2,3]`, row `o`: `[2,2,1,2]`. Continuing yields `dp[5][3] = 3`. The 3 ops: replace `h→r` (horse→rorse), delete `r` (rorse→rose), delete `e` (rose→ros). DP finds the optimal sequence without enumerating all op orderings.',
      viz_anchor: null,
    },
    {
      inputs: ['"intention"', '"execution"'],
      expected: '5',
      explanation_md:
        'A harder case showing the full op palette. 5 ops needed: `intention → inention` (delete t), `→ enention` (replace i→e), `→ exention` (replace n→x), `→ exection` (replace n→c), `→ execution` (insert u). DP picks these without trial-and-error by considering all three sub-problems at every cell and taking the min. The brute-force recursion `O(3^max(m,n))` becomes `O(m × n)` with memoization — the canonical demonstration of why DP exists.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '""'],
      expected: '0',
      explanation_md:
        'The both-empty edge case. Zero ops. `dp[0][0] = 0`. Return `0`. Proves the base-case seeding `dp[i][0] = i` (delete everything) and `dp[0][j] = j` (insert everything) collapses cleanly at the origin. A brittle implementation that requires a non-empty `word1` to enter the loop would return whatever junk default the dp array initialized to.',
      viz_anchor: null,
    },
  ],

  'distinct-subsequences': [
    {
      inputs: ['"rabbbit"', '"rabbit"'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Count occurrences of `t` as a subsequence of `s`. `dp[i][j]` = ways to form `t[:j]` from `s[:i]`. Recurrence: `dp[i][j] = dp[i-1][j]` (skip `s[i-1]`), plus `dp[i-1][j-1]` if `s[i-1] == t[j-1]` (use it). For `"rabbbit"` matching `"rabbit"`: three ways depending on which of the three `b`s pair with which `b` in `t`. Final `dp[7][6] = 3`. **O(m × n)** time and space. Direction of the recurrence flows from longer prefixes to shorter, classic 2D DP.',
      viz_anchor: null,
    },
    {
      inputs: ['"babgbag"', '"bag"'],
      expected: '5',
      explanation_md:
        'A case with overlapping subsequences. The 5 distinct ways to read `"bag"` as a subsequence of `"babgbag"`: indices `(0,1,2)`, `(0,1,6)`, `(0,4,6)`, `(0,5,6)`... actually pick any `b` from positions {0,2,5}, any `a` from {1,4} that comes after, any `g` from {3,6} that comes after. The DP counts these without enumerating. Brute force would be **O(3^n)** subset enumeration; DP is **O(m × n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '""'],
      expected: '1',
      explanation_md:
        'The empty-target edge case. The empty string is a subsequence of any string in exactly one way (pick nothing). Base case: `dp[i][0] = 1` for all `i`. Return `dp[3][0] = 1`. Proves the seeding is critical — without `dp[i][0] = 1`, every count downstream would be `0`. A brittle implementation that initializes `dp` to all zeros and forgets the empty-target base case would return `0`.',
      viz_anchor: null,
    },
  ],

  'interleaving-string': [
    {
      inputs: ['"aabcc"', '"dbbca"', '"aadbbcbcac"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. `dp[i][j]` = can `s1[:i] + s2[:j]` interleave to form `s3[:i+j]`. Recurrence: `dp[i][j] = (dp[i-1][j] && s1[i-1] == s3[i+j-1]) || (dp[i][j-1] && s2[j-1] == s3[i+j-1])`. First row (i=0): match `s2` against the prefix of `s3`. First col (j=0): match `s1`. The 2D table fills until `dp[5][5] = true`. Return `true`. **O(m × n)** time and space; the naive backtracking is **O(2^(m+n))**.',
      viz_anchor: null,
    },
    {
      inputs: ['"aabcc"', '"dbbca"', '"aadbbbaccc"'],
      expected: 'false',
      explanation_md:
        'The same `s1` and `s2` against a slightly different `s3`. The DP fills through but cannot reach `dp[5][5] = true` — at some cell both predecessors fail (neither last char matches). Return `false`. Proves the algorithm correctly rejects strings that "look close" but cannot actually be formed by interleaving. A greedy "always take the next matching char" would fail because the choice at each step affects future feasibility.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '""', '""'],
      expected: 'true',
      explanation_md:
        'The triple-empty edge case. Interleaving two empty strings yields an empty string. `dp[0][0] = true` by definition. Return `true`. Proves the base case is essential — without `dp[0][0] = true`, the entire table would be `false` and even the trivial case would fail. A brittle implementation that requires `s3` non-empty would return `false` here.',
      viz_anchor: null,
    },
  ],

  'regular-expression-matching': [
    {
      inputs: ['"aa"', '"a*"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. `dp[i][j]` = does `s[:i]` match `p[:j]`. For `p[j-1] == \'*\'`: either match zero of preceding (`dp[i][j-2]`) or match one+ (`dp[i-1][j]` if `s[i-1]` matches `p[j-2]`). For a literal/`.`: `dp[i][j] = dp[i-1][j-1] && (s[i-1] matches p[j-1])`. For `"aa"` × `"a*"`: `a*` matches zero `a`s, one `a`, or two `a`s — pick two. `dp[2][2] = true`. Return `true`. **O(m × n)** time and space; brute backtracking is exponential.',
      viz_anchor: null,
    },
    {
      inputs: ['"mississippi"', '"mis*is*p*."'],
      expected: 'false',
      explanation_md:
        'A subtle case. Pattern: `m`, `i`, `s*`, `i`, `s*`, `p*`, `.`. Walks `"mississippi"`: `m` `i` `ss` `i` `ss` (no `p` to consume yet) `i` `p` `p` `i` — but the pattern requires `p*` then `.`, and after consuming `i, p, p` we need exactly one more char (`.`) but `i` remains unmatched. The DP catches this because `dp[11][len(p)]` evaluates to `false`. Proves the algorithm correctly handles `*` followed by literal/`.` interactions that greedy matching gets wrong.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '"a*"'],
      expected: 'true',
      explanation_md:
        'The empty-string case. `a*` can match zero `a`s. Base case `dp[0][0] = true`. For `p = "a*"`: `dp[0][2] = dp[0][0] = true` via the "match zero" branch. Return `true`. Proves the `*`-handling correctly considers the zero-match option even on empty input. A brittle implementation that requires at least one `a` to match `a*` would return `false` here.',
      viz_anchor: null,
    },
  ],

  'wildcard-matching': [
    {
      inputs: ['"aa"', '"a"'],
      expected: 'false',
      explanation_md:
        'A clear-mismatch case. `p = "a"` matches exactly one `a`. `s = "aa"` has two. `dp[2][1] = false`. Return `false`. Proves the algorithm correctly rejects when pattern is too short to cover the string. The standard `dp[i][j] = dp[i-1][j-1] && s[i-1] == p[j-1]` recurrence for literals enforces length matching naturally — no way to "stretch" a literal without `*` or `?`.',
      viz_anchor: null,
    },
    {
      inputs: ['"adceb"', '"*a*b"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. `*` matches any sequence (including empty). `dp[i][j]` recurrence for `p[j-1] == \'*\'`: `dp[i][j] = dp[i-1][j] || dp[i][j-1]` (match one more char OR match empty). For `"adceb"` × `"*a*b"`: leading `*` matches empty, `a` matches `a`, middle `*` matches `dce`, final `b` matches `b`. `dp[5][4] = true`. Return `true`. **O(m × n)** time and space. The `?` rule is `dp[i][j] = dp[i-1][j-1]` (any single char).',
      viz_anchor: null,
    },
    {
      inputs: ['"cb"', '"?a"'],
      expected: 'false',
      explanation_md:
        'A `?`-rule case. `?` matches exactly one char. `?a` matches `ca` or `xa` or any `*a` (single char + `a`). `cb` has `c` then `b` — the final `b` does not match the literal `a`. `dp[2][2] = false`. Return `false`. Proves `?` is "any single char" not "any sequence" — a brittle implementation that conflates `?` with `*` would falsely accept this.',
      viz_anchor: null,
    },
  ],

  'decode-ways': [
    {
      inputs: ['"12"'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Map `1..26` to `A..Z`. Count distinct decodings. `dp[i]` = ways to decode `s[:i]`. Recurrence: `dp[i] += dp[i-1]` if `s[i-1] != \'0\'`; `dp[i] += dp[i-2]` if the two-digit `s[i-2..i-1]` is in `[10, 26]`. Trace: `dp = [1, 1, 2]`. The 2 decodings: `"AB"` (1, 2) and `"L"` (12). Return `2`. **O(n)** time, **O(1)** space with two rolling scalars.',
      viz_anchor: null,
    },
    {
      inputs: ['"226"'],
      expected: '3',
      explanation_md:
        'A case with branching. Decodings: `"BBF"` (2,2,6), `"VF"` (22,6), `"BZ"` (2,26). Trace: `dp = [1, 1, 2, 3]`. The DP merges the two predecessor branches at each step. Brute-force recursion would be exponential because each two-digit candidate spawns a sub-tree — DP collapses these via memo. Proves the algorithm correctly handles multi-branch cases.',
      viz_anchor: null,
    },
    {
      inputs: ['"0"'],
      expected: '0',
      explanation_md:
        'The leading-zero edge case. `0` does not map to any letter, and no encoding starts with it. `dp[1] = 0` because `s[0] == \'0\'` blocks the one-digit branch and there\'s no two-digit prefix yet. Return `0`. Proves the algorithm correctly handles invalid inputs by returning `0`, not erroring. A brittle implementation that always counts `dp[i-1]` would return `1` here, wrong.',
      viz_anchor: null,
    },
  ],

  'decode-ways-ii': [
    {
      inputs: ['"*"'],
      expected: '9',
      explanation_md:
        'The canonical LC example. `*` represents any of `1..9` (not 0). For a lone `*`: 9 single-digit decodings. `dp[1] = 9`. Return `9`. Modular arithmetic with `MOD = 1e9 + 7` (no overflow needed here, but for longer inputs the count can explode). **O(n)** time. Proves the algorithm correctly enumerates wildcard expansions for the one-char case.',
      viz_anchor: null,
    },
    {
      inputs: ['"1*"'],
      expected: '18',
      explanation_md:
        'A case combining literal and wildcard. Single-digit branch: `dp[2] += dp[1] * 9` (1 + any of `1..9`). Two-digit branch: `1*` is `1[1..9]` — all 9 are in `[10..26]`, so `dp[2] += dp[0] * 9`. Total `9 + 9 = 18`. Return `18`. Proves the wildcard logic correctly considers both digit positions and constrains the two-digit interpretation to the valid `[10..26]` range.',
      viz_anchor: null,
    },
    {
      inputs: ['"**"'],
      expected: '96',
      explanation_md:
        'The fully wildcard case. Single-digit: `9 × 9 = 81` (each `*` independently `1..9`). Two-digit: `**` must form a number in `[11..26]`. Wildcards combine as `1*` (9 values: 11..19) + `2*` with `* in 1..6` (6 values: 21..26) = 15. Total `81 + 15 = 96`. Return `96`. Proves the algorithm correctly enumerates all wildcard expansions while respecting the encoding range.',
      viz_anchor: null,
    },
  ],

  'unique-paths': [
    {
      inputs: ['3', '7'],
      expected: '28',
      explanation_md:
        'The canonical LC example. Robot moves only right or down on an `m × n` grid. `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. First rows of the table for 3×7: row 0: `[1,1,1,1,1,1,1]`, row 1: `[1,2,3,4,5,6,7]`, row 2: `[1,3,6,10,15,21,28]`. Return `28`. Closed-form: `C(m+n-2, m-1) = C(8, 2) = 28`. **O(m × n)** DP, **O(n)** with a rolling row. The combinatorial identity exists because every path has exactly `m-1` downs and `n-1` rights.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '2'],
      expected: '3',
      explanation_md:
        'A small case with a clean enumeration. 3×2 grid: paths are `DDR`, `DRD`, `RDD` — three total. DP trace: row 0 `[1,1]`, row 1 `[1,2]`, row 2 `[1,3]`. Return `dp[2][1] = 3`. Matches `C(3, 1) = 3`. Proves the recurrence reduces correctly for small dimensions.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '1',
      explanation_md:
        'The smallest grid. Single cell — the robot starts at the destination. Zero moves, one (trivial) path. `dp[0][0] = 1`. Return `1`. Proves the base case `dp[0][0] = 1` correctly represents the empty-path. A brittle implementation that requires at least one move would return `0` here.',
      viz_anchor: null,
    },
  ],

  'unique-paths-ii': [
    {
      inputs: ['[[0,0,0],[0,1,0],[0,0,0]]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. `1` = obstacle. Modify the recurrence: if cell is obstacle, `dp[i][j] = 0`; else `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. Trace: row 0 `[1,1,1]`, row 1 `[1,0,1]` (middle blocked), row 2 `[1,1,2]`. Return `dp[2][2] = 2`. The two paths: down-down-right-right (via left col) or right-right-down-down (via top row). The center is fully blocked. **O(m × n)** time and space.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '0',
      explanation_md:
        'The "start blocked" edge case. The only cell is an obstacle. Zero paths. The base case becomes `dp[0][0] = grid[0][0] == 0 ? 1 : 0`. Return `0`. Proves the algorithm correctly handles the case where the start itself is blocked. A brittle implementation that always seeds `dp[0][0] = 1` would falsely return `1` here.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[0,0]]'],
      expected: '1',
      explanation_md:
        'A case where one direction is fully blocked. Top-right `1` blocks the rightmost cell of row 0, forcing the path through the left column. Trace: row 0 `[1, 0]`, row 1 `[1, 1]`. Return `dp[1][1] = 1`. Proves the obstacle correctly zeros out a cell, which then propagates as `0` contribution to downstream cells without specially marking them.',
      viz_anchor: null,
    },
  ],

  'minimum-path-sum': [
    {
      inputs: ['[[1,3,1],[1,5,1],[4,2,1]]'],
      expected: '7',
      explanation_md:
        'The canonical LC example. `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`. First rows of the table: row 0 (cumulative): `[1, 4, 5]`. Row 1: `[2, 7, 6]`. Row 2: `[6, 8, 7]`. Return `dp[2][2] = 7`. The min-cost path is `1 → 3 → 1 → 1 → 1`. **O(m × n)** time and space; **O(n)** with a rolling row. The greedy "always take smaller neighbor" can be tricked into locally optimal but globally bad paths.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6]]'],
      expected: '12',
      explanation_md:
        'A 2×3 case. Two candidate paths: `1+2+3+6 = 12` (right then down) and `1+4+5+6 = 16` (down then right). DP picks `12`. Trace: row 0 `[1, 3, 6]`, row 1 `[5, 8, 12]`. Return `12`. Proves the algorithm correctly chooses between the two macro paths by considering local subproblems — without comparing the full paths it picks the cheaper combination at each cell.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '1',
      explanation_md:
        'The single-cell case. The path is just the start. Return `grid[0][0] = 1`. Proves the algorithm correctly handles the 1×1 base case without recurrence — neither `dp[i-1][j]` nor `dp[i][j-1]` is valid here, so the seed value alone must be returned.',
      viz_anchor: null,
    },
  ],

  'triangle': [
    {
      inputs: ['[[2],[3,4],[6,5,7],[4,1,8,3]]'],
      expected: '11',
      explanation_md:
        'The canonical LC example. **Bottom-up** DP: rewrite each row in place using the row below. `dp[j] = triangle[i][j] + min(dp[j], dp[j+1])`. Start with the last row as `dp`. For this triangle: last row `[4,1,8,3]`. After row 2: `dp = [7, 6, 10]` (6+1, 5+1, 7+3). After row 1: `dp = [9, 10]` (3+6, 4+6). After row 0: `dp = [11]` (2+9). Return `11`. The min path is `2 → 3 → 5 → 1`. **O(n²)** time, **O(n)** space — beats top-down which needs a 2D table.',
      viz_anchor: null,
    },
    {
      inputs: ['[[-10]]'],
      expected: '-10',
      explanation_md:
        'The single-cell triangle. Only one path: the root itself. Return `-10`. Proves the algorithm correctly handles `n = 1` — `dp` starts as the last (and only) row, the row-merging loop never executes, return `dp[0]`. Negative values are also handled correctly because `min` propagates them as-is.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1],[2,3]]'],
      expected: '3',
      explanation_md:
        'The smallest non-trivial triangle. Two paths: `1+2 = 3` and `1+3 = 4`. DP picks `3`. Trace: start `dp = [2, 3]`. After row 0: `dp = [1 + min(2,3)] = [3]`. Return `3`. Proves the bottom-up approach correctly aggregates two children into one parent — the foundation that scales to any triangle depth.',
      viz_anchor: null,
    },
  ],

  'maximal-square': [
    {
      inputs: ['[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. `dp[i][j]` = side of the largest all-1 square ending at `(i, j)`. Recurrence (when `matrix[i][j] == 1`): `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`. Bottleneck of the three neighbors — if any is `0`, the square cannot grow. Track the running max. For this grid: a 2×2 all-1 square exists at rows 1-2, cols 2-3. Max side `2`, area `4`. Return `4`. **O(m × n)** time and space; **O(n)** with a rolling row.',
      viz_anchor: null,
    },
    {
      inputs: ['[["0","1"],["1","0"]]'],
      expected: '1',
      explanation_md:
        'A 2×2 grid with no possible 2×2 all-1 square. Max square is a single `1` cell. `dp` has at most `1` anywhere. Return `1`. Proves the algorithm correctly returns side 1 (area 1) when no expansion is possible. A brittle implementation that only counts squares of side ≥ 2 would return `0` here.',
      viz_anchor: null,
    },
    {
      inputs: ['[["0"]]'],
      expected: '0',
      explanation_md:
        'The single-zero-cell case. No `1` anywhere, no square. `dp[0][0] = 0`, max stays `0`. Return `0`. Proves the algorithm correctly handles all-zero grids without errors. A brittle implementation that always returns at least `1` (assuming the cell value itself) would fail here.',
      viz_anchor: null,
    },
  ],

  'maximal-rectangle': [
    {
      inputs: ['[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. Reduce to Largest Rectangle in Histogram: for each row, treat it as the base of a histogram where bar `j` = consecutive `1`s ending at this row. Row by row, update `heights[j] += 1` if `matrix[i][j] == 1` else `0`, then call max-area-histogram. For this grid, row 2 has heights `[3, 1, 3, 2, 2]` — the largest rectangle is the central 3×2 region with area `6`. Return `6`. **O(m × n)** time using monotonic stack per row.',
      viz_anchor: null,
    },
    {
      inputs: ['[["0"]]'],
      expected: '0',
      explanation_md:
        'The single-zero case. No rectangle of `1`s. Heights array stays `[0]`. Max histogram area is `0`. Return `0`. Proves the algorithm handles all-zero grids cleanly. A brittle implementation that assumes at least one `1` to initialize `max_area` would still work because `max_area` is typically seeded at `0`.',
      viz_anchor: null,
    },
    {
      inputs: ['[["1"]]'],
      expected: '1',
      explanation_md:
        'The single-one case. Single cell of value `1`. Heights `= [1]`. Max histogram area `= 1`. Return `1`. Proves the algorithm correctly handles the smallest positive case. The histogram subroutine must include a trailing sentinel (e.g. height `0` appended) so the stack flushes — otherwise the lone `1` might never be popped and counted.',
      viz_anchor: null,
    },
  ],

  'palindrome-partitioning-ii': [
    {
      inputs: ['"aab"'],
      expected: '1',
      explanation_md:
        'The canonical LC example. Min cuts to partition `s` into palindromes. Precompute `isPal[i][j]` table via expand-around-center or 2D DP. Then `cuts[i]` = min cuts for `s[:i+1]`: `cuts[i] = min(cuts[j-1] + 1)` over all `j` where `s[j..i]` is palindrome. For `"aab"`: `"aa"` is palindrome → cut once between `"aa"` and `"b"`. Return `1`. **O(n²)** time and space — palindrome precompute is the bottleneck.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '0',
      explanation_md:
        'The single-char case. A single char is itself a palindrome. Zero cuts. Return `0`. Proves the base case `cuts[0] = 0` correctly handles `n = 1`. A brittle implementation that always cuts at least once between adjacent chars would return `0` for `n = 1` only by luck because there are no adjacent chars.',
      viz_anchor: null,
    },
    {
      inputs: ['"ab"'],
      expected: '1',
      explanation_md:
        'A two-char non-palindrome. `"ab"` cannot be a single palindrome, so split into `["a", "b"]` with 1 cut. Return `1`. Proves the algorithm correctly identifies that splitting is required when the full string isn\'t a palindrome. The minimum-cuts answer is `len(s) - 1` in the absolute worst case (each char its own segment), but typically far smaller.',
      viz_anchor: null,
    },
  ],

  'burst-balloons': [
    {
      inputs: ['[3,1,5,8]'],
      expected: '167',
      explanation_md:
        'The canonical LC example. Insert virtual `1`s at both ends: `[1, 3, 1, 5, 8, 1]`. `dp[l][r]` = max coins from bursting balloons strictly inside `(l, r)`. Pick `k` (the **last** balloon to burst inside this range): `dp[l][r] = max(dp[l][k] + nums[l]*nums[k]*nums[r] + dp[k][r])`. The "last-burst" framing is the trick — once `k` is the last, its neighbors at burst time are exactly `nums[l]` and `nums[r]`. Final answer: `dp[0][5] = 167`. **O(n³)** time, **O(n²)** space — the canonical "interval DP" problem.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5]'],
      expected: '10',
      explanation_md:
        'A two-balloon case. With virtual borders: `[1, 1, 5, 1]`. Burst order matters: burst `5` first (neighbors `1, 1` give `5`), then `1` (neighbors `1, 1` give `1`) → `6`. Or burst `1` first (neighbors `1, 5` give `5`), then `5` (neighbors `1, 1` give `5`) → `10`. DP picks the optimal `10`. Proves the algorithm correctly explores order — a greedy "burst the largest first" gives `5+1=6`, wrong by spec.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-input edge case. No balloons, no coins. Return `0` immediately. Proves the algorithm handles the empty array cleanly. A brittle implementation that always pads with two `1`s and runs DP on `[1, 1]` would still return `0` because the interval `(0, 1)` has no inner indices.',
      viz_anchor: null,
    },
  ],

  'best-time-to-buy-and-sell-stock-with-cooldown': [
    {
      inputs: ['[1,2,3,0,2]'],
      expected: '3',
      explanation_md:
        'The canonical LC example. State machine: `hold[i]` (own stock), `sold[i]` (just sold, must cooldown), `rest[i]` (not holding, free to buy). Transitions: `hold = max(hold_prev, rest_prev - price)`, `sold = hold_prev + price`, `rest = max(rest_prev, sold_prev)`. Trace `prices = [1,2,3,0,2]`: optimal is buy day 0 ($1), sell day 2 ($3), cooldown day 3, buy day 3 — wait, must cooldown — so buy day... actually buy day 0 sell day 1, cooldown 2, buy 3 sell 4: `(2-1) + (2-0) = 3`. Return `3`. **O(n)** time, **O(1)** space with three rolling scalars.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '0',
      explanation_md:
        'The single-day edge case. Cannot complete a buy + sell in one day (need at least 2). Return `0`. Proves the algorithm handles `n = 1` without producing a negative or nonsense profit. The state machine starts and ends with `rest = 0` because no transaction occurs.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-prices edge case. No prices, no trades. Return `0`. Proves the algorithm handles empty input by returning the initial `rest = 0`. A brittle implementation that always reads `prices[0]` to initialize `hold` would crash on empty input.',
      viz_anchor: null,
    },
  ],

  'best-time-to-buy-and-sell-stock-with-transaction-fee': [
    {
      inputs: ['[1,3,2,8,4,9]', '2'],
      expected: '8',
      explanation_md:
        'The canonical LC example. Two states: `cash` (no stock), `hold` (holding). Transitions: `cash = max(cash, hold + price - fee)`, `hold = max(hold, cash - price)`. Fee applied on sell. Trace: buy day 0 ($1), sell day 3 ($8): `8 - 1 - 2 = 5`. Buy day 4 ($4), sell day 5 ($9): `9 - 4 - 2 = 3`. Total `8`. Return `8`. **O(n)** time, **O(1)** space. Without the fee, the optimal would chase every uptick — the fee forces consolidation into fewer, larger trades.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,7,5,10,3]', '3'],
      expected: '6',
      explanation_md:
        'A case where the fee eats most upticks. Optimal: buy day 0 ($1), sell day 4 ($10): `10 - 1 - 3 = 6`. The dip on day 3 ($5) is tempting (sell at 7, rebuy at 5, sell at 10 → `(7-1-3) + (10-5-3) = 3 + 2 = 5`) but loses to holding through. DP picks the single-trade optimum. Proves the algorithm correctly weighs "more trades" vs "fewer with higher fees absorbed".',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '2'],
      expected: '0',
      explanation_md:
        'A case where the fee kills all profit. Buy day 0 ($1), sell day 1 ($2): `2 - 1 - 2 = -1`. Don\'t trade. Return `0`. Proves the algorithm correctly chooses no-trade when the fee exceeds the profit. The `cash` state retains `0` (the no-trade baseline) and is taken over the loss-making sell.',
      viz_anchor: null,
    },
  ],

  'best-time-to-buy-and-sell-stock-iii': [
    {
      inputs: ['[3,3,5,0,0,3,1,4]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. At most 2 transactions. Four-state DP: `buy1, sell1, buy2, sell2` — best profit after each event. Transitions: `buy1 = max(buy1, -price)`, `sell1 = max(sell1, buy1 + price)`, `buy2 = max(buy2, sell1 - price)`, `sell2 = max(sell2, buy2 + price)`. For prices `[3,3,5,0,0,3,1,4]`: buy at 0 (day 3), sell at 3 (day 5), buy at 1 (day 6), sell at 4 (day 7) → `3 + 3 = 6`. Return `6`. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '4',
      explanation_md:
        'A monotonically increasing case. One transaction suffices to capture all profit (buy day 0, sell day 4). Profit `5 - 1 = 4`. The second-transaction state stays inactive. Return `4`. Proves the algorithm correctly degrades to single-transaction when no second buy/sell improves things. The four states are independent maxima — they don\'t force two transactions.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,6,4,3,1]'],
      expected: '0',
      explanation_md:
        'A monotonically decreasing case. No profitable trade exists. All `sell` states stay `0`. Return `0`. Proves the algorithm correctly returns `0` rather than a negative profit — the `sell_i = max(sell_i, buy_i + price)` clause ensures non-negativity because `sell_i` starts at `0` and is never reduced.',
      viz_anchor: null,
    },
  ],

  'best-time-to-buy-and-sell-stock-iv': [
    {
      inputs: ['2', '[2,4,1]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. At most `k = 2` transactions. Generalized state machine: `buy[i]` and `sell[i]` arrays of length `k+1`. Transitions: `buy[j] = max(buy[j], sell[j-1] - price)`, `sell[j] = max(sell[j], buy[j] + price)`. For prices `[2,4,1]`: buy day 0 ($2), sell day 1 ($4) — profit `2`. No second trade available before day 2. Return `2`. **O(n × k)** time, **O(k)** space. Reduces to "infinite transactions" greedy when `k ≥ n/2`.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '[3,2,6,5,0,3]'],
      expected: '7',
      explanation_md:
        'A case requiring exactly 2 transactions. Optimal: buy day 1 ($2), sell day 2 ($6) → `4`. Buy day 4 ($0), sell day 5 ($3) → `3`. Total `7`. The state machine\'s `buy[2]` correctly accounts for the cost of the second entry by subtracting from `sell[1]`. Proves the algorithm chains transactions properly through the `sell[j-1]` predecessor link.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '[1,3]'],
      expected: '0',
      explanation_md:
        'The `k = 0` edge case. No transactions allowed. Return `0` immediately. Proves the algorithm handles the trivial-bound case. A brittle implementation that always allows at least one transaction would return `2` here, violating the constraint.',
      viz_anchor: null,
    },
  ],
};

async function main() {
  const ids = Object.keys(PAYLOAD);
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems').select('id').in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const present = new Set(rows.map(r => r.id));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    if (!present.has(id)) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    if (!Array.isArray(samples) || samples.length !== 3) {
      console.log(`ERR    ${id}  (payload length ${samples?.length} != 3)`);
      failed++;
      continue;
    }
    let shapeOk = true;
    for (const s of samples) {
      if (!Array.isArray(s.inputs) || typeof s.expected !== 'string'
          || typeof s.explanation_md !== 'string'
          || (s.viz_anchor !== null && typeof s.viz_anchor !== 'string')) {
        shapeOk = false; break;
      }
    }
    if (!shapeOk) {
      console.log(`ERR    ${id}  (sample shape invalid)`);
      failed++;
      continue;
    }
    const { error } = await sb.from('PGcode_problems')
      .update({ explained_samples: samples })
      .eq('id', id);
    if (error) {
      console.log(`ERR    ${id}  ${error.message}`);
      failed++;
    } else {
      console.log(`✓ ${id}`);
      ok++;
    }
  }
  console.log(`\nDone. ok=${ok}  skipped=${skipped}  failed=${failed}  total=${ids.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
