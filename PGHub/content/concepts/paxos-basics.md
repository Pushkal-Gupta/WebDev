---
slug: paxos-basics
module: sd-consensus
title: Paxos Basics
subtitle: Single-decree Paxos — proposers, acceptors, learners, and the two-phase protocol.
difficulty: Advanced
position: 8
estimatedReadMinutes: 9
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
Paxos is the canonical algorithm for getting a set of nodes to agree on a single value despite crashes and lost messages. "Single-decree" Paxos decides one value once. Chain enough of those together and you have Multi-Paxos, the engine inside Chubby, Spanner, and many strongly consistent stores. Understanding the one-shot version is the gate.

## whyItMatters
Distributed agreement is unavoidable: leader election, configuration changes, replicated state machines, distributed locks — all reduce to "have N nodes agree on one value." Paxos proves it's possible under asynchrony with crash failures, and Multi-Paxos / Raft are essentially Paxos with optimizations. Knowing Paxos is the difference between "we use Raft" and *understanding* what Raft is doing.

## intuition
Three roles, often co-located: **proposers** push values, **acceptors** vote, **learners** observe the outcome. The trick is two phases. Phase 1 (Prepare) is a proposer asking acceptors to promise: "don't accept any older proposal." A majority of promises locks in the round. Phase 2 (Accept) is the proposer submitting a value; acceptors that haven't promised something newer accept it. Once a majority accepts the same value, it is **chosen** — and the protocol guarantees no other value can ever be chosen for that decree.

## visualization
```
Proposer P                Acceptors A1 A2 A3              Learners
   |  Prepare(n=5)          |  |  |
   |----------------------->|  |  |
   |  Promise(n=5,         |  |  |
   |    last={n=3,v="x"})  |  |  |
   |<----3 of 3 reply------|  |  |   <- quorum reached
   |
   |  Accept(n=5, v="x")    |  |  |   (must reuse v="x", highest prior accepted)
   |----------------------->|  |  |
   |  Accepted(n=5)         |  |  |
   |<----majority----------|  |  |   <- value "x" is chosen
   |
   |                       broadcast chosen value -----------------> learners
```

## bruteForce
Pick a fixed leader and have it broadcast the value. Works until the leader crashes; you now need consensus on who the new leader is — turtles all the way down. Or use 2-phase commit, which blocks indefinitely if the coordinator dies after phase 1. Paxos was invented precisely because the naive options fail under realistic failure models.

## optimal
**Phase 1 (Prepare)** — Proposer chooses a globally unique, monotonically increasing proposal number `n`, sends `Prepare(n)` to acceptors. Each acceptor that has not promised a larger number replies `Promise(n, lastAccepted)` where `lastAccepted` is the highest-numbered proposal it has already accepted (or none).

**Phase 2 (Accept)** — When the proposer gets a majority of promises, it picks the value: if any promise included a `lastAccepted`, the proposer **must** propose that value (the one with the highest accepted number); otherwise it's free to pick any value. It sends `Accept(n, v)`. Acceptors that have not promised a larger number reply `Accepted(n)`.

A value is **chosen** when a majority of acceptors have accepted the same `(n, v)`. Learners can be told directly, or learn via gossip.

```
proposer(v):
    n = nextUniqueNumber()
    promises = sendPrepare(n) to acceptors; wait for majority
    if any promise.lastAccepted is not null:
        v = promise with highest lastAccepted.n .value
    accepts = sendAccept(n, v); wait for majority
    if got majority of accepted: v is chosen

acceptor:
    on Prepare(n):
        if n > promised: promised = n; reply Promise(n, lastAccepted)
        else: reject
    on Accept(n, v):
        if n >= promised: promised = n; lastAccepted = (n, v); reply Accepted(n)
        else: reject
```

Why it's safe: any two majorities of acceptors share at least one node. That shared acceptor enforces the "must reuse a previously accepted value" rule, so once a value is chosen, every subsequent successful round adopts the same value.

## complexity
- **Messages per decision**: 4N in the best case (Prepare/Promise/Accept/Accepted), 2N if Phase 1 is skipped under Multi-Paxos with a stable leader.
- **Latency**: 2 round-trips for fresh decisions, 1 RTT once a leader is elected.
- **Quorum size**: majority (`floor(N/2) + 1`) — Paxos tolerates `floor((N-1)/2)` crash failures.
- **Liveness**: not guaranteed under FLP — duelling proposers can livelock by perpetually outbidding each other. Solution: a stable distinguished proposer (the leader), the genesis of Multi-Paxos.

## pitfalls
- **Reusing proposal numbers across proposers** — uniqueness is non-negotiable. Common scheme: `(round_counter, proposer_id)`, sorted lex.
- **Phase 2 picks the proposer's value when a Promise contained a `lastAccepted`** — that's a safety violation. Always re-propose the highest `lastAccepted` value if any.
- **Equating "chosen" with "all acceptors accepted"** — only a *majority* is needed and sufficient.
- **Dueling proposers livelock** — without a leader, two proposers can ping-pong Prepare numbers and never finish Phase 2.
- **Confusing single-decree Paxos with Multi-Paxos** — interview answers should be clear about which you're describing.
- **Forgetting persistence** — acceptors must durably store `promised` and `lastAccepted` before responding, or a crash-restart can re-promise an old number.

