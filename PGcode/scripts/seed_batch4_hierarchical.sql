BEGIN;

-- ============================================================
-- DELETE existing rows for idempotency
-- ============================================================
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'validate-bst', 'kth-smallest-bst', 'construct-from-preorder-inorder',
  'binary-tree-right-side', 'diameter-binary-tree', 'balanced-binary-tree',
  'lowest-common-ancestor',
  'walls-and-gates', 'graph-valid-tree', 'connected-components',
  'redundant-connection', 'word-ladder',
  'find-median-data-stream', 'top-k-frequent-words', 'reorganize-string',
  'sort-characters-by-frequency',
  'longest-word-dictionary', 'search-suggestions-system'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'validate-bst', 'kth-smallest-bst', 'construct-from-preorder-inorder',
  'binary-tree-right-side', 'diameter-binary-tree', 'balanced-binary-tree',
  'lowest-common-ancestor',
  'walls-and-gates', 'graph-valid-tree', 'connected-components',
  'redundant-connection', 'word-ladder',
  'find-median-data-stream', 'top-k-frequent-words', 'reorganize-string',
  'sort-characters-by-frequency',
  'longest-word-dictionary', 'search-suggestions-system'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'validate-bst', 'kth-smallest-bst', 'construct-from-preorder-inorder',
  'binary-tree-right-side', 'diameter-binary-tree', 'balanced-binary-tree',
  'lowest-common-ancestor',
  'walls-and-gates', 'graph-valid-tree', 'connected-components',
  'redundant-connection', 'word-ladder',
  'find-median-data-stream', 'top-k-frequent-words', 'reorganize-string',
  'sort-characters-by-frequency',
  'longest-word-dictionary', 'search-suggestions-system'
);

-- ============================================================
-- TREES: 1. validate-bst (Medium, LeetCode 98)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'validate-bst', 'trees', 'Validate Binary Search Tree', 'Medium',
  $DESC$<p>Given the <code>root</code> of a binary tree, determine if it is a <strong>valid binary search tree (BST)</strong>.</p>
<p>A <strong>valid BST</strong> is defined as follows:</p>
<ul>
<li>The left subtree of a node contains only nodes with keys <strong>less than</strong> the node''s key.</li>
<li>The right subtree of a node contains only nodes with keys <strong>greater than</strong> the node''s key.</li>
<li>Both the left and right subtrees must also be binary search trees.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [2,1,3]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node''s value is 5 but its right child''s value is 4.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is in the range <code>[1, 10<sup>4</sup>]</code>.</li>
<li><code>-2<sup>31</sup> &lt;= Node.val &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['Think about what range of values each node is allowed to have.', 'For the left subtree of a node with value v, all values must be less than v. For the right subtree, all must be greater.', 'Pass down min and max bounds as you recurse. Use negative and positive infinity as initial bounds.'],
  '200', 'https://leetcode.com/problems/validate-binary-search-tree/',
  'isValidBST', '[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb, 'bool',
  '[{"inputs":["[2,1,3]"],"expected":"true"},{"inputs":["[5,1,4,null,null,3,6]"],"expected":"false"},{"inputs":["[1]"],"expected":"true"},{"inputs":["[2,2,2]"],"expected":"false"},{"inputs":["[5,4,6,null,null,3,7]"],"expected":"false"},{"inputs":["[10,5,15,null,null,6,20]"],"expected":"false"},{"inputs":["[3,1,5,0,2,4,6]"],"expected":"true"},{"inputs":["[1,null,2,null,3,null,4]"],"expected":"true"},{"inputs":["[4,3,null,2,null,1]"],"expected":"true"},{"inputs":["[10,5,15,3,7,13,18,1,null,6]"],"expected":"true"},{"inputs":["[0,-1]"],"expected":"true"},{"inputs":["[5,1,6,null,null,4,7]"],"expected":"false"},{"inputs":["[3,null,30,10,null,null,15,null,45]"],"expected":"false"},{"inputs":["[120,70,140,50,100,130,160,20,55]"],"expected":"true"},{"inputs":["[2,1,3,null,null,null,null]"],"expected":"true"},{"inputs":["[1,1]"],"expected":"false"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'validate-bst', 1, 'Recursive with Bounds',
  'A valid BST requires every node to fall within a valid range. The root can be anything, but its left child must be less than the root, and its right child must be greater. We pass these bounds down recursively.',
  '["Define a helper function that takes a node, a lower bound, and an upper bound.","If the node is null, return true (empty tree is valid).","If the node value is not strictly between lower and upper bounds, return false.","Recursively validate left subtree with updated upper bound = node value.","Recursively validate right subtree with updated lower bound = node value.","Return true only if both subtrees are valid."]'::jsonb,
  $PY$class Solution:
    def isValidBST(self, root) -> bool:
        def validate(node, low, high):
            if not node:
                return True
            if node.val <= low or node.val >= high:
                return False
            return validate(node.left, low, node.val) and validate(node.right, node.val, high)
        return validate(root, float('-inf'), float('inf'))$PY$,
  $JS$var isValidBST = function(root) {
    function validate(node, low, high) {
        if (!node) return true;
        if (node.val <= low || node.val >= high) return false;
        return validate(node.left, low, node.val) && validate(node.right, node.val, high);
    }
    return validate(root, -Infinity, Infinity);
};$JS$,
  $JAVA$class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    private boolean validate(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return validate(node.left, low, node.val) && validate(node.right, node.val, high);
    }
}$JAVA$,
  'O(n)', 'O(h) where h is tree height'
);

-- ============================================================
-- TREES: 2. kth-smallest-bst (Medium, LeetCode 230)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'kth-smallest-bst', 'trees', 'Kth Smallest Element in a BST', 'Medium',
  $DESC$<p>Given the <code>root</code> of a binary search tree, and an integer <code>k</code>, return the <code>k<sup>th</sup></code> smallest value (<strong>1-indexed</strong>) of all the values of the nodes in the tree.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [3,1,4,null,2], k = 1
Output: 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [5,3,6,2,4,null,null,1], k = 3
Output: 3</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is <code>n</code>.</li>
<li><code>1 &lt;= k &lt;= n &lt;= 10<sup>4</sup></code></li>
<li><code>0 &lt;= Node.val &lt;= 10<sup>4</sup></code></li>
</ul>$DESC$,
  '', ARRAY['In-order traversal of a BST visits nodes in ascending order.', 'You can do an iterative in-order traversal using a stack, stopping at the kth element.', 'Alternatively, do a full in-order traversal and return the (k-1)th element.'],
  '200', 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',
  'kthSmallest', '[{"name":"root","type":"Optional[TreeNode]"},{"name":"k","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["[3,1,4,null,2]","1"],"expected":"1"},{"inputs":["[5,3,6,2,4,null,null,1]","3"],"expected":"3"},{"inputs":["[1]","1"],"expected":"1"},{"inputs":["[2,1,3]","2"],"expected":"2"},{"inputs":["[2,1,3]","3"],"expected":"3"},{"inputs":["[2,1,3]","1"],"expected":"1"},{"inputs":["[5,3,7,1,4,6,8]","4"],"expected":"5"},{"inputs":["[5,3,7,1,4,6,8]","7"],"expected":"8"},{"inputs":["[5,3,7,1,4,6,8]","1"],"expected":"1"},{"inputs":["[3,1,4,null,2]","2"],"expected":"2"},{"inputs":["[3,1,4,null,2]","3"],"expected":"3"},{"inputs":["[3,1,4,null,2]","4"],"expected":"4"},{"inputs":["[6,2,8,0,4,7,9,null,null,3,5]","5"],"expected":"5"},{"inputs":["[6,2,8,0,4,7,9,null,null,3,5]","1"],"expected":"0"},{"inputs":["[6,2,8,0,4,7,9,null,null,3,5]","9"],"expected":"9"},{"inputs":["[41,37,44,24,39,42,48,1,35,38,40,null,43,46,49,0,2,30,36,null,null,null,null,null,null,45,47]","19"],"expected":"48"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'kth-smallest-bst', 1, 'Iterative In-Order Traversal',
  'In-order traversal of a BST yields values in sorted ascending order. We perform an iterative in-order traversal using a stack and return the kth element we visit.',
  '["Initialize an empty stack and set current = root.","While current is not null or stack is not empty:","  Push current and move to its left child until current is null.","  Pop from stack (this is the next smallest), decrement k.","  If k == 0, return the popped node value.","  Set current to the popped node right child."]'::jsonb,
  $PY$class Solution:
    def kthSmallest(self, root, k: int) -> int:
        stack = []
        current = root
        while current or stack:
            while current:
                stack.append(current)
                current = current.left
            current = stack.pop()
            k -= 1
            if k == 0:
                return current.val
            current = current.right$PY$,
  $JS$var kthSmallest = function(root, k) {
    var stack = [];
    var current = root;
    while (current || stack.length > 0) {
        while (current) {
            stack.push(current);
            current = current.left;
        }
        current = stack.pop();
        k--;
        if (k === 0) return current.val;
        current = current.right;
    }
};$JS$,
  $JAVA$class Solution {
    public int kthSmallest(TreeNode root, int k) {
        java.util.Deque<TreeNode> stack = new java.util.ArrayDeque<>();
        TreeNode current = root;
        while (current != null || !stack.isEmpty()) {
            while (current != null) {
                stack.push(current);
                current = current.left;
            }
            current = stack.pop();
            k--;
            if (k == 0) return current.val;
            current = current.right;
        }
        return -1;
    }
}$JAVA$,
  'O(H + k) where H is tree height', 'O(H)'
);

-- ============================================================
-- TREES: 3. construct-from-preorder-inorder (Medium, LeetCode 105)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'construct-from-preorder-inorder', 'trees', 'Construct Binary Tree from Preorder and Inorder Traversal', 'Medium',
  $DESC$<p>Given two integer arrays <code>preorder</code> and <code>inorder</code> where <code>preorder</code> is the preorder traversal of a binary tree and <code>inorder</code> is the inorder traversal of the same tree, construct and return the binary tree.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
