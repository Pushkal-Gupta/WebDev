---
slug: virtual-memory-page-replacement
module: cs-os-concurrency
title: Virtual Memory and Page Replacement
subtitle: Address translation, TLBs, and page faults — then the eviction policies: FIFO, Belady's anomaly, LRU, the clock algorithm, and thrashing.
difficulty: Intermediate
position: 55
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Beyond Physical Memory: Policies"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf"
    type: book
  - title: "OSTEP — Paging: Faster Translations (TLBs)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf"
    type: book
  - title: "OSTEP — Paging: Introduction"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf"
    type: book
status: published
---

## intro
Virtual memory gives every process the illusion of a private, contiguous address space far larger than physical RAM. The hardware splits each virtual address into a page number and an offset, translates the page number to a physical frame through a per-process page table (cached in the TLB), and traps to the OS — a page fault — when the page is not resident. Faults force the central question of this topic: when memory is full, which page do you evict? FIFO, LRU, and the clock algorithm are the canonical answers, and they differ far more than they look.

## whyItMatters
- Page replacement is the interview question that LeetCode 146 (LRU Cache) secretly is: the hashmap-plus-doubly-linked-list structure exists because operating systems and caches needed O(1) eviction decisions. Knowing the OS story turns a memorized data structure into an explained one.
- The same eviction policies run everywhere above the OS: CPU caches (pseudo-LRU), Redis (`allkeys-lru` is a sampled approximation, for the same cost reasons the kernel uses clock instead of true LRU), CDN edges, database buffer pools — one policy family, every layer of the stack.
- Belady's anomaly — more memory causing *more* faults under FIFO — is a famous counterintuitive result interviewers use to separate memorization from understanding.
- Thrashing explains a production failure mode every engineer eventually meets: a box at 100% disk I/O and 5% useful CPU, "working" hard at making no progress.

## intuition
Think of physical RAM as a small desk and the process's full address space as a warehouse of file folders. You can only work on folders that are on the desk (resident pages). The address translation layer is the index card taped to the desk: "folder 7 is in desk slot 2." The TLB is your short-term memory of that card — for the handful of folders you touch constantly, you do not even glance at the index. When you reach for a folder that is not on the desk, work stops while you walk to the warehouse: that walk is the **page fault**, and it is catastrophically slow relative to a desk lookup — main memory is ~100 ns, a disk fetch is ~100 microseconds to milliseconds, a factor of thousands to millions. Fault *rate*, not hit speed, dominates performance; a tiny change in miss rate swamps any change in hit cost.

