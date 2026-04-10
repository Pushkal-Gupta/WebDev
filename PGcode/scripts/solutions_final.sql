-- Solution approaches: dp (6) + 2d-dp (3) + graphs (5) + advanced-graphs (4) + math (4) + bit-manipulation (4)
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'climbing-stairs','house-robber','coin-change','longest-increasing-subseq','word-break','unique-paths',
  'longest-common-subseq','edit-distance','target-sum',
  'clone-graph','num-islands','course-schedule','rotting-oranges','pacific-atlantic',
  'alien-dictionary','network-delay','swim-in-water','cheapest-flights',
  'happy-number','rotate-image','set-matrix-zeroes','spiral-matrix',
  'single-number','number-of-1-bits','counting-bits','reverse-bits'
);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES

-- ==================== DP ====================

('climbing-stairs', 1, 'Fibonacci-Style DP',
'ways(n) = ways(n-1) + ways(n-2) because the last step is either 1 or 2 stairs. Track only the previous two values — no array needed.',
'["If n <= 2, return n.","a = 1, b = 2.","For i from 3 to n: c = a + b; a = b; b = c.","Return b."]'::jsonb,
$PY$class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b
$PY$,
$JS$var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
};
$JS$,
$JAVA$class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('house-robber', 1, 'Rolling DP',
'At each house choose max(skip this one, rob this one + best two houses back). Only the last two best values are needed.',
'["prev2 = 0, prev1 = 0.","For each num: current = max(prev1, prev2 + num); prev2 = prev1; prev1 = current.","Return prev1."]'::jsonb,
$PY$class Solution:
    def rob(self, nums: List[int]) -> int:
        prev1 = prev2 = 0
        for num in nums:
            prev1, prev2 = max(prev1, prev2 + num), prev1
        return prev1
$PY$,
$JS$var rob = function(nums) {
    let prev1 = 0, prev2 = 0;
    for (const num of nums) {
        const current = Math.max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
};
$JS$,
$JAVA$class Solution {
    public int rob(int[] nums) {
        int prev1 = 0, prev2 = 0;
        for (int num : nums) {
            int current = Math.max(prev1, prev2 + num);
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('coin-change', 1, 'Bottom-Up DP',
'dp[a] = minimum coins to make amount a. dp[0] = 0 and everything else starts at infinity. Relax via dp[a] = min(dp[a], dp[a - c] + 1) for each coin c.',
'["dp = [amount + 1] * (amount + 1); dp[0] = 0.","For a from 1 to amount: for c in coins if c <= a: dp[a] = min(dp[a], dp[a - c] + 1).","Return dp[amount] if it is not the sentinel, else -1."]'::jsonb,
$PY$class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = amount + 1
        dp = [INF] * (amount + 1)
        dp[0] = 0
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)
        return dp[amount] if dp[amount] != INF else -1
$PY$,
$JS$var coinChange = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
    }
    return dp[amount] === INF ? -1 : dp[amount];
};
$JS$,
$JAVA$class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
}
$JAVA$,
'O(amount * n)', 'O(amount)'),

('longest-increasing-subseq', 1, 'DP Array (O(n^2))',
'dp[i] is the length of the longest strictly increasing subsequence ending at index i. dp[i] = 1 + max(dp[j] for j < i where nums[j] < nums[i]). Answer is max(dp).',
'["dp = [1] * n.","For i from 1 to n - 1: for j from 0 to i - 1: if nums[j] < nums[i], dp[i] = max(dp[i], dp[j] + 1).","Return max(dp)."]'::jsonb,
$PY$class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        dp = [1] * len(nums)
        for i in range(1, len(nums)):
            for j in range(i):
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j] + 1)
        return max(dp)
$PY$,
$JS$var lengthOfLIS = function(nums) {
    const dp = new Array(nums.length).fill(1);
    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
    }
    return Math.max(...dp);
};
$JS$,
$JAVA$class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] dp = new int[nums.length];
        Arrays.fill(dp, 1);
        int best = 1;
        for (int i = 1; i < nums.length; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
            }
            best = Math.max(best, dp[i]);
        }
        return best;
    }
}
$JAVA$,
'O(n^2)', 'O(n)'),

('word-break', 1, 'DP with Word Set',
'dp[i] is true iff s[0:i] can be segmented. dp[i] is true if any j < i has dp[j] true AND s[j:i] is a dictionary word.',
'["words = set(wordDict); dp = [False] * (n + 1); dp[0] = True.","For i from 1 to n: for j from 0 to i - 1: if dp[j] and s[j:i] in words: dp[i] = True; break.","Return dp[n]."]'::jsonb,
$PY$class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]
$PY$,
$JS$var wordBreak = function(s, wordDict) {
    const words = new Set(wordDict);
    const n = s.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j < i; j++) {
            if (dp[j] && words.has(s.slice(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[n];
};
$JS$,
$JAVA$class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> words = new HashSet<>(wordDict);
        int n = s.length();
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.contains(s.substring(j, i))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[n];
    }
}
$JAVA$,
'O(n^2 * L)', 'O(n)'),

