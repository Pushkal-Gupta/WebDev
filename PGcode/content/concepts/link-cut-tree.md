---
slug: link-cut-tree
module: trees
title: Link-Cut Tree
subtitle: Dynamic forests with O(log n) amortized link, cut, path-aggregate, and root queries.
difficulty: Advanced
position: 30
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "cp-algorithms — Trees and tree algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
A link-cut tree (LCT) is Sleator and Tarjan's data structure for maintaining a forest of rooted trees under online link, cut, and path queries. It represents each path in the represented forest as a splay tree (the "preferred path decomposition") and uses an access operation that re-splays nodes to expose a path in O(log n) amortized time.

## whyItMatters
Heavy-light decomposition handles path queries only on static trees. Once edges can be inserted and deleted online — dynamic connectivity, online MST, max-flow blocking flow speedups, network simulation — you need a structure that supports the operations themselves, not just queries on top of them. LCTs answer "are u and v connected?" and "max edge on the path from u to v" in O(log n) amortized while edges churn.

## intuition
Decompose the tree into vertex-disjoint "preferred paths." Each preferred path is stored as a splay tree keyed by depth. Non-preferred children are dangling subtrees attached at their parent via a path-parent pointer. An `access(v)` operation walks from v to the represented root, splicing preferred paths so v ends up on the same splay tree as the root — then path aggregates over [root..v] become aggregates over one splay tree, which splaying solves.

## visualization
```
represented tree (preferred edges = solid, others = dotted):
        A
       /|
      B C
     /. .
    D  E
preferred paths: A-B-D, then C, then E
each path is its own splay tree; non-preferred children carry a path-parent up
```

## bruteForce
For each query, walk the tree explicitly. Link and cut are O(1) by pointer flips but a path-aggregate query is O(depth), which degenerates to O(n) on adversarial chains. Across q queries this is O(nq) — completely impractical for the online problems LCTs are built for.

## optimal
Maintain splay trees keyed by depth along preferred paths. Key operations:
```
access(v):
  splay(v); detach right child of v
  while v has path-parent p:
    splay(p); set right(p) = v; update(p); v = p
  splay(original_v)
makeRoot(v): access(v); reverse the splay tree containing v
link(u, v): makeRoot(u); set u.pathParent = v
cut(u, v): makeRoot(u); access(v); detach left child of v
queryPath(u, v): makeRoot(u); access(v); aggregate of splay tree rooted at v
```
Lazy reversal flags handle root changes without rewriting parent pointers.

## complexity
time: O(log n) amortized per operation (link, cut, access, makeRoot, queryPath)
space: O(n)
notes: The amortized bound is via the same potential argument that bounds splay trees; worst-case single operation is O(n) but the average across any sequence stays logarithmic.

## pitfalls
- Forgetting to `push` lazy reversal before reading children — leads to corrupted tree shapes.
- Splaying without updating subtree aggregates on the rotation path — queries return stale values.
- Calling link on two nodes already in the same tree — must guard with a connectivity check or your forest invariants break.
- Confusing the represented tree's parent (logical) with the auxiliary splay tree's parent (structural).

## interviewTips
- Acknowledge complexity upfront: "I won't code the full LCT on the board — let me describe the access operation and the invariants, then sketch the splay primitives."
- Mention concrete uses: online MST (Holm-Lichtenberg-Thorup), dynamic 2-edge connectivity, network simulation, certain max-flow speedups.
- If asked for a simpler alternative for static trees, immediately propose heavy-light decomposition and contrast.

## code.python
```python
class Node:
    __slots__ = ('p','c','rev','val','agg')
    def __init__(self, val=0):
        self.p = None; self.c = [None, None]
        self.rev = False; self.val = val; self.agg = val

def is_root(x):
    return x.p is None or (x.p.c[0] is not x and x.p.c[1] is not x)

def push(x):
    if x.rev:
        x.c[0], x.c[1] = x.c[1], x.c[0]
        for ch in x.c:
            if ch: ch.rev ^= True
        x.rev = False

def pull(x):
    x.agg = x.val
    for ch in x.c:
        if ch: x.agg += ch.agg

def rotate(x):
    p = x.p; g = p.p
    d = 0 if p.c[0] is x else 1
    p.c[d] = x.c[d ^ 1]
    if x.c[d ^ 1]: x.c[d ^ 1].p = p
    x.c[d ^ 1] = p; p.p = x; x.p = g
    if g and not is_root(p):
        g.c[0 if g.c[0] is p else 1] = x
    pull(p); pull(x)

def splay(x):
    stack = []
    y = x
    while True:
        stack.append(y)
        if is_root(y): break
        y = y.p
    for n in reversed(stack): push(n)
    while not is_root(x):
        p = x.p
        if not is_root(p):
            rotate(x if (p.c[0] is x) == (p.p.c[0] is p) else p)
        rotate(x)

def access(x):
    last = None; y = x
    while y:
        splay(y); y.c[1] = last; pull(y); last = y; y = y.p
    splay(x); return last
```

