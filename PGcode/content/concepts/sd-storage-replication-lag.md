---
slug: sd-storage-replication-lag
module: sd-storage
title: Replication Lag & Read-Your-Own-Writes
subtitle: Async replicas serve stale reads. Read-your-own-writes, monotonic reads, bounded staleness — the four levels of replication-consistency.
difficulty: Intermediate
position: 70
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Replication chapter"
    url: "https://dataintensive.net/"
    type: book
  - title: "AWS Aurora — replica lag patterns"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "donnemartin/system-design-primer — Replication"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**Replication** copies data from a primary database to one or more replicas — for read scalability, geographic locality, and disaster recovery. **Asynchronous replication** means the primary commits a write before replicas have it; until they catch up, replica reads return **stale data**. The lag (ms to seconds) creates user-visible anomalies that must be designed around with session-consistency techniques.

## whyItMatters
- **Read scalability**: 1 primary + 10 replicas = 11× read throughput.
- **Geographic latency**: replica in user's region → 10ms vs 200ms cross-region.
- **The "I edited my profile but it didn't save" bug**: user writes to primary, immediately reads from a stale replica → sees old data → confusion.
- **Cascading lag** under bursts: replication queue grows; replicas fall further behind.

## intuition
Four levels of replication consistency from weakest to strongest:

1. **Eventual**: replicas converge eventually with no time bound. Default in most NoSQL.
2. **Read-your-own-writes (RYOW)**: after I write X, I (the same session) always see X. Other sessions may not.
3. **Monotonic reads**: I never see *older* data than data I've already seen. No "time travel" within a session.
4. **Bounded staleness**: replicas are at most N ms / N ops behind. Provides an SLO.
5. **Strong consistency**: all reads see the latest write. Linearizability. Most expensive.

Each level handles a class of user-visible anomalies but costs more to implement.

## visualization
```
Primary:   timestep 0: A = 1
           timestep 1: A = 2 (write)
           timestep 2: A = 3 (write)

Replica:   timestep 0: A = 1
           timestep 1: A = 1  (lagging)
           timestep 2: A = 2  (caught up to write 1)
           timestep 3: A = 3  (caught up to write 2)

User session timeline:
  t=1: write A=2 → primary accepts
  t=1.1: read A from replica → returns 1 (stale!)

RYOW fix: read after write from the SAME replica that received the write,
  OR pin reads to primary for N seconds after write,
  OR use timestamp/sequence-number to wait for replica to catch up.

Monotonic reads fix: pin user's session to a specific replica or a replica with
  monotonically increasing timestamp.
```

## bruteForce
**Always read from primary**: kills read scalability.

**Always read from any replica, accept stale data**: user-visible anomalies; common in poorly-built dashboards.

**Sleep N ms after write before next read**: brittle and slow.

The right answer is session-aware routing + sequence numbers.

## optimal
**Read-your-own-writes patterns**:

1. **Read-after-write pinning**: after a user writes, route their next reads to the primary for X seconds.
2. **LSN-based** (Log Sequence Number): primary returns LSN with write; client sends LSN with read; replica waits until its LSN ≥ requested before responding.
3. **Sticky sessions to one replica**: all reads in a session go to the same replica. Avoids monotonic-read violations.
4. **Versioned reads**: write returns a version; subsequent reads include "version ≥ X" filter; reject stale replicas.

**Monotonic reads patterns**:
- Pin session to one replica.
- Use replica that's caught up to the highest version this session has seen.

**Bounded staleness patterns** (Cosmos DB, DynamoDB Global Tables):
- Replica reads include staleness header; queries that need fresher data go to primary.

**Production tools**:
- **Postgres**: streaming replication; `synchronous_commit = on` for synchronous; `pg_stat_replication` to monitor lag.
- **MySQL**: GTID-based replication; ProxySQL for session pinning.
- **MongoDB**: replica sets with `readPreference` and `readConcern`.
- **DynamoDB Global Tables**: multi-region; default eventual; opt-in strongly-consistent reads (slower).

**Monitoring**:
- `replica lag bytes` (Postgres `pg_current_wal_lsn() - replay_lsn`).
- `replica lag seconds` (Aurora `AuroraReplicaLag` CloudWatch metric).
- Alert if lag > SLO (typically 1s or 5s).

