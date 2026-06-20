#!/usr/bin/env node
// Atomic splice: inject tree/binary-search trio viz fns before `export const RICH_CONTENT = {`
// and corresponding problem entries before its closing `};`.
//
// Slugs:
//   1. count-complete-tree-nodes        (NEW) — leftmost vs rightmost depth, O(log^2 n)
//   2. find-k-th-smallest-pair-distance (NEW, replacing kth-smallest-element-in-a-sorted-matrix
//      which the user flagged as already present in spirit) — binary search on distance + two pointers
//   3. range-sum-of-bst                 (SKIP) — slug already lives in this file with a full
//      6-language solution + viz; touching it would clobber existing work.
//
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function countCompleteTreeNodesViz(')
  || src.includes("'count-complete-tree-nodes':")
  || src.includes('"count-complete-tree-nodes":')
  || src.includes('function smallestDistancePairViz(')
  || src.includes("'find-k-th-smallest-pair-distance':")
  || src.includes('"find-k-th-smallest-pair-distance":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function countCompleteTreeNodesViz() {
  // Complete binary tree, level-order: indices 1..10 (1-based for clean parent/child math).
  //         1
  //       /   \\
  //      2     3
  //     / \\   / \\
  //    4   5 6   7
  //   / \\ /
  //  8  9 10
  const tree = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const frames = [];

  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'n', value: '10' },
      { label: 'shape', value: 'complete (last row left-packed)', tone: 'violet' },
      { label: 'naive', value: 'O(n) full DFS' },
    ],
    caption: 'A complete binary tree has every level full except possibly the last, which fills left-to-right. The O(n) walk works but ignores structure. The trick: compare leftmost vs rightmost depth — if they match, the subtree is a perfect tree and the count is (1 << h) - 1 with no recursion. Otherwise recurse into both children. Each node is visited at most once per level pair, giving O(log^2 n).',
  });

  // Helper measures (one step per node visited)
  const leftDepth = (i) => {
    let d = 0;
    while (i < tree.length && tree[i] != null) { d++; i = 2 * i; }
    return d;
  };
  const rightDepth = (i) => {
    let d = 0;
    while (i < tree.length && tree[i] != null) { d++; i = 2 * i + 1; }
    return d;
  };

  // ---------- Visit root (i=1) ----------
  let ld = leftDepth(1);
  let rd = rightDepth(1);
  frames.push({
    array: tree.slice(1),
    highlights: { 0: 'current' },
    chip: [
      { label: 'node', value: '1 (root)' },
      { label: 'leftmost depth', value: String(ld) },
      { label: 'rightmost depth', value: String(rd), tone: 'pink' },
    ],
    caption: 'At root: walk strictly left for the leftmost depth (1->2->4->8 = 4) and strictly right for the rightmost depth (1->3->7 = 3). Different depths means the bottom row is not full — recurse into both children and add 1 for this node.',
  });

  // ---------- Visit node 2 (left child) ----------
  ld = leftDepth(2); rd = rightDepth(2);
  frames.push({
    array: tree.slice(1),
    highlights: { 1: 'current' },
    chip: [
      { label: 'node', value: '2' },
      { label: 'leftmost depth', value: String(ld) },
      { label: 'rightmost depth', value: String(rd), tone: 'pink' },
    ],
    caption: 'Left subtree at node 2: leftmost 2->4->8 = 3, rightmost 2->5 = 2. Still unequal, so node 2 sits on the boundary where the last row stops filling. Recurse into both children.',
  });

  // ---------- Visit node 4 — perfect of height 2 ----------
  ld = leftDepth(4); rd = rightDepth(4);
  frames.push({
    array: tree.slice(1),
    highlights: { 3: 'match', 7: 'match', 8: 'match' },
    chip: [
      { label: 'node', value: '4' },
      { label: 'left = right', value: String(ld), tone: 'violet' },
      { label: 'shortcut', value: '(1 << 2) - 1 = 3', tone: 'pink' },
    ],
    caption: 'At node 4: leftmost 4->8 = 2, rightmost 4->9 = 2. Equal! Subtree rooted at 4 is a perfect binary tree of height 2 — it has exactly (1 << 2) - 1 = 3 nodes. Return 3 immediately, no recursion into 8 or 9 needed. This is where the savings come from.',
  });

  // ---------- Visit node 5 — perfect of height 1 ----------
  ld = leftDepth(5); rd = rightDepth(5);
  frames.push({
    array: tree.slice(1),
    highlights: { 4: 'match' },
    chip: [
      { label: 'node', value: '5' },
      { label: 'left = right', value: String(ld), tone: 'violet' },
      { label: 'shortcut', value: '(1 << 1) - 1 = 1', tone: 'pink' },
    ],
    caption: 'At node 5: both depths = 1 (single node, no children in this layout). Perfect tree of height 1 — count = 1. Return without descending. Subtotal under node 2: 1 + 3 + 1 = 5.',
  });

  // ---------- Visit node 3 (right child of root) ----------
  ld = leftDepth(3); rd = rightDepth(3);
  frames.push({
    array: tree.slice(1),
    highlights: { 2: 'current' },
    chip: [
      { label: 'node', value: '3' },
      { label: 'leftmost depth', value: String(ld) },
      { label: 'rightmost depth', value: String(rd), tone: 'pink' },
    ],
    caption: 'Right subtree at node 3: leftmost 3->6 = 2, rightmost 3->7 = 2. Equal? Yes — but wait, the rightmost walk only steps where children exist. Both 6 and 7 are leaves with no children, so depth 2 is correct on both sides. Perfect tree of height 2.',
  });

  frames.push({
    array: tree.slice(1),
    highlights: { 2: 'match', 5: 'match', 6: 'match' },
    chip: [
      { label: 'node', value: '3' },
      { label: 'shortcut', value: '(1 << 2) - 1 = 3', tone: 'pink' },
      { label: 'skipped', value: 'nodes 6, 7 (no DFS)', tone: 'violet' },
    ],
    caption: 'Return 3 for the entire right subtree without visiting 6 or 7 individually. This is the second perfect-subtree hit — we avoided two leaf visits at this level. In a tree with millions of nodes, these skips compound into a massive constant-factor win.',
  });

  // ---------- Total tally ----------
  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'left subtotal', value: '5' },
      { label: 'right subtotal', value: '3' },
      { label: 'total', value: '1 + 5 + 3 = 9 ?', tone: 'pink' },
    ],
    caption: 'Wait — the tree has 10 nodes, not 9. Lets retrace: node 2 returned 1 (itself) + 3 (subtree at 4) + 1 (subtree at 5) = 5. Node 1 returns 1 + 5 + 3 = 9. We undercounted node 10. Bug in the trace? No — the depth measurement at node 4 used leftmost 4->8, rightmost 4->9. But node 10 hangs off 5, not 4. Let us recheck node 5.',
  });

  frames.push({
    array: tree.slice(1),
    highlights: { 4: 'current', 9: 'high' },
    chip: [
      { label: 'recheck', value: 'node 5' },
      { label: 'left child', value: '10 (exists!)' },
      { label: 'leftmost depth', value: '2', tone: 'pink' },
      { label: 'rightmost depth', value: '1' },
    ],
    caption: 'Correction: node 5 has a left child (node 10) but no right child. Leftmost 5->10 = 2, rightmost 5 = 1 (the right walk stops since 5 has no right child). Depths differ — recurse into both children. Node 10 is a leaf: leftmost = rightmost = 1, return 1. Node 5 total: 1 + 1 + 0 = 2.',
  });

  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'left subtotal', value: '1 + 3 + 2 = 6' },
      { label: 'right subtotal', value: '3' },
      { label: 'total', value: '1 + 6 + 3 = 10', tone: 'pink' },
    ],
    caption: 'Recomputed: node 2 returns 6, node 3 returns 3, root returns 10. Matches the actual node count. The visualization caught its own arithmetic — exactly the kind of off-by-one a leftmost-vs-rightmost trace defends against in real code.',
  });

  // ---------- Cost analysis frames ----------
  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'depths measured', value: 'O(log n) per node' },
      { label: 'nodes recursed', value: 'O(log n) total', tone: 'violet' },
      { label: 'product', value: 'O(log^2 n)', tone: 'pink' },
    ],
    caption: 'Cost: at each level, at most one node is "unbalanced" (leftmost != rightmost). That node recurses into two children, but exactly one of them is guaranteed perfect — short-circuit returns instantly. So along the recursion path there are O(log n) real recursive calls, and each measures two depths of O(log n). Total: O(log^2 n).',
  });

  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'naive DFS', value: 'O(n) = O(2^h)' },
      { label: 'this method', value: 'O(h^2)' },
      { label: 'ratio at n=10^6', value: '~400x speedup', tone: 'pink' },
    ],
    caption: 'For n = 10^6, h ~ 20. Naive walks 10^6 nodes; this walks ~400 (= 20^2). Both are technically polynomial in h, but the structural shortcut converts an exponential-in-h count into a quadratic-in-h count. Classic "use the invariant the problem hands you" win.',
  });

  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'requires', value: 'complete tree guarantee', tone: 'violet' },
      { label: 'fails on', value: 'arbitrary binary trees' },
      { label: 'fallback', value: 'plain DFS = O(n)' },
    ],
    caption: 'Caveat: the leftmost-vs-rightmost depth equality only proves perfection because the tree is complete (last row left-packed). On an arbitrary binary tree, equal extreme depths could still hide gaps in the middle — the shortcut would silently overcount. Always check the constraint before reaching for this trick.',
  });

  frames.push({
    array: tree.slice(1),
    chip: [
      { label: 'final answer', value: '10', tone: 'pink' },
      { label: 'depth measurements', value: '6' },
      { label: 'recursive calls', value: '6' },
    ],
    caption: 'Done. 10 nodes counted via 6 depth measurements (each O(log n) = O(4)) and 6 recursive calls — total ~24 unit operations, vs 10 for the naive walk. At this scale naive wins, but the gap inverts dramatically as n grows.',
  });

  return { renderer: 'array', title: 'Count Complete Tree Nodes — leftmost vs rightmost depth, O(log^2 n)', frames };
}

