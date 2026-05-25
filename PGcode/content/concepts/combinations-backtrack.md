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
- **Feature-subset selection in ML pipelines (scikit-learn `SelectKBest`, AutoML wrapper search)**: enumerating every size-k subset of features for cross-validated model comparison uses this exact algorithm; the start-index trick prevents redundant work.
- **Test-case combinatorial coverage (pairwise testing, IPOG algorithm)**: generating all k-way combinations of parameter values for systematic test suites — used by Microsoft's PICT, NIST's ACTS.
- **Lottery / combinatorial probability simulations**: computing exact probabilities for k-of-n drawings requires enumerating every C(n, k) subset.
- **Bioinformatics k-mer enumeration**: extracting every size-k subset of read positions for kmer-based alignment in BLAST, BWA preprocessing.
- **A/B test variant generation**: enumerating every k-way combination of independent experiment flags for full-factorial experiment design at Google, Meta, Booking.com.
- **Combinatorial proof verification (Lean, Coq, Isabelle)**: explicit subset enumeration validates small-case proofs for combinatorial identities.
- **Interview signal**: LeetCode 77 — Meta, Amazon, Bloomberg use this as the canonical "enumerate without duplicates" probe. The "start index" trick is the single best signal that a candidate understands how to suppress permutational duplicates structurally rather than via a hash set.

The pattern extends verbatim to subset sum, palindrome partitioning, combination sum, N-queens — the entire family of "enumerate constrained subsets without duplicates" problems. Owning combinations means owning the template.

## intuition
The naive approach generates every subset of `[1, n]` via 2^n bitmasks, then filters to those with popcount k. For n=20, k=10 that's 1,048,576 candidates filtered down to 184,756 — wasting ~5.7× work. Worse, it doesn't enumerate in sorted order, which complicates downstream uses like canonical hashing or set-equality checks.

The clean approach is DFS over a decision tree where each node asks "what's the next index to include?". The single move that makes the algorithm correct without an explicit dedupe pass is the `start` parameter: only consider indices strictly greater than the last one picked. This restriction encodes "everything before me is off-limits — either I would've picked it earlier or I've decided not to". Every path from root to a depth-k leaf becomes a unique sorted tuple, and the tree generates each combination exactly once in lexicographic order.

The "why does this prevent duplicates?" question deserves a precise answer because interviewers probe it. Consider the alternative: at each node, allow picking any index in [1, n] that isn't already in the path. That generates *permutations of subsets* — `[1, 2]` and `[2, 1]` both appear, giving k! × C(n, k) leaves instead of C(n, k). Adding a hash set to dedupe works but is pure overhead. The start-index trick is the structural fix: by enforcing strictly increasing indices, you canonicalise the order, and canonical ordering means no two leaves can ever be equal-as-sets.

The upper-bound prune `i ≤ n - (k - len(path)) + 1` is a constant-factor improvement worth knowing. The intuition: if you need to pick `k - len(path)` more elements, and the last element you pick must be ≤ n, then the *next* element can be at most `n - (k - len(path)) + 1`. Picking anything larger leaves too few candidates to fill the remaining slots. Without this prune, you waste time exploring branches that can't possibly reach length k. With it, the search tree is exactly the size of the output (C(n, k) leaves) times the path-copy cost.

The mental model that generalises: backtracking templates have three knobs — the state (here: `start` and `path`), the choice at each step (here: which next index to include), and the termination condition (here: `len(path) == k`). Combinations is the simplest case where all three are mechanical. Subset sum adds a running-sum prune. Palindrome partitioning replaces "next index" with "next prefix". N-queens adds a "row × column × diagonals" used-set. The skeleton is the same; only the choice space and the prune conditions change.

One subtlety that comes up in follow-ups: this algorithm enumerates combinations *without repetition*. If the prompt asks for "combinations with repetition" (multisets of size k from n items, also called multi-combinations), the only change is recurring with `dfs(i, ...)` instead of `dfs(i + 1, ...)` — letting the same index be picked again. A one-character difference produces a different problem with C(n + k - 1, k) solutions instead of C(n, k). Knowing this is high signal.

