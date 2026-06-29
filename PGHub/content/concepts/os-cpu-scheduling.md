---
slug: os-cpu-scheduling
module: operating-systems
title: CPU Scheduling
subtitle: How the OS decides which ready job runs next — FCFS, SJF, Round Robin, and priority — and the turnaround and waiting times each one produces.
difficulty: Beginner
position: 2
estimatedReadMinutes: 14
prereqs: [os-processes-threads]
relatedProblems: []
references:
  - title: "OSTEP — Scheduling: Introduction (Chapter 7)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    type: book
  - title: "OSTEP — Scheduling: The Multi-Level Feedback Queue (Chapter 8)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf"
    type: book
  - title: "Wikipedia — Scheduling (computing)"
    url: "https://en.wikipedia.org/wiki/Scheduling_(computing)"
    type: article
status: published
---

## intro
When more runnable jobs exist than CPU cores, the operating system's **scheduler** must repeatedly answer one question: of all the jobs ready to run, which one runs next, and for how long? The policy it uses is a **scheduling algorithm**, and the choice has large, measurable consequences for how long each job waits and how long it takes to finish. This lesson works through the four classic policies — First-Come-First-Served, Shortest-Job-First, Round Robin, and priority — and shows exactly how each fills the CPU timeline and what average waiting and turnaround time results.

## whyItMatters
Scheduling is where an operating system's abstractions meet a hard, fixed resource: CPU time. The same set of jobs, run under different policies, can feel snappy or sluggish, fair or starved. Get it wrong and a long batch job blocks every interactive task behind it (the *convoy effect*); get it right and a video call stays smooth while a compile runs in the background. The same trade-offs reappear everywhere a queue is served — thread pools, network packet schedulers, disk I/O elevators, job runners, even load balancers — so the metrics and intuitions transfer far beyond the kernel. Interviewers favor scheduling because it is concrete and quantitative: given arrival and burst times you can *compute* the answer, which separates candidates who memorized names from those who understand the mechanism and its costs.

## intuition
Every job needs a chunk of CPU time called its **burst**. The scheduler keeps a **ready queue** of jobs that can run, and on each scheduling decision it picks one. Two metrics judge the outcome. **Turnaround time** is completion time minus arrival time — the total wall-clock a job spent in the system. **Waiting time** is turnaround minus burst — the time it sat in the ready queue not running. Lower averages are better; the algorithms differ in *which* average they optimize and at *whose* expense.

**First-Come-First-Served (FCFS)** runs jobs in arrival order, to completion, no interruptions. It is trivially fair in a queue-at-the-bakery sense, but one long job at the front makes everyone behind it wait — the **convoy effect** — so average waiting time can be terrible. **Shortest-Job-First (SJF)** instead always runs the job with the smallest remaining burst. It is *provably optimal* for minimizing average waiting time when all jobs are present, because finishing short jobs first lets their small bursts "get out of the way" of fewer waiters. Its flaw is **starvation**: a steady stream of short jobs can keep a long one waiting forever, and it needs to know burst lengths in advance (real schedulers estimate them).

**Round Robin (RR)** is the interactive workhorse. It gives each job a fixed **time quantum**, runs it for that slice, then preempts it and rotates it to the back of the queue. No job waits more than (n−1) quanta for its next turn, so responsiveness is excellent and no one starves — but the constant switching adds **context-switch overhead**, and turnaround time is usually worse than SJF because even short jobs get chopped into pieces. The quantum is the tuning knob: too large and RR degenerates into FCFS; too small and overhead dominates. **Priority scheduling** runs the highest-priority ready job first; it expresses importance directly but can starve low-priority jobs, which real systems fix with **aging** — gradually raising a waiting job's priority. SJF is just priority scheduling where the priority *is* the shortest remaining burst.

## visualization
```
Jobs:  A(burst 6)  B(burst 2)  C(burst 8)  D(burst 3)   all arrive at t=0

FCFS  (arrival order A,B,C,D):
  | A A A A A A | B B | C C C C C C C C | D D D |
  0           6     8                 16      19
  waits: A=0 B=6 C=8 D=16   avg wait = 7.5

SJF   (shortest burst first B,D,A,C):
  | B B | D D D | A A A A A A | C C C C C C C C |
  0    2       5            11                 19
  waits: B=0 D=2 A=5 C=11    avg wait = 4.5   <-- optimal

RR    (quantum = 3, order A,B,C,D):
  | A A A | B B | C C C | D D D | A A A | C C C | C C |
  short jobs (B,D) finish early; long jobs (A,C) interleave fairly
```