When the desk is full and a new folder must come up, you choose a victim. The oracle answer (Belady's OPT) is "evict the folder you will need furthest in the future" — unimplementable, but the benchmark every real policy is graded against. **FIFO** evicts the folder that has been on the desk longest, which is irrelevant: your most-used reference manual is also the oldest thing on the desk. **LRU** evicts the folder *touched* longest ago, betting on temporal locality — what you used recently, you will use again. That bet is usually right, which is why LRU approximations won.

But true LRU is too expensive at memory speed: it needs a timestamp or list update on *every single memory access*, billions per second. So hardware gives one cheap bit — the **referenced bit**, set on access — and the **clock algorithm** sweeps a hand around the frames: referenced bit set? Clear it, spare the page, advance. Bit clear? Nobody touched this page in a full sweep — evict it. Second chances instead of full ordering: 90% of LRU's benefit at a vanishing fraction of its cost.

The final concept is the **working set** — the pages a process actually needs in its current phase. If every process's working set fits in RAM, faults are rare. If the sum exceeds RAM, every process steals frames from the others, every quantum begins with refaulting evicted pages, and the system **thrashes**: disk saturated, CPU idle, throughput near zero. No replacement policy fixes overcommitment; only admission control (run fewer processes) or more memory does.

## visualization
Reference string 1,2,3,4,1,2,5,1,2,3,4,5 — the classic Belady string. F = fault, h = hit.

```
FIFO, 3 frames                              FIFO, 4 frames
ref:    1  2  3  4  1  2  5  1  2  3  4  5  ref:    1  2  3  4  1  2  5  1  2  3  4  5
frame0: 1  1  1  4  4  4  5  5  5  5  5  5  frame0: 1  1  1  1  1  1  5  5  5  5  4  4
frame1:    2  2  2  1  1  1  1  1  3  3  3  frame1:    2  2  2  2  2  2  1  1  1  1  5
frame2:       3  3  3  2  2  2  2  2  4  4  frame2:       3  3  3  3  3  3  2  2  2  2
                                            frame3:          4  4  4  4  4  4  3  3  3
        F  F  F  F  F  F  F  h  h  F  F  h          F  F  F  F  h  h  F  F  F  F  F  F
        9 faults with 3 frames                      10 faults with 4 frames
        => MORE memory, MORE faults: Belady's anomaly (FIFO is not a stack algorithm)

LRU, 3 frames, same string                  CLOCK (second chance), 3 frames
ref:    1  2  3  4  1  2  5  1  2  3  4  5  hand sweeps; R=referenced bit
frame0: 1  1  1  4  4  4  5  5  5  3  3  3  on fault: R==1 -> clear R, advance
frame1:    2  2  2  1  1  1  1  1  1  4  4           R==0 -> evict here, insert
frame2:       3  3  3  2  2  2  2  2  2  5  on hit:  set R=1, hand stays put
        F  F  F  F  F  F  F  h  h  F  F  F  approximates LRU with 1 bit/frame
        10 faults — never anomalous: with k frames LRU holds the k most
        recent pages, always a subset of what k+1 frames would hold
```

## bruteForce
FIFO is the brute-force policy: a queue of resident pages, evict the head, append the newcomer, never look at access patterns. It is O(1) and trivially correct, but it evicts by *load time*, which says nothing about *usefulness* — a hot page loaded early is the first to go. Worse, FIFO violates the inclusion property (the pages held with k frames are not necessarily a subset of those held with k+1), which is precisely what permits Belady's anomaly: the 3-frame run above takes 9 faults while the 4-frame run takes 10. Random eviction, the other brute-force option, is O(1) too and — embarrassingly for FIFO — often performs about as well.

## optimal
The unbeatable benchmark is **Belady's OPT**: evict the page whose next use lies furthest in the future. It provably minimizes faults but requires knowing the future, so its role is as a yardstick — you simulate it offline against a recorded trace to see how much headroom your real policy leaves.

**LRU** is the best practical approximation of OPT under temporal locality, and it is a *stack algorithm*: the set of pages resident with k frames is always a subset of the set with k+1 frames, so more memory can never cause more faults — Belady's anomaly is structurally impossible. Implemented as a hashmap plus doubly-linked list (LeetCode 146), both `get` and `put` are O(1). The fatal cost is that *every* access must move a node to the list head; fine for a software cache handling thousands of operations per second, impossible for hardware handling billions of memory references.

So real kernels run **clock** (second chance): frames in a circle, one referenced bit per frame, set by hardware on access. On a fault, the hand inspects the frame it points at — referenced bit set means "used since I last looked": clear the bit and advance; bit clear means "idle for a full revolution": evict. Cost is O(1) amortized, one bit of state, no work on hits. Enhancements layer in the dirty bit (prefer evicting clean pages, which need no write-back; this is the two-bit "enhanced clock" using (referenced, dirty) classes) and background flushing of dirty pages. Linux's actual design generalizes the same idea into active/inactive LRU lists with referenced-bit sampling rather than per-access updates.

Above the policy sits the **working-set principle**: replacement only matters when working sets fit. Monitor the fault rate per process; if the global rate spikes while CPU utilization falls, the system is thrashing, and the fix is load shedding — suspend whole processes to free their frames — not a cleverer eviction rule.

## complexity
time: FIFO and clock are O(1) per fault (clock is amortized — the hand may sweep several frames but each sweep clears bits that pay for future stops); true LRU is O(1) per access with hashmap + doubly-linked list, but that per-access constant on every memory reference is exactly why hardware refuses to implement it; OPT requires future knowledge, O(n) lookahead per fault when simulated offline.
space: O(frames) for every policy — a queue for FIFO, list + map for LRU, one referenced bit per frame for clock.
notes: Compare policies by fault rate on a trace, not by per-operation cost; a single avoided fault (~milliseconds on disk swap) buys millions of bookkeeping operations.

## pitfalls
- Assuming more RAM always means fewer faults: true for stack algorithms (LRU, OPT) but false for FIFO — Belady's anomaly is the standard trap, and the 3-vs-4-frame run above is the counterexample to memorize.
- Counting the page-fault rate but ignoring TLB reach: a workload can have every page resident yet still crawl because its access pattern misses the TLB on every reference (the classic example is striding down columns of a row-major matrix). Translation cost and residency are separate problems.
- Implementing LRU eviction but forgetting the dirty bit: evicting a modified page costs a disk write *plus* the read of the incoming page — double the I/O. Real policies prefer clean victims and flush dirty pages in the background.
- Diagnosing thrashing as a slow-CPU problem and adding more worker processes: more processes shrink each one's frame share, raising the fault rate further. The correct moves are fewer concurrent processes or more memory — replacement policy tuning cannot fix overcommitment.
- Treating clock's referenced bit as a use *counter*: it is one bit, so a page touched once and a page touched a million times look identical until the hand clears both. Workloads needing frequency awareness move to LFU-style or multi-queue schemes (as Redis's LFU mode does).

