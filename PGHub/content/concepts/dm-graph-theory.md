---
slug: dm-graph-theory
module: discrete-math
title: Graph Theory Fundamentals
subtitle: Vertices, edges, degrees, and the structural laws — handshaking, trees, bipartiteness, coloring, Euler and Hamilton — that every algorithm on graphs quietly depends on.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "MIT OCW 6.042J — Mathematics for Computer Science (Graph Theory unit)"
    url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/"
    type: course
  - title: "Brilliant — Graph Theory"
    url: "https://brilliant.org/wiki/graph-theory/"
    type: interactive
  - title: "West — Introduction to Graph Theory (companion site)"
    url: "https://faculty.math.illinois.edu/~west/igt/"
    type: reference
status: published
---

## intro
A graph is the most stripped-down model of "things and the relationships between them": a set of **vertices** and a set of **edges** joining pairs of them. That is the whole definition, yet it captures road networks, friendships, web links, task dependencies, molecules, and the state space of almost every puzzle. Graph theory studies what must be true about these structures regardless of what the dots and lines *mean* — how many edges force a cycle, when a graph splits into pieces, when two colors suffice, when you can trace every edge exactly once. Those structural laws are the bedrock beneath BFS, DFS, shortest paths, spanning trees, and scheduling.

## whyItMatters
Almost every non-trivial algorithm you will write eventually models its data as a graph, so the vocabulary here is not optional decoration — it is the language of the entire field. Connectivity decides whether a network stays up when a router fails; the **handshaking lemma** is a one-line sanity check that instantly catches a malformed adjacency list; **bipartiteness** is exactly the "can these tasks be split into two conflict-free shifts" question and the precondition for maximum-matching algorithms; **graph coloring** models register allocation in compilers, exam timetabling, and frequency assignment; **trees** underpin parsers, file systems, and every union-find or spanning-tree routine. Knowing that a tree on \(n\) vertices has exactly \(n-1\) edges, or that a graph is 2-colorable iff it has no odd cycle, turns a vague coding problem into a precise, provable one — and interviewers lean on exactly these facts.

## intuition
Formally a graph is \(G=(V,E)\) where \(V\) is a set of vertices and \(E\) a set of edges. In an **undirected** graph each edge is an unordered pair \(\{u,v\}\); in a **directed** graph it is an ordered pair \((u,v)\). The **degree** \(\deg(v)\) counts edges touching \(v\). The single most useful identity in the whole subject is the **handshaking lemma**: sum every vertex's degree and you have counted each edge from both ends, so

\[
\sum_{v \in V} \deg(v) = 2\,|E|.
\]

An immediate corollary: the number of odd-degree vertices is always even — you cannot have a party where an odd number of people shook an odd number of hands. In a directed graph the analogue splits into in-degree and out-degree, and \(\sum_v \deg^{-}(v) = \sum_v \deg^{+}(v) = |E|\).

A **walk** is any sequence of edges you can traverse; a **path** repeats no vertex; a **cycle** is a path that returns to its start. A graph is **connected** if some path links every pair of vertices; otherwise it breaks into **connected components**. A **tree** is a connected graph with no cycles, and the defining arithmetic is that a tree on \(|V|\) vertices has exactly \(|V|-1\) edges — the sparsest possible connected graph. Add any edge to a tree and you create exactly one cycle; remove any edge and it disconnects. A **forest** is a disjoint union of trees, with \(|V| - c\) edges for \(c\) components.

A graph is **bipartite** when its vertices split into two groups so every edge crosses between them — equivalently, it can be **2-colored**. The clean characterization: a graph is bipartite **iff it contains no odd-length cycle**. That is why a BFS that 2-colors layer by layer detects bipartiteness: a conflict (two adjacent vertices getting the same color) is exactly an odd cycle. More generally the **chromatic number** \(\chi(G)\) is the fewest colors needed so no edge joins same-colored vertices; \(\chi(G)=2\) means bipartite, \(\chi(G)=1\) means no edges at all.

Two famous traversal questions look alike but differ sharply. An **Euler circuit** walks every *edge* exactly once and returns to start; it exists iff the graph is connected and **every vertex has even degree** (an Euler *path* is allowed exactly two odd-degree vertices, the endpoints). A **Hamiltonian** path visits every *vertex* exactly once — deceptively similar, yet no simple degree test decides it and the general problem is NP-complete. Euler is about edges and has a tidy law; Hamilton is about vertices and is genuinely hard.

