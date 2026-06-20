---
slug: dp-longest-arithmetic-seq
module: dp-classical
title: Longest Arithmetic Subsequence
subtitle: Per-element hashmap keyed by common difference — O(n^2) DP for arbitrary AP lengths.
difficulty: Advanced
position: 27
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Longest Increasing Subsequence — cp-algorithms"
    url: "https://cp-algorithms.com/sequences/longest_increasing_subsequence.html"
    type: blog
  - title: "Longest Arithmetic Subsequence — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/longest-arithmetic-progression-dp-35/"
    type: blog
  - title: "TheAlgorithms/Python — longest_increasing_subsequence.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/longest_increasing_subsequence.py"
    type: repo
status: published
---

## intro
Given an array, find the length of the longest subsequence whose consecutive elements share a constant difference. Unlike Longest Increasing Subsequence, the constraint here is "constant gap" rather than "monotonic". The natural DP keys state on (end index, common difference): dp[i][d] = longest AP subsequence ending at index i with common difference d.

## whyItMatters
- Financial time-series anomaly detection (used by Bloomberg's analytics and Two Sigma's research pipelines) searches for long arithmetic runs in price-difference series as a signature of programmatic trading.
- Network traffic analysis tools (Wireshark plugins, Zeek/Bro analyzers) flag suspiciously regular packet intervals — longest arithmetic subsequence on inter-arrival times catches beaconing C2 malware.
- Music transcription algorithms in MuseScore and SonicVisualiser use longest-arithmetic-subsequence on onset times to detect steady rhythmic patterns inside noisy audio.
- One of the cleanest demonstrations of "DP with a hashmap per element" — the second state dimension (common difference) is unbounded, so each index gets its own dict rather than a fixed-size array.
- The pattern recurs in any DP where the secondary state is a derived value, not an integer position: hash-keyed DP shows up in subset-sum-mod-k, palindrome partitioning by pattern, and the algebraic-structure side of competitive programming.

## intuition
A regular DP indexed by position alone is too coarse — we need to know not just where the AP ends but also what the common difference is, because two APs ending at the same index with different differences are completely different objects and cannot merge. So the state must be `(end_index, common_difference)`. The challenge is that common differences are not bounded — they can be negative, zero, or arbitrarily large. A fixed-size 2D array would need to allocate space for every possible difference, which is hopeless. The fix is a hashmap per index: `dp[i]` is a dict mapping difference d to "longest AP ending at index i with common difference d." With this design, the recurrence is trivial. Fix endpoint i; for every j < i, the difference `d = nums[i] - nums[j]` is uniquely determined by the pair. If `dp[j]` already contains an entry for d (meaning some AP ending at j with difference d exists with length L), then extending it to i produces an AP of length L + 1. Otherwise, the pair (j, i) starts a fresh 2-element AP, so the default is `1 + 1 = 2`. The `+1` accounts for adding `nums[i]` to whatever AP ended at j; the default of 1 represents the trivial single-element AP at j. Iterating all O(n^2) pairs fills every `dp[i][d]` in constant work per pair, with a running global maximum tracking the answer. The deep skill is recognizing that DP state can be keyed by derived values (differences here, gcd elsewhere, hash signatures in string DPs) — a hashmap per element makes the impossible polynomial.

## visualization
nums = [3, 6, 9, 12]. i=0: dp[0] = {}. i=1, j=0: d=3, dp[1][3] = 2. i=2, j=0: d=6, dp[2][6] = 2; j=1: d=3, dp[2][3] = dp[1][3] + 1 = 3. i=3, j=0: d=9, dp[3][9] = 2; j=1: d=6, dp[3][6] = dp[2][6] + 1 = 3 (no, dp[1][6] missing → 2); j=2: d=3, dp[3][3] = dp[2][3] + 1 = 4. Answer = 4.

## bruteForce
Generate every subsequence (2^n), check each for arithmetic property, track the longest. Dies above n = 20. Alternative: for each pair (i, j), greedily extend by binary-searching the next term — works but is O(n^2 · log n) and uses extra structures unnecessarily.

