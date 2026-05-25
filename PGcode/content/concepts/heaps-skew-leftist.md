---
slug: heaps-skew-leftist
module: heaps
title: Leftist & Skew Heaps
subtitle: Mergeable priority queues built on a single recursive idea
difficulty: Advanced
position: 55
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "Leftist tree"
    url: "https://cp-algorithms.com/data_structures/leftist_tree.html"
    type: blog
  - title: "TheAlgorithms/Java"
    url: "https://github.com/TheAlgorithms/Java"
    type: repo
status: published
---

## intro
A binary heap supports push and pop in O(log n) but cannot merge two heaps faster than O(n). Leftist and skew heaps fix that by being mergeable in O(log n) (worst-case for leftist, amortized for skew). Both reduce every operation to a single `merge(a, b)` primitive.

## whyItMatters
- Mergeable heaps power algorithms that combine work units: parallel scheduling, persistent priority queues, Dijkstra-on-many-sources, k-way merging without auxiliary buffers.
- The whole API is one recursive function; you can implement either in 20 lines.
- They build intuition for amortized analysis and for self-adjusting data structures (skew is to leftist what splay is to AVL).

## intuition
Both heaps are binary trees that obey the heap-order property: every parent is less than or equal to its children. Neither tries to be balanced in the AVL sense. Instead they guarantee that all the action happens along the *right spine*, the path you get by always following the right child. Merging two heaps is then a recursive walk along these two spines, picking the smaller root, recursively merging its right subtree with the other heap, and then fixing up the children so the right spine stays short. A leftist heap tracks an "s-value" (also called the null-path length) at every node and swaps children after a merge so that the right child always has the smaller s-value, which mathematically forces the right spine to be at most `log(n + 1)` long. A skew heap drops the bookkeeping and *always* swaps the children after a merge; you might think this could go horribly wrong, but amortized analysis shows that any sequence of m operations costs only `O(m log n)`, the same as a leftist heap but with simpler code. The mental model: think of merge as zipping two right spines together while the left subtrees fall away "to the side". Push is `merge(heap, single-node)`; pop is `merge(left, right)` of the root. Once you accept that everything is merge, the rest is bookkeeping.

## visualization
```
Merge two leftist heaps (numbers in nodes, s-values in []):

        2[2]                    4[1]
       /    \                   /
     6[1]   8[1]              9[1]
     /
   10[1]

step 1: pick smaller root 2; recurse merge(8, 4)
step 2: pick smaller root 4; recurse merge(8, 9) -> 8 with right child 9
step 3: child s-values [0] vs [1] -> swap so right is shorter
result:
        2[2]
       /    \
     6[1]   4[1]
     /        \
   10[1]      8[1]
                \
                9[1]
```

## bruteForce
A naive merge would copy every node from heap B into heap A using sift-up, costing `O(|B| log(|A| + |B|))`. For long sequences of unions (mergesort-style k-way merge, Kruskal-on-forest variants) this dominates the whole algorithm. Linked binary heaps that ignore mergeability cannot do better than rebuilding from scratch.

## optimal
The merge primitive: given two leftist (or skew) heaps `a` and `b`, if either is empty return the other. Otherwise ensure `a.key <= b.key` by swapping. Recursively merge `a.right` with `b` and store the result as the new `a.right`. For a *leftist* heap, update s-values: `a.s = a.right.s + 1`, and if `a.left.s < a.right.s` swap children so the invariant "left s-value >= right s-value" holds. For a *skew* heap, unconditionally swap `a.left` and `a.right`. Return `a`. That single function gives you push (merge with a singleton) and pop-min (return root key, then merge left and right children). The reason the right spine stays short for leftist heaps is an inductive argument on s-values: if every node has `s.left >= s.right`, then the right spine length equals the root's s-value, which is at most `log(n + 1)` because each step doubles the minimum subtree size. The skew variant has no invariant per operation, but the potential function "number of heavy right children" pays for any expensive merge with future cheap ones. Choose leftist when you need worst-case bounds (real-time systems, adversarial inputs); choose skew when you want simpler code and average-case is fine. Both are pointer-based, so they fragment memory more than array heaps and lose cache locality. Mitigate this with arena allocation and 32-bit indices if performance matters.

## complexity
- **Time:** O(log n) per push, pop, and merge. Worst-case for leftist; amortized for skew.
- **Space:** O(n) total nodes plus O(log n) recursion depth.