Output: [3,9,20,null,null,15,7]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: preorder = [-1], inorder = [-1]
Output: [-1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= preorder.length &lt;= 3000</code></li>
<li><code>inorder.length == preorder.length</code></li>
<li><code>-3000 &lt;= preorder[i], inorder[i] &lt;= 3000</code></li>
<li><code>preorder</code> and <code>inorder</code> consist of <strong>unique</strong> values.</li>
</ul>$DESC$,
  '', ARRAY['The first element of preorder is always the root.', 'Find the root in inorder to determine the left and right subtrees.', 'Use a hashmap for O(1) lookup of root position in inorder array.'],
  '200', 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/',
  'buildTree', '[{"name":"preorder","type":"List[int]"},{"name":"inorder","type":"List[int]"}]'::jsonb, 'Optional[TreeNode]',
  '[{"inputs":["[3,9,20,15,7]","[9,3,15,20,7]"],"expected":"[3,9,20,null,null,15,7]"},{"inputs":["[-1]","[-1]"],"expected":"[-1]"},{"inputs":["[1,2]","[2,1]"],"expected":"[1,2]"},{"inputs":["[1,2]","[1,2]"],"expected":"[1,null,2]"},{"inputs":["[1,2,3]","[2,1,3]"],"expected":"[1,2,3]"},{"inputs":["[1,2,4,5,3,6,7]","[4,2,5,1,6,3,7]"],"expected":"[1,2,3,4,5,6,7]"},{"inputs":["[3,1,2,4]","[1,2,3,4]"],"expected":"[3,1,4,null,2]"},{"inputs":["[1,2,3]","[3,2,1]"],"expected":"[1,2,null,3]"},{"inputs":["[1,2,3]","[1,3,2]"],"expected":"[1,null,2,3]"},{"inputs":["[5,3,2,4,7,6,8]","[2,3,4,5,6,7,8]"],"expected":"[5,3,7,2,4,6,8]"},{"inputs":["[4,2,1,3,6,5,7]","[1,2,3,4,5,6,7]"],"expected":"[4,2,6,1,3,5,7]"},{"inputs":["[10,5,3,7,15,12,20]","[3,5,7,10,12,15,20]"],"expected":"[10,5,15,3,7,12,20]"},{"inputs":["[1,2,4,8,5,3,6,9,7]","[8,4,2,5,1,9,6,3,7]"],"expected":"[1,2,3,4,5,6,7,8,null,null,null,9]"},{"inputs":["[7,3,1,5,11,9,13]","[1,3,5,7,9,11,13]"],"expected":"[7,3,11,1,5,9,13]"},{"inputs":["[2,1,3,4]","[1,2,3,4]"],"expected":"[2,1,3,null,null,null,4]"},{"inputs":["[8,4,2,6,12,10,14]","[2,4,6,8,10,12,14]"],"expected":"[8,4,12,2,6,10,14]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'construct-from-preorder-inorder', 1, 'Recursive with HashMap',
  'The first element of preorder is the root. We find this root in the inorder array to determine the sizes of the left and right subtrees. Using a hashmap for O(1) lookups in inorder, we recursively build the left and right subtrees.',
  '["Build a hashmap mapping each value in inorder to its index.","Define a recursive function with preorder range [preStart, preEnd] and inorder range [inStart, inEnd].","The root is preorder[preStart]. Find its index in inorder using the hashmap.","Calculate leftSize = rootIndex - inStart.","Recursively build left subtree from preorder[preStart+1..preStart+leftSize] and inorder[inStart..rootIndex-1].","Recursively build right subtree from preorder[preStart+leftSize+1..preEnd] and inorder[rootIndex+1..inEnd].","Return the constructed root node."]'::jsonb,
  $PY$class Solution:
    def buildTree(self, preorder, inorder):
        inorder_map = {val: idx for idx, val in enumerate(inorder)}

        def build(pre_start, pre_end, in_start, in_end):
            if pre_start > pre_end:
                return None
            root_val = preorder[pre_start]
            root = TreeNode(root_val)
            root_idx = inorder_map[root_val]
            left_size = root_idx - in_start
            root.left = build(pre_start + 1, pre_start + left_size, in_start, root_idx - 1)
            root.right = build(pre_start + left_size + 1, pre_end, root_idx + 1, in_end)
            return root

        return build(0, len(preorder) - 1, 0, len(inorder) - 1)$PY$,
  $JS$var buildTree = function(preorder, inorder) {
    var inorderMap = new Map();
    for (var i = 0; i < inorder.length; i++) {
        inorderMap.set(inorder[i], i);
    }
    function build(preStart, preEnd, inStart, inEnd) {
        if (preStart > preEnd) return null;
        var rootVal = preorder[preStart];
        var root = new TreeNode(rootVal);
        var rootIdx = inorderMap.get(rootVal);
        var leftSize = rootIdx - inStart;
        root.left = build(preStart + 1, preStart + leftSize, inStart, rootIdx - 1);
        root.right = build(preStart + leftSize + 1, preEnd, rootIdx + 1, inEnd);
        return root;
    }
    return build(0, preorder.length - 1, 0, inorder.length - 1);
};$JS$,
  $JAVA$class Solution {
    private java.util.Map<Integer, Integer> inorderMap;
    private int[] preorder;

    public TreeNode buildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        inorderMap = new java.util.HashMap<>();
        for (int i = 0; i < inorder.length; i++) {
            inorderMap.put(inorder[i], i);
        }
        return build(0, preorder.length - 1, 0, inorder.length - 1);
    }

    private TreeNode build(int preStart, int preEnd, int inStart, int inEnd) {
        if (preStart > preEnd) return null;
        int rootVal = preorder[preStart];
        TreeNode root = new TreeNode(rootVal);
        int rootIdx = inorderMap.get(rootVal);
        int leftSize = rootIdx - inStart;
        root.left = build(preStart + 1, preStart + leftSize, inStart, rootIdx - 1);
        root.right = build(preStart + leftSize + 1, preEnd, rootIdx + 1, inEnd);
        return root;
    }
}$JAVA$,
  'O(n)', 'O(n)'
);

-- ============================================================
-- TREES: 4. binary-tree-right-side (Medium, LeetCode 199)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'binary-tree-right-side', 'trees', 'Binary Tree Right Side View', 'Medium',
  $DESC$<p>Given the <code>root</code> of a binary tree, imagine yourself standing on the <strong>right side</strong> of it, return the values of the nodes you can see ordered from top to bottom.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [1,2,3,null,5,null,4]
Output: [1,3,4]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [1,null,3]
Output: [1,3]</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: root = []
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is in the range <code>[0, 100]</code>.</li>
<li><code>-100 &lt;= Node.val &lt;= 100</code></li>
</ul>$DESC$,
  '', ARRAY['The right side view shows the last node at each level of the tree.', 'Use BFS (level-order traversal) and take the last element of each level.', 'Alternatively, use DFS visiting right child first, adding the first node seen at each new depth.'],
  '200', 'https://leetcode.com/problems/binary-tree-right-side-view/',
  'rightSideView', '[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb, 'List[int]',
  '[{"inputs":["[1,2,3,null,5,null,4]"],"expected":"[1,3,4]"},{"inputs":["[1,null,3]"],"expected":"[1,3]"},{"inputs":["[]"],"expected":"[]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[1,2]"],"expected":"[1,2]"},{"inputs":["[1,2,3]"],"expected":"[1,3]"},{"inputs":["[1,2,3,4]"],"expected":"[1,3,4]"},{"inputs":["[1,2,3,null,5]"],"expected":"[1,3,5]"},{"inputs":["[1,2,3,4,null,null,null,5]"],"expected":"[1,3,4,5]"},{"inputs":["[1,2,null,3,null,4]"],"expected":"[1,2,3,4]"},{"inputs":["[1,2,3,4,5,6,7]"],"expected":"[1,3,7]"},{"inputs":["[1,2,3,null,4,null,5,null,6]"],"expected":"[1,3,5,6]"},{"inputs":["[5,3,8,1,4,7,9]"],"expected":"[5,8,9]"},{"inputs":["[1,null,2,null,3,null,4,null,5]"],"expected":"[1,2,3,4,5]"},{"inputs":["[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]"],"expected":"[1,3,7,15]"},{"inputs":["[10,5,15,3,7,null,18]"],"expected":"[10,15,18]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'binary-tree-right-side', 1, 'BFS Level-Order Traversal',
  'We perform a level-order traversal (BFS) of the tree. For each level, the last node we process is the one visible from the right side. We add that node''s value to our result.',
  '["If root is null, return empty list.","Initialize a queue with root.","While queue is not empty:","  Record the size of the current level.","  Process all nodes in this level; the last one is the rightmost.","  Add children of each node to the queue.","  Append the last node value of this level to the result.","Return the result list."]'::jsonb,
  $PY$from collections import deque

class Solution:
    def rightSideView(self, root):
        if not root:
            return []
        result = []
        queue = deque([root])
        while queue:
            level_size = len(queue)
            for i in range(level_size):
                node = queue.popleft()
                if i == level_size - 1:
                    result.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
        return result$PY$,
  $JS$var rightSideView = function(root) {
    if (!root) return [];
    var result = [];
    var queue = [root];
    while (queue.length > 0) {
        var levelSize = queue.length;
        for (var i = 0; i < levelSize; i++) {
            var node = queue.shift();
            if (i === levelSize - 1) result.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public java.util.List<Integer> rightSideView(TreeNode root) {
        java.util.List<Integer> result = new java.util.ArrayList<>();
        if (root == null) return result;
        java.util.Queue<TreeNode> queue = new java.util.LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                if (i == levelSize - 1) result.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
        }
        return result;
    }
}$JAVA$,
  'O(n)', 'O(n)'
);

-- ============================================================
-- TREES: 5. diameter-binary-tree (Easy, LeetCode 543)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'diameter-binary-tree', 'trees', 'Diameter of Binary Tree', 'Easy',
  $DESC$<p>Given the <code>root</code> of a binary tree, return the length of the <strong>diameter</strong> of the tree.</p>
<p>The <strong>diameter</strong> of a binary tree is the <strong>length</strong> of the longest path between any two nodes in a tree. This path may or may not pass through the <code>root</code>.</p>
<p>The <strong>length</strong> of a path between two nodes is represented by the number of edges between them.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [1,2,3,4,5]
Output: 3
Explanation: 3 is the length of the path [4,2,1,3] or [5,2,1,3].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [1,2]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is in the range <code>[1, 10<sup>4</sup>]</code>.</li>
<li><code>-100 &lt;= Node.val &lt;= 100</code></li>
</ul>$DESC$,
  '', ARRAY['The diameter through a node is leftDepth + rightDepth.', 'Use DFS to compute the depth of each subtree, while tracking the maximum diameter seen.', 'The depth of a node is 1 + max(leftDepth, rightDepth). The diameter at a node is leftDepth + rightDepth.'],
  '200', 'https://leetcode.com/problems/diameter-of-binary-tree/',
  'diameterOfBinaryTree', '[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb, 'int',
  '[{"inputs":["[1,2,3,4,5]"],"expected":"3"},{"inputs":["[1,2]"],"expected":"1"},{"inputs":["[1]"],"expected":"0"},{"inputs":["[1,2,3]"],"expected":"2"},{"inputs":["[1,2,null,3,null,4]"],"expected":"3"},{"inputs":["[1,2,3,4,5,6,7]"],"expected":"4"},{"inputs":["[1,null,2,null,3,null,4]"],"expected":"3"},{"inputs":["[4,2,null,1,3]"],"expected":"2"},{"inputs":["[1,2,3,4,5,null,null,8,null,6,7]"],"expected":"4"},{"inputs":["[1,2,3,null,4,null,5,null,6,null,7]"],"expected":"6"},{"inputs":["[5,3,8,1,4,7,9]"],"expected":"4"},{"inputs":["[1,null,2]"],"expected":"1"},{"inputs":["[1,2,3,4,null,null,5]"],"expected":"4"},{"inputs":["[1,2,3,4,5,6,7,8,9]"],"expected":"5"},{"inputs":["[10,5,15,3,7,12,20]"],"expected":"4"},{"inputs":["[1,2,3,null,null,4,5,6,null,null,7]"],"expected":"4"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'diameter-binary-tree', 1, 'DFS Depth Tracking',
  'At each node, the longest path passing through it equals the depth of its left subtree plus the depth of its right subtree. We compute depths via DFS and track the maximum diameter across all nodes.',
  '["Initialize a variable diameter = 0.","Define a DFS function that returns the depth of a node.","For each node, recursively compute left depth and right depth.","Update diameter = max(diameter, leftDepth + rightDepth).","Return 1 + max(leftDepth, rightDepth) as the depth of this node.","After DFS completes, return diameter."]'::jsonb,
  $PY$class Solution:
    def diameterOfBinaryTree(self, root) -> int:
        self.diameter = 0

        def depth(node):
            if not node:
                return 0
            left = depth(node.left)
            right = depth(node.right)
            self.diameter = max(self.diameter, left + right)
            return 1 + max(left, right)

        depth(root)
        return self.diameter$PY$,
  $JS$var diameterOfBinaryTree = function(root) {
    var diameter = 0;
    function depth(node) {
        if (!node) return 0;
        var left = depth(node.left);
        var right = depth(node.right);
        diameter = Math.max(diameter, left + right);
        return 1 + Math.max(left, right);
    }
    depth(root);
    return diameter;
};$JS$,
  $JAVA$class Solution {
    private int diameter = 0;

    public int diameterOfBinaryTree(TreeNode root) {
        diameter = 0;
        depth(root);
        return diameter;
    }

    private int depth(TreeNode node) {
        if (node == null) return 0;
        int left = depth(node.left);
        int right = depth(node.right);
        diameter = Math.max(diameter, left + right);
        return 1 + Math.max(left, right);
    }
}$JAVA$,
  'O(n)', 'O(h) where h is tree height'
);

-- ============================================================
-- TREES: 6. balanced-binary-tree (Easy, LeetCode 110)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'balanced-binary-tree', 'trees', 'Balanced Binary Tree', 'Easy',
  $DESC$<p>Given a binary tree, determine if it is <strong>height-balanced</strong>.</p>
