---
slug: binary-search-tree-operations
module: trees-traversal-bst
title: Binary Search Tree Operations
subtitle: Search, insert, and delete in a BST in O(h) — the foundation every balanced tree refines.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "cp-algorithms — Binary search tree"
    url: "https://cp-algorithms.com/data_structures/"
    type: blog
  - title: "TheAlgorithms/Python — binary_search_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_search_tree.py"
    type: repo
status: published
---

## intro
A binary search tree (BST) stores keys in a binary tree subject to one invariant: for every node `n`, all keys in `n`'s left subtree are strictly less than `n.key` and all keys in `n`'s right subtree are strictly greater. The invariant turns the three core operations — **search**, **insert**, and **delete** — into a single root-to-leaf walk that costs `O(h)`, where `h` is the tree's height. With a balanced height (`h = O(log n)`) the BST gives ordered-map performance; without balancing, adversarial input degenerates it to a linked list.

## whyItMatters
- It is the conceptual core of every ordered associative container (`std::set`, `TreeMap`, `SortedDict`, B-Tree pages on disk).
- Range queries, predecessor / successor lookups, and order statistics fall out of the BST invariant for free.
- Database indexes and file-system directories are balanced-BST variants in disguise (B-Trees, B+Trees).
- It is the only tree where **inorder traversal** yields keys in sorted order — the canonical trick for "validate a BST" and "convert tree to sorted list".
- Every balanced-tree refinement (AVL, red-black, treap, splay) starts from this skeleton and adds rotations to keep `h = O(log n)`.

## intuition
The invariant lets a single comparison at each node prune **half** the remaining keys: if the target is smaller than the current node, you only need to look left; otherwise, only right. That is binary search adapted to a tree shape — hence the name. Every operation reduces to walking from root toward a leaf, making the same kind of comparison at each step.

Insertion follows the same walk; the new key always ends up as a **new leaf**, attached to the node whose comparison failed. Deletion is the only operation with a twist. If the deleted node has zero or one child, you splice it out by promoting the child (or null). The hard case is two children: you can't just promote one because the other subtree would be orphaned. The trick is to replace the node's *key* with its **inorder successor** (the smallest key in the right subtree) — which always has at most one child — then delete that successor instead. The BST invariant survives because the successor is the smallest right-subtree key, so it is still greater than every left-subtree key and less than every other right-subtree key.

Why does this work? The inorder traversal of a BST is a sorted sequence. The inorder successor is the next key in that sequence. Promoting it preserves the order relationship the BST encodes. The same logic with inorder *predecessor* (largest in left subtree) also works — implementations alternate to keep the tree slightly more balanced.

## visualization
Insert `[8, 3, 10, 1, 6, 14, 4, 7, 13]` into an empty BST.

```
after 8:        8
after 3:        8
               /
              3
after 10:       8
               / \
              3  10
after 1,6:      8
               / \
              3  10
             / \
            1   6
after 14:      8
              / \
             3  10
            / \   \
           1   6   14
after 4,7:        8
                 / \
                3  10
               / \   \
              1   6  14
                 / \
                4   7
after 13:         8
                 / \
                3  10
               / \   \
              1   6  14
                 / \  /
                4  7 13
```

Delete `3` (two children). Successor is `4`. Replace `3`'s key with `4`, then delete the original `4` (a leaf):

```
                 8
                / \
               4  10
              / \   \
             1   6  14
                / \  /
               (gone) 7 13
                          (4 was a leaf in left subtree)
```

## bruteForce
A sorted array supports search in `O(log n)` via binary search but insertion in `O(n)` because shifting is required. A linked list reverses the trade-off. The BST gets `O(h)` for all three; with self-balancing, `h = O(log n)`, beating both linear-structure alternatives.

## optimal
Recursive or iterative — the iterative form is clearer for production code.

```python
class Node:
    __slots__ = ('key', 'left', 'right')
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def search(root, key):
    while root:
        if key == root.key: return root
        root = root.left if key < root.key else root.right
    return None

def insert(root, key):
    if root is None: return Node(key)
    cur = root
    while True:
        if key == cur.key: return root        # ignore duplicates
        nxt = 'left' if key < cur.key else 'right'
        child = getattr(cur, nxt)
        if child is None:
            setattr(cur, nxt, Node(key))
            return root
        cur = child

def delete(root, key):
    if root is None: return None
    if key < root.key: root.left = delete(root.left, key)
    elif key > root.key: root.right = delete(root.right, key)
    else:
        if root.left is None: return root.right
        if root.right is None: return root.left
        succ = root.right
        while succ.left: succ = succ.left
        root.key = succ.key
        root.right = delete(root.right, succ.key)
    return root
```

Without balancing, inserting a sorted sequence (`1, 2, 3, 4, ...`) produces a right-skewed tree of height `n`, making every operation `O(n)`. AVL trees, red-black trees, and treaps fix this by performing **rotations** during insert and delete to keep height `O(log n)`. The operations above are still the skeleton — balanced variants wrap each call with a "rebalance on the way back up" step.

