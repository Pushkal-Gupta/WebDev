---
slug: palindrome-partition-dp
module: dp
title: Palindrome Partitioning — Minimum Cuts
subtitle: Find the fewest cuts needed to split a string into all-palindrome substrings via two-layer DP.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.4/"
    type: book
  - title: "Palindrome Partitioning II — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/palindrome-partitioning-dp-17/"
    type: blog
  - title: "TheAlgorithms/Python — palindrome_partitioning.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/palindrome_partitioning.py"
    type: repo
status: published
---

## intro
Given a string s, partition it so every contiguous piece is a palindrome and the number of cuts is minimized. A cut sits between two characters; k cuts produce k+1 pieces. The optimal answer is two layers of dynamic programming: first decide which substrings are palindromes, then decide the cheapest cut sequence on top of that table.

## whyItMatters
The double-DP pattern — precompute a boolean reachability/feasibility table, then run a linear DP that consults it in O(1) — appears in Word Break II, Matrix Chain, Optimal BST, and many parser problems. Mastering palindrome partitioning is a strong proxy for "can you separate the easy combinatorial question from the harder counting question." Real-world: text segmentation in NLP and run-length compression both have palindrome-friendly structure.

## intuition
Let isPal[i][j] be true iff s[i..j] is a palindrome. Then let cuts[i] be the minimum cuts needed for the prefix s[0..i]. If s[0..i] is already a palindrome, cuts[i] = 0. Otherwise, scan j from 1 to i: if s[j..i] is a palindrome, the prefix s[0..j-1] already costs cuts[j-1] cuts, plus one more cut to detach s[j..i]. Take the minimum.

## visualization
s = "aab". Build isPal: isPal[0][0]=T, isPal[1][1]=T, isPal[2][2]=T, isPal[0][1]=T (aa), isPal[1][2]=F (ab), isPal[0][2]=F (aab). Now cuts: cuts[0]=0. cuts[1]: s[0..1]=aa palindrome -> 0. cuts[2]: s[0..2]=aab not palindrome; try j=1: s[1..2]=ab F. j=2: s[2..2]=b T, candidate = cuts[1]+1 = 1. So cuts[2]=1. Answer: 1 cut, pieces "aa" and "b".

## bruteForce
Recurse: try every cut position; for each piece check palindrome by two-pointer; recurse on the rest. Without memoization this is exponential. Adding memoization on the start index brings it down to O(n^2) calls, but each palindrome check is still O(n), giving O(n^3) overall. Acceptable for n up to a few hundred, but not the intended answer.

## optimal
Two-phase O(n^2) DP. Phase 1: fill isPal[i][j] in increasing length. isPal[i][j] is true if s[i]==s[j] and (j-i < 2 or isPal[i+1][j-1]). Phase 2: scan i from 0 to n-1. If isPal[0][i], set cuts[i]=0. Else cuts[i] = 1 + min over j in [1..i] with isPal[j][i] of cuts[j-1]. Return cuts[n-1]. Both phases are O(n^2) time and O(n^2) space; the cuts array itself only needs O(n).

## complexity
time: O(n^2)
space: O(n^2) for the palindrome table, O(n) for the cuts array
notes: A "expand around center" preprocessing fills the same isPal table in O(n^2) time without the recurrence. A clever single-pass variant by Manacher achieves O(n) palindrome detection but the cuts DP still needs O(n^2) in the worst case.

## pitfalls
- Filling isPal in the wrong order — must iterate by substring length, not by (i, j) row-major.
- Off-by-one when separating prefix s[0..j-1] from suffix s[j..i] — draw the indices first.
- Forgetting the base case "the whole prefix is already a palindrome -> 0 cuts" — the loop alone returns 1.
- Allocating an n by n boolean as plain int — 4x memory waste on large strings.

## interviewTips
- Always split the problem aloud: "I'll precompute is-palindrome in O(n^2), then run the cuts DP in another O(n^2)."
- Mention the O(n) prefix DP space optimization — the interviewer often asks how to shrink memory.
- Be ready for the variant "list every minimum partition" — needs to remember the chosen j per i.

## code.python
```python
def min_cut(s):
    n = len(s)
    is_pal = [[False] * n for _ in range(n)]
    for length in range(1, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j] and (length < 3 or is_pal[i + 1][j - 1]):
                is_pal[i][j] = True
    cuts = [0] * n
    for i in range(n):
        if is_pal[0][i]:
            cuts[i] = 0
        else:
            cuts[i] = i
            for j in range(1, i + 1):
                if is_pal[j][i]:
                    cuts[i] = min(cuts[i], cuts[j - 1] + 1)
    return cuts[n - 1]
```

## code.javascript
```javascript
function minCut(s) {
  const n = s.length;
  const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let len = 1; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j] && (len < 3 || isPal[i + 1][j - 1])) isPal[i][j] = true;
    }
  }
  const cuts = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (isPal[0][i]) { cuts[i] = 0; continue; }
    cuts[i] = i;
    for (let j = 1; j <= i; j++) {
      if (isPal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);
    }
  }
  return cuts[n - 1];
}
```

## code.java
```java
public int minCut(String s) {
    int n = s.length();
    boolean[][] isPal = new boolean[n][n];
    for (int len = 1; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s.charAt(i) == s.charAt(j) && (len < 3 || isPal[i + 1][j - 1])) {
                isPal[i][j] = true;
            }
        }
    }
    int[] cuts = new int[n];
    for (int i = 0; i < n; i++) {
        if (isPal[0][i]) { cuts[i] = 0; continue; }
        cuts[i] = i;
        for (int j = 1; j <= i; j++) {
            if (isPal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);
        }
    }
    return cuts[n - 1];
}
```

## code.cpp
```cpp
int minCut(string s) {
    int n = s.size();
    vector<vector<bool>> isPal(n, vector<bool>(n, false));
    for (int len = 1; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            if (s[i] == s[j] && (len < 3 || isPal[i + 1][j - 1])) isPal[i][j] = true;
        }
    }
    vector<int> cuts(n, 0);
    for (int i = 0; i < n; i++) {
        if (isPal[0][i]) { cuts[i] = 0; continue; }
        cuts[i] = i;
        for (int j = 1; j <= i; j++) {
            if (isPal[j][i]) cuts[i] = min(cuts[i], cuts[j - 1] + 1);
        }
    }
    return cuts[n - 1];
}
```
