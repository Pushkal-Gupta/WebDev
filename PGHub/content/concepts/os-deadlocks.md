---
slug: os-deadlocks
module: operating-systems
title: Deadlocks
subtitle: When threads wait on each other forever — the four Coffman conditions, the resource-allocation graph, and how systems prevent, avoid, or detect-and-recover.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [os-processes-threads]
relatedProblems: []
references:
  - title: "OSTEP — Common Concurrency Problems (Chapter 32, deadlock)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf"
    type: book
  - title: "Coffman, Elphick, Shoshani — System Deadlocks (ACM Computing Surveys, 1971)"
    url: "https://dl.acm.org/doi/10.1145/356586.356588"
    type: paper
  - title: "Wikipedia — Deadlock (computer science)"
    url: "https://en.wikipedia.org/wiki/Deadlock_(computer_science)"
    type: article
status: published
---

## intro
A **deadlock** is a state in which a set of threads (or processes) are each waiting for a resource that another thread in the set is holding, so none of them can ever make progress. Picture two threads, each clutching one lock and demanding the other's — both wait forever, and neither will yield. Deadlock is not a crash and not a slowdown; it is a permanent, silent stall. Understanding precisely *which four conditions must all hold* for it to occur, and how to break them, is the core of writing correct concurrent systems.

## whyItMatters
Concurrency bugs are the hardest bugs to find, and deadlock is the most notorious of them because it is **non-deterministic and silent**: the same code runs fine a thousand times and hangs on the thousand-and-first, depending on the exact interleaving and timing of threads. There is no exception, no log line — just a frozen server, a hung database transaction, or a UI that stops responding. Deadlocks scale in cost with the system: a deadlocked lock in a payment service can wedge a whole fleet. The four-condition framework matters because it turns a vague fear ("threads might hang") into a precise checklist — break *any one* condition and deadlock becomes impossible. That makes it both a practical engineering tool and a favorite interview topic: it tests whether you can reason about global system state, not just local code.

## intuition
Deadlock requires **all four** of the **Coffman conditions** to hold simultaneously — remove any single one and deadlock cannot occur. First, **mutual exclusion**: at least one resource is held in a non-shareable mode, so only one thread can use it at a time (a write lock, a printer, an exclusive file handle). Second, **hold and wait**: a thread holds at least one resource while waiting to acquire another — it does not release what it has before asking for more. Third, **no preemption**: a resource cannot be forcibly taken from the thread holding it; it is released only voluntarily. Fourth, **circular wait**: there exists a cycle of threads T₁ → T₂ → … → Tₙ → T₁ where each is waiting for a resource the next one holds. The first three set the stage; the circular wait is the closing of the trap.

The clearest way to *see* a potential deadlock is the **resource-allocation graph (RAG)**. Draw threads as one shape and resources as another. An **assignment edge** points from a resource to the thread holding it ("R is held by T"); a **request edge** points from a thread to a resource it wants ("T is waiting for R"). With single-instance resources, the rule is exact and beautiful: **a cycle in the graph means deadlock**. Thread A holds lock 1 and requests lock 2 while thread B holds lock 2 and requests lock 1 — the edges form a loop A → 2 → B → 1 → A, and that loop *is* the deadlock. (With multiple instances of a resource type, a cycle becomes a *necessary but not sufficient* condition — you must additionally check that no available instance can satisfy any waiter and break the cycle.)

This gives three families of response. **Prevention** structurally negates one condition so deadlock is impossible by construction — most often by killing circular wait via a **global lock ordering** (always acquire locks in the same total order, so no cycle can form). **Avoidance** stays permissive but refuses any allocation that would move the system into an *unsafe* state, using advance knowledge of maximum needs — the **Banker's algorithm** is the canonical example, granting a request only if a safe completion sequence still exists afterward. **Detection and recovery** lets deadlocks happen, periodically searches the RAG (or wait-for graph) for cycles, and recovers by aborting a victim or rolling back a transaction — the strategy databases use, where transactions are already restartable.

## visualization
```
THE FOUR COFFMAN CONDITIONS  (all four required; break one => no deadlock)
  1. mutual exclusion   resource held non-shareably (only one holder)
  2. hold and wait      hold one resource while requesting another
  3. no preemption      a held resource is never forcibly taken
  4. circular wait      a cycle of threads each waiting on the next

RESOURCE-ALLOCATION GRAPH  ( -> request,  ==> assignment/held )

   Thread A  ==holds==>  Lock 1
      ^                     |
      | requests Lock 1     | requested by A
   Lock 2  <==holds==  Thread B  <--requests-- A wants Lock 2

   cycle:  A -> Lock2 ==> B -> Lock1 ==> A      <-- CYCLE = DEADLOCK

FIX (break circular wait): impose a global order, acquire Lock1 BEFORE Lock2
   A: lock(1) lock(2)      B: lock(1) lock(2)     no cycle can form
```

