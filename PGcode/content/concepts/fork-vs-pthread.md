---
slug: fork-vs-pthread
module: cs-os-concurrency
title: Fork vs Pthread
subtitle: Memory isolation, scheduling, and the choice between processes and threads on Unix.
difficulty: Intermediate
position: 48
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — The Abstraction: Processes"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf"
    type: book
  - title: "Difference Between Process and Thread — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/difference-between-process-and-thread/"
    type: blog
  - title: "TheAlgorithms/Python — multiprocessing examples"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
A process is the kernel's unit of isolation: its own virtual address space, file descriptor table, and signal handlers. A thread is the kernel's unit of scheduling inside a process — many threads share one address space. `fork()` creates a new process by duplicating the caller; `pthread_create()` spawns a new thread inside the same process. Pick the wrong one and you either pay for redundant copies or lose the isolation that prevents one bug from corrupting another worker.

## whyItMatters
- **Nginx forks one worker per CPU core** (master + worker model from the original Igor Sysoev paper); **Apache prefork MPM** does the same for isolation; **uWSGI** and **Gunicorn** ship both fork-based and thread-based workers.
- **Postgres forks per connection** (one backend process per client) — backend isolation simplifies its shared-buffer-pool memory model and contains any per-session crash.
- **Java JVM, .NET CLR, Go runtime, Node.js worker_threads** go the other way — one process, many threads — because shared heap is cheaper than IPC and the runtime's GC needs uniform memory access.
- **Linux's clone(2) syscall** is the unified primitive both `fork` and `pthread_create` build on; **POSIX threads (RFC: SUSv4, IEEE 1003.1)** standardize the threading API; **OSTEP Chapter 5-6** is the canonical academic reference.

## intuition
The fundamental trade-off is **isolation versus sharing**, with **blast radius and communication cost** as the two axes you optimize across. A process is the kernel's unit of isolation: its own virtual address space, its own page table, its own file descriptor table, its own signal handlers. A thread is the kernel's unit of scheduling **inside** a process — many threads share one address space, one heap, one set of open files. `fork()` creates a new process by duplicating the caller (copy-on-write, so duplication is lazy); `pthread_create()` spawns a new thread inside the caller's process.

The mental model: an office building. A process is a private suite — its own walls, its own filing cabinets, its own door key. A thread is a desk inside one of those suites — workers share the cabinets and the kitchen. Sharing is fast (just walk over) but if one worker spills coffee on the shared printout, everyone in the suite loses work. Private suites are safer but expensive — you need a whole new copy of every file when someone moves in.

This translates directly to engineering trade-offs. **Threads** share the heap, so passing a 1 GB array between two threads is a pointer copy — microseconds. Two processes must use shared memory (`mmap` with `MAP_SHARED`) or copy via pipes, sockets, or `msgsnd` — milliseconds. **Process isolation** means one thread's segfault kills the entire process and every other thread in it; one process's segfault is contained — the supervisor reaps it and starts a fresh worker. That is why Nginx uses one process per CPU core (a worker crash takes down only its own connections, not the entire server), and why Postgres forks per connection (one query's memory corruption cannot poison another session's data).

The cost calculus has shifted with modern kernels. **Copy-on-write** makes `fork()` cheap to initiate: the kernel does not copy memory pages until either parent or child writes to them; for read-only workloads the duplication is nearly free. **Thread creation** is even cheaper — no page-table copy, just a new stack and a Thread Control Block (TCB), typically 8 MB of virtual stack reservation plus a few KB of kernel structures. Context switching between threads in the same process skips the TLB flush (CR3 on x86 stays unchanged), making it 2-10x cheaper than process-to-process context switches; modern kernels tag TLB entries with ASIDs to narrow but not eliminate the gap.

The wrong choice has different failure modes: too many forked workers blow up page-table overhead and IPC cost; too many threads in one process expand the blast radius of every bug and force every shared library to be thread-safe (a constraint that breaks a surprising number of C libraries — `strtok`, `errno` in old libc, signal handlers).

