-- Grow catalog 300 → 400: 2d-dp topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'maximal-square','minimum-path-sum','unique-paths-ii','longest-common-subsequence',
  'triangle-min-path-sum','min-falling-path-sum','dungeon-game','cherry-pickup'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'maximal-square','minimum-path-sum','unique-paths-ii','longest-common-subsequence',
  'triangle-min-path-sum','min-falling-path-sum','dungeon-game','cherry-pickup'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'maximal-square','minimum-path-sum','unique-paths-ii','longest-common-subsequence',
  'triangle-min-path-sum','min-falling-path-sum','dungeon-game','cherry-pickup'
);

-- 1) maximal-square (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('maximal-square','2d-dp','Maximal Square','Easy',
$$<p>Given an <code>m x n</code> binary matrix filled with <code>0</code>s and <code>1</code>s, find the largest square containing only <code>1</code>s and return its area.</p>$$,
'',ARRAY['dp[i][j] = side length of largest square with bottom-right at (i,j).','If matrix[i][j] == "1", dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1.','Track the maximum side length seen.'],
'400','https://leetcode.com/problems/maximal-square/',
'maximalSquare','[{"name":"matrix","type":"List[List[str]]"}]'::jsonb,'int',
'[{"inputs":["[[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]"],"expected":"4"},{"inputs":["[[\"0\",\"1\"],[\"1\",\"0\"]]"],"expected":"1"},{"inputs":["[[\"0\"]]"],"expected":"0"},{"inputs":["[[\"1\",\"1\"],[\"1\",\"1\"]]"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('maximal-square','python',$PY$class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        $PY$),
('maximal-square','javascript',$JS$var maximalSquare = function(matrix) {

};$JS$),
('maximal-square','java',$JAVA$class Solution {
    public int maximalSquare(char[][] matrix) {

    }
}$JAVA$),
('maximal-square','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('maximal-square',1,'Dynamic Programming',
'Build a DP table where each cell stores the side length of the largest all-1s square ending at that cell.',
'["Create dp table of same size, initialized to 0.","For each cell (i,j) where matrix[i][j]==\"1\": dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1.","Track max side length. Return max_side * max_side."]'::jsonb,
$PY$class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        if not matrix:
            return 0
        m, n = len(matrix), len(matrix[0])
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        max_side = 0
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if matrix[i - 1][j - 1] == '1':
                    dp[i][j] = min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
                    max_side = max(max_side, dp[i][j])
        return max_side * max_side
$PY$,
$JS$var maximalSquare = function(matrix) {
    if (!matrix.length) return 0;
    const m = matrix.length, n = matrix[0].length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    let maxSide = 0;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (matrix[i - 1][j - 1] === '1') {
                dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
                maxSide = Math.max(maxSide, dp[i][j]);
            }
        }
    }
    return maxSide * maxSide;
};
$JS$,
$JAVA$class Solution {
    public int maximalSquare(char[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] dp = new int[m + 1][n + 1];
        int maxSide = 0;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (matrix[i - 1][j - 1] == '1') {
                    dp[i][j] = Math.min(Math.min(dp[i - 1][j], dp[i][j - 1]), dp[i - 1][j - 1]) + 1;
                    maxSide = Math.max(maxSide, dp[i][j]);
                }
            }
        }
        return maxSide * maxSide;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        int maxSide = 0;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (matrix[i - 1][j - 1] == '1') {
                    dp[i][j] = min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]}) + 1;
                    maxSide = max(maxSide, dp[i][j]);
                }
            }
        }
        return maxSide * maxSide;
    }
};
$CPP$,'O(m * n)','O(m * n)');