('unique-paths', 1, '1D DP Rolling Row',
'dp[j] in row i = dp[j] (from row i-1) + dp[j-1] (from row i, left neighbor). The first row/column are all 1 because there is only one way to reach them.',
'["dp = [1] * n.","For i from 1 to m - 1: for j from 1 to n - 1: dp[j] += dp[j - 1].","Return dp[n - 1]."]'::jsonb,
$PY$class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        dp = [1] * n
        for i in range(1, m):
            for j in range(1, n):
                dp[j] += dp[j - 1]
        return dp[n - 1]
$PY$,
$JS$var uniquePaths = function(m, n) {
    const dp = new Array(n).fill(1);
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp[n - 1];
};
$JS$,
$JAVA$class Solution {
    public int uniquePaths(int m, int n) {
        int[] dp = new int[n];
        Arrays.fill(dp, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[j] += dp[j - 1];
            }
        }
        return dp[n - 1];
    }
}
$JAVA$,
'O(m * n)', 'O(n)'),

-- ==================== 2D-DP ====================

('longest-common-subseq', 1, '2D DP Table',
'dp[i][j] is the LCS length of text1[:i] and text2[:j]. If the last characters match, extend the diagonal; otherwise take max of dropping either end.',
'["dp = (m + 1) x (n + 1) zero-filled.","For i in 1..m, j in 1..n: if text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1.","Else dp[i][j] = max(dp[i-1][j], dp[i][j-1]).","Return dp[m][n]."]'::jsonb,
$PY$class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if text1[i - 1] == text2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]
$PY$,
$JS$var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
};
$JS$,
$JAVA$class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
}
$JAVA$,
'O(m * n)', 'O(m * n)'),

('edit-distance', 1, 'Levenshtein DP',
'dp[i][j] = edit distance between word1[:i] and word2[:j]. Base cases: converting to or from the empty string costs the length. If chars match, copy the diagonal; otherwise +1 over the best of insert/delete/replace.',
'["dp = (m + 1) x (n + 1). dp[i][0] = i, dp[0][j] = j.","For i in 1..m, j in 1..n: if word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1].","Else dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).","Return dp[m][n]."]'::jsonb,
$PY$class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1): dp[i][0] = i
        for j in range(n + 1): dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        return dp[m][n]
$PY$,
$JS$var minDistance = function(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
};
$JS$,
$JAVA$class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j], Math.min(dp[i][j - 1], dp[i - 1][j - 1]));
            }
        }
        return dp[m][n];
    }
}
$JAVA$,
'O(m * n)', 'O(m * n)'),

('target-sum', 1, 'Subset-Sum Reformulation',
'Assigning +/- signs is equivalent to partitioning nums into positive and negative subsets. If their difference is target, sum(positive) = (target + total) / 2. Classic 0/1 subset-sum DP then counts the ways.',
'["total = sum(nums). If (target + total) is odd or abs(target) > total, return 0.","subset = (target + total) // 2.","dp = [0] * (subset + 1); dp[0] = 1.","For num in nums: for s from subset down to num: dp[s] += dp[s - num].","Return dp[subset]."]'::jsonb,
$PY$class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        total = sum(nums)
        if abs(target) > total or (target + total) % 2:
            return 0
        subset = (target + total) // 2
        dp = [0] * (subset + 1)
        dp[0] = 1
        for num in nums:
            for s in range(subset, num - 1, -1):
                dp[s] += dp[s - num]
        return dp[subset]
$PY$,
$JS$var findTargetSumWays = function(nums, target) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (Math.abs(target) > total || (target + total) % 2 !== 0) return 0;
    const subset = (target + total) / 2;
    const dp = new Array(subset + 1).fill(0);
    dp[0] = 1;
    for (const num of nums) {
        for (let s = subset; s >= num; s--) dp[s] += dp[s - num];
    }
    return dp[subset];
};
$JS$,
$JAVA$class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int n : nums) total += n;
        if (Math.abs(target) > total || (target + total) % 2 != 0) return 0;
        int subset = (target + total) / 2;
        int[] dp = new int[subset + 1];
        dp[0] = 1;
        for (int num : nums) {
            for (int s = subset; s >= num; s--) dp[s] += dp[s - num];
        }
        return dp[subset];
    }
}
$JAVA$,
'O(n * subset)', 'O(subset)'),

-- ==================== GRAPHS ====================