## visualization
```
Undirected graph G on 6 vertices.  Adjacency matrix A (A[i][j]=1 if edge i-j).

        A  B  C  D  E  F   | deg
     +------------------------+-----
   A |  0  1  1  0  0  1  |   3
   B |  1  0  1  0  0  0  |   2
   C |  1  1  0  1  0  0  |   3
   D |  0  0  1  0  1  1  |   3
   E |  0  0  0  1  0  1  |   2
   F |  1  0  0  1  1  0  |   3
     +------------------------+-----
  col sum (=deg, symmetric)    16   <- sum of degrees

  sum(deg) = 3+2+3+3+2+3 = 16 = 2*|E|  =>  |E| = 8   (handshaking check)
  odd-degree vertices: A,C,D,F  -> count 4, which is even  (as it must be)
```

## bruteForce
The most direct way to answer any structural question is exhaustive checking against the definitions. To test **connectivity**, run a flood-fill (BFS/DFS) from one vertex and see whether every vertex was reached. To test **bipartiteness** naively you might try all \(2^{|V|}\) black/white labelings and keep one with no monochromatic edge. To find an **Euler** or **Hamiltonian** route you could enumerate every ordering of edges or vertices and test validity. All of this is correct but wildly wasteful: the labeling search is exponential, and enumerating Hamiltonian orderings is \(O(n!)\). Brute force is useful only to *confirm* the theorems on tiny instances or when you genuinely need every solution; for anything real you lean on the structural laws — a single BFS replaces the \(2^{|V|}\) coloring search, and the even-degree test replaces edge enumeration for Euler circuits.

## optimal
Start with the right **representation**. An **adjacency list** stores, per vertex, its neighbors: total space \(O(|V|+|E|)\), ideal for sparse graphs and for iterating a vertex's neighbors in \(O(\deg(v))\). An **adjacency matrix** is a \(|V|\times|V|\) grid of 0/1: \(O(|V|^2)\) space, but \(O(1)\) edge lookup and clean for dense graphs or degree-by-row-sum reasoning. Choose the list unless the graph is dense or you need constant-time "is there an edge?"

**Degrees** fall straight out: for an adjacency list, \(\deg(v)\) is the length of \(v\)'s neighbor list, and summing them must equal \(2|E|\) by the handshaking lemma — a free integrity check on your input.

**Bipartiteness via BFS 2-coloring** is the workhorse. Color the start vertex 0; for each vertex you dequeue, color every uncolored neighbor with the opposite color and enqueue it; if a neighbor already carries the *same* color, you have found an odd cycle and the graph is not bipartite. This runs in \(O(|V|+|E|)\) and simultaneously proves 2-colorability or produces the offending conflict. It must loop over all components so a disconnected graph isn't misjudged.

For **coloring** in general, computing \(\chi(G)\) exactly is NP-hard, but a **greedy** coloring that scans vertices and assigns the smallest color unused by already-colored neighbors always succeeds with at most \(\Delta+1\) colors, where \(\Delta\) is the maximum degree:

\[
\chi(G) \le \Delta + 1.
\]

That bound is tight for complete graphs and odd cycles and loose elsewhere, but it is a cheap, provable ceiling. For **Euler circuits**, skip enumeration entirely: check connectivity of the non-isolated vertices and that every degree is even (\(\sum \deg\) even is necessary but not sufficient — you need *each* degree even). For **Hamiltonian** paths there is no such shortcut; you fall back to backtracking with pruning or dynamic programming over subsets (\(O(2^n n^2)\) Held-Karp), because the problem is NP-complete. The lesson: exploit the tidy laws (handshaking, tree edge count, no-odd-cycle, even-degree) wherever they exist, and only pay exponential cost where the theory proves you must.

