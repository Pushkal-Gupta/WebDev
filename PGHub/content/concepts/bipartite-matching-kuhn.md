---
slug: bipartite-matching-kuhn
module: graphs-advanced
title: Bipartite Matching — Kuhn's Algorithm
subtitle: Augmenting-path maximum matching in O(V*E) on bipartite graphs.
difficulty: Advanced
position: 30
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
Kuhn's algorithm finds a maximum cardinality matching in a bipartite graph by repeatedly searching for augmenting paths from unmatched left vertices. Each augmenting path flips matched and unmatched edges along its length, increasing the matching size by one. When no augmenting path remains, the matching is provably maximum (Berge's theorem).

## whyItMatters
Bipartite matching is the assignment problem stripped to its bones — jobs to workers, courses to rooms, applicants to internships, fingerprints to identities, riders to drivers. It also encodes vertex covers (König's theorem), independent sets on bipartite graphs, and many DP-on-graph reductions. Kuhn is the simplest algorithm to implement correctly under interview pressure; Hopcroft-Karp is the asymptotic improvement when V and E are large.

## intuition
The algorithm exists because greedy edge-matching gets stuck: picking edges in arbitrary order can lead to a locally maximal matching that is globally suboptimal (e.g., greedy picks A-1 and B-2, stranding C with no neighbour available even though a perfect matching exists). Berge's theorem (1957) gives the escape route: a matching M is maximum iff no *augmenting path* exists relative to M. An "alternating path" alternates between unmatched and matched edges; an "augmenting path" is an alternating path whose two endpoints are both currently unmatched. Flipping every edge along such a path — unmatched becomes matched, matched becomes unmatched — produces a matching one edge larger, because the path has one more unmatched than matched edge by construction.

Kuhn's algorithm (1955) is the operationalisation: try every left vertex as a starting point, and for each, run a DFS that searches for an augmenting path. The DFS visits a left vertex's neighbours; if a neighbour is unmatched, the path terminates and we update the match. If the neighbour is already matched to some other left vertex u', recursively try to find an augmenting path starting from u' — if u' can re-route to a different partner, the current vertex can take the freed slot. The `visited` set is reset per top-level call to prevent infinite loops within a single DFS but allowed to grow across the V top-level calls.

The deeper principle is that bipartite matching is the dual of vertex cover on bipartite graphs (König 1931): max matching equals min vertex cover. So Kuhn implicitly solves vertex cover too, and the same algorithm extracts a minimum vertex cover via post-processing on alternating-path coverage. The Hungarian algorithm (Kuhn 1955) extends this to weighted bipartite matching; Hopcroft-Karp (1973) improves the bound to O(E√V) by augmenting along *vertex-disjoint shortest* augmenting paths in batches via BFS layering.

## visualization
```
left:  A B C        matching after augmentation:
right: 1 2 3        A - 1
edges: A-1 A-2      B - 2
       B-1 B-2      C - 3
       C-2 C-3
DFS from A finds 1 (free)             -> match A-1
DFS from B sees 1 (taken by A), reroutes A to 2 -> A-2, B-1
DFS from C sees 2 (taken by A), tries to reroute A; A's only other option is 1
  which is taken by B; reroute B to free... no path; C tries 3 directly -> C-3
final matching size = 3
```

## bruteForce
Try every subset of edges as a matching and check validity. That is 2^E. Even greedy "match the next edge if endpoints free" stalls at suboptimal local maxima — example: greedy picks A-1 and B-2, leaving C unmatched even though a perfect matching exists.

## optimal
**Technique: Kuhn's augmenting-path DFS (1955).** O(V·E) — each of the V left vertices launches a DFS of cost O(E). Hopcroft-Karp (1973) improves the bound to O(E·√V) by batching augmenting paths via BFS layering, but Kuhn is the textbook interview answer because it is correct in 12 lines of code.

```python
def kuhn_matching(n_left, n_right, adj):
    match = [-1] * n_right                    # match[v] = left vertex matched to right v

    def try_aug(u, visited):
        for v in adj[u]:
            if visited[v]: continue
            visited[v] = True
            # v is free, or its current owner can re-route
            if match[v] == -1 or try_aug(match[v], visited):
                match[v] = u
                return True
        return False

    matched = 0
    for u in range(n_left):
        if try_aug(u, [False] * n_right):     # fresh visited per top-level call
            matched += 1
    return matched, match
```

Key lines: `match[v] == -1 or try_aug(match[v], visited)` is the augmenting-path recursion — either the neighbour is unmatched and we claim it, or its current owner recursively searches for a different partner. The `visited` array is per top-level call (`[False] * n_right` inside the loop) to allow each augmentation attempt to fresh-explore the right side without interference from previous successful augmentations. Without the visited guard, two left vertices fighting over the same right vertex would loop forever.

Total cost: V augmentation attempts × O(E) per DFS = O(V·E). In practice Kuhn runs much faster than its worst case because most augmenting DFS calls terminate quickly — the worst case requires a hand-crafted graph that forces a long alternating chain at each step.

**Why not greedy?** Greedy stalls at suboptimal local maxima as shown in the visualisation; Berge's theorem guarantees augmenting-path search reaches the global maximum. **Why not max-flow?** Bipartite matching reduces to max-flow with unit-capacity edges and a virtual source/sink. Dinic's algorithm on this construction is exactly Hopcroft-Karp, giving O(E·√V). For weighted variants, use the Hungarian algorithm (O(V³)). **Why not König's theorem?** König relates matching to vertex cover but does not directly compute the matching — it is used post-hoc to extract a minimum vertex cover from Kuhn's output. **For dense graphs (V ≤ 500)**, Hopcroft-Karp is the production choice; for V ≤ 10⁴ sparse graphs, Kuhn is competitive and far simpler.

## complexity
time: O(V * E) — Kuhn; Hopcroft-Karp improves to O(E * sqrt(V))
space: O(V + E) for the adjacency list plus the match array
notes: In practice Kuhn runs much faster than its worst case because most augmenting DFS calls terminate quickly. Hopcroft-Karp pays off when V grows past ~10^4 with dense edges.

## pitfalls
- Forgetting to reset `visited` between top-level augment calls — leads to false negatives.
- Confusing which side is "left" — Kuhn only iterates from one side; iterating from both double-counts the matching.
- Returning when the first neighbor is free without trying to reroute when it is not — defeats the augmenting-path logic.
- Misreading a directed graph as bipartite — Kuhn requires an undirected bipartite structure.

## interviewTips
- Cite König's theorem if asked about minimum vertex cover on a bipartite graph — it equals the maximum matching.
- Mention Hall's theorem ("a perfect matching exists iff every subset S of one side has |N(S)| >= |S|") to show theoretical depth.
- Be ready to extend: weighted bipartite matching uses the Hungarian algorithm, not Kuhn; bring it up if the prompt mentions weights.

## code.python
```python
def kuhn_matching(n_left, n_right, adj):
    match = [-1] * n_right
    def try_aug(u, visited):
        for v in adj[u]:
            if visited[v]: continue
            visited[v] = True
            if match[v] == -1 or try_aug(match[v], visited):
                match[v] = u
                return True
        return False
    matched = 0
    for u in range(n_left):
        if try_aug(u, [False] * n_right):
            matched += 1
    return matched, match
```

## code.javascript
```javascript
function kuhnMatching(nLeft, nRight, adj) {
  const match = new Array(nRight).fill(-1);
  function tryAug(u, visited) {
    for (const v of adj[u]) {
      if (visited[v]) continue;
      visited[v] = true;
      if (match[v] === -1 || tryAug(match[v], visited)) {
        match[v] = u;
        return true;
      }
    }
    return false;
  }
  let matched = 0;
  for (let u = 0; u < nLeft; u++) {
    if (tryAug(u, new Array(nRight).fill(false))) matched++;
  }
  return { matched, match };
}
```

## code.java
```java
class Kuhn {
    int[] match;
    java.util.List<java.util.List<Integer>> adj;
    int nRight;
    int solve(int nLeft, int nRight, java.util.List<java.util.List<Integer>> adj) {
        this.adj = adj; this.nRight = nRight;
        match = new int[nRight];
        java.util.Arrays.fill(match, -1);
        int matched = 0;
        for (int u = 0; u < nLeft; u++) {
            boolean[] visited = new boolean[nRight];
            if (tryAug(u, visited)) matched++;
        }
        return matched;
    }
    boolean tryAug(int u, boolean[] visited) {
        for (int v : adj.get(u)) {
            if (visited[v]) continue;
            visited[v] = true;
            if (match[v] == -1 || tryAug(match[v], visited)) {
                match[v] = u;
                return true;
            }
        }
        return false;
    }
}
```

## code.cpp
```cpp
struct Kuhn {
    int nRight;
    vector<int> match;
    vector<vector<int>> adj;
    bool tryAug(int u, vector<char>& visited) {
        for (int v : adj[u]) {
            if (visited[v]) continue;
            visited[v] = 1;
            if (match[v] == -1 || tryAug(match[v], visited)) {
                match[v] = u;
                return true;
            }
        }
        return false;
    }
    int solve(int nLeft, int nR, vector<vector<int>> g) {
        nRight = nR; adj = move(g);
        match.assign(nRight, -1);
        int matched = 0;
        for (int u = 0; u < nLeft; ++u) {
            vector<char> visited(nRight, 0);
            if (tryAug(u, visited)) ++matched;
        }
        return matched;
    }
};
```
