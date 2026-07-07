---
slug: dist-cap-consistency
module: distributed-systems
title: CAP, Consistency Models, and the Tradeoffs
subtitle: What a network partition forces you to give up — CAP and PACELC, and the ladder of consistency from linearizable to eventual.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 16
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 9: Consistency and Consensus"
    url: "https://dataintensive.net/"
    type: book
  - title: "Brewer's CAP Theorem — the original PODC 2000 keynote and Gilbert & Lynch's proof"
    url: "https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf"
    type: article
  - title: "Daniel Abadi — Consistency Tradeoffs in Modern Distributed Database System Design (PACELC)"
    url: "https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf"
    type: article
  - title: "Peter Bailis & Ali Ghodsi — Eventual Consistency Today: Limitations, Extensions, and Beyond"
    url: "https://queue.acm.org/detail.cfm?id=2462076"
    type: article
  - title: "Kyle Kingsbury (Jepsen) — Consistency Models reference"
    url: "https://jepsen.io/consistency"
    type: docs
status: published
---

## intro

The moment your data lives on more than one machine, a question appears that a single server never had to answer: when two clients look at the same key at the same time, do they have to see the same value? Answering "always yes" is expensive, and a network that can drop or delay messages makes it sometimes impossible. The **CAP theorem** names the corner you are backed into: when the network **partitions** — some nodes cannot reach others — a system can preserve **consistency** (every read sees the latest write) or **availability** (every request gets a non-error response), but not both. You do not get to pick "all three always." You get to pick which one you sacrifice *during* a partition, and that single choice ripples through your entire design.

## whyItMatters

Almost every real production incident in a distributed store traces back to a consistency decision someone made — or made by accident. Choose availability and a client can read stale data, two clients can write conflicting values, and you inherit the job of merging them later. Choose consistency and a minority of nodes must refuse writes during a partition, so part of your system goes dark to keep the data correct. Neither is wrong; they are different products. A shopping cart wants availability (never block the customer; reconcile duplicates later), while a bank ledger wants consistency (better to reject a transfer than double-spend). CAP is only the partition-time half of the story: **PACELC** completes it by noting that even when the network is healthy (**E**lse), you still trade **L**atency against **C**onsistency, because keeping replicas in sync costs round trips. Understanding this framework is what lets you read a database's marketing page — "eventually consistent," "strongly consistent," "tunable" — and know exactly what it will and will not promise you under load and under failure.

## intuition

Start with why the partition forces a choice at all. Picture the same key replicated on node A and node B, and a client writing `x = 2` to A. Normally A forwards the new value to B and everyone agrees. Now cut the link between A and B. A write lands on A. A client reads from B. A has `x = 2`; B still has `x = 1`. There are exactly two honest options. Either B **refuses to answer** until it can confirm it has the latest value — that is consistency, purchased by giving up availability on B's side. Or B **answers with the stale `x = 1`** — that is availability, purchased by giving up consistency. There is no third door where B magically knows A's write without a message crossing the cut, because by definition the cut blocks messages. That is the whole theorem in one picture: a partition removes the communication that agreement depends on, so you serve either correctness or an answer, not both.

Consistency is not one thing but a **ladder** of guarantees, and the rungs matter more day-to-day than CAP itself. At the top sits **linearizability**: the system behaves as if there is a single copy of the data and every operation takes effect atomically at some instant between its call and its return, so once a write completes, every later read (by wall-clock time) sees it. This is the strongest, most intuitive model — it is what people mean by "strong consistency" — and it is the most expensive, because it requires coordination (a quorum or a leader) on the critical path. One rung down, **sequential consistency** preserves each client's own order but allows a single global interleaving that need not match real time. Further down, **causal consistency** guarantees only that operations which *causally* depend on each other are seen in order (if you reply to a message, no one sees your reply before the message), while unrelated operations can be seen in any order — this is the strongest model still achievable with high availability. At the bottom is **eventual consistency**: replicas are allowed to disagree, and the only promise is that *if writes stop, they will converge* to the same value, with no bound on when. Read-your-writes, monotonic-reads, and monotonic-writes are useful "session" guarantees that sit between causal and eventual. Picking a model is picking how much staleness and how much reordering your application can absorb — and every rung you climb costs coordination and latency.

## visualization