## interviewTips
- Lead with the three roles and the two phases — don't dive into proposal numbers first.
- Always mention the **majority overlap** insight — it's why Paxos works.
- Be ready to extend to **Multi-Paxos** (skip Phase 1 by electing a stable leader, then stream Accept messages for a log of decrees).
- If asked about Raft, frame it as "Multi-Paxos rewritten for understandability — leader election, log replication, safety, all explicit."
- Mention **FLP impossibility** for liveness — Paxos sidesteps it pragmatically via leader election + randomized backoff.

## code.python
```python
class Acceptor:
    def __init__(self):
        self.promised = -1
        self.last_accepted = None  # (n, value) or None

    def prepare(self, n):
        if n > self.promised:
            self.promised = n
            return ("promise", n, self.last_accepted)
        return ("reject",)

    def accept(self, n, value):
        if n >= self.promised:
            self.promised = n
            self.last_accepted = (n, value)
            return ("accepted", n)
        return ("reject",)


def propose(proposer_id, round_counter, acceptors, value):
    n = (round_counter, proposer_id)
    promises = [a.prepare(n) for a in acceptors]
    ok = [p for p in promises if p[0] == "promise"]
    if len(ok) <= len(acceptors) // 2:
        return None
    prior = [p[2] for p in ok if p[2] is not None]
    if prior:
        value = max(prior, key=lambda x: x[0])[1]
    accepted = [a.accept(n, value) for a in acceptors]
    if sum(1 for r in accepted if r[0] == "accepted") > len(acceptors) // 2:
        return value
    return None
```

## code.javascript
```javascript
class Acceptor {
  constructor() { this.promised = -Infinity; this.lastAccepted = null; }
  prepare(n) {
    if (n > this.promised) { this.promised = n; return { kind: "promise", lastAccepted: this.lastAccepted }; }
    return { kind: "reject" };
  }
  accept(n, value) {
    if (n >= this.promised) { this.promised = n; this.lastAccepted = { n, value }; return { kind: "accepted" }; }
    return { kind: "reject" };
  }
}

function propose(proposerId, round, acceptors, value) {
  const n = round * 1000 + proposerId;
  const promises = acceptors.map(a => a.prepare(n)).filter(p => p.kind === "promise");
  if (promises.length <= acceptors.length / 2) return null;
  const prior = promises.map(p => p.lastAccepted).filter(Boolean);
  if (prior.length) value = prior.sort((a, b) => b.n - a.n)[0].value;
  const acks = acceptors.map(a => a.accept(n, value)).filter(r => r.kind === "accepted");
  return acks.length > acceptors.length / 2 ? value : null;
}
```

## code.java
```java
import java.util.*;
class Acceptor {
    long promised = Long.MIN_VALUE;
    long lastN = Long.MIN_VALUE; String lastValue = null;
    String prepare(long n) {
        if (n > promised) { promised = n; return "promise:" + lastN + ":" + lastValue; }
        return "reject";
    }
    String accept(long n, String value) {
        if (n >= promised) { promised = n; lastN = n; lastValue = value; return "accepted"; }
        return "reject";
    }
}
class Paxos {
    static String propose(int proposerId, long round, List<Acceptor> as, String value) {
        long n = round * 1000 + proposerId;
        long bestN = Long.MIN_VALUE; String bestV = null; int promises = 0;
        for (Acceptor a : as) {
            String r = a.prepare(n);
            if (r.startsWith("promise")) {
                promises++;
                String[] p = r.split(":");
                long pn = Long.parseLong(p[1]);
                if (pn > bestN && !p[2].equals("null")) { bestN = pn; bestV = p[2]; }
            }
        }
        if (promises <= as.size() / 2) return null;
        if (bestV != null) value = bestV;
        int acks = 0;
        for (Acceptor a : as) if (a.accept(n, value).equals("accepted")) acks++;
        return acks > as.size() / 2 ? value : null;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <climits>
struct Acceptor {
    long promised = LLONG_MIN;
    long lastN = LLONG_MIN;
    std::string lastValue;
    bool hasLast = false;
    bool prepare(long n, long& outN, std::string& outV, bool& outHas) {
        if (n > promised) { promised = n; outN = lastN; outV = lastValue; outHas = hasLast; return true; }
        return false;
    }
    bool accept(long n, const std::string& v) {
        if (n >= promised) { promised = n; lastN = n; lastValue = v; hasLast = true; return true; }
        return false;
    }
};
std::string propose(int proposerId, long round, std::vector<Acceptor>& as, std::string value) {
    long n = round * 1000 + proposerId;
    int promises = 0; long bestN = LLONG_MIN; std::string bestV; bool any = false;
    for (auto& a : as) {
        long pn; std::string pv; bool ph;
        if (a.prepare(n, pn, pv, ph)) {
            promises++;
            if (ph && pn > bestN) { bestN = pn; bestV = pv; any = true; }
        }
    }
    if (promises <= (int)as.size() / 2) return "";
    if (any) value = bestV;
    int acks = 0;
    for (auto& a : as) if (a.accept(n, value)) acks++;
    return acks > (int)as.size() / 2 ? value : "";
}
```