-- 2) minimum-path-sum (Easy)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('minimum-path-sum','2d-dp','Minimum Path Sum','Easy',
$$<p>Given an <code>m x n</code> grid filled with non-negative numbers, find a path from top-left to bottom-right that minimizes the sum of all numbers along its path. You can only move right or down at any step.</p>$$,
'',ARRAY['dp[i][j] = minimum sum to reach cell (i,j).','dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).','Initialize first row and first column by accumulating.'],
'400','https://leetcode.com/problems/minimum-path-sum/',
'minPathSum','[{"name":"grid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[1,3,1],[1,5,1],[4,2,1]]"],"expected":"7"},{"inputs":["[[1,2,3],[4,5,6]]"],"expected":"12"},{"inputs":["[[1]]"],"expected":"1"},{"inputs":["[[1,2],[1,1]]"],"expected":"3"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('minimum-path-sum','python',$PY$class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        $PY$),
('minimum-path-sum','javascript',$JS$var minPathSum = function(grid) {

};$JS$),
('minimum-path-sum','java',$JAVA$class Solution {
    public int minPathSum(int[][] grid) {

    }
}$JAVA$),
('minimum-path-sum','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('minimum-path-sum',1,'Dynamic Programming',
'Each cell stores the minimum cost to reach it from the top-left. We can only come from the left or above.',
'["Initialize dp as a copy of grid.","Fill first row: dp[0][j] += dp[0][j-1]. Fill first col: dp[i][0] += dp[i-1][0].","For remaining cells: dp[i][j] += min(dp[i-1][j], dp[i][j-1]).","Return dp[m-1][n-1]."]'::jsonb,
$PY$class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        m, n = len(grid), len(grid[0])
        for i in range(1, m):
            grid[i][0] += grid[i - 1][0]
        for j in range(1, n):
            grid[0][j] += grid[0][j - 1]
        for i in range(1, m):
            for j in range(1, n):
                grid[i][j] += min(grid[i - 1][j], grid[i][j - 1])
        return grid[m - 1][n - 1]
$PY$,
$JS$var minPathSum = function(grid) {
    const m = grid.length, n = grid[0].length;
    for (let i = 1; i < m; i++) grid[i][0] += grid[i - 1][0];
    for (let j = 1; j < n; j++) grid[0][j] += grid[0][j - 1];
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
        }
    }
    return grid[m - 1][n - 1];
};
$JS$,
$JAVA$class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        for (int i = 1; i < m; i++) grid[i][0] += grid[i - 1][0];
        for (int j = 1; j < n; j++) grid[0][j] += grid[0][j - 1];
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
            }
        }
        return grid[m - 1][n - 1];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        for (int i = 1; i < m; i++) grid[i][0] += grid[i - 1][0];
        for (int j = 1; j < n; j++) grid[0][j] += grid[0][j - 1];
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                grid[i][j] += min(grid[i - 1][j], grid[i][j - 1]);
            }
        }
        return grid[m - 1][n - 1];
    }
};
$CPP$,'O(m * n)','O(1) in-place');

