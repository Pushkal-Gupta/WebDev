---
slug: tree-morris-traversal
module: trees-traversal-bst
title: Morris Traversal (O(1) Space)
subtitle: In-order traversal without recursion or a stack — temporarily rewire each leaf's rightmost descendant to its inorder-successor. Restore on the way back.
difficulty: Advanced
position: 50
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS — Trees & traversal techniques"
    url: "https://walkccc.me/CLRS/Chap12/"
    type: book
  - title: "GeeksforGeeks — Morris traversal"
    url: "https://www.geeksforgeeks.org/inorder-tree-traversal-without-recursion-and-without-stack/"
    type: blog
  - title: "TheAlgorithms/Python — Tree traversals"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/binary_tree"
    type: repo
status: published
---

## intro
Standard inorder traversal needs a stack — recursion (implicit) or explicit — both O(h) auxiliary space. **Morris traversal** does inorder in O(1) extra space by **temporarily threading** each node's inorder predecessor (rightmost node in left subtree) back to itself, then **un-threading** on the way back. Same O(N) time, no extra structures.

## whyItMatters
- O(1) space traversal of trees: useful when the tree is huge, recursion would overflow, or memory is tight.
- The threading trick generalizes to preorder and postorder Morris variants.
- Demonstrates the broader pattern of **mutating data structure for traversal then restoring** — also seen in some union-find optimizations.
- Niche interview question that signals deep tree understanding.

## intuition
Inorder: left subtree → root → right subtree. Without a stack, when we move from a node `v` to its left subtree, we need to remember to come back. Morris's idea: make the **rightmost node** in `v`'s left subtree (its inorder predecessor) point its `right` child to `v`. When we eventually traverse to that predecessor, we follow the thread back to `v`, then move to `v`'s right subtree.

