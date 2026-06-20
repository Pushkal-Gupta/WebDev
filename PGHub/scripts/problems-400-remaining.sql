-- Final 30 problems for roadmap_set='400' across multiple topics.
BEGIN;

-- Clean up
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'design-circular-deque','task-scheduler-ii','zigzag-iterator','time-to-inform','implement-queue-using-stacks-ii',
  'surrounded-regions','word-ladder-graph','detect-cycle-undirected','minimum-spanning-tree','alien-dictionary-ii',
  'tower-of-hanoi','flatten-nested-list','merge-two-binary-trees','different-ways-compute-ii','strobogrammatic-number',
  'gas-station-ii','task-assignment','two-city-scheduling','video-stitching','split-array-largest-sum-ii',
  'my-calendar-ii','data-stream-disjoint','process-tasks-servers','combination-sum-iv','sudoku-solver',
  'design-search-autocomplete','count-distinct-substrings','max-sliding-window-ii','shortest-path-food',
  'serialize-deserialize-bst'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'design-circular-deque','task-scheduler-ii','zigzag-iterator','time-to-inform','implement-queue-using-stacks-ii',
  'surrounded-regions','word-ladder-graph','detect-cycle-undirected','minimum-spanning-tree','alien-dictionary-ii',
  'tower-of-hanoi','flatten-nested-list','merge-two-binary-trees','different-ways-compute-ii','strobogrammatic-number',
  'gas-station-ii','task-assignment','two-city-scheduling','video-stitching','split-array-largest-sum-ii',
  'my-calendar-ii','data-stream-disjoint','process-tasks-servers','combination-sum-iv','sudoku-solver',
  'design-search-autocomplete','count-distinct-substrings','max-sliding-window-ii','shortest-path-food',
  'serialize-deserialize-bst'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'design-circular-deque','task-scheduler-ii','zigzag-iterator','time-to-inform','implement-queue-using-stacks-ii',
  'surrounded-regions','word-ladder-graph','detect-cycle-undirected','minimum-spanning-tree','alien-dictionary-ii',
  'tower-of-hanoi','flatten-nested-list','merge-two-binary-trees','different-ways-compute-ii','strobogrammatic-number',
  'gas-station-ii','task-assignment','two-city-scheduling','video-stitching','split-array-largest-sum-ii',
  'my-calendar-ii','data-stream-disjoint','process-tasks-servers','combination-sum-iv','sudoku-solver',
  'design-search-autocomplete','count-distinct-substrings','max-sliding-window-ii','shortest-path-food',
  'serialize-deserialize-bst'
);

-- ============ QUEUE (5) ============

