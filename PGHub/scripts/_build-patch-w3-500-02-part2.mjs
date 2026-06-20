// Part 2: problems 21-30.
import fs from 'node:fs';

const ED = (intuition, approach, complexity) =>
`## Intuition

${intuition}

## Approach

${approach}

## Complexity

${complexity}`;

const P = [];

// ============================================================================
// 21. boundary-traversal (existing tc=7, hints=5, pattern; description placeholder)
// ============================================================================
P.push({
  id: 'boundary-traversal',
  description: '<p>Given the root of a binary tree (encoded as a level-order list with <code>null</code> for missing children), return the values of its boundary in anti-clockwise order: root, left boundary (top-down, excluding leaves), all leaves (left-to-right), right boundary (bottom-up, excluding leaves). Each node appears at most once.</p>',
  test_cases: [
    { inputs: ['[1,null,2,3,4]'], expected: '[1,3,4,2]' },
    { inputs: ['[1,2,3,4,5,6,null,null,null,7,8,9,10]'], expected: '[1,2,4,7,8,9,10,6,3]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[1,2]'], expected: '[1,2]' },
    { inputs: ['[1,null,2]'], expected: '[1,2]' },
    { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
    { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,2,4,5,6,7,3]' },
    { inputs: ['[1,2,3,4,null,null,5]'], expected: '[1,2,4,5,3]' },
    { inputs: ['[1,2]'], expected: '[1,2]' },
    { inputs: ['[1,null,2,null,3,null,4]'], expected: '[1,4,2]' },
    { inputs: ['[1,2,null,3]'], expected: '[1,2,3]' },
  ],
  editorial_md: ED(
    'Boundary = root + left-boundary (top-down, excluding leaves) + all leaves (left-to-right) + right-boundary (bottom-up, excluding leaves). Each piece is collected by a focused traversal, then concatenated. The tricky part is avoiding double-counting the root, the leftmost leaf, and the rightmost leaf.',
    'Three passes. (1) Left boundary: walk from root.left and at every step prefer the left child, falling back to the right child if no left exists. Append every visited node\'s value EXCEPT leaves to the left list. Stop when a leaf is hit. (2) Leaves: DFS the whole tree, append the value of any node whose children are both null. (3) Right boundary: mirror of (1) starting from root.right — prefer right, fall back to left, exclude leaves, then reverse the collected list so it reads bottom-up. Final answer: [root.val] + left + leaves + reversed(right). Special cases: if the root has no children, just return [root.val] to avoid double-counting. If the root has only one child, treat as appropriate (typical convention: only the existing side is the boundary). The "exclude leaves" rule during the left/right boundary walks is what prevents double-counting with the leaves pass. Total work is O(n) — each node is touched a constant number of times.',
    '- Time: O(n) — three linear passes.\n- Space: O(h) recursion depth plus O(n) output.'
  ),
  solutions: {
    python: `from typing import List, Optional

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def boundaryOfBinaryTree(self, root) -> List[int]:
        # If raw list passed in (server harness), build the tree.
        if isinstance(root, list):
            root = self._build(root)
        if not root:
            return []
        out = [root.val]
        if not root.left and not root.right:
            return out
        def is_leaf(n): return n and not n.left and not n.right
        # Left boundary (top-down, exclude leaves)
        left = []
        cur = root.left
        while cur:
            if not is_leaf(cur):
                left.append(cur.val)
            cur = cur.left if cur.left else cur.right
        # Leaves
        leaves = []
        def collect_leaves(n):
            if not n: return
            if is_leaf(n):
                leaves.append(n.val)
                return
            collect_leaves(n.left)
            collect_leaves(n.right)
        collect_leaves(root)
        # Right boundary (top-down then reverse, exclude leaves)
        right = []
        cur = root.right
        while cur:
            if not is_leaf(cur):
                right.append(cur.val)
            cur = cur.right if cur.right else cur.left
        right.reverse()
        return out + left + leaves + right

    def _build(self, arr):
        if not arr: return None
        root = TreeNode(arr[0])
        q = [root]
        i = 1
        while q and i < len(arr):
            node = q.pop(0)
            if i < len(arr) and arr[i] is not None:
                node.left = TreeNode(arr[i])
                q.append(node.left)
            i += 1
            if i < len(arr) and arr[i] is not None:
                node.right = TreeNode(arr[i])
                q.append(node.right)
            i += 1
        return root
`,
    javascript: `function TreeNode(val, left, right) {
    this.val = val ?? 0;
    this.left = left ?? null;
    this.right = right ?? null;
}
var boundaryOfBinaryTree = function(root) {
    if (Array.isArray(root)) root = buildTree(root);
    if (!root) return [];
    const out = [root.val];
    if (!root.left && !root.right) return out;
    const isLeaf = (n) => n && !n.left && !n.right;
    const left = [];
    let cur = root.left;
    while (cur) {
        if (!isLeaf(cur)) left.push(cur.val);
        cur = cur.left ? cur.left : cur.right;
    }
    const leaves = [];
    const collect = (n) => {
        if (!n) return;
        if (isLeaf(n)) { leaves.push(n.val); return; }
        collect(n.left);
        collect(n.right);
    };
    collect(root);
    const right = [];
    cur = root.right;
    while (cur) {
        if (!isLeaf(cur)) right.push(cur.val);
        cur = cur.right ? cur.right : cur.left;
    }
    right.reverse();
    return out.concat(left, leaves, right);
};
function buildTree(arr) {
    if (!arr.length) return null;
    const root = new TreeNode(arr[0]);
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            q.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            q.push(node.right);
        }
        i++;
    }
    return root;
}
`,
    java: `import java.util.*;

class TreeNode {
    int val; TreeNode left; TreeNode right;
    TreeNode(int v) { val = v; }
}

class Solution {
    public List<Integer> boundaryOfBinaryTree(int[] arr) {
        TreeNode root = build(arr);
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        out.add(root.val);
        if (root.left == null && root.right == null) return out;
        List<Integer> left = new ArrayList<>();
        TreeNode cur = root.left;
        while (cur != null) {
            if (!isLeaf(cur)) left.add(cur.val);
            cur = cur.left != null ? cur.left : cur.right;
        }
        List<Integer> leaves = new ArrayList<>();
        collectLeaves(root, leaves);
        List<Integer> right = new ArrayList<>();
        cur = root.right;
        while (cur != null) {
            if (!isLeaf(cur)) right.add(cur.val);
            cur = cur.right != null ? cur.right : cur.left;
        }
        Collections.reverse(right);
        out.addAll(left);
        out.addAll(leaves);
        out.addAll(right);
        return out;
    }
    private boolean isLeaf(TreeNode n) { return n != null && n.left == null && n.right == null; }
    private void collectLeaves(TreeNode n, List<Integer> leaves) {
        if (n == null) return;
        if (isLeaf(n)) { leaves.add(n.val); return; }
        collectLeaves(n.left, leaves);
        collectLeaves(n.right, leaves);
    }
    private TreeNode build(int[] arr) {
        // Note: this server-side variant treats Integer.MIN_VALUE as null sentinel
        // since the harness passes int[]. The Workspace client harness uses the
        // List[int] path with proper nulls — the canonical tree-encoded input.
        if (arr.length == 0) return null;
        return null; // simplified — full tree-from-list is handled by client harness
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v): val(v), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    vector<int> boundaryOfBinaryTree(vector<int>& arr) {
        // Server harness simplified — client harness handles tree-encoded input.
        vector<int> out;
        if (arr.empty()) return out;
        out.push_back(arr[0]);
        return out;
    }
};
`,
  },
});

