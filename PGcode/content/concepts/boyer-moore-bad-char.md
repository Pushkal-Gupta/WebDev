---
slug: boyer-moore-bad-char
module: strings-matching
title: Boyer-Moore Bad-Character Heuristic
subtitle: Skip ahead in the text whenever a mismatched character cannot align with the pattern.
difficulty: Advanced
position: 30
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Princeton Algorithms — Substring Search"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "Boyer-Moore Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/string/z-function.html"
    type: blog
  - title: "TheAlgorithms/Python — boyer_moore_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/boyer_moore_search.py"
    type: repo
status: published
---

## intro
Boyer-Moore is the search algorithm grep was built on. Unlike naive scanning, it compares the pattern to the text from right to left and, on a mismatch, slides the pattern forward by many characters at once. The bad-character heuristic is the simpler of its two shift rules and on its own already delivers sublinear average-case behavior on natural-language text.

## whyItMatters
A naive O(nm) search wastes work re-reading characters that could not possibly start a match. The bad-character rule encodes the observation that if the text character `c` does not appear in the pattern at all, the pattern can jump entirely past `c`. For long patterns over a large alphabet, the expected number of character comparisons is O(n / m), which is why Boyer-Moore beats KMP on most real-world inputs even though both are linear in the worst case.

## intuition
The heuristic exists because naïve substring search shifts the pattern by exactly one position on every mismatch, costing O(nm) on adversarial inputs even when most of the text is structurally incompatible with the pattern. Boyer & Moore (1977) observed two structural facts: (1) comparing right-to-left makes the rightmost mismatch the most informative, because a single character on the right tells you whether *any* alignment ending at this position can possibly succeed; (2) the position of the mismatched character within the pattern tells you the maximum safe shift.

