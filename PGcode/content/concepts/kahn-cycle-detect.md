---
slug: kahn-cycle-detect
module: graphs
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
A DAG always has at least one node with in-degree 0 (otherwise follow incoming edges backward forever — finite graph, so you cycle). Remove that node; its removal decrements its successors' in-degrees, exposing new in-degree-0 vertices. Repeat. If the process gets stuck before emitting all n vertices, every remaining node has at least one incoming edge — which means somewhere among them lies a cycle.

## visualization
Compute in-degrees for every vertex. Push every in-degree-0 vertex into a queue. Pop one, append it to the topological order, and decrement the in-degree of each of its successors; push any newly zero-degree successor. After the queue empties, compare the order's length to n. If shorter, the remaining vertices participate in a cycle.

## bruteForce
Run a DFS topological sort and then a second DFS to look for back edges (cycle detection). Two passes, more bookkeeping, easier to get wrong. Works, but redundant: Kahn folds both into one pass.

## optimal
Compute the in-degree of every vertex in O(V + E). Initialize a queue with all in-degree-0 vertices. Pop, emit, decrement successors. When the queue empties, count emissions. If emissions < V, the graph has a cycle; the unprocessed vertices are exactly the nodes reachable from / participating in the cycle. To enumerate the cycle, do one DFS restricted to those leftover vertices.

## complexity
time: O(V + E) — each edge contributes one decrement and each vertex is enqueued and dequeued once.
space: O(V) for the queue and in-degree array.
notes: Works on disconnected graphs without modification. The order is not unique when multiple in-degree-0 vertices coexist — any tiebreak (lexicographic, priority queue) is valid.

## pitfalls
- Forgetting to handle vertices with no incoming or outgoing edges — they should still appear in the topological order.
- Not initializing the queue with *all* zero-in-degree vertices up front — only the first one and then waiting for the loop to find others is a common bug.
- Using a stack instead of a queue — still gives a valid topological order but loses the "shortest waiting time" property useful in scheduling variants.
- Mutating the in-degree array without keeping the original — needed if you want to re-run on the same graph.

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
