---
slug: combinations-backtrack
module: recursion-bt
title: Combinations via Backtracking
subtitle: Enumerate every size-k subset of [1, n] in lexicographic order with DFS.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Recursion and Combinatorics"
    url: "https://walkccc.me/CLRS/"
    type: book
  - title: "Combinational Sum — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/combinational-sum/"
    type: blog
  - title: "TheAlgorithms/Python — combinations.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/maths/combinations.py"
    type: repo
status: published
---

## intro
A combination is an unordered selection of k items from n. We want all C(n, k) such subsets emitted exactly once. Permutations care about order; combinations do not, so we restrict the recursion to always pick the next element with a strictly larger index than the previous one — that single rule kills every duplicate.

## whyItMatters
Combinations are the second pillar of the backtracking template, right after permutations. The "start index" trick (only consider indices ≥ start) is the same pattern you reuse in subset sum, palindrome partitioning, combination sum, and the entire family of constrained-choice problems. Understanding why it eliminates duplicates without an explicit dedupe pass is a small but high-leverage insight.

## intuition
Walk a decision tree. At each node you ask "what is the next index to include?" Because we only consider indices strictly greater than the last one picked, every path from root to a depth-k leaf is a unique sorted tuple. There is no need for a visited set — the start parameter encodes "everything before me is off-limits."

## visualization
For n=4, k=2: root splits into picks of 1, 2, 3 (4 cannot start any pair of length 2). Picking 1 leads to children 2, 3, 4; picking 2 leads to 3, 4; picking 3 leads to 4. Leaves: [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] — exactly C(4,2)=6. Notice how the right branches shrink: that's the "start index" pruning at work.

## bruteForce
Generate every subset of [1, n] via 2^n bitmasks, then filter to those with popcount k. For n=20 and k=10 that's 1,048,576 candidates filtered down to 184,756 — wasted by ~5.7x. Worse, it does not enumerate in sorted order, which often complicates downstream uses like canonical hashing.

## optimal
DFS with `(start, path)`. At each call, if `path.length == k` record a copy and return. Otherwise loop `i` from `start` to `n`, append i, recurse with `start = i + 1`, then pop. A further speedup is the upper-bound prune: `i` only needs to range up to `n - (k - path.length) + 1` because beyond that we cannot fill the remaining slots.

## complexity
time: O(k * C(n, k))
space: O(k) recursion depth plus O(k * C(n, k)) for collected output
notes: There are C(n, k) leaves and each leaf does O(k) work copying the path. The recursion stack never exceeds k. The upper-bound prune trims the number of internal nodes visited but does not change the asymptotic bound.

## pitfalls
- Recursing with `start = i` instead of `i + 1` — produces combinations with repetition (a different problem).
- Forgetting to copy `path` into results — every entry aliases the same list.
- Skipping the upper-bound prune on large inputs — wastes time exploring branches that cannot reach length k.
- Using a set-of-frozensets to dedupe when start-index ordering already guarantees uniqueness — pure overhead.

## interviewTips
- State C(n, k) up front so the interviewer knows you understand the search-space size.
- If asked for combinations with repetition, change the recursive call to `dfs(i, ...)` and explain the one-character difference.
- Mention combination sum / subset sum as natural follow-ups — same skeleton with an extra running-sum prune.

## code.python
```python
def combine(n, k):
    res, path = [], []

    def dfs(start):
        if len(path) == k:
            res.append(path[:])
            return
        limit = n - (k - len(path)) + 1
        for i in range(start, limit + 1):
            path.append(i)
            dfs(i + 1)
            path.pop()

    dfs(1)
    return res
```

## code.javascript
```javascript
function combine(n, k) {
  const res = [], path = [];
  function dfs(start) {
    if (path.length === k) { res.push([...path]); return; }
    const limit = n - (k - path.length) + 1;
    for (let i = start; i <= limit; i++) {
      path.push(i);
      dfs(i + 1);
      path.pop();
    }
  }
  dfs(1);
  return res;
}
```

## code.java
```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> res = new ArrayList<>();
    dfs(1, n, k, new ArrayList<>(), res);
    return res;
}

private void dfs(int start, int n, int k, List<Integer> path, List<List<Integer>> res) {
    if (path.size() == k) { res.add(new ArrayList<>(path)); return; }
    int limit = n - (k - path.size()) + 1;
    for (int i = start; i <= limit; i++) {
        path.add(i);
        dfs(i + 1, n, k, path, res);
        path.remove(path.size() - 1);
    }
}
```

## code.cpp
```cpp
class Solution {
public:
    vector<vector<int>> combine(int n, int k) {
        vector<vector<int>> res;
        vector<int> path;
        dfs(1, n, k, path, res);
        return res;
    }
private:
    void dfs(int start, int n, int k, vector<int>& path, vector<vector<int>>& res) {
        if ((int)path.size() == k) { res.push_back(path); return; }
        int limit = n - (k - (int)path.size()) + 1;
        for (int i = start; i <= limit; i++) {
            path.push_back(i);
            dfs(i + 1, n, k, path, res);
            path.pop_back();
        }
    }
};
```
