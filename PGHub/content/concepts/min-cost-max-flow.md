---
slug: min-cost-max-flow
module: graphs-flow-grids
title: Min-Cost Max-Flow
subtitle: Find the cheapest way to push maximum flow via successive shortest paths with reduced costs.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Part VI: Graph Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "cp-algorithms — Graph algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/graphs"
    type: repo
status: published
---

## intro
Min-cost max-flow (MCMF) generalizes max-flow: every edge has both a capacity and a per-unit cost, and we want the maximum flow whose total cost is minimum. The standard solution is the Successive Shortest Paths (SSP) algorithm — repeatedly push flow along the cheapest source-to-sink path in the residual graph until no augmenting path remains. The trick is handling the negative-cost edges introduced by residual arcs, which we solve with Johnson-style potentials so Dijkstra (not Bellman-Ford) can run every iteration.

## whyItMatters
Transportation networks (warehouses to stores), staff scheduling (people to shifts), and bandwidth allocation under priced links all reduce directly to MCMF. Many DP problems with K-disjoint-paths flavor — "pick K non-overlapping intervals maximizing value" — have an MCMF formulation that beats the DP when K is large. It is also the standard tool for assignment problems when the Hungarian algorithm is too rigid (variable supply, capacities > 1). Operations-research libraries (Google OR-Tools, Gurobi, CPLEX) ship MCMF as a first-class primitive because it underlies real-world logistics — Amazon FBA inventory rebalancing, Uber driver-to-rider matching, and FedEx hub-to-hub freight routing all reduce to MCMF instances solved in production every minute.

## intuition
Min-cost max-flow generalizes max-flow by adding a per-unit cost to each edge — the goal becomes "ship as much as possible at the cheapest aggregate price." The greedy intuition is: find the cheapest source-to-sink path in the residual graph, push as much flow as fits along it, repeat until no augmenting path remains. The subtlety is that pushing flow along an edge u to v with cost c creates a virtual reverse edge v to u with cost -c, representing the option to "cancel" that flow later if a better route appears. These negative-cost reverse edges break Dijkstra, which requires non-negative weights, so a naive implementation would have to use Bellman-Ford every iteration at O(V * E) per iteration — too slow. The Johnson-potentials trick saves us. Maintain a node potential h(v) initialized to 0 (or by one Bellman-Ford pass if the input graph has negative-cost edges). Define reduced cost `c'(u, v) = c(u, v) + h(u) - h(v)`. After each Dijkstra, update `h[v] += dist[v]` for all reachable v. The invariant maintained is that reduced costs are always non-negative — the previous Dijkstra established `h[v] <= h[u] + c(u, v)` for every edge, which rearranges to `c(u, v) + h[u] - h[v] >= 0`. So Dijkstra works on every iteration after the first, even though the residual graph contains negative-cost reverse edges. The deep insight is that potential functions can rewrite a weighted graph's edges to non-negative without changing shortest-path structure — a remarkable algebraic property that converts negative-edge problems into standard Dijkstra problems. The same trick powers Johnson's all-pairs shortest paths algorithm.

## visualization
```
        cap/cost
   s ---5/1--- a ---3/2--- t
   |                       ^
   +------4/3----b---5/1---+

Iter 1: cheapest path s->a->t, cost 3, bottleneck 3. Push 3.
Iter 2: cheapest path s->b->t, cost 4, bottleneck 4. Push 4.
Iter 3: try to push more through s->a (cap 2 left) ->
        a->t saturated, must use reverse edge b->s? no augmenting path. Stop.
Total flow: 7, total cost: 3*3 + 4*4 = 25.
```

## bruteForce
Run plain Ford-Fulkerson on capacities, ignoring cost — you get maximum flow but with no guarantee on price. Then try to rebalance: for every cycle in the residual graph with negative total cost, reroute flow around it (cycle-canceling). Correct but slow: finding a negative cycle is O(V·E), and the number of cancellation rounds can be large. SSP avoids ever creating a suboptimal flow in the first place.

