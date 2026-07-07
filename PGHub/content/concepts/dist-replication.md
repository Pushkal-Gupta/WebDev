---
slug: dist-replication
module: distributed-systems
title: Replication and Quorums
subtitle: Copies of the data on many machines — leader-follower versus quorums, the W+R>N rule, conflict resolution, and replication lag.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 17
prereqs: [dist-cap-consistency, dist-time-clocks]
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 5: Replication"
    url: "https://dataintensive.net/"
    type: book
  - title: "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store (quorums, W/R/N, version vectors)"
    url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
    type: article
  - title: "Designing Data-Intensive Applications — Chapter 6: Partitioning (rebalancing and routing)"
    url: "https://dataintensive.net/"
    type: book
  - title: "Werner Vogels — Eventually Consistent (ACM Queue)"
    url: "https://queue.acm.org/detail.cfm?id=1466448"
    type: article
  - title: "MySQL Reference — Replication (asynchronous, semi-synchronous, and failover)"
    url: "https://dev.mysql.com/doc/refman/8.0/en/replication.html"
    type: docs
status: published
---

## intro

Replication is keeping a copy of the same data on more than one machine, and it is the answer to three different problems at once: **availability** (if one node dies, another still has the data), **read throughput** (spread reads across copies), and **latency** (serve users from a nearby copy). The catch is that the instant you have more than one copy, you have to keep them in agreement while writes keep arriving — and the network, as always, can delay or drop the messages that carry those writes. Every replication scheme is a different answer to one question: **when a write happens, which copies must acknowledge it before we call it done, and which copies may a reader consult?** Get the arithmetic of those two sets right and every read sees the latest write; get it wrong and readers see stale or conflicting data. That arithmetic — the quorum condition `W + R > N` — is the beating heart of this topic.

## whyItMatters

Replication is not an optional add-on; it is how any serious system survives the daily reality that machines fail, disks die, and datacenters go offline. But it is also where a huge fraction of subtle, expensive bugs live, because "keep the copies in sync" hides a dozen tradeoffs. Replicate synchronously to every copy and a single slow node stalls every write. Replicate asynchronously and a reader hitting a lagging follower sees data from seconds ago — a user updates their profile, reloads, and their change is "gone." Let two copies both accept writes and you get conflicts that must be detected and merged or silently lost. Route a failover wrong and you get split-brain with two leaders and divergent histories. The quorum model gives you a *dial* — choose how many nodes must acknowledge a write (W) and how many a read consults (R) out of N replicas — and lets you trade consistency, latency, and availability per operation. Understanding it is what lets you reason precisely about "will this read be fresh," "what happens when this node is down," and "how do I tune for a read-heavy versus write-heavy workload" instead of hoping the defaults are right. Nearly every distributed database — Postgres streaming replication, MySQL, MongoDB, Cassandra, DynamoDB — is a point in this design space.

## intuition