('clone-graph', 1, 'BFS with Hash Map',
'Use a map from original node to cloned node. BFS the original graph; on first visit create the clone and enqueue, then wire up cloned neighbors.',
'["If node is null, return null. Create clones = {node: Node(node.val)}.","queue = [node].","While queue: u = queue.pop(); for each neighbor v of u: if v not in clones, clones[v] = Node(v.val); queue.append(v).","clones[u].neighbors.append(clones[v]).","Return clones[node]."]'::jsonb,
$PY$class Solution:
    def cloneGraph(self, node):
        if not node:
            return None
        from collections import deque
        clones = {node: Node(node.val)}
        queue = deque([node])
        while queue:
            u = queue.popleft()
            for v in u.neighbors:
                if v not in clones:
                    clones[v] = Node(v.val)
                    queue.append(v)
                clones[u].neighbors.append(clones[v])
        return clones[node]
$PY$,
$JS$var cloneGraph = function(node) {
    if (!node) return null;
    const clones = new Map();
    clones.set(node, new Node(node.val));
    const queue = [node];
    while (queue.length) {
        const u = queue.shift();
        for (const v of u.neighbors) {
            if (!clones.has(v)) {
                clones.set(v, new Node(v.val));
                queue.push(v);
            }
            clones.get(u).neighbors.push(clones.get(v));
        }
    }
    return clones.get(node);
};
$JS$,
$JAVA$class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Map<Node, Node> clones = new HashMap<>();
        clones.put(node, new Node(node.val));
        Deque<Node> queue = new ArrayDeque<>();
        queue.offer(node);
        while (!queue.isEmpty()) {
            Node u = queue.poll();
            for (Node v : u.neighbors) {
                if (!clones.containsKey(v)) {
                    clones.put(v, new Node(v.val));
                    queue.offer(v);
                }
                clones.get(u).neighbors.add(clones.get(v));
            }
        }
        return clones.get(node);
    }
}
$JAVA$,
'O(V + E)', 'O(V)'),

('num-islands', 1, 'DFS Flood Fill',
'Scan every cell. On each unvisited "1", bump the island counter and DFS to sink the entire connected component (mark as "0" or visited).',
'["count = 0.","For each cell (r, c): if grid[r][c] == ''1'': count += 1; dfs(r, c).","dfs(r, c) marks (r, c) as visited (overwrite with ''0'') and recurses into 4 neighbors that are also ''1''.","Return count."]'::jsonb,
$PY$class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1
                    dfs(r, c)
        return count
$PY$,
$JS$var numIslands = function(grid) {
    if (!grid.length) return 0;
    const rows = grid.length, cols = grid[0].length;
    let count = 0;
    const dfs = (r, c) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] === '1') { count++; dfs(r, c); }
    }
    return count;
};
$JS$,
$JAVA$class Solution {
    public int numIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int count = 0;
        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') { count++; dfs(grid, r, c); }
        }
        return count;
    }
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c); dfs(grid, r - 1, c); dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
}
$JAVA$,
'O(m * n)', 'O(m * n)'),

('course-schedule', 1, 'Kahn''s Topological Sort',
'Track in-degrees. Start with all zero-indegree courses in a queue. Each time you "take" one, decrement its dependents; if a dependent''s in-degree reaches 0, enqueue it. If you take every course, there is no cycle.',
'["Build an adjacency list + in-degree array.","Queue = nodes with in-degree 0.","While queue: u = pop; taken += 1. For each v in adj[u]: decrement in-degree; if 0, enqueue v.","Return taken == numCourses."]'::jsonb,
$PY$class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        from collections import deque
        adj = [[] for _ in range(numCourses)]
        indeg = [0] * numCourses
        for a, b in prerequisites:
            adj[b].append(a)
            indeg[a] += 1
        queue = deque(i for i in range(numCourses) if indeg[i] == 0)
        taken = 0
        while queue:
            u = queue.popleft()
            taken += 1
            for v in adj[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    queue.append(v)
        return taken == numCourses
$PY$,
$JS$var canFinish = function(numCourses, prerequisites) {
    const adj = Array.from({ length: numCourses }, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) {
        adj[b].push(a);
        indeg[a]++;
    }
    const queue = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
    let taken = 0;
    while (queue.length) {
        const u = queue.shift();
        taken++;
        for (const v of adj[u]) {
            if (--indeg[v] === 0) queue.push(v);
        }
    }
    return taken === numCourses;
};
$JS$,
$JAVA$class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] indeg = new int[numCourses];
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indeg[p[0]]++;
        }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.offer(i);
        int taken = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            taken++;
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) queue.offer(v);
            }
        }
        return taken == numCourses;
    }
}
$JAVA$,
'O(V + E)', 'O(V + E)'),

