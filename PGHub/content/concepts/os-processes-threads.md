---
slug: os-processes-threads
module: operating-systems
title: Processes and Threads
subtitle: What a running program actually is — its private address space, the cost of a context switch, and why threads share memory while processes do not.
difficulty: Beginner
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — The Abstraction: The Process (Chapter 4)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf"
    type: book
  - title: "OSTEP — Concurrency: An Introduction (Chapter 26)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf"
    type: book
  - title: "MIT 6.S081 — xv6: a simple, Unix-like teaching operating system (book)"
    url: "https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf"
    type: course
status: published
---

## intro
A **program** is a passive file of instructions on disk; a **process** is that program brought to life — instructions loaded into memory plus all the state needed to run them: a private address space, a program counter, a set of CPU registers, an open-file table, and a slice of the operating system's bookkeeping. A **thread** is a single flow of execution *inside* a process. One process can hold many threads, and they all share the same address space while each keeps its own stack and registers. Getting this distinction right is the foundation of everything concurrency.

## whyItMatters
Every piece of software you run is a process, and the operating system's central job is to create the convincing illusion that each one owns the whole machine while dozens share a handful of CPU cores. Understanding processes and threads tells you why opening a browser tab can crash without taking the whole browser down (separate processes, isolated address spaces), why two threads updating the same counter can corrupt it (shared memory, no isolation), and why spawning a thread is cheap while forking a process is expensive. It is also the difference between a server that scales to thousands of concurrent connections and one that falls over at a hundred. Interviewers probe it constantly because the answer reveals whether you understand isolation, scheduling, and the real cost of concurrency — not just the syntax for starting a thread.

## intuition
Think of a process as a self-contained workshop with its own walls. Inside are the workbench (the **address space** — code, the **heap** for dynamically allocated data, the **stack** for function calls, and global variables), the tools currently in hand (the **CPU registers**, including the **program counter** that points at the next instruction), and a clipboard of which files and sockets are open. Crucially, one workshop cannot reach into another's: a wild pointer in process A can corrupt A's own memory but is physically incapable of touching process B, because the hardware's memory-management unit maps each process's virtual addresses to a disjoint set of physical frames. That isolation is the whole point — it is what makes a crash *local*.

A **thread** is a second worker inside the *same* workshop. The two workers share the workbench — the same heap, the same globals, the same open files — so they can collaborate at memory speed with no copying. But each worker holds their own tools: a thread has its own stack and its own register set, including its own program counter, so the two can be executing different functions at the same instant. That shared bench is a gift and a curse: communication is free, but if both workers grab the same object without coordinating, you get a **race condition** — a corrupted value that depends on the exact interleaving of their steps. This is why threads need locks, mutexes, and atomics while separate processes mostly do not.

Switching the CPU from one thread (or process) to another is a **context switch**. The OS scheduler must *save* the outgoing thread's registers and program counter into its control block, then *restore* the incoming thread's saved state so it resumes exactly where it left off. A process switch costs more because the address space changes too: the page-table base register is reloaded and the **TLB** (the cache of virtual-to-physical translations) is largely flushed, so the new process starts with cold caches. A thread switch within one process keeps the address space, so it is markedly cheaper. Every switch is pure overhead — time the CPU spends shuffling state instead of doing your work — which is why scheduling tries to switch only when it pays off.

## visualization
```
PROCESS A (isolated address space)        PROCESS B (isolated address space)
+-----------------------------+           +-----------------------------+
|  code | heap | globals      |           |  code | heap | globals      |
|  ---------------------------|           |  ---------------------------|
|  Thread 1   Thread 2        |           |  Thread 1                   |
|  [stack]    [stack]         |           |  [stack]                    |
|  [regs/PC]  [regs/PC]       |           |  [regs/PC]                  |
+-----------------------------+           +-----------------------------+
     threads SHARE heap+globals                 cannot reach into A

CONTEXT SWITCH  (CPU runs only one thread at a time)
  T1 running ──save T1 regs+PC──▶ [kernel: pick next] ──restore T2 regs+PC──▶ T2 running
                  ^^^^^^ pure overhead: no user work happens here ^^^^^^
```

## bruteForce
The naive way to run many tasks "at once" is to give each one its own full process: `fork()` a new address space per task. It is simple and bullet-proof on isolation — a crash in one task cannot touch another — but it is heavy. Each process duplicates page tables and kernel structures, inter-process communication needs explicit pipes, sockets, or shared-memory segments, and creating thousands of them exhausts memory and slows the scheduler. For tasks that must share large amounts of state (a web server's connection pool, a game's world model), copying that state across process boundaries is wasteful and awkward. Process-per-task is the safe default but rarely the efficient one when the tasks are cooperative.