## optimal
Per-index hashmap DP, O(n^2) time and O(n^2) space. For each pair (j, i) with j < i, compute `d = nums[i] - nums[j]`, then set `dp[i][d] = dp[j].get(d, 1) + 1`. The `get(d, 1)` default represents the trivial single-element AP at j; the `+ 1` extends it by adding `nums[i]`. Track the running maximum over all `dp[i][d]` values. The bound is optimal in the standard DP sense: the answer depends on every pair, and there are Theta(n^2) pairs, so any algorithm faces an Omega(n^2) lower bound without exploiting additional input structure.

```python
def longest_arith_seq_length(nums):
    n = len(nums)
    if n <= 2:
        return n
    # dp[i] maps common-difference d to longest AP ending at i with diff d.
    dp = [dict() for _ in range(n)]
    best = 2
    for i in range(1, n):
        for j in range(i):
            d = nums[i] - nums[j]
            # Default 1 represents the single-element AP at j; +1 adds nums[i].
            dp[i][d] = dp[j].get(d, 1) + 1
            best = max(best, dp[i][d])
    return best
```

The `get(d, 1)` default is the load-bearing detail — defaulting to 0 would under-count by treating "no prior AP" as "AP of length zero" instead of the single-element AP at j. Using a hashmap per index (rather than one global dict) is essential because the second dimension must be qualified by the endpoint; a global `dict[d]` would over-merge APs from disconnected positions. Differences can be zero (constant sequences) or negative (decreasing APs), so test on `[9, 4, 7, 2, 10]` to catch sign-assumption bugs.

## complexity
time: O(n^2). Two nested loops over indices, each pair O(1) work.
space: O(n^2) in the worst case — every (i, d) pair stored.
notes: The constant difference d can be any integer; use a hashmap, not an array. For arrays with bounded values you could use a 2D array with d offset to be non-negative, but the hashmap version is more general and equally fast.

## pitfalls
- Using a single global dict from d to length — loses the "ending at index i" information and over-counts across disconnected APs.
- Forgetting the `+ 1` — the recurrence is `extend by one element`, not `same length as predecessor`.
- Initializing default to 0 instead of 1 — single-element APs have length 1, not 0.
- Assuming d > 0 — APs can be constant (d=0) or decreasing (d<0); test on [9, 4, 7, 2, 10] to catch bugs.

## interviewTips
- Open with the key choice: "Each (end index, difference) pair is a distinct DP state; differences are unbounded so I need a hashmap per index."
- Walk through the recurrence with [3, 6, 9, 12] — small enough to compute by hand, big enough to show the pattern.
- If asked to print the actual sequence, store a back-pointer per (i, d) entry; complexity stays O(n^2) but space doubles.

## code.python
```python
def longest_arith_seq_length(nums):
    n = len(nums)
    if n <= 2:
        return n
    dp = [dict() for _ in range(n)]
    best = 2
    for i in range(1, n):
        for j in range(i):
            d = nums[i] - nums[j]
            dp[i][d] = dp[j].get(d, 1) + 1
            best = max(best, dp[i][d])
    return best
```

## code.javascript
```javascript
function longestArithSeqLength(nums) {
  const n = nums.length;
  if (n <= 2) return n;
  const dp = Array.from({ length: n }, () => new Map());
  let best = 2;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const d = nums[i] - nums[j];
      const prev = dp[j].get(d) ?? 1;
      dp[i].set(d, prev + 1);
      best = Math.max(best, prev + 1);
    }
  }
  return best;
}
```

## code.java
```java
class Solution {
    public int longestArithSeqLength(int[] nums) {
        int n = nums.length;
        if (n <= 2) return n;
        Map<Integer, Integer>[] dp = new HashMap[n];
        for (int i = 0; i < n; i++) dp[i] = new HashMap<>();
        int best = 2;
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                int d = nums[i] - nums[j];
                int prev = dp[j].getOrDefault(d, 1);
                dp[i].put(d, prev + 1);
                best = Math.max(best, prev + 1);
            }
        }
        return best;
    }
}
```

## code.cpp
```cpp
class Solution {
public:
    int longestArithSeqLength(vector<int>& nums) {
        int n = nums.size();
        if (n <= 2) return n;
        vector<unordered_map<int,int>> dp(n);
        int best = 2;
        for (int i = 1; i < n; ++i) {
            for (int j = 0; j < i; ++j) {
                int d = nums[i] - nums[j];
                int prev = dp[j].count(d) ? dp[j][d] : 1;
                dp[i][d] = prev + 1;
                best = max(best, prev + 1);
            }
        }
        return best;
    }
};
```
