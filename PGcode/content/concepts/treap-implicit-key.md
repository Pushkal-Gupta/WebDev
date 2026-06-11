---
slug: treap-implicit-key
module: trees-balanced-disk
title: Implicit-Key Treap — Logarithmic Array
subtitle: A balanced tree whose "key" is in-order position — supports insert / erase / reverse / range-sum on any array slice in O(log n).
difficulty: Advanced
position: 50
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Treap (with implicit treap) — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/treap.html"
    type: blog
  - title: "Treap — Wikipedia (implicit treap, bulk operations)"
    url: "https://en.wikipedia.org/wiki/Treap"
    type: blog
  - title: "KACTL — Treap.h (competitive reference implementation)"
    url: "https://github.com/kth-competitive-programming/kactl"
    type: repo
status: published
---

## intro
A keyed treap stores ordered keys and supports `insert`, `erase`, `lower_bound`, `split-by-key`, `merge` — all O(log n) expected. The implicit-key variant drops the key entirely: a node's "key" is its in-order index, defined dynamically by `1 + (size of left subtree) + (cumulative left-sizes of ancestors where this node is in the right subtree)`. The result is a balanced search tree over a *sequence* — an array with O(log n) insert anywhere, erase anywhere, reverse-any-range, and range-aggregate. The two-primitive `split`/`merge` interface stays identical; only the split criterion changes.

## whyItMatters
Many problems pretend to be array problems but quietly require operations no built-in array supports cheaply: insert at position `i`, delete index range `[l, r]`, reverse `[l, r]`, slide a sub-array to a new position, query "sum over `[l, r]`" while the array mutates. A plain array handles all of these in O(n); a segment tree with lazy propagation handles the *queries* in O(log n) but not the insertion / deletion / reverse / move. The implicit-key treap is the canonical structure that does *all* of them in O(log n) expected. Concretely it powers persistent ropes / piece tables in collaborative editors, lazy-segment-tree alternatives in competitive programming, undo stacks in spreadsheet engines, and any data structure where "the sequence is the thing and it keeps changing in the middle".

## intuition
A keyed treap splits by `key < x`. An implicit-key treap splits by `in-order index < x` — that is, "give me the first `x` elements as one treap and the rest as another". The in-order index of a node is not stored. It is reconstructed during the recursive split by tracking how many elements lie to the left of the current node: at the root, the count of "left of me" is `size(root.left)`; if we descend to `root.right`, we add `size(root.left) + 1` to the running count and ask "is the wanted index still in this subtree?".

That single change unlocks four operations almost for free.

**Insert at position `i`.** `split(root, i)` gives left `L` (first `i` elements) and right `R` (the rest). `merge(merge(L, new Node(value)), R)`. O(log n) expected.

**Erase the range `[l, r]`.** `split(root, l)` gives `L` and `M`; `split(M, r - l + 1)` gives the doomed middle and surviving right `R`; return `merge(L, R)`. O(log n).

**Range-reverse `[l, r]`.** Same two splits to isolate the middle treap. Then *flag* its root with a "reverse" lazy bit: on every subsequent visit, swap children and push the bit down. Joining `merge(merge(L, middle), R)` after flipping is O(log n). The flip itself is O(1) lazily; the work is paid as you visit deeper nodes.

**Range-aggregate (sum, min, gcd).** Store `agg(v)` in every node, defined recursively as `op(agg(left), value(v), agg(right))`. After every split / merge, *pull* (recompute `agg(v)` and `size(v)` from children). To query `[l, r]`, isolate the middle treap (two splits) and read its root's `agg`. Then `merge` back.

The trick that makes all of this work is **size-augmentation discipline**: every internal mutation must update `size` (and any other aggregate) immediately after wiring up children. The classic bug is a split that recurses correctly but forgets the `pull(t)` on the way back up; the heights stay correct but `size` lies and all subsequent splits land on the wrong index. The other half of the discipline is **lazy push**: any node carrying a "reverse" flag must push it to its children *before* recursion descends past it, otherwise the split lands on the wrong child.

