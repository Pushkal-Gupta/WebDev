---
slug: tree-vertical-traversal
module: trees
title: Binary Tree Vertical Order Traversal
subtitle: Group nodes by their column index — DFS with (col, row) tagging plus a final sort.
difficulty: Advanced
position: 14
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Section 3.2 Binary Search Trees"
    url: "https://algs4.cs.princeton.edu/32bst/"
    type: book
  - title: "Vertical Order Traversal of Binary Tree — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/print-binary-tree-vertical-order/"
    type: blog
  - title: "TheAlgorithms/Python — binary_tree_traversals.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/binary_tree/binary_tree_traversals.py"
    type: repo
status: published
---

## intro
Vertical order traversal asks: if you draw the tree on graph paper with the root at column 0, left child at column -1, right child at column +1, and so on, what do the nodes look like column by column, top to bottom, left to right? It's a small geometric reframing that turns a tree question into "group by column then sort within column."

## whyItMatters
Vertical-order shows up in tree-rendering, debug visualizers, and outline generators — anything that needs to align nodes spatially rather than structurally. As an interview problem it tests three things at once: tagging during traversal, deterministic tie-breaking, and a stable final sort. Candidates who confuse "BFS gives row order automatically" with "we don't need to sort" trip over the tie-breaking rule.

## intuition
Walk the tree and tag each node with two integers: `col` (relative horizontal position) and `row` (depth). Collect tags into a dictionary keyed by col. After traversal, sort each bucket by (row, value) and emit columns from leftmost col to rightmost col. The tree was traversed once; everything else is a deterministic re-grouping.

## visualization
Tree:
```
       3
      / \
     9   20
        /  \
       15   7
```
Tags: 3→(0,0), 9→(-1,1), 20→(1,1), 15→(0,2), 7→(2,2). Group by col: col -1: [(1,9)]; col 0: [(0,3), (2,15)]; col 1: [(1,20)]; col 2: [(2,7)]. Sorted output: [[9], [3, 15], [20], [7]].

## bruteForce
Pure BFS that records (col, row) tuples and pushes them into a hash map of col → list. Then iterate the columns in sorted order. Works in O(n log n) due to the column sort and is the clearest implementation. The subtle bug is forgetting that two nodes sharing both col and row must be ordered by value, not by insertion order — BFS happens to give insertion order, which is not the same thing.

## optimal
DFS that emits (col, row, value) triples into a flat list, sorted once at the end by (col, row, value). Bucket sequentially: start a new sub-list each time `col` changes. O(n log n) time dominated by the sort, O(n) space for the triples. Cleaner than BFS because the tie-breaking rule falls out of the sort key directly — no separate "sort within bucket" pass needed.

## complexity
time: O(n log n)
space: O(n)
notes: The sort is the bottleneck; everything else is linear. If columns are dense and bounded you can use counting-sort-style buckets to drop the log factor, but that's rarely worth the complexity.

## pitfalls
- Forgetting the tie-break: two nodes at (same col, same row) must be sorted by value. BFS insertion order is not equivalent.
- Using a regular dict and assuming sorted iteration — switch to sorted keys explicitly or to a TreeMap / std::map.
- Mixing up col deltas — left child is `col - 1`, right child is `col + 1`. A common bug is using +1/-1 reversed.
- Reporting row indices as part of the output — the question wants just values per column.

## interviewTips
- State the sort key out loud: "primary col, secondary row, tertiary value." Most candidates miss the third key and fail the hidden test.
- Distinguish this from "vertical sum" — same tagging, different aggregation.
- Mention the counting-sort optimization for credit if the interviewer asks about tighter complexity, but only after the O(n log n) version is on the board.

## code.python
```python
def vertical_order(root):
    if not root:
        return []
    triples = []
    def dfs(node, row, col):
        if not node:
            return
        triples.append((col, row, node.val))
        dfs(node.left, row + 1, col - 1)
        dfs(node.right, row + 1, col + 1)
    dfs(root, 0, 0)
    triples.sort()
    out, cur_col, bucket = [], None, []
    for col, row, val in triples:
        if col != cur_col:
            if bucket:
                out.append(bucket)
            cur_col, bucket = col, []
        bucket.append(val)
    if bucket:
        out.append(bucket)
    return out
```

## code.javascript
```javascript
function verticalOrder(root) {
  if (!root) return [];
  const triples = [];
  const dfs = (node, row, col) => {
    if (!node) return;
    triples.push([col, row, node.val]);
    dfs(node.left, row + 1, col - 1);
    dfs(node.right, row + 1, col + 1);
  };
  dfs(root, 0, 0);
  triples.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const out = [];
  let curCol = null, bucket = [];
  for (const [col, , val] of triples) {
    if (col !== curCol) {
      if (bucket.length) out.push(bucket);
      curCol = col;
      bucket = [];
    }
    bucket.push(val);
  }
  if (bucket.length) out.push(bucket);
  return out;
}
```

## code.java
```java
public List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    List<int[]> triples = new ArrayList<>();
    dfs(root, 0, 0, triples);
    triples.sort((a, b) -> {
        if (a[0] != b[0]) return a[0] - b[0];
        if (a[1] != b[1]) return a[1] - b[1];
        return a[2] - b[2];
    });
    int curCol = Integer.MIN_VALUE;
    List<Integer> bucket = new ArrayList<>();
    for (int[] t : triples) {
        if (t[0] != curCol) {
            if (!bucket.isEmpty()) out.add(bucket);
            curCol = t[0];
            bucket = new ArrayList<>();
        }
        bucket.add(t[2]);
    }
    if (!bucket.isEmpty()) out.add(bucket);
    return out;
}

private void dfs(TreeNode node, int row, int col, List<int[]> triples) {
    if (node == null) return;
    triples.add(new int[]{col, row, node.val});
    dfs(node.left, row + 1, col - 1, triples);
    dfs(node.right, row + 1, col + 1, triples);
}
```

## code.cpp
```cpp
void dfs(TreeNode* node, int row, int col, vector<tuple<int,int,int>>& triples) {
    if (!node) return;
    triples.emplace_back(col, row, node->val);
    dfs(node->left, row + 1, col - 1, triples);
    dfs(node->right, row + 1, col + 1, triples);
}

vector<vector<int>> verticalOrder(TreeNode* root) {
    vector<vector<int>> out;
    if (!root) return out;
    vector<tuple<int,int,int>> triples;
    dfs(root, 0, 0, triples);
    sort(triples.begin(), triples.end());
    int curCol = INT_MIN;
    vector<int> bucket;
    for (auto& [c, r, v] : triples) {
        if (c != curCol) {
            if (!bucket.empty()) out.push_back(bucket);
            curCol = c;
            bucket.clear();
        }
        bucket.push_back(v);
    }
    if (!bucket.empty()) out.push_back(bucket);
    return out;
}
```
