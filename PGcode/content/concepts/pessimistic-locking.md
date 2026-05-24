---
slug: pessimistic-locking
module: cs-core
title: Pessimistic Locking
subtitle: Lock-then-mutate — serialize access, prevent conflicts, detect deadlocks.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces — Concurrency: Locks"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Patterns of Enterprise Application Architecture — Pessimistic Offline Lock"
    url: "https://martinfowler.com/eaaCatalog/pessimisticOfflineLock.html"
    type: blog
  - title: "redis/redis — Redlock and SET NX PX"
    url: "https://github.com/redis/redis"
    type: repo
status: published
---

## intro
Pessimistic locking acquires a lock on the resource *before* reading or modifying it; anyone else who wants the same resource waits. This is the default mental model of `mutex`, `synchronized`, and `SELECT ... FOR UPDATE`. It assumes conflicts are frequent and pays the lock-acquire cost up front to guarantee correctness without retries.

## whyItMatters
When contention is high (auctions, ticketing, inventory reservation, leader election), the optimistic retry loop spins forever — every attempt collides with another. Pessimistic locks serialize execution and make progress deterministic. The cost: blocked waiters, lock-queue tail latency, and the risk of deadlock. Most production systems mix both strategies — pessimistic for the few hot rows, optimistic for everything else.

## intuition
A lock is a coordination atom owned by exactly one holder at a time. To mutate, you `acquire` (blocking until granted), do the work, then `release`. The locking protocol must guarantee progress (no permanent starvation) and safety (no two holders, no missed releases on crash). Distributed locks add a third concern: the holder must not believe it still owns the lock after the lease has actually expired.

## visualization
```
T1 BEGIN
T1 SELECT * FROM seat WHERE id=42 FOR UPDATE    -- acquires X-lock on seat 42
                                                  T2 SELECT ... FOR UPDATE      -- BLOCKED
T1 UPDATE seat SET status='sold' WHERE id=42
T1 COMMIT                                          -- releases lock
                                                  T2 proceeds with the new state

deadlock pattern (two locks, opposite order):
   T1: lock A -> request B
   T2: lock B -> request A
   wait-for graph: T1 -> T2 -> T1     cycle => DEADLOCK
   resolution: detector aborts the youngest victim; aborted txn retries
```

## bruteForce
Wrap *every* operation in a global mutex (one giant lock). Correct, simple, and the system runs single-threaded — wasting every other core. Workable for tiny workloads; the moment QPS climbs the lock becomes the bottleneck and tail latency explodes due to the queue.

## optimal
Lock at the finest granularity that still guarantees safety:
```
row-level locks (SELECT ... FOR UPDATE):       per-row, serializes only contenders for that row
intention locks (IX/IS) + row locks:           lets the engine reason about table-level conflicts cheaply
read/write locks:                              many readers OR one writer; good when reads dominate
distributed locks (Redis SET NX PX, ZooKeeper ephemeral nodes, etcd leases):
                                               TTL = fencing, owner renews; lease expiry releases automatically
```
Prevent deadlock by **lock ordering** (always take locks in a canonical order) or **detection** (DBMS builds a wait-for graph, aborts a victim) or **timeouts** (give up after T ms and retry). Always set a max acquisition timeout — a missing timeout is how lock holders silently halt the whole system.

For distributed locks, use a **fencing token** (monotonic counter handed to each acquirer) so a delayed holder whose lease expired can't corrupt state by writing after a new holder has taken over.

## complexity
time: O(1) acquire on uncontended path; under contention, wait grows with the queue depth and the critical section length
space: O(W) where W = waiters; the DB maintains a wait-for graph for deadlock detection
notes: Under high contention pessimistic beats optimistic because each transaction completes once; optimistic retries N times.

## pitfalls
- Forgetting to release on every exit path — use `try/finally`, RAII, or `with` blocks; never `release` after the work and hope.
- Inconsistent lock order across code paths — guarantees deadlock eventually.
- Holding a lock across a network call or user-interactive step — the lock pins resources for seconds; design out the wait.
- Using SQL `SELECT ... FOR UPDATE` without an index on the predicate — the engine may escalate to a table lock and stall unrelated transactions.
- Distributed locks without fencing — a paused holder (GC, VM migration) can wake up after expiry and write through, corrupting state. Always carry a monotonic token and reject stale writes server-side.

