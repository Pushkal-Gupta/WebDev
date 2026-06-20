---
slug: deadlock-coffman-conditions
module: cs-os-concurrency
title: Deadlock — Detection and Prevention
subtitle: The four Coffman conditions, wait-for graph cycle detection, and the lock-ordering discipline that prevents it all.
difficulty: Intermediate
position: 53
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Common Concurrency Problems"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf"
    type: book
  - title: "Coffman, Elphick, Shoshani — System Deadlocks (1971)"
    url: "https://dl.acm.org/doi/10.1145/356586.356588"
    type: paper
  - title: "Deadlock in Operating Systems — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/operating-systems/introduction-of-deadlock-in-operating-system/"
    type: blog
status: published
---

## intro
A deadlock is a set of threads where each holds a resource and waits for a resource held by another member of the set — a cycle of waiting that no thread can break. Thread A holds lock 1 and wants lock 2; thread B holds lock 2 and wants lock 1. Both block forever. Coffman's 1971 paper showed deadlock requires exactly four conditions to hold simultaneously, which gives you four distinct levers for preventing it.

## whyItMatters
- Deadlock is the concurrency bug that does not crash, does not corrupt data, and does not log — the system just stops. Production databases (MySQL, Postgres) run deadlock detectors continuously and kill victim transactions; the JVM ships `jstack` deadlock detection; Linux has lockdep precisely because humans cannot eyeball this.
- "Two threads, two locks, opposite order — what happens and how do you fix it?" is among the most common systems interview questions, and **dining philosophers** is its canonical dress-up.
- The four Coffman conditions — mutual exclusion, hold-and-wait, no preemption, circular wait — form a checklist: break any one and deadlock is impossible. Knowing which one your fix breaks is the difference between a memorized answer and an engineering answer.
- The same theory powers database transaction managers (wait-for graphs, victim selection), the Rust borrow checker's design pressure away from shared locks, and Go's runtime deadlock panic.

## intuition
Picture a four-way intersection where every car has pulled one car-length forward and now blocks the car to its left. Nobody can move because everybody holds a square of road (a resource) while waiting for the next square (another resource), nobody will reverse (no preemption), and the waiting forms a loop (circular wait). That picture *is* the Coffman conditions:

1. **Mutual exclusion** — the resource cannot be shared; one car per square, one thread per mutex.
2. **Hold and wait** — a thread keeps what it has while requesting more. The car does not vacate its square while waiting for the next.
3. **No preemption** — you cannot forcibly take a held resource. No tow truck drags a car out of the intersection.
4. **Circular wait** — the waits-for relation contains a cycle: A waits for B waits for C waits for A.

All four must hold *at the same time*. That is excellent news, because each condition is independently breakable. Make the resource shareable (reader locks for read-only access) and condition 1 falls. Acquire everything atomically up front — request both forks at once, succeed or take neither — and condition 2 falls. Allow preemption — `tryLock` with timeout, release everything and retry on failure — and condition 3 falls. Impose a global order on locks — always acquire lock 1 before lock 2, everywhere, no exceptions — and condition 4 falls, because a cycle requires somebody acquiring against the order.

In practice, lock ordering is the workhorse: it costs nothing at runtime and turns a dynamic property (did a cycle form?) into a static discipline (does any code path acquire out of order?). Detection — building the wait-for graph and running cycle detection — is the fallback when you cannot control acquisition order, which is exactly the situation a database is in with arbitrary user transactions.

## visualization
Two threads, two locks, acquiring in opposite order — the minimal deadlock, then the lock-ordering fix:

```
DEADLOCK                                  | FIXED (global order: L1 before L2)
tick | T1            | T2                 | tick | T1            | T2
-----+---------------+--------------------+------+---------------+---------------
  1  | lock(L1) OK   |                    |   1  | lock(L1) OK   |
  2  |               | lock(L2) OK        |   2  |               | lock(L1) BLOCK
  3  | lock(L2) BLOCK|                    |   3  | lock(L2) OK   |
  4  |               | lock(L1) BLOCK     |   4  | work; unlock  |
  5  | -- waits on T2 -- waits on T1 --   |   5  |               | lock(L1) OK
     | wait-for graph: T1 -> T2 -> T1     |   6  |               | lock(L2) OK
     | CYCLE => deadlock, forever         |      | no cycle possible: all waits
     |                                    |      | point "up" the lock order
```

Detection view: nodes are threads, edge T->U means "T waits for a lock U holds." Deadlock iff the graph has a cycle.

## bruteForce
The naive "strategy" is to ignore the problem and reboot when it happens — the so-called ostrich algorithm, and genuinely what desktop OSes do for application-level locks. One step up is timeout-everything: wrap every acquisition in `tryLock(timeout)` and assume failure means deadlock. Timeouts unblock the thread but cannot distinguish deadlock from a slow holder, can fire spuriously under load, and can produce **livelock**: both threads time out, both release, both retry on the same schedule, and both collide again, forever burning CPU while making no progress. Timeouts are a containment tool, not a diagnosis or a prevention scheme.

