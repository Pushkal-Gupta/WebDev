#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 2 (15 problems).
// Same shape as batch 1: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Run: node scripts/backfill-explained-samples-batch2.mjs

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
  '3sum': [
    {
      inputs: ['[-1,0,1,2,-1,-4]'],
      expected: '[[-1,-1,2],[-1,0,1]]',
      explanation_md:
        'The canonical LC example. The brute-force triple loop is **O(n³)** — unworkable past a few hundred elements. The standard approach sorts first (`[-4,-1,-1,0,1,2]`), then for each anchor `i` runs a two-pointer scan over the suffix. Anchor `-4`: pointers find nothing summing to `4`. Anchor `-1` (first): `left=-1, right=2 → -1+-1+2=0` hit, then `left=0, right=1 → -1+0+1=0` hit. Anchor `-1` (second): **skipped** because it equals the previous anchor — that dedup is the only thing keeping the output distinct.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0]'],
      expected: '[[0,0,0]]',
      explanation_md:
        'The all-same edge case. A naive implementation that skips every duplicate anchor would skip the second and third `0` and miss the only valid triple. The correct dedup logic only skips duplicates **after** the first iteration of the anchor loop, not the first one itself. Sorted input is `[0,0,0]`. Anchor at `i=0` with `left=1, right=2` gives `0+0+0=0` — record `[0,0,0]`. Advance pointers past duplicates → loop ends. Return `[[0,0,0]]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[-2,0,1,1,2]'],
      expected: '[[-2,0,2],[-2,1,1]]',
      explanation_md:
        'The "duplicate elements inside the suffix" case. Sorted already. Anchor `-2`: `left=0(value 0), right=4(value 2)`. Sum `0`, record `[-2,0,2]`. Advance both. `left=1(value 1), right=3(value 1)`. Sum `0`, record `[-2,1,1]`. Both pointers advance past duplicates, cross — done. This exercises the **inner dedup**: after recording a hit, both pointers must skip over duplicates of the just-used values, or `[-2,1,1]` would be emitted twice (once for each `1` paired with the other).',
      viz_anchor: null,
    },
  ],

  'container-with-most-water': [
    {
      inputs: ['[1,8,6,2,5,4,8,3,7]'],
      expected: '49',
      explanation_md:
        'The canonical LC example. Brute force checks every pair — **O(n²)**. Two-pointer starts at `left=0(h=1), right=8(h=7)`. Area `= min(1,7) * 8 = 8`. Always **move the shorter wall** — keeping it can never improve the area, because shrinking width with the same low ceiling only hurts. Advance `left`. Trace continues: best lands on `left=1(h=8), right=8(h=7)` with area `min(8,7) * 7 = 49`. Return `49`. Linear time, constant space.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: '1',
      explanation_md:
        'The two-element edge case — the smallest valid input. Both walls have height `1`, separated by width `1`. Area `= min(1,1) * 1 = 1`. The loop runs exactly once and exits when the pointers meet. A buggy implementation that uses `<= ` instead of `<` in the while-loop condition would compute a zero-width area at the meet point and might overwrite the answer — `<` (strict) is the right guard.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,3,2,1,4]'],
      expected: '16',
      explanation_md:
        'The "outermost pair wins" case. `left=0(h=4), right=4(h=4)`. Area `= min(4,4) * 4 = 16`. A greedy that always moves the right pointer first (because right is "earlier" in some traversal) would compute `min(4,1)*3 = 3` next and start sliding inward toward strictly worse pairs. The correct rule — **move whichever wall is shorter; if tied, move either** — keeps the outermost wide pair as the global max here. Return `16`.',
      viz_anchor: null,
    },
  ],

  'reverse-linked-list': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'The canonical LC example. Iterative reversal uses three pointers: `prev=null`, `curr=head`, `next=null`. Each tick: save `next = curr.next`, flip `curr.next = prev`, slide `prev = curr`, `curr = next`. Trace: after step 1, `prev=1→null`. After step 2, `prev=2→1→null`. Continue until `curr` is `null`. Return `prev`. **O(n)** time, **O(1)** extra space — recursive version is also `O(n)` but eats `O(n)` stack frames.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-list edge case. `head` is `null`. The iterative loop `while curr` exits immediately, returning the initial `prev = null` — the empty reversed list. A brittle implementation that unconditionally accesses `head.next` before checking would crash here. The clean version makes no assumption about a non-null head; the loop guard handles it.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: '[2,1]',
      explanation_md:
        'The two-node case — the smallest non-trivial reversal. `prev=null, curr=1`. Tick 1: `next=2`, `1.next=null`, `prev=1`, `curr=2`. Tick 2: `next=null`, `2.next=1`, `prev=2`, `curr=null`. Return `prev=2`, list `2→1→null`. This is the case that catches the bug of forgetting to save `next` before flipping `curr.next` — without the save, you would lose the rest of the list on the very first iteration.',
      viz_anchor: null,
    },
  ],

  'lowest-common-ancestor-of-a-binary-search-tree': [
    {
      inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '8'],
      expected: '6',
      explanation_md:
        'The canonical LC example. The BST property gives away the answer: walk from the root and compare both targets to the current node. If both are **smaller**, go left. If both are **larger**, go right. Otherwise the current node splits them — it is the LCA. At root `6`: `2 < 6 < 8`, so `6` is the split — return `6`. **O(h)** time where `h` is tree height, no recursion stack needed for the iterative version.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1]', '2', '1'],
      expected: '2',
      explanation_md:
        'The "one node is the ancestor" edge case. At root `2`: `p=2` matches the current node directly. The standard rule (`p` or `q` equals current → current is LCA) terminates immediately. The brittle implementation that only checks `if p < node and q < node` / `if p > node and q > node` would treat the "equal" case as "fall through, return current" by luck, which is correct here but only because the equality is not explicitly handled. The clean version returns `current` the moment either target matches.',
      viz_anchor: null,
    },
    {
      inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '4'],
      expected: '2',
      explanation_md:
        'The "one target is an ancestor of the other" case. At root `6`: `2 < 6` and `4 < 6`, both smaller, go left. At `2`: `p=2` matches — return `2`. The deeper target `4` lives in `2`s right subtree, so `2` is its ancestor. This case proves the equality check is essential: without it, the algorithm would continue past `2` into its subtree looking for "the split" and never find one, because `4` is below `2` rather than across from it.',
      viz_anchor: null,
    },
  ],

  'number-of-1-bits': [
    {
      inputs: ['11'],
      expected: '3',
      explanation_md:
        'The canonical LC example. `11` in binary is `1011` — three set bits. The naive approach shifts right 32 times and counts the LSB each step. The **Brian Kernighan trick** runs in `popcount(n)` iterations instead: `n &= (n - 1)` clears the lowest set bit. From `1011`: `1011 & 1010 = 1010`. `1010 & 1001 = 1000`. `1000 & 0111 = 0`. Three iterations → return `3`. Much faster when the input is sparse.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '0',
      explanation_md:
        'The zero edge case. No bits are set. The Kernighan loop `while n` exits immediately. The naive shift-and-count loop also returns `0` because every LSB is `0`. The brittle implementation that does `do...while` instead of `while` would execute the body once and produce `0` here by accident — but the equally brittle one that returns `1` for "the empty count" would be wrong. Always start the counter at `0` and let the loop produce the right answer naturally.',
      viz_anchor: null,
    },
    {
      inputs: ['4294967293'],
      expected: '31',
      explanation_md:
        'The "almost all bits set" case — `4294967293` is `0xFFFFFFFD`, i.e. 32 bits with the bit-1 position cleared. Naive shift-counting does 32 iterations and counts `31` ones. Brian Kernighan also does `31` iterations here — exactly one per set bit — so the two approaches tie on this input. This case proves the Kernighan trick wins on **sparse** inputs and ties on **dense** ones; it never loses. Return `31`.',
      viz_anchor: null,
    },
  ],

  'house-robber': [
    {
      inputs: ['[1,2,3,1]'],
      expected: '4',
      explanation_md:
        'The canonical LC example. Rule: cannot rob two adjacent houses. DP recurrence: `dp[i] = max(dp[i-1], dp[i-2] + nums[i])` — either skip house `i` or take it plus the best up to `i-2`. Trace: `dp[0]=1, dp[1]=max(1,2)=2, dp[2]=max(2,1+3)=4, dp[3]=max(4,2+1)=4`. Return `4` — rob houses 0 and 2. The space-optimised version keeps just two rolling variables instead of the full array.',
      viz_anchor: null,
    },
    {
      inputs: ['[2]'],
      expected: '2',
      explanation_md:
        'The single-house edge case. With one house, the answer is just its value — rob it. The DP loop never executes; the initial seeding `dp[0] = nums[0]` is returned directly. The brittle implementation that requires `nums.length >= 2` to start the recurrence will crash or return `0`. The clean version handles `n = 0` (return `0`) and `n = 1` (return `nums[0]`) as guarded base cases before the main loop.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,7,9,3,1]'],
      expected: '12',
      explanation_md:
        'The "greedy picks the wrong subset" case. A greedy that grabs the largest available without checking adjacency would pick `9, 7` → adjacent → invalid, fall back to `9, 3` for total `12` — by luck, the right answer. But on `[2,7,9,3,1]` the correct DP trace is: `dp = [2, 7, 11, 11, 12]`. Houses 0+2+4 = `2+9+1 = 12`. The DP finds it without trial-and-error: at each index it just compares "skip" vs "take plus best two back". Return `12`.',
      viz_anchor: null,
    },
  ],

  'happy-number': [
    {
      inputs: ['19'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Replace `n` by the sum of squares of its digits until it reaches `1` (happy) or cycles forever (unhappy). Trace: `19 → 1²+9² = 82 → 8²+2² = 68 → 6²+8² = 100 → 1²+0²+0² = 1`. Happy → return `true`. Detect cycles either with a hash set or Floyd\'s tortoise-and-hare on the digit-square function. **O(log n)** per step, bounded number of steps.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'The base-case edge. `1` is happy by definition — the loop terminates immediately. The brittle implementation that always runs the digit-square transformation once before checking would compute `1² = 1` and still return `true`, but only by coincidence. The clean version checks `n == 1` at the top of the loop, before any computation.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: 'false',
      explanation_md:
        'The classic unhappy cycle. Trace: `2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4` — back to `4`. Cycle detected → return `false`. A naive implementation without cycle detection would loop forever. The hash-set approach stores every seen value and returns `false` when a value repeats; Floyd\'s approach runs two pointers (slow once, fast twice) and returns `false` when they collide before either hits `1`. Both are correct; Floyd uses **O(1)** space.',
      viz_anchor: null,
    },
  ],

  'contains-duplicate': [
    {
      inputs: ['[1,2,3,1]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. The brute-force pair scan is **O(n²)**. The hash-set approach walks once: insert `1` (new), `2` (new), `3` (new), `1` — **already present**, return `true`. **O(n)** time, **O(n)** space. The alternative `len(set(nums)) != len(nums)` one-liner is equally fast but builds the whole set even when an early duplicate would let us short-circuit.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]'],
      expected: 'false',
      explanation_md:
        'The all-distinct edge case. The set grows to four elements without any collision; the loop ends, return `false`. A brittle implementation that returns `true` whenever the set size **changes** would be correct here by accident, but the right rule is "return `true` on a failed insert" — i.e. the value was already present. With all distinct values, the failed-insert branch never fires, so `false` is the correct default.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,3,3,4,3,2,4,2]'],
      expected: 'true',
      explanation_md:
        'The "duplicate appears immediately" case. Insert `1` (new), then `1` again — collision on the second element, return `true` after looking at only 2 entries out of 10. This is exactly the input that proves the streaming hash-set approach beats the "build full set, compare lengths" approach in practice: short-circuit on first duplicate saves the remaining 8 lookups. Sort-then-scan would still take **O(n log n)** here regardless of where the duplicate sits.',
      viz_anchor: null,
    },
  ],

  'valid-palindrome': [
    {
      inputs: ['"A man, a plan, a canal: Panama"'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Two-pointer walk: `left` starts at `0`, `right` at the end. Skip non-alphanumeric on both sides, lowercase the survivors, compare. `A` vs `a` (after lowercasing) → match. Continue inward, skipping commas, spaces, and the colon. Every comparison matches → return `true`. **O(n)** time, **O(1)** extra space. The brute "filter to clean string, compare to its reverse" approach is also `O(n)` but allocates two new strings.',
      viz_anchor: null,
    },
    {
      inputs: ['" "'],
      expected: 'true',
      explanation_md:
        'The whitespace-only edge case. After filtering non-alphanumeric, the cleaned string is empty. An empty string is **trivially a palindrome**. The two-pointer version handles it without filtering: `left=0, right=0`. The outer `while left < right` is false immediately, return `true`. The brittle implementation that requires `len(s) > 0` after filtering would special-case it correctly here, but the clean version needs no special case.',
      viz_anchor: null,
    },
    {
      inputs: ['"race a car"'],
      expected: 'false',
      explanation_md:
        'The "looks close but mismatches in the middle" case. Cleaned: `raceacar`. Two-pointer: `r`/`r` match, `a`/`a` match, `c`/`c` match, `e`/`a` — mismatch, return `false`. This case catches a buggy implementation that strips **all** spaces but forgets to lowercase, or vice versa — `raceacar` is the deliberate stress test: same letters in roughly the same positions, but the `e` and the inner `a` break the symmetry. Eight characters, four comparisons, then exit.',
      viz_anchor: null,
    },
  ],

  'invert-binary-tree': [
    {
      inputs: ['[4,2,7,1,3,6,9]'],
      expected: '[4,7,2,9,6,3,1]',
      explanation_md:
        'The canonical LC example. Invert means swap every node\'s left and right children, recursively. At each node: swap `left` and `right`, then recurse into both. Root `4`: swap children `2` and `7`. Recurse into `7` (now left): swap its `6` and `9`. Recurse into `2` (now right): swap its `1` and `3`. Returned tree level-order: `[4, 7, 2, 9, 6, 3, 1]`. **O(n)** time, **O(h)** recursion stack.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-tree edge case. `root` is `null`. The recursive version returns `null` immediately via the base case; the iterative BFS/DFS version never enters the loop because the queue/stack starts empty. The brittle implementation that unconditionally accesses `root.left` before checking would crash here. The clean version is `if not root: return None` at the top — no other special-casing needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1,3]'],
      expected: '[2,3,1]',
      explanation_md:
        'The smallest non-trivial tree — three nodes. Root `2` swaps children: `left=1, right=3` becomes `left=3, right=1`. The children are leaves, so the recursion terminates without further work. Return `[2, 3, 1]` level-order. This case proves the **swap-then-recurse** order works; **recurse-then-swap** also works because the swap commutes with the unrelated subtree inversions, but the swap-first version is one line shorter.',
      viz_anchor: null,
    },
  ],

  'maximum-depth-of-binary-tree': [
    {
      inputs: ['[3,9,20,null,null,15,7]'],
      expected: '3',
      explanation_md:
        'The canonical LC example. Depth `= 1 + max(depth(left), depth(right))`. Root `3` has `9` (leaf, depth `1`) on the left and `20` on the right. `20` has children `15` and `7`, both leaves → `20`s depth is `1 + max(1,1) = 2`. Root depth `= 1 + max(1, 2) = 3`. Return `3`. The iterative BFS-by-level version counts levels until the queue empties — same answer, **O(n)** time either way.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'The empty-tree edge case. Depth of a null tree is `0` by convention. The recursive base case `if not root: return 0` handles it directly; the iterative version never enters the level-counting loop. The brittle implementation that returns `1` for a null tree (confusing "no nodes" with "one node") would fail every downstream height-based algorithm. Always anchor at `0` for null.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,null,2,null,3,null,4]'],
      expected: '4',
      explanation_md:
        'The skewed-tree case — a right-spine of four nodes. Every node has only a right child. Recursion: depth(`4`) = `1`, depth(`3`) = `1 + max(0, 1) = 2`, depth(`2`) = `3`, depth(`1`) = `4`. Return `4`. This is the worst case for recursion-stack depth — `O(n)` frames — and the input that proves a balanced-tree shortcut (`return floor(log2(n)) + 1`) would be wrong. Must actually walk.',
      viz_anchor: null,
    },
  ],

  'same-tree': [
    {
      inputs: ['[1,2,3]', '[1,2,3]'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. Recursive walk: at each step, both nodes must be null **together** or non-null with equal values **and** matching subtrees. Root: both `1`, recurse into both lefts (`2 == 2`, both leaves) and both rights (`3 == 3`, both leaves). Every comparison matches → return `true`. **O(min(n, m))** time, **O(h)** stack. The iterative BFS-pair version pushes node pairs onto a queue and checks each pair the same way.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '[]'],
      expected: 'true',
      explanation_md:
        'The both-empty edge case. Two empty trees are trivially equal. The base case `if not p and not q: return True` fires immediately. The brittle implementation that returns `false` whenever either input is null would fail here. The clean version checks all three cases at the top: both null → `true`; exactly one null → `false`; both non-null → compare values and recurse.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '[1,null,2]'],
      expected: 'false',
      explanation_md:
        'The "same values, different structure" case. Both trees have one root and one child with value `2`, but tree 1 has it on the left and tree 2 on the right. At root: values match, recurse left — tree 1 has `2`, tree 2 has `null` → exactly-one-null branch fires → return `false`. This case catches a buggy implementation that compares **multisets of values** instead of structures — that bug would return `true` here. Structure matters; positions must match exactly.',
      viz_anchor: null,
    },
  ],

  'path-sum': [
    {
      inputs: ['[5,4,8,11,null,13,4,7,2,null,null,null,1]', '22'],
      expected: 'true',
      explanation_md:
        'The canonical LC example. A root-to-leaf path summing to `22` exists: `5 → 4 → 11 → 2 = 22`. The recursive walk subtracts the current value from the remaining target and recurses into both children. At a leaf, check whether the remainder equals the leaf value. Trace down the left spine: `targetSum: 22 → 17 → 13 → 2`, leaf `2 == 2` → return `true`. **O(n)** time, **O(h)** stack.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '0'],
      expected: 'false',
      explanation_md:
        'The empty-tree edge case. An empty tree has **no paths at all**, so no path can sum to anything — including `0`. The brittle implementation that returns `true` whenever `targetSum == 0` would fail here. The correct base case is `if not root: return False`. This is the input that catches the off-by-one of conflating "the empty path sums to zero" (true for sums in the abstract) with "this tree contains a root-to-leaf path summing to zero" (false when there is no tree).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '5'],
      expected: 'false',
      explanation_md:
        'The "no path matches" case. Tree has two root-to-leaf paths: `1→2 = 3` and `1→3 = 4`. Neither sums to `5`. Recursive trace: at root `1`, remainder `5-1 = 4`. Left child `2` is a leaf, check `4 == 2` → no. Right child `3` is a leaf, check `4 == 3` → no. Both branches return `false`, root returns `false`. This case proves the algorithm must check at the **leaf**, not at internal nodes — an early-return at `1` because `1 < 5` would short-circuit incorrectly.',
      viz_anchor: null,
    },
  ],

  'intersection-of-two-arrays': [
    {
      inputs: ['[1,2,2,1]', '[2,2]'],
      expected: '[2]',
      explanation_md:
        'The canonical LC example. The result is the **set intersection** — each common value appears at most once. The hash-set approach: build `set(nums1) = {1, 2}`, walk `nums2` and collect values present in the set. From `nums2`: `2` is in → add. `2` again → already added (use a result set, not a list). Return `[2]`. **O(n + m)** time. The two-pointer-after-sort variant is `O(n log n + m log m)`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '[4,5,6]'],
      expected: '[]',
      explanation_md:
        'The disjoint-arrays edge case. No element of `nums2` appears in `nums1`. The hash set has `{1, 2, 3}`; walking `nums2`, every lookup misses. Result set stays empty → return `[]`. The brittle implementation that returns `null` instead of an empty array for "no intersection" would break downstream callers expecting an iterable. Always return the empty list, never `null`.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,9,5]', '[9,4,9,8,4]'],
      expected: '[9,4]',
      explanation_md:
        'The "duplicates in both inputs" case. Build `set(nums1) = {4, 9, 5}`. Walk `nums2`: `9` in → add, `4` in → add, `9` already added, `8` not in, `4` already added. Result `{9, 4}` (or `{4, 9}` — set order is not guaranteed). LC accepts either order. This case proves the dedup must happen in the **result**, not just in one input — without a result set, `[9, 4, 9, 4]` would leak out, violating the "each element unique" rule.',
      viz_anchor: null,
    },
  ],

  'reverse-string': [
    {
      inputs: ['["h","e","l","l","o"]'],
      expected: '["o","l","l","e","h"]',
      explanation_md:
        'The canonical LC example. The problem requires **in-place** reversal — no auxiliary array. Two-pointer swap: `left=0, right=4`. Swap `s[0]` and `s[4]` → `["o","e","l","l","h"]`. Advance: `left=1, right=3`. Swap `s[1]` and `s[3]` → `["o","l","l","e","h"]`. `left=2, right=2`, loop exits. **O(n)** time, **O(1)** extra space. The Pythonic `s.reverse()` does the same thing under the hood.',
      viz_anchor: null,
    },
    {
      inputs: ['["a"]'],
      expected: '["a"]',
      explanation_md:
        'The single-character edge case. The two-pointer loop guard `left < right` is false from the start (`0 < 0` is `false`). No swaps happen, the array is returned unchanged. The brittle implementation that always swaps once before checking would access `s[0]` and `s[0]` — same index, swap is a no-op so still correct, but the loop guard is cleaner because it avoids the useless work on every odd-length input.',
      viz_anchor: null,
    },
    {
      inputs: ['["H","a","n","n","a","h"]'],
      expected: '["h","a","n","n","a","H"]',
      explanation_md:
        'The even-length palindrome-looking case. After reversal, the array still looks like "Hannah" but with cases swapped — the algorithm is case-sensitive and operates on character positions, not semantic content. Two-pointer trace: swap `s[0]/s[5]` (`H`/`h`), `s[1]/s[4]` (`a`/`a` — no visible change but the swap still runs), `s[2]/s[3]` (`n`/`n`). Loop exits at `left=3, right=2`. Return `["h","a","n","n","a","H"]`. The input proves the algorithm does not "detect palindrome and skip work" — it always does `floor(n/2)` swaps.',
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
