#!/usr/bin/env node
// Build WAVE 34O: maximum-difference-between-node-and-ancestor + binary-tree-cameras
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

// ---------------- shared tree helpers ----------------
class Node {
  constructor(v) { this.val = v; this.left = null; this.right = null; }
}

function buildFromLcArray(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new Node(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const cur = q.shift();
    if (i < arr.length) {
      const lv = arr[i++];
      if (lv !== null) { cur.left = new Node(lv); q.push(cur.left); }
    }
    if (i < arr.length) {
      const rv = arr[i++];
      if (rv !== null) { cur.right = new Node(rv); q.push(cur.right); }
    }
  }
  return root;
}

function randomLcArray(lcg, minN, maxN, valLo, valHi, nullProb) {
  const n = minN + (lcg() % (maxN - minN + 1));
  const span = valHi - valLo + 1;
  const arr = [];
  // root never null
  arr.push(valLo + (lcg() % span));
  // BFS-style array: produce up to n non-null nodes; allow nulls scattered
  let nonNull = 1;
  while (nonNull < n) {
    const r = lcg() / 0xFFFFFFFF;
    if (r < nullProb) {
      arr.push(null);
    } else {
      arr.push(valLo + (lcg() % span));
      nonNull++;
    }
  }
  // trim trailing nulls
  while (arr.length && arr[arr.length - 1] === null) arr.pop();
  return arr;
}

