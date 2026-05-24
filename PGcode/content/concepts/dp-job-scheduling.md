---
slug: dp-job-scheduling
module: dp
title: Weighted Job Scheduling
subtitle: Pick the highest-value set of non-overlapping intervals via binary search + DP.
difficulty: Intermediate
position: 32
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Activity Selection vs Weighted Variant — walkccc.me/CLRS"
    url: "https://walkccc.me/CLRS/Chap16/16.1/"
    type: book
  - title: "Weighted Job Scheduling — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/weighted-job-scheduling/"
    type: blog
  - title: "TheAlgorithms/Python — weighted_job_scheduling.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/longest_increasing_subsequence.py"
    type: repo
status: published
---

## intro
Given n jobs each with a start time, end time, and profit, choose a subset of mutually non-overlapping jobs that maximises total profit. The unweighted version (maximise count) is the classic greedy "activity selection." Adding weights breaks the greedy proof — you have to think in DP. The standard solution sorts by end time and combines binary search with a 1D DP, achieving O(n log n).

## whyItMatters
This is the canonical "interval DP" pattern under a real-world disguise: meeting-room scheduling, ad slot auctions, CPU job allocation, conference-room booking. It also previews segment-tree DP and online interval-scheduling problems. The trick of "sort by end time, then for each item look back to the last compatible predecessor" recurs in longest non-overlapping path on intervals, paint-fence-with-constraints variants, and stock-trading-with-cooldown problems.

## intuition
Sort jobs by end time. For job i, you have a binary choice: skip it (carry dp[i-1]) or take it. Taking it means add profit[i] plus the best profit achievable from any job whose end <= start[i]. Because jobs are sorted by end, that "best earlier-compatible job index" can be found by binary searching for the largest j with end[j] <= start[i]. The DP is dp[i] = max(dp[i-1], profit[i] + dp[p(i)]) where p(i) is that index (or -1 if none).

## visualization
Jobs (start, end, profit): A(1,3,5), B(2,5,6), C(4,6,5), D(6,7,4), E(5,8,11). Sort by end: A(end 3), B(end 5), C(end 6), D(end 7), E(end 8). dp[A] = 5. dp[B] = max(5, 6 + dp[none]) = 6. dp[C] = max(6, 5 + dp[A]) = 10. dp[D] = max(10, 4 + dp[C]) = 14. dp[E] = max(14, 11 + dp[B]) = 17. Answer 17 = E + B + A. The binary search for "last compatible" jumps directly to the right predecessor without scanning.

## bruteForce
For each job decide take/skip, exploring 2^n subsets and discarding any that overlap. O(2^n) — fine up to n = 20 with bitmask iteration, hopeless beyond. A cleaner recursion memoises on the sorted index: solve(i) = max(solve(i-1), profit[i] + solve(p(i))). Without binary search, finding p(i) is O(n) per call, giving O(n^2) overall — already a meaningful speedup, but still not optimal.

## optimal
Sort jobs by end time. Precompute starts and ends arrays. For each i compute p(i) by binary searching ends for the largest value <= start[i]; this is O(log n) per job. Then a single forward pass fills dp[i] = max(dp[i-1], profit[i] + (p(i) >= 0 ? dp[p(i)] : 0)). To recover the chosen subset, store back-pointers: at index i record whether you took job i, then walk backwards. Total O(n log n).

## complexity
time: O(n log n) — sort + n binary searches + n DP transitions
space: O(n) for dp and back-pointer arrays
notes: If end times are small integers (<= 1e5), you can replace binary search with a prefix-max array indexed by end time and drop to O(n + max_end). With heavy duplicate end times, use upper_bound on the (end, index) pair to be deterministic.

## pitfalls
- Sorting by start time instead of end time — the DP transition then becomes O(n) per step.
- Using strict inequality where the problem allows end-touching-start adjacency (or vice versa). Read the prompt: "ends at 5, starts at 5" — overlapping or not?
- Off-by-one in the binary search: you want the largest index with end <= start, which is upper_bound - 1.
- Forgetting that dp[i] must include the carry dp[i-1]; without it you only compute "best subset that ends with job i," not the answer.
- Returning the dp value instead of the subset when the interviewer asks for the schedule itself.

## interviewTips
- Say "sort by end time" within the first 30 seconds. It is the watershed insight.
- Walk through one binary-search step on a small example to prove you do not confuse lower_bound and upper_bound.
- Mention the unweighted greedy variant — it is the natural follow-up "what changes if all profits are equal?"
- Be ready to extend to "schedule with k machines" (greedy + heap) and "weighted interval graph" (more general).

## code.python
```python
from bisect import bisect_right

def max_profit(jobs):
    jobs = sorted(jobs, key=lambda j: j[1])
    ends = [j[1] for j in jobs]
    n = len(jobs)
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        start, end, profit = jobs[i - 1]
        p = bisect_right(ends, start) - 1
        take = profit + (dp[p + 1] if p >= 0 else 0)
        dp[i] = max(dp[i - 1], take)
    return dp[n]
```

## code.javascript
```javascript
function maxProfit(jobs) {
  jobs = jobs.slice().sort((a, b) => a[1] - b[1]);
  const ends = jobs.map((j) => j[1]);
  const n = jobs.length;
  const dp = new Array(n + 1).fill(0);
  const upperBound = (arr, x) => {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= x) lo = mid + 1; else hi = mid;
    }
    return lo;
  };
  for (let i = 1; i <= n; i++) {
    const [start, , profit] = jobs[i - 1];
    const p = upperBound(ends, start) - 1;
    const take = profit + (p >= 0 ? dp[p + 1] : 0);
    dp[i] = Math.max(dp[i - 1], take);
  }
  return dp[n];
}
```

## code.java
```java
import java.util.Arrays;

public class WeightedJobScheduling {
    public int maxProfit(int[][] jobs) {
        Arrays.sort(jobs, (a, b) -> a[1] - b[1]);
        int n = jobs.length;
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) ends[i] = jobs[i][1];
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            int start = jobs[i - 1][0], profit = jobs[i - 1][2];
            int p = upperBound(ends, start) - 1;
            int take = profit + (p >= 0 ? dp[p + 1] : 0);
            dp[i] = Math.max(dp[i - 1], take);
        }
        return dp[n];
    }

    private int upperBound(int[] arr, int x) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] <= x) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>

int maxProfit(std::vector<std::vector<int>>& jobs) {
    std::sort(jobs.begin(), jobs.end(), [](auto& a, auto& b){ return a[1] < b[1]; });
    int n = jobs.size();
    std::vector<int> ends(n);
    for (int i = 0; i < n; i++) ends[i] = jobs[i][1];
    std::vector<int> dp(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        int start = jobs[i - 1][0], profit = jobs[i - 1][2];
        int p = std::upper_bound(ends.begin(), ends.end(), start) - ends.begin() - 1;
        int take = profit + (p >= 0 ? dp[p + 1] : 0);
        dp[i] = std::max(dp[i - 1], take);
    }
    return dp[n];
}
```
