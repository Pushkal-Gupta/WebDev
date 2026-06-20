#!/usr/bin/env node
// Atomic splice (wave7b): binary-tree-pruning, delete-node-in-a-bst.
// Inserts two new entries near end of problemContent.js with 12-frame tree
// viz + 6-language solutions. Re-runnable: marker exit-clean.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

const MARKER = '/* SPLICE:tree-prune-bst-duo v1 */';
if (src.includes(MARKER)) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

if (src.includes("'binary-tree-pruning':") || src.includes("'delete-node-in-a-bst':")) {
  console.error('One of the target slugs already exists (non-marker collision).');
  process.exit(1);
}

const ENTRY_PRUNE = `  'binary-tree-pruning': {
    ${MARKER}
    tags: ['tree', 'depth-first-search', 'binary-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: (() => {
      // Tree [1,0,1,0,0,0,1] — post-order prune subtrees containing no 1s.
      //         1
      //        / \\
      //       0   1
      //      / \\ / \\
      //     0  0 0  1
      const mk = (value, left = null, right = null) => ({ value, left, right });
      const L00 = mk(0), L01 = mk(0), L02 = mk(0), L03 = mk(1);
      const n0L = mk(0, L00, L01);
      const n1R = mk(1, L02, L03);
      const root = mk(1, n0L, n1R);

      let idCounter = 0;
      const tag = (n) => { if (!n) return; n._id = ++idCounter; tag(n.left); tag(n.right); };
      tag(root);
      const stateById = new Map();
      const removed = new Set();
      const cloneWithStates = (node) => {
        if (!node || removed.has(node._id)) return null;
        return {
          _id: node._id,
          value: node.value,
          state: stateById.get(node._id) || 'default',
          left: cloneWithStates(node.left),
          right: cloneWithStates(node.right),
        };
      };

      const frames = [];
      const snap = (caption, chip, traversal) => {
        frames.push({ tree: cloneWithStates(root), chip, caption, traversal: traversal || [] });
      };

      snap(
        'Goal: remove every subtree that contains no 1s. Equivalently, keep a node iff it equals 1 OR has a kept descendant equal to 1. Post-order is the natural fit — we need children pruned before we decide a parent.',
        'prune subtrees of all-zeros',
        ['result = pruned tree'],
      );
      snap(
        'Recurrence: prune(node) returns the (possibly null) pruned subtree. First recurse left and right (assigning the returned values back). Then if node.val == 0 and both children are now null, return null — drop this node too.',
        'post-order rewrite',
        ['node.l = prune(l); node.r = prune(r)'],
      );

      // Step through post-order
      stateById.set(L00._id, 'current');
      snap('Post-order visit leaf 0 (left-left). No children. val == 0 — drop. Returns null to parent.', 'leaf 0 -> null', ['prune(L00) = null']);
      removed.add(L00._id);

      stateById.set(L01._id, 'current');
      snap('Visit leaf 0 (left-right). val == 0, no children — drop. Returns null.', 'leaf 0 -> null', ['prune(L01) = null']);
      removed.add(L01._id);

      stateById.set(n0L._id, 'current');
      snap('Back at internal 0 (left child of root). Both children just returned null; node.val == 0 too. Drop the entire left subtree — return null.', 'internal 0 -> null', ['prune(n0L) = null']);
      removed.add(n0L._id);

      stateById.set(L02._id, 'current');
      snap('Descend right. Visit leaf 0 (right-left). val == 0, no kids — drop.', 'leaf 0 -> null', ['prune(L02) = null']);
      removed.add(L02._id);

      stateById.set(L03._id, 'match');
      snap('Visit leaf 1 (right-right). val == 1 — keep. Returns itself unchanged.', 'leaf 1 -> KEEP', ['prune(L03) = L03']);

      stateById.set(n1R._id, 'current');
      snap('Back at internal 1 (right child of root). Left child became null; right child kept. node.val == 1 itself — keep this node. Returns the trimmed subtree.', 'internal 1 -> KEEP', ['prune(n1R) = n1R (one kid)']);

      stateById.set(root._id, 'current');
      snap('Back at root 1. Left subtree gone (null); right subtree kept; root.val == 1 — keep root. Final answer: root with only the 1 -> 1 spine.', 'root kept', ['final shape: 1 - (1 - 1)']);

      stateById.set(root._id, 'match');
      stateById.set(n1R._id, 'match');
      snap('Why post-order is mandatory: deciding to drop an internal 0 needs to know whether its descendants are entirely zero — that fact is only available AFTER recursion returns. Pre-order would over- or under-prune.',
        'post-order required',
        ['decide parent after children']);

      snap('One-liner refactor: assign returned subtree back into the slot (root.left = prune(root.left)) — this is the idiomatic "rewrite tree by recursion" pattern.',
        'rewrite-by-recursion',
        ['root.l = prune(l)']);

      snap('Complexity: every node visited exactly once -> O(n) time. Recursion stack O(h). No extra allocation — we mutate in place by returning a possibly-null subtree.',
        'O(n) time, O(h) space',
        ['answer: trimmed tree']);

      snap('Done. The pruned tree is the right-spine 1 -> 1 -> 1. Generalises to "prune by predicate on subtree" — replace val == 1 with any boolean fold over the subtree.',
        'answer = trimmed tree',
        ['final: 3 nodes kept']);

      return { renderer: 'tree', title: 'Binary Tree Pruning — post-order, drop subtrees of all zeros', frames };
    })(),
    solutions: {
      python: {
        code: \`class Solution:
    def pruneTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left = self.pruneTree(root.left)
        root.right = self.pruneTree(root.right)
        if root.val == 0 and not root.left and not root.right:
            return None
        return root\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Post-order rewrite. Recurse into both children FIRST, reassigning the returned (possibly null) subtree back into the slot. Only after both children have been pruned do we decide the fate of the current node: if its value is 0 and both children are now null, the entire subtree below it contained no 1s — drop the node by returning None. Otherwise keep it. The post-order ordering is essential — a pre-order traversal could not know whether descendants contain any 1s yet.',
      },
      javascript: {
        code: \`function pruneTree(root) {
  if (!root) return null;
  root.left = pruneTree(root.left);
  root.right = pruneTree(root.right);
  if (root.val === 0 && !root.left && !root.right) return null;
  return root;
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Identical recurrence. Reassignment of root.left and root.right is what makes the prune actually take effect — without it, the parent would still point at the unchanged child.',
      },
      java: {
        code: \`class Solution {
    public TreeNode pruneTree(TreeNode root) {
        if (root == null) return null;
        root.left = pruneTree(root.left);
        root.right = pruneTree(root.right);
        if (root.val == 0 && root.left == null && root.right == null) return null;
        return root;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Same structure. The returned reference is reassigned back into the parent slot — the only way to mutate a tree by recursion in a language without pointer aliasing on the parent.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    TreeNode* pruneTree(TreeNode* root) {
        if (!root) return nullptr;
        root->left = pruneTree(root->left);
        root->right = pruneTree(root->right);
        if (root->val == 0 && !root->left && !root->right) return nullptr;
        return root;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Pure pointer reassignment. If you own the allocator, you could delete the pruned node before returning nullptr — the canonical LeetCode answer leaves cleanup to the runtime.',
      },
      c: {
        code: \`struct TreeNode* pruneTree(struct TreeNode* root) {
    if (!root) return NULL;
    root->left = pruneTree(root->left);
    root->right = pruneTree(root->right);
    if (root->val == 0 && !root->left && !root->right) return NULL;
    return root;
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Plain C — leaking the freed nodes is the standard LeetCode shortcut. In production, free(root) before returning NULL.',
      },
      go: {
        code: \`func pruneTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    root.Left = pruneTree(root.Left)
    root.Right = pruneTree(root.Right)
    if root.Val == 0 && root.Left == nil && root.Right == nil {
        return nil
    }
    return root
}\`,
        complexity: { time: 'O(n)', space: 'O(h)' },
        approach: 'Idiomatic Go pointer recursion. GC reclaims pruned subtrees once no references remain.',
      },
    },
  },
`;

