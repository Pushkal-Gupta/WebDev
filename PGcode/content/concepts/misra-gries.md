---
slug: misra-gries
module: hashing
title: Misra-Gries (Heavy Hitters)
subtitle: Find all items appearing more than n/k times in O(n) with O(k) memory — generalisation of Boyer-Moore majority.
difficulty: Advanced
position: 18
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 11: Hash Tables (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap11/"
    type: book
  - title: "cp-algorithms — String hashing & hash maps"
    url: "https://cp-algorithms.com/string/string-hashing.html"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/hashing/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/hashing"
    type: repo
status: published
---

## intro
**Misra-Gries** is the k-way generalisation of the Boyer-Moore majority algorithm. Given a stream of items and an integer k, it identifies up to k-1 candidates that *might* appear more than n/k times — using only O(k) memory. A second pass verifies counts. Foundational for streaming algorithms and one-pass heavy-hitter detection.

## whyItMatters
"Frequent items in a giant stream with bounded memory" is everywhere:
- **Network traffic analysis** (top talkers).
- **Database query log analytics** (most-frequent queries).
- **Recommender system trending items**.
- **DDoS detection** (IPs sending too many requests).
- **Boyer-Moore extension** for "find all elements appearing > n/3 times" (LeetCode 229).

The streaming bound is the magic: O(k) memory regardless of stream length.

## intuition
Maintain at most k-1 (key, count) pairs. For each new item:
1. If item matches an existing key → increment its count.
2. Else if there's a free slot → add (item, 1).
3. Else (all k-1 slots full and none match) → decrement EVERY count by 1; drop any that hit zero.

The intuition is "pairwise cancellation generalized to k-way": each cancellation involves k items, so any item that appears more than n/k times must survive the cancellations.

## visualization
```
k = 3 (find candidates for "appears more than n/3 times")
Stream: [1, 2, 1, 3, 1, 4, 2, 1, 5, 1]

Slots: { } (at most k-1 = 2 entries)

1 → add (1, 1)            slots = { 1:1 }
2 → add (2, 1)            slots = { 1:1, 2:1 }
1 → increment 1           slots = { 1:2, 2:1 }
3 → all slots full, no match → decrement all → drop zeros
                          slots = { 1:1 }
1 → increment 1           slots = { 1:2 }
4 → add 4                 slots = { 1:2, 4:1 }
2 → all slots full, no match → decrement all
                          slots = { 1:1 }
1 → increment             slots = { 1:2 }
5 → add 5                 slots = { 1:2, 5:1 }
1 → increment             slots = { 1:3, 5:1 }

End: candidates = {1, 5}. Verify in a 2nd pass.
```

## bruteForce
Hash-map counter: O(n) time, O(distinct) memory. Fine when memory is unbounded; loses the streaming bound. For n = 10^9 with millions of distinct items, the hash map doesn't fit.

## optimal
```
def misra_gries(stream, k):
    slots = {}
    for x in stream:
        if x in slots:
            slots[x] += 1
        elif len(slots) < k - 1:
            slots[x] = 1
        else:
            # Decrement everyone.
            to_remove = []
            for key in slots:
                slots[key] -= 1
                if slots[key] == 0: to_remove.append(key)
            for key in to_remove: del slots[key]
    # Second pass: verify true counts.
    counts = { key: 0 for key in slots }
    for x in stream:
        if x in counts: counts[x] += 1
    return { k: v for k, v in counts.items() if v > len(stream) // k }
```

The verification pass is necessary: Misra-Gries returns *candidates*, not guarantees. A candidate may have appeared fewer than n/k times. The second pass filters out false positives.

For the streaming model (one pass only), you can't fully verify — return the candidates and live with the false positives.

## complexity
- **Time**: O(n) (each decrement step is amortized O(1)).
- **Space**: O(k).
- **Pass count**: 2 (one for candidates, one for verification). 1 for the streaming-only variant.
- **Generality**: k = 2 gives Boyer-Moore majority. k = 3 gives "appears more than n/3 times" (at most 2 such elements).

## pitfalls
- **No second pass = false positives possible**: streaming-only Misra-Gries returns *candidates*; only the second pass verifies. If you can't make a second pass, accept the looser guarantee.
- **k − 1 vs k slots**: it's k − 1 slots, NOT k. Off-by-one trap.
- **Boyer-Moore special case**: with k = 2 you only need 1 slot, NOT 1 slot + count. Pay attention when generalizing.
- **Different problem from Count-Min Sketch**: Misra-Gries finds heavy hitters; Count-Min Sketch estimates count of any specific key. Use the right tool.

## interviewTips
- The trigger: "find all elements appearing more than n/k times" or "frequent items in a stream with bounded memory."
- Show k = 2 (Boyer-Moore) as the warm-up; then generalize.
- Mention the **second pass for verification** — interviewers want to see you know about false positives.
- Compare with **Count-Min Sketch** (estimates counts for ALL elements, not just heavy hitters) and **Space-Saving** algorithm (similar bound, replaces minimum slot on overflow).

## code.python
```python
def misra_gries(stream, k):
    slots = {}
    for x in stream:
        if x in slots: slots[x] += 1
        elif len(slots) < k - 1: slots[x] = 1
        else:
            for key in list(slots):
                slots[key] -= 1
                if slots[key] == 0: del slots[key]
    counts = { key: 0 for key in slots }
    for x in stream:
        if x in counts: counts[x] += 1
    return { key: c for key, c in counts.items() if c > len(stream) // k }

print(misra_gries([1, 2, 1, 3, 1, 4, 2, 1, 5, 1], 3))    # {1: 5}
```

## code.javascript
```javascript
function misraGries(stream, k) {
  const slots = new Map();
  for (const x of stream) {
    if (slots.has(x)) slots.set(x, slots.get(x) + 1);
    else if (slots.size < k - 1) slots.set(x, 1);
    else {
      for (const [key, val] of slots) {
        slots.set(key, val - 1);
        if (val - 1 === 0) slots.delete(key);
      }
    }
  }
  const counts = new Map();
  for (const key of slots.keys()) counts.set(key, 0);
  for (const x of stream) if (counts.has(x)) counts.set(x, counts.get(x) + 1);
  const result = {};
  for (const [key, c] of counts) if (c > stream.length / k) result[key] = c;
  return result;
}
```

## code.java
```java
import java.util.*;
class MisraGries {
    public Map<Integer, Integer> heavyHitters(int[] stream, int k) {
        Map<Integer, Integer> slots = new HashMap<>();
        for (int x : stream) {
            if (slots.containsKey(x)) slots.merge(x, 1, Integer::sum);
            else if (slots.size() < k - 1) slots.put(x, 1);
            else {
                Iterator<Map.Entry<Integer, Integer>> it = slots.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<Integer, Integer> e = it.next();
                    if (e.getValue() == 1) it.remove(); else e.setValue(e.getValue() - 1);
                }
            }
        }
        Map<Integer, Integer> counts = new HashMap<>();
        for (int key : slots.keySet()) counts.put(key, 0);
        for (int x : stream) if (counts.containsKey(x)) counts.merge(x, 1, Integer::sum);
        Map<Integer, Integer> result = new HashMap<>();
        for (Map.Entry<Integer, Integer> e : counts.entrySet())
            if (e.getValue() > stream.length / k) result.put(e.getKey(), e.getValue());
        return result;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <unordered_map>
std::unordered_map<int, int> misraGries(const std::vector<int>& stream, int k) {
    std::unordered_map<int, int> slots;
    for (int x : stream) {
        if (slots.count(x)) slots[x]++;
        else if ((int) slots.size() < k - 1) slots[x] = 1;
        else {
            for (auto it = slots.begin(); it != slots.end(); ) {
                if (--it->second == 0) it = slots.erase(it);
                else ++it;
            }
        }
    }
    std::unordered_map<int, int> counts;
    for (auto& [key, _] : slots) counts[key] = 0;
    for (int x : stream) if (counts.count(x)) counts[x]++;
    std::unordered_map<int, int> result;
    for (auto& [key, c] : counts) if (c > (int) stream.size() / k) result[key] = c;
    return result;
}
```
