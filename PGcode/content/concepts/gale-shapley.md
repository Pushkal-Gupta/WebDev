---
slug: gale-shapley
module: greedy
title: Gale-Shapley Stable Matching
subtitle: Find a stable matching between two equal-sized sets with ranked preferences in O(n²) — proposers always win.
difficulty: Intermediate
position: 6
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Gale & Shapley (1962) — College Admissions and the Stability of Marriage"
    url: ""
status: published
---

## intro
Given n men and n women, each with a strict preference ordering over the other side, a **matching** is a one-to-one pairing. It's **stable** if no man-woman pair both prefer each other over their current partners. The Gale-Shapley algorithm always produces a stable matching in O(n²), with men (the proposers) getting their best possible stable partners — the women get their worst.

## whyItMatters
Real systems use Gale-Shapley directly:
- **National Resident Matching Program (NRMP)** — assigns medical school graduates to residency programs.
- **School choice** in NYC, Boston, and other large districts.
- **Roommate matching** in colleges, networking pairings, mentor-mentee programs.
- Won Shapley and Roth the **2012 Nobel Prize in Economics**.

In interviews, comes up as "implement stable matching" or framed indirectly as "match items where each side has preferences."

## intuition
Every round, every unmatched man proposes to his most-preferred woman who hasn't yet rejected him. Each woman holds onto her best proposer so far — when a better one shows up, she tentatively accepts the new one and rejects the old. Eventually every man either has a tentative partner or has been rejected by every woman (impossible in equal-sized sets — pigeonhole guarantees a match).

## visualization
```
Men:    Alex prefers [Cara, Dee], Ben prefers [Dee, Cara]
Women:  Cara prefers [Ben, Alex], Dee prefers [Alex, Ben]

Round 1:
  Alex proposes to Cara — Cara accepts.   Pairs: {Alex—Cara}
  Ben proposes to Dee — Dee accepts.      Pairs: {Alex—Cara, Ben—Dee}

Stable? Check rogue pairs:
  Alex prefers Dee over Cara? Yes (in his list Dee is below Cara — depends on order).
  Dee prefers Alex over Ben? Yes (Alex is first in her list).
  → Alex-Dee is a "rogue pair" → matching unstable.

Re-do with corrected order — algorithm guarantees stable result regardless of input order.
```

## bruteForce
Enumerate every permutation, check stability. O(n!·n²) — useless beyond n = 8.

## optimal
```
free_men = [all n men]
proposed_to = {man: set() for man in men}   # tracks who each man already proposed to
woman_partner = {}                          # current tentative partner of each woman

while free_men:
    m = free_men.pop()
    for w in m.preferences:
        if w in proposed_to[m]: continue
        proposed_to[m].add(w)
        if w not in woman_partner:
            woman_partner[w] = m
            break
        cur = woman_partner[w]
        if w.prefers(m, cur):
            woman_partner[w] = m
            free_men.append(cur)
            break
        # w rejects m; continue to next woman
```

For O(1) "w prefers m over cur" lookup, precompute `rank[w][m] = position of m in w's preference list`. Then `prefers = rank[w][m] < rank[w][cur]`.

**Guarantees**:
- The matching is always stable.
- The matching is **men-optimal** — every man gets his best possible stable partner.
- The matching is **women-pessimal** — every woman gets her worst possible stable partner.
- Truthful proposers cannot benefit by misrepresenting preferences.

To get women-optimal, swap roles (women propose).

## complexity
- **Time**: O(n²) — each man proposes at most n times.
- **Space**: O(n²) for preference matrices + the rank lookup.
- **Convergence**: provably terminates in ≤ n² total proposals.

## pitfalls
- **Ties in preferences**: classic Gale-Shapley assumes strict orderings. Ties make the problem NP-hard in general (specifically, finding the maximum-cardinality weakly-stable matching).
- **Unequal-sized sets**: variant called **incomplete preferences** — some pairings impossible. Use the same algorithm with "stay single" as a fallback.
- **Misreading proposer-optimality**: it's optimal for the PROPOSING side, pessimal for the receiving side. Picking which side proposes is a policy choice with real consequences (NRMP has run both ways — historically programs proposed, now applicants do).
- **Strategy-proofness**: only the proposers can't game it. Receivers CAN benefit from misreporting in adversarial settings.

