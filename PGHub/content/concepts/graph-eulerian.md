---
slug: graph-eulerian
module: graphs-advanced
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
Picture yourself as a mail carrier who must walk every street exactly once. Every time you enter a junction you must also leave it, so each visit consumes two street-ends. That pairing is the whole secret: for an undirected graph an Eulerian circuit exists iff every vertex has even degree (and the graph is connected ignoring isolated vertices), because only even degree lets you always pair an entry with an exit. An Eulerian path exists iff exactly 0 or 2 vertices have odd degree; if 2, the path must start at one and end at the other — those two odd vertices are the only places allowed a leftover unpaired street-end (the start has one extra exit, the end one extra entry). For a directed graph: a circuit needs equal in-degree and out-degree everywhere; a path allows one vertex with out - in = 1 (start) and one with in - out = 1 (end).

What's actually happening in Hierholzer's algorithm: you take a naive walk, deleting edges as you cross them, until you get stuck. You can only ever get stuck back at the start (in a balanced graph every other vertex still has a free exit whenever you arrive). That first loop probably missed some edges, so you rewind to the earliest vertex on your walk that still has unused edges and splice a second loop in at that spot — repeating until nothing is left. Concrete micro-example: vertices A, B, C, D with directed edges A->B, B->C, C->A, A->D, D->A. Out-degrees all equal in-degrees, so a circuit exists. Start at A, walk A->B->C->A and get stuck (A's edge to B is gone). A still has the unused A->D, so splice the loop A->D->A in at A, giving A->D->A->B->C->A — all five edges used exactly once. Hierholzer's algorithm starts at the right vertex, walks edges deleting them as it goes, and stitches sub-circuits in along the way.

## visualization
Directed graph: edges A->B, B->C, C->A, A->D, D->A. Out-degrees: A=2, B=1, C=1, D=1. In-degrees: A=2, B=1, C=1, D=1. All balanced -> Eulerian circuit. Start at A. Walk A->B->C->A (stack: A,B,C,A; remaining edges: A->D, D->A). At A, unused edge A->D remains. Walk A->D->A. Splice: A->D->A->B->C->A. All 5 edges used exactly once.

The Hierholzer stack trace below shows every step. "peek" is the top of stack; "action" is either follow (push a neighbour, delete the edge) or pop (top has no unused edges, append it to path). Adjacency starts as A:[B,D], B:[C], C:[A], D:[A].

```text
step  stack            peek  unused@peek   action              path (popped)
 0    [A]              A     B,D           follow A->B         []
 1    [A,B]            B     C             follow B->C         []
 2    [A,B,C]          C     A             follow C->A         []
 3    [A,B,C,A]        A     D             follow A->D         []
 4    [A,B,C,A,D]      D     A             follow D->A         []
 5    [A,B,C,A,D,A]    A     -             pop A               [A]
 6    [A,B,C,A,D]      D     -             pop D               [A,D]
 7    [A,B,C,A]        A     -             pop A               [A,D,A]
 8    [A,B,C]          C     -             pop C               [A,D,A,C]
 9    [A,B]            B     -             pop B               [A,D,A,C,B]
10    [A]              A     -             pop A               [A,D,A,C,B,A]
reverse(path) = A->B->C->A->D->A   (all 5 edges, each once)
```

## bruteForce
Enumerate all permutations of the edge list and check whether each forms a valid walk. Factorial in edge count — useless past 7-8 edges. A DFS-with-backtracking solution tries every order of out-edges at each vertex and rolls back; worst case still exponential but works for very small graphs in interview warmups.

## optimal
Hierholzer's algorithm. First pick the correct start: for a directed path it is the vertex with out - in = 1, otherwise any vertex with an outgoing edge; for an undirected path it is one of the two odd-degree vertices. Maintain per-vertex pointers (e.g., iterators) into the adjacency lists so each edge is examined at most once. Push the start vertex on a stack and an empty path list. While the stack is non-empty: peek the top vertex; if it still has an unused edge, follow it (push the neighbour and advance the pointer); otherwise pop and append to the path. Reverse the path at the end for the forward order.

Why it is correct rests on one invariant: the stack always holds a valid partial walk from the start down to the current vertex, and every edge that has been advanced past is either already on the stack or already flushed into the path. When you peek a vertex with no remaining edges you have hit a dead end — in a graph satisfying the degree conditions that dead end can only be the natural end of a sub-tour — so you retire that vertex to the output. Popping it exposes the vertex you came from, and if that predecessor still has unused edges the loop immediately starts a fresh sub-tour there, which is exactly the "splice a cycle in at the first vertex with spare edges" step done implicitly by the stack. Because the output is built in reverse (dead ends first), the final reversal yields the edges in true traversal order. Complexity intuition: the pointer advance means every edge is pushed exactly once and every vertex is popped exactly once, so the total work is a constant number of operations per edge plus per vertex — linear time in V + E, with the stack pops amortised O(1) per edge.

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
