---
slug: bplus-tree-internals
module: sd-storage
title: B+ Tree Internals
subtitle: Internal vs leaf nodes, fan-out math, splits and redistributes, the leaf-linked list that makes range scans free.
difficulty: Advanced
position: 221
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "Wikipedia — B+ tree (structure, fan-out, leaf linked list)"
    url: "https://en.wikipedia.org/wiki/B%2B_tree"
    type: blog
  - title: "PostgreSQL Docs — Page Layout (8KB pages, item ids, indexes)"
    url: "https://www.postgresql.org/docs/current/storage-page-layout.html"
    type: book
  - title: "RocksDB Wiki — Compaction (contrast with B-tree storage)"
    url: "https://github.com/facebook/rocksdb/wiki/Compaction"
    type: repo
status: published
---

## intro
The B+ tree is the index for nearly every relational database in production — PostgreSQL, MySQL InnoDB, SQLite, SQL Server, Oracle. It's not the same shape as the textbook B-tree. Values live only at leaves; internal nodes carry only routing keys; the leaves form a doubly-linked list. This page covers the internal vs leaf node split, the fan-out math that puts billion-row lookups in 4 disk reads, and the redistribute-before-split heuristic that real implementations use to delay structural change.

## whyItMatters
A B+ tree's leaf-linked list is what makes `SELECT * FROM orders WHERE created_at BETWEEN x AND y` cheap. A classic B-tree (values in every node) would force an in-order traversal across internal nodes; the B+ tree just descends once and walks the leaf list. That single design choice is why range scans on indexed columns cost roughly `O(matching rows / page size)` instead of `O(log n × matching rows)`. Every interview that touches "why does this query plan use a sequential scan instead of the index," "why does MySQL prefer a clustered index," or "what does the planner do with a BETWEEN" lands here.

## intuition
Picture a phone book that's been shredded into fixed-size pages — 8 KB each in Postgres, 16 KB in InnoDB. Inside each page are sorted entries. Now you need a way to find the right page in O(few-hops) without scanning every page. Build a routing tree above the leaves: each internal node holds a sorted list of `(separator_key, child_page_pointer)` pairs. A separator key like `"M"` means "anything ≥ M goes right of this pointer." With 8 KB pages and 16-byte routing entries, each internal node fans out to ~500 children. Three levels of fan-out 500 = 125 million leaves. Four levels = 62 billion.

The B+ tree differs from a textbook B-tree on three counts. **Values live only at leaves.** Internal nodes carry only routing keys (no payloads), so they pack more fan-out per page and stay cache-resident. **Leaves form a linked list.** Each leaf points to the next leaf (and usually the previous), so an ordered scan after a single descent is `O(matching pages)`. **Internal separator keys can be duplicated at leaves.** A separator `"M"` in an internal node may also appear as a real key at a leaf — the internal node doesn't carry a payload, just the routing bound.

Inserts walk from root to leaf, place the new key in sorted position in the target leaf, and if the leaf is full, split it: half the keys move to a new leaf, the median key is pushed up to the parent as a new separator. If the parent overflows, recurse. The root only splits when every node down the path was full — which means the tree grows by exactly one level at a time, always from the root, and every leaf stays at the same depth. Deletes mirror: remove the key, and if the leaf underflows (below half-full), either redistribute keys from a sibling or merge with a sibling and pull the parent's separator down.

Why not a red-black tree on disk? Two reasons. **Fan-out**: an RB tree's binary branching gives `log_2(1B) ≈ 30` hops; B+ tree's 500-way fan-out gives `log_500(1B) ≈ 4`. **Page locality**: RB tree rotations move single nodes; B+ tree splits move half a page. On disk, where reading 8 KB costs the same as reading 8 bytes (one seek dominates), packing many keys per node is the only sane choice.

## visualization
```
B+ tree of order 4 (max 4 children per internal, max 3 keys per leaf):

                    [   M   |   T   ]            <- internal: routing only
                   /        |         \
            [E | I]      [O | R]      [V | X]    <- internal
            / | \         / | \         / | \
        [A,B,C,D]    [F,G,H]   [I,J,L] [O,N] [Q,P,R] [U,T] [V,W] [Y,Z]
            ^           ^         ^      ^      ^      ^      ^     ^
            +--- next --+---next--+---next+---next+---next-+---next-+
            (leaf-level doubly-linked list)

Range scan: WHERE k BETWEEN G AND R
  1. Descend root -> [E|I] -> leaf [F,G,H].
  2. Start emitting G, H.
  3. Follow leaf->next to [I,J,L], emit I,J,L.
  4. ... continue until leaf containing R; stop.
  Cost: 1 descent + O(matching_pages) sequential reads.

Split: insert K into a full leaf [I, J, L]
  Leaf [I,J,L,K] sorted = [I,J,K,L]; split at median:
    left leaf  -> [I, J]
    right leaf -> [K, L]
    push K (median) up to parent as a new separator.
  Parent gets a new entry; if parent overflows, recurse.
```

