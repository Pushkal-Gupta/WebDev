#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples - batch 30.
// Focus area: recursion + divide-and-conquer + memoization.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch30.mjs

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
  'fibonacci-number': [
    {
      inputs: ['2'],
      expected: '1',
      explanation_md:
        'Canonical recurrence: F(n) = F(n-1) + F(n-2), F(0)=0, F(1)=1. The naive recursion tree for F(2) is small: F(2) -> F(1) + F(0) = 1 + 0 = 1. With memoization, every F(k) is computed once; without it, F(n) spawns 2^n calls (overlapping subproblems are the whole point). The iterative rolling-pair form keeps just `(a, b)` and updates `(b, a+b)` n times -> O(n) time, O(1) space.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'Base case. The recursion bottoms out at F(0)=0 without making any further calls. A common bug here is writing `if n < 2: return 1` (returning the wrong base) or `if n == 1: return 0` (swapped). The two base cases F(0)=0, F(1)=1 are the sole source of the entire sequence — every other value is derived from these.',
      viz_anchor: null,
    },
    {
      inputs: ['30'],
      expected: '832040',
      explanation_md:
        'Algorithmically interesting: exposes the memoization need. Naive recursion at n=30 makes roughly 2.7 million calls because F(28) is recomputed billions of times across the tree. Memo turns it into 31 unique calls. Iterative rolling-pair: start (0,1); repeat 30 times `(a, b) = (b, a+b)`; final a = 832040. The closed-form Binet formula `F(n) = (phi^n - psi^n) / sqrt(5)` also gives 832040, but floating-point loses precision past n~70.',
      viz_anchor: null,
    },
  ],

  'n-th-tribonacci-number': [
    {
      inputs: ['4'],
      expected: '4',
      explanation_md:
        'Recurrence: T(n) = T(n-1) + T(n-2) + T(n-3) with T(0)=0, T(1)=T(2)=1. Trace: T(3) = 1+1+0 = 2; T(4) = T(3)+T(2)+T(1) = 2+1+1 = 4. Memoized recursion stores each T(k) once; without memo the call tree branches 3-way and balloons to 3^n. Rolling triple `(a,b,c)` updates to `(b,c,a+b+c)` per step -> O(n) time, O(1) space, the textbook win.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'Base case. The recursion answers immediately from the table; no further calls. The three-base table T(0)=0, T(1)=1, T(2)=1 must all be initialized before the loop fires — a common bug is starting the rolling triple at `(1,1,1)` and over-counting by one position.',
      viz_anchor: null,
    },
    {
      inputs: ['25'],
      expected: '1389537',
      explanation_md:
        'Algorithmically interesting: confirms rolling-triple correctness over a long run. Start (a,b,c)=(0,1,1). Loop n-2 = 23 times: each iteration `(a,b,c) = (b, c, a+b+c)`. After 23 iterations, c = T(25) = 1389537. Memoized recursion would also work but trades 25 stack frames for 3 ints. The Tribonacci growth rate is ~1.8393 per step (the unique real root of x^3 = x^2 + x + 1).',
      viz_anchor: null,
    },
  ],

  'find-the-k-th-character-in-string-game-i': [
    {
      inputs: ['5'],
      expected: '"b"',
      explanation_md:
        'Recursive halving. The word doubles each round: start "a", round 1 -> "ab", round 2 -> "abbc", round 3 -> "abbcbccd", round 4 -> 16 chars. Find k=5. Recursive rule: in a word of length 2^L, position k is in the second half iff k > 2^(L-1); in the second half, the char equals the same-index char in the first half PLUS 1. Trace k=5, L=3 (length 8): 5 > 4 so second half, recurse on k-4=1 with shift+1. Then k=1, L=2: 1 <= 2, first half, recurse k=1, L=1. k=1, L=0: base = "a". Add the accumulated shift of 1 -> "b". Return "b".',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '"a"',
      explanation_md:
        'Base case. k=1 always returns "a" regardless of round count — the first character of every word starts as "a" and is never modified by the doubling operation. The recursion terminates immediately without halving. Equivalently: the popcount-of-(k-1) trick says position 1 has popcount(0) = 0 shifts -> "a".',
      viz_anchor: null,
    },
    {
      inputs: ['10'],
      expected: '"c"',
      explanation_md:
        'Algorithmically interesting: deeper recursion, multiple halving steps. k=10. The closed-form trick: answer is chr(ord("a") + popcount(k-1)). k-1=9 = 0b1001 -> popcount=2 -> "a"+2 = "c". Why: each time k falls in the second half, we add 1 to the shift and zero out a high bit of (k-1); the total shift equals the count of 1-bits in (k-1). The recursive trace matches: 10 -> second half (length 16), shift 1, recurse on 2; 2 -> second half (length 2), shift 2, recurse on 1; base "a" + 2 = "c".',
      viz_anchor: null,
    },
  ],

  'arithmetic-slices': [
    {
      inputs: ['[1,2,3,4]'],
      expected: '3',
      explanation_md:
        'Memoized recurrence: dp[i] = number of arithmetic slices ending at index i. Transition: dp[i] = dp[i-1] + 1 if nums[i] - nums[i-1] == nums[i-1] - nums[i-2], else 0. Trace: dp[2] = 1 (slice [1,2,3]). dp[3] = dp[2] + 1 = 2 (slices [2,3,4] and [1,2,3,4] extending). Sum dp = 0+0+1+2 = 3. Return 3. The "ending at i" formulation collapses the O(n^2) enumeration into O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '1',
      explanation_md:
        'Edge case: minimum-length arithmetic slice. dp[2] = 1 because nums[2]-nums[1] == nums[1]-nums[0] (both 1). Sum = 1. A bug that requires length >= 4 (mistaking "slice" for "subarray of length >= 4") would return 0 here — the spec is length >= 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,8,9,10]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: two disjoint arithmetic runs separated by a jump. dp[2] = 1 ([1,2,3]). dp[3] = 0 (8-3 = 5 differs from 3-2 = 1, the run breaks). dp[4] = 0 (9-8 = 1 but the previous diff 8-3 = 5 does not match — dp[i] needs the last TWO diffs equal, and indices 3,4 alone are only two elements). dp[5]: 10-9 = 1 equals 9-8 = 1, so dp[5] = dp[4] + 1 = 1 ([8,9,10]). Sum = 1 + 0 + 0 + 1 = 2. Return 2. The reset-to-zero on break is essential — a naive accumulator that does not reset double-counts across runs.',
      viz_anchor: null,
    },
  ],

  'arithmetic-slices-ii-subsequence': [
    {
      inputs: ['[2,4,6,8,10]'],
      expected: '7',
      explanation_md:
        'Memoized over (index, common_difference). dp[i][d] = number of arithmetic SUBSEQUENCES ending at index i with common difference d. Use a hashmap per index to handle arbitrary d. Transition: for each j<i, d = nums[i]-nums[j]; dp[i][d] += dp[j][d] + 1. The "+1" counts the new length-2 pair (j,i) which becomes length-3 only when it extends a previous length-2. Sum over all dp[i][d] of the values that correspond to length >= 3. For [2,4,6,8,10] with d=2: triples (0,1,2),(1,2,3),(2,3,4); quads (0,1,2,3),(1,2,3,4); quints (0,1,2,3,4); plus (0,1,2,3),(0,1,2,4) etc — total 7. Return 7.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,7,7,7,7]'],
      expected: '16',
      explanation_md:
        'Edge case: all equal -> d=0 everywhere. Every subset of length >= 3 is arithmetic. Number of length-k subsets of 5 = C(5,k); k>=3 sums to C(5,3)+C(5,4)+C(5,5) = 10+5+1 = 16. The DP recreates this via repeated pair counting; the hashmap-on-each-index trick handles d=0 like any other key. A common bug: tracking d as `nums[i] - nums[j]` without a hashmap (using array indexed by d) overflows on large diffs and undercounts when d is negative.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,3,4]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: duplicate values create two separate chains. dp[i][d] counts subsequences of length >= 2 ending at index i with difference d; whenever the pair (j, i) extends an existing dp[j][d], that extension has length >= 3 and is added to the answer. Trace [2,2,3,4]: i=1 (second 2): dp[1][0] = 1. i=2 (value 3): pairs with BOTH 2s at d=1 -> dp[2][1] = 2; dp[0][1] and dp[1][1] were 0, so the answer stays 0. i=3 (value 4): pair (2,3) at d=1 extends dp[2][1] = 2 -> answer += 2; dp[3][1] becomes 3. Final answer 2: the subsequences (nums[0], nums[2], nums[3]) and (nums[1], nums[2], nums[3]) — both read 2,3,4 but use different copies of the duplicate 2. dp is indexed by position, not value, which is exactly what keeps the two chains distinct.',
      viz_anchor: null,
    },
  ],

  'powerful-integers': [
    {
      inputs: ['2', '3', '10'],
      expected: '[2,3,4,5,7,9,10]',
      explanation_md:
        'Recursive enumeration over (i, j) such that x^i + y^j <= bound. Two nested powers: outer i from 0 while x^i <= bound; inner j from 0 while y^j <= bound. Use a set to dedupe. x=2, y=3, bound=10: x^i in {1,2,4,8}; y^j in {1,3,9}. Sums: 2,4,5,3,5,10,7,11,17,9,11,17 — clip > 10, dedupe -> {2,3,4,5,7,9,10}. Return sorted list. Cap j-loop when y==1 to avoid infinite recursion (y^j stays 1 forever).',
      viz_anchor: null,
    },
    {
      inputs: ['3', '5', '15'],
      expected: '[2,4,6,8,10,14]',
      explanation_md:
        'Edge case: medium bound. x^i: 1,3,9 (27>15). y^j: 1,5 (25>15). Sums: 1+1=2, 1+5=6, 3+1=4, 3+5=8, 9+1=10, 9+5=14. Dedupe (none) -> {2,4,6,8,10,14}. Return sorted. The recursive halving on the powers is implicit: each level of nesting multiplies by x or y, bounded by log_x(bound) and log_y(bound) levels.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1', '5'],
      expected: '[2]',
      explanation_md:
        'Algorithmically interesting: degenerate base 1. x=1, y=1 -> x^i=1 forever, y^j=1 forever, only sum is 2. The base-1 guard MUST cap the inner loop after one iteration. Forgetting it causes an infinite loop while x^i*1 <= bound stays true. Return [2].',
      viz_anchor: null,
    },
  ],

  'super-pow': [
    {
      inputs: ['2', '[1,0]'],
      expected: '1024',
      explanation_md:
        'Recursive divide-and-conquer on the digit array. To compute a^b where b = [d_0, d_1, ..., d_{k-1}] (decimal, MSB first): a^b = (a^(b without last digit))^10 * a^(last digit), all mod 1337. Trace a=2, b=[1,0]: split last digit 0; recurse on [1]; a^[1] = 2. Combine: 2^10 * 2^0 = 1024 * 1 = 1024 mod 1337 = 1024. The recurrence is a^[b0..bn] = (a^[b0..b_{n-1}])^10 * a^bn — pure D&C with O(k) recursion depth.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '[3]'],
      expected: '8',
      explanation_md:
        'Base case: single digit. a^[3] = 2^3 = 8 mod 1337. Just compute directly with fast exponentiation on the small digit. The recursion bottoms out when the digit list has length 1 — no further splitting. A common bug: forgetting that 1337 is composite (7 * 191) so Euler\'s theorem with phi(1337)=1140 only works when gcd(a,1337)=1; the D&C approach is safe regardless.',
      viz_anchor: null,
    },
    {
      inputs: ['2147483647', '[2,0,0]'],
      expected: '1198',
      explanation_md:
        'Algorithmically interesting: huge base, multi-digit exponent. Reduce base mod 1337 first: 2147483647 mod 1337 = 1295. b=[2,0,0]: recurse on [2,0] which recurses on [2]. a^[2] = 1295^2 mod 1337. Then (a^[2])^10 * 1 = a^20. Then ((a^20))^10 * 1 = a^200. All mod 1337 yields 1198. The D&C with mod inside every step keeps every intermediate within int range — without mod inside the recursion, intermediate values blow up.',
      viz_anchor: null,
    },
  ],

  'count-strictly-increasing-subarrays': [
    {
      inputs: ['[1,3,5,4,4,6]'],
      expected: '10',
      explanation_md:
        'Memoized run length. For each i, let `run[i]` = length of strictly increasing run ending at i. Then number of subarrays ending at i is run[i] (since each contributing subarray has length 1, 2, ..., run[i]). Trace: run = [1,2,3,1,1,2]. Sum = 1+2+3+1+1+2 = 10. Return 10. The recurrence run[i] = run[i-1]+1 if nums[i]>nums[i-1] else 1 is the entire algorithm; O(n) time, O(1) space if we collapse run to a scalar.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '15',
      explanation_md:
        'Edge case: fully sorted. run = [1,2,3,4,5]; sum = 15 = n*(n+1)/2. Confirms the formula for the maximum-possible case. A bug that counts only length-1 subarrays would return 5; one that requires length >= 2 returns 10. The spec includes single-element subarrays as "strictly increasing" (vacuously true).',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,3,2,1]'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: monotonically decreasing. Every position resets the run to 1. Sum = 5. Confirms the reset behavior — a buggy accumulator that did not reset would wrongly accumulate the same run across breaks. The single-element subarrays are the only valid contributions.',
      viz_anchor: null,
    },
  ],

  'merge-sort': [
    {
      inputs: ['[5,2,4,6,1,3]'],
      expected: '[1,2,3,4,5,6]',
      explanation_md:
        'Canonical D&C example. Split [5,2,4,6,1,3] into [5,2,4] and [6,1,3]. Recurse: [5,2,4] -> [5] + [2,4] -> [5] merged with sort([2],[4])=[2,4] -> [2,4,5]. [6,1,3] -> [6] + [1,3] -> [6] merged with [1,3] -> [1,3,6]. Final merge of [2,4,5] and [1,3,6] using two pointers: 1,2,3,4,5,6. The merge step is O(n); total recurrence T(n)=2T(n/2)+O(n) -> O(n log n) by master theorem.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'Base case: single element. The recursion returns immediately — a singleton is already sorted. The base must be `len(arr) <= 1` not `len(arr) == 0`, or the recursion fails to terminate on length-1 inputs. Confirms the recursion tree depth is 0 for n=1.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,3,3,3,3]'],
      expected: '[3,3,3,3,3]',
      explanation_md:
        'Algorithmically interesting: all duplicates. The split/merge structure runs in full but every comparison is "equal." Stable merge uses `<=` on the left list to preserve order; an unstable merge using `<` flips equals but produces the same final order here. Confirms stability matters in pedagogy: merge sort IS stable when implemented with `<=` on the left.',
      viz_anchor: null,
    },
  ],

  'quick-sort': [
    {
      inputs: ['[3,6,8,10,1,2,1]'],
      expected: '[1,1,2,3,6,8,10]',
      explanation_md:
        'D&C with in-place partition. Pick pivot (e.g. last element 1): partition into <= 1 and > 1. After Lomuto partition: [1,1] then pivot in middle then [3,6,8,10,2]. Recurse on left and right halves. Merging is implicit — partition leaves elements in the correct relative positions. Average T(n) = 2T(n/2) + O(n) -> O(n log n); worst T(n) = T(n-1) + O(n) -> O(n^2) on already-sorted input with naive pivot.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1]'],
      expected: '[1,2]',
      explanation_md:
        'Edge case: length 2. Pivot 1. Partition: 2 > 1 goes right, 1 stays left, swap to get [1,2]. Recurse on empty halves -> done. Confirms the base case `len <= 1` returns without further partitioning. A bug that uses `len < 1` infinite-loops on singletons.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[1,2,3,4,5]',
      explanation_md:
        'Algorithmically interesting: WORST case for last-element pivot. Already sorted. Each partition picks the max, splits into [1..n-1] and []. Recursion depth = n, total work O(n^2). The randomized-pivot or median-of-three fix avoids this. The lesson: deterministic pivots are adversarially defeatable; random pivots give expected O(n log n) with high probability.',
      viz_anchor: null,
    },
  ],

  'all-possible-full-binary-trees': [
    {
      inputs: ['7'],
      expected: '5',
      explanation_md:
        'Memoized recursion. A full binary tree with n nodes (n odd) is formed by picking i nodes for left subtree and n-1-i for right, both full. T(n) = sum over odd i in [1, n-2] of T(i) * T(n-1-i). Base T(1) = 1 (single node). Trace: T(3) = T(1)*T(1) = 1. T(5) = T(1)*T(3) + T(3)*T(1) = 2. T(7) = T(1)*T(5) + T(3)*T(3) + T(5)*T(1) = 2 + 1 + 2 = 5. Return 5 trees (each a distinct structure). Memoization is critical: without it, T(15) makes millions of redundant calls.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Base case. A single node is a full binary tree (trivially: it has 0 children). Return one tree [a leaf node with value 0]. The recursion bottoms out here — no children to enumerate. A bug that returns an empty list for n=1 cascades to empty for every n>=3.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: smallest non-trivial case. n=3, left=1, right=1 (only split possible). One tree: root with two leaves. Return list with that single tree. The Catalan-like recurrence: number of structures = Catalan((n-1)/2) for n odd, 0 for n even. C(1) = 1, matches.',
      viz_anchor: null,
    },
  ],

  'different-ways-to-add-parens': [
    {
      inputs: ['"2-1-1"'],
      expected: '[0,2]',
      explanation_md:
        'Divide-and-conquer with memoization on substrings. For each operator at position i, split into left = expr[:i], right = expr[i+1:]; combine all (a op b) for a in solve(left), b in solve(right). Memo on substring (or (l,r) indices). "2-1-1" splits at index 1 ("-"): left="2"->[2], right="1-1"->[0]. Combine: 2-0=2. Splits at index 3 ("-"): left="2-1"->[1], right="1"->[1]. Combine: 1-1=0. Result {2, 0}. Return [0,2]. Without memo, "1-1-1-1" already triggers exponential blowup; memo collapses it to O(n^2) subproblems.',
      viz_anchor: null,
    },
    {
      inputs: ['"11"'],
      expected: '[11]',
      explanation_md:
        'Base case: no operators. Parse the string as a number and return [11]. The recursion terminates here without any splits. A bug that returns [] for operator-less strings cascades to [] for every parent expression. The base must detect "no operator found" -> single-element list.',
      viz_anchor: null,
    },
    {
      inputs: ['"2*3-4*5"'],
      expected: '[-34,-14,-10,-10,10]',
      explanation_md:
        'Algorithmically interesting: three operators, 5 distinct parenthesizations. (2*(3-(4*5)))=-34, ((2*3)-(4*5))=-14, (2*((3-4)*5))=-10, ((2*(3-4))*5)=-10, (((2*3)-4)*5)=10. The D&C enumerates all Catalan-many splits: for n operators there are C_n parenthesizations. n=3 gives C_3=5, matches. Memo on substring saves the recomputation when the same sub-expression appears in two different parent splits.',
      viz_anchor: null,
    },
  ],

  'find-the-winner-of-the-circular-game': [
    {
      inputs: ['5', '2'],
      expected: '3',
      explanation_md:
        'Josephus recurrence. J(1) = 0; J(n) = (J(n-1) + k) % n. Trace k=2: J(1)=0, J(2)=(0+2)%2=0, J(3)=(0+2)%3=2, J(4)=(2+2)%4=0, J(5)=(0+2)%5=2. Add 1 for 1-indexed: 3. Return 3. The recurrence works because after one elimination, the remaining circle of (n-1) is identical to the J(n-1) problem with indices rotated by k. O(n) iterative, or O(log n) recursive on specific k.',
      viz_anchor: null,
    },
    {
      inputs: ['6', '5'],
      expected: '1',
      explanation_md:
        'Edge case: large k relative to n. k=5, n=6. J(1)=0, J(2)=(0+5)%2=1, J(3)=(1+5)%3=0, J(4)=(0+5)%4=1, J(5)=(1+5)%5=1, J(6)=(1+5)%6=0. 1-indexed: 1. Return 1. Confirms the mod inside the recurrence: large k wraps cleanly. A bug that does `(J(n-1) + k - 1) % n + 1` confuses 0-indexed vs 1-indexed — the cleanest form keeps J 0-indexed throughout and adds 1 only at the end.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: degenerate single-friend case. J(1)=0; 1-indexed = 1. Only friend wins by default. Confirms the base case. A simulation-based solver also returns 1 here trivially; the recurrence approach is the value-add for large n where simulation is O(n*k) but recurrence is O(n).',
      viz_anchor: null,
    },
  ],

  'find-kth-bit-in-nth-binary-string': [
    {
      inputs: ['3', '1'],
      expected: '"0"',
      explanation_md:
        'Recursive structure. S_n = S_{n-1} + "1" + reverse(invert(S_{n-1})). Length of S_n = 2^n - 1. For k in S_n: if k == 2^(n-1) -> "1" (the middle). If k < 2^(n-1) -> recurse find_kth(n-1, k) in left half. If k > 2^(n-1) -> recurse on right half: find_kth(n-1, 2^n - k), then INVERT the answer. Trace n=3, k=1: 2^2=4; k=1 < 4 -> recurse (2, 1). n=2: 2^1=2; k=1 < 2 -> recurse (1, 1). n=1: S_1 = "0", return "0". Bubble up unchanged -> "0".',
      viz_anchor: null,
    },
    {
      inputs: ['4', '11'],
      expected: '"1"',
      explanation_md:
        'Edge case: middle position. Length of S_4 = 15; middle = 2^3 = 8. k=11 > 8, so right half. Right-half index = 15 - 11 + 1 = 5, recurse with INVERT on (3, 5). S_3 length 7, middle = 4. k=5 > 4, right half. Right-half index = 7 - 5 + 1 = 3, recurse with another INVERT on (2, 3). S_2 = "011", length 3, middle = 2. k=3 > 2, right half. Index = 3 - 3 + 1 = 1, recurse on (1, 1) with INVERT. S_1 = "0", return "0". Bubble up three inverts: "0" -> "1" -> "0" -> "1". Return "1".',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '"0"',
      explanation_md:
        'Algorithmically interesting: base case. S_1 = "0"; k=1 -> "0". The recursion terminates immediately. Confirms the seed value. A bug that initializes S_1 = "1" propagates to flipped outputs for every (n, k); easy to catch by spot-checking n=1.',
      viz_anchor: null,
    },
  ],

  'k-th-symbol-in-grammar': [
    {
      inputs: ['4', '5'],
      expected: '1',
      explanation_md:
        'Recursive halving. Row n has 2^(n-1) symbols. Each "0" expands to "01", each "1" expands to "10". To find row n, position k (1-indexed): parent in row (n-1) is at ceil(k/2). If k is odd, child = parent; if k is even, child = 1 - parent. Trace n=4, k=5: parent at row 3, position 3. Parent k=3: row 2, position 2. Row 2: row 1, position 1 = 0; k=2 even -> flipped -> 1. Row 3 k=3: parent=1; k=3 odd -> same -> 1. Row 4 k=5: parent=1; k=5 odd -> same -> 1. Return 1.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '0',
      explanation_md:
        'Base case. Row 1 = "0"; k=1 -> 0. The recursion terminates immediately. The closed-form trick: answer is popcount(k-1) & 1 — number of bits in (k-1) parity. k=1 -> popcount(0)=0 -> 0. Matches.',
      viz_anchor: null,
    },
    {
      inputs: ['30', '434991989'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: deep recursion. Closed-form: popcount(434991989 - 1) = popcount(434991988). 434991988 in binary has even count of 1s -> answer 0. Recursive solution: O(n) steps, each halving k via integer division. Without the closed-form, an iterative loop computes the parity incrementally: walk bits of (k-1), XOR them, return the XOR. Confirms both approaches converge.',
      viz_anchor: null,
    },
  ],

  'josephus': [
    {
      inputs: ['1', '1'],
      expected: '0',
      explanation_md:
        'Base case of the Josephus recurrence J(1) = 0; J(n) = (J(n-1) + k) % n, all 0-indexed. With one person there is no elimination — the sole survivor sits at index 0. Return 0. This seed is the whole foundation: a bug that initializes J(1) = 1 (mistaking the convention for 1-indexed) shifts every later answer off by one.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '1'],
      expected: '1',
      explanation_md:
        'Two people, eliminate every 1st. Simulation: circle [0, 1], counting starts at index 0, k=1 means the very first person counted is eliminated — index 0 dies, survivor is index 1. Recurrence agrees: J(2) = (J(1) + 1) % 2 = (0 + 1) % 2 = 1. Return 1. The recurrence works because after the first kill, the surviving circle of n-1 people is the same subproblem with positions rotated by k; adding k and reducing mod n undoes that rotation.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '2'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: same circle, different k flips the survivor. Circle [0, 1], k=2: count two people starting at index 0 — the count lands on index 1, who is eliminated. Survivor is index 0. Recurrence: J(2) = (J(1) + 2) % 2 = 2 % 2 = 0. Return 0. Contrast with k=1 on the same n (survivor 1): the modulo wrap is what distinguishes them. The O(n) recurrence beats list-based simulation, which pays O(n*k) for repeated deletions.',
      viz_anchor: null,
    },
  ],

  'inversion-count': [
    {
      inputs: ['[2,4,1,3,5]'],
      expected: '3',
      explanation_md:
        'D&C via modified merge sort. Split array, recursively count inversions in halves, then count cross-inversions during merge: when an element from the right half is placed before remaining left-half elements, all those left elements form inversions with it. Trace [2,4,1,3,5]: split into [2,4,1] and [3,5]. Left half inversions: [2,4],[1] -> merge [1,2,4], 2 inversions ((2,1) and (4,1)). Right half: 0. Cross: merging [1,2,4] with [3,5]: 1, 2 placed first; 3 placed before 4 (1 inversion); 4 placed; 5 placed. 1 cross. Total 2+0+1 = 3. Return 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]'],
      expected: '0',
      explanation_md:
        'Edge case: already sorted. No inversions. The recursion still runs through every split and merge but every comparison goes "left first" so no cross-inversions are counted. Confirms the algorithm handles the zero-answer case cleanly — a bug that increments on every cross-comparison (instead of only when right-half wins) would mis-count here.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,3,2,1]'],
      expected: '10',
      explanation_md:
        'Algorithmically interesting: maximum inversions = C(n,2) = 10. The merge picks every right-half element first, and each time it does so, ALL remaining left-half elements form inversions. The D&C complexity is O(n log n); a brute O(n^2) pairwise scan also returns 10 but degrades on larger inputs. The cross-inversion accumulator `inv += len(left) - i` when right-half element is placed is the precise formula.',
      viz_anchor: null,
    },
  ],

  'majority-element': [
    {
      inputs: ['[3,2,3]'],
      expected: '3',
      explanation_md:
        'D&C: split array into halves, recursively find majority of each. If both halves agree, that\'s the answer. Otherwise, count occurrences of both candidates in the full array and pick the one with > n/2. Trace [3,2,3]: split into [3] and [2,3]. Left majority = 3. Right majority: split [2],[3]; the halves disagree, so count both in [2,3]: each appears once — the tie means either candidate may bubble up, and the combine step at the level above resolves it. Combine: count 3 in [3,2,3]=2 (>1.5), count 2=1; return 3. The Boyer-Moore voting alternative is O(n)/O(1) and is the canonical interview answer; D&C is O(n log n).',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'Base case: single element is its own majority. The recursion terminates. Boyer-Moore would also return 1 trivially. A bug that requires count > n/2 strict and n=1 (need >0.5) is fine; but an off-by-one `count > n/2 + 1` would fail here.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,1,1,1,2,2]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: the majority element loses the lead mid-array. 2 appears 4 times, 1 appears 3 times; n=7, 4 > 3.5 so 2 wins. Boyer-Moore: walk the array maintaining (candidate, count); when count hits 0, adopt the current element as the new candidate; otherwise +1 on match, -1 on mismatch. Trace [2,2,1,1,1,2,2]: (2,1) -> (2,2) -> 1 arrives (2,1) -> 1 arrives (2,0) -> 1 arrives with count 0, adopt (1,1) -> 2 arrives (1,0) -> 2 arrives with count 0, adopt (2,1). Final candidate 2. Verify with one counting pass: 2 appears 4 times > 3.5 -> majority confirmed. Return 2. The mid-array candidate flip to 1 and back is the point — pairing off mismatches can never eliminate a true majority.',
      viz_anchor: null,
    },
  ],

  'iterative-power': [
    {
      inputs: ['2', '10'],
      expected: '1024',
      explanation_md:
        'Binary exponentiation (recursive D&C reformulated iteratively). Walk bits of n LSB to MSB: result = 1; while n > 0: if n & 1, result *= base; base *= base; n >>= 1. Trace base=2, n=10=0b1010: bit 0 = 0, base=4; bit 1 = 1, result=4, base=16; bit 2 = 0, base=256; bit 3 = 1, result=4*256=1024. Return 1024. O(log n) multiplications vs the naive O(n). The recursive formulation: pow(b,n) = pow(b*b, n/2) if even, else b*pow(b, n-1).',
      viz_anchor: null,
    },
    {
      inputs: ['5', '0'],
      expected: '1',
      explanation_md:
        'Base case. n=0: result=1 by definition (b^0 = 1 for any b, even b=0 by convention here). Loop never enters. Confirms the seed. A bug that initializes result=base infinite-loops if n=0 or returns base.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '13'],
      expected: '1594323',
      explanation_md:
        'Algorithmically interesting: odd exponent. n=13=0b1101: bit 0=1, result=3; base=9; bit 1=0; base=81; bit 2=1, result=3*81=243; base=6561; bit 3=1, result=243*6561=1594323. Total 4 iterations vs naive 13. The bit-by-bit accumulation in `result` corresponds to the binary representation of n: 3^13 = 3^(1+4+8) = 3*3^4*3^8 = 3*81*6561 = 1594323. Matches.',
      viz_anchor: null,
    },
  ],

  'kth-largest-element': [
    {
      inputs: ['[3,2,1,5,6,4]', '2'],
      expected: '5',
      explanation_md:
        'Quickselect: D&C cousin of quicksort. Partition around a pivot; recurse into ONLY the side that contains the kth-largest. Convert: kth largest = (n-k)th smallest in 0-indexed -> n-k = 4. Pick pivot (say 4): partition into [3,2,1] (< 4), [4], [5,6] (>4). The kth target index 4 falls in the right partition. Recurse on [5,6] looking for index 4-4=0 (the smallest of these). Pivot 5: partition [5],[6]; index 0 is 5. Return 5. Average O(n) by recursion only on one side; worst O(n^2) on adversarial pivot.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '1',
      explanation_md:
        'Base case: single element. k=1, target index 0; the singleton IS the answer. The recursion terminates immediately. A bug that requires k <= n with strict `<` would crash here on n=k=1.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,2,3,1,2,4,5,5,6]', '4'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: duplicates trigger 3-way partition. Sort virtual: [1,2,2,3,3,4,5,5,6]. 4th largest = 4 (the median, since the top 3 are 6,5,5). Quickselect with 3-way (Dutch national flag) partitions into <pivot, ==pivot, >pivot — avoids re-recursing on equal elements. Without 3-way, an array of all-equals degrades to O(n^2). Final answer 4. The heap-based alternative (min-heap of size k) is O(n log k) and is sometimes preferred for streaming inputs.',
      viz_anchor: null,
    },
  ],

  'beautiful-array': [
    {
      inputs: ['4'],
      expected: '[2,1,4,3]',
      explanation_md:
        'D&C construction. A beautiful array of size 2n is built from two beautiful arrays of size n: take a beautiful array A of size n; produce 2*A - 1 (odd elements) and 2*A (even elements); concatenate. Property: no a[i] + a[k] = 2*a[j] (i<j<k) — because odd + even is odd, never twice an integer, so the boundary between halves is safe; and the property holds within each half by induction. Trace n=4: beautiful(2) = [1,2]. Odd half: 2*[1,2]-1 = [1,3]. Even half: 2*[1,2] = [2,4]. Concat: [1,3,2,4]. Or starting from [2,1]: odds [3,1], evens [4,2], concat [3,1,4,2]. Many beautiful permutations; [2,1,4,3] is one valid output.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[1]',
      explanation_md:
        'Base case. n=1: [1] is trivially beautiful (no triple to check). Recursion terminates. A bug that returns [0] or [] breaks the doubling step (multiplying empty produces empty).',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '[3,1,2,4,5]',
      explanation_md:
        'Algorithmically interesting: non-power-of-2 size. Build for size 5 by first building a beautiful permutation of [1..k] for k >= 5 (use k=8, the next power of 2), then filter out elements > 5. Beautiful(8) = [1,5,3,7,2,6,4,8] (one valid form). Filter: [1,5,3,2,4]. Reorder per spec -> any valid arrangement like [3,1,2,4,5] also works (verify no triple). The filter-from-power-of-2 trick is the algorithmic insight: bigger superset, then trim.',
      viz_anchor: null,
    },
  ],

  'integer-replacement': [
    {
      inputs: ['8'],
      expected: '3',
      explanation_md:
        'Memoized recursion. f(n) = 1 + min(f(n/2)) if even, 1 + min(f(n+1), f(n-1)) if odd. f(1)=0. Trace f(8) = 1+f(4) = 2+f(2) = 3+f(1) = 3. Three halvings. The memo is critical for odd branches (n+1 and n-1 can revisit each other deeply). For very large n, the memo + greedy bit trick (`n & 3 == 3` -> add 1, else subtract 1) avoids stack overflow.',
      viz_anchor: null,
    },
    {
      inputs: ['7'],
      expected: '4',
      explanation_md:
        'Edge case: odd with the "add 1" choice winning. f(7) = 1 + min(f(8), f(6)). f(8)=3 (above). f(6) = 1+f(3) = 2+min(f(4),f(2)) = 2+min(2,1) = 3. So f(7) = 1+min(3,3) = 4. Both paths same length. Memo saves recomputing f(4), f(2), f(3). Greedy: 7 = 0b111, last two bits "11" -> add 1 -> 8 -> 4 -> 2 -> 1 (4 steps). Matches.',
      viz_anchor: null,
    },
    {
      inputs: ['65535'],
      expected: '17',
      explanation_md:
        'Algorithmically interesting: 16 set bits. 65535 = 2^16 - 1. Greedy: 65535 is odd with trailing bits "11" -> add 1 -> 65536 = 2^16; then halve 16 times straight down to 1. Total 1 + 16 = 17 steps. Memoized recursion confirms the same answer but with deeper recursion. The bit-trick greedy generalizes: for any n with k trailing 1s where k >= 2, adding 1 beats subtracting 1 by removing all k bits at once via the cascading carry.',
      viz_anchor: null,
    },
  ],

  'count-all-possible-routes': [
    {
      inputs: ['[2,3,6,8,4]', '1', '3', '5'],
      expected: '4',
      explanation_md:
        'Memoized recursion on (current_city, remaining_fuel). f(start, fuel) = number of paths from `start` to `finish` ending at finish with possibly more moves remaining. Transition: f(c, f) = (c == finish ? 1 : 0) + sum over neighbors n of f(n, f - |locations[c] - locations[n]|) if fuel suffices. Trace start=1, finish=3, fuel=5: enumerate all routes from city 1 (loc 3) ending at city 3 (loc 8) within fuel 5. Routes: 1->3 (cost 5, fuel 0, count). 1->2->3 (cost 3+2=5, count). 1->4->3 (cost 1+4=5, count). 1->0->3 (cost 1+5=6, over). 1->2->1->3 (3+3+5=11, over). After enumeration: 4 routes. Memo on (city, fuel) collapses the exponential tree.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,3,1]', '1', '0', '6'],
      expected: '5',
      explanation_md:
        'Edge case: small graph, generous fuel. From city 1 (loc 3) to city 0 (loc 4) with fuel 6. Routes: 1->0 (cost 1, count). 1->2->0 (cost 2+3=5, count). 1->0->1->0 (1+1+1=3, count). 1->2->1->0 (2+2+1=5, count). 1->0->2->0 (1+3+3=7, over). Plus 1->0->1->2->1->0 (1+1+2+2+1=7, over). After enumeration: 5. The memo on (1, 6), (0, 5), (2, 4) etc. ensures each state is solved once. Without memo, exponential.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,2,1]', '0', '2', '3'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: insufficient fuel — every branch dies. From city 0 (loc 5) to city 2 (loc 1) with fuel 3. Direct move 0->2 costs |5-1| = 4 > 3, rejected. Via city 1: 0->1 costs |5-2| = 3, leaving fuel 0; the next hop 1->2 needs |2-1| = 1, rejected. State (1, 0) is a dead end (not the finish, no affordable moves), memoized as 0. f(0, 3) = 0 + 0 = 0. Return 0. The memo records dead states once — on larger graphs the same exhausted (city, fuel) pair is hit from many routes, and the cached 0 prunes them all.',
      viz_anchor: null,
    },
  ],

  'count-without-consecutive-1s': [
    {
      inputs: ['3'],
      expected: '5',
      explanation_md:
        'Memoized recurrence: f(n) = f(n-1) + f(n-2), Fibonacci-shape. The reason: a length-n binary string with no two consecutive 1s either ends in 0 (then prefix is any valid length-(n-1)) or ends in 01 (prefix is any valid length-(n-2)). Base f(1)=2 ({"0","1"}), f(2)=3 ({"00","01","10"}). Trace f(3) = 3 + 2 = 5: {"000","001","010","100","101"}. Return 5. Same recurrence as Fibonacci with shifted indices — memo or rolling pair makes it O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '2',
      explanation_md:
        'Base case. n=1: "0" and "1" both valid -> 2. The seed f(1)=2 (not 1) is crucial; a bug setting f(1)=1 produces Fibonacci shifted by one and undercounts everywhere. The recursion terminates without further calls.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '13',
      explanation_md:
        'Algorithmically interesting: confirms Fibonacci shape. f(3)=5, f(4)=f(3)+f(2)=5+3=8, f(5)=f(4)+f(3)=8+5=13. Return 13. The Fibonacci numbers 2,3,5,8,13,... shifted by 2 match this exactly: f(n) = Fib(n+2). The closed form `Fib(n+2)` lets you compute large n in O(log n) via matrix exponentiation.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-days-to-eat-n-oranges': [
    {
      inputs: ['10'],
      expected: '4',
      explanation_md:
        'Memoized recursion. f(n) = 1 + min(n%2 + f(n//2), n%3 + f(n//3)), f(0)=0, f(1)=1. The intuition: eat-1-orange operations are only useful to reach a multiple of 2 or 3, so the "n%2 + f(n//2)" captures "eat n%2 ones, then halve". Trace f(10) = 1 + min(0 + f(5), 1 + f(3)). f(5) = 1+min(1+f(2), 2+f(1)). f(2)=1+min(0+f(1), 2+f(0)) = 1+min(1, 2) = 2. f(1)=1. f(3)=1+min(1+f(1), 0+f(1)) = 1+min(2,1) = 2. So f(5)=1+min(3, 3)=4. f(10)=1+min(0+4, 1+2)=1+min(4,3)=4. Return 4. Memo with hashmap critical — naive recursion explodes.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Base case. n=1: one day to eat the last orange. f(0)=0, f(1)=1. The recursion terminates. A bug initializing f(0)=1 over-counts by one for every input — easy to catch at n=1.',
      viz_anchor: null,
    },
    {
      inputs: ['6'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: doubly-divisible. n=6: 6/2=3, then 3/3=1, then eat 1 -> 3 days. f(6) = 1 + min(0+f(3), 0+f(2)). f(3) = 1+min(1+f(1), 0+f(1)) = 1+min(2,1) = 2. f(2)=2 (above). f(6) = 1 + min(2, 2) = 3. The memo + BFS hybrid (Dijkstra on (n -> n//2, n//3) with edge weight 1 + cost) is the practical solver for very large n.',
      viz_anchor: null,
    },
  ],

  'count-sequences-to-k': [
    {
      inputs: ['[2,3,2]', '6'],
      expected: '2',
      explanation_md:
        'Start val = 1; at each index choose multiply, divide, or leave; count choice-sequences whose final val equals k = 6. Memoized DFS on (index, val-as-fraction). Track val as an exact rational. Write each choice as an exponent e_i in {+1, -1, 0} applied to nums[i]: final val = 2^(e0+e2) * 3^(e1). Target 6 = 2^1 * 3^1 forces e1 = +1 (multiply by the 3) and e0 + e2 = 1 with the two 2s — either (multiply, leave) or (leave, multiply). The (multiply, divide) pair gives exponent 0 and (multiply, multiply) gives 4 * 3 = 12, both rejected. Exactly 2 sequences. Return 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,6,3]', '2'],
      expected: '2',
      explanation_md:
        'Edge case: division is mandatory. Final val = 4^a * 6^b * 3^c with a, b, c in {+1, -1, 0}; in prime exponents that is 2^(2a+b) * 3^(b+c). Target 2 = 2^1 * 3^0 needs 2a + b = 1 and b + c = 0. Solutions: (a=0, b=1, c=-1) -> leave the 4, multiply by 6, divide by 3: 1 * 6 / 3 = 2. And (a=1, b=-1, c=1) -> multiply by 4, divide by 6, multiply by 3: 4 / 6 * 3 = 2 — note val passes through the non-integer 4/6 mid-sequence, which is why val must be tracked as an exact fraction, not an integer. 2 sequences. Return 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5]', '1'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: the value 1 makes all three choices identical. For nums[0] = 1, multiply, divide, and leave ALL keep val = 1 — yet they count as three DIFFERENT choice-sequences. For nums[1] = 5, only "leave" keeps val at the target 1 (multiplying gives 5, dividing gives 1/5). Total = 3 * 1 = 3. Return 3. This is the case that catches a solver that memoizes on val alone and collapses the three distinct choices into one state-path; the count must follow choices, not resulting values.',
      viz_anchor: null,
    },
  ],

  'longest-nice-substring': [
    {
      inputs: ['"YazaAay"'],
      expected: '"aAa"',
      explanation_md:
        'D&C: a "nice" string has every letter present in both cases. Scan; find any char `c` whose other case is absent in the substring — that char is a SPLIT POINT (the answer can\'t cross it). Recurse on left and right of the split. Trace "YazaAay": Y has no y? "y" is present (last char), ok. a/A both present, z has no Z -> split at z. Recurse on "Ya" (Y has no y in this substring, y has no Y; both fail — split, returns "") and on "aAay" (a/A both present, y/Y... y present but Y absent in this substring -> split). Recurse on "aAa" (all present -> nice, length 3) and "" -> return "aAa".',
      viz_anchor: null,
    },
    {
      inputs: ['"c"'],
      expected: '""',
      explanation_md:
        'Edge case: single char. Char c has no C in the substring -> not nice -> return "". The recursion terminates with the empty string. A bug that returns "c" itself (treating single char as nice) breaks every parent recursion. The base case for length-1 string is always "".',
      viz_anchor: null,
    },
    {
      inputs: ['"Bb"'],
      expected: '"Bb"',
      explanation_md:
        'Algorithmically interesting: minimal nice string. "Bb" has B and b both present -> nice -> return as-is. No splitting needed; the recursion immediately verifies and returns. Confirms the base case for already-nice inputs: scan all 26 letters once, check both cases present, return string unchanged. O(n * 26) per recursion level; total O(n^2) worst case.',
      viz_anchor: null,
    },
  ],

  'last-remaining-integer-after-alternating-deletion-operations': [
    {
      inputs: ['8'],
      expected: '3',
      explanation_md:
        'Canonical sample. Operation 1 deletes every SECOND number from the left (the first survives); operation 2 deletes every second from the right (the last survives); alternate until one remains. Simulation: [1,2,3,4,5,6,7,8] -> delete 2,4,6,8 -> [1,3,5,7]. From the right: keep 7, delete 5, keep 3, delete 1 -> [3,7]. From the left: keep 3, delete 7 -> [3]. Return 3. Recursive form: after pass 1, survivors are the odds [1,3,...], and position i holds value 2i-1; so f(n) = 2*g(ceil(n/2)) - 1 where g is the right-starting variant, and the mirror identity g(m) = m + 1 - f(m) closes the recursion. f(8) = 2*(4 + 1 - f(4)) - 1 = 2*(5 - 3) - 1 = 3.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '1',
      explanation_md:
        'Edge case: odd n. Simulation: [1,2,3,4,5] -> delete 2,4 -> [1,3,5]. From the right: keep 5, delete 3, keep 1 -> [1,5]. From the left: keep 1, delete 5 -> [1]. Return 1. Recurrence check: f(3) = 2*(2 + 1 - f(2)) - 1 with f(2) = 1 gives f(3) = 3; then f(5) = 2*(3 + 1 - f(3)) - 1 = 2*1 - 1 = 1. The keep-first convention is the trap — deleting every second number means index 1 always survives pass 1, unlike the LC 390 variant where the first element dies.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Base case. Only one element; no deletion fires and 1 survives by default. The recursion terminates at f(1) = 1. A bug returning 0 (treating the empty list as the answer) cascades to wrong values for every n > 1, since every recursive call bottoms out here.',
      viz_anchor: null,
    },
  ],

  'maximize-number-of-nice-divisors': [
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Recursive insight: factor the budget `primeFactors` into a product of parts; maximize the product. Each part >= 1. The optimal factorization uses parts of 3 (since 3^(n/3) > 2^(n/2) for n>4). For primeFactors=1, no split, single prime with multiplicity 1 -> 1 nice divisor. Return 1. The base case is small; the recurrence kicks in for primeFactors >= 2.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '6',
      explanation_md:
        'Edge case: split 5 = 3 + 2 -> product 6. Building number n = p^3 * q^2 has (3+1)*(2+1) = 12 divisors total, of which 6 are NICE (the ones with all prime exponents >= 1 — the product 3*2=6). Per LC 1808 the answer is product of the factorization. Return 6. The recurrence: best(n) = max(3 * best(n-3), 2 * best(n-2)).',
      viz_anchor: null,
    },
    {
      inputs: ['8'],
      expected: '18',
      explanation_md:
        'Algorithmically interesting: split 8 = 3+3+2 -> 3*3*2 = 18. Recursive: best(8) = max(3*best(5), 2*best(6)) = max(3*6, 2*9) = max(18, 18) = 18. Both decompositions give the same product (Kraft inequality). Modular exponentiation handles much larger primeFactors via 3-power loops with mod 1e9+7. Return 18.',
      viz_anchor: null,
    },
  ],

  'number-of-digit-one': [
    {
      inputs: ['13'],
      expected: '6',
      explanation_md:
        'Digit DP (memoized over (position, tight, count_so_far)) or closed-form by-place counting. Count 1s in 1, 2, ..., 13: 1 (in 1), 1 (in 10), 1 (in 11 twice = 2), 1 (in 12), 1 (in 13). Total: 1+1+2+1+1 = 6. Return 6. The closed-form by-place trick: for each digit position p (1, 10, 100, ...), count of 1s at that position = (n // (10*p)) * p + min(p, max(0, n % (10*p) - p + 1)). Sum over p covers it in O(log n).',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'Edge case. n=0: range [0..0] has no 1s. Return 0. The closed-form loop never enters since n < 1. A bug that starts the digit DP at "position 0 has at least 1" returns 1 here, easy to catch.',
      viz_anchor: null,
    },
    {
      inputs: ['824883294'],
      expected: '767944060',
      explanation_md:
        'Algorithmically interesting: large n forces the closed-form. Sum over each position p = 1, 10, 100, ..., 10^8: count of 1s at position p among [0..n]. Each term is O(1) arithmetic, total O(log n) = 9 iterations. Memoized digit DP also works: state (position, tight, count) with 10 * 2 * (10*n_digits) states. For n=824883294 the answer 767944060 is dominated by the high-position contributions.',
      viz_anchor: null,
    },
  ],

  'k-closest-points-to-origin': [
    {
      inputs: ['[[1,3],[-2,2]]', '1'],
      expected: '[[-2,2]]',
      explanation_md:
        'Quickselect (D&C) or heap. Compute squared distance for each: (1,3)->10; (-2,2)->8. Partition around a pivot distance to select the k smallest. For k=1, pick the smallest -> 8 -> (-2,2). Return [[-2,2]]. Quickselect average O(n), worst O(n^2). Heap of size k is O(n log k) — slower in average but no worst-case explosion. Sorting is O(n log n), simplest to write.',
      viz_anchor: null,
    },
    {
      inputs: ['[[3,3],[5,-1],[-2,4]]', '2'],
      expected: '[[3,3],[-2,4]]',
      explanation_md:
        'Edge case: pick 2 of 3. Distances squared: 18, 26, 20. Sort: 18 ((3,3)), 20 ((-2,4)), 26 ((5,-1)). k=2 smallest -> (3,3) and (-2,4). Return [[3,3],[-2,4]]. Order of output usually unspecified; both [[3,3],[-2,4]] and [[-2,4],[3,3]] are accepted. Quickselect with k=2 partitions once, recurses into the small side. Avoid computing actual sqrt — squared distance is order-preserving.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,1],[1,1]]', '2'],
      expected: '[[1,1],[1,1]]',
      explanation_md:
        'Algorithmically interesting: all tied. Quickselect with 2-way partition can degrade to O(n^2) on ties; 3-way partition (Dutch flag style) handles ties cleanly. Heap also works without degradation. Return any 2 of the 3 identical points. A bug that uses set-based dedup wrongly returns [[1,1]] only.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { data: existing, error: readErr } = await sb
    .from('PGcode_problems')
    .select('id, explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) { console.log(`! ${slug}: read failed: ${readErr.message}`); failed++; continue; }
  if (!existing) { console.log(`? ${slug}: not in DB`); failed++; continue; }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`= ${slug}: already has 3 samples, skipping`);
    skipped++;
    continue;
  }
  const { error } = await sb
    .from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`+ ${slug}`); ok++; }
}
console.log(`\nok=${ok} failed=${failed} skipped=${skipped}`);
