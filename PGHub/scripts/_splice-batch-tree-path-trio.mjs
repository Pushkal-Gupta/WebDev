#!/usr/bin/env node
// Atomic splice: path-sum, path-sum-ii, sum-root-to-leaf-numbers.
// Replaces existing placeholder path-sum & path-sum-ii entries (array-renderer stubs)
// with inline 15-frame tree-renderer viz + 6-language solutions.
// Inserts new sum-root-to-leaf-numbers entry.
// Re-runnable: detects upgraded state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

// Idempotency marker: we drop a tagged comment inside each new entry.
const MARKER = '/* SPLICE:tree-path-trio v1 */';
if (src.includes(MARKER)) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

// ─── Helper: scan past a JS string/template/comment and return advance index ──
function findEntryRange(text, slug) {
  const needle = "'" + slug + "':";
  const start = text.indexOf(needle);
  if (start < 0) return null;
  // Find the line start (leading whitespace)
  let lineStart = start;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
  // Find opening { after the colon
  const openBrace = text.indexOf('{', start);
  if (openBrace < 0) return null;
  let depth = 0;
  let state = 'code';
  let closeIdx = -1;
  for (let p = openBrace; p < text.length; p++) {
    const ch = text[p];
    const nx = text[p + 1];
    if (state === 'code') {
      if (ch === '/' && nx === '/') { state = 'line-comment'; p++; continue; }
      if (ch === '/' && nx === '*') { state = 'block-comment'; p++; continue; }
      if (ch === "'") { state = 'sq'; continue; }
      if (ch === '"') { state = 'dq'; continue; }
      if (ch === '`') { state = 'tpl'; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { closeIdx = p; break; }
      }
    } else if (state === 'line-comment') {
      if (ch === '\n') state = 'code';
    } else if (state === 'block-comment') {
      if (ch === '*' && nx === '/') { state = 'code'; p++; }
    } else if (state === 'sq') {
      if (ch === '\\') { p++; continue; }
      if (ch === "'") state = 'code';
    } else if (state === 'dq') {
      if (ch === '\\') { p++; continue; }
      if (ch === '"') state = 'code';
    } else if (state === 'tpl') {
      if (ch === '\\') { p++; continue; }
      if (ch === '`') state = 'code';
    }
  }
  if (closeIdx < 0) return null;
  // Include trailing comma if present
  let endIdx = closeIdx + 1;
  if (text[endIdx] === ',') endIdx++;
  // Include trailing newline
  if (text[endIdx] === '\n') endIdx++;
  return { lineStart, endIdx };
}

// ─── New entry blocks (each contains MARKER, viz with 15 frames, 6 lang solns) ─

