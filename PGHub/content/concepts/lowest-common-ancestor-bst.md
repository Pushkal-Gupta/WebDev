---
slug: lowest-common-ancestor-bst
module: trees-traversal-bst
title: Lowest Common Ancestor in a BST
subtitle: One root-to-LCA walk in O(h) — the BST ordering does all the work the general-tree algorithm has to do twice.
difficulty: Beginner
position: 45
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "cp-algorithms — Lowest Common Ancestor"
    url: "https://cp-algorithms.com/graph/lca.html"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree/lowest_common_ancestor.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/lowest_common_ancestor.py"
    type: repo
status: published
---

## intro
The Lowest Common Ancestor (LCA) of two nodes p and q in a rooted tree is the deepest node that has both p and q as descendants (a node is its own descendant). In a general binary tree, finding it requires a post-order recursion that returns "found p," "found q," or "found both." In a BST, the ordering property collapses that to a single root-downward walk — at each node you can tell from p, q, and the current value which subtree both must lie in. The result is a 10-line O(h) algorithm with no extra memory.

## whyItMatters
LCA is the building block for tree distance (`dist(u,v) = depth(u) + depth(v) − 2·depth(lca)`), batch ancestor queries, persistent data structures, and version-control merge bases. The BST variant is also a textbook example of how "extra structural invariants make an algorithm dramatically simpler" — exactly the kind of reasoning interviewers want to see.

## intuition
Walk down from the root. At each node `cur`:

- If both p and q are smaller than `cur.val`, the LCA lies in the left subtree.
- If both are larger, the LCA lies in the right subtree.
- Otherwise, the values straddle `cur` (or one of them equals `cur`) — `cur` itself is the LCA.

The "split point" is exactly the LCA: it is the first node where p and q diverge into different subtrees, or it is one of p, q if that node is an ancestor of the other. This works because in a BST, *every* descendant of a node lies entirely in the value range determined by ancestors.

The iterative version writes itself: keep a pointer, follow left or right, stop on a split.

## walkthroughExample
BST:
```
                       8
                      / \
                     4   12
                    / \    \
                   2   6   16
                      / \
                     5   7
```

**Case A: LCA(2, 7) = 4.**

```
   cur = 8: 2 < 8 and 7 < 8           -> go left
   cur = 4: 2 < 4 and 7 > 4           -> split! return 4
```

**Case B: LCA(5, 7) = 6.**

```
   cur = 8:  5 < 8 and 7 < 8          -> go left
   cur = 4:  5 > 4 and 7 > 4          -> go right
   cur = 6:  5 < 6 and 7 > 6          -> split! return 6
```

**Case C: LCA(4, 5) = 4 (4 is an ancestor of 5).**

```
   cur = 8:  4 < 8 and 5 < 8          -> go left
   cur = 4:  4 == cur                  -> return 4
```

In every case we make at most h hops down.

## visualization
Snapshot 1 — the "split point" perspective:
```
                       8
                      / \
                     4   12
                    / \
                   2   6
                      / \
                     5   7
   query (2, 7) -> root-to-LCA path: 8 -> 4 (split here)
   query (5, 7) -> root-to-LCA path: 8 -> 4 -> 6 (split here)
```

Snapshot 2 — three decision regions at every node `cur`:
```
                   cur
                  /   \
                left   right
   p, q both < cur.val    -> recurse left
   p, q both > cur.val    -> recurse right
   one <=, one >=         -> cur is the LCA
```

Snapshot 3 — comparing to general-tree LCA:
```
   general binary tree LCA:
      post-order, every node returns "found p", "found q", "found both"
      O(n) time, O(h) recursion
   BST LCA:
      single root-to-LCA walk, no post-order
      O(h) time, O(1) extra
```

Snapshot 4 — height profile:
```
   balanced BST (n = 10^6):   h ~ 20    -> ~20 comparisons
   skewed BST (n = 10^6):     h ~ 10^6  -> linear in n
```

## bruteForce
Two options:
1. Find the root-to-p and root-to-q paths separately, then walk both lists in parallel and return the last common element. O(n) time, O(h) memory.
2. Apply the general-tree LCA algorithm (post-order returns). Also O(n), O(h).

Both ignore the BST ordering. The optimal BST-specific walk is O(h) without the extra memory or the second pass.

## optimal
```
LCA(root, p, q):
    cur = root
    while cur:
        if p.val < cur.val and q.val < cur.val:
            cur = cur.left
        elif p.val > cur.val and q.val > cur.val:
            cur = cur.right
        else:
            return cur
```

No recursion, no auxiliary stack, single descent. Same logic in recursive form is also four lines.

If p and q are not guaranteed to be in the tree, validate them first (an O(h) per-key BST search). The LCA logic itself does not detect missing nodes.

## complexity
time: O(h) where h is tree height (O(log n) balanced, O(n) skewed).
space: O(1) iterative; O(h) recursive due to stack frames.
notes: For self-balancing BSTs (AVL, red-black), worst case is O(log n). For general binary trees (no ordering), see the standard LCA algorithm — it is O(n) time and structurally different.

## pitfalls
- Confusing this with the general-tree LCA. Don't use the post-order "found p / found q" pattern on a BST — it works but is overkill and slower.
- Off-by-one on the split test. The correct conditions use strict inequality on *both* sides; the split case includes equality (one of p, q equals cur).
- Assuming p, q exist in the tree. The algorithm will happily return a node that is not actually an ancestor of a missing key. Validate inputs if the problem allows them to be absent.
- Recursing in languages with shallow default stacks on a deeply skewed BST. Use iteration.

## interviewTips
- Open with the invariant: "In a BST, the LCA is the first node where p and q lie on opposite sides — or equal the node itself."
- Always write the iterative version; it shows you understand that no extra memory is needed.
- If asked the general-tree variant as a follow-up, switch to the post-order pattern and explain why the BST trick no longer applies.
- Mention Euler-tour + RMQ as the O(1)-per-query offline LCA structure if the interviewer is pushing for advanced material.

## code.python
```python
def lowestCommonAncestor(root, p, q):
    cur = root
    while cur:
        if p.val < cur.val and q.val < cur.val:
            cur = cur.left
        elif p.val > cur.val and q.val > cur.val:
            cur = cur.right
        else:
            return cur
    return None
```

## code.javascript
```javascript
function lowestCommonAncestor(root, p, q) {
  let cur = root;
  while (cur) {
    if (p.val < cur.val && q.val < cur.val) cur = cur.left;
    else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
    else return cur;
  }
  return null;
}
```

## code.java
```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;
    }
    return null;
}
```

## code.cpp
```cpp
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    TreeNode* cur = root;
    while (cur) {
        if (p->val < cur->val && q->val < cur->val) cur = cur->left;
        else if (p->val > cur->val && q->val > cur->val) cur = cur->right;
        else return cur;
    }
    return nullptr;
}
```
