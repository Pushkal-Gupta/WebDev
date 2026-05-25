---
slug: longest-increasing-subseq
module: dp-classical
title: Longest Increasing Subsequence
subtitle: Find the longest strictly-increasing subsequence in O(n log n) using patience-sorting + binary search.
difficulty: Intermediate
position: 15
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
Given an array, find the length (and optionally one instance) of the longest subsequence whose elements are strictly increasing. The straightforward DP is `O(n²)`; the patience-sorting trick with binary search drops it to **O(n log n)**, which is the right answer for n ≤ 10^5.

## whyItMatters
LIS is one of the most-asked DP problems and also the building block for:
- **Patience sorting** (a card game that proves the algorithm).
- **2D / 3D / k-D nesting problems** ("nested envelopes," "Russian doll envelopes") — sort by one dimension, LIS on another.
- **Sequence alignment** in bioinformatics.
- **LIS on a permutation** — counts the longest chain in the Young tableau.

Knowing both the O(n²) DP and the O(n log n) patience version is interview-standard.

## intuition
The naive O(n^2) DP defines `dp[i]` = LIS length ending at index i, with recurrence `dp[i] = 1 + max(dp[j] for j < i if arr[j] < arr[i])`. Correct but quadratic. The O(n log n) breakthrough uses a clever invariant: maintain a `tails` array where `tails[k]` is the smallest possible tail value of any increasing subsequence of length k + 1 seen so far. For each new element x, binary-search the leftmost position where `tails[pos] >= x` (using `bisect_left`). If `pos == len(tails)`, x extends the longest seen LIS — append it. Otherwise, replace `tails[pos]` with x, which keeps `tails` sorted and lowers the tail of length-(pos+1) sequences. Why does this work? Replacing a tail with a smaller value gives all future longer sequences a strictly better chance to extend — the smaller the tail, the more elements can come after it. The length of LIS is `len(tails)` at the end. The actual subsequence requires extra bookkeeping (predecessor pointers) because `tails` itself is not the LIS — its elements may come from positions that do not form a contiguous subsequence. The deep insight is the "patience sorting" connection. Picture dealing cards face-up onto piles by the rule "place each card on the leftmost pile whose top is bigger than the new card; otherwise start a new pile." The number of piles equals the LIS length. The binary search in our algorithm is "find the leftmost pile to place this card." This patience-sorting view also proves correctness: the piles encode a valid chain decomposition, and Mirsky's theorem on partial orders ensures the minimum number of piles equals the longest chain. For 2D problems (Russian doll envelopes), sort by one dimension and LIS on the other — with careful tie-breaking (sort second dim descending) to prevent equal-first-dim items from chaining.

## visualization
```
arr = [10, 9, 2, 5, 3, 7, 101, 18]

Step  arr[i]  tails
 1      10    [10]
 2       9    [9]              (replace)
 3       2    [2]              (replace)
 4       5    [2, 5]           (extend)
 5       3    [2, 3]           (replace 5 with 3)
 6       7    [2, 3, 7]        (extend)
 7     101    [2, 3, 7, 101]   (extend)
 8      18    [2, 3, 7, 18]    (replace 101 with 18)

|tails| = 4 → LIS length = 4. (One LIS: 2, 3, 7, 101.)
```

## bruteForce
**O(n²) DP**: `dp[i] = 1 + max(dp[j] for j < i if arr[j] < arr[i])`. Answer = max(dp). Simple, slow.

**Recursive with memoization**: `lis(i)` = LIS ending at i. Same complexity, just framed differently.

## optimal
Patience sorting with binary search. For each element x in the input, binary-search the leftmost position in `tails` where the entry is `>= x`. Append x if it extends the longest sequence, else replace `tails[pos] = x` to lower the tail of length-(pos+1) sequences. Length of LIS is `len(tails)`. Time O(n log n), space O(n). This is asymptotically optimal — any comparison-based algorithm that finds the LIS length requires Omega(n log n) in the worst case (proven via decision-tree arguments on adversarial inputs).

