---
slug: string-suffix-array
module: sorting-strings
title: Suffix Array
subtitle: Sort all n suffixes of a string in O(n log n); pair with Kasai's LCP for substring queries.
difficulty: Advanced
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Suffix Array — cp-algorithms"
    url: "https://cp-algorithms.com/string/suffix-array.html"
    type: blog
  - title: "Suffix Array — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/suffix-array-set-1-introduction/"
    type: blog
  - title: "KACTL — SuffixArray.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/strings/SuffixArray.h"
    type: repo
status: published
---

## intro
A suffix array is the array `sa[0..n-1]` of starting indices of a string's suffixes, sorted lexicographically. Together with the longest-common-prefix (LCP) array between adjacent sorted suffixes, it answers nearly every classic string question — substring search, count of distinct substrings, longest repeated substring, longest common substring of two strings — in O(n log n) preprocessing plus O(log n) or O(1) per query.

## whyItMatters
Suffix arrays are the space-efficient cousin of suffix trees. They use 4n bytes of integers instead of pointer-heavy trees, are cache-friendly, and on real workloads beat suffix trees by a constant factor. Every serious bioinformatics pipeline (BWA, Bowtie, FM-index) sits on top of a suffix array. In interviews, they are the answer when "count distinct substrings of s" or "longest repeated substring" comes up.

## intuition
Imagine writing every suffix on its own card and alphabetizing the deck. The order of the cards is the suffix array. Doubling-based construction sorts suffixes by their first 1 character, then their first 2, then 4, 8, …, doubling until the length covers the whole suffix. At each doubling step a suffix is a pair (rank of its first k chars, rank of its next k chars) — a 2-key sort by previous ranks suffices.

## visualization
s = "banana$". Suffixes: 0:"banana$", 1:"anana$", 2:"nana$", 3:"ana$", 4:"na$", 5:"a$", 6:"$". Sorted: $, a$, ana$, anana$, banana$, na$, nana$ → sa = [6, 5, 3, 1, 0, 4, 2]. LCP between adjacent sorted pairs: [0, 1, 3, 0, 0, 2] — the "3" pinpoints "ana", the longest repeated substring.

## bruteForce
Materialize every suffix as a string and sort the list. O(n^2 log n) time (n suffixes, each up to n long, string comparison is O(n)) and O(n^2) memory. Dies on inputs above ~3000 characters.

## optimal
Prefix-doubling SA-IS lite (the doubling trick) is O(n log^2 n) with std::sort and O(n log n) with radix sort. SA-IS itself achieves O(n) but is significantly more code. After SA is built, Kasai's algorithm computes the LCP array in O(n): walk the original string in order, maintain a running LCP value h, decrement it by one when you move to the next suffix, then extend it by direct comparison. The amortized cost is O(n) total because h decreases at most n times and increases at most n times.

## complexity
time: O(n log n) construction with radix sort; O(n) for LCP via Kasai
space: O(n) for sa, rank, tmp, and lcp arrays
notes: SA-IS is the asymptotic champion at O(n), worth coding only when n exceeds ~5M. For interview ranges (n at most 10^6) doubling + std::sort is plenty.

## pitfalls
- Forgetting the sentinel: appending a character smaller than every other (commonly '$') guarantees no suffix is a prefix of another and avoids edge cases.
- Naively re-sorting full suffix strings inside the doubling loop — that ruins the O(n log n) bound.
- Off-by-one in Kasai: when sa[i]'s rank is 0 it has no predecessor, so set h = 0 and continue.
- Mixing 0-indexed and 1-indexed ranks between cp-algorithms snippets and KACTL — pick one convention and stay there.

## interviewTips
- Pitch the use case first: "Distinct substrings of s = n * (n + 1) / 2 - sum of lcp[i]." That single line wins the question.
- Mention BWT / FM-index as the production sibling — interviewers like the bioinformatics connection.
- Have the doubling construction ready; SA-IS is overkill in an interview unless you are explicitly asked for linear-time SA.
- Always pair SA with LCP — without LCP, SA is half a tool.

## code.python
```python
def suffix_array(s: str):
    s += chr(0)
    n = len(s)
    sa = sorted(range(n), key=lambda i: s[i])
    rank = [0] * n
    for i in range(1, n):
        rank[sa[i]] = rank[sa[i - 1]] + (1 if s[sa[i]] != s[sa[i - 1]] else 0)
    k = 1
    tmp = [0] * n
    while k < n:
        def key(i):
            return (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)
        tmp[sa[0]] = 0
        for i in range(1, n):
            tmp[sa[i]] = tmp[sa[i - 1]] + (1 if key(sa[i]) != key(sa[i - 1]) else 0)
        rank = tmp[:]
        if rank[sa[-1]] == n - 1:
            break
        k <<= 1
    return sa[1:]

def kasai(s: str, sa):
    n = len(s)
    rank = [0] * n
    for i, p in enumerate(sa):
        rank[p] = i
    lcp = [0] * (n - 1) if n > 1 else []
    h = 0
    for i in range(n):
        if rank[i] == 0:
            h = 0
            continue
        j = sa[rank[i] - 1]
        while i + h < n and j + h < n and s[i + h] == s[j + h]:
            h += 1
        lcp[rank[i] - 1] = h
        if h > 0:
            h -= 1
    return lcp
```