## optimal
Successive Shortest Paths (SSP) with Johnson potentials. Initialize h[v] = 0 (or run one Bellman-Ford if original graph has negative-cost edges). Repeatedly run Dijkstra from s using reduced costs `c'(u, v) = c(u, v) + h(u) - h(v)`; if t is unreachable, halt. Otherwise push bottleneck flow along the augmenting path, then update `h[v] += dist[v]` for all reachable v so the next Dijkstra remains valid. Each iteration is O((V + E) log V); total iterations are at most F (the max flow value) or O(V * E) for unit-capacity bipartite matching specializations. Store edges with explicit reverse companions (index XOR 1 trick) so cancellation works in O(1).

```python
import heapq

class MCMF:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.edges = []                              # flat array; edges[i ^ 1] is reverse

    def add_edge(self, u, v, cap, cost):
        self.adj[u].append(len(self.edges)); self.edges.append([v, cap, cost])
        self.adj[v].append(len(self.edges)); self.edges.append([u, 0, -cost])  # reverse

    def solve(self, s, t):
        INF = float("inf")
        h = [0] * self.n
        total_flow = total_cost = 0
        while True:
            # Dijkstra with reduced costs c'(u,v) = c + h[u] - h[v] (non-negative).
            dist = [INF] * self.n; dist[s] = 0
            prev_edge = [-1] * self.n
            pq = [(0, s)]
            while pq:
                d, u = heapq.heappop(pq)
                if d > dist[u]: continue
                for eid in self.adj[u]:
                    v, cap, cost = self.edges[eid]
                    if cap > 0:
                        nd = d + cost + h[u] - h[v]   # reduced cost
                        if nd < dist[v]:
                            dist[v] = nd; prev_edge[v] = eid
                            heapq.heappush(pq, (nd, v))
            if dist[t] == INF: break
            # Update potentials so reduced costs remain non-negative next iteration.
            for v in range(self.n):
                if dist[v] < INF: h[v] += dist[v]
            # Find bottleneck along augmenting path, then push flow.
            push = INF; v = t
            while v != s:
                push = min(push, self.edges[prev_edge[v]][1])
                v = self.edges[prev_edge[v] ^ 1][0]
            v = t
            while v != s:
                self.edges[prev_edge[v]][1] -= push
                self.edges[prev_edge[v] ^ 1][1] += push
                v = self.edges[prev_edge[v] ^ 1][0]
            total_flow += push
            total_cost += push * h[t]                # h[t] is the true path cost
        return total_flow, total_cost
```

The `index XOR 1` trick relies on adding edges in pairs (forward, then reverse), so `edges[eid ^ 1]` is always the companion reverse edge — O(1) cancellation. The `total_cost += push * h[t]` uses the true (unreduced) cost because h[t] equals the cumulative true distance to t.

## complexity
time: O(F · (V+E) log V) where F is the max flow value; O(V·E²) bound when F is polynomial in V
space: O(V + E) for adjacency, capacities, costs, potentials, and the priority queue
notes: For integer capacities and integer costs, the algorithm always terminates with integer flow values (integrality theorem). If original graph contains negative-cost arcs, one initial Bellman-Ford pass is required to seed h[]; afterwards every iteration stays positive.

## pitfalls
- Storing edges without paired reverse entries — cancellation needs O(1) access to the reverse edge.
- Running Dijkstra without potentials when residual arcs have negative cost — silent incorrect answers.
- Forgetting to update potentials with `h[v] += dist[v]` — second iteration uses stale reductions.
- Saturating an edge but leaving its reverse capacity at 0 — the reverse must start at 0 and gain capacity as flow is pushed.
- Computing total cost as sum of edge_cost × flow_on_edge across original edges only — reverse edges already net out, so iterate only original edges (index even).