## interviewTips
- Tie page replacement to LRU Cache (LeetCode 146) explicitly: the hashmap + doubly-linked-list design is the software answer, and clock is the hardware-constrained approximation — saying "the kernel cannot afford a list update per memory access, so it uses one referenced bit and a sweeping hand" shows systems depth.
- Know the Belady string 1,2,3,4,1,2,5,1,2,3,4,5 cold: FIFO faults 9 times with 3 frames and 10 with 4, and the one-line explanation is that FIFO lacks the inclusion property that makes LRU anomaly-proof.
- Define thrashing as "the sum of working sets exceeds physical memory," and give the operational signature — disk I/O pegged, CPU utilization collapsing — plus the fix: suspend processes or add RAM, never just tune the eviction policy.

## code.python
```python
from collections import OrderedDict

def simulate_fifo(refs, frames):
    mem, queue, faults = set(), [], 0
    for p in refs:
        if p in mem: continue
        faults += 1
        if len(mem) == frames:
            mem.discard(queue.pop(0))
        mem.add(p); queue.append(p)
    return faults

def simulate_lru(refs, frames):
    mem, faults = OrderedDict(), 0          # insertion order == recency order
    for p in refs:
        if p in mem:
            mem.move_to_end(p)              # hit refreshes recency
        else:
            faults += 1
            if len(mem) == frames:
                mem.popitem(last=False)     # evict least recently used
            mem[p] = True
    return faults

def simulate_clock(refs, frames):
    slot = [None] * frames                  # page in each frame
    rbit = [0] * frames                     # hardware-set referenced bit
    where, hand, faults = {}, 0, 0
    for p in refs:
        if p in where:
            rbit[where[p]] = 1              # hit: set R, hand does not move
            continue
        faults += 1
        while rbit[hand] == 1:              # second chance: clear and advance
            rbit[hand] = 0
            hand = (hand + 1) % frames
        if slot[hand] is not None:
            del where[slot[hand]]
        slot[hand], rbit[hand], where[p] = p, 1, hand
        hand = (hand + 1) % frames
    return faults

belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
print("FIFO  3 frames:", simulate_fifo(belady, 3))   # 9
print("FIFO  4 frames:", simulate_fifo(belady, 4))   # 10  <- Belady's anomaly
print("LRU   3 frames:", simulate_lru(belady, 3))    # 10
print("LRU   4 frames:", simulate_lru(belady, 4))    # 8   <- stack algorithm, no anomaly
print("CLOCK 3 frames:", simulate_clock(belady, 3))  # 9
```

## code.javascript
```javascript
function simulateFifo(refs, frames) {
  const mem = new Set(), queue = [];
  let faults = 0;
  for (const p of refs) {
    if (mem.has(p)) continue;
    faults++;
    if (mem.size === frames) mem.delete(queue.shift());
    mem.add(p); queue.push(p);
  }
  return faults;
}

function simulateLru(refs, frames) {
  const mem = new Map();                    // Map preserves insertion order
  let faults = 0;
  for (const p of refs) {
    if (mem.has(p)) {
      mem.delete(p); mem.set(p, true);      // hit: re-insert to refresh recency
    } else {
      faults++;
      if (mem.size === frames) mem.delete(mem.keys().next().value);
      mem.set(p, true);
    }
  }
  return faults;
}

function simulateClock(refs, frames) {
  const slot = new Array(frames).fill(null);
  const rbit = new Array(frames).fill(0);
  const where = new Map();
  let hand = 0, faults = 0;
  for (const p of refs) {
    if (where.has(p)) { rbit[where.get(p)] = 1; continue; }   // hit sets R
    faults++;
    while (rbit[hand] === 1) {              // second chance: clear R, advance
      rbit[hand] = 0;
      hand = (hand + 1) % frames;
    }
    if (slot[hand] !== null) where.delete(slot[hand]);
    slot[hand] = p; rbit[hand] = 1; where.set(p, hand);
    hand = (hand + 1) % frames;
  }
  return faults;
}

const belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
console.log("FIFO  3:", simulateFifo(belady, 3));   // 9
console.log("FIFO  4:", simulateFifo(belady, 4));   // 10  Belady's anomaly
console.log("LRU   3:", simulateLru(belady, 3));    // 10
console.log("LRU   4:", simulateLru(belady, 4));    // 8   no anomaly
console.log("CLOCK 3:", simulateClock(belady, 3));  // 9
```

