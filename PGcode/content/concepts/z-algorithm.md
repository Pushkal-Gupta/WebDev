---
slug: z-algorithm
module: sorting-strings
title: Z-Algorithm
subtitle: Linear-time pattern matching via the Z-array — every prefix's longest reach in O(n+m).
difficulty: Advanced
position: 30
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Competitive Programmer's Handbook — String Algorithms"
    url: ""
status: published
---

## intro
The Z-algorithm computes, for every position i of a string s, the length z[i] of the longest substring starting at i that matches a prefix of s. With that single array you can solve exact-pattern matching, count distinct substrings, and detect periodicity — all in linear time. It is the cleanest "build one table, answer many questions" technique for strings.

## whyItMatters
Naive substring search is O(n*m) and falls apart at scale — log analyzers, DNA aligners, plagiarism detectors, and grep all need linear-time matching. KMP gets you there, but its failure-function semantics ("longest proper prefix that is also a suffix") are notoriously confusing in interviews. The Z-array's definition is concrete and visual: "how far does the prefix re-appear starting here?" That clarity matters when you have ten minutes to explain the algorithm on a whiteboard.

## intuition
Think of the prefix of s as a stencil. Slide it along the string; at each position i, how many characters match before something diverges? That count is z[i]. The trick is reuse: if you have already discovered a long matched stretch ending at position r, then for any new i inside that stretch, you already know what character is supposed to be there (it mirrors a position inside the prefix you computed earlier). You only do brand-new character comparisons when you outrun the previous match.

## visualization
```
s = a a b c a a b x a a b c
    0 1 2 3 4 5 6 7 8 9 ...

i : 0 1 2 3 4 5 6 7 8 9 10 11
z : - 1 0 0 3 1 0 0 4 1 0  0

window [l..r]: tracks the rightmost match of the prefix.
At i=8, the prefix "aabc" re-appears -> z[8]=4, window becomes [8..11].
```

## bruteForce
For every starting index i, compare s[i], s[i+1], ... against s[0], s[1], ... until a mismatch. Worst case the inner loop runs n times for each of n positions: O(n^2). On strings like "aaaa...a" this hits the worst case exactly. Pattern matching built on top inherits O(n*m). Acceptable for tiny inputs, fatal at 10^6 characters.

## optimal
Maintain a "Z-box" [l, r] — the interval with largest r such that s[l..r] equals s[0..r-l]. Iterate i from 1 to n-1:
1. If i > r, no help from history: set l = r = i, then extend r while s[r-l] == s[r]. Set z[i] = r - l, then decrement r by 1.
2. Else, let k = i - l (the mirror position inside the prefix). If z[k] < r - i + 1, the answer is fully inside the box: z[i] = z[k]. Otherwise z[i] is at least r - i + 1; reset l = i, extend r past the box until mismatch, record z[i] = r - l, decrement r.

For pattern matching, concatenate pattern + "$" + text (sentinel never appears in either). Any i with z[i] == len(pattern) is a match position in the text.

## complexity
- time: O(n + m) — the pointer r only moves forward across the whole string.
- space: O(n + m) for the Z-array (and the concatenated string in matching mode).
- tradeoff vs KMP: same asymptotic cost, but the Z-array is reusable for many string queries; KMP's failure array is more memory-efficient when you only need matching.

## pitfalls
- Forgetting the sentinel character — without it a long pattern can "spill" into the text and inflate z values.
- Setting z[0] to anything; by convention it is undefined or n, but using it as a match condition will spuriously fire.
- Off-by-one when shrinking the Z-box: after extending, r points one past the matched region, so the final value is r - l and you decrement r afterwards.
- Picking a sentinel that can appear in input (e.g. '#' in URLs). Use a value outside the alphabet, or stream-encode.

## interviewTips
- Trigger phrases: "find all occurrences", "longest prefix that is also a suffix", "shortest period of a string", "count distinct substrings".
- State the definition crisply before writing code: "z[i] is the length of the longest substring starting at i that matches a prefix of s."
- Mention the alternative (KMP) and why you prefer Z: "It gives me the same complexity but the array has a more direct meaning, so I'm less likely to bug it."
- If the interviewer probes edge cases, walk through "aaaa" — every position has a non-trivial z value, which exercises the box-reuse branch.

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
    s = pattern + "$" + text
    z = z_function(s)
    p = len(pattern)
    return [i - p - 1 for i in range(p + 1, len(s)) if z[i] == p]
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
  const s = pattern + "$" + text;
  const z = zFunction(s);
  const p = pattern.length;
  const hits = [];
  for (let i = p + 1; i < s.length; i++) {
    if (z[i] === p) hits.push(i - p - 1);
  }
  return hits;
}
```

## code.java
```java
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
    String s = pattern + "$" + text;
    int[] z = zFunction(s);
    int p = pattern.length();
    List<Integer> hits = new ArrayList<>();
    for (int i = p + 1; i < s.length(); i++) {
        if (z[i] == p) hits.add(i - p - 1);
    }
    return hits;
}
```

## code.cpp
```cpp
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
    string s = pattern + "$" + text;
    vector<int> z = zFunction(s);
    int p = pattern.size();
    vector<int> hits;
    for (int i = p + 1; i < (int)s.size(); i++) {
        if (z[i] == p) hits.push_back(i - p - 1);
    }
    return hits;
}
```
