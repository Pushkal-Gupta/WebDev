---
slug: russian-doll-envelopes
module: dp
title: Russian Doll Envelopes
subtitle: 2D nesting via LIS — sort by width ascending, height descending, then run LIS on heights.
difficulty: Advanced
position: 4
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Sorting (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/20sorting/"
    type: book
  - title: "Longest Increasing Subsequence — cp-algorithms"
    url: "https://cp-algorithms.com/sequences/longest_increasing_subsequence.html"
    type: blog
  - title: "TheAlgorithms/Python — longest_increasing_subsequence_o_nlogn.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/longest_increasing_subsequence_o_nlogn.py"
    type: repo
status: published
---

## intro
Each envelope has a width and height. Envelope A fits inside B if both `A.w < B.w` *and* `A.h < B.h` strictly. Find the maximum chain of nested envelopes. The strict-on-both-axes constraint is what makes the naive `O(n^2)` LIS on a single sort key wrong — and the fix is a beautiful tie-break trick.

## whyItMatters
This is the prototypical "reduce a 2D problem to a 1D problem with a smart sort" pattern. The same trick — sort one axis, then run a 1D structure on the other — solves activity selection on intervals, longest chain of pairs, and the maximum number of non-overlapping bracketed intervals.

## intuition
If you sort envelopes by width ascending, then any nested chain must appear as an increasing subsequence in the height array — *provided* equal widths cannot both belong to the chain. Without care, two envelopes with the same width but increasing heights would falsely chain. The fix: among equal widths, list heights in *descending* order. Now any increasing subsequence on heights is forced to pick at most one envelope per width.

## visualization
Envelopes `[(5,4),(6,4),(6,7),(2,3)]` sort by (w asc, h desc) to `[(2,3),(5,4),(6,7),(6,4)]`. Heights are `[3, 4, 7, 4]`. The longest strictly increasing subsequence is `[3,4,7]` of length 3 — and the recovered chain `(2,3) → (5,4) → (6,7)` is indeed validly nested.

## bruteForce
Enumerate every subset, check nesting on each. O(2^n · n). Or build a directed graph "A fits in B" and find the longest path — also exponential because longest-path on a DAG is fine only if you accept O(V+E) on the DAG, but constructing it is O(n²) and you still need DP on the DAG. The clever sort drops this to O(n log n).

## optimal
Sort by `(w asc, h desc)`. Extract the heights. Compute the LIS of that height array using the patience-sorting tails trick: maintain a `tails` array; for each `h`, binary-search the leftmost index in `tails` with value ≥ h and overwrite or append. The final length of `tails` is the answer. Tie-breaking by descending height is what makes "≥ h" (not "> h") correct — duplicates at the same width never both make it into `tails`.

## complexity
time: O(n log n)
space: O(n)
notes: Sorting dominates: O(n log n). LIS via binary search is O(n log n). The space is the heights array plus the tails buffer.

## pitfalls
- Sorting by `(w asc, h asc)` — two envelopes with the same width can both join, which is illegal.
- Using `> h` instead of `≥ h` in the binary search — equal heights become allowed, breaking strict nesting.
- Treating "fits inside" as non-strict (`≤`) when the problem says strict — and vice versa.
- Forgetting that the tails array does *not* reconstruct the actual chain; you need parent pointers for that.

## interviewTips
- Walk the sort tie-break out loud before any code — it's the entire insight.
- Cite the 1D LIS subroutine by name (patience sorting / tails array) so the interviewer knows you have it cached.
- Mention 3D generalization: in d dimensions the same reduction works only for d ≤ 2; d ≥ 3 needs a heavier KD-tree or O(n²) DP.

## code.python
```python
from bisect import bisect_left

def max_envelopes(envelopes):
    envelopes.sort(key=lambda e: (e[0], -e[1]))
    tails = []
    for _, h in envelopes:
        i = bisect_left(tails, h)
        if i == len(tails):
            tails.append(h)
        else:
            tails[i] = h
    return len(tails)
```

## code.javascript
```javascript
function maxEnvelopes(envelopes) {
  envelopes.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const tails = [];
  for (const [, h] of envelopes) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < h) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) tails.push(h); else tails[lo] = h;
  }
  return tails.length;
}
```

## code.java
```java
public int maxEnvelopes(int[][] envelopes) {
    java.util.Arrays.sort(envelopes, (a, b) ->
        a[0] != b[0] ? a[0] - b[0] : b[1] - a[1]);
    int[] tails = new int[envelopes.length];
    int size = 0;
    for (int[] e : envelopes) {
        int h = e[1];
        int lo = 0, hi = size;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < h) lo = mid + 1; else hi = mid;
        }
        tails[lo] = h;
        if (lo == size) size++;
    }
    return size;
}
```

## code.cpp
```cpp
int maxEnvelopes(vector<vector<int>>& envelopes) {
    sort(envelopes.begin(), envelopes.end(), [](const vector<int>& a, const vector<int>& b) {
        return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];
    });
    vector<int> tails;
    for (auto& e : envelopes) {
        auto it = lower_bound(tails.begin(), tails.end(), e[1]);
        if (it == tails.end()) tails.push_back(e[1]);
        else *it = e[1];
    }
    return (int)tails.size();
}
```
