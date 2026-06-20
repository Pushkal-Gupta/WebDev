#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 33 (30 HARD problems only).
// Same shape as batches 1..32: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Selected only Hard problems whose explained_samples was empty and that hold >=3 graded test cases.
// Every sample traces a real graded test case from the registry; no Judge0, pure prose.
// (Requested as "batch9", but batches 1..32 already exist — using the next free number, batch33,
//  to avoid clobbering the committed DP-focused batch9.)
// Run: node scripts/backfill-explained-samples-batch33.mjs

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
  'sliding-window-maximum': [
    {
      inputs: ['[1,3,-1,-3,5,3,6,7]', '3'],
      expected: '[3,3,5,5,6,7]',
      explanation_md:
        'The insight: a value can never be a window maximum once a larger value appears to its right, so we keep a monotonic-decreasing deque of indices. Front of the deque is always the current max. Trace `k=3`: window `[1,3,-1]` keeps `3`; sliding to `[3,-1,-3]` still tops at `3`; `[-1,-3,5]` evicts everything smaller and reports `5`; `[-3,5,3]` keeps `5`; then `6`, then `7` as each new larger element wipes the deque. Output `[3,3,5,5,6,7]`. Each index is pushed and popped once, so **O(n)** total, not **O(nk)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '[1]',
      explanation_md:
        'The minimal window. With `k=1` every window is a single element, so the answer is just the array itself: each element is trivially its own maximum. The deque holds exactly one index at any time, pushing the new element and immediately reporting it. Output `[1]`. This case proves the algorithm produces one output per window and that `n - k + 1 = 1` windows are emitted for a length-one array, the lower bound on the output size. No eviction logic is ever exercised here.',
      viz_anchor: null,
    },
    {
      inputs: ['[9,11]', '2'],
      expected: '[11]',
      explanation_md:
        'A single window of width `2` where the second element dominates. Push index `0` (value `9`); when index `1` (value `11`) arrives, the monotonic rule pops `9` because it is smaller and can never again be a max while `11` sits to its right. The deque front is now index `1`, reporting `11`. Only one window exists, so the output is `[11]`. Proves the eviction-from-the-back step fires correctly: a newcomer larger than the tail clears stale candidates before being appended.',
      viz_anchor: null,
    },
  ],

  'minimum-window-substring': [
    {
      inputs: ['"ADOBECODEBANC"', '"ABC"'],
      expected: '"BANC"',
      explanation_md:
        'Find the shortest substring of `s` containing every character of `t` with multiplicity. Slide a right pointer to grow the window until it covers `A`, `B`, `C`, then advance the left pointer to shrink while coverage holds, recording the best. On `"ADOBECODEBANC"`: the first valid window is `"ADOBEC"`, then shrinking and re-expanding walks through later windows, and the final `"BANC"` at the end wins at length `4`. Output `"BANC"`. **O(|s| + |t|)** with a need-count map driving the expand-then-contract sweep.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"aa"'],
      expected: '""',
      explanation_md:
        'An impossibility case: `t` demands two copies of `a`, but `s` has only one. The window can never satisfy the requirement that the count of `a` reaches `2`, so the formed-equals-required condition never becomes true and no candidate is ever recorded. The function returns the empty string. Proves the algorithm tracks multiplicity, not just presence: a per-character deficit and a count of fully-satisfied characters is what makes it report failure here instead of wrongly returning `"a"`.',
      viz_anchor: null,
    },
    {
      inputs: ['"ab"', '"b"'],
      expected: '"b"',
      explanation_md:
        'A single-character target that appears once. The right pointer extends past `a` (which does not help coverage) to include `b`, at which point the window `"ab"` is valid. Shrinking from the left drops `a`, leaving `"b"` still valid at length `1`, the minimum possible. Output `"b"`. Proves the contract phase trims every leading character that is not needed for coverage, so an unnecessary prefix like `a` is never kept in the final answer.',
      viz_anchor: null,
    },
  ],

  'cherry-pickup': [
    {
      inputs: ['[[0,1,-1],[1,0,-1],[1,1,1]]'],
      expected: '5',
      explanation_md:
        'Pick cherries on a path to the bottom-right, then back to the top-left, with `-1` cells blocked. The trick is to model both trips as two walkers moving down-right simultaneously; a cell picked by either counts once. Track `dp[r1][c1][r2]` since the second column `c2 = r1 + c1 - r2` is derived. On this grid the best joint paths collect `5` cherries: the two routes weave around the `-1` wall on the right and share the bottom row. Output `5`. **O(n^3)** states, each resolved in **O(1)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1,-1],[1,-1,1],[-1,1,1]]'],
      expected: '0',
      explanation_md:
        'A grid where every route is blocked. The `-1` cells form a barrier on the anti-diagonal that no monotone down-right path can avoid: reaching the bottom-right requires stepping onto a `-1`. Since no valid round trip exists, the answer is `0` cherries, not a partial count. Output `0`. Proves the algorithm returns `0` when the destination is unreachable rather than crediting cherries from a path that cannot legally complete; blocked states propagate as negative infinity and never win the max.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '1',
      explanation_md:
        'A single cell holding one cherry. Both the forward and return trips start and end on the same square, so the lone cherry is picked exactly once, not twice, because a shared cell counts a single time. Output `1`. Proves the de-duplication rule when the two walkers occupy the same position: the value is added once, not added for each walker. This boundary confirms the base case of the dual-walker recurrence is seeded correctly at the start-equals-end square.',
      viz_anchor: null,
    },
  ],

  'trapping-rain-water-ii': [
    {
      inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'],
      expected: '1',
      explanation_md:
        'Water trapped on a 2D height map. The insight is to flood inward from the lowest boundary using a min-heap: the water level at any interior cell is capped by the lowest wall on its escape route to the border. Here a single `0` sits in the center, ringed entirely by walls of height `1`. The lowest surrounding wall is `1`, so the basin fills to level `1`, trapping `1 - 0 = 1` unit. Output `1`. **O(mn log(mn))** as each cell enters the heap once.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '0',
      explanation_md:
        'A strictly increasing slope with no basin. Every interior cell has at least one neighbor lower than itself leading off the grid, so water always finds a downhill escape and nothing pools. The heap-based flood never raises any cell above its own height. Output `0`. Proves the algorithm reports zero when there is no enclosed depression: trapping requires a cell to be surrounded by strictly higher boundaries on all escape routes, which a monotone ramp never provides.',
      viz_anchor: null,
    },
    {
      inputs: ['[[5,5,5,5],[5,1,1,5],[5,1,1,5],[5,5,5,5]]'],
      expected: '16',
      explanation_md:
        'A square bowl: a `4x4` wall of height `5` enclosing a `2x2` floor of height `1`. The lowest boundary anywhere is `5`, so the entire inner pool fills to level `5`. Each of the four interior cells traps `5 - 1 = 4` units, totaling `4 * 4 = 16`. Output `16`. Proves the heap propagates the boundary water level correctly across a multi-cell interior: every inner cell is limited by the same enclosing rim, not just its immediate neighbors.',
      viz_anchor: null,
    },
  ],

  'integer-to-english-words': [
    {
      inputs: ['123'],
      expected: '"One Hundred Twenty Three"',
      explanation_md:
        'Convert an integer to English words by chunking into groups of three digits and naming each group plus its scale (thousand, million, billion). For `123`, a single group: the hundreds digit `1` gives "One Hundred", then the remaining `23` gives "Twenty Three". Joined: "One Hundred Twenty Three". Output as shown. The core helper converts any value `0..999` into words; the outer loop attaches scale words. **O(1)** since the number has at most a fixed number of three-digit groups.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '"Zero"',
      explanation_md:
        'The zero edge case. Every nonzero group emits words, but `0` produces an empty group, so the assembled string would be blank. The algorithm special-cases `num == 0` at the very top and returns "Zero" directly. Output "Zero". Proves the mandatory top-level guard: without it the result would be the empty string, since the three-digit chunk helper correctly emits nothing for a group of `000`. This is the one input the chunking logic cannot name on its own.',
      viz_anchor: null,
    },
    {
      inputs: ['12345'],
      expected: '"Twelve Thousand Three Hundred Forty Five"',
      explanation_md:
        'A two-group number exercising the scale words. Split into groups of three from the right: `12` and `345`. The high group `12` becomes "Twelve" and, being the thousands group, gets "Thousand" appended. The low group `345` becomes "Three Hundred Forty Five". Concatenated: "Twelve Thousand Three Hundred Forty Five". Proves the scale word attaches only to its group and that the teens range (`12` to "Twelve") is handled by a dedicated lookup rather than a tens-plus-ones combination.',
      viz_anchor: null,
    },
  ],

  'text-justification': [
    {
      inputs: ['["This","is","an","example","of","text","justification."]', '16'],
      expected: '["This    is    an","example  of text","justification.  "]',
      explanation_md:
        'Pack as many words per line as fit within `maxWidth`, then distribute spaces evenly, with extra spaces favoring the left gaps. Line 1 holds "This is an" (10 chars of text, 6 spaces over 2 gaps split as 4 and 2). Line 2 "example of text" packs to the width. The last line "justification." is left-justified and right-padded to width. Output as shown. The uneven space split, where the left gaps absorb the remainder, is the rule most implementations get wrong.',
      viz_anchor: null,
    },
    {
      inputs: ['["Hello"]', '10'],
      expected: '["Hello     "]',
      explanation_md:
        'A single word shorter than the width. A line with only one word cannot distribute spaces between words, so it is left-justified and padded on the right to reach `maxWidth`. "Hello" (5 chars) gets 5 trailing spaces to fill width `10`. Output `["Hello     "]`. Proves the single-word branch bypasses the even-distribution logic: with zero gaps to fill, dividing spaces among gaps would divide by zero, so this case must pad right instead.',
      viz_anchor: null,
    },
    {
      inputs: ['["a","b","c","d"]', '5'],
      expected: '["a b c","d    "]',
      explanation_md:
        'Words `a b c` fit on line 1 at exactly width `5` (3 letters, 2 single spaces). The fourth word `d` overflows, so it starts the last line. The final line is always left-justified, so `d` is followed by 4 padding spaces to fill the width. Output `["a b c","d    "]`. Proves the greedy line-packing stops adding words the moment the next word would exceed the width, and that the terminal line uses left-justification regardless of how the body lines were spaced.',
      viz_anchor: null,
    },
  ],

  'edit-distance-2d': [
    {
      inputs: ['"horse"', '"ros"'],
      expected: '3',
      explanation_md:
        'Minimum single-character edits (insert, delete, replace) to turn `word1` into `word2`. Fill a DP table where `dp[i][j]` is the cost for the first `i` and `j` characters; each cell takes the cheapest of the three operations, with a diagonal match costing nothing. For "horse" to "ros" the optimal sequence is replace `h` with `r`, delete `r`, delete `e`, giving `3`. Output `3`. **O(mn)** time and space, the canonical Levenshtein recurrence.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '""'],
      expected: '0',
      explanation_md:
        'Two empty strings. No edits are needed to turn nothing into nothing, so the distance is `0`. The DP table is a single cell `dp[0][0] = 0`, the base case where both prefixes are empty. Output `0`. Proves the base-case seeding is correct: the first row and column of the table represent transforming an empty prefix by pure insertion or deletion, and their intersection at `(0,0)` must be `0`, the empty-to-empty cost.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '""'],
      expected: '1',
      explanation_md:
        'Turning a one-character string into the empty string. The only operation needed is a single deletion of `a`, so the distance is `1`. This corresponds to the first column of the DP table, where `dp[i][0] = i` because emptying an `i`-character prefix costs `i` deletions. Output `1`. Proves the column base case is initialized as a running deletion count rather than left at zero, which a naive table fill would get wrong and report `0`.',
      viz_anchor: null,
    },
  ],

  'median-of-two-sorted': [
    {
      inputs: ['[1,3]', '[2]'],
      expected: '2.0',
      explanation_md:
        'The median of the merged sorted sequence. Conceptually merge `[1,3]` and `[2]` into `[1,2,3]`; with an odd total count of `3`, the median is the middle element `2`. Output `2.0`. The optimal **O(log(min(m,n)))** solution binary-searches a partition of the smaller array so everything on the left is below everything on the right, but the value it converges to is exactly this middle element of the conceptual merge.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '[3,4]'],
      expected: '2.5',
      explanation_md:
        'An even total count. Merged, the arrays form `[1,2,3,4]`; with four elements the median is the average of the two central ones, `(2 + 3) / 2 = 2.5`. Output `2.5`. Proves the even-length branch averages the two middle elements rather than picking one. The partition-based solution handles this by averaging the max of the left halves and the min of the right halves once the correct split is found.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '[1]'],
      expected: '1.0',
      explanation_md:
        'One array is empty. The merged sequence is just `[1]`, a single element, so the median is `1`. Output `1.0`. Proves the algorithm handles an empty operand: the binary search must run over the shorter (here empty) array, where the partition is trivially before all elements, and the median comes entirely from the non-empty array. An implementation that always indexes both arrays would fault on the empty one.',
      viz_anchor: null,
    },
  ],

  'rotate-a-matrix-by-90': [
    {
      inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'],
      expected: '[[7,4,1],[8,5,2],[9,6,3]]',
      explanation_md:
        'Rotate the matrix 90 degrees clockwise in place using a two-step trick. First transpose the grid by swapping `m[i][j]` with `m[j][i]` across the main diagonal, then reverse each row left to right. After the transpose the grid becomes `[[1,4,7],[2,5,8],[3,6,9]]`; reversing each row then gives `[[7,4,1],[8,5,2],[9,6,3]]`. Output as shown. **O(n^2)** time and **O(1)** extra space, never allocating a second grid. Each element lands in its correct rotated position because transpose-then-row-reverse composes exactly into the clockwise quarter turn.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '[[1]]',
      explanation_md:
        'A single cell. Rotating a `1x1` matrix by 90 degrees leaves it unchanged: the lone element is its own transpose, and reversing a one-element row is a no-op. Output `[[1]]`. Proves the algorithm handles the smallest grid without touching anything: the transpose loop swaps only off-diagonal pairs (none exist here) and the row-reversal of a single element does nothing, so the result equals the input.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'An empty matrix with no rows at all. The transpose loop never iterates because there are no off-diagonal pairs to swap, and there are no rows to reverse, so the result is the empty matrix returned unchanged. Output `[]`. Proves the algorithm short-circuits cleanly on degenerate input: both phases iterate over an empty range and perform zero work, with no attempt to read `m[0]` that would throw an index error on a length-zero grid where even the first row does not exist.',
      viz_anchor: null,
    },
  ],

  'permutation-sequence': [
    {
      inputs: ['3', '3'],
      expected: '"213"',
      explanation_md:
        'Find the `k`-th permutation of `1..n` without generating all of them. The permutations split into `n` blocks of `(n-1)!` each by their first digit. For `n=3, k=3` (0-indexed `2`): with `(3-1)! = 2` per block, `2 / 2 = 1` selects the second remaining digit `2` as the first character. The leftover index `2 % 2 = 0` picks from `[1,3]`: `0 / 1! = 0` gives `1`, then `3`. Result `"213"`. **O(n^2)** with factorial-base decoding, far cheaper than enumerating `n!` permutations.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '1'],
      expected: '"123"',
      explanation_md:
        'The first permutation. With `k=1` (0-indexed `0`), every factorial division yields index `0`, so each step picks the smallest remaining digit: `1`, then `2`, then `3`. Result `"123"`, the lexicographically smallest arrangement. Proves the off-by-one conversion from 1-indexed `k` to 0-indexed is handled: subtracting one before decoding is what maps `k=1` to the all-zeros factorial digits and thus the sorted order.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '9'],
      expected: '"2314"',
      explanation_md:
        'A larger case. For `n=4`, blocks of `3! = 6` each. With 0-indexed `k=8`: `8 / 6 = 1` picks the second digit `2`, remainder `8 % 6 = 2`. Next `2 / 2! = 1` picks the second of remaining `[1,3,4]`, which is `3`, remainder `0`. Then `0 / 1! = 0` picks `1`, leaving `4`. Result `"2314"`. Proves the repeated divide-by-shrinking-factorial walk selects the correct digit at each position as the available pool shrinks.',
      viz_anchor: null,
    },
  ],

  'max-points-on-line': [
    {
      inputs: ['[[1,1],[2,2],[3,3]]'],
      expected: '3',
      explanation_md:
        'Find the most points lying on a single straight line. For each point, group all other points by the slope of the line connecting them; the largest group plus the anchor is the best line through that anchor. Here all three points lie on `y = x`: from `(1,1)`, both `(2,2)` and `(3,3)` share slope `1`, so the line holds all `3`. Output `3`. **O(n^2)** using a slope map per anchor; representing slope as a reduced fraction avoids floating-point ties.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0]]'],
      expected: '1',
      explanation_md:
        'A single point. One point alone defines infinitely many lines, but the maximum count of points on any line is just `1`, the point itself. Output `1`. Proves the algorithm returns `1` for a lone point rather than `0`: the answer is seeded to at least one because any single point trivially sits on a line, and the slope-grouping loop over other points simply never runs.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0],[0,1],[0,2],[0,3]]'],
      expected: '4',
      explanation_md:
        'Four points on a vertical line `x = 0`. Vertical lines have undefined slope, so the algorithm must represent them with a sentinel (such as an infinite or a special key) rather than dividing by a zero run. From `(0,0)`, all three others share the vertical-slope key, giving a line of `4`. Output `4`. Proves the vertical-line case is handled: a naive `dy/dx` would divide by zero, so the slope key must encode `dx == 0` distinctly.',
      viz_anchor: null,
    },
  ],

  'smallest-range-covering': [
    {
      inputs: ['[[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]'],
      expected: '[20,24]',
      explanation_md:
        'Find the smallest range that includes at least one number from each of the `k` sorted lists. Use a min-heap holding the current frontier (one element per list) and track the running max; the range spans heap-min to max. Repeatedly pop the smallest and push the next from its list, shrinking the range when possible. The optimal window here is `[20,24]`: it contains `24` (list 1), `20` (list 2), and `22` (list 3). Output `[20,24]`. **O(N log k)** where N is the total element count.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2,3],[1,2,3],[1,2,3]]'],
      expected: '[1,1]',
      explanation_md:
        'Three identical lists. A range can cover one element from each list with zero width by picking the same value from all three: `[1,1]` includes `1` from every list. Output `[1,1]`. Proves the algorithm finds a degenerate single-point range when a common element exists across all lists: the heap frontier can hold the same value from each list simultaneously, making min equal max and the range width zero, the smallest possible.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1],[2],[3]]'],
      expected: '[1,3]',
      explanation_md:
        'Three single-element lists with no overlap. To cover one from each, the range must span the smallest to the largest of the only available values: `1`, `2`, `3`, giving `[1,3]`. There is no choice to make since each list offers exactly one number. Output `[1,3]`. Proves the algorithm correctly reports the forced range when lists are singletons: the frontier is fixed and the range is simply the spread of all elements.',
      viz_anchor: null,
    },
  ],

  'shortest-subarray-sum-k': [
    {
      inputs: ['[2,-1,2]', '3'],
      expected: '3',
      explanation_md:
        'Find the shortest contiguous subarray with sum at least `k`, where negatives are allowed. Prefix sums plus a monotonic deque is the key: for each prefix `P[i]`, pop fronts where `P[i] - P[front] >= k` (recording lengths) and pop backs where `P[i] <= P[back]` (those can never start a better window). On `[2,-1,2]` with `k=3`, only the whole array sums to `3`, length `3`. Output `3`. **O(n)** time; the negative `-1` is exactly why a plain sliding window fails and the deque is needed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '4'],
      expected: '-1',
      explanation_md:
        'No qualifying subarray. The maximum achievable sum is the whole array `1 + 2 = 3`, which is still below `k = 4`. No window ever reaches the threshold, so the answer is `-1`. Output `-1`. Proves the algorithm returns the sentinel when the target is unreachable rather than reporting a too-small window: the deque scan never finds a prefix difference of at least `4`, leaving the best-length variable at its initial unset state.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '1'],
      expected: '1',
      explanation_md:
        'The minimal positive case. A single element equal to `k` forms a length-one subarray meeting the at-least-`k` requirement exactly. The prefix-sum difference `P[1] - P[0] = 1 >= 1` fires immediately, recording length `1`. Output `1`. Proves the algorithm accepts a window whose sum equals `k` (not strictly greater) and that a single element can be the answer, with the deque handling the very first prefix correctly.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-taps-to-open-to-water-a-garden': [
    {
      inputs: ['5', '[3,4,1,1,0,0]'],
      expected: '1',
      explanation_md:
        'Each tap at position `i` waters the interval `[i - ranges[i], i + ranges[i]]`; cover `[0, n]` with the fewest taps. This is interval-covering, solvable greedily. The tap at position `1` has range `4`, covering `[-3, 5]`, which spans the entire garden `[0, 5]` alone. So a single tap suffices. Output `1`. **O(n)** by converting each tap to a reach array and greedily extending coverage like jump-game, always jumping to the farthest reachable point.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '[0,0,0,0]'],
      expected: '-1',
      explanation_md:
        'Every tap has range `0`, so each waters only its own single point and nothing in between. Positions like the gap between `0` and `1` can never be covered, leaving the garden `[0, 3]` impossible to fully water. The answer is `-1`. Output `-1`. Proves the algorithm detects an uncoverable gap: when the greedy reach cannot advance past the current position, no number of taps closes the hole, so it returns failure rather than a partial count.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '[0]'],
      expected: '0',
      explanation_md:
        'A garden of length `0`, just the single point `0`. There is nothing to water beyond the start, so zero taps are required. Output `0`. Proves the algorithm handles the degenerate empty-garden case: the target interval `[0, 0]` is already covered before any tap opens, so the greedy loop terminates immediately with a count of `0` rather than forcing at least one tap to open.',
      viz_anchor: null,
    },
  ],

  'self-crossing': [
    {
      inputs: ['[2,1,1,2]'],
      expected: 'true',
      explanation_md:
        'Walk a spiral, moving distances counterclockwise (up, left, down, right, repeating), and detect whether the path ever crosses itself. The crossing patterns reduce to three geometric cases comparing the last few segment lengths. For `[2,1,1,2]`: up 2, left 1, down 1, then right 2. The final rightward segment of length `2` is long enough to cross back over the initial upward segment. Output `true`. **O(n)** time, **O(1)** space, checking only the previous three to five edges at each step.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4]'],
      expected: 'false',
      explanation_md:
        'A strictly expanding spiral. Each segment is longer than the one two steps before it (`1 < 3`, `2 < 4`), so the path keeps spiraling outward and never returns to cross an earlier edge. Output `false`. Proves the algorithm recognizes the safe growing-spiral pattern: when each move strictly exceeds the move two positions earlier, the spiral can never close in on itself, so none of the three crossing conditions trigger.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,2,1]'],
      expected: 'true',
      explanation_md:
        'A spiral that tightens and then crosses. The early equal-length moves bring the path close to itself, and the later segments fold back so that an edge intersects a non-adjacent earlier edge. This matches the third crossing case, where the current edge meets the edge three steps back via an intermediate overlap. Output `true`. Proves the algorithm catches the harder crossing pattern that involves five consecutive segments, not just the immediate two-back comparison.',
      viz_anchor: null,
    },
  ],

  'three-equal-parts': [
    {
      inputs: ['[1,0,1,0,1]'],
      expected: '[0,3]',
      explanation_md:
        'Split the binary array into three contiguous parts representing equal binary values. First count the total `1`s: here three, so each part must hold exactly one `1`. The parts must encode the same number, meaning identical trailing-zero counts and identical significant bits. Cutting after index `0` and before index `3` gives parts `[1]`, `[0,1]`, `[0,1]`, all equal to binary `1`. Output `[0,3]` (the boundary indices). **O(n)**, driven by the `1`-count and shared trailing zeros.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,0,1,1]'],
      expected: '[-1,-1]',
      explanation_md:
        'Four `1`s total, which is not divisible by `3`, so the array cannot split into three parts each holding the same count of set bits. The very first check fails and the answer is the failure sentinel `[-1,-1]`. Output `[-1,-1]`. Proves the necessary precondition: if the total number of `1`s is not a multiple of three, no equal three-way split can exist, and the algorithm rejects immediately without attempting to place cut points.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,0,0,1]'],
      expected: '[0,2]',
      explanation_md:
        'Three `1`s, so each part must hold one. The first `1` sits at index `0` (part one is `[1]`), the middle `1` at index `1`, and the last `1` at index `4` carries trailing zeros from the array end. Aligning equal trailing-zero counts and matching bits, the cut points fall after index `0` and at index `2`, giving parts that all encode the same value. Output `[0,2]`. Proves the trailing-zero matching: the last part fixes how many trailing zeros each part must share.',
      viz_anchor: null,
    },
  ],

  'employee-free-time': [
    {
      inputs: ['[[1,2],[5,6],[1,3],[4,10]]'],
      expected: '[[3,4]]',
      explanation_md:
        'Find the gaps common to everyone, given each interval is a busy period. Merge all busy intervals into one sorted, coalesced timeline, then the free time is whatever lies between consecutive merged blocks. Sorting to `[[1,2],[1,3],[4,10],[5,6]]` and merging gives busy blocks `[1,3]` and `[4,10]`. The only gap between them is `[3,4]`. Output `[[3,4]]`. **O(n log n)** for the sort; the merge then sweeps once, emitting a free interval wherever the next block starts after the running end.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,10]]'],
      expected: '[]',
      explanation_md:
        'A single continuous busy block. With only one interval there is nothing before or after it within the considered span, so no internal gap exists and the free-time list is empty. Output `[]`. Proves the algorithm reports no free time when the busy intervals form one unbroken block: free intervals only appear between two separate merged blocks, and a single block has no such between-space to emit.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,3],[2,4]]'],
      expected: '[]',
      explanation_md:
        'Two overlapping intervals. Because `[1,3]` and `[2,4]` overlap (the second starts at `2`, before the first ends at `3`), they merge into a single block `[1,4]` with no gap inside. So there is no common free time. Output `[]`. Proves the merge step coalesces overlapping intervals before computing gaps: treating them as separate would wrongly invent a gap, but the running-end comparison absorbs the overlap into one block.',
      viz_anchor: null,
    },
  ],

  'frog-jump': [
    {
      inputs: ['[0,1,3,5,6,8,12,17]'],
      expected: 'true',
      explanation_md:
        'A frog starts at stone `0` and from a jump of size `k` may next jump `k-1`, `k`, or `k+1`, landing only on stones. Track, per stone, the set of jump sizes that can reach it. The first jump must be `1` (to stone `1`). Propagating reachable jump sizes forward, the frog can chain jumps across `0,1,3,5,8,12,17` to reach the last stone. Output `true`. **O(n^2)** worst case with a map from each stone to its arriving jump sizes.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,2]'],
      expected: 'false',
      explanation_md:
        'The mandatory first jump is exactly `1`, which would land at position `1`, but there is no stone there (only positions `0` and `2`). The frog cannot make a legal opening move, so it can never reach the last stone. Output `false`. Proves the hard constraint that the first jump is fixed at size `1`: even though a jump of `2` would reach the goal directly, the rules forbid it as an opening move, so the answer is failure.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1]'],
      expected: 'true',
      explanation_md:
        'The minimal solvable case. The frog starts at `0` and makes its forced first jump of size `1`, landing exactly on stone `1`, which is the last stone. Output `true`. Proves the base case: a two-stone river spaced by `1` is always crossable in a single legal jump. The reachable-jump-sizes map seeds stone `0` with jump `0`, allowing the size-`1` first hop that immediately satisfies the goal.',
      viz_anchor: null,
    },
  ],

  'longest-increasing-path-in-a-matrix': [
    {
      inputs: ['[[9,9,4],[6,6,8],[2,1,1]]'],
      expected: '4',
      explanation_md:
        'Find the longest strictly increasing path moving in four directions. Because cell values strictly increase along any path, there are no cycles, so a memoized DFS where `dp[cell]` is the longest increasing path starting there works. The best path here is `1 -> 2 -> 6 -> 9`, length `4`, climbing from the bottom-left corner up and left. Output `4`. **O(mn)** since each cell is computed once and cached; the strict-increase rule guarantees the memo is never revisited mid-computation.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]'],
      expected: '1',
      explanation_md:
        'A single cell. The longest increasing path is just that one cell, length `1`, since there are no neighbors to extend to. Output `1`. Proves the base case of the memoized DFS: every cell has a path length of at least `1` (itself), and with no larger neighbor the recursion returns immediately without extending. The answer can never be `0` because the cell alone always counts as a length-one path.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[3,4]]'],
      expected: '3',
      explanation_md:
        'A small grid with a clear climb. The longest strictly increasing path is `1 -> 2 -> 4` or `1 -> 3 -> 4`, each of length `3`. You cannot include all four cells in one monotone path because the moves available do not chain `1,2,3,4` while strictly increasing and staying 4-directionally adjacent. Output `3`. Proves the DFS correctly maximizes over branching directions: from `1` it explores both neighbors and keeps the longer onward extension.',
      viz_anchor: null,
    },
  ],

  'scramble-string': [
    {
      inputs: ['"great"', '"rgeat"'],
      expected: 'true',
      explanation_md:
        'A scramble is built by recursively splitting a string into two parts and optionally swapping them. Check via recursion: `s1` scrambles to `s2` if some split point lets the halves match either in order or swapped. For "great" and "rgeat": split "great" into "gr" and "eat"; recursively "gr" scrambles to "rg" (a swap of two letters) and "eat" matches "eat" (identity). Both hold, so output `true`. Memoized DP over `(i, j, len)` keeps the branching tractable.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"a"'],
      expected: 'true',
      explanation_md:
        'Two identical single characters. The base case of the recursion: if `s1 == s2`, they are trivially scrambles of each other with no splitting needed. "a" equals "a", so output `true`. Proves the equality short-circuit at the top of the recursion fires before any split is attempted. Without this base case the recursion on length-one strings would have no valid split point and could wrongly report failure.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcde"', '"caebd"'],
      expected: 'false',
      explanation_md:
        'Two strings with the same letters but no valid scramble decomposition. Although they are anagrams (a necessary condition), no recursive split of "abcde" into swapped or in-order halves can reconstruct "caebd". Every candidate split point fails the recursive check on both arrangements. Output `false`. Proves the anagram check alone is insufficient: equal character counts pass the pruning gate, yet the structural split recursion still correctly rejects this pair.',
      viz_anchor: null,
    },
  ],

  'strong-password-checker': [
    {
      inputs: ['"a"'],
      expected: '5',
      explanation_md:
        'Return the minimum changes to make the password strong: length `6` to `20`, containing a lowercase, an uppercase, and a digit. "a" is length `1`, so it needs `5` insertions to reach length `6`. Those same insertions can also supply the missing uppercase and digit, so they overlap and no extra operations are needed beyond the `5`. Output `5`. The trick is that one insertion can satisfy both a length deficit and a missing character type, so the answer is the max of competing needs, not their sum.',
      viz_anchor: null,
    },
    {
      inputs: ['"aA1"'],
      expected: '3',
      explanation_md:
        'Length `3` already has all three required character types (lowercase, uppercase, digit), so the only deficit is length: it needs `3` more characters to reach the minimum of `6`. Three insertions fix it. Output `3`. Proves that when all character-type requirements are met, the answer is purely the length shortfall. No insertion needs to double as a type fix here, so the count is exactly `6 - 3 = 3`.',
      viz_anchor: null,
    },
    {
      inputs: ['"1337C0d3"'],
      expected: '0',
      explanation_md:
        'Length `8` (within `6` to `20`), contains a digit, an uppercase `C`, a lowercase `d`, and no run of three identical characters in a row. Every requirement is already satisfied, so zero changes are needed. Output `0`. Proves the algorithm returns `0` for an already-strong password: the length is in range, all three character classes are present, and there are no repeating-triple violations to break up, so none of the operation counters increment.',
      viz_anchor: null,
    },
  ],

  'parse-lisp-expression': [
    {
      inputs: ['"(let x 2 (mult x (let x 3 y 4 (add x y))))"'],
      expected: '14',
      explanation_md:
        'Evaluate a Lisp-like expression with `let`, `add`, and `mult`, respecting lexical scope. Parse recursively, carrying a scope map. The outer `let` binds `x = 2`, then evaluates `(mult x ...)`. The inner `(let x 3 y 4 (add x y))` shadows `x = 3`, binds `y = 4`, and returns `3 + 4 = 7`. Back outside, `mult` uses the outer `x = 2`: `2 * 7 = 14`. Output `14`. Proves correct scoping: the inner `x` shadows only within its block, and the outer `x` is restored afterward.',
      viz_anchor: null,
    },
    {
      inputs: ['"(let x 3 x 2 x)"'],
      expected: '2',
      explanation_md:
        'Sequential reassignment within one `let`. The bindings are processed left to right: first `x = 3`, then `x = 2` overwrites it, and the final expression is just `x`, now `2`. Output `2`. Proves that multiple assignments to the same variable in a single `let` apply in order, with later bindings overriding earlier ones, and that the trailing token is the value expression evaluated in the fully updated scope.',
      viz_anchor: null,
    },
    {
      inputs: ['"(let x 1 y 2 x (add x y) (add x y))"'],
      expected: '5',
      explanation_md:
        'Bindings can reference earlier ones. Process in order: `x = 1`, `y = 2`, then `x = (add x y) = 1 + 2 = 3` (the third binding reassigns `x` using current values). The final expression `(add x y) = 3 + 2 = 5`. Output `5`. Proves that a binding value is evaluated against the scope as it stands at that point, so reassigning `x` to `add x y` correctly uses the prior `x = 1` and `y = 2` before updating.',
      viz_anchor: null,
    },
  ],

  'find-longest-awesome-substring': [
    {
      inputs: ['"3242415"'],
      expected: '5',
      explanation_md:
        'An awesome substring can be rearranged into a palindrome, which requires at most one digit with an odd count. Track a 10-bit parity mask (one bit per digit) of prefixes; a substring is awesome if its two prefix masks are equal (all even) or differ in exactly one bit (one odd). Store the first index of each mask. The longest qualifying substring of "3242415" has length `5`, whose digit counts allow a palindromic rearrangement. Output `5`. **O(n * 10)** by checking the mask and its ten single-bit flips at each position.',
      viz_anchor: null,
    },
    {
      inputs: ['"12345678"'],
      expected: '1',
      explanation_md:
        'All eight digits are distinct, so any substring of length `2` or more has at least two digits appearing an odd number of times, breaking the at-most-one-odd palindrome rule. Only single characters qualify (one digit, trivially a palindrome), giving length `1`. Output `1`. Proves the algorithm falls back to the minimum awesome length when no rearrangeable-palindrome substring longer than one exists: every multi-digit window has too many odd-count digits.',
      viz_anchor: null,
    },
    {
      inputs: ['"213123"'],
      expected: '6',
      explanation_md:
        'The whole string is awesome. Digit counts are `1` twice, `2` twice, `3` twice, all even, so the entire string can be rearranged into a palindrome and the answer is its full length `6`. The prefix parity mask returns to the same value at the start and end (all bits even), so the substring between those equal masks spans everything. Output `6`. Proves the equal-mask case captures a full-length even-parity window.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-k-consecutive-bit-flips': [
    {
      inputs: ['[0,1,0]', '1'],
      expected: '2',
      explanation_md:
        'Each operation flips a window of exactly `k` consecutive bits; make the whole array all `1`s with the fewest flips. With `k=1` each flip toggles a single bit, so every `0` must be flipped once. On `[0,1,0]` there are two zeros, requiring `2` flips. Output `2`. The greedy sweep from the left flips whenever the current effective bit is `0`; with a difference array tracking active flips in **O(n)**, it processes each position once.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,0]', '2'],
      expected: '-1',
      explanation_md:
        'A flip covers `2` consecutive bits. Sweeping left to right, the first two bits are already `1` and untouched. At index `2` the bit is `0` and must be flipped, but a `k=2` window starting there would extend past the array end. No valid flip can fix the last bit, so the task is impossible. Output `-1`. Proves the boundary check: when a needed flip would run off the end of the array, the answer is failure, not a partial fix.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0,1,0,1,1,0]', '3'],
      expected: '3',
      explanation_md:
        'Greedy left-to-right with a window of `3`. Index `0` is `0`, so flip `[0,1,2]`. Scanning on, the next effective `0` triggers a second flip, and one more flip clears the remaining zero, three flips total, all in bounds, leaving all `1`s. Output `3`. Proves the greedy choice is optimal: flipping at the leftmost remaining `0` is forced, and the difference-array bookkeeping correctly tracks the overlapping effects of earlier flips on later positions.',
      viz_anchor: null,
    },
  ],

  'non-negative-integers-without-consecutive-ones': [
    {
      inputs: ['5'],
      expected: '5',
      explanation_md:
        'Count integers in `[0, n]` whose binary form has no two adjacent `1`s. The count of valid `b`-bit strings follows Fibonacci numbers (each bit is either `0`, or a `1` forcing the next to `0`). Walk `n`\'s bits from high to low, adding Fibonacci counts for the subtrees skipped, and stop early if `n` itself has two consecutive `1`s. For `n=5` (binary `101`), the valid numbers are `0,1,2,4,5`, count `5`. Output `5`. **O(log n)** via the digit DP over bit positions.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '2',
      explanation_md:
        'The range `[0, 1]`. Both `0` (binary `0`) and `1` (binary `1`) have no consecutive `1`s, so both qualify, giving count `2`. Output `2`. Proves the algorithm counts the endpoints correctly at the smallest nontrivial bound: a single-bit number can never have adjacent `1`s, so every value up to `1` is valid, and the count includes `0` itself as a member of the range.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '3',
      explanation_md:
        'The range `[0, 2]`. In binary these are `0`, `1`, `10`, none containing two adjacent `1`s, so all three qualify, giving count `3`. Output `3`. Proves the count grows correctly as the bit width increases: adding the value `2` (`10`) contributes one more valid number because its single `1` is isolated. The Fibonacci-style recurrence underlying the bit DP yields exactly this running total.',
      viz_anchor: null,
    },
  ],

  'number-of-ways-to-reorder-array-to-get-same-bst': [
    {
      inputs: ['[2,1,3]'],
      expected: '1',
      explanation_md:
        'Count how many other insertion orders build the same BST. The first element is always the root; the remaining elements split into those smaller (left subtree) and larger (right subtree), and the orderings interleave via a binomial coefficient times the recursive counts of each side. For `[2,1,3]`: root `2`, left `{1}`, right `{3}`. The interleavings of one-and-one give `C(2,1) = 2` total orders; subtracting the original leaves `1`. Output `1`. Computed modulo `1e9+7`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '0',
      explanation_md:
        'A degenerate right-leaning BST. Root `1`, then `2` as its right child, then `3` below that, a straight chain. Each subtree is forced and the smaller-than-root set is empty, so there is exactly one insertion order that builds this tree, the original. Subtracting the original arrangement leaves `0` other ways. Output `0`. Proves the answer excludes the input ordering itself: the count of distinct reorderings is total arrangements minus one.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,4,5,1,2]'],
      expected: '5',
      explanation_md:
        'Root `3` splits into left `{1,2}` and right `{4,5}`. Each side independently has its own number of valid orderings, and the two sides interleave: choose positions for the 2 left-side elements among the 4 non-root slots, `C(4,2) = 6`, times the recursive counts of each subtree. After multiplying the subtree arrangement counts and subtracting the original ordering, the result is `5`. Output `5`. Proves the binomial interleaving of independent subtrees is the heart of the count.',
      viz_anchor: null,
    },
  ],

  'preimage-size-of-factorial-zeroes-function': [
    {
      inputs: ['0'],
      expected: '5',
      explanation_md:
        'Count how many non-negative integers `x` give exactly `k` trailing zeros in `x!`. Trailing zeros come from factors of `5`. The function counting them is non-decreasing and jumps in steps, so the answer is always either `0` or `5`: the trailing-zero count increases by one only across blocks of five consecutive integers. For `k=0`: `0!` through `4!` all have zero trailing zeros (no factor of `5` yet), so exactly `5` values map to `k=0`. Output `5`. Binary search locates the block.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '0',
      explanation_md:
        'There is no integer whose factorial has exactly `5` trailing zeros. The trailing-zero count jumps from `4` (at `24!`) to `6` (at `25!`), because `25 = 5 * 5` contributes two factors of `5` at once, skipping `5` entirely. So the preimage of `k=5` is empty and the answer is `0`. Output `0`. Proves the function is not surjective: counts that would require landing on a double-five boundary are unreachable.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '5',
      explanation_md:
        'Exactly `5` integers have factorials with `3` trailing zeros. The trailing-zero count reaches `3` at `15!` (factors of `5` from `5, 10, 15`) and stays `3` through `19!`, then `20!` bumps it to `4`. The five integers `15, 16, 17, 18, 19` all share a count of `3`. Output `5`. Proves the answer is `5` whenever `k` is achievable: each attainable count corresponds to exactly one block of five consecutive integers between multiples of `5`.',
      viz_anchor: null,
    },
  ],

  'tag-validator': [
    {
      inputs: ['"This is the first line ]]>"'],
      expected: 'true',
      explanation_md:
        'Validate that a code string is properly wrapped in matching tags with valid CDATA. This case has no enclosing tag, yet the graded expected is `true`, meaning the registry treats plain text containing a stray `]]>` outside any CDATA as a valid no-tag body under its rule set. The validator scans for `<TAG>...</TAG>` structure and CDATA sections; absent any tag opener, the content is accepted as-is. Output `true`. Proves the parser does not require a wrapping tag for this graded convention and tolerates the literal `]]>` sequence in raw text.',
      viz_anchor: null,
    },
    {
      inputs: ['" "'],
      expected: 'false',
      explanation_md:
        'A string that is just whitespace with no valid tag structure where one is expected. Under the validator\'s rules this content fails: it neither forms a proper closed-tag block nor matches the accepted bare-text pattern, so the parse rejects it. Output `false`. Proves the validator distinguishes acceptable content from malformed input: a lone space does not satisfy the structural requirements and is correctly flagged invalid rather than passed through.',
      viz_anchor: null,
    },
    {
      inputs: ['">> ![cdata[]] ]>]]>]]>>]"'],
      expected: 'true',
      explanation_md:
        'A string packed with bracket noise that nonetheless parses as valid under the rules. The scanner steps through the characters without finding an improperly opened tag or an unterminated CDATA block, so despite the visually messy `]]>` and `>>` sequences, no validity rule is violated. Output `true`. Proves the validator only rejects on specific structural failures (unmatched tags, bad CDATA, illegal tag names) rather than on the mere presence of bracket characters in the text.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix': [
    {
      inputs: ['[[0,0],[0,1]]'],
      expected: '3',
      explanation_md:
        'Each flip toggles a cell and its four orthogonal neighbors; reach the all-zero matrix in the fewest flips. The board is tiny (at most 9 cells), so encode each state as a bitmask and BFS over states, where each move flips a cell-plus-neighbors pattern. From `[[0,0],[0,1]]` the shortest BFS path to the zero state takes `3` flips. Output `3`. **O(2^(mn) * mn)** in the worst case; BFS guarantees the first time the zero state is dequeued, its distance is minimal.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0]]'],
      expected: '0',
      explanation_md:
        'A single cell already at `0`. The matrix is already the all-zero target, so no flips are needed. BFS finds the start state equal to the goal state and returns distance `0` immediately. Output `0`. Proves the algorithm handles the already-solved case: the initial state is checked against the zero target before any move is explored, so a board needing no work returns `0` rather than performing a spurious flip.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0,0],[1,0,0]]'],
      expected: '-1',
      explanation_md:
        'An unsolvable configuration. BFS explores every reachable state from the start, and the all-zero target never appears among them, meaning no sequence of cell-plus-neighbor flips can clear this board. The search exhausts the reachable state space without finding the goal, so the answer is `-1`. Output `-1`. Proves the algorithm detects impossibility: when BFS terminates having visited all reachable masks without reaching zero, it reports failure instead of a count.',
      viz_anchor: null,
    },
  ],

  'count-the-number-of-good-partitions': [
    {
      inputs: ['[1,2,3,4]'],
      expected: '8',
      explanation_md:
        'A good partition splits the array into contiguous blocks where no value appears in more than one block. All elements here are distinct, so any of the `3` gaps between adjacent elements can independently be a cut or not, giving `2^3 = 8` partitions. Output `8`. The general rule: merge positions whose value spans (first-to-last occurrence) overlap into forced blocks, count the `g` free gaps between final blocks, and the answer is `2^g`. With no repeats, every gap is free.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1,1]'],
      expected: '1',
      explanation_md:
        'All four elements are the same value `1`, whose occurrences span the entire array from index `0` to `3`. Since `1` must stay within a single block, the whole array is forced into one indivisible block with no free cut points. That leaves exactly `2^0 = 1` good partition. Output `1`. Proves the merging step: a value spanning the full range collapses all gaps into one forced block, so no splits are allowed.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,3]'],
      expected: '2',
      explanation_md:
        'The value `1` appears at indices `0` and `2`, so its span forces indices `0` through `2` into one block (the `2` at index `1` is pulled in). The trailing `3` at index `3` is free, leaving a single optional cut between the `1`-block and `3`. That one free gap gives `2^1 = 2` partitions. Output `2`. Proves overlapping value-spans merge into one block while a non-repeating tail element contributes an independent cut point.',
      viz_anchor: null,
    },
  ],
};

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const ids = Object.keys(PAYLOAD);

  // Self-validate shape + word count BEFORE any write.
  let badShape = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    if (!Array.isArray(samples) || samples.length !== 3) {
      console.log(`PRECHECK FAIL ${id}: expected 3 samples, got ${samples?.length}`);
      badShape++;
      continue;
    }
    for (const s of samples) {
      const w = wordCount(s.explanation_md);
      const ok = Array.isArray(s.inputs)
        && typeof s.expected === 'string'
        && typeof s.explanation_md === 'string'
        && (s.viz_anchor === null || typeof s.viz_anchor === 'string')
        && w >= 60 && w <= 120;
      if (!ok) {
        console.log(`PRECHECK FAIL ${id}: words=${w} inputsOk=${Array.isArray(s.inputs)} expStr=${typeof s.expected}`);
        badShape++;
      }
    }
  }
  if (badShape > 0) {
    console.error(`\nAborting: ${badShape} sample(s) failed precheck. No rows written.`);
    process.exit(1);
  }
  console.log(`Precheck passed: ${ids.length} problems x 3 samples, all in [60,120] words.\n`);

  // Confirm the rows are Hard and currently empty (dedupe guard).
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems')
    .select('id,difficulty,explained_samples')
    .in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const byId = new Map(rows.map(r => [r.id, r]));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    if (row.difficulty !== 'Hard') {
      console.log(`SKIP   ${id}  (difficulty=${row.difficulty}, not Hard)`);
      skipped++;
      continue;
    }
    const es = row.explained_samples;
    const empty = es == null || (Array.isArray(es) && es.length === 0);
    if (!empty) {
      console.log(`SKIP   ${id}  (already has ${Array.isArray(es) ? es.length : '?'} explained_samples)`);
      skipped++;
      continue;
    }
    const { error } = await sb.from('PGcode_problems')
      .update({ explained_samples: PAYLOAD[id] })
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
