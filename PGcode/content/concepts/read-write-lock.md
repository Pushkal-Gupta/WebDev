---
slug: read-write-lock
module: cs-core
title: Read-Write Lock
subtitle: One writer xor many readers — the lock that scales reads without breaking write safety.
difficulty: Intermediate
position: 43
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Concurrency: Common Concurrency Problems"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf"
    type: book
  - title: "Readers-Writers Problem — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/readers-writers-problem-set-1-introduction-and-readers-preference-solution/"
    type: blog
  - title: "system-design-primer — Concurrency"
    url: "https://github.com/donnemartin/system-design-primer#concurrency"
    type: repo
status: published
---

## intro
A read-write lock (RW-lock) is a synchronisation primitive that allows either an unbounded number of concurrent readers, or exactly one writer, but never both at once. Reads are usually the majority of operations on shared state, so letting them proceed in parallel without serialising on a plain mutex can be a 10x throughput win. The cost is policy: who gets the lock when readers and a writer are both waiting? Get that wrong and one side starves.

## whyItMatters
Every caching layer, every in-memory key-value store, every concurrent map sees a workload that is 90%+ reads. A plain mutex forces every read to wait its turn, capping throughput at one operation per critical-section time. An RW-lock lets all readers proceed together, and only blocks them when a writer is actually in the section. The pattern is so common that Java's `ReentrantReadWriteLock`, C++'s `std::shared_mutex`, Go's `sync.RWMutex`, and Rust's `RwLock` are standard library fixtures.

## intuition
Model the lock as two counters and one mutex. `read_count` tracks how many readers are inside; `writer` is a 0/1 flag. To acquire-read: wait until no writer is in or waiting, then increment `read_count`. To release-read: decrement; if you are the last reader and a writer waits, signal them. To acquire-write: wait until both `read_count == 0` and no other writer is in. To release-write: clear the writer flag and broadcast to wake either the next writer or all waiting readers. The policy you encode in those "wait until" lines is what decides reader-preference vs writer-preference.

## visualization
```
Time -->     T0   T1   T2   T3   T4   T5   T6
Reader A:   acq---hold---hold---rel
Reader B:        acq---hold---rel
Writer  W:                  WAIT --- WAIT --- acq---hold---rel
Reader C:                                              WAIT--acq--

T2: B can join — A still has shared lock, writer not in.
T3: W asks. With writer-preference, new readers (C) block until W finishes.
T4-5: W waits for A,B to drain.
T6: W enters; C waits behind W.
```

## bruteForce
Use a single mutex around every operation. Every read serializes against every other read — a one-operation queue. Correct, but unscalable: on read-heavy workloads, throughput is bottlenecked by the slowest critical section. The two-counter pattern above is the standard upgrade. Some systems use a "sequence lock" — readers don't lock at all, they retry if they see a write happened mid-read — which is even faster but only works for plain-old-data reads.

## optimal
Pick a policy and stick with it. Reader-preference: as long as any reader is in, new readers join; writers wait. Risk: writer starvation under continuous read traffic. Writer-preference: a waiting writer blocks new readers from entering. Risk: reader starvation if writers keep arriving. Fair: serve in FIFO order regardless of role — the safest default and what `std::shared_mutex` aims at.

```
acquire_read():
    lock(m); while (writer_active or (writer_preference and writer_waiting > 0)): wait(cv);
    read_count++; unlock(m);

release_read():
    lock(m); read_count--;
    if read_count == 0: broadcast(cv);
    unlock(m);

acquire_write():
    lock(m); writer_waiting++;
    while (writer_active or read_count > 0): wait(cv);
    writer_waiting--; writer_active = true; unlock(m);

release_write():
    lock(m); writer_active = false; broadcast(cv); unlock(m);
```

## complexity
time: O(1) per acquire/release in the uncontended path. Under contention, throughput depends on the policy — readers scale near-linearly when writers are rare; writers cost O(R) wake-ups where R is the number of waiting readers.
space: O(1) for the lock state itself.
notes: Modern implementations use one atomic word: the high bit is the writer flag, the rest is reader count. CAS loops avoid most kernel transitions.

## pitfalls
- Reader starvation under writer-preference: if writes are frequent, readers never enter — the API works but throughput collapses.
- Writer starvation under reader-preference: if reads are constant, no writer ever runs.
- Holding a read lock and then trying to acquire a write lock without releasing — guaranteed deadlock unless the lock supports explicit upgrade (most do not).
- Nested acquire of the same lock by the same thread is undefined for `std::shared_mutex`; use a `recursive` variant if you need it.
- Lock-free reads via sequence locks are tempting but break for non-trivially-copyable values — a writer mid-update can leave a torn read.

