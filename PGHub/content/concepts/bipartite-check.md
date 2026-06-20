---
slug: bipartite-check
module: graphs-traversal
title: Bipartite Graph Check
subtitle: 2-color the graph via BFS or DFS — if every edge crosses colors, the graph is bipartite.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Check whether a graph is Bipartite or Not — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/bipartite-graph/"
    type: blog
  - title: "Graph coloring — cp-algorithms"
    url: "https://cp-algorithms.com/graph/bridge-searching.html"
    type: blog
  - title: "TheAlgorithms/Python — bipartite_graph.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/check_bipatrite.py"
    type: repo
status: published
---

## intro
A graph is bipartite if its vertices can be split into two sets so every edge has one endpoint in each set — equivalently, the graph is 2-colorable. The standard check runs a BFS or DFS from each unvisited vertex, coloring layer by layer; if any edge connects same-colored endpoints, the graph is not bipartite.

## whyItMatters
- **Maximum bipartite matching** (Hopcroft-Karp 1973, Hungarian algorithm 1955) is the foundation of job-to-machine assignment, ad-to-slot allocation in real-time bidding (Google AdX, Meta Ads), kidney-exchange matching programs, and college admissions matching.
- **2-SAT solving** reduces to strongly-connected-component analysis on an implication graph that must be bipartite-like; tools like MiniSat exploit this structure.
- **Compiler register allocation** uses bipartite checks as a sub-step in interference-graph two-coloring decisions.
- **Distributed-systems leader election** with two roles (master/replica) and **CRDT replica-pair conflict detection** assume the underlying interaction graph is bipartite.
- The classical theorem (König 1936) — a graph is bipartite iff it contains no odd cycle — turns this routine 2-coloring traversal into a complete decision procedure.

## intuition
The technique exists because 2-colorability is a global property that the local structure of BFS layering can verify in a single sweep. Pick any vertex, color it 0, and treat the BFS frontier as a strict alternation between color classes. The decisive observation: in any traversal tree of an undirected graph, every non-tree edge is either a back edge or a cross edge, and in a bipartite graph all such edges connect vertices at distances of different parity from the root. If even one back edge connects vertices at the same parity, you have just constructed an odd cycle: travel from one endpoint up to the lowest common ancestor (an even number of edges if the parities match) then down to the other endpoint (the same parity again) plus the offending edge itself — odd total.

This is why a single BFS or DFS suffices: any odd cycle must produce a same-color adjacency at some BFS layer, and the algorithm reports failure the instant it sees one. If no such adjacency appears across all components, you have a witnessing 2-coloring, which is itself a constructive proof of bipartiteness. Connected components are handled independently because bipartiteness is a per-component property — a graph is bipartite iff every connected component is. The algorithm therefore restarts from each unvisited vertex, just like any connected-components traversal.

## visualization
Graph with edges 1-2, 2-3, 3-4, 4-1, 1-5. Start BFS at 1, color 0. Layer 1 neighbors: 2 → color 1, 5 → color 1. Layer 2: 2's neighbor 3 → color 0, 4 hasn't been seen yet but 1's neighbor list also yields 4 — actually 4 is a neighbor of 1, so 4 → color 1 in layer 1. Layer 2: 3's neighbor 4 — but 4 is color 1 and 3 is color 0, so edge (3, 4) is fine. Every edge crosses colors. Bipartite. Now add edge 2-4: 2 is color 1, 4 is color 1 — same color, conflict, not bipartite (odd cycle 1-2-4-1 of length 3).

## bruteForce
Try every 2-coloring of the n vertices and check whether each edge has endpoints of different colors. 2^n colorings, each checked in O(E). Exponential. Even with smart pruning, the asymptotic doesn't beat the linear BFS approach, so this is purely an exercise in why you reach for traversal.

## optimal
**Technique: BFS-based 2-coloring with conflict detection.** Optimal because any algorithm that decides bipartiteness must look at every edge — an unread edge could connect two same-color vertices and flip the answer. BFS does exactly that work, so O(V + E) is information-theoretically tight.

