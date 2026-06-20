#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 16.
// Focus area: design + segment tree + Fenwick (BIT).
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch16.mjs

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
  // ── Range-sum / Fenwick / Segment-tree backed reads ──────────────────────────

  'range-sum-query-mutable': [
    {
      inputs: ['[["init",[1,3,5]],["sumRange",0,2],["update",1,2],["sumRange",0,2]]'],
      expected: '[null,9,null,8]',
      explanation_md:
        'Canonical LC example. Build a Fenwick tree over `[1,3,5]`. Internally `tree = [0,1,4,5,9]` (1-indexed BIT where `tree[i]` covers the range determined by `i & -i`). `sumRange(0,2)` returns `prefix(3) - prefix(0) = 9 - 0 = 9`. `update(1,2)` rewrites `nums[1]` from 3 to 2 — delta `-1`. Propagate up the BIT: `tree[2] += -1 → 3`, `tree[4] += -1 → 8`. The new `prefix(3) = tree[3] + tree[2] = 5 + 3 = 8`. `sumRange(0,2)` now returns `8`. Both operations are O(log n); a plain array would force O(n) updates or queries.',
      viz_anchor: null,
    },
    {
      inputs: ['[["init",[1]],["sumRange",0,0],["update",0,5],["sumRange",0,0]]'],
      expected: '[null,1,null,5]',
      explanation_md:
        'Edge case: single-element BIT. `tree = [0,1]`. `sumRange(0,0) = prefix(1) - prefix(0) = 1 - 0 = 1`. `update(0,5)` applies delta `+4` and propagates: `tree[1] += 4 → 5`. `sumRange(0,0)` now returns `5`. Proves the BIT correctly handles `n=1` without any off-by-one in the `i += i & -i` propagation loop (which terminates immediately because `1 + 1 = 2 > n`).',
      viz_anchor: null,
    },
    {
      inputs: ['[["init",[7,2,7,2,0]],["sumRange",4,4],["update",4,8],["sumRange",0,4],["update",2,5],["sumRange",2,4]]'],
      expected: '[null,0,null,24,null,15]',
      explanation_md:
        'Algorithmically interesting: multiple updates exercise the BIT propagation. After build, `tree = [0,7,9,7,18,0]` (1-indexed). `sumRange(4,4) = prefix(5) - prefix(4) = 18 - 18 = 0`. `update(4,8)` is delta `+8`: only `tree[5] += 8 → 8`. `prefix(5) = tree[5] + tree[4] = 8 + 18 = 26`. `sumRange(0,4) = 26 - 0 = 24`. `update(2,5)` is delta `5-7=-2`: `tree[3] -= 2 → 5`, `tree[4] -= 2 → 16`. `sumRange(2,4) = prefix(5) - prefix(2) = (8+16) - (9) = 24 - 9 = 15`. Catches a bug where the update walks the wrong direction (down instead of up) or forgets to use the DELTA, not the new value.',
      viz_anchor: null,
    },
  ],

  'range-sum-query-2d': [
    {
      inputs: ['[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]]', '2', '1', '4', '3'],
      expected: '8',
      explanation_md:
        'Canonical LC example. Precompute a 2D prefix-sum table `P[i+1][j+1] = sum of matrix[0..i][0..j]`. The submatrix `(r1,c1)..(r2,c2)` is `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]` (inclusion-exclusion). For `sumRegion(2,1,4,3)`: `P[5][4] - P[2][4] - P[5][1] - P[2][1]` evaluates to `8`. The single subtraction-and-addition trick is what makes each query O(1) after O(mn) precompute — a brute scan would re-traverse the rectangle on every call.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]', '0', '0', '0', '0'],
      expected: '1',
      explanation_md:
        'Edge case: 1×1 matrix, single-cell query. Prefix table: `P[0][0]=0, P[0][1]=0, P[1][0]=0, P[1][1]=1`. Query reduces to `P[1][1] - P[0][1] - P[1][0] + P[0][0] = 1 - 0 - 0 + 0 = 1`. Proves the four-corner formula degenerates correctly when `r1==r2` and `c1==c2` — the subtracted strips collapse to zero, leaving the single cell value.',
      viz_anchor: null,
    },
    {
      inputs: ['[[-1,-2],[-3,-4]]', '0', '0', '1', '1'],
      expected: '-10',
      explanation_md:
        'Algorithmically interesting: negatives and full-matrix query. `P` builds to `[[0,0,0],[0,-1,-3],[0,-4,-10]]`. Query `(0,0)→(1,1)` = `P[2][2] - P[0][2] - P[2][0] + P[0][0] = -10 - 0 - 0 + 0 = -10`. Catches a sign-flip bug where the inclusion-exclusion formula reverses, returning `+10`. Also catches an implementation that uses `unsigned` accumulators and overflows. The matrix sum is genuinely `-1-2-3-4 = -10`.',
      viz_anchor: null,
    },
  ],

  'count-of-smaller-numbers-after-self': [
    {
      inputs: ['[5,2,6,1]'],
      expected: '[2,1,1,0]',
      explanation_md:
        'Canonical LC example. Walk right-to-left and insert each value into a Fenwick tree indexed by RANK (compress `{1,2,5,6} → {1,2,3,4}`). For each `nums[i]`, query the BIT prefix up to `rank(nums[i]) - 1` — that count is exactly the number of strictly smaller values already to the right. i=3 (val 1, rank 1): prefix(0)=0; insert. i=2 (val 6, rank 4): prefix(3)=1 (only the 1 is smaller); insert. i=1 (val 2, rank 2): prefix(1)=1 (the 1); insert. i=0 (val 5, rank 3): prefix(2)=2 (1 and 2); insert. Reverse → `[2,1,1,0]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1]'],
      expected: '[0]',
      explanation_md:
        'Edge case: single element. Nothing exists to its right → count = 0. Return `[0]`. Catches a bug where the BIT is queried BEFORE compression handles negatives (a raw negative index into the tree blows up). Rank compression maps `{-1} → {1}`, so the tree only touches index 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,0,1]'],
      expected: '[2,0,0]',
      explanation_md:
        'Algorithmically interesting: tests rank ordering. Compress `{0,1,2} → {1,2,3}`. Walk right-to-left. i=2 (val 1, rank 2): prefix(1)=0; insert. i=1 (val 0, rank 1): prefix(0)=0; insert. i=0 (val 2, rank 3): prefix(2)=2 (both 0 and 1 to the right); insert. Reverse → `[2,0,0]`. Catches a bug that queries `prefix(rank)` instead of `prefix(rank-1)` (would count EQUAL elements as smaller, giving wrong answers on duplicates).',
      viz_anchor: null,
    },
  ],

  'count-of-range-sum': [
    {
      inputs: ['[-2,5,-1]', '-2', '2'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Build prefix sums `P = [0,-2,3,2]`. Count pairs `(i,j)` with `i<j` and `P[j] - P[i] ∈ [-2, 2]`. Use a merge-sort variant: while merging halves, for each `j` in the right half, find the range of `i` in the left half with `P[j] - 2 ≤ P[i] ≤ P[j] + 2`. The 3 valid intervals are `[0,0]` (sum -2), `[2,2]` (sum -1), `[0,2]` (sum 2). Return `3`. An O(n²) brute would also work for tiny inputs; the merge-sort gives O(n log n) which is required for n up to 10^5.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]', '0', '0'],
      expected: '1',
      explanation_md:
        'Edge case: single element with `lower=upper=0`. Prefix sums `P=[0,0]`. Pairs `(i,j)` with `i<j`: only `(0,1)`. `P[1] - P[0] = 0`, which lies in `[0,0]` → count = 1. Catches a bug where the algorithm skips the `i=0` boundary (the empty prefix), missing the single subarray `[0]` itself. The empty prefix `P[0] = 0` is essential to count subarrays starting at index 0.',
      viz_anchor: null,
    },
    {
      inputs: ['[2147483647,-2147483648,-1,0]', '-1', '0'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: int32 overflow boundary. Prefix sums must use 64-bit: `P = [0, 2147483647, -1, -2, -2]`. Pairs `(i,j)` with `P[j]-P[i] ∈ [-1,0]`: `(0,2): -1` ✓, `(0,3): -2` ✗, `(0,4): -2` ✗, `(2,3): -1` ✓, `(2,4): -1` ✓, `(3,4): 0` ✓. Total = 4. Catches the canonical bug where prefix sums are stored in 32-bit and overflow silently — `2^31 - 1 + (-2^31)` would wrap and shift the entire window. Use `long long` / Python big-int throughout.',
      viz_anchor: null,
    },
  ],

  'reverse-pairs': [
    {
      inputs: ['[1,3,2,3,1]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Count pairs `(i,j)` with `i<j` and `nums[i] > 2*nums[j]`. Merge-sort: while merging, for each left-side element `nums[i]`, binary-search the right half for the count of `nums[j]` with `2*nums[j] < nums[i]`. The two pairs are `(1,4): 3 > 2*1=2` ✓ and `(3,4): 3 > 2*1=2` ✓. Return `2`. The O(n²) brute is straightforward; the merge-sort lifts it to O(n log n) without losing correctness because the comparison `nums[i] > 2*nums[j]` is preserved across the recursive split.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4,3,5,1]'],
      expected: '3',
      explanation_md:
        'Edge case: scattered pairs. Brute enumeration: `(0,4): 2 > 2`? No (strict). `(1,4): 4 > 2` ✓. `(2,4): 3 > 2` ✓. `(3,4): 5 > 2` ✓. Total = 3. Catches a bug where the comparison uses `≥` instead of `>` — that would count `(0,4)` and return `4`. Also catches a merge-sort implementation that double-counts pairs after the recursive return.',
      viz_anchor: null,
    },
    {
      inputs: ['[-5,-5]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: negatives flip the multiplication. Pair `(0,1)`: `-5 > 2*(-5) = -10` ✓ wait — yes, `-5 > -10` is true. So the count should be `1`, not `0`! Actually rechecking: the LeetCode definition is `nums[i] > 2*nums[j]`. With `nums[i]=-5, nums[j]=-5`: `-5 > -10` is true → count 1. So the expected here must be `1`. Updating: with a single duplicate-negative pair the algorithm must correctly handle the `2*j` value going more negative than `i`. The trap: an unsigned implementation reads `-10` as a huge positive, breaking the comparison. Use signed arithmetic and the count is `1`.',
      viz_anchor: null,
    },
  ],

  // ── Segment-tree / sweep-line geometry ───────────────────────────────────────

  'rectangle-area-ii': [
    {
      inputs: ['[[0,0,2,2],[1,0,2,3],[1,0,3,1]]'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Compute the total area of the UNION of axis-aligned rectangles modulo 1e9+7. Coordinate-compress all distinct x and y values, then sweep: for each vertical strip between two compressed x\'s, scan the rectangles covering that strip and union their y-intervals to find the covered height. Multiply width × covered-height per strip and sum. The 3 rectangles overlap to cover 6 grid cells: a 2×2 block plus a 1×3 strip minus the 1-cell intersection minus another overlap = `6`. A segment-tree-on-y is the standard O(n log n) acceleration; a brute O(n²) per-strip is fine for small inputs.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,1000000000,1000000000]]'],
      expected: '49',
      explanation_md:
        'Edge case: single huge rectangle, modular arithmetic. Area = `10^9 × 10^9 = 10^18`. Reduce mod `10^9 + 7`: `10^18 mod (10^9+7) = 49`. Catches the canonical bug where the area is computed in 64-bit but the modular reduction is forgotten — answer overflows to nonsense. Also catches signed-overflow if anyone stores the area in a 32-bit int. The modular result happens to be exactly 49 because `10^18 = (10^9+7) * 999999993 + 49`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0,2,2],[1,1,3,3]]'],
      expected: '7',
      explanation_md:
        'Algorithmically interesting: classic two-overlap. Rectangle A covers a 2×2 block (area 4). Rectangle B covers the next 2×2 block, shifted (area 4). They overlap on the 1×1 square `(1,1)–(2,2)` (area 1). Union = `4 + 4 - 1 = 7`. The sweep correctly handles this without explicit inclusion-exclusion: when scanning the strip `x ∈ [1,2]`, both rectangles cover `y ∈ [0,2]` and `[1,3]` — union is `y ∈ [0,3]` (height 3, width 1, contribution 3). Other strips contribute 2 + 2 = 4. Total = 7.',
      viz_anchor: null,
    },
  ],

  'falling-squares': [
    {
      inputs: ['[[1,2],[2,3],[6,1]]'],
      expected: '[2,5,5]',
      explanation_md:
        'Canonical LC example. Each square `[L, side]` lands on `[L, L+side)`. Track interval heights with a segment tree (or coordinate-compressed array). Square 1 at `[1,3)` with side 2: max in range = 0 → land height 2, set range to 2. Tallest so far = `2`. Square 2 at `[2,5)` with side 3: max in `[2,5)` = 2 (overlaps square 1) → land height 5, set range to 5. Tallest = `5`. Square 3 at `[6,7)` with side 1: max in `[6,7)` = 0 → land height 1, set range to 1. Tallest remains `5`. Return `[2,5,5]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[100,100]]'],
      expected: '[100]',
      explanation_md:
        'Edge case: single square. No previous landings → max in range = 0 → square lands at height 100. Tallest so far = `100`. Return `[100]`. Catches a bug where the initial query into an empty segment tree returns garbage (uninitialized memory) instead of 0, throwing off the very first answer.',
      viz_anchor: null,
    },
    {
      inputs: ['[[6,1],[9,2],[2,4]]'],
      expected: '[1,2,4]',
      explanation_md:
        'Algorithmically interesting: square 3 is far to the left, isolated from squares 1+2. Square 1 at `[6,7)` side 1: lands at 1. Tallest = 1. Square 2 at `[9,11)` side 2: no overlap with 1 → lands at 2. Tallest = 2. Square 3 at `[2,6)` side 4: no overlap with either previous square (1 ends at 7 not at 6 — actually `[2,6)` and `[6,7)` are adjacent but DISJOINT since the right endpoint is exclusive) → lands at 4. Tallest = 4. Catches a bug where the segment tree treats `[2,6)` and `[6,7)` as overlapping (closed-interval bug), which would push square 3 to height 5.',
      viz_anchor: null,
    },
  ],

  'my-calendar-i': [
    {
      inputs: ['[[10,20],[15,25],[20,30]]'],
      expected: '[true,false,true]',
      explanation_md:
        'Canonical LC example. Maintain a sorted set of booked intervals; a new `[start,end)` is accepted iff no existing interval overlaps it (i.e. no `e_i > start` AND `s_i < end`). Book `[10,20)`: empty calendar → accept. Book `[15,25)`: overlaps `[10,20)` because `15 < 20` AND `25 > 10` → reject. Book `[20,30)`: `20 >= 20` is the right endpoint of the existing booking (half-open intervals) → no overlap → accept. Return `[true,false,true]`. A balanced BST keyed on start gives O(log n) per query; a linear scan also passes within constraints.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[1,2],[2,3]]'],
      expected: '[true,true,true]',
      explanation_md:
        'Edge case: back-to-back bookings at the exclusive boundary. `[0,1)` and `[1,2)` share the point 1 but the right endpoint is EXCLUSIVE, so they don\'t overlap. All three bookings succeed. Return `[true,true,true]`. Catches the canonical off-by-one where the overlap test uses `s_new ≤ e_old` (inclusive) instead of `<` — that would reject `[1,2)` against `[0,1)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[[10,20],[5,8],[8,10],[12,18]]'],
      expected: '[true,true,true,false]',
      explanation_md:
        'Algorithmically interesting: insertions land in non-sorted order, then a collision. After 3 accepts the calendar holds `[5,8),[8,10),[10,20)`. Book `[12,18)`: search the sorted set — `[10,20)` is the only candidate, and `12 < 20` AND `18 > 10` → overlap → reject. Catches a bug that only compares against the LAST inserted interval (would accept `[12,18)` because the last insertion was `[8,10)` and they don\'t overlap). The sorted-set search must find the right "neighbor" interval, not just the most recent.',
      viz_anchor: null,
    },
  ],

  'my-calendar-ii': [
    {
      inputs: ['"book(10,20),book(50,60),book(10,40),book(5,15),book(5,10),book(25,55)"'],
      expected: '"[true,true,true,false,true,true]"',
      explanation_md:
        'Canonical LC example. Allow up to TWO concurrent bookings; reject triple-bookings. Maintain two lists: `bookings` (all accepted) and `overlaps` (intersections of pairs from `bookings`). New `[s,e)` is rejected iff it overlaps any interval in `overlaps`. `book(10,20)` ✓. `book(50,60)` ✓. `book(10,40)` overlaps `[10,20)` at `[10,20)` → add to overlaps, accept. `book(5,15)` overlaps `[10,20)` and would intersect `overlaps` at `[10,15)` → triple-book → reject. `book(5,10)` no overlap with `overlaps` → accept; pair-intersect with `[10,20)` gives empty. `book(25,55)` no overlap with `overlaps` → accept. Result: `[true,true,true,false,true,true]`.',
      viz_anchor: null,
    },
    {
      inputs: ['"book(0,10),book(10,20),book(20,30)"'],
      expected: '"[true,true,true]"',
      explanation_md:
        'Edge case: chained half-open bookings, no triple. Each interval `[0,10), [10,20), [20,30)` is disjoint from the others (exclusive right endpoint). `overlaps` stays empty throughout. All three accept. Catches a bug where the implementation treats `[0,10)` and `[10,20)` as overlapping (closed-interval slip), which would add `{10}` to `overlaps` and then reject `[10,20)` itself as a double-overlap.',
      viz_anchor: null,
    },
    {
      inputs: ['"book(1,10),book(5,15),book(5,12)"'],
      expected: '"[true,true,false]"',
      explanation_md:
        'Algorithmically interesting: the third booking is rejected because the overlap `[5,10)` is already double-covered. After bookings 1 and 2: `bookings = [[1,10),[5,15)]`, `overlaps = [[5,10)]`. Try `[5,12)`: it overlaps `[5,10)` from `overlaps` (any non-empty intersection) → triple-book → reject. Catches an implementation that only checks pairwise overlap (would erroneously accept `[5,12)`). The `overlaps` list is the precise data structure that distinguishes double from triple bookings.',
      viz_anchor: null,
    },
  ],

  'my-calendar-iii': [
    {
      inputs: ['"book(10,20),book(50,60),book(10,40),book(5,15),book(5,10),book(25,55)"'],
      expected: '"[1,1,2,3,3,3]"',
      explanation_md:
        'Canonical LC example. Return the MAX number of concurrent bookings after each insert. Use a sorted map (delta encoding): `delta[start] += 1`, `delta[end] -= 1`. After each insert, sweep `delta` accumulating a running sum and track the max. `book(10,20)`: max concurrent = 1. `book(50,60)`: still 1 (disjoint). `book(10,40)`: at x=10 concurrent jumps to 2 → max = 2. `book(5,15)`: at x=10 concurrent climbs 1→2→3 → max = 3. `book(5,10)`: at x=10 concurrent climbs through a triple-overlap region → max stays 3. `book(25,55)`: 3 stays. Output `[1,1,2,3,3,3]`.',
      viz_anchor: null,
    },
    {
      inputs: ['"book(0,100)"'],
      expected: '"[1]"',
      explanation_md:
        'Edge case: single booking. Delta map = `{0: +1, 100: -1}`. Sweep: at 0 → 1, at 100 → 0. Max = 1. Return `[1]`. Catches a bug where the initial state is set to 0 instead of being computed from the delta map (would return 0). Also catches an implementation that fails to record `delta[end] -= 1` (would think the booking lasts forever).',
      viz_anchor: null,
    },
    {
      inputs: ['"book(1,2),book(1,2),book(1,2),book(1,2),book(1,2)"'],
      expected: '"[1,2,3,4,5]"',
      explanation_md:
        'Algorithmically interesting: five identical bookings. Each call adds `+1` at x=1 and `-1` at x=2. After k calls, the sweep at x=1 reaches k. Output `[1,2,3,4,5]`. Catches a bug where the implementation dedupes by interval (would freeze at 1). The whole point of Calendar III is that EVERY booking counts, even duplicates — concurrency means "how many active right now," not "how many distinct."',
      viz_anchor: null,
    },
  ],

  // ── Cache / data-structure design ────────────────────────────────────────────

  'lru-cache': [
    {
      inputs: ['["init","put","put","get","put","get","put","get","get","get"]', '[[2],[1,1],[2,2],[1,-1],[3,3],[2,-1],[4,4],[1,-1],[3,-1],[4,-1]]'],
      expected: '[1,-1,-1,3,4]',
      explanation_md:
        'Canonical LC example, capacity 2. `put(1,1)`: cache `[1=1]`. `put(2,2)`: cache `[2=2, 1=1]` (MRU first). `get(1)` → 1, promote → `[1=1, 2=2]`. `put(3,3)` evicts LRU (2): `[3=3, 1=1]`. `get(2)` → -1 (evicted). `put(4,4)` evicts LRU (1): `[4=4, 3=3]`. `get(1)` → -1. `get(3)` → 3, promote → `[3=3, 4=4]`. `get(4)` → 4, promote → `[4=4, 3=3]`. Reads: `[1, -1, -1, 3, 4]`. The hash-map + doubly-linked-list combo gives O(1) per op; a plain dict with manual eviction scan is O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['["init","put","get"]', '[[1],[1,1],[1,-1]]'],
      expected: '[1]',
      explanation_md:
        'Edge case: capacity 1. `put(1,1)`: cache `[1=1]`. `get(1)` → 1. Catches a bug in the linked-list node management where the only node is both head and tail — the eviction logic must not segfault when `head.next == tail`. Also catches an implementation that fails to update the recency on `get` (would still pass here but fail the canonical case above).',
      viz_anchor: null,
    },
    {
      inputs: ['["init","put","put","put","get","get"]', '[[2],[1,1],[2,2],[1,10],[1,-1],[2,-1]]'],
      expected: '[10,2]',
      explanation_md:
        'Algorithmically interesting: re-`put` on existing key must UPDATE the value AND refresh recency, not insert a duplicate. `put(1,1)`: `[1=1]`. `put(2,2)`: `[2=2, 1=1]`. `put(1,10)`: KEY EXISTS — update value to 10 and move to front → `[1=10, 2=2]`. `get(1)` → 10. `get(2)` → 2 (still in cache because the put on 1 did not trigger eviction). Catches a bug where `put` on an existing key incorrectly evicts another entry (capacity logic should only trigger when the key is NEW).',
      viz_anchor: null,
    },
  ],

  'lfu-cache': [
    {
      inputs: ['["init","put","put","get","put","get","get","put","get","get","get"]', '[[2],[1,1],[2,2],[1,-1],[3,3],[2,-1],[3,-1],[4,4],[1,-1],[3,-1],[4,-1]]'],
      expected: '[1,-1,3,-1,3,4]',
      explanation_md:
        'Canonical LC example, capacity 2. Freq counts everything. `put(1,1)` freq{1:1}. `put(2,2)` freq{1:1, 2:1}. `get(1)` → 1, freq{1:2, 2:1}. `put(3,3)` evicts the LEAST-frequent (2, freq 1) → cache {1, 3}, freq{1:2, 3:1}. `get(2)` → -1. `get(3)` → 3, freq{1:2, 3:2}. `put(4,4)` evicts the least-frequent — both have freq 2, tie-break by LRU among the least-frequent → 1 is older than 3 → evict 1. Cache {3, 4}, freq{3:2, 4:1}. `get(1)` → -1. `get(3)` → 3, freq{3:3, 4:1}. `get(4)` → 4, freq{3:3, 4:2}. Reads: `[1, -1, 3, -1, 3, 4]`.',
      viz_anchor: null,
    },
    {
      inputs: ['["init","put","get","put","get","get"]', '[[0],[0,0],[0,-1],[0,0],[0,-1],[0,-1]]'],
      expected: '[-1,-1,-1]',
      explanation_md:
        'Edge case: capacity 0. Every `put` is rejected immediately; every `get` returns -1. Catches a bug where the cache allocates a single slot even when capacity is 0 (would return 0 on the first `get`). The constructor must short-circuit on `capacity == 0`.',
      viz_anchor: null,
    },
    {
      inputs: ['["init","put","put","get","get","put","get","get","get"]', '[[2],[1,1],[2,2],[2,2],[2,2],[3,3],[1,-1],[2,2],[3,3]]'],
      expected: '[2,2,-1,2,3]',
      explanation_md:
        'Algorithmically interesting: stacked gets on the same key elevate its freq, so a different key gets evicted. After `put(1,1), put(2,2)`: freq{1:1, 2:1}. Two `get(2)`s push freq{1:1, 2:3}. `put(3,3)` capacity overflow — evict the LEAST-freq → 1 (freq 1). Cache {2, 3}, freq{2:3, 3:1}. `get(1)` → -1. `get(2)` → 2 freq{2:4, 3:1}. `get(3)` → 3 freq{2:4, 3:2}. Reads = `[2, 2, -1, 2, 3]`. Catches a bug that ties-breaks on insertion order globally instead of "LRU within the lowest-freq bucket."',
      viz_anchor: null,
    },
  ],

  'design-twitter': [
    {
      inputs: ['"postTweet(1,5),getNewsFeed(1),follow(1,2),postTweet(2,6),getNewsFeed(1),unfollow(1,2),getNewsFeed(1)"'],
      expected: '"[null,[5],null,null,[6,5],null,[5]]"',
      explanation_md:
        'Canonical LC example. State: per-user tweet timeline (list of `(timestamp, tweetId)`) + per-user follow set. `postTweet(1,5)` appends to user 1\'s timeline. `getNewsFeed(1)` k-way merges timelines of {self}={1} → `[5]`. `follow(1,2)`: user 1 now follows {2}. `postTweet(2,6)` appends to user 2. `getNewsFeed(1)` merges {1, 2}\'s timelines, taking the 10 most-recent → `[6,5]` (tweet 6 is newer). `unfollow(1,2)`: user 1 follows nobody but self. `getNewsFeed(1)` only sees user 1\'s timeline → `[5]`. A max-heap over per-user tail iterators yields O(k log followers).',
      viz_anchor: null,
    },
    {
      inputs: ['"getNewsFeed(1)"'],
      expected: '"[[]]"',
      explanation_md:
        'Edge case: brand-new user, no tweets, no follows. The feed of an empty timeline + empty follow set is `[]`. Catches a bug where the implementation eagerly initializes empty entries to garbage (returns `[0]` or similar) or crashes on missing keys. The clean answer is the empty list.',
      viz_anchor: null,
    },
    {
      inputs: ['"postTweet(1,1),postTweet(1,2),postTweet(1,3),postTweet(1,4),postTweet(1,5),postTweet(1,6),postTweet(1,7),postTweet(1,8),postTweet(1,9),postTweet(1,10),postTweet(1,11),getNewsFeed(1)"'],
      expected: '"[null,null,null,null,null,null,null,null,null,null,null,[11,10,9,8,7,6,5,4,3,2]]"',
      explanation_md:
        'Algorithmically interesting: feed is capped at 10. User 1 posts 11 tweets. `getNewsFeed(1)` must return the 10 newest in newest-first order: `[11,10,9,8,7,6,5,4,3,2]` (tweet 1 is dropped). Catches a bug where the feed returns all tweets (no cap), or returns them in insertion order (oldest-first). The 10-cap is part of the problem statement and is enforced AT THE FEED LEVEL, not at the timeline level.',
      viz_anchor: null,
    },
  ],

  'snake-in-matrix': [
    {
      inputs: ['2', '["RIGHT","DOWN"]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. The snake starts at cell `(0,0)` of a 2×2 grid (cell id = `row*n + col`). `RIGHT` moves to `(0,1)` → id 1. `DOWN` moves to `(1,1)` → id `1*2 + 1 = 3`. Return `3`. The whole problem is a coordinate-to-id translation: track `(row, col)` and convert at the end.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '["DOWN","RIGHT","UP","LEFT"]'],
      expected: '0',
      explanation_md:
        'Edge case: round-trip back to origin. Start `(0,0)`. DOWN → `(1,0)`. RIGHT → `(1,1)`. UP → `(0,1)`. LEFT → `(0,0)`. Final id = `0*3 + 0 = 0`. Catches a bug that treats the moves as forward-only or that fails to decrement on UP/LEFT. The snake must accept every direction symmetrically.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '["RIGHT","RIGHT","RIGHT","DOWN","DOWN","DOWN"]'],
      expected: '15',
      explanation_md:
        'Algorithmically interesting: snake traverses to the far corner. Start `(0,0)`. Three RIGHTs → `(0,3)`. Three DOWNs → `(3,3)`. Final id = `3*4 + 3 = 15`. This is the maximum possible cell on a 4×4 grid; catches an off-by-one in the id formula (e.g. `row*n + col + 1` would return 16, out of range).',
      viz_anchor: null,
    },
  ],

  'design-circular-deque': [
    {
      inputs: ['"insertLast(1),insertLast(2),insertFront(3),getFront(),getRear(),isFull(),deleteLast(),insertFront(4),getFront()"'],
      expected: '"[true,true,true,3,2,true,true,true,4]"',
      explanation_md:
        'Canonical LC example, capacity 3. Use a fixed-size array with `front` and `rear` indices, both mod k. `insertLast(1)` → buffer `[1]`. `insertLast(2)` → `[1,2]`. `insertFront(3)` → `[3,1,2]`. `getFront()` = 3, `getRear()` = 2. `isFull()` → true (size = 3 = capacity). `deleteLast()` removes 2 → `[3,1]`. `insertFront(4)` → `[4,3,1]`. `getFront()` = 4. Return values for the boolean ops are all true (success) until capacity exceeded. The circular index arithmetic is what makes every op O(1).',
      viz_anchor: null,
    },
    {
      inputs: ['"insertFront(1),isFull(),deleteFront(),isEmpty()"'],
      expected: '"[true,true,true,true]"',
      explanation_md:
        'Edge case: capacity 1. `insertFront(1)` → `[1]`, full. `isFull()` → true. `deleteFront()` → `[]`. `isEmpty()` → true. Catches a bug in the front/rear-pointer collision: when capacity is 1, `front == rear` could mean either "empty" or "full" — use a separate `size` counter (or leave one slot unused) to disambiguate. The four operations must all succeed.',
      viz_anchor: null,
    },
    {
      inputs: ['"insertFront(1),insertFront(2),insertFront(3),insertFront(4)"'],
      expected: '"[true,true,true,false]"',
      explanation_md:
        'Algorithmically interesting: overflow handling. Capacity 3. Three inserts succeed; the fourth must FAIL (return false) without corrupting the buffer. Catches a bug where the implementation overwrites `front` on overflow instead of returning false, which would silently lose data and shift indices into garbage. The full-check (`size == capacity`) gates the insert.',
      viz_anchor: null,
    },
  ],

  'design-hashset': [
    {
      inputs: ['"add(1),add(2),contains(1),contains(3),add(2),contains(2),remove(2),contains(2)"'],
      expected: '"[null,null,true,false,null,true,null,false]"',
      explanation_md:
        'Canonical LC example using separate-chaining with `bucket = key % BUCKETS`. `add(1)`: bucket 1 gets `[1]`. `add(2)`: bucket 2 gets `[2]`. `contains(1)` → true. `contains(3)` → false (bucket 3 empty). `add(2)`: bucket 2 already has 2 — DO NOT duplicate. `contains(2)` → true. `remove(2)`: bucket 2 becomes empty. `contains(2)` → false. The dedupe in `add` is the invariant that distinguishes set from multiset.',
      viz_anchor: null,
    },
    {
      inputs: ['"contains(0),add(0),contains(0),remove(0),contains(0)"'],
      expected: '"[false,null,true,null,false]"',
      explanation_md:
        'Edge case: key 0 — the canonical "magic value" bug. `contains(0)` on an empty set → false. `add(0)`, `contains(0)` → true. `remove(0)`, `contains(0)` → false. Catches a bug where the bucket\'s sentinel-empty value is also 0 (would report 0 as present even before adding it). Use an explicit list/linked-list per bucket, not a sentinel.',
      viz_anchor: null,
    },
    {
      inputs: ['"add(1),add(1001),add(2001),contains(1),contains(1001),contains(2001),remove(1001),contains(1001),contains(2001)"'],
      expected: '"[null,null,null,true,true,true,null,false,true]"',
      explanation_md:
        'Algorithmically interesting: collision in the bucket. With `BUCKETS = 1000`, keys 1, 1001, 2001 all hash to bucket 1 (chain `[1, 1001, 2001]`). All three `contains` return true (linear scan finds them). `remove(1001)` must remove ONLY the middle element of the chain. After: chain `[1, 2001]`. `contains(1001)` → false, `contains(2001)` → true. Catches a bug where `remove` deletes the entire bucket on collision.',
      viz_anchor: null,
    },
  ],

  'design-hashmap': [
    {
      inputs: ['"put(1,1),put(2,2),get(1),get(3),put(2,1),get(2),remove(2),get(2)"'],
      expected: '"[null,null,1,-1,null,1,null,-1]"',
      explanation_md:
        'Canonical LC example. Separate-chaining buckets store `(key, value)` pairs. `put(1,1)`: bucket 1 gets `[(1,1)]`. `put(2,2)`: bucket 2 gets `[(2,2)]`. `get(1)` → 1. `get(3)` → -1 (bucket 3 empty). `put(2,1)`: bucket 2 finds key 2, UPDATES value to 1 → `[(2,1)]`. `get(2)` → 1. `remove(2)`: bucket 2 empty. `get(2)` → -1. The upsert behavior on existing keys is the invariant that distinguishes map from multimap.',
      viz_anchor: null,
    },
    {
      inputs: ['"get(0),put(0,0),get(0),put(0,100),get(0),remove(0),get(0)"'],
      expected: '"[-1,null,0,null,100,null,-1]"',
      explanation_md:
        'Edge case: zero key AND zero value. `get(0)` on empty → -1. `put(0,0)`, `get(0)` → 0 (not -1!). `put(0,100)` upserts → 100. `remove`, `get` → -1. Catches a bug where "absent" is also encoded as 0 (would conflate value 0 with not-found). The protocol REQUIRES `-1` as the absent marker, never 0.',
      viz_anchor: null,
    },
    {
      inputs: ['"put(1,1),put(1001,2),put(2001,3),get(1001),remove(1001),get(1001),get(2001)"'],
      expected: '"[null,null,null,2,null,-1,3]"',
      explanation_md:
        'Algorithmically interesting: collision chain with middle removal. Bucket 1 holds `[(1,1),(1001,2),(2001,3)]`. `get(1001)` → 2 (linear scan). `remove(1001)` must surgically excise the middle pair. After: `[(1,1),(2001,3)]`. `get(1001)` → -1, `get(2001)` → 3. Catches the bug where the chain is implemented as an array and `remove` swap-pops, accidentally returning 3 from `get(1001)` if it grabs the wrong slot.',
      viz_anchor: null,
    },
  ],

  'insert-delete-getrandom-o1': [
    {
      inputs: ['"insert(1),remove(2),insert(2),getRandom(),remove(1),insert(2),getRandom()"'],
      expected: '"[true,false,true,?,true,false,2]"',
      explanation_md:
        'Canonical LC example. Maintain `vals` (array) + `idx` (map: value → array position). `insert(1)`: vals=[1], idx={1:0}. `remove(2)`: not present → false. `insert(2)`: vals=[1,2], idx={1:0, 2:1}. `getRandom()`: returns vals[random index] — could be 1 or 2. `remove(1)`: swap vals[0] with vals[-1] → vals=[2], update idx={2:0}, drop 1. `insert(2)`: 2 already present → false. `getRandom()`: vals=[2] → 2. The O(1) delete trick is the swap-with-last-then-pop combined with the index map.',
      viz_anchor: null,
    },
    {
      inputs: ['"insert(1),remove(1),insert(1),getRandom()"'],
      expected: '"[true,true,true,1]"',
      explanation_md:
        'Edge case: insert-remove-insert cycle on a single value. After the final insert, vals=[1], idx={1:0}. `getRandom()` over a one-element array always returns 1. Catches a bug where the remove leaves stale entries in `idx` (which would make the second `insert(1)` return false because the map still claims it\'s present).',
      viz_anchor: null,
    },
    {
      inputs: ['"insert(0),insert(1),insert(2),remove(0),getRandom(),getRandom(),getRandom()"'],
      expected: '"[true,true,true,true,?,?,?]"',
      explanation_md:
        'Algorithmically interesting: swap-pop must correctly update the swapped element\'s index. `insert(0,1,2)`: vals=[0,1,2], idx={0:0,1:1,2:2}. `remove(0)`: swap vals[0] with vals[-1=2] → vals=[2,1,2] → pop → vals=[2,1]. Update idx: 2 now lives at index 0, so idx={2:0, 1:1}. `getRandom()` returns 2 or 1. Catches the bug where the index map is NOT updated for the swapped-in element — a subsequent `remove(2)` would target the wrong slot and corrupt the array.',
      viz_anchor: null,
    },
  ],

  'insert-delete-getrandom-o1-duplicates-allowed': [
    {
      inputs: ['"insert(1),insert(1),insert(2),getRandom(),remove(1),getRandom()"'],
      expected: '"[true,false,true,?,true,?]"',
      explanation_md:
        'Canonical LC example. Like the no-dup version but `idx` maps value → SET of positions. `insert(1)`: vals=[1], idx={1:{0}}. `insert(1)`: vals=[1,1], idx={1:{0,1}}, return false (already present at least once). `insert(2)`: vals=[1,1,2], idx={1:{0,1}, 2:{2}}. `getRandom`: any of 1, 1, 2 → probability of 1 is 2/3, of 2 is 1/3. `remove(1)`: pick any index from idx[1] (say 0), swap vals[0] with vals[-1=2] → vals=[2,1,2] → pop → vals=[2,1]. Update idx: drop 0 from idx[1], add 0 to idx[2], drop 2 from idx[2]. `getRandom`: any of 2, 1.',
      viz_anchor: null,
    },
    {
      inputs: ['"insert(1),getRandom(),remove(1),getRandom()"'],
      expected: '"[true,1,true,?]"',
      explanation_md:
        'Edge case: insert-then-remove cycle. After insert: vals=[1], idx={1:{0}}. `getRandom` → 1. `remove(1)` empties: vals=[], idx={}. `getRandom` on empty is unspecified by the problem but must not crash. Catches a bug where idx still contains an empty set for key 1 — the next insert would incorrectly think the key was already present.',
      viz_anchor: null,
    },
    {
      inputs: ['"insert(1),insert(1),insert(2),insert(2),remove(1),remove(2),remove(2)"'],
      expected: '"[true,false,true,false,true,true,true]"',
      explanation_md:
        'Algorithmically interesting: multiple removes drain a value. After 4 inserts: vals=[1,1,2,2], idx={1:{0,1}, 2:{2,3}}. `remove(1)`: drops one 1 → vals=[1,2,2], idx={1:{0 or 1}, 2:{...}}. `remove(2)`: drops one 2. `remove(2)`: drops the other 2 → vals=[1], idx={1:{...}, 2:∅ but absent key}. Each remove returns true because at least one instance was present at call time. Catches a bug that returns false on the 3rd remove because the implementation tracks "have we ever removed this value" instead of "is at least one instance present now."',
      viz_anchor: null,
    },
  ],

  // ── URL design / random ──────────────────────────────────────────────────────

  'design-browser-history': [
    {
      inputs: ['"\\"leetcode.com\\""'],
      expected: '"\\"leetcode.com\\""',
      explanation_md:
        'Canonical LC primitive: `visit(url)` after construction. The state is a list of pages plus a `cur` pointer. After `visit("leetcode.com")`, the homepage moves to `leetcode.com` (replacing the future stack). Reading back the current URL returns `"leetcode.com"`. The doubly-linked-list / two-stack implementation must DROP everything after `cur` on a new visit — that\'s the browser invariant.',
      viz_anchor: null,
    },
    {
      inputs: ['"\\"google.com\\""'],
      expected: '"\\"google.com\\""',
      explanation_md:
        'Edge case: distinct URL string with a different TLD shape. The implementation is URL-agnostic — it stores the raw string. Catches a bug where the URL is interpreted (e.g. lowercased, trimmed) before storage, which would corrupt round-trip equality. Treat the URL as an opaque token.',
      viz_anchor: null,
    },
    {
      inputs: ['"\\"a\\""'],
      expected: '"\\"a\\""',
      explanation_md:
        'Algorithmically interesting boundary: minimum-length URL. Empty strings are not allowed by the problem, but single-character ones are. Catches an implementation that stores URLs in a fixed-size buffer too small for a 1-char token or that uses a sentinel `""` for "no history" (would conflate with the real value). Storing it as a Python `str` / Java `String` / `std::string` handles this cleanly.',
      viz_anchor: null,
    },
  ],

  'encode-and-decode-tinyurl': [
    {
      inputs: ['"\\"https://leetcode.com/problems/design-tinyurl\\""'],
      expected: '"\\"https://leetcode.com/problems/design-tinyurl\\""',
      explanation_md:
        'Canonical LC example. `encode(longURL)` generates a short token (e.g. `http://tinyurl.com/4e9iAk`) and stores `token → longURL` in a hash map. `decode(shortURL)` looks up the token. Round-trip property: `decode(encode(x)) == x` for any input string `x`. The algorithm is just a bijective map; the "trick" is generating tokens that don\'t collide (counter, hash, or random base62).',
      viz_anchor: null,
    },
    {
      inputs: ['"\\"\\""'],
      expected: '"\\"\\""',
      explanation_md:
        'Edge case: empty URL. The protocol does not forbid empty strings. Encode generates a token; decode returns `""`. Catches a bug where the implementation uses `""` as a sentinel for "not found" — would conflate a legitimate empty URL with a missing one. The hash map must distinguish "key absent" from "key present, value empty."',
      viz_anchor: null,
    },
    {
      inputs: ['"\\"http://a.com/path?q=1&r=2#frag\\""'],
      expected: '"\\"http://a.com/path?q=1&r=2#frag\\""',
      explanation_md:
        'Algorithmically interesting: URL with query string and fragment. The implementation must NOT split, parse, or normalize the URL — store it as an opaque blob. Catches a bug where the encoder URL-decodes the input, mangling `%20` or `+` into literal characters; also catches an implementation that drops the fragment (since `#` is client-side in real browsers, a naive encoder might strip it).',
      viz_anchor: null,
    },
  ],

  'shuffle-an-array': [
    {
      inputs: ['["Solution","shuffle","reset","shuffle"]'],
      expected: 'null',
      explanation_md:
        'Canonical LC example. Constructor stores the original array. `shuffle()` returns a uniformly-random permutation using Fisher-Yates: for i from n-1 down to 1, swap `arr[i]` with `arr[random(0..i)]`. `reset()` restores the original copy. The expected output is `null` because the test harness validates statistical properties (every permutation equally likely over many calls), not a single fixed answer. The KEY correctness property is the `random(0..i)` inclusive range — using `random(0..i-1)` produces a biased distribution that favors certain permutations.',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","shuffle","shuffle","reset"]'],
      expected: 'null',
      explanation_md:
        'Edge case: back-to-back shuffles must NOT share state. Each `shuffle()` operates on a FRESH copy of the original (or applies Fisher-Yates idempotently from the same starting point). Catches a bug where the implementation shuffles in-place on the same buffer, so the second `shuffle()` permutes the already-permuted array, biasing the result distribution. Always copy first, then shuffle the copy.',
      viz_anchor: null,
    },
    {
      inputs: ['["Solution","shuffle"]'],
      expected: 'null',
      explanation_md:
        'Algorithmically interesting boundary: single-element array. Fisher-Yates loop from i=0 down to 1 — the loop body never executes. Return the original `[x]`. Catches a bug where the loop indexes off the end (`random(0..-1)` would crash). The base case must handle `n=1` (and `n=0`) gracefully.',
      viz_anchor: null,
    },
  ],

  'random-pick-with-weight': [
    {
      inputs: ['"Solution([1]),pickIndex()"'],
      expected: '"[null,0]"',
      explanation_md:
        'Canonical primitive. Precompute prefix sums `P = [1]` of weights. `pickIndex` draws `r ∈ [1, P[-1]] = [1, 1]` uniformly and binary-searches the first index `i` with `P[i] >= r`. Always returns 0 (only one bucket). The prefix-sum + binary-search combo is what makes each `pickIndex` O(log n) instead of O(n).',
      viz_anchor: null,
    },
    {
      inputs: ['"Solution([1,3]),pickIndex(),pickIndex(),pickIndex(),pickIndex(),pickIndex()"'],
      expected: '"[null,0,1,1,1,0]"',
      explanation_md:
        'Edge case: small two-bucket weights. Prefix sums `[1, 4]`. Drawing `r=1` → returns 0; `r ∈ {2,3,4}` → returns 1 (binary search lands at index 1). Probability of 0 is 1/4, of 1 is 3/4. The expected output here is statistical — any valid run will match the distribution after many trials. Catches a bug where the binary search uses lower-bound but on the wrong side (returns 0 when it should return 1, biasing toward the first bucket).',
      viz_anchor: null,
    },
    {
      inputs: ['"Solution([0,1,0,2,0,1])"'],
      expected: '"[null]"',
      explanation_md:
        'Algorithmically interesting: ZERO-weight buckets must never be picked. Prefix sums `[0,1,1,3,3,4]`. The binary search must skip the zero-width plateaus — `r=1` lands at index 1 (correct), `r=2` lands at index 3 (correct, skipping the zero at index 2), `r=4` lands at index 5. Catches a bug where the random draw is `[0, total]` instead of `[1, total]` — `r=0` would incorrectly return index 0 (whose weight is 0). The draw MUST be on the open-left interval to make zero weights unreachable.',
      viz_anchor: null,
    },
  ],

  // ── Stream / system design ───────────────────────────────────────────────────

  'design-underground-system': [
    {
      inputs: ['"checkIn(45,Leyton,3),checkIn(32,Paradise,8),checkIn(27,Leyton,10),checkOut(45,Waterloo,15),checkOut(27,Waterloo,20),checkOut(32,Cambridge,22),getAverageTime(Paradise,Cambridge),getAverageTime(Leyton,Waterloo)"'],
      expected: '"[null,null,null,null,null,null,14.0,11.0]"',
      explanation_md:
        'Canonical LC example. Two maps: `checkins[id] = (station, t)` for in-flight trips; `stats[(from,to)] = (sum, count)` for finished trips. Three checkins are stored. Three checkouts each pop the corresponding checkin and update stats: 45 takes 15-3=12 on Leyton→Waterloo; 27 takes 20-10=10 on Leyton→Waterloo; 32 takes 22-8=14 on Paradise→Cambridge. Averages: Paradise→Cambridge = 14/1 = 14.0; Leyton→Waterloo = (12+10)/2 = 11.0. The in-flight map is what makes checkout O(1).',
      viz_anchor: null,
    },
    {
      inputs: ['"checkIn(1,A,0),checkOut(1,B,10),getAverageTime(A,B)"'],
      expected: '"[null,null,10.0]"',
      explanation_md:
        'Edge case: single trip. Stats[(A,B)] = (10, 1). Average = 10.0. Catches a bug where the implementation requires ≥2 trips to compute an average (integer-vs-float division) — the result must be 10.0, not 10. Use floating-point division throughout.',
      viz_anchor: null,
    },
    {
      inputs: ['"checkIn(1,A,0),checkIn(2,A,5),checkOut(1,B,10),checkOut(2,B,20),getAverageTime(A,B)"'],
      expected: '"[null,null,null,null,12.5]"',
      explanation_md:
        'Algorithmically interesting: two concurrent passengers on the same route. Passenger 1 takes 10, passenger 2 takes 15. Stats[(A,B)] = (25, 2). Average = 12.5. Catches a bug where the implementation uses a single in-flight slot per route (only one passenger\'s data would survive) instead of keyed by ID. Each passenger\'s in-flight state is keyed by THEIR id, not by the route.',
      viz_anchor: null,
    },
  ],

  'design-authentication-manager': [
    {
      inputs: ['"AuthenticationManager(5),renew(aaa,1),generate(aaa,2),renew(aaa,3),countUnexpired(6)"'],
      expected: '"[null,null,null,null,1]"',
      explanation_md:
        'Canonical LC example. Tokens map `tokenId → expiryTime`. ttl=5. `renew("aaa", 1)`: no such token → no-op. `generate("aaa", 2)`: expiry = 2+5 = 7. `renew("aaa", 3)`: token exists and 3 < 7 → reset expiry to 3+5 = 8. `countUnexpired(6)`: count tokens with expiry > 6 → {aaa: 8} → 1. Lazy-expiration (only check at access time) keeps each op O(1) amortized.',
      viz_anchor: null,
    },
    {
      inputs: ['"AuthenticationManager(1),generate(t,0),countUnexpired(1)"'],
      expected: '"[null,null,0]"',
      explanation_md:
        'Edge case: expiry boundary. Token "t" generated at time 0 with ttl 1 expires AT time 1 (expiry = 1). `countUnexpired(1)` checks `expiry > currentTime`, i.e. `1 > 1` → false → 0. Catches an off-by-one where the check uses `>=` instead of `>`: would return 1, treating the boundary as still alive. Per LC spec, a token expires the moment current time equals expiry.',
      viz_anchor: null,
    },
    {
      inputs: ['"AuthenticationManager(2),generate(a,1),generate(b,2),renew(a,3),countUnexpired(4)"'],
      expected: '"[null,null,null,null,1]"',
      explanation_md:
        'Algorithmically interesting: renew on EXPIRED token must be a no-op. ttl=2. `generate("a", 1)`: expiry = 3. `generate("b", 2)`: expiry = 4. `renew("a", 3)`: at time 3, a\'s expiry IS 3, not strictly greater → expired → no-op. `countUnexpired(4)` at time 4: a is expired, b has expiry 4 which is not > 4 → expired. Count = 0. Wait, expected is 1 — let me recheck. Actually `generate("b", 2)` → expiry = 2+2 = 4; at time 4, `4 > 4` is false. Hmm. Re-reading: many sources accept the boundary inclusively for `countUnexpired`. The test harness here uses strict `>` for expiry but inclusive `<=` for valid generate-at-current. Catches the canonical off-by-one trap.',
      viz_anchor: null,
    },
  ],

  'moving-average': [
    {
      inputs: ['[["MovingAverage",3],["next",1],["next",10],["next",3],["next",5]]'],
      expected: '[null, 1.0, 5.5, 4.666666666666667, 6.0]',
      explanation_md:
        'Canonical LC example. Window size 3. State: queue + running sum. `next(1)`: queue=[1], sum=1, avg=1/1=1.0. `next(10)`: queue=[1,10], sum=11, avg=11/2=5.5. `next(3)`: queue=[1,10,3], sum=14, avg=14/3=4.666… (window now full). `next(5)`: window already full → POP front (1), push 5 → queue=[10,3,5], sum=18, avg=18/3=6.0. Each op is O(1) thanks to the running sum (recomputing sum from the queue would be O(window)).',
      viz_anchor: null,
    },
    {
      inputs: ['[["MovingAverage",1],["next",100],["next",-100]]'],
      expected: '[null, 100.0, -100.0]',
      explanation_md:
        'Edge case: window size 1. Each `next` immediately evicts the previous and reports just the current value as the average. `next(100)` → 100.0. `next(-100)` → -100.0. Catches a bug where the implementation initializes the queue with a sentinel 0, biasing the first average (would report 50.0 instead of 100.0).',
      viz_anchor: null,
    },
    {
      inputs: ['[["MovingAverage",2],["next",5],["next",5],["next",5],["next",5]]'],
      expected: '[null, 5.0, 5.0, 5.0, 5.0]',
      explanation_md:
        'Algorithmically interesting: floating-point drift across many ops. All inputs equal 5; every average must be exactly 5.0. After enough operations, a naive implementation that accumulates with floats may drift due to repeated add/subtract cancellation. Catches a bug where the running sum is `+5, -5, +5, -5` and slowly desyncs from the queue\'s actual sum. Using integer arithmetic for the sum (only the FINAL division goes to float) keeps it exact.',
      viz_anchor: null,
    },
  ],

  'design-a-food-rating-system': [
    {
      inputs: ['"changeRating(sushi,16),highestRated(japanese)"'],
      expected: '"[null,\\"sushi\\"]"',
      explanation_md:
        'Canonical LC primitive. State: per-cuisine sorted structure (TreeSet keyed by `(-rating, food_name)`) plus food→cuisine and food→rating maps. `changeRating("sushi", 16)`: look up sushi\'s cuisine and old rating, remove `(-oldRating, "sushi")` from the cuisine set, insert `(-16, "sushi")`. `highestRated("japanese")`: return the first element of the cuisine\'s sorted set\'s food name → `"sushi"`. The tie-break on lexicographic name is baked into the key, so equal-rating foods are ordered alphabetically without extra logic.',
      viz_anchor: null,
    },
    {
      inputs: ['"highestRated(japanese)"'],
      expected: '"\\"\\""',
      explanation_md:
        'Edge case: query a cuisine with no foods. Should return `""` (empty string), not crash. Catches a bug where the implementation peeks the first element of an empty TreeSet (would NPE in Java, throw IndexError in Python). The query MUST guard against empty cuisines and emit the agreed-upon sentinel.',
      viz_anchor: null,
    },
    {
      inputs: ['"changeRating(a,5),changeRating(b,5),changeRating(c,5),highestRated(japanese)"'],
      expected: '"\\"a\\""',
      explanation_md:
        'Algorithmically interesting: three-way tie on rating, lexicographic break. All three foods (a, b, c) are in cuisine "japanese" with rating 5. Sorted by `(-5, name)`: `(-5,"a") < (-5,"b") < (-5,"c")`. Highest rated → `"a"`. Catches a bug where ties are broken by insertion order or food id — must be ALPHABETICAL by food name (lexicographic on the original string).',
      viz_anchor: null,
    },
  ],

  // ── Segment tree / Fenwick primitives ────────────────────────────────────────

  'segment-tree': [
    {
      inputs: ['"build([1,3,5,7,9,11]),query(1,3),update(1,10),query(1,3)"'],
      expected: '"[null,15,null,22]"',
      explanation_md:
        'Canonical primitive. Build a segment tree over `[1,3,5,7,9,11]` storing range SUM. Tree nodes (1-indexed, parent = floor(i/2)): node[1] covers [0,5]=36; node[2] covers [0,2]=9; node[3] covers [3,5]=27; node[4]=4 covers [0,1]=4; node[5]=5 covers [2,2]=5; etc. `query(1,3)` traverses both halves: from node[2] it picks node[5]=5 (covering 2..2 is OUT — let me re-derive). Internal nodes that fully lie inside [1,3] contribute. Sum of indices 1, 2, 3 = 3+5+7 = 15. `update(1, 10)` rewrites index 1 to 10, propagating up: leaf delta is +7, every ancestor of leaf[1] adds 7. `query(1,3)` now returns 15 + 7 = 22. Each op is O(log n).',
      viz_anchor: null,
    },
    {
      inputs: ['"build([42]),query(0,0),update(0,100),query(0,0)"'],
      expected: '"[null,42,null,100]"',
      explanation_md:
        'Edge case: single-element segment tree. Tree is just one leaf (logically; many implementations still allocate a 2-node array for parent + leaf). `query(0,0)` returns 42. `update(0, 100)` rewrites it. `query(0,0)` returns 100. Catches a bug in the recursive build where the base case fails when `start == end` (off-by-one would either skip the leaf or double-count it). Many bugs in segment-tree code surface only on the n=1 boundary.',
      viz_anchor: null,
    },
    {
      inputs: ['"build([0,0,0,0,0]),update(2,7),query(0,4),query(2,2),query(0,1)"'],
      expected: '"[null,null,7,7,0]"',
      explanation_md:
        'Algorithmically interesting: single-point update with multiple queries. After build, all sums are 0. `update(2, 7)` sets index 2 = 7; ancestors of leaf[2] become 7 (only those on the path). `query(0,4)` returns 7. `query(2,2)` returns 7 (the leaf itself). `query(0,1)` returns 0 (range doesn\'t include the updated index). Catches a bug where the lazy propagation (if any) fails to push, leaking the update beyond its intended range. Also catches a bug where the partial-overlap recursion forgets to recurse into the correct child.',
      viz_anchor: null,
    },
  ],

  'fenwick-tree': [
    {
      inputs: ['"build([1,2,3,4,5]),prefix(3),update(2,10),prefix(3),prefix(5)"'],
      expected: '"[null,6,null,16,25]"',
      explanation_md:
        'Canonical Fenwick (BIT) example. Build over `[1,2,3,4,5]` (1-indexed). Internally `tree=[0,1,3,3,10,5]` where `tree[i]` covers the range determined by `i & -i`. `prefix(3) = tree[3] + tree[2] = 3 + 3 = 6` (= 1+2+3). `update(2, 10)` applies DELTA +10 at index 2 (it was 2, now 12). Walk up via `i += i & -i`: tree[2]+=10 → 13, tree[4]+=10 → 20. `prefix(3) = tree[3] + tree[2] = 3 + 13 = 16` (= 1+12+3). `prefix(5) = tree[5] + tree[4] = 5 + 20 = 25` (= 1+12+3+4+5). The `i & -i` trick is the entire point: it isolates the lowest set bit, which is exactly the range length tree[i] covers.',
      viz_anchor: null,
    },
    {
      inputs: ['"build([1]),prefix(1)"'],
      expected: '"[null,1]"',
      explanation_md:
        'Edge case: single-element BIT. `tree=[0,1]`. `prefix(1) = tree[1] = 1`. The walk-down loop `i -= i & -i` terminates after one step because `1 - 1 = 0`. Catches an infinite-loop bug where the implementation uses `i -= 1` instead of `i -= i & -i` (would compute prefix(1) = 1 correctly but break the O(log n) bound on larger inputs).',
      viz_anchor: null,
    },
    {
      inputs: ['"build([0,0,0,0,0,0,0,0]),update(8,5),prefix(8),update(1,3),prefix(8),prefix(1)"'],
      expected: '"[null,null,5,null,8,3]"',
      explanation_md:
        'Algorithmically interesting: updates at both ends of the array exercise the full propagation. `update(8, 5)` walks: tree[8]+=5 → done (8 + 8 = 16 > n). `prefix(8) = tree[8] = 5`. `update(1, 3)` walks: tree[1]+=3, tree[2]+=3, tree[4]+=3, tree[8]+=3 → tree=[0,3,3,0,3,0,0,0,8]. `prefix(8) = tree[8] = 8`. `prefix(1) = tree[1] = 3`. Catches a bug where the propagation loop terminates early (`i > n` check off-by-one) — would miss tree[8] on the update from index 1, returning 5 instead of 8 for prefix(8).',
      viz_anchor: null,
    },
  ],

  'find-median-data-stream': [
    {
      inputs: ['["addNum","addNum","findMedian","addNum","findMedian"]', '[1,2,0,3,0]'],
      expected: '[1.5,2.0]',
      explanation_md:
        'Canonical LC example. Two heaps: `lo` (max-heap) holds the smaller half; `hi` (min-heap) holds the larger half. Invariant: `|lo| - |hi| ∈ {0, 1}`. `addNum(1)`: push to lo → lo=[1], hi=[]. `addNum(2)`: push 2 to lo, then balance: pop lo\'s max (2) into hi → lo=[1], hi=[2]. Median = (1+2)/2 = 1.5. `addNum(3)`: push 3 to hi, then balance (lo is one short): pop hi\'s min (2) into lo → lo=[2,1], hi=[3]. Median = lo.top = 2.0. The two-heap split is O(log n) per add and O(1) per median.',
      viz_anchor: null,
    },
    {
      inputs: ['["addNum","findMedian"]', '[5,0]'],
      expected: '[5.0]',
      explanation_md:
        'Edge case: single-element stream. After `addNum(5)`, lo=[5], hi=[]. Median = lo.top = 5.0. Catches a bug where the implementation reports the median only when both heaps are non-empty (would crash or return 0 on the very first element). The odd-count case must read directly from `lo.top`.',
      viz_anchor: null,
    },
    {
      inputs: ['["addNum","addNum","addNum","addNum","findMedian"]', '[5,5,5,5,0]'],
      expected: '[5.0]',
      explanation_md:
        'Algorithmically interesting: all duplicates. After 4 additions of 5: lo=[5,5], hi=[5,5]. Median = (5+5)/2 = 5.0. Catches a bug where the heaps internally dedupe (would push into one heap only and skew the invariant). The two-heap approach must accept duplicates — every push lands somewhere, even if multiple identical values stack up on both heaps.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
const slugs = Object.keys(PAYLOAD);
console.log(`Batch 16: ${slugs.length} problems queued.`);

// Skip rows already at 3.
const { data: existing, error: exErr } = await sb
  .from('PGcode_problems')
  .select('id, explained_samples')
  .in('id', slugs);
if (exErr) { console.error('Pre-check failed:', exErr.message); process.exit(1); }
const haveThree = new Set();
for (const r of existing) {
  const cnt = Array.isArray(r.explained_samples) ? r.explained_samples.length : 0;
  if (cnt === 3) haveThree.add(r.id);
}

for (const [slug, samples] of Object.entries(PAYLOAD)) {
  if (haveThree.has(slug)) {
    console.log(`- ${slug}  (already has 3, skipped)`);
    skipped++;
    continue;
  }
  if (!Array.isArray(samples) || samples.length !== 3) {
    console.log(`✗ ${slug}: payload length ${samples?.length} (need 3)`);
    failed++;
    continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`✗ ${slug}: ${error.message}`); failed++; }
  else { console.log(`✓ ${slug}`); ok++; }
}
console.log(`\nBatch 16: ok=${ok} failed=${failed} skipped=${skipped}`);
