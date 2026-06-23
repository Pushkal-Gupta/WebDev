// xlate-17 — translate verified Python solutions to JS / Java / C++.
// Slice [480, 510) of solutions-backfill-targets.json (pyReal && missingLangs).
// Signatures match generateTemplate() exactly; the runner grades each via Judge0.

export default {
  // passwordScore(s: str) -> int
  'pghub-elastic-password-strength': {
    javascript: `var passwordScore = function(s) {
    let hasLower = false, hasUpper = false, hasDigit = false;
    for (const c of s) {
        if (c >= 'a' && c <= 'z') hasLower = true;
        else if (c >= 'A' && c <= 'Z') hasUpper = true;
        else if (c >= '0' && c <= '9') hasDigit = true;
    }
    let score = 0;
    if (s.length >= 8) score += 1;
    score += (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0);
    let triple = false;
    for (let i = 0; i + 2 < s.length; i++) {
        if (s[i] === s[i + 1] && s[i + 1] === s[i + 2]) { triple = true; break; }
    }
    if (!triple) score += 1;
    return score;
};`,
    java: `class Solution {
    public int passwordScore(String s) {
        boolean hasLower = false, hasUpper = false, hasDigit = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 'a' && c <= 'z') hasLower = true;
            else if (c >= 'A' && c <= 'Z') hasUpper = true;
            else if (c >= '0' && c <= '9') hasDigit = true;
        }
        int score = 0;
        if (s.length() >= 8) score += 1;
        score += (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0);
        boolean triple = false;
        for (int i = 0; i + 2 < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i + 1) && s.charAt(i + 1) == s.charAt(i + 2)) { triple = true; break; }
        }
        if (!triple) score += 1;
        return score;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int passwordScore(string s) {
        bool hasLower = false, hasUpper = false, hasDigit = false;
        for (char c : s) {
            if (c >= 'a' && c <= 'z') hasLower = true;
            else if (c >= 'A' && c <= 'Z') hasUpper = true;
            else if (c >= '0' && c <= '9') hasDigit = true;
        }
        int score = 0;
        if ((int)s.size() >= 8) score += 1;
        score += (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0);
        bool triple = false;
        for (int i = 0; i + 2 < (int)s.size(); i++) {
            if (s[i] == s[i + 1] && s[i + 1] == s[i + 2]) { triple = true; break; }
        }
        if (!triple) score += 1;
        return score;
    }
};`,
  },

  // elevatorTrips(weights: List[int], limit: int) -> int  — greedy fill.
  'pghub-elevator-floor-trips': {
    javascript: `var elevatorTrips = function(weights, limit) {
    let trips = 0, load = 0;
    for (const w of weights) {
        if (load + w <= limit) load += w;
        else { trips++; load = w; }
    }
    if (load > 0) trips++;
    return trips;
};`,
    java: `class Solution {
    public int elevatorTrips(int[] weights, int limit) {
        int trips = 0, load = 0;
        for (int w : weights) {
            if (load + w <= limit) load += w;
            else { trips++; load = w; }
        }
        if (load > 0) trips++;
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int elevatorTrips(vector<int>& weights, int limit) {
        int trips = 0, load = 0;
        for (int w : weights) {
            if (load + w <= limit) load += w;
            else { trips++; load = w; }
        }
        if (load > 0) trips++;
        return trips;
    }
};`,
  },

  // elevatorTrips(weights: List[int], capacity: int) -> int  — same greedy fill.
  'pghub-elevator-trip-count': {
    javascript: `var elevatorTrips = function(weights, capacity) {
    let trips = 0, load = 0;
    for (const w of weights) {
        if (load + w <= capacity) load += w;
        else { trips++; load = w; }
    }
    if (load > 0) trips++;
    return trips;
};`,
    java: `class Solution {
    public int elevatorTrips(int[] weights, int capacity) {
        int trips = 0, load = 0;
        for (int w : weights) {
            if (load + w <= capacity) load += w;
            else { trips++; load = w; }
        }
        if (load > 0) trips++;
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int elevatorTrips(vector<int>& weights, int capacity) {
        int trips = 0, load = 0;
        for (int w : weights) {
            if (load + w <= capacity) load += w;
            else { trips++; load = w; }
        }
        if (load > 0) trips++;
        return trips;
    }
};`,
  },

  // minTrips(people: int, capacity: int) -> int  — ceil division.
  'pghub-elevator-trips': {
    javascript: `var minTrips = function(people, capacity) {
    return Math.floor((people + capacity - 1) / capacity);
};`,
    java: `class Solution {
    public int minTrips(int people, int capacity) {
        return (people + capacity - 1) / capacity;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(int people, int capacity) {
        return (people + capacity - 1) / capacity;
    }
};`,
  },

  // ferryTrips(weights: List[int], limit: int) -> int  — two-pointer pairing.
  'pghub-ferry-min-trips': {
    javascript: `var ferryTrips = function(weights, limit) {
    const w = weights.slice().sort((a, b) => a - b);
    let i = 0, j = w.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && w[i] + w[j] <= limit) i++;
        j--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int ferryTrips(int[] weights, int limit) {
        int[] w = weights.clone();
        Arrays.sort(w);
        int i = 0, j = w.length - 1, trips = 0;
        while (i <= j) {
            if (i < j && w[i] + w[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ferryTrips(vector<int>& weights, int limit) {
        vector<int> w = weights;
        sort(w.begin(), w.end());
        int i = 0, j = (int)w.size() - 1, trips = 0;
        while (i <= j) {
            if (i < j && w[i] + w[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // largestRegion(grid: List[List[int]]) -> int  — iterative DFS flood fill on 1s.
  'pghub-flood-region-size': {
    javascript: `var largestRegion = function(grid) {
    const rows = grid.length, cols = rows ? grid[0].length : 0;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    let best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1 && !seen[r][c]) {
                const stack = [[r, c]];
                seen[r][c] = true;
                let size = 0;
                while (stack.length) {
                    const [x, y] = stack.pop();
                    size++;
                    for (const [dx, dy] of dirs) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === 1 && !seen[nx][ny]) {
                            seen[nx][ny] = true;
                            stack.push([nx, ny]);
                        }
                    }
                }
                best = Math.max(best, size);
            }
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int largestRegion(int[][] grid) {
        int rows = grid.length, cols = rows > 0 ? grid[0].length : 0;
        boolean[][] seen = new boolean[rows][cols];
        int best = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{r, c});
                    seen[r][c] = true;
                    int size = 0;
                    while (!stack.isEmpty()) {
                        int[] cur = stack.pop();
                        int x = cur[0], y = cur[1];
                        size++;
                        for (int[] d : dirs) {
                            int nx = x + d[0], ny = y + d[1];
                            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = true;
                                stack.push(new int[]{nx, ny});
                            }
                        }
                    }
                    best = Math.max(best, size);
                }
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestRegion(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = rows ? (int)grid[0].size() : 0;
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int best = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    vector<pair<int,int>> stack;
                    stack.push_back({r, c});
                    seen[r][c] = true;
                    int size = 0;
                    while (!stack.empty()) {
                        auto [x, y] = stack.back(); stack.pop_back();
                        size++;
                        for (auto& d : dirs) {
                            int nx = x + d[0], ny = y + d[1];
                            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = true;
                                stack.push_back({nx, ny});
                            }
                        }
                    }
                    best = max(best, size);
                }
            }
        }
        return best;
    }
};`,
  },

  // canFold(s: str) -> bool  — palindrome ignoring spaces, case-insensitive.
  'pghub-fold-palindrome': {
    javascript: `var canFold = function(s) {
    const t = [];
    for (const ch of s) if (ch !== ' ') t.push(ch.toLowerCase());
    let i = 0, j = t.length - 1;
    while (i < j) {
        if (t[i] !== t[j]) return false;
        i++; j--;
    }
    return true;
};`,
    java: `class Solution {
    public boolean canFold(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch != ' ') sb.append(Character.toLowerCase(ch));
        }
        String t = sb.toString();
        int i = 0, j = t.length() - 1;
        while (i < j) {
            if (t.charAt(i) != t.charAt(j)) return false;
            i++; j--;
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFold(string s) {
        string t;
        for (char ch : s) if (ch != ' ') t += (char)tolower((unsigned char)ch);
        int i = 0, j = (int)t.size() - 1;
        while (i < j) {
            if (t[i] != t[j]) return false;
            i++; j--;
        }
        return true;
    }
};`,
  },

  // freqSort(nums: List[int]) -> List[int]  — sort by (-freq, value).
  'pghub-frequency-sort-stable': {
    javascript: `var freqSort = function(nums) {
    const freq = new Map();
    for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);
    return nums.slice().sort((a, b) => {
        const fd = freq.get(b) - freq.get(a);
        if (fd !== 0) return fd;
        return a - b;
    });
};`,
    java: `import java.util.*;