('rotting-oranges', 1, 'Multi-Source BFS',
'Seed the BFS queue with every initially rotten cell at time 0. Process level by level; each level = one minute. After BFS, if any fresh orange remains, return -1.',
'["Count fresh oranges and push rotten ones into a queue with time 0.","BFS: pop (r, c, t). For each of 4 neighbors that is fresh: mark rotten; decrement fresh count; push with t + 1.","Track the max time seen.","Return max_time if fresh == 0 else -1."]'::jsonb,
$PY$class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        from collections import deque
        rows, cols = len(grid), len(grid[0])
        queue = deque()
        fresh = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c, 0))
                elif grid[r][c] == 1:
                    fresh += 1
        max_time = 0
        while queue:
            r, c, t = queue.popleft()
            max_time = max(max_time, t)
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc, t + 1))
        return max_time if fresh == 0 else -1
$PY$,
$JS$var orangesRotting = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const queue = [];
    let fresh = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 2) queue.push([r, c, 0]);
        else if (grid[r][c] === 1) fresh++;
    }
    let maxTime = 0;
    while (queue.length) {
        const [r, c, t] = queue.shift();
        maxTime = Math.max(maxTime, t);
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
                grid[nr][nc] = 2;
                fresh--;
                queue.push([nr, nc, t + 1]);
            }
        }
    }
    return fresh === 0 ? maxTime : -1;
};
$JS$,
$JAVA$class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        Deque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {
            if (grid[r][c] == 2) queue.offer(new int[]{r, c, 0});
            else if (grid[r][c] == 1) fresh++;
        }
        int maxTime = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            maxTime = Math.max(maxTime, cell[2]);
            for (int[] d : dirs) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    queue.offer(new int[]{nr, nc, cell[2] + 1});
                }
            }
        }
        return fresh == 0 ? maxTime : -1;
    }
}
$JAVA$,
'O(m * n)', 'O(m * n)'),

('pacific-atlantic', 1, 'Reverse Flow BFS from Borders',
'Instead of flowing downhill from each cell, flow UPHILL from both oceans and find which cells each ocean can reach. The answer is the intersection.',
'["BFS/DFS from all Pacific border cells, marking reachable cells (neighbor height >= current).","Do the same from Atlantic border cells.","For each cell reachable by both, add to the result."]'::jsonb,
$PY$class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        rows, cols = len(heights), len(heights[0])
        pac = set()
        atl = set()
        def dfs(r, c, visited):
            visited.add((r, c))
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if (0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited
                        and heights[nr][nc] >= heights[r][c]):
                    dfs(nr, nc, visited)
        for c in range(cols):
            dfs(0, c, pac)
            dfs(rows - 1, c, atl)
        for r in range(rows):
            dfs(r, 0, pac)
            dfs(r, cols - 1, atl)
        return [list(cell) for cell in pac & atl]
$PY$,
$JS$var pacificAtlantic = function(heights) {
    const rows = heights.length, cols = heights[0].length;
    const pac = new Set(), atl = new Set();
    const dfs = (r, c, visited) => {
        visited.add(r * cols + c);
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                    && !visited.has(nr * cols + nc) && heights[nr][nc] >= heights[r][c]) {
                dfs(nr, nc, visited);
            }
        }
    };
    for (let c = 0; c < cols; c++) { dfs(0, c, pac); dfs(rows - 1, c, atl); }
    for (let r = 0; r < rows; r++) { dfs(r, 0, pac); dfs(r, cols - 1, atl); }
    const result = [];
    for (const cell of pac) if (atl.has(cell)) result.push([Math.floor(cell / cols), cell % cols]);
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int rows = heights.length, cols = heights[0].length;
        boolean[][] pac = new boolean[rows][cols];
        boolean[][] atl = new boolean[rows][cols];
        for (int c = 0; c < cols; c++) { dfs(heights, 0, c, pac); dfs(heights, rows - 1, c, atl); }
        for (int r = 0; r < rows; r++) { dfs(heights, r, 0, pac); dfs(heights, r, cols - 1, atl); }
        List<List<Integer>> result = new ArrayList<>();
        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++)
            if (pac[r][c] && atl[r][c]) result.add(Arrays.asList(r, c));
        return result;
    }
    private void dfs(int[][] h, int r, int c, boolean[][] v) {
        v[r][c] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < h.length && nc >= 0 && nc < h[0].length && !v[nr][nc] && h[nr][nc] >= h[r][c]) {
                dfs(h, nr, nc, v);
            }
        }
    }
}
$JAVA$,
'O(m * n)', 'O(m * n)'),

-- ==================== ADVANCED-GRAPHS ====================

