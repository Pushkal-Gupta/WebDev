---
slug: binary-tree-zigzag-level
module: trees
title: Binary Tree Zigzag Level Order
subtitle: Level-order traversal that alternates direction at each depth — left-to-right, then right-to-left.
difficulty: Intermediate
position: 13
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Section 3.2 Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "ZigZag Tree Traversal — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/zigzag-tree-traversal/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree_traversals.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_tree_traversals.py"
    type: repo
status: published
---

## intro
Zigzag level order is the standard breadth-first traversal with a twist: even-indexed levels go left-to-right, odd-indexed levels go right-to-left. The structure of the tree never changes; only the order in which we report values per level does. It's a common follow-up to plain level-order and a great test of whether a candidate can adapt a familiar template without overengineering.

## whyItMatters
Real reporting code often has to alternate or stripe outputs — think of "boustrophedon" rendering, alternating row direction in heatmaps, or snake-pattern matrix walks. The interview value is showing that you can keep BFS clean while adding state-dependent reordering, instead of writing two different traversals.

## intuition
Standard BFS pops nodes in left-to-right order at each level. To "zigzag," we either reverse the level list when the depth is odd, or use a double-ended queue and push children into different ends depending on parity. The tree itself is traversed identically — only output ordering toggles.

## visualization
Tree:
```
       3
      / \
     9   20
        /  \
       15   7
```
Level 0 (LTR): [3]. Level 1 (RTL): [20, 9]. Level 2 (LTR): [15, 7]. Result: [[3], [20, 9], [15, 7]]. Pictured: pen sweeping right, then left, then right — like writing a serpentine line across the page.

## bruteForce
Do an ordinary level-order BFS that collects per-level lists, then post-process: walk the result and reverse every odd-indexed list in place. O(n) time, O(n) space, and arguably the clearest solution. It's perfectly fine in an interview — the "optimization" of using a deque is more about taste than asymptotic gain.

## optimal
One-pass BFS with a depth toggle. Snapshot the queue size at each level, allocate a level array of that size, and on odd levels write into it in reverse order (index `size - 1 - i`). This avoids a second pass over each level list while keeping the code as simple as plain BFS. Same O(n) time, same O(n) space, but cleaner constant factor.

## complexity
time: O(n)
space: O(n)
notes: Each node is enqueued and dequeued exactly once. The output stores every value exactly once. The queue peaks at the widest level — up to n/2 for a balanced tree's last level.

## pitfalls
- Toggling direction every iteration of the inner for-loop instead of once per level — produces interleaved garbage.
- Using a single shared list and `list.reverse()` after appending — works but you must reverse *after* enqueuing children, not before.
- Starting with `leftToRight = false` and getting the parity off by one — the root level is level 0, which is left-to-right.
- Forgetting that the *children* you enqueue still go in standard left-then-right order; only the *output collection* flips.

## interviewTips
- Lead with "this is BFS with a parity flag" — interviewers love when you frame a problem as a small delta on a known template.
- Mention the deque alternative for credit; you do not have to actually code it.
- If asked for k-zigzag (alternate every k levels) you only swap the parity check `depth % 2 == 0` for `(depth // k) % 2 == 0` — show that you see the generalization.

## code.python
```python
from collections import deque

def zigzag_level_order(root):
    if not root:
        return []
    out, q, ltr = [], deque([root]), True
    while q:
        size = len(q)
        level = [0] * size
        for i in range(size):
            node = q.popleft()
            level[i if ltr else size - 1 - i] = node.val
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level)
        ltr = not ltr
    return out
```

## code.javascript
```javascript
function zigzagLevelOrder(root) {
  if (!root) return [];
  const out = [], q = [root];
  let ltr = true;
  while (q.length) {
    const size = q.length;
    const level = new Array(size);
    for (let i = 0; i < size; i++) {
      const node = q.shift();
      level[ltr ? i : size - 1 - i] = node.val;
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    out.push(level);
    ltr = !ltr;
  }
  return out;
}
```

## code.java
```java
public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    boolean ltr = true;
    while (!q.isEmpty()) {
        int size = q.size();
        Integer[] level = new Integer[size];
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            level[ltr ? i : size - 1 - i] = node.val;
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
        out.add(Arrays.asList(level));
        ltr = !ltr;
    }
    return out;
}
```

## code.cpp
```cpp
vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
    vector<vector<int>> out;
    if (!root) return out;
    queue<TreeNode*> q;
    q.push(root);
    bool ltr = true;
    while (!q.empty()) {
        int size = q.size();
        vector<int> level(size);
        for (int i = 0; i < size; i++) {
            TreeNode* node = q.front(); q.pop();
            level[ltr ? i : size - 1 - i] = node->val;
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        out.push_back(level);
        ltr = !ltr;
    }
    return out;
}
```
