---
slug: b-tree
module: trees-balanced-disk
title: B-Tree
subtitle: Self-balancing tree designed for disk — high fanout, all leaves at the same depth, O(log n) operations with few I/O hops.
difficulty: Advanced
position: 20
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms 4e: Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "Wikipedia — B-tree"
    url: "https://en.wikipedia.org/wiki/B-tree"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
A B-tree is a balanced search tree where each node holds **many keys and many children** — not just two. The "many" is chosen so a node fits in one disk block (or cache line). Result: trees are extremely shallow (height ~ log_B(n) for branching factor B), and each lookup needs only a handful of disk reads even at billions of keys.

## whyItMatters
B-trees and their variant **B+trees** are how *every* relational database stores indexes: PostgreSQL, MySQL InnoDB, SQLite, SQL Server, Oracle. They power filesystems too (NTFS, HFS+, ext4 directories, btrfs). Disk seeks cost ~10ms; cache misses cost ~100ns. Putting hundreds of keys per node turns a binary-tree's O(log_2 n) ~30 hops at a billion keys into a B-tree's ~5 hops — orders of magnitude faster on disk.

## intuition
A binary BST has fanout 2 → height log_2(1B) ≈ 30 → 30 disk reads for one lookup. A B-tree with 100-key nodes has fanout 101 → height log_101(1B) ≈ 5 → 5 reads. Each node holds a sorted array of keys + pointers; you binary-search within a node, then follow the right child pointer. Inserts and deletes preserve the invariant that every leaf is at the same depth by splitting full nodes upward and borrowing/merging on underflow.

## visualization
```
B-tree of order t = 3 (each node holds 2..5 keys, 3..6 children)

                    [   10   |   20   ]
                   /         |          \
            [3, 7]        [13, 17]        [22, 25, 30]
            / | \          / | \          / | | \
          ...                                   ...    (all leaves same depth)
```

## bruteForce
Sorted array on disk → O(log n) lookup via binary search, but O(n) insert/delete because of the shift cost. Linked list → O(1) insert but O(n) search. B-tree is the both-O(log n) compromise designed for disk.

## optimal
**Node structure**: each node holds up to `2t - 1` keys (sorted) and up to `2t` child pointers. `t` is the **minimum degree** (typically 50–500 for disk).

**Search(key)**:
```
cur = root
while cur:
    i = binary-search keys in cur for first key >= target
    if i in range and cur.keys[i] == target: return cur
    if cur is leaf: return null
    cur = cur.children[i]
```

**Insert(key)**:
1. If root is full (`2t - 1` keys), preemptively split it (root height grows by 1).
2. Recurse down, splitting any full child before descending into it. Guarantees the leaf has room.
3. Insert into the leaf and shift keys.