-- 3) unique-paths-ii (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('unique-paths-ii','2d-dp','Unique Paths II','Medium',
$$<p>A robot is located at the top-left corner of an <code>m x n</code> grid. The robot can only move right or down. Some cells contain obstacles (marked as <code>1</code>). Return the number of unique paths to the bottom-right corner.</p>$$,
'',ARRAY['If a cell has an obstacle, dp[i][j] = 0.','dp[i][j] = dp[i-1][j] + dp[i][j-1] for non-obstacle cells.','Handle the first row and column carefully — once an obstacle is hit, all subsequent cells in that row/col are 0.'],
'400','https://leetcode.com/problems/unique-paths-ii/',
'uniquePathsWithObstacles','[{"name":"obstacleGrid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[0,0,0],[0,1,0],[0,0,0]]"],"expected":"2"},{"inputs":["[[0,1],[0,0]]"],"expected":"1"},{"inputs":["[[1,0]]"],"expected":"0"},{"inputs":["[[0,0],[0,0]]"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('unique-paths-ii','python',$PY$class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:
        $PY$),
('unique-paths-ii','javascript',$JS$var uniquePathsWithObstacles = function(obstacleGrid) {

};$JS$),
('unique-paths-ii','java',$JAVA$class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) {

    }
}$JAVA$),
('unique-paths-ii','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('unique-paths-ii',1,'Dynamic Programming',
'Same as Unique Paths but set dp to 0 for any obstacle cell.',
'["If start or end is obstacle, return 0.","Create dp grid. dp[0][0] = 1.","Fill first row/col: carry forward 1 until obstacle, then 0.","For each cell: if obstacle dp[i][j]=0 else dp[i][j] = dp[i-1][j] + dp[i][j-1].","Return dp[m-1][n-1]."]'::jsonb,
$PY$class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:
        m, n = len(obstacleGrid), len(obstacleGrid[0])
        if obstacleGrid[0][0] == 1 or obstacleGrid[m - 1][n - 1] == 1:
            return 0
        dp = [[0] * n for _ in range(m)]
        dp[0][0] = 1
        for i in range(1, m):
            dp[i][0] = dp[i - 1][0] if obstacleGrid[i][0] == 0 else 0
        for j in range(1, n):
            dp[0][j] = dp[0][j - 1] if obstacleGrid[0][j] == 0 else 0
        for i in range(1, m):
            for j in range(1, n):
                if obstacleGrid[i][j] == 0:
                    dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
        return dp[m - 1][n - 1]
$PY$,
$JS$var uniquePathsWithObstacles = function(obstacleGrid) {
    const m = obstacleGrid.length, n = obstacleGrid[0].length;
    if (obstacleGrid[0][0] === 1 || obstacleGrid[m - 1][n - 1] === 1) return 0;
    const dp = Array.from({length: m}, () => new Array(n).fill(0));
    dp[0][0] = 1;
    for (let i = 1; i < m; i++) dp[i][0] = obstacleGrid[i][0] === 0 ? dp[i - 1][0] : 0;
    for (let j = 1; j < n; j++) dp[0][j] = obstacleGrid[0][j] === 0 ? dp[0][j - 1] : 0;
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[i][j] = obstacleGrid[i][j] === 0 ? dp[i - 1][j] + dp[i][j - 1] : 0;
        }
    }
    return dp[m - 1][n - 1];
};
$JS$,
$JAVA$class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) {
        int m = obstacleGrid.length, n = obstacleGrid[0].length;
        if (obstacleGrid[0][0] == 1 || obstacleGrid[m - 1][n - 1] == 1) return 0;
        int[][] dp = new int[m][n];
        dp[0][0] = 1;
        for (int i = 1; i < m; i++) dp[i][0] = obstacleGrid[i][0] == 0 ? dp[i - 1][0] : 0;
        for (int j = 1; j < n; j++) dp[0][j] = obstacleGrid[0][j] == 0 ? dp[0][j - 1] : 0;
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = obstacleGrid[i][j] == 0 ? dp[i - 1][j] + dp[i][j - 1] : 0;
            }
        }
        return dp[m - 1][n - 1];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int m = obstacleGrid.size(), n = obstacleGrid[0].size();
        if (obstacleGrid[0][0] == 1 || obstacleGrid[m - 1][n - 1] == 1) return 0;
        vector<vector<int>> dp(m, vector<int>(n, 0));
        dp[0][0] = 1;
        for (int i = 1; i < m; i++) dp[i][0] = obstacleGrid[i][0] == 0 ? dp[i - 1][0] : 0;
        for (int j = 1; j < n; j++) dp[0][j] = obstacleGrid[0][j] == 0 ? dp[0][j - 1] : 0;
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = obstacleGrid[i][j] == 0 ? dp[i - 1][j] + dp[i][j - 1] : 0;
            }
        }
        return dp[m - 1][n - 1];
    }
};
$CPP$,'O(m * n)','O(m * n)');

-- 4) longest-common-subsequence (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('longest-common-subsequence','2d-dp','Longest Common Subsequence','Medium',
$$<p>Given two strings <code>text1</code> and <code>text2</code>, return the length of their longest common subsequence. A subsequence is a sequence derived from another by deleting some or no elements without changing the order of the remaining elements.</p>$$,
'',ARRAY['If text1[i] == text2[j], dp[i][j] = dp[i-1][j-1] + 1.','Otherwise dp[i][j] = max(dp[i-1][j], dp[i][j-1]).','Use a 2D table of size (m+1) x (n+1).'],
'400','https://leetcode.com/problems/longest-common-subsequence/',
'longestCommonSubsequence','[{"name":"text1","type":"str"},{"name":"text2","type":"str"}]'::jsonb,'int',
'[{"inputs":["abcde","ace"],"expected":"3"},{"inputs":["abc","abc"],"expected":"3"},{"inputs":["abc","def"],"expected":"0"},{"inputs":["oxcpqrsvwf","shmtulqrypy"],"expected":"2"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('longest-common-subsequence','python',$PY$class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        $PY$),
('longest-common-subsequence','javascript',$JS$var longestCommonSubsequence = function(text1, text2) {

};$JS$),
('longest-common-subsequence','java',$JAVA$class Solution {
    public int longestCommonSubsequence(String text1, String text2) {

    }
}$JAVA$),
('longest-common-subsequence','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('longest-common-subsequence',1,'2D DP Table',
'Classic 2D DP: match characters and carry forward the best subsequence length.',
'["Create dp table of size (m+1) x (n+1) filled with 0.","For each pair (i,j): if chars match, dp[i][j] = dp[i-1][j-1]+1, else dp[i][j] = max(dp[i-1][j], dp[i][j-1]).","Return dp[m][n]."]'::jsonb,
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
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
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
$CPP$class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.size(), n = text2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1[i - 1] == text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }
};
$CPP$,'O(m * n)','O(m * n)');

