---
slug: lis-patience-sorting
module: dp
title: LIS via Patience Sorting
subtitle: Longest increasing subsequence in O(n log n) using patience-sort piles + binary search.
difficulty: Advanced
position: 18
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
The longest increasing subsequence (LIS) of an array is the longest sequence of elements (not necessarily contiguous) whose values strictly increase from left to right. The textbook O(n^2) DP is intuitive but quadratic; the *patience sorting* construction reduces it to O(n log n) by maintaining a small array `tails` where `tails[k]` holds the smallest possible tail of any increasing subsequence of length k+1. Binary search picks the right slot for each incoming element.

## whyItMatters
LIS shows up directly (longest increasing subsequence problems), as a building block (Russian Doll Envelopes, Longest Chain of Pairs, Box Stacking), and indirectly: 2D longest chain, scheduling under precedence, and even the Erdős–Szekeres theorem rely on it. Knowing the O(n log n) algorithm separates "I can solve LIS on n=2500" candidates from "I can solve it on n=10^5" candidates. The technique — *replace a 1D DP scan with a sorted-by-some-key auxiliary structure and binary-search insertions* — generalizes to many DP-with-monotone-structure problems.

## intuition
Imagine dealing cards left to right onto piles. Rule: each card must go on the leftmost pile whose top is greater than or equal to it; if none qualifies, start a new pile. After all cards are dealt, the *number of piles* equals the LIS length. Why? Each pile is a decreasing stack (no two equal tops in the same pile), and any increasing subsequence must take exactly one card from each pile (since two from the same pile would be decreasing). So LIS length is bounded above by pile count, and the dealing rule achieves that bound greedily.

## visualization
```
arr = [10, 9, 2, 5, 3, 7, 101, 18]

Step                tails              note
push 10             [10]               new pile (longest 1)
push 9              [9]                replace 10 (better tail for len-1)
push 2              [2]                replace 9
push 5              [2, 5]             extend (longest 2)
push 3              [2, 3]             replace 5
push 7              [2, 3, 7]          extend (longest 3)
push 101            [2, 3, 7, 101]     extend (longest 4)
push 18             [2, 3, 7, 18]      replace 101

LIS length = len(tails) = 4
A valid LIS: [2, 3, 7, 18]
```

## bruteForce
The standard O(n^2) DP: `dp[i]` = length of LIS ending at index i. For each i, scan all j < i with `arr[j] < arr[i]` and take `max(dp[j]) + 1`. Answer is `max(dp)`. Easy to write, easy to extend (count of LIS, reconstruct), but n=10^4 is the practical ceiling. Worst case 10^8 comparisons at n=10^4 — and the typical interview asks for n up to 2500 just to stay within the quadratic limit.

## optimal
Maintain `tails`, where `tails[k]` is the smallest possible tail of any increasing subsequence of length k+1 found so far. Invariant: `tails` is strictly increasing. For each x in the input, binary-search for the leftmost index i with `tails[i] >= x`. If none exists, append x. Else, set `tails[i] = x`. Final answer: `len(tails)`.

```
tails = []
parent = array of -1   # for reconstruction
indexInTails = array

for i in 0..n-1:
    x = arr[i]
    pos = lower_bound(tails, x)        # strict LIS; bisect_left
    if pos == len(tails):
        tails.append(x)
    else:
        tails[pos] = x
    # bookkeeping for reconstruction
    indexInTails[i] = pos
    parent[i] = predecessorIndexAt(pos - 1)

return len(tails)
```
Use `bisect_left` (lower_bound) for strict LIS, `bisect_right` (upper_bound) for non-decreasing LIS.

## complexity
time: O(n log n) — n inserts, each a binary search over `tails` of length at most n.
space: O(n) — `tails` plus reconstruction arrays.
notes: `tails` is not itself an LIS — its values are correct lengths but its sequence of values is not necessarily a real subsequence of the input. To reconstruct an actual LIS, store predecessor pointers when each element is placed.

## pitfalls
- Using `bisect_right` for strict LIS — admits duplicates and overcounts.
- Returning `tails` as if it were the LIS itself — it's a length-witness, not a real subsequence. Reconstruction requires predecessor pointers.
- Forgetting to clear `tails` if reusing across test cases.
- Mishandling the empty-array case — `len(tails)` correctly returns 0, but custom while-loops can underflow.
- Applying patience sorting to count LIS — the algorithm gives length, not count. Counting needs a Fenwick tree on (value, length-class) pairs.