<p>A <strong>height-balanced</strong> binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [3,9,20,null,null,15,7]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [1,2,2,3,3,null,null,4,4]
Output: false</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: root = []
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is in the range <code>[0, 5000]</code>.</li>
<li><code>-10<sup>4</sup> &lt;= Node.val &lt;= 10<sup>4</sup></code></li>
</ul>$DESC$,
  '', ARRAY['A tree is balanced if every subtree is balanced AND the height difference between left and right is at most 1.', 'Use a bottom-up approach: compute height while checking balance in one pass.', 'Return -1 from the height function to indicate an unbalanced subtree, short-circuiting further checks.'],
  '200', 'https://leetcode.com/problems/balanced-binary-tree/',
  'isBalanced', '[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb, 'bool',
  '[{"inputs":["[3,9,20,null,null,15,7]"],"expected":"true"},{"inputs":["[1,2,2,3,3,null,null,4,4]"],"expected":"false"},{"inputs":["[]"],"expected":"true"},{"inputs":["[1]"],"expected":"true"},{"inputs":["[1,2,3]"],"expected":"true"},{"inputs":["[1,2,null,3]"],"expected":"true"},{"inputs":["[1,2,null,3,null,4]"],"expected":"false"},{"inputs":["[1,null,2,null,3]"],"expected":"false"},{"inputs":["[1,2,3,4,5,6,7]"],"expected":"true"},{"inputs":["[1,2,2,3,null,null,3,4,null,null,4]"],"expected":"false"},{"inputs":["[1,2,3,4,5,null,6,7]"],"expected":"true"},{"inputs":["[5,3,8,1,4,7,9]"],"expected":"true"},{"inputs":["[1,2,3,4,null,null,null,5]"],"expected":"false"},{"inputs":["[10,5,15,3,7,null,20]"],"expected":"true"},{"inputs":["[1,null,2,null,3,null,4,null,5]"],"expected":"false"},{"inputs":["[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'balanced-binary-tree', 1, 'Bottom-Up DFS',
  'We check balance bottom-up by computing the height of each subtree. If at any point the height difference exceeds 1, we return -1 to signal the tree is unbalanced. This avoids redundant height calculations.',
  '["Define a height function that returns -1 if unbalanced, or the height otherwise.","For a null node, return 0.","Recursively compute left height and right height.","If either returns -1, propagate -1 (unbalanced).","If abs(leftHeight - rightHeight) > 1, return -1.","Otherwise return 1 + max(leftHeight, rightHeight).","The tree is balanced if the final result is not -1."]'::jsonb,
  $PY$class Solution:
    def isBalanced(self, root) -> bool:
        def height(node):
            if not node:
                return 0
            left = height(node.left)
            if left == -1:
                return -1
            right = height(node.right)
            if right == -1:
                return -1
            if abs(left - right) > 1:
                return -1
            return 1 + max(left, right)

        return height(root) != -1$PY$,
  $JS$var isBalanced = function(root) {
    function height(node) {
        if (!node) return 0;
        var left = height(node.left);
        if (left === -1) return -1;
        var right = height(node.right);
        if (right === -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }
    return height(root) !== -1;
};$JS$,
  $JAVA$class Solution {
    public boolean isBalanced(TreeNode root) {
        return height(root) != -1;
    }

    private int height(TreeNode node) {
        if (node == null) return 0;
        int left = height(node.left);
        if (left == -1) return -1;
        int right = height(node.right);
        if (right == -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }
}$JAVA$,
  'O(n)', 'O(h) where h is tree height'
);

-- ============================================================
-- TREES: 7. lowest-common-ancestor (Medium, LeetCode 236)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'lowest-common-ancestor', 'trees', 'Lowest Common Ancestor of a Binary Tree', 'Medium',
  $DESC$<p>Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.</p>
<p>According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes <code>p</code> and <code>q</code> as the lowest node in <code>T</code> that has both <code>p</code> and <code>q</code> as descendants (where we allow <strong>a node to be a descendant of itself</strong>)."</p>
<p>In this version, <code>p</code> and <code>q</code> are given as integer values, and you return the value of the LCA node.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
Output: 3
Explanation: The LCA of nodes 5 and 1 is 3.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
Output: 5
Explanation: The LCA of nodes 5 and 4 is 5, since a node can be a descendant of itself.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: root = [1,2], p = 1, q = 2
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li>The number of nodes in the tree is in the range <code>[2, 10<sup>5</sup>]</code>.</li>
<li>All <code>Node.val</code> are <strong>unique</strong>.</li>
<li><code>p != q</code></li>
<li><code>p</code> and <code>q</code> will exist in the tree.</li>
</ul>$DESC$,
  '', ARRAY['If the current node equals p or q, it could be the LCA.', 'Recursively search left and right subtrees. If both return a non-null result, the current node is the LCA.', 'If only one side returns a result, propagate that result upward.'],
  '200', 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
  'lowestCommonAncestor', '[{"name":"root","type":"Optional[TreeNode]"},{"name":"p","type":"int"},{"name":"q","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","5","1"],"expected":"3"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","5","4"],"expected":"5"},{"inputs":["[1,2]","1","2"],"expected":"1"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","6","4"],"expected":"5"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","7","8"],"expected":"3"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","0","8"],"expected":"1"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","6","2"],"expected":"5"},{"inputs":["[3,5,1,6,2,0,8,null,null,7,4]","7","2"],"expected":"2"},{"inputs":["[1,2,3]","2","3"],"expected":"1"},{"inputs":["[1,2,3,4,5]","4","5"],"expected":"2"},{"inputs":["[1,2,3,4,5]","2","5"],"expected":"2"},{"inputs":["[5,3,8,1,4,7,9]","1","4"],"expected":"3"},{"inputs":["[5,3,8,1,4,7,9]","7","9"],"expected":"8"},{"inputs":["[5,3,8,1,4,7,9]","1","9"],"expected":"5"},{"inputs":["[5,3,8,1,4,7,9]","3","8"],"expected":"5"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'lowest-common-ancestor', 1, 'Recursive DFS',
  'We search the tree recursively. If a node matches p or q, we return it. If both left and right subtrees return non-null, this node is the LCA. Otherwise, we propagate whichever side found something. Since our driver passes integer values instead of node references, we compare node values to p and q.',
  '["If node is null, return null.","If node.val equals p or q, return node.","Recursively search the left subtree.","Recursively search the right subtree.","If both left and right are non-null, current node is the LCA — return its value.","Otherwise return whichever is non-null.","The final answer is the value of the returned node."]'::jsonb,
  $PY$class Solution:
    def lowestCommonAncestor(self, root, p: int, q: int) -> int:
        def dfs(node):
            if not node:
                return None
            if node.val == p or node.val == q:
                return node
            left = dfs(node.left)
            right = dfs(node.right)
            if left and right:
                return node
            return left if left else right

        return dfs(root).val$PY$,
  $JS$var lowestCommonAncestor = function(root, p, q) {
    function dfs(node) {
        if (!node) return null;
        if (node.val === p || node.val === q) return node;
        var left = dfs(node.left);
        var right = dfs(node.right);
        if (left && right) return node;
        return left ? left : right;
    }
    return dfs(root).val;
};$JS$,
  $JAVA$class Solution {
    public int lowestCommonAncestor(TreeNode root, int p, int q) {
        return dfs(root, p, q).val;
    }

    private TreeNode dfs(TreeNode node, int p, int q) {
        if (node == null) return null;
        if (node.val == p || node.val == q) return node;
        TreeNode left = dfs(node.left, p, q);
        TreeNode right = dfs(node.right, p, q);
        if (left != null && right != null) return node;
        return left != null ? left : right;
    }
}$JAVA$,
  'O(n)', 'O(h) where h is tree height'
);

-- ============================================================
-- GRAPHS: 8. walls-and-gates (Medium, LeetCode 286)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'walls-and-gates', 'graphs', 'Walls and Gates', 'Medium',
  $DESC$<p>You are given an <code>m x n</code> grid <code>rooms</code> initialized with these three possible values:</p>
<ul>
<li><code>-1</code> — A wall or an obstacle.</li>
<li><code>0</code> — A gate.</li>
<li><code>2147483647</code> — Infinity, meaning an empty room.</li>
</ul>
<p>Fill each empty room with the distance to its <strong>nearest gate</strong>. If it is impossible to reach a gate, leave it as <code>2147483647</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]
Output: [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: rooms = [[-1]]
Output: [[-1]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>m == rooms.length</code></li>
<li><code>n == rooms[i].length</code></li>
<li><code>1 &lt;= m, n &lt;= 250</code></li>
<li><code>rooms[i][j]</code> is <code>-1</code>, <code>0</code>, or <code>2147483647</code>.</li>
</ul>$DESC$,
  '', ARRAY['Instead of BFS from each empty room to find the nearest gate, think about starting BFS from all gates simultaneously.', 'Multi-source BFS: add all gate positions to the queue initially, then expand outward layer by layer.', 'Each cell is visited at most once, giving O(m*n) time.'],
  '200', 'https://leetcode.com/problems/walls-and-gates/',
  'wallsAndGates', '[{"name":"rooms","type":"List[List[int]]"}]'::jsonb, 'List[List[int]]',
  '[{"inputs":["[[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]"],"expected":"[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]"},{"inputs":["[[-1]]"],"expected":"[[-1]]"},{"inputs":["[[0]]"],"expected":"[[0]]"},{"inputs":["[[2147483647]]"],"expected":"[[2147483647]]"},{"inputs":["[[0,2147483647]]"],"expected":"[[0,1]]"},{"inputs":["[[0,-1,2147483647]]"],"expected":"[[0,-1,2147483647]]"},{"inputs":["[[0,2147483647,2147483647,0]]"],"expected":"[[0,1,1,0]]"},{"inputs":["[[0],[2147483647],[2147483647],[0]]"],"expected":"[[0],[1],[1],[0]]"},{"inputs":["[[2147483647,0],[0,2147483647]]"],"expected":"[[1,0],[0,1]]"},{"inputs":["[[0,2147483647,2147483647],[2147483647,2147483647,2147483647],[2147483647,2147483647,0]]"],"expected":"[[0,1,2],[1,2,1],[2,1,0]]"},{"inputs":["[[0,-1],[2147483647,2147483647]]"],"expected":"[[0,-1],[1,2]]"},{"inputs":["[[-1,-1],[-1,-1]]"],"expected":"[[-1,-1],[-1,-1]]"},{"inputs":["[[0,0],[0,0]]"],"expected":"[[0,0],[0,0]]"},{"inputs":["[[2147483647,-1,0],[2147483647,-1,2147483647],[0,2147483647,2147483647]]"],"expected":"[[2,-1,0],[1,-1,1],[0,1,2]]"},{"inputs":["[[0,2147483647,-1,2147483647,0]]"],"expected":"[[0,1,-1,1,0]]"},{"inputs":["[[2147483647,2147483647,2147483647],[2147483647,0,2147483647],[2147483647,2147483647,2147483647]]"],"expected":"[[2,1,2],[1,0,1],[2,1,2]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'walls-and-gates', 1, 'Multi-Source BFS',
  'Instead of doing BFS from each empty room (which would be slow), we start BFS from all gates at once. This way, the first time we reach an empty room, it is guaranteed to be the shortest distance from any gate.',
  '["Scan the grid and add all gate positions (value 0) to a queue.","Perform BFS: for each cell in the queue, check all 4 neighbors.","If a neighbor is an empty room (value 2147483647), update its distance to current + 1 and add to queue.","Walls (-1) and already-visited cells are skipped.","Return the modified grid."]'::jsonb,
  $PY$from collections import deque

class Solution:
    def wallsAndGates(self, rooms):
        if not rooms:
            return rooms
        m, n = len(rooms), len(rooms[0])
        queue = deque()
        for i in range(m):
            for j in range(n):
                if rooms[i][j] == 0:
                    queue.append((i, j))
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        while queue:
            r, c = queue.popleft()
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if 0 <= nr < m and 0 <= nc < n and rooms[nr][nc] == 2147483647:
                    rooms[nr][nc] = rooms[r][c] + 1
                    queue.append((nr, nc))
        return rooms$PY$,
  $JS$var wallsAndGates = function(rooms) {
    if (!rooms.length) return rooms;
    var m = rooms.length, n = rooms[0].length;
    var queue = [];
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            if (rooms[i][j] === 0) queue.push([i, j]);
        }
    }
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    while (queue.length > 0) {
        var cell = queue.shift();
        var r = cell[0], c = cell[1];
        for (var d = 0; d < 4; d++) {
            var nr = r + dirs[d][0], nc = c + dirs[d][1];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && rooms[nr][nc] === 2147483647) {
                rooms[nr][nc] = rooms[r][c] + 1;
                queue.push([nr, nc]);
            }
        }
    }
    return rooms;
};$JS$,
  $JAVA$class Solution {
    public int[][] wallsAndGates(int[][] rooms) {
        int m = rooms.length, n = rooms[0].length;
        java.util.Queue<int[]> queue = new java.util.LinkedList<>();
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (rooms[i][j] == 0) queue.offer(new int[]{i, j});
            }
        }
        int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && rooms[nr][nc] == 2147483647) {
                    rooms[nr][nc] = rooms[r][c] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return rooms;
    }
}$JAVA$,
  'O(m * n)', 'O(m * n)'
);

