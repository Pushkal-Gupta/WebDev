---
slug: lru-cache
module: hashing
title: LRU Cache
subtitle: Fixed-capacity cache that evicts the least-recently-used entry — O(1) get and put via hash map + doubly linked list.
difficulty: Intermediate
position: 15
estimatedReadMinutes: 6
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
An LRU (Least Recently Used) cache holds up to N items, returning them on demand and evicting the entry that hasn't been touched longest when full. To get all of `get`, `put`, and `evict` in O(1), combine a hash map (for fast lookup by key) with a doubly linked list (for fast move-to-front + remove-from-tail).

## whyItMatters
- **Linux page cache, BSD's buffer cache**, and every OS textbook (Tanenbaum, Silberschatz) describe LRU as the canonical page-replacement policy — though real kernels approximate with LRU-2 or CLOCK variants because true LRU per-page tracking is too expensive.
- **Redis** ships `allkeys-lru` and `volatile-lru` eviction policies; **Memcached** uses an LRU per slab class; **Varnish, NGINX, Cloudflare** all evict cached responses via LRU when memory fills.
- **Java's `LinkedHashMap(capacity, loadFactor, accessOrder=true)`** is a built-in LRU; **Guava Cache, Caffeine, and Ehcache** are production-grade Java LRUs with sharding for concurrency; **lru-cache** (npm) and Python's `functools.lru_cache` and `cachetools.LRUCache` ship the same in their ecosystems.
- **LeetCode 146 (LRU Cache)** is one of the top 5 most-asked interview problems globally; **LeetCode 460 (LFU)** and **LeetCode 432 (All O(1)`)** are direct follow-ups. Designing one in 30 minutes is table stakes for any senior backend interview.

## intuition
A cache with a size cap needs to answer two questions on every operation: "do I have this key?" (lookup) and "if I am full and need room, which entry should I drop?" (eviction). LRU's answer to the second question is **drop the entry that hasn't been touched longest**, on the empirical observation that recently-used items are most likely to be used again soon (temporal locality, the same observation that justifies CPU caches and OS page caches).

The naive implementation stores a `(key -> value, timestamp)` map and on eviction scans every entry to find the smallest timestamp. `get` and `put` are O(1) and O(n) respectively — the O(n) eviction is fatal at production scale. The classical trick is to **combine two data structures, each O(1) for its operation**:

- A **hash map** `key -> node` gives O(1) lookup.
- A **doubly linked list** ordered by recency (most recently used at head, least recently used at tail) gives O(1) move-to-front and O(1) remove-from-tail.

Every `get(key)`: look up the node in the hash map (O(1)), detach the node from its current list position (O(1) because doubly linked), insert at the head (O(1)), return the value. Every `put(key, value)`: if key exists, update value and move to head; if not and at capacity, drop the tail node and delete its hash entry (O(1)), insert a new node at the head (O(1)). The dual-structure invariant — every key in the map points to a list node, every list node's key is in the map — must be maintained on every operation; sentinel head and tail nodes eliminate the null-pointer corner cases.

The deeper lesson: when one data structure cannot give O(1) for every operation you need, **augment it with another structure that fills the gap**. This is the same trick LFU uses (hash + bucket list), what FIFO+LRU hybrids like ARC use, and what Caffeine's W-TinyLFU uses for admission control.

## visualization
```
Capacity = 3.

put(1, "a")  →  [1=a]                                      head ↔ ... ↔ tail
put(2, "b")  →  [2=b, 1=a]
put(3, "c")  →  [3=c, 2=b, 1=a]
get(1)       →  "a"; touch → [1=a, 3=c, 2=b]
put(4, "d")  →  full → evict tail (2=b); insert 4=d at head
                   →  [4=d, 1=a, 3=c]
get(2)       →  -1 (evicted)
```

## bruteForce
Store entries in a hash map with a timestamp. On every `get` / `put`, update timestamp. On `put` to a full cache, scan all entries to find the smallest timestamp and evict. `get` and `put` are O(1) and O(n) respectively. Works but the O(n) evict is the bottleneck.

## optimal
The canonical structure is **hash map + doubly linked list with sentinel head/tail nodes**. Both `get` and `put` are O(1), space is O(capacity). The hash map maps `key -> Node*`; each `Node` carries `(key, value, prev, next)`; sentinel head/tail nodes eliminate every null-pointer check in detach/insert. This is the LeetCode 146 reference solution and the structure every production LRU (Guava, Caffeine, Redis's `lru_clock` variant) approximates.

```python
class Node:
    __slots__ = ('key', 'value', 'prev', 'next')
    def __init__(self, key, value):
        self.key, self.value = key, value
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map: dict[int, Node] = {}
        # Sentinel nodes: head.next is MRU, tail.prev is LRU.
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _detach(self, n: Node) -> None:
        n.prev.next = n.next
        n.next.prev = n.prev

    def _push_front(self, n: Node) -> None:
        n.prev = self.head
        n.next = self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key: int) -> int:
        n = self.map.get(key)
        if n is None:
            return -1
        self._detach(n); self._push_front(n)    # mark as MRU
        return n.value

    def put(self, key: int, value: int) -> None:
        n = self.map.get(key)
        if n is not None:
            n.value = value
            self._detach(n); self._push_front(n)
            return
        if len(self.map) == self.cap:
            lru = self.tail.prev                  # evict LRU
            self._detach(lru)
            del self.map[lru.key]
        n = Node(key, value)
        self.map[key] = n
        self._push_front(n)
