---
slug: kahn-cycle-detect
module: graphs-traversal
title: Kahn's Algorithm as a Cycle Detector
subtitle: In-degree BFS produces a topological order — and reports any directed cycle for free.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Topological Sort"
    url: "https://algs4.cs.princeton.edu/42digraph/"
    type: book
  - title: "Topological Sorting — cp-algorithms"
    url: "https://cp-algorithms.com/graph/topological-sort.html"
    type: blog
  - title: "TheAlgorithms/Python — topological_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/kahns_algorithm_topo.py"
    type: repo
status: published
---

## intro
Kahn's algorithm builds a topological order by repeatedly removing nodes with no incoming edges. The clever side effect: if you finish the loop and have not emitted every vertex, the leftover vertices form (or feed into) a directed cycle. One BFS-style pass simultaneously topologically sorts a DAG and detects whether the graph was actually a DAG.

## whyItMatters
Course-scheduling, build dependencies (Make, Bazel), task pipelines, and event ordering all need to know two things: a valid order, and whether one even exists. Kahn's answers both. DFS-based topo sort needs an extra back-edge check to detect cycles; Kahn's gets it for free — the leftover unprocessed nodes are the witnesses to the cycle.

## intuition
The mental model is a dependency-resolution sweep that physically peels the graph from its leaves inward. Every directed acyclic graph (DAG) has a structural pressure point: at least one node with zero incoming edges. The proof is short — if every node had at least one incoming edge, you could walk predecessors backwards forever, and since the graph is finite that walk must revisit a vertex, forming a directed cycle. So "has in-degree 0" and "is acyclic so far" are linked.

The algorithm exploits this contrapositive aggressively. Find any in-degree-0 node — it has no unsatisfied prerequisites, so it can be emitted first in the topological order. Removing it is equivalent to declaring its outgoing edges "satisfied," which decrements the in-degree of each successor. Some successors now drop to in-degree 0 themselves; they become eligible. Repeat until no node is eligible. If you have emitted every vertex, the graph was a DAG and you have produced a valid linearisation. If some vertices remain trapped with positive in-degree, no honest in-degree-0 source exists among them, so by the contrapositive above they must contain a directed cycle.

Key invariant: at every step, the number of emitted vertices plus the number of vertices with current in-degree > 0 equals `V`. The "trapped" set after termination is exactly the set of vertices on or reachable into a cycle. Analogy: think of a factory floor where each task has prerequisites listed on its work order. You start by picking up any task whose prereq list is empty. As you finish tasks, downstream tasks cross items off their lists. If the entire floor clears, you scheduled the whole project; if not, the leftover tasks all reference each other in a deadlock — a circular dependency.

## visualization
```
Graph (6 vertices, edges drawn as u -> v):
     5 -> 2,  5 -> 0
     4 -> 0,  4 -> 1
     2 -> 3
     3 -> 1

Initial in-degrees:
   v:    0  1  2  3  4  5
  in:    2  2  1  1  0  0

Queue starts with all in-deg 0 vertices: [4, 5]
Order: []

Step 1: pop 4. Emit. Decrement neighbours of 4: in[0]=1, in[1]=1.
  in:    1  1  1  1  0  0    queue: [5]    order: [4]

Step 2: pop 5. Emit. Decrement neighbours of 5: in[2]=0, in[0]=0.
  in:    0  1  0  1  0  0    queue: [2, 0] order: [4, 5]

Step 3: pop 2. Emit. Decrement neighbour 3: in[3]=0.
  in:    0  1  0  0  0  0    queue: [0, 3] order: [4, 5, 2]

Step 4: pop 0. Emit. (no outgoing edges)
  queue: [3]                  order: [4, 5, 2, 0]

Step 5: pop 3. Emit. Decrement neighbour 1: in[1]=0.
  queue: [1]                  order: [4, 5, 2, 0, 3]

Step 6: pop 1. Emit.
  queue: []                   order: [4, 5, 2, 0, 3, 1]   length 6 == V

Cycle case: add edge 1 -> 4. Now in[4] starts at 1.
  Initial queue = [5] only. After processing 5, 2, 3 the queue empties
  with in[0]=1, in[1]=1, in[4]=1 still positive. Emitted only 4 of 6
  vertices. Stuck set {0, 1, 4} is exactly the cycle 4 -> 1 -> ... and
  feed-ins. Cycle detected.
```

## bruteForce
Run a DFS topological sort and then a second DFS to look for back edges (cycle detection). Two passes, more bookkeeping, easier to get wrong. Works, but redundant: Kahn folds both into one pass.

## optimal
The algorithm has three phases, all O(V + E). First, build an adjacency list and an in-degree array by scanning every edge once. Second, initialise a FIFO queue with every vertex whose in-degree is 0 at start — note "every," not just one, because disconnected DAGs may have multiple independent sources. Third, loop: dequeue a vertex `u`, append it to the topological order, and for every outgoing edge `(u, v)` decrement `in_deg[v]`; if that decrement brings `in_deg[v]` to 0, enqueue `v`. Continue until the queue is empty.

