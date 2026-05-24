---
slug: permutations-backtrack
module: recursion-bt
title: Permutations via Backtracking
subtitle: Enumerate every ordering of n distinct elements using DFS with a used-set.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter on Recursion"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "Write a program to print all Permutations of given String — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/write-a-c-program-to-print-all-permutations-of-a-given-string/"
    type: blog
  - title: "TheAlgorithms/Python — permutations.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/arrays/permutations.py"
    type: repo
status: published
---

## intro
A permutation of a sequence is any arrangement of its elements in a particular order. For n distinct elements there are exactly n! permutations, and the canonical way to generate them is depth-first search with backtracking: at every level pick an unused element, recurse, then undo the pick.

## whyItMatters
Permutations are the gateway problem for the entire backtracking family — N-Queens, sudoku, word-search, combinations all use the same template of choose, recurse, unchoose. Mastering the bookkeeping (the used-set or the in-place swap) earns you a tool that scales to constraint-satisfaction problems and brute-force search wherever the state space is "all orderings of these things."

## intuition
Picture a tree of decisions. The root has n branches, one per element you can place first. Each child has n-1 branches for the second slot, and so on. The leaves at depth n are full permutations. DFS visits each leaf exactly once; the only state we need is which elements are still unused. When recursion returns, we restore that state so the parent can try its next branch.

## visualization
For [1,2,3]: pick 1 → pick 2 → pick 3 → leaf [1,2,3], backtrack, pick 3 → pick 2 → leaf [1,3,2], backtrack twice, pick 2 → pick 1 → pick 3 → leaf [2,1,3], and so on. The recursion tree has 3! = 6 leaves; each path from root to leaf is one permutation. The "used" array flips a bit on entry and unflips on exit, exactly tracking the current path.

## bruteForce
Generate every length-n string of indices in [0, n), then keep only those with no repeats. That is n^n candidates filtered down to n! — wasteful by a factor of n^n / n!, which for n=8 is about 1600x extra work. It also requires post-filtering, which obscures the underlying combinatorial structure.

## optimal
Use DFS with a used-set (or in-place swap). Maintain a current partial permutation `path` and a boolean array `used`. At each call, iterate i from 0 to n-1: if `used[i]` is false, mark it true, append nums[i] to path, recurse, then pop and unmark. When path length equals n, record a copy. The work is exactly proportional to the number of nodes in the recursion tree, which is bounded by n * n!.

## complexity
time: O(n * n!)
space: O(n) auxiliary plus O(n * n!) for the output if collected
notes: There are n! leaves and each leaf does O(n) work to copy the path into the output. The recursion stack is O(n) deep. If duplicates are allowed, sort first and skip `i > 0 && nums[i] == nums[i-1] && !used[i-1]` to de-duplicate without re-checking.

## pitfalls
- Appending the live `path` reference into results — every entry ends up pointing at the same (now-empty) list. Always copy.
- Forgetting to unmark `used[i]` on the way back up — the next branch sees stale state.
- Not handling duplicates: [1,1,2] produces 6 permutations naively, but only 3 are distinct.
- Recursing on n above ~10 in an interview when n! explodes — call out the runtime ceiling before coding.

## interviewTips
- Walk through n=3 on the whiteboard before writing code; it forces you to verbalize the choose / unchoose pattern.
- Mention the in-place swap variant as a follow-up — same output, O(1) extra bookkeeping beyond the call stack.
- If asked for the k-th permutation, switch to the factorial-number-system trick — never enumerate all n!.

## code.python
```python
def permute(nums):
    res, path, used = [], [], [False] * len(nums)

    def dfs():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            dfs()
            path.pop()
            used[i] = False

    dfs()
    return res
```

## code.javascript
```javascript
function permute(nums) {
  const res = [], path = [], used = new Array(nums.length).fill(false);
  function dfs() {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  }
  dfs();
  return res;
}
```

## code.java
```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    dfs(nums, new ArrayList<>(), used, res);
    return res;
}

private void dfs(int[] nums, List<Integer> path, boolean[] used, List<List<Integer>> res) {
    if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        dfs(nums, path, used, res);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        dfs(nums, path, used, res);
        return res;
    }
private:
    void dfs(vector<int>& nums, vector<int>& path, vector<bool>& used, vector<vector<int>>& res) {
        if (path.size() == nums.size()) { res.push_back(path); return; }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            used[i] = true;
            path.push_back(nums[i]);
            dfs(nums, path, used, res);
            path.pop_back();
            used[i] = false;
        }
    }
};
```