## bruteForce
The simplest "policy" is the **ostrich approach**: ignore deadlock entirely, assume it is rare, and reboot or kill the process if the system ever hangs. Most general-purpose operating systems (including stock Linux for ordinary user locks) actually do this for application-level deadlocks, because prevention and avoidance impose real overhead and restrictions, while deadlocks in well-written code are infrequent. It is cheap and adds zero runtime cost — but it offers no guarantee whatsoever, debugging a hang is painful and non-reproducible, and in a long-running critical service "just reboot it" is not acceptable. As a baseline it highlights the trade everyone is making: pay overhead up front to *guarantee* freedom, or pay nothing and accept the occasional catastrophic stall.

## optimal
There is no universally optimal strategy — the right one depends on whether resources are preemptible, whether maximum needs are known in advance, and how costly a stall is. The most practical and widely used technique is **prevention by lock ordering**, which kills the circular-wait condition: define a global total order on all lockable resources and require every thread to acquire locks in increasing order. Since no thread can request a lower-ordered lock while holding a higher one, no cycle can form, and the guarantee is *static* — verifiable by inspection, with no runtime bookkeeping. Other prevention tactics target different conditions: acquire **all** needed resources atomically up front to defeat hold-and-wait (simple but hurts concurrency and can starve), make resources preemptible where it is safe (e.g. roll back and retry), or use lock-free structures to sidestep mutual exclusion entirely. When maximum demands are known and you want to stay permissive, **avoidance via the Banker's algorithm** grants a request only if the resulting state remains *safe* — meaning some ordering of completions exists that satisfies everyone — but it requires declaring maximum needs in advance and is rarely practical for general code. When restarting work is cheap, **detection and recovery** is the pragmatic winner: databases let transactions take locks freely, run periodic **cycle detection** on the wait-for graph, and abort the cheapest victim to break the cycle (the loser retries). The engineering takeaway is a decision tree, not a single answer: if you control lock acquisition, impose an ordering (cheapest, strongest); if work is restartable, detect-and-recover; if maximum needs are known and stalls are intolerable, avoid; and only fall back to the ostrich when deadlocks are genuinely rare and a restart is acceptable. In every case the lever is the same — **make sure at least one Coffman condition can never hold.**

## complexity
time: Cycle detection on a resource-allocation or wait-for graph is O(V + E) per scan via depth-first search, where V is threads-plus-resources and E is the edges. The Banker's safety check is O(m × n²) for m resource types and n threads. Lock ordering adds no runtime cost — the guarantee is structural.
space: O(V + E) to represent the allocation/wait-for graph; the Banker's algorithm stores allocation, maximum, and need matrices of size O(m × n).
notes: With single-instance resources a cycle is necessary and sufficient for deadlock; with multiple instances a cycle is only necessary, and you must additionally show no available unit can satisfy any waiter. Detection frequency trades CPU cost against how long a deadlock persists before recovery.

## pitfalls
- Thinking one condition causes deadlock. Deadlock needs all four Coffman conditions at once; a system can have mutual exclusion and hold-and-wait yet never deadlock if a global lock order makes circular wait impossible. Always check that the *cycle* can actually form.
- Confusing deadlock with livelock or starvation. In a deadlock everyone is blocked and nothing runs; in a livelock threads keep changing state (e.g. politely retrying) but make no progress; starvation is one thread perpetually denied while others proceed. The fixes differ.
- Acquiring locks in inconsistent orders across code paths. The classic two-lock deadlock comes from one path taking A then B and another taking B then A. A single global ordering — applied everywhere, including callbacks and error paths — is the cure.
- Assuming a graph cycle always means deadlock. That holds only for single-instance resources. With multiple instances of a resource type, a cycle is necessary but not sufficient; an available unit may still satisfy a waiter and dissolve the cycle.
- Holding a lock while calling into unknown code. Calling a callback, virtual method, or external library while holding a lock can re-enter and acquire locks in an order you did not anticipate, silently violating your ordering discipline. Release locks before such calls, or document the lock contract.

