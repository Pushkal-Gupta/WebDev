---
slug: splay-tree
module: trees
title: Splay Tree
subtitle: A self-adjusting BST that rotates every accessed node to the root, giving O(log n) amortized operations.
difficulty: Advanced
position: 24
estimatedReadMinutes: 8
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
A splay tree is a binary search tree with one rule: after every access (search, insert, delete) the touched node is rotated up to the root through a sequence of "splay" operations. There is no balance factor, no color, no height field — yet over any sequence of `m` operations on a tree of `n` nodes the amortized cost is `O(log n)` per operation. The frequently-accessed elements drift to the top automatically, giving the tree an emergent cache-like behavior.

## whyItMatters
For workloads with strong locality — a small "hot set" of keys accessed repeatedly — splay trees achieve the **working-set bound**: an access to a key costs `O(log w + 1)`, where `w` is the number of distinct keys touched since the last access to that same key. No comparison-based dictionary built without splaying gets this property for free. Splay trees are also dramatically simpler to implement than AVL or red-black trees: one function (`splay`) does all the rebalancing.

## intuition
Two ideas. First, *locality wins*: in real workloads (route caches, symbol tables, garbage collector roots), a small fraction of keys soak up most accesses. Pulling each touched key to the root means the next access to it is `O(1)`. Second, the cleverness is in *how* the rotation happens. A naive single-rotation-per-step would only halve the depth and amortize poorly. The splay operation uses **double rotations** (zig-zig and zig-zag) that not only bring the node to the root but also halve the depth of every ancestor along the path — that's the geometric shrinkage the amortized analysis relies on.

## visualization
```
Start:           splay node 1
        5
       / \
      3   8
     / \
    1   4

Zig-zig (1 is left-child of 3, 3 is left-child of 5):
        3                 1
       / \               / \
      1   5     -->     a   3
         / \                 \
        4   8                 5
                             / \
                            4   8
After two more rotations 1 sits at the root; the whole left spine has been "rotated flat,"
halving the depths of nodes on the access path.
```
The same three cases (zig, zig-zig, zig-zag) handle every shape; you never measure subtree heights.

## bruteForce
A plain unbalanced BST is the obvious comparator. Insertions in sorted order produce a `O(n)`-deep chain, and every query becomes linear. A self-balancing tree (AVL, red-black) restores `O(log n)` per operation but requires per-node bookkeeping and discriminates against locality — a hot key buried at depth `log n` stays at depth `log n`. Splay trees beat them on skewed access patterns and tie them in the worst case.

## optimal
Implement a single `splay(root, key)` function that performs rotations on the path to the searched node and returns the new root, which is the searched node (or the last node visited if the key is absent). Every public operation calls `splay` first:
- **Search:** splay the key, compare the root.
- **Insert:** splay; if the key is now at the root, do nothing (or update); else split the root into two halves and place the new key on top.
- **Delete:** splay the key; if found, splay the maximum of the left subtree, then attach the right subtree as its right child.

The three splay cases, given a node `x` with parent `p` and grandparent `g`:
- **Zig** (no grandparent): single rotate `x` around `p`.
- **Zig-zig** (`x` and `p` are same-side children): rotate `p` around `g` *first*, then `x` around `p`. Order matters; reversing it loses the amortized bound.
- **Zig-zag** (`x` and `p` are opposite-side children): rotate `x` around `p`, then `x` around `g`.

```
splay(x):
  while x has a parent p:
    g = p.parent
    if g is None:        zig
    elif x.side == p.side: zig_zig   (rotate p around g, then x around p)
    else:                  zig_zag   (rotate x around p, then x around g)
```

## complexity
time: O(log n) amortized per operation; O(n) worst case for a single operation
space: O(n) for the tree, O(1) extra per operation (no parent array required if implemented top-down)
notes: The amortized bound is proved using the potential function `Phi = sum over nodes of log(size of subtree at node)`. Splay trees also satisfy the *static optimality theorem*: on any sequence, their cost is within a constant factor of the offline optimal BST.

## pitfalls
- Reversing the zig-zig order. Rotating `x` around `p` first and then `p` around `g` produces an "ordinary BST top-down rotation," not a splay; the amortized analysis breaks and accesses can stay `O(n)`.
- Storing parent pointers and forgetting to update them after rotations — splay trees are particularly hostile to stale parents because every node's parent changes on virtually every operation.
- Returning the *old* root after splay; the whole point is that `splay` returns the new root. Persisting the old reference creates a tree with two "roots."
- Using a splay tree for read-heavy concurrent workloads. Every read mutates the structure, killing read-write lock locality. Use an AVL or B-tree there.

## interviewTips
- State the headline up front: "Splay trees are amortized `O(log n)` and adapt to access frequency." Then mention the working-set theorem if asked for sophistication.
- Be ready to draw the three rotation cases. Many interviewers will not have implemented one and will let you simplify by describing only zig-zig and zig-zag.
- Compare to LRU caches: a splay tree is essentially a "key-promoting" structure, similar in spirit to an LRU but with comparison-based access instead of hashing.
- If the interviewer asks why not always use splay trees, mention concurrent reads and predictable per-operation latency (real-time systems prefer worst-case bounds, which splay does not give).

