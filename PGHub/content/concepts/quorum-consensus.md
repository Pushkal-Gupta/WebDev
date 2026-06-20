---
slug: quorum-consensus
module: sd-consensus
title: Quorum Consensus
subtitle: Tune consistency with R + W > N — Dynamo-style sloppy quorums and hinted handoff.
difficulty: Advanced
position: 7
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
Replicate every key to N nodes. A read contacts R of them and a write contacts W of them. If R + W > N, every read sees at least one node that participated in the most recent successful write — so the freshest copy is guaranteed to be in the response set. That single inequality is the heart of Dynamo, Cassandra, and Riak's tunable consistency.

## whyItMatters
Strong consistency (Paxos, Raft) costs latency and availability. Eventual consistency is fast but surprises developers. Quorum consensus lets the operator dial the trade-off per workload: a metrics ingester might pick W=1 for write throughput, while a user-profile store picks R=W=2 with N=3 for read-your-writes. Same database, different SLAs.

## intuition
Picture three replicas as three filing cabinets holding copies of every record. A write only counts as durable when at least W cabinets acknowledge. A read collects answers from R cabinets and takes the most recent version (highest timestamp or vector clock). If R + W > N, the read set and the most-recent write set must share at least one cabinet — the freshest record is always in your hands. If R + W <= N, you can read stale data because no cabinet overlap is guaranteed.

## visualization
```
N = 3 replicas:  [R1] [R2] [R3]

W = 2 write quorum               R = 2 read quorum
ack from R1, R2                  query R2, R3
   ^^                              ^^
   |                               |
   +------ overlap on R2 ----------+
   read sees the new value (R + W = 4 > 3)

Sloppy quorum: R1 is down → write to R2, R3, plus "hinted" copy on R4
later when R1 recovers, R4 hands its hint back (hinted handoff)
```

## bruteForce
Write to all N replicas synchronously and read from any one. Strong consistency, but a single slow or dead replica blocks every write. Availability tanks under partial failures, which is exactly what AP datastores exist to avoid.

