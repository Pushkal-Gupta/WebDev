---
slug: selection-sort-algorithm
module: sorting-strings
title: Selection Sort
subtitle: Find the minimum, swap it to the front, repeat — O(n^2) with the fewest writes of any comparison sort.
difficulty: Beginner
position: 6
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Elementary Sorts"
    url: "https://algs4.cs.princeton.edu/21elementary/"
    type: book
  - title: "GeeksforGeeks — Selection Sort"
    url: "https://www.geeksforgeeks.org/selection-sort/"
    type: blog
  - title: "TheAlgorithms/Python — selection_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/selection_sort.py"
    type: repo
status: published
---

## intro
Selection sort makes one pass over the unsorted suffix to find the smallest element, then swaps it into the first unsorted position. Repeat with the next suffix, and so on. After `n - 1` passes the array is sorted. The number of comparisons is always `n(n-1)/2` — the input doesn't matter — but the number of **writes** is only `n - 1` swaps, which is the fewest of any general-purpose sort. That property alone makes it useful when writes are expensive (flash storage, EEPROM).

## whyItMatters
- It minimises **write count**, which is the binding cost on flash, EEPROM, and write-amplified storage.
- It is the cleanest demonstration of the "find-and-swap" pattern that recurs in heap sort, quickselect, and tournament sort.
- It is **not stable** in its naive form — a useful counter-example for teaching what stability means and how to fix it.
- It pairs naturally with **partial sorting**: stop after `k` passes and you have the smallest `k` elements in order, in `O(n k)`.

## intuition
In a sorted array, position 0 holds the smallest element, position 1 holds the second smallest, and so on. Selection sort enforces that property one position at a time. To place the correct element at position 0, scan the entire array, remember the index of the minimum, and swap it into position 0. To place the correct element at position 1, scan `a[1..n-1]`, swap the minimum into position 1. Repeat.

This is the inverse of bubble sort. Bubble sort "pushes" the largest right; selection sort "pulls" the smallest left. The selection version does linearly many writes (one swap per pass) while bubble may do quadratic writes, which is why selection sort wins when writes dominate runtime.

The algorithm is **not adaptive** — already-sorted input still costs `O(n^2)` comparisons because the inner loop has to confirm that the current position is in fact the minimum. It is also **not stable** by default: if two equal keys exist and the minimum on the right is one of them, the swap can leapfrog the equal key on the left, reversing their order. A stable variant shifts elements one slot instead of swapping, which buys stability at the cost of more writes — defeating the algorithm's main strength.

## visualization
Sort `[64, 25, 12, 22, 11]`.

```
pass 0: scan [64, 25, 12, 22, 11]      min = 11 at idx 4
        swap a[0] <-> a[4]
        -> [11, 25, 12, 22, 64]

pass 1: scan      [25, 12, 22, 64]     min = 12 at idx 2
        swap a[1] <-> a[2]
        -> [11, 12, 25, 22, 64]

pass 2: scan          [25, 22, 64]     min = 22 at idx 3
        swap a[2] <-> a[3]
        -> [11, 12, 22, 25, 64]

pass 3: scan              [25, 64]     min = 25 at idx 3 (already there)
        no swap needed
        -> [11, 12, 22, 25, 64]

result: 11 12 22 25 64    swaps = 3
```

## bruteForce
Bubble sort makes the same number of comparisons but typically many more writes; insertion sort beats both on nearly-sorted data because it short-circuits the inner loop. Selection sort's only quantitative win over the other quadratic sorts is its write count.

## optimal
Two nested loops, one swap per pass.

```python
def selection_sort(a: list[int]) -> list[int]:
    n = len(a)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if a[j] < a[min_idx]:
                min_idx = j
        if min_idx != i:
            a[i], a[min_idx] = a[min_idx], a[i]
    return a
```

For a **stable** variant, replace the swap with a rotate-left of `a[i..min_idx]` so the picked minimum slides into position 0 while every other element shifts right by one. That preserves equal-key order but multiplies the write count by up to `n`, which kills the algorithm's only advantage. Better choice: pick a different stable sort.

**Tournament sort** generalises selection: build a comparison tree of `n` leaves, the root is the overall minimum, and after extracting it you replay only the path from the freed leaf to the root in `O(log n)`. Total cost `O(n log n)` — the same shape as heap sort, which is essentially "selection sort over a heap-organised priority queue".

## complexity
- **Time**: `O(n^2)` always — best, average, and worst case identical.
- **Space**: `O(1)` — sorts in place.
- **Stable**: no (naive); yes with shifts, but then `O(n^2)` writes.
- **Comparisons**: `n(n-1)/2`. **Swaps**: at most `n - 1`.

## pitfalls
- **Swapping when `min_idx == i`.** That is a redundant write — fine for correctness, but wasted on write-bound media. Fix: check `if min_idx != i` before swapping.
- **Assuming stability.** Selection sort is not stable by default; do not pick it for multi-key sorts. Fix: switch to insertion sort or merge sort.
- **Re-scanning settled positions.** Inner loop must start at `i + 1`. Fix: tight loop bounds; double-check after every refactor.
- **Confusing it with insertion sort.** Both grow a sorted prefix, but selection sort finds the minimum of the suffix while insertion sort places the next element correctly inside the prefix. Fix: memorise "selection looks right, insertion looks left".

## interviewTips
- Lead with "fewest writes of any comparison sort" — interviewers grade on knowing the niche.
- Be explicit that comparisons are `n(n-1)/2` regardless of input, distinguishing it from insertion sort's adaptive `O(n)` best case.
- If asked to make it stable, describe the shift-instead-of-swap approach and immediately note the `O(n^2)` write penalty.

## code.python
```python
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):
        m = i
        for j in range(i + 1, n):
            if a[j] < a[m]: m = j
        if m != i:
            a[i], a[m] = a[m], a[i]
    return a
```

## code.javascript
```javascript
function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) if (a[j] < a[m]) m = j;
    if (m !== i) [a[i], a[m]] = [a[m], a[i]];
  }
  return a;
}
```

## code.java
```java
public void selectionSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {
        int m = i;
        for (int j = i + 1; j < n; j++) if (a[j] < a[m]) m = j;
        if (m != i) { int t = a[i]; a[i] = a[m]; a[m] = t; }
    }
}
```

## code.cpp
```cpp
void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int m = i;
        for (int j = i + 1; j < n; j++) if (a[j] < a[m]) m = j;
        if (m != i) swap(a[i], a[m]);
    }
}
```