## visualization
For n=4, k=2: root splits into picks of 1, 2, 3 (4 cannot start any pair of length 2). Picking 1 leads to children 2, 3, 4; picking 2 leads to 3, 4; picking 3 leads to 4. Leaves: [1,2], [1,3], [1,4], [2,3], [2,4], [3,4] — exactly C(4,2)=6. Notice how the right branches shrink: that's the "start index" pruning at work.

## bruteForce
Generate every subset of [1, n] via 2^n bitmasks, then filter to those with popcount k. For n=20 and k=10 that's 1,048,576 candidates filtered down to 184,756 — wasted by ~5.7x. Worse, it does not enumerate in sorted order, which often complicates downstream uses like canonical hashing.

## optimal
DFS with `(start, path)` state. At each call, if `len(path) == k` record a copy of the path and return. Otherwise loop `i` from `start` to the upper-bound prune limit `n - (k - len(path)) + 1`, append i, recurse with `start = i + 1`, then pop. The start increment enforces strictly increasing indices and eliminates duplicate combinations structurally; the upper-bound prune avoids exploring branches that can't reach length k.

```python
from typing import List

def combine(n: int, k: int) -> List[List[int]]:
    """LeetCode 77 — enumerate all C(n, k) size-k subsets of [1, n] in sorted order."""
    res: List[List[int]] = []
    path: List[int] = []

    def dfs(start: int) -> None:
        if len(path) == k:
            res.append(path.copy())                  # MUST copy — path mutates after return
            return
        # Upper-bound prune: if we need (k - len(path)) more elements and the last must be ≤ n,
        # then the next element can be at most n - (k - len(path)) + 1
        limit = n - (k - len(path)) + 1
        for i in range(start, limit + 1):
            path.append(i)
            dfs(i + 1)                                # i + 1 enforces strictly increasing → no dupes
            path.pop()                                # backtrack for sibling branches

    dfs(1)
    return res

def combine_with_repetition(n: int, k: int) -> List[List[int]]:
    """Multi-combinations: same skeleton, recurse with `i` instead of `i + 1`."""
    res, path = [], []
    def dfs(start: int) -> None:
        if len(path) == k:
            res.append(path.copy()); return
        for i in range(start, n + 1):
            path.append(i)
            dfs(i)                                    # reuse allowed — same index can recur
            path.pop()
    dfs(1)
    return res
```

Why optimal: any algorithm enumerating C(n, k) combinations must visit each one at least once to emit it, and each emission requires copying k elements. The lower bound is therefore Ω(k · C(n, k)). The backtracking algorithm with the upper-bound prune visits exactly C(n, k) leaves and does O(k) work per leaf (the path copy), hitting that bound exactly. The recursion stack depth never exceeds k, so auxiliary memory is O(k) plus the O(k · C(n, k)) output. No comparison-based algorithm can do asymptotically better — the output size itself is the dominant cost.

The bitmask alternative (enumerate 2^n bitmasks, filter by popcount k) has worst-case time O(n · 2^n) versus the backtracking algorithm's O(k · C(n, k)), which is a factor of `2^n / C(n, k)` worse — for n=20, k=10 that's a 5.7× overhead, and the gap grows exponentially as k moves away from n/2.

Implementation discipline that distinguishes good solutions from buggy ones: (1) recurse with `i + 1`, not `i` — the +1 is what enforces strictly increasing indices and prevents duplicate combinations; recursing with `i` gives you combinations *with* repetition (a different problem); (2) `res.append(path.copy())` — appending the live `path` reference puts the same list in `res` every time and after backtracking pops, every entry aliases the same (eventually empty) list; (3) the upper-bound prune `limit = n - (k - len(path)) + 1` is a constant-factor improvement that matters on large n — without it, the algorithm explores branches that can't reach length k; (4) using a `set` of `frozenset`s to dedupe is pure overhead when start-index ordering already guarantees uniqueness — reach for the structural fix, not the hash set; (5) for the C(n, k) calculation up front (sanity check that the output size is what you expect), Python's `math.comb` is the right tool; (6) for very large outputs (n=20, k=10 produces 184,756 combinations of size 10 each, about 7MB), prefer a generator (yield each combination instead of accumulating into a list) so the caller can stream — Python's `itertools.combinations` is the gold-standard reference implementation and matches this algorithm exactly.

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
