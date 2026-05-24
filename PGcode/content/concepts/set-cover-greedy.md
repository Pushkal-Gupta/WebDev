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
Set cover models a stunning range of problems: choosing a minimum set of test cases to hit every code branch, picking ads to reach every demographic, selecting sensors to monitor every room. The greedy strategy is the standard production answer because the integer-programming optimum is too expensive at scale. Knowing the H(n) bound — and why no polynomial algorithm can do better unless P = NP — is a frequent senior-level interview question.

## intuition
Each step you pick the set that buys you the most coverage per unit cost. The risk is that a set you take early might overlap heavily with one you would have wanted later. The H(n) factor is exactly the worst-case price of that locally-greedy myopia. The proof: an optimal cover with `OPT` sets covers all `n` elements, so the average set covers at least `n / OPT` elements. The greedy must pick at least that many, and the analysis amortizes across the harmonic series.

## visualization
Universe `{1, 2, 3, 4, 5}` and sets `S1 = {1, 2, 3}`, `S2 = {2, 4}`, `S3 = {3, 4, 5}`, `S4 = {5}`. Step 1: `S1` covers 3 new elements, `S3` covers 3. Tie, pick `S1`. Step 2: from `{4, 5}`, `S3` covers both, take it. Done with `{S1, S3}` — and that is the optimum here. On adversarial instances the same algorithm produces covers of size O(OPT log n).

## bruteForce
Enumerate every subset of the family of sets, check whether its union equals `U`, keep the smallest. With `m` sets this is `2^m` candidates — instantly intractable past 25 sets. Integer linear programming finds the true optimum and scales to a few thousand sets with modern solvers, but is still exponential worst-case and far slower than the greedy approximation for most production loads.

## optimal
Track the still-uncovered universe `R` as a hash set. While `R` is non-empty, scan every remaining set and compute its intersection size with `R`. Pick the set with the largest intersection (ties broken arbitrarily), add it to the cover, and subtract its elements from `R`. Repeat. To speed up the inner scan, maintain for each set a counter of "uncovered elements remaining," decrement neighbors when an element is covered, and pull from a max-heap or bucket queue.

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
