---
slug: arch-cache-mechanics
module: computer-architecture
title: How CPU Caches Really Work
subtitle: Why a small fast memory sitting between the processor and RAM decides your program's speed — cache lines, direct-mapped versus set-associative placement, hits and misses, LRU eviction, and the false-sharing trap that quietly wrecks multithreaded code.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Bryant & O'Hallaron — Computer Systems: A Programmer's Perspective, Ch. 6: The Memory Hierarchy"
    url: "http://csapp.cs.cmu.edu/"
    type: book
  - title: "Patterson & Hennessy — Computer Organization and Design, Ch. 5: Large and Fast (Exploiting Memory Hierarchy)"
    url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6"
    type: book
  - title: "Ulrich Drepper — What Every Programmer Should Know About Memory"
    url: "https://people.freebsd.org/~lstewart/articles/cpumemory.pdf"
    type: article
  - title: "Wikipedia — CPU cache"
    url: "https://en.wikipedia.org/wiki/CPU_cache"
    type: article
status: published
---

## intro
Main memory is enormous and slow; the processor is tiny and fast. A modern CPU can issue several instructions per nanosecond, but a trip to DRAM costs roughly a hundred nanoseconds — hundreds of wasted cycles if the core just waited. A **cache** is a small, very fast memory that sits between the two and keeps recently used data close by, so most accesses never reach main memory at all. It is invisible to your program — no API, no allocation call — yet it silently decides whether a loop runs in microseconds or milliseconds. Understanding how the cache places, finds, and evicts data is the difference between code that merely works and code that flies.

## whyItMatters
Two functions with identical big-O complexity can differ by 10x in wall-clock time purely because one is cache-friendly and the other is not. Row-major versus column-major traversal of a matrix, an array of structs versus a struct of arrays, a linked list versus a contiguous vector — every one of these choices is really a choice about how your access pattern lands in the cache. The cache is why sequential access crushes random access even when the instruction count is the same, why data locality is the first thing a performance engineer checks, and why a seemingly harmless shared counter can make a parallel program slower than the single-threaded version. If you have ever wondered why your algorithm is "slow for no reason," the cache is usually the answer, and reasoning about it is a standard systems-interview skill.

## intuition
Think of the cache as the small stretch of desk directly in front of you, and main memory as a library across campus. Fetching a book from the library takes ages; anything already on your desk is instant. You cannot fit the whole library on your desk, so you keep only what you have touched recently — and crucially, you never fetch a single page. When you walk to the library you bring back a whole book, betting that if you needed page 40 you will soon want pages 41 and 42 as well. That whole-book unit is the key idea: caches move data in fixed-size chunks called **cache lines**, typically 64 bytes, never one byte at a time.

This bet is called **locality**, and it comes in two flavors. **Temporal locality**: data you used recently you will likely use again soon (a loop counter, a hot variable). **Spatial locality**: data next to what you just touched you will likely touch next (the following array element, the next struct field). Because a cache line is 64 bytes, one miss that drags a line in from memory also pre-loads the neighboring bytes for free — so a loop striding sequentially through an array pays one miss per 64 bytes and then enjoys a run of cheap hits, while a loop hopping randomly across memory pays a full miss almost every time.

Now the hard part: where does a given memory address get stored in a cache that is thousands of times smaller than memory? The cache is carved into fixed-size slots, and the hardware must map each address to a slot fast — in a fraction of a cycle, with no search. It does this by chopping the address into three fields. The low bits are the **offset** (which byte inside the 64-byte line). The middle bits are the **index** (which set of the cache to look in). The high bits are the **tag** (which of the many memory blocks that could land in that set is actually present). To check for a hit, the cache jumps straight to the indexed set and compares the stored tag against the address's tag — a hit if they match and the line is valid, a miss otherwise. This split is the whole trick that makes lookup constant-time, and the visualization below walks an address stream through exactly this index-and-tag machinery.

