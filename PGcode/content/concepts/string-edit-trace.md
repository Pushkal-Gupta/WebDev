---
slug: string-edit-trace
module: dp
title: String Edit Trace
subtitle: Reconstruct the exact INSERT / DELETE / REPLACE sequence from an edit-distance DP table.
difficulty: Intermediate
position: 31
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Edit Distance — walkccc.me/CLRS"
    url: "https://walkccc.me/CLRS/Chap15/Problems/15-5/"
    type: book
  - title: "Edit Distance and Operations — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/edit-distance-dp-5/"
    type: blog
  - title: "TheAlgorithms/Python — levenshtein_distance.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/edit_distance.py"
    type: repo
status: published
---

## intro
The Levenshtein DP gives you a number — the minimum number of single-character INSERT, DELETE, or REPLACE operations to transform string s into string t. Real applications (diff tools, spell-correctors, DNA aligners) need the actual sequence of operations. Reconstructing the trace from the DP table is a clean back-tracking pattern that generalises to many "shortest path through a DAG of states" problems.

## whyItMatters
The trace is what `git diff`, `merge`, `patch`, and IDE autocorrect actually display. It is also the foundation of more complex sequence alignment problems (Needleman-Wunsch for proteins, Smith-Waterman for local alignment) where the score table feeds a traceback that produces a meaningful alignment. The pattern — fill a 2D DP, then walk backward choosing the predecessor that justifies the current value — recurs in matrix-chain order, LCS reconstruction, and partition-style problems.

## intuition
Each cell dp[i][j] holds the edit distance between s[:i] and t[:j]. The transitions tell you why: it came from dp[i-1][j-1] (match or replace), dp[i-1][j] (delete from s), or dp[i][j-1] (insert into s). Walk backward from (n, m): whichever neighbour's value plus its operation cost equals dp[i][j] is the predecessor. Emit the operation, jump, and repeat until you hit (0, 0).

## visualization
Filling the table for s = "horse", t = "ros" gives a 6 x 4 grid with dp[5][3] = 3. Traceback from (5, 3): dp[4][3] + 1 = 3? yes, delete 'e'. From (4, 3): dp[3][2] + 0 = 3? yes, match 's'. From (3, 2): dp[2][1] + 1 = 3? yes, replace 'r' -> 'o'. From (2, 1): dp[1][0] + 1 = 3? yes, delete 'o'. From (1, 0): dp[0][0] + 1 = 1? yes, match 'h' kept and one insert remains — emit in reverse order: DELETE(h), REPLACE(r->o)... and so on. Reverse the emission list to get the forward script.

## bruteForce
Enumerate every sequence of operations of length up to n + m and pick the shortest that transforms s into t. The search tree has branching factor 3 (insert, delete, replace) so cost is 3^(n+m) — exponential and useless past tiny strings. Memoised recursion fixes the time but still does not yield a trace without an explicit back-pointer table.

## optimal
Fill the standard dp[i][j] table in O(nm). Then walk from (n, m) to (0, 0): at each step inspect the three candidate predecessors. If s[i-1] == t[j-1] and dp[i][j] == dp[i-1][j-1], emit MATCH and go diagonal. Else if dp[i][j] == dp[i-1][j-1] + 1, emit REPLACE and go diagonal. Else if dp[i][j] == dp[i-1][j] + 1, emit DELETE and go up. Else dp[i][j] == dp[i][j-1] + 1 — emit INSERT and go left. Reverse the script. To save memory, build an explicit predecessor table while filling dp; the trace cost stays O(n + m).

## complexity
time: O(n * m) to fill, O(n + m) to trace back
space: O(n * m) if you keep the table for traceback, O(min(n, m)) if you stream only the distance
notes: Hirschberg's algorithm gives the full trace in O(n * m) time and O(min(n, m)) space by recursing on midpoints — useful when n, m are millions but rarely interview material.

