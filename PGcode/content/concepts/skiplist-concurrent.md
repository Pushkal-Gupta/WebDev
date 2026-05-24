---
slug: skiplist-concurrent
module: trees
title: Lock-free Concurrent Skip List
subtitle: Build a sorted set that scales to many writer threads — no global lock, no rotations, just CAS on forward pointers.
difficulty: Advanced
position: 11
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Balanced Search Trees"
    url: "https://algs4.cs.princeton.edu/33balanced/"
    type: book
  - title: "cp-algorithms — Trees and tree algorithms"
    url: "https://cp-algorithms.com/graph/all-submissions.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/binary_tree/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
A **concurrent skip list** is a sorted set that supports many simultaneous reader + writer threads without a global lock. It relies on compare-and-swap (CAS) on each level's forward pointer, plus a **marking** scheme for logical-then-physical deletion. Skip lists are the canonical concurrent sorted-set because — unlike balanced BSTs — they have no rotations, so coordination is much simpler.

## whyItMatters
Production:
- **Java's `ConcurrentSkipListMap` / `ConcurrentSkipListSet`** — JDK's go-to scalable sorted map.
- **Redis ZSET (sorted set)** — single-threaded, but the design lineage is the skip list.
- **LevelDB / RocksDB MemTable** — skip list keeps a thread-safe write buffer between background compactions.
- **In-memory time-series databases** — concurrent skip list as a write-optimized index.

Compared with a concurrent balanced BST, lock-free skip lists are dramatically simpler — partly because the data structure is randomized (no rebalancing) and partly because each level can be operated on independently.

## intuition
Each node's `forward[i]` is an atomic reference. Inserts CAS new pointers in. Deletes proceed in two phases:
1. **Mark** all forward pointers as "logically deleted" (set a tag bit).
2. **Unlink** marked nodes lazily — any thread that encounters a marked successor helps splice it out.

Search ignores marked nodes — they're functionally absent. Insert CAS-links the new node into level 0 first; promotion to higher levels happens optimistically and may race (a duplicate at level >0 is harmless — only level 0 determines membership).

## visualization
```
Initial:
  L1 ─►  [A]──►[C]──►[E]
  L0 ─►  [A]─►[B]─►[C]─►[D]─►[E]

Insert F (random level 1):
  Thread T1:
    Search: at L1, A→C→E→nil. Found insert point after E.
    CAS L0: E.forward[0] = F
    CAS L1: E.forward[1] = F
  Success.

Concurrent delete C (logical mark + physical unlink):
  Thread T2:
    Mark C.forward[*] as deleted (tag bit on next pointer).
    CAS B.forward[0]: C → C.next  (skipping C)
    CAS A.forward[1]: C → C.next at L1 (skipping C)
  T1 meanwhile: walks past C — sees the marked tag and helps unlink.
```

## bruteForce
- **Global mutex + plain skip list**: serializes all operations. Trivial but doesn't scale past 1-2 threads.
- **Per-node locks**: deadlock-prone unless using hand-over-hand locking. Workable but contention-heavy.

## optimal
The full lock-free skip list is involved. Key techniques:

1. **Tagged pointers** for marking: encode the mark bit in the low bit of the pointer (alignment guarantees it's free).
2. **Help-on-traverse**: when a thread sees a marked node, it CAS-unlinks it instead of waiting.
3. **CAS-loops**: each insert/delete retries on contention.
4. **Insert bottom-up**: install at level 0 first (that's what makes the element "live"); promote to higher levels best-effort.
5. **Delete top-down**: mark from top, unlink from top. A partial delete is fine — the next traverser finishes it.

```
def insert(val):
    while True:
        update = find_predecessors(val)  # snapshot path at every level
        if update[0].next[0].val == val: return False  # dup
        new_node = Node(val, random_level())
        for i in range(new_node.level + 1):
            new_node.next[i] = update[i].next[i]
        # CAS at level 0 first — that's what makes it 'live'
        if not CAS(update[0].next[0], new_node.next[0], new_node):
            continue  # retry
        # Now promote upward — best effort, retry per level
        for i in range(1, new_node.level + 1):
            while not CAS(update[i].next[i], new_node.next[i], new_node):
                update = find_predecessors(val)
                new_node.next[i] = update[i].next[i]
        return True
```

In Java: just use `ConcurrentSkipListMap`. Don't roll your own unless you must.

## complexity
- **Expected time per op**: O(log n) — same as sequential skip list.
- **Contention overhead**: CAS retries when threads collide; benign on modern CPUs.
- **Memory**: O(n) — slightly higher than sequential due to mark bits.
- **Progress**: lock-free (not wait-free) — under perpetual contention, some thread always progresses.

## pitfalls
- **ABA problem on pointers**: classic CAS pitfall. Mitigations: tagged pointers (use the low bit for a version), hazard pointers, or epoch-based reclamation.
- **Memory reclamation**: can't `free(deleted_node)` immediately — another thread might still be reading it. Use epoch-based reclamation, hazard pointers, or reference counting.
- **Random level distribution**: each node's level must be decided BEFORE insertion (not adjustable later). Pre-roll the level.
- **Marking bits vs alignment**: 8-byte aligned pointers have 3 free bits in the low position. Use just one for the mark.
- **Performance trap**: contention spikes when many threads insert at the same location. Use per-thread random offsets or sharded sub-lists for hot keys.

## interviewTips
- For "design a concurrent sorted set / range index" — concurrent skip list.
- Mention **tagged pointers + epoch reclamation** as the two hard parts.
- Compare with **lock-free B-trees** (more recent research — Bw-tree from Microsoft) and **read-write-locked balanced BSTs** (simpler but doesn't scale to writers).
- For senior interviews, discuss the **memory-reclamation problem** explicitly — that's the real source of bugs.

## code.python
```python
# Production-grade lock-free skip lists need atomics not in CPython.
# Use queue.PriorityQueue (lock-based) for small-scale concurrent sorted access,
# or move to Java / Rust / C++ for true lock-free.
```

## code.javascript
```javascript
// Node.js is single-threaded; concurrent skip lists are not applicable in JS.
// For worker-thread sharing, use SharedArrayBuffer + Atomics with a custom protocol.
```

## code.java
```java
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

class ConcurrentSetExample {
    public static void main(String[] args) throws Exception {
        ConcurrentSkipListMap<Integer, String> map = new ConcurrentSkipListMap<>();
        ExecutorService pool = Executors.newFixedThreadPool(8);
        for (int t = 0; t < 8; t++) {
            int tid = t;
            pool.submit(() -> {
                for (int i = 0; i < 1000; i++) {
                    map.put(tid * 1000 + i, "v" + i);
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);
        System.out.println(map.size());      // 8000
        System.out.println(map.firstKey() + " ... " + map.lastKey());
    }
}
```

## code.cpp
```cpp
// folly::ConcurrentSkipList (Facebook's library) — production-grade lock-free.
#include <folly/ConcurrentSkipList.h>
using SkipList = folly::ConcurrentSkipList<int>;
int main() {
    auto sl = SkipList::createInstance(10);
    auto accessor = sl->getAccessor();
    accessor.insert(5); accessor.insert(10); accessor.insert(3);
    for (auto x : accessor) std::cout << x << " ";
    return 0;
}
```
