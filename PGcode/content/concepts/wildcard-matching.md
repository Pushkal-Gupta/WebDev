---
slug: wildcard-matching
module: dp
title: Wildcard Matching
subtitle: Match a pattern with `?` (any single char) and `*` (any sequence) using O(m * n) DP.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Wildcard Pattern Matching — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/wildcard-pattern-matching/"
    type: blog
  - title: "Dynamic Programming on Strings — cp-algorithms"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — wildcard_matching.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/wildcard_matching.py"
    type: repo
status: published
---

## intro
Wildcard matching is the shell-style variant of regex: `?` matches exactly one character, `*` matches any sequence (including the empty one), every other char matches itself. The standard interview formulation is "given pattern `p` and string `s`, does `p` match the whole of `s`?" — and the standard answer is bottom-up DP on the pair (string index, pattern index).

## whyItMatters
Wildcards are everywhere: `.gitignore`, file globs, log filters, route patterns. Beyond the practical, the problem is the cleanest DP-on-strings drill: state, transitions, and base cases are all small enough to derive from scratch in an interview, but a brute solution hits exponential blow-up on `********...*a` patterns. Solving it well separates candidates who really understand DP from those who memorised the recurrence.

## intuition
Let `dp[i][j]` mean "does `s[:i]` match `p[:j]`?". Transitions follow three cases on `p[j-1]`: a normal char must equal `s[i-1]` and look at `dp[i-1][j-1]`; `?` looks at `dp[i-1][j-1]` unconditionally; `*` is the interesting one — it can match the empty suffix (`dp[i][j-1]`) or extend by one more char from `s` (`dp[i-1][j]`).

## visualization
For `s = "abc"`, `p = "a*c"`, the 4x4 table fills row by row. dp[0][0]=true. Row 0 propagates true through leading stars only. dp[1][1]=true (`a`==`a`). dp[1][2] handles `*` so it OR's dp[1][1] (empty) and dp[0][2] (extend) — true. dp[2][2]=true, dp[3][2]=true (star keeps eating). dp[3][3]=true (`c`==`c` AND dp[2][2]). Answer: true.

## bruteForce
Recursive search: at every `*` try both "match empty" and "consume one char and stay on star". Without memoisation the recursion tree branches exponentially — pattern `a*a*a*a*b` against `aaaaaaa` explodes into thousands of identical subproblems. Adding memo by `(i, j)` collapses the work back to O(m*n) but uses recursion-stack memory.

## optimal
Iterative DP on a 2D boolean grid of size (n+1) x (m+1). Initialise dp[0][0]=true and pre-fill the first row to support leading stars. Walk i from 1..n and j from 1..m using the three-case transition above. The answer is dp[n][m]. To shave memory, the grid only depends on the previous row — collapse to two rows of length m+1 for O(m) space.

## complexity
time: O(n * m)
space: O(n * m), reducible to O(m) with rolling rows
notes: Star handling is the only branchy state. Each cell is computed in O(1), so total work is exactly the table size. The O(m) rolling-row optimisation is worth mentioning aloud even if you don't write it.

## pitfalls
- Forgetting to seed dp[0][j] for leading stars — fails the empty-string case for patterns like `***`.
- Confusing wildcard `*` (any sequence) with regex `*` (zero-or-more of the previous char) — same symbol, different language.
- Reversing the transition for `*`: dp[i][j-1] is "empty match," dp[i-1][j] is "extend by one." Swap them and `*x` would accept any string.
- Returning `dp[n][m-1]` instead of `dp[n][m]` after collapsing to two rows.

## interviewTips
- Lay out the three transition cases before coding — interviewers love watching the recurrence get derived live.
- Mention the O(m) memory optimisation at the end; don't write it unless asked.
- For follow-ups, contrast with regex `*` (Leetcode 10) — that problem looks at the character *before* `*`, this one does not.

## code.python
```python
def is_match(s, p):
    n, m = len(s), len(p)
    dp = [[False] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = True
    for j in range(1, m + 1):
        if p[j - 1] == '*':
            dp[0][j] = dp[0][j - 1]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if p[j - 1] == '*':
                dp[i][j] = dp[i][j - 1] or dp[i - 1][j]
            elif p[j - 1] == '?' or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[n][m]
```

## code.javascript
```javascript
function isMatch(s, p) {
  const n = s.length, m = p.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= m; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 1];
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (p[j - 1] === '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
      else if (p[j - 1] === '?' || p[j - 1] === s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
    }
  }
  return dp[n][m];
}
```

## code.java
```java
public boolean isMatch(String s, String p) {
    int n = s.length(), m = p.length();
    boolean[][] dp = new boolean[n + 1][m + 1];
    dp[0][0] = true;
    for (int j = 1; j <= m; j++) if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 1];
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
            else if (pc == '?' || pc == s.charAt(i - 1)) dp[i][j] = dp[i - 1][j - 1];
        }
    }
    return dp[n][m];
}
```

## code.cpp
```cpp
bool isMatch(string s, string p) {
    int n = s.size(), m = p.size();
    vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false));
    dp[0][0] = true;
    for (int j = 1; j <= m; j++) if (p[j - 1] == '*') dp[0][j] = dp[0][j - 1];
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (p[j - 1] == '*') dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
            else if (p[j - 1] == '?' || p[j - 1] == s[i - 1]) dp[i][j] = dp[i - 1][j - 1];
        }
    }
    return dp[n][m];
}
```