// ============================================================
// PROBLEM 1: maximum-difference-between-node-and-ancestor (LC 1026)
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F34EA);

  // canonical reference solution: DFS carrying running (min, max) of ancestors
  function maxAncestorDiff(rootArr) {
    const root = buildFromLcArray(rootArr);
    if (!root) return 0;
    let best = 0;
    function dfs(node, lo, hi) {
      if (!node) return;
      const v = node.val;
      const nlo = Math.min(lo, v);
      const nhi = Math.max(hi, v);
      // best diff so far includes (hi - v) and (v - lo) where lo/hi were ancestor bounds
      const local = Math.max(Math.abs(v - lo), Math.abs(v - hi));
      if (local > best) best = local;
      dfs(node.left, nlo, nhi);
      dfs(node.right, nlo, nhi);
    }
    dfs(root, root.val, root.val);
    return best;
  }

  const cases = [];

  // canonical LC samples
  cases.push([8,3,10,1,6,null,14,null,null,4,7,13]);
  cases.push([1,null,2,null,0,3]);

  // edges: tiny trees
  cases.push([5]);
  cases.push([1,2]);
  cases.push([1,null,2]);
  cases.push([2,1]);
  cases.push([1,2,3]);

  // monotone increasing right spine
  cases.push([1,null,2,null,3,null,4,null,5]);
  // monotone decreasing left spine
  cases.push([10,9,null,8,null,7,null,6,null]);

  // extreme value range
  cases.push([100000,1,null,null,100000]);
  cases.push([0,100000,0,0,100000]);
  cases.push([50000,0,100000]);

  // negative not allowed by constraint (0..1e5); test full-range bounds
  cases.push([0,100000]);
  cases.push([100000,0]);

  // balanced tree
  cases.push([5,3,8,1,4,7,9]);
  cases.push([20,10,30,5,15,25,35,1,7,12,18,22,28,32,40]);

  // all equal values
  cases.push([7,7,7,7,7,7,7]);
  cases.push([3,3,3]);

  // left-heavy
  cases.push([8,3,null,1,6,null,null,null,null,4,7]);

  // right-heavy with gap
  cases.push([1,null,9,null,2,null,8,null,3]);

  // small randomized
  while (cases.length < 27) {
    const arr = randomLcArray(lcg, 4, 15, 0, 100, 0.25);
    cases.push(arr);
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: String(maxAncestorDiff(arr))
  }));

  return {
    slug: "maximum-difference-between-node-and-ancestor",
    obj: {
      description: "Given the `root` of a binary tree, return the largest value `V` for which there exist different nodes `A` and `B` such that `V = |A.val - B.val|` and `A` is an **ancestor** of `B`. A node `A` is an ancestor of `B` if either `A` is the parent of `B`, or `A` is the ancestor of `B`'s parent.\n\nExamples:\n\n```\nInput:  root = [8,3,10,1,6,null,14,null,null,4,7,13]\nOutput: 7\nExplanation: ancestor pairs include (8,3), (8,1), (8,6), (8,4), (8,7), (8,10),\n             (8,14), (8,13), (3,1), (3,6), (3,4), (3,7), (6,4), (6,7),\n             (10,14), (10,13), (14,13). The maximum |A.val - B.val| is |8 - 1| = 7.\n\nInput:  root = [1,null,2,null,0,3]\nOutput: 3\nExplanation: |1 - 0| = 1, |2 - 0| = 2, |2 - 3| = 1, but the deepest ancestor chain\n             gives |3 - 0| = 3 via ancestor 3 of node 0.\n```\n\n**This is LeetCode 1026.** The naive way is to enumerate every ancestor-descendant pair: each path from the root could pair every prefix node with every suffix node, giving `O(N^2)` in a balanced tree and `O(N^2)` worst case. The clean fix is a single DFS that carries the **running minimum and maximum of all ancestors** down each path.",
      method_name: "maxAncestorDiff",
      params: [
        { name: "root", type: "TreeNode" }
      ],
      return_type: "int",
      tags: ["tree", "dfs", "binary-tree", "recursion"],
      pattern: "**Reframe the question.** For any descendant `B`, the largest `|A.val - B.val|` over ancestors `A` is `max(B.val - minAncestor, maxAncestor - B.val)` where `minAncestor` and `maxAncestor` are the smallest and largest values among `B`'s ancestors. So we don't need to track each ancestor individually — only the running `(min, max)` along the path from the root.\n\n**Single DFS, two carried values.** Call `dfs(node, lo, hi)` where `lo = min(ancestor.val)` and `hi = max(ancestor.val)` over the strict ancestors on the way from the root. At each node:\n1. Compute the candidate answer at this node: `max(hi - node.val, node.val - lo)`. Both differences are non-negative because `lo <= node.val_along_path <= hi` is not guaranteed (we use `abs` form); but with `lo <= hi` carried correctly, `hi - node.val` covers the 'go below an ancestor' case and `node.val - lo` covers the 'go above an ancestor' case.\n2. Update the global best.\n3. Recurse left and right with `(min(lo, node.val), max(hi, node.val))`.\n\n**Why include the node itself in the carried (lo, hi) for the children.** A node `A` is an ancestor of `B` if `A` is the parent of `B` (or higher). So when we recurse into a child, the current node IS the immediate ancestor — its value must be folded into `(lo, hi)` for the child's call.\n\n**Seed the recursion.** Start with `dfs(root, root.val, root.val)`. The root has no ancestors, so the initial `(lo, hi)` is degenerate; the difference computed at the root is `0`, which doesn't affect the answer.\n\n**Brute force.** Enumerate every node-ancestor pair: DFS, push `node.val` onto a stack, on visiting `B` compare against every value on the stack, pop on the way back. Total work: sum over each node `B` of `depth(B)`, which is `O(N^2)` worst case (skewed tree). Correct but slow.\n\n**Optimal (carried bounds).** Each node does `O(1)` work and is visited once. Total `O(N)` time and `O(H)` recursion stack where `H` is tree height (worst case `O(N)` for a skewed tree, `O(log N)` for balanced).\n\n**Alternative formulation (top-down with explicit ancestor list).** Some people pass the full ancestor list down. Equivalent but wasteful — the only ancestor properties that matter for the answer at `B` are `min` and `max` of `ancestor.val`.\n\n**Edge cases.** Single node: no ancestor pairs, answer is `0`. Empty tree (not strictly LC-allowed but defensive): also `0`. Long skewed tree: still `O(N)` time, `O(N)` stack.",
      follow_up: "**Variant 1 — track the actual `(A, B)` pair achieving the max.** Carry `(loNode, hiNode)` instead of just values; when a new best is found, record the pair. `O(N)`.\n\n**Variant 2 — minimum difference between any node and its ancestor.** Replace `max` with `min`, init `best = +infinity`. Symmetric. Useful in BST contexts where the minimum ancestor diff has nicer structure.\n\n**Variant 3 — max diff between any two nodes on the same root-to-leaf path** (not strictly ancestor-descendant). Slightly more general: as you DFS, carry the running min and max of path values, including the current node. At each leaf, candidate = `hi - lo`. Take the max over leaves.\n\n**Variant 4 — k-th largest |ancestor - descendant| difference.** No longer single-value; need a heap of size `k`. `O(N log k)`.\n\n**Variant 5 — restrict to ancestor-descendant pairs where ancestor is at distance >= d from descendant.** Carry `(min, max)` only over ancestors at the appropriate depth; use a sliding window of depths. Doable with two stacks of bounds.\n\n**Variant 6 — multi-tree forest.** Apply the same DFS to each root, return the maximum across all trees.\n\n**Variant 7 — return the max diff for every node `B` (mapping B -> max diff to any ancestor).** Single DFS records the per-node max in a dictionary keyed by node id. `O(N)`.\n\n**Variant 8 — same problem but `A` is a descendant of `B` (reverse direction).** By symmetry of `|.|`, the answer is identical: the ancestor-descendant relation is symmetric for the max-absolute-difference question.",
      complexity: {
        time: "**O(N)** where `N` is the number of nodes. Each node is visited exactly once during the DFS, and each visit does `O(1)` work — two `min/max` updates, one absolute-difference computation, and two recursive calls.",
        space: "**O(H)** for the recursion stack, where `H` is the height of the tree. `O(log N)` for balanced trees, `O(N)` for skewed (linked-list-like) trees. No extra data structures beyond the running `(lo, hi)` integers per stack frame.",
        notes: "The carried `(lo, hi)` invariant is the crux. Without it, you would have to maintain a list of ancestor values and scan it per descendant — `O(N^2)` worst case. The single-DFS bounded-state approach is the canonical interview answer.",
        optimal: "**O(N) time and O(H) space is optimal.** Every node must be visited at least once to know whether it participates in the maximum-difference pair, and the recursion stack is unavoidable for any tree traversal (iterative-explicit-stack versions trade recursion for `O(H)` heap, not better asymptotically)."
      },
      constraints: [
        "Number of nodes is in the range `[2, 5000]`",
        "`0 <= Node.val <= 10^5`",
        "The tree is a proper binary tree (each node has 0, 1, or 2 children)",
        "Empty input never occurs by problem statement; defensive code returns `0`",
        "Result is guaranteed to be non-negative (at least one ancestor-descendant pair exists)"
      ],
      hints: [
        "**You don't need each ancestor individually.** For any descendant `B`, the maximum `|A.val - B.val|` over ancestors `A` only depends on `min(A.val)` and `max(A.val)` among `B`'s ancestors.",
        "**Carry two numbers down the DFS.** As you recurse into a child, fold the current node's value into the running `(lo, hi)` of ancestors. At each node compute `max(hi - val, val - lo)` and update the global best.",
        "**Seed the recursion** with `dfs(root, root.val, root.val)`. The root contributes `0` to the answer (no ancestors), so this initialization is safe.",
        "**Watch the direction.** Some people accidentally exclude the current node from the carried bounds; remember the current node IS the immediate ancestor of its children.",
        "**Brute-force baseline.** A correct but slow version pushes ancestor values onto a stack as you go down and pops on the way back. Use that as a mental model when convincing yourself the carried-bounds version is right."
      ],
      test_cases,
      solutions: {
        python: "from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def maxAncestorDiff(self, root: Optional[TreeNode]) -> int:\n        if root is None:\n            return 0\n        best = 0\n        def dfs(node: Optional[TreeNode], lo: int, hi: int) -> None:\n            nonlocal best\n            if node is None:\n                return\n            v = node.val\n            local = max(hi - v, v - lo)\n            if local > best:\n                best = local\n            nlo = lo if lo < v else v\n            nhi = hi if hi > v else v\n            dfs(node.left, nlo, nhi)\n            dfs(node.right, nlo, nhi)\n        dfs(root, root.val, root.val)\n        return best\n",
        javascript: "var maxAncestorDiff = function(root) {\n    if (!root) return 0;\n    let best = 0;\n    function dfs(node, lo, hi) {\n        if (!node) return;\n        const v = node.val;\n        const local = Math.max(hi - v, v - lo);\n        if (local > best) best = local;\n        const nlo = lo < v ? lo : v;\n        const nhi = hi > v ? hi : v;\n        dfs(node.left, nlo, nhi);\n        dfs(node.right, nlo, nhi);\n    }\n    dfs(root, root.val, root.val);\n    return best;\n};\n",
        java: "class TreeNode {\n    int val;\n    TreeNode left;\n    TreeNode right;\n    TreeNode() {}\n    TreeNode(int val) { this.val = val; }\n    TreeNode(int val, TreeNode left, TreeNode right) {\n        this.val = val; this.left = left; this.right = right;\n    }\n}\n\nclass Solution {\n    private int best;\n\n    public int maxAncestorDiff(TreeNode root) {\n        if (root == null) return 0;\n        best = 0;\n        dfs(root, root.val, root.val);\n        return best;\n    }\n\n    private void dfs(TreeNode node, int lo, int hi) {\n        if (node == null) return;\n        int v = node.val;\n        int local = Math.max(hi - v, v - lo);\n        if (local > best) best = local;\n        int nlo = Math.min(lo, v);\n        int nhi = Math.max(hi, v);\n        dfs(node.left, nlo, nhi);\n        dfs(node.right, nlo, nhi);\n    }\n}\n",
        cpp: "#include <algorithm>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode* left;\n    TreeNode* right;\n    TreeNode() : val(0), left(nullptr), right(nullptr) {}\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n    TreeNode(int x, TreeNode* l, TreeNode* r) : val(x), left(l), right(r) {}\n};\n\nclass Solution {\npublic:\n    int best;\n\n    void dfs(TreeNode* node, int lo, int hi) {\n        if (!node) return;\n        int v = node->val;\n        int local = max(hi - v, v - lo);\n        if (local > best) best = local;\n        int nlo = min(lo, v);\n        int nhi = max(hi, v);\n        dfs(node->left, nlo, nhi);\n        dfs(node->right, nlo, nhi);\n    }\n\n    int maxAncestorDiff(TreeNode* root) {\n        if (!root) return 0;\n        best = 0;\n        dfs(root, root->val, root->val);\n        return best;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: binary-tree-cameras (LC 968)
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F34EB);

  // canonical reference solution: tree DP with 3 states
  // returns [cameras, state] where state is 0=not monitored, 1=monitored no camera, 2=has camera
  function minCameraCover(rootArr) {
    const root = buildFromLcArray(rootArr);
    if (!root) return 0;
    let cams = 0;
    // state: 0 = needs cover, 1 = covered (no camera here), 2 = has camera
    function dfs(node) {
      if (!node) return 1; // null treated as covered to avoid placing cameras at leaves
      const l = dfs(node.left);
      const r = dfs(node.right);
      if (l === 0 || r === 0) {
        cams++;
        return 2;
      }
      if (l === 2 || r === 2) return 1;
      return 0;
    }
    if (dfs(root) === 0) cams++;
    return cams;
  }

  const cases = [];

  // canonical LC samples
  cases.push([0,0,null,0,0]);
  cases.push([0,0,null,0,null,0,null,null,0]);

  // tiny
  cases.push([0]);
  cases.push([0,0]);
  cases.push([0,null,0]);
  cases.push([0,0,0]);

  // a path of 4
  cases.push([0,0,null,0,null,0]);

  // a path of 5
  cases.push([0,0,null,0,null,0,null,0]);

  // perfect tree depth 2
  cases.push([0,0,0,0,0,0,0]);

  // perfect tree depth 3
  cases.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

  // left spine of 6
  cases.push([0,0,null,0,null,0,null,0,null,0]);

  // right spine of 6
  cases.push([0,null,0,null,0,null,0,null,0,null,0]);

  // mixed: left subtree spine, right subtree leaf
  cases.push([0,0,0,0,null,null,null,0]);

  // single leaf at each side
  cases.push([0,0,0,null,null,0,0]);

  // node with only right child chain
  cases.push([0,null,0,null,0]);

  // node with only left child chain
  cases.push([0,0,null,0,null]);

  // larger balanced
  cases.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

  // odd shape with branches
  cases.push([0,0,0,null,0,0,null,0,null,null,0]);

  // big jagged tree
  cases.push([0,0,0,0,null,0,0,0,null,null,null,0,null,0]);

  // ensure we hit 27+ with random shapes
  while (cases.length < 27) {
    // all values are 0 per LC constraint
    const arr = randomLcArray(lcg, 5, 18, 0, 0, 0.2);
    cases.push(arr);
  }

  const test_cases = cases.map((arr) => ({
    inputs: [JSON.stringify(arr)],
    expected: String(minCameraCover(arr))
  }));

  return {
    slug: "binary-tree-cameras",
    obj: {
      description: "You are given the `root` of a binary tree. We install cameras on the **nodes** of the tree. Each camera at a node can monitor **its parent, itself, and its immediate children**. Return the minimum number of cameras needed to monitor every node of the tree.\n\nExamples:\n\n```\n        0\n       / \n      0   \n     / \\  \n    0   0 \n\nInput:  root = [0,0,null,0,0]\nOutput: 1\nExplanation: one camera at the middle (left child of root) covers root, itself, and both its children.\n\n        0\n       / \n      0   \n     / \n    0   \n   / \n  0   \n     \\\n      0\n\nInput:  root = [0,0,null,0,null,0,null,null,0]\nOutput: 2\nExplanation: place a camera at the 1st level child of root and another deeper down.\n```\n\n**This is LeetCode 968.** This is the canonical example of **greedy tree DP with 3 states** — every node is in exactly one of `needs cover`, `covered-no-camera`, or `has-camera`, and the right move is determined entirely by the children's states.",
      method_name: "minCameraCover",
      params: [
        { name: "root", type: "TreeNode" }
      ],
      return_type: "int",
      tags: ["tree", "dp", "greedy", "dfs"],
      pattern: "**The three states per node.** After processing a node's subtree, the node reports one of:\n- `0` = NEEDS_COVER — the node is not yet monitored; its parent must place a camera to cover it.\n- `1` = COVERED — the node is monitored but has no camera (either by its own camera previously placed at a child, or by a parent-camera promised next).\n- `2` = HAS_CAMERA — a camera is installed at this node; it monitors itself, its parent, and its children.\n\n**Postorder DFS with greedy decisions.** Recurse left then right. Read the children's states `(l, r)` and decide the current node's state:\n1. **If either child is `NEEDS_COVER`** -> we MUST place a camera here. Increment camera count, return `HAS_CAMERA`. (A grandparent can't reach the un-covered child, so placing at the parent is the only viable spot, and it's also the most useful: it covers up, self, and both children.)\n2. **Else if either child is `HAS_CAMERA`** -> the current node is covered by its child's camera. Return `COVERED` (no camera here).\n3. **Else both children are `COVERED`** -> the current node is NOT yet monitored. Return `NEEDS_COVER` and let the parent decide.\n\n**Null children are treated as `COVERED`.** This is the subtle initialization: if we treated nulls as `NEEDS_COVER`, we would place cameras at every leaf, which is wasteful. Treating them as covered means the algorithm prefers placing cameras at parents-of-leaves (one camera covers 3 nodes: parent, self, leaf — really 2-3 nodes depending on siblings).\n\n**Root post-processing.** If the root returns `NEEDS_COVER` (no camera at the root and no one above to cover it), place one camera at the root. This is the +1 fix-up at the end.\n\n**Brute force.** Try every subset of nodes as a camera placement, check coverage, take the minimum-cardinality valid set. Exponential — `2^N`.\n\n**Why this greedy is optimal.** This is a classic dominating-set-on-trees argument: in trees, dominating-set has a polynomial-time greedy that processes from leaves up. The 3-state DP captures every relevant configuration for the decision at the current node. Each rule is forced (rule 1 is mandatory; rule 2 is optimal because the camera-at-child doesn't get any benefit from also placing one here; rule 3 is optimal because deferring to the parent keeps options open and never hurts).\n\n**Edge cases.** Single node: returns `NEEDS_COVER` from DFS, +1 at root, answer = 1. Empty tree (defensive): 0.\n\n**Symmetric alternative.** A top-down DP would also work but is more complex (need to track 'is this node observed by a parent camera?' as an extra parameter). The bottom-up form is the cleanest.",
      follow_up: "**Variant 1 — cameras only cover self + children (not parent).** Different state set: `NEEDS_COVER`, `COVERED`, `HAS_CAMERA`. The decision tree changes — a leaf parent doesn't get free coverage from its children's cameras up. Rework rules carefully.\n\n**Variant 2 — camera at each node has a cost `c[v]`, minimize total cost.** No longer just count cameras; the state space stays the same but instead of `+1` per camera, add `c[v]`. The greedy must be replaced with full tree DP: each state stores `(min cost when in this state)`, and transitions take min over children's compatible states.\n\n**Variant 3 — coverage radius `k` (camera covers nodes within distance `k`).** State space grows: each node carries the remaining 'coverage credit' from above. Doable with `O(N * k)` DP.\n\n**Variant 4 — directed tree (rooted with arrows).** Camera only covers downward. Becomes vertex-cover-on-tree — even simpler DP.\n\n**Variant 5 — maximum independent camera set (cameras can't be adjacent).** Different problem entirely; use tree DP `dp[v][0/1]` = max cameras where `v` is or isn't a camera.\n\n**Variant 6 — multiple types of cameras with different coverage.** Combine state per node with type label; same tree-DP framework, larger state space.\n\n**Variant 7 — observe via path of length up to `k`.** Standard tree-path DP, more complex.\n\n**Variant 8 — minimum cameras with a budget on cameras (count <= K).** Add the budget as a parameter; tree DP with state `(node, k_used)`. `O(N * K)`.",
      complexity: {
        time: "**O(N)** — each node is visited exactly once during the postorder DFS, and the constant per-node work is `O(1)` (two child-state reads, one comparison, one decision).",
        space: "**O(H)** for the recursion stack, where `H` is the height of the tree. `O(log N)` balanced, `O(N)` skewed worst case. The state per stack frame is a single integer.",
        notes: "Treating null as `COVERED` is the non-obvious detail. Placing a camera at every leaf is `O(N/2)` cameras; the greedy correctly avoids this by deferring leaves to their parents. The +1 root fixup catches the case where the root itself is not yet monitored after the DFS.",
        optimal: "**O(N) time and O(H) space is optimal.** Every node must be inspected to know whether it requires coverage; the recursion stack depth is intrinsic to any tree traversal. The 3-state DP is the tightest possible per-node state for this dominating-set problem."
      },
      constraints: [
        "Number of nodes is in the range `[1, 1000]`",
        "`Node.val == 0` (values are placeholders; only the tree shape matters)",
        "Cameras can only be placed on nodes (not on edges)",
        "A camera monitors its parent, itself, and its immediate children",
        "Empty tree (defensive) returns 0; single-node tree returns 1"
      ],
      hints: [
        "**Three states per node.** Every node is either `NEEDS_COVER`, `COVERED` (no camera here), or `HAS_CAMERA`. Postorder DFS returns one of these.",
        "**Greedy rule.** If any child is `NEEDS_COVER`, place a camera here (return `HAS_CAMERA`). Otherwise if any child has a camera, this node is `COVERED`. Otherwise this node is `NEEDS_COVER`.",
        "**Treat null children as `COVERED`.** This prevents the algorithm from placing cameras at every leaf — it instead prefers placing them at parents-of-leaves, which is strictly more useful.",
        "**Don't forget the root.** After the DFS, if the root returns `NEEDS_COVER`, add one camera at the root.",
        "**Why this greedy is optimal.** In a tree, the choice at each node is forced by its children. Placing a camera as low as possible (at the deepest internal node that still has uncovered descendants) maximizes the per-camera coverage."
      ],
      test_cases,
      solutions: {
        python: "from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val: int = 0, left: 'Optional[TreeNode]' = None, right: 'Optional[TreeNode]' = None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def minCameraCover(self, root: Optional[TreeNode]) -> int:\n        # state: 0 = needs cover, 1 = covered (no camera), 2 = has camera\n        if root is None:\n            return 0\n        self.cams = 0\n        def dfs(node: Optional[TreeNode]) -> int:\n            if node is None:\n                return 1\n            l = dfs(node.left)\n            r = dfs(node.right)\n            if l == 0 or r == 0:\n                self.cams += 1\n                return 2\n            if l == 2 or r == 2:\n                return 1\n            return 0\n        if dfs(root) == 0:\n            self.cams += 1\n        return self.cams\n",
        javascript: "var minCameraCover = function(root) {\n    if (!root) return 0;\n    let cams = 0;\n    // 0 = needs cover, 1 = covered, 2 = camera\n    function dfs(node) {\n        if (!node) return 1;\n        const l = dfs(node.left);\n        const r = dfs(node.right);\n        if (l === 0 || r === 0) { cams++; return 2; }\n        if (l === 2 || r === 2) return 1;\n        return 0;\n    }\n    if (dfs(root) === 0) cams++;\n    return cams;\n};\n",
        java: "class TreeNode {\n    int val;\n    TreeNode left;\n    TreeNode right;\n    TreeNode() {}\n    TreeNode(int val) { this.val = val; }\n    TreeNode(int val, TreeNode left, TreeNode right) {\n        this.val = val; this.left = left; this.right = right;\n    }\n}\n\nclass Solution {\n    private int cams;\n\n    public int minCameraCover(TreeNode root) {\n        if (root == null) return 0;\n        cams = 0;\n        if (dfs(root) == 0) cams++;\n        return cams;\n    }\n\n    private int dfs(TreeNode node) {\n        if (node == null) return 1;\n        int l = dfs(node.left);\n        int r = dfs(node.right);\n        if (l == 0 || r == 0) { cams++; return 2; }\n        if (l == 2 || r == 2) return 1;\n        return 0;\n    }\n}\n",
        cpp: "struct TreeNode {\n    int val;\n    TreeNode* left;\n    TreeNode* right;\n    TreeNode() : val(0), left(nullptr), right(nullptr) {}\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n    TreeNode(int x, TreeNode* l, TreeNode* r) : val(x), left(l), right(r) {}\n};\n\nclass Solution {\npublic:\n    int cams;\n\n    int dfs(TreeNode* node) {\n        if (!node) return 1;\n        int l = dfs(node->left);\n        int r = dfs(node->right);\n        if (l == 0 || r == 0) { cams++; return 2; }\n        if (l == 2 || r == 2) return 1;\n        return 0;\n    }\n\n    int minCameraCover(TreeNode* root) {\n        if (!root) return 0;\n        cams = 0;\n        if (dfs(root) == 0) cams++;\n        return cams;\n    }\n};\n"
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
    "// ===== WAVE 34O START =====",
    "// === WAVE 34O " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34O " + p1.slug + " END ===",
    "// === WAVE 34O " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34O " + p2.slug + " END ===",
    "// ===== WAVE 34O END =====",
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
if (src.indexOf("WAVE 34O START") !== -1) {
  console.error("WAVE 34O already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34N END marker and append block after it.
const ANCHOR = "// ===== WAVE 34N END =====";
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

console.log("DONE wave34o " + p1.slug + " + " + p2.slug);
process.exit(0);
