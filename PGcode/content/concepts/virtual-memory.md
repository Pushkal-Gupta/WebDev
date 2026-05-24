---
slug: virtual-memory
module: cs-core
title: Virtual Memory
subtitle: Page tables, TLB, demand paging, and copy-on-write — how 4 GB of RAM serves processes that think they own 256 TB.
difficulty: Intermediate
position: 49
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Paging: Introduction"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf"
    type: book
  - title: "Virtual Memory in Operating System — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/virtual-memory-in-operating-system/"
    type: blog
  - title: "TheAlgorithms/Python — page replacement algorithms"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Virtual memory is the lie the kernel tells every process: "you have a private, contiguous, gigantic address space." Reality is a thin translation layer — page tables — mapping virtual page numbers to physical frame numbers (or to disk, or to nothing). The CPU walks this table on every memory access, accelerated by the TLB cache. Demand paging defers loading until first access; copy-on-write defers duplication until first write. Together they make `fork`, `mmap`, and modern process isolation possible.

## whyItMatters
Every modern OS, every container runtime, every database mmap-based storage engine builds on this. When `malloc` returns instantly for 4 GB on a 16 GB machine, that's virtual memory. When `fork` doesn't actually duplicate the heap, that's COW. When your container OOMs despite having "free" memory, you're hitting overcommit limits. Interviewers ask this because it underlies questions about performance (TLB misses, page faults), security (process isolation, ASLR), and design (memory-mapped IO, shared libraries).

## intuition
Imagine a library where each reader sees a private catalog numbered 1 to a billion — but the library only owns a few thousand actual books. The librarian (MMU) translates each request: catalog #42 → shelf B, slot 7. If shelf B is empty, the librarian fetches the book from the warehouse (disk) and updates the catalog. If two readers want the same book and only one reads it, they share; the moment one writes, the librarian makes a private copy. The reader never knows.

## visualization
Trace one load instruction: CPU issues `mov rax, [0x7fff1234]`. The MMU splits the address into VPN (virtual page number) and offset. It checks the TLB — cache hit, instant translation to physical frame 0x9000, fetch byte at offset, done in 1 cycle. Cache miss: the MMU walks the 4-level page table (PML4 → PDPT → PD → PT) — 4 memory loads. If the final PTE has present=0, the CPU raises a page fault; the kernel's handler either allocates a zero page, reads from swap, or maps a file-backed page from the page cache.

## bruteForce
A system without virtual memory (early DOS, embedded MCUs) uses physical addresses directly. Processes share one flat space, so one bad pointer corrupts the kernel. Loading a 4 GB binary requires 4 GB of contiguous physical RAM. Forking duplicates the entire heap eagerly. Multitasking is fragile — you must trust every program never to scribble outside its allocation. Workable for single-purpose embedded code; catastrophic for multi-user servers.

## optimal
Hardware-assisted paging plus on-demand mapping. The page table starts mostly empty; pages materialize on first access (demand paging). Shared libraries map the same physical frames into many processes (only one libc.so in RAM). Fork duplicates the page table with all writable pages marked read-only — the first write triggers a fault and the kernel clones only that one page (COW). Swap extends RAM with disk-backed pages. The TLB caches recent translations so the page-table walk is amortized to near-zero.

## complexity
time: TLB hit ~ 1 cycle; TLB miss + page-table walk ~ 100-300 cycles; page fault ~ 10K-1M cycles depending on disk
space: page table itself ~ 0.2% of mapped memory (one PTE per page); TLB ~ 64-2K entries per core
notes: Huge pages (2 MB, 1 GB) reduce TLB pressure for large working sets. Modern AMD/Intel CPUs pipeline page-table walks (page-walk caches) to mitigate the 4-load cost.

## pitfalls
- Confusing "virtual address space size" with "available memory" — `malloc` succeeding does not mean RAM exists; the OOM killer arrives at first-write time, not allocation time.
- Forgetting that `mmap` of a large file is essentially free until you touch pages — but page faults under load can stall your application unpredictably.
- Assuming `memcpy` is RAM-only — if either side is swapped out or file-backed, it triggers IO.
- Ignoring TLB shootdowns: changing a page table on one core forces an IPI to flush other cores' TLBs, which is brutal in NUMA systems.

## interviewTips
- Define VPN, PFN, PTE, TLB up front — interviewers want vocabulary precision.
- Always mention COW when fork comes up; mention demand paging when malloc comes up.
- Bring up huge pages if asked about database performance — Postgres, Redis, and JVM all benefit from them.
- If asked about security, mention ASLR (randomizing the virtual layout) and W^X (no page is both writable and executable).

## code.python
```python
import mmap, os

with open('big.bin', 'r+b') as f:
    mm = mmap.mmap(f.fileno(), 0)
    print(mm[0:16])
    mm.close()

pid = os.fork()
if pid == 0:
    print("child sees parent heap via COW until write")
    os._exit(0)
os.waitpid(pid, 0)
```

## code.javascript
```javascript
const fs = require('fs');
const v8 = require('v8');

const stats = v8.getHeapStatistics();
console.log('used:', stats.used_heap_size, 'total:', stats.total_heap_size);

const fd = fs.openSync('big.bin', 'r');
const buf = Buffer.alloc(4096);
fs.readSync(fd, buf, 0, 4096, 0);
fs.closeSync(fd);
```

## code.java
```java
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.*;

public class VMDemo {
    public static void main(String[] args) throws Exception {
        try (FileChannel ch = FileChannel.open(Paths.get("big.bin"), StandardOpenOption.READ)) {
            MappedByteBuffer mm = ch.map(FileChannel.MapMode.READ_ONLY, 0, ch.size());
            byte first = mm.get(0);
            System.out.println("page-fault-on-touch byte=" + first);
        }
    }
}
```

## code.cpp
```cpp
#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <cstdio>

int main() {
    int fd = open("big.bin", O_RDONLY);
    off_t sz = lseek(fd, 0, SEEK_END);
    void* p = mmap(nullptr, sz, PROT_READ, MAP_PRIVATE, fd, 0);
    printf("first byte=%d\n", ((char*)p)[0]);
    munmap(p, sz);
    close(fd);
}
```
