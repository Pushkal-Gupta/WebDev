---
slug: three-pointers
module: arrays-searching
title: Three Pointers (3-Sum Family)
subtitle: Extend two-pointers — fix one index, run two-pointers on the rest — for 3Sum, 4Sum, and closest-triplet problems.
difficulty: Intermediate
position: 24
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "GeeksforGeeks — Find a triplet that sum to a given value"
    url: "https://www.geeksforgeeks.org/find-a-triplet-that-sum-to-a-given-value/"
    type: blog
  - title: "TheAlgorithms/Python — reference implementations"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
Two-pointers solves "find a pair in a sorted array that sums to X" in O(n). The **three-pointer** extension fixes an outer index `i` and runs two-pointers on `arr[i+1..n-1]` — total O(n²) instead of the naive O(n³). The same pattern generalises to 4Sum (O(n³)), closest 3Sum, and any "k indices summing to X" problem.

## whyItMatters
LeetCode interview classics:
- **3Sum** — find all unique triplets summing to 0.
- **3Sum Closest** — closest sum to a target.
- **4Sum** — find all unique quadruplets.
- **Valid Triangle Count** — count triangles formable from side lengths.

Every interview season has a 3Sum variant. Knowing the pattern + how to handle duplicates is table-stakes.

## intuition
Think of the two-pointer scan as a tuning dial on a sorted array: with `l` at the small end and `r` at the large end, the sum `arr[l] + arr[r]` is a knob you turn. Moving `l` right raises the sum (values only grow to the right); moving `r` left lowers it. Sorting is what makes this monotonic — without it, moving a pointer could change the sum in either direction and the trick collapses. The three-pointer idea just freezes one value out front and solves a two-pointer pair-sum for the *remaining* target `-arr[i]`.

Sort the array. For each `i` from 0 to n-3, set two pointers `l = i+1`, `r = n-1`. Walk them inward:
- If `arr[i] + arr[l] + arr[r] < target`: `l++` (need larger).
- If sum > target: `r--` (need smaller).
- If sum == target: record the triplet, then advance `l` past duplicates AND `r` past duplicates.

Skip duplicates on the outer `i` too — `if i > 0 and arr[i] == arr[i-1]: continue` — to avoid emitting the same triplet twice.

What's actually happening: fixing `arr[i]` reduces a 3-sum to a 2-sum, and each two-pointer pass never revisits a pair, so the inner work is linear per outer index — O(n²) overall instead of the naive O(n³). Work a concrete micro-example with `arr = [-1, 0, 1, 2]`, target 0. Fix `i=0` (`arr[i]=-1`), so we need two of `[0,1,2]` summing to `+1`. Set `l=1` (0), `r=3` (2): sum `-1+0+2 = 1 > 0`, so pull `r` left to index 2 (1): sum `-1+0+1 = 0` — a hit, emit `(-1,0,1)`. Advance both pointers, they cross, inner loop ends. Move to `i=1` (`arr[i]=0`), need two of `[1,2]` summing to 0: `l=2` (1), `r=3` (2) give `0+1+2 = 3 > 0`, pull `r` left, pointers cross, nothing found. Because every wrong sum tells us *which* pointer to move, we never waste comparisons — the array's sorted order turns guessing into a directed search.

## visualization
```
arr = [-4, -1, -1, 0, 1, 2] sorted, target = 0

i=0 (arr[i]=-4):  l=1, r=5. -4 + -1 + 2 = -3 < 0 → l++
                  -4 + -1 + 2 = -3 < 0 → l++
                  -4 + 0 + 2 = -2  < 0 → l++
                  -4 + 1 + 2 = -1  < 0 → l++  (l == r, stop)
i=1 (arr[i]=-1):  l=2, r=5. -1 + -1 + 2 = 0 ✓ → emit (-1, -1, 2)
                  skip dups: l = 3 (arr[3]=0 ≠ -1, no skip), r = 4
                  -1 + 0 + 1 = 0 ✓ → emit (-1, 0, 1)
                  l = 4, r = 3, stop
i=2 (arr[i]=-1): same as i=1 — skip via outer dedupe

Result: [(-1, -1, 2), (-1, 0, 1)]
```

## bruteForce
Three nested loops: O(n³). Fine for n ≤ 200; useless beyond.

## optimal
```
def three_sum(arr):
    arr.sort()
    n = len(arr)
    result = []
    for i in range(n - 2):
        if i > 0 and arr[i] == arr[i-1]: continue   # outer dedupe
        l, r = i + 1, n - 1
        while l < r:
            s = arr[i] + arr[l] + arr[r]
            if s == 0:
                result.append((arr[i], arr[l], arr[r]))
                l += 1
                r -= 1
                while l < r and arr[l] == arr[l-1]: l += 1   # inner dedupe
                while l < r and arr[r] == arr[r+1]: r -= 1
            elif s < 0:
                l += 1
            else:
                r -= 1
    return result
```

**Why it is correct.** The invariant is that after sorting, for a fixed `i`, every valid pair `(l, r)` with `l < r` is considered exactly once without ever moving a pointer backward. When the sum is too small the only way to grow it is `l++` (every element left of `r` is ≤ `arr[r]`, so shrinking `r` could never help); symmetrically, too-large forces `r--`. This means no pair that could produce the target is ever skipped — the search is exhaustive over pairs even though it is linear. On a hit we record it and advance *both* pointers past any equal neighbours, which guarantees each distinct triplet is emitted once. The outer `arr[i] == arr[i-1]` skip enforces the same uniqueness at the fixed-index level.

