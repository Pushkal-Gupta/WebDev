---
slug: dp-optimal-bst
module: dp-classical
title: Optimal Binary Search Tree
subtitle: Build the BST that minimizes expected search cost given access probabilities; Knuth optimization cuts it to O(n^2).
difficulty: Advanced
position: 37
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Optimal Binary Search Trees (walkccc.me)"
    url: "https://walkccc.me/CLRS/Chap15/15.5/"
    type: book
  - title: "Optimal Binary Search Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/optimal-binary-search-tree-dp-24/"
    type: blog
  - title: "TheAlgorithms/Python — optimal_bst.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/dynamic_programming/optimal_binary_search_tree.py"
    type: repo
status: published
---

## intro
Given n keys with access frequencies (or probabilities), the **optimal BST** problem asks for the BST that minimizes the expected number of comparisons per query. Frequently accessed keys want to live near the root; rare keys can sit deep. A balanced BST is optimal *only* if accesses are uniform — almost never the case in real workloads.

The classical DP is O(n^3); Knuth's monotone-root optimization brings it to O(n^2).

## whyItMatters
Database indexes, IDE symbol tables, and language-runtime hash dispatch caches all see Zipfian access patterns. A BST that respects those patterns can be 2-5× faster than a balanced one. The same DP appears verbatim in:
- **Huffman-like prefix codes** with constraint that codeword order matches symbol order.
- **Matrix chain multiplication** (same range-DP shape).
- **Optimal alphabetic codes** (Hu-Tucker).
Interviews use it as the canonical "range DP with quartic→cubic→quadratic optimization" case study.