## interviewTips
- Recite the four Coffman conditions and immediately add the punchline: "deadlock needs all four; break any one and it cannot happen." Then say which technique breaks which condition — lock ordering kills circular wait, all-at-once acquisition kills hold-and-wait.
- Draw or describe the resource-allocation graph for the two-thread two-lock case and point at the cycle. Stating "a cycle means deadlock for single-instance resources" shows you know the precise condition, including the multiple-instance caveat.
- When asked how real systems cope, contrast the strategies by cost: lock ordering (free, static, your default), detection-and-recovery (databases, because transactions restart cheaply), avoidance/Banker's (needs max-demand knowledge, rarely practical), ostrich (when deadlocks are rare).

## keyTakeaways
- Deadlock requires all four Coffman conditions simultaneously — mutual exclusion, hold-and-wait, no preemption, and circular wait — so eliminating any single one makes deadlock impossible.
- The resource-allocation graph makes it visible: assignment edges (resource→holder) and request edges (thread→resource); for single-instance resources a cycle is exactly a deadlock, while for multiple instances a cycle is necessary but not sufficient.
- Strategies trade overhead for guarantees: prevention by global lock ordering is the cheap, structural default; detection-and-recovery suits restartable work like database transactions; Banker's-style avoidance needs known maximum demands; the ostrich approach accepts rare stalls for zero cost.

## code.python
```python
# Detect a deadlock by finding a cycle in the wait-for graph (DFS).
# wait_for[t] = set of threads t is (transitively) blocked waiting on.
def has_deadlock(wait_for):
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {t: WHITE for t in wait_for}

    def dfs(t):
        color[t] = GRAY                       # on the current DFS path
        for nxt in wait_for.get(t, ()):       # t waits on nxt
            if color.get(nxt, WHITE) == GRAY:  # back edge => cycle => deadlock
                return True
            if color.get(nxt, WHITE) == WHITE and dfs(nxt):
                return True
        color[t] = BLACK
        return False

    return any(color[t] == WHITE and dfs(t) for t in wait_for)

# A holds L1 wants L2; B holds L2 wants L1  ->  A waits-for B, B waits-for A
print(has_deadlock({"A": {"B"}, "B": {"A"}}))   # True  (cycle)
print(has_deadlock({"A": {"B"}, "B": set()}))   # False (no cycle)
```

## code.javascript
```javascript
// Prevent deadlock by acquiring locks in a fixed global order (kills circular wait).
function transfer(fromId, toId, accounts, locks, amount) {
  // Always lock the lower id first, regardless of transfer direction.
  const [first, second] = fromId < toId ? [fromId, toId] : [toId, fromId];
  locks[first].acquire();          // global ordering => no cycle can form
  locks[second].acquire();
  try {
    accounts[fromId] -= amount;
    accounts[toId] += amount;
  } finally {
    locks[second].release();
    locks[first].release();
  }
}
// Even if thread X does transfer(1,2) and thread Y does transfer(2,1),
// both lock id 1 before id 2 — the circular wait is structurally impossible.
```

## code.java
```java
// Cycle detection in a wait-for graph: a cycle means deadlock (single-instance).
import java.util.*;

public class DeadlockDetect {
    static boolean dfs(int u, Map<Integer, List<Integer>> g, int[] color) {
        color[u] = 1;                              // gray: on current path
        for (int v : g.getOrDefault(u, List.of())) {
            if (color[v] == 1) return true;        // back edge => cycle
            if (color[v] == 0 && dfs(v, g, color)) return true;
        }
        color[u] = 2;                              // black: done
        return false;
    }

    public static boolean hasDeadlock(Map<Integer, List<Integer>> waitFor, int n) {
        int[] color = new int[n];
        for (int u = 0; u < n; u++)
            if (color[u] == 0 && dfs(u, waitFor, color)) return true;
        return false;
    }

    public static void main(String[] args) {
        var g = Map.of(0, List.of(1), 1, List.of(0)); // A<->B circular wait
        System.out.println(hasDeadlock(g, 2));         // true
    }
}
```

## code.cpp
```cpp
// std::scoped_lock locks BOTH mutexes deadlock-free (it orders them internally).
#include <iostream>
#include <mutex>
#include <thread>

std::mutex m1, m2;
long a = 100, b = 100;

void transfer(std::mutex& from, std::mutex& to, long& src, long& dst, long amt) {
    std::scoped_lock lk(from, to);   // acquires both atomically; no circular wait
    src -= amt;
    dst += amt;
}

int main() {
    // Both threads can run transfer in opposite directions without deadlock.
    std::thread x(transfer, std::ref(m1), std::ref(m2), std::ref(a), std::ref(b), 10);
    std::thread y(transfer, std::ref(m2), std::ref(m1), std::ref(b), std::ref(a), 5);
    x.join(); y.join();
    std::cout << a << " " << b << "\n"; // 95 105
}
```
