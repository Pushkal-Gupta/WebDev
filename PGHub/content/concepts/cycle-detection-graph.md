---
slug: cycle-detection-graph
module: graphs-traversal
title: Cycle Detection in Graphs
subtitle: Directed graphs need three node colors (white/gray/black) for cycle detection; undirected just need a parent check.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 6
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
Detecting whether a graph has a cycle is one of the most-asked graph questions. The technique depends on whether the graph is **directed** or **undirected**:
- **Undirected**: DFS, and a back-edge to a non-parent indicates a cycle.
- **Directed**: DFS with 3-color marking (white = unvisited, gray = in current path, black = fully explored). A back-edge to a gray node indicates a cycle.

Both run in O(V + E).

## whyItMatters
Direct interview classics:
- "Course schedule" / "Is there a way to finish all courses?" → directed cycle detection (topological sort).
- "Does this dependency graph have a deadlock?"
- "Does this undirected graph form a tree?" — n-1 edges + no cycle.
- "Detect a cycle in a linked list" — different problem (use Floyd's tortoise + hare), but interviewers love asking how the approaches differ.

The three-color trick is interview gold — it generalizes to topological-sort and SCC algorithms.

## intuition
Think of DFS as exploring a cave while unspooling a thread behind you. The thread is your current recursion stack — the exact chain of rooms from the entrance to where you stand right now. A cycle exists precisely when you step through a doorway and find your own thread already lying there: you've reached a room that is still on the path behind you, so there's a loop back to it. The whole difficulty is telling "my thread is here" apart from "I merely visited this room earlier and already backed out."

**Undirected**: DFS from any node. For each neighbor, if it's already visited AND it's not the immediate parent, you've found a cycle. The parent exception matters because an undirected edge `u—v` is stored twice; standing on v you will always see u again, but that is just the edge you walked in on, not a genuine loop.

**Directed**: a node has three states during DFS:
- **white**: not yet visited.
- **gray**: visited, still on the current DFS recursion stack (on the thread).
- **black**: visited, popped off the recursion stack (fully explored, thread reeled back in).

Encountering an edge to a **gray** node = back edge = cycle. An edge to a **black** node is fine (cross or forward edge).

Concrete micro-example, directed edges `0→1, 1→2, 2→0, 0→3`. Start `dfs(0)`: color[0]=gray. Descend `dfs(1)`: color[1]=gray. Descend `dfs(2)`: color[2]=gray. Now 2's neighbor is 0, and color[0] is GRAY — 0 is still on our thread — so we report a cycle immediately. Contrast a DAG `0→1, 0→2, 1→2`: visiting 2 from 0 paints it black; later when 1 also points at 2, color[2] is BLACK, not gray, so no false alarm. What's actually happening: gray = "an ancestor of me in this DFS tree," and an edge to an ancestor is the definition of a back edge, which is the definition of a directed cycle.

## visualization
```
Directed graph: 0 → 1 → 2 → 0  (cycle), 0 → 3

DFS from 0:
  visit 0 → gray
    visit 1 → gray
      visit 2 → gray
        check neighbor 0 → 0 is GRAY → CYCLE FOUND

Undirected graph: 0 — 1 — 2 — 0

DFS from 0:
  visit 0, parent = -1
    visit 1, parent = 0
      visit 2, parent = 1
        check neighbor 0 → 0 is visited AND 0 != parent(1) → CYCLE
```

## bruteForce
Naive: for each pair of nodes, BFS to see if there's a back-path to the start. O(V² · (V + E)). Useless for n = 10^4.

## optimal
Both variants are a single DFS pass; the only real design choice is what "already-seen" state you track. Undirected needs one boolean per node plus the incoming parent; directed needs a three-value color per node. The shared invariant: **a node is only reported as a cycle when a neighbor is confirmed to lie on the current root-to-here path**, never merely "seen before."

Why the undirected version is correct. In a DFS tree of an undirected graph, every non-tree edge is a back edge (there are no cross edges), so any edge to a visited non-parent node closes a loop through the tree. The lone false positive would be the edge you arrived on; excluding `nb == parent` removes exactly that one and nothing else. Multi-edges break this (two distinct edges to the parent), which is why they need deduping.

Why the directed version is correct. Coloring a node gray on entry and black on exit means "gray" holds for precisely the interval it sits on the recursion stack. An edge to a gray node therefore points to an ancestor — a back edge — which in a directed graph is exactly a cycle. Edges to black nodes (already finished) are forward or cross edges and are safe.

Step-by-step, directed `has_cycle_directed(3, [(0,1),(1,2),(2,0)])`: color starts all white; `dfs(0)` grays 0, recurses to gray 1, recurses to gray 2; 2's neighbor 0 is gray → return True up the chain. If the graph were acyclic each node would eventually turn black and the outer loop would exhaust all whites returning False. Complexity intuition: each vertex is colored/visited once and each edge is examined once from its tail, giving O(V + E); the color array and recursion stack are O(V). For V past ~10^5 swap recursion for an explicit stack to avoid overflow.

**Undirected**:
```
def has_cycle_undirected(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    visited = [False] * n
    def dfs(node, parent):
        visited[node] = True
        for nb in adj[node]:
            if not visited[nb]:
                if dfs(nb, node): return True
            elif nb != parent:
                return True
        return False
    for v in range(n):
        if not visited[v]:
            if dfs(v, -1): return True
    return False
```

**Directed** (3-color):
```
WHITE, GRAY, BLACK = 0, 1, 2

def has_cycle_directed(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges: adj[u].append(v)
    color = [WHITE] * n
    def dfs(node):
        color[node] = GRAY
        for nb in adj[node]:
            if color[nb] == GRAY: return True
            if color[nb] == WHITE and dfs(nb): return True
        color[node] = BLACK
        return False
    for v in range(n):
        if color[v] == WHITE and dfs(v): return True
    return False
```

**Finding the cycle itself**: maintain a parent map and walk back from the back-edge endpoint to reconstruct.

**Detecting cycle in linked list**: use Floyd's tortoise + hare — different domain, different algorithm.

## complexity
- **Time**: O(V + E).
- **Space**: O(V) for the visited / color arrays + recursion.
- **Iterative version**: needed for V > 10^5 in languages with shallow stacks.

## pitfalls
- **Parent-edge confusion** (undirected): forgetting to pass parent means immediately false-positive. Pass parent explicitly.
- **Multi-edge undirected graphs**: two edges between u and v look like a cycle. Either dedupe at construction or use edge-id tracking.
- **Self-loops**: `(v, v)` is a cycle of length 1. Check before DFS.
- **Disconnected graphs**: must DFS from every unvisited node, not just node 0.
- **Confusing topological sort with cycle detection**: a graph is a DAG iff it has no cycle. Topo-sort failure ↔ cycle exists.

## interviewTips
- "Course schedule" type problems → directed cycle detection / topological sort.
- For undirected, mention the **parent trick** explicitly.
- For directed, mention the **3 colors (white/gray/black)** by name.
- For senior interviews, mention the relationship to **Tarjan's SCC** (uses the same DFS framework) and **detecting cycles in linked lists** (Floyd's).

