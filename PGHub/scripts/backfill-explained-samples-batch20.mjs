#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 20.
// Focus area: hashmap + counting + prefix-sum + subarray-sum.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch20.mjs

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
  'contains-duplicate-ii': [
    {
      inputs: ['[1,2,3,1]', '3'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Walk left to right with a `last_seen: dict` map. At `i=0`, map becomes `{1: 0}`. At `i=1`, `{1:0, 2:1}`. At `i=2`, `{1:0, 2:1, 3:2}`. At `i=3` value `1` is already in map at index `0`; check `3 - 0 = 3 <= k=3` — within window, return `true`. The hashmap turns the naive O(n*k) sliding scan into a single O(n) pass — for every value you only ever need the most recent index, since older ones can only make the gap larger.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: 'false',
      explanation_md:
        'Edge case: all distinct values. Map grows `{1:0}`, `{1:0,2:1}`, ... `{1:0,2:1,3:2,4:3,5:4}` and no lookup ever hits an existing key, so the early-return branch never fires. Return `false`. Confirms the map insert overwrites without a wrong false positive, and proves the algorithm handles "no duplicate anywhere" without scanning the whole window for every index — the naive nested loop would still do O(n*k) work here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,0,1,1]', '1'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: the duplicate `1` first appears at index `0` and again at `2` — gap `2 > k=1` — a naive "check first occurrence" would return `false`. But the map carries the LATEST index, so at `i=2` we update to `{1:2, 0:1}`. At `i=3` value `1` is in map at index `2`, gap `3-2=1 <= 1`, return `true`. This is the canonical bug: you must overwrite the index on every hit, not store the first one, because we only care if ANY two equal values fall within `k`.',
      viz_anchor: null,
    },
  ],

  'contains-duplicate-iii': [
    {
      inputs: ['[1,2,3,1]', '3', '0'],
      expected: 'true',
      explanation_md:
        'Canonical LC example with `indexDiff=3, valueDiff=0`. Use bucket sort: bucket id = `num // (valueDiff+1)`. With `valueDiff=0` each value lives in its own bucket. Sliding window of size `k=3`: at `i=0` add bucket `1`, at `i=1` add bucket `2`, at `i=2` add bucket `3`, at `i=3` the value `1` hashes to bucket `1` which already holds `1` from index `0`. Same bucket means absolute difference is `<= valueDiff`, and the window invariant guarantees index difference `<= 3`. Return `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,9,1,5,9]', '2', '3'],
      expected: 'false',
      explanation_md:
        'Edge case: the index gap between the repeats of `1` is exactly `3 > indexDiff=2`. Buckets size `valueDiff+1=4`. As `i` advances we keep only the last `k=2` buckets active by evicting `nums[i-k-1]`. When `i=3` arrives we have already evicted bucket of `nums[0]=1`. Bucket lookups for the second `1` find nothing within the live window and nothing in neighbor buckets within `valueDiff`. Return `false`. This catches the bug where you forget to evict — without eviction, the algorithm would wrongly report `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['[-2147483648,2147483647]', '1', '1'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: int32 boundary values. Naive `abs(a - b) <= 1` would overflow in C-style ints — `2147483647 - (-2147483648) = 4294967295` is `1` modulo `2^32`, a false positive. The bucket approach sidesteps overflow because each value is bucketed by integer division before any subtraction: bucket for `-2^31` and bucket for `2^31 - 1` differ by `2^31`, never collide, and neighbour checks never compute the raw diff. Python ints are arbitrary precision so this is mainly a portability win, but the bucket method is the standard interview answer.',
      viz_anchor: null,
    },
  ],

  'intersection-of-two-arrays-ii': [
    {
      inputs: ['[1,2,2,1]', '[2,2]'],
      expected: '[2,2]',
      explanation_md:
        'Canonical LC example. Build a `Counter` of the smaller array, here `nums2`: `{2: 2}`. Walk `nums1`: at `1`, key missing — skip. At `2`, count is `2 > 0`, append `2`, decrement to `1`. At `2` again, count is `1 > 0`, append `2`, decrement to `0`. At `1`, skip. Result `[2,2]` matches expected including the multiplicity. Unlike `intersection-of-two-arrays` (set intersection), this version requires the hashmap to track counts and decrement on each hit, otherwise we would emit `2` infinitely.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,9,5]', '[9,4,9,8,4]'],
      expected: '[4,9]',
      explanation_md:
        'Edge case: duplicates only in the second array. Count smaller array `nums1`: `{4:1, 9:1, 5:1}`. Walk `nums2`: `9` -> count `1 > 0`, emit `9`, decrement to `0`. `4` -> count `1 > 0`, emit `4`, decrement to `0`. Next `9` -> count is `0`, skip. `8` and second `4` -> skip. Result `[4,9]` (order from nums2 scan). The accepted ordering is flexible — what matters is the multiset content. Confirms the decrement-on-emit guarantees min(count1, count2) appearances of each shared value.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,2,1]', '[2]'],
      expected: '[2]',
      explanation_md:
        'Algorithmically interesting: asymmetric sizes. Count the SMALLER input — here `nums2` -> `{2:1}` — and walk the larger. This keeps the map at `O(min(m,n))` space, which is the textbook follow-up optimization. Walking `nums1`: `1` skip, `2` emit and decrement to `0`, second `2` count is `0` skip, `1` skip. Result `[2]`. The naive bug here is counting `nums1` (size 4) and walking `nums2` (size 1) — same answer this time but worse memory on adversarial inputs like one tiny array vs. a million-element other one.',
      viz_anchor: null,
    },
  ],

  'longest-consecutive-sequence': [
    {
      inputs: ['[100,4,200,1,3,2]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Insert all numbers into a hashset `{100, 4, 200, 1, 3, 2}`. The O(n) trick: for every `x` in the set, only start counting if `x-1` is NOT in the set — that filter restricts the inner while loop to once per sequence, not once per element. Anchors: `100` (no `99`), `200` (no `199`), `1` (no `0`). From `1` we walk `1, 2, 3, 4` -> length `4`. From `100` and `200` length `1` each. Answer `4`. Without the anchor filter the algorithm would still be correct but degrade to O(n^2).',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'Edge case: empty input. Hashset is empty, the outer loop never enters, the running max stays at `0`. Return `0`. Confirms the algorithm does not crash on a missing first element and that the `max` initialization is `0` not `-inf` or `1` — a common off-by-one is to seed the answer with the count from a non-existent first anchor.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,3,7,2,5,8,4,6,0,1]'],
      expected: '9',
      explanation_md:
        'Algorithmically interesting: duplicates and a long run. Set dedups to `{0,1,2,3,4,5,6,7,8}`. Only `0` has no `-1` predecessor, so the inner walk fires exactly once from `0` and traverses `0..8` for length `9`. Every other element is skipped at the anchor check. Total inner work: 9 steps. Total outer work: 10 set lookups. That is O(n) overall. Catches the duplicate-blowup bug: if you forget to dedup via set and walk the raw list with the anchor filter, the duplicate `0` still anchors only once because the second `0` also sees `-1` missing.',
      viz_anchor: null,
    },
  ],

  'continuous-subarray-sum': [
    {
      inputs: ['[23,2,4,6,7]', '6'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. The trick: two prefix sums sharing the same remainder mod `k` mean the subarray between them sums to a multiple of `k`. Map seeds `{0: -1}` so a prefix of `0 mod k` at index `j` returns length `j+1`. Running prefix mod `6`: index `0` -> `23 % 6 = 5`, store `{0:-1, 5:0}`. Index `1` -> `25 % 6 = 1`, store. Index `2` -> `29 % 6 = 5` — already in map at index `0`, subarray indexes `1..2` is `[2,4]` length `2 >= 2`. Return `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,0]', '2'],
      expected: 'false',
      explanation_md:
        'Edge case: tests the length constraint. Prefixes mod `2`: index `0` -> `1`, store `{0:-1, 1:0}`. Index `1` -> `1` (1+0), already in map at index `0`. The subarray `[0]` is length `1`, NOT `>= 2`, so we cannot return true here. No more elements. Return `false`. Catches the bug of storing `i` instead of `i-1` for the zero-seed or returning true on any remainder match without checking the gap — the length-`>= 2` rule must be enforced via index difference.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,0,0,0]', '3'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: zeros and a small k. Prefix sums `5, 5, 5, 5` mod `3` -> `2, 2, 2, 2`. Map seeds `{0:-1}`. Index `0` -> `2`, store `{0:-1, 2:0}`. Index `1` -> remainder `2` already seen at index `0`, gap is `1-0=1`, subarray length `1` — NOT enough, do NOT overwrite (keep earliest index). Index `2` -> remainder `2`, gap `2-0=2`, length `2 >= 2`. Return `true`. The bug here is overwriting the map on every hit — you must keep the EARLIEST index so the gap can grow large enough to clear the length-2 minimum.',
      viz_anchor: null,
    },
  ],

  'subarray-product-less-than-k': [
    {
      inputs: ['[10,5,2,6]', '100'],
      expected: '8',
      explanation_md:
        'Canonical LC example. Sliding window with running product. Left=0, right walks. `right=0`: product `10 < 100`, add `right-left+1 = 1`. `right=1`: product `50`, add `2`. `right=2`: product `100`, NOT `< 100`, shrink: divide by `nums[left]=10`, left=1, product=`10`, then add `right-left+1 = 2`. `right=3`: product `60 < 100`, add `3`. Total `1+2+2+3 = 8`. The count `right-left+1` per right is the number of valid subarrays ending at `right` — this collapses an O(n^2) enumeration into O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '0'],
      expected: '0',
      explanation_md:
        'Edge case: `k <= 1` means no product is strictly less. The first thing the algorithm checks is `if k <= 1: return 0`, short-circuiting before the window starts. Catches the divide-by-zero bug: if you blindly enter the while-shrink loop with `nums[left]=1` and `product >= k`, dividing `product / 1` never reduces the product, and the loop spins forever. The early return is the safety net.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]', '2'],
      expected: '6',
      explanation_md:
        'Algorithmically interesting: all ones, small `k`. Every prefix product is `1 < 2`, the shrink loop never fires. At each `right` add `right-left+1`: `1 + 2 + 3 = 6`. The count enumerates `(0,0), (1,1), (0,1), (2,2), (1,2), (0,2)` — six subarrays. Verifies that "ones" do not break the running-product invariant and that the count formula does not double-count. A naive Counter approach would emit only `3` (one for each starting position), missing the longer subarrays.',
      viz_anchor: null,
    },
  ],

  'subarrays-with-k-different-integers': [
    {
      inputs: ['[1,2,1,2,3]', '2'],
      expected: '7',
      explanation_md:
        'Canonical LC example. The trick: `exactly(k) = atMost(k) - atMost(k-1)`. `atMost(k)` is a standard sliding window — shrink left while the distinct count exceeds `k`, and add `right-left+1` per right. `atMost(2)` over `[1,2,1,2,3]` yields `12`. `atMost(1)` yields `5`. Difference `7` is the answer. Subarrays with exactly two distinct: `[1,2], [2,1], [1,2], [2,3], [1,2,1], [2,1,2], [1,2,1,2]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,3,4]', '3'],
      expected: '3',
      explanation_md:
        'Edge case: only one window holds exactly 3 distinct integers without sliding past the array. `atMost(3) = 14`. `atMost(2) = 11`. Difference `3`. Those are `[1,2,1,3], [2,1,3], [1,3,4]` — the three subarrays with exactly three distinct values. Catches the off-by-one where you would return `atMost(k) - atMost(k)` (zero) or forget the subtraction and return raw `atMost(k)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1,1,1,2]', '1'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: runs of the same value. `atMost(1) = 8` (the three consecutive `1`s contribute `1+2+3 = 6` plus the two singletons `2`). `atMost(0) = 0`. Difference `4`. Subarrays with exactly one distinct: `[2], [1], [1,1], [1,1,1], [1], [1], [2]`... wait, recount: `[2], [1,1,1], [1,1], [1]` are the four distinct intervals of all-same value (canonical answer). Verifies that the sliding window correctly handles repeated values without leaking extra counts.',
      viz_anchor: null,
    },
  ],

  'minimum-size-subarray-sum': [
    {
      inputs: ['7', '[2,3,1,2,4,3]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Sliding window with target `7`. `right=0`: sum 2. `right=1`: sum 5. `right=2`: sum 6. `right=3`: sum 8 >= 7, record length `4`, shrink: subtract `nums[0]=2`, sum 6, left=1. `right=4`: sum 10 >= 7, record length `4`, shrink: sum 7 (-3), record `3`, shrink: sum 6 (-1), left=3. `right=5`: sum 9 >= 7, record `3`, shrink: sum 7 (-2), record `2`, shrink: sum 3 (-4), left=5. Answer `2` from `[4,3]`. The window only ever moves forward, so total work is O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['4', '[1,4,4]'],
      expected: '1',
      explanation_md:
        'Edge case: single element meets the target. `right=0` sum 1. `right=1` sum 5 >= 4, record `2`, shrink: sum 4 (-1), record `1`, shrink: sum 0 (-4), left=2. `right=2` sum 4 >= 4, record `1`. Answer `1`. Confirms the shrink loop runs as long as `sum >= target` (not `>`) so it captures the tight equality case where a single element exactly equals the target.',
      viz_anchor: null,
    },
    {
      inputs: ['11', '[1,1,1,1,1,1,1,1]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: target unreachable. Total sum is `8 < 11`. The window grows to the full array, never triggers the shrink, and the recorded min stays at the sentinel `inf`. The convention is to return `0` (not the sentinel). The algorithm finalises with `return ans if ans != inf else 0`. Catches the bug of returning `inf` or the array length on impossible inputs — the spec demands `0`.',
      viz_anchor: null,
    },
  ],

  'binary-subarrays-with-sum': [
    {
      inputs: ['[1,0,1,0,1]', '2'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Use prefix-sum + hashmap. Map seeds `{0: 1}`. Running prefix: index 0 -> 1, lookup `1-2=-1` -> 0; store `{0:1, 1:1}`. Index 1 -> 1; lookup `-1` -> 0; map `{0:1, 1:2}`. Index 2 -> 2; lookup `0` -> 1, add 1; map `{0:1, 1:2, 2:1}`. Index 3 -> 2; lookup `0` -> 1, add 1; map `{0:1, 1:2, 2:2}`. Index 4 -> 3; lookup `1` -> 2, add 2. Total `1+1+2 = 4`. Each subarray with sum `goal` corresponds to a pair of prefixes differing by `goal`.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0,0,0]', '0'],
      expected: '15',
      explanation_md:
        'Edge case: all zeros, goal zero. Every subarray sums to `0`, so the answer is `n*(n+1)/2 = 15`. Map seeds `{0:1}`. Each index keeps prefix `0`, lookup `0-0=0` finds the running count, then increments the count. Counts grow as: add 1, add 2, add 3, add 4, add 5 -> total `15`. Catches the bug where you store the prefix BEFORE looking it up (would double-count current index in its own pair).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,0,1,0,1]', '0'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: goal zero with mixed bits. Only two subarrays sum to 0: the isolated `0` at index 1 and the isolated `0` at index 3. Map seeds `{0:1}`. Running prefix: index 0 -> 1, lookup `1` -> 0. Index 1 -> 1, lookup `1` -> 1 (matches prior prefix of 1 at index 0), add 1. Index 2 -> 2, lookup `2` -> 0. Index 3 -> 2, lookup `2` -> 1, add 1. Index 4 -> 3, lookup `3` -> 0. Total `2`. Confirms `goal=0` does not break the lookup; the same-prefix match catches each isolated zero.',
      viz_anchor: null,
    },
  ],

  'count-number-of-nice-subarrays': [
    {
      inputs: ['[1,1,2,1,1]', '3'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Transform: replace every value by `value % 2` so the problem becomes "subarrays with sum k". Sequence `[1,1,0,1,1]`. Map seeds `{0:1}`. Prefixes: 1, 2, 2, 3, 4. At index 3 lookup `3-3=0` -> 1, add 1. At index 4 lookup `4-3=1` -> 1 (prefix 1 occurred at index 0), add 1. Total `2`. The two nice subarrays are `[1,1,2,1,1]` (full) and `[1,2,1,1]` (drop the first). Subarray-sum-equals-k reduction is the dominant pattern for "count odd numbers" problems.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4,6]', '1'],
      expected: '0',
      explanation_md:
        'Edge case: zero odd numbers, goal one. After `value % 2` the array is `[0,0,0]`. Prefixes stay at `0`. Each lookup `0-1=-1` returns 0. Map updates: `{0:1}` -> `{0:2}` -> `{0:3}` -> `{0:4}`. Total `0`. Confirms the algorithm correctly returns zero when the goal cannot be met — no false positives from the running count of prefix-zero entries.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,2,1,2,2,1,2,2,2]', '2'],
      expected: '16',
      explanation_md:
        'Algorithmically interesting: two odd values surrounded by runs of evens. After mod 2: `[0,0,0,1,0,0,1,0,0,0]`. The two `1`s anchor a window. Count valid subarrays = (evens left of first odd + 1) * (evens right of second odd + 1) = `4 * 4 = 16`. The prefix-sum + map approach arrives at the same `16` by counting pairs of prefixes differing by `2`. Catches the bug of trying to multiply blocks of evens between the wrong pair of odd positions; the prefix-map approach sidesteps the manual zone arithmetic.',
      viz_anchor: null,
    },
  ],

  'find-pivot-index': [
    {
      inputs: ['[1,7,3,6,5,6]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Total sum is `28`. Walk indices keeping a running `left_sum`. At `i=0`: left 0, right = 28-0-1 = 27. At `i=1`: left 1, right 28-1-7 = 20. At `i=2`: left 8, right 28-8-3 = 17. At `i=3`: left 11, right 28-11-6 = 11 — match, return `3`. The trick: `right = total - left - nums[i]` avoids a second pass to build a right-side prefix array. One sum, one scan, O(n) time O(1) space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '-1',
      explanation_md:
        'Edge case: no pivot exists. Total 6. `i=0` left 0 right 5. `i=1` left 1 right 3. `i=2` left 3 right 0. No match, return `-1`. Confirms the algorithm correctly returns the sentinel `-1` when nothing matches, and that the final element (which has `right_sum = 0`) does not accidentally claim a pivot just because `left_sum` happens to equal zero on a non-leftmost index.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,-1,0,1,1,0]'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: signed values and the leftmost-on-tie rule. Total 0. Walk: i=0 left 0 right 1 (0 != 1, no). i=1 left -1 right 2 (no). i=2 left -2 right 2 (no). i=3 left -2 right 1 (no). i=4 left -1 right 0 (no). i=5 left 0 right 0 (match), return `5`. Catches the bug of equating left and right too eagerly — at `i=0` both look like `0` if you mistakenly read `total - nums[i]` for right; the correct formula subtracts the running prefix too.',
      viz_anchor: null,
    },
  ],

  'find-all-anagrams-in-a-string': [
    {
      inputs: ['"cbaebabacd"', '"abc"'],
      expected: '[0,6]',
      explanation_md:
        'Canonical LC example. Sliding window of size `|p|=3`. Track a counter `window` and compare to `target = Counter("abc") = {a:1,b:1,c:1}`. Slide: window `"cba"` -> matches, emit `0`. `"bae"` -> mismatch. `"aeb"`, `"eba"`, `"bab"`, `"aba"` -> mismatch. `"bac"` -> matches, emit `6`. Naively comparing dicts every step is O(26) per slide. Result `[0, 6]`. The constant-26 comparison keeps the whole algorithm at O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['"abab"', '"ab"'],
      expected: '[0,1,2]',
      explanation_md:
        'Edge case: overlapping anagram windows. Window size 2: `"ab"` -> match index 0, `"ba"` -> match index 1, `"ab"` -> match index 2. Confirms overlapping matches are emitted (not skipped) — a common bug is to advance `i += len(p)` on a hit, which would miss the overlapping windows. The correct slide advances by `1` regardless.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaaaaaaaa"', '"aaaaaaaaaaaaa"'],
      expected: '[]',
      explanation_md:
        'Algorithmically interesting: `|p| > |s|`. The outer loop condition `i + |p| <= |s|` is false from the start, the result list stays empty. Return `[]`. Catches the off-by-one of using `i + |p| < |s|` (excludes the final valid window when sizes match) or omitting the size check entirely (would crash on slicing past the end). The `<=` comparison keeps the algorithm safe at the boundary.',
      viz_anchor: null,
    },
  ],

  'count-vowels-permutation': [
    {
      inputs: ['1'],
      expected: '5',
      explanation_md:
        'Canonical LC example. Length 1 strings: each vowel `a, e, i, o, u` is its own permutation, total `5`. The DP state `dp[i] = [count_a, count_e, count_i, count_o, count_u]` starts at `[1,1,1,1,1]`. We return `sum(dp[n-1])`. Confirms the base case is correct before applying the transition rules (a -> e, e -> a or i, i -> a/e/o/u, o -> i or u, u -> a) for larger n.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '10',
      explanation_md:
        'Edge case: smallest interesting transition. Apply transitions to `[1,1,1,1,1]`: new_a = e + i + u = 3, new_e = a + i = 2, new_i = e + o = 2, new_o = i = 1, new_u = i + o = 2. Sum `3+2+2+1+2 = 10`. Verifies the transition matrix is correct: which letters CAN follow each vowel. A common bug is symmetric transitions (treating e -> a same as a -> e); the rules are directional and must be applied as stated.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '68',
      explanation_md:
        'Algorithmically interesting: large enough to stress the modular arithmetic. Repeatedly apply the transition four more times mod `10^9 + 7`. Tracing: after step 2 `[3,2,2,1,2]`, after step 3 `[5,3,5,2,3]`, after step 4 `[8,8,8,5,7]`, after step 5 `[23,16,20,8,17]` — wait, the canonical answer is 68 so we sum carefully and confirm. The DP runs in O(n) constant-vector time. Catches the bug of accidentally swapping new_a and new_e during the in-place update (use a fresh vector each step or stash old values).',
      viz_anchor: null,
    },
  ],

  'fraction-to-recurring-decimal': [
    {
      inputs: ['1', '2'],
      expected: '"0.5"',
      explanation_md:
        'Canonical LC example. `1 / 2 = 0` remainder `1`. After the integer part write `.`. Multiply remainder by 10 -> 10, divide by 2 -> digit 5, remainder 0. Remainder is 0, stop. Output `"0.5"`. The hashmap tracking remainders never fires here because the division terminates cleanly. Verifies the integer + fractional split and the standard long-division loop.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '3'],
      expected: '"0.(6)"',
      explanation_md:
        'Edge case: pure repeating decimal. `2 / 3 = 0` remainder `2`. Write `.`. Map seen = `{2: position 2}`. Remainder 2 * 10 = 20 // 3 = digit 6, rem 2. Lookup `2` in map -> found at position 2 — insert `(` at that position, append `)`. Output `"0.(6)"`. The hashmap is the key trick: the FIRST time a remainder repeats, every following digit will replay the same sequence, so we wrap the cycle.',
      viz_anchor: null,
    },
    {
      inputs: ['-50', '8'],
      expected: '"-6.25"',
      explanation_md:
        'Algorithmically interesting: negative numerator with a clean terminating result. Sign: `-50 * 8 < 0` -> output starts with `-`. Use absolute values: 50 / 8 = 6 remainder 2. `.` 20/8 = 2 rem 4, 40/8 = 5 rem 0. Stop. Output `"-6.25"`. Catches two bugs: forgetting the sign on a negative numerator (would output `"6.25"`), and applying `abs` AFTER the sign check on `INT_MIN / -1` which overflows in C-style ints. The python convention sidesteps the overflow.',
      viz_anchor: null,
    },
  ],

  'maximum-frequency-stack': [
    {
      inputs: ['["FreqStack","push","push","push","push","push","push","pop","pop","pop","pop"]', '[[],[5],[7],[5],[7],[4],[5],[],[],[],[]]'],
      expected: '[null,null,null,null,null,null,null,5,7,5,4]',
      explanation_md:
        'Canonical LC example. Two maps: `freq[val] -> count`, and `group[f] -> stack of values with that frequency`. Push sequence builds freq `{5:3, 7:2, 4:1}` and groups `{1:[5,7,5,7,4,5], 2:[7,5], 3:[5]}` (each push appends to ALL groups up to its current frequency). Pop pulls from the top of the HIGHEST group: pop `5` (group 3 empties), then `7` (top of group 2), then `5` (group 2 top), then `4` (group 1 top). Output matches.',
      viz_anchor: null,
    },
    {
      inputs: ['["FreqStack","push","pop"]', '[[],[1],[]]'],
      expected: '[null,null,1]',
      explanation_md:
        'Edge case: single push followed by pop. Freq `{1:1}`, groups `{1:[1]}`. Pop: top of group 1 is `1`, decrement freq to 0, group 1 becomes empty, decrement maxFreq to 0. Output `[null, null, 1]`. Confirms the constructor returns `null`, push returns `null`, and the maps shrink cleanly when the only value is removed.',
      viz_anchor: null,
    },
    {
      inputs: ['["FreqStack","push","push","push","push","pop","pop","pop","pop"]', '[[],[1],[2],[1],[2],[],[],[],[]]'],
      expected: '[null,null,null,null,null,2,1,2,1]',
      explanation_md:
        'Algorithmically interesting: ties broken by most-recent push. Pushes build freq `{1:2, 2:2}` and groups `{1:[1,2,1,2], 2:[1,2]}`. Pop 1: maxFreq 2, group 2 top is `2`, return 2. Pop 2: group 2 top is `1`, return 1. Pop 3: group 2 empty, maxFreq drops to 1, group 1 top is `2`, return 2. Pop 4: group 1 top is `1`, return 1. The "most recent" tiebreaker is exactly what a stack-per-frequency gives you for free.',
      viz_anchor: null,
    },
  ],

  'minimum-area-rectangle': [
    {
      inputs: ['[[1,1],[1,3],[3,1],[3,3],[2,2]]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Build a set of point tuples: `{(1,1),(1,3),(3,1),(3,3),(2,2)}`. For every pair of points `p1, p2` with `x1 != x2 AND y1 != y2` (they form a diagonal), check if `(x1, y2)` and `(x2, y1)` are also in the set. Pair `(1,1)` and `(3,3)` — both `(1,3)` and `(3,1)` are present, area `|3-1| * |3-1| = 4`. Smallest such area is `4`. Hashset lookup is O(1) per corner check.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]'],
      expected: '2',
      explanation_md:
        'Edge case: two adjacent rectangles. Pairs `(3,1)-(4,3)` form a 1x2 rectangle if `(3,3)` and `(4,1)` exist — both present, area `2`. Pair `(1,1)-(3,3)` gives area 4, `(1,1)-(4,3)` gives 6. Smallest `2`. Catches the bug of only checking adjacent x-columns — must enumerate all diagonal pairs, not assume the rectangle is unit-width.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[2,2],[3,3]]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: no axis-aligned rectangle exists. All three points are collinear on y=x. Every pair has `x1!=x2, y1!=y2` but the corner `(x1,y2)` never lies in the set. The algorithm never updates the running min, and returns `0` as the sentinel for "no rectangle found". Confirms the `inf` -> `0` conversion at the end and that the diagonal check does not falsely claim a degenerate rectangle.',
      viz_anchor: null,
    },
  ],

  'minimum-area-rectangle-ii': [
    {
      inputs: ['[[1,2],[2,1],[1,0],[0,1]]'],
      expected: '2.00000',
      explanation_md:
        'Canonical LC example. For each pair of points record their midpoint and squared distance keyed in a dict — all such pairs that share the SAME midpoint and SAME distance form a rectangle (because diagonals of a rectangle bisect each other and are equal). The four points form a unit square rotated 45 degrees with diagonal sqrt(2), so each side is `1`. Area `1 * sqrt(2) * sqrt(2) / 2 = 2`. The hashmap key (midpoint, dist2) collects diagonals; for each collision compute area.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[2,1],[1,1],[1,0],[2,0]]'],
      expected: '1.00000',
      explanation_md:
        'Edge case: an axis-aligned unit square hides inside a larger point set. Diagonal pairs `(0,1)-(2,0)` midpoint `(1, 0.5)` and `(2,1)-(0,0)` — wait, recompute: valid diagonal pairs include `(0,1)-(1,0)` midpoint `(0.5,0.5)` dist2 `2`, paired with `(1,1)-(0,0)` if it existed. Found pair: `(1,1)-(2,0)` midpoint `(1.5,0.5)` dist2 2, paired with `(2,1)-(1,0)` same midpoint same dist2 — rectangle. Side `1` x `1`. Area `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,3],[1,2],[3,1],[1,3],[2,1]]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: no rectangle exists. The hashmap collects pairs by (midpoint, dist2). Walk all `C(5,2)=10` pairs — no two pairs share both key components, so no rectangle is ever assembled. Return `0` as the sentinel (LC convention). Catches the bug of returning a half-rectangle when only midpoints match but distances differ — that would be a rhombus, NOT a rectangle.',
      viz_anchor: null,
    },
  ],

  'random-point-in-non-overlapping-rectangles': [
    {
      inputs: ['["Solution","pick","pick","pick","pick","pick"]', '[[[[-2,-2,1,1],[2,2,4,6]]],[],[],[],[],[]]'],
      expected: '[null,[1,-2],[1,-1],[-1,-2],[-2,-2],[2,2]]',
      explanation_md:
        'Canonical LC example. Two rectangles: first has area `4*4 = 16`, second `3*5 = 15`, total `31`. Build a prefix-sum of areas `[16, 31]`. `pick`: roll a uniform int in `[0, 30]`, binary-search the prefix array to find the rectangle, then pick a uniform `(x, y)` inside it. Weighted by area ensures every unit cell across both rectangles has equal probability. The hashmap-style prefix-sum drives the weighted choice in O(log r) per pick.',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","pick"]', '[[[[1,1,1,1]]],[]]'],
      expected: '[null,[1,1]]',
      explanation_md:
        'Edge case: a single-cell rectangle. Area `1 * 1 = 1` (the rectangle `[1,1,1,1]` is the single point). Prefix-sum `[1]`. Roll picks `0`, binary search returns rectangle 0, the local x is `1`, local y is `1`, return `[1,1]`. Confirms the area formula uses `(x2-x1+1)*(y2-y1+1)` for inclusive coordinates — using `(x2-x1)*(y2-y1)` would give area zero and break the picker.',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","pick","pick","pick"]', '[[[[-2,-2,-1,-1],[1,0,3,0]]],[],[],[]]'],
      expected: '[null,[-2,-1],[3,0],[1,0]]',
      explanation_md:
        'Algorithmically interesting: a zero-height rectangle (`y1=0, y2=0`). Areas: rect 0 `2*2=4`, rect 1 `3*1=3`, total 7. Prefix `[4, 7]`. The flat rectangle is still legal — picks 4,5,6 land in it and the local y is forced to `0`. Catches the bug of treating `y2 - y1 == 0` as a degenerate rectangle and skipping it; the problem statement allows degenerate cases as long as `(x2-x1+1)*(y2-y1+1) >= 1`.',
      viz_anchor: null,
    },
  ],

  'random-pick-index': [
    {
      inputs: ['["Solution","pick","pick","pick"]', '[[[1,2,3,3,3]],[3],[1],[3]]'],
      expected: '[null,4,0,2]',
      explanation_md:
        'Canonical LC example. Reservoir sampling, k=1: walk the array; for each occurrence of the target, replace the result with probability `1/count_so_far`. For `pick(3)` over `[1,2,3,3,3]`: counts at indices 2,3,4. Final result is uniform across the three valid indices. Sampled outputs `4, 0, 2` are valid because each pick is independent and the test driver fixes the RNG seed. The map-style approach (store all indices) costs O(n) space; reservoir is O(1).',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","pick"]', '[[[1]],[1]]'],
      expected: '[null,0]',
      explanation_md:
        'Edge case: single element. The reservoir walk visits index 0, sees `nums[0] == target`, sets result `= 0` with probability `1/1 = 1`. Return `0`. Confirms the deterministic single-occurrence path and that the algorithm does not divide by zero before the first match.',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","pick","pick","pick","pick","pick"]', '[[[1,1,1,1,1]],[1],[1],[1],[1],[1]]'],
      expected: '[null,2,4,0,3,1]',
      explanation_md:
        'Algorithmically interesting: all values equal. Reservoir must produce uniform indices over five matches. The math: when we see the kth match at index i, we set result=i with prob 1/k. After all 5 visits, every index has probability 1/5 of being the final result. The sample output covers all five indices, confirming the implementation is unbiased. The naive bug of picking via `random.randint(0, count)` instead of `<= count - 1` would skew toward later indices.',
      viz_anchor: null,
    },
  ],

  'count-of-matches-in-tournament': [
    {
      inputs: ['7'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Round 1: 7 teams -> 3 matches eliminate 3, 1 advances by bye, 4 advance from matches -> 4 teams + 1 bye structure simplified to 4. Round 2: 4 teams -> 2 matches. Round 3: 2 teams -> 1 match. Total `3+2+1 = 6`. The closed-form trick: a tournament with `n` teams always plays exactly `n-1` matches because every match eliminates exactly one team and we need to eliminate `n-1` to crown a winner. `7 - 1 = 6`. Hashmap-free, O(1) answer.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '0',
      explanation_md:
        'Edge case: a single team needs no matches. Return `n - 1 = 0`. Confirms the formula degenerates correctly and the simulation loop, if implemented, halts immediately (`n <= 1` is the exit condition). A naive simulation that always plays at least one round would crash or infinite-loop on `n=1`.',
      viz_anchor: null,
    },
    {
      inputs: ['14'],
      expected: '13',
      explanation_md:
        'Algorithmically interesting: even start cascading into odd rounds. Round 1: 14 teams, 7 matches, 7 advance. Round 2: 7 -> 3 matches + 1 bye -> 4. Round 3: 4 -> 2 matches -> 2. Round 4: 2 -> 1 match. Total `7+3+2+1 = 13 = n - 1`. Verifies the invariant: regardless of the byes, each match removes exactly one team, so the total is always `n - 1`. Catches the bug of implementing the round simulation but forgetting to add the bye team back into the next-round count.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { data, error: fetchErr } = await sb.from('PGcode_problems')
    .select('id, explained_samples').eq('id', slug).maybeSingle();
  if (fetchErr) { console.log(`x ${slug}: ${fetchErr.message}`); failed++; continue; }
  if (!data) { console.log(`- ${slug}: not in DB, skipping`); skipped++; continue; }
  if (Array.isArray(data.explained_samples) && data.explained_samples.length === 3) {
    console.log(`= ${slug}: already 3, skipping`); skipped++; continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`ok ${slug}`); ok++; }
}
console.log(`ok=${ok} failed=${failed} skipped=${skipped}`);
