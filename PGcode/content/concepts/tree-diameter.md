---
slug: tree-diameter
module: trees
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
Diameter shows up everywhere — network latency bounds, longest gene path in phylogenetic trees, longest dialogue chain in a call graph, longest "social distance" in a friendship tree. It is also the gateway to harder tree problems: tree center, k-th diameter, weighted diameter, and DP-style "longest path through node v."

## intuition
Why does BFSing twice work? Claim: the farthest node from any starting node x is one endpoint of some diameter. Proof sketch: let the diameter be (a, b). If x = a or x = b, done. Otherwise consider the path from x to its farthest node u; one shows by case analysis on where x's path meets the (a, b) path that u must be a or b. Once you have one diameter endpoint, BFS from it reaches the other endpoint by definition of "farthest."

## visualization
Tree: 1-2, 2-3, 2-4, 4-5, 4-6. BFS from 1: distances {1:0, 2:1, 3:2, 4:2, 5:3, 6:3}. Farthest = 5 (tie with 6; pick 5). BFS from 5: {5:0, 4:1, 2:2, 6:2, 1:3, 3:3}. Farthest = 1 or 3, distance 3. Diameter = 3, achieved by path 1-2-4-5 or 3-2-4-5.

## bruteForce
For every pair (u, v) compute the shortest path between them (it is unique in a tree) and take the max. O(n^2) pair-paths, O(n) each = O(n^3). Even with all-pairs shortest paths via repeated BFS, O(n^2). Acceptable to n ~ 10^4; useless above that.

## optimal
Two passes: (1) BFS from any node s, track distance to every node, find argmax → u. (2) BFS from u, find the new argmax distance → that is the diameter and v is the other endpoint. Each BFS is O(n + m) = O(n) on a tree. Total O(n) time, O(n) memory.

For weighted trees with positive weights, replace BFS with DFS that accumulates edge weights. For trees with negative-weight edges the two-pass proof breaks; use DP-on-trees instead.

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
