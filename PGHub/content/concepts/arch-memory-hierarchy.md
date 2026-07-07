---
slug: arch-memory-hierarchy
module: computer-architecture
title: The Memory Hierarchy — Fast, Small, and Slow, Big
subtitle: Why every machine stacks a tiny bank of registers over a slow, cheap disk, and how caches plus locality create the illusion of a memory that is both huge and instant.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Patterson & Hennessy — Computer Organization and Design, Ch.5: Large and Fast: Exploiting Memory Hierarchy"
    url: "https://www.elsevier.com/books/computer-organization-and-design-mips-edition/patterson/978-0-12-820109-1"
    type: book
  - title: "CS:APP — Chapter 6: The Memory Hierarchy"
    url: "http://csapp.cs.cmu.edu/"
    type: book
  - title: "Jeff Dean — Latency Numbers Every Programmer Should Know"
    url: "https://gist.github.com/jboner/2841832"
    type: article
  - title: "Ulrich Drepper — What Every Programmer Should Know About Memory"
    url: "https://www.akkadia.org/drepper/cpumemory.pdf"
    type: paper
status: published
---

## intro
Every computer pretends to have one big, fast memory. It does not. Underneath the illusion sits a stack of very different storage technologies, each a compromise between speed, capacity, and cost. A handful of registers answer in a fraction of a nanosecond; main memory answers a hundred times slower; a disk answers a hundred thousand times slower still. The memory hierarchy is the arrangement that lets these layers cooperate so that, most of the time, the processor sees the speed of the fast layer while paying mostly for the cheap one.

## whyItMatters
The gap between processor speed and memory speed is the single most important performance fact in modern computing. A CPU can execute several instructions per nanosecond, but a trip to main memory costs roughly a hundred nanoseconds, during which hundreds of instruction slots would otherwise sit idle. Nearly every performance technique you will meet, caches, prefetching, cache-oblivious algorithms, data-oriented design, exists to hide that gap. Two programs with identical instruction counts can differ tenfold in wall-clock time purely from how they touch memory. Understanding the hierarchy turns mysterious slowdowns into predictable, fixable behavior, and it is a staple of systems interviews.

## intuition
Picture how you work at a desk. The few sheets directly in front of you are what you can grab instantly, but there is only room for a few. Behind you is a small shelf holding this week's folders, a second or two away. Across the room is a filing cabinet with the whole project, a slow walk away. Off-site is a warehouse holding everything the company has ever produced, a request that takes a day. Each tier holds more than the one above it and is slower to reach. Nobody would put the whole warehouse on their desk, there is no room, and nobody would run the business out of the warehouse alone, it would be unbearably slow.

This is the fundamental tradeoff of storage technology: fast memory is small and expensive, slow memory is big and cheap, and no single technology gives you all three of fast, big, and cheap at once. Static RAM, the stuff of on-chip caches, is blisteringly fast but costs many transistors per bit, so you can only afford a little. Dynamic RAM is far denser and cheaper per bit but several times slower. Flash and spinning disks are cheaper still per bit and hold enormous amounts, but they are orders of magnitude slower again. The prices and speeds span a range so wide that stacking the technologies is the only sensible move.

The reason the stack actually works, rather than just averaging out to mediocre, is a property of real programs called locality. Temporal locality says that if you touch a piece of data now, you are likely to touch it again soon, think of a loop counter or a hot function. Spatial locality says that if you touch one address, you are likely to touch its neighbors soon, think of walking through an array element by element. Because programs behave this way, a small fast layer that holds recently and nearby used data will satisfy the overwhelming majority of accesses. The hierarchy exploits locality to serve most requests from the top, so the processor experiences something close to the speed of the fastest layer while paying, in dollars and chip area, mostly for the capacity of the cheapest, that is the illusion of a big, fast memory.

