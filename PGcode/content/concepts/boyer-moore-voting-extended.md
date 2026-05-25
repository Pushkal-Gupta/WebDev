---
slug: boyer-moore-voting-extended
module: arrays-counting-select
title: Boyer-Moore Voting — Extended to n/k
subtitle: Generalize majority-vote to find all elements appearing more than n/k times in O(n) time, O(k) space.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Searching (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/30searching/"
    type: book
  - title: "Majority Element II — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/given-an-array-of-of-size-n-finds-all-the-elements-that-appear-more-than-nk-times/"
    type: blog
  - title: "TheAlgorithms/Python — majority_voting_algorithm.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/other/majority_voting_algorithm.py"
    type: repo
status: published
---

## intro
The classic Boyer-Moore voting algorithm finds an element appearing strictly more than n/2 times using a single counter. The generalization: at most `k - 1` elements can appear strictly more than n/k times, and you can find them all in O(n·k) time and O(k) extra space by running `k - 1` counters simultaneously. For the common k=3 case, exactly two counters are enough.

## whyItMatters
- **Network traffic analysis** (Misra-Gries 1982, originally Boyer-Moore 1981): identify heavy hitters in IP flows on backbone routers under tight memory constraints — implementations in Cisco's NetFlow, Snort IDS, and Linux `nftables` rate-limiting.
- **Database query optimisers** (PostgreSQL, MySQL): build column histograms tracking the most-common values via streaming heavy-hitters algorithms; the Misra-Gries generalisation of Boyer-Moore is the textbook approach.
- **Distributed counting** in Spark, Flink, and Dataflow uses the same n/k-majority sketch for approximate top-k aggregation over streams that exceed memory.
- **Apache DataSketches** and Yahoo's streaming-quantiles libraries ship Misra-Gries / Boyer-Moore generalisations alongside Count-Min sketches as their canonical heavy-hitters primitive.
- **Adversarial input streaming**: the algorithm gives exact answers (with a verification pass) where probabilistic sketches give only approximations — important when correctness matters more than memory.
- It is the cleanest "constant extra state, exact answer" pattern in streaming, which is why interviewers love it.

## intuition
The algorithm exists because a naïve hash-count over the stream uses O(n) memory in the worst case — fine in a 1 GB process, untenable on a 10 Gbit/s router. The escape route is a pigeonhole argument: if more than k − 1 distinct elements each appeared more than n/k times, their combined count would exceed n, which is impossible. So at most k − 1 elements can be >n/k majorities; we only need k − 1 candidate slots, regardless of n.

Maintain k − 1 (candidate, count) slots. For each new value, one of three things happens. (1) The value matches a slot: increment that slot's count. (2) The value doesn't match but a free slot exists: seat it with count 1. (3) The value doesn't match and all slots are occupied: decrement every count by 1, removing any slot whose count hits 0. This third step — the "cancellation round" — is the core insight: we are pairing the new value with one element from each occupied slot and discarding all k of them together. The accounting is symmetric and total cancellations are bounded by n/k, since each round consumes k distinct values.

The correctness argument: any true >n/k majority survives more increments than it can lose to cancellations. Concretely, if value v appears more than n/k times, at most n/k cancellation rounds can occur in total (each consumes k values), so v experiences at most n/k decrements; but v experiences more than n/k increments by assumption, so its slot can never be empty after a step that consumed v. The verification pass is necessary because the algorithm produces *candidates*: when no true majority exists, slots still fill up with arbitrary values. Pass 2 recounts each candidate's actual frequency and filters out false positives. Total: O(n·k) time, O(k) memory, exact answer in two streaming passes.

## visualization
For k=3 with `[1,1,1,3,3,2,2,2]` we keep two slots. Stream:
1 → slot A=(1,1); 1 → (1,2); 1 → (1,3); 3 → slot B=(3,1); 3 → (3,2); 2 → no slot, both A and B counts > 0 → decrement → A=(1,2), B=(3,1); 2 → again decrement → A=(1,1), B=(3,0) drop; 2 → fill B=(2,1). Candidates: {1, 2}. Verify pass: count(1)=3 > 8/3, count(2)=3 > 8/3 — both confirmed.

## bruteForce
Hash-map every element to its frequency, then return all keys with count > n/k. O(n) time but O(n) space — fine in most settings, but it loses the streaming property the generalization is specifically prized for.

## optimal
**Technique: Misra-Gries / Boyer-Moore n/k-majority candidate-selection + verification.** Two streaming passes, O(n·k) total time, O(k) extra memory. Information-theoretically optimal for the exact-heavy-hitters problem: any algorithm must touch every element at least once (Ω(n)) and must track up to k − 1 distinct candidates simultaneously (Ω(k) memory).

```python
def majority_n_over_k(nums, k):
    counts = {}
    # Pass 1: candidate selection (Misra-Gries)
    for x in nums:
        if x in counts:
            counts[x] += 1                              # match: increment
        elif len(counts) < k - 1:
            counts[x] = 1                               # seat in free slot
        else:                                            # cancellation round
            for key in list(counts):
                counts[key] -= 1
                if counts[key] == 0:
                    del counts[key]
    # Pass 2: verify candidates by exact recount
    threshold = len(nums) // k
    return [c for c in counts if nums.count(c) > threshold]
```

Key lines: the three-branch `if/elif/else` is the entire Misra-Gries update rule — match-and-increment, seat-in-free-slot, or cancel-one-from-each-slot. The cancellation round (the `else` branch) is what bounds memory to k − 1 slots regardless of stream length. The verification pass (`nums.count(c) > threshold`) is non-negotiable: candidates from pass 1 are merely *possible* majorities; without recounting, you can return false positives when no true majority exists.

For k = 2 (classic Boyer-Moore majority), the inner cancellation work is O(1) and the whole algorithm collapses to a single counter:

```python
candidate, count = None, 0
for x in nums:
    if count == 0: candidate = x
    count += 1 if x == candidate else -1
```

**Why not hash-map frequency count?** O(n) memory in the worst case, useless on streaming workloads with billions of elements where memory is the binding constraint. **Why not Count-Min Sketch?** Count-Min gives *approximate* frequencies with bounded error; Misra-Gries gives *exact* answers for >n/k elements but no information about smaller frequencies. Pick by what the problem values. **Why not sort-then-count?** Θ(n log n) time and Θ(n) memory — slower and bigger than Misra-Gries on every axis. **Common bug**: using `≥ n/k` instead of `> n/k` violates the strict-majority requirement; the problem specifies strict inequality and the algorithm's pigeonhole argument requires it.

## complexity
time: O(n·k) — two passes; the inner work per element is O(k) for the match/seat/decrement.
space: O(k)
notes: For k=2 the inner work is O(1) and this collapses to the classic single-counter majority vote. The verification pass is non-negotiable — without it, candidates are merely *possible* majorities.

## pitfalls
- Skipping the verification pass: candidates can be false positives when no true majority exists.
- Using `≥ n/k` instead of `> n/k` — the problem wants *strict* majority.
- Incrementing a slot whose count is 0 instead of seating the new value first — these two cases must be ordered correctly.
- Decrementing only one slot during a cancellation round — must hit *all* k-1 slots to preserve invariants.

## interviewTips
- Open with the pigeonhole bound: "At most k-1 such elements exist." It instantly justifies why k-1 counters suffice.
- Mention the streaming use case unprompted — it's the reason this algorithm exists.
- For k=3 you can hardcode two named counters; that's almost always what the interviewer is testing.

## code.python
```python
def majority_n_over_k(nums, k):
    counts = {}
    for x in nums:
        if x in counts:
            counts[x] += 1
        elif len(counts) < k - 1:
            counts[x] = 1
        else:
            for key in list(counts):
                counts[key] -= 1
                if counts[key] == 0:
                    del counts[key]
    threshold = len(nums) // k
    return [c for c in counts if nums.count(c) > threshold]
```

## code.javascript
```javascript
function majorityNOverK(nums, k) {
  const counts = new Map();
  for (const x of nums) {
    if (counts.has(x)) counts.set(x, counts.get(x) + 1);
    else if (counts.size < k - 1) counts.set(x, 1);
    else {
      for (const key of [...counts.keys()]) {
        counts.set(key, counts.get(key) - 1);
        if (counts.get(key) === 0) counts.delete(key);
      }
    }
  }
  const threshold = Math.floor(nums.length / k);
  const out = [];
  for (const c of counts.keys()) {
    const actual = nums.reduce((s, v) => s + (v === c ? 1 : 0), 0);
    if (actual > threshold) out.push(c);
  }
  return out;
}
```

## code.java
```java
public java.util.List<Integer> majorityNOverK(int[] nums, int k) {
    java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();
    for (int x : nums) {
        if (counts.containsKey(x)) counts.merge(x, 1, Integer::sum);
        else if (counts.size() < k - 1) counts.put(x, 1);
        else {
            java.util.Iterator<java.util.Map.Entry<Integer, Integer>> it = counts.entrySet().iterator();
            while (it.hasNext()) {
                var e = it.next();
                e.setValue(e.getValue() - 1);
                if (e.getValue() == 0) it.remove();
            }
        }
    }
    int threshold = nums.length / k;
    java.util.List<Integer> out = new java.util.ArrayList<>();
    for (int cand : counts.keySet()) {
        int actual = 0;
        for (int v : nums) if (v == cand) actual++;
        if (actual > threshold) out.add(cand);
    }
    return out;
}
```

## code.cpp
```cpp
vector<int> majorityNOverK(vector<int>& nums, int k) {
    unordered_map<int,int> counts;
    for (int x : nums) {
        if (counts.count(x)) counts[x]++;
        else if ((int)counts.size() < k - 1) counts[x] = 1;
        else {
            for (auto it = counts.begin(); it != counts.end(); ) {
                if (--it->second == 0) it = counts.erase(it);
                else ++it;
            }
        }
    }
    int threshold = (int)nums.size() / k;
    vector<int> out;
    for (auto& [cand, _] : counts) {
        int actual = 0;
        for (int v : nums) if (v == cand) actual++;
        if (actual > threshold) out.push_back(cand);
    }
    return out;
}
```