## interviewTips
- The trigger: "match A to B where both sides have preferences." Gale-Shapley.
- Walk through the women-optimal vs men-optimal asymmetry — interviewers love this.
- Mention **NRMP** by name — most candidates don't know the algorithm is famous.
- For senior interviews, mention **stable roommate problem** (NOT bipartite — much harder, may have no solution) and **deferred acceptance** as the family name in mechanism design.

## code.python
```python
def gale_shapley(men_prefs, women_prefs):
    n = len(men_prefs)
    rank = [[0] * n for _ in range(n)]
    for w in range(n):
        for r, m in enumerate(women_prefs[w]):
            rank[w][m] = r
    next_proposal = [0] * n
    partner_of_woman = [-1] * n
    free = list(range(n))
    while free:
        m = free.pop()
        w = men_prefs[m][next_proposal[m]]
        next_proposal[m] += 1
        if partner_of_woman[w] == -1:
            partner_of_woman[w] = m
        else:
            cur = partner_of_woman[w]
            if rank[w][m] < rank[w][cur]:
                partner_of_woman[w] = m
                free.append(cur)
            else:
                free.append(m)
    pairs = [(m, w) for w, m in enumerate(partner_of_woman)]
    return pairs

print(gale_shapley(
    [[0, 1], [1, 0]],
    [[0, 1], [1, 0]],
))
```

## code.javascript
```javascript
function galeShapley(menPrefs, womenPrefs) {
  const n = menPrefs.length;
  const rank = Array.from({ length: n }, () => new Array(n));
  for (let w = 0; w < n; w++) for (let r = 0; r < n; r++) rank[w][womenPrefs[w][r]] = r;
  const nextProp = new Array(n).fill(0);
  const partnerOf = new Array(n).fill(-1);
  const free = [...Array(n).keys()];
  while (free.length) {
    const m = free.pop();
    const w = menPrefs[m][nextProp[m]++];
    if (partnerOf[w] === -1) partnerOf[w] = m;
    else {
      const cur = partnerOf[w];
      if (rank[w][m] < rank[w][cur]) { partnerOf[w] = m; free.push(cur); }
      else free.push(m);
    }
  }
  return partnerOf.map((m, w) => [m, w]);
}
```

## code.java
```java
import java.util.*;
class GaleShapley {
    public int[] match(int[][] menPrefs, int[][] womenPrefs) {
        int n = menPrefs.length;
        int[][] rank = new int[n][n];
        for (int w = 0; w < n; w++) for (int r = 0; r < n; r++) rank[w][womenPrefs[w][r]] = r;
        int[] nextProp = new int[n], partnerOf = new int[n];
        Arrays.fill(partnerOf, -1);
        Deque<Integer> free = new ArrayDeque<>();
        for (int i = 0; i < n; i++) free.push(i);
        while (!free.isEmpty()) {
            int m = free.pop();
            int w = menPrefs[m][nextProp[m]++];
            if (partnerOf[w] == -1) partnerOf[w] = m;
            else if (rank[w][m] < rank[w][partnerOf[w]]) { free.push(partnerOf[w]); partnerOf[w] = m; }
            else free.push(m);
        }
        return partnerOf;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <stack>
std::vector<int> galeShapley(const std::vector<std::vector<int>>& menPrefs, const std::vector<std::vector<int>>& womenPrefs) {
    int n = menPrefs.size();
    std::vector<std::vector<int>> rank(n, std::vector<int>(n));
    for (int w = 0; w < n; w++) for (int r = 0; r < n; r++) rank[w][womenPrefs[w][r]] = r;
    std::vector<int> nextProp(n, 0), partnerOf(n, -1);
    std::stack<int> free;
    for (int i = 0; i < n; i++) free.push(i);
    while (!free.empty()) {
        int m = free.top(); free.pop();
        int w = menPrefs[m][nextProp[m]++];
        if (partnerOf[w] == -1) partnerOf[w] = m;
        else if (rank[w][m] < rank[w][partnerOf[w]]) { free.push(partnerOf[w]); partnerOf[w] = m; }
        else free.push(m);
    }
    return partnerOf;
}
```
