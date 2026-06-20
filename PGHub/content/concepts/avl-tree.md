---
slug: avl-tree
module: trees-balanced-disk
title: AVL Tree
subtitle: Height-balanced BST that uses balance factors and rotations to stay strictly logarithmic.
difficulty: Advanced
position: 33
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "AVL Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/introduction-to-avl-tree/"
    type: blog
  - title: "TheAlgorithms/Java — AVLTree.java"
    url: "https://github.com/TheAlgorithms/Java/blob/master/src/main/java/com/thealgorithms/datastructures/trees/AVLTree.java"
    type: repo
status: published
---

## intro
An AVL tree is a binary search tree in which the heights of the two child subtrees of every node differ by at most one. That single invariant — the balance factor lies in {-1, 0, +1} — keeps the tree's height within roughly 1.44 log2(n+2), so search, insert, and delete are all O(log n) worst case. It is the original self-balancing BST, published by Adelson-Velsky and Landis in 1962.

## whyItMatters
AVL is the answer when reads dominate writes. Compared to red-black trees, AVL keeps a tighter height bound (about 1.44 log n vs 2 log n), so lookups touch fewer nodes — perfect for in-memory indexes, autocomplete tries with BST fallback, and interval lookups. The cost is more rotations during insert and delete. If your workload is read-heavy, AVL wins; if it is write-heavy, red-black wins.

## intuition
After every insert or delete, walk back up from the changed leaf to the root and recompute heights. The first ancestor whose balance factor falls outside {-1, 0, +1} is the "pivot". Depending on whether the heavy side is left-left, left-right, right-right, or right-left, perform one or two rotations. Each rotation is local — three nodes and their subtrees — and restores the balance for that subtree without touching the rest.

## visualization
```
Insert 1, 2, 3 into an empty AVL:
  After 1:    [1]
  After 2:    [1]
                \
                [2]
  After 3:    [1]        Balance(1) = -2 (right-right)
                \         => rotate left around 1
                [2]
                  \
                  [3]
  Result:     [2]
              / \
            [1] [3]
```
The balance factor of node 1 became -2 after inserting 3 — outside the legal range. A single left rotation around 1 returns the tree to height 2 with all factors zero.

## bruteForce
Use a plain BST. Inserts are O(h) where h grows with the tree — sorted input degrades h to n, making lookups linear. You can periodically rebuild the BST from an in-order traversal to restore balance, an O(n) operation amortized over many inserts. AVL avoids any global rebuild by paying a constant local rotation cost per insert.

## optimal
Store `height` at every node. After a BST-style insert or delete, walk back up updating heights. At each ancestor, compute balance = height(left) - height(right). If |balance| > 1, perform the corresponding rotation:
- left-left: right-rotate the pivot
- left-right: left-rotate the pivot's left child, then right-rotate the pivot
- right-right: left-rotate the pivot
- right-left: right-rotate the pivot's right child, then left-rotate the pivot

```
insert(node, key):
    if node is null: return new_node(key)
    if key < node.key: node.left = insert(node.left, key)
    else: node.right = insert(node.right, key)
    node.height = 1 + max(h(left), h(right))
    bf = h(left) - h(right)
    if bf > 1 and key < node.left.key: return rotate_right(node)
    if bf < -1 and key > node.right.key: return rotate_left(node)
    if bf > 1: node.left = rotate_left(node.left); return rotate_right(node)
    if bf < -1: node.right = rotate_right(node.right); return rotate_left(node)
    return node
```

## complexity
time: O(log n) for search, insert, delete.
space: O(n) for the tree, O(log n) recursion stack.
notes: At most one rotation (single or double) per insert. Delete may cascade — up to O(log n) rotations in the worst case as imbalance propagates upward. Height bound h <= 1.4404 log2(n+2) - 0.328.

## pitfalls
- Forgetting to update `height` before computing the balance factor — uses stale data and misses violations.
- Treating null children as height 0 instead of -1 breaks the standard formula `1 + max(h(left), h(right))`.
- Returning the old root from a rotation routine — the caller must rewire to the new subtree root.
- Off-by-one in the LR / RL double rotation: do the inner rotation first, then the outer.
- Cascading rotations on delete: many implementations only fix the first violation and stop, leaving the upper part unbalanced.

## interviewTips
- Say upfront: "AVL is strictly height-balanced; red-black is loosely balanced. Reads win on AVL, writes win on red-black."
- Always draw the four imbalance shapes (LL, LR, RR, RL) before writing code — interviewers grade on whether you can name them.
- Mention the height bound: about 1.44 log n. It is tighter than red-black's 2 log n by exactly the factor that makes AVL feel snappier on reads.
- Mention where AVL ships in production: GNU libavl, some indexed search structures, and many compiler symbol tables.