('alien-dictionary', 1, 'Build Graph + Topo Sort',
'Each adjacent pair of words gives one ordering constraint: the first mismatching character in word A must come before the one in word B. Build a graph, then topologically sort.',
'["Collect all chars into adj (empty lists) and indeg (zeros).","For each adjacent word pair, find the first mismatch and add an edge a -> b; handle the invalid prefix case (longer word comes first).","Kahn''s BFS from zero-indegree chars.","If you visit all chars, return the order; otherwise return \"\"."]'::jsonb,
$PY$class Solution:
    def alienOrder(self, words: List[str]) -> str:
        from collections import defaultdict, deque
        adj = defaultdict(set)
        indeg = {c: 0 for w in words for c in w}
        for i in range(len(words) - 1):
            a, b = words[i], words[i + 1]
            if len(a) > len(b) and a.startswith(b):
                return ""
            for x, y in zip(a, b):
                if x != y:
                    if y not in adj[x]:
                        adj[x].add(y)
                        indeg[y] += 1
                    break
        queue = deque([c for c in indeg if indeg[c] == 0])
        result = []
        while queue:
            c = queue.popleft()
            result.append(c)
            for n in adj[c]:
                indeg[n] -= 1
                if indeg[n] == 0:
                    queue.append(n)
        return "".join(result) if len(result) == len(indeg) else ""
$PY$,
$JS$var alienOrder = function(words) {
    const adj = {}, indeg = {};
    for (const w of words) for (const c of w) {
        if (!(c in adj)) { adj[c] = new Set(); indeg[c] = 0; }
    }
    for (let i = 0; i < words.length - 1; i++) {
        const a = words[i], b = words[i + 1];
        if (a.length > b.length && a.startsWith(b)) return "";
        for (let j = 0; j < Math.min(a.length, b.length); j++) {
            if (a[j] !== b[j]) {
                if (!adj[a[j]].has(b[j])) {
                    adj[a[j]].add(b[j]);
                    indeg[b[j]]++;
                }
                break;
            }
        }
    }
    const queue = [];
    for (const c in indeg) if (indeg[c] === 0) queue.push(c);
    const result = [];
    while (queue.length) {
        const c = queue.shift();
        result.push(c);
        for (const n of adj[c]) {
            if (--indeg[n] === 0) queue.push(n);
        }
    }
    return result.length === Object.keys(indeg).length ? result.join('') : "";
};
$JS$,
$JAVA$class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new HashMap<>();
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words) for (char c : w.toCharArray()) {
            adj.putIfAbsent(c, new HashSet<>());
            indeg.putIfAbsent(c, 0);
        }
        for (int i = 0; i < words.length - 1; i++) {
            String a = words[i], b = words[i + 1];
            if (a.length() > b.length() && a.startsWith(b)) return "";
            for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
                char x = a.charAt(j), y = b.charAt(j);
                if (x != y) {
                    if (adj.get(x).add(y)) indeg.merge(y, 1, Integer::sum);
                    break;
                }
            }
        }
        Deque<Character> queue = new ArrayDeque<>();
        for (var e : indeg.entrySet()) if (e.getValue() == 0) queue.offer(e.getKey());
        StringBuilder sb = new StringBuilder();
        while (!queue.isEmpty()) {
            char c = queue.poll();
            sb.append(c);
            for (char n : adj.get(c)) {
                indeg.merge(n, -1, Integer::sum);
                if (indeg.get(n) == 0) queue.offer(n);
            }
        }
        return sb.length() == indeg.size() ? sb.toString() : "";
    }
}
$JAVA$,
'O(C)', 'O(1)'),

('network-delay', 1, 'Dijkstra',
'Single-source shortest path on a graph with non-negative weights is a textbook Dijkstra problem. Pop the closest unfinalized node, relax its edges, and push improved neighbors onto a min-heap.',
'["Build adjacency list adj[u] = [(v, w), ...].","dist = {node: infinity}, dist[k] = 0, heap = [(0, k)].","While heap: d, u = heappop. If d > dist[u], skip. For each (v, w) in adj[u]: if d + w < dist[v], update and push.","Return max(dist.values()) if all finite, else -1."]'::jsonb,
$PY$class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        import heapq
        adj = [[] for _ in range(n + 1)]
        for u, v, w in times:
            adj[u].append((v, w))
        dist = [float('inf')] * (n + 1)
        dist[k] = 0
        heap = [(0, k)]
        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            for v, w in adj[u]:
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(heap, (d + w, v))
        max_dist = max(dist[1:])
        return max_dist if max_dist != float('inf') else -1
$PY$,
$JS$var networkDelayTime = function(times, n, k) {
    const adj = Array.from({ length: n + 1 }, () => []);
    for (const [u, v, w] of times) adj[u].push([v, w]);
    const dist = new Array(n + 1).fill(Infinity);
    dist[k] = 0;
    const heap = [[0, k]];
    while (heap.length) {
        heap.sort((a, b) => a[0] - b[0]);
        const [d, u] = heap.shift();
        if (d > dist[u]) continue;
        for (const [v, w] of adj[u]) {
            if (d + w < dist[v]) {
                dist[v] = d + w;
                heap.push([d + w, v]);
            }
        }
    }
    let max = 0;
    for (let i = 1; i <= n; i++) max = Math.max(max, dist[i]);
    return max === Infinity ? -1 : max;
};
$JS$,
$JAVA$class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{0, k});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;
            for (int[] e : adj.get(u)) {
                if (d + e[1] < dist[e[0]]) {
                    dist[e[0]] = d + e[1];
                    heap.offer(new int[]{d + e[1], e[0]});
                }
            }
        }
        int max = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            max = Math.max(max, dist[i]);
        }
        return max;
    }
}
$JAVA$,
'O((V + E) log V)', 'O(V + E)'),