After we've finished `v`'s left subtree (or detected the thread is already set, meaning we've returned), we **remove the thread** to restore the original tree.

## visualization
```
Tree:
        1
       / \
      2   3
     / \
    4   5

Morris in-order: should emit 4, 2, 5, 1, 3.

Step trace (curr = root):
  curr = 1, has left child 2 → find pred of 1 in left subtree (rightmost of subtree at 2) = 5.
    Thread: 5.right = 1.   curr = 1.left = 2.
  curr = 2, has left child 4 → find pred = 4.
    Thread: 4.right = 2.   curr = 2.left = 4.
  curr = 4, no left child → EMIT 4. curr = 4.right = 2 (threaded).
  curr = 2, has left → find pred = 4. pred.right == 2 (thread exists).
    Remove thread: 4.right = None. EMIT 2. curr = 2.right = 5.
  curr = 5, no left → EMIT 5. curr = 5.right = 1 (threaded).
  curr = 1, has left → find pred = 5. pred.right == 1 (thread).
    Remove: 5.right = None. EMIT 1. curr = 1.right = 3.
  curr = 3, no left → EMIT 3. curr = None. Done.

Output: 4, 2, 5, 1, 3. Tree restored. Space used: just a couple of pointers.
```

## bruteForce
**Recursive inorder**: O(N) time, O(h) space (recursion stack).

**Iterative inorder with explicit stack**: same complexity but explicit stack means O(h) heap allocation.

**Convert to array first**: O(N) extra space.

Morris is the only O(1)-extra-space option.

## optimal
**Morris inorder algorithm**:
```python
def morris_inorder(root):
    curr = root
    while curr:
        if not curr.left:
            yield curr.val
            curr = curr.right
        else:
            # find predecessor: rightmost of left subtree (or until thread loops back)
            pred = curr.left
            while pred.right and pred.right is not curr:
                pred = pred.right
            if not pred.right:
                pred.right = curr           # thread
                curr = curr.left
            else:
                pred.right = None           # un-thread
                yield curr.val
                curr = curr.right
```

**Morris preorder**: emit `curr.val` when *creating* the thread (before descending left), not when removing it. One line change.

**Morris postorder**: harder — requires reversing the right-edge path. Less common in practice.

**Restoration guarantee**: the algorithm un-threads every thread it sets. If it terminates normally, tree is identical to input. If it's interrupted mid-traversal, threads may persist — pair with try/finally to clean up.

## complexity
- **Time:** O(N). Each edge traversed at most twice (once down, once back via thread).
- **Space:** O(1). No recursion, no stack.

## pitfalls
- **Thread left in place.** Forgetting to un-thread leaves a cycle in the tree; a later traversal loops forever. Fix: every `pred.right == curr` branch must clear the thread (`pred.right = None`) before continuing.
- **Concurrent reader during traversal.** The temporary thread breaks the tree's invariants; any concurrent reader sees a malformed structure or follows the cycle. Fix: hold an exclusive lock for the duration, or run on a thread-local copy if read concurrency is required.
- **Value equality instead of identity in the thread check.** Comparing `pred.right == curr` by value (Python's `==`) treats two distinct nodes with equal `.val` as the same node, leading to premature thread removal. Fix: always compare by identity (`is` in Python, `==` on references in Java, pointer `==` in C++).
- **Empty tree.** Entering the loop with `root = None` should produce an empty result; some implementations dereference `None.left`. Fix: the loop's `while curr` guard handles this — keep it intact and add a unit test on the empty input.
- **Postorder variant rolled by intuition.** The Morris postorder requires reversing the right-edge path of each "completed left subtree" — most ad-hoc implementations get it wrong. Fix: prefer the explicit-stack postorder unless O(1) extra space is a hard constraint; if you must use Morris postorder, copy a reference implementation verbatim and test on at least five distinct shapes.

## interviewTips
- For "in-order traversal in O(1) space" → Morris.
- Cite the **thread + un-thread** invariant as the key insight.
- For senior interviews, discuss **Morris preorder** as a 1-line variant, **threaded binary trees** (Knuth, 1970s) as the historical origin, and **why postorder Morris is rarely used**.

## code.python
```python
def morris_inorder(root):
    out = []
    curr = root
    while curr:
        if not curr.left:
            out.append(curr.val)
            curr = curr.right
        else:
            pred = curr.left
            while pred.right and pred.right is not curr:
                pred = pred.right
            if not pred.right:
                pred.right = curr
                curr = curr.left
            else:
                pred.right = None
                out.append(curr.val)
                curr = curr.right
    return out
```

## code.javascript
```javascript
function morrisInorder(root) {
  const out = [];
  let curr = root;
  while (curr) {
    if (!curr.left) {
      out.push(curr.val);
      curr = curr.right;
    } else {
      let pred = curr.left;
      while (pred.right && pred.right !== curr) pred = pred.right;
      if (!pred.right) {
        pred.right = curr;
        curr = curr.left;
      } else {
        pred.right = null;
        out.push(curr.val);
        curr = curr.right;
      }
    }
  }
  return out;
}
```

## code.java
```java
public List<Integer> morrisInorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    TreeNode curr = root;
    while (curr != null) {
        if (curr.left == null) {
            out.add(curr.val); curr = curr.right;
        } else {
            TreeNode pred = curr.left;
            while (pred.right != null && pred.right != curr) pred = pred.right;
            if (pred.right == null) {
                pred.right = curr; curr = curr.left;
            } else {
                pred.right = null;
                out.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return out;
}
```

## code.cpp
```cpp
vector<int> morrisInorder(TreeNode* root) {
    vector<int> out;
    TreeNode* curr = root;
    while (curr) {
        if (!curr->left) {
            out.push_back(curr->val); curr = curr->right;
        } else {
            TreeNode* pred = curr->left;
            while (pred->right && pred->right != curr) pred = pred->right;
            if (!pred->right) {
                pred->right = curr; curr = curr->left;
            } else {
                pred->right = nullptr;
                out.push_back(curr->val);
                curr = curr->right;
            }
        }
    }
    return out;
}
```
