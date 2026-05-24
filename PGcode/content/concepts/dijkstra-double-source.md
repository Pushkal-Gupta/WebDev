---
slug: dijkstra-double-source
module: graphs
title: Bidirectional Dijkstra
subtitle: Search from source and target simultaneously; meet in the middle to halve the explored region.
difficulty: Advanced
position: 50
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 24: Single-Source Shortest Paths"
    url: "https://walkccc.me/CLRS/Chap24/24.3/"
    type: book
  - title: "Dijkstra's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dijkstra.html"
    type: blog
  - title: "KACTL — graph/Dijkstra.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/Dijkstra.h"
    type: repo
status: published
---

## intro
Bidirectional Dijkstra runs two simultaneous shortest-path searches — one growing outward from the source, one growing inward toward the target on the reverse graph — and stops the moment their explored frontiers touch. The path is reconstructed by stitching the best meeting node. On a graph where standard Dijkstra explores a ball of radius d around the source, the two halves each explore a ball of radius d/2, and balls grow polynomially in d, so the work drops by a constant-to-quadratic factor depending on graph geometry.

## whyItMatters
Single-pair shortest path is the workhorse of routing — maps, network packets, game pathfinding. Plain Dijkstra wastes effort by spreading uniformly in every direction even though we only care about reaching one destination. Bidirectional search exploits the destination: by also searching backward, we prune the "wrong direction" half of the explored ball. On road networks the speedup is 2-4x; combined with A* (ALT, contraction hierarchies) it underpins production routers like OSRM and Google Maps' offline tier.

## intuition
Picture two circles expanding from two pins on a map. A one-sided Dijkstra grows a single circle until it engulfs the target — area proportional to d². Bidirectional grows two circles until they touch — combined area proportional to 2·(d/2)² = d²/2, halving work in 2D and cubing the saving in 3D-like geometries. The catch: the first node settled by both searches is not necessarily on the optimal path; you must check every edge crossing the frontier and take the minimum.

## visualization
```
Forward frontier:        S - a - b - c
                                      \
Meeting candidate:                     m
                                      /
Backward frontier:       T - z - y - x
Best path = min over (u,v) edges where u settled forward, v settled backward:
   dist_f[u] + w(u,v) + dist_b[v]
Termination: top of forward PQ + top of backward PQ >= current best
```
Each side settles vertices in increasing distance; when the sum of the two PQ tops exceeds the best stitched path, no future relaxation can improve it.

## bruteForce
Run plain Dijkstra from `s` until you pop `t`. Correct, simple, O((V+E) log V), but explores every vertex with `dist(s, v) <= dist(s, t)` — a ball of radius `dist(s,t)` around the source. On a uniform grid that is roughly π·d² vertices visited even when `t` is only `d` away.

## optimal
Run two priority queues in lockstep — one on the forward graph, one on the reverse graph. After each pop, relax neighbors as usual and update a shared `best` whenever a vertex is settled or relaxed from both sides: `best = min(best, dist_f[u] + w(u,v) + dist_b[v])`. Stop when `top(PQ_f).key + top(PQ_b).key >= best`. Reconstruct by walking parents backward from the meeting vertex on both sides.

```
function biDijkstra(G, s, t):
    dist_f[s] = 0; dist_b[t] = 0
    push (0, s) into PQ_f; push (0, t) into PQ_b
    best = +inf; meet = null
    while PQ_f not empty and PQ_b not empty:
        if top(PQ_f).key + top(PQ_b).key >= best: break
        expandOneSide(PQ_f, dist_f, dist_b, G.adj, best, meet)
        expandOneSide(PQ_b, dist_b, dist_f, G.rev, best, meet)
    return best, reconstruct(meet)
```

Alternate sides each iteration (or pop from the smaller PQ) to keep the frontiers balanced.

## complexity
time: O((V + E) log V) worst case, typically sqrt of one-sided work on near-planar graphs
space: O(V) for two distance arrays, two PQs, two parent maps
notes: On Erdős–Rényi random graphs the speedup is roughly sqrt(V); on road networks 2-4x. Worst case (star graph centered at midpoint) collapses to one-sided cost.

## pitfalls
- Stopping at first common settled vertex — that vertex may not lie on the optimal path. Use the PQ-top sum termination instead.
- Forgetting to update `best` on every edge relaxation that crosses the frontier, not just on pops.
- Using the same graph for both searches on a directed graph — backward search must walk `G.rev`.
- Lazy decrease-key implementations leak stale entries; always check `if d > dist[u]: continue` after popping.
- On negative-weight edges Dijkstra (and hence bidirectional Dijkstra) is invalid — use Bellman-Ford or Johnson's.

## interviewTips
- Lead with "single-pair, non-negative weights" — this is the precondition that motivates bidirectional over BFS or A*.
- Quote the termination rule precisely: "stop when sum of PQ tops >= best stitched distance." Interviewers probe whether you understand why the first meet is not the answer.
- Mention production use: OSRM, MoNav, Microsoft MapPoint all layer bidirectional Dijkstra under contraction hierarchies.
- If asked "when is it not worth it?": small graphs, dense graphs near complete, or when you need many-targets (Dijkstra once is cheaper than bidirectional N times).

