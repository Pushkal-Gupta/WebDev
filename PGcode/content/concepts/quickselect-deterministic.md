---
slug: quickselect-deterministic
module: sorting-strings
title: Deterministic Quickselect
subtitle: Find the k-th smallest in worst-case O(n) using median-of-medians as the pivot.
difficulty: Advanced
position: 40
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 9: Medians and Order Statistics"
    url: "https://walkccc.me/CLRS/Chap09/9.3/"
    type: book
  - title: "Median of Medians — cp-algorithms"
    url: "https://cp-algorithms.com/sequences/k-th.html"
    type: blog
  - title: "TheAlgorithms/Python — median_of_medians.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/searches/median_of_medians.py"
    type: repo
status: published
---

## intro
Quickselect finds the k-th smallest element by partitioning around a pivot and recursing into the side that contains rank k. Randomized quickselect runs in O(n) expected but degrades to O(n²) on adversarial inputs. The deterministic variant uses the median-of-medians (BFPRT) algorithm to choose a pivot that guarantees a 30/70 split, giving worst-case O(n). It is the textbook proof that selection is strictly easier than sorting.

## whyItMatters
Selection appears everywhere: percentile queries, top-k recommendations, streaming quantiles, robust statistics (median, trimmed mean), and as a subroutine inside introselect (libstdc++ `nth_element`, Rust's `select_nth_unstable`). Sorting and indexing costs Θ(n log n) — selection costs Θ(n), and the deterministic version gives that guarantee even under worst-case adversaries (e.g., security-sensitive contexts where input is attacker-controlled).

## intuition
A good pivot is one that throws away a constant fraction of the array each round; that gives the recurrence T(n) = T(αn) + O(n) which solves to O(n) for any α < 1. The trick is producing such a pivot in linear time. Median-of-medians splits the input into groups of 5, takes each group's median by hand (constant time per group), then recursively selects the median of those n/5 medians. That median is guaranteed to be larger than 3 out of every 5 elements in at least half the groups — i.e., larger than ~3n/10 of the array — so the worst partition leaves at most 7n/10 on either side.

## visualization
```
Input (n=15):  groups of 5
    [7 3 9 1 4]  [8 2 6 5 0]  [12 11 14 13 10]
    medians  4         5            12
    median-of-medians: select(median[4,5,12]) = 5
Partition around 5:
    <= 5: [3 1 4 2 0 5]     (size 6)
    >  5: [7 9 8 6 12 11 14 13 10]  (size 9)
Guarantee: 3 elements per group <= pivot in at least half the groups
           => at least 3 * ceil(n/10) on the small side, so |small|, |large| <= 7n/10
```

## bruteForce
Sort the array and return `a[k-1]`. Correct, O(n log n) time, O(1) or O(n) extra depending on the sort. Wastes work — we only need rank k, not the full order.

Randomized quickselect: pick a uniform-random pivot, partition, recurse into the side holding rank k. Expected O(n) by linearity of expectation; worst case O(n²) when the adversary or RNG hands you a sorted array.

## optimal
```
function select(A, k):                       # k-th smallest, 1-indexed
    if |A| <= 5: return sort(A)[k - 1]
    medians = []
    for each chunk of 5 in A:
        medians.append(sort(chunk)[len(chunk)//2])
    pivot = select(medians, ceil(|medians| / 2))
    lo, eq, hi = partition3(A, pivot)
    if k <= |lo|:               return select(lo, k)
    if k <= |lo| + |eq|:        return pivot
    return select(hi, k - |lo| - |eq|)
```
Use 3-way (Dutch-flag) partition so equal elements are handled in O(n) without infinite recursion when duplicates dominate. The two recursive calls satisfy T(n) <= T(n/5) + T(7n/10) + O(n), and 1/5 + 7/10 = 9/10 < 1 ⇒ T(n) = O(n).

## complexity
time: O(n) worst-case
space: O(log n) recursion (in-place partition); O(n) if you allocate sub-arrays per call
notes: Constants are large (group sort, median recursion). In practice, introselect (randomized quickselect that switches to BFPRT only when recursion depth exceeds 2·log₂(n)) is faster while preserving the worst-case guarantee.

## pitfalls
- Recursing into both sides instead of one — that is quicksort, not quickselect, and ruins the linear bound.
- Using 2-way partition with duplicates equal to the pivot: degenerates to O(n²) on `[5,5,5,...,5]`. Always 3-way.
- Group size of 3 or 4 destroys the recurrence (3 gives T(n) = T(n/3) + T(2n/3) + O(n) which is Θ(n log n)). Use 5 or 7.
- Mixing 0-indexed `k` and 1-indexed rank — pick one convention and stick to it across the recursion.
- Allocating fresh arrays for `lo`/`hi` blows up space to O(n²). Partition in place with index ranges.

## interviewTips
- State the trade-off: "Randomized quickselect is expected O(n) and simpler. Deterministic BFPRT is worst-case O(n) but with large constants. Use randomized unless adversarial input is in scope."
- Mention `std::nth_element`, Python's `heapq.nsmallest` for small k, and that NumPy's `partition` is a quickselect.
- Be ready to derive the recurrence on the board: groups of 5 ⇒ at least 3·⌈n/10⌉ on one side ⇒ ≤ 7n/10 on the other.
- Follow-up: streaming median is *not* quickselect — that's two heaps. Selection from a static array is quickselect.

## code.python
```python
def select(arr, k):
    a = list(arr)

    def _select(lo, hi, k):
        if hi - lo + 1 <= 5:
            return sorted(a[lo:hi+1])[k]
        pivot = _mom(lo, hi)
        l, r = _partition3(lo, hi, pivot)
        if k < l - lo:
            return _select(lo, l - 1, k)
        if k <= r - lo:
            return pivot
        return _select(r + 1, hi, k - (r - lo + 1))

    def _mom(lo, hi):
        medians = []
        i = lo
        while i <= hi:
            chunk = sorted(a[i:min(i + 5, hi + 1)])
            medians.append(chunk[len(chunk) // 2])
            i += 5
        return _median_of(medians)

    def _median_of(xs):
        if len(xs) == 1:
            return xs[0]
        b = list(xs)
        b.sort()
        return b[len(b) // 2]

    def _partition3(lo, hi, pivot):
        i = lo; j = lo; n = hi
        while j <= n:
            if a[j] < pivot:
                a[i], a[j] = a[j], a[i]; i += 1; j += 1
            elif a[j] > pivot:
                a[j], a[n] = a[n], a[j]; n -= 1
            else:
                j += 1
        return i, n

    return _select(0, len(a) - 1, k)
```

## code.javascript
```javascript
function select(arr, k) {
  const a = arr.slice();

  function _select(lo, hi, k) {
    if (hi - lo + 1 <= 5) {
      return a.slice(lo, hi + 1).sort((x, y) => x - y)[k];
    }
    const pivot = _mom(lo, hi);
    const [l, r] = _partition3(lo, hi, pivot);
    if (k < l - lo) return _select(lo, l - 1, k);
    if (k <= r - lo) return pivot;
    return _select(r + 1, hi, k - (r - lo + 1));
  }

  function _mom(lo, hi) {
    const medians = [];
    for (let i = lo; i <= hi; i += 5) {
      const chunk = a.slice(i, Math.min(i + 5, hi + 1)).sort((x, y) => x - y);
      medians.push(chunk[Math.floor(chunk.length / 2)]);
    }
    medians.sort((x, y) => x - y);
    return medians[Math.floor(medians.length / 2)];
  }

  function _partition3(lo, hi, pivot) {
    let i = lo, j = lo, n = hi;
    while (j <= n) {
      if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; j++; }
      else if (a[j] > pivot) { [a[j], a[n]] = [a[n], a[j]]; n--; }
      else j++;
    }
    return [i, n];
  }

  return _select(0, a.length - 1, k);
}
```

## code.java
```java
import java.util.*;

public int select(int[] arr, int k) {
    int[] a = arr.clone();
    return select(a, 0, a.length - 1, k);
}

private int select(int[] a, int lo, int hi, int k) {
    if (hi - lo + 1 <= 5) {
        int[] s = Arrays.copyOfRange(a, lo, hi + 1);
        Arrays.sort(s);
        return s[k];
    }
    int pivot = mom(a, lo, hi);
    int[] lr = partition3(a, lo, hi, pivot);
    int l = lr[0], r = lr[1];
    if (k < l - lo) return select(a, lo, l - 1, k);
    if (k <= r - lo) return pivot;
    return select(a, r + 1, hi, k - (r - lo + 1));
}

private int mom(int[] a, int lo, int hi) {
    int m = (hi - lo) / 5 + 1;
    int[] medians = new int[m];
    int idx = 0;
    for (int i = lo; i <= hi; i += 5) {
        int end = Math.min(i + 5, hi + 1);
        int[] chunk = Arrays.copyOfRange(a, i, end);
        Arrays.sort(chunk);
        medians[idx++] = chunk[chunk.length / 2];
    }
    int[] med = Arrays.copyOf(medians, idx);
    Arrays.sort(med);
    return med[med.length / 2];
}

private int[] partition3(int[] a, int lo, int hi, int pivot) {
    int i = lo, j = lo, n = hi;
    while (j <= n) {
        if (a[j] < pivot) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; j++; }
        else if (a[j] > pivot) { int t = a[j]; a[j] = a[n]; a[n] = t; n--; }
        else j++;
    }
    return new int[]{i, n};
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

int mom(vector<int>& a, int lo, int hi);
pair<int,int> partition3(vector<int>& a, int lo, int hi, int pivot);

int _select(vector<int>& a, int lo, int hi, int k) {
    if (hi - lo + 1 <= 5) {
        vector<int> s(a.begin() + lo, a.begin() + hi + 1);
        sort(s.begin(), s.end());
        return s[k];
    }
    int pivot = mom(a, lo, hi);
    auto [l, r] = partition3(a, lo, hi, pivot);
    if (k < l - lo) return _select(a, lo, l - 1, k);
    if (k <= r - lo) return pivot;
    return _select(a, r + 1, hi, k - (r - lo + 1));
}

int mom(vector<int>& a, int lo, int hi) {
    vector<int> medians;
    for (int i = lo; i <= hi; i += 5) {
        int end = min(i + 5, hi + 1);
        vector<int> chunk(a.begin() + i, a.begin() + end);
        sort(chunk.begin(), chunk.end());
        medians.push_back(chunk[chunk.size() / 2]);
    }
    sort(medians.begin(), medians.end());
    return medians[medians.size() / 2];
}

pair<int,int> partition3(vector<int>& a, int lo, int hi, int pivot) {
    int i = lo, j = lo, n = hi;
    while (j <= n) {
        if (a[j] < pivot) swap(a[i++], a[j++]);
        else if (a[j] > pivot) swap(a[j], a[n--]);
        else j++;
    }
    return {i, n};
}

int select(vector<int> arr, int k) {
    return _select(arr, 0, (int)arr.size() - 1, k);
}
```
