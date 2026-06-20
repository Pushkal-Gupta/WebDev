---
slug: pbft-byzantine-tolerance
module: sd-consensus
title: PBFT — Practical Byzantine Fault Tolerance
subtitle: Three-phase consensus (pre-prepare, prepare, commit) that survives up to f malicious nodes out of 3f + 1, with signed messages and a stable primary.
difficulty: Advanced
position: 66
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)"
    url: "https://www.microsoft.com/en-us/research/publication/practical-byzantine-fault-tolerance/"
    type: paper
  - title: "Wikipedia — Byzantine fault tolerance"
    url: "https://en.wikipedia.org/wiki/Byzantine_fault"
    type: docs
  - title: "Wikipedia — Practical Byzantine Fault Tolerance"
    url: "https://en.wikipedia.org/wiki/Practical_Byzantine_Fault_Tolerance"
    type: docs
status: published
---

## intro
**PBFT** is the first practical algorithm that lets a replicated system agree on the order of client requests even when up to `f` of its `3f + 1` nodes are actively malicious — sending contradictory messages, forging values, or simply lying. Paxos and Raft tolerate crashes only; PBFT tolerates *arbitrary* behaviour from a minority. The protocol runs three rounds — **pre-prepare**, **prepare**, **commit** — each requiring a `2f + 1` quorum of signed votes, and uses a rotating primary that any replica can vote to replace via a view change. PBFT is the ancestor of every modern BFT consensus, from Tendermint and Istanbul-BFT to HotStuff and the BFT cores of permissioned blockchains.

## whyItMatters
The moment your replicated system spans organisations that do not fully trust each other — interbank settlement, permissioned blockchains, multi-tenant ledgers, BFT state machines for critical infrastructure — crash-fault tolerance is no longer enough. A compromised replica can sign two conflicting values, fabricate vote counts, or selectively reply to different clients to fork the log. PBFT is the canonical engineering answer. It runs in asynchronous networks, scales to a few dozen replicas, and finalises every request after three communication rounds with cryptographic non-repudiation. Knowing PBFT is the unlock for understanding every consensus algorithm published after 2017.

## intuition
The mental model: **Paxos with three rounds instead of two, because acceptors can lie**. In Paxos a single acceptor that says "I accepted v" is trusted — its word counts as evidence. With Byzantine acceptors, one liar can claim it accepted a value it never saw, so you need a *quorum* of `2f + 1` independent voters to cross-validate every step. The quorum size `2f + 1` and the cluster size `3f + 1` are not arbitrary — they come from a counting argument I'll walk through, then I'll explain why three rounds (not two) are needed.

**Why 3f + 1 nodes?** Suppose the cluster is `n` nodes, `f` of them faulty. To make progress you need to get responses from a quorum without waiting for slow or faulty nodes, so the quorum size is `n - f`. To guarantee that any two such quorums intersect in at least one non-faulty node, you need `2(n - f) - n > f`, i.e. `n > 3f`. The minimum cluster size is `n = 3f + 1` and the quorum size is `2f + 1`. Any two `2f + 1` quorums overlap in at least `f + 1` nodes — guaranteed to contain at least one honest replica.

**Why three rounds?** Round 1 (pre-prepare): the primary assigns a sequence number `n` to a client request and broadcasts it signed. A bad primary could send different `n`s for the same request to different replicas, splitting the cluster — so we need a round to *cross-verify the primary's broadcast*. Round 2 (prepare): every replica that accepted the pre-prepare echoes it to every other replica. A replica is **prepared** at `(view, n, request)` when it has collected `2f + 1` matching prepare messages — proof that an honest majority saw the same `(n, request)`. But "prepared on my replica" does not yet mean "prepared on a quorum of other replicas" — a malicious primary could equivocate to two disjoint subsets. Round 3 (commit): every prepared replica broadcasts a commit, and waits for `2f + 1` commits. When that arrives, the replica knows a quorum is *prepared with the same request* — safe to execute.

The cost of Byzantine tolerance is the extra round and `O(n²)` message traffic per request (every replica talks to every other). PBFT keeps the constant factors low enough that throughput beats most blockchain consensus while finality stays bounded — Castro and Liskov's original paper measured under 4ms additional latency vs. an unreplicated NFS server.

