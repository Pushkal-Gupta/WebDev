---
slug: hash-ring-rebalance
module: sd-storage
title: Hash Ring Rebalance
subtitle: When a node joins or leaves a consistent-hash cluster, only 1/N of the keys move — vnodes keep that motion smooth and the cluster online.
difficulty: Advanced
position: 35
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Apache Cassandra — Dynamo-style architecture (consistent hashing & vnodes)"
    url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html"
    type: book
  - title: "Amazon Dynamo — SOSP 2007 paper (consistent hashing & ring partitioning)"
    url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
    type: book
  - title: "Wikipedia — Consistent hashing"
    url: "https://en.wikipedia.org/wiki/Consistent_hashing"
    type: blog
status: published
---

## intro
A consistent-hash ring's whole point is that adding or removing a node only moves a fraction of the keys — not the whole dataset. But "only a fraction" is not "none," and the migration that happens during a join or leave is where the real engineering lives. Streaming gigabytes between nodes while serving live traffic, keeping replicas consistent, deciding which node temporarily owns a hand-off range — Dynamo, Cassandra, Riak, and modern Redis Cluster all spend most of their operational complexity on this single problem.

## whyItMatters
Elasticity is the headline feature of every distributed datastore: scale out on Friday before the launch, scale in on Tuesday when traffic drops. If the rebalance takes the cluster offline or stalls reads for ten minutes per node, that headline is a lie. Cassandra's vnode design, Riak's claim algorithm, DynamoDB's silent re-sharding, Redis Cluster's slot migration — each is a different answer to "move 1/N of the data without missing a single live request." Every team that has been paged at 3 AM because a node addition saturated the network has earned the right to care about this in detail.

## intuition
Picture the ring as a clock with 2^32 ticks around its edge. Each physical node owns a contiguous arc — the range from its predecessor's position around to its own. Insert a new node at position p, and the range that previously belonged to p's successor now splits: the arc from the new predecessor to p still belongs to the old owner, the arc from p to the old owner belongs to the new node. Only that one wedge of keys has to move.

The math: if the ring is well-distributed, each of N nodes owns roughly 1/N of the keyspace. Adding the (N+1)th node steals 1/(N+1) of the total from a single neighbour. That neighbour is the donor; everyone else is unaffected. Going from 10 to 11 nodes touches ~9% of keys, all from one host's disk. Compare with naive `hash(key) % N` where going from 10 to 11 reshuffles 90%+ of the keys across every node.

The catch is *which* neighbour. With one position per node, the donor is one unlucky host that has to ship 1/(N+1) of the data over the wire, single-stream. **Virtual nodes** (vnodes) fix this: each physical node takes 100-256 random positions on the ring. Now the new physical node's 256 vnodes each steal a tiny wedge from a different existing vnode, which means the migration sources from all N existing nodes in parallel and arrives at the new one in parallel. The wall-clock time to rebalance drops from "single-disk read of 1/N of the data" to "parallel read sharded across every disk in the cluster." That parallelism is the entire reason vnodes exist.

Removing a node is the mirror image. The departing node's vnodes are each handed off to whichever existing vnode is next clockwise. Cassandra's gossip propagates the membership change, the departing node streams its data to its successors, and once acknowledged it leaves the ring. During the transition, reads use a hinted-handoff or read-repair mechanism so no request is dropped while data is in motion.

## visualization
```
Before adding D — ring with A, B, C (and vnodes per physical node shown stacked)

   pos 30 ─ A1
   pos 50 ─ B1
   pos 80 ─ C1   <- owns keys (50, 80]
   pos 110 ─ A2
   pos 160 ─ B2  <- owns keys (110, 160]
   pos 240 ─ C2

After adding D with two vnodes at pos 65 and pos 130:

   pos 30 ─ A1
   pos 50 ─ B1
   pos 65 ─ D1   <- steals keys (50, 65] from C1
   pos 80 ─ C1   <- now owns keys (65, 80] only
   pos 110 ─ A2
   pos 130 ─ D2  <- steals keys (110, 130] from B2
   pos 160 ─ B2  <- now owns keys (130, 160] only
   pos 240 ─ C2

Streams during rebalance:
   C1 ── (50..65]  ──► D1
   B2 ── (110..130] ──► D2
   (both stream in parallel, so wall time is one wedge, not two)
```

