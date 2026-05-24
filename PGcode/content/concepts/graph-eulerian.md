---
slug: graph-eulerian
module: graphs
title: Eulerian Path / Circuit
subtitle: Find a walk that uses every edge exactly once via Hierholzer's algorithm.
difficulty: Advanced
position: 51
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Eulerian Path — CP-Algorithms"
    url: "https://cp-algorithms.com/graph/euler_path.html"
    type: blog
  - title: "Eulerian Path and Circuit — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/eulerian-path-and-circuit/"
    type: blog
  - title: "TheAlgorithms/Python — eulerian_path.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/graphs/check_bipartite_graph_bfs.py"
    type: repo
status: published
---

## intro
An Eulerian circuit traverses every edge of a graph exactly once and returns to its starting vertex. An Eulerian path traverses every edge exactly once but need not return. Existence is decided by degree counts; construction is done by Hierholzer's algorithm in linear time. Famous origin: Euler's proof that the Konigsberg bridges cannot all be crossed exactly once.

## whyItMatters
Eulerian paths solve "reconstruct itinerary" (LeetCode 332), DNA sequence reconstruction from k-mers via de Bruijn graphs, snowplough and street-sweeper routing, and printer-circuit single-stroke etching. The de Bruijn application powers modern genome assemblers — every read is broken into overlapping k-mers, an Eulerian path on the resulting graph is the assembled sequence. It is also a natural lead-in to the harder Chinese Postman Problem.

## intuition
For an undirected graph: an Eulerian circuit exists iff every vertex has even degree (and the graph is connected ignoring isolated vertices). An Eulerian path exists iff exactly 0 or 2 vertices have odd degree; if 2, the path must start at one and end at the other. For a directed graph: a circuit needs equal in-degree and out-degree everywhere; a path allows one vertex with out - in = 1 (start) and one with in - out = 1 (end). Hierholzer's algorithm starts at the right vertex, walks edges deleting them as it goes, and stitches sub-circuits in along the way.

## visualization
Directed graph: edges A->B, B->C, C->A, A->D, D->A. Out-degrees: A=2, B=1, C=1, D=1. In-degrees: A=2, B=1, C=1, D=1. All balanced -> Eulerian circuit. Start at A. Walk A->B->C->A (stack: A,B,C,A; remaining edges: A->D, D->A). At A, unused edge A->D remains. Walk A->D->A. Splice: A->D->A->B->C->A. All 5 edges used exactly once.

## bruteForce
Enumerate all permutations of the edge list and check whether each forms a valid walk. Factorial in edge count — useless past 7-8 edges. A DFS-with-backtracking solution tries every order of out-edges at each vertex and rolls back; worst case still exponential but works for very small graphs in interview warmups.

## optimal
Hierholzer's algorithm. Maintain per-vertex pointers (e.g., iterators) into the adjacency lists so each edge is examined at most once. Push the start vertex on a stack and an empty path list. While the stack is non-empty: peek the top vertex; if it still has an unused edge, follow it (push the neighbour and advance the pointer); otherwise pop and append to the path. Reverse the path at the end for the forward order. Linear time in V + E because each edge is consumed exactly once and the stack-pop step is amortised O(1) per edge.

## complexity
time: O(V + E) for both existence check (degree count + connectivity) and Hierholzer's construction
space: O(V + E) for adjacency lists, stack, and result
notes: For multigraphs and self-loops the algorithm is unchanged — just count each edge instance. For directed Eulerian paths, also confirm that all non-isolated vertices belong to a single weakly-connected component before running Hierholzer.

## pitfalls
- Skipping the connectivity check — a graph with two disjoint balanced components has no Eulerian circuit.
- Forgetting to start at an odd-degree vertex when computing an Eulerian path (vs circuit) in an undirected graph.
- Using a list-pop-from-front instead of iterator pointers in dense graphs, turning the algorithm into O(E^2).
- Recursive Hierholzer with deep graphs (>= 10^5 edges) overflowing the call stack — use the iterative stack version.
- Returning the path in the order it was popped instead of reversing it at the end.