## code.javascript
```javascript
function suffixArray(str) {
  const s = str + '$';
  const n = s.length;
  let sa = [...Array(n).keys()].sort((a, b) => s.charCodeAt(a) - s.charCodeAt(b));
  let rank = new Array(n);
  rank[sa[0]] = 0;
  for (let i = 1; i < n; i++) rank[sa[i]] = rank[sa[i - 1]] + (s[sa[i]] !== s[sa[i - 1]] ? 1 : 0);
  for (let k = 1; k < n; k <<= 1) {
    const key = i => [rank[i], i + k < n ? rank[i + k] : -1];
    sa.sort((a, b) => {
      const ka = key(a), kb = key(b);
      return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1] - kb[1];
    });
    const tmp = new Array(n);
    tmp[sa[0]] = 0;
    for (let i = 1; i < n; i++) {
      const a = key(sa[i]), b = key(sa[i - 1]);
      tmp[sa[i]] = tmp[sa[i - 1]] + (a[0] !== b[0] || a[1] !== b[1] ? 1 : 0);
    }
    rank = tmp;
    if (rank[sa[n - 1]] === n - 1) break;
  }
  return sa.slice(1);
}

function kasai(s, sa) {
  const n = s.length;
  const rank = new Array(n);
  for (let i = 0; i < sa.length; i++) rank[sa[i]] = i;
  const lcp = new Array(Math.max(0, sa.length - 1)).fill(0);
  let h = 0;
  for (let i = 0; i < n; i++) {
    if (rank[i] === 0) { h = 0; continue; }
    const j = sa[rank[i] - 1];
    while (i + h < n && j + h < n && s[i + h] === s[j + h]) h++;
    lcp[rank[i] - 1] = h;
    if (h > 0) h--;
  }
  return lcp;
}
```

## code.java
```java
public int[] suffixArray(String str) {
    String s = str + '$';
    int n = s.length();
    Integer[] sa = new Integer[n];
    for (int i = 0; i < n; i++) sa[i] = i;
    java.util.Arrays.sort(sa, (a, b) -> Character.compare(s.charAt(a), s.charAt(b)));
    int[] rank = new int[n];
    for (int i = 1; i < n; i++)
        rank[sa[i]] = rank[sa[i - 1]] + (s.charAt(sa[i]) != s.charAt(sa[i - 1]) ? 1 : 0);
    for (int k = 1; k < n; k <<= 1) {
        final int kk = k, nn = n;
        final int[] r = rank;
        java.util.Arrays.sort(sa, (a, b) -> {
            if (r[a] != r[b]) return r[a] - r[b];
            int ra = a + kk < nn ? r[a + kk] : -1;
            int rb = b + kk < nn ? r[b + kk] : -1;
            return ra - rb;
        });
        int[] tmp = new int[n];
        for (int i = 1; i < n; i++) {
            int ra = sa[i] + k < n ? rank[sa[i] + k] : -1;
            int rb = sa[i - 1] + k < n ? rank[sa[i - 1] + k] : -1;
            tmp[sa[i]] = tmp[sa[i - 1]] + (rank[sa[i]] != rank[sa[i - 1]] || ra != rb ? 1 : 0);
        }
        rank = tmp;
        if (rank[sa[n - 1]] == n - 1) break;
    }
    int[] out = new int[n - 1];
    for (int i = 1; i < n; i++) out[i - 1] = sa[i];
    return out;
}
```

## code.cpp
```cpp
vector<int> suffix_array(string s) {
    s.push_back(0);
    int n = s.size();
    vector<int> sa(n), rnk(n), tmp(n);
    iota(sa.begin(), sa.end(), 0);
    sort(sa.begin(), sa.end(), [&](int a, int b){ return s[a] < s[b]; });
    for (int i = 1; i < n; ++i) rnk[sa[i]] = rnk[sa[i-1]] + (s[sa[i]] != s[sa[i-1]]);
    for (int k = 1; k < n; k <<= 1) {
        auto key = [&](int i){ return make_pair(rnk[i], i + k < n ? rnk[i + k] : -1); };
        sort(sa.begin(), sa.end(), [&](int a, int b){ return key(a) < key(b); });
        tmp[sa[0]] = 0;
        for (int i = 1; i < n; ++i)
            tmp[sa[i]] = tmp[sa[i-1]] + (key(sa[i]) != key(sa[i-1]));
        rnk = tmp;
        if (rnk[sa[n-1]] == n - 1) break;
    }
    return vector<int>(sa.begin() + 1, sa.end());
}

vector<int> kasai(const string& s, const vector<int>& sa) {
    int n = s.size();
    vector<int> rnk(n), lcp(max(0, (int)sa.size() - 1));
    for (int i = 0; i < (int)sa.size(); ++i) rnk[sa[i]] = i;
    int h = 0;
    for (int i = 0; i < n; ++i) {
        if (rnk[i] == 0) { h = 0; continue; }
        int j = sa[rnk[i] - 1];
        while (i + h < n && j + h < n && s[i + h] == s[j + h]) ++h;
        lcp[rnk[i] - 1] = h;
        if (h > 0) --h;
    }
    return lcp;
}
```
