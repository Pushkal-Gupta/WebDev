#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 7 (30 fresh problems, spread across Easy/Medium/Hard).
// Same shape as batches 1..6: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Selected only problems whose explained_samples was empty and that hold >=3 graded test cases.
// Run: node scripts/backfill-explained-samples-batch7.mjs

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
  'gcd': [
    {
      inputs: ['48', '18'],
      expected: '6',
      explanation_md:
        'Euclid\'s algorithm: replace the pair `(a, b)` with `(b, a mod b)` until the second number is `0`; the surviving first number is the GCD. Trace `gcd(48, 18)`: `48 mod 18 = 12` gives `gcd(18, 12)`. `18 mod 12 = 6` gives `gcd(12, 6)`. `12 mod 6 = 0` gives `gcd(6, 0)`, stop. Return `6`. Each step strictly shrinks the numbers, so it terminates in **O(log min(a,b))** iterations, far faster than trial-dividing every candidate from `min(a,b)` downward.',
      viz_anchor: null,
    },
    {
      inputs: ['7', '13'],
      expected: '1',
      explanation_md:
        'Two coprime numbers, whose only common divisor is `1`. Trace: `gcd(7, 13)`. `7 mod 13 = 7` gives `gcd(13, 7)`. `13 mod 7 = 6` gives `gcd(7, 6)`. `7 mod 6 = 1` gives `gcd(6, 1)`. `6 mod 1 = 0` gives `gcd(1, 0)`, stop, return `1`. Proves the algorithm correctly reports `1` when no shared factor exists. The first swap is automatic: when `a < b`, `a mod b = a`, which simply flips the pair on the next step.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '5'],
      expected: '5',
      explanation_md:
        'The zero edge case. By definition `gcd(0, n) = n`, because every number divides `0`, so the largest common divisor is `n` itself. Trace: `gcd(0, 5)`. `0 mod 5 = 0` gives `gcd(5, 0)`, the second argument is `0`, stop, return `5`. Proves the recursion bottoms out correctly when one input is `0`. An implementation that loops `while b != 0` and computes `a mod b` still lands here in a single step.',
      viz_anchor: null,
    },
  ],

  'power': [
    {
      inputs: ['2', '10'],
      expected: '1024',
      explanation_md:
        'Fast exponentiation by squaring. Instead of multiplying `x` by itself `n` times in **O(n)**, square the base and halve the exponent: `x^n = (x^2)^(n/2)` for even `n`, peeling off one factor when `n` is odd. Trace `2^10`: `2^10 = 4^5 = 4 * 4^4 = 4 * 16^2 = 4 * 256 = 1024`. Only about `log2(10)` is roughly 4 multiplications instead of 10. Return `1024`. **O(log n)** time, **O(1)** space iteratively.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '0'],
      expected: '1',
      explanation_md:
        'The zero-exponent edge case. Any base raised to the power `0` is `1` by definition. The loop condition `while n > 0` never fires, the accumulated result stays at its initial value `1`, and the function returns `1`. Proves the algorithm handles `n = 0` without special-casing: the multiplicative identity seeds the accumulator. An implementation that multiplies once before the loop would wrongly return `2` here.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '100'],
      expected: '1',
      explanation_md:
        'A base of `1` with a large exponent. `1` squared is still `1`, so every step of the squaring loop leaves the result at `1`. Even though `n = 100` triggers about 7 iterations, each multiplies by a power of `1`. Return `1`. Proves the algorithm stays correct and never overflows when the base cannot grow, a useful sanity case that a naive **O(n)** loop would also pass but in 100 iterations versus 7.',
      viz_anchor: null,
    },
  ],

  'base-7': [
    {
      inputs: ['100'],
      expected: '"202"',
      explanation_md:
        'Convert to base 7 by repeated division: divide by `7`, prepend the remainder, repeat until the quotient is `0`. Trace `100`: `100 / 7 = 14` remainder `2`. `14 / 7 = 2` remainder `0`. `2 / 7 = 0` remainder `2`. Reading remainders bottom-up gives `"202"`. Check: `2*49 + 0*7 + 2 = 98 + 2 = 100`. Return `"202"`. **O(log n)** divisions. The remainders are produced least-significant-first, so they must be reversed or prepended.',
      viz_anchor: null,
    },
    {
      inputs: ['-7'],
      expected: '"-10"',
      explanation_md:
        'A negative input. Convert the absolute value, then prepend a minus sign. Trace `|-7| = 7`: `7 / 7 = 1` remainder `0`. `1 / 7 = 0` remainder `1`. Digits bottom-up are `"10"`. Reattach the sign to get `"-10"`. Check: `-(1*7 + 0) = -7`. Proves the algorithm handles the sign separately from digit extraction. An implementation that takes `mod` of a negative number directly would produce a wrong remainder in many languages.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '"0"',
      explanation_md:
        'The zero edge case. The division loop `while num != 0` never runs, leaving an empty digit string. The function must special-case this and return `"0"` directly. Proves why the `num == 0` guard is mandatory: without it the answer would be the empty string instead of `"0"`. Every number-to-string base conversion needs exactly this single guard at the top before the division loop.',
      viz_anchor: null,
    },
  ],

  'fibonacci': [
    {
      inputs: ['5'],
      expected: '5',
      explanation_md:
        'The Fibonacci sequence: `F(0)=0`, `F(1)=1`, `F(n)=F(n-1)+F(n-2)`. Compute iteratively with two rolling variables `a=0, b=1`, updating `(a, b) = (b, a+b)` `n` times. Trace for `n=5`: start `a=0,b=1`. Step 1 gives `(1,1)`, step 2 `(1,2)`, step 3 `(2,3)`, step 4 `(3,5)`, step 5 `(5,8)`. Return `a=5`. **O(n)** time, **O(1)** space. The naive recursion recomputes subproblems exponentially; the rolling pair collapses it to linear.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'The base case. `F(0) = 0` by definition. With the rolling pair seeded at `a=0, b=1`, the update loop runs zero times, so `a` keeps its initial value `0` and that is returned. Proves the algorithm correctly returns the first seed without iterating even once. An implementation that always runs at least one update step before reading the answer would wrongly return `1` here, a classic off-by-one error at the loop boundary that this smallest case is designed to catch.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '1',
      explanation_md:
        'The first non-trivial term. `F(2) = F(1) + F(0) = 1 + 0 = 1`. Trace with the rolling pair `a=0,b=1`: step 1 gives `(1,1)`, step 2 gives `(1,2)`, return `a=1`. Proves the recurrence is wired correctly at the boundary where both seeds first combine. Off-by-one errors in the loop count surface here: running the loop `n+1` times instead of `n` would return `2`.',
      viz_anchor: null,
    },
  ],

  'factorial': [
    {
      inputs: ['5'],
      expected: '120',
      explanation_md:
        'Factorial multiplies every integer from `1` to `n`. Iterative accumulation: start `result = 1`, multiply by each `i` from `2` to `n`. Trace `5!`: `1 * 2 = 2`, then `* 3 = 6`, `* 4 = 24`, `* 5 = 120`. Return `120`. **O(n)** time, **O(1)** space. The accumulator seeds at `1`, the multiplicative identity, which is exactly why `0!` and `1!` both come out as `1` with no special-casing needed.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '1',
      explanation_md:
        'The `0!` edge case, defined as `1`, the empty product. The accumulation loop from `2` to `0` never executes, leaving `result` at its seed value `1`. Return `1`. Proves why seeding the accumulator at `1` is the entire trick: the empty-range product is the identity element. An implementation that initializes `result = n` would wrongly return `0` here, since it would multiply by zero.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '6',
      explanation_md:
        'A small case showing the multiply-chain. `3! = 1 * 2 * 3`. Trace: `result=1`, multiply by `2` to get `2`, multiply by `3` to get `6`. Return `6`. Proves the loop bounds are inclusive of `n`: stopping at `i < n` instead of `i <= n` would return `2`. The recursive form `n * factorial(n-1)` produces the same chain, bottoming out at `factorial(0) = 1`.',
      viz_anchor: null,
    },
  ],

  'leap-year': [
    {
      inputs: ['2000'],
      expected: 'true',
      explanation_md:
        'A year is a leap year if divisible by `4`, except centuries, which must also be divisible by `400`. Trace `2000`: divisible by `4`? yes. Divisible by `100`? yes, so it must clear the `400` gate. Divisible by `400`? `2000 / 400 = 5` exactly, yes. So `2000` is a leap year. Return `true`. This is the famous case that catches the naive "divisible by 4" rule: `2000` survives only because it also passes the `400` exception.',
      viz_anchor: null,
    },
    {
      inputs: ['1900'],
      expected: 'false',
      explanation_md:
        'The century trap. `1900` is divisible by `4` (quotient `475`), so the naive rule would call it a leap year. But it is also divisible by `100`, triggering the exception, and `1900 / 400 = 4.75` is not exact, so it fails the `400` gate. Return `false`. Proves the century exception is essential: this exact pair, `1900` false and `2000` true, distinguishes a correct implementation from the "divisible by 4" shortcut.',
      viz_anchor: null,
    },
    {
      inputs: ['2023'],
      expected: 'false',
      explanation_md:
        'A plain non-leap year. `2023 mod 4 = 3`, so it fails the very first divisibility test and the century rules never come into play. Return `false`. Proves the common path short-circuits cleanly: three years out of every four exit at the first check. The full century rule only matters for the minority of years that are divisible by `4`.',
      viz_anchor: null,
    },
  ],

  'add-digits': [
    {
      inputs: ['38'],
      expected: '2',
      explanation_md:
        'Repeatedly sum the digits until a single digit remains. Trace `38`: `3 + 8 = 11`, then `1 + 1 = 2`. Return `2`. The **O(1)** trick is the digital root: for `n > 0`, the answer is `1 + (n - 1) mod 9`. Check: `1 + (38 - 1) mod 9 = 1 + 37 mod 9 = 1 + 1 = 2`. Both the iterative loop and the closed form agree, because a number is congruent to its digit sum modulo `9`.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'The zero edge case. A single-digit input is already its own digital root, so `0` returns `0`. The closed form `1 + (n-1) mod 9` must be guarded: plugging `n = 0` would give a wrong value, so the formula applies only for `n > 0` and `0` is returned directly. Proves the `n == 0` special case is mandatory for the constant-time version. The iterative loop handles it naturally with no summing.',
      viz_anchor: null,
    },
    {
      inputs: ['18'],
      expected: '9',
      explanation_md:
        'A multiple of `9`. Trace iteratively: `1 + 8 = 9`, already a single digit, return `9`. The closed form: `1 + (18 - 1) mod 9 = 1 + 17 mod 9 = 1 + 8 = 9`. Proves the digital root of any positive multiple of `9` is `9`, not `0`. The `1 + (n-1) mod 9` shaping is what avoids the off-by-one that a plain `n mod 9` would produce, which gives `0` here.',
      viz_anchor: null,
    },
  ],

  'move-zeroes': [
    {
      inputs: ['[0,1,0,3,12]'],
      expected: '[1,3,12,0,0]',
      explanation_md:
        'Move all zeros to the end while keeping the order of non-zeros. Two-pointer: a `write` index marks where the next non-zero goes. Scan with `read`; on each non-zero, copy it to `nums[write]` and advance `write`. After the scan, fill the rest with zeros. Trace `[0,1,0,3,12]`: non-zeros in order are `1, 3, 12`, written to indices `0,1,2`. Positions `3,4` get zeroed, giving `[1,3,12,0,0]`. **O(n)** time, **O(1)** space; the relative order is preserved by the single left-to-right pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[0]',
      explanation_md:
        'A single zero. The read scan finds no non-zeros, so the `write` pointer stays at `0` throughout. The fill phase then writes a zero into position `0`, a no-op since that slot is already zero. The result is `[0]`. Proves the algorithm handles an all-zero array of length one cleanly, with no out-of-bounds write and no spurious shift of the element. The `write` pointer simply never advances past the start, so the fill range and the original content coincide exactly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '[1,2,3]',
      explanation_md:
        'A no-zeros case. Every element is non-zero, so each is written straight back to its own index and `write` keeps pace with `read`. After the scan `write == n`, so the zero-fill phase has nothing to do. Result unchanged `[1,2,3]`. Proves the algorithm degrades to a harmless identity copy when no movement is needed; no element is ever displaced from its original position.',
      viz_anchor: null,
    },
  ],

  'add-strings': [
    {
      inputs: ['"11"', '"123"'],
      expected: '"134"',
      explanation_md:
        'Add two numbers given as strings without converting to integers, since they may exceed native int range. Walk both from the right, adding digit-by-digit with a carry. Trace `"11" + "123"`: align right as `_11` and `123`. Units `1+3=4`, tens `1+2=3`, hundreds `0+1=1`, no carry left. Read top-down to get `"134"`. **O(max(m,n))** time. The right-to-left walk plus a carry is the manual long-addition you learned on paper, encoded directly.',
      viz_anchor: null,
    },
    {
      inputs: ['"0"', '"0"'],
      expected: '"0"',
      explanation_md:
        'The zero edge case. Units digit `0 + 0 = 0`, carry `0`, no more digits. Result `"0"`. Proves the algorithm does not emit a leading `0` followed by nothing or an empty string: the single produced digit is exactly right. An implementation that strips leading zeros too aggressively could turn this into the empty string; here the loop writes one digit and stops.',
      viz_anchor: null,
    },
    {
      inputs: ['"99"', '"1"'],
      expected: '"100"',
      explanation_md:
        'The carry-propagation case. Units `9 + 1 = 10`, write `0`, carry `1`. Tens `9 + 0 + carry 1 = 10`, write `0`, carry `1`. No more digits, but the carry is `1`, so write a leading `1`. Read top-down to get `"100"`. Proves the post-loop carry-flush is mandatory: without appending the final carry, the result would be the wrong `"00"`. This is the classic off-by-one a naive implementation drops.',
      viz_anchor: null,
    },
  ],

  'summary-ranges': [
    {
      inputs: ['[0,1,2,4,5,7]'],
      expected: '["0->2","4->5","7"]',
      explanation_md:
        'Collapse a sorted array into its consecutive ranges. Walk with a `start` marker; whenever the next element is not exactly one more than the current, close the run. Trace `[0,1,2,4,5,7]`: `0,1,2` are consecutive, giving `"0->2"`. Break at `4` (not `3`); `4,5` consecutive gives `"4->5"`. Break at `7`; `7` alone gives `"7"`. Result `["0->2","4->5","7"]`. **O(n)** time. Single-element runs render as just the number, multi-element runs as `"a->b"`.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-array edge case. There are no elements to scan, so the loop never starts, no `start` marker is set, and no range is ever opened or closed. The function returns the empty list `[]` directly. Proves the algorithm short-circuits cleanly on empty input. An implementation that reads `nums[0]` to seed `start` before checking the array length would throw an index error here, so the length guard placed before the first element access is mandatory for correctness.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5,7]'],
      expected: '["1","3","5","7"]',
      explanation_md:
        'An all-gaps case. No two adjacent values differ by exactly `1`, so every element is its own singleton range. Each range opens and closes on the same element, then renders as a bare number, giving `["1","3","5","7"]`. Proves the single-element formatting branch fires for every element when no consecutive runs exist anywhere in the input. The `start == end` check at each closure decides between emitting the plain `"x"` form and the two-ended `"a->b"` form, and here it always picks the plain form.',
      viz_anchor: null,
    },
  ],

  'prime-factors': [
    {
      inputs: ['60'],
      expected: '[2,2,3,5]',
      explanation_md:
        'Trial division for the prime factorization. Divide out each factor `d` starting at `2` as many times as it goes, then move on. Trace `60`: `60 / 2 = 30`, `/ 2 = 15` (2 stops dividing). Try `3`: `15 / 3 = 5`. Try `5`: `5 / 5 = 1`. Collected factors `[2,2,3,5]`; check `2*2*3*5 = 60`. **O(sqrt(n))** because once `d*d > n` the remaining `n` (if `> 1`) is itself prime. Repeated factors appear as many times as they divide.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[]',
      explanation_md:
        'The unit edge case. `1` has no prime factors, being neither prime nor composite. The trial-division loop starts with `n = 1`, already at the termination bound, so no divisor ever divides it and nothing is collected. Return `[]`. Proves the algorithm correctly emits the empty list for `1`. An implementation that always appends the final `n > 1` remainder must guard against adding a leftover `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['7'],
      expected: '[7]',
      explanation_md:
        'A prime input. Trial division tries `2` (does not divide `7`), and once the candidate exceeds `sqrt(7)` near `2.6` the loop stops with `n` still `7` and greater than `1`. That leftover `n` is itself prime, so append it, giving `[7]`. Proves the post-loop "remaining n is prime" step is essential: without it, primes larger than `sqrt(original)` would be dropped and the product would be wrong.',
      viz_anchor: null,
    },
  ],

  // ---------- MEDIUM ----------
  'peak': [
    {
      inputs: ['[1,2,3,1]'],
      expected: '2',
      explanation_md:
        'Find any index whose value exceeds both neighbors, with out-of-bounds neighbors treated as negative infinity. Binary search on the slope: compare `nums[mid]` with `nums[mid+1]`. If ascending, a peak lies to the right, so go right; otherwise go left or stay. Trace `[1,2,3,1]`: `mid=1`, `nums[1]=2 < nums[2]=3` ascending, search right; converge on index `2` where `3 > 1`. Return `2`. **O(log n)** time, since a rising slope always points toward a peak.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '0',
      explanation_md:
        'A single element. Both of its neighbors are out of bounds, treated as negative infinity, so the lone element is trivially greater than both and is a valid peak. Binary search collapses immediately with `lo == hi == 0` and never compares anything. Return `0`. Proves the boundary-as-negative-infinity convention makes the single-element case fall out for free, with no special check needed before the binary-search loop begins. The same convention is what lets the algorithm treat the two array ends uniformly with interior positions.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '4',
      explanation_md:
        'A strictly increasing array, so the peak must be the last element, whose right neighbor is negative infinity. Binary search keeps seeing `nums[mid] < nums[mid+1]` (always ascending) and pushes `lo` rightward until it lands on the final index `4`. Return `4`. Proves the "go right when ascending" rule correctly walks an entire monotonic run to its end, since the slope never reverses.',
      viz_anchor: null,
    },
  ],

  '2-sum': [
    {
      inputs: ['[2,7,11,15]', '9'],
      expected: '[0,1]',
      explanation_md:
        'Find the two indices whose values sum to the target. One-pass hash map: for each `nums[i]`, check if `target - nums[i]` was already seen; if so, return the stored index and `i`. Trace `[2,7,11,15]`, target `9`: at `i=0` store `2 -> 0`. At `i=1`, need `9 - 7 = 2`, which is in the map at index `0`, so return `[0,1]`. **O(n)** time, **O(n)** space. The map turns the inner complement search from **O(n)** into **O(1)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,3]', '6'],
      expected: '[0,1]',
      explanation_md:
        'A duplicate-value case. At `i=0` store `3 -> 0`. At `i=1`, the complement `6 - 3 = 3` is already in the map at index `0`, so return `[0,1]`. Proves the one-pass approach uses two distinct indices even when the values are equal, because the first `3` was stored before the second is checked. A two-pass build-then-search that overwrites the key would lose index `0` and break here.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,4,3,0]', '0'],
      expected: '[0,3]',
      explanation_md:
        'A target of `0` with two zeros. At `i=0` store `0 -> 0`. Values `4` and `3` need complements `-4` and `-3`, both absent. At `i=3`, value `0` needs `0 - 0 = 0`, found at index `0`, so return `[0,3]`. Proves the algorithm handles zero targets and zero values correctly: the complement of `0` is `0`, and the earlier index is recalled. Skipping zero-valued keys would miss this pair.',
      viz_anchor: null,
    },
  ],

  'kadane': [
    {
      inputs: ['[-2,1,-3,4,-1,2,1,-5,4]'],
      expected: '6',
      explanation_md:
        'Kadane\'s algorithm for the maximum contiguous subarray sum. Track `cur`, the best sum ending here, and `best`, the global max. At each element `cur = max(nums[i], cur + nums[i])`, either extending the running sum or restarting at the current element. Trace: `cur` runs `-2,1,-2,4,3,5,6,1,5`; `best` peaks at `6`. The winning subarray is `[4,-1,2,1]`. Return `6`. **O(n)** time, **O(1)** space. The restart-versus-extend choice is the whole idea.',
      viz_anchor: null,
    },
    {
      inputs: ['[-2,-3,-1,-4]'],
      expected: '-1',
      explanation_md:
        'An all-negative array. Since at least one element must be chosen, the answer is the largest single element, `-1`, not `0`. The `max(nums[i], cur+nums[i])` rule always prefers the standalone element when extending only adds more negativity, so `best = -1`. Proves `best` must be seeded with the first element or negative infinity, not `0`: seeding at `0` would wrongly report `0` for an empty selection that is not allowed.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,-1,7,8]'],
      expected: '23',
      explanation_md:
        'A nearly-all-positive array. The running sum never benefits from restarting because the dip at `-1` is more than covered by its neighbors. Trace `cur`: `5,9,8,15,23`; `best = 23`, the whole array. Return `23`. Proves the extend branch wins whenever the running prefix stays positive. Kadane only restarts when `cur + nums[i]` falls below `nums[i]` alone, which never happens on this input.',
      viz_anchor: null,
    },
  ],

  'rotate': [
    {
      inputs: ['[1,2,3,4,5,6,7]', '3'],
      expected: '[5,6,7,1,2,3,4]',
      explanation_md:
        'Rotate the array right by `k` using the three-reversal trick. Reverse the whole array, then reverse the first `k` elements, then reverse the rest. Trace `[1..7]`, `k=3`: reverse all gives `[7,6,5,4,3,2,1]`. Reverse first `3` gives `[5,6,7,4,3,2,1]`. Reverse last `4` gives `[5,6,7,1,2,3,4]`. **O(n)** time, **O(1)** space. The double reversal restores internal order within each block while swapping the two blocks\' positions.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '3'],
      expected: '[1,2,3]',
      explanation_md:
        'A rotation by exactly the length. Rotating `n` elements right by `n` returns the original array. The fix is to take `k mod n` first: `3 mod 3 = 0`, so effectively no rotation happens. Reverse-all then reverse-first-0 then reverse-rest is equivalent to reversing twice, the identity. Result `[1,2,3]`. Proves the `k % n` normalization is mandatory; without it a full reversal cycle could mishandle the block split.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '5'],
      expected: '[1]',
      explanation_md:
        'A single element rotated by `5`. After `k mod n = 5 mod 1 = 0`, there is nothing to rotate. Result `[1]`. Proves the modulo step keeps `k` within bounds for tiny arrays: a raw `k = 5` would try to reverse the first `5` elements of a length-one array and go out of bounds. The normalization makes the reversal trick robust for any `k`, however large.',
      viz_anchor: null,
    },
  ],

  'missing': [
    {
      inputs: ['[3,0,1]'],
      expected: '2',
      explanation_md:
        'Find the one number missing from `0..n`. The sum of `0..n` is `n(n+1)/2`; subtract the actual array sum to reveal the gap. Here `n = 3`, expected sum `3*4/2 = 6`, actual sum `3+0+1 = 4`, missing `6 - 4 = 2`. Return `2`. **O(n)** time, **O(1)** space. An equivalent XOR approach (XOR of `0..n` with all elements) avoids any overflow risk while producing the same answer.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '1',
      explanation_md:
        'A single element. The range is `0..1`, expected sum `1*2/2 = 1`, actual sum `0`, missing `1 - 0 = 1`. Return `1`. Proves the algorithm correctly identifies that the missing number can be `n` itself, the top of the range, not just an interior gap. An implementation that only scans for interior holes between present values would fail to report `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '0',
      explanation_md:
        'The mirror edge case where `0` itself is missing. Range `0..1`, expected sum `1`, actual sum `1`, missing `1 - 1 = 0`. Return `0`. Proves the formula handles a missing `0` correctly: the difference comes out to `0`, which is a valid answer, not a "nothing missing" signal. The sum-difference method makes no assumption about where the gap is located.',
      viz_anchor: null,
    },
  ],

  'union': [
    {
      inputs: ['[1,2,5,6,2,3,5,7,3]', '[2,4,5,6,8,9,4,6,5,4]'],
      expected: '[1,2,3,4,5,6,7,8,9]',
      explanation_md:
        'The union of two arrays: every distinct value appearing in either, sorted. Insert all elements of both arrays into a set, which dedupes automatically, then output the sorted values. From array A the distinct values are `{1,2,3,5,6,7}`; from B `{2,4,5,6,8,9}`; the union is `{1,2,3,4,5,6,7,8,9}`. Sorted, that is `[1,2,3,4,5,6,7,8,9]`. **O((m+n) log(m+n))** dominated by the sort. The set absorbs all internal repeats in both inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]', '[1,1,1]'],
      expected: '[1]',
      explanation_md:
        'Both arrays are all `1`s. As each element is inserted, the set collapses every duplicate copy into a single `1`, so the final set holds just one value. The sorted output is `[1]`. Proves the dedup is global across both inputs: six total occurrences of `1` across the two arrays yield exactly one element. An implementation that only dedupes within each array separately, then concatenates the two distinct results, would wrongly emit `[1,1]` because the cross-array duplicate would survive.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '[]'],
      expected: '[1,2,3]',
      explanation_md:
        'One array empty. Inserting the elements of A gives the set `{1,2,3}`, and iterating the empty B adds nothing, so the set is unchanged. The sorted union is just the distinct elements of the non-empty array, `[1,2,3]`. Proves the algorithm handles an empty operand cleanly: the loop over the empty array runs zero times and never touches the set. The result equals A here because A already contains no internal duplicates that the set would need to collapse.',
      viz_anchor: null,
    },
  ],

  'floyd': [
    {
      inputs: ['3'],
      expected: '["1","2 3","4 5 6"]',
      explanation_md:
        'Floyd\'s triangle: row `i` contains `i` consecutive integers, continuing a running counter that never resets. Maintain a counter starting at `1`; for each row from `1` to `n`, emit that many numbers space-joined. Trace `n=3`: row 1 gives `"1"` (counter now 2), row 2 gives `"2 3"` (counter now 4), row 3 gives `"4 5 6"`. Result `["1","2 3","4 5 6"]`. **O(n^2)** numbers total. The key is the counter persisting across rows, never reset per row.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '["1"]',
      explanation_md:
        'The smallest non-empty triangle, one row holding a single number `1`. The running counter starts at `1`, the first and only row consumes one number and emits `"1"`, and then the loop is done. Result `["1"]`. Proves the algorithm produces exactly one row for `n=1` with no trailing whitespace. The space-join over a single-element list yields the bare string `"1"` rather than `"1 "`, which is why building each row by joining a collected list of numbers beats appending a separator after every number.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '[]',
      explanation_md:
        'The zero edge case. No rows are requested, so the outer loop from `1` to `0` never runs and the counter is never touched. Return `[]`. Proves the algorithm handles `n=0` by emitting an empty list rather than a list with a blank string. An implementation that always builds at least one row would wrongly return `[""]`, a single empty row.',
      viz_anchor: null,
    },
  ],

  'largest': [
    {
      inputs: ['[3,1,4,1,5,9,2,6]'],
      expected: '9',
      explanation_md:
        'Return the maximum element with a single linear scan. Seed `best` with the first element, then for each subsequent element keep the larger of `best` and it. Trace `[3,1,4,1,5,9,2,6]`: `best` climbs `3,4,5,9` and never exceeds `9` afterward. Return `9`. **O(n)** time, **O(1)** space. Seeding `best` with `nums[0]` rather than `0` or a blind constant keeps it correct for arrays of any sign.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,-2,-3]'],
      expected: '-1',
      explanation_md:
        'An all-negative array. Seeded with `best = -1`, the scan compares against `-2` and `-3`, neither larger, so `best` stays `-1`. Return `-1`. Proves why seeding with the first element matters: an implementation that seeds `best = 0` would wrongly return `0`, a value not even present in the array. The first-element seed is the safe initialization for any signed input.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]'],
      expected: '5',
      explanation_md:
        'A single element. The variable `best` is seeded with the only value `5`, and the scan loop over the remaining elements has nothing further to compare against. The function returns `5`. Proves the algorithm handles length-one input without ever entering the comparison body of the loop. An implementation that starts the scan at index `1` simply finds an empty remaining range and returns the seed directly, which is exactly the lone value, so no special-case branch for single-element arrays is needed.',
      viz_anchor: null,
    },
  ],

  'leaders': [
    {
      inputs: ['[16,17,4,3,5,2]'],
      expected: '[17,5,2]',
      explanation_md:
        'A leader is an element greater than every element to its right. Scan right-to-left tracking the running max-so-far; an element is a leader if it exceeds that max. Trace `[16,17,4,3,5,2]` from the right: `2` (leader, max 2), `5 > 2` (leader, max 5), `3 < 5`, `4 < 5`, `17 > 5` (leader, max 17), `16 < 17`. Leaders collected `[2,5,17]`, reversed to source order, give `[17,5,2]`. **O(n)** time. The rightmost element is always a leader.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,3,2,1]'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'A strictly decreasing array, so every element is larger than all to its right and thus every element is a leader. Scanning right-to-left, the running max only ever equals the current element, so each one qualifies. The result is the whole array `[5,4,3,2,1]`. Proves the algorithm returns all `n` elements when the input is monotonically decreasing, with the max rising by exactly each new leftward element.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,0]'],
      expected: '[4,0]',
      explanation_md:
        'An increasing run followed by a small tail. Right-to-left: `0` (leader, max 0), `4 > 0` (leader, max 4), `3 < 4`, `2 < 4`, `1 < 4`. Leaders `[0,4]`, reversed, give `[4,0]`. Proves the algorithm correctly drops earlier elements dominated by a later larger value: `1,2,3` are all overshadowed by `4` to their right, so none are leaders despite the ascending prefix.',
      viz_anchor: null,
    },
  ],

  'islands': [
    {
      inputs: ['[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]'],
      expected: '1',
      explanation_md:
        'Count connected components of `"1"` cells using 4-directional adjacency. Scan every cell; on an unvisited `"1"`, run a flood fill (DFS or BFS) that sinks the whole island to `"0"`, and increment the count once. Here all the `"1"`s in the top-left form one connected blob, so the first flood fill from `(0,0)` reaches every land cell. Count `1`. **O(rows*cols)** time; each cell is visited at most once across all floods.',
      viz_anchor: null,
    },
    {
      inputs: ['[["1","0","1"],["0","1","0"],["1","0","1"]]'],
      expected: '5',
      explanation_md:
        'A checkerboard of land. No two `"1"`s share an edge, only diagonal corners, which do not connect under 4-directional adjacency. So each of the five `"1"` cells is its own island, requiring five separate flood fills, count `5`. Proves the algorithm uses 4-directional connectivity, not 8: an implementation that also checks diagonals would wrongly merge these into one island and return a smaller count.',
      viz_anchor: null,
    },
    {
      inputs: ['[["0"]]'],
      expected: '0',
      explanation_md:
        'A single water cell. The outer scan visits the one cell, finds it is `"0"` rather than `"1"`, so no flood fill ever launches and the island count stays at its initial value `0`. The function returns `0`. Proves the algorithm handles an all-water grid cleanly: the count is initialized to `0` and only incremented at the moment a new piece of unvisited land is discovered. The single-cell grid exercises the base scan with zero islands present and no recursion ever triggered.',
      viz_anchor: null,
    },
  ],

  'pangram': [
    {
      inputs: ['"thequickbrownfoxjumpsoverthelazydog"'],
      expected: 'true',
      explanation_md:
        'A pangram contains every letter `a` through `z` at least once. Collect the distinct lowercase letters into a set and check that the size reaches `26`. The classic sentence "the quick brown fox jumps over the lazy dog" with spaces removed hits all 26 letters, so the set fills completely. Return `true`. **O(n)** time, **O(1)** space since the set is capped at 26. A single pass building the set is enough; no per-letter recount is needed.',
      viz_anchor: null,
    },
    {
      inputs: ['"leetcode"'],
      expected: 'false',
      explanation_md:
        'A short word using only the letters `{l,e,t,c,o,d}`, six distinct letters, far short of the required `26`. The set built from the string never fills, so the final size check `size == 26` fails and the answer is `false`. Proves the algorithm correctly rejects strings that are missing letters of the alphabet. An implementation that checks only whether the string length is at least 26 is not enough, since you still need 26 unique letters, which this word lacks even before considering its repeated characters.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdefghijklmnopqrstuvwxyz"'],
      expected: 'true',
      explanation_md:
        'The minimal pangram, exactly one of each letter, length `26`. The set fills to all 26 distinct letters with no repeats, so the size equals `26` and the answer is `true`. Proves the boundary case where the string is precisely the alphabet. Any shorter distinct-letter string cannot be a pangram, making length `26` the hard floor for a valid answer.',
      viz_anchor: null,
    },
  ],

  'conway': [
    {
      inputs: ['[[1,1],[1,0]]'],
      expected: '[[1,1],[1,1]]',
      explanation_md:
        'Conway\'s Game of Life: each cell\'s next state depends on its eight neighbors. A live cell survives with 2 or 3 live neighbors; a dead cell becomes live with exactly 3. On the `2x2` board `[[1,1],[1,0]]`, each cell borders the other three. The three live cells each have 2 live neighbors (survive); the dead bottom-right has exactly 3 (born). All become live, giving `[[1,1],[1,1]]`. **O(rows*cols)** time, computing every neighbor sum from the original board.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[0]]',
      explanation_md:
        'A single live cell with no neighbors. A live cell with fewer than 2 live neighbors dies of underpopulation; here it has `0` neighbors, so it dies. Result `[[0]]`. Proves the underpopulation rule fires at the boundary: even one isolated live cell cannot survive. The neighbor count for a lone cell is `0`, well below the survival threshold of `2`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'],
      expected: '[[1,0,1],[0,0,0],[1,0,1]]',
      explanation_md:
        'A full `3x3` block. The center cell has 8 live neighbors and dies of overpopulation. Each edge-midpoint cell has 5 neighbors and dies. Each corner has 3 neighbors and survives. So only the four corners stay live, giving `[[1,0,1],[0,0,0],[1,0,1]]`. Proves both the overpopulation rule and that all updates must read the original grid simultaneously; mutating in place would corrupt later neighbor counts.',
      viz_anchor: null,
    },
  ],

  // ---------- HARD ----------
  'four-sum': [
    {
      inputs: ['[1,0,-1,0,-2,2]', '0'],
      expected: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]',
      explanation_md:
        'Find all unique quadruplets summing to the target. Sort the array, fix the first two indices in nested loops, then run a two-pointer sweep over the rest. On the sorted input `[-2,-1,0,0,1,2]`: fixing `-2,-1` the inner pointers find `1,2` (sum 0); fixing `-2,0` they find `0,2`; fixing `-1,0` they find `0,1`. Result `[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]`. **O(n^3)** time. Sorting is what enables both the converging two-pointer sweep on the inner pair and the easy duplicate-skipping applied at every one of the four levels.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,2,2,2]', '8'],
      expected: '[[2,2,2,2]]',
      explanation_md:
        'All identical values. The only quadruplet that sums to `8` is `2+2+2+2`, and it must appear exactly once even though many different index combinations all produce the same four values. Duplicate-skipping at each fixed level, advancing the pointer past equal values after one has been used, is what collapses those combinations into the single result `[[2,2,2,2]]`. Proves the dedup logic is essential: an implementation that lacks skip-on-duplicate would emit the same quadruplet many times over, once per redundant index choice.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '0'],
      expected: '[]',
      explanation_md:
        'The empty-input edge case. With fewer than four elements present there can be no quadruplet at all, so the nested fixing loops never produce a candidate and the result list stays empty. Return `[]`. Proves the algorithm short-circuits on tiny inputs without ever indexing out of bounds: the two outer loops simply have no valid index range to iterate over on a zero-length array, so the inner two-pointer sweep is never reached and no comparison is attempted. The same safety holds for any input of size one, two, or three.',
      viz_anchor: null,
    },
  ],

  'kmp': [
    {
      inputs: ['"abcabcabc"', '"abc"'],
      expected: '[0,3,6]',
      explanation_md:
        'Knuth-Morris-Pratt finds all occurrences of a pattern in linear time. It precomputes a failure table so that on a mismatch it skips ahead without re-checking matched characters. Searching `"abc"` in `"abcabcabc"`: a match starts at index `0`, then the scan continues without backtracking the text pointer and finds further matches at `3` and `6`. Result `[0,3,6]`. **O(n+m)** time. The overlapping structure of the text is exactly why the no-backtrack guarantee pays off.',
      viz_anchor: null,
    },
    {
      inputs: ['"aabaaabaaac"', '"aabaaac"'],
      expected: '[4]',
      explanation_md:
        'A case engineered to exercise the failure table. The pattern `"aabaaac"` shares prefixes with itself, so a naive search would repeatedly re-scan. On a mismatch deep in the pattern, KMP jumps the pattern pointer back via the precomputed table instead of resetting the text pointer. The only full match begins at index `4`. Return `[4]`. Proves the failure-link reuse: the partial match is not thrown away, it informs the next alignment.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"d"'],
      expected: '[]',
      explanation_md:
        'A no-match case. The single-character pattern `"d"` never matches any character of the text `"abc"`, so no occurrence is ever recorded. Return `[]`. Proves the algorithm correctly returns an empty list when the pattern is entirely absent from the text. The text pointer advances through all three characters in turn, the pattern pointer never reaches the end that signals a full match, and the result accumulator stays empty throughout the scan. Even the failure-table lookups, though computed, are never needed because the pattern is only one character long.',
      viz_anchor: null,
    },
  ],

  'nth-digit': [
    {
      inputs: ['11'],
      expected: '0',
      explanation_md:
        'Find the `n`-th digit in the infinite string `123456789101112...`. Digits group by length: positions `1` to `9` are the nine one-digit numbers, positions `10` to `189` the ninety two-digit numbers. For `n=11`: subtract the first 9 to get offset `2` into the two-digit block, which starts at `10`. The number is `10 + (2-1)/2 = 10`, digit index `(2-1) mod 2 = 1`, so the second digit of `10`, which is `0`. Return `0`.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '3',
      explanation_md:
        'A small `n` inside the first one-digit block. Positions `1` to `9` map directly to the digits `1` to `9`, so position `3` is simply the number `3`. No block subtraction is needed because `n <= 9`. Return `3`. Proves the algorithm handles the trivial first block without entering the multi-digit arithmetic; the block-length loop exits immediately when `n` fits the one-digit range.',
      viz_anchor: null,
    },
    {
      inputs: ['1000'],
      expected: '3',
      explanation_md:
        'A larger `n` requiring block walking. Subtract the 9 one-digit positions to get `n=991`, then the 180 two-digit positions to get `n=811`; now we are in the three-digit block starting at `100`. The number is `100 + (811-1)/3 = 370`, and the digit index is `(811-1) mod 3 = 0`, the first digit of `370`, which is `3`. Return `3`. Proves the algorithm scales by collapsing whole length-blocks at once instead of generating the string.',
      viz_anchor: null,
    },
  ],

  'detect-cycle': [
    {
      inputs: ['[3,2,0,-4]', '1'],
      expected: 'true',
      explanation_md:
        'Floyd\'s tortoise-and-hare detects a cycle in a linked list. A slow pointer advances one node and a fast pointer two; if they ever meet, there is a cycle. The list `[3,2,0,-4]` has its tail `-4` linked back to index `1`, the node `2`, forming a loop. The fast pointer eventually laps the slow one inside the loop and they collide, so return `true`. **O(n)** time, **O(1)** space, with no extra set of visited nodes needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '-1'],
      expected: 'false',
      explanation_md:
        'A single node with no cycle, where `pos = -1` means the tail points to null. The fast pointer immediately walks off the end, since its lookahead is null, before any meeting can occur, so the loop exits and returns `false`. Proves the algorithm correctly reports no cycle for a one-node list. The null-check on the fast pointer\'s two-step lookahead is what prevents a false positive here.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '-1'],
      expected: 'false',
      explanation_md:
        'A straight list of five nodes with no back-link. The fast pointer races ahead two nodes at a time and hits null at the end while the slow pointer trails behind and never catches it, so the loop terminates without the two ever meeting and the function returns `false`. Proves the tortoise-and-hare correctly distinguishes a finite acyclic list from a cyclic one: the fast pointer reaching the null tail is the definitive no-cycle signal, and it always happens within about `n/2` steps on a list of length `n`.',
      viz_anchor: null,
    },
  ],

  'set-matrix-0': [
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '[[1,0,1],[0,0,0],[1,0,1]]',
      explanation_md:
        'If any cell is `0`, zero out its entire row and column. The **O(1)**-space trick uses the first row and column as marker storage: a first pass records, for each `0`, a flag in its row\'s and column\'s header cell. Here the single `0` at `(1,1)` flags row 1 and column 1. The second pass zeroes every cell whose row or column header is flagged, so row 1 and column 1 become all zeros, giving `[[1,0,1],[0,0,0],[1,0,1]]`. **O(rows*cols)** time, **O(1)** extra space.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[[1,2,3],[4,5,6],[7,8,9]]',
      explanation_md:
        'A matrix with no zeros. The first pass finds nothing to flag, so the second pass zeroes nothing and the matrix is returned unchanged. Result identical to input. Proves the algorithm is a no-op when no zero exists; it does not spuriously clear any row or column. The first-row and first-column marker headers stay clean, gating the second pass off entirely.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,0],[0,0,0]]'],
      expected: '[[0,0,0],[0,0,0]]',
      explanation_md:
        'An all-zero matrix. Every cell is a `0`, so the first pass flags every row and every column via the header cells, and the second pass then zeroes everything, which leaves the already-all-zero matrix unchanged. Result `[[0,0,0],[0,0,0]]`. Proves the algorithm handles the fully saturated case without error. The first-row and first-column marker scheme still works here because all headers end up flagged and the output stays consistent, demonstrating that reusing the borders for storage does not break when the borders themselves contain zeros.',
      viz_anchor: null,
    },
  ],

  'matrix-spiral': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[1,2,3,6,9,8,7,4,5]',
      explanation_md:
        'Traverse the matrix in spiral order using four shrinking boundaries: `top, bottom, left, right`. Walk the top row left-to-right, the right column top-to-bottom, the bottom row right-to-left, the left column bottom-to-top, then shrink inward and repeat. Trace the `3x3`: top row `1,2,3`, right col `6,9`, bottom row `8,7`, left col `4`, inner cell `5`. Result `[1,2,3,6,9,8,7,4,5]`. **O(rows*cols)** time; each boundary moves inward after its pass, preventing re-visits.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[1]',
      explanation_md:
        'A single cell. The top-row pass emits `1`, then `top` is incremented past `bottom`, so the boundaries cross and the loop condition fails before any further pass runs. The traversal stops with result `[1]`. Proves the boundary-crossing termination check prevents re-reading the lone cell through the right-column or bottom-row passes. Without the `top <= bottom and left <= right` guard checked between each of the four passes, a `1x1` matrix could emit the same element multiple times as the spiral tried to wrap a non-existent ring.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3,4,5]]'],
      expected: '[1,2,3,4,5]',
      explanation_md:
        'A single row. The top-row pass emits `1,2,3,4,5` left-to-right, then `top` is incremented and now exceeds `bottom`, so the right-column, bottom-row, and left-column passes are all guarded off by the boundary checks. The result is `[1,2,3,4,5]`. Proves the algorithm handles degenerate single-row or single-column matrices: the inter-pass boundary checks stop it from wrapping around a second dimension that does not exist. A naive four-direction loop without these guards would re-read cells or index out of bounds on such a flat matrix.',
      viz_anchor: null,
    },
  ],

  'valid-number': [
    {
      inputs: ['"0"'],
      expected: 'true',
      explanation_md:
        'Validate whether a string is a well-formed number, allowing an optional sign, digits, a decimal point, and an exponent. A single digit `"0"` is the simplest valid number, needing no sign, point, or exponent. The state machine, or careful flag-tracking, sees a digit and reaches an accepting state. Return `true`. **O(n)** time. The core requirement is that at least one digit appears in the mantissa, which `"0"` satisfies directly.',
      viz_anchor: null,
    },
    {
      inputs: ['"e"'],
      expected: 'false',
      explanation_md:
        'A lone exponent marker. `"e"` has no mantissa digits before it and no exponent digits after it, so it is not a number. The parser requires digits on both sides of an `e`, and neither exists here, so it returns `false`. Proves the algorithm enforces the digits-required-around-the-exponent rule. An implementation that treats any `e`-containing string as scientific notation would wrongly accept this.',
      viz_anchor: null,
    },
    {
      inputs: ['"."'],
      expected: 'false',
      explanation_md:
        'A bare decimal point with no digits. A valid number needs at least one digit somewhere in the mantissa, and `"."` has none. The parser sees the point but never a digit, so it cannot reach an accepting state and returns `false`. Proves the at-least-one-digit requirement is checked independently of the decimal point: `"."`, `"+"`, and `"e"` alone are all rejected for the same missing-digit reason.',
      viz_anchor: null,
    },
  ],
};

async function main() {
  const ids = Object.keys(PAYLOAD);
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems').select('id,explained_samples').in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const present = new Map(rows.map(r => [r.id, r]));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    if (!present.has(id)) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    // Rows in this batch were empty when selected; we overwrite with this batch's
    // canonical 3-sample payload so a re-run refreshes any corrected prose.
    if (!Array.isArray(samples) || samples.length !== 3) {
      console.log(`ERR    ${id}  (payload length ${samples?.length} != 3)`);
      failed++;
      continue;
    }
    let shapeOk = true;
    for (const s of samples) {
      const words = s.explanation_md.split(/\s+/).filter(Boolean).length;
      const ok2 = Array.isArray(s.inputs) && typeof s.expected === 'string'
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
