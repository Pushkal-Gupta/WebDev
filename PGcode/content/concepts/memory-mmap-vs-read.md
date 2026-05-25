---
slug: memory-mmap-vs-read
module: cs-os-concurrency
title: mmap vs read — File I/O Tradeoffs
subtitle: Memory-mapped files vs traditional read syscalls — when to use which. Page faults, zero-copy, write semantics, the Sqlite & Redis debate.
difficulty: Intermediate
position: 36
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces — Memory-mapped files"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Linus Torvalds on why mmap is overrated"
    url: "https://lwn.net/Articles/789623/"
    type: blog
  - title: "torvalds/linux — mmap source"
    url: "https://github.com/torvalds/linux/tree/master/mm"
    type: repo
status: published
---

## intro
Two ways to read a file from disk: **read()** syscall copies bytes from kernel page cache into user buffer; **mmap()** maps file pages directly into the process's virtual address space — touching a page faults it in. Both end up with file bytes in RAM, but the cost models, write semantics, and failure modes differ dramatically.

## whyItMatters
This shows up everywhere:
- **SQLite** uses read() by default but offers mmap mode.
- **Redis** uses neither (in-memory) but its AOF/RDB layer uses read().
- **MongoDB** built its original storage engine on mmap; rebuilt on WiredTiger using read()+buffer cache for fine-grained control.
- **gRPC / Protobuf** parsing can avoid copies via mmap.

Picking wrong = 2-10× perf penalty + harder-to-debug crashes.

## intuition
**read(fd, buf, len)**:
1. Kernel reads disk pages into the **page cache**.
2. Kernel **copies** from page cache into your user-space `buf`.
3. You hold the data; modify your copy freely.

**mmap(NULL, len, PROT_READ, MAP_SHARED, fd, 0)**:
1. Kernel sets up page table entries pointing at the file.
2. No data read yet; access faults → kernel reads page from disk → maps it.
3. Subsequent reads = just pointer dereferences. No syscall.
4. Writes (if `PROT_WRITE` + `MAP_SHARED`) propagate to disk on writeback.

**Key tradeoff**: mmap avoids the second copy (zero-copy), but the cost moves from sync syscall to async page fault — harder to reason about.

## visualization
```
read() flow:
  user → syscall → kernel reads disk → copies to page cache
                                    → copies to user buf
                ←
  user holds an independent copy.

mmap() flow:
  user → syscall → kernel sets up VMA + page tables (no data yet)
  user accesses ptr[0] → page fault → kernel reads disk → maps page
  user accesses ptr[4096] → already mapped → fast direct access
  user accesses ptr[8192] → page fault → ... (sub-microsecond miss / 1ms+ if disk)

Latency profile:
  read():  predictable syscall cost (~1μs) + copy cost (proportional to size)
  mmap():  cheap syscall (~1μs) + unpredictable page faults during access
```

## bruteForce
**Always read() everything into memory**: works for small files; OOM for big files.

**Always mmap()**: leaks page-fault latency into random code paths; can hard-crash on a file truncated mid-read.

**Pick based on actual access pattern**: the real answer.

## optimal
**Use mmap() when**:
- File is large + you access only some of it (random access; sparse).
- Multiple processes share the same file → shared page cache via shared mapping.
- You need zero-copy parsing (Cap'n Proto, FlatBuffers).
- File doesn't change underneath you.

**Use read() when**:
- You stream sequentially → page cache prefetching beats mmap.
- File may change concurrently (mmap of changing file = SIGBUS land mine).
- You need predictable latency (no surprise page faults).
- Small file → syscall cost amortized over copy cost.
- You need to encrypt / decrypt at the boundary (read into private buffer first).

**Hybrid**: `readahead()` / `posix_fadvise()` to prime the page cache before random access; or `MADV_WILLNEED` on an mmap region to prefetch.

**Write semantics**:
- mmap + MAP_SHARED + write to mapped region → goes to page cache; writeback to disk eventually. `msync()` to force.
- read() / write() syscalls → also via page cache, but you control timing.

## complexity
- **read() cost**: 1 syscall + 1 memcpy per call. Per-byte cost: ~0.5 GB/s memcpy bandwidth ceiling.
- **mmap() cost**: 1 syscall to map. Then per-page: free if hot, ~10μs if cold cache + page table miss, ~1ms if disk.
- **TLB pressure** for mmap: large mappings = more TLB entries = TLB misses = slower. `MAP_HUGETLB` mitigates.

## pitfalls
- **mmap of a file that gets truncated**: accessing beyond new EOF → SIGBUS. No `errno` to check; just crash.
- **mmap of a file on NFS / FUSE**: page-fault-time disk error = SIGBUS (no clean errno). read() returns -1 cleanly.
- **Holding a huge mmap across fork()**: child inherits the mapping; can balloon address space.
- **Modifying mmap region but expecting consistency**: another process may see partial updates. Use msync + locking.
- **read() in tiny chunks** (e.g., 100 bytes): syscall overhead dominates. Buffer up.
- **Believing mmap is always faster**: Linus famously refuted this (LWN article). Sequential read() benefits from kernel readahead — often faster than mmap for streaming.

## interviewTips
- When asked "how do you read a 100GB file" → discuss mmap vs read with their access pattern in mind.
- Cite **page cache** as the underlying mechanism both share — mmap just eliminates the user-kernel copy.
- For senior interviews, discuss **io_uring** as the modern alternative, **DAX** for persistent memory, **MAP_HUGETLB** for TLB-friendly large mappings.

## code.python
```python
import mmap
# mmap read
with open('big.bin', 'rb') as f:
    mm = mmap.mmap(f.fileno(), 0, prot=mmap.PROT_READ)
    chunk = mm[1024:2048]   # page fault loads page; pointer-level access
    mm.close()

# read() equivalent
with open('big.bin', 'rb') as f:
    f.seek(1024)
    chunk = f.read(1024)    # explicit syscall + copy
```

## code.javascript
```javascript
// Node has no direct mmap — use fs.readSync for read syscall
const fs = require('fs');
const fd = fs.openSync('big.bin', 'r');
const buf = Buffer.alloc(1024);
fs.readSync(fd, buf, 0, 1024, 1024);   // offset 1024
fs.closeSync(fd);
// For mmap-like behavior, use the 'mmap-io' npm package or bindings to libuv.
```

## code.java
```java
// FileChannel.map for mmap
try (FileChannel ch = FileChannel.open(Path.of("big.bin"), StandardOpenOption.READ)) {
    MappedByteBuffer buf = ch.map(FileChannel.MapMode.READ_ONLY, 0, ch.size());
    byte b = buf.get(1024);   // page fault on cold page
}
// Plain read:
try (RandomAccessFile raf = new RandomAccessFile("big.bin", "r")) {
    raf.seek(1024);
    byte[] arr = new byte[1024];
    raf.read(arr);
}
```

## code.cpp
```cpp
// mmap example
#include <sys/mman.h>
#include <fcntl.h>
int fd = open("big.bin", O_RDONLY);
struct stat st; fstat(fd, &st);
void* p = mmap(nullptr, st.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
char c = ((char*)p)[1024];     // page fault on cold page
munmap(p, st.st_size);
close(fd);

// read() example
char buf[1024];
pread(fd, buf, sizeof(buf), 1024);    // explicit syscall + copy
```
