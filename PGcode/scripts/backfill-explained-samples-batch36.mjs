#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 36 (15 fresh Easy/Medium problems).
// Same shape as batches 1..35: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// batch35 (Easy/Medium) and the Hard agent's batch are concurrent, so this Easy/Medium batch lands at batch36.
// Selected only Easy/Medium problems whose explained_samples was empty and that hold >=3 clean, traceable graded test cases.
// Skipped opaque data (expected=="null" placeholders, prose-in-expected, DataFrame/Table inputs).
// Run: node scripts/backfill-explained-samples-batch36.mjs

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
  // ---------- EASY ----------
  'average-salary-excluding-the-minimum-and-maximum-salary': [
    {
      inputs: ['[4000,3000,1000,2000]'],
      expected: '2500.0',
      explanation_md:
        'Drop the single lowest and single highest salary, then average the rest. From `[4000,3000,1000,2000]` the minimum is `1000` and the maximum is `4000`. Remove both, leaving `3000` and `2000`. Their sum is `5000` over `2` remaining salaries, so the average is `5000 / 2 = 2500.0`. Return `2500.0`. A single pass can track the running sum, min, and max together, then the answer is `(sum - min - max) / (n - 2)`. The constraint that all salaries are unique guarantees exactly one element is stripped at each end.',
      viz_anchor: null,
    },
    {
      inputs: ['[1000,2000,3000]'],
      expected: '2000.0',
      explanation_md:
        'The smallest valid input where two of three are excluded. From `[1000,2000,3000]` the minimum `1000` and maximum `3000` are both removed, leaving only `2000`. The average of that single remaining salary is `2000 / 1 = 2000.0`. Return `2000.0`. Proves the `n - 2` denominator stays positive at the boundary: with exactly three salaries, one survives, and the formula `(6000 - 1000 - 3000) / 1` lands cleanly on the middle value without dividing by zero.',
      viz_anchor: null,
    },
    {
      inputs: ['[6000,5000,4000,3000,2000,1000]'],
      expected: '3500.0',
      explanation_md:
        'A larger spread. From `[6000,5000,4000,3000,2000,1000]` the minimum is `1000` and the maximum is `6000`. Remove both, leaving `5000, 4000, 3000, 2000`, which sum to `14000` over `4` salaries. The average is `14000 / 4 = 3500.0`. Return `3500.0`. Proves the extremes are stripped regardless of their position in the list: here the max sits first and the min sits last, yet tracking running min and max finds them anyway, and the four interior values average to `3500.0`.',
      viz_anchor: null,
    },
  ],

  'lucky-numbers-in-a-matrix': [
    {
      inputs: ['[[3,7,8],[9,11,13],[15,16,17]]'],
      expected: '[15]',
      explanation_md:
        'A lucky number is the minimum of its row and simultaneously the maximum of its column. Scan each row for its minimum, then verify that value is also the largest in its column. Row mins are `3, 9, 15`. Check `3`: is it the max of column 0 (`3,9,15`)? No, `15` is. Check `9`: max of column 1 (`7,11,16`)? No. Check `15`: max of column 0? Yes, `15 > 9 > 3`. So `15` qualifies. Return `[15]`. Collecting row-minimums then column-maximums into two sets and intersecting also works.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,10,4,2],[9,3,8,7],[15,16,17,12]]'],
      expected: '[12]',
      explanation_md:
        'A four-column grid. Row minimums are `1` (row 0), `3` (row 1), `12` (row 2). Test each as a column maximum. `1` sits in column 0 with `1,9,15`, where `15` is larger, so no. `3` sits in column 1 with `10,3,16`, where `16` is larger, so no. `12` sits in column 3 with `2,7,12`, and `12` is the largest there, so it qualifies. Return `[12]`. Proves the dual condition: a value must win its row going small and its column going large at the same time.',
      viz_anchor: null,
    },
    {
      inputs: ['[[7,8],[1,2]]'],
      expected: '[7]',
      explanation_md:
        'A two-by-two grid. Row minimums are `7` (row 0, since `7 < 8`) and `1` (row 1). Check `7`: it lives in column 0 with `7,1`, and `7` is the maximum there, so it qualifies. Check `1`: it lives in column 0 too with `7,1`, where `7` is larger, so it fails. Only `7` satisfies both conditions. Return `[7]`. Proves the smallest grid still resolves cleanly: the row minimum that also dominates its column is the lone lucky number.',
      viz_anchor: null,
    },
  ],

  'find-the-maximum-divisibility-score': [
    {
      inputs: ['[2,9,15,50]', '[5,3,7,2]'],
      expected: '2',
      explanation_md:
        'For each divisor, count how many of `nums` it divides evenly; return the divisor with the highest count, breaking ties by the smallest divisor. Test each: `5` divides `15` and `50`, score `2`. `3` divides `9` and `15`, score `2`. `7` divides none, score `0`. `2` divides `2` and `50`, score `2`. Three divisors tie at `2`, so pick the smallest, which is `2`. Return `2`. The tie-break toward the smaller value is essential here, since `5`, `3`, and `2` all reach the top score.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,7,9,3,9]', '[5,2,3]'],
      expected: '3',
      explanation_md:
        'Count divisibility per divisor. `5` divides none of `4,7,9,3,9`, score `0`. `2` divides only `4`, score `1`. `3` divides `9, 3, 9`, score `3`. The clear winner is `3` with the highest count. Return `3`. Proves the simple maximum path without a tie: no other divisor comes close to `3`\'s three hits, so no tie-break is needed. The nested count over divisors times numbers runs in straightforward quadratic time for these small inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[20,14,21,10]', '[10,16,20]'],
      expected: '10',
      explanation_md:
        'Score each divisor against `20,14,21,10`. `10` divides `20` and `10`, score `2`. `16` divides none, score `0`. `20` divides only `20`, score `1`. The top score is `2`, held by `10` alone. Return `10`. Proves the algorithm rewards the divisor with the broadest reach rather than the largest value: `20` is bigger but divides fewer elements, so the more frequently-fitting `10` wins on count.',
      viz_anchor: null,
    },
  ],

  'detect-pattern-of-length-m-repeated-k-or-more-times': [
    {
      inputs: ['[1,2,4,4,4,4]', '1', '3'],
      expected: 'true',
      explanation_md:
        'Look for a contiguous pattern of length `m` repeated `k` or more times back-to-back. With `m=1, k=3`, slide a single-element pattern and count consecutive repeats. At the run of `4`s, the pattern `[4]` repeats four times in a row, which meets the threshold of `3`. Return `true`. A window check comparing each element to the one `m` positions earlier, with a counter that resets on mismatch and triggers once it reaches `(k-1)*m` matches, decides this in a single linear pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2,1,1,1,3]', '2', '2'],
      expected: 'true',
      explanation_md:
        'With `m=2, k=2`, seek a length-2 block repeated at least twice consecutively. The opening `1,2,1,2` is the pattern `[1,2]` appearing twice in a row, which satisfies `k=2`. Return `true`. Proves the algorithm catches a repeated multi-element block, not just single values: comparing each element to the one two positions back stays matched across the four-element prefix, and the match counter reaches the required length before the sequence breaks at the later `1,1,1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2,1,3]', '2', '3'],
      expected: 'false',
      explanation_md:
        'With `m=2, k=3`, a length-2 pattern must repeat three times, spanning six elements. The prefix `1,2,1,2,1` only gives the pattern `[1,2]` twice before the trailing `3` breaks it, falling one repeat short of three. No other position fares better. Return `false`. Proves the strictness of `k`: two consecutive repeats are not enough when three are demanded, and the final `3` disrupts the run before the counter can reach the needed `(3-1)*2 = 4` matches.',
      viz_anchor: null,
    },
  ],

  'minimum-changes-to-make-alternating-binary-string': [
    {
      inputs: ['"0100"'],
      expected: '1',
      explanation_md:
        'Count the fewest single-bit flips to make the string alternate. There are only two valid targets, `0101...` and `1010...`; count mismatches against each and take the smaller. For `"0100"`: against `0101` the last bit differs, one mismatch. Against `1010` three bits differ. The minimum is `1`. Return `1`. Comparing each position to its expected parity in one pass gives both counts at once, and the answer is always the smaller of the two, since the two targets are exact complements.',
      viz_anchor: null,
    },
    {
      inputs: ['"10"'],
      expected: '0',
      explanation_md:
        'An already-alternating string. `"10"` matches the target `1010...` perfectly: position 0 is `1`, position 1 is `0`, both as expected. Zero flips are needed against that pattern, and the complement target `0101` would cost `2`. The minimum is `0`. Return `0`. Proves the algorithm reports no work when the input already alternates: one of the two target patterns matches exactly, driving its mismatch count to zero.',
      viz_anchor: null,
    },
    {
      inputs: ['"1111"'],
      expected: '2',
      explanation_md:
        'All ones. Against the target `1010`, positions 1 and 3 should be `0` but are `1`, giving two mismatches. Against `0101`, positions 0 and 2 mismatch, also two. Both targets cost `2`, so the minimum is `2`. Return `2`. Proves the balanced case where both candidate patterns require equal flips: a uniform string of even length sits exactly halfway between the two alternating targets, so either choice flips half the bits.',
      viz_anchor: null,
    },
  ],

  'find-the-pivot-integer': [
    {
      inputs: ['8'],
      expected: '6',
      explanation_md:
        'Find `x` where the sum `1..x` equals the sum `x..n`. The total `1..8` is `36`. A pivot `x` splits it so both sides share `x`, meaning the prefix sum to `x` equals `(total + x) / 2`. Test `x=6`: prefix `1+2+3+4+5+6 = 21`, suffix `6+7+8 = 21`. They match, so `6` is the pivot. Return `6`. Closed-form: `x = sqrt(n(n+1)/2)` when that is a perfect square; here `sqrt(36) = 6` lands exactly, confirming the pivot exists.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'The smallest input. With `n=1` the only candidate is `x=1`. The prefix sum `1..1` is `1` and the suffix sum `1..1` is also `1`, since both sides are just the single element `1`. They are equal, so `1` is its own pivot. Return `1`. Proves the trivial base case: a single-element range is balanced by definition, with the lone value serving as both the entire prefix and the entire suffix simultaneously.',
      viz_anchor: null,
    },
    {
      inputs: ['4'],
      expected: '-1',
      explanation_md:
        'A case with no pivot. The total `1..4` is `10`. For a pivot to exist, `n(n+1)/2 = 10` must be a perfect square, but `sqrt(10)` is not an integer. Checking by hand: `x=3` gives prefix `6` versus suffix `3+4 = 7`, and `x=2` gives prefix `3` versus suffix `2+3+4 = 9`; nothing balances. So no pivot integer exists and the answer is `-1`. Return `-1`. Proves the failure path when the triangular sum is not a perfect square.',
      viz_anchor: null,
    },
  ],

  'kth-missing-positive-number': [
    {
      inputs: ['[2,3,4,7,11]', '5'],
      expected: '9',
      explanation_md:
        'Find the `k`-th positive integer absent from a sorted array. List the missing values in order: `1` is missing, then `5, 6` (skipped between `4` and `7`), then `8, 9, 10` (skipped between `7` and `11`). The missing sequence is `1, 5, 6, 8, 9, ...` and the 5th entry is `9`. Return `9`. A binary search on the count of missing numbers before each index, `arr[i] - (i + 1)`, locates the answer in **O(log n)** without listing every gap.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]', '2'],
      expected: '6',
      explanation_md:
        'A gapless prefix. The array `[1,2,3,4]` covers `1` through `4` with nothing missing inside it, so the first missing positives start after the end: `5` is the first, `6` is the second. The 2nd missing value is `6`. Return `6`. Proves the trailing case: when the array has no internal gaps, the `k`-th missing number is simply `arr[last] + k`, here `4 + 2 = 6`, since every absent value lies beyond the final element.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '0'],
      expected: '0',
      explanation_md:
        'An empty array with `k=0`. With no elements present and zero missing numbers requested, there is nothing to find, so the routine returns `0` as the degenerate answer for this boundary input. Return `0`. Proves the algorithm handles the empty-array and zero-`k` edge without indexing into a missing element: the count of gaps to skip is zero, so it short-circuits immediately rather than attempting to enumerate any positive integers.',
      viz_anchor: null,
    },
  ],

  'reverse-a-queue': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'Reverse the order of a queue, where elements normally leave from the front in arrival order. Push every element onto a stack as you dequeue, then pop them back into the queue. Trace `[1,2,3,4,5]`: dequeue front to back pushing `1,2,3,4,5` onto the stack, then pop `5,4,3,2,1` back. The result is `[5,4,3,2,1]`. Return it. The stack\'s last-in-first-out behavior is exactly what flips the first-in-first-out order, using **O(n)** time and **O(n)** auxiliary space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'A single element. Pushing the lone `1` onto the stack and popping it back leaves the queue as `[1]`, unchanged. Return `[1]`. Proves the one-element base case: reversing a sequence of length one is a no-op, since there is no second element to swap order with. The stack receives a single value and returns it immediately, and the queue\'s contents are identical before and after the operation.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'An empty queue. With no elements to dequeue, the stack stays empty and nothing is pushed back, so the result is the empty queue `[]`. Return `[]`. Proves the algorithm handles the zero-length boundary safely: the transfer loop never iterates, so there is no attempt to dequeue from an empty structure, and the reversal of an empty sequence is trivially itself.',
      viz_anchor: null,
    },
  ],

  'one-odd': [
    {
      inputs: ['[2,2,1]'],
      expected: '1',
      explanation_md:
        'Every number appears twice except one; find the single odd-one-out. XOR all elements together: equal values cancel to `0` and the lone survivor remains. Trace `[2,2,1]`: `2 XOR 2 = 0`, then `0 XOR 1 = 1`. Return `1`. XOR is commutative and associative, so the order of cancellation does not matter, and any value paired with itself vanishes. This runs in **O(n)** time and **O(1)** space, beating a hash-count approach that would need extra memory.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,1,2,1,2]'],
      expected: '4',
      explanation_md:
        'A longer list with the unique value at the front. XOR everything: `4 XOR 1 = 5`, `5 XOR 2 = 7`, `7 XOR 1 = 6`, `6 XOR 2 = 4`. The pairs `1,1` and `2,2` cancel out over the course of the fold, leaving `4`. Return `4`. Proves the position of the singleton does not matter: even though `4` appears first, the XOR accumulation correctly isolates it once every duplicated value has cancelled against its partner.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'A single element. With only `1` present and no pair to cancel against, the XOR fold starts at `0` and computes `0 XOR 1 = 1`, leaving the lone value. Return `1`. Proves the minimal base case: a one-element array trivially has its single number as the answer, and the XOR accumulator initialized to zero returns that element unchanged since `0 XOR x = x` for any `x`.',
      viz_anchor: null,
    },
  ],

  // ---------- MEDIUM ----------
  'minimum-time-visiting-all-points': [
    {
      inputs: ['[[1,1],[3,4],[-1,0]]'],
      expected: '7',
      explanation_md:
        'Move between points where a diagonal step covers one unit in both x and y at once, so the cost between two points is the Chebyshev distance, `max(|dx|, |dy|)`. From `[1,1]` to `[3,4]`: `dx=2, dy=3`, cost `max(2,3)=3`. From `[3,4]` to `[-1,0]`: `dx=4, dy=4`, cost `max(4,4)=4`. Total `3 + 4 = 7`. Return `7`. Diagonals knock out the smaller delta for free, so only the larger axis difference is ever paid per leg, summed across consecutive points.',
      viz_anchor: null,
    },
    {
      inputs: ['[[3,2],[-2,2]]'],
      expected: '5',
      explanation_md:
        'A purely horizontal move. From `[3,2]` to `[-2,2]`: `dx = |3 - (-2)| = 5`, `dy = |2 - 2| = 0`. The cost is `max(5, 0) = 5`. Return `5`. Proves the Chebyshev formula collapses to plain horizontal distance when the y-coordinates match: with `dy = 0` there are no diagonal shortcuts to take, so all five steps are straight moves along x, and the larger delta of `5` is the full price.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0]]'],
      expected: '0',
      explanation_md:
        'A single point. With only one location and nowhere to travel, no moves are made and the total time is `0`. Return `0`. Proves the base case: visiting a one-point itinerary requires zero steps, since there is no consecutive pair to compute a distance between. The summation loop over adjacent points never iterates, so the accumulated cost stays at its initial value of zero.',
      viz_anchor: null,
    },
  ],

  'find-all-duplicates-arr': [
    {
      inputs: ['[4,3,2,7,8,2,3,1]'],
      expected: '[2,3]',
      explanation_md:
        'Values lie in `1..n` and each appears once or twice; report those appearing twice using the array itself as a marker. For each value `v`, negate the element at index `|v| - 1`; if it is already negative, `v` is a repeat. Trace `[4,3,2,7,8,2,3,1]`: marking proceeds until the second `2` finds index 1 already negative, recording `2`, and the second `3` finds index 2 already negative, recording `3`. Return `[2,3]`. This sign-flipping trick gives **O(n)** time and **O(1)** extra space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,2]'],
      expected: '[1]',
      explanation_md:
        'A short array with one duplicate. Process `[1,1,2]`: the first `1` negates index 0; the second `1` finds index 0 already negative, so `1` is a duplicate and is recorded. The `2` negates index 1, which was untouched, so it is not a repeat. Return `[1]`. Proves the in-place marking detects exactly the value seen twice: only `1` triggers the already-negative check, while `2` appears just once and adds nothing to the result.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[]',
      explanation_md:
        'A single element with no duplicates. Processing `[1]` negates index 0 once; since no other value revisits that index, nothing is ever found already negative. No duplicates exist, so the result is the empty list `[]`. Return `[]`. Proves the algorithm returns nothing when every value is unique: the duplicate-detection branch, which fires only on an already-negative slot, never triggers across this one-element input.',
      viz_anchor: null,
    },
  ],

  'insertion-position': [
    {
      inputs: ['[1,3,5,6]', '5'],
      expected: '2',
      explanation_md:
        'Return the index where `target` is found, or where it would be inserted to keep the array sorted. Binary search `[1,3,5,6]` for `5`: midpoint at index 1 holds `3`, too small, search right; the value `5` sits at index 2 exactly. Return `2`. Because the target is present, the search lands on its actual index. The binary search runs in **O(log n)**, halving the range each step and converging on the first position where the element is greater than or equal to the target.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5,6]', '2'],
      expected: '1',
      explanation_md:
        'A target not in the array. Search `[1,3,5,6]` for `2`: it falls between `1` at index 0 and `3` at index 1. To keep the array sorted, `2` must be inserted at index 1, shifting `3` and beyond rightward. Return `1`. Proves the insertion-point behavior for an absent value: the search converges on the first index whose element exceeds the target, which is exactly where the new value belongs to preserve order.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5,6]', '7'],
      expected: '4',
      explanation_md:
        'A target larger than every element. Searching `[1,3,5,6]` for `7`, no element is greater than or equal to `7`, so it belongs after the last index. The insertion position is `4`, one past the final element. Return `4`. Proves the boundary where the answer equals the array length: when the target exceeds all values, it appends to the end, and the binary search correctly returns `n` rather than clamping to the last valid index.',
      viz_anchor: null,
    },
  ],

  'flip-string-to-monotone-increasing': [
    {
      inputs: ['"00110"'],
      expected: '1',
      explanation_md:
        'Flip the fewest bits so the string becomes all `0`s followed by all `1`s. Sweep left to right tracking `ones`, the count of `1`s seen, and `flips`, the minimum changes so far. On a `1`, increment `ones`. On a `0`, you either flip it up to join the ones or flip a prior `1` down, so `flips = min(flips + 1, ones)`. Trace `"00110"`: the trailing `0` after the `11` costs `1` flip rather than flipping both `1`s. Return `1`. The running minimum captures the cheaper of the two repair options at each step.',
      viz_anchor: null,
    },
    {
      inputs: ['"010110"'],
      expected: '2',
      explanation_md:
        'A more interleaved string. Sweep `"010110"` tracking `ones` and `flips`. The `1`s at indices 1, 3, 4 push `ones` up to `3`, while the `0`s at indices 2 and 5 each force a decision via `flips = min(flips + 1, ones)`. The optimal repair flips two bits, for instance turning the early stray `1` and a later `0` so the string reads as a clean block of `0`s then `1`s. Return `2`. Proves the DP weighs flipping zeros up against flipping ones down and always keeps the cheaper running total.',
      viz_anchor: null,
    },
    {
      inputs: ['"00011000"'],
      expected: '2',
      explanation_md:
        'A string with a `11` island inside zeros. Sweep `"00011000"`: the prefix `000` needs nothing, then `11` raises `ones` to `2`, then the trailing `000` each invoke `flips = min(flips + 1, ones)`. Flipping the two `1`s down to `0` costs `2`, which is cheaper than flipping the three trailing `0`s up. Return `2`. Proves the algorithm picks the smaller side to repair: with two `1`s embedded before three `0`s, erasing the shorter `1` run wins over lifting the longer `0` run.',
      viz_anchor: null,
    },
  ],

  'extra-characters-in-string': [
    {
      inputs: ['"leetscode"', '["leet","code","leetcode"]'],
      expected: '1',
      explanation_md:
        'Break the string into dictionary words, minimizing leftover characters that fit no word. Define `dp[i]` as the fewest extra characters in the suffix starting at `i`. At each position either treat the current character as extra, `dp[i+1] + 1`, or match a dictionary word starting here and jump past it. For `"leetscode"`: take `leet` (indices 0-3), the `s` at index 4 is extra, then `code` covers the rest. Only `s` is stranded, so the answer is `1`. Return `1`. The DP fills right to left in **O(n^2)** with word lookups.',
      viz_anchor: null,
    },
    {
      inputs: ['"sayhelloworld"', '["hello","world"]'],
      expected: '3',
      explanation_md:
        'A case with an unmatched prefix. The dictionary only has `hello` and `world`. Scanning `"sayhelloworld"`, the leading `say` matches no word, so those three characters are extra, while `hello` then `world` cover the remainder exactly. The minimum leftover count is `3`, for the stranded `s`, `a`, `y`. Return `3`. Proves the DP charges one extra per character that cannot begin or belong to any dictionary word, even when later substrings tile perfectly.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdef"', '["abc","def"]'],
      expected: '0',
      explanation_md:
        'A perfect tiling. The string `"abcdef"` splits cleanly into `abc` followed by `def`, both in the dictionary, leaving no character unmatched. The minimum number of extra characters is `0`. Return `0`. Proves the best-case path: when the entire string decomposes into dictionary words with no remainder, the DP never charges an extra-character penalty, and the suffix value at index 0 reaches zero through two exact word jumps.',
      viz_anchor: null,
    },
  ],

  'find-good-days-to-rob-the-bank': [
    {
      inputs: ['[5,3,3,3,5,6,2]', '2'],
      expected: '[2,3]',
      explanation_md:
        'A day `i` is good if the `time` days before it are non-increasing and the `time` days after are non-decreasing. Precompute `nonInc[i]`, the length of the non-increasing run ending at `i`, and `nonDec[i]`, the non-decreasing run starting at `i`. With `time=2`, a day qualifies when both runs reach at least `2`. For `[5,3,3,3,5,6,2]`, indices 2 and 3 each have two non-increasing days before and two non-decreasing days after. Return `[2,3]`. Two linear passes build the run arrays in **O(n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,1,1]', '0'],
      expected: '[0,1,2,3,4]',
      explanation_md:
        'With `time=0`, every day is trivially good, since zero days are required to be non-increasing before and zero non-decreasing after. The array `[1,1,1,1,1]` therefore qualifies at every index. All five positions `0,1,2,3,4` are good days. Return `[0,1,2,3,4]`. Proves the `time=0` boundary: the run-length conditions are vacuously satisfied, so the answer is simply every valid index in the array regardless of the security values.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,6]', '2'],
      expected: '[]',
      explanation_md:
        'A strictly increasing array. With `time=2`, a good day needs two non-increasing days before it, but `[1,2,3,4,5,6]` only ever rises, so no position has any non-increasing run of length two preceding it. No day qualifies. Return `[]`. Proves the empty-result path: when the security values climb monotonically, the before-condition can never hold for any `time` greater than zero, so the set of good days is empty.',
      viz_anchor: null,
    },
  ],
};

