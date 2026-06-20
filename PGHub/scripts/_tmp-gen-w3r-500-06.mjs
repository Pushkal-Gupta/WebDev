#!/usr/bin/env node
// Generates the patch JSON for slice w3r-500-06.
import fs from 'node:fs';

const problems = [];

// =================================================================
// 1. floor — Given sorted array and x, find largest element <= x.
// =================================================================
problems.push({
  id: 'floor',
  pattern: 'Binary Search',
  method_name: 'findFloor',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'x', type: 'int' },
  ],
  return_type: 'int',
  hints: [
    'The array is sorted, so a linear scan is correct but O(n).',
    'Binary search lets you locate the largest element <= x in O(log n).',
    'Keep a candidate index; whenever arr[mid] <= x, record mid and move right.',
    'If no element is <= x, return -1.',
    'Watch for duplicates — moving right after a hit still returns the largest valid index.',
  ],
  test_cases: [
    { inputs: ['[1,2,8,10,11,12,19]', '0'], expected: '-1' },
    { inputs: ['[1,2,8,10,11,12,19]', '1'], expected: '0' },
    { inputs: ['[1,2,8,10,11,12,19]', '5'], expected: '1' },
    { inputs: ['[1,2,8,10,11,12,19]', '20'], expected: '6' },
    { inputs: ['[1,2,8,10,11,12,19]', '11'], expected: '4' },
    { inputs: ['[1,2,8,10,11,12,19]', '12'], expected: '5' },
    { inputs: ['[5]', '5'], expected: '0' },
    { inputs: ['[5]', '3'], expected: '-1' },
    { inputs: ['[1,1,1,1]', '1'], expected: '3' },
    { inputs: ['[2,4,6,8,10]', '7'], expected: '2' },
    { inputs: ['[-5,-3,-1,0,2]', '-2'], expected: '1' },
  ],
  editorial_md: `## Intuition

In a sorted array, all values up to a certain index are <= x and all values after are > x. The floor of x is the rightmost index whose value satisfies arr[mid] <= x. A linear scan finds it in O(n), but the sortedness lets binary search collapse the search space by half each step.

## Approach

Maintain two pointers lo = 0 and hi = n - 1 and an answer ans = -1. At each step, compute mid = (lo + hi) / 2.

- If arr[mid] <= x, mid is a valid floor candidate. Record it and try to find a larger one by setting lo = mid + 1.
- Otherwise the value is too large; discard the upper half by setting hi = mid - 1.

Continue while lo <= hi. The final ans holds the largest index whose value is at most x, or -1 if no element qualifies.

## Complexity

Time is O(log n) because the search range halves at every step. Space is O(1) — only a few integers.

## Why this works

The invariant is: every index <= ans has arr[index] <= x (proven by induction over the recorded hits) and every index > hi has arr[index] > x. When lo crosses hi, ans is the maximum valid index.

## Edge cases

- x smaller than every element: ans never gets updated, return -1.
- x larger than every element: the loop walks lo to n, ans = n - 1.
- Duplicates of x: we keep moving right after a hit, so we land on the rightmost occurrence.
- Single-element array: handled by the same logic since lo == hi initially.

## Variants

A floor query also generalizes to finding the predecessor in a set, to bucket assignment, and to range queries (number of elements <= x via floor + 1). The same template with a flipped comparator gives the ceiling.`,
  solutions: {
    python: `class Solution:
    def findFloor(self, arr, x):
        lo, hi, ans = 0, len(arr) - 1, -1
        while lo <= hi:
            mid = (lo + hi) // 2
            if arr[mid] <= x:
                ans = mid
                lo = mid + 1
            else:
                hi = mid - 1
        return ans`,
    javascript: `var findFloor = function(arr, x) {
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] <= x) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
};`,
    java: `class Solution {
    public int findFloor(int[] arr, int x) {
        int lo = 0, hi = arr.length - 1, ans = -1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
}`,
    cpp: `class Solution {
public:
    int findFloor(vector<int>& arr, int x) {
        int lo = 0, hi = (int)arr.size() - 1, ans = -1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
};`,
  },
});

