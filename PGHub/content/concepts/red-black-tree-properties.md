---
slug: red-black-tree-properties
module: trees-balanced-disk
title: Red-Black Tree Properties
subtitle: Five colour invariants keep a BST's longest path within 2x its shortest — the balance discipline behind std::map, TreeMap, and Linux's CFS scheduler.
difficulty: Advanced
position: 37
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Red-Black Trees"
    url: "https://walkccc.me/CLRS/Chap13/"
    type: book
  - title: "Sedgewick & Wayne — Balanced Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "TheAlgorithms/Python — red_black_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/red_black_tree.py"
    type: repo
status: published
---

## intro
A red-black tree is a binary search tree where every node carries a single bit of colour — **red** or **black** — and five invariants ensure that the longest root-to-leaf path is at most twice the shortest. Inserts and deletes are standard BST operations followed by a colour-and-rotation fix-up that restores any violated invariants in `O(log n)` total. The result is a tree that supports search, insert, and delete in `O(log n)` worst case with looser balance than AVL — fewer rotations per write, slightly deeper trees, and the de-facto standard implementation for ordered associative containers in C++, Java, and the Linux kernel.

## whyItMatters
- It is the data structure behind `std::map` / `std::set` (libstdc++ and libc++), Java's `TreeMap` / `TreeSet`, and Linux's **Completely Fair Scheduler** for process timeslices.
- Looser balance than AVL means fewer rotations per insertion / deletion — about half the writes — which dominates on update-heavy workloads.
- The colour invariants are the simplest correct framing of "balance via colour" and underpin **left-leaning red-black trees**, **2-3 trees**, **2-3-4 trees**, and **B-Trees**.
- Linux's `epoll`, the JVM's interval tree for garbage-collection cards, and the Nginx timer wheel all use red-black trees because of the worst-case guarantee plus low rotation count.

## intuition
The five red-black invariants are:

1. Every node is red or black.
2. The root is black.
3. Every leaf (NIL sentinel) is black.
4. If a node is red, both its children are black. (No two reds in a row on any path.)
5. For every node, all paths from that node to descendant leaves contain the same number of black nodes (its **black-height**).

Why do these give logarithmic depth? Take any path from the root to a NIL leaf. Invariant 5 fixes the number of black nodes on the path; call it `b`. Invariant 4 forbids two reds in a row, so reds account for at most `b` extra nodes. The path length is therefore at most `2b`. The shortest possible path is all-black with length exactly `b`. So `longest <= 2 * shortest` — the height is `O(log n)` and the ratio is at most 2.

The five invariants are equivalent to thinking of the tree as a **2-3-4 tree** where every black node is a 2-3-4 node and red children represent "extra keys squeezed into the same node". That mental model makes the fix-ups intuitive: red-red conflicts correspond to overfull 2-3-4 nodes that must split. Splits propagate up the tree just like B-Tree splits, costing one extra colour flip per level.

After a standard BST insertion, the new node is coloured **red** (always inserting a black node would always violate invariant 5; inserting red can only violate invariant 4, which is fixable). The fix-up walks back up; at each level it inspects the new node's parent and uncle. Three cases — uncle red, uncle black with zig-zag, uncle black with straight line — are handled by colour flips and at most two rotations. Deletion is more involved (six cases) but follows the same "walk up, fix up" pattern.

## visualization
The five invariants on a small red-black tree (R = red, B = black, NIL omitted):

```
                    13B
                   /   \
                 8R     17R
                / \     / \
              1B  11B  15B  25B
                              \
                              22R, 27R
                                          (each red has black children)
                                          (every root-to-NIL path has the same
                                           number of black nodes -- here 3)
```

Insert `4` (red) under `1`:

```
        13B
       /
     8R                     -- new red 4 under black 1: no violation
    / \                        (invariant 4 still holds: 4 red, parent 1 black)
   1B  11B
    \
     4R
```

Now insert `6` (red) under `4`. Conflict: 4R and 6R — invariant 4 violated. Uncle of 4 is `11` (black). The new node `6` zig-zags with respect to grandparent `8` (8 -> 1 -> 4 -> 6 forms a zig-zag-zig), so we left-rotate at `4`, then right-rotate at `8`, then recolour:

```
broken:    8R                   after rotations + recolour:
          /  \
        1B   11B                          8R
          \                              /  \
           4R                          4B    11B
            \                         /  \
             6R                      1R   6R
                                            (root remains black further up)
```

