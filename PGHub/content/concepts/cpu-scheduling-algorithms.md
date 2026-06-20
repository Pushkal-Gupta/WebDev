---
slug: cpu-scheduling-algorithms
module: cs-os-concurrency
title: CPU Scheduling Algorithms
subtitle: FCFS, SJF, Round Robin, and MLFQ — the policies that decide who runs next, and how Linux CFS turns fairness into arithmetic.
difficulty: Intermediate
position: 54
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Scheduling: Introduction"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf"
    type: book
  - title: "OSTEP — Scheduling: The Multi-Level Feedback Queue"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf"
    type: book
  - title: "Linux kernel docs — CFS Scheduler design"
    url: "https://docs.kernel.org/scheduler/sched-design-CFS.html"
    type: docs
status: published
---

## intro
A CPU scheduler answers one question, millions of times per second: of all the processes ready to run, which one gets the core next? Every policy is a different trade between three metrics — turnaround time (submission to completion), waiting time (time spent ready but not running), and response time (submission to first run). FCFS optimizes nothing, SJF provably minimizes average turnaround, Round Robin minimizes response time, and MLFQ — the design real OSes descend from — learns each job's behavior and gets close to both without knowing run times in advance.

## whyItMatters
- Scheduling is a guaranteed OS interview topic, and the questions are concrete: "compute average waiting time for these processes under FCFS vs SJF vs RR" or "why does a long job behind your shell make typing laggy?" You answer with a Gantt chart and arithmetic, not hand-waving.
- The convoy effect — one CPU-bound job starving short interactive jobs — is the same pathology as head-of-line blocking in networking and a slow query hogging a database connection pool. One mental model, many systems.
- Every modern runtime schedules something: Go's goroutine scheduler, Kubernetes pod scheduling, thread pools with priority queues. The vocabulary (preemption, time slice, starvation, priority inversion) transfers directly.
- Linux CFS is a beautiful case study in turning a fuzzy goal ("be fair") into one number per task (vruntime) and one rule (run the smallest) — the kind of design reduction interviewers love to hear you articulate.

## intuition
Start with the supermarket checkout. FCFS (first-come, first-served) is the single queue with no exceptions: whoever arrived first checks out fully, even with three hundred items, while the person behind holds a single banana. That banana-holder's experience is the **convoy effect** — short jobs trapped behind a long one, dragging average waiting time through the floor. The fix everyone intuits is "let the banana go first," and that is exactly **SJF** (shortest job first): always run the job with the least work remaining. SJF is provably optimal for average turnaround — swapping any longer job ahead of a shorter one can only increase the sum of completion times — but it has two fatal flaws: you rarely know job lengths in advance, and a steady stream of short jobs starves a long one forever.

Add **preemption** and the picture changes. SRTF (shortest remaining time first) re-evaluates on every arrival, interrupting the current job if a newcomer is shorter. **Round Robin** takes preemption to its egalitarian extreme: every job gets a fixed quantum (say 10 ms), then goes to the back of the line. Nobody waits long for a *first* turn — response time is excellent — but everyone's *completion* stretches out, because RR deliberately slices long jobs into many delayed pieces. RR is the worst policy for turnaround precisely because it is the best one for responsiveness.

**MLFQ** (multi-level feedback queue) refuses to choose. Maintain several queues by priority; new jobs start at the top; any job that burns its full quantum drops a level. Interactive jobs that sleep on I/O keep waking near the top and feel instant; CPU hogs sink to the bottom and batch along on long quanta. The scheduler *learns* job behavior from history instead of demanding it up front — SJF's benefit without SJF's crystal ball. Periodic priority boosts pull everyone back to the top so sunk jobs cannot starve.

Linux's **CFS** reframes fairness as a race: each task accumulates **vruntime** — virtual runtime, actual CPU time scaled by the task's weight (its nice value) — and the scheduler always runs the task with the *smallest* vruntime, stored in a red-black tree for O(log n) selection. A task that has run least is, by definition, the most underserved, so it goes next. Sleeping tasks wake with low vruntime and run promptly; heavy tasks accumulate vruntime fast and yield often. Fairness becomes arithmetic.

## visualization
Three processes, all arriving at t=0: P1 needs 24 ms, P2 needs 3 ms, P3 needs 3 ms.

