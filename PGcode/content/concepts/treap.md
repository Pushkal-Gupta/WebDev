---
slug: treap
module: trees-balanced-disk
title: Treap
subtitle: Randomized balanced BST — BST on keys, max-heap on random priorities, O(log n) expected for everything.
difficulty: Advanced
position: 24
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
A treap is a binary tree that simultaneously satisfies two ordering rules: **BST order on keys** (in-order traversal is sorted) and **max-heap order on random priorities** (every parent's priority is ≥ its children's). The priorities are random so the tree's expected height is O(log n) — without any explicit rebalance code.

## whyItMatters
Compared to red-black or AVL trees:
- Code is **dramatically shorter** — splits and merges are 5-line recursions.
- Supports **split / merge by key** in O(log n) — a powerful operation red-black trees don't expose natively.
- Performs reliably without rotations or color-bookkeeping.

In competitive programming and systems work, treaps power **implicit-key treaps** (an ordered sequence where the "key" is implicit position) which support array operations like cut, paste, reverse, range-update in O(log n) — useful for editor data structures, splay-tree replacement, persistent collections.

## intuition
Picture inserting key `k` with random priority `p`. Walk down the BST by key. At the leaf, insert. Now if `p` is bigger than the parent's priority, the heap order is broken — rotate to push `k` up. Keep rotating until `p` fits below something with a higher priority or `k` reaches the root. Because priorities are uniformly random, the expected depth of any node is O(log n).

## visualization
```
Insert keys 1..5 with random priorities (shown next to each):
                          (3, 90)
                          /     \
                    (1, 60)     (5, 70)
                          \     /
                       (2, 40)(4, 20)

In-order: 1, 2, 3, 4, 5 (BST on keys). Each parent's priority ≥ children's (heap).
```

## bruteForce
Plain BST → O(n) worst case (sorted inserts). Self-balancing trees (AVL, red-black) → O(log n) but verbose. Treap gives the same time bound with a fraction of the code.

## optimal
Two foundational operations every treap is built on:

**Split(t, key) → (L, R)**: split treap t into L (all keys < key) and R (all keys ≥ key).
```
split(t, key):
    if t is empty: return (empty, empty)
    if t.key < key:
        L, R = split(t.right, key)
        t.right = L
        return (t, R)
    else:
        L, R = split(t.left, key)
        t.left = R
        return (L, t)
```

**Merge(L, R)**: merge two treaps where every key in L < every key in R.
```
merge(L, R):
    if L is empty: return R
    if R is empty: return L
    if L.priority > R.priority:
        L.right = merge(L.right, R)
        return L
    else:
        R.left = merge(L, R.left)
        return R
```

**Insert(t, k, p)**: split at k, then merge L + new node + R.
**Delete(t, k)**: split off the singleton, merge L + R.

Implicit-key treaps store subtree sizes instead of keys; "find the i-th element" replaces "find by key" and you get an O(log n) random-access list with cut/paste/reverse.

## complexity
- **Expected time**: O(log n) per insert / delete / split / merge / search.
- **Worst case**: O(n) — extremely rare with good randomness.
- **Space**: O(n).
- **Code length**: ~30 LOC for keyed treap, ~50 for implicit-key.

## pitfalls
- **Deterministic priority**: defeats the randomization. Use a real RNG seeded once; cryptographic isn't necessary unless adversarial input.
- **Confusing split semantics**: pick "all keys < x → L" vs "all keys ≤ x → L" upfront. Off-by-one duplicates are easy.
- **Forgetting to recompute subtree sizes** after splits/merges in implicit-key treaps. Wrap split/merge with a `pull()` helper.
- **Stack depth**: 10^6 nodes might recurse too deep — convert to iterative for production-scale.
- **Priority collisions**: with 32-bit random ints and n = 10^5 you'll see collisions. Use 64-bit priorities or break ties on insertion order.

