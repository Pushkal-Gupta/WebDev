---
slug: heap-sort
module: heaps
title: Heap Sort
subtitle: O(n log n) in-place sort backed by a binary heap.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 6: Heapsort (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap06/"
    type: book
  - title: "GeeksforGeeks — Heap"
    url: "https://www.geeksforgeeks.org/heap-data-structure/"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/heap/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/heap"
    type: repo
status: published
---

## intro
Heap sort transforms the input array into a max-heap, then repeatedly extracts the largest element from the heap's top and places it at the array's end. It's O(n log n) worst-case, in-place (O(1) extra space), and worst-case stable in performance — unlike quicksort, which can degenerate to O(n²) on adversarial input.

## whyItMatters
Heap sort isn't usually the fastest in practice (quicksort wins on cache locality, mergesort wins for stability), but it's the algorithm to know when you need *guaranteed* O(n log n) with O(1) extra memory. The heap construction step is also the basis for priority queues, top-k problems, median-of-stream, and Dijkstra's algorithm — making heap sort a great way to internalize how heaps work end to end.

## intuition
A binary heap is just an array where for index `i`, children sit at `2i+1` and `2i+2`. In a *max-heap*, every parent is ≥ both children, so the root is the maximum. Heap sort proceeds in two phases:
1. **Heapify** the input into a max-heap (O(n) bottom-up).
2. **Sort:** swap the root (max) with the last element, shrink the heap by one, and *sift down* the new root. Repeat until the heap is empty. The array is now sorted ascending.

The clever part is bottom-up heapify: starting from the last non-leaf node and walking to root, sift-down each subtree. The sum of sift-down depths is O(n), not O(n log n).

## visualization
Input `[4, 1, 3, 9, 7]`. After bottom-up heapify: `[9, 7, 3, 4, 1]` (a valid max-heap as an array). Swap root with last: `[1, 7, 3, 4, 9]`, heap is now indices 0..3. Sift down index 0: `[7, 4, 3, 1, 9]`. Swap with index 3: `[1, 4, 3, 7, 9]`. Sift: `[4, 1, 3, 7, 9]`. Swap with index 2: `[3, 1, 4, 7, 9]`. Sift: `[3, 1, 4, 7, 9]`. Swap with 1: `[1, 3, 4, 7, 9]`. Done — sorted ascending.

## bruteForce
Insertion sort: O(n²). Selection sort: O(n²). Both fine for ≤ 100 elements; useless at scale.

## optimal
**Technique: in-place bottom-up max-heap construction (Floyd's algorithm, O(n)) + n−1 extract-max-and-sift-down rounds (O(n log n)).** Heap sort is one of the few comparison sorts achieving O(n log n) worst-case with O(1) extra memory.

```python
def heap_sort(arr):
    n = len(arr)

    def sift_down(start, end):                    # restore heap property at subtree rooted at start
        root = start
        while 2 * root + 1 < end:
            child = 2 * root + 1                   # left child
            if child + 1 < end and arr[child] < arr[child + 1]:
                child += 1                          # pick larger child
            if arr[root] >= arr[child]:
                return                              # heap property restored
            arr[root], arr[child] = arr[child], arr[root]
            root = child

    # Phase 1: bottom-up heapify in O(n) using Floyd's algorithm
    for start in range(n // 2 - 1, -1, -1):
        sift_down(start, n)

    # Phase 2: extract max n-1 times, place at end, shrink heap
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]        # max moves to its sorted position
        sift_down(0, end)                           # restore heap on shrunk range
```

Key lines: `for start in range(n // 2 - 1, -1, -1): sift_down(start, n)` is Floyd's bottom-up heapify — start from the last non-leaf node (index `n//2 - 1`) and walk up to the root, sift-down each subtree. The amortised cost is O(n), not O(n log n), because most nodes are near the leaves where sift-down is cheap; the sum of sift-down depths is bounded by Σ (n / 2^h) · h = O(n). Most candidates incorrectly say O(n log n) for this phase — knowing the true bound is a depth signal.

`for end in range(n - 1, 0, -1): arr[0], arr[end] = arr[end], arr[0]; sift_down(0, end)` is the extraction phase. Swap the max (root) with the last position of the current heap, shrinking the heap by one. The just-placed element is now in its final sorted position; the new root needs sift-down to restore the heap property. n-1 extractions × O(log n) each = O(n log n).

Total: O(n) + O(n log n) = O(n log n) worst-case with O(1) extra memory. The heap *is* the input array — no auxiliary storage.

**For top-k largest** (not full sort): heapify in O(n), then extract k times in O(k log n). Total O(n + k log n). For small k this beats sorting (O(n log n)) and beats nlargest from a min-heap of size k (O(n log k)) when k is large enough that the log-factor difference matters. **For streaming top-k** (elements arrive one at a time, no preprocessing): maintain a min-heap of size k, push each new element, pop if size > k. O(log k) per insert, O(n log k) total.

**Why not quicksort?** Quicksort wins in practice due to better cache locality (sequential array access vs heap's index-doubling jumps) and the O(1) random pivot constant. But quicksort has O(n²) worst case on adversarial input (e.g., already-sorted with first-element pivot); heap sort is guaranteed O(n log n). Java's `Arrays.sort(int[])` uses dual-pivot quicksort with introspective fallback to heap sort exactly to bound the worst case. **Why not mergesort?** Mergesort is stable (heap sort is not) and has good cache behaviour but requires O(n) auxiliary memory. **Common bugs**: indexing off-by-one (children of i at 2i+1, 2i+2 if root is at 0); forgetting to shrink the heap after each extraction (infinite loop); using a min-heap for ascending sort (gives descending — use max-heap); confusing heapify (bulk build, O(n)) with sift-down/sift-up (single-node restore, O(log n)).

## complexity
time: O(n log n) worst case; the heapify phase is O(n), and the extraction phase is O(n log n) (n extractions × log n sift each).
space: O(1) extra (in-place); the heap *is* the input array.
notes: Heap sort is **not stable** — equal elements can be reordered. Use mergesort if stability matters. Cache performance is worse than quicksort because the heap layout jumps around the array.

## pitfalls
- Indexing off-by-one when the array isn't 0-indexed in your mental model. Children of `i` are `2i+1, 2i+2` if root is at 0.
- Forgetting to shrink the heap size after each extraction — leads to infinite loop.
- Confusing "heapify" (bulk build) with "sift down/up" (per-node restore) — heapify calls sift-down n/2 times.
- Using a min-heap when you wanted ascending sort: extracting from a min-heap and placing at the *end* gives descending order. Use a max-heap for ascending output.

## interviewTips
- Lead with the O(n) heapify insight — most candidates incorrectly call it O(n log n). The amortization argument is a great signal of depth.
- "Top-k largest" is the canonical interview application: heapify, pop k times. O(n + k log n) beats sorting (O(n log n)) when k is small.
- For streaming top-k, maintain a min-heap of size k; push each new element, pop if size > k. O(log k) per item.

## code.python
```python
def heap_sort(arr: list[int]) -> None:
    n = len(arr)

    def sift_down(start: int, end: int) -> None:
        root = start
        while 2 * root + 1 < end:
            child = 2 * root + 1
            if child + 1 < end and arr[child] < arr[child + 1]:
                child += 1
            if arr[root] >= arr[child]: return
            arr[root], arr[child] = arr[child], arr[root]
            root = child

    # Heapify
    for i in range(n // 2 - 1, -1, -1):
        sift_down(i, n)

    # Sort
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        sift_down(0, end)
```

## code.javascript
```javascript
function heapSort(arr) {
  const n = arr.length;
  function siftDown(start, end) {
    let root = start;
    while (2 * root + 1 < end) {
      let child = 2 * root + 1;
      if (child + 1 < end && arr[child] < arr[child + 1]) child++;
      if (arr[root] >= arr[child]) return;
      [arr[root], arr[child]] = [arr[child], arr[root]];
      root = child;
    }
  }
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(i, n);
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(0, end);
  }
}
```

## code.java
```java
public void heapSort(int[] arr) {
    int n = arr.length;
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(arr, i, n);
    for (int end = n - 1; end > 0; end--) {
        int tmp = arr[0]; arr[0] = arr[end]; arr[end] = tmp;
        siftDown(arr, 0, end);
    }
}
private void siftDown(int[] arr, int start, int end) {
    int root = start;
    while (2 * root + 1 < end) {
        int child = 2 * root + 1;
        if (child + 1 < end && arr[child] < arr[child + 1]) child++;
        if (arr[root] >= arr[child]) return;
        int tmp = arr[root]; arr[root] = arr[child]; arr[child] = tmp;
        root = child;
    }
}
```

## code.cpp
```cpp
void siftDown(vector<int>& arr, int start, int end) {
    int root = start;
    while (2 * root + 1 < end) {
        int child = 2 * root + 1;
        if (child + 1 < end && arr[child] < arr[child + 1]) child++;
        if (arr[root] >= arr[child]) return;
        swap(arr[root], arr[child]);
        root = child;
    }
}
void heapSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(arr, i, n);
    for (int end = n - 1; end > 0; end--) {
        swap(arr[0], arr[end]);
        siftDown(arr, 0, end);
    }
}
```