('swim-in-water', 1, 'Dijkstra with Max-Path Weight',
'We want the path from (0,0) to (n-1,n-1) that minimizes the maximum elevation seen. Use Dijkstra where edge weights are bar elevations and the path "cost" is max (not sum).',
'["heap = [(grid[0][0], 0, 0)], visited = {(0,0)}.","While heap: t, r, c = heappop. If (r, c) == (n-1, n-1), return t.","For each neighbor (nr, nc): if not visited, push (max(t, grid[nr][nc]), nr, nc); mark visited."]'::jsonb,
$PY$class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        import heapq
        n = len(grid)
        heap = [(grid[0][0], 0, 0)]
        visited = {(0, 0)}
        while heap:
            t, r, c = heapq.heappop(heap)
            if (r, c) == (n - 1, n - 1):
                return t
            for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    heapq.heappush(heap, (max(t, grid[nr][nc]), nr, nc))
        return -1
$PY$,
$JS$var swimInWater = function(grid) {
    const n = grid.length;
    const heap = [[grid[0][0], 0, 0]];
    const visited = new Set(['0,0']);
    while (heap.length) {
        heap.sort((a, b) => a[0] - b[0]);
        const [t, r, c] = heap.shift();
        if (r === n - 1 && c === n - 1) return t;
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.has(`${nr},${nc}`)) {
                visited.add(`${nr},${nc}`);
                heap.push([Math.max(t, grid[nr][nc]), nr, nc]);
            }
        }
    }
    return -1;
};
$JS$,
$JAVA$class Solution {
    public int swimInWater(int[][] grid) {
        int n = grid.length;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{grid[0][0], 0, 0});
        boolean[][] visited = new boolean[n][n];
        visited[0][0] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int t = top[0], r = top[1], c = top[2];
            if (r == n - 1 && c == n - 1) return t;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    heap.offer(new int[]{Math.max(t, grid[nr][nc]), nr, nc});
                }
            }
        }
        return -1;
    }
}
$JAVA$,
'O(n^2 log n)', 'O(n^2)'),

('cheapest-flights', 1, 'Bellman-Ford (k+1 Relaxations)',
'With at most k stops, we can relax all edges at most k + 1 times. Each iteration uses a snapshot of the previous prices so that no edge is used more than once per iteration.',
'["prices = [inf] * n; prices[src] = 0.","For i in range(k + 1): tmp = prices.copy(); for each edge (u, v, w): if prices[u] + w < tmp[v], tmp[v] = prices[u] + w. prices = tmp.","Return prices[dst] if not inf else -1."]'::jsonb,
$PY$class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        prices = [float('inf')] * n
        prices[src] = 0
        for _ in range(k + 1):
            tmp = prices.copy()
            for u, v, w in flights:
                if prices[u] + w < tmp[v]:
                    tmp[v] = prices[u] + w
            prices = tmp
        return prices[dst] if prices[dst] != float('inf') else -1
$PY$,
$JS$var findCheapestPrice = function(n, flights, src, dst, k) {
    let prices = new Array(n).fill(Infinity);
    prices[src] = 0;
    for (let i = 0; i <= k; i++) {
        const tmp = prices.slice();
        for (const [u, v, w] of flights) {
            if (prices[u] + w < tmp[v]) tmp[v] = prices[u] + w;
        }
        prices = tmp;
    }
    return prices[dst] === Infinity ? -1 : prices[dst];
};
$JS$,
$JAVA$class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        int[] prices = new int[n];
        Arrays.fill(prices, Integer.MAX_VALUE);
        prices[src] = 0;
        for (int i = 0; i <= k; i++) {
            int[] tmp = prices.clone();
            for (int[] f : flights) {
                if (prices[f[0]] == Integer.MAX_VALUE) continue;
                if (prices[f[0]] + f[2] < tmp[f[1]]) tmp[f[1]] = prices[f[0]] + f[2];
            }
            prices = tmp;
        }
        return prices[dst] == Integer.MAX_VALUE ? -1 : prices[dst];
    }
}
$JAVA$,
'O((k + 1) * E)', 'O(n)'),

-- ==================== MATH ====================