## optimal
A layered strategy: prevent where you control the code, detect where you do not.

**Prevention via lock ordering (break circular wait).** Assign every lock a global rank — an explicit level number, an address comparison, or an account-ID comparison in the classic bank-transfer problem — and require every thread to acquire locks in ascending rank. A cycle in the wait-for graph would need some edge pointing "down" the order, which the discipline forbids; therefore no cycle, therefore no deadlock. This is how large kernels and databases actually stay sane: Linux's lockdep records the acquisition order observed at runtime and *warns on the first ordering violation ever observed*, even if no deadlock happened on that run — turning a probabilistic production hang into a deterministic test failure.

**Prevention via all-or-nothing acquisition (break hold-and-wait).** Acquire all needed locks in one atomic step: `std::scoped_lock(m1, m2)` in C++ uses a deadlock-avoidance algorithm internally; the equivalent manual pattern is try-lock the second, and on failure release the first and retry. Nothing is held while waiting, so no hold-and-wait.

**Detection via wait-for graphs (when prevention is impossible).** A database cannot dictate the order in which transactions touch rows. So it maintains a graph — edge T1 -> T2 when T1 waits for a lock T2 holds — and runs cycle detection (DFS, O(V+E)) either periodically or whenever a wait begins. On finding a cycle it picks a **victim** (cheapest to roll back: least work done, fewest locks, or youngest) and aborts it, releasing its locks and breaking the cycle. The victim retries. This is precisely the `Deadlock found when trying to get lock; try restarting transaction` error MySQL/InnoDB returns.

