---
slug: lru-cache-design
module: hashing
title: LRU Cache
subtitle: Hashmap + doubly-linked list — O(1) get and put, evict the least-recently-used entry when full.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 11: Hash Tables (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap11/"
    type: book
  - title: "cp-algorithms — String hashing & hash maps"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/hashing/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/hashing"
    type: repo
status: published
---

## intro
An **LRU (Least Recently Used) cache** holds up to K entries and evicts the one accessed longest ago when adding a new entry beyond capacity. The canonical implementation is **hashmap + doubly-linked list**:
- Hashmap gives O(1) lookup of any key.
- Doubly-linked list orders entries by recency; the head is most-recently-used, the tail is least.
- On get/put: move the node to the head. On evict: drop the tail.

## whyItMatters
LRU is one of the most-asked system-design / DSA interview questions:
- **Database buffer pools** (Postgres, MySQL InnoDB) — LRU-style page replacement.
- **CPU caches** (real ones are pseudo-LRU; true LRU is the textbook model).
- **CDN / browser caches** — `Cache-Control` + LRU eviction.
- **Memcached / Redis** with `allkeys-lru` policy.
- **Function memoization** — Python's `functools.lru_cache`.

## intuition
Two operations need O(1): "find by key" and "move to front." A hashmap gives find-by-key. A doubly-linked list gives O(1) splice (with both prev and next pointers, you can unlink in place and insert at head without traversal).

The hashmap stores `key → node`. The list stores nodes in recency order. On `get(key)`: look up node, unlink from current position, push to head. On `put(key, value)`: same, plus if at capacity, remove the tail and delete its key from the map.

## visualization
```
Capacity = 3, ops: put(1,A), put(2,B), put(3,C), get(1), put(4,D)

After put(1,A):    head ↔ [1=A] ↔ tail
After put(2,B):    head ↔ [2=B] ↔ [1=A] ↔ tail
After put(3,C):    head ↔ [3=C] ↔ [2=B] ↔ [1=A] ↔ tail

get(1):
  map[1] → node [1=A]; unlink; push to head.
  head ↔ [1=A] ↔ [3=C] ↔ [2=B] ↔ tail
  (Note: [1=A] moved from tail to head.)

put(4,D):
  Capacity full. Evict tail [2=B]; delete map[2].
  Insert [4=D] at head.
  head ↔ [4=D] ↔ [1=A] ↔ [3=C] ↔ tail
```

## bruteForce
**Array + linear search**: O(n) per get / put. Useless for n > 1000.

**Sorted by recency timestamp**: O(log n) per op (heap) but you also need to delete arbitrary entries on update — heaps don't support that natively.

**Just a hashmap with an `accessed_at` timestamp**: O(1) get but eviction requires scanning the whole map. O(n) eviction is bad if you evict frequently.

## optimal
```
class Node:
    def __init__(self, k, v):
        self.k, self.v = k, v
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                  # key -> node
        self.head = Node(0, 0)          # sentinel
        self.tail = Node(0, 0)          # sentinel
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_to_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, k):
        if k not in self.map: return -1
        node = self.map[k]
        self._remove(node)
        self._add_to_front(node)
        return node.v

    def put(self, k, v):
        if k in self.map:
            node = self.map[k]
            node.v = v
            self._remove(node)
            self._add_to_front(node)
            return
        if len(self.map) >= self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.k]
        node = Node(k, v)
        self.map[k] = node
        self._add_to_front(node)
```

**Python shortcut**: `collections.OrderedDict` does this — `od.move_to_end(k, last=False)` is the O(1) "move to front." Use it if you're allowed.

**Java shortcut**: `LinkedHashMap` with `removeEldestEntry` override.

## complexity
- **get / put**: O(1) amortized (and worst-case).
- **Space**: O(capacity) — one node + map entry per cached item.

## pitfalls
- **Sentinel head + tail**: simplify by adding dummy head/tail nodes — avoids null checks on edges.
- **Move-on-get not just put**: forgetting to update recency on `get` makes LRU degrade to FIFO.
- **Update-existing on put**: many implementations re-insert with a fresh node, leaving the old one orphaned in the list. Always remove the old node first OR mutate its value.
- **Capacity 0**: handle as "always evict" — common interview trick.
- **Thread-safety**: classic LRU is not thread-safe. Concurrent versions use lock striping or non-blocking structures (e.g., Caffeine for JVM).

## interviewTips
- For "design LRU cache" — say "hashmap + doubly-linked list, O(1) both ops" in the first sentence.
- Walk through the sentinel-head pattern explicitly — interviewers always ask why.
- For follow-up: TTL eviction (add `expires_at` per node), thread-safe version (lock striping per bucket), LFU variant (frequency + recency).
- For senior: discuss **W-TinyLFU** (Caffeine's algorithm) as the modern winner for hit-ratio, beating LRU on most real workloads.

## code.python
```python
from collections import OrderedDict
class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.od = OrderedDict()
    def get(self, k):
        if k not in self.od: return -1
        self.od.move_to_end(k, last=False)
        return self.od[k]
    def put(self, k, v):
        if k in self.od: self.od.move_to_end(k, last=False)
        elif len(self.od) >= self.cap: self.od.popitem(last=True)
        self.od[k] = v
        self.od.move_to_end(k, last=False)

c = LRUCache(2)
c.put(1, 'a'); c.put(2, 'b')
print(c.get(1))   # 'a'
c.put(3, 'c')     # evicts key 2
print(c.get(2))   # -1
```

## code.javascript
```javascript
class LRUCache {
  constructor(capacity) { this.cap = capacity; this.map = new Map(); }
  get(k) {
    if (!this.map.has(k)) return -1;
    const v = this.map.get(k);
    this.map.delete(k); this.map.set(k, v);    // move to end (most recent)
    return v;
  }
  put(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);
    this.map.set(k, v);
  }
}
```

## code.java
```java
import java.util.*;
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);     // access-order = true
        this.cap = capacity;
    }
    public int get(int k) { return getOrDefault(k, -1); }
    public void put_(int k, int v) { put(k, v); }
    protected boolean removeEldestEntry(Map.Entry<Integer,Integer> eldest) {
        return size() > cap;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <list>
class LRUCache {
    int cap;
    std::list<std::pair<int, int>> ll;
    std::unordered_map<int, std::list<std::pair<int,int>>::iterator> map;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int k) {
        auto it = map.find(k);
        if (it == map.end()) return -1;
        ll.splice(ll.begin(), ll, it->second);
        return it->second->second;
    }
    void put(int k, int v) {
        auto it = map.find(k);
        if (it != map.end()) { ll.erase(it->second); map.erase(it); }
        else if ((int)map.size() >= cap) { map.erase(ll.back().first); ll.pop_back(); }
        ll.push_front({k, v});
        map[k] = ll.begin();
    }
};
```
