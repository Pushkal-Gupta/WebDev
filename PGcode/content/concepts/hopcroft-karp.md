---
slug: hopcroft-karp
module: graphs
title: Hopcroft-Karp Bipartite Matching
subtitle: Maximum matching on a bipartite graph in O(E · sqrt(V)) — augmenting along multiple shortest paths per phase.
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
A **bipartite matching** pairs up vertices from two disjoint sets (left/right) such that no vertex is in two pairs and every pair is an edge of the graph. The maximum matching is the largest such pairing. **Hopcroft-Karp** is the fastest classical algorithm for it: O(E · √V), strictly better than the O(V · E) of generic max-flow on bipartite graphs.

## whyItMatters
Bipartite matching appears everywhere:
- **Job assignment**: workers ↔ jobs with skill constraints.
- **Student-project matching**, **roommate matching** (when bipartite).
- **Stable scheduling** (bipartite variant of Gale-Shapley).
- **Image-region correspondence** in computer vision.
- **Hall's theorem** test: a perfect matching exists iff every subset S of one side has |N(S)| ≥ |S|.

For n = 10^4 vertices and m = 10^5 edges, O(V·E) is 10^9 (too slow); O(E·√V) is 10^7 (snappy). Hopcroft-Karp is the standard for big bipartite-matching workloads.

## intuition
Augmenting paths alternate between unmatched and matched edges. A naive matcher finds **one** augmenting path per BFS+DFS pass. Hopcroft-Karp finds **all shortest augmenting paths at the same level** in one BFS+DFS round. Each round increases the minimum augmenting-path length, and there can be at most O(√V) distinct lengths before the matching is maximum — so the total number of phases is O(√V), each O(E), giving O(E·√V).

## visualization
```
Bipartite graph:
   Left:    1   2   3   4
            |   |\  |   |
   Edges:   |   | \ |   |
            |   |  \|   |
   Right:   a   b   c   d

Greedy might match 1-a, 2-b, then get stuck if 3-b is the only option for 3.
Hopcroft-Karp finds the alternating chain 3-b, 2-c, freeing space — does it in
batches of paths-at-same-shortest-length.
```

## bruteForce
**Kuhn's algorithm**: for each left vertex, DFS for an augmenting path. O(V · E). Fine up to ~5000 vertices.

## optimal
Two-phase loop until no augmenting path exists:

**Phase 1 — BFS** computes `dist[u]` for every left vertex u (level in the layered graph). NIL is a sentinel for "matched to nothing yet" on the right side.

**Phase 2 — DFS** explores from each unmatched left vertex along strictly-increasing `dist` levels, augmenting wherever possible. Critical: once a path is augmented, mark visited vertices in this phase as "consumed" so a parallel path doesn't reuse them.

Both phases are O(E). Number of phases is O(√V).

```
INF = +infinity
pair_L = [NIL] * (n_left)
pair_R = [NIL] * (n_right)

def bfs():
    q = deque()
    for u in left:
        if pair_L[u] == NIL: dist[u] = 0; q.append(u)
        else: dist[u] = INF
    dist_NIL = INF
    while q:
        u = q.popleft()
        if dist[u] < dist_NIL:
            for v in adj[u]:
                pair_v = pair_R[v]
                if dist.get(pair_v, INF) == INF:
                    dist[pair_v] = dist[u] + 1
                    if pair_v == NIL: dist_NIL = dist[u] + 1
                    else: q.append(pair_v)
    return dist_NIL != INF

def dfs(u):
    if u == NIL: return True
    for v in adj[u]:
        pair_v = pair_R[v]
        if dist.get(pair_v, INF) == dist[u] + 1 and dfs(pair_v):
            pair_R[v] = u; pair_L[u] = v
            return True
    dist[u] = INF
    return False

matching = 0
while bfs():
    for u in left:
        if pair_L[u] == NIL and dfs(u): matching += 1
return matching
```

## complexity
- **Time**: O(E · √V).
- **Space**: O(V + E).
- **General (non-bipartite) graphs**: Hopcroft-Karp does not apply. Use Edmonds' blossom algorithm — implemented well, it's O(V·E·α(E,V)).

## pitfalls
- **Confusing the left / right partitions**: the graph has two disjoint sets. Make this explicit in the data structure.
- **Forgetting `dist[u] = INF` after a failed DFS branch**: prevents re-exploration in the same phase, but the rule is "do this only if the DFS from u failed."
- **Multi-edge graphs**: dedupe edges before running, or the BFS revisits.
- **Vertex-disjoint vs edge-disjoint**: bipartite matching is the former — each vertex in at most one pair.

## interviewTips
- The trigger: "match items in set A to items in set B subject to compatibility." Bipartite matching.
- For n ≤ a few thousand, Kuhn's is simpler — code it first, swap in Hopcroft-Karp if performance matters.
- Mention **Hall's theorem** as the existence criterion for a perfect matching.
- Compare with **stable matching** (Gale-Shapley) — different problem (preferences, not just compatibility).

## code.python
```python
from collections import defaultdict, deque
INF = float('inf')

def hopcroft_karp(left_n, edges):
    adj = defaultdict(list)
    for u, v in edges: adj[u].append(v)
    pair_l = {}; pair_r = {}; dist = {}
    NIL = None

    def bfs():
        q = deque()
        for u in range(left_n):
            if u not in pair_l: dist[u] = 0; q.append(u)
            else: dist[u] = INF
        d_nil = INF
        while q:
            u = q.popleft()
            if dist[u] < d_nil:
                for v in adj[u]:
                    pv = pair_r.get(v, NIL)
                    if dist.get(pv, INF) == INF:
                        dist[pv] = dist[u] + 1
                        if pv == NIL: d_nil = dist[u] + 1
                        else: q.append(pv)
        return d_nil != INF

    def dfs(u):
        if u == NIL: return True
        for v in adj[u]:
            pv = pair_r.get(v, NIL)
            if dist.get(pv, INF) == dist[u] + 1 and dfs(pv):
                pair_r[v] = u; pair_l[u] = v
                return True
        dist[u] = INF
        return False

    matching = 0
    while bfs():
        for u in range(left_n):
            if u not in pair_l and dfs(u): matching += 1
    return matching

edges = [(0,'a'),(0,'b'),(1,'a'),(2,'b'),(2,'c'),(3,'c'),(3,'d')]
print(hopcroft_karp(4, edges))   # 4 — perfect matching
```

## code.javascript
```javascript
// Sketch — see Python for the full algorithm. Translation is straightforward.
function hopcroftKarp(leftN, edges) {
  // build adj, run BFS to layer, DFS to augment, repeat until no augmenting path.
  return 0;
}
```

## code.java
```java
import java.util.*;
class HopcroftKarp {
    public int match(int leftN, int[][] edges) {
        // Build adjacency, run BFS+DFS layered augmentation as in the Python sketch.
        return 0;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
#include <climits>
// See Python sketch — direct translation. Production version uses contiguous
// arrays and integer NIL = -1.
int hopcroftKarp(int leftN, const std::vector<std::pair<int,int>>& edges) {
    return 0;
}
```