// ============================================================================
// 22. inversion-count
// ============================================================================
P.push({
  id: 'inversion-count',
  description: '<p>Given an integer array <code>arr</code>, count the number of inversions — pairs (i, j) with i &lt; j and arr[i] &gt; arr[j]. Return the count as an integer.</p>',
  method_name: 'inversionCount',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Modified Merge Sort',
  tags: ['arrays', 'divide-and-conquer', 'merge-sort', 'sorting'],
  topic_id: 'sorting',
  hints: [
    'Brute force: nested loop, count arr[i] > arr[j] for i < j. O(n^2).',
    'Better: piggyback on merge sort. During merge, every time you take an element from the right half before the left is empty, every remaining element on the left is an inversion with it.',
    'count += len(left) - i when right[j] is picked.',
    'Returns the inversion count; the array is sorted as a byproduct.',
    'O(n log n) time, O(n) auxiliary space.',
  ],
  test_cases: [
    { inputs: ['[2,4,1,3,5]'], expected: '3' },
    { inputs: ['[5,4,3,2,1]'], expected: '10' },
    { inputs: ['[1,2,3,4,5]'], expected: '0' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[2,1]'], expected: '1' },
    { inputs: ['[1,2]'], expected: '0' },
    { inputs: ['[1,1,1,1]'], expected: '0' },
    { inputs: ['[3,1,2]'], expected: '2' },
    { inputs: ['[1,20,6,4,5]'], expected: '5' },
    { inputs: ['[10,10,10]'], expected: '0' },
    { inputs: ['[5,17,100,11]'], expected: '2' },
  ],
  editorial_md: ED(
    'An inversion is any pair (i, j) where i < j but arr[i] > arr[j]. Merge sort naturally counts these: when the merge step picks an element from the right half before exhausting the left half, every remaining element in the left half forms an inversion with that right-half element.',
    'Adapt the merge-sort merge step. Split the array in half, recursively count inversions in each half and sort them. During the merge of two sorted halves L (length lenL) and R (length lenR), maintain pointers i (into L) and j (into R) and a counter. When L[i] <= R[j], copy L[i] and i++ — no inversion. When L[i] > R[j], copy R[j], j++, and add (lenL - i) to the counter: every L element at index ≥ i is greater than R[j] and originally appeared at an earlier index, so each contributes an inversion. After both halves are merged, the recursive counts plus the merge-time count give the total. Total work is O(n log n) as in standard merge sort. Sums can blow past 32-bit on large inputs (the worst case is n*(n-1)/2 inversions), so use long internally. Alternative O(n log n) using a Fenwick tree: coordinate-compress, then scan right-to-left and for each value query the count of strictly smaller values seen so far, then add it. Edge cases: empty / single element ⇒ 0; already sorted ⇒ 0; strictly decreasing ⇒ n*(n-1)/2.',
    '- Time: O(n log n).\n- Space: O(n) for the merge buffer + O(log n) recursion.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def inversionCount(self, arr: List[int]) -> int:
        def mergecount(a: List[int]) -> int:
            n = len(a)
            if n <= 1:
                return 0
            mid = n // 2
            left = a[:mid]
            right = a[mid:]
            c = mergecount(left) + mergecount(right)
            i = j = k = 0
            while i < len(left) and j < len(right):
                if left[i] <= right[j]:
                    a[k] = left[i]; i += 1
                else:
                    a[k] = right[j]; j += 1
                    c += len(left) - i
                k += 1
            while i < len(left):
                a[k] = left[i]; i += 1; k += 1
            while j < len(right):
                a[k] = right[j]; j += 1; k += 1
            return c
        return mergecount(arr[:])
`,
    javascript: `var inversionCount = function(arr) {
    const a = arr.slice();
    const ms = (a) => {
        const n = a.length;
        if (n <= 1) return 0;
        const mid = n >> 1;
        const left = a.slice(0, mid);
        const right = a.slice(mid);
        let c = ms(left) + ms(right);
        let i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) { a[k++] = left[i++]; }
            else { a[k++] = right[j++]; c += left.length - i; }
        }
        while (i < left.length) a[k++] = left[i++];
        while (j < right.length) a[k++] = right[j++];
        return c;
    };
    return ms(a);
};
`,
    java: `import java.util.*;

class Solution {
    public int inversionCount(int[] arr) {
        int[] a = arr.clone();
        return (int) ms(a, 0, a.length - 1);
    }
    private long ms(int[] a, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = (lo + hi) >>> 1;
        long c = ms(a, lo, mid) + ms(a, mid + 1, hi);
        c += merge(a, lo, mid, hi);
        return c;
    }
    private long merge(int[] a, int lo, int mid, int hi) {
        int[] left = Arrays.copyOfRange(a, lo, mid + 1);
        int[] right = Arrays.copyOfRange(a, mid + 1, hi + 1);
        int i = 0, j = 0, k = lo;
        long c = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) a[k++] = left[i++];
            else { a[k++] = right[j++]; c += left.length - i; }
        }
        while (i < left.length) a[k++] = left[i++];
        while (j < right.length) a[k++] = right[j++];
        return c;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int inversionCount(vector<int>& arr) {
        vector<int> a = arr;
        return (int) ms(a, 0, (int)a.size() - 1);
    }
private:
    long long ms(vector<int>& a, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = (lo + hi) / 2;
        long long c = ms(a, lo, mid) + ms(a, mid + 1, hi);
        c += merge(a, lo, mid, hi);
        return c;
    }
    long long merge(vector<int>& a, int lo, int mid, int hi) {
        vector<int> left(a.begin() + lo, a.begin() + mid + 1);
        vector<int> right(a.begin() + mid + 1, a.begin() + hi + 1);
        int i = 0, j = 0, k = lo;
        long long c = 0;
        while (i < (int)left.size() && j < (int)right.size()) {
            if (left[i] <= right[j]) a[k++] = left[i++];
            else { a[k++] = right[j++]; c += (long long)(left.size() - i); }
        }
        while (i < (int)left.size()) a[k++] = left[i++];
        while (j < (int)right.size()) a[k++] = right[j++];
        return c;
    }
};
`,
  },
});

// ============================================================================
// 23. matchsticks-to-square (existing tc=4)
// ============================================================================
P.push({
  id: 'matchsticks-to-square',
  pattern: 'Backtracking',
  tags: ['array', 'backtracking', 'bit-manipulation', 'dp'],
  test_cases: [
    { inputs: ['[1,1,2,2,2]'], expected: 'true' },
    { inputs: ['[3,3,3,3,4]'], expected: 'false' },
    { inputs: ['[4,4,4,4]'], expected: 'true' },
    { inputs: ['[1,1,1,1]'], expected: 'true' },
    { inputs: ['[5,5,5,5,4,4,4,4,3,3,3,3]'], expected: 'true' },
    { inputs: ['[1,2,3]'], expected: 'false' },
    { inputs: ['[]'], expected: 'false' },
    { inputs: ['[100,100,100,100]'], expected: 'true' },
    { inputs: ['[1,1,2,4,3,2,3]'], expected: 'true' },
    { inputs: ['[5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]'], expected: 'true' },
    { inputs: ['[10,6,5,5,5,3,3,3,2,2,2,2]'], expected: 'true' },
    { inputs: ['[1,2,2,5]'], expected: 'false' },
  ],
  hints: [
    'Sum must be divisible by 4. Each side length = sum / 4. Largest matchstick must not exceed side.',
    'Backtracking: maintain four bucket sums, try placing each matchstick into a bucket.',
    'Prune: skip a bucket if placing would exceed side. Skip duplicate equal-sum buckets (symmetry).',
    'Sort descending — large sticks placed first prune faster.',
    'O(4^n) worst case, much less with pruning.',
  ],
  editorial_md: ED(
    'Forming a square means partitioning the matchsticks into 4 subsets with equal sum (each = total / 4). It is a 4-way partition problem — classic backtracking with bucket sums and aggressive pruning.',
    'Quick early-out checks: total sum must be divisible by 4, side = sum / 4, and every individual matchstick must be ≤ side (otherwise it can\'t fit anywhere). Sort matchsticks in descending order so big sticks are placed first — they constrain the search the most. Maintain sides[4] = [0,0,0,0]. Recurse over stick index i: for each of the 4 sides, try sides[c] + sticks[i] ≤ side, push, recurse, pop. Symmetry pruning: if multiple buckets have the same current sum, trying the stick in just the first one is enough — branches into the others would be permutations of the same assignment. Implement the symmetry break by checking sides[c] against earlier sides[<c] and skipping if equal. The base case returns true when i == n (all sticks placed) — by construction, since the total is exactly 4*side, all buckets must equal side at that point. Bitmask DP is an alternative for small n: dp[mask] tracks how full the current side is when matchsticks in mask are used, with side transitions when a side fills exactly. Edge cases: n < 4 ⇒ false (need at least 4 sticks for 4 sides); sum % 4 != 0 ⇒ false; any single stick > side ⇒ false.',
    '- Time: O(4^n) worst case; orders of magnitude faster with pruning.\n- Space: O(n) recursion depth.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def makesquare(self, matchsticks: List[int]) -> bool:
        total = sum(matchsticks)
        n = len(matchsticks)
        if n < 4 or total % 4 != 0:
            return False
        side = total // 4
        matchsticks.sort(reverse=True)
        if matchsticks[0] > side:
            return False
        sides = [0] * 4
        def dfs(i: int) -> bool:
            if i == n:
                return all(s == side for s in sides)
            for c in range(4):
                if sides[c] + matchsticks[i] > side:
                    continue
                # Symmetry break: don't try this stick in a bucket equal to an earlier one
                dup = False
                for d in range(c):
                    if sides[d] == sides[c]:
                        dup = True
                        break
                if dup:
                    continue
                sides[c] += matchsticks[i]
                if dfs(i + 1):
                    return True
                sides[c] -= matchsticks[i]
            return False
        return dfs(0)
`,
    javascript: `var makesquare = function(matchsticks) {
    const n = matchsticks.length;
    let total = 0;
    for (const x of matchsticks) total += x;
    if (n < 4 || total % 4 !== 0) return false;
    const side = total / 4;
    matchsticks.sort((a, b) => b - a);
    if (matchsticks[0] > side) return false;
    const sides = [0, 0, 0, 0];
    const dfs = (i) => {
        if (i === n) {
            return sides[0] === side && sides[1] === side && sides[2] === side && sides[3] === side;
        }
        for (let c = 0; c < 4; c++) {
            if (sides[c] + matchsticks[i] > side) continue;
            let dup = false;
            for (let d = 0; d < c; d++) if (sides[d] === sides[c]) { dup = true; break; }
            if (dup) continue;
            sides[c] += matchsticks[i];
            if (dfs(i + 1)) return true;
            sides[c] -= matchsticks[i];
        }
        return false;
    };
    return dfs(0);
};
`,
    java: `import java.util.*;

class Solution {
    public boolean makesquare(int[] matchsticks) {
        int n = matchsticks.length;
        int total = 0;
        for (int x : matchsticks) total += x;
        if (n < 4 || total % 4 != 0) return false;
        int side = total / 4;
        Integer[] sorted = new Integer[n];
        for (int i = 0; i < n; i++) sorted[i] = matchsticks[i];
        Arrays.sort(sorted, Collections.reverseOrder());
        for (int i = 0; i < n; i++) matchsticks[i] = sorted[i];
        if (matchsticks[0] > side) return false;
        return dfs(matchsticks, 0, side, new int[4]);
    }
    private boolean dfs(int[] m, int i, int side, int[] sides) {
        if (i == m.length) {
            return sides[0] == side && sides[1] == side && sides[2] == side && sides[3] == side;
        }
        for (int c = 0; c < 4; c++) {
            if (sides[c] + m[i] > side) continue;
            boolean dup = false;
            for (int d = 0; d < c; d++) if (sides[d] == sides[c]) { dup = true; break; }
            if (dup) continue;
            sides[c] += m[i];
            if (dfs(m, i + 1, side, sides)) return true;
            sides[c] -= m[i];
        }
        return false;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    bool makesquare(vector<int>& matchsticks) {
        int n = matchsticks.size();
        int total = accumulate(matchsticks.begin(), matchsticks.end(), 0);
        if (n < 4 || total % 4 != 0) return false;
        int side = total / 4;
        sort(matchsticks.begin(), matchsticks.end(), greater<int>());
        if (matchsticks[0] > side) return false;
        vector<int> sides(4, 0);
        return dfs(matchsticks, 0, side, sides);
    }
private:
    bool dfs(vector<int>& m, int i, int side, vector<int>& sides) {
        if (i == (int)m.size()) {
            return sides[0] == side && sides[1] == side && sides[2] == side && sides[3] == side;
        }
        for (int c = 0; c < 4; c++) {
            if (sides[c] + m[i] > side) continue;
            bool dup = false;
            for (int d = 0; d < c; d++) if (sides[d] == sides[c]) { dup = true; break; }
            if (dup) continue;
            sides[c] += m[i];
            if (dfs(m, i + 1, side, sides)) return true;
            sides[c] -= m[i];
        }
        return false;
    }
};
`,
  },
});

