---
slug: dijkstra-fibonacci-heap
module: graphs-shortest-paths
title: Dijkstra with Fibonacci Heap
subtitle: Theoretical O(E + V log V) shortest paths — and why nobody actually uses it.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 19: Fibonacci Heaps"
    url: "https://walkccc.me/CLRS/Chap19/"
    type: book
  - title: "Dijkstra's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "kactl — Fibonacci Heap reference"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
The textbook Dijkstra implementation uses a binary heap for the priority queue and runs in O((V + E) log V). Replace the binary heap with a Fibonacci heap and the bound improves to O(E + V log V) — better whenever E is much larger than V. This is the theoretical-best comparison-based Dijkstra. In practice, the Fibonacci heap's huge constant factor makes it slower than a plain binary heap on every input that fits in memory.

## intuition
The data structure exists because Dijkstra's time is dominated by two heap operations: V extract-min calls and E decrease-key calls (one per edge relaxation that improves a distance). A binary heap (Williams 1964) costs O(log V) for both, giving E log V total. The question Fredman & Tarjan asked in 1987: can we make decrease-key cheaper without sacrificing extract-min's amortised bound?

The decisive observation: by storing the heap as a *forest* of min-heap-ordered trees instead of a single tree, you can make decrease-key essentially free. Instead of bubbling a decreased key up through its tree (O(log V)), just cut the node and its subtree from its parent and add it as a new root of the forest — O(1) work. The forest grows messy over time but is consolidated only during extract-min, which becomes the work-doer. Marking and cascading-cut bookkeeping ensures the amortised cost stays bounded.

Concretely: insert drops a new tree of size 1 into the root list — O(1). Decrease-key cuts the affected node from its parent, marks the parent (potential for cascading cuts), and adds the cut subtree as a new root — O(1) amortised. Extract-min removes the minimum root, then *consolidates* the forest by repeatedly merging same-degree trees pairwise until each degree appears at most once. Consolidation is the expensive step — O(log V) amortised, paid for by the cheap inserts and decrease-keys that came before via potential-function accounting.

Total cost: V extract-mins × O(log V) + E decrease-keys × O(1) = O(V log V + E). For dense graphs where E ~ V², this is O(V²) — same as the array-based Dijkstra — but for sparse graphs where E ~ V, it's O(V log V), strictly better than binary heap's O(V log V + E log V).

In practice, Fibonacci heaps are slower than binary heaps on every input that fits in memory because their constant factors are enormous — pointer-heavy node structures, complex cascading-cut logic (~200 lines of bug-prone code), poor cache locality compared to array-backed binary heaps. Production code uses binary heaps with lazy deletion, pairing heaps (which achieve the same amortised bounds in simpler code), or radix heaps / Dial's algorithm when edge weights are small integers. The Fibonacci heap is one of computer science's classic "asymptotically optimal, practically irrelevant" data structures — important to understand for the analysis lesson, not for production use.

## whyItMatters
The Fibonacci heap is one of computer science's classic "asymptotically optimal, practically irrelevant" data structures — students should understand both why the bound is right and why production code ignores it. Real systems use binary heaps, pairing heaps, or radix heaps (for integer weights). Knowing the analysis sharpens your understanding of amortized cost and prepares you for follow-up questions about why d-ary heaps with d = max(2, E/V) sit between the two extremes.

## visualization
Imagine a forest of min-heap-ordered trees rather than a single heap. Insert: drop a new tree of size 1 into the root list — O(1). Decrease-key: cut the node from its parent, attach it as a new root — O(1). Extract-min: remove the min root, then "consolidate" by repeatedly merging same-degree trees pairwise until each degree appears at most once — amortized O(log V) because the work is paid for by the cheap inserts and decrease-keys that came before.

## bruteForce
Linear-scan priority queue: extract-min is O(V), decrease-key is O(1), total O(V^2 + E). On dense graphs (E ~ V^2) this is actually competitive with the Fibonacci heap and beats binary-heap Dijkstra. On sparse graphs (E ~ V) it is much worse than binary heap (V log V + E log V). The brute-force version is also the one used in CLRS pseudocode, and the right default when V <= ~5000.

## optimal
**Technique: priority-queue choice driven by graph density and weight structure.** Fibonacci heap gives the theoretical-best comparison bound O(E + V log V); binary heap with lazy deletion is the production sweet spot; radix heaps win on integer weights. Use the right tool for the constraints, not the asymptotic winner.

```python
import heapq

def dijkstra(n, adj, src):
    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0
    pq = [(0, src)]                              # (distance, node)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:                          # lazy deletion: stale entry
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))      # push duplicate instead of decrease-key
    return dist
```

Key lines: the `if d > dist[u]: continue` line is **lazy deletion** — instead of supporting an explicit decrease-key operation (which Python's `heapq` doesn't expose), we push duplicates into the heap and skip stale entries on pop. This keeps each operation O(log V) and avoids the node-handle bookkeeping that Fibonacci heaps require. The heap can grow to O(E) entries in the worst case but practical performance is excellent because most stale entries are popped and skipped in tight succession.

