---
slug: priority-inversion
module: cs-os-concurrency
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

The reframe that makes this click: priority is supposed to mean "runs before." But a lock quietly rewires that promise. The moment H needs something L is holding, H's fate is chained to L's — and anything that delays L now delays H by proxy. M never touches the lock, yet M outranks L, so the scheduler keeps handing M the CPU while L (and therefore H) starves. The high-priority task has been *demoted to L's priority in practice*, without anyone asking for it.

Put real numbers on it. Give H priority 30, M priority 20, L priority 10, and say H must finish by t=10ms. At t=0 L grabs mutex K; its critical section needs only 2ms of CPU. At t=1 H wakes, preempts L, tries K, and blocks. At t=2 M wakes with a 50ms compute loop. The scheduler compares the two runnable tasks — M(20) versus L(10) — and picks M every time. L gets zero CPU from t=2 to t=52, so its 2ms critical section cannot finish, K never releases, and H is stuck the whole time. H blows its 10ms deadline by roughly 44ms — not because H was slow, but because a priority-20 task with no interest in the lock was allowed to outrank the priority-10 lock holder. That inversion is *unbounded*: it lasts as long as M (or a stream of medium tasks) chooses to run, which is exactly what froze the Mars Pathfinder.

## visualization
Scheduler timeline, priorities H=30 M=20 L=10, H deadline t=10. Without any fix:

```
time | running | prio | holds K | blocked (waiting)   | note
-----|---------|------|---------|---------------------|-------------------
  0  |   L     |  10  |   L     | -                   | L takes mutex K
  1  |   H     |  30  |   L     | -                   | H preempts L
  2  |   H     |  30  |   L     | H (on K)            | H blocks on K
  3  |   M     |  20  |   L     | H                   | M(20) beats L(10)
 ..  |   M     |  20  |   L     | H                   | M loops, L starved
 10  |   M     |  20  |   L     | H                   | H DEADLINE MISSED
```

With priority inheritance the instant H blocks on K, L is boosted to 30:

```
time | running | prio  | holds K | blocked | note
-----|---------|-------|---------|---------|--------------------------
  0  |   L     |  10   |   L     | -       | L takes K
  1  |   H     |  30   |   L     | -       | H preempts L
  2  |   L     | 30(*) |   L     | H       | L inherits H's 30
  3  |   L     | 30(*) |   L     | H       | M(20) cannot preempt L
  4  |   L     |  10   |   -     | -       | L releases K, deboosts
  5  |   H     |  30   |   H     | -       | H runs, meets deadline
```

The `(*)` marks the inherited priority. M is held off the CPU until L exits its critical section, so the inversion is bounded to L's short critical section instead of M's long loop.

## bruteForce
Disable interrupts or use a single global lock around every shared resource. This trivially prevents inversion but destroys throughput on multi-core systems and breaks any soft-real-time guarantees. Acceptable only in trivial embedded controllers with one thread of execution.

## optimal
Three mainstream mitigations:

1. **Priority inheritance.** When H blocks on a mutex held by L, raise L's effective priority to max(L, H) until L releases the mutex. Used by Linux PI futexes and real-time kernels like VxWorks (after the Pathfinder post-mortem).
2. **Priority ceiling protocol.** Each mutex is statically tagged with a "ceiling" = the highest priority of any task that might ever acquire it. Acquiring the mutex temporarily boosts the holder to the ceiling. Prevents inversion *and* deadlock simultaneously, but requires static analysis to assign ceilings.
3. **Lock-free / wait-free data structures.** Side-step locks entirely with atomic compare-and-swap. Eliminates inversion at the cost of more complex algorithms and weaker progress guarantees per operation.

Why priority inheritance is correct, stated as an invariant: *no runnable task with priority strictly between the lock holder's real priority and the highest blocked waiter's priority may run while that waiter is blocked.* Boosting the holder to the max priority of everyone waiting on its lock enforces exactly that — M(20) can never slot in front of an L that is temporarily 30, so the only thing that can delay H is L's own critical-section work. That bounds the inversion to the sum of the critical sections H can collide with, a quantity the designer can actually measure, rather than the unbounded "however long M feels like running."

Step by step, inheritance runs entirely at lock/unlock time. On `acquire`, if the lock is held and the requester outranks the holder, raise the holder's effective priority to the requester's and enqueue the requester. On `release`, restore the holder to its saved real priority, then hand the lock to the highest-priority waiter and wake it. Each step is O(1) bookkeeping; the boosted-priority field is O(1) space per lock.

The tradeoff versus the priority ceiling protocol: inheritance is *reactive* — it boosts only when a collision actually happens, needs no static knowledge, and fits general-purpose kernels (Linux PI futexes). Ceiling is *proactive* — it boosts on every acquire to a precomputed ceiling, which also prevents deadlock and chained blocking, but demands offline analysis to assign each mutex its ceiling. Inheritance can still cascade through a chain of locks and must propagate the boost transitively; the correctness argument only holds if that propagation is complete, which is why implementations walk the full waiter chain.

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