-- 1) time-to-inform (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('time-to-inform','queue','Time Needed to Inform All Employees','Medium',
$$<p>A company has <code>n</code> employees. <code>manager[i]</code> is employee i''s direct manager (-1 for head). <code>informTime[i]</code> is the time manager i takes to inform all direct reports. Return the total time to inform everyone starting from <code>headID</code>.</p>$$,
'',ARRAY['Build a tree from manager array, BFS/DFS from headID.','Track cumulative time along each path; the answer is the max.','Each employee is visited once.'],
'400','https://leetcode.com/problems/time-needed-to-inform-all-employees/',
'numOfMinutes','[{"name":"n","type":"int"},{"name":"headID","type":"int"},{"name":"manager","type":"List[int]"},{"name":"informTime","type":"List[int]"}]'::jsonb,'int',
'[{"inputs":["1","0","[-1]","[0]"],"expected":"0"},{"inputs":["6","2","[2,2,-1,2,2,2]","[0,0,1,0,0,0]"],"expected":"1"},{"inputs":["4","2","[3,3,-1,2]","[0,0,162,914]"],"expected":"1076"},{"inputs":["7","6","[1,2,3,4,5,6,-1]","[0,6,5,4,3,2,1]"],"expected":"21"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('time-to-inform','python',$PY$class Solution:
    def numOfMinutes(self, n: int, headID: int, manager: List[int], informTime: List[int]) -> int:
        $PY$),('time-to-inform','javascript',$JS$var numOfMinutes = function(n, headID, manager, informTime) {
};$JS$),('time-to-inform','java',$JAVA$class Solution {
    public int numOfMinutes(int n, int headID, int[] manager, int[] informTime) {
    }
}$JAVA$),('time-to-inform','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int numOfMinutes(int n, int headID, vector<int>& manager, vector<int>& informTime) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('time-to-inform',1,'BFS from Head','Build adjacency list from manager[], BFS tracking cumulative time.',
'["Build children[] from manager.","BFS from headID with time 0.","For each node, enqueue children with time + informTime[node].","Return max time seen."]'::jsonb,
$PY$class Solution:
    def numOfMinutes(self, n: int, headID: int, manager: List[int], informTime: List[int]) -> int:
        from collections import deque, defaultdict
        children = defaultdict(list)
        for i, m in enumerate(manager):
            if m != -1:
                children[m].append(i)
        queue = deque([(headID, 0)])
        best = 0
        while queue:
            node, t = queue.popleft()
            best = max(best, t)
            for child in children[node]:
                queue.append((child, t + informTime[node]))
        return best
$PY$,$JS$var numOfMinutes = function(n, headID, manager, informTime) {
    const children = Array.from({length: n}, () => []);
    for (let i = 0; i < n; i++) if (manager[i] !== -1) children[manager[i]].push(i);
    const queue = [[headID, 0]];
    let best = 0;
    while (queue.length) {
        const [node, t] = queue.shift();
        if (t > best) best = t;
        for (const c of children[node]) queue.push([c, t + informTime[node]]);
    }
    return best;
};$JS$,$JAVA$class Solution {
    public int numOfMinutes(int n, int headID, int[] manager, int[] informTime) {
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        for (int i = 0; i < n; i++) if (manager[i] != -1) children.get(manager[i]).add(i);
        Deque<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[]{headID, 0});
        int best = 0;
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            if (cur[1] > best) best = cur[1];
            for (int c : children.get(cur[0])) queue.offer(new int[]{c, cur[1] + informTime[cur[0]]});
        }
        return best;
    }
}$JAVA$,$CPP$class Solution {
public:
    int numOfMinutes(int n, int headID, vector<int>& manager, vector<int>& informTime) {
        vector<vector<int>> children(n);
        for (int i = 0; i < n; i++) if (manager[i] != -1) children[manager[i]].push_back(i);
        queue<pair<int,int>> q;
        q.push({headID, 0});
        int best = 0;
        while (!q.empty()) {
            auto [node, t] = q.front(); q.pop();
            best = max(best, t);
            for (int c : children[node]) q.push({c, t + informTime[node]});
        }
        return best;
    }
};$CPP$,'O(n)','O(n)');

-- ============ GRAPHS (5) ============

