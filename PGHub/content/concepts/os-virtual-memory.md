---
slug: os-virtual-memory
module: operating-systems
title: Virtual Memory and Paging
subtitle: How every process gets its own private address space — page tables translate virtual to physical, the TLB caches the hot translations, and a page fault loads what is missing.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: [os-processes-threads]
relatedProblems: []
references:
  - title: "OSTEP — Paging: Introduction (Chapter 18)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf"
    type: book
  - title: "OSTEP — Paging: Faster Translations (TLBs) (Chapter 19)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf"
    type: book
  - title: "MIT 6.S081 — xv6 book: Page tables (Chapter 3)"
    url: "https://pdos.csail.mit.edu/6.828/2021/xv6/book-riscv-rev2.pdf"
    type: course
status: published
---

## intro
**Virtual memory** is the illusion that every process owns a large, private, contiguous block of memory starting at address zero — even though physical RAM is finite, shared by many processes, and laid out in scattered fragments. The hardware and operating system together maintain a mapping from each process's **virtual addresses** to real **physical addresses**, so the addresses a program uses are not the addresses the chips see. The unit of mapping is a fixed-size **page** (commonly 4 KB), and the data structure holding the mapping is the **page table**. This translation is the mechanism behind process isolation, demand loading, and the ability to run programs larger than RAM.

## whyItMatters
Virtual memory is one of the most consequential abstractions in computing. It is *why* a wild pointer in one process cannot corrupt another (their page tables map to disjoint physical frames), *why* a program can be written as if it owns the whole machine without knowing how much RAM exists or what else is running, and *why* you can launch an application larger than physical memory — unused pages simply live on disk until touched. It enables copy-on-write so `fork()` is cheap, memory-mapped files so I/O looks like array access, and shared libraries loaded once into many address spaces. Every segmentation fault you debug, every "out of memory" you chase, and every cache-locality optimization you make is governed by paging. Interviewers love it because a clean answer requires connecting hardware (the MMU and TLB) to OS policy (page tables and fault handling) — it reveals systems depth.

## intuition
Start with the core trick: a virtual address is split into two parts — a high **virtual page number (VPN)** and a low **offset** within the page. With 4 KB pages the bottom 12 bits are the offset (since 2^12 = 4096), and the rest is the page number. Translation only ever changes the page number; the offset is copied straight through, because a page maps to a frame of the same size and the position *within* the page is identical. So the whole job is: take the VPN, look up which **physical frame number (PFN)** it maps to, and glue that PFN to the unchanged offset to form the physical address. We write this as \(\text{physical} = \text{frame}(\text{VPN}) \times \text{pageSize} + \text{offset}\).

The lookup table is the **page table**, one per process, indexed by VPN. Each entry stores the frame number plus control bits: **valid** (is this page mapped at all?), **present** (is it in RAM right now, or paged out to disk?), protection bits (read/write/execute), a **dirty** bit (has it been modified since loaded?), and a **referenced/accessed** bit (used by replacement policy). A real page table would be enormous if flat — a 48-bit address space has billions of pages — so hardware uses **multi-level (hierarchical) page tables**: the VPN is itself sliced into several indices that walk a tree of tables, so only the parts of the address space you actually use consume table memory.

Walking a multi-level table on *every* memory access would be ruinous — several extra memory reads per load or store. The fix is the **TLB (Translation Lookaside Buffer)**, a small, fast, fully-associative cache inside the CPU holding recent VPN→PFN translations. A **TLB hit** resolves the address in a cycle; a **TLB miss** triggers a page-table walk (in hardware or by the OS) to find the mapping and install it in the TLB. Because programs exhibit locality — they touch the same pages repeatedly — hit rates are typically well above 99%, which is what makes paging practical. Finally, if the page-table entry says the page is **not present** (it has never been loaded, or was evicted to disk), the access raises a **page fault**: the CPU traps into the OS, which finds the page on disk, picks a victim frame to evict if RAM is full (using a replacement policy like LRU or clock), reads the page in, updates the page table, and restarts the faulting instruction. From the program's view nothing happened except a pause — the illusion holds.

## visualization
```
VIRTUAL ADDRESS  (split: page number | offset)
  +-------------------+-----------+
  |   VPN = 0x00012   | off 0x2A8 |     32-bit addr, 4KB pages (offset = low 12 bits)
  +-------------------+-----------+
            |               |
            v               | offset copied UNCHANGED
   [ TLB ]  hit? --no--> [ PAGE TABLE walk ]
       |                        |
       | yes (frame 0x07D)      | entry: valid=1 present=1 frame=0x07D
       v                        v
  +-------------------+-----------+
  |   PFN = 0x07D     | off 0x2A8 |   = PHYSICAL ADDRESS
  +-------------------+-----------+

PAGE FAULT path (present bit = 0):
  access -> trap to OS -> find page on disk -> evict a victim frame (LRU/clock)
         -> read page into frame -> set present=1, update table -> restart instruction
```