-- ============================================================
-- GRAPHS: 9. graph-valid-tree (Medium, LeetCode 261)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'graph-valid-tree', 'graphs', 'Graph Valid Tree', 'Medium',
  $DESC$<p>You have a graph of <code>n</code> nodes labeled from <code>0</code> to <code>n - 1</code>. You are given an integer <code>n</code> and a list of <code>edges</code> where <code>edges[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> indicates that there is an undirected edge between nodes <code>a<sub>i</sub></code> and <code>b<sub>i</sub></code> in the graph.</p>
<p>Return <code>true</code> if the edges of the given graph make up a valid tree, and <code>false</code> otherwise.</p>
<p>A valid tree has exactly <code>n - 1</code> edges and is fully connected (no cycles).</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= n &lt;= 2000</code></li>
<li><code>0 &lt;= edges.length &lt;= 5000</code></li>
<li><code>edges[i].length == 2</code></li>
<li><code>0 &lt;= a<sub>i</sub>, b<sub>i</sub> &lt; n</code></li>
</ul>$DESC$,
  '', ARRAY['A tree with n nodes must have exactly n - 1 edges.', 'If there are n - 1 edges and the graph is connected, it must be a tree (no cycles).', 'Use Union-Find: if adding an edge connects two nodes already in the same set, there is a cycle.'],
  '200', 'https://leetcode.com/problems/graph-valid-tree/',
  'validTree', '[{"name":"n","type":"int"},{"name":"edges","type":"List[List[int]]"}]'::jsonb, 'bool',
  '[{"inputs":["5","[[0,1],[0,2],[0,3],[1,4]]"],"expected":"true"},{"inputs":["5","[[0,1],[1,2],[2,3],[1,3],[1,4]]"],"expected":"false"},{"inputs":["1","[]"],"expected":"true"},{"inputs":["2","[[0,1]]"],"expected":"true"},{"inputs":["2","[]"],"expected":"false"},{"inputs":["4","[[0,1],[2,3]]"],"expected":"false"},{"inputs":["4","[[0,1],[1,2],[2,3]]"],"expected":"true"},{"inputs":["3","[[0,1],[1,2],[0,2]]"],"expected":"false"},{"inputs":["5","[[0,1],[0,2],[0,3],[0,4]]"],"expected":"true"},{"inputs":["6","[[0,1],[1,2],[2,3],[3,4],[4,5]]"],"expected":"true"},{"inputs":["6","[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]"],"expected":"false"},{"inputs":["3","[[0,1],[0,2]]"],"expected":"true"},{"inputs":["4","[[0,1],[0,2],[0,3]]"],"expected":"true"},{"inputs":["7","[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]"],"expected":"true"},{"inputs":["4","[[0,1],[1,2],[2,0],[2,3]]"],"expected":"false"},{"inputs":["5","[[0,1],[0,2],[1,3],[2,4]]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'graph-valid-tree', 1, 'Union-Find',
  'A valid tree has exactly n-1 edges and no cycles. We use Union-Find to detect cycles: if we try to union two nodes that already share the same root, we have a cycle. We also check the edge count.',
  '["If edges count != n - 1, return false (must have exactly n-1 edges for a tree).","Initialize parent array where parent[i] = i.","For each edge, find the roots of both nodes.","If they share the same root, a cycle exists — return false.","Otherwise, union them.","If we process all edges without finding a cycle, return true."]'::jsonb,
  $PY$class Solution:
    def validTree(self, n: int, edges) -> bool:
        if len(edges) != n - 1:
            return False
        parent = list(range(n))
        rank = [0] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(x, y):
            px, py = find(x), find(y)
            if px == py:
                return False
            if rank[px] < rank[py]:
                px, py = py, px
            parent[py] = px
            if rank[px] == rank[py]:
                rank[px] += 1
            return True

        for a, b in edges:
            if not union(a, b):
                return False
        return True$PY$,
  $JS$var validTree = function(n, edges) {
    if (edges.length !== n - 1) return false;
    var parent = Array.from({length: n}, (_, i) => i);
    var rank = new Array(n).fill(0);
    function find(x) {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    for (var i = 0; i < edges.length; i++) {
        var px = find(edges[i][0]), py = find(edges[i][1]);
        if (px === py) return false;
        if (rank[px] < rank[py]) { var tmp = px; px = py; py = tmp; }
        parent[py] = px;
        if (rank[px] === rank[py]) rank[px]++;
    }
    return true;
};$JS$,
  $JAVA$class Solution {
    private int[] parent, rank;

    public boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] edge : edges) {
            if (!union(edge[0], edge[1])) return false;
        }
        return true;
    }

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    private boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { int tmp = px; px = py; py = tmp; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}$JAVA$,
  'O(n * alpha(n)) ≈ O(n)', 'O(n)'
);

-- ============================================================
-- GRAPHS: 10. connected-components (Medium, LeetCode 323)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'connected-components', 'graphs', 'Number of Connected Components in an Undirected Graph', 'Medium',
  $DESC$<p>You have a graph of <code>n</code> nodes. You are given an integer <code>n</code> and an array <code>edges</code> where <code>edges[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> indicates that there is an edge between <code>a<sub>i</sub></code> and <code>b<sub>i</sub></code> in the graph.</p>
<p>Return the number of connected components in the graph.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 5, edges = [[0,1],[1,2],[3,4]]
Output: 2</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= n &lt;= 2000</code></li>
<li><code>0 &lt;= edges.length &lt;= 5000</code></li>
<li><code>edges[i].length == 2</code></li>
<li><code>0 &lt;= a<sub>i</sub>, b<sub>i</sub> &lt; n</code></li>
</ul>$DESC$,
  '', ARRAY['Think of each node as its own component initially.', 'Each edge merges two components into one. Use Union-Find to track this.', 'The answer is n minus the number of successful unions (each union reduces components by 1).'],
  '200', 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/',
  'countComponents', '[{"name":"n","type":"int"},{"name":"edges","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["5","[[0,1],[1,2],[3,4]]"],"expected":"2"},{"inputs":["5","[[0,1],[1,2],[2,3],[3,4]]"],"expected":"1"},{"inputs":["1","[]"],"expected":"1"},{"inputs":["4","[]"],"expected":"4"},{"inputs":["3","[[0,1],[1,2]]"],"expected":"1"},{"inputs":["5","[[0,1],[2,3]]"],"expected":"3"},{"inputs":["6","[[0,1],[2,3],[4,5]]"],"expected":"3"},{"inputs":["4","[[0,1],[0,2],[0,3]]"],"expected":"1"},{"inputs":["6","[[0,1],[1,2],[3,4],[4,5],[2,3]]"],"expected":"1"},{"inputs":["7","[[0,1],[2,3],[4,5]]"],"expected":"4"},{"inputs":["3","[[0,1],[0,2],[1,2]]"],"expected":"1"},{"inputs":["2","[[0,1]]"],"expected":"1"},{"inputs":["2","[]"],"expected":"2"},{"inputs":["8","[[0,1],[2,3],[4,5],[6,7]]"],"expected":"4"},{"inputs":["8","[[0,1],[2,3],[4,5],[6,7],[1,2],[5,6]]"],"expected":"2"},{"inputs":["5","[[0,1],[0,2],[0,3],[0,4]]"],"expected":"1"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'connected-components', 1, 'Union-Find',
  'Initially each node is its own component (count = n). For each edge, we union the two nodes. Each successful union (where the nodes had different roots) reduces the component count by 1.',
  '["Initialize parent array where parent[i] = i, and components = n.","For each edge [a, b]:","  Find roots of a and b.","  If different roots, union them and decrement components.","Return components."]'::jsonb,
  $PY$class Solution:
    def countComponents(self, n: int, edges) -> int:
        parent = list(range(n))
        rank = [0] * n
        components = n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in edges:
            pa, pb = find(a), find(b)
            if pa != pb:
                if rank[pa] < rank[pb]:
                    pa, pb = pb, pa
                parent[pb] = pa
                if rank[pa] == rank[pb]:
                    rank[pa] += 1
                components -= 1

        return components$PY$,
  $JS$var countComponents = function(n, edges) {
    var parent = Array.from({length: n}, (_, i) => i);
    var rank = new Array(n).fill(0);
    var components = n;
    function find(x) {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    for (var i = 0; i < edges.length; i++) {
        var pa = find(edges[i][0]), pb = find(edges[i][1]);
        if (pa !== pb) {
            if (rank[pa] < rank[pb]) { var tmp = pa; pa = pb; pb = tmp; }
            parent[pb] = pa;
            if (rank[pa] === rank[pb]) rank[pa]++;
            components--;
        }
    }
    return components;
};$JS$,
  $JAVA$class Solution {
    private int[] parent, rank;

    public int countComponents(int n, int[][] edges) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int components = n;
        for (int[] edge : edges) {
            int pa = find(edge[0]), pb = find(edge[1]);
            if (pa != pb) {
                if (rank[pa] < rank[pb]) { int tmp = pa; pa = pb; pb = tmp; }
                parent[pb] = pa;
                if (rank[pa] == rank[pb]) rank[pa]++;
                components--;
            }
        }
        return components;
    }

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
}$JAVA$,
  'O(n + E * alpha(n)) ≈ O(n + E)', 'O(n)'
);

-- ============================================================
-- GRAPHS: 11. redundant-connection (Medium, LeetCode 684)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'redundant-connection', 'graphs', 'Redundant Connection', 'Medium',
  $DESC$<p>In this problem, a tree is an <strong>undirected graph</strong> that is connected and has no cycles.</p>
