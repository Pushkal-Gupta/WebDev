---
slug: topological-sort
module: graphs-traversal
title: Topological Sort
subtitle: Order a DAG so every edge points "forward."
difficulty: Intermediate
position: 2
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
Topological sort produces a linear ordering of a directed acyclic graph's (DAG's) vertices such that for every edge `(u → v)`, `u` appears before `v`. It's the foundation for build systems (compile order), course prerequisites, package managers, task schedulers, and any "do A before B" problem.

## whyItMatters
Topological order tells you *the safe execution sequence* when actions have dependencies. Every modern build tool (Make, Bazel, Webpack), every package manager (npm, pip), every workflow engine (Airflow, Dagster) uses topological sort under the hood. As an interview question, it's the standard test of "do you know how to think with graphs?" — and it's the gateway to harder graph problems like shortest paths in DAGs and counting longest paths.

## intuition
Physically, think of the DAG as a pile of tasks connected by "must-happen-before" strings, each string pulling from a prerequisite down to a dependent. In-degree counts how many strings are still tied to a task's top — how many prerequisites it is still waiting on. A task with in-degree 0 has nothing holding it back and can run right now. Running it snips every string leaving it, which lowers the in-degree of its dependents; whenever a dependent's count reaches 0, it too becomes runnable. The whole algorithm is just repeatedly harvesting the tasks that have become free.

Two equivalent ways to think about it:
1. **Kahn's algorithm (BFS-based):** start with all vertices that have no incoming edges — they're safe to run first. Add them to the output, then "delete" their outgoing edges; this may free new vertices to run next. Repeat until done. If a cycle exists, you'll get stuck before processing everything.
2. **DFS-based:** run DFS; when a vertex's recursion fully unwinds, prepend it to the output. The order naturally becomes topological because a vertex is finalized only after all its descendants are.

A concrete micro-example. Consider 4 courses with edges `0->1`, `0->2`, `1->3`, `2->3`. The in-degree array starts `[0, 1, 1, 2]`, so only course 0 is free — queue `[0]`. Pop 0, append it to the output, and decrement its neighbors: course 1 drops 1->0 and course 2 drops 1->0, so both enter the queue as `[1, 2]`. Pop 1, output it, decrement course 3 from 2->1 (still blocked). Pop 2, output it, decrement course 3 from 1->0, so 3 is now free and joins the queue. Pop 3, output it. The final order is `0, 1, 2, 3` — every edge points forward in that list, which is exactly what topological order means.

What's actually happening: the queue holds precisely the set of "ready" vertices, and a vertex becomes ready the instant its last prerequisite is emitted. A cycle is a knot of tasks all waiting on each other, so none of them ever reaches in-degree 0 and the queue empties early — that leftover count is how we detect it.

Both are O(V + E). Pick Kahn's when you also need to detect cycles cleanly; pick DFS when you're already doing DFS for other reasons.

