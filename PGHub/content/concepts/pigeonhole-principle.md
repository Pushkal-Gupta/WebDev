---
slug: pigeonhole-principle
module: math-number-theory
title: Pigeonhole Principle
subtitle: N+1 items in N boxes → at least one box has ≥2 items. Trivial-looking, devastatingly powerful in interview proofs.
difficulty: Intermediate
position: 19
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Concrete Mathematics (Knuth, Graham, Patashnik) — combinatorics chapters"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "Brilliant.org — Pigeonhole Principle"
    url: "https://brilliant.org/wiki/pigeonhole-principle/"
    type: blog
  - title: "TheAlgorithms/Python — combinatorial helpers"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
The **pigeonhole principle**: if N+1 pigeons go into N boxes, at least one box holds 2+ pigeons. Generalized: if more than k·N pigeons go into N boxes, some box holds more than k. Sounds obvious. Used to prove existence in interview problems, contest problems, and CS theorems where you'd otherwise need exhaustive search.

## whyItMatters
- **Two students in any class of 367 share a birthday** (366 possible days; 367 students; pigeonhole on days).
- **Floyd's cycle detection** (tortoise-and-hare): on n nodes, slow + fast pointer must meet — proof by pigeonhole on residues.
- **Hash table collisions**: with N items and < N buckets, at least one bucket has 2+.
- **Subset XOR**: among any 2^(n+1) subsets of an n-bit integer set, two have equal XOR — gives O(2^(n/2)) attacks on XOR systems.
- **Subset sum mod N**: any n+1 integers contain a subset with sum divisible by n.

## intuition
"You can't put 11 socks into 10 drawers without doubling up." That's it. The skill is **spotting when to apply it** — what are the items, what are the boxes, and why is items > boxes?

What's actually happening is a counting contradiction, not a construction. You never build the collision; you argue it *must* exist by comparing two totals. If the number of items strictly exceeds the number of categories they fall into, then the map that sends each item to its category cannot be injective — some category is reused. The entire craft is choosing that map: decide what each item maps to (its "box") so that there are provably fewer boxes than items *and* two items sharing a box is exactly the property you set out to prove exists.

Generalized form: among any sequence of n^2 + 1 distinct numbers, there's an increasing or decreasing subsequence of length n+1 (Erdős-Szekeres). Pigeonhole on (longest-increasing-ending-at-i, longest-decreasing-ending-at-i) pairs.

Worked micro-example with real numbers. Claim: among any 5 integers, some two have a difference divisible by 4. The boxes are the four remainders mod 4: `{0, 1, 2, 3}`. Take the concrete set `{7, 12, 18, 23, 30}` and reduce each mod 4 → `{3, 0, 2, 3, 2}`. Five items, four boxes, so by pigeonhole a box repeats — here `3` appears for both 7 and 23, and `2` for both 18 and 30. Pick either colliding pair: `23 - 7 = 16` is divisible by 4, and `30 - 18 = 12` is too. Notice the argument guaranteed a collision *before* we looked at the actual numbers; reducing mod 4 merely revealed which pair. That is the pattern every pigeonhole proof follows — define the boxes as an equivalence ("same remainder"), count that items outnumber boxes, then read off the forced coincidence as the thing you needed.

## visualization
```
Example: among any 6 integers, two have the same remainder mod 5.

  Boxes: residues mod 5  → 5 boxes [0, 1, 2, 3, 4]
  Items: 6 integers

  By pigeonhole: at least one box has ≥ ⌈6/5⌉ = 2 items.
  ⇒ Two of our integers share a residue mod 5
  ⇒ Their difference is divisible by 5.

Application: hash table with 5 buckets + 6 keys → guaranteed collision.
```

## bruteForce
Check all pairs / enumerate cases — works but wasteful when the existence is provable structurally.

## optimal
Pigeonhole is a **proof technique**, not an algorithm. Use it to PROVE that a brute-force search will succeed, then use a constructive algorithm to FIND the witness.