<p>You are given a graph that started as a tree with <code>n</code> nodes labeled from <code>1</code> to <code>n</code>, with one additional edge added. The added edge has two <strong>different</strong> vertices chosen from <code>1</code> to <code>n</code>, and was not an edge that already existed.</p>
<p>The graph is given as an array <code>edges</code> of length <code>n</code> where <code>edges[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> indicates that there is an edge between nodes <code>a<sub>i</sub></code> and <code>b<sub>i</sub></code> in the graph.</p>
<p>Return an edge that can be removed so that the resulting graph is a tree of <code>n</code> nodes. If there are multiple answers, return the answer that occurs <strong>last</strong> in the input.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: edges = [[1,2],[1,3],[2,3]]
Output: [2,3]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>n == edges.length</code></li>
<li><code>3 &lt;= n &lt;= 1000</code></li>
<li><code>edges[i].length == 2</code></li>
<li><code>1 &lt;= a<sub>i</sub> &lt; b<sub>i</sub> &lt;= edges.length</code></li>
</ul>$DESC$,
  '', ARRAY['A tree with n nodes has exactly n - 1 edges. We have n edges, so one is redundant.', 'Process edges one by one with Union-Find. The first edge that connects two already-connected nodes is the redundant edge.', 'Since we process in order, the last such edge in input order is returned naturally.'],
  '200', 'https://leetcode.com/problems/redundant-connection/',
  'findRedundantConnection', '[{"name":"edges","type":"List[List[int]]"}]'::jsonb, 'List[int]',
  '[{"inputs":["[[1,2],[1,3],[2,3]]"],"expected":"[2,3]"},{"inputs":["[[1,2],[2,3],[3,4],[1,4],[1,5]]"],"expected":"[1,4]"},{"inputs":["[[1,2],[2,3],[1,3]]"],"expected":"[1,3]"},{"inputs":["[[1,2],[1,3],[1,4],[3,4]]"],"expected":"[3,4]"},{"inputs":["[[1,2],[2,3],[3,4],[4,5],[5,1]]"],"expected":"[5,1]"},{"inputs":["[[1,3],[3,4],[1,2],[2,4]]"],"expected":"[2,4]"},{"inputs":["[[1,2],[3,4],[1,3],[2,4]]"],"expected":"[2,4]"},{"inputs":["[[1,4],[1,2],[2,3],[3,4]]"],"expected":"[3,4]"},{"inputs":["[[1,2],[2,3],[3,1],[4,3]]"],"expected":"[3,1]"},{"inputs":["[[3,4],[1,2],[2,4],[3,5],[2,3]]"],"expected":"[2,3]"},{"inputs":["[[1,5],[3,4],[3,5],[4,5],[2,4]]"],"expected":"[4,5]"},{"inputs":["[[1,2],[2,3],[3,4],[4,1],[5,3]]"],"expected":"[4,1]"},{"inputs":["[[2,3],[1,2],[1,3]]"],"expected":"[1,3]"},{"inputs":["[[1,2],[2,3],[3,4],[4,5],[3,5]]"],"expected":"[3,5]"},{"inputs":["[[1,2],[1,3],[2,3],[3,4]]"],"expected":"[2,3]"},{"inputs":["[[1,2],[1,3],[3,4],[2,4],[4,5]]"],"expected":"[2,4]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'redundant-connection', 1, 'Union-Find',
  'We process edges in order and use Union-Find. The first time we try to union two nodes that are already connected (same root), that edge is the one creating the cycle — the redundant connection.',
  '["Initialize parent array for nodes 1 to n.","For each edge [a, b] in order:","  Find roots of a and b.","  If same root, this edge creates a cycle — return it.","  Otherwise, union the two nodes."]'::jsonb,
  $PY$class Solution:
    def findRedundantConnection(self, edges):
        n = len(edges)
        parent = list(range(n + 1))
        rank = [0] * (n + 1)

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in edges:
            pa, pb = find(a), find(b)
            if pa == pb:
                return [a, b]
            if rank[pa] < rank[pb]:
                pa, pb = pb, pa
            parent[pb] = pa
            if rank[pa] == rank[pb]:
                rank[pa] += 1
        return []$PY$,
  $JS$var findRedundantConnection = function(edges) {
    var n = edges.length;
    var parent = Array.from({length: n + 1}, (_, i) => i);
    var rank = new Array(n + 1).fill(0);
    function find(x) {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    for (var i = 0; i < edges.length; i++) {
        var a = edges[i][0], b = edges[i][1];
        var pa = find(a), pb = find(b);
        if (pa === pb) return [a, b];
        if (rank[pa] < rank[pb]) { var tmp = pa; pa = pb; pb = tmp; }
        parent[pb] = pa;
        if (rank[pa] === rank[pb]) rank[pa]++;
    }
    return [];
};$JS$,
  $JAVA$class Solution {
    private int[] parent, rank;

    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        parent = new int[n + 1];
        rank = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        for (int[] edge : edges) {
            int pa = find(edge[0]), pb = find(edge[1]);
            if (pa == pb) return edge;
            if (rank[pa] < rank[pb]) { int tmp = pa; pa = pb; pb = tmp; }
            parent[pb] = pa;
            if (rank[pa] == rank[pb]) rank[pa]++;
        }
        return new int[]{};
    }

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
}$JAVA$,
  'O(n * alpha(n)) ≈ O(n)', 'O(n)'
);

-- ============================================================
-- GRAPHS: 12. word-ladder (Hard, LeetCode 127)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'word-ladder', 'graphs', 'Word Ladder', 'Hard',
  $DESC$<p>A <strong>transformation sequence</strong> from word <code>beginWord</code> to word <code>endWord</code> using a dictionary <code>wordList</code> is a sequence of words <code>beginWord -&gt; s<sub>1</sub> -&gt; s<sub>2</sub> -&gt; ... -&gt; s<sub>k</sub></code> such that:</p>
<ul>
<li>Every adjacent pair of words differs by a single letter.</li>
<li>Every <code>s<sub>i</sub></code> for <code>1 &lt;= i &lt;= k</code> is in <code>wordList</code>. Note that <code>beginWord</code> does not need to be in <code>wordList</code>.</li>
<li><code>s<sub>k</sub> == endWord</code></li>
</ul>
<p>Given two words, <code>beginWord</code> and <code>endWord</code>, and a dictionary <code>wordList</code>, return the <strong>number of words</strong> in the <strong>shortest transformation sequence</strong> from <code>beginWord</code> to <code>endWord</code>, or <code>0</code> if no such sequence exists.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Explanation: One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]
Output: 0
Explanation: The endWord "cog" is not in wordList, therefore there is no valid transformation sequence.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= beginWord.length &lt;= 10</code></li>
<li><code>endWord.length == beginWord.length</code></li>
<li><code>1 &lt;= wordList.length &lt;= 5000</code></li>
<li><code>wordList[i].length == beginWord.length</code></li>
<li><code>beginWord</code>, <code>endWord</code>, and <code>wordList[i]</code> consist of lowercase English letters.</li>
<li><code>beginWord != endWord</code></li>
<li>All the words in <code>wordList</code> are <strong>unique</strong>.</li>
</ul>$DESC$,
  '', ARRAY['Model this as a graph problem where words are nodes and edges connect words that differ by one letter.', 'Use BFS from beginWord. At each step, try changing each character to every letter a-z and check if the result is in wordList.', 'Use a set for wordList for O(1) lookups, and remove visited words to avoid cycles.'],
  '200', 'https://leetcode.com/problems/word-ladder/',
  'ladderLength', '[{"name":"beginWord","type":"str"},{"name":"endWord","type":"str"},{"name":"wordList","type":"List[str]"}]'::jsonb, 'int',
  '[{"inputs":["\"hit\"","\"cog\"","[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]"],"expected":"5"},{"inputs":["\"hit\"","\"cog\"","[\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]"],"expected":"0"},{"inputs":["\"a\"","\"c\"","[\"a\",\"b\",\"c\"]"],"expected":"2"},{"inputs":["\"hot\"","\"dog\"","[\"hot\",\"dog\"]"],"expected":"0"},{"inputs":["\"hot\"","\"dog\"","[\"hot\",\"dog\",\"dot\"]"],"expected":"3"},{"inputs":["\"hit\"","\"hot\"","[\"hot\"]"],"expected":"2"},{"inputs":["\"ab\"","\"ba\"","[\"bb\",\"ba\"]"],"expected":"3"},{"inputs":["\"aa\"","\"bb\"","[\"ab\",\"bb\"]"],"expected":"3"},{"inputs":["\"abc\"","\"def\"","[\"dbc\",\"dec\",\"def\"]"],"expected":"4"},{"inputs":["\"cat\"","\"dog\"","[\"cot\",\"dot\",\"dog\"]"],"expected":"4"},{"inputs":["\"cat\"","\"dog\"","[\"bat\",\"bot\",\"dog\"]"],"expected":"0"},{"inputs":["\"leet\"","\"code\"","[\"lest\",\"lose\",\"code\",\"lode\",\"robe\",\"lost\"]"],"expected":"6"},{"inputs":["\"talk\"","\"tail\"","[\"tall\",\"tail\"]"],"expected":"3"},{"inputs":["\"most\"","\"best\"","[\"mist\",\"bist\",\"best\"]"],"expected":"4"},{"inputs":["\"game\"","\"code\"","[\"came\",\"come\",\"code\"]"],"expected":"4"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'word-ladder', 1, 'BFS',
  'We treat each word as a node in a graph. Two words are connected if they differ by exactly one letter. BFS from beginWord finds the shortest path to endWord. We try all 26 letter substitutions at each position and check membership in a set.',
  '["Put all words from wordList into a set for O(1) lookup.","If endWord is not in the set, return 0.","Initialize BFS queue with (beginWord, 1).","While queue is not empty:","  Dequeue word and current length.","  For each position in the word, try replacing with each letter a-z.","  If the new word equals endWord, return length + 1.","  If the new word is in the set, add to queue and remove from set.","Return 0 if endWord was never reached."]'::jsonb,
  $PY$from collections import deque

class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList) -> int:
        word_set = set(wordList)
        if endWord not in word_set:
            return 0
        queue = deque([(beginWord, 1)])
        visited = {beginWord}
        while queue:
            word, length = queue.popleft()
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    next_word = word[:i] + c + word[i+1:]
                    if next_word == endWord:
                        return length + 1
                    if next_word in word_set and next_word not in visited:
                        visited.add(next_word)
                        queue.append((next_word, length + 1))
        return 0$PY$,
  $JS$var ladderLength = function(beginWord, endWord, wordList) {
    var wordSet = new Set(wordList);
    if (!wordSet.has(endWord)) return 0;
    var queue = [[beginWord, 1]];
    var visited = new Set([beginWord]);
    while (queue.length > 0) {
        var item = queue.shift();
        var word = item[0], length = item[1];
        for (var i = 0; i < word.length; i++) {
            for (var c = 97; c <= 122; c++) {
                var nextWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
                if (nextWord === endWord) return length + 1;
                if (wordSet.has(nextWord) && !visited.has(nextWord)) {
                    visited.add(nextWord);
                    queue.push([nextWord, length + 1]);
                }
            }
        }
    }
    return 0;
};$JS$,
  $JAVA$class Solution {
    public int ladderLength(String beginWord, String endWord, java.util.List<String> wordList) {
        java.util.Set<String> wordSet = new java.util.HashSet<>(wordList);
        if (!wordSet.contains(endWord)) return 0;
        java.util.Queue<String> queue = new java.util.LinkedList<>();
        queue.offer(beginWord);
        java.util.Set<String> visited = new java.util.HashSet<>();
        visited.add(beginWord);
        int length = 1;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int s = 0; s < size; s++) {
                String word = queue.poll();
                char[] chars = word.toCharArray();
                for (int i = 0; i < chars.length; i++) {
                    char original = chars[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[i] = c;
                        String nextWord = new String(chars);
                        if (nextWord.equals(endWord)) return length + 1;
                        if (wordSet.contains(nextWord) && !visited.contains(nextWord)) {
                            visited.add(nextWord);
                            queue.offer(nextWord);
                        }
                    }
                    chars[i] = original;
                }
            }
            length++;
        }
        return 0;
    }
}$JAVA$,
  'O(M^2 * N) where M is word length and N is wordList size', 'O(M * N)'
);

-- ============================================================
-- HEAP: 13. find-median-data-stream (Hard, LeetCode 295) — OPERATIONS PATTERN
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'find-median-data-stream', 'heap', 'Find Median from Data Stream', 'Hard',
  $DESC$<p>The <strong>median</strong> is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.</p>