## interviewTips
- State both complexities up front: "O(n^2) DP, or O(n log n) with patience sorting + binary search."
- Walk through a small example (5–6 elements) and show the `tails` array evolving — visual proof of correctness.
- Be ready for the follow-up: reconstruct an actual LIS. Pre-allocate a `parent` array and a per-position pile index.
- Know variants: non-strict LIS (`bisect_right`), longest decreasing (reverse signs), longest chain of pairs (sort by first, LIS on second).
- Mention real-world: stock-buying with monotone constraints, Russian Doll envelopes, longest non-overlapping interval chain.

## code.python
```python
from bisect import bisect_left

def lis_length(arr):
    tails = []
    for x in arr:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)

def lis_reconstruct(arr):
    if not arr: return []
    tails, tails_idx, parent = [], [], [-1] * len(arr)
    for i, x in enumerate(arr):
        pos = bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x); tails_idx.append(i)
        else:
            tails[pos] = x; tails_idx[pos] = i
        if pos > 0: parent[i] = tails_idx[pos - 1]
    out, k = [], tails_idx[-1]
    while k != -1:
        out.append(arr[k]); k = parent[k]
    return out[::-1]
```

## code.javascript
```javascript
function lisLength(arr) {
  const tails = [];
  for (const x of arr) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) tails.push(x); else tails[lo] = x;
  }
  return tails.length;
}

function lisReconstruct(arr) {
  if (arr.length === 0) return [];
  const tails = [], tailsIdx = [], parent = new Array(arr.length).fill(-1);
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i];
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1; else hi = mid;
    }
    if (lo === tails.length) { tails.push(x); tailsIdx.push(i); }
    else { tails[lo] = x; tailsIdx[lo] = i; }
    if (lo > 0) parent[i] = tailsIdx[lo - 1];
  }
  const out = [];
  for (let k = tailsIdx[tailsIdx.length - 1]; k !== -1; k = parent[k]) out.push(arr[k]);
  return out.reverse();
}
```

## code.java
```java
import java.util.*;

public class LIS {
    public int length(int[] arr) {
        int[] tails = new int[arr.length];
        int size = 0;
        for (int x : arr) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1; else hi = mid;
            }
            tails[lo] = x;
            if (lo == size) size++;
        }
        return size;
    }

    public List<Integer> reconstruct(int[] arr) {
        int n = arr.length;
        if (n == 0) return Collections.emptyList();
        int[] tails = new int[n], tailsIdx = new int[n], parent = new int[n];
        Arrays.fill(parent, -1);
        int size = 0;
        for (int i = 0; i < n; i++) {
            int x = arr[i], lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1; else hi = mid;
            }
            tails[lo] = x; tailsIdx[lo] = i;
            if (lo > 0) parent[i] = tailsIdx[lo - 1];
            if (lo == size) size++;
        }
        LinkedList<Integer> out = new LinkedList<>();
        for (int k = tailsIdx[size - 1]; k != -1; k = parent[k]) out.addFirst(arr[k]);
        return out;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

int lis_length(const std::vector<int>& arr) {
    std::vector<int> tails;
    for (int x : arr) {
        auto it = std::lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return (int) tails.size();
}

std::vector<int> lis_reconstruct(const std::vector<int>& arr) {
    int n = arr.size();
    if (n == 0) return {};
    std::vector<int> tails, tails_idx, parent(n, -1);
    for (int i = 0; i < n; i++) {
        int x = arr[i];
        auto it = std::lower_bound(tails.begin(), tails.end(), x);
        int pos = it - tails.begin();
        if (it == tails.end()) { tails.push_back(x); tails_idx.push_back(i); }
        else { *it = x; tails_idx[pos] = i; }
        if (pos > 0) parent[i] = tails_idx[pos - 1];
    }
    std::vector<int> out;
    for (int k = tails_idx.back(); k != -1; k = parent[k]) out.push_back(arr[k]);
    std::reverse(out.begin(), out.end());
    return out;
}
```
