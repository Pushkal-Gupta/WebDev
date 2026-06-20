---
slug: mutex-semaphore-condvar
module: cs-os-concurrency
title: Mutex vs Semaphore vs Condition Variable
subtitle: The three core synchronization primitives — ownership, counting, and waiting-for-a-fact — and when each is the right tool.
difficulty: Intermediate
position: 52
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Locks"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf"
    type: book
  - title: "OSTEP — Condition Variables"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf"
    type: book
  - title: "OSTEP — Semaphores"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf"
    type: book
status: published
---

## intro
A mutex grants exclusive ownership of a critical section to one thread at a time. A semaphore maintains a counter and lets up to N threads proceed. A condition variable lets a thread sleep until some application-level fact becomes true, then be woken by whoever made it true. They look interchangeable from a distance — all three block threads — but they answer three different questions: who may enter, how many may enter, and when may I continue. Picking the wrong one is the root of half of all concurrency bugs.

## whyItMatters
- Every threaded codebase you will ever touch — JVM services, C++ engines, Python workers, Go runtimes under the hood — is built on these three primitives or thin wrappers over them (`synchronized`, `std::lock_guard`, `threading.Condition`, channels).
- The classic interview problems — **bounded buffer (producer-consumer)**, **readers-writers**, **dining philosophers**, **rate limiter**, **print FooBar alternately** (LeetCode 1115), **Building H2O** (LeetCode 1117) — are all exercises in choosing between mutex, semaphore, and condition variable correctly.
- Dijkstra introduced semaphores in 1965; Hoare and Mesa monitors (1974) introduced condition variables; modern OSes implement all of them over futexes. Understanding the layering is what separates "I know the API" from "I know why my code deadlocks."
- Misuse patterns — locking with a semaphore initialized to 1, polling a flag instead of waiting on a condvar, signaling before locking — show up constantly in real code review.

## intuition
Think of a single-stall restroom, a parking lot, and a doorbell.

A **mutex** is the restroom with one key. The thread that takes the key owns it; nobody else enters until that exact thread returns the key. Ownership matters: only the locker may unlock, and good implementations enforce this. The mutex protects a *place* (a critical section over shared data), and the invariant is binary — occupied or free.

A **semaphore** is a parking lot with N spaces and a counter on the gate. `acquire()` decrements the counter and blocks when it hits zero; `release()` increments it and wakes a waiter. Crucially, there is no ownership: any thread may release, including a thread that never acquired. That property is not a bug — it is the feature that lets semaphores act as *signaling* devices. A producer can `release()` an "items available" semaphore that only consumers ever `acquire()`. A binary semaphore (N=1) superficially resembles a mutex but lacks ownership, priority-inheritance support, and recursive-lock detection — which is why "use a binary semaphore as a lock" is an antipattern.

A **condition variable** is a doorbell wired to a *predicate you define*. It has no counter and no memory: `wait()` puts you to sleep, `signal()` wakes someone *currently sleeping* — a signal with no waiter vanishes. That is why a condvar is always used with a mutex and a loop: lock the mutex, check the predicate (`while buffer is empty`), `wait()` (which atomically releases the mutex and sleeps, then re-acquires on wake), re-check the predicate, proceed. The re-check handles spurious wakeups and the Mesa-semantics gap where another thread may have consumed the state between signal and wake.

The decision rule: protecting shared data → mutex. Limiting concurrency to N or signaling counted events → semaphore. Sleeping until an arbitrary predicate over shared state becomes true → condition variable plus mutex.

## visualization
Bounded buffer (capacity 2), one producer P and one consumer C, using mutex `m` + condvars `not_full` / `not_empty`:

```
tick | P action                     | C action                     | buffer | who sleeps
-----+------------------------------+------------------------------+--------+-----------
  1  | lock(m); push(a); signal(ne) |                              | [a]    | -
  2  | unlock(m)                    | lock(m); pop()->a; signal(nf)| []     | -
  3  | lock(m); push(b); signal(ne) | unlock(m)                    | [b]    | -
  4  | lock(m); push(c); signal(ne) |                              | [b,c]  | -
  5  | lock(m); buffer FULL         |                              | [b,c]  | -
  6  | wait(not_full)  [drops m]    | lock(m); pop()->b; signal(nf)| [c]    | P
  7  | wakes, re-lock(m), re-check  | unlock(m)                    | [c]    | -
  8  | push(d); signal(ne); unlock  |                              | [c,d]  | -
```

The `while`-loop re-check at tick 7 is mandatory: between `signal(nf)` and P re-acquiring `m`, another producer could have filled the slot.

