-- Concept import chunk 2/4 (web-vitals-lcp-cls-inp, deadlock-coffman-conditions, mutex-semaphore-condvar).
DO $do$
DECLARE
  r record;
  lines text[];
  ln text;
  cl text;
  cur_name text;
  cur_lines text[];
  cleaned text;
  sections jsonb;
  codes jsonb;
  obj jsonb;
  arr jsonb;
  km text[];
  in_fence boolean;
  fence_done boolean;
  code_lines text[];
  lang text;
BEGIN
FOR r IN
SELECT * FROM (VALUES
(
  'web-vitals-lcp-cls-inp', 'cs-tools-encodings',
  $tt$Web Vitals — LCP, CLS, INP$tt$,
  $tt$The three numbers Google grades every page on — what each one actually measures, what moves it, and how to fix the worst offenders.$tt$,
  'Intermediate', 88, 10,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$web.dev — Largest Contentful Paint (LCP)$rf$, 'url', 'https://web.dev/articles/lcp', 'type', 'docs'),
      jsonb_build_object('title', $rf$web.dev — Cumulative Layout Shift (CLS)$rf$, 'url', 'https://web.dev/articles/cls', 'type', 'docs'),
      jsonb_build_object('title', $rf$web.dev — Interaction to Next Paint (INP)$rf$, 'url', 'https://web.dev/articles/inp', 'type', 'docs')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
Core Web Vitals are three user-centric metrics measured on real visitors: LCP (Largest Contentful Paint) — how fast the main content appears; CLS (Cumulative Layout Shift) — how much the page jumps around; INP (Interaction to Next Paint) — how quickly the page responds to taps, clicks, and keys. Google folds them into search ranking, and the thresholds are concrete: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms at the 75th percentile.

## whyItMatters
- **They're ranking signals.** Pages failing Core Web Vitals lose a search-ranking tiebreaker; e-commerce teams routinely tie vitals regressions to conversion drops in A/B data.
- **They're measured in the field, not the lab.** Chrome reports real-user values to the CrUX dataset; the score that counts is the 75th percentile of actual visitors on actual devices — a fast laptop in DevTools proves nothing.
- **INP replaced FID in March 2024** — a much harder metric. FID measured only first-input delay; INP measures the full input-to-paint latency of the *worst* interactions across the whole visit, exposing every long task.
- **Performance interviews now use vitals as the framing.** "LCP is 4 seconds — walk me through your debugging" is the modern version of "make this page faster."

## intuition
Each metric formalizes one user perception with one number.

**LCP** answers "when did the page look loaded?" The browser tracks the largest image or text block in the viewport as rendering progresses and timestamps the moment the final largest element painted. The chain behind that timestamp is mechanical: TTFB (server answers) → resource discovery (the hero image URL must appear early — in the initial HTML, not buried in a JS bundle or CSS background) → resource load → render. Most bad LCPs are discovery problems: the hero image is loaded by JavaScript that loads after a bundle that loads after the HTML, a four-hop chain where one hop was needed. `<img>` in the HTML plus `fetchpriority="high"` (or `<link rel="preload">`) collapses the chain.

**CLS** answers "did the page jump while I was reading?" Every unexpected layout shift scores impact-fraction x distance-fraction (how much of the viewport moved, times how far); shifts within 500ms of a user input are exempt. The score sums shifts within the worst 5-second window of the visit. Causes are always "content inserted above existing content without reserved space": images without dimensions, late-loading ads or banners, and web fonts swapping at a different metric size.

**INP** answers "does it respond when I touch it?" Every interaction is timed from input to the next paint — input delay (main thread busy) + handler execution + render. The reported INP is approximately the worst interaction of the visit (75th-percentile-ish: the highest, ignoring one outlier per 50 interactions). One 600ms hydration task that swallows a click sets your INP to 600ms; the fix is always the same — shorter tasks, yield to the loop, paint before heavy work.

## visualization
```
Metric  Question              Good     Needs work  Poor     Unit
------  --------------------  -------  ----------  -------  -----------
LCP     main content visible  <=2.5s   2.5-4.0s    >4.0s    seconds
CLS     visual stability      <=0.1    0.1-0.25    >0.25    unitless score
INP     responsiveness        <=200ms  200-500ms   >500ms   milliseconds
(measured at p75 of real users, mobile and desktop separately)

LCP chain:   TTFB -> discover hero URL -> fetch -> render
             fix: image in HTML + fetchpriority=high, cut chain hops

CLS score:   shift = impact_fraction x distance_fraction
             banner pushes 80% of viewport down by 10% -> 0.8 x 0.1 = 0.08
             fix: reserve space (width/height, aspect-ratio, min-height)

INP anatomy: input_delay + handler_time + render_time, worst interaction
             fix: tasks <50ms, yield before heavy work, paint feedback first
```

## bruteForce
The traditional approach: measure `load` event time in a lab, minify everything, and call it done. It fails on all three vitals. `load` can fire before the hero image paints (bad proxy for LCP) or minutes after the page was usable. Lab runs on a fast machine miss the p75 phone on 4G that defines your real score. And no single load-time number sees post-load problems at all — CLS from a late banner and INP from a heavy click handler both happen long after `load`.

## optimal
Treat each vital as its own pipeline with known fixes.

**LCP — shorten the chain.** Measure TTFB first; if it's over ~800ms, no frontend work matters yet (cache HTML at the CDN, stream early). Then make the LCP element discoverable from the initial HTML: a real `<img src>` with `fetchpriority="high"`, never a CSS background or a client-rendered image, never behind a lazy-load (`loading="lazy"` on the hero is the single most common self-inflicted LCP wound). Preconnect to the image CDN. Inline critical CSS so render isn't blocked on a stylesheet round trip.

**CLS — reserve every pixel before it arrives.** `width`/`height` attributes on every image (the browser computes the box from the ratio before the bytes arrive), `aspect-ratio` or `min-height` for embeds and ad slots, `font-display: optional` or metric-compatible fallback fonts (`size-adjust`) to stop font-swap reflow. Never insert UI above the user's current viewport position; if content must arrive late, animate with `transform` — compositor-driven movement doesn't count as a layout shift.

**INP — keep the main thread free at interaction time.** Break long tasks under ~50ms; yield with `scheduler.yield()`/`setTimeout` between chunks so input can preempt. In handlers, paint feedback first, compute after: update the visual state, then defer the expensive work to a macrotask (`requestAnimationFrame` then `setTimeout`) so the next paint isn't blocked. Cut hydration cost on content sites (server components, islands, less JS). Audit third-party scripts — a tag manager's 300ms task is your INP.

**Measure in the field**: the `web-vitals` library (or `PerformanceObserver` directly) reports real values with attribution — which element was LCP, which shift was largest, which interaction was slowest — and that attribution is what makes the fix obvious.

## complexity
time: O(1) per performance entry — PerformanceObserver is push-based, no polling
space: O(shifts in the active 5s window) for CLS session-window aggregation
notes: Measurement cost is effectively free — entries arrive asynchronously through `PerformanceObserver` callbacks. The lifecycle matters more than the cost: LCP finalizes at first interaction or page-hide, while CLS and INP accumulate for the whole visit and must be flushed on `visibilitychange`. CLS clusters shifts into windows of at most 5 seconds with a 1-second max gap, and the worst window is the reported score, so one bad burst dominates the entire visit.

## pitfalls
- **`loading="lazy"` on the LCP image** — lazy-loading delays discovery and fetch of the exact element being timed; reserve lazy-loading for below-the-fold images only.
- **Optimizing in DevTools on a fast machine and shipping** — the score is field p75; throttle to mid-tier mobile CPU and test on real devices, then verify in CrUX/RUM data.
- **Images without `width`/`height` attributes** — "CSS sets the size" only works after CSS loads; the attributes give the browser the aspect ratio at parse time, eliminating the shift entirely.
- **Reporting vitals on `unload`** — that event doesn't fire reliably on mobile; use `visibilitychange` plus `sendBeacon` or CLS and INP silently vanish from your RUM data.
- **Treating INP as load-time-only** — INP counts interactions across the entire visit; a heavy filter dropdown used five minutes in can be the worst interaction that defines the score.

## interviewTips
- Memorize the three thresholds (2.5s / 0.1 / 200ms at p75) and lead with them — citing exact numbers signals real production experience.
- For "LCP is slow, debug it," walk the chain in order: TTFB → discovery → fetch → render, and name the classic fix at each hop (CDN/cache, image in HTML + fetchpriority, preconnect, critical CSS).
- For INP, give the modern answer: long-task budget under 50ms, yield between chunks, paint feedback before computing — and mention INP replaced FID because FID only measured the first input's delay.

## code.python
```python
# Simulation: CLS session-window scoring and INP selection,
# mirroring how the browser aggregates raw entries.

def cls_score(shifts):
    # shifts: [(t_ms, value)]; windows: <=5s span, <=1s gap between shifts
    windows, cur, start, last = [], 0.0, None, None
    for t, v in shifts:
        if start is None or t - last > 1000 or t - start > 5000:
            if start is not None:
                windows.append(cur)
            cur, start = 0.0, t
        cur += v
        last = t
    windows.append(cur)
    return max(windows)          # worst window is the score

def inp(interactions):
    # approx: worst duration, skipping one outlier per 50 interactions
    s = sorted(interactions, reverse=True)
    return s[min(len(s) // 50, len(s) - 1)]

print(cls_score([(100, 0.05), (600, 0.04), (9000, 0.02)]))  # 0.09
print(inp([40, 80, 120, 600]))                              # 600
```

## code.javascript
```javascript
// Field measurement with attribution — the production pattern.
import { onLCP, onCLS, onINP } from "web-vitals/attribution";

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,                       // 'LCP' | 'CLS' | 'INP'
    value: metric.value,
    rating: metric.rating,                   // 'good' | 'needs-improvement' | 'poor'
    target: metric.attribution?.target,      // which element caused it
  });
  navigator.sendBeacon("/vitals", body);     // survives page-hide
}
onLCP(send); onCLS(send); onINP(send);

// INP fix pattern: paint feedback first, defer the heavy work.
button.addEventListener("click", () => {
  button.classList.add("is-busy");           // cheap visual state
  requestAnimationFrame(() => {              // let that paint...
    setTimeout(() => {                       // ...then run after the frame
      rebuildHugeFilteredList();
      button.classList.remove("is-busy");
    }, 0);
  });
});

// CLS fix pattern: reserve space before the image arrives.
// <img src="hero.jpg" width="1200" height="600" fetchpriority="high">
```

## code.java
```java
// Analogous pattern: p75 aggregation over a RUM stream —
// the same percentile logic CrUX applies to field vitals.
import java.util.*;

class VitalsAggregator {
    private final Map<String, List<Double>> samples = new HashMap<>();

    void record(String metric, double value) {
        samples.computeIfAbsent(metric, k -> new ArrayList<>()).add(value);
    }

    double p75(String metric) {
        List<Double> v = new ArrayList<>(samples.get(metric));
        Collections.sort(v);
        return v.get((int) Math.ceil(0.75 * v.size()) - 1);
    }

    public static void main(String[] args) {
        VitalsAggregator agg = new VitalsAggregator();
        for (double lcp : new double[]{1.8, 2.1, 2.4, 3.9}) agg.record("LCP", lcp);
        System.out.println(agg.p75("LCP") <= 2.5 ? "good" : "failing"); // 2.4 -> good
    }
}
```

## code.cpp
```cpp
// CLS session-window scoring in C++ — worst 5s window of shifts.
#include <bits/stdc++.h>
using namespace std;

double clsScore(vector<pair<int,double>>& shifts) {  // (t_ms, value)
    double best = 0, cur = 0;
    int start = -1, last = -1;
    for (auto& [t, v] : shifts) {
        if (start < 0 || t - last > 1000 || t - start > 5000) {
            best = max(best, cur);
            cur = 0; start = t;
        }
        cur += v;
        last = t;
    }
    return max(best, cur);
}

int main() {
    vector<pair<int,double>> shifts = {{100, 0.05}, {600, 0.04}, {9000, 0.02}};
    printf("%.2f\n", clsScore(shifts));   // 0.09 -> within the 0.1 budget
}
```
$bdy$
),
(
  'deadlock-coffman-conditions', 'cs-os-concurrency',
  $tt$Deadlock — Detection and Prevention$tt$,
  $tt$The four Coffman conditions, wait-for graph cycle detection, and the lock-ordering discipline that prevents it all.$tt$,
  'Intermediate', 53, 9,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$OSTEP — Common Concurrency Problems$rf$, 'url', 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf', 'type', 'book'),
      jsonb_build_object('title', $rf$Coffman, Elphick, Shoshani — System Deadlocks (1971)$rf$, 'url', 'https://dl.acm.org/doi/10.1145/356586.356588', 'type', 'paper'),
      jsonb_build_object('title', $rf$Deadlock in Operating Systems — GeeksforGeeks$rf$, 'url', 'https://www.geeksforgeeks.org/operating-systems/introduction-of-deadlock-in-operating-system/', 'type', 'blog')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
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
$bdy$
),
(
  'mutex-semaphore-condvar', 'cs-os-concurrency',
  $tt$Mutex vs Semaphore vs Condition Variable$tt$,
  $tt$The three core synchronization primitives — ownership, counting, and waiting-for-a-fact — and when each is the right tool.$tt$,
  'Intermediate', 52, 9,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$OSTEP — Locks$rf$, 'url', 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf', 'type', 'book'),
      jsonb_build_object('title', $rf$OSTEP — Condition Variables$rf$, 'url', 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-cv.pdf', 'type', 'book'),
      jsonb_build_object('title', $rf$OSTEP — Semaphores$rf$, 'url', 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', 'type', 'book')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
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
$bdy$
)
) AS t(slug, module_slug, title, subtitle, difficulty, pos, est, metadata, status, body_raw)
LOOP
  sections := '{}'::jsonb;
  codes := '{}'::jsonb;
  cur_name := NULL;
  cur_lines := ARRAY[]::text[];
  lines := string_to_array(r.body_raw || E'\n## __END__', E'\n');
  FOREACH ln IN ARRAY lines LOOP
    IF ln ~ '^##\s+[A-Za-z0-9_.]+\s*$' THEN
      IF cur_name IS NOT NULL THEN
        cleaned := regexp_replace(regexp_replace(array_to_string(cur_lines, E'\n'), '^\s+', ''), '\s+$', '');
        IF cur_name LIKE 'code.%' THEN
          lang := substring(cur_name from 6);
          code_lines := ARRAY[]::text[];
          in_fence := false;
          fence_done := false;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF NOT fence_done THEN
              IF NOT in_fence THEN
                IF cl LIKE '```%' THEN in_fence := true; END IF;
              ELSIF cl LIKE '```%' THEN
                fence_done := true;
              ELSE
                code_lines := array_append(code_lines, cl);
              END IF;
            END IF;
          END LOOP;
          IF in_fence THEN
            codes := codes || jsonb_build_object(lang, regexp_replace(array_to_string(code_lines, E'\n'), '\s+$', ''));
          ELSE
            codes := codes || jsonb_build_object(lang, cleaned);
          END IF;
        ELSIF cur_name = 'complexity' THEN
          obj := '{}'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            km := regexp_match(cl, '^([a-zA-Z]+):\s*(.*)$');
            IF km IS NOT NULL THEN
              obj := obj || jsonb_build_object(km[1], regexp_replace(km[2], '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object('complexity', obj);
        ELSIF cleaned LIKE '- %' THEN
          arr := '[]'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF cl LIKE '- %' THEN
              arr := arr || to_jsonb(regexp_replace(regexp_replace(substring(cl from 3), '^\s+', ''), '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object(cur_name, arr);
        ELSE
          sections := sections || jsonb_build_object(cur_name, cleaned);
        END IF;
      END IF;
      cur_name := regexp_replace(ln, '^##\s+([A-Za-z0-9_.]+)\s*$', '\1');
      cur_lines := ARRAY[]::text[];
    ELSIF cur_name IS NOT NULL THEN
      cur_lines := array_append(cur_lines, ln);
    END IF;
  END LOOP;
  sections := sections || jsonb_build_object('estimatedReadMinutes', r.est);
  INSERT INTO "PGcode_concepts" (slug, module_slug, title, subtitle, difficulty, "position", body, code, metadata, status)
  VALUES (r.slug, r.module_slug, r.title, r.subtitle, r.difficulty, r.pos, sections, codes, r.metadata, r.status)
  ON CONFLICT (slug) DO UPDATE SET
    module_slug = EXCLUDED.module_slug,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    difficulty = EXCLUDED.difficulty,
    "position" = EXCLUDED."position",
    body = EXCLUDED.body,
    code = EXCLUDED.code,
    metadata = EXCLUDED.metadata,
    status = EXCLUDED.status,
    updated_at = now();
END LOOP;
END
$do$;