```python
from bisect import bisect_left

def lis_length(arr):
    """O(n log n) LIS via patience sorting + binary search."""
    tails = []                                  # tails[k] = smallest possible tail of len k+1 LIS
    for x in arr:
        # bisect_left finds the leftmost pos where tails[pos] >= x.
        pos = bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)                     # x extends the longest LIS seen so far
        else:
            tails[pos] = x                      # lower the tail; gives future sequences more room
    return len(tails)

def lis_actual(arr):
    """Reconstruct an actual LIS via predecessor pointers."""
    if not arr: return []
    tails_idx = []                              # indices in arr that produced each tail
    prev = [-1] * len(arr)
    for i, x in enumerate(arr):
        lo, hi = 0, len(tails_idx)
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[tails_idx[mid]] < x: lo = mid + 1
            else: hi = mid
        if lo == len(tails_idx): tails_idx.append(i)
        else: tails_idx[lo] = i
        if lo > 0: prev[i] = tails_idx[lo - 1]  # link to previous element in chain
    out = []
    k = tails_idx[-1]
    while k != -1:
        out.append(arr[k]); k = prev[k]
    return out[::-1]
```

The `bisect_left` choice (strict less-than for ordering) gives strictly increasing LIS; swap to `bisect_right` for non-strict (allows equal consecutive elements). For longest decreasing, negate values before running the algorithm. The reconstruction predecessor-pointer trick is essential because `tails` itself is not the LIS — its values come from positions that may not form a valid subsequence; the `prev` array records the actual predecessor in the source array.

## complexity
- **Time**: O(n log n).
- **Space**: O(n) for tails + predecessor pointers.

## pitfalls
- **Strict vs non-strict**: `bisect_left` for strictly-increasing; `bisect_right` allows duplicates. Easy to get wrong.
- **tails is NOT the answer subsequence**: it's a length-tracking array. The real LIS needs predecessor pointers.
- **Mistaking longest increasing subarray vs subsequence**: subarray must be contiguous; subsequence doesn't. They're different problems.
- **2D LIS** (e.g., "envelopes"): sort by first dim ascending, second dim DESCENDING (to prevent equal-first-dim items from chaining), then LIS on second dim.

## interviewTips
- The trigger: "longest X where elements satisfy some monotone relation across an array."
- Always state both the O(n²) DP and the O(n log n) version. Mention which you'd code first under time pressure.
- For "Russian doll envelopes" type problems, sort + LIS is the canonical answer.
- For senior interviews, mention **counting LISes** (each tail position holds a frequency BIT for ties).

## code.python
```python
from bisect import bisect_left

def lis_length(arr):
    tails = []
    for x in arr:
        pos = bisect_left(tails, x)
        if pos == len(tails): tails.append(x)
        else: tails[pos] = x
    return len(tails)

def lis_actual(arr):
    if not arr: return []
    tails_idx = []
    prev = [-1] * len(arr)
    for i, x in enumerate(arr):
        # binary-search inside tails_idx by their arr values
        lo, hi = 0, len(tails_idx)
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[tails_idx[mid]] < x: lo = mid + 1
            else: hi = mid
        if lo == len(tails_idx): tails_idx.append(i)
        else: tails_idx[lo] = i
        if lo > 0: prev[i] = tails_idx[lo - 1]
    out = []
    k = tails_idx[-1]
    while k != -1:
        out.append(arr[k]); k = prev[k]
    return out[::-1]

print(lis_length([10, 9, 2, 5, 3, 7, 101, 18]))   # 4
print(lis_actual([10, 9, 2, 5, 3, 7, 101, 18]))   # [2, 3, 7, 101]
```

## code.javascript
```javascript
function lisLength(arr) {
  const tails = [];
  for (const x of arr) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; }
    if (lo === tails.length) tails.push(x); else tails[lo] = x;
  }
  return tails.length;
}
```

## code.java
```java
import java.util.*;
class LIS {
    public int length(int[] arr) {
        List<Integer> tails = new ArrayList<>();
        for (int x : arr) {
            int lo = 0, hi = tails.size();
            while (lo < hi) {
                int m = (lo + hi) >>> 1;
                if (tails.get(m) < x) lo = m + 1; else hi = m;
            }
            if (lo == tails.size()) tails.add(x); else tails.set(lo, x);
        }
        return tails.size();
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
int lisLength(const std::vector<int>& arr) {
    std::vector<int> tails;
    for (int x : arr) {
        auto it = std::lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
```
