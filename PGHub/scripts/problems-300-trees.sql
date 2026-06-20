-- Grow catalog 200 → 300: trees topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'path-sum','minimum-depth-binary-tree','binary-tree-inorder-traversal',
  'binary-tree-zigzag-level-order','path-sum-iii','sum-root-to-leaf-numbers',
  'count-complete-tree-nodes','binary-tree-maximum-path-sum'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'path-sum','minimum-depth-binary-tree','binary-tree-inorder-traversal',
  'binary-tree-zigzag-level-order','path-sum-iii','sum-root-to-leaf-numbers',
  'count-complete-tree-nodes','binary-tree-maximum-path-sum'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'path-sum','minimum-depth-binary-tree','binary-tree-inorder-traversal',
  'binary-tree-zigzag-level-order','path-sum-iii','sum-root-to-leaf-numbers',
  'count-complete-tree-nodes','binary-tree-maximum-path-sum'
);

-- ============================================================
-- 1) path-sum (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('path-sum', 'trees', 'Path Sum', 'Easy',
$$<p>Given the <code>root</code> of a binary tree and an integer <code>targetSum</code>, return <code>true</code> if the tree has a root-to-leaf path whose node values sum to <code>targetSum</code>.</p>$$,
'', ARRAY[
  'A leaf is a node with no children; only complete root-to-leaf paths count.',
  'Recurse: subtract the current node value from targetSum and check each subtree.',
  'At a leaf, the path sums to targetSum iff the remaining amount equals the leaf value.'
], '300', 'https://leetcode.com/problems/path-sum/',
'hasPathSum',
'[{"name":"root","type":"Optional[TreeNode]"},{"name":"targetSum","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["[5,4,8,11,null,13,4,7,2,null,null,null,1]","22"],"expected":"true"},
  {"inputs":["[1,2,3]","5"],"expected":"false"},
  {"inputs":["[]","0"],"expected":"false"},
  {"inputs":["[1,2]","1"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('path-sum', 'python',
$PY$# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        $PY$),
('path-sum', 'javascript',
$JS$/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
var hasPathSum = function(root, targetSum) {

};$JS$),
('path-sum', 'java',
$JAVA$/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {

    }
}$JAVA$),
('path-sum', 'cpp',
$CPP$/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('path-sum', 1, 'Recursive Subtraction',
'Instead of carrying a running sum, subtract the current node value from targetSum at each step. A valid root-to-leaf path is one that hits a leaf whose value equals the remaining target.',
'["If root is null, return false (no path exists).","If both children are null (leaf), return targetSum == root.val.","Recurse into root.left and root.right, each with targetSum - root.val. Return true iff either subtree reports true."]'::jsonb,
$PY$class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if not root:
            return False
        if not root.left and not root.right:
            return targetSum == root.val
        remaining = targetSum - root.val
        return self.hasPathSum(root.left, remaining) or self.hasPathSum(root.right, remaining)
$PY$,
$JS$var hasPathSum = function(root, targetSum) {
    if (!root) return false;
    if (!root.left && !root.right) return targetSum === root.val;
    const remaining = targetSum - root.val;
    return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
};
$JS$,
$JAVA$class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return targetSum == root.val;
        int remaining = targetSum - root.val;
        return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return targetSum == root->val;
        int remaining = targetSum - root->val;
        return hasPathSum(root->left, remaining) || hasPathSum(root->right, remaining);
    }
};
$CPP$,
'O(n)', 'O(h)');

-- ============================================================
-- 2) minimum-depth-binary-tree (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('minimum-depth-binary-tree', 'trees', 'Minimum Depth of Binary Tree', 'Easy',
$$<p>Given a binary tree, return its minimum depth — the number of nodes along the shortest path from the root down to the nearest leaf.</p>$$,
'', ARRAY[
  'A leaf has no children. "Shortest path to a leaf" is not the same as min(leftDepth, rightDepth) — a null child is not a leaf.',
  'If a node has exactly one child, the minimum depth descends into that child; recursion into a null subtree must return +infinity (or you must special-case it).',
  'BFS is naturally optimal: the first leaf you pop is at minimum depth.'
], '300', 'https://leetcode.com/problems/minimum-depth-of-binary-tree/',
'minDepth',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,9,20,null,null,15,7]"],"expected":"2"},
  {"inputs":["[2,null,3,null,4,null,5,null,6]"],"expected":"5"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[1]"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('minimum-depth-binary-tree', 'python',
$PY$class Solution:
    def minDepth(self, root: Optional[TreeNode]) -> int:
        $PY$),
('minimum-depth-binary-tree', 'javascript',
$JS$var minDepth = function(root) {

};$JS$),
('minimum-depth-binary-tree', 'java',
$JAVA$class Solution {
    public int minDepth(TreeNode root) {

    }
}$JAVA$),
('minimum-depth-binary-tree', 'cpp',
$CPP$class Solution {
public:
    int minDepth(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('minimum-depth-binary-tree', 1, 'BFS Level by Level',
'BFS visits nodes in non-decreasing depth order, so the first leaf we dequeue is at the minimum depth. That beats worst-case DFS which could traverse an entire skewed left subtree before realizing the right subtree has a much shallower leaf.',
'["If root is null, return 0.","Seed a FIFO queue with (root, depth=1).","Pop (node, depth). If node has no children, return depth.","Otherwise enqueue non-null children at depth + 1."]'::jsonb,
$PY$class Solution:
    def minDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        from collections import deque
        queue = deque([(root, 1)])
        while queue:
            node, depth = queue.popleft()
            if not node.left and not node.right:
                return depth
            if node.left: queue.append((node.left, depth + 1))
            if node.right: queue.append((node.right, depth + 1))
        return 0
$PY$,
$JS$var minDepth = function(root) {
    if (!root) return 0;
    const queue = [[root, 1]];
    while (queue.length) {
        const [node, depth] = queue.shift();
        if (!node.left && !node.right) return depth;
        if (node.left) queue.push([node.left, depth + 1]);
        if (node.right) queue.push([node.right, depth + 1]);
    }
    return 0;
};
$JS$,
$JAVA$class Solution {
    public int minDepth(TreeNode root) {
        if (root == null) return 0;
        Deque<Object[]> queue = new ArrayDeque<>();
        queue.offer(new Object[]{root, 1});
        while (!queue.isEmpty()) {
            Object[] pair = queue.poll();
            TreeNode node = (TreeNode) pair[0];
            int depth = (int) pair[1];
            if (node.left == null && node.right == null) return depth;
            if (node.left != null) queue.offer(new Object[]{node.left, depth + 1});
            if (node.right != null) queue.offer(new Object[]{node.right, depth + 1});
        }
        return 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minDepth(TreeNode* root) {
        if (!root) return 0;
        queue<pair<TreeNode*, int>> q;
        q.push({root, 1});
        while (!q.empty()) {
            auto [node, depth] = q.front(); q.pop();
            if (!node->left && !node->right) return depth;
            if (node->left) q.push({node->left, depth + 1});
            if (node->right) q.push({node->right, depth + 1});
        }
        return 0;
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 3) binary-tree-inorder-traversal (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-tree-inorder-traversal', 'trees', 'Binary Tree Inorder Traversal', 'Easy',
$$<p>Given the root of a binary tree, return an inorder traversal of its node values (left subtree, node, right subtree).</p>$$,
'', ARRAY[
  'Recursive is a 3-line solution: inorder(left) + [val] + inorder(right).',
  'Iterative with a stack: push the left spine; pop, record the value, then descend once into the right child and repeat.',
  'Morris traversal can do it in O(1) extra space by temporarily wiring predecessor.right = current.'
], '300', 'https://leetcode.com/problems/binary-tree-inorder-traversal/',
'inorderTraversal',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'List[int]',
'[
  {"inputs":["[1,null,2,3]"],"expected":"[1,3,2]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[1]"],"expected":"[1]"},
  {"inputs":["[1,2,3,4,5]"],"expected":"[4,2,5,1,3]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-tree-inorder-traversal', 'python',
$PY$class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        $PY$),
('binary-tree-inorder-traversal', 'javascript',
$JS$var inorderTraversal = function(root) {

};$JS$),
('binary-tree-inorder-traversal', 'java',
$JAVA$class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {

    }
}$JAVA$),
('binary-tree-inorder-traversal', 'cpp',
$CPP$class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-tree-inorder-traversal', 1, 'Iterative with Explicit Stack',
'Mimic the recursive call stack explicitly: descend left as far as possible pushing nodes, then pop one, record it, and transition into its right subtree. The invariant is that whatever is on the stack still has unvisited right-subtree work to do.',
'["Initialize an empty stack, an empty result list, and curr = root.","Loop while curr or stack is non-empty.","  Inner loop: while curr, push curr and set curr = curr.left.","  Pop a node, append its value to result, set curr = node.right.","Return result."]'::jsonb,
$PY$class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        result = []
        stack = []
        curr = root
        while curr or stack:
            while curr:
                stack.append(curr)
                curr = curr.left
            curr = stack.pop()
            result.append(curr.val)
            curr = curr.right
        return result
$PY$,
$JS$var inorderTraversal = function(root) {
    const result = [];
    const stack = [];
    let curr = root;
    while (curr || stack.length) {
        while (curr) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        result.push(curr.val);
        curr = curr.right;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode curr = root;
        while (curr != null || !stack.isEmpty()) {
            while (curr != null) { stack.push(curr); curr = curr.left; }
            curr = stack.pop();
            result.add(curr.val);
            curr = curr.right;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> result;
        stack<TreeNode*> st;
        TreeNode* curr = root;
        while (curr || !st.empty()) {
            while (curr) { st.push(curr); curr = curr->left; }
            curr = st.top(); st.pop();
            result.push_back(curr->val);
            curr = curr->right;
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(h)');

-- ============================================================
-- 4) binary-tree-zigzag-level-order (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-tree-zigzag-level-order', 'trees', 'Binary Tree Zigzag Level Order Traversal', 'Medium',
$$<p>Given the root of a binary tree, return the zigzag level order traversal: left-to-right on the first level, right-to-left on the next, and alternate thereafter.</p>$$,
'', ARRAY[
  'Standard level-order BFS; just reverse alternate levels before pushing them to the result.',
  'Track a boolean "reverse" flag that flips each iteration.',
  'Alternative: push children in different orders per level and use a two-ended data structure for O(1) prepend on reversed levels.'
], '300', 'https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/',
'zigzagLevelOrder',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[3,9,20,null,null,15,7]"],"expected":"[[3],[20,9],[15,7]]"},
  {"inputs":["[1]"],"expected":"[[1]]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[1,2,3,4,null,null,5]"],"expected":"[[1],[3,2],[4,5]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-tree-zigzag-level-order', 'python',
$PY$class Solution:
    def zigzagLevelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        $PY$),
('binary-tree-zigzag-level-order', 'javascript',
$JS$var zigzagLevelOrder = function(root) {

};$JS$),
('binary-tree-zigzag-level-order', 'java',
$JAVA$class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {

    }
}$JAVA$),
('binary-tree-zigzag-level-order', 'cpp',
$CPP$class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-tree-zigzag-level-order', 1, 'BFS with Alternating Reverse',
'Run a standard level-order BFS that collects each level into a list. Track a "reverse" flag that toggles every level; when it is True, reverse the level before appending it to the final result.',
'["If root is null, return [].","Seed a queue with [root] and result = []. Set reverse = False.","Loop while queue is non-empty: take size = len(queue). Pop size nodes into level; push their non-null children.","If reverse, reverse level. Append level to result. Toggle reverse."]'::jsonb,
$PY$class Solution:
    def zigzagLevelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root:
            return []
        from collections import deque
        queue = deque([root])
        result = []
        reverse = False
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left: queue.append(node.left)
                if node.right: queue.append(node.right)
            if reverse:
                level.reverse()
            result.append(level)
            reverse = not reverse
        return result
$PY$,
$JS$var zigzagLevelOrder = function(root) {
    if (!root) return [];
    const queue = [root];
    const result = [];
    let reverse = false;
    while (queue.length) {
        const level = [];
        const size = queue.length;
        for (let i = 0; i < size; i++) {
            const node = queue.shift();
            level.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        if (reverse) level.reverse();
        result.push(level);
        reverse = !reverse;
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        boolean reverse = false;
        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            if (reverse) Collections.reverse(level);
            result.add(level);
            reverse = !reverse;
        }
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        bool reverse = false;
        while (!q.empty()) {
            int size = q.size();
            vector<int> level;
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front(); q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            if (reverse) std::reverse(level.begin(), level.end());
            result.push_back(move(level));
            reverse = !reverse;
        }
        return result;
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 5) path-sum-iii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('path-sum-iii', 'trees', 'Path Sum III', 'Medium',
$$<p>Given a binary tree and an integer <code>targetSum</code>, count the number of paths (top-down, not necessarily starting at the root or ending at a leaf) whose node values sum to <code>targetSum</code>.</p>$$,
'', ARRAY[
  'Running prefix sum on each root-to-current path converts the query "does any subpath sum to target?" into "has prefix (current - target) been seen earlier on this path?".',
  'Maintain a hash map of prefix sum counts updated on the way down and rolled back on the way up.',
  'Seed the map with {0: 1} to cover paths that start at the root.'
], '300', 'https://leetcode.com/problems/path-sum-iii/',
'pathSum',
'[{"name":"root","type":"Optional[TreeNode]"},{"name":"targetSum","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[10,5,-3,3,2,null,11,3,-2,null,1]","8"],"expected":"3"},
  {"inputs":["[5,4,8,11,null,13,4,7,2,null,null,5,1]","22"],"expected":"3"},
  {"inputs":["[]","0"],"expected":"0"},
  {"inputs":["[1,-2,-3]","-1"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('path-sum-iii', 'python',
$PY$class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
        $PY$),
('path-sum-iii', 'javascript',
$JS$var pathSum = function(root, targetSum) {

};$JS$),
('path-sum-iii', 'java',
$JAVA$class Solution {
    public int pathSum(TreeNode root, int targetSum) {

    }
}$JAVA$),
('path-sum-iii', 'cpp',
$CPP$class Solution {
public:
    int pathSum(TreeNode* root, int targetSum) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('path-sum-iii', 1, 'Prefix Sum Map During DFS',
'A downward path from ancestor a to descendant b has sum = prefix[b] - prefix[parent_of_a]. Counting (prefix[b] - target) occurrences in the current root-to-b trail tells us how many valid paths end at b. A running hash map of trail prefixes — pushed on the way down and popped on the way up — keeps each lookup O(1).',
'["Initialize counts = {0: 1} (one virtual empty prefix).","DFS(node, running). If node is null, return.","  running += node.val; answer += counts.get(running - target, 0).","  Increment counts[running] before descending into children.","  Recurse into both children, then decrement counts[running] to undo our contribution.","Return answer."]'::jsonb,
$PY$class Solution:
    def pathSum(self, root: Optional[TreeNode], targetSum: int) -> int:
        counts = {0: 1}
        self.total = 0
        def dfs(node, running):
            if not node:
                return
            running += node.val
            self.total += counts.get(running - targetSum, 0)
            counts[running] = counts.get(running, 0) + 1
            dfs(node.left, running)
            dfs(node.right, running)
            counts[running] -= 1
        dfs(root, 0)
        return self.total
$PY$,
$JS$var pathSum = function(root, targetSum) {
    const counts = new Map([[0, 1]]);
    let total = 0;
    const dfs = (node, running) => {
        if (!node) return;
        running += node.val;
        total += counts.get(running - targetSum) || 0;
        counts.set(running, (counts.get(running) || 0) + 1);
        dfs(node.left, running);
        dfs(node.right, running);
        counts.set(running, counts.get(running) - 1);
    };
    dfs(root, 0);
    return total;
};
$JS$,
$JAVA$class Solution {
    private int total = 0;
    private Map<Long, Integer> counts = new HashMap<>();
    public int pathSum(TreeNode root, int targetSum) {
        counts.put(0L, 1);
        dfs(root, 0L, targetSum);
        return total;
    }
    private void dfs(TreeNode node, long running, int target) {
        if (node == null) return;
        running += node.val;
        total += counts.getOrDefault(running - target, 0);
        counts.merge(running, 1, Integer::sum);
        dfs(node.left, running, target);
        dfs(node.right, running, target);
        counts.merge(running, -1, Integer::sum);
    }
}
$JAVA$,
$CPP$class Solution {
    int total = 0;
    unordered_map<long long, int> counts;
    void dfs(TreeNode* node, long long running, int target) {
        if (!node) return;
        running += node->val;
        auto it = counts.find(running - target);
        if (it != counts.end()) total += it->second;
        counts[running]++;
        dfs(node->left, running, target);
        dfs(node->right, running, target);
        counts[running]--;
    }
public:
    int pathSum(TreeNode* root, int targetSum) {
        counts[0] = 1;
        dfs(root, 0, targetSum);
        return total;
    }
};
$CPP$,
'O(n)', 'O(h + distinct prefixes)');

-- ============================================================
-- 6) sum-root-to-leaf-numbers (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('sum-root-to-leaf-numbers', 'trees', 'Sum Root to Leaf Numbers', 'Medium',
$$<p>Every root-to-leaf path in a binary tree (each node 0-9) spells a number formed by concatenating its digits. Return the sum of all such numbers.</p>$$,
'', ARRAY[
  'Maintain a running number as you DFS; descending into a child multiplies by 10 and adds the child value.',
  'Sum at each leaf and accumulate.',
  'Alternative: BFS with (node, current_number) pairs.'
], '300', 'https://leetcode.com/problems/sum-root-to-leaf-numbers/',
'sumNumbers',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3]"],"expected":"25"},
  {"inputs":["[4,9,0,5,1]"],"expected":"1026"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[]"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('sum-root-to-leaf-numbers', 'python',
$PY$class Solution:
    def sumNumbers(self, root: Optional[TreeNode]) -> int:
        $PY$),
('sum-root-to-leaf-numbers', 'javascript',
$JS$var sumNumbers = function(root) {

};$JS$),
('sum-root-to-leaf-numbers', 'java',
$JAVA$class Solution {
    public int sumNumbers(TreeNode root) {

    }
}$JAVA$),
('sum-root-to-leaf-numbers', 'cpp',
$CPP$class Solution {
public:
    int sumNumbers(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('sum-root-to-leaf-numbers', 1, 'DFS Carrying Prefix',
'Carrying the partial number along with the DFS means every leaf contributes the full root-to-leaf number without having to re-derive it. Multiplying by 10 as you descend and adding the child digit mirrors reading digits left to right.',
'["Define dfs(node, current). If node is null, return 0.","Let num = current * 10 + node.val.","If node is a leaf, return num.","Otherwise return dfs(node.left, num) + dfs(node.right, num).","Call dfs(root, 0)."]'::jsonb,
$PY$class Solution:
    def sumNumbers(self, root: Optional[TreeNode]) -> int:
        def dfs(node, current):
            if not node:
                return 0
            num = current * 10 + node.val
            if not node.left and not node.right:
                return num
            return dfs(node.left, num) + dfs(node.right, num)
        return dfs(root, 0)
$PY$,
$JS$var sumNumbers = function(root) {
    const dfs = (node, current) => {
        if (!node) return 0;
        const num = current * 10 + node.val;
        if (!node.left && !node.right) return num;
        return dfs(node.left, num) + dfs(node.right, num);
    };
    return dfs(root, 0);
};
$JS$,
$JAVA$class Solution {
    public int sumNumbers(TreeNode root) {
        return dfs(root, 0);
    }
    private int dfs(TreeNode node, int current) {
        if (node == null) return 0;
        int num = current * 10 + node.val;
        if (node.left == null && node.right == null) return num;
        return dfs(node.left, num) + dfs(node.right, num);
    }
}
$JAVA$,
$CPP$class Solution {
    int dfs(TreeNode* node, int current) {
        if (!node) return 0;
        int num = current * 10 + node->val;
        if (!node->left && !node->right) return num;
        return dfs(node->left, num) + dfs(node->right, num);
    }
public:
    int sumNumbers(TreeNode* root) {
        return dfs(root, 0);
    }
};
$CPP$,
'O(n)', 'O(h)');

-- ============================================================
-- 7) count-complete-tree-nodes (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('count-complete-tree-nodes', 'trees', 'Count Complete Tree Nodes', 'Medium',
$$<p>Given a <em>complete</em> binary tree, count the total number of nodes. Beat O(n).</p>$$,
'', ARRAY[
  'A complete tree has the property that its leftmost branch has depth h and the rightmost branch has depth h or h - 1.',
  'If left-spine height == right-spine height, the subtree is a perfect tree with (2^h - 1) nodes — no recursion needed.',
  'Otherwise recurse into both children and add 1 for the root. Each recursive call only "digs deeper" in one side, giving O(log^2 n) total.'
], '300', 'https://leetcode.com/problems/count-complete-tree-nodes/',
'countNodes',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3,4,5,6]"],"expected":"6"},
  {"inputs":["[]"],"expected":"0"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[1,2,3,4,5,6,null]"],"expected":"6"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('count-complete-tree-nodes', 'python',
$PY$class Solution:
    def countNodes(self, root: Optional[TreeNode]) -> int:
        $PY$),
('count-complete-tree-nodes', 'javascript',
$JS$var countNodes = function(root) {

};$JS$),
('count-complete-tree-nodes', 'java',
$JAVA$class Solution {
    public int countNodes(TreeNode root) {

    }
}$JAVA$),
('count-complete-tree-nodes', 'cpp',
$CPP$class Solution {
public:
    int countNodes(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('count-complete-tree-nodes', 1, 'Perfect-Subtree Short Circuit',
'In a complete tree, one of the two children''s subtrees is always perfect. Measure the left-spine depth L and right-spine depth R at every node: if L == R the whole subtree is perfect (2^L - 1 nodes); otherwise recurse on both children. Because only one recursion actually deepens the traversal, the total work is O(log n) * O(log n).',
'["If root is null, return 0.","Walk only leftward from root to find L; only rightward to find R.","If L == R, return (1 << L) - 1.","Otherwise return 1 + countNodes(root.left) + countNodes(root.right)."]'::jsonb,
$PY$class Solution:
    def countNodes(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        L, R = 0, 0
        node = root
        while node:
            L += 1; node = node.left
        node = root
        while node:
            R += 1; node = node.right
        if L == R:
            return (1 << L) - 1
        return 1 + self.countNodes(root.left) + self.countNodes(root.right)
$PY$,
$JS$var countNodes = function(root) {
    if (!root) return 0;
    let L = 0, R = 0, node = root;
    while (node) { L++; node = node.left; }
    node = root;
    while (node) { R++; node = node.right; }
    if (L === R) return (1 << L) - 1;
    return 1 + countNodes(root.left) + countNodes(root.right);
};
$JS$,
$JAVA$class Solution {
    public int countNodes(TreeNode root) {
        if (root == null) return 0;
        int L = 0, R = 0;
        TreeNode node = root;
        while (node != null) { L++; node = node.left; }
        node = root;
        while (node != null) { R++; node = node.right; }
        if (L == R) return (1 << L) - 1;
        return 1 + countNodes(root.left) + countNodes(root.right);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int countNodes(TreeNode* root) {
        if (!root) return 0;
        int L = 0, R = 0;
        TreeNode* node = root;
        while (node) { L++; node = node->left; }
        node = root;
        while (node) { R++; node = node->right; }
        if (L == R) return (1 << L) - 1;
        return 1 + countNodes(root->left) + countNodes(root->right);
    }
};
$CPP$,
'O(log^2 n)', 'O(log n)');

-- ============================================================
-- 8) binary-tree-maximum-path-sum (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-tree-maximum-path-sum', 'trees', 'Binary Tree Maximum Path Sum', 'Hard',
$$<p>Given the root of a binary tree, return the maximum possible sum of any path. A path is a sequence of nodes connected by parent-child edges; it does not need to pass through the root and cannot reuse any node.</p>$$,
'', ARRAY[
  'For each node we care about two numbers: (a) the best path STARTING at this node going strictly downward (extendable by its parent), and (b) the best path that TURNS at this node (using both children).',
  'DFS returns (a). While recursing, update a global best using node.val + max(0, left) + max(0, right).',
  'At each node, the returned value is node.val + max(0, max(left, right)) — negative-sum subtrees are dropped with max(0, ...).'
], '300', 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
'maxPathSum',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'int',
'[
  {"inputs":["[1,2,3]"],"expected":"6"},
  {"inputs":["[-10,9,20,null,null,15,7]"],"expected":"42"},
  {"inputs":["[-3]"],"expected":"-3"},
  {"inputs":["[2,-1]"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-tree-maximum-path-sum', 'python',
$PY$class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        $PY$),
('binary-tree-maximum-path-sum', 'javascript',
$JS$var maxPathSum = function(root) {

};$JS$),
('binary-tree-maximum-path-sum', 'java',
$JAVA$class Solution {
    public int maxPathSum(TreeNode root) {

    }
}$JAVA$),
('binary-tree-maximum-path-sum', 'cpp',
$CPP$class Solution {
public:
    int maxPathSum(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-tree-maximum-path-sum', 1, 'Gain vs Turn-Point at Every Node',
'Any maximum path "turns" at exactly one highest node. For that turning node the optimal value is node.val plus the best downward gain from each child (clipped at 0 to ignore negative subtrees). DFS each node, maintain a global best for the turning scenario, and propagate upward the best straight-down gain so ancestors can extend it.',
'["Track a global best initialized to -infinity.","Define gain(node): if node is null, return 0. Else left = max(0, gain(node.left)), right = max(0, gain(node.right)).","Update best = max(best, node.val + left + right).","Return node.val + max(left, right) — only one child can be extended upward.","Call gain(root) and return best."]'::jsonb,
$PY$class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        self.best = float("-inf")
        def gain(node):
            if not node:
                return 0
            left = max(0, gain(node.left))
            right = max(0, gain(node.right))
            self.best = max(self.best, node.val + left + right)
            return node.val + max(left, right)
        gain(root)
        return self.best
$PY$,
$JS$var maxPathSum = function(root) {
    let best = -Infinity;
    const gain = (node) => {
        if (!node) return 0;
        const left = Math.max(0, gain(node.left));
        const right = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + left + right);
        return node.val + Math.max(left, right);
    };
    gain(root);
    return best;
};
$JS$,
$JAVA$class Solution {
    private int best = Integer.MIN_VALUE;
    public int maxPathSum(TreeNode root) {
        gain(root);
        return best;
    }
    private int gain(TreeNode node) {
        if (node == null) return 0;
        int left = Math.max(0, gain(node.left));
        int right = Math.max(0, gain(node.right));
        best = Math.max(best, node.val + left + right);
        return node.val + Math.max(left, right);
    }
}
$JAVA$,
$CPP$class Solution {
    int best = INT_MIN;
    int gain(TreeNode* node) {
        if (!node) return 0;
        int left = max(0, gain(node->left));
        int right = max(0, gain(node->right));
        best = max(best, node->val + left + right);
        return node->val + max(left, right);
    }
public:
    int maxPathSum(TreeNode* root) {
        gain(root);
        return best;
    }
};
$CPP$,
'O(n)', 'O(h)');

COMMIT;