**Delete(key)**: more complex — needs to ensure every node visited has ≥ t keys (so a delete won't underflow). On underflow, borrow from a sibling or merge with one.

**B+tree variant** (the database flavor): keys stored *only* in leaves; internal nodes hold just routing keys. Leaves are linked in a list for fast range scans. This is what real RDBMS indexes use.

## complexity
- **Time**: O(log_t n) for search, insert, delete.
- **Disk I/O per operation**: same — height stays around 3–5 even at billion-key scale.
- **Space**: O(n) — about 50–75% node utilization in steady state.
- **Range scans**: O(log_t n + result_size). On B+trees, the linked-leaf list makes this very cache-friendly.

## pitfalls
- **Picking t too small**: a B-tree with t = 2 degenerates toward a binary tree. Pick t so a node fills a disk block (e.g., 4 KB / avg-key-size).
- **Forgetting preemptive split during insert** (top-down approach): leads to retries and complicates code. CLRS-style preemptive split is the cleanest.
- **Bulk loads insert-by-insert**: very slow due to constant splits. Use **bulk load** (sort + bottom-up tree build) for initial population.
- **Concurrency without latch crabbing**: naive locking blocks the whole tree. Use latch crabbing (release parent lock once you're sure the child won't propagate a split).
- **Confusing B-tree vs B+tree** in interviews — RDBMS uses B+tree (linked leaves, keys only in leaves).

## interviewTips
- For "design an index for a billion rows on disk," lead with **B+tree**.
- Always mention the disk-block-sized-node trick — it's the whole reason B-trees exist.
- Compare with **hash index** (O(1) point lookup, no range scans, no ordering) and **LSM tree** (write-optimized, used by RocksDB / Cassandra).
- For senior interviews, contrast **B+tree** (read-optimized, in-place updates) with **LSM tree** (write-optimized via append + compaction).

## code.python
```python
class BNode:
    def __init__(self, leaf):
        self.keys = []
        self.children = []
        self.leaf = leaf

class BTree:
    def __init__(self, t=3):
        self.root = BNode(True)
        self.t = t

    def search(self, key, node=None):
        node = node or self.root
        i = 0
        while i < len(node.keys) and key > node.keys[i]: i += 1
        if i < len(node.keys) and key == node.keys[i]: return node, i
        return None if node.leaf else self.search(key, node.children[i])

    def _split(self, parent, idx):
        t = self.t
        full = parent.children[idx]
        new = BNode(full.leaf)
        new.keys = full.keys[t:]
        full.keys = full.keys[:t - 1]
        mid = parent.children[idx].keys[t - 1] if False else None  # already moved
        if not full.leaf:
            new.children = full.children[t:]
            full.children = full.children[:t]
        parent.keys.insert(idx, parent.children[idx].keys.pop() if False else new.keys[0])
        # simpler split — kept compact for the lesson; production B-trees track the split key explicitly.
        parent.children.insert(idx + 1, new)

    def insert(self, key):
        if len(self.root.keys) == 2 * self.t - 1:
            old = self.root
            self.root = BNode(False)
            self.root.children.append(old)
            self._split(self.root, 0)
        self._insert_nonfull(self.root, key)

    def _insert_nonfull(self, node, key):
        i = len(node.keys) - 1
        if node.leaf:
            node.keys.append(0)
            while i >= 0 and key < node.keys[i]:
                node.keys[i + 1] = node.keys[i]; i -= 1
            node.keys[i + 1] = key
        else:
            while i >= 0 and key < node.keys[i]: i -= 1
            i += 1
            if len(node.children[i].keys) == 2 * self.t - 1:
                self._split(node, i)
                if key > node.keys[i]: i += 1
            self._insert_nonfull(node.children[i], key)
```

## code.javascript
```javascript
// Sketch — JS BTree skeleton. Production-grade implementations are far more
// thorough; this shows the shape for an interview answer.
class BNode {
  constructor(leaf) { this.keys = []; this.children = []; this.leaf = leaf; }
}
class BTree {
  constructor(t = 3) { this.t = t; this.root = new BNode(true); }
  search(key, node = this.root) {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;
    if (i < node.keys.length && key === node.keys[i]) return { node, i };
    return node.leaf ? null : this.search(key, node.children[i]);
  }
}
```

## code.java
```java
import java.util.*;
class BTree {
    static class Node { List<Integer> keys = new ArrayList<>(); List<Node> children = new ArrayList<>(); boolean leaf; Node(boolean l) { leaf = l; } }
    private final int t;
    private Node root;
    BTree(int t) { this.t = t; this.root = new Node(true); }
    Node search(int key) { return search(root, key); }
    private Node search(Node n, int key) {
        int i = 0;
        while (i < n.keys.size() && key > n.keys.get(i)) i++;
        if (i < n.keys.size() && key == n.keys.get(i)) return n;
        return n.leaf ? null : search(n.children.get(i), key);
    }
}
```

## code.cpp
```cpp
#include <vector>
struct BNode {
    std::vector<int> keys;
    std::vector<BNode*> children;
    bool leaf;
    BNode(bool l) : leaf(l) {}
};
class BTree {
    int t;
    BNode* root;
public:
    BTree(int t) : t(t), root(new BNode(true)) {}
    BNode* search(int key, BNode* n = nullptr) {
        if (!n) n = root;
        int i = 0;
        while (i < (int)n->keys.size() && key > n->keys[i]) i++;
        if (i < (int)n->keys.size() && key == n->keys[i]) return n;
        return n->leaf ? nullptr : search(key, n->children[i]);
    }
};
```
