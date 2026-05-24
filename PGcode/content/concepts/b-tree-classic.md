---
slug: b-tree-classic
module: trees
title: B-Tree (Classic)
subtitle: Multi-way balanced tree that minimizes disk seeks via wide fan-out and split-on-overflow.
difficulty: Advanced
position: 34
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 18: B-Trees"
    url: "https://walkccc.me/CLRS/Chap18/18.1/"
    type: book
  - title: "Introduction of B-Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/introduction-of-b-tree-2/"
    type: blog
  - title: "TheAlgorithms/Python — b_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/trees/b_tree.py"
    type: repo
status: published
---

## intro
A B-tree of order t is a balanced search tree where every internal node holds between t-1 and 2t-1 keys (and one more child than keys). All leaves sit at the same depth. The wide fan-out — typically t in the hundreds — makes the tree very shallow, which is the whole point: when each node lives on a different disk block, the height of the tree equals the number of disk seeks per query, and we want that number to be 3 or 4 instead of 30.

## whyItMatters
Cache-oblivious binary trees do well in RAM but fall apart against disks: each pointer jump is a 10 ms seek. A B-tree replaces height-30 binary trees with height-4 wide trees by storing dozens or hundreds of keys per node, exactly one node per disk block. Every classic relational database engine before 2000 used B-trees or a B-tree variant; many filesystems still do: NTFS, HFS+, JFS, ReiserFS. Even modern systems that use B+ trees (Postgres, MySQL InnoDB) inherit the rebalancing rules from the classic B-tree.

## intuition
Read a B-tree like a multi-way ladder. Each node says "I hold k sorted keys and k+1 children. Pick the child whose key range contains your search key, recurse." Inserts always happen at the bottom; if the leaf overflows past 2t-1 keys, split the median up to the parent and recurse. Splitting is what keeps every leaf at the same depth — the tree only grows in height when the root itself splits, and that adds exactly one level.

## visualization
```
B-tree of order t=3 (each node holds 2..5 keys, 3..6 children):

                 [   30   |   60   ]
                /         |         \
       [10|20]    [40|50]    [70|80|90]

Insert 95 -> goes into the rightmost leaf, which becomes [70|80|90|95] (still ok).
Insert 100 -> leaf becomes [70|80|90|95|100], 5 keys, split:
   median 90 moves up; left split = [70|80], right split = [95|100]
Result:
                 [   30   |   60   |   90   ]
                /         |         |         \
       [10|20]    [40|50]    [70|80]    [95|100]
```

## bruteForce
A binary search tree has fan-out 2: every level doubles the node count, so a tree storing n keys is log2(n) deep. With n = 1 billion that is 30 disk seeks per query — 300 ms. Even a perfectly balanced BST cannot beat this on disk. The brute-force fix is to load the whole index into RAM, which fails as soon as the data outgrows memory. B-trees are the structural fix.

## optimal
Choose order t to match the disk block size (B): pick t so 2t-1 keys plus 2t child pointers fit in one block. Search: at each node, binary-search the keys, follow the appropriate child. Insert: descend to the leaf, insert the key. If a node along the path is already full (2t-1 keys), pre-emptively split it on the way down — that keeps the parent reachable without revisiting and avoids needing parent pointers. Delete is the dual: ensure the node you descend into has at least t keys by borrowing from a sibling or merging with one.

```
search(x, k):
    i = 0
    while i < x.n and k > x.key[i]: i++
    if i < x.n and k == x.key[i]: return (x, i)
    if x.leaf: return null
    return search(x.child[i], k)

insert(T, k):
    r = T.root
    if r.n == 2t-1:
        s = new_node(); s.leaf = false; s.child[0] = r
        split_child(s, 0); T.root = s
        insert_nonfull(s, k)
    else: insert_nonfull(r, k)
```

