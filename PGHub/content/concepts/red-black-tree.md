---
slug: red-black-tree
module: trees-balanced-disk
title: Red-Black Tree
subtitle: Self-balancing BST with five color invariants and O(log n) worst-case operations.
difficulty: Advanced
position: 32
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 13: Red-Black Trees"
    url: "https://walkccc.me/CLRS/Chap13/13.1/"
    type: book
  - title: "Red-Black Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/introduction-to-red-black-tree/"
    type: blog
  - title: "TheAlgorithms/Python — red_black_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/red_black_tree.py"
    type: repo
status: published
---

## intro
A red-black tree is a binary search tree where every node carries one extra bit — red or black — and five invariants together guarantee the longest root-to-leaf path is at most twice the shortest. That bound forces every search, insert, and delete to run in O(log n) worst case, which is why TreeMap, std::map, the Linux CFS scheduler, and many kernel data structures pick this exact balancer.

## whyItMatters
A plain BST can degrade to a linked list under sorted input — O(n) per operation. Red-black trees fix that without the strict height balance of AVL, so they need fewer rotations on insert and delete. The trade-off is the rule book: five interacting invariants, two rotation primitives, and a small zoo of recoloring cases. Interviewers love them because they test whether you can reason about a data structure with non-local invariants.

## intuition
Read the colors as a "weight" system. Black nodes contribute to a path's "black height"; red nodes are free. Rule: every path from a node down to any descendant null leaf must contain the same number of black nodes. Combine that with "no two reds in a row" and the tree cannot become twisted enough for one path to be more than 2x the other. Rotations and recoloring during insert and delete are the moves you make to keep the black-height equal everywhere after a local violation.

## visualization
```
        [10B]
       /     \
    [5R]     [15R]
    / \      /   \
  [3B][7B] [12B][20B]
```
All paths from root to null leaves visit exactly two black nodes (root counts plus one leaf-side black). Insert 4 as a red child of 3 — no violation. Insert 6 as red child of 7 — now 7 (black) is fine, but if 7 had been red, we would have hit the "red-red" rule and triggered a rotation or recolor.

## bruteForce
The "naive" baseline is a plain BST: insert in O(h) where h can be n. Many systems wrap that with periodic rebuilds — every k operations, rebuild a balanced tree from sorted keys. That amortizes nicely but kills worst-case latency, which is exactly what databases and kernels cannot tolerate. Red-black gives true worst-case O(log n) per operation, no global rebuild needed.

## optimal
The five invariants: (1) every node is red or black; (2) root is black; (3) every null leaf is black; (4) a red node's children are both black; (5) every root-to-leaf path has the same black count. Insert as red at a BST position, then fix violations bottom-up: if uncle is red, recolor parent + uncle black and grandparent red, recurse on grandparent. If uncle is black, rotate (LL, LR, RR, RL cases) and recolor. Delete is harder — replace by successor, then resolve "double-black" via six symmetric cases.

```
insert(x):
    z = bst_insert(x); z.color = RED
    while z.parent.color == RED:
        if uncle(z).color == RED:
            parent.color = uncle.color = BLACK
            grandparent.color = RED
            z = grandparent
        else:
            if z is "inner" child: rotate parent
            parent.color = BLACK; grandparent.color = RED
            rotate grandparent
    root.color = BLACK
```

## complexity
time: O(log n) for search, insert, delete — worst case.
space: O(n) for the tree, O(log n) recursion or iterative parent pointers.
notes: At most two rotations per insert, at most three per delete. Height bound: 2 log2(n+1). Compared to AVL: looser balance, fewer rotations on writes, slightly slower reads.

## pitfalls
- Forgetting to recolor the root black after a fix-up that pushed red upward.
- Mixing up uncle vs sibling — uncle is for insert fix-up, sibling for delete fix-up.
- Treating null leaves as colorless instead of black breaks the black-height invariant.
- Off-by-one in black-height: the node itself does not count, only the path below it.
- Deletion is much trickier than insertion; the "double black" propagates upward until resolved by a rotation or by reaching the root.

