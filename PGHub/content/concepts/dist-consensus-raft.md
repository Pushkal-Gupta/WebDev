---
slug: dist-consensus-raft
module: distributed-systems
title: Consensus and Raft
subtitle: Getting a cluster to agree on one value despite failures — why consensus is hard, and Raft's leader election, log replication, and terms made intuitive.
difficulty: Advanced
position: 4
estimatedReadMinutes: 18
prereqs: [dist-cap-consistency, dist-replication]
relatedProblems: []
references:
  - title: "Diego Ongaro & John Ousterhout — In Search of an Understandable Consensus Algorithm (Extended Raft paper)"
    url: "https://raft.github.io/raft.pdf"
    type: article
  - title: "The Raft website — visualization, papers, and implementations"
    url: "https://raft.github.io/"
    type: docs
  - title: "Designing Data-Intensive Applications — Chapter 9: Consistency and Consensus"
    url: "https://dataintensive.net/"
    type: book
  - title: "Leslie Lamport — Paxos Made Simple"
    url: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf"
    type: article
  - title: "Fischer, Lynch & Paterson — Impossibility of Distributed Consensus with One Faulty Process (FLP)"
    url: "https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf"
    type: article
status: published
---

## intro

**Consensus** is the problem of getting a group of machines to agree on a single value — the next command in a log, who the leader is, whether a transaction commits — and to keep agreeing even though machines crash, restart, and lose messages at the worst moments. It sounds simple until you notice you cannot tell a crashed node from a slow one, messages can be delayed or reordered, and any node can fail mid-decision. Consensus is the foundation under nearly everything that must be *correct* in a distributed system: replicated state machines, leader election, distributed locks, configuration stores like etcd and ZooKeeper, and the commit decision in a distributed database. For decades the canonical algorithm was Paxos, famously hard to understand and to implement correctly. **Raft** was designed in 2014 with a single explicit goal — *understandability* — decomposing consensus into three digestible pieces (leader election, log replication, and safety) so that an engineer can actually reason about it, and get it right.

## whyItMatters

The reason consensus matters is that it is the only honest way to make a distributed system behave like a single, consistent machine. Anytime you need "exactly one leader," "this log has one agreed order," or "this value is committed and will never be un-committed," you need consensus underneath — there is no shortcut that survives the failure cases. Skip it and you get the disasters from the replication topic: two leaders after a botched failover (split-brain), a promoted replica that silently drops the old leader's writes, a lock two clients both think they hold. Every strongly-consistent (CP) system pays for its guarantees with a consensus protocol on the write path. Raft specifically matters because it made this machinery *teachable and implementable*: etcd (and therefore Kubernetes), Consul, CockroachDB, TiKV, and many others run Raft in production. Understanding it turns "the database magically stays consistent" into a concrete mechanism you can reason about — you know why it needs a majority, why it stalls rather than splits when it cannot get one (choosing consistency over availability, exactly the CAP tradeoff), and what "committed" actually guarantees. It is the capstone that ties CAP, clocks, and replication together into a system that is provably correct under failure.

## intuition

Why is this hard at all? Because you cannot distinguish a **crashed** node from a **slow** one — a silent node might be dead or might just be behind a delayed link — and the famous **FLP** result proves that in a fully asynchronous network no consensus algorithm can guarantee it always terminates. Real systems escape FLP by assuming *partial synchrony* (messages usually arrive within some bound) and using **timeouts** and **randomization** to make progress overwhelmingly likely while never sacrificing safety. Raft's whole design is organized around one principle: **never violate safety, even at the cost of temporarily making no progress.** When Raft cannot reach a majority it simply waits — unavailable but never wrong.

Raft elects a **single leader** and funnels all changes through it, which reduces consensus to "agree on the leader, then let the leader dictate the log." Time is divided into **terms**, monotonically increasing numbers that act as a logical clock for elections — each term has at most one leader, and terms let a node instantly recognize stale information (a message from an older term is ignored, a higher term seen in any message makes a node step down and update). Every node is in one of three states: **follower** (passive, just responds), **candidate** (trying to become leader), or **leader** (handles all client requests).

