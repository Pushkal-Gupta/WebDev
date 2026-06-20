---
slug: meet-in-the-middle
module: dp-advanced
title: Meet in the Middle
subtitle: Split the search space in two halves of n/2 — solve each, combine — O(2^(n/2)) instead of O(2^n).
difficulty: Advanced
position: 25
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 4 — Divide-and-Conquer (walkccc)"
    url: "https://walkccc.me/CLRS/Chap04/"
    type: book
  - title: "cp-algorithms — Meet in the Middle"
    url: "https://cp-algorithms.com/others/meet_in_the_middle.html"
    type: blog
  - title: "TheAlgorithms/Python — combinatorics + searches"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Subset-sum on n items is O(2^n) by brute force — infeasible past n ≈ 30. **Meet in the middle (MITM)** halves the exponent: split items into two groups of n/2 each, enumerate ALL subsets of each (2^(n/2) subsets per group), then combine. Total work: 2 · 2^(n/2) + O(2^(n/2) · log 2^(n/2)) = O(n · 2^(n/2)). For n = 40, this drops 10^12 → 10^6.

## whyItMatters
The standard trick when 2^n is too big but 2^(n/2) fits:
- **Subset sum** with target T, n ≤ 40.
- **4Sum** on n elements — split into 2Sum pairs, combine.
- **Knapsack** when items don't fit standard DP (e.g. values too big for O(n·V) table).
- **Shortest path on small bitmask states** — solve forward + backward, meet in middle.
- **CTF crypto** — meet-in-the-middle attacks on double-encryption.

## intuition
The brute-force "enumerate all 2^n subsets and check sum" works but explodes past n = 30. At n = 40 it is 10^12 operations — infeasible. At the same time, the standard pseudo-polynomial knapsack DP runs in O(n * T) and is useless when T is huge (target sums up to 10^18 in cryptographic settings). Meet-in-the-middle attacks this gap by exploiting an algebraic decomposition. Any subset of n items can be split into "items chosen from the first half A" plus "items chosen from the second half B." If the full subset sums to T, then sum(A_chosen) + sum(B_chosen) = T, which rearranges to sum(A_chosen) = T - sum(B_chosen). The right side is a value we can compute by enumerating only B's subsets (2^(n/2) of them), and the left side is a value we can look up by enumerating only A's subsets and storing them in a sorted array (also 2^(n/2)). Combined work is 2 * 2^(n/2) for the two enumerations plus 2^(n/2) * log(2^(n/2)) = O(n * 2^(n/2)) for the lookups. For n = 40, this drops 10^12 ops to about 10^6 — a million-fold speedup. The square-root reduction in the exponent (2^n becomes 2^(n/2)) is the headline result. The same trick applies to k-sum problems (4Sum splits into two 2Sum lookups), shortest paths on bitmask states (search forward and backward, meet in middle), and cryptographic attacks on double-encryption (the original meet-in-the-middle attack on 2DES). The deep insight is that whenever an algorithm faces an exponential-in-n bound, ask if the problem decomposes additively into two halves — if yes, the exponent halves with a sort-and-lookup combine step.

## visualization
```
n = 6, target T = 10
items = [3, 4, 5, 2, 7, 1]

Split: A = [3, 4, 5]  B = [2, 7, 1]

Enumerate A subset sums (2^3 = 8):
  {} → 0, {3} → 3, {4} → 4, {3,4} → 7, {5} → 5,
  {3,5} → 8, {4,5} → 9, {3,4,5} → 12
  Sorted: [0, 3, 4, 5, 7, 8, 9, 12]

Enumerate B subset sums:
  {} → 0, {2} → 2, {7} → 7, {2,7} → 9, {1} → 1,
  {1,2} → 3, {1,7} → 8, {1,2,7} → 10

For each B-sum s: search T - s in A-sums.
  s=0 → search 10 → not found
  s=2 → search 8  → found ({3,5} ∪ {2})  ✓ subset {3,5,2} sums to 10
  s=7 → search 3  → found
  ...etc.
```

## bruteForce
**Full enumeration** O(2^n): for each of 2^n subsets, check sum. Hits 10^12 ops at n=40.

**Standard knapsack DP** O(n · T): if T is small (≤ 10^5) this beats MITM. MITM wins when T is huge (e.g. 10^18) but n is small (≤ 40).

