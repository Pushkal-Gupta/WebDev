---
slug: validate-bst
module: trees-traversal-bst
title: Validate a Binary Search Tree
subtitle: Recursive bounds (min, max) — the canonical interview trap that breaks naive "left smaller, right bigger" checks.
difficulty: Beginner
position: 44
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "GeeksforGeeks — A program to check if a binary tree is BST"
    url: "https://www.geeksforgeeks.org/a-program-to-check-if-a-binary-tree-is-bst-or-not/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree/is_sum_tree.py & binary_search_tree.py"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
"Given a binary tree, return true if it is a valid BST." The textbook definition: for every node, *all* keys in the left subtree are strictly less than the node, and *all* keys in the right subtree are strictly greater. The most popular wrong solution checks only the immediate children — a five-line bug that ships in real code. The right idea is to thread a `(min, max)` bounding window down the recursion so each node knows the legal range it must live in.

## whyItMatters
The bounds technique generalizes far beyond this problem. Range-constrained recursion is exactly how range trees, KD-tree balancing, interval scheduling validators, and constraint propagation in SAT solvers work. Mastering it on BST validation makes the same pattern click everywhere else. As an interview filter, this problem also catches candidates who confuse "looks like a BST locally" with the global ordering property.

## intuition
A BST is *globally* ordered: an inorder traversal must yield strictly increasing keys. Two equivalent ways to verify this:

1. **Inorder traversal:** walk the tree in inorder, track the previous value, and assert every new value is strictly greater.
2. **Bounds recursion:** carry `(lo, hi)` down each call. At node `x`: require `lo < x.val < hi`; recurse left with `hi = x.val`; recurse right with `lo = x.val`.

Both run in O(n). The bounds version short-circuits as soon as it finds a violation, which is usually faster on broken trees. The inorder version is one O(1)-state line of code longer because you need a previous-pointer outside the recursion.

The common wrong "local" check (only compare a node to its two children) misses violations like:

```
            10
           /  \
          5    15
              /
             6     <- 6 < 15 (local check passes) but 6 < 10 globally INVALID
```

Without the inherited upper bound, the recursion at node 6 cannot see that its true ceiling is 10, not 15.

## walkthroughExample
Valid BST:
```
            8
           / \
          3   12
         / \   \
        1   6   20
```

Bounds trace `(lo, hi)`:
```
   validate(8, -inf, +inf)
       check  -inf < 8 < +inf            ok
       validate(3, -inf, 8)
           check  -inf < 3 < 8           ok
           validate(1, -inf, 3)          ok (leaf)
           validate(6, 3, 8)             ok (leaf within (3,8))
       validate(12, 8, +inf)
           check  8 < 12 < +inf          ok
           validate(20, 12, +inf)
               check  12 < 20 < +inf     ok (leaf)
   -> true
```

Invalid BST (the classic trap):
```
            10
           /  \
          5    15
              /
             6
```

Bounds trace:
```
   validate(10, -inf, +inf)              ok
       validate(5, -inf, 10)              ok
       validate(15, 10, +inf)             ok
           validate(6, 10, 15)            FAIL  -> 6 < 10 violates lo < val
   -> false
```

The bound `lo = 10` carried into the recursion at 6 is exactly what the naive "compare to parent only" check misses.

## visualization
Snapshot 1 — the legal window shrinks as you recurse left or right:
```
                   (-inf, +inf)
                       |
                       8
                      / \
            (-inf, 8)   (8, +inf)
                /             \
                3              12
               / \             / \
       (-inf,3) (3,8)  (8,12) (12,+inf)
            1     6      .       20
```

Snapshot 2 — invalid tree, the failing node and its true ceiling:
```
                   (-inf, +inf)
                       |
                       10
                      /  \
            (-inf, 10)   (10, +inf)
                |           |
                5           15
                          /
                  (10, 15)        <- legal window for 6
                      |
                      6           <- 6 is OUTSIDE (10, 15)  -> reject
```

Snapshot 3 — inorder check viewed as a sliding window:
```
   inorder values:  1, 3, 6, 8, 12, 20            (valid: strictly up)
   inorder values:  5, 10, 6, 15                  (invalid: 10 then 6)
                          ^^^ previous > current
```