async function main() {
  const ids = Object.keys(PAYLOAD);
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems').select('id,difficulty,explained_samples').in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const present = new Map(rows.map(r => [r.id, r]));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    const row = present.get(id);
    if (!row) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    const diff = (row.difficulty || '').toLowerCase();
    if (diff !== 'easy' && diff !== 'medium') {
      console.log(`SKIP   ${id}  (difficulty ${row.difficulty} not Easy/Medium)`);
      skipped++;
      continue;
    }
    if (Array.isArray(row.explained_samples) && row.explained_samples.length > 0) {
      console.log(`SKIP   ${id}  (already has ${row.explained_samples.length} samples)`);
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
      const words = s.explanation_md.split(/\s+/).filter(Boolean).length;
      const ok2 = Array.isArray(s.inputs) && s.inputs.length > 0
        && typeof s.expected === 'string'
        && typeof s.explanation_md === 'string'
        && (s.viz_anchor === null || typeof s.viz_anchor === 'string')
        && words >= 60 && words <= 120;
      if (!ok2) {
        shapeOk = false;
        console.log(`  bad sample for ${id}: words=${words}`);
        break;
      }
    }
    if (!shapeOk) {
      console.log(`ERR    ${id}  (sample shape/word-count invalid)`);
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
      console.log(`OK     ${id}`);
      ok++;
    }
  }
  console.log(`\nDone. ok=${ok}  skipped=${skipped}  failed=${failed}  total=${ids.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
