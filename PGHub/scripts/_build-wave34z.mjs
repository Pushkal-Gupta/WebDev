#!/usr/bin/env node
// Build WAVE 34Z: find-mode-in-binary-search-tree + minimum-distance-between-bst-nodes
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ---------- Shared tree helpers (LC-array <-> in-memory tree) ----------
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Parse a LeetCode-style level-order array (with nulls) into a TreeNode root.
function fromLcArray(arr) {
  if (!arr || arr.length === 0) return null;
  if (arr[0] === null || arr[0] === undefined) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length > 0 && i < arr.length) {
    const node = q.shift();
    // left
    if (i < arr.length) {
      const v = arr[i++];
      if (v !== null && v !== undefined) {
        node.left = new TreeNode(v);
        q.push(node.left);
      }
    }
    // right
    if (i < arr.length) {
      const v = arr[i++];
      if (v !== null && v !== undefined) {
        node.right = new TreeNode(v);
        q.push(node.right);
      }
    }
  }
  return root;
}

// Insert val into a BST (no duplicates allowed except for findMode, which
// stores duplicates by walking left when equal — we replicate LC convention).
function bstInsertNoDup(root, val) {
  if (root === null) return new TreeNode(val);
  let cur = root;
  while (true) {
    if (val < cur.val) {
      if (cur.left === null) { cur.left = new TreeNode(val); return root; }
      cur = cur.left;
    } else if (val > cur.val) {
      if (cur.right === null) { cur.right = new TreeNode(val); return root; }
      cur = cur.right;
    } else {
      return root; // duplicate ignored
    }
  }
}

// Insert val into a BST allowing duplicates by walking to the right when equal.
function bstInsertAllowDup(root, val) {
  if (root === null) return new TreeNode(val);
  let cur = root;
  while (true) {
    if (val < cur.val) {
      if (cur.left === null) { cur.left = new TreeNode(val); return root; }
      cur = cur.left;
    } else {
      // equal or greater goes right
      if (cur.right === null) { cur.right = new TreeNode(val); return root; }
      cur = cur.right;
    }
  }
}