## interviewTips
- Sketch the residual graph and call out reverse edges explicitly — interviewers love seeing the cancellation insight.
- State the reduction proof: `c'(u,v) ≥ 0` because the previous Dijkstra established `h[v] ≤ h[u] + c(u,v)`.
- If the problem is unit-capacity bipartite (assignment), mention the Hungarian algorithm as a faster alternative.
- When asked about scaling: "MCMF with capacity scaling drops the dependence on F to log U" — name-drop without coding it.

## code.python
```python
import heapq

class MCMF:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.edges = []

    def add_edge(self, u, v, cap, cost):
        self.adj[u].append(len(self.edges)); self.edges.append([v, cap, cost])
        self.adj[v].append(len(self.edges)); self.edges.append([u, 0, -cost])

    def solve(self, s, t):
        INF = float('inf')
        h = [0] * self.n
        total_flow = total_cost = 0
        while True:
            dist = [INF] * self.n; dist[s] = 0
            prev_edge = [-1] * self.n
            pq = [(0, s)]
            while pq:
                d, u = heapq.heappop(pq)
                if d > dist[u]: continue
                for eid in self.adj[u]:
                    v, cap, cost = self.edges[eid]
                    if cap > 0:
                        nd = d + cost + h[u] - h[v]
                        if nd < dist[v]:
                            dist[v] = nd; prev_edge[v] = eid
                            heapq.heappush(pq, (nd, v))
            if dist[t] == INF: break
            for v in range(self.n):
                if dist[v] < INF: h[v] += dist[v]
            push = INF; v = t
            while v != s:
                eid = prev_edge[v]
                push = min(push, self.edges[eid][1])
                v = self.edges[eid ^ 1][0]
            v = t
            while v != s:
                eid = prev_edge[v]
                self.edges[eid][1] -= push
                self.edges[eid ^ 1][1] += push
                v = self.edges[eid ^ 1][0]
            total_flow += push
            total_cost += push * h[t]
        return total_flow, total_cost
```

## code.javascript
```javascript
class MCMF {
  constructor(n) { this.n = n; this.adj = Array.from({length:n}, () => []); this.edges = []; }
  addEdge(u, v, cap, cost) {
    this.adj[u].push(this.edges.length); this.edges.push([v, cap, cost]);
    this.adj[v].push(this.edges.length); this.edges.push([u, 0, -cost]);
  }
  solve(s, t) {
    const INF = Infinity, n = this.n;
    const h = new Array(n).fill(0);
    let flow = 0, cost = 0;
    while (true) {
      const dist = new Array(n).fill(INF), prev = new Array(n).fill(-1);
      dist[s] = 0;
      const pq = [[0, s]];
      while (pq.length) {
        pq.sort((a,b) => b[0]-a[0]);
        const [d, u] = pq.pop();
        if (d > dist[u]) continue;
        for (const eid of this.adj[u]) {
          const [v, cap, c] = this.edges[eid];
          if (cap > 0) {
            const nd = d + c + h[u] - h[v];
            if (nd < dist[v]) { dist[v] = nd; prev[v] = eid; pq.push([nd, v]); }
          }
        }
      }
      if (dist[t] === INF) break;
      for (let v = 0; v < n; v++) if (dist[v] < INF) h[v] += dist[v];
      let push = INF, v = t;
      while (v !== s) {
        const eid = prev[v];
        push = Math.min(push, this.edges[eid][1]);
        v = this.edges[eid ^ 1][0];
      }
      v = t;
      while (v !== s) {
        const eid = prev[v];
        this.edges[eid][1] -= push;
        this.edges[eid ^ 1][1] += push;
        v = this.edges[eid ^ 1][0];
      }
      flow += push; cost += push * h[t];
    }
    return { flow, cost };
  }
}
```

