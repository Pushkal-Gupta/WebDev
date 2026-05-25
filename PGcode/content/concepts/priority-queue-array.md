---
slug: priority-queue-array
module: heaps
title: When an Array Beats a Heap
subtitle: Tiny N, bulk-build, and cache-friendly workloads where a sorted array outperforms a binary heap.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Priority Queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "Heap (Priority Queue) — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/heap-data-structure/"
    type: blog
  - title: "TheAlgorithms/Python — heap.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/heap/heap.py"
    type: repo
status: published
---

## intro
A binary heap gives O(log n) insert and extract-min, and we reach for it by reflex. But for small n, bulk-build-once workloads, or pointer-light environments, a plain sorted array runs faster despite its O(n) insert. This concept is about knowing when the textbook answer loses to the simpler one.

## whyItMatters
Real-world hot paths regularly hide priority queues with n in the single digits — top-k filters, A* with a tiny open set, scheduler ready-lists. Asymptotic O(log n) is irrelevant at n = 8; constant factors and cache behavior dominate. Interviewers love when a candidate identifies that small-n or batched scenarios deserve a different data structure than the canonical heap.

## intuition
The concept exists because asymptotic complexity is not the only thing that determines wall-clock performance — cache behavior, branch prediction, and constant factors regularly dominate at the small-n scales that real hot paths often operate at. A binary heap is O(log n) per operation, but those operations involve scattered memory accesses (heap children are at indices 2i+1, 2i+2, so layer transitions jump across cache lines) and conditional swaps that the branch predictor cannot always anticipate. A sorted array pays O(n) insert in the worst case but operates on contiguous memory the CPU's prefetcher loves, with predictable branches the predictor handles perfectly.

The decisive observation: at small n, the log-factor advantage of the heap is dwarfed by its cache and branch penalty. Empirically, the crossover point for "sorted array beats binary heap" is somewhere between n = 8 and n = 32 for modern Intel/ARM CPUs, depending on element size and access pattern (see Peter Sanders' benchmarks in the engineered priority-queue literature, and Sedgewick's empirical studies in *Algorithms*).

Three regimes matter in practice. (1) **Small n with interleaved insert/extract**: sorted array wins outright — Python's `heapq.nsmallest(k, iterable)` actually switches to a sorted-array strategy when k is small for exactly this reason. (2) **Large n with bulk-build then drain**: sort once at the start (O(n log n) with highly optimised Timsort or introsort), then extract from the end in O(1). This is faster than n heap pushes (also O(n log n) but with worse constants); Floyd's heapify gives O(n) bulk-build but each subsequent extract is still O(log n) with scattered memory accesses. (3) **Large n with truly interleaved insert/extract**: binary heap is the right choice — the log-factor finally dominates.

The deeper principle is that data-structure choice should follow workload shape, not textbook reflex. A* search with a tiny open set, top-k filters where k ≤ 16, ready-list schedulers with a handful of pending tasks — all benefit from this. Library implementations like Python's `heapq.nsmallest` codify this trade-off in production.

## visualization
For n = 5 items pushed in random order: a heap performs 5 sift-ups (each up to log 5 = 3 swaps). A sorted array performs one bulk insertion sort (about n^2 / 4 = 6 comparisons total) and then extract-min is just popping the front or last element. For n < ~16, the array's comparison count plus cache wins outright; for n > ~1000, the heap's log-factor pulls ahead.

## bruteForce
Always reach for the heap. Works, asymptotically optimal, but on a hot loop with n = 8 and millions of invocations, you pay 3-5x more wall time than a sorted-array variant. The brute-force here is "default to library PriorityQueue without measuring."

## optimal
**Technique: workload-aware data-structure selection — sorted array for small or batched workloads, binary heap for interleaved large-n.** Hits optimal wall-clock by matching the structure to the access pattern instead of mechanically reaching for the textbook log-factor primitive.

```python
import bisect

class SortedArrayPQ:
    """O(1) min, O(n) insert. Wins for n < ~16 or bulk-build workloads."""
    def __init__(self):
        self.data = []
    def push(self, x):
        bisect.insort(self.data, x)        # O(log n) binary search + O(n) shift
    def pop_min(self):
        return self.data.pop(0) if self.data else None
    def peek(self):
        return self.data[0] if self.data else None

def top_k_small(nums, k):
    """k closest variant. For small k, sorted-array beats heap in practice."""
    arr = []
    for x in nums:
        bisect.insort(arr, x)
        if len(arr) > k:
            arr.pop()                       # drop the largest
    return arr
```

Key lines: `bisect.insort(self.data, x)` performs a binary search to locate the insertion point in O(log n), then shifts the tail in O(n). The shift is what makes asymptotic insert O(n), but it operates on contiguous memory the CPU prefetcher loves — typically 5–10× faster than equivalent log-factor heap operations at n < 20. `pop(0)` is O(n) too but the constant is tiny; for true O(1) extract, store data in reverse and pop from the end. In `top_k_small`, the `if len(arr) > k: arr.pop()` line keeps the array bounded at k — total work is O(n × k) for n inputs, which for k = 8 outperforms an O(n log k) heap by 3–5× on real CPUs.