<ul>
<li>For example, for <code>arr = [2,3,4]</code>, the median is <code>3</code>.</li>
<li>For example, for <code>arr = [2,3]</code>, the median is <code>(2 + 3) / 2 = 2.5</code>.</li>
</ul>
<p>Implement the MedianFinder class:</p>
<ul>
<li><code>MedianFinder()</code> initializes the MedianFinder object.</li>
<li><code>void addNum(int num)</code> adds the integer <code>num</code> from the data stream to the data structure.</li>
<li><code>double findMedian()</code> returns the median of all elements so far. Answers within <code>10<sup>-5</sup></code> of the actual answer will be accepted.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]
[[], [1], [2], [], [3], []]
Output:
[null, null, null, 1.5, null, 2.0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-10<sup>5</sup> &lt;= num &lt;= 10<sup>5</sup></code></li>
<li>There will be at least one element in the data structure before calling <code>findMedian</code>.</li>
<li>At most <code>5 * 10<sup>4</sup></code> calls will be made to <code>addNum</code> and <code>findMedian</code>.</li>
</ul>$DESC$,
  '', ARRAY['Use two heaps: a max-heap for the lower half and a min-heap for the upper half.', 'Always keep the heaps balanced: the max-heap can have at most one more element than the min-heap.', 'The median is either the top of the max-heap (odd total) or the average of both tops (even total).'],
  '200', 'https://leetcode.com/problems/find-median-from-data-stream/',
  'MedianFinder', '[{"name":"operations","type":"List[List]"}]'::jsonb, 'List',
  '[{"inputs":["[[\"MedianFinder\"],[\"addNum\",1],[\"addNum\",2],[\"findMedian\"],[\"addNum\",3],[\"findMedian\"]]"],"expected":"[null,null,null,1.5,null,2.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",6],[\"findMedian\"]]"],"expected":"[null,null,6.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",1],[\"addNum\",2],[\"findMedian\"]]"],"expected":"[null,null,null,1.5]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",3],[\"addNum\",1],[\"addNum\",2],[\"findMedian\"]]"],"expected":"[null,null,null,null,2.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",1],[\"findMedian\"],[\"addNum\",2],[\"findMedian\"],[\"addNum\",3],[\"findMedian\"]]"],"expected":"[null,null,1.0,null,1.5,null,2.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",-1],[\"addNum\",-2],[\"findMedian\"]]"],"expected":"[null,null,null,-1.5]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",5],[\"addNum\",3],[\"addNum\",8],[\"addNum\",1],[\"findMedian\"]]"],"expected":"[null,null,null,null,null,4.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",5],[\"addNum\",3],[\"addNum\",8],[\"addNum\",1],[\"addNum\",7],[\"findMedian\"]]"],"expected":"[null,null,null,null,null,null,5.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",10],[\"addNum\",20],[\"addNum\",30],[\"addNum\",40],[\"findMedian\"]]"],"expected":"[null,null,null,null,null,25.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",1],[\"addNum\",1],[\"addNum\",1],[\"findMedian\"]]"],"expected":"[null,null,null,null,1.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",100],[\"addNum\",-100],[\"findMedian\"]]"],"expected":"[null,null,null,0.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",2],[\"addNum\",3],[\"addNum\",4],[\"findMedian\"],[\"addNum\",5],[\"findMedian\"]]"],"expected":"[null,null,null,null,3.0,null,3.5]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",7],[\"addNum\",3],[\"addNum\",9],[\"addNum\",1],[\"addNum\",5],[\"findMedian\"],[\"addNum\",11],[\"findMedian\"]]"],"expected":"[null,null,null,null,null,null,5.0,null,6.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",4],[\"addNum\",4],[\"addNum\",4],[\"addNum\",4],[\"findMedian\"]]"],"expected":"[null,null,null,null,null,4.0]"},{"inputs":["[[\"MedianFinder\"],[\"addNum\",0],[\"findMedian\"],[\"addNum\",0],[\"findMedian\"]]"],"expected":"[null,null,0.0,null,0.0]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'find-median-data-stream', 1, 'Two Heaps',
  'We maintain two heaps: a max-heap (small) for the lower half and a min-heap (large) for the upper half. The max-heap stores negated values since Python only has a min-heap. We keep them balanced so that the median is always accessible from the tops of the heaps.',
  '["addNum: push to max-heap (small), then move the top of small to large.","If large has more elements than small, move top of large back to small.","This ensures small.size >= large.size and small.size - large.size <= 1.","findMedian: if sizes are equal, average of both tops. If small has one more, top of small."]'::jsonb,
  $PY$import heapq

class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap (negated)
        self.large = []  # min-heap

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0$PY$,
  $JS$var MedianFinder = function() {
    this.small = []; // max-heap (manual)
    this.large = []; // min-heap (manual)
};

MedianFinder.prototype._pushSmall = function(val) {
    this.small.push(val);
    var i = this.small.length - 1;
    while (i > 0) {
        var p = Math.floor((i - 1) / 2);
        if (this.small[p] < this.small[i]) {
            var tmp = this.small[p]; this.small[p] = this.small[i]; this.small[i] = tmp;
            i = p;
        } else break;
    }
};

MedianFinder.prototype._popSmall = function() {
    var val = this.small[0];
    var last = this.small.pop();
    if (this.small.length > 0) {
        this.small[0] = last;
        var i = 0;
        while (true) {
            var l = 2*i+1, r = 2*i+2, largest = i;
            if (l < this.small.length && this.small[l] > this.small[largest]) largest = l;
            if (r < this.small.length && this.small[r] > this.small[largest]) largest = r;
            if (largest !== i) {
                var tmp = this.small[i]; this.small[i] = this.small[largest]; this.small[largest] = tmp;
                i = largest;
            } else break;
        }
    }
    return val;
};

MedianFinder.prototype._pushLarge = function(val) {
    this.large.push(val);
    var i = this.large.length - 1;
    while (i > 0) {
        var p = Math.floor((i - 1) / 2);
        if (this.large[p] > this.large[i]) {
            var tmp = this.large[p]; this.large[p] = this.large[i]; this.large[i] = tmp;
            i = p;
        } else break;
    }
};

MedianFinder.prototype._popLarge = function() {
    var val = this.large[0];
    var last = this.large.pop();
    if (this.large.length > 0) {
        this.large[0] = last;
        var i = 0;
        while (true) {
            var l = 2*i+1, r = 2*i+2, smallest = i;
            if (l < this.large.length && this.large[l] < this.large[smallest]) smallest = l;
            if (r < this.large.length && this.large[r] < this.large[smallest]) smallest = r;
            if (smallest !== i) {
                var tmp = this.large[i]; this.large[i] = this.large[smallest]; this.large[smallest] = tmp;
                i = smallest;
            } else break;
        }
    }
    return val;
};

MedianFinder.prototype.addNum = function(num) {
    this._pushSmall(num);
    this._pushLarge(this._popSmall());
    if (this.large.length > this.small.length) {
        this._pushSmall(this._popLarge());
    }
};

MedianFinder.prototype.findMedian = function() {
    if (this.small.length > this.large.length) {
        return this.small[0];
    }
    return (this.small[0] + this.large[0]) / 2.0;
};$JS$,
  $JAVA$class MedianFinder {
    private java.util.PriorityQueue<Integer> small; // max-heap
    private java.util.PriorityQueue<Integer> large; // min-heap

    public MedianFinder() {
        small = new java.util.PriorityQueue<>(java.util.Collections.reverseOrder());
        large = new java.util.PriorityQueue<>();
    }

    public void addNum(int num) {
        small.offer(num);
        large.offer(small.poll());
        if (large.size() > small.size()) {
            small.offer(large.poll());
        }
    }

    public double findMedian() {
        if (small.size() > large.size()) {
            return (double) small.peek();
        }
        return (small.peek() + large.peek()) / 2.0;
    }
}$JAVA$,
  'O(log n) per addNum, O(1) per findMedian', 'O(n)'
);

-- ============================================================
-- HEAP: 14. top-k-frequent-words (Medium, LeetCode 692)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'top-k-frequent-words', 'heap', 'Top K Frequent Words', 'Medium',
  $DESC$<p>Given an array of strings <code>words</code> and an integer <code>k</code>, return the <code>k</code> most frequent strings.</p>
<p>Return the answer <strong>sorted</strong> by the frequency from highest to lowest. Sort the words with the same frequency by their <strong>lexicographical order</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: words = ["i","love","leetcode","i","love","coding"], k = 2
Output: ["i","love"]
Explanation: "i" and "love" are the two most frequent words. Note that "i" comes before "love" due to a lower alphabetical order.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: words = ["the","day","is","sunny","the","the","the","sunny","is","is"], k = 4
Output: ["the","is","sunny","day"]
Explanation: "the", "is", "sunny" and "day" are the four most frequent words, with the number of occurrence being 4, 3, 2 and 1 respectively.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= words.length &lt;= 500</code></li>
<li><code>1 &lt;= words[i].length &lt;= 10</code></li>
<li><code>words[i]</code> consists of lowercase English letters.</li>
<li><code>k</code> is in the range <code>[1, The number of unique words[i]]</code></li>
</ul>$DESC$,
  '', ARRAY['Count the frequency of each word using a hash map.', 'Sort by frequency descending, then by word ascending for ties.', 'Alternatively, use a heap of size k with custom comparator.'],
  '200', 'https://leetcode.com/problems/top-k-frequent-words/',
  'topKFrequent', '[{"name":"words","type":"List[str]"},{"name":"k","type":"int"}]'::jsonb, 'List[str]',
  '[{"inputs":["[\"i\",\"love\",\"leetcode\",\"i\",\"love\",\"coding\"]","2"],"expected":"[\"i\",\"love\"]"},{"inputs":["[\"the\",\"day\",\"is\",\"sunny\",\"the\",\"the\",\"the\",\"sunny\",\"is\",\"is\"]","4"],"expected":"[\"the\",\"is\",\"sunny\",\"day\"]"},{"inputs":["[\"a\"]","1"],"expected":"[\"a\"]"},{"inputs":["[\"a\",\"b\",\"c\"]","3"],"expected":"[\"a\",\"b\",\"c\"]"},{"inputs":["[\"a\",\"a\",\"b\",\"b\"]","1"],"expected":"[\"a\"]"},{"inputs":["[\"a\",\"a\",\"b\",\"b\"]","2"],"expected":"[\"a\",\"b\"]"},{"inputs":["[\"hello\",\"world\",\"hello\"]","1"],"expected":"[\"hello\"]"},{"inputs":["[\"z\",\"y\",\"x\",\"z\",\"y\",\"z\"]","2"],"expected":"[\"z\",\"y\"]"},{"inputs":["[\"aaa\",\"aa\",\"a\"]","1"],"expected":"[\"a\"]"},{"inputs":["[\"bob\",\"alice\",\"bob\",\"alice\",\"carl\"]","2"],"expected":"[\"alice\",\"bob\"]"},{"inputs":["[\"cat\",\"dog\",\"cat\",\"bird\",\"dog\",\"cat\"]","3"],"expected":"[\"cat\",\"dog\",\"bird\"]"},{"inputs":["[\"apple\",\"banana\",\"apple\",\"banana\",\"cherry\",\"cherry\"]","2"],"expected":"[\"apple\",\"banana\"]"},{"inputs":["[\"x\",\"x\",\"x\",\"y\",\"y\",\"z\"]","1"],"expected":"[\"x\"]"},{"inputs":["[\"one\",\"two\",\"three\",\"one\",\"two\",\"one\"]","2"],"expected":"[\"one\",\"two\"]"},{"inputs":["[\"plum\",\"plum\",\"grape\",\"grape\",\"kiwi\"]","3"],"expected":"[\"grape\",\"plum\",\"kiwi\"]"},{"inputs":["[\"m\",\"n\",\"o\",\"m\",\"n\",\"o\",\"m\"]","3"],"expected":"[\"m\",\"n\",\"o\"]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'top-k-frequent-words', 1, 'Sort by Frequency',
  'Count word frequencies, then sort by frequency (descending) and alphabetically (ascending) for ties. Return the first k words.',
  '["Count frequency of each word using a hash map.","Get unique words and sort them with custom comparator: higher frequency first, then alphabetical order.","Return the first k words from the sorted list."]'::jsonb,
  $PY$from collections import Counter