-- 2) surrounded-regions (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('surrounded-regions','graphs','Surrounded Regions','Medium',
$$<p>Given an <code>m x n</code> board of <code>"X"</code> and <code>"O"</code>, capture all regions of <code>"O"</code> that are completely surrounded by <code>"X"</code> (flip them to <code>"X"</code>). Border-connected <code>"O"</code>s are NOT captured.</p>$$,
'',ARRAY['Flip the problem: mark border-connected Os as safe, then flip everything else.','DFS/BFS from every border O, marking as T (temporary safe).','After traversal: T -> O (safe), remaining O -> X (captured).'],
'400','https://leetcode.com/problems/surrounded-regions/',
'solve','[{"name":"board","type":"List[List[str]]"}]'::jsonb,'List[List[str]]',
'[{"inputs":["[[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"O\",\"X\"],[\"X\",\"X\",\"O\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]"],"expected":"[[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"X\",\"X\",\"X\"],[\"X\",\"O\",\"X\",\"X\"]]"},{"inputs":["[[\"X\"]]"],"expected":"[[\"X\"]]"},{"inputs":["[[\"O\",\"O\"],[\"O\",\"O\"]]"],"expected":"[[\"O\",\"O\"],[\"O\",\"O\"]]"},{"inputs":["[[\"X\",\"O\",\"X\"],[\"O\",\"X\",\"O\"],[\"X\",\"O\",\"X\"]]"],"expected":"[[\"X\",\"O\",\"X\"],[\"O\",\"X\",\"O\"],[\"X\",\"O\",\"X\"]]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('surrounded-regions','python',$PY$class Solution:
    def solve(self, board: List[List[str]]) -> List[List[str]]:
        $PY$),('surrounded-regions','javascript',$JS$var solve = function(board) {
};$JS$),('surrounded-regions','java',$JAVA$class Solution {
    public String[][] solve(String[][] board) {
    }
}$JAVA$),('surrounded-regions','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<string>> solve(vector<vector<string>>& board) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('surrounded-regions',1,'Border DFS + Flip','Mark border-connected Os safe, then capture the rest.',
'["DFS from every border O, mark as T.","Scan board: O -> X (captured), T -> O (restored).","Return board."]'::jsonb,
$PY$class Solution:
    def solve(self, board: List[List[str]]) -> List[List[str]]:
        if not board:
            return board
        m, n = len(board), len(board[0])
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or board[r][c] != 'O':
                return
            board[r][c] = 'T'
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1)
        for r in range(m):
            dfs(r, 0); dfs(r, n-1)
        for c in range(n):
            dfs(0, c); dfs(m-1, c)
        for r in range(m):
            for c in range(n):
                if board[r][c] == 'O': board[r][c] = 'X'
                elif board[r][c] == 'T': board[r][c] = 'O'
        return board
$PY$,$JS$var solve = function(board) {
    if (!board.length) return board;
    const m = board.length, n = board[0].length;
    const dfs = (r, c) => {
        if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] !== 'O') return;
        board[r][c] = 'T';
        dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
    };
    for (let r = 0; r < m; r++) { dfs(r, 0); dfs(r, n-1); }
    for (let c = 0; c < n; c++) { dfs(0, c); dfs(m-1, c); }
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        if (board[r][c] === 'O') board[r][c] = 'X';
        else if (board[r][c] === 'T') board[r][c] = 'O';
    }
    return board;
};$JS$,$JAVA$class Solution {
    public String[][] solve(String[][] board) {
        if (board.length == 0) return board;
        int m = board.length, n = board[0].length;
        for (int r = 0; r < m; r++) { dfs(board, r, 0); dfs(board, r, n-1); }
        for (int c = 0; c < n; c++) { dfs(board, 0, c); dfs(board, m-1, c); }
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
            if (board[r][c].equals("O")) board[r][c] = "X";
            else if (board[r][c].equals("T")) board[r][c] = "O";
        }
        return board;
    }
    private void dfs(String[][] b, int r, int c) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || !b[r][c].equals("O")) return;
        b[r][c] = "T";
        dfs(b, r+1, c); dfs(b, r-1, c); dfs(b, r, c+1); dfs(b, r, c-1);
    }
}$JAVA$,$CPP$class Solution {
public:
    vector<vector<string>> solve(vector<vector<string>>& board) {
        if (board.empty()) return board;
        int m = board.size(), n = board[0].size();
        function<void(int,int)> dfs = [&](int r, int c) {
            if (r<0||r>=m||c<0||c>=n||board[r][c]!="O") return;
            board[r][c] = "T";
            dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
        };
        for (int r = 0; r < m; r++) { dfs(r, 0); dfs(r, n-1); }
        for (int c = 0; c < n; c++) { dfs(0, c); dfs(m-1, c); }
        for (int r = 0; r < m; r++) for (int c = 0; c < n; c++) {
            if (board[r][c] == "O") board[r][c] = "X";
            else if (board[r][c] == "T") board[r][c] = "O";
        }
        return board;
    }
};$CPP$,'O(m*n)','O(m*n)');

-- ============ RECURSION (5) ============

