---
slug: set-cover-greedy
module: greedy
title: Greedy Set Cover
subtitle: NP-hard in general, but the obvious greedy gives a tight O(log n) approximation.
difficulty: Advanced
position: 20
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Approximation Algorithms: Set Cover"
    url: "https://walkccc.me/CLRS/Chap35/35.3/"
    type: book
  - title: "Set Cover Problem — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/set-cover-problem-set-1-greedy-approximation-algorithm/"
    type: blog
  - title: "TheAlgorithms/Python — greedy_algorithms"
    url: "https://github.com/TheAlgorithms/Python/tree/master/greedy_methods"
    type: repo
status: published
---

## intro
Given a universe `U` of `n` elements and a collection of subsets whose union covers `U`, set cover asks for the smallest sub-collection whose union still equals `U`. The decision problem is NP-complete; the optimization version is APX-hard. But a one-line greedy — repeatedly pick the set that covers the most uncovered elements — comes within a factor of `H(n) = ln n + 1` of optimal, and that bound is tight.

## whyItMatters
- **Test-suite minimization** (Google's `bazel test`, Meta's `Sapienza`) uses greedy set cover to pick the smallest set of tests that exercise every changed code branch.
- **Ad campaign targeting** (Meta Ads Manager, Google Ads): pick the minimum set of audience segments that cover every demographic; bidding optimizers use weighted variants.
- **Sensor placement and network monitoring**: choose minimum sensors / probes to observe every room / link; published in Krause-Guestrin 2007 ("Near-optimal sensor placements").
- **CLRS Chapter 35 (Approximation Algorithms)**, **Vazirani's *Approximation Algorithms* textbook**, and **Williamson-Shmoys *Design of Approximation Algorithms*** all use set cover as the canonical example; **Feige 1998** proved the (1-o(1)) ln n approximation hardness under P != NP, sealed by Dinur-Steurer 2014.