## visualization
```
level        typical size      approx latency        role
---------    --------------    -----------------      -------------------------
registers    ~1-4 KB           ~0 (in-pipeline)       operands the ALU acts on
L1 cache     ~32-64 KB         ~1 ns    (~4 cycles)   hottest lines, per-core
L2 cache     ~256 KB-1 MB      ~4 ns   (~12 cycles)   near-hot lines, per-core
L3 cache     ~8-32 MB          ~10-40 ns              shared last-level cache
main memory  ~8-64 GB (DRAM)   ~100 ns               working set of the program
SSD (flash)  ~256 GB-4 TB      ~100 us (100000 ns)   pages, files, swap
hard disk    ~1-16 TB          ~10 ms  (10000000 ns) cold storage, archives

           ^  faster, smaller, costlier per bit  (registers)
           |
           v  slower, bigger, cheaper per bit    (spinning disk)
```

## bruteForce
The naive fix is to build the whole address space out of the fastest technology: make all of memory static RAM running at cache speed and be done with layers. It fails on physics and economics. SRAM needs roughly six transistors per bit against one transistor and a capacitor for DRAM, so a gigabyte of SRAM would cost orders of magnitude more and occupy far more silicon than any chip can hold. Even if you could afford it, larger memories are inherently slower, longer wires and bigger decoders mean a huge SRAM would not keep its tiny-cache latency anyway. Flat, single-speed memory is a fantasy.

## optimal
The working answer is a multi-level hierarchy where each level is a cache for the level below it, and each exists because the level above it is too small and the level below it is too slow. Registers hold the operands an instruction is acting on right now, effectively free to access because they sit inside the pipeline. The L1 cache, split into instruction and data halves, answers in about a nanosecond, roughly four clock cycles, and catches the hottest handful of cache lines. L2 sits behind it at around four nanoseconds, L3 is a larger shared last-level cache at roughly ten to forty nanoseconds, and beyond that is DRAM main memory at about a hundred nanoseconds. Below memory, an SSD answers in around a hundred microseconds and a spinning disk in around ten milliseconds.

Look at the ratios, not just the numbers. From L1 to main memory is roughly a hundredfold slowdown; from memory to disk is another hundred thousandfold. In human terms, if an L1 hit were one second, a main-memory access would be a minute and a half, and a disk seek would be about four months. That spread is exactly why a miss that falls all the way through the levels is catastrophic, and why keeping data high in the stack is worth real effort.

Caches typically maintain inclusion, an outer level holds a superset of the inner levels, which simplifies coherence and lookup. Data moves between levels in fixed blocks, cache lines of about 64 bytes and memory pages of about 4 KB, so a single miss pulls in a whole neighborhood, precisely the mechanism that turns spatial locality into speed. What determines real performance is the hit rate at each level. Effective access time is a weighted average: roughly the hit time plus the miss rate times the miss penalty, applied level by level. Because the miss penalty of the bottom levels is enormous, even a 95 percent hit rate can be crushed by the 5 percent that miss, so the whole game is pushing hit rates toward one by respecting locality.

## complexity
time: Access latency grows by roughly an order of magnitude, sometimes more, at each step down the hierarchy: register to L1 to L2 to L3 to DRAM to SSD to disk spans from near zero to milliseconds, about seven orders of magnitude end to end.
space: Capacity grows in the opposite direction, from kilobytes of registers and L1 up through megabytes of L3, gigabytes of DRAM, and terabytes of flash and disk.
notes: There is no single access cost, effective access time is a hit-rate-weighted average, hit_time + miss_rate * miss_penalty per level, so real speed is dominated by locality and hit rates rather than by any one level's raw latency.

