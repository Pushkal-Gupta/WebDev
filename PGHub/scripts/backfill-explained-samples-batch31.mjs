#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples - batch 31.
// Focus area: greedy fundamentals (exchange argument, sort-then-pick, counting).
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch31.mjs

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
  "activity-selection": [
    {
      "inputs": ["[[1,2],[3,4],[0,6],[5,7],[8,9],[5,9]]"],
      "expected": "4",
      "explanation_md": "Sort by END time: [1,2], [3,4], [0,6], [5,7], [8,9], [5,9]. Greedy rule: always take the activity that finishes earliest, then skip everything that starts before it ends. 1) Take [1,2], last_end = 2. 2) [3,4] starts at 3 >= 2 -> take, last_end = 4. 3) [0,6] starts at 0 < 4 -> skip. 4) [5,7] starts at 5 >= 4 -> take, last_end = 7. 5) [8,9] starts at 8 >= 7 -> take, last_end = 9. 6) [5,9] starts at 5 < 9 -> skip. Count = 4. The exchange argument: any optimal schedule can swap its first activity for the earliest-finishing one without losing a slot.",
      "viz_anchor": null
    },
    {
      "inputs": ["[[1,3],[2,4],[3,5]]"],
      "expected": "2",
      "explanation_md": "Sort by end: [1,3], [2,4], [3,5]. 1) Take [1,3], last_end = 3. 2) [2,4] starts at 2 < 3 -> overlap, skip. 3) [3,5] starts at 3 >= 3 -> take (touching endpoints do not overlap), last_end = 5. Count = 2. The >= comparison is the detail that matters here: an activity may begin exactly when the previous one ends. Sorting by START instead would also pick [1,3] first here, but start-sorting fails in general — end-sorting is the provably correct key.",
      "viz_anchor": null
    },
    {
      "inputs": ["[[1,2]]"],
      "expected": "1",
      "explanation_md": "Single activity. Sorted list = [[1,2]]. Take it, last_end = 2, nothing left. Count = 1. The loop structure handles this with zero special-casing: initialize count = 0 and last_end = -infinity, take any activity whose start >= last_end. The first activity always qualifies.",
      "viz_anchor": null
    }
  ],
  "add-minimum-number-of-rungs": [
    {
      "inputs": ["[1,3,5,10]", "2"],
      "expected": "2",
      "explanation_md": "From height 0, each hop may cover at most dist = 2. Walk the gaps: 0 -> 1 is 1 (ok). 1 -> 3 is 2 (ok). 3 -> 5 is 2 (ok). 5 -> 10 is 5 — too far. Insert rungs greedily at maximum spacing: rungs needed for a gap g is floor((g - 1) / dist) = floor(4 / 2) = 2 (insert at 7 and 9). Total added = 2. Each gap is independent, so summing per-gap insertions is optimal.",
      "viz_anchor": null
    },
    {
      "inputs": ["[3,6,8,10]", "3"],
      "expected": "0",
      "explanation_md": "Gaps from height 0: 0 -> 3 is 3 (exactly dist, ok). 3 -> 6 is 3 (ok). 6 -> 8 is 2 (ok). 8 -> 10 is 2 (ok). Every gap is already <= dist = 3, so no rungs are added. Answer 0. The formula floor((g - 1) / dist) returns 0 for every g <= dist, confirming the per-gap computation handles the no-op case without a separate branch.",
      "viz_anchor": null
    },
    {
      "inputs": ["[3,4,6,7]", "2"],
      "expected": "1",
      "explanation_md": "Gaps from 0: 0 -> 3 is 3 > dist = 2, needs floor((3 - 1) / 2) = 1 rung (insert at 2). 3 -> 4 is 1 (ok). 4 -> 6 is 2 (ok). 6 -> 7 is 1 (ok). Total = 1. The very first climb from the ground is the only violation — a common bug is starting the gap scan at rungs[1] and forgetting the 0 -> rungs[0] gap entirely.",
      "viz_anchor": null
    }
  ],
  "append-k-integers-with-minimal-sum": [
    {
      "inputs": ["[1,4,25,10,25]", "2"],
      "expected": "5",
      "explanation_md": "Append the k smallest positive integers NOT already in nums. Present: {1, 4, 10, 25}. Scan upward: 1 taken, 2 missing (append, k = 1), 3 missing (append, k = 0). Appended {2, 3}, sum = 5. At scale you avoid the scan: sort unique values and use the arithmetic-series sum of each gap between consecutive present values, subtracting collisions instead of iterating one by one.",
      "viz_anchor": null
    },
    {
      "inputs": ["[5,6]", "6"],
      "expected": "25",
      "explanation_md": "Need 6 missing positives. Present: {5, 6}. Take 1, 2, 3, 4 (four so far), skip 5 and 6, take 7, 8 (six total). Sum = 1 + 2 + 3 + 4 + 7 + 8 = 25. The greedy claim: replacing any chosen value with a larger missing one only increases the sum, so the k smallest missing values are exactly optimal. The collision adjustment: naive sum 1..6 = 21, but 5 and 6 collide and are replaced by 7 and 8, adding (7 - 5) + (8 - 6) = 4, giving 25.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,2,3]", "3"],
      "expected": "15",
      "explanation_md": "Present: {1, 2, 3}. The 3 smallest missing positives are 4, 5, 6. Sum = 4 + 5 + 6 = 15. Closed form: sum of 1..6 = 21 minus the colliding present values 1 + 2 + 3 = 6 gives 15 — every element of nums that falls inside the candidate window pushes the window one slot higher.",
      "viz_anchor": null
    }
  ],
  "apple-redistribution-into-boxes": [
    {
      "inputs": ["[1,3,2]", "[4,3,1,5,2]"],
      "expected": "2",
      "explanation_md": "Total apples = 1 + 3 + 2 = 6 (packs can be split, so only the total matters). Sort capacity descending: [5, 4, 3, 2, 1]. Take boxes greedily from the largest: 5 (running 5 < 6), then 4 (running 9 >= 6) — stop. Answer 2. Exchange argument: swapping any chosen box for a larger unchosen one never increases the count, so largest-first is optimal.",
      "viz_anchor": null
    },
    {
      "inputs": ["[5,5,5]", "[2,4,2,7]"],
      "expected": "4",
      "explanation_md": "Total apples = 15. Capacity descending: [7, 4, 2, 2]. Accumulate: 7 (7 < 15), 11 (< 15), 13 (< 15), 15 (>= 15). All 4 boxes are required. Answer 4. The problem guarantees the boxes can always hold the apples, so the loop terminates without an unreachable-case guard; total capacity 15 exactly equals the apple count here.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1]", "[1]"],
      "expected": "1",
      "explanation_md": "Total apples = 1, one box of capacity 1. Take it: running total 1 >= 1. Answer 1. Minimal case confirms the accumulate-until-covered loop: the answer is the smallest prefix of the descending-sorted capacities whose sum reaches the apple total.",
      "viz_anchor": null
    }
  ],
  "array-of-doubled-pairs": [
    {
      "inputs": ["[3,1,3,6]"],
      "expected": "false",
      "explanation_md": "Goal: pair every element x with a partner 2x. Count values: {1: 1, 3: 2, 6: 1}. Process in increasing absolute value: 1 needs a 2 — count of 2 is 0, so 1 cannot be paired. Return false immediately. Sorting by |x| is the greedy key: the smallest-magnitude unpaired value has no choice about its partner (it must be the smaller half of its pair), so matching it first is forced, not heuristic.",
      "viz_anchor": null
    },
    {
      "inputs": ["[2,1,2,6]"],
      "expected": "false",
      "explanation_md": "Counts: {1: 1, 2: 2, 6: 1}. Ascending by |x|: 1 needs 2 -> pair them, counts now {2: 1, 6: 1}. Next, 2 needs 4 -> count of 4 is 0 -> false. The first pairing succeeds but strands the leftover 2 and the 6 (6 would need 12 or 3). One failed demand anywhere means the whole arrangement is impossible.",
      "viz_anchor": null
    },
    {
      "inputs": ["[4,-2,2,-4]"],
      "expected": "true",
      "explanation_md": "Negatives flip the pairing direction, which is why sorting by ABSOLUTE value matters. Counts: {-2: 1, -4: 1, 2: 1, 4: 1}. Ascending by |x|: -2 needs 2 * (-2) = -4 -> present, pair (-2, -4). Then 2 needs 4 -> present, pair (2, 4). All counts zero -> true. The reordered array [-2, -4, 2, 4] satisfies arr[2i+1] = 2 * arr[2i] for both pairs. Sorting by plain value instead of |x| would process -4 first and wrongly demand -8.",
      "viz_anchor": null
    }
  ],
  "array-partition": [
    {
      "inputs": ["[1,4,3,2]"],
      "expected": "4",
      "explanation_md": "Sort: [1, 2, 3, 4]. Pair adjacent values: (1, 2) and (3, 4). Sum of pair minimums = 1 + 3 = 4. Why adjacent pairing is optimal: the largest value can never be a minimum, so it should sacrifice the second-largest (its natural partner) rather than waste a small value. Any other pairing, e.g. (1, 4) and (2, 3), gives 1 + 2 = 3 — strictly worse. Sorting then taking every even index is the whole algorithm.",
      "viz_anchor": null
    },
    {
      "inputs": ["[6,2,6,5,1,2]"],
      "expected": "9",
      "explanation_md": "Sort: [1, 2, 2, 5, 6, 6]. Adjacent pairs: (1, 2), (2, 5), (6, 6). Sum of minimums = 1 + 2 + 6 = 9. Trace the even indices 0, 2, 4 of the sorted array: 1, 2, 6. Duplicates change nothing — (6, 6) contributes 6 because both members are equal, and the pairing rule never needs to distinguish them.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,1]"],
      "expected": "1",
      "explanation_md": "Sort: [1, 1]. One pair (1, 1), minimum 1. Answer 1. Smallest valid input (n = 1 pair). The even-index sum formula picks index 0 only: value 1. Confirms the implementation needs no special case for a single pair.",
      "viz_anchor": null
    }
  ],
  "break-a-palindrome": [
    {
      "inputs": ["\"abccba\""],
      "expected": "\"aaccba\"",
      "explanation_md": "Replace exactly one character to make the lexicographically smallest NON-palindrome. Greedy: scan the first half left to right and change the first character that is not 'a' to 'a'. Index 0 is 'a' (skip), index 1 is 'b' -> change to 'a'. Result \"aaccba\" — no longer a palindrome (reverse is \"abccaa\"), and changing an earlier or smaller position is impossible. Only the first half is scanned: fixing a second-half character mirrors a first-half fix but lands later lexicographically.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"a\""],
      "expected": "\"\"",
      "explanation_md": "Length 1: every single-character string is a palindrome no matter what you substitute, so breaking it is impossible. Return the empty string. This guard must run before the scan loop — a common bug is changing 'a' to 'b' and returning \"b\", which is still a palindrome.",
      "viz_anchor": null
    }
  ],
  "broken-calculator": [
    {
      "inputs": ["2", "3"],
      "expected": "2",
      "explanation_md": "Operations forward: double or decrement. Work BACKWARD from target instead: halve when even, increment when odd — backward greed is deterministic, forward greed is not. Target 3 is odd -> increment to 4 (1 op). 4 is even and still > 2 -> halve to 2 (2 ops). 2 == startValue, done. Answer 2. Forward this corresponds to: double 2 -> 4, decrement 4 -> 3. Backward halving is the move that shrinks the gap fastest, which is why it is always taken when available.",
      "viz_anchor": null
    },
    {
      "inputs": ["5", "8"],
      "expected": "2",
      "explanation_md": "Backward from 8: even and > 5 -> halve to 4 (1 op). Now 4 < 5: only increments remain, add (5 - 4) = 1 more op. Total 2. Forward check: 5 - 1 = 4, 4 * 2 = 8. Two ops, matches. Once the backward value drops below startValue the remaining cost is exactly startValue - current, because backward increments are the only way up.",
      "viz_anchor": null
    },
    {
      "inputs": ["3", "10"],
      "expected": "3",
      "explanation_md": "Backward from 10: even, > 3 -> halve to 5 (1 op). 5 is odd -> increment to 6 (2 ops). 6 even, > 3 -> halve to 3 (3 ops). 3 == startValue. Answer 3. Forward: 3 * 2 = 6, 6 - 1 = 5, 5 * 2 = 10. The odd-target case shows why backward is clean: an odd number can never be the result of a doubling, so the last forward op MUST have been a decrement — no branching to explore.",
      "viz_anchor": null
    }
  ],
  "buy-two-chocolates": [
    {
      "inputs": ["[1,2,2]", "3"],
      "expected": "0",
      "explanation_md": "Buy the two cheapest chocolates: sorted prices [1, 2, 2], cheapest pair costs 1 + 2 = 3. Money 3 - 3 = 0 leftover, which is >= 0, so the purchase is valid. Return the leftover 0. Minimizing the pair cost maximizes the leftover, and the two smallest elements always form the minimum pair — a single pass tracking min1 and min2 avoids the full sort.",
      "viz_anchor": null
    },
    {
      "inputs": ["[3,2,3]", "3"],
      "expected": "3",
      "explanation_md": "Cheapest pair: 2 + 3 = 5. Money 3 - 5 = -2, negative — buying two chocolates would leave debt, which is not allowed. Return the original money, 3, unspent. The rule: if even the CHEAPEST pair is unaffordable, no pair is affordable, so checking the minimum pair decides the whole problem.",
      "viz_anchor": null
    }
  ],
  "can-place-flowers": [
    {
      "inputs": ["[1,0,0,0,1]", "1"],
      "expected": "true",
      "explanation_md": "Greedy scan: plant in every empty plot whose neighbors are both empty (treat out-of-bounds as empty). Index 0: occupied, skip. Index 1: left = 1, blocked. Index 2: left = 0, right = 0 -> plant. Bed becomes [1,0,1,0,1], planted = 1. Index 3: left now 1, blocked. Index 4: occupied. Planted 1 >= n = 1 -> true. Planting at the earliest legal spot never hurts: it blocks at most the same set of future spots as any alternative placement.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,0,0,0,1]", "2"],
      "expected": "false",
      "explanation_md": "Same bed, same scan: only index 2 is plantable (indices 1 and 3 are adjacent to the existing flowers, and after planting at 2 nothing else opens up). Maximum capacity of this bed is 1, but n = 2 is requested. 1 < 2 -> false. The greedy scan computes the bed's true maximum, so comparing it against n answers any request.",
      "viz_anchor": null
    },
    {
      "inputs": ["[-31]", "97"],
      "expected": "false",
      "explanation_md": "Single-plot bed holding the value -31 with a request of 97. The planting rule only plants where the plot value is exactly 0; -31 is not 0, so no plot is ever plantable. Planted = 0 < 97 -> false. This case also fails on magnitude alone: a one-plot bed can hold at most one flower, so any n > 1 is impossible regardless of contents.",
      "viz_anchor": null
    }
  ],
  "check-if-a-string-can-break-another-string": [
    {
      "inputs": ["\"abc\"", "\"xya\""],
      "expected": "true",
      "explanation_md": "x breaks y if some permutation of x is >= some permutation of y at EVERY position. The optimal alignment is sorted-vs-sorted. Sort both: s1 -> \"abc\", s2 -> \"axy\". Compare position by position: a >= a, x >= b, y >= c — s2 dominates s1 everywhere, so s2 breaks s1. Return true (either direction suffices). The greedy proof: matching the i-th smallest of one string against the i-th smallest of the other is the best possible pairing for domination.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"abe\"", "\"acd\""],
      "expected": "false",
      "explanation_md": "Sort: \"abe\" and \"acd\". Check s1 >= s2 everywhere: a >= a ok, b >= c fails. Check s2 >= s1 everywhere: a >= a ok, c >= b ok, d >= e fails. Neither sorted string dominates the other — the domination flips between positions 1 and 2 — so no permutation pairing can work. Return false.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"leetcodee\"", "\"interview\""],
      "expected": "true",
      "explanation_md": "Sort both: \"leetcodee\" -> \"cdeeeelot\", \"interview\" -> \"eeiinrtvw\". Position-by-position: c <= e, d <= e, e <= i, e <= i, e <= n, e <= r, l <= t, o <= v, t <= w. The sorted s2 dominates sorted s1 at all 9 positions, so s2 breaks s1 -> true. A single counting pass (prefix counts over the 26 letters) gives the same answer in O(n) without the sort.",
      "viz_anchor": null
    }
  ],
  "destroying-asteroids": [
    {
      "inputs": ["10", "[3,9,19,5,21]"],
      "expected": "true",
      "explanation_md": "Destroy asteroids smallest-first so mass grows before facing the big ones. Sort: [3, 5, 9, 19, 21]. Mass 10: absorb 3 -> 13, absorb 5 -> 18, absorb 9 -> 27, absorb 19 -> 46, absorb 21 -> 67. Every comparison passed (mass >= asteroid at each step), return true. Smallest-first is provably optimal: if any order succeeds, the ascending order succeeds, because facing a smaller rock earlier only leaves you heavier later.",
      "viz_anchor": null
    },
    {
      "inputs": ["5", "[4,9,23,4]"],
      "expected": "false",
      "explanation_md": "Sort: [4, 4, 9, 23]. Mass 5: absorb 4 -> 9, absorb 4 -> 13, absorb 9 (13 >= 9) -> 22, face 23: 22 < 23 -> destroyed. Return false. Since ascending order maximizes mass at every prefix, failing here proves every other order fails too. Use 64-bit accumulation in typed languages — the running mass can exceed int32 long before the loop ends.",
      "viz_anchor": null
    }
  ],
  "determine-the-minimum-sum-of-a-k-avoiding-array": [
    {
      "inputs": ["5", "4"],
      "expected": "18",
      "explanation_md": "Build n = 5 distinct positives, no two summing to k = 4, minimizing the total. Greedy from 1 upward, skipping any candidate whose k-complement is already taken: take 1 (complement 3 now banned), take 2 (complement 2 is itself — a pair needs two distinct elements, so 2 is safe), skip 3 (1 + 3 = 4), take 4, 5, 6. Picked {1, 2, 4, 5, 6}, sum = 18. From each complement pair (x, k - x) below k you can keep only one side — and the cheaper side is always the smaller value.",
      "viz_anchor": null
    },
    {
      "inputs": ["2", "6"],
      "expected": "3",
      "explanation_md": "n = 2, k = 6. Take 1 (bans 5), take 2 (bans 4). Picked {1, 2}, sum = 3. No conflict: 1 + 2 = 3 != 6. The greedy never had to skip because the banned values 5 and 4 were never reached. General fact: the first floor(k/2) integers are always mutually safe, since the smallest conflicting pair is (1, k - 1).",
      "viz_anchor": null
    }
  ],
  "divide-array-in-sets-of-k-consecutive-numbers": [
    {
      "inputs": ["[1,2,3,3,4,4,5,6]", "4"],
      "expected": "true",
      "explanation_md": "8 cards, k = 4 -> need exactly 2 runs. Count values: {1:1, 2:1, 3:2, 4:2, 5:1, 6:1}. Repeatedly start a run at the SMALLEST remaining value — no other run can contain it. Run 1 from 1: consume 1, 2, 3, 4 -> counts {3:1, 4:1, 5:1, 6:1}. Run 2 from 3: consume 3, 4, 5, 6 -> all zero. Return true. The smallest-remaining rule is forced, not heuristic: nothing below the minimum exists to extend its run downward.",
      "viz_anchor": null
    },
    {
      "inputs": ["[3,2,1,2,3,4,3,4,5,9,10,11]", "3"],
      "expected": "true",
      "explanation_md": "12 values, k = 3 -> 4 runs. Counts: {1:1, 2:2, 3:3, 4:2, 5:1, 9:1, 10:1, 11:1}. Run from 1: take 1, 2, 3. Run from 2: take 2, 3, 4. Run from 3: take 3, 4, 5 -> low block exhausted. Run from 9: take 9, 10, 11 -> empty. Return true. The gap between 5 and 9 is harmless because each block of consecutive values divides cleanly into complete runs.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,2,3,4]", "3"],
      "expected": "false",
      "explanation_md": "4 cards, k = 3: 4 % 3 != 0, so equal-size groups are arithmetically impossible. Return false before touching the counts. The divisibility pre-check is the cheapest filter and must come first; running the greedy anyway would start a run at 1, consume 1, 2, 3, then strand the lone 4 unable to form a run.",
      "viz_anchor": null
    }
  ],
  "divide-array-into-arrays-with-max-difference": [
    {
      "inputs": ["[1,3,4,8,7,9,3,5,1]", "2"],
      "expected": "[[1,1,3],[3,4,5],[7,8,9]]",
      "explanation_md": "Sort: [1, 1, 3, 3, 4, 5, 7, 8, 9]. Cut into consecutive triples and check max - min <= k = 2 in each: [1,1,3] spread 2 (ok), [3,4,5] spread 2 (ok), [7,8,9] spread 2 (ok). Return [[1,1,3],[3,4,5],[7,8,9]]. Consecutive triples after sorting are optimal: skipping an element to grab a farther one can only widen some group's spread, never narrow it.",
      "viz_anchor": null
    },
    {
      "inputs": ["[2,4,2,2,5,2]", "2"],
      "expected": "[]",
      "explanation_md": "Sort: [2, 2, 2, 2, 4, 5]. Triples: [2,2,2] spread 0 (ok), [2,4,5] spread 3 > k = 2 -> impossible. Return []. Since sorted-consecutive grouping is the best possible arrangement, its failure proves no valid partition exists — no backtracking or regrouping can rescue the stranded 2.",
      "viz_anchor": null
    },
    {
      "inputs": ["[4,2,9,8,2,12,7,12,10,5,8,5,5,7,9,2,5,11]", "14"],
      "expected": "[[2,2,2],[4,5,5],[5,5,7],[7,8,8],[9,9,10],[11,12,12]]",
      "explanation_md": "18 values -> 6 triples. Sort: [2,2,2,4,5,5,5,5,7,7,8,8,9,9,10,11,12,12]. Triples in order: [2,2,2], [4,5,5], [5,5,7], [7,8,8], [9,9,10], [11,12,12] — spreads 0, 1, 2, 1, 1, 1, every one far under k = 14. Return all six. A generous k changes nothing about the method: sort once, slice every 3, verify each spread.",
      "viz_anchor": null
    }
  ],
  "eliminate-maximum-number-of-monsters": [
    {
      "inputs": ["[1,3,4]", "[1,1,1]"],
      "expected": "3",
      "explanation_md": "Arrival time of monster i = dist[i] / speed[i]: [1, 3, 4]. Sort ascending (already sorted). You fire once per minute starting at minute 0: minute 0 kills the monster arriving at t = 1 (1 > 0, still out), minute 1 kills the t = 3 monster (3 > 1), minute 2 kills the t = 4 monster (4 > 2). All 3 eliminated. Shooting the soonest-arriving monster first is forced — any other target lets the nearest one walk in.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,1,2,3]", "[1,1,1,1]"],
      "expected": "1",
      "explanation_md": "Arrival times: [1, 1, 2, 3]. Minute 0: kill one of the t = 1 monsters. Minute 1: the other t = 1 monster has arrival time 1 <= current minute 1 — it reaches the city as you reload. Stop. Answer 1. The strict comparison is the trap: a monster arriving exactly at minute m is killed only if you shoot it BEFORE minute m, and there was only one earlier shot.",
      "viz_anchor": null
    },
    {
      "inputs": ["[3,2,4]", "[5,3,2]"],
      "expected": "1",
      "explanation_md": "Arrival times: 3/5 = 0.6, 2/3 = 0.667, 4/2 = 2. Sorted: [0.6, 0.667, 2]. Minute 0: kill the t = 0.6 monster. Minute 1: the t = 0.667 monster arrived during minute 0-1 (0.667 <= 1) -> city falls. Answer 1. Compare with cross-multiplication (dist[i] <= minute * speed[i]) to dodge floating-point error on large inputs.",
      "viz_anchor": null
    }
  ],
  "find-original-array-from-doubled-array": [
    {
      "inputs": ["[1,3,4,2,6,8]"],
      "expected": "[1,3,4]",
      "explanation_md": "Counts: {1:1, 2:1, 3:1, 4:1, 6:1, 8:1}. Process keys ascending — the smallest remaining value must be an ORIGINAL (its half cannot exist below it): 1 claims its double 2 -> original [1]. 3 claims 6 -> [1, 3]. 4 claims 8 -> [1, 3, 4]. All counts consumed, return [1,3,4]. Ascending order makes each pairing forced; descending or unsorted processing produces wrong matches like pairing 4 with 2.",
      "viz_anchor": null
    },
    {
      "inputs": ["[6,3,0,1]"],
      "expected": "[]",
      "explanation_md": "Counts: {0:1, 1:1, 3:1, 6:1}. Zero is its own double, so zeros must pair among themselves — an odd count of zeros (1 here) fails instantly. Return []. Even setting zero aside, 1 would demand a 2 (absent) and 3 would demand a 6, leaving 1 stranded. The zero-parity check is the classic miss in this problem.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1]"],
      "expected": "[]",
      "explanation_md": "Length 1 is odd — a doubled array always has even length since every original element contributes itself plus its double. Return [] before any counting. The parity guard is the first line of the solution and the cheapest possible rejection.",
      "viz_anchor": null
    }
  ],
  "find-polygon-with-the-largest-perimeter": [
    {
      "inputs": ["[5,5,5]"],
      "expected": "15",
      "explanation_md": "Polygon rule: the longest side must be strictly less than the sum of all the others. Sort: [5, 5, 5]. Try the largest candidate set first — all three sides: longest 5 vs others 5 + 5 = 10 -> 5 < 10 holds. Perimeter = 15. Starting from the full sorted array and shrinking from the right finds the largest valid perimeter because dropping the biggest side both removes the hardest constraint and keeps the most total length.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,12,1,2,5,50,3]"],
      "expected": "12",
      "explanation_md": "Sort: [1, 1, 2, 3, 5, 12, 50]. Prefix sums let each check run in O(1). Try longest = 50: rest sum = 1+1+2+3+5+12 = 24, 50 < 24 fails. Drop 50, try longest = 12: rest = 1+1+2+3+5 = 12, 12 < 12 fails (strict). Drop 12, try longest = 5: rest = 1+1+2+3 = 7, 5 < 7 holds. Perimeter = 7 + 5 = 12. Return 12.",
      "viz_anchor": null
    },
    {
      "inputs": ["[5,5,50]"],
      "expected": "-1",
      "explanation_md": "Sort: [5, 5, 50]. Longest = 50: rest = 10, 50 < 10 fails. Drop 50: only two sides remain, and a polygon needs at least 3. No valid polygon -> return -1. The giant side poisons every candidate set it belongs to, and without it there are not enough sides — both failure modes in one tiny input.",
      "viz_anchor": null
    }
  ],
  "group-the-people-given-the-group-size-they-belong-to": [
    {
      "inputs": ["[3,3,3,3,3,1,3]"],
      "expected": "[[5],[0,1,2],[3,4,6]]",
      "explanation_md": "Bucket people by their declared group size, flushing a bucket whenever it fills. Person 0 (size 3): bucket3 = [0]. Person 1: [0,1]. Person 2: [0,1,2] — full, emit [0,1,2]. Person 3: bucket3 = [3]. Person 4: [3,4]. Person 5 (size 1): bucket1 = [5] — full, emit [5]. Person 6: bucket3 = [3,4,6] — full, emit [3,4,6]. Output [[5],[0,1,2],[3,4,6]]. The input is guaranteed consistent, so every bucket ends empty.",
      "viz_anchor": null
    },
    {
      "inputs": ["[2,1,3,3,3,2]"],
      "expected": "[[1],[0,5],[2,3,4]]",
      "explanation_md": "Person 0 (size 2): bucket2 = [0]. Person 1 (size 1): emit [1] immediately. Persons 2, 3, 4 (size 3): bucket3 fills to [2,3,4] — emit. Person 5 (size 2): bucket2 = [0,5] — full, emit [0,5]. Output [[1],[0,5],[2,3,4]]. Two people who declare the same size need not share a group — the flush-on-full rule splits same-size people into as many groups as needed.",
      "viz_anchor": null
    }
  ],
  "hand-of-straights": [
    {
      "inputs": ["[1,2,3,6,2,3,4,7,8]", "3"],
      "expected": "true",
      "explanation_md": "9 cards, groupSize 3 -> 3 straights. Counts: {1:1, 2:2, 3:2, 4:1, 6:1, 7:1, 8:1}. Always start a straight at the smallest remaining card — nothing else can cover it. From 1: take 1, 2, 3 -> {2:1, 3:1, 4:1, 6:1, 7:1, 8:1}. From 2: take 2, 3, 4 -> {6:1, 7:1, 8:1}. From 6: take 6, 7, 8 -> empty. Return true. Hands [1,2,3], [2,3,4], [6,7,8].",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,2,3,4,5]", "4"],
      "expected": "false",
      "explanation_md": "5 cards into groups of 4: 5 % 4 != 0 — impossible by counting alone. Return false without examining values. The modulo guard runs first in every consecutive-groups problem; skipping it sends the greedy into a doomed partial assignment ([1,2,3,4] formed, lone 5 stranded).",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,2,3]", "1"],
      "expected": "true",
      "explanation_md": "groupSize 1: every card is its own straight of length 1. Three singleton groups [1], [2], [3]. Return true. Degenerate boundary — the greedy loop still works (each smallest card starts and immediately completes a run), but recognizing k = 1 as always-true is a valid O(1) short-circuit.",
      "viz_anchor": null
    }
  ],
  "increasing-triplet-subsequence": [
    {
      "inputs": ["[1,2,3,4,5]"],
      "expected": "true",
      "explanation_md": "Track two thresholds: first = smallest value seen, second = smallest value that has something smaller before it. Scan: 1 -> first = 1. 2 -> bigger than first, second = 2. 3 -> bigger than second -> triplet (1, 2, 3) exists, return true. The two-variable greedy is O(n) time, O(1) space — the standard interview follow-up after an O(n^2) pair-scan attempt.",
      "viz_anchor": null
    },
    {
      "inputs": ["[5,4,3,2,1]"],
      "expected": "false",
      "explanation_md": "Strictly decreasing. Scan: 5 -> first = 5. 4 -> not > first, first = 4. 3 -> first = 3. 2 -> first = 2. 1 -> first = 1. Second is never assigned because no element ever exceeds the current first; the third-element check never fires. Return false. Every element only lowers the floor — there is no rise anywhere.",
      "viz_anchor": null
    },
    {
      "inputs": ["[2,1,5,0,4,6]"],
      "expected": "true",
      "explanation_md": "The subtle case: first may move BELOW second without breaking correctness. Scan: 2 -> first = 2. 1 -> first = 1. 5 -> second = 5. 0 -> first = 0. 4 -> 4 > first but 4 < second, so second = 4 (a better middle, and some element before it — the old first 1 — is still smaller). 6 -> 6 > second = 4 -> true. Triplet (1, 4, 6) or (0, 4, 6). The invariant: second always has SOME smaller element somewhere before it, even after first is overwritten.",
      "viz_anchor": null
    }
  ],
  "k-items-with-the-maximum-sum": [
    {
      "inputs": ["3", "2", "0", "2"],
      "expected": "2",
      "explanation_md": "Bag holds 3 ones, 2 zeros, 0 negative-ones; pick k = 2 items maximizing the sum. Greedy priority: ones first, then zeros, then negative-ones. Take min(3, 2) = 2 ones -> sum 2, k exhausted. Answer 2. Each tier strictly dominates the next, so the three-step take order is the entire algorithm — no search needed.",
      "viz_anchor": null
    },
    {
      "inputs": ["3", "2", "0", "4"],
      "expected": "3",
      "explanation_md": "k = 4. Take all 3 ones (sum 3, 1 pick left), take min(2, 1) = 1 zero (sum still 3, k exhausted). No negative-ones touched. Answer 3. Closed form: if k <= ones, answer is k; else if k <= ones + zeros, answer is ones (this case: 4 <= 3 + 2); else answer is ones - (k - ones - zeros).",
      "viz_anchor": null
    }
  ],
  "largest-odd-number-in-string": [
    {
      "inputs": ["\"52\""],
      "expected": "\"5\"",
      "explanation_md": "The largest odd substring is always a PREFIX ending at the rightmost odd digit — longer is larger when comparing numeric strings that start at index 0. Scan from the right: '2' is even, '5' is odd -> cut after index 0. Return \"5\". Every digit after the rightmost odd digit is even and would force an even number, so it must be dropped.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"4206\""],
      "expected": "\"\"",
      "explanation_md": "Scan from the right: '6' even, '0' even, '2' even, '4' even. No odd digit exists, so every substring ends in an even digit and is even. Return the empty string. The empty-result case falls out of the loop naturally — the scan runs off the left end and the answer is num[0:0].",
      "viz_anchor": null
    },
    {
      "inputs": ["\"35427\""],
      "expected": "\"35427\"",
      "explanation_md": "Scan from the right: '7' is odd immediately. The whole string is already odd, so the full prefix \"35427\" is the answer. One comparison, done. The rightmost-digit check is the only thing that determines oddness — the leading digits never matter.",
      "viz_anchor": null
    }
  ],
  "largest-perimeter-triangle": [
    {
      "inputs": ["[2,1,2]"],
      "expected": "5",
      "explanation_md": "Sort: [1, 2, 2]. Try the three largest sides first (here, all of them): triangle inequality needs longest < sum of other two -> 2 < 1 + 2 = 3 holds. Perimeter = 1 + 2 + 2 = 5. After sorting, only ADJACENT triples need checking: if (a, b, c) sorted ascending fails with the two largest partners b and c, no smaller pair can rescue a.",
      "viz_anchor": null
    },
    {
      "inputs": ["[1,2,1,10]"],
      "expected": "0",
      "explanation_md": "Sort: [1, 1, 2, 10]. Slide a window of 3 from the right: (1, 2, 10): 10 < 1 + 2 = 3 fails. (1, 1, 2): 2 < 1 + 1 = 2 fails (strict inequality — a degenerate flat triangle does not count). No window works, return 0. The 10 is so long that nothing can pair with it, and the small values collapse flat.",
      "viz_anchor": null
    }
  ],
  "least-number-of-unique-integers-after-k-removals": [
    {
      "inputs": ["[5,5,4]", "1"],
      "expected": "1",
      "explanation_md": "Frequencies: {5: 2, 4: 1}. To erase whole numbers fastest, spend removals on the RAREST values first. Sorted frequencies ascending: [1 (the 4), 2 (the 5s)]. k = 1: delete the single 4 -> k = 0, uniques drop from 2 to 1. Only {5} remains. Answer 1. Spending the budget on a frequency-2 value would consume both removals' worth for the same single-unique payoff.",
      "viz_anchor": null
    },
    {
      "inputs": ["[4,3,1,1,3,3,2]", "3"],
      "expected": "2",
      "explanation_md": "Frequencies: {4: 1, 2: 1, 1: 2, 3: 3}. Ascending: [1, 1, 2, 3]. k = 3: remove the 4 (k = 2, uniques 4 -> 3), remove the 2 (k = 1, uniques 3 -> 2), next frequency is 2 but k = 1 < 2 — cannot fully erase the 1s, and a partial removal does not reduce the unique count. Remaining uniques: {1, 3}. Answer 2.",
      "viz_anchor": null
    }
  ],
  "longest-happy-string": [
    {
      "inputs": ["1", "1", "7"],
      "expected": "\"ccaccbcc\"",
      "explanation_md": "Build greedily: always append the letter with the most remaining stock, unless it already appears twice in a row — then take the runner-up. Stocks a=1, b=1, c=7. Append c, c (stock 5), blocked on c -> append a (0 left), then c, c (3), blocked -> append b (0), then c, c (1). Stocks of a and b are gone and c is blocked, stop at \"ccaccbcc\", length 8. The cap formula confirms: c can contribute at most 2 * (a + b) + 2 = 6 characters, so 6 + 1 + 1 = 8 is the maximum possible length. Any maximum-length happy string is accepted.",
      "viz_anchor": null
    },
    {
      "inputs": ["7", "1", "0"],
      "expected": "\"aabaa\"",
      "explanation_md": "Stocks a=7, b=1, c=0. Append a, a (5 left), blocked on a -> append b (0 left), append a, a (3 left), blocked on a and nothing else in stock -> stop. \"aabaa\", length 5. Although 7 a's exist, the cap 2 * (b + c) + 2 = 4 limits a's contribution: each pair of a's needs a separator and only one b is available. 4 a's + 1 b = 5.",
      "viz_anchor": null
    },
    {
      "inputs": ["2", "2", "1"],
      "expected": "\"ababc\"",
      "explanation_md": "Stocks a=2, b=2, c=1 — total 5, and no letter exceeds the others enough to hit its cap (each cap is at least 2 * 3 + 2 = 8 > stock), so ALL 5 characters fit. One valid greedy run: a (tie-break to a), b, a, b, c -> \"ababc\". No triple anywhere, length 5. Any 5-character arrangement without a triple, such as \"ababc\" or \"babac\", is a correct answer.",
      "viz_anchor": null
    }
  ],
  "longest-palindrome": [
    {
      "inputs": ["\"abccccdd\""],
      "expected": "7",
      "explanation_md": "Counts: a=1, b=1, c=4, d=2. Every pair of identical letters extends the palindrome by 2: pairs from c contribute 4, from d contribute 2 -> running length 6. At least one letter with an odd count remains (a or b), so one character may sit alone in the center: +1 -> 7. Example palindrome: \"dccaccd\". Formula: sum of 2 * floor(count / 2), plus 1 if any count is odd.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"a\""],
      "expected": "1",
      "explanation_md": "One character, count a=1. No pairs (floor(1/2) = 0), but the odd count grants a center character: 0 + 1 = 1. The palindrome is \"a\" itself. The center bonus applies at most ONCE no matter how many letters have odd counts — that single +1 is the whole subtlety of this problem.",
      "viz_anchor": null
    },
    {
      "inputs": ["\"bb\""],
      "expected": "2",
      "explanation_md": "Count b=2: one pair contributes 2, no odd counts remain, no center bonus. Answer 2 — the palindrome \"bb\" uses every character. An implementation that always added +1 unconditionally would wrongly return 3 here; the bonus requires at least one genuinely odd count.",
      "viz_anchor": null
    }
  ],
  "longest-palindrome-by-concatenating-two-letter-words": [
    {
      "inputs": ["[\"lc\",\"cl\",\"gg\"]"],
      "expected": "6",
      "explanation_md": "Pair each word with its reverse: \"lc\" + \"cl\" form a mirrored pair contributing 4 characters (one on each side). \"gg\" is its own reverse (a double-letter word) with count 1 — an unpaired double can sit in the CENTER once, contributing 2. Total = 4 + 2 = 6, e.g. \"lc\" + \"gg\" + \"cl\" = \"lcggcl\". Two tallies drive the formula: cross pairs (word, reversed word) and double-letter words' pair count plus one optional center.",
      "viz_anchor": null
    },
    {
      "inputs": ["[\"ab\",\"ty\",\"yt\",\"lc\",\"cl\",\"ab\"]"],
      "expected": "8",
      "explanation_md": "Cross pairs: \"ty\"/\"yt\" -> 4 chars, \"lc\"/\"cl\" -> 4 chars. The two copies of \"ab\" cannot pair with each other — a mirrored pair needs \"ba\", which is absent. No double-letter words, so no center. Total = 8, e.g. \"ty\" + \"lc\" + \"cl\" + \"yt\" = \"tylcclyt\". Counting min(count[w], count[reverse(w)]) per unordered pair is the core bookkeeping.",
      "viz_anchor": null
    },
    {
      "inputs": ["[\"cc\",\"ll\",\"xx\"]"],
      "expected": "2",
      "explanation_md": "Three distinct double-letter words, each with count 1. Doubles pair with THEMSELVES: floor(1 / 2) = 0 full pairs from each, so the sides contribute 0. One leftover double may occupy the center: +2. Answer 2 (just \"cc\", or \"ll\", or \"xx\"). The center slot is single-use — a tempting bug is adding +2 for every odd-count double, which would wrongly return 6.",
      "viz_anchor": null
    }
  ]
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