## interviewTips
- Volunteer the invariants by name — interviewers grade on whether you remember all five.
- Compare against AVL: "AVL rebalances on height-1 imbalance, so reads are slightly faster but writes do more rotations. Red-black tolerates a sloppier balance to cut write cost."
- Mention real systems: Java TreeMap, C++ std::map / std::set, Linux kernel's process scheduler (CFS) and epoll, nginx timers.
- If asked to implement, write rotations as helpers first — left_rotate and right_rotate are pure pointer surgery, the rest of the code becomes case analysis on top of them.

## code.python
```python
RED, BLACK = 0, 1

class Node:
    __slots__ = ("key", "color", "left", "right", "parent")
    def __init__(self, key, color=RED):
        self.key = key; self.color = color
        self.left = self.right = self.parent = None

class RBTree:
    def __init__(self):
        self.NIL = Node(None, BLACK)
        self.root = self.NIL

    def _rotate_left(self, x):
        y = x.right
        x.right = y.left
        if y.left is not self.NIL: y.left.parent = x
        y.parent = x.parent
        if x.parent is None: self.root = y
        elif x is x.parent.left: x.parent.left = y
        else: x.parent.right = y
        y.left = x; x.parent = y

    def _rotate_right(self, x):
        y = x.left
        x.left = y.right
        if y.right is not self.NIL: y.right.parent = x
        y.parent = x.parent
        if x.parent is None: self.root = y
        elif x is x.parent.right: x.parent.right = y
        else: x.parent.left = y
        y.right = x; x.parent = y

    def insert(self, key):
        z = Node(key); z.left = z.right = self.NIL
        y, x = None, self.root
        while x is not self.NIL:
            y = x; x = x.left if z.key < x.key else x.right
        z.parent = y
        if y is None: self.root = z
        elif z.key < y.key: y.left = z
        else: y.right = z
        self._insert_fix(z)

    def _insert_fix(self, z):
        while z.parent and z.parent.color == RED:
            gp = z.parent.parent
            if z.parent is gp.left:
                u = gp.right
                if u.color == RED:
                    z.parent.color = u.color = BLACK
                    gp.color = RED; z = gp
                else:
                    if z is z.parent.right:
                        z = z.parent; self._rotate_left(z)
                    z.parent.color = BLACK; gp.color = RED
                    self._rotate_right(gp)
            else:
                u = gp.left
                if u.color == RED:
                    z.parent.color = u.color = BLACK
                    gp.color = RED; z = gp
                else:
                    if z is z.parent.left:
                        z = z.parent; self._rotate_right(z)
                    z.parent.color = BLACK; gp.color = RED
                    self._rotate_left(gp)
        self.root.color = BLACK
```

## code.javascript
```javascript
const RED = 0, BLACK = 1;

class Node {
  constructor(key, color = RED) {
    this.key = key; this.color = color;
    this.left = this.right = this.parent = null;
  }
}

class RBTree {
  constructor() {
    this.NIL = new Node(null, BLACK);
    this.root = this.NIL;
  }
  rotateLeft(x) {
    const y = x.right; x.right = y.left;
    if (y.left !== this.NIL) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x; x.parent = y;
  }
  rotateRight(x) {
    const y = x.left; x.left = y.right;
    if (y.right !== this.NIL) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x; x.parent = y;
  }
  insert(key) {
    const z = new Node(key);
    z.left = z.right = this.NIL;
    let y = null, x = this.root;
    while (x !== this.NIL) { y = x; x = z.key < x.key ? x.left : x.right; }
    z.parent = y;
    if (!y) this.root = z;
    else if (z.key < y.key) y.left = z;
    else y.right = z;
    this.fix(z);
  }
  fix(z) {
    while (z.parent && z.parent.color === RED) {
      const gp = z.parent.parent;
      if (z.parent === gp.left) {
        const u = gp.right;
        if (u.color === RED) { z.parent.color = u.color = BLACK; gp.color = RED; z = gp; }
        else {
          if (z === z.parent.right) { z = z.parent; this.rotateLeft(z); }
          z.parent.color = BLACK; gp.color = RED; this.rotateRight(gp);
        }
      } else {
        const u = gp.left;
        if (u.color === RED) { z.parent.color = u.color = BLACK; gp.color = RED; z = gp; }
        else {
          if (z === z.parent.left) { z = z.parent; this.rotateRight(z); }
          z.parent.color = BLACK; gp.color = RED; this.rotateLeft(gp);
        }
      }
    }
    this.root.color = BLACK;
  }
}
```

