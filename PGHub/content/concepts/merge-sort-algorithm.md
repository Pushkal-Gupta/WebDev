---
slug: merge-sort-algorithm
module: sorting-strings
title: Merge Sort
subtitle: Stable O(n log n) sort built from divide-and-conquer plus a linear merge.
difficulty: Beginner
position: 2
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Mergesort"
    url: "https://algs4.cs.princeton.edu/22mergesort/"
    type: book
  - title: "cp-algorithms — Sorting"
    url: "https://cp-algorithms.com/"
    type: blog
  - title: "TheAlgorithms/Python — merge_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/merge_sort.py"
    type: repo
status: published
---

## intro
Merge sort cuts an array in half, recursively sorts each half, then merges the two sorted halves into one sorted array. The split is trivially fast; all the work lives in the merge, which scans both halves in tandem and copies the smaller front element into the output. Total work per level is linear, depth is logarithmic, giving the canonical `O(n log n)` worst-case bound — the only general-purpose comparison sort that hits it both deterministically and stably.

## whyItMatters
- It is the default sort behind `Arrays.sort` for objects in Java and the historical `Array.prototype.sort` reference implementation.
- The merge step is the foundation for **external sorting** — sorting files larger than RAM by streaming sorted runs from disk.
- It is the easiest comparison sort to make **stable** (equal keys preserve input order), which matters for multi-key sorts.
- Counting inversions, the closest-pair problem, and several geometric sweeps reuse the merge step.
- It parallelises naturally: each recursive half is independent, so map-reduce frameworks adopt the structure.

## intuition
Two sorted lists are trivially mergeable in linear time: keep a pointer in each, repeatedly emit the smaller head, advance that pointer, repeat. The cost is proportional to the total length, not the product, because every comparison consumes one element.

That linear merge is the only ingredient you need. If you assume — by recursive faith — that you can sort halves of size `n/2`, then sorting the whole costs "sort left + sort right + merge" = `2 T(n/2) + n`. The master theorem gives `T(n) = O(n log n)`. Visually, the recursion forms a balanced binary tree of depth `log n`; at every level the total merge work across all nodes sums to `n` because each element appears in exactly one merge per level.

Two further observations matter. First, merge sort is **stable** as long as you tie-break in favour of the left half during the merge; equal keys then keep their original order. Second, merge sort is **not in-place** — the merge needs an auxiliary buffer of size `n`, which is its biggest cost compared with quicksort.

## visualization
Sort `[5, 2, 8, 1, 9, 3]`.

```
split:   [5, 2, 8, 1, 9, 3]
         /                 \
     [5, 2, 8]          [1, 9, 3]
      /     \             /     \
   [5]   [2, 8]        [1]   [9, 3]
          / \                 / \
        [2] [8]             [9] [3]

merge upward:
   [2, 8]    [3, 9]
   [2, 5, 8] [1, 3, 9]

final merge of [2, 5, 8] and [1, 3, 9]:
   L=[2,5,8] R=[1,3,9]  out=[]      compare 2 vs 1 -> 1
   L=[2,5,8] R=[3,9]    out=[1]     compare 2 vs 3 -> 2
   L=[5,8]   R=[3,9]    out=[1,2]   compare 5 vs 3 -> 3
   L=[5,8]   R=[9]      out=[1,2,3] compare 5 vs 9 -> 5
   L=[8]     R=[9]      out=[1,2,3,5] -> 8
   L=[]      R=[9]      append rest -> [1,2,3,5,8,9]
```

## bruteForce
Insertion or selection sort runs `O(n^2)` — fine for `n < 50`, painful for `n = 10^5`. Bubble sort is similar. None of these scale; merge sort overtakes them well before `n = 1000`.

## optimal
Top-down, recursive, stable.

