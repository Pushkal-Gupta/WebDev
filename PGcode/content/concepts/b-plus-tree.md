---
slug: b-plus-tree
module: trees-balanced-disk
title: B+ Tree
subtitle: The disk-friendly tree behind every database index — high fan-out, leaf-linked, range-query optimal.
difficulty: Advanced
position: 30
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 18: B-Trees"
    url: "https://walkccc.me/CLRS/Chap18/18.1/"
    type: book
  - title: "Introduction of B+ Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/introduction-of-b-tree/"
    type: blog
  - title: "facebook/rocksdb — wiki on indexing structures"
    url: "https://github.com/facebook/rocksdb/wiki/Index-Block-Format"
    type: repo
status: published
---

## intro
A B+ tree is a balanced multi-way search tree where every key lives in a leaf and internal nodes carry only routing keys. Leaves are stitched into a doubly linked list so a range scan after one point lookup is just pointer-chasing. It is the index structure underneath InnoDB, PostgreSQL btree, SQL Server, and almost every B-tree-shaped file system inode index.

## whyItMatters
Disk and SSD reads are page-sized — typically 4 KB to 16 KB. A balanced binary tree wastes most of each page reading one key. A B+ tree packs hundreds of keys per page, so its height is `log_b(n)` with `b` in the hundreds: a billion-row index is only three or four levels tall. Add the leaf linked list and "WHERE created_at BETWEEN x AND y" becomes one descent plus a sequential scan, which is the dominant access pattern in OLTP workloads.

## intuition
Picture a phonebook split into chapters. The table of contents (internal nodes) tells you which chapter holds the name. Each chapter (leaf) is fully alphabetical and has a "continued on next chapter" arrow. To find every "Sm*" you descend once to the first matching chapter, then read forward across chapters until the next prefix appears. The branching factor is huge because each chapter title is tiny compared to a chapter — exactly why fan-out wins on real storage.

## visualization
Order 4 (max 3 keys per node) B+ tree of inserts 10, 20, 5, 6, 12, 30, 7, 17. Final shape: root `[10, 17]` → leaf `[5, 6, 7]` ↔ leaf `[10, 12]` ↔ leaf `[17, 20, 30]`. The arrows show the leaf sibling pointers used for `SELECT WHERE key >= 6`: descend to leaf 1, scan to leaf 2 via sibling pointer, then to leaf 3 — no second descent needed.

## bruteForce
Use an in-memory balanced BST (red-black, AVL). Lookups, inserts, deletes are all O(log n), but every step is a pointer chase that may miss the CPU cache and, on a disk-resident index, every step is a separate page read. For a billion-key index that is roughly 30 disk seeks per lookup — over 100 ms on spinning rust. Acceptable as a teaching reference, lethal as a database engine.

## optimal
A B+ tree of order `b` keeps every node between `ceil(b/2) - 1` and `b - 1` keys; the root is allowed to be smaller. Search descends comparing the target against routing keys via binary search inside the page. Insert finds the leaf, inserts in order, and if the leaf overflows it splits in half and pushes a copy of the new minimum into the parent — which may cascade upward, growing the tree by at most one level. Delete finds the leaf, removes the key, and rebalances by borrowing from a sibling or merging with one; underflow may cascade upward, shrinking the tree by at most one level. Range scans follow leaf sibling pointers without retouching internal nodes.

## complexity
time: O(log_b n) point lookup, insert, delete; O(log_b n + k/b) range scan returning k results
space: O(n) on disk; internal nodes are typically 1-2 percent of total size
notes: With page size P and key+pointer size K, fan-out b ≈ P/K. For P=8 KB and K=20 B, b ≈ 400, so a 100 M-row index is 3 levels — usually 2 are cached in RAM, giving 1 disk read per lookup.

## pitfalls
- Confusing B-tree with B+ tree: classic B-trees store values in internal nodes too, which kills range scans and complicates split logic.
- Forgetting that splits propagate upward — naive recursive insert without parent pointers needs a return-value protocol.
- Letting key size grow (long VARCHAR primary keys) — fan-out collapses, tree gets taller, every query pays.
- Re-sorting on every insert instead of using ordered insertion within the page.
- Not coalescing on delete — leaves drift toward minimum fill, wasting 50% of space.
- Treating sibling pointers as optional — without them, `ORDER BY` + `LIMIT` after a `WHERE` is dramatically slower.

## interviewTips
- Lead with the disk-page argument: "Balanced BST is O(log n) pointer chases; B+ tree turns each chase into a 16 KB page read with hundreds of keys per page."
- Sketch order-4 inserts on the whiteboard — the split visual sells the intuition fast.
- Mention the "copy up vs push up" distinction: B+ trees copy the split key up (it also stays in the leaf); plain B-trees move it.
- Know the workload trade-off: B+ trees dominate read-heavy and range-heavy workloads; LSM trees (RocksDB, Cassandra) dominate write-heavy ones.

