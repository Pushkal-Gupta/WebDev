#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 4 (30 problems).
// Same shape as batches 1+2+3: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch4.mjs

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
  'binary-search': [
    {
      inputs: ['[-1,0,3,5,9,12]', '9'],
      expected: '4',
      explanation_md:
        'The canonical LC example. Classic binary search on a sorted array. `lo=0, hi=5`. Mid `2` (val `3`) — too small, `lo=3`. Mid `4` (val `9`) — match, return `4`. Each step halves the remaining window, so total comparisons are **O(log n)**. The brittle pitfall is the loop condition: use `while lo <= hi` and `mid = lo + (hi-lo)/2` to avoid integer overflow in languages without big ints. The mid-point formula `(lo + hi) / 2` would overflow on a 1B-length array near `INT_MAX`.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,0,3,5,9,12]', '2'],
      expected: '-1',
      explanation_md:
        'The "not found" case. `lo=0, hi=5`. Mid `2` (val `3`) — too big, `hi=1`. Mid `0` (val `-1`) — too small, `lo=1`. Mid `1` (val `0`) — too small, `lo=2`. Now `lo > hi` → exit, return `-1`. Proves the loop must terminate with the sentinel `-1` rather than falling into an infinite loop when the target is between two adjacent elements. The `lo <= hi` boundary is what guarantees termination.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]', '5'],
      expected: '0',
      explanation_md:
        'The single-element edge case. `lo=0, hi=0`. Mid `0` (val `5`) — match, return `0`. The loop condition `lo <= hi` includes the equality, so a one-element array is searched correctly. A brittle implementation using `lo < hi` would skip the single-element case entirely and return `-1`. The `<=` is what handles both the multi-element narrow-down and the one-element base.',
      viz_anchor: null,
    },
  ],

  'search-insert-position': [
    {
      inputs: ['[1,3,5,6]', '5'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Binary search; when the target is found, return its index. `lo=0, hi=3`. Mid `1` (val `3`) — too small, `lo=2`. Mid `2` (val `5`) — match, return `2`. **O(log n)**. The key difference from plain binary search is what happens when the target is **not** found: instead of returning `-1`, return `lo` (the position where the target would be inserted to keep the array sorted).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5,6]', '2'],
      expected: '1',
      explanation_md:
        'The "insert into middle" case. Target `2` lies between `1` and `3`. `lo=0, hi=3`. Mid `1` (val `3`) — too big, `hi=0`. Mid `0` (val `1`) — too small, `lo=1`. Now `lo > hi` → exit. Return `lo = 1` — the insert position. Proves the post-loop `lo` value is exactly the rank of the target, which equals the insert position in a sorted array.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5,6]', '7'],
      expected: '4',
      explanation_md:
        'The "insert at end" case. Target `7` is larger than every element. The loop drives `lo` past every position. `lo=0, hi=3`. Mid `1` (val `3`) too small, `lo=2`. Mid `2` (val `5`) too small, `lo=3`. Mid `3` (val `6`) too small, `lo=4`. Exit, return `4` — which is `n`, one past the end. This is the input that proves the algorithm correctly handles "insert at the very back" without going out of bounds.',
      viz_anchor: null,
    },
  ],

  'find-first-and-last-position-of-element-in-sorted-array': [
    {
      inputs: ['[5,7,7,8,8,10]', '8'],
      expected: '[3,4]',
      explanation_md:
        'The canonical LC example. Two binary searches — one for the leftmost `8`, one for the rightmost. Left search: on equality, keep going left to find the earliest occurrence. Right search: on equality, keep going right. Left finds index `3`; right finds index `4`. Return `[3, 4]`. **O(log n)** total. The brittle approach — linear scan from a single found index — degrades to **O(n)** when the target dominates the array, e.g. all `8`s.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,7,7,8,8,10]', '6'],
      expected: '[-1,-1]',
      explanation_md:
        'The "target not present" case. Both left and right searches return the index where the target would be inserted, but neither finds an exact match. The post-check `nums[leftResult] != target` flags this and returns `[-1, -1]`. Proves the algorithm distinguishes "would go here" from "exists here" — the same lower-bound search that powers `searchInsert` needs a follow-up equality check for this problem.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '0'],
      expected: '[-1,-1]',
      explanation_md:
        'The empty-array edge case. `lo=0, hi=-1`. The loop never enters. Return `[-1, -1]`. A brittle implementation that always reads `nums[0]` after the search would crash on the empty input. The clean version checks `n == 0` up front or relies on the loop condition `lo <= hi` to skip everything when `hi = -1`.',
      viz_anchor: null,
    },
  ],

  'search-in-rotated-sorted-array': [
    {
      inputs: ['[4,5,6,7,0,1,2]', '0'],
      expected: '4',
      explanation_md:
        'The canonical LC example. Modified binary search: at each step, one half of `[lo..hi]` is still sorted — determine which by comparing `nums[lo]` with `nums[mid]`. If `nums[lo] <= nums[mid]`, left half is sorted; otherwise right is. Then check if the target lies in the sorted half and search there. Trace: `lo=0, hi=6, mid=3 (val 7)`. Left sorted (`4 <= 7`), target `0` not in `[4..7]` → go right. `lo=4, hi=6, mid=5 (val 1)`. Right sorted, target not in `[1..2]` → go left. `lo=4, hi=4`. Match. Return `4`.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,5,6,7,0,1,2]', '3'],
      expected: '-1',
      explanation_md:
        'The "target absent in rotated array" case. The algorithm correctly traverses the rotation point without losing the target. Both halves are searched whenever the target could lie in either side; eventually `lo > hi` with no match → return `-1`. Proves that the rotation point does not create a blind spot — every value reachable by a sorted-half search is also reachable, even when the array wraps.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '0'],
      expected: '-1',
      explanation_md:
        'The single-element edge case where the target is absent. `lo=0, hi=0, mid=0 (val 1)`. Not the target. The sorted-half check trivially identifies the only element as both halves; neither contains `0`. Loop exits with `lo > hi` → return `-1`. Proves the algorithm handles `n=1` without infinite-looping on the sorted-half detection (a brittle version might fail when `lo == mid == hi`).',
      viz_anchor: null,
    },
  ],

  'find-minimum-in-rotated-sorted-array': [
    {
      inputs: ['[3,4,5,1,2]'],
      expected: '1',
      explanation_md:
        'The canonical LC example. Binary search for the inflection point: if `nums[mid] > nums[hi]`, the minimum is in the right half (rotation point past mid); else it is in the left half (including `mid`). Trace: `lo=0, hi=4, mid=2 (val 5)`. `5 > 2` → `lo=3`. `lo=3, hi=4, mid=3 (val 1)`. `1 < 2` → `hi=3`. `lo == hi` → return `nums[lo] = 1`. **O(log n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[11,13,15,17]'],
      expected: '11',
      explanation_md:
        'The "no rotation" edge case. The array is already sorted. The comparison `nums[mid] > nums[hi]` is always false, so `hi` keeps shrinking until `lo == hi == 0`. Return `nums[0] = 11`. Proves the algorithm correctly handles the zero-rotation case as a degenerate version of the general one — no special-casing needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1]'],
      expected: '1',
      explanation_md:
        'The smallest non-trivial rotation. `lo=0, hi=1, mid=0 (val 2)`. `2 > 1` → `lo=1`. `lo == hi` → return `nums[1] = 1`. This input proves the loop must terminate cleanly when `lo == hi`; a brittle implementation using `lo <= hi` here would step past the answer and access out-of-bounds, while `lo < hi` correctly stops at the inflection.',
      viz_anchor: null,
    },
  ],

  'sqrtx': [
    {
      inputs: ['4'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Binary search for the largest integer `r` such that `r*r <= x`. `lo=0, hi=4`. Mid `2`, `2*2=4 <= 4` → candidate `2`, `lo=3`. Mid `3`, `3*3=9 > 4` → `hi=2`. `lo > hi`, return candidate `2`. **O(log x)** time. The brittle approach using `r = int(sqrt(x))` works for small `x` but loses precision near `2^31` because `double` only has 52 bits of mantissa; binary search stays exact.',
      viz_anchor: null,
    },
    {
      inputs: ['8'],
      expected: '2',
      explanation_md:
        'The "not a perfect square" case. `sqrt(8) ≈ 2.828`, truncated to `2`. Binary search: `lo=0, hi=8`. Mid `4`, `16 > 8` → `hi=3`. Mid `1`, `1 <= 8` → cand `1`, `lo=2`. Mid `2`, `4 <= 8` → cand `2`, `lo=3`. Mid `3`, `9 > 8` → `hi=2`. Exit. Return `2`. Proves the "remember last valid candidate" pattern is necessary — the loop ends past the answer, so we must save `mid` whenever `mid*mid <= x`.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'The zero edge case. `lo=0, hi=0`. Mid `0`, `0*0=0 <= 0` → cand `0`, `lo=1`. Exit. Return `0`. A brittle implementation that initialises `lo=1` (to avoid the trivial mid `0`) would never enter the loop for `x=0` and return whatever the candidate default was (often `1` — wrong). Always allow `0` as a candidate and let the loop confirm it.',
      viz_anchor: null,
    },
  ],

  'pow-x-n': [
    {
      inputs: ['2.00000', '10'],
      expected: '1024.00000',
      explanation_md:
        'The canonical LC example. Fast exponentiation: `pow(x, n) = pow(x*x, n/2) * (n%2 == 1 ? x : 1)`. Trace: `pow(2, 10) = pow(4, 5)`. `pow(4, 5) = pow(16, 2) * 4`. `pow(16, 2) = pow(256, 1)`. `pow(256, 1) = pow(65536, 0) * 256 = 1 * 256 = 256`. Chain back: `256 * 4 = 1024`. Total **O(log n)** multiplications. Naive repeated multiplication would take `n` steps, which times out at `n = 2^31`.',
      viz_anchor: null,
    },
    {
      inputs: ['2.10000', '3'],
      expected: '9.26100',
      explanation_md:
        'A floating-point case. `pow(2.1, 3) = pow(4.41, 1) * 2.1 = pow(19.448, 0) * 4.41 * 2.1 = 1 * 4.41 * 2.1 = 9.261`. Proves the algorithm works with non-integer bases; nothing about the recurrence depends on `x` being integer. The trailing zero precision (`9.26100`) is just the problem\'s output format — five decimal places.',
      viz_anchor: null,
    },
    {
      inputs: ['2.00000', '-2'],
      expected: '0.25000',
      explanation_md:
        'The negative-exponent case. `pow(x, -n) = 1 / pow(x, n)`. Convert to `pow(2, 2) = 4`, then return `1/4 = 0.25`. The subtle bug: in C++/Java with 32-bit `n`, the line `n = -n` overflows when `n = INT_MIN = -2^31` because `+2^31` does not fit in `int32_t`. Promote `n` to `long` first, or handle `INT_MIN` as a special case. Python is safe because integers are unbounded.',
      viz_anchor: null,
    },
  ],

  'divide-two-integers': [
    {
      inputs: ['10', '3'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Division without `/` or `%`: repeatedly subtract `divisor` doubled until it exceeds the remaining `dividend`. `10 - 3 = 7` (quotient `1`); `7 - 6 = 1` (quotient `1+2=3`); `3*4 = 12 > 1`, stop. Truncate toward zero → return `3`. The doubling makes it **O(log²)** instead of **O(quotient)**. Naive subtraction would TLE on `dividend = INT_MAX, divisor = 1`.',
      viz_anchor: null,
    },
    {
      inputs: ['7', '-3'],
      expected: '-2',
      explanation_md:
        'The "mixed signs" case. Determine the sign of the answer once (XOR or product check), then work with absolute values. `|7| / |-3| = 2` by the doubling. Apply the negative sign → `-2`. Problem spec truncates toward zero, so `7/-3 = -2`, not `-3`. A brittle implementation using floor division (Python `//`) would return `-3`, wrong by 1.',
      viz_anchor: null,
    },
    {
      inputs: ['-2147483648', '-1'],
      expected: '2147483647',
      explanation_md:
        'The classic overflow edge case. `INT_MIN / -1 = +2^31`, but `INT_MAX = 2^31 - 1`. The problem requires clamping to `INT_MAX` to avoid overflow. The brittle implementation that computes `-(-2147483648)` to take the absolute value silently overflows back to `-2147483648` and returns the wrong sign. Always special-case this single input up front: if `dividend == INT_MIN && divisor == -1`, return `INT_MAX`.',
      viz_anchor: null,
    },
  ],

  'multiply-strings': [
    {
      inputs: ['"2"', '"3"'],
      expected: '"6"',
      explanation_md:
        'The canonical small LC example. Grade-school multiplication digit by digit, accumulating into a result array of size `m + n`. `2 * 3 = 6`, write at position `m+n-1`. No carry. Return `"6"`. The key invariant: position `i + j + 1` is where the product of digit `num1[i]` and `num2[j]` accumulates, with carry going to `i + j`. **O(m·n)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['"123"', '"456"'],
      expected: '"56088"',
      explanation_md:
        'A multi-digit case proving carries propagate correctly. `123 * 456 = 56088`. The result array (5 digits) accumulates partial products from each pair. After all `9` digit-pair multiplications and carries, trim leading zeros. Return `"56088"`. Proves both that the algorithm handles arbitrary-length integers (beyond `INT_MAX`) and that positional accumulation works without explicit shifting — each `(i,j)` writes to a deterministic index.',
      viz_anchor: null,
    },
    {
      inputs: ['"0"', '"52"'],
      expected: '"0"',
      explanation_md:
        'The zero edge case. Any number times `0` is `0`. The naive algorithm computes the result array as all zeros, then the trim-leading-zeros step would empty the string entirely. A brittle implementation returning an empty string is wrong. The fix: after trimming, if the result is empty, return `"0"`. Alternatively, short-circuit when either input is `"0"` before running the multiplication loop.',
      viz_anchor: null,
    },
  ],

  'add-binary': [
    {
      inputs: ['"11"', '"1"'],
      expected: '"100"',
      explanation_md:
        'The canonical LC example. Walk both strings from the right, sum digits plus carry, append the bit, propagate the carry. `1+1+0 = 2 → bit 0, carry 1`. `1+_+1 = 2 → bit 0, carry 1`. `_+_+1 = 1 → bit 1, carry 0`. Reverse → `"100"`. **O(max(m,n))** time. The brittle implementation `bin(int(a, 2) + int(b, 2))[2:]` works in Python but fails in C++/Java for strings longer than `64` bits.',
      viz_anchor: null,
    },
    {
      inputs: ['"1010"', '"1011"'],
      expected: '"10101"',
      explanation_md:
        'A multi-digit case proving carries chain correctly. `1010 + 1011`: rightmost `0+1=1`, no carry. Next `1+1=2 → 0, carry 1`. Next `0+0+1=1, carry 0`. Next `1+1=2 → 0, carry 1`. Carry remaining → leading `1`. Reverse → `"10101"`. Decimal check: `10 + 11 = 21 = 0b10101`. Proves the loop must continue while either pointer is in bounds OR carry remains, not just while both pointers are in bounds.',
      viz_anchor: null,
    },
    {
      inputs: ['"0"', '"0"'],
      expected: '"0"',
      explanation_md:
        'The zero edge case. `0+0+0=0`, no carry. Result is `"0"`. A brittle implementation that strips leading zeros at the end would return `""` here. The fix: handle the special case where the result is empty by returning `"0"`, or never strip the only digit. The cleanest version builds the result without ever creating extra leading zeros to strip.',
      viz_anchor: null,
    },
  ],

  'product-of-array-except-self': [
    {
      inputs: ['[1,2,3,4]'],
      expected: '[24,12,8,6]',
      explanation_md:
        'The canonical LC example. Two passes, no division. Left pass: `result[i] = product of nums[0..i-1]`. So `result = [1, 1, 2, 6]`. Right pass: multiply each by the product of `nums[i+1..n-1]` running right-to-left. Right product starts at `1`. `result[3] = 6*1 = 6, rp=4`. `result[2] = 2*4 = 8, rp=12`. `result[1] = 1*12 = 12, rp=24`. `result[0] = 1*24 = 24`. Return `[24,12,8,6]`. **O(n)** time, **O(1)** extra space.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,1,0,-3,3]'],
      expected: '[0,0,9,0,0]',
      explanation_md:
        'The "contains a zero" case. The naive `total_product / nums[i]` approach divides by zero at index `2`. The two-pass left-right algorithm handles zeros naturally: at index `2`, both the left product (`-1*1=-1`) and the right product (`-3*3=-9`) multiply to `9`. At every other index, one side or the other includes the `0` and forces the answer to `0`. Return `[0, 0, 9, 0, 0]`. This input is the standard proof that division is forbidden.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3]'],
      expected: '[3,2]',
      explanation_md:
        'The smallest valid input (problem says `n >= 2`). Left pass: `result = [1, 2]`. Right pass: `result[1] = 2*1 = 2, rp=3`. `result[0] = 1*3 = 3`. Return `[3, 2]`. Proves the algorithm works at the minimum size without special-casing — both passes simply degenerate to single iterations.',
      viz_anchor: null,
    },
  ],

  'find-the-duplicate-number': [
    {
      inputs: ['[1,3,4,2,2]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Floyd\'s tortoise-and-hare on the "next index" function — treat `nums[i]` as a pointer to the next index. Because some value repeats, the sequence forms a cycle; the entry to the cycle is the duplicate. Phase 1: slow/fast meet inside the cycle. Phase 2: reset slow to start, advance both by 1 step until they meet — at the cycle entry, the duplicate. Trace yields `2`. **O(n)** time, **O(1)** space, doesn\'t modify the input.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,1,3,4,2]'],
      expected: '3',
      explanation_md:
        'A different duplicate value. Same algorithm: treating indices as pointers, the cycle entry is `3`. Trace: `slow=3, fast=4, slow=2, fast=3, slow=3, fast=3` — they meet. Reset `slow=0`, advance: `slow=3, fast=3` — match at `3`. Return `3`. Proves the algorithm finds whichever value duplicates, regardless of how many times it duplicates or where in the array it appears.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: '1',
      explanation_md:
        'The smallest input — two cells, both `1`. The cycle entry is `1`. Phase 1: `slow = nums[0] = 1, fast = nums[nums[0]] = 1` — already met. Phase 2: `slow = 0`, advance once: `slow = 1, fast = 1` — meet at `1`. Return `1`. Proves the algorithm handles the degenerate case where the cycle has length 1 (a self-loop at the duplicate value).',
      viz_anchor: null,
    },
  ],

  'missing-number': [
    {
      inputs: ['[3,0,1]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. XOR trick: XOR all indices `0..n` and all values; pairs cancel, leaving the missing index. Trace: `0 ^ 0 ^ 1 ^ 1 ^ 2 ^ 2 ^ 3 ^ ? = 2 ^ 3 = 1`... wait, simpler approach: sum trick. Expected sum `n*(n+1)/2 = 3*4/2 = 6`. Actual sum `0+1+3 = 4`. Missing `= 6 - 4 = 2`. **O(n)** time, **O(1)** space. The XOR variant avoids potential overflow on huge `n`.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1]'],
      expected: '2',
      explanation_md:
        'The "missing is `n` itself" edge case. Array contains `0, 1`; expected `0, 1, 2`. Sum `0+1=1`, expected `2*3/2=3`, missing `= 2`. Proves the algorithm correctly identifies the missing value at the **end** of the range, not just in the middle. A brittle implementation iterating `0..n-1` and checking `nums.contains(i)` would never check `i=n` and return wrong.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '1',
      explanation_md:
        'The "missing is at the end of a single-element array" case. `n=1`. Expected sum `1`, actual `0`, missing `1`. The brittle implementation that checks for `0` as the missing value first (since arrays usually start at `0`) would return `0` here, but `0` is present. Always compute via the difference between expected and actual sum.',
      viz_anchor: null,
    },
  ],

  'first-missing-positive': [
    {
      inputs: ['[1,2,0]'],
      expected: '3',
      explanation_md:
        'The canonical LC example. The answer must lie in `[1..n+1]`. Use the array itself as a hash by placing each value `v` at index `v-1`. Pass 1: cyclic swaps. After processing, every `nums[i] == i+1` if `i+1` was present. Pass 2: find the first `i` where `nums[i] != i+1` — that index plus 1 is the answer. For `[1,2,0]`: after swaps, `[1, 2, 0]` (already placed). First `i` with `nums[i] != i+1` is `i=2`, return `3`. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,4,-1,1]'],
      expected: '2',
      explanation_md:
        'A case with negatives and large values. Pass 1: at `i=0` val `3`, swap with `nums[2]=-1` → `[-1,4,3,1]`. `i=0` val `-1`, skip. At `i=1` val `4`, swap with `nums[3]=1` → `[-1,1,3,4]`. `i=1` val `1`, swap with `nums[0]=-1` → `[1,-1,3,4]`. `i=1` val `-1`, skip. `i=2` val `3` is in place. `i=3` val `4` is in place. Pass 2: `nums[1] != 2` → return `2`. The negatives and out-of-range values are simply ignored by the in-place hashing.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,8,9,11,12]'],
      expected: '1',
      explanation_md:
        'The "no small positives present" case. None of the values is in `[1..n]`. Pass 1: every value is out of range, no swaps happen. Pass 2: `nums[0] != 1` → return `1`. Proves the algorithm correctly returns the smallest positive `1` when nothing in `[1..n]` is present. A brittle implementation that requires at least one in-range value would crash or loop forever.',
      viz_anchor: null,
    },
  ],

  'subarray-sum-equals-k': [
    {
      inputs: ['[1,1,1]', '2'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Prefix sum + hash map. For each prefix sum `psum`, look up `psum - k` in the map — that count is how many subarrays ending here sum to `k`. Walk: `psum=1`, look up `-1` (0 hits), record `1`. `psum=2`, look up `0` (1 hit — empty prefix), record `1`. `psum=3`, look up `1` (1 hit), record `1`. Total `2`. **O(n)** time. Naive double loop would be **O(n²)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '3'],
      expected: '2',
      explanation_md:
        'A case proving both standalone-element and contiguous-range matches are counted. Subarrays summing to `3`: `[3]` (at index 2) and `[1, 2]` (indices 0-1). Two total. Prefix sums: `1, 3, 6`. Look up `psum-k`: at `psum=1` look up `-2` (0); at `psum=3` look up `0` (1 — empty); at `psum=6` look up `3` (1 — we saw `3`). Total `2`. The empty-prefix trick (`map[0] = 1` at start) is what catches the case where the subarray starts at index 0.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,-1,0]', '0'],
      expected: '3',
      explanation_md:
        'A case with negatives, where multiple subarrays can sum to zero. Prefix sums: `1, 0, 0`. At `psum=1`, look up `1` (0 hits). At `psum=0`, look up `0` (1 hit — empty prefix). At `psum=0` again, look up `0` (now 2 hits — empty and earlier prefix). Total `3`. The matching subarrays are `[1,-1]`, `[0]`, `[1,-1,0]`. This proves negatives prevent the sliding-window approach (which assumes monotonic sums) — only prefix-sum hashing works.',
      viz_anchor: null,
    },
  ],

  'range-sum-query-immutable': [
    {
      inputs: ['["NumArray","sumRange","sumRange","sumRange"]', '[[[-2,0,3,-5,2,-1]],[0,2],[2,5],[0,5]]'],
      expected: '[null,1,-1,-3]',
      explanation_md:
        'The canonical LC example. Precompute prefix sums in the constructor so each query is **O(1)**. `prefix = [0, -2, -2, 1, -4, -2, -3]`. `sumRange(l, r) = prefix[r+1] - prefix[l]`. Queries: `sumRange(0,2) = prefix[3] - prefix[0] = 1 - 0 = 1`. `sumRange(2,5) = prefix[6] - prefix[2] = -3 - (-2) = -1`. `sumRange(0,5) = prefix[6] - prefix[0] = -3`. The constructor pays **O(n)** once; thousands of queries then run in constant time each.',
      viz_anchor: null,
    },
    {
      inputs: ['["NumArray","sumRange"]', '[[[5]],[0,0]]'],
      expected: '[null,5]',
      explanation_md:
        'The single-element edge case. `prefix = [0, 5]`. `sumRange(0, 0) = prefix[1] - prefix[0] = 5 - 0 = 5`. Proves the prefix-sum indexing works at the minimum size — the off-by-one trick of `prefix` having length `n+1` and starting with `0` is what avoids special-casing the leftmost query position.',
      viz_anchor: null,
    },
    {
      inputs: ['["NumArray","sumRange","sumRange"]', '[[[1,2,3,4,5]],[1,3],[0,4]]'],
      expected: '[null,9,15]',
      explanation_md:
        'A second case. `prefix = [0, 1, 3, 6, 10, 15]`. `sumRange(1,3) = prefix[4] - prefix[1] = 10 - 1 = 9`. `sumRange(0,4) = prefix[5] - prefix[0] = 15`. Proves the formula handles both interior ranges and the full-array case correctly. The naive iteration approach would re-sum elements on every call, slow for many queries on long arrays.',
      viz_anchor: null,
    },
  ],

  'range-sum-query-2d-immutable': [
    {
      inputs: ['["NumMatrix","sumRegion","sumRegion","sumRegion"]', '[[[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]],[2,1,4,3],[1,1,2,2],[1,2,2,4]]'],
      expected: '[null,8,11,12]',
      explanation_md:
        'The canonical LC example. 2D prefix sums let each query run in **O(1)**. Build `P[i][j] = sum of matrix[0..i-1][0..j-1]` using inclusion-exclusion. Query: `sumRegion(r1, c1, r2, c2) = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`. Three queries return `8, 11, 12`. The constructor is **O(m·n)** once; each query is constant time.',
      viz_anchor: null,
    },
    {
      inputs: ['["NumMatrix","sumRegion"]', '[[[[5]]],[0,0,0,0]]'],
      expected: '[null,5]',
      explanation_md:
        'The single-cell edge case. `P = [[0, 0], [0, 5]]`. `sumRegion(0,0,0,0) = P[1][1] - P[0][1] - P[1][0] + P[0][0] = 5 - 0 - 0 + 0 = 5`. Proves the inclusion-exclusion formula handles the smallest non-trivial query without needing special-casing for single cells.',
      viz_anchor: null,
    },
    {
      inputs: ['["NumMatrix","sumRegion"]', '[[[[1,2],[3,4]]],[0,0,1,1]]'],
      expected: '[null,10]',
      explanation_md:
        'A 2x2 sum over the full matrix. `P = [[0,0,0],[0,1,3],[0,4,10]]`. `sumRegion(0,0,1,1) = P[2][2] - P[0][2] - P[2][0] + P[0][0] = 10 - 0 - 0 + 0 = 10`. Decimal check: `1+2+3+4 = 10`. Proves the inclusion-exclusion correctly aggregates the full rectangle as a degenerate sub-case of the general formula.',
      viz_anchor: null,
    },
  ],

  'bitwise-and-of-numbers-range': [
    {
      inputs: ['5', '7'],
      expected: '4',
      explanation_md:
        'The canonical LC example. The AND of `[left, right]` equals the **common binary prefix** of `left` and `right`, padded with zeros. Shift both right until equal, counting shifts; then shift the result back left. `5=0b101, 7=0b111`. Shift both right: `2, 3`. Again: `1, 1` (matched after 2 shifts). Shift `1 << 2 = 4`. Return `4`. **O(log n)** time. Naive AND of every number in range would TLE for huge ranges.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '0'],
      expected: '0',
      explanation_md:
        'The zero edge case. Both numbers are `0`. The "shift until equal" loop exits immediately because they already match. Return `0 << 0 = 0`. A brittle implementation that requires at least one shift would crash on `left == right` cases. The loop condition `left != right` handles it cleanly.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '2147483647'],
      expected: '0',
      explanation_md:
        'The "range crosses a power of 2" extreme. `1 = 0b...0001` and `2147483647 = 0b0111...1`. They share zero high bits in common (the MSB differs once we shift), so after 31 shifts both become `0`, and the result is `0`. Proves the algorithm gracefully handles ranges that span multiple bit-widths, returning `0` whenever the range crosses any power of 2 (which destroys all high bits).',
      viz_anchor: null,
    },
  ],

  'counting-bits': [
    {
      inputs: ['2'],
      expected: '[0,1,1]',
      explanation_md:
        'The canonical small LC example. DP recurrence: `bits[i] = bits[i >> 1] + (i & 1)` — the number of set bits in `i` equals the bits in `i/2` plus the lowest bit. `bits[0] = 0`. `bits[1] = bits[0] + 1 = 1`. `bits[2] = bits[1] + 0 = 1`. Return `[0, 1, 1]`. **O(n)** time. The naive `popcount` per integer is **O(n log n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '[0,1,1,2,1,2]',
      explanation_md:
        'A larger case proving the recurrence over multiple levels. `bits[3] = bits[1] + 1 = 2`. `bits[4] = bits[2] + 0 = 1`. `bits[5] = bits[2] + 1 = 2`. Return `[0,1,1,2,1,2]`. Decimal check: `5 = 0b101` has 2 set bits. The recurrence works because dividing by 2 is the same as right-shifting, which drops the lowest bit; the count of that dropped bit is just `i & 1`.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '[0]',
      explanation_md:
        'The smallest valid input. Just `bits[0] = 0`. The recurrence loop runs `for i in 1..0`, which is empty. Return `[0]`. A brittle implementation that always seeds `bits[1]` would crash here. The base case (initialise the array of length `n+1` with zeros) handles it naturally.',
      viz_anchor: null,
    },
  ],

  'power-of-two': [
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'The smallest valid case. `1 = 2^0`. Bit trick: `n > 0 && (n & (n-1)) == 0`. For `n=1`: `n-1 = 0`, `1 & 0 = 0` → return `true`. The brittle `log2(n) % 1 == 0` approach loses precision near large `n`. The bit trick is exact and **O(1)**.',
      viz_anchor: null,
    },
    {
      inputs: ['16'],
      expected: 'true',
      explanation_md:
        'A standard positive case. `16 = 0b10000 = 2^4`. `n-1 = 15 = 0b01111`. `16 & 15 = 0` → return `true`. The bit trick works because powers of two have exactly one bit set, and `n-1` flips that bit to `0` and turns all lower bits to `1` — ANDing them yields zero.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: 'false',
      explanation_md:
        'The zero edge case. `0` is not a power of two (there is no `k` such that `2^k = 0`). The `n > 0` guard catches it; without it, `0 & (-1) = 0` would falsely return `true`. The guard is essential. A brittle implementation that only checks `(n & (n-1)) == 0` would return `true` for `0` and any number where the bit-trick coincidentally matches — `0` is the canonical adversarial input.',
      viz_anchor: null,
    },
  ],

  'power-of-three': [
    {
      inputs: ['27'],
      expected: 'true',
      explanation_md:
        'A standard positive case. `27 = 3^3`. The cleanest test: the largest power of 3 fitting in `int32` is `3^19 = 1162261467`. If `n > 0 && 1162261467 % n == 0`, then `n` is a power of 3. `1162261467 / 27 = 43046721` (exact), so return `true`. **O(1)**, no loops. The loop-divide-by-3 approach is also correct but slower.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'The smallest valid case. `1 = 3^0`. `1162261467 % 1 == 0` → return `true`. Proves the "anything mod 1 is 0" property does not produce a false positive — `1` is genuinely `3^0` and the spec accepts it.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: 'false',
      explanation_md:
        'The zero edge case. `0` is not a power of three. The `n > 0` guard catches it; without it, `1162261467 % 0` would be a division by zero crash. The guard is mandatory. A brittle implementation that uses the loop-divide approach (`while n%3==0: n /= 3; return n == 1`) would also need a `n != 0` check up front, else it returns `false` only because `0 != 1` — accidental correctness for the wrong reason.',
      viz_anchor: null,
    },
  ],

  'power-of-four': [
    {
      inputs: ['16'],
      expected: 'true',
      explanation_md:
        'A standard positive case. `16 = 4^2 = 0b10000`. Powers of 4 are powers of 2 with the set bit in an **even** position. Test: `n > 0 && (n & (n-1)) == 0 && (n & 0x55555555) != 0`. The mask `0x55555555` has bits set at even positions only. For `n=16`: power of 2 ✓, `16 & 0x55555555 = 16` (bit 4 is set, position 4 is even) ✓. Return `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['8'],
      expected: 'false',
      explanation_md:
        'The classic "power of 2 but not power of 4" case. `8 = 2^3 = 0b1000`. Power of 2 ✓, but `8 & 0x55555555 = 0` because bit 3 is at an odd position. Return `false`. Proves the even-bit mask is what distinguishes powers of 4 from other powers of 2. Without it, the algorithm would falsely accept `8, 32, 128, ...`.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'The smallest valid case. `1 = 4^0`. Power of 2 ✓ (`1 & 0 = 0`). `1 & 0x55555555 = 1` (bit 0, even position) ✓. Return `true`. Proves the algorithm includes `1` as a power of 4. A brittle implementation that requires the input to be `>= 4` would miss this case.',
      viz_anchor: null,
    },
  ],

  'reverse-bits': [
    {
      inputs: ['00000010100101000001111010011100'],
      expected: '964176192',
      explanation_md:
        'The canonical LC example. Take the input as a 32-bit unsigned integer, reverse its bits, return the result as an integer. Walk 32 iterations: at step `i`, extract bit `i` from input, place at position `31-i` of the result. Input `43261596 = 0b00000010100101000001111010011100`. Reversed `= 0b00111001011110000010100101000000 = 964176192`. **O(32) = O(1)** time. Cache-based 8-bit lookup is even faster for repeated calls.',
      viz_anchor: null,
    },
    {
      inputs: ['11111111111111111111111111111101'],
      expected: '3221225471',
      explanation_md:
        'The "many bits set" case. Input `4294967293` (all bits except bit 1). Reversing produces `3221225471` (bit 30 cleared, all others set). Trace verification: input `0b11111111111111111111111111111101`; reverse → `0b10111111111111111111111111111111`, which equals `3221225471`. Proves the algorithm correctly handles inputs with many set bits without losing any in the reversal.',
      viz_anchor: null,
    },
    {
      inputs: ['00000000000000000000000000000001'],
      expected: '2147483648',
      explanation_md:
        'The "single low bit" case. Input `1 = 0b...0001`. Reversed, the lone bit at position 0 moves to position 31 → `2^31 = 2147483648`. Proves the algorithm produces results that fit in **unsigned** 32-bit but exceed signed `INT_MAX`. In C++/Java, the return type must be unsigned or `long`; in Python, integers are arbitrary precision so it just works.',
      viz_anchor: null,
    },
  ],

  'sum-of-two-integers': [
    {
      inputs: ['1', '2'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Add without `+` or `-` using XOR + AND. `a^b` gives the sum without carries; `(a&b) << 1` gives the carries. Loop: while carry is nonzero, set `a = a^b, b = carry`. `1^2 = 3` (XOR), `1&2 << 1 = 0`. Carry is `0`, exit. Return `3`. **O(32) = O(1)** worst case (at most 32 carry propagations).',
      viz_anchor: null,
    },
    {
      inputs: ['2', '3'],
      expected: '5',
      explanation_md:
        'A case where carry propagation occurs. `2 = 0b10, 3 = 0b11`. `a^b = 0b01 = 1`. `(a&b) << 1 = 0b10 << 1 = 0b100 = 4`. Loop: `a=1, b=4`. `a^b = 5`, `(a&b)<<1 = 0`. Exit. Return `5`. Proves the recurrence terminates exactly when carries are exhausted — at most 32 iterations on 32-bit integers.',
      viz_anchor: null,
    },
    {
      inputs: ['-1', '1'],
      expected: '0',
      explanation_md:
        'The "negatives and two\'s complement" case. `-1 = 0xFFFFFFFF, 1 = 0x00000001`. `a^b = 0xFFFFFFFE`. `(a&b)<<1 = 0x00000002`. Loop with rising carry: after 32 iterations the carry shifts off the 32-bit edge. Return `0`. In Python, the trick requires masking with `0xFFFFFFFF` each step and interpreting the final result as signed (`a if a < 2^31 else a - 2^32`); in C++/Java the native overflow does it automatically.',
      viz_anchor: null,
    },
  ],

  'single-number-ii': [
    {
      inputs: ['[2,2,3,2]'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Every element appears 3 times except one — find the unique. Bitwise approach: for each of 32 bit positions, count how many input values have that bit set, modulo 3. The bits where the remainder is 1 form the unique. For position 0: counts `0+0+1+0 = 1, mod 3 = 1`. Position 1: counts `1+1+1+1 = 4, mod 3 = 1`. All other positions: 0. Result `0b11 = 3`. **O(32n) = O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,0,1,0,1,99]'],
      expected: '99',
      explanation_md:
        'A second case. Bits of `99 = 0b1100011`: positions 0, 1, 5, 6. The 0s and 1s each appear 3 times, contributing nothing modulo 3. Each bit of `99` contributes `1 mod 3 = 1`. Result reconstructs `99`. Proves the algorithm is value-agnostic — it works regardless of the magnitude or sign of the unique value.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-element edge case. Only one value, trivially the unique. Each bit count modulo 3 equals the bit itself. Result `1`. Proves the algorithm handles `n=1` without needing the "triplets" structure; the modular bit-count framework degenerates gracefully.',
      viz_anchor: null,
    },
  ],

  'single-number-iii': [
    {
      inputs: ['[1,2,1,3,2,5]'],
      expected: '[3,5]',
      explanation_md:
        'The canonical LC example. Two unique values, all others appear twice. XOR all → `xor = a^b` where `a, b` are the uniques (here `3^5 = 6 = 0b110`). Pick any set bit of `xor` (e.g. lowest: `xor & -xor`). Partition the array by that bit — each unique falls into a different partition; the duplicates cancel within each. XOR each partition to recover one unique. Result `[3, 5]`. **O(n)** time, **O(1)** space.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,0]'],
      expected: '[-1,0]',
      explanation_md:
        'A minimal case with mixed signs. `xor = -1 ^ 0 = -1` (all bits set in two\'s complement). Lowest set bit: `1`. Partition: `0` (bit 0 unset) and `-1` (bit 0 set, since `-1` has all bits set). XOR each → `0` and `-1`. Return `[-1, 0]` (order may vary; problem accepts either). Proves negatives are handled correctly because XOR is bitwise and signed/unsigned distinctions are immaterial.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1]'],
      expected: '[1,0]',
      explanation_md:
        'The smallest case with the two uniques being `0` and `1`. `xor = 0^1 = 1`. Lowest set bit: `1`. Partition: `0` (bit 0 unset) → XOR is `0`; `1` (bit 0 set) → XOR is `1`. Return `[1, 0]`. Proves the partition trick works when one of the uniques is `0`. The brittle implementation that uses any bit other than a set bit of `xor` would put both uniques in the same partition and fail.',
      viz_anchor: null,
    },
  ],

  'excel-sheet-column-number': [
    {
      inputs: ['"A"'],
      expected: '1',
      explanation_md:
        'The smallest valid case. `A = 1`. Walk the string left-to-right, treat as base-26 with digits `A=1..Z=26`. For each char: `result = result * 26 + (char - \'A\' + 1)`. For `"A"`: `0 * 26 + 1 = 1`. Return `1`. **O(n)** time where `n` is the string length.',
      viz_anchor: null,
    },
    {
      inputs: ['"AB"'],
      expected: '28',
      explanation_md:
        'A two-letter case. `AB` represents `1 * 26 + 2 = 28`. Trace: `result = 0`. Process `A`: `result = 0 * 26 + 1 = 1`. Process `B`: `result = 1 * 26 + 2 = 28`. Return `28`. Proves the Excel numbering is **not** zero-indexed base-26 — there is no "leading zero" character, so `A` after another letter contributes `(0+1)*26`, not `0`. This makes Excel base-26 a "bijective" numeral system.',
      viz_anchor: null,
    },
    {
      inputs: ['"ZY"'],
      expected: '701',
      explanation_md:
        'A case at the boundary between two- and three-letter codes. `ZY = 26 * 26 + 25 = 701`. Trace: `result = 0`. Process `Z`: `result = 0 * 26 + 26 = 26`. Process `Y`: `result = 26 * 26 + 25 = 676 + 25 = 701`. Return `701`. The next column is `ZZ = 702`, then `AAA = 703`. The bijective nature is what allows the formula to handle the transition without special-casing.',
      viz_anchor: null,
    },
  ],

  'excel-sheet-column-title': [
    {
      inputs: ['1'],
      expected: '"A"',
      explanation_md:
        'The smallest valid input. `1 → A`. Loop: while `n > 0`, subtract 1, take mod 26 to get the next letter, divide by 26. For `n=1`: `n-1=0`, mod 26 = 0 → letter `A`, `n = 0/26 = 0`. Exit. Reverse the buffer (we built right-to-left). Return `"A"`. The `n - 1` step is the inverse of the bijective numbering — it shifts the range from `1..26` to `0..25` so mod-26 works.',
      viz_anchor: null,
    },
    {
      inputs: ['28'],
      expected: '"AB"',
      explanation_md:
        'A two-letter result. `n=28`. Iter 1: `n-1=27`, mod 26 = 1 → `B`, `n = 27/26 = 1`. Iter 2: `n-1=0`, mod 26 = 0 → `A`, `n = 0`. Reverse → `"AB"`. Round-trips against the column-number problem: `AB → 28`. Proves the `n - 1` adjustment correctly handles the "carry" that would otherwise produce `Z` followed by something nonsensical.',
      viz_anchor: null,
    },
    {
      inputs: ['701'],
      expected: '"ZY"',
      explanation_md:
        'A boundary case. `n=701`. Iter 1: `n-1=700`, mod 26 = 24 → `Y`, `n = 700/26 = 26`. Iter 2: `n-1=25`, mod 26 = 25 → `Z`, `n = 25/26 = 0`. Reverse → `"ZY"`. The brittle implementation that does `n % 26` (without the `n-1`) would produce `Z` then need a hack to "borrow" — the clean version uses bijective base-26 throughout.',
      viz_anchor: null,
    },
  ],

  'factorial-trailing-zeroes': [
    {
      inputs: ['3'],
      expected: '0',
      explanation_md:
        'A small case. `3! = 6`, which has zero trailing zeros. The trick: trailing zeros in `n!` come from factors of 10 = 2 * 5, and there are always more factors of 2 than 5, so count factors of 5. For `n=3`: `3/5 = 0`. Return `0`. **O(log_5 n)** time, far faster than computing the full factorial.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '1',
      explanation_md:
        'A case where exactly one factor of 5 contributes. `5! = 120`, one trailing zero. Count: `5/5 = 1`, `5/25 = 0`. Total `1`. Return `1`. Proves the formula `sum(n / 5^k for k=1, 2, ...)` correctly counts compound factors — for small `n`, only the first term matters.',
      viz_anchor: null,
    },
    {
      inputs: ['30'],
      expected: '7',
      explanation_md:
        'A case where higher powers of 5 contribute. `30/5 = 6` (from 5, 10, 15, 20, 25, 30), `30/25 = 1` (extra factor from 25). Total `7`. Return `7`. Proves the iterative `while n > 0: n /= 5; count += n` formulation correctly captures both first-order and higher-order contributions. A brittle implementation using only `n / 5` would return `6` here.',
      viz_anchor: null,
    },
  ],

  'count-primes': [
    {
      inputs: ['10'],
      expected: '4',
      explanation_md:
        'The canonical LC example. Count primes **strictly less than** `n`. Use the Sieve of Eratosthenes: array `isPrime[0..n-1]` initially `true`. Set `isPrime[0] = isPrime[1] = false`. For `i = 2..sqrt(n)`, if `isPrime[i]`, mark all multiples `i*i, i*i+i, ...` as composite. Count remaining `true`. For `n=10`: primes are `2, 3, 5, 7`. Return `4`. **O(n log log n)** time — much faster than trial-dividing each `i < n`.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'The zero edge case. No primes less than `0`. The sieve setup short-circuits when `n <= 2` because the marking loop starts at `i=2` and bounds `i < n`. Return `0`. A brittle implementation that always allocates an array of size `n` would crash on `n=0`. The guard `if n <= 2 return 0` is the cleanest fix.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '0',
      explanation_md:
        'The "smallest prime is excluded" edge case. The problem asks for primes **strictly less than** `n`, so `n=2` returns `0` (no primes < 2). A brittle implementation that returns `1` here (counting `2` as a prime) is off by one. The strict inequality in the problem statement is what distinguishes this from the "count primes up to n" problem.',
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