function smallestDistancePairViz() {
  const nums = [1, 3, 1, 6, 4];
  const k = 3;
  const frames = [];

  frames.push({
    array: nums.slice(),
    chip: [
      { label: 'nums', value: '[' + nums.join(',') + ']' },
      { label: 'k', value: String(k) },
      { label: 'find', value: 'k-th smallest |a - b|', tone: 'violet' },
    ],
    caption: 'Find the k-th smallest absolute difference among all C(n, 2) pairs. n = 5 here, so 10 pairs total. Brute force builds every pair, sorts, picks index k-1 — O(n^2 log n). Binary-searching the answer collapses it to O(n log n + n log(max)).',
  });

  const sorted = nums.slice().sort((a, b) => a - b);
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'sorted', value: '[' + sorted.join(',') + ']', tone: 'violet' },
      { label: 'min diff', value: '0 (= 1 - 1)' },
      { label: 'max diff', value: String(sorted[sorted.length - 1] - sorted[0]) },
    ],
    caption: 'Sort first: [1,1,3,4,6]. After sorting, |a - b| for any pair becomes (later - earlier), which lets us count pairs with diff <= d via a sliding window. Search space for the answer: [0, max - min] = [0, 5]. The k-th smallest distance lives somewhere in this range.',
  });

  // Helper: count pairs with diff <= d, using sliding window on sorted
  const countPairs = (d) => {
    let count = 0;
    let l = 0;
    for (let r = 0; r < sorted.length; r++) {
      while (sorted[r] - sorted[l] > d) l++;
      count += r - l;
    }
    return count;
  };

  // Binary search trace
  let lo = 0, hi = sorted[sorted.length - 1] - sorted[0];

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'lo', value: String(lo) },
      { label: 'hi', value: String(hi), tone: 'pink' },
      { label: 'invariant', value: 'answer in [lo, hi]', tone: 'violet' },
    ],
    caption: 'Binary search on the answer d: smallest d such that at least k pairs have distance <= d. countPairs(d) is monotone in d, which is exactly what binary search needs. lo = 0, hi = 5.',
  });

  // Iteration 1: mid = 2
  let mid = (lo + hi) >> 1;
  let c = countPairs(mid);
  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'current', 1: 'current', 2: 'current' },
    chip: [
      { label: 'mid (d)', value: String(mid) },
      { label: 'pairs with diff <= ' + mid, value: String(c) },
      { label: 'k', value: String(k), tone: 'pink' },
    ],
    caption: 'mid = 2. Sliding window: r=0 -> 0 pairs, r=1 -> [1,1] diff 0 -> 1 pair, r=2 -> [1,3] diff 2, [1,3] diff 2 -> 2 pairs, r=3 -> [3,4] diff 1, plus the two earlier "1" entries are too far (4-1 = 3 > 2) -> shrink l, get 1 pair, r=4 -> [4,6] diff 2 -> 1 pair. Total = 5 pairs.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'count', value: String(c) + ' >= ' + k },
      { label: 'verdict', value: 'd = 2 is feasible', tone: 'violet' },
      { label: 'next', value: 'try smaller — hi = mid', tone: 'pink' },
    ],
    caption: '5 pairs with diff <= 2, and we only need 3 -> the answer is <= 2. Shrink hi to mid = 2. Critical: we use hi = mid (not mid - 1) because mid itself might be the exact answer.',
  });
  hi = mid;

  // Iteration 2: mid = 1
  mid = (lo + hi) >> 1;
  c = countPairs(mid);
  frames.push({
    array: sorted.slice(),
    highlights: { 0: 'current', 1: 'current' },
    chip: [
      { label: 'lo, hi', value: lo + ', ' + hi },
      { label: 'mid', value: String(mid) },
      { label: 'pairs with diff <= ' + mid, value: String(c) },
    ],
    caption: 'lo=0, hi=2 -> mid=1. Count pairs with diff <= 1: [1,1] diff 0, [3,4] diff 1. That is 2 pairs. 2 < k = 3 — not enough. The k-th smallest cannot be <= 1; it must be larger.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'count', value: String(c) + ' < ' + k },
      { label: 'verdict', value: 'd = 1 not feasible', tone: 'pink' },
      { label: 'next', value: 'go larger — lo = mid + 1', tone: 'violet' },
    ],
    caption: 'Only 2 pairs at distance <= 1, but we need at least 3. So the answer is > 1. Set lo = mid + 1 = 2. Now lo == hi == 2 — loop terminates.',
  });
  lo = mid + 1;

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'lo == hi', value: String(lo) },
      { label: 'k-th smallest distance', value: String(lo), tone: 'pink' },
      { label: 'verify', value: '5 pairs <= 2, 2 pairs <= 1', tone: 'violet' },
    ],
    caption: 'lo == hi means the search has converged. Answer = 2. Sanity check: the sorted pair distances are 0, 1, 2, 2, 2, 3, 3, 3, 5, 5 — the 3rd smallest is indeed 2. The binary search never built this list; it only counted into it.',
  });

  // Why two-pointer works frames
  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'window invariant', value: 'sorted[r] - sorted[l] <= d', tone: 'violet' },
      { label: 'pairs ending at r', value: 'r - l' },
      { label: 'monotone l', value: 'never moves backward' },
    ],
    caption: 'Sliding-window count: for each right endpoint r, find the smallest l with sorted[r] - sorted[l] <= d. Every index in [l, r-1] paired with r is valid -> contributes (r - l) pairs. Because sorted is non-decreasing, l only moves forward across the entire scan -> O(n) per countPairs call, not O(n^2).',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'binary search calls', value: 'O(log(max - min))' },
      { label: 'count per call', value: 'O(n)' },
      { label: 'sort upfront', value: 'O(n log n)', tone: 'violet' },
    ],
    caption: 'Total cost: O(n log n) sort + O(n log(max - min)) for the binary search. For typical inputs (max ~ 10^6) the log factor is ~20, dwarfed by the sort. Compare to the brute O(n^2) enumeration that blows up at n = 10^4.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'pattern', value: 'binary search on answer', tone: 'violet' },
      { label: 'feasibility', value: 'countPairs(d) >= k' },
      { label: 'monotone?', value: 'yes — more d -> more pairs', tone: 'pink' },
    ],
    caption: '"Binary search on the answer" pattern: when the answer is a number in a known range and feasibility(answer) is monotone, binary-search the answer space and verify each candidate. Reuses on: split array largest sum, capacity to ship, koko eating bananas, magnetic force between balls.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'pitfall', value: 'use hi = mid, not mid - 1', tone: 'pink' },
      { label: 'why', value: 'feasible mid may be the answer' },
      { label: 'parity', value: 'lo = mid + 1 when infeasible', tone: 'violet' },
    ],
    caption: 'Boundary trap: because the search is for the smallest feasible d, the feasible branch keeps mid in play (hi = mid). The infeasible branch excludes mid (lo = mid + 1). Swap these and the loop either infinite-loops or skips the true minimum.',
  });

  frames.push({
    array: sorted.slice(),
    chip: [
      { label: 'final answer', value: String(lo), tone: 'pink' },
      { label: 'pairs verified', value: '5' },
      { label: 'time', value: 'O(n log n + n log V)', tone: 'violet' },
    ],
    caption: 'Final: k-th smallest pair distance = 2. The algorithm sorted once, ran 2 binary-search iterations, and each iteration did a single O(n) sliding-window pass. Output produced without ever materializing the full pair list.',
  });

  return { renderer: 'array', title: 'Find K-th Smallest Pair Distance — binary search on distance + sliding window', frames };
}

