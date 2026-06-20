#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples - batch 32.
// Focus area: high-frequency simulation / counting / greedy / string problems
// not covered by batches 29-31.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch32.mjs
//
// SUSPECT CASES (flagged, not fixed here):
// - repeated-string-match test_cases[2]: inputs ["",""] expected "null" - malformed placeholder.
// - reordered-power-of-2 test_cases[2]: inputs ["0"] expected "null" - n=0 violates n>=1 constraint.
// - count-subarrays-with-k-distinct-integers: SKIPPED from this batch - cases carry 3 inputs
//   for a 2-param problem and case 0 does not match exactly-K-distinct semantics.

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
  'divide-a-string-into-groups-of-size-k': [
    {
      inputs: ['"abcdefghi"', '3', '"x"'],
      expected: '["abc","def","ghi"]',
      explanation_md:
        'Length 9 divides evenly by k = 3, so no fill is needed. 1) Slice s[0..3) = "abc". 2) Slice s[3..6) = "def". 3) Slice s[6..9) = "ghi". The loop index jumps by k each iteration (0, 3, 6) and stops at 9 = len(s). Result: ["abc","def","ghi"].',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdefghij"', '3', '"x"'],
      expected: '["abc","def","ghi","jxx"]',
      explanation_md:
        'Length 10, k = 3: 10 mod 3 = 1, so the last group starts with a single real character. 1) s[0..3) = "abc". 2) s[3..6) = "def". 3) s[6..9) = "ghi". 4) s[9..10) = "j" - only 1 of 3 slots filled, so append fill = "x" twice: "jxx". Result: ["abc","def","ghi","jxx"]. The fill count is always k - (len mod k) when len mod k != 0, here 3 - 1 = 2.',
      viz_anchor: null,
    },
    {
      inputs: ['"ab"', '5', '"z"'],
      expected: '["abzzz"]',
      explanation_md:
        'Edge case: k larger than the whole string. One group is created from s[0..2) = "ab", then padded with k - 2 = 3 fill characters: "abzzz". Result: ["abzzz"]. A loop written as `for i in range(0, len(s), k)` handles this without any special-casing - it runs exactly once.',
      viz_anchor: null,
    },
  ],

  'divide-intervals-into-minimum-number-of-groups': [
    {
      inputs: ['[[5,10],[6,8],[1,5],[2,3],[1,10]]'],
      expected: '3',
      explanation_md:
        'The answer equals the maximum number of intervals alive at any single point (intervals are inclusive). Sweep with +1 events at each start and -1 events at each end+1: +1@1, +1@1, +1@2, -1@4 (end of [2,3]), +1@5, +1@6, -1@6 (end of [1,5]), -1@9, -1@11, -1@11. Running count by time: t=1 -> 2 ([1,5],[1,10]); t=2 -> 3 (add [2,3]); t=4 -> 2; t=5 -> 3 ([1,5],[1,10],[5,10] all contain 5). Peak = 3. Three groups suffice: {[1,5],[5,10]} cannot share (5 overlaps), so e.g. G1=[1,5],[6,8]; G2=[2,3],[5,10]; G3=[1,10]. Answer 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,3],[5,6],[8,10],[11,13]]'],
      expected: '1',
      explanation_md:
        'All four intervals are pairwise disjoint: 3 < 5, 6 < 8, 10 < 11. The sweep count never exceeds 1 - each interval ends strictly before the next begins. One group holds everything. Answer 1. This is the floor of the problem: the answer is always at least 1 and exactly 1 iff sorted intervals never touch.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[2,3]]'],
      expected: '2',
      explanation_md:
        'Inclusive-endpoint trap: [1,2] and [2,3] BOTH contain the point 2, so they overlap and cannot share a group. Sweep: +1@1, +1@2 -> count 2; the -1 for [1,2] fires at 3 (end+1), after the second start. Peak = 2. Answer 2. Treating these as non-overlapping (the half-open assumption) is the classic wrong answer here - the end event must be processed at end+1, not at end.',
      viz_anchor: null,
    },
  ],

  'divide-intervals-min-groups': [
    {
      inputs: ['[[5,10],[6,8],[1,5],[2,3],[1,10]]'],
      expected: '3',
      explanation_md:
        'The answer equals the maximum number of intervals alive at any single point (intervals are inclusive). Sweep with +1 events at each start and -1 events at end+1. Starts sorted: 1, 1, 2, 5, 6; ends+1: 4, 6, 9, 11, 11. Running count: after starts at 1,1 -> 2; start at 2 -> 3; end of [2,3] at 4 -> 2; start of [5,10] at 5 -> 3; end of [1,5] at 6 and start of [6,8] at 6 keep it at 3. Peak = 3. Concretely: G1=[1,5],[6,8]; G2=[2,3],[5,10]; G3=[1,10]. Answer 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,3],[5,6],[8,10],[11,13]]'],
      expected: '1',
      explanation_md:
        'All four intervals are pairwise disjoint: 3 < 5, 6 < 8, 10 < 11. The running overlap count never exceeds 1, so a single group holds all of them. Answer 1. Equivalent min-heap view: sort by start, and every new interval reuses the same group because the heap-top end is always smaller than the next start.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[2,3]]'],
      expected: '2',
      explanation_md:
        'Inclusive-endpoint trap: [1,2] and [2,3] both contain the point 2, so they conflict. Sweep: +1@1 (count 1), +1@2 (count 2), -1@3, -1@4. Peak = 2. Answer 2. With a min-heap keyed by end: [2,3] arrives while heap top is end=2, and since 2 >= start 2 (touching counts as overlap), a second group opens.',
      viz_anchor: null,
    },
  ],

  'excel-column-number': [
    {
      inputs: ['A'],
      expected: '1',
      explanation_md:
        'Single letter: the column number is just the letter index. A maps to 1 (computed as ord("A") - ord("A") + 1 = 1). Running total: result = 0 * 26 + 1 = 1. Answer 1.',
      viz_anchor: null,
    },
    {
      inputs: ['AB'],
      expected: '28',
      explanation_md:
        'Base-26 accumulation, left to right. 1) "A": result = 0 * 26 + 1 = 1. 2) "B": result = 1 * 26 + 2 = 28. Answer 28. This mirrors how "12" in base 10 is 1 * 10 + 2 - except the digit range is 1..26 instead of 0..9, which is why there is no zero digit and no special-casing.',
      viz_anchor: null,
    },
    {
      inputs: ['ZY'],
      expected: '701',
      explanation_md:
        'Largest two-letter neighborhood. 1) "Z": result = 0 * 26 + 26 = 26. 2) "Y": result = 26 * 26 + 25 = 676 + 25 = 701. Answer 701. Sanity check from the other side: "ZZ" = 26 * 26 + 26 = 702, and ZY is exactly one before ZZ - 701. The bijective-base-26 system has no 0, so Z carries the value 26, not 25.',
      viz_anchor: null,
    },
  ],

  'find-the-minimum-area-to-cover-all-ones-i': [
    {
      inputs: ['[[0,1,0],[1,0,1]]'],
      expected: '6',
      explanation_md:
        'The minimal rectangle is the tight bounding box of all 1s. Scan every cell, tracking min/max row and column of 1s. Ones sit at (0,1), (1,0), (1,2). minRow = 0, maxRow = 1, minCol = 0, maxCol = 2. Height = 1 - 0 + 1 = 2, width = 2 - 0 + 1 = 3. Area = 2 * 3 = 6. Answer 6. The rectangle cannot shrink: dropping column 0 loses (1,0), dropping column 2 loses (1,2).',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,0],[0,0]]'],
      expected: '1',
      explanation_md:
        'A single 1 at (0,0). minRow = maxRow = 0 and minCol = maxCol = 0, so the bounding box is exactly one cell: height = 0 - 0 + 1 = 1, width = 1, area = 1. Answer 1. The +1 in both dimensions is the off-by-one to watch - forgetting it returns 0 here.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,1],[1,1]]'],
      expected: '4',
      explanation_md:
        'Every cell is a 1, so the bounding box is the whole grid. minRow = 0, maxRow = 1, minCol = 0, maxCol = 1. Height = 2, width = 2, area = 4. Answer 4. This is the upper bound for any 2x2 input - the bounding box never exceeds rows * cols.',
      viz_anchor: null,
    },
  ],

  'maximum-number-of-pairs-in-array': [
    {
      inputs: ['[1,3,2,1,3,2,2]'],
      expected: '[3,1]',
      explanation_md:
        'Count each value, then each value contributes count // 2 pairs and count % 2 leftovers. Counts: 1 -> 2, 3 -> 2, 2 -> 3. Pairs: 2//2 + 2//2 + 3//2 = 1 + 1 + 1 = 3. Leftovers: 2%2 + 2%2 + 3%2 = 0 + 0 + 1 = 1. Sanity check: 2 * 3 pairs + 1 leftover = 7 = array length. Answer [3,1].',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: '[1,0]',
      explanation_md:
        'One value with count 2: pairs = 2 // 2 = 1, leftovers = 2 % 2 = 0. Both elements are consumed by the single pair. Answer [1,0].',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[0,1]',
      explanation_md:
        'Single element: count of 0 is 1, so pairs = 1 // 2 = 0 and leftovers = 1 % 2 = 1. Answer [0,1]. Value 0 is a legal array element here - a frequency map keyed by value handles it identically to any other number; code that treats 0 as falsy/missing breaks on this case.',
      viz_anchor: null,
    },
  ],

  'min-add-parens-valid': [
    {
      inputs: ['"())"'],
      expected: '1',
      explanation_md:
        'Track open = unmatched "(" and need = unmatched ")". 1) "(": open = 1. 2) ")": matches, open = 0. 3) ")": open is 0, so this is an orphan - need = 1. Final: open = 0, need = 1, answer = 0 + 1 = 1. Insert one "(" before the orphan to get "(())" or "()()" - both valid with a single addition.',
      viz_anchor: null,
    },
    {
      inputs: ['"((("'],
      expected: '3',
      explanation_md:
        '1) "(": open = 1. 2) "(": open = 2. 3) "(": open = 3. No ")" ever arrives, so need stays 0. Answer = open + need = 3 + 0 = 3. Three closers must be appended: "((()))" becomes valid. Each unmatched "(" requires exactly one insertion - there is no cheaper repair.',
      viz_anchor: null,
    },
    {
      inputs: ['"()"'],
      expected: '0',
      explanation_md:
        'Already valid. 1) "(": open = 1. 2) ")": matches, open = 0. Final open = 0, need = 0, answer 0. The two counters generalize: open counts "(" still waiting for a partner, need counts ")" that arrived with no partner available - the answer is always their sum.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-operations-to-make-all-array-elements-equal-to-1': [
    {
      inputs: ['[2,6,3,4]'],
      expected: '4',
      explanation_md:
        'No 1s exist, so first manufacture one, then spread it. A subarray has gcd 1 iff its elements are jointly coprime; the shortest such window costs (length - 1) operations to collapse into a single 1. Windows of length 2: gcd(2,6) = 2, gcd(6,3) = 3, gcd(3,4) = 1 - found one, length 2, cost 1 (replace 3 with gcd(3,4) = 1, giving [2,6,1,4]). Then a single 1 converts each remaining element in one operation each: n - 1 = 3 more. Total = 1 + 3 = 4. Answer 4.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,10,6,14]'],
      expected: '-1',
      explanation_md:
        'Every element is even, so the gcd of the whole array is 2. The operation replaces an element with a gcd of two existing elements, and gcd of even numbers is always even - no sequence of operations can ever produce an odd value, let alone 1. Check: gcd(2,10) = 2, gcd(gcd(2,10),6) = 2, gcd(2,14) = 2. Overall gcd = 2 != 1, therefore impossible. Answer -1. The feasibility test is exactly: overall gcd must equal 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '2',
      explanation_md:
        'A 1 already exists at index 0, so no window search is needed - the answer is n minus the count of existing 1s. 1) gcd(1,2) = 1 replaces the 2: [1,1,3]. 2) gcd(1,3) = 1 replaces the 3: [1,1,1]. Total 2 operations = 3 - 1. Each adjacent gcd with a 1 produces a 1, so the existing 1 sweeps outward one element per operation.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-operations-to-make-array-xor-equal-to-k': [
    {
      inputs: ['[2,1,3,4]', '1'],
      expected: '2',
      explanation_md:
        'Each operation flips one bit of one element, which flips exactly that bit of the total XOR. So the answer is the popcount of (current XOR) ^ k. 1) Current XOR: 2 ^ 1 = 3; 3 ^ 3 = 0; 0 ^ 4 = 4. 2) Diff = 4 ^ 1 = 5 = binary 101. 3) Popcount(101) = 2. Answer 2. Concretely: flip bit 2 of element 4 (4 -> 0) and flip bit 0 of element 2 (2 -> 3); new XOR = 3 ^ 1 ^ 3 ^ 0 = 1 = k.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,0,2,0]', '0'],
      expected: '0',
      explanation_md:
        'Current XOR: 2 ^ 0 = 2; 2 ^ 2 = 0; 0 ^ 0 = 0. Diff = 0 ^ 0 = 0, popcount 0. The target already holds. Answer 0. The pairing 2 ^ 2 = 0 does the work - duplicate values cancel in XOR regardless of position.',
      viz_anchor: null,
    },
    {
      inputs: ['[4]', '7'],
      expected: '2',
      explanation_md:
        'Single element: XOR of the array is just 4 = binary 100. Diff = 4 ^ 7 = 100 ^ 111 = 011 = 3, popcount = 2. Answer 2. Both flips land on the same element (4 -> 5 -> 7); the formula does not care which elements receive the flips, only how many bits disagree.',
      viz_anchor: null,
    },
  ],

  'minimum-operations-to-make-the-array-increasing': [
    {
      inputs: ['[1,1,1]'],
      expected: '3',
      explanation_md:
        'Greedy: each element must exceed the previous final value, and raising it to exactly prev + 1 is always optimal. 1) prev = 1 (index 0, free). 2) Index 1 holds 1 <= 1, raise to 2: cost 2 - 1 = 1, prev = 2. 3) Index 2 holds 1 <= 2, raise to 3: cost 3 - 1 = 2, prev = 3. Total = 0 + 1 + 2 = 3. Answer 3.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,2,4,1]'],
      expected: '14',
      explanation_md:
        '1) prev = 1. 2) 5 > 1: free, prev = 5. 3) 2 <= 5: raise to 6, cost 6 - 2 = 4, prev = 6. 4) 4 <= 6: raise to 7, cost 7 - 4 = 3, prev = 7. 5) 1 <= 7: raise to 8, cost 8 - 1 = 7, prev = 8. Total = 4 + 3 + 7 = 14. Answer 14. Raising any element higher than prev + 1 only inflates the floor for everything after it - the greedy minimum is exact.',
      viz_anchor: null,
    },
    {
      inputs: ['[8]'],
      expected: '0',
      explanation_md:
        'A single element is vacuously strictly increasing - there is no adjacent pair to violate the order. The loop body never runs. Answer 0.',
      viz_anchor: null,
    },
  ],

  'nearest-exit-from-entrance-in-maze': [
    {
      inputs: ['[["+","+",".","+"],[".",".",".","+"],["+","+","+","."]]', '[1,2]'],
      expected: '1',
      explanation_md:
        'BFS from the entrance; an exit is any empty border cell other than the entrance itself. Start (1,2), distance 0. Expand neighbors: (0,2) = "." and sits on row 0 - a border cell that is not the entrance, so it is an exit at distance 1. BFS guarantees the first exit dequeued is the nearest. Answer 1. The other neighbors (1,1) and (1,3) never get a chance to matter.',
      viz_anchor: null,
    },
    {
      inputs: ['[["+","+","+"],[".",".","."],["+","+","+"]]', '[1,0]'],
      expected: '2',
      explanation_md:
        'The entrance (1,0) IS a border cell, but the entrance never counts as an exit. BFS layer 1: only open neighbor is (1,1) - interior, not an exit. Layer 2: from (1,1) reach (1,2) = "." on the last column - a border cell, distance 2. Answer 2. Skipping the entrance-is-not-an-exit rule returns 0 here, the canonical wrong answer for this problem.',
      viz_anchor: null,
    },
    {
      inputs: ['[[".","+"]]', '[0,0]'],
      expected: '-1',
      explanation_md:
        'Entrance (0,0) is the only empty cell; its sole in-grid neighbor (0,1) is a wall "+". The BFS queue empties after the start cell with no exit ever found. Answer -1. The single-row grid also exercises the bounds checks - three of the four neighbor moves fall off the grid immediately.',
      viz_anchor: null,
    },
  ],

  'repeated-string-match': [
    {
      inputs: ['"abcd"', '"cdabcdab"'],
      expected: '3',
      explanation_md:
        'b (length 8) must appear as a contiguous substring of a repeated. Lower bound: ceil(8 / 4) = 2 copies. 1) "abcd" * 2 = "abcdabcd" - "cdabcdab" is not inside (the copy would need to start at index 2 and run to index 9, past the end). 2) "abcd" * 3 = "abcdabcdabcd" - indices 2..9 spell "cdabcdab". Found. Answer 3. The general bound: only ceil(|b|/|a|) and ceil(|b|/|a|) + 1 copies ever need checking, because one extra copy covers any straddling start offset.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"aa"'],
      expected: '2',
      explanation_md:
        '1) "a" * 1 = "a" - too short to contain "aa". 2) "a" * 2 = "aa" - exact match. Answer 2. This is the minimal-copies floor in action: ceil(|b|/|a|) = ceil(2/1) = 2 copies needed purely by length, and 2 suffices.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abcabc"'],
      expected: '2',
      explanation_md:
        'b is exactly two whole copies of a, no straddle. 1) "abc" * 2 = "abcabc" - equals b, substring found at index 0. Answer 2. The +1 fallback copy is unnecessary here; it only matters when b starts mid-copy, as in the "cdabcdab" case.',
      viz_anchor: null,
    },
  ],

  'reveal-cards-in-increasing-order': [
    {
      inputs: ['[17,13,11,2,3,5,7]'],
      expected: '[2,13,3,11,5,17,7]',
      explanation_md:
        'Simulate the reveal process on INDICES, assigning sorted cards. Sorted deck: [2,3,5,7,11,13,17]. Index queue: [0,1,2,3,4,5,6]. Each round: pop an index, assign the next sorted card, then move the following index to the back. 1) res[0]=2, move 1 back -> [2,3,4,5,6,1]. 2) res[2]=3, move 3 back -> [4,5,6,1,3]. 3) res[4]=5, move 5 back -> [6,1,3,5]. 4) res[6]=7, move 1 back -> [3,5,1]. 5) res[3]=11, move 5 back -> [1,5]. 6) res[1]=13, move 5 back -> [5]. 7) res[5]=17. Result [2,13,3,11,5,17,7].',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1000]'],
      expected: '[1,1000]',
      explanation_md:
        'Sorted: [1,1000]. Index queue [0,1]. 1) Pop 0, res[0] = 1; move index 1 to the back - queue is [1] either way. 2) Pop 1, res[1] = 1000. Result [1,1000]. With two cards the reveal order is: show position 0, cycle position 1 to the bottom, show position 1 - so ascending order requires the smaller card in front, which is what the simulation produced.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'One card: the index queue holds [0], the single sorted card 1 lands at res[0], and the "move next to back" step is a no-op on a queue of size 1. Result [1]. Deque code must guard the move-to-back when the queue is empty after the pop - this case exercises that guard.',
      viz_anchor: null,
    },
  ],

  'capacity-to-ship-packages': [
    {
      inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      expected: '15',
      explanation_md:
        'Binary search the capacity between max(weights) = 10 and sum = 55; greedily pack each day. Feasibility at cap 15: day1 [1,2,3,4,5] = 15; day2 [6,7] = 13 (adding 8 makes 21 > 15); day3 [8] (8+9=17 > 15); day4 [9] (9+10=19 > 15); day5 [10]. Exactly 5 days - feasible. At cap 14: day1 [1,2,3,4] = 10 (+5 = 15 > 14); day2 [5,6] = 11; day3 [7] (7+8=15 > 14); day4 [8] (8+9=17); day5 [9] (9+10=19); day6 [10] - 6 days, infeasible. So 15 is minimal. Answer 15.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,2,2,4,1,4]', '3'],
      expected: '6',
      explanation_md:
        'Search range [max=4, sum=16]. At cap 6: day1 [3,2] = 5 (adding 2 makes 7 > 6); day2 [2,4] = 6; day3 [1,4] = 5. Exactly 3 days - feasible. At cap 5: day1 [3,2] = 5; day2 [2] (2+4=6 > 5); day3 [4,1] = 5; day4 [4] - 4 days, infeasible. So the minimum is 6. Answer 6. Order is fixed; packages cannot be reordered, which is why greedy fill in given order is correct for the feasibility check.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,1,1]', '4'],
      expected: '3',
      explanation_md:
        'Search range [max=3, sum=8]. At cap 3: day1 [1,2] = 3; day2 [3] = 3; day3 [1,1] = 2 - 3 days <= 4, feasible. Capacity cannot go below max(weights) = 3, because the package of weight 3 must fit on some single day. So the lower bound is itself feasible. Answer 3. This case shows why the binary-search floor is max(weights), not 1.',
      viz_anchor: null,
    },
  ],

  'detect-pattern-of-length-m-repeated-k-or-more-times': [
    {
      inputs: ['[1,2,4,4,4,4]', '1', '3'],
      expected: 'true',
      explanation_md:
        'Need a length-1 pattern repeated 3+ times consecutively. Check the streak trick: count positions where arr[i] == arr[i - m]. With m = 1: i=3 (4==4) streak 1; i=4 streak 2; i=5 streak 3. A streak of m * (k - 1) = 1 * 2 = 2 already certifies k = 3 repetitions; streak reached 3 >= 2. The pattern [4] appears at indices 2,3,4,5 - four consecutive repetitions. Answer true.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2,1,1,1,3]', '2', '2'],
      expected: 'true',
      explanation_md:
        'Need a length-2 pattern repeated twice consecutively, i.e. a window of 4 where arr[i] == arr[i-2] holds across it. Indices 0..3 = [1,2,1,2]: arr[2]==arr[0] (1==1) and arr[3]==arr[1] (2==2) - streak hits m * (k-1) = 2. Pattern [1,2] repeats twice back-to-back. Answer true. Note [2,1] at indices 1..4 = [2,1,2,1] also works; any one witness suffices.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,1,2,1,3]', '2', '3'],
      expected: 'false',
      explanation_md:
        'Need a length-2 pattern repeated 3 times consecutively = 6 matching positions, i.e. a run where arr[i] == arr[i-2] for m * (k-1) = 4 consecutive i. Check: i=2 (1==1) streak 1; i=3 (2==2) streak 2; i=4 (1==1) streak 3; i=5 (3==2?) no - streak resets to 0. Max streak 3 < 4. The third repetition would need indices 4..5 to be [1,2], but they are [1,3]. Answer false.',
      viz_anchor: null,
    },
  ],

  'final-array-state-after-k-multiplication-operations-i': [
    {
      inputs: ['[2,1,3,5,6]', '5', '2'],
      expected: '[8,4,6,5,6]',
      explanation_md:
        'Each operation finds the FIRST minimum and multiplies it by 2. 1) min 1 at index 1: [2,2,3,5,6]. 2) min 2 - first at index 0: [4,2,3,5,6]. 3) min 2 at index 1: [4,4,3,5,6]. 4) min 3 at index 2: [4,4,6,5,6]. 5) min 4 - first at index 0: [8,4,6,5,6]. Result [8,4,6,5,6]. Ties break by lowest index, which is why step 2 hits index 0 rather than index 1.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '3', '4'],
      expected: '[16,8]',
      explanation_md:
        '1) min 1 at index 0: [4,2]. 2) min 2 at index 1: [4,8]. 3) min 4 at index 0: [16,8]. Result [16,8]. The minimum alternates between the two slots because multiplying by 4 leapfrogs the other value each time.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]', '2', '3'],
      expected: '[45]',
      explanation_md:
        'Single element: it is the minimum every round. 1) 5 * 3 = 15: [15]. 2) 15 * 3 = 45: [45]. Result [45] = 5 * 3^k. With one element the simulation collapses to a single power - a useful sanity check for the loop bounds.',
      viz_anchor: null,
    },
  ],

  'find-the-least-frequent-digit': [
    {
      inputs: ['1553322'],
      expected: '1',
      explanation_md:
        'Count digit frequencies in 1553322: 1 -> 1, 5 -> 2, 3 -> 2, 2 -> 2. The minimum frequency is 1, achieved only by digit 1. Answer 1. A 10-slot count array indexed by digit handles this in one pass over the decimal string.',
      viz_anchor: null,
    },
    {
      inputs: ['723344511'],
      expected: '2',
      explanation_md:
        'Frequencies in 723344511: 7 -> 1, 2 -> 1, 3 -> 2, 4 -> 2, 5 -> 1, 1 -> 2. Minimum frequency is 1, shared by digits {7, 2, 5}. The tie-break returns the SMALLEST such digit: min(7, 2, 5) = 2. Answer 2. Scanning digits 0..9 in ascending order and keeping the first strict improvement implements the tie-break for free.',
      viz_anchor: null,
    },
    {
      inputs: ['10'],
      expected: '0',
      explanation_md:
        'Frequencies in 10: 1 -> 1, 0 -> 1. Both digits tie at frequency 1; the smallest digit wins: 0. Answer 0. Digit 0 is a legitimate winner - initializing the "best digit" to 0 with frequency infinity (rather than skipping zero-count digits incorrectly) keeps this case correct.',
      viz_anchor: null,
    },
  ],

  'find-the-maximum-divisibility-score': [
    {
      inputs: ['[2,9,15,50]', '[5,3,7,2]'],
      expected: '2',
      explanation_md:
        'Score of a divisor = how many nums it divides. Divisor 5: divides 15, 50 -> score 2. Divisor 3: divides 9, 15 -> score 2. Divisor 7: divides none -> 0. Divisor 2: divides 2, 50 -> score 2. Max score is 2, achieved by divisors {5, 3, 2}; the tie-break takes the SMALLEST divisor: 2. Answer 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,7,9,3,9]', '[5,2,3]'],
      expected: '3',
      explanation_md:
        'Divisor 5: divides nothing -> 0. Divisor 2: divides 4 -> 1. Divisor 3: divides 9, 3, 9 -> 3 (the duplicate 9 counts twice). Unique max score 3 belongs to divisor 3. Answer 3. Duplicates in nums are counted per occurrence, not per distinct value - collapsing nums to a set breaks this case.',
      viz_anchor: null,
    },
    {
      inputs: ['[20,14,21,10]', '[10,16,20]'],
      expected: '10',
      explanation_md:
        'Divisor 10: divides 20, 10 -> score 2. Divisor 16: divides none -> 0. Divisor 20: divides 20 -> score 1. Max score 2 is unique to divisor 10. Answer 10. The strict comparison matters: update the best only when score > best score, or when scores tie and the divisor is smaller.',
      viz_anchor: null,
    },
  ],

  'find-the-maximum-length-of-valid-subsequence-ii': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '5',
      explanation_md:
        'Valid means every consecutive pair in the subsequence has the same (a + b) mod k. Take the whole array: sums 1+2=3, 2+3=5, 3+4=7, 4+5=9 - all odd, all 1 mod 2. Length 5. Answer 5. DP formulation: dp[r][x] = longest valid subsequence with pair-sum residue r ending in an element of residue x mod k; each num with residue x updates dp[r][x] = dp[r][(r - x) mod k] + 1 for every r.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,4,2,3,1,4]', '3'],
      expected: '4',
      explanation_md:
        'Subsequence [1,4,1,4] (indices 0,1,4,5): sums 5, 5, 5 - all 2 mod 3. Length 4. No length-5 subsequence works: a fixed pair-residue r forces elements to alternate between two residue classes x and (r - x) mod 3, and the available residues are 1,1,2,0,1,1 - the best alternation 1,(1),1,(1) uses residue pairs (1,1) with r = 2, capped at the four elements of residue 1. Answer 4.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]', '1'],
      expected: '3',
      explanation_md:
        'k = 1: every sum mod 1 equals 0, so ANY subsequence is valid and the whole array wins. Length 3. Answer 3. In the DP this shows up as a single residue class x = 0 and r = 0, with dp growing by 1 per element - a good degenerate check that the table dimensions handle k = 1.',
      viz_anchor: null,
    },
  ],

  'maximum-number-of-occurrences-of-a-substring': [
    {
      inputs: ['"aababcaab"', '2', '3', '4'],
      expected: '2',
      explanation_md:
        'Key reduction: if a substring of length maxSize occurs t times, its length-minSize prefix occurs at least t times - so only minSize = 3 windows need checking. Slide a window of 3 over "aababcaab": "aab"(0), "aba"(1), "bab"(2), "abc"(3), "bca"(4), "caa"(5), "aab"(6). Frequencies: "aab" -> 2, others -> 1. Distinct-letter check: "aab" has 2 distinct <= maxLetters 2. Best count 2. Answer 2.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaa"', '1', '3', '3'],
      expected: '2',
      explanation_md:
        'Windows of size 3 over "aaaa": "aaa" at index 0 and "aaa" at index 1 - occurrences may OVERLAP. Frequency of "aaa" = 2; distinct letters 1 <= 1. Answer 2. Counting only non-overlapping occurrences (floor(4/3) = 1) is the classic wrong answer; substring occurrence counting always allows overlap.',
      viz_anchor: null,
    },
    {
      inputs: ['"abab"', '2', '2', '3'],
      expected: '2',
      explanation_md:
        'Windows of size minSize = 2: "ab"(0), "ba"(1), "ab"(2). Frequencies: "ab" -> 2, "ba" -> 1. Both have 2 distinct letters <= maxLetters 2. Best 2. Answer 2. Checking maxSize = 3 windows is provably unnecessary: any length-3 candidate occurring twice would force its length-2 prefix to occur twice as well, so the maximum over minSize windows dominates.',
      viz_anchor: null,
    },
  ],

  'maximum-number-of-operations-with-the-same-score-i': [
    {
      inputs: ['[3,2,1,4,5]'],
      expected: '2',
      explanation_md:
        'Each operation removes the first two elements; every operation must produce the same score as the first. 1) Remove 3, 2: score 5, array [1,4,5]. 2) Remove 1, 4: score 5 - matches, array [5]. 3) Only one element remains; no further operation possible. Total 2. Answer 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,3,3,4,1,3,2,2,3]'],
      expected: '2',
      explanation_md:
        '1) Remove 1, 5: score 6, rest [3,3,4,1,3,2,2,3]. 2) Remove 3, 3: score 6 - matches, rest [4,1,3,2,2,3]. 3) Next pair 4, 1: score 5 != 6 - stop immediately. Total 2. Answer 2. The loop condition is `i + 1 < n and nums[i] + nums[i+1] == target`; four more elements remain unused because one mismatched pair ends the game.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,3]'],
      expected: '1',
      explanation_md:
        'Exactly one pair exists. Remove 5, 3: score 8, array empty. The first operation defines the target and trivially matches it. Total 1. Answer 1. Minimum n is 2 per constraints, so the answer is always at least 1.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-operations-to-move-all-balls-to-each-box': [
    {
      inputs: ['"110"'],
      expected: '[1,1,3]',
      explanation_md:
        'Balls sit at indices 0 and 1. answer[i] = sum of |i - j| over ball positions j. answer[0] = |0-0| + |0-1| = 1. answer[1] = |1-0| + |1-1| = 1. answer[2] = |2-0| + |2-1| = 2 + 1 = 3. Result [1,1,3]. The O(n) version replaces the double loop with two prefix sweeps carrying (ballsSeen, runningCost) left-to-right and right-to-left.',
      viz_anchor: null,
    },
    {
      inputs: ['"001011"'],
      expected: '[11,8,5,4,3,4]',
      explanation_md:
        'Balls at indices 2, 4, 5. answer[0] = 2 + 4 + 5 = 11. answer[1] = 1 + 3 + 4 = 8. answer[2] = 0 + 2 + 3 = 5. answer[3] = 1 + 1 + 2 = 4. answer[4] = 2 + 0 + 1 = 3. answer[5] = 3 + 1 + 0 = 4. Result [11,8,5,4,3,4]. The minimum (3 at index 4) lands at the median ball position, as expected for sum-of-absolute-distances.',
      viz_anchor: null,
    },
    {
      inputs: ['"10"'],
      expected: '[0,1]',
      explanation_md:
        'One ball at index 0. answer[0] = 0 (the ball is already there); answer[1] = |1 - 0| = 1. Result [0,1]. Single-ball strings make the cost array a pure distance ramp from the ball - a quick correctness check for the two-pass prefix version.',
      viz_anchor: null,
    },
  ],

  'palindrome-partitioning-iv': [
    {
      inputs: ['"abcbdd"'],
      expected: 'true',
      explanation_md:
        'Need three non-empty palindromic pieces. Try cut points (i, j): piece1 = s[0..i), piece2 = s[i..j), piece3 = s[j..). With i = 1, j = 4: "a" (palindrome), "bcb" (palindrome - b, c, b reads the same reversed), "dd" (palindrome). All three check out. Answer true. Precomputing isPal[l][r] with the standard interval DP makes each (i, j) probe O(1), giving O(n^2) total.',
      viz_anchor: null,
    },
    {
      inputs: ['"bcbddxy"'],
      expected: 'false',
      explanation_md:
        'Every split fails. The first piece must be a palindromic prefix: candidates are "b" and "bcb". Case "b": remainder "cbddxy" must split into two palindromes - its palindromic prefixes are only "c", leaving "bddxy" which is not a palindrome (b != y). Case "bcb": remainder "ddxy" - palindromic prefixes "d" and "dd"; remainders "dxy" (d != y) and "xy" (x != y) both fail. No (i, j) works. Answer false.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"'],
      expected: 'true',
      explanation_md:
        'Minimum-length input: the only possible split is "a" | "a" | "a", and each single character is trivially a palindrome. Answer true. Length 3 is the floor for this problem (three non-empty pieces), and every length-3 string answers true, because every 1-character piece is a palindrome.',
      viz_anchor: null,
    },
  ],

  'reordered-power-of-2': [
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'n = 1 is already 2^0. Its digit multiset is {1}; the only permutation is "1" itself, which is a power of two. Answer true. The digit-signature method: compare sorted digits of n against sorted digits of every power of two up to 10^9 (there are only 30) - sorted("1") matches sorted(str(2^0)).',
      viz_anchor: null,
    },
    {
      inputs: ['10'],
      expected: 'false',
      explanation_md:
        'Digit multiset {1, 0}. Permutations: "10" = 10 (not a power of two) and "01" - rejected because reordering must not produce a leading zero. No power of two has digit multiset {0, 1}: the two-digit powers are 16, 32, 64 and none contains a 0. Answer false. The leading-zero rule is handled for free by the signature method, since signatures are only generated FROM actual powers of two.',
      viz_anchor: null,
    },
    {
      inputs: ['46'],
      expected: 'true',
      explanation_md:
        'Digit multiset {4, 6}. Permutations: 46 (not a power of two) and 64 = 2^6 - a power of two. Answer true. Signature check: sorted("46") = "46" and sorted("64") = "46" - equal multisets, so the answer follows without enumerating permutations, which matters when n has 9 digits and 9! permutations.',
      viz_anchor: null,
    },
  ],

  'restore-finishing-order': [
    {
      inputs: ['[3,1,2,5,4]', '[1,3,4]'],
      expected: '[3,1,4]',
      explanation_md:
        'Keep the elements of order that belong to friends, preserving order’s sequence. Friend set {1, 3, 4}. Scan order: 3 - in set, keep; 1 - keep; 2 - skip; 5 - skip; 4 - keep. Result [3,1,4]. Note the output follows the FINISHING order, not the friends array order - [1,3,4] would be wrong.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,4,5,3,2]', '[2,5]'],
      expected: '[5,2]',
      explanation_md:
        'Friend set {2, 5}. Scan order: 1 - skip; 4 - skip; 5 - keep; 3 - skip; 2 - keep. Result [5,2]. Friend 5 finished ahead of friend 2, so it appears first even though 2 < 5 numerically - the filter is a stable pass over order, never a sort.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,1]', '[1,2]'],
      expected: '[2,1]',
      explanation_md:
        'Every racer is a friend. The filter keeps everything, so the answer is order itself: [2,1]. This pins down the semantics: even with friends listed ascending as [1,2], the output mirrors the race result, confirming the friends array carries membership only, not ordering.',
      viz_anchor: null,
    },
  ],

  'super-palindromes': [
    {
      inputs: ['"4"', '"1000"'],
      expected: '4',
      explanation_md:
        'A super-palindrome is a palindrome whose square root is also a palindrome. Enumerate palindromic roots r and test r^2 in [4, 1000]. r = 2: 4 - palindrome, in range (count 1). r = 3: 9 - palindrome (count 2). r = 11: 121 - palindrome (count 3). r = 22: 484 - palindrome (count 4). r = 33: 1089 > 1000, stop region. Roots like 4..9 give 16, 25, 36, 49, 64, 81 - none palindromic. Total 4. Answer 4. Enumerating roots (up to 10^9 squares means roots below ~31623) keeps the search tiny.',
      viz_anchor: null,
    },
    {
      inputs: ['"1"', '"2"'],
      expected: '1',
      explanation_md:
        'Range [1, 2]. r = 1: 1^2 = 1 - palindrome, in range (count 1). r = 2: 4 > 2, out of range. Total 1. Answer 1. The bounds arrive as strings because they can reach 10^18; parse to integers before comparing, and note both endpoints are inclusive.',
      viz_anchor: null,
    },
    {
      inputs: ['"1"', '"100"'],
      expected: '3',
      explanation_md:
        'Range [1, 100]. Palindromic roots: r = 1 -> 1 (palindrome, count 1); r = 2 -> 4 (count 2); r = 3 -> 9 (count 3); r = 4..9 -> 16, 25, 36, 49, 64, 81 - squares not palindromic; r = 11 -> 121 > 100. Total 3. Answer 3. Both conditions are required: 26^2 = 676 is a palindrome but 26 is not, so 676 would not count even if in range.',
      viz_anchor: null,
    },
  ],

  'swap-for-longest-repeated-character-substring': [
    {
      inputs: ['"ababa"'],
      expected: '3',
      explanation_md:
        'Group runs: a(1) b(1) a(1) b(1) a(1). Total count of "a" is 3. Best move: bridge two single-a runs across one b by swapping that b with the third a - swap s[1] = "b" with s[4] = "a" to get "aaabb", a run of 3 a’s. Bridge formula: a(1) + a(1) separated by exactly one char, plus 1 because a spare a exists elsewhere = 3, capped at total count 3. Answer 3. The cap min(bridged + 1, total count) prevents claiming 4 a’s when only 3 exist.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaabaaa"'],
      expected: '6',
      explanation_md:
        'Runs: a(3) b(1) a(3); count of "a" = 6. The two a-runs are separated by exactly one b, so swapping that b with an a from OUTSIDE the bridge would be ideal - but every a is inside the two runs. Bridge value = 3 + 3 = 6, plus 1 only if a spare a exists elsewhere: total count 6 = 3 + 3, no spare, so the swap takes one a from a run end and the merged run is 6. min(3 + 3 + 1, 6) = 6. Answer 6.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaaa"'],
      expected: '5',
      explanation_md:
        'A single run a(5) and no other characters. No swap can extend it - any swap exchanges two equal characters, leaving the string unchanged. The answer is the run length itself: min(5 + 1, count 5) = 5. Answer 5. The min-with-total-count cap is exactly what stops the formula from reporting 6 here.',
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