```python
def merge_sort(a: list[int]) -> list[int]:
    if len(a) <= 1: return a
    mid = len(a) // 2
    left = merge_sort(a[:mid])
    right = merge_sort(a[mid:])
    return merge(left, right)

def merge(L, R):
    out, i, j = [], 0, 0
    while i < len(L) and j < len(R):
        if L[i] <= R[j]:        # `<=` keeps the sort stable
            out.append(L[i]); i += 1
        else:
            out.append(R[j]); j += 1
    out.extend(L[i:])
    out.extend(R[j:])
    return out
```

For large `n`, the **bottom-up** variant avoids recursion overhead: start with runs of size 1, merge into size-2 runs, then 4, 8, ..., doubling until one run remains. The bottom-up form is also the basis of `Timsort` (Python's default), which detects pre-sorted runs and merges them, giving `O(n)` on already-sorted input.

## complexity
- **Time**: `O(n log n)` worst, average, and best — every level merges `n` elements and there are `log n` levels.
- **Space**: `O(n)` auxiliary buffer for the merge plus `O(log n)` recursion stack.
- **Stable**: yes, when ties go to the left half.

## pitfalls
- **Strict less-than during merge.** Writing `L[i] < R[j]` instead of `<=` destroys stability. Fix: always use `<=` and put the left list first.
- **Allocating inside the merge loop.** Repeated `out.append` is fine in Python but in C++ / Java pre-size the buffer to avoid reallocation. Fix: pre-allocate `vector<int> out; out.reserve(L.size() + R.size());`.
- **Recursion on huge arrays.** Stack depth is `log n` ≈ 30 for `n = 10^9` — safe — but copying sublists per call (Python `a[:mid]`) is `O(n log n)` extra memory. Fix: pass `lo, hi` indices and merge into a shared buffer.
- **Forgetting to copy the tail.** Both `extend(L[i:])` and `extend(R[j:])` are needed; omitting one drops elements. Fix: write both lines together as one habit.

## interviewTips
- State the recurrence `T(n) = 2 T(n/2) + n` and apply the master theorem to justify `O(n log n)`.
- Highlight stability up front — it's the differentiator versus quicksort.
- Be ready to switch to **bottom-up** merging when asked about external sorting or linked-list sorting (no random access, no extra buffer needed for the merge).

## code.python
```python
def merge_sort(a):
    if len(a) <= 1: return list(a)
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out
```

## code.javascript
```javascript
function mergeSort(a) {
  if (a.length <= 1) return a.slice();
  const mid = a.length >> 1;
  const L = mergeSort(a.slice(0, mid));
  const R = mergeSort(a.slice(mid));
  const out = []; let i = 0, j = 0;
  while (i < L.length && j < R.length) {
    if (L[i] <= R[j]) out.push(L[i++]); else out.push(R[j++]);
  }
  while (i < L.length) out.push(L[i++]);
  while (j < R.length) out.push(R[j++]);
  return out;
}
```

## code.java
```java
public int[] mergeSort(int[] a) {
    if (a.length <= 1) return a.clone();
    int mid = a.length / 2;
    int[] L = mergeSort(Arrays.copyOfRange(a, 0, mid));
    int[] R = mergeSort(Arrays.copyOfRange(a, mid, a.length));
    int[] out = new int[a.length];
    int i = 0, j = 0, k = 0;
    while (i < L.length && j < R.length)
        out[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];
    while (i < L.length) out[k++] = L[i++];
    while (j < R.length) out[k++] = R[j++];
    return out;
}
```

## code.cpp
```cpp
vector<int> mergeSort(vector<int> a) {
    if (a.size() <= 1) return a;
    int mid = a.size() / 2;
    vector<int> L = mergeSort(vector<int>(a.begin(), a.begin() + mid));
    vector<int> R = mergeSort(vector<int>(a.begin() + mid, a.end()));
    vector<int> out; out.reserve(a.size());
    size_t i = 0, j = 0;
    while (i < L.size() && j < R.size())
        out.push_back(L[i] <= R[j] ? L[i++] : R[j++]);
    while (i < L.size()) out.push_back(L[i++]);
    while (j < R.size()) out.push_back(R[j++]);
    return out;
}
```
