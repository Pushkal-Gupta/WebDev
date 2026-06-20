---
slug: three-phase-commit
module: sd-consensus
title: Three-Phase Commit (3PC)
subtitle: A non-blocking variant of 2PC that adds a pre-commit step — fixes 2PC's coordinator-crash-after-vote bug but assumes no network partitions during the critical window.
difficulty: Advanced
position: 28
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Skeen — Nonblocking Commit Protocols (SIGMOD 1981)"
    url: "https://dl.acm.org/doi/10.1145/582318.582339"
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
**Three-Phase Commit (3PC)** is an attempt to fix the famous blocking flaw of [[two-phase-commit]]: when the coordinator dies after participants vote Yes but before the decision broadcast, those participants are stranded holding locks. 3PC inserts a third round — `PreCommit` — between voting and the final commit. After `PreCommit` succeeds at a majority, surviving participants can safely decide the outcome among themselves even if the coordinator never comes back. The price: an extra message-delay per transaction, plus the requirement that the network not partition during the protocol's critical window.

## whyItMatters
3PC matters more as a pedagogical contrast than as a deployed system. In practice almost no production system uses 3PC because its non-blocking guarantee assumes a synchronous network (no partitions, bounded message delay) during the protocol — assumptions that real WANs and even data-centre networks violate. Once you accept partitions, 3PC blocks anyway. Modern systems instead replicate the 2PC coordinator's decision log with Paxos/Raft, which gives the same non-blocking property under realistic asynchronous assumptions. Knowing 3PC's story makes you fluent in *why* "just replicate the coordinator" became the canonical fix.

## intuition
Recall the 2PC failure: coordinator T decides COMMIT, sends Commit to A who commits, then T dies before reaching B and C. B and C are stuck in `PREPARED` — they cannot commit (was the decision Commit? Maybe T crashed before deciding!) and cannot abort (A already committed). They wait.

3PC adds an explicit "we're about to commit, no one can change their mind" phase that all live participants reach before any one of them actually commits:

**Phase 1 — CanCommit.** Coordinator asks "can you commit?" Participants check locally and reply Yes/No, but do NOT yet prepare to disk.

**Phase 2 — PreCommit.** If all Yes, coordinator sends `PreCommit` to everyone. Each participant now durably prepares (writes redo log, holds locks) and acks. The crucial invariant: **once a participant has acked PreCommit, no one will ever decide Abort** — because the coordinator only sends PreCommit after every participant said Yes in Phase 1.

**Phase 3 — DoCommit.** Once a majority of participants have acked PreCommit, coordinator broadcasts DoCommit. Participants apply the changes and release locks.

Now if T dies after Phase 2 but before Phase 3, surviving participants can run an **election protocol** among themselves: if any participant reached PreCommit, they all reached it (or are about to), so the safe decision is Commit. If no participant reached PreCommit, the safe decision is Abort. They no longer need T to make the call — they have enough information among themselves.

The catch: this only works if surviving participants can *talk to each other* to discover whether anyone reached PreCommit. If the network partitions and the participants split into two groups, each group might independently decide differently — one Commit, one Abort. Atomicity violated. 3PC's non-blocking guarantee is therefore **conditional on synchronous communication** during recovery. In an asynchronous network with partitions, 3PC blocks just like 2PC.

## visualization
```
       Phase 1: CanCommit       Phase 2: PreCommit        Phase 3: DoCommit
Coord    Prepare? --> all       PreCommit --> all          DoCommit --> all
          <-- Yes/No              <-- ack                    <-- done

If coordinator dies after Phase 2 acks but before Phase 3:
   ↳ surviving participants run an election among themselves.
   ↳ any participant in PreCommit state implies "everyone said Yes" → decide COMMIT.
   ↳ no participant in PreCommit state → decide ABORT.

Critical assumption: surviving participants can communicate.
   Network partition during recovery -> split-brain decisions possible -> 3PC blocks.
```