## bruteForce
Sorted array of `(key, page_pointer)` pairs at the top, leaf pages at the bottom. Lookups: binary search the array (`O(log n)` comparisons). Inserts: shift the array (`O(n)`). Fine for read-only data; catastrophic for OLTP. B+ tree replaces the flat array with a balanced tree of pages so inserts touch only `O(log n)` pages.

## optimal
A real B+ tree has nine moving parts.

**Page format.** Each page is `header + sorted slot array + free space + tuple data`. Header carries level (0 = leaf), entry count, next/prev sibling pointers, page LSN (for crash recovery; see WAL deep-dive). Slot array holds `(key, offset)` or `(key, child_page_id)`. Postgres calls these line pointers; InnoDB calls them records. Either way, the slot array is sorted by key, which lets binary search inside a page.

**Fan-out.** With 8 KB pages, ~20-byte routing entries (key + page_id + slot overhead), internal nodes fan out to ~400. With 30-byte tuples, leaves hold ~250 entries. Tree height for 1 billion rows: `ceil(log_400(1B)) ≈ 4`. Lookup: 4 page reads, 3 of which are typically cached.

**Search.** Descend from root: at each internal node, binary-search separator keys, follow the matching child pointer. At the leaf, binary-search again, return the tuple (or its tid pointing into the heap).

**Insert.** Descend to the target leaf. Insert into sorted position. If page has space: done. If full: **try redistribute first** — if the left or right sibling has spare slots, move a key (and update the parent separator). Only split if both siblings are full. Splits move half the keys to a fresh page and push the median up. Postgres's `_bt_insertonpg` does exactly this.

**Delete.** Locate, remove. If leaf is at least half-full: done. Otherwise redistribute from a sibling, or merge with a sibling and remove the parent separator. Real systems often defer this — Postgres marks dead tuples and lets VACUUM reclaim space + pages later, because aggressive merging fights concurrent readers.

**Range scan.** Descend once to the start key's leaf. Walk the next-pointer list, emitting tuples until the end key. No re-descents. This is the design's superpower.