## visualization
Course graph: `Math → Physics`, `Math → CS`, `CS → AI`, `Physics → AI`. In-degrees: Math 0, Physics 1, CS 1, AI 2. Queue [Math]. Pop Math, decrement Physics→0 and CS→0, enqueue both. Output [Math]. Pop Physics, AI→1. Pop CS, AI→0, enqueue. Output [Math, Physics, CS, AI] (or [Math, CS, Physics, AI] — topological order isn't unique).

Step-by-step trace of Kahn's algorithm on that graph. Columns show the in-degree array `[Math, Physics, CS, AI]`, the queue, and the growing output after each pop:
```
   step          indeg[M,Ph,CS,AI]   queue           output
   -----------   -----------------   -------------   -------------------------
   init          [0, 1, 1, 2]        [Math]          []
   pop Math      [0, 0, 0, 2]        [Physics, CS]   [Math]
   pop Physics   [0, 0, 0, 1]        [CS]            [Math, Physics]
   pop CS        [0, 0, 0, 0]        [AI]            [Math, Physics, CS]
   pop AI        [0, 0, 0, 0]        []              [Math, Physics, CS, AI]
   done          -                   -               len 4 == V -> no cycle
```

Popping Math frees both Physics and CS at once (both hit in-degree 0); AI has to wait until the last of its two prerequisites (CS here) is emitted before it drops to 0 and becomes runnable.

## bruteForce
Enumerate every permutation and check whether it satisfies all edges. `O(V!)` — useless beyond 8 vertices. Mention only to highlight how much polynomial-time algorithms buy you.

## optimal
**Kahn's:** compute in-degrees, push all zero-in-degree vertices to a queue, pop one at a time, append to result, decrement in-degrees of neighbors, enqueue any that hit zero. If the final result has fewer than V vertices, a cycle exists.

**DFS-based:** recursive DFS with three colors (white/grey/black). Grey means "in progress" — encountering a grey vertex during DFS proves a cycle. On vertex finish (recursion returns), push to a stack. Reverse the stack at the end.

**Why Kahn's is correct.** The governing invariant is: *whenever a vertex is appended to the output, every one of its prerequisites has already been appended.* This holds because a vertex is only enqueued the moment its in-degree hits 0, and its in-degree only reaches 0 after each predecessor was popped and decremented it. So no edge ever points backward in the output — the definition of a valid topological order. Any zero-in-degree vertex is a legal next choice, which is exactly why several orderings can be valid.

**Why the cycle check works.** Every vertex on a cycle permanently retains at least one un-decremented incoming edge, because the predecessor that would decrement it is itself stuck behind the cycle. Those vertices never reach in-degree 0, never enter the queue, and never get emitted — so if the output length falls short of V, the un-emitted remainder is precisely the vertices trapped in or downstream of a cycle.

**Step-by-step.** Build adjacency lists and the in-degree array in one edge pass. Seed the queue with all in-degree-0 vertices. Repeatedly pop, emit, and relax outgoing edges, enqueuing any neighbor that just hit 0. Finally compare output length to V.

**Complexity intuition.** Building in-degrees touches each edge once: O(E). The main loop dequeues each vertex exactly once (O(V)) and, across all pops, scans each edge exactly once while decrementing (O(E)). Nothing is revisited, so the total is O(V + E) time and O(V + E) space for the graph plus the queue.

## complexity
time: O(V + E)
space: O(V + E)
notes: Same complexity for both Kahn and DFS variants. The output is a single permutation of V; the algorithm itself touches every edge once and every vertex twice (once on entry, once on finish).

## pitfalls
- Forgetting to handle cycles. A real DAG has none; Kahn's algorithm leaves vertices unprocessed if a cycle exists, DFS catches it via the grey vertex check.
- Confusing in-degree with out-degree. Kahn's uses in-degree (vertices with no prerequisites go first).
- Iterating adjacency lists by index assuming dense ints; for sparse string-keyed graphs, use a hash map.
- Producing the DFS order *without* reversing it — that's reverse topological order. Always reverse (or use `prepend`).

## interviewTips
- The most common interview framing is "Course Schedule": given course prerequisites, can you finish all of them (cycle detection)? Or "Course Schedule II": in what order? Both are topological sort thinly disguised.
- Mention that *topological orders aren't unique*: any zero-in-degree vertex can go next, so multiple valid orderings exist. If the interviewer cares about a specific order (e.g. lexicographically smallest), Kahn's with a *priority queue* instead of a regular queue gets you there in O((V + E) log V).
- For shortest-path / longest-path in DAGs, topological sort first, then relax in topological order — O(V + E) instead of Bellman-Ford's O(V·E).

## code.python
```python
from collections import deque, defaultdict

def topo_sort(n: int, edges: list[tuple[int, int]]) -> list[int]:
    graph = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1
    queue = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                queue.append(v)
    return order if len(order) == n else []  # [] signals a cycle
```

## code.javascript
```javascript
function topoSort(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { graph[u].push(v); indeg[v]++; }
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const v of graph[u]) {
      if (--indeg[v] === 0) queue.push(v);
    }
  }
  return order.length === n ? order : [];
}
```

## code.java
```java
public List<Integer> topoSort(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    int[] indeg = new int[n];
    for (int[] e : edges) { graph.get(e[0]).add(e[1]); indeg[e[1]]++; }
    Deque<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.offer(i);
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order.add(u);
        for (int v : graph.get(u)) if (--indeg[v] == 0) queue.offer(v);
    }
    return order.size() == n ? order : Collections.emptyList();
}
```

## code.cpp
```cpp
vector<int> topoSort(int n, vector<pair<int,int>>& edges) {
    vector<vector<int>> graph(n);
    vector<int> indeg(n, 0);
    for (auto& [u, v] : edges) { graph[u].push_back(v); indeg[v]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : graph[u]) if (--indeg[v] == 0) q.push(v);
    }
    return (int) order.size() == n ? order : vector<int>{};
}
```
