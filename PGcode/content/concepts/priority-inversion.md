---
slug: priority-inversion
module: cs-core
title: Priority Inversion
subtitle: A low-priority task holds a lock the high-priority task needs; mitigation via priority inheritance.
difficulty: Advanced
position: 44
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Priority Inversion in Operating Systems — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/operating-systems/priority-inversion-what-the-heck/"
    type: blog
  - title: "TheAlgorithms/Python — sorts and scheduling references"
    url: "https://github.com/TheAlgorithms/Python/tree/master/scheduling"
    type: repo
status: published
---

## intro
Priority inversion is a scheduling anomaly where a high-priority task is blocked indefinitely because a low-priority task is holding a resource it needs — while a medium-priority task happily monopolises the CPU, starving the low-priority task and so indirectly the high-priority one. It famously crashed the Mars Pathfinder rover and still surfaces in any system with priority-based preemption and shared mutexes.

## whyItMatters
Real-time systems (avionics, robotics, embedded medical devices) make hard deadlines part of their contract. A high-priority deadline missed because of inversion is not "slow" — it's incorrect. Even general-purpose servers feel inversion: a request thread waits on a config-cache mutex held by a background scrubber, while the scheduler hands CPU to unrelated medium-priority work. Knowing the failure pattern is required for any senior systems interview.

## intuition
Three tasks: H (high), M (medium), L (low). L acquires a mutex. H becomes runnable and preempts L. H tries to acquire the same mutex and blocks. Now the scheduler picks the highest-priority runnable task — that's M. M runs and runs, never touching the mutex, while L cannot get CPU time to release it. H is effectively waiting on M, even though M has lower priority. Unbounded inversion: M can hold the CPU for as long as it wants.

## visualization
Time 0: L starts, acquires mutex K.
Time 1: H wakes, preempts L. H tries to lock K, blocks.
Time 2: M wakes (priority between L and H). Scheduler picks M over L because M's priority is higher.
Time 3..100: M runs. L stays blocked. H stays blocked. H's deadline at t=10 is missed.

With priority inheritance: at time 1, when H blocks on K, the OS temporarily boosts L's priority to H's. Now M cannot preempt L. L finishes its critical section quickly, releases K, drops back to its real priority, and H proceeds.

## bruteForce
Disable interrupts or use a single global lock around every shared resource. This trivially prevents inversion but destroys throughput on multi-core systems and breaks any soft-real-time guarantees. Acceptable only in trivial embedded controllers with one thread of execution.

## optimal
Three mainstream mitigations:

1. **Priority inheritance.** When H blocks on a mutex held by L, raise L's effective priority to max(L, H) until L releases the mutex. Used by Linux PI futexes and real-time kernels like VxWorks (after the Pathfinder post-mortem).
2. **Priority ceiling protocol.** Each mutex is statically tagged with a "ceiling" = the highest priority of any task that might ever acquire it. Acquiring the mutex temporarily boosts the holder to the ceiling. Prevents inversion *and* deadlock simultaneously, but requires static analysis to assign ceilings.
3. **Lock-free / wait-free data structures.** Side-step locks entirely with atomic compare-and-swap. Eliminates inversion at the cost of more complex algorithms and weaker progress guarantees per operation.

## complexity
time: Inheritance adds O(1) priority bookkeeping per lock/unlock. Ceiling adds O(1) plus a static analysis pass.
space: O(1) per lock for the boosted-priority field.
notes: Inheritance can cascade — L holds K1, M holds K2; H wants K1, J (higher than H) wants K2. Implementations must propagate the boost transitively. Linux PI futexes handle this with a chain walk capped by RLIMIT_NPROC.

