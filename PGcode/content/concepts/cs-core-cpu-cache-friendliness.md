---
slug: cs-core-cpu-cache-friendliness
module: cs-tools-encodings
title: CPU Cache Friendliness
subtitle: Why your O(N) algorithm is 10× slower than mine — locality, prefetching, struct-of-arrays vs array-of-structs.
difficulty: Intermediate
position: 37
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "What every programmer should know about memory (Drepper)"
    url: "https://www.akkadia.org/drepper/cpumemory.pdf"
    type: book
  - title: "cpp-conf — Cache-friendly algorithms"
    url: "https://www.geeksforgeeks.org/cache-friendly-code/"
    type: blog
  - title: "torvalds/linux — cache utilities"
    url: "https://github.com/torvalds/linux"
    type: repo
status: published
---

## intro
Modern CPUs are 100-300× faster than main memory. The gap is bridged by **caches** (L1 ~1ns, L2 ~3ns, L3 ~10ns, RAM ~100ns). An algorithm with the same Big-O can run 10× slower if it thrashes cache. **Cache-friendly code** = sequential access, small working sets, contiguous data structures, predictable patterns the hardware prefetcher can exploit.

## whyItMatters
This is *why*:
- Linked lists are usually slower than vectors in practice despite identical Big-O for traversal.
- Linear search on a 1000-element sorted array often beats binary search.
- Matrix multiplication has a >10× spread between blocked and naive implementations.
- Hash tables with open addressing usually beat chaining.
- Struct-of-arrays beats array-of-structs for analytics workloads.

Asymptotic analysis ignores constant factors that the cache hierarchy determines. For hot paths, this is the difference between meeting and missing your SLO.

## intuition
Three principles:

1. **Spatial locality**: data accessed close together in memory should be accessed close together in time. CPU fetches a 64-byte **cache line** at once — using all of it amortizes the fetch.

2. **Temporal locality**: data accessed recently is likely to be accessed again — fits in cache for free if you reuse it before eviction.

3. **Prefetching**: hardware prefetchers detect linear stride patterns and load ahead of demand. Random access defeats them; sequential access leverages them.

## visualization
```
Array-of-structs (AoS):
  struct Particle { float x, y, z; float vx, vy, vz; int color; };  // 28 bytes
  Particle particles[1000];

  To update only velocities → still fetch x, y, z, color (waste).
  Cache lines used: 1000 * 28 / 64 = ~440 lines.

Struct-of-arrays (SoA):
  struct Particles {
      float x[1000], y[1000], z[1000];
      float vx[1000], vy[1000], vz[1000];
      int color[1000];
  };

  Update velocities → fetch only vx[], vy[], vz[].
  Cache lines used: 3 * 1000 * 4 / 64 = ~190 lines.

Linked list traversal:
  Each node at random heap address → cache miss per node → ~100ns each.
  Vector traversal: 64-byte line per 8-16 elements → ~10ns per element.
  10× speed difference at same Big-O.
```

## bruteForce
**Ignore cache and rely on Big-O**: fine for prototypes; not for hot paths.

**Always use linked structures for flexibility**: pointer chasing is the cache killer. Use arrays unless you have a specific need (frequent middle-insertion).

**Use AoS by default in OOP languages**: each "object" pulls full struct into cache even when you only need 1 field. Use SoA for hot loops.

## optimal
**Spatial locality wins**:
- Prefer contiguous arrays over linked lists / trees.
- For matrices, iterate in **row-major** order (matching memory layout in C/C++/Python; **column-major** in Fortran/MATLAB).
- For tree/graph search, consider **van Emde Boas** layouts or **cache-oblivious** algorithms for very large data.

**Temporal locality wins**:
- **Block** (tile) algorithms — matrix multiply tile B×B fits in L1; reuse before evicting.
- Sort small sub-arrays with insertion sort even after quicksort partitioning — they fit in cache.

**Reduce working-set size**:
- 32-bit ints instead of 64-bit when range fits.
- Bitsets instead of boolean arrays (8× density).
- Compact representations (delta encoding, varint).

**Help the prefetcher**:
- Linear access patterns; avoid stride > 64 bytes.
- For random access, use `__builtin_prefetch` hint (compiler intrinsic).

**Avoid false sharing**:
- Two threads writing to different fields on the same cache line → coherence traffic dominates. Pad shared structs to 64-byte boundaries.