## bruteForce
The crudest way to give each process memory is to load its entire program into one contiguous physical region and hand it raw physical addresses — base-and-bound or simple segmentation. It works for tiny systems but breaks down fast. Physical memory fragments into unusable gaps between processes (**external fragmentation**); a process cannot be larger than free contiguous RAM; relocating or growing it means copying the whole region; and isolation is coarse — protection is per-segment, not per-page. There is no clean way to load only the parts of a program actually used, share a read-only library between processes, or overcommit memory backed by disk. Contiguous allocation trades simplicity for rigidity, which is exactly the rigidity paging was invented to remove.

## optimal
Paging solves the contiguity problem by chopping both virtual and physical memory into fixed-size pages and frames, so any virtual page can map to *any* free physical frame — no contiguous region is ever needed and external fragmentation disappears (you pay only a little **internal fragmentation** in the last partial page). The page table per process gives full **per-page protection and isolation**, supports **demand paging** (load a page only when first touched, so startup is fast and unused code never enters RAM), and enables **overcommit** (the sum of virtual sizes can exceed physical RAM because cold pages live on disk). To keep translation fast, the design is layered: **multi-level page tables** keep the table itself sparse and small, the **TLB** caches hot translations so the common path is a single-cycle hit, and a **page-fault handler** transparently brings in missing pages, evicting victims by an approximation of LRU (the **clock/second-chance** algorithm using the reference bit, since true LRU is too expensive to track per access). The whole stack is a careful split of labor: hardware does the fast, fixed part (TLB lookup, page-table walk, raising the fault), and the OS does the flexible, policy-laden part (which frame to evict, when to write a dirty page back, how to back virtual pages with files or swap). The mental model to keep: **the offset passes through untouched, the page number is translated via the table, the TLB makes that translation fast, and a page fault is just the OS quietly filling in a mapping that was not resident yet.**

## complexity
time: A TLB hit translates an address in roughly one cycle. A TLB miss costs a page-table walk — O(L) memory accesses for an L-level table (typically 3–4). A page fault is far more expensive, on the order of milliseconds, because it involves disk I/O and possibly evicting and writing back a victim page.
space: A flat page table is O(virtual address space / page size) per process, which is impractical for 64-bit spaces; multi-level tables make it O(pages actually used), allocating lower-level tables only for mapped regions.
notes: Effective access time ≈ hitRate × TLBhitTime + missRate × walkTime, so a 99%+ TLB hit rate is what keeps paging cheap. Larger pages (huge pages) raise TLB coverage at the cost of coarser allocation and more internal fragmentation.

## pitfalls
- Confusing the valid/present bits with the protection bits. A page can be *valid* (logically part of the address space) yet *not present* (currently on disk) — that is a normal page fault, not an error. Accessing an *invalid* page, or writing a read-only page, is the fault that becomes a segmentation fault.
- Assuming a TLB miss and a page fault are the same thing. A TLB miss just means the translation was not cached and triggers a (fast) page-table walk; the page is still in RAM. A page fault means the page itself is not resident and needs disk I/O — orders of magnitude slower.
- Forgetting the offset is not translated. Only the page number maps through the table; the offset is copied verbatim. Treating the whole virtual address as a single number to translate gives wrong physical addresses in problems.
- Ignoring TLB flushes on context switch. TLB entries belong to one address space; switching processes invalidates them (unless tagged with an address-space ID), so the new process starts with TLB misses — part of why a process switch costs more than a thread switch.
- Picking a bad replacement victim. Evicting a hot page causes it to fault straight back in (thrashing); true LRU is too costly, so real systems approximate it with the clock algorithm over the reference bit and write back only dirty pages.

## interviewTips
- Walk the translation explicitly: "split the virtual address into VPN and offset, look the VPN up in the page table (or TLB) to get the frame, concatenate frame and offset." Stating that the offset passes through unchanged signals you understand the mechanism.
- Distinguish TLB miss from page fault out loud — same trigger (a memory access), wildly different cost. It is the single most common confusion and clearing it up fast reads as fluency.
- When asked why paging beats contiguous allocation, name three wins: no external fragmentation, per-page protection/isolation, and demand paging plus overcommit. Then mention multi-level tables and the TLB as the performance fixes.