## pitfalls
- **Confusing s-values with subtree size.** s-value is the null-path length, not the count. Fix: compute it as `1 + min(s(left), s(right))` with null = -1.
- **Forgetting to swap children in skew merge.** Without the unconditional swap, the amortized guarantee evaporates and a worst-case adversary degenerates the heap to a linked list. Fix: swap on every recursive return.
- **Mutating shared subtrees.** Both heaps are usually destructive; reusing a heap after merge gives stale pointers. Fix: document that merge consumes its arguments, or rebuild persistently.
- **Stack overflow on deep right spines.** Recursive merge can blow the default stack for very large unbalanced inputs. Fix: convert to an iterative two-pointer merge along the spines, or raise stack size.
- **Comparing by reference.** Java's `compareTo` on boxed types is fine; using `==` on Integer values above 127 silently misbehaves. Fix: always use the comparator.

## interviewTips
- If asked for a mergeable priority queue, propose leftist first (worst-case guarantee), then mention skew as the lazy variant.
- Be ready to write `merge` on the board in 10 lines; everything else follows.
- Mention that Fibonacci heaps beat both for decrease-key but are notoriously slow in practice; leftist/skew are the realistic choice.

## code.python
```python
class Node:
    __slots__ = ("key", "left", "right", "s")
    def __init__(self, key):
        self.key = key
        self.left = self.right = None
        self.s = 0


def _s(n):
    return -1 if n is None else n.s


def merge(a, b):
    if a is None: return b
    if b is None: return a
    if a.key > b.key: a, b = b, a
    a.right = merge(a.right, b)
    if _s(a.left) < _s(a.right):
        a.left, a.right = a.right, a.left
    a.s = _s(a.right) + 1
    return a


class LeftistHeap:
    def __init__(self): self.root = None
    def push(self, k): self.root = merge(self.root, Node(k))
    def pop(self):
        k = self.root.key
        self.root = merge(self.root.left, self.root.right)
        return k
    def peek(self): return self.root.key
```

## code.javascript
```javascript
class Node {
  constructor(key) {
    this.key = key;
    this.left = this.right = null;
    this.s = 0;
  }
}

const sVal = (n) => (n === null ? -1 : n.s);

function merge(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  if (a.key > b.key) [a, b] = [b, a];
  a.right = merge(a.right, b);
  if (sVal(a.left) < sVal(a.right)) {
    [a.left, a.right] = [a.right, a.left];
  }
  a.s = sVal(a.right) + 1;
  return a;
}

class LeftistHeap {
  constructor() { this.root = null; }
  push(k) { this.root = merge(this.root, new Node(k)); }
  pop() {
    const k = this.root.key;
    this.root = merge(this.root.left, this.root.right);
    return k;
  }
  peek() { return this.root.key; }
}
```

## code.java
```java
public class LeftistHeap {
    static class Node {
        int key, s;
        Node left, right;
        Node(int k) { key = k; }
    }
    private Node root;

    private static int s(Node n) { return n == null ? -1 : n.s; }

    private static Node merge(Node a, Node b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a.key > b.key) { Node t = a; a = b; b = t; }
        a.right = merge(a.right, b);
        if (s(a.left) < s(a.right)) {
            Node t = a.left; a.left = a.right; a.right = t;
        }
        a.s = s(a.right) + 1;
        return a;
    }

    public void push(int k) { root = merge(root, new Node(k)); }
    public int peek() { return root.key; }
    public int pop() {
        int k = root.key;
        root = merge(root.left, root.right);
        return k;
    }
}
```

## code.cpp
```cpp
#include <algorithm>

struct Node {
    int key, s = 0;
    Node *left = nullptr, *right = nullptr;
    Node(int k) : key(k) {}
};

static int sVal(Node* n) { return n ? n->s : -1; }

Node* merge(Node* a, Node* b) {
    if (!a) return b;
    if (!b) return a;
    if (a->key > b->key) std::swap(a, b);
    a->right = merge(a->right, b);
    if (sVal(a->left) < sVal(a->right)) std::swap(a->left, a->right);
    a->s = sVal(a->right) + 1;
    return a;
}

struct LeftistHeap {
    Node* root = nullptr;
    void push(int k) { root = merge(root, new Node(k)); }
    int peek() const { return root->key; }
    int pop() {
        int k = root->key;
        Node* old = root;
        root = merge(root->left, root->right);
        delete old;
        return k;
    }
};
```
