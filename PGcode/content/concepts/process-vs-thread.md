---
slug: process-vs-thread
module: cs-core
title: Process vs Thread
subtitle: Processes have isolated memory; threads share it. Pick by what you need to share and protect.
difficulty: Beginner
position: 3
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Operating System Concepts (Silberschatz)"
    url: ""
status: published
---

## intro
A **process** is an OS-level abstraction with its own memory space, file descriptors, and accounting. A **thread** is a unit of execution that shares its parent process's memory with other threads. Both let you do "more than one thing at a time" — but how they share state and how isolated they are from each other's bugs is very different.

## whyItMatters
Threads communicate via shared memory (fast, lock-prone, easy to break). Processes communicate via IPC — pipes, sockets, shared memory segments — slower but bug-isolated. Crash one thread and you usually crash the whole process; crash one process and the others keep running. This shapes how you split a system: web server worker processes (isolated, restart-safe) vs. thread pools inside one process (fast, shared cache).

## intuition
Picture an office building. A **process** is a tenant company — its own offices, locked doors, separate phone line, separate finances. A **thread** is an employee inside one company — shares the office space, the coffee machine, the whiteboard. Employees can collide if they both grab the whiteboard at once (race condition); tenants of different companies can't accidentally interfere even if they're noisy. Want isolation? Spawn another company. Want shared state and tight coordination? Hire more employees.

## visualization
```
Process A                  Process B (isolated)
├── memory: 0x...          ├── memory: 0x... (separate address space)
├── files                  ├── files
├── thread 1 ┐             ├── thread 1
├── thread 2 ├ all share   ├── thread 2
└── thread 3 ┘ A's memory  └── thread 3
```

## bruteForce
"Just use one thread / one process" — fine until you need to scale across cores or absorb concurrent I/O. Single-threaded servers (early Node, Python before async) cap at one core's worth of work.

## optimal
Decision flow:

- **CPU-bound work** (image processing, ML inference, crypto): use **processes** (1 per core) to dodge GIL-style locks and get parallel CPU. Python's `multiprocessing`, Node's `cluster` / worker threads.
- **I/O-bound work** (web servers, DB calls): **async I/O** or **lightweight threads** — one thread can multiplex thousands of slow connections. Go goroutines, Java virtual threads, Node event loop, Python `asyncio`.
- **Both**: hybrid — a small fleet of worker processes (one per core), each running an event loop + worker thread pool.

For shared mutable state across threads, use **synchronization primitives**: mutex (one writer at a time), read-write lock (many readers, one writer), atomic types (lock-free single-word ops), condition variables (wait until predicate), semaphore (count-based gating).

For shared state across processes, prefer **message passing** (queue, RPC, gRPC) or **shared memory** with explicit synchronization (POSIX shm + named semaphore).

## complexity
- **Process spawn**: ~ms (heavy — fork + exec). Pool ahead of time.
- **Thread spawn**: ~μs. Lightweight; still pool for hot paths.
- **Context switch**: ~μs both, but process switches flush more (page tables, TLB).
- **Memory overhead**: process = full address space (MB); thread = ~stack only (KB-MB).

## pitfalls
- **Threading without synchronization**: race conditions and torn writes that look like "intermittent bugs."
- **Holding a lock during I/O**: serializes the whole pool. Drop the lock before the await/blocking call.
- **Deadlock**: two threads each hold a lock and wait for the other's. Always acquire locks in a consistent order.
- **Fork inside a multithreaded process** (Unix): only the calling thread survives. Easy to inherit a half-locked state.
- **`os.fork()` in Python with threads + GIL**: classic foot-gun. Use `multiprocessing.get_context("spawn")` instead of fork.

## interviewTips
- For "design a web server" — "thread per request" or "event loop + worker pool" answers, then explain why.
- Mention the **GIL** when discussing Python concurrency — it forces processes for CPU parallelism.
- Know the difference between **kernel threads** (OS-scheduled) and **green threads / coroutines / virtual threads** (runtime-scheduled).
- Compare with **async** in any modern language — the alternative to both.

## code.python
```python
# CPU-bound → multiprocessing (separate processes, true parallelism).
from multiprocessing import Pool

def heavy(n):
    s = 0
    for i in range(n): s += i*i
    return s

if __name__ == "__main__":
    with Pool(4) as p:
        print(p.map(heavy, [100_000, 200_000, 300_000, 400_000]))
```

## code.javascript
```javascript
// I/O-bound → single-threaded event loop scales fine.
const start = Date.now();
const tasks = [100, 50, 200, 75].map(ms =>
  new Promise(r => setTimeout(() => r(ms), ms)));
Promise.all(tasks).then(r => console.log(r, Date.now() - start, 'ms')); // ~200ms total
```

## code.java
```java
// CPU-bound thread pool — runs on real OS threads.
import java.util.concurrent.*;
ExecutorService pool = Executors.newFixedThreadPool(4);
for (int i = 0; i < 8; i++) {
    final int x = i;
    pool.submit(() -> { /* heavy work */ return x * x; });
}
pool.shutdown();
```

## code.cpp
```cpp
#include <thread>
#include <vector>
void work(int i) { /* heavy */ }
int main() {
    std::vector<std::thread> threads;
    for (int i = 0; i < 4; i++) threads.emplace_back(work, i);
    for (auto& t : threads) t.join();
}
```