## bruteForce
The simplest scheduler is FCFS: keep one queue, append each arriving job, and always run the one at the head to completion before touching the next. It needs no knowledge of burst lengths, never preempts, and is starvation-free — every job eventually reaches the front. But it optimizes nothing about waiting time. A single long-running job at the head forces every later job, however short, to wait through the entire burst — the convoy effect — so a batch of quick interactive tasks stuck behind one heavy computation all suffer. As a baseline it is correct and dead simple, which is exactly why it is the thing better policies are measured against.

## optimal
There is no single "best" scheduler — the right policy depends on what you are optimizing and what you know. If you want to **minimize average waiting time** and you know (or can estimate) burst lengths, **Shortest-Job-First** is provably optimal: at every decision, running the job with the least remaining work minimizes the total time other jobs spend waiting. Its preemptive cousin, **Shortest-Remaining-Time-First**, re-evaluates on each arrival and is optimal when jobs arrive over time. The catch is that exact bursts are unknown in practice, so schedulers *predict* the next burst from a job's recent history (an exponential moving average), and they must guard against **starvation** of long jobs. If you instead want **responsiveness and fairness** for interactive work, **Round Robin** with a well-chosen quantum bounds how long any job waits for its next slice, at the cost of more context switches and slightly worse turnaround. Real operating systems combine these ideas in a **multi-level feedback queue**: several priority levels, each Round-Robin internally, where a job that uses its whole quantum sinks to a lower level (it looks CPU-bound) and a job that yields early stays high (it looks interactive) — with periodic **aging** to lift long-starved jobs back up. This adaptively approximates SJF *without* knowing burst lengths ahead of time, while keeping interactive jobs snappy. The practical takeaway: choose the metric you care about — waiting time, turnaround, response time, fairness — and pick the policy that optimizes it, then defend against the failure mode (convoy for FCFS, starvation for SJF and priority, overhead for tiny RR quanta).

## complexity
time: Picking the next job is O(1) for FCFS and Round Robin (queue head / rotation) and O(log n) per decision for SJF or priority using a min-heap keyed by remaining burst or priority. Computing turnaround and waiting times over n jobs is O(n).
space: O(n) for the ready queue or priority heap holding the runnable jobs.
notes: Round Robin's real cost is the extra context switches: a tiny quantum means many switches per job, each flushing caches; a huge quantum makes RR behave like FCFS. SJF's optimality assumes accurate burst knowledge, which real systems only estimate.

## pitfalls
- Confusing waiting time with turnaround time. Turnaround = completion − arrival (total time in system); waiting = turnaround − burst (time in the ready queue). Reporting one when the question asks for the other is the most common scheduling-problem mistake.
- Assuming SJF is always best. It minimizes *average waiting time* but can starve long jobs forever and needs burst lengths it usually does not have; it is optimal only under those assumptions, not universally.
- Setting the Round Robin quantum carelessly. Too large and RR collapses into FCFS (no responsiveness gain); too small and context-switch overhead dominates real work. The quantum must sit comfortably above the switch cost.
- Ignoring starvation in priority scheduling. Without aging, a steady supply of high-priority jobs keeps low-priority ones permanently waiting — the classic cause of a "stuck" background task. Aging gradually raises a waiter's priority to guarantee progress.
- Forgetting arrival times. Many problems give staggered arrivals; a job cannot be scheduled before it arrives, and preemptive policies (SRTF, RR) must re-decide at each arrival, not just at completions.

## interviewTips
- State the two metrics precisely before computing: "turnaround = completion − arrival, waiting = turnaround − burst." Drawing the Gantt chart first and reading times off it prevents arithmetic slips.
- When asked which policy minimizes average waiting time, say SJF and immediately name its two costs — starvation of long jobs and the need to know burst lengths — to show you understand the trade-off, not just the answer.
- If asked how real schedulers get SJF-like behavior without knowing bursts, describe the multi-level feedback queue: demote jobs that use full quanta, keep interactive jobs high, and age long-waiters back up to prevent starvation.

## keyTakeaways
- The scheduler picks which ready job runs next; judge a policy by average waiting time (time queued) and turnaround time (completion − arrival), and know which metric each algorithm optimizes.
- FCFS is simple but suffers the convoy effect; SJF minimizes average waiting time but can starve long jobs and needs burst estimates; Round Robin bounds response time fairly at the cost of context-switch overhead; priority expresses importance but needs aging to avoid starvation.
- Real systems use a multi-level feedback queue to approximate SJF adaptively — demoting CPU-bound jobs, favoring interactive ones, and aging long-waiters — getting low waiting times and good responsiveness without knowing burst lengths in advance.