## code.javascript
```javascript
class Node {
  constructor(val = 0) {
    this.p = null; this.c = [null, null];
    this.rev = false; this.val = val; this.agg = val;
  }
}
const isRoot = x => !x.p || (x.p.c[0] !== x && x.p.c[1] !== x);
const push = x => {
  if (!x.rev) return;
  [x.c[0], x.c[1]] = [x.c[1], x.c[0]];
  for (const ch of x.c) if (ch) ch.rev = !ch.rev;
  x.rev = false;
};
const pull = x => {
  x.agg = x.val;
  for (const ch of x.c) if (ch) x.agg += ch.agg;
};
function rotate(x) {
  const p = x.p, g = p.p;
  const d = p.c[0] === x ? 0 : 1;
  p.c[d] = x.c[d ^ 1];
  if (x.c[d ^ 1]) x.c[d ^ 1].p = p;
  x.c[d ^ 1] = p; p.p = x; x.p = g;
  if (g && !isRoot(p)) g.c[g.c[0] === p ? 0 : 1] = x;
  pull(p); pull(x);
}
function splay(x) {
  const stack = []; let y = x;
  while (true) { stack.push(y); if (isRoot(y)) break; y = y.p; }
  for (let i = stack.length - 1; i >= 0; i--) push(stack[i]);
  while (!isRoot(x)) {
    const p = x.p;
    if (!isRoot(p)) rotate((p.c[0] === x) === (p.p.c[0] === p) ? p : x);
    rotate(x);
  }
}
function access(x) {
  let last = null, y = x;
  while (y) { splay(y); y.c[1] = last; pull(y); last = y; y = y.p; }
  splay(x); return last;
}
```

## code.java
```java
class LCTNode {
    LCTNode p; LCTNode[] c = new LCTNode[2];
    boolean rev; long val, agg;
    LCTNode(long v) { val = v; agg = v; }
}
class LCT {
    boolean isRoot(LCTNode x) { return x.p == null || (x.p.c[0] != x && x.p.c[1] != x); }
    void push(LCTNode x) {
        if (!x.rev) return;
        LCTNode t = x.c[0]; x.c[0] = x.c[1]; x.c[1] = t;
        if (x.c[0] != null) x.c[0].rev ^= true;
        if (x.c[1] != null) x.c[1].rev ^= true;
        x.rev = false;
    }
    void pull(LCTNode x) {
        x.agg = x.val;
        if (x.c[0] != null) x.agg += x.c[0].agg;
        if (x.c[1] != null) x.agg += x.c[1].agg;
    }
    void rotate(LCTNode x) {
        LCTNode p = x.p, g = p.p;
        int d = p.c[0] == x ? 0 : 1;
        p.c[d] = x.c[d ^ 1];
        if (x.c[d ^ 1] != null) x.c[d ^ 1].p = p;
        x.c[d ^ 1] = p; p.p = x; x.p = g;
        if (g != null && !isRoot(p)) g.c[g.c[0] == p ? 0 : 1] = x;
        pull(p); pull(x);
    }
    void splay(LCTNode x) {
        java.util.Deque<LCTNode> st = new java.util.ArrayDeque<>();
        LCTNode y = x;
        while (true) { st.push(y); if (isRoot(y)) break; y = y.p; }
        while (!st.isEmpty()) push(st.pop());
        while (!isRoot(x)) {
            LCTNode p = x.p;
            if (!isRoot(p)) rotate((p.c[0] == x) == (p.p.c[0] == p) ? p : x);
            rotate(x);
        }
    }
    LCTNode access(LCTNode x) {
        LCTNode last = null, y = x;
        while (y != null) { splay(y); y.c[1] = last; pull(y); last = y; y = y.p; }
        splay(x); return last;
    }
}
```

## code.cpp
```cpp
struct Node {
    Node *p = nullptr, *c[2] = {nullptr, nullptr};
    bool rev = false;
    long long val = 0, agg = 0;
};
bool isRoot(Node* x) { return !x->p || (x->p->c[0] != x && x->p->c[1] != x); }
void push(Node* x) {
    if (!x->rev) return;
    swap(x->c[0], x->c[1]);
    for (auto* ch : x->c) if (ch) ch->rev ^= true;
    x->rev = false;
}
void pull(Node* x) {
    x->agg = x->val;
    for (auto* ch : x->c) if (ch) x->agg += ch->agg;
}
void rotate(Node* x) {
    Node *p = x->p, *g = p->p;
    int d = p->c[0] == x ? 0 : 1;
    p->c[d] = x->c[d ^ 1];
    if (x->c[d ^ 1]) x->c[d ^ 1]->p = p;
    x->c[d ^ 1] = p; p->p = x; x->p = g;
    if (g && !isRoot(p)) g->c[g->c[0] == p ? 0 : 1] = x;
    pull(p); pull(x);
}
void splay(Node* x) {
    vector<Node*> st; Node* y = x;
    while (true) { st.push_back(y); if (isRoot(y)) break; y = y->p; }
    while (!st.empty()) { push(st.back()); st.pop_back(); }
    while (!isRoot(x)) {
        Node* p = x->p;
        if (!isRoot(p)) rotate((p->c[0] == x) == (p->p->c[0] == p) ? p : x);
        rotate(x);
    }
}
Node* access(Node* x) {
    Node *last = nullptr, *y = x;
    while (y) { splay(y); y->c[1] = last; pull(y); last = y; y = y->p; }
    splay(x); return last;
}
```
