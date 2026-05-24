---
slug: edit-distance-allowed-ops
module: dp
title: Edit Distance Variants
subtitle: Vary the allowed operations and their costs — Levenshtein, weighted, and Damerau extensions.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Edit Distance"
    url: "https://walkccc.me/CLRS/Chap15/Problems/15-5/"
    type: book
  - title: "Edit Distance and the Levenshtein Algorithm — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/edit-distance-dp-5/"
    type: blog
  - title: "TheAlgorithms/Python — edit_distance.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/edit_distance.py"
    type: repo
status: published
---

## intro
The classic edit-distance problem asks for the minimum number of single-character edits to turn string `a` into string `b`. The vanilla flavour allows insert, delete, and replace — each costing one. Real-world variants tweak two things: the cost per operation type, and whether transpositions of adjacent letters count as one edit (the Damerau-Levenshtein extension).

## whyItMatters
Spell-checkers prefer replace over insert+delete (Damerau costs swap as one), DNA-alignment uses higher gap penalties, and search-as-you-type ranks candidates by weighted distance. Knowing how to plug arbitrary costs into the recurrence — and when to add a fourth transition for transpositions — is what separates a textbook implementation from one fit for shipping.

## intuition
At every cell dp[i][j] you ask: "what is the cheapest way to convert `a[:i]` into `b[:j]`?" Three classical predecessors exist: dp[i-1][j-1] (replace or match), dp[i-1][j] (delete from a), dp[i][j-1] (insert into a). For Damerau, add a fourth: dp[i-2][j-2] + 1 whenever the last two characters are a swap (`a[i-1]==b[i-2]` and `a[i-2]==b[j-1]`).

## visualization
Picture the table for `a = "cat"`, `b = "act"`. Row labels `_,c,a,t`. Column labels `_,a,c,t`. Without transpositions edit distance is 2 (replace `c->a`, replace `a->c`). With Damerau, dp[2][2] checks `a[1]==b[0]` and `a[0]==b[1]`: yes — so dp[2][2] = dp[0][0] + 1 = 1. dp[3][3] then needs only that swap plus a free match on `t`: total 1.

## bruteForce
Plain recursion: try every operation at every position. Without memo the call tree is O(3^n) and a 10-character input takes seconds. Even ordering by greedy minimum-cost-first does not help — you must explore the whole table because the optimal choice at one cell depends on subsequent ones.

## optimal
Bottom-up DP with weights `(ci, cd, cr)` for insert, delete, replace; optionally `ct` for transposition. Initialise dp[i][0] = i*cd and dp[0][j] = j*ci. Fill cell `(i, j)` as the min of replace (`dp[i-1][j-1] + (a[i-1]==b[j-1] ? 0 : cr)`), delete (`dp[i-1][j] + cd`), insert (`dp[i][j-1] + ci`), and for Damerau the transposition predecessor when adjacent chars swap. To recover the sequence of edits, store the chosen predecessor and back-trace from `(n, m)`.

## complexity
time: O(n * m)
space: O(n * m), reducible to O(min(n, m)) with two rolling rows when only the distance is needed
notes: Adding transposition keeps the time class O(n*m) — one extra comparison per cell. Recovering the edit script needs the full table.

## pitfalls
- Mixing up which cost belongs to which transition — relabel as `(ci, cd, cr)` and stick with it.
- Forgetting the "characters match" early-out: when `a[i-1] == b[j-1]`, dp[i][j] = dp[i-1][j-1] only if `cr >= 0` (always; just skip the +cr).
- Damerau-Levenshtein vs Optimal-String-Alignment: the former handles unrestricted transpositions, the latter only adjacent ones with each pair used at most once. Interviewers usually mean OSA.
- Confusing "Hamming distance" (equal lengths, replacements only) with edit distance.

## interviewTips
- State the cost vector aloud — "I'll generalise insert/delete/replace; default costs are 1." It signals depth without slowing the solve.
- After deriving the recurrence, sketch the table layout and walk through a 3-character example.
- Mention the rolling-row optimisation and Damerau as follow-ups — interviewers nearly always probe one of them.

## code.python
```python
def edit_distance(a, b, ci=1, cd=1, cr=1, ct=None):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i * cd
    for j in range(m + 1): dp[0][j] = j * ci
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            sub = dp[i - 1][j - 1] + (0 if a[i - 1] == b[j - 1] else cr)
            dp[i][j] = min(sub, dp[i - 1][j] + cd, dp[i][j - 1] + ci)
            if ct is not None and i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                dp[i][j] = min(dp[i][j], dp[i - 2][j - 2] + ct)
    return dp[n][m]
```

## code.javascript
```javascript
function editDistance(a, b, ci = 1, cd = 1, cr = 1, ct = null) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i * cd;
  for (let j = 0; j <= m; j++) dp[0][j] = j * ci;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : cr);
      dp[i][j] = Math.min(sub, dp[i - 1][j] + cd, dp[i][j - 1] + ci);
      if (ct !== null && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + ct);
    }
  }
  return dp[n][m];
}
```

## code.java
```java
public int editDistance(String a, String b, int ci, int cd, int cr, Integer ct) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i * cd;
    for (int j = 0; j <= m; j++) dp[0][j] = j * ci;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            int sub = dp[i - 1][j - 1] + (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : cr);
            dp[i][j] = Math.min(sub, Math.min(dp[i - 1][j] + cd, dp[i][j - 1] + ci));
            if (ct != null && i > 1 && j > 1 && a.charAt(i - 1) == b.charAt(j - 2) && a.charAt(i - 2) == b.charAt(j - 1))
                dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + ct);
        }
    }
    return dp[n][m];
}
```

## code.cpp
```cpp
int editDistance(const string& a, const string& b, int ci = 1, int cd = 1, int cr = 1, int ct = -1) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++) dp[i][0] = i * cd;
    for (int j = 0; j <= m; j++) dp[0][j] = j * ci;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            int sub = dp[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : cr);
            dp[i][j] = min({sub, dp[i - 1][j] + cd, dp[i][j - 1] + ci});
            if (ct >= 0 && i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1])
                dp[i][j] = min(dp[i][j], dp[i - 2][j - 2] + ct);
        }
    }
    return dp[n][m];
}
```
