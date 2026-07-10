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

Geometrically the tree is short and wide, not tall and thin. Every level multiplies the reachable key count by the fan-out `b`, so a shallow stack of levels covers an enormous range. What's actually happening on a lookup is that each internal node is a signpost: it holds a handful of separator keys and one child pointer between each pair, and you binary-search those separators to pick exactly one downward pointer. Values never live in the signposts — only in the bottom row of leaves — which is why the leaves can be threaded left-to-right into a scan lane.

Work a concrete micro-example with fan-out `b = 4` (so at most 3 keys per node). Suppose the leaves already hold sorted keys and the internal row is `[10, 17]`, meaning "keys below 10 go left, keys in [10,17) go middle, keys >= 17 go right." To find 12: at the root compare 12 against 10 (not less), against 17 (less), so take the middle pointer to leaf `[10, 12]`, then a two-element scan finds 12. To answer `key >= 6`, descend once to the leaf containing 6, emit 6 and 7, then hop the sibling pointer to `[10, 12]`, emit both, hop again to `[17, 20, 30]`, emit all three — no second root descent. Now stress the shape: with `b` in the hundreds a page holds ~400 separators, so three levels index roughly 400 x 400 x 400 = 64 million keys while touching only three pages. The intuition is that fat nodes trade a tiny bit of in-page comparison work for a massive cut in the number of page fetches, which is the only cost that matters on disk.

## visualization
Order 4 (max 3 keys per node) B+ tree of inserts 10, 20, 5, 6, 12, 30, 7, 17. Final shape: root `[10, 17]` → leaf `[5, 6, 7]` ↔ leaf `[10, 12]` ↔ leaf `[17, 20, 30]`. The arrows show the leaf sibling pointers used for `SELECT WHERE key >= 6`: descend to leaf 1, scan to leaf 2 via sibling pointer, then to leaf 3 — no second descent needed.

The table below traces the tree state after each insert under a standard split convention: a leaf splits the instant it would exceed 3 keys, and the minimum key of the new right leaf is COPIED up into the root separator row. "root" is the internal separator row; "leaves" is leaf contents left-to-right.

```
step  insert  action                          root       leaves (left -> right)
----  ------  ------------------------------  ---------  ----------------------------
 1     10     leaf insert                     (none)     [10]
 2     20     leaf insert                     (none)     [10,20]
 3      5     leaf insert (kept sorted)       (none)     [5,10,20]
 4      6     [5,6,10,20] overflow -> split   [10]       [5,6] | [10,20]
              copy up 10 (min of right leaf)
 5     12     route >=10 -> right leaf        [10]       [5,6] | [10,12,20]
 6     30     [10,12,20,30] overflow ->split  [10,20]    [5,6] | [10,12] | [20,30]
              copy up 20 (min of new right)
 7      7     route <10 -> left leaf          [10,20]    [5,6,7] | [10,12] | [20,30]
 8     17     route [10,20) -> middle leaf    [10,20]    [5,6,7] | [10,12,17] | [20,30]
----  ------  ------------------------------  ---------  ----------------------------
range key>=6: descend once to [5,6,7], emit 6,7; sibling-hop to [10,12,17],
             emit all; sibling-hop to [20,30], emit all -- zero re-descents.
```

## bruteForce
Use an in-memory balanced BST (red-black, AVL). Lookups, inserts, deletes are all O(log n), but every step is a pointer chase that may miss the CPU cache and, on a disk-resident index, every step is a separate page read. For a billion-key index that is roughly 30 disk seeks per lookup — over 100 ms on spinning rust. Acceptable as a teaching reference, lethal as a database engine.

## optimal
A B+ tree of order `b` keeps every node between `ceil(b/2) - 1` and `b - 1` keys; the root is allowed to be smaller. Search descends comparing the target against routing keys via binary search inside the page. Insert finds the leaf, inserts in order, and if the leaf overflows it splits in half and pushes a copy of the new minimum into the parent — which may cascade upward, growing the tree by at most one level. Delete finds the leaf, removes the key, and rebalances by borrowing from a sibling or merging with one; underflow may cascade upward, shrinking the tree by at most one level. Range scans follow leaf sibling pointers without retouching internal nodes.

The load-bearing INVARIANT is that every leaf sits at the same depth, and every non-root node stays at least half full. Because splits only ever add a node at the level where the overflow happened and copy a single separator one level up, no leaf can drift to a different depth — the tree grows only by pushing a fresh root above the old one, uniformly lifting every leaf by one. That is exactly why height stays `O(log_b n)` no matter the insertion order; there is no adversarial sequence that unbalances it, unlike a plain BST.

WHY it's correct, step by step. Search is correct because the separator keys form a total ordering of the key space: at each node the chosen child pointer bounds the target on both sides, so the single leaf you reach is the ONLY leaf that could hold the key. Insert preserves the ordering because a split cuts a sorted node into a sorted left and sorted right half and the copied-up separator equals the right half's minimum — so the parent's "less-than / greater-or-equal" test still routes correctly. The half-full lower bound is preserved because a split of a full node (`b-1` keys plus the incoming one) yields two nodes of at least `ceil(b/2)-1` keys each. Delete mirrors this: borrowing shifts one key across a separator (and rewrites that separator), merging fuses two half-empty siblings into one legal node and drops the now-redundant separator, so the fill invariant is restored locally and any resulting parent underflow propagates the same fix upward.

The complexity intuition falls straight out of the invariant: each operation touches one node per level and there are `log_b n` levels, so the node-visit count is logarithmic in base `b`. Since `b` is set by the page size divided by key-plus-pointer size (often several hundred), the log base is huge and the height is tiny — three or four levels for a billion keys. Range scans then cost `O(log_b n)` to locate the start plus `O(k/b)` sequential leaf reads for `k` results, because each leaf page yields up to `b` results per fetch and the sibling pointers let the scan skip every internal node.

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
