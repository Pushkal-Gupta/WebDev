---
slug: jump-game-i-ii
module: greedy
title: Jump Game I and II
subtitle: Reachability and minimum-jumps on a "max jump length" array — max-reach scan plus interval expansion.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Graphs (Sedgewick & Wayne)"
    url: "https://algs4.cs.princeton.edu/40graphs/"
    type: book
  - title: "Minimum number of jumps to reach end — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/minimum-number-of-jumps-to-reach-end-of-a-given-array/"
    type: blog
  - title: "TheAlgorithms/Python — jump_game.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/jump_game.py"
    type: repo
status: published
---

## intro
You stand at index 0 of an array `nums`. From index `i` you may jump to any index in `[i+1, i+nums[i]]`. Jump Game I asks whether the last index is reachable; Jump Game II asks the minimum number of jumps. Both succumb to greedy O(n) algorithms — no DP needed.

## whyItMatters
This is the cleanest example of "implicit BFS via interval expansion." The trick — track the farthest reachable boundary, only spend a jump when you exhaust the current frontier — appears in interval-graph shortest paths, leveled BFS on monotone grids, and bandwidth-allocation greedy schedulers.

## intuition
For reachability: scan left-to-right, keeping `maxReach`. At each `i`, if `i > maxReach`, you're stranded — return false. Otherwise update `maxReach = max(maxReach, i + nums[i])`. For minimum jumps: model it as BFS levels. `currentEnd` is the boundary of the current jump's reachable interval; `farthest` is the best you can reach by extending. When `i` hits `currentEnd`, you must spend a jump — set `currentEnd = farthest`, increment count.

## visualization
For `nums = [2,3,1,1,4]` and Jump Game II: start with jumps=0, currentEnd=0, farthest=0. i=0: farthest = max(0, 0+2) = 2. We hit currentEnd → jumps=1, currentEnd=2. i=1: farthest = max(2, 1+3) = 4. i=2: farthest = max(4, 2+1) = 4. We hit currentEnd → jumps=2, currentEnd=4. Loop ends. Answer = 2 — and the chain 0 → 1 → 4 confirms it.

## bruteForce
Recursive: from i, try every reachable j in `[i+1, i+nums[i]]`, recurse. Exponential without memoization, O(n²) DP with it: `dp[i] = 1 + min(dp[j])` over reachable j. Acceptable for n ≤ a few thousand; the greedy O(n) is what wins interviews and competitive constraints.

## optimal
Jump Game I: single pass tracking `maxReach`. Bail out the moment `i > maxReach`, otherwise success when the loop ends (or earlier if `maxReach >= n - 1`). Jump Game II: single pass tracking `currentEnd`, `farthest`, `jumps`. At each `i < n - 1`, extend `farthest`. When `i == currentEnd`, commit a jump and refresh `currentEnd = farthest`. The loop ends after at most `n - 1` iterations and always with `currentEnd >= n - 1` if the input is reachable.

## complexity
time: O(n) for both variants.
space: O(1)
notes: Greedy correctness for Jump II: because `farthest` only grows, the boundaries `[currentEnd_prev, currentEnd]` partition the array into BFS levels — each commit is the smallest possible number of jumps that could reach the new frontier.

## pitfalls
- Looping `i` up to `n` instead of `n - 1` in Jump II — causes an extra unnecessary jump at the very end.
- Updating `currentEnd` *before* checking the boundary `i == currentEnd` — collapses two levels into one.
- Forgetting the early exit when `maxReach >= n - 1` — still correct, but slower on long inputs.
- Treating `nums[i]` as exact jump distance instead of max — breaks for the canonical problem statement.

## interviewTips
- Sketch BFS levels on paper before coding — it makes the `currentEnd` / `farthest` distinction click for the interviewer.
- Mention you can return early from Jump I once `maxReach` covers the array.
- For "Jump Game III" (arbitrary jumps), pivot to true BFS — the greedy O(n) does not generalize.

## code.python
```python
def can_jump(nums):
    max_reach = 0
    for i, v in enumerate(nums):
        if i > max_reach:
            return False
        if i + v > max_reach:
            max_reach = i + v
    return True

def min_jumps(nums):
    jumps = current_end = farthest = 0
    for i in range(len(nums) - 1):
        if i + nums[i] > farthest:
            farthest = i + nums[i]
        if i == current_end:
            jumps += 1
            current_end = farthest
    return jumps
```

## code.javascript
```javascript
function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    if (i + nums[i] > maxReach) maxReach = i + nums[i];
  }
  return true;
}

function minJumps(nums) {
  let jumps = 0, currentEnd = 0, farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (i + nums[i] > farthest) farthest = i + nums[i];
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }
  return jumps;
}
```

## code.java
```java
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;
        if (i + nums[i] > maxReach) maxReach = i + nums[i];
    }
    return true;
}

public int minJumps(int[] nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;
    for (int i = 0; i < nums.length - 1; i++) {
        if (i + nums[i] > farthest) farthest = i + nums[i];
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

## code.cpp
```cpp
bool canJump(vector<int>& nums) {
    int maxReach = 0;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (i > maxReach) return false;
        if (i + nums[i] > maxReach) maxReach = i + nums[i];
    }
    return true;
}

int minJumps(vector<int>& nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;
    for (int i = 0; i < (int)nums.size() - 1; i++) {
        if (i + nums[i] > farthest) farthest = i + nums[i];
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```
