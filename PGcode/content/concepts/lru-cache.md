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
LRU is the textbook example of "this question wants you to design with two data structures." It's also a real production primitive: Redis EVICTION policies, Memcached, Linux page cache, browser caches — every cache subsystem ships an LRU (or LRU-K, LFU, ARC) variant. Knowing how to build it in 30 minutes is table-stakes for a senior backend interview.

## intuition
A hash map gives O(1) lookup `key → node`. A doubly linked list gives O(1) "move to front" (most recently used) and O(1) "remove from tail" (least recently used). On every `get`, move the touched node to the front. On `put`, insert at the front and — if at capacity — drop the tail. Every operation is constant-time.

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
**Data structures**:
- `map: Hash<key, Node>` where each `Node` has `{key, value, prev, next}`.
- `head` and `tail` sentinel nodes for clean boundary handling.

**Operations**:
```
get(key):
    if key not in map: return -1
    node = map[key]
    detach(node); insertAtFront(node)
    return node.value

put(key, value):
    if key in map:
        node = map[key]
        node.value = value
        detach(node); insertAtFront(node)
    else:
        if len(map) == capacity:
            lru = tail.prev
            detach(lru); del map[lru.key]
        node = new Node(key, value)
        insertAtFront(node); map[key] = node
```

Both ops are O(1). Sentinels mean `detach`/`insertAtFront` never check for null neighbors.

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