// =================================================================
// 2. insert — Insert value into a sorted array (return new array).
// =================================================================
problems.push({
  id: 'insert',
  pattern: 'Binary Search',
  method_name: 'insertSorted',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'x', type: 'int' },
  ],
  return_type: 'List[int]',
  hints: [
    'The array is sorted — insertion point is the first index whose value is >= x.',
    'Linear scan finds the spot in O(n). Building the new array is also O(n).',
    'Binary search locates the slot in O(log n), but the copy is still linear.',
    'For an in-place variant, shift elements right starting from the end.',
    'Watch the edge cases: x smaller than all elements (front) and larger than all (back).',
  ],
  test_cases: [
    { inputs: ['[1,2,4,5]', '3'], expected: '[1,2,3,4,5]' },
    { inputs: ['[]', '7'], expected: '[7]' },
    { inputs: ['[1,3,5,7]', '0'], expected: '[0,1,3,5,7]' },
    { inputs: ['[1,3,5,7]', '10'], expected: '[1,3,5,7,10]' },
    { inputs: ['[2,2,2]', '2'], expected: '[2,2,2,2]' },
    { inputs: ['[1]', '0'], expected: '[0,1]' },
    { inputs: ['[1]', '2'], expected: '[1,2]' },
    { inputs: ['[-5,-3,0,4]', '-4'], expected: '[-5,-4,-3,0,4]' },
    { inputs: ['[1,2,3,4,5]', '3'], expected: '[1,2,3,3,4,5]' },
    { inputs: ['[10,20,30]', '25'], expected: '[10,20,25,30]' },
    { inputs: ['[1,1,1,5,5,5]', '3'], expected: '[1,1,1,3,5,5,5]' },
  ],
  editorial_md: `## Intuition

For a sorted array, inserting a value means finding the first index whose element is >= x and slotting the new value there so the order stays preserved. A linear scan does the job, but binary search reaches the slot in logarithmic time. The actual array build is unavoidably O(n) because every element after the insertion point shifts.

## Approach

Use binary search to find the insertion index. Maintain lo and hi pointers. At each step:

- If arr[mid] < x, the slot is to the right: lo = mid + 1.
- Otherwise the slot might be mid or earlier: hi = mid - 1.

When the loop ends, lo holds the smallest index whose value is >= x (or n if no such index exists). Build a new array by copying arr[0..lo-1], appending x, then copying arr[lo..n-1].

## Complexity

Time is O(n) total — O(log n) for the search plus O(n) for the array construction. Space is O(n) for the new array; an in-place variant trades that for O(1) extra space by shifting elements right starting from the end.

## Why this works

The invariant on lo is: every index < lo has arr[index] < x. So inserting at lo preserves non-decreasing order: previous values are smaller, current and later values are >= x. Equal values can land before or after — we land before, which corresponds to a lower_bound semantics.

## Edge cases

- Empty array: lo stays 0, the new array is just [x].
- x smaller than every element: insertion at index 0.
- x larger than every element: insertion at index n.
- Duplicates of x: insertion goes before the first equal element (lower_bound).
- Single-element array: still handled because lo and hi collapse correctly.

## Variants

If duplicates should land after equal elements, use upper_bound (flip the comparator to <=). For an in-place insert into a buffer with capacity, shift from the end down to avoid overwriting unread values.`,
  solutions: {
    python: `class Solution:
    def insertSorted(self, arr, x):
        lo, hi = 0, len(arr)
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < x:
                lo = mid + 1
            else:
                hi = mid
        return arr[:lo] + [x] + arr[lo:]`,
    javascript: `var insertSorted = function(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] < x) lo = mid + 1;
        else hi = mid;
    }
    const out = arr.slice(0, lo);
    out.push(x);
    for (let i = lo; i < arr.length; i++) out.push(arr[i]);
    return out;
};`,
    java: `class Solution {
    public int[] insertSorted(int[] arr, int x) {
        int n = arr.length;
        int lo = 0, hi = n;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (arr[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        int[] out = new int[n + 1];
        for (int i = 0; i < lo; i++) out[i] = arr[i];
        out[lo] = x;
        for (int i = lo; i < n; i++) out[i + 1] = arr[i];
        return out;
    }
}`,
    cpp: `class Solution {
public:
    vector<int> insertSorted(vector<int>& arr, int x) {
        int lo = 0, hi = (int)arr.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        vector<int> out;
        out.reserve(arr.size() + 1);
        for (int i = 0; i < lo; i++) out.push_back(arr[i]);
        out.push_back(x);
        for (int i = lo; i < (int)arr.size(); i++) out.push_back(arr[i]);
        return out;
    }
};`,
  },
});

