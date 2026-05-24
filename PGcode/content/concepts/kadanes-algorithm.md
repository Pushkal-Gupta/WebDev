---
slug: kadanes-algorithm
module: dp
title: Kadane's Algorithm
subtitle: Maximum subarray sum in a single linear pass.
difficulty: Beginner
position: 1
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Chapter 14: Dynamic Programming (walkccc notes)"
    url: "https://walkccc.me/CLRS/Chap14/"
    type: book
  - title: "TopCoder — Dynamic Programming: From Novice to Advanced"
    url: "https://www.topcoder.com/thrive/articles/Dynamic%20Programming:%20From%20Novice%20to%20Advanced"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
Kadane's algorithm finds the contiguous subarray with the maximum sum in O(n) time and O(1) space. It's the gentlest possible introduction to dynamic programming — only one DP variable, no array, no recursion. Yet it captures the heart of DP: at every index, you make a local decision that uses the previous decision's answer.

## whyItMatters
"Max subarray sum" is the canonical warmup for DP problems and the building block for "max product subarray," "max subarray in a 2D grid (combined with prefix sums)," "max circular subarray," and many financial / signal-processing applications. Internalizing Kadane's makes every harder DP problem feel approachable, because the structure ("local choice + running best") repeats everywhere.

## intuition
At each index `i`, you face exactly one choice: extend the previous subarray, or start a fresh one at `i`. If the previous subarray's sum became negative, extending it would only drag you down — so abandon it and start fresh. Otherwise, keep extending. Track the best total seen so far alongside the running total.

Two values matter at every step:
1. `current` — the best subarray sum that **ends exactly at index i**.
2. `best` — the best subarray sum seen **anywhere** up to index i.

`current` is the DP state. The recurrence is `current = max(nums[i], current + nums[i])`. The `max` is doing two things at once: when `current + nums[i]` wins, we extend; when `nums[i]` wins, the old prefix was harmful so we restart. `best` is just a watcher — `best = max(best, current)`.

Why the restart works: any optimal subarray must end at *some* index, so by checking every "best ending at i" you cover the whole space.

## walkthroughExample
Run on `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]` (length 9). Initialize `current = best = nums[0] = -2`.

```
i   nums[i]   choice                       current   best   running subarray
--  -------   -------------------------    -------   ----   --------------------------
0      -2    init                              -2     -2    [-2]
1       1    max(1, -2+1=-1)  = 1  RESTART      1      1    [1]
2      -3    max(-3, 1+-3=-2) = -2 EXTEND      -2      1    [1, -3]
3       4    max(4, -2+4=2)   = 4  RESTART      4      4    [4]
4      -1    max(-1, 4+-1=3)  = 3  EXTEND       3      4    [4, -1]
5       2    max(2, 3+2=5)    = 5  EXTEND       5      5    [4, -1, 2]
6       1    max(1, 5+1=6)    = 6  EXTEND       6      6    [4, -1, 2, 1]
7      -5    max(-5, 6+-5=1)  = 1  EXTEND       1      6    [4, -1, 2, 1, -5]
8       4    max(4, 1+4=5)    = 5  EXTEND       5      6    [4, -1, 2, 1, -5, 4]
```

Answer: `best = 6`, attained at indices 3..6 — the subarray `[4, -1, 2, 1]`.

Note step i=3: `current` was -2 (negative), so the recurrence forces a restart — exactly what we want. Step i=7: `current` dropped from 6 to 1, but `best` correctly preserves the previous maximum.

## visualization
Visual stream of `current` and `best`:
```
   i  :   0    1    2    3    4    5    6    7    8
  nums:  -2    1   -3    4   -1    2    1   -5    4

  current
   6                                  +----+
   5                            +-----+    +----------+
   4                +----+      |               
   3                |    +------+               
   2                |                            
   1       +-+                                +-+
   0  -----+ +---+--+----+----+----+----+----+----+--->
  -1                |
  -2  -+        +--+
       |        |
  -3 ..|........|.......................................
       v        v
      i=0      i=2

  best (monotone non-decreasing):
   6  ...........................+========================
   5
   4  ..............+============+
   3
   2
   1  ......+======+
   0
  -1
  -2  ==+
       i=0  i=1  i=2  i=3  i=4  i=5  i=6  i=7  i=8
```

Restart vs extend markers (R = restart, E = extend):
```
   i  :   0    1    2    3    4    5    6    7    8
  flag:  --    R    E    R    E    E    E    E    E

   nums:  -2 [ 1 ] -3 [ 4   -1    2    1 ] -5    4
                          \_______________/
                          winning subarray
```

All-negative edge case — `nums = [-3, -1, -4, -2]`. `current` and `best` simply track the largest single element:
```
   i  :   0    1    2    3
  nums:  -3   -1   -4   -2
  cur :  -3   -1   -4   -2     (always restart, since extending only hurts)
  best:  -3   -1   -1   -1     (answer = -1, the single element [-1])
```

## bruteForce
Enumerate every `(i, j)` subarray and compute its sum — O(n³) naïve, O(n²) with running sums. Useless beyond small n; mention it as the contrast.

## optimal
Walk left to right. Maintain `current = max(nums[i], current + nums[i])` and `best = max(best, current)`. That's the whole algorithm. To also return the subarray bounds, track `start` and `end` indices: `start` resets to `i` whenever `current` resets to `nums[i]`.

## complexity
time: O(n)
space: O(1)
notes: Two-variable DP — no array needed. Generalizes to 2D max-rectangle-sum by combining with column-prefix-sums, giving an O(n²·m) algorithm for an n×m grid.

## pitfalls
- All-negative arrays: a naïve `max(0, current + nums[i])` returns 0 instead of the largest (least-negative) element. Use `max(nums[i], current + nums[i])` to handle this correctly.
- Returning the *sum* vs the *subarray itself*: be ready for both follow-ups.
- Confusing with "max product subarray" — products require tracking both max and min (because negatives flip), it's a different recurrence.

## interviewTips
- Always solve the all-negative case explicitly to show you've thought about edge cases. The `max(nums[i], current + nums[i])` form is the giveaway you have.
- Mention the 2D extension (Kadane + column prefix sums = max-rectangle) — interviewers love it as a follow-up.
- The "max subarray in a circular array" follow-up is solved with two Kadane passes: standard max, and `total - min subarray` (which represents wrapping around).

## code.python
```python
def max_subarray(nums: list[int]) -> int:
    current = best = nums[0]
    for x in nums[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best
```

## code.javascript
```javascript
function maxSubArray(nums) {
  let current = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}
```

## code.java
```java
public int maxSubArray(int[] nums) {
    int current = nums[0], best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        best = Math.max(best, current);
    }
    return best;
}
```

## code.cpp
```cpp
int maxSubArray(vector<int>& nums) {
    int current = nums[0], best = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        current = max(nums[i], current + nums[i]);
        best = max(best, current);
    }
    return best;
}
```
