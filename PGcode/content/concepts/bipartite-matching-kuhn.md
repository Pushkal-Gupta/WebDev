---
slug: bipartite-matching-kuhn
module: graphs
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
An "alternating path" is a path whose edges alternate between not-in-matching and in-matching. An "augmenting path" is an alternating path that starts and ends at unmatched vertices. Flipping every edge along such a path produces a matching one edge larger. Kuhn's procedure is essentially a DFS from each left vertex that tries to find such a path; when it does, it updates the match-of array and moves on.

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
Initialize match[v] = -1 for all right vertices. For each left vertex u, run `tryAugment(u)`:
```
tryAugment(u, visited):
  for each v adjacent to u:
    if v in visited: continue
    visited.add(v)
    if match[v] == -1 or tryAugment(match[v], visited):
      match[v] = u; return true
  return false
```
The `visited` set is reset per top-level call. Total cost: V left vertices, each launching a DFS of cost O(E), giving O(V*E).

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
