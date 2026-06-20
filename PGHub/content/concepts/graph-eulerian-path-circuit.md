---
slug: graph-eulerian-path-circuit
module: graphs-advanced
title: Eulerian Path & Circuit
subtitle: Walk every edge exactly once — Hierholzer's algorithm in O(V+E). The DNA-sequencing primitive behind genome assembly.
difficulty: Advanced
position: 61
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Eulerian tour problem"
    url: "https://walkccc.me/CLRS/Chap22/"
    type: book
  - title: "cp-algorithms — Eulerian path"
    url: "https://cp-algorithms.com/graph/euler_path.html"
    type: blog
  - title: "TheAlgorithms/Python — Hierholzer's"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/eulerian_path_and_circuit_for_undirected_graph.py"
    type: repo
status: published
---

## intro
An **Eulerian circuit** traverses every edge of a graph exactly once and returns to the start. An **Eulerian path** is the same but doesn't need to end at the start. Named after Euler's 1736 paper on the Seven Bridges of Königsberg — the seed of graph theory itself. **Hierholzer's algorithm** finds one in O(V+E).

## whyItMatters
- **Genome assembly** (de Bruijn graphs): read fragments → graph where Eulerian path reconstructs the genome.
- **Postman / route problems**: visit every street once (Chinese Postman generalization).
- **Circuit board drilling**: minimize wasted motion.
- **DNA sequence reconstruction**: each k-mer overlap = an edge; Eulerian path = full sequence.

## intuition
**Existence conditions**:
- **Undirected, Eulerian circuit**: every vertex has even degree AND graph is connected (only on vertices with edges).
- **Undirected, Eulerian path**: exactly 0 or 2 vertices have odd degree (path starts at one odd-degree vertex, ends at the other).
- **Directed, Eulerian circuit**: every vertex has in-degree == out-degree AND graph is strongly connected.
- **Directed, Eulerian path**: exactly one vertex has out_deg - in_deg = 1 (start) and one has in_deg - out_deg = 1 (end).

**Hierholzer's algorithm**:
1. Start at a valid start vertex.
2. Walk edges, removing each as you traverse, until stuck (returned to start in circuit case).
3. If unused edges remain, pick a vertex on the current path with unused edges, splice in a sub-tour found by walking from it.
4. Repeat until all edges used.

Cleaner iterative implementation: DFS that emits vertices in postorder onto a stack — reverse the stack at end.

## visualization
```
Graph (undirected):
  A — B
  |   |
  D — C
  |
  E

Degrees: A=2, B=2, C=2, D=3, E=1.
Odd-degree count = 2 (D and E) → Eulerian path exists, must start/end at D or E.

Start at E. Hierholzer's:
  E → D → A → B → C → D
  Stuck at D — back to start E? No, we ended at D.
  All edges used? Edges: AB, AD, BC, CD, DE → all 5 used.
  Path: E-D-A-B-C-D

Reverse-postorder DFS variant:
  dfs(E): push E onto stack
  go E→D
  dfs(D): push D
  D→A
  dfs(A): push A, A→B, dfs(B): push B, B→C, dfs(C): push C, C→D, dfs(D again):
    no unused edges from D → push D
  Stack postorder: [E, D, A, B, C, D]
  Path: reverse stack → D, C, B, A, D, E  (or E, D, A, B, C, D)
```

## bruteForce
**Try all permutations of edges**: exponential.

**Greedy: walk arbitrarily, restart on dead-end**: doesn't always find a tour even when one exists — may strand edges.

**Fleury's algorithm** (1883): avoid bridges unless no alternative. Correct but O((V+E)^2) due to bridge re-checking.

Hierholzer is the right answer at O(V+E).

## optimal
**Hierholzer's iterative**:
1. Use adjacency map: `adj[u] = list of unused neighbors`.
2. Stack of vertices, starts with start vertex.
3. While stack not empty:
   - peek top v
   - if v has unused edges → push next neighbor, remove edge (both directions if undirected)
   - else → pop v, append to path
4. Reverse path → Eulerian path.

For directed graphs: track out-degree only when removing.

**Edge case handling**:
- Disconnected component with no edges → ignore (only vertices touching edges matter).
- Self-loop → counts as 2 toward degree (undirected) or 1 in / 1 out (directed).
- Multi-edges → fine, treated as distinct edges.

## complexity
- **Time:** O(V + E). Each edge removed once; each vertex pushed/popped once.
- **Space:** O(V + E) for the adjacency structure + output path.

## pitfalls
- **Adjacency list as plain list + linear search** to remove edge → O(E^2). Use index pointer per vertex OR linked list OR multiset.
- **Forgetting to remove the reverse edge** in undirected graphs — visits each edge twice.
- **Wrong start vertex**: starting at an even-degree vertex when 2 vertices are odd → no Eulerian path possible from your start. Start at an odd-degree vertex.
- **Connectivity check missed**: degree conditions are not enough — graph must be connected over edge-bearing vertices.
- **Recursive DFS stack overflow** on long paths (>~100k edges). Convert to iterative.

## interviewTips
- For LeetCode "Reconstruct Itinerary" — Eulerian path with lexicographic tie-break.
- Cite Euler 1736 + Hierholzer 1873 to anchor the algorithm.
- For senior interviews, discuss **de Bruijn graphs in bioinformatics**, **Chinese Postman as generalization**, **online algorithms** for streaming graphs.

## code.python
```python
from collections import defaultdict
def eulerian_path(edges, start):
    """edges: list of (u, v) undirected. Returns vertex sequence."""
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    stack, path = [start], []
    while stack:
        v = stack[-1]
        if adj[v]:
            u = adj[v].pop()
            adj[u].remove(v)
            stack.append(u)
        else:
            path.append(stack.pop())
    return path[::-1]
```

## code.javascript
```javascript
// Directed graph variant (LeetCode 332 "Reconstruct Itinerary")
function findItinerary(tickets) {
  const adj = new Map();
  tickets.sort();  // lexicographic for tie-break
  for (const [a, b] of tickets) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  }
  const stack = ['JFK'], path = [];
  while (stack.length) {
    const v = stack[stack.length - 1];
    if (adj.get(v)?.length) stack.push(adj.get(v).shift());
    else path.push(stack.pop());
  }
  return path.reverse();
}
```

## code.java
```java
public List<String> findItinerary(List<List<String>> tickets) {
    Map<String, PriorityQueue<String>> adj = new HashMap<>();
    for (var t : tickets) adj.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
    Deque<String> stack = new ArrayDeque<>();
    LinkedList<String> path = new LinkedList<>();
    stack.push("JFK");
    while (!stack.isEmpty()) {
        String v = stack.peek();
        if (adj.containsKey(v) && !adj.get(v).isEmpty()) stack.push(adj.get(v).poll());
        else path.addFirst(stack.pop());
    }
    return path;
}
```

## code.cpp
```cpp
vector<string> findItinerary(vector<vector<string>>& tickets) {
    map<string, multiset<string>> adj;
    for (auto& t : tickets) adj[t[0]].insert(t[1]);
    stack<string> st; vector<string> path;
    st.push("JFK");
    while (!st.empty()) {
        string v = st.top();
        if (!adj[v].empty()) {
            auto it = adj[v].begin();
            st.push(*it);
            adj[v].erase(it);
        } else {
            path.push_back(v);
            st.pop();
        }
    }
    reverse(path.begin(), path.end());
    return path;
}
```
