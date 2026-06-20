#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 12.
// Focus area: math + bit manipulation.
// Only includes problems NOT already at explained_samples.length === 3.
// Run: node scripts/backfill-explained-samples-batch12.mjs

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
  'hamming-distance': [
    {
      inputs: ['1', '4'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Hamming distance = count of differing bits, computed as `popcount(x ^ y)`. Here `x=1=0b001`, `y=4=0b100`. XOR aligns the bits and flips the ones that differ: `0b001 ^ 0b100 = 0b101 = 5`. Now count set bits in `5 = 0b101` → two `1`s, so distance is `2`. The XOR trick avoids a per-bit loop with conditionals — one machine instruction turns "differs" into a `1` and "same" into a `0`, then `popcount` (or `bin(z).count("1")`) tallies them. Return `2`.',
      viz_anchor: null,
    },
    {
      inputs: ['3', '1'],
      expected: '1',
      explanation_md:
        'Edge case where only the lowest bit position differs. `x=3=0b011`, `y=1=0b001`. XOR: `0b011 ^ 0b001 = 0b010 = 2`. The lower bit is identical (`1=1`), the bit-1 position is `1` vs `0` (differs), bit-2 position is `0=0`. Only one bit set in `0b010`, so the distance is `1`. Proves the algorithm correctly reports a single-bit gap and does not over-count by inspecting positions that are identical.',
      viz_anchor: null,
    },
    {
      inputs: ['0', '0'],
      expected: '0',
      explanation_md:
        'Boundary: identical inputs. `x=0=0b0`, `y=0=0b0`. XOR with self is always `0` (the defining property of XOR). `popcount(0) = 0`. A naive implementation that iterates a fixed 32 bits with a conditional `if a != b` still returns `0`, but the XOR-then-popcount form does it in two cycles with no loop. This case also catches a bug where the loop initializes the counter at `1` or fails to early-return for equal inputs — neither happens here.',
      viz_anchor: null,
    },
  ],

  'total-hamming-distance': [
    {
      inputs: ['[4,14,2]'],
      expected: '6',
      explanation_md:
        'Canonical LC example. A naive O(n^2) sums `hammingDistance(a,b)` over every pair. The trick: for each bit position, if `k` of `n` numbers have a `1` there, that bit contributes `k * (n-k)` to the total (every `1`-bearer paired with every `0`-bearer). `4=0b0100`, `14=0b1110`, `2=0b0010`. Bit-0: zero `1`s → 0. Bit-1: `14` and `2` → k=2, n-k=1 → 2. Bit-2: `4` and `14` → k=2, n-k=1 → 2. Bit-3: `14` → k=1, n-k=2 → 2. Total `0+2+2+2 = 6`. **O(32·n)** vs O(n^2).',
      viz_anchor: null,
    },
    {
      inputs: ['[4,14,4]'],
      expected: '4',
      explanation_md:
        'Duplicates included — proves bits in identical numbers contribute zero (they "agree" on every position). `4=0b0100`, `14=0b1110`, `4=0b0100`. Bit-0: 0 ones → 0. Bit-1: only `14` → k=1, n-k=2 → 2. Bit-2: all three → k=3, n-k=0 → 0. Bit-3: only `14` → k=1, n-k=2 → 2. Sum `0+2+0+2 = 4`. The two `4`s contribute nothing to each other (k*(n-k) is symmetric and the pair `(4,4)` has hamming distance 0), which is exactly what the formula encodes.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '0',
      explanation_md:
        'Single-element edge. With n=1, no pairs exist, so the answer must be `0`. The formula confirms: at every bit position k is 0 or 1, and `n-k` is `1` or `0`, so `k*(n-k) = 0` always. A buggy implementation that loops `for i in nums: for j in nums` without an `i<j` guard would still count `(0,0)` as distance 0 — same answer here but wrong on larger inputs. The bit-counting approach gracefully returns `0` without special-casing n=1.',
      viz_anchor: null,
    },
  ],

  'binary-watch': [
    {
      inputs: ['1'],
      expected: '["0:01","0:02","0:04","0:08","0:16","0:32","1:00","2:00","4:00","8:00"]',
      explanation_md:
        'Canonical LC example. A binary watch has 4 hour LEDs (values 1,2,4,8) and 6 minute LEDs (1,2,4,8,16,32). With exactly `turnedOn=1` LED lit, enumerate every `(h, m)` with `h in [0,11]`, `m in [0,59]`, and `popcount(h) + popcount(m) == 1`. Hours of popcount 1: 1=0b0001, 2=0b0010, 4=0b0100, 8=0b1000 — pairs with `m=0`. Minutes of popcount 1: 1,2,4,8,16,32 — pairs with `h=0`. Sort lexicographically (or by `h:m`) and format. The result lists the 4 single-bit hours after the 6 single-bit minutes.',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '["0:00"]',
      explanation_md:
        'Edge case: no LEDs lit means every bit is `0`. The only `(h, m)` with `popcount(h) + popcount(m) == 0` is `(0, 0)`. Format as `"0:00"`. A naive solution that hard-codes the count of valid combinations for each `turnedOn` value would need a special-case for 0; the popcount-enumeration approach handles it uniformly — the outer loops still run, and exactly one pair survives the filter.',
      viz_anchor: null,
    },
    {
      inputs: ['9'],
      expected: '[]',
      explanation_md:
        'Algorithmically interesting: maximum LEDs possible is `popcount(11) + popcount(59) = popcount(0b1011) + popcount(0b111011) = 3 + 5 = 8`. With `turnedOn=9`, no valid `(h,m)` exists, so the result is empty. A buggy implementation that enumerates all 12*60=720 combinations without an early bound-check still terminates correctly here, but a smarter solver shortcircuits when `turnedOn > 8`. Either way the answer is `[]` — this case catches any implementation that incorrectly returns a stray `"0:00"` or crashes on impossible inputs.',
      viz_anchor: null,
    },
  ],

  'maximum-xor-of-two-numbers-in-an-array': [
    {
      inputs: ['[3,10,5,25,2,8]'],
      expected: '28',
      explanation_md:
        'Canonical LC example. Brute force is O(n^2). The trick: build the answer bit-by-bit from the most significant bit down. At each bit `i`, assume the next bit of the max XOR is `1`, then check: does any pair of numbers, when masked to the top `i` bits, XOR to that target? Use a hash set of prefixes. For `[3,10,5,25,2,8]` the answer is `25 ^ 5 = 0b11001 ^ 0b00101 = 0b11100 = 28`. The bit-trie / prefix-set approach runs in **O(32·n)** — at every level we greedily try to flip the next bit on.',
      viz_anchor: null,
    },
    {
      inputs: ['[0]'],
      expected: '0',
      explanation_md:
        'Edge case: single element. With only one number, the only "pair" is `(0, 0)` (the same element with itself if allowed, but the standard formulation requires i != j and returns 0 when n < 2). Most implementations short-circuit on `len(nums) < 2` and return `0`. A buggy solver that always returns the max single value would return `0` here too — same answer by coincidence. This case mainly catches a crash from indexing into an empty trie or out-of-bounds access on the prefix set.',
      viz_anchor: null,
    },
    {
      inputs: ['[8,10,2]'],
      expected: '10',
      explanation_md:
        'Small case where the greedy bit-by-bit construction shines. `8=0b1000`, `10=0b1010`, `2=0b0010`. Try to set bit 3 of the answer: need two numbers whose bit-3 differs. `8` and `2` differ at bit 3 → keep bit 3 set, target so far `0b1000`. Try bit 2: prefixes `0b1000, 0b1010, 0b0010` — does any pair XOR to a prefix with bit 2 set? `8^2 = 0b1010 → bit 1 set, not bit 2`. Try bit 1: `8^2 = 0b1010` has bit 1 set → keep. Final `8^2 = 0b1010 = 10`. The algorithm builds `10` greedily without enumerating all C(3,2)=3 pairs.',
      viz_anchor: null,
    },
  ],

  'ugly-number': [
    {
      inputs: ['6'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. An "ugly number" has only `2, 3, 5` as prime factors. Algorithm: repeatedly divide `n` by each of `2, 3, 5` while divisible, then check if the residue is `1`. `n=6`: divide by 2 → `3`. Divide by 3 → `1`. Divide by 5 → no-op. Residue is `1` → return `true`. The order of trial doesn\'t matter — every factor of `2/3/5` eventually gets stripped. **O(log n)** since each division at least halves `n`.',
      viz_anchor: null,
    },
    {
      inputs: ['14'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: contains the forbidden prime `7`. `n=14`: divide by 2 → `7`. Divide by 3 → no-op. Divide by 5 → no-op. Residue is `7`, not `1` → return `false`. This case catches a buggy implementation that only checks divisibility by 2 and 3 (returning `true` because 14 reduces to 7, then incorrectly concluding "prime, not in {2,3,5}, false") — both right and wrong solutions return `false` here, but the trace must end with the explicit residue check at `7`, not with a fall-through to `true`.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: 'true',
      explanation_md:
        'Edge case: `1` is conventionally ugly (the empty product of `{2,3,5}` factors). Algorithm: no divisions happen because `1 % 2 != 0`, `1 % 3 != 0`, `1 % 5 != 0`. Residue stays `1` → return `true`. A buggy implementation that initializes `is_ugly = false` and only flips it inside a divisor-loop would return `false` here. The correct version starts with the residue and asks "did we reduce to 1?" — which is trivially yes for input `1`. Non-positive inputs (`0`, `-6`) return `false` by the leading guard.',
      viz_anchor: null,
    },
  ],

  'ugly-number-ii': [
    {
      inputs: ['10'],
      expected: '12',
      explanation_md:
        'Canonical LC example. The sequence of ugly numbers is `1, 2, 3, 4, 5, 6, 8, 9, 10, 12, ...` — note `7, 11` are skipped (prime factors outside `{2,3,5}`). Generate via three pointers `i2, i3, i5` into the sequence itself: next ugly = `min(2*ugly[i2], 3*ugly[i3], 5*ugly[i5])`. Advance whichever pointer(s) matched (multiple may match — `6 = 2*3 = 3*2` advances both `i2` and `i3` to avoid duplicates). The 10th ugly number (1-indexed) is `12 = 2^2 * 3`. **O(n)** time, **O(n)** space — beats heap solutions by a constant factor.',
      viz_anchor: null,
    },
    {
      inputs: ['1'],
      expected: '1',
      explanation_md:
        'Edge case: the first ugly number. By convention `1` is the smallest ugly number (empty prime-factor product). The algorithm seeds `ugly[0] = 1` and immediately returns when `n == 1`. A buggy implementation that starts the sequence at `2` (the smallest prime in `{2,3,5}`) would return `2` here — wrong. The leading `1` matters because every subsequent ugly number is built by multiplying it (or a later term) by `2, 3, 5`, so `1` anchors the generation.',
      viz_anchor: null,
    },
    {
      inputs: ['11'],
      expected: '15',
      explanation_md:
        'The pointer dance after `12`. Sequence so far: `[1,2,3,4,5,6,8,9,10,12]` (n=10). For n=11: candidates are `2*ugly[i2]`, `3*ugly[i3]`, `5*ugly[i5]`. After `12` the pointers sit at `i2=6 (ugly[6]=8 → 16)`, `i3=4 (ugly[4]=5 → 15)`, `i5=2 (ugly[2]=3 → 15)`. Min is `15`. Both `i3` and `i5` matched — advance both to skip the duplicate that would arrive on the next step. Append `15`. The double-advance is the key invariant that keeps the sequence strictly increasing without de-duplication post-hoc.',
      viz_anchor: null,
    },
  ],

  'fizz-buzz': [
    {
      inputs: ['3'],
      expected: '["1","2","Fizz"]',
      explanation_md:
        'Canonical LC example. For each `i` in `[1, n]`, check divisibility: by `15` → `"FizzBuzz"`, else by `3` → `"Fizz"`, else by `5` → `"Buzz"`, else stringify `i`. Order matters — check `15` before `3` or `5`, otherwise `15` would return `"Fizz"` and miss the combined case. Trace `n=3`: `i=1` → `"1"`. `i=2` → `"2"`. `i=3` → divisible by 3 → `"Fizz"`. Result `["1","2","Fizz"]`. A common bug is using `i % 3 == 0 and i % 5 == 0` as the last branch instead of first — it never fires because the earlier `i % 3` branch already returned.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '["1","2","Fizz","4","Buzz"]',
      explanation_md:
        'Adds the first `"Buzz"` to the trace. `i=4` → not divisible by 3 or 5 → `"4"`. `i=5` → divisible by 5 → `"Buzz"`. The single-digit boundary is the only one tested here, but it catches off-by-one bugs where the loop runs `range(n)` instead of `range(1, n+1)` (returning `["0", ..., "Fizz","4"]` and missing `"Buzz"`). Confirms the upper bound is inclusive.',
      viz_anchor: null,
    },
    {
      inputs: ['15'],
      expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
      explanation_md:
        'Algorithmically interesting: triggers the first `"FizzBuzz"` at `i=15`. Divisible by both 3 and 5. If the implementation checks `i % 15 == 0` first (or equivalently `i % 3 == 0 and i % 5 == 0`), it returns `"FizzBuzz"`. If the implementation checks `i % 3 == 0` first and returns immediately, it returns `"Fizz"` — wrong. This case is the entire reason the divisibility check has three branches with the most-restrictive condition first. Required reading for any code-review of FizzBuzz.',
      viz_anchor: null,
    },
  ],

  'roman-to-integer': [
    {
      inputs: ['"III"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Map each Roman symbol to its value (`I=1, V=5, X=10, L=50, C=100, D=500, M=1000`). Scan left-to-right: if a symbol is smaller than the next one, subtract it; otherwise add it. For `"III"`: each `I` is followed by another `I` (not larger), so each is added → `1 + 1 + 1 = 3`. The subtractive rule does not fire. Simple additive case.',
      viz_anchor: null,
    },
    {
      inputs: ['"IV"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: the smallest subtractive form. `I=1`, `V=5`. `I < V` → subtract `I` instead of adding it. Then `V=5` is added at end → total `-1 + 5 = 4`. A buggy implementation that uses a `last_value` running variable and naively adds `value(c)` would give `1 + 5 = 6` — wrong. The standard fix is the "if smaller than next, subtract" rule on the current scan position, which catches `IV, IX, XL, XC, CD, CM` uniformly with no special cases.',
      viz_anchor: null,
    },
    {
      inputs: ['"MCMXCIV"'],
      expected: '1994',
      explanation_md:
        'Multi-segment subtractive case stress test. Decompose: `M=1000`, `CM=900`, `XC=90`, `IV=4` → `1000+900+90+4 = 1994`. Left-to-right scan: `M`(1000) then `C`(100) < `M`(1000) next → subtract `C` → -100. Then `M`(1000) added → +1000. Then `X`(10) < `C`(100) next → -10. Then `C`(100) added → +100. Then `I`(1) < `V`(5) next → -1. Then `V`(5) added → +5. Running sum: `1000 - 100 + 1000 - 10 + 100 - 1 + 5 = 1994`. Proves the look-ahead rule composes correctly across three subtractive pairs in one string.',
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
  if (readErr) {
    console.log(`x ${slug}: read failed — ${readErr.message}`);
    failed++;
    continue;
  }
  if (!existing) {
    console.log(`- ${slug}: not in DB, skipping`);
    skipped++;
    continue;
  }
  if (Array.isArray(existing.explained_samples) && existing.explained_samples.length === 3) {
    console.log(`- ${slug}: already has 3 samples, skipping`);
    skipped++;
    continue;
  }
  const { error } = await sb
    .from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) {
    console.log(`x ${slug}: ${error.message}`);
    failed++;
  } else {
    console.log(`+ ${slug}`);
    ok++;
  }
}
console.log(`\nok=${ok} failed=${failed} skipped=${skipped}`);