## visualization
```
sequence: [10, 20, 30, 40, 50, 60, 70]   indices: 0 1 2 3 4 5 6
priorities (random): 10:75  20:30  30:90  40:60  50:50  60:80  70:40

shape (BST on in-order index, max-heap on priority):

                              ( 30 | 90 )
                              /         \
                       ( 10 | 75 )    ( 60 | 80 )
                              \         /     \
                       ( 20 | 30 )  ( 40 | 60 ) ( 70 | 40 )
                                          \
                                     ( 50 | 50 )

in-order traversal yields the sequence in order: 10, 20, 30, 40, 50, 60, 70.

split(root, k=3) -> (L, R) with L holding the first 3 elements, R holding the rest.
descend root (30): size(left)=2, so root itself is at index 2. k=3 > 2, recurse right with k -= (2+1) = 0.
descend right (60): size(left)=1, so node 60 is at index 1 of the right subtree. k=0 < 1, recurse left.
descend left (40): size(left)=0, so 40 is at index 0. k=0 <= 0, take its left (empty) into L, keep 40 in R.

result L holds [10, 20, 30], R holds [40, 50, 60, 70]. O(log n) descent.
```

## bruteForce
Use a flat array. Insert at position `i` is `O(n)`. Erase range `[l, r]` is `O(n)`. Reverse range `[l, r]` is `O(r - l)`. Range-sum is `O(r - l)` without auxiliary structures or `O(1)` with a precomputed prefix-sum — but the prefix-sum becomes invalid the moment you insert or delete, so you re-pay `O(n)` to rebuild after every mutation. Total `O(n)` per operation, `O(nq)` for `q` operations. At `n = q = 10^5` you are already over budget.

## optimal
Split and merge are the two primitives. Both keep the BST-on-index and heap-on-priority invariants and both recompute `size` after recursing.

```
split(t, k):                  # returns (L, R); L has first k elements, R the rest
    if t is None:
        return (None, None)
    push(t)                   # apply any pending lazy ops before descending
    left_size = size(t.left)
    if left_size >= k:
        L, t.left = split(t.left, k)
        pull(t)
        return (L, t)
    else:
        t.right, R = split(t.right, k - left_size - 1)
        pull(t)
        return (t, R)

merge(L, R):                  # requires every L-index < every R-index
    if L is None: return R
    if R is None: return L
    if L.priority > R.priority:
        push(L)
        L.right = merge(L.right, R)
        pull(L)
        return L
    push(R)
    R.left = merge(L, R.left)
    pull(R)
    return R
```

`pull(t)` recomputes `size(t) = 1 + size(t.left) + size(t.right)` and any aggregate. `push(t)` applies lazy operations — for reverse, it swaps children and propagates the bit to both children's pending flags. The order matters: `push` before descending, `pull` after returning. Skipping either silently corrupts the structure in ways that only show up under specific input shapes.

**Insert at index `i`** is `merge(merge(split(root, i)[0], Node(value)), split(root, i)[1])`. **Erase `[l, r]`** is `merge(L, R)` after the two-split isolation. **Reverse `[l, r]`** is the same isolation followed by toggling the middle's `rev` flag. **Range-sum** isolates the middle and reads its root's `agg`. **Move sub-array from `[l1, r1]` to position `p`** is three splits, one merge of the survivors, two merges to splice the moved chunk in at `p` — five operations, all O(log n).

**Why the expected height is O(log n).** Priorities are uniformly random and independent of the operation sequence. By the classic argument for random BSTs, expected height is `~2.99 log n + O(1)`. The probability of height exceeding `c log n` is sub-polynomial in `n` for `c > 3`, so for any realistic input the structure is height-bounded — even though *worst-case* height is technically `n`.

**Why merge cannot be `O(1) amortized` like with leftist heaps.** A leftist heap merges in `O(log n)` worst-case by walking only the rightmost spines. Treap merge does the same in expectation: at each level, the higher-priority root is kept and the recursion descends into one child. The expected depth of the descent is the height of the deeper treap, which is `O(log n)`. No way to reduce further without abandoning the heap invariant.

## complexity
- **Expected time per operation**: O(log n) for insert, erase, split, merge, range-reverse, range-sum, range-update.
- **Worst case**: O(n) — vanishingly improbable with uniform priorities; not a real concern for non-adversarial input.
- **Space**: O(n) nodes; each node carries `value`, `priority`, `size`, optionally `agg`, and a small bit-set of lazy flags (`rev`, sometimes `add`, `assign`).
- **Recursion depth**: O(log n) expected; convert to iterative for `n >= 10^6` to avoid stack overflow on adversarial inputs.

