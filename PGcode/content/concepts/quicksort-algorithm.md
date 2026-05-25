---
slug: quicksort-algorithm
module: sorting-strings
title: Quicksort
subtitle: Pivot-and-partition divide-and-conquer — fast in practice, O(n log n) expected, O(n^2) worst.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Quicksort"
    url: "https://algs4.cs.princeton.edu/23quicksort/"
    type: book
  - title: "cp-algorithms — Sorting"
    url: "https://cp-algorithms.com/"
    type: blog
  - title: "TheAlgorithms/Python — quick_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/quick_sort.py"
    type: repo
status: published
---

## intro
Quicksort picks one element as a **pivot**, partitions the rest so everything smaller sits left and everything larger sits right, then recurses on both sides. The partition runs in linear time and rearranges in place, so quicksort needs no auxiliary array. Expected runtime is `O(n log n)` and the constants are the smallest of any comparison sort — which is why almost every language's built-in sort uses some quicksort variant for primitive arrays.

## whyItMatters
- C's `qsort`, C++'s `std::sort` (introsort), and Java's primitive `Arrays.sort` (dual-pivot quicksort) all build on it.
- Its partition step solves **quickselect** — finding the k-th smallest in expected `O(n)`.
- It is the canonical case study for randomised algorithms and amortised analysis.
- Cache behaviour is excellent because partitioning touches contiguous memory; merge sort's cache profile is worse.
- The technique generalises to multi-way (Bentley-McIlroy three-way) and parallel variants.

## intuition
A sorted array has a simple property: pick any element, send everything smaller to its left and everything larger to its right, and that element is in its final position. Partition once and you've fixed exactly one slot; recurse on the two unsorted sides and the whole array becomes sorted.

The pivot choice decides the recursion shape. A pivot near the median splits the array into roughly equal halves, giving a balanced tree of depth `log n` and `T(n) = 2 T(n/2) + n = O(n log n)`. A pivot at the extreme (smallest or largest) sends `n-1` elements to one side, giving `T(n) = T(n-1) + n = O(n^2)`. Worst case is hit by sorted input under the naive "always pivot on the first element" strategy.

Three defences make worst case essentially unreachable:
1. **Randomise the pivot** — pick a random index instead of a fixed position.
2. **Median-of-three** — sample first, middle, last and pivot on their median.
3. **Three-way partition** (Dutch national flag) — handles arrays with many duplicates in linear time per recursion level instead of degenerating.

Production quicksorts (introsort) also fall back to heap sort once the recursion exceeds `2 log n`, guaranteeing `O(n log n)` worst case.

## visualization
Sort `[8, 3, 1, 7, 0, 10, 2]` with Lomuto partition, pivot = last element.

```
initial:   [8, 3, 1, 7, 0, 10, 2]   pivot = 2
scan idx:   i=-1, j scans 0..5
  j=0 a[j]=8 > 2  -> skip
  j=1 a[j]=3 > 2  -> skip
  j=2 a[j]=1 < 2  -> i=0, swap a[0],a[2] -> [1, 3, 8, 7, 0, 10, 2]
  j=3 a[j]=7 > 2  -> skip
  j=4 a[j]=0 < 2  -> i=1, swap a[1],a[4] -> [1, 0, 8, 7, 3, 10, 2]
  j=5 a[j]=10> 2  -> skip
swap pivot in:    a[i+1]=a[2] with a[end] -> [1, 0, 2, 7, 3, 10, 8]
                                ^ pivot in final slot
recurse left  [1, 0]         -> [0, 1]
recurse right [7, 3, 10, 8]  -> [3, 7, 8, 10]
combined:                       [0, 1, 2, 3, 7, 8, 10]
```

## bruteForce
Selection sort or bubble sort run in `O(n^2)` on every input. They are simpler to implement than quicksort but cripplingly slow once `n` passes a few thousand.

## optimal
Lomuto partition is the simplest correct form; Hoare partition is faster in practice.

```python
import random

def quicksort(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return
    p = partition(a, lo, hi)
    quicksort(a, lo, p - 1)
    quicksort(a, p + 1, hi)

def partition(a, lo, hi):
    pivot_idx = random.randint(lo, hi)
    a[pivot_idx], a[hi] = a[hi], a[pivot_idx]
    pivot = a[hi]
    i = lo - 1
    for j in range(lo, hi):
        if a[j] <= pivot:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[hi] = a[hi], a[i + 1]
    return i + 1
```