## interviewTips
- The trigger: "balanced BST with split / merge by key" or "implicit-key array with range operations" → treap.
- Mention by name: many interviewers know red-black / AVL but appreciate the treap alternative.
- For senior interviews, compare with **splay tree** (amortized O(log n), recently-accessed nodes near root) and **skip list** (similar expected bounds, list-of-arrays layout).
- For implicit-key applications, mention rope / piece-table as the editor-data-structure cousin.

## code.python
```python
import random

class Node:
    __slots__ = ('key', 'priority', 'left', 'right')
    def __init__(self, key, priority):
        self.key, self.priority = key, priority
        self.left, self.right = None, None

def split(t, key):
    if not t: return None, None
    if t.key < key:
        L, R = split(t.right, key)
        t.right = L
        return t, R
    L, R = split(t.left, key)
    t.left = R
    return L, t

def merge(L, R):
    if not L: return R
    if not R: return L
    if L.priority > R.priority:
        L.right = merge(L.right, R)
        return L
    R.left = merge(L, R.left)
    return R

def insert(root, key):
    L, R = split(root, key)
    return merge(merge(L, Node(key, random.randint(1, 10**9))), R)

def contains(t, key):
    while t:
        if t.key == key: return True
        t = t.left if key < t.key else t.right
    return False

root = None
for k in [5, 3, 8, 1, 4, 7, 9]: root = insert(root, k)
print(contains(root, 4), contains(root, 6))
```

## code.javascript
```javascript
class Node {
  constructor(key, priority) { this.key = key; this.priority = priority; this.left = null; this.right = null; }
}
function split(t, key) {
  if (!t) return [null, null];
  if (t.key < key) { const [L, R] = split(t.right, key); t.right = L; return [t, R]; }
  const [L, R] = split(t.left, key); t.left = R; return [L, t];
}
function merge(L, R) {
  if (!L) return R; if (!R) return L;
  if (L.priority > R.priority) { L.right = merge(L.right, R); return L; }
  R.left = merge(L, R.left); return R;
}
function insert(root, key) {
  const [L, R] = split(root, key);
  return merge(merge(L, new Node(key, Math.random())), R);
}
```

## code.java
```java
import java.util.Random;
class Treap {
    static class Node { int key; double priority; Node left, right; Node(int k, double p) { key = k; priority = p; } }
    private static final Random rng = new Random();
    static Node[] split(Node t, int key) {
        if (t == null) return new Node[]{ null, null };
        if (t.key < key) {
            Node[] r = split(t.right, key); t.right = r[0]; return new Node[]{ t, r[1] };
        }
        Node[] r = split(t.left, key); t.left = r[1]; return new Node[]{ r[0], t };
    }
    static Node merge(Node L, Node R) {
        if (L == null) return R; if (R == null) return L;
        if (L.priority > R.priority) { L.right = merge(L.right, R); return L; }
        R.left = merge(L, R.left); return R;
    }
    static Node insert(Node root, int key) {
        Node[] s = split(root, key);
        return merge(merge(s[0], new Node(key, rng.nextDouble())), s[1]);
    }
}
```

## code.cpp
```cpp
#include <random>
struct Node { int key; double priority; Node *left = nullptr, *right = nullptr; };
inline std::mt19937_64& rng() { static std::mt19937_64 r{ std::random_device{}() }; return r; }

void split(Node* t, int key, Node*& L, Node*& R) {
    if (!t) { L = R = nullptr; return; }
    if (t->key < key) { split(t->right, key, t->right, R); L = t; }
    else { split(t->left, key, L, t->left); R = t; }
}

Node* merge(Node* L, Node* R) {
    if (!L || !R) return L ? L : R;
    if (L->priority > R->priority) { L->right = merge(L->right, R); return L; }
    R->left = merge(L, R->left); return R;
}

Node* insert(Node* root, int key) {
    Node *L, *R; split(root, key, L, R);
    std::uniform_real_distribution<double> d(0, 1);
    Node* n = new Node{ key, d(rng()) };
    return merge(merge(L, n), R);
}
```