## code.java
```java
public class MCMF {
    int n;
    List<int[]> edges = new ArrayList<>();
    List<List<Integer>> adj = new ArrayList<>();

    public MCMF(int n) {
        this.n = n;
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    }

    public void addEdge(int u, int v, int cap, int cost) {
        adj.get(u).add(edges.size()); edges.add(new int[]{v, cap, cost});
        adj.get(v).add(edges.size()); edges.add(new int[]{u, 0, -cost});
    }

    public long[] solve(int s, int t) {
        long[] h = new long[n];
        long flow = 0, cost = 0;
        while (true) {
            long[] dist = new long[n];
            Arrays.fill(dist, Long.MAX_VALUE);
            dist[s] = 0;
            int[] prev = new int[n]; Arrays.fill(prev, -1);
            PriorityQueue<long[]> pq = new PriorityQueue<>((a,b) -> Long.compare(a[0], b[0]));
            pq.add(new long[]{0, s});
            while (!pq.isEmpty()) {
                long[] top = pq.poll();
                long d = top[0]; int u = (int) top[1];
                if (d > dist[u]) continue;
                for (int eid : adj.get(u)) {
                    int[] e = edges.get(eid);
                    if (e[1] > 0) {
                        long nd = d + e[2] + h[u] - h[e[0]];
                        if (nd < dist[e[0]]) {
                            dist[e[0]] = nd; prev[e[0]] = eid;
                            pq.add(new long[]{nd, e[0]});
                        }
                    }
                }
            }
            if (dist[t] == Long.MAX_VALUE) break;
            for (int v = 0; v < n; v++) if (dist[v] < Long.MAX_VALUE) h[v] += dist[v];
            long push = Long.MAX_VALUE; int v = t;
            while (v != s) {
                int eid = prev[v];
                push = Math.min(push, edges.get(eid)[1]);
                v = edges.get(eid ^ 1)[0];
            }
            v = t;
            while (v != s) {
                int eid = prev[v];
                edges.get(eid)[1] -= (int) push;
                edges.get(eid ^ 1)[1] += (int) push;
                v = edges.get(eid ^ 1)[0];
            }
            flow += push; cost += push * h[t];
        }
        return new long[]{flow, cost};
    }
}
```

## code.cpp
```cpp
struct MCMF {
    struct Edge { int to, cap, cost; };
    int n;
    vector<Edge> edges;
    vector<vector<int>> adj;

    MCMF(int n) : n(n), adj(n) {}

    void addEdge(int u, int v, int cap, int cost) {
        adj[u].push_back(edges.size()); edges.push_back({v, cap, cost});
        adj[v].push_back(edges.size()); edges.push_back({u, 0, -cost});
    }

    pair<long long, long long> solve(int s, int t) {
        vector<long long> h(n, 0);
        long long flow = 0, cost = 0;
        const long long INF = LLONG_MAX;
        while (true) {
            vector<long long> dist(n, INF);
            vector<int> prev(n, -1);
            dist[s] = 0;
            priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
            pq.push({0, s});
            while (!pq.empty()) {
                auto [d, u] = pq.top(); pq.pop();
                if (d > dist[u]) continue;
                for (int eid : adj[u]) {
                    auto& e = edges[eid];
                    if (e.cap > 0) {
                        long long nd = d + e.cost + h[u] - h[e.to];
                        if (nd < dist[e.to]) {
                            dist[e.to] = nd; prev[e.to] = eid;
                            pq.push({nd, e.to});
                        }
                    }
                }
            }
            if (dist[t] == INF) break;
            for (int v = 0; v < n; v++) if (dist[v] < INF) h[v] += dist[v];
            long long push = INF; int v = t;
            while (v != s) {
                int eid = prev[v];
                push = min(push, (long long) edges[eid].cap);
                v = edges[eid ^ 1].to;
            }
            v = t;
            while (v != s) {
                int eid = prev[v];
                edges[eid].cap -= push;
                edges[eid ^ 1].cap += push;
                v = edges[eid ^ 1].to;
            }
            flow += push; cost += push * h[t];
        }
        return {flow, cost};
    }
};
```
