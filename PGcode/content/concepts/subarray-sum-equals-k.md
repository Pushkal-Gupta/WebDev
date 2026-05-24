---
slug: subarray-sum-equals-k
module: hashing
title: Subarray Sum Equals K
subtitle: Count contiguous subarrays summing to K using prefix sums and a hashmap of seen counts.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Subarray Sum Equals K — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/number-subarrays-sum-exactly-equal-k/"
    type: blog
  - title: "Prefix Sums — cp-algorithms"
    url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html"
    type: blog
  - title: "TheAlgorithms/Python — prefix_sum.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/prefix_sum.py"
    type: repo
status: published
---

## intro
Given an integer array and a target K, count how many contiguous subarrays sum to exactly K. The array may contain negatives, so sliding-window shortcuts fail. The clean answer combines a running prefix sum with a hashmap that records how often each prefix value has been seen.

## whyItMatters
Subarray-sum questions are interview staples because they expose whether a candidate reaches for the prefix-sum + hashmap pattern. The same trick generalizes to "subarray divisible by K," "binary subarrays with sum K," and "longest subarray with sum K" — all single-pass solutions that would otherwise be cubic.

## intuition
If `prefix[j] - prefix[i] == K`, the subarray from index `i+1` to `j` sums to K. Rearranging, `prefix[i] == prefix[j] - K`. So as we walk the array maintaining a running prefix sum, at each step we ask "how many earlier prefixes equal `prefix - K`?" — and a hashmap answers in O(1).

## visualization
Take `nums = [1, 2, 3]`, K = 3. Prefixes: 0, 1, 3, 6. At index 1 (prefix=3) we need a previous prefix of 0 — found once (the empty prefix). At index 2 (prefix=6) we need 3 — found once. Total = 2 subarrays: `[1,2]` and `[3]`. The hashmap evolves as `{0:1} -> {0:1,1:1} -> {0:1,1:1,3:1} -> {0:1,1:1,3:1,6:1}`.

## bruteForce
Two nested loops: fix every start `i`, accumulate sums for each end `j >= i`, and increment the counter whenever the running sum equals K. O(n^2) time, O(1) extra space. Easy to reason about but quadratic — fine for n up to a few thousand, dead on the wall for n = 10^5.

## optimal
Maintain `prefix = 0` and `seen = {0: 1}` (the empty prefix). For each number, add it to `prefix`, then add `seen.get(prefix - K, 0)` to the answer, then increment `seen[prefix]`. Seeding with `{0:1}` correctly counts subarrays that start at index 0. One pass, constant work per element.

## complexity
time: O(n)
space: O(n)
notes: The hashmap can hold up to n distinct prefix values in the worst case. Hash operations are amortized O(1); a degenerate hash could push this to O(n) per op, but Python/Java/C++ standard hashes are well-behaved on integer keys.

## pitfalls
- Forgetting to seed the map with `{0: 1}` — subarrays starting at index 0 get missed.
- Updating `seen[prefix]` *before* querying `seen[prefix - K]` when K == 0 — double-counts the empty subarray.
- Assuming sliding window works: it only works for all-positive arrays, because shrinking from the left requires monotone sums.
- Returning the longest such subarray instead of the count — re-read the prompt; both variants exist.

## interviewTips
- Lead with the prefix-sum identity `prefix[j] - prefix[i] == K`. Most of the solution falls out from there.
- Mention the `{0:1}` seed explicitly — interviewers watch for it.
- Flag the negative-numbers edge case early; it kills the obvious sliding-window attempt.

## code.python
```python
def subarray_sum(nums, k):
    seen = {0: 1}
    prefix = 0
    count = 0
    for x in nums:
        prefix += x
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count
```

## code.javascript
```javascript
function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let prefix = 0, count = 0;
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) || 0;
    seen.set(prefix, (seen.get(prefix) || 0) + 1);
  }
  return count;
}
```

## code.java
```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1);
    int prefix = 0, count = 0;
    for (int x : nums) {
        prefix += x;
        count += seen.getOrDefault(prefix - k, 0);
        seen.merge(prefix, 1, Integer::sum);
    }
    return count;
}
```

## code.cpp
```cpp
int subarraySum(vector<int>& nums, int k) {
    unordered_map<int, int> seen;
    seen[0] = 1;
    int prefix = 0, count = 0;
    for (int x : nums) {
        prefix += x;
        auto it = seen.find(prefix - k);
        if (it != seen.end()) count += it->second;
        seen[prefix]++;
    }
    return count;
}
```