## bruteForce
A plain BST is `O(n)` worst case. Repeatedly rebuilding the tree to perfect balance after every insertion is `O(n)`. The five-invariant scheme reduces rebalancing to `O(log n)` amortised colour flips plus `O(1)` rotations per operation — that's the whole win.

## optimal
You don't usually rewrite a red-black tree from scratch — you use the standard library. But the operations boil down to **insert → fix-up** and **delete → fix-up**, each restoring violated invariants in `O(log n)` worst-case work. Sketch (Python pseudocode):

```python
RED, BLACK = 0, 1

class Node:
    __slots__ = ('key','color','left','right','parent')
    def __init__(self, key):
        self.key, self.color = key, RED
        self.left = self.right = self.parent = None

def insert_fixup(tree, z):
    while z.parent and z.parent.color == RED:
        gp = z.parent.parent
        if z.parent is gp.left:
            u = gp.right
            if u and u.color == RED:
                z.parent.color = BLACK; u.color = BLACK
                gp.color = RED; z = gp                # case 1: red uncle
            else:
                if z is z.parent.right:               # case 2: zig-zag
                    z = z.parent; rotate_left(tree, z)
                z.parent.color = BLACK                # case 3: straight
                gp.color = RED; rotate_right(tree, gp)
        else:
            ... # mirror image for right side
    tree.root.color = BLACK
```

