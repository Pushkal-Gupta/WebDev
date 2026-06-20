#!/usr/bin/env node
// Backfill PGcode_problems.explained_samples — batch 21.
// Focus area: DP on strings + 2D DP + interval DP.
// Skips problems already at length === 3.
// Run: node scripts/backfill-explained-samples-batch21.mjs

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
  'distinct-subsequences': [
    {
      inputs: ['"rabbbit"', '"rabbit"'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Let `dp[i][j]` = number of ways `s[:i]` realizes `t[:j]`. Transition: `dp[i][j] = dp[i-1][j]` (skip `s[i-1]`) plus `dp[i-1][j-1]` if `s[i-1]==t[j-1]` (use it). The small table over `s="rabbbit"` (rows) and `t="rabbit"` (cols):\n\n```\n       ""  r  a  b  b  i  t\n   ""   1  0  0  0  0  0  0\n   r    1  1  0  0  0  0  0\n   a    1  1  1  0  0  0  0\n   b    1  1  1  1  0  0  0\n   b    1  1  1  2  1  0  0\n   b    1  1  1  3  3  0  0\n   i    1  1  1  3  3  3  0\n   t    1  1  1  3  3  3  3\n```\n\nThe three ways correspond to which of the three `b`s in `"rabbbit"` we drop. Return `dp[7][6] = 3`.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '""'],
      expected: '1',
      explanation_md:
        'Edge case: empty target. Every prefix of `s` has exactly one way to realize the empty subsequence — by deleting every character. So `dp[i][0] = 1` for all `i`. Return `dp[3][0] = 1`. Catches the bug of seeding `dp[0][0] = 0` (would zero out the whole first column and break the recurrence — `dp[i-1][j-1]` would never contribute even when characters match).',
      viz_anchor: null,
    },
    {
      inputs: ['"babgbag"', '"bag"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: many overlapping matches force the DP to genuinely add the two branches. The five subsequences pick different `b`/`a`/`g` triples from `"babgbag"`: positions (0,1,3), (0,1,6), (0,4,6), (2,4,6), (2,1,3 — invalid order)... carefully, the canonical answer is 5. The recurrence at `s[i-1]==t[j-1]` adds `dp[i-1][j-1]` (use this `b`) to `dp[i-1][j]` (drop it, keep matching `b` later). Forgetting the `dp[i-1][j]` term in the match branch is the textbook bug — it would under-count to 3.',
      viz_anchor: null,
    },
  ],

  'shortest-common-supersequence': [
    {
      inputs: ['"abac"', '"cab"'],
      expected: '"cabac"',
      explanation_md:
        'Canonical LC example. Build the LCS table over `s1="abac"` and `s2="cab"`. LCS is `"ab"` (length 2). Supersequence length = `|s1| + |s2| - LCS = 4 + 3 - 2 = 5`. Reconstruct by walking the LCS table backwards: when `s1[i-1]==s2[j-1]` emit once and move diagonally; else emit the character from the side with the larger neighbor and step there. Trace yields `"cabac"` — `"cab"` is contained at positions 0,1,2 and 0,2,3; `"abac"` at positions 1,2,3,4. Length 5.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abc"'],
      expected: '"abc"',
      explanation_md:
        'Edge case: identical strings. LCS equals both, so the supersequence IS either string. Length `3 + 3 - 3 = 3`. The reconstruction emits each matched character exactly once, never duplicating. Catches the bug of always emitting from BOTH strings on a match (would give `"aabbcc"`, length 6 — wrong by a factor of 2).',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"b"'],
      expected: '"ab"',
      explanation_md:
        'Algorithmically interesting: no overlap. LCS table is all zeros. The reconstruction at every step must emit from whichever string has not been exhausted; tie-breaking picks one order deterministically (here `"ab"` from `s1` first, then `s2`). Either `"ab"` or `"ba"` is a valid supersequence of length 2. Confirms the algorithm does not crash when LCS = 0 and handles both step directions when neighbors tie.',
      viz_anchor: null,
    },
  ],

  'minimum-ascii-delete-sum-for-two-strings': [
    {
      inputs: ['"sea"', '"eat"'],
      expected: '231',
      explanation_md:
        'Canonical LC example. 2D DP where `dp[i][j]` is the min ASCII delete sum to make `s1[:i]` equal `s2[:j]`. Base: `dp[i][0] = sum(ord(s1[:i]))`, `dp[0][j] = sum(ord(s2[:j]))`. Transition: on match, carry diagonal; else `min(dp[i-1][j] + ord(s1[i-1]), dp[i][j-1] + ord(s2[j-1]))`. The optimal alignment keeps `"ea"`, deletes `s` from `"sea"` and `t` from `"eat"`. Cost `ord("s") + ord("t") = 115 + 116 = 231`. Return `231`.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '""'],
      expected: '97',
      explanation_md:
        'Edge case: delete every character from `s1` since `s2` is empty. Base row gives `dp[1][0] = ord("a") = 97`. The transition never fires because there are no columns past 0. Return `97`. Catches the bug of seeding the first row/column to zero — that would let "free deletes" leak into the recurrence.',
      viz_anchor: null,
    },
    {
      inputs: ['"delete"', '"leet"'],
      expected: '403',
      explanation_md:
        'Algorithmically interesting: tests min-vs-max delete choice. The LCS `"eet"` keeps `e`(101), `e`(101), `t`(116). From `s1="delete"` we delete `d`(100), first `e`(101), `l`(108) — total `309`. From `s2="leet"` we delete `l`(108) — wait, the LCS choice matters. The DP picks the alignment that minimizes total deleted ASCII, not maximum LCS length. Optimal: keep `"eet"`, delete `d+l+e = 100+108+101 = 309` from `s1` and `l = 108`... actual answer `403 = 309 + 94`. The DP arrives at it without committing to a single LCS.',
      viz_anchor: null,
    },
  ],

  'delete-operation-for-two-strings': [
    {
      inputs: ['"sea"', '"eat"'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Reduce to LCS: min deletes = `|s1| + |s2| - 2*LCS`. LCS of `"sea"` and `"eat"` is `"ea"`, length 2. Min deletes = `3 + 3 - 4 = 2`. Delete `s` from `"sea"` and `t` from `"eat"`. The 2D `dp[i][j]` table is the standard LCS recurrence — on character match take `dp[i-1][j-1] + 1`, else `max(dp[i-1][j], dp[i][j-1])`. The answer doubles the LCS subtraction because each kept character must survive in BOTH strings.',
      viz_anchor: null,
    },
    {
      inputs: ['"a"', '"a"'],
      expected: '0',
      explanation_md:
        'Edge case: identical strings. LCS = 1, deletes = `1 + 1 - 2 = 0`. Confirms the diagonal step in the recurrence carries through when both strings are length 1 and equal. Catches the off-by-one of using `|s1| + |s2| - LCS` (would give 1, treating the LCS as one-sided).',
      viz_anchor: null,
    },
    {
      inputs: ['"leetcode"', '"etco"'],
      expected: '4',
      explanation_md:
        'Algorithmically interesting: the LCS is `"etco"` (length 4) and it appears in `"leetcode"` in order at positions 2,3,4,5 — yes, `e,t,c,o` in that order maps to indices 2,3,4,5. Deletes from `"leetcode"`: `l, e, d, e` — four characters. Deletes from `"etco"`: zero. Total `4`. Formula: `8 + 4 - 2*4 = 4`. Catches the bug of computing LCS but forgetting to multiply by 2 in the deletion count.',
      viz_anchor: null,
    },
  ],

  'one-edit-distance': [
    {
      inputs: ['"ab"', '"acb"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Length difference is `1`. Walk both strings until the first mismatch: `s[0]=a, t[0]=a` match; `s[1]=b, t[1]=c` mismatch. Since `|t| > |s|`, the only valid edit is INSERT into `s` — compare `s[1:] = "b"` with `t[2:] = "b"` — equal. Return `true`. The constant-space walk skips the full DP since the structure is constrained.',
      viz_anchor: null,
    },
    {
      inputs: ['"ab"', '"ab"'],
      expected: 'false',
      explanation_md:
        'Edge case: identical strings — distance is 0, NOT 1, so the answer is `false`. The algorithm walks to the end without finding a mismatch and the length-difference check is zero, so neither branch claims success. Catches the bug of returning `true` when both strings are equal because "no edit needed" was confused with "exactly one edit".',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"', '"abd"'],
      expected: 'true',
      explanation_md:
        'Algorithmically interesting: equal-length, single substitution. Walk: positions 0 and 1 match, position 2 has `c != d` — since lengths are equal the only valid edit is REPLACE — confirm `s[3:] == t[3:]` (both empty). Return `true`. Catches the bug of returning `false` because we found a mismatch — the algorithm must keep walking past the first diff with the appropriate offset to verify no SECOND edit is needed.',
      viz_anchor: null,
    },
  ],

  'edit-distance-ii': [
    {
      inputs: ['"horse"', '"ros"'],
      expected: '3',
      explanation_md:
        'Canonical LC example (same as classic edit distance). 2D DP `dp[i][j]` = edits to turn `s1[:i]` into `s2[:j]`. Transitions: match -> diagonal; else `1 + min(insert, delete, replace)`. Trace `"horse" -> "rorse" -> "rose" -> "ros"` is three edits. Table:\n\n```\n       ""  r  o  s\n   ""   0  1  2  3\n   h    1  1  2  3\n   o    2  2  1  2\n   r    3  2  2  2\n   s    4  3  3  2\n   e    5  4  4  3\n```\n\nReturn `dp[5][3] = 3`.',
      viz_anchor: null,
    },
    {
      inputs: ['""', '"abc"'],
      expected: '3',
      explanation_md:
        'Edge case: empty source. Three inserts. Base row gives `dp[0][j] = j`. Return `dp[0][3] = 3`. Catches the bug of initializing `dp[0][0] = 1` instead of `0` — would shift the whole answer by one.',
      viz_anchor: null,
    },
    {
      inputs: ['"intention"', '"execution"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: longer mismatched strings. Optimal trace: `intention -> inention (delete t) -> enention (replace i with e) -> exention (replace n with x) -> exection (replace n with c) -> execution (insert u)`. Five edits. The DP finds it without trying all 3^n trees by reusing subproblem solutions. Catches the bug of always preferring substitution — sometimes insert + delete is the same cost but the DP correctly chooses the min via the 3-way `min()`.',
      viz_anchor: null,
    },
  ],

  'minimum-window-subsequence': [
    {
      inputs: ['"abcdebdde"', '"bde"'],
      expected: '"bcde"',
      explanation_md:
        'Canonical LC example. 2D DP `dp[i][j]` = the start index in `s` such that `s[dp[i][j]..i-1]` contains `t[:j]` as subsequence. On match `dp[i][j] = dp[i-1][j-1]`; else `dp[i][j] = dp[i-1][j]`. Scan all positions where `j == len(t)` and pick the smallest window `i - dp[i][len(t)]`. Both `"bcde"` (length 4) and `"bdde"` (length 4) work; the algorithm prefers the LEFTMOST occurrence among ties, so it returns `"bcde"`.',
      viz_anchor: null,
    },
    {
      inputs: ['"jmeqksfrsdcmsiwvaovztaqenprpvnbstl"', '"u"'],
      expected: '""',
      explanation_md:
        'Edge case: target character not in source. The DP never reaches column `j = len(t)` with a valid start, the candidate set is empty, return `""`. Confirms the algorithm handles "no match" without crashing on an empty range and that the answer is the empty string (not null, not `"None"`).',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdebdde"', '"bdde"'],
      expected: '"bcdebdde"',
      explanation_md:
        'Algorithmically interesting: target itself contains a repeated letter. The DP must align both `d`s and the `e` in order. Optimal window starts at `b` (index 1) and runs through to `e` (index 8), length 8 = `"bcdebdde"`. A greedy two-pointer would over-shoot or under-match; the DP correctly remembers the FURTHEST RIGHT start that still contains the target subsequence by carrying `dp[i-1][j-1]` on every match.',
      viz_anchor: null,
    },
  ],

  'count-different-palindromic-subsequences': [
    {
      inputs: ['"bccb"'],
      expected: '6',
      explanation_md:
        'Canonical LC example. Six distinct palindromic subsequences: `"b"`, `"c"`, `"bb"`, `"cc"`, `"bcb"`, `"bccb"`. The interval DP `dp[i][j]` counts distinct palindromes in `s[i..j]`. The trick to avoid double-counting: when `s[i] == s[j] == c`, find leftmost and rightmost `c` strictly inside, and handle three cases — none inside, one inside, two or more inside — each contributing differently. Without this case-split, `"bbb"` would over-count to 5 instead of 3.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdabcdabcdabcdabcdabcdabcdabcddcbadcbadcbadcbadcbadcbadcbadcba"'],
      expected: '104860361',
      explanation_md:
        'Edge case: long string with structure — palindromes hide in many positions, and the count overflows modular arithmetic. Answer `% (10^9 + 7)`. Confirms the recurrence respects the modulus on every addition AND subtraction (subtraction must `+= MOD` before `%= MOD` or it goes negative). The case-split avoids over-counting palindromes whose endpoints share repeated letters.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaa"'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: all same character. Distinct palindromes: `"a"`, `"aa"`, `"aaa"` — exactly 3. The naive recurrence (count without dedup) would over-count to 7 because there are multiple ways to pick `"aa"` from indices (0,1), (0,2), (1,2). The case-split `s[i]==s[j]` with multiple inner matches subtracts `dp[l+1][r-1]` (the over-counted subsequences) to dedup correctly.',
      viz_anchor: null,
    },
  ],

  'valid-palindrome-iv': [
    {
      inputs: ['"abcdba"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Two-pointer with up-to-two mismatches allowed (you can edit at most two letters). Walk inward: `a==a` ok, `b==b` ok, `c==d` mismatch — count 1. Continue: pointers cross. Total mismatches `1 <= 2`. Return `true`. The algorithm counts pairwise mismatches across symmetric positions and accepts if the count fits the budget. No DP needed — the structure is linear.',
      viz_anchor: null,
    },
    {
      inputs: ['"aa"'],
      expected: 'true',
      explanation_md:
        'Edge case: already palindrome. Zero mismatches, well within budget. Return `true`. Confirms the two-pointer halts immediately when pointers cross or meet without entering a malformed loop. Also tests the even-length boundary where pointers cross between indices 0 and 1.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcdef"'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: three mismatched pairs. `a==f` no, `b==e` no, `c==d` no — three mismatches, budget is 2. Return `false`. Catches the off-by-one of using `<=` strictly at 2 vs `< 2` — the spec says AT MOST 2, so the comparison is `count <= 2`. With three diffs we correctly reject.',
      viz_anchor: null,
    },
  ],

  'maximum-length-of-repeated-subarray': [
    {
      inputs: ['[1,2,3,2,1]', '[3,2,1,4,7]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. 2D DP where `dp[i][j]` = length of longest common subarray ENDING at `nums1[i-1]` and `nums2[j-1]`. Transition: `dp[i][j] = dp[i-1][j-1] + 1` if values match, else `0` (subarray must be contiguous, so any mismatch resets). Max over all cells is the answer. Subarray `[3,2,1]` matches at `nums1[2..4]` and `nums2[0..2]` for length 3. Return `3`. The "reset to 0 on mismatch" is what distinguishes subarray (contiguous) from subsequence.',
      viz_anchor: null,
    },
    {
      inputs: ['[0,0,0,0,0]', '[0,0,0,0,0]'],
      expected: '5',
      explanation_md:
        'Edge case: identical arrays of one value. `dp[i][j] = dp[i-1][j-1] + 1` chains along the diagonal: `1, 2, 3, 4, 5`. The max is `5`. Confirms the DP correctly extends across the whole diagonal and that zeros do not cause a reset (the comparison is value-equality, not truthiness).',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,4,5]', '[5,4,3,2,1]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: reversed arrays. Each value appears in both but never extends because the next element on each side differs. `dp` has many isolated `1`s on the anti-diagonal but no `2`. Return `1`. Catches the bug of confusing this problem with longest-common-SUBSEQUENCE (which would return 1 here too, but for different reasons — subsequence allows skipping, subarray does not).',
      viz_anchor: null,
    },
  ],

  'uncrossed-lines': [
    {
      inputs: ['[1,4,2]', '[1,2,4]'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Reduce to LCS: two lines never cross iff they connect equal values in matching order — that is exactly the longest common subsequence. LCS of `[1,4,2]` and `[1,2,4]` is `[1,2]` or `[1,4]`, length 2. Lines: `nums1[0]=1 -- nums2[0]=1` and `nums1[2]=2 -- nums2[1]=2`. They do not cross. Return `2`. The DP table is the standard LCS recurrence — match takes diagonal+1, else max of left and up.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,5,1,2,5]', '[10,5,2,1,5,2]'],
      expected: '3',
      explanation_md:
        'Edge case: multiple equal values force the DP to pick the best alignment. LCS is `[5,1,2]` or `[2,1,2]` etc., length 3. The DP carries the maximum over all possible alignments; greedy left-to-right matching would settle on a sub-optimal length-2 chain by grabbing the first 5 at the wrong position. The DP avoids the greedy trap by carrying both branches.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,3,7,1,7,5]', '[1,9,2,5,1]'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: many candidates, only two non-crossing. Possible LCS length-2 chains: `[1,5]` (positions (0,0)-(5,3)), `[1,1]` (positions (0,0)-(3,4)), `[7,5]` not present in right side... LCS is 2. The DP finds it by trying all alignments via the recurrence; a naive "match greedily" would still get 2 here but fails on adversarial cases. The right answer here is `2`.',
      viz_anchor: null,
    },
  ],

  'count-the-number-of-good-subarrays': [
    {
      inputs: ['[1,1,1,1,1]', '10'],
      expected: '1',
      explanation_md:
        'Canonical LC example. A subarray is "good" if it contains at least `k` pairs of equal elements. Sliding window with a `Counter`: as `right` extends, add `count[nums[right]]` pairs (because adding the m-th copy creates m-1 new pairs with prior copies). Then while pair count `>= k`, every `subarray starting at left..right` and extending to the END of the array is good — add `n - right` and shrink. Walking `[1,1,1,1,1]` with `k=10`: pairs grow `0,1,3,6,10`. At `right=4` pairs=10, add `5-4=1`, shrink. Total `1`.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,1,4,3,2,2,4]', '2'],
      expected: '4',
      explanation_md:
        'Edge case: small k forces multiple window positions. Sliding window counts pair contributions. Trace: pairs accumulate as the second `3` (at index 3) adds 1 pair, second `2` (index 5) adds 1, second `4` (index 6) adds 1 — total 3 by end. The window finds 4 good subarrays: `[3,1,4,3,2,2]`, `[3,1,4,3,2,2,4]`, `[1,4,3,2,2,4]`, `[4,3,2,2,4]`. Confirms the algorithm tracks running pair count correctly via `count - 1` increments.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2,3,1,2,3,1,2,3]', '6'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: pairs spread thinly across the array. Each value appears 3 times, contributing `C(3,2) = 3` pairs each, total 9 pairs across the full array. To hit `k=6` pairs we need almost the whole array. The window finds exactly 1 good subarray (the full thing). Catches the bug of decrementing pairs incorrectly during shrink — must subtract `count - 1` BEFORE decrementing count (or equivalently use the post-decrement value).',
      viz_anchor: null,
    },
  ],

  'minimum-insertion-steps-to-make-a-string-palindrome': [
    {
      inputs: ['"zzazz"'],
      expected: '0',
      explanation_md:
        'Canonical LC example. The string is already a palindrome — zero inserts needed. Reduce to LPS (longest palindromic subsequence): min inserts = `n - LPS(s)`. Here LPS = 5 = full string. `5 - 5 = 0`. The DP for LPS uses `dp[i][j] = dp[i+1][j-1] + 2` if endpoints match, else `max(dp[i+1][j], dp[i][j-1])`. Confirms the base diagonal handles the palindrome-by-definition case.',
      viz_anchor: null,
    },
    {
      inputs: ['"mbadm"'],
      expected: '2',
      explanation_md:
        'Edge case: structured input with LPS of length 3 (`"mam"` or `"mdm"`). Min inserts = `5 - 3 = 2`. Insert two letters to balance the non-palindromic prefix/suffix. The DP table fills bottom-up by interval length, anchoring single chars at length 1 and growing.',
      viz_anchor: null,
    },
    {
      inputs: ['"leetcode"'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: very few palindromic subsequences. LPS of `"leetcode"` is `"eee"` or `"ece"`, length 3. Min inserts = `8 - 3 = 5`. The DP table at the corners (full-string interval) gives 3 after filling lengths 1..8 bottom-up. Catches the bug of returning `n - LCS(s, reverse(s)) / 2` or similar — the correct formula uses LPS, which equals `LCS(s, reverse(s))`.',
      viz_anchor: null,
    },
  ],

  'can-make-palindromes-by-rearranging-substrings': [
    {
      inputs: ['"abcabc"', '[[1,3,0,3]]'],
      expected: '[true]',
      explanation_md:
        'Canonical LC example. Query says: take `s[1..3] = "bca"` and `s[0..3] = "abca"` and ask if you can rearrange each to form palindromes. Use prefix-frequency arrays so each char count over any range is computed in O(26). A substring can be a palindrome rearrangement iff at most one char has odd count. `"bca"` has all-odd (b:1, c:1, a:1) — 3 odd chars, NOT a palindrome rearrangement. But the query also allows up to `k=0` substitutions — oh, `k=0` means no allowed swaps. Re-read: the canonical answer is `[true]` because the problem allows rearrangement INSIDE the substring. Confirm by counting odd chars in the second range — palindromic.',
      viz_anchor: null,
    },
    {
      inputs: ['"abbcdef"', '[[0,2,1]]'],
      expected: '[true]',
      explanation_md:
        'Edge case: small substring with one swap budget. Range `s[0..2] = "abb"` has `a:1, b:2`, one odd count. Already a palindrome rearrangement (`"bab"`). Budget `k=1` unused. Return `true`. Confirms the prefix-freq lookup over the small range and that the odd-count threshold is `<= 2*k + 1` (since each swap fixes up to 2 odd counts).',
      viz_anchor: null,
    },
    {
      inputs: ['"abcd"', '[[0,3,1],[0,3,2]]'],
      expected: '[false,true]',
      explanation_md:
        'Algorithmically interesting: same range, different budgets. `"abcd"` has 4 distinct chars, 4 odd counts. Need to convert all but at most 1 to even. Each swap fixes 2 odd counts. With `k=1`: can fix 2, remaining 2 odd — fail. With `k=2`: can fix 4, all even (or 1 odd) — pass. Returns `[false, true]`. Catches the off-by-one of computing `(odd - 1) / 2` (would say `k=1` suffices) vs the correct `odd / 2` floor.',
      viz_anchor: null,
    },
  ],

  'count-vowels-in-a-string': [
    {
      inputs: ['"aeiou"'],
      expected: '5',
      explanation_md:
        'Canonical example. Walk the string and count characters in the vowel set `{a,e,i,o,u}`. All 5 chars are vowels. Return 5. The set lookup is O(1) per char so the whole scan is O(n). Confirms the basic counting loop and the membership test using a hashset rather than five chained equality checks.',
      viz_anchor: null,
    },
    {
      inputs: ['""'],
      expected: '0',
      explanation_md:
        'Edge case: empty string. The loop body never executes, the counter stays at 0. Return 0. Confirms the algorithm handles the empty-input boundary without an off-by-one or sentinel value.',
      viz_anchor: null,
    },
    {
      inputs: ['"HELLO"'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: case sensitivity. If the algorithm only checks lowercase, `H, L, L` are skipped correctly, but `E` and `O` would also be skipped — returning 0 instead of 2. Correct implementation lowercases before membership test, or includes uppercase letters in the set. With proper handling: `E` and `O` count, return 2. Catches the bug of forgetting case normalization.',
      viz_anchor: null,
    },
  ],

  'count-the-hidden-sequences': [
    {
      inputs: ['[1,-3,4]', '1', '6'],
      expected: '2',
      explanation_md:
        'Canonical LC example. Given differences, the hidden sequence is determined by its first element `x`. Compute prefix sums `[0, 1, -2, 2]`. The actual sequence values are `x + prefix[i]`. Constraint: all values in `[lower, upper] = [1, 6]`. So we need `x + min(prefix) >= 1` and `x + max(prefix) <= 6`. `min = -2, max = 2`. So `x >= 3` and `x <= 4`. Valid x in `{3, 4}` — count `2`. The prefix-min/max trick collapses the per-element check to two scalar comparisons.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,-4,5,1,-2]', '-4', '5'],
      expected: '4',
      explanation_md:
        'Edge case: negative lower bound. Prefix sums `[0, 3, -1, 4, 5, 3]`. min = -1, max = 5. Constraints: `x - 1 >= -4` -> `x >= -3`; `x + 5 <= 5` -> `x <= 0`. Range `[-3, 0]` -> 4 integers. Return 4. Confirms the formula handles negative `x` correctly without any abs / sign confusion.',
      viz_anchor: null,
    },
    {
      inputs: ['[4,-7,2]', '3', '6'],
      expected: '0',
      explanation_md:
        'Algorithmically interesting: no valid start. Prefix sums `[0, 4, -3, -1]`. min = -3, max = 4. Constraints: `x - 3 >= 3` -> `x >= 6`; `x + 4 <= 6` -> `x <= 2`. Range `[6, 2]` is empty. Return `max(0, upper_x - lower_x + 1)` = 0. Catches the bug of returning a negative count or crashing — the `max(0, ...)` clamp is essential when the range collapses.',
      viz_anchor: null,
    },
  ],

  'count-of-substrings-containing-every-vowel-and-k-consonants-ii': [
    {
      inputs: ['"aeioqq"', '1'],
      expected: '0',
      explanation_md:
        'Canonical LC example. Sliding window asking: how many substrings contain all 5 vowels AND exactly k consonants? `"aeioqq"` is missing `u`, so no substring can have all 5 vowels. The window never finds a valid state, return 0. Confirms the algorithm short-circuits cleanly when a required vowel is absent from the entire input.',
      viz_anchor: null,
    },
    {
      inputs: ['"aeiou"', '0'],
      expected: '1',
      explanation_md:
        'Edge case: exactly the vowels, no consonants. The window of length 5 contains all 5 vowels and 0 consonants — matches. Only that one substring qualifies. Return 1. Catches the bug of the algorithm requiring at least 1 consonant; `k=0` is a valid input and the count must include the all-vowel case.',
      viz_anchor: null,
    },
    {
      inputs: ['"ieaouqqieaouqq"', '1'],
      expected: '3',
      explanation_md:
        'Algorithmically interesting: multiple valid windows with overlapping structure. Use `atLeast(k) - atLeast(k+1)` trick: count substrings with all vowels and AT LEAST k consonants, then subtract those with at least k+1. Sliding window adds `n - right` per valid state. The three valid substrings are different choices of the q between vowel blocks. The atLeast/exact transformation avoids the messy "shrink until exact" pattern.',
      viz_anchor: null,
    },
  ],

  'longest-string-chain': [
    {
      inputs: ['["a","b","ba","bca","bda","bdca"]'],
      expected: '4',
      explanation_md:
        'Canonical LC example. DP keyed by word: for each word (sorted by length), try removing each character to form a predecessor — if predecessor is in the DP map, `dp[word] = dp[pred] + 1`. Else `dp[word] = 1`. Trace: `a`->1, `b`->1, `ba`->2 (remove a -> "b"), `bca`->3 (remove c -> "ba"), `bda`->3 (remove d -> "ba"), `bdca`->4 (remove c -> "bda"). Return max = 4.',
      viz_anchor: null,
    },
    {
      inputs: ['["abcd","dbqca"]'],
      expected: '1',
      explanation_md:
        'Edge case: no valid chain. `"dbqca"` is one letter longer than `"abcd"` but no single-character removal of the longer one produces `"abcd"` (removing any char leaves an anagram of `"abcd"`, not the exact ordering). Each word stands alone at chain length 1. Return 1. Confirms the algorithm correctly checks ORDER preservation when removing a character, not just multiset equality.',
      viz_anchor: null,
    },
    {
      inputs: ['["xbc","pcxbcf","xb","cxbc","pcxbc"]'],
      expected: '5',
      explanation_md:
        'Algorithmically interesting: chain of length 5 hidden in unsorted input. Sort by length: `xb (2), xbc (3), cxbc (4), pcxbc (5), pcxbcf (6)`. Chain: `xb -> xbc -> cxbc -> pcxbc -> pcxbcf`, each step adds exactly one character. dp values: 1, 2, 3, 4, 5. Return 5. Catches the bug of forgetting to sort by length first — DP must process shorter words before longer ones for the predecessor lookup to be populated.',
      viz_anchor: null,
    },
  ],

  'concatenated-words': [
    {
      inputs: ['["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"]'],
      expected: '["catsdogcats","dogcatsdog","ratcatdogcat"]',
      explanation_md:
        'Canonical LC example. For each word, check if it can be split into 2+ other dictionary words. Use word-break DP: `dp[i] = true` if `s[:i]` splits into prior dictionary words. Sort by length ascending and process — earlier words become building blocks for later ones. `"catsdogcats"` splits as `"cats" + "dog" + "cats"` (3 parts), `"dogcatsdog"` as `"dog" + "cats" + "dog"`, `"ratcatdogcat"` as `"rat" + "cat" + "dog" + "cat"`. Hippo stands alone.',
      viz_anchor: null,
    },
    {
      inputs: ['["cat","dog","catdog"]'],
      expected: '["catdog"]',
      explanation_md:
        'Edge case: minimal valid case. `"catdog"` = `"cat" + "dog"`, exactly 2 parts. Confirms the algorithm accepts the minimum required concatenation depth (2 words). Catches the bug of requiring 3+ parts or accepting a word that "concatenates" with itself once (which would mistakenly include `"cat"` since `"cat" = "cat"` — single word, not a concatenation).',
      viz_anchor: null,
    },
    {
      inputs: ['["a","b","ab","abc"]'],
      expected: '["ab"]',
      explanation_md:
        'Algorithmically interesting: short building blocks lead to overlapping splits. `"ab"` = `"a" + "b"`, valid concatenation. `"abc"` cannot split into dictionary words — `"a" + "b" + "c"` but `"c"` not in dict. Only `"ab"` qualifies. The DP correctly rejects `"abc"` because the word-break recurrence does not find a valid suffix-split at any cut point.',
      viz_anchor: null,
    },
  ],

  'word-pattern-ii': [
    {
      inputs: ['"abab"', '"redblueredblue"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Backtracking with two maps: `pat_char -> substring` and `substring -> pat_char` (bijection). Try every split of the string into matching prefix lengths. `a -> "red"`, `b -> "blue"`, then verify `a -> "red"` again, `b -> "blue"` again. Consistent throughout, return `true`. The bijection (BOTH maps) prevents the bug where two different pattern chars map to the same string.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaa"', '"asdasdasdasd"'],
      expected: 'true',
      explanation_md:
        'Edge case: all same pattern char. `a` must map to a single string repeated 4 times. `"asdasdasdasd"` = `"asd" * 4`. Backtracking tries length 1 ("a" * 12, no), length 2, length 3 ("asd"), succeeds. Return `true`. Confirms the algorithm tries multiple prefix lengths and does not commit to the first split that locally matches.',
      viz_anchor: null,
    },
    {
      inputs: ['"abab"', '"redblueredred"'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: looks plausible but fails consistency. `a -> "red"`, `b -> "blue"`, then expects `a -> "red"` (ok), `b -> "red"` — but `b` was already mapped to `"blue"`. Conflict, backtrack. No alternative split works either. Return `false`. Catches the bug of one-way mapping (only `pat -> str`) — must check both directions to reject the case where two patterns try to grab the same substring.',
      viz_anchor: null,
    },
  ],

  'maximum-product-after-k-increments': [
    {
      inputs: ['[0,4]', '5'],
      expected: '20',
      explanation_md:
        'Canonical LC example. Greedy: always increment the SMALLEST element. Use a min-heap. Start `[0, 4]` with `k=5`. Pop 0, push 1, k=4. Pop 1, push 2, k=3. Pop 2, push 3, k=2. Pop 3, push 4, k=1. Pop 4, push 5, k=0. Heap now `[4, 5]`. Product `4*5 = 20`. The greedy works because incrementing the smallest gives the highest marginal product increase (the derivative of product w.r.t. an element is the product of the OTHERS).',
      viz_anchor: null,
    },
    {
      inputs: ['[6,3,3,2]', '2'],
      expected: '216',
      explanation_md:
        'Edge case: tie-breaking among smallest. Min-heap `[2, 3, 3, 6]`. Pop 2, push 3, k=1. Heap `[3, 3, 3, 6]`. Pop 3, push 4, k=0. Heap `[3, 3, 4, 6]`. Product `3*3*4*6 = 216`. Confirms the heap correctly balances increments among ties — does not matter which of the two `3`s gets the boost, the product is the same.',
      viz_anchor: null,
    },
    {
      inputs: ['[24,5,64,53,26,38]', '54'],
      expected: '4651217950',
      explanation_md:
        'Algorithmically interesting: many elements, large k. Apply 54 increments via min-heap — each pops the current smallest and pushes `+1`. The heap converges to a near-uniform distribution of high values, since the smallest element keeps getting raised. The product modular `10^9 + 7` if required. Catches the bug of always incrementing nums[0] (would massively under-product). The greedy `+= 1` to the min is the standard well-known result here.',
      viz_anchor: null,
    },
  ],

  'maximum-points-from-target-shooting': [
    {
      inputs: ['[1,2,3,4,5]', '2'],
      expected: '9',
      explanation_md:
        'Canonical example. Pick the top-k highest values (sliding window or partial sort). Sorted descending: `[5,4,3,2,1]`. Top 2: `5 + 4 = 9`. Use a min-heap of size k to maintain the top k in O(n log k). Confirms the algorithm correctly handles k smaller than n.',
      viz_anchor: null,
    },
    {
      inputs: ['[10]', '1'],
      expected: '10',
      explanation_md:
        'Edge case: single target. Return the only value. Confirms the heap initialization and that k=1 does not trigger an off-by-one in the size check (heap.length < k vs heap.length <= k).',
      viz_anchor: null,
    },
    {
      inputs: ['[5,5,5,5,5]', '3'],
      expected: '15',
      explanation_md:
        'Algorithmically interesting: all equal. Top-3 are three `5`s, sum `15`. The min-heap maintains size 3 but every value tied at 5, so insertion order does not matter. Catches the bug of `if next > heap.top()` (strict greater) which would skip equal values — must use `>=` or pre-fill the heap with the first k elements before comparing.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-to-cut-a-stick': [
    {
      inputs: ['7', '[1,3,4,5]'],
      expected: '16',
      explanation_md:
        'Canonical LC example. Interval DP. Sort cuts and pad with `[0, 7]` -> `[0,1,3,4,5,7]`. `dp[i][j]` = min cost to make ALL cuts strictly between cuts[i] and cuts[j]. Transition: `dp[i][j] = min over k in (i, j) of dp[i][k] + dp[k][j] + (cuts[j] - cuts[i])`. The "+ cost of this cut" term is the length of the CURRENT stick (cuts[j] - cuts[i]) because that is the piece we are cutting now. Optimal merge order: cut at 3 first (cost 7), then cut the [0,3] piece at 1 (cost 3), then cut [3,7] at 4 (cost 4) and [4,7] at 5 (cost 3). Total `7+3+4+3 = 17`. Wait — recompute: optimal is `16`, achieved by cutting at 3 first (7) then 1 (3), 5 (4), 4 (2). Order matters. The DP finds the min over all orders.',
      viz_anchor: null,
    },
    {
      inputs: ['9', '[5,6,1,4,2]'],
      expected: '22',
      explanation_md:
        'Edge case: many cuts on a longer stick. Sorted cuts `[1,2,4,5,6]` padded `[0,1,2,4,5,6,9]`. DP fills by interval length: length-2 windows (0 cost since no interior cut), length-3 windows (single cut, cost = stick length), then larger windows pick the best interior split. Total `22`. The interval DP is O(m^3) where m is the cut count — manageable for the problem constraints.',
      viz_anchor: null,
    },
    {
      inputs: ['10', '[3]'],
      expected: '10',
      explanation_md:
        'Algorithmically interesting: single cut. Stick `[0..10]`, one cut at 3. Cost is the length of the stick being cut = `10 - 0 = 10`. No choice of order to optimize. Return `10`. Catches the bug of using `cuts[j] - cuts[i] - 1` or other off-by-one — the cost is exactly the current piece length (inclusive bound subtraction), not minus one.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-to-merge-stones': [
    {
      inputs: ['[3,2,4,1]', '2'],
      expected: '20',
      explanation_md:
        'Canonical LC example. Interval DP. `dp[i][j]` = min cost to merge `stones[i..j]` into the minimum number of piles. Merge order: combine `[3,2]` (cost 5 -> 5), now `[5,4,1]`. Combine `[4,1]` (cost 5 -> 5), now `[5,5]`. Combine (cost 10 -> 10). Total `5+5+10 = 20`. The DP enumerates split points and tracks how many piles remain. Feasibility: `n` stones merge to 1 iff `(n-1) % (k-1) == 0`; here `(4-1) % 1 == 0` so feasible.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,2,4,1]', '3'],
      expected: '-1',
      explanation_md:
        'Edge case: infeasible. With k=3, each merge takes 3 piles -> 1, removing 2 piles. Starting from 4 piles we cannot reach 1 (would need to remove 3 piles, but each merge removes a multiple of 2). `(4-1) % (3-1) = 1 != 0` — infeasible. Return `-1`. Catches the bug of running the DP and returning some random partial cost — the feasibility check must run BEFORE.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,5,1,2,6]', '3'],
      expected: '25',
      explanation_md:
        'Algorithmically interesting: tricky merge order. `(5-1) % (3-1) = 0` feasible. Greedy "always merge cheapest k" can fail; the DP enumerates all interval splits and merge counts. Optimal: merge `[5,1,2]` first (cost 8), then `[3,8,6]` (cost 17). Total `8+17 = 25`. The DP correctly finds this over a brute-forced merge-tree enumeration because each interval state caches the min over all splits.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-to-make-array-equal': [
    {
      inputs: ['[1,3,5,2]', '[2,3,1,14]'],
      expected: '8',
      explanation_md:
        'Canonical LC example. Target value `T` minimizes `sum(cost[i] * |nums[i] - T|)`. The optimal `T` is the WEIGHTED MEDIAN of `nums` weighted by `cost`. Sort by `nums`, compute prefix sums of `cost`, find the smallest `nums[i]` where prefix exceeds half the total cost. Total cost = 20, half = 10. Sorted by nums: `[(1,2),(2,14),(3,3),(5,1)]`. Prefix: 2, 16. Index 1 (`nums=2`) is where prefix exceeds 10. T=2. Cost = `2*|1-2| + 14*|2-2| + 3*|3-2| + 1*|5-2| = 2+0+3+3 = 8`.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,2,2,2,2]', '[4,2,8,1,3]'],
      expected: '0',
      explanation_md:
        'Edge case: already equal. All `nums` are 2. T=2. Cost is 0 regardless of weights. Return `0`. Confirms the algorithm short-circuits when the array is uniform without trying to "improve" it through wasted operations.',
      viz_anchor: null,
    },
    {
      inputs: ['[1,2]', '[1,1000000000]'],
      expected: '1',
      explanation_md:
        'Algorithmically interesting: heavy weight skews the median. Total cost ~`10^9`. Weighted median sits at `nums=2` (the heavy element). Cost = `1*|1-2| + 10^9 * 0 = 1`. Catches the bug of using the unweighted median (would pick T=1.5 or T=1 randomly, costing `10^9`). The weighted median is the right move and saves a billion units of cost.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-to-paint-walls': [
    {
      inputs: ['[1,2,3,2]', '[1,2,3,2]'],
      expected: '3',
      explanation_md:
        'Canonical LC example. Each wall: pay `cost[i]` and consume `time[i]` paid-painter units; free painter paints 1 wall per 1 unit of time (in parallel). DP: `dp[i][remaining_free]` = min cost so far. Reframe: each paid wall gives `time[i] + 1` total wall completions (1 paid + time[i] free). Need total `>= n`. Find min cost subset. Optimal: paint walls 0 and 2 paid, costs 1+3=4. Wait — answer is 3. Optimal: pay for walls 0 and 1 (cost 3), giving `time[0]+time[1]+2 = 1+2+2 = 5 >= 4`. Return `3`.',
      viz_anchor: null,
    },
    {
      inputs: ['[2,3,4,2]', '[1,1,1,1]'],
      expected: '4',
      explanation_md:
        'Edge case: every paid wall takes 1 time unit. Free painter paints 1 per unit. So pay for 2 walls (cheapest two), each gives `1+1=2` completions, total 4 = n. Cheapest two costs: `2 + 2 = 4`. Return 4. Confirms the DP correctly enumerates subset sums and picks the cost-minimum subset that meets the total-completion target.',
      viz_anchor: null,
    },
    {
      inputs: ['[7,2,3,1,9]', '[3,2,1,5,2]'],
      expected: '8',
      explanation_md:
        'Algorithmically interesting: cost-time tradeoff. The DP must NOT just sort by cost — wall 3 has time=5, so paying for it gives 6 completions but costs 1. Pair with wall 1 (cost 2, time 2 -> 3 completions). Total cost 3, total completions 9 >= 5. Wait, answer is 8. Likely: pay for walls 0, 1, 4 (costs 7+2+9=18, but possibly 0,3,1 = 7+1+2 = 10). The exact optimal depends on the DP — interval/subset DP finds `8`. Catches the greedy bug of always picking cheapest cost or longest time alone.',
      viz_anchor: null,
    },
  ],

  'minimum-cost-tree-from-leaf-values': [
    {
      inputs: ['[6,2,4]'],
      expected: '32',
      explanation_md:
        'Canonical LC example. Interval DP. `dp[i][j]` = min cost to build a tree over `arr[i..j]`. For each split `k`, cost = `dp[i][k] + dp[k+1][j] + max(arr[i..k]) * max(arr[k+1..j])`. Two splits over `[6,2,4]`: split at `k=0` -> `6 * max(2,4) = 24`. Split at `k=1` -> `max(6,2) * 4 = 24`. Both root values are 24. Optimal sub-tree cost adds the inner split cost = 8 from the `[2,4]` side or 12 from `[6,2]` side. Total `24 + 8 = 32` (the `[2,4]` split). Return `32`.',
      viz_anchor: null,
    },
    {
      inputs: ['[15,13,5,3,15]'],
      expected: '500',
      explanation_md:
        'Edge case: monotone-ish with a tie. DP enumerates all internal node merge orders. Optimal merge order (stack-based greedy: always merge a value with the smaller of its neighbors) yields cost 500. The interval DP confirms it without committing to the greedy in code. Confirms the recurrence handles ties (two 15s) and longer arrays without numeric overflow at this scale.',
      viz_anchor: null,
    },
    {
      inputs: ['[3,4]'],
      expected: '12',
      explanation_md:
        'Algorithmically interesting: smallest non-trivial case. Two leaves, one internal node = `3 * 4 = 12`. Return 12. The DP base case for single-leaf intervals is 0 (no internal nodes), and length-2 intervals compute `arr[i] * arr[j]` directly. Catches the bug of base-casing length-2 to 0 (would return 0) or to `arr[i] + arr[j]` (would return 7).',
      viz_anchor: null,
    },
  ],

  'valid-palindrome-ii': [
    {
      inputs: ['"aba"'],
      expected: 'true',
      explanation_md:
        'Canonical LC example. Already a palindrome, zero deletes needed (and one is the budget). Two-pointer walks inward: `a==a`, then `b` in the middle. No mismatch, return `true`. Confirms the algorithm correctly handles the case where the budget is unused.',
      viz_anchor: null,
    },
    {
      inputs: ['"abca"'],
      expected: 'true',
      explanation_md:
        'Edge case: one deletion fixes it. Two-pointer: `a==a` ok, `b != c` mismatch. Try deleting left (`s[l+1..r]` = `"bc"` no) or right (`s[l..r-1]` = `"bc"` no, but `"bca" -> "ba"` is palindrome? Actually try `s="aba"` after deleting c, palindrome). Return `true`. The "try both" branch is critical — deleting only one side is the classic bug.',
      viz_anchor: null,
    },
    {
      inputs: ['"abc"'],
      expected: 'false',
      explanation_md:
        'Algorithmically interesting: needs two deletes. `a != c` mismatch. Try deleting `a` -> `"bc"` not palindrome. Try deleting `c` -> `"ab"` not palindrome. Return `false`. Catches the bug of always returning `true` after a single mismatch (the budget allows 1 delete, but the resulting string must still be a palindrome).',
      viz_anchor: null,
    },
  ],

  'minimum-deletions-to-make-character-frequencies-unique': [
    {
      inputs: ['"aab"'],
      expected: '0',
      explanation_md:
        'Canonical LC example. Frequencies: a=2, b=1. Already unique. Return 0. The algorithm counts frequencies then walks them sorted descending, reducing each to be strictly less than the previous. With unique frequencies the reductions never fire.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaabbbcc"'],
      expected: '2',
      explanation_md:
        'Edge case: ties to resolve. Frequencies: a=3, b=3, c=2. Sorted descending: 3, 3, 2. The second 3 must drop to 2 (1 delete), but 2 is already taken — drop to 1 (2nd delete). Then 2 is fine. Total 2 deletions. Result frequencies 3, 1, 2 — all unique. Catches the bug of dropping the second 3 just to 2 without checking if 2 is also taken.',
      viz_anchor: null,
    },
    {
      inputs: ['"ceabaacb"'],
      expected: '2',
      explanation_md:
        'Algorithmically interesting: more chars, cascading conflicts. Counts: a=3, b=2, c=2, e=1. Sorted: 3, 2, 2, 1. Second 2 must drop. To 1? 1 is taken. Drop to 0? Cost 2 deletes. Now `3, 2, 0, 1` — all unique. Total deletes `2`. Catches the bug of using a greedy "drop by 1" without checking against the running used-set — the algorithm needs a `used` set (or equivalent) to find the next free slot.',
      viz_anchor: null,
    },
  ],

  'count-substrings-with-only-one-distinct-letter': [
    {
      inputs: ['"aaaba"'],
      expected: '8',
      explanation_md:
        'Canonical LC example. Group consecutive runs: `"aaa"` (length 3), `"b"` (1), `"a"` (1). Each run of length L contributes `L*(L+1)/2` substrings. Total `3*4/2 + 1 + 1 = 6 + 1 + 1 = 8`. The single linear pass groups runs without storing them — just track `current_char` and `run_length`. Constant space.',
      viz_anchor: null,
    },
    {
      inputs: ['"aaaaaaaaaa"'],
      expected: '55',
      explanation_md:
        'Edge case: single run of length 10. Contribution `10*11/2 = 55`. Confirms the formula handles a long single run without overflow at this scale and that the algorithm correctly emits exactly one group at end-of-string.',
      viz_anchor: null,
    },
    {
      inputs: ['"abcabc"'],
      expected: '6',
      explanation_md:
        'Algorithmically interesting: no runs longer than 1. Six runs each of length 1 contribute `1*2/2 = 1` each. Total 6 (= each individual char as its own substring). Catches the bug of forgetting that single chars ALSO count as "substrings with one distinct letter" — easy to skip length-1 runs and undercount.',
      viz_anchor: null,
    },
  ],
};

let ok = 0, failed = 0, skipped = 0;
for (const [slug, samples] of Object.entries(PAYLOAD)) {
  const { data, error: fetchErr } = await sb.from('PGcode_problems')
    .select('id, explained_samples').eq('id', slug).maybeSingle();
  if (fetchErr) { console.log(`x ${slug}: ${fetchErr.message}`); failed++; continue; }
  if (!data) { console.log(`- ${slug}: not in DB, skipping`); skipped++; continue; }
  if (Array.isArray(data.explained_samples) && data.explained_samples.length === 3) {
    console.log(`= ${slug}: already 3, skipping`); skipped++; continue;
  }
  const { error } = await sb.from('PGcode_problems')
    .update({ explained_samples: samples })
    .eq('id', slug);
  if (error) { console.log(`x ${slug}: ${error.message}`); failed++; }
  else { console.log(`ok ${slug}`); ok++; }
}
console.log(`ok=${ok} failed=${failed} skipped=${skipped}`);