// =================================================================
// 3. lca — Lowest Common Ancestor in a binary tree.
// =================================================================
problems.push({
  id: 'lca',
  pattern: 'Tree Recursion',
  method_name: 'lowestCommonAncestor',
  params: [
    { name: 'root', type: 'TreeNode' },
    { name: 'p', type: 'int' },
    { name: 'q', type: 'int' },
  ],
  return_type: 'int',
  hints: [
    'For any node, p and q are either in its left subtree, right subtree, or split between them.',
    'If both are on the same side, recurse into that side.',
    'If they split, the current node is the LCA.',
    'Encode "p or q found here" by returning the node itself; null means "not in this subtree".',
    'After both recursive calls return non-null, the current node is the answer.',
  ],
  test_cases: [
    { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '1'], expected: '3' },
    { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '4'], expected: '5' },
    { inputs: ['[1,2]', '1', '2'], expected: '1' },
    { inputs: ['[1,2,3,4,5,6,7]', '4', '5'], expected: '2' },
    { inputs: ['[1,2,3,4,5,6,7]', '4', '7'], expected: '1' },
    { inputs: ['[1,2,3,4,5,6,7]', '6', '7'], expected: '3' },
    { inputs: ['[1]', '1', '1'], expected: '1' },
    { inputs: ['[2,1]', '2', '1'], expected: '2' },
    { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '7', '4'], expected: '2' },
    { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '0', '8'], expected: '1' },
    { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '6', '4'], expected: '5' },
  ],
  editorial_md: `## Intuition

For any rooted tree, the lowest common ancestor of two nodes p and q is the deepest node that has both in its subtree. From any current node, exactly one of three things is true: both targets lie in the left subtree, both lie in the right subtree, or they split — one on each side. In the split case, the current node is the LCA; otherwise we recurse into whichever side holds both.

## Approach

Do a post-order recursion. For each node return:

- The node itself if it equals p or q (we found a target here),
- null if neither p nor q lives in the subtree rooted here,
- Otherwise the LCA of whatever was found below.

Concretely, recurse on left and right. If both return non-null, this node is the split point, so it is the LCA — return it. If only one returns non-null, propagate that result upward; it is either a target or an LCA discovered deeper. If both are null, this subtree contains neither target, so return null.

## Complexity

Time is O(n) because each node is visited once. Space is O(h) for the recursion stack, where h is the tree height — O(log n) for balanced trees and O(n) for skewed ones.

## Why this works

The recursion encodes "what I found below me." A node returned upward is either a target or an ancestor that has already covered both targets. The first place both children return non-null is necessarily the deepest such ancestor: any deeper node would have had at most one target in its subtree.

## Edge cases

- p equals q: the LCA is that node; returning early on the match handles this.
- One node is an ancestor of the other: the ancestor returns itself; the descendant subtree returns null, so the ancestor propagates up unchanged.
- Both nodes in the same subtree: only one side returns non-null, which is the LCA computed lower down.

## Variants

For a BST, comparing values against the current node avoids a full DFS. For trees with parent pointers, lift both pointers to the same depth then walk up together — also O(h).`,
  solutions: {
    python: `class Solution:
    def lowestCommonAncestor(self, root, p, q):
        def dfs(node):
            if node is None: return None
            if node.val == p or node.val == q: return node
            l = dfs(node.left)
            r = dfs(node.right)
            if l and r: return node
            return l if l else r
        ans = dfs(root)
        return ans.val if ans else -1`,
    javascript: `var lowestCommonAncestor = function(root, p, q) {
    function dfs(node) {
        if (!node) return null;
        if (node.val === p || node.val === q) return node;
        const l = dfs(node.left);
        const r = dfs(node.right);
        if (l && r) return node;
        return l ? l : r;
    }
    const ans = dfs(root);
    return ans ? ans.val : -1;
};`,
    java: `class Solution {
    public int lowestCommonAncestor(TreeNode root, int p, int q) {
        TreeNode ans = dfs(root, p, q);
        return ans == null ? -1 : ans.val;
    }
    private TreeNode dfs(TreeNode node, int p, int q) {
        if (node == null) return null;
        if (node.val == p || node.val == q) return node;
        TreeNode l = dfs(node.left, p, q);
        TreeNode r = dfs(node.right, p, q);
        if (l != null && r != null) return node;
        return l != null ? l : r;
    }
}`,
    cpp: `class Solution {
public:
    int lowestCommonAncestor(TreeNode* root, int p, int q) {
        TreeNode* ans = dfs(root, p, q);
        return ans ? ans->val : -1;
    }
private:
    TreeNode* dfs(TreeNode* node, int p, int q) {
        if (!node) return nullptr;
        if (node->val == p || node->val == q) return node;
        TreeNode* l = dfs(node->left, p, q);
        TreeNode* r = dfs(node->right, p, q);
        if (l && r) return node;
        return l ? l : r;
    }
};`,
  },
});