## bruteForce
The naive substitute for all three primitives is a **spin loop on a shared flag**: `while (locked) {} locked = true`. It is broken twice over. Without atomic test-and-set, two threads can both observe `locked == false` and both enter — a race. Even with atomics, spinning burns a full core while waiting, starves the thread holding the lock on a single CPU, and gives no fairness or sleep/wake integration with the scheduler. Polling a condition ("is the buffer non-empty yet?") in a sleep loop has the same flavor: either you poll fast and waste CPU, or you poll slow and add latency. Blocking primitives exist precisely so the kernel can deschedule waiters and wake exactly the right ones.

## optimal
Use each primitive for the job it was designed for, and combine them with discipline.

**Mutex for mutual exclusion.** Acquire, touch shared state, release — keep the critical section tiny, never call blocking I/O or user callbacks while holding it. Modern mutexes (futex-based) cost a single atomic compare-and-swap when uncontended — nanoseconds — and only trap into the kernel when there is actual contention. Prefer RAII wrappers (`std::lock_guard`, Python `with lock:`, Java `try/finally`) so an exception can never leak a held lock.

**Semaphore for counted resources and cross-thread signaling.** Initialize to N for an N-slot resource pool (database connections, bounded parallelism); initialize to 0 to make a thread wait for an event another thread will post (`acquire()` in the waiter, `release()` in the notifier). A semaphore *remembers* releases — a `release()` before any `acquire()` is banked, not lost — which is exactly what condvars cannot do, and exactly why semaphores are the right tool for "event may fire before the waiter arrives" ordering problems like LeetCode 1114 (Print in Order).

**Condition variable for predicates.** The canonical pattern, verbatim:

```python
with lock:
    while not predicate():     # while, never if
        cv.wait()
    consume_state()
    cv.notify()                # if your change enables others
```

`wait()` atomically releases the lock and sleeps — atomicity here closes the lost-wakeup window where a signal lands between your unlock and your sleep. Use `notify_all()` when waiters wait on *different* predicates over the same condvar, or when one state change may satisfy several waiters; use `notify()` when waiters are interchangeable and one wake suffices (broadcast costs a thundering herd of wake-recheck-resleep).

The bounded buffer brings all of it together: one mutex guarding the queue, `not_full` for producers, `not_empty` for consumers — or equivalently two semaphores (`empty=N`, `full=0`) plus a mutex. Both solutions are correct; the semaphore version encodes the count in the primitive, the condvar version keeps the count in your data structure. Interviewers accept either but expect you to defend the choice.

## complexity
time: O(1) uncontended (one atomic CAS); contended acquire/wait costs a syscall + context switch, ~1-10 microseconds
space: O(1) per primitive plus O(W) kernel wait-queue entries for W blocked threads
notes: Futex-based implementations stay entirely in user space until contention occurs; `notify_all` wakes all W waiters, who then serialize re-acquiring the mutex — O(W) wakeups for possibly one unit of work.

## pitfalls
- Using `if` instead of `while` around `cv.wait()` — spurious wakeups and Mesa semantics mean the predicate may be false when you wake; always re-check in a loop.
- Calling `signal()`/`notify()` without holding (or having just held) the associated mutex, allowing the lost-wakeup race where the waiter checks the predicate, the signaler signals, and only then the waiter sleeps — forever.
- Treating a binary semaphore as a mutex: no ownership means any thread can "unlock" it, no recursive-acquire detection, and no priority inheritance — a recipe for silent corruption and priority inversion.
- Forgetting that condition variables are memoryless: a `notify()` with no thread currently waiting does nothing. If the event can precede the wait, you need a semaphore or a flag checked under the mutex.
- Holding the mutex while doing blocking I/O or calling unknown callbacks — serializes the whole system and invites deadlock if the callback tries to take the same lock.

## interviewTips
- Lead with the one-line taxonomy: "mutex = exclusive ownership of a critical section, semaphore = counter with no ownership for resources/signaling, condvar = sleep until a predicate holds, always paired with a mutex and a while-loop."
- For producer-consumer, be able to write BOTH the two-semaphore version and the two-condvar version, and explain the lost-wakeup bug the `while` loop prevents.
- Mention that a posted semaphore is remembered but a condvar signal is not — this single sentence answers most "why did my thread hang forever" follow-ups.

## code.python
```python
import threading
from collections import deque

class BoundedBuffer:
    def __init__(self, cap):
        self.cap = cap
        self.q = deque()
        self.lock = threading.Lock()
        self.not_full = threading.Condition(self.lock)
        self.not_empty = threading.Condition(self.lock)

    def put(self, item):
        with self.lock:
            while len(self.q) == self.cap:
                self.not_full.wait()        # while, never if
            self.q.append(item)
            self.not_empty.notify()

    def get(self):
        with self.lock:
            while not self.q:
                self.not_empty.wait()
            item = self.q.popleft()
            self.not_full.notify()
            return item

buf = BoundedBuffer(2)
results = []

def producer():
    for i in range(5):
        buf.put(i)

def consumer():
    for _ in range(5):
        results.append(buf.get())

# Semaphore as a signaling device: consumer can start before producer posts.
ready = threading.Semaphore(0)

def poster():
    ready.release()                          # banked even if no waiter yet

def waiter():
    ready.acquire()                          # wakes immediately if already posted

t1, t2 = threading.Thread(target=producer), threading.Thread(target=consumer)
t1.start(); t2.start(); t1.join(); t2.join()
print(results)                               # [0, 1, 2, 3, 4]
```