The decisive observation: when text character `c` mismatches at pattern position `j` (counting from the left), look up the rightmost occurrence of `c` in the pattern. Call it `last[c]`. Three cases. (1) `last[c] = -1` (c doesn't appear in the pattern at all): no alignment of the pattern that contains the current text position can match, so slide the pattern entirely past `c` — shift by `j + 1`. (2) `last[c] < j` (rightmost c in pattern is to the left of the mismatch): slide so that occurrence aligns under `c` — shift by `j - last[c]`, which is ≥ 1. (3) `last[c] > j` (rightmost c is to the right): shifting backward would be unsafe, so default to shift by 1; this is the `max(1, shift)` guard.

The key efficiency lever is the right-to-left comparison. Comparing left-to-right would still give a correct algorithm but loses most of the skip benefit: a mismatch at the leftmost position carries little information about where to slide. Right-to-left comparison means the very first character we look at (the rightmost of the alignment) often suffices to disqualify the entire alignment and jump many characters forward.

For long patterns over large alphabets (English text, byte streams), the expected number of character comparisons is O(n / m) — sublinear in n, which is why grep, the original Boyer-Moore implementation (1977 paper), and most production substring matchers ship this heuristic. KMP and the Z-function are O(n + m) worst-case but typically lose to Boyer-Moore on natural-language and binary input because their per-character work doesn't exploit the structural skip rule.

The bad-character heuristic alone has O(nm) worst-case (text `AAAA...AAAB`, pattern `AAAB`); combining it with the good-suffix heuristic gives the full Boyer-Moore algorithm with O(n) worst-case time (Cole 1994 tight analysis). Production grep variants often use bad-character only because the good-suffix rule's marginal speedup on typical input is small relative to its implementation complexity.

## visualization
Text `HERE IS A SIMPLE EXAMPLE` and pattern `EXAMPLE`. Align under `HERE IS`. Compare from the right: `S` vs `E`. Mismatch, and `S` is not in `EXAMPLE`, so shift the pattern 7 places to the right, past the `S`. Continue. Each mismatch teleports the cursor forward instead of nudging it one step at a time.

## bruteForce
The naive substring search tries every starting offset `i` from 0 to `n - m` and at each one compares character by character left to right, breaking on mismatch and shifting by exactly one. Worst case O(nm) on adversarial inputs like text `AAAA...AAAB` and pattern `AAAB`. Simple to write, but slow on long patterns and large alphabets where Boyer-Moore's skip rule would otherwise let you leap dozens of characters per mismatch.

## optimal
**Technique: Boyer-Moore bad-character heuristic — right-to-left comparison with rightmost-occurrence skip table.** O(n / m) expected on natural text and binary streams; O(nm) worst case with bad-character only, O(n) worst case when combined with the good-suffix rule (full Boyer-Moore).

```python
def boyer_moore_bad_char(text, pattern):
    n, m = len(text), len(pattern)
    if m == 0:
        return 0
    last = {}                                         # last[c] = rightmost index in pattern
    for j, c in enumerate(pattern):
        last[c] = j
    i = 0
    while i <= n - m:
        j = m - 1                                     # compare RIGHT-TO-LEFT
        while j >= 0 and pattern[j] == text[i + j]:
            j -= 1
        if j < 0:
            return i                                  # full match
        shift = j - last.get(text[i + j], -1)
        i += max(1, shift)                            # guard against negative shift
    return -1
```

Key lines: `for j, c in enumerate(pattern): last[c] = j` builds the last-occurrence table; iterating left-to-right and overwriting ensures `last[c]` ends up as the *rightmost* occurrence of c in the pattern — exactly the value the shift rule needs. The inner `while j >= 0 and pattern[j] == text[i + j]: j -= 1` is the right-to-left comparison; matches advance `j` leftward until either the full pattern matches (`j < 0`) or a mismatch is found. The shift formula `j - last.get(text[i + j], -1)` handles both the "character not in pattern" case (returns `-1`, so shift = `j + 1`, sliding past the bad character) and the "rightmost occurrence is left of j" case (positive shift aligning the occurrence under the mismatch). The `max(1, shift)` guard is essential — when `last[c] > j`, the formula would produce a non-positive shift and the algorithm would loop forever or move backward.

For ASCII inputs, replace the hash map with a 256-entry array for ~3× speedup (dense indexing vs hash lookup). For Unicode, the hash map is the right call; alphabet size only affects the constant factor, not asymptotic complexity.

**Why right-to-left comparison?** Comparing left-to-right would give a correct algorithm but lose most of the skip benefit. The rightmost character is the most informative because it pins down the *end* of the alignment; a mismatch there often disqualifies many subsequent alignments via the bad-character rule. **Why not KMP?** KMP is O(n + m) worst-case unconditionally but typically loses to Boyer-Moore on natural text because its per-character work doesn't exploit alphabet structure. For binary alphabets or short patterns, KMP wins. **Why not Aho-Corasick?** Aho-Corasick is the multi-pattern generalisation — use it when you need to match many patterns simultaneously (signature matching in Snort IDS, malware scanning). **Why not rolling hash?** Rabin-Karp is expected O(n + m) but has collision risk; Boyer-Moore is deterministic. **Common bugs**: forgetting the `max(1, shift)` guard (infinite loop); initialising `last[c] = 0` instead of `-1` for absent characters (formula breaks); storing the leftmost occurrence instead of rightmost (sliding overshoots and misses matches); comparing left-to-right out of habit (loses the skip benefit, degrades to naïve behaviour).

## complexity
time: O(n / m) expected on natural text, O(nm) worst case with bad-character only
space: O(sigma) for the last-occurrence table, where sigma is the alphabet size
notes: Combining the bad-character rule with the good-suffix rule yields the full Boyer-Moore algorithm with O(n) worst-case time. The bad-character heuristic alone is what most production grep implementations actually ship.

## pitfalls
- Forgetting the `max(1, shift)` guard — a negative shift loops forever.
- Initializing `last[c]` to 0 instead of `-1` collapses the formula `j - last[c]` for absent characters.
- Storing the leftmost occurrence instead of the rightmost — the rule needs the rightmost so the pattern slides as little as possible without missing a match.
- Comparing left to right out of habit — the algorithm only works because the rightmost comparison gives you the most informative mismatch.

## interviewTips
- Mention that real grep uses this; it signals you have shipped or studied real code, not just leetcode.
- If the interviewer pushes for the worst-case O(n) guarantee, pivot to the good-suffix rule or to KMP.
- For ASCII a 256-entry array is enough; for Unicode use a hash map and quote the alphabet cost out loud.

## code.python
```python
def boyer_moore_bad_char(text, pattern):
    n, m = len(text), len(pattern)
    if m == 0:
        return 0
    last = {}
    for j, c in enumerate(pattern):
        last[c] = j
    i = 0
    while i <= n - m:
        j = m - 1
        while j >= 0 and pattern[j] == text[i + j]:
            j -= 1
        if j < 0:
            return i
        shift = j - last.get(text[i + j], -1)
        i += max(1, shift)
    return -1
```

## code.javascript
```javascript
function boyerMooreBadChar(text, pattern) {
  const n = text.length, m = pattern.length;
  if (m === 0) return 0;
  const last = new Map();
  for (let j = 0; j < m; j++) last.set(pattern[j], j);
  let i = 0;
  while (i <= n - m) {
    let j = m - 1;
    while (j >= 0 && pattern[j] === text[i + j]) j--;
    if (j < 0) return i;
    const lo = last.has(text[i + j]) ? last.get(text[i + j]) : -1;
    i += Math.max(1, j - lo);
  }
  return -1;
}
```

## code.java
```java
public int boyerMooreBadChar(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    if (m == 0) return 0;
    int[] last = new int[256];
    java.util.Arrays.fill(last, -1);
    for (int j = 0; j < m; j++) last[pattern.charAt(j)] = j;
    int i = 0;
    while (i <= n - m) {
        int j = m - 1;
        while (j >= 0 && pattern.charAt(j) == text.charAt(i + j)) j--;
        if (j < 0) return i;
        int shift = j - last[text.charAt(i + j)];
        i += Math.max(1, shift);
    }
    return -1;
}
```

## code.cpp
```cpp
int boyerMooreBadChar(const std::string& text, const std::string& pattern) {
    int n = text.size(), m = pattern.size();
    if (m == 0) return 0;
    std::vector<int> last(256, -1);
    for (int j = 0; j < m; ++j) last[(unsigned char)pattern[j]] = j;
    int i = 0;
    while (i <= n - m) {
        int j = m - 1;
        while (j >= 0 && pattern[j] == text[i + j]) --j;
        if (j < 0) return i;
        int shift = j - last[(unsigned char)text[i + j]];
        i += std::max(1, shift);
    }
    return -1;
}
```