## code.python
```python
import heapq

def bidir_dijkstra(n, adj, radj, s, t):
    if s == t:
        return 0
    INF = float('inf')
    df = [INF] * n; db = [INF] * n
    df[s] = 0; db[t] = 0
    pf = [(0, s)]; pb = [(0, t)]
    best = INF

    def expand(pq, dist, other, graph):
        nonlocal best
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            return d
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
                if other[v] < INF:
                    best = min(best, nd + other[v])
        return d

    while pf and pb:
        if pf[0][0] + pb[0][0] >= best:
            break
        expand(pf, df, db, adj)
        if not pb:
            break
        expand(pb, db, df, radj)
    return best if best < INF else -1
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
  top() { return this.a[0]; }
  size() { return this.a.length; }
  _up(i) { while (i && this.a[(i-1)>>1][0] > this.a[i][0]) { [this.a[i], this.a[(i-1)>>1]] = [this.a[(i-1)>>1], this.a[i]]; i = (i-1)>>1; } }
  _down(i) { for (;;) { let l=2*i+1, r=l+1, m=i; if (l<this.a.length && this.a[l][0]<this.a[m][0]) m=l; if (r<this.a.length && this.a[r][0]<this.a[m][0]) m=r; if (m===i) break; [this.a[i], this.a[m]] = [this.a[m], this.a[i]]; i=m; } }
}

function bidirDijkstra(n, adj, radj, s, t) {
  if (s === t) return 0;
  const INF = Infinity;
  const df = Array(n).fill(INF), db = Array(n).fill(INF);
  df[s] = 0; db[t] = 0;
  const pf = new MinHeap(), pb = new MinHeap();
  pf.push([0, s]); pb.push([0, t]);
  let best = INF;
  const expand = (pq, dist, other, g) => {
    const [d, u] = pq.pop();
    if (d > dist[u]) return;
    for (const [v, w] of g[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push([nd, v]);
        if (other[v] < INF) best = Math.min(best, nd + other[v]);
      }
    }
  };
  while (pf.size() && pb.size()) {
    if (pf.top()[0] + pb.top()[0] >= best) break;
    expand(pf, df, db, adj);
    if (!pb.size()) break;
    expand(pb, db, df, radj);
  }
  return best === INF ? -1 : best;
}
```

## code.java
```java
import java.util.*;

public long bidirDijkstra(int n, List<long[]>[] adj, List<long[]>[] radj, int s, int t) {
    if (s == t) return 0;
    long INF = Long.MAX_VALUE / 4;
    long[] df = new long[n], db = new long[n];
    Arrays.fill(df, INF); Arrays.fill(db, INF);
    df[s] = 0; db[t] = 0;
    PriorityQueue<long[]> pf = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
    PriorityQueue<long[]> pb = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
    pf.offer(new long[]{0, s}); pb.offer(new long[]{0, t});
    long best = INF;
    while (!pf.isEmpty() && !pb.isEmpty()) {
        if (pf.peek()[0] + pb.peek()[0] >= best) break;
        best = expand(pf, df, db, adj, best);
        if (pb.isEmpty()) break;
        best = expand(pb, db, df, radj, best);
    }
    return best >= INF ? -1 : best;
}

private long expand(PriorityQueue<long[]> pq, long[] dist, long[] other, List<long[]>[] g, long best) {
    long[] cur = pq.poll();
    long d = cur[0]; int u = (int) cur[1];
    if (d > dist[u]) return best;
    for (long[] e : g[u]) {
        int v = (int) e[0]; long w = e[1];
        long nd = d + w;
        if (nd < dist[v]) {
            dist[v] = nd;
            pq.offer(new long[]{nd, v});
            if (other[v] < Long.MAX_VALUE / 4) best = Math.min(best, nd + other[v]);
        }
    }
    return best;
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

long long bidirDijkstra(int n, vector<vector<pair<int,long long>>>& adj,
                        vector<vector<pair<int,long long>>>& radj, int s, int t) {
    if (s == t) return 0;
    const long long INF = LLONG_MAX / 4;
    vector<long long> df(n, INF), db(n, INF);
    df[s] = 0; db[t] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pf, pb;
    pf.push({0, s}); pb.push({0, t});
    long long best = INF;
    auto expand = [&](auto& pq, vector<long long>& dist, vector<long long>& other,
                      vector<vector<pair<int,long long>>>& g) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) return;
        for (auto [v, w] : g[u]) {
            long long nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.push({nd, v});
                if (other[v] < INF) best = min(best, nd + other[v]);
            }
        }
    };
    while (!pf.empty() && !pb.empty()) {
        if (pf.top().first + pb.top().first >= best) break;
        expand(pf, df, db, adj);
        if (pb.empty()) break;
        expand(pb, db, df, radj);
    }
    return best >= INF ? -1 : best;
}
```
