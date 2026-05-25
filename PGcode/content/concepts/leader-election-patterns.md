---
slug: leader-election-patterns
module: sd-consensus
title: Leader Election Patterns
subtitle: Picking one coordinator from N peers — ZooKeeper ephemeral nodes, Etcd lease, Redis SETNX, Raft. Failover semantics + split-brain prevention.
difficulty: Advanced
position: 64
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Consensus & coordination"
    url: "https://dataintensive.net/"
    type: book
  - title: "ZooKeeper recipes — leader election"
    url: "https://zookeeper.apache.org/doc/current/recipes.html#sc_leaderElection"
    type: blog
  - title: "etcd-io/etcd — leader election example"
    url: "https://github.com/etcd-io/etcd/tree/main/client/v3/concurrency"
    type: repo
status: published
---

## intro
Many distributed jobs only one node should do at a time: assign work, run a cron, advance a state machine, write to a primary DB. **Leader election** picks one node as leader; the others stand by. If the leader crashes, the rest elect a new one. The hard parts: ensuring **at most one leader at any time**, fast failover, and surviving network partitions.

## whyItMatters
Without a single coordinator:
- Two jobs run the same cron → duplicate side effects.
- Two writers accept conflicting writes → data corruption.
- Two schedulers assign overlapping work → race conditions.

With unsafe leader election:
- **Split brain**: two leaders during a partition → worse than no election.

Reliable leader election is a foundation primitive used by Kafka (controller), Postgres (Patroni HA), Kubernetes (controller manager), every distributed scheduler.

## intuition
Three common implementations:

**1. ZooKeeper ephemeral sequential node**:
- Each candidate creates `/election/node_` with `EPHEMERAL_SEQUENTIAL` flag → gets unique sequence number.
- Leader = node with lowest seq number.
- Others watch the node immediately preceding them; on its deletion, re-check.
- Ephemeral = ZK session death → node auto-deleted → re-election.

**2. Etcd lease + key**:
- Candidate acquires a lease (TTL=10s, auto-renewed).
- Tries `PUT /leader/myrole = me` with `If-Not-Exists` + lease attached.
- If success → leader. Else watch the key.
- Lease expires (process died) → key deleted → others compete.

**3. Redis SETNX with TTL**:
- Try `SET leader:role node-id NX PX 10000`.
- If OK → leader; periodically extend TTL.
- Else → watcher.
- **Fundamentally unsafe** for correctness-critical work due to clock skew + delayed messages (see Martin Kleppmann's "How to do distributed locking"). OK for cron dedup; not for resource ownership.

**4. Raft / Paxos in-process**:
- Cluster of N nodes; consensus protocol elects leader.
- The strongest semantics; used by Etcd / Consul / CockroachDB internally.

## visualization
```
ZooKeeper-based:
  Node A creates /election/node_0001
  Node B creates /election/node_0002
  Node C creates /election/node_0003
  Leader = lowest seq = A (node_0001)
  B watches A. C watches B.

  A's session dies → ZK deletes /election/node_0001
  B's watcher fires → B re-checks → lowest is now B → B is leader.
  C still watches B (no change for C).

Failover sequence:
  T+0  : A is leader
  T+10 : A's network blip → ZK session timeout
  T+12 : ZK deletes A's ephemeral node
  T+12 : B's watcher fires, B becomes leader
  T+13 : Job that A was running picked up by B (using fencing tokens)

Split-brain prevention:
  A still thinks it's leader (didn't know ZK timed it out)
  → A writes to DB with fencing_token=1
  → B writes to DB with fencing_token=2
  → DB rejects A's writes (token < current)
```

## bruteForce
**No election; first to start is leader**: can't fail over.

**Manual configuration (`is_leader: true` in config)**: requires human intervention on failure.

**Highest-IP heuristic**: works in stable cluster, breaks under churn / IP changes.

Proper election uses a coordination service (ZK / Etcd / Consul) or in-process consensus.

## optimal
**Use a proven coordinator** — don't roll your own. Choose:
- **ZooKeeper**: battle-tested; ephemeral nodes + watches are the canonical leader election primitive.
- **Etcd**: HTTP/gRPC API; leases + revisions; powers Kubernetes.
- **Consul**: HashiCorp's; integrates with service discovery.
- **In-process Raft** (hashicorp/raft, etcd/raft): when you don't want external dep.

**Fencing tokens**:
- Coordinator returns a monotonic token (ZooKeeper zxid, Etcd revision, Raft term).
- Leader includes token in every write to downstream resources.
- Resources reject writes with stale tokens → prevents split-brain damage.

**Lease renewal**: leader periodically refreshes its lease at TTL/2 or TTL/3. Network delay budget = TTL - refresh interval.

**Leader stickiness**: avoid frequent re-elections. Use `session_timeout = 10-30s` (not 1s) so transient network blips don't trigger failover.

## complexity
- **Election latency**: 1 RTT to coordinator + failure detection time. Typically 10-30s for ZK-based, sub-second for in-process Raft.
- **Coordinator load**: hundreds of leases per coordinator OK; thousands need sharding.
- **Failure detection budget**: TTL = `2 × network_RTT + max_gc_pause`. Too low = flapping; too high = slow failover.

## pitfalls
- **No fencing tokens**: split brain corrupts data even with single-leader election. Always fence downstream writes.
- **Clock-based locks** (Redis SETNX without fencing): unsafe — clock skew + GC pause = lost lock + zombie leader writing concurrently.
- **GC pause longer than TTL**: leader pauses 30s, lease expires, new leader elected; old leader wakes up, writes blindly. Always fence.
- **Single ZK / Etcd**: coordinator down = no election possible. Run ZK ensemble of 3-5; Etcd cluster of 3-5.
- **Leader doing too much**: bottleneck. Keep leader's job narrow (coordinate, don't process).
- **Network partition**: minority partition can't elect; majority can. Use odd-numbered clusters.

## interviewTips
- For "how do you pick one of N nodes to run a job" → ZK ephemeral nodes / Etcd lease / Raft in-process.
- Mention **fencing tokens** as the safety net against split-brain.
- For senior interviews, discuss **lease semantics**, **failure detection budgets**, **Raft vs ZAB**, **Kleppmann's critique of Redlock**.

## code.python
```python
# Etcd-based leader election (etcd3 client)
import etcd3
client = etcd3.client()
election = client.election("/myapp/leader")

# Block until elected
election.campaign(value=hostname, ttl=10)
print("I am the leader")

try:
    while running:
        do_leader_work(fencing_token=election.observe().revision)
        time.sleep(1)
finally:
    election.resign()
```

## code.javascript
```javascript
// Node etcd3 client — same shape
const { Etcd3 } = require('etcd3');
const client = new Etcd3();
const election = client.election('myapp-leader');
const campaign = election.campaign(hostname);
campaign.on('elected', () => {
  console.log('elected leader');
  // include campaign.leader.revision as fencing token in downstream writes
});
campaign.on('error', console.error);
```

## code.java
```java
// Apache Curator (ZooKeeper recipes)
LeaderSelector selector = new LeaderSelector(curatorFramework, "/election", new LeaderSelectorListenerAdapter() {
    @Override
    public void takeLeadership(CuratorFramework client) throws Exception {
        while (running) doLeaderWork();
    }
});
selector.autoRequeue();
selector.start();
```

## code.cpp
```cpp
// etcd C++ client — campaign for leader, observe key with revision as fencing token.
// Use the gRPC API: Lease grant → Put key with lease → KeepAlive heartbeat.
```