## intuition
A balanced BST minimizes worst-case search cost, but if access frequencies are non-uniform — and they almost always are in real workloads — a tree that puts hot keys near the root and cold keys deep beats balance every time. The expected search cost is the sum over keys of `freq[k] * depth[k]`, where depth counts comparisons from the root. The optimization is to pick the tree shape that minimizes this sum. The DP approach is range-indexed because BSTs respect key order: a BST on keys i..j has some root r, with the left subtree built from i..r-1 and the right subtree from r+1..j. Crucially, every key in the range descends exactly one level deeper because of the chosen root — so the cost contribution of "this root" is the sum of all frequencies in the range (since each key's depth increases by 1 below this new root). Formally: `cost(i, j) = sum(freq[i..j]) + cost(i, r-1) + cost(r+1, j)`. Try every r in [i..j] as the root and take the minimum. Fill by increasing interval length so subranges are ready when needed. The naive recurrence is O(n^3) — n^2 ranges times n root choices each. Knuth's optimization observes the monotone-root property: the optimal root r*(i, j) is sandwiched between r*(i, j-1) and r*(i+1, j). This bound, plus a telescoping argument across all ranges of fixed length, reduces total work to O(n^2). The deep skill is recognizing that range DPs often have monotone-optimum properties — when they do, the inner search range shrinks and total work drops by a factor of n. The Knuth-Yao quadrangle inequality is the general framework that captures when this acceleration applies; not every range DP satisfies it (Matrix Chain Multiplication does not), so check before reaching for the speedup.

## visualization
```
Keys:    A    B    C    D
Freq:    4    2    6    3

dp[i][j] = min cost of optimal BST on keys i..j

Step 1 (length 1):
  dp[A][A] = 4   dp[B][B] = 2   dp[C][C] = 6   dp[D][D] = 3

Step 2 (length 2):
  dp[A][B] = (4+2) + min(0+dp[B][B], dp[A][A]+0)
           = 6 + min(2, 4) = 8     (root=A)
  dp[B][C] = (2+6) + min(0+6, 2+0) = 8 + 2 = 10  (root=C)
  ...

Step 4 (full):
  dp[A][D] = (4+2+6+3) + min over r ∈ {A,B,C,D} of
                (cost left subtree) + (cost right subtree)

Optimal root for [A..D]: usually the high-frequency key (C).
```

## bruteForce
Try every BST shape on n nodes. Count of BSTs = Catalan(n) ≈ 4^n / n^1.5. Computing cost per shape is O(n). Total O(n · 4^n) — works to n = 10.

## optimal
Range DP filled by increasing interval length, accelerated by Knuth's monotone-root optimization to O(n^2). Maintain `dp[i][j]` = minimum cost for the optimal BST on keys i..j, and `root[i][j]` = the optimal root index. Use a prefix-sum array for O(1) range-frequency lookup. The naive recurrence is O(n^3); Knuth observes that `root[i][j-1] <= root[i][j] <= root[i+1][j]`, bounding the inner scan for r to a shrinking range. Across all ranges of fixed length, total inner work telescopes to O(n^2) instead of O(n^3) — a remarkable speedup with a one-line code change.

```python
def optimal_bst(freq):
    n = len(freq)
    # Prefix sums for O(1) range-frequency lookup.
    pref = [0] * (n + 1)
    for i, f in enumerate(freq):
        pref[i + 1] = pref[i] + f
    rng = lambda i, j: pref[j + 1] - pref[i]

    INF = float("inf")
    dp = [[0] * n for _ in range(n + 1)]
    root = [[0] * n for _ in range(n)]
    # Base: single-key trees.
    for i in range(n):
        dp[i][i] = freq[i]
        root[i][i] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            best, br = INF, i
            # Knuth's bound: optimal root for [i, j] lies between root[i, j-1] and root[i+1, j].
            lo, hi = (root[i][j - 1], root[i + 1][j]) if length > 2 else (i, j)
            for r in range(lo, hi + 1):
                left = dp[i][r - 1] if r > i else 0
                right = dp[r + 1][j] if r < j else 0
                # Every key in [i, j] descends one level deeper because of this new root.
                cost = left + right + rng(i, j)
                if cost < best:
                    best, br = cost, r
            dp[i][j] = best
            root[i][j] = br
    return dp[0][n - 1]
```

The `lo, hi = (root[i][j - 1], root[i + 1][j])` line is the Knuth optimization. Without it, the inner loop scans every r in [i, j] for O(n^3) total. With it, the inner range shrinks and the total work telescopes to O(n^2) — same answer, 10-100x faster on large inputs. The monotone-root property must be proved or verified for each DP before applying Knuth; the Knuth-Yao quadrangle inequality is the standard sufficient condition.

## complexity
- **Naive**: O(n!), unusable.
- **Standard range DP**: O(n^3) time, O(n^2) space.
- **Knuth-optimized**: O(n^2) time, O(n^2) space. Constant factor is small.
- **Online construction of tree**: O(n) backtrack from `root[][]`.

## pitfalls
- **Forgetting to include the frequency sum**: each level deeper costs one comparison per access; that's where `s[i][j]` comes from.
- **Using probabilities vs counts**: works either way, but be consistent — mixing means the answer is in wrong units.
- **Including "miss" probabilities** (CLRS-style q[i] for the gaps between keys): the formula extends to `(p[] sum + q[] sum)`; missing this changes the answer.
- **Iteration order**: must fill by increasing range length, not row-major or column-major.
- **Applying Knuth to wrong DPs**: the monotone-root property must be proved (or quickly verified empirically). Matrix chain multiplication does *not* satisfy it.

## interviewTips
- Trigger: "minimize total search cost," "weighted access," "Zipfian frequencies on sorted keys."
- Lead with the O(n^3) range DP — that's the expected answer. Mention Knuth as the senior-level follow-up.
- Sketch the recurrence on the whiteboard *before* coding; interviewers grade clarity of the range-DP structure.
- Compare with **Huffman** (no key-order constraint, O(n log n)) and **splay trees** (online, amortized self-adjustment without knowing frequencies).
- For follow-ups, mention that the dynamic version (frequencies change over time) is best handled by a splay tree rather than rebuilding.

## code.python
```python
def optimal_bst(freq):
    n = len(freq)
    # prefix sums for O(1) range sum
    pref = [0] * (n + 1)
    for i, f in enumerate(freq):
        pref[i + 1] = pref[i] + f
    rng = lambda i, j: pref[j + 1] - pref[i]

    INF = float("inf")
    dp = [[0] * n for _ in range(n + 1)]
    root = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = freq[i]
        root[i][i] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            best, br = INF, i
            lo, hi = (root[i][j - 1], root[i + 1][j]) if length > 2 else (i, j)
            for r in range(lo, hi + 1):
                left = dp[i][r - 1] if r > i else 0
                right = dp[r + 1][j] if r < j else 0
                cost = left + right + rng(i, j)
                if cost < best:
                    best, br = cost, r
            dp[i][j] = best
            root[i][j] = br
    return dp[0][n - 1]

print(optimal_bst([4, 2, 6, 3]))
```

## code.javascript
```javascript
function optimalBST(freq) {
  const n = freq.length;
  const pref = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) pref[i + 1] = pref[i] + freq[i];
  const rng = (i, j) => pref[j + 1] - pref[i];
  const dp = Array.from({ length: n + 1 }, () => new Array(n).fill(0));
  const root = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) { dp[i][i] = freq[i]; root[i][i] = i; }
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = Infinity, br = i;
      const lo = len > 2 ? root[i][j - 1] : i;
      const hi = len > 2 ? root[i + 1][j] : j;
      for (let r = lo; r <= hi; r++) {
        const left = r > i ? dp[i][r - 1] : 0;
        const right = r < j ? dp[r + 1][j] : 0;
        const cost = left + right + rng(i, j);
        if (cost < best) { best = cost; br = r; }
      }
      dp[i][j] = best; root[i][j] = br;
    }
  }
  return dp[0][n - 1];
}
```

## code.java
```java
class OptimalBST {
    static int solve(int[] freq) {
        int n = freq.length;
        int[] pref = new int[n + 1];
        for (int i = 0; i < n; i++) pref[i + 1] = pref[i] + freq[i];
        int[][] dp = new int[n + 1][n];
        int[][] root = new int[n][n];
        for (int i = 0; i < n; i++) { dp[i][i] = freq[i]; root[i][i] = i; }
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1, best = Integer.MAX_VALUE, br = i;
                int lo = len > 2 ? root[i][j - 1] : i;
                int hi = len > 2 ? root[i + 1][j] : j;
                int sum = pref[j + 1] - pref[i];
                for (int r = lo; r <= hi; r++) {
                    int left = r > i ? dp[i][r - 1] : 0;
                    int right = r < j ? dp[r + 1][j] : 0;
                    int cost = left + right + sum;
                    if (cost < best) { best = cost; br = r; }
                }
                dp[i][j] = best; root[i][j] = br;
            }
        }
        return dp[0][n - 1];
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <climits>
int optimalBST(const std::vector<int>& freq) {
    int n = (int) freq.size();
    std::vector<int> pref(n + 1, 0);
    for (int i = 0; i < n; i++) pref[i + 1] = pref[i] + freq[i];
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(n, 0));
    std::vector<std::vector<int>> root(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) { dp[i][i] = freq[i]; root[i][i] = i; }
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1, best = INT_MAX, br = i;
            int lo = len > 2 ? root[i][j - 1] : i;
            int hi = len > 2 ? root[i + 1][j] : j;
            int sum = pref[j + 1] - pref[i];
            for (int r = lo; r <= hi; r++) {
                int left = r > i ? dp[i][r - 1] : 0;
                int right = r < j ? dp[r + 1][j] : 0;
                int cost = left + right + sum;
                if (cost < best) { best = cost; br = r; }
            }
            dp[i][j] = best; root[i][j] = br;
        }
    }
    return dp[0][n - 1];
}
```
