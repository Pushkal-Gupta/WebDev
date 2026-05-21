---
slug: longest-increasing-subseq
module: dp
title: Longest Increasing Subsequence
subtitle: Find the longest strictly-increasing subsequence in O(n log n) using patience-sorting + binary search.
difficulty: Intermediate
position: 15
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Schensted (1961); see also Aigner — Combinatorial Theory"
    url: ""
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
Maintain a `tails[]` array where `tails[i]` is the smallest tail value of any increasing subsequence of length `i + 1` seen so far. For each new element x:
- If x is bigger than every tail: extend (append to tails).
- Otherwise: replace the smallest tail ≥ x with x (binary search). This keeps `tails` sorted and gives shorter sequences a better chance to extend later.

Length of LIS = length of `tails` at the end. The actual subsequence requires bookkeeping pointers.

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
**O(n log n) — patience sorting with binary search:**
```
tails = []
for x in arr:
    pos = bisect_left(tails, x)        # leftmost index with tails[i] >= x
    if pos == len(tails):
        tails.append(x)
    else:
        tails[pos] = x
return len(tails)
```

**Reconstructing the actual subsequence** requires storing predecessor pointers:
```
indices_in_tails = []     # the index in arr that produced tails[i]
prev = [-1] * len(arr)
for i, x in enumerate(arr):
    pos = bisect_left([arr[j] for j in indices_in_tails], x)
    if pos == len(indices_in_tails):
        indices_in_tails.append(i)
    else:
        indices_in_tails[pos] = i
    if pos > 0:
        prev[i] = indices_in_tails[pos - 1]
# Walk prev[] back from indices_in_tails[-1] to reconstruct.
```

For **non-strict** increasing (allow equal), use `bisect_right` instead. For **longest decreasing**, negate the comparison.

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