## interviewTips
- Lead with the contention argument: "pessimistic wins above ~30% conflict rate because optimistic retries dominate."
- Be ready to draw a wait-for graph and explain detection vs prevention vs avoidance (Banker's).
- Mention reentrancy, fairness (FIFO), and starvation explicitly.
- For distributed locks, name Redlock's controversy and Martin Kleppmann's "How to do distributed locking" — interviewers love the fencing-token point.
- Compare cost: in-process mutex ~25 ns, row lock ~100 us, distributed lock ~1-5 ms; pick the cheapest correct option.

## code.python
```python
import threading, time, contextlib

class Account:
    def __init__(self, balance):
        self.balance = balance
        self.lock = threading.Lock()

@contextlib.contextmanager
def acquire_ordered(*locks, timeout=5.0):
    ordered = sorted(locks, key=id)
    held = []
    deadline = time.monotonic() + timeout
    try:
        for lk in ordered:
            remaining = deadline - time.monotonic()
            if remaining <= 0 or not lk.acquire(timeout=remaining):
                raise TimeoutError("lock acquisition timed out")
            held.append(lk)
        yield
    finally:
        for lk in reversed(held):
            lk.release()

def transfer(src, dst, amount):
    with acquire_ordered(src.lock, dst.lock):
        if src.balance < amount:
            raise ValueError("insufficient funds")
        src.balance -= amount
        dst.balance += amount
```

## code.javascript
```javascript
import { Mutex } from 'async-mutex';

class Account {
  constructor(balance) { this.balance = balance; this.mutex = new Mutex(); }
}

async function acquireOrdered(locks, fn, timeoutMs = 5000) {
  const ordered = [...locks].sort((a, b) => a.id - b.id);
  const releases = [];
  const deadline = Date.now() + timeoutMs;
  try {
    for (const lk of ordered) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('lock timeout');
      releases.push(await lk.acquire());
    }
    return await fn();
  } finally {
    for (const r of releases.reverse()) r();
  }
}

export async function transfer(src, dst, amount) {
  await acquireOrdered([src.mutex, dst.mutex], () => {
    if (src.balance < amount) throw new Error('insufficient funds');
    src.balance -= amount;
    dst.balance += amount;
  });
}
```

## code.java
```java
class Account {
    final long id;
    long balance;
    final ReentrantLock lock = new ReentrantLock(true);
    Account(long id, long balance) { this.id = id; this.balance = balance; }
}

void transfer(Account src, Account dst, long amount) throws InterruptedException {
    Account first = src.id < dst.id ? src : dst;
    Account second = src.id < dst.id ? dst : src;

    if (!first.lock.tryLock(5, TimeUnit.SECONDS))  throw new TimeoutException();
    try {
        if (!second.lock.tryLock(5, TimeUnit.SECONDS)) throw new TimeoutException();
        try {
            if (src.balance < amount) throw new IllegalStateException("insufficient funds");
            src.balance -= amount;
            dst.balance += amount;
        } finally { second.lock.unlock(); }
    } finally { first.lock.unlock(); }
}
```

## code.cpp
```cpp
struct Account {
    long id;
    long balance;
    std::timed_mutex mu;
};

bool transfer(Account& src, Account& dst, long amount) {
    Account *first = src.id < dst.id ? &src : &dst;
    Account *second = src.id < dst.id ? &dst : &src;

    using namespace std::chrono;
    if (!first->mu.try_lock_for(seconds(5))) return false;
    std::unique_lock<std::timed_mutex> g1(first->mu, std::adopt_lock);

    if (!second->mu.try_lock_for(seconds(5))) return false;
    std::unique_lock<std::timed_mutex> g2(second->mu, std::adopt_lock);

    if (src.balance < amount) return false;
    src.balance -= amount;
    dst.balance += amount;
    return true;
}
```