class Solution:
    def topKFrequent(self, words, k: int):
        count = Counter(words)
        candidates = sorted(count.keys(), key=lambda w: (-count[w], w))
        return candidates[:k]$PY$,
  $JS$var topKFrequent = function(words, k) {
    var count = {};
    for (var i = 0; i < words.length; i++) {
        count[words[i]] = (count[words[i]] || 0) + 1;
    }
    var candidates = Object.keys(count);
    candidates.sort(function(a, b) {
        if (count[b] !== count[a]) return count[b] - count[a];
        return a < b ? -1 : 1;
    });
    return candidates.slice(0, k);
};$JS$,
  $JAVA$class Solution {
    public java.util.List<String> topKFrequent(String[] words, int k) {
        java.util.Map<String, Integer> count = new java.util.HashMap<>();
        for (String w : words) {
            count.put(w, count.getOrDefault(w, 0) + 1);
        }
        java.util.List<String> candidates = new java.util.ArrayList<>(count.keySet());
        candidates.sort((a, b) -> {
            if (!count.get(a).equals(count.get(b))) return count.get(b) - count.get(a);
            return a.compareTo(b);
        });
        return candidates.subList(0, k);
    }
}$JAVA$,
  'O(n log n)', 'O(n)'
);

-- ============================================================
-- HEAP: 15. reorganize-string (Medium, LeetCode 767)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'reorganize-string', 'heap', 'Reorganize String', 'Medium',
  $DESC$<p>Given a string <code>s</code>, rearrange the characters of <code>s</code> so that any two adjacent characters are not the same.</p>