**Concurrency.** Two strategies: latch coupling (lock parent, descend to child, release parent — classic) and B-link trees (Lehman & Yao 1981 — each node has a right-pointer to a successor, so concurrent inserts that split a node don't block searchers). Postgres uses a B-link variant; InnoDB uses page-level latching with optimistic descent.

**Clustered vs secondary.** InnoDB's primary key index is **clustered** — the leaves hold the actual row data, not pointers. Secondary indexes' leaves hold the primary key, which then requires a second lookup. Postgres is the opposite — every index is secondary; the heap is separate. Clustered wins on primary-key range scans; loses on secondary-index updates (a key change rewrites the heap row's location, invalidating every secondary index that pointed at it).

**Why not RB-tree.** Binary branching on disk wastes seeks. RB rotations break page locality. The B+ tree's high fan-out and sequential leaf walk are both impossible on a binary tree.

The interview line: "B+ tree because the leaves hold the data and form a linked list — point lookups in `log_B(n)` page reads, range scans in `O(matching pages)` after one descent."

## complexity
Search: O(log_B n) page reads, where B = fan-out (typically 300-500). For 1B keys with B=400, height ≈ 4.
Insert: O(log_B n) page reads + amortized O(1) splits per insert (splits cascade up O(log_B n) only when every node on the path is full, which happens once per ~B inserts at the bottom level).
Delete: same as insert; merges cascade similarly.
Range scan: O(log_B n) descent + O(matching_pages) sequential reads.
Space: each leaf is ~70% full on average after random workloads (between split-to-50% and full-100%). Internal nodes similar.

## pitfalls
- **Forgetting clustered-vs-secondary trade.** InnoDB clustered means secondary-index lookups cost two B+ tree descents (secondary → primary key → heap). A wide secondary index over a clustered table is doubly expensive on hot updates.
- **Random-insert key distribution.** Inserting random UUIDs as a primary key scatters writes across the entire B+ tree, causing every page to dirty and every split to fragment. Use a sequential key (autoincrement, time-prefixed UUID, ULID) for the clustered key — fills pages left-to-right, splits only the rightmost leaf.
- **Index bloat from non-HOT updates.** Every UPDATE that touches an indexed column writes to every index. A wide table with 12 indexes under hot-row churn bloats indexes faster than the heap. Schedule REINDEX or use `pg_repack`.
- **Range scan on the wrong index.** If a query filters on `created_at` but the index is on `(user_id, created_at)`, the optimizer can't seek directly to a `created_at` range — it would need an index on `(created_at)` alone. Composite-index column order matters; design for the most selective leading column.
- **Latch contention on the root.** Every descent reads the root. On heavy concurrent writes, root-page latch contention caps scalability. Modern engines (Postgres B-link, InnoDB optimistic) work around this; old engines didn't.

## interviewTips
- For "index design" — lead with "B+ tree because of the leaf-linked list: descent costs log_B(n), and range scans then walk the leaf list at O(matching pages)."
- When asked why not an RB tree on disk — "Binary fan-out gives ~30 hops at 1B keys vs 4 for a 500-way B+ tree, and rotations destroy page locality."
- For senior depth: name the clustered-vs-secondary trade, and mention that real systems redistribute before they split to reduce structural change.

## code.python
```python
# Minimal B+ tree (insert + lookup + range scan via leaf linked list).
import bisect

class Node:
    __slots__ = ("keys", "children", "is_leaf", "next", "values")
    def __init__(self, is_leaf=False):
        self.keys = []
        self.children = []      # internal: child Nodes
        self.values = []        # leaf: parallel to keys
        self.is_leaf = is_leaf
        self.next = None        # leaf-level linked list

class BPlusTree:
    def __init__(self, order=4):
        self.root = Node(is_leaf=True)
        self.order = order      # max keys per node

    def find_leaf(self, key):
        node = self.root
        while not node.is_leaf:
            i = bisect.bisect_right(node.keys, key)
            node = node.children[i]
        return node

    def get(self, key):
        leaf = self.find_leaf(key)
        i = bisect.bisect_left(leaf.keys, key)
        if i < len(leaf.keys) and leaf.keys[i] == key: return leaf.values[i]
        return None

    def range_scan(self, lo, hi):
        leaf = self.find_leaf(lo)
        i = bisect.bisect_left(leaf.keys, lo)
        out = []
        while leaf is not None:
            while i < len(leaf.keys) and leaf.keys[i] <= hi:
                out.append((leaf.keys[i], leaf.values[i])); i += 1
            if i < len(leaf.keys): break
            leaf = leaf.next; i = 0
        return out

    def put(self, key, value):
        root = self.root
        if len(root.keys) == self.order:
            new_root = Node(is_leaf=False)
            new_root.children.append(self.root)
            self._split_child(new_root, 0)
            self.root = new_root
        self._insert_nonfull(self.root, key, value)

    def _insert_nonfull(self, node, key, value):
        if node.is_leaf:
            i = bisect.bisect_left(node.keys, key)
            if i < len(node.keys) and node.keys[i] == key:
                node.values[i] = value; return
            node.keys.insert(i, key); node.values.insert(i, value)
        else:
            i = bisect.bisect_right(node.keys, key)
            if len(node.children[i].keys) == self.order:
                self._split_child(node, i)
                if key > node.keys[i]: i += 1
            self._insert_nonfull(node.children[i], key, value)

    def _split_child(self, parent, idx):
        full = parent.children[idx]
        mid = len(full.keys) // 2
        right = Node(is_leaf=full.is_leaf)
        if full.is_leaf:
            right.keys = full.keys[mid:]; right.values = full.values[mid:]
            full.keys = full.keys[:mid]; full.values = full.values[:mid]
            right.next = full.next; full.next = right
            parent.keys.insert(idx, right.keys[0])
        else:
            right.keys = full.keys[mid+1:]; right.children = full.children[mid+1:]
            promoted = full.keys[mid]
            full.keys = full.keys[:mid]; full.children = full.children[:mid+1]
            parent.keys.insert(idx, promoted)
        parent.children.insert(idx + 1, right)
```

## code.javascript
```javascript
// Same shape as the Python sketch; range scan walks leaf.next.
class BPlusTree {
  constructor(order = 4) {
    this.order = order;
    this.root = { keys: [], values: [], children: [], isLeaf: true, next: null };
  }
  findLeaf(key) {
    let n = this.root;
    while (!n.isLeaf) {
      let i = 0;
      while (i < n.keys.length && key >= n.keys[i]) i++;
      n = n.children[i];
    }
    return n;
  }
  get(key) {
    const leaf = this.findLeaf(key);
    const i = leaf.keys.indexOf(key);
    return i === -1 ? null : leaf.values[i];
  }
  *rangeScan(lo, hi) {
    let leaf = this.findLeaf(lo);
    while (leaf) {
      for (let i = 0; i < leaf.keys.length; i++) {
        if (leaf.keys[i] < lo) continue;
        if (leaf.keys[i] > hi) return;
        yield [leaf.keys[i], leaf.values[i]];
      }
      leaf = leaf.next;
    }
  }
  // put + split omitted for brevity; mirror the Python sketch.
}
```

## code.java
```java
// Production: use a built-in TreeMap (in-memory) or rely on the DB's B+tree
// index. Sketch shape:
// class BPlusTree<K extends Comparable<K>, V> {
//     static class Node<K,V> { boolean leaf; List<K> keys; List<Node<K,V>> kids;
//                               List<V> vals; Node<K,V> next; }
//     Node<K,V> root; int order;
//     V get(K key) { Node<K,V> n = findLeaf(key); int i = Collections.binarySearch(n.keys, key);
//                    return i >= 0 ? n.vals.get(i) : null; }
// }
```

## code.cpp
```cpp
// Production: use the DB engine's B+tree (InnoDB, RocksDB-on-B-tree).
// In-memory: std::map (red-black) or a hand-rolled B+tree.
// template<class K, class V> struct Node {
//   bool leaf; std::vector<K> keys; std::vector<Node*> kids;
//   std::vector<V> vals; Node* next = nullptr;
// };
```
