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
A heap pays per-operation pointer chasing and conditional swaps; an array pays one bulk sort up front and then O(1) min lookup. If you push n items once and pop them all, an array's O(n log n) sort plus O(n) pops totals O(n log n) — same as a heap, but with vastly better cache locality because every element sits in one contiguous block. Heap nodes scatter across memory by index pattern; array elements iterate linearly.

## visualization
For n = 5 items pushed in random order: a heap performs 5 sift-ups (each up to log 5 = 3 swaps). A sorted array performs one bulk insertion sort (about n^2 / 4 = 6 comparisons total) and then extract-min is just popping the front or last element. For n < ~16, the array's comparison count plus cache wins outright; for n > ~1000, the heap's log-factor pulls ahead.

## bruteForce
Always reach for the heap. Works, asymptotically optimal, but on a hot loop with n = 8 and millions of invocations, you pay 3-5x more wall time than a sorted-array variant. The brute-force here is "default to library PriorityQueue without measuring."

## optimal
Three regimes for picking the right structure: (1) n is small (under ~16) and inserts interleave with extracts — sorted array with linear-scan insertion wins; (2) n is large and the workload is bulk-build then drain — array with one Arrays.sort() call at the start is faster than n heap pushes (still O(n log n) but with optimized comparison sort); (3) n is large and inserts/extracts interleave heavily — that's the heap's home turf.

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