## visualization
Trace `fork()`: parent process P has pages mapped at virtual addresses 0x400000–0x500000. After fork, child C has its own page table pointing at the *same physical frames* marked read-only. The first write triggers a copy-on-write fault and the kernel allocates a fresh frame for C alone. Now compare `pthread_create`: child thread T shares P's page table — there is only one set of frames, and T writes directly. No fault, no copy, just a new stack region allocated inside the same address space.

## bruteForce
The naïve approach for any "do work in parallel" task is to fork for every unit. Each fork triggers a full address-space duplication (deferred via COW, but still expensive in TLB shootdowns and page-table walks), then an exec or function call. For a server handling 10K connections, that's 10K full processes — gigabytes of page-table overhead, brutal context-switch cost, and inter-process communication via pipes or shared memory for every coordination point.

## optimal
The right discipline is **workload-driven selection between processes, threads, or hybrid; constrain the choice with a process supervisor for blast-radius, and an async-runtime for high concurrency**. The canonical decision tree:

```
Workload                                | Choice                      | Example
----------------------------------------+-----------------------------+--------------------
Untrusted input, plugins, sandboxing    | Process (with seccomp)      | Chrome renderer
Crash isolation between workers         | Process (fork per worker)   | Nginx, Apache prefork
Per-connection isolation, shared cache  | Hybrid (fork + mmap shmem)  | Postgres, Redis
Shared in-process state, parallel CPU   | Threads                     | JVM GC, image processing
High-fanout I/O concurrency             | Async loop + worker threads | Node.js, Tokio, Go
Embarrassingly parallel batch work      | Process pool                | Python multiprocessing
```

```c
// Process model: fork + supervisor pattern (Nginx-style worker per core).
#include <unistd.h>
#include <sys/wait.h>

void run_worker(int core) {
    pin_to_core(core);                   // CPU affinity via sched_setaffinity
    setup_seccomp_filter();              // limit syscalls for untrusted code
    while (1) accept_and_handle();
}

int main(int n_cores) {
    pid_t children[64];
    for (int i = 0; i < n_cores; i++) {
        pid_t pid = fork();
        if (pid == 0) { run_worker(i); _exit(0); }
        children[i] = pid;
    }
    // Supervisor: reap dead workers and respawn.
    for (;;) {
        int status; pid_t dead = wait(&status);
        for (int i = 0; i < n_cores; i++) if (children[i] == dead) {
            pid_t pid = fork();
            if (pid == 0) { run_worker(i); _exit(0); }
            children[i] = pid;
        }
    }
}
```

Why this is right: **process per CPU core with a supervisor** gives crash isolation (a worker segfault is contained to that core's connections) while preserving CPU parallelism. Combined with `mmap(MAP_SHARED)` for read-mostly state (Postgres's shared buffer pool, Redis's AOF write buffer, Nginx's nginx-cache file) you get the throughput of shared memory and the safety of process isolation. Linux's **CoW page sharing** plus `madvise(MADV_MERGEABLE)` (Kernel Same-page Merging) further reduce the cost.

