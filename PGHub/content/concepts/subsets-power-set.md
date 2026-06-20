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
For each element of the input you make a binary decision: include it or skip it. That choice tree is exactly `2^n` leaves deep, one leaf per subset of the original set, and the tree is balanced — every path from root to leaf has length `n`. Visit the tree depth-first and record the current path at every internal node; the collection of paths is the power set.

There are two equivalent ways to write the recursion and you should understand both. The first is the include/exclude shape: at index `i`, first recurse with `i` excluded, then with `i` included; backtrack by popping after the included branch. The second is the for-loop shape: at each call, loop over `i` from `start` to `n-1`, append `nums[i]`, recurse with `start = i+1`, then pop. The include/exclude form makes the binary tree structure obvious and generalizes cleanly to constrained variants like subset-sum. The for-loop form fits combinations and permutations more naturally and is easier to extend with skip-duplicate logic.

The third equivalent representation is bitmask iteration. Each integer from `0` to `2^n - 1` encodes one subset: bit `i` set means include `nums[i]`. This compresses the entire algorithm to one nested loop and is the version most competitive programmers reach for when `n <= 20`.

## whyItMatters
Subset enumeration is the simplest possible backtracking shape: no constraints, no pruning, just two choices per element. Mastering it is the prerequisite for every harder enumeration problem — subset sum, partition equal subset sum, the `O(2^n)` brute force of 0/1 knapsack, and the entire family of bitmask DP problems that appear in Codeforces Div-1 rounds and Google onsite finals. Recognizing `n <= 20` in a problem statement should reflexively suggest power-set or bitmask DP, because `2^20 = 1,048,576` is comfortably within a second of computation. The technique also underlies feature-selection in machine learning, Gray-code generation for combinatorial testing, and the powerset construction that converts an NFA to a DFA in compiler frontends.

## visualization
For nums=[1,2,3], bitmasks 000..111 produce: 000={}, 001={1}, 010={2}, 011={1,2}, 100={3}, 101={1,3}, 110={2,3}, 111={1,2,3}. The recursion view: root → (skip 1, take 1) → (skip 2, take 2) → (skip 3, take 3). Eight leaves, eight subsets, one-to-one correspondence with bitmasks read in reverse bit order.

## bruteForce
There is no "brute force vs optimal" split for power-set generation — you must enumerate all 2^n outputs because that is the answer size. The interesting comparison is between styles: bitmask enumeration is cache-friendly and trivially parallelizable; DFS is easier to extend when you want to prune (subset sum, partition).

## optimal
Two implementations are equivalent in asymptotic cost (`O(n * 2^n)` time and space because each subset must be written out). Choose by readability: backtracking for the cleanest mental model, bitmask iteration for the smallest constant factor and easiest extension to bitmask DP.

```python
# Backtracking, include/exclude shape
def subsets(nums):
    res, path = [], []
    def dfs(i):
        if i == len(nums):
            res.append(path[:])
            return
        dfs(i + 1)              # exclude nums[i]
        path.append(nums[i])    # include nums[i]
        dfs(i + 1)
        path.pop()
    dfs(0)
    return res

# Bitmask iteration, same output in any order
def subsets_bits(nums):
    n = len(nums)
    return [[nums[i] for i in range(n) if mask >> i & 1]
            for mask in range(1 << n)]
```

The critical line in the bitmask form is `mask >> i & 1`, which checks bit `i` of `mask`; the comprehension extracts every element whose bit is set. The total cost is bounded by `O(n * 2^n)` because there are `2^n` subsets and each takes `O(n)` to write out, which is also the lower bound — any algorithm that returns the power set must touch every element at least once. For `n > 20` the output itself is larger than typical memory and you should switch to a generator / streaming variant, yielding one subset at a time.

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
