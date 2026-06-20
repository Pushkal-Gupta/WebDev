---
slug: network-flow-dinic
module: graphs-flow-grids
title: Dinic's Algorithm
subtitle: Maximum flow in O(V^2 E) via BFS level graphs and blocking-flow DFS.
difficulty: Advanced
position: 55
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 26: Maximum Flow"
    url: "https://walkccc.me/CLRS/Chap26/26.2/"
    type: book
  - title: "Maximum Flow — Dinic's Algorithm — cp-algorithms"
    url: "https://cp-algorithms.com/graph/dinic.html"
    type: blog
  - title: "KACTL — graph/Dinic.h"
    url: "https://github.com/kth-competitive-programming/kactl/blob/main/content/graph/Dinic.h"
    type: repo
status: published
---

## intro
Dinic's algorithm computes the maximum flow from source `s` to sink `t` in a capacitated directed graph. It improves on Ford-Fulkerson by alternating two phases: a BFS that builds the *level graph* (each vertex labeled with its shortest-path distance from `s` in the residual network), and a DFS that pushes a *blocking flow* through that level graph in one phase. The level distance from `s` to `t` strictly increases between phases, capping the number of phases at V-1.

## whyItMatters
Max-flow is the universal hammer for bipartite matching, edge-disjoint paths, project selection, image segmentation, baseball elimination, and any reduction from "find an assignment that satisfies these capacities." Dinic gives a polynomial bound — O(V²E) generally, O(E sqrt(V)) on unit-capacity / bipartite graphs — without the integer-capacity restriction of plain Ford-Fulkerson. It is the algorithm most competitive-programming libraries and production solvers default to.

## intuition
Ford-Fulkerson picks any augmenting path; if you pick badly the path length keeps swinging up and down, and on irrational capacities it can fail to terminate. Edmonds-Karp fixes this by always picking the shortest augmenting path (BFS), giving O(VE²). Dinic goes further: after one BFS, *push every augmenting path of that length at once* (the blocking flow), then BFS again. Each BFS strictly increases the shortest `s→t` distance, so at most V phases, and each phase is O(VE), giving O(V²E).

## visualization
```
Network (cap):     s --4--> a --3--> t
                   s --2--> b --2--> t   a --1--> b

Phase 1: BFS levels (residual = original)
   level(s)=0, level(a)=1, level(b)=1, level(t)=2
Blocking flow DFS on level graph:
   s->a->t  push 3       (a->t saturates)
   s->b->t  push 2       (s->b saturates)
   s->a->b->t  push 0    (a->t saturated; dead end pruned via 'iter[]')
Flow this phase = 5

Phase 2: BFS in residual.
   forward residual: s->a (1 left), a->b (1), b->t (0), a->t (0), s->b (0)
   reverse residual: a->s (3), t->a (3), b->a (0), b->s (2), t->b (2)
   level(t) = 4 > 2  -> still reachable, do another phase
Phase 3: BFS finds no s->t path. Done. Max flow = 5.
```

## bruteForce
Ford-Fulkerson with DFS-found augmenting paths: O(E · |f*|), where |f*| is the integral max flow. Pathological example on a graph with capacity 10⁹ runs 10⁹ DFS calls. Edmonds-Karp (BFS-found paths) cuts this to O(VE²) but still does one path per BFS.

## optimal
```
function dinic(G, s, t):
    flow = 0
    while bfs(G, s, t):              # builds level[]; returns true if t reachable
        iter = array of zeros        # next-edge pointer per vertex
        while true:
            pushed = dfs(s, INF)
            if pushed == 0: break
            flow += pushed
    return flow

function bfs(G, s, t):
    level = [-1]*n; level[s] = 0
    q = [s]
    while q:
        u = q.pop_front()
        for each residual edge u->v with cap > 0:
            if level[v] == -1:
                level[v] = level[u] + 1
                q.push_back(v)
    return level[t] != -1

function dfs(u, pushed):
    if u == t: return pushed
    while iter[u] < |G.adj[u]|:
        e = G.adj[u][iter[u]]
        v = e.to
        if e.cap > 0 and level[v] == level[u] + 1:
            d = dfs(v, min(pushed, e.cap))
            if d > 0:
                e.cap -= d
                e.rev.cap += d
                return d
        iter[u] += 1                 # dead edge for this phase
    return 0
```
The `iter[]` array is the secret sauce — once an edge from `u` leads to a dead end in this phase, it stays skipped until the next BFS, keeping per-phase work at O(VE).