## pitfalls
- **Skipping `pull` after a split / merge** — sizes get stale, subsequent splits land on the wrong index. Wrap split and merge so `pull` cannot be forgotten.
- **Skipping `push` before descending** — a pending `reverse` flag means the children you see are *swapped*; descending without pushing chooses the wrong subtree. Symptom: reverse-range works once, then corrupts on the next operation.
- **Lazy-flag composition order** — combining a `reverse` flag with an `add v` flag requires committing to an order (does the add apply before or after the reverse?). Pick one and document it; flipping order between push and pull is the most common silent bug.
- **Comparing priorities with `>=` in merge** — ties produce two competing parents and break determinism. Always use strict `>`.
- **Using a low-quality RNG** (`rand() & 0x7FFF` on Windows gives only 15-bit priorities) — at `n = 10^5` you will see priority collisions, and the resulting tie-breaks degrade height. Use `mt19937_64` or equivalent 64-bit RNG.
- **Persistent variants forgetting to clone on the way down** — implicit-key treaps are popular as persistent ropes; if you mutate any node in place during split / merge you lose persistence and corrupt previous versions. Persistent split / merge must allocate new nodes for every visited node.

## interviewTips
- Mention implicit-key treaps when asked "how would you support insert / delete / reverse on a long array?" — the answer most candidates miss. Strong senior signal.
- Compare with **segment tree with lazy propagation**: same range-sum / range-update, but segment trees do *not* support insert / delete / reverse at arbitrary positions in `O(log n)`. Implicit treaps do.
- For collaborative-editor follow-ups, drop the words "rope" and "piece table" — implicit-key treaps are the data-structure-shaped answer to "how does Google Docs splice text in the middle?".

## code.python
```python
import random
import sys
sys.setrecursionlimit(1 << 25)

class Node:
    __slots__ = ("val", "prio", "size", "agg", "rev", "left", "right")
    def __init__(self, v):
        self.val = v
        self.prio = random.random()
        self.size = 1
        self.agg = v
        self.rev = False
        self.left = None
        self.right = None


def size(t):
    return t.size if t else 0


def agg(t):
    return t.agg if t else 0


def pull(t):
    if t is None:
        return
    t.size = 1 + size(t.left) + size(t.right)
    t.agg = agg(t.left) + t.val + agg(t.right)


def push(t):
    if t is None or not t.rev:
        return
    t.left, t.right = t.right, t.left
    if t.left:
        t.left.rev = not t.left.rev
    if t.right:
        t.right.rev = not t.right.rev
    t.rev = False


def split(t, k):
    """L contains the first k elements (0..k-1); R contains the rest."""
    if t is None:
        return (None, None)
    push(t)
    left_size = size(t.left)
    if left_size >= k:
        L, t.left = split(t.left, k)
        pull(t)
        return (L, t)
    t.right, R = split(t.right, k - left_size - 1)
    pull(t)
    return (t, R)


def merge(L, R):
    if L is None:
        return R
    if R is None:
        return L
    if L.prio > R.prio:
        push(L)
        L.right = merge(L.right, R)
        pull(L)
        return L
    push(R)
    R.left = merge(L, R.left)
    pull(R)
    return R


def insert_at(root, i, v):
    L, R = split(root, i)
    return merge(merge(L, Node(v)), R)


def erase_range(root, l, r):
    L, M = split(root, l)
    _, R = split(M, r - l + 1)
    return merge(L, R)


def reverse_range(root, l, r):
    L, M = split(root, l)
    Mid, R = split(M, r - l + 1)
    Mid.rev = not Mid.rev
    return merge(merge(L, Mid), R)


def range_sum(root, l, r):
    L, M = split(root, l)
    Mid, R = split(M, r - l + 1)
    result = Mid.agg if Mid else 0
    return result, merge(merge(L, Mid), R)


def to_list(t, out=None):
    if out is None:
        out = []
    if t is None:
        return out
    push(t)
    to_list(t.left, out)
    out.append(t.val)
    to_list(t.right, out)
    return out


if __name__ == "__main__":
    root = None
    for v in [10, 20, 30, 40, 50, 60, 70]:
        root = insert_at(root, size(root), v)
    s, root = range_sum(root, 1, 4)
    assert s == 20 + 30 + 40 + 50
    root = reverse_range(root, 1, 4)
    assert to_list(root) == [10, 50, 40, 30, 20, 60, 70]
    root = erase_range(root, 2, 3)
    assert to_list(root) == [10, 50, 20, 60, 70]
```

