---
slug: raft-consensus
module: system-design
title: Raft Consensus
subtitle: Strong leader replicated log — easier to understand than Paxos, used in etcd, Consul, CockroachDB.
difficulty: Advanced
position: 20
estimatedReadMinutes: 7
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
**Raft** is a consensus algorithm that keeps a replicated log identical across a cluster of servers, surviving up to f failures with 2f+1 nodes. Compared with Paxos, Raft is designed for **understandability**: one strong leader handles all client writes; followers replicate the leader's log. When the leader dies, an election picks a new one.

## whyItMatters
Raft is the workhorse of modern distributed systems:
- **etcd** — Kubernetes' state store.
- **Consul** — HashiCorp's service discovery.
- **CockroachDB / TiKV** — distributed SQL via per-range Raft groups.
- **MongoDB's replica set election** is Raft-derived.
- **Hashicorp Vault** — distributed secret storage.

Every "highly-available config/coord store" in your infra likely runs Raft underneath.

## intuition
Three roles: **leader**, **follower**, **candidate**.
- One leader at a time. Leader handles all client writes, replicates them to followers.
- Followers passively reply to leader heartbeats.
- If a follower's election timeout fires (no heartbeat), it becomes a candidate and starts an election.

Two subprotocols:
1. **Leader election** — candidate increments its term, votes for itself, requests votes from peers. First to get majority wins. Ties → randomized timeout retries.
2. **Log replication** — leader appends entries, sends `AppendEntries` to followers, commits an entry once it's on a majority of nodes.

**Safety invariant**: a committed entry will never be overwritten. Achieved via election restriction (only candidates with at-least-as-up-to-date logs can win) + append-only log.

## visualization
```
Cluster of 5 nodes (need majority = 3):

State: L=leader, F=follower, C=candidate

Steady state:
  L --heartbeat--> F F F F     (every 50ms)

Leader dies:
  F F F F      (no heartbeat for 150-300ms; random per node)
  C F F F      (one node times out first → candidate, term=2)
  C asks all for votes; majority votes → C becomes L (term=2)
  L --heartbeat--> F F F F

Client write x=5 to leader:
  L appends to its log (uncommitted yet)
  L --AppendEntries(x=5)--> F F
  F F ack
  L has majority; commits x=5; replies to client
  L --AppendEntries(commit_idx=5)--> all F
```

## bruteForce
- **Single primary, no replication**: not fault-tolerant.
- **2PC**: doesn't tolerate coordinator failure; blocking.
- **Paxos**: works, but its 2-phase + multi-paxos optimizations are notoriously hard to implement correctly.

## optimal
**Leader election**:
- Term: monotonically increasing integer.
- Candidate: `term++`, vote for self, `RequestVote(term, last_log_index, last_log_term)` to peers.
- Follower votes YES if: (1) hasn't voted this term, (2) candidate's log is at least as up-to-date as its own.
- Candidate becomes leader on majority; sends heartbeats immediately.

**Log replication**:
- Leader receives client request → appends to its log.
- `AppendEntries(term, prev_log_index, prev_log_term, entries[], leader_commit)`.
- Follower accepts if `prev_log_index/term` matches; truncates conflicts, appends.
- Once a majority has the entry, leader sets `commit_index` and applies to state machine.

**Safety properties**:
- **Election safety**: at most one leader per term.
- **Leader completeness**: committed entries appear in every future leader's log.
- **State machine safety**: replicated state machines apply commands in the same order.

**Snapshots** (log compaction): periodically snapshot the state machine; truncate log entries before the snapshot index.

## complexity
- **Election**: 1-2 RTT after timeout fires (~150-300ms typical).
- **Write**: 1 RTT from client to commit (leader → majority).
- **Read** (linearizable): leader must confirm it's still leader — heartbeat round-trip. Stale reads are O(0).
- **Cluster size**: 3 nodes tolerates 1 failure; 5 tolerates 2; 7 tolerates 3. Diminishing returns past 5-7.

## pitfalls
- **Split brain on network partition**: minority partition can't elect a leader (lacks majority votes). Don't allow writes from minority partitions.
- **Stale leader serving reads**: a network-partitioned leader thinks it's still leader. Force reads to go through a recent heartbeat or use leases.
- **Slow follower lagging behind**: leader keeps backtracking `prev_log_index` to find common ancestor. Implement bulk-snapshot fallback.
- **Configuration changes** (adding/removing nodes): must use **joint consensus** — both old and new majorities must agree during the transition. Naive single-step changes can lead to two leaders.
- **Clock skew**: Raft doesn't trust clocks — only uses them for randomized election timeouts. Don't use timestamps for ordering.

## interviewTips
- For "design a distributed config store / lock service" — Raft.
- Mention **majority quorum**, **terms**, **commit index** as the three core concepts.
- Always contrast with Paxos — say "Raft trades minor expressiveness for understandability and operational simplicity."
- For senior interviews, discuss **leases for fast reads**, **joint consensus for membership changes**, and the operational tradeoff of 3 vs 5 vs 7 node clusters.

## code.python
```python
# Pseudocode for the leader's main loop.
def leader_loop():
    while is_leader():
        if pending_entries:
            for follower in peers:
                send(follower, AppendEntries(
                    term=current_term,
                    prev_log_index=match_index[follower],
                    prev_log_term=log[match_index[follower]].term,
                    entries=log[match_index[follower] + 1 :],
                    leader_commit=commit_index,
                ))
        sleep(HEARTBEAT_INTERVAL)

def on_append_entries_response(follower, success, match_idx):
    if not success:
        match_index[follower] -= 1   # backtrack until match
    else:
        match_index[follower] = match_idx
        update_commit_index()        # majority count
```

## code.javascript
```javascript
// Use a battle-tested library like `node-raft` or `raft-js`.
// Implementing raft from scratch in JS for production is a research project.
```

## code.java
```java
// Production Java implementations: Atomix, JGroups Raft, Apache Ratis.
// jraft (Sofa) is also widely used in Alibaba's stack.
```

## code.cpp
```cpp
// LogCabin (the original Raft reference implementation) by Diego Ongaro is in C++.
// braft (Baidu) and TiKV's raft-rs (Rust) are the most-used today.
```