## visualization
```
                       PBFT happy path (n = 4 replicas, f = 1)
                                 R0 = primary
   client    R0 (primary)   R1            R2            R3(faulty/silent)
     |          |            |             |              |
     |--req---->|            |             |              |
     |          |--pre-prepare(view=0, n=1, req)-->        |
     |          |            |             |              |
     |          |            |--prepare(n=1)-->            |
     |          |--prepare(n=1)-->         |               |
     |          |            |             |--prepare-->   |
     |          |   <2f+1=3 matching prepares collected>   |
     |          |            |             |              |
     |          |--commit(n=1)-->          |              |
     |          |            |--commit-->  |              |
     |          |            |             |--commit-->   |
     |          |   <2f+1=3 matching commits collected>   |
     |          |   replica executes request at slot 1    |
     |<---reply-from-R0-------+---R1---+---R2-------------+
     |   client waits for f+1=2 matching replies          |
```

## bruteForce
The naive Byzantine solution is the original Lamport oral-messages protocol: every node broadcasts what it heard from every other node, recursively, for `f + 1` rounds, then takes a recursive majority. The communication cost is `O(n^(f+1))` messages and the round complexity is `f + 1` — impractical for any real `f > 0`. A different naive idea — "use a centralised arbiter and trust it" — fails the moment the arbiter is compromised. PBFT is the practical balance: `O(n²)` messages, three constant rounds, signed evidence so misbehaviour is provable.

## optimal
**Setup.** `n = 3f + 1` replicas indexed `0..n-1`. View number `v` rotates the primary as `v mod n`. Every replica holds a private signing key; every replica knows every other replica's public key. Client requests are signed and addressed to the primary.

**Pre-prepare (round 1).** Primary receives client request `m`, assigns sequence number `n_seq`, and broadcasts `<PRE-PREPARE, v, n_seq, hash(m), m>_signed_by_primary` to all backups. Each backup verifies the primary's signature, that the view matches, that `n_seq` is in the current watermark window, and that it has not already accepted a different pre-prepare for `(v, n_seq)`. If valid, the backup logs the pre-prepare.

**Prepare (round 2).** Each backup that accepted the pre-prepare broadcasts `<PREPARE, v, n_seq, hash(m), replica_id>_signed` to every other replica. A replica is **prepared** for `(v, n_seq, m)` when it has logged the pre-prepare plus `2f` matching prepares from distinct other replicas. The `2f + 1` matching messages (pre-prepare plus `2f` prepares) form a *prepared certificate* — cryptographic proof that an honest quorum agreed on `(n_seq, m)` in view `v`.

**Commit (round 3).** Once prepared, each replica broadcasts `<COMMIT, v, n_seq, hash(m), replica_id>_signed`. A replica is **committed-local** for `(v, n_seq, m)` when it has logged `2f + 1` matching commits. The replica then executes `m` against its state machine in sequence-number order and sends `<REPLY, v, ts, client_id, replica_id, result>_signed` to the client. The client waits for `f + 1` matching replies to accept the result — any single reply could be from a faulty replica.

**View change.** If the primary is faulty (or slow), a backup that times out on a request multicasts `<VIEW-CHANGE, v+1, n_stable, prepared_certificates>_signed`. When the new primary `(v + 1) mod n` collects `2f + 1` view-change messages, it broadcasts `<NEW-VIEW, v+1, view_change_msgs, pre-prepares-to-replay>`. The set of pre-prepares to replay is computed from the prepared certificates in the view-change messages: any request with a prepared certificate must be re-issued under the new view, possibly as a no-op if uncertainty remains, to preserve safety across the view boundary.

**Checkpointing.** Every `K` requests (typically `K = 100`), each replica multicasts a signed checkpoint of its state digest. When `2f + 1` matching checkpoints arrive, the digest forms a *stable checkpoint*; the replica garbage-collects all prepares, commits, and pre-prepares with sequence numbers below that checkpoint and slides the watermark window forward. Lagging or recovering replicas catch up by fetching the stable checkpoint state from any `f + 1` agreeing peers.

**Safety argument.** A request `m` executes at sequence `n_seq` in view `v` only if `2f + 1` replicas are committed-local. Any two `2f + 1` quorums overlap in `f + 1` nodes — at least one honest. That honest replica records the commit, propagates it across view changes, and prevents any other request `m' ≠ m` from accumulating the same certificate at `(v', n_seq)`.

