// batch-hard.mjs — HARD, zero-solution backfill batch.
//
// Same shape as the CANONICALS map in scripts/backfill-solutions.mjs:
//   { <problem-id>: { python, javascript, java, cpp } }
// Each language is the full LeetCode-style class/function body whose signature
// matches generateTemplate(language, method_name, params, return_type) for that
// problem's stored DB row. Wire it in by spreading into CANONICALS, or grade via
// --only, e.g.:
//   node scripts/backfill-solutions.mjs --only n-queens-ii,unique-paths-iii,...
//
// SCOPE: difficulty === 'Hard' && presentCount === 0.
// 8 such problems exist; 3 are SKIPPED (documented at the bottom) because the
// driver cannot grade them with their stored signatures:
//   - n-queens                : return_type List[List[str]] but tests expect the
//                               integer count → driver serializes a board list,
//                               never the scalar the tests compare against.
//   - vertical-order-traversal-of-a-binary-tree : root typed List[int] but inputs
//                               contain `null` tokens; the C++/Java int-array
//                               parsers (stoi / Integer.parseInt) crash on "null".
//   - binary-tree-maximum-path-sum : same null-in-List[int] tree-reconstruction
//                               problem as above.
// The 5 below all return scalars (int) and parse cleanly in all four languages.

export default {
  // totalNQueens(n: int) -> int  — backtracking, count distinct solutions.
  'n-queens-ii': {
    python: `class Solution:
    def totalNQueens(self, n: int) -> int:
        cols = set()
        diag = set()
        anti = set()
        count = 0
        def backtrack(r):
            nonlocal count
            if r == n:
                count += 1
                return
            for c in range(n):
                if c in cols or (r - c) in diag or (r + c) in anti:
                    continue
                cols.add(c); diag.add(r - c); anti.add(r + c)
                backtrack(r + 1)
                cols.remove(c); diag.remove(r - c); anti.remove(r + c)
        backtrack(0)
        return count`,
    javascript: `var totalNQueens = function(n) {
    const cols = new Set(), diag = new Set(), anti = new Set();
    let count = 0;
    const backtrack = (r) => {
        if (r === n) { count++; return; }
        for (let c = 0; c < n; c++) {
            if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
            cols.add(c); diag.add(r - c); anti.add(r + c);
            backtrack(r + 1);
            cols.delete(c); diag.delete(r - c); anti.delete(r + c);
        }
    };
    backtrack(0);
    return count;
};`,
    java: `import java.util.*;
class Solution {
    private int count = 0;
    public int totalNQueens(int n) {
        backtrack(0, n, new HashSet<>(), new HashSet<>(), new HashSet<>());
        return count;
    }
    private void backtrack(int r, int n, Set<Integer> cols, Set<Integer> diag, Set<Integer> anti) {
        if (r == n) { count++; return; }
        for (int c = 0; c < n; c++) {
            if (cols.contains(c) || diag.contains(r - c) || anti.contains(r + c)) continue;
            cols.add(c); diag.add(r - c); anti.add(r + c);
            backtrack(r + 1, n, cols, diag, anti);
            cols.remove(c); diag.remove(r - c); anti.remove(r + c);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalNQueens(int n) {
        int count = 0;
        vector<bool> cols(n, false), diag(2 * n, false), anti(2 * n, false);
        function<void(int)> backtrack = [&](int r) {
            if (r == n) { count++; return; }
            for (int c = 0; c < n; c++) {
                if (cols[c] || diag[r - c + n] || anti[r + c]) continue;
                cols[c] = diag[r - c + n] = anti[r + c] = true;
                backtrack(r + 1);
                cols[c] = diag[r - c + n] = anti[r + c] = false;
            }
        };
        backtrack(0);
        return count;
    }
};`,
  },

  // uniquePathsIII(input: List[List[int]]) -> Any (int)
  // Walk every empty square (0) exactly once from start (1) to end (2); -1 is a wall.
  'unique-paths-iii': {
    python: `class Solution:
    def uniquePathsIII(self, input: List[List[int]]) -> Any:
        rows, cols = len(input), len(input[0])
        empty = 0
        sr = sc = 0
        for r in range(rows):
            for c in range(cols):
                if input[r][c] == 0:
                    empty += 1
                elif input[r][c] == 1:
                    sr, sc = r, c
        self.paths = 0
        def dfs(r, c, remaining):
            if r < 0 or r >= rows or c < 0 or c >= cols or input[r][c] == -1:
                return
            if input[r][c] == 2:
                if remaining == 0:
                    self.paths += 1
                return
            tmp = input[r][c]
            input[r][c] = -1
            dfs(r + 1, c, remaining - 1)
            dfs(r - 1, c, remaining - 1)
            dfs(r, c + 1, remaining - 1)
            dfs(r, c - 1, remaining - 1)
            input[r][c] = tmp
        dfs(sr, sc, empty + 1)
        return self.paths`,
    javascript: `var uniquePathsIII = function(input) {
    const rows = input.length, cols = input[0].length;
    let empty = 0, sr = 0, sc = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (input[r][c] === 0) empty++;
            else if (input[r][c] === 1) { sr = r; sc = c; }
        }
    }
    let paths = 0;
    const dfs = (r, c, remaining) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || input[r][c] === -1) return;
        if (input[r][c] === 2) { if (remaining === 0) paths++; return; }
        const tmp = input[r][c];
        input[r][c] = -1;
        dfs(r + 1, c, remaining - 1);
        dfs(r - 1, c, remaining - 1);
        dfs(r, c + 1, remaining - 1);
        dfs(r, c - 1, remaining - 1);
        input[r][c] = tmp;
    };
    dfs(sr, sc, empty + 1);
    return paths;
};`,
    java: `class Solution {
    private int paths = 0;
    private int rows, cols;
    public int uniquePathsIII(int[][] input) {
        rows = input.length; cols = input[0].length;
        int empty = 0, sr = 0, sc = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (input[r][c] == 0) empty++;
                else if (input[r][c] == 1) { sr = r; sc = c; }
            }
        dfs(input, sr, sc, empty + 1);
        return paths;
    }
    private void dfs(int[][] g, int r, int c, int remaining) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || g[r][c] == -1) return;
        if (g[r][c] == 2) { if (remaining == 0) paths++; return; }
        int tmp = g[r][c];
        g[r][c] = -1;
        dfs(g, r + 1, c, remaining - 1);
        dfs(g, r - 1, c, remaining - 1);
        dfs(g, r, c + 1, remaining - 1);
        dfs(g, r, c - 1, remaining - 1);
        g[r][c] = tmp;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int uniquePathsIII(vector<vector<int>>& input) {
        int rows = input.size(), cols = input[0].size();
        int empty = 0, sr = 0, sc = 0, paths = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (input[r][c] == 0) empty++;
                else if (input[r][c] == 1) { sr = r; sc = c; }
            }
        function<void(int,int,int)> dfs = [&](int r, int c, int remaining) {
            if (r < 0 || r >= rows || c < 0 || c >= cols || input[r][c] == -1) return;
            if (input[r][c] == 2) { if (remaining == 0) paths++; return; }
            int tmp = input[r][c];
            input[r][c] = -1;
            dfs(r + 1, c, remaining - 1);
            dfs(r - 1, c, remaining - 1);
            dfs(r, c + 1, remaining - 1);
            dfs(r, c - 1, remaining - 1);
            input[r][c] = tmp;
        };
        dfs(sr, sc, empty + 1);
        return paths;
    }
};`,
  },

  // subarraysWithKDistinct(nums: List[int], target: int) -> Any (int)
  // atMost(K) - atMost(K-1) sliding window.
  'subarrays-with-k-different-integers': {
    python: `class Solution:
    def subarraysWithKDistinct(self, nums: List[int], target: int) -> Any:
        def at_most(k):
            count = {}
            left = 0
            total = 0
            for right in range(len(nums)):
                count[nums[right]] = count.get(nums[right], 0) + 1
                while len(count) > k:
                    count[nums[left]] -= 1
                    if count[nums[left]] == 0:
                        del count[nums[left]]
                    left += 1
                total += right - left + 1
            return total
        return at_most(target) - at_most(target - 1)`,
    javascript: `var subarraysWithKDistinct = function(nums, target) {
    const atMost = (k) => {
        const count = new Map();
        let left = 0, total = 0;
        for (let right = 0; right < nums.length; right++) {
            count.set(nums[right], (count.get(nums[right]) || 0) + 1);
            while (count.size > k) {
                count.set(nums[left], count.get(nums[left]) - 1);
                if (count.get(nums[left]) === 0) count.delete(nums[left]);
                left++;
            }
            total += right - left + 1;
        }
        return total;
    };
    return atMost(target) - atMost(target - 1);
};`,
    java: `import java.util.*;
class Solution {
    public int subarraysWithKDistinct(int[] nums, int target) {
        return atMost(nums, target) - atMost(nums, target - 1);
    }
    private int atMost(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, total = 0;
        for (int right = 0; right < nums.length; right++) {
            count.merge(nums[right], 1, Integer::sum);
            while (count.size() > k) {
                count.merge(nums[left], -1, Integer::sum);
                if (count.get(nums[left]) == 0) count.remove(nums[left]);
                left++;
            }
            total += right - left + 1;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subarraysWithKDistinct(vector<int>& nums, int target) {
        return atMost(nums, target) - atMost(nums, target - 1);
    }
private:
    int atMost(vector<int>& nums, int k) {
        unordered_map<int,int> count;
        int left = 0, total = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            count[nums[right]]++;
            while ((int)count.size() > k) {
                if (--count[nums[left]] == 0) count.erase(nums[left]);
                left++;
            }
            total += right - left + 1;
        }
        return total;
    }
};`,
  },

  // checkRecord(input: int) -> Any (int)  — LC 552. n days, count valid records mod 1e9+7.
  // States: (absences 0/1) x (trailing lates 0/1/2). Returns total mod 1_000_000_007.
  'student-attendance-record-ii': {
    python: `class Solution:
    def checkRecord(self, input: int) -> Any:
        MOD = 1_000_000_007
        n = input
        dp = [[0, 0, 0], [0, 0, 0]]
        dp[0][0] = 1
        for _ in range(n):
            ndp = [[0, 0, 0], [0, 0, 0]]
            for a in range(2):
                for l in range(3):
                    cur = dp[a][l]
                    if cur == 0:
                        continue
                    ndp[a][0] = (ndp[a][0] + cur) % MOD
                    if a == 0:
                        ndp[1][0] = (ndp[1][0] + cur) % MOD
                    if l < 2:
                        ndp[a][l + 1] = (ndp[a][l + 1] + cur) % MOD
            dp = ndp
        total = 0
        for a in range(2):
            for l in range(3):
                total = (total + dp[a][l]) % MOD
        return total`,
    javascript: `var checkRecord = function(input) {
    const MOD = 1000000007n;
    const n = input;
    let dp = [[1n, 0n, 0n], [0n, 0n, 0n]];
    for (let i = 0; i < n; i++) {
        const ndp = [[0n, 0n, 0n], [0n, 0n, 0n]];
        for (let a = 0; a < 2; a++) {
            for (let l = 0; l < 3; l++) {
                const cur = dp[a][l];
                if (cur === 0n) continue;
                ndp[a][0] = (ndp[a][0] + cur) % MOD;
                if (a === 0) ndp[1][0] = (ndp[1][0] + cur) % MOD;
                if (l < 2) ndp[a][l + 1] = (ndp[a][l + 1] + cur) % MOD;
            }
        }
        dp = ndp;
    }
    let total = 0n;
    for (let a = 0; a < 2; a++)
        for (let l = 0; l < 3; l++)
            total = (total + dp[a][l]) % MOD;
    return Number(total);
};`,
    java: `class Solution {
    public int checkRecord(int input) {
        final int MOD = 1000000007;
        int n = input;
        long[][] dp = new long[2][3];
        dp[0][0] = 1;
        for (int i = 0; i < n; i++) {
            long[][] ndp = new long[2][3];
            for (int a = 0; a < 2; a++) {
                for (int l = 0; l < 3; l++) {
                    long cur = dp[a][l];
                    if (cur == 0) continue;
                    ndp[a][0] = (ndp[a][0] + cur) % MOD;
                    if (a == 0) ndp[1][0] = (ndp[1][0] + cur) % MOD;
                    if (l < 2) ndp[a][l + 1] = (ndp[a][l + 1] + cur) % MOD;
                }
            }
            dp = ndp;
        }
        long total = 0;
        for (int a = 0; a < 2; a++)
            for (int l = 0; l < 3; l++)
                total = (total + dp[a][l]) % MOD;
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int checkRecord(int input) {
        const long long MOD = 1000000007LL;
        int n = input;
        long long dp[2][3] = {{1, 0, 0}, {0, 0, 0}};
        for (int i = 0; i < n; i++) {
            long long ndp[2][3] = {{0, 0, 0}, {0, 0, 0}};
            for (int a = 0; a < 2; a++) {
                for (int l = 0; l < 3; l++) {
                    long long cur = dp[a][l];
                    if (cur == 0) continue;
                    ndp[a][0] = (ndp[a][0] + cur) % MOD;
                    if (a == 0) ndp[1][0] = (ndp[1][0] + cur) % MOD;
                    if (l < 2) ndp[a][l + 1] = (ndp[a][l + 1] + cur) % MOD;
                }
            }
            memcpy(dp, ndp, sizeof(dp));
        }
        long long total = 0;
        for (int a = 0; a < 2; a++)
            for (int l = 0; l < 3; l++)
                total = (total + dp[a][l]) % MOD;
        return (int) total;
    }
};`,
  },

  // numDistinct(s: str, t: str) -> int  — count distinct subsequences of s equal to t. DP.
  'distinct-subsequences': {
    python: `class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        m, n = len(s), len(t)
        dp = [0] * (n + 1)
        dp[0] = 1
        for i in range(1, m + 1):
            for j in range(n, 0, -1):
                if s[i - 1] == t[j - 1]:
                    dp[j] += dp[j - 1]
        return dp[n]`,
    javascript: `var numDistinct = function(s, t) {
    const m = s.length, n = t.length;
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= m; i++) {
        for (let j = n; j >= 1; j--) {
            if (s[i - 1] === t[j - 1]) dp[j] += dp[j - 1];
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public int numDistinct(String s, String t) {
        int m = s.length(), n = t.length();
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= m; i++) {
            for (int j = n; j >= 1; j--) {
                if (s.charAt(i - 1) == t.charAt(j - 1)) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numDistinct(string s, string t) {
        int m = s.size(), n = t.size();
        vector<unsigned long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= m; i++) {
            for (int j = n; j >= 1; j--) {
                if (s[i - 1] == t[j - 1]) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[n];
    }
};`,
  },
};

// ── SKIPPED (driver cannot grade with stored signatures) ──────────────────────
// n-queens                                  : return_type List[List[str]] vs scalar-count tests
// vertical-order-traversal-of-a-binary-tree : null tokens in List[int] root crash cpp/java parsers
// binary-tree-maximum-path-sum              : null tokens in List[int] root crash cpp/java parsers