## complexity
- **Typical replica lag** (LAN): single-digit ms.
- **Cross-region lag**: 100-500ms.
- **Lag under burst write load**: can climb to seconds or minutes; recovers when burst ends.
- **Strong consistency cost**: 2-3x latency of eventual reads (need consensus round-trip).

## pitfalls
- **Assuming "real-time" replica reads.** Async replicas lag — period. Fix: design every read path either tolerant of staleness OR explicitly using RYOW.
- **No lag monitoring.** Operators discover lag only when users complain. Fix: alert on `replica_lag > X` (typically 1s for OLTP, 30s for analytics replicas).
- **Failing over to a lagging replica during outage.** Replica becomes primary with missing recent writes → data loss. Fix: use synchronous replication for the failover replica, OR explicit "promote only if lag = 0" check.
- **Session-affinity broken by load balancer.** LB hashes requests to different replicas → monotonic reads violated. Fix: sticky sessions by user_id hash; or pass LSN with each read.
- **Read-from-replica for transactions that read-modify-write.** Reading from replica then writing to primary based on stale value → lost update. Fix: do RMW transactions entirely on the primary, or use optimistic concurrency control with version checks.
- **Forgetting "after the write" the OS may not have flushed.** Even synchronous replication has a tiny window if not waiting for fsync on replicas. Fix: configure `synchronous_commit = remote_apply` (Postgres) for true durability.

## interviewTips
- For "we want read scalability" → primary + read replicas, but discuss lag + RYOW.
- Cite the **four consistency levels** as the menu.
- For senior interviews, discuss **LSN-based RYOW**, **sticky session routing**, **synchronous vs async replication trade-offs**, **multi-master vs single-leader**, **conflict resolution** (LWW vs CRDT).

## code.python
```python
# RYOW pattern: route reads to primary for N seconds after write
import time
class DBRouter:
    def __init__(self, primary, replicas):
        self.primary = primary
        self.replicas = replicas
        self.last_write = {}   # user_id -> timestamp
    def write(self, user_id, query):
        self.primary.execute(query)
        self.last_write[user_id] = time.time()
    def read(self, user_id, query):
        if time.time() - self.last_write.get(user_id, 0) < 5:
            return self.primary.execute(query)    # route to primary
        replica = random.choice(self.replicas)
        return replica.execute(query)
```

## code.javascript
```javascript
// LSN-based RYOW with Postgres
const pg = require('pg');
const primary = new pg.Pool({ host: 'primary' });
const replica = new pg.Pool({ host: 'replica' });

async function writeAndReadBack(query, params) {
  const { rows: [{ lsn }] } = await primary.query(`${query} RETURNING pg_current_wal_lsn() AS lsn`, params);
  // Wait for replica to catch up
  for (let i = 0; i < 50; i++) {
    const { rows: [{ replay_lsn }] } = await replica.query("SELECT pg_last_wal_replay_lsn() AS replay_lsn");
    if (replay_lsn >= lsn) break;
    await new Promise(r => setTimeout(r, 20));
  }
  return replica.query('SELECT ...');
}
```

## code.java
```java
// MongoDB read-your-own-writes via causal consistency
import com.mongodb.client.*;
MongoClient client = MongoClients.create("mongodb://...");
try (ClientSession session = client.startSession()) {
    MongoDatabase db = client.getDatabase("app");
    MongoCollection<Document> coll = db.getCollection("users");
    coll.insertOne(session, new Document("name", "Alice"));
    // Subsequent reads in this session see the write
    FindIterable<Document> result = coll.find(session, eq("name", "Alice"));
}
```

## code.cpp
```cpp
// Conceptual: per-user lastWriteTime tracker
class DBRouter {
    DB* primary;
    std::vector<DB*> replicas;
    std::unordered_map<UserId, std::chrono::steady_clock::time_point> lastWrite;
public:
    void write(UserId uid, const Query& q) {
        primary->execute(q);
        lastWrite[uid] = std::chrono::steady_clock::now();
    }
    Result read(UserId uid, const Query& q) {
        auto it = lastWrite.find(uid);
        if (it != lastWrite.end() && now() - it->second < std::chrono::seconds(5))
            return primary->execute(q);
        return pickReplica()->execute(q);
    }
};
```
