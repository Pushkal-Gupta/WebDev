---
slug: read-replica-quorum
module: sd-storage
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

What's actually happening is a pigeonhole argument turned into a tuning dial. With N total copies, a write touches some set of W of them and a read touches some set of R of them; if W + R exceeds N, those two sets cannot be disjoint — by counting alone they must share at least one node, and that shared node has the latest write, so the read is guaranteed to see it. Drop below the line and the guarantee evaporates. Make it concrete with N=3. Set W=2, R=2: every write lands on 2 of 3, every read consults 2 of 3, and any read and any write overlap in at least one node (2+2=4 > 3) — strong consistency, and the system still serves both reads and writes with one node down. Now set W=1, R=1 for raw speed: a write acks after touching a single replica, ~1 ms, and a read consults a single replica, also ~1 ms, but the two may pick different nodes and the reader sees a value from before the write — eventual consistency. The same three machines give you linearizable or stale behavior depending purely on where you set W and R; you are not changing the hardware, only how much overlap you demand.

## visualization
N=5 replicas. Overlap holds when R + W > N (here 6 > 5):

```
config       W  R  R+W  overlap?   writes survive   reads survive
strong       3  3   6   yes (>=1)     2 down           2 down
write-fast   1  5   6   yes           4 down           0 down
read-fast    5  1   6   yes           0 down           4 down
eventual     1  1   2   NO            4 down           4 down (may be stale)

write v=9 to {r1,r2,r3}; read from {r3,r4,r5}: sets share r3 -> read sees v=9.
write v=9 to {r1};        read from {r2}:       disjoint      -> read sees stale.
```

## bruteForce
Single-leader replication: one node is the primary, all writes go through it, reads from any replica. Simple to reason about, but the leader is a single point of failure and reads from a stale replica need explicit hint ("read-your-own-writes"). When the leader fails, you need a leader-election protocol (Raft, Paxos) that itself uses quorums.

## optimal
Pick (N, W, R) based on workload:
- **Strong consistency, balanced load**: N=3, W=2, R=2 — survives 1 node failure, both ops do 2/3 work.
- **Write-heavy, read-rare**: N=3, W=1, R=3 — writes are 1-replica fast, reads do conflict resolution.
- **Read-heavy, low staleness tolerance**: N=3, W=3, R=1 — reads are 1-replica fast, writes require all-up.
- **Best availability (eventually consistent)**: N=3, W=1, R=1 — both fast, may read stale data.

On read, resolve conflicts via version vectors / last-write-wins timestamps / application-level merge (CRDTs). Use read-repair to lazily update stale replicas. For network-partition tolerance, prefer "sloppy quorum + hinted handoff": write to any W reachable nodes, even outside the home replica set, and hand off when partitioned nodes recover.

The reasoning that ties the four presets together: W and R are independent latency/consistency dials on the same replica set, and you set them per workload rather than once globally. A read-heavy service with low staleness tolerance pushes cost onto the rare write (W=N, R=1) so reads are single-replica fast; a write-heavy ingestion path does the opposite (W=1, R=N). The failure modes are the subtle part. First, R + W > N guarantees you *read* the latest write but says nothing about *ordering* concurrent writes — two clients writing different values to the same key at the same instant both satisfy the quorum, and you are left with a conflict that last-write-wins timestamps (fragile under clock skew) or version vectors / CRDTs (correct but heavier) must resolve. Second, "sloppy quorum" — Dynamo's availability trick of writing to any W reachable nodes during a partition, even non-owners, then handing off when the owners recover — widens availability but means the W nodes that acked may not be the canonical owners, so a strict quorum read right after can still miss the value. Third, high R multiplies read traffic: R=3 means every logical read is three physical reads downstream, so a read-heavy quorum can saturate the cluster faster than the write path does.

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
