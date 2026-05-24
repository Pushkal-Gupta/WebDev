---
slug: pacelc-theorem
module: system-design
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
Imagine a globally-distributed bank. During a network split between regions, you either reject writes (consistency wins) or accept them in both halves and reconcile later (availability wins) — that's CAP. But even when the network is fine, do you wait for every replica to ack a write (consistency, slow) or return after the local replica writes (latency, fast — and risk reading stale data on another node)? PACELC names that second knob.

## visualization
A 2x2 grid: rows = "Partition" (P) vs "Else" (E); columns = pick {A vs C} (top row) or {L vs C} (bottom row). Cassandra plots at PA/EL — gives up consistency in both modes. HBase plots at PC/EC — consistent always, but slow and unavailable under partition. Spanner plots at PC/EC too, but uses atomic clocks (TrueTime) to keep the "EC" latency cost manageable.

## bruteForce
The naive design: pick one of CAP's three letters and stop thinking. This produces the classic blunder of choosing "CP" without realizing every write still needs synchronous replication to a majority of nodes — every transaction now pays cross-AZ or cross-region latency that the product team didn't budget for. The brute-force fix is to over-provision and pray, which works until the read-tail latency surfaces in a customer complaint.

## optimal
Make the PACELC choice explicitly for each workload, not the whole platform. Order-of-record (payments, inventory decrements) belongs in a PC/EC store with synchronous quorum. Session data, recommendations, and feeds belong in a PA/EL store with eventual consistency and read-your-writes session guarantees. Document the choice in the service's README so the next engineer doesn't accidentally pile a strongly-consistent workload onto an eventually-consistent system.

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
