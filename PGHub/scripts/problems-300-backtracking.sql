-- Grow catalog 200 → 300: backtracking topic (+6 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'binary-tree-paths','combinations','subsets-ii','permutations-ii',
  'restore-ip-addresses','expression-add-operators'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'binary-tree-paths','combinations','subsets-ii','permutations-ii',
  'restore-ip-addresses','expression-add-operators'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'binary-tree-paths','combinations','subsets-ii','permutations-ii',
  'restore-ip-addresses','expression-add-operators'
);

-- ============================================================
-- 1) binary-tree-paths (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('binary-tree-paths', 'backtracking', 'Binary Tree Paths', 'Easy',
$$<p>Given the root of a binary tree, return all root-to-leaf paths as strings in the form <code>"a->b->c"</code>.</p>$$,
'', ARRAY[
  'DFS carrying a growing path string. At a leaf, push a full copy into the result.',
  'On the way up (or use Python string immutability), you do not need to manually backtrack the string — return an empty list at null nodes.',
  'Handle the edge case of an empty tree by returning an empty list.'
], '300', 'https://leetcode.com/problems/binary-tree-paths/',
'binaryTreePaths',
'[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,
'List[str]',
'[
  {"inputs":["[1,2,3,null,5]"],"expected":"[\"1->2->5\",\"1->3\"]"},
  {"inputs":["[1]"],"expected":"[\"1\"]"},
  {"inputs":["[]"],"expected":"[]"},
  {"inputs":["[1,2]"],"expected":"[\"1->2\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('binary-tree-paths', 'python',
$PY$class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        $PY$),
('binary-tree-paths', 'javascript',
$JS$var binaryTreePaths = function(root) {

};$JS$),
('binary-tree-paths', 'java',
$JAVA$class Solution {
    public List<String> binaryTreePaths(TreeNode root) {

    }
}$JAVA$),
('binary-tree-paths', 'cpp',
$CPP$class Solution {
public:
    vector<string> binaryTreePaths(TreeNode* root) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('binary-tree-paths', 1, 'DFS Accumulating Path',
'Each recursion layer appends its node value to the path. When we reach a leaf (both children null), we commit the finished path to the output; otherwise we recurse into the non-null children.',
'["If root is null, return [].","DFS(node, path). path = path + (empty if fresh, else \"->\") + str(node.val).","If node is a leaf, append path to result.","Otherwise recurse into non-null children with the current path."]'::jsonb,
$PY$class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        if not root:
            return []
        result = []
        def dfs(node, path):
            path = path + ("->" + str(node.val) if path else str(node.val))
            if not node.left and not node.right:
                result.append(path)
                return
            if node.left: dfs(node.left, path)
            if node.right: dfs(node.right, path)
        dfs(root, "")
        return result
$PY$,
$JS$var binaryTreePaths = function(root) {
    if (!root) return [];
    const result = [];
    const dfs = (node, path) => {
        const next = path ? path + "->" + node.val : String(node.val);
        if (!node.left && !node.right) { result.push(next); return; }
        if (node.left) dfs(node.left, next);
        if (node.right) dfs(node.right, next);
    };
    dfs(root, "");
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> binaryTreePaths(TreeNode root) {
        List<String> result = new ArrayList<>();
        if (root == null) return result;
        dfs(root, "", result);
        return result;
    }
    private void dfs(TreeNode node, String path, List<String> result) {
        String next = path.isEmpty() ? String.valueOf(node.val) : path + "->" + node.val;
        if (node.left == null && node.right == null) { result.add(next); return; }
        if (node.left != null) dfs(node.left, next, result);
        if (node.right != null) dfs(node.right, next, result);
    }
}
$JAVA$,
$CPP$class Solution {
    void dfs(TreeNode* node, string path, vector<string>& result) {
        string next = path.empty() ? to_string(node->val) : path + "->" + to_string(node->val);
        if (!node->left && !node->right) { result.push_back(next); return; }
        if (node->left) dfs(node->left, next, result);
        if (node->right) dfs(node->right, next, result);
    }
public:
    vector<string> binaryTreePaths(TreeNode* root) {
        vector<string> result;
        if (!root) return result;
        dfs(root, "", result);
        return result;
    }
};
$CPP$,
'O(n)', 'O(h)');

-- ============================================================
-- 2) combinations (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('combinations', 'backtracking', 'Combinations', 'Medium',
$$<p>Given two integers <code>n</code> and <code>k</code>, return all possible combinations of <code>k</code> numbers chosen from <code>1..n</code>. The answer may be in any order.</p>$$,
'', ARRAY[
  'Backtracking with a start parameter guarantees combinations (not permutations): each recursive call only picks from the remaining unused values >= start.',
  'Prune when fewer values remain than slots still to fill.',
  'Commit the path when its length hits k.'
], '300', 'https://leetcode.com/problems/combinations/',
'combine',
'[{"name":"n","type":"int"},{"name":"k","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["4","2"],"expected":"[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]"},
  {"inputs":["1","1"],"expected":"[[1]]"},
  {"inputs":["3","3"],"expected":"[[1,2,3]]"},
  {"inputs":["5","1"],"expected":"[[1],[2],[3],[4],[5]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('combinations', 'python',
$PY$class Solution:
    def combine(self, n: int, k: int) -> List[List[int]]:
        $PY$),
('combinations', 'javascript',
$JS$var combine = function(n, k) {

};$JS$),
('combinations', 'java',
$JAVA$class Solution {
    public List<List<Integer>> combine(int n, int k) {

    }
}$JAVA$),
('combinations', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> combine(int n, int k) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('combinations', 1, 'Backtracking with Start Pointer',
'A start parameter enforces "only pick from values >= start" so every branch explores a strictly increasing sub-combination — no duplicates regardless of order.',
'["Define backtrack(start, path). If len(path) == k, append a copy to result and return.","For v from start to n - (k - len(path)) + 1: append v to path; recurse with v + 1; pop.","Call backtrack(1, [])."]'::jsonb,
$PY$class Solution:
    def combine(self, n: int, k: int) -> List[List[int]]:
        result = []
        path = []
        def backtrack(start):
            if len(path) == k:
                result.append(path.copy())
                return
            for v in range(start, n - (k - len(path)) + 2):
                path.append(v)
                backtrack(v + 1)
                path.pop()
        backtrack(1)
        return result
$PY$,
$JS$var combine = function(n, k) {
    const result = [];
    const path = [];
    const backtrack = (start) => {
        if (path.length === k) { result.push([...path]); return; }
        for (let v = start; v <= n - (k - path.length) + 1; v++) {
            path.push(v);
            backtrack(v + 1);
            path.pop();
        }
    };
    backtrack(1);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(1, n, k, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int start, int n, int k, List<Integer> path, List<List<Integer>> result) {
        if (path.size() == k) { result.add(new ArrayList<>(path)); return; }
        for (int v = start; v <= n - (k - path.size()) + 1; v++) {
            path.add(v);
            backtrack(v + 1, n, k, path, result);
            path.remove(path.size() - 1);
        }
    }
}
$JAVA$,
$CPP$class Solution {
    void backtrack(int start, int n, int k, vector<int>& path, vector<vector<int>>& result) {
        if ((int)path.size() == k) { result.push_back(path); return; }
        for (int v = start; v <= n - (k - (int)path.size()) + 1; v++) {
            path.push_back(v);
            backtrack(v + 1, n, k, path, result);
            path.pop_back();
        }
    }
public:
    vector<vector<int>> combine(int n, int k) {
        vector<vector<int>> result;
        vector<int> path;
        backtrack(1, n, k, path, result);
        return result;
    }
};
$CPP$,
'O(C(n, k) * k)', 'O(k)');

-- ============================================================
-- 3) subsets-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('subsets-ii', 'backtracking', 'Subsets II', 'Medium',
$$<p>Given an integer array <code>nums</code> that may contain duplicates, return all possible subsets. The solution set must not contain duplicate subsets.</p>$$,
'', ARRAY[
  'Sort nums so duplicates become adjacent, then skip duplicate branches in the backtracking.',
  'At position i, if i > start and nums[i] == nums[i - 1], skip — otherwise we would enumerate the same subset twice.',
  'Collect a copy of the current path at every recursion start (before the loop).'
], '300', 'https://leetcode.com/problems/subsets-ii/',
'subsetsWithDup',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[1,2,2]"],"expected":"[[],[1],[1,2],[1,2,2],[2],[2,2]]"},
  {"inputs":["[0]"],"expected":"[[],[0]]"},
  {"inputs":["[4,4,4,1,4]"],"expected":"[[],[1],[1,4],[1,4,4],[1,4,4,4],[1,4,4,4,4],[4],[4,4],[4,4,4],[4,4,4,4]]"},
  {"inputs":["[]"],"expected":"[[]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('subsets-ii', 'python',
$PY$class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        $PY$),
('subsets-ii', 'javascript',
$JS$var subsetsWithDup = function(nums) {

};$JS$),
('subsets-ii', 'java',
$JAVA$class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {

    }
}$JAVA$),
('subsets-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('subsets-ii', 1, 'Sort + Skip-Duplicate Backtracking',
'Sorting puts duplicates next to each other. During the backtracking, at each recursion layer the FIRST instance of each duplicate value is explored; subsequent duplicates (i > start and nums[i] == nums[i - 1]) are skipped because they would redo the same branch.',
'["Sort nums.","backtrack(start, path): append path.copy() to result.","For i from start to n - 1: if i > start and nums[i] == nums[i - 1], continue.","  Append nums[i]; recurse(i + 1); pop.","Return result after backtrack(0, [])."]'::jsonb,
$PY$class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        result = []
        path = []
        def backtrack(start):
            result.append(path.copy())
            for i in range(start, len(nums)):
                if i > start and nums[i] == nums[i - 1]:
                    continue
                path.append(nums[i])
                backtrack(i + 1)
                path.pop()
        backtrack(0)
        return result
$PY$,
$JS$var subsetsWithDup = function(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    const path = [];
    const backtrack = (start) => {
        result.push([...path]);
        for (let i = start; i < nums.length; i++) {
            if (i > start && nums[i] === nums[i - 1]) continue;
            path.push(nums[i]);
            backtrack(i + 1);
            path.pop();
        }
    };
    backtrack(0);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        result.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.add(nums[i]);
            backtrack(nums, i + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}
$JAVA$,
$CPP$class Solution {
    void backtrack(vector<int>& nums, int start, vector<int>& path, vector<vector<int>>& result) {
        result.push_back(path);
        for (int i = start; i < (int)nums.size(); i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.push_back(nums[i]);
            backtrack(nums, i + 1, path, result);
            path.pop_back();
        }
    }
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        vector<int> path;
        backtrack(nums, 0, path, result);
        return result;
    }
};
$CPP$,
'O(2^n * n)', 'O(n)');

-- ============================================================
-- 4) permutations-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('permutations-ii', 'backtracking', 'Permutations II', 'Medium',
$$<p>Given a list <code>nums</code> that may contain duplicates, return all unique permutations in any order.</p>$$,
'', ARRAY[
  'Sort nums so equal values are adjacent. Use a used[] boolean array to avoid reusing a slot.',
  'To skip duplicate permutations: when considering nums[i] with nums[i] == nums[i - 1], only pick it if nums[i - 1] has already been used in the current recursion path. Otherwise we would regenerate an identical permutation.',
  'Commit path when its length equals n.'
], '300', 'https://leetcode.com/problems/permutations-ii/',
'permuteUnique',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["[1,1,2]"],"expected":"[[1,1,2],[1,2,1],[2,1,1]]"},
  {"inputs":["[1,2,3]"],"expected":"[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"},
  {"inputs":["[1]"],"expected":"[[1]]"},
  {"inputs":["[2,2]"],"expected":"[[2,2]]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('permutations-ii', 'python',
$PY$class Solution:
    def permuteUnique(self, nums: List[int]) -> List[List[int]]:
        $PY$),
('permutations-ii', 'javascript',
$JS$var permuteUnique = function(nums) {

};$JS$),
('permutations-ii', 'java',
$JAVA$class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {

    }
}$JAVA$),
('permutations-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> permuteUnique(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('permutations-ii', 1, 'Sort + Used Array + Duplicate Guard',
'Sorting positions duplicates adjacently. To avoid generating the same permutation twice, when selecting nums[i] for the next slot we skip it if nums[i - 1] was equal and is currently unused — because that branch has already produced this permutation via the other ordering.',
'["Sort nums.","used = [False] * n, path = [], result = [].","backtrack(): if len(path) == n, append path.copy() and return.","For i in 0..n - 1: if used[i], continue. If i > 0 and nums[i] == nums[i - 1] and not used[i - 1], continue.","  used[i] = True; path.append(nums[i]); backtrack(); path.pop(); used[i] = False."]'::jsonb,
$PY$class Solution:
    def permuteUnique(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        used = [False] * n
        path = []
        result = []
        def backtrack():
            if len(path) == n:
                result.append(path.copy())
                return
            for i in range(n):
                if used[i]:
                    continue
                if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                    continue
                used[i] = True
                path.append(nums[i])
                backtrack()
                path.pop()
                used[i] = False
        backtrack()
        return result
$PY$,
$JS$var permuteUnique = function(nums) {
    nums.sort((a, b) => a - b);
    const n = nums.length;
    const used = new Array(n).fill(false);
    const path = [];
    const result = [];
    const backtrack = () => {
        if (path.length === n) { result.push([...path]); return; }
        for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            path.push(nums[i]);
            backtrack();
            path.pop();
            used[i] = false;
        }
    };
    backtrack();
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> permuteUnique(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(nums, used, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> result) {
        if (path.size() == nums.length) { result.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(nums, used, path, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
$JAVA$,
$CPP$class Solution {
    void backtrack(vector<int>& nums, vector<bool>& used, vector<int>& path, vector<vector<int>>& result) {
        if (path.size() == nums.size()) { result.push_back(path); return; }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
            used[i] = true;
            path.push_back(nums[i]);
            backtrack(nums, used, path, result);
            path.pop_back();
            used[i] = false;
        }
    }
public:
    vector<vector<int>> permuteUnique(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        backtrack(nums, used, path, result);
        return result;
    }
};
$CPP$,
'O(n * n!)', 'O(n)');

-- ============================================================
-- 5) restore-ip-addresses (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('restore-ip-addresses', 'backtracking', 'Restore IP Addresses', 'Medium',
$$<p>Given a string <code>s</code> of digits, return every possible valid IPv4 address formed by inserting exactly three dots into <code>s</code>. Leading zeros are not allowed except for "0" itself and each octet must be 0-255.</p>$$,
'', ARRAY[
  'Backtracking: choose the length (1, 2, or 3 digits) of the next octet.',
  'Validate each candidate octet — reject leading zeros (except "0" itself) and values > 255.',
  'Commit when you have 4 parts using exactly the whole string.'
], '300', 'https://leetcode.com/problems/restore-ip-addresses/',
'restoreIpAddresses',
'[{"name":"s","type":"str"}]'::jsonb,
'List[str]',
'[
  {"inputs":["\"25525511135\""],"expected":"[\"255.255.11.135\",\"255.255.111.35\"]"},
  {"inputs":["\"0000\""],"expected":"[\"0.0.0.0\"]"},
  {"inputs":["\"101023\""],"expected":"[\"1.0.10.23\",\"1.0.102.3\",\"10.1.0.23\",\"10.10.2.3\",\"101.0.2.3\"]"},
  {"inputs":["\"1111\""],"expected":"[\"1.1.1.1\"]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('restore-ip-addresses', 'python',
$PY$class Solution:
    def restoreIpAddresses(self, s: str) -> List[str]:
        $PY$),
('restore-ip-addresses', 'javascript',
$JS$var restoreIpAddresses = function(s) {

};$JS$),
('restore-ip-addresses', 'java',
$JAVA$class Solution {
    public List<String> restoreIpAddresses(String s) {

    }
}$JAVA$),
('restore-ip-addresses', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> restoreIpAddresses(string& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('restore-ip-addresses', 1, 'Backtracking Octet Slices',
'We know the final IP has exactly four octets. At each recursion layer, slice off one valid octet (length 1-3) from the remaining string. Prune aggressively: an octet must not have a leading zero (except single "0") and must be <= 255.',
'["backtrack(start, parts): if parts has 4 entries and start == len(s), join and record.","If parts has 4 entries but string remains, return.","For L in {1, 2, 3}: if start + L > len(s), break.","  octet = s[start:start + L]. Reject leading zero or value > 255.","  Append octet; recurse(start + L, parts); pop."]'::jsonb,
$PY$class Solution:
    def restoreIpAddresses(self, s: str) -> List[str]:
        result = []
        parts = []
        def valid(octet):
            if not octet or (octet[0] == '0' and len(octet) > 1):
                return False
            return 0 <= int(octet) <= 255
        def backtrack(start):
            if len(parts) == 4:
                if start == len(s):
                    result.append('.'.join(parts))
                return
            for L in range(1, 4):
                if start + L > len(s):
                    break
                octet = s[start:start + L]
                if valid(octet):
                    parts.append(octet)
                    backtrack(start + L)
                    parts.pop()
        backtrack(0)
        return result
$PY$,
$JS$var restoreIpAddresses = function(s) {
    const result = [];
    const parts = [];
    const valid = (octet) => {
        if (!octet.length || (octet[0] === '0' && octet.length > 1)) return false;
        const v = parseInt(octet, 10);
        return v >= 0 && v <= 255;
    };
    const backtrack = (start) => {
        if (parts.length === 4) {
            if (start === s.length) result.push(parts.join('.'));
            return;
        }
        for (let L = 1; L <= 3; L++) {
            if (start + L > s.length) break;
            const octet = s.slice(start, start + L);
            if (valid(octet)) {
                parts.push(octet);
                backtrack(start + L);
                parts.pop();
            }
        }
    };
    backtrack(0);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> restoreIpAddresses(String s) {
        List<String> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(String s, int start, List<String> parts, List<String> result) {
        if (parts.size() == 4) {
            if (start == s.length()) result.add(String.join(".", parts));
            return;
        }
        for (int L = 1; L <= 3; L++) {
            if (start + L > s.length()) break;
            String oct = s.substring(start, start + L);
            if (valid(oct)) {
                parts.add(oct);
                backtrack(s, start + L, parts, result);
                parts.remove(parts.size() - 1);
            }
        }
    }
    private boolean valid(String oct) {
        if (oct.isEmpty() || (oct.charAt(0) == '0' && oct.length() > 1)) return false;
        int v = Integer.parseInt(oct);
        return v >= 0 && v <= 255;
    }
}
$JAVA$,
$CPP$class Solution {
    bool valid(const string& oct) {
        if (oct.empty() || (oct[0] == '0' && oct.size() > 1)) return false;
        int v = stoi(oct);
        return v >= 0 && v <= 255;
    }
    void backtrack(const string& s, int start, vector<string>& parts, vector<string>& result) {
        if ((int)parts.size() == 4) {
            if (start == (int)s.size()) {
                string joined = parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3];
                result.push_back(joined);
            }
            return;
        }
        for (int L = 1; L <= 3; L++) {
            if (start + L > (int)s.size()) break;
            string oct = s.substr(start, L);
            if (valid(oct)) {
                parts.push_back(oct);
                backtrack(s, start + L, parts, result);
                parts.pop_back();
            }
        }
    }
public:
    vector<string> restoreIpAddresses(string& s) {
        vector<string> result;
        vector<string> parts;
        backtrack(s, 0, parts, result);
        return result;
    }
};
$CPP$,
'O(1) (bounded branching x len <= 12)', 'O(1)');

-- ============================================================
-- 6) expression-add-operators (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('expression-add-operators', 'backtracking', 'Expression Add Operators', 'Hard',
$$<p>Given a string of digits <code>num</code> and an integer <code>target</code>, return all expressions obtainable by inserting binary operators <code>+</code>, <code>-</code>, or <code>*</code> (or nothing) between digits so the expression evaluates to <code>target</code>. No operand may have a leading zero unless it is exactly "0".</p>$$,
'', ARRAY[
  'Backtrack while tracking two quantities: total (full expression value so far) and last (the last additive term, needed for correct handling of multiplication precedence).',
  'On each step pick the next operand (string slice of length 1..n). Reject leading zeros.',
  'Three branches: +operand (total + operand, last = operand), -operand (total - operand, last = -operand), *operand (total - last + last * operand, last = last * operand).'
], '300', 'https://leetcode.com/problems/expression-add-operators/',
'addOperators',
'[{"name":"num","type":"str"},{"name":"target","type":"int"}]'::jsonb,
'List[str]',
'[
  {"inputs":["\"123\"","6"],"expected":"[\"1*2*3\",\"1+2+3\"]"},
  {"inputs":["\"232\"","8"],"expected":"[\"2*3+2\",\"2+3*2\"]"},
  {"inputs":["\"105\"","5"],"expected":"[\"1*0+5\",\"10-5\"]"},
  {"inputs":["\"3456237490\"","9191"],"expected":"[]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('expression-add-operators', 'python',
$PY$class Solution:
    def addOperators(self, num: str, target: int) -> List[str]:
        $PY$),
('expression-add-operators', 'javascript',
$JS$var addOperators = function(num, target) {

};$JS$),
('expression-add-operators', 'java',
$JAVA$class Solution {
    public List<String> addOperators(String num, int target) {

    }
}$JAVA$),
('expression-add-operators', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> addOperators(string& num, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('expression-add-operators', 1, 'Backtrack with Last Term Tracking',
'Multiplication binds tighter than plus/minus, so a straightforward running total is wrong when we multiply. We also track the "last additive term" — the value most recently added to the running total. On * we rewind by subtracting last and add last * operand back; the new last becomes last * operand.',
'["Backtrack(index, expression, total, last). If index == len(num) and total == target, add expression.","Pick operand length L from 1 to remaining. If the first char is 0 and L > 1, break.","Convert the slice to int val. If this is the first operand, recurse with the slice, total = val, last = val.","Else three branches: +val (total + val, last = val), -val (total - val, last = -val), *val (total - last + last * val, last = last * val).","Return the collected expressions."]'::jsonb,
$PY$class Solution:
    def addOperators(self, num: str, target: int) -> List[str]:
        result = []
        def backtrack(i, expr, total, last):
            if i == len(num):
                if total == target:
                    result.append(expr)
                return
            for L in range(1, len(num) - i + 1):
                slice_str = num[i:i + L]
                if len(slice_str) > 1 and slice_str[0] == '0':
                    break
                val = int(slice_str)
                if i == 0:
                    backtrack(i + L, slice_str, val, val)
                else:
                    backtrack(i + L, expr + "+" + slice_str, total + val, val)
                    backtrack(i + L, expr + "-" + slice_str, total - val, -val)
                    backtrack(i + L, expr + "*" + slice_str, total - last + last * val, last * val)
        backtrack(0, "", 0, 0)
        return result
$PY$,
$JS$var addOperators = function(num, target) {
    const result = [];
    const backtrack = (i, expr, total, last) => {
        if (i === num.length) {
            if (total === target) result.push(expr);
            return;
        }
        for (let L = 1; L <= num.length - i; L++) {
            const slice = num.slice(i, i + L);
            if (slice.length > 1 && slice[0] === '0') break;
            const val = Number(slice);
            if (i === 0) backtrack(i + L, slice, val, val);
            else {
                backtrack(i + L, expr + '+' + slice, total + val, val);
                backtrack(i + L, expr + '-' + slice, total - val, -val);
                backtrack(i + L, expr + '*' + slice, total - last + last * val, last * val);
            }
        }
    };
    backtrack(0, '', 0, 0);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<String> addOperators(String num, int target) {
        List<String> result = new ArrayList<>();
        backtrack(num, target, 0, new StringBuilder(), 0L, 0L, result);
        return result;
    }
    private void backtrack(String num, int target, int i, StringBuilder expr, long total, long last, List<String> result) {
        if (i == num.length()) {
            if (total == target) result.add(expr.toString());
            return;
        }
        for (int L = 1; L <= num.length() - i; L++) {
            String slice = num.substring(i, i + L);
            if (slice.length() > 1 && slice.charAt(0) == '0') break;
            long val = Long.parseLong(slice);
            int len = expr.length();
            if (i == 0) {
                expr.append(slice);
                backtrack(num, target, i + L, expr, val, val, result);
                expr.setLength(len);
            } else {
                expr.append('+').append(slice);
                backtrack(num, target, i + L, expr, total + val, val, result);
                expr.setLength(len);
                expr.append('-').append(slice);
                backtrack(num, target, i + L, expr, total - val, -val, result);
                expr.setLength(len);
                expr.append('*').append(slice);
                backtrack(num, target, i + L, expr, total - last + last * val, last * val, result);
                expr.setLength(len);
            }
        }
    }
}
$JAVA$,
$CPP$class Solution {
    void backtrack(const string& num, int target, int i, string& expr, long long total, long long last, vector<string>& result) {
        if (i == (int)num.size()) {
            if (total == target) result.push_back(expr);
            return;
        }
        for (int L = 1; L <= (int)num.size() - i; L++) {
            string slice = num.substr(i, L);
            if (slice.size() > 1 && slice[0] == '0') break;
            long long val = stoll(slice);
            size_t len = expr.size();
            if (i == 0) {
                expr += slice;
                backtrack(num, target, i + L, expr, val, val, result);
                expr.resize(len);
            } else {
                expr += "+" + slice;
                backtrack(num, target, i + L, expr, total + val, val, result);
                expr.resize(len);
                expr += "-" + slice;
                backtrack(num, target, i + L, expr, total - val, -val, result);
                expr.resize(len);
                expr += "*" + slice;
                backtrack(num, target, i + L, expr, total - last + last * val, last * val, result);
                expr.resize(len);
            }
        }
    }
public:
    vector<string> addOperators(string& num, int target) {
        vector<string> result;
        string expr;
        backtrack(num, target, 0, expr, 0, 0, result);
        return result;
    }
};
$CPP$,
'O(4^n)', 'O(n)');

COMMIT;
