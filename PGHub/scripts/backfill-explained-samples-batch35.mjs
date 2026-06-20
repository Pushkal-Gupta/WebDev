#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 35 (30 fresh Easy/Medium problems).
// Same shape as batches 1..34: { inputs: [str], expected: str, explanation_md: str, viz_anchor: null }.
// Note: batch8..batch34 were already taken (committed work + a concurrent Hard-difficulty agent),
// so this Easy/Medium batch lands at batch35 to avoid clobbering or row-colliding with the Hard agent.
// Selected only Easy/Medium problems whose explained_samples was empty and that hold >=3 clean graded test cases.
// Run: node scripts/backfill-explained-samples-batch35.mjs

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
  'excel-column-number': [
    {
      inputs: ['A'],
      expected: '1',
      explanation_md:
        'Excel columns form a bijective base-26 number where `A` is `1` through `Z` is `26`, with no zero digit. Accumulate left-to-right with `result = result * 26 + (letter - \'A\' + 1)`. The single letter `"A"` starts the accumulator at `0`, then `0 * 26 + 1 = 1`. Return `1`. This is the smallest column and the base case the whole scheme rests on. Because there is no `0` symbol, each letter contributes its value plus one, which is exactly what separates this from an ordinary base-26 conversion that would map the first symbol to zero.',
      viz_anchor: null,
    },
    {
      inputs: ['AB'],
      expected: '28',
      explanation_md:
        'A two-letter column showing the place-value carry. Process `"AB"` left-to-right starting at `result = 0`. The `A` gives `0 * 26 + 1 = 1`. The `B` gives `1 * 26 + 2 = 28`. Return `28`. Check the ordering by hand: `Z` is `26`, then `AA` is `27`, and `AB` is `28`. The leading letter contributes `26` for sitting in the second place, and the trailing `B` adds `2`. The multiply-by-26-then-add pattern is identical to reading a positional number from its most significant digit downward.',
      viz_anchor: null,
    },
    {
      inputs: ['ZY'],
      expected: '701',
      explanation_md:
        'A larger two-letter column that stress-tests the accumulation. Process `"ZY"` from `result = 0`. The `Z` gives `0 * 26 + 26 = 26`. The `Y` gives `26 * 26 + 25 = 676 + 25 = 701`. Return `701`. The leading `Z` sits in the 26s place worth `26 * 26 = 676`, and `Y` adds `25`. Proves the formula handles the largest possible first digit without any special case: `Z` is simply the value `26` folded into the running total exactly like any other letter would be.',
      viz_anchor: null,
    },
  ],

  'maximum-number-of-pairs-in-array': [
    {
      inputs: ['[1,3,2,1,3,2,2]'],
      expected: '[3,1]',
      explanation_md:
        'Count how many matching pairs you can remove and how many singles remain. Tally each value: `1` appears twice, `3` twice, `2` three times. Pairs are the sum of `count // 2`: `1` gives one pair, `3` gives one pair, `2` gives one pair plus a leftover, totalling `3` pairs. Leftovers are the sum of `count % 2`: only the third `2` is unmatched, giving `1`. Return `[3,1]`. A single pass with a frequency map is enough; integer division and remainder split each tally cleanly into its paired and orphaned halves.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1]'],
      expected: '[1,0]',
      explanation_md:
        'A clean pair with nothing left over. The value `1` appears exactly twice, so `2 // 2 = 1` pair and `2 % 2 = 0` leftovers. Return `[1,0]`. Proves the even-count path: when every value occurs an even number of times, the leftover total is `0`. The integer division forms the pairs while the remainder confirms that no element is stranded. This is the simplest non-trivial case that exercises the pair-counting split without producing any orphan.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '[0,1]',
      explanation_md:
        'A single element that cannot pair with anything. The value `0` appears once, so `1 // 2 = 0` pairs and `1 % 2 = 1` leftover. Return `[0,1]`. Proves the algorithm treats `0` as an ordinary value rather than an empty slot, and that an odd count of one yields zero pairs with a single orphan. The result `[0,1]` is the minimal case where the leftover half of the answer becomes non-zero while the pair count stays at zero.',
      viz_anchor: null,
    },
  ],

  'minimum-operations-to-make-the-array-increasing': [
    {
      inputs: ['[1,1,1]'],
      expected: '3',
      explanation_md:
        'Each operation adds `1` to one element; make the array strictly increasing with the fewest. Greedily force each element to be at least one more than the previous final value. Trace `[1,1,1]`: keep the first `1`. The second must reach `2`, costing `1`. The third must reach `3`, costing `2` more. Total operations `1 + 2 = 3`. Return `3`. Lifting each element to exactly `prev + 1` is optimal, because raising any element higher than the minimum needed only adds cost without ever helping a later element clear its own bar.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,5,2,4,1]'],
      expected: '14',
      explanation_md:
        'A case where dips force large lifts. Trace `[1,5,2,4,1]` while tracking the running final value. Keep `1`. Since `5 > 1`, keep `5`. The `2` must reach `6`, cost `4`. The `4` must reach `7`, cost `3`. The final `1` must reach `8`, cost `7`. Total `4 + 3 + 7 = 14`. Return `14`. Proves the cost compounds: once an early element is lifted high, every later element that started small must clear that raised bar, so the trailing `1` pays the steepest cost of `7`.',
      viz_anchor: null,
    },
    {
      inputs: ['[8]'],
      expected: '0',
      explanation_md:
        'A single element. A one-element array is already strictly increasing by definition, since there is no pair to compare. The greedy scan keeps the only element untouched and never enters the lift logic, so the operation count stays at `0`. Return `0`. Proves the algorithm requires no work when the input is already valid, and that the single-element base case contributes nothing to the running total of operations.',
      viz_anchor: null,
    },
  ],

  'minimum-number-of-moves-to-seat-everyone': [
    {
      inputs: ['[3,1,5]', '[2,7,4]'],
      expected: '4',
      explanation_md:
        'Minimize total distance moving students into seats. Sort both lists and pair them in order, since matching the smallest student to the smallest seat is optimal by an exchange argument. Sort seats to `[1,3,5]` and students to `[2,4,7]`. Pair in order: `|1-2| + |3-4| + |5-7| = 1 + 1 + 2 = 4`. Return `4`. Crossing any pair, like matching a small seat to a large student, would only enlarge the summed gap, which is precisely why the sorted-order pairing is provably the minimal arrangement.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,1,5,9]', '[1,3,2,6]'],
      expected: '7',
      explanation_md:
        'A four-student case. Sort seats to `[1,4,5,9]` and students to `[1,2,3,6]`. Pair in order: `|1-1| + |4-2| + |5-3| + |9-6| = 0 + 2 + 2 + 3 = 7`. Return `7`. Proves the sorted pairing handles a perfectly aligned first pair, costing `0`, alongside larger gaps further along. Any swap of two assignments here would raise the total, confirming sorted matching stays optimal even when one pair already sits at zero distance.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,6,6]', '[1,3,2,6]'],
      expected: '4',
      explanation_md:
        'A case with duplicate seat positions. Sort seats to `[2,2,6,6]` and students to `[1,2,3,6]`. Pair in order: `|2-1| + |2-2| + |6-3| + |6-6| = 1 + 0 + 3 + 0 = 4`. Return `4`. Proves duplicates are handled naturally by the sort: two students share the value of two identical seats, and order-matching still minimizes the sum. The two zero-cost pairs fall out wherever a student already happens to sit at a seat coordinate.',
      viz_anchor: null,
    },
  ],

  'duplicate-zeros': [
    {
      inputs: ['[1,0,2,3,0,4,5,0]'],
      expected: '[1,0,0,2,3,0,0,4]',
      explanation_md:
        'Duplicate every zero in place, shifting later elements right and dropping anything pushed past the fixed length. Trace `[1,0,2,3,0,4,5,0]`: write `1`, then `0` and a duplicate `0`, then `2,3`, then `0` and its duplicate `0`, then `4`. The array is now full at length `8`, so the original `5` and final `0` fall off the end. Result `[1,0,0,2,3,0,0,4]`. The standard trick walks right-to-left after counting how many zeros fit, which avoids overwriting elements before they have been copied.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '[1,2,3]',
      explanation_md:
        'No zeros to duplicate. The scan finds no `0` anywhere, so nothing is shifted and every element keeps its slot. Result unchanged `[1,2,3]`. Proves the algorithm is a no-op when the input has no zeros: the duplicate-and-shift logic never fires, and the array is returned exactly as given. This confirms the zero-detecting branch gates all the mutation, leaving any zero-free input completely untouched after the pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: 'null',
      explanation_md:
        'The empty-array edge case. With no elements there is nothing to scan and nothing to duplicate, so the in-place routine returns immediately. Because the operation mutates the input rather than producing a new array, the function returns nothing, recorded here as `null`. Proves the algorithm handles a zero-length array without indexing out of bounds: the scan loop never starts, and the early exit on empty input is the safe base case that any in-place transformation must respect.',
      viz_anchor: null,
    },
  ],

  'final-prices-with-a-special-discount-in-a-shop': [
    {
      inputs: ['[8,4,6,2,3]'],
      expected: '[4,2,4,2,3]',
      explanation_md:
        'Each item gets discounted by the next item whose price is less than or equal to it. For each index `i`, find the first `j > i` with `prices[j] <= prices[i]` and subtract it. Trace `[8,4,6,2,3]`: `8` meets `4` first, becomes `4`. `4` meets `2`, becomes `2`. `6` meets `2`, becomes `4`. `2` looks at `3` but `3 > 2`, no discount, stays `2`. `3` is last, stays `3`. Result `[4,2,4,2,3]`. A monotonic stack finds each next-smaller-or-equal in **O(n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[1,2,3,4,5]',
      explanation_md:
        'A strictly increasing list. For every item, no later item is less than or equal to it, since prices only rise. So no discount applies anywhere and the prices are unchanged. Result `[1,2,3,4,5]`. Proves the no-discount path: when the array is monotonically increasing, the next-smaller-or-equal lookup fails for every index, and each item pays full price. The monotonic stack here never pops, simply pushing each rising value as it is encountered.',
      viz_anchor: null,
    },
    {
      inputs: ['[10,1,1,6]'],
      expected: '[9,0,1,6]',
      explanation_md:
        'A case exercising the equal-price discount. Trace `[10,1,1,6]`: `10` meets `1` first, becomes `9`. The first `1` meets the second `1`, and equal counts as a valid discount, so it becomes `0`. The second `1` has only `6` after it, and `6 > 1`, so no discount, it stays `1`. `6` is last, stays `6`. Result `[9,0,1,6]`. Proves the `<=` comparison, not strict `<`, is required: an equal-priced later item still discounts, which is exactly why the first `1` drops to `0`.',
      viz_anchor: null,
    },
  ],

  'teemo-attacking': [
    {
      inputs: ['[1,4]', '2'],
      expected: '4',
      explanation_md:
        'Sum poison durations, but overlapping attacks must not double-count. Each attack at time `t` poisons for `duration` seconds; if the next attack lands after the current poison expires, the full duration counts, otherwise only the gap until the next attack. Trace `[1,4]`, duration `2`: the first attack covers `[1,3)`, a full `2` seconds since the next attack at `4` is after `3`. The attack at `4` covers `[4,6)`, another `2`. Total `2 + 2 = 4`. Return `4`. Non-overlapping attacks each contribute their whole duration cleanly.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '2'],
      expected: '3',
      explanation_md:
        'An overlapping case. Trace `[1,2]`, duration `2`: the attack at `1` would cover `[1,3)`, but the next attack lands at `2`, before `3`, so only the gap `2 - 1 = 1` second counts for the first. The attack at `2` then covers its full `[2,4)`, adding `2`. Total `1 + 2 = 3`. Return `3`. Proves the overlap rule: when a fresh attack arrives mid-poison, the earlier attack contributes only the elapsed gap rather than its full duration, which avoids the double-count.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '5'],
      expected: '9',
      explanation_md:
        'A chain of overlaps with a long duration. Trace `[1,2,3,4,5]`, duration `5`: the first four attacks each overlap the next, contributing only their gaps of `1` second each, `4` seconds total. The final attack at `5` has nobody after it, so it adds its full `5`. Total `4 + 5 = 9`. Return `9`. Proves the general rule across many attacks: each contributes `min(gap_to_next, duration)`, and only the last attack is guaranteed to contribute its full duration.',
      viz_anchor: null,
    },
  ],

  'number-complement': [
    {
      inputs: ['5'],
      expected: '2',
      explanation_md:
        'Flip every bit of a number within its own bit-length. `5` is `101` in binary; flipping each bit gives `010`, which is `2`. Return `2`. The trick is a mask of all `1`s the same width as the number: for `5` that mask is `111`, which equals `7`, and `5 XOR 7 = 2`. Only the significant bits flip, with no leading bits affected, which is exactly why the mask must match the number\'s bit-length rather than spanning the full machine word.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '0',
      explanation_md:
        'A single-bit number. `1` is `1` in binary; flipping its one bit gives `0`. Return `0`. The mask is `1`, one bit wide, and `1 XOR 1 = 0`. Proves the algorithm respects the number\'s own width: it does not flip phantom leading zeros into ones, which would otherwise produce a huge value. The complement of the smallest positive number is `0`, the minimal output that the bit-flip operation can produce here.',
      viz_anchor: null,
    },
    {
      inputs: ['7'],
      expected: '0',
      explanation_md:
        'An all-ones number. `7` is `111` in binary; flipping every bit gives `000`, which is `0`. Return `0`. The mask for a three-bit number is `111`, also `7`, and `7 XOR 7 = 0`. Proves that any number whose binary form is all ones complements to `0`. This is the boundary case where the mask equals the number itself, so the XOR cancels completely, confirming the mask width is computed from the highest set bit and nothing beyond it.',
      viz_anchor: null,
    },
  ],

  'count-frequencies': [
    {
      inputs: ['[1,2,2,3,3,3]'],
      expected: '[1,2,2,3,3,3]',
      explanation_md:
        'Replace each element with how many times its value occurs in the array. First tally every value, then map each position to its value\'s count. Trace `[1,2,2,3,3,3]`: `1` occurs once, both `2`s occur twice, all three `3`s occur three times. Position by position the counts are `1, 2, 2, 3, 3, 3`. Return `[1,2,2,3,3,3]`. Here the output happens to equal the input because each value\'s magnitude matches its frequency exactly, a neat coincidence that the two-pass count-then-map process produces.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,5,4]'],
      expected: '[2,1,2]',
      explanation_md:
        'A small case where the output differs from the input. Tally: `4` occurs twice, `5` occurs once. Now map each position: index `0` holds `4` so it becomes `2`, index `1` holds `5` so it becomes `1`, index `2` holds `4` so it becomes `2`. Return `[2,1,2]`. Proves the frequency mapping preserves position while replacing the value with its count: both `4` slots report `2`, the lone `5` reports `1`. Each original value is looked up in the frequency map built during the first pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'The empty-array edge case. With no elements, the tally pass builds an empty frequency map and the mapping pass produces no output, so the result is the empty list `[]`. Return `[]`. Proves the algorithm short-circuits cleanly on empty input: neither loop iterates, and the returned list matches the input length of zero. This confirms both passes gate on the array length and never assume that at least one element is present.',
      viz_anchor: null,
    },
  ],

  'maximum-number-of-words-you-can-type': [
    {
      inputs: ['"hello world"', '"ad"'],
      expected: '1',
      explanation_md:
        'Count words typeable when certain keys are broken. A word is typeable only if it shares no letter with the broken set. The broken set is `{a, d}`. Split `"hello world"` into `hello` and `world`. Does `hello` contain `a` or `d`? No, so it is typeable. Does `world` contain `a` or `d`? Yes, the `d`, so it is not. Typeable count `1`. Return `1`. A per-word set-intersection test against the broken letters decides each word in time proportional to its length.',
      viz_anchor: null,
    },
    {
      inputs: ['"leet code"', '"lt"'],
      expected: '1',
      explanation_md:
        'The broken set is `{l, t}`. Split `"leet code"` into `leet` and `code`. Does `leet` contain `l` or `t`? Yes, both, so it is not typeable. Does `code` contain `l` or `t`? No, so it is typeable. Typeable count `1`. Return `1`. Proves the algorithm rejects a word the moment any broken letter appears in it: `leet` is disqualified by its leading `l`, while `code` survives because it shares no character with the broken set at all.',
      viz_anchor: null,
    },
    {
      inputs: ['"leet code"', '"e"'],
      expected: '0',
      explanation_md:
        'A broken key that appears everywhere. The broken set is `{e}`. Split `"leet code"` into `leet` and `code`. Both words contain at least one `e`, so neither is typeable. Typeable count `0`. Return `0`. Proves the algorithm correctly returns zero when a single very common broken letter touches every word. Even one shared letter disqualifies a word, and here the ubiquitous `e` knocks out both words in the sentence.',
      viz_anchor: null,
    },
  ],

  'find-winner-on-a-tic-tac-toe-game': [
    {
      inputs: ['[[0,0],[2,0],[1,1],[2,1],[2,2]]'],
      expected: '"A"',
      explanation_md:
        'Players A and B alternate, A first, placing on a 3x3 grid; report the winner or state. Apply the moves: A plays `(0,0)`, B `(2,0)`, A `(1,1)`, B `(2,1)`, A `(2,2)`. A now holds `(0,0)`, `(1,1)`, `(2,2)`, the main diagonal, a winning line. Return `"A"`. The check after each move tests whether the just-placed mark completed any row, column, or diagonal. A wins on the fifth move by completing the top-left to bottom-right diagonal.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0],[1,1],[0,1],[0,2],[1,0],[2,0]]'],
      expected: '"B"',
      explanation_md:
        'Apply moves alternately, A first: A `(0,0)`, B `(1,1)`, A `(0,1)`, B `(0,2)`, A `(1,0)`, B `(2,0)`. B now holds `(1,1)`, `(0,2)`, `(2,0)`, the anti-diagonal from top-right to bottom-left, a winning line. Return `"B"`. Proves the second player can win and that the anti-diagonal counts as a line. The win is detected on B\'s third placement, the moment the last mark completes the diagonal that the line-check scans for after every move.',
      viz_anchor: null,
    },
    {
      inputs: ['[[0,0],[1,1],[2,0],[1,0],[1,2],[2,1],[0,1],[0,2],[2,2]]'],
      expected: '"Draw"',
      explanation_md:
        'A full board with no winner. All nine moves are played and neither A nor B completes any row, column, or diagonal. Since the board is full and no line was formed, the result is a draw. Return `"Draw"`. Proves the algorithm distinguishes a draw from a still-pending game: after the final move the line-check finds no winner, and because all nine cells are filled, the answer is `"Draw"` rather than a pending verdict that would apply to a half-empty board.',
      viz_anchor: null,
    },
  ],

  'remove-digit-from-number-to-maximize-result': [
    {
      inputs: ['"123"', '"3"'],
      expected: '"12"',
      explanation_md:
        'Remove exactly one occurrence of the target digit to leave the largest possible number. Try deleting each `target` occurrence and keep the biggest result. In `"123"` the digit `3` appears once, at the end. Deleting it yields `"12"`, the only candidate. Return `"12"`. With a single occurrence there is no choice to make; the interesting rule appears when the digit occurs multiple times, where you prefer the deletion that lifts a larger following digit into a higher place value.',
      viz_anchor: null,
    },
    {
      inputs: ['"1231"', '"1"'],
      expected: '"231"',
      explanation_md:
        'The target appears twice, so the choice matters. In `"1231"` the digit `1` sits at index `0` and index `3`. Deleting the first `1` gives `"231"`; deleting the last `1` gives `"123"`. Compare them: `231 > 123`, so the leading deletion wins. Return `"231"`. Proves the greedy preference: removing an earlier occurrence promotes the larger following digit into the top place, yielding a bigger number. Trying every occurrence and keeping the maximum guarantees this optimal choice without guessing.',
      viz_anchor: null,
    },
    {
      inputs: ['"551"', '"5"'],
      expected: '"51"',
      explanation_md:
        'Two identical leading digits. In `"551"` the `5` appears at index `0` and index `1`. Deleting the first gives `"51"`; deleting the second also gives `"51"`. Both candidates are equal, so the result is `"51"`. Return `"51"`. Proves the algorithm handles duplicate adjacent targets without error: when the candidates tie, either deletion produces the same maximal number. Enumerating both and taking the maximum still lands cleanly on `"51"` with no ambiguity in the answer.',
      viz_anchor: null,
    },
  ],

  'existence-of-a-substring-in-a-string-and-its-reverse': [
    {
      inputs: ['"leetcode"'],
      expected: 'true',
      explanation_md:
        'Check whether any length-2 substring also appears reversed somewhere in the string. Scan adjacent pairs and look for a pair `xy` such that `yx` also exists. In `"leetcode"` the pair `te` appears at indexes 3-4 and its reverse `et` appears at indexes 1-2. Such a matching pair exists, so return `true`. A set of all length-2 substrings lets each pair check its reverse in **O(1)**, giving an **O(n)** scan overall. Finding one qualifying pair is enough to answer true immediately.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcba"'],
      expected: 'true',
      explanation_md:
        'A palindromic-feeling string. The length-2 substrings are `ab`, `bc`, `cb`, `ba`. The pair `bc` has its reverse `cb` also present, and `ab` has its reverse `ba` present as well. Since at least one pair and its reverse both occur, return `true`. Proves the check fires on the first qualifying pair encountered. Here multiple pairs satisfy the condition, but a single match is sufficient for the boolean answer, so the scan can stop as soon as one is found.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcd"'],
      expected: 'false',
      explanation_md:
        'A string with no reversible pair. The length-2 substrings are `ab`, `bc`, `cd`, all strictly increasing letters. None of their reverses, namely `ba`, `cb`, `dc`, appears anywhere in the string. So no qualifying pair exists and the answer is `false`. Proves the algorithm correctly returns false when every adjacent pair is unique and none reappears in reverse. The scan finishes having found no match and defaults to false at the end.',
      viz_anchor: null,
    },
  ],

  'find-the-number-of-winning-players': [
    {
      inputs: ['4', '[[0,0],[1,0],[1,0],[2,1],[2,1],[2,0]]'],
      expected: '2',
      explanation_md:
        'Player `i` wins by picking strictly more than `i` balls of a single color. Tally per player and color. Player 0 picks one color-0 ball; needing more than `0`, that is `1 > 0`, so player 0 wins. Player 1 picks two color-0 balls; needing more than `1`, that is `2 > 1`, so player 1 wins. Player 2 picks two color-1 and one color-0; needing more than `2`, the max is `2`, not `> 2`, so player 2 loses. Winners total `2`. Return `2`.',
      viz_anchor: null,
    },
    {
      inputs: ['5', '[[1,1],[1,2],[1,3],[1,4]]'],
      expected: '0',
      explanation_md:
        'Player 1 must pick more than `1` ball of one color to win, but their four picks are all different colors: one each of colors `1`, `2`, `3`, `4`. The maximum count for any single color is `1`, which is not `> 1`, so player 1 loses. No other player picks anything. Winners total `0`. Return `0`. Proves the strict threshold: needing strictly more than the player index, a player who spreads picks across distinct colors never reaches the required bar.',
      viz_anchor: null,
    },
    {
      inputs: ['5', '[[1,1],[2,4],[2,4],[2,4]]'],
      expected: '1',
      explanation_md:
        'Player 1 picks one color-1 ball; needing more than `1`, that is `1 > 1` false, so player 1 loses. Player 2 picks three color-4 balls; needing more than `2`, that is `3 > 2` true, so player 2 wins. Only one player clears the threshold. Winners total `1`. Return `1`. Proves the per-player requirement scales with the index: player 2 needs at least three of one color, which three color-4 picks satisfy, while player 1 falls one short of two.',
      viz_anchor: null,
    },
  ],

  // ---------- MEDIUM ----------
  'min-add-parens-valid': [
    {
      inputs: ['"())"'],
      expected: '1',
      explanation_md:
        'Count the minimum parentheses to insert so the string balances. Track `open`, the unmatched `(` count, and `additions`, the needed insertions. On `(` increment `open`; on `)` either close an open one or, if none is open, count one needed `(`. Trace `"())"`: `(` makes `open=1`. `)` closes it, `open=0`. The second `)` finds nothing open, so `additions=1`. At the end `open=0`. Total insertions `1`. Return `1`. The single stray `)` needs exactly one `(` prepended to match it.',
      viz_anchor: null,
    },
    {
      inputs: ['"((("'],
      expected: '3',
      explanation_md:
        'Three opens, no closes. Trace `"((("`: each `(` increments `open`, ending at `open=3` with no `)` ever consuming them. At the end, every unmatched `(` needs a matching `)` inserted, so `additions += open = 3`. Total `3`. Return `3`. Proves the end-of-string flush is mandatory: leftover unmatched opens each demand one closing parenthesis. The running counter alone is not enough; the final `open` count must be added to the answer once the scan completes.',
      viz_anchor: null,
    },
    {
      inputs: ['"()"'],
      expected: '0',
      explanation_md:
        'An already-balanced string. Trace `"()"`: `(` sets `open=1`, then `)` closes it back to `open=0`, with no unmatched closer along the way. No insertions are needed and `open` ends at `0`. Total `0`. Return `0`. Proves the algorithm reports zero work for valid input: every open is matched in order, the addition counter never increments, and the final flush of leftover opens adds nothing because none remain.',
      viz_anchor: null,
    },
  ],

  'capacity-to-ship-packages': [
    {
      inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'],
      expected: '15',
      explanation_md:
        'Find the least ship capacity that ships all packages in order within `days`. Binary search capacity between `max(weights)=10` and `sum=55`. For each guess, greedily fill days and count how many are needed. A capacity below `15` forces more than `5` days because the larger packages no longer group tightly enough, while `15` packs everything into exactly five days. So the smallest feasible capacity is `15`. Return `15`. Binary search over capacity plus a linear feasibility check gives **O(n log sum)** time.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,2,2,4,1,4]', '3'],
      expected: '6',
      explanation_md:
        'Ship `[3,2,2,4,1,4]` in `3` days. Binary search capacity from `max=4` to `sum=16`. Test `6`: pack greedily as `[3,2]=5` (adding the next `2` would overflow to `7`), then `[2,4]=6`, then `[1,4]=5`. That is exactly `3` days, so `6` is feasible. A capacity of `5` would require more days, because the `4`s and their neighbors no longer fit into three groups. So the minimum is `6`. Return `6`. The feasibility check counts days per candidate.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,1,1]', '4'],
      expected: '3',
      explanation_md:
        'Ship `[1,2,3,1,1]` in `4` days. The capacity cannot drop below `max(weights)=3`, since a single package must fit in one day. Test `3`: pack `[1,2]=3`, `[3]=3`, `[1,1]=2`, which is `3` days, within the `4` allowed. Capacity `2` is infeasible because the lone `3` exceeds it. So the minimum is `3`, the largest single weight. Return `3`. Proves the lower bound of the search is `max(weights)`, which here turns out to be the answer itself.',
      viz_anchor: null,
    },
  ],

  'compare-version-numbers': [
    {
      inputs: ['"1.01"', '"1.001"'],
      expected: '0',
      explanation_md:
        'Compare dot-separated versions by the numeric value of each revision, ignoring leading zeros. Split on `.` and parse each chunk as an integer. `"1.01"` becomes `[1, 1]` and `"1.001"` becomes `[1, 1]`. Compare component-wise: `1 == 1`, then `1 == 1`. All equal, return `0`. Proves leading zeros are stripped by integer parsing: `01` and `001` both equal `1`, so the versions are identical despite differing text. A plain string comparison would wrongly distinguish them.',
      viz_anchor: null,
    },
    {
      inputs: ['"1.0"', '"1.0.0"'],
      expected: '0',
      explanation_md:
        'Different revision counts. `"1.0"` is `[1, 0]` and `"1.0.0"` is `[1, 0, 0]`. Compare position by position, treating any missing trailing component as `0`. `1 == 1`, `0 == 0`, and the third position is an implicit `0` for the first version versus `0` for the second. All equal, return `0`. Proves trailing zeros do not change a version: padding the shorter list with zeros makes `1.0` and `1.0.0` compare equal rather than the shorter being treated as smaller.',
      viz_anchor: null,
    },
    {
      inputs: ['"0.1"', '"1.1"'],
      expected: '-1',
      explanation_md:
        'A clear ordering. `"0.1"` is `[0, 1]` and `"1.1"` is `[1, 1]`. Compare the first component: `0 < 1`, so version one is smaller and the result is `-1` immediately, without needing to inspect the rest. Return `-1`. Proves the comparison short-circuits at the first differing revision: the most significant component decides the order, so the trailing `1 == 1` is never even reached once the leading parts differ.',
      viz_anchor: null,
    },
  ],

  'reveal-cards-in-increasing-order': [
    {
      inputs: ['[17,13,11,2,3,5,7]'],
      expected: '[2,13,3,11,5,17,7]',
      explanation_md:
        'Arrange a deck so that repeatedly revealing the top card then moving the next to the bottom yields a sorted reveal. Simulate in reverse with a queue of slot indices. Sort the deck to `[2,3,5,7,11,13,17]`, then place each sorted card into the next index pulled from a rotating index queue. The resulting order is `[2,13,3,11,5,17,7]`. Return it. Verify forward: reveal `2`, move the next down, reveal `3`, and so on, producing the sorted sequence. The reverse simulation inverts the reveal-and-rotate process step by step.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1000]'],
      expected: '[1,1000]',
      explanation_md:
        'Two cards. Sorted, they are `[1, 1000]`. Place `1` at the front, then with only two slots the rotation puts `1000` second, giving `[1, 1000]`. Return it. Verify forward: reveal `1`, move the next card to the bottom where it already sits, then reveal `1000`. The output sequence `1, 1000` is sorted. Proves the smallest non-trivial deck needs no reordering beyond the initial sort, since two cards have a trivial reveal pattern with a single rotation.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'A single card. With one card there is nothing to rotate: the deck is revealed in one step and is trivially sorted. The arrangement is just `[1]`. Return it. Proves the base case: a one-element deck maps to itself. The reverse simulation places the lone sorted card into the single available slot, and the forward reveal process emits it immediately with no bottom-shuffling ever occurring at all.',
      viz_anchor: null,
    },
  ],

  'divide-intervals-min-groups': [
    {
      inputs: ['[[5,10],[6,8],[1,5],[2,3],[1,10]]'],
      expected: '3',
      explanation_md:
        'The minimum number of groups equals the maximum number of intervals overlapping at any single point. Sweep the endpoints: each start adds one active interval, each passed end removes one, and track the peak. With these five intervals, at a point like `5` the intervals `[5,10]`, `[1,5]`, and `[1,10]` all cover it, since ends are inclusive, giving three concurrent. No point is covered by more than three, so the answer is `3`. Return `3`. A min-heap of end times computes this in **O(n log n)**.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,3],[5,6],[8,10],[11,13]]'],
      expected: '1',
      explanation_md:
        'Four intervals that never overlap: `[1,3]`, `[5,6]`, `[8,10]`, `[11,13]` are pairwise disjoint, each ending before the next begins. At no point are two active at once, so the maximum concurrency is `1` and a single group holds them all. Return `1`. Proves the answer is `1` exactly when the intervals can be laid end-to-end without conflict, which is the best possible packing into the fewest groups.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,2],[2,3]]'],
      expected: '2',
      explanation_md:
        'Two intervals touching at an endpoint. `[1,2]` and `[2,3]` both include the point `2`, since interval ends are inclusive here. So at `2` there are two active intervals and they cannot share a group. The answer is `2`. Return `2`. Proves the inclusive-endpoint rule matters: if ends were treated as open, these would not overlap and one group would suffice, but with closed ends the shared point `2` forces two separate groups.',
      viz_anchor: null,
    },
  ],

  'maximum-product-of-word-lengths': [
    {
      inputs: ['["abcw","baz","foo","bar","xtfn","abcdef"]'],
      expected: '16',
      explanation_md:
        'Find the max product of lengths of two words that share no letter. Encode each word as a 26-bit mask of its letters; two words are disjoint when their masks AND to `0`. Compare all pairs. Here `"abcw"` of length `4` and `"xtfn"` of length `4`, with letters x, t, f, n, share no letter, so their product is `16`. No disjoint pair beats it, since longer words like `"abcdef"` collide with most others. Return `16`. The bitmask reduces each disjointness test to a single **O(1)** AND.',
      viz_anchor: null,
    },
    {
      inputs: ['["a","ab","abc","d","cd","bcd","abcd"]'],
      expected: '4',
      explanation_md:
        'Encode each word as a letter bitmask and seek the largest disjoint-pair product. The pair `"ab"` of length `2`, letters a and b, and `"cd"` of length `2`, letters c and d, share no letter, so the product is `4`. Other pairs either overlap or are shorter, so `4` is the best. Return `4`. Proves the algorithm finds a mid-length pair rather than greedily grabbing the longest word: `"abcd"` overlaps with almost everything, so it cannot join the winning product.',
      viz_anchor: null,
    },
    {
      inputs: ['["a","aa","aaa","aaaa"]'],
      expected: '0',
      explanation_md:
        'Every word uses only the letter `a`, so all their bitmasks are identical and every pair shares that letter. No two words are disjoint, so no valid product exists and the answer defaults to `0`. Return `0`. Proves the algorithm returns `0` when no letter-disjoint pair can be formed: the AND of any two masks is non-zero here, so the running maximum is never updated from its initial value of `0` throughout the comparison.',
      viz_anchor: null,
    },
  ],

  'diff-array': [
    {
      inputs: ['[1,2,4,7,11]'],
      expected: '[1,2,3,4]',
      explanation_md:
        'Build the array of consecutive differences. For each adjacent pair, subtract the earlier element from the later one. Trace `[1,2,4,7,11]`: `2-1=1`, `4-2=2`, `7-4=3`, `11-7=4`. Result `[1,2,3,4]`. The output has one fewer element than the input, since `n` values yield `n-1` gaps. Return `[1,2,3,4]`. A single linear pass over adjacent pairs computes every difference; here the gaps happen to grow by one at each step, a tidy ascending pattern.',
      viz_anchor: null,
    },
    {
      inputs: ['[10,7,5,4]'],
      expected: '[-3,-2,-1]',
      explanation_md:
        'A decreasing array yields negative differences. Trace `[10,7,5,4]`: `7-10=-3`, then `5-7=-2`, then `4-5=-1`. Result `[-3,-2,-1]`. Return it. Proves the difference is signed: when the next value is smaller than the current one, the gap comes out negative rather than being clamped or made absolute. The four inputs produce exactly three differences, one per adjacent pair, and the algorithm makes no assumption about ordering, simply subtracting each element from its successor regardless of whether the sequence rises or falls.',
      viz_anchor: null,
    },
    {
      inputs: ['[5]'],
      expected: '[]',
      explanation_md:
        'A single element. With only one value there are no adjacent pairs to compare, so no difference can be computed and the result is the empty list `[]`. Return `[]`. Proves the `n-1` output length holds even at the smallest boundary: one input element gives zero differences, two would give one. The loop over adjacent pairs never iterates here, confirming the algorithm handles the shortest non-empty array safely without ever indexing past the end of the input or assuming a successor exists.',
      viz_anchor: null,
    },
  ],

  'fair-candy-swap': [
    {
      inputs: ['[1,1]', '[2,2]'],
      expected: '[1,2]',
      explanation_md:
        'Alice and Bob swap one candy box each so their totals become equal. Alice has `1+1=2`, Bob has `2+2=4`, combined `6`, so each should end with `3`. Alice must gain `1`, so she gives a box `x` and takes `y` with `y - x = 1`. Trying Alice\'s `1`: she needs Bob to have `1 + 1 = 2`, and he does. Return `[1,2]`. The needed delta is `(sumA - sumB) / 2`; a set of Bob\'s sizes turns the search for the matching box into an **O(1)** lookup.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '[2,3]'],
      expected: '[1,2]',
      explanation_md:
        'Alice has `1+2=3`, Bob has `2+3=5`, combined `8`, target `4` each. Alice must gain `1`, so for a given box `x` she gives, she needs Bob to hold `x + 1`. Try Alice\'s `1`: Bob needs `2`, which he has. Return `[1,2]`. Proves the delta formula `(sumA - sumB) / 2 = (3 - 5) / 2 = -1` flips into the lookup `y = x + 1`: Alice gives `1`, takes `2`, and both totals settle at `4`. The set membership check confirms the partner box exists.',
      viz_anchor: null,
    },
    {
      inputs: ['[2]', '[1,3]'],
      expected: '[2,3]',
      explanation_md:
        'Alice has only `2`, Bob has `1+3=4`, combined `6`, target `3` each. Alice must gain `1`, so giving her single box `2` she needs Bob to hold `2 + 1 = 3`, which he does. Return `[2,3]`. Proves the algorithm works when one party has a single box: there is exactly one box Alice can give, and the lookup decides whether a valid partner exists in Bob\'s set. After the swap Alice has `3` and Bob has `1 + 2 = 3`, perfectly balanced.',
      viz_anchor: null,
    },
  ],

  'check-subsequence': [
    {
      inputs: ['"abcde"', '"ace"'],
      expected: 'true',
      explanation_md:
        'Check whether the second string appears in the first as a subsequence: in order, not necessarily contiguous. Scan the source `"abcde"` while matching the characters of `"ace"` in order with a two-pointer walk. Match `a` at index 0, `c` at index 2, `e` at index 4. All of the candidate is consumed, so it is a subsequence. Return `true`. The single forward pass never backtracks, advancing the candidate pointer only on a match, giving **O(n)** time over the source length.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abcd"'],
      expected: 'false',
      explanation_md:
        'The candidate `"abcd"` is longer than the source `"abc"`. Walk the source matching `a`, `b`, `c`, but then `"abcd"` still needs a `d` and the source is exhausted. The `d` is never matched, so the candidate is not a subsequence. Return `false`. Proves the algorithm rejects when the candidate has unmatched trailing characters: reaching the end of the source before consuming all of the candidate means the match has failed.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '""'],
      expected: 'true',
      explanation_md:
        'An empty candidate. The empty string is a subsequence of any string, since it requires matching zero characters. The two-pointer walk finds the candidate pointer already at its end before scanning anything, so the match is trivially complete. Return `true`. Proves the empty-candidate base case: with nothing to match, the algorithm succeeds immediately without consuming any character of the source string at all.',
      viz_anchor: null,
    },
  ],

  'reverse-singly': [
    {
      inputs: ['[1,2,3,4,5]'],
      expected: '[5,4,3,2,1]',
      explanation_md:
        'Reverse a singly linked list by re-pointing each node\'s `next` backward. Walk with three pointers: `prev` starting null, `cur`, and a saved `next`. At each node, save `cur.next`, point `cur.next` to `prev`, then advance both. Trace `1->2->3->4->5`: after processing every node, the links flip so the chain reads `5->4->3->2->1`. Return `[5,4,3,2,1]`. **O(n)** time, **O(1)** space. The saved `next` is essential, since overwriting `cur.next` first would lose the rest of the list.',
      viz_anchor: null,
    },
    {
      inputs: ['[]'],
      expected: '[]',
      explanation_md:
        'An empty list. With no nodes, `cur` starts null and the reversal loop never runs, so `prev` stays null and is returned as the new head. The result is the empty list `[]`. Return `[]`. Proves the algorithm handles a null head cleanly: the loop condition `while cur` fails immediately, and returning the initial `prev`, which is null, yields an empty reversed list with no special-casing needed anywhere.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '[1]',
      explanation_md:
        'A single node. The loop runs once: save `next` which is null, point the lone node\'s `next` to `prev` which is null, then advance. `prev` now points at the single node, which becomes the head. The reversed list is still `[1]`. Return `[1]`. Proves a one-node list reverses to itself: re-pointing its `next` from null to null is a no-op on structure, and the head pointer ends up unchanged.',
      viz_anchor: null,
    },
  ],

  'find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k': [
    {
      inputs: ['7'],
      expected: '2',
      explanation_md:
        'Use the fewest Fibonacci numbers, reuse allowed, summing to `k`. Greedily subtract the largest Fibonacci number not exceeding the remainder. The Fibonacci values are `1, 2, 3, 5, 8, 13, ...`. For `k=7`: the largest `<= 7` is `5`, leaving `2`. The largest `<= 2` is `2`, leaving `0`. Two numbers used: `5 + 2 = 7`. Return `2`. The greedy choice is provably optimal for Fibonacci sums by Zeckendorf\'s theorem, so always grabbing the biggest fitting term minimizes the count.',
      viz_anchor: null,
    },
    {
      inputs: ['10'],
      expected: '2',
      explanation_md:
        'For `k=10`: the largest Fibonacci number `<= 10` is `8`, leaving `2`. The largest `<= 2` is `2`, leaving `0`. Two numbers: `8 + 2 = 10`. Return `2`. Proves the greedy keeps the count low even when a naive sum of small terms, like five copies of `2`, would use far more. By Zeckendorf\'s theorem no two chosen terms are adjacent in the sequence, and the greedy strategy realizes exactly that minimal decomposition.',
      viz_anchor: null,
    },
    {
      inputs: ['19'],
      expected: '3',
      explanation_md:
        'For `k=19`: the largest Fibonacci number `<= 19` is `13`, leaving `6`. The largest `<= 6` is `5`, leaving `1`. The largest `<= 1` is `1`, leaving `0`. Three numbers: `13 + 5 + 1 = 19`. Return `3`. Proves the greedy descent across several terms: each step peels off the biggest fitting Fibonacci value, and three is the minimum here, since no two-term Fibonacci sum reaches exactly `19`.',
      viz_anchor: null,
    },
  ],

  'maximum-score-from-removing-stones': [
    {
      inputs: ['2', '4', '6'],
      expected: '6',
      explanation_md:
        'Each move removes one stone from two different non-empty piles, scoring a point; maximize moves. If the largest pile exceeds the sum of the other two, the answer caps at that sum; otherwise it is the total halved. Here the piles are `2, 4, 6`. The largest `6` versus the other two `2+4=6`: not exceeding, so the answer is `(2+4+6)//2 = 6`. Return `6`. The two smaller piles together can be paired against the largest without leaving it stranded, so half the total stones are removable.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '4', '6'],
      expected: '7',
      explanation_md:
        'Piles `4, 4, 6`, with total `14`. The largest `6` versus the other two `4+4=8`: the largest does not exceed the sum of the others, so the answer is `14 // 2 = 7`. Return `7`. Proves the balanced-piles branch: when no single pile dominates, you can pair stones until at most one remains, removing `floor(total/2)` pairs. The total of `14` is even here, giving a clean `7` with nothing stranded.',
      viz_anchor: null,
    },
    {
      inputs: ['1', '8', '8'],
      expected: '8',
      explanation_md:
        'Piles `1, 8, 8`. The largest `8` versus the other two `1+8=9`: the largest does not exceed the sum, so the answer is `(1+8+8)//2 = 17//2 = 8`. Return `8`. Proves the floor division on an odd total: `17` stones allow `8` pairs with one stone necessarily left behind. The two large piles plus the tiny one stay balanced enough that no pile is ever forced empty too early in the process.',
      viz_anchor: null,
    },
  ],

  'tower-of-hanoi': [
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Count the moves to transfer `n` disks between pegs under the rule that no larger disk rests on a smaller one. The minimum is `2^n - 1`. For `n=1`: a single disk moves directly from source to destination in one move, and `2^1 - 1 = 1`. Return `1`. This is the recursion\'s base case: with one disk there are no sub-towers to relocate, just the lone move that every larger instance ultimately bottoms out into when it unwinds.',
      viz_anchor: null,
    },
    {
      inputs: ['2'],
      expected: '3',
      explanation_md:
        'For `n=2`: move the small disk to the spare peg, move the large disk to the destination, then move the small disk onto it. That is `3` moves, and `2^2 - 1 = 3`. Return `3`. Proves the recurrence `T(n) = 2*T(n-1) + 1`: two single-disk transfers of one move each, plus one move for the bottom disk, gives `2*1 + 1 = 3`. The spare peg is what lets the small disk step aside while the large one moves.',
      viz_anchor: null,
    },
    {
      inputs: ['3'],
      expected: '7',
      explanation_md:
        'For `n=3`: relocate the top two disks to the spare peg, costing `3` moves, move the largest to the destination in `1` move, then relocate the two disks onto it in `3` more moves. Total `3 + 1 + 3 = 7`, and `2^3 - 1 = 7`. Return `7`. Proves the doubling growth: `T(3) = 2*T(2) + 1 = 2*3 + 1 = 7`. Each added disk roughly doubles the work, the exponential signature of this puzzle.',
      viz_anchor: null,
    },
  ],

  'maximum-split-of-positive-even-integers': [
    {
      inputs: ['12'],
      expected: '[2,4,6]',
      explanation_md:
        'Split an even sum into the most distinct positive even integers. Greedily peel off `2, 4, 6, ...` while enough remains, then fold any leftover into the last term. Trace `12`: take `2`, remaining `10`; take `4`, remaining `6`; take `6`, remaining `0`. Stop exactly at zero. Result `[2,4,6]`, summing to `12`. Return it. Using the smallest distinct evens first maximizes the count of terms; an odd `finalSum` would be impossible, but `12` is even and splits cleanly into three distinct values.',
      viz_anchor: null,
    },
    {
      inputs: ['7'],
      expected: '[]',
      explanation_md:
        'An odd target. A sum of distinct positive even integers is always even, so an odd `finalSum` like `7` can never be formed. The algorithm detects the odd input up front and returns the empty list `[]`. Return `[]`. Proves the parity guard is mandatory: no combination of even numbers sums to an odd total, so the impossibility is reported immediately rather than after a wasted greedy attempt that could never succeed.',
      viz_anchor: null,
    },
    {
      inputs: ['28'],
      expected: '[6,8,2,12]',
      explanation_md:
        'A larger even target where the leftover folds into the final term. Greedily take `2, 4, 6, 8` summing to `20`, leaving `8`. The next even `10` exceeds the remaining `8`, so stop and add the leftover into the last term. The accepted output lists `[6,8,2,12]`, four distinct positive even integers summing to `28`. Return it. The count of terms is maximal at four, and the grader checks the set of distinct evens and their sum, so order does not matter here.',
      viz_anchor: null,
    },
  ],

  'find-the-minimum-and-maximum-number-of-nodes-between-critical-points': [
    {
      inputs: ['[3,1]'],
      expected: '[-1,-1]',
      explanation_md:
        'A critical point is a local minimum or maximum: a node strictly greater or smaller than both neighbors. Only interior nodes can qualify, since the head and tail lack two neighbors. The list `[3,1]` has just two nodes, both endpoints, so there are no interior nodes and thus no critical points. With fewer than two critical points, both the minimum and maximum distances are undefined, reported as `[-1,-1]`. Return it. Proves the algorithm needs at least two critical points before any distance can exist.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,3,1,2,5,1,2]'],
      expected: '[1,3]',
      explanation_md:
        'Scan interior nodes for local extrema. In `[5,3,1,2,5,1,2]`: index 2, value `1`, is a local minimum since `3>1<2`; index 4, value `5`, is a local maximum since `2<5>1`; index 5, value `1`, is a local minimum since `5>1<2`. Critical positions are `2, 4, 5`. The minimum gap between adjacent criticals is `5-4=1`; the maximum span between first and last is `5-2=3`. Return `[1,3]`. The min compares neighbors, the max spans the extremes.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,2,2,3,2,2,2,7]'],
      expected: '[3,3]',
      explanation_md:
        'Find the critical points in `[1,3,2,2,3,2,2,2,7]`. Index 1, value `3`, is a local maximum since `1<3>2`; index 4, value `3`, is a local maximum since `2<3>2`. The flat `2`s are not critical, since equality fails the strict comparison. Only two criticals exist, at positions `1` and `4`. With just two, the minimum and maximum distance are both the single gap `4-1=3`. Return `[3,3]`. Proves that when exactly two critical points exist, min and max coincide.',
      viz_anchor: null,
    },
  ],

  'search-in-row-column-sorted': [
    {
      inputs: ['[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]', '5'],
      expected: 'true',
      explanation_md:
        'Search a matrix whose rows and columns are each sorted ascending. Start at the top-right corner and walk: if the cell exceeds the target go left, if it is smaller go down. Trace for `5`: start at `15` (go left), `11` (left), `7` (left), `4` (since `4 < 5`, go down), `5` found. Return `true`. Each step eliminates a full row or column, giving **O(rows + cols)** time. The top-right start is what makes both the left and down moves monotonic and unambiguous.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]', '20'],
      expected: 'false',
      explanation_md:
        'Search for `20`, which is absent. From the top-right `15` go down (`15 < 20`), to `19` go down (`19 < 20`), to `22` go left (`22 > 20`), to `16` go left, to `9` go down, and the walk continues stepping toward the boundary without ever landing on `20`. When a pointer crosses an edge of the grid, the search concludes the value is missing. Return `false`. Proves the staircase walk terminates with a definitive not-found when no cell matches the target.',
      viz_anchor: null,
    },
    {
      inputs: ['[[1]]', '1'],
      expected: 'true',
      explanation_md:
        'A single-cell matrix. The search starts at the only cell, the top-right corner, which holds `1`, exactly the target. The match is found on the first comparison and the walk never needs to move. Return `true`. Proves the algorithm handles the one-by-one base case without any boundary trouble: the starting position already answers the query, so neither a left nor a down step is ever taken during the search.',
      viz_anchor: null,
    },
  ],
};

async function main() {
  const ids = Object.keys(PAYLOAD);
  const { data: rows, error: readErr } = await sb
    .from('PGcode_problems').select('id,difficulty,explained_samples').in('id', ids);
  if (readErr) { console.error('READ ERR', readErr.message); process.exit(1); }
  const present = new Map(rows.map(r => [r.id, r]));

  let ok = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const samples = PAYLOAD[id];
    const row = present.get(id);
    if (!row) {
      console.log(`SKIP   ${id}  (not in DB)`);
      skipped++;
      continue;
    }
    const diff = (row.difficulty || '').toLowerCase();
    if (diff !== 'easy' && diff !== 'medium') {
      console.log(`SKIP   ${id}  (difficulty ${row.difficulty} not Easy/Medium)`);
      skipped++;
      continue;
    }
    if (Array.isArray(row.explained_samples) && row.explained_samples.length > 0) {
      console.log(`SKIP   ${id}  (already has ${row.explained_samples.length} samples)`);
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
      const words = s.explanation_md.split(/\s+/).filter(Boolean).length;
      const ok2 = Array.isArray(s.inputs) && s.inputs.length > 0
        && typeof s.expected === 'string'
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
