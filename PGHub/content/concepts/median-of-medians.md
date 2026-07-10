---
slug: median-of-medians
module: arrays-counting-select
title: Median of Medians (Deterministic Linear Selection)
subtitle: Find the k-th smallest element in O(n) worst case — Quickselect with a guaranteed-good pivot.
difficulty: Advanced
position: 28
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 9.3 — Selection in worst-case linear time (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap09/9.3/"
    type: book
  - title: "GeeksforGeeks — Median of medians (k-th smallest)"
    url: "https://www.geeksforgeeks.org/kth-smallestlargest-element-unsorted-array-set-3-worst-case-linear-time/"
    type: blog
  - title: "TheAlgorithms/Python — searches"
    url: "https://github.com/TheAlgorithms/Python/tree/master/searches"
    type: repo
status: published
---

## intro
**Quickselect** finds the k-th smallest in expected O(n) but worst-case O(n²) — the same input that kills quicksort. **Median of medians** chooses the pivot deterministically so the partition is always reasonably balanced, giving **O(n) worst-case** selection. Beautiful algorithm; rarely used in practice because Quickselect's average case is faster.

## whyItMatters
The classical "selection in linear time" result. Comes up in algorithms courses, theoretical interviews, and proofs of more advanced algorithms (e.g., **deterministic linear-time selection** is used inside fast pattern-matching and graph algorithms).

In practice, Quickselect + random pivot is preferred (expected O(n), simpler). Median of medians is the right answer to "find k-th smallest in O(n) WORST case."

## intuition
Quickselect's worst case happens because the pivot might be near the min or max — leaving an unbalanced partition. The trick: split the array into groups of 5, find the median of each group, then **recursively find the median of those medians**. That value is guaranteed to be greater than 30% of the array and less than 30% — so partitioning by it discards at least 30% per recursive call.

The physical picture that makes the guarantee obvious: **lay the n/5 groups out as columns, each column sorted top-to-bottom, and slide the columns so their medians line up in a single row.** Now sort the columns left-to-right by their median value. The median-of-medians `p` sits at the center of that row. Everything in the upper-left quadrant — the top half of each column to the left of `p`'s column — is `<= p`, and everything in the lower-right quadrant is `>= p`. Each quadrant is about half the columns times three of the five rows, so roughly `3/10` of the array is guaranteed to land on each side of `p`. That geometric block is where the "30%" comes from; it is not an average, it is a floor that holds on every input, which is exactly why the worst case disappears.

What's actually happening before any formula: you are spending linear work to *buy a provably non-terrible pivot*, then partitioning once and throwing away a constant fraction. Trace `select` on `[12, 3, 5, 7, 4, 19, 26, 23, 2, 1, 8, 24, 0]` for the 5th smallest. Groups of five give medians `5`, `19`, and `8`; the median of `[5, 19, 8]` is `8`, so `p = 8`. Partitioning the original array around `8` puts `[3,5,7,4,2,1,0]` (7 elements) on the left and `[19,26,23,24,12]` on the right, with `8` itself at index 7. Since the target rank `4` (0-based) is less than 7, the answer lives in the left part and we recurse only there — the entire right half is gone in one step. The recurrence `T(n) <= T(n/5) + T(7n/10) + O(n)` captures the two costs: `T(n/5)` to find the pivot from the medians, `T(7n/10)` for the worst surviving side. Because `1/5 + 7/10 = 9/10 < 1`, the work per level shrinks geometrically and the total sums to O(n) (the master theorem doesn't directly apply, but the constants work out).

## visualization
```
Find 5th smallest in [12, 3, 5, 7, 4, 19, 26, 23, 2, 1, 8, 24, 0]

Step 1: split into groups of 5
  G1: [12, 3, 5, 7, 4]   → sorted [3, 4, 5, 7, 12]   → median 5
  G2: [19, 26, 23, 2, 1] → sorted [1, 2, 19, 23, 26] → median 19
  G3: [8, 24, 0]         → sorted [0, 8, 24]         → median 8

Medians: [5, 19, 8]
Recursively find median of medians → 8.

Partition the original array around pivot 8:
  Left of pivot: [3, 5, 7, 4, 2, 1, 0]   (7 elements)
  Pivot index: 7
  Right: [19, 26, 23, 24, 12]

Looking for 5th smallest. 4 < 7? Recurse on left.
```

