---
slug: tree-right-side-view
module: trees
title: Binary Tree Right Side View
subtitle: Return the rightmost node at each depth — BFS last-of-level or DFS preorder right-first.
difficulty: Intermediate
position: 12
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Section 3.2 Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "Right View of a Binary Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/print-right-view-binary-tree-2/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree_traversals.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_tree_traversals.py"
    type: repo
status: published
---

## intro
The right side view of a binary tree is what you would see if you stood to the right of the tree and looked at it: the rightmost node at every depth. It tests whether you can think about a tree "by depth" rather than "by branch" and choose between two equally valid traversals — level-order BFS or preorder DFS — that arrive at the same answer through different routes.

## whyItMatters
Many "by-depth" tree questions reduce to one of these two skeletons: bottom-of-each-level, left view, average per level, max per level, sum per level. Master the right-side view and you essentially own the entire family. It also exercises the subtle point that DFS can serve "level-order intent" cleanly if you visit children in the right order.

## intuition
Two ways to picture it. BFS: sweep the tree depth by depth like a row in a stadium; whoever sits on the rightmost seat at each row is visible. DFS variant: go down the tree always trying right first; the first node you reach at each new depth is, by construction, the rightmost — record it and never overwrite.

## visualization
Tree:
```
       1
      / \
     2   3
      \   \
       5   4
```
BFS: level 0 = [1] → 1; level 1 = [2, 3] → 3; level 2 = [5, 4] → 4. Result [1, 3, 4]. DFS right-first: visit 1 (depth 0, record); 3 (depth 1, record); 4 (depth 2, record); backtrack to 2 (depth 1, already have one); 5 (depth 2, already have one). Same result.

## bruteForce
Do a plain level-order traversal that collects entire levels into a list of lists, then post-process by taking the last element of each list. Correct, O(n) time, O(n) space — but it builds intermediate structures you immediately throw away. Fine as a first pass; in an interview, refine to record only the last node per level on the fly.

## optimal
BFS with queue + level-size loop: at the start of each level, snapshot the queue size, dequeue exactly that many nodes, and append the value of the last one popped to the answer. DFS recursive: pass current depth, visit right subtree before left, and append to the answer whenever `depth == len(answer)`. Both run in O(n) time, O(h) recursion or O(w) queue space.

## complexity
time: O(n)
space: O(h) for DFS recursion or O(w) for BFS queue, where h is height and w is the max width.
notes: A balanced tree gives h = log n and w ≈ n/2. A skewed tree gives h = n and w = 1, so DFS becomes the cheaper option there.

## pitfalls
- Visiting left before right in DFS — you end up with the left view instead.
- Forgetting to enqueue both children in BFS — leads to silently truncated answers.
- Using `len(queue)` mid-level (after enqueuing new children) instead of snapshotting at the start.
- Off-by-one when checking depth in DFS: `depth == len(answer)` is the correct "first time at this depth" predicate.

## interviewTips
- Offer both solutions and ask which the interviewer wants explained more deeply; this signals fluency in DFS↔BFS conversions.
- Mention that swapping "right before left" gives you the left view for free — a common follow-up.
- Be explicit about why DFS works: the first arrival at each depth, with right-first ordering, is necessarily the rightmost node at that depth.

## code.python
```python
from collections import deque

def right_side_view_bfs(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        size = len(q)
        for i in range(size):
            node = q.popleft()
            if i == size - 1:
                out.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return out

def right_side_view_dfs(root):
    out = []
    def go(node, depth):
        if not node:
            return
        if depth == len(out):
            out.append(node.val)
        go(node.right, depth + 1)
        go(node.left, depth + 1)
    go(root, 0)
    return out
```

## code.javascript
```javascript
function rightSideViewBfs(root) {
  if (!root) return [];
  const out = [], q = [root];
  while (q.length) {
    const size = q.length;
    for (let i = 0; i < size; i++) {
      const node = q.shift();
      if (i === size - 1) out.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
  }
  return out;
}

function rightSideViewDfs(root) {
  const out = [];
  const go = (node, depth) => {
    if (!node) return;
    if (depth === out.length) out.push(node.val);
    go(node.right, depth + 1);
    go(node.left, depth + 1);
  };
  go(root, 0);
  return out;
}
```

## code.java
```java
public List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            if (i == size - 1) out.add(node.val);
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
    }
    return out;
}

public List<Integer> rightSideViewDfs(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    dfs(root, 0, out);
    return out;
}

private void dfs(TreeNode node, int depth, List<Integer> out) {
    if (node == null) return;
    if (depth == out.size()) out.add(node.val);
    dfs(node.right, depth + 1, out);
    dfs(node.left, depth + 1, out);
}
```

## code.cpp
```cpp
vector<int> rightSideViewBfs(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* node = q.front(); q.pop();
            if (i == size - 1) out.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return out;
}

void dfs(TreeNode* node, int depth, vector<int>& out) {
    if (!node) return;
    if ((int)out.size() == depth) out.push_back(node->val);
    dfs(node->right, depth + 1, out);
    dfs(node->left, depth + 1, out);
}

vector<int> rightSideViewDfs(TreeNode* root) {
    vector<int> out;
    dfs(root, 0, out);
    return out;
}
```
