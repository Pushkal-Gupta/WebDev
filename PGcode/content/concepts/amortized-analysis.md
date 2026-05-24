---
slug: amortized-analysis
module: foundations
title: Amortized Analysis
subtitle: Sometimes an O(n) operation is "really" O(1) when spread across many calls — three lenses for proving it.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Chapter 17 — Amortized Analysis (worked solutions)"
    url: "https://walkccc.me/CLRS/Chap17/17.1/"
    type: book
  - title: "GeeksforGeeks — Introduction to Amortized Analysis"
    url: "https://www.geeksforgeeks.org/introduction-to-amortized-analysis/"
    type: blog
  - title: "TheAlgorithms/Python — reference implementations"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
**Amortized analysis** examines the *average* cost of an operation in the worst-case sequence of operations — not the worst-case of a single operation. A dynamic array's `push` is O(n) worst-case (when it has to resize) but O(1) amortized. The technique matters because it's how you justify modern data structures whose worst-case-per-op is misleading.

## whyItMatters
Used constantly in interview-friendly data structures:
- **Dynamic array** (`ArrayList`, `vector`): O(1) amortized push.
- **Splay tree**: O(log n) amortized per operation.
- **Hash table**: O(1) amortized lookup/insert under good hashing.
- **Union-Find with path compression**: O(α(n)) amortized per op — effectively constant.
- **Disjoint-set with size/rank**: same.

If you can't articulate "why this O(n) operation is amortized O(1)," you'll fumble these questions. The three standard proof methods — aggregate, accounting, potential — each fit different problems.

## intuition
**Three views**:

1. **Aggregate**: Take any worst-case sequence of n operations; total cost is `T(n)`. Per-op amortized cost is `T(n) / n`.
2. **Accounting** (banker's method): Charge each cheap op a few "extra" coins beyond its actual cost. Save those coins; spend them later on expensive ops. If you never go bankrupt, the amortized cost is the per-op charge.
3. **Potential** (physicist's method): Define a potential function `Φ` (a number representing "stored work"). Amortized cost of an op = actual cost + ΔΦ. Sum telescopes: `Σ amortized = Σ actual + Φ(final) − Φ(initial)`. If `Φ(final) ≥ Φ(initial)`, amortized upper-bounds actual.

## visualization
```
Dynamic array push (doubling strategy):

Operation:   push push push push push push push push push ...
Real cost:    1    1    2    1    4    1    1    1    8   ...
              ↑         ↑              ↑                    
            (no resize) (copy 2)       (copy 4)           (copy 8)

Aggregate: n pushes cost ≤ 2n (all the copies sum to <2n, the actual pushes another n). So O(1) amortized.

Accounting: Charge 3 coins per push. Use 1 to do the push, save 2 in the bank.
On resize (copy m), you've already accumulated >= 2m coins from past pushes → pay for the copy.
```

## bruteForce
Compute the worst-case cost of a single op and pretend that's the cost of every op. Gives correct-but-loose bounds — e.g., dynamic array push as O(n) per call. Misleads you into avoiding it.

## optimal
**Aggregate method** for dynamic array doubling:
- Sum of resize costs over n pushes is `1 + 2 + 4 + ... + n/2 + n < 2n`.
- Plus n real pushes = `< 3n`.
- Amortized cost per op = `3n / n = O(1)`.

**Accounting method** for the same:
- Charge 3 per push: 1 for the push itself, 2 saved in a bank.
- When resize doubles from m to 2m: need m copies. Bank has at least 2m coins from the last m pushes (each saved 2).
- Never goes negative → amortized 3 = O(1).

**Potential method** for union-find with path compression:
- Φ counts the "potential left to discharge" — based on rank gaps in the forest.
- Each op may temporarily increase Φ; over a long sequence the amortized cost is O(α(n)).
- α is the inverse Ackermann function — for any imaginable n, α(n) ≤ 4.

For **splay trees**, the canonical Φ = `Σ log(size(node))`. Splaying a node temporarily disturbs this but the amortized bound shakes out to O(log n).

## complexity
- **Amortized ≠ probabilistic**: an amortized O(1) bound is a *worst-case* guarantee over the whole sequence, not an "on average" claim about randomness.
- **A single op may still be O(n)** worst case — amortized analysis just doesn't care about that single op, only the totalcost.
- For latency-sensitive applications (real-time systems), worst-case-per-op still matters; amortized bounds may not.

## pitfalls
- **Confusing amortized with average-case (random input)**: amortized doesn't randomize anything — it's deterministic worst-case averaged over operations.
- **Choosing a bad potential function**: if Φ shrinks faster than the operation does work, the analysis breaks. Make sure `Φ(final) ≥ Φ(initial)`.
- **Mixing up actual and amortized in proofs**: `amortized = actual + ΔΦ`. Telescoping gives `Σ amortized = Σ actual + Φ_final − Φ_initial`.
- **Real-time systems**: amortized O(1) might still spike to O(n). Don't use a doubling array in a periodic ISR.

## interviewTips
- When asked about dynamic arrays, hash tables, union-find, splay trees, or stack-with-find-max — the cost is usually amortized. Say so.
- Mention the three methods (aggregate, accounting, potential) — knowing the names signals depth.
- For senior interviews, walk through the accounting method on dynamic array — it's the cleanest demonstration.
- For real-time / embedded interviews, contrast amortized with worst-case-per-op.

## code.python
```python
# Empirical demo: append cost averaged over many pushes.
import time

def naive_append_cost():
    arr = []
    start = time.time()
    for i in range(1_000_000):
        arr.append(i)
    elapsed = time.time() - start
    print(f"1M appends: {elapsed*1000:.1f}ms, average {elapsed*1e6 / 1_000_000:.3f}µs each")

naive_append_cost()   # ~50ms total, ~50ns each → effectively O(1)
```

## code.javascript
```javascript
// Same empirical demo in Node.
function appendCost(n = 1_000_000) {
  const arr = [];
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) arr.push(i);
  const t1 = process.hrtime.bigint();
  console.log(`${n} pushes: ${Number(t1 - t0) / 1e6} ms`);
}
appendCost();
```

## code.java
```java
class AmortizedDemo {
    public static void main(String[] args) {
        long t0 = System.nanoTime();
        java.util.ArrayList<Integer> a = new java.util.ArrayList<>();
        for (int i = 0; i < 1_000_000; i++) a.add(i);
        long t1 = System.nanoTime();
        System.out.println((t1 - t0) / 1_000_000 + " ms");
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <vector>
#include <chrono>
int main() {
    std::vector<int> v;
    auto t0 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 1'000'000; i++) v.push_back(i);
    auto t1 = std::chrono::high_resolution_clock::now();
    std::cout << std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count() << " ms\n";
}
```