## optimal
The efficient design matches the isolation level to the workload. Use **separate processes** when tasks are mutually distrustful or must fail independently — browser tabs, sandboxed plugins, microservices — and accept the higher creation cost and explicit IPC in exchange for hard isolation. Use **threads** when tasks cooperate and need to share state cheaply: a thread is far lighter to spawn (it reuses the parent's address space, page tables, and file table), context-switching between threads of one process skips the costly address-space reload and avoids a full TLB flush, and communication is just shared memory. The price is that you now own correctness: shared mutable state must be guarded with mutexes, read-write locks, or lock-free atomics, or you will hit races, torn reads, and deadlocks. Modern systems blend both — a small pool of processes for fault isolation, each running a pool of threads sized near the core count for throughput, so you pay for isolation only where it buys something and pay for sharing where it pays off. The mental model to carry into design and interviews: **processes isolate, threads share; a context switch is overhead, and a process switch costs more than a thread switch because the address space and TLB go cold.**

## complexity
time: Creating a process is heavyweight — it duplicates page tables and kernel state, typically microseconds to milliseconds; creating a thread is markedly cheaper. A thread context switch is on the order of a microsecond; a process switch costs more due to the page-table reload and TLB flush that follow it.
space: Each process owns a full address space plus a kernel control block; each thread adds only its own stack (kilobytes to a megabyte) and a saved register set, sharing the rest with its process.
notes: Context-switch cost is dominated not by the register save/restore itself but by the cold caches and TLB misses afterward. More threads than cores means more switching overhead, not more parallelism.

## pitfalls
- Assuming threads run truly in parallel everywhere. On a single core, or under a global interpreter lock (CPython's GIL), threads interleave but only one runs Python bytecode at a time — you get concurrency, not CPU parallelism. Use processes for CPU-bound work in those runtimes.
- Forgetting that shared memory needs synchronization. Two threads doing `count += 1` race because the read-modify-write is not atomic; the fix is a lock or an atomic, not hoping the operation is "fast enough."
- Believing more threads always means more speed. Past the core count, extra threads add context-switch and lock-contention overhead and can make a program *slower*. Size pools to the hardware and the workload.
- Treating a context switch as free. Each switch flushes caches and (for processes) the TLB, so a design that switches thousands of times a second can spend most of its time on overhead rather than work.
- Sharing a stack-allocated variable across threads. A thread's stack is private and unwound when its function returns; passing a pointer to a local into another thread is a use-after-free waiting to happen — share heap or static data instead.

## interviewTips
- Lead with the one-line contrast: "A process is an isolated address space; threads are flows of execution that share one address space. Processes isolate, threads share." It frames every follow-up.
- When asked why a process switch is slower than a thread switch, name the concrete cause: the page-table base register reloads and the TLB is flushed, so translations and caches go cold — the register save/restore is the cheap part.
- If asked when to choose processes over threads, anchor on the failure model: "Separate processes when tasks must fail or be sandboxed independently; threads when they cooperate and need cheap shared state." Mention the GIL for CPU-bound Python.

## keyTakeaways
- A process is a running program with a private, hardware-isolated address space; a thread is one flow of execution inside a process, with its own stack and registers but shared heap, globals, and open files.
- A context switch saves the outgoing thread's registers and program counter and restores the incoming one's; it is pure overhead, and a process switch costs more than a thread switch because the address space reloads and the TLB flushes.
- Match isolation to the workload: processes for independent failure and sandboxing, threads for cheap cooperation — and whenever state is shared, guard it with locks or atomics to avoid races.

## code.python
```python
# Threads SHARE memory (a race if unguarded); processes do NOT.
import threading

counter = 0
lock = threading.Lock()

def bump(n):
    global counter
    for _ in range(n):
        with lock:          # remove this lock and the result becomes nondeterministic
            counter += 1    # read-modify-write is not atomic across threads

threads = [threading.Thread(target=bump, args=(100_000,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)              # 400000 with the lock; a smaller, varying number without it
```

## code.javascript
```javascript
// Node worker threads share nothing by default; SharedArrayBuffer opts into shared memory.
const { Worker, isMainThread, workerData, parentPort } = require('node:worker_threads');

if (isMainThread) {
  // Each worker is its own thread of execution with a private heap.
  const w = new Worker(__filename, { workerData: 21 });
  w.on('message', (doubled) => console.log('result:', doubled)); // 42
} else {
  parentPort.postMessage(workerData * 2); // runs concurrently on a separate thread
}
```

## code.java
```java
// Two threads contend on a shared counter; synchronized makes the bump atomic.
public class Counter {
    private static int counter = 0;
    private static final Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        Runnable bump = () -> {
            for (int i = 0; i < 100_000; i++) {
                synchronized (lock) { counter++; } // shared address space => must synchronize
            }
        };
        Thread t1 = new Thread(bump), t2 = new Thread(bump);
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println(counter); // 200000
    }
}
```

## code.cpp
```cpp
// std::thread shares the process address space; std::mutex guards the shared counter.
#include <iostream>
#include <thread>
#include <mutex>

int counter = 0;
std::mutex m;

void bump(int n) {
    for (int i = 0; i < n; ++i) {
        std::lock_guard<std::mutex> g(m); // without this, counter += 1 races
        ++counter;
    }
}

int main() {
    std::thread a(bump, 100000), b(bump, 100000);
    a.join(); b.join();
    std::cout << counter << "\n"; // 200000
}
```