const ENTRY_PATH_SUM = `  'path-sum': {
    ${MARKER}
    tags: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: (() => {
      // Tree [5,4,8,11,null,13,4,7,2,null,null,null,1], target = 22
      //              5
      //            /   \\
      //           4     8
      //          /     / \\
      //         11   13   4
      //        /  \\         \\
      //       7    2         1
      const mk = (value, left = null, right = null) => ({ value, left, right });
      const n7 = mk(7), n2 = mk(2), n1 = mk(1);
      const n11 = mk(11, n7, n2);
      const n13 = mk(13);
      const n4r = mk(4, null, n1);
      const n4l = mk(4, n11, null);
      const n8 = mk(8, n13, n4r);
      const root = mk(5, n4l, n8);

      let idCounter = 0;
      const tag = (node) => { if (!node) return; node._id = ++idCounter; tag(node.left); tag(node.right); };
      tag(root);
      const stateById = new Map();
      const cloneWithStates = (node) => {
        if (!node) return null;
        return {
          _id: node._id,
          value: node.value,
          state: stateById.get(node._id) || 'default',
          left: cloneWithStates(node.left),
          right: cloneWithStates(node.right),
        };
      };

      const target = 22;
      const frames = [];
      const snap = (caption, chip, traversal) => {
        frames.push({ tree: cloneWithStates(root), chip, caption, traversal: traversal || [] });
      };

      snap(
        'Goal: does any root-to-leaf path sum exactly to ' + target + '? Recurse with a running remainder — at each node subtract its value; at a leaf, succeed iff remainder hits zero.',
        'target = ' + target,
        ['remainder = ' + target],
      );
      snap(
        'Key invariant: only LEAVES (left == null && right == null) can match. An internal node with remainder == 0 does NOT count — the path must end at a leaf.',
        'leaf-only match',
        ['remainder = ' + target],
      );

      // Visit 5
      stateById.set(root._id, 'current');
      snap('Visit root 5. remainder = 22 - 5 = 17. Recurse left then right.', 'node = 5, rem = 17', ['rem: 22 -> 17']);
      // Visit 4 (left)
      stateById.set(n4l._id, 'current');
      snap('Descend left to 4. remainder = 17 - 4 = 13. 4 has only a left child (11) — try it.', 'node = 4, rem = 13', ['rem: 17 -> 13']);
      // Visit 11
      stateById.set(n11._id, 'current');
      snap('Descend to 11. remainder = 13 - 11 = 2. 11 has two leaf children: 7 and 2. Try 7 first.', 'node = 11, rem = 2', ['rem: 13 -> 2']);
      // Visit 7 (leaf, fail)
      stateById.set(n7._id, 'current');
      snap('Leaf 7. Check: does 7 equal remainder 2? No (7 != 2). This path fails. Backtrack and try sibling 2.', 'leaf 7 vs rem 2 — miss', ['fail at leaf 7']);
      stateById.set(n7._id, 'visited');
      stateById.set(n11._id, 'current');
      // Visit 2 (leaf, success)
      stateById.set(n2._id, 'match');
      snap('Try sibling leaf 2. Check: 2 equals remainder 2? YES. Path 5 -> 4 -> 11 -> 2 sums to 22. Short-circuit — return true.', 'leaf 2 == rem 2 — HIT', ['MATCH: 5 -> 4 -> 11 -> 2 = 22']);

      stateById.set(n11._id, 'visited');
      stateById.set(n4l._id, 'visited');
      stateById.set(root._id, 'visited');
      snap('Bubble true up the call stack. We never explore the right subtree (8 -> ...) because the OR short-circuits.', 'short-circuit OR', ['answer = true']);

      // Educational frames continuing to 15
      snap('Were the answer false, we would have continued: 5 -> 8 -> 13 sums to 26 (fail), 5 -> 8 -> 4 -> 1 sums to 18 (fail). All four leaves checked, return false.', 'exhaustive search', ['worst case: all leaves']);
      snap('Recurrence: hasPath(node, rem) = (leaf && val == rem) OR hasPath(left, rem - val) OR hasPath(right, rem - val). Base case: null returns false.', 'hasPath(node, rem)', []);
      snap('Why subtract instead of accumulate? Either works. Subtracting keeps a single int parameter; accumulating needs (running_sum, target) — slightly noisier.', 'subtract or accumulate', []);
      snap('Edge: empty tree (root == null) returns false — there is no path at all, let alone one summing to target. Handled by the first base case.', 'edge: empty tree', ['hasPath(null, *) = false']);
      snap('Edge: single-node tree with val == target returns true (the root is itself a leaf). val != target returns false.', 'edge: single node', []);
      snap('Trap: target == 0 with internal nodes that hit running sum 0 does NOT short-circuit. Must reach a leaf. Negative values are allowed and freely flip the remainder.', 'leaf check is mandatory', []);
      snap('Iterative variant: DFS with an explicit stack of (node, remaining) pairs. Same O(n) time, swaps recursion stack for explicit stack — useful in languages with shallow call stacks.', 'iterative stack DFS', []);
      snap('Complexity: every node visited at most once -> O(n) time. Space O(h) for recursion (h = tree height). Worst-case skewed tree: O(n) stack.', 'O(n) time, O(h) space', []);
      snap('Done. answer = true. The recursive subtract pattern is the cleanest way to express "does any root-to-leaf path sum to target" in O(n).', 'answer = true', ['final: true']);

      return { renderer: 'tree', title: 'Path Sum — DFS subtract remainder, match at leaf', frames };
    })(),
    solutions: {
      python: {
        code: \`class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if not root:
            return False
        if not root.left and not root.right:
            return root.val == targetSum
        rem = targetSum - root.val
        return (self.hasPathSum(root.left, rem) or
                self.hasPathSum(root.right, rem))\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Recursive DFS with a running remainder. At each non-null node, subtract its value from the target. At a leaf (both children null), succeed iff the remaining target equals the leaf value. Internal-node hits do not count — the path must terminate at a leaf. The OR across left and right short-circuits as soon as either subtree finds a valid path. Empty tree returns false because no path exists at all. Negative values are allowed and naturally flip the remainder; nothing special needed.',
      },
      javascript: {
        code: \`function hasPathSum(root, targetSum) {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  const rem = targetSum - root.val;
  return hasPathSum(root.left, rem) || hasPathSum(root.right, rem);
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Same recurrence. JS short-circuit OR ensures the right subtree is never explored if the left already found a valid path — meaningful constant-factor win on lopsided trees.',
      },
      java: {
        code: \`class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return root.val == targetSum;
        int rem = targetSum - root.val;
        return hasPathSum(root.left, rem) || hasPathSum(root.right, rem);
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Identical structure. Iterative alternative uses a Deque<Pair<TreeNode, Integer>> if you need to avoid the recursion stack — same complexity, more boilerplate.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return root->val == targetSum;
        int rem = targetSum - root->val;
        return hasPathSum(root->left, rem) || hasPathSum(root->right, rem);
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Pure recursion, no allocations. Leaf check uses both child pointers — a node with a single child is internal and cannot terminate a path.',
      },
      c: {
        code: \`#include <stdbool.h>

bool hasPathSum(struct TreeNode* root, int targetSum) {
    if (!root) return false;
    if (!root->left && !root->right) return root->val == targetSum;
    int rem = targetSum - root->val;
    return hasPathSum(root->left, rem) || hasPathSum(root->right, rem);
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Plain C with stdbool. Same recurrence — no heap allocations, only the call stack.',
      },
      go: {
        code: \`func hasPathSum(root *TreeNode, targetSum int) bool {
    if root == nil {
        return false
    }
    if root.Left == nil && root.Right == nil {
        return root.Val == targetSum
    }
    rem := targetSum - root.Val
    return hasPathSum(root.Left, rem) || hasPathSum(root.Right, rem)
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Idiomatic Go recursion. Pointer-receiver nil check guards both empty-tree and recursion past a missing child.',
      },
    },
  },
`;

