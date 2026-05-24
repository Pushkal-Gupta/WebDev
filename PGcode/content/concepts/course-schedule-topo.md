---
slug: course-schedule-topo
module: graphs
title: Course Schedule (Kahn's Topological Sort)
subtitle: Detect a cycle in a prerequisite graph by trying to topologically order it — if every node empties out, it is a DAG.
difficulty: Intermediate
position: 42
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Directed Graphs"
    url: "https://algs4.cs.princeton.edu/42digraph/"
    type: book
  - title: "cp-algorithms — Topological Sorting"
    url: "https://cp-algorithms.com/graph/topological-sort.html"
    type: blog
  - title: "TheAlgorithms/Python — graphs/topological_sort.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/topological_sort.py"
    type: repo
status: published
---

## intro
The Course Schedule problem (LC 207) gives n courses and a list of `(course, prereq)` pairs. You return true if a valid ordering exists — equivalently, if the directed prerequisite graph has no cycles. Kahn's algorithm answers both questions in one pass: repeatedly remove a node whose in-degree is zero, decrement its neighbors, and push any new zero-in-degree nodes onto the frontier. If you remove every node, you have a topological order. If you stall before then, there is a cycle.

## whyItMatters
Topological sort is the backbone of build systems (make, bazel), package managers (apt, npm), spreadsheet recalculation, course planners, and any "this depends on that" task graph. Kahn's algorithm is the version you reach for when you also need cycle detection — and that is exactly the interview framing. It is also the BFS-shaped twin of DFS topological sort, which is useful when you want iterative code or when you also need the count of valid orderings.

## intuition
A directed acyclic graph (DAG) always has at least one node with in-degree zero — a course with no prerequisites. Take it first. Mentally remove it; decrement the in-degree of every course that listed it as a prerequisite. Any new zero-in-degree nodes become available. Repeat.

You can build a queue (FIFO) of zero-in-degree nodes and process it BFS-style:

```
   while queue not empty:
       u = queue.pop()
       output u
       for v in adj[u]:
           in_degree[v] -= 1
           if in_degree[v] == 0:
               queue.push(v)
```

When the queue empties:
- If you output all n nodes, you have a topological order.
- If you output fewer than n, the remaining nodes form a cycle (in-degree never dropped to zero because they pointed at each other).

This is "peel the onion": strip outer layer of independent nodes, expose the next layer, repeat. A cycle is a knot the peeling cannot untie.

## walkthroughExample
Courses 0..5 with prereqs (edges go prereq -> course):
```
   0 -> 1
   0 -> 2
   1 -> 3
   2 -> 3
   3 -> 4
   4 -> 5
```

Picture:
```
        0
       / \
      1   2
       \ /
        3
        |
        4
        |
        5
```

Initial in-degrees: `[0, 1, 1, 2, 1, 1]`. Queue starts with `[0]`.

```
   step  pop  output       in_degrees after        queue
   ----  ---  -----------  ----------------------  -----------
   1     0    [0]          [0,0,0,2,1,1]           [1, 2]
   2     1    [0,1]        [0,0,0,1,1,1]           [2]
   3     2    [0,1,2]      [0,0,0,0,1,1]           [3]
   4     3    [0,1,2,3]    [0,0,0,0,0,1]           [4]
   5     4    [0,1,2,3,4]  [0,0,0,0,0,0]           [5]
   6     5    [0,1,2,3,4,5]                        []
```

Output length = 6 = n -> valid order found.

Now add an extra edge `5 -> 0` (closing a cycle). Initial in-degrees: `[1, 1, 1, 2, 1, 1]` — every node has in-degree ≥ 1, queue starts empty, output stays empty, length 0 ≠ 6 -> cycle detected, no valid schedule.

## visualization
Snapshot 1 — in-degree array drives the queue:
```
   in_degree:    [0, 1, 1, 2, 1, 1]
                  ^ index = course id
   nodes with in_degree == 0 sit in the queue.
```

Snapshot 2 — peeling layers from the DAG:
```
   layer 0:   {0}
   layer 1:   {1, 2}
   layer 2:   {3}
   layer 3:   {4}
   layer 4:   {5}
```

Snapshot 3 — cycle case:
```
   prereqs:  0 -> 1 -> 2 -> 0
   in_degrees: [1, 1, 1]
   queue empty from the start -> output length 0 -> cycle.
```

Snapshot 4 — Kahn vs DFS topo:
```
   Kahn (BFS-shaped):    explicit in-degree array; cycle = output < n
   DFS topo:             post-order DFS, reverse; cycle = back-edge during DFS
   Both: O(V + E).
   Kahn: easier to also detect / report cycles.
```

## bruteForce
Enumerate every permutation of the n courses and check whether each is a valid order. O(n! · E) — useless beyond n ≈ 8. Kahn runs the same check in O(V + E).

Alternative slow approach: detect cycles via Floyd-Warshall reachability — O(V³). Fine for small graphs but again dominated by Kahn / DFS.

## optimal
```
def canFinish(n, prerequisites):
    adj = [[] for _ in range(n)]
    in_deg = [0] * n
    for a, b in prerequisites:           # take a after b -> edge b -> a
        adj[b].append(a)
        in_deg[a] += 1

    queue = deque(i for i in range(n) if in_deg[i] == 0)
    taken = 0
    while queue:
        u = queue.popleft()
        taken += 1
        for v in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                queue.append(v)
    return taken == n
```

To return the order itself, accumulate `u` into an `order` list instead of a counter.

## complexity
time: O(V + E) — every node enqueued and dequeued once, every edge inspected once during decrement.
space: O(V + E) for adjacency + in-degree + queue.
notes: For dense graphs (E = V²) the algorithm is O(V²). For very small graphs DFS topological sort has the same complexity and slightly less overhead. Kahn's strength is its built-in cycle detection.

## pitfalls
- Reading the edge direction backwards. "Take a after b" usually means edge `b -> a`. Get this right or your in-degrees flip and the algorithm silently returns the wrong answer.
- Forgetting to start the queue with *all* zero-in-degree nodes, not just node 0. Multiple roots are normal.
- Using a stack instead of a queue and claiming "BFS topo." A LIFO produces a topological order too (it is just a different traversal), but it is no longer Kahn's algorithm — describe it correctly.
- Counting visited nodes wrong — increment exactly once per dequeue.
- Allowing duplicate edges in the input. They inflate in-degrees without being decremented correctly. Deduplicate or use a set adjacency.

## interviewTips
- State both the algorithm and the cycle-detection criterion in one sentence: "Kahn's BFS produces a valid order iff every node leaves the queue."
- Mention you can return the order (list version) or the count (boolean version) with one variable change.
- The follow-up is often "How many distinct valid orders are there?" That is #P-hard in general — say so and pivot to "we can enumerate them via DFS with backtracking" if pressed.
- For LC 210 (return the order), Kahn's accumulated `order` list is the answer directly.

## code.python
```python
from collections import deque

def canFinish(numCourses, prerequisites):
    adj = [[] for _ in range(numCourses)]
    in_deg = [0] * numCourses
    for a, b in prerequisites:
        adj[b].append(a)
        in_deg[a] += 1

    queue = deque(i for i in range(numCourses) if in_deg[i] == 0)
    taken = 0
    while queue:
        u = queue.popleft()
        taken += 1
        for v in adj[u]:
            in_deg[v] -= 1
            if in_deg[v] == 0:
                queue.append(v)
    return taken == numCourses
```

## code.javascript
```javascript
function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const inDeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); inDeg[a]++; }

  const queue = [];
  for (let i = 0; i < numCourses; i++) if (inDeg[i] === 0) queue.push(i);

  let taken = 0;
  while (queue.length) {
    const u = queue.shift();
    taken++;
    for (const v of adj[u]) {
      if (--inDeg[v] === 0) queue.push(v);
    }
  }
  return taken === numCourses;
}
```

## code.java
```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] inDeg = new int[numCourses];
    for (int[] p : prerequisites) {
        adj.get(p[1]).add(p[0]);
        inDeg[p[0]]++;
    }
    Deque<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) queue.offer(i);

    int taken = 0;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        taken++;
        for (int v : adj.get(u)) {
            if (--inDeg[v] == 0) queue.offer(v);
        }
    }
    return taken == numCourses;
}
```

## code.cpp
```cpp
bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
    vector<vector<int>> adj(numCourses);
    vector<int> inDeg(numCourses, 0);
    for (auto& p : prerequisites) {
        adj[p[1]].push_back(p[0]);
        inDeg[p[0]]++;
    }
    queue<int> q;
    for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.push(i);

    int taken = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        taken++;
        for (int v : adj[u]) if (--inDeg[v] == 0) q.push(v);
    }
    return taken == numCourses;
}
```
