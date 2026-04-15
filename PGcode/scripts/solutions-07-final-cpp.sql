-- C++ reference solutions for dp + 2d-dp + graphs + advanced-graphs + math + bit-manipulation (26 problems).
BEGIN;

-- ==================== DP ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};
$CPP$ WHERE problem_id = 'climbing-stairs' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int rob(vector<int>& nums) {
        int prev1 = 0, prev2 = 0;
        for (int num : nums) {
            int current = max(prev1, prev2 + num);
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
};
$CPP$ WHERE problem_id = 'house-robber' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
};
$CPP$ WHERE problem_id = 'coin-change' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        int n = nums.size();
        vector<int> dp(n, 1);
        int best = 1;
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);
            }
            best = max(best, dp[i]);
        }
        return best;
    }
};
$CPP$ WHERE problem_id = 'longest-increasing-subseq' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool wordBreak(string& s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        int n = s.size();
        vector<bool> dp(n + 1, false);
        dp[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.count(s.substr(j, i - j))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[n];
    }
};
$CPP$ WHERE problem_id = 'word-break' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<int> dp(n, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[j] += dp[j - 1];
            }
        }
        return dp[n - 1];
    }
};
$CPP$ WHERE problem_id = 'unique-paths' AND approach_number = 1;

-- ==================== 2D-DP ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int longestCommonSubsequence(string& text1, string& text2) {
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
$CPP$ WHERE problem_id = 'longest-common-subseq' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int minDistance(string& word1, string& word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
            }
        }
        return dp[m][n];
    }
};
$CPP$ WHERE problem_id = 'edit-distance' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = 0;
        for (int n : nums) total += n;
        if (abs(target) > total || (target + total) % 2 != 0) return 0;
        int subset = (target + total) / 2;
        vector<int> dp(subset + 1, 0);
        dp[0] = 1;
        for (int num : nums) {
            for (int s = subset; s >= num; s--) dp[s] += dp[s - num];
        }
        return dp[subset];
    }
};
$CPP$ WHERE problem_id = 'target-sum' AND approach_number = 1;

-- ==================== GRAPHS ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$/**
 * Definition for a Node.
 * class Node {
 * public:
 *     int val;
 *     vector<Node*> neighbors;
 *     Node() { val = 0; neighbors = vector<Node*>(); }
 *     Node(int _val) { val = _val; neighbors = vector<Node*>(); }
 *     Node(int _val, vector<Node*> _neighbors) { val = _val; neighbors = _neighbors; }
 * };
 */
class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        unordered_map<Node*, Node*> clones;
        clones[node] = new Node(node->val);
        queue<Node*> q;
        q.push(node);
        while (!q.empty()) {
            Node* u = q.front(); q.pop();
            for (Node* v : u->neighbors) {
                if (!clones.count(v)) {
                    clones[v] = new Node(v->val);
                    q.push(v);
                }
                clones[u]->neighbors.push_back(clones[v]);
            }
        }
        return clones[node];
    }
};
$CPP$ WHERE problem_id = 'clone-graph' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int numIslands(vector<vector<string>>& grid) {
        if (grid.empty()) return 0;
        int rows = grid.size(), cols = grid[0].size();
        int count = 0;
        function<void(int, int)> dfs = [&](int r, int c) {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != "1") return;
            grid[r][c] = "0";
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
        };
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == "1") { count++; dfs(r, c); }
            }
        }
        return count;
    }
};
$CPP$ WHERE problem_id = 'num-islands' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);
            indeg[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int taken = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            taken++;
            for (int v : adj[u]) {
                if (--indeg[v] == 0) q.push(v);
            }
        }
        return taken == numCourses;
    }
};
$CPP$ WHERE problem_id = 'course-schedule' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        queue<tuple<int, int, int>> q;
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.push({r, c, 0});
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int maxTime = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c, t] = q.front(); q.pop();
            maxTime = max(maxTime, t);
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    q.push({nr, nc, t + 1});
                }
            }
        }
        return fresh == 0 ? maxTime : -1;
    }
};
$CPP$ WHERE problem_id = 'rotting-oranges' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int rows = heights.size(), cols = heights[0].size();
        vector<vector<bool>> pac(rows, vector<bool>(cols, false));
        vector<vector<bool>> atl(rows, vector<bool>(cols, false));
        function<void(int, int, vector<vector<bool>>&)> dfs = [&](int r, int c, vector<vector<bool>>& v) {
            v[r][c] = true;
            int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !v[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                    dfs(nr, nc, v);
                }
            }
        };
        for (int c = 0; c < cols; c++) { dfs(0, c, pac); dfs(rows - 1, c, atl); }
        for (int r = 0; r < rows; r++) { dfs(r, 0, pac); dfs(r, cols - 1, atl); }
        vector<vector<int>> result;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (pac[r][c] && atl[r][c]) result.push_back({r, c});
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'pacific-atlantic' AND approach_number = 1;