// =================================================================
// 4. leaf-at-same-level — Check all leaves at same depth.
// =================================================================
problems.push({
  id: 'leaf-at-same-level',
  pattern: 'Tree Traversal',
  method_name: 'checkLeafAtSameLevel',
  params: [{ name: 'root', type: 'TreeNode' }],
  return_type: 'bool',
  hints: [
    'Track the depth of every leaf encountered during traversal.',
    'If two leaves have different depths, the answer is false.',
    'Use DFS and pass the current depth as an argument.',
    'Record the first leaf depth seen; compare every later leaf against it.',
    'Empty tree is vacuously true (no leaves to disagree).',
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: 'true' },
    { inputs: ['[1,2,3,4]'], expected: 'false' },
    { inputs: ['[]'], expected: 'true' },
    { inputs: ['[1]'], expected: 'true' },
    { inputs: ['[1,2,3,4,5,6,7]'], expected: 'true' },
    { inputs: ['[1,2,3,4,5,6,7,8]'], expected: 'false' },
    { inputs: ['[10,20,30,10,15]'], expected: 'true' },
    { inputs: ['[1,2,2,3,null,null,3,4,null,null,4]'], expected: 'false' },
    { inputs: ['[1,2,null,3]'], expected: 'true' },
    { inputs: ['[1,2,3,null,null,4,5]'], expected: 'true' },
    { inputs: ['[1,2,3,4,null,null,5,6]'], expected: 'false' },
  ],
  editorial_md: `## Intuition

A tree has "leaves at the same level" when every leaf — every node with no children — sits at exactly the same depth from the root. The first leaf we encounter establishes the reference depth. Every subsequent leaf must match that depth, otherwise the property fails. A single DFS or BFS suffices.

## Approach

Run a DFS that carries the current depth as an argument. When we hit a leaf (both children null), check whether the reference depth has been set. If not, set it to the current depth. If it has been set and the current depth differs, return false. Otherwise continue. Recurse into non-null children with depth + 1.

We can short-circuit by stopping the recursion as soon as a mismatch is found. An iterative BFS variant marches level by level: as soon as any leaf appears, the next level should contain only nodes with no children, otherwise some leaves live deeper.

## Complexity

Time is O(n) because every node is visited at most once. Space is O(h) for the recursion stack with DFS, where h is the tree height — O(n) in the worst case and O(log n) when balanced. BFS uses O(w) where w is the maximum width.

## Why this works

The reference-depth trick works because the property is symmetric. Whichever leaf comes first sets the bar, and any other leaf either matches or violates. We never need to revisit a leaf because the constraint is pairwise.

## Edge cases

- Empty tree: no leaves exist, so the property holds vacuously — return true.
- Single node: that node is the only leaf, so the property holds trivially.
- Skewed tree (only left or only right children): the unique leaf sets the bar, no conflict.
- Two leaves at depths k and k+1: the second leaf triggers a mismatch and the function returns false.

## Variants

The same template handles "all leaves within k of each other" by tracking min/max leaf depths. Pair with iterative deepening to avoid stack overflow on extremely deep trees.`,
  solutions: {
    python: `class Solution:
    def checkLeafAtSameLevel(self, root):
        ref = [-1]
        def dfs(node, depth):
            if node is None: return True
            if node.left is None and node.right is None:
                if ref[0] == -1:
                    ref[0] = depth
                    return True
                return ref[0] == depth
            return dfs(node.left, depth + 1) and dfs(node.right, depth + 1)
        return dfs(root, 0)`,
    javascript: `var checkLeafAtSameLevel = function(root) {
    let ref = -1;
    function dfs(node, depth) {
        if (!node) return true;
        if (!node.left && !node.right) {
            if (ref === -1) { ref = depth; return true; }
            return ref === depth;
        }
        return dfs(node.left, depth + 1) && dfs(node.right, depth + 1);
    }
    return dfs(root, 0);
};`,
    java: `class Solution {
    int ref = -1;
    public boolean checkLeafAtSameLevel(TreeNode root) {
        return dfs(root, 0);
    }
    private boolean dfs(TreeNode node, int depth) {
        if (node == null) return true;
        if (node.left == null && node.right == null) {
            if (ref == -1) { ref = depth; return true; }
            return ref == depth;
        }
        return dfs(node.left, depth + 1) && dfs(node.right, depth + 1);
    }
}`,
    cpp: `class Solution {
    int ref = -1;
public:
    bool checkLeafAtSameLevel(TreeNode* root) {
        ref = -1;
        return dfs(root, 0);
    }
private:
    bool dfs(TreeNode* node, int depth) {
        if (!node) return true;
        if (!node->left && !node->right) {
            if (ref == -1) { ref = depth; return true; }
            return ref == depth;
        }
        return dfs(node->left, depth + 1) && dfs(node->right, depth + 1);
    }
};`,
  },
});