## visualization
```
 One 64-byte line; address split into TAG | INDEX | OFFSET
 (example: 16 sets, 64B lines -> 6 offset bits, 4 index bits, rest tag)

   address 0x1A40  =   tag 0x1A   index 0x1   offset 0x00
                        |          |           |
                        v          v           v
   +----- cache (16 sets) --------------------------------+
   set 0 | V | tag .... | 64 bytes of data ............   |
   set 1 | V | tag=0x1A | <-- HIT if valid & tag matches   |
   set 2 | 0 | ........ | (invalid / empty)                |
   ...
   +------------------------------------------------------+

 direct-mapped : 1 line per set  -> two hot blocks that share an
                 index keep evicting each other (conflict miss)
 2-way assoc.  : 2 lines per set -> both blocks coexist; on a miss
                 evict the LEAST-RECENTLY-USED way (LRU)
```

## bruteForce
The naive placement policy is **direct-mapped**: each memory block has exactly one slot it is allowed to live in, chosen by its index bits. Lookup is trivially fast — go to the single indexed line, compare one tag, done — and the hardware is cheap. But it is brittle. If two frequently used addresses happen to share the same index (their addresses differ by an exact multiple of the cache's set count times the line size), they fight over that one slot: every access to one evicts the other, so both miss constantly even though the cache is mostly empty. These are **conflict misses**, and they can turn a cache with plenty of free space into one that thrashes. A common trap is striding through a large array by exactly the cache size, hitting the same few sets over and over while the rest of the cache sits idle.

## optimal
The fix is **set-associative** placement: give each set several lines (**ways**) instead of one. A 2-way cache lets two blocks with the same index coexist; an 8-way cache lets eight. On a lookup the hardware jumps to the indexed set and compares the tag against all ways in that set in parallel — still fast, just wider hardware. Now two hot blocks that collide in a direct-mapped cache simply occupy two different ways and both stay resident, eliminating most conflict misses. **Fully associative** (any block anywhere) removes conflict misses entirely but needs a tag comparator for every line, which is too expensive except for tiny structures like the TLB. Real L1/L2/L3 caches land in the sweet spot of 4-way to 16-way associativity.

Associativity forces a new decision: when a set is full and a new block must enter, which resident line gets evicted? The standard policy is **LRU** — evict the **least-recently-used** line, betting on temporal locality that the coldest line is the least likely to be needed again. True LRU is expensive to track for high associativity, so hardware approximates it (pseudo-LRU, tree-LRU), but the principle holds: keep the hot lines, discard the cold one. Misses themselves come in three flavors worth naming — **compulsory** (the first-ever access to a block, unavoidable), **capacity** (the working set is simply larger than the cache), and **conflict** (associativity too low, blocks colliding in a set). Set-associativity attacks conflict misses; a bigger cache attacks capacity misses; prefetching and better access patterns attack compulsory misses. A final subtle hazard lives at the line granularity: **false sharing**. If two threads on two cores each write to different variables that happen to sit in the *same* 64-byte cache line, the cache-coherence protocol treats every write as a conflict and ping-pongs the line between cores' caches — invalidating it back and forth — so the threads serialize even though they never touch the same data. The cure is to pad hot per-thread data so each lands on its own line.

## complexity
time: A cache hit costs a handful of cycles (L1 ~4, L2 ~12, L3 ~40); a miss to DRAM costs ~200+ cycles. Average access time = hit_time + miss_rate x miss_penalty, so shaving a few percent off the miss rate can dominate any constant-factor code tweak. Lookup itself is O(1): fixed index into a set, parallel tag compare across a fixed number of ways.
space: A cache stores far less than memory — L1 is tens of KB, L3 a few MB. Per line there is metadata overhead: a valid bit, the tag bits, and (for write-back caches) a dirty bit, plus LRU/replacement state per set. Higher associativity means more comparators and more replacement bookkeeping.
notes: Effective performance is governed by miss rate, not cache size alone — a well-ordered access pattern in a small cache beats a cache-hostile pattern in a large one. Line size (usually 64 bytes) sets the granularity of both prefetch benefit and false-sharing risk.

## pitfalls
- **Assuming random access is as cheap as sequential.** Both may be O(n) instruction-wise, but sequential access pays one miss per 64-byte line and then hits; random access can miss on nearly every element. Fix: traverse contiguous data in order (row-major for C arrays), and prefer arrays over pointer-chasing structures like linked lists for hot loops.
- **Ignoring false sharing in parallel code.** Two threads writing to adjacent fields in the same cache line cause coherence traffic that serializes them, sometimes making the parallel version slower than serial. Fix: pad or align per-thread hot data to separate 64-byte lines (`alignas(64)`), so independent writes never share a line.
- **Striding by exactly the cache-conflict distance.** Walking memory in steps that map to the same few sets (e.g. columns of a power-of-two-width matrix) thrashes a direct-mapped or low-associativity cache while most of it sits empty. Fix: block/tile the loop, pad row widths off a power of two, or reorder to access memory contiguously.
- **Confusing cache size with working-set fit.** A 32 KB L1 does not mean 32 KB of your data stays hot — associativity and access order decide what actually survives. Fix: shrink the working set of the inner loop (tiling, packing) so the bytes touched between reuses fit comfortably, and measure with cache-miss counters rather than guessing.

## interviewTips
- State the address split cold: an address divides into **tag | index | offset**; the offset picks the byte within a 64-byte line, the index selects the set, and the tag is compared against the ways in that set to decide hit or miss. This shows you understand *why* lookup is constant-time.
- Contrast the three miss types (compulsory, capacity, conflict) and match each to its cure: prefetch/access-pattern for compulsory, a bigger cache for capacity, more associativity for conflict. Then explain LRU as the eviction policy that exploits temporal locality.
- If asked why a parallel program does not speed up, raise **false sharing**: independent variables sharing one cache line force coherence ping-pong. Proposing 64-byte padding as the fix signals real systems depth beyond textbook definitions.

## keyTakeaways
- Caches move data in fixed 64-byte **lines** and exploit temporal and spatial **locality**; an address splits into tag, index, and offset so the hardware can find a line in constant time without searching.
- **Direct-mapped** caches are fast but suffer conflict misses when hot blocks share an index; **set-associative** caches give each set multiple ways and evict the **least-recently-used** line, eliminating most conflicts at modest hardware cost.
- Performance is ruled by miss rate, not raw cache size: sequential access, tiling, array-of-structs versus struct-of-arrays choices, and 64-byte padding against **false sharing** are the levers that turn cache behavior in your favor.

## code.c
```c
#include <stdlib.h>

// Cache-friendly vs cache-hostile traversal of the SAME data.
// row_major walks memory contiguously: one miss per 64-byte line,
// then a run of hits. col_major jumps by a whole row each step,
// touching a new line almost every access -> far more misses,
// identical instruction count, often 5-10x slower for big n.
long row_major(const int *m, int n) {     // m is n x n, row-major
    long s = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            s += m[i * n + j];             // stride 1: spatial locality
    return s;
}

long col_major(const int *m, int n) {
    long s = 0;
    for (int j = 0; j < n; j++)
        for (int i = 0; i < n; i++)
            s += m[i * n + j];             // stride n: new line each step
    return s;
}

// False sharing: two threads each bump their own counter, but if the
// counters share one 64-byte line the cores fight over it. Padding to a
// full line gives each thread a private line and restores parallelism.
struct Counter {
    long value;
    char pad[64 - sizeof(long)];           // push next counter to its own line
};
```

## code.asm
```asm
# x86-64: the software prefetch hint. A hot loop that will soon read
# ahead can ask the cache to start pulling a future line NOW, hiding the
# ~200-cycle DRAM miss behind useful work already in flight.
    prefetcht0  [rsi + 512]   # bring the line 512 bytes ahead into L1 early
    mov         eax, [rsi]    # this access is likely a HIT: line already warm
    add         rbx, rax
    add         rsi, 64       # advance one full cache line (64 bytes)

# clflush evicts one line from every cache level -- used to measure cold
# access cost or to force coherency; a normal program almost never needs it.
    clflush     [rsi]         # flush this 64-byte line back to memory
```