**Step-by-step walk.** Sort. For each `i`, seed `l = i+1`, `r = n-1`. Loop while `l < r`: compute `s`. If `s == 0`, emit, then bump `l++`, `r--`, and slide each past duplicates. If `s < 0`, `l++`. If `s > 0`, `r--`. The pointers converge in at most n steps, so the inner loop is O(n) and the whole thing is O(n²).

**4Sum** generalises: two outer loops `i, j`, then two-pointers on the rest. O(n³).

**3Sum Closest**: same outer loop but track the closest sum-to-target seen.

**Early termination**: if `arr[i] > 0` (with target=0), no further triplet can sum to 0 — break early.

**Complexity intuition.** The sort is O(n log n) but is dominated by the O(n²) double scan; the pointers never reset backward within an `i`, so the two-pointer inner pass is strictly linear rather than quadratic. Extra space is O(1) beyond the output — the tradeoff versus the hash-set variant, which also runs O(n²) time but spends O(n) memory per outer index and needs its own dedupe bookkeeping.

## complexity
- **Time**: O(n²) for 3Sum, O(n^(k-1)) for k-Sum.
- **Space**: O(1) extra (the output is O(answer-count)).
- **Sort**: O(n log n) — dominated by the loop.

## pitfalls
- **Forgetting duplicate handling**: emits duplicate triplets. Outer dedupe + inner dedupe both required.
- **Off-by-one on `i`'s upper bound**: `range(n - 2)` because you need at least 2 indices after `i`.
- **`if i > 0 and arr[i] == arr[i-1]`**: easy to write `arr[i] == arr[i+1]` by mistake.
- **Overflow on large values**: `arr[i] + arr[l] + arr[r]` can exceed `int` if values near max. Use long.
- **Empty result vs no-solution**: return `[]`, not None, to keep the contract consistent.

## interviewTips
- For "k-Sum", state: "sort, fix k-2 indices, two-pointers the rest. O(n^(k-1))."
- Walk through duplicate handling explicitly — interviewers often follow up with "what if duplicates aren't allowed?"
- For 3Sum Closest, mention early termination if `arr[i] + arr[i+1] + arr[i+2] > target` (sum already too big).
- For senior interviews, mention **hash-set 3Sum in O(n²)** (fix one, hash-set the rest) as a slightly different tradeoff — same big-O, different constants.

## code.python
```python
def three_sum(arr):
    arr.sort(); n = len(arr); result = []
    for i in range(n - 2):
        if i > 0 and arr[i] == arr[i-1]: continue
        l, r = i + 1, n - 1
        while l < r:
            s = arr[i] + arr[l] + arr[r]
            if s == 0:
                result.append((arr[i], arr[l], arr[r])); l += 1; r -= 1
                while l < r and arr[l] == arr[l-1]: l += 1
                while l < r and arr[r] == arr[r+1]: r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return result

print(three_sum([-4, -1, -1, 0, 1, 2]))   # [(-1,-1,2), (-1,0,1)]
```

## code.javascript
```javascript
function threeSum(arr) {
  arr.sort((a, b) => a - b);
  const n = arr.length, out = [];
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && arr[i] === arr[i-1]) continue;
    let l = i + 1, r = n - 1;
    while (l < r) {
      const s = arr[i] + arr[l] + arr[r];
      if (s === 0) {
        out.push([arr[i], arr[l], arr[r]]);
        l++; r--;
        while (l < r && arr[l] === arr[l-1]) l++;
        while (l < r && arr[r] === arr[r+1]) r--;
      } else if (s < 0) l++;
      else r--;
    }
  }
  return out;
}
```

## code.java
```java
import java.util.*;
class ThreeSum {
    public List<List<Integer>> threeSum(int[] arr) {
        Arrays.sort(arr);
        List<List<Integer>> out = new ArrayList<>();
        for (int i = 0; i < arr.length - 2; i++) {
            if (i > 0 && arr[i] == arr[i-1]) continue;
            int l = i + 1, r = arr.length - 1;
            while (l < r) {
                int s = arr[i] + arr[l] + arr[r];
                if (s == 0) {
                    out.add(Arrays.asList(arr[i], arr[l], arr[r]));
                    l++; r--;
                    while (l < r && arr[l] == arr[l-1]) l++;
                    while (l < r && arr[r] == arr[r+1]) r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        return out;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
std::vector<std::vector<int>> threeSum(std::vector<int> arr) {
    std::sort(arr.begin(), arr.end());
    std::vector<std::vector<int>> out;
    int n = arr.size();
    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && arr[i] == arr[i-1]) continue;
        int l = i + 1, r = n - 1;
        while (l < r) {
            int s = arr[i] + arr[l] + arr[r];
            if (s == 0) {
                out.push_back({ arr[i], arr[l], arr[r] });
                l++; r--;
                while (l < r && arr[l] == arr[l-1]) l++;
                while (l < r && arr[r] == arr[r+1]) r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return out;
}
```
