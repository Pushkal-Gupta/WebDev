---
slug: manachers-algorithm
module: strings-matching
title: Manacher's Algorithm
subtitle: Find every palindromic substring in linear time.
difficulty: Advanced
position: 6
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Strings chapter"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "cp-algorithms — String processing"
    url: "https://cp-algorithms.com/string/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — strings/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
Manacher's algorithm finds the longest palindromic substring (and, with a small adaptation, every palindromic substring) in **O(n)** time. The naïve "check every centre, expand outward" approach is O(n²); Manacher's matches that lower bound by sharing work across overlapping palindromes.

## whyItMatters
- **Bioinformatics**: DNA reverse-complement search (BWA, BLAST) and RNA secondary-structure prediction rely on linear-time palindrome enumeration over genomes with billions of base pairs — O(n²) is not survivable at that scale.
- **Compression and pattern indexing**: the original LZ77 family and several entries in the Burrows-Wheeler transform pipeline benefit from palindrome runs; Manacher's appears in libdivsufsort-adjacent literature.
- **Text-editor highlighting and code-formatter bracket-matching** apply palindrome detection on token streams for symmetric-construct visualisation.
- **Competitive programming staple** — Codeforces and AtCoder problems regularly require linear-time palindrome processing inside larger string-DP pipelines, where escalating from O(n²) to Manacher's is the only path under tight 2-second limits.
- The 1975 Manacher paper is also a teaching example for amortised analysis using the right-edge potential.

## intuition
The algorithm exists because the obvious O(n²) centre-expansion algorithm wastes enormous amounts of work: it re-verifies characters that lie inside already-known palindromes, even though palindrome symmetry guarantees their match pattern is fixed. Manacher's exploits that symmetry: when you expand around centre `c` to a palindrome of radius `r`, every position `j` inside `[c-r, c+r]` is the mirror image of `2c-j`. So the palindromic radius at `j` is *at least* the minimum of (the mirror's radius, the distance from `j` to the right edge `c+r`). Only when the mirror's palindrome would extend past the current boundary do you need to verify the extension character by character.

The key normalising trick is to insert a sentinel character between every pair of original characters (and at both ends): `abba` becomes `#a#b#b#a#`. After this transformation every palindrome — odd or even in the original — has odd length and a single centre, eliminating the two-pass / two-case code that plagues centre-expansion. Maintain a single state `(C, R)` — the centre and right edge of the rightmost-reaching palindrome found so far. For each new index `i`, mirror across `C` to get `2C - i` and read off the initial guess for `P[i]`.

The amortised analysis is the beautiful part: across the entire sweep, every comparison either confirms `R` moving forward (charged to its destination, which only happens n times) or fails (charged to the position where the mismatch occurs, which only happens once per position). Total work is therefore Θ(n), matching the lower bound for any algorithm that must read the input. The 1975 result was a complete surprise — palindromes seemed inherently quadratic before this paper.

## visualization
Insert sentinels between every character so even-length palindromes look odd: `abba` becomes `#a#b#b#a#`. Now every palindrome has an odd length and a single centre. Maintain `(C, R)` — the centre and right edge of the rightmost-reaching palindrome found so far. For each new index `i`, mirror it across `C` to get the initial radius guess `min(R - i, P[2C - i])`, then expand while characters match.

## bruteForce
For every index, expand around it as a centre while characters mirror. Two passes (odd and even). Total work is the sum of radii, which is Θ(n²) in the worst case (string of all identical characters). Simple to implement, easy to explain, and the right baseline to mention before pivoting to Manacher's.

## optimal
**Technique: Manacher's algorithm (1975) with sentinel transformation and right-edge potential.** The Θ(n) bound is optimal because any algorithm must at least read every character of the input, and Manacher's matches that lower bound exactly. The amortised analysis charges every character comparison either to a forward step of the right edge `R` (which advances at most n times in total) or to a single mismatch at the comparison's position (one per position).

```python
def longest_palindrome(s):
    if not s:
        return ""
    t = "#" + "#".join(s) + "#"          # sentinels make every palindrome odd
    n = len(t)
    P = [0] * n                           # P[i] = palindrome radius at centre i
    C = R = 0                             # current rightmost palindrome (centre, right edge)
    for i in range(n):
        mirror = 2 * C - i
        if i < R:
            P[i] = min(R - i, P[mirror])  # symmetry shortcut, capped by boundary
        a, b = i + P[i] + 1, i - P[i] - 1
        while a < n and b >= 0 and t[a] == t[b]:
            P[i] += 1                     # extend past the boundary if possible
            a += 1; b -= 1
        if i + P[i] > R:
            C, R = i, i + P[i]            # we just found a new rightmost palindrome
    best = max(range(n), key=lambda i: P[i])
    start = (best - P[best]) // 2         # map back to original-string coordinates
    return s[start:start + P[best]]
```