## interviewTips
- Decide existence first (degree counts), then construct only if needed.
- Iterators / pointers per vertex are the trick that makes this linear — say it out loud.
- Be ready for "Reconstruct Itinerary" (LeetCode 332) variant where you also need lexicographic smallest path: use a min-heap or sort each adjacency list at start.
- Mention de Bruijn / DNA assembly as the canonical application for bonus points.

## code.python
```python
from collections import defaultdict, deque

def eulerian_path_directed(edges):
    graph = defaultdict(deque)
    in_deg, out_deg = defaultdict(int), defaultdict(int)
    for u, v in edges:
        graph[u].append(v)
        out_deg[u] += 1
        in_deg[v] += 1
    start = edges[0][0]
    for node in set(list(in_deg) + list(out_deg)):
        if out_deg[node] - in_deg[node] == 1:
            start = node; break
    stack = [start]; path = []
    while stack:
        u = stack[-1]
        if graph[u]:
            stack.append(graph[u].popleft())
        else:
            path.append(stack.pop())
    return path[::-1]
```

## code.javascript
```javascript
function eulerianPathDirected(edges) {
  const graph = new Map();
  const inDeg = new Map(), outDeg = new Map();
  const inc = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const [u, v] of edges) {
    if (!graph.has(u)) graph.set(u, []);
    graph.get(u).push(v);
    inc(outDeg, u); inc(inDeg, v);
  }
  let start = edges[0][0];
  const nodes = new Set([...inDeg.keys(), ...outDeg.keys()]);
  for (const node of nodes) {
    if ((outDeg.get(node) || 0) - (inDeg.get(node) || 0) === 1) { start = node; break; }
  }
  const ptr = new Map();
  for (const [k, list] of graph) ptr.set(k, 0);
  const stack = [start], path = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const list = graph.get(u);
    const i = ptr.get(u) || 0;
    if (list && i < list.length) {
      ptr.set(u, i + 1);
      stack.push(list[i]);
    } else {
      path.push(stack.pop());
    }
  }
  return path.reverse();
}
```

## code.java
```java
import java.util.*;

public class Eulerian {
    public List<Integer> eulerianPath(int[][] edges) {
        Map<Integer, Deque<Integer>> graph = new HashMap<>();
        Map<Integer, Integer> in = new HashMap<>(), out = new HashMap<>();
        for (int[] e : edges) {
            graph.computeIfAbsent(e[0], k -> new ArrayDeque<>()).add(e[1]);
            out.merge(e[0], 1, Integer::sum);
            in.merge(e[1], 1, Integer::sum);
        }
        int start = edges[0][0];
        Set<Integer> nodes = new HashSet<>(in.keySet());
        nodes.addAll(out.keySet());
        for (int node : nodes) {
            if (out.getOrDefault(node, 0) - in.getOrDefault(node, 0) == 1) { start = node; break; }
        }
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        LinkedList<Integer> path = new LinkedList<>();
        while (!stack.isEmpty()) {
            int u = stack.peek();
            Deque<Integer> nbrs = graph.get(u);
            if (nbrs != null && !nbrs.isEmpty()) stack.push(nbrs.poll());
            else path.addFirst(stack.pop());
        }
        return path;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
#include <deque>
#include <unordered_set>

std::vector<int> eulerianPath(std::vector<std::pair<int,int>>& edges) {
    std::unordered_map<int, std::deque<int>> graph;
    std::unordered_map<int, int> in_deg, out_deg;
    for (auto& [u, v] : edges) {
        graph[u].push_back(v);
        out_deg[u]++; in_deg[v]++;
    }
    int start = edges[0].first;
    std::unordered_set<int> nodes;
    for (auto& [k, _] : in_deg) nodes.insert(k);
    for (auto& [k, _] : out_deg) nodes.insert(k);
    for (int node : nodes) {
        if (out_deg[node] - in_deg[node] == 1) { start = node; break; }
    }
    std::vector<int> stack = {start}, path;
    while (!stack.empty()) {
        int u = stack.back();
        auto it = graph.find(u);
        if (it != graph.end() && !it->second.empty()) {
            int v = it->second.front();
            it->second.pop_front();
            stack.push_back(v);
        } else {
            path.push_back(stack.back());
            stack.pop_back();
        }
    }
    std::reverse(path.begin(), path.end());
    return path;
}
```