-- 3) merge-two-binary-trees (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('merge-two-binary-trees','recursion','Merge Two Binary Trees','Easy',
$$<p>Given two binary trees <code>root1</code> and <code>root2</code>, merge them: overlapping nodes sum their values, non-overlapping nodes take the existing node.</p>$$,
'',ARRAY['Recurse: if both are null return null; if one is null return the other.','Otherwise create a node with val = root1.val + root2.val.','Recurse left and right children.'],
'400','https://leetcode.com/problems/merge-two-binary-trees/',
'mergeTrees','[{"name":"root1","type":"Optional[TreeNode]"},{"name":"root2","type":"Optional[TreeNode]"}]'::jsonb,'Optional[TreeNode]',
'[{"inputs":["[1,3,2,5]","[2,1,3,null,4,null,7]"],"expected":"[3,4,5,5,4,null,7]"},{"inputs":["[1]","[1,2]"],"expected":"[2,2]"},{"inputs":["[]","[1]"],"expected":"[1]"},{"inputs":["[]","[]"],"expected":"[]"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('merge-two-binary-trees','python',$PY$class Solution:
    def mergeTrees(self, root1: Optional[TreeNode], root2: Optional[TreeNode]) -> Optional[TreeNode]:
        $PY$),('merge-two-binary-trees','javascript',$JS$var mergeTrees = function(root1, root2) {
};$JS$),('merge-two-binary-trees','java',$JAVA$class Solution {
    public TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
    }
}$JAVA$),('merge-two-binary-trees','cpp',$CPP$class Solution {
public:
    TreeNode* mergeTrees(TreeNode* root1, TreeNode* root2) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('merge-two-binary-trees',1,'Recursive Merge','At each position, sum overlapping nodes and recurse.',
'["If both null, return null.","If one null, return the other.","new node = TreeNode(root1.val + root2.val).","Recurse left and right."]'::jsonb,
$PY$class Solution:
    def mergeTrees(self, root1: Optional[TreeNode], root2: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root1: return root2
        if not root2: return root1
        root1.val += root2.val
        root1.left = self.mergeTrees(root1.left, root2.left)
        root1.right = self.mergeTrees(root1.right, root2.right)
        return root1
$PY$,$JS$var mergeTrees = function(root1, root2) {
    if (!root1) return root2;
    if (!root2) return root1;
    root1.val += root2.val;
    root1.left = mergeTrees(root1.left, root2.left);
    root1.right = mergeTrees(root1.right, root2.right);
    return root1;
};$JS$,$JAVA$class Solution {
    public TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
        if (root1 == null) return root2;
        if (root2 == null) return root1;
        root1.val += root2.val;
        root1.left = mergeTrees(root1.left, root2.left);
        root1.right = mergeTrees(root1.right, root2.right);
        return root1;
    }
}$JAVA$,$CPP$class Solution {
public:
    TreeNode* mergeTrees(TreeNode* root1, TreeNode* root2) {
        if (!root1) return root2;
        if (!root2) return root1;
        root1->val += root2->val;
        root1->left = mergeTrees(root1->left, root2->left);
        root1->right = mergeTrees(root1->right, root2->right);
        return root1;
    }
};$CPP$,'O(min(n1,n2))','O(min(h1,h2))');

-- 4) combination-sum-iv (Medium) — recursion/dp
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('combination-sum-iv','recursion','Combination Sum IV','Medium',
$$<p>Given <code>nums</code> (distinct positive ints) and <code>target</code>, return the number of possible combinations that sum to target. Different orderings count as different combinations.</p>$$,
'',ARRAY['dp[t] = number of ways to reach sum t.','dp[0] = 1. For t from 1 to target: dp[t] = sum(dp[t - num]) for num in nums where num <= t.','This is unbounded knapsack with order.'],
'400','https://leetcode.com/problems/combination-sum-iv/',
'combinationSum4','[{"name":"nums","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb,'int',
'[{"inputs":["[1,2,3]","4"],"expected":"7"},{"inputs":["[9]","3"],"expected":"0"},{"inputs":["[1,2]","4"],"expected":"5"},{"inputs":["[3,1,2]","3"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('combination-sum-iv','python',$PY$class Solution:
    def combinationSum4(self, nums: List[int], target: int) -> int:
        $PY$),('combination-sum-iv','javascript',$JS$var combinationSum4 = function(nums, target) {
};$JS$),('combination-sum-iv','java',$JAVA$class Solution {
    public int combinationSum4(int[] nums, int target) {
    }
}$JAVA$),('combination-sum-iv','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('combination-sum-iv',1,'Bottom-Up DP','dp[t] counts ordered sequences summing to t.',
'["dp[0] = 1.","For t from 1 to target: dp[t] = sum of dp[t - num] for each num in nums where num <= t.","Return dp[target]."]'::jsonb,
$PY$class Solution:
    def combinationSum4(self, nums: List[int], target: int) -> int:
        dp = [0] * (target + 1)
        dp[0] = 1
        for t in range(1, target + 1):
            for num in nums:
                if num <= t:
                    dp[t] += dp[t - num]
        return dp[target]
$PY$,$JS$var combinationSum4 = function(nums, target) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    for (let t = 1; t <= target; t++) {
        for (const num of nums) if (num <= t) dp[t] += dp[t - num];
    }
    return dp[target];
};$JS$,$JAVA$class Solution {
    public int combinationSum4(int[] nums, int target) {
        int[] dp = new int[target + 1];
        dp[0] = 1;
        for (int t = 1; t <= target; t++) {
            for (int num : nums) if (num <= t) dp[t] += dp[t - num];
        }
        return dp[target];
    }
}$JAVA$,$CPP$class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        vector<unsigned int> dp(target + 1, 0);
        dp[0] = 1;
        for (int t = 1; t <= target; t++) {
            for (int num : nums) if (num <= t) dp[t] += dp[t - num];
        }
        return dp[target];
    }
};$CPP$,'O(target * n)','O(target)');