// Serialize an in-memory tree back to LC-array form (trims trailing nulls).
function toLcArray(root) {
  if (root === null) return [];
  const out = [];
  const q = [root];
  while (q.length > 0) {
    const node = q.shift();
    if (node === null) {
      out.push(null);
    } else {
      out.push(node.val);
      q.push(node.left);
      q.push(node.right);
    }
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

// ============================================================
// PROBLEM 1: find-mode-in-binary-search-tree (LC 501)
//   findMode(root: TreeNode) -> List[int]
//   Return all modes (most frequently occurring values) in a BST with duplicates.
//   Order: spec says "any order"; we standardize on SORTED ascending so the
//   registry's expected string is canonical and matches Python's `sorted(...)`.
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F359A);

  function ref(arr) {
    const root = fromLcArray(arr);
    if (root === null) return [];
    // Inorder traversal to collect values; count consecutive equals as runs.
    const counts = new Map();
    const stack = [];
    let cur = root;
    while (cur !== null || stack.length > 0) {
      while (cur !== null) {
        stack.push(cur);
        cur = cur.left;
      }
      cur = stack.pop();
      counts.set(cur.val, (counts.get(cur.val) || 0) + 1);
      cur = cur.right;
    }
    let best = 0;
    for (const c of counts.values()) if (c > best) best = c;
    const out = [];
    for (const [v, c] of counts.entries()) if (c === best) out.push(v);
    out.sort((a, b) => a - b);
    return out;
  }

  // Helper: build a BST (with duplicates allowed) from a list of values.
  function buildBstFromValues(values) {
    let root = null;
    for (const v of values) root = bstInsertAllowDup(root, v);
    return root;
  }

  const cases = [];

  // Canonical LC sample 1: [1,null,2,2] -> [2]
  cases.push([1, null, 2, 2]);
  // Single mode, root only
  cases.push([0]);
  // Empty tree
  cases.push([]);
  // Two equal nodes (root and right == root)
  cases.push([1, null, 1]);
  // Two distinct nodes -> both are modes (tie at count 1)
  cases.push([2, 1]);
  // Three distinct nodes -> all modes
  cases.push([2, 1, 3]);
  // BST with one dominant mode
  cases.push(toLcArray(buildBstFromValues([5, 3, 7, 3, 3, 7])));
  // Tie between two values
  cases.push(toLcArray(buildBstFromValues([4, 2, 6, 2, 6])));
  // All same value
  cases.push(toLcArray(buildBstFromValues([7, 7, 7, 7])));
  // Skewed left chain with one mode
  cases.push(toLcArray(buildBstFromValues([10, 5, 5, 3, 3, 3])));
  // Skewed right chain with one mode
  cases.push(toLcArray(buildBstFromValues([1, 2, 2, 4, 4, 4])));
  // Tie at three values
  cases.push(toLcArray(buildBstFromValues([1, 2, 3])));
  // Mode is the smallest value
  cases.push(toLcArray(buildBstFromValues([5, 1, 1, 1, 3, 7])));
  // Mode is the largest value
  cases.push(toLcArray(buildBstFromValues([5, 9, 9, 9, 7, 3])));
  // Negative values
  cases.push(toLcArray(buildBstFromValues([-1, -3, -3, -3, 0, 2])));
  // Zero mixed with positives
  cases.push(toLcArray(buildBstFromValues([0, 0, 0, 1, 2, 3])));
  // Two values, one with count 3, one with count 2
  cases.push(toLcArray(buildBstFromValues([5, 5, 5, 8, 8])));
  // Two values, both count 2 (tie)
  cases.push(toLcArray(buildBstFromValues([5, 5, 8, 8])));
  // Distinct values arranged as balanced BST
  cases.push([4, 2, 6, 1, 3, 5, 7]);
  // Balanced BST with one value doubled inside
  cases.push(toLcArray(buildBstFromValues([4, 2, 6, 1, 3, 3, 5, 7])));
  // Mode count == 4
  cases.push(toLcArray(buildBstFromValues([1, 1, 1, 1, 2, 3, 4])));
  // Single value repeated 10 times
  cases.push(toLcArray(buildBstFromValues([42, 42, 42, 42, 42, 42, 42, 42, 42, 42])));
  // Sequence with two interleaved tied modes
  cases.push(toLcArray(buildBstFromValues([1, 2, 1, 2, 3])));
  // Larger tree, one clear mode
  cases.push(toLcArray(buildBstFromValues([10, 5, 15, 3, 7, 12, 18, 7, 7])));
  // Negative + zero + positive mix
  cases.push(toLcArray(buildBstFromValues([-5, -2, -2, 0, 3, 3])));
  // Long chain of equal values (right-skewed)
  cases.push(toLcArray(buildBstFromValues([1, 1, 1, 1, 1, 1, 1])));

  // Random LCG-generated BSTs
  while (cases.length < 30) {
    const n = 3 + (lcg() % 12);
    const values = [];
    for (let i = 0; i < n; i++) {
      // Small value range so duplicates are likely
      const v = (lcg() % 11) - 5;
      values.push(v);
    }
    const tree = buildBstFromValues(values);
    cases.push(toLcArray(tree));
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: JSON.stringify(ref(arr))
  }));

  return {
    slug: "find-mode-in-binary-search-tree",
    obj: {
      description: "Given the `root` of a binary search tree (BST) with **duplicates**, return all the **mode(s)** (i.e., the most frequently occurring element) in it.\n\nIf the tree has more than one mode, return them in **any order**. This registry standardizes on **sorted ascending** so the grader's expected output is canonical; the reference implementations sort before returning.\n\nAssume a BST is defined as follows:\n- The left subtree of a node contains only nodes with keys **less than or equal to** the node's key.\n- The right subtree of a node contains only nodes with keys **greater than or equal to** the node's key.\n- Both the left and right subtrees must also be binary search trees.\n\n**Example 1**\n\n```\nInput:  root = [1,null,2,2]\nOutput: [2]\n```\n\n**Example 2**\n\n```\nInput:  root = [0]\nOutput: [0]\n```\n\nThis is **LeetCode 501**. The canonical solution does an **inorder traversal** — which visits values in non-decreasing order on a BST — and tracks the **current run length** of equal values, comparing it against the best run length seen so far. A two-pass version (first pass to find the max count, second pass to collect values that hit it) is also classical.",
      method_name: "findMode",
      params: [
        { name: "root", type: "TreeNode" }
      ],
      return_type: "List[int]",
      tags: ["tree", "depth-first-search", "binary-search-tree", "binary-tree", "inorder", "morris"],
      pattern: "**Inorder traversal collapses the problem to 'longest run of equal values in a sorted sequence'.** On a BST (even one with duplicates), an inorder walk yields the values in **non-decreasing order**. Equal values therefore appear in consecutive positions, and counting modes reduces to scanning a sorted list for the longest constant-value run.\n\n**Two-pass solution.** Pass 1: traverse and tally counts in a `HashMap<int, int>`, then find the global maximum count. Pass 2: traverse again and emit every value whose count equals the max. This is `O(n)` time and `O(n)` extra space, but it does not exploit the BST structure at all.\n\n**One-pass with O(1) extra space (the canonical solution).** Walk the tree inorder. Maintain four variables:\n- `prev` — the value of the previous node visited (or sentinel `None` initially).\n- `curCount` — length of the current run of equal values.\n- `maxCount` — best run length seen so far.\n- `modes` — list of values that hit `maxCount`.\n\n```\nprev = None\ncurCount = 0\nmaxCount = 0\nmodes = []\n\ndef visit(val):\n    nonlocal prev, curCount, maxCount, modes\n    if val == prev: curCount += 1\n    else:           curCount = 1\n    prev = val\n    if curCount > maxCount:\n        maxCount = curCount\n        modes = [val]\n    elif curCount == maxCount:\n        modes.append(val)\n\ninorder(root, visit)\nreturn sorted(modes)\n```\n\n**Why it works.** Because inorder visits values in non-decreasing order, equal values are visited back-to-back. When `val == prev`, we are extending the current run; otherwise, we are starting a new run. The mode list is reset to `[val]` whenever the current run **exceeds** the max, and appended to when the current run **ties** the max.\n\n**Tie-break correctness.** The first time a new max is reached, `modes` is cleared and `val` added. Subsequent values that also hit `maxCount` are appended. Since inorder visits values in sorted order, the natural collection order is also sorted ascending — sorting at the end is technically redundant but defensive (kept for portability across stack-vs-recursion implementations).\n\n**Morris inorder for true O(1) extra space.** A standard recursive inorder uses `O(h)` stack frames (`O(log n)` balanced, `O(n)` skewed). Morris traversal threads each predecessor's right pointer to its successor, removing the stack entirely. The trade is a small constant-factor slowdown and temporarily mutating the tree (restored before completion). For interview answers, mentioning Morris is the differentiator.\n\n**Edge cases.** Empty tree (`root == null`): return `[]`. Single node: return `[root.val]`. All same value: return `[root.val]` with count `n`. All distinct values: every value is a mode (each count = 1); the result is the sorted set of values.\n\n**Brute-force comparison.** `O(n^2)` — for each value, traverse the tree and count occurrences. Useless above `n ~= 10^4`. The `HashMap` two-pass is the standard `O(n)` time + `O(n)` space baseline; the inorder-streak refinement matches the time bound with `O(1)` aux (Morris) or `O(h)` aux (recursive).",
      follow_up: "**Variant 1 — top-k most frequent values.** Replace the streak tracking with a `MinHeap<(count, val)>` of size `k`; finalize each run by pushing `(count, val)` onto the heap and trimming to size `k`. `O(n log k)`.\n\n**Variant 2 — mode by frequency in a stream of inserts.** Maintain a `HashMap<int, int>` count plus a `TreeMap<int, Set<int>>` from count to values. Each insert is `O(log n)`; mode query is the top entry of the tree map.\n\n**Variant 3 — mode in a general binary tree (NOT a BST).** The inorder-streak trick breaks because equal values are no longer adjacent. Fall back to the two-pass `HashMap` solution.\n\n**Variant 4 — mode in a BST with no duplicates.** Every value has count 1; every value is a mode. The answer is the entire inorder traversal.\n\n**Variant 5 — k-th most frequent value.** Same `HashMap` count, then `nth_element` or a heap of size `k` on the counts. `O(n)` average.\n\n**Variant 6 — mode of subtree rooted at a given node.** Each node owns its own inorder window; the algorithm is parameterized by the subtree root. The streak trick still applies inside the subtree.\n\n**Implementation pitfalls.**\n1. **Forgetting to reset `curCount = 1` (not 0) when the value changes.** A new value starts a new run of length 1, not 0.\n2. **Comparing against `prev` before `prev` has been set.** Use `None` / sentinel and guard the first visit so it never matches.\n3. **Clearing `modes` on ties.** Clearing should happen only when `curCount > maxCount`, not on `curCount == maxCount`.\n4. **Using preorder or postorder instead of inorder.** Equal values are no longer consecutive — the streak trick fails.\n5. **Returning the modes in arbitrary insertion order.** LC accepts any order, but our grader compares to a canonical sorted list — always sort before returning.\n6. **Forgetting the empty-tree case.** A `null` root means no values exist; the answer is `[]`, not a crash on `prev` access.\n7. **Mutating the tree in Morris traversal without restoring.** The thread pointers must be cleared on the second pass through each predecessor; otherwise the BST is left in a corrupted state.",
      complexity: {
        time: "**O(n)** where `n` is the number of nodes. Inorder visits each node exactly once; updating the streak and modes is `O(1)` per node (amortized, since `modes` resets on a new max take constant total work across the traversal).",
        space: "**O(h)** for the recursion stack with a recursive inorder, where `h` is the tree height. `O(log n)` for a balanced BST, `O(n)` for a skewed one. With **Morris traversal**, auxiliary space drops to `O(1)`. The output list adds `O(m)` for `m` distinct modes.",
        notes: "The two-pass `HashMap` solution is `O(n)` time and `O(n)` extra space — strictly worse than the one-pass inorder-streak solution on memory. The `HashMap` form is more flexible for follow-ups (top-k, generalized binary tree) and is often preferred in practice.",
        optimal: "**O(n) time is tight** — any algorithm must inspect every node to know whether it contributes to a mode. **O(1) auxiliary space (Morris)** matches the information-theoretic lower bound for the streak tracker."
      },
      constraints: [
        "0 <= number of nodes <= 10^4",
        "-10^5 <= Node.val <= 10^5",
        "The tree is a BST that may contain duplicates",
        "Return all modes; this registry returns them sorted ascending"
      ],
      hints: [
        "**Inorder traversal of a BST yields values in non-decreasing order.** Duplicates therefore appear consecutively — the problem collapses to finding the longest constant-value run in a sorted sequence.",
        "**Track four pieces of state during inorder:** `prev` (last value seen), `curCount` (length of the current run), `maxCount` (best run length so far), `modes` (list of values that hit `maxCount`).",
        "**On a new value, reset `curCount = 1`.** On an equal value, increment it.",
        "**When `curCount > maxCount`, clear `modes` and add the new value.** When `curCount == maxCount`, append the value (do NOT clear).",
        "**Morris inorder gives O(1) extra space** if you want to brag in an interview — recursive inorder uses O(h) for the call stack.",
        "**Empty-tree case: return `[]`.** Single-node: return `[root.val]`."
      ],
      test_cases,
      solutions: {
        python: "from typing import List, Optional\n\n# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\n\nclass Solution:\n    def findMode(self, root: Optional['TreeNode']) -> List[int]:\n        if root is None:\n            return []\n        modes = []\n        prev = None\n        cur_count = 0\n        max_count = 0\n        stack = []\n        cur = root\n        while cur is not None or stack:\n            while cur is not None:\n                stack.append(cur)\n                cur = cur.left\n            cur = stack.pop()\n            if prev is not None and cur.val == prev:\n                cur_count += 1\n            else:\n                cur_count = 1\n            if cur_count > max_count:\n                max_count = cur_count\n                modes = [cur.val]\n            elif cur_count == max_count:\n                modes.append(cur.val)\n            prev = cur.val\n            cur = cur.right\n        return sorted(modes)\n",
        javascript: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\nvar findMode = function(root) {\n    if (!root) return [];\n    let modes = [];\n    let prev = null;\n    let curCount = 0;\n    let maxCount = 0;\n    const stack = [];\n    let cur = root;\n    while (cur !== null || stack.length > 0) {\n        while (cur !== null) {\n            stack.push(cur);\n            cur = cur.left;\n        }\n        cur = stack.pop();\n        if (prev !== null && cur.val === prev) {\n            curCount++;\n        } else {\n            curCount = 1;\n        }\n        if (curCount > maxCount) {\n            maxCount = curCount;\n            modes = [cur.val];\n        } else if (curCount === maxCount) {\n            modes.push(cur.val);\n        }\n        prev = cur.val;\n        cur = cur.right;\n    }\n    return modes.slice().sort((a, b) => a - b);\n};\n",
        java: "import java.util.*;\n\n/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\npublic class Solution {\n    public int[] findMode(TreeNode root) {\n        if (root == null) return new int[0];\n        List<Integer> modes = new ArrayList<>();\n        Integer prev = null;\n        int curCount = 0;\n        int maxCount = 0;\n        Deque<TreeNode> stack = new ArrayDeque<>();\n        TreeNode cur = root;\n        while (cur != null || !stack.isEmpty()) {\n            while (cur != null) {\n                stack.push(cur);\n                cur = cur.left;\n            }\n            cur = stack.pop();\n            if (prev != null && cur.val == prev) {\n                curCount++;\n            } else {\n                curCount = 1;\n            }\n            if (curCount > maxCount) {\n                maxCount = curCount;\n                modes.clear();\n                modes.add(cur.val);\n            } else if (curCount == maxCount) {\n                modes.add(cur.val);\n            }\n            prev = cur.val;\n            cur = cur.right;\n        }\n        Collections.sort(modes);\n        int[] out = new int[modes.size()];\n        for (int i = 0; i < modes.size(); i++) out[i] = modes.get(i);\n        return out;\n    }\n}\n",
        cpp: "#include <vector>\n#include <stack>\n#include <algorithm>\nusing namespace std;\n\n/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}\n * };\n */\nclass Solution {\npublic:\n    vector<int> findMode(TreeNode* root) {\n        vector<int> modes;\n        if (root == nullptr) return modes;\n        bool havePrev = false;\n        int prev = 0;\n        int curCount = 0;\n        int maxCount = 0;\n        stack<TreeNode*> st;\n        TreeNode* cur = root;\n        while (cur != nullptr || !st.empty()) {\n            while (cur != nullptr) {\n                st.push(cur);\n                cur = cur->left;\n            }\n            cur = st.top(); st.pop();\n            if (havePrev && cur->val == prev) {\n                curCount++;\n            } else {\n                curCount = 1;\n            }\n            if (curCount > maxCount) {\n                maxCount = curCount;\n                modes.clear();\n                modes.push_back(cur->val);\n            } else if (curCount == maxCount) {\n                modes.push_back(cur->val);\n            }\n            prev = cur->val;\n            havePrev = true;\n            cur = cur->right;\n        }\n        sort(modes.begin(), modes.end());\n        return modes;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: minimum-distance-between-bst-nodes (LC 783)
//   minDiffInBST(root: TreeNode) -> int
//   Return the minimum difference between the values of ANY two different
//   nodes in the BST.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F359B);

  function ref(arr) {
    const root = fromLcArray(arr);
    if (root === null) return 0; // LC guarantees >= 2 nodes; defensive default
    const stack = [];
    let cur = root;
    let prev = null;
    let best = Infinity;
    while (cur !== null || stack.length > 0) {
      while (cur !== null) {
        stack.push(cur);
        cur = cur.left;
      }
      cur = stack.pop();
      if (prev !== null) {
        const d = cur.val - prev;
        if (d < best) best = d;
      }
      prev = cur.val;
      cur = cur.right;
    }
    return best === Infinity ? 0 : best;
  }

  function buildBstFromValues(values) {
    let root = null;
    for (const v of values) root = bstInsertNoDup(root, v);
    return root;
  }

  const cases = [];

  // Canonical LC sample 1: [4,2,6,1,3] -> 1
  cases.push([4, 2, 6, 1, 3]);
  // Canonical LC sample 2: [1,0,48,null,null,12,49] -> 1
  cases.push([1, 0, 48, null, null, 12, 49]);
  // Two-node tree: root + left child
  cases.push([5, 3]);
  // Two-node tree: root + right child
  cases.push([5, null, 8]);
  // Three balanced
  cases.push([10, 5, 15]);
  // Three skewed left
  cases.push([10, 5, null, 3]);
  // Three skewed right
  cases.push([10, null, 15, null, 20]);
  // Adjacent values give diff 1
  cases.push(toLcArray(buildBstFromValues([5, 4, 6])));
  // Far-apart values
  cases.push(toLcArray(buildBstFromValues([100, 1, 200])));
  // Larger balanced tree
  cases.push(toLcArray(buildBstFromValues([8, 4, 12, 2, 6, 10, 14])));
  // Tree with values 1..7
  cases.push(toLcArray(buildBstFromValues([4, 2, 6, 1, 3, 5, 7])));
  // Tree with very close pair embedded
  cases.push(toLcArray(buildBstFromValues([50, 25, 75, 10, 26, 60, 90])));
  // Negative + positive
  cases.push(toLcArray(buildBstFromValues([0, -5, 5, -10, -1, 1, 10])));
  // All values near zero
  cases.push(toLcArray(buildBstFromValues([0, -1, 1])));
  // Two adjacent integers
  cases.push(toLcArray(buildBstFromValues([7, 6])));
  // Powers of two
  cases.push(toLcArray(buildBstFromValues([8, 4, 16, 2, 32, 1])));
  // Sequence with min diff at the right end
  cases.push(toLcArray(buildBstFromValues([100, 50, 200, 25, 75, 199, 201])));
  // Sequence with min diff at the left end
  cases.push(toLcArray(buildBstFromValues([100, 50, 200, 49, 51, 175])));
  // Larger tree with min diff in the middle
  cases.push(toLcArray(buildBstFromValues([20, 10, 30, 5, 15, 25, 35, 14, 16])));
  // Single chain right-skewed
  cases.push(toLcArray(buildBstFromValues([1, 4, 9, 16, 25])));
  // Single chain left-skewed
  cases.push(toLcArray(buildBstFromValues([100, 80, 60, 40, 20])));
  // Pair difference of exactly 2
  cases.push(toLcArray(buildBstFromValues([10, 8, 12, 6, 14])));
  // Min diff of 3
  cases.push(toLcArray(buildBstFromValues([20, 17, 23, 14, 26])));
  // Tree with min diff of 1 buried deep
  cases.push(toLcArray(buildBstFromValues([50, 30, 70, 20, 40, 60, 80, 39, 41])));
  // Negative-only tree
  cases.push(toLcArray(buildBstFromValues([-10, -20, -5, -25, -15, -7, -3])));

  // Random BSTs (no duplicates so diffs are well-defined)
  while (cases.length < 30) {
    const n = 2 + (lcg() % 10);
    const seen = new Set();
    const values = [];
    while (values.length < n) {
      const v = (lcg() % 201) - 100; // [-100, 100]
      if (!seen.has(v)) {
        seen.add(v);
        values.push(v);
      }
    }
    cases.push(toLcArray(buildBstFromValues(values)));
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: JSON.stringify(ref(arr))
  }));

  return {
    slug: "minimum-distance-between-bst-nodes",
    obj: {
      description: "Given the `root` of a Binary Search Tree (BST), return the **minimum difference** between the values of any two different nodes in the tree.\n\n**Example 1**\n\n```\nInput:  root = [4,2,6,1,3]\nOutput: 1\nExplanation: The minimum difference is between 2 and 1 (or 3 and 2, etc.).\n```\n\n**Example 2**\n\n```\nInput:  root = [1,0,48,null,null,12,49]\nOutput: 1\nExplanation: The minimum difference is between 0 and 1.\n```\n\nThis is **LeetCode 783** — and is identical in solution to **LC 530 (Minimum Absolute Difference in BST)**. The canonical solution exploits the fact that an **inorder traversal of a BST yields the values in non-decreasing order**, so the minimum difference is the minimum of adjacent differences in that sorted sequence.",
      method_name: "minDiffInBST",
      params: [
        { name: "root", type: "TreeNode" }
      ],
      return_type: "int",
      tags: ["tree", "depth-first-search", "binary-search-tree", "binary-tree", "inorder"],
      pattern: "**Inorder traversal of a BST is a sorted stream — the minimum difference lives between adjacent inorder neighbors.**\n\n**Why adjacency is sufficient.** Suppose the minimum difference were between two non-adjacent inorder positions `i` and `j` with `i + 1 < j`. The inorder sequence is non-decreasing, so `a[j] - a[i] >= a[i+1] - a[i]` (because `a[j] >= a[i+1]`). The pair `(i, i+1)` gives a difference at least as small as the pair `(i, j)` — contradiction. Therefore the minimum is always between two adjacent inorder values.\n\n**The minimal-state algorithm.** Stream inorder values one at a time. Maintain two variables:\n- `prev` — the value of the previously visited inorder node (or `None` for the first visit).\n- `best` — the minimum adjacent difference seen so far (initialized to `+infinity`).\n\nOn each visit:\n\n```\nif prev is not None:\n    best = min(best, cur.val - prev)\nprev = cur.val\n```\n\nReturn `best`.\n\n**Why `cur.val - prev` and not `abs(cur.val - prev)`.** Inorder on a BST yields non-decreasing values, so `cur.val - prev >= 0` always. The absolute value is unnecessary — but harmless if you prefer it for defense.\n\n**Three implementations.**\n1. **Recursive inorder with closure / mutable state.** Cleanest in Python; in Java/C++ uses a class field or array-of-one trick.\n2. **Iterative inorder with explicit stack.** Avoids recursion limits on skewed trees. This is the reference implementation in this registry.\n3. **Morris inorder.** `O(1)` aux space; threads each predecessor's right pointer temporarily. Strongest answer for an interview that asks about space.\n\n**Why the inorder-streak trick is asymptotically optimal.** Any algorithm must inspect every node to know whether it contributes to the global minimum, so `Omega(n)` time is unavoidable. The single-pass streak matches it.\n\n**Brute-force comparison.** Collect all values, sort, scan adjacent diffs: `O(n log n)` time, `O(n)` extra space. Skips the BST insight; works on any tree. Pair-wise compare every two nodes: `O(n^2)` — useless above `n ~= 10^4`.\n\n**Edge cases.**\n- The tree has exactly two nodes — the answer is the difference of their values.\n- All values are positive / all negative / span zero — the algorithm is sign-agnostic; only the inorder ordering matters.\n- Skewed trees (left-only or right-only chains) — iterative inorder or Morris are essential; recursive inorder can stack-overflow.\n- The BST contains duplicates (not allowed by this problem, but worth noting) — adjacent diff of 0 would be the answer."
,
      follow_up: "**Variant 1 — minimum diff in a general (non-BST) binary tree.** The inorder trick fails because inorder is no longer sorted. Collect all values via any traversal, sort, then scan adjacents: `O(n log n)`.\n\n**Variant 2 — minimum diff with a constraint that the pair has different colors / depths / labels.** The simple inorder no longer works. Build a sorted list with labels, then sweep adjacent pairs and skip same-label pairs; or, for small label counts, do one sweep per label.\n\n**Variant 3 — k smallest differences.** Use a min-heap keyed on adjacent diffs; extract k times.\n\n**Variant 4 — minimum diff in a stream of inserts.** Maintain a `TreeSet` / balanced BST; each insert performs two `O(log n)` lookups (predecessor and successor) and updates the global min. `O(n log n)` total.\n\n**Variant 5 — maximum diff between BST values.** Trivial: `root_max - root_min`, found by walking right and left respectively. `O(h)`.\n\n**Variant 6 — minimum diff with the constraint that the pair is on the same root-to-leaf path.** Equivalent to running the algorithm on each path independently; can be done in a single DFS with a sorted multiset per path frame.\n\n**Implementation pitfalls.**\n1. **Using preorder or postorder.** Equal-adjacency no longer holds; the algorithm reports a wrong answer.\n2. **Forgetting to handle the first inorder visit.** `prev` must start as `None` (or use a `havePrev` flag). Comparing `cur.val - prev` with `prev` unset gives `cur.val - 0 = cur.val`, which can be a spurious small diff if `cur.val` is small and positive.\n3. **Initializing `best` to `0` instead of `+infinity`.** Then `best` never updates upward; you would return `0` for valid trees with no zero adjacent diff.\n4. **Recursive inorder on a skewed tree of 10^4 nodes.** Default Python recursion limit is 1000; this stack-overflows. Use iterative inorder or `sys.setrecursionlimit`.\n5. **Mixing `abs()` with the BST inorder.** `cur.val - prev` is already non-negative; `abs` adds no information but obscures intent.\n6. **Mutating the tree in Morris traversal without restoring.** The thread pointers must be cleared on the second pass; otherwise the tree is corrupted.\n7. **Returning `int_min` when the tree has fewer than 2 nodes.** LC guarantees `>= 2`; this registry guards with `0` as a defensive default but never exercises that branch in shipped tests.",
      complexity: {
        time: "**O(n)** where `n` is the number of nodes. Inorder visits each node exactly once; the per-node work (one subtraction, one min-update) is `O(1)`.",
        space: "**O(h)** for the explicit stack with iterative inorder, where `h` is the tree height. `O(log n)` for a balanced BST, `O(n)` for a skewed one. **Morris traversal** drops this to `O(1)`. Output is a single integer — `O(1)`.",
        notes: "The collect-and-sort approach is `O(n log n)` time + `O(n)` space; strictly worse on time AND space. The pair-wise brute force is `O(n^2)` — never use it.",
        optimal: "**O(n) time is tight** — every node must be inspected. **O(1) auxiliary space (Morris)** matches the information-theoretic lower bound for a single previous-value tracker."
      },
      constraints: [
        "2 <= number of nodes <= 100",
        "0 <= Node.val <= 10^5",
        "All Node.val are unique",
        "The tree is a valid BST"
      ],
      hints: [
        "**Inorder traversal of a BST yields values in non-decreasing order.** The minimum difference must be between two consecutive values in that order.",
        "**Why adjacency is enough.** For any non-adjacent pair `(i, j)` with `i + 1 < j`, `a[j] - a[i] >= a[i+1] - a[i]`. So the adjacent pair `(i, i+1)` dominates.",
        "**State is minimal:** previous inorder value `prev` and best diff `best`. Update `best = min(best, cur.val - prev)` on every visit (after the first).",
        "**Initialize `best = +infinity` and `prev = None`.** The first visit only sets `prev`; the comparison begins on the second visit.",
        "**Use iterative inorder (or Morris) for very skewed trees.** Recursive inorder can stack-overflow on chains of 10^4 nodes.",
        "**No absolute value needed** — `cur.val - prev` is already non-negative on the inorder stream."
      ],
      test_cases,
      solutions: {
        python: "from typing import Optional\n\n# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\n\nclass Solution:\n    def minDiffInBST(self, root: Optional['TreeNode']) -> int:\n        stack = []\n        cur = root\n        prev = None\n        best = float('inf')\n        while cur is not None or stack:\n            while cur is not None:\n                stack.append(cur)\n                cur = cur.left\n            cur = stack.pop()\n            if prev is not None:\n                d = cur.val - prev\n                if d < best:\n                    best = d\n            prev = cur.val\n            cur = cur.right\n        return best if best != float('inf') else 0\n",
        javascript: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\nvar minDiffInBST = function(root) {\n    const stack = [];\n    let cur = root;\n    let prev = null;\n    let best = Infinity;\n    while (cur !== null || stack.length > 0) {\n        while (cur !== null) {\n            stack.push(cur);\n            cur = cur.left;\n        }\n        cur = stack.pop();\n        if (prev !== null) {\n            const d = cur.val - prev;\n            if (d < best) best = d;\n        }\n        prev = cur.val;\n        cur = cur.right;\n    }\n    return best === Infinity ? 0 : best;\n};\n",
        java: "import java.util.*;\n\n/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\npublic class Solution {\n    public int minDiffInBST(TreeNode root) {\n        Deque<TreeNode> stack = new ArrayDeque<>();\n        TreeNode cur = root;\n        Integer prev = null;\n        int best = Integer.MAX_VALUE;\n        while (cur != null || !stack.isEmpty()) {\n            while (cur != null) {\n                stack.push(cur);\n                cur = cur.left;\n            }\n            cur = stack.pop();\n            if (prev != null) {\n                int d = cur.val - prev;\n                if (d < best) best = d;\n            }\n            prev = cur.val;\n            cur = cur.right;\n        }\n        return best == Integer.MAX_VALUE ? 0 : best;\n    }\n}\n",
        cpp: "#include <stack>\n#include <climits>\nusing namespace std;\n\n/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *l, TreeNode *r) : val(x), left(l), right(r) {}\n * };\n */\nclass Solution {\npublic:\n    int minDiffInBST(TreeNode* root) {\n        stack<TreeNode*> st;\n        TreeNode* cur = root;\n        bool havePrev = false;\n        int prev = 0;\n        int best = INT_MAX;\n        while (cur != nullptr || !st.empty()) {\n            while (cur != nullptr) {\n                st.push(cur);\n                cur = cur->left;\n            }\n            cur = st.top(); st.pop();\n            if (havePrev) {\n                int d = cur->val - prev;\n                if (d < best) best = d;\n            }\n            prev = cur->val;\n            havePrev = true;\n            cur = cur->right;\n        }\n        return best == INT_MAX ? 0 : best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 34Z START =====",
    "// === WAVE 34Z " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34Z " + p1.slug + " END ===",
    "// === WAVE 34Z " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34Z " + p2.slug + " END ===",
    "// ===== WAVE 34Z END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// guard: don't double-write
if (src.indexOf("WAVE 34Z START") !== -1) {
  console.error("WAVE 34Z already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34Y END marker and append block after it.
const ANCHOR = "// ===== WAVE 34Y END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave34z " + p1.slug + " + " + p2.slug);
process.exit(0);