-- 5) triangle-min-path-sum (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('triangle-min-path-sum','2d-dp','Triangle','Medium',
$$<p>Given a <code>triangle</code> array, return the minimum path sum from top to bottom. At each step you may move to an adjacent number on the row below (i.e., index <code>i</code> or <code>i+1</code> on the next row).</p>$$,
'',ARRAY['Work bottom-up: start from the last row and collapse upward.','dp[j] = triangle[i][j] + min(dp[j], dp[j+1]).','The answer ends up in dp[0] after processing all rows.'],
'400','https://leetcode.com/problems/triangle/',
'minimumTotal','[{"name":"triangle","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[2],[3,4],[6,5,7],[4,1,8,3]]"],"expected":"11"},{"inputs":["[[-10]]"],"expected":"-10"},{"inputs":["[[-1],[2,3],[1,-1,-3]]"],"expected":"-1"},{"inputs":["[[1],[2,3],[4,5,6]]"],"expected":"7"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('triangle-min-path-sum','python',$PY$class Solution:
    def minimumTotal(self, triangle: List[List[int]]) -> int:
        $PY$),
('triangle-min-path-sum','javascript',$JS$var minimumTotal = function(triangle) {

};$JS$),
('triangle-min-path-sum','java',$JAVA$class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {

    }
}$JAVA$),
('triangle-min-path-sum','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('triangle-min-path-sum',1,'Bottom-Up DP',
'Start from the bottom row and work upward, choosing the minimum adjacent child at each step.',
'["Copy the last row into dp array.","For each row from second-to-last to first: dp[j] = triangle[i][j] + min(dp[j], dp[j+1]).","Return dp[0]."]'::jsonb,
$PY$class Solution:
    def minimumTotal(self, triangle: List[List[int]]) -> int:
        dp = triangle[-1][:]
        for i in range(len(triangle) - 2, -1, -1):
            for j in range(len(triangle[i])):
                dp[j] = triangle[i][j] + min(dp[j], dp[j + 1])
        return dp[0]
$PY$,
$JS$var minimumTotal = function(triangle) {
    const dp = [...triangle[triangle.length - 1]];
    for (let i = triangle.length - 2; i >= 0; i--) {
        for (let j = 0; j < triangle[i].length; j++) {
            dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
        }
    }
    return dp[0];
};
$JS$,
$JAVA$class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {
        int n = triangle.size();
        int[] dp = new int[n];
        for (int j = 0; j < n; j++) dp[j] = triangle.get(n - 1).get(j);
        for (int i = n - 2; i >= 0; i--) {
            for (int j = 0; j <= i; j++) {
                dp[j] = triangle.get(i).get(j) + Math.min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {
        int n = triangle.size();
        vector<int> dp(triangle.back());
        for (int i = n - 2; i >= 0; i--) {
            for (int j = 0; j <= i; j++) {
                dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
};
$CPP$,'O(n^2)','O(n)');

-- 6) min-falling-path-sum (Medium)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('min-falling-path-sum','2d-dp','Minimum Falling Path Sum','Medium',
$$<p>Given an <code>n x n</code> array of integers <code>matrix</code>, return the minimum sum of any falling path. A falling path starts at any element in the first row and chooses one element from each subsequent row. The next row choice must be in a column that is at most one index away.</p>$$,
'',ARRAY['dp[i][j] = matrix[i][j] + min of dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1].','Handle boundary columns carefully.','The answer is the minimum value in the last row of dp.'],
'400','https://leetcode.com/problems/minimum-falling-path-sum/',
'minFallingPathSum','[{"name":"matrix","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[2,1,3],[6,5,4],[7,8,9]]"],"expected":"13"},{"inputs":["[[-19,57],[-40,-5]]"],"expected":"-59"},{"inputs":["[[100]]"],"expected":"100"},{"inputs":["[[-48]]"],"expected":"-48"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('min-falling-path-sum','python',$PY$class Solution:
    def minFallingPathSum(self, matrix: List[List[int]]) -> int:
        $PY$),
('min-falling-path-sum','javascript',$JS$var minFallingPathSum = function(matrix) {

};$JS$),
('min-falling-path-sum','java',$JAVA$class Solution {
    public int minFallingPathSum(int[][] matrix) {

    }
}$JAVA$),
('min-falling-path-sum','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFallingPathSum(vector<vector<int>>& matrix) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('min-falling-path-sum',1,'Dynamic Programming',
'Process row by row. Each cell adds itself to the minimum of the three possible parents above.',
'["For each row from 1 to n-1, for each col j: matrix[i][j] += min of matrix[i-1][j-1..j+1] (bounds checked).","Return min(matrix[n-1])."]'::jsonb,
$PY$class Solution:
    def minFallingPathSum(self, matrix: List[List[int]]) -> int:
        n = len(matrix)
        for i in range(1, n):
            for j in range(n):
                best = matrix[i - 1][j]
                if j > 0:
                    best = min(best, matrix[i - 1][j - 1])
                if j < n - 1:
                    best = min(best, matrix[i - 1][j + 1])
                matrix[i][j] += best
        return min(matrix[n - 1])
$PY$,
$JS$var minFallingPathSum = function(matrix) {
    const n = matrix.length;
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < n; j++) {
            let best = matrix[i - 1][j];
            if (j > 0) best = Math.min(best, matrix[i - 1][j - 1]);
            if (j < n - 1) best = Math.min(best, matrix[i - 1][j + 1]);
            matrix[i][j] += best;
        }
    }
    return Math.min(...matrix[n - 1]);
};
$JS$,
$JAVA$class Solution {
    public int minFallingPathSum(int[][] matrix) {
        int n = matrix.length;
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int best = matrix[i - 1][j];
                if (j > 0) best = Math.min(best, matrix[i - 1][j - 1]);
                if (j < n - 1) best = Math.min(best, matrix[i - 1][j + 1]);
                matrix[i][j] += best;
            }
        }
        int res = Integer.MAX_VALUE;
        for (int v : matrix[n - 1]) res = Math.min(res, v);
        return res;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minFallingPathSum(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int best = matrix[i - 1][j];
                if (j > 0) best = min(best, matrix[i - 1][j - 1]);
                if (j < n - 1) best = min(best, matrix[i - 1][j + 1]);
                matrix[i][j] += best;
            }
        }
        return *min_element(matrix[n - 1].begin(), matrix[n - 1].end());
    }
};
$CPP$,'O(n^2)','O(1) in-place');

