---
slug: dynamo-paper-architecture
module: sd-consensus
title: Amazon Dynamo — Quorums, Vector Clocks, Anti-Entropy
subtitle: Inside the 2007 paper that invented the modern AP key-value store and seeded Cassandra, Riak, and DynamoDB.
difficulty: Advanced
position: 5
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 5: Replication"
    url: "https://dataintensive.net/"
    type: book
  - title: "AWS Builders' Library — Amazon DynamoDB ten years later"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "donnemartin/system-design-primer — Dynamo-style stores"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
The 2007 Dynamo paper is the single most influential systems paper of the last two decades. It defined the design vocabulary every NoSQL store still uses: consistent hashing on a ring, configurable N/R/W quorums, sloppy quorum with hinted handoff, vector clocks for conflict detection, Merkle trees for anti-entropy, and gossip for membership. Cassandra, Riak, Voldemort, and (in spirit) DynamoDB itself all descend from this one document.

## whyItMatters
Every AP system-design answer leans on Dynamo's primitives whether the candidate names them or not. "How do you handle a node failure mid-write?" → hinted handoff. "How do two writes to the same key reconcile after a partition heals?" → vector clocks plus read repair. "How do you scale membership to 1000 nodes?" → gossip. Knowing the original mechanics — not just the buzzwords — separates a senior answer from a junior one.

## intuition
A logical key space `[0, 2^128)` becomes a ring. Each physical node owns multiple *virtual nodes* scattered around the ring (load balancing without manual sharding). The first N successors of a key's hash form its preference list. Writes go to all N; the coordinator returns success when W respond, reads go to N and wait for R. Pick `R + W > N` and you get read-your-writes in the absence of partitions; pick `R + W <= N` and you trade consistency for latency.

## visualization
A ring with 6 virtual nodes and a put for key whose hash falls between v3 and v4 (N=3, W=2, R=2):

```
        v0
   v5         v1
        ring
   v4         v2
        v3

put(k) hashes to position H between v3 and v4
preference list = [v4, v5, v0]   (next 3 clockwise)

coordinator sends put to v4, v5, v0
  v4 -> ack
  v5 -> ack         W=2 reached -> return success to client
  v0 -> times out -> coordinator stores hint on v1 ("hand to v0 later")

get(k):
  coordinator reads from v4, v5, v0
  v4 returns ver [A:1]
  v5 returns ver [A:1]
  v0 returns ver [A:1, B:1]   <- concurrent write
  -> return both versions to client for resolution
```

## bruteForce
The "single primary, sync replication" alternative (classic relational HA) gives you strict consistency but pays for it in availability — any partition that isolates the primary takes writes offline until failover. For Amazon's shopping cart "always writable" requirement, this was unacceptable. The other extreme — single master with async replication — gives availability but loses writes silently when the master dies mid-replication.

## optimal
The Dynamo recipe, point by point:
- **Consistent hashing with virtual nodes** — moving a physical node only re-homes `1/N` of keys; vnodes smooth load when node sizes differ.
- **Quorum N/R/W** — N=3, W=2, R=2 is the default. R=1/W=N for read-heavy, R=N/W=1 for write-heavy.
- **Sloppy quorum + hinted handoff** — when a preferred replica is down, write to the next healthy node with a hint; replay the hint when the original comes back. Keeps writes accepted during partial outages.
- **Vector clocks** — each write tags the value with `(node_id, counter)`. On read, the coordinator returns all causally concurrent versions; the client (or merge function) reconciles. Cart example: union the items in conflicting versions; deleted items reappear, which Amazon accepted as a feature.
- **Merkle tree anti-entropy** — replicas compare hash trees of their key ranges in the background, syncing only the differing leaves. Bounded bandwidth, eventual repair.
- **Gossip for membership** — O(log N) rounds to converge on cluster view; no central registry.

## complexity
time: Reads and writes are O(N) network round-trips on the coordinator side but block only on R or W respectively. Anti-entropy is O(differing keys), not O(total keys), thanks to Merkle.
space: 3x storage (N=3) plus vector clock metadata per value (typically 100–500 bytes for stable clusters).
notes: Vector clocks grow without bound if clients keep changing; Riak truncates and Cassandra abandoned vector clocks for last-write-wins (LWW) timestamps, accepting silent loss for simplicity.

## pitfalls
- Treating last-write-wins as "good enough" — under clock skew you silently drop the slower write. Use vector clocks or CRDTs if data is mutable.
- Forgetting that sloppy quorum only guarantees `R + W > N` in the *original* preference list, not the sloppy one. Under sustained partition, you can lose read-your-writes.
- Vector clock siblings accumulating because the merge function is missing or wrong — reads return ever-growing lists.
- Setting W=1 to chase write latency, then being surprised when reads fail to converge under churn.
- Running Merkle anti-entropy synchronously on the read path — it is a background process; never block reads on it.

