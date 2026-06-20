---
slug: tree-diameter
module: trees-advanced-queries
title: Tree Diameter
subtitle: Find the longest path in a tree with two BFS / DFS passes in O(n).
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Tree Diameter — cp-algorithms"
    url: "https://cp-algorithms.com/graph/tree_painting.html"
    type: blog
  - title: "Diameter of a Binary Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/diameter-of-a-binary-tree/"
    type: blog
  - title: "TheAlgorithms/Python — bfs.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/breadth_first_search.py"
    type: repo
status: published
---

## intro
The diameter of a tree is the number of edges (or sum of edge weights) on the longest path between any two nodes. The two-pass algorithm computes it in O(n): pick any node, BFS to find the farthest node u; then BFS again from u to find the farthest node v. The path u → v is the diameter. Beautifully simple, proven correct in a few lines.

## whyItMatters
- **Network diameter analysis**: ISPs and CDNs (Cloudflare, Akamai, Fastly) compute graph diameters on their topology graphs to bound worst-case latency between PoPs; the same primitive feeds capacity planning.
- **Phylogenetic tree analysis** (PHYLIP, MEGA, RAxML) uses tree diameter as a measure of evolutionary distance between the two most-diverged taxa in a clade.
- **Social-network analysis** (Facebook Graph API, Twitter influence measurement) treats the diameter of subgraphs as a measure of "social distance" — the longest acquaintance chain within a community.
- **Compiler call-graph optimisation**: GCC and LLVM use diameter-like metrics on inlining-decision graphs to predict worst-case inlining-cascade depth.
- **Tree-DP problems**: tree center (the midpoint of the diameter, minimum-eccentricity vertex), k-th diameter, longest path through every node — all build on the same two-pass primitive.
- **Game level-design**: roguelike map generators use tree diameter to size dungeons so that the longest required traversal is bounded — a play-balancing metric.

## intuition
The algorithm exists because the naïve "for every pair, compute the path length" approach is O(n²) pair queries times O(n) BFS per query = O(n³), and even all-pairs shortest paths via repeated BFS is O(n²). The escape route — two BFS passes — exploits a non-obvious structural property: the farthest vertex from any starting vertex is always an endpoint of some diameter.

The proof is by case analysis. Suppose the diameter is the path (a, b), and pick any starting vertex x. Let u be the farthest vertex from x. If x = a or x = b, then u = b or u = a respectively (by definition of farthest), and we're done. Otherwise consider where x's path meets the (a, b) path — call the meeting vertex y (it exists and is unique because trees have unique paths between any two vertices). Then dist(x, u) = dist(x, y) + dist(y, u), and dist(x, a) = dist(x, y) + dist(y, a), dist(x, b) = dist(x, y) + dist(y, b). Since u is the farthest from x, dist(y, u) ≥ max(dist(y, a), dist(y, b)). But if u were neither a nor b, then replacing one endpoint of the diameter with u would yield a strictly longer path, contradicting the diameter assumption. So u ∈ {a, b}.

This is why "BFS from any vertex, then BFS from the farthest vertex found" computes the diameter in two passes. The first pass discovers one diameter endpoint; the second pass measures the distance from it to the other endpoint, which by the proof is the global maximum distance. Each pass is O(n + m) = O(n) on a tree (m = n − 1). Total: O(n) time, O(n) memory — information-theoretically tight because any algorithm must read every edge at least once.

The two-pass theorem requires non-negative edge weights; for negative weights the case analysis breaks and you must fall back to tree-DP that computes "best down-path through every node" and aggregates. The DP variant is also useful when you need per-node diameter information (longest path through each vertex), not just the global maximum.

## visualization
Tree: 1-2, 2-3, 2-4, 4-5, 4-6. BFS from 1: distances {1:0, 2:1, 3:2, 4:2, 5:3, 6:3}. Farthest = 5 (tie with 6; pick 5). BFS from 5: {5:0, 4:1, 2:2, 6:2, 1:3, 3:3}. Farthest = 1 or 3, distance 3. Diameter = 3, achieved by path 1-2-4-5 or 3-2-4-5.

## bruteForce
For every pair (u, v) compute the shortest path between them (it is unique in a tree) and take the max. O(n^2) pair-paths, O(n) each = O(n^3). Even with all-pairs shortest paths via repeated BFS, O(n^2). Acceptable to n ~ 10^4; useless above that.

## optimal
**Technique: two-pass BFS — discover one diameter endpoint, then measure from it.** O(n) time and O(n) space, information-theoretically optimal because any algorithm must read every edge at least once.

```python
from collections import deque

def diameter(n, edges):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b); g[b].append(a)

    def bfs(src):
        dist = [-1] * n
        dist[src] = 0
        q = deque([src])
        far = src                                  # tracks farthest-so-far node
        while q:
            v = q.popleft()
            for u in g[v]:
                if dist[u] == -1:
                    dist[u] = dist[v] + 1
                    if dist[u] > dist[far]:
                        far = u
                    q.append(u)
        return far, dist[far]

    u, _ = bfs(0)        # pass 1: from arbitrary start, find one diameter endpoint
    v, d = bfs(u)        # pass 2: from u, the farthest distance is the diameter
    return d
```

Key lines: `far` is updated inline during BFS — there's no need for a separate argmax pass over the distance array. The first call `u, _ = bfs(0)` returns one endpoint of *some* diameter (by the case-analysis proof in the intuition); the second call `v, d = bfs(u)` measures the longest distance from that endpoint, which by definition reaches the other diameter endpoint. The diameter value is `d`; the path itself can be recovered by recording parent pointers in the second BFS and walking back from `v` to `u`.