```
 replicas A and B hold key x = 1.  client W writes x=2 to A.

 HEALTHY link:  A --(x=2)--> B      both converge, reads see 2

 ================ NETWORK PARTITION (link cut) ================

     W: write x=2 -----> [ A: x=2 ]    X    [ B: x=1 ] <----- R: read x?
                                    (no messages cross the cut)

   choice CP (consistency):  B refuses the read  -> unavailable, never stale
   choice AP (availability):  B returns x=1       -> available, but STALE

 -------------------------------------------------------------
 CONSISTENCY LADDER (strong at top, cheap+available at bottom)
   linearizable   single-copy illusion, real-time order   (needs quorum)
   sequential     one global order, not real-time
   causal         cause-before-effect preserved           (HA possible)
   eventual       converges IF writes stop, no time bound  (cheapest)
```

## bruteForce

The naive answer is "just make every replica always agree and always answer" — full strong consistency with full availability. On a healthy network you can get close: route every write through a leader, synchronously replicate to all followers, and every read is correct. The trouble is the failure mode the design ignores. The instant one follower is unreachable — a switch reboots, a cable is cut, a GC pause looks like a death — the synchronous-to-all leader must either block the write forever (killing availability for everyone) or drop the unreachable node and proceed (which is fine, but is precisely the CP compromise you claimed you did not have to make). Trying to keep both leads to the classic split-brain disaster: two sides of a partition each decide they are the leader, each accepts writes, and when the network heals you have two divergent histories and no principled way to merge them. The brute-force "always both" is not a design; it is a bug that has not been triggered yet. The moment a partition arrives — and in a large enough fleet one is always arriving somewhere — the unstated choice gets made for you, usually as data loss or an outage, at the worst possible time.

## optimal

The disciplined approach is to **choose your partition-time behavior deliberately, per dataset, and encode it in the design** rather than discovering it during an incident. First, decide CP or AP for each piece of data by asking a single question: is a stale-or-refused answer worse, or is an unavailable answer worse? Money movement, unique-username registration, and inventory decrement are CP — reject rather than risk a double-spend or a duplicate. Carts, feeds, presence, and analytics are AP — always answer, reconcile later. This is not a whole-system flag; a mature product runs CP subsystems next to AP subsystems.

For CP data, put coordination on the write path: a consensus protocol (Raft, Paxos) or a strict quorum with `W + R > N` guarantees a read overlaps the latest write, so a minority partition simply stops serving rather than serving stale data. You accept reduced availability during partitions as the price of never being wrong. For AP data, embrace divergence and make **convergence** a first-class feature: use version vectors to detect concurrent writes, and resolve them with a deterministic, commutative merge — last-write-wins if a lost update is acceptable, or a CRDT (a set that only grows, a counter that sums per-replica) when it is not. The application, not luck, decides how conflicts merge.

Then apply **PACELC** to the healthy-network case, which is 99.9% of the time: even with no partition, do you pay latency for consistency, or serve fast and possibly stale? Offer *tunable* consistency where it helps — let a read request "strong" (quorum, slower) or "eventual" (nearest replica, faster) per call, so the same store serves a checkout page strongly and a product-view counter cheaply. Layer **session guarantees** (read-your-writes so a user always sees their own edit; monotonic-reads so time never appears to run backward) on top of an eventual base to kill the most jarring anomalies without paying full linearizable cost. The result is a system whose behavior under partition and under load is a documented decision, matched to what each dataset can tolerate — not an accident waiting for the next dropped packet.

## complexity

- **time:** Strong (linearizable) reads and writes pay a coordination round trip on the critical path — a quorum or leader hop, so latency is bounded by the slowest node in the quorum, not the nearest replica. Eventual reads hit the nearest replica and return in local time, trading freshness for speed. This is exactly the PACELC latency-vs-consistency dial.
- **space:** Detecting and resolving conflicts costs metadata: a version vector is O(number of replicas) per key, and CRDT state can grow with the number of actors or require tombstones for deletes. Strong consistency avoids per-key conflict metadata but pays with coordination state (logs, leases).
- **notes:** CAP is a partition-time theorem about a binary choice; PACELC generalizes it to the everyday latency tradeoff. Consistency is a spectrum, not a switch — most anomalies users notice (a vanished comment, time going backward) are session-guarantee gaps, cheaper to fix than full linearizability.

## pitfalls

