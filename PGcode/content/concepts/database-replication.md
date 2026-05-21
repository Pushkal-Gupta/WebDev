---
slug: database-replication
module: system-design
title: Database Replication
subtitle: Keep multiple copies of the data so reads scale out and a node failure isn't an outage.
difficulty: Intermediate
position: 9
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications, Chapter 5"
    url: ""
status: published
---

## intro
Replication keeps multiple copies of your data on multiple machines. The two goals: **availability** (survive a node going down) and **read scalability** (serve reads from replicas, not just the primary). Whether the replicas are exact mirrors, lagging followers, or peers with conflict resolution shapes everything else about your data model.

## whyItMatters
A single DB primary is a single point of failure and a fixed read-throughput ceiling. Replication unlocks both: failover when the primary dies, plus the ability to spread read traffic across followers. The hard parts are *consistency* (will a read on a follower see my last write?) and *failover* (who decides the primary is dead, and how does promotion happen without a split-brain?).

## intuition
Picture a chef and three line cooks. The chef writes new recipes on a master clipboard. Each cook periodically copies the master into their own clipboard so they can answer "what's in the special?" without asking the chef. If the chef collapses, you promote a line cook to chef — but you'd better make sure all the cooks agree which one, or you get two chefs writing different specials.

## visualization
```
Single-leader:
   writes ──► [Primary] ──replicates──► [Follower 1]  (serves reads)
                       └───────────────►[Follower 2]  (serves reads)

Multi-leader:
   writes ──► [Leader A] ◄──sync──► [Leader B] ◄── writes
   (conflicts resolved via LWW, vector clocks, CRDTs)
```

## bruteForce
One DB primary, no replicas. Works until it doesn't — first hardware failure or first scaling ceiling hit becomes a P0.

## optimal
Pick a topology:

- **Single-leader (most common)**: one primary accepts writes, replicates to N followers. Followers serve reads (eventually consistent). Failover via consensus (etcd/ZooKeeper) or managed service (RDS, Aurora). PostgreSQL, MySQL, MongoDB default.
- **Multi-leader**: multiple nodes accept writes, sync to each other. Necessary for multi-region active-active. Requires conflict resolution (LWW, vector clocks, CRDTs). Cassandra, DynamoDB, CouchDB.
- **Leaderless**: every node is equal. Reads/writes go to a quorum (`W + R > N`). Riak, Cassandra (also).

Pick replication mode:

- **Synchronous**: write returns only when at least one follower acknowledges. Strong durability, higher write latency.
- **Asynchronous**: primary acks immediately, replicates in the background. Lower latency, risk of data loss on primary crash.
- **Semi-synchronous**: at least one follower must ack, rest are async. Common compromise.

Handle **replication lag** (followers behind the primary):
- **Read-your-writes**: route the user's reads to the primary for a few seconds after a write, or to a follower that has caught up past the user's log position.
- **Monotonic reads**: pin a session to one follower so reads don't go backward in time.
- **Consistent prefix reads**: causally related writes (comment + reply) must replicate in order.

## complexity
- **Read throughput**: scales with N replicas for read-heavy workloads.
- **Write throughput**: single-leader is bottlenecked by the primary; multi-leader is bottlenecked by conflict resolution overhead.
- **Failover latency**: 5–30s with managed services; longer if manual.
- **Storage**: N× the data, but on cheap commodity disks this is usually fine.

## pitfalls
- **Reading from a stale follower right after writing**: the user posts a comment, refreshes, sees nothing. Implement read-your-writes.
- **Split-brain**: two nodes both think they're the primary, both accept writes, conflicting data. Use proper consensus (Raft/Paxos) — never DIY.
- **Failover storms**: follower promoted to primary still catching up, returns errors. Wait for sync before serving writes.
- **Async lag during peak load**: replication can fall behind by minutes under heavy writes. Monitor lag aggressively.
- **Backups treated as replicas**: a replica catches user-issued `DROP TABLE` mistakes too. Keep proper point-in-time backups separately.

## interviewTips
- Default to **single-leader async** unless the question pushes you elsewhere (multi-region writes → multi-leader; planet-scale linearizable → Spanner / consensus).
- Mention **read-your-writes consistency** when discussing UX after a write.
- For senior interviews, sketch the failover flow: heartbeat fails → consensus picks new leader → DNS / connection-pool re-routes.
- Distinguish **replication** (multiple copies, all same data) from **sharding** (single copy split across nodes). They're orthogonal — production usually has both.

## code.python
```python
# Sketch: route reads with replica-lag awareness.
import time
class ReplicaRouter:
    def __init__(self, primary, replicas, max_lag_ms=200):
        self.primary = primary; self.replicas = replicas; self.max_lag = max_lag_ms
    def read(self, query, just_wrote_at=None):
        # If user just wrote, route to primary for read-your-writes.
        if just_wrote_at and (time.time() * 1000 - just_wrote_at) < 1000:
            return self.primary.exec(query)
        fresh = [r for r in self.replicas if r.lag_ms() < self.max_lag]
        if not fresh: return self.primary.exec(query)
        return fresh[int(time.time()) % len(fresh)].exec(query)
```

## code.javascript
```javascript
// Read-your-writes: stash the last-write timestamp per session.
async function readWithRYW(session, query, pool) {
  const lastWrite = session.lastWriteAt || 0;
  if (Date.now() - lastWrite < 1000) return pool.primary.query(query);
  return pool.pickFreshReplica().query(query);
}
```

## code.java
```java
// Outline of failover detection via heartbeat.
class FailoverDetector {
    long lastBeat = System.currentTimeMillis();
    void heartbeat() { lastBeat = System.currentTimeMillis(); }
    boolean primaryAlive(long timeoutMs) {
        return System.currentTimeMillis() - lastBeat < timeoutMs;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <chrono>
struct Replica { long long lag_ms; bool fresh(long long max) { return lag_ms < max; } };
struct Router {
    std::vector<Replica*> replicas;
    Replica* primary;
    Replica* pick(long long maxLag, bool ryw) {
        if (ryw) return primary;
        for (auto* r : replicas) if (r->fresh(maxLag)) return r;
        return primary;
    }
};
```
