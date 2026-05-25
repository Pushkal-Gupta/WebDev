---
slug: bubble-sort-algorithm
module: sorting-strings
title: Bubble Sort
subtitle: Repeatedly swap adjacent out-of-order pairs — quadratic, stable, almost never used outside teaching.
difficulty: Beginner
position: 5
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Elementary Sorts"
    url: "https://algs4.cs.princeton.edu/21elementary/"
    type: book
  - title: "GeeksforGeeks — Bubble Sort"
    url: "https://www.geeksforgeeks.org/bubble-sort/"
    type: blog
  - title: "TheAlgorithms/Python — bubble_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/bubble_sort.py"
    type: repo
status: published
---

## intro
Bubble sort sweeps through the array comparing each pair of adjacent elements; if a pair is out of order, it swaps them. After one full pass the largest element has "bubbled" to the last position. After `n` passes the whole array is sorted. The algorithm is the simplest comparison sort to describe, but it does the most swaps per useful comparison of any popular sort. It survives in curricula because the swap-and-bubble metaphor is unforgettable, not because anyone runs it in production.

## whyItMatters
- It is the canonical first-sort taught in every CS curriculum — interviewers expect you to recognise it and dismiss it.
- Its **early-exit** variant (stop when a pass makes no swaps) handles already-sorted input in `O(n)`, demonstrating the value of adaptive algorithms.
- Hardware sorting networks (bitonic / odd-even) build on the same adjacent-compare-and-swap primitive.
- Detecting "the array is nearly sorted" via one pass of bubble sort is a cheap pre-check before a heavier algorithm.

## intuition
After one pass over `a[0..n-1]` the largest element must end up at index `n-1`. Why? Whichever index currently holds the maximum, that element wins every comparison it participates in once the sweep reaches it, so it keeps getting swapped rightward until the pass ends. By the same logic, after the second pass the second-largest element settles at `n-2`. After `k` passes the last `k` positions are correct and sorted.

This invariant lets you shrink the inner loop each pass — there is no point comparing elements past the already-settled suffix. The early-exit refinement adds one more invariant: if a pass performs zero swaps, every adjacent pair is in order, which means the whole array is sorted; return immediately.

The algorithm's cost scales with the number of **inversions** (pairs `i < j` with `a[i] > a[j]`), exactly like insertion sort, because each swap removes one inversion. The worst case is a reverse-sorted array with `n(n-1)/2` inversions, giving `O(n^2)` swaps. Bubble sort is stable as long as the comparison is strict — `a[j] > a[j+1]` — so equal keys never swap past each other.

## visualization
Sort `[5, 1, 4, 2, 8]` with bubble sort. `[brackets]` highlight the pair being compared.

```
pass 1:
   [5, 1] 4  2  8   -> swap   1  [5, 4] 2  8
   1  [5, 4] 2  8   -> swap   1  4  [5, 2] 8
   1  4  [5, 2] 8   -> swap   1  4  2  [5, 8]
   1  4  2  [5, 8]  -> ok     1  4  2  5  8    swaps=3
pass 2:
   [1, 4] 2  5  8   -> ok
   1  [4, 2] 5  8   -> swap   1  2  [4, 5] 8
   1  2  [4, 5] 8   -> ok                    swaps=1
pass 3:
   [1, 2] 4  5  8   -> ok
   1  [2, 4] 5  8   -> ok                    swaps=0  -> early exit
final: 1 2 4 5 8
```

## bruteForce
Without the early-exit, bubble sort always does `n(n-1)/2` comparisons even on sorted input. Selection sort matches that worst case but with far fewer writes (`n - 1` swaps total). Both lose to insertion sort on partially sorted data.

## optimal
Two passes' worth of invariants — shrinking inner loop + early-exit flag.

```python
def bubble_sort(a: list[int]) -> list[int]:
    n = len(a)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped: break
    return a
```

The **cocktail shaker** variant alternates left-to-right and right-to-left passes, which is twice as fast on inputs where small "turtles" sit near the right end (a pure bubble pass moves them only one step per sweep). Use it if you're going to use bubble sort at all — but in practice, insertion sort dominates bubble sort for every workload bubble sort handles well, so reach for insertion first.

## complexity
- **Time**: `O(n^2)` worst and average, `O(n)` best (already sorted, with early-exit).
- **Space**: `O(1)` — sorts in place.
- **Stable**: yes — strict `>` keeps equal keys in input order.
- **Swap count** = number of inversions in the input.

## pitfalls
- **Forgetting the early-exit flag.** Without it, the algorithm wastes the entire `O(n^2)` worst case on already-sorted input. Fix: track `swapped` per pass and break when false.
- **Comparing with `>=` instead of `>`.** Equal keys swap, destroying stability. Fix: use strict `>`.
- **Iterating the inner loop past the settled suffix.** Inner loop must be `j in range(n - 1 - i)`; going further re-touches already-correct elements. Fix: shrink the loop each pass.
- **Picking bubble sort in production.** It is dominated by insertion sort on every realistic workload. Fix: use bubble sort only for teaching, code-golf, or visual demos.

## interviewTips
- Recognise it, name it, and immediately propose insertion sort as the better quadratic alternative — that's the answer interviewers want.
- If asked about adaptivity, mention the early-exit flag and the `O(n)` best case it enables.
- Connect it to inversions and bring up cocktail-shaker if the interviewer presses for improvements.

## code.python
```python
def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped: break
    return a
```

## code.javascript
```javascript
function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}
```

## code.java
```java
public void bubbleSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
```

## code.cpp
```cpp
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) { swap(a[j], a[j + 1]); swapped = true; }
        }
        if (!swapped) break;
    }
}
```
