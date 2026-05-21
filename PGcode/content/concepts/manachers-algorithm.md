---
slug: manachers-algorithm
module: sorting-strings
title: Manacher's Algorithm
subtitle: Find every palindromic substring in linear time.
difficulty: Advanced
position: 6
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Reference Material — Module 5 — Manacher's Algorithm"
    url: ""
status: published
---

## intro
Manacher's algorithm finds the longest palindromic substring (and, with a small adaptation, every palindromic substring) in **O(n)** time. The naïve "check every centre, expand outward" approach is O(n²); Manacher's matches that lower bound by sharing work across overlapping palindromes.

## whyItMatters
Linear-time palindrome detection underpins compression formats, DNA reverse-complement search, and the classic interview question "longest palindromic substring." Most candidates know the O(n²) centre-expansion idea; recognising when to escalate to Manacher's separates "good enough" from "production-grade."

## intuition
Centre-expansion repeats work: when you finish expanding around centre `i` and discover a palindrome of radius `r`, the palindromes inside that range are *mirrored*. So when you start expanding around a new centre `j` that falls inside `[i - r, i + r]`, you already know its radius — it equals the radius of its mirror centre `2i - j`, *unless* it would extend past the current palindrome's boundary, in which case you only need to verify the extension. That "skip ahead using the mirror" trick is what amortizes the cost to O(n).

## visualization
Insert sentinels between every character so even-length palindromes look odd: `abba` becomes `#a#b#b#a#`. Now every palindrome has an odd length and a single centre. Maintain `(C, R)` — the centre and right edge of the rightmost-reaching palindrome found so far. For each new index `i`, mirror it across `C` to get the initial radius guess `min(R - i, P[2C - i])`, then expand while characters match.

## bruteForce
For every index, expand around it as a centre while characters mirror. Two passes (odd and even). Total work is the sum of radii, which is Θ(n²) in the worst case (string of all identical characters). Simple to implement, easy to explain, and the right baseline to mention before pivoting to Manacher's.

## optimal
Transform the string with separators, then sweep left-to-right maintaining `(C, R)`. For each `i`:
1. Initial radius `P[i] = min(R - i, P[2C - i])` if `i < R`, else 0.
2. Expand outward while characters match.
3. If the new palindrome extends past `R`, update `C` and `R`.

Reconstruct the longest palindromic substring from the index of the maximum `P[i]`.

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