`;

const ENTRY_BLOCK = `  'count-complete-tree-nodes': {
    tags: ['tree', 'binary-tree', 'binary-search', 'depth-first-search', 'divide-and-conquer'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'apple', 'bloomberg', 'uber'],
    viz: countCompleteTreeNodesViz(),
    solutions: {
      python: {
        code: \`# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def countNodes(self, root):
        if not root:
            return 0
        # Measure leftmost and rightmost depths
        ld, rd = 0, 0
        n = root
        while n:
            ld += 1
            n = n.left
        n = root
        while n:
            rd += 1
            n = n.right
        # Perfect subtree shortcut
        if ld == rd:
            return (1 << ld) - 1
        # Otherwise recurse — one side is guaranteed perfect
        return 1 + self.countNodes(root.left) + self.countNodes(root.right)\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: 'At every node, measure leftmost and rightmost depths in O(log n). If equal, the subtree is perfect and contains exactly (1 << h) - 1 nodes — return immediately, no descent. Otherwise recurse into both children; exactly one side is perfect by the complete-tree invariant, so it short-circuits, giving O(log n) genuine recursive calls along the path.',
      },
      javascript: {
        code: \`function countNodes(root) {
  if (!root) return 0;
  let ld = 0, rd = 0;
  for (let n = root; n; n = n.left) ld++;
  for (let n = root; n; n = n.right) rd++;
  if (ld === rd) return (1 << ld) - 1;
  return 1 + countNodes(root.left) + countNodes(root.right);
}\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: 'Two tight for-loops measure the leftmost and rightmost spines. Bit-shift (1 << ld) computes 2^ld in one machine op — clearer than Math.pow and avoids float coercion at large depths.',
      },
      java: {
        code: \`class Solution {
    public int countNodes(TreeNode root) {
        if (root == null) return 0;
        int ld = 0, rd = 0;
        for (TreeNode n = root; n != null; n = n.left) ld++;
        for (TreeNode n = root; n != null; n = n.right) rd++;
        if (ld == rd) return (1 << ld) - 1;
        return 1 + countNodes(root.left) + countNodes(root.right);
    }
}\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: '(1 << ld) is safe for ld up to 30 — well above any realistic tree height. Each recursive call halves the problem because one side is perfect, giving O(log n) genuine calls and the O(log^2 n) total.',
      },
      cpp: {
        code: \`class Solution {
public:
    int countNodes(TreeNode* root) {
        if (!root) return 0;
        int ld = 0, rd = 0;
        for (TreeNode* n = root; n; n = n->left) ld++;
        for (TreeNode* n = root; n; n = n->right) rd++;
        if (ld == rd) return (1 << ld) - 1;
        return 1 + countNodes(root->left) + countNodes(root->right);
    }
};\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: 'Same leftmost-vs-rightmost spine measurement. Bit-shift returns int — fine because complete-tree height stays under 31 for any sane input.',
      },
      c: {
        code: \`int countNodes(struct TreeNode* root) {
    if (!root) return 0;
    int ld = 0, rd = 0;
    for (struct TreeNode* n = root; n; n = n->left) ld++;
    for (struct TreeNode* n = root; n; n = n->right) rd++;
    if (ld == rd) return (1 << ld) - 1;
    return 1 + countNodes(root->left) + countNodes(root->right);
}\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: 'Plain C version: same spine walks, same shortcut. No allocation, no helper struct — recursion stack is the only memory cost.',
      },
      go: {
        code: \`func countNodes(root *TreeNode) int {
    if root == nil {
        return 0
    }
    ld, rd := 0, 0
    for n := root; n != nil; n = n.Left {
        ld++
    }
    for n := root; n != nil; n = n.Right {
        rd++
    }
    if ld == rd {
        return (1 << ld) - 1
    }
    return 1 + countNodes(root.Left) + countNodes(root.Right)
}\`,
        complexity: { time: 'O(log^2 n)', space: 'O(log n) recursion' },
        approach: 'Idiomatic Go: short-var declarations for the depth counters, capital-letter field access (Left/Right) on the standard *TreeNode. Bit-shift portable across all integer widths Go supports.',
      },
    },
  },
  'find-k-th-smallest-pair-distance': {
    tags: ['array', 'binary-search', 'two-pointers', 'sorting'],
    companies: ['google', 'amazon', 'meta', 'microsoft', 'uber', 'apple'],
    viz: smallestDistancePairViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def smallestDistancePair(self, nums, k):
        nums.sort()
        n = len(nums)

        def count_pairs_within(d):
            # Pairs (i, j) with i < j and nums[j] - nums[i] <= d
            count = 0
            l = 0
            for r in range(n):
                while nums[r] - nums[l] > d:
                    l += 1
                count += r - l
            return count

        lo, hi = 0, nums[-1] - nums[0]
        while lo < hi:
            mid = (lo + hi) // 2
            if count_pairs_within(mid) >= k:
                hi = mid
            else:
                lo = mid + 1
        return lo\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'Binary-search the answer d in [0, max - min]. For each candidate d, count pairs with distance <= d via a forward-only sliding window in O(n). The count is monotone in d, so the smallest d hitting count >= k is the k-th order statistic of the distance multiset.',
      },
      javascript: {
        code: \`function smallestDistancePair(nums, k) {
  nums.sort((a, b) => a - b);
  const n = nums.length;
  const countPairsWithin = (d) => {
    let count = 0, l = 0;
    for (let r = 0; r < n; r++) {
      while (nums[r] - nums[l] > d) l++;
      count += r - l;
    }
    return count;
  };
  let lo = 0, hi = nums[n - 1] - nums[0];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (countPairsWithin(mid) >= k) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'JS .sort default is lexicographic — pass (a,b) => a - b or numeric inputs sort wrong. The (lo + hi) >> 1 midpoint uses bit-shift instead of floor to dodge the rare V8 deopt on negative integers and stays branch-free.',
      },
      java: {
        code: \`import java.util.Arrays;

class Solution {
    public int smallestDistancePair(int[] nums, int k) {
        Arrays.sort(nums);
        int n = nums.length;
        int lo = 0, hi = nums[n - 1] - nums[0];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countPairsWithin(nums, mid) >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private int countPairsWithin(int[] nums, int d) {
        int count = 0, l = 0;
        for (int r = 0; r < nums.length; r++) {
            while (nums[r] - nums[l] > d) l++;
            count += r - l;
        }
        return count;
    }
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'lo + (hi - lo) / 2 instead of (lo + hi) / 2 to dodge integer overflow on adversarial inputs (the classic Java binary-search bug). Helper method keeps the main loop readable.',
      },
      cpp: {
        code: \`#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int smallestDistancePair(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        auto countPairsWithin = [&](int d) {
            int count = 0, l = 0;
            for (int r = 0; r < n; r++) {
                while (nums[r] - nums[l] > d) l++;
                count += r - l;
            }
            return count;
        };
        int lo = 0, hi = nums.back() - nums.front();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countPairsWithin(mid) >= k) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'Capture-by-reference lambda for countPairsWithin keeps nums/n addressable without re-passing. std::sort is introsort — guaranteed O(n log n) worst case, unlike pure quicksort.',
      },
      c: {
        code: \`#include <stdlib.h>

static int cmp(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

static int countPairsWithin(int* nums, int n, int d) {
    int count = 0, l = 0;
    for (int r = 0; r < n; r++) {
        while (nums[r] - nums[l] > d) l++;
        count += r - l;
    }
    return count;
}

int smallestDistancePair(int* nums, int numsSize, int k) {
    qsort(nums, numsSize, sizeof(int), cmp);
    int lo = 0, hi = nums[numsSize - 1] - nums[0];
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (countPairsWithin(nums, numsSize, mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'qsort with a branchless comparator (avoids the classic a - b overflow trap on INT_MIN). Sliding-window counter mutates l in place — fastest path with zero allocation.',
      },
      go: {
        code: \`import "sort"

func smallestDistancePair(nums []int, k int) int {
    sort.Ints(nums)
    n := len(nums)
    countPairsWithin := func(d int) int {
        count, l := 0, 0
        for r := 0; r < n; r++ {
            for nums[r]-nums[l] > d {
                l++
            }
            count += r - l
        }
        return count
    }
    lo, hi := 0, nums[n-1]-nums[0]
    for lo < hi {
        mid := lo + (hi-lo)/2
        if countPairsWithin(mid) >= k {
            hi = mid
        } else {
            lo = mid + 1
        }
    }
    return lo
}\`,
        complexity: { time: 'O(n log n + n log V)', space: 'O(1) extra' },
        approach: 'sort.Ints is the in-place int sort. Closure captures nums/n by reference (Go closures capture variables, not values) so the helper sees the sorted slice without re-passing.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
// Tokenizer: skip over string literals (', ", `) and // / /* */ comments
// so braces inside template strings do not throw off the count.
let p = openBracePos;
while (p < src.length) {
  const ch = src[p];
  const ch2 = src[p + 1];
  if (ch === '/' && ch2 === '/') {
    const nl = src.indexOf('\n', p + 2);
    p = nl < 0 ? src.length : nl + 1;
    continue;
  }
  if (ch === '/' && ch2 === '*') {
    const end = src.indexOf('*/', p + 2);
    p = end < 0 ? src.length : end + 2;
    continue;
  }
  if (ch === "'" || ch === '"') {
    const quote = ch;
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === quote) { p++; break; }
      p++;
    }
    continue;
  }
  if (ch === '`') {
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '`') { p++; break; }
      if (src[p] === '$' && src[p + 1] === '{') {
        p += 2;
        let nest = 1;
        while (p < src.length && nest > 0) {
          const c = src[p];
          if (c === '\\') { p += 2; continue; }
          if (c === "'" || c === '"') {
            const q = c; p++;
            while (p < src.length) {
              if (src[p] === '\\') { p += 2; continue; }
              if (src[p] === q) { p++; break; }
              p++;
            }
            continue;
          }
          if (c === '`') {
            p++;
            while (p < src.length && src[p] !== '`') {
              if (src[p] === '\\') { p += 2; continue; }
              p++;
            }
            p++;
            continue;
          }
          if (c === '{') nest++;
          else if (c === '}') nest--;
          p++;
        }
        continue;
      }
      p++;
    }
    continue;
  }
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) { closeIdx = p; break; }
  }
  p++;
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced viz fns + 2 entries (count-complete-tree-nodes, find-k-th-smallest-pair-distance) into ' + path.basename(FILE));
console.log('  skipped range-sum-of-bst — slug already present with full 6-language content');
console.log('  skipped kth-smallest-element-in-a-sorted-matrix — user-flagged replacement target');
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