**Avoidance (Banker's algorithm)** grants a request only if the resulting state is *safe* — some execution order exists in which everyone can finish. It needs maximum-demand declarations up front, so it survives mostly in embedded systems and exam questions, but interviewers still expect you to name it.

## complexity
time: wait-for-graph cycle detection is O(V + E) per check via DFS, for V waiting threads and E wait edges; lock ordering adds O(1) per acquisition (a rank comparison)
space: O(V + E) for the graph; O(1) for ordering discipline
notes: Detection frequency is a tunable — per-wait detection finds cycles instantly but costs a graph walk per block; periodic detection amortizes the cost but lets deadlocks linger until the next sweep.

## pitfalls
- Fixing a deadlock with timeouts alone and creating a livelock: both threads back off and retry in lockstep, forever. Add randomized jitter to retry delays, or switch to lock ordering.
- Ordering locks by object identity that can change or collide — e.g., locking "first argument then second" in `transfer(a, b)` deadlocks against the symmetric call `transfer(b, a)`. Order by a stable total key (account ID, lock address) instead.
- Forgetting that deadlock does not require mutexes: two threads each waiting on a condition the other will never signal, two services awaiting each other's HTTP responses with single-threaded handlers, or a thread pool whose tasks block on subtasks queued to the same saturated pool — all the same cycle, no `lock()` call in sight.
- Holding a lock while calling unknown code (callbacks, virtual methods, I/O) — the callee may acquire a lock that another thread holds while waiting for yours, completing a cycle you never wrote explicitly.
- Believing one weird acquisition order is fine "because those two paths never run concurrently" — load, refactors, and new entry points break that assumption silently; lockdep-style tools flag it immediately.

## interviewTips
- Recite the four Coffman conditions and immediately add the punchline: "break any one and deadlock is impossible — in practice you break circular wait with a global lock order."
- For the bank-transfer / dining-philosophers problem, give the total-order fix (lock lower account ID first; one philosopher picks forks in reverse) and name which Coffman condition it breaks.
- Distinguish the three strategies by who controls the code: prevention (you write all acquisition sites), avoidance (Banker's, needs declared maximums), detection + recovery (databases, arbitrary workloads, pick a victim and roll back).

## code.python
```python
import threading

class Account:
    _next_id = 0
    def __init__(self, balance):
        self.id = Account._next_id; Account._next_id += 1
        self.balance = balance
        self.lock = threading.Lock()

def transfer(src, dst, amount):
    # Break circular wait: always acquire in ascending account-id order,
    # so transfer(a, b) and transfer(b, a) agree on order and cannot cycle.
    first, second = (src, dst) if src.id < dst.id else (dst, src)
    with first.lock:
        with second.lock:
            src.balance -= amount
            dst.balance += amount

def detect_deadlock(wait_for):
    """Cycle detection on a wait-for graph {thread: thread_it_waits_on}."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {t: WHITE for t in wait_for}
    def dfs(t):
        color[t] = GRAY
        u = wait_for.get(t)
        if u is not None:
            if color.get(u, WHITE) == GRAY:
                return True                      # back edge => cycle => deadlock
            if color.get(u, WHITE) == WHITE and dfs(u):
                return True
        color[t] = BLACK
        return False
    return any(dfs(t) for t in wait_for if color[t] == WHITE)

a, b = Account(100), Account(100)
threads = [threading.Thread(target=transfer, args=(a, b, 1)) for _ in range(50)]
threads += [threading.Thread(target=transfer, args=(b, a, 1)) for _ in range(50)]
for t in threads: t.start()
for t in threads: t.join()
print(a.balance, b.balance)                      # 100 100 — and it terminated

print(detect_deadlock({"T1": "T2", "T2": "T1"}))  # True  — the classic cycle
print(detect_deadlock({"T1": "T2", "T2": None}))  # False — T2 runs, T1 unblocks
```

## code.javascript
```javascript
// Wait-for graph deadlock detection — what a DB lock manager runs.
// Edge t -> u means "transaction t waits for a lock u holds".

function findDeadlockCycle(waitFor) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(), parent = new Map();
  for (const t of Object.keys(waitFor)) color.set(t, WHITE);

  function dfs(t) {
    color.set(t, GRAY);
    const u = waitFor[t];
    if (u != null) {
      if (color.get(u) === GRAY) {              // back edge: reconstruct cycle
        const cycle = [u];
        for (let v = t; v !== u; v = parent.get(v)) cycle.push(v);
        return cycle.reverse();
      }
      if ((color.get(u) ?? WHITE) === WHITE) {
        parent.set(u, t);
        const found = dfs(u);
        if (found) return found;
      }
    }
    color.set(t, BLACK);
    return null;
  }

  for (const t of Object.keys(waitFor))
    if (color.get(t) === WHITE) {
      const cycle = dfs(t);
      if (cycle) return cycle;
    }
  return null;
}

function pickVictim(cycle, workDone) {
  // Roll back the transaction with the least work invested.
  return cycle.reduce((v, t) => (workDone[t] < workDone[v] ? t : v));
}

const waitFor = { T1: "T2", T2: "T3", T3: "T1", T4: "T1" };
const cycle = findDeadlockCycle(waitFor);
console.log("cycle:", cycle);                              // [T1, T2, T3]
console.log("victim:", pickVictim(cycle, { T1: 90, T2: 5, T3: 40 })); // T2
```

## code.java
```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.ReentrantLock;

class Account {
    final int id;
    int balance;
    final ReentrantLock lock = new ReentrantLock();
    Account(int id, int balance) { this.id = id; this.balance = balance; }
}

public class Demo {
    // Strategy 1 — break circular wait: global order by account id.
    static void transferOrdered(Account src, Account dst, int amount) {
        Account first = src.id < dst.id ? src : dst;
        Account second = src.id < dst.id ? dst : src;
        first.lock.lock();
        try {
            second.lock.lock();
            try { src.balance -= amount; dst.balance += amount; }
            finally { second.lock.unlock(); }
        } finally { first.lock.unlock(); }
    }

    // Strategy 2 — break hold-and-wait: all-or-nothing with backoff + jitter
    // (jitter prevents livelock where both sides retry in lockstep).
    static void transferTryLock(Account src, Account dst, int amount)
            throws InterruptedException {
        while (true) {
            if (src.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
                try {
                    if (dst.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
                        try { src.balance -= amount; dst.balance += amount; return; }
                        finally { dst.lock.unlock(); }
                    }
                } finally { src.lock.unlock(); }
            }
            Thread.sleep(ThreadLocalRandom.current().nextInt(1, 5));
        }
    }

    public static void main(String[] args) throws Exception {
        Account a = new Account(1, 100), b = new Account(2, 100);
        Thread t1 = new Thread(() -> { for (int i = 0; i < 1000; i++) transferOrdered(a, b, 1); });
        Thread t2 = new Thread(() -> { for (int i = 0; i < 1000; i++) transferOrdered(b, a, 1); });
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println(a.balance + " " + b.balance);  // 100 100, no hang
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>

struct Account {
    int id;
    int balance;
    std::mutex m;
    Account(int id, int balance) : id(id), balance(balance) {}
};

// Break hold-and-wait: std::scoped_lock acquires both mutexes atomically
// using a deadlock-avoidance algorithm — order of arguments is irrelevant.
void transfer(Account& src, Account& dst, int amount) {
    std::scoped_lock lk(src.m, dst.m);
    src.balance -= amount;
    dst.balance += amount;
}

// Alternative: break circular wait manually with a global order by id.
void transfer_ordered(Account& src, Account& dst, int amount) {
    Account& first  = src.id < dst.id ? src : dst;
    Account& second = src.id < dst.id ? dst : src;
    std::lock_guard<std::mutex> l1(first.m);
    std::lock_guard<std::mutex> l2(second.m);
    src.balance -= amount;
    dst.balance += amount;
}

int main() {
    Account a(1, 100), b(2, 100);
    std::vector<std::thread> ts;
    // Opposite-direction transfers — the classic deadlock shape, made safe.
    for (int i = 0; i < 4; i++) {
        ts.emplace_back([&] { for (int k = 0; k < 1000; k++) transfer(a, b, 1); });
        ts.emplace_back([&] { for (int k = 0; k < 1000; k++) transfer(b, a, 1); });
    }
    for (auto& t : ts) t.join();
    std::cout << a.balance << ' ' << b.balance << '\n';   // 100 100, terminates
}
```
