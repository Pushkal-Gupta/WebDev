---
slug: skip-list
module: linked-lists
title: Skip List
subtitle: Probabilistic alternative to a balanced BST — O(log n) search/insert/delete via randomized "express lanes" over a sorted linked list.
difficulty: Advanced
position: 20
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 10 (linked lists, walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap10/"
    type: book
  - title: "GeeksforGeeks — Linked List"
    url: "https://www.geeksforgeeks.org/data-structures/linked-list/"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/linked_list/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/linked_list"
    type: repo
status: published
---

## intro
A skip list is a sorted linked list with multiple "express" levels stacked on top. Level 0 holds every node. Each higher level holds a random ~half of the level below. To find a value, walk along the top express lane until you'd overshoot, drop down a level, repeat. Expected O(log n) per operation with vastly simpler code than a self-balancing BST.

## whyItMatters
Two real-world advantages over balanced trees:
1. **Code simplicity**: no rotations, no rebalancing, no parent pointers. The implementation is short enough to write from memory.
2. **Concurrency**: lock-free skip lists exist and work well; lock-free balanced BSTs are research-grade. Used by Redis sorted sets (ZSET), LevelDB / RocksDB memtables, ConcurrentSkipListMap in Java.

Compared to hash tables, skip lists keep elements **sorted** — so range queries (`give me everything between X and Y`) are O(log n + result_size). That's why ordered KV stores reach for skip lists, not hash maps.

## intuition
A sorted linked list takes O(n) to search. Add a second linked list with half the nodes (every other one) → cuts search roughly in half. Add a third with a quarter → halves it again. Continue stacking levels until log n. Each search walks down the pyramid: rightward on a level until you'd overshoot, then drop down one level, repeat. To keep the levels balanced without an explicit rebalance step, decide each new node's height randomly: 50% level 1, 25% level 2, 12.5% level 3, etc.

## visualization
```
Level 3:   1 ─────────────────────────► ∞
Level 2:   1 ──────────► 8 ────────────► ∞
Level 1:   1 ──── 4 ────► 8 ──────► 12 ► ∞
Level 0:   1 → 4 → 6 → 8 → 10 → 12 → 14 → ∞

Searching for 10:
- Level 3: 1 → ∞? overshoot, drop down
- Level 2: 1 → 8 → ∞? overshoot back to 8, drop down
- Level 1: 8 → 12 too big, drop down
- Level 0: 8 → 10 ✓ found in 4 hops instead of 5.
```

## bruteForce
Plain sorted linked list — O(n) search. Or a sorted array with binary search — O(log n) search but O(n) insert/delete. Skip list is the sweet spot.

## optimal
**Find(key)**:
```
cur = head
for level from top down to 0:
    while cur.forward[level] and cur.forward[level].key < key:
        cur = cur.forward[level]
return cur.forward[0] if it matches key, else None
```

**Insert(key, value)**:
1. Find the node's would-be position at each level (remember the `update` pointers).
2. Decide the new node's height: keep flipping a fair coin; stop when tails. `height = number_of_heads + 1`.
3. Splice the new node into the linked list at every level it occupies.

**Delete(key)**: find the node, splice it out of every level.

**Probability tuning**: p = 0.5 is standard. p = 0.25 gives slower search but less memory. Cap the max level at `log_(1/p)(n)` (say 32) so heights don't go silly.

## complexity
- **Expected time** for search/insert/delete: O(log n).
- **Worst case**: O(n) — happens when the RNG cooperates badly. Extremely rare with reasonable n.
- **Expected space**: O(n) — each node has expected `1 / (1-p) = 2` forward pointers.
- **Range query**: O(log n + k) for k results.

## pitfalls
- **Deterministic RNG seed in tests**: a fixed seed always produces the same tower heights — fine for repeatable tests, but don't let it leak into production. Use cryptographic RNG for adversarial inputs.
- **No upper cap on level**: a node with height 1000 wastes memory and lookup time. Cap at ~32 for n up to 2^32.
- **Forgetting the head sentinel**: the head node should have max-height with forwards pointing to "infinity" sentinels. Simplifies edge cases.
- **Concurrent insert/delete races**: lock-free versions are subtle. Use Java's `ConcurrentSkipListMap` or Redis's implementation rather than rolling your own.
- **Comparing performance with hash tables for unordered lookup**: hash tables win there. Skip lists are for *sorted* lookups + range queries.

## interviewTips
- Recognize the trigger: "sorted keys, log-n ops, simpler than red-black trees" — that's a skip list.
- Mention **Redis ZSET** as the canonical real-world user.
- Compare with **balanced BST** (better worst case, harder to write) and **B-tree** (better cache locality for disk-backed structures).
- Walk through the coin-flipping height assignment — interviewers love that there's NO rebalance code.

## code.python
```python
import random

class SkipNode:
    __slots__ = ('key', 'value', 'forward')
    def __init__(self, key, value, height):
        self.key = key; self.value = value
        self.forward = [None] * height

class SkipList:
    def __init__(self, p=0.5, max_height=32):
        self.p = p; self.max_h = max_height
        self.head = SkipNode(None, None, max_height)
        self.height = 1

    def _random_height(self):
        h = 1
        while random.random() < self.p and h < self.max_h: h += 1
        return h

    def get(self, key):
        cur = self.head
        for lvl in range(self.height - 1, -1, -1):
            while cur.forward[lvl] and cur.forward[lvl].key < key:
                cur = cur.forward[lvl]
        n = cur.forward[0]
        return n.value if n and n.key == key else None

    def insert(self, key, value):
        update = [self.head] * self.max_h
        cur = self.head
        for lvl in range(self.height - 1, -1, -1):
            while cur.forward[lvl] and cur.forward[lvl].key < key:
                cur = cur.forward[lvl]
            update[lvl] = cur
        h = self._random_height()
        if h > self.height: self.height = h
        node = SkipNode(key, value, h)
        for lvl in range(h):
            node.forward[lvl] = update[lvl].forward[lvl]
            update[lvl].forward[lvl] = node

sl = SkipList()
for k, v in [(3, 'c'), (1, 'a'), (4, 'd'), (1, 'a-dup'), (5, 'e')]:
    sl.insert(k, v)
print(sl.get(4))  # 'd'
```

## code.javascript
```javascript
class SkipNode { constructor(key, value, h) { this.key = key; this.value = value; this.forward = new Array(h).fill(null); } }
class SkipList {
  constructor(p = 0.5, maxH = 32) {
    this.p = p; this.maxH = maxH; this.height = 1;
    this.head = new SkipNode(null, null, maxH);
  }
  _h() { let h = 1; while (Math.random() < this.p && h < this.maxH) h++; return h; }
  get(key) {
    let cur = this.head;
    for (let lvl = this.height - 1; lvl >= 0; lvl--) {
      while (cur.forward[lvl] && cur.forward[lvl].key < key) cur = cur.forward[lvl];
    }
    const n = cur.forward[0]; return n && n.key === key ? n.value : null;
  }
  insert(key, value) {
    const update = new Array(this.maxH).fill(this.head);
    let cur = this.head;
    for (let lvl = this.height - 1; lvl >= 0; lvl--) {
      while (cur.forward[lvl] && cur.forward[lvl].key < key) cur = cur.forward[lvl];
      update[lvl] = cur;
    }
    const h = this._h();
    if (h > this.height) this.height = h;
    const node = new SkipNode(key, value, h);
    for (let lvl = 0; lvl < h; lvl++) { node.forward[lvl] = update[lvl].forward[lvl]; update[lvl].forward[lvl] = node; }
  }
}
```

## code.java
```java
import java.util.*;
class SkipList<K extends Comparable<K>, V> {
    static class Node<K, V> { K key; V val; Node<K, V>[] fwd; @SuppressWarnings("unchecked") Node(K k, V v, int h) { key = k; val = v; fwd = (Node<K, V>[]) new Node[h]; } }
    final double p = 0.5; final int maxH = 32; int height = 1;
    final Node<K, V> head = new Node<>(null, null, maxH);
    final Random rng = new Random();
    int randomHeight() { int h = 1; while (rng.nextDouble() < p && h < maxH) h++; return h; }
    public V get(K key) {
        Node<K, V> cur = head;
        for (int lvl = height - 1; lvl >= 0; lvl--)
            while (cur.fwd[lvl] != null && cur.fwd[lvl].key.compareTo(key) < 0) cur = cur.fwd[lvl];
        Node<K, V> n = cur.fwd[0];
        return n != null && n.key.equals(key) ? n.val : null;
    }
    public void insert(K key, V val) {
        @SuppressWarnings("unchecked") Node<K, V>[] update = new Node[maxH];
        Arrays.fill(update, head);
        Node<K, V> cur = head;
        for (int lvl = height - 1; lvl >= 0; lvl--) {
            while (cur.fwd[lvl] != null && cur.fwd[lvl].key.compareTo(key) < 0) cur = cur.fwd[lvl];
            update[lvl] = cur;
        }
        int h = randomHeight(); if (h > height) height = h;
        Node<K, V> n = new Node<>(key, val, h);
        for (int lvl = 0; lvl < h; lvl++) { n.fwd[lvl] = update[lvl].fwd[lvl]; update[lvl].fwd[lvl] = n; }
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <random>
template<class K, class V>
struct SkipList {
    struct Node { K key; V val; std::vector<Node*> fwd; Node(K k, V v, int h) : key(k), val(v), fwd(h, nullptr) {} };
    int maxH = 32, height = 1; double p = 0.5;
    Node head{ K{}, V{}, maxH };
    std::mt19937 rng{ std::random_device{}() };
    int randomHeight() {
        std::uniform_real_distribution<double> d(0.0, 1.0); int h = 1;
        while (d(rng) < p && h < maxH) h++;
        return h;
    }
    V get(const K& key) {
        Node* cur = &head;
        for (int lvl = height - 1; lvl >= 0; lvl--)
            while (cur->fwd[lvl] && cur->fwd[lvl]->key < key) cur = cur->fwd[lvl];
        Node* n = cur->fwd[0];
        return (n && n->key == key) ? n->val : V{};
    }
    void insert(const K& key, V val) {
        std::vector<Node*> update(maxH, &head);
        Node* cur = &head;
        for (int lvl = height - 1; lvl >= 0; lvl--) {
            while (cur->fwd[lvl] && cur->fwd[lvl]->key < key) cur = cur->fwd[lvl];
            update[lvl] = cur;
        }
        int h = randomHeight(); if (h > height) height = h;
        Node* n = new Node(key, val, h);
        for (int lvl = 0; lvl < h; lvl++) { n->fwd[lvl] = update[lvl]->fwd[lvl]; update[lvl]->fwd[lvl] = n; }
    }
};
```
