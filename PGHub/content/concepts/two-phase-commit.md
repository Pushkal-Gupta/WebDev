---
slug: two-phase-commit
module: sd-consensus
title: Two-Phase Commit (2PC)
subtitle: A blocking atomic-commit protocol — every participant votes, then a coordinator decides. Used by traditional distributed transactions; replaced by Paxos/Raft in most modern systems.
difficulty: Advanced
position: 27
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Gray — Notes on Data Base Operating Systems (1978)"
    url: "https://jimgray.azurewebsites.net/papers/dbos.pdf"
    type: paper
  - title: "Bernstein, Hadzilacos, Goodman — Concurrency Control and Recovery in Database Systems (Ch. 7)"
    url: "https://www.microsoft.com/en-us/research/people/philbe/book/"
    type: book
  - title: "Martin Kleppmann — Designing Data-Intensive Applications, Ch. 9"
    url: "https://dataintensive.net/"
    type: book
status: published
---

## intro
**Two-Phase Commit (2PC)** is the classic atomic-commit protocol for distributed transactions: a coordinator asks every participant "can you commit?", waits for all yes/no votes, then broadcasts the decision. If *any* participant says no, the whole transaction aborts; if *all* say yes, it commits. It guarantees **atomicity** — either all participants commit or none do — but it pays for that with a famous flaw: if the coordinator crashes after participants vote yes, those participants are stuck holding locks until the coordinator returns. 2PC is blocking.

## whyItMatters
Every classical "distributed transaction" — XA, Java JTA, Spring's @Transactional across multiple DataSources, PostgreSQL's `PREPARE TRANSACTION`, Microsoft DTC — is 2PC underneath. Modern systems mostly replace it (sagas, Paxos-replicated state machines, Spanner's TrueTime, CockroachDB's Raft-based transactions) precisely because 2PC's blocking behaviour is operationally toxic at scale. Knowing 2PC means knowing what those modern systems are correcting.

## intuition
Three databases (`A`, `B`, `C`) are participating in a transaction managed by a coordinator `T`. The transaction has updates to each. The naive plan — "T tells each to commit at once" — fails when A succeeds but B's disk dies before B commits. Now A has a committed update while B and C don't. Atomicity violated.

2PC fixes this with a **vote round** before the **decision round**:

**Phase 1 — Prepare.** T sends `Prepare` to A, B, C. Each participant tries to apply the transaction locally — writes the changes to its log, holds the locks — but does NOT commit yet. It replies `Yes` if everything succeeded, `No` if anything failed.

**Phase 2 — Commit/Abort.** T waits for all replies. If all said Yes, T writes `Commit` to its own log (the *decision point*) and broadcasts `Commit` to all. Each participant flushes the changes from prepared state to committed state. If any participant said No (or timed out), T broadcasts `Abort` instead, and participants roll back.

The atomicity guarantee comes from the **prepared state**: once a participant says Yes, it has durably promised to be able to commit. It can't crash and forget — the transaction's changes are on disk in a prepared-but-not-committed form. When it restarts, it asks the coordinator "what was the decision?" and finishes the transaction accordingly.

The **fatal failure mode**: T writes Commit to its log, sends Commit to A (who commits and releases locks), then crashes before reaching B and C. B and C are still in the prepared state, holding locks, with no idea what the decision was. They cannot just abort — A already committed; aborting would violate atomicity. They cannot just commit — what if the decision was Abort and A's commit was a bug? They must **wait for T to recover**. Meanwhile, all rows touched by the transaction are locked at B and C, blocking unrelated work.

This is why production systems use Paxos/Raft to replicate the coordinator's decision log — so even if one coordinator dies, a majority of replicas remember the decision and can complete the transaction. That hybrid is essentially what Google Spanner does.

## visualization
```
Coordinator T          Participant A      Participant B      Participant C
   |    Prepare           |                  |                   |
   |--------------------->|                  |                   |
   |                      |   write log,     |                   |
   |                      |   hold locks     |                   |
   |<---------------------|  "Yes"           |                   |
   |    Prepare                              |                   |
   |---------------------------------------->|                   |
   |                                         |  "Yes"            |
   |<----------------------------------------|                   |
   |    Prepare                                                  |
   |---------------------------------------------------------->  |
   |                                                             |   "Yes"
   |<-----------------------------------------------------------|
   |                                                             |
   |  write DECISION=Commit to log (the point of no return)     |
   |                                                             |
   |    Commit            |                  |                   |
   |--------------------->|--------------->  |---------------->  |
   |                      |   flush         |   flush          |  flush
   |                      |   release locks |   release locks  |  release locks
   |<-- ack ------------->|<-- ack -------- |<-- ack --------- |
```