## interviewTips
- Sketch the ring first, then layer the preference list, then quorums. Visual order matters for clarity.
- Quote PACELC for the consistency story: Dynamo is PA/EL — favoring availability under partition, latency under normal operation.
- Distinguish Dynamo (the paper, open-source clones) from DynamoDB (the AWS managed service) — the latter has evolved far beyond the paper and offers strong consistency as an option using replicated logs.
- Mention CRDTs as the modern alternative to vector-clock merge functions — same problem (concurrent updates), cleaner math.
- If asked "design a shopping cart," the Dynamo paper *is* the canonical answer; describe it.

## code.python
```python
import hashlib, bisect

class Ring:
    def __init__(self, nodes, vnodes=128):
        self.ring = []
        self.owner = {}
        for n in nodes:
            for v in range(vnodes):
                h = int(hashlib.md5(f"{n}#{v}".encode()).hexdigest(), 16)
                bisect.insort(self.ring, h)
                self.owner[h] = n

    def preference_list(self, key, n=3):
        h = int(hashlib.md5(key.encode()).hexdigest(), 16)
        idx = bisect.bisect_right(self.ring, h) % len(self.ring)
        out, seen = [], set()
        while len(out) < n:
            node = self.owner[self.ring[idx]]
            if node not in seen:
                out.append(node); seen.add(node)
            idx = (idx + 1) % len(self.ring)
        return out

def merge_carts(versions):
    items = set()
    for v in versions:
        items |= set(v["items"])
    return {"items": sorted(items)}
```

## code.javascript
```javascript
import crypto from "node:crypto";

class Ring {
  constructor(nodes, vnodes = 128) {
    this.ring = [];
    this.owner = new Map();
    for (const n of nodes) {
      for (let v = 0; v < vnodes; v++) {
        const h = parseInt(crypto.createHash("md5").update(`${n}#${v}`).digest("hex").slice(0, 12), 16);
        this.ring.push(h);
        this.owner.set(h, n);
      }
    }
    this.ring.sort((a, b) => a - b);
  }
  preferenceList(key, n = 3) {
    const h = parseInt(crypto.createHash("md5").update(key).digest("hex").slice(0, 12), 16);
    let i = this.ring.findIndex((x) => x > h);
    if (i < 0) i = 0;
    const out = [], seen = new Set();
    while (out.length < n) {
      const node = this.owner.get(this.ring[i]);
      if (!seen.has(node)) { out.push(node); seen.add(node); }
      i = (i + 1) % this.ring.length;
    }
    return out;
  }
}
```

## code.java
```java
class ConsistentHashRing {
    final NavigableMap<Long, String> ring = new TreeMap<>();
    ConsistentHashRing(List<String> nodes, int vnodes) {
        for (String n : nodes)
            for (int v = 0; v < vnodes; v++)
                ring.put(hash(n + "#" + v), n);
    }
    List<String> preferenceList(String key, int n) {
        long h = hash(key);
        var tail = ring.tailMap(h, true);
        var seq = new ArrayList<>(tail.values());
        seq.addAll(ring.headMap(h, false).values());
        LinkedHashSet<String> uniq = new LinkedHashSet<>();
        for (String node : seq) { if (uniq.add(node) && uniq.size() == n) break; }
        return new ArrayList<>(uniq);
    }
    long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes());
            return ByteBuffer.wrap(d, 0, 8).getLong();
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}
```

## code.cpp
```cpp
#include <map>
#include <string>
#include <vector>
#include <openssl/md5.h>

uint64_t md5_prefix(const std::string& s) {
    unsigned char d[16];
    MD5(reinterpret_cast<const unsigned char*>(s.data()), s.size(), d);
    uint64_t v = 0;
    for (int i = 0; i < 8; ++i) v = (v << 8) | d[i];
    return v;
}

struct Ring {
    std::map<uint64_t, std::string> ring;
    Ring(const std::vector<std::string>& nodes, int vnodes = 128) {
        for (auto& n : nodes)
            for (int v = 0; v < vnodes; ++v)
                ring[md5_prefix(n + "#" + std::to_string(v))] = n;
    }
    std::vector<std::string> preference_list(const std::string& key, int n = 3) {
        uint64_t h = md5_prefix(key);
        auto it = ring.upper_bound(h);
        std::vector<std::string> out;
        std::set<std::string> seen;
        for (size_t steps = 0; steps < ring.size() && (int)out.size() < n; ++steps) {
            if (it == ring.end()) it = ring.begin();
            if (seen.insert(it->second).second) out.push_back(it->second);
            ++it;
        }
        return out;
    }
};
```
