---
slug: suffix-array
module: strings-advanced
title: Suffix Array
subtitle: Sorted array of all suffixes — powers fast substring search, longest repeated substring, longest common substring.
difficulty: Advanced
position: 21
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Strings chapter"
    url: "https://algs4.cs.princeton.edu/50strings/"
    type: book
  - title: "cp-algorithms — String processing"
    url: "https://cp-algorithms.com/string/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — strings/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/strings"
    type: repo
status: published
---

## intro
A suffix array of a string `S` is the sorted permutation of indices `[0, 1, ..., n-1]` such that the suffixes starting at those indices are in lexicographic order. It's a compact substitute for a suffix tree — same power, ~5× less memory, easier to code. Paired with an LCP (longest common prefix) array, it answers a huge family of substring questions.

## whyItMatters
Once you have a suffix array + LCP, you get:
- **Substring search**: binary search the pattern over the suffixes → O(m log n) (or O(m + log n) with LCP).
- **Longest repeated substring** in O(n) → max value in LCP.
- **Longest common substring of two strings** in O(n + m) → concatenate `A#B$`, build SA + LCP, scan for the max LCP between suffixes from different sides.
- **Distinct substring count** in O(n) → `n·(n+1)/2 − sum(LCP)`.
- **Pattern occurrence count** via binary search → O(m log n + occ).

Suffix arrays are the foundation of `grep -F`, bioinformatics aligners (Bowtie, BWA), compressors (bzip2 uses BWT, which lives next door), and competitive-programming string problems.

## intuition
Sort all suffixes of "banana":
```
indices  suffix
   5      a
   3      ana
   1      anana
   0      banana
   4      na
   2      nana
```
The sorted indices `[5, 3, 1, 0, 4, 2]` are the suffix array. Substring search now collapses to binary search on this sorted list.

## visualization
```
S = "banana"

i | suffix(i)
--+----------
0 | banana
1 | anana
2 | nana
3 | ana
4 | na
5 | a

Sorted:
SA = [5, 3, 1, 0, 4, 2]
       a, ana, anana, banana, na, nana

LCP[i] = LCP between SA[i-1] and SA[i]
LCP = [_, 1, 3, 0, 0, 2]
        ^ undefined / 0 for the first
```

## bruteForce
Generate all `n` suffixes (as strings), sort them with the default comparator → `O(n^2 log n)` time, `O(n^2)` memory for the strings. Fine for `n ≤ 1000`, dies on `n = 10^6`.

## optimal
Two practical approaches:

**1. Prefix doubling (O(n log^2 n) or O(n log n) with radix sort)**

Sort suffixes by their first `k` characters, doubling `k = 1, 2, 4, 8, ...`. Each suffix gets a rank pair `(rank[i], rank[i+k])` — sort by pairs to get the rank for `2k`. After `log n` rounds you have full suffix ranks.

**2. SA-IS (O(n))**

Linear-time induced sorting — fast in practice and the right choice for `n > 10^6`. More code, but standard implementations are widely available.

**LCP via Kasai's algorithm (O(n))**

Given SA, compute LCP in linear time using the fact that `LCP[rank[i]] ≥ LCP[rank[i-1]] - 1`.

```
h = 0
for i in 0..n-1:
    if rank[i] > 0:
        j = SA[rank[i] - 1]
        while i + h < n and j + h < n and S[i+h] == S[j+h]: h += 1
        LCP[rank[i]] = h
        if h > 0: h -= 1
    else:
        h = 0
```

## complexity
- **Build SA**: O(n log n) (prefix doubling) or O(n) (SA-IS).
- **Build LCP**: O(n) (Kasai).
- **Pattern search**: O(m log n) plain, O(m + log n) with LCP optimization.
- **Space**: O(n) ints — ~4 bytes per char for SA, same for LCP.

## pitfalls
- **Sentinel character**: append a unique char smaller than every alphabet symbol (often `'\0'` or `'$'`) so no suffix is a prefix of another. Forgetting this breaks Kasai.
- **Off-by-one in pair comparison**: when sorting by `(rank[i], rank[i+k])`, suffixes shorter than `i+k` get `-1` (or some sentinel) for the second key.
- **Recursion depth in SA-IS**: implement iteratively or raise the limit.
- **Memory blowup with strings**: store integer ranks, not substrings.
- **Confusing SA with Z-array** — both are linear-time string structures, very different uses. SA sorts suffixes; Z computes longest match with the start.