## complexity
- **Time**: `O(h)` per operation. Balanced: `O(log n)`. Worst case (adversarial input): `O(n)`.
- **Space**: `O(n)` for the tree, `O(h)` recursion stack.
- **Inorder traversal**: `O(n)` and yields sorted keys.
- **Augmentations**: subtree size, min/max, sum, etc., enable order statistics and range queries in `O(h)`.

## pitfalls
- **Tolerating duplicates without policy.** A duplicate either replaces (map semantics), counts (multiset), or errors. Pick one. Fix: state the policy in the API and `return root` (no insert) for the "ignore" case.
- **Deleting without handling both-children correctly.** Forgetting to promote the inorder successor leaves orphaned subtrees. Fix: always check both children before assuming one is null.
- **Recursive walks on huge trees.** Stack depth is `h` — for unbalanced trees that can overflow. Fix: write iterative versions or use a balanced variant.
- **Walking past a found key.** When `key == root.key`, return immediately; otherwise the loop continues into the wrong subtree. Fix: check equality before descending.

## interviewTips
- Always **state and uphold** the invariant explicitly when explaining BSTs to interviewers.
- Walk the **two-child delete** by hand on a 6-node tree — that case trips up half the candidates.
- Mention that inorder traversal produces a sorted sequence; this is the textbook "validate a BST" trick.

## code.python
```python
class Node:
    __slots__ = ('key','left','right')
    def __init__(self, k): self.key, self.left, self.right = k, None, None

def search(root, k):
    while root:
        if k == root.key: return root
        root = root.left if k < root.key else root.right
    return None

def insert(root, k):
    if not root: return Node(k)
    cur = root
    while True:
        if k == cur.key: return root
        if k < cur.key:
            if not cur.left: cur.left = Node(k); return root
            cur = cur.left
        else:
            if not cur.right: cur.right = Node(k); return root
            cur = cur.right

def delete(root, k):
    if not root: return None
    if k < root.key: root.left = delete(root.left, k)
    elif k > root.key: root.right = delete(root.right, k)
    else:
        if not root.left: return root.right
        if not root.right: return root.left
        s = root.right
        while s.left: s = s.left
        root.key = s.key
        root.right = delete(root.right, s.key)
    return root
```

## code.javascript
```javascript
class Node { constructor(k) { this.key = k; this.left = null; this.right = null; } }
function search(root, k) {
  while (root) { if (k === root.key) return root;
    root = k < root.key ? root.left : root.right; }
  return null;
}
function insert(root, k) {
  if (!root) return new Node(k);
  let cur = root;
  while (true) {
    if (k === cur.key) return root;
    if (k < cur.key) { if (!cur.left) { cur.left = new Node(k); return root; } cur = cur.left; }
    else             { if (!cur.right) { cur.right = new Node(k); return root; } cur = cur.right; }
  }
}
function deleteKey(root, k) {
  if (!root) return null;
  if (k < root.key) root.left = deleteKey(root.left, k);
  else if (k > root.key) root.right = deleteKey(root.right, k);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let s = root.right; while (s.left) s = s.left;
    root.key = s.key; root.right = deleteKey(root.right, s.key);
  }
  return root;
}
```

## code.java
```java
class Node { int key; Node left, right; Node(int k) { key = k; } }
class BST {
    Node search(Node root, int k) {
        while (root != null) {
            if (k == root.key) return root;
            root = (k < root.key) ? root.left : root.right;
        }
        return null;
    }
    Node insert(Node root, int k) {
        if (root == null) return new Node(k);
        if (k < root.key) root.left = insert(root.left, k);
        else if (k > root.key) root.right = insert(root.right, k);
        return root;
    }
    Node delete(Node root, int k) {
        if (root == null) return null;
        if (k < root.key) root.left = delete(root.left, k);
        else if (k > root.key) root.right = delete(root.right, k);
        else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            Node s = root.right; while (s.left != null) s = s.left;
            root.key = s.key; root.right = delete(root.right, s.key);
        }
        return root;
    }
}
```

## code.cpp
```cpp
struct Node { int key; Node *left = nullptr, *right = nullptr; Node(int k) : key(k) {} };
Node* search(Node* root, int k) {
    while (root) { if (k == root->key) return root;
        root = k < root->key ? root->left : root->right; }
    return nullptr;
}
Node* insert(Node* root, int k) {
    if (!root) return new Node(k);
    if (k < root->key) root->left = insert(root->left, k);
    else if (k > root->key) root->right = insert(root->right, k);
    return root;
}
Node* erase(Node* root, int k) {
    if (!root) return nullptr;
    if (k < root->key) root->left = erase(root->left, k);
    else if (k > root->key) root->right = erase(root->right, k);
    else {
        if (!root->left)  { Node* r = root->right; delete root; return r; }
        if (!root->right) { Node* l = root->left;  delete root; return l; }
        Node* s = root->right; while (s->left) s = s->left;
        root->key = s->key; root->right = erase(root->right, s->key);
    }
    return root;
}
```