For weighted trees with positive weights, replace BFS with DFS accumulating edge weights — the same two-pass theorem holds. For trees with negative-weight edges (rare but possible in transformation contexts), the two-pass proof breaks because dist(y, u) ≥ max(dist(y, a), dist(y, b)) can fail when negatives twist the metric; fall back to tree-DP:

```python
def diameter_dp(root, g):
    best = [0]
    def dfs(v, parent):
        m1 = m2 = 0                                # two longest down-paths
        for u in g[v]:
            if u == parent: continue
            depth = dfs(u, v) + 1
            if depth > m1: m1, m2 = depth, m1
            elif depth > m2: m2 = depth
        best[0] = max(best[0], m1 + m2)            # longest path through v
        return m1
    dfs(root, -1)
    return best[0]
```

The DP variant returns diameter as the max over all nodes of (best down-path through left subtree + best down-path through right subtree) — also O(n). It generalises to "longest path through every node" (useful for queries) and to weighted trees with arbitrary signs.

**Why two BFS, not one?** A single BFS from an arbitrary start returns the farthest vertex *from that start* — which by the theorem is one diameter endpoint but the algorithm doesn't yet know what the diameter is. The second BFS measures from that endpoint, which yields the diameter. **Why not Floyd-Warshall?** O(n³) for what trees solve in O(n) — wasteful. **Common bugs**: doing only one BFS (returns wrong answer unless start happens to be on a diameter); using DFS recursion on a 10⁵-node tree in Python without raising recursion limit (stack overflow); forgetting that disconnected forests need per-component handling.

## complexity
time: O(n) — two BFS / DFS traversals
space: O(n) for the distance / parent arrays and queue
notes: The DP variant returns diameter as max over nodes of (best down-path through left child + best down-path through right child), also O(n) — useful when you also need the per-node "longest path through v."

## pitfalls
- Doing only one BFS — that returns "farthest node from s," not the diameter, unless s happens to already lie on a diameter.
- Forgetting that two-pass requires non-negative weights; negative weights demand DP-on-trees.
- For a forest (disconnected), the algorithm finds the diameter per component; remember to iterate all components.
- Using recursion in Python on a 10^5-node tree without raising the recursion limit or switching to BFS.

## interviewTips
- Sell the elegance: "Two BFS passes, total O(n). No DP needed." Interviewers love minimal solutions.
- If asked for the path itself, also record parent pointers in the second BFS and walk back from v.
- Mention the DP-on-trees variant for the "longest path through each node" follow-up — it generalizes to weighted and to other tree-DP problems.
- Mention that the tree center sits at the middle of the diameter — that detail unlocks "minimum-height re-rooting" follow-ups.

## code.python
```python
from collections import deque

def diameter(n: int, edges):
    g = [[] for _ in range(n)]
    for a, b in edges:
        g[a].append(b); g[b].append(a)

    def bfs(src):
        dist = [-1] * n
        dist[src] = 0
        q = deque([src])
        far = src
        while q:
            v = q.popleft()
            for u in g[v]:
                if dist[u] == -1:
                    dist[u] = dist[v] + 1
                    if dist[u] > dist[far]:
                        far = u
                    q.append(u)
        return far, dist[far]

    u, _ = bfs(0)
    v, d = bfs(u)
    return d
```

## code.javascript
```javascript
function diameter(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { g[a].push(b); g[b].push(a); }
  function bfs(src) {
    const dist = new Array(n).fill(-1);
    dist[src] = 0;
    const q = [src];
    let head = 0, far = src;
    while (head < q.length) {
      const v = q[head++];
      for (const u of g[v]) {
        if (dist[u] === -1) {
          dist[u] = dist[v] + 1;
          if (dist[u] > dist[far]) far = u;
          q.push(u);
        }
      }
    }
    return [far, dist[far]];
  }
  const [u] = bfs(0);
  const [, d] = bfs(u);
  return d;
}
```

## code.java
```java
public int diameter(int n, int[][] edges) {
    java.util.List<java.util.List<Integer>> g = new java.util.ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new java.util.ArrayList<>());
    for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }
    int[] u = bfs(0, g, n);
    int[] v = bfs(u[0], g, n);
    return v[1];
}

int[] bfs(int src, java.util.List<java.util.List<Integer>> g, int n) {
    int[] dist = new int[n];
    java.util.Arrays.fill(dist, -1);
    dist[src] = 0;
    java.util.Deque<Integer> q = new java.util.ArrayDeque<>();
    q.add(src);
    int far = src;
    while (!q.isEmpty()) {
        int v = q.poll();
        for (int u : g.get(v)) {
            if (dist[u] == -1) {
                dist[u] = dist[v] + 1;
                if (dist[u] > dist[far]) far = u;
                q.add(u);
            }
        }
    }
    return new int[]{far, dist[far]};
}
```

## code.cpp
```cpp
pair<int,int> bfs(int src, vector<vector<int>>& g, int n) {
    vector<int> dist(n, -1);
    dist[src] = 0;
    queue<int> q;
    q.push(src);
    int far = src;
    while (!q.empty()) {
        int v = q.front(); q.pop();
        for (int u : g[v]) {
            if (dist[u] == -1) {
                dist[u] = dist[v] + 1;
                if (dist[u] > dist[far]) far = u;
                q.push(u);
            }
        }
    }
    return {far, dist[far]};
}

int diameter(int n, vector<pair<int,int>>& edges) {
    vector<vector<int>> g(n);
    for (auto [a, b] : edges) { g[a].push_back(b); g[b].push_back(a); }
    auto [u, _] = bfs(0, g, n);
    auto [v, d] = bfs(u, g, n);
    return d;
}
```