`rotate_left` and `rotate_right` are the same pointer pivots used in AVL — they preserve the BST in-order sequence. The same three cases (plus their mirrors) handle every possible insert violation; deletion is six cases. Real-world implementations (libstdc++, JDK, Linux's `rbtree.c`) follow CLRS chapter 13 almost verbatim.

## complexity
- **Time**: `O(log n)` worst case for search, insert, delete.
- **Space**: `O(n)` for the tree, `O(log n)` recursion or parent pointer chain.
- **Height bound**: `2 log(n + 1)` — looser than AVL's `1.44 log n` but acceptable in exchange for fewer rotations.
- **Rotations per operation**: at most 2 for insertion, at most 3 for deletion. Colour flips can cascade `O(log n)` levels but are `O(1)` each.

## pitfalls
- **Forgetting that the root must be black.** After the fix-up loop, set `root.color = BLACK` unconditionally. Fix: make this the last line of every insert / delete fix-up.
- **Treating NIL as `None` everywhere.** Most invariants are easier to state with an explicit black sentinel node. Fix: allocate one `NIL` instance with `color = BLACK` and point all "missing" children at it.
- **Mishandling the uncle's colour.** The fix-up's first decision is "is the uncle red or black?"; getting this wrong means infinite loops or invariant violations. Fix: always read the uncle's colour before deciding which case applies.
- **Hand-rolling a red-black tree in production without need.** The standard library version is vastly better tested. Fix: only roll your own when you need an unusual augmentation (interval tree, segment tree, custom key comparator).

## interviewTips
- Memorise the five invariants — interviewers often ask you to *state* them rather than implement.
- Justify the `2 log(n+1)` bound by the "no two reds in a row" argument; that derivation is the expected discussion.
- Compare against AVL on workload: red-black favours writes (fewer rotations); AVL favours reads (tighter balance).

## code.python
```python
RED, BLACK = 0, 1
class Node:
    __slots__ = ('k','c','l','r','p')
    def __init__(self, k):
        self.k = k; self.c = RED
        self.l = self.r = self.p = None

def rot_left(t, x):
    y = x.r; x.r = y.l
    if y.l: y.l.p = x
    y.p = x.p
    if not x.p: t.root = y
    elif x is x.p.l: x.p.l = y
    else: x.p.r = y
    y.l = x; x.p = y

def rot_right(t, x):
    y = x.l; x.l = y.r
    if y.r: y.r.p = x
    y.p = x.p
    if not x.p: t.root = y
    elif x is x.p.r: x.p.r = y
    else: x.p.l = y
    y.r = x; x.p = y

def fixup(t, z):
    while z.p and z.p.c == RED:
        gp = z.p.p
        if z.p is gp.l:
            u = gp.r
            if u and u.c == RED:
                z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp
            else:
                if z is z.p.r: z = z.p; rot_left(t, z)
                z.p.c = BLACK; gp.c = RED; rot_right(t, gp)
        else:
            u = gp.l
            if u and u.c == RED:
                z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp
            else:
                if z is z.p.l: z = z.p; rot_right(t, z)
                z.p.c = BLACK; gp.c = RED; rot_left(t, gp)
    t.root.c = BLACK
```

## code.javascript
```javascript
const RED = 0, BLACK = 1;
class Node { constructor(k) { this.k = k; this.c = RED; this.l = this.r = this.p = null; } }
function rotL(t, x) {
  const y = x.r; x.r = y.l; if (y.l) y.l.p = x;
  y.p = x.p;
  if (!x.p) t.root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y;
  y.l = x; x.p = y;
}
function rotR(t, x) {
  const y = x.l; x.l = y.r; if (y.r) y.r.p = x;
  y.p = x.p;
  if (!x.p) t.root = y; else if (x === x.p.r) x.p.r = y; else x.p.l = y;
  y.r = x; x.p = y;
}
function fixup(t, z) {
  while (z.p && z.p.c === RED) {
    const gp = z.p.p;
    if (z.p === gp.l) {
      const u = gp.r;
      if (u && u.c === RED) { z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp; }
      else { if (z === z.p.r) { z = z.p; rotL(t, z); }
             z.p.c = BLACK; gp.c = RED; rotR(t, gp); }
    } else {
      const u = gp.l;
      if (u && u.c === RED) { z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp; }
      else { if (z === z.p.l) { z = z.p; rotR(t, z); }
             z.p.c = BLACK; gp.c = RED; rotL(t, gp); }
    }
  }
  t.root.c = BLACK;
}
```

## code.java
```java
class RBT {
    static final int RED = 0, BLACK = 1;
    static class Node { int k, c = RED; Node l, r, p; Node(int k) { this.k = k; } }
    Node root;
    void rotL(Node x) {
        Node y = x.r; x.r = y.l; if (y.l != null) y.l.p = x;
        y.p = x.p;
        if (x.p == null) root = y;
        else if (x == x.p.l) x.p.l = y; else x.p.r = y;
        y.l = x; x.p = y;
    }
    void rotR(Node x) {
        Node y = x.l; x.l = y.r; if (y.r != null) y.r.p = x;
        y.p = x.p;
        if (x.p == null) root = y;
        else if (x == x.p.r) x.p.r = y; else x.p.l = y;
        y.r = x; x.p = y;
    }
    void fixup(Node z) {
        while (z.p != null && z.p.c == RED) {
            Node gp = z.p.p;
            if (z.p == gp.l) {
                Node u = gp.r;
                if (u != null && u.c == RED) { z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp; }
                else { if (z == z.p.r) { z = z.p; rotL(z); }
                       z.p.c = BLACK; gp.c = RED; rotR(gp); }
            } else {
                Node u = gp.l;
                if (u != null && u.c == RED) { z.p.c = BLACK; u.c = BLACK; gp.c = RED; z = gp; }
                else { if (z == z.p.l) { z = z.p; rotR(z); }
                       z.p.c = BLACK; gp.c = RED; rotL(gp); }
            }
        }
        root.c = BLACK;
    }
}
```

## code.cpp
```cpp
struct Node {
    int k, c = 0;       // 0 = red, 1 = black
    Node *l = nullptr, *r = nullptr, *p = nullptr;
    Node(int v) : k(v) {}
};
struct RBT {
    Node* root = nullptr;
    void rotL(Node* x) {
        Node* y = x->r; x->r = y->l; if (y->l) y->l->p = x;
        y->p = x->p;
        if (!x->p) root = y;
        else if (x == x->p->l) x->p->l = y; else x->p->r = y;
        y->l = x; x->p = y;
    }
    void rotR(Node* x) {
        Node* y = x->l; x->l = y->r; if (y->r) y->r->p = x;
        y->p = x->p;
        if (!x->p) root = y;
        else if (x == x->p->r) x->p->r = y; else x->p->l = y;
        y->r = x; x->p = y;
    }
    void fixup(Node* z) {
        while (z->p && z->p->c == 0) {
            Node* gp = z->p->p;
            if (z->p == gp->l) {
                Node* u = gp->r;
                if (u && u->c == 0) { z->p->c = 1; u->c = 1; gp->c = 0; z = gp; }
                else { if (z == z->p->r) { z = z->p; rotL(z); }
                       z->p->c = 1; gp->c = 0; rotR(gp); }
            } else {
                Node* u = gp->l;
                if (u && u->c == 0) { z->p->c = 1; u->c = 1; gp->c = 0; z = gp; }
                else { if (z == z->p->l) { z = z->p; rotR(z); }
                       z->p->c = 1; gp->c = 0; rotL(gp); }
            }
        }
        root->c = 1;
    }
};
```