## code.javascript
```javascript
class Node {
  constructor(v) {
    this.val = v;
    this.prio = Math.random();
    this.size = 1;
    this.agg = v;
    this.rev = false;
    this.left = null;
    this.right = null;
  }
}

const size = t => (t ? t.size : 0);
const aggOf = t => (t ? t.agg : 0);

function pull(t) {
  if (!t) return;
  t.size = 1 + size(t.left) + size(t.right);
  t.agg = aggOf(t.left) + t.val + aggOf(t.right);
}

function push(t) {
  if (!t || !t.rev) return;
  const tmp = t.left; t.left = t.right; t.right = tmp;
  if (t.left) t.left.rev = !t.left.rev;
  if (t.right) t.right.rev = !t.right.rev;
  t.rev = false;
}

function split(t, k) {
  if (!t) return [null, null];
  push(t);
  const ls = size(t.left);
  if (ls >= k) {
    const [L, lr] = split(t.left, k);
    t.left = lr; pull(t);
    return [L, t];
  }
  const [rl, R] = split(t.right, k - ls - 1);
  t.right = rl; pull(t);
  return [t, R];
}

function merge(L, R) {
  if (!L) return R;
  if (!R) return L;
  if (L.prio > R.prio) {
    push(L);
    L.right = merge(L.right, R); pull(L);
    return L;
  }
  push(R);
  R.left = merge(L, R.left); pull(R);
  return R;
}

function insertAt(root, i, v) {
  const [L, R] = split(root, i);
  return merge(merge(L, new Node(v)), R);
}

function reverseRange(root, l, r) {
  const [L, M] = split(root, l);
  const [Mid, R] = split(M, r - l + 1);
  Mid.rev = !Mid.rev;
  return merge(merge(L, Mid), R);
}

function rangeSum(root, l, r) {
  const [L, M] = split(root, l);
  const [Mid, R] = split(M, r - l + 1);
  const s = aggOf(Mid);
  return [s, merge(merge(L, Mid), R)];
}

function toList(t, out = []) {
  if (!t) return out;
  push(t);
  toList(t.left, out);
  out.push(t.val);
  toList(t.right, out);
  return out;
}

let root = null;
for (const v of [10, 20, 30, 40, 50, 60, 70]) root = insertAt(root, size(root), v);
const [s, r2] = rangeSum(root, 1, 4); root = r2;
console.log(s); // 140
root = reverseRange(root, 1, 4);
console.log(toList(root)); // [10, 50, 40, 30, 20, 60, 70]
```