**Decision matrix:**

| Graph shape | Best PQ | Total complexity |
|---|---|---|
| Sparse, comparison weights | Binary heap + lazy deletion | O(E log V) |
| Dense (E ~ V²) | Array (linear scan) | O(V²) |
| Sparse, integer weights ≤ W | Bucket queue / Dial's | O(E + V·W) |
| Sparse, integer weights, generic | Radix heap | O(E + V·log(max weight)) |
| Theoretical optimal | Fibonacci heap | O(E + V log V) |
| Practical compromise | Pairing heap | O(E + V log V) amortised, simpler code |

**Why not Fibonacci heap in practice?** Implementing the consolidation, marking, and cascading-cut logic is roughly 200 lines of pointer surgery that's brittle to get right; the constant factor is 3–5× worse than a binary heap on E ≈ 10·V workloads. Boost Graph Library and LEMON ship Fibonacci-heap Dijkstra for benchmarking purposes but recommend binary or pairing heap for production. **Why not always use radix heap?** Requires bounded-integer weights; falls back to binary heap for real-valued or unbounded weights.

**For competitive programming**: `heapq` (Python), `std::priority_queue` (C++), `PriorityQueue` (Java) — all binary heaps with lazy deletion. **For interviews**: state the bound and immediately admit the constant: "Fibonacci heap gets E + V log V theoretically, but I'd use a binary heap in real code because the constants matter and decrease-key via lazy deletion is good enough." Mention pairing heaps as the practical middle ground if the interviewer pushes for the theoretical bound.

## complexity
time: O(E + V log V) amortized with Fibonacci heap.
space: O(V + E) for the graph + O(V) for distance and heap-node maps.
notes: The amortized analysis uses a potential function counting "marked" nodes (nodes that have lost a child). Each cut either pays for itself or increases the potential, which a later cascading cut consumes — the textbook example of amortized analysis paying real dividends.

## pitfalls
- Implementing the Fibonacci heap from scratch in an interview — the consolidation, marking, and cascading-cut logic is roughly 200 lines of bug-prone pointer surgery.
- Trusting the asymptotic without measuring — on a graph with E = 10*V and V = 1M, a tuned binary heap typically beats a Fibonacci heap by 3-5x in wall time.
- Forgetting that decrease-key requires a node-handle stored alongside each vertex — `std::priority_queue` doesn't expose handles, so the standard trick is "lazy deletion" (push duplicates, pop stale entries on extract).
- Confusing the Fibonacci heap's amortized O(1) decrease-key with worst-case O(1) — a single decrease-key can cascade through O(log V) cuts.

## interviewTips
- State the bound and immediately admit the constant: "Fibonacci heap gets E + V log V but I'd use a binary heap in real code."
- Mention pairing heaps as the practical compromise — same asymptotic + simpler.
- For integer weights, mention bucket queues / Dial's algorithm — interviewers love when you pick the right tool for the constraints.

## code.python
```python
import heapq

def dijkstra(n, adj, src):
    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist
```

## code.javascript
```javascript
class MinHeap {
  constructor() { this.a = []; }
  push(x) { this.a.push(x); this._up(this.a.length - 1); }
  pop() {
    const top = this.a[0], last = this.a.pop();
    if (this.a.length) { this.a[0] = last; this._down(0); }
    return top;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p][0] <= this.a[i][0]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.a.length;
    while (true) {
      const l = 2 * i + 1, r = l + 1;
      let s = i;
      if (l < n && this.a[l][0] < this.a[s][0]) s = l;
      if (r < n && this.a[r][0] < this.a[s][0]) s = r;
      if (s === i) break;
      [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
      i = s;
    }
  }
  get size() { return this.a.length; }
}

function dijkstra(n, adj, src) {
  const dist = Array(n).fill(Infinity);
  dist[src] = 0;
  const pq = new MinHeap();
  pq.push([0, src]);
  while (pq.size) {
    const [d, u] = pq.pop();
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) { dist[v] = nd; pq.push([nd, v]); }
    }
  }
  return dist;
}
```

## code.java
```java
import java.util.*;

public class Dijkstra {
    public long[] shortestPaths(int n, List<int[]>[] adj, int src) {
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.offer(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            long d = top[0]; int u = (int) top[1];
            if (d > dist[u]) continue;
            for (int[] e : adj[u]) {
                int v = e[0], w = e[1];
                long nd = d + w;
                if (nd < dist[v]) {
                    dist[v] = nd;
                    pq.offer(new long[]{nd, v});
                }
            }
        }
        return dist;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>

std::vector<long long> dijkstra(int n, std::vector<std::vector<std::pair<int,int>>>& adj, int src) {
    std::vector<long long> dist(n, LLONG_MAX);
    dist[src] = 0;
    using P = std::pair<long long, int>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            long long nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.push({nd, v});
            }
        }
    }
    return dist;
}
```
