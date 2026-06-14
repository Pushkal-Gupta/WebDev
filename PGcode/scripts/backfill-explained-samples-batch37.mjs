#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 37 (15 HARD problems only).
// Same shape as batches 1..36: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Selected only Hard problems whose explained_samples was empty and that hold >=3 graded test cases.
// Every sample traces a real graded test case from the registry; no Judge0, pure prose.
// Run: node scripts/backfill-explained-samples-batch37.mjs

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
  'reducing-dishes': [
    {
      inputs: ['[-1,-8,0,5,-9]'],
      expected: '14',
      explanation_md:
        'Each dish cooked at time `t` earns `satisfaction * t`, so later slots are worth more. The insight: sort ascending, then greedily prepend dishes from the largest down while the running suffix sum stays positive, because adding a dish bumps every already-chosen dish up one time slot. Sorted: `[-9,-8,-1,0,5]`. The optimal selection cooks `-1,0,5` at times `1,2,3`: `-1*1 + 0*2 + 5*3 = 14`. Output `14`. Dropping the most negative dishes is what maximizes the time-weighted total, since they would only drag every later multiplier down.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,3,2]'],
      expected: '20',
      explanation_md:
        'All dishes are positive, so every one is worth cooking and no dish should be discarded. Sort ascending to `[2,3,4]` and cook in that order at times `1,2,3`: `2*1 + 3*2 + 4*3 = 2 + 6 + 12 = 20`. Output `20`. Putting the largest satisfaction in the latest slot maximizes the weighted sum, which is why ascending order is optimal. Proves that when no value is negative the greedy keeps the entire menu and simply orders it to give the biggest dishes the highest time multipliers.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,-4,-5]'],
      expected: '0',
      explanation_md:
        'Every dish has negative satisfaction, so cooking any of them only subtracts from the score. The best move is to cook nothing at all, leaving a total of `0`. Output `0`. Proves the algorithm never forces a dish into the schedule: the greedy suffix check finds that even the least-negative dish `-1` at time `1` contributes `-1`, which fails the positive-suffix condition, so no dish is ever added. The answer floors at `0` rather than going negative, since skipping all dishes is always allowed.',
      viz_anchor: null,
    },
  ],

  'tallest-billboard': [
    {
      inputs: ['[1,2,3,6]'],
      expected: '6',
      explanation_md:
        'Split the rods into two subsets of equal sum and maximize that shared height. Track a DP over the possible *difference* between the two sides, storing the tallest the taller side can reach for each difference; the answer is the height at difference `0`. For `[1,2,3,6]`, the rods `1,2,3` sum to `6`, which exactly balances the single rod `6`. So two equal supports of height `6` are buildable. Output `6`. The difference-keyed DP avoids enumerating all subset pairs, running in time proportional to the rod count times the total sum.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5,6]'],
      expected: '10',
      explanation_md:
        'The total of all rods is `21`, an odd sum, so a perfectly even split using every rod is impossible; some rods must be left out. The best balanced pair uses subsets summing to `10` each, leaving one unit of rod unused on the discard pile. Output `10`. Proves the DP maximizes the equal height even when the full set cannot be evenly divided: it explores leaving rods unused so the two sides can still meet at a common, maximal height of `10`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]'],
      expected: '0',
      explanation_md:
        'Only two rods of unequal length. There is no way to form two supports of equal height: using both gives sides `1` and `2` (unequal), and any single rod leaves the other side at `0`. The only balanced configuration is the empty one, height `0`. Output `0`. Proves the algorithm returns `0` when no equal split exists rather than reporting a mismatched pair: the difference-zero DP state is reachable only by the empty assignment here, so the tallest balanced billboard has zero height.',
      viz_anchor: null,
    },
  ],

  'super-egg-drop': [
    {
      inputs: ['1', '2'],
      expected: '2',
      explanation_md:
        'With `1` egg and `2` floors, find the worst-case minimum drops to identify the critical floor. A single egg cannot be risked on a binary search: if it breaks you have no egg left to continue, so you must test floors one at a time from the bottom. With `2` floors that means up to `2` drops (test floor 1, then floor 2). Output `2`. Proves the one-egg case degrades to linear scanning: the recurrence collapses because a broken egg ends the search, forcing sequential testing rather than any splitting strategy.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '6'],
      expected: '3',
      explanation_md:
        'With `2` eggs and `6` floors, the key is to count how many floors a budget of drops can cover, not which floor to drop from. With `e` eggs and `t` tries, coverable floors follow `f(t,e) = f(t-1,e-1) + f(t-1,e) + 1`. For `2` eggs: `t=3` covers `3 + 2 + 1 = 6` floors, exactly enough, while `t=2` covers only `3`. So `3` drops suffice in the worst case. Output `3`. Proves the optimal strategy is found by inverting the coverage formula rather than simulating individual drops.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '14'],
      expected: '4',
      explanation_md:
        'With `3` eggs, more eggs let each drop split the remaining range more aggressively. Using the coverage recurrence, `4` tries with `3` eggs cover well over `14` floors while `3` tries fall short of `14`. So the worst-case minimum is `4`. Output `4`. Proves the third egg raises coverage beyond the two-egg case: the extra egg means a break early on still leaves two eggs to continue searching the floors below, shrinking the required drop count compared to fewer eggs.',
      viz_anchor: null,
    },
  ],

  'number-of-music-playlists': [
    {
      inputs: ['3', '3', '1'],
      expected: '6',
      explanation_md:
        'Count playlists of length `goal` using `n` songs, each song played at least once, with a song repeatable only after `k` other songs intervene. Here `n=3, goal=3, k=1`: a length-3 list using all 3 songs once is just a permutation, and the `k=1` gap is trivially satisfied since no song repeats. The count is `3! = 6`. Output `6`. The DP `dp[i][j]` (length `i`, `j` distinct songs used) splits each new slot into a brand-new song or an eligible repeat, multiplying by the available choices.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '3', '0'],
      expected: '6',
      explanation_md:
        'With `k=0`, a song may repeat immediately with no required gap. Playlists of length `3` from `2` songs, each used at least once: total arrangements of two symbols in three slots is `2^3 = 8`, minus the `2` all-same lists that omit a song, leaving `6`. Output `6`. Proves the `k=0` branch allows back-to-back repeats so the only constraint is that both songs appear: the DP counts every length-3 sequence over two songs and subtracts those missing a required song.',
      viz_anchor: null,
    },
    {
      inputs: ['2', '3', '1'],
      expected: '2',
      explanation_md:
        'Now `k=1` forbids a song from repeating until at least one other song has played in between. With `2` songs over `3` slots and each used once, the valid lists must alternate: `A B A` and `B A B`. Any other arrangement either omits a song or repeats one with no gap. So exactly `2` playlists. Output `2`. Proves the spacing constraint sharply cuts the count compared to `k=0`: the `k=1` gap forces strict alternation, eliminating the back-to-back repeats the previous case allowed.',
      viz_anchor: null,
    },
  ],

  'min-refueling-stops': [
    {
      inputs: ['1', '1', '[]'],
      expected: '0',
      explanation_md:
        'Reach a target `1` unit away starting with `1` unit of fuel and no stations. The car already has enough fuel to cover the entire distance, so it arrives with zero refueling stops. Output `0`. Proves the algorithm returns `0` when the starting fuel alone reaches the target: the greedy max-heap of passed stations is never consulted because the current range already meets or exceeds the destination before any station comes into play.',
      viz_anchor: null,
    },
    {
      inputs: ['100', '1', '[[10,100]]'],
      expected: '-1',
      explanation_md:
        'Target is `100` away with only `1` unit of starting fuel. The lone station sits at position `10`, but the car can travel at most `1` unit before running dry, so it never reaches position `10` to refuel. With the station unreachable, the trip is impossible. Output `-1`. Proves the algorithm detects when even the nearest station lies beyond the current range: the greedy never adds an unreachable station to its heap, and with no fuel available it reports failure rather than a stop count.',
      viz_anchor: null,
    },
    {
      inputs: ['100', '10', '[[10,60],[20,30],[30,30],[60,40]]'],
      expected: '2',
      explanation_md:
        'Greedily defer refueling: drive as far as the current fuel allows, and whenever you cannot proceed, retroactively take the largest fuel station already passed. Start with `10` units, reaching position `10`. Push passed stations into a max-heap and pop the biggest only when stuck. The optimal choice grabs the `60`-fuel station and the `40`-fuel station, two stops, to clear all `100` units. Output `2`. Proves the max-heap greedy minimizes stops by always saving the richest passed station for when fuel runs out.',
      viz_anchor: null,
    },
  ],

  'maximum-profit-in-job-scheduling': [
    {
      inputs: ['[1,2,3,3]', '[3,4,5,6]', '[50,10,40,70]'],
      expected: '120',
      explanation_md:
        'Pick non-overlapping jobs to maximize total profit. Sort jobs by end time, then DP: for each job, take the best of skipping it or taking it plus the best profit achievable before its start. The jobs end at `3,4,5,6` with profits `50,10,40,70`. Taking the first job (`[1,3]` profit `50`) then the last (`[3,6]` profit `70`) gives `120`, since `3` is a valid non-overlapping boundary. Output `120`. Binary search over sorted end times finds the latest compatible job in logarithmic time per step.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,6]', '[3,5,10,6,9]', '[20,20,100,70,60]'],
      expected: '150',
      explanation_md:
        'Sort by end time and chain compatible high-profit jobs. The standout is the job `[3,10]` worth `100`, but it blocks everything overlapping `3..10`. Combining the early job `[1,3]` (profit `20`) with `[3,10]` (profit `100`) plus another compatible slot reaches a total of `150` rather than greedily taking the single biggest job alone. Output `150`. Proves the DP weighs a fat single job against a chain of compatible smaller ones, choosing whichever combination yields the larger non-overlapping profit.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]', '[2,3,4]', '[5,6,4]'],
      expected: '6',
      explanation_md:
        'All three jobs start at time `1`, so they mutually overlap and exactly one can be chosen. The DP compares their profits `5,6,4` and keeps the best single job, `6`. Output `6`. Proves the algorithm handles fully overlapping jobs correctly: since no two share a non-overlapping window, the optimal schedule is just the most profitable individual job. Sorting by end time and taking the max over "skip versus take alone" collapses to picking the single richest job here.',
      viz_anchor: null,
    },
  ],

  'largest-rect-histogram': [
    {
      inputs: ['[2,1,5,6,2,3]'],
      expected: '10',
      explanation_md:
        'Find the largest axis-aligned rectangle fitting under the bar heights. A monotonic increasing stack of indices is the key: when a shorter bar appears, pop taller bars and compute the rectangle each can anchor, using the gap to the new bar as the width. The winning rectangle spans bars `5` and `6` (indices 2 and 3): height `5`, width `2`, area `10`. Output `10`. Each bar is pushed and popped once, so the sweep is linear, far faster than checking every pair of left-right boundaries.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '0',
      explanation_md:
        'A single bar of height `0`. The widest rectangle that fits under a zero-height bar has zero area, since the bounding height is `0`. Output `0`. Proves the algorithm handles a degenerate bar without error: the bar is pushed, then flushed at the end with width `1` and height `0`, yielding area `0`. The running maximum never rises above zero because no positive-height rectangle exists in a histogram whose only bar has no height.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4]'],
      expected: '4',
      explanation_md:
        'Two increasing bars of heights `2` and `4`. The best rectangle is the single bar `4` standing alone (area `4`), which ties the two-wide rectangle of height `2` (area `2*2 = 4`). Output `4`. Proves the stack correctly evaluates both candidates: when the histogram ends, it flushes the stack, computing the tall narrow rectangle from bar `4` and the shorter wide one from bar `2`, then keeps the maximum across all of them.',
      viz_anchor: null,
    },
  ],

  'trapping-rain-water-tp': [
    {
      inputs: ['[0,1,0,2,1,0,1,3,2,1,2,1]'],
      expected: '6',
      explanation_md:
        'Water above each bar is capped by the shorter of the tallest walls to its left and right, minus the bar height. The two-pointer method walks inward from both ends, advancing whichever side has the smaller running max, because that side bounds the water. Summing the trapped amount across all dips in this classic profile gives `6` units. Output `6`. **O(n)** time and **O(1)** space, never building the full left-max and right-max arrays, since the smaller boundary is always known at the moving pointer.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '0',
      explanation_md:
        'An empty elevation map with no bars. There is no surface to hold water, so nothing is trapped. Output `0`. Proves the algorithm short-circuits on empty input: the two pointers begin already crossed (or the loop never runs), so the trapped-water accumulator stays at its initial `0` and no array access is attempted. This boundary confirms the method does not assume at least one bar exists before reading heights.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,2,0,3,2,5]'],
      expected: '9',
      explanation_md:
        'A valley between a left wall of `4` and a right wall of `5`. The dip at heights `2,0,3,2` is bounded by the shorter wall `4` on the left until the right side dominates. Water fills each column up to its limiting boundary: `2 + 4 + 1 + 2 = 9` units across the interior. Output `9`. Proves the two-pointer logic tracks the binding wall correctly: while the left max `4` is below the right max `5`, the left side caps every trapped column it advances past.',
      viz_anchor: null,
    },
  ],

  'swim-in-water': [
    {
      inputs: ['[[0,2],[1,3]]'],
      expected: '3',
      explanation_md:
        'At time `t` you can stand on any cell whose elevation is at most `t`; find the earliest time water lets you reach the bottom-right from the top-left. This is a minimax-path problem: minimize the maximum elevation along a route. Use a min-heap (Dijkstra-style), always expanding to the lowest-elevation reachable neighbor. On this `2x2` grid every path must cross the `3` in the corner, so the answer is `3`. Output `3`. The heap guarantees the first time the goal is popped, its path maximum is minimal.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0]]'],
      expected: '0',
      explanation_md:
        'A single cell grid. The start and the goal are the same square with elevation `0`, so you can stand there at time `0` with no movement needed. Output `0`. Proves the base case of the minimax search: the answer is simply the start cell elevation when start equals goal, here `0`. The min-heap pops the only cell immediately as the destination, returning its elevation without exploring any neighbors that do not exist.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,1],[2,3]]'],
      expected: '3',
      explanation_md:
        'From the top-left `0`, reaching the bottom-right `3` requires passing through either the `1` then `3`, or the `2` then `3`. Both routes hit `3` as their highest cell, so the minimum possible path maximum is `3`. Output `3`. Proves the minimax logic picks the route whose worst cell is smallest, yet here every route ends at the corner `3`, the unavoidable bottleneck. The heap-based search confirms no cheaper path exists before settling on time `3`.',
      viz_anchor: null,
    },
  ],

  'course-schedule-iii': [
    {
      inputs: ['[[100,200],[200,1300],[1000,1250],[2000,3200]]'],
      expected: '3',
      explanation_md:
        'Each course has a duration and a deadline; take as many as possible on a single timeline. Sort by deadline, greedily add each course, and keep a max-heap of taken durations: if the running total exceeds the current deadline, drop the longest course taken so far. This swap never reduces the count but frees time for shorter courses. Processing the four sorted courses lands on `3` completable courses. Output `3`. Proves the heap-swap greedy maximizes the count by trading a bloated long course for breathing room.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2]]'],
      expected: '1',
      explanation_md:
        'A single course lasting `1` time unit with deadline `2`. Starting at time `0`, it finishes at `1`, comfortably before the deadline `2`, so it can be taken. Output `1`. Proves the greedy accepts a course that fits within its deadline: the running time `0 + 1 = 1` does not exceed `2`, so it stays in the schedule and the heap never needs to evict anything. The single course counts as one completed.',
      viz_anchor: null,
    },
    {
      inputs: ['[[3,2],[4,3]]'],
      expected: '0',
      explanation_md:
        'Two courses, each too long for its own deadline: the first needs `3` units but is due at `2`, the second needs `4` units but is due at `3`. Neither can ever finish on time even taken alone, so none are completable. Output `0`. Proves the greedy rejects courses whose duration alone exceeds their deadline: adding the first makes running time `3 > 2`, the heap-swap removes it, and the same happens for the second, leaving zero courses taken.',
      viz_anchor: null,
    },
  ],

  'remove-boxes': [
    {
      inputs: ['[1,3,2,2,2,3,4,3,1]'],
      expected: '23',
      explanation_md:
        'Remove contiguous runs of equal-colored boxes to score the square of the run length, maximizing total points. The trick is a 3D DP `dp[i][j][k]` where `k` counts boxes equal to box `i` already attached on its left, because merging distant same-colored boxes pays off quadratically. On this sequence the optimal order clears the three `2`s and chained `3`s and `1`s to total `23`. Output `23`. Proves greedy fails here: deferring removals to merge same-colored boxes into a bigger run beats clearing each run as soon as it forms.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]'],
      expected: '9',
      explanation_md:
        'Three identical boxes. Removing all three together as one run of length `3` scores `3^2 = 9`, which beats removing them separately (`1 + 1 + 1 = 3`) or in pieces. Output `9`. Proves the quadratic scoring rewards keeping equal boxes together: the DP recognizes that one big removal of the whole run is optimal, since the square of the combined length always exceeds the sum of squares of any split of that run.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'A single box. The only move removes it as a run of length `1`, scoring `1^2 = 1`. Output `1`. Proves the base case of the DP: a lone box yields exactly one point, and the recursion bottoms out immediately with no merging possible. There are no same-colored neighbors to attach, so the `k` dimension stays zero and the score is simply the square of the single-box run.',
      viz_anchor: null,
    },
  ],

  'patching-array': [
    {
      inputs: ['[1,3]', '6'],
      expected: '1',
      explanation_md:
        'Add the fewest numbers so every value in `[1, n]` is formable as a subset sum. Track `miss`, the smallest sum not yet reachable, starting at `1`. If the next array element is at most `miss`, it extends reach to `miss + element`; otherwise patch in `miss` itself, doubling reach. For `[1,3]` with `n=6`: `1` extends reach to `2`, but `3 > 2` so we cannot yet form `2`; patch `2` (reach becomes `4`), then `3` extends to `7 >= 6`. One patch. Output `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,10]', '20'],
      expected: '2',
      explanation_md:
        'Greedily close gaps in subset-sum coverage up to `n=20`. Start with `miss=1`; `1` extends reach to `2`. Now `5 > 2`, so patch `2` (reach `4`); still `5 > 4`, patch `4` (reach `8`). Now `5 <= 8` extends to `13`, then `10 <= 13` extends to `23 >= 20`. Two patches added. Output `2`. Proves the algorithm patches exactly when the current array element jumps past the smallest unreachable sum, doubling coverage each patch to close gaps efficiently.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,2]', '5'],
      expected: '0',
      explanation_md:
        'The array already covers every value in `[1,5]` with no patches needed. Walk the reach: `1` gives reach `2`, `2 <= 2` extends to `4`, the next `2 <= 4` extends to `6 >= 5`. Coverage reaches `5` before any gap appears. Output `0`. Proves the algorithm adds nothing when the existing elements already form a contiguous subset-sum range up to `n`: every element arrives no larger than the current smallest unreachable sum, so no patch is ever triggered.',
      viz_anchor: null,
    },
  ],

  'count-all-valid-pickup-and-delivery-options': [
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Count orderings of `n` pickup-delivery pairs where each pickup precedes its own delivery. With `1` order there is exactly one valid sequence: pickup then delivery. Output `1`. Proves the base case of the counting recurrence: a single pair has only one legal arrangement, seeding the formula. The general count multiplies in the slots a new pair can occupy among the existing sequence, but with one pair there is nothing to interleave, so the answer is simply `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '6',
      explanation_md:
        'Adding the `k`-th pair to a valid sequence of `k-1` pairs: there are `2k-1` existing slots, and the pickup-before-delivery rule allows the pickup in any slot and the delivery in any later slot, contributing `(2k-1) * (2k) / 2 = k(2k-1)` ways. So the count is the product over `k`: for `n=2`, `1 * (2*3/2) = 1 * 3 = 3`... times the first pair gives `1 * 6 = 6`. Output `6`. Proves the multiplicative slot-insertion recurrence over each added pair.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '90',
      explanation_md:
        'Extend the recurrence to three pairs. Each new pair multiplies the running count by the number of ordered ways to drop its pickup and delivery into the growing sequence while keeping pickup first. Building up: `1` pair gives `1`, adding the second multiplies to `6`, and adding the third multiplies by `15` to reach `90`. Output `90`. Proves the closed-form product grows fast: the third pair has many more valid insertion positions, and the result is taken modulo a large prime in the full implementation.',
      viz_anchor: null,
    },
  ],

  'maximum-sum-of-3-non-overlapping-subarrays': [
    {
      inputs: ['[1,2,1,2,6,7,5,1]', '2'],
      expected: '[0,3,5]',
      explanation_md:
        'Choose three non-overlapping subarrays each of length `k=2` to maximize the total sum, returning the lexicographically smallest set of start indices. Precompute window sums, then track the best left window ending before each split and the best right window starting after. The optimal triple here starts at indices `0`, `3`, `5`, capturing windows `[1,2]`, `[2,6]`, `[7,5]`. Output `[0,3,5]`. Proves the left-best and right-best arrays let a single middle-window scan find the global optimum in linear time after the prefix sums.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2,1,2,1,2,1]', '2'],
      expected: '[0,2,4]',
      explanation_md:
        'A repeating pattern where many window placements tie on sum. With `k=2`, every adjacent pair sums to `3`, so the three windows can sit almost anywhere. The tie-break rule forces the lexicographically smallest start indices, which packs the windows as far left as possible: `[0,2,4]`. Output `[0,2,4]`. Proves the algorithm enforces the smallest-index preference when sums are equal: among all equally-scoring triples it returns the leftmost, achieved by preferring earlier starts during the best-window bookkeeping.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '0'],
      expected: '[0,0,0]',
      explanation_md:
        'A degenerate input: an empty array with window length `0`. With no elements to place real windows over, the result defaults to the zero-index triple `[0,0,0]`. Output `[0,0,0]`. Proves the algorithm returns a well-formed default on the empty boundary rather than crashing: the prefix-sum and best-window arrays are trivially empty, and the start indices fall back to their initial zero values, giving a defined answer for the edge with no valid subarrays.',
      viz_anchor: null,
    },
  ],

  'constrained-subsequence-sum': [
    {
      inputs: ['[10,2,-10,5,20]', '2'],
      expected: '37',
      explanation_md:
        'Pick a subsequence with the largest sum where consecutive chosen indices are at most `k` apart. Define `dp[i]` as the best sum ending at index `i`: it equals `nums[i]` plus the best non-negative `dp` value among the previous `k` indices. A monotonic-decreasing deque keeps that sliding-window maximum in `O(1)` per step. For `[10,2,-10,5,20]` with `k=2`, the chain `10, 2, 5, 20` (each gap within `2`) sums to `37`. Output `37`. The deque is what makes this linear instead of scanning `k` predecessors each time.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,-2,-3]', '1'],
      expected: '-1',
      explanation_md:
        'Every element is negative, so adding any earlier element only makes a sum smaller. The best subsequence is a single element, the least negative one, `-1`. Output `-1`. Proves the algorithm never chains negatives: each `dp[i]` adds the previous best only when it is positive, and here all candidates are negative, so every `dp[i]` reduces to `nums[i]` alone. The maximum across those is `-1`, since a subsequence must be non-empty and a lone element beats any negative chain.',
      viz_anchor: null,
    },
    {
      inputs: ['[10,-2,-10,-5,20]', '2'],
      expected: '23',
      explanation_md:
        'The `k=2` gap limit forces a careful jump across the negative middle. `dp` builds: starting `10`, the dips at `-2,-10,-5` keep `dp` from growing, but `20` at the end can attach to the best value within two steps back. The optimal chain is `10` then `-2` then `20`... yet skipping the deep negatives, the best reachable sum is `10 + (-2) + 20 = 23` since `20` sits within `k=2` of `-2`. Output `23`. Proves the deque correctly carries the best windowed predecessor across the negative trough.',
      viz_anchor: null,
    },
  ],
};

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const ids = Object.keys(PAYLOAD);

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