## code.python
```python
class Node:
    __slots__ = ('key', 'left', 'right')
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def rotate_right(p):
    x = p.left
    p.left = x.right
    x.right = p
    return x

def rotate_left(p):
    x = p.right
    p.right = x.left
    x.left = p
    return x

def splay(root, key):
    if root is None or root.key == key:
        return root
    if key < root.key:
        if root.left is None: return root
        if key < root.left.key:
            root.left.left = splay(root.left.left, key)
            root = rotate_right(root)
        elif key > root.left.key:
            root.left.right = splay(root.left.right, key)
            if root.left.right: root.left = rotate_left(root.left)
        return rotate_right(root) if root.left else root
    else:
        if root.right is None: return root
        if key > root.right.key:
            root.right.right = splay(root.right.right, key)
            root = rotate_left(root)
        elif key < root.right.key:
            root.right.left = splay(root.right.left, key)
            if root.right.left: root.right = rotate_right(root.right)
        return rotate_left(root) if root.right else root
```

## code.javascript
```javascript
class SplayNode {
  constructor(key) { this.key = key; this.left = null; this.right = null; }
}

function rotateRight(p) { const x = p.left; p.left = x.right; x.right = p; return x; }
function rotateLeft(p)  { const x = p.right; p.right = x.left; x.left = p; return x; }

function splay(root, key) {
  if (!root || root.key === key) return root;
  if (key < root.key) {
    if (!root.left) return root;
    if (key < root.left.key) {
      root.left.left = splay(root.left.left, key);
      root = rotateRight(root);
    } else if (key > root.left.key) {
      root.left.right = splay(root.left.right, key);
      if (root.left.right) root.left = rotateLeft(root.left);
    }
    return root.left ? rotateRight(root) : root;
  } else {
    if (!root.right) return root;
    if (key > root.right.key) {
      root.right.right = splay(root.right.right, key);
      root = rotateLeft(root);
    } else if (key < root.right.key) {
      root.right.left = splay(root.right.left, key);
      if (root.right.left) root.right = rotateRight(root.right);
    }
    return root.right ? rotateLeft(root) : root;
  }
}
```

## code.java
```java
class SplayNode {
    int key;
    SplayNode left, right;
    SplayNode(int k) { key = k; }
}

SplayNode rotateRight(SplayNode p) { SplayNode x = p.left;  p.left  = x.right; x.right = p; return x; }
SplayNode rotateLeft (SplayNode p) { SplayNode x = p.right; p.right = x.left;  x.left  = p; return x; }

SplayNode splay(SplayNode root, int key) {
    if (root == null || root.key == key) return root;
    if (key < root.key) {
        if (root.left == null) return root;
        if (key < root.left.key) {
            root.left.left = splay(root.left.left, key);
            root = rotateRight(root);
        } else if (key > root.left.key) {
            root.left.right = splay(root.left.right, key);
            if (root.left.right != null) root.left = rotateLeft(root.left);
        }
        return root.left != null ? rotateRight(root) : root;
    } else {
        if (root.right == null) return root;
        if (key > root.right.key) {
            root.right.right = splay(root.right.right, key);
            root = rotateLeft(root);
        } else if (key < root.right.key) {
            root.right.left = splay(root.right.left, key);
            if (root.right.left != null) root.right = rotateRight(root.right);
        }
        return root.right != null ? rotateLeft(root) : root;
    }
}
```

## code.cpp
```cpp
struct SplayNode {
    int key;
    SplayNode *left = nullptr, *right = nullptr;
    SplayNode(int k) : key(k) {}
};

SplayNode* rotateRight(SplayNode* p) { auto* x = p->left;  p->left  = x->right; x->right = p; return x; }
SplayNode* rotateLeft (SplayNode* p) { auto* x = p->right; p->right = x->left;  x->left  = p; return x; }

SplayNode* splay(SplayNode* root, int key) {
    if (!root || root->key == key) return root;
    if (key < root->key) {
        if (!root->left) return root;
        if (key < root->left->key) {
            root->left->left = splay(root->left->left, key);
            root = rotateRight(root);
        } else if (key > root->left->key) {
            root->left->right = splay(root->left->right, key);
            if (root->left->right) root->left = rotateLeft(root->left);
        }
        return root->left ? rotateRight(root) : root;
    } else {
        if (!root->right) return root;
        if (key > root->right->key) {
            root->right->right = splay(root->right->right, key);
            root = rotateLeft(root);
        } else if (key < root->right->key) {
            root->right->left = splay(root->right->left, key);
            if (root->right->left) root->right = rotateRight(root->right);
        }
        return root->right ? rotateLeft(root) : root;
    }
}
```