Key lines: the sentinel-injected `t` string normalises odd and even palindromes into a single odd-length case. `P[i] = min(R - i, P[mirror])` is the central reuse step — if the mirror's palindrome fits inside the current window, we copy its radius for free; if it would extend past the right edge, we cap it at the boundary and continue checking. The `while` loop only fires when the palindrome extends past `R`, which is the only case the symmetry shortcut cannot answer. The final `(best - P[best]) // 2` converts a sentinel-string index back to an original-string offset because every two characters of `t` correspond to one of `s` plus a `#`.

For interview presentation, open with the O(n²) centre-expansion baseline and pivot to Manacher's only if asked. Aho-Corasick (1975) is the analogous linear-time pattern-matching algorithm — same era, same paradigm of trading preprocessing for amortised O(1) per character.

## complexity
time: O(n)
space: O(n)
notes: Each character is matched (and possibly mismatched) at most a constant number of times across the whole sweep — the right edge `R` only moves forward, so total expansion work is amortized O(n).

## pitfalls
- Forgetting the sentinel transformation, then juggling odd/even palindromes manually.
- Off-by-one in the mirror computation: it's `2*C - i`, not `C - (i - C)` written inline (those are equal, but the latter is more error-prone).
- Skipping the `i < R` guard and reading garbage from `P[]`.
- Returning the transformed string's palindrome instead of mapping radii back to original-string coordinates.

## interviewTips
- Don't start with Manacher's. Open with "the centre-expansion approach is O(n²); if we need linear, Manacher's exploits the symmetry of nested palindromes." Most interviewers accept the O(n²) and won't push further.
- Walk through the sentinel transformation explicitly: it's the trick most candidates skip and then mess up the indexing.
- Mention applications: Aho–Corasick is the equivalent linear-time pattern matcher; Manacher's is its palindromic cousin.

## code.python
```python
def longest_palindrome(s: str) -> str:
    if not s:
        return ""
    t = "#" + "#".join(s) + "#"
    n = len(t)
    p = [0] * n
    c = r = 0
    for i in range(n):
        mirror = 2 * c - i
        if i < r:
            p[i] = min(r - i, p[mirror])
        a, b = i + p[i] + 1, i - p[i] - 1
        while a < n and b >= 0 and t[a] == t[b]:
            p[i] += 1
            a += 1
            b -= 1
        if i + p[i] > r:
            c, r = i, i + p[i]
    best = max(range(n), key=lambda i: p[i])
    start = (best - p[best]) // 2
    return s[start:start + p[best]]
```

## code.javascript
```javascript
function longestPalindrome(s) {
  if (!s) return "";
  const t = "#" + s.split("").join("#") + "#";
  const n = t.length;
  const p = new Array(n).fill(0);
  let c = 0, r = 0;
  for (let i = 0; i < n; i++) {
    const mirror = 2 * c - i;
    if (i < r) p[i] = Math.min(r - i, p[mirror]);
    let a = i + p[i] + 1, b = i - p[i] - 1;
    while (a < n && b >= 0 && t[a] === t[b]) { p[i]++; a++; b--; }
    if (i + p[i] > r) { c = i; r = i + p[i]; }
  }
  let best = 0;
  for (let i = 1; i < n; i++) if (p[i] > p[best]) best = i;
  const start = (best - p[best]) >> 1;
  return s.slice(start, start + p[best]);
}
```

## code.java
```java
public String longestPalindrome(String s) {
    if (s == null || s.isEmpty()) return "";
    StringBuilder sb = new StringBuilder("#");
    for (char ch : s.toCharArray()) { sb.append(ch).append('#'); }
    String t = sb.toString();
    int n = t.length();
    int[] p = new int[n];
    int c = 0, r = 0, best = 0;
    for (int i = 0; i < n; i++) {
        int mirror = 2 * c - i;
        if (i < r) p[i] = Math.min(r - i, p[mirror]);
        int a = i + p[i] + 1, b = i - p[i] - 1;
        while (a < n && b >= 0 && t.charAt(a) == t.charAt(b)) { p[i]++; a++; b--; }
        if (i + p[i] > r) { c = i; r = i + p[i]; }
        if (p[i] > p[best]) best = i;
    }
    int start = (best - p[best]) / 2;
    return s.substring(start, start + p[best]);
}
```

## code.cpp
```cpp
string longestPalindrome(string s) {
    if (s.empty()) return "";
    string t = "#";
    for (char ch : s) { t += ch; t += '#'; }
    int n = t.size();
    vector<int> p(n, 0);
    int c = 0, r = 0, best = 0;
    for (int i = 0; i < n; i++) {
        int mirror = 2 * c - i;
        if (i < r) p[i] = min(r - i, p[mirror]);
        int a = i + p[i] + 1, b = i - p[i] - 1;
        while (a < n && b >= 0 && t[a] == t[b]) { p[i]++; a++; b--; }
        if (i + p[i] > r) { c = i; r = i + p[i]; }
        if (p[i] > p[best]) best = i;
    }
    int start = (best - p[best]) / 2;
    return s.substr(start, p[best]);
}
```
