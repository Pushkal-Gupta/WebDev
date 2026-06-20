#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples for 10 flagship interview problems.
// Each row gets 3 hand-written worked samples shaped:
//   { inputs: [str], expected: str, explanation_md: str, viz_anchor: str|null }
// viz_anchor is null for everything in this batch — wired in a later pass.
//
// Sample 1: canonical LC example (small, demonstrative).
// Sample 2: edge case (empty / single / all-same / bounds).
// Sample 3: a case that exercises the interesting algorithmic branch.
//
// Run: node scripts/backfill-explained-samples.mjs

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

// ─── 10 problems × 3 explained samples each ─────────────────────────────────
const PAYLOAD = {
  'two-sum': [
    {
      inputs: ['[2,7,11,15]', '9'],
      expected: '[0,1]',
      explanation_md:
        'The canonical LeetCode example. The brute-force pair scan would try `(2,7)`, hit `9`, and stop — that works but costs **O(n²)**. The hash-map approach walks once: at index 0 we store `{2: 0}`, then at index 1 we ask "have we seen `9 - 7 = 2`?" Yes — at index `0`. Return `[0, 1]` immediately. The trick is to record each number with its index **before** asking about the complement, so a single pass is enough.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,3]', '6'],
      expected: '[0,1]',
      explanation_md:
        'The duplicate-value edge case. A naive map keyed by `value -> index` that pre-builds the whole dictionary before scanning will overwrite the first `3` with the second, then ask "where is `3`?" and return `[1, 1]` — wrong, indices must differ. The streaming variant dodges this: at index 0 the map is empty, we miss and store `{3: 0}`; at index 1 we ask "is `6 - 3 = 3` in the map?" Yes at index `0`. Return `[0, 1]`. Same `O(n)` time, no duplicate-key trap.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1,-2,-3,-4,-5]', '-8'],
      expected: '[2,4]',
      explanation_md:
        'All-negative inputs with a negative target — the case that breaks any solution that assumed positive sums. The hash map does not care about sign: we walk, store `-1 -> 0`, `-2 -> 1`, `-3 -> 2`, then at index 3 with value `-4` we look for `-8 - (-4) = -4`; not present, store it. At index 4 with `-5` we look for `-8 - (-5) = -3` — hit at index `2`. Return `[2, 4]`. Sign handling falls out for free because hashing operates on raw values.',
      viz_anchor: null,
    },
  ],

  'valid-parentheses': [
    {
      inputs: ['"()[]{}"'],
      expected: 'true',
      explanation_md:
        'The canonical example with all three bracket types side by side. The stack starts empty. We push `(`, then see `)` — top is `(`, matched, pop. Push `[`, see `]`, matched, pop. Push `{`, see `}`, matched, pop. Stack empty at the end → valid. The pairing map (`)` → `(`, `]` → `[`, `}` → `{`) is the entire trick; everything else is bookkeeping.',
      viz_anchor: null,
    },
    {
      inputs: ['""'],
      expected: 'true',
      explanation_md:
        'The empty-input edge case. An empty bracket sequence is **trivially balanced** — there is nothing unmatched. The brittle solution that returns `false` whenever it never pushes anything is wrong; the correct check is simply "is the stack empty at the end?" — and with an empty input that check passes by default.',
      viz_anchor: null,
    },
    {
      inputs: ['"([)]"'],
      expected: 'false',
      explanation_md:
        'The interleaving trap. Surface-level counters that just match counts of `(` vs `)`, `[` vs `]`, `{` vs `}` will pass this — there are equal counts of each — but the brackets cross. The stack discipline catches it: push `(`, push `[`, then see `)` — top of stack is `[`, not `(`, so close-mismatch → return `false`. This is exactly the input that proves a stack is necessary; a counter solution can never tell `([)]` apart from `()[]`.',
      viz_anchor: null,
    },
  ],

  'merge-two-sorted-lists': [
    {
      inputs: ['[1,2,4]', '[1,3,4]'],
      expected: '[1,1,2,3,4,4]',
      explanation_md:
        'The canonical example. The walk uses a dummy head node so we never have to special-case the very first append. Pointers `a` and `b` start at the heads. Compare `1` vs `1` — tie, take from `a`, advance `a`. Compare `2` vs `1` — take `b`. `2` vs `3` — take `a`. `4` vs `3` — take `b`. `4` vs `4` — tie, take `a`. `b` still has `[4]`, append the remainder. Result `[1,1,2,3,4,4]`.',
      viz_anchor: null,
    },
    {
      inputs: ['[]', '[0]'],
      expected: '[0]',
      explanation_md:
        'The one-list-empty edge case. A buggy implementation that enters the comparison loop without guarding can dereference `null` on the empty side. The dummy-head pattern avoids this: the main loop runs `while a and b`, exits immediately when `a` is empty, and the **tail-append** step (`tail.next = a or b`) hands over the surviving list whole. Result `[0]`, no null deref, one allocation total for the dummy.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,5]', '[2,4,6]'],
      expected: '[1,2,3,4,5,6]',
      explanation_md:
        'The perfect-interleave case. Every comparison flips the chosen side: take `1` from `a`, take `2` from `b`, `3` from `a`, `4` from `b`, `5` from `a`, then `a` is empty, append `b`s remaining `[6]`. This is the input that proves the merge runs in `O(n + m)` time with no wasted work — every comparison produces exactly one output node, and the leftover-tail handoff covers the final element in `O(1)`.',
      viz_anchor: null,
    },
  ],

  'maximum-subarray': [
    {
      inputs: ['[-2,1,-3,4,-1,2,1,-5,4]'],
      expected: '6',
      explanation_md:
        'The canonical LC example. Kadane walks left to right keeping two numbers: `cur` (best subarray ending at the current index) and `best` (best seen anywhere). At each step `cur = max(nums[i], cur + nums[i])` — either extend the running window or start fresh. Trace: `cur = -2, 1, -2, 4, 3, 5, 6, 1, 5`; `best` peaks at `6` when the running window is `[4,-1,2,1]`. Return `6`. `O(n)` time, `O(1)` extra space.',
      viz_anchor: null,
    },
    {
      inputs: ['[-1]'],
      expected: '-1',
      explanation_md:
        'The all-negative single-element case. The naive Kadane that initialises `best = 0` returns `0` here — wrong, because the problem requires a **non-empty** subarray. The fix: seed `best = nums[0]` (or `-inf`) so the answer can be negative when every number is. With the correct seed, the single iteration sets `cur = -1`, `best = -1`. Return `-1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[5,4,-1,7,8]'],
      expected: '23',
      explanation_md:
        'The "running window dips but recovers" case. After `5, 4` we have `cur = 9, best = 9`. The `-1` drops `cur` to `8` — a naive reset on any negative number would discard the run and lose. Kadane only resets when `nums[i]` alone beats `cur + nums[i]`, which it does not here (`-1 vs 8`). Continuing: `cur = 15, 23`, `best = 23`. The whole array is the best subarray, and the temporary dip never tempts the algorithm to abandon it.',
      viz_anchor: null,
    },
  ],

  'climbing-stairs': [
    {
      inputs: ['2'],
      expected: '2',
      explanation_md:
        'The smallest non-trivial case. With 2 stairs you can take two 1-steps or one 2-step — two ways. This is the base case the recurrence depends on: `ways(n) = ways(n-1) + ways(n-2)`. Memoising or iterating with two variables solves it in `O(n)` time and `O(1)` space. The naive recursion without memo blows up to `O(2^n)` — fine for `n = 2` but catastrophic by `n = 40`.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'The base-case edge. One stair has exactly one way to climb — a single 1-step. Implementations that hard-code only `ways(0) = 1, ways(1) = 1` and start the loop at `i = 2` work cleanly; ones that special-case the loop bounds wrong will return `2` (treating `n = 1` as if the `ways(n-2)` branch was reachable). The correct iterative version returns the right answer for both `n = 1` and `n = 2` without any extra check.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '8',
      explanation_md:
        'The "see the Fibonacci" case. The recurrence is exactly Fibonacci shifted by one: 1, 2, 3, 5, **8**. Tracing the two-variable iterative DP: `a = 1, b = 2`; then `(a, b) = (2, 3), (3, 5), (5, 8)`. Return `8`. The exponential-time naive recursion would recompute `ways(3)` and `ways(2)` repeatedly along the call tree — the `O(n)` rolling-variable trick reuses each subproblem exactly once.',
      viz_anchor: null,
    },
  ],

  'best-time-to-buy-and-sell-stock': [
    {
      inputs: ['[7,1,5,3,6,4]'],
      expected: '5',
      explanation_md:
        'The canonical LC example. Brute-force tries every `(buy, sell)` pair — `O(n²)`. The one-pass approach tracks `minPrice` and `bestProfit`. Walk: at `7` set `minPrice = 7`. At `1` update `minPrice = 1`. At `5` profit `5 - 1 = 4`, `best = 4`. At `3` profit `2`. At `6` profit `5`, `best = 5`. At `4` profit `3`. Return `5`. Buy at index 1, sell at index 4.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,6,4,3,1]'],
      expected: '0',
      explanation_md:
        'The strictly-decreasing edge case. Every later day is cheaper than the buy day, so no transaction is profitable. The algorithm never updates `bestProfit` above `0`. The brittle implementation that returns the **maximum drop** instead would return `-6` here — wrong, because the problem allows "no transaction" as a valid choice. Always seed `bestProfit = 0` and only update on positive gains.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,4,1,7]'],
      expected: '6',
      explanation_md:
        'The "best buy comes after a worse buy" case. A naive greedy that buys at the first local minimum and sells at the next local maximum gets `4 - 2 = 2` and stops — wrong. The one-pass `minPrice` approach updates `minPrice = 1` when day 2 drops below day 0, then catches the `7 - 1 = 6` on day 3. The trick is that `minPrice` is allowed to update **after** profits have already been recorded, so a future cheaper buy never invalidates an earlier sell — but it does enable a better future sell.',
      viz_anchor: null,
    },
  ],

  'single-number': [
    {
      inputs: ['[2,2,1]'],
      expected: '1',
      explanation_md:
        'The canonical LC example. The hash-map approach counts each element and returns the one with count `1` — works but uses `O(n)` extra space. The optimal XOR trick uses `O(1)` space: XOR every number into an accumulator. `2 ^ 2 = 0`, then `0 ^ 1 = 1`. Return `1`. Identical pairs cancel because `x ^ x = 0`, and `0 ^ y = y` leaves the lone survivor intact.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]'],
      expected: '1',
      explanation_md:
        'The single-element edge case. The accumulator starts at `0`. XOR with `1` gives `1`. Return `1`. The implementation that seeds the accumulator with `nums[0]` and starts the loop at index 1 also works, but the cleaner `acc = 0` start handles this case with zero special-casing — the empty fold and the one-element fold both produce the right answer.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,1,2,1,2]'],
      expected: '4',
      explanation_md:
        'The "duplicates are not adjacent" case. A naive solution that walks the sorted array looking at adjacent pairs would need an `O(n log n)` sort first. The XOR approach handles arbitrary order in one pass: `0 ^ 4 = 4`, `4 ^ 1 = 5`, `5 ^ 2 = 7`, `7 ^ 1 = 6`, `6 ^ 2 = 4`. Return `4`. XOR is both commutative and associative, so the order the duplicates appear in is irrelevant — every pair cancels regardless of position.',
      viz_anchor: null,
    },
  ],

  'linked-list-cycle': [
    {
      inputs: ['[3,2,0,-4]', '1'],
      expected: 'true',
      explanation_md:
        'The canonical LC example — list `3 → 2 → 0 → -4 → (back to 2)`. The hash-set approach records every visited node and returns `true` when a node is seen twice — works but uses `O(n)` extra space. Floyd\'s tortoise-and-hare runs in `O(1)` space: slow advances 1 step per tick, fast 2 steps. Inside the cycle the gap shrinks by 1 each tick, so they eventually collide. `pos = 1` means the tail `-4` loops back to the node at index 1 (`2`), forming a cycle of length 3. Return `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['[1]', '-1'],
      expected: 'false',
      explanation_md:
        'The single-node no-cycle edge case (`pos = -1` means no cycle). Slow starts at `1`, fast starts at `1`. Fast tries to advance 2 steps: `fast.next` is `None`, so we exit the loop immediately and return `false`. The brittle implementation that initialises `slow = head, fast = head.next` would dereference `None` here. The robust version always checks `fast and fast.next` before advancing.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '0'],
      expected: 'true',
      explanation_md:
        'The smallest possible cycle — two nodes, each pointing to the other. Slow at `1`, fast at `1`. Tick 1: slow at `2`, fast at `1` (advanced twice around the 2-cycle). Tick 2: slow at `1`, fast at `1` — collision, return `true`. This is the input that proves Floyd works even when the cycle length is shorter than the lead the fast pointer needs; the modular nature of "advance twice in a 2-node loop" lands the fast pointer back where it started, and slow catches up in exactly one extra tick.',
      viz_anchor: null,
    },
  ],

  'valid-anagram': [
    {
      inputs: ['"anagram"', '"nagaram"'],
      expected: 'true',
      explanation_md:
        'The canonical example. The brute-force approach sorts both strings and compares — `O(n log n)`. The optimal counts characters in a 26-slot array: increment for each char in `s`, decrement for each char in `t`, then check all slots are zero. Both strings have three `a`s, one each of `n`, `g`, `r`, `m`. Every slot lands at zero → return `true`. `O(n)` time, `O(1)` space.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '""'],
      expected: 'true',
      explanation_md:
        'The empty-strings edge case. Two empty strings are trivially anagrams of each other — the multiset of characters is the same (both empty). The counting array is never touched, the final check finds all zeros, return `true`. The brittle implementation that early-returns `false` when `not s` is wrong; the right early-return is the length mismatch check: `len(s) != len(t) → false`, which already correctly handles `("", "a")` and `("a", "")`.',
      viz_anchor: null,
    },
    {
      inputs: ['"rat"', '"car"'],
      expected: 'false',
      explanation_md:
        'The same-length non-anagram. Equal lengths means the length-mismatch guard does not fire, so the algorithm has to actually count. After processing both strings, the count for `a` ends at `0` (matched), but `c` ends at `-1` (only `t` had it), `r` ends at `0`, and `t` ends at `+1` (only `s` had it). Any non-zero slot → return `false`. This case proves the counter approach cannot short-circuit on length alone — the actual character distribution has to be checked.',
      viz_anchor: null,
    },
  ],

  'longest-common-prefix': [
    {
      inputs: ['["flower","flow","flight"]'],
      expected: '"fl"',
      explanation_md:
        'The canonical LC example. Horizontal scan: start with `prefix = "flower"`. Compare with `"flow"` — common prefix is `"flow"`. Compare with `"flight"` — common prefix is `"fl"`. Return `"fl"`. Vertical scan does it column by column: column 0 is all `f`, column 1 is all `l`, column 2 mixes `o, o, i` → stop. Either approach is `O(S)` where `S` is the total characters.',
      viz_anchor: null,
    },
    {
      inputs: ['[""]'],
      expected: '""',
      explanation_md:
        'The empty-string edge case. With a single empty string in the list, the common prefix can only be the empty string. The horizontal scan starts with `prefix = ""`, no comparisons happen, returns `""`. Vertical scan immediately hits the end of `strs[0]` at column `0` and returns `""`. Both implementations handle this without a special case — provided the bounds check `i < len(strs[0])` runs **before** any character access.',
      viz_anchor: null,
    },
    {
      inputs: ['["dog","racecar","car"]'],
      expected: '""',
      explanation_md:
        'The "no common prefix at all" case. Vertical scan at column `0` sees `d, r, c` — mismatch on the very first character → return `""`. Horizontal scan starts with `prefix = "dog"`, compares with `"racecar"` — common prefix `""`. Early-exit on empty prefix can save work on the third string. This is the case that catches a buggy implementation returning `"a"` (the longest common **substring** would include `"a"`, but prefix must be at position 0).',
      viz_anchor: null,
    },
  ],
};

// ─── Apply ───────────────────────────────────────────────────────────────────
async function main() {
  const ids = Object.keys(PAYLOAD);
  // Read current rows so we skip silently when something is missing.
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
    // Validate shape.
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
      console.log(`OK     ${id}  (3 samples)`);
      ok++;
    }
  }
  console.log(`\nDone. ok=${ok}  skipped=${skipped}  failed=${failed}  total=${ids.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
