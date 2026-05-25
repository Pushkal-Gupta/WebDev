---
slug: avl-tree-rotations
module: trees-balanced-disk
title: AVL Tree Rotations
subtitle: Keep a BST height-balanced (|left height - right height| <= 1) using four rotation cases — O(log n) for every operation.
difficulty: Advanced
position: 36
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "GeeksforGeeks — AVL Tree"
    url: "https://www.geeksforgeeks.org/avl-tree-set-1-insertion/"
    type: blog
  - title: "TheAlgorithms/Python — avl_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/avl_tree.py"
    type: repo
status: published
---

## intro
An AVL tree is a binary search tree with a strict height invariant: for every node, the heights of the left and right subtrees differ by at most one. Whenever an insertion or deletion threatens to violate that invariant, the tree restores it via one or two **rotations** — constant-time pointer manipulations that pivot a parent and child without disturbing the in-order key sequence. The result is the first balanced BST ever published (Adelson-Velsky & Landis, 1962) and the strictest balance bound among practical balanced trees: height is at most `1.44 log n`.

## whyItMatters
- It is the textbook introduction to **self-balancing trees** — rotations, balance factors, and restoration cases originated here.
- Its tighter height bound makes lookups marginally faster than red-black trees, which is why some real-time systems and indexes prefer AVL when read-heavy.
- The four rotation cases (LL, RR, LR, RL) are the same building blocks used by treaps, scapegoat trees, weight-balanced trees, and B-Tree splits.
- It is the simplest non-trivial example of an algorithm that maintains an **augmented invariant** — height (or balance factor) per node — through a constant-time rebalance step.

## intuition
A rotation pivots a parent-child edge: a **right rotation** at node `y` makes its left child `x` the new subtree root, with `y` becoming `x`'s right child; `x`'s original right child becomes `y`'s new left child. The in-order traversal of the subtree is unchanged because the keys' left-to-right relationship in the BST is preserved — only the tree shape rotates. Symmetrically, a **left rotation** pivots in the opposite direction. Each rotation is O(1) and changes at most three parent pointers.

After an insertion, walk back up from the new leaf and recompute heights. The first ancestor whose balance factor (left height minus right height) becomes `±2` is the unbalanced node. There are exactly **four cases**:

- **Left-Left (LL):** the imbalance is in the left child's left subtree. Single right rotation at the unbalanced node fixes it.
- **Right-Right (RR):** mirror — single left rotation.
- **Left-Right (LR):** imbalance in the left child's right subtree. First left-rotate the left child, then right-rotate the unbalanced node.
- **Right-Left (RL):** mirror — first right-rotate the right child, then left-rotate.

The reason these four cases cover everything: a balance factor of `+2` means the imbalance lives in the left subtree; within that subtree, the trouble is either in its left (LL) or right (LR) child. A single rotation handles the "outside" case; a double rotation handles the "inside" case by first pulling the inside grandchild outward, then applying the outside fix.

For deletions, walk back up the same way; rebalancing may cascade up multiple levels (unlike insertion which always stops after one rebalance). Each level still costs `O(1)`, so total work is `O(log n)`.

## visualization
Insert `1, 2, 3` into an empty AVL tree. After `3`, node `1` has balance factor `-2`: Right-Right case.

```
after 1,2:           1                   left rotation at 1:
                      \
                       2
after 3 (broken):    1                   rotation pivots
                      \                  parent-child edge 1<->2
                       2
                        \
                         3
                                              2
                                             / \
                                            1   3
```

LR case — insert `30, 10, 20`. Node `30` has balance factor `+2`; left child `10` has factor `-1` -> LR. Left-rotate `10`, then right-rotate `30`:

```
broken:   30          left-rotate 10:    30          right-rotate 30:    20
         /                              /                                /  \
        10                            20                               10   30
         \                            /
         20                          10
```

In both cases the in-order sequence stays sorted (`1,2,3` and `10,20,30`); only the parent pointers change.