## complexity
- **Big-O unchanged**: cache friendliness changes constants, not asymptotic class.
- **Wall-clock gap**: 2-10× for cache-friendly vs naïve in tight loops; up to 100× for matrix multiply with blocking.
- **Cache miss cost**: 100-300 cycles on modern CPUs. A "cheap" operation is the missed load, not the arithmetic.

## pitfalls
- **Optimising without measuring.** Cache effects are workload-dependent; "cache-friendly" code can be slower on the actual access pattern. Fix: profile with `perf`, VTune, or Instruments first, identify the hottest loops by L1/L2/LLC miss counters, and only then refactor.
- **Wholesale AoS-to-SoA refactor.** Restructuring every domain object to SoA explodes API surface and hurts code clarity for cold paths. Fix: keep the AoS public API and add a parallel SoA representation only for the hot inner loops, mirrored on write.
- **Padding everything to 64 bytes to "avoid false sharing".** Per-element padding can inflate working sets beyond the L2 cache, making the cure worse than the disease. Fix: pad only fields that are demonstrably contended (cross-core writes) — verify with cache-miss counters.
- **Ignoring NUMA topology.** On multi-socket servers, accessing remote memory adds ~100ns per miss. Fix: pin threads to cores with `taskset`/`numactl`, allocate with `numa_alloc_local`, and shard work by socket.
- **Premature blocking.** Tiling adds loop and bookkeeping overhead and only pays off when the natural working set exceeds the cache. Fix: only block when the data set is provably larger than the target cache level; benchmark blocked vs naive at realistic sizes.
- **Misaligned SIMD loads.** Unaligned 32-/64-byte loads either fault on strict hardware or take a slow path on lenient hardware. Fix: allocate with `aligned_alloc`/`posix_memalign` (C/C++) or `alignas(64)` on the struct and assert alignment in debug builds.

## interviewTips
- For perf-sensitive interview questions (Google, ad-tech, HFT), bring up cache friendliness — distinguishes you from rote Big-O.
- Cite **AoS vs SoA**, **row-major iteration**, **blocking** as concrete techniques.
- For senior interviews, discuss **cache-oblivious algorithms** (van Emde Boas, recursive blocking), **NUMA awareness**, **false sharing** in concurrent code.

## code.python
```python
# Python has limited cache control, but NumPy gives contiguous arrays + vectorized ops.
import numpy as np

# Bad: list of objects (Python objects are scattered on heap)
particles = [{'x': 0.0, 'y': 0.0, 'vx': 1.0} for _ in range(10000)]
for p in particles:
    p['x'] += p['vx']

# Good: SoA via NumPy (contiguous, vectorized)
x = np.zeros(10000); vx = np.ones(10000)
x += vx                  # one cache-friendly pass, vectorized
```

## code.javascript
```javascript
// JS objects are heap-scattered; TypedArrays are contiguous.

// Bad: array of objects
const particles = Array.from({length: 10000}, () => ({x: 0, vx: 1}));
for (const p of particles) p.x += p.vx;

// Good: parallel TypedArrays (SoA)
const x = new Float32Array(10000);
const vx = new Float32Array(10000); vx.fill(1);
for (let i = 0; i < x.length; i++) x[i] += vx[i];
```

## code.java
```java
// Array of primitive arrays (SoA)
float[] x = new float[10000];
float[] vx = new float[10000];
for (int i = 0; i < x.length; i++) x[i] += vx[i];

// Avoid: List<Particle> particles — Particle objects on heap, scattered.
```

## code.cpp
```cpp
// Matrix multiply: naive vs blocked
void matmul_naive(float* A, float* B, float* C, int N) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            for (int k = 0; k < N; k++)
                C[i*N + j] += A[i*N + k] * B[k*N + j];
}
void matmul_blocked(float* A, float* B, float* C, int N, int blk = 64) {
    for (int ii = 0; ii < N; ii += blk)
        for (int jj = 0; jj < N; jj += blk)
            for (int kk = 0; kk < N; kk += blk)
                for (int i = ii; i < min(ii+blk, N); i++)
                    for (int j = jj; j < min(jj+blk, N); j++)
                        for (int k = kk; k < min(kk+blk, N); k++)
                            C[i*N + j] += A[i*N + k] * B[k*N + j];
}
```
