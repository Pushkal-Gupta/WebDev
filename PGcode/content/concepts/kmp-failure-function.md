---
slug: kmp-failure-function
module: sorting-strings
title: KMP Failure Function
subtitle: Build the prefix-function in O(m), then scan the text in O(n) without ever backing up.
difficulty: Advanced
position: 31
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Prefix function — cp-algorithms"
    url: "https://cp-algorithms.com/string/prefix-function.html"
    type: blog
  - title: "Princeton Algorithms — Substring Search"
    url: "https://algs4.cs.princeton.edu/53substring/"
    type: book
  - title: "TheAlgorithms/Python — knuth_morris_pratt.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/strings/knuth_morris_pratt.py"
    type: repo
status: published
---

## intro
The Knuth-Morris-Pratt algorithm finds a pattern inside a text in O(n + m) by precomputing a failure function — also called the prefix function — that records, for each prefix of the pattern, the length of its longest proper prefix that is also a suffix. With that table in hand, the text cursor never moves backwards: after a mismatch you simply slide the pattern by exactly the amount the table tells you.

## whyItMatters
KMP is the canonical "use a precomputation to skip wasted work" algorithm. The same prefix function powers period detection, the Z-function relationship, automaton-based searching, and counting occurrences of all prefixes in a string. Knowing how to build the prefix function in eight lines, and to argue its amortized linearity, is interview table-stakes whenever string matching comes up.

## intuition
Imagine the pattern slid under the text. When a mismatch happens at pattern position `j`, the previous `j` characters of the text are known to equal `pattern[0..j-1]`. Throwing away that hard-won information and restarting at `pattern[0]` would be wasteful. The longest proper prefix of `pattern[0..j-1]` that is also a suffix is exactly the next plausible alignment: that prefix already matches, so we resume comparing at the character right after it.

## visualization
Pattern `ABABABC`. Build the table left to right. `pi[0] = 0`. For position 1 (`B`), no proper prefix matches, so `pi[1] = 0`. Position 2 (`A`): matches first char, `pi[2] = 1`. Position 3 (`B`): extends, `pi[3] = 2`. Position 4 (`A`): extends, `pi[4] = 3`. Position 5 (`B`): extends, `pi[5] = 4`. Position 6 (`C`): mismatch, fall back via the table to length 0, `pi[6] = 0`. The table teaches the matcher how far back to jump on every mismatch.

## bruteForce
Naive substring search tries every starting offset and compares left to right, backing the text cursor up to the next candidate on mismatch. On adversarial input like text `AAAA...AAAB` with pattern `AAAB` it does O(nm) character comparisons. The wasted work is exactly the suffix-prefix overlap that KMP's table captures, which is why the table buys you a worst-case linear bound for free.

## optimal
Build `pi` in O(m). Maintain a running length `k`. For each `i` from 1 to `m - 1`, while `k > 0` and `pattern[k] != pattern[i]`, set `k = pi[k - 1]`. If `pattern[k] == pattern[i]`, increment `k`. Store `pi[i] = k`. To match against text, walk `i` over the text and a pointer `q` over the pattern: on match, increment both; on mismatch with `q > 0`, set `q = pi[q - 1]`; on `q == m`, report a hit and fall back via `pi[q - 1]`.

## complexity
time: O(n + m)
space: O(m)
notes: The amortized argument: in both the build and the search, the inner `while` strictly decreases `k` (or `q`), and the outer loop increases it by at most one per iteration. Total decreases cannot exceed total increases, so the inner loop runs O(n + m) times across the whole algorithm.

## pitfalls
- Off-by-one on the fallback: it is `pi[k - 1]`, not `pi[k]`. Reading from index `k` while `k == 0` corrupts the table.
- Confusing the prefix function with the Z-function — both encode similar information but indexed differently; do not paste a Z-array into KMP's matcher.
- Forgetting to fall back after a successful full match (`q == m`) — missing the next overlapping occurrence in `AAAA...` style texts.
- Sentinel-based variants concatenate `pattern + '$' + text` to compute occurrences in one pass; make sure the separator does not occur in either string. Never use the null character — many systems and Postgres reject it.

## interviewTips
- Be ready to derive the table from scratch at the whiteboard — interviewers love asking why the fallback is `pi[k - 1]`.
- Mention the Z-function as the natural alternative and that it gives the same asymptotic bound with a different shape.
- Note real-world uses: substring search in editors, regex engine prefilters, plagiarism detection over large corpora.

## code.python
```python
def prefix_function(pattern):
    m = len(pattern)
    pi = [0] * m
    k = 0
    for i in range(1, m):
        while k > 0 and pattern[k] != pattern[i]:
            k = pi[k - 1]
        if pattern[k] == pattern[i]:
            k += 1
        pi[i] = k
    return pi

def kmp_search(text, pattern):
    if not pattern:
        return 0
    pi = prefix_function(pattern)
    q = 0
    for i, c in enumerate(text):
        while q > 0 and pattern[q] != c:
            q = pi[q - 1]
        if pattern[q] == c:
            q += 1
        if q == len(pattern):
            return i - q + 1
    return -1
```

## code.javascript
```javascript
function prefixFunction(pattern) {
  const m = pattern.length;
  const pi = new Array(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = pi[k - 1];
    if (pattern[k] === pattern[i]) k++;
    pi[i] = k;
  }
  return pi;
}

function kmpSearch(text, pattern) {
  if (!pattern.length) return 0;
  const pi = prefixFunction(pattern);
  let q = 0;
  for (let i = 0; i < text.length; i++) {
    while (q > 0 && pattern[q] !== text[i]) q = pi[q - 1];
    if (pattern[q] === text[i]) q++;
    if (q === pattern.length) return i - q + 1;
  }
  return -1;
}
```

## code.java
```java
public int[] prefixFunction(String p) {
    int m = p.length();
    int[] pi = new int[m];
    int k = 0;
    for (int i = 1; i < m; i++) {
        while (k > 0 && p.charAt(k) != p.charAt(i)) k = pi[k - 1];
        if (p.charAt(k) == p.charAt(i)) k++;
        pi[i] = k;
    }
    return pi;
}

public int kmpSearch(String text, String pattern) {
    if (pattern.isEmpty()) return 0;
    int[] pi = prefixFunction(pattern);
    int q = 0;
    for (int i = 0; i < text.length(); i++) {
        while (q > 0 && pattern.charAt(q) != text.charAt(i)) q = pi[q - 1];
        if (pattern.charAt(q) == text.charAt(i)) q++;
        if (q == pattern.length()) return i - q + 1;
    }
    return -1;
}
```

## code.cpp
```cpp
std::vector<int> prefixFunction(const std::string& p) {
    int m = p.size();
    std::vector<int> pi(m, 0);
    int k = 0;
    for (int i = 1; i < m; ++i) {
        while (k > 0 && p[k] != p[i]) k = pi[k - 1];
        if (p[k] == p[i]) ++k;
        pi[i] = k;
    }
    return pi;
}

int kmpSearch(const std::string& text, const std::string& pattern) {
    if (pattern.empty()) return 0;
    auto pi = prefixFunction(pattern);
    int q = 0;
    for (int i = 0; i < (int)text.size(); ++i) {
        while (q > 0 && pattern[q] != text[i]) q = pi[q - 1];
        if (pattern[q] == text[i]) ++q;
        if (q == (int)pattern.size()) return i - q + 1;
    }
    return -1;
}
```