## code.java
```java
import java.util.*;

class ImplicitTreap {
    static final Random RNG = new Random();
    static class Node {
        long val, agg; double prio;
        int size; boolean rev;
        Node left, right;
        Node(long v) { val = v; agg = v; prio = RNG.nextDouble(); size = 1; }
    }

    static int size(Node t) { return t == null ? 0 : t.size; }
    static long agg(Node t) { return t == null ? 0 : t.agg; }

    static void pull(Node t) {
        if (t == null) return;
        t.size = 1 + size(t.left) + size(t.right);
        t.agg = agg(t.left) + t.val + agg(t.right);
    }

    static void push(Node t) {
        if (t == null || !t.rev) return;
        Node tmp = t.left; t.left = t.right; t.right = tmp;
        if (t.left != null) t.left.rev = !t.left.rev;
        if (t.right != null) t.right.rev = !t.right.rev;
        t.rev = false;
    }

    static Node[] split(Node t, int k) {
        if (t == null) return new Node[]{null, null};
        push(t);
        int ls = size(t.left);
        if (ls >= k) {
            Node[] s = split(t.left, k);
            t.left = s[1]; pull(t);
            return new Node[]{ s[0], t };
        }
        Node[] s = split(t.right, k - ls - 1);
        t.right = s[0]; pull(t);
        return new Node[]{ t, s[1] };
    }

    static Node merge(Node L, Node R) {
        if (L == null) return R;
        if (R == null) return L;
        if (L.prio > R.prio) {
            push(L);
            L.right = merge(L.right, R); pull(L);
            return L;
        }
        push(R);
        R.left = merge(L, R.left); pull(R);
        return R;
    }

    static Node insertAt(Node root, int i, long v) {
        Node[] s = split(root, i);
        return merge(merge(s[0], new Node(v)), s[1]);
    }

    static Node reverseRange(Node root, int l, int r) {
        Node[] a = split(root, l);
        Node[] b = split(a[1], r - l + 1);
        b[0].rev = !b[0].rev;
        return merge(merge(a[0], b[0]), b[1]);
    }

    static long[] rangeSum(Node root, int l, int r) {
        Node[] a = split(root, l);
        Node[] b = split(a[1], r - l + 1);
        long s = agg(b[0]);
        Node merged = merge(merge(a[0], b[0]), b[1]);
        return new long[]{ s, System.identityHashCode(merged) };
    }
}
```

## code.cpp
```cpp
#include <bits/stdc++.h>
using namespace std;

struct Node {
    long long val, agg;
    int size;
    uint64_t prio;
    bool rev;
    Node *left = nullptr, *right = nullptr;
    Node(long long v) : val(v), agg(v), size(1), rev(false) {
        static mt19937_64 rng{ random_device{}() };
        prio = rng();
    }
};

int sz(Node* t) { return t ? t->size : 0; }
long long ag(Node* t) { return t ? t->agg : 0; }

void pull(Node* t) {
    if (!t) return;
    t->size = 1 + sz(t->left) + sz(t->right);
    t->agg = ag(t->left) + t->val + ag(t->right);
}

void push(Node* t) {
    if (!t || !t->rev) return;
    swap(t->left, t->right);
    if (t->left) t->left->rev ^= true;
    if (t->right) t->right->rev ^= true;
    t->rev = false;
}

pair<Node*, Node*> split(Node* t, int k) {
    if (!t) return {nullptr, nullptr};
    push(t);
    int ls = sz(t->left);
    if (ls >= k) {
        auto [L, R] = split(t->left, k);
        t->left = R; pull(t);
        return {L, t};
    }
    auto [L, R] = split(t->right, k - ls - 1);
    t->right = L; pull(t);
    return {t, R};
}

Node* merge(Node* L, Node* R) {
    if (!L) return R;
    if (!R) return L;
    if (L->prio > R->prio) {
        push(L);
        L->right = merge(L->right, R); pull(L);
        return L;
    }
    push(R);
    R->left = merge(L, R->left); pull(R);
    return R;
}

Node* insert_at(Node* root, int i, long long v) {
    auto [L, R] = split(root, i);
    return merge(merge(L, new Node(v)), R);
}

Node* reverse_range(Node* root, int l, int r) {
    auto [L, M] = split(root, l);
    auto [Mid, R] = split(M, r - l + 1);
    Mid->rev ^= true;
    return merge(merge(L, Mid), R);
}

pair<long long, Node*> range_sum(Node* root, int l, int r) {
    auto [L, M] = split(root, l);
    auto [Mid, R] = split(M, r - l + 1);
    long long s = ag(Mid);
    return { s, merge(merge(L, Mid), R) };
}

void inorder(Node* t, vector<long long>& out) {
    if (!t) return;
    push(t);
    inorder(t->left, out);
    out.push_back(t->val);
    inorder(t->right, out);
}

int main() {
    Node* root = nullptr;
    for (long long v : {10, 20, 30, 40, 50, 60, 70}) root = insert_at(root, sz(root), v);
    auto [s, r2] = range_sum(root, 1, 4); root = r2;
    cout << s << '\n';                              // 140
    root = reverse_range(root, 1, 4);
    vector<long long> out;
    inorder(root, out);
    for (long long v : out) cout << v << ' ';       // 10 50 40 30 20 60 70
    cout << '\n';
}
```
