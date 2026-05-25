---
slug: dp-job-scheduling
module: dp-classical
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
- Google Calendar's meeting-suggestion API and Microsoft Outlook's FindTime feature pick the optimal non-overlapping meeting set across attendees using weighted-job-scheduling DP.
- Real-time bidding ad exchanges (Google AdX, OpenX) select winning ad slots from overlapping inventory using exactly this DP — value-weighted intervals with a non-overlap constraint.
- Cloud spot-instance schedulers (AWS Spot Fleet, GCP preemptible scheduler) pack job submissions into preemption windows by maximizing total job value subject to non-overlap.
- Conference and tournament organizers (US Open scheduling, NFL TV-slot allocation) maximize ad-revenue weight subject to no-room/no-channel overlap with the same DP.
- The canonical "interval DP" pattern in a real-world disguise — the same skeleton solves longest non-overlapping path, stock-trading-with-cooldown, and many "pick the best non-conflicting set" problems.

## intuition
The unweighted activity-selection problem has a famous greedy solution: sort by end time, then greedily pick every job whose start is at or after the last chosen end. The proof is exchange-argument-based and tight. Adding weights breaks that greedy proof — picking a high-profit job might block several smaller jobs whose combined profit exceeds it, but the greedy has no way to look ahead. The DP fix: keep the "sort by end time" preprocessing because it gives a clean linear order, but at each job decide between "skip it" (carry the best answer from the previous job) and "take it" (add this job's profit to the best answer up to the last job that ended before this one started). Formally, define `dp[i]` as the maximum profit using any subset of jobs `1..i` (sorted by end). Recurrence: `dp[i] = max(dp[i-1], profit[i] + dp[p(i)])` where `p(i)` is the index of the latest job whose end time is at most `start[i]`. Computing `p(i)` naively scans backward in O(n), making the total O(n^2). The breakthrough is using binary search on the sorted ends array — `p(i)` is the largest index with `end[j] <= start[i]`, which is `upper_bound(ends, start[i]) - 1`. Each `p(i)` becomes O(log n), bringing the total to O(n log n). The deep insight is that DP often pays for the breakdown of greedy by adding back a "look back at all earlier compatible options" step, and a sorted-by-key data structure (here, sorted by end time) combined with binary search makes that lookback cheap. The same skeleton applies to weighted longest-increasing-subsequence on intervals and to many "best sequence under non-overlap" problems.

## visualization
Jobs (start, end, profit): A(1,3,5), B(2,5,6), C(4,6,5), D(6,7,4), E(5,8,11). Sort by end: A(end 3), B(end 5), C(end 6), D(end 7), E(end 8). dp[A] = 5. dp[B] = max(5, 6 + dp[none]) = 6. dp[C] = max(6, 5 + dp[A]) = 10. dp[D] = max(10, 4 + dp[C]) = 14. dp[E] = max(14, 11 + dp[B]) = 17. Answer 17 = E + B + A. The binary search for "last compatible" jumps directly to the right predecessor without scanning.

## bruteForce
For each job decide take/skip, exploring 2^n subsets and discarding any that overlap. O(2^n) — fine up to n = 20 with bitmask iteration, hopeless beyond. A cleaner recursion memoises on the sorted index: solve(i) = max(solve(i-1), profit[i] + solve(p(i))). Without binary search, finding p(i) is O(n) per call, giving O(n^2) overall — already a meaningful speedup, but still not optimal.

## optimal
Sort jobs by end time, then run a 1D DP with binary-search predecessor lookup. For each i, compute `p(i)` = largest index with `end[j] <= start[i]` via `upper_bound(ends, start[i]) - 1` (O(log n)). Fill `dp[i] = max(dp[i-1], profit[i] + (p(i) >= 0 ? dp[p(i)] : 0))`. Total time is O(n log n) — n log n for the sort, n log n for the binary searches, n for the DP transitions. Space is O(n). This is optimal for general weighted interval scheduling — beating O(n log n) requires special structure (small integer end times allow O(n + max_end) with a prefix-max array).

```python
from bisect import bisect_right

def max_profit(jobs):
    # Sort by end time so dp[i-1] always reflects "best using earlier-ending jobs".
    jobs = sorted(jobs, key=lambda j: j[1])
    ends = [j[1] for j in jobs]
    n = len(jobs)
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        start, end, profit = jobs[i - 1]
        # p = index of the latest job whose end is <= this job's start.
        p = bisect_right(ends, start) - 1
        take = profit + (dp[p + 1] if p >= 0 else 0)
        # Either skip job i (carry dp[i-1]) or take it (add to best up to p).
        dp[i] = max(dp[i - 1], take)
    return dp[n]
```

The `sort by end time` step is the watershed move — it transforms an O(n^2) DP into O(n log n) by enabling binary search. The `bisect_right(ends, start) - 1` finds the largest predecessor; using `bisect_left` would miss compatible jobs whose end equals the start (depends on whether the problem treats "ends at 5, starts at 5" as overlapping). To reconstruct the selected schedule, store a parallel `choice[i]` array recording whether job i was taken, then walk back from i = n.

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