```

Why this is right: it achieves O(1) for both operations (the asymptotic lower bound — you must at least hash-lookup the key), keeps memory O(capacity), and the sentinel-node trick reduces every detach/insert to four pointer writes with no conditionals. JavaScript's `Map` preserves insertion order, so a simpler `delete-then-set` idiom works there without the explicit linked list — but for languages without ordered maps (C++, Rust without `LinkedHashMap`), the hash + DLL is mandatory.

**Production-grade refinements**:

- **Thread safety**: the naive LRU is not thread-safe (concurrent `get` + `put` corrupt the list). Either coarse-lock around every operation (simple but contended), **shard the cache** into N independent LRUs keyed by `hash(key) % N` (Guava's default, scales linearly with cores), or use a **lock-free CLOCK approximation** (Caffeine's W-TinyLFU does this).
- **LRU-K** (O'Neil et al., 1993): track the **K-th most recent** access instead of the most recent; better protection for hot items against cold-scan workloads.
- **2Q** (Johnson and Shasha, 1994): two-queue admission filter to keep one-time scans from flushing the working set; FreeBSD's buffer cache uses a variant.
- **ARC (Adaptive Replacement Cache)**: dynamically balances LRU and LFU; **ZFS, IBM DB2, PostgreSQL** all use ARC or a derivative. ARC was patented by IBM, which is why some open-source systems use **CLOCK-Pro** or **W-TinyLFU** instead.
- **LFU / Window TinyLFU**: Caffeine's default — admission control via a count-min sketch keeps the cache "smart" about which new keys to admit, dramatically beating raw LRU on YCSB benchmarks.

For Java, prefer `Caffeine` over hand-rolled LRUs in production — it ships W-TinyLFU with size-based, time-based, and weight-based eviction and benchmarks faster than Guava and ConcurrentLinkedHashMap.

## complexity
- **Time**: O(1) for both `get` and `put`.
- **Space**: O(capacity).
- **Implementation cost**: ~50 LOC. Worth memorizing — comes up at least once per interview season.

## pitfalls
- **Forgetting to detach before inserting**: doubly-inserts the node, creating a cycle.
- **Missing sentinel nodes**: every detach + insert needs null checks. Two `head`/`tail` sentinels remove all of those.
- **Updating value without moving to front**: subtle bug — recent writes wouldn't get protection from eviction.
- **Hash map storing values, not nodes**: forces O(n) traversal to find the list node. Store the node pointer in the map.
- **Concurrency**: a naive LRU isn't thread-safe. Either lock around every op, or shard the cache, or use a concurrent-LRU library.

## interviewTips
- Recognize the trigger: "fixed-capacity cache, evict LRU, O(1) ops." That's THE LRU problem.
- Sketch both structures BEFORE writing code — interviewers expect you to explain the design.
- Use sentinel head/tail to keep the linked-list ops clean.
- For senior interviews, mention **LRU-K** (track last K accesses for better cold-warm protection), **2Q**, and **ARC** (used in ZFS) as more refined variants.

## code.python
```python
class Node:
    __slots__ = ('key', 'value', 'prev', 'next')
    def __init__(self, key, value):
        self.key, self.value, self.prev, self.next = key, value, None, None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}
        self.head, self.tail = Node(0, 0), Node(0, 0)
        self.head.next, self.tail.prev = self.tail, self.head

    def _detach(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _push_front(self, n):
        n.prev, n.next = self.head, self.head.next
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        if key not in self.map: return -1
        n = self.map[key]
        self._detach(n); self._push_front(n)
        return n.value

    def put(self, key, value):
        if key in self.map:
            n = self.map[key]
            n.value = value
            self._detach(n); self._push_front(n)
            return
        if len(self.map) == self.cap:
            lru = self.tail.prev
            self._detach(lru)
            del self.map[lru.key]
        n = Node(key, value)
        self.map[key] = n
        self._push_front(n)

c = LRUCache(2)
c.put(1, 1); c.put(2, 2); print(c.get(1))  # 1
c.put(3, 3); print(c.get(2))               # -1 (evicted)
```

## code.javascript
```javascript
class LRUCache {
  constructor(capacity) { this.cap = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);  // Map preserves insertion order
    return v;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size === this.cap) this.map.delete(this.map.keys().next().value);
    this.map.set(key, value);
  }
}
// JS Map's insertion-order property makes the manual linked list unnecessary.
```

## code.java
```java
import java.util.*;
class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int cap;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);   // access-order = true → behaves as LRU
        this.cap = capacity;
    }
    public int get(int key) { return super.getOrDefault(key, -1); }
    public void put(int key, int value) { super.put(key, value); }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > cap;
    }
}
```

## code.cpp
```cpp
#include <list>
#include <unordered_map>
class LRUCache {
    int cap;
    std::list<std::pair<int, int>> dll;
    std::unordered_map<int, decltype(dll.begin())> map;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        auto it = map.find(key);
        if (it == map.end()) return -1;
        dll.splice(dll.begin(), dll, it->second);
        return it->second->second;
    }
    void put(int key, int value) {
        auto it = map.find(key);
        if (it != map.end()) {
            it->second->second = value;
            dll.splice(dll.begin(), dll, it->second);
            return;
        }
        if ((int) map.size() == cap) {
            map.erase(dll.back().first);
            dll.pop_back();
        }
        dll.emplace_front(key, value);
        map[key] = dll.begin();
    }
};
```