-- ==================== ADVANCED-GRAPHS ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    string alienOrder(vector<string>& words) {
        unordered_map<char, unordered_set<char>> adj;
        unordered_map<char, int> indeg;
        for (const string& w : words) for (char c : w) {
            adj[c];
            indeg[c];
        }
        for (int i = 0; i < (int)words.size() - 1; i++) {
            const string& a = words[i];
            const string& b = words[i + 1];
            if (a.size() > b.size() && a.compare(0, b.size(), b) == 0) return "";
            int minLen = min(a.size(), b.size());
            for (int j = 0; j < minLen; j++) {
                if (a[j] != b[j]) {
                    if (adj[a[j]].insert(b[j]).second) indeg[b[j]]++;
                    break;
                }
            }
        }
        queue<char> q;
        for (auto& [c, d] : indeg) if (d == 0) q.push(c);
        string result;
        while (!q.empty()) {
            char c = q.front(); q.pop();
            result += c;
            for (char n : adj[c]) {
                if (--indeg[n] == 0) q.push(n);
            }
        }
        return result.size() == indeg.size() ? result : "";
    }
};
$CPP$ WHERE problem_id = 'alien-dictionary' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int,int>>> adj(n + 1);
        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});
        vector<int> dist(n + 1, INT_MAX);
        dist[k] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        heap.push({0, k});
        while (!heap.empty()) {
            auto [d, u] = heap.top(); heap.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : adj[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    heap.push({d + w, v});
                }
            }
        }
        int maxDist = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == INT_MAX) return -1;
            maxDist = max(maxDist, dist[i]);
        }
        return maxDist;
    }
};
$CPP$ WHERE problem_id = 'network-delay' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int swimInWater(vector<vector<int>>& grid) {
        int n = grid.size();
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> heap;
        heap.push({grid[0][0], 0, 0});
        vector<vector<bool>> visited(n, vector<bool>(n, false));
        visited[0][0] = true;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!heap.empty()) {
            auto [t, r, c] = heap.top(); heap.pop();
            if (r == n - 1 && c == n - 1) return t;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    heap.push({max(t, grid[nr][nc]), nr, nc});
                }
            }
        }
        return -1;
    }
};
$CPP$ WHERE problem_id = 'swim-in-water' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        vector<int> prices(n, INT_MAX);
        prices[src] = 0;
        for (int i = 0; i <= k; i++) {
            vector<int> tmp = prices;
            for (auto& f : flights) {
                if (prices[f[0]] == INT_MAX) continue;
                if (prices[f[0]] + f[2] < tmp[f[1]]) tmp[f[1]] = prices[f[0]] + f[2];
            }
            prices = move(tmp);
        }
        return prices[dst] == INT_MAX ? -1 : prices[dst];
    }
};
$CPP$ WHERE problem_id = 'cheapest-flights' AND approach_number = 1;

-- ==================== MATH ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
    int next(int x) {
        int total = 0;
        while (x > 0) {
            int d = x % 10;
            total += d * d;
            x /= 10;
        }
        return total;
    }
public:
    bool isHappy(int n) {
        int slow = n, fast = next(n);
        while (fast != 1 && slow != fast) {
            slow = next(slow);
            fast = next(next(fast));
        }
        return fast == 1;
    }
};
$CPP$ WHERE problem_id = 'happy-number' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);
            }
        }
        for (auto& row : matrix) reverse(row.begin(), row.end());
    }
};
$CPP$ WHERE problem_id = 'rotate-image' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        bool firstRowZero = false, firstColZero = false;
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
};
$CPP$ WHERE problem_id = 'set-matrix-zeroes' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> result;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) result.push_back(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) result.push_back(matrix[i][right]);
            right--;
            if (top <= bottom) {
                for (int j = right; j >= left; j--) result.push_back(matrix[bottom][j]);
                bottom--;
            }
            if (left <= right) {
                for (int i = bottom; i >= top; i--) result.push_back(matrix[i][left]);
                left++;
            }
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'spiral-matrix' AND approach_number = 1;

-- ==================== BIT-MANIPULATION ====================

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int result = 0;
        for (int num : nums) result ^= num;
        return result;
    }
};
$CPP$ WHERE problem_id = 'single-number' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    int hammingWeight(int n) {
        int count = 0;
        unsigned int un = (unsigned int)n;
        while (un) {
            un &= un - 1;
            count++;
        }
        return count;
    }
};
$CPP$ WHERE problem_id = 'number-of-1-bits' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> bits(n + 1, 0);
        for (int i = 1; i <= n; i++) bits[i] = bits[i & (i - 1)] + 1;
        return bits;
    }
};
$CPP$ WHERE problem_id = 'counting-bits' AND approach_number = 1;

UPDATE public."PGcode_solution_approaches" SET code_cpp = $CPP$class Solution {
public:
    uint32_t reverseBits(uint32_t n) {
        uint32_t result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);
            n >>= 1;
        }
        return result;
    }
};
$CPP$ WHERE problem_id = 'reverse-bits' AND approach_number = 1;

COMMIT;