## pitfalls
- Reading characters at s[i] instead of s[i-1] during traceback — off-by-one is the most common bug here.
- Forgetting to reverse the emitted script before printing.
- Returning REPLACE when s[i-1] == t[j-1] because the dp transition happened to match — guard with the character-equality check first.
- Skipping the explicit predecessor table and recomputing the choice from cell values; correct but harder to debug for follow-up extensions like weighted operations.
- Reporting indices into the *current* s during emission — the user usually wants positions in the original s, which means tracking an offset as you apply INSERTs.

## interviewTips
- State the two passes clearly: forward fill, backward trace.
- Note that ties in the DP (multiple predecessors give the same value) mean multiple valid scripts; choose one deterministically (e.g., prefer MATCH > REPLACE > DELETE > INSERT) so your output is reproducible.
- Mention diff-like tools as the motivation — interviewers love a concrete application.
- Be ready to extend to "min cost to align with weighted operations" (substitution matrices in bioinformatics) by replacing the +1 with a cost lookup.

## code.python
```python
def edit_trace(s, t):
    n, m = len(s), len(t)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1): dp[i][0] = i
    for j in range(m + 1): dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if s[i - 1] == t[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    ops = []
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0 and s[i - 1] == t[j - 1] and dp[i][j] == dp[i - 1][j - 1]:
            ops.append(("MATCH", s[i - 1])); i -= 1; j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            ops.append(("REPLACE", s[i - 1], t[j - 1])); i -= 1; j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            ops.append(("DELETE", s[i - 1])); i -= 1
        else:
            ops.append(("INSERT", t[j - 1])); j -= 1
    return list(reversed(ops))
```

## code.javascript
```javascript
function editTrace(s, t) {
  const n = s.length, m = t.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = s[i - 1] === t[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && s[i - 1] === t[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push(["MATCH", s[i - 1]]); i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push(["REPLACE", s[i - 1], t[j - 1]]); i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push(["DELETE", s[i - 1]]); i--;
    } else {
      ops.push(["INSERT", t[j - 1]]); j--;
    }
  }
  return ops.reverse();
}
```

## code.java
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class EditTrace {
    public List<String> trace(String s, String t) {
        int n = s.length(), m = t.length();
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 0; i <= n; i++) dp[i][0] = i;
        for (int j = 0; j <= m; j++) dp[0][j] = j;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= m; j++)
                dp[i][j] = s.charAt(i - 1) == t.charAt(j - 1)
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));
        List<String> ops = new ArrayList<>();
        int i = n, j = m;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && s.charAt(i - 1) == t.charAt(j - 1) && dp[i][j] == dp[i - 1][j - 1]) {
                ops.add("MATCH " + s.charAt(i - 1)); i--; j--;
            } else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) {
                ops.add("REPLACE " + s.charAt(i - 1) + " -> " + t.charAt(j - 1)); i--; j--;
            } else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) {
                ops.add("DELETE " + s.charAt(i - 1)); i--;
            } else {
                ops.add("INSERT " + t.charAt(j - 1)); j--;
            }
        }
        Collections.reverse(ops);
        return ops;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <algorithm>

std::vector<std::string> editTrace(const std::string& s, const std::string& t) {
    int n = s.size(), m = t.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1));
    for (int i = 0; i <= n; i++) dp[i][0] = i;
    for (int j = 0; j <= m; j++) dp[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = s[i - 1] == t[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + std::min({dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]});
    std::vector<std::string> ops;
    int i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && s[i - 1] == t[j - 1] && dp[i][j] == dp[i - 1][j - 1]) {
            ops.push_back(std::string("MATCH ") + s[i - 1]); i--; j--;
        } else if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + 1) {
            ops.push_back(std::string("REPLACE ") + s[i - 1] + " -> " + t[j - 1]); i--; j--;
        } else if (i > 0 && dp[i][j] == dp[i - 1][j] + 1) {
            ops.push_back(std::string("DELETE ") + s[i - 1]); i--;
        } else {
            ops.push_back(std::string("INSERT ") + t[j - 1]); j--;
        }
    }
    std::reverse(ops.begin(), ops.end());
    return ops;
}
```