## bruteForce
"Just use 2PC and accept the blocking." That's exactly what most systems do, after wrapping the coordinator with Paxos/Raft so a single coordinator crash doesn't strand participants. The Paxos-replicated-coordinator approach gives the non-blocking guarantee 3PC promised, *without* needing synchronous-network assumptions.

## optimal
Three roles, same as 2PC: `coordinator`, `participant`, `learner` (often folded into participant).

**Phase 1 — CanCommit:**
1. Coordinator sends `CanCommit(txid)` to all participants.
2. Each participant checks local state (constraints, available locks, etc.) and replies `Yes` or `No` WITHOUT yet preparing to disk.
3. Coordinator collects votes.

**Phase 2 — PreCommit (only if all Yes):**
1. Coordinator durably logs `WAITING(txid)`, sends `PreCommit(txid)` to all participants.
2. Each participant:
   - Acquires locks, writes redo/undo log durably (this is the "prepared" state).
   - Durably logs `PREPARED(txid)`.
   - Acks.
3. Coordinator waits for acks from all (or a sufficient quorum, depending on the variant).

**Phase 3 — DoCommit:**
1. Coordinator durably logs `COMMITTED(txid)`, sends `DoCommit(txid)` to all participants.
2. Each participant applies changes, durably logs `DONE(txid)`, releases locks, acks.