```
FCFS (arrival order P1, P2, P3)            -- the convoy effect
|-------------P1-------------|--P2--|--P3--|
0                            24     27     30
turnaround: P1=24 P2=27 P3=30  avg=27.0
waiting:    P1=0  P2=24 P3=27  avg=17.0    <- short jobs pay for the long one

SJF (shortest first: P2, P3, P1)
|--P2--|--P3--|-------------P1-------------|
0      3      6                            30
turnaround: P2=3  P3=6  P1=30  avg=13.0
waiting:    P2=0  P3=3  P1=6   avg= 3.0    <- 17.0 -> 3.0 just by reordering

Round Robin, quantum = 4
|--P1--|-P2-|-P3-|----------P1-------------|
0      4   7   10                          30
turnaround: P1=30 P2=7  P3=10  avg=15.7
waiting:    P1=6  P2=4  P3=7   avg= 5.7
response:   P1=0  P2=4  P3=7   avg= 3.7    <- everyone runs within 7 ms

metric definitions (per process):
  turnaround = completion - arrival
  waiting    = turnaround - burst
  response   = first_run  - arrival
```

## bruteForce
The naive scheduler is FCFS with no preemption: append arrivals to a queue, run each to completion. It is trivially simple, starvation-free, and has minimal context-switch overhead — and it is exactly what produces the convoy effect above, where one 24 ms job inflates average waiting time from 3 to 17. Worse, with no preemption a job that spins forever owns the machine: early Mac OS and Windows 3.x worked this way, and one misbehaving program froze the whole desktop. Non-preemptive FCFS survives today only where it belongs — FIFO work queues whose jobs are uniformly short.

## optimal
There is no single optimal policy — there is an optimal policy *per metric*, and real schedulers blend them.

**For average turnaround: SJF/SRTF.** The proof is an exchange argument: in any schedule where a longer job runs immediately before a shorter one, swapping them decreases the shorter job's completion time by more than it increases the longer's, so the sorted-by-length order is optimal. SRTF extends this with preemption to handle arrivals. The catch is that burst lengths are unknown, so practical systems estimate them — classically with an exponentially weighted moving average of past bursts (`predicted = a * last_actual + (1-a) * previous_prediction`).

**For response time: Round Robin.** With n ready jobs and quantum q, no job waits more than (n-1)·q for its next slice. The quantum is the critical knob: too small and context-switch overhead (saving registers, trashing caches and TLB entries — the indirect cost dwarfs the direct one) eats the CPU; too large and RR degenerates into FCFS. Real values sit in the 1–100 ms range so the switch cost stays a small fraction of the slice.

**For both at once: MLFQ.** The rules: (1) higher priority runs first, round-robin within a level; (2) new jobs enter at the top; (3) once a job uses its total allotment at a level — counted *cumulatively*, so sleeping just before the quantum expires cannot game it — it drops a level; (4) every period S, boost all jobs to the top queue, which simultaneously cures starvation and adapts to jobs that change phase from CPU-bound to interactive. Lower levels get longer quanta, so sunk batch jobs run efficiently.

**Linux CFS** replaces fixed quanta with proportional shares. Each runnable task's vruntime advances at a rate inversely proportional to its weight; the red-black tree keeps tasks ordered by vruntime, and the leftmost node runs next. Over any window, CPU time divides in proportion to weights — a nice -5 task gets a larger share, but a nice 19 task still progresses. (Since kernel 6.6, EEVDF refines CFS with per-task deadlines, keeping the same virtual-time core.)

## complexity
time: FCFS/RR dispatch is O(1) per decision with a FIFO queue; SJF/SRTF is O(log n) with a min-heap keyed on remaining time; CFS pick-next is O(log n) via the red-black tree (leftmost lookup is cached to O(1)). Simulating a schedule of n processes over its full Gantt chart costs O(slices * log n).
space: O(n) for the ready structure in every policy; MLFQ adds O(levels) queue headers.
notes: The dominant real-world cost is not dispatch but the context switch itself — register save/restore is ~1 microsecond, while refilling caches and TLB after the switch can cost far more, which is why quantum size matters more than queue asymptotics.