## bruteForce
**`hash(key) % N` with stop-the-world resharding**. The simplest sharded cache: pick the shard with a modulus. Adding a shard means almost every key remaps. Operationally you do this by spinning up the new cluster size, dual-writing for a period, then cutting over. The migration is full-dataset, the cache hit rate falls to ~1/N during the cutover, and the procedure is hours of engineer-supervised toil. Acceptable for ten-node Memcached clusters in 2008; unacceptable for anything bigger.

**Manual range-based sharding** with a config map ("user_ids 0-999 to shard A, 1000-1999 to B"). Adding a shard means manually picking a range to split, copying that range over the network, then changing the config. Doable but every join is a human-supervised maintenance window.

## optimal
The production answer is **consistent hashing + virtual nodes + an online stream-and-handoff protocol**, the design Amazon Dynamo introduced in 2007 and Cassandra/Riak/DynamoDB have refined since.

**The membership protocol**: gossip (Cassandra, Riak) or a coordinator service (older Redis Cluster used the cluster bus; newer setups use a separate orchestrator). When a new node joins, it announces its token positions; existing nodes update their local view of the ring and compute which of their ranges will be donated.

**The streaming protocol**: source vnodes read their soon-to-be-donated keys and stream them to the destination vnode. Cassandra's `nodetool bootstrap` does exactly this — parallel SSTable streams from every existing node to the joiner. Throughput is throttled (`stream_throughput_outbound_megabits_per_sec`) so the migration does not starve live traffic.

**The traffic protocol during transition**: this is the subtle part. While a key range is mid-migration, who serves reads and writes for it?
- **Cassandra**: the new node joins as a *replica candidate*; reads continue to be served by the existing replicas, writes go to both the old and new replicas. Once streaming completes, the new node is promoted and a `cleanup` removes the now-unowned data on the old owners.
- **Dynamo / DynamoDB**: hinted handoff. A write that should target a node currently being repartitioned gets stored on a neighbour with a hint; once the target is ready, the neighbour replays the hint.
- **Redis Cluster**: per-slot `MIGRATING`/`IMPORTING` states. Reads on a migrating slot hit the source; if the source returns a `MOVED`/`ASK` redirect, the client retries against the destination. Migration is atomic per key.

**Why vnodes are non-negotiable**: with one token per physical node, the join-time donor is one node and the leave-time recipient is one node. Both saturate a single disk. With 256 vnodes per physical node, the join sources from 256 different disks in parallel and writes to 256 sinks in parallel. Cassandra's default is 16 vnodes (post-4.0) for better repair behaviour, down from 256 — the exact number is a tunable, the principle is not.

**Tooling rules of thumb**:
- **Throttle streaming bandwidth** to ~25% of the network capacity so live reads still hit their SLA.
- **Bootstrap one node at a time**. Two simultaneous joins move 2x the data and can leave the ring in an underreplicated state if one fails mid-stream.
- **Run cleanup** after the join finalises, otherwise old owners hold stale copies forever.
- **Plan for asymmetric clusters**: if hardware varies, give beefier nodes more vnodes so they own more of the ring proportional to capacity.

## complexity
- **Keys moved on join/leave**: `~1/N` of the dataset for one-vnode-per-node, the same `~1/N` total but sharded across `N * V` streams for V vnodes per node.
- **Lookup**: `O(log(N * V))` to find the owner via a sorted token list, or `O(1)` amortised with a pre-baked lookup table.
- **Stream wall-clock time**: `(dataset / N) / (per-link bandwidth * V)` — vnodes turn the parallelism dial.
- **Membership change cost**: `O(N)` gossip messages eventually-consistently propagated; reads stay correct mid-flight because old and new replicas both serve.

