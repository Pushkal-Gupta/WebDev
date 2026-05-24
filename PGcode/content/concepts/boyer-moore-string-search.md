---
slug: boyer-moore-string-search
module: sorting-strings
title: Boyer-Moore String Search
subtitle: Skip large chunks of the haystack by combining the bad-character and good-suffix heuristics.
difficulty: Advanced
position: 22
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Substring Search (Algorithms, 4th Edition)"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "Boyer-Moore Algorithm for Pattern Searching — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/boyer-moore-algorithm-for-pattern-searching/"
    type: blog
  - title: "TheAlgorithms/Python — boyer_moore_search.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/boyer_moore_search.py"
    type: repo
status: published
---

## intro
Boyer-Moore finds occurrences of a pattern `P` of length `m` inside a text `T` of length `n` while routinely skipping multiple characters per mismatch — often achieving sublinear running time in practice. The trick is comparing the pattern against the text *from right to left* and using two precomputed shift tables, the bad-character rule and the good-suffix rule, to jump as far forward as both rules allow.

## whyItMatters
For long patterns over large alphabets, Boyer-Moore is the fastest single-pattern matcher in practice; it is what grep used for decades and what most editors' "find" feature still resembles. Naive search is `O(n * m)`; KMP is `O(n + m)` but never skips ahead. Boyer-Moore can examine as few as `n / m` characters in the best case, which on English text is typically an order of magnitude faster than KMP.

## intuition
Align `P` with `T` and compare from the right end of `P`. When a mismatch happens at text character `c`:
- **Bad-character rule:** shift `P` so that the rightmost occurrence of `c` in `P` lines up under the mismatch position. If `c` does not appear in `P`, slide `P` entirely past `c`.
- **Good-suffix rule:** if some right suffix `s` of `P` matched before the mismatch, shift `P` so that another occurrence of `s` inside `P` aligns there; if no such occurrence, shift to align the longest prefix of `P` that is also a suffix of `s`.

The actual shift is the **maximum** of the two rules. Right-to-left comparison is what makes both rules legal — a mismatch deep in `P` proves something about a long stretch of `T`.

## visualization
```
T: A B C A B D A B C D A B C
P:         A B C D                 (m = 4, aligned at index 4)

Compare P right-to-left: D vs D match. C vs C match. B vs B match. A vs A match. HIT at index 4.

Next, slide and try again at index 5:
T: A B C A B D A B C D A B C
P:           A B C D
Right-to-left: D vs C MISMATCH at text index 8. Text char 'C'.
  bad-char: rightmost 'C' in P is index 2. Shift = (m - 1) - 2 = 1.
  good-suffix: no suffix matched. Shift = 1.
Final shift = max(1, 1) = 1.
```
On English text most mismatches let you shift 4-6 characters at once, which is why the algorithm feels nearly free.

## bruteForce
The obvious matcher tries every alignment `i = 0..n - m` and compares `P` to `T[i..i+m]` character by character. Worst case `O(n * m)`, and it never learns from previous comparisons. Even slight pattern repetition triggers near-worst-case behavior (think `T = "aaaa...aab"` and `P = "aaab"`). Fine for tiny inputs, useless for serious search.

## optimal
Precompute:
- `bad_char[c]` = last index of character `c` in `P`, or `-1` if absent.
- `good_suffix[i]` = how far to shift when a mismatch occurs at pattern index `i` and `P[i+1..m-1]` matched.

Then loop with `s` as the current alignment:
1. Set `j = m - 1`.
2. While `j >= 0` and `P[j] == T[s + j]`, decrement `j`.
3. If `j < 0`, record a match at `s`, advance `s` by `good_suffix[0]` (or `1` if you only need the first match).
4. Else shift by `max(j - bad_char[T[s + j]], good_suffix[j])`.

```
boyer_moore(T, P):
  precompute bad_char, good_suffix
  s = 0
  while s <= n - m:
    j = m - 1
    while j >= 0 and P[j] == T[s + j]: j -= 1
    if j < 0:
      emit s
      s += good_suffix[0]
    else:
      s += max(j - bad_char[T[s + j]], good_suffix[j])
```