-- 7) dungeon-game (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('dungeon-game','2d-dp','Dungeon Game','Hard',
$$<p>The knight has an initial health point. He starts at the top-left room of an <code>m x n</code> dungeon grid and needs to reach the bottom-right princess room. Each room contains a threat (negative) or magic orb (positive). The knight dies if his health drops to 0 or below at any point. Return the minimum initial health needed to reach the princess.</p>$$,
'',ARRAY['Work backwards from the princess cell.','dp[i][j] = min HP needed at cell (i,j) to survive the rest of the path.','dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]).'],
'400','https://leetcode.com/problems/dungeon-game/',
'calculateMinimumHP','[{"name":"dungeon","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[-2,-3,3],[-5,-10,1],[10,30,-5]]"],"expected":"7"},{"inputs":["[[0]]"],"expected":"1"},{"inputs":["[[100]]"],"expected":"1"},{"inputs":["[[-3,5],[-10,1]]"],"expected":"4"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('dungeon-game','python',$PY$class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:
        $PY$),
('dungeon-game','javascript',$JS$var calculateMinimumHP = function(dungeon) {

};$JS$),
('dungeon-game','java',$JAVA$class Solution {
    public int calculateMinimumHP(int[][] dungeon) {

    }
}$JAVA$),
('dungeon-game','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('dungeon-game',1,'Bottom-Up DP (reverse)',
'Work backward from the princess. At each cell compute the minimum HP needed to survive from that cell to the end.',
'["dp[m-1][n-1] = max(1, 1 - dungeon[m-1][n-1]).","Fill last row and last column right-to-left and bottom-to-top.","For each cell: dp[i][j] = max(1, min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]).","Return dp[0][0]."]'::jsonb,
$PY$class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:
        m, n = len(dungeon), len(dungeon[0])
        dp = [[0] * n for _ in range(m)]
        dp[m - 1][n - 1] = max(1, 1 - dungeon[m - 1][n - 1])
        for i in range(m - 2, -1, -1):
            dp[i][n - 1] = max(1, dp[i + 1][n - 1] - dungeon[i][n - 1])
        for j in range(n - 2, -1, -1):
            dp[m - 1][j] = max(1, dp[m - 1][j + 1] - dungeon[m - 1][j])
        for i in range(m - 2, -1, -1):
            for j in range(n - 2, -1, -1):
                dp[i][j] = max(1, min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j])
        return dp[0][0]
$PY$,
$JS$var calculateMinimumHP = function(dungeon) {
    const m = dungeon.length, n = dungeon[0].length;
    const dp = Array.from({length: m}, () => new Array(n).fill(0));
    dp[m - 1][n - 1] = Math.max(1, 1 - dungeon[m - 1][n - 1]);
    for (let i = m - 2; i >= 0; i--) dp[i][n - 1] = Math.max(1, dp[i + 1][n - 1] - dungeon[i][n - 1]);
    for (let j = n - 2; j >= 0; j--) dp[m - 1][j] = Math.max(1, dp[m - 1][j + 1] - dungeon[m - 1][j]);
    for (let i = m - 2; i >= 0; i--) {
        for (let j = n - 2; j >= 0; j--) {
            dp[i][j] = Math.max(1, Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]);
        }
    }
    return dp[0][0];
};
$JS$,
$JAVA$class Solution {
    public int calculateMinimumHP(int[][] dungeon) {
        int m = dungeon.length, n = dungeon[0].length;
        int[][] dp = new int[m][n];
        dp[m - 1][n - 1] = Math.max(1, 1 - dungeon[m - 1][n - 1]);
        for (int i = m - 2; i >= 0; i--) dp[i][n - 1] = Math.max(1, dp[i + 1][n - 1] - dungeon[i][n - 1]);
        for (int j = n - 2; j >= 0; j--) dp[m - 1][j] = Math.max(1, dp[m - 1][j + 1] - dungeon[m - 1][j]);
        for (int i = m - 2; i >= 0; i--) {
            for (int j = n - 2; j >= 0; j--) {
                dp[i][j] = Math.max(1, Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]);
            }
        }
        return dp[0][0];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int m = dungeon.size(), n = dungeon[0].size();
        vector<vector<int>> dp(m, vector<int>(n, 0));
        dp[m - 1][n - 1] = max(1, 1 - dungeon[m - 1][n - 1]);
        for (int i = m - 2; i >= 0; i--) dp[i][n - 1] = max(1, dp[i + 1][n - 1] - dungeon[i][n - 1]);
        for (int j = n - 2; j >= 0; j--) dp[m - 1][j] = max(1, dp[m - 1][j + 1] - dungeon[m - 1][j]);
        for (int i = m - 2; i >= 0; i--) {
            for (int j = n - 2; j >= 0; j--) {
                dp[i][j] = max(1, min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]);
            }
        }
        return dp[0][0];
    }
};
$CPP$,'O(m * n)','O(m * n)');