## complexity
time: BFS/DFS traversal, connectivity, and BFS 2-coloring are all O(|V|+|E|) on an adjacency list. Degree computation is O(|V|+|E|) to build, O(1) to read per vertex. Greedy coloring is O(|V|+|E|). Euler-circuit existence is O(|V|+|E|). Exact chromatic number and Hamiltonian path are NP-hard: O(2^n) territory (Held-Karp Hamiltonian is O(2^n n^2)).
space: Adjacency list O(|V|+|E|); adjacency matrix O(|V|^2). BFS/DFS need O(|V|) for the color/visited array and the queue or recursion stack.
notes: Prefer the adjacency list for sparse graphs and O(deg(v)) neighbor iteration; use the matrix only for dense graphs or O(1) edge queries. Always loop coloring/connectivity over every component. The handshaking lemma sum(deg)=2|E| is a free O(|V|) validation of any parsed graph.
## pitfalls
- **Directed vs undirected degree.** In an undirected graph one edge adds 1 to each endpoint's degree; in a directed graph you must track in-degree and out-degree separately. Applying the undirected handshaking lemma to a digraph, or forgetting that \(\sum \deg^{-} = \sum \deg^{+} = |E|\), gives wrong edge counts.
- **Self-loops count twice.** A loop at \(v\) contributes **2** to \(\deg(v)\) in an undirected graph (both endpoints are \(v\)), and many adjacency-list builders wrongly add 1 — breaking the handshaking check and every parity argument that follows.
- **Confusing Euler with Hamiltonian.** Euler traverses every *edge* once and has a clean even-degree test; Hamilton visits every *vertex* once and is NP-complete with no simple degree criterion. Treating a Hamiltonian question as if the even-degree rule applied is a classic and costly mistake.
- **Assuming the graph is connected.** Bipartiteness, coloring, and Euler tests must iterate over *all* connected components; running BFS from a single start vertex silently ignores unreachable components and reports false results on disconnected input.
- **Tree vs forest edge count.** A tree on \(n\) vertices has exactly \(n-1\) edges, but a forest with \(c\) components has \(n-c\) edges. Assuming \(n-1\) for a disconnected acyclic graph, or concluding "acyclic and \(n-1\) edges" without also checking connectivity, misclassifies the structure.

## interviewTips
- When a problem says "split into two groups with no internal conflicts" or "assign one of two values so adjacent items differ," recognize it instantly as **bipartite / 2-coloring** and reach for BFS layer-coloring in \(O(|V|+|E|)\), reporting the odd-cycle conflict if one exists.
- Use the **handshaking lemma** out loud as a sanity check and a proof tool: "sum of degrees is even, so the count of odd-degree vertices must be even" resolves many parity puzzles in one line and shows you reason structurally, not by brute force.
- Be ready to distinguish **Euler vs Hamiltonian** crisply: Euler = every edge once, decided by connectivity + even degrees (or exactly two odd for a path); Hamiltonian = every vertex once, NP-complete, no easy test. Naming which one applies and why is exactly what interviewers probe.

## keyTakeaways
- A graph is \(G=(V,E)\); the **handshaking lemma** \(\sum_v \deg(v) = 2|E|\) is the universal identity, and it forces the number of odd-degree vertices to be even.
- A **tree** is a connected acyclic graph with exactly \(|V|-1\) edges; a graph is **bipartite** (2-colorable) iff it has **no odd cycle**, detectable by BFS 2-coloring in \(O(|V|+|E|)\), and greedy coloring guarantees \(\chi(G)\le\Delta+1\).
- **Euler** circuits (every edge once) have a clean test — connected with all degrees even — while **Hamiltonian** paths (every vertex once) are NP-complete with no simple criterion; never conflate the two.

## code.python
```python
from collections import deque

def degrees(n, edges):
    """Undirected degree of each vertex; self-loop counts twice."""
    deg = [0] * n
    for u, v in edges:
        deg[u] += 1
        deg[v] += 1  # for u == v this correctly adds 2 to deg[u]
    return deg

def build_adj(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        if u != v:
            adj[v].append(u)
    return adj

def is_bipartite(n, edges):
    """BFS 2-coloring over every component. Returns (bipartite?, color list)."""
    adj = build_adj(n, edges)
    color = [-1] * n
    for start in range(n):
        if color[start] != -1:
            continue
        color[start] = 0
        q = deque([start])
        while q:
            u = q.popleft()
            for w in adj[u]:
                if color[w] == -1:
                    color[w] = color[u] ^ 1
                    q.append(w)
                elif color[w] == color[u]:
                    return False, color  # odd cycle conflict
    return True, color

n = 6
edges = [(0, 1), (0, 2), (1, 3), (2, 3), (3, 4), (4, 5), (0, 5)]
d = degrees(n, edges)
print("degrees:", d, "sum:", sum(d), "2|E|:", 2 * len(edges))  # sum == 2|E|
print("bipartite:", is_bipartite(n, edges)[0])
```