const ENTRY_BST_DELETE = `  'delete-node-in-a-bst': {
    ${MARKER}
    tags: ['tree', 'binary-search-tree', 'binary-tree'],
    companies: ['amazon', 'meta', 'microsoft', 'google', 'apple'],
    viz: (() => {
      // BST [5,3,6,2,4,null,7], delete key = 3.
      // After delete: replace 3 with its in-order successor (4).
      //         5                  5
      //        / \\                / \\
      //       3   6      ->      4   6
      //      / \\   \\            /     \\
      //     2   4   7          2       7
      const mk = (value, left = null, right = null) => ({ value, left, right });
      const n2 = mk(2), n4 = mk(4), n7 = mk(7);
      const n3 = mk(3, n2, n4);
      const n6 = mk(6, null, n7);
      const root = mk(5, n3, n6);

      let idCounter = 0;
      const tag = (n) => { if (!n) return; n._id = ++idCounter; tag(n.left); tag(n.right); };
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
      const snap = (caption, chip, traversal) => {
        frames.push({ tree: cloneWithStates(root), chip, caption, traversal: traversal || [] });
      };

      const key = 3;

      snap(
        'Goal: delete the node with key = ' + key + ' while keeping the BST invariant intact. Three cases by child count: leaf -> drop, single-child -> splice, two-children -> replace value with in-order successor and delete the successor recursively.',
        'BST delete, key = ' + key,
        ['three structural cases'],
      );
      snap(
        'BST search step: compare key to current.val. key < val -> recurse left; key > val -> recurse right; equal -> apply one of the three deletion cases.',
        'binary-search descent',
        ['walk to the target'],
      );

      stateById.set(root._id, 'current');
      snap('At root 5. key 3 < 5 -> descend left.', 'key < 5, go left', ['root.left = delete(root.left, 3)']);

      stateById.set(n3._id, 'current');
      snap('At node 3. key 3 == 3 — found the target. Two children present (2 and 4) -> use the in-order-successor strategy.',
        'found target, two kids',
        ['case: two children']);

      stateById.set(n4._id, 'match');
      snap('In-order successor = leftmost node of the right subtree. Right child is 4 itself (no left descendants), so successor = 4. Copy 4 into the target slot.',
        'successor = 4',
        ['node.val := 4']);

      // Visually overwrite n3's value to 4 (we cheat for the viz: keep id n3 but rename)
      const oldVal = n3.value;
      n3.value = 4;
      snap('Overwrite node 3 with value 4. The BST property still holds locally because 4 was the smallest value in the right subtree (so it is > everything in the left subtree and <= everything else in the right).',
        'overwrite val',
        ['now we must delete original 4']);

      // Now we recursively delete the duplicate 4 from the right subtree.
      stateById.set(n4._id, 'current');
      snap('Now recursively delete value 4 from the right subtree (otherwise it would appear twice). Recurse into n3.right = delete(n3.right, 4).',
        'recursive delete of successor',
        ['key = 4 in right subtree']);

      snap('Hit node 4 directly. It is a leaf (no children) -> just return null. The right pointer of the rewritten node becomes null.',
        'leaf delete -> null',
        ['n3.right = null']);

      // Remove n4 from view by re-cloning with right of n3 stripped
      n3.right = null;
      snap('Tree state after delete: root 5; left subtree is now (4 with only child 2); right subtree unchanged (6 -> 7). BST property verified at every node.',
        'BST intact',
        ['final shape']);

      stateById.set(n3._id, 'match');
      snap('Why successor instead of predecessor? Either works — the in-order successor (min of right subtree) and predecessor (max of left subtree) are both valid replacements that preserve order. Pick one convention and stick with it.',
        'successor or predecessor',
        ['both are valid']);

      snap('Cases: (a) leaf -> return null. (b) one child -> return that child. (c) two children -> copy successor value, recursively delete successor. The recursion bottoms out at case (a) or (b).',
        'three cases, recursion ends in 1 or 2',
        []);

      snap('Complexity: O(h) for the search + O(h) for the successor walk -> O(h) time. Space O(h) recursion. Balanced BST: O(log n). Skewed: O(n) worst case.',
        'O(h) time and space',
        ['balanced: O(log n)']);

      snap('Done. The 3 node is gone, the BST is balanced as before, and no values were lost. The successor-copy trick keeps the rewrite local to two pointers instead of rotating subtrees around.',
        'answer: BST without 3',
        ['final: 6 nodes']);

      // restore (not strictly needed; viz already captured frames)
      n3.value = oldVal;

      return { renderer: 'tree', title: 'Delete Node in a BST — search down, replace with in-order successor', frames };
    })(),
    solutions: {
      python: {
        code: \`class Solution:
    def deleteNode(self, root: Optional[TreeNode], key: int) -> Optional[TreeNode]:
        if not root:
            return None
        if key < root.val:
            root.left = self.deleteNode(root.left, key)
        elif key > root.val:
            root.right = self.deleteNode(root.right, key)
        else:
            if not root.left:
                return root.right
            if not root.right:
                return root.left
            succ = root.right
            while succ.left:
                succ = succ.left
            root.val = succ.val
            root.right = self.deleteNode(root.right, succ.val)
        return root\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Standard BST delete. Walk the tree using BST ordering to locate the key. On match, branch on child count: leaf returns None, single-child returns the lone child (splice), two-children replaces the slot value with the in-order successor (leftmost of the right subtree) and recursively deletes that successor from the right subtree. Returning the (possibly rewritten) subtree at each step is what makes the parent pointer update transparently — no explicit parent tracking needed. O(h) work; balanced -> O(log n), skewed -> O(n).',
      },
      javascript: {
        code: \`function deleteNode(root, key) {
  if (!root) return null;
  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val);
  }
  return root;
}\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Identical structure. The inner while-loop walks to the leftmost descendant of root.right — that is the smallest value strictly greater than the deleted one, the in-order successor.',
      },
      java: {
        code: \`class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.val) {
            root.left = deleteNode(root.left, key);
        } else if (key > root.val) {
            root.right = deleteNode(root.right, key);
        } else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            TreeNode succ = root.right;
            while (succ.left != null) succ = succ.left;
            root.val = succ.val;
            root.right = deleteNode(root.right, succ.val);
        }
        return root;
    }
}\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Same recurrence. Iterative successor descent keeps the implementation linear in depth.',
      },
      cpp: {
        code: \`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    TreeNode* deleteNode(TreeNode* root, int key) {
        if (!root) return nullptr;
        if (key < root->val) {
            root->left = deleteNode(root->left, key);
        } else if (key > root->val) {
            root->right = deleteNode(root->right, key);
        } else {
            if (!root->left) return root->right;
            if (!root->right) return root->left;
            TreeNode* succ = root->right;
            while (succ->left) succ = succ->left;
            root->val = succ->val;
            root->right = deleteNode(root->right, succ->val);
        }
        return root;
    }
};\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Pointer recursion. Production code would delete the physically-removed node before returning its child to avoid the leak — LeetCode harness ignores it.',
      },
      c: {
        code: \`struct TreeNode* deleteNode(struct TreeNode* root, int key) {
    if (!root) return NULL;
    if (key < root->val) {
        root->left = deleteNode(root->left, key);
    } else if (key > root->val) {
        root->right = deleteNode(root->right, key);
    } else {
        if (!root->left) return root->right;
        if (!root->right) return root->left;
        struct TreeNode* succ = root->right;
        while (succ->left) succ = succ->left;
        root->val = succ->val;
        root->right = deleteNode(root->right, succ->val);
    }
    return root;
}\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Plain C version. Same recurrence; same leak caveat in production.',
      },
      go: {
        code: \`func deleteNode(root *TreeNode, key int) *TreeNode {
    if root == nil {
        return nil
    }
    if key < root.Val {
        root.Left = deleteNode(root.Left, key)
    } else if key > root.Val {
        root.Right = deleteNode(root.Right, key)
    } else {
        if root.Left == nil {
            return root.Right
        }
        if root.Right == nil {
            return root.Left
        }
        succ := root.Right
        for succ.Left != nil {
            succ = succ.Left
        }
        root.Val = succ.Val
        root.Right = deleteNode(root.Right, succ.Val)
    }
    return root
}\`,
        complexity: { time: 'O(h)', space: 'O(h)' },
        approach: 'Idiomatic Go. GC reclaims the displaced successor node automatically.',
      },
    },
  },
`;

// Splice: insert both entries immediately before the closing `};` of the
// PROBLEM_CONTENT object. We locate the final `};` that closes the top-level
// export by scanning from the end.

let out = src;
const lastBrace = out.lastIndexOf('\n};');
if (lastBrace < 0) {
  console.error('Could not locate closing `};` of PROBLEM_CONTENT.');
  process.exit(1);
}
const insertAt = lastBrace + 1; // before the `};`
out = out.slice(0, insertAt) + ENTRY_PRUNE + ENTRY_BST_DELETE + out.slice(insertAt);

fs.writeFileSync(FILE, out, 'utf8');

console.log('Spliced tree-prune-bst-duo into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
console.log('  delta:  +' + (out.length - src.length) + ' bytes');
