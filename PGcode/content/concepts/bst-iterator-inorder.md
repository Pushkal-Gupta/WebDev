---
slug: bst-iterator-inorder
module: trees
title: BST Iterator (In-Order)
subtitle: Stream the sorted keys of a BST one at a time with O(h) memory and O(1) amortized next().
difficulty: Intermediate
position: 42
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "GeeksforGeeks — Inorder Successor in BST using stack"
    url: "https://www.geeksforgeeks.org/inorder-successor-in-binary-search-tree/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree/binary_search_tree.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_search_tree.py"
    type: repo
status: published
---

## intro
An in-order traversal of a binary search tree yields its keys in sorted order. The straightforward recursive walk produces all of them at once in O(n) time and O(h) stack frames. But many interview problems ask for a *streaming* iterator: produce the next sorted key only when asked, while keeping memory bounded. The classic stack-based BST iterator does exactly that — `next()` runs in O(1) amortized time and the data structure uses O(h) extra space.

## whyItMatters
Iterator-style traversal underpins range queries, merging two BSTs in sorted order, k-th smallest element streaming, and lazy comparisons between trees. It also shows up as a common LeetCode "design" question (LC 173). The trick — simulate recursion with an explicit stack and push only the left spine of the current subtree — is the same pattern used by database cursors over B-trees: keep enough state to resume, not the whole result.

## intuition
Recursive in-order does three things at each node: recurse left, visit, recurse right. The iterator simulates this with an explicit stack that holds the "ancestors we have not yet visited." The invariant is:

> The stack always contains the path of left-descendants down from the next node to be returned.

When we ask for `next()`:
1. Pop the top of the stack — that is the smallest unvisited node.
2. If it has a right child, push the entire left spine of that right subtree.

Step 2 is the only non-trivial work, and the total cost over n calls is O(n) — every node is pushed and popped exactly once. So amortized cost per `next()` is O(1), even though a single call may push h nodes.

## walkthroughExample
BST:
```
            7
           / \
          3   15
         / \    \
        1   5   20
                /
               17
```

In-order order is `1, 3, 5, 7, 15, 17, 20`. Trace the iterator:

```
   init: push left spine from root 7  -> stack = [7, 3, 1]
   next() -> pop 1   (no right child)        stack = [7, 3]      return 1
   next() -> pop 3   push left-spine of 5    stack = [7, 5]      return 3
   next() -> pop 5   (no right child)        stack = [7]         return 5
   next() -> pop 7   push left-spine of 15   stack = [15]        return 7
   next() -> pop 15  push left-spine of 20   stack = [20, 17]    return 15
   next() -> pop 17  (no right child)        stack = [20]        return 17
   next() -> pop 20  (no right child)        stack = []          return 20
   hasNext() -> false
```

Notice the stack never holds more than h = 3 nodes at once, even though n = 7.

## visualization
Snapshot 1 — initial state, left spine of root pushed:
```
                            stack top
                              v
   stack:  [ 7, 3, 1 ]
                       ^
                    next() pops here
```

Snapshot 2 — after returning 3, push left spine of 5 (which is just {5}):
```
   tree slice:  3
                 \
                  5

   stack:  [ 7, 5 ]
```

Snapshot 3 — after returning 7, push left spine of 15:
```
   tree slice:    15
                    \
                    20
                    /
                  17

   spine from 15.right = 20 -> 17:   push 20, then 17
   stack:  [ 15, 20, 17 ]
                      ^ next
```

Snapshot 4 — memory profile compared to recursive walk:
```
   n nodes, height h:
       recursive in-order:    O(h) stack + O(n) output buffer
       iterator (this):       O(h) stack, output streamed -> O(1) per call
```

## bruteForce
Materialize the full in-order list once and serve it from an index pointer. Time per `next()` is O(1) but total memory is O(n), defeating the point of streaming. For a BST with millions of keys (or one merged from external storage), this is unacceptable. The stack-based iterator gets O(h) memory — for a balanced tree that is O(log n).

## optimal
**Constructor:** push the entire left spine from the root. Time O(h).

**next():** pop the top; if the popped node has a right child, push the left spine of that right subtree. Return the popped node's key.

**hasNext():** return `not stack.empty()`.

The amortized argument: every node is pushed onto the stack at most once and popped at most once. n calls to `next()` therefore do O(n) total push/pop work, giving O(1) per call on average. The worst-case single call is O(h) — a long left spine push — but that is paid back over the following pops.

## complexity
time: O(1) amortized per next(); O(h) constructor; O(n) total across all calls.
space: O(h) extra — only the current root-to-frontier left path is held.
notes: For a balanced BST h = O(log n); for a degenerate (linked-list-shaped) BST h = O(n). If the BST is augmented with parent pointers you can drop the stack entirely and walk to the inorder successor in O(h) per call without extra memory.

## pitfalls
- Forgetting to push the left spine of the *right child* after popping. Without this step you only ever return the leftmost path and then claim `hasNext()` is false.
- Mixing up "push everything left" with "push everything." You push the left spine only; siblings on the right wait until their parent is popped.
- Calling `next()` without first checking `hasNext()` — pop from an empty stack throws. Always guard.
- Returning the entire node when the spec wants the key. Trivial mistake but common in language transitions (Java/C++ vs Python).

## interviewTips
- Lead with the invariant: "the stack holds the left spine from the next unvisited node." Interviewers grade the explanation as much as the code.
- Mention the amortized analysis explicitly. Many candidates say "O(h)" per `next()` and lose points; the correct answer is O(1) amortized, O(h) worst case.
- If asked for `prev()` too, you need a second stack mirroring the right spine, or precomputed inorder predecessors. Don't hand-wave.
- If asked about k-th smallest with frequent modifications, mention an order-statistic tree (size-augmented BST) — that switches you from O(k) to O(log n) per query.

## code.python
```python
class BSTIterator:
    def __init__(self, root):
        self.stack = []
        self._push_left(root)

    def _push_left(self, node):
        while node:
            self.stack.append(node)
            node = node.left

    def next(self) -> int:
        node = self.stack.pop()
        if node.right:
            self._push_left(node.right)
        return node.val

    def hasNext(self) -> bool:
        return bool(self.stack)
```

## code.javascript
```javascript
class BSTIterator {
  constructor(root) {
    this.stack = [];
    this._pushLeft(root);
  }
  _pushLeft(node) {
    while (node) { this.stack.push(node); node = node.left; }
  }
  next() {
    const node = this.stack.pop();
    if (node.right) this._pushLeft(node.right);
    return node.val;
  }
  hasNext() {
    return this.stack.length > 0;
  }
}
```

## code.java
```java
class BSTIterator {
    private final Deque<TreeNode> stack = new ArrayDeque<>();

    public BSTIterator(TreeNode root) { pushLeft(root); }

    private void pushLeft(TreeNode node) {
        while (node != null) { stack.push(node); node = node.left; }
    }

    public int next() {
        TreeNode node = stack.pop();
        if (node.right != null) pushLeft(node.right);
        return node.val;
    }

    public boolean hasNext() { return !stack.isEmpty(); }
}
```

## code.cpp
```cpp
class BSTIterator {
    stack<TreeNode*> st;
    void pushLeft(TreeNode* node) {
        while (node) { st.push(node); node = node->left; }
    }
public:
    BSTIterator(TreeNode* root) { pushLeft(root); }
    int next() {
        TreeNode* node = st.top(); st.pop();
        if (node->right) pushLeft(node->right);
        return node->val;
    }
    bool hasNext() { return !st.empty(); }
};
```
