---
slug: string-edit-distance
module: dp
title: Edit Distance (Levenshtein)
subtitle: Minimum operations to transform string a into b — classic O(|a|·|b|) DP with three transition options.
difficulty: Intermediate
position: 20
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
The **edit distance** (Levenshtein distance) between two strings `a` and `b` is the minimum number of single-character insertions, deletions, or substitutions to turn one into the other. The DP fills a (|a|+1) × (|b|+1) table and runs in O(|a|·|b|).

## whyItMatters
Direct uses:
- **Spell checkers**: rank candidates by edit distance from the typed word.
- **DNA sequence alignment**: bioinformatics' bread and butter.
- **Diff tools**: `diff`, `git`, and Beyond Compare all rely on edit-distance variants (or LCS) under the hood.
- **Autocomplete / fuzzy search**: rank suggestions by edit distance from the prefix.

Interview-frequent: "Edit Distance" is LeetCode #72, a classic DP problem.

## intuition
Define `dp[i][j]` = edit distance between `a[:i]` and `b[:j]`. Recurrence:
- If `a[i-1] == b[j-1]`: `dp[i][j] = dp[i-1][j-1]` (no op needed).
- Otherwise: `dp[i][j] = 1 + min(dp[i-1][j],     # delete a[i-1]
                                  dp[i][j-1],     # insert b[j-1]
                                  dp[i-1][j-1])`  # substitute a[i-1] for b[j-1]

Base cases: `dp[i][0] = i` (delete i chars), `dp[0][j] = j` (insert j chars).

## visualization
```
a = "kitten", b = "sitting"

        ""  s   i   t   t   i   n   g
   ""    0  1   2   3   4   5   6   7
    k    1  1   2   3   4   5   6   7
    i    2  2   1   2   3   4   5   6
    t    3  3   2   1   2   3   4   5
    t    4  4   3   2   1   2   3   4
    e    5  5   4   3   2   2   3   4
    n    6  6   5   4   3   3   2   3   ← dp[6][7] = 3

Three edits: kitten → sitten (substitute k→s) → sittin (substitute e→i) → sitting (insert g).
```

## bruteForce
Recursive without memoization: 3 branches at every position → O(3^max(|a|,|b|)). Exponential, useless beyond a few characters.

## optimal
**Full O(n·m) DP**:
```
def edit_distance(a, b):
    n, m = len(a), len(b)
    dp = [[0]*(m+1) for _ in range(n+1)]
    for i in range(n+1): dp[i][0] = i
    for j in range(m+1): dp[0][j] = j
    for i in range(1, n+1):
        for j in range(1, m+1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[n][m]
```

**Space-optimized O(min(n,m))**: only the previous row is needed. Cuts memory from O(n·m) to O(min(n,m)).

**Reconstructing the actual edit sequence**: store back-pointers indicating which of the three options was used.

**Damerau-Levenshtein**: adds transposition as a fourth operation. Useful for fuzzy matching of typos like "te" → "et".

**Hirschberg's algorithm**: O(n·m) time, O(min(n,m)) space, AND can reconstruct the alignment — uses divide-and-conquer on the recurrence.

## complexity
- **Time**: O(n · m).
- **Space**: O(n · m) full / O(min(n, m)) optimized.
- **Bit-parallel variants**: O(n · m / w) where w = machine word width (Myers algorithm).

## pitfalls
- **Off-by-one indexing**: the DP table is (n+1) × (m+1) — pay attention to `a[i-1]` vs `a[i]`.
- **Substitution vs insert/delete cost mismatch**: classical Levenshtein has unit cost for each. If your problem has different costs (e.g., transcription errors), change the recurrence accordingly.
- **Confusing edit distance with LCS (Longest Common Subsequence)**: related but different. LCS = `(n + m - edit_distance) / 2` when only insertions and deletions count.
- **Damerau-Levenshtein**: classic Levenshtein DOESN'T allow transposition; you need the explicit Damerau variant for it.

## interviewTips
- The trigger: "minimum operations to transform string A into B" — Levenshtein.
- Always state the three operations explicitly (insert, delete, substitute) and the corresponding DP transitions.
- Mention the **space-optimized O(min(n,m))** version even if you don't write it — interviewers like seeing the optimization is on your radar.
- For senior interviews, mention **Myers' bit-parallel algorithm** for faster practical performance and **Hirschberg's** for memory-efficient alignment.

## code.python
```python
def edit_distance(a, b):
    n, m = len(a), len(b)
    if n < m: a, b, n, m = b, a, m, n
    prev = list(range(m + 1))
    cur = [0] * (m + 1)
    for i in range(1, n + 1):
        cur[0] = i
        for j in range(1, m + 1):
            if a[i-1] == b[j-1]: cur[j] = prev[j-1]
            else: cur[j] = 1 + min(prev[j], cur[j-1], prev[j-1])
        prev, cur = cur, prev
    return prev[m]

print(edit_distance("kitten", "sitting"))   # 3
```

## code.javascript
```javascript
function editDistance(a, b) {
  if (a.length < b.length) [a, b] = [b, a];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let cur = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i-1] === b[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j], cur[j-1], prev[j-1]);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}
```

## code.java
```java
class EditDistance {
    public int distance(String a, String b) {
        if (a.length() < b.length()) { String t = a; a = b; b = t; }
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                cur[j] = a.charAt(i-1) == b.charAt(j-1)
                    ? prev[j-1]
                    : 1 + Math.min(prev[j], Math.min(cur[j-1], prev[j-1]));
            }
            int[] tmp = prev; prev = cur; cur = tmp;
        }
        return prev[b.length()];
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <algorithm>
int editDistance(std::string a, std::string b) {
    if (a.size() < b.size()) std::swap(a, b);
    std::vector<int> prev(b.size() + 1), cur(b.size() + 1);
    for (size_t j = 0; j <= b.size(); j++) prev[j] = j;
    for (size_t i = 1; i <= a.size(); i++) {
        cur[0] = i;
        for (size_t j = 1; j <= b.size(); j++) {
            cur[j] = a[i-1] == b[j-1]
                ? prev[j-1]
                : 1 + std::min({ prev[j], cur[j-1], prev[j-1] });
        }
        std::swap(prev, cur);
    }
    return prev[b.size()];
}
```
