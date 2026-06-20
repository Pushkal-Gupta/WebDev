---
slug: insertion-sort-algorithm
module: sorting-strings
title: Insertion Sort
subtitle: Grow a sorted prefix one element at a time — O(n^2) worst, O(n) best, the fastest sort on tiny or nearly-sorted arrays.
difficulty: Beginner
position: 4
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Elementary Sorts"
    url: "https://algs4.cs.princeton.edu/21elementary/"
    type: book
  - title: "cp-algorithms — Sortings"
    url: "https://cp-algorithms.com/"
    type: blog
  - title: "TheAlgorithms/Python — insertion_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/insertion_sort.py"
    type: repo
status: published
---

## intro
Insertion sort keeps a **sorted prefix** at the front of the array and grows it by one element per pass. To extend the prefix it takes the next unsorted element, walks it leftward, and shifts larger elements right until the new element sits in its correct spot. After `n` passes the entire array is sorted. The algorithm is in place, stable, online (handles streaming input), and runs in `O(n)` on already-sorted data — properties that no general-purpose sort matches simultaneously.

## whyItMatters
- It is the inner-loop fallback inside **Timsort**, **introsort**, and most production hybrid sorts when sub-arrays drop below ~16 elements; constant factors beat quicksort there.
- **Online sorting** — items arrive one at a time and must always be sorted (e.g. priority dashboards) — is natural in insertion sort because each new element costs only the shift it needs.
- It teaches the **loop-invariant** style of correctness proof: "after iteration k, `a[0..k]` is sorted" — exactly how CLRS introduces algorithm analysis.
- For nearly-sorted arrays (k inversions) it runs in `O(n + k)`, beating asymptotically faster sorts.

## intuition
Imagine sorting a hand of playing cards. You hold a sorted fan and you pick up a new card; you slide it leftward through the fan until the card to its left is smaller. Every other card stays where it was — you only touched the ones the new card had to pass.

The same idea applies to an array. The prefix `a[0..i-1]` is the sorted fan; `a[i]` is the new card. You compare `a[i]` to `a[i-1]`, and as long as `a[i-1]` is larger you swap them, effectively shifting the larger element one slot right. You stop when you hit something smaller (or fall off the front). After the inner loop, `a[0..i]` is sorted.

Two consequences fall out of this picture. First, an already-sorted array does **zero** swaps — the inner loop exits immediately on the first comparison — giving the `O(n)` best case. Second, on a reverse-sorted array every new element must travel all the way to index 0, doing `n - 1` shifts in the worst pass; summing gives `O(n^2)`. Real-world data sits between these extremes, and the algorithm's cost scales linearly with the **number of inversions** in the input.

## visualization
Sort `[5, 2, 4, 6, 1, 3]`.

```
start:     | 5 | 2  4  6  1  3       prefix = [5]
i=1 take 2: insert 2 left of 5
           | 2  5 | 4  6  1  3       prefix = [2, 5]
i=2 take 4: shift 5 right, insert 4
           | 2  4  5 | 6  1  3       prefix = [2, 4, 5]
i=3 take 6: already >= 5, stop
           | 2  4  5  6 | 1  3       prefix = [2, 4, 5, 6]
i=4 take 1: shift 6,5,4,2 right, insert 1
           | 1  2  4  5  6 | 3       prefix = [1, 2, 4, 5, 6]
i=5 take 3: shift 6,5,4 right, insert 3
           | 1  2  3  4  5  6 |      sorted
```

## bruteForce
Selection sort runs in the same `O(n^2)` worst case but always does the full quadratic number of comparisons, regardless of input. Bubble sort matches the asymptotic but performs roughly twice as many writes per pass. Both lose to insertion sort on partially sorted data.

## optimal
Two nested loops, in place, stable.

```python
def insertion_sort(a: list[int]) -> list[int]:
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]     # shift right
            j -= 1
        a[j + 1] = key          # drop key into its slot
    return a
```

Two refinements matter:
- **Binary insertion sort** uses binary search to locate the insertion point in `O(log i)` per pass, but the shift cost is still linear, so the overall bound stays `O(n^2)`. It helps when comparisons are far more expensive than moves (e.g. comparing long strings).
- **Shell sort** generalises insertion sort by sorting elements that are `h` positions apart for a decreasing sequence of `h`, ending at `h = 1`. With a good gap sequence it runs in `O(n^{1.3})` on average — a free upgrade with one extra loop.

Use insertion sort directly when `n < ~16` or when the input is known to be nearly sorted; in all other cases, hand off to a hybrid sort that uses it only at the leaves.

## complexity
- **Time**: `O(n^2)` worst and average, `O(n)` best (already sorted).
- **Space**: `O(1)` — sorts in place.
- **Stable**: yes — strict `>` in the comparison keeps equal keys' order.
- **Comparisons** equal the number of inversions plus `n - 1`.

## pitfalls
- **Using `>=` in the inner loop.** That breaks stability — equal keys pass each other. Fix: write `a[j] > key` (strict).
- **Forgetting the off-by-one when placing the key.** After the loop, `j` points one slot *left* of where the key belongs. Fix: insert at `j + 1`, not `j`.
- **Shifting before saving the key.** Without `key = a[i]`, the assignment `a[j + 1] = a[j]` overwrites the value you were trying to insert. Fix: stash `key` first.
- **Believing it scales.** Past `n ≈ 5000` insertion sort gets crushed by `O(n log n)` sorts. Fix: use it as a small-array inner sort, not the top-level algorithm.

## interviewTips
- Lead with the loop invariant — "`a[0..i]` is sorted after iteration `i`" — and you have most of the correctness proof for free.
- Call out the `O(n)` best case and the inversion-count relationship; these are the textbook follow-up questions.
- Mention that hybrid sorts use it for small sub-arrays — that's the most common production usage.

## code.python
```python
def insertion_sort(a):
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]; j -= 1
        a[j + 1] = key
    return a
```

## code.javascript
```javascript
function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; let j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return a;
}
```

## code.java
```java
public void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
        a[j + 1] = key;
    }
}
```

## code.cpp
```cpp
void insertionSort(vector<int>& a) {
    for (size_t i = 1; i < a.size(); i++) {
        int key = a[i];
        int j = (int)i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
        a[j + 1] = key;
    }
}
```