const ENTRY_PATH_SUM_II = `  'path-sum-ii': {
    ${MARKER}
    tags: ['backtracking', 'tree', 'depth-first-search', 'binary-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: (() => {
      // Tree [5,4,8,11,null,13,4,7,2,null,null,5,1], target = 22
      //              5
      //            /   \\
      //           4     8
      //          /     / \\
      //         11   13   4
      //        /  \\      / \\
      //       7    2    5   1
      const mk = (value, left = null, right = null) => ({ value, left, right });
      const n7 = mk(7), n2 = mk(2), n5l = mk(5), n1 = mk(1);
      const n11 = mk(11, n7, n2);
      const n13 = mk(13);
      const n4r = mk(4, n5l, n1);
      const n4l = mk(4, n11, null);
      const n8 = mk(8, n13, n4r);
      const root = mk(5, n4l, n8);

      let idCounter = 0;
      const tag = (node) => { if (!node) return; node._id = ++idCounter; tag(node.left); tag(node.right); };
      tag(root);
      const stateById = new Map();
      const cloneWithStates = (node) => {
        if (!node) return null;
        return {
          _id: node._id,
          value: node.value,
          state: stateById.get(node._id) || 'default',
          left: cloneWithStates(node.left),
          right: cloneWithStates(node.right),
        };
      };

      const target = 22;
      const frames = [];
      const results = [];
      const path = [];
      const snap = (caption, chip) => {
        frames.push({
          tree: cloneWithStates(root),
          chip,
          caption,
          traversal: ['path = [' + path.join(', ') + ']', 'results = ' + results.length],
        });
      };

      snap(
        'Goal: collect ALL root-to-leaf paths summing to ' + target + '. Same recurrence as Path Sum, but instead of returning a bool we maintain a path list and append a snapshot whenever a leaf closes a valid path.',
        'collect all paths = ' + target,
      );
      snap(
        'Pattern: backtracking. Push value on entry, recurse, pop on exit. Push-then-pop guarantees siblings see the same path prefix.',
        'push -> recurse -> pop',
      );

      // 5
      stateById.set(root._id, 'current'); path.push(5);
      snap('Push 5. path = [5]. remainder = 17. Recurse left.', 'rem = 17');
      // 4
      stateById.set(n4l._id, 'current'); path.push(4);
      snap('Push 4. path = [5, 4]. remainder = 13. Only left child exists — try 11.', 'rem = 13');
      // 11
      stateById.set(n11._id, 'current'); path.push(11);
      snap('Push 11. path = [5, 4, 11]. remainder = 2. Two leaves below: 7 and 2.', 'rem = 2');
      // 7 (fail)
      stateById.set(n7._id, 'current'); path.push(7);
      snap('Push 7 (leaf). remainder becomes -5 — not zero. No match. Pop 7 and try sibling.', 'fail at leaf 7');
      path.pop(); stateById.set(n7._id, 'visited');
      // 2 (success)
      stateById.set(n2._id, 'match'); path.push(2);
      results.push([...path]);
      snap('Push 2 (leaf). remainder = 0. MATCH. Snapshot path [5, 4, 11, 2] into results. Pop 2 and continue.', 'MATCH path #1');
      path.pop(); stateById.set(n2._id, 'visited');
      // Backtrack
      stateById.set(n11._id, 'visited'); path.pop();
      stateById.set(n4l._id, 'visited'); path.pop();
      snap('Pop 11, pop 4. path = [5]. Now recurse right into 8.', 'backtrack to root');
      // 8
      stateById.set(n8._id, 'current'); path.push(8);
      snap('Push 8. path = [5, 8]. remainder = 9. Try left (13) then right (4).', 'rem = 9');
      // 13 (fail)
      stateById.set(n13._id, 'current'); path.push(13);
      snap('Push 13 (leaf). remainder = -4. No match. Pop.', 'fail at leaf 13');
      path.pop(); stateById.set(n13._id, 'visited');
      // 4r
      stateById.set(n4r._id, 'current'); path.push(4);
      snap('Push 4 (right child of 8). path = [5, 8, 4]. remainder = 5. Two leaves: 5 and 1.', 'rem = 5');
      // 5 leaf (success)
      stateById.set(n5l._id, 'match'); path.push(5);
      results.push([...path]);
      snap('Push 5 (leaf). remainder = 0. MATCH. Snapshot path [5, 8, 4, 5]. Pop.', 'MATCH path #2');
      path.pop(); stateById.set(n5l._id, 'visited');
      // 1 leaf (fail)
      stateById.set(n1._id, 'current'); path.push(1);
      snap('Push 1 (leaf). remainder = 4. No match. Pop. All branches exhausted.', 'fail at leaf 1');
      path.pop(); stateById.set(n1._id, 'visited');

      // Unwind
      stateById.set(n4r._id, 'visited'); path.pop();
      stateById.set(n8._id, 'visited'); path.pop();
      stateById.set(root._id, 'visited');
      snap('Recursion fully unwinds. results contains both valid paths.', 'done traversing');

      snap('Final: 2 paths summing to 22 — [5, 4, 11, 2] and [5, 8, 4, 5]. Critical: snapshot the path (slice / new list) when matching — pushing the same reference would mutate later.', 'snapshot, do not alias');

      snap('Alternative: pass path as an immutable new list each recursion. Cleaner code, but allocates O(n) per call -> O(n^2) extra memory in worst case. Backtracking is more memory-efficient.', 'immutable vs backtracking');

      snap('Complexity: O(n) to visit each node + O(L * h) to copy each matched path (L matches, height h). Worst-case skewed tree with all leaves matching: O(n^2). Space: O(h) recursion + output.', 'O(n) + O(L*h)');

      snap('Done. ' + results.length + ' paths collected. Backtracking template generalises to subsets, permutations, and N-queens — same push-recurse-pop skeleton.', 'answer = ' + results.length + ' paths');

      return { renderer: 'tree', title: 'Path Sum II — backtracking DFS, snapshot at every matching leaf', frames };
    })(),
    solutions: {
      python: {
        code: \`class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> List[List[int]]:
        results: List[List[int]] = []
        path: List[int] = []

        def dfs(node: Optional[TreeNode], rem: int) -> None:
            if not node:
                return
            path.append(node.val)
            rem -= node.val
            if not node.left and not node.right and rem == 0:
                results.append(path.copy())
            else:
                dfs(node.left, rem)
                dfs(node.right, rem)
            path.pop()

        dfs(root, targetSum)
        return results\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h)' },
        approach: 'Backtracking DFS. Maintain a shared path list — append the current value on entry, pop on exit (the classic backtracking template). When a leaf closes a path summing to target, append a COPY of path to results — never the live reference, or subsequent pops would corrupt it. Worst case time O(n^2): every leaf matches and copying each length-h path costs O(h). Space O(h) for recursion plus the output.',
      },
      javascript: {
        code: \`function pathSum(root, targetSum) {
  const results = [];
  const path = [];
  const dfs = (node, rem) => {
    if (!node) return;
    path.push(node.val);
    rem -= node.val;
    if (!node.left && !node.right && rem === 0) {
      results.push([...path]);
    } else {
      dfs(node.left, rem);
      dfs(node.right, rem);
    }
    path.pop();
  };
  dfs(root, targetSum);
  return results;
}\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h)' },
        approach: 'Spread copy [...path] is the snapshot — pushing path directly would store the same reference each time and end up with N copies of the empty array after backtracking unwinds.',
      },
      java: {
        code: \`class Solution {
    public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
        List<List<Integer>> results = new ArrayList<>();
        dfs(root, targetSum, new ArrayList<>(), results);
        return results;
    }
    private void dfs(TreeNode node, int rem, List<Integer> path, List<List<Integer>> results) {
        if (node == null) return;
        path.add(node.val);
        rem -= node.val;
        if (node.left == null && node.right == null && rem == 0) {
            results.add(new ArrayList<>(path));
        } else {
            dfs(node.left, rem, path, results);
            dfs(node.right, rem, path, results);
        }
        path.remove(path.size() - 1);
    }
}\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h)' },
        approach: 'new ArrayList<>(path) is the defensive copy. Without it, every entry in results would point at the same mutable list — empty by the time the recursion finishes.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> pathSum(TreeNode* root, int targetSum) {
        vector<vector<int>> results;
        vector<int> path;
        dfs(root, targetSum, path, results);
        return results;
    }
private:
    void dfs(TreeNode* node, int rem, vector<int>& path, vector<vector<int>>& results) {
        if (!node) return;
        path.push_back(node->val);
        rem -= node->val;
        if (!node->left && !node->right && rem == 0) {
            results.push_back(path);
        } else {
            dfs(node->left, rem, path, results);
            dfs(node->right, rem, path, results);
        }
        path.pop_back();
    }
};\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h)' },
        approach: 'results.push_back(path) implicitly copies the vector — no aliasing trap. Reference parameter on path keeps the backtracking shared.',
      },
      c: {
        code: \`/**
 * Return all root-to-leaf paths whose sum equals targetSum.
 * *returnSize -> number of paths, *returnColumnSizes -> length of each path.
 */
int** pathSum(struct TreeNode* root, int targetSum,
              int* returnSize, int** returnColumnSizes) {
    int** results = (int**)malloc(sizeof(int*) * 5000);
    *returnColumnSizes = (int*)malloc(sizeof(int) * 5000);
    int count = 0;
    int path[5000];
    int depth = 0;

    void dfs(struct TreeNode* node, int rem) {
        if (!node) return;
        path[depth++] = node->val;
        rem -= node->val;
        if (!node->left && !node->right && rem == 0) {
            results[count] = (int*)malloc(sizeof(int) * depth);
            for (int i = 0; i < depth; i++) results[count][i] = path[i];
            (*returnColumnSizes)[count] = depth;
            count++;
        } else {
            dfs(node->left, rem);
            dfs(node->right, rem);
        }
        depth--;
    }
    dfs(root, targetSum);
    *returnSize = count;
    return results;
}\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h + output)' },
        approach: 'GCC nested-function extension keeps the recursion compact. A fixed-size scratch buffer holds the working path; each match memcpy-style snapshots into a fresh int* allocation. Caller frees returnColumnSizes and each row.',
      },
      go: {
        code: \`func pathSum(root *TreeNode, targetSum int) [][]int {
    results := [][]int{}
    path := []int{}
    var dfs func(node *TreeNode, rem int)
    dfs = func(node *TreeNode, rem int) {
        if node == nil {
            return
        }
        path = append(path, node.Val)
        rem -= node.Val
        if node.Left == nil && node.Right == nil && rem == 0 {
            snap := make([]int, len(path))
            copy(snap, path)
            results = append(results, snap)
        } else {
            dfs(node.Left, rem)
            dfs(node.Right, rem)
        }
        path = path[:len(path)-1]
    }
    dfs(root, targetSum)
    return results
}\`,
        complexity: { time: 'O(n^2) worst', space: 'O(h)' },
        approach: 'Closure captures path and results. The explicit make + copy is the snapshot — slicing without copying would alias the underlying backing array and later mutations would scramble earlier results.',
      },
    },
  },
`;