## pitfalls
- **Bootstrapping multiple nodes at once**: each join changes the ring; doing two in parallel often leaves a range without the required replication factor for a window. Bootstrap serially.
- **Forgetting to run cleanup after the join completes**: source nodes keep their old copies, wasting disk and triggering inconsistencies if they accidentally serve a stale read.
- **Vnode count too low**: at 1-4 vnodes, a join still saturates a single source disk. At 256+, repair operations on Cassandra slow down because each vnode is repaired independently. The sweet spot is 16-32.
- **Asymmetric capacity ignored**: every node owns the same number of vnodes by default. A 4 TB node and a 16 TB node in the same ring means the smaller one fills up while the larger one runs at 25%. Set per-node vnode count proportional to capacity.
- **Unthrottled streaming**: a full-speed bootstrap saturates the network, p99 read latency spikes, the on-call gets paged, the bootstrap gets aborted. Always cap bandwidth.
- **Token collisions in tiny clusters**: random vnode placement can clump tokens close together, leaving a node nearly empty. Cassandra 4.0's allocation algorithm picks tokens deterministically to avoid this.

## interviewTips
- Lead with "consistent hashing moves only 1/N of the keys, but the *real* engineering is in **how** they move while the cluster stays online." That sentence sets up every follow-up.
- Name **vnodes** and explain *why*: parallel sources and sinks during the migration, not just "for load balancing." The parallelism is the headline.
- For senior interviews, contrast **Cassandra's gossip-and-stream** with **Redis Cluster's per-slot MIGRATING/IMPORTING** and **DynamoDB's silent re-sharding**. Three different traffic-during-migration designs, same underlying ring.

## code.python
```python
"""Hash-ring rebalance walker: compute which vnodes' ranges migrate when a node joins."""
import hashlib
from bisect import insort, bisect_right
from dataclasses import dataclass, field

def _hash(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % (1 << 32)

@dataclass
class HashRing:
    vnodes_per_node: int = 16
    tokens: list[int] = field(default_factory=list)        # sorted ring positions
    owner: dict[int, str] = field(default_factory=dict)     # token -> physical node id

    def _vnode_tokens(self, node_id: str) -> list[int]:
        return [_hash(f"{node_id}#{i}") for i in range(self.vnodes_per_node)]

    def add_node(self, node_id: str) -> list[tuple[str, str, int, int]]:
        """Return list of (donor_node, recipient_node, start, end) ranges to stream."""
        migrations = []
        for tok in self._vnode_tokens(node_id):
            if tok in self.owner:        # collision: skip (rare with 32-bit space)
                continue
            # Successor token (clockwise) currently owns (predecessor, successor].
            idx = bisect_right(self.tokens, tok)
            successor = self.tokens[idx % len(self.tokens)] if self.tokens else None
            predecessor = self.tokens[idx - 1] if self.tokens else None
            if successor is not None:
                donor = self.owner[successor]
                start = predecessor if predecessor is not None else 0
                migrations.append((donor, node_id, start, tok))
            insort(self.tokens, tok)
            self.owner[tok] = node_id
        return migrations

    def lookup(self, key: str) -> str | None:
        if not self.tokens: return None
        h = _hash(key)
        idx = bisect_right(self.tokens, h) % len(self.tokens)
        return self.owner[self.tokens[idx]]
```