## bruteForce
"Just send Commit and hope for the best." Without the prepare phase, any participant that fails mid-commit leaves the system inconsistent. There is no general way to recover. The prepare phase is what gives the coordinator confidence that *all* participants can durably commit before deciding.

## optimal
Two roles: `coordinator` (one node, runs the protocol) and `participant` (the nodes that hold the data).

**Phase 1 — Voting:**
1. Coordinator durably logs `BEGIN(txid)`, sends `Prepare(txid, operations)` to each participant.
2. Each participant:
   - Acquires locks for the rows touched.
   - Writes the changes to its undo/redo log (durable, but not yet visible).
   - Durably logs `PREPARED(txid)`.
   - Replies `Yes` if all the above succeeded; `No` if anything failed.
3. If a participant times out waiting for Prepare, it can unilaterally abort — it never reached prepared state.

**Phase 2 — Decision:**
1. Coordinator collects votes. If all are Yes, durably log `COMMIT(txid)` (the irrevocable decision point); else `ABORT(txid)`.
2. Send the decision to all participants.
3. Each participant:
   - On `Commit`: apply the prepared changes, durably log `COMMITTED(txid)`, release locks, ack.
   - On `Abort`: roll back from the undo log, durably log `ABORTED(txid)`, release locks, ack.
4. Coordinator collects acks. Once all received, durably log `COMPLETE(txid)` and may garbage-collect the transaction log entry.

**Recovery rules** (the part that makes 2PC actually work):
- A participant that restarts in `PREPARED` state CANNOT commit or abort on its own. It must ask the coordinator: "what was the decision for txid?" The coordinator's log holds the answer.
- If the coordinator crashes after `COMMIT` but before broadcasting, participants in `PREPARED` state are stuck until the coordinator recovers.
- A participant that restarts in `COMMITTED` or `ABORTED` state has nothing to do — the decision is already applied locally.