## complexity
- **Messages per request (steady state):** `O(n²)` — every replica broadcasts in both prepare and commit rounds. Concretely, `2(n - 1) + (n - 1) = 3n - 3` messages sent by each backup; primary sends one pre-prepare.
- **Latency:** three message delays (pre-prepare + prepare + commit) before execution, plus one for reply. Roughly `4 × one-way` in the happy path.
- **Round complexity:** 3 rounds steady state; up to `O(n²)` messages during view change plus the cost of replaying prepared certificates.
- **Fault tolerance:** survives `f` Byzantine failures with `n = 3f + 1` replicas. Quorum size is `2f + 1`. A 4-node cluster survives one malicious node, 7-node survives two, 10-node survives three.
- **Throughput:** Castro and Liskov reported ~10,000 ops/sec on 1999 hardware with NFS workloads.

## pitfalls
- **Choosing `n = 2f + 1` because it works for Paxos.** Paxos tolerates crashes only; quorum intersection of `f + 1` is sufficient because honest minorities cannot equivocate. Byzantine equivocation forces `n = 3f + 1` so that two quorums of `2f + 1` overlap in `f + 1` ≥ 1 honest node. Cutting cluster size below `3f + 1` is a silent safety violation.
- **Skipping the commit round to save latency.** Two rounds (pre-prepare + prepare) are enough to *prepare* a value but not enough to *commit* it across view changes. A faulty primary plus a view change can erase a prepared-only request from the cluster's memory. The third round is what binds prepared certificates into view changes.
- **Trusting a single reply.** A faulty replica can return any answer it wants. Clients MUST wait for `f + 1` matching replies before accepting a result — that guarantees at least one honest replica produced the same answer.
- **Forgetting to authenticate every message.** PBFT's safety proof assumes signed messages with non-repudiation. Replacing signatures with MACs (as some implementations do for speed) breaks the proof under specific equivocation patterns — use MAC-only variants only after reading the relevant security analyses.
- **No view-change-replay logic for prepared certificates.** A common implementation bug: the new primary skips replaying half-finished requests, and a request that was prepared but not committed in view `v` silently vanishes in view `v + 1`. Always pull every prepared certificate from the `2f + 1` view-change messages and either re-issue or insert a null request at that slot.
- **Watermark drift.** Without checkpointing, the message log grows unbounded and lagging replicas can never catch up. Take a stable checkpoint every `K` requests, garbage-collect, and ship snapshots to recovering peers.

## interviewTips
- **Walk the `3f + 1` derivation aloud.** Interviewers who ask about Byzantine consensus are listening for the counting argument: `quorum = n - f`, two quorums overlap in `≥ 1` honest node, requires `2(n - f) - n ≥ f + 1`, gives `n ≥ 3f + 1`. Earning that line shows you understand *why* the size is what it is.
- **Map every PBFT round to a concrete failure it blocks.** Pre-prepare without prepare cannot detect a primary that sent different `(n_seq, m)` pairs to different replicas. Prepare without commit cannot survive a view change. Commit binds the prepared certificate into the next view. Pairing rounds with failures is the cleanest way to justify the protocol.
- **Be ready to compare with HotStuff / Tendermint.** Modern BFT consensus optimises PBFT's `O(n²)` message complexity to `O(n)` via threshold signatures or pipelined rounds. Naming HotStuff and Tendermint plus their `O(n)` win shows you have read past the 1999 paper.

## code
### python
```python
# PBFT replica state machine (skeleton — message signing/verification elided).
from collections import defaultdict

class PBFTReplica:
    def __init__(self, replica_id, n, f):
        self.id, self.n, self.f = replica_id, n, f
        self.view = 0
        self.log = {}                          # n_seq -> ("pre-prepare", request)
        self.prepares = defaultdict(set)       # (view, n_seq, digest) -> {replica_ids}
        self.commits  = defaultdict(set)
        self.executed = set()

    def primary(self): return self.view % self.n

    def on_pre_prepare(self, msg):
        v, n_seq, digest, request = msg
        if v != self.view or n_seq in self.log: return
        self.log[n_seq] = ("pre-prepare", request)
        self.broadcast(("prepare", v, n_seq, digest, self.id))

    def on_prepare(self, msg):
        _, v, n_seq, digest, sender = msg
        self.prepares[(v, n_seq, digest)].add(sender)
        if len(self.prepares[(v, n_seq, digest)]) >= 2 * self.f:
            self.broadcast(("commit", v, n_seq, digest, self.id))

    def on_commit(self, msg):
        _, v, n_seq, digest, sender = msg
        self.commits[(v, n_seq, digest)].add(sender)
        if (len(self.commits[(v, n_seq, digest)]) >= 2 * self.f + 1
                and n_seq not in self.executed):
            self.executed.add(n_seq)
            self.execute(self.log[n_seq][1])

    def execute(self, request): ...
    def broadcast(self, msg): ...
```