**Three-way partition** (Dijkstra) handles duplicates: maintain `lt`, `i`, `gt` so `a[lo..lt-1] < pivot`, `a[lt..i-1] == pivot`, `a[gt+1..hi] > pivot`. Recurse only on the strict-less and strict-greater partitions. On all-equal input it runs in `O(n)` because the equals band swallows everything.

**Tail-call elimination**: always recurse on the smaller partition and loop on the larger. Stack depth then stays `O(log n)` even when partitions are unbalanced.

## complexity
- **Time**: `O(n log n)` expected with random pivots; `O(n^2)` worst case with adversarial input and a deterministic pivot.
- **Space**: `O(log n)` recursion stack with the smaller-partition-first trick.
- **In place**: yes; only swaps and `O(1)` extra per call.
- **Stable**: no — partition shuffles equal keys.

## pitfalls
- **Always-first or always-last pivot.** Already-sorted input degrades to `O(n^2)`. Fix: randomise the pivot index or use median-of-three.
- **Recursion blow-up on unbalanced splits.** Plain recursion can hit `O(n)` stack depth. Fix: recurse on the smaller side, iterate on the larger.
- **Many duplicates with two-way partition.** All equals pile into one side, giving `O(n^2)`. Fix: switch to three-way partition when duplicates are expected.
- **Off-by-one in the partition loop.** Lomuto's `i = lo - 1` and Hoare's mid-array swaps are easy to misremember. Fix: pick one variant and memorise its invariant rather than alternating.

## interviewTips
- State expected vs worst case explicitly — interviewers often grade on the distinction.
- Mention randomisation, median-of-three, and three-way partition as worst-case defences without prompting.
- If asked about k-th smallest, pivot to **quickselect** — same partition, recurse on only one side, expected `O(n)`.

## code.python
```python
import random
def quicksort(a):
    def sort(lo, hi):
        while lo < hi:
            p = partition(lo, hi)
            if p - lo < hi - p:
                sort(lo, p - 1); lo = p + 1
            else:
                sort(p + 1, hi); hi = p - 1
    def partition(lo, hi):
        k = random.randint(lo, hi)
        a[k], a[hi] = a[hi], a[k]
        pivot, i = a[hi], lo - 1
        for j in range(lo, hi):
            if a[j] <= pivot:
                i += 1; a[i], a[j] = a[j], a[i]
        a[i + 1], a[hi] = a[hi], a[i + 1]
        return i + 1
    sort(0, len(a) - 1)
    return a
```

## code.javascript
```javascript
function quicksort(a, lo = 0, hi = a.length - 1) {
  while (lo < hi) {
    const k = lo + Math.floor(Math.random() * (hi - lo + 1));
    [a[k], a[hi]] = [a[hi], a[k]];
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j] <= pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    const p = i + 1;
    if (p - lo < hi - p) { quicksort(a, lo, p - 1); lo = p + 1; }
    else { quicksort(a, p + 1, hi); hi = p - 1; }
  }
  return a;
}
```

## code.java
```java
import java.util.Random;
static Random rng = new Random();
public void quicksort(int[] a, int lo, int hi) {
    while (lo < hi) {
        int k = lo + rng.nextInt(hi - lo + 1);
        int tmp = a[k]; a[k] = a[hi]; a[hi] = tmp;
        int pivot = a[hi], i = lo - 1;
        for (int j = lo; j < hi; j++)
            if (a[j] <= pivot) { i++; int t = a[i]; a[i] = a[j]; a[j] = t; }
        int t = a[i + 1]; a[i + 1] = a[hi]; a[hi] = t;
        int p = i + 1;
        if (p - lo < hi - p) { quicksort(a, lo, p - 1); lo = p + 1; }
        else { quicksort(a, p + 1, hi); hi = p - 1; }
    }
}
```

## code.cpp
```cpp
void quicksort(vector<int>& a, int lo, int hi) {
    while (lo < hi) {
        int k = lo + rand() % (hi - lo + 1);
        swap(a[k], a[hi]);
        int pivot = a[hi], i = lo - 1;
        for (int j = lo; j < hi; j++)
            if (a[j] <= pivot) swap(a[++i], a[j]);
        swap(a[i + 1], a[hi]);
        int p = i + 1;
        if (p - lo < hi - p) { quicksort(a, lo, p - 1); lo = p + 1; }
        else { quicksort(a, p + 1, hi); hi = p - 1; }
    }
}
```