## bruteForce
Sort + index: O(n log n). Fine for most purposes; loses to selection asymptotically.

## optimal
**Median of medians** (deterministic O(n)):
```
def select(arr, k):
    if len(arr) <= 5:
        return sorted(arr)[k]
    # 1. Split into groups of 5, find median of each.
    medians = [sorted(arr[i:i+5])[(min(5, len(arr) - i) - 1) // 2]
               for i in range(0, len(arr), 5)]
    # 2. Recursively find the median of medians.
    pivot = select(medians, len(medians) // 2)
    # 3. Partition around pivot.
    lo = [x for x in arr if x < pivot]
    eq = [x for x in arr if x == pivot]
    hi = [x for x in arr if x > pivot]
    if k < len(lo): return select(lo, k)
    if k < len(lo) + len(eq): return pivot
    return select(hi, k - len(lo) - len(eq))
```

**In-place partition** with median of medians is more code but the same asymptotic. Practical libraries use **introselect** (Quickselect with a Heapselect fallback after too many bad pivots — gives O(n) worst case with Quickselect's average constant).

**Why it's correct.** Correctness rests on two independent facts. First, the partition step is the same one that makes Quickselect correct: after splitting into `lo < pivot`, `eq == pivot`, `hi > pivot`, the target rank `k` deterministically falls into exactly one bucket — if `k < len(lo)` the answer is the k-th of `lo`; if `k` lands inside the `eq` span the pivot *is* the answer; otherwise it is the `(k - len(lo) - len(eq))`-th of `hi`. No element is ever misfiled because the three buckets are disjoint and cover the array. Second, and this is what upgrades the bound from expected to worst-case, the pivot chosen by median-of-medians is never pathological: the "30% guarantee" means `len(lo)` and `len(hi)` are each at most about `7n/10`, so the surviving side is a bounded fraction smaller — the recursion cannot be tricked into peeling off one element at a time the way a min/max pivot would.

**The mechanism, step by step.** Base-case any array of size `<= 5` by sorting. Otherwise: (1) chop into groups of 5 and take each group's median, forming a medians array of size `n/5`; (2) recurse on that array to get its median — the pivot; (3) three-way partition the original array around the pivot; (4) compare `k` to the bucket sizes and recurse into the single bucket that contains rank `k`. The **central tradeoff** is a large constant factor for an ironclad guarantee: you do genuine extra work — a full recursive selection just to pick the pivot — on every call, which is why median-of-medians is typically 5–10x slower than random-pivot Quickselect on ordinary inputs, and why production code prefers introselect. **Complexity intuition:** the bound `T(n) <= T(n/5) + T(7n/10) + O(n)` holds because step 1 is linear, the pivot recursion runs on `n/5` elements, and the surviving partition side is at most `7n/10` elements thanks to the 30% floor; since `n/5 + 7n/10 = 9n/10`, each level's subproblems total a `9/10` fraction of the previous level, and a geometric series with ratio `9/10` sums to a constant multiple of the linear top-level work — hence O(n).

## complexity
- **Time**: O(n) worst case.
- **Space**: O(log n) recursion depth on the median array; O(n) for the partition arrays unless in-place.
- **Constant**: large. About 5-10× slower than Quickselect on average inputs.

## pitfalls
- **Group size matters**: groups of 3 are too small (T(n) = T(n/3) + T(2n/3) + O(n) doesn't give linear). Groups of 5 work. Groups of 7 also work but have worse constants.
- **Forgetting equality handling**: `arr[i] == pivot` items shouldn't go to either `lo` or `hi`. Maintain three buckets or use a careful partition.
- **Confusing with Quickselect**: same partition step, different pivot selection. Use random pivot for the practical version.
- **Not actually faster in practice**: don't use median-of-medians for production selection unless adversarial inputs are likely.

## interviewTips
- The trigger: "k-th smallest in worst-case linear time." Median of medians.
- Walk through the "30% guarantee" argument — interviewers love the proof sketch.
- Always compare with **Quickselect** (expected O(n), worst O(n²)) and **heap-select** (O(n + k log n) via min-heap).
- For senior interviews, mention **introselect** as the production-quality compromise.

## code.python
```python
def median_of_medians(arr, k):
    if len(arr) <= 5: return sorted(arr)[k]
    medians = [sorted(arr[i:i+5])[(min(5, len(arr)-i) - 1) // 2]
               for i in range(0, len(arr), 5)]
    pivot = median_of_medians(medians, len(medians) // 2)
    lo = [x for x in arr if x < pivot]
    eq = [x for x in arr if x == pivot]
    hi = [x for x in arr if x > pivot]
    if k < len(lo): return median_of_medians(lo, k)
    if k < len(lo) + len(eq): return pivot
    return median_of_medians(hi, k - len(lo) - len(eq))

print(median_of_medians([12, 3, 5, 7, 4, 19, 26, 23, 2, 1, 8, 24, 0], 5))  # 5
```

## code.javascript
```javascript
function medianOfMedians(arr, k) {
  if (arr.length <= 5) return arr.slice().sort((a, b) => a - b)[k];
  const medians = [];
  for (let i = 0; i < arr.length; i += 5) {
    const g = arr.slice(i, i + 5).sort((a, b) => a - b);
    medians.push(g[Math.floor((g.length - 1) / 2)]);
  }
  const pivot = medianOfMedians(medians, Math.floor(medians.length / 2));
  const lo = arr.filter(x => x < pivot);
  const eq = arr.filter(x => x === pivot);
  const hi = arr.filter(x => x > pivot);
  if (k < lo.length) return medianOfMedians(lo, k);
  if (k < lo.length + eq.length) return pivot;
  return medianOfMedians(hi, k - lo.length - eq.length);
}
```

## code.java
```java
import java.util.*;
class MedianOfMedians {
    public int select(int[] arr, int k) {
        if (arr.length <= 5) { int[] s = arr.clone(); Arrays.sort(s); return s[k]; }
        int[] medians = new int[(arr.length + 4) / 5];
        for (int i = 0; i < arr.length; i += 5) {
            int[] g = Arrays.copyOfRange(arr, i, Math.min(arr.length, i + 5));
            Arrays.sort(g);
            medians[i / 5] = g[(g.length - 1) / 2];
        }
        int pivot = select(medians, medians.length / 2);
        int loN = 0, eqN = 0, hiN = 0;
        for (int x : arr) { if (x < pivot) loN++; else if (x == pivot) eqN++; else hiN++; }
        int[] lo = new int[loN], hi = new int[hiN];
        int iLo = 0, iHi = 0;
        for (int x : arr) { if (x < pivot) lo[iLo++] = x; else if (x > pivot) hi[iHi++] = x; }
        if (k < loN) return select(lo, k);
        if (k < loN + eqN) return pivot;
        return select(hi, k - loN - eqN);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
int medianOfMedians(std::vector<int> arr, int k) {
    if ((int) arr.size() <= 5) { std::sort(arr.begin(), arr.end()); return arr[k]; }
    std::vector<int> medians;
    for (size_t i = 0; i < arr.size(); i += 5) {
        std::vector<int> g(arr.begin() + i, arr.begin() + std::min(arr.size(), i + 5));
        std::sort(g.begin(), g.end());
        medians.push_back(g[(g.size() - 1) / 2]);
    }
    int pivot = medianOfMedians(medians, medians.size() / 2);
    std::vector<int> lo, eq, hi;
    for (int x : arr) { if (x < pivot) lo.push_back(x); else if (x == pivot) eq.push_back(x); else hi.push_back(x); }
    if (k < (int) lo.size()) return medianOfMedians(lo, k);
    if (k < (int) (lo.size() + eq.size())) return pivot;
    return medianOfMedians(hi, k - lo.size() - eq.size());
}
```
