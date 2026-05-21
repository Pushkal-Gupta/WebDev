---
slug: morris-traversal
module: trees
title: Morris Traversal
subtitle: In-order traversal of a binary tree in O(1) extra space — temporarily rewire null right-pointers as threads.
difficulty: Advanced
position: 26
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Morris (1979) — Traversing binary trees simply and cheaply"
    url: ""
status: published
---

## intro
The standard ways to traverse a binary tree in-order all use **O(h) extra space** — either the recursion stack or an explicit stack. **Morris traversal** does it in **O(1) extra space** by temporarily rewiring null right-pointers to point back up to ancestors, then unwinding them on the second visit. The tree's final structure is identical to the start.

## whyItMatters
For huge or memory-constrained trees, the recursion stack is the bottleneck. Morris cuts it to zero. Used in:
- **Embedded systems** with tiny stacks.
- **Streaming a tree to disk** with bounded RAM.
- **Interview flex**: "in-order without recursion AND without a stack" is the canonical follow-up to "implement in-order traversal."

The same threading trick gives in-place pre-order and reverse in-order; post-order needs a slight twist.

## intuition
Walk the tree from the root. At each node `cur`:
1. **No left child**: visit `cur`, move to `cur.right`.
2. **Has left child**: find the rightmost node in `cur`'s left subtree (the in-order predecessor). Two cases:
   - Predecessor's `right` is null → set it to `cur` (create thread), then go left.
   - Predecessor's `right` is `cur` (we came back via thread) → restore `pred.right = null`, visit `cur`, go right.

The threads are transient — every one is set on the first descent and removed on the way back up.

## visualization
```
Tree:                          Threaded (red pointers added temporarily):
       1                             1
      / \                           / ↑
     2   3                         2  ↑
    / \                           / ↑ │
   4   5                         4 ↑ │ │
                                 ↓_│_│ (rightmost of subtree of 2 → back to 1)

In-order: 4, 2, 5, 1, 3 — produced one step at a time, threads dismantled as we go.
```

## bruteForce
Recursive in-order: O(n) time, O(h) stack space. Iterative with explicit stack: same. For balanced trees h = O(log n) — usually fine but not constant.

## optimal
```
def morris_inorder(root):
    cur = root
    out = []
    while cur:
        if not cur.left:
            out.append(cur.val)
            cur = cur.right
        else:
            # Find in-order predecessor: rightmost node in cur's left subtree.
            pred = cur.left
            while pred.right and pred.right != cur:
                pred = pred.right
            if not pred.right:
                pred.right = cur          # set the thread
                cur = cur.left
            else:
                pred.right = None         # tear down the thread
                out.append(cur.val)
                cur = cur.right
    return out
```

Each edge in the tree is traversed at most three times (once down, once via thread, once up), so time is O(n). Space is O(1) — only the `cur`, `pred`, and `out` pointers.

For **pre-order**, swap the visit point: emit when you create the thread, not when you tear it down.

## complexity
- **Time**: O(n).
- **Space**: O(1) extra (not counting the output).
- **Tree mutation during run**: yes — restored to original by the end. NOT thread-safe with concurrent readers.

## pitfalls
- **Forgetting to tear down the thread**: leaves a corrupted tree. The `pred.right = None` step is mandatory before re-visiting `cur`.
- **Self-loops**: when checking `pred.right != cur`, the equality catches the thread case. Don't compare values — compare references.
- **Tree mutated during traversal**: if another thread modifies the tree mid-Morris, the threads can get lost. Lock or copy first if needed.
- **Iterators / generators**: returning values incrementally requires saving state across yields — Python's generator works naturally; Java/C++ needs an iterator class.

## interviewTips
- The trigger: "in-order traverse without recursion AND without a stack" — that's Morris.
- Walk through the thread creation + removal explicitly. Most candidates know recursion + stack; the threading trick is the senior signal.
- Mention that the tree is mutated during traversal but restored — interviewers like that you note the invariant.
- For **post-order**, mention that the trick gets harder — usually solved by Morris pre-order on a mirror traversal then reversing.

## code.python
```python
def morris_inorder(root):
    out, cur = [], root
    while cur:
        if not cur.left:
            out.append(cur.val)
            cur = cur.right
        else:
            pred = cur.left
            while pred.right and pred.right is not cur:
                pred = pred.right
            if pred.right is None:
                pred.right = cur
                cur = cur.left
            else:
                pred.right = None
                out.append(cur.val)
                cur = cur.right
    return out
```

## code.javascript
```javascript
function morrisInorder(root) {
  const out = [];
  let cur = root;
  while (cur) {
    if (!cur.left) { out.push(cur.val); cur = cur.right; }
    else {
      let pred = cur.left;
      while (pred.right && pred.right !== cur) pred = pred.right;
      if (!pred.right) { pred.right = cur; cur = cur.left; }
      else { pred.right = null; out.push(cur.val); cur = cur.right; }
    }
  }
  return out;
}
```

## code.java
```java
import java.util.*;
class Morris {
    public List<Integer> inorder(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        TreeNode cur = root;
        while (cur != null) {
            if (cur.left == null) { out.add(cur.val); cur = cur.right; }
            else {
                TreeNode pred = cur.left;
                while (pred.right != null && pred.right != cur) pred = pred.right;
                if (pred.right == null) { pred.right = cur; cur = cur.left; }
                else { pred.right = null; out.add(cur.val); cur = cur.right; }
            }
        }
        return out;
    }
}
```

## code.cpp
```cpp
#include <vector>
struct TreeNode { int val; TreeNode *left = nullptr, *right = nullptr; };
std::vector<int> morrisInorder(TreeNode* root) {
    std::vector<int> out;
    TreeNode* cur = root;
    while (cur) {
        if (!cur->left) { out.push_back(cur->val); cur = cur->right; }
        else {
            TreeNode* pred = cur->left;
            while (pred->right && pred->right != cur) pred = pred->right;
            if (!pred->right) { pred->right = cur; cur = cur->left; }
            else { pred->right = nullptr; out.push_back(cur->val); cur = cur->right; }
        }
    }
    return out;
}
```