## complexity
time: O(n / m) best, O(n + m + sigma) average, O(n * m) worst (rare with both rules); preprocessing O(m + sigma)
space: O(m + sigma) where sigma is the alphabet size
notes: With only the bad-character rule, the worst case is `O(n * m)` and easy to trigger; adding the good-suffix rule gives the Galil variant a true `O(n)` worst case. In practice on English text the algorithm examines roughly `n / 4` to `n / 6` characters.

## pitfalls
- Implementing only the bad-character rule and claiming "Boyer-Moore." That variant degrades on `P = "aaaa"` text and is not the full algorithm.
- Off-by-one in the bad-character shift formula — the correct minimum shift is `1`, not `0`, even if `bad_char[c] >= j`.
- Forgetting to reset `j = m - 1` after a successful match; you will silently skip overlapping matches.
- Allocating `bad_char` as a hashmap instead of a fixed-size array when the alphabet is ASCII — measurable constant-factor loss.

## interviewTips
- Always say "right-to-left comparison" first; it is the single non-obvious idea that powers both heuristics.
- Bring up the trade-off versus KMP: KMP is linear worst case and great for streaming text; Boyer-Moore is sublinear in practice but assumes random access to the haystack.
- Mention real-world cousins: Boyer-Moore-Horspool (only bad-character, simpler) is what many libraries actually ship; Sunday's algorithm adds a one-past-the-end bad-character lookup for even bigger jumps.
- Multi-pattern variant is Commentz-Walter; if the interviewer asks for many patterns, switch to Aho-Corasick instead.

## code.python
```python
def boyer_moore(text, pattern):
    n, m = len(text), len(pattern)
    if m == 0:
        return [0]
    bad_char = {}
    for i, c in enumerate(pattern):
        bad_char[c] = i

    matches = []
    s = 0
    while s <= n - m:
        j = m - 1
        while j >= 0 and pattern[j] == text[s + j]:
            j -= 1
        if j < 0:
            matches.append(s)
            s += 1
        else:
            s += max(1, j - bad_char.get(text[s + j], -1))
    return matches
```

## code.javascript
```javascript
function boyerMoore(text, pattern) {
  const n = text.length, m = pattern.length;
  if (m === 0) return [0];
  const badChar = new Map();
  for (let i = 0; i < m; i++) badChar.set(pattern[i], i);

  const matches = [];
  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    while (j >= 0 && pattern[j] === text[s + j]) j--;
    if (j < 0) {
      matches.push(s);
      s += 1;
    } else {
      const last = badChar.has(text[s + j]) ? badChar.get(text[s + j]) : -1;
      s += Math.max(1, j - last);
    }
  }
  return matches;
}
```

## code.java
```java
public List<Integer> boyerMoore(String text, String pattern) {
    int n = text.length(), m = pattern.length();
    List<Integer> matches = new ArrayList<>();
    if (m == 0) { matches.add(0); return matches; }
    int[] badChar = new int[256];
    Arrays.fill(badChar, -1);
    for (int i = 0; i < m; i++) badChar[pattern.charAt(i)] = i;

    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && pattern.charAt(j) == text.charAt(s + j)) j--;
        if (j < 0) {
            matches.add(s);
            s += 1;
        } else {
            s += Math.max(1, j - badChar[text.charAt(s + j)]);
        }
    }
    return matches;
}
```

## code.cpp
```cpp
vector<int> boyerMoore(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    vector<int> matches;
    if (m == 0) { matches.push_back(0); return matches; }
    vector<int> badChar(256, -1);
    for (int i = 0; i < m; ++i) badChar[(unsigned char)pattern[i]] = i;

    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && pattern[j] == text[s + j]) --j;
        if (j < 0) {
            matches.push_back(s);
            s += 1;
        } else {
            s += max(1, j - badChar[(unsigned char)text[s + j]]);
        }
    }
    return matches;
}
```