**Recovery (the whole point):**
- A participant in `INITIAL` or `READY-TO-COMMIT` state (received CanCommit, replied Yes, didn't receive PreCommit) on coordinator timeout: safely abort. No one has decided yet.
- A participant in `PREPARED` state (received PreCommit, didn't receive DoCommit) on coordinator timeout: contact other participants. If any of them is also in `PREPARED` or has already committed, decide Commit. If none reached `PREPARED`, decide Abort.
- This recovery protocol assumes surviving participants can reach each other in bounded time. With network partitions, the protocol blocks.

**Optimizations** in practice:
- Phase 1 and Phase 2 are often coalesced (skip CanCommit, jump to PreCommit) — sacrificing the early-abort optimization for one fewer round-trip.
- The recovery election is essentially a mini-consensus among surviving participants — at which point you might as well use full Paxos for the whole thing.

## complexity
- **Messages**: `4N` in the happy path (CanCommit + PreCommit + DoCommit + ack rounds), one more round-trip than 2PC.
- **Log writes**: 3 per participant (prepared, decided, done), 2 per coordinator (decision, completion).
- **Latency**: `3 RTT` minimum plus fsync time — one RTT slower than 2PC.
- **Liveness**: non-blocking under synchronous-network assumptions; blocks under partitions, same as 2PC.

## pitfalls
- **Forgetting the synchrony assumption.** 3PC's non-blocking promise is only valid in a synchronous network where the recovery protocol can complete. Real WANs make this assumption false. Documentation that calls 3PC "non-blocking" without the asterisk has lied to a generation of engineers.
- **Skipping the CanCommit round.** Some implementations conflate CanCommit and PreCommit to save a round-trip. This removes 3PC's early-abort optimization (which lets participants drop transactions before acquiring expensive locks) and inches the protocol back toward 2PC.
- **Election bugs during recovery.** If two surviving participants election themselves coordinator simultaneously, they can issue conflicting decisions to other participants. The election must itself be a consensus protocol — at which point you've reinvented Paxos badly.
- **Treating recovery as a happy path.** 3PC requires every participant to know how to run the recovery protocol from any state. Most engineers focus on the happy path and miss the state transitions on coordinator failure. Test recovery, not commit.
- **Operating under the impression that 3PC removes the need for replicated logs.** It doesn't. The coordinator's logs and the participants' prepared-state logs still need to be durable. Crashed participants that forget what they acked break atomicity.

## interviewTips
- **Lead with what 3PC fixes and what it doesn't.** "Fixes 2PC's blocking under coordinator crashes; does NOT fix blocking under network partitions." Shows you read past the headline.
- **Volunteer the comparison with Paxos/Raft-backed 2PC.** Most modern systems use a 2PC protocol where the coordinator's decision log lives in a Paxos/Raft replicated group — three coordinator replicas survive one failure without blocking, under fully asynchronous network assumptions. That's the actual non-blocking commit story.
- **Recall Skeen's 1981 paper.** Cite the originator. Interviewers like seeing primary-source awareness.

## code
### python
```python
# 3PC participant state machine (skeleton). Real implementations log durably
# before every state transition and run a recovery protocol on coordinator timeout.

from enum import Enum

class State(Enum):
    INITIAL = "initial"
    READY = "ready"          # voted Yes in Phase 1
    PREPARED = "prepared"    # received PreCommit, durably prepared
    COMMITTED = "committed"
    ABORTED = "aborted"

class Participant:
    def __init__(self) -> None:
        self.state = State.INITIAL

    def on_can_commit(self, txid, ops):
        if self._can_apply(ops):
            self.state = State.READY
            return True
        self.state = State.ABORTED
        return False

    def on_pre_commit(self, txid):
        # Acquire locks, write redo/undo log, durable fsync.
        self.state = State.PREPARED
        return "ack"

    def on_do_commit(self, txid):
        # Apply prepared changes, release locks.
        self.state = State.COMMITTED
        return "done"

    def on_abort(self, txid):
        # Roll back if any state changed.
        self.state = State.ABORTED
        return "aborted"

    def on_coordinator_timeout(self, peers):
        # Recovery protocol — varies by state.
        if self.state == State.PREPARED:
            # Anyone in PREPARED -> COMMIT is safe.
            return self._elect_decision(peers, default="commit")
        if self.state == State.READY:
            # Nobody committed yet -> safe to ABORT.
            return self._elect_decision(peers, default="abort")
        return None  # already terminal

    def _can_apply(self, ops) -> bool: return True
    def _elect_decision(self, peers, default): return default
```

### javascript
```javascript
const State = { INITIAL: 'initial', READY: 'ready', PREPARED: 'prepared', COMMITTED: 'committed', ABORTED: 'aborted' };

class Participant {
  constructor() { this.state = State.INITIAL; }
  onCanCommit(txid, ops) {
    if (this.canApply(ops)) { this.state = State.READY; return true; }
    this.state = State.ABORTED; return false;
  }
  onPreCommit(txid)  { this.state = State.PREPARED;  return 'ack'; }
  onDoCommit(txid)   { this.state = State.COMMITTED; return 'done'; }
  onAbort(txid)      { this.state = State.ABORTED;   return 'aborted'; }
  canApply(ops) { return true; }
}
```

### java
```java
public class Participant {
    enum State { INITIAL, READY, PREPARED, COMMITTED, ABORTED }
    private State state = State.INITIAL;

    public synchronized boolean onCanCommit(long txid, Object ops) {
        if (canApply(ops)) { state = State.READY; return true; }
        state = State.ABORTED; return false;
    }
    public synchronized String onPreCommit(long txid) { state = State.PREPARED;  return "ack"; }
    public synchronized String onDoCommit(long txid)  { state = State.COMMITTED; return "done"; }
    public synchronized String onAbort(long txid)     { state = State.ABORTED;   return "aborted"; }
    private boolean canApply(Object ops) { return true; }
}
```

### cpp
```cpp
#include <mutex>

enum class State { Initial, Ready, Prepared, Committed, Aborted };

class Participant {
    State state{State::Initial};
    std::mutex mu;
public:
    bool on_can_commit(long long txid) {
        std::lock_guard g(mu);
        if (can_apply()) { state = State::Ready; return true; }
        state = State::Aborted; return false;
    }
    void on_pre_commit(long long txid) { std::lock_guard g(mu); state = State::Prepared;  }
    void on_do_commit(long long txid)  { std::lock_guard g(mu); state = State::Committed; }
    void on_abort(long long txid)      { std::lock_guard g(mu); state = State::Aborted;   }
private:
    bool can_apply() { return true; }
};
```
