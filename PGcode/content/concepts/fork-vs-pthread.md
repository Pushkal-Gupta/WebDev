---
slug: fork-vs-pthread
module: cs-core
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
Web servers, databases, and language runtimes all make this call constantly. Nginx forks one worker per CPU core because crashes must be contained. Postgres forks per connection because backend isolation simplifies its memory model. Node.js, Java, and Go go the other way — one process, many threads — because shared heap is cheaper than copying. Understanding which axis (isolation vs sharing, communication cost vs blast radius) drives the decision is exactly the interview signal for systems roles.

## intuition
Picture an office building. A process is a private suite: its own walls, its own filing cabinets, its own door key. A thread is a desk inside one of those suites — workers share the cabinets and the kitchen. Sharing is fast (just walk over) but if one worker spills coffee on the shared printout, everyone loses work. Private suites are safer but expensive — you need a whole new copy of every file when someone moves in.

## visualization
Trace `fork()`: parent process P has pages mapped at virtual addresses 0x400000–0x500000. After fork, child C has its own page table pointing at the *same physical frames* marked read-only. The first write triggers a copy-on-write fault and the kernel allocates a fresh frame for C alone. Now compare `pthread_create`: child thread T shares P's page table — there is only one set of frames, and T writes directly. No fault, no copy, just a new stack region allocated inside the same address space.

## bruteForce
The naïve approach for any "do work in parallel" task is to fork for every unit. Each fork triggers a full address-space duplication (deferred via COW, but still expensive in TLB shootdowns and page-table walks), then an exec or function call. For a server handling 10K connections, that's 10K full processes — gigabytes of page-table overhead, brutal context-switch cost, and inter-process communication via pipes or shared memory for every coordination point.

## optimal
Match the model to the workload. For *isolation-critical* code (untrusted input, plugins, supervisor patterns), fork — the kernel guarantees one worker's segfault cannot touch another's heap. For *shared-state, high-throughput* work (parallel sort on one array, request-router with shared cache), use threads — communication is a pointer dereference, not a syscall. Hybrid models (Nginx: forked workers, each with internal event loop; Postgres: forked backends, shared buffer pool via mmap) get the best of both.

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