-- 8) cherry-pickup (Hard)
INSERT INTO public."PGcode_problems" (id,topic_id,name,difficulty,description,solution_video_url,hints,roadmap_set,leetcode_url,method_name,params,return_type,test_cases) VALUES
('cherry-pickup','2d-dp','Cherry Pickup','Hard',
$$<p>You are given an <code>n x n</code> grid representing a field of cherries. Each cell is one of: <code>0</code> (empty), <code>1</code> (cherry), or <code>-1</code> (thorn). Return the maximum number of cherries you can collect by going from <code>(0,0)</code> to <code>(n-1,n-1)</code> and back, moving only right/down on the way there and only left/up on the way back. Each cherry can only be picked once.</p>$$,
'',ARRAY['Model two simultaneous paths going from (0,0) to (n-1,n-1).','Use 3D DP: dp[r1][c1][c2] where r2 = r1+c1-c2.','Both paths take the same number of steps; at step k, person1 is at (r1,c1) and person2 is at (r2,c2) with r1+c1 = r2+c2 = k.'],
'400','https://leetcode.com/problems/cherry-pickup/',
'cherryPickup','[{"name":"grid","type":"List[List[int]]"}]'::jsonb,'int',
'[{"inputs":["[[0,1,-1],[1,0,-1],[1,1,1]]"],"expected":"5"},{"inputs":["[[1,1,-1],[1,-1,1],[-1,1,1]]"],"expected":"0"},{"inputs":["[[1]]"],"expected":"1"},{"inputs":["[[1,1,1,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,1],[1,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,1,1,1]]"],"expected":"15"}]'::jsonb);
INSERT INTO public."PGcode_problem_templates" (problem_id,language,code) VALUES
('cherry-pickup','python',$PY$class Solution:
    def cherryPickup(self, grid: List[List[int]]) -> int:
        $PY$),