## complexity
time: O(V² E) general, O(E sqrt(V)) on unit-capacity / bipartite-matching graphs, O(E sqrt(V)) on unit networks (König/Hopcroft-Karp bound)
space: O(V + E) for adjacency, level, iter, plus the BFS queue
notes: Phases bounded by V because shortest s→t distance strictly increases each phase. Blocking-flow DFS is O(VE) per phase via the saturate-or-skip amortization.

## pitfalls
- Forgetting the reverse residual edge with capacity 0; without it, augmenting along a "canceling" path is impossible and the algorithm finds suboptimal flow.
- Storing residual capacity by recomputing instead of mutating `e.cap` and `e.rev.cap` — slow and bug-prone.
- Adding both directions of an undirected edge as two pairs (one pair each) of forward/reverse — for undirected edges you want a single pair where both initial caps equal the edge weight.
- Resetting `iter[]` per *DFS call* instead of per *phase* — without the per-phase amortization the time blows up to O(VE²).
- Using `int` capacities when totals can overflow — use `long long` in C++/Java when flow can exceed 2³¹.

## interviewTips
- Lead with the reduction: "Bipartite matching reduces to max-flow with all capacities 1. Project selection reduces to min-cut, which is max-flow by max-flow-min-cut." Show you see flow as a tool, not an algorithm to memorize.
- Quote the bound and *why*: "V phases because shortest distance strictly increases. Each phase O(VE) via blocking flow with the iter[] pointer trick. Total O(V²E)."
- Be ready to derive max-flow-min-cut on the board: after termination, BFS from `s` in the residual graph; reachable side is `S`, unreachable is `T`. Edges from `S` to `T` form a min cut whose total capacity equals max flow.
- Mention production: Google's or-tools, NetworkX, and most ACM-ICPC team libraries implement Dinic. Push-relabel (HIPR) is faster on dense graphs but more complex.

## code.python
```python
from collections import deque

class Dinic:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]   # adj[u] = list of edge indices into self.edges
        self.edges = []                     # (to, cap)

    def add_edge(self, u, v, c):
        self.adj[u].append(len(self.edges)); self.edges.append([v, c])
        self.adj[v].append(len(self.edges)); self.edges.append([u, 0])

    def _bfs(self, s, t):
        self.level = [-1] * self.n
        self.level[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for ei in self.adj[u]:
                v, c = self.edges[ei]
                if c > 0 and self.level[v] == -1:
                    self.level[v] = self.level[u] + 1
                    q.append(v)
        return self.level[t] != -1

    def _dfs(self, u, t, pushed):
        if u == t:
            return pushed
        while self.it[u] < len(self.adj[u]):
            ei = self.adj[u][self.it[u]]
            v, c = self.edges[ei]
            if c > 0 and self.level[v] == self.level[u] + 1:
                d = self._dfs(v, t, min(pushed, c))
                if d > 0:
                    self.edges[ei][1] -= d
                    self.edges[ei ^ 1][1] += d
                    return d
            self.it[u] += 1
        return 0

    def max_flow(self, s, t):
        flow = 0
        while self._bfs(s, t):
            self.it = [0] * self.n
            while True:
                pushed = self._dfs(s, t, float('inf'))
                if pushed == 0:
                    break
                flow += pushed
        return flow
```

