---
slug: subsets-power-set
module: recursion-bt
title: Subsets and the Power Set
subtitle: Generate all 2^n subsets of an array via bitmask enumeration or include/exclude DFS.
difficulty: Beginner
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Sedgewick & Wayne"
    url: "https://algs4.cs.princeton.edu/"
    type: book
  - title: "Power Set — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/power-set/"
    type: blog
  - title: "TheAlgorithms/Python — power_set.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/power_set.py"
    type: repo
status: published
---

## intro
The power set of a collection of n elements is the set of all 2^n subsets, including the empty set and the full collection itself. Two equivalent constructions dominate: bitmask enumeration, which maps each integer in [0, 2^n) to a subset by reading its bits, and include/exclude recursion, which at each element branches into two recursive calls.

## intuition
Each element is independently either in or out of a subset, giving 2^n configurations. A bitmask of n bits names each configuration directly: bit i set means element i is in the subset. The recursion view is equivalent: a binary tree of depth n where the left edge means "skip" and the right edge means "take." Leaves are subsets.

## whyItMatters
Subset enumeration is the simplest possible backtracking shape — no constraints, no pruning, just two choices per element. It is the perfect place to internalize "for each element, branch on a binary decision," which is the structure of subset sum, partition equal subset sum, the 0/1 knapsack brute force, and bitmask DP. Recognizing 2^n in a problem's input bound (n ≤ 20) is often a hint that subset enumeration is intended.

## visualization
For nums=[1,2,3], bitmasks 000..111 produce: 000={}, 001={1}, 010={2}, 011={1,2}, 100={3}, 101={1,3}, 110={2,3}, 111={1,2,3}. The recursion view: root → (skip 1, take 1) → (skip 2, take 2) → (skip 3, take 3). Eight leaves, eight subsets, one-to-one correspondence with bitmasks read in reverse bit order.

## bruteForce
There is no "brute force vs optimal" split for power-set generation — you must enumerate all 2^n outputs because that is the answer size. The interesting comparison is between styles: bitmask enumeration is cache-friendly and trivially parallelizable; DFS is easier to extend when you want to prune (subset sum, partition).

## optimal
For n ≤ 30 use a bitmask: loop mask from 0 to (1 << n) - 1, and for each mask iterate i from 0 to n-1 emitting nums[i] when (mask >> i) & 1. For n > 30 (rare in interviews) you must switch to recursion because mask no longer fits in an int. The recursive variant has the same Θ(n * 2^n) runtime and is the only style that supports early pruning.

## complexity
time: O(n * 2^n)
space: O(n) auxiliary plus O(n * 2^n) for collected output
notes: 2^n subsets each costing O(n) to materialize. The recursion variant uses O(n) stack depth. Always state both factors; "2^n" alone hides the per-subset construction cost interviewers want to hear.

## pitfalls
- Emitting only non-empty subsets when the problem includes the empty subset (or vice versa) — re-read the prompt.
- Sorting nums after starting recursion — duplicates only behave correctly when sorted first.
- Confusing power set with permutations — they have different sizes (2^n vs n!) and very different recursion shapes.
- Using a set of tuples to dedupe when the input has duplicates — sorting plus the "skip duplicate at this depth" trick is cleaner and faster.

## interviewTips
- Mention both styles in the same breath: "I can do this with bitmasks or with include/exclude DFS — DFS is easier to extend later." That signals you understand both.
- For "subsets II" (with duplicates), sort the input and skip `i > start && nums[i] == nums[i-1]` to suppress repeated subsets without a hash-set.
- Call out the n ≤ 20 ceiling as a backtracking signal in any problem you suspect requires subset enumeration.

## code.python
```python
def subsets(nums):
    n = len(nums)
    res = []
    for mask in range(1 << n):
        res.append([nums[i] for i in range(n) if mask & (1 << i)])
    return res

def subsets_dfs(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])
            return
        dfs(i + 1)
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
    dfs(0)
    return res
```

## code.javascript
```javascript
function subsets(nums) {
  const n = nums.length, res = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const cur = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) cur.push(nums[i]);
    res.push(cur);
  }
  return res;
}

function subsetsDfs(nums) {
  const res = [], path = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...path]); return; }
    dfs(i + 1);
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
  dfs(0);
  return res;
}
```

## code.java
```java
public List<List<Integer>> subsets(int[] nums) {
    int n = nums.length;
    List<List<Integer>> res = new ArrayList<>();
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> cur = new ArrayList<>();
        for (int i = 0; i < n; i++) if ((mask & (1 << i)) != 0) cur.add(nums[i]);
        res.add(cur);
    }
    return res;
}

public List<List<Integer>> subsetsDfs(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    dfs(0, nums, new ArrayList<>(), res);
    return res;
}

private void dfs(int i, int[] nums, List<Integer> path, List<List<Integer>> res) {
    if (i == nums.length) { res.add(new ArrayList<>(path)); return; }
    dfs(i + 1, nums, path, res);
    path.add(nums[i]);
    dfs(i + 1, nums, path, res);
    path.remove(path.size() - 1);
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> res;
        for (int mask = 0; mask < (1 << n); mask++) {
            vector<int> cur;
            for (int i = 0; i < n; i++) if (mask & (1 << i)) cur.push_back(nums[i]);
            res.push_back(cur);
        }
        return res;
    }

    vector<vector<int>> subsetsDfs(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        dfs(0, nums, path, res);
        return res;
    }
private:
    void dfs(int i, vector<int>& nums, vector<int>& path, vector<vector<int>>& res) {
        if (i == (int)nums.size()) { res.push_back(path); return; }
        dfs(i + 1, nums, path, res);
        path.push_back(nums[i]);
        dfs(i + 1, nums, path, res);
        path.pop_back();
    }
};
```