**Leader election** works by timeout. The leader sends periodic **heartbeats** (empty AppendEntries); as long as a follower hears them it stays a follower. If a follower's randomized **election timeout** (say 150–300 ms) elapses with no heartbeat, it suspects the leader died: it increments the current term, votes for itself, becomes a **candidate**, and sends **RequestVote** to everyone. Each node grants at most one vote per term (first-come, first-served), so if the candidate collects votes from a **majority** of the cluster, it becomes leader and starts sending heartbeats to suppress further elections. The randomized timeouts are the elegant trick that breaks ties: if two candidates split the vote and nobody wins, they each wait a *different* random interval before retrying, so one almost always goes first next round. Requiring a *majority* is what makes two leaders impossible — two disjoint majorities cannot exist in one cluster, so at most one candidate per term can win.

**Log replication**: once elected, the leader appends each client command to its log and sends AppendEntries to followers. An entry is **committed** — permanent, safe to apply and to acknowledge to the client — once it is stored on a **majority** of nodes; the leader then applies it to its state machine and tells followers the new commit index. The **Log Matching** property keeps logs consistent: AppendEntries includes the index and term of the entry *preceding* the new ones, and a follower rejects the append if its log does not match there, forcing the leader to back up and re-send until the logs align — so followers' logs converge to the leader's. Safety is sealed by the **election restriction**: a candidate can only win if its log is at least as up-to-date as the voter's, which guarantees any newly elected leader already contains every committed entry — committed data is never lost across leader changes. That is the whole guarantee: agree on a leader per term, commit by majority, and never elect a leader missing committed entries.

## visualization

```
 5-node cluster.  terms increase with each election.  L=leader F=follower C=candidate

 TERM 1, healthy:   [L1]--hb-->[F][F][F][F]      leader heartbeats suppress elections
                     append cmd -> replicate -> majority (3/5) ACK -> COMMITTED

 ============ leader n1 crashes; heartbeats stop ============

 F n4's election timeout fires first (randomized):
   term 1 -> 2, n4 becomes CANDIDATE, votes for itself, sends RequestVote:

        [x n1]   [F n2]<--vote--[C n4]-->[F n3]   [F n5]
   n4 collects n2 + n3 + itself = 3 votes = MAJORITY of 5  -> WINS

 TERM 2:  [L2 n4]--hb-->[F n2][F n3][F n5]   (n1 rejoins as F, term 2 > its term 1)

 rules:  * majority required  -> two leaders impossible (no two disjoint majorities)
         * higher term seen   -> step down to follower
         * commit = on a majority of logs -> survives any future election
         * cannot reach majority (>=3 up)? -> NO leader, cluster waits (CP)
```

## bruteForce

The tempting shortcut is to skip real consensus and use a simpler rule for the thing you actually need — usually "who is the leader." A first attempt: whoever has the lowest node id is leader. It needs no messages, but it cannot handle failure — if the lowest-id node dies, nothing promotes the next one, and if it comes back it barrels in as leader on top of whoever took over, creating two leaders. A second attempt: a fixed external coordinator picks the leader. Now the coordinator is a single point of failure and you have merely moved the consensus problem into it. A third attempt: let any node that *notices* the leader is gone declare itself the new leader. This is split-brain by construction — during a network partition, a node on each side notices "no leader" and each declares itself, so both sides accept writes and diverge, and when the partition heals there is no principled way to reconcile two authoritative histories. The common thread is that all of these make a decision *without confirming a majority agrees*, so two parts of the system can decide differently at the same time. You can also try "acknowledge a write once any one replica has it," but then a crash of that replica loses a supposedly-committed write. Every brute-force shortcut trades away exactly the property — a single, durable, agreed decision — that consensus exists to provide.

## optimal

Use a real consensus algorithm — Raft is the understandable default — and let its three mechanisms enforce a single agreed history.