const ENTRY_SUM_ROOT_TO_LEAF = `  'sum-root-to-leaf-numbers': {
    ${MARKER}
    tags: ['tree', 'depth-first-search', 'binary-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: (() => {
      // Tree [4,9,0,5,1] — paths 495, 491, 40. Answer 1026.
      //         4
      //        / \\
      //       9   0
      //      / \\
      //     5   1
      const mk = (value, left = null, right = null) => ({ value, left, right });
      const n5 = mk(5), n1 = mk(1), n0 = mk(0);
      const n9 = mk(9, n5, n1);
      const root = mk(4, n9, n0);

      let idCounter = 0;
      const tag = (node) => { if (!node) return; node._id = ++idCounter; tag(node.left); tag(node.right); };
      tag(root);
      const stateById = new Map();
      const cloneWithStates = (node) => {
        if (!node) return null;
        return {
          _id: node._id,
          value: node.value,
          state: stateById.get(node._id) || 'default',
          left: cloneWithStates(node.left),
          right: cloneWithStates(node.right),
        };
      };

      const frames = [];
      let total = 0;
      const snap = (caption, chip, current) => {
        frames.push({
          tree: cloneWithStates(root),
          chip,
          caption,
          traversal: ['current = ' + (current === undefined ? '0' : current), 'total = ' + total],
        });
      };

      snap(
        'Each root-to-leaf path encodes a decimal number — digits read top-down. Sum all such numbers. Example: paths 4-9-5, 4-9-1, 4-0 encode 495, 491, 40 -> total 1026.',
        'paths = decimal numbers',
        0,
      );
      snap(
        'Trick: do not store paths. Carry a running integer current. At each node: current = current * 10 + node.val. At a leaf, add current to total. That is it.',
        'current = current*10 + val',
        0,
      );

      // Visit 4
      stateById.set(root._id, 'current');
      snap('Visit root 4. current = 0 * 10 + 4 = 4. Recurse into left subtree.', 'node = 4, current = 4', 4);
      // Visit 9
      stateById.set(n9._id, 'current');
      snap('Descend to 9. current = 4 * 10 + 9 = 49. Has two leaves below.', 'node = 9, current = 49', 49);
      // Visit 5 (leaf)
      stateById.set(n5._id, 'match');
      total += 495;
      snap('Leaf 5. current = 49 * 10 + 5 = 495. LEAF — add 495 to total. total = ' + total + '. Return.', 'leaf 5 -> +495', 495);
      stateById.set(n5._id, 'visited');
      stateById.set(n9._id, 'current');
      // Visit 1 (leaf)
      stateById.set(n1._id, 'match');
      total += 491;
      snap('Backtrack to 9 (current restored to 49 by call-stack unwind). Visit sibling 1. current = 49 * 10 + 1 = 491. Add 491. total = ' + total + '.', 'leaf 1 -> +491', 491);
      stateById.set(n1._id, 'visited');
      stateById.set(n9._id, 'visited');
      stateById.set(root._id, 'current');
      // Visit 0 (leaf)
      stateById.set(n0._id, 'match');
      total += 40;
      snap('Backtrack to root 4 (current restored to 4). Visit right child 0 — a leaf. current = 4 * 10 + 0 = 40. Add 40. total = ' + total + '.', 'leaf 0 -> +40', 40);
      stateById.set(n0._id, 'visited');
      stateById.set(root._id, 'visited');

      snap('All three paths processed. Recursion implicitly restores current on each return because it is passed by value — no manual backtracking needed.', 'pass-by-value frees us', 0);

      // Padding frames to reach 15 (we have 7 narrative + 4 traversal = 11; add 4 more analytical)
      snap('Why current * 10 + val? Because building a decimal number digit by digit is exactly that: existing digits shift left one place (multiply by 10), then OR in the new ones digit (add).', 'left-shift in base 10', 0);
      snap('Why only add at leaves? Internal nodes are partial numbers — 4 alone is not a path, neither is 49. Only complete root-to-leaf paths represent valid numbers.', 'leaf-only sum', 0);
      snap('What if the tree has a single root node? It IS a leaf. current = root.val, total = root.val. The base case naturally handles it without special-casing.', 'single-node tree', 0);
      snap('Edge: empty tree (root == null) returns 0. The recursion bails on the first null check; nothing is summed.', 'empty -> 0', 0);
      snap('Iterative alternative: BFS with a queue of (node, current) pairs. Same logic, swap recursion stack for explicit queue. Useful when tree depth might blow the call stack.', 'BFS variant', 0);
      snap('Complexity: every node visited once -> O(n) time. Space O(h) for recursion (h = height). No path strings stored — just one int per call frame. Cleaner than collecting paths and parsing them.', 'O(n) time, O(h) space', 0);
      snap('Done. total = ' + total + ' = 495 + 491 + 40. The current*10+val accumulator is the entire trick — no string conversion, no path lists.', 'answer = ' + total, total);

      return { renderer: 'tree', title: 'Sum Root to Leaf Numbers — DFS accumulating digits', frames };
    })(),
    solutions: {
      python: {
        code: \`class Solution:
    def sumNumbers(self, root: Optional[TreeNode]) -> int:
        def dfs(node: Optional[TreeNode], current: int) -> int:
            if not node:
                return 0
            current = current * 10 + node.val
            if not node.left and not node.right:
                return current
            return dfs(node.left, current) + dfs(node.right, current)
        return dfs(root, 0)\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'DFS with a running int carrying the current path-as-number. At each node, shift the existing digits left one decimal place (current * 10) and slot in the new ones digit (+ node.val). At a leaf, return current — it IS a complete root-to-leaf number. At internal nodes, return the sum of left and right subtree results. Empty subtree returns 0 so missing children contribute nothing. Pass-by-value of current means no manual backtracking is needed.',
      },
      javascript: {
        code: \`function sumNumbers(root) {
  const dfs = (node, current) => {
    if (!node) return 0;
    current = current * 10 + node.val;
    if (!node.left && !node.right) return current;
    return dfs(node.left, current) + dfs(node.right, current);
  };
  return dfs(root, 0);
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Same recurrence. JS numbers are doubles — safe for path depths up to ~15 decimal digits before precision loss, which is fine given LeetCode constraints (depth <= 10).',
      },
      java: {
        code: \`class Solution {
    public int sumNumbers(TreeNode root) {
        return dfs(root, 0);
    }
    private int dfs(TreeNode node, int current) {
        if (node == null) return 0;
        current = current * 10 + node.val;
        if (node.left == null && node.right == null) return current;
        return dfs(node.left, current) + dfs(node.right, current);
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'int holds the answer comfortably because LeetCode constraints cap depth at 10 — max path number is 9999999999 which fits in long but not int. Constraints actually cap depth at 10 and node values at 0-9, so worst case is ~10^10 — use long if you want zero risk.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sumNumbers(TreeNode* root) {
        return dfs(root, 0);
    }
private:
    int dfs(TreeNode* node, int current) {
        if (!node) return 0;
        current = current * 10 + node->val;
        if (!node->left && !node->right) return current;
        return dfs(node->left, current) + dfs(node->right, current);
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Pure recursion, no allocations. Pass current by value so each recursive call sees the correct partial number — no explicit backtracking step.',
      },
      c: {
        code: \`static int dfs(struct TreeNode* node, int current) {
    if (!node) return 0;
    current = current * 10 + node->val;
    if (!node->left && !node->right) return current;
    return dfs(node->left, current) + dfs(node->right, current);
}

int sumNumbers(struct TreeNode* root) {
    return dfs(root, 0);
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Plain C. Static helper keeps the symbol local to the translation unit. Same digit-shifting recurrence.',
      },
      go: {
        code: \`func sumNumbers(root *TreeNode) int {
    var dfs func(node *TreeNode, current int) int
    dfs = func(node *TreeNode, current int) int {
        if node == nil {
            return 0
        }
        current = current*10 + node.Val
        if node.Left == nil && node.Right == nil {
            return current
        }
        return dfs(node.Left, current) + dfs(node.Right, current)
    }
    return dfs(root, 0)
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Closure for the recursive helper. int in Go is 64-bit on most platforms, comfortably covering any LeetCode-shaped path number.',
      },
    },
  },
`;