- **Reading CAP as "pick two of three, always."** You are always partition-tolerant in practice (partitions happen whether you like it or not), so the real choice is C-vs-A *during a partition only*. When the network is healthy you can have both C and A — the tradeoff then is latency (PACELC). Fix: frame it as "what do we do when partitioned," not "which two do we keep forever."
- **Assuming "eventually consistent" means "consistent after a short delay."** Eventual consistency promises convergence only *if writes stop*, with no time bound, and says nothing about *what* value wins. Fix: pick an explicit conflict-resolution rule (LWW, CRDT, app merge) and add session guarantees so users at least see their own writes.
- **One global consistency flag for the whole system.** Forcing money and analytics to the same setting either makes the fast path needlessly slow or makes the correct path dangerously loose. Fix: choose CP-vs-AP per dataset and offer per-request tunable reads where the store supports it.
- **Silent last-write-wins hiding lost updates.** LWW by wall-clock timestamp quietly discards one of two concurrent writes, and clock skew can make the *older* write win. Fix: detect concurrency with version vectors and merge deterministically, or use a CRDT when no update may be lost; reserve LWW for data where a dropped write is truly acceptable.
- **Split-brain from trying to stay available on both sides.** If both sides of a partition keep accepting writes as "the leader," you get two divergent histories. Fix: for CP data require a majority quorum so a minority side cannot make progress; never let two partitions each believe they are authoritative.

## interviewTips

- State the theorem precisely: during a partition you choose consistency **or** availability; when there is no partition the tradeoff is latency versus consistency (PACELC). Saying "you can only pick two of C, A, P" is the answer that flags a shallow understanding — partition tolerance is not optional.
- Anchor the choice to the data, not the database: "a cart is AP because never blocking the customer beats momentary duplicates, which we reconcile with a CRDT; a ledger is CP because we reject rather than double-spend." Concrete per-dataset reasoning beats naming products.
- Know the consistency ladder well enough to place a model on it — linearizable, sequential, causal, eventual — and to explain that causal is the strongest model still compatible with high availability. Interviewers love "how do you stop time from appearing to run backward," which is a monotonic-reads session guarantee.

## keyTakeaways

- A network partition removes the communication agreement depends on, so a distributed store must choose per dataset: refuse to answer to stay correct (CP) or answer possibly-stale to stay up (AP). Partition tolerance itself is not optional.
- PACELC completes CAP: even with a healthy network you trade latency against consistency, because keeping replicas in sync costs round trips — so "strong" reads are slower and "eventual" reads are faster by construction.
- Consistency is a ladder (linearizable → sequential → causal → eventual), each rung cheaper and more available but weaker; most user-visible anomalies are session-guarantee gaps (read-your-writes, monotonic-reads) that are cheap to close without paying full linearizable cost.

## code.python

```python
"""Two replicas, one key, and the CAP choice made explicit under a partition.

Deterministic model: no randomness, no I/O. A write lands on replica A; a read
hits replica B. When the link is UP, A propagates to B and reads are fresh.
When the link is DOWN (partition), the caller's mode decides the outcome:
  - 'CP': B refuses the read (raise) -> consistent, unavailable
  - 'AP': B returns its stale value  -> available, inconsistent
Also shows version-vector conflict detection for the AP path.
"""


class Replica:
    def __init__(self, name):
        self.name = name
        self.value = None
        # version vector: replica_name -> counter, for concurrency detection
        self.vv = {}

    def apply(self, value, vv):
        self.value = value
        self.vv = dict(vv)


class TwoReplicaStore:
    def __init__(self):
        self.a = Replica("A")
        self.b = Replica("B")
        self.link_up = True

    def partition(self, up):
        self.link_up = up

    def write(self, value):
        # Client writes to A; A bumps its own version-vector entry.
        self.a.vv["A"] = self.a.vv.get("A", 0) + 1
        self.a.value = value
        if self.link_up:              # healthy: propagate so B converges
            self.b.apply(self.a.value, self.a.vv)

    def read(self, mode):
        # Read served from B. Under a partition, mode decides the tradeoff.
        if self.link_up:
            return self.b.value       # fresh: B mirrors A
        if mode == "CP":
            raise RuntimeError("unavailable: cannot confirm latest write")
        if mode == "AP":
            return self.b.value       # possibly stale, but always answers
        raise ValueError("mode must be 'CP' or 'AP'")


def concurrent(vv1, vv2):
    # Neither dominates -> the two writes are concurrent (a real conflict).
    keys = set(vv1) | set(vv2)
    a_ahead = any(vv1.get(k, 0) > vv2.get(k, 0) for k in keys)
    b_ahead = any(vv2.get(k, 0) > vv1.get(k, 0) for k in keys)
    return a_ahead and b_ahead


if __name__ == "__main__":
    s = TwoReplicaStore()
    s.write("x=2")
    print("healthy read (fresh):", s.read("AP"))   # x=2

    s.partition(up=False)
    s.write("x=3")                                  # only A has it now
    print("AP read (stale ok):", s.read("AP"))      # x=2 -> available, stale
    try:
        s.read("CP")
    except RuntimeError as e:
        print("CP read:", e)                        # refuses -> consistent
```