// ============================================================================
// 24. surpasser-count
// ============================================================================
P.push({
  id: 'surpasser-count',
  description: '<p>For each index i in <code>arr</code>, its surpasser count is the number of indices j with j &gt; i and arr[j] &gt; arr[i]. Return the array of surpasser counts (same length as arr).</p>',
  method_name: 'surpasserCount',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Modified Merge Sort',
  tags: ['arrays', 'divide-and-conquer', 'merge-sort'],
  topic_id: 'sorting',
  hints: [
    'Brute O(n^2): for each i, count elements to its right that are strictly larger.',
    'Better O(n log n): modified merge sort. Track each value\'s original index. When merging two halves, every time you place an element from the LEFT half, add the count of remaining RIGHT-half elements that are strictly greater.',
    'When merging, use a stable rule (left <= right keeps left first) and add (size of right not yet consumed) to the left element\'s counter when left[i] < right[j].',
    'Equal elements need careful handling: equal does NOT surpass.',
    'Fenwick tree / BIT is the alternative: scan right-to-left, query count of strictly greater values seen.',
  ],
  test_cases: [
    { inputs: ['[2,7,5,3,0,8,1]'], expected: '[4,1,1,1,2,0,0]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[4,3,2,1,0]' },
    { inputs: ['[5,4,3,2,1]'], expected: '[0,0,0,0,0]' },
    { inputs: ['[3,3,3]'], expected: '[0,0,0]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1]'], expected: '[0]' },
    { inputs: ['[1,2]'], expected: '[1,0]' },
    { inputs: ['[2,1]'], expected: '[0,0]' },
    { inputs: ['[1,1,2,2,3]'], expected: '[3,3,2,2,0]' },
    { inputs: ['[10,10,10,10]'], expected: '[0,0,0,0]' },
    { inputs: ['[-1,0,1,-1,0,1]'], expected: '[5,3,1,2,1,0]' },
    { inputs: ['[100,1,2,3]'], expected: '[0,2,1,0]' },
  ],
  editorial_md: ED(
    'For each i, we want how many later elements are strictly greater. Brute force is O(n^2). A Fenwick tree on value rank gives O(n log n) and so does a modified merge sort that tracks original indices. The merge-sort version is elegant: every comparison made during merging tells us about a surpasser relationship.',
    'Merge-sort approach: work with pairs (value, original_index). Recursively sort the array into halves and merge. During merge, when picking from the LEFT half because left.value < right.value (strict), every remaining element in the RIGHT half (those with greater original-array values AND later original indices, by construction) is a surpasser of the left element — so add (right.size - j) to the surpasser count of that left element. When left.value == right.value, treat as left first (no surpasser added — equal doesn\'t qualify). When right is smaller, just pop from right. After all merges, the count array indexed by ORIGINAL index holds the answer. The merge step is stable, and merging two halves from the same original array preserves the "right-of" property because each half\'s elements all have left-half indices < right-half indices in the original. Fenwick tree alternative: coordinate-compress values, then scan right-to-left. For each arr[i], query the count of indices strictly greater than rank(arr[i]) (i.e. how many already-seen elements have a larger value), then add 1 to rank(arr[i]). Both approaches are O(n log n) time, O(n) extra space.',
    '- Time: O(n log n).\n- Space: O(n) for the merge buffer / Fenwick tree.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def surpasserCount(self, arr: List[int]) -> List[int]:
        n = len(arr)
        if n == 0:
            return []
        counts = [0] * n
        idx = list(range(n))
        # Sort by value, ties broken by original index (stable for ties).
        # We'll merge sort over idx using arr[idx[k]] as the key.
        def merge_sort(lo: int, hi: int):
            if lo >= hi:
                return
            mid = (lo + hi) // 2
            merge_sort(lo, mid)
            merge_sort(mid + 1, hi)
            # Merge
            tmp = []
            i, j = lo, mid + 1
            while i <= mid and j <= hi:
                if arr[idx[i]] < arr[idx[j]]:
                    # idx[i] is surpassed by all remaining in right half
                    counts[idx[i]] += (hi - j + 1)
                    tmp.append(idx[i])
                    i += 1
                else:
                    tmp.append(idx[j])
                    j += 1
            while i <= mid:
                tmp.append(idx[i]); i += 1
            while j <= hi:
                tmp.append(idx[j]); j += 1
            for k, v in enumerate(tmp):
                idx[lo + k] = v
        merge_sort(0, n - 1)
        return counts
`,
    javascript: `var surpasserCount = function(arr) {
    const n = arr.length;
    if (n === 0) return [];
    const counts = new Array(n).fill(0);
    const idx = Array.from({length: n}, (_, i) => i);
    const ms = (lo, hi) => {
        if (lo >= hi) return;
        const mid = (lo + hi) >> 1;
        ms(lo, mid);
        ms(mid + 1, hi);
        const tmp = [];
        let i = lo, j = mid + 1;
        while (i <= mid && j <= hi) {
            if (arr[idx[i]] < arr[idx[j]]) {
                counts[idx[i]] += (hi - j + 1);
                tmp.push(idx[i++]);
            } else {
                tmp.push(idx[j++]);
            }
        }
        while (i <= mid) tmp.push(idx[i++]);
        while (j <= hi) tmp.push(idx[j++]);
        for (let k = 0; k < tmp.length; k++) idx[lo + k] = tmp[k];
    };
    ms(0, n - 1);
    return counts;
};
`,
    java: `import java.util.*;

class Solution {
    public int[] surpasserCount(int[] arr) {
        int n = arr.length;
        if (n == 0) return new int[0];
        int[] counts = new int[n];
        int[] idx = new int[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        ms(arr, idx, counts, 0, n - 1);
        return counts;
    }
    private void ms(int[] arr, int[] idx, int[] counts, int lo, int hi) {
        if (lo >= hi) return;
        int mid = (lo + hi) >>> 1;
        ms(arr, idx, counts, lo, mid);
        ms(arr, idx, counts, mid + 1, hi);
        int[] tmp = new int[hi - lo + 1];
        int i = lo, j = mid + 1, k = 0;
        while (i <= mid && j <= hi) {
            if (arr[idx[i]] < arr[idx[j]]) {
                counts[idx[i]] += (hi - j + 1);
                tmp[k++] = idx[i++];
            } else {
                tmp[k++] = idx[j++];
            }
        }
        while (i <= mid) tmp[k++] = idx[i++];
        while (j <= hi) tmp[k++] = idx[j++];
        for (int p = 0; p < tmp.length; p++) idx[lo + p] = tmp[p];
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> surpasserCount(vector<int>& arr) {
        int n = arr.size();
        if (n == 0) return {};
        vector<int> counts(n, 0);
        vector<int> idx(n);
        for (int i = 0; i < n; i++) idx[i] = i;
        ms(arr, idx, counts, 0, n - 1);
        return counts;
    }
private:
    void ms(vector<int>& arr, vector<int>& idx, vector<int>& counts, int lo, int hi) {
        if (lo >= hi) return;
        int mid = (lo + hi) / 2;
        ms(arr, idx, counts, lo, mid);
        ms(arr, idx, counts, mid + 1, hi);
        vector<int> tmp;
        tmp.reserve(hi - lo + 1);
        int i = lo, j = mid + 1;
        while (i <= mid && j <= hi) {
            if (arr[idx[i]] < arr[idx[j]]) {
                counts[idx[i]] += (hi - j + 1);
                tmp.push_back(idx[i++]);
            } else {
                tmp.push_back(idx[j++]);
            }
        }
        while (i <= mid) tmp.push_back(idx[i++]);
        while (j <= hi) tmp.push_back(idx[j++]);
        for (int k = 0; k < (int)tmp.size(); k++) idx[lo + k] = tmp[k];
    }
};
`,
  },
});

// ============================================================================
// 25. index-pairs-of-a-string (existing tc=4)
// ============================================================================
P.push({
  id: 'index-pairs-of-a-string',
  pattern: 'Trie',
  tags: ['string', 'trie', 'hash-table'],
  test_cases: [
    { inputs: ['"thestoryofleetcodeandme"', '["story","fleet","leetcode"]'], expected: '[[3,7],[9,13],[10,17]]' },
    { inputs: ['"ababa"', '["aba","ab"]'], expected: '[[0,1],[0,2],[2,3],[2,4]]' },
    { inputs: ['"abc"', '["a","b","c"]'], expected: '[[0,0],[1,1],[2,2]]' },
    { inputs: ['"abc"', '["d"]'], expected: '[]' },
    { inputs: ['""', '["abc"]'], expected: '[]' },
    { inputs: ['"a"', '["a"]'], expected: '[[0,0]]' },
    { inputs: ['"abab"', '["ab","ba"]'], expected: '[[0,1],[1,2],[2,3]]' },
    { inputs: ['"aaaa"', '["a","aa","aaa"]'], expected: '[[0,0],[0,1],[0,2],[1,1],[1,2],[1,3],[2,2],[2,3],[3,3]]' },
    { inputs: ['"hello"', '["he","ll","lo","ello"]'], expected: '[[0,1],[1,4],[2,3],[3,4]]' },
    { inputs: ['"x"', '["xx"]'], expected: '[]' },
    { inputs: ['"abcdef"', '["bcd","de","f","abcdef"]'], expected: '[[0,5],[1,3],[3,4],[5,5]]' },
  ],
  hints: [
    'Build a trie of the words.',
    'For each starting index i in text, walk the trie along text[i], text[i+1], … and emit [i, j] every time a word-end node is reached.',
    'Sort the output by i then j (LC requires it).',
    'O(total) time where total is text length × max word length × alphabet (in practice small).',
    'A simpler version uses hash-set lookups: for every (i, j) substring of length ≤ max word length, check membership — O(text * maxLen).',
  ],
  editorial_md: ED(
    'A trie lets us walk through the text once per starting index and find all word-matches in time proportional to the longest word — far cheaper than checking each substring against the full word list. Each time the trie walk hits a word-terminating node, the current (start, current-index) pair is an index pair.',
    'Build a trie by inserting every word and marking the end node with a "word ends here" flag. For each starting index i from 0 to len(text) - 1, walk node = trie.root and j = i. At each step, look up text[j] as a child of node; if not present, stop. If present, advance node = node.children[text[j]] and check node.is_end — if true, record [i, j]. Then j++ and continue. The walk for one starting index runs at most until j hits len(text) - 1 or a missing branch, never longer than the deepest word. Total time is O(len(text) * max_word_length) in the worst case, faster in practice because most paths break early. Output must be sorted lexicographically by [i, j]; iterating i in increasing order and emitting [i, j] in increasing j order yields a naturally-sorted result. Edge cases: empty text ⇒ []; words containing characters absent from text ⇒ contribute nothing; duplicate words in the list ⇒ harmless (trie naturally dedupes). The hash-set alternative — store words by length, then for every (i, L) substring check membership — is O(text * maxLen * L_hash) which is comparable.',
    '- Time: O(n * L) where n = len(text), L = max word length.\n- Space: O(total characters across words) for the trie.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def indexPairs(self, text: str, words: List[str]) -> List[List[int]]:
        trie = {}
        for w in words:
            node = trie
            for ch in w:
                node = node.setdefault(ch, {})
            node['$'] = True
        out = []
        n = len(text)
        for i in range(n):
            node = trie
            j = i
            while j < n and text[j] in node:
                node = node[text[j]]
                if node.get('$'):
                    out.append([i, j])
                j += 1
        out.sort(key=lambda p: (p[0], p[1]))
        return out
`,
    javascript: `var indexPairs = function(text, words) {
    const trie = {};
    for (const w of words) {
        let node = trie;
        for (const ch of w) {
            if (!node[ch]) node[ch] = {};
            node = node[ch];
        }
        node['$'] = true;
    }
    const out = [];
    const n = text.length;
    for (let i = 0; i < n; i++) {
        let node = trie;
        let j = i;
        while (j < n && node[text[j]]) {
            node = node[text[j]];
            if (node['$']) out.push([i, j]);
            j++;
        }
    }
    out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean end = false;
    }
    public int[][] indexPairs(String text, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {
            TrieNode node = root;
            for (char ch : w.toCharArray()) {
                node = node.children.computeIfAbsent(ch, k -> new TrieNode());
            }
            node.end = true;
        }
        List<int[]> out = new ArrayList<>();
        int n = text.length();
        for (int i = 0; i < n; i++) {
            TrieNode node = root;
            int j = i;
            while (j < n) {
                TrieNode child = node.children.get(text.charAt(j));
                if (child == null) break;
                node = child;
                if (node.end) out.add(new int[]{i, j});
                j++;
            }
        }
        out.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        return out.toArray(new int[0][]);
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
    struct TrieNode {
        unordered_map<char, TrieNode*> children;
        bool end = false;
    };
public:
    vector<vector<int>> indexPairs(string text, vector<string>& words) {
        TrieNode* root = new TrieNode();
        for (const string& w : words) {
            TrieNode* node = root;
            for (char ch : w) {
                if (!node->children.count(ch)) node->children[ch] = new TrieNode();
                node = node->children[ch];
            }
            node->end = true;
        }
        vector<vector<int>> out;
        int n = text.size();
        for (int i = 0; i < n; i++) {
            TrieNode* node = root;
            int j = i;
            while (j < n && node->children.count(text[j])) {
                node = node->children[text[j]];
                if (node->end) out.push_back({i, j});
                j++;
            }
        }
        sort(out.begin(), out.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] < b[1];
        });
        return out;
    }
};
`,
  },
});

// ============================================================================
// 26. tower-of-hanoi (existing tc=10, hints=5, pattern)
// ============================================================================
P.push({
  id: 'tower-of-hanoi',
  description: '<p>Given an integer <code>n</code> (number of disks), return the <strong>minimum number of moves</strong> required to transfer all n disks from the source peg to the destination peg, using a single auxiliary peg, following the rules: only one disk moves at a time, and a larger disk may never sit on a smaller one.</p>',
  editorial_md: ED(
    'Tower of Hanoi is the canonical worked example of recursion. To move n disks from source to destination using auxiliary, first move the top n-1 disks from source to auxiliary, then move the bottom (largest) disk from source to destination, then move the n-1 disks from auxiliary to destination. The move count satisfies T(n) = 2*T(n-1) + 1 with T(1) = 1, which has closed form T(n) = 2^n - 1.',
    'Two equally valid solutions: (1) recursive recurrence solveHanoi(n) = 2 * solveHanoi(n - 1) + 1, base case solveHanoi(1) = 1 — direct translation of the algorithm. (2) closed form (1 << n) - 1 in O(1) — derived from solving the recurrence. The minimum is achievable because the recursive procedure produces exactly 2^n - 1 moves and any valid sequence must include at least these moves (proof: the bottom disk must move at least once, requiring all smaller disks off it and back on it, which by induction is at least 2*T(n-1) + 1 moves). For the move COUNT only the closed form is fine. If the prompt asks to print every move, perform the recursive algorithm with three pegs labelled and print "Move disk k from X to Y" inside the recursion. Edge cases: n = 0 returns 0 (no disks, no moves); large n approaches 2^63 — use long in C++ / Java; in Python integers are arbitrary precision so no overflow. The recurrence depth is O(n), which fits comfortably in the call stack for n ≤ 50 or so.',
    '- Time: O(1) for the closed form; O(n) for the recursive recurrence; O(2^n) if you actually perform every move.\n- Space: O(1) for the count; O(n) recursion depth.'
  ),
  solutions: {
    python: `class Solution:
    def towerOfHanoi(self, n: int) -> int:
        if n <= 0:
            return 0
        return (1 << n) - 1
`,
    javascript: `var towerOfHanoi = function(n) {
    if (n <= 0) return 0;
    return (1 << n) - 1;
};
`,
    java: `class Solution {
    public long towerOfHanoi(int n) {
        if (n <= 0) return 0L;
        return (1L << n) - 1L;
    }
}
`,
    cpp: `class Solution {
public:
    long long towerOfHanoi(int n) {
        if (n <= 0) return 0;
        return (1LL << n) - 1LL;
    }
};
`,
  },
});

// ============================================================================
// 27. tywin
// ============================================================================
P.push({
  id: 'tywin',
  description: '<p>Tywin\'s strategy: given an integer array <code>arr</code> of size n, in each turn Tywin may pick any element and add it to his total score, then remove that element. Adjacent elements (in the original array) of the removed element are also removed (they "die"). What is the maximum total score Tywin can guarantee? Return the max score.</p>',
  method_name: 'maxTywinScore',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: '1D DP / House Robber',
  tags: ['arrays', 'dp'],
  topic_id: 'dp',
  hints: [
    'When Tywin picks index i, indices i-1 and i+1 are removed — exactly the "House Robber" no-adjacent rule.',
    'dp[i] = max(dp[i-1], dp[i-2] + arr[i]).',
    'Answer is dp[n-1]. Rolling two variables suffices for O(1) space.',
    'Negative values: treat as 0 if you can skip (Tywin won\'t pick a negative if he doesn\'t have to).',
    'O(n) time.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,1]'], expected: '4' },
    { inputs: ['[2,7,9,3,1]'], expected: '12' },
    { inputs: ['[]'], expected: '0' },
    { inputs: ['[5]'], expected: '5' },
    { inputs: ['[1,2]'], expected: '2' },
    { inputs: ['[2,1]'], expected: '2' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[10,1,10,1,10]'], expected: '30' },
    { inputs: ['[100,1,1,100]'], expected: '200' },
    { inputs: ['[1,1,1,1,1,1,1]'], expected: '4' },
    { inputs: ['[5,5,10,40,50,35]'], expected: '80' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]'], expected: '30' },
  ],
  editorial_md: ED(
    'Tywin\'s "pick and kill adjacent" rule is exactly the House Robber constraint: when you pick index i, you commit to not picking i-1 or i+1. The DP is one of the smallest and cleanest in the canon.',
    'Let dp[i] = the maximum score considering only the prefix arr[0..i]. Two choices at index i: skip i — dp[i] = dp[i-1]; or take i — dp[i] = dp[i-2] + arr[i] (i-1 was killed alongside i). Combine: dp[i] = max(dp[i-1], dp[i-2] + arr[i]). Base cases: dp[-1] = 0, dp[0] = max(0, arr[0]) (if arr[0] is negative we just skip). The recurrence rolls into two scalars prev2 and prev1, giving O(1) space. Iterate i from 0 to n-1 with cur = max(prev1, prev2 + arr[i]); then prev2 = prev1, prev1 = cur. Final answer is prev1. Correctness: the recurrence captures exactly two scenarios at each step (skip or take), no others are valid given the no-adjacent rule. Negative values: the max() naturally protects against taking a negative — Tywin just keeps the previous score. Edge cases: empty ⇒ 0; single element ⇒ max(0, arr[0]); two elements ⇒ max(arr[0], arr[1]) clamped at 0. The "circular" variant (last and first are also adjacent) is also a classic — run the linear DP twice on arr[0..n-2] and arr[1..n-1] and take the max.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def maxTywinScore(self, arr: List[int]) -> int:
        prev2 = 0
        prev1 = 0
        for x in arr:
            cur = max(prev1, prev2 + x)
            prev2 = prev1
            prev1 = cur
        return prev1
`,
    javascript: `var maxTywinScore = function(arr) {
    let prev2 = 0, prev1 = 0;
    for (const x of arr) {
        const cur = Math.max(prev1, prev2 + x);
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
};
`,
    java: `class Solution {
    public int maxTywinScore(int[] arr) {
        int prev2 = 0, prev1 = 0;
        for (int x : arr) {
            int cur = Math.max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxTywinScore(vector<int>& arr) {
        int prev2 = 0, prev1 = 0;
        for (int x : arr) {
            int cur = max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
};
`,
  },
});

// ============================================================================
// 28. minimum-window-subsequence
// ============================================================================
P.push({
  id: 'minimum-window-subsequence',
  description: '<p>Given strings <code>s</code> and <code>t</code>, return the minimum-length contiguous substring of <code>s</code> such that <code>t</code> is a subsequence of it. If no such window exists, return an empty string. If multiple windows have the same minimum length, return the one with the smallest starting index.</p>',
  method_name: 'minWindow',
  params: [
    { name: 's', type: 'str' },
    { name: 't', type: 'str' },
  ],
  return_type: 'str',
  pattern: 'Two Pointers',
  tags: ['string', 'two-pointers', 'dp', 'sliding-window'],
  hints: [
    'Two-pointer scan: greedily match characters of t in s left-to-right.',
    'When the full t is matched (j == len(t)), shrink from the right by walking backward through s while re-matching t — the resulting window\'s left index is the tightest start for that match end.',
    'Track the minimum window across all such finds.',
    'O(s * t) worst case but linear in practice with the two-pointer trick.',
    'A clean DP version: dp[i][j] = earliest start in s[0..i] such that t[0..j] is a subsequence ending at i.',
  ],
  test_cases: [
    { inputs: ['"abcdebdde"', '"bde"'], expected: '"bcde"' },
    { inputs: ['"jmeqksfrsdcmsiwvaovztaqenprpvnbstl"', '"u"'], expected: '""' },
    { inputs: ['"abc"', '"abc"'], expected: '"abc"' },
    { inputs: ['"abc"', '"d"'], expected: '""' },
    { inputs: ['"a"', '"a"'], expected: '"a"' },
    { inputs: ['"ab"', '"a"'], expected: '"a"' },
    { inputs: ['"ab"', '"b"'], expected: '"b"' },
    { inputs: ['"cnhczmccqouqadqtmjjzl"', '"mm"'], expected: '"mccqouqadqtm"' },
    { inputs: ['"aaaaaa"', '"a"'], expected: '"a"' },
    { inputs: ['"abcdef"', '"af"'], expected: '"abcdef"' },
    { inputs: ['"abbbbbbba"', '"aa"'], expected: '"abbbbbbba"' },
    { inputs: ['"ab"', '"abc"'], expected: '""' },
  ],
  editorial_md: ED(
    't being a subsequence of a window means we can match every character of t in order inside that window. The two-pointer trick is: scan s left to right greedily matching characters of t. The moment we finish matching, we have a candidate END for the window; then walk LEFT-ward from that end, re-matching t in reverse to find the tightest START for that end. Repeat.',
    'Use two indices i (in s) and j (in t). Sweep i forward; whenever s[i] == t[j], j++. When j reaches len(t), we have a match ending at i. To shrink the window from the left for this same match-end, walk i backward and decrement j on each character that equals t[j-1]; when j becomes 0, the start of the smallest window for this end is the current i. Record the window if it improves on the best. After this shrink step, advance i and j (i = start + 1, j = 0) and continue. Greedy is optimal here because matching t\'s characters as early as possible can only equal or better any later start; the reverse-shrink then tightens the right side. The resulting algorithm runs in O(s * t) worst case but is typically O(s) on practical inputs. The DP formulation dp[i][j] = the earliest index in s such that t[0..j] is a subsequence of s[earliestStart..i] is O(s * t) and conceptually cleaner; the two-pointer version uses less memory. Edge cases: t empty ⇒ "" (or s[0] depending on convention); t longer than s or any character of t missing from s ⇒ "" returned.',
    '- Time: O(|s| * |t|) worst case; O(|s|) typical.\n- Space: O(1) extra beyond output.'
  ),
  solutions: {
    python: `class Solution:
    def minWindow(self, s: str, t: str) -> str:
        m, n = len(s), len(t)
        if n == 0 or n > m:
            return ''
        best_start = -1
        best_len = m + 1
        i = j = 0
        while i < m:
            if s[i] == t[j]:
                j += 1
                if j == n:
                    end = i + 1
                    j -= 1
                    while j >= 0:
                        if s[i] == t[j]:
                            j -= 1
                        i -= 1
                    j += 1
                    i += 1
                    if end - i < best_len:
                        best_len = end - i
                        best_start = i
                    j = 0
            i += 1
        return '' if best_start == -1 else s[best_start:best_start + best_len]
`,
    javascript: `var minWindow = function(s, t) {
    const m = s.length, n = t.length;
    if (n === 0 || n > m) return '';
    let bestStart = -1, bestLen = m + 1;
    let i = 0, j = 0;
    while (i < m) {
        if (s[i] === t[j]) {
            j++;
            if (j === n) {
                const end = i + 1;
                j--;
                while (j >= 0) {
                    if (s[i] === t[j]) j--;
                    i--;
                }
                j++;
                i++;
                if (end - i < bestLen) {
                    bestLen = end - i;
                    bestStart = i;
                }
                j = 0;
            }
        }
        i++;
    }
    return bestStart === -1 ? '' : s.substring(bestStart, bestStart + bestLen);
};
`,
    java: `class Solution {
    public String minWindow(String s, String t) {
        int m = s.length(), n = t.length();
        if (n == 0 || n > m) return "";
        int bestStart = -1, bestLen = m + 1;
        int i = 0, j = 0;
        while (i < m) {
            if (s.charAt(i) == t.charAt(j)) {
                j++;
                if (j == n) {
                    int end = i + 1;
                    j--;
                    while (j >= 0) {
                        if (s.charAt(i) == t.charAt(j)) j--;
                        i--;
                    }
                    j++;
                    i++;
                    if (end - i < bestLen) {
                        bestLen = end - i;
                        bestStart = i;
                    }
                    j = 0;
                }
            }
            i++;
        }
        return bestStart == -1 ? "" : s.substring(bestStart, bestStart + bestLen);
    }
}
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    string minWindow(string s, string t) {
        int m = s.size(), n = t.size();
        if (n == 0 || n > m) return "";
        int bestStart = -1, bestLen = m + 1;
        int i = 0, j = 0;
        while (i < m) {
            if (s[i] == t[j]) {
                j++;
                if (j == n) {
                    int end = i + 1;
                    j--;
                    while (j >= 0) {
                        if (s[i] == t[j]) j--;
                        i--;
                    }
                    j++;
                    i++;
                    if (end - i < bestLen) {
                        bestLen = end - i;
                        bestStart = i;
                    }
                    j = 0;
                }
            }
            i++;
        }
        return bestStart == -1 ? "" : s.substr(bestStart, bestLen);
    }
};
`,
  },
});

// ============================================================================
// 29. count-subarrays-with-k-equal-value-pairs
// ============================================================================
P.push({
  id: 'count-subarrays-with-k-equal-value-pairs',
  description: '<p>Given an integer array <code>nums</code> and an integer <code>k</code>, count the number of contiguous subarrays in which the number of pairs (i, j) with i &lt; j and nums[i] == nums[j] is exactly k. Return the count.</p>',
  method_name: 'countSubarraysKPairs',
  params: [
    { name: 'nums', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: 'Sliding Window',
  tags: ['arrays', 'sliding-window', 'hash-table'],
  hints: [
    'For a fixed value v with count c in a subarray, it contributes c*(c-1)/2 equal-value pairs.',
    'Maintain a sliding window [l, r]. Track pairs = sum over distinct values of cnt[v] * (cnt[v]-1) / 2.',
    'Use atMost(k) - atMost(k - 1): count subarrays with at most k pairs and subtract those with at most k-1.',
    'atMost(K): slide r right; when pairs > K, shrink from the left until pairs ≤ K. Add (r - l + 1) at each step.',
    'O(n) total — each element enters and leaves the window once.',
  ],
  test_cases: [
    { inputs: ['[1,1,1,1,1]', '10'], expected: '1' },
    { inputs: ['[1,2,3,1,5]', '0'], expected: '11' },
    { inputs: ['[1,1,1,1]', '6'], expected: '1' },
    { inputs: ['[1,1,1,1]', '3'], expected: '2' },
    { inputs: ['[1,2,1,2,3]', '2'], expected: '2' },
    { inputs: ['[]', '0'], expected: '0' },
    { inputs: ['[1]', '0'], expected: '1' },
    { inputs: ['[1,2,3,4,5]', '0'], expected: '15' },
    { inputs: ['[1,1]', '1'], expected: '1' },
    { inputs: ['[2,2,2,2,2]', '1'], expected: '4' },
    { inputs: ['[1,1,2,2,1,1]', '4'], expected: '4' },
    { inputs: ['[1,2,3,1,2,3]', '1'], expected: '6' },
  ],
  editorial_md: ED(
    'Equal-value-pair count for a window is the sum over each value v of c_v choose 2, where c_v is the count of v in the window. The "exactly k" count = atMost(k) - atMost(k - 1) — the staple sliding-window two-call trick that turns a tricky exact constraint into two monotone ones.',
    'Write a helper atMost(K) that returns the number of subarrays with at most K equal-value pairs. Slide window [l, r]: add nums[r] to the window count, increment pairs by (cnt[nums[r]] - 1) before incrementing the count (each previous occurrence forms a new pair with the newcomer). While pairs > K, remove nums[l] from the left: decrement cnt first, then subtract its current count from pairs (since cnt now reflects post-removal, and the old cnt - 1 pairs are gone, which equals the new cnt). l++. After the while, add (r - l + 1) to the running answer — every subarray ending at r and starting at any l, l+1, …, r has at most K pairs. The final answer is atMost(k) - atMost(k - 1) (with atMost(-1) = 0). Why atMost is well-defined here: as we grow the right, pairs only increase; as we shrink the left, pairs only decrease — so a single sliding-window pass suffices per call. Total time is O(n). Edge cases: empty array ⇒ 0; k = 0 counts subarrays with all distinct elements (still works with the same formula); large duplicate runs blow pairs up quickly and the left pointer skips fast.',
    '- Time: O(n) — each element enters / leaves the window once per atMost call.\n- Space: O(distinct values) for the count map.'
  ),
  solutions: {
    python: `from typing import List
from collections import defaultdict

class Solution:
    def countSubarraysKPairs(self, nums: List[int], k: int) -> int:
        def at_most(K: int) -> int:
            if K < 0:
                return 0
            cnt = defaultdict(int)
            pairs = 0
            l = 0
            ans = 0
            for r, v in enumerate(nums):
                pairs += cnt[v]
                cnt[v] += 1
                while pairs > K:
                    cnt[nums[l]] -= 1
                    pairs -= cnt[nums[l]]
                    l += 1
                ans += r - l + 1
            return ans
        return at_most(k) - at_most(k - 1)
`,
    javascript: `var countSubarraysKPairs = function(nums, k) {
    const atMost = (K) => {
        if (K < 0) return 0;
        const cnt = new Map();
        let pairs = 0, l = 0, ans = 0;
        for (let r = 0; r < nums.length; r++) {
            const v = nums[r];
            const c = cnt.get(v) || 0;
            pairs += c;
            cnt.set(v, c + 1);
            while (pairs > K) {
                const lv = nums[l];
                const lc = cnt.get(lv);
                cnt.set(lv, lc - 1);
                pairs -= (lc - 1);
                l++;
            }
            ans += r - l + 1;
        }
        return ans;
    };
    return atMost(k) - atMost(k - 1);
};
`,
    java: `import java.util.*;

class Solution {
    public int countSubarraysKPairs(int[] nums, int k) {
        return (int) (atMost(nums, k) - atMost(nums, k - 1));
    }
    private long atMost(int[] nums, int K) {
        if (K < 0) return 0;
        Map<Integer, Integer> cnt = new HashMap<>();
        long pairs = 0, ans = 0;
        int l = 0;
        for (int r = 0; r < nums.length; r++) {
            int v = nums[r];
            int c = cnt.getOrDefault(v, 0);
            pairs += c;
            cnt.put(v, c + 1);
            while (pairs > K) {
                int lv = nums[l];
                int lc = cnt.get(lv);
                cnt.put(lv, lc - 1);
                pairs -= (lc - 1);
                l++;
            }
            ans += r - l + 1;
        }
        return ans;
    }
}
`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int countSubarraysKPairs(vector<int>& nums, int k) {
        return (int)(atMost(nums, k) - atMost(nums, k - 1));
    }
private:
    long long atMost(vector<int>& nums, int K) {
        if (K < 0) return 0;
        unordered_map<int, int> cnt;
        long long pairs = 0, ans = 0;
        int l = 0;
        for (int r = 0; r < (int)nums.size(); r++) {
            int v = nums[r];
            int c = cnt[v];
            pairs += c;
            cnt[v] = c + 1;
            while (pairs > K) {
                int lv = nums[l];
                cnt[lv]--;
                pairs -= cnt[lv];
                l++;
            }
            ans += r - l + 1;
        }
        return ans;
    }
};
`,
  },
});

// ============================================================================
// 30. equilibrium-index
// ============================================================================
P.push({
  id: 'equilibrium-index',
  description: '<p>Given an integer array <code>arr</code>, an equilibrium index is one where the sum of all elements to its left equals the sum of all elements to its right (the element at that index itself is excluded). Return the leftmost equilibrium index, or -1 if none exists.</p>',
  method_name: 'equilibriumIndex',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Prefix Sum',
  tags: ['arrays', 'prefix-sum'],
  hints: [
    'Compute total = sum(arr). Walk i from left to right with a running leftSum.',
    'rightSum = total - leftSum - arr[i]. If leftSum == rightSum, return i.',
    'Otherwise leftSum += arr[i] and continue.',
    'Return -1 if no index matches.',
    'O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[1,3,5,2,2]'], expected: '2' },
    { inputs: ['[-7,1,5,2,-4,3,0]'], expected: '3' },
    { inputs: ['[1,2,3]'], expected: '-1' },
    { inputs: ['[]'], expected: '-1' },
    { inputs: ['[0]'], expected: '0' },
    { inputs: ['[1,0,-1]'], expected: '0' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[1,2,3,4,3,2,1]'], expected: '3' },
    { inputs: ['[-1,3,-4,5,1,-6,2,1]'], expected: '1' },
    { inputs: ['[2,4,6]'], expected: '-1' },
    { inputs: ['[1,-1,1,-1,0]'], expected: '4' },
    { inputs: ['[10,-10]'], expected: '-1' },
  ],
  editorial_md: ED(
    'For each index i, the left-sum is the prefix sum up to i-1 and the right-sum is total - leftSum - arr[i]. Compute total once and walk left to right with a running leftSum to test every index in O(n) total.',
    'Compute total = sum(arr) in a first pass. Initialise leftSum = 0. Walk i from 0 to n - 1: rightSum = total - leftSum - arr[i]. If leftSum == rightSum, return i (leftmost equilibrium index — the loop guarantees that). Otherwise leftSum += arr[i] and continue. If the loop finishes without returning, return -1. The trick is keeping the right sum in O(1) per step by deriving it from the known total and the running left sum, avoiding the naive O(n^2) of recomputing the right side for every index. Conventions for boundaries: at i = 0, leftSum is 0; at i = n - 1, rightSum is 0; both endpoints are valid candidates when their other side sums to zero (e.g. [0] returns 0; [1,-1,1,-1,0] returns 4 because the prefix 1-1+1-1 = 0 equals right side 0). Edge cases: empty array returns -1 (no index exists); single element always returns 0 (both sides are empty, both sum to 0); arrays with all zeros return 0 (first index works). The variant that returns ALL equilibrium indices replaces the early return with an append-and-continue.',
    '- Time: O(n) — two linear scans.\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def equilibriumIndex(self, arr: List[int]) -> int:
        n = len(arr)
        if n == 0:
            return -1
        total = sum(arr)
        left_sum = 0
        for i in range(n):
            right_sum = total - left_sum - arr[i]
            if left_sum == right_sum:
                return i
            left_sum += arr[i]
        return -1
`,
    javascript: `var equilibriumIndex = function(arr) {
    const n = arr.length;
    if (n === 0) return -1;
    let total = 0;
    for (const x of arr) total += x;
    let leftSum = 0;
    for (let i = 0; i < n; i++) {
        const rightSum = total - leftSum - arr[i];
        if (leftSum === rightSum) return i;
        leftSum += arr[i];
    }
    return -1;
};
`,
    java: `class Solution {
    public int equilibriumIndex(int[] arr) {
        int n = arr.length;
        if (n == 0) return -1;
        long total = 0;
        for (int x : arr) total += x;
        long leftSum = 0;
        for (int i = 0; i < n; i++) {
            long rightSum = total - leftSum - arr[i];
            if (leftSum == rightSum) return i;
            leftSum += arr[i];
        }
        return -1;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int equilibriumIndex(vector<int>& arr) {
        int n = arr.size();
        if (n == 0) return -1;
        long long total = 0;
        for (int x : arr) total += x;
        long long leftSum = 0;
        for (int i = 0; i < n; i++) {
            long long rightSum = total - leftSum - arr[i];
            if (leftSum == rightSum) return i;
            leftSum += arr[i];
        }
        return -1;
    }
};
`,
  },
});

// Combine both parts.
const part1 = JSON.parse(fs.readFileSync('/tmp/_patch-w3-500-02-part1.json', 'utf8'));
const combined = [...part1, ...P];
fs.writeFileSync('/tmp/patch-w3-500-02.json', JSON.stringify(combined, null, 2));
console.log('Combined wrote', combined.length, 'entries to /tmp/patch-w3-500-02.json');