## keyTakeaways
- Virtual memory gives each process a private address space; the page table maps virtual page numbers to physical frame numbers while the page offset passes through untranslated, so physical = frame × pageSize + offset.
- The TLB caches recent translations to make the common path a single-cycle hit; a TLB miss triggers a (still in-RAM) page-table walk, whereas a page fault means the page is not resident and must be loaded from disk — vastly slower.
- Paging eliminates external fragmentation, provides per-page protection, and enables demand paging and overcommit; multi-level page tables keep the table sparse and the clock algorithm approximates LRU for choosing eviction victims.

## code.python
```python
# Simulate VPN/offset split + a tiny page table with a TLB and page-fault handling.
PAGE_BITS = 12          # 4 KB pages => offset is the low 12 bits
PAGE_SIZE = 1 << PAGE_BITS

page_table = {0x00012: {"frame": 0x07D, "present": True},
              0x00013: {"frame": None,  "present": False}}  # on disk
tlb = {}                # VPN -> frame cache
next_free_frame = 0x100

def translate(vaddr):
    global next_free_frame
    vpn, offset = vaddr >> PAGE_BITS, vaddr & (PAGE_SIZE - 1)
    if vpn in tlb:                                  # TLB hit
        return tlb[vpn] * PAGE_SIZE + offset, "tlb-hit"
    entry = page_table.get(vpn)
    if entry is None:
        raise MemoryError("segfault: invalid page")
    if not entry["present"]:                        # PAGE FAULT
        entry["frame"] = next_free_frame            # load from disk into a free frame
        next_free_frame += 1
        entry["present"] = True
    tlb[vpn] = entry["frame"]                        # cache the translation
    return entry["frame"] * PAGE_SIZE + offset, "page-fault"

print(hex(translate(0x000122A8)[0]))   # frame 0x07D + offset 0x2A8
print(translate(0x00013000))           # triggers a page fault, then maps it
```

## code.javascript
```javascript
// Address translation: VPN/offset split through a page table, with a TLB.
const PAGE_BITS = 12, PAGE_SIZE = 1 << PAGE_BITS;
const pageTable = new Map([[0x00012, { frame: 0x07d, present: true }]]);
const tlb = new Map();

function translate(vaddr) {
  const vpn = vaddr >>> PAGE_BITS;
  const offset = vaddr & (PAGE_SIZE - 1);
  if (tlb.has(vpn)) return { phys: tlb.get(vpn) * PAGE_SIZE + offset, how: "tlb-hit" };
  const e = pageTable.get(vpn);
  if (!e) throw new Error("segfault: invalid page");
  if (!e.present) throw new Error("page fault: not resident"); // OS would load it
  tlb.set(vpn, e.frame);                                       // install in TLB
  return { phys: e.frame * PAGE_SIZE + offset, how: "walk" };
}

console.log(translate(0x000122a8).phys.toString(16)); // 7d2a8
```

## code.java
```java
// Virtual-to-physical translation with a page table; offset is copied through.
import java.util.*;

public class Paging {
    static final int PAGE_BITS = 12, PAGE_SIZE = 1 << PAGE_BITS;
    record Entry(int frame, boolean present) {}

    public static int translate(Map<Integer, Entry> table, int vaddr) {
        int vpn = vaddr >>> PAGE_BITS;
        int offset = vaddr & (PAGE_SIZE - 1);   // low 12 bits, untranslated
        Entry e = table.get(vpn);
        if (e == null) throw new RuntimeException("segfault: invalid page");
        if (!e.present()) throw new RuntimeException("page fault"); // OS loads it
        return e.frame() * PAGE_SIZE + offset;
    }

    public static void main(String[] args) {
        var table = Map.of(0x00012, new Entry(0x07D, true));
        System.out.printf("0x%X%n", translate(table, 0x000122A8)); // 0x7D2A8
    }
}
```

## code.cpp
```cpp
// Single-level page-table translation; the page offset passes through unchanged.
#include <iostream>
#include <unordered_map>
using namespace std;

constexpr int PAGE_BITS = 12;
constexpr int PAGE_SIZE = 1 << PAGE_BITS;

struct Entry { int frame; bool present; };

int translate(unordered_map<int, Entry>& table, int vaddr) {
    int vpn = (unsigned)vaddr >> PAGE_BITS;
    int offset = vaddr & (PAGE_SIZE - 1);
    auto it = table.find(vpn);
    if (it == table.end()) throw runtime_error("segfault: invalid page");
    if (!it->second.present) throw runtime_error("page fault"); // OS loads it
    return it->second.frame * PAGE_SIZE + offset;
}

int main() {
    unordered_map<int, Entry> table = {{0x00012, {0x07D, true}}};
    printf("0x%X\n", translate(table, 0x000122A8)); // 0x7D2A8
}
```
