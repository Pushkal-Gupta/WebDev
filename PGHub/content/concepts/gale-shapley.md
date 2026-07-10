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
  - title: "CLRS — Chapter 15: Greedy Algorithms (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap15/"
    type: book
  - title: "GeeksforGeeks — Greedy Algorithms"
    url: "https://www.geeksforgeeks.org/greedy-algorithms/"
    type: blog
  - title: "TheAlgorithms/Python — greedy_methods/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/greedy_methods"
    type: repo
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

Picture it as an auction that runs in the wrong direction. The men are bidders who start at the top of their wishlist and get pushed steadily downward; the women are the auctioneers who only ever trade *up*. A woman's partner can be swapped out, but never for someone she ranks lower — her satisfaction is a ratchet that clicks in one direction and never slips back. That single monotonic fact is why the whole thing terminates: no proposal is ever repeated, because a man crossed off a woman only after she rejected him, and she rejects only when she already holds someone better, so she will never take him later.

What's actually happening: the algorithm defers commitment. Nothing is final until the queue of free men empties, which is why the receiving side's "acceptances" are always tentative. Step through a concrete case. Men Alex, Ben; women Cara, Dee. Alex ranks [Dee, Cara], Ben ranks [Dee, Cara]; Cara ranks [Alex, Ben], Dee ranks [Ben, Alex]. Round 1: Alex proposes to Dee, she holds him. Ben proposes to Dee too, but Dee ranks Ben above Alex, so she drops Alex and holds Ben; Alex goes back in the free queue. Round 2: Alex, now free, proposes to his second choice Cara, who is unmatched and accepts. Final matching: Alex–Cara, Ben–Dee. No rogue pair exists — every man got the best partner any stable matching could give him.

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

**Why it's correct.** The key invariant is that once a woman is matched she stays matched, and her partner only improves over time. So at termination no woman is unmatched (if she were, some man who was rejected by everyone would still be free, contradicting the free-queue being empty in an equal-sized instance). Stability follows by contradiction: suppose man m and woman w prefer each other to their assigned partners. Since m ranks w above his own partner, m must have proposed to w *before* settling for someone worse — he works strictly down his list. When m proposed, w either rejected him then or accepted and later dropped him, and in both cases she did so only for a man she ranked *higher* than m. Because her partner only improves, w's final partner is also ranked above m. That contradicts w preferring m, so no such rogue pair can exist.

**The mechanism, step by step.** Maintain a stack (or queue) of free men and a `next_proposal` pointer per man marking how far down his list he has gotten. Pop a free man, read his next unproposed woman, and advance his pointer. If she is unmatched, pair them. If she is matched, compare ranks: the loser of that comparison — either the incumbent or the new proposer — is pushed back onto the free stack. Repeat until the stack drains. The `rank` matrix turns each preference comparison into an array index instead of a linear scan, which is the difference between O(n^2) and O(n^3).

**The central tradeoff.** Deferred acceptance buys stability and proposer-optimality at the cost of asymmetry: the side that proposes gets its best achievable stable partner while the side that receives gets its worst. There is no stable matching that is simultaneously optimal for both sides, so the choice of proposer is a genuine policy decision, not an implementation detail.

**Complexity intuition.** Each man proposes to each woman at most once — he never revisits a woman who rejected him — so the total number of proposals is bounded by n * n = n^2, and every proposal does O(1) work thanks to the rank table. That gives the O(n^2) bound directly, and it is tight in the worst case.

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