## code.python
```python
def has_cycle_undirected(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    visited = [False] * n
    def dfs(node, parent):
        visited[node] = True
        for nb in adj[node]:
            if not visited[nb]:
                if dfs(nb, node): return True
            elif nb != parent:
                return True
        return False
    for v in range(n):
        if not visited[v] and dfs(v, -1): return True
    return False

def has_cycle_directed(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges: adj[u].append(v)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * n
    def dfs(node):
        color[node] = GRAY
        for nb in adj[node]:
            if color[nb] == GRAY: return True
            if color[nb] == WHITE and dfs(nb): return True
        color[node] = BLACK
        return False
    return any(color[v] == WHITE and dfs(v) for v in range(n))

print(has_cycle_undirected(3, [(0,1),(1,2),(2,0)]))   # True
print(has_cycle_directed(3, [(0,1),(1,2),(2,0)]))     # True
```

## code.javascript
```javascript
function hasCycleDirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Array(n).fill(WHITE);
  function dfs(node) {
    color[node] = GRAY;
    for (const nb of adj[node]) {
      if (color[nb] === GRAY) return true;
      if (color[nb] === WHITE && dfs(nb)) return true;
    }
    color[node] = BLACK;
    return false;
  }
  for (let v = 0; v < n; v++) if (color[v] === WHITE && dfs(v)) return true;
  return false;
}
```

## code.java
```java
import java.util.*;
class Cycle {
    public boolean hasCycleDirected(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        int[] color = new int[n];
        for (int v = 0; v < n; v++) if (color[v] == 0 && dfs(v, color, adj)) return true;
        return false;
    }
    boolean dfs(int v, int[] color, List<List<Integer>> adj) {
        color[v] = 1;
        for (int nb : adj.get(v)) {
            if (color[nb] == 1) return true;
            if (color[nb] == 0 && dfs(nb, color, adj)) return true;
        }
        color[v] = 2;
        return false;
    }
}
```

## code.cpp
```cpp
#include <vector>
bool hasCycleDirected(int n, std::vector<std::pair<int,int>>& edges) {
    std::vector<std::vector<int>> adj(n);
    for (auto [u, v] : edges) adj[u].push_back(v);
    std::vector<int> color(n, 0);  // 0=white, 1=gray, 2=black
    std::function<bool(int)> dfs = [&](int v) {
        color[v] = 1;
        for (int nb : adj[v]) {
            if (color[nb] == 1) return true;
            if (color[nb] == 0 && dfs(nb)) return true;
        }
        color[v] = 2;
        return false;
    };
    for (int v = 0; v < n; v++) if (color[v] == 0 && dfs(v)) return true;
    return false;
}
```
