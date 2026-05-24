---
slug: union-find-rollback
module: graphs
title: Union-Find with Rollback
subtitle: DSU that can undo unions in LIFO order — the workhorse for offline edge-deletion graph queries.
difficulty: Advanced
position: 1
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CP-Algorithms — DSU with rollback and offline RMQ"
    url: "https://cp-algorithms.com/data_structures/disjoint_set_union.html#dsu-with-rollback"
    type: blog
  - title: "Princeton Algorithms — Union-Find"
    url: "https://algs4.cs.princeton.edu/15uf/"
    type: book
  - title: "TheAlgorithms/Python — disjoint_set.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/disjoint_set/disjoint_set.py"
    type: repo
status: published
---

## intro
A classical disjoint-set union (DSU) supports `find` and `union`, with path compression and union by rank giving near-constant amortized cost. Path compression mutates the parent pointers during reads, which makes it impossible to undo a `union`. Rollback DSU sacrifices path compression but keeps union by rank/size, recording each parent/rank change on a stack so any union can be unrolled in O(α(n)) per operation. This unlock is what turns DSU into the engine for offline graph problems where edges arrive and disappear.

## whyItMatters
Many "connectivity over time" problems — answering "are u and v connected after these inserts, queries, and deletes interleaved?" — are easy if you can process them offline with rollback DSU on a segment tree of time intervals. Without rollback, every edge deletion forces a full DSU rebuild. With rollback, the total work is O((N + Q) log Q · α(N)). It is also the standard tool for offline LCA, dynamic MST on a time axis, and small-to-large merging.

## intuition
Picture each union as adding a brick to a wall. Path compression smashes earlier bricks to flatten the wall — you cannot rebuild them. Rollback DSU forbids smashing: it only places bricks on top. To undo, lift the last brick. Because union by rank keeps the wall short (height O(log n)), even without compression `find` is fast enough.

## visualization
Stack snapshots after operations: `union(1,2)` pushes `(parent[2]=2, rank[1]=0)` then sets `parent[2]=1, rank[1]=1`. `union(3,4)` pushes its pair, then `union(1,3)` merges the two-element trees. To rollback the last union, pop the stack entries in reverse and restore. After two rollbacks the structure is back to `{1}, {2}, {3}, {4}` with no traces left behind. Crucially `find(x)` walks up parents — never modifies them.

## bruteForce
Recompute connectivity from scratch for every state. For a sequence of E edge changes and Q queries that is O((E + Q) × (N + E)) — too slow past a few thousand operations. Or attempt to implement a fully-dynamic connectivity structure (Holm/Lichtenberg/Thorup) with O(log² n) per op; correct but a several-hundred-line implementation that is hard to land in an interview.

## optimal
Implement DSU with union by size and no path compression. Maintain a stack of (index, old_parent, old_size) tuples — exactly the slots that changed during the union. Expose `snapshot()` returning the current stack height and `rollback(target)` that pops down to that height, restoring each slot. For "offline deletion" problems, build a segment tree over the time axis where each edge lives in its alive interval. DFS the tree: at each node push the edges that span this node's range, recursively descend, answer queries that live at leaves, then rollback to the snapshot from before the node's pushes. Total: O((N + Q) log Q · α(N)).

## complexity
time: O(log n) per find or union (no compression, union by size); O(1) per rollback step
space: O(α(operations)) for the change stack
notes: Each union pushes at most two entries (one parent, one size) — bounded. The trick is to never use path compression and never call recursive find that would compress. Keep find iterative and pointer-walking only.

## pitfalls
- Mixing path compression in by reflex — silently destroys rollback correctness, no compile error, only wrong answers later.
- Forgetting to push the no-op case: `union(x, y)` where roots are equal still needs to record "did nothing" or the rollback count gets out of sync.
- Storing the entire DSU array per snapshot instead of just the diff — O(n) per snapshot blows memory.
- Using rank instead of size and then trying to use size elsewhere — pick one and stay consistent.
- Rolling back queries the wrong direction — entries must be popped in strict LIFO order.

## interviewTips
- State the trade-off upfront: "I drop path compression for rollback; find is O(log n) instead of α(n) — fine for offline scenarios."
- Pair it with the segment tree on time intervals — this is the classic offline-deletion recipe.
- Mention small-to-large merging as the cousin pattern — same DSU shape, different driver.
- If asked about online dynamic connectivity, name-drop ETT (Euler Tour Trees) and Holm/Lichtenberg/Thorup but stay practical: "for interview-scale, offline + rollback is the answer."

## code.python
```python
class RollbackDSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.history = []

    def find(self, x):
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            self.history.append(None)
            return False
        if self.size[a] < self.size[b]:
            a, b = b, a
        self.history.append((b, self.parent[b], a, self.size[a]))
        self.parent[b] = a
        self.size[a] += self.size[b]
        return True

    def snapshot(self):
        return len(self.history)

    def rollback(self, target):
        while len(self.history) > target:
            change = self.history.pop()
            if change is None:
                continue
            b, old_parent_b, a, old_size_a = change
            self.parent[b] = old_parent_b
            self.size[a] = old_size_a
```

## code.javascript
```javascript
export class RollbackDSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.history = [];
  }

  find(x) {
    while (this.parent[x] !== x) x = this.parent[x];
    return x;
  }

  union(a, b) {
    a = this.find(a); b = this.find(b);
    if (a === b) { this.history.push(null); return false; }
    if (this.size[a] < this.size[b]) [a, b] = [b, a];
    this.history.push([b, this.parent[b], a, this.size[a]]);
    this.parent[b] = a;
    this.size[a] += this.size[b];
    return true;
  }

  snapshot() { return this.history.length; }

  rollback(target) {
    while (this.history.length > target) {
      const c = this.history.pop();
      if (!c) continue;
      const [b, pb, a, sa] = c;
      this.parent[b] = pb;
      this.size[a] = sa;
    }
  }
}
```

## code.java
```java
public class RollbackDSU {
    private final int[] parent, size;
    private final Deque<int[]> history = new ArrayDeque<>();

    public RollbackDSU(int n) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    public int find(int x) {
        while (parent[x] != x) x = parent[x];
        return x;
    }

    public boolean union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) { history.push(new int[0]); return false; }
        if (size[a] < size[b]) { int t = a; a = b; b = t; }
        history.push(new int[]{ b, parent[b], a, size[a] });
        parent[b] = a;
        size[a] += size[b];
        return true;
    }

    public int snapshot() { return history.size(); }

    public void rollback(int target) {
        while (history.size() > target) {
            int[] c = history.pop();
            if (c.length == 0) continue;
            parent[c[0]] = c[1];
            size[c[2]] = c[3];
        }
    }
}
```

## code.cpp
```cpp
class RollbackDSU {
    std::vector<int> parent, size_;
    std::vector<std::array<int, 4>> history;
public:
    explicit RollbackDSU(int n) : parent(n), size_(n, 1) {
        std::iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) const {
        while (parent[x] != x) x = parent[x];
        return x;
    }

    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) { history.push_back({-1, 0, 0, 0}); return false; }
        if (size_[a] < size_[b]) std::swap(a, b);
        history.push_back({b, parent[b], a, size_[a]});
        parent[b] = a;
        size_[a] += size_[b];
        return true;
    }

    int snapshot() const { return (int)history.size(); }

    void rollback(int target) {
        while ((int)history.size() > target) {
            auto c = history.back(); history.pop_back();
            if (c[0] == -1) continue;
            parent[c[0]] = c[1];
            size_[c[2]] = c[3];
        }
    }
};
```