## code.javascript
```javascript
class Dinic {
  constructor(n) {
    this.n = n;
    this.adj = Array.from({ length: n }, () => []);
    this.edges = [];
  }
  addEdge(u, v, c) {
    this.adj[u].push(this.edges.length); this.edges.push([v, c]);
    this.adj[v].push(this.edges.length); this.edges.push([u, 0]);
  }
  _bfs(s, t) {
    this.level = new Array(this.n).fill(-1);
    this.level[s] = 0;
    const q = [s];
    while (q.length) {
      const u = q.shift();
      for (const ei of this.adj[u]) {
        const [v, c] = this.edges[ei];
        if (c > 0 && this.level[v] === -1) {
          this.level[v] = this.level[u] + 1;
          q.push(v);
        }
      }
    }
    return this.level[t] !== -1;
  }
  _dfs(u, t, pushed) {
    if (u === t) return pushed;
    while (this.it[u] < this.adj[u].length) {
      const ei = this.adj[u][this.it[u]];
      const [v, c] = this.edges[ei];
      if (c > 0 && this.level[v] === this.level[u] + 1) {
        const d = this._dfs(v, t, Math.min(pushed, c));
        if (d > 0) {
          this.edges[ei][1] -= d;
          this.edges[ei ^ 1][1] += d;
          return d;
        }
      }
      this.it[u]++;
    }
    return 0;
  }
  maxFlow(s, t) {
    let flow = 0;
    while (this._bfs(s, t)) {
      this.it = new Array(this.n).fill(0);
      while (true) {
        const d = this._dfs(s, t, Infinity);
        if (d === 0) break;
        flow += d;
      }
    }
    return flow;
  }
}
```

## code.java
```java
import java.util.*;

public class Dinic {
    int n;
    List<int[]> edges = new ArrayList<>();
    List<List<Integer>> adj = new ArrayList<>();
    int[] level, it;

    public Dinic(int n) {
        this.n = n;
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    }

    public void addEdge(int u, int v, int c) {
        adj.get(u).add(edges.size()); edges.add(new int[]{v, c});
        adj.get(v).add(edges.size()); edges.add(new int[]{u, 0});
    }

    private boolean bfs(int s, int t) {
        level = new int[n];
        Arrays.fill(level, -1);
        level[s] = 0;
        ArrayDeque<Integer> q = new ArrayDeque<>();
        q.add(s);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int ei : adj.get(u)) {
                int v = edges.get(ei)[0], c = edges.get(ei)[1];
                if (c > 0 && level[v] == -1) {
                    level[v] = level[u] + 1;
                    q.add(v);
                }
            }
        }
        return level[t] != -1;
    }

    private long dfs(int u, int t, long pushed) {
        if (u == t) return pushed;
        while (it[u] < adj.get(u).size()) {
            int ei = adj.get(u).get(it[u]);
            int v = edges.get(ei)[0], c = edges.get(ei)[1];
            if (c > 0 && level[v] == level[u] + 1) {
                long d = dfs(v, t, Math.min(pushed, c));
                if (d > 0) {
                    edges.get(ei)[1] -= d;
                    edges.get(ei ^ 1)[1] += d;
                    return d;
                }
            }
            it[u]++;
        }
        return 0;
    }

    public long maxFlow(int s, int t) {
        long flow = 0;
        while (bfs(s, t)) {
            it = new int[n];
            long pushed;
            while ((pushed = dfs(s, t, Long.MAX_VALUE)) > 0) flow += pushed;
        }
        return flow;
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

struct Dinic {
    struct Edge { int to; long long cap; };
    int n;
    vector<Edge> edges;
    vector<vector<int>> adj;
    vector<int> level, it;

    Dinic(int n) : n(n), adj(n) {}

    void addEdge(int u, int v, long long c) {
        adj[u].push_back(edges.size()); edges.push_back({v, c});
        adj[v].push_back(edges.size()); edges.push_back({u, 0});
    }

    bool bfs(int s, int t) {
        level.assign(n, -1);
        level[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int ei : adj[u]) {
                auto& e = edges[ei];
                if (e.cap > 0 && level[e.to] == -1) {
                    level[e.to] = level[u] + 1;
                    q.push(e.to);
                }
            }
        }
        return level[t] != -1;
    }

    long long dfs(int u, int t, long long pushed) {
        if (u == t) return pushed;
        for (; it[u] < (int)adj[u].size(); it[u]++) {
            int ei = adj[u][it[u]];
            auto& e = edges[ei];
            if (e.cap > 0 && level[e.to] == level[u] + 1) {
                long long d = dfs(e.to, t, min(pushed, e.cap));
                if (d > 0) {
                    e.cap -= d;
                    edges[ei ^ 1].cap += d;
                    return d;
                }
            }
        }
        return 0;
    }

    long long maxFlow(int s, int t) {
        long long flow = 0;
        while (bfs(s, t)) {
            it.assign(n, 0);
            while (long long d = dfs(s, t, LLONG_MAX)) flow += d;
        }
        return flow;
    }
};
```
