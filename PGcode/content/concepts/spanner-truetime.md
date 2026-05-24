---
slug: spanner-truetime
module: system-design
title: Spanner and TrueTime — External Consistency
subtitle: GPS plus atomic clocks turn bounded clock uncertainty into globally serializable transactions.
difficulty: Advanced
position: 6
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 9: Consistency and Consensus"
    url: "https://dataintensive.net/"
    type: book
  - title: "Jepsen — Spanner analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer — Strong consistency section"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
Google Spanner is the system that broke the old CAP-flavored mantra of "you cannot have global consistency and low latency together." It does it by tackling the problem nobody else dared: distributed clock uncertainty. Spanner gives every transaction a globally meaningful timestamp using TrueTime, an API backed by GPS receivers and atomic clocks in every datacenter. The trick is not perfect clocks — it is bounded uncertainty and the willingness to wait it out.

## whyItMatters
External consistency (also called linearizable + serializable across regions) is the strongest guarantee a database can offer: if transaction T1 commits before T2 starts, every observer sees T1 before T2, even if they live on different continents. Without it, financial ledgers, distributed locks, and global secondary indexes need application-level fences. Spanner made it commercially available, CockroachDB and YugabyteDB followed with NTP-based approximations, and every interview about "globally consistent X" now needs you to know how it works.

## intuition
NTP gives you a wall-clock guess with no error bound. Spanner's TrueTime returns an *interval* `[earliest, latest]` such that the true global time is provably inside the interval — typically 1–7 milliseconds wide. When a transaction wants to commit at time T, Spanner picks `T = TT.now().latest`, writes the value, and then *waits* until `TT.now().earliest > T`. After that wait, the entire universe agrees T is in the past. Two non-overlapping transactions therefore have non-overlapping timestamps — done.

## visualization
A commit-wait in action with 5 ms uncertainty bound `ε`:

```
T1 wants to commit                          T2 wants to commit
  TT.now() = [100, 105]                      TT.now() = [108, 113]
  pick commit_ts = 105                       pick commit_ts = 113
  write to Paxos quorum                      write to Paxos quorum
  WAIT until TT.now().earliest > 105         WAIT until TT.now().earliest > 113
  (sleeps ~5 ms)                             (sleeps ~5 ms)
  release locks                              release locks

  -> any observer that reads after T1 release sees T1
  -> T2 commit_ts > T1 commit_ts because T2 began after T1 release
  -> global serial order respected without coordinating with T2
```

The cost is the few milliseconds of commit-wait. The benefit is no cross-region coordination on the read path.

## bruteForce
Without TrueTime you have two unattractive options. (1) Centralize: one timestamp authority for the whole cluster — single point of failure and a latency floor of the round-trip to that authority. Google Percolator (BigTable transactions) took this path with a TSO and it works until the TSO is your bottleneck. (2) Vector/Hybrid Logical Clocks (HLCs): combine wall-clock and a logical counter; works without GPS but only gives causal consistency, not external. CockroachDB starts here and offers reduced guarantees compared to Spanner.

