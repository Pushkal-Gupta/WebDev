---
slug: string-z-function
module: sorting-strings
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
Pattern matching shows up everywhere: grep, search-and-replace, DNA sequence alignment, log analysis, plagiarism detection. The Z-function additionally answers prefix-overlap questions that KMP can't directly: it powers period detection, string compression, and the "longest prefix that is also a suffix of each substring" queries that arise in competitive programming.

## intuition
Z[i] = (length of the longest substring starting at i that equals a prefix of s). Computing each Z[i] from scratch is O(n^2). The clever observation: if we already know that some earlier interval [L, R] matches a prefix s[0..R-L], then for any i inside [L, R] we get a free starting estimate Z[i] = min(Z[i - L], R - i + 1) — because s[i..R] equals s[i-L..R-L], so the prefix-match length transfers.

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