**Heuristic decisions**: some XA implementations let a participant unilaterally abort after a long timeout in `PREPARED` state. This violates atomicity (if the coordinator's decision was Commit, the participant just diverged) and produces a "heuristic exception" that operators must reconcile manually. Avoid heuristics in production unless your operators love pagers.

## complexity
- **Messages**: `3N` in the happy path (N prepares, N decision broadcasts, N acks).
- **Log writes**: 2 per participant (prepared, decided), 2 per coordinator (begin, decision). Each is a durable fsync.
- **Latency**: `2 RTT` minimum plus fsync time at the coordinator and every participant.
- **Liveness**: blocked until the coordinator recovers if it crashes after some participants vote Yes but before the decision is broadcast.

## pitfalls
- **Coordinator as single point of failure.** A crashed coordinator blocks every in-flight transaction. Production: replicate the coordinator's decision log with Paxos/Raft.
- **Locks held during the entire prepare-to-commit window.** Cross-shard 2PC transactions hold row locks across network round-trips. Hot rows become hot mutexes. This is the operational reason Spanner uses TrueTime — to keep the prepare window microseconds, not milliseconds.
- **Forgetting that prepare must be durable.** A participant that crashes and forgets "I voted Yes" can later abort a transaction the coordinator already committed. Prepared state MUST be on disk before the Yes reply.
- **Treating the coordinator's send of Commit as the commit point.** The commit point is the coordinator's *log write*, not the network send. Tooling that watches for the network event can declare commits that haven't actually happened.
- **Recovery loops that flood the coordinator.** Every prepared participant asks the coordinator for the decision on restart. If the coordinator is replaying its own log, those queries can saturate its inbound queue. Production: exponential backoff on the "what was the decision?" query.

## interviewTips
- **Lead with atomicity, then lead with the blocking problem.** "2PC gives you atomic commit, but it blocks if the coordinator dies — that's why modern systems use Paxos/Raft to replicate the coordinator." Shows you know why it fell out of fashion.
- **Distinguish 2PC from 3PC.** Three-phase commit adds an extra round (`Prepare → PreCommit → Commit`) to eliminate the blocking failure mode, at the cost of two extra message delays and additional complexity. Production implementations are rare; the network-partition assumptions 3PC needs (no partitions during the PreCommit window) are unrealistic, which is why most systems use replicated coordinators instead.
- **Bring up sagas.** For microservice architectures where you can't hold cross-service locks, a saga (sequence of compensatable local transactions) is the standard 2PC replacement. Atomicity becomes eventual; concurrent reads see partial state.

## code
### python
```python
# Skeleton of a 2PC coordinator. Real implementations log durably before each
# state transition and recover by replaying the log on restart.

from enum import Enum
from typing import List

class Decision(Enum):
    COMMIT = "commit"
    ABORT = "abort"

class Coordinator:
    def __init__(self, participants: List["Participant"]) -> None:
        self.participants = participants

    def commit(self, txid: int, ops) -> Decision:
        # Phase 1: vote
        votes = [p.prepare(txid, ops) for p in self.participants]
        if not all(votes):
            decision = Decision.ABORT
        else:
            decision = Decision.COMMIT

        # Decision point — must be durable BEFORE notifying anyone.
        self._log_decision(txid, decision)

        # Phase 2: broadcast decision, retry forever (participants are idempotent).
        for p in self.participants:
            if decision == Decision.COMMIT:
                p.do_commit(txid)
            else:
                p.do_abort(txid)
        return decision

    def _log_decision(self, txid, decision):
        # fsync to disk in real life.
        pass

class Participant:
    def prepare(self, txid, ops) -> bool:
        # Acquire locks, write to redo/undo log, fsync, return True if all OK.
        return True
    def do_commit(self, txid): pass
    def do_abort(self, txid): pass
```

### javascript
```javascript
class Coordinator {
  constructor(participants) { this.participants = participants; }
  async commit(txid, ops) {
    const votes = await Promise.all(this.participants.map(p => p.prepare(txid, ops)));
    const decision = votes.every(Boolean) ? 'commit' : 'abort';
    await this.logDecision(txid, decision);
    for (const p of this.participants) {
      if (decision === 'commit') await p.doCommit(txid);
      else await p.doAbort(txid);
    }
    return decision;
  }
  async logDecision(txid, decision) { /* fsync */ }
}
```

### java
```java
import java.util.List;

public class Coordinator {
    private final List<Participant> participants;
    public Coordinator(List<Participant> participants) { this.participants = participants; }

    public String commit(long txid, Object ops) {
        boolean allYes = true;
        for (Participant p : participants) {
            if (!p.prepare(txid, ops)) { allYes = false; break; }
        }
        String decision = allYes ? "commit" : "abort";
        logDecision(txid, decision);  // durable; must precede phase 2
        for (Participant p : participants) {
            if (decision.equals("commit")) p.doCommit(txid);
            else                            p.doAbort(txid);
        }
        return decision;
    }

    private void logDecision(long txid, String decision) { /* fsync */ }
}

interface Participant {
    boolean prepare(long txid, Object ops);
    void doCommit(long txid);
    void doAbort(long txid);
}
```

### cpp
```cpp
#include <vector>
#include <string>

struct Participant {
    virtual ~Participant() = default;
    virtual bool prepare(long long txid, const std::string& ops) = 0;
    virtual void do_commit(long long txid) = 0;
    virtual void do_abort(long long txid) = 0;
};

class Coordinator {
    std::vector<Participant*> ps;
public:
    Coordinator(std::vector<Participant*> participants) : ps(std::move(participants)) {}

    std::string commit(long long txid, const std::string& ops) {
        bool all_yes = true;
        for (auto* p : ps) { if (!p->prepare(txid, ops)) { all_yes = false; break; } }
        std::string decision = all_yes ? "commit" : "abort";
        log_decision(txid, decision);  // durable; must precede phase 2
        for (auto* p : ps) {
            if (decision == "commit") p->do_commit(txid);
            else                       p->do_abort(txid);
        }
        return decision;
    }

private:
    void log_decision(long long, const std::string&) { /* fsync */ }
};
```