-- 5) two-city-scheduling (Medium) — greedy
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('two-city-scheduling','greedy','Two City Scheduling','Medium',
$$<p>A company must fly <code>2n</code> people to two cities A and B, <code>n</code> each. <code>costs[i] = [aCost, bCost]</code> is the cost to fly person i to A or B. Return the minimum total cost.</p>$$,
'',ARRAY['Sort by the difference aCost - bCost (how much cheaper A is vs B).','Send the first n people to A and the rest to B.','Greedy: those who save the most by going to A should go there.'],
'400','https://leetcode.com/problems/two-city-scheduling/',
'twoCitySchedCost','[{"name":"costs","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[10,20],[30,200],[400,50],[30,20]]"],"expected":"110"},{"inputs":["[[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]]"],"expected":"1859"},{"inputs":["[[1,2],[3,4]]"],"expected":"4"},{"inputs":["[[100,1],[1,100]]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('two-city-scheduling','python',$PY$class Solution:
    def twoCitySchedCost(self, costs: List[List[int]]) -> int:
        $PY$),('two-city-scheduling','javascript',$JS$var twoCitySchedCost = function(costs) {
};$JS$),('two-city-scheduling','java',$JAVA$class Solution {
    public int twoCitySchedCost(int[][] costs) {
    }
}$JAVA$),('two-city-scheduling','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('two-city-scheduling',1,'Sort by Savings','Sort by aCost - bCost. First n go to A, rest to B.',
'["Sort costs by costs[i][0] - costs[i][1].","Sum costs[i][0] for first n, costs[i][1] for last n."]'::jsonb,
$PY$class Solution:
    def twoCitySchedCost(self, costs: List[List[int]]) -> int:
        costs.sort(key=lambda c: c[0] - c[1])
        n = len(costs) // 2
        total = 0
        for i in range(n):
            total += costs[i][0]
        for i in range(n, 2 * n):
            total += costs[i][1]
        return total
$PY$,$JS$var twoCitySchedCost = function(costs) {
    costs.sort((a, b) => (a[0] - a[1]) - (b[0] - b[1]));
    const n = costs.length / 2;
    let total = 0;
    for (let i = 0; i < n; i++) total += costs[i][0];
    for (let i = n; i < 2 * n; i++) total += costs[i][1];
    return total;
};$JS$,$JAVA$class Solution {
    public int twoCitySchedCost(int[][] costs) {
        Arrays.sort(costs, (a, b) -> (a[0] - a[1]) - (b[0] - b[1]));
        int n = costs.length / 2;
        int total = 0;
        for (int i = 0; i < n; i++) total += costs[i][0];
        for (int i = n; i < 2 * n; i++) total += costs[i][1];
        return total;
    }
}$JAVA$,$CPP$class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        sort(costs.begin(), costs.end(), [](const vector<int>& a, const vector<int>& b) {
            return (a[0] - a[1]) < (b[0] - b[1]);
        });
        int n = costs.size() / 2;
        int total = 0;
        for (int i = 0; i < n; i++) total += costs[i][0];
        for (int i = n; i < 2 * n; i++) total += costs[i][1];
        return total;
    }
};$CPP$,'O(n log n)','O(1)');