## code.javascript
```javascript
function degrees(n, edges) {
  const deg = new Array(n).fill(0);
  for (const [u, v] of edges) { deg[u] += 1; deg[v] += 1; }
  return deg;
}

function buildAdj(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); if (u !== v) adj[v].push(u); }
  return adj;
}

function isBipartite(n, edges) {
  const adj = buildAdj(n, edges);
  const color = new Array(n).fill(-1);
  for (let start = 0; start < n; start++) {
    if (color[start] !== -1) continue;
    color[start] = 0;
    const q = [start];
    while (q.length) {
      const u = q.shift();
      for (const w of adj[u]) {
        if (color[w] === -1) { color[w] = color[u] ^ 1; q.push(w); }
        else if (color[w] === color[u]) return false; // odd cycle
      }
    }
  }
  return true;
}

const n = 6;
const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [0, 5]];
const d = degrees(n, edges);
console.log("sum(deg):", d.reduce((a, b) => a + b, 0), "2|E|:", 2 * edges.length);
console.log("bipartite:", isBipartite(n, edges));
```

## code.java
```java
import java.util.*;

public class GraphBasics {
    static int[] degrees(int n, int[][] edges) {
        int[] deg = new int[n];
        for (int[] e : edges) { deg[e[0]]++; deg[e[1]]++; }
        return deg;
    }

    static List<List<Integer>> buildAdj(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            if (e[0] != e[1]) adj.get(e[1]).add(e[0]);
        }
        return adj;
    }

    static boolean isBipartite(int n, int[][] edges) {
        List<List<Integer>> adj = buildAdj(n, edges);
        int[] color = new int[n];
        Arrays.fill(color, -1);
        for (int start = 0; start < n; start++) {
            if (color[start] != -1) continue;
            color[start] = 0;
            Deque<Integer> q = new ArrayDeque<>();
            q.add(start);
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int w : adj.get(u)) {
                    if (color[w] == -1) { color[w] = color[u] ^ 1; q.add(w); }
                    else if (color[w] == color[u]) return false; // odd cycle
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        int n = 6;
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {4, 5}, {0, 5}};
        int[] d = degrees(n, edges);
        int sum = 0; for (int x : d) sum += x;
        System.out.println("sum(deg)=" + sum + " 2|E|=" + (2 * edges.length));
        System.out.println("bipartite=" + isBipartite(n, edges));
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> degrees(int n, const vector<pair<int,int>>& edges) {
    vector<int> deg(n, 0);
    for (auto& [u, v] : edges) { deg[u]++; deg[v]++; }
    return deg;
}

vector<vector<int>> buildAdj(int n, const vector<pair<int,int>>& edges) {
    vector<vector<int>> adj(n);
    for (auto& [u, v] : edges) { adj[u].push_back(v); if (u != v) adj[v].push_back(u); }
    return adj;
}

bool isBipartite(int n, const vector<pair<int,int>>& edges) {
    auto adj = buildAdj(n, edges);
    vector<int> color(n, -1);
    for (int start = 0; start < n; ++start) {
        if (color[start] != -1) continue;
        color[start] = 0;
        queue<int> q; q.push(start);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int w : adj[u]) {
                if (color[w] == -1) { color[w] = color[u] ^ 1; q.push(w); }
                else if (color[w] == color[u]) return false; // odd cycle
            }
        }
    }
    return true;
}

int main() {
    int n = 6;
    vector<pair<int,int>> edges = {{0,1},{0,2},{1,3},{2,3},{3,4},{4,5},{0,5}};
    auto d = degrees(n, edges);
    int sum = accumulate(d.begin(), d.end(), 0);
    printf("sum(deg)=%d 2|E|=%d\n", sum, 2 * (int)edges.size());
    printf("bipartite=%d\n", isBipartite(n, edges) ? 1 : 0);
    return 0;
}
```
