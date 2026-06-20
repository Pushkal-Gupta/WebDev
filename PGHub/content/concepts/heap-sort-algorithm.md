---
slug: heap-sort-algorithm
module: sorting-strings
title: Heap Sort
subtitle: Build a max-heap in place, repeatedly extract the root to the back — O(n log n) worst case, no auxiliary memory.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Priority Queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "cp-algorithms — Heap"
    url: "https://cp-algorithms.com/data_structures/heap.html"
    type: blog
  - title: "TheAlgorithms/Python — heap_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/sorts/heap_sort.py"
    type: repo
status: published
---

## intro
Heap sort uses a binary max-heap as its engine. First it converts the input array into a heap in `O(n)` via repeated sift-down from the middle to the front. Then it swaps the root (the current maximum) with the last unsorted position, shrinks the heap by one, and sifts the new root down to restore the heap property. Repeat `n - 1` times and the array is sorted in ascending order. The algorithm is in place, deterministic, and `O(n log n)` worst case — the only `O(n log n)` comparison sort that needs no auxiliary memory.

## whyItMatters
- It powers **introsort** — the production sort in C++, Rust, and many JVM libraries — as the worst-case fallback when quicksort recursion gets too deep.
- The same heap data structure is the standard **priority queue**, used everywhere from Dijkstra's algorithm to OS task schedulers.
- It is the canonical example of "select the next element from a tournament structure" — the same idea behind tournament sort and external `k`-way merge.
- Real-time systems prefer it over quicksort because its worst-case bound is hard, not probabilistic.

## intuition
A binary max-heap stored in an array satisfies one rule: `a[parent(i)] >= a[i]`. Index 0 is the root and always holds the maximum. Children of index `i` live at `2i + 1` and `2i + 2`; parent of `i` lives at `(i - 1) / 2`. This layout means heap operations are pointer-free and cache-friendly — every parent-child step is a constant-distance memory access until the indices grow large enough to leave the cache line.

To **build** a heap from an arbitrary array, you might think you have to sift each element up one at a time — `O(n log n)`. But there is a sharper way: start at the lowest non-leaf node (`n/2 - 1`) and sift **down**. Half the nodes are leaves and need zero work; a quarter sit at depth 1 and do one swap; and so on. Summing this geometric series gives the surprising `O(n)` bound, the heart of Floyd's heap-construction algorithm.

Once the heap is built, the root is the maximum. Swap it into position `n - 1`, mark that slot as "sorted", and sift the new root down through the now-smaller heap. After `n - 1` such extractions, every position holds an element larger than the previous one. The heap shrinks from the right as the sorted suffix grows — there is no separate array, just a moving boundary.

## visualization
Sort `[3, 1, 6, 5, 2, 4]`. Heap shown as both array and tree.

```
input:           [3, 1, 6, 5, 2, 4]
                       3
                      / \
                     1   6
                    / \  /
                   5   2 4

build-heap (sift down from idx 2 then idx 1 then idx 0):
                       6
                      / \
                     5   4
                    / \  /
                   3   2 1     array = [6, 5, 4, 3, 2, 1]

extract-max passes:
  pass 1: swap a[0]<->a[5]; heap size 5; sift down
          array = [5, 3, 4, 1, 2 | 6]    sorted suffix = [6]
  pass 2: swap a[0]<->a[4]; heap size 4; sift down
          array = [4, 3, 2, 1 | 5, 6]    sorted suffix = [5, 6]
  pass 3: swap a[0]<->a[3]; heap size 3; sift down
          array = [3, 1, 2 | 4, 5, 6]
  pass 4: swap a[0]<->a[2]; heap size 2; sift down
          array = [2, 1 | 3, 4, 5, 6]
  pass 5: swap a[0]<->a[1]; heap size 1; done
          array = [1, 2, 3, 4, 5, 6]
```

## bruteForce
Selection sort uses the same "find max, swap to back" idea but takes `O(n)` per extraction by scanning the unsorted prefix, giving `O(n^2)`. The heap upgrade replaces the linear scan with an `O(log n)` sift-down, dropping the total to `O(n log n)`.

## optimal
Floyd build + repeated sift-down extraction.

