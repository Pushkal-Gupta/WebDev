---
slug: string-manacher
module: sorting-strings
title: Manacher's Algorithm
subtitle: Longest palindromic substring in O(n) — reuse mirror reflections to avoid recomputation.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Manacher's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/string/manacher.html"
    type: blog
  - title: "Longest Palindromic Substring — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/manachers-algorithm-linear-time-longest-palindromic-substring-part-1/"
    type: blog
  - title: "kactl — Manacher reference"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
Given a string s of length n, find the longest contiguous substring that reads the same forward and backward. Expand-around-center solves it in O(n^2). Manacher's algorithm solves it in O(n) by exploiting a clever invariant: once you've expanded around some center C with a right boundary R, the palindrome lengths inside [C, R] mirror those on the left side of C — so for any new center i inside [C, R], you can skip directly to the mirrored length instead of starting from zero.

## whyItMatters
Longest palindromic substring is a recurring interview question (LeetCode 5, classic), but the deeper reason to know Manacher's is that it teaches a general pattern: amortized expansion bounded by a moving right boundary. The same pattern underlies Z-function, KMP failure function, and suffix-automaton construction. Mastering Manacher's unlocks a family of linear-time string algorithms.

## intuition
Imagine a center C with palindrome radius P, so the palindrome spans [C - P, C + P]. For any position i to the right of C but inside [C, C + P], its mirror j = 2*C - i lies inside the known palindrome. The palindrome at j has some radius p[j]. By symmetry, position i is guaranteed at least min(p[j], C + P - i) of that radius for free — start expanding only beyond that. Each character is expanded past at most once across the whole run, giving O(n) total work.

## visualization
Transform "abacaba" into "^#a#b#a#c#a#b#a#$" (sentinels + interleaved #) so every palindrome is odd-length and centered on a real character or a #. Walk i from 1 to end. Maintain (C, R), the center and right edge of the rightmost-reaching palindrome so far. For each i: initialize p[i] = min(R - i, p[mirror]) if i < R else 0; expand while sentinels match; if i + p[i] > R, update (C, R) = (i, i + p[i]). Answer is max p[i]; map back to original string indices.

## bruteForce
Pick every (i, j) pair, check if s[i..j] is a palindrome. O(n^3). Better: expand around every possible center (each character, each gap between characters). O(n^2) time, O(1) space. Expand-around-center is the right answer for interviews unless they specifically ask for linear time — it's much easier to write correctly under pressure and handles the same constraints up to n ~ 5000.

## optimal
Manacher's. Preprocess s into t by interleaving a sentinel (typically '#') between every pair of characters and bookending with distinct sentinels (^ and $) so bounds checks vanish. Walk t with a `(center, right)` pair representing the palindrome reaching farthest right; for each i, seed p[i] from its mirror's value clipped to the boundary, then expand. The amortized argument is tight: each expansion step advances the right boundary by 1, and the boundary moves at most 2n times total.

## complexity
time: O(n) — each expansion step monotonically advances the right boundary.
space: O(n) for the transformed string and the radius array.
notes: The sentinel-interleaving trick (interleave '#', bookend with ^ and $) is what unifies odd- and even-length palindromes into one loop. Without it, you write two near-identical loops and double the bug surface.

## pitfalls
- Forgetting to handle the case i >= R — must initialize p[i] = 0 and expand from scratch.
- Off-by-one in the mirror calculation — it's 2*C - i, not C - (i - C) - 1 (those differ when i == C).
- Mapping the answer back to the original string: index in t corresponds to (idx - 1) / 2 in s; length p[i] in t equals exact length in s.
- Using a sentinel character that actually appears in the input — pick something guaranteed absent or use ints in an int array.

## interviewTips
- Lead with expand-around-center O(n^2). Mention Manacher's O(n) as the optimization if pressed.
- Few interviewers expect a clean Manacher's at the whiteboard — pseudocode + the mirror-invariant explanation usually scores full marks.
- Mention Eertree (palindromic tree) as the modern alternative for problems counting *distinct* palindromic substrings — different tool, same family.

## code.python
```python
def manacher(s):
    t = "^#" + "#".join(s) + "#$"
    n = len(t)
    p = [0] * n
    c = r = 0
    for i in range(1, n - 1):
        mirror = 2 * c - i
        if i < r:
            p[i] = min(r - i, p[mirror])
        while t[i + p[i] + 1] == t[i - p[i] - 1]:
            p[i] += 1
        if i + p[i] > r:
            c, r = i, i + p[i]
    max_len = max(p)
    center = p.index(max_len)
    start = (center - max_len) // 2
    return s[start:start + max_len]
```

## code.javascript
```javascript
function manacher(s) {
  const t = "^#" + s.split("").join("#") + "#$";
  const n = t.length;
  const p = new Array(n).fill(0);
  let c = 0, r = 0;
  for (let i = 1; i < n - 1; i++) {
    const mirror = 2 * c - i;
    if (i < r) p[i] = Math.min(r - i, p[mirror]);
    while (t[i + p[i] + 1] === t[i - p[i] - 1]) p[i]++;
    if (i + p[i] > r) { c = i; r = i + p[i]; }
  }
  let maxLen = 0, center = 0;
  for (let i = 0; i < n; i++) if (p[i] > maxLen) { maxLen = p[i]; center = i; }
  const start = (center - maxLen) >> 1;
  return s.slice(start, start + maxLen);
}
```

## code.java
```java
public class Manacher {
    public String longestPalindrome(String s) {
        StringBuilder sb = new StringBuilder("^#");
        for (char ch : s.toCharArray()) { sb.append(ch).append('#'); }
        sb.append('$');
        String t = sb.toString();
        int n = t.length();
        int[] p = new int[n];
        int c = 0, r = 0;
        for (int i = 1; i < n - 1; i++) {
            int mirror = 2 * c - i;
            if (i < r) p[i] = Math.min(r - i, p[mirror]);
            while (t.charAt(i + p[i] + 1) == t.charAt(i - p[i] - 1)) p[i]++;
            if (i + p[i] > r) { c = i; r = i + p[i]; }
        }
        int maxLen = 0, center = 0;
        for (int i = 0; i < n; i++) if (p[i] > maxLen) { maxLen = p[i]; center = i; }
        int start = (center - maxLen) / 2;
        return s.substring(start, start + maxLen);
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <algorithm>

std::string manacher(const std::string& s) {
    std::string t = "^#";
    for (char ch : s) { t.push_back(ch); t.push_back('#'); }
    t.push_back('$');
    int n = t.size();
    std::vector<int> p(n, 0);
    int c = 0, r = 0;
    for (int i = 1; i < n - 1; i++) {
        int mirror = 2 * c - i;
        if (i < r) p[i] = std::min(r - i, p[mirror]);
        while (t[i + p[i] + 1] == t[i - p[i] - 1]) p[i]++;
        if (i + p[i] > r) { c = i; r = i + p[i]; }
    }
    int maxLen = 0, center = 0;
    for (int i = 0; i < n; i++) if (p[i] > maxLen) { maxLen = p[i]; center = i; }
    int start = (center - maxLen) / 2;
    return s.substr(start, maxLen);
}
```