-- 6) serialize-deserialize-bst (Hard) — trees
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('serialize-deserialize-bst','trees','Serialize and Deserialize BST','Hard',
$$<p>Design an algorithm to serialize and deserialize a BST. The encoded string should be as compact as possible. Return the root of the deserialized tree given the serialized string.</p>$$,
'',ARRAY['Preorder traversal uniquely determines a BST (no need for null markers).','Serialize: preorder string of values.','Deserialize: use upper/lower bounds to reconstruct — each value must fall in (low, high) to be in the current subtree.'],
'400','https://leetcode.com/problems/serialize-and-deserialize-bst/',
'serialize','[{"name":"root","type":"Optional[TreeNode]"}]'::jsonb,'str',
'[{"inputs":["[2,1,3]"],"expected":"\"2,1,3\""},{"inputs":["[]"],"expected":"\"\""},{"inputs":["[5,3,7,1,4,6,8]"],"expected":"\"5,3,1,4,7,6,8\""},{"inputs":["[1]"],"expected":"\"1\""}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('serialize-deserialize-bst','python',$PY$class Solution:
    def serialize(self, root: Optional[TreeNode]) -> str:
        $PY$),('serialize-deserialize-bst','javascript',$JS$var serialize = function(root) {
};$JS$),('serialize-deserialize-bst','java',$JAVA$class Solution {
    public String serialize(TreeNode root) {
    }
}$JAVA$),('serialize-deserialize-bst','cpp',$CPP$class Solution {
public:
    string serialize(TreeNode* root) {
    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('serialize-deserialize-bst',1,'Preorder Traversal','BST preorder is sufficient to reconstruct the tree.',
'["Serialize: preorder DFS, join values with commas.","Deserialize: split by comma, reconstruct using bounds."]'::jsonb,
$PY$class Solution:
    def serialize(self, root: Optional[TreeNode]) -> str:
        vals = []
        def preorder(node):
            if node:
                vals.append(str(node.val))
                preorder(node.left)
                preorder(node.right)
        preorder(root)
        return ','.join(vals)
$PY$,$JS$var serialize = function(root) {
    const vals = [];
    const preorder = (node) => {
        if (node) { vals.push(node.val); preorder(node.left); preorder(node.right); }
    };
    preorder(root);
    return vals.join(',');
};$JS$,$JAVA$class Solution {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        preorder(root, sb);
        return sb.length() > 0 ? sb.substring(0, sb.length() - 1) : "";
    }
    private void preorder(TreeNode node, StringBuilder sb) {
        if (node == null) return;
        sb.append(node.val).append(',');
        preorder(node.left, sb);
        preorder(node.right, sb);
    }
}$JAVA$,$CPP$class Solution {
public:
    string serialize(TreeNode* root) {
        string result;
        function<void(TreeNode*)> preorder = [&](TreeNode* node) {
            if (!node) return;
            if (!result.empty()) result += ",";
            result += to_string(node->val);
            preorder(node->left);
            preorder(node->right);
        };
        preorder(root);
        return result;
    }
};$CPP$,'O(n)','O(n)');

COMMIT;
