---
slug: cap-theorem
module: sd-storage
title: CAP Theorem
subtitle: A distributed system can guarantee any two of consistency, availability, and partition tolerance — not all three.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
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
CAP is the famous tradeoff every distributed-system designer eventually meets. Given a network that *will* drop messages (partition), you must choose: serve a possibly stale read (favor Availability) or refuse the read until the network heals (favor Consistency). You don't get to pretend partitions never happen — over a long-enough time horizon they always do.

## whyItMatters
Every distributed database labels itself with a CAP stance, and the label tells you what to expect during a network partition. Eric Brewer first stated the conjecture at PODC 2000; Gilbert and Lynch proved it in 2002 (*Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services*). Spanner and CockroachDB choose CP — they refuse writes when a majority cannot agree, accepting unavailability to preserve linearizability. DynamoDB, Cassandra, and Riak choose AP — they accept writes to any replica and reconcile later, accepting stale reads. Etcd, ZooKeeper, and Consul are CP because they back consensus on Raft/ZAB. Reading a database's CAP stance correctly is the difference between an engineer who designs reliable systems and one whose database silently loses data during the next partition.

## intuition
CAP says: when the network partitions, a distributed system can keep accepting writes (Availability) or keep all replicas in agreement (Consistency) — but not both. The proof is one paragraph: two nodes on opposite sides of a partition cannot communicate; if both accept a write, they diverge (no longer consistent); if one refuses writes, it is no longer available. Partition tolerance (P) is not a choice in real networks — links fail, switches reboot, cables get cut — so the practical question is "which one do I sacrifice when partitions happen?"

The theorem is often misread. "You can pick two of three" is wrong; partitions happen whether you pick them or not. The right framing is "during a partition you must pick between C and A." When the network is healthy, modern systems can deliver both — Spanner reads are linearizable and almost always available because Google's WAN partitions rarely. CAP only constrains behavior during failure, which is precisely when behavior matters most.

Daniel Abadi's PACELC refinement (2010) extends the model to the steady state: "In case of Partition, choose A or C; Else, choose Latency or Consistency." That second axis is what separates strong-consistency systems with slow reads (Spanner reads at the leader) from weak-consistency systems with fast reads (DynamoDB's eventual-consistency reads). Most real database choices live in PACELC space, not the simpler CAP space.

## visualization
```
        Consistency       Availability       Partition tolerance
            (C)                (A)                  (P)
              \                /                    /
               \              /                    /
        Pick any two — and in a real network, P is forced on you.
              Real-world axis: pick CP or AP.
```

## bruteForce
Pretend the network never partitions, deploy in a single rack, and call it consistent + available. True until your first switch failure. Then it's nothing.

## optimal
Pick C when correctness is non-negotiable: financial ledgers (Stripe's PaymentIntent table, plaid transactions, settlement systems use CP databases or Raft-backed primaries), distributed locks, leader election, configuration stores. Pick A when staleness is tolerable and unavailability is not: shopping carts (Amazon's Dynamo paper, 2007, explicitly chose AP because empty-cart errors cost more than stale-cart UX), product catalogs, social-media timelines, session stores, cache layers. Modern systems often pick per-operation: a single Cassandra deployment can serve `QUORUM` reads (C-leaning) for critical paths and `ONE` reads (A-leaning) for telemetry.

```python
# Pseudo-code for the per-operation choice
def checkout(user_id, cart_id):
    # Money moves: refuse if we cannot reach quorum.
    ledger.write(consistency="QUORUM", retry=False)

def view_cart(user_id):
    # Show whatever a fast replica has; reconcile on next write.
    return cart_store.read(consistency="ONE", read_repair=True)
```

The critical line is the `consistency=` parameter — Cassandra, ScyllaDB, and DynamoDB all expose this per-call, which means CAP is not a database choice but an operation choice. For systems where mistakes cost real money, default to CP and only relax for paths you have explicitly reasoned about. The follow-up reading is Kleppmann's *Designing Data-Intensive Applications* chapter 9, which dissects every commercial database's PACELC posture with citations, and the original Brewer keynote slides from PODC 2000 that started the discussion. A practical CAP audit for any new system asks three questions: which writes must never silently divert during a partition, which reads must never serve stale data, and which paths can tolerate either failure mode; the answers map directly onto the database's per-call consistency knobs.

## complexity
- **CP write latency**: bounded by slowest replica in the quorum (cross-region quorum = global RTT).
- **AP write latency**: local-only, ~ms.
- **Conflict resolution cost (AP)**: extra storage for vector clocks, app logic to merge sibling versions.

## pitfalls
- Treating CAP as "pick any 2 forever." In practice, P is non-negotiable; you toggle between C and A *during a partition*.
- Assuming "eventual" means seconds. With high write rates and slow links, "eventually" can be minutes or hours.
- Mixing CP and AP for related data (e.g. orders in CP, inventory in AP) leads to oversold inventory.
- Reading from a single replica in an AP system and assuming it's up-to-date — you must opt into stronger reads.

## interviewTips
- Name your DB's CAP stance explicitly. "Cassandra is AP; under partition, both halves keep accepting writes" wins points.
- Mention **PACELC** for senior-level discussions.
- For any data type, justify the choice: "Like counts can be eventually consistent — users won't notice a 2-second lag and we get availability for free."
- Be ready to describe a concrete conflict-resolution strategy (LWW, vector clocks, CRDTs).

## code.python
```python
# Sketch of AP behavior: two replicas keep accepting writes during a partition,
# resolve with last-write-wins on the timestamp at heal.
import time

class Replica:
    def __init__(self, name): self.name = name; self.data = {}
    def write(self, k, v): self.data[k] = (v, time.time())
    def reconcile(self, other):
        for k, (v, ts) in other.data.items():
            cur = self.data.get(k)
            if not cur or cur[1] < ts: self.data[k] = (v, ts)

a, b = Replica("A"), Replica("B")
a.write("count", 1); b.write("count", 2)
a.reconcile(b); b.reconcile(a)
print(a.data["count"][0])  # 2 — last write wins
```

## code.javascript
```javascript
class Replica {
  constructor() { this.data = new Map(); }
  write(k, v) { this.data.set(k, { v, ts: Date.now() }); }
  reconcile(other) {
    for (const [k, { v, ts }] of other.data) {
      const cur = this.data.get(k);
      if (!cur || cur.ts < ts) this.data.set(k, { v, ts });
    }
  }
}
```

## code.java
```java
import java.util.*;
class Replica {
    Map<String, Object[]> data = new HashMap<>();
    void write(String k, Object v) { data.put(k, new Object[]{ v, System.currentTimeMillis() }); }
    void reconcile(Replica o) {
        for (var e : o.data.entrySet()) {
            var cur = data.get(e.getKey());
            if (cur == null || (long) cur[1] < (long) e.getValue()[1]) data.put(e.getKey(), e.getValue());
        }
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <string>
#include <chrono>
struct Replica {
    struct Cell { std::string v; long long ts; };
    std::unordered_map<std::string, Cell> data;
    long long now() {
        using namespace std::chrono;
        return duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    }
    void write(const std::string& k, std::string v) { data[k] = { std::move(v), now() }; }
    void reconcile(const Replica& o) {
        for (auto& [k, cell] : o.data) {
            auto it = data.find(k);
            if (it == data.end() || it->second.ts < cell.ts) data[k] = cell;
        }
    }
};
```
