---
slug: string-manacher
module: strings-matching
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
- **Bioinformatics**: DNA reverse-complement palindrome detection (restriction-enzyme cut sites, hairpin loops in RNA secondary structure) — BWA, BLAST, and ViennaRNA scan billions of base pairs where O(n²) centre-expansion is unsurvivable.
- **Competitive programming staple**: linear-time palindrome enumeration inside larger string-DP pipelines on Codeforces/AtCoder. Escalating from O(n²) to Manacher's is often the only path under tight 2-second time limits.
- **Compression**: certain LZ77 family variants and Burrows-Wheeler post-processing benefit from palindrome runs; the Eertree (palindromic tree, Rubinchik 2015) is the modern alternative for counting *distinct* palindromic substrings.
- **Text-editor and code-formatter bracket-matching** apply palindrome detection on token streams for symmetric-construct visualisation; some configurations escalate to Manacher when scanning huge files.
- **LeetCode 5 (Longest Palindromic Substring)** is the textbook interview prompt; LC 647 and 1745 are direct variants.
- **Teaching value**: the amortised-expansion-bounded-by-a-moving-right-boundary pattern underlies Z-function, KMP failure function, suffix-automaton construction, and Aho-Corasick failure links — mastering Manacher's unlocks the whole family.

## intuition
The algorithm exists because the obvious O(n²) centre-expansion algorithm wastes enormous work re-verifying characters that lie inside already-known palindromes — palindrome symmetry guarantees their match pattern. Manacher (1975) exploits that symmetry: when we know a palindrome centred at C with right boundary R, every position i inside [C, R] is the mirror image of `2C − i`. So the palindromic radius at i is *at least* the minimum of the mirror's radius and the distance from i to R. Only when the mirror's palindrome would extend past R do we need to verify the extension character by character.

The decisive observation: maintain a "rightmost-reaching" palindrome state (C, R). For each new index i, look up the mirror's radius `p[2C − i]` and seed `p[i] = min(R − i, p[2C − i])` if `i < R`, else 0. Then attempt to extend past the seeded bound — most of the time, the seeded value already maximally fills R − i, so no expansion is needed. The amortised analysis is beautiful: each successful expansion advances R by 1, and R only moves forward at most n times across the entire algorithm. So the total expansion work across all positions is O(n), not O(n²).

The sentinel-interleaving trick normalises odd and even palindromes into a single case. Transform "abba" into "^#a#b#b#a#$" — bookend with sentinels (`^` and `$`) to eliminate bounds checks, and interleave `#` between every pair of original characters. After transformation, every palindrome (odd or even in the original) has odd length and a single centre in the transformed string. This collapses the two-case loop (odd-centred and even-centred) into one unified pass, halving the bug surface and the code length.

Mapping back to original indices: a palindrome at transformed position i with radius p[i] corresponds to a palindrome of length p[i] in the original string starting at index `(i − p[i]) / 2`. The transformed-to-original conversion accounts for the inserted `#` characters and the `^` prefix.

## visualization
Transform "abacaba" into "^#a#b#a#c#a#b#a#$" (sentinels + interleaved #) so every palindrome is odd-length and centered on a real character or a #. Walk i from 1 to end. Maintain (C, R), the center and right edge of the rightmost-reaching palindrome so far. For each i: initialize p[i] = min(R - i, p[mirror]) if i < R else 0; expand while sentinels match; if i + p[i] > R, update (C, R) = (i, i + p[i]). Answer is max p[i]; map back to original string indices.

## bruteForce
Pick every (i, j) pair, check if s[i..j] is a palindrome. O(n^3). Better: expand around every possible center (each character, each gap between characters). O(n^2) time, O(1) space. Expand-around-center is the right answer for interviews unless they specifically ask for linear time — it's much easier to write correctly under pressure and handles the same constraints up to n ~ 5000.

## optimal
**Technique: Manacher's algorithm — sentinel-interleaved transformation + mirror-aware expansion with rightmost-palindrome tracking.** O(n) time, O(n) space. Optimal because any algorithm must read every character at least once (Ω(n)) and Manacher's saturates the lower bound via amortised analysis charging each expansion to a forward step of the right boundary.

```python
def manacher(s):
    t = "^#" + "#".join(s) + "#$"            # sentinels eliminate bounds checks; # normalises parity
    n = len(t)
    p = [0] * n                                # p[i] = palindrome radius centred at t[i]
    c = r = 0                                  # current rightmost palindrome's (centre, right edge)
    for i in range(1, n - 1):
        mirror = 2 * c - i
        if i < r:
            p[i] = min(r - i, p[mirror])      # symmetry shortcut, capped by boundary
        while t[i + p[i] + 1] == t[i - p[i] - 1]:
            p[i] += 1                          # expand past the boundary
        if i + p[i] > r:                       # we just found a new rightmost palindrome
            c, r = i, i + p[i]

    # Find the maximum-radius palindrome and map back to original string indices
    best_i = max(range(n), key=lambda i: p[i])
    start = (best_i - p[best_i]) // 2          # transformed-to-original index conversion
    return s[start:start + p[best_i]]
```

Key lines: `t = "^#" + "#".join(s) + "#$"` is the sentinel transformation. The `^` and `$` bookends eliminate the need for explicit bounds checks inside the expansion loop — `t[i + p[i] + 1] == t[i - p[i] - 1]` will simply fail at the sentinels because `^` and `$` are distinct characters that match nothing else. The interleaved `#` characters ensure every palindrome in the original string corresponds to an odd-length palindrome in the transformed string with a single centre — collapsing the odd/even case split into one unified loop.

`p[i] = min(r - i, p[mirror])` is the symmetry shortcut. If i is inside the current rightmost palindrome `[c - r, c + r]`, its mirror across c is at position `2c - i`. By palindrome symmetry, the palindromic radius at i is *at least* the mirror's radius, *unless* it would extend past the current right boundary r — in which case we cap at `r - i` and let the explicit expansion verify any extension. This single line is what amortises the work to O(n).

The `while` expansion loop only runs when the symmetry shortcut cannot answer fully — i.e., when the palindrome at i would extend past r. Each successful expansion advances r by 1 (in the subsequent `c, r = i, i + p[i]` update), and r only moves forward at most n times across the entire algorithm. So total expansion work is O(n), not O(n²). This is the same amortised-expansion-bounded-by-moving-right-edge pattern that powers Z-function, KMP failure function, and Aho-Corasick.

The mapping `start = (best_i - p[best_i]) // 2` converts a transformed-string index back to the original string. Every two transformed characters correspond to one original character plus an inserted `#`, so the division by 2 strips the `#`-offset and the `^` prefix.

**Why not centre-expansion?** Centre-expansion is O(n²) — fine for n ≤ 5000 but unusable above. Open with centre-expansion in interviews and only pivot to Manacher's if pressed for linear time. **Why not suffix automaton or Eertree?** Eertree (Rubinchik 2015) counts *distinct* palindromic substrings in O(n); Manacher counts all *occurrences* of the longest palindrome. Different problems, different tools. **Why not hashing + binary search?** O(n log n) expected with collision risk; Manacher is deterministic and faster. **Common bugs**: forgetting sentinels (bounds-check juggling); off-by-one in mirror calculation (`2c - i`, never `c - (i - c) - 1` which differs at i = c); mapping transformed indices wrong (start should be `(i - p[i]) // 2`, not `i - p[i]`); using a `#` separator that appears in the input (pick a character guaranteed absent or use integer arrays).

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