## code.python
```python
class BPlusNode:
    def __init__(self, leaf=False):
        self.leaf = leaf
        self.keys = []
        self.children = []
        self.next = None

class BPlusTree:
    def __init__(self, order=4):
        self.order = order
        self.root = BPlusNode(leaf=True)

    def search(self, key):
        node = self.root
        while not node.leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]
        for k in node.keys:
            if k == key:
                return True
        return False

    def range_scan(self, lo, hi):
        node = self.root
        while not node.leaf:
            i = 0
            while i < len(node.keys) and lo >= node.keys[i]:
                i += 1
            node = node.children[i]
        out = []
        while node:
            for k in node.keys:
                if lo <= k <= hi:
                    out.append(k)
                elif k > hi:
                    return out
            node = node.next
        return out

    def insert(self, key):
        root = self.root
        if len(root.keys) == self.order - 1:
            new_root = BPlusNode(leaf=False)
            new_root.children.append(self.root)
            self._split_child(new_root, 0)
            self.root = new_root
        self._insert_nonfull(self.root, key)

    def _insert_nonfull(self, node, key):
        if node.leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            node.keys.insert(i, key)
            return
        i = 0
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1
        if len(node.children[i].keys) == self.order - 1:
            self._split_child(node, i)
            if key >= node.keys[i]:
                i += 1
        self._insert_nonfull(node.children[i], key)

    def _split_child(self, parent, idx):
        order = self.order
        child = parent.children[idx]
        mid = order // 2
        sibling = BPlusNode(leaf=child.leaf)
        if child.leaf:
            sibling.keys = child.keys[mid:]
            child.keys = child.keys[:mid]
            sibling.next = child.next
            child.next = sibling
            parent.keys.insert(idx, sibling.keys[0])
        else:
            sibling.keys = child.keys[mid+1:]
            sibling.children = child.children[mid+1:]
            promote = child.keys[mid]
            child.keys = child.keys[:mid]
            child.children = child.children[:mid+1]
            parent.keys.insert(idx, promote)
        parent.children.insert(idx + 1, sibling)
```

## code.javascript
```javascript
class BPlusNode {
  constructor(leaf = false) {
    this.leaf = leaf;
    this.keys = [];
    this.children = [];
    this.next = null;
  }
}

class BPlusTree {
  constructor(order = 4) {
    this.order = order;
    this.root = new BPlusNode(true);
  }

  search(key) {
    let node = this.root;
    while (!node.leaf) {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) i++;
      node = node.children[i];
    }
    return node.keys.includes(key);
  }

  rangeScan(lo, hi) {
    let node = this.root;
    while (!node.leaf) {
      let i = 0;
      while (i < node.keys.length && lo >= node.keys[i]) i++;
      node = node.children[i];
    }
    const out = [];
    while (node) {
      for (const k of node.keys) {
        if (k > hi) return out;
        if (k >= lo) out.push(k);
      }
      node = node.next;
    }
    return out;
  }
}
```

## code.java
```java
class BPlusNode {
    boolean leaf;
    List<Integer> keys = new ArrayList<>();
    List<BPlusNode> children = new ArrayList<>();
    BPlusNode next;
    BPlusNode(boolean leaf) { this.leaf = leaf; }
}

class BPlusTree {
    final int order;
    BPlusNode root = new BPlusNode(true);
    BPlusTree(int order) { this.order = order; }

    boolean search(int key) {
        BPlusNode node = root;
        while (!node.leaf) {
            int i = 0;
            while (i < node.keys.size() && key >= node.keys.get(i)) i++;
            node = node.children.get(i);
        }
        return node.keys.contains(key);
    }

    List<Integer> rangeScan(int lo, int hi) {
        BPlusNode node = root;
        while (!node.leaf) {
            int i = 0;
            while (i < node.keys.size() && lo >= node.keys.get(i)) i++;
            node = node.children.get(i);
        }
        List<Integer> out = new ArrayList<>();
        while (node != null) {
            for (int k : node.keys) {
                if (k > hi) return out;
                if (k >= lo) out.add(k);
            }
            node = node.next;
        }
        return out;
    }
}
```

## code.cpp
```cpp
struct BPlusNode {
    bool leaf;
    std::vector<int> keys;
    std::vector<BPlusNode*> children;
    BPlusNode* next = nullptr;
    BPlusNode(bool l) : leaf(l) {}
};

class BPlusTree {
public:
    BPlusTree(int order) : order_(order), root_(new BPlusNode(true)) {}

    bool search(int key) {
        BPlusNode* node = root_;
        while (!node->leaf) {
            int i = 0;
            while (i < (int)node->keys.size() && key >= node->keys[i]) ++i;
            node = node->children[i];
        }
        for (int k : node->keys) if (k == key) return true;
        return false;
    }

    std::vector<int> rangeScan(int lo, int hi) {
        BPlusNode* node = root_;
        while (!node->leaf) {
            int i = 0;
            while (i < (int)node->keys.size() && lo >= node->keys[i]) ++i;
            node = node->children[i];
        }
        std::vector<int> out;
        while (node) {
            for (int k : node->keys) {
                if (k > hi) return out;
                if (k >= lo) out.push_back(k);
            }
            node = node->next;
        }
        return out;
    }

private:
    int order_;
    BPlusNode* root_;
};
```