## pitfalls
- Confusing waiting time with response time on RR: a process can get its first slice within milliseconds (great response) yet wait through dozens of rounds before finishing (poor waiting/turnaround). Compute all three metrics separately; interviewers check exactly this.
- Forgetting that SJF without preemption still convoys: if the long job arrives first on an idle CPU, it runs to completion no matter what arrives next. Only SRTF (the preemptive variant) interrupts it.
- Treating priority scheduling as starvation-safe: a steady stream of high-priority work blocks low-priority jobs indefinitely. Every production design needs aging or a periodic boost (MLFQ rule 4) — and pure priority also invites priority inversion, where a high-priority task blocks on a lock held by a starved low-priority one (the Mars Pathfinder bug; fixed with priority inheritance).
- Picking the RR quantum without accounting for context-switch cost: with a 1 ms quantum and ~0.1 ms effective switch cost (mostly cache/TLB refill) you burn ~10% of the machine on overhead; with a 500 ms quantum the desktop feels frozen.
- Mis-handling simultaneous events in simulations: when a process's quantum expires exactly as a new process arrives, the standard convention enqueues the arrival *before* the preempted process. Getting this backwards changes every downstream number.

## interviewTips
- Lead any scheduling question with the three metrics — turnaround, waiting, response — then name which policy optimizes which: SJF for turnaround, RR for response, MLFQ to approximate both without knowing job lengths. That framing earns the follow-up.
- Be ready to draw the Gantt chart by hand for FCFS/SJF/RR on 3–4 processes with arrivals, and apply the tie-break rule: on simultaneous quantum-expiry and arrival, the arrival enqueues first.
- For "how does Linux schedule?", give the one-sentence CFS answer: every task accumulates weighted virtual runtime, the red-black tree orders tasks by it, and the smallest vruntime runs next — fairness reduced to picking a tree minimum.

## code.python
```python
from collections import deque

def round_robin(procs, quantum):
    """procs: list of (name, arrival, burst). Returns gantt + per-process metrics."""
    procs = sorted(procs, key=lambda p: (p[1], p[0]))
    arrival = {n: a for n, a, _ in procs}
    burst = {n: b for n, _, b in procs}
    remaining = dict(burst)
    ready, gantt = deque(), []
    first_run, finish = {}, {}
    time, i, n = 0, 0, len(procs)

    while len(finish) < n:
        while i < n and procs[i][1] <= time:
            ready.append(procs[i][0]); i += 1
        if not ready:                      # CPU idle until next arrival
            time = procs[i][1]; continue
        name = ready.popleft()
        first_run.setdefault(name, time)
        run = min(quantum, remaining[name])
        gantt.append((name, time, time + run))
        time += run
        remaining[name] -= run
        # convention: arrivals during the slice enqueue BEFORE the preempted process
        while i < n and procs[i][1] <= time:
            ready.append(procs[i][0]); i += 1
        if remaining[name] > 0:
            ready.append(name)
        else:
            finish[name] = time

    rows = []
    for name in sorted(burst):
        tat = finish[name] - arrival[name]
        rows.append((name, tat, tat - burst[name], first_run[name] - arrival[name]))
    return gantt, rows

gantt, rows = round_robin([("P1", 0, 24), ("P2", 0, 3), ("P3", 0, 3)], quantum=4)
print(" ".join(f"{n}[{s}-{e}]" for n, s, e in gantt))
print("name turnaround waiting response")
for name, tat, wait, resp in rows:
    print(f"{name:4} {tat:10} {wait:7} {resp:8}")
# P1[0-4] P2[4-7] P3[7-10] P1[10-14] ... avg waiting 5.67, avg response 3.67
```

## code.javascript
```javascript
function roundRobin(procs, quantum) {
  // procs: [{ name, arrival, burst }]
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.name.localeCompare(b.name));
  const remaining = new Map(sorted.map(p => [p.name, p.burst]));
  const meta = new Map(sorted.map(p => [p.name, p]));
  const ready = [];
  const gantt = [];
  const firstRun = new Map(), finish = new Map();
  let time = 0, i = 0;

  while (finish.size < sorted.length) {
    while (i < sorted.length && sorted[i].arrival <= time) ready.push(sorted[i++].name);
    if (ready.length === 0) { time = sorted[i].arrival; continue; }
    const name = ready.shift();
    if (!firstRun.has(name)) firstRun.set(name, time);
    const run = Math.min(quantum, remaining.get(name));
    gantt.push({ name, start: time, end: time + run });
    time += run;
    remaining.set(name, remaining.get(name) - run);
    // arrivals during the slice enqueue before the preempted process
    while (i < sorted.length && sorted[i].arrival <= time) ready.push(sorted[i++].name);
    if (remaining.get(name) > 0) ready.push(name);
    else finish.set(name, time);
  }

  const rows = sorted.map(({ name, arrival, burst }) => {
    const turnaround = finish.get(name) - arrival;
    return { name, turnaround, waiting: turnaround - burst, response: firstRun.get(name) - arrival };
  });
  return { gantt, rows };
}

const { gantt, rows } = roundRobin(
  [{ name: "P1", arrival: 0, burst: 24 }, { name: "P2", arrival: 0, burst: 3 }, { name: "P3", arrival: 0, burst: 3 }],
  4
);
console.log(gantt.map(g => `${g.name}[${g.start}-${g.end}]`).join(" "));
console.table(rows);   // avg waiting 5.67, avg response 3.67
```

