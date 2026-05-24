---
slug: heap-binary
module: heaps
title: Binary Heap — Push, Pop, Build
subtitle: Array-backed complete binary tree; insert / extract-min in O(log n), build heap in O(n).
difficulty: Intermediate
position: 5
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
A **binary heap** is a complete binary tree stored in a flat array where every parent's value is ≤ (min-heap) or ≥ (max-heap) every child's value. Push and pop take O(log n); building a heap from a flat array takes a surprising **O(n)** — not O(n log n).

## whyItMatters
Heaps are the data structure behind nearly every priority queue. Used in:
- **Dijkstra's** shortest paths.
- **Top-k** problems (top-k frequent, k closest points).
- **Median maintenance** (two heaps, one min one max).
- **Task schedulers** in OSes.
- **Heapsort** for in-place O(n log n) sorting.

Every interview tier expects you to know heap push/pop without a library.

## intuition
With 0-indexed array `a`:
- Parent of i is `(i - 1) // 2`.
- Children of i are `2*i + 1` and `2*i + 2`.

**Push(x)**: append at the end (array.push). Then **sift up**: while x is smaller than its parent (min-heap), swap with parent.

**Pop()**: swap root with last element. Pop the last element (the old root) — that's the answer. Then **sift down** the new root: while it's larger than the smaller child, swap.

**Build from array**: instead of n pushes (O(n log n)), sift-down from the last non-leaf (index `(n // 2) - 1`) down to 0. O(n) — proof by sum of heights.

## visualization
```
Array:   [3, 7, 4, 9, 8, 6]      (already a min-heap? check parent ≤ children)
Tree:
              3
            /   \
           7     4
          /\    /
         9  8  6

Push 1:
  Append → [3, 7, 4, 9, 8, 6, 1]
  Sift up: 1 vs parent index (6-1)//2=2 → 4. 1 < 4 → swap.
  Array: [3, 7, 1, 9, 8, 6, 4]
  1 vs parent (2-1)//2=0 → 3. 1 < 3 → swap.
  Array: [1, 7, 3, 9, 8, 6, 4]

Pop:
  Swap root with last: [4, 7, 3, 9, 8, 6, 1] → pop 1 (the answer)
  Array: [4, 7, 3, 9, 8, 6]
  Sift down: 4 vs children (7, 3). 3 < 4 → swap.
  Array: [3, 7, 4, 9, 8, 6] ← back to original heap
```

## bruteForce
Use a sorted array + linear-search for insert position. O(n) per insert. Linked list — O(1) insert but O(n) min. Both lose to heap's O(log n).

## optimal
```
class MinHeap:
    def __init__(self):
        self.a = []

    def push(self, x):
        self.a.append(x)
        self._sift_up(len(self.a) - 1)

    def pop(self):
        if not self.a: return None
        top = self.a[0]
        last = self.a.pop()
        if self.a:
            self.a[0] = last
            self._sift_down(0)
        return top

    def _sift_up(self, i):
        while i > 0:
            parent = (i - 1) // 2
            if self.a[parent] <= self.a[i]: break
            self.a[parent], self.a[i] = self.a[i], self.a[parent]
            i = parent

    def _sift_down(self, i):
        n = len(self.a)
        while True:
            l, r = 2*i + 1, 2*i + 2
            smallest = i
            if l < n and self.a[l] < self.a[smallest]: smallest = l
            if r < n and self.a[r] < self.a[smallest]: smallest = r
            if smallest == i: break
            self.a[i], self.a[smallest] = self.a[smallest], self.a[i]
            i = smallest

    @staticmethod
    def from_array(arr):
        h = MinHeap()
        h.a = list(arr)
        for i in range(len(h.a) // 2 - 1, -1, -1):
            h._sift_down(i)
        return h
```

**O(n) build proof sketch**: at level k (from the bottom), there are ~n/2^k nodes each costing O(k) to sift down. Total = n · Σ(k / 2^k) which converges to 2n.

## complexity
- **Push / pop**: O(log n).
- **Peek (root)**: O(1).
- **Build from array**: O(n).
- **Heapify in place**: O(n).
- **Space**: O(n).

## pitfalls
- **Comparator inverted**: getting a max-heap when you wanted min-heap. Python's `heapq` is min-only; for max negate values or use `-heap`.
- **Sift down condition**: compare both children, pick the smaller one (min-heap). Forgetting to check both is a subtle bug.
- **Empty pop**: handle gracefully — return None or raise, but don't crash on empty.
- **Deleting arbitrary element**: O(n) by default. Use a "lazy delete" pattern + skip stale entries on pop.

## interviewTips
- Always state push/pop are O(log n) and build is O(n).
- For "top-k frequent" problems, mention both **min-heap of size k** (O(n log k)) AND **quickselect** (O(n) expected).
- For senior interviews, mention **d-ary heaps** (lower height, better for cache) and **Fibonacci heaps** (theoretically faster decrease-key).
- For median-on-stream, the two-heap trick (one min, one max) is canonical.

## code.python
```python
import heapq
h = []
for x in [3, 1, 4, 1, 5, 9, 2, 6]: heapq.heappush(h, x)
print(heapq.heappop(h))     # 1
# Build in O(n):
arr = [3, 1, 4, 1, 5, 9, 2, 6]
heapq.heapify(arr)          # in-place
print(arr[0])                # 1
```

## code.javascript
```javascript
class MinHeap {
  constructor(arr = []) { this.a = arr.slice(); for (let i = (this.a.length>>1)-1; i>=0; i--) this._down(i); }
  push(x) { this.a.push(x); this._up(this.a.length - 1); }
  pop() {
    if (!this.a.length) return undefined;
    const top = this.a[0], last = this.a.pop();
    if (this.a.length) { this.a[0] = last; this._down(0); }
    return top;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] <= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.a.length;
    while (true) {
      const l = 2*i + 1, r = 2*i + 2;
      let s = i;
      if (l < n && this.a[l] < this.a[s]) s = l;
      if (r < n && this.a[r] < this.a[s]) s = r;
      if (s === i) break;
      [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
      i = s;
    }
  }
}
```

## code.java
```java
import java.util.PriorityQueue;
class HeapExample {
    public static void main(String[] args) {
        PriorityQueue<Integer> h = new PriorityQueue<>();
        for (int x : new int[]{3, 1, 4, 1, 5, 9, 2, 6}) h.offer(x);
        System.out.println(h.poll());
    }
}
```

## code.cpp
```cpp
#include <queue>
#include <vector>
int main() {
    std::priority_queue<int, std::vector<int>, std::greater<>> h;  // min-heap
    for (int x : {3, 1, 4, 1, 5, 9, 2, 6}) h.push(x);
    return h.top();
}
```