There are two broad shapes. **Leader-follower** (also primary-replica, master-slave) designates one replica the leader; all writes go to it, it applies them in order and streams its change log to the followers, and reads can be served by the leader (always fresh) or by followers (fast, possibly stale). This is simple and gives a clean single order of writes, which is why it dominates relational databases. The crucial sub-choice is *when the write is acknowledged*: **synchronous** replication waits for at least one follower to confirm before telling the client "committed" (durable, but a slow/dead follower blocks the write), while **asynchronous** replication acknowledges as soon as the leader has it (fast, but a leader crash before the followers catch up loses the last writes). Most systems run **semi-synchronous**: one follower synchronous for durability, the rest async for speed. The gap between the leader and a follower is **replication lag**, and it is the source of the "I saved it but it's not there" class of bugs — cured with read-your-writes routing (send a user's reads to the leader for a short window after they write).

**Leaderless / quorum** replication (Dynamo, Cassandra) drops the single leader: a client sends each write to *all* N replicas and considers it successful once **W** of them acknowledge; it sends each read to all N and waits for **R** to respond, taking the newest version among them. The magic is the overlap condition **`W + R > N`**. Because the set of W nodes that accepted the latest write and the set of R nodes a read consults are both drawn from the same N, if their sizes sum to more than N they *must* share at least one node — and that shared node carries the latest write, so the read is guaranteed to see it. Picture N = 3: with W = 2 and R = 2, any write touches 2 of 3 and any read touches 2 of 3, so they always overlap on at least one node (2 + 2 > 3). Drop to R = 1 (W = 2) and 2 + 1 = 3 is *not* greater than 3 — now a read can hit the single node that missed the write and return a stale value. That single inequality is the entire guarantee. Tuning it is how you shape the system: `W = N, R = 1` makes reads cheap and writes expensive (read-heavy); `W = 1, R = N` the reverse; `W = R = ⌈(N+1)/2⌉` (majority) balances both and tolerates a minority of failures while staying consistent.

Because leaderless replicas can accept concurrent writes to the same key, you *will* get conflicts, and the honest fix is not a wall clock but **version vectors** to detect concurrency (from the clocks topic) plus a deterministic merge — last-write-wins if a lost update is tolerable, or a **CRDT** when it is not. Anti-entropy background processes (read repair, Merkle-tree sync) heal the replicas that missed a write so they eventually converge.

## visualization

```
 N = 3 replicas.  W = nodes that must ACK a write.  R = nodes a read consults.

 WRITE x=2 with W=2:            READ x with R=2:
   [n1: x=2]  ACK                 [n1: x=2]  <- consulted
   [n2: x=2]  ACK                 [n2: x=2]  <- consulted   -> sees x=2
   [n3: x=1]  (missed, lagging)   [n3: x=1]

 W + R > N  ->  2 + 2 > 3  ->  write-set and read-set MUST share a node
              the shared node (n1 or n2) carries x=2 -> read is FRESH

 ------- break the rule: R = 1 -------
 WRITE x=2 (W=2 -> n1,n2)   READ x (R=1 -> could pick n3)
   read hits n3 only -> returns x=1  -> STALE  (2 + 1 = 3, NOT > 3)

 leader-follower + async:  leader[x=2] --lag--> follower[x=1]
   read a follower during the lag window -> "I saved it but it's gone"
   fix: read-your-writes -> route the writer's reads to the leader briefly
```

## bruteForce

The naive scheme is a single leader that replicates **synchronously to every follower**: a write is not acknowledged until all N-1 followers confirm. It is appealing because every read from any node is guaranteed fresh — perfect consistency. It is also unusable at scale, because it makes availability *worse* the more you replicate: every additional follower is one more node whose slowness or death blocks *every* write, so a fleet of 5 replicas means any 1 of 5 hiccups stalls all writes. You added copies to be more available and made writes less available. The opposite naive extreme — a single leader replicating **fully asynchronously** and letting any follower serve reads — fixes write latency but reintroduces every consistency anomaly: readers see stale data of unbounded age, a user cannot read their own write, monotonic reads are violated (a second read can return *older* data than the first if it hits a further-behind follower), and a leader crash loses every write the followers had not yet received. The deepest brute-force trap is **failover**: when the leader dies you promote a follower, but if the old leader was ahead of the promoted one, those writes are lost; and if the old leader comes back thinking it is still leader, you have two leaders (split-brain) accepting divergent writes. "Just replicate the data" quietly contains all of consistency, availability, durability, and consensus.

## optimal

Match the replication topology and the acknowledgement policy to the workload, and make the quorum arithmetic explicit.

For a system that needs a single clean write order and strong reads, use **leader-follower with semi-synchronous replication**: one synchronous follower guarantees the write survives a leader crash (durability), while the remaining followers replicate asynchronously for throughput. Serve strong reads from the leader and scale read-heavy traffic on followers, but *bound the staleness*: add **read-your-writes** routing so a user who just wrote reads from the leader (or a caught-up replica) for a short window, and **monotonic-reads** routing (pin a session to one replica) so time never appears to run backward. Handle failover with a consensus-backed election and fencing tokens so a demoted old leader cannot keep writing — never a naive "promote the first follower that answers."

For a system that prioritizes availability and write-anywhere latency, use **leaderless quorum** replication and *tune W, R, N to the requirement*. Keep `W + R > N` whenever you need a read to see the latest write; pick a majority (`W = R = ⌈(N+1)/2⌉`) to stay consistent while tolerating a minority of node failures. Shift the dial for the workload: read-heavy services set `W = N, R = 1` (cheap reads); write-heavy services set `W = 1, R = N`. If you deliberately drop below the overlap (`W + R ≤ N`) for maximum availability, do it knowingly — you are now eventually consistent and must lean on the tools below. Because concurrent writes are inevitable here, **detect** conflicts with version vectors rather than trusting wall clocks, and **resolve** them deterministically: a CRDT when no update may be lost (a grow-only set, a per-replica summed counter), or documented last-write-wins where a dropped write is acceptable. Run **anti-entropy** — read repair on the read path plus background Merkle-tree comparison — so replicas that missed a write converge without operator intervention. In both topologies, monitor **replication lag** as a first-class metric: rising lag is the early warning that reads are getting stale and that a failover would lose data. The result is a system whose freshness, durability, and availability under failure are chosen numbers you can point to, not emergent surprises.

## complexity

- **time:** A synchronous or quorum write pays the latency of the W-th fastest replica to acknowledge; a quorum read pays the R-th fastest. Larger W or R means more nodes on the critical path and higher tail latency but stronger guarantees. Asynchronous writes acknowledge in local time and push the cost onto read freshness. Failover adds an election round trip.
- **space:** Storage is N times the data (the replication factor), the deliberate cost of durability and availability. Conflict detection adds version-vector metadata of O(N) per key on leaderless systems; anti-entropy adds Merkle-tree indexes. Leader-follower stores a replication log/WAL that is trimmed once followers catch up.
- **notes:** `W + R > N` is the freshness guarantee; the specific split of W vs R is a latency knob (read-heavy vs write-heavy). Majority quorums (`W = R = ⌈(N+1)/2⌉`) tolerate ⌊(N-1)/2⌋ failures while staying consistent. Replication lag is the operational signal that ties throughput, staleness, and failover data-loss risk together.

## pitfalls

- **Serving reads from async followers without bounding staleness.** A user reads a lagging follower right after writing and their change appears lost; a second read can even return older data than the first. Fix: read-your-writes (route the writer's reads to the leader/caught-up replica briefly) and monotonic-reads (pin a session to one replica).
- **Setting W and R so `W + R ≤ N` while expecting fresh reads.** The write-set and read-set may not overlap, so a read can miss the latest write. Fix: keep `W + R > N` when freshness is required; if you drop below it for availability, treat the system as eventually consistent and add read repair.
- **Resolving conflicts with wall-clock last-write-wins.** Clock skew can make the older write win, silently losing the newer update. Fix: detect concurrency with version vectors and merge deterministically; use a CRDT when no write may be lost.
- **Naive failover causing split-brain or lost writes.** Promoting a follower that was behind loses the leader's un-replicated writes, and a returning old leader that still thinks it is primary creates two leaders. Fix: consensus-backed election plus fencing tokens so a demoted leader's writes are rejected.
- **Ignoring replication lag until failover.** Silent, growing lag means reads are increasingly stale and a failover would lose more data — discovered only in the incident. Fix: alert on lag trend, cap follower staleness, and refuse to promote a follower whose lag exceeds a threshold.

## interviewTips

- Derive `W + R > N` from the pigeonhole idea live: the W nodes that took the write and the R nodes a read consults are both subsets of the same N, so if their sizes exceed N they must intersect, and the shared node has the latest write. Showing the *why* beats reciting the rule.
- Frame leader-follower vs leaderless as a tradeoff, not a winner: single leader gives a clean write order and easy strong reads but a failover/availability weak spot; leaderless gives write-anywhere availability but forces conflict detection and resolution on you. Name the acknowledgement axis (sync / semi-sync / async) explicitly.
- When asked "how do you keep reads fresh," separate the two fixes: quorum overlap for cross-client freshness and session guarantees (read-your-writes, monotonic-reads) for single-user sanity under lag. When asked about conflicts, reach for version vectors + CRDT/app-merge and explicitly reject wall-clock LWW as skew-unsafe.

## keyTakeaways

- Replication buys availability, read scaling, and locality, but the moment there are multiple copies every scheme is answering one question: which copies must ack a write (W) and which may a read consult (R) out of N — that arithmetic, not the topology name, determines freshness.
- The quorum condition `W + R > N` guarantees the read-set and write-set overlap on at least one up-to-date node, so the read sees the latest write; the split of W versus R is a separate latency knob for read-heavy versus write-heavy workloads.
- Async leader-follower and sub-quorum leaderless setups are eventually consistent: bound staleness with session guarantees (read-your-writes, monotonic-reads), detect conflicts with version vectors (never wall-clock LWW), resolve them with CRDTs or app logic, and watch replication lag as the signal for staleness and failover data-loss risk.

## code.python

```python
"""Quorum replication with the W + R > N freshness guarantee, deterministic.

N in-memory replicas, each holding a (value, version). A write updates the W
fastest replicas; a read consults R replicas and returns the newest version it
sees. We show that W + R > N always yields a fresh read, and that dropping below
the overlap can return stale data. Failure is simulated by marking replicas
'down' (skipped) -- no randomness anywhere.
"""


class QuorumStore:
    def __init__(self, n):
        self.n = n
        # each replica: {'value': ..., 'version': int}; version orders writes
        self.replicas = [{"value": None, "version": 0} for _ in range(n)]

    def write(self, value, w, targets):
        # Write reaches exactly the `targets` replicas (|targets| == w).
        if len(targets) != w:
            raise ValueError("write must reach exactly W replicas")
        version = max(r["version"] for r in self.replicas) + 1
        for i in targets:
            self.replicas[i] = {"value": value, "version": version}
        return version

    def read(self, r, targets):
        # Read consults `targets` replicas, returns the newest version among them.
        if len(targets) != r:
            raise ValueError("read must consult R replicas")
        seen = [self.replicas[i] for i in targets]
        return max(seen, key=lambda x: x["version"])

    def overlaps(self, w, r):
        return w + r > self.n            # the freshness guarantee, as a bool


if __name__ == "__main__":
    store = QuorumStore(n=3)

    # W = 2, R = 2  ->  2 + 2 > 3  ->  guaranteed overlap.
    store.write("x=2", w=2, targets={0, 1})     # n2 (index 2) missed it
    fresh = store.read(r=2, targets={1, 2})       # consults n1,n2 -> sees x=2
    print("W+R>N?", store.overlaps(2, 2), "read:", fresh["value"])  # True x=2

    # R = 1  ->  2 + 1 = 3, NOT > 3  ->  can hit the stale replica only.
    stale = store.read(r=1, targets={2})          # only the replica that missed
    print("W+R>N?", store.overlaps(2, 1), "read:", stale["value"])  # False None
```