## bruteForce
A plain BST without rebalancing is `O(n)` worst case (insert a sorted sequence and you get a linked list). Even the simplest "rebuild the whole subtree to perfect balance whenever it gets too lopsided" strategy is `O(n)` per insertion. Rotations are the trick that makes balance maintenance constant per level.

## optimal
Augment each node with its height; rebalance bottom-up after every insert/delete.

```python
class Node:
    __slots__ = ('key','left','right','h')
    def __init__(self, k):
        self.key, self.left, self.right, self.h = k, None, None, 1

def h(n): return n.h if n else 0
def update(n): n.h = 1 + max(h(n.left), h(n.right))
def bf(n): return h(n.left) - h(n.right)

def rot_right(y):
    x = y.left; t = x.right
    x.right = y; y.left = t
    update(y); update(x)
    return x

def rot_left(x):
    y = x.right; t = y.left
    y.left = x; x.right = t
    update(x); update(y)
    return y

def rebalance(n):
    update(n)
    b = bf(n)
    if b > 1 and bf(n.left) >= 0:  return rot_right(n)            # LL
    if b > 1 and bf(n.left) < 0:                                  # LR
        n.left = rot_left(n.left); return rot_right(n)
    if b < -1 and bf(n.right) <= 0: return rot_left(n)            # RR
    if b < -1 and bf(n.right) > 0:                                # RL
        n.right = rot_right(n.right); return rot_left(n)
    return n

def insert(n, k):
    if not n: return Node(k)
    if k < n.key:   n.left  = insert(n.left, k)
    elif k > n.key: n.right = insert(n.right, k)
    else: return n              # ignore duplicates
    return rebalance(n)
```

Deletion follows the same pattern — apply the standard BST delete then walk back up rebalancing. The cascade may produce up to `log n` rotations total, still `O(log n)` per operation.

## complexity
- **Time**: `O(log n)` worst case for search, insert, and delete.
- **Space**: `O(n)` for the tree, `O(log n)` recursion stack.
- **Height bound**: `1.44 log(n + 2)` — strictest among practical balanced trees.
- **Rotations per operation**: at most 2 for insertion; up to `O(log n)` for deletion in the worst case.

## pitfalls
- **Forgetting to update heights after rotation.** Stale heights cascade incorrect balance factors and corrupt the tree. Fix: every rotation must call `update` on both rotated nodes.
- **Wrong case discrimination.** Confusing LR with RL is easy under pressure; always inspect the **child's** balance factor, not the grandchild's. Fix: write the four conditions in a single block as a switch-by-balance-factor.
- **Ignoring duplicates inconsistently.** Different parts of the codebase doing different things with duplicate keys leads to silent corruption. Fix: pick a single policy (reject, replace, count) and document it.
- **Recursive height computation outside of `update`.** Calling `h(n.left)` lazily on every access is `O(n)` — store the height on the node and read it. Fix: always read `n.h`, never recompute.

## interviewTips
- Memorise the four rotation cases by name; sketching each on paper is the fastest way to recover under whiteboard pressure.
- Mention that insertion needs at most two rotations but deletion can cascade — interviewers test that you know the asymmetry.
- Compare to red-black: AVL is more strictly balanced (faster reads), red-black does fewer rotations per write (faster writes). Choose by workload.

## code.python
```python
class Node:
    __slots__ = ('k','l','r','h')
    def __init__(self, k): self.k, self.l, self.r, self.h = k, None, None, 1

def H(n): return n.h if n else 0
def upd(n): n.h = 1 + max(H(n.l), H(n.r))
def bf(n): return H(n.l) - H(n.r)
def rotR(y):
    x = y.l; y.l = x.r; x.r = y; upd(y); upd(x); return x
def rotL(x):
    y = x.r; x.r = y.l; y.l = x; upd(x); upd(y); return y
def reb(n):
    upd(n); b = bf(n)
    if b > 1 and bf(n.l) >= 0:  return rotR(n)
    if b > 1 and bf(n.l) <  0:  n.l = rotL(n.l); return rotR(n)
    if b < -1 and bf(n.r) <= 0: return rotL(n)
    if b < -1 and bf(n.r) >  0: n.r = rotR(n.r); return rotL(n)
    return n
def insert(n, k):
    if not n: return Node(k)
    if k < n.k: n.l = insert(n.l, k)
    elif k > n.k: n.r = insert(n.r, k)
    else: return n
    return reb(n)
```

