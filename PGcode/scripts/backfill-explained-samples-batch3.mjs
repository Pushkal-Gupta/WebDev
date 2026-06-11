#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 3 (30 problems).
// Same shape as batches 1+2: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch3.mjs

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
  'two-sum-ii-input-array-is-sorted': [
    {
      inputs: ['[2,7,11,15]', '9'],
      expected: '[1,2]',
      explanation_md:
        'The canonical LC example. Because the array is **sorted**, no hash map is needed — two pointers do it in **O(1)** extra space. `left=0(val 2), right=3(val 15)`. Sum `17`, too big — move `right` in. `right=2(val 11)`, sum `13`, still too big. `right=1(val 7)`, sum `9` — match. Return `[1, 2]` (problem uses 1-indexed). Each pointer moves at most `n` times total → **O(n)** time. The hash-map approach would also work but ignores the sorted-ness.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3,4]', '6'],
      expected: '[1,3]',
      explanation_md:
        'A small case proving the pointers must converge from both ends. `left=0(val 2), right=2(val 4)`. Sum `6` — match on the very first comparison. Return `[1, 3]`. A brittle implementation that always advances `left` first before checking the sum would still work here but waste a step. The clean version checks the sum, returns or shifts the pointer in the direction that fixes the over/undershoot.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,0]', '-1'],
      expected: '[1,2]',
      explanation_md:
        'The two-element negative case. `left=0(val -1), right=1(val 0)`. Sum `-1` — match immediately. Return `[1, 2]`. This proves sign does not matter to the two-pointer algorithm — it relies only on the sorted order, not on positivity. A buggy version that assumed positive values and tried to short-circuit when `nums[left] > target` would return early and miss this.',
      viz_anchor: null,
    },
  ],

  'merge-sorted-array': [
    {
      inputs: ['[1,2,3,0,0,0]', '3', '[2,5,6]', '3'],
      expected: '[1,2,2,3,5,6]',
      explanation_md:
        'The canonical LC example. The clever trick: fill `nums1` from the **back** so we never overwrite an unread element. Three pointers — `i=m-1=2, j=n-1=2, k=m+n-1=5`. Compare `nums1[2]=3` vs `nums2[2]=6` — `6` is bigger, write at `k=5`, decrement `j` and `k`. Compare `3` vs `5` — `5` wins, write at `4`. Compare `3` vs `2` — `3` wins, write at `3`. Continue: `2` vs `2` (tie, take from `nums1`), then `1` vs `2`. Final: `[1,2,2,3,5,6]`. **O(m+n)** time, in place.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1', '[]', '0'],
      expected: '[1]',
      explanation_md:
        'The "second array is empty" edge case. With `n=0`, no work is needed — `nums1` already holds the merged result. The from-the-back algorithm handles it naturally: `j` starts at `-1`, the main loop only runs while `j >= 0`, so it exits immediately. The leftover-copy step also runs zero times. Return `[1]`. A brittle implementation that always copies `nums2` into the tail would overflow when `n=0` and the tail does not exist.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]', '0', '[1]', '1'],
      expected: '[1]',
      explanation_md:
        'The "first array is empty" edge case. With `m=0`, every position in `nums1` is the placeholder `0`. The from-the-back loop: `i=-1, j=0, k=0`. The `j>=0 and (i<0 or nums2[j]>=nums1[i])` check forces the `nums2` branch — write `1` at index `0`. Return `[1]`. This is the input that catches a buggy implementation that defaults to the `nums1` branch when both pointers compare to "same" or "out of bounds" — the `i<0` guard must explicitly prefer `nums2`.',
      viz_anchor: null,
    },
  ],

  'remove-duplicates-from-sorted-array': [
    {
      inputs: ['[1,1,2]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Two-pointer pattern: `write=1` (next free slot), `read=1...n-1`. Sorted input means duplicates are adjacent. At `read=1` (val `1`), `nums[read] == nums[write-1]` — duplicate, skip. At `read=2` (val `2`), differs from `nums[0]=1` — write at index `1`, advance `write`. Final `write=2`. Array prefix is `[1, 2, ...]`. Return `2`. **O(n)** time, **O(1)** extra space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-element edge case. One element trivially has no duplicates. The read pointer starts at `1`, but `n=1`, so the loop never runs. `write` stays at `1`. Return `1`. A brittle implementation that initialises `write=0` and writes on every iteration would return `0` here, missing the only element. Always seed `write=1` so the first element is implicitly kept.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,1,1,1,2,2,3,3,4]'],
      expected: '5',
      explanation_md:
        'The "many runs of duplicates" case. Sorted with multiple repeated values. Walk: keep `0`. Skip second `0`. Write `1` at index 1. Skip second and third `1`. Write `2` at index 2. Skip second `2`. Write `3` at index 3. Skip second `3`. Write `4` at index 4. Final prefix `[0,1,2,3,4]`. Return `5`. This case proves the in-place two-pointer never falls behind — `write` only advances when a genuine new value appears, so the prefix is always exactly the distinct set in sorted order.',
      viz_anchor: null,
    },
  ],

  'plus-one': [
    {
      inputs: ['[1,2,3]'],
      expected: '[1,2,4]',
      explanation_md:
        'The canonical LC example. Walk digits right-to-left, adding `1` and carrying. At index `2`: `3+1=4`, no carry — write and stop. Return `[1, 2, 4]`. **O(n)** worst case, **O(1)** in the common no-carry tail case. The brittle version that converts the array to a `BigInt`, adds one, and converts back works in JavaScript but blows up in languages without arbitrary-precision integers when the array is long.',
      viz_anchor: null,
    },
    {
      inputs: ['[9]'],
      expected: '[1,0]',
      explanation_md:
        'The all-nines edge case at minimum size. `9+1=10` — write `0`, carry `1`. The array is exhausted, so the carry needs a **new leading digit**. Allocate a fresh array of length `n+1` with `1` at the front and zeros after. Return `[1, 0]`. A brittle implementation that always returns an array of length `n` would return `[0]` and silently lose the leading `1`. The trailing-allocation step is the only allocation in the whole algorithm.',
      viz_anchor: null,
    },
    {
      inputs: ['[9,9,9]'],
      expected: '[1,0,0,0]',
      explanation_md:
        'The "carry propagates all the way" case. At index 2: `9+1=10` → write `0`, carry. At index 1: `9+1=10` → write `0`, carry. At index 0: `9+1=10` → write `0`, carry. Loop ends with a carry — allocate `[1, 0, 0, 0]`. Return that. This proves the new-array branch is not just a "single 9" special case — it triggers any time the entire input is nines. **O(n)** time, **O(n)** space only in this all-nines branch.',
      viz_anchor: null,
    },
  ],

  'pascals-triangle': [
    {
      inputs: ['5'],
      expected: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]',
      explanation_md:
        'The canonical LC example. Each row starts and ends with `1`; interior entries are the sum of the two entries diagonally above. Row 0: `[1]`. Row 1: `[1, 1]`. Row 2: middle `= 1+1 = 2` → `[1, 2, 1]`. Row 3: `1+2=3, 2+1=3` → `[1, 3, 3, 1]`. Row 4: `1+3=4, 3+3=6, 3+1=4` → `[1, 4, 6, 4, 1]`. **O(n²)** total work since row `i` has `i+1` entries. Build row by row, reading only the previous row.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '[[1]]',
      explanation_md:
        'The smallest valid input. `numRows=1` produces the apex alone — `[[1]]`. The outer loop runs once; the inner build short-circuits because row 0 has only the two outer `1`s, which are the same position. A brittle implementation that always reads `triangle[i-1]` would crash on `i=0`. The clean version handles row 0 as a base case before the recurrence kicks in.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '[[1],[1,1]]',
      explanation_md:
        'The two-row case — proves the transition from "all outer 1s" (row 1) into "interior entries exist" (row 2). Row 0 seeds `[1]`. Row 1: outer pair `[1, 1]` with no interior since length is exactly 2. The inner loop over interior indices `1..i-1` runs zero times when `i=1`. Return `[[1], [1, 1]]`. This case catches an off-by-one in the interior loop bounds — `for j in range(1, i)` is correct; `for j in range(1, i+1)` would write past the end and corrupt the next row.',
      viz_anchor: null,
    },
  ],

  'min-stack': [
    {
      inputs: ['["MinStack","push","push","push","getMin","pop","top","getMin"]', '[[],[-2],[0],[-3],[],[],[],[]]'],
      expected: '[null,null,null,null,-3,null,0,-2]',
      explanation_md:
        'The canonical LC example. To make `getMin` **O(1)**, keep a parallel "min stack" that records the running minimum at each level. After pushing `-2, 0, -3`, the main stack is `[-2, 0, -3]` and the min stack is `[-2, -2, -3]`. `getMin → -3`. Pop drops the top of both stacks → main `[-2, 0]`, min `[-2, -2]`. `top → 0`. `getMin → -2`. Every op is **O(1)**, extra space is **O(n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['["MinStack","push","getMin","top","pop"]', '[[],[5],[],[],[]]'],
      expected: '[null,null,5,5,null]',
      explanation_md:
        'The single-element edge case. Push `5` → main `[5]`, min `[5]`. `getMin → 5` (the only value is also the minimum). `top → 5`. Pop empties both stacks. This proves the min stack must always push **something** on every push, even when the new value is not strictly less — otherwise after popping unrelated values the min stack would not align with the main stack.',
      viz_anchor: null,
    },
    {
      inputs: ['["MinStack","push","push","push","getMin","pop","getMin"]', '[[],[2],[1],[2],[],[],[]]'],
      expected: '[null,null,null,null,1,null,1]',
      explanation_md:
        'The "pop a non-minimum" case. Push `2, 1, 2`. Main `[2, 1, 2]`, min `[2, 1, 1]` (the last `1` because the new `2 >= 1`). `getMin → 1`. Pop the top — main `[2, 1]`, min `[2, 1]`. `getMin → 1`. This catches the bug of recording the new value on the min stack instead of the running minimum: if we had pushed `2` onto the min stack at step 3, the min stack would be `[2, 1, 2]`, and after popping we would have min `[2, 1]` — still correct here but `getMin` after another push could go wrong.',
      viz_anchor: null,
    },
  ],

  'implement-queue-using-stacks': [
    {
      inputs: ['["MyQueue","push","push","peek","pop","empty"]', '[[],[1],[2],[],[],[]]'],
      expected: '[null,null,null,1,1,false]',
      explanation_md:
        'The canonical LC example. Use two stacks — `in` for pushes, `out` for pops/peeks. Push `1, 2`: `in = [1, 2]`, `out = []`. `peek`: `out` is empty, so dump `in` into `out` (reversing order) → `out = [2, 1]`. Top of `out` is `1` → return `1`. `pop` → return `1`, `out = [2]`. `empty` → `false`. Amortised **O(1)** per op — each element is moved across stacks at most twice.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyQueue","push","pop","empty"]', '[[],[1],[],[]]'],
      expected: '[null,null,1,true]',
      explanation_md:
        'The single-push-then-pop case. Push `1` → `in = [1]`. `pop`: `out` empty, transfer → `out = [1]`. Pop `1`. `empty`: both stacks empty → `true`. This proves the transfer must happen on `pop` as well as `peek` — a brittle version that only refills `out` on `peek` would fail to pop on a fresh queue.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyQueue","push","push","pop","push","pop","pop"]', '[[],[1],[2],[],[3],[],[]]'],
      expected: '[null,null,null,1,null,2,3]',
      explanation_md:
        'The interleaved-pushes case. Push `1, 2` → `in=[1,2]`. Pop: transfer → `out=[2,1]`, pop `1`. Push `3` → `in=[3]`. Pop: `out` still has `[2]`, pop `2` directly — **do not transfer again**. Pop: `out` empty, transfer → `out=[3]`, pop `3`. This case proves the "only refill `out` when it is empty" rule preserves FIFO order; a buggy version that always refills would mix old and new pushes wrong.',
      viz_anchor: null,
    },
  ],

  'implement-stack-using-queues': [
    {
      inputs: ['["MyStack","push","push","top","pop","empty"]', '[[],[1],[2],[],[],[]]'],
      expected: '[null,null,null,2,2,false]',
      explanation_md:
        'The canonical LC example. Single-queue approach: on every `push x`, enqueue `x`, then rotate the queue by dequeuing and re-enqueuing all the **older** elements so `x` ends up at the front. After push `1`: queue `[1]`. After push `2`: enqueue → `[1, 2]`, rotate `1` to the back → `[2, 1]`. `top → 2`. `pop → 2`, queue `[1]`. `empty → false`. Push is **O(n)**, pop/top/empty are **O(1)**.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyStack","push","pop","empty"]', '[[],[1],[],[]]'],
      expected: '[null,null,1,true]',
      explanation_md:
        'The single-element case. Push `1`: enqueue → `[1]`, rotate `0` older elements (no-op). `pop → 1`, queue empty. `empty → true`. Proves the rotation loop bound is `size - 1`, not `size` — with `size=1` we rotate zero times, otherwise we would cycle the element back into the same position pointlessly.',
      viz_anchor: null,
    },
    {
      inputs: ['["MyStack","push","push","push","top","pop","top"]', '[[],[1],[2],[3],[],[],[]]'],
      expected: '[null,null,null,null,3,3,2]',
      explanation_md:
        'The three-push case — proves LIFO order is preserved after multiple rotations. Push `1`: `[1]`. Push `2`: enqueue, rotate one → `[2, 1]`. Push `3`: enqueue → `[2, 1, 3]`, rotate two → `[3, 2, 1]`. `top → 3`. `pop → 3`, queue `[2, 1]`. `top → 2`. Each push pays an `O(n)` price but the resulting queue is always in stack order, so reads are constant-time.',
      viz_anchor: null,
    },
  ],

  'jump-game': [
    {
      inputs: ['[2,3,1,1,4]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Greedy: track the **farthest reachable index** as we sweep left to right. At `i=0`, max reach = `0+2=2`. At `i=1`, max reach = `max(2, 1+3) = 4`. Already covers the last index `4` → return `true`. Linear time, constant space. The DP-from-the-end variant is also correct but does redundant work checking every jump distance.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: 'true',
      explanation_md:
        'The single-element edge case. We start at the last index already → trivially reachable. A brittle implementation that checks `nums[0] > 0` would return `false` here, but the correct condition is "can we reach `n-1`?" which is true at `i=0` when `n=1`. Always handle "already there" before consulting the jump value.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,2,1,0,4]'],
      expected: 'false',
      explanation_md:
        'The "stuck at a zero" case. Greedy trace: `i=0` reach `3`. `i=1` reach `max(3, 1+2)=3`. `i=2` reach `max(3, 2+1)=3`. `i=3` reach `max(3, 3+0)=3`. Now `i=4` but `reach=3 < 4` — we cannot enter index 4. Loop exits when `i > reach`; return `false`. This proves the algorithm must short-circuit when `i` exceeds the current reach — otherwise it would walk past the dead zero and lie that the end is reachable.',
      viz_anchor: null,
    },
  ],

  'jump-game-ii': [
    {
      inputs: ['[2,3,1,1,4]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. BFS-style greedy: track the current "level boundary" and the farthest reach within it. At `i=0`: reach `2`. Boundary `0`, hit it → jump count `1`, new boundary `2`. At `i=1`: reach `max(2, 1+3)=4`. At `i=2`: still within boundary `2`, hit it → jump count `2`, new boundary `4`. We need to reach index `4`, boundary covers it → done. Return `2`. **O(n)** time. The two jumps are: from `0` to `1`, then from `1` to `4`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '0',
      explanation_md:
        'The single-element edge case. We start at the last index → zero jumps needed. The greedy loop runs `for i in range(n-1)` so on `n=1` it never enters. The counter stays at `0`. Return `0`. A brittle implementation that always increments at least once would return `1` here, claiming we need a jump to reach a place we already are.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3,0,1,4]'],
      expected: '2',
      explanation_md:
        'A case where the greedy must look ahead carefully. From `i=0` (val 2), best next position is `i=1` (val 3) because it reaches `4`, not `i=2` (val 0) which is a dead-end. The level-boundary algorithm encodes this: within boundary `0..2`, the farthest reach is `1+3=4`, regardless of which specific index achieved it. Second jump covers `1..4`, reaching the end. Return `2`. The algorithm never explicitly picks an intermediate — it just tracks the best reach.',
      viz_anchor: null,
    },
  ],

  'subsets': [
    {
      inputs: ['[1,2,3]'],
      expected: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]',
      explanation_md:
        'The canonical LC example. Iterative builder: start with `[[]]`, then for each number `x` add `x` to every existing subset. Step 1 with `x=1`: `[[], [1]]`. Step 2 with `x=2`: append `[2], [1,2]` → `[[], [1], [2], [1,2]]`. Step 3 with `x=3`: append `[3], [1,3], [2,3], [1,2,3]`. Total `2^3 = 8` subsets. **O(n · 2^n)** time and space, which is optimal because the output itself has that size.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[[],[0]]',
      explanation_md:
        'The single-element edge case. Start with `[[]]`. For `x=0`: append `[0]` → `[[], [0]]`. Two subsets total, matching `2^1`. This catches a brittle implementation that requires `n >= 2` to start the recurrence, and proves zero values are included like any other — the algorithm treats values as opaque labels, not by magnitude.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: '[[],[1],[2],[1,2]]',
      explanation_md:
        'The two-element case. Start `[[]]`. Add `1` → `[[], [1]]`. Add `2`: clone each existing subset and append `2` → `[[], [1], [2], [1, 2]]`. Four subsets total. Output order: each "level" of the iteration appends to the end, so subsets containing later elements appear after subsets without them. The order in the expected output matches this iterative build exactly; backtracking-based variants may produce a different (but also valid) order.',
      viz_anchor: null,
    },
  ],

  'permutations': [
    {
      inputs: ['[1,2,3]'],
      expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
      explanation_md:
        'The canonical LC example. Backtracking: at each position pick an unused element, recurse, undo. From the empty prefix pick `1`, then from `{2,3}` pick `2` then `3` → `[1,2,3]`; backtrack, pick `3` then `2` → `[1,3,2]`. Repeat with `2` and `3` as the leading pick. Total `3! = 6` permutations. **O(n · n!)** time. The output order is the DFS order produced by iterating elements in their input order at each step.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[[1]]',
      explanation_md:
        'The single-element edge case. One permutation — the input itself. The recursion bottoms out immediately because the prefix length equals `n` after picking the first (and only) element. Return `[[1]]`. A brittle implementation that always swaps two indices to permute would fail here because there is nothing to swap; the picking-pattern approach handles it without special-casing.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1]'],
      expected: '[[0,1],[1,0]]',
      explanation_md:
        'The two-element case. Pick `0`, then from `{1}` pick `1` → `[0, 1]`. Backtrack, pick `1`, then from `{0}` pick `0` → `[1, 0]`. Two permutations total, matching `2!`. This proves the "used set" tracking works — without it, the algorithm would happily output `[0, 0]` and `[1, 1]` by picking the same index twice.',
      viz_anchor: null,
    },
  ],

  'combinations': [
    {
      inputs: ['4', '2'],
      expected: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]',
      explanation_md:
        'The canonical LC example. Combinations differ from permutations: order does not matter, so we only emit pairs in increasing order. Backtracking from `start=1, k=2`: pick `1`, then from `{2,3,4}` pick each in turn → `[1,2], [1,3], [1,4]`. Backtrack to top, pick `2`, then from `{3,4}` → `[2,3], [2,4]`. Pick `3`, then from `{4}` → `[3,4]`. Pick `4` — no room for the second element. Total `C(4,2) = 6`. **O(k · C(n,k))** time.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '[[1]]',
      explanation_md:
        'The trivial smallest case. `n=1, k=1` → only one combination: `[1]`. The backtracking picks `1`, recurses with `k-1=0` remaining → emit. `C(1,1) = 1`. A brittle implementation that requires `n > k` to start the recursion would fail here; the clean version allows `n == k` and `k == 1` as valid bases.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '4'],
      expected: '[[1,2,3,4]]',
      explanation_md:
        'The "pick everything" case. `n=k=4` → only one combination, the full set. Backtracking picks `1`, then `2`, then `3`, then `4` — every other branch dies because there are not enough remaining elements to fill the rest of the combination. **Pruning**: the loop bound is `start..n-k+remaining+1`, so once `start > n-k+remaining+1` we stop. `C(4,4) = 1`. This case proves the pruning works: without it, the algorithm would explore failing branches like "pick 1 then 3" and waste time.',
      viz_anchor: null,
    },
  ],

  'combination-sum': [
    {
      inputs: ['[2,3,6,7]', '7'],
      expected: '[[2,2,3],[7]]',
      explanation_md:
        'The canonical LC example. Each element can be picked **unlimited times**, so the recursion does not advance `start` when reusing. From `target=7` with `start=0`: pick `2`, remaining `5`. Pick `2` again, remaining `3`. Pick `3` (advance past `2` since `2+3=5` already exceeded), remaining `0` → emit `[2, 2, 3]`. Backtracking eventually picks `7` directly → emit `[7]`. Branches with `6` or `3+3+3...` either overshoot or are equivalent to already-seen combos.',
      viz_anchor: null,
    },
    {
      inputs: ['[2]', '1'],
      expected: '[]',
      explanation_md:
        'The "no valid combination" edge case. Target `1`, only candidate is `2 > 1`. Recursion: pick `2`, remaining `-1` — overshot, prune. No more candidates. Return `[]`. A brittle implementation that returns `[[]]` (the empty combination) for "no hits" would be wrong because the empty combination sums to `0`, not the target. Return an empty list, not a list containing the empty list.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3,5]', '8'],
      expected: '[[2,2,2,2],[2,3,3],[3,5]]',
      explanation_md:
        'The "multiple solutions, varying length" case. From target `8`: pick four `2`s (`2+2+2+2=8`); pick `2+3+3=8`; pick `3+5=8`. The branch picking `5` first then `3` is the same combination as `[3, 5]` because we always emit in non-decreasing order — that ordering is what prevents duplicates like `[5, 3]` from also being emitted. Three combinations total. **O(N^(target/min))** worst case, but pruning on overshoot keeps it tractable.',
      viz_anchor: null,
    },
  ],

  'generate-parentheses': [
    {
      inputs: ['3'],
      expected: '["((()))","(()())","(())()","()(())","()()()"]',
      explanation_md:
        'The canonical LC example. Backtracking with two counters — `open` (how many `(` placed) and `close` (how many `)` placed), both bounded by `n`. Rules: place `(` whenever `open < n`; place `)` only when `close < open` (so brackets can still balance). Trace produces 5 strings for `n=3` — the **Catalan number** `C_3`. The "close only when close < open" rule is what guarantees every output is well-formed; no validation step is needed.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '["()"]',
      explanation_md:
        'The smallest valid input. `n=1` → one pair, one valid string `()`. Backtracking places `(` (open `1`, close `0`), then `)` (open `1`, close `1`) — string length `2 = 2n`, emit. Catalan number `C_1 = 1`. A brittle implementation that requires `n >= 2` to enter the recursion would return `[]` here.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '["(())","()()"]',
      explanation_md:
        'The "two pairs" case. Two valid outputs — `(())` (nest) and `()()` (sequence). Backtracking: place `(` (1,0), place `(` (2,0), place `)` (2,1), place `)` (2,2) → emit `(())`. Backtrack to (1,0): cannot place `(` (would make `open=2` then close at 0 mid-string, but actually fine), but try `)` from (1,0)? No — `close < open` is `0 < 1`, so yes. Place `)` (1,1), place `(` (2,1), place `)` (2,2) → emit `()()`. Catalan `C_2 = 2`.',
      viz_anchor: null,
    },
  ],

  'letter-combinations-of-a-phone-number': [
    {
      inputs: ['"23"'],
      expected: '["ad","ae","af","bd","be","bf","cd","ce","cf"]',
      explanation_md:
        'The canonical LC example. Map digits to letters: `2 → "abc"`, `3 → "def"`. Backtracking: for each letter of the first digit, recurse over the second digit. From `a`: emit `ad, ae, af`. From `b`: emit `bd, be, bf`. From `c`: emit `cd, ce, cf`. Total `3 * 3 = 9` strings. **O(4^n · n)** worst case because some digits (`7`, `9`) map to four letters.',
      viz_anchor: null,
    },
    {
      inputs: ['""'],
      expected: '[]',
      explanation_md:
        'The empty-input edge case. No digits → no combinations. The recursion never starts; return `[]`. A brittle implementation that initialises the result with `[""]` (the empty string is a "combination of zero digits") would return `[""]` here, which most graders treat as wrong. The correct answer for the empty input is the empty list.',
      viz_anchor: null,
    },
    {
      inputs: ['"2"'],
      expected: '["a","b","c"]',
      explanation_md:
        'The single-digit case. `2 → "abc"`. Backtracking emits each letter alone. Three combinations. This proves the recursion base case fires when the current index equals the input length — at that point the built string is emitted as-is, regardless of how long it is. The base case must NOT require a minimum length; any valid prefix becomes a valid output when there are no more digits to process.',
      viz_anchor: null,
    },
  ],

  'word-search': [
    {
      inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCCED"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. DFS from every cell, marking visited cells to prevent reuse within a single search path. Start at `(0,0)=A` matching `word[0]=A`. Recurse to `(0,1)=B` matching `B`. Recurse to `(0,2)=C` matching `C`. Recurse to `(1,2)=C` matching `C`. Recurse to `(2,2)=E` matching `E`. Recurse to `(2,1)=D` matching `D`. Word consumed — return `true`. Each cell is visited once per path; total **O(m·n·4^L)** where `L = len(word)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCB"'],
      expected: 'false',
      explanation_md:
        'The "cannot reuse a cell" edge case. `A → B → C` works. The next letter `B` requires going back to `(0,1)` — but that cell is **already on the current path**. The visited-marker check rejects it. No other neighbour of `(0,2)=C` has value `B` either. DFS unwinds, tries other start cells, none succeed. Return `false`. This is exactly the input that proves the marker is mandatory; without it, the algorithm would walk back to `(0,1)` and lie that `ABCB` exists.',
      viz_anchor: null,
    },
    {
      inputs: ['[["A"]]', '"A"'],
      expected: 'true',
      explanation_md:
        'The smallest grid + smallest word. Start at `(0,0)=A`, match `word[0]=A`, word consumed → return `true`. The recursion exits before even looking at neighbours, because the base case fires when the word index reaches the word length. A brittle implementation that requires at least one neighbour traversal would fail here.',
      viz_anchor: null,
    },
  ],

  'spiral-matrix': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[1,2,3,6,9,8,7,4,5]',
      explanation_md:
        'The canonical LC example. Maintain four boundaries: `top, bottom, left, right`. Each layer: walk top row left→right, right column top→bottom, bottom row right→left, left column bottom→top — then shrink. Layer 0: `1,2,3` (top), `6,9` (right), `8,7` (bottom), `4` (left). Shrink → only `(1,1)=5` left. Layer 1: emit `5`. Final `[1,2,3,6,9,8,7,4,5]`. **O(m·n)** time, **O(1)** extra space (just the four pointers).',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[1]',
      explanation_md:
        'The single-cell edge case. `top=bottom=left=right=0`. Walk top row: emit `1`. Shrink — `top=1 > bottom=0`, loop exits. Return `[1]`. A brittle implementation that always walks all four sides would re-emit `1` four times here. The clean version checks `top <= bottom` and `left <= right` between each side walk and skips the redundant ones.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'],
      expected: '[1,2,3,4,8,12,11,10,9,5,6,7]',
      explanation_md:
        'The non-square rectangle case — `3x4`. Layer 0: top `1,2,3,4`; right `8,12`; bottom `11,10,9`; left `5`. Shrink → inner row `[6, 7]` at row 1. Layer 1: top `6,7`; right walk would go top-to-bottom but only one row remains, **skip** (or the condition `top <= bottom` catches it); same for left. Total emitted `[1,2,3,4,8,12,11,10,9,5,6,7]` — 12 elements. The skip-when-degenerate check is the only thing preventing duplicate emission on the inner thin layer.',
      viz_anchor: null,
    },
  ],

  'rotate-image': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[[7,4,1],[8,5,2],[9,6,3]]',
      explanation_md:
        'The canonical LC example. Rotating 90° clockwise in place = **transpose then reverse each row**. Transpose: swap `matrix[i][j]` with `matrix[j][i]` for `i < j`. After transpose: `[[1,4,7],[2,5,8],[3,6,9]]`. Reverse each row: `[[7,4,1],[8,5,2],[9,6,3]]`. **O(n²)** time, **O(1)** extra space. Direct rotation by tracking four corners per layer also works but the code is harder to write without an off-by-one.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[1]]',
      explanation_md:
        'The single-cell edge case. Transpose: the inner loop `for j in range(i+1, n)` runs zero times when `n=1`. Reverse a one-element row: no-op. Return unchanged. A brittle implementation using explicit four-corner rotation must guard against `n=1` because there is no four-cell cycle to rotate. The transpose-then-reverse approach handles it naturally.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]'],
      expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
      explanation_md:
        'The 4x4 case from LC. After transpose: `[[5,2,13,15],[1,4,3,14],[9,8,6,12],[11,10,7,16]]`. After reversing each row: `[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]`. This input proves the algorithm works for `n > 3` and that the in-place transpose only touches `n(n-1)/2 = 6` pairs (the strict upper triangle). Doing every `(i, j)` instead would double-swap and return the original matrix.',
      viz_anchor: null,
    },
  ],

  'set-matrix-zeroes': [
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '[[1,0,1],[0,0,0],[1,0,1]]',
      explanation_md:
        'The canonical LC example. **O(1)** space trick: use the first row and first column as markers for which rows/columns to zero. First scan: track whether row 0 / column 0 themselves contain a zero. Then for each interior zero at `(i, j)`, set `matrix[0][j] = 0` and `matrix[i][0] = 0`. Here the only zero is at `(1, 1)` → mark `matrix[0][1] = 0` and `matrix[1][0] = 0`. Second pass: zero any cell whose row or column marker is `0`. Result `[[1,0,1],[0,0,0],[1,0,1]]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1,2,0],[3,4,5,2],[1,3,1,5]]'],
      expected: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]',
      explanation_md:
        'The "first row contains a zero" case — the tricky one. Pre-scan flags `firstRowHasZero = true`. Zeros at `(0,0)` and `(0,3)` mark `matrix[0][0]` and `matrix[0][3]` already (already zero), no extra columns. Interior pass: only row 0 has zeros, so no further marks. Second pass: column 0 and column 3 become all zeros (their markers are zero); row 0 itself becomes all zeros because of the flag. Result has the entire top row zeroed plus columns 0 and 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[1]]',
      explanation_md:
        'The single-cell edge case. No zeros anywhere. The pre-scan flags stay `false`, the interior pass does nothing, the second pass does nothing. Return unchanged. A brittle implementation that always zeros row 0 or column 0 at the end (based on the markers being modified during the interior pass) would incorrectly zero the cell here — but since neither flag was set, the clean version skips that final step.',
      viz_anchor: null,
    },
  ],

  'coin-change': [
    {
      inputs: ['[1,2,5]', '11'],
      expected: '3',
      explanation_md:
        'The canonical LC example. DP: `dp[i]` = fewest coins to make amount `i`. Base `dp[0] = 0`, others `infinity`. For each `i` from 1 to 11, try each coin `c <= i`: `dp[i] = min(dp[i], dp[i-c] + 1)`. Result `dp[11] = 3` — e.g. `5+5+1`. **O(amount · #coins)** time. The greedy "always pick largest coin" fails on inputs like `[1, 3, 4]` target `6` (greedy picks `4+1+1=3` coins vs optimal `3+3=2`), so DP is necessary.',
      viz_anchor: null,
    },
    {
      inputs: ['[2]', '3'],
      expected: '-1',
      explanation_md:
        'The "impossible" edge case. Only `2`-coins, target is odd → no combination works. `dp[1]` stays `infinity` (no coin `<= 1`). `dp[3]` would need `dp[1] + 1 = infinity` — stays `infinity`. Return `-1`. The brittle implementation that returns `0` for "no solution" silently corrupts callers expecting "made it with zero coins". Always return the sentinel `-1` when the final `dp[amount]` remained at the unreachable value.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '0'],
      expected: '0',
      explanation_md:
        'The zero-amount edge case. To make amount `0`, we need zero coins. `dp[0] = 0` by the base case; the main loop runs over `i = 1..0`, which is empty. Return `dp[0] = 0`. This is the input that distinguishes "amount unreachable" (return `-1`) from "amount trivially reachable with the empty set" (return `0`) — the base case must seed `dp[0]` explicitly, not leave it at `infinity` like the others.',
      viz_anchor: null,
    },
  ],

  'longest-increasing-subsequence': [
    {
      inputs: ['[10,9,2,5,3,7,101,18]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. DP: `dp[i]` = LIS ending at index `i`. For each `i`, scan all `j < i` and if `nums[j] < nums[i]`, take `dp[i] = max(dp[i], dp[j] + 1)`. Final answer = `max(dp)`. Trace produces `dp = [1,1,1,2,2,3,4,4]`. Max is `4` — one such subsequence is `[2, 3, 7, 18]` or `[2, 3, 7, 101]`. **O(n²)** time. There is also a **O(n log n)** patience-sort variant using binary search on a "tails" array.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,7,7,7,7,7,7]'],
      expected: '1',
      explanation_md:
        'The "all same" edge case. No two elements are strictly increasing — every `dp[i] = 1`. Max is `1`. Return `1`. A brittle implementation using `<=` instead of `<` in the comparison would chain duplicates and return `7` here — wrong because the problem says **strictly** increasing. The strict comparison is the only thing that matters for correctness on duplicate inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,0,3,2,3]'],
      expected: '4',
      explanation_md:
        'The "subsequence is non-contiguous" case. The LIS is `[0, 1, 2, 3]` — picking indices `0, 1, 4, 5`. The intermediate `0` and the first `3` are skipped. DP trace: `dp = [1, 2, 1, 3, 3, 4]`. Max is `4`. This input is the textbook proof that the answer is not simply the length of the longest contiguous run — `[0, 1, 3]` is contiguous-increasing and shorter; `[0, 1, 2, 3]` requires hopping over noise.',
      viz_anchor: null,
    },
  ],

  'unique-paths': [
    {
      inputs: ['3', '7'],
      expected: '28',
      explanation_md:
        'The canonical LC example. DP: `dp[i][j]` = paths from `(0,0)` to `(i,j)`, moving only right or down. Recurrence `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. Top row and left column are all `1`. For `m=3, n=7`, the bottom-right corner ends up `28`. This is also the combinatorial formula `C(m+n-2, m-1) = C(8, 2) = 28`. **O(m·n)** DP, or **O(1)** with the formula.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '1'],
      expected: '1',
      explanation_md:
        'The smallest grid. Start and end are the same cell — exactly one path: stand still. `dp[0][0] = 1` by the base case; no loop iterations needed. Return `1`. A brittle implementation that requires at least one move would return `0` here, but standing still is a valid "path of length zero".',
      viz_anchor: null,
    },
    {
      inputs: ['3', '3'],
      expected: '6',
      explanation_md:
        'A small symmetric grid. DP table fills as: row 0 `[1,1,1]`, row 1 `[1,2,3]`, row 2 `[1,3,6]`. Bottom-right is `6`. Combinatorial check: `C(4, 2) = 6`. The six paths correspond to the six orderings of `{R, R, D, D}` (two rights, two downs). This is the input that catches a buggy DP using `dp[i][j] = dp[i-1][j-1] * 2` (a tempting wrong recurrence) — that would give `4`, not `6`.',
      viz_anchor: null,
    },
  ],

  'unique-paths-ii': [
    {
      inputs: ['[[0,0,0],[0,1,0],[0,0,0]]'],
      expected: '2',
      explanation_md:
        'The canonical LC example. Like Unique Paths but a `1` cell blocks travel — set `dp[i][j] = 0` there. With the obstacle at `(1, 1)`, paths through the middle die. DP: row 0 `[1,1,1]`, row 1 `[1,0,1]` (the center killed), row 2 `[1,1,2]`. Bottom-right is `2`. The two surviving paths go around the obstacle: right-right-down-down and down-down-right-right.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '0',
      explanation_md:
        'The "start is blocked" edge case. The single cell is an obstacle, so the start itself is unreachable → zero paths. The DP base case must check `grid[0][0]` and seed `dp[0][0] = 0` when blocked. A brittle implementation that hard-codes `dp[0][0] = 1` would return `1` here. The fix: `dp[0][0] = grid[0][0] == 0 ? 1 : 0`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[0,0]]'],
      expected: '1',
      explanation_md:
        'A 2x2 with an obstacle on the top-right. DP: `dp[0][0] = 1`, `dp[0][1] = 0` (obstacle), `dp[1][0] = 1`, `dp[1][1] = dp[0][1] + dp[1][0] = 0 + 1 = 1`. Return `1` — only the down-then-right path survives. This proves the obstacle correctly zeroes its own cell **and** prevents inheritance from that direction in downstream cells, without any special case at the destination.',
      viz_anchor: null,
    },
  ],

  'minimum-path-sum': [
    {
      inputs: ['[[1,3,1],[1,5,1],[4,2,1]]'],
      expected: '7',
      explanation_md:
        'The canonical LC example. DP: `dp[i][j]` = min cost to reach `(i, j)`. Recurrence `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`. Trace: row 0 `[1,4,5]`, row 1 `[2,7,6]`, row 2 `[6,8,7]`. Bottom-right is `7`. Path: `1 → 3 → 1 → 1 → 1`. **O(m·n)** time, can be reduced to **O(n)** space by keeping only one row.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6]]'],
      expected: '12',
      explanation_md:
        'The 2x3 case. Trace: row 0 `[1, 3, 6]`. Row 1: `dp[1][0] = 1+4 = 5`, `dp[1][1] = 5 + min(5, 3) = 8`, `dp[1][2] = 6 + min(8, 6) = 12`. Return `12`. Path is `1 → 2 → 3 → 6` (top row then last column). Proves the algorithm correctly compares the two predecessors at each cell rather than committing to one direction.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5]]'],
      expected: '5',
      explanation_md:
        'The single-cell edge case. `dp[0][0] = grid[0][0] = 5`. No loops run. Return `5`. A brittle implementation that always reads `dp[-1][0]` or `dp[0][-1]` in the recurrence would crash here. The base case must seed `dp[0][0]` first, then the row-0 and column-0 fills use only one predecessor each.',
      viz_anchor: null,
    },
  ],

  'edit-distance': [
    {
      inputs: ['"horse"', '"ros"'],
      expected: '3',
      explanation_md:
        'The canonical LC example. DP: `dp[i][j]` = edits to convert `word1[:i]` to `word2[:j]`. Recurrence: if chars match, `dp[i][j] = dp[i-1][j-1]`; else `1 + min(insert, delete, replace)` = `1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1])`. Final `dp[5][3] = 3` — e.g. replace `h→r`, delete `r`, delete `e`. **O(m·n)** time and space (space reducible to **O(min)**).',
      viz_anchor: null,
    },
    {
      inputs: ['""', '"abc"'],
      expected: '3',
      explanation_md:
        'The "one string empty" edge case. To turn an empty string into `"abc"` we need 3 insertions. The DP base case seeds `dp[0][j] = j` and `dp[i][0] = i`. Return `dp[0][3] = 3`. This is the input that proves the base row/column must be initialised explicitly — a brittle implementation that starts the recurrence at `(1, 1)` without seeding row 0 would read uninitialised cells and return garbage.',
      viz_anchor: null,
    },
    {
      inputs: ['"intention"', '"execution"'],
      expected: '5',
      explanation_md:
        'A larger LC example proving multiple operation types are needed. Edits: replace `i→e`, replace `n→x`, replace `t→c` (or similar), insert `u`, delete one `n`. Five total. DP runs over all `10 * 10` cells. The final value `dp[9][9] = 5`. The algorithm itself does not "choose" specific operations — it just tracks the minimum count, and the path can be recovered by backtracking through the DP table if needed.',
      viz_anchor: null,
    },
  ],

  'word-break': [
    {
      inputs: ['"leetcode"', '["leet","code"]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. DP: `dp[i]` = can the prefix `s[:i]` be segmented. Base `dp[0] = true`. For each `i` from 1 to `n`, check every split point `j < i`: if `dp[j]` is true and `s[j:i]` is in the dictionary, set `dp[i] = true`. Trace: `dp[4]` becomes `true` because `s[:0]` is empty and `"leet"` is in the dict. `dp[8]` becomes `true` because `dp[4]` is `true` and `"code"` is in the dict. Return `dp[8] = true`.',
      viz_anchor: null,
    },
    {
      inputs: ['"applepenapple"', '["apple","pen"]'],
      expected: 'true',
      explanation_md:
        'The "reuse a word" case. The dictionary contains `apple` once, but the string uses it twice — that is allowed; the dictionary is a set of permitted pieces, not a multiset. Trace: `dp[5]` true (`apple`), `dp[8]` true (`pen`), `dp[13]` true (`apple` again). Return `true`. This proves the algorithm correctly treats the dictionary as a reusable lookup, not as a consume-on-use bag.',
      viz_anchor: null,
    },
    {
      inputs: ['"catsandog"', '["cats","dog","sand","and","cat"]'],
      expected: 'false',
      explanation_md:
        'The "almost works but doesn\'t" case. Greedy "longest match first" picks `cats`, then needs to segment `andog` — fails because `andog` is not in the dictionary even though `and` and `dog` are individually and `cat + sand + og` also fails. DP exhaustively tries every split: `dp[3]=true (cat)`, `dp[4]=true (cats)`, `dp[7]=true (cats+and or cat+sand)`, but `dp[9]` stays `false` because `og` is not in the dictionary. Return `false`.',
      viz_anchor: null,
    },
  ],

  'decode-ways': [
    {
      inputs: ['"12"'],
      expected: '2',
      explanation_md:
        'The canonical LC example. `12` decodes as `1,2 → "AB"` or `12 → "L"`. DP: `dp[i]` = ways to decode `s[:i]`. `dp[0] = 1` (empty). At `i=1`: `s[0]=\'1\'` is non-zero → `dp[1] += dp[0] = 1`. At `i=2`: `s[1]=\'2\'` non-zero → `dp[2] += dp[1] = 1`; two-digit `s[0:2]=12` in 10..26 → `dp[2] += dp[0] = 1`. Return `dp[2] = 2`.',
      viz_anchor: null,
    },
    {
      inputs: ['"06"'],
      expected: '0',
      explanation_md:
        'The "leading zero" edge case. `0` has no decoding (codes start from `1`), and `06` is not a valid two-digit code (range is `10..26`). So no decoding exists → return `0`. The brittle implementation that treats `\'0\'` as `\'10\'`-style would return `1` here. The fix: at each step, only count the one-digit branch if `s[i-1] != \'0\'`, and only the two-digit branch if `s[i-2:i]` is in `10..26`.',
      viz_anchor: null,
    },
    {
      inputs: ['"226"'],
      expected: '3',
      explanation_md:
        'The "multiple split points" case. `226` decodes as `2,2,6 → "BBF"`, `22,6 → "VF"`, or `2,26 → "BZ"`. DP: `dp[0]=1, dp[1]=1` (`\'2\'`), `dp[2]=2` (`\'2,2\'` or `\'22\'`), `dp[3]=3` (extend each: `2,2,6`; `22,6`; `2,26`). Return `3`. Proves the recurrence sums **both** branches whenever both are valid, not picks one — that is what produces the count growth.',
      viz_anchor: null,
    },
  ],

  'partition-equal-subset-sum': [
    {
      inputs: ['[1,5,11,5]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Total sum `= 22`. If odd we could short-circuit `false` immediately; here it is even, target = `11`. Subset-sum DP: can we pick a subset summing to `11`? `dp` is a boolean array of length `12`. Start `dp[0] = true`. After processing `1`: `dp[1]` true. After `5`: `dp[5], dp[6]` true. After `11`: `dp[11]` true → return `true`. Subset `[11]` works. **O(n · sum)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,5]'],
      expected: 'false',
      explanation_md:
        'The "even sum but no valid partition" case. Sum = `11` — odd, short-circuit `false`. Actually wait: `1+2+3+5 = 11`, odd → cannot split into two equal halves of integer sum. Return `false` immediately without running the DP. This is exactly why the odd-sum check is the first thing to do — it cuts the obvious dead branches in **O(n)** without DP overhead.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: 'true',
      explanation_md:
        'The smallest valid input. Sum = `2`, target = `1`. After processing first `1`: `dp[1]` true. Already done → return `true`. The two halves are `[1]` and `[1]`. Proves the DP correctly identifies a single-element subset summing to the target rather than requiring multiple elements.',
      viz_anchor: null,
    },
  ],

  'target-sum': [
    {
      inputs: ['[1,1,1,1,1]', '3'],
      expected: '5',
      explanation_md:
        'The canonical LC example. Assign `+` or `-` to each number to hit the target. Brute force is `2^n`. The DP reformulation: let `P` = positive subset, `N` = negative subset. `sum(P) - sum(N) = target`, `sum(P) + sum(N) = total`. So `sum(P) = (target + total) / 2`. With `total=5, target=3`, `sum(P) = 4`. Count subsets summing to `4` — there are `C(5, 4) = 5` ways (pick which four get `+`). Return `5`. **O(n · sum)** DP.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '1',
      explanation_md:
        'The smallest valid input. One number, target `1`. `+1` works; `-1` does not. Return `1`. The reformulation: `total=1, target=1`, `sum(P) = 1`. Count subsets summing to `1` — only `{1}` itself. The brittle implementation that requires `(target + total) % 2 == 0` is correct — without that check, a non-integer `sum(P)` would silently round and produce wrong answers; here `(1+1)/2 = 1` is fine.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '2'],
      expected: '0',
      explanation_md:
        'The "target unreachable" case. Total = `1`, max possible sum is `+1`, but target is `2`. Cannot reach. The reformulation check `abs(target) > total` returns `0` immediately, no DP needed. Also `(target + total) = 3` is odd → `sum(P)` not an integer → impossible. Either short-circuit works. Return `0`. This input proves the unreachable-target guards are necessary — without them, the DP would index out of range or return garbage.',
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
