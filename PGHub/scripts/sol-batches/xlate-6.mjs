// xlate-6.mjs — faithful JS/Java/C++ translations of verified Python references
// for slugs at filtered-targets indices [150, 180). Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
// Reference = solutions.python in PGcode_problems. Graded by backfill-solutions.mjs
// against stored test_cases via Judge0; only passing langs are written.
//
// SKIPPED: none — all 30 rows have primitive / int[] / int[][] / String[] params
// and int / String / int[] returns that the driver can grade.
//
// Translation notes:
//  - b19-signal-towers: Python bisect_left → hand-rolled lower_bound.
//  - b20-fleet-charge / b21-courier-fuel: Python heapq → hand-rolled binary heap
//    in JS (min-heap of ends / max-heap via negation for fuel); PriorityQueue in
//    Java; priority_queue in C++.
//  - b20-stair-paint: modular DP; Python's % is non-negative, so the subtraction
//    branch is normalized with ((window % MOD) + MOD) % MOD in JS/Java/C++.
//  - b20-warehouse-bsearch / b20-relay-tree / b21-network-delay: long/long long
//    used where prefix/path sums can exceed int range.
//  - b21-network-delay: Dijkstra with a min-heap keyed on distance.

export default {
  // minRadius(houses: List[int], towers: List[int]) -> int
  'pghub-b19-signal-towers': {
    javascript: `var minRadius = function(houses, towers) {
    towers = towers.slice().sort((a, b) => a - b);
    let worst = 0;
    for (const h of houses) {
        let lo = 0, hi = towers.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (towers[mid] < h) lo = mid + 1;
            else hi = mid;
        }
        const i = lo;
        let best = Infinity;
        if (i < towers.length) best = Math.min(best, towers[i] - h);
        if (i > 0) best = Math.min(best, h - towers[i - 1]);
        worst = Math.max(worst, best);
    }
    return worst;
};`,
    java: `import java.util.*;
class Solution {
    public int minRadius(int[] houses, int[] towers) {
        towers = towers.clone();
        Arrays.sort(towers);
        int worst = 0;
        for (int h : houses) {
            int lo = 0, hi = towers.length;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (towers[mid] < h) lo = mid + 1;
                else hi = mid;
            }
            int i = lo;
            int best = Integer.MAX_VALUE;
            if (i < towers.length) best = Math.min(best, towers[i] - h);
            if (i > 0) best = Math.min(best, h - towers[i - 1]);
            worst = Math.max(worst, best);
        }
        return worst;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRadius(vector<int>& houses, vector<int>& towers) {
        vector<int> t = towers;
        sort(t.begin(), t.end());
        int worst = 0;
        for (int h : houses) {
            int i = (int)(lower_bound(t.begin(), t.end(), h) - t.begin());
            int best = INT_MAX;
            if (i < (int)t.size()) best = min(best, t[i] - h);
            if (i > 0) best = min(best, h - t[i - 1]);
            worst = max(worst, best);
        }
        return worst;
    }
};`,
  },

  // trappedWater(heights: List[int]) -> int  — two-pointer rain water.
  'pghub-b19-tide-pools': {
    javascript: `var trappedWater = function(heights) {
    if (!heights || heights.length === 0) return 0;
    let left = 0, right = heights.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (left < right) {
        if (heights[left] <= heights[right]) {
            if (heights[left] >= leftMax) leftMax = heights[left];
            else total += leftMax - heights[left];
            left++;
        } else {
            if (heights[right] >= rightMax) rightMax = heights[right];
            else total += rightMax - heights[right];
            right--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trappedWater(int[] heights) {
        if (heights == null || heights.length == 0) return 0;
        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else total += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else total += rightMax - heights[right];
                right--;
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& heights) {
        if (heights.empty()) return 0;
        int left = 0, right = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else total += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else total += rightMax - heights[right];
                right--;
            }
        }
        return total;
    }
};`,
  },

  // lastSurvivor(n: int, k: int) -> int  — Josephus.
  'pghub-b19-token-ring': {
    javascript: `var lastSurvivor = function(n, k) {
    let res = 0;
    for (let i = 2; i <= n; i++) {
        res = (res + k) % i;
    }
    return res + 1;
};`,
    java: `class Solution {
    public int lastSurvivor(int n, int k) {
        int res = 0;
        for (int i = 2; i <= n; i++) {
            res = (res + k) % i;
        }
        return res + 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastSurvivor(int n, int k) {
        int res = 0;
        for (int i = 2; i <= n; i++) {
            res = (res + k) % i;
        }
        return res + 1;
    }
};`,
  },

  // maxProfit(sizes: List[int]) -> int  — burst-balloons interval DP.
  'pghub-b19-water-balloons': {
    javascript: `var maxProfit = function(sizes) {
    const vals = [1, ...sizes, 1];
    const n = vals.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(0));
    for (let len = 2; len < n; len++) {
        for (let left = 0; left < n - len; left++) {
            const right = left + len;
            let best = 0;
            for (let k = left + 1; k < right; k++) {
                const gain = vals[left] * vals[k] * vals[right] + dp[left][k] + dp[k][right];
                if (gain > best) best = gain;
            }
            dp[left][right] = best;
        }
    }
    return dp[0][n - 1];
};`,
    java: `class Solution {
    public int maxProfit(int[] sizes) {
        int n = sizes.length + 2;
        int[] vals = new int[n];
        vals[0] = 1; vals[n - 1] = 1;
        for (int i = 0; i < sizes.length; i++) vals[i + 1] = sizes[i];
        int[][] dp = new int[n][n];
        for (int len = 2; len < n; len++) {
            for (int left = 0; left < n - len; left++) {
                int right = left + len;
                int best = 0;
                for (int k = left + 1; k < right; k++) {
                    int gain = vals[left] * vals[k] * vals[right] + dp[left][k] + dp[k][right];
                    if (gain > best) best = gain;
                }
                dp[left][right] = best;
            }
        }
        return dp[0][n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& sizes) {
        vector<int> vals;
        vals.push_back(1);
        for (int x : sizes) vals.push_back(x);
        vals.push_back(1);
        int n = (int)vals.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        for (int len = 2; len < n; len++) {
            for (int left = 0; left < n - len; left++) {
                int right = left + len;
                int best = 0;
                for (int k = left + 1; k < right; k++) {
                    int gain = vals[left] * vals[k] * vals[right] + dp[left][k] + dp[k][right];
                    if (gain > best) best = gain;
                }
                dp[left][right] = best;
            }
        }
        return dp[0][n - 1];
    }
};`,
  },

  // encode(s: str, k: int) -> str  — index-shifted Caesar cipher.
  'pghub-b20-cipher-shift': {
    javascript: `var encode = function(s, k) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch >= 'a' && ch <= 'z') {
            const shift = ((k + i) % 26 + 26) % 26;
            const code = (s.charCodeAt(i) - 97 + shift) % 26 + 97;
            out += String.fromCharCode(code);
        } else {
            out += ch;
        }
    }
    return out;
};`,
    java: `class Solution {
    public String encode(String s, int k) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch >= 'a' && ch <= 'z') {
                int shift = (((k + i) % 26) + 26) % 26;
                int code = (ch - 'a' + shift) % 26 + 'a';
                out.append((char) code);
            } else {
                out.append(ch);
            }
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string encode(string s, int k) {
        string out;
        for (int i = 0; i < (int)s.size(); i++) {
            char ch = s[i];
            if (ch >= 'a' && ch <= 'z') {
                int shift = (((k + i) % 26) + 26) % 26;
                int code = (ch - 'a' + shift) % 26 + 'a';
                out.push_back((char) code);
            } else {
                out.push_back(ch);
            }
        }
        return out;
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int  — unbounded knapsack count.
  'pghub-b20-coin-rolls': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of coins) {
        for (let v = c; v <= amount; v++) {
            dp[v] += dp[v - c];
        }
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int c : coins) {
            for (int v = c; v <= amount; v++) {
                dp[v] += dp[v - c];
            }
        }
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins) {
            for (int v = c; v <= amount; v++) {
                dp[v] += dp[v - c];
            }
        }
        return (int) dp[amount];
    }
};`,
  },

  // countSafeWindows(loads: List[int], k: int, cap: int) -> int  — sliding window sum.
  'pghub-b20-conveyor-buffer': {
    javascript: `var countSafeWindows = function(loads, k, cap) {
    const n = loads.length;
    if (k > n) return 0;
    let window = 0;
    for (let i = 0; i < k; i++) window += loads[i];
    let count = window <= cap ? 1 : 0;
    for (let i = k; i < n; i++) {
        window += loads[i] - loads[i - k];
        if (window <= cap) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countSafeWindows(int[] loads, int k, int cap) {
        int n = loads.length;
        if (k > n) return 0;
        long window = 0;
        for (int i = 0; i < k; i++) window += loads[i];
        int count = window <= cap ? 1 : 0;
        for (int i = k; i < n; i++) {
            window += loads[i] - loads[i - k];
            if (window <= cap) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSafeWindows(vector<int>& loads, int k, int cap) {
        int n = (int)loads.size();
        if (k > n) return 0;
        long long window = 0;
        for (int i = 0; i < k; i++) window += loads[i];
        int count = window <= cap ? 1 : 0;
        for (int i = k; i < n; i++) {
            window += loads[i] - loads[i - k];
            if (window <= cap) count++;
        }
        return count;
    }
};`,
  },

  // minChargers(sessions: List[List[int]]) -> int  — heapq of end times → JS heap.
  'pghub-b20-fleet-charge': {
    javascript: `var minChargers = function(sessions) {
    const s = sessions.slice().sort((a, b) => a[0] - b[0]);
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let s2 = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] < heap[s2]) s2 = l;
            if (r < n && heap[r] < heap[s2]) s2 = r;
            if (s2 === i) break;
            [heap[s2], heap[i]] = [heap[i], heap[s2]]; i = s2;
        }
    };
    const push = (v) => { heap.push(v); up(heap.length - 1); };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    let best = 0;
    for (const [start, end] of s) {
        while (heap.length && heap[0] <= start) pop();
        push(end);
        best = Math.max(best, heap.length);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minChargers(int[][] sessions) {
        int[][] s = sessions.clone();
        Arrays.sort(s, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> ends = new PriorityQueue<>();
        int best = 0;
        for (int[] iv : s) {
            int start = iv[0], end = iv[1];
            while (!ends.isEmpty() && ends.peek() <= start) ends.poll();
            ends.offer(end);
            best = Math.max(best, ends.size());
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minChargers(vector<vector<int>>& sessions) {
        vector<vector<int>> s = sessions;
        sort(s.begin(), s.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> ends;
        int best = 0;
        for (auto& iv : s) {
            int start = iv[0], end = iv[1];
            while (!ends.empty() && ends.top() <= start) ends.pop();
            ends.push(end);
            best = max(best, (int)ends.size());
        }
        return best;
    }
};`,
  },

  // minWaterings(plants: List[int], reach: int) -> int  — greedy interval cover.
  'pghub-b20-garden-rows': {
    javascript: `var minWaterings = function(plants, reach) {
    let count = 0, i = 0;
    const n = plants.length;
    while (i < n) {
        count++;
        const center = plants[i] + reach;
        const limit = center + reach;
        while (i < n && plants[i] <= limit) i++;
    }
    return count;
};`,
    java: `class Solution {
    public int minWaterings(int[] plants, int reach) {
        int count = 0, i = 0, n = plants.length;
        while (i < n) {
            count++;
            int center = plants[i] + reach;
            int limit = center + reach;
            while (i < n && plants[i] <= limit) i++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minWaterings(vector<int>& plants, int reach) {
        int count = 0, i = 0, n = (int)plants.size();
        while (i < n) {
            count++;
            int center = plants[i] + reach;
            int limit = center + reach;
            while (i < n && plants[i] <= limit) i++;
        }
        return count;
    }
};`,
  },

  // finalBalance(ops: List[str]) -> int  — undo-stack ledger.
  'pghub-b20-ledger-rollback': {
    javascript: `var finalBalance = function(ops) {
    let balance = 0;
    const history = [];
    for (const op of ops) {
        if (op === 'undo') {
            if (history.length) balance -= history.pop();
        } else {
            const v = parseInt(op, 10);
            balance += v;
            history.push(v);
        }
    }
    return balance;
};`,
    java: `import java.util.*;
class Solution {
    public int finalBalance(String[] ops) {
        int balance = 0;
        Deque<Integer> history = new ArrayDeque<>();
        for (String op : ops) {
            if (op.equals("undo")) {
                if (!history.isEmpty()) balance -= history.pop();
            } else {
                int v = Integer.parseInt(op);
                balance += v;
                history.push(v);
            }
        }
        return balance;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalBalance(vector<string>& ops) {
        int balance = 0;
        vector<int> history;
        for (const string& op : ops) {
            if (op == "undo") {
                if (!history.empty()) { balance -= history.back(); history.pop_back(); }
            } else {
                int v = stoi(op);
                balance += v;
                history.push_back(v);
            }
        }
        return balance;
    }
};`,
  },

  // minStepsOut(grid: List[List[int]]) -> int  — BFS shortest path.
  'pghub-b20-maze-flood': {
    javascript: `var minStepsOut = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    if (grid[0][0] === 1 || grid[rows - 1][cols - 1] === 1) return -1;
    if (rows === 1 && cols === 1) return 0;
    const visited = Array.from({length: rows}, () => new Array(cols).fill(false));
    visited[0][0] = true;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let q = [[0, 0, 0]];
    let head = 0;
    while (head < q.length) {
        const [r, c, d] = q[head++];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === 0) {
                if (nr === rows - 1 && nc === cols - 1) return d + 1;
                visited[nr][nc] = true;
                q.push([nr, nc, d + 1]);
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minStepsOut(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        boolean[][] visited = new boolean[rows][cols];
        visited[0][0] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        ArrayDeque<int[]> q = new ArrayDeque<>();
        q.offer(new int[]{0, 0, 0});
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1], d = cur[2];
            for (int[] dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] == 0) {
                    if (nr == rows - 1 && nc == cols - 1) return d + 1;
                    visited[nr][nc] = true;
                    q.offer(new int[]{nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minStepsOut(vector<vector<int>>& grid) {
        int rows = (int)grid.size(), cols = (int)grid[0].size();
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<bool>> visited(rows, vector<bool>(cols, false));
        visited[0][0] = true;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        while (!q.empty()) {
            auto cur = q.front(); q.pop();
            int r = cur[0], c = cur[1], d = cur[2];
            for (auto& dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] == 0) {
                    if (nr == rows - 1 && nc == cols - 1) return d + 1;
                    visited[nr][nc] = true;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // totalCovered(ranges: List[List[int]]) -> int  — merge intervals, sum lengths.
  'pghub-b20-palette-merge': {
    javascript: `var totalCovered = function(ranges) {
    const ivs = ranges.slice().sort((a, b) => a[0] - b[0]);
    let total = 0;
    let curStart = ivs[0][0], curEnd = ivs[0][1];
    for (let i = 1; i < ivs.length; i++) {
        const s = ivs[i][0], e = ivs[i][1];
        if (s <= curEnd + 1) {
            curEnd = Math.max(curEnd, e);
        } else {
            total += curEnd - curStart + 1;
            curStart = s; curEnd = e;
        }
    }
    total += curEnd - curStart + 1;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int totalCovered(int[][] ranges) {
        int[][] ivs = ranges.clone();
        Arrays.sort(ivs, (a, b) -> Integer.compare(a[0], b[0]));
        long total = 0;
        int curStart = ivs[0][0], curEnd = ivs[0][1];
        for (int i = 1; i < ivs.length; i++) {
            int s = ivs[i][0], e = ivs[i][1];
            if (s <= curEnd + 1) {
                curEnd = Math.max(curEnd, e);
            } else {
                total += curEnd - curStart + 1;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart + 1;
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalCovered(vector<vector<int>>& ranges) {
        vector<vector<int>> ivs = ranges;
        sort(ivs.begin(), ivs.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        long long total = 0;
        int curStart = ivs[0][0], curEnd = ivs[0][1];
        for (size_t i = 1; i < ivs.size(); i++) {
            int s = ivs[i][0], e = ivs[i][1];
            if (s <= curEnd + 1) {
                curEnd = max(curEnd, e);
            } else {
                total += curEnd - curStart + 1;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart + 1;
        return (int) total;
    }
};`,
  },

  // maxSubtreeBonus(parent: List[int], bonus: List[int]) -> int  — subtree sums.
  'pghub-b20-relay-tree': {
    javascript: `var maxSubtreeBonus = function(parent, bonus) {
    const n = parent.length;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    const subtotal = new Array(n).fill(0);
    const order = [];
    const stack = [root];
    while (stack.length) {
        const u = stack.pop();
        order.push(u);
        for (const c of children[u]) stack.push(c);
    }
    let best = -Infinity;
    for (let idx = order.length - 1; idx >= 0; idx--) {
        const u = order[idx];
        subtotal[u] = bonus[u];
        for (const c of children[u]) subtotal[u] += subtotal[c];
        if (subtotal[u] > best) best = subtotal[u];
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxSubtreeBonus(int[] parent, int[] bonus) {
        int n = parent.length;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        long[] subtotal = new long[n];
        int[] order = new int[n];
        int oi = 0;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            int u = stack.pop();
            order[oi++] = u;
            for (int c : children.get(u)) stack.push(c);
        }
        long best = Long.MIN_VALUE;
        for (int idx = oi - 1; idx >= 0; idx--) {
            int u = order[idx];
            subtotal[u] = bonus[u];
            for (int c : children.get(u)) subtotal[u] += subtotal[c];
            if (subtotal[u] > best) best = subtotal[u];
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSubtreeBonus(vector<int>& parent, vector<int>& bonus) {
        int n = (int)parent.size();
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        vector<long long> subtotal(n, 0);
        vector<int> order;
        vector<int> stack = {root};
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();
            order.push_back(u);
            for (int c : children[u]) stack.push_back(c);
        }
        long long best = LLONG_MIN;
        for (int idx = (int)order.size() - 1; idx >= 0; idx--) {
            int u = order[idx];
            subtotal[u] = bonus[u];
            for (int c : children[u]) subtotal[u] += subtotal[c];
            if (subtotal[u] > best) best = subtotal[u];
        }
        return (int) best;
    }
};`,
  },

  // rotateRoster(roster: List[int], k: int) -> List[int]  — right rotation.
  'pghub-b20-roster-rotate': {
    javascript: `var rotateRoster = function(roster, k) {
    const n = roster.length;
    k %= n;
    if (k === 0) return roster.slice();
    return roster.slice(n - k).concat(roster.slice(0, n - k));
};`,
    java: `class Solution {
    public int[] rotateRoster(int[] roster, int k) {
        int n = roster.length;
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = roster[i];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRoster(vector<int>& roster, int k) {
        int n = (int)roster.size();
        k %= n;
        vector<int> res(n);
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = roster[i];
        }
        return res;
    }
};`,
  },

  // decodeSignal(s: str) -> str  — run-length decode "<count><letter>".
  'pghub-b20-signal-decode': {
    javascript: `var decodeSignal = function(s) {
    let out = '';
    let num = 0;
    for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
            num = num * 10 + (ch.charCodeAt(0) - 48);
        } else {
            out += ch.repeat(num);
            num = 0;
        }
    }
    return out;
};`,
    java: `class Solution {
    public String decodeSignal(String s) {
        StringBuilder out = new StringBuilder();
        int num = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch >= '0' && ch <= '9') {
                num = num * 10 + (ch - '0');
            } else {
                for (int j = 0; j < num; j++) out.append(ch);
                num = 0;
            }
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decodeSignal(string s) {
        string out;
        int num = 0;
        for (char ch : s) {
            if (ch >= '0' && ch <= '9') {
                num = num * 10 + (ch - '0');
            } else {
                out.append(num, ch);
                num = 0;
            }
        }
        return out;
    }
};`,
  },

  // countClimbs(n: int, maxStep: int) -> int  — windowed DP mod 1e9+7.
  'pghub-b20-stair-paint': {
    javascript: `var countClimbs = function(n, maxStep) {
    const MOD = 1000000007n;
    const dp = new Array(n + 1).fill(0n);
    dp[0] = 1n;
    let window = 0n;
    for (let i = 1; i <= n; i++) {
        window = (window + dp[i - 1]) % MOD;
        if (i - maxStep - 1 >= 0) {
            window = ((window - dp[i - maxStep - 1]) % MOD + MOD) % MOD;
        }
        dp[i] = window;
    }
    return Number(dp[n] % MOD);
};`,
    java: `class Solution {
    public int countClimbs(int n, int maxStep) {
        final long MOD = 1000000007L;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        long window = 0;
        for (int i = 1; i <= n; i++) {
            window = (window + dp[i - 1]) % MOD;
            if (i - maxStep - 1 >= 0) {
                window = ((window - dp[i - maxStep - 1]) % MOD + MOD) % MOD;
            }
            dp[i] = window;
        }
        return (int) (dp[n] % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countClimbs(int n, int maxStep) {
        const long long MOD = 1000000007LL;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        long long window = 0;
        for (int i = 1; i <= n; i++) {
            window = (window + dp[i - 1]) % MOD;
            if (i - maxStep - 1 >= 0) {
                window = ((window - dp[i - maxStep - 1]) % MOD + MOD) % MOD;
            }
            dp[i] = window;
        }
        return (int) (dp[n] % MOD);
    }
};`,
  },

  // countSubarrays(nums: List[int], target: int) -> int  — prefix-sum hash count.
  'pghub-b20-subarray-target': {
    javascript: `var countSubarrays = function(nums, target) {
    const counts = new Map();
    counts.set(0, 1);
    let prefix = 0, result = 0;
    for (const x of nums) {
        prefix += x;
        result += counts.get(prefix - target) || 0;
        counts.set(prefix, (counts.get(prefix) || 0) + 1);
    }
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public int countSubarrays(int[] nums, int target) {
        Map<Long, Integer> counts = new HashMap<>();
        counts.put(0L, 1);
        long prefix = 0;
        int result = 0;
        for (int x : nums) {
            prefix += x;
            result += counts.getOrDefault(prefix - target, 0);
            counts.merge(prefix, 1, Integer::sum);
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int target) {
        unordered_map<long long, int> counts;
        counts[0] = 1;
        long long prefix = 0;
        int result = 0;
        for (int x : nums) {
            prefix += x;
            auto it = counts.find(prefix - target);
            if (it != counts.end()) result += it->second;
            counts[prefix]++;
        }
        return result;
    }
};`,
  },

  // countAfterToggle(x: int, lo: int, hi: int) -> int  — XOR mask popcount.
  'pghub-b20-tunnel-bits': {
    javascript: `var countAfterToggle = function(x, lo, hi) {
    let mask = 0;
    for (let b = lo; b <= hi; b++) {
        mask |= (1 << b);
    }
    let v = (x ^ mask) >>> 0;
    let count = 0;
    while (v) { count += v & 1; v >>>= 1; }
    return count;
};`,
    java: `class Solution {
    public int countAfterToggle(int x, int lo, int hi) {
        int mask = 0;
        for (int b = lo; b <= hi; b++) {
            mask |= (1 << b);
        }
        return Integer.bitCount(x ^ mask);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countAfterToggle(int x, int lo, int hi) {
        unsigned int mask = 0;
        for (int b = lo; b <= hi; b++) {
            mask |= (1u << b);
        }
        return __builtin_popcount((unsigned int)x ^ mask);
    }
};`,
  },

  // minCapacity(packages: List[int], days: int) -> int  — binary search on capacity.
  'pghub-b20-warehouse-bsearch': {
    javascript: `var minCapacity = function(packages, days) {
    const needed = (cap) => {
        let d = 1, cur = 0;
        for (const w of packages) {
            if (cur + w > cap) { d++; cur = 0; }
            cur += w;
        }
        return d;
    };
    let lo = Math.max(...packages);
    let hi = packages.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minCapacity(int[] packages, int days) {
        int lo = 0;
        long hi = 0;
        for (int w : packages) { lo = Math.max(lo, w); hi += w; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (needed(packages, mid) <= days) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private int needed(int[] packages, long cap) {
        int d = 1;
        long cur = 0;
        for (int w : packages) {
            if (cur + w > cap) { d++; cur = 0; }
            cur += w;
        }
        return d;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& packages, int days) {
        long long lo = 0, hi = 0;
        for (int w : packages) { lo = max(lo, (long long)w); hi += w; }
        auto needed = [&](long long cap) {
            int d = 1; long long cur = 0;
            for (int w : packages) {
                if (cur + w > cap) { d++; cur = 0; }
                cur += w;
            }
            return d;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // totalWait(arrivals: List[int], service: int) -> int  — single-server queue.
  'pghub-b21-canteen-queue': {
    javascript: `var totalWait = function(arrivals, service) {
    let freeAt = 0, total = 0;
    for (const a of arrivals) {
        const start = Math.max(a, freeAt);
        total += start - a;
        freeAt = start + service;
    }
    return total;
};`,
    java: `class Solution {
    public int totalWait(int[] arrivals, int service) {
        long freeAt = 0, total = 0;
        for (int a : arrivals) {
            long start = Math.max((long) a, freeAt);
            total += start - a;
            freeAt = start + service;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalWait(vector<int>& arrivals, int service) {
        long long freeAt = 0, total = 0;
        for (int a : arrivals) {
            long long start = max((long long) a, freeAt);
            total += start - a;
            freeAt = start + service;
        }
        return (int) total;
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int  — unbounded knapsack count.
  'pghub-b21-coin-combos': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const coin of coins) {
        for (let total = coin; total <= amount; total++) {
            dp[total] += dp[total - coin];
        }
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int coin : coins) {
            for (int total = coin; total <= amount; total++) {
                dp[total] += dp[total - coin];
            }
        }
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int coin : coins) {
            for (int total = coin; total <= amount; total++) {
                dp[total] += dp[total - coin];
            }
        }
        return (int) dp[amount];
    }
};`,
  },

  // minRefuels(target: int, start: int, stations: List[List[int]]) -> int
  // Greedy with max-heap of fuel amounts. Python heapq(neg) → JS max-heap.
  'pghub-b21-courier-fuel': {
    javascript: `var minRefuels = function(target, start, stations) {
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] >= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let b = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] > heap[b]) b = l;
            if (r < n && heap[r] > heap[b]) b = r;
            if (b === i) break;
            [heap[b], heap[i]] = [heap[i], heap[b]]; i = b;
        }
    };
    const push = (v) => { heap.push(v); up(heap.length - 1); };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    let fuel = start, stops = 0, i = 0;
    const n = stations.length;
    while (fuel < target) {
        while (i < n && stations[i][0] <= fuel) { push(stations[i][1]); i++; }
        if (heap.length === 0) return -1;
        fuel += pop();
        stops++;
    }
    return stops;
};`,
    java: `import java.util.*;
class Solution {
    public int minRefuels(int target, int start, int[][] stations) {
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        long fuel = start;
        int stops = 0, i = 0, n = stations.length;
        while (fuel < target) {
            while (i < n && stations[i][0] <= fuel) { pq.offer(stations[i][1]); i++; }
            if (pq.isEmpty()) return -1;
            fuel += pq.poll();
            stops++;
        }
        return stops;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRefuels(int target, int start, vector<vector<int>>& stations) {
        priority_queue<int> pq;
        long long fuel = start;
        int stops = 0, i = 0, n = (int)stations.size();
        while (fuel < target) {
            while (i < n && stations[i][0] <= fuel) { pq.push(stations[i][1]); i++; }
            if (pq.empty()) return -1;
            fuel += pq.top(); pq.pop();
            stops++;
        }
        return stops;
    }
};`,
  },

  // minGifts(ratings: List[int]) -> int  — two-pass candy.
  'pghub-b21-gift-distribution': {
    javascript: `var minGifts = function(ratings) {
    const n = ratings.length;
    const gifts = new Array(n).fill(1);
    for (let i = 1; i < n; i++) {
        if (ratings[i] > ratings[i - 1]) gifts[i] = gifts[i - 1] + 1;
    }
    for (let i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i + 1]) gifts[i] = Math.max(gifts[i], gifts[i + 1] + 1);
    }
    return gifts.reduce((a, b) => a + b, 0);
};`,
    java: `class Solution {
    public int minGifts(int[] ratings) {
        int n = ratings.length;
        int[] gifts = new int[n];
        java.util.Arrays.fill(gifts, 1);
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) gifts[i] = gifts[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1]) gifts[i] = Math.max(gifts[i], gifts[i + 1] + 1);
        }
        long sum = 0;
        for (int g : gifts) sum += g;
        return (int) sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minGifts(vector<int>& ratings) {
        int n = (int)ratings.size();
        vector<int> gifts(n, 1);
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) gifts[i] = gifts[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1]) gifts[i] = max(gifts[i], gifts[i + 1] + 1);
        }
        long long sum = 0;
        for (int g : gifts) sum += g;
        return (int) sum;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int
  'pghub-b21-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perimeter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                perimeter += 4;
                if (r > 0 && grid[r - 1][c] === 1) perimeter -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perimeter -= 2;
            }
        }
    }
    return perimeter;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
            }
        }
        return perimeter;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = (int)grid.size(), cols = (int)grid[0].size();
        int perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
            }
        }
        return perimeter;
    }
};`,
  },

  // typingCost(word: str) -> int  — keypad press counts.
  'pghub-b21-keypad-words': {
    javascript: `var typingCost = function(word) {
    const groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
    const cost = {};
    for (const g of groups) {
        for (let pos = 0; pos < g.length; pos++) {
            cost[g[pos]] = pos + 1;
        }
    }
    let total = 0;
    for (const ch of word) total += cost[ch];
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int typingCost(String word) {
        String[] groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        Map<Character, Integer> cost = new HashMap<>();
        for (String g : groups) {
            for (int pos = 0; pos < g.length(); pos++) {
                cost.put(g.charAt(pos), pos + 1);
            }
        }
        int total = 0;
        for (int i = 0; i < word.length(); i++) total += cost.get(word.charAt(i));
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int typingCost(string word) {
        vector<string> groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        unordered_map<char, int> cost;
        for (const string& g : groups) {
            for (int pos = 0; pos < (int)g.size(); pos++) {
                cost[g[pos]] = pos + 1;
            }
        }
        int total = 0;
        for (char ch : word) total += cost[ch];
        return total;
    }
};`,
  },

  // firstZeroDay(deltas: List[int]) -> int  — first prefix sum == 0.
  'pghub-b21-ledger-balance': {
    javascript: `var firstZeroDay = function(deltas) {
    let running = 0;
    for (let i = 0; i < deltas.length; i++) {
        running += deltas[i];
        if (running === 0) return i;
    }
    return -1;
};`,
    java: `class Solution {
    public int firstZeroDay(int[] deltas) {
        long running = 0;
        for (int i = 0; i < deltas.length; i++) {
            running += deltas[i];
            if (running == 0) return i;
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstZeroDay(vector<int>& deltas) {
        long long running = 0;
        for (int i = 0; i < (int)deltas.size(); i++) {
            running += deltas[i];
            if (running == 0) return i;
        }
        return -1;
    }
};`,
  },

  // peakIndex(heights: List[int]) -> int  — binary search on slope.
  'pghub-b21-mountain-peak': {
    javascript: `var peakIndex = function(heights) {
    let lo = 0, hi = heights.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (heights[mid] < heights[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int peakIndex(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (heights[mid] < heights[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int peakIndex(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (heights[mid] < heights[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // networkDelay(n: int, edges: List[List[int]], source: int) -> int  — Dijkstra.
  'pghub-b21-network-delay': {
    javascript: `var networkDelay = function(n, edges, source) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of edges) adj[u].push([v, w]);
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[source] = 0;
    // min-heap of [dist, node]
    const heap = [[0, source]];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const m = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < m && heap[l][0] < heap[s][0]) s = l;
            if (r < m && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    while (heap.length) {
        const [d, u] = pop();
        if (d > dist[u]) continue;
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; push([nd, v]); }
        }
    }
    let worst = -Infinity;
    for (const x of dist) if (x > worst) worst = x;
    return worst === INF ? -1 : worst;
};`,
    java: `import java.util.*;
class Solution {
    public int networkDelay(int n, int[][] edges, int source) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) adj[e[0]].add(new int[]{e[1], e[2]});
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[source] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.offer(new long[]{0, source});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0];
            int u = (int) cur[1];
            if (d > dist[u]) continue;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.offer(new long[]{nd, e[0]}); }
            }
        }
        long worst = Long.MIN_VALUE;
        for (long x : dist) worst = Math.max(worst, x);
        return worst == Long.MAX_VALUE ? -1 : (int) worst;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelay(int n, vector<vector<int>>& edges, int source) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& e : edges) adj[e[0]].push_back({e[1], e[2]});
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[source] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, source});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        long long worst = LLONG_MIN;
        for (long long x : dist) worst = max(worst, x);
        return worst == INF ? -1 : (int) worst;
    }
};`,
  },

  // longestTwoKinds(trees: List[int]) -> int  — sliding window ≤2 distinct.
  'pghub-b21-orchard-rows': {
    javascript: `var longestTwoKinds = function(trees) {
    const counts = new Map();
    let left = 0, best = 0;
    for (let right = 0; right < trees.length; right++) {
        const t = trees[right];
        counts.set(t, (counts.get(t) || 0) + 1);
        while (counts.size > 2) {
            const lt = trees[left];
            counts.set(lt, counts.get(lt) - 1);
            if (counts.get(lt) === 0) counts.delete(lt);
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestTwoKinds(int[] trees) {
        Map<Integer, Integer> counts = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < trees.length; right++) {
            int t = trees[right];
            counts.merge(t, 1, Integer::sum);
            while (counts.size() > 2) {
                int lt = trees[left];
                counts.merge(lt, -1, Integer::sum);
                if (counts.get(lt) == 0) counts.remove(lt);
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
    int longestTwoKinds(vector<int>& trees) {
        unordered_map<int, int> counts;
        int left = 0, best = 0;
        for (int right = 0; right < (int)trees.size(); right++) {
            int t = trees[right];
            counts[t]++;
            while ((int)counts.size() > 2) {
                int lt = trees[left];
                counts[lt]--;
                if (counts[lt] == 0) counts.erase(lt);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // evalPostfix(tokens: List[str]) -> int  — RPN evaluator.
  'pghub-b21-stack-machine': {
    javascript: `var evalPostfix = function(tokens) {
    const stack = [];
    const ops = new Set(['+', '-', '*']);
    for (const tok of tokens) {
        if (ops.has(tok)) {
            const b = stack.pop();
            const a = stack.pop();
            if (tok === '+') stack.push(a + b);
            else if (tok === '-') stack.push(a - b);
            else stack.push(a * b);
        } else {
            stack.push(parseInt(tok, 10));
        }
    }
    return stack[stack.length - 1];
};`,
    java: `import java.util.*;
class Solution {
    public int evalPostfix(String[] tokens) {
        Deque<Long> stack = new ArrayDeque<>();
        for (String tok : tokens) {
            if (tok.equals("+") || tok.equals("-") || tok.equals("*")) {
                long b = stack.pop();
                long a = stack.pop();
                if (tok.equals("+")) stack.push(a + b);
                else if (tok.equals("-")) stack.push(a - b);
                else stack.push(a * b);
            } else {
                stack.push(Long.parseLong(tok));
            }
        }
        return (int) (long) stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalPostfix(vector<string>& tokens) {
        vector<long long> stack;
        for (const string& tok : tokens) {
            if (tok == "+" || tok == "-" || tok == "*") {
                long long b = stack.back(); stack.pop_back();
                long long a = stack.back(); stack.pop_back();
                if (tok == "+") stack.push_back(a + b);
                else if (tok == "-") stack.push_back(a - b);
                else stack.push_back(a * b);
            } else {
                stack.push_back(stoll(tok));
            }
        }
        return (int) stack.back();
    }
};`,
  },
};