## code.python
```python
# FCFS and non-preemptive SJF: compute average waiting and turnaround times.
def schedule(jobs, policy="fcfs"):
    # jobs: list of (name, arrival, burst)
    jobs = sorted(jobs, key=lambda j: j[1])  # by arrival
    time, done, ready, results = 0, [], list(jobs), []
    pending = []
    while ready or pending:
        # admit everything that has arrived
        while ready and ready[0][1] <= time:
            pending.append(ready.pop(0))
        if not pending:
            time = ready[0][1]   # CPU idle until next arrival
            continue
        if policy == "sjf":
            pending.sort(key=lambda j: j[2])     # shortest burst first
        name, arrival, burst = pending.pop(0)
        start = time
        time += burst                            # run to completion
        turnaround = time - arrival
        waiting = turnaround - burst
        results.append((name, waiting, turnaround))
    n = len(results)
    avg_wait = sum(w for _, w, _ in results) / n
    avg_turn = sum(t for _, _, t in results) / n
    return results, avg_wait, avg_turn

jobs = [("A", 0, 6), ("B", 0, 2), ("C", 0, 8), ("D", 0, 3)]
print(schedule(jobs, "fcfs")[1:])  # avg wait 7.5
print(schedule(jobs, "sjf")[1:])   # avg wait 4.5  (optimal)
```

## code.javascript
```javascript
// Round Robin with a fixed quantum; reports average waiting and turnaround time.
function roundRobin(jobs, quantum) {
  // jobs: [{name, burst}], all arrived at t=0
  const rem = jobs.map((j) => ({ ...j, left: j.burst, done: 0 }));
  const queue = [...rem];
  let time = 0;
  while (queue.length) {
    const j = queue.shift();
    const slice = Math.min(quantum, j.left);
    time += slice;            // run for one quantum (or less)
    j.left -= slice;
    if (j.left > 0) queue.push(j);      // preempt: rotate to the back
    else j.done = time;                  // finished this turn
  }
  const turn = rem.map((j) => j.done);   // arrival = 0 here
  const wait = rem.map((j, i) => turn[i] - j.burst);
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  return { avgWaiting: avg(wait), avgTurnaround: avg(turn) };
}

console.log(roundRobin([{ name: "A", burst: 6 }, { name: "B", burst: 2 },
                        { name: "C", burst: 8 }, { name: "D", burst: 3 }], 3));
```

## code.java
```java
// Non-preemptive SJF via a priority queue keyed on burst length.
import java.util.*;

public class SJF {
    record Job(String name, int burst) {}

    public static double avgWaiting(List<Job> jobs) {
        // all arrive at t=0; pick the shortest remaining burst each time
        PriorityQueue<Job> pq = new PriorityQueue<>(Comparator.comparingInt(Job::burst));
        pq.addAll(jobs);
        int time = 0, totalWait = 0;
        while (!pq.isEmpty()) {
            Job j = pq.poll();
            totalWait += time;   // it waited `time` before starting
            time += j.burst();   // then runs to completion
        }
        return (double) totalWait / jobs.size();
    }

    public static void main(String[] args) {
        var jobs = List.of(new Job("A", 6), new Job("B", 2),
                           new Job("C", 8), new Job("D", 3));
        System.out.println(avgWaiting(jobs)); // 4.5
    }
}
```

## code.cpp
```cpp
// FCFS: run jobs in arrival order, accumulate waiting and turnaround time.
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Job { string name; int arrival, burst; };

int main() {
    vector<Job> jobs = {{"A",0,6},{"B",0,2},{"C",0,8},{"D",0,3}};
    sort(jobs.begin(), jobs.end(),
         [](const Job& a, const Job& b){ return a.arrival < b.arrival; });
    int time = 0, totalWait = 0, totalTurn = 0;
    for (const auto& j : jobs) {
        if (time < j.arrival) time = j.arrival;   // idle until arrival
        int wait = time - j.arrival;
        time += j.burst;
        totalWait += wait;
        totalTurn += time - j.arrival;            // turnaround
    }
    cout << "avg wait " << (double)totalWait / jobs.size()      // 7.5
         << "  avg turnaround " << (double)totalTurn / jobs.size() << "\n";
}
```