// ─── Splice ────────────────────────────────────────────────────────────

let out = src;

// Replace path-sum
const r1 = findEntryRange(out, 'path-sum');
if (!r1) {
  console.error('Could not locate existing path-sum entry.');
  process.exit(1);
}
out = out.slice(0, r1.lineStart) + ENTRY_PATH_SUM + out.slice(r1.endIdx);

// Replace path-sum-ii (indices shift, so re-search)
const r2 = findEntryRange(out, 'path-sum-ii');
if (!r2) {
  console.error('Could not locate existing path-sum-ii entry.');
  process.exit(1);
}
out = out.slice(0, r2.lineStart) + ENTRY_PATH_SUM_II + out.slice(r2.endIdx);

// Insert sum-root-to-leaf-numbers immediately after path-sum-ii
const r2b = findEntryRange(out, 'path-sum-ii');
if (!r2b) {
  console.error('Could not relocate path-sum-ii post-write.');
  process.exit(1);
}
out = out.slice(0, r2b.endIdx) + ENTRY_SUM_ROOT_TO_LEAF + out.slice(r2b.endIdx);

fs.writeFileSync(FILE, out, 'utf8');

console.log('Spliced tree-path-trio into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
console.log('  delta:  +' + (out.length - src.length) + ' bytes');