<p>Return <em>any possible rearrangement of</em> <code>s</code> or return <code>""</code> if not possible.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "aab"
Output: "aba"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "aaab"
Output: ""</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 500</code></li>
<li><code>s</code> consists of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['If any character appears more than (n+1)/2 times, it is impossible.', 'Use a max-heap. Always pick the most frequent character, but never the same as the previous one.', 'After picking a character, push the previous one back (if it still has count > 0).'],
  '200', 'https://leetcode.com/problems/reorganize-string/',
  'reorganizeString', '[{"name":"s","type":"str"}]'::jsonb, 'str',
  '[{"inputs":["\"aab\""],"expected":"\"aba\""},{"inputs":["\"aaab\""],"expected":"\"\""},{"inputs":["\"a\""],"expected":"\"a\""},{"inputs":["\"ab\""],"expected":"\"ab\""},{"inputs":["\"aabb\""],"expected":"\"abab\""},{"inputs":["\"aaabb\""],"expected":"\"ababa\""},{"inputs":["\"aaabbb\""],"expected":"\"ababab\""},{"inputs":["\"aaabbc\""],"expected":"\"ababac\""},{"inputs":["\"aabbcc\""],"expected":"\"abcabc\""},{"inputs":["\"aaaa\""],"expected":"\"\""},{"inputs":["\"abc\""],"expected":"\"abc\""},{"inputs":["\"aabbccdd\""],"expected":"\"abcdabcd\""},{"inputs":["\"aaabbbccc\""],"expected":"\"abcabcabc\""},{"inputs":["\"zzzab\""],"expected":"\"zazbz\""},{"inputs":["\"vvvlo\""],"expected":"\"vlvov\""},{"inputs":["\"xxyz\""],"expected":"\"xyxz\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'reorganize-string', 1, 'Greedy Max-Heap',
  'We use a max-heap to always place the most frequent character next. After placing a character, we hold it aside and push the previously held character back (if it still has remaining count). This ensures no two adjacent characters are the same.',
  '["Count frequency of each character.","If any character frequency > (n+1)/2, return empty string.","Push all (negative_count, char) into a max-heap (negated for Python min-heap).","Initialize prev = (0, '''') to track the previously placed character.","While heap is not empty: pop top, append its char to result, push prev back if count > 0, update prev.","Return the result string."]'::jsonb,
  $PY$import heapq
from collections import Counter

class Solution:
    def reorganizeString(self, s: str) -> str:
        count = Counter(s)
        if max(count.values()) > (len(s) + 1) // 2:
            return ""
        heap = [(-freq, ch) for ch, freq in count.items()]
        heapq.heapify(heap)
        result = []
        prev_freq, prev_ch = 0, ''
        while heap:
            freq, ch = heapq.heappop(heap)
            result.append(ch)
            if prev_freq < 0:
                heapq.heappush(heap, (prev_freq, prev_ch))
            prev_freq, prev_ch = freq + 1, ch
        return ''.join(result)$PY$,
  $JS$var reorganizeString = function(s) {
    var count = {};
    for (var i = 0; i < s.length; i++) {
        count[s[i]] = (count[s[i]] || 0) + 1;
    }
    var maxFreq = 0;
    for (var key in count) {
        if (count[key] > maxFreq) maxFreq = count[key];
    }
    if (maxFreq > Math.floor((s.length + 1) / 2)) return "";

    // Sort chars by frequency descending, then alphabetically
    var entries = Object.entries(count).sort(function(a, b) {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0] < b[0] ? -1 : 1;
    });

    // Place characters in even indices first, then odd
    var result = new Array(s.length);
    var idx = 0;
    for (var e = 0; e < entries.length; e++) {
        var ch = entries[e][0], freq = entries[e][1];
        for (var f = 0; f < freq; f++) {
            if (idx >= s.length) idx = 1;
            result[idx] = ch;
            idx += 2;
        }
    }
    return result.join('');
};$JS$,
  $JAVA$class Solution {
    public String reorganizeString(String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        int maxFreq = 0, maxChar = 0;
        for (int i = 0; i < 26; i++) {
            if (count[i] > maxFreq) {
                maxFreq = count[i];
                maxChar = i;
            }
        }
        if (maxFreq > (s.length() + 1) / 2) return "";

        char[] result = new char[s.length()];
        int idx = 0;

        // Place most frequent char first at even indices
        while (count[maxChar] > 0) {
            result[idx] = (char) ('a' + maxChar);
            idx += 2;
            count[maxChar]--;
        }

        // Place remaining chars
        for (int i = 0; i < 26; i++) {
            while (count[i] > 0) {
                if (idx >= s.length()) idx = 1;
                result[idx] = (char) ('a' + i);
                idx += 2;
                count[i]--;
            }
        }
        return new String(result);
    }
}$JAVA$,
  'O(n log k) where k is unique characters', 'O(k)'
);

-- ============================================================
-- HEAP: 16. sort-characters-by-frequency (Medium, LeetCode 451)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'sort-characters-by-frequency', 'heap', 'Sort Characters By Frequency', 'Medium',
  $DESC$<p>Given a string <code>s</code>, sort it in <strong>decreasing order</strong> based on the <strong>frequency</strong> of the characters. The <strong>frequency</strong> of a character is the number of times it appears in the string.</p>
<p>Return the sorted string. If there are multiple answers, return any of them. For deterministic output, among characters with the same frequency, sort them alphabetically.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "tree"
Output: "eert"
Explanation: 'e' appears twice while 'r' and 't' both appear once. So 'e' must appear before both 'r' and 't'. "eetr" is also a valid answer, but we sort ties alphabetically.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "cccaaa"
Output: "aaaccc"
Explanation: Both 'c' and 'a' appear three times, so both "cccaaa" and "aaaccc" are valid answers. With alphabetical tie-breaking, "aaaccc" comes first.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s = "Aabb"
Output: "bbAa"
Explanation: 'b' appears twice, 'A' and 'a' each once. Uppercase and lowercase are different characters. Tie-breaking alphabetically by ASCII: 'A' before 'a'.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 5 * 10<sup>5</sup></code></li>
<li><code>s</code> consists of uppercase and lowercase English letters and digits.</li>
</ul>$DESC$,
  '', ARRAY['Count the frequency of each character.', 'Sort characters by frequency descending, breaking ties alphabetically.', 'Build the result by repeating each character by its frequency.'],
  '200', 'https://leetcode.com/problems/sort-characters-by-frequency/',
  'frequencySort', '[{"name":"s","type":"str"}]'::jsonb, 'str',
  '[{"inputs":["\"tree\""],"expected":"\"eert\""},{"inputs":["\"cccaaa\""],"expected":"\"aaaccc\""},{"inputs":["\"Aabb\""],"expected":"\"bbAa\""},{"inputs":["\"a\""],"expected":"\"a\""},{"inputs":["\"aabb\""],"expected":"\"aabb\""},{"inputs":["\"eeeee\""],"expected":"\"eeeee\""},{"inputs":["\"abcabc\""],"expected":"\"aabbcc\""},{"inputs":["\"loveleetcode\""],"expected":"\"eeeelloocdtv\""},{"inputs":["\"bbccddaa\""],"expected":"\"aabbccdd\""},{"inputs":["\"zzzzyyyxx\""],"expected":"\"zzzzyyyxx\""},{"inputs":["\"mississippi\""],"expected":"\"iiiissssppm\""},{"inputs":["\"aAbBcC\""],"expected":"\"ABCabc\""},{"inputs":["\"112233\""],"expected":"\"112233\""},{"inputs":["\"hello\""],"expected":"\"lleho\""},{"inputs":["\"programming\""],"expected":"\"ggmmrrainop\""},{"inputs":["\"banana\""],"expected":"\"aaannb\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'sort-characters-by-frequency', 1, 'Counter + Sort',
  'Count the frequency of each character, sort by frequency descending (with alphabetical tie-breaking), then build the result string by repeating each character by its count.',
  '["Count frequency of each character using a hash map.","Get unique characters and sort by (-frequency, character) for descending frequency and alphabetical ties.","Build result by appending each character repeated by its frequency.","Return the result string."]'::jsonb,
  $PY$from collections import Counter

class Solution:
    def frequencySort(self, s: str) -> str:
        count = Counter(s)
        sorted_chars = sorted(count.keys(), key=lambda c: (-count[c], c))
        return ''.join(c * count[c] for c in sorted_chars)$PY$,
  $JS$var frequencySort = function(s) {
    var count = {};
    for (var i = 0; i < s.length; i++) {
        count[s[i]] = (count[s[i]] || 0) + 1;
    }
    var chars = Object.keys(count);
    chars.sort(function(a, b) {
        if (count[b] !== count[a]) return count[b] - count[a];
        return a < b ? -1 : 1;
    });
    var result = '';
    for (var j = 0; j < chars.length; j++) {
        for (var k = 0; k < count[chars[j]]; k++) {
            result += chars[j];
        }
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public String frequencySort(String s) {
        java.util.Map<Character, Integer> count = new java.util.HashMap<>();
        for (char c : s.toCharArray()) {
            count.put(c, count.getOrDefault(c, 0) + 1);
        }
        java.util.List<Character> chars = new java.util.ArrayList<>(count.keySet());
        chars.sort((a, b) -> {
            if (!count.get(a).equals(count.get(b))) return count.get(b) - count.get(a);
            return Character.compare(a, b);
        });
        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            for (int i = 0; i < count.get(c); i++) {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}$JAVA$,
  'O(n log n)', 'O(n)'
);

-- ============================================================
-- TRIES: 17. longest-word-dictionary (Medium, LeetCode 720)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'longest-word-dictionary', 'tries', 'Longest Word in Dictionary', 'Medium',
  $DESC$<p>Given an array of strings <code>words</code> representing an English Dictionary, return the longest word in <code>words</code> that can be built one character at a time by other words in <code>words</code>.</p>
<p>If there is more than one possible answer, return the longest word with the smallest lexicographical order. If there is no answer, return the empty string.</p>
<p>Note that the word should be built from left to right with each additional character being added to the end of a previous word.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: words = ["w","wo","wor","worl","world"]
Output: "world"
Explanation: The word "world" can be built one character at a time by "w", "wo", "wor", and "worl".</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: words = ["a","banana","app","appl","ap","apply","apple"]
Output: "apple"
Explanation: Both "apply" and "apple" can be built from other words in the dictionary. However, "apple" is lexicographically smaller than "apply".</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= words.length &lt;= 1000</code></li>
<li><code>1 &lt;= words[i].length &lt;= 30</code></li>
<li><code>words[i]</code> consists of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['A word can be built one character at a time if every prefix of it is also in the dictionary.', 'Sort the words by length then alphabetically. Use a set to track buildable words.', 'For each word, check if its prefix (word minus last char) is in the set. If so, add it and update the answer.'],
  '200', 'https://leetcode.com/problems/longest-word-in-dictionary/',
  'longestWord', '[{"name":"words","type":"List[str]"}]'::jsonb, 'str',
  '[{"inputs":["[\"w\",\"wo\",\"wor\",\"worl\",\"world\"]"],"expected":"\"world\""},{"inputs":["[\"a\",\"banana\",\"app\",\"appl\",\"ap\",\"apply\",\"apple\"]"],"expected":"\"apple\""},{"inputs":["[\"a\"]"],"expected":"\"a\""},{"inputs":["[\"abc\"]"],"expected":"\"\""},{"inputs":["[\"a\",\"b\",\"c\"]"],"expected":"\"a\""},{"inputs":["[\"a\",\"ab\",\"abc\",\"abcd\"]"],"expected":"\"abcd\""},{"inputs":["[\"a\",\"ab\",\"b\",\"bc\",\"bcd\"]"],"expected":"\"bcd\""},{"inputs":["[\"m\",\"mo\",\"moc\",\"mock\",\"mocks\"]"],"expected":"\"mocks\""},{"inputs":["[\"t\",\"ti\",\"tig\",\"tige\",\"tiger\",\"s\",\"si\",\"sin\",\"sing\",\"singe\",\"singer\"]"],"expected":"\"singer\""},{"inputs":["[\"a\",\"ab\",\"abc\",\"b\",\"bc\",\"bcd\",\"bcde\"]"],"expected":"\"bcde\""},{"inputs":["[\"yo\",\"y\",\"yoyo\",\"yoy\"]"],"expected":"\"yoyo\""},{"inputs":["[\"z\",\"zz\",\"zzz\",\"a\",\"aa\",\"aaa\",\"aaaa\"]"],"expected":"\"aaaa\""},{"inputs":["[\"cat\",\"ca\",\"c\",\"d\",\"do\",\"dog\",\"dogs\"]"],"expected":"\"dogs\""},{"inputs":["[\"k\",\"ki\",\"kit\",\"kite\",\"kites\",\"a\",\"al\",\"all\",\"allo\",\"allow\"]"],"expected":"\"allow\""},{"inputs":["[\"b\",\"ba\",\"ban\",\"band\",\"a\",\"ab\",\"abc\",\"abcd\",\"abcde\"]"],"expected":"\"abcde\""},{"inputs":["[\"x\",\"xy\",\"xyz\",\"p\",\"pq\",\"pqr\",\"pqrs\"]"],"expected":"\"pqrs\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'longest-word-dictionary', 1, 'Sort + HashSet',
  'We sort words by length (then alphabetically). For each word, we check if its prefix (all but last character) is already in our set of buildable words. Single-character words are always buildable. We track the longest buildable word.',
  '["Sort words by length, then alphabetically.","Initialize a set with an empty string (to handle single-char words).","Initialize answer as empty string.","For each word: if word[:-1] is in the set, add word to set and update answer if word is longer (or same length but lexicographically smaller).","Return answer."]'::jsonb,
  $PY$class Solution:
    def longestWord(self, words) -> str:
        words.sort()
        built = {''}
        answer = ''
        for word in words:
            if word[:-1] in built:
                built.add(word)
                if len(word) > len(answer):
                    answer = word
        return answer$PY$,
  $JS$var longestWord = function(words) {
    words.sort();
    var built = new Set(['']);
    var answer = '';
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        if (built.has(word.slice(0, -1))) {
            built.add(word);
            if (word.length > answer.length) {
                answer = word;
            }
        }
    }
    return answer;
};$JS$,
  $JAVA$class Solution {
    public String longestWord(String[] words) {
        java.util.Arrays.sort(words);
        java.util.Set<String> built = new java.util.HashSet<>();
        built.add("");
        String answer = "";
        for (String word : words) {
            if (built.contains(word.substring(0, word.length() - 1))) {
                built.add(word);
                if (word.length() > answer.length()) {
                    answer = word;
                }
            }
        }
        return answer;
    }
}$JAVA$,
  'O(n log n + n * L) where L is max word length', 'O(n * L)'
);

-- ============================================================
-- TRIES: 18. search-suggestions-system (Medium, LeetCode 1268)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'search-suggestions-system', 'tries', 'Search Suggestions System', 'Medium',
  $DESC$<p>You are given an array of strings <code>products</code> and a string <code>searchWord</code>. Design a system that suggests at most three product names from <code>products</code> after each character of <code>searchWord</code> is typed. Suggested products should have common prefix with <code>searchWord</code>. If there are more than three products with a common prefix return the three lexicographically minimum products.</p>
<p>Return a list of lists of the suggested products after each character of <code>searchWord</code> is typed.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"
Output: [["mobile","moneypot","monitor"],["mobile","moneypot","monitor"],["mouse","mousepad"],["mouse","mousepad"],["mouse","mousepad"]]
Explanation: products sorted lexicographically = ["mobile","moneypot","monitor","mouse","mousepad"].
After typing m and mo all products match and we show user ["mobile","moneypot","monitor"].
After typing mou, mous and mouse the system suggests ["mouse","mousepad"].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: products = ["havana"], searchWord = "havana"
Output: [["havana"],["havana"],["havana"],["havana"],["havana"],["havana"]]</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: products = ["bags","baggage","banner","box","cloths"], searchWord = "bags"
Output: [["baggage","bags","banner"],["baggage","bags","banner"],["baggage","bags"],["bags"]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= products.length &lt;= 1000</code></li>
<li><code>1 &lt;= products[i].length &lt;= 3000</code></li>
<li><code>1 &lt;= sum(products[i].length) &lt;= 2 * 10<sup>4</sup></code></li>
<li>All the strings of <code>products</code> are <strong>unique</strong>.</li>
<li><code>products[i]</code> consists of lowercase English letters.</li>
<li><code>1 &lt;= searchWord.length &lt;= 1000</code></li>
<li><code>searchWord</code> consists of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['Sort the products list first for lexicographic ordering.', 'For each prefix of searchWord, use binary search to find the starting position of matching products.', 'From that position, take up to 3 products that match the prefix.'],
  '200', 'https://leetcode.com/problems/search-suggestions-system/',
  'suggestedProducts', '[{"name":"products","type":"List[str]"},{"name":"searchWord","type":"str"}]'::jsonb, 'List[List[str]]',
  '[{"inputs":["[\"mobile\",\"mouse\",\"moneypot\",\"monitor\",\"mousepad\"]","\"mouse\""],"expected":"[[\"mobile\",\"moneypot\",\"monitor\"],[\"mobile\",\"moneypot\",\"monitor\"],[\"mouse\",\"mousepad\"],[\"mouse\",\"mousepad\"],[\"mouse\",\"mousepad\"]]"},{"inputs":["[\"havana\"]","\"havana\""],"expected":"[[\"havana\"],[\"havana\"],[\"havana\"],[\"havana\"],[\"havana\"],[\"havana\"]]"},{"inputs":["[\"bags\",\"baggage\",\"banner\",\"box\",\"cloths\"]","\"bags\""],"expected":"[[\"baggage\",\"bags\",\"banner\"],[\"baggage\",\"bags\",\"banner\"],[\"baggage\",\"bags\"],[\"bags\"]]"},{"inputs":["[\"apple\",\"apricot\",\"application\"]","\"app\""],"expected":"[[\"apple\",\"application\",\"apricot\"],[\"apple\",\"application\",\"apricot\"],[\"apple\",\"application\"]]"},{"inputs":["[\"a\"]","\"a\""],"expected":"[[\"a\"]]"},{"inputs":["[\"code\",\"codeforces\",\"codechef\",\"codewars\"]","\"code\""],"expected":"[[\"code\",\"codechef\",\"codeforces\"],[\"code\",\"codechef\",\"codeforces\"],[\"code\",\"codechef\",\"codeforces\"],[\"code\",\"codechef\",\"codeforces\"]]"},{"inputs":["[\"abc\",\"bcd\",\"cde\"]","\"abc\""],"expected":"[[\"abc\"],[\"abc\"],[\"abc\"]]"},{"inputs":["[\"dog\",\"deer\",\"deal\"]","\"de\""],"expected":"[[\"deal\",\"deer\",\"dog\"],[\"deal\",\"deer\"]]"},{"inputs":["[\"car\",\"card\",\"care\",\"careful\",\"cargo\"]","\"care\""],"expected":"[[\"car\",\"card\",\"care\"],[\"car\",\"card\",\"care\"],[\"car\",\"card\",\"care\"],[\"care\",\"careful\"]]"},{"inputs":["[\"x\",\"xx\",\"xxx\",\"xxxx\"]","\"xx\""],"expected":"[[\"x\",\"xx\",\"xxx\"],[\"xx\",\"xxx\",\"xxxx\"]]"},{"inputs":["[\"alpha\",\"beta\",\"gamma\"]","\"delta\""],"expected":"[[],[],[],[],[]]"},{"inputs":["[\"tree\",\"trie\",\"trim\",\"trip\",\"true\"]","\"tri\""],"expected":"[[\"tree\",\"trie\",\"trim\"],[\"tree\",\"trie\",\"trim\"],[\"trie\",\"trim\",\"trip\"]]"},{"inputs":["[\"cat\",\"cats\",\"catch\",\"category\"]","\"cat\""],"expected":"[[\"cat\",\"catch\",\"category\"],[\"cat\",\"catch\",\"category\"],[\"cat\",\"catch\",\"category\"]]"},{"inputs":["[\"pen\",\"pencil\",\"penguin\"]","\"pen\""],"expected":"[[\"pen\",\"pencil\",\"penguin\"],[\"pen\",\"pencil\",\"penguin\"],[\"pen\",\"pencil\",\"penguin\"]]"},{"inputs":["[\"z\"]","\"az\""],"expected":"[[],[]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'search-suggestions-system', 1, 'Sort + Binary Search',
  'We sort the products array first. For each prefix of searchWord, we use binary search to find where this prefix would be inserted. Then we check the next 3 products to see if they match the prefix.',
  '["Sort the products array.","For each prefix (searchWord[:1], searchWord[:2], ...):","  Use binary search to find the leftmost position where prefix could be inserted.","  Check up to 3 products starting from that position.","  Add matching products (those that start with prefix) to the result for this prefix.","Return the list of suggestion lists."]'::jsonb,
  $PY$import bisect

class Solution:
    def suggestedProducts(self, products, searchWord: str):
        products.sort()
        result = []
        prefix = ''
        start = 0
        for char in searchWord:
            prefix += char
            start = bisect.bisect_left(products, prefix, start)
            suggestions = []
            for i in range(start, min(start + 3, len(products))):
                if products[i].startswith(prefix):
                    suggestions.append(products[i])
                else:
                    break
            result.append(suggestions)
        return result$PY$,
  $JS$var suggestedProducts = function(products, searchWord) {
    products.sort();
    var result = [];
    var prefix = '';
    var start = 0;
    for (var c = 0; c < searchWord.length; c++) {
        prefix += searchWord[c];
        // Binary search for leftmost position
        var lo = start, hi = products.length;
        while (lo < hi) {
            var mid = Math.floor((lo + hi) / 2);
            if (products[mid] < prefix) lo = mid + 1;
            else hi = mid;
        }
        start = lo;
        var suggestions = [];
        for (var i = start; i < Math.min(start + 3, products.length); i++) {
            if (products[i].startsWith(prefix)) {
                suggestions.push(products[i]);
            } else {
                break;
            }
        }
        result.push(suggestions);
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public java.util.List<java.util.List<String>> suggestedProducts(String[] products, String searchWord) {
        java.util.Arrays.sort(products);
        java.util.List<java.util.List<String>> result = new java.util.ArrayList<>();
        String prefix = "";
        int start = 0;
        for (int c = 0; c < searchWord.length(); c++) {
            prefix += searchWord.charAt(c);
            // Binary search
            int lo = start, hi = products.length;
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (products[mid].compareTo(prefix) < 0) lo = mid + 1;
                else hi = mid;
            }
            start = lo;
            java.util.List<String> suggestions = new java.util.ArrayList<>();
            for (int i = start; i < Math.min(start + 3, products.length); i++) {
                if (products[i].startsWith(prefix)) {
                    suggestions.add(products[i]);
                } else {
                    break;
                }
            }
            result.add(suggestions);
        }
        return result;
    }
}$JAVA$,
  'O(n log n + L * log n) where L is searchWord length', 'O(n) for sorting'
);

COMMIT;