Data structures used: an `adj` adjacency list (vector of vectors), an `in_deg` array of length `V`, a FIFO queue (`deque` in Python, `ArrayDeque` in Java, `queue<int>` in C++), and an output `order` array. Every edge contributes exactly one in-degree decrement and every vertex is enqueued/dequeued at most once, so the total work is linear in the size of the input. No recursion, no visited array beyond the in-degree counter, and no heap unless a specific tie-break ordering (lexicographic, priority) is required — in which case swap the FIFO for a min-heap and pay an `O(log V)` factor per operation for O((V + E) log V) total.

Key invariants and tradeoffs: at termination, `order.length == V` iff the graph is a DAG; otherwise the cycle witnesses are exactly the vertices whose `in_deg` remains positive. To enumerate an actual cycle, restrict a DFS to the leftover vertex set and walk forward until you revisit one. The algorithm is order-stable only relative to the queue's insertion order, so the topological order is *one* valid linearisation, not the unique one. Compared with DFS-based topological sort, Kahn's wins on three fronts: it folds cycle detection into the same pass, it is easier to convert to iterative form (no recursion depth concerns on million-vertex graphs), and it exposes a natural notion of "depth waves" useful for scheduling and longest-path-in-DAG computations.

## complexity
time: O(V + E) — each edge contributes one decrement and each vertex is enqueued and dequeued once.
space: O(V) for the queue and in-degree array.
notes: Works on disconnected graphs without modification. The order is not unique when multiple in-degree-0 vertices coexist — any tiebreak (lexicographic, priority queue) is valid.

## pitfalls
- **Isolated vertices missed.** Nodes with no incoming *and* no outgoing edges still belong in the output, but a bug that only enqueues "reachable" vertices drops them. Fix: seed the queue by scanning all `n` vertices for `in_deg[i] == 0`, not just sources of any specific edge.
- **Queue seeded with one source.** Pushing just the first zero-in-degree vertex and waiting for the loop to discover others stalls disconnected DAGs. Fix: explicitly enumerate `0..n-1` and enqueue every vertex with `in_deg == 0` before entering the loop.
- **Stack instead of queue.** Using a stack still yields a valid topological order, but loses the BFS "depth wave" property that scheduling and longest-path-in-DAG algorithms rely on. Fix: use a `deque` / `ArrayDeque` / `queue` as a true FIFO; only swap in a min-heap when a deterministic tie-break (e.g. lexicographic) is required.
- **In-degree mutation prevents rerunning.** The algorithm destroys `in_deg`, so a second call on the same graph sees zero everywhere. Fix: take a defensive copy `in_deg = original_in_deg.copy()` at the top of `kahn`, or return `(order, in_deg_after)` if the caller wants the post-state explicitly.
- **Detecting cycles by `order.length < n` alone, without surfacing the cycle.** Many callers also need *which* vertices form the cycle. Fix: after the main loop, scan `in_deg` for positive entries — those are exactly the vertices on or feeding into a cycle, and a restricted DFS over that subset will produce an actual cycle witness.

## interviewTips
- Lead with the dual benefit: "Kahn's sorts and detects cycles in one pass — DFS topo needs two."
- Be ready to pivot to "Course Schedule II" (Leetcode 210) — Kahn's is the canonical solution.
- Mention the alphabetical-order variant — swap the queue for a min-heap and you produce the lexicographically smallest topological order, which interviewers love as a follow-up.

## code.python
```python
from collections import deque

def kahn(n, edges):
    in_deg = [0] * n
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); in_deg[v] += 1
    q = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0: q.append(v)
    if len(order) != n:
        return None, [i for i in range(n) if in_deg[i] > 0]
    return order, []
```

## code.javascript
```javascript
function kahn(n, edges) {
  const inDeg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); inDeg[v]++; }
  const queue = [];
  for (let i = 0; i < n; i++) if (inDeg[i] === 0) queue.push(i);
  const order = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    for (const v of adj[u]) {
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    }
  }
  if (order.length !== n) {
    const stuck = [];
    for (let i = 0; i < n; i++) if (inDeg[i] > 0) stuck.push(i);
    return { order: null, cycleVertices: stuck };
  }
  return { order, cycleVertices: [] };
}
```

## code.java
```java
import java.util.*;

public int[] kahn(int n, int[][] edges) {
    int[] inDeg = new int[n];
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); inDeg[e[1]]++; }
    Deque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.offer(i);
    int[] order = new int[n];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) {
            if (--inDeg[v] == 0) q.offer(v);
        }
    }
    return idx == n ? order : null;
}
```

## code.cpp
```cpp
#include <vector>
#include <queue>
using namespace std;

vector<int> kahn(int n, vector<pair<int,int>>& edges) {
    vector<int> inDeg(n, 0);
    vector<vector<int>> adj(n);
    for (auto& [u, v] : edges) { adj[u].push_back(v); inDeg[v]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) if (--inDeg[v] == 0) q.push(v);
    }
    if ((int)order.size() != n) return {};
    return order;
}
```
