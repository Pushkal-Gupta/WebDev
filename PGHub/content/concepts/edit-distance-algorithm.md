---
slug: edit-distance-algorithm
module: dp-classical
title: Edit Distance (Levenshtein) Algorithm
subtitle: Minimum insert / delete / replace operations to convert one string into another via a 2D DP table.
difficulty: Intermediate
position: 78
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/"
    type: book
  - title: "cp-algorithms — Edit distance"
    url: "https://cp-algorithms.com/string/edit_distance.html"
    type: blog
  - title: "TheAlgorithms/Python — edit_distance.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/edit_distance.py"
    type: repo
status: published
---

## intro
The edit-distance algorithm computes the smallest number of single-character edits — insertions, deletions, or substitutions — that turn string `a` into string `b`. It fills a `(|a|+1) x (|b|+1)` table where `dp[i][j]` is the distance between the first `i` characters of `a` and the first `j` characters of `b`. Each cell looks only at three neighbours: up, left, and up-left. The answer sits at `dp[|a|][|b|]`.

## whyItMatters
- Spell-checkers rank suggestions by edit distance to the typed word.
- DNA / protein aligners (BLAST, Needleman-Wunsch) are direct generalisations with weighted operations.
- Git's `diff` and `patch` use the dual problem (longest common subsequence) which is the same recurrence with a twist.
- Search engines tolerate typos via "fuzzy match within edit distance k".
- Compiler error-recovery suggests "did you mean...?" using the same table.

## intuition
Think recursively about the last character. To turn `a[0..i-1]` into `b[0..j-1]` you have four moves:

1. If `a[i-1] == b[j-1]`, the last character is already correct. The remaining cost is whatever it took to align `a[0..i-2]` with `b[0..j-2]` — that is `dp[i-1][j-1]`.
2. Otherwise consider the three edits and pick the cheapest:
   - **Replace** `a[i-1]` with `b[j-1]`: pay 1, then solve `dp[i-1][j-1]`.
   - **Delete** `a[i-1]`: pay 1, then solve `dp[i-1][j]`.
   - **Insert** `b[j-1]` after `a[i-1]`: pay 1, then solve `dp[i][j-1]`.

The recurrence has overlapping sub-problems — `dp[i-1][j-1]` is reached by replace, delete, and insert paths — so memoisation collapses it from exponential to `O(|a| |b|)`. The base cases are intuitive: aligning anything with the empty string costs exactly the length of the non-empty side (all deletions or all insertions). Filling the table row by row, every cell depends only on cells above and to the left, so a single bottom-up pass is enough. This is the canonical example of "DP where the answer comes from a constant-size set of smaller sub-answers".

## visualization
Compute edit distance between `kitten` and `sitting` (answer = 3).

```
        ""  s   i   t   t   i   n   g
   ""    0  1   2   3   4   5   6   7
   k     1  1   2   3   4   5   6   7
   i     2  2   1   2   3   4   5   6
   t     3  3   2   1   2   3   4   5
   t     4  4   3   2   1   2   3   4
   e     5  5   4   3   2   2   3   4
   n     6  6   5   4   3   3   2   3
                                       ^
                            dp[6][7] = 3
   path:  k->s (replace), e->i (replace), append g (insert)
```

## bruteForce
The plain recursion branches three ways per cell (replace / delete / insert) and revisits the same `(i, j)` repeatedly. Without memoisation it is `O(3^(|a|+|b|))` — even ten-character strings stall. Adding memoisation makes it identical to the bottom-up DP.

## optimal
Bottom-up table, two nested loops, constant work per cell.

```python
def edit_distance(a: str, b: str) -> int:
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1],  # replace
                                   dp[i - 1][j],      # delete
                                   dp[i][j - 1])      # insert
    return dp[n][m]
```

Memory shrinks to `O(min(n, m))` by keeping only the previous row — each cell needs `dp[i-1][j-1]`, `dp[i-1][j]`, `dp[i][j-1]`. Reconstructing the actual edit script requires the full table or back-pointers; reversing from `dp[n][m]` toward `dp[0][0]` and recording which neighbour was chosen yields the alignment.

## complexity
- **Time**: `O(n m)` — every cell is filled once with constant work.
- **Space**: `O(n m)` for the full table, `O(min(n, m))` when only the distance is needed.
- **Reconstruction**: needs the full table (or back-pointers) and runs in `O(n + m)`.

## pitfalls
- **Off-by-one in base cases.** Forgetting `dp[i][0] = i` and `dp[0][j] = j` leaves zeros and breaks every cell. Fix: initialise both axes before the double loop.
- **Wrong indexing when comparing characters.** `a[i-1]` and `b[j-1]` — not `a[i]` — because row 0 and column 0 represent the empty prefix. Fix: write the comment "row i covers a[0..i-1]" above the loop.
- **Using `min` of only two neighbours.** Skipping the diagonal substitution makes the algorithm compute longest common subsequence instead. Fix: include all three transitions when `a[i-1] != b[j-1]`.
- **Assuming symmetric cost.** Domains like OCR weight `delete` differently from `insert`. Fix: parameterise the three `1`s as `c_del`, `c_ins`, `c_sub`.

## interviewTips
- State the recurrence in plain English before writing code — "match for free, otherwise one plus the cheapest neighbour".
- Walk the interviewer through a 4x4 table by hand so the indexing is unambiguous.
- Mention the `O(min(n, m))` rolling-array optimisation; many follow-ups ask for it.

## code.python
```python
def edit_distance(a: str, b: str) -> int:
    n, m = len(a), len(b)
    prev = list(range(m + 1))
    for i in range(1, n + 1):
        cur = [i] + [0] * m
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j - 1], prev[j], cur[j - 1])
        prev = cur
    return prev[m]
```

## code.javascript
```javascript
function editDistance(a, b) {
  const n = a.length, m = b.length;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = new Array(m + 1);
    cur[0] = i;
    for (let j = 1; j <= m; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[m];
}
```

## code.java
```java
public int editDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[] prev = new int[m + 1];
    for (int j = 0; j <= m; j++) prev[j] = j;
    int[] cur = new int[m + 1];
    for (int i = 1; i <= n; i++) {
        cur[0] = i;
        for (int j = 1; j <= m; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) cur[j] = prev[j - 1];
            else cur[j] = 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));
        }
        int[] tmp = prev; prev = cur; cur = tmp;
    }
    return prev[m];
}
```

## code.cpp
```cpp
int editDistance(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<int> prev(m + 1), cur(m + 1);
    iota(prev.begin(), prev.end(), 0);
    for (int i = 1; i <= n; i++) {
        cur[0] = i;
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1];
            else cur[j] = 1 + min({prev[j - 1], prev[j], cur[j - 1]});
        }
        swap(prev, cur);
    }
    return prev[m];
}
```
