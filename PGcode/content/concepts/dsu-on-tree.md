---
slug: dsu-on-tree
module: trees
title: DSU on Tree (Small-to-Large)
subtitle: Aggregate subtree statistics in O(n log n) by always merging the smaller set into the larger one.
difficulty: Advanced
position: 25
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Tarjan — Notes on small-to-large merging"
    url: ""
status: published
---

## intro
"DSU on tree" (also known as **small-to-large merging** or **Sack**) is a technique for answering subtree-aggregation queries — "how many distinct colors in the subtree of v?", "what's the most frequent value in v's subtree?", "for every node v, sum some function of its subtree's set" — in O(n log n) total, using only basic data structures (a hash set + a counter array).

## whyItMatters
Without DSU-on-tree, answering "for every node v, give X(subtree(v))" requires either a heavy-light decomposition + segment tree (O(n log² n), complex code) or a Mo's-on-tree (offline only). DSU-on-tree gives you O(n log n) online with **30 lines of code**. It's a workhorse for problems framed as "compute Y for every subtree."

## intuition
A naive recursion that builds a fresh set per node is O(n²) in the worst case (path graph: subtree size n, then n-1, then n-2, ...). The trick: identify the **heavy child** (child with the largest subtree) at each node. When you finish processing v, KEEP the heavy child's aggregate set and add only the lighter children's contributions on top. The bookkeeping says each element is touched at most O(log n) times because it can be "light side" of an ancestor at most O(log n) times — every time it is, the heavy subtree it belongs to doubles in size.

## visualization
```
For each subtree query, walk children:
  - First recurse into light children, then DISCARD their sets (will rebuild later)
  - Then recurse into the heavy child, KEEPING its set
  - Add v's own value to the set
  - Add each light child's subtree values back in
  - Record the answer for v
```

## bruteForce
For each v, DFS its subtree and aggregate from scratch. O(n²) worst case. Fine for n ≤ 1000.

## optimal
```
sizes = compute via DFS                       # for picking heavy child
heavy[v] = child with largest size, or -1

def dfs(v, keep):
    # 1. Recurse into LIGHT children, do not keep their counts.
    for c in children(v):
        if c != heavy[v]: dfs(c, keep=False)
    # 2. Recurse into HEAVY child and keep its counts.
    if heavy[v] != -1: dfs(heavy[v], keep=True)
    # 3. Add v's own value to the running counter.
    add(v.value, +1)
    # 4. Add each light child's subtree back in.
    for c in children(v):
        if c != heavy[v]:
            for u in subtree(c): add(u.value, +1)
    # 5. Answer the query about subtree(v).
    answers[v] = current_query_result()
    # 6. If not keeping (i.e., we're a light child), erase what we added.
    if not keep:
        for u in subtree(v): add(u.value, -1)
```

**Step 4** is the actual O(n log n) work: each element is the "light contribution" at most O(log n) times during the entire algorithm.

For the "K-th frequent" / "distinct count" variants, swap the counter array for whatever aggregate you need (hash map, BIT, etc.).

## complexity
- **Time**: O(n log n) total — every element is added at most O(log n) times.
- **Space**: O(n) for the counter / set.
- **No fancy data structure required**: a plain integer array does for "distinct count" or "frequency."

## pitfalls
- **Forgetting to clean up light branches**: causes counters to bleed across subtrees → wrong answers.
- **Misidentifying the heavy child**: needs sizes, not depths. Use the first DFS to fill `size[]`.
- **Recursion depth**: at n = 10^5 you may need iterative DFS or a higher recursion limit (Python).
- **Mixed query types**: the technique fits "per-node subtree aggregate." For path queries, use HLD instead.
- **Hash map churn**: if your aggregate is a hash map and you're erasing+reinserting on every light branch, you'll get cache misses. Use a fixed array of counts where possible.

