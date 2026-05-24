---
slug: read-replica-quorum
module: system-design
title: Read / Write Quorum
subtitle: Tune consistency by picking R and W so that R + W greater than N guarantees overlap.
difficulty: Advanced
position: 51
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Replication & Consistency"
    url: "https://microservices.io/patterns/data/database-per-service.html"
    type: book
  - title: "Martin Fowler — Eventual Consistency"
    url: "https://martinfowler.com/bliki/EventualConsistency.html"
    type: blog
  - title: "donnemartin/system-design-primer — Consistency Patterns"
    url: "https://github.com/donnemartin/system-design-primer#consistency-patterns"
    type: repo
status: published
---

## intro
Quorum replication is the algebra that makes distributed storage tunable. With N replicas, you pick W (how many must ack a write) and R (how many must respond to a read). When R + W is greater than N, at least one read replica is guaranteed to have seen the latest write — that's strong consistency. Shrink either knob and you trade consistency for latency or availability.

## whyItMatters
This is the central trade-off question every distributed-database interview returns to: "how does Cassandra / DynamoDB / Riak balance consistency and latency?" The answer is always quorum tuning. Understanding the R + W > N inequality lets you reason about why W=N is the strongest write but kills availability, why R=1 W=N is fast reads + slow writes, and how Dynamo's "sloppy quorum" widens the inequality at the cost of eventual consistency.

## intuition
Picture N=3 librarians, each with a copy of the book. Write quorum W=2 means the new edition must be in at least 2 of the 3 copies before you confirm the update. Read quorum R=2 means you must compare 2 copies and pick the newest. Any read pair must overlap with any write pair — that's why R + W > N is the magic line. If you write to only 1 (W=1) and read from only 1 (R=1), the reader might pick a stale librarian.

## visualization
N=5 replicas, W=3, R=3. R + W = 6 > 5 → at least one read replica was in the write set. Acceptable failure: 2 replicas down — the other 3 still satisfy both quorums. Acceptable failure for W=5: zero, because any replica down blocks writes. Acceptable failure for R=1 W=5: writes block on a single failure; reads survive 4 failures.

## bruteForce
Single-leader replication: one node is the primary, all writes go through it, reads from any replica. Simple to reason about, but the leader is a single point of failure and reads from a stale replica need explicit hint ("read-your-own-writes"). When the leader fails, you need a leader-election protocol (Raft, Paxos) that itself uses quorums.

## optimal
Pick (N, W, R) based on workload:
- **Strong consistency, balanced load**: N=3, W=2, R=2 — survives 1 node failure, both ops do 2/3 work.
- **Write-heavy, read-rare**: N=3, W=1, R=3 — writes are 1-replica fast, reads do conflict resolution.
- **Read-heavy, low staleness tolerance**: N=3, W=3, R=1 — reads are 1-replica fast, writes require all-up.
- **Best availability (eventually consistent)**: N=3, W=1, R=1 — both fast, may read stale data.

On read, resolve conflicts via version vectors / last-write-wins timestamps / application-level merge (CRDTs). Use read-repair to lazily update stale replicas. For network-partition tolerance, prefer "sloppy quorum + hinted handoff": write to any W reachable nodes, even outside the home replica set, and hand off when partitioned nodes recover.

## complexity
time: O(W) write latency, O(R) read latency (parallel calls — bounded by slowest of W or R)
space: O(N) replicas of the data
notes: Quorum overlap proof: |A ∩ B| ≥ |A| + |B| − N = W + R − N. For overlap ≥ 1, need W + R > N.

## pitfalls
- Treating R + W > N as "always strongly consistent" — concurrent writes with no ordering still need conflict resolution.
- Forgetting clock skew breaks last-write-wins — prefer logical clocks or version vectors.
- Setting W=1 R=1 for "performance" then expecting strong consistency — pick one.
- Ignoring sloppy-quorum hinted-handoff: replicas chosen at write time may not be the canonical owners.
- Not accounting for the read amplification cost — R=3 means each read does 3× downstream traffic.

## interviewTips
- Quote DynamoDB's "consistent read" = quorum read; "eventually consistent read" = R=1.
- Mention Cassandra's tunable consistency levels (ONE, QUORUM, ALL) map directly to R / W choices.
- Discuss the CAP triangle: quorum lets you slide along the CA — CP — AP edges per operation.

## code.python
```python
import asyncio
import random

class Replica:
    def __init__(self, name):
        self.name = name
        self.value = None
        self.version = 0
    async def write(self, v, version):
        await asyncio.sleep(random.uniform(0.01, 0.05))
        if version > self.version:
            self.value, self.version = v, version
        return True
    async def read(self):
        await asyncio.sleep(random.uniform(0.01, 0.05))
        return (self.value, self.version)

async def quorum_write(replicas, v, w):
    version = max((await r.read())[1] for r in replicas) + 1
    tasks = [r.write(v, version) for r in replicas]
    done = 0
    for t in asyncio.as_completed(tasks):
        await t
        done += 1
        if done >= w: return True
    return False

async def quorum_read(replicas, r):
    tasks = [rep.read() for rep in replicas]
    results = []
    for t in asyncio.as_completed(tasks):
        results.append(await t)
        if len(results) >= r:
            return max(results, key=lambda x: x[1])[0]
```

## code.javascript
```javascript
class Replica {
  constructor(name) { this.name = name; this.value = null; this.version = 0; }
  async write(v, version) {
    await new Promise(r => setTimeout(r, 10 + Math.random() * 40));
    if (version > this.version) { this.value = v; this.version = version; }
    return true;
  }
  async read() {
    await new Promise(r => setTimeout(r, 10 + Math.random() * 40));
    return { value: this.value, version: this.version };
  }
}

async function quorumRead(replicas, r) {
  const results = [];
  return new Promise((resolve) => {
    replicas.forEach((rep) =>
      rep.read().then((res) => {
        results.push(res);
        if (results.length === r) {
          results.sort((a, b) => b.version - a.version);
          resolve(results[0].value);
        }
      })
    );
  });
}
```

## code.java
```java
import java.util.*;
import java.util.concurrent.*;

class Replica {
    volatile Object value;
    volatile long version;
    CompletableFuture<Boolean> write(Object v, long ver) {
        return CompletableFuture.supplyAsync(() -> {
            if (ver > version) { value = v; version = ver; }
            return true;
        });
    }
}

public class Quorum {
    public static boolean write(List<Replica> reps, Object v, long ver, int w) {
        List<CompletableFuture<Boolean>> fs = new ArrayList<>();
        for (Replica r : reps) fs.add(r.write(v, ver));
        int acks = 0;
        for (CompletableFuture<Boolean> f : fs) {
            try { if (f.get(200, TimeUnit.MILLISECONDS)) acks++; }
            catch (Exception ignored) {}
            if (acks >= w) return true;
        }
        return false;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <future>
#include <atomic>

struct Replica {
    std::atomic<long> version{0};
    std::atomic<int> value{0};
    bool write(int v, long ver) {
        if (ver > version.load()) { value.store(v); version.store(ver); }
        return true;
    }
    std::pair<int, long> read() const {
        return {value.load(), version.load()};
    }
};

bool quorum_write(std::vector<Replica>& reps, int v, long ver, int w) {
    std::vector<std::future<bool>> fs;
    for (auto& r : reps) fs.push_back(std::async(std::launch::async, [&]{ return r.write(v, ver); }));
    int acks = 0;
    for (auto& f : fs) if (f.get() && ++acks >= w) return true;
    return false;
}
```
