---
slug: pacelc-theorem
module: sd-storage
title: PACELC Theorem
subtitle: Beyond CAP — what your database trades off when the network is healthy.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Replication and Consistency"
    url: "https://dataintensive.net/"
    type: book
  - title: "CAP Theorem — Martin Fowler"
    url: "https://martinfowler.com/bliki/CAP.html"
    type: blog
  - title: "Jepsen — Consistency Models"
    url: "https://jepsen.io/consistency"
    type: blog
status: published
---

## intro
PACELC extends the famous CAP theorem with a second clause: *if* a network Partition occurs, you must choose between Availability and Consistency; *else* when the system is running normally, you still trade Latency against Consistency. The "ELC" half is the part most engineers ignore — and it is the part that dominates real-world database design, because partitions are rare but every read and write has latency.

## whyItMatters
CAP alone leads to a false comfort: "we picked CP, so we're consistent." But CAP only describes behavior during a partition. Outside of failure mode, a strongly-consistent system still pays a coordination cost (quorum reads, leader round-trips) that adds tens of milliseconds per operation. PACELC forces you to name both trade-offs honestly: a PC/EC system is strictly consistent always; a PA/EL system is fastest and most available but loosest. Most modern databases (Cassandra, DynamoDB) are PA/EL.

## intuition
The original CAP theorem (Brewer, 2000; Gilbert and Lynch's formal proof, 2002) only talks about behavior **during a network partition**: when nodes cannot communicate, you must choose either to keep accepting writes (Availability, returning the local view) or to refuse writes (Consistency, preserving a single global truth). This framing led to a decade of "we picked CP, so we're consistent" marketing — which is technically true but ignores that partitions are rare events. Engineers were optimizing for the wrong axis.

Daniel Abadi's 2010 paper "Problems with CAP, and Yahoo's Little Known NoSQL System" introduced PACELC to make the silent trade-off explicit. The framework reads: **if** a Partition occurs, choose between Availability and Consistency (the original CAP); **else** when the system is running normally, you still trade Latency against Consistency. The "ELC" clause captures the everyday cost: even with a healthy network, a strongly-consistent system has to coordinate across replicas (quorum reads, leader round-trips) that add tens to hundreds of milliseconds per operation. That latency is paid on every read and write, not just during the rare partition.

The two trade-offs are independent. A database can pick PA (available under partition) but also EC (consistent when healthy) — Riak with sloppy quorum is the textbook example. Or PC (consistent under partition) and EL (low-latency when healthy) — this is rarer, but some MongoDB configurations approximate it. The honest answer for most modern NoSQL stores (Cassandra, DynamoDB) is **PA/EL** — both halves trade consistency for availability and speed. Spanner is the famous **PC/EC** outlier; it uses TrueTime atomic clocks to keep the EC latency cost manageable, but writes still pay a global commit round-trip.

The takeaway: pick PACELC explicitly per workload. Order-of-record (payments, inventory decrements) belongs in PC/EC stores. Session data, recommendations, feeds, telemetry belong in PA/EL stores with session-level read-your-writes guarantees. Mixing the two in one transaction requires a saga or outbox pattern to bridge the consistency gap.

## visualization
A 2x2 grid: rows = "Partition" (P) vs "Else" (E); columns = pick {A vs C} (top row) or {L vs C} (bottom row). Cassandra plots at PA/EL — gives up consistency in both modes. HBase plots at PC/EC — consistent always, but slow and unavailable under partition. Spanner plots at PC/EC too, but uses atomic clocks (TrueTime) to keep the "EC" latency cost manageable.

## bruteForce
The naive design: pick one of CAP's three letters and stop thinking. This produces the classic blunder of choosing "CP" without realizing every write still needs synchronous replication to a majority of nodes — every transaction now pays cross-AZ or cross-region latency that the product team didn't budget for. The brute-force fix is to over-provision and pray, which works until the read-tail latency surfaces in a customer complaint.

## optimal
The right architectural discipline is **per-workload PACELC selection plus documented session-level guarantees**, not a one-size-fits-all platform pick. Daniel Abadi's original paper, Werner Vogels's "Eventually Consistent" piece, and Kyle Kingsbury's Jepsen analyses all converge on this: name the quadrant per service, document the consistency model in the README, and use bridge patterns (saga, outbox, CDC) when mixing quadrants in one user-visible transaction.

```
Quadrant   | Examples                       | Workloads
-----------+--------------------------------+----------------------------------
PC / EC    | Spanner, FoundationDB, HBase,  | Payments ledger, inventory
           | CockroachDB (default), etcd    | decrements, sequence generation,
           |                                | leader election state
PC / EL    | MongoDB w/ readPreference      | Rare — usually a misconfiguration;
           | secondaryPreferred + majority  | session-stickiness apps that
           | writes                         | tolerate stale reads only when
           |                                | network is healthy
PA / EC    | Riak w/ sloppy quorum,         | Multi-region writeable caches,
           | Dynamo paper's design          | shopping carts that prioritize
           |                                | availability + want strong reads
           |                                | when healthy
PA / EL    | Cassandra, DynamoDB,           | Session data, feeds, telemetry,
           | Couchbase, Voldemort,          | analytics, recommendations,
           | Redis Cluster                  | user activity logs
```

Concrete decision algorithm:

```python
def choose_store(workload):
    # Linearizability hard requirement: lost-update equals lost money.
    if workload.requires_linearizable_writes:
        return "PC/EC: Spanner, CockroachDB, or FoundationDB"
    # Tolerates seconds of staleness, needs sub-50ms p99 reads/writes:
    if workload.tolerates_stale_reads and workload.p99_budget_ms < 50:
        return "PA/EL: Cassandra or DynamoDB with session-token reads"
    # Wants strong reads when healthy but must accept writes during partition:
    if workload.partition_tolerance_required and workload.strong_when_healthy:
        return "PA/EC: Riak w/ sloppy quorum + read-repair"
    return "PC/EC by default (Spanner-style) — safer for mixed workloads"
```

Why this is right: it forces the architect to name **both** trade-offs — partition behavior AND steady-state latency — rather than picking from CAP's three letters and silently absorbing the EL cost. The PC/EC quadrant escapes the latency penalty only with specialized hardware (Spanner's TrueTime atomic clocks, FoundationDB's two-phase commit on coordinators); without that infrastructure, expect 10-100 ms cross-AZ latency on every write.

**Modern escape hatches**:
- **Hybrid Logical Clocks (HLC)** — Kulkarni, Demirbas (2014); used by CockroachDB and YugabyteDB to approximate Spanner-style consistency without atomic clocks. EC cost is reduced but not eliminated.
- **Causal+ consistency** (Lloyd et al., COPS 2011; Cassandra's LWT, Riak's `causal-context`) — gives session-level guarantees stronger than eventual, weaker than linearizable, at much lower latency than EC.
- **Bounded staleness** (Cosmos DB, Spanner stale reads) — pick a freshness bound (e.g. "no older than 5 seconds") and the system serves reads from local replicas within that bound. Pareto-optimal for many feed/timeline workloads.

**Anti-pattern**: assuming consensus protocols (Raft, Paxos) make a system "EC by default." They make committed log entries linearizable, but **reads** can still serve stale data unless you explicitly force a linearizable read (Raft `ReadIndex`, Paxos read-quorum). Spanner's bounded-stale reads exist precisely to let you opt out of the EC tax when the workload allows it.

## complexity
time: O(1) per decision; O(network RTT) per operation in the EC half.
space: N/A (this is an architectural framework).
notes: A quorum write across N replicas with W=majority needs W round-trips in parallel — latency is bounded by the slowest of W replicas, which under tail-latency models can be 10x the median.

## pitfalls
- Treating "eventually consistent" as "consistent after a small delay" — without bounds it can be seconds or longer under load.
- Forgetting that read-your-writes is a separate session-level guarantee layered on top of EL stores.
- Mixing PC and PA stores in the same transaction without a saga or outbox to glue them.
- Assuming consensus protocols (Raft, Paxos) make a system "EC by default" — they make it EC only for committed log entries; reads can still serve stale data unless you force a linearizable read.

## interviewTips
- When asked "CAP for X," answer in PACELC: "It's PC/EC because writes go through a single leader with synchronous quorum."
- Name a real database for each quadrant — PC/EC: Spanner, HBase. PA/EL: Cassandra, DynamoDB. PA/EC: Riak with sloppy quorum. PC/EL: rare; some configurations of MongoDB.
- Mention TrueTime / hybrid logical clocks as the modern escape hatch that buys consistency without the full latency hit.

## code.python
```python
def choose_store(workload):
    if workload.requires_linearizable_writes:
        return "PC/EC: Spanner or HBase"
    if workload.tolerates_stale_reads and workload.needs_low_latency:
        return "PA/EL: Cassandra or DynamoDB"
    if workload.needs_availability_under_partition:
        return "PA/EC: Riak with sloppy quorum"
    return "PC/EL: rare — only specialized configs"
```

## code.javascript
```javascript
function chooseStore(workload) {
  if (workload.requiresLinearizableWrites) return "PC/EC: Spanner or HBase";
  if (workload.tolerantOfStaleReads && workload.needsLowLatency) return "PA/EL: Cassandra or DynamoDB";
  if (workload.needsAvailabilityUnderPartition) return "PA/EC: Riak with sloppy quorum";
  return "PC/EL: rare — only specialized configs";
}
```

## code.java
```java
public String chooseStore(Workload w) {
    if (w.requiresLinearizableWrites()) return "PC/EC: Spanner or HBase";
    if (w.tolerantOfStaleReads() && w.needsLowLatency()) return "PA/EL: Cassandra or DynamoDB";
    if (w.needsAvailabilityUnderPartition()) return "PA/EC: Riak with sloppy quorum";
    return "PC/EL: rare — only specialized configs";
}
```

## code.cpp
```cpp
std::string chooseStore(const Workload& w) {
    if (w.requiresLinearizableWrites) return "PC/EC: Spanner or HBase";
    if (w.tolerantOfStaleReads && w.needsLowLatency) return "PA/EL: Cassandra or DynamoDB";
    if (w.needsAvailabilityUnderPartition) return "PA/EC: Riak with sloppy quorum";
    return "PC/EL: rare — only specialized configs";
}
```
