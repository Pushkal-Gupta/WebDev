---
slug: treap-randomized-bst
module: trees-balanced-disk
title: Treap — Randomized Balanced BST
subtitle: BST on keys + heap on random priorities — expected O(log n) without rotations bookkeeping.
difficulty: Advanced
position: 21
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "Treap — CP-Algorithms"
    url: "https://cp-algorithms.com/data_structures/treap.html"
    type: blog
  - title: "TheAlgorithms/Python — treap.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/treap.py"
    type: repo
status: published
---

## intro
A treap is a binary tree where each node carries two values: a search **key** and a randomly assigned **priority**. The tree is simultaneously a BST on keys (in-order traversal yields sorted keys) and a max-heap on priorities (every parent's priority dominates its children). Because priorities are uniform random, the expected tree height is O(log n) — no rebalancing trickery, no color flips, no rank constraints.

## whyItMatters
Red-black and AVL trees are correct, fast, and a nightmare to implement under time pressure: rotations have a dozen cases and a single missed flag corrupts the structure silently. Treaps reduce the entire balancing logic to two primitives — **split** and **merge** — that compose naturally and are ~30 lines each. They are the go-to ordered set in competitive programming and underpin implicit-key variants used for sequence operations (range reverse, range sum, persistent versions).

## intuition
If you take any BST and assign random priorities, then rotate to enforce the max-heap property, the result is unique given the priorities. The unique-ness matters: the structure depends only on the priorities, not on insertion order. Random priorities therefore make the tree behave as if the keys had been inserted in random order — which is the textbook setting for expected O(log n) BST height. Treaps trade a small constant factor for dramatically simpler code.

## visualization
```
keys inserted: 5, 3, 8, 1, 7    priorities (random): 5->50, 3->90, 8->30, 1->20, 7->60

Step 1 (after all five, satisfying BST on key and heap on priority):

                 ( 3, 90 )
                /        \
          ( 1, 20 )    ( 5, 50 )
                            \
                          ( 7, 60 )
                          /
                    ( 8, 30 )           <-- wait, 8 > 7 so 8 is RIGHT child of 7

Correct shape:
                 ( 3, 90 )
                /        \
          ( 1, 20 )    ( 5, 50 )
                            \
                          ( 7, 60 )
                                \
                              ( 8, 30 )

split(root, k=6) returns two treaps:
   left:  keys <= 6  -> [1, 3, 5]
   right: keys >  6  -> [7, 8]
merge(L, R) requires every key in L < every key in R; recursively pick the higher-priority root.
```

## bruteForce
Use an unbalanced BST. Insertions are O(h) where h is the current height; an adversarial input (sorted keys) gives h = n and every operation degenerates to O(n). Acceptable only when input order is known to be random; otherwise it is a latency time bomb.

## optimal
The two-primitive design:
```
split(t, k):
    # returns (L, R) with all keys in L <= k and all in R > k
    if t is None: return (None, None)
    if t.key <= k:
        L, R = split(t.right, k)
        t.right = L
        return (t, R)
    else:
        L, R = split(t.left, k)
        t.left = R
        return (L, t)

merge(L, R):
    # requires max(L.keys) < min(R.keys)
    if L is None: return R
    if R is None: return L
    if L.priority > R.priority:
        L.right = merge(L.right, R)
        return L
    else:
        R.left = merge(L, R.left)
        return R

insert(root, key):
    L, R = split(root, key - 1)
    new = Node(key, random_priority())
    return merge(merge(L, new), R)

erase(root, key):
    L, M = split(root, key - 1)
    _, R = split(M, key)         # M's left half is the deletion target, dropped
    return merge(L, R)
```
With implicit keys (use subtree size as the "key"), the same two primitives give O(log n) array splice, reverse-range, and persistent versions.

## complexity
time: O(log n) expected for insert/erase/find/split/merge; O(n) worst case (vanishingly improbable for uniform priorities)
space: O(n) for nodes; O(log n) recursion depth on the call stack
notes: Probability of height > 4 log n is below 1/n^2 — for practical n, "expected" is "essentially worst-case bounded."

## pitfalls
- Using a bad RNG (e.g. `rand() % small_mod`) — collisions in priority break the heap property and degrade height.
- Recursing without a depth guard during testing — a buggy split that returns the same node in both halves loops forever.
- Forgetting to update subtree-size / subtree-sum *after* every split and merge — implicit-key treaps depend on these.
- Comparing priorities with `>=` in merge — ties give two roots claiming the same priority and break the deterministic shape.
- Trying to delete by `find then unlink` — far harder than `split-split-merge`; reach for the primitive.

## interviewTips
- Mention treaps when asked about "alternatives to red-black trees" — interviewers reward knowing more than one balanced BST.
- Be ready to derive expected height: random priorities ≡ random insertion order ≡ E[h] = O(log n) (classic BST analysis).
- For order-statistics queries (k-th smallest, rank-of-key), augment nodes with subtree size and answer in O(log n).
- Bring up implicit-key treaps for sequence problems — they replace segment-tree-with-lazy for reverse-range operations.

## code.python
```python
import random

class Node:
    __slots__ = ("key", "priority", "left", "right")
    def __init__(self, key):
        self.key = key
        self.priority = random.random()
        self.left = self.right = None

def split(t, k):
    if t is None:
        return (None, None)
    if t.key <= k:
        l, r = split(t.right, k)
        t.right = l
        return (t, r)
    l, r = split(t.left, k)
    t.left = r
    return (l, t)

def merge(a, b):
    if a is None: return b
    if b is None: return a
    if a.priority > b.priority:
        a.right = merge(a.right, b)
        return a
    b.left = merge(a, b.left)
    return b

def insert(root, key):
    l, r = split(root, key - 1)
    return merge(merge(l, Node(key)), r)

def erase(root, key):
    l, m = split(root, key - 1)
    _, r = split(m, key)
    return merge(l, r)
```

## code.javascript
```javascript
class Node {
  constructor(key) {
    this.key = key;
    this.priority = Math.random();
    this.left = null;
    this.right = null;
  }
}

function split(t, k) {
  if (!t) return [null, null];
  if (t.key <= k) {
    const [l, r] = split(t.right, k);
    t.right = l;
    return [t, r];
  }
  const [l, r] = split(t.left, k);
  t.left = r;
  return [l, t];
}

function merge(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.priority > b.priority) { a.right = merge(a.right, b); return a; }
  b.left = merge(a, b.left); return b;
}

function insert(root, key) {
  const [l, r] = split(root, key - 1);
  return merge(merge(l, new Node(key)), r);
}

function erase(root, key) {
  const [l, m] = split(root, key - 1);
  const [, r] = split(m, key);
  return merge(l, r);
}
```

## code.java
```java
class Treap {
    static final Random RNG = new Random();

    static class Node {
        int key;
        double priority;
        Node left, right;
        Node(int k) { key = k; priority = RNG.nextDouble(); }
    }

    static Node[] split(Node t, int k) {
        if (t == null) return new Node[]{null, null};
        if (t.key <= k) {
            Node[] s = split(t.right, k);
            t.right = s[0];
            return new Node[]{t, s[1]};
        }
        Node[] s = split(t.left, k);
        t.left = s[1];
        return new Node[]{s[0], t};
    }

    static Node merge(Node a, Node b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a.priority > b.priority) { a.right = merge(a.right, b); return a; }
        b.left = merge(a, b.left); return b;
    }

    static Node insert(Node root, int key) {
        Node[] s = split(root, key - 1);
        return merge(merge(s[0], new Node(key)), s[1]);
    }

    static Node erase(Node root, int key) {
        Node[] s = split(root, key - 1);
        Node[] t = split(s[1], key);
        return merge(s[0], t[1]);
    }
}
```

## code.cpp
```cpp
#include <random>

struct Node {
    int key;
    int priority;
    Node *left = nullptr, *right = nullptr;
    Node(int k) : key(k), priority(rand()) {}
};

std::pair<Node*, Node*> split(Node* t, int k) {
    if (!t) return {nullptr, nullptr};
    if (t->key <= k) {
        auto [l, r] = split(t->right, k);
        t->right = l;
        return {t, r};
    }
    auto [l, r] = split(t->left, k);
    t->left = r;
    return {l, t};
}

Node* merge(Node* a, Node* b) {
    if (!a) return b;
    if (!b) return a;
    if (a->priority > b->priority) { a->right = merge(a->right, b); return a; }
    b->left = merge(a, b->left); return b;
}

Node* insert(Node* root, int key) {
    auto [l, r] = split(root, key - 1);
    return merge(merge(l, new Node(key)), r);
}

Node* erase(Node* root, int key) {
    auto [l, m] = split(root, key - 1);
    auto [_, r] = split(m, key);
    return merge(l, r);
}
```