('happy-number', 1, 'Floyd Cycle Detection',
'The sum-of-squared-digits transformation either reaches 1 or enters a cycle. Use slow/fast pointers to detect the cycle in O(1) space.',
'["Define next(n) = sum of squares of digits of n.","slow = n, fast = next(n).","While fast != 1 and slow != fast: slow = next(slow); fast = next(next(fast)).","Return fast == 1."]'::jsonb,
$PY$class Solution:
    def isHappy(self, n: int) -> bool:
        def nxt(x):
            total = 0
            while x:
                d = x % 10
                total += d * d
                x //= 10
            return total
        slow, fast = n, nxt(n)
        while fast != 1 and slow != fast:
            slow = nxt(slow)
            fast = nxt(nxt(fast))
        return fast == 1
$PY$,
$JS$var isHappy = function(n) {
    const nxt = x => {
        let total = 0;
        while (x) {
            const d = x % 10;
            total += d * d;
            x = Math.floor(x / 10);
        }
        return total;
    };
    let slow = n, fast = nxt(n);
    while (fast !== 1 && slow !== fast) {
        slow = nxt(slow);
        fast = nxt(nxt(fast));
    }
    return fast === 1;
};
$JS$,
$JAVA$class Solution {
    public boolean isHappy(int n) {
        int slow = n, fast = next(n);
        while (fast != 1 && slow != fast) {
            slow = next(slow);
            fast = next(next(fast));
        }
        return fast == 1;
    }
    private int next(int x) {
        int total = 0;
        while (x > 0) {
            int d = x % 10;
            total += d * d;
            x /= 10;
        }
        return total;
    }
}
$JAVA$,
'O(log n)', 'O(1)'),

('rotate-image', 1, 'Transpose + Reverse Rows',
'Rotating 90 degrees clockwise equals transpose followed by reversing each row. Both steps are in-place.',
'["For i in 0..n-1, for j in i+1..n-1: swap matrix[i][j] with matrix[j][i] (transpose).","For each row, reverse it in place."]'::jsonb,
$PY$class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()
$PY$,
$JS$var rotate = function(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }
    for (const row of matrix) row.reverse();
};
$JS$,
$JAVA$class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int tmp = row[l];
                row[l] = row[r];
                row[r] = tmp;
            }
        }
    }
}
$JAVA$,
'O(n^2)', 'O(1)'),

('set-matrix-zeroes', 1, 'First Row and Column as Markers',
'Use the first row and first column as bitmaps of which rows/cols should be zeroed. Track two booleans separately for whether the first row/column originally held a zero, then apply them last.',
'["firstRowZero = any(matrix[0][j] == 0). firstColZero = any(matrix[i][0] == 0).","For i in 1..m-1, j in 1..n-1: if matrix[i][j] == 0: matrix[i][0] = 0; matrix[0][j] = 0.","Zero out rows and columns marked by the first row/column.","Finally zero out the first row/col if their flags say so."]'::jsonb,
$PY$class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        m, n = len(matrix), len(matrix[0])
        firstRowZero = any(matrix[0][j] == 0 for j in range(n))
        firstColZero = any(matrix[i][0] == 0 for i in range(m))
        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][j] == 0:
                    matrix[i][0] = 0
                    matrix[0][j] = 0
        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][0] == 0 or matrix[0][j] == 0:
                    matrix[i][j] = 0
        if firstRowZero:
            for j in range(n):
                matrix[0][j] = 0
        if firstColZero:
            for i in range(m):
                matrix[i][0] = 0
$PY$,
$JS$var setZeroes = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    let firstRowZero = false, firstColZero = false;
    for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRowZero = true;
    for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstColZero = true;
    for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) {
        if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
    }
    for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) {
        if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
    }
    if (firstRowZero) for (let j = 0; j < n; j++) matrix[0][j] = 0;
    if (firstColZero) for (let i = 0; i < m; i++) matrix[i][0] = 0;
};
$JS$,
$JAVA$class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean firstRowZero = false, firstColZero = false;
        for (int j = 0; j < n; j++) if (matrix[0][j] == 0) firstRowZero = true;
        for (int i = 0; i < m; i++) if (matrix[i][0] == 0) firstColZero = true;
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) {
            if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        }
        for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) {
            if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        }
        if (firstRowZero) for (int j = 0; j < n; j++) matrix[0][j] = 0;
        if (firstColZero) for (int i = 0; i < m; i++) matrix[i][0] = 0;
    }
}
$JAVA$,
'O(m * n)', 'O(1)'),