Snapshot 4 — bounds vs inorder, side by side:
```
   bounds recursion:   carries (lo, hi); fails fast on first violation
   inorder traversal:  carries prev pointer; fails at first non-increasing step
   both:               O(n) time, O(h) auxiliary memory
```

## bruteForce
"At every node, ask: is the max of the left subtree < node.val and the min of the right subtree > node.val?" Recompute both subtree extrema by walking each subtree from scratch. Correct, but runs in O(n²) on a skewed tree because each ancestor re-scans the entire subtree beneath it. The bounds version avoids this by *inheriting* the right limits via recursion arguments rather than recomputing them.

## optimal
**Bounds recursion:**
```
def validate(node, lo=-INF, hi=+INF):
    if node is None: return True
    if not (lo < node.val < hi): return False
    return validate(node.left,  lo, node.val) and \
           validate(node.right, node.val, hi)
```

**Inorder traversal (equivalent, single previous pointer):**
```
def validate(root):
    prev = -INF
    for v in inorder(root):
        if v <= prev: return False
        prev = v
    return True
```

Both are O(n). Bounds short-circuits earlier on invalid trees. Inorder is sometimes easier to extend (k-th smallest, BST iterator).

## complexity
time: O(n) — every node visited at most once.
space: O(h) recursion (or explicit stack). h is O(log n) balanced, O(n) skewed.
notes: For the strict-vs-non-strict distinction (some sources allow duplicates on the right), change `<` to `<=` consistently. Whichever you choose, document it — it is a common interview clarification.

## pitfalls
- Comparing a node only to its immediate children — the canonical bug. Always use inherited bounds or a single inorder pass.
- Using `INT_MIN`/`INT_MAX` as sentinels and then encountering a node whose value equals the sentinel. Use `None`/`null`/floats with `-inf` and `+inf` to be safe, or compare against the parent pointer rather than a numeric bound.
- Allowing equal values silently. Decide whether the BST permits duplicates and enforce it the same way on both sides.
- Using inorder but forgetting to keep the `prev` pointer across recursive calls — Python class attribute or a mutable list `[prev]` is the trick.
- Writing iterative inorder and breaking the loop on the *next* iteration instead of immediately when a violation is detected, which sometimes misses the first failure on tight tests.

## interviewTips
- Lead with the corner case: "What about a node deep in the right subtree whose value violates the root's lower bound?" That demonstrates you know why the naive check fails.
- State both solutions (bounds + inorder) and pick one. Usually bounds for clarity; inorder if the interviewer hints at "what about iterative?" or "what about k-th smallest extension?"
- Mention `Long.MIN_VALUE`/`LONG_MIN` in Java/C++ if `int` bounds are real values — otherwise pass `null` bounds and check existence.
- If asked to support duplicates on the right, change one inequality and re-state the invariant out loud.

## code.python
```python
def isValidBST(root) -> bool:
    def go(node, lo, hi):
        if not node: return True
        if not (lo < node.val < hi): return False
        return go(node.left, lo, node.val) and go(node.right, node.val, hi)
    return go(root, float("-inf"), float("inf"))
```

## code.javascript
```javascript
function isValidBST(root) {
  const go = (node, lo, hi) => {
    if (!node) return true;
    if (!(lo < node.val && node.val < hi)) return false;
    return go(node.left, lo, node.val) && go(node.right, node.val, hi);
  };
  return go(root, -Infinity, Infinity);
}
```

## code.java
```java
public boolean isValidBST(TreeNode root) {
    return validate(root, null, null);
}
private boolean validate(TreeNode node, Integer lo, Integer hi) {
    if (node == null) return true;
    if ((lo != null && node.val <= lo) || (hi != null && node.val >= hi)) return false;
    return validate(node.left,  lo, node.val) &&
           validate(node.right, node.val, hi);
}
```

## code.cpp
```cpp
bool validate(TreeNode* node, long lo, long hi) {
    if (!node) return true;
    if (node->val <= lo || node->val >= hi) return false;
    return validate(node->left,  lo, node->val) &&
           validate(node->right, node->val, hi);
}
bool isValidBST(TreeNode* root) {
    return validate(root, LONG_MIN, LONG_MAX);
}
```
