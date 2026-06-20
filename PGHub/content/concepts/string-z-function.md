---
slug: string-z-function
module: strings-matching
title: Z-Function for Pattern Matching
subtitle: Build a Z-array in O(n) to find every pattern occurrence — simpler to derive than KMP.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Z-function — cp-algorithms"
    url: "https://cp-algorithms.com/string/z-function.html"
    type: blog
  - title: "String Matching with Z-Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/z-algorithm-linear-time-pattern-searching-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — z_function.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/z_function.py"
    type: repo
status: published
---

## intro
The Z-function of a string s is an array Z where Z[i] is the length of the longest substring starting at i that matches a prefix of s. Computed in O(n) time, it solves pattern matching ("find all occurrences of p in t") in O(n + m) — the same bound as KMP, but with a derivation most candidates find easier to keep straight under interview pressure.

## whyItMatters
- **Pattern matching in editors and search tools**: `grep`, `ripgrep`, GNU `sed`, search-and-replace in every IDE — all use O(n+m) string-matching primitives; the Z-function is one of two textbook options (KMP being the other) for fixed-pattern search.
- **Bioinformatics**: DNA sequence alignment (BWA, Bowtie's seed-and-extend), reverse-complement search, motif discovery — Z-function-based matching is used inside larger alignment pipelines.
- **Log analysis and intrusion detection**: substring search over multi-gigabyte log files (Splunk, Elasticsearch query layer for fixed phrases) reduces to Z-function or KMP for the per-pattern case.
- **Plagiarism detection** (MOSS, JPlag) uses Z-function-derived prefix-match arrays as a fast filter before more expensive shingling and rolling-hash comparison.
- **Competitive programming**: the Z-function additionally answers prefix-overlap questions that KMP can't directly — period detection (string s has period p iff Z[p] = n − p), Lyndon decomposition support, longest-prefix-that-is-also-a-suffix queries, run-length-encoding of repeated prefix structures.
- **The Gusfield 1997 book** introduced the modern Z-function presentation; the underlying algorithm dates to the same era as KMP (1977).

## intuition
The algorithm exists because naïve "for each position i, walk forward comparing s[i+k] to s[k] until they differ" is Θ(n²) — the worst case being a string like "aaaa...aab" where each position scans nearly to the end. The escape route is the same amortised-expansion-bounded-by-moving-right-edge trick that powers KMP and Manacher: maintain a window [L, R] of the rightmost interval already proven to match a prefix of s, and reuse that knowledge to seed Z[i] for any i inside the window.

The decisive observation: if `s[L..R]` equals `s[0..R-L]` (the window is a prefix-match), then for any i inside [L, R], the substring `s[i..R]` equals `s[i-L..R-L]` by direct character correspondence. The longest prefix-match starting at i is therefore at least min(Z[i-L], R-i+1) — bounded by Z[i-L] (the mirror's prefix-match length) and by R-i+1 (the remaining window size). This gives a free starting estimate for Z[i] without any character comparisons. If the seeded value exhausts the window (Z[i-L] ≥ R-i+1), we then extend by direct comparison past R, possibly advancing the window.

The amortised analysis is the elegant part: across the entire algorithm, the right edge R only moves forward (it never retreats), and each "extension past R" performs exactly one character comparison per unit of R advancement. So total comparison work is O(n), regardless of how many characters get seeded for free via the mirror trick. The Z-function is built in O(n) — same asymptotic as KMP's prefix function but conceptually distinct.

For pattern matching, the standard trick is to concatenate `pattern + '$' + text` (where `$` is any character not in either) and compute the Z-function once over the concatenation. Every position i in the text portion with Z[i] ≥ |pattern| is a pattern occurrence. The separator prevents Z-values from running past the pattern boundary and reporting false matches.

The deeper structural symmetry: Z-function captures "longest prefix-of-s starting at i" (a forward-looking quantity); KMP's failure function captures "longest proper prefix of s[0..i] that is also a suffix" (a backward-looking quantity). The two are convertible into each other in O(n) and answer the same set of pattern-matching queries, but each is more natural for certain follow-up questions: Z for prefix-occurrence enumeration, KMP for automaton construction and Aho-Corasick.

## visualization
For s = "aabcaabxaaaz", compute Z step by step. Z[0] is conventionally 0 (or n). Z[1] = 1 (s[1]='a' matches s[0]='a', then s[2]='b' breaks). Z[4..7] reuses Z[0..3]: s[4..7] = "aabx", s[0..3] = "aabc", so Z[4] = 3 because the first 3 chars match. The [L, R] window slides forward, and each character is compared at most twice — amortized O(n).

## bruteForce
For each starting position i, walk forward comparing s[i + k] to s[k] until they differ; that gives Z[i]. Total work is O(n^2). For pattern matching, the naive search is also O(n*m). Both work for tiny strings but choke on DNA-scale or log-scale inputs.

## optimal
Maintain a window [L, R] — the rightmost interval discovered so far that matches a prefix of s. For each new i: if i > R, scan from scratch (slow path, rare). If i <= R, set k = i - L; if Z[k] < R - i + 1, copy Z[i] = Z[k] (no comparisons needed); otherwise start with Z[i] = R - i + 1 and extend by direct comparison. Whenever the new match extends past R, update L = i and R = i + Z[i] - 1. For pattern matching, build Z on the concatenation pattern + '$' + text — every position with Z[i] >= |pattern| is a match.

## complexity
time: O(n) to build the Z-array; O(n + m) for pattern matching after the concatenation trick.
space: O(n) for the Z-array; O(n + m) for the concatenated string.
notes: KMP and Z run in the same asymptotic bound; Z is often easier to derive on a whiteboard, while KMP's failure function generalizes more naturally to Aho-Corasick.

## pitfalls
- Forgetting the separator character between pattern and text — without '$' (a character that appears in neither), Z values can run past the pattern boundary and report false matches.
- Off-by-one on the [L, R] update — it must use the *latest* match window, not a stale one from earlier in the loop.
- Using Z[0] inconsistently — some references set it to 0, others to n. Pick one and stay consistent; pattern-matching code only cares about Z[i] for i >= 1.
- Confusing Z-function with suffix-array — both are O(n) preprocessing but answer different queries.

## interviewTips
- Lead with the "concatenate pattern + '$' + text" trick — it instantly reduces pattern matching to a single Z-array build.
- Be ready to explain the [L, R] invariant: "the rightmost interval already proven to be a prefix match." That single sentence is the heart of the algorithm.
- Mention KMP as the sibling — interviewers respect candidates who know both and can articulate when each is more natural.

## code.python
```python
def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def find_all(pattern, text):
    if not pattern: return list(range(len(text) + 1))
    concat = pattern + '$' + text
    z = z_function(concat)
    m = len(pattern)
    res = []
    for i in range(m + 1, len(concat)):
        if z[i] >= m:
            res.append(i - m - 1)
    return res
```

## code.javascript
```javascript
function zFunction(s) {
  const n = s.length;
  const z = new Array(n).fill(0);
  let l = 0, r = 0;
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
  }
  return z;
}

function findAll(pattern, text) {
  if (!pattern) return Array.from({ length: text.length + 1 }, (_, i) => i);
  const concat = pattern + '$' + text;
  const z = zFunction(concat);
  const m = pattern.length;
  const res = [];
  for (let i = m + 1; i < concat.length; i++) if (z[i] >= m) res.push(i - m - 1);
  return res;
}
```

## code.java
```java
import java.util.*;

public int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = Math.min(r - i, z[i - l]);
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

public List<Integer> findAll(String pattern, String text) {
    List<Integer> res = new ArrayList<>();
    if (pattern.isEmpty()) {
        for (int i = 0; i <= text.length(); i++) res.add(i);
        return res;
    }
    String concat = pattern + "$" + text;
    int[] z = zFunction(concat);
    int m = pattern.length();
    for (int i = m + 1; i < concat.length(); i++) if (z[i] >= m) res.add(i - m - 1);
    return res;
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

vector<int> zFunction(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    int l = 0, r = 0;
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

vector<int> findAll(const string& pattern, const string& text) {
    vector<int> res;
    if (pattern.empty()) {
        for (int i = 0; i <= (int)text.size(); i++) res.push_back(i);
        return res;
    }
    string concat = pattern + "$" + text;
    auto z = zFunction(concat);
    int m = pattern.size();
    for (int i = m + 1; i < (int)concat.size(); i++) if (z[i] >= m) res.push_back(i - m - 1);
    return res;
}
```