## complexity
time: O(log_t n) for search, insert, delete — log base t, not 2.
space: O(n) total, one block per node.
notes: For t = 256, a B-tree storing 1 billion keys has height around 4. Each operation does O(log_t n) disk seeks but O(t) work per node (binary search inside the node). Net I/O cost is what we minimize.

## pitfalls
- Confusing classic B-tree with B+ tree: classic stores data records inside internal nodes; B+ stores them only at the leaves and links leaves into a list for range scans. Most modern databases use B+.
- Picking the wrong order: too small t and the tree gets tall; too large t and node splits become expensive.
- Splitting after the fact requires parent pointers or a stack; pre-emptive top-down splitting avoids both.
- Forgetting that all leaves must end at the same depth — that invariant is the whole reason B-trees are balanced.
- Deletion edge cases: when borrowing from a sibling fails (sibling also at minimum), merge instead — that may underflow the parent and cascade.

## interviewTips
- State the design constraint first: "B-trees minimize disk seeks. Each node = one disk block. Height = seek count."
- Mention the difference between classic B-tree and B+ tree — interviewers often test whether you know B+ trees power Postgres, MySQL, and SQLite.
- Compare with hash indexes: B-trees support range scans (`WHERE x BETWEEN 10 AND 20`), hash indexes do not.
- Mention that with cache-oblivious algorithms or LSM trees, the modern world is moving past classic B-trees, but every interviewer still expects you to know how they work.

## code.python
```python
class BNode:
    def __init__(self, t, leaf):
        self.t, self.leaf = t, leaf
        self.keys = []; self.child = []

def search(x, k):
    i = 0
    while i < len(x.keys) and k > x.keys[i]: i += 1
    if i < len(x.keys) and k == x.keys[i]: return (x, i)
    if x.leaf: return None
    return search(x.child[i], k)

def split_child(x, i, t):
    y = x.child[i]
    z = BNode(t, y.leaf)
    z.keys = y.keys[t:]
    if not y.leaf:
        z.child = y.child[t:]; y.child = y.child[:t]
    mid = y.keys[t-1]
    y.keys = y.keys[:t-1]
    x.child.insert(i+1, z)
    x.keys.insert(i, mid)

def insert_nonfull(x, k, t):
    i = len(x.keys) - 1
    if x.leaf:
        while i >= 0 and k < x.keys[i]: i -= 1
        x.keys.insert(i+1, k)
    else:
        while i >= 0 and k < x.keys[i]: i -= 1
        i += 1
        if len(x.child[i].keys) == 2*t - 1:
            split_child(x, i, t)
            if k > x.keys[i]: i += 1
        insert_nonfull(x.child[i], k, t)

def insert(root, k, t):
    if len(root.keys) == 2*t - 1:
        s = BNode(t, False); s.child.append(root)
        split_child(s, 0, t); insert_nonfull(s, k, t)
        return s
    insert_nonfull(root, k, t); return root
```

## code.javascript
```javascript
class BNode {
  constructor(t, leaf) { this.t = t; this.leaf = leaf; this.keys = []; this.child = []; }
}

function search(x, k) {
  let i = 0;
  while (i < x.keys.length && k > x.keys[i]) i++;
  if (i < x.keys.length && k === x.keys[i]) return [x, i];
  if (x.leaf) return null;
  return search(x.child[i], k);
}

function splitChild(x, i, t) {
  const y = x.child[i];
  const z = new BNode(t, y.leaf);
  z.keys = y.keys.splice(t);
  const mid = y.keys.pop();
  if (!y.leaf) z.child = y.child.splice(t);
  x.child.splice(i + 1, 0, z);
  x.keys.splice(i, 0, mid);
}

function insertNonfull(x, k, t) {
  let i = x.keys.length - 1;
  if (x.leaf) {
    while (i >= 0 && k < x.keys[i]) i--;
    x.keys.splice(i + 1, 0, k);
  } else {
    while (i >= 0 && k < x.keys[i]) i--;
    i++;
    if (x.child[i].keys.length === 2 * t - 1) {
      splitChild(x, i, t);
      if (k > x.keys[i]) i++;
    }
    insertNonfull(x.child[i], k, t);
  }
}

function insert(root, k, t) {
  if (root.keys.length === 2 * t - 1) {
    const s = new BNode(t, false); s.child.push(root);
    splitChild(s, 0, t); insertNonfull(s, k, t);
    return s;
  }
  insertNonfull(root, k, t); return root;
}
```

