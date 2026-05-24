---
slug: boyer-moore-bad-char
module: sorting-strings
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
Align the pattern under the text. Compare from the right end of the pattern leftward. The instant you find a mismatched text character `c`, ask: "Where is the rightmost occurrence of `c` in the pattern, to the left of the current pattern position?" Slide the pattern so that occurrence lines up under `c`. If `c` does not appear in the pattern at all, slide the pattern entirely past `c`.

## visualization
Text `HERE IS A SIMPLE EXAMPLE` and pattern `EXAMPLE`. Align under `HERE IS`. Compare from the right: `S` vs `E`. Mismatch, and `S` is not in `EXAMPLE`, so shift the pattern 7 places to the right, past the `S`. Continue. Each mismatch teleports the cursor forward instead of nudging it one step at a time.

## bruteForce
The naive substring search tries every starting offset `i` from 0 to `n - m` and at each one compares character by character left to right, breaking on mismatch and shifting by exactly one. Worst case O(nm) on adversarial inputs like text `AAAA...AAAB` and pattern `AAAB`. Simple to write, but slow on long patterns and large alphabets where Boyer-Moore's skip rule would otherwise let you leap dozens of characters per mismatch.

## optimal
Precompute a table `last[c]` = index of the rightmost occurrence of character `c` in the pattern, or `-1` if absent. Loop with `i` over the text. For each alignment, compare from `j = m - 1` down to `0`. On match at `j == 0`, report the hit. On mismatch at position `j` with text character `c`, advance `i` by `max(1, j - last[c])`. The `max(1, ...)` guards the case where `last[c]` is to the right of `j`, which would otherwise produce a negative shift.

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