**Elect exactly one leader per term via majority vote.** Followers that miss heartbeats time out (with *randomized* timeouts to avoid repeated split votes), become candidates, and request votes; a candidate wins only with a majority, which mathematically prevents two simultaneous leaders because two disjoint majorities cannot exist. Terms act as a logical clock: any node seeing a higher term steps down, so stale leaders retire themselves the moment they hear from the present. This directly fixes the split-brain and stuck-leader failures of the shortcuts.

**Replicate the log and commit by majority.** All client writes go through the leader, which appends them to its log and replicates via AppendEntries; an entry is committed — durable and applied — only once a majority of nodes hold it, so no single crash loses committed data. The Log Matching consistency check (piggyback the preceding entry's index+term; reject and back up on mismatch) forces every follower's log to converge to the leader's, giving one agreed order of operations — a replicated state machine that behaves like a single consistent server.

**Guarantee safety with the election restriction.** A candidate can only win votes if its log is at least as up-to-date as each voter's, which guarantees any new leader already contains every committed entry, so committed writes survive every leader change. Layer in the practical pieces production needs: **fencing tokens** (the term number) so a demoted old leader's late writes are rejected downstream; **log compaction / snapshots** so the log does not grow without bound; and **joint-consensus membership changes** so nodes can be added or removed without ever having two disjoint majorities mid-change. The deliberate cost is availability under severe failure: if a majority is unreachable, Raft elects no leader and **stops accepting writes** rather than risk divergence — it chooses consistency over availability, the CAP tradeoff made concrete. The payoff is a cluster that tolerates ⌊(N-1)/2⌋ failures, never contradicts itself, and gives every other layer (locks, config, replicated databases) a rock-solid "single agreed value" to build on.

## complexity

- **time:** Committing an entry costs one round trip from the leader to a majority of followers — latency is bounded by the median (majority-th) replica, not the slowest. Leader election takes roughly one to a few randomized election timeouts (order of hundreds of milliseconds) to converge after a leader dies; steady-state operation is just heartbeats plus one AppendEntries round per batch of writes.
- **space:** Each node stores the full replicated log until it is compacted into a snapshot, plus a little persistent state (current term, voted-for, commit index) that must survive restarts. A cluster of N nodes stores N copies of the committed data — the replication factor is the durability cost. Snapshots bound log growth.
- **notes:** All progress requires a **majority** (⌊N/2⌋+1), so a cluster of N tolerates ⌊(N-1)/2⌋ failures — 3 nodes tolerate 1, 5 tolerate 2; odd sizes are most efficient. Below a majority Raft is unavailable but never inconsistent (CP). FLP means no timeout choice guarantees termination in a fully asynchronous network, but randomized timeouts make progress overwhelmingly likely in practice.

## pitfalls

- **Even-sized clusters.** A 4-node cluster still needs 3 for a majority, so it tolerates only 1 failure — the same as 3 nodes — while costing more and being *more* likely to split votes. Fix: use odd cluster sizes (3, 5, 7).
- **Non-randomized or too-short election timeouts.** Identical timeouts make candidates repeatedly split the vote so no one wins; timeouts shorter than the heartbeat interval trigger needless elections and leader churn. Fix: randomize election timeouts over a range and keep them comfortably larger than the heartbeat period.
- **Treating an entry as committed before a majority has it.** Acknowledging a write the leader alone (or a minority) holds means a crash can lose it and a future leader may not have it. Fix: only mark an entry committed once a majority stores it, and only then apply and acknowledge.
- **Ignoring the election restriction / letting a behind node lead.** Electing a leader whose log is missing committed entries would silently erase them. Fix: enforce the up-to-date-log vote condition so a candidate must be at least as current as its voters to win.
- **A demoted old leader still issuing writes.** After a partition heals, a stale leader that has not yet learned of the new term can send late writes. Fix: use the term as a fencing token — reject any request carrying a term lower than the current one, everywhere it matters.

## interviewTips

- Decompose it the way Raft does: leader election, log replication, safety. Then explain *why majority* — two disjoint majorities cannot exist in one cluster, so at most one leader per term — because that one argument answers "how does it prevent split-brain" cleanly.
- Explain what "committed" means precisely (stored on a majority, hence durable across any future election) and how the election restriction guarantees a new leader already has every committed entry. Interviewers probe "can a committed write ever be lost?" — the answer is no, and you should be able to say why.
- Be explicit that Raft chooses consistency over availability: without a majority it elects no leader and refuses writes rather than risk divergence — tie this back to CAP. Mention randomized timeouts as the trick that breaks split votes, and odd cluster sizes for fault tolerance; these details signal real understanding.

## keyTakeaways

- Consensus makes a cluster agree on one value despite crashes and message loss; it is the correctness foundation under leader election, replicated logs, distributed locks, and CP databases — there is no shortcut (lowest-id, external coordinator, self-declaration) that survives partitions without producing split-brain or lost writes.
- Raft decomposes consensus into leader election (randomized timeouts + majority vote, one leader per term), log replication (all writes through the leader, committed once a majority stores the entry), and safety (the election restriction ensures a new leader holds every committed entry) — and terms act as a logical clock and fencing token.
- Requiring a majority is what makes two leaders impossible and committed data durable; the price is that without a majority Raft is unavailable but never inconsistent (the CAP choice made concrete), it tolerates ⌊(N-1)/2⌋ failures, and odd cluster sizes are most efficient.

## code.python

```python
"""A deterministic single-term Raft election plus majority-commit, no randomness.

We drive the state machine explicitly (no timers, no I/O): a leader dies, a
follower becomes a candidate, requests votes, wins a majority, and starts a new
term. Then the new leader replicates a log entry and commits it once a majority
holds it. This is the skeleton of Raft's two core mechanisms.
"""


class Node:
    def __init__(self, node_id):
        self.id = node_id
        self.state = "follower"      # follower | candidate | leader
        self.term = 1
        self.voted_for = None
        self.log = []                # list of (term, command)

    def request_vote(self, cand_id, cand_term, cand_log_len):
        # Grant a vote iff we haven't voted this term and the candidate's log is
        # at least as up-to-date as ours (the safety election restriction).
        if cand_term < self.term:
            return False
        if cand_term > self.term:
            self.term = cand_term
            self.voted_for = None
            self.state = "follower"
        already_voted = self.voted_for not in (None, cand_id)
        up_to_date = cand_log_len >= len(self.log)
        if not already_voted and up_to_date:
            self.voted_for = cand_id
            return True
        return False


class Cluster:
    def __init__(self, n):
        self.nodes = [Node(i) for i in range(n)]

    def majority(self):
        return len(self.nodes) // 2 + 1

    def elect(self, candidate_id):
        cand = self.nodes[candidate_id]
        cand.term += 1                       # bump term, campaign
        cand.state = "candidate"
        cand.voted_for = cand.id
        votes = 1                            # votes for itself
        for peer in self.nodes:
            if peer.id == cand.id:
                continue
            if peer.request_vote(cand.id, cand.term, len(cand.log)):
                votes += 1
        if votes >= self.majority():
            cand.state = "leader"
            for peer in self.nodes:          # heartbeat: everyone adopts the term
                if peer.id != cand.id:
                    peer.term = cand.term
                    peer.state = "follower"
        return cand.state == "leader", votes

    def replicate(self, leader_id, command):
        leader = self.nodes[leader_id]
        entry = (leader.term, command)
        leader.log.append(entry)
        acks = 1                             # leader has it
        for peer in self.nodes:
            if peer.id != leader_id and peer.state == "follower":
                peer.log.append(entry)       # AppendEntries succeeds
                acks += 1
        committed = acks >= self.majority()  # commit only on a majority
        return committed, acks


if __name__ == "__main__":
    cluster = Cluster(n=5)
    cluster.nodes[0].state = "leader"        # n0 is leader in term 1
    # n0 crashes; n3's election timeout fires first and it campaigns:
    won, votes = cluster.elect(candidate_id=3)
    print("n3 leader?", won, "term:", cluster.nodes[3].term, "votes:", votes)
    committed, acks = cluster.replicate(leader_id=3, command="x=2")
    print("committed?", committed, "acks:", acks, "of majority", cluster.majority())
```
