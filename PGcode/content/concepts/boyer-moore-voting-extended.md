---
slug: boyer-moore-voting-extended
module: arrays-searching
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
n/k majority queries appear inside frequent-itemset mining, network packet sampling, and database histograms where you can only afford a single streaming pass. The technique is the cleanest example of "constant extra state, exact answer" for streaming — a category interviewers love because it forces you to defend correctness without storing the input.

## intuition
A pigeonhole argument: if more than k - 1 elements each appeared more than n/k times, their total count would exceed n. So there are at most k - 1 candidates. Maintain k - 1 (candidate, count) slots. For each new value: if it matches a slot, increment that slot's count. Else if a free slot exists, use it. Else decrement every count by one (a "cancellation round") — this discards `k` distinct elements together and cannot harm any true >n/k majority, because each majority survives more cancellations than it can lose.

## visualization
For k=3 with `[1,1,1,3,3,2,2,2]` we keep two slots. Stream:
1 → slot A=(1,1); 1 → (1,2); 1 → (1,3); 3 → slot B=(3,1); 3 → (3,2); 2 → no slot, both A and B counts > 0 → decrement → A=(1,2), B=(3,1); 2 → again decrement → A=(1,1), B=(3,0) drop; 2 → fill B=(2,1). Candidates: {1, 2}. Verify pass: count(1)=3 > 8/3, count(2)=3 > 8/3 — both confirmed.

## bruteForce
Hash-map every element to its frequency, then return all keys with count > n/k. O(n) time but O(n) space — fine in most settings, but it loses the streaming property the generalization is specifically prized for.

## optimal
Pass 1 (candidate selection): maintain k - 1 (candidate, count) pairs. For each value: match → increment; empty slot → seat; else decrement all. Pass 2 (verification): for each surviving candidate, recount actual occurrences in the array and report those exceeding n/k. Both passes are O(n·k); for fixed k (almost always k=3), this is linear. Memory is O(k).

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