('cherry-pickup','javascript',$JS$var cherryPickup = function(grid) {

};$JS$),
('cherry-pickup','java',$JAVA$class Solution {
    public int cherryPickup(int[][] grid) {

    }
}$JAVA$),
('cherry-pickup','cpp',$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {

    }
};$CPP$);
INSERT INTO public."PGcode_solution_approaches" (problem_id,approach_number,approach_name,intuition,algorithm_steps,code_python,code_javascript,code_java,code_cpp,time_complexity,space_complexity) VALUES
('cherry-pickup',1,'3D DP (Two Simultaneous Paths)',
'Instead of going there and back, model two people going from (0,0) to (n-1,n-1) simultaneously. Use step number k = r1+c1 = r2+c2.',
'["Let n = len(grid). Total steps = 2*(n-1).","dp[r1][r2] = max cherries when person1 is at row r1 and person2 at row r2, both at step k.","At each step, try all 4 combos of (down,down),(down,right),(right,down),(right,right).","If r1==r2 count cherry once, else count both. Skip thorns.","Return max(0, dp[0][0]) after processing all steps."]'::jsonb,
$PY$class Solution:
    def cherryPickup(self, grid: List[List[int]]) -> int:
        n = len(grid)
        INF = float('-inf')
        dp = [[INF] * n for _ in range(n)]
        dp[0][0] = grid[0][0]
        for k in range(1, 2 * n - 1):
            ndp = [[INF] * n for _ in range(n)]
            for r1 in range(max(0, k - n + 1), min(n, k + 1)):
                c1 = k - r1
                if c1 < 0 or c1 >= n or grid[r1][c1] == -1:
                    continue
                for r2 in range(r1, min(n, k + 1)):
                    c2 = k - r2
                    if c2 < 0 or c2 >= n or grid[r2][c2] == -1:
                        continue
                    val = dp[r1][r2]
                    if r1 > 0:
                        val = max(val, dp[r1 - 1][r2])
                    if r2 > 0:
                        val = max(val, dp[r1][r2 - 1])
                    if r1 > 0 and r2 > 0:
                        val = max(val, dp[r1 - 1][r2 - 1])
                    if val == INF:
                        continue
                    cherries = grid[r1][c1]
                    if r1 != r2:
                        cherries += grid[r2][c2]
                    ndp[r1][r2] = val + cherries
            dp = ndp
        return max(0, dp[n - 1][n - 1])
$PY$,
$JS$var cherryPickup = function(grid) {
    const n = grid.length;
    const INF = -Infinity;
    let dp = Array.from({length: n}, () => new Array(n).fill(INF));
    dp[0][0] = grid[0][0];
    for (let k = 1; k < 2 * n - 1; k++) {
        const ndp = Array.from({length: n}, () => new Array(n).fill(INF));
        for (let r1 = Math.max(0, k - n + 1); r1 < Math.min(n, k + 1); r1++) {
            const c1 = k - r1;
            if (c1 < 0 || c1 >= n || grid[r1][c1] === -1) continue;
            for (let r2 = r1; r2 < Math.min(n, k + 1); r2++) {
                const c2 = k - r2;
                if (c2 < 0 || c2 >= n || grid[r2][c2] === -1) continue;
                let val = dp[r1][r2];
                if (r1 > 0) val = Math.max(val, dp[r1 - 1][r2]);
                if (r2 > 0) val = Math.max(val, dp[r1][r2 - 1]);
                if (r1 > 0 && r2 > 0) val = Math.max(val, dp[r1 - 1][r2 - 1]);
                if (val === INF) continue;
                let cherries = grid[r1][c1];
                if (r1 !== r2) cherries += grid[r2][c2];
                ndp[r1][r2] = val + cherries;
            }
        }
        dp = ndp;
    }
    return Math.max(0, dp[n - 1][n - 1]);
};
$JS$,
$JAVA$class Solution {
    public int cherryPickup(int[][] grid) {
        int n = grid.length;
        int INF = Integer.MIN_VALUE / 2;
        int[][] dp = new int[n][n];
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[0][0] = grid[0][0];
        for (int k = 1; k < 2 * n - 1; k++) {
            int[][] ndp = new int[n][n];
            for (int[] row : ndp) Arrays.fill(row, INF);
            for (int r1 = Math.max(0, k - n + 1); r1 < Math.min(n, k + 1); r1++) {
                int c1 = k - r1;
                if (c1 < 0 || c1 >= n || grid[r1][c1] == -1) continue;
                for (int r2 = r1; r2 < Math.min(n, k + 1); r2++) {
                    int c2 = k - r2;
                    if (c2 < 0 || c2 >= n || grid[r2][c2] == -1) continue;
                    int val = dp[r1][r2];
                    if (r1 > 0) val = Math.max(val, dp[r1 - 1][r2]);
                    if (r2 > 0) val = Math.max(val, dp[r1][r2 - 1]);
                    if (r1 > 0 && r2 > 0) val = Math.max(val, dp[r1 - 1][r2 - 1]);
                    if (val <= INF) continue;
                    int cherries = grid[r1][c1];
                    if (r1 != r2) cherries += grid[r2][c2];
                    ndp[r1][r2] = val + cherries;
                }
            }
            dp = ndp;
        }
        return Math.max(0, dp[n - 1][n - 1]);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int cherryPickup(vector<vector<int>>& grid) {
        int n = grid.size();
        const int INF = INT_MIN / 2;
        vector<vector<int>> dp(n, vector<int>(n, INF));
        dp[0][0] = grid[0][0];
        for (int k = 1; k < 2 * n - 1; k++) {
            vector<vector<int>> ndp(n, vector<int>(n, INF));
            for (int r1 = max(0, k - n + 1); r1 < min(n, k + 1); r1++) {
                int c1 = k - r1;
                if (c1 < 0 || c1 >= n || grid[r1][c1] == -1) continue;
                for (int r2 = r1; r2 < min(n, k + 1); r2++) {
                    int c2 = k - r2;
                    if (c2 < 0 || c2 >= n || grid[r2][c2] == -1) continue;
                    int val = dp[r1][r2];
                    if (r1 > 0) val = max(val, dp[r1 - 1][r2]);
                    if (r2 > 0) val = max(val, dp[r1][r2 - 1]);
                    if (r1 > 0 && r2 > 0) val = max(val, dp[r1 - 1][r2 - 1]);
                    if (val <= INF) continue;
                    int cherries = grid[r1][c1];
                    if (r1 != r2) cherries += grid[r2][c2];
                    ndp[r1][r2] = val + cherries;
                }
            }
            dp = ndp;
        }
        return max(0, dp[n - 1][n - 1]);
    }
};
$CPP$,'O(n^3)','O(n^2)');

COMMIT;