## optimal
Pick N (replication factor), R (read quorum), W (write quorum) with R + W > N for strong consistency or R + W <= N for higher availability. Each write carries a version (vector clock or timestamp); reads merge versions and either pick the latest or return concurrent versions to the client for resolution (Dynamo's "siblings").

Pseudocode:
```
put(key, value):
    version = newVersion(key)
    sent = parallelSend(preferenceList[:N], key, value, version)
    wait until W acks  -> success
    on timeout         -> fail

get(key):
    replies = parallelSend(preferenceList[:N], key)
    wait until R replies
    return reconcile(replies)   # latest version, or siblings if concurrent
```

Sloppy quorum: if a top-N node is unreachable, send the write to the next healthy node with a "hint" naming the intended owner. When that owner returns, the hint holder replays the write — this is **hinted handoff**. It preserves availability at the cost of temporary inconsistency that anti-entropy (Merkle-tree repair) and read-repair fix in the background.

## complexity
- **Write latency**: dominated by the W-th slowest replica.
- **Read latency**: dominated by the R-th slowest replica.
- **Network**: every op fans out to N nodes; bandwidth scales linearly with N.
- **Storage**: N copies of every key.
- **Tail latency**: W=1 or R=1 unlocks "speculative" execution — return as soon as the fastest replica replies. Common Dynamo trick.

## pitfalls
- **Forgetting R + W > N is not linearizability** — it only guarantees you see *some* recent write, not a total order. Concurrent writes still produce siblings.
- **Using timestamps from unsynced clocks** for conflict resolution. NTP skew silently loses writes. Use vector clocks or hybrid logical clocks.
- **Sloppy quorum without hinted handoff** — writes succeed but never reach the real owners, and reads from the preference list miss them.
- **Tuning W = N for "safety"** — kills write availability the moment any node hiccups. Defeats the point of an AP store.
- **Ignoring read-repair**: divergent replicas stay divergent until a client reads the key. Schedule background anti-entropy.

## interviewTips
- State the inequality first: "R + W > N gives strong consistency for the read; R + W <= N is eventual."
- Mention common settings: N=3, R=2, W=2 (balanced); N=3, W=1, R=3 (fast writes); N=3, W=3, R=1 (fast reads, slow writes).
- Bring up **sloppy quorum + hinted handoff** for the availability question — it's the move that distinguishes Dynamo from naive replication.
- Cassandra exposes this directly via `CONSISTENCY ONE | QUORUM | ALL` per query — call that out if asked about real systems.

## code.python
```python
class QuorumStore:
    def __init__(self, replicas, N=3, R=2, W=2):
        self.replicas = replicas
        self.N, self.R, self.W = N, R, W

    def put(self, key, value):
        version = max((r.version(key) for r in self.replicas[:self.N]), default=0) + 1
        acks = 0
        for r in self.replicas[:self.N]:
            if r.write(key, value, version):
                acks += 1
                if acks >= self.W:
                    return True
        return False

    def get(self, key):
        replies = []
        for r in self.replicas[:self.N]:
            v = r.read(key)
            if v is not None:
                replies.append(v)
                if len(replies) >= self.R:
                    break
        if not replies:
            return None
        return max(replies, key=lambda x: x.version)
```

## code.javascript
```javascript
class QuorumStore {
  constructor(replicas, N = 3, R = 2, W = 2) {
    Object.assign(this, { replicas, N, R, W });
  }
  async put(key, value) {
    const version = Math.max(0, ...this.replicas.slice(0, this.N).map(r => r.version(key))) + 1;
    let acks = 0;
    for (const r of this.replicas.slice(0, this.N)) {
      if (await r.write(key, value, version)) {
        if (++acks >= this.W) return true;
      }
    }
    return false;
  }
  async get(key) {
    const replies = [];
    for (const r of this.replicas.slice(0, this.N)) {
      const v = await r.read(key);
      if (v != null) {
        replies.push(v);
        if (replies.length >= this.R) break;
      }
    }
    return replies.reduce((best, v) => (!best || v.version > best.version ? v : best), null);
  }
}
```

## code.java
```java
import java.util.*;
class QuorumStore {
    final List<Replica> replicas; final int N, R, W;
    QuorumStore(List<Replica> r, int N, int R, int W) { this.replicas = r; this.N = N; this.R = R; this.W = W; }
    boolean put(String key, String value) {
        long version = replicas.subList(0, N).stream().mapToLong(r -> r.version(key)).max().orElse(0) + 1;
        int acks = 0;
        for (Replica r : replicas.subList(0, N)) {
            if (r.write(key, value, version) && ++acks >= W) return true;
        }
        return false;
    }
    Versioned get(String key) {
        List<Versioned> replies = new ArrayList<>();
        for (Replica r : replicas.subList(0, N)) {
            Versioned v = r.read(key);
            if (v != null) { replies.add(v); if (replies.size() >= R) break; }
        }
        return replies.stream().max(Comparator.comparingLong(v -> v.version)).orElse(null);
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <algorithm>
struct Versioned { std::string value; long version; };
struct QuorumStore {
    std::vector<Replica*> replicas; int N, R, W;
    bool put(const std::string& key, const std::string& value) {
        long version = 0;
        for (int i = 0; i < N; ++i) version = std::max(version, replicas[i]->version(key));
        ++version;
        int acks = 0;
        for (int i = 0; i < N; ++i) {
            if (replicas[i]->write(key, value, version) && ++acks >= W) return true;
        }
        return false;
    }
    Versioned get(const std::string& key) {
        std::vector<Versioned> replies;
        for (int i = 0; i < N && (int)replies.size() < R; ++i) {
            auto v = replicas[i]->read(key);
            if (!v.value.empty()) replies.push_back(v);
        }
        Versioned best{};
        for (auto& v : replies) if (v.version > best.version) best = v;
        return best;
    }
};
```
