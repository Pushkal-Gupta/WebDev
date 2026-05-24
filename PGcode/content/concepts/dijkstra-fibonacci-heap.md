---
slug: dijkstra-fibonacci-heap
module: graphs
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
Dijkstra spends time on two operations: extract-min (V times) and decrease-key (E times). A binary heap costs O(log V) for both, giving E log V total. A Fibonacci heap is *lazy*: it does only constant amortized work per decrease-key by parking each operation in a linked list and consolidating later, so decrease-keys cost O(1) amortized and only extract-mins do real work — O(log V) amortized each. Total: V log V from extracts + E from decrease-keys.

## whyItMatters
The Fibonacci heap is one of computer science's classic "asymptotically optimal, practically irrelevant" data structures — students should understand both why the bound is right and why production code ignores it. Real systems use binary heaps, pairing heaps, or radix heaps (for integer weights). Knowing the analysis sharpens your understanding of amortized cost and prepares you for follow-up questions about why d-ary heaps with d = max(2, E/V) sit between the two extremes.

## visualization
Imagine a forest of min-heap-ordered trees rather than a single heap. Insert: drop a new tree of size 1 into the root list — O(1). Decrease-key: cut the node from its parent, attach it as a new root — O(1). Extract-min: remove the min root, then "consolidate" by repeatedly merging same-degree trees pairwise until each degree appears at most once — amortized O(log V) because the work is paid for by the cheap inserts and decrease-keys that came before.

## bruteForce
Linear-scan priority queue: extract-min is O(V), decrease-key is O(1), total O(V^2 + E). On dense graphs (E ~ V^2) this is actually competitive with the Fibonacci heap and beats binary-heap Dijkstra. On sparse graphs (E ~ V) it is much worse than binary heap (V log V + E log V). The brute-force version is also the one used in CLRS pseudocode, and the right default when V <= ~5000.

## optimal
For competitive programming and production: binary heap (std::priority_queue, Python heapq, PriorityQueue in Java). For integer weights bounded by a constant W, a radix heap or Dial's algorithm gets O(E + V * W) or O(E + V * sqrt(log V)). The Fibonacci heap is optimal asymptotically but loses on constants. The pairing heap is the practical middle ground — O(log V) amortized extract-min, O(1) decrease-key in practice, with a much simpler implementation than Fibonacci.

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