## interviewTips
- For senior interviews, when the prompt mentions multiple substring queries on a fixed string, suffix array is the right answer.
- Mention **LCP via Kasai** without prompting — it's the second half of nearly every SA problem.
- Compare with **suffix tree** (more powerful but ~5× memory) and **suffix automaton** (best for "how many distinct substrings, online").
- For "longest repeated substring," answer is the max LCP value; the substring is `S[SA[argmax]..SA[argmax]+max_lcp]`.

## code.python
```python
def build_sa(s: str) -> list[int]:
    n = len(s)
    sa = sorted(range(n), key=lambda i: s[i:])  # O(n^2 log n) — fine for n ≤ a few k
    return sa

def build_lcp(s: str, sa: list[int]) -> list[int]:
    n = len(s)
    rank = [0]*n
    for i, suf in enumerate(sa): rank[suf] = i
    lcp = [0]*n
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i+h] == s[j+h]: h += 1
            lcp[rank[i]] = h
            if h > 0: h -= 1
        else:
            h = 0
    return lcp

s = "banana"
sa = build_sa(s)
lcp = build_lcp(s, sa)
print(sa)              # [5, 3, 1, 0, 4, 2]
print(max(lcp))        # 3 → longest repeated substring length
```

## code.javascript
```javascript
function buildSA(s) {
  const n = s.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  return idx.sort((a, b) => s.slice(a) < s.slice(b) ? -1 : 1);
}
function buildLCP(s, sa) {
  const n = s.length, rank = new Int32Array(n), lcp = new Int32Array(n);
  for (let i = 0; i < n; i++) rank[sa[i]] = i;
  let h = 0;
  for (let i = 0; i < n; i++) {
    if (rank[i] > 0) {
      const j = sa[rank[i] - 1];
      while (i + h < n && j + h < n && s[i+h] === s[j+h]) h++;
      lcp[rank[i]] = h;
      if (h > 0) h--;
    } else { h = 0; }
  }
  return lcp;
}
```

## code.java
```java
import java.util.*;
class SuffixArray {
    static Integer[] build(String s) {
        Integer[] sa = new Integer[s.length()];
        for (int i = 0; i < s.length(); i++) sa[i] = i;
        Arrays.sort(sa, (a, b) -> s.substring(a).compareTo(s.substring(b)));
        return sa;
    }
    static int[] kasai(String s, Integer[] sa) {
        int n = s.length(); int[] rank = new int[n]; int[] lcp = new int[n];
        for (int i = 0; i < n; i++) rank[sa[i]] = i;
        int h = 0;
        for (int i = 0; i < n; i++) {
            if (rank[i] > 0) {
                int j = sa[rank[i] - 1];
                while (i + h < n && j + h < n && s.charAt(i+h) == s.charAt(j+h)) h++;
                lcp[rank[i]] = h;
                if (h > 0) h--;
            } else h = 0;
        }
        return lcp;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <algorithm>
std::vector<int> buildSA(const std::string& s) {
    int n = s.size();
    std::vector<int> sa(n);
    for (int i = 0; i < n; i++) sa[i] = i;
    std::sort(sa.begin(), sa.end(),
        [&](int a, int b) { return s.compare(a, std::string::npos, s, b, std::string::npos) < 0; });
    return sa;
}
std::vector<int> kasai(const std::string& s, const std::vector<int>& sa) {
    int n = s.size();
    std::vector<int> rank(n), lcp(n);
    for (int i = 0; i < n; i++) rank[sa[i]] = i;
    int h = 0;
    for (int i = 0; i < n; i++) {
        if (rank[i] > 0) {
            int j = sa[rank[i] - 1];
            while (i + h < n && j + h < n && s[i+h] == s[j+h]) h++;
            lcp[rank[i]] = h;
            if (h > 0) h--;
        } else h = 0;
    }
    return lcp;
}
```