```python
from collections import deque

def is_bipartite(n, adj):
    color = [-1] * n                           # -1 = unvisited
    for s in range(n):                         # outer loop handles disconnected graphs
        if color[s] != -1:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]    # alternate parity per BFS layer
                    q.append(v)
                elif color[v] == color[u]:
                    return False               # witnesses an odd cycle
    return True
```

Key lines: `color[v] = 1 - color[u]` enforces the layered parity that defines a bipartition; toggling between 0 and 1 is the entire algorithmic content. `elif color[v] == color[u]: return False` is the König odd-cycle detector — a same-color adjacency is a constructive proof that no 2-coloring exists. The outer `for s in range(n)` loop ensures correctness on disconnected graphs; without it, an isolated odd cycle in another component would be missed.

The same algorithm works with DFS, but iterative BFS is preferred in production because Python's default recursion limit (1000) and Java's bounded stack size break on graphs with long chains. For interview follow-ups: to extract a *witness odd cycle*, store BFS parents and, on conflict, walk both endpoints up to their LCA. To extend to multipartite (k-coloring), the answer changes — k-coloring for k ≥ 3 is NP-hard (Karp 1972). Bipartite testing is the rare graph-coloring problem that admits a linear-time decision procedure precisely because k = 2 hits the König equivalence with odd cycles.

## complexity
time: O(V + E)
space: O(V) for the color array and the BFS queue
notes: Works on undirected graphs. For directed graphs, "bipartite" usually means the underlying undirected graph is bipartite — run the same check after dropping direction. Disconnected graphs need an outer loop over starting vertices; coloring within one component does not propagate to the next.

## pitfalls
- Returning early after the first component succeeds — you must check every component before declaring the whole graph bipartite.
- Reading "bipartite" as "has two parts of equal size" — bipartite only means 2-colorable; the parts can be wildly different sizes.
- Using DFS recursion on graphs with 10^5+ vertices in Python — overflow the call stack, prefer iterative BFS or DFS.
- Forgetting self-loops: a self-loop (v, v) makes the graph non-bipartite trivially since v cannot differ from itself; many test sets sneak this in.
- Mixing color "0" (unvisited sentinel) and color "0" (one of two colors) — use a separate `visited` array or set the sentinel to -1.

## interviewTips
- State the equivalence up front: "Bipartite iff no odd cycle iff 2-colorable; I'll 2-color with BFS."
- If asked to "find" the conflict, return the edge that triggered the mismatch — interviewers often want a witness, not just a boolean.
- Mention applications: stable matching, job-to-machine scheduling, and the fact that bipartite matching has polynomial-time max-flow solutions while general matching needs Edmonds' blossom algorithm.

## code.python
```python
from collections import deque

def is_bipartite(n, adj):
    color = [-1] * n
    for s in range(n):
        if color[s] != -1: continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False, color
    return True, color
```

## code.javascript
```javascript
function isBipartite(n, adj) {
  const color = new Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s];
    let head = 0;
    while (head < q.length) {
      const u = q[head++];
      for (const v of adj[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; q.push(v); }
        else if (color[v] === color[u]) return { ok: false, color };
      }
    }
  }
  return { ok: true, color };
}
```

## code.java
```java
class Bipartite {
    boolean isBipartite(int n, java.util.List<java.util.List<Integer>> adj) {
        int[] color = new int[n];
        java.util.Arrays.fill(color, -1);
        for (int s = 0; s < n; s++) {
            if (color[s] != -1) continue;
            color[s] = 0;
            java.util.Deque<Integer> q = new java.util.ArrayDeque<>();
            q.offer(s);
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int v : adj.get(u)) {
                    if (color[v] == -1) { color[v] = 1 - color[u]; q.offer(v); }
                    else if (color[v] == color[u]) return false;
                }
            }
        }
        return true;
    }
}
```

## code.cpp
```cpp
bool isBipartite(int n, vector<vector<int>>& adj) {
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) { color[v] = 1 - color[u]; q.push(v); }
                else if (color[v] == color[u]) return false;
            }
        }
    }
    return true;
}
```
