---
slug: dp-edit-distance-levenshtein
module: dp-classical
title: Edit Distance (Levenshtein)
subtitle: Minimum insert/delete/replace operations to transform one string into another — the 2D DP every NLP and bioinformatics tool depends on.
difficulty: Intermediate
position: 77
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Edit distance"
    url: "https://walkccc.me/CLRS/Chap15/"
    type: book
  - title: "cp-algorithms — Edit distance"
    url: "https://cp-algorithms.com/string/edit_distance.html"
    type: blog
  - title: "TheAlgorithms/Python — Edit distance"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/edit_distance.py"
    type: repo
status: published
---

## intro
**Edit distance** (Levenshtein 1965) measures the minimum number of single-character operations — **insert**, **delete**, **replace** — to transform string `a` into string `b`. A 2D DP: `dp[i][j]` = edit distance between `a[:i]` and `b[:j]`. Powers spell-checkers, DNA alignment (BLAST), fuzzy search, Git's diff algorithm, OCR error correction.

## whyItMatters
- **Spell-check** suggestions: rank dictionary words by edit distance to typed token.
- **Bioinformatics**: align DNA sequences; insertions / deletions / substitutions are exactly the biological operations.
- **Database fuzzy join**: match "Bob Smith" with "Robert Smith" via edit distance < threshold.
- **OCR**: correct "rn" → "m" misreads via distance to dictionary.
- The technique generalizes to weighted operations (different costs per op), affine gaps, etc.

## intuition
Picture a grid where the rows are labelled by the prefixes of `a` and the columns by the prefixes of `b`. Every cell `dp[i][j]` is a tiny sub-problem: "given only the first `i` letters of `a` and the first `j` letters of `b`, what is the cheapest way to turn one prefix into the other?" You fill the grid from the top-left corner outward, and the bottom-right corner is the answer for the full strings. What's actually happening is that each cell decides a single character's fate — align it for free, delete it, insert its counterpart, or overwrite it — and inherits the best cost already computed for the smaller prefixes to its top, left, and top-left.

Walk a concrete micro-example. Let `a = "cat"` and `b = "cut"`. Compare them character by character. The first letters `c` and `c` match, so we stay on the diagonal at zero cost: `dp[1][1] = dp[0][0] = 0`. Next, `a[1] = 'a'` versus `b[1] = 'u'` — they differ, so we must pay one operation, and the cheapest neighbour is the diagonal `dp[1][1] = 0`, giving `dp[2][2] = 1` (a single replace, `a` becomes `u`). Finally `t` matches `t`, so we ride the diagonal again for free: `dp[3][3] = dp[2][2] = 1`. The total edit distance is 1, matching the intuition that "cat" and "cut" differ by exactly one substitution. Notice that the diagonal move encodes both "match for free" and "replace for one" — the only difference is whether the current characters are equal.

Build `dp[i][j]` representing min ops to convert `a[:i]` → `b[:j]`.

Base cases:
- `dp[0][j] = j` (insert all j chars).
- `dp[i][0] = i` (delete all i chars).

Recurrence: to compute `dp[i][j]`:
- If `a[i-1] == b[j-1]`: chars match, no op → `dp[i][j] = dp[i-1][j-1]`.
- Else: take the min of:
  - `dp[i-1][j] + 1` (delete `a[i-1]`)
  - `dp[i][j-1] + 1` (insert `b[j-1]`)
  - `dp[i-1][j-1] + 1` (replace `a[i-1]` with `b[j-1]`)

Answer: `dp[len(a)][len(b)]`.

## visualization
```
a = "kitten", b = "sitting"

         ""  s  i  t  t  i  n  g
    ""   0   1  2  3  4  5  6  7
    k    1   1  2  3  4  5  6  7
    i    2   2  1  2  3  4  5  6
    t    3   3  2  1  2  3  4  5
    t    4   4  3  2  1  2  3  4
    e    5   5  4  3  2  2  3  4
    n    6   6  5  4  3  3  2  3       <- dp[6][7] = 3

Operations to achieve distance 3:
  kitten -> sitten  (replace k -> s)
  sitten -> sittin  (replace e -> i)
  sittin -> sitting (insert g)
```

## bruteForce
**Recursive brute force**: `solve(i, j)` returns edit distance; recurse with 3 options + match case. O(3^(m+n)) — exponential. Memoize → O(m*n) DP.

