---
slug: cas-lock-free
module: cs-core
title: Compare-And-Swap (CAS)
subtitle: The atomic primitive every lock-free data structure is built on — read-modify-write that fails if anyone else moved first.
difficulty: Advanced
position: 14
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**Compare-and-swap (CAS)** is an atomic instruction: "if memory at address X currently holds value `expected`, replace it with `desired`; otherwise leave it alone. Return whether the swap happened." Hardware supports CAS as a single uninterruptible operation (`CMPXCHG` on x86, `LDREX/STREX` on ARM, `cmpxchg` LLVM IR). It's the foundation for every lock-free / wait-free data structure.

## whyItMatters
Without CAS (or LL/SC, its weaker cousin), you can't build concurrent data structures without locks. With CAS, you can build:
- **Lock-free queues, stacks, lists, hash maps** — used in Java's `j.u.c.*`, Go runtime, Rust's `crossbeam`.
- **Spinlocks** themselves: `while (!CAS(&lock, 0, 1)) spin;` — but better primitives exist (futexes).
- **Reference counts**: atomic increment/decrement without a lock.
- **Garbage collectors**: CAS-based marking, lock-free allocator free-lists.
- **Database MVCC**: timestamp + CAS for optimistic concurrency control.

## intuition
CAS is "optimistic concurrency": don't lock, just try; if someone got there first, retry. Pseudocode:
```
CAS(addr, expected, desired):
    if *addr == expected:
        *addr = desired
        return true
    return false
```
The atomicity is hardware-guaranteed — no two threads can both see the same `expected` and both succeed.

**The pattern**: read, compute, CAS-update. If CAS fails (someone else updated meanwhile), re-read and try again. Usually inside a loop:
```
while True:
    old = atomic_load(addr)
    new = f(old)
    if CAS(addr, old, new): break
```

## visualization
```
Two threads incrementing counter at addr=&x (initial value 5):

T1: load x → 5
T2: load x → 5
T1: f(5) → 6; CAS(x, 5, 6) → SUCCESS (x now 6)
T2: f(5) → 6; CAS(x, 5, 6) → FAILS (x is 6, not 5)
T2: re-load x → 6; f(6) → 7; CAS(x, 6, 7) → SUCCESS (x now 7)

Result: x = 7. No lock taken; both threads progressed.
```

## bruteForce
**Mutex-protected counter**: acquire lock, increment, release. Works but every contended op serializes. With many threads, lock contention kills throughput.

## optimal
**Lock-free counter** (classic CAS loop):
```
def increment_lock_free(addr):
    while True:
        old = atomic_load(addr)
        if compare_and_swap(addr, old, old + 1):
            return old + 1
```

**Lock-free stack** (Treiber stack):
```
class Stack:
    def push(self, val):
        node = Node(val)
        while True:
            top = atomic_load(self.head)
            node.next = top
            if compare_and_swap(self.head, top, node):
                return

    def pop(self):
        while True:
            top = atomic_load(self.head)
            if top is None: return None
            new_top = top.next
            if compare_and_swap(self.head, top, new_top):
                return top.val
```

**ABA problem**: a classic CAS pitfall — value goes from A to B back to A; CAS thinks nothing changed but the structure underneath might have. Fix: pair the pointer with a version counter (tagged pointers) or use hazard pointers / epoch-based reclamation.

## complexity
- **Per CAS attempt**: O(1).
- **Loop iterations**: bounded by contention. Under low contention, ~1 try. Under heavy contention, exponential backoff helps.
- **Wait-freedom**: CAS gives lock-freedom (system progresses), not wait-freedom (every thread progresses). Some thread may starve indefinitely.

## pitfalls
- **ABA problem**: pointer recycled — fix with tagged pointers (low bits = version) or epoch reclamation.
- **Live-lock under contention**: 100 threads all CAS-looping on the same word → constant retries. Use exponential backoff + jitter.
- **Memory ordering**: CAS in C++/Java specifies a memory ordering (relaxed / acquire / release / seq_cst). Pick the weakest that works — `seq_cst` is the default but expensive.
- **False sharing**: two threads CAS-ing different variables that share a cache line trash each other. Pad atomics to 64 bytes.
- **CAS on >64-bit data**: hardware CAS is usually 64-bit (or 128-bit with `CMPXCHG16B`). For bigger atomic updates, wrap with a hand-rolled seqlock or transactional memory.

## interviewTips
- For "design a thread-safe counter without locks" — CAS.
- For "lock-free stack / queue" — Treiber stack / Michael-Scott queue.
- Always mention **ABA + retry loops + backoff**.
- For senior: explain **memory ordering** + **hazard pointers** for memory reclamation in lock-free structures.

## code.python
```python
# CPython has the GIL — no true CAS at the Python level.
# Use multiprocessing.Value with a lock, or call into C extensions.
from multiprocessing import Value
counter = Value('i', 0)
def increment():
    with counter.get_lock():
        counter.value += 1
```

## code.javascript
```javascript
// Atomics.compareExchange on SharedArrayBuffer
const sab = new SharedArrayBuffer(4);
const view = new Int32Array(sab);
function inc() {
  while (true) {
    const old = Atomics.load(view, 0);
    const next = old + 1;
    if (Atomics.compareExchange(view, 0, old, next) === old) return next;
  }
}
```

## code.java
```java
import java.util.concurrent.atomic.AtomicInteger;
class LockFreeCounter {
    final AtomicInteger n = new AtomicInteger(0);
    public int inc() {
        while (true) {
            int old = n.get();
            if (n.compareAndSet(old, old + 1)) return old + 1;
        }
    }
}
```

## code.cpp
```cpp
#include <atomic>
std::atomic<int> n{0};
int inc() {
    int old = n.load();
    while (!n.compare_exchange_weak(old, old + 1)) {}
    return old + 1;
}
```