## code.python
```python
class Node:
    __slots__ = ("key", "h", "left", "right")
    def __init__(self, k): self.key, self.h, self.left, self.right = k, 1, None, None

def h(n): return n.h if n else 0
def upd(n): n.h = 1 + max(h(n.left), h(n.right))
def bf(n): return h(n.left) - h(n.right)

def rot_right(y):
    x = y.left; t2 = x.right
    x.right = y; y.left = t2
    upd(y); upd(x); return x

def rot_left(x):
    y = x.right; t2 = y.left
    y.left = x; x.right = t2
    upd(x); upd(y); return y

def insert(node, key):
    if not node: return Node(key)
    if key < node.key: node.left = insert(node.left, key)
    elif key > node.key: node.right = insert(node.right, key)
    else: return node
    upd(node)
    b = bf(node)
    if b > 1 and key < node.left.key: return rot_right(node)
    if b < -1 and key > node.right.key: return rot_left(node)
    if b > 1:
        node.left = rot_left(node.left); return rot_right(node)
    if b < -1:
        node.right = rot_right(node.right); return rot_left(node)
    return node
```

## code.javascript
```javascript
class Node { constructor(k) { this.key = k; this.h = 1; this.left = this.right = null; } }
const h = n => n ? n.h : 0;
const upd = n => { n.h = 1 + Math.max(h(n.left), h(n.right)); };
const bf = n => h(n.left) - h(n.right);

function rotRight(y) {
  const x = y.left, t2 = x.right;
  x.right = y; y.left = t2;
  upd(y); upd(x); return x;
}
function rotLeft(x) {
  const y = x.right, t2 = y.left;
  y.left = x; x.right = t2;
  upd(x); upd(y); return y;
}

function insert(node, key) {
  if (!node) return new Node(key);
  if (key < node.key) node.left = insert(node.left, key);
  else if (key > node.key) node.right = insert(node.right, key);
  else return node;
  upd(node);
  const b = bf(node);
  if (b > 1 && key < node.left.key) return rotRight(node);
  if (b < -1 && key > node.right.key) return rotLeft(node);
  if (b > 1) { node.left = rotLeft(node.left); return rotRight(node); }
  if (b < -1) { node.right = rotRight(node.right); return rotLeft(node); }
  return node;
}
```

## code.java
```java
class AVL {
    static class Node {
        int key, h = 1; Node left, right;
        Node(int k) { key = k; }
    }
    static int h(Node n) { return n == null ? 0 : n.h; }
    static void upd(Node n) { n.h = 1 + Math.max(h(n.left), h(n.right)); }
    static int bf(Node n) { return h(n.left) - h(n.right); }

    static Node rotRight(Node y) {
        Node x = y.left, t2 = x.right;
        x.right = y; y.left = t2;
        upd(y); upd(x); return x;
    }
    static Node rotLeft(Node x) {
        Node y = x.right, t2 = y.left;
        y.left = x; x.right = t2;
        upd(x); upd(y); return y;
    }

    public static Node insert(Node node, int key) {
        if (node == null) return new Node(key);
        if (key < node.key) node.left = insert(node.left, key);
        else if (key > node.key) node.right = insert(node.right, key);
        else return node;
        upd(node);
        int b = bf(node);
        if (b > 1 && key < node.left.key) return rotRight(node);
        if (b < -1 && key > node.right.key) return rotLeft(node);
        if (b > 1) { node.left = rotLeft(node.left); return rotRight(node); }
        if (b < -1) { node.right = rotRight(node.right); return rotLeft(node); }
        return node;
    }
}
```

## code.cpp
```cpp
struct Node {
    int key, h = 1;
    Node *left = nullptr, *right = nullptr;
    Node(int k) : key(k) {}
};

int h(Node* n) { return n ? n->h : 0; }
void upd(Node* n) { n->h = 1 + std::max(h(n->left), h(n->right)); }
int bf(Node* n) { return h(n->left) - h(n->right); }

Node* rotRight(Node* y) {
    Node *x = y->left, *t2 = x->right;
    x->right = y; y->left = t2;
    upd(y); upd(x); return x;
}
Node* rotLeft(Node* x) {
    Node *y = x->right, *t2 = y->left;
    y->left = x; x->right = t2;
    upd(x); upd(y); return y;
}

Node* insert(Node* node, int key) {
    if (!node) return new Node(key);
    if (key < node->key) node->left = insert(node->left, key);
    else if (key > node->key) node->right = insert(node->right, key);
    else return node;
    upd(node);
    int b = bf(node);
    if (b > 1 && key < node->left->key) return rotRight(node);
    if (b < -1 && key > node->right->key) return rotLeft(node);
    if (b > 1) { node->left = rotLeft(node->left); return rotRight(node); }
    if (b < -1) { node->right = rotRight(node->right); return rotLeft(node); }
    return node;
}
```
