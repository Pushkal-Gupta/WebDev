---
slug: cap-theorem
module: system-design
title: CAP Theorem
subtitle: A distributed system can guarantee any two of consistency, availability, and partition tolerance — not all three.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Eric Brewer's original CAP paper"
    url: ""
status: published
---

## intro
CAP is the famous tradeoff every distributed-system designer eventually meets. Given a network that *will* drop messages (partition), you must choose: serve a possibly stale read (favor Availability) or refuse the read until the network heals (favor Consistency). You don't get to pretend partitions never happen — over a long-enough time horizon they always do.

## whyItMatters
Every modern database labels itself with a CAP stance. Knowing the label tells you what to expect during an outage: will your DB refuse writes? Serve old reads? Lose data quietly? The choice cascades into product decisions — a bank chooses C; a social-media timeline chooses A.

## intuition
Two cashiers, one branch, one shared ledger over a phone line. Phone line cuts.
- **CP**: cashiers stop accepting transactions until the phone works again — never disagree, but customers wait.
- **AP**: each cashier keeps taking transactions on their own copy of the ledger; they reconcile when the phone is back — always serve, but copies temporarily disagree.

You can't have both with the phone down. That's CAP.

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
Categorize your data by need:

- **CP systems** (HBase, MongoDB with majority writes, ZooKeeper, etcd, Spanner with TrueTime): block reads/writes during partition rather than return stale data. Use for: financial ledgers, locks, leader election, configuration.
- **AP systems** (Cassandra, DynamoDB default, Riak, CouchDB): always answer; resolve conflicts later via last-write-wins, vector clocks, or CRDTs. Use for: shopping carts, user activity feeds, sensor data, like counts.

Within AP, pick a **consistency level**: read-your-writes, eventual consistency, monotonic reads. Within CP, pick a **quorum**: majority writes, quorum reads (`W + R > N`).

PACELC refines CAP: even without a partition, you choose between **L**atency and **C**onsistency. Synchronous replication across regions = stronger consistency but +100ms latency. Async = the opposite.

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