**Worked example — subset sum mod N**:
```
Claim: any n integers a_1, ..., a_n contain a contiguous subarray
whose sum is divisible by n.

Proof: consider prefix sums S_0 = 0, S_1 = a_1, S_2 = a_1+a_2, ..., S_n.
There are n+1 prefix sums and only n residues mod n.
By pigeonhole, S_i ≡ S_j mod n for some i < j.
Then a_{i+1} + ... + a_j = S_j - S_i ≡ 0 mod n.   ∎

Constructive algorithm:
def find_div_n_subarray(a):
    n = len(a)
    pref = {0: -1}; s = 0
    for i, x in enumerate(a):
        s = (s + x) % n
        if s in pref: return (pref[s] + 1, i)
        pref[s] = i
```

Read the two halves of this example as the general recipe. The *proof* half is pure pigeonhole: there are n+1 prefix sums `S_0..S_n` but only n residue classes mod n, so two prefix sums must share a residue — and the segment strictly between those two indices has a sum equal to their difference, hence ≡ 0 mod n. Nothing here tells you *which* pair collides; it only certifies that one exists.

The *construction* half turns that certificate into an O(n) algorithm by making the pigeonhole box explicit: a hashmap keyed by residue. Scan the prefixes left to right, and the first time a residue reappears you have found the two indices the proof promised — return the subarray between them. This "prove existence, then build the witness with a hashmap of residues" template recurs everywhere: cycle detection, zero-sum subarrays, the birthday-collision search, and de-duplication all use the same move. Complexity intuition: the proof itself is O(1) reasoning once you have named the boxes, and the derived algorithm is O(n) time with O(n) space for the residue map — a single pass, because the pigeonhole guarantee means you never need to backtrack or re-examine an earlier prefix. The payoff is exactly this: it converts a potential O(2^n) "try all subarrays" search into a linear scan by proving in advance that the scan cannot fail.

## complexity
- **Reasoning**: O(1) to apply once you've spotted the boxes.
- **Algorithm derived from the proof**: usually O(n) or O(n log n).

## pitfalls
- **Wrong box count**: count boxes carefully. 13 cards into 4 suits → some suit has ≥4 (NOT 3 — ceil(13/4) = 4).
- **Distinct items**: pigeonhole assumes you're packing distinct items into bins. Doesn't directly handle multi-sets without restating.
- **Existence vs construction**: pigeonhole proves SOMETHING exists. Finding it may still cost time.
- **Misapplying probabilities**: pigeonhole is a deterministic worst-case argument, not a probabilistic one.

## interviewTips
- For "prove there must exist..." → think pigeonhole first.
- For Floyd's cycle: the slow/fast meet is a pigeonhole argument on (pos, residue).
- For "longest subsequence with property X": often Erdős-Szekeres applies.

## code.python
```python
def find_subarray_div_by_n(a):
    n = len(a); pref = {0: -1}; s = 0
    for i, x in enumerate(a):
        s = (s + x) % n
        if s in pref: return (pref[s] + 1, i)
        pref[s] = i
    return None
print(find_subarray_div_by_n([3, 1, 4, 1, 5]))  # some (l, r) with sum % 5 == 0
```

## code.javascript
```javascript
function subarrayDivByN(a) {
  const n = a.length, pref = new Map([[0, -1]]);
  let s = 0;
  for (let i = 0; i < n; i++) {
    s = ((s + a[i]) % n + n) % n;
    if (pref.has(s)) return [pref.get(s) + 1, i];
    pref.set(s, i);
  }
  return null;
}
```

## code.java
```java
import java.util.*;
class Pigeonhole {
    static int[] subarrayDivByN(int[] a) {
        int n = a.length;
        Map<Integer, Integer> pref = new HashMap<>();
        pref.put(0, -1);
        int s = 0;
        for (int i = 0; i < n; i++) {
            s = ((s + a[i]) % n + n) % n;
            if (pref.containsKey(s)) return new int[]{pref.get(s) + 1, i};
            pref.put(s, i);
        }
        return null;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <vector>
std::pair<int,int> subarray_div_by_n(std::vector<int>& a) {
    int n = a.size(), s = 0;
    std::unordered_map<int, int> pref{{0, -1}};
    for (int i = 0; i < n; ++i) {
        s = ((s + a[i]) % n + n) % n;
        if (pref.count(s)) return {pref[s] + 1, i};
        pref[s] = i;
    }
    return {-1, -1};
}
```