## interviewTips
- The trigger: "for every node v, compute Y over its subtree, n ≤ 2 · 10^5." Reach for DSU-on-tree.
- Walk through the "each element is light O(log n) times" argument — interviewers find it elegant.
- Compare with **HLD + segment tree** (more general, supports path queries, harder to code) and **Mo's algorithm on tree** (offline, square-root decomposition over Euler tour).
- For senior interviews, mention that DSU-on-tree generalizes to *any* commutative subtree aggregate.

## code.python
```python
import sys
sys.setrecursionlimit(10**6)

def count_distinct_colors(n, edges, color):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    size = [1]*n
    parent = [-1]*n
    order = []
    stack = [0]; visited = [False]*n; visited[0] = True
    # iterative DFS for size + parent
    while stack:
        v = stack[-1]; found = False
        for c in adj[v]:
            if not visited[c]:
                visited[c] = True; parent[c] = v
                stack.append(c); found = True; break
        if not found:
            order.append(stack.pop())
            if parent[order[-1]] != -1:
                size[parent[order[-1]]] += size[order[-1]]

    heavy = [-1]*n
    for v in range(n):
        for c in adj[v]:
            if c != parent[v] and (heavy[v] == -1 or size[c] > size[heavy[v]]):
                heavy[v] = c

    cnt = {}; ans = [0]*n
    def add(v, sign):
        cnt[color[v]] = cnt.get(color[v], 0) + sign
        if cnt[color[v]] == 0: del cnt[color[v]]

    def collect(v, sign, skip):
        add(v, sign)
        for c in adj[v]:
            if c != parent[v] and c != skip: collect(c, sign, skip)

    def solve(v, keep):
        for c in adj[v]:
            if c != parent[v] and c != heavy[v]: solve(c, False)
        if heavy[v] != -1: solve(heavy[v], True)
        add(v, +1)
        for c in adj[v]:
            if c != parent[v] and c != heavy[v]: collect(c, +1, parent[v])
        ans[v] = len(cnt)
        if not keep:
            collect(v, -1, parent[v])

    solve(0, True)
    return ans
```

## code.javascript
```javascript
// JS mirror of the Python algorithm. Use Map for cnt to avoid prototype pollution.
function distinctColors(n, edges, color) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const size = new Int32Array(n).fill(1);
  const parent = new Int32Array(n).fill(-1);
  // … (parent + size computation via iterative DFS, omitted for brevity) …
  // Same recursion as the Python solve(v, keep) above.
  return new Int32Array(n);  // sketch only
}
```

## code.java
```java
import java.util.*;
class DsuOnTree {
    int[] size, parent, heavy, answer;
    int[] color;
    List<List<Integer>> adj;
    Map<Integer, Integer> cnt = new HashMap<>();
    public int[] distinctColors(int n, int[][] edges, int[] color) {
        // build adj, fill size/parent via iterative DFS, pick heavy children,
        // then recurse with the "small-to-large" rule. Outline only.
        return new int[n];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
struct DsuOnTree {
    int n;
    std::vector<std::vector<int>> adj;
    std::vector<int> size, parent, heavy, color, answer;
    std::unordered_map<int, int> cnt;
    void add(int v, int sign) { cnt[color[v]] += sign; if (cnt[color[v]] == 0) cnt.erase(color[v]); }
    void collect(int v, int sign, int skip) {
        add(v, sign);
        for (int c : adj[v]) if (c != parent[v] && c != skip) collect(c, sign, skip);
    }
    void solve(int v, bool keep) {
        for (int c : adj[v]) if (c != parent[v] && c != heavy[v]) solve(c, false);
        if (heavy[v] != -1) solve(heavy[v], true);
        add(v, +1);
        for (int c : adj[v]) if (c != parent[v] && c != heavy[v]) collect(c, +1, parent[v]);
        answer[v] = (int) cnt.size();
        if (!keep) collect(v, -1, parent[v]);
    }
};
```