**Thread model best practices**:
- **One thread per logical CPU** for compute-bound work; many more for I/O-bound (the OS scheduler keeps cores busy while threads block on I/O).
- **Thread pool with bounded queue** (Java's `ThreadPoolExecutor`, .NET's `ThreadPool`, Go's runtime scheduler with goroutines) — never `pthread_create` per request, the construction cost dominates.
- **Avoid shared mutable state where possible**; prefer message-passing (Go channels, Actor model) or immutable snapshots. Locks are the source of every concurrency bug.

**Modern alternatives that change the calculus**:
- **Goroutines / Java virtual threads (Project Loom, JEP 444)**: M:N scheduling where many lightweight tasks share a small pool of OS threads. Cost-per-task drops to ~2 KB stack and microsecond switch.
- **io_uring and epoll**: a single thread can manage 100K+ concurrent connections via async I/O, eliminating thread-per-connection overhead entirely.
- **WASM and gVisor**: process-level isolation without the kernel-process overhead; Cloudflare Workers and Google App Engine use these for per-tenant isolation at massive scale.

**Anti-patterns to avoid**:
- **`fork()` in a multithreaded program**: only the calling thread survives in the child, leaving mutexes locked by ghost threads (POSIX defines `pthread_atfork` handlers but they are fragile). Just do not do it; use `posix_spawn` instead.
- **Sharing non-thread-safe library globals** (`strtok`, `errno` in old libc, signal handlers) across threads — data races visible only under load.
- **Forgetting that `fork()` duplicates open file descriptors AND their seek offsets** — parent and child writing to the same fd will trample each other; use `O_APPEND` or close after fork.
- **Assuming `pthread_create` failure means OOM** — usually it means hitting `RLIMIT_NPROC` or `ulimit -u`.

**The interview answer in one sentence**: "Processes for isolation, threads for shared state; combine them when both matter (Nginx and Postgres)." Bring up CoW, blast radius, and the M:N scheduler shift (goroutines, Loom) for senior-level depth.

## complexity
time: fork ~ 100µs (COW page-table copy); pthread_create ~ 10µs (just stack alloc + TCB)
space: process ~ MB+ for page tables and kernel structures; thread ~ 8MB default stack + TCB
notes: Context switch between threads of the same process is cheaper than between processes — no TLB flush is required because the address space (CR3 on x86) does not change. Modern kernels tag TLB entries with ASIDs, narrowing but not eliminating the gap.

## pitfalls
- Calling `fork()` in a multithreaded program — only the calling thread survives in the child, leaving mutexes locked by ghost threads. Use `pthread_atfork` or just don't.
- Sharing a non-thread-safe library (most C library globals, `strtok`, `errno` in old libc) across threads — data races that show up only under load.
- Forgetting that `fork()` duplicates open file descriptors *and* their seek offsets — parent and child end up trampling each other if both write.
- Assuming `pthread_create` failure means out-of-memory — it often means you hit `RLIMIT_NPROC` or `ulimit -u`.

## interviewTips
- State the trade-off explicitly: "Processes for isolation, threads for shared state." That one sentence wins the question.
- Mention COW when fork comes up — interviewers want to know you understand the kernel doesn't actually duplicate memory eagerly.
- Bring up the canonical examples: Nginx (forked workers), Apache prefork vs worker MPM, Postgres (forked backends), JVM (threads only).
- If asked "why not just use threads everywhere?", answer with the blast-radius argument: one segfault in a thread kills the whole process; in a forked worker it kills only that worker.

## code.python
```python
import os, threading

def child_work():
    print(f"child pid={os.getpid()}")

pid = os.fork()
if pid == 0:
    child_work()
    os._exit(0)
else:
    os.waitpid(pid, 0)

def thread_work():
    print(f"thread tid={threading.get_ident()} pid={os.getpid()}")

t = threading.Thread(target=thread_work)
t.start()
t.join()
```

## code.javascript
```javascript
const { fork } = require('child_process');
const { Worker } = require('worker_threads');

const childProc = fork('./worker.js');
childProc.send({ task: 'isolated' });
childProc.on('message', (m) => console.log('proc reply:', m));

const workerThread = new Worker('./worker.js');
workerThread.postMessage({ task: 'shared' });
workerThread.on('message', (m) => console.log('thread reply:', m));
```

## code.java
```java
import java.lang.Thread;

public class ForkVsThread {
    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            System.out.println("thread id=" + Thread.currentThread().getId());
        });
        t.start();
        t.join();

        Process p = new ProcessBuilder("echo", "child process").inheritIO().start();
        p.waitFor();
    }
}
```

## code.cpp
```cpp
#include <unistd.h>
#include <pthread.h>
#include <iostream>

void* thread_work(void*) {
    std::cout << "thread tid=" << pthread_self() << "\n";
    return nullptr;
}

int main() {
    pid_t pid = fork();
    if (pid == 0) { std::cout << "child pid=" << getpid() << "\n"; _exit(0); }

    pthread_t t;
    pthread_create(&t, nullptr, thread_work, nullptr);
    pthread_join(t, nullptr);
    waitpid(pid, nullptr, 0);
}
```