## code.java
```java
import java.util.*;

public class PageReplacementSim {
    static int fifo(int[] refs, int frames) {
        Set<Integer> mem = new HashSet<>();
        Deque<Integer> queue = new ArrayDeque<>();
        int faults = 0;
        for (int p : refs) {
            if (mem.contains(p)) continue;
            faults++;
            if (mem.size() == frames) mem.remove(queue.pollFirst());
            mem.add(p); queue.addLast(p);
        }
        return faults;
    }

    static int lru(int[] refs, int frames) {
        // accessOrder=true makes LinkedHashMap iterate least-recently-used first
        LinkedHashMap<Integer, Boolean> mem = new LinkedHashMap<>(16, 0.75f, true);
        int faults = 0;
        for (int p : refs) {
            if (mem.containsKey(p)) { mem.get(p); continue; }   // hit refreshes recency
            faults++;
            if (mem.size() == frames) mem.remove(mem.keySet().iterator().next());
            mem.put(p, true);
        }
        return faults;
    }

    static int clock(int[] refs, int frames) {
        int[] slot = new int[frames], rbit = new int[frames];
        Arrays.fill(slot, -1);
        Map<Integer, Integer> where = new HashMap<>();
        int hand = 0, faults = 0;
        for (int p : refs) {
            Integer at = where.get(p);
            if (at != null) { rbit[at] = 1; continue; }         // hit sets R
            faults++;
            while (rbit[hand] == 1) {                            // second chance
                rbit[hand] = 0;
                hand = (hand + 1) % frames;
            }
            if (slot[hand] != -1) where.remove(slot[hand]);
            slot[hand] = p; rbit[hand] = 1; where.put(p, hand);
            hand = (hand + 1) % frames;
        }
        return faults;
    }

    public static void main(String[] args) {
        int[] belady = {1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
        System.out.println("FIFO  3: " + fifo(belady, 3));   // 9
        System.out.println("FIFO  4: " + fifo(belady, 4));   // 10  Belady's anomaly
        System.out.println("LRU   3: " + lru(belady, 3));    // 10
        System.out.println("LRU   4: " + lru(belady, 4));    // 8   no anomaly
        System.out.println("CLOCK 3: " + clock(belady, 3));  // 9
    }
}
```

## code.cpp
```cpp
#include <deque>
#include <iostream>
#include <list>
#include <unordered_map>
#include <unordered_set>
#include <vector>

int fifo(const std::vector<int>& refs, int frames) {
    std::unordered_set<int> mem;
    std::deque<int> queue;
    int faults = 0;
    for (int p : refs) {
        if (mem.count(p)) continue;
        faults++;
        if ((int)mem.size() == frames) { mem.erase(queue.front()); queue.pop_front(); }
        mem.insert(p); queue.push_back(p);
    }
    return faults;
}

int lru(const std::vector<int>& refs, int frames) {
    std::list<int> order;                                   // front = most recent
    std::unordered_map<int, std::list<int>::iterator> pos;
    int faults = 0;
    for (int p : refs) {
        auto it = pos.find(p);
        if (it != pos.end()) {
            order.splice(order.begin(), order, it->second); // hit: move to front
            continue;
        }
        faults++;
        if ((int)pos.size() == frames) {
            pos.erase(order.back());
            order.pop_back();                               // evict least recent
        }
        order.push_front(p);
        pos[p] = order.begin();
    }
    return faults;
}

int clock_replace(const std::vector<int>& refs, int frames) {
    std::vector<int> slot(frames, -1), rbit(frames, 0);
    std::unordered_map<int, int> where;
    int hand = 0, faults = 0;
    for (int p : refs) {
        auto it = where.find(p);
        if (it != where.end()) { rbit[it->second] = 1; continue; }  // hit sets R
        faults++;
        while (rbit[hand] == 1) {                            // second chance
            rbit[hand] = 0;
            hand = (hand + 1) % frames;
        }
        if (slot[hand] != -1) where.erase(slot[hand]);
        slot[hand] = p; rbit[hand] = 1; where[p] = hand;
        hand = (hand + 1) % frames;
    }
    return faults;
}

int main() {
    std::vector<int> belady{1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
    std::cout << "FIFO  3: " << fifo(belady, 3) << '\n';          // 9
    std::cout << "FIFO  4: " << fifo(belady, 4) << '\n';          // 10  Belady's anomaly
    std::cout << "LRU   3: " << lru(belady, 3) << '\n';           // 10
    std::cout << "LRU   4: " << lru(belady, 4) << '\n';           // 8   no anomaly
    std::cout << "CLOCK 3: " << clock_replace(belady, 3) << '\n'; // 9
}
```