## pitfalls
- **Assuming RAM is fast.** Compared to a register or an L1 hit, a DRAM access is glacial, roughly a hundred cycles of stall. Treating main memory as instant leads to code that thrashes the cache and stalls constantly. Fix: budget for the ~100 ns DRAM latency and design to hit in cache, not to reach memory.
- **Random access destroying locality.** Chasing pointers around the heap, or hashing into a huge table, defeats both temporal and spatial locality and turns nearly every access into a cache miss. Fix: prefer contiguous, sequentially scanned structures (arrays, struct-of-arrays) so each fetched line serves many accesses.
- **Ignoring the ~100x L1-to-RAM gap.** Optimizing instruction count while ignoring memory-access patterns can leave a "clever" algorithm slower than a naive cache-friendly one. Fix: count cache misses, not just operations, and measure with a profiler or cache simulator.
- **Silent page faults to disk.** When the working set exceeds RAM, the OS swaps pages to SSD or disk, and a single faulting access can cost a hundred thousand times a memory access, stalling the program invisibly. Fix: keep the hot working set within physical RAM, watch for swap activity, and reduce footprint before adding compute.

## interviewTips
- Be able to recite the ladder and the order-of-magnitude latencies: register ~0, L1 ~1 ns, L2 ~4 ns, L3 ~10-40 ns, DRAM ~100 ns, SSD ~100 us, disk ~10 ms. Interviewers want the ratios, especially the ~100x jump from cache to DRAM.
- Explain temporal and spatial locality in one sentence each and tie them to why caches work and why cache lines are ~64 bytes; then give a concrete win, like row-major traversal beating column-major on a large matrix.
- Frame performance as effective access time = hit_time + miss_rate * miss_penalty, and note that because miss penalties are huge, the whole optimization target is raising hit rates via locality, not shaving instructions.

## keyTakeaways
- Storage technologies trade off along a hard axis, fast means small and expensive, big means slow and cheap, so no single memory is fast, large, and affordable at once.
- Stacking levels as caches, registers over L1 over L2 over L3 over DRAM over SSD over disk, plus temporal and spatial locality, lets most accesses hit near the top and creates the illusion of a big, fast memory.
- Real performance is governed by hit rates, effective access time is a hit-rate-weighted average, so writing cache-friendly, locality-respecting code matters more than raw instruction count.

## code.c
```c
/* Row-major vs column-major traversal of an N x N matrix.
 * C stores 2D arrays row-major: a[i][0], a[i][1], ... are contiguous.
 * Walking a row hits the same ~64-byte cache line repeatedly (spatial
 * locality) and each fetched line serves many accesses.
 * Walking a column strides by N floats between accesses, so almost every
 * access lands on a fresh line -> a cache miss -> a ~100 ns DRAM trip. */
#define N 4096

double sum_rowmajor(const float a[N][N]) {
    double s = 0.0;
    for (int i = 0; i < N; i++)        /* outer: rows            */
        for (int j = 0; j < N; j++)    /* inner: contiguous cols */
            s += a[i][j];              /* sequential -> cache-friendly */
    return s;
}

double sum_colmajor(const float a[N][N]) {
    double s = 0.0;
    for (int j = 0; j < N; j++)        /* outer: columns          */
        for (int i = 0; i < N; i++)    /* inner: strides by N     */
            s += a[i][j];              /* jumps rows -> cache-hostile */
    return s;
}
/* Same operations, same result. On large N the row-major version can run
 * several times faster purely from respecting spatial locality. */
```

## code.asm
```asm
; x86-64 sketch: load one element from an array, then add it.
; The single mov below is where the memory hierarchy shows up.
; rdi = base address of the array, rsi = index
        lea     rax, [rdi + rsi*4]   ; compute &a[i]  (a[] is 4-byte ints)
        mov     eax, [rax]           ; LOAD a[i]:
                                     ;   L1 hit  -> ~4 cycles   (~1 ns)
                                     ;   L2 hit  -> ~12 cycles  (~4 ns)
                                     ;   L3 hit  -> ~40 cycles  (~10-40 ns)
                                     ;   DRAM    -> ~300 cycles (~100 ns stall)
        add     eax, 1               ; cheap ALU op once the value has arrived
        ret                          ; the load, not the add, dominates timing
```