class Solution {
    public int[] freqSort(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        Integer[] boxed = new Integer[nums.length];
        for (int i = 0; i < nums.length; i++) boxed[i] = nums[i];
        Arrays.sort(boxed, (a, b) -> {
            int fd = freq.get(b) - freq.get(a);
            if (fd != 0) return fd;
            return Integer.compare(a, b);
        });
        int[] res = new int[nums.length];
        for (int i = 0; i < nums.length; i++) res[i] = boxed[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> freqSort(vector<int>& nums) {
        unordered_map<int, int> freq;
        for (int x : nums) freq[x]++;
        vector<int> res = nums;
        stable_sort(res.begin(), res.end(), [&](int a, int b) {
            if (freq[a] != freq[b]) return freq[a] > freq[b];
            return a < b;
        });
        return res;
    }
};`,
  },

  // countHops(n: int) -> int  — tribonacci-ish DP mod 1e9+7.
  'pghub-frog-lily-hops': {
    javascript: `var countHops = function(n) {
    const MOD = 1000000007n;
    if (n < 0) return 0;
    const dp = new Array(n + 1).fill(0n);
    dp[0] = 1n;
    for (let i = 1; i <= n; i++) {
        let v = dp[i - 1];
        if (i >= 2) v += dp[i - 2];
        if (i >= 3) v += dp[i - 3];
        dp[i] = v % MOD;
    }
    return Number(dp[n]);
};`,
    java: `class Solution {
    public int countHops(int n) {
        final int MOD = 1000000007;
        if (n < 0) return 0;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            long v = dp[i - 1];
            if (i >= 2) v += dp[i - 2];
            if (i >= 3) v += dp[i - 3];
            dp[i] = v % MOD;
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countHops(int n) {
        const long long MOD = 1000000007LL;
        if (n < 0) return 0;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            long long v = dp[i - 1];
            if (i >= 2) v += dp[i - 2];
            if (i >= 3) v += dp[i - 3];
            dp[i] = v % MOD;
        }
        return (int) dp[n];
    }
};`,
  },

  // startStation(gas: List[int], cost: List[int]) -> int  — greedy circuit.
  'pghub-gas-station-loop': {
    javascript: `var startStation = function(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
};`,
    java: `class Solution {
    public int startStation(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int startStation(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < (int)gas.size(); i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
};`,
  },

  // mutationSteps(start: str, target: str, bank: List[str]) -> int  — BFS.
  'pghub-gene-mutation-steps': {
    javascript: `var mutationSteps = function(start, target, bank) {
    const bankset = new Set(bank);
    if (!bankset.has(target)) return -1;
    if (start === target) return 0;
    const alphabet = "ACGT";
    const q = [[start, 0]];
    const visited = new Set([start]);
    let head = 0;
    while (head < q.length) {
        const [gene, steps] = q[head++];
        for (let i = 0; i < gene.length; i++) {
            for (const ch of alphabet) {
                if (ch === gene[i]) continue;
                const nxt = gene.slice(0, i) + ch + gene.slice(i + 1);
                if (bankset.has(nxt) && !visited.has(nxt)) {
                    if (nxt === target) return steps + 1;
                    visited.add(nxt);
                    q.push([nxt, steps + 1]);
                }
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int mutationSteps(String start, String target, String[] bank) {
        Set<String> bankset = new HashSet<>(Arrays.asList(bank));
        if (!bankset.contains(target)) return -1;
        if (start.equals(target)) return 0;
        char[] alphabet = {'A', 'C', 'G', 'T'};
        Deque<String> q = new ArrayDeque<>();
        Map<String, Integer> dist = new HashMap<>();
        q.add(start);
        dist.put(start, 0);
        while (!q.isEmpty()) {
            String gene = q.poll();
            int steps = dist.get(gene);
            char[] arr = gene.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char ch : alphabet) {
                    if (ch == orig) continue;
                    arr[i] = ch;
                    String nxt = new String(arr);
                    if (bankset.contains(nxt) && !dist.containsKey(nxt)) {
                        if (nxt.equals(target)) return steps + 1;
                        dist.put(nxt, steps + 1);
                        q.add(nxt);
                    }
                }
                arr[i] = orig;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mutationSteps(string start, string target, vector<string>& bank) {
        unordered_set<string> bankset(bank.begin(), bank.end());
        if (!bankset.count(target)) return -1;
        if (start == target) return 0;
        string alphabet = "ACGT";
        queue<pair<string,int>> q;
        unordered_set<string> visited;
        q.push({start, 0});
        visited.insert(start);
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            for (int i = 0; i < (int)gene.size(); i++) {
                char orig = gene[i];
                for (char ch : alphabet) {
                    if (ch == orig) continue;
                    gene[i] = ch;
                    if (bankset.count(gene) && !visited.count(gene)) {
                        if (gene == target) return steps + 1;
                        visited.insert(gene);
                        q.push({gene, steps + 1});
                    }
                }
                gene[i] = orig;
            }
        }
        return -1;
    }
};`,
  },

  // diagonalSums(grid: List[List[int]]) -> List[int]  — anti-diagonal sums.
  'pghub-grid-diagonal-sum': {
    javascript: `var diagonalSums = function(grid) {
    const m = grid.length, n = grid[0].length;
    const res = new Array(m + n - 1).fill(0);
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            res[i + j] += grid[i][j];
    return res;
};`,
    java: `class Solution {
    public int[] diagonalSums(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[] res = new int[m + n - 1];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                res[i + j] += grid[i][j];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> diagonalSums(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<int> res(m + n - 1, 0);
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                res[i + j] += grid[i][j];
        return res;
    }
};`,
  },

  // minFallingPath(grid: List[List[int]]) -> int  — DP, adjacent-column descent.
  'pghub-grid-min-path': {
    javascript: `var minFallingPath = function(grid) {
    const n = grid.length, cols = grid[0].length;
    let prev = grid[0].slice();
    for (let i = 1; i < n; i++) {
        const cur = new Array(cols).fill(0);
        for (let j = 0; j < cols; j++) {
            let best = prev[j];
            if (j > 0) best = Math.min(best, prev[j - 1]);
            if (j < cols - 1) best = Math.min(best, prev[j + 1]);
            cur[j] = grid[i][j] + best;
        }
        prev = cur;
    }
    return Math.min(...prev);
};`,
    java: `class Solution {
    public int minFallingPath(int[][] grid) {
        int n = grid.length, cols = grid[0].length;
        int[] prev = grid[0].clone();
        for (int i = 1; i < n; i++) {
            int[] cur = new int[cols];
            for (int j = 0; j < cols; j++) {
                int best = prev[j];
                if (j > 0) best = Math.min(best, prev[j - 1]);
                if (j < cols - 1) best = Math.min(best, prev[j + 1]);
                cur[j] = grid[i][j] + best;
            }
            prev = cur;
        }
        int ans = prev[0];
        for (int v : prev) ans = Math.min(ans, v);
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFallingPath(vector<vector<int>>& grid) {
        int n = grid.size(), cols = grid[0].size();
        vector<int> prev = grid[0];
        for (int i = 1; i < n; i++) {
            vector<int> cur(cols, 0);
            for (int j = 0; j < cols; j++) {
                int best = prev[j];
                if (j > 0) best = min(best, prev[j - 1]);
                if (j < cols - 1) best = min(best, prev[j + 1]);
                cur[j] = grid[i][j] + best;
            }
            prev = cur;
        }
        return *min_element(prev.begin(), prev.end());
    }
};`,
  },

  // minFallingPath(grid: List[List[int]]) -> int  — identical adjacent-column DP.
  'pghub-grid-min-path-cost': {
    javascript: `var minFallingPath = function(grid) {
    const n = grid.length, m = grid[0].length;
    let dp = grid[0].slice();
    for (let r = 1; r < n; r++) {
        const ndp = new Array(m).fill(0);
        for (let c = 0; c < m; c++) {
            let best = dp[c];
            if (c > 0 && dp[c - 1] < best) best = dp[c - 1];
            if (c + 1 < m && dp[c + 1] < best) best = dp[c + 1];
            ndp[c] = grid[r][c] + best;
        }
        dp = ndp;
    }
    return Math.min(...dp);
};`,
    java: `class Solution {
    public int minFallingPath(int[][] grid) {
        int n = grid.length, m = grid[0].length;
        int[] dp = grid[0].clone();
        for (int r = 1; r < n; r++) {
            int[] ndp = new int[m];
            for (int c = 0; c < m; c++) {
                int best = dp[c];
                if (c > 0 && dp[c - 1] < best) best = dp[c - 1];
                if (c + 1 < m && dp[c + 1] < best) best = dp[c + 1];
                ndp[c] = grid[r][c] + best;
            }
            dp = ndp;
        }
        int ans = dp[0];
        for (int v : dp) ans = Math.min(ans, v);
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFallingPath(vector<vector<int>>& grid) {
        int n = grid.size(), m = grid[0].size();
        vector<int> dp = grid[0];
        for (int r = 1; r < n; r++) {
            vector<int> ndp(m, 0);
            for (int c = 0; c < m; c++) {
                int best = dp[c];
                if (c > 0 && dp[c - 1] < best) best = dp[c - 1];
                if (c + 1 < m && dp[c + 1] < best) best = dp[c + 1];
                ndp[c] = grid[r][c] + best;
            }
            dp = ndp;
        }
        return *min_element(dp.begin(), dp.end());
    }
};`,
  },

  // hasColorCycle(grid: List[List[int]]) -> bool  — DFS cycle detect per color.
  'pghub-grid-treasure-loops': {
    javascript: `var hasColorCycle = function(grid) {
    const R = grid.length, C = R ? grid[0].length : 0;
    const visited = Array.from({length: R}, () => new Array(C).fill(false));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const dfs = (r, c, pr, pc, color) => {
        visited[r][c] = true;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] === color) {
                if (!(nr === pr && nc === pc)) {
                    if (visited[nr][nc]) return true;
                    if (dfs(nr, nc, r, c, color)) return true;
                }
            }
        }
        return false;
    };
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (!visited[r][c])
                if (dfs(r, c, -1, -1, grid[r][c])) return true;
    return false;
};`,
    java: `class Solution {
    private int R, C;
    private boolean[][] visited;
    private int[][] grid;
    private int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    public boolean hasColorCycle(int[][] grid) {
        this.grid = grid;
        R = grid.length;
        C = R > 0 ? grid[0].length : 0;
        visited = new boolean[R][C];
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (!visited[r][c])
                    if (dfs(r, c, -1, -1, grid[r][c])) return true;
        return false;
    }
    private boolean dfs(int r, int c, int pr, int pc, int color) {
        visited[r][c] = true;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] == color) {
                if (!(nr == pr && nc == pc)) {
                    if (visited[nr][nc]) return true;
                    if (dfs(nr, nc, r, c, color)) return true;
                }
            }
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasColorCycle(vector<vector<int>>& grid) {
        int R = grid.size(), C = R ? (int)grid[0].size() : 0;
        vector<vector<bool>> visited(R, vector<bool>(C, false));
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        function<bool(int,int,int,int,int)> dfs = [&](int r, int c, int pr, int pc, int color) -> bool {
            visited[r][c] = true;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] == color) {
                    if (!(nr == pr && nc == pc)) {
                        if (visited[nr][nc]) return true;
                        if (dfs(nr, nc, r, c, color)) return true;
                    }
                }
            }
            return false;
        };
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (!visited[r][c])
                    if (dfs(r, c, -1, -1, grid[r][c])) return true;
        return false;
    }
};`,
  },

  // isSubsequence(a: str, b: str) -> bool  — two-pointer.
  'pghub-is-subsequence': {
    javascript: `var isSubsequence = function(a, b) {
    let i = 0;
    for (const ch of b) {
        if (i < a.length && a[i] === ch) i++;
    }
    return i === a.length;
};`,
    java: `class Solution {
    public boolean isSubsequence(String a, String b) {
        int i = 0;
        for (int j = 0; j < b.length(); j++) {
            if (i < a.length() && a.charAt(i) == b.charAt(j)) i++;
        }
        return i == a.length();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isSubsequence(string a, string b) {
        int i = 0;
        for (char ch : b) {
            if (i < (int)a.size() && a[i] == ch) i++;
        }
        return i == (int)a.size();
    }
};`,
  },

  // perimeter(grid: List[List[int]]) -> int  — island perimeter via shared edges.
  'pghub-island-fence-perimeter': {
    javascript: `var perimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let total = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                total += 4;
                if (r > 0 && grid[r - 1][c] === 1) total -= 2;
                if (c > 0 && grid[r][c - 1] === 1) total -= 2;
            }
        }
    }
    return total;
};`,
    java: `class Solution {
    public int perimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int total = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    total += 4;
                    if (r > 0 && grid[r - 1][c] == 1) total -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) total -= 2;
                }
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int perimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int total = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    total += 4;
                    if (r > 0 && grid[r - 1][c] == 1) total -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) total -= 2;
                }
            }
        }
        return total;
    }
};`,
  },

  // perimeter(grid: List[List[int]]) -> int  — same island perimeter.
  'pghub-island-perimeter': {
    javascript: `var perimeter = function(grid) {
    const m = grid.length, n = grid[0].length;
    let total = 0;
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1) {
                total += 4;
                if (i > 0 && grid[i - 1][j] === 1) total -= 2;
                if (j > 0 && grid[i][j - 1] === 1) total -= 2;
            }
        }
    }
    return total;
};`,
    java: `class Solution {
    public int perimeter(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int total = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) {
                    total += 4;
                    if (i > 0 && grid[i - 1][j] == 1) total -= 2;
                    if (j > 0 && grid[i][j - 1] == 1) total -= 2;
                }
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int perimeter(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        int total = 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) {
                    total += 4;
                    if (i > 0 && grid[i - 1][j] == 1) total -= 2;
                    if (j > 0 && grid[i][j - 1] == 1) total -= 2;
                }
            }
        }
        return total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — same island perimeter.
  'pghub-island-perimeter-count': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let per = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                per += 4;
                if (r > 0 && grid[r - 1][c] === 1) per -= 2;
                if (c > 0 && grid[r][c - 1] === 1) per -= 2;
            }
        }
    }
    return per;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int per = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    per += 4;
                    if (r > 0 && grid[r - 1][c] == 1) per -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) per -= 2;
                }
            }
        }
        return per;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int per = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    per += 4;
                    if (r > 0 && grid[r - 1][c] == 1) per -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) per -= 2;
                }
            }
        }
        return per;
    }
};`,
  },

  // canFinish(jumps: List[int]) -> bool  — jump game reachability.
  'pghub-jump-reachable': {
    javascript: `var canFinish = function(jumps) {
    let reach = 0;
    const last = jumps.length - 1, n = jumps.length;
    let i = 0;
    while (i < n) {
        if (i > reach) return false;
        reach = Math.max(reach, i + jumps[i]);
        if (reach >= last) return true;
        i++;
    }
    return reach >= last;
};`,
    java: `class Solution {
    public boolean canFinish(int[] jumps) {
        int reach = 0;
        int last = jumps.length - 1, n = jumps.length;
        int i = 0;
        while (i < n) {
            if (i > reach) return false;
            reach = Math.max(reach, i + jumps[i]);
            if (reach >= last) return true;
            i++;
        }
        return reach >= last;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFinish(vector<int>& jumps) {
        int reach = 0;
        int last = (int)jumps.size() - 1, n = (int)jumps.size();
        int i = 0;
        while (i < n) {
            if (i > reach) return false;
            reach = max(reach, i + jumps[i]);
            if (reach >= last) return true;
            i++;
        }
        return reach >= last;
    }
};`,
  },

  // longestKDistinct(s: str, k: int) -> int  — sliding window, ≤k distinct.
  'pghub-k-distinct-window': {
    javascript: `var longestKDistinct = function(s, k) {
    if (k === 0) return 0;
    const counts = new Map();
    let left = 0, best = 0;
    for (let right = 0; right < s.length; right++) {
        const ch = s[right];
        counts.set(ch, (counts.get(ch) || 0) + 1);
        while (counts.size > k) {
            const lc = s[left];
            counts.set(lc, counts.get(lc) - 1);
            if (counts.get(lc) === 0) counts.delete(lc);
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestKDistinct(String s, int k) {
        if (k == 0) return 0;
        Map<Character, Integer> counts = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            counts.merge(ch, 1, Integer::sum);
            while (counts.size() > k) {
                char lc = s.charAt(left);
                counts.merge(lc, -1, Integer::sum);
                if (counts.get(lc) == 0) counts.remove(lc);
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestKDistinct(string s, int k) {
        if (k == 0) return 0;
        unordered_map<char, int> counts;
        int left = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            counts[s[right]]++;
            while ((int)counts.size() > k) {
                char lc = s[left];
                counts[lc]--;
                if (counts[lc] == 0) counts.erase(lc);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // exactKnapsack(weights: List[int], values: List[int], cap: int) -> int
  'pghub-knapsack-exact-weight': {
    javascript: `var exactKnapsack = function(weights, values, cap) {
    const NEG = -Infinity;
    const dp = new Array(cap + 1).fill(NEG);
    dp[0] = 0;
    for (let idx = 0; idx < weights.length; idx++) {
        const w = weights[idx], v = values[idx];
        for (let c = cap; c >= w; c--) {
            if (dp[c - w] !== NEG) dp[c] = Math.max(dp[c], dp[c - w] + v);
        }
    }
    return dp[cap] !== NEG ? dp[cap] : -1;
};`,
    java: `class Solution {
    public int exactKnapsack(int[] weights, int[] values, int cap) {
        final int NEG = Integer.MIN_VALUE;
        int[] dp = new int[cap + 1];
        java.util.Arrays.fill(dp, NEG);
        dp[0] = 0;
        for (int idx = 0; idx < weights.length; idx++) {
            int w = weights[idx], v = values[idx];
            for (int c = cap; c >= w; c--) {
                if (dp[c - w] != NEG) dp[c] = Math.max(dp[c], dp[c - w] + v);
            }
        }
        return dp[cap] != NEG ? dp[cap] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int exactKnapsack(vector<int>& weights, vector<int>& values, int cap) {
        const int NEG = INT_MIN;
        vector<int> dp(cap + 1, NEG);
        dp[0] = 0;
        for (size_t idx = 0; idx < weights.size(); idx++) {
            int w = weights[idx], v = values[idx];
            for (int c = cap; c >= w; c--) {
                if (dp[c - w] != NEG) dp[c] = max(dp[c], dp[c - w] + v);
            }
        }
        return dp[cap] != NEG ? dp[cap] : -1;
    }
};`,
  },

  // kthDistinct(words: List[str], k: int) -> str  — kth string appearing once.
  'pghub-kth-distinct-string': {
    javascript: `var kthDistinct = function(words, k) {
    const counts = new Map();
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
    for (const w of words) {
        if (counts.get(w) === 1) {
            k--;
            if (k === 0) return w;
        }
    }
    return "";
};`,
    java: `import java.util.*;
class Solution {
    public String kthDistinct(String[] words, int k) {
        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);
        for (String w : words) {
            if (counts.get(w) == 1) {
                k--;
                if (k == 0) return w;
            }
        }
        return "";
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string kthDistinct(vector<string>& words, int k) {
        unordered_map<string, int> counts;
        for (auto& w : words) counts[w]++;
        for (auto& w : words) {
            if (counts[w] == 1) {
                k--;
                if (k == 0) return w;
            }
        }
        return "";
    }
};`,
  },

  // kthLargest(k: int, nums: List[int]) -> List[int]  — streaming min-heap of size k.
  'pghub-kth-largest-stream': {
    javascript: `var kthLargest = function(k, nums) {
    // Hand-rolled min-heap.
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    const out = [];
    for (const x of nums) {
        push(x);
        if (heap.length > k) pop();
        out.push(heap.length === k ? heap[0] : -1);
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] kthLargest(int k, int[] nums) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int[] out = new int[nums.length];
        for (int i = 0; i < nums.length; i++) {
            heap.offer(nums[i]);
            if (heap.size() > k) heap.poll();
            out[i] = heap.size() == k ? heap.peek() : -1;
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargest(int k, vector<int>& nums) {
        priority_queue<int, vector<int>, greater<int>> heap;
        vector<int> out;
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
            out.push_back((int)heap.size() == k ? heap.top() : -1);
        }
        return out;
    }
};`,
  },

  // kthSmallestSum(a: List[int], b: List[int], k: int) -> int  — k-way heap merge.
  'pghub-kth-smallest-pair-sum': {
    javascript: `var kthSmallestSum = function(a, b, k) {
    if (a.length === 0 || b.length === 0) return -1;
    a = a.slice().sort((x, y) => x - y);
    b = b.slice().sort((x, y) => x - y);
    // Min-heap of [sum, i, j] ordered by sum.
    const heap = [];
    const less = (x, y) => x[0] < y[0];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (!less(heap[i], heap[p])) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && less(heap[l], heap[s])) s = l;
            if (r < n && less(heap[r], heap[s])) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    push([a[0] + b[0], 0, 0]);
    const seen = new Set(['0,0']);
    let res = null;
    for (let t = 0; t < k; t++) {
        if (heap.length === 0) return -1;
        const [val, i, j] = pop();
        res = val;
        if (i + 1 < a.length && !seen.has((i + 1) + ',' + j)) {
            seen.add((i + 1) + ',' + j);
            push([a[i + 1] + b[j], i + 1, j]);
        }
        if (j + 1 < b.length && !seen.has(i + ',' + (j + 1))) {
            seen.add(i + ',' + (j + 1));
            push([a[i] + b[j + 1], i, j + 1]);
        }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int kthSmallestSum(int[] a, int[] b, int k) {
        if (a.length == 0 || b.length == 0) return -1;
        int[] aa = a.clone(); Arrays.sort(aa);
        int[] bb = b.clone(); Arrays.sort(bb);
        PriorityQueue<long[]> heap = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
        Set<Long> seen = new HashSet<>();
        heap.offer(new long[]{(long) aa[0] + bb[0], 0, 0});
        seen.add(0L);
        long res = 0;
        for (int t = 0; t < k; t++) {
            if (heap.isEmpty()) return -1;
            long[] top = heap.poll();
            res = top[0];
            int i = (int) top[1], j = (int) top[2];
            if (i + 1 < aa.length) {
                long key = (long)(i + 1) * bb.length + j;
                if (seen.add(key)) heap.offer(new long[]{(long) aa[i + 1] + bb[j], i + 1, j});
            }
            if (j + 1 < bb.length) {
                long key = (long) i * bb.length + (j + 1);
                if (seen.add(key)) heap.offer(new long[]{(long) aa[i] + bb[j + 1], i, j + 1});
            }
        }
        return (int) res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSmallestSum(vector<int>& a, vector<int>& b, int k) {
        if (a.empty() || b.empty()) return -1;
        vector<int> aa = a, bb = b;
        sort(aa.begin(), aa.end());
        sort(bb.begin(), bb.end());
        typedef tuple<long long,int,int> T;
        priority_queue<T, vector<T>, greater<T>> heap;
        set<pair<int,int>> seen;
        heap.push({(long long)aa[0] + bb[0], 0, 0});
        seen.insert({0, 0});
        long long res = 0;
        for (int t = 0; t < k; t++) {
            if (heap.empty()) return -1;
            auto [val, i, j] = heap.top(); heap.pop();
            res = val;
            if (i + 1 < (int)aa.size() && !seen.count({i + 1, j})) {
                seen.insert({i + 1, j});
                heap.push({(long long)aa[i + 1] + bb[j], i + 1, j});
            }
            if (j + 1 < (int)bb.size() && !seen.count({i, j + 1})) {
                seen.insert({i, j + 1});
                heap.push({(long long)aa[i] + bb[j + 1], i, j + 1});
            }
        }
        return (int) res;
    }
};`,
  },

  // brightestWindow(levels: List[int], k: int) -> int  — max window sum.
  'pghub-lantern-brightness-window': {
    javascript: `var brightestWindow = function(levels, k) {
    if (k <= 0 || k > levels.length) return 0;
    let cur = 0;
    for (let i = 0; i < k; i++) cur += levels[i];
    let best = cur;
    for (let i = k; i < levels.length; i++) {
        cur += levels[i] - levels[i - k];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int brightestWindow(int[] levels, int k) {
        if (k <= 0 || k > levels.length) return 0;
        int cur = 0;
        for (int i = 0; i < k; i++) cur += levels[i];
        int best = cur;
        for (int i = k; i < levels.length; i++) {
            cur += levels[i] - levels[i - k];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int brightestWindow(vector<int>& levels, int k) {
        int n = levels.size();
        if (k <= 0 || k > n) return 0;
        int cur = 0;
        for (int i = 0; i < k; i++) cur += levels[i];
        int best = cur;
        for (int i = k; i < n; i++) {
            cur += levels[i] - levels[i - k];
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // lowestBalance(deltas: List[int]) -> int  — running prefix minimum (≤ 0).
  'pghub-ledger-balance': {
    javascript: `var lowestBalance = function(deltas) {
    let balance = 0, low = 0;
    for (const d of deltas) {
        balance += d;
        if (balance < low) low = balance;
    }
    return low;
};`,
    java: `class Solution {
    public int lowestBalance(int[] deltas) {
        int balance = 0, low = 0;
        for (int d : deltas) {
            balance += d;
            if (balance < low) low = balance;
        }
        return low;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lowestBalance(vector<int>& deltas) {
        int balance = 0, low = 0;
        for (int d : deltas) {
            balance += d;
            if (balance < low) low = balance;
        }
        return low;
    }
};`,
  },

  // firstUnbalanced(entries: List[List[int]]) -> int  — first entry of non-zero account.
  'pghub-ledger-reconcile': {
    javascript: `var firstUnbalanced = function(entries) {
    const totals = new Map();
    for (const [acc, amt] of entries) totals.set(acc, (totals.get(acc) || 0) + amt);
    const bad = new Set();
    for (const [acc, t] of totals) if (t !== 0) bad.add(acc);
    for (let i = 0; i < entries.length; i++) {
        if (bad.has(entries[i][0])) return i;
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int firstUnbalanced(int[][] entries) {
        Map<Integer, Integer> totals = new HashMap<>();
        for (int[] e : entries) totals.merge(e[0], e[1], Integer::sum);
        Set<Integer> bad = new HashSet<>();
        for (Map.Entry<Integer, Integer> en : totals.entrySet())
            if (en.getValue() != 0) bad.add(en.getKey());
        for (int i = 0; i < entries.length; i++) {
            if (bad.contains(entries[i][0])) return i;
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstUnbalanced(vector<vector<int>>& entries) {
        unordered_map<int, int> totals;
        for (auto& e : entries) totals[e[0]] += e[1];
        unordered_set<int> bad;
        for (auto& kv : totals) if (kv.second != 0) bad.insert(kv.first);
        for (int i = 0; i < (int)entries.size(); i++) {
            if (bad.count(entries[i][0])) return i;
        }
        return -1;
    }
};`,
  },

  // kthSetBitNumber(k: int) -> int  — kth number with exactly two set bits.
  'pghub-lexicographic-bit-sequence': {
    javascript: `var kthSetBitNumber = function(k) {
    let n = 0, found = 0;
    while (true) {
        n++;
        let bits = 0, x = n;
        while (x) { bits += x & 1; x >>= 1; }
        if (bits === 2) {
            found++;
            if (found === k) return n;
        }
    }
};`,
    java: `class Solution {
    public int kthSetBitNumber(int k) {
        int n = 0, found = 0;
        while (true) {
            n++;
            if (Integer.bitCount(n) == 2) {
                found++;
                if (found == k) return n;
            }
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSetBitNumber(int k) {
        int n = 0, found = 0;
        while (true) {
            n++;
            if (__builtin_popcount((unsigned)n) == 2) {
                found++;
                if (found == k) return n;
            }
        }
    }
};`,
  },

  // maxDiagonal(grid: List[List[int]]) -> int  — best ↘ diagonal sum.
  'pghub-max-diagonal-sum': {
    javascript: `var maxDiagonal = function(grid) {
    const n = grid.length, m = n ? grid[0].length : 0;
    let best = null;
    for (let start = 0; start < m; start++) {
        let i = 0, j = start, s = 0;
        while (i < n && j < m) { s += grid[i][j]; i++; j++; }
        best = best === null ? s : Math.max(best, s);
    }
    for (let start = 1; start < n; start++) {
        let i = start, j = 0, s = 0;
        while (i < n && j < m) { s += grid[i][j]; i++; j++; }
        best = best === null ? s : Math.max(best, s);
    }
    return best;
};`,
    java: `class Solution {
    public int maxDiagonal(int[][] grid) {
        int n = grid.length, m = n > 0 ? grid[0].length : 0;
        Integer best = null;
        for (int start = 0; start < m; start++) {
            int i = 0, j = start, s = 0;
            while (i < n && j < m) { s += grid[i][j]; i++; j++; }
            best = best == null ? s : Math.max(best, s);
        }
        for (int start = 1; start < n; start++) {
            int i = start, j = 0, s = 0;
            while (i < n && j < m) { s += grid[i][j]; i++; j++; }
            best = best == null ? s : Math.max(best, s);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDiagonal(vector<vector<int>>& grid) {
        int n = grid.size(), m = n ? (int)grid[0].size() : 0;
        bool has = false;
        int best = 0;
        for (int start = 0; start < m; start++) {
            int i = 0, j = start, s = 0;
            while (i < n && j < m) { s += grid[i][j]; i++; j++; }
            best = has ? max(best, s) : s; has = true;
        }
        for (int start = 1; start < n; start++) {
            int i = start, j = 0, s = 0;
            while (i < n && j < m) { s += grid[i][j]; i++; j++; }
            best = has ? max(best, s) : s; has = true;
        }
        return best;
    }
};`,
  },
};