## optimal
Spanner's stack, layer by layer:
- **TrueTime daemon** on every machine: pulls GPS + atomic-clock readings from datacenter-local "time masters" (Marzullo's algorithm to reject outliers), exposes `TT.now() -> {earliest, latest}` with `ε` typically under 7 ms.
- **Paxos groups per partition** ("tablet") — synchronous quorum write across regions for the values themselves.
- **Two-phase commit across Paxos groups** for transactions that span partitions — coordinator is itself a Paxos group, so the commit decision is durable.
- **Commit wait** — the new idea — bridges Paxos durability to global serializability.
- **Snapshot reads at a timestamp** — any read picks `T = TT.now().latest` (or older for time-travel queries) and reads consistently from a Paxos quorum at that timestamp. No locks, no coordination with writers.

For a system to get Spanner-style guarantees on commodity hardware, the modern compromise is HLCs + clock-bound assumptions + transaction retries when the assumption is violated.

## complexity
time: Writes pay one Paxos round-trip plus `ε` commit wait. Reads at `TT.now().latest` are coordination-free against writes.
space: One Paxos log per tablet plus snapshot retention for old reads (controlled by `version_gc` setting).
notes: `ε` is the single most important number in the system. Datacenter-local time masters keep it ~1 ms; if a time master fails over to GPS-only or atomic-only, `ε` grows and commit latency grows with it. Spanner monitors `ε` and refuses to commit if it exceeds a threshold — a node with broken time is automatically removed.

## pitfalls
- Confusing TrueTime with "perfect clocks." It is a clock with *honest error bars*; everything follows from the willingness to wait the bars out.
- Assuming CockroachDB / YugabyteDB give the same guarantee out of the box — they use HLCs and require either `--max-offset` tuning or transaction restarts when the clock skew assumption breaks.
- Picking a snapshot read timestamp from the local NTP clock — defeats the consistency story.
- Long commit-wait under bad time sync silently inflates latency before any error is raised.
- Cross-region writes that need 2PC still pay the inter-region round-trip; TrueTime is not magic for write latency.

## interviewTips
- State the core trick: "Spanner does not eliminate clock uncertainty — it bounds it and waits it out." That one sentence wins the interview.
- Connect to CAP/PACELC: Spanner is CP/EC — sacrifices availability during partitions, consistency over latency in normal operation.
- Know that Spanner offers two read modes: strong reads (latest, may wait for replication) and stale reads (older timestamp, served from any replica, no waiting).
- Mention that the Spanner paper's "external consistency" is equivalent to "linearizability extended to transactions" — Jepsen confirmed Spanner meets it.
- For "design a globally distributed ledger" — the canonical answer references Spanner-style TrueTime + Paxos + 2PC.

## code.python
```python
import time
from dataclasses import dataclass

EPSILON_NS = 7_000_000  # 7 ms worst-case bound

@dataclass
class Interval:
    earliest: int
    latest: int

def tt_now() -> Interval:
    t = time.time_ns()
    return Interval(t - EPSILON_NS, t + EPSILON_NS)

def commit(write_fn, value):
    iv = tt_now()
    commit_ts = iv.latest
    write_fn(value, commit_ts)            # Paxos-replicate (omitted)
    while tt_now().earliest <= commit_ts: # commit-wait
        time.sleep(0.0005)
    release_locks(commit_ts)
    return commit_ts
```

## code.javascript
```javascript
const EPSILON_NS = 7_000_000n;

function ttNow() {
  const t = process.hrtime.bigint();
  return { earliest: t - EPSILON_NS, latest: t + EPSILON_NS };
}

async function commit(write, value) {
  const iv = ttNow();
  const commitTs = iv.latest;
  await write(value, commitTs);
  while (ttNow().earliest <= commitTs) {
    await new Promise((r) => setImmediate(r));
  }
  releaseLocks(commitTs);
  return commitTs;
}
```

## code.java
```java
final long EPSILON_NS = 7_000_000L;

record Interval(long earliest, long latest) {}

Interval ttNow() {
    long t = System.nanoTime();
    return new Interval(t - EPSILON_NS, t + EPSILON_NS);
}

long commit(BiConsumer<byte[], Long> write, byte[] value) throws InterruptedException {
    Interval iv = ttNow();
    long commitTs = iv.latest();
    write.accept(value, commitTs);
    while (ttNow().earliest() <= commitTs) {
        Thread.sleep(0, 500_000);
    }
    releaseLocks(commitTs);
    return commitTs;
}
```

## code.cpp
```cpp
#include <chrono>
#include <thread>

constexpr int64_t EPSILON_NS = 7'000'000;

struct Interval { int64_t earliest; int64_t latest; };

Interval tt_now() {
    auto t = std::chrono::steady_clock::now().time_since_epoch().count();
    return {t - EPSILON_NS, t + EPSILON_NS};
}

int64_t commit(auto&& write_fn, const std::vector<uint8_t>& value) {
    auto iv = tt_now();
    int64_t commit_ts = iv.latest;
    write_fn(value, commit_ts);
    while (tt_now().earliest <= commit_ts) {
        std::this_thread::sleep_for(std::chrono::microseconds(500));
    }
    release_locks(commit_ts);
    return commit_ts;
}
```