## code.java
```java
import java.util.*;

public class RoundRobinSim {
    record Proc(String name, int arrival, int burst) {}

    public static void main(String[] args) {
        List<Proc> procs = new ArrayList<>(List.of(
            new Proc("P1", 0, 24), new Proc("P2", 0, 3), new Proc("P3", 0, 3)));
        procs.sort(Comparator.comparingInt(Proc::arrival).thenComparing(Proc::name));
        int quantum = 4;

        Map<String, Integer> remaining = new HashMap<>(), firstRun = new HashMap<>(), finish = new HashMap<>();
        for (Proc p : procs) remaining.put(p.name(), p.burst());
        Deque<String> ready = new ArrayDeque<>();
        StringBuilder gantt = new StringBuilder();
        int time = 0, i = 0;

        while (finish.size() < procs.size()) {
            while (i < procs.size() && procs.get(i).arrival() <= time) ready.addLast(procs.get(i++).name());
            if (ready.isEmpty()) { time = procs.get(i).arrival(); continue; }
            String name = ready.pollFirst();
            firstRun.putIfAbsent(name, time);
            int run = Math.min(quantum, remaining.get(name));
            gantt.append(name).append('[').append(time).append('-').append(time + run).append("] ");
            time += run;
            remaining.merge(name, -run, Integer::sum);
            // arrivals during the slice enqueue before the preempted process
            while (i < procs.size() && procs.get(i).arrival() <= time) ready.addLast(procs.get(i++).name());
            if (remaining.get(name) > 0) ready.addLast(name);
            else finish.put(name, time);
        }

        System.out.println(gantt);
        System.out.println("name turnaround waiting response");
        for (Proc p : procs) {
            int tat = finish.get(p.name()) - p.arrival();
            System.out.printf("%-4s %10d %7d %8d%n",
                p.name(), tat, tat - p.burst(), firstRun.get(p.name()) - p.arrival());
        }
        // avg waiting 5.67, avg response 3.67
    }
}
```

## code.cpp
```cpp
#include <algorithm>
#include <deque>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Proc { std::string name; int arrival; int burst; };

int main() {
    std::vector<Proc> procs{{"P1", 0, 24}, {"P2", 0, 3}, {"P3", 0, 3}};
    std::sort(procs.begin(), procs.end(), [](const Proc& a, const Proc& b) {
        return a.arrival != b.arrival ? a.arrival < b.arrival : a.name < b.name;
    });
    const int quantum = 4;

    std::map<std::string, int> remaining, first_run, finish;
    for (const auto& p : procs) remaining[p.name] = p.burst;
    std::deque<std::string> ready;
    int time = 0;
    size_t i = 0;

    while (finish.size() < procs.size()) {
        while (i < procs.size() && procs[i].arrival <= time) ready.push_back(procs[i++].name);
        if (ready.empty()) { time = procs[i].arrival; continue; }
        std::string name = ready.front(); ready.pop_front();
        first_run.emplace(name, time);
        int run = std::min(quantum, remaining[name]);
        std::cout << name << '[' << time << '-' << time + run << "] ";
        time += run;
        remaining[name] -= run;
        // arrivals during the slice enqueue before the preempted process
        while (i < procs.size() && procs[i].arrival <= time) ready.push_back(procs[i++].name);
        if (remaining[name] > 0) ready.push_back(name);
        else finish[name] = time;
    }

    std::cout << "\nname turnaround waiting response\n";
    for (const auto& p : procs) {
        int tat = finish[p.name] - p.arrival;
        std::cout << p.name << "  " << tat << "  " << tat - p.burst << "  "
                  << first_run[p.name] - p.arrival << '\n';
    }
    // avg waiting 5.67, avg response 3.67
}
```
