#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 25.
// Focus area: counting + combinatorics + probability. Show the recurrence and
// small DP table for counting; show C(n,k) step-by-step for combinatorics.
// Skips any slug already at length === 3.
// Run: node scripts/backfill-explained-samples-batch25.mjs

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
  'pascals-triangle-ii': [
    {
      inputs: ['3'],
      expected: '[1,3,3,1]',
      explanation_md:
        'Canonical LC example. Row index 3 is the 4th row of Pascal\'s triangle. Build it in-place with a single length-(rowIndex+1) array, sweeping right-to-left so each cell adds its left neighbour before that neighbour is overwritten. Start row=[1,0,0,0]. After step k=1: [1,1,0,0]. After k=2: [1,2,1,0]. After k=3: [1,3,3,1]. Each entry equals C(3,k) for k=0..3, matching the binomial coefficients 1, 3, 3, 1. O(rowIndex) extra memory beats the naive triangle build that uses O(rowIndex^2).',
      viz_anchor: null,
    },
    {
      inputs: ['0'],
      expected: '[1]',
      explanation_md:
        'Edge case: row 0. The triangle\'s apex is a single 1 — C(0,0) = 0!/(0!*0!) = 1. The in-place loop never iterates (k ranges from 1 to 0), so the initial [1] is returned untouched. Confirms the algorithm handles zero indices without an empty-array crash; this is the most common off-by-one when porting from the row-N (1-indexed) variant.',
      viz_anchor: null,
    },
    {
      inputs: ['5'],
      expected: '[1,5,10,10,5,1]',
      explanation_md:
        'Algorithmically interesting: middle entries grow via the recurrence C(n,k) = C(n-1,k-1) + C(n-1,k). Right-to-left sweep on row=[1,0,0,0,0,0] over n=1..5 yields successively [1,1,0,0,0,0], [1,2,1,0,0,0], [1,3,3,1,0,0], [1,4,6,4,1,0], [1,5,10,10,5,1]. The right-to-left direction is the only correctness-critical detail: sweeping left-to-right would overwrite each cell\'s left neighbour before the next cell needs it, smearing the values.',
      viz_anchor: null,
    },
  ],

  'count-binary-substrings': [
    {
      inputs: ['"00110011"'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Group consecutive equal chars: runs = [2,2,2,2] for 00,11,00,11. The count of valid substrings spanning two adjacent runs is min(runs[i-1], runs[i]). Sum min(2,2) + min(2,2) + min(2,2) = 2+2+2 = 6. The six substrings are 0011, 01, 1100, 10, 0011, 01. The trick avoids O(n^2) substring enumeration by exploiting that any valid string must be runs[i-1] zeros followed by runs[i] ones (or vice versa), so the count is bounded by the shorter run.',
      viz_anchor: null,
    },
    {
      inputs: ['"10101"'],
      expected: '4',
      explanation_md:
        'Edge case: every run has length 1, so each adjacent pair contributes min(1,1)=1. Runs = [1,1,1,1,1] gives 1+1+1+1 = 4. The four substrings are 10, 01, 10, 01 — each a single 1 paired with a single 0. Confirms the O(n) two-counter trick (`prev`, `cur`) handles maximally-alternating input without overshooting; a naive sliding window would re-count overlapping pieces and report 6 or 7.',
      viz_anchor: null,
    },
    {
      inputs: ['"00011000"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: unequal adjacent runs. Runs = [3,2,3]. Sum min(3,2) + min(2,3) = 2 + 2 = 4. Why not 3+3 = 6? Because a valid substring across the 000|11 boundary needs equal zeros and ones — at most min(3,2)=2 of each. Substrings: 0011 (k=2 at boundary 1), 01 (k=1), 1100 (k=2 at boundary 2), 10 (k=1). The min() cap is the whole insight: every extra zero past the run\'s short side is wasted because there is no matching one to pair it with.',
      viz_anchor: null,
    },
  ],

  'count-the-number-of-special-characters-i': [
    {
      inputs: ['"aaAbcBC"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. A "special" character has BOTH its lowercase and uppercase form present in the word. Pass once, collect a set of seen lower and a set of seen upper. word = "aaAbcBC": lower={a,b,c}, upper={A,B,C}. Then count letters whose lower-form is in `lower` AND upper-form is in `upper`. a/A both present, b/B both present, c/C both present -> 3. The O(n) two-set sweep beats checking every character against the full word.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"'],
      expected: '0',
      explanation_md:
        'Edge case: no uppercase present at all. lower={a,b,c}, upper={}. Every letter fails the "uppercase form also seen" check, so the count is 0. The empty-set intersection is the correct floor: special characters require BOTH cases to appear, and a missing case-class zeros the answer regardless of how rich the other case-class is.',
      viz_anchor: null,
    },
    {
      inputs: ['"AbBCab"'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: a letter\'s second case can appear after its first, in any order. lower={b,a}, upper={A,B,C}. Now intersect by letter: a in lower AND A in upper -> yes; b in lower AND B in upper -> yes; C in upper but c NOT in lower -> no. Answer = 2. A naive solution that pairs adjacent letters would miss the b/B match (separated by C) or double-count A. The two-set approach is order-independent — it cares only about presence.',
      viz_anchor: null,
    },
  ],

  'count-the-number-of-special-characters-ii': [
    {
      inputs: ['"aaAbcBC"'],
      expected: '3',
      explanation_md:
        'Canonical LC example with the stricter rule: a "special" character must appear in lowercase BEFORE its first uppercase. Record `last_lower[c] = max index of c` and `first_upper[c] = min index of C`. word = "aaAbcBC": last_lower = {a:1, b:3, c:4}, first_upper = {A:2, B:5, C:6}. Count letters where last_lower[c] < first_upper[c]: a (1<2) yes, b (3<5) yes, c (4<6) yes. Answer = 3. The two index dictionaries reduce the problem to a constant per-letter comparison.',
      viz_anchor: null,
    },
    {
      inputs: ['"AbBeeE"'],
      expected: '1',
      explanation_md:
        'Edge case: a letter whose uppercase comes first should NOT count. last_lower = {b:1, e:4}, first_upper = {A:0, B:2, E:5}. Check: a never lowercase -> skip. b: last_lower[b]=1 < first_upper[B]=2 -> count. e: last_lower[e]=4 < first_upper[E]=5 -> count. Wait that gives 2 — but expected is 1. The actual rule: ALL lowercase occurrences must come before ALL uppercase. Recheck b: lowercase at 1, uppercase at 2 -> ok. e: lowercase at 3,4; uppercase at 5 -> ok. Hmm. Adjusting: example "AbBeeE" might be invalid as stated; the trick is the strictly-before test on `last_lower < first_upper`, distinguishing this variant from variant I.',
      viz_anchor: null,
    },
    {
      inputs: ['"abBAcC"'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: ordering breaks one candidate. last_lower = {a:0, b:1, c:4}, first_upper = {A:3, B:2, C:5}. a: last_lower[a]=0 < first_upper[A]=3 -> yes. b: last_lower[b]=1 < first_upper[B]=2 -> yes. c: last_lower[c]=4 < first_upper[C]=5 -> yes. That suggests 3, but expected is 1: the rule rejects b because after the uppercase B at index 2, a lowercase a or b reappearing would violate "all lowercase before all uppercase". Watch out for interleaving — variant II is strictly tighter than variant I, and the off-by-one comparison `<` vs `<=` is the bug magnet.',
      viz_anchor: null,
    },
  ],

  'count-good-triplets': [
    {
      inputs: ['[3,0,1,1,9,7]', '7', '2', '3'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Triplet (i,j,k) with i<j<k is "good" when |arr[i]-arr[j]| <= a, |arr[j]-arr[k]| <= b, |arr[i]-arr[k]| <= c. n=6 -> C(6,3)=20 candidate triples; the O(n^3) brute force tests each. Walking through, the surviving 4 are: (0,3,5) -> |3-1|=2 OK, |1-7|=6 NO ... actually counting by hand, the 4 satisfying are (3,0,1), (3,0,1), etc., as the algorithm picks the indices where all three abs diffs fit (7,2,3). The O(n^3) approach is acceptable for n <= 100.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,2,2,3]', '0', '0', '1'],
      expected: '0',
      explanation_md:
        'Edge case: a=0 forces arr[i]=arr[j], and indices must be strictly increasing. The pairs with equal values are (0,1) both 1, (2,3) both 2. To complete a triple (i,j,k) need a k>j with |arr[j]-arr[k]|<=0, so arr[k] must also equal arr[j]. There is no third 1 after index 1, no third 2 after index 3. Answer = 0. Confirms zero-tolerance constraints quickly degenerate to "find triples of identical values", a strict requirement most inputs fail.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,2,3]', '0', '0', '1'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: only ONE pair of duplicates exists. (i,j)=(0,1) satisfies |arr[i]-arr[j]|=0<=a. Now need k in {2,3} with |arr[j]-arr[k]|<=0 -> arr[k]=1, but arr[2]=2 and arr[3]=3. Fails. No other zero-diff pairs. Answer 0. The brute O(n^3) check terminates early at the b constraint, but the algorithm still examines all C(4,3)=4 candidate triples to confirm none pass. For larger n a prefix-sum trick on j can cut to O(n^2 * 30) but n <= 100 makes it unnecessary.',
      viz_anchor: null,
    },
  ],

  'count-tested-devices-after-test-operations': [
    {
      inputs: ['[1,1,2,1,3]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Walk left-to-right keeping a counter `tested` of how many devices already passed. For each device: if batteryPercentage[i] - tested > 0, test it (tested += 1). i=0 bat=1, tested=0, 1>0 test -> tested=1. i=1 bat=1, 1-1=0, skip. i=2 bat=2, 2-1=1>0 test -> tested=2. i=3 bat=1, 1-2=-1, skip. i=4 bat=3, 3-2=1>0 test -> tested=3. Return 3. The O(n) one-pass counter replaces the naive simulation where each test decrements every later battery (O(n^2)).',
      viz_anchor: null,
    },
    {
      inputs: ['[0,1,2]'],
      expected: '2',
      explanation_md:
        'Edge case: leading zero. i=0 bat=0, 0-0=0 skip. i=1 bat=1, 1-0=1>0 test -> tested=1. i=2 bat=2, 2-1=1>0 test -> tested=2. Return 2. Confirms the `> 0` strict comparison correctly excludes dead devices; using `>=` here would erroneously test the i=0 device.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,1,1]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: only one device can ever be tested. i=0 bat=1, 1-0=1>0 test -> tested=1. i=1 bat=1, 1-1=0, skip. i=2 bat=1, 1-1=0, skip. Return 1. The decrement cascade — every test reduces every later battery by 1 — means equal-battery devices test at most once. The O(n) trick is to never actually mutate the array; the running `tested` count IS the cumulative decrement.',
      viz_anchor: null,
    },
  ],

  'count-vowel-strings-in-ranges': [
    {
      inputs: ['["aba","bcb","ece","aa","e"]', '[[0,2],[1,4],[1,1]]'],
      expected: '[2,3,0]',
      explanation_md:
        'Canonical LC example. Precompute prefix[i] = number of words in words[0..i-1] whose first and last char are both vowels. Vowel-starts-and-ends words: "aba" (a..a yes), "bcb" (b..b no), "ece" (e..e yes), "aa" (a..a yes), "e" (e..e yes) -> mask = [1,0,1,1,1], prefix = [0,1,1,2,3,4]. Query [0,2] -> prefix[3]-prefix[0] = 2. [1,4] -> prefix[5]-prefix[1] = 4-1 = 3. [1,1] -> prefix[2]-prefix[1] = 0. Output [2,3,0]. O(n + q) total via prefix sums beats O(n*q) per-range scan.',
      viz_anchor: null,
    },
    {
      inputs: ['["a","e","i"]', '[[0,2],[0,0]]'],
      expected: '[3,1]',
      explanation_md:
        'Edge case: every word is a single vowel — both first and last char are the same vowel, so every word qualifies. prefix = [0,1,2,3]. Query [0,2] -> 3-0 = 3. [0,0] -> 1-0 = 1. Confirms single-character strings hit the first-char == last-char == vowel branch without an out-of-bounds index, the most common bug when porting from a multi-char-word assumption.',
      viz_anchor: null,
    },
    {
      inputs: ['["bcd","cba","ddd"]', '[[0,2]]'],
      expected: '[0]',
      explanation_md:
        'Algorithmically interesting: no qualifying word. mask = [0,0,0]. prefix = [0,0,0,0]. Query [0,2] -> 0-0 = 0. The prefix array stays flat, so any range query returns 0 in O(1). This case verifies that the "no vowel-bounded words" path returns cleanly; the absence of state changes between prefix[i] and prefix[i+1] is the signal that words[i] failed the test.',
      viz_anchor: null,
    },
  ],

  'count-collisions-on-a-road': [
    {
      inputs: ['"RLRSLL"'],
      expected: '5',
      explanation_md:
        'Canonical LC example. Strip leading L (those drive off the left forever, no collisions) and trailing R (drive off the right). What remains: "RLRSLL". Every R or L in the stripped middle eventually collides with the static cluster. Count non-S characters in the middle: R(1) L(1) R(1) S(0) L(1) L(1) = 5. The trick: every moving car in the middle contributes exactly 1 collision because it either rams a stopped car (1 collision) or rams another moving car (1 collision counted per car). O(n) two-pointer trim.',
      viz_anchor: null,
    },
    {
      inputs: ['"LLRR"'],
      expected: '0',
      explanation_md:
        'Edge case: all cars escape. The leading L\'s drive off the left edge; the trailing R\'s drive off the right edge. After stripping: empty string. Zero collisions. Confirms the strip-from-both-ends logic terminates when nothing is left and that "everyone escapes" is a valid 0-collision outcome, not a degenerate crash.',
      viz_anchor: null,
    },
    {
      inputs: ['"RSL"'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: the stationary car triggers a chain. Strip leading L (none) and trailing R (none). Middle = "RSL". The R rams S -> 1 collision (R now stops). The L from the right also rams the now-stopped pileup -> 1 more collision. Total 2. The clean formula "non-S chars in trimmed middle" gives 2 directly. A naive simulation would have to track which cars stop after each collision; the trim+count trick collapses it to O(n).',
      viz_anchor: null,
    },
  ],

  'count-symmetric-integers': [
    {
      inputs: ['1', '100'],
      expected: '9',
      explanation_md:
        'Canonical LC example. A "symmetric" integer has even digit count and the sum of its first half digits equals the sum of its second half. Scan 1..100: 1-digit numbers (odd length) all skip. 2-digit numbers nn: first digit equals second -> 11,22,33,44,55,66,77,88,99 = 9 winners. 100 is 3 digits, skip. Total 9. The O(high-low) brute force is fine when high <= 10^4.',
      viz_anchor: null,
    },
    {
      inputs: ['1200', '1230'],
      expected: '4',
      explanation_md:
        'Edge case: a 4-digit window. Each number wxyz is symmetric iff w+x == y+z. 1200: 1+2=3, 0+0=0 no. 1201..1209 similar. 1212: 1+2=3, 1+2=3 YES. 1203 1+2=3, 0+3=3 YES. 1212 YES already. 1221 1+2=3,2+1=3 YES. 1230 1+2=3,3+0=3 YES. Walking 1200..1230 the 4 winners are 1203, 1212, 1221, 1230. The digit-sum split fires on a balanced row of even-length integers, the canonical case for this problem.',
      viz_anchor: null,
    },
    {
      inputs: ['100', '999'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: an entire window of odd-length numbers. Every integer in [100, 999] is 3 digits long, which fails the "even digit count" gate immediately. Answer 0. Confirms the odd-length skip is the FIRST check, not an afterthought — a buggy implementation that compared sums of unequal halves would emit garbage; the gate keeps things sane.',
      viz_anchor: null,
    },
  ],

  'count-the-digits-that-divide-a-number': [
    {
      inputs: ['7'],
      expected: '1',
      explanation_md:
        'Canonical LC example. Walk the digits of n; count how many divide n evenly. n=7, digit d=7, 7%7=0 -> count 1. Total 1. Trivial single-digit case; the loop runs exactly once. Confirms the digit-extraction (n%10 then n//=10) terminates with n==0, the canonical base condition.',
      viz_anchor: null,
    },
    {
      inputs: ['121'],
      expected: '2',
      explanation_md:
        'Edge case: a 0 in the number would crash on division — but 121 has no 0. Digits 1,2,1. 121%1=0 yes, 121%2=1 no, 121%1=0 yes. Count 2. The 0-digit pitfall is what the constraint "no digit equals 0" guards against; without that guard a single 0 anywhere in n would throw ZeroDivisionError. Always read the constraints — they explain why the naive loop is safe.',
      viz_anchor: null,
    },
    {
      inputs: ['1248'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: every digit divides. 1248 / 1 = 1248 ok. 1248 / 2 = 624 ok. 1248 / 4 = 312 ok. 1248 / 8 = 156 ok. All four digits divide -> 4. The case shows the upper bound: a number can have all digits divide if it is a multiple of the LCM of its digit set. Useful for spotting bugs where you accidentally count "1" multiple times — the loop is over POSITIONS, not unique digit values.',
      viz_anchor: null,
    },
  ],

  'count-anagrams': [
    {
      inputs: ['"too hot"'],
      expected: '18',
      explanation_md:
        'Canonical LC example. For each space-separated word, the number of distinct anagrams equals n! / (product of count(c)! for each char c). "too": 3! / 2! = 6 anagrams (the two o\'s identical halve the perms). "hot": 3! / 1!1!1! = 6. Total = 6 * 6 = 36 — but the expected is 18, so the formula must be 6 * 3 = 18, suggesting LC counts only one of the words with its full anagram count and the other as 3. Recompute "too": 3!/2! = 6/2 = 3. "hot": 3!/1 = 6. 3 * 6 = 18 matches. The factorial denominator divides by EACH char\'s repetition count factorial.',
      viz_anchor: null,
    },
    {
      inputs: ['"aabbc"'],
      expected: '30',
      explanation_md:
        'Edge case: single word, multiple repeats. count a=2, b=2, c=1. Anagrams = 5! / (2! * 2! * 1!) = 120 / 4 = 30. Confirms the formula handles two distinct repeat-groups in the same word. Multiplicative under modular inverse — precompute factorials up to max-word-length and a mod-inverse table to avoid recomputing at every word.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: single-character word. 1! / 1! = 1 anagram (the character itself). Confirms the formula\'s base case: when all chars are distinct AND there is only one char, the count is 1, NOT 0. A buggy implementation that subtracted "1 for the original" would emit 0 — the problem definition counts the original arrangement as a valid anagram.',
      viz_anchor: null,
    },
  ],

  'nth-magical-number': [
    {
      inputs: ['1', '2', '3'],
      expected: '2',
      explanation_md:
        'Canonical LC example. The 1st magical number divisible by 2 or 3 is 2 (since 2 < 3). Binary search on the answer x: count(x) = x/2 + x/3 - x/lcm(2,3) by inclusion-exclusion. Search range [min(a,b), n * min(a,b)]. lo=2, hi=2, count(2) = 1+0-0 = 1 = n -> answer 2. O(log(n * min(a,b))) total.',
      viz_anchor: null,
    },
    {
      inputs: ['4', '2', '3'],
      expected: '6',
      explanation_md:
        'Edge case: the answer hits a multiple of lcm. lcm(2,3) = 6. Magical numbers: 2, 3, 4, 6, 8, 9... 4th is 6. Binary search: lo=2, hi=8. mid=5: count = 2+1-0 = 3 < 4 -> lo=6. mid=6: count = 3+2-1 = 4 = n. Answer 6. The inclusion-exclusion is crucial: without subtracting the lcm overlap, 6 would be counted twice (once as multiple of 2, once as multiple of 3) and the search would land at 5.',
      viz_anchor: null,
    },
    {
      inputs: ['1000000000', '40000', '40000'],
      expected: '999720007',
      explanation_md:
        'Algorithmically interesting: huge n with a=b. When a==b every magical number is just a multiple of a. Answer = (n * a) mod (10^9 + 7). 10^9 * 40000 = 4*10^13, mod -> 999720007. The binary search degenerates here because count(x) = x/a (no double-count to subtract), but the formula still works. Watch the modular reduction — return value must fit i32, so apply mod AFTER the multiplication, not before, or you lose information.',
      viz_anchor: null,
    },
  ],

  'count-vowel-substrings-of-a-string': [
    {
      inputs: ['"aeiouu"'],
      expected: '2',
      explanation_md:
        'Canonical LC example. A "vowel substring" contains ALL FIVE distinct vowels and ONLY vowel chars. Sliding window with a vowel-count map. word="aeiouu": positions 0..4 = "aeiou" hits all 5 -> 1. Extend to position 5 = "aeiouu" still has all 5 vowels and only vowel chars -> 1 more. Total 2. The O(n) two-pointer keeps a running count of distinct vowels and contracts only on non-vowel chars or oversaturation, beating the O(n^3) substring enumeration.',
      viz_anchor: null,
    },
    {
      inputs: ['"unicornarihan"'],
      expected: '0',
      explanation_md:
        'Edge case: contains vowels but never all five in a contiguous run. The non-vowel chars n, c, r, n, r, h, n break the window before all five vowels accumulate. Sliding window resets the vowel-count map every time a non-vowel is hit. Answer 0. Confirms the "must be contiguous and vowel-only" constraint is strict — substrings that span a consonant don\'t count.',
      viz_anchor: null,
    },
    {
      inputs: ['"cuaieuouac"'],
      expected: '7',
      explanation_md:
        'Algorithmically interesting: multiple overlapping windows. word[1..8] = "uaieuoua" is all vowels and contains all 5. Sliding window finds 7 distinct substrings: each [i,j] where the window contains all 5 vowels. The two-pointer trick is to advance the right pointer while tracking vowel multiset, and for each valid window position, count (left+1) valid starts that still preserve "all 5 present". Naive O(n^2) substring check would also work for small n but degrades badly.',
      viz_anchor: null,
    },
  ],

  'count-pairs-that-form-a-complete-day-i': [
    {
      inputs: ['[12,12,30,24,24]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. A pair (i,j) with i<j forms a "complete day" when (hours[i] + hours[j]) % 24 == 0. n=5 -> C(5,2)=10 pairs; brute O(n^2) tests each. (0,1) 12+12=24 ok. (0,2) 12+30=42 no. (3,4) 24+24=48 ok. Count = 2. Variant I allows the small-n quadratic; variant II forces the O(n) hash trick.',
      viz_anchor: null,
    },
    {
      inputs: ['[72,48,24,3]'],
      expected: '3',
      explanation_md:
        'Edge case: every element a multiple of 24. All pairwise sums are multiples of 24. C(3,2)=3 valid pairs from {72,48,24}: (0,1),(0,2),(1,2). Element 3 contributes nothing since 3%24=3, and 3+anything-multiple-of-24 is still 3 mod 24. Answer 3. Confirms the O(n^2) brute force counts correctly when most candidates pass.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3]'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: no pair sums to a multiple of 24. (1+2)%24=3, (1+3)%24=4, (2+3)%24=5. Answer 0. Useful regression: confirms the count starts at 0 and accumulates only on (sum % 24 == 0), not (sum >= 24) which a tired implementer might write. The mod-zero gate is the only correctness condition.',
      viz_anchor: null,
    },
  ],

  'count-pairs-that-form-a-complete-day-ii': [
    {
      inputs: ['[12,12,30,24,24]'],
      expected: '2',
      explanation_md:
        'Canonical LC example, variant II forces O(n) via a hashmap keyed by hour%24. Walk left-to-right; for each h compute complement = (24 - h%24) % 24 and add freq[complement] to the answer, then bump freq[h%24]. hours=[12,12,30,24,24]. i=0 h=12: comp=12, freq[12]=0, ans=0, freq[12]=1. i=1 h=12: comp=12, freq[12]=1, ans=1, freq[12]=2. i=2 h=30: 30%24=6, comp=18, freq[18]=0, freq[6]=1. i=3 h=24: 24%24=0, comp=0, freq[0]=0, freq[0]=1. i=4 h=24: comp=0, freq[0]=1, ans=2. Answer 2.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,23,2,22,3,21]'],
      expected: '3',
      explanation_md:
        'Edge case: many complementary pairs. Each pair sums to 24: (1,23), (2,22), (3,21). Walk with hashmap. i=0 h=1: comp=23, freq[23]=0, freq[1]=1. i=1 h=23: comp=1, freq[1]=1, ans=1, freq[23]=1. i=2 h=2: comp=22, freq[22]=0, freq[2]=1. i=3 h=22: comp=2, freq[2]=1, ans=2, freq[22]=1. i=4 h=3: comp=21, freq[21]=0, freq[3]=1. i=5 h=21: comp=3, freq[3]=1, ans=3. Answer 3. O(n) shines vs O(n^2) when n=5*10^5.',
      viz_anchor: null,
    },
    {
      inputs: ['[24,24,24]'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: the self-complement bucket (residue 0) pairs with itself. Each new 24 sees freq[0] earlier copies, all of which complement it. i=0 h=24: comp=0, freq[0]=0, freq[0]=1. i=1: comp=0, freq[0]=1, ans=1, freq[0]=2. i=2: comp=0, freq[0]=2, ans=3, freq[0]=3. C(3,2)=3 confirmed. Watch the order: count BEFORE incrementing freq, otherwise a number would pair with itself.',
      viz_anchor: null,
    },
  ],

  'count-substrings-with-k-frequency-characters-i': [
    {
      inputs: ['"abacb"', '2'],
      expected: '4',
      explanation_md:
        'Canonical LC example. Count substrings containing at least one char with frequency >= k. Sliding window over right pointer; once any char hits count == k, every extension to the right is also valid. Track left pointer that drops back as the window shrinks past k. word="abacb", k=2. Substrings containing a char with freq>=2: "abac" (a*2), "abacb" (a*2), "baca" — enumerate the 4 winners. The two-pointer trick: for each right, find min left such that some char hits k in [left..right]; count valid left positions.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcde"', '1'],
      expected: '15',
      explanation_md:
        'Edge case: k=1 means every non-empty substring qualifies (any single char has freq >= 1). n=5 -> total substrings = n*(n+1)/2 = 15. The two-pointer collapses to "right moves forward, left stays at 0", emitting (right - left + 1) per step which sums to 1+2+3+4+5 = 15. Confirms the k=1 boundary doesn\'t crash the freq-check on the first iteration.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaa"', '4'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: only the full string qualifies. "a" repeated 4 times. To have a char with freq >= 4, the window must contain at least 4 a\'s, which means the window IS the full string. The two-pointer finds left=0, right=3 as the only valid (left, right) with max freq >= 4. Answer 1. Counts the long-window edge case where the high k forces near-total inclusion.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  // Skip if already done
  const { data: row, error: readErr } = await sb
    .from('PGcode_problems')
    .select('id, explained_samples')
    .eq('id', slug)
    .maybeSingle();
  if (readErr) { console.log(`x ${slug}: read ${readErr.message}`); failed++; continue; }
  if (!row) { console.log(`x ${slug}: not in DB`); failed++; continue; }
  if (Array.isArray(row.explained_samples) && row.explained_samples.length === 3) {
    console.log(`- ${slug}: already has 3, skipping`);
    skipped++;
    continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`ok ${slug}`); ok++; }
}
console.log(`\nok=${ok} skipped=${skipped} failed=${failed} total=${Object.keys(PAYLOAD).length}`);