## pitfalls
- Believing priority inversion only matters in embedded systems. Any priority-scheduled mutex codebase (Java's `synchronized` with `setPriority`, POSIX with SCHED_FIFO) can suffer it.
- Confusing inversion with starvation: starvation is "low-priority never runs"; inversion is "high-priority blocked by low-priority via shared lock."
- Assuming priority inheritance fixes everything: it solves inversion but not deadlock. Use ceiling protocols when deadlock is a concern.
- Mixing PI futexes with non-PI mutexes in the same lock graph — Linux explicitly disallows inheritance across the boundary.

## interviewTips
- Tell the Mars Pathfinder story briefly. It's the canonical motivating example and shows historical awareness.
- Draw the timeline (H blocks, L holds, M preempts) before naming the mitigations.
- Distinguish bounded inversion (acceptable, occurs even with inheritance during the critical section) from unbounded inversion (the bug).
- Mention that lock-free structures eliminate the entire failure mode but at the cost of correctness-proof difficulty.

## code.python
```python
import threading
import time

class PriorityInheritanceLock:
    def __init__(self):
        self._mutex = threading.Lock()
        self._owner = None
        self._owner_priority = None
        self._waiters = []

    def acquire(self, task):
        with self._mutex:
            if self._owner is None:
                self._owner = task
                self._owner_priority = task.priority
                return True
            self._waiters.append(task)
            if task.priority > self._owner.priority:
                self._owner.boost(task.priority)
        while True:
            with self._mutex:
                if self._owner is task:
                    return True
            time.sleep(0.001)

    def release(self, task):
        with self._mutex:
            assert self._owner is task
            task.restore()
            if self._waiters:
                self._waiters.sort(key=lambda t: -t.priority)
                self._owner = self._waiters.pop(0)
                self._owner_priority = self._owner.priority
            else:
                self._owner = None
```

## code.javascript
```javascript
class PriorityInheritanceLock {
  constructor() {
    this.owner = null;
    this.waiters = [];
  }

  async acquire(task) {
    if (!this.owner) {
      this.owner = task;
      return;
    }
    if (task.priority > this.owner.priority) {
      this.owner.boost(task.priority);
    }
    await new Promise((resolve) => {
      this.waiters.push({ task, resolve });
    });
  }

  release(task) {
    if (this.owner !== task) throw new Error("Not owner");
    task.restore();
    if (this.waiters.length) {
      this.waiters.sort((a, b) => b.task.priority - a.task.priority);
      const next = this.waiters.shift();
      this.owner = next.task;
      next.resolve();
    } else {
      this.owner = null;
    }
  }
}
```

## code.java
```java
class PriorityInheritanceLock {
    private Thread owner;
    private int ownerOriginal;
    private final Deque<Thread> waiters = new ArrayDeque<>();

    public synchronized void acquire(Thread t) throws InterruptedException {
        while (owner != null && owner != t) {
            if (t.getPriority() > owner.getPriority()) {
                owner.setPriority(t.getPriority());
            }
            waiters.add(t);
            wait();
        }
        if (owner == null) {
            owner = t;
            ownerOriginal = t.getPriority();
        }
    }

    public synchronized void release(Thread t) {
        if (owner != t) throw new IllegalMonitorStateException();
        t.setPriority(ownerOriginal);
        owner = null;
        notifyAll();
    }
}
```

## code.cpp
```cpp
#include <mutex>
#include <condition_variable>
#include <thread>
#include <queue>

class PriorityInheritanceLock {
    std::mutex m;
    std::condition_variable cv;
    std::thread::id owner;
    int ownerOriginalPriority = 0;

public:
    void acquire(std::thread::id me, int myPriority, std::function<void(std::thread::id,int)> boost) {
        std::unique_lock<std::mutex> lk(m);
        while (owner != std::thread::id() && owner != me) {
            if (myPriority > ownerOriginalPriority) boost(owner, myPriority);
            cv.wait(lk);
        }
        owner = me;
        ownerOriginalPriority = myPriority;
    }

    void release(std::thread::id me, std::function<void(std::thread::id,int)> restore) {
        std::unique_lock<std::mutex> lk(m);
        if (owner != me) throw std::runtime_error("not owner");
        restore(me, ownerOriginalPriority);
        owner = std::thread::id();
        cv.notify_all();
    }
};
```