**Subsequence-based approaches**: longest common subsequence reduces to a related problem, but the operation set differs (LCS allows only insert/delete; edit distance also allows replace). They're related but not identical.

## optimal
The optimal method is a bottom-up fill of the full `(m+1) × (n+1)` table, replacing the exponential recursion with a single sweep that visits each cell once. **Why it's correct:** the recurrence is exhaustive — for any pair of prefixes, the optimal edit script must end in exactly one of four moves (match, delete, insert, replace), and each move reduces the problem to a strictly smaller prefix pair whose optimum is already stored. Because the table is filled in increasing `i` and `j`, every neighbour a cell reads (top, left, top-left) is finalized before it is used. This is the key invariant: when `dp[i][j]` is computed, `dp[i-1][j]`, `dp[i][j-1]`, and `dp[i-1][j-1]` already hold true optimal values, so the local `min` is a true global optimum by induction. The base row and column anchor the induction — converting an empty prefix costs exactly as many inserts or deletes as the other prefix has characters.

**The mechanism, step by step:** initialize `dp[i][0] = i` and `dp[0][j] = j`. Then for each cell, if the current characters `a[i-1]` and `b[j-1]` are equal, copy the diagonal `dp[i-1][j-1]` with no added cost; otherwise take `1 + min` of the three neighbours, charging one operation for a delete (from above), an insert (from the left), or a replace (from the diagonal). The bottom-right cell `dp[m][n]` is the answer. **The central tradeoff** is memory versus reconstructability: the full table costs `O(m·n)` space but lets you backtrace the actual operation sequence, while the rolling two-row variant below drops space to `O(min(m, n))` but discards the path. **Complexity intuition:** the two nested loops touch each of the `(m+1)(n+1)` cells exactly once and do `O(1)` work per cell, so the time bound is `O(m·n)` with no hidden factors — there is no re-computation because memoization has been baked into the table order.

**2D DP**:
```python
def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]
```

**Space optimization** to O(min(m, n)):
```python
def edit_distance_optimized(a, b):
    if len(a) < len(b): a, b = b, a    # ensure a is longer
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        curr = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            if a[i-1] == b[j-1]:
                curr[j] = prev[j-1]
            else:
                curr[j] = 1 + min(prev[j], curr[j-1], prev[j-1])
        prev = curr
    return prev[-1]
```

**Reconstructing the operations**: keep backpointers in a separate 2D array; trace from `dp[m][n]` back to `dp[0][0]`.

**Weighted edit distance**: replace `+1` with `cost(op)` — e.g., make insertion cheaper than deletion. Same DP.

**Damerau-Levenshtein**: also allows adjacent-swap (transposition) as 1 op — needed for typo detection ("teh" → "the" is one op, not two).

## complexity
- **Time:** O(m × n).
- **Space:** O(m × n) for the table; O(min(m, n)) with rolling row.
- For long strings (m, n > 10^4) the O(m·n) becomes prohibitive — banded DP or approximate methods (BLAST seed-and-extend) are needed.

## pitfalls
- **0-indexing vs 1-indexing confusion**: `dp[i][j]` represents lengths, so `a[i-1]` is the i-th character. Mixing up is the #1 bug.
- **Forgetting base cases**: `dp[i][0]` and `dp[0][j]` must be initialized first; recurrence reads from them.
- **Treating identity (match) as an op**: when chars match, cost stays the same — no `+1`.
- **Swapping insert/delete meaning**: from `a`'s perspective, "insert" inserts into `a` to match `b` → consumes a char of `b`. Easy to flip.
- **Space optimization breaks reconstruction**: you can't trace the path if you discarded rows. Keep full table when path needed.
- **Unicode**: per-codepoint distance; using bytes for multi-byte UTF-8 gives wrong answers.

## interviewTips
- For "min operations to transform string A to B" → Levenshtein DP.
- Cite **space-optimized O(min(m,n))** as the production version.
- For senior interviews, discuss **weighted edit distance**, **affine gap penalties** (bioinformatics), **suffix-automaton-based approximate matching**, **myers diff algorithm** as the next-level technique.

## code.python
```python
def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]
```

## code.javascript
```javascript
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}
```

## code.java
```java
public int editDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i-1) == b.charAt(j-1))
                dp[i][j] = dp[i-1][j-1];
            else
                dp[i][j] = 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));
        }
    }
    return dp[m][n];
}
```

## code.cpp
```cpp
int editDistance(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i-1] == b[j-1]) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});
        }
    }
    return dp[m][n];
}
```
