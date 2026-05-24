---
slug: consistent-hashing
module: system-design
title: Consistent Hashing
subtitle: Map keys to nodes so adding or removing a node moves only 1/N of the keys.
difficulty: Advanced
position: 6
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Hash a key, mod by the number of shards, route to that shard. Simple — until you change the shard count. Naive `hash(key) % N` reshuffles almost every key when N changes, which is catastrophic for a live system. Consistent hashing fixes this: adding or removing one node remaps only about 1/N of the keys.

## whyItMatters
Consistent hashing is the secret sauce behind elastic scaling. Distributed caches (Memcached, Redis Cluster), sharded databases (Cassandra, DynamoDB), CDN routing, peer-to-peer systems (Chord) — anything that distributes keys across a growing/shrinking fleet — uses it. Without it, every capacity change becomes a planned outage.

## intuition
Imagine a clock face from 0 to 2^32. Each node is placed at some position on the rim (the hash of its name). Each key is also placed at the hash of its identifier. To find the node owning a key, walk clockwise from the key's position until you hit a node — that's its owner. Adding a new node only steals keys from one neighbor; removing a node only hands its keys to one neighbor. Most of the ring is undisturbed.

## visualization
```
                 Node A (hash 30)
                       │
   key X (hash 40) ────┘   ─►  owned by A's successor: Node B
                              ┌─── Node B (hash 50)
                              │
   key Y (hash 75)            │   ─►  owned by Node B's successor: Node C
                              └─── Node C (hash 80)
   ...wraps back to Node A at 360
```

## bruteForce
`shard = hash(key) % N`. Adding a shard changes the modulus → most keys remap → catastrophic cache miss storm or massive data migration.

## optimal
Place each node at multiple positions ("virtual nodes" or "vnodes") around the ring — say 100–200 vnodes per physical node — to smooth out distribution. Lookup is `O(log N)` via a sorted structure (TreeMap, skiplist) or `O(1)` amortized with a precomputed lookup table.

Adding a node:
1. Pick its hashes → insert vnodes into the ring.
2. Only keys that previously walked clockwise past the new vnode positions move.
3. Move on average `K/N` keys (K = total keys, N = nodes).

Removing a node:
1. Remove its vnodes.
2. Affected keys are picked up by the next clockwise vnode.

Variants: **rendezvous (HRW) hashing** computes `hash(key + node)` for every node and picks the maximum — no ring, similar properties, simpler code; **jump consistent hashing** (Google) is even cheaper for the common case of monotonic node IDs.

## complexity
- **Lookup**: O(log N) with TreeMap (N = total vnodes).
- **Add/remove node**: O(V log N) to insert/remove V vnodes.
- **Key movement on resize**: O(K/N) keys move on average.
- **Distribution variance**: drops as `1/sqrt(V)` per node — vnodes are the standard fix for hot spots.

## pitfalls
- **Too few vnodes**: distribution becomes uneven, some nodes get 2× others. 100–200 vnodes per physical node is a good default.
- **Forgetting replication**: a single hash position = single owner = no fault tolerance. Walk N positions clockwise to get N replicas.
- **Hash collisions for node names**: if two nodes hash to the same point, behavior is undefined. Salt with `name + ":" + i`.
- **Resizing the ring under load**: even though 1/N of keys move, that's still a lot for a hot system — throttle the migration.

## interviewTips
- The instant the interviewer says "add a cache node" or "rebalance a sharded DB," reach for consistent hashing.
- Mention **virtual nodes** explicitly — they're the difference between a textbook ring and a production-grade one.
- For very senior interviews, mention **rendezvous hashing** as a simpler alternative and **jump consistent hash** for monotonic IDs.
- Always pair with a replication strategy ("walk K positions clockwise for K replicas").

## code.python
```python
import hashlib
from bisect import bisect_right, insort

class ConsistentHash:
    def __init__(self, vnodes=150):
        self.vnodes = vnodes
        self.ring = []           # sorted list of (hash, node) tuples
        self._hashes = []        # parallel sorted list of just hashes for bisect

    def _h(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def add(self, node):
        for i in range(self.vnodes):
            h = self._h(f"{node}:{i}")
            insort(self._hashes, h)
            self.ring.insert(self._hashes.index(h), (h, node))

    def get(self, key):
        if not self.ring: return None
        h = self._h(key)
        i = bisect_right(self._hashes, h) % len(self._hashes)
        return self.ring[i][1]

ch = ConsistentHash()
for n in ["A", "B", "C"]: ch.add(n)
print(ch.get("user-42"))
```

## code.javascript
```javascript
const crypto = require('crypto');
class ConsistentHash {
  constructor(vnodes = 150) { this.vnodes = vnodes; this.ring = []; }
  _h(k) { return parseInt(crypto.createHash('md5').update(k).digest('hex').slice(0, 8), 16); }
  add(node) {
    for (let i = 0; i < this.vnodes; i++) this.ring.push([this._h(`${node}:${i}`), node]);
    this.ring.sort((a, b) => a[0] - b[0]);
  }
  get(key) {
    if (!this.ring.length) return null;
    const h = this._h(key);
    const idx = this.ring.findIndex(([rh]) => rh >= h);
    return this.ring[idx === -1 ? 0 : idx][1];
  }
}
```

## code.java
```java
import java.util.*;
import java.security.MessageDigest;
class ConsistentHash {
    private final int vnodes;
    private final TreeMap<Long, String> ring = new TreeMap<>();
    ConsistentHash(int v) { this.vnodes = v; }
    private long h(String k) throws Exception {
        byte[] d = MessageDigest.getInstance("MD5").digest(k.getBytes());
        return ((long)(d[0]&0xff)<<24) | ((long)(d[1]&0xff)<<16) | ((long)(d[2]&0xff)<<8) | (d[3]&0xff);
    }
    public void add(String node) throws Exception {
        for (int i = 0; i < vnodes; i++) ring.put(h(node + ":" + i), node);
    }
    public String get(String key) throws Exception {
        if (ring.isEmpty()) return null;
        var entry = ring.ceilingEntry(h(key));
        return (entry == null ? ring.firstEntry() : entry).getValue();
    }
}
```

## code.cpp
```cpp
#include <map>
#include <string>
#include <functional>
struct ConsistentHash {
    int vnodes;
    std::map<size_t, std::string> ring;
    explicit ConsistentHash(int v = 150) : vnodes(v) {}
    void add(const std::string& node) {
        for (int i = 0; i < vnodes; i++) {
            ring[std::hash<std::string>{}(node + ":" + std::to_string(i))] = node;
        }
    }
    std::string get(const std::string& key) {
        if (ring.empty()) return "";
        auto it = ring.lower_bound(std::hash<std::string>{}(key));
        return it == ring.end() ? ring.begin()->second : it->second;
    }
};
```
