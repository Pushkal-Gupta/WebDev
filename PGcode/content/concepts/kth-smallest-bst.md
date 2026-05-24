---
slug: kth-smallest-bst
module: trees
title: Kth Smallest in a BST
subtitle: In-order traversal with early stop, or an augmented size field for repeated queries in O(log n).
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Kth Smallest Element in a BST — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/find-k-th-smallest-element-in-bst-order-statistics-in-bst/"
    type: blog
  - title: "Princeton algs4 — Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "TheAlgorithms/Python — binary_search_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_search_tree.py"
    type: repo
status: published
---

## intro
A binary search tree stores keys in sorted order under in-order traversal. The Kth smallest element is therefore the Kth node visited by an in-order walk. The interview twist: a follow-up usually asks how to make repeated Kth-smallest queries fast when the tree is mutating, which leads naturally to size-augmented BSTs.

## whyItMatters
Kth-smallest is the gateway to *order statistics* on trees — the same machinery powers "rank of a key," "select the median," and the augmented BSTs covered in CLRS chapter 14. Recognizing in-order traversal as a sorted enumeration is one of the highest-yield insights in tree problems; recognizing that you can stop early is the next.

## intuition
In-order = left subtree, then node, then right subtree. Because the BST invariant says all left descendants are smaller and all right descendants are larger, an in-order walk produces keys in ascending order. So the Kth smallest is the Kth node we touch — and we can stop the second we touch it, no need to walk the rest of the tree.

## visualization
For the BST `[3,1,4,null,2]` with K=1: stack starts empty, node=3. Push 3, go left to 1. Push 1, left is null, pop 1 — that's the 1st node visited. Answer = 1. For K=3: pop 1, then 2, then 3 — answer = 3. The iterative version uses an explicit stack so we can return mid-traversal cleanly.

## bruteForce
Do a full in-order traversal into a list, then return `list[k-1]`. O(n) time, O(n) extra space for the list. Simple and bug-free, but wasteful: if K is small, you scanned the whole tree for nothing. Acceptable as a first cut; rarely the final answer.

## optimal
Iterative in-order with an explicit stack: push left spines, pop a node, decrement K, return when K hits zero. Worst-case O(h + k) time, O(h) space — where h is tree height. For a balanced tree, that's O(log n + k). For repeated queries on a mutating tree, augment each node with `size` (count of nodes in its subtree) and walk down comparing K against `left.size + 1` — pure O(log n) per query, no traversal needed.

## complexity
time: O(h + k) single query, O(log n) augmented per query
space: O(h) stack for iterative in-order
notes: h is tree height: log n if balanced (AVL/red-black), n in the worst case for an unbalanced BST. The augmented variant needs O(log n) per insert/delete to maintain `size` fields but pays off when queries dominate.

## pitfalls
- Off-by-one on K: if K is 1-indexed (the usual convention), decrement *after* visiting, not before, or pre-decrement once.
- Recursing without an early-stop guard — returns the right answer but processes the entire right subtree.
- Confusing "Kth smallest" with "Kth largest" — Kth largest needs reverse in-order (right, node, left) or rank = `n - k + 1`.
- Forgetting to maintain `size` on inserts/deletes when using the augmented variant — silently returns wrong rank later.

## interviewTips
- Open with "in-order traversal of a BST visits nodes in sorted order" — this single sentence buys most of the answer.
- Default to the iterative stack version with early stop; mention recursion only if pressed.
- When the follow-up arrives ("what if the BST is modified often?"), pivot to the size-augmented approach and cite CLRS order statistics.

## code.python
```python
def kth_smallest(root, k):
    stack = []
    node = root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return None
```

## code.javascript
```javascript
function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  while (stack.length || node) {
    while (node) { stack.push(node); node = node.left; }
    node = stack.pop();
    if (--k === 0) return node.val;
    node = node.right;
  }
  return null;
}
```

## code.java
```java
public int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode node = root;
    while (!stack.isEmpty() || node != null) {
        while (node != null) { stack.push(node); node = node.left; }
        node = stack.pop();
        if (--k == 0) return node.val;
        node = node.right;
    }
    return -1;
}
```

## code.cpp
```cpp
int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st;
    TreeNode* node = root;
    while (!st.empty() || node) {
        while (node) { st.push(node); node = node->left; }
        node = st.top(); st.pop();
        if (--k == 0) return node->val;
        node = node->right;
    }
    return -1;
}
```