## code.java
```java
public class RBTree {
    static final boolean RED = false, BLACK = true;
    static class Node {
        int key; boolean color = RED;
        Node left, right, parent;
        Node(int k) { key = k; }
    }
    Node NIL = new Node(0) {{ color = BLACK; }};
    Node root = NIL;

    void rotateLeft(Node x) {
        Node y = x.right; x.right = y.left;
        if (y.left != NIL) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent == null) root = y;
        else if (x == x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x; x.parent = y;
    }
    void rotateRight(Node x) {
        Node y = x.left; x.left = y.right;
        if (y.right != NIL) y.right.parent = x;
        y.parent = x.parent;
        if (x.parent == null) root = y;
        else if (x == x.parent.right) x.parent.right = y;
        else x.parent.left = y;
        y.right = x; x.parent = y;
    }
    public void insert(int key) {
        Node z = new Node(key); z.left = z.right = NIL;
        Node y = null, x = root;
        while (x != NIL) { y = x; x = z.key < x.key ? x.left : x.right; }
        z.parent = y;
        if (y == null) root = z;
        else if (z.key < y.key) y.left = z; else y.right = z;
        fix(z);
    }
    void fix(Node z) {
        while (z.parent != null && z.parent.color == RED) {
            Node gp = z.parent.parent;
            if (z.parent == gp.left) {
                Node u = gp.right;
                if (u.color == RED) { z.parent.color = u.color = BLACK; gp.color = RED; z = gp; }
                else {
                    if (z == z.parent.right) { z = z.parent; rotateLeft(z); }
                    z.parent.color = BLACK; gp.color = RED; rotateRight(gp);
                }
            } else {
                Node u = gp.left;
                if (u.color == RED) { z.parent.color = u.color = BLACK; gp.color = RED; z = gp; }
                else {
                    if (z == z.parent.left) { z = z.parent; rotateRight(z); }
                    z.parent.color = BLACK; gp.color = RED; rotateLeft(gp);
                }
            }
        }
        root.color = BLACK;
    }
}
```

## code.cpp
```cpp
enum Color { RED, BLACK };
struct Node {
    int key; Color color = RED;
    Node *left = nullptr, *right = nullptr, *parent = nullptr;
    Node(int k) : key(k) {}
};

struct RBTree {
    Node* NIL;
    Node* root;
    RBTree() { NIL = new Node(0); NIL->color = BLACK; root = NIL; }

    void rotateLeft(Node* x) {
        Node* y = x->right; x->right = y->left;
        if (y->left != NIL) y->left->parent = x;
        y->parent = x->parent;
        if (!x->parent) root = y;
        else if (x == x->parent->left) x->parent->left = y;
        else x->parent->right = y;
        y->left = x; x->parent = y;
    }
    void rotateRight(Node* x) {
        Node* y = x->left; x->left = y->right;
        if (y->right != NIL) y->right->parent = x;
        y->parent = x->parent;
        if (!x->parent) root = y;
        else if (x == x->parent->right) x->parent->right = y;
        else x->parent->left = y;
        y->right = x; x->parent = y;
    }
    void insert(int key) {
        Node* z = new Node(key); z->left = z->right = NIL;
        Node *y = nullptr, *x = root;
        while (x != NIL) { y = x; x = z->key < x->key ? x->left : x->right; }
        z->parent = y;
        if (!y) root = z;
        else if (z->key < y->key) y->left = z; else y->right = z;
        fix(z);
    }
    void fix(Node* z) {
        while (z->parent && z->parent->color == RED) {
            Node* gp = z->parent->parent;
            if (z->parent == gp->left) {
                Node* u = gp->right;
                if (u->color == RED) { z->parent->color = u->color = BLACK; gp->color = RED; z = gp; }
                else {
                    if (z == z->parent->right) { z = z->parent; rotateLeft(z); }
                    z->parent->color = BLACK; gp->color = RED; rotateRight(gp);
                }
            } else {
                Node* u = gp->left;
                if (u->color == RED) { z->parent->color = u->color = BLACK; gp->color = RED; z = gp; }
                else {
                    if (z == z->parent->left) { z = z->parent; rotateRight(z); }
                    z->parent->color = BLACK; gp->color = RED; rotateLeft(gp);
                }
            }
        }
        root->color = BLACK;
    }
};
```