('spiral-matrix', 1, 'Four Boundaries',
'Keep shrinking boundaries top/bottom/left/right. Walk each side in order and update the boundary after each side. Stop when any boundary crosses.',
'["top = 0, bottom = m - 1, left = 0, right = n - 1, result = [].","While top <= bottom and left <= right: walk top row L->R; top += 1.","Walk right column T->B; right -= 1.","If top <= bottom: walk bottom row R->L; bottom -= 1.","If left <= right: walk left column B->T; left += 1."]'::jsonb,
$PY$class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        result = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for j in range(left, right + 1):
                result.append(matrix[top][j])
            top += 1
            for i in range(top, bottom + 1):
                result.append(matrix[i][right])
            right -= 1
            if top <= bottom:
                for j in range(right, left - 1, -1):
                    result.append(matrix[bottom][j])
                bottom -= 1
            if left <= right:
                for i in range(bottom, top - 1, -1):
                    result.append(matrix[i][left])
                left += 1
        return result
$PY$,
$JS$var spiralOrder = function(matrix) {
    const result = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) result.push(matrix[top][j]);
        top++;
        for (let i = top; i <= bottom; i++) result.push(matrix[i][right]);
        right--;
        if (top <= bottom) {
            for (let j = right; j >= left; j--) result.push(matrix[bottom][j]);
            bottom--;
        }
        if (left <= right) {
            for (let i = bottom; i >= top; i--) result.push(matrix[i][left]);
            left++;
        }
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> result = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) result.add(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) result.add(matrix[i][right]);
            right--;
            if (top <= bottom) {
                for (int j = right; j >= left; j--) result.add(matrix[bottom][j]);
                bottom--;
            }
            if (left <= right) {
                for (int i = bottom; i >= top; i--) result.add(matrix[i][left]);
                left++;
            }
        }
        return result;
    }
}
$JAVA$,
'O(m * n)', 'O(1)'),

-- ==================== BIT-MANIPULATION ====================

('single-number', 1, 'XOR Fold',
'XOR is commutative and a XOR a == 0. XOR-folding the array cancels every paired element and leaves only the unique one.',
'["result = 0.","For each num in nums: result ^= num.","Return result."]'::jsonb,
$PY$class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        result = 0
        for num in nums:
            result ^= num
        return result
$PY$,
$JS$var singleNumber = function(nums) {
    let result = 0;
    for (const num of nums) result ^= num;
    return result;
};
$JS$,
$JAVA$class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int num : nums) result ^= num;
        return result;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

('number-of-1-bits', 1, 'Kernighan Trick',
'n & (n - 1) clears the lowest set bit. Looping until n is 0 performs exactly popcount(n) iterations.',
'["count = 0.","While n != 0: n = n & (n - 1); count += 1.","Return count."]'::jsonb,
$PY$class Solution:
    def hammingWeight(self, n: int) -> int:
        count = 0
        while n:
            n &= n - 1
            count += 1
        return count
$PY$,
$JS$var hammingWeight = function(n) {
    let count = 0;
    while (n !== 0) {
        n &= n - 1;
        count++;
    }
    return count;
};
$JS$,
$JAVA$public class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
}
$JAVA$,
'O(popcount)', 'O(1)'),

('counting-bits', 1, 'DP via Low-Bit Recurrence',
'Every number i has one fewer bit than the number with its lowest set bit cleared: bits[i] = bits[i & (i - 1)] + 1.',
'["bits = [0] * (n + 1).","For i from 1 to n: bits[i] = bits[i & (i - 1)] + 1.","Return bits."]'::jsonb,
$PY$class Solution:
    def countBits(self, n: int) -> List[int]:
        bits = [0] * (n + 1)
        for i in range(1, n + 1):
            bits[i] = bits[i & (i - 1)] + 1
        return bits
$PY$,
$JS$var countBits = function(n) {
    const bits = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) bits[i] = bits[i & (i - 1)] + 1;
    return bits;
};
$JS$,
$JAVA$class Solution {
    public int[] countBits(int n) {
        int[] bits = new int[n + 1];
        for (int i = 1; i <= n; i++) bits[i] = bits[i & (i - 1)] + 1;
        return bits;
    }
}
$JAVA$,
'O(n)', 'O(n)'),

('reverse-bits', 1, '32 Iterations Shift',
'Loop 32 times: shift result left by 1 and OR in the current lowest bit of n, then shift n right by 1.',
'["result = 0.","For i from 0 to 31: result = (result << 1) | (n & 1); n = n >> 1.","Return result."]'::jsonb,
$PY$class Solution:
    def reverseBits(self, n: int) -> int:
        result = 0
        for _ in range(32):
            result = (result << 1) | (n & 1)
            n >>= 1
        return result
$PY$,
$JS$var reverseBits = function(n) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        result = (result << 1) | (n & 1);
        n >>>= 1;
    }
    return result >>> 0;
};
$JS$,
$JAVA$public class Solution {
    public int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);
            n >>>= 1;
        }
        return result;
    }
}
$JAVA$,
'O(1)', 'O(1)');

COMMIT;
SELECT (SELECT COUNT(*) FROM public."PGcode_solution_approaches") AS total_solutions,
       (SELECT COUNT(*) FROM public."PGcode_problems") AS total_problems,
       (SELECT COUNT(*) FROM public."PGcode_problems" p WHERE NOT EXISTS (SELECT 1 FROM public."PGcode_solution_approaches" sa WHERE sa.problem_id=p.id)) AS still_missing;