### javascript
```javascript
class PBFTReplica {
  constructor(id, n, f) {
    this.id = id; this.n = n; this.f = f;
    this.view = 0; this.log = new Map();
    this.prepares = new Map(); this.commits = new Map();
    this.executed = new Set();
  }
  key(v, ns, d) { return `${v}:${ns}:${d}`; }
  primary() { return this.view % this.n; }

  onPrePrepare({ view, nSeq, digest, request }) {
    if (view !== this.view || this.log.has(nSeq)) return;
    this.log.set(nSeq, request);
    this.broadcast({ type: 'prepare', view, nSeq, digest, sender: this.id });
  }
  onPrepare({ view, nSeq, digest, sender }) {
    const k = this.key(view, nSeq, digest);
    if (!this.prepares.has(k)) this.prepares.set(k, new Set());
    this.prepares.get(k).add(sender);
    if (this.prepares.get(k).size >= 2 * this.f)
      this.broadcast({ type: 'commit', view, nSeq, digest, sender: this.id });
  }
  onCommit({ view, nSeq, digest, sender }) {
    const k = this.key(view, nSeq, digest);
    if (!this.commits.has(k)) this.commits.set(k, new Set());
    this.commits.get(k).add(sender);
    if (this.commits.get(k).size >= 2 * this.f + 1 && !this.executed.has(nSeq)) {
      this.executed.add(nSeq);
      this.execute(this.log.get(nSeq));
    }
  }
  execute(req) {}
  broadcast(msg) {}
}
```

### java
```java
import java.util.*;

class PBFTReplica {
    int id, n, f, view = 0;
    Map<Integer, Object> log = new HashMap<>();
    Map<String, Set<Integer>> prepares = new HashMap<>();
    Map<String, Set<Integer>> commits = new HashMap<>();
    Set<Integer> executed = new HashSet<>();

    PBFTReplica(int id, int n, int f) { this.id = id; this.n = n; this.f = f; }

    String key(int v, int nSeq, String d) { return v + ":" + nSeq + ":" + d; }
    int primary() { return view % n; }

    public synchronized void onPrePrepare(int v, int nSeq, String digest, Object req) {
        if (v != view || log.containsKey(nSeq)) return;
        log.put(nSeq, req);
        broadcastPrepare(v, nSeq, digest);
    }

    public synchronized void onPrepare(int v, int nSeq, String digest, int sender) {
        var s = prepares.computeIfAbsent(key(v, nSeq, digest), k -> new HashSet<>());
        s.add(sender);
        if (s.size() >= 2 * f) broadcastCommit(v, nSeq, digest);
    }

    public synchronized void onCommit(int v, int nSeq, String digest, int sender) {
        var s = commits.computeIfAbsent(key(v, nSeq, digest), k -> new HashSet<>());
        s.add(sender);
        if (s.size() >= 2 * f + 1 && executed.add(nSeq)) execute(log.get(nSeq));
    }

    void broadcastPrepare(int v, int nSeq, String d) {}
    void broadcastCommit(int v, int nSeq, String d) {}
    void execute(Object req) {}
}
```

### cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <mutex>

struct PBFTReplica {
    int id, n, f, view = 0;
    std::unordered_map<int, std::string> log;
    std::unordered_map<std::string, std::unordered_set<int>> prepares, commits;
    std::unordered_set<int> executed;
    std::mutex mu;

    std::string key(int v, int ns, const std::string& d) {
        return std::to_string(v) + ":" + std::to_string(ns) + ":" + d;
    }
    int primary() const { return view % n; }

    void on_pre_prepare(int v, int ns, const std::string& d, std::string req) {
        std::lock_guard g(mu);
        if (v != view || log.count(ns)) return;
        log[ns] = std::move(req);
        // broadcast prepare(v, ns, d, id)
    }

    void on_prepare(int v, int ns, const std::string& d, int sender) {
        std::lock_guard g(mu);
        auto& s = prepares[key(v, ns, d)];
        s.insert(sender);
        if ((int)s.size() >= 2 * f) { /* broadcast commit */ }
    }

    void on_commit(int v, int ns, const std::string& d, int sender) {
        std::lock_guard g(mu);
        auto& s = commits[key(v, ns, d)];
        s.insert(sender);
        if ((int)s.size() >= 2 * f + 1 && executed.insert(ns).second) {
            // execute(log[ns])
        }
    }
};
```