**Three regimes for the decision tree:**

1. **Small n (≤ ~16), interleaved insert/extract** — sorted array with linear-scan or binary-search insertion wins outright. Use cases: A* with tiny open sets, top-k where k is small, scheduler ready-lists.
2. **Large n, bulk-build then drain** — one `sorted(arr)` call (O(n log n) with optimised Timsort), then O(1) extracts. Beats n heap pushes for the same reason: bulk sort is more cache-friendly than n incremental insertions.
3. **Large n, truly interleaved insert/extract** — binary heap is the right choice. The log factor finally dominates and the heap's pointer-chasing penalty is amortised across many operations.

**Why measure before choosing?** The crossover point depends on element size (cache-line packing), CPU model (branch predictor depth, prefetcher aggressiveness), and access pattern. Python's `heapq.nsmallest(k, iterable)` codifies the small-k decision rule in stdlib — for k smaller than n // 2, it switches to a sorted-array strategy internally. Java's `PriorityQueue` does not auto-switch; you must reach for `TreeSet` or a custom sorted-array implementation. **Common bug**: defaulting to library `PriorityQueue` without measuring on hot paths with n in single digits and millions of invocations — typically pays 3–5× wall-time cost over a sorted-array alternative.

## complexity
time: Sorted-array insert O(n) worst case; extract-min O(1). Bulk-build O(n log n) via sort.
space: O(n), no per-node pointer overhead.
notes: For amortized analyses, a bulk-loaded heap costs O(n) via Floyd's heapify; insert-per-element costs O(n log n). The cache constant is what tips small-n in the array's favor.

## pitfalls
- Refusing to measure: "heap is faster asymptotically" does not imply "heap is faster on this input." Profile.
- Using insertion sort on n > ~1000 — switch to Arrays.sort / sorted() to get O(n log n) instead of O(n^2).
- Ignoring that the sorted-array approach loses badly if the workload has unpredictable insert-mid / extract-min interleaving — the heap's log-factor matters there.
- Treating "constant factors" as an excuse for laziness: still document why you chose array over heap so a future maintainer doesn't "fix" it back.

## interviewTips
- When the problem says "k closest" with small k, propose both: heap for the textbook answer, and "for k under 16 a sorted array is faster in practice — happy to discuss trade-offs."
- Mention bulk vs streaming workloads — interviewers respect candidates who think in workload shapes, not just data structures.
- Bring up Python's `heapq.nsmallest(k, iterable)` — internally it switches strategy based on k, exactly this trade-off in production.

## code.python
```python
import bisect

class SortedArrayPQ:
    def __init__(self):
        self.data = []
    def push(self, x):
        bisect.insort(self.data, x)
    def pop_min(self):
        return self.data.pop(0) if self.data else None
    def peek(self):
        return self.data[0] if self.data else None
    def __len__(self):
        return len(self.data)

def top_k_small(nums, k):
    arr = []
    for x in nums:
        bisect.insort(arr, x)
        if len(arr) > k: arr.pop()
    return arr
```

## code.javascript
```javascript
class SortedArrayPQ {
  constructor() { this.data = []; }
  push(x) {
    let lo = 0, hi = this.data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.data[mid] < x) lo = mid + 1; else hi = mid;
    }
    this.data.splice(lo, 0, x);
  }
  popMin() { return this.data.shift(); }
  peek() { return this.data[0]; }
  get size() { return this.data.length; }
}

function topKSmall(nums, k) {
  const arr = [];
  for (const x of nums) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] < x) lo = mid + 1; else hi = mid;
    }
    arr.splice(lo, 0, x);
    if (arr.length > k) arr.pop();
  }
  return arr;
}
```

## code.java
```java
import java.util.*;

public class SortedArrayPQ {
    private final List<Integer> data = new ArrayList<>();
    public void push(int x) {
        int idx = Collections.binarySearch(data, x);
        if (idx < 0) idx = -idx - 1;
        data.add(idx, x);
    }
    public int popMin() { return data.remove(0); }
    public int peek() { return data.get(0); }
    public int size() { return data.size(); }
}

public List<Integer> topKSmall(int[] nums, int k) {
    List<Integer> arr = new ArrayList<>();
    for (int x : nums) {
        int idx = Collections.binarySearch(arr, x);
        if (idx < 0) idx = -idx - 1;
        arr.add(idx, x);
        if (arr.size() > k) arr.remove(arr.size() - 1);
    }
    return arr;
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
using namespace std;

class SortedArrayPQ {
    vector<int> data;
public:
    void push(int x) {
        auto it = lower_bound(data.begin(), data.end(), x);
        data.insert(it, x);
    }
    int popMin() { int v = data.front(); data.erase(data.begin()); return v; }
    int peek() const { return data.front(); }
    int size() const { return data.size(); }
};

vector<int> topKSmall(vector<int>& nums, int k) {
    vector<int> arr;
    for (int x : nums) {
        auto it = lower_bound(arr.begin(), arr.end(), x);
        arr.insert(it, x);
        if ((int)arr.size() > k) arr.pop_back();
    }
    return arr;
}
```
