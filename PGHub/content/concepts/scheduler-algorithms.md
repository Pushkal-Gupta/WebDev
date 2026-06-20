---
slug: scheduler-algorithms
module: cs-os-concurrency
title: OS Scheduler Algorithms
subtitle: FIFO / SJF / RR / MLFQ / CFS — how the OS picks the next thread to run. Trade-offs between fairness, throughput, latency.
difficulty: Intermediate
position: 21
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — CPU Scheduling"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    type: book
  - title: "Linux kernel docs — CFS"
    url: "https://docs.kernel.org/scheduler/sched-design-CFS.html"
    type: blog
  - title: "torvalds/linux — kernel/sched/"
    url: "https://github.com/torvalds/linux/tree/master/kernel/sched"
    type: repo
status: published
---

## intro
The OS scheduler picks which **runnable** thread runs on each CPU core next. Different algorithms optimize different metrics — average waiting time, fairness, latency, throughput. **FIFO** (run in arrival order), **SJF** (shortest job first), **RR** (round robin), **MLFQ** (multi-level feedback queue), **CFS** (Linux's completely fair scheduler — virtual runtime). Production OSes use a hybrid (MLFQ / CFS / variants).

## whyItMatters
Scheduling choices show up in:
- **Latency-sensitive workloads** (DBs, games) need preemption + priority.
- **Batch workloads** (data processing) prefer throughput over fairness.
- **Interactive workloads** (desktops) need responsiveness within ~30ms.
- **Real-time** (audio, control systems) need deadline guarantees.

When a single VM hosts mixed workloads, the wrong scheduler = laggy UI / missed deadlines / starved background jobs.

## intuition
Two axes:
- **Preemptive vs non-preemptive**: can the scheduler yank a running thread off the CPU?
- **Priority vs fair**: do some threads get more CPU than others?

| Algo | Preempt | Priority |
|---|---|---|
| FIFO (FCFS) | No | No |
| SJF | No | implicit (shortest first) |
| Shortest Remaining Time First (SRTF) | Yes | yes (remaining time) |
| Round Robin | Yes | No |
| Priority scheduling | Yes/No | explicit |
| MLFQ | Yes | yes (auto-derived) |
| CFS | Yes | implicit (vruntime + niceness) |

## visualization
```
3 jobs arrive at T=0: A(burst=8), B(burst=4), C(burst=2)

FIFO (arrival order A, B, C):
  A: 0-8    B: 8-12    C: 12-14
  Wait times: A=0, B=8, C=12.  Avg=6.67

SJF (shortest first):
  C(2): 0-2   B(4): 2-6   A(8): 6-14
  Wait times: C=0, B=2, A=6.   Avg=2.67 ← better

Round Robin (quantum=2):
  A(2) B(2) C(2) A(2) B(2) A(2) A(2)  -- A finishes
  Wait times: A=6 (waits in queue), B=2+2=4, C=4. Avg=4.67
  Higher latency than SJF but FAIR.

MLFQ (multiple queues, demote on quantum-expire):
  Q0 (1ms quantum, high prio)
  Q1 (10ms quantum)
  Q2 (100ms quantum)
  Interactive jobs stay in Q0 (short bursts → never demoted).
  Long-running jobs drift down to Q1, Q2.
  Result: interactive feels responsive; batch still progresses.
```

## bruteForce
**Cooperative scheduling** (no preempt, threads voluntarily yield): one bad thread blocks everything. Used in old MacOS Classic and JavaScript event loop (kind of).

**Strict priority**: high-priority work always runs → low-priority starves. Add aging (priority increases with wait time) to mitigate.

**FIFO without RR**: long batch job blocks short interactive thread (convoy effect).

Modern OSes pick CFS / MLFQ for general-purpose; RTOS for real-time.

## optimal
**Linux CFS** (default since 2.6.23):
- Each thread has a **vruntime** = total CPU time used, scaled by nice value.
- Scheduler picks the thread with **lowest vruntime** to run next.
- Stored in a red-black tree keyed by vruntime → O(log n) pick.
- "Fairness" = all threads make progress proportional to their weight.
- **Niceness** (`nice -20` highest, `nice 19` lowest) scales how fast vruntime accumulates.

**MLFQ** (used in Windows / Solaris):
- N queues, each with its own priority + time quantum.
- New jobs start in highest queue.
- If a job uses its full quantum → demoted (long-running, batch).
- If a job yields before quantum → stays at level (interactive).
- Periodic boost: all jobs back to top to prevent starvation.

**Real-time** (RT kernel + SCHED_FIFO / SCHED_RR):
- Strict priority + bounded latency guarantees.
- Used for audio (PulseAudio rt-thread), industrial control, robotics.

**Containers**: cgroups CPU controller sets per-container weight + quota. Kubernetes CPU `requests` map to cgroup share; `limits` map to quota.

## complexity
- **FIFO / SJF queue**: O(1) per dispatch.
- **CFS RB-tree**: O(log n) insert/pick.
- **RR**: O(1) per tick.
- **MLFQ**: O(1) per dispatch + O(N) periodic rebalance.

## pitfalls
- **Priority inversion**: low-prio holds a lock high-prio needs → high-prio waits. Mitigate via priority inheritance (raise lock-holder's prio temporarily).
- **Convoy effect**: long job at front of queue blocks short jobs. RR mitigates.
- **Starvation under strict priority**: aging (boost waiting jobs' prio over time).
- **CFS group scheduling oddity**: containers with massive thread counts get less per-thread CPU than expected. Use cpu.weight + cgroups v2.
- **JVM threads = OS threads** (post-Java 21 with virtual threads, no longer 1:1). Don't blame scheduler when application overcommits threads.

## interviewTips
- For "design OS-level scheduler" — start with the goal (throughput / latency / fairness), pick algo accordingly.
- Mention **CFS** as Linux's default + the **vruntime + RB-tree** mechanism.
- For senior interviews, discuss **priority inheritance**, **real-time vs general-purpose**, **container cgroups**.

## code.python
```python
# Heap-based simulation of SJF (shortest-job-first preemptive)
import heapq
def sjf(jobs):
    """jobs = [(arrival, burst, id), ...] — returns list of (id, completion_time)."""
    jobs = sorted(jobs)
    heap, t, i = [], 0, 0
    done = []
    while heap or i < len(jobs):
        while i < len(jobs) and jobs[i][0] <= t:
            heapq.heappush(heap, (jobs[i][1], jobs[i][2]))
            i += 1
        if not heap:
            t = jobs[i][0]; continue
        burst, jid = heapq.heappop(heap)
        t += burst
        done.append((jid, t))
    return done
```

## code.javascript
```javascript
// Node.js doesn't expose scheduler tuning directly. Use libuv worker pool
// for CPU-bound work to avoid blocking the event loop:
const { Worker } = require('worker_threads');
new Worker('./cpu-heavy.js', { workerData: input });
// Each worker is its own thread, scheduled by the OS — not the event loop.
```

## code.java
```java
// Java 21+ virtual threads (Project Loom)
// Each virtual thread is cheap; JVM mounts onto carrier OS thread when runnable.
Thread.startVirtualThread(() -> handleRequest(req));
// OS scheduler only sees the carrier threads (~CPU-count).
```

## code.cpp
```cpp
// pthread + SCHED_RR for real-time
#include <pthread.h>
#include <sched.h>
struct sched_param p;
p.sched_priority = 50;
pthread_setschedparam(pthread_self(), SCHED_RR, &p);
// Now this thread runs with round-robin real-time priority.
```