## intuition
Set cover is **NP-hard** (the decision version is one of Karp's original 21 NP-complete problems, 1972) and **APX-hard** (no constant-factor approximation exists unless P = NP). So we cannot hope for a polynomial-time exact algorithm at scale. The good news: a one-line greedy heuristic — **repeatedly pick the set that covers the most still-uncovered elements** — comes within a factor of `H(n) = 1 + 1/2 + 1/3 + ... + 1/n ≈ ln n + 1` of the true optimum, and that bound is asymptotically tight.

The intuition for why greedy works: each step buys you the most coverage available right now. The risk is that a set you take early might overlap heavily with one you would have wanted later. The `H(n)` factor is exactly the worst-case price of that locally-greedy myopia. The proof sketch (CLRS Chapter 35): an optimal cover with `OPT` sets covers all `n` elements, so by the pigeonhole principle at least one set in the optimal cover covers at least `n / OPT` of the uncovered elements at any given step. The greedy must pick a set that covers at least that many (otherwise we contradict optimality). The total cost analysis amortizes across the harmonic series — each element pays at most `H(n) * (1/OPT)` of the greedy cost — summing to `H(n) * OPT`.

For each remaining element `e`, charge it `cost(set_chosen) / new_elements_covered`. The sum of these charges over all elements is exactly the greedy's total cost. Each element pays at most `H(k_e)` where `k_e` is its position in the order it gets covered — and the harmonic sum bounds the total at `H(n) * OPT`.

The **hardness side**: Feige (1998) proved that for any `epsilon > 0`, approximating set cover within `(1 - epsilon) ln n` is NP-hard. Dinur and Steurer (2014) tightened this — no polynomial algorithm can do better than `(1 - o(1)) ln n` unless P = NP. So the greedy is essentially **optimal among polynomial approximations**. The Integer Linear Programming exact solution scales to a few thousand sets with modern solvers (Gurobi, CPLEX) but is exponential worst-case and far slower than the greedy for typical production workloads.

The weighted variant: pick the set that minimizes `cost / new_elements_covered`. Same `H(n)` approximation ratio applies. This is what ad campaigns use — each segment has a CPM cost, and you want maximum reach per dollar.

## visualization
Universe `{1, 2, 3, 4, 5}` and sets `S1 = {1, 2, 3}`, `S2 = {2, 4}`, `S3 = {3, 4, 5}`, `S4 = {5}`. Step 1: `S1` covers 3 new elements, `S3` covers 3. Tie, pick `S1`. Step 2: from `{4, 5}`, `S3` covers both, take it. Done with `{S1, S3}` — and that is the optimum here. On adversarial instances the same algorithm produces covers of size O(OPT log n).

## bruteForce
Enumerate every subset of the family of sets, check whether its union equals `U`, keep the smallest. With `m` sets this is `2^m` candidates — instantly intractable past 25 sets. Integer linear programming finds the true optimum and scales to a few thousand sets with modern solvers, but is still exponential worst-case and far slower than the greedy approximation for most production loads.

## optimal
The right algorithm is the **greedy max-coverage selection with a bucket-queue speedup**, giving `H(n)` approximation and near-linear runtime in the total input size.

```python
def greedy_set_cover(universe, sets):
    """Returns the indices of chosen sets covering the universe; H(n) approx-ratio."""
    remaining = set(universe)
    chosen = []
    sets = [set(s) for s in sets]
    while remaining:
        # Pick the set with the largest intersection with `remaining`.
        best_idx, best_gain = -1, -1
        for i, s in enumerate(sets):
            gain = len(s & remaining)
            if gain > best_gain:
                best_gain, best_idx = gain, i
        if best_gain == 0:
            return None                              # no cover exists
        chosen.append(best_idx)
        remaining -= sets[best_idx]
    return chosen

def greedy_weighted_set_cover(universe, sets, costs):
    """Weighted variant: pick set minimizing cost / new_coverage. Same H(n) bound."""
    remaining = set(universe)
    chosen = []
    sets = [set(s) for s in sets]
    while remaining:
        best_idx, best_ratio = -1, float('inf')
        for i, s in enumerate(sets):
            gain = len(s & remaining)
            if gain == 0: continue
            ratio = costs[i] / gain
            if ratio < best_ratio:
                best_ratio, best_idx = ratio, i
        if best_idx == -1: return None
        chosen.append(best_idx)
        remaining -= sets[best_idx]
    return chosen
```

Why this is right: the greedy achieves the theoretically optimal polynomial-time approximation factor (`H(n) ≈ ln n`). The naive implementation is O(m * n * H(n)) — m sets, n elements, log n rounds. The **bucket-queue speedup** brings it to O((sum of set sizes) * H(n)) ≈ O(total_input * log n), which is essentially linear in input size: maintain for each set a counter of "uncovered elements remaining"; when an element is covered, decrement the counters of every set containing it; use a max-heap or bucket queue (one bucket per coverage count) to pop the next best set in amortized O(1).

```python
# Bucket-queue speedup for large inputs (10^5+ sets / elements).
from collections import defaultdict
import heapq

def greedy_set_cover_fast(universe, sets):
    n = len(universe)
    elt_to_sets = defaultdict(list)              # element -> indices of sets containing it
    for i, s in enumerate(sets):
        for e in s: elt_to_sets[e].append(i)
    coverage = [len(s) for s in sets]            # current coverage count per set
    sets = [set(s) for s in sets]
    remaining = set(universe)
    chosen = []
    # Max-heap by coverage (negate for Python's min-heap).
    heap = [(-c, i) for i, c in enumerate(coverage)]
    heapq.heapify(heap)
    while remaining and heap:
        neg, i = heapq.heappop(heap)
        if coverage[i] != -neg: continue          # stale entry; skip
        if coverage[i] == 0: break                # no useful set left
        chosen.append(i)
        for e in sets[i] & remaining:
            remaining.discard(e)
            for j in elt_to_sets[e]:
                coverage[j] -= 1
                heapq.heappush(heap, (-coverage[j], j))
    return chosen
```

**Production cautions**:
- **Drop covered elements from the candidate sets** — the "remaining coverage" changes every round; stale counts mislead the greedy. The bucket queue handles this via stale-entry skipping.
- **Weighted set cover**: minimize `cost / new_coverage`, NOT just `cost`; this is the LP-relaxation rounding strategy that achieves the same `H(n)` bound.
- **Never claim optimality** — the greedy returns `H(n) * OPT` worst case. For applications that need exact solutions (small problems with semantic correctness requirements), use ILP via Gurobi / CPLEX / OR-Tools.
- **Adjacent algorithms to know**: **Vertex cover** (a special case; 2-approximation by matching), **Hitting Set** (set cover's dual), **Dominating Set** (NP-hard, log-approx via reduction to set cover), **Maximum Coverage** (pick exactly k sets to maximize coverage; (1 - 1/e) ≈ 0.632 approximation via the same greedy, optimal under P != NP by Feige).

**Real systems** that use this exact algorithm: **bazel test affected** (Google) for test selection, **Facebook's Sapienza** for hermetic test minimization, **Apache Spark's RDD partition pruning** for query plans, and the **AdWords campaign optimizer** for audience targeting.

## complexity
time: O(sum over sets of |S| * H(n)) with the bucket-queue optimization; the naive scan is O(m * n * H(n))
space: O(n + m + sum of set sizes)
notes: The H(n) approximation ratio is tight: there exist instances where greedy returns a cover of size (1 - o(1)) * H(n) * OPT. Under the assumption P != NP no polynomial-time algorithm can approximate set cover to better than (1 - epsilon) * ln n for any positive epsilon (Feige 1998 / Dinur-Steurer 2014).

## pitfalls
- Forgetting to drop covered elements from the candidate sets — the "remaining coverage" changes every round and stale counts mislead the greedy.
- Treating weighted set cover the same as unweighted: with costs, the greedy criterion becomes "cost divided by new elements covered," and you must minimize that ratio.
- Assuming the greedy returns the true minimum — it does not, except by luck. Always quote the bound.
- Implementing with O(m * n) scan per round on a 1M-element universe — the bucket queue is mandatory at scale.

## interviewTips
- State the NP-hardness up front and pivot immediately to the approximation — that move signals maturity.
- Be ready to derive the H(n) bound at least informally: each round covers a 1/OPT fraction of what is left.
- Mention real systems: test-suite selection, ad targeting, network monitoring, kernel test minimization.

## code.python
```python
def greedy_set_cover(universe, sets):
    remaining = set(universe)
    chosen = []
    sets = [set(s) for s in sets]
    while remaining:
        best_idx, best_gain = -1, -1
        for i, s in enumerate(sets):
            gain = len(s & remaining)
            if gain > best_gain:
                best_gain, best_idx = gain, i
        if best_gain == 0:
            return None
        chosen.append(best_idx)
        remaining -= sets[best_idx]
    return chosen
```

## code.javascript
```javascript
function greedySetCover(universe, sets) {
  let remaining = new Set(universe);
  const chosen = [];
  const arr = sets.map((s) => new Set(s));
  while (remaining.size) {
    let bestIdx = -1, bestGain = -1;
    for (let i = 0; i < arr.length; i++) {
      let gain = 0;
      for (const x of arr[i]) if (remaining.has(x)) gain++;
      if (gain > bestGain) { bestGain = gain; bestIdx = i; }
    }
    if (bestGain === 0) return null;
    chosen.push(bestIdx);
    for (const x of arr[bestIdx]) remaining.delete(x);
  }
  return chosen;
}
```

## code.java
```java
import java.util.*;

public List<Integer> greedySetCover(Set<Integer> universe, List<Set<Integer>> sets) {
    Set<Integer> remaining = new HashSet<>(universe);
    List<Integer> chosen = new ArrayList<>();
    while (!remaining.isEmpty()) {
        int bestIdx = -1, bestGain = -1;
        for (int i = 0; i < sets.size(); i++) {
            int gain = 0;
            for (int x : sets.get(i)) if (remaining.contains(x)) gain++;
            if (gain > bestGain) { bestGain = gain; bestIdx = i; }
        }
        if (bestGain == 0) return null;
        chosen.add(bestIdx);
        remaining.removeAll(sets.get(bestIdx));
    }
    return chosen;
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_set>

std::vector<int> greedySetCover(const std::unordered_set<int>& universe,
                                const std::vector<std::unordered_set<int>>& sets) {
    std::unordered_set<int> remaining = universe;
    std::vector<int> chosen;
    while (!remaining.empty()) {
        int bestIdx = -1, bestGain = -1;
        for (int i = 0; i < (int)sets.size(); ++i) {
            int gain = 0;
            for (int x : sets[i]) if (remaining.count(x)) ++gain;
            if (gain > bestGain) { bestGain = gain; bestIdx = i; }
        }
        if (bestGain == 0) return {};
        chosen.push_back(bestIdx);
        for (int x : sets[bestIdx]) remaining.erase(x);
    }
    return chosen;
}
```