## code.javascript
```javascript
// Single-threaded JS still needs async mutual exclusion and counting:
// concurrent async tasks interleave at every await.

class Mutex {
  constructor() { this.queue = Promise.resolve(); }
  runExclusive(fn) {
    const result = this.queue.then(fn);
    this.queue = result.catch(() => {});    // keep chain alive on error
    return result;
  }
}

class Semaphore {
  constructor(n) { this.n = n; this.waiters = []; }
  async acquire() {
    if (this.n > 0) { this.n--; return; }
    await new Promise(res => this.waiters.push(res));
  }
  release() {
    const next = this.waiters.shift();
    if (next) next();                        // hand the permit directly over
    else this.n++;                           // bank it — semaphores remember
  }
}

const mutex = new Mutex();
let counter = 0;
const bump = () => mutex.runExclusive(async () => {
  const v = counter;
  await new Promise(r => setTimeout(r, 1));  // interleaving point
  counter = v + 1;                           // safe: serialized by mutex
});

const sem = new Semaphore(2);                // at most 2 fetches in flight
async function limitedFetch(id) {
  await sem.acquire();
  try { return `fetched ${id}`; }
  finally { sem.release(); }
}

Promise.all([bump(), bump(), bump()])
  .then(() => console.log(counter));         // 3, never 1
Promise.all([1, 2, 3, 4].map(limitedFetch)).then(console.log);
```

## code.java
```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.Semaphore;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

class BoundedBuffer<T> {
    private final Deque<T> q = new ArrayDeque<>();
    private final int cap;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    BoundedBuffer(int cap) { this.cap = cap; }

    void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (q.size() == cap) notFull.await();   // while, never if
            q.addLast(item);
            notEmpty.signal();
        } finally { lock.unlock(); }
    }

    T take() throws InterruptedException {
        lock.lock();
        try {
            while (q.isEmpty()) notEmpty.await();
            T item = q.pollFirst();
            notFull.signal();
            return item;
        } finally { lock.unlock(); }
    }
}

public class Demo {
    public static void main(String[] args) throws Exception {
        BoundedBuffer<Integer> buf = new BoundedBuffer<>(2);
        Thread p = new Thread(() -> {
            try { for (int i = 0; i < 5; i++) buf.put(i); }
            catch (InterruptedException ignored) {}
        });
        Thread c = new Thread(() -> {
            try { for (int i = 0; i < 5; i++) System.out.println(buf.take()); }
            catch (InterruptedException ignored) {}
        });
        p.start(); c.start(); p.join(); c.join();

        Semaphore ready = new Semaphore(0);            // signaling: release banked
        new Thread(ready::release).start();
        ready.acquire();                               // proceeds even if posted first
        System.out.println("event observed");
    }
}
```

## code.cpp
```cpp
#include <condition_variable>
#include <deque>
#include <iostream>
#include <mutex>
#include <semaphore>
#include <thread>

template <typename T>
class BoundedBuffer {
    std::deque<T> q;
    size_t cap;
    std::mutex m;
    std::condition_variable not_full, not_empty;
public:
    explicit BoundedBuffer(size_t cap) : cap(cap) {}

    void put(T item) {
        std::unique_lock<std::mutex> lk(m);
        not_full.wait(lk, [&] { return q.size() < cap; });  // predicate loop built in
        q.push_back(std::move(item));
        not_empty.notify_one();
    }

    T take() {
        std::unique_lock<std::mutex> lk(m);
        not_empty.wait(lk, [&] { return !q.empty(); });
        T item = std::move(q.front());
        q.pop_front();
        not_full.notify_one();
        return item;
    }
};

int main() {
    BoundedBuffer<int> buf(2);
    std::thread producer([&] { for (int i = 0; i < 5; i++) buf.put(i); });
    std::thread consumer([&] {
        for (int i = 0; i < 5; i++) std::cout << buf.take() << ' ';
    });
    producer.join(); consumer.join();

    std::counting_semaphore<1> ready(0);   // C++20: signaling, release is banked
    std::thread poster([&] { ready.release(); });
    ready.acquire();                       // wakes even if release ran first
    std::cout << "\nevent observed\n";
    poster.join();
}
```
