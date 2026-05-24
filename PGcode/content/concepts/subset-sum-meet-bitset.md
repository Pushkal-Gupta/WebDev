---
slug: subset-sum-meet-bitset
module: dp
title: Subset Sum via Bitset
subtitle: Decide if any subset sums to a target in O(n*W/64) using the shift-OR trick on a bitset.
difficulty: Advanced
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Competitive Programmer's Handbook — Subset Sum chapter (cp-algorithms)"
    url: "https://cp-algorithms.com/dynamic_programming/knapsack.html"
    type: blog
  - title: "Subset Sum Problem — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/subset-sum-problem-dp-25/"
    type: blog
  - title: "kactl — content/various (bitset techniques)"
    url: "https://github.com/kth-competitive-programming/kactl/tree/main/content/various"
    type: repo
status: published
---

## intro
Given n non-negative integers and a target W, decide whether some subset sums exactly to W. The textbook DP runs in O(n*W) time with a boolean array. Replacing that array with a bitset and the inner loop with a single shift-OR collapses the constant factor by a word size (64 on modern CPUs), giving O(n*W/64) — the difference between a 10-second TLE and a 0.15-second AC on contest sites.

## intuition
Let reachable be a bitset of W+1 bits where bit s is set iff some subset processed so far sums to s. Initially only bit 0 is set (empty subset). To add a new value v, every existing reachable sum s also becomes reachable as s+v. That is exactly `reachable |= (reachable << v)` — one CPU-level word-parallel operation per machine word in the bitset.

## visualization
nums = [3, 1, 4], W = 7. Start reachable = 00000001 (bit 0). After v=3: reachable |= reachable << 3 = 00001001 (sums 0, 3). After v=1: reachable |= reachable << 1 = 00011011 (sums 0, 1, 3, 4). After v=4: reachable |= reachable << 4 = 11111011 (sums 0, 1, 3, 4, 5, 7, plus what shifted in). Bit 7 is set, so target 7 is reachable.

## bruteForce
Recursive include/exclude: 2^n subsets. Memoizing on (index, remaining) brings it to O(n*W) calls — the classic DP. For W up to about 10^4 and n up to 10^3 this is fine; for W up to 10^5 or 10^6 the constant factor matters and the boolean array becomes the bottleneck.

## optimal
Maintain `reachable` as a bitset of W+1 bits initialized to 1 (only bit 0). For each value v, perform `reachable |= reachable << v` truncated to W+1 bits. After processing all values, bit W tells you the answer. Each shift-OR walks the bitset's words once, costing W/64 operations per value, so total time is O(n*W/64). Memory is O(W/8) bytes. To recover the subset itself, run the same DP but record which value first set each bit; backtrack from bit W.

## complexity
time: O(n * W / 64)
space: O(W / 64) machine words
notes: Languages without a built-in bitset can simulate with arrays of uint64; the shift-OR then needs a small inner loop to carry bits across word boundaries. Negative values require a coordinate shift (offset every value by the minimum) before the bitset DP applies.

## pitfalls
- Forgetting to truncate after the shift — `reachable << v` can grow past W+1 bits and report false positives in some languages.
- Using a vector of bool — that is *not* a bitset and gets no word-parallel speedup.
- Misordering when implementing manually with arrays — shifting in place requires processing from the high word down to avoid double-applying.
- Assuming the trick handles negative or fractional values — only non-negative integers fit on the bitset axis.

## interviewTips
- Mention the technique by name: "subset-sum bitset DP" — recruiters who recognize it move on quickly.
- Pair it with the meet-in-the-middle alternative for huge n and small individual values: split into halves, enumerate 2^(n/2) sums each, sort one side, binary search the other. O(2^(n/2) log) — different trade-off, useful when W is too large for a bitset.
- Note the memory ceiling: a bitset for W = 10^9 is 125 MB and won't fly; switch to meet-in-the-middle there.

## code.python
```python
def can_partition(nums, target):
    reachable = 1
    mask = (1 << (target + 1)) - 1
    for v in nums:
        reachable |= reachable << v
        reachable &= mask
    return (reachable >> target) & 1 == 1
```

## code.javascript
```javascript
function canPartition(nums, target) {
  let reachable = 1n;
  const mask = (1n << BigInt(target + 1)) - 1n;
  for (const v of nums) {
    reachable |= reachable << BigInt(v);
    reachable &= mask;
  }
  return ((reachable >> BigInt(target)) & 1n) === 1n;
}
```

## code.java
```java
public boolean canPartition(int[] nums, int target) {
    java.util.BitSet reachable = new java.util.BitSet(target + 1);
    reachable.set(0);
    for (int v : nums) {
        java.util.BitSet shifted = shiftLeft(reachable, v, target + 1);
        reachable.or(shifted);
    }
    return reachable.get(target);
}

private java.util.BitSet shiftLeft(java.util.BitSet bs, int v, int limit) {
    java.util.BitSet out = new java.util.BitSet(limit);
    for (int i = bs.nextSetBit(0); i >= 0 && i + v < limit; i = bs.nextSetBit(i + 1)) {
        out.set(i + v);
    }
    return out;
}
```

## code.cpp
```cpp
bool canPartition(vector<int>& nums, int target) {
    bitset<100001> reachable;
    reachable.set(0);
    for (int v : nums) {
        reachable |= (reachable << v);
    }
    return reachable.test(target);
}
```