## optimal
```
def subset_sum_target(items, T):
    n = len(items)
    A, B = items[:n//2], items[n//2:]

    # Enumerate all subset sums of A with bitmask
    sA = []
    for mask in range(1 << len(A)):
        s = sum(A[i] for i in range(len(A)) if mask & (1 << i))
        sA.append((s, mask))
    sA.sort()
    sums_only = [s for s, _ in sA]

    # For each subset of B, binary-search T - s in sA
    for mask_b in range(1 << len(B)):
        s_b = sum(B[i] for i in range(len(B)) if mask_b & (1 << i))
        idx = bisect.bisect_left(sums_only, T - s_b)
        if idx < len(sums_only) and sums_only[idx] == T - s_b:
            mask_a = sA[idx][1]
            chosen = [A[i] for i in range(len(A)) if mask_a & (1 << i)] + \
                     [B[i] for i in range(len(B)) if mask_b & (1 << i)]
            return chosen
    return None
```

## complexity
- **Time**: O(n · 2^(n/2)) for enumeration + sort; O(2^(n/2) · log 2^(n/2)) for the lookups.
- **Space**: O(2^(n/2)) for the sorted A-sums list.
- **Practical limit**: n ≈ 40 (2^20 = 10^6 subsets per half).

## pitfalls
- **Forgetting to sort** the A-sums before binary search.
- **Sums with multiple matches**: if you want ALL solutions (not just one), use bisect_left + bisect_right + iterate.
- **Memory blowup at n = 50**: 2^25 = 3.3·10^7 — borderline. n = 60 is impossible.
- **Wrong split**: for very lopsided items (e.g. one huge value), splitting evenly isn't optimal. Sort + split greedily.

## interviewTips
- For "subset-sum / 4Sum / k-subset with target, n ≤ 40" — meet in the middle.
- Cite the **square-root reduction in exponent** as the headline.
- Mention applications in cryptography (meet-in-the-middle attack on 2DES).

## code.python
```python
import bisect
def has_subset_sum(items, T):
    n = len(items); A, B = items[:n//2], items[n//2:]
    sA = sorted(sum(A[i] for i in range(len(A)) if m & (1 << i)) for m in range(1 << len(A)))
    return any(bisect.bisect_left(sA, T - sB) < len(sA)
               and sA[bisect.bisect_left(sA, T - sB)] == T - sB
               for sB in (sum(B[i] for i in range(len(B)) if m & (1 << i))
                          for m in range(1 << len(B))))
```

## code.javascript
```javascript
function hasSubsetSum(items, T) {
  const n = items.length, A = items.slice(0, n/2), B = items.slice(n/2);
  const sumsA = [];
  for (let m = 0; m < (1 << A.length); m++) {
    let s = 0; for (let i = 0; i < A.length; i++) if (m & (1 << i)) s += A[i];
    sumsA.push(s);
  }
  sumsA.sort((a, b) => a - b);
  for (let m = 0; m < (1 << B.length); m++) {
    let s = 0; for (let i = 0; i < B.length; i++) if (m & (1 << i)) s += B[i];
    let lo = 0, hi = sumsA.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sumsA[mid] < T - s) lo = mid + 1; else hi = mid; }
    if (lo < sumsA.length && sumsA[lo] === T - s) return true;
  }
  return false;
}
```

## code.java
```java
import java.util.*;
class MITM {
    static boolean has(int[] items, long T) {
        int n = items.length, half = n / 2;
        long[] sumsA = new long[1 << half];
        for (int m = 0; m < (1 << half); m++) {
            long s = 0;
            for (int i = 0; i < half; i++) if ((m & (1 << i)) != 0) s += items[i];
            sumsA[m] = s;
        }
        Arrays.sort(sumsA);
        int rest = n - half;
        for (int m = 0; m < (1 << rest); m++) {
            long s = 0;
            for (int i = 0; i < rest; i++) if ((m & (1 << i)) != 0) s += items[half + i];
            int idx = Arrays.binarySearch(sumsA, T - s);
            if (idx >= 0) return true;
        }
        return false;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
bool has_subset_sum(std::vector<long long>& items, long long T) {
    int n = items.size(), half = n / 2;
    std::vector<long long> sA;
    for (int m = 0; m < (1 << half); ++m) {
        long long s = 0;
        for (int i = 0; i < half; ++i) if (m & (1 << i)) s += items[i];
        sA.push_back(s);
    }
    std::sort(sA.begin(), sA.end());
    int rest = n - half;
    for (int m = 0; m < (1 << rest); ++m) {
        long long s = 0;
        for (int i = 0; i < rest; ++i) if (m & (1 << i)) s += items[half + i];
        if (std::binary_search(sA.begin(), sA.end(), T - s)) return true;
    }
    return false;
}
```