## interviewTips
- Lead with the trade-off: "RW-lock buys read concurrency at the cost of writer latency or reader latency, depending on policy."
- Mention the standard-library names — `ReentrantReadWriteLock`, `std::shared_mutex`, `sync.RWMutex` — to show you have shipped this in real systems.
- Bring up alternatives: copy-on-write for read-mostly state, sequence locks for cheap reads of small data, persistent data structures for lock-free reads.
- The classic interview follow-up: "How would you implement an RW-lock from a mutex and a condition variable?" Be ready to write the four-method skeleton above.

## code.python
```python
import threading

class RWLock:
    def __init__(self):
        self._lock = threading.Lock()
        self._cv = threading.Condition(self._lock)
        self._readers = 0
        self._writer_active = False
        self._writers_waiting = 0

    def acquire_read(self):
        with self._cv:
            while self._writer_active or self._writers_waiting > 0:
                self._cv.wait()
            self._readers += 1

    def release_read(self):
        with self._cv:
            self._readers -= 1
            if self._readers == 0:
                self._cv.notify_all()

    def acquire_write(self):
        with self._cv:
            self._writers_waiting += 1
            while self._writer_active or self._readers > 0:
                self._cv.wait()
            self._writers_waiting -= 1
            self._writer_active = True

    def release_write(self):
        with self._cv:
            self._writer_active = False
            self._cv.notify_all()
```

## code.javascript
```javascript
class RWLock {
  constructor() {
    this.readers = 0;
    this.writerActive = false;
    this.writersWaiting = 0;
    this.queue = [];
  }
  _wake() {
    const next = this.queue.shift();
    if (next) next();
  }
  async acquireRead() {
    while (this.writerActive || this.writersWaiting > 0) {
      await new Promise(r => this.queue.push(r));
    }
    this.readers++;
  }
  releaseRead() {
    this.readers--;
    if (this.readers === 0) this._wake();
  }
  async acquireWrite() {
    this.writersWaiting++;
    while (this.writerActive || this.readers > 0) {
      await new Promise(r => this.queue.push(r));
    }
    this.writersWaiting--;
    this.writerActive = true;
  }
  releaseWrite() {
    this.writerActive = false;
    while (this.queue.length) this._wake();
  }
}
```

## code.java
```java
import java.util.concurrent.locks.*;

public class RWLock {
    private final ReentrantLock m = new ReentrantLock();
    private final Condition cv = m.newCondition();
    private int readers = 0;
    private boolean writerActive = false;
    private int writersWaiting = 0;

    public void acquireRead() throws InterruptedException {
        m.lock();
        try {
            while (writerActive || writersWaiting > 0) cv.await();
            readers++;
        } finally { m.unlock(); }
    }
    public void releaseRead() {
        m.lock();
        try {
            readers--;
            if (readers == 0) cv.signalAll();
        } finally { m.unlock(); }
    }
    public void acquireWrite() throws InterruptedException {
        m.lock();
        try {
            writersWaiting++;
            while (writerActive || readers > 0) cv.await();
            writersWaiting--;
            writerActive = true;
        } finally { m.unlock(); }
    }
    public void releaseWrite() {
        m.lock();
        try { writerActive = false; cv.signalAll(); }
        finally { m.unlock(); }
    }
}
```

## code.cpp
```cpp
#include <mutex>
#include <condition_variable>

class RWLock {
    std::mutex m;
    std::condition_variable cv;
    int readers = 0;
    bool writer_active = false;
    int writers_waiting = 0;
public:
    void acquire_read() {
        std::unique_lock<std::mutex> lk(m);
        cv.wait(lk, [&]{ return !writer_active && writers_waiting == 0; });
        readers++;
    }
    void release_read() {
        std::unique_lock<std::mutex> lk(m);
        if (--readers == 0) cv.notify_all();
    }
    void acquire_write() {
        std::unique_lock<std::mutex> lk(m);
        writers_waiting++;
        cv.wait(lk, [&]{ return !writer_active && readers == 0; });
        writers_waiting--;
        writer_active = true;
    }
    void release_write() {
        std::unique_lock<std::mutex> lk(m);
        writer_active = false;
        cv.notify_all();
    }
};
```