## code.java
```java
import java.util.*;

class BNode {
    int t; boolean leaf;
    List<Integer> keys = new ArrayList<>();
    List<BNode> child = new ArrayList<>();
    BNode(int t, boolean leaf) { this.t = t; this.leaf = leaf; }
}

public class BTree {
    static void splitChild(BNode x, int i, int t) {
        BNode y = x.child.get(i);
        BNode z = new BNode(t, y.leaf);
        z.keys.addAll(y.keys.subList(t, y.keys.size()));
        int mid = y.keys.get(t - 1);
        y.keys.subList(t - 1, y.keys.size()).clear();
        if (!y.leaf) {
            z.child.addAll(y.child.subList(t, y.child.size()));
            y.child.subList(t, y.child.size()).clear();
        }
        x.child.add(i + 1, z);
        x.keys.add(i, mid);
    }

    static void insertNonfull(BNode x, int k, int t) {
        int i = x.keys.size() - 1;
        if (x.leaf) {
            while (i >= 0 && k < x.keys.get(i)) i--;
            x.keys.add(i + 1, k);
        } else {
            while (i >= 0 && k < x.keys.get(i)) i--;
            i++;
            if (x.child.get(i).keys.size() == 2 * t - 1) {
                splitChild(x, i, t);
                if (k > x.keys.get(i)) i++;
            }
            insertNonfull(x.child.get(i), k, t);
        }
    }

    public static BNode insert(BNode root, int k, int t) {
        if (root.keys.size() == 2 * t - 1) {
            BNode s = new BNode(t, false); s.child.add(root);
            splitChild(s, 0, t); insertNonfull(s, k, t);
            return s;
        }
        insertNonfull(root, k, t); return root;
    }
}
```

## code.cpp
```cpp
#include <vector>
struct BNode {
    int t; bool leaf;
    std::vector<int> keys;
    std::vector<BNode*> child;
    BNode(int t_, bool leaf_) : t(t_), leaf(leaf_) {}
};

void splitChild(BNode* x, int i, int t) {
    BNode* y = x->child[i];
    BNode* z = new BNode(t, y->leaf);
    z->keys.assign(y->keys.begin() + t, y->keys.end());
    int mid = y->keys[t - 1];
    y->keys.resize(t - 1);
    if (!y->leaf) {
        z->child.assign(y->child.begin() + t, y->child.end());
        y->child.resize(t);
    }
    x->child.insert(x->child.begin() + i + 1, z);
    x->keys.insert(x->keys.begin() + i, mid);
}

void insertNonfull(BNode* x, int k, int t) {
    int i = (int)x->keys.size() - 1;
    if (x->leaf) {
        while (i >= 0 && k < x->keys[i]) i--;
        x->keys.insert(x->keys.begin() + i + 1, k);
    } else {
        while (i >= 0 && k < x->keys[i]) i--;
        i++;
        if ((int)x->child[i]->keys.size() == 2 * t - 1) {
            splitChild(x, i, t);
            if (k > x->keys[i]) i++;
        }
        insertNonfull(x->child[i], k, t);
    }
}

BNode* insert(BNode* root, int k, int t) {
    if ((int)root->keys.size() == 2 * t - 1) {
        BNode* s = new BNode(t, false); s->child.push_back(root);
        splitChild(s, 0, t); insertNonfull(s, k, t);
        return s;
    }
    insertNonfull(root, k, t); return root;
}
```