```python
def heap_sort(a: list[int]) -> list[int]:
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(a, i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        sift_down(a, 0, end)
    return a

def sift_down(a, i, size):
    while True:
        l, r, largest = 2 * i + 1, 2 * i + 2, i
        if l < size and a[l] > a[largest]: largest = l
        if r < size and a[r] > a[largest]: largest = r
        if largest == i: break
        a[i], a[largest] = a[largest], a[i]
        i = largest
```

The build phase runs in `O(n)` because most sift-downs are short. The extraction phase performs `n - 1` sift-downs of depth `log n`, contributing `O(n log n)`. Stability is impossible without auxiliary indices — equal keys pass each other during swaps — so heap sort is **not stable**. For a min-sort, swap `>` for `<` in `sift_down` to build a min-heap, then read the sorted suffix in reverse.

## complexity
- **Time**: `O(n log n)` worst, average, and best — no input is asymptotically faster.
- **Space**: `O(1)` — in place, no recursion if you write `sift_down` iteratively.
- **Stable**: no — heap operations swap distant elements.
- **Heap build**: `O(n)` via sift-down. **Extraction**: `O(log n)` each, `n - 1` times.

## pitfalls
- **Building the heap by sifting up.** That gives `O(n log n)` instead of `O(n)`. Fix: sift down from `n/2 - 1` to `0`.
- **Forgetting to shrink the heap on extraction.** If you keep sifting over the sorted suffix, you destroy it. Fix: pass `end` (current heap size) to `sift_down` and treat indices `>= end` as sorted.
- **Using a min-heap when you want ascending output.** A min-heap extracts the minimum first; swapping it to the back leaves the array in **descending** order. Fix: use a max-heap for ascending sort.
- **Recursion blowing the stack on large inputs.** Recursive `sift_down` may recurse `log n` deep — usually fine, but in adversarial nesting can interact with other recursive code. Fix: write `sift_down` iteratively.

## interviewTips
- Mention the `O(n)` build-heap analysis — it is a favourite follow-up and the geometric-sum derivation is short.
- Position heap sort as the worst-case-guaranteed alternative to quicksort, especially for real-time systems.
- If asked for the top-k, switch to a **k-element min-heap**: scan once, push every element, pop when size exceeds k. Final heap holds the answers in `O(n log k)`.

## code.python
```python
def heap_sort(a):
    def sift(i, size):
        while True:
            l, r, m = 2*i + 1, 2*i + 2, i
            if l < size and a[l] > a[m]: m = l
            if r < size and a[r] > a[m]: m = r
            if m == i: return
            a[i], a[m] = a[m], a[i]; i = m
    n = len(a)
    for i in range(n // 2 - 1, -1, -1): sift(i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        sift(0, end)
    return a
```

## code.javascript
```javascript
function heapSort(a) {
  const n = a.length;
  const sift = (i, size) => {
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2; let m = i;
      if (l < size && a[l] > a[m]) m = l;
      if (r < size && a[r] > a[m]) m = r;
      if (m === i) return;
      [a[i], a[m]] = [a[m], a[i]]; i = m;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    sift(0, end);
  }
  return a;
}
```

## code.java
```java
public void heapSort(int[] a) {
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) sift(a, i, n);
    for (int end = n - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;
        sift(a, 0, end);
    }
}
private void sift(int[] a, int i, int size) {
    while (true) {
        int l = 2*i + 1, r = 2*i + 2, m = i;
        if (l < size && a[l] > a[m]) m = l;
        if (r < size && a[r] > a[m]) m = r;
        if (m == i) return;
        int t = a[i]; a[i] = a[m]; a[m] = t; i = m;
    }
}
```

## code.cpp
```cpp
void sift(vector<int>& a, int i, int size) {
    while (true) {
        int l = 2*i + 1, r = 2*i + 2, m = i;
        if (l < size && a[l] > a[m]) m = l;
        if (r < size && a[r] > a[m]) m = r;
        if (m == i) return;
        swap(a[i], a[m]); i = m;
    }
}
void heapSort(vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--) sift(a, i, n);
    for (int end = n - 1; end > 0; end--) { swap(a[0], a[end]); sift(a, 0, end); }
}
```