// =================================================================
// 5. max-diff-node-ancestor — Largest |node - ancestor| in binary tree.
// =================================================================
problems.push({
  id: 'max-diff-node-ancestor',
  pattern: 'Tree Recursion',
  method_name: 'maxAncestorDiff',
  params: [{ name: 'root', type: 'TreeNode' }],
  return_type: 'int',
  hints: [
    'For any descendant, the maximum |a - b| with ancestor a is maximized at min and max along the path.',
    'Pass current path min and max down the recursion.',
    'At each node, update the answer with max(node - pathMin, pathMax - node).',
    'Then recurse with refreshed min and max including the current node.',
    'Return 0 for trees with a single node — no ancestor pair exists.',
  ],
  test_cases: [
    { inputs: ['[8,3,10,1,6,null,14,null,null,4,7,13]'], expected: '7' },
    { inputs: ['[1,null,2,null,0,3]'], expected: '3' },
    { inputs: ['[2,4,1]'], expected: '2' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[1,2,3,4,5,6,7]'], expected: '6' },
    { inputs: ['[5,3,8,1,4,7,9]'], expected: '4' },
    { inputs: ['[10,5,15,3,7,12,20]'], expected: '10' },
    { inputs: ['[1,2,null,3,null,4]'], expected: '3' },
    { inputs: ['[7,4,9,2,5,8,10]'], expected: '5' },
    { inputs: ['[100,50,150,25,75]'], expected: '75' },
    { inputs: ['[1,1,1,1,1]'], expected: '0' },
  ],
  editorial_md: `## Intuition

The biggest absolute difference between any descendant and its ancestor is realized by one of two cases: the descendant is much smaller than the path maximum, or much larger than the path minimum. So we only need to track the running min and max of values along the path from the root to the current node.

## Approach

DFS with two carried values: pathMin and pathMax — the min and max of values from the root to (and including) the current node. At each node, candidate diffs are pathMax - node.val and node.val - pathMin. The answer is the maximum over all nodes. Recurse into children after updating pathMin and pathMax to include this node.

A neat trick: at a leaf, the answer is exactly pathMax - pathMin, since that pair includes the leaf either as the max or min. Updating the global answer at every node also works and avoids a leaf-only check.

## Complexity

Time is O(n), one visit per node. Space is O(h) for the recursion stack, where h is the tree height — O(log n) for balanced trees, O(n) for skewed ones.

## Why this works

Any ancestor-descendant pair (a, b) sits on a single root-to-descendant path. Once we descend to b, every ancestor a is in the set of values seen on the way down. The maximum |a - b| with fixed b is maximized by either max(ancestors) - b or b - min(ancestors), which is exactly what we compute.

## Edge cases

- Single node: there is no ancestor; return 0. The recursion handles this because pathMin = pathMax = root.val and the diff is 0.
- All equal values: no positive diff exists; the answer is 0.
- Negative values: works identically — we compare numeric values, not magnitudes of values.

## Variants

For "max ancestor difference where ancestor < descendant", restrict to b - pathMin only. For arbitrary node-pair differences (no ancestor constraint), this approach no longer works — that needs a different DFS that returns subtree min/max.`,
  solutions: {
    python: `class Solution:
    def maxAncestorDiff(self, root):
        if root is None: return 0
        self.ans = 0
        def dfs(node, lo, hi):
            if node is None:
                self.ans = max(self.ans, hi - lo)
                return
            lo = min(lo, node.val)
            hi = max(hi, node.val)
            if node.left is None and node.right is None:
                self.ans = max(self.ans, hi - lo)
                return
            dfs(node.left, lo, hi)
            dfs(node.right, lo, hi)
        dfs(root, root.val, root.val)
        return self.ans`,
    javascript: `var maxAncestorDiff = function(root) {
    if (!root) return 0;
    let ans = 0;
    function dfs(node, lo, hi) {
        if (!node) { ans = Math.max(ans, hi - lo); return; }
        lo = Math.min(lo, node.val);
        hi = Math.max(hi, node.val);
        if (!node.left && !node.right) { ans = Math.max(ans, hi - lo); return; }
        dfs(node.left, lo, hi);
        dfs(node.right, lo, hi);
    }
    dfs(root, root.val, root.val);
    return ans;
};`,
    java: `class Solution {
    int ans = 0;
    public int maxAncestorDiff(TreeNode root) {
        if (root == null) return 0;
        ans = 0;
        dfs(root, root.val, root.val);
        return ans;
    }
    private void dfs(TreeNode node, int lo, int hi) {
        if (node == null) { ans = Math.max(ans, hi - lo); return; }
        lo = Math.min(lo, node.val);
        hi = Math.max(hi, node.val);
        if (node.left == null && node.right == null) { ans = Math.max(ans, hi - lo); return; }
        dfs(node.left, lo, hi);
        dfs(node.right, lo, hi);
    }
}`,
    cpp: `class Solution {
    int ans = 0;
public:
    int maxAncestorDiff(TreeNode* root) {
        if (!root) return 0;
        ans = 0;
        dfs(root, root->val, root->val);
        return ans;
    }
private:
    void dfs(TreeNode* node, int lo, int hi) {
        if (!node) { if (hi - lo > ans) ans = hi - lo; return; }
        if (node->val < lo) lo = node->val;
        if (node->val > hi) hi = node->val;
        if (!node->left && !node->right) { if (hi - lo > ans) ans = hi - lo; return; }
        dfs(node->left, lo, hi);
        dfs(node->right, lo, hi);
    }
};`,
  },
});

// =================================================================
// 6. merge-two-bsts — Merge two BSTs into sorted array.
// =================================================================
problems.push({
  id: 'merge-two-bsts',
  pattern: 'Tree + Merge',
  method_name: 'mergeBSTs',
  params: [
    { name: 'root1', type: 'TreeNode' },
    { name: 'root2', type: 'TreeNode' },
  ],
  return_type: 'List[int]',
  hints: [
    'Inorder traversal of a BST produces a sorted list.',
    'Get the inorder of each BST separately.',
    'Now merge two sorted lists in O(m + n) time.',
    'Avoid materializing one big tree; the merged sorted list is the answer.',
    'For an O(h1 + h2) space solution, simulate two iterators with stacks.',
  ],
  test_cases: [
    { inputs: ['[5,3,6,2,4]', '[2,1,3,null,null,null,7,6,null]'], expected: '[1,2,2,3,3,4,5,6,6,7]' },
    { inputs: ['[1]', '[2]'], expected: '[1,2]' },
    { inputs: ['[]', '[1,2,3]'], expected: '[1,3,2]' },
    { inputs: ['[1,2,3]', '[]'], expected: '[1,3,2]' },
    { inputs: ['[]', '[]'], expected: '[]' },
    { inputs: ['[2,1,3]', '[5,4,6]'], expected: '[1,2,3,4,5,6]' },
    { inputs: ['[5,4,6]', '[2,1,3]'], expected: '[1,2,3,4,5,6]' },
    { inputs: ['[3,1,5]', '[3,1,5]'], expected: '[1,1,3,3,5,5]' },
    { inputs: ['[10]', '[5,3,15]'], expected: '[3,5,10,15]' },
    { inputs: ['[8,3,10,1,6]', '[2,1,4]'], expected: '[1,1,2,3,4,6,8,10]' },
    { inputs: ['[100,50,150]', '[75,25,125]'], expected: '[25,50,75,100,125,150]' },
  ],
  editorial_md: `## Intuition

A BST's inorder traversal yields a sorted sequence. So merging two BSTs into a sorted list is just "merge two sorted lists" with the BSTs replaced by their inorder traversals. We do not need to physically merge the trees into one — the merged list is the answer.

## Approach

Two-phase plan:

1. Inorder-traverse each BST, collecting values into lists a and b.
2. Two-pointer merge a and b into the output list. While both have items, pick the smaller front element. Then append whatever remains from the longer list.

The first phase is straightforward recursion. The second phase is the standard merge step from merge sort.

For a space-efficient version, use two iterative inorder traversals backed by stacks. Push the leftmost path; pop and emit values; whenever a value is popped, push the right subtree's leftmost path. Compare the current tops of the two iterators to decide which value to emit next. This avoids materializing the full lists.

## Complexity

Time is O(m + n) where m and n are the node counts of the two trees — both traversals plus the merge are linear. Space is O(m + n) for the output and the traversal lists. The iterator variant cuts traversal space to O(h1 + h2).

## Why this works

Inorder of a BST visits the smallest unseen value next, by definition of the BST property. So the two streams are sorted, and a two-pointer merge produces a sorted concatenation. Correctness of the merge is the same argument used for merge sort.

## Edge cases

- One tree empty: the other tree's inorder is the answer.
- Both empty: empty list.
- Identical trees: each value appears twice, in correct order.
- Disjoint ranges (all of A < all of B): the merge degenerates to concatenation.
- Heavy overlap with duplicates: the merge still works; ties can go to either side.

## Variants

To build an actual merged BST (balanced), take the merged sorted list and run "sorted array to balanced BST" in O(m + n). For k-way merge of k BSTs, use a min-heap of iterators for O((m1 + m2 + ... + mk) log k).`,
  solutions: {
    python: `class Solution:
    def mergeBSTs(self, root1, root2):
        def inorder(node, out):
            if node is None: return
            inorder(node.left, out)
            out.append(node.val)
            inorder(node.right, out)
        a, b = [], []
        inorder(root1, a)
        inorder(root2, b)
        i = j = 0
        out = []
        while i < len(a) and j < len(b):
            if a[i] <= b[j]:
                out.append(a[i]); i += 1
            else:
                out.append(b[j]); j += 1
        out.extend(a[i:])
        out.extend(b[j:])
        return out`,
    javascript: `var mergeBSTs = function(root1, root2) {
    const inorder = (node, out) => {
        if (!node) return;
        inorder(node.left, out);
        out.push(node.val);
        inorder(node.right, out);
    };
    const a = [], b = [];
    inorder(root1, a);
    inorder(root2, b);
    const out = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) { out.push(a[i++]); }
        else { out.push(b[j++]); }
    }
    while (i < a.length) out.push(a[i++]);
    while (j < b.length) out.push(b[j++]);
    return out;
};`,
    java: `class Solution {
    public int[] mergeBSTs(TreeNode root1, TreeNode root2) {
        java.util.List<Integer> a = new java.util.ArrayList<>();
        java.util.List<Integer> b = new java.util.ArrayList<>();
        inorder(root1, a);
        inorder(root2, b);
        int[] out = new int[a.size() + b.size()];
        int i = 0, j = 0, k = 0;
        while (i < a.size() && j < b.size()) {
            if (a.get(i) <= b.get(j)) out[k++] = a.get(i++);
            else out[k++] = b.get(j++);
        }
        while (i < a.size()) out[k++] = a.get(i++);
        while (j < b.size()) out[k++] = b.get(j++);
        return out;
    }
    private void inorder(TreeNode node, java.util.List<Integer> out) {
        if (node == null) return;
        inorder(node.left, out);
        out.add(node.val);
        inorder(node.right, out);
    }
}`,
    cpp: `class Solution {
public:
    vector<int> mergeBSTs(TreeNode* root1, TreeNode* root2) {
        vector<int> a, b;
        inorder(root1, a);
        inorder(root2, b);
        vector<int> out;
        out.reserve(a.size() + b.size());
        size_t i = 0, j = 0;
        while (i < a.size() && j < b.size()) {
            if (a[i] <= b[j]) out.push_back(a[i++]);
            else out.push_back(b[j++]);
        }
        while (i < a.size()) out.push_back(a[i++]);
        while (j < b.size()) out.push_back(b[j++]);
        return out;
    }
private:
    void inorder(TreeNode* node, vector<int>& out) {
        if (!node) return;
        inorder(node->left, out);
        out.push_back(node->val);
        inorder(node->right, out);
    }
};`,
  },
});

// =================================================================
// 7. nearly-sorted — Sort an array where each element is at most k away from sorted position.
// =================================================================
problems.push({
  id: 'nearly-sorted',
  pattern: 'Heap',
  method_name: 'nearlySorted',
  params: [
    { name: 'arr', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'List[int]',
  hints: [
    'Each element is at most k positions away from its sorted position.',
    'The smallest element in the array sits in the first k+1 slots.',
    'Maintain a min-heap of size k+1: pop one, push one as you slide forward.',
    'Generic sort is O(n log n); this approach is O(n log k).',
    'After the array ends, pop the remaining heap entries in order.',
  ],
  test_cases: [
    { inputs: ['[6,5,3,2,8,10,9]', '3'], expected: '[2,3,5,6,8,9,10]' },
    { inputs: ['[10,9,8,7,4,70,60,50]', '4'], expected: '[4,7,8,9,10,50,60,70]' },
    { inputs: ['[3,2,1,5,4,7,6,5]', '2'], expected: '[1,2,3,4,5,5,6,7]' },
    { inputs: ['[1]', '0'], expected: '[1]' },
    { inputs: ['[2,1]', '1'], expected: '[1,2]' },
    { inputs: ['[5,4,3,2,1]', '4'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]', '0'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]', '2'], expected: '[1,2,3,4,5]' },
    { inputs: ['[3,1,2]', '2'], expected: '[1,2,3]' },
    { inputs: ['[7,6,5,4,3,2,1]', '6'], expected: '[1,2,3,4,5,6,7]' },
    { inputs: ['[4,1,2,3,7,5,6,8]', '3'], expected: '[1,2,3,4,5,6,7,8]' },
  ],
  editorial_md: `## Intuition

If each element is within k of its sorted position, then the smallest element in the whole array must sit somewhere in the first k+1 indices. Once we extract it, the next smallest must be in the next window of k+1. A min-heap of size k+1 captures this rolling window and produces sorted output by repeatedly popping its minimum.

## Approach

Push the first k+1 elements into a min-heap. Then iterate i from k+1 to n-1: pop the heap's minimum and write it to the output, then push arr[i]. After the loop, drain whatever remains in the heap in order. The heap always contains exactly k+1 elements while there are more to scan, and any smaller element that has not been emitted yet must be in this heap because nothing further away from a position by more than k can be the next smallest.

## Complexity

Time is O(n log k) because every push and pop costs O(log(k+1)) and there are O(n) of each. Space is O(k) for the heap. This beats a generic sort whenever k is much smaller than n.

## Why this works

Invariant: after popping i values, the heap contains exactly the elements at positions i..i+k. The (i+1)-th smallest element is at some position p with |p - (i+1)| <= k, so p <= i + 1 + k, meaning it is in the heap. The heap's min is therefore correct, and popping it preserves the invariant for the next step.

## Edge cases

- k = 0: array is already sorted; output equals input. The heap has size 1 and just emits each element in turn.
- k >= n - 1: degenerates to a normal heap-sort, still O(n log n).
- Duplicates: ties pop arbitrarily but the output is still non-decreasing.
- Single-element array: the heap holds one element; we drain it once.

## Variants

The same template handles a sliding-window k-min for any stream where each new element is "near sorted" relative to the previous one. Replace the heap with a balanced BST to also report rank queries.`,
  solutions: {
    python: `import heapq
class Solution:
    def nearlySorted(self, arr, k):
        n = len(arr)
        if n == 0: return []
        size = min(k + 1, n)
        h = arr[:size]
        heapq.heapify(h)
        out = []
        for i in range(size, n):
            out.append(heapq.heappushpop(h, arr[i]))
        while h:
            out.append(heapq.heappop(h))
        return out`,
    javascript: `var nearlySorted = function(arr, k) {
    const n = arr.length;
    if (n === 0) return [];
    // Min-heap
    const h = [];
    const swap = (i, j) => { const t = h[i]; h[i] = h[j]; h[j] = t; };
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (h[p] > h[i]) { swap(p, i); i = p; } else break;
        }
    };
    const down = (i) => {
        const len = h.length;
        while (true) {
            let l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < len && h[l] < h[s]) s = l;
            if (r < len && h[r] < h[s]) s = r;
            if (s !== i) { swap(s, i); i = s; } else break;
        }
    };
    const size = Math.min(k + 1, n);
    for (let i = 0; i < size; i++) { h.push(arr[i]); up(h.length - 1); }
    const out = [];
    for (let i = size; i < n; i++) {
        out.push(h[0]);
        h[0] = arr[i];
        down(0);
    }
    while (h.length) {
        out.push(h[0]);
        const last = h.pop();
        if (h.length) { h[0] = last; down(0); }
    }
    return out;
};`,
    java: `class Solution {
    public int[] nearlySorted(int[] arr, int k) {
        int n = arr.length;
        if (n == 0) return new int[0];
        java.util.PriorityQueue<Integer> pq = new java.util.PriorityQueue<>();
        int size = Math.min(k + 1, n);
        for (int i = 0; i < size; i++) pq.add(arr[i]);
        int[] out = new int[n];
        int idx = 0;
        for (int i = size; i < n; i++) {
            out[idx++] = pq.poll();
            pq.add(arr[i]);
        }
        while (!pq.isEmpty()) out[idx++] = pq.poll();
        return out;
    }
}`,
    cpp: `class Solution {
public:
    vector<int> nearlySorted(vector<int>& arr, int k) {
        int n = arr.size();
        if (n == 0) return {};
        priority_queue<int, vector<int>, greater<int>> pq;
        int size = min(k + 1, n);
        for (int i = 0; i < size; i++) pq.push(arr[i]);
        vector<int> out;
        out.reserve(n);
        for (int i = size; i < n; i++) {
            out.push_back(pq.top()); pq.pop();
            pq.push(arr[i]);
        }
        while (!pq.empty()) { out.push_back(pq.top()); pq.pop(); }
        return out;
    }
};`,
  },
});

// Write first 7 problems to disk before continuing
fs.writeFileSync('/tmp/patch-w3r-500-06.json', JSON.stringify(problems, null, 2));
console.log(`Wrote ${problems.length} problems so far.`);