## code.javascript
```javascript
// Hash-ring rebalance walker: log which ranges migrate when a node joins.
import { createHash } from 'node:crypto';

const hashKey = (s) =>
  parseInt(createHash('md5').update(s).digest('hex').slice(0, 8), 16);

export class HashRing {
  constructor(vnodesPerNode = 16) {
    this.vnodesPerNode = vnodesPerNode;
    this.tokens = [];        // sorted
    this.owner = new Map();   // token -> nodeId
  }

  _vnodeTokens(nodeId) {
    return Array.from({ length: this.vnodesPerNode }, (_, i) => hashKey(`${nodeId}#${i}`));
  }

  addNode(nodeId) {
    const migrations = [];
    for (const tok of this._vnodeTokens(nodeId)) {
      if (this.owner.has(tok)) continue;
      let idx = this.tokens.findIndex((t) => t > tok);
      if (idx === -1) idx = this.tokens.length;
      const successor = this.tokens.length ? this.tokens[idx % this.tokens.length] : null;
      const predecessor = idx > 0 ? this.tokens[idx - 1] : null;
      if (successor !== null) {
        migrations.push({
          donor: this.owner.get(successor),
          recipient: nodeId,
          start: predecessor ?? 0,
          end: tok,
        });
      }
      this.tokens.splice(idx, 0, tok);
      this.owner.set(tok, nodeId);
    }
    return migrations;
  }

  lookup(key) {
    if (!this.tokens.length) return null;
    const h = hashKey(key);
    let idx = this.tokens.findIndex((t) => t > h);
    if (idx === -1) idx = 0;
    return this.owner.get(this.tokens[idx]);
  }
}
```

## code.java
```java
import java.security.*;
import java.util.*;

public class HashRing {
    public record Migration(String donor, String recipient, long start, long end) {}
    private final int vnodesPerNode;
    private final TreeMap<Long,String> ring = new TreeMap<>();

    public HashRing(int vnodesPerNode) { this.vnodesPerNode = vnodesPerNode; }

    private long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes());
            long h = 0;
            for (int i = 0; i < 4; i++) h = (h << 8) | (d[i] & 0xFF);
            return h;
        } catch (NoSuchAlgorithmException e) { throw new RuntimeException(e); }
    }

    public List<Migration> addNode(String nodeId) {
        List<Migration> migrations = new ArrayList<>();
        for (int i = 0; i < vnodesPerNode; i++) {
            long tok = hash(nodeId + "#" + i);
            if (ring.containsKey(tok)) continue;
            Map.Entry<Long,String> successor = ring.ceilingEntry(tok + 1);
            if (successor == null && !ring.isEmpty()) successor = ring.firstEntry();
            Long predecessor = ring.lowerKey(tok);
            if (successor != null) {
                migrations.add(new Migration(successor.getValue(), nodeId,
                    predecessor == null ? 0 : predecessor, tok));
            }
            ring.put(tok, nodeId);
        }
        return migrations;
    }

    public String lookup(String key) {
        if (ring.isEmpty()) return null;
        long h = hash(key);
        var e = ring.ceilingEntry(h);
        return (e != null ? e : ring.firstEntry()).getValue();
    }
}
```

## code.cpp
```cpp
#include <map>
#include <vector>
#include <string>
#include <tuple>
#include <openssl/md5.h>

class HashRing {
public:
    struct Migration { std::string donor, recipient; long start, end; };

    HashRing(int vnodesPerNode) : vpn(vnodesPerNode) {}

    std::vector<Migration> addNode(const std::string& nodeId) {
        std::vector<Migration> out;
        for (int i = 0; i < vpn; ++i) {
            long tok = hash(nodeId + "#" + std::to_string(i));
            if (ring.count(tok)) continue;
            auto succ = ring.upper_bound(tok);
            if (succ == ring.end() && !ring.empty()) succ = ring.begin();
            long pred = 0;
            auto it = ring.lower_bound(tok);
            if (it != ring.begin()) { --it; pred = it->first; }
            if (succ != ring.end()) out.push_back({succ->second, nodeId, pred, tok});
            ring[tok] = nodeId;
        }
        return out;
    }

    std::string lookup(const std::string& key) const {
        if (ring.empty()) return "";
        long h = hash(key);
        auto it = ring.lower_bound(h);
        if (it == ring.end()) it = ring.begin();
        return it->second;
    }
private:
    int vpn;
    std::map<long, std::string> ring;
    static long hash(const std::string& s) {
        unsigned char d[MD5_DIGEST_LENGTH];
        MD5(reinterpret_cast<const unsigned char*>(s.data()), s.size(), d);
        long h = 0;
        for (int i = 0; i < 4; ++i) h = (h << 8) | d[i];
        return h;
    }
};
```