## code.javascript
```javascript
class N { constructor(k) { this.k = k; this.l = null; this.r = null; this.h = 1; } }
const H = n => n ? n.h : 0;
const upd = n => { n.h = 1 + Math.max(H(n.l), H(n.r)); };
const bf = n => H(n.l) - H(n.r);
const rotR = y => { const x = y.l; y.l = x.r; x.r = y; upd(y); upd(x); return x; };
const rotL = x => { const y = x.r; x.r = y.l; y.l = x; upd(x); upd(y); return y; };
function reb(n) {
  upd(n); const b = bf(n);
  if (b > 1 && bf(n.l) >= 0) return rotR(n);
  if (b > 1 && bf(n.l) <  0) { n.l = rotL(n.l); return rotR(n); }
  if (b < -1 && bf(n.r) <= 0) return rotL(n);
  if (b < -1 && bf(n.r) >  0) { n.r = rotR(n.r); return rotL(n); }
  return n;
}
function insert(n, k) {
  if (!n) return new N(k);
  if (k < n.k) n.l = insert(n.l, k);
  else if (k > n.k) n.r = insert(n.r, k);
  else return n;
  return reb(n);
}
```

## code.java
```java
class AVL {
    static class Node { int k, h = 1; Node l, r; Node(int k) { this.k = k; } }
    int H(Node n) { return n == null ? 0 : n.h; }
    void upd(Node n) { n.h = 1 + Math.max(H(n.l), H(n.r)); }
    int bf(Node n) { return H(n.l) - H(n.r); }
    Node rotR(Node y) { Node x = y.l; y.l = x.r; x.r = y; upd(y); upd(x); return x; }
    Node rotL(Node x) { Node y = x.r; x.r = y.l; y.l = x; upd(x); upd(y); return y; }
    Node reb(Node n) {
        upd(n); int b = bf(n);
        if (b > 1 && bf(n.l) >= 0) return rotR(n);
        if (b > 1 && bf(n.l) <  0) { n.l = rotL(n.l); return rotR(n); }
        if (b < -1 && bf(n.r) <= 0) return rotL(n);
        if (b < -1 && bf(n.r) >  0) { n.r = rotR(n.r); return rotL(n); }
        return n;
    }
    Node insert(Node n, int k) {
        if (n == null) return new Node(k);
        if (k < n.k) n.l = insert(n.l, k);
        else if (k > n.k) n.r = insert(n.r, k);
        else return n;
        return reb(n);
    }
}
```

## code.cpp
```cpp
struct Node { int k, h = 1; Node *l = nullptr, *r = nullptr; Node(int v) : k(v) {} };
int H(Node* n) { return n ? n->h : 0; }
void upd(Node* n) { n->h = 1 + max(H(n->l), H(n->r)); }
int bf(Node* n) { return H(n->l) - H(n->r); }
Node* rotR(Node* y) { Node* x = y->l; y->l = x->r; x->r = y; upd(y); upd(x); return x; }
Node* rotL(Node* x) { Node* y = x->r; x->r = y->l; y->l = x; upd(x); upd(y); return y; }
Node* reb(Node* n) {
    upd(n); int b = bf(n);
    if (b > 1 && bf(n->l) >= 0) return rotR(n);
    if (b > 1 && bf(n->l) <  0) { n->l = rotL(n->l); return rotR(n); }
    if (b < -1 && bf(n->r) <= 0) return rotL(n);
    if (b < -1 && bf(n->r) >  0) { n->r = rotR(n->r); return rotL(n); }
    return n;
}
Node* insert(Node* n, int k) {
    if (!n) return new Node(k);
    if (k < n->k) n->l = insert(n->l, k);
    else if (k > n->k) n->r = insert(n->r, k);
    else return n;
    return reb(n);
}
```
