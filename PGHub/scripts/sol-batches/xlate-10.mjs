// xlate-10.mjs — translations of verified Python solutions to JS/Java/C++.
// Slice [270,300) of pyReal targets (sorted by id). Only missing langs emitted.
// Signatures match generateTemplate() exactly. Algorithms preserved faithfully.

export default {
  // countPairs(nums: List[int], target: int) -> int — sort + two pointers, count pairs with sum < target.
  'pghub-b27-pairs-below-target': {
    javascript: `var countPairs = function(nums, target) {
    const arr = nums.slice().sort((a, b) => a - b);
    let lo = 0, hi = arr.length - 1, count = 0;
    while (lo < hi) {
        if (arr[lo] + arr[hi] < target) {
            count += hi - lo;
            lo++;
        } else {
            hi--;
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPairs(int[] nums, int target) {
        int[] arr = nums.clone();
        Arrays.sort(arr);
        int lo = 0, hi = arr.length - 1, count = 0;
        while (lo < hi) {
            if (arr[lo] + arr[hi] < target) {
                count += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& nums, int target) {
        vector<int> arr = nums;
        sort(arr.begin(), arr.end());
        int lo = 0, hi = (int)arr.size() - 1, count = 0;
        while (lo < hi) {
            if (arr[lo] + arr[hi] < target) {
                count += hi - lo;
                lo++;
            } else {
                hi--;
            }
        }
        return count;
    }
};`,
  },

  // totalSetBits(n: int) -> int — count set bits across 0..n by bit position (non-negative // and %).
  'pghub-b27-popcount-range': {
    javascript: `var totalSetBits = function(n) {
    let total = 0;
    let bit = 1;
    while (bit <= n) {
        const cycle = bit * 2;
        const full = Math.floor((n + 1) / cycle);
        total += full * bit;
        const rem = (n + 1) % cycle;
        total += Math.max(0, rem - bit);
        bit *= 2;
    }
    return total;
};`,
    java: `class Solution {
    public int totalSetBits(int n) {
        long total = 0;
        long bit = 1;
        while (bit <= n) {
            long cycle = bit << 1;
            long full = (n + 1) / cycle;
            total += full * bit;
            long rem = (n + 1) % cycle;
            total += Math.max(0L, rem - bit);
            bit <<= 1;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalSetBits(int n) {
        long long total = 0;
        long long bit = 1;
        while (bit <= n) {
            long long cycle = bit << 1;
            long long full = (n + 1) / cycle;
            total += full * bit;
            long long rem = (n + 1) % cycle;
            total += max(0LL, rem - bit);
            bit <<= 1;
        }
        return (int) total;
    }
};`,
  },

  // countRecent(pings: List[int], window: int) -> List[int] — sliding window over a queue.
  'pghub-b27-recent-hits': {
    javascript: `var countRecent = function(pings, window) {
    const q = [];
    let head = 0;
    const res = [];
    for (const t of pings) {
        q.push(t);
        const cutoff = t - window;
        while (q[head] < cutoff) head++;
        res.push(q.length - head);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] countRecent(int[] pings, int window) {
        Deque<Integer> q = new ArrayDeque<>();
        int[] res = new int[pings.length];
        for (int idx = 0; idx < pings.length; idx++) {
            int t = pings[idx];
            q.addLast(t);
            int cutoff = t - window;
            while (q.peekFirst() < cutoff) q.pollFirst();
            res[idx] = q.size();
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> countRecent(vector<int>& pings, int window) {
        deque<int> q;
        vector<int> res;
        for (int t : pings) {
            q.push_back(t);
            int cutoff = t - window;
            while (q.front() < cutoff) q.pop_front();
            res.push_back((int)q.size());
        }
        return res;
    }
};`,
  },

  // compress(s: str) -> str — run-length encode each maximal run as char + count.
  'pghub-b27-run-length': {
    javascript: `var compress = function(s) {
    let out = '';
    let i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        out += s[i] + String(j - i);
        i = j;
    }
    return out;
};`,
    java: `class Solution {
    public String compress(String s) {
        StringBuilder out = new StringBuilder();
        int i = 0, n = s.length();
        while (i < n) {
            int j = i;
            while (j < n && s.charAt(j) == s.charAt(i)) j++;
            out.append(s.charAt(i)).append(j - i);
            i = j;
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string compress(string s) {
        string out;
        int i = 0, n = (int)s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            out += s[i];
            out += to_string(j - i);
            i = j;
        }
        return out;
    }
};`,
  },

  // maxDepth(s: str) -> int — max nesting of parentheses.
  'pghub-b28-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else if (ch === ')') {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // countClusters(n: int, pairs: List[List[int]]) -> int — union-find connected components.
  'pghub-b28-cluster-merge': {
    javascript: `var countClusters = function(n, pairs) {
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    let comps = n;
    for (const [a, b] of pairs) {
        const ra = find(a), rb = find(b);
        if (ra !== rb) { parent[ra] = rb; comps--; }
    }
    return comps;
};`,
    java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    public int countClusters(int n, int[][] pairs) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int comps = n;
        for (int[] p : pairs) {
            int ra = find(p[0]), rb = find(p[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    int countClusters(int n, vector<vector<int>>& pairs) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        int comps = n;
        for (auto& p : pairs) {
            int ra = find(p[0]), rb = find(p[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps;
    }
};`,
  },

  // changeWays(coins: List[int], amount: int) -> int — unbounded coin-change combination count.
  'pghub-b28-coin-combos': {
    javascript: `var changeWays = function(coins, amount) {
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
    public int changeWays(int[] coins, int amount) {
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
    int changeWays(vector<int>& coins, int amount) {
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

  // mergeWindows(windows: List[List[int]]) -> List[List[int]] — sort + sweep merge intervals.
  'pghub-b28-courier-merge': {
    javascript: `var mergeWindows = function(windows) {
    const sorted = windows.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    for (const [s, e] of sorted) {
        if (merged.length && s <= merged[merged.length - 1][1]) {
            if (e > merged[merged.length - 1][1]) merged[merged.length - 1][1] = e;
        } else {
            merged.push([s, e]);
        }
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeWindows(int[][] windows) {
        int[][] sorted = windows.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        List<int[]> merged = new ArrayList<>();
        for (int[] w : sorted) {
            if (!merged.isEmpty() && w[0] <= merged.get(merged.size() - 1)[1]) {
                if (w[1] > merged.get(merged.size() - 1)[1]) merged.get(merged.size() - 1)[1] = w[1];
            } else {
                merged.add(new int[]{w[0], w[1]});
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeWindows(vector<vector<int>>& windows) {
        vector<vector<int>> sorted = windows;
        sort(sorted.begin(), sorted.end());
        vector<vector<int>> merged;
        for (auto& w : sorted) {
            if (!merged.empty() && w[0] <= merged.back()[1]) {
                if (w[1] > merged.back()[1]) merged.back()[1] = w[1];
            } else {
                merged.push_back({w[0], w[1]});
            }
        }
        return merged;
    }
};`,
  },

  // countPaths(grid: List[List[int]]) -> int — unique paths with obstacles, rolling DP mod 1e9+7.
  'pghub-b28-grid-paths-obstacles': {
    javascript: `var countPaths = function(grid) {
    const MOD = 1000000007;
    const rows = grid.length, cols = grid[0].length;
    if (grid[0][0] === 1 || grid[rows - 1][cols - 1] === 1) return 0;
    const dp = new Array(cols).fill(0);
    dp[0] = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                dp[c] = 0;
            } else if (c > 0) {
                dp[c] = (dp[c] + dp[c - 1]) % MOD;
            }
        }
    }
    return dp[cols - 1] % MOD;
};`,
    java: `class Solution {
    public int countPaths(int[][] grid) {
        final int MOD = 1000000007;
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return 0;
        long[] dp = new long[cols];
        dp[0] = 1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    dp[c] = 0;
                } else if (c > 0) {
                    dp[c] = (dp[c] + dp[c - 1]) % MOD;
                }
            }
        }
        return (int) (dp[cols - 1] % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPaths(vector<vector<int>>& grid) {
        const long long MOD = 1000000007;
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return 0;
        vector<long long> dp(cols, 0);
        dp[0] = 1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    dp[c] = 0;
                } else if (c > 0) {
                    dp[c] = (dp[c] + dp[c - 1]) % MOD;
                }
            }
        }
        return (int)(dp[cols - 1] % MOD);
    }
};`,
  },

  // maxProfit(jobs: List[List[int]]) -> int — sort by deadline, min-heap keep at most `deadline` jobs.
  'pghub-b28-job-deadlines': {
    javascript: `var maxProfit = function(jobs) {
    const sorted = jobs.slice().sort((a, b) => a[0] - b[0]);
    // min-heap of accepted profits
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
    const push = (v) => { heap.push(v); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    for (const [deadline, profit] of sorted) {
        push(profit);
        if (heap.length > deadline) pop();
    }
    let sum = 0;
    for (const v of heap) sum += v;
    return sum;
};`,
    java: `import java.util.*;
class Solution {
    public int maxProfit(int[][] jobs) {
        int[][] sorted = jobs.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] job : sorted) {
            int deadline = job[0], profit = job[1];
            heap.offer(profit);
            if (heap.size() > deadline) heap.poll();
        }
        long sum = 0;
        for (int v : heap) sum += v;
        return (int) sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<vector<int>>& jobs) {
        vector<vector<int>> sorted = jobs;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& job : sorted) {
            int deadline = job[0], profit = job[1];
            heap.push(profit);
            if ((int)heap.size() > deadline) heap.pop();
        }
        long long sum = 0;
        while (!heap.empty()) { sum += heap.top(); heap.pop(); }
        return (int) sum;
    }
};`,
  },

  // kthLargestStream(k: int, prices: List[int]) -> List[int] — running k-th largest via min-heap of size k.
  'pghub-b28-kth-largest-stream': {
    javascript: `var kthLargestStream = function(k, prices) {
    // min-heap of the k largest seen so far
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
    const push = (v) => { heap.push(v); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    const res = [];
    for (const p of prices) {
        push(p);
        if (heap.length > k) pop();
        if (heap.length < k) {
            let mn = Infinity;
            for (const v of heap) if (v < mn) mn = v;
            res.push(mn);
        } else {
            res.push(heap[0]);
        }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] kthLargestStream(int k, int[] prices) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int[] res = new int[prices.length];
        for (int idx = 0; idx < prices.length; idx++) {
            heap.offer(prices[idx]);
            if (heap.size() > k) heap.poll();
            if (heap.size() < k) {
                int mn = Integer.MAX_VALUE;
                for (int v : heap) mn = Math.min(mn, v);
                res[idx] = mn;
            } else {
                res[idx] = heap.peek();
            }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargestStream(int k, vector<int>& prices) {
        priority_queue<int, vector<int>, greater<int>> heap;
        vector<int> res;
        for (int p : prices) {
            heap.push(p);
            if ((int)heap.size() > k) heap.pop();
            if ((int)heap.size() < k) {
                // min element of heap is its top
                res.push_back(heap.top());
            } else {
                res.push_back(heap.top());
            }
        }
        return res;
    }
};`,
  },

  // countTeams(speeds: List[int], target: int) -> int — sort + two pointers, count disjoint pairs summing to target.
  'pghub-b28-relay-teams': {
    javascript: `var countTeams = function(speeds, target) {
    const arr = speeds.slice().sort((a, b) => a - b);
    let i = 0, j = arr.length - 1, teams = 0;
    while (i < j) {
        const cur = arr[i] + arr[j];
        if (cur === target) {
            teams++;
            i++;
            j--;
        } else if (cur < target) {
            i++;
        } else {
            j--;
        }
    }
    return teams;
};`,
    java: `import java.util.*;
class Solution {
    public int countTeams(int[] speeds, int target) {
        int[] arr = speeds.clone();
        Arrays.sort(arr);
        int i = 0, j = arr.length - 1, teams = 0;
        while (i < j) {
            int cur = arr[i] + arr[j];
            if (cur == target) {
                teams++;
                i++;
                j--;
            } else if (cur < target) {
                i++;
            } else {
                j--;
            }
        }
        return teams;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countTeams(vector<int>& speeds, int target) {
        vector<int> arr = speeds;
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1, teams = 0;
        while (i < j) {
            int cur = arr[i] + arr[j];
            if (cur == target) {
                teams++;
                i++;
                j--;
            } else if (cur < target) {
                i++;
            } else {
                j--;
            }
        }
        return teams;
    }
};`,
  },

  // minutesToSpoil(grid: List[List[int]]) -> int — multi-source BFS rot spread; -1 if fresh remains.
  'pghub-b28-rotting-fruit': {
    javascript: `var minutesToSpoil = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const q = [];
    let head = 0, fresh = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 2) q.push([r, c, 0]);
            else if (grid[r][c] === 1) fresh++;
        }
    }
    let minutes = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (head < q.length) {
        const [r, c, t] = q[head++];
        if (t > minutes) minutes = t;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
                grid[nr][nc] = 2;
                fresh--;
                q.push([nr, nc, t + 1]);
            }
        }
    }
    return fresh === 0 ? minutes : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minutesToSpoil(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        Deque<int[]> q = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.addLast(new int[]{r, c, 0});
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int minutes = 0;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.isEmpty()) {
            int[] cur = q.pollFirst();
            int r = cur[0], c = cur[1], t = cur[2];
            minutes = Math.max(minutes, t);
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    q.addLast(new int[]{nr, nc, t + 1});
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minutesToSpoil(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        deque<array<int,3>> q;
        int fresh = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.push_back({r, c, 0});
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int minutes = 0;
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.empty()) {
            auto cur = q.front(); q.pop_front();
            int r = cur[0], c = cur[1], t = cur[2];
            minutes = max(minutes, t);
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    q.push_back({nr, nc, t + 1});
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }
};`,
  },

  // decode(s: str) -> str — run-length decode "<count><char>" repeating each char count times.
  'pghub-b28-signal-decode': {
    javascript: `var decode = function(s) {
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
    public String decode(String s) {
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
    string decode(string s) {
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

  // minSlots(tasks: List[str], cooldown: int) -> int — task scheduler frame formula.
  'pghub-b28-task-scheduler': {
    javascript: `var minSlots = function(tasks, cooldown) {
    const counts = new Map();
    for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
    let maxFreq = 0;
    for (const v of counts.values()) if (v > maxFreq) maxFreq = v;
    let numMax = 0;
    for (const v of counts.values()) if (v === maxFreq) numMax++;
    const frame = (maxFreq - 1) * (cooldown + 1) + numMax;
    return Math.max(frame, tasks.length);
};`,
    java: `import java.util.*;
class Solution {
    public int minSlots(String[] tasks, int cooldown) {
        Map<String, Integer> counts = new HashMap<>();
        for (String t : tasks) counts.merge(t, 1, Integer::sum);
        int maxFreq = 0;
        for (int v : counts.values()) maxFreq = Math.max(maxFreq, v);
        int numMax = 0;
        for (int v : counts.values()) if (v == maxFreq) numMax++;
        int frame = (maxFreq - 1) * (cooldown + 1) + numMax;
        return Math.max(frame, tasks.length);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSlots(vector<string>& tasks, int cooldown) {
        unordered_map<string, int> counts;
        for (auto& t : tasks) counts[t]++;
        int maxFreq = 0;
        for (auto& kv : counts) maxFreq = max(maxFreq, kv.second);
        int numMax = 0;
        for (auto& kv : counts) if (kv.second == maxFreq) numMax++;
        int frame = (maxFreq - 1) * (cooldown + 1) + numMax;
        return max(frame, (int)tasks.size());
    }
};`,
  },

  // taxOwed(brackets: List[List[int]], income: int) -> int — progressive tax, truncate to int.
  'pghub-b28-tax-brackets': {
    javascript: `var taxOwed = function(brackets, income) {
    let total = 0.0;
    let prev = 0;
    for (const [upper, percent] of brackets) {
        if (income <= prev) break;
        const taxable = Math.min(income, upper) - prev;
        if (taxable > 0) total += taxable * percent / 100.0;
        prev = upper;
    }
    return Math.trunc(total);
};`,
    java: `class Solution {
    public int taxOwed(int[][] brackets, int income) {
        double total = 0.0;
        int prev = 0;
        for (int[] b : brackets) {
            int upper = b[0], percent = b[1];
            if (income <= prev) break;
            int taxable = Math.min(income, upper) - prev;
            if (taxable > 0) total += taxable * percent / 100.0;
            prev = upper;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int taxOwed(vector<vector<int>>& brackets, int income) {
        double total = 0.0;
        int prev = 0;
        for (auto& b : brackets) {
            int upper = b[0], percent = b[1];
            if (income <= prev) break;
            int taxable = min(income, upper) - prev;
            if (taxable > 0) total += taxable * percent / 100.0;
            prev = upper;
        }
        return (int) total;
    }
};`,
  },

  // litAtEnd(n: int) -> int — number of perfect squares <= n is isqrt(n).
  'pghub-b28-toggle-lights': {
    javascript: `var litAtEnd = function(n) {
    if (n < 0) return 0;
    let r = Math.floor(Math.sqrt(n));
    while ((r + 1) * (r + 1) <= n) r++;
    while (r * r > n) r--;
    return r;
};`,
    java: `class Solution {
    public int litAtEnd(int n) {
        if (n < 0) return 0;
        int r = (int) Math.sqrt((double) n);
        while ((long)(r + 1) * (r + 1) <= n) r++;
        while ((long) r * r > n) r--;
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int litAtEnd(int n) {
        if (n < 0) return 0;
        int r = (int) sqrt((double) n);
        while ((long long)(r + 1) * (r + 1) <= n) r++;
        while ((long long) r * r > n) r--;
        return r;
    }
};`,
  },

  // shortestPrefixes(words: List[str]) -> List[str] — shortest unique-count prefix per word via trie counts.
  'pghub-b28-trie-prefix': {
    javascript: `var shortestPrefixes = function(words) {
    const root = {};
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            if (!(ch in node)) node[ch] = { _c: 0 };
            node = node[ch];
            node._c += 1;
        }
    }
    const res = [];
    for (const w of words) {
        let node = root;
        let prefixLen = w.length;
        for (let i = 0; i < w.length; i++) {
            node = node[w[i]];
            if (node._c === 1) {
                prefixLen = i + 1;
                break;
            }
        }
        res.push(w.slice(0, prefixLen));
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    static class Node {
        Map<Character, Node> next = new HashMap<>();
        int c = 0;
    }
    public String[] shortestPrefixes(String[] words) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (int i = 0; i < w.length(); i++) {
                char ch = w.charAt(i);
                node = node.next.computeIfAbsent(ch, k -> new Node());
                node.c += 1;
            }
        }
        String[] res = new String[words.length];
        for (int idx = 0; idx < words.length; idx++) {
            String w = words[idx];
            Node node = root;
            int prefixLen = w.length();
            for (int i = 0; i < w.length(); i++) {
                node = node.next.get(w.charAt(i));
                if (node.c == 1) {
                    prefixLen = i + 1;
                    break;
                }
            }
            res[idx] = w.substring(0, prefixLen);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

struct Node {
    unordered_map<char, Node*> next;
    int c = 0;
};

class Solution {
public:
    vector<string> shortestPrefixes(vector<string>& words) {
        Node* root = new Node();
        for (auto& w : words) {
            Node* node = root;
            for (char ch : w) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
                node->c += 1;
            }
        }
        vector<string> res;
        for (auto& w : words) {
            Node* node = root;
            int prefixLen = (int)w.size();
            for (int i = 0; i < (int)w.size(); i++) {
                node = node->next[w[i]];
                if (node->c == 1) {
                    prefixLen = i + 1;
                    break;
                }
            }
            res.push_back(w.substr(0, prefixLen));
        }
        return res;
    }
};`,
  },

  // fullestShelf(shelves: List[List[int]]) -> int — index of first shelf with max sum.
  'pghub-b28-warehouse-rows': {
    javascript: `var fullestShelf = function(shelves) {
    let bestIdx = 0, bestSum = -1;
    for (let i = 0; i < shelves.length; i++) {
        let s = 0;
        for (const x of shelves[i]) s += x;
        if (s > bestSum) { bestSum = s; bestIdx = i; }
    }
    return bestIdx;
};`,
    java: `class Solution {
    public int fullestShelf(int[][] shelves) {
        int bestIdx = 0, bestSum = -1;
        for (int i = 0; i < shelves.length; i++) {
            int s = 0;
            for (int x : shelves[i]) s += x;
            if (s > bestSum) { bestSum = s; bestIdx = i; }
        }
        return bestIdx;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int fullestShelf(vector<vector<int>>& shelves) {
        int bestIdx = 0, bestSum = -1;
        for (int i = 0; i < (int)shelves.size(); i++) {
            int s = 0;
            for (int x : shelves[i]) s += x;
            if (s > bestSum) { bestSum = s; bestIdx = i; }
        }
        return bestIdx;
    }
};`,
  },

  // countGroups(words: List[str]) -> int — count distinct anagram signatures.
  'pghub-b29-anagram-groups': {
    javascript: `var countGroups = function(words) {
    const seen = new Set();
    for (const w of words) {
        seen.add(w.split('').sort().join(''));
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int countGroups(String[] words) {
        Set<String> seen = new HashSet<>();
        for (String w : words) {
            char[] a = w.toCharArray();
            Arrays.sort(a);
            seen.add(new String(a));
        }
        return seen.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countGroups(vector<string>& words) {
        unordered_set<string> seen;
        for (auto w : words) {
            sort(w.begin(), w.end());
            seen.insert(w);
        }
        return (int)seen.size();
    }
};`,
  },

  // litLeds(n: int) -> int — popcount of n.
  'pghub-b29-binary-clock': {
    javascript: `var litLeds = function(n) {
    let count = 0;
    while (n) {
        n &= n - 1;
        count++;
    }
    return count;
};`,
    java: `class Solution {
    public int litLeds(int n) {
        int count = 0;
        while (n != 0) {
            n &= n - 1;
            count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int litLeds(int n) {
        int count = 0;
        while (n) {
            n &= n - 1;
            count++;
        }
        return count;
    }
};`,
  },

  // maxNesting(s: str) -> int — max depth of parentheses (else branch decrements).
  'pghub-b29-bracket-depth': {
    javascript: `var maxNesting = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxNesting(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
                depth--;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxNesting(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // startStation(gas: List[int], cost: List[int]) -> int — gas station greedy.
  'pghub-b29-circular-tour': {
    javascript: `var startStation = function(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {
            start = i + 1;
            tank = 0;
        }
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
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
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
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }
};`,
  },

  // maxCouponValue(values: List[int]) -> int — house-robber max non-adjacent sum (floored at 0).
  'pghub-b29-coupon-stacking': {
    javascript: `var maxCouponValue = function(values) {
    let take = 0, skip = 0;
    for (const v of values) {
        const newTake = skip + v;
        const newSkip = Math.max(skip, take);
        take = newTake;
        skip = newSkip;
    }
    return Math.max(take, skip);
};`,
    java: `class Solution {
    public int maxCouponValue(int[] values) {
        int take = 0, skip = 0;
        for (int v : values) {
            int newTake = skip + v;
            int newSkip = Math.max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return Math.max(take, skip);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCouponValue(vector<int>& values) {
        int take = 0, skip = 0;
        for (int v : values) {
            int newTake = skip + v;
            int newSkip = max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return max(take, skip);
    }
};`,
  },

  // topToken(tokens: List[int]) -> int — most frequent token, smallest value on ties.
  'pghub-b29-frequency-rank': {
    javascript: `var topToken = function(tokens) {
    const freq = new Map();
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
    let bestTok = null, bestCnt = -1;
    for (const [tok, cnt] of freq) {
        if (cnt > bestCnt || (cnt === bestCnt && tok < bestTok)) {
            bestTok = tok;
            bestCnt = cnt;
        }
    }
    return bestTok;
};`,
    java: `import java.util.*;
class Solution {
    public int topToken(int[] tokens) {
        Map<Integer, Integer> freq = new LinkedHashMap<>();
        for (int t : tokens) freq.merge(t, 1, Integer::sum);
        Integer bestTok = null;
        int bestCnt = -1;
        for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
            int tok = e.getKey(), cnt = e.getValue();
            if (cnt > bestCnt || (cnt == bestCnt && tok < bestTok)) {
                bestTok = tok;
                bestCnt = cnt;
            }
        }
        return bestTok;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int topToken(vector<int>& tokens) {
        map<int, int> freq;
        for (int t : tokens) freq[t]++;
        int bestTok = 0, bestCnt = -1;
        bool first = true;
        for (auto& kv : freq) {
            int tok = kv.first, cnt = kv.second;
            if (first || cnt > bestCnt || (cnt == bestCnt && tok < bestTok)) {
                bestTok = tok;
                bestCnt = cnt;
                first = false;
            }
        }
        return bestTok;
    }
};`,
  },

  // minRooms(meetings: List[List[int]]) -> int — sweep line over sorted starts/ends.
  'pghub-b29-meeting-rooms': {
    javascript: `var minRooms = function(meetings) {
    if (!meetings.length) return 0;
    const starts = meetings.map(m => m[0]).sort((a, b) => a - b);
    const ends = meetings.map(m => m[1]).sort((a, b) => a - b);
    let rooms = 0, best = 0, i = 0, j = 0;
    const n = meetings.length;
    while (i < n) {
        if (starts[i] < ends[j]) {
            rooms++;
            if (rooms > best) best = rooms;
            i++;
        } else {
            rooms--;
            j++;
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minRooms(int[][] meetings) {
        if (meetings.length == 0) return 0;
        int n = meetings.length;
        int[] starts = new int[n], ends = new int[n];
        for (int k = 0; k < n; k++) { starts[k] = meetings[k][0]; ends[k] = meetings[k][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, best = 0, i = 0, j = 0;
        while (i < n) {
            if (starts[i] < ends[j]) {
                rooms++;
                if (rooms > best) best = rooms;
                i++;
            } else {
                rooms--;
                j++;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRooms(vector<vector<int>>& meetings) {
        if (meetings.empty()) return 0;
        int n = meetings.size();
        vector<int> starts(n), ends(n);
        for (int k = 0; k < n; k++) { starts[k] = meetings[k][0]; ends[k] = meetings[k][1]; }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0, best = 0, i = 0, j = 0;
        while (i < n) {
            if (starts[i] < ends[j]) {
                rooms++;
                if (rooms > best) best = rooms;
                i++;
            } else {
                rooms--;
                j++;
            }
        }
        return best;
    }
};`,
  },

  // nextPrime(x: int) -> int — smallest prime strictly greater than x.
  'pghub-b29-prime-gap': {
    javascript: `var nextPrime = function(x) {
    const isPrime = (m) => {
        if (m < 2) return false;
        if (m % 2 === 0) return m === 2;
        let i = 3;
        while (i * i <= m) {
            if (m % i === 0) return false;
            i += 2;
        }
        return true;
    };
    let cand = x + 1;
    while (!isPrime(cand)) cand++;
    return cand;
};`,
    java: `class Solution {
    private boolean isPrime(int m) {
        if (m < 2) return false;
        if (m % 2 == 0) return m == 2;
        int i = 3;
        while ((long) i * i <= m) {
            if (m % i == 0) return false;
            i += 2;
        }
        return true;
    }
    public int nextPrime(int x) {
        int cand = x + 1;
        while (!isPrime(cand)) cand++;
        return cand;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPrime(int m) {
        if (m < 2) return false;
        if (m % 2 == 0) return m == 2;
        int i = 3;
        while ((long long) i * i <= m) {
            if (m % i == 0) return false;
            i += 2;
        }
        return true;
    }
    int nextPrime(int x) {
        int cand = x + 1;
        while (!isPrime(cand)) cand++;
        return cand;
    }
};`,
  },

  // longestRelay(n: int, handoffs: List[List[int]]) -> int — longest path in DAG via topo + DP.
  'pghub-b29-relay-baton': {
    javascript: `var longestRelay = function(n, handoffs) {
    const adj = Array.from({length: n}, () => []);
    const indeg = new Array(n).fill(0);
    for (const [u, v] of handoffs) {
        adj[u].push(v);
        indeg[v]++;
    }
    const q = [];
    let head = 0;
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    const dist = new Array(n).fill(0);
    while (head < q.length) {
        const u = q[head++];
        for (const v of adj[u]) {
            if (dist[u] + 1 > dist[v]) dist[v] = dist[u] + 1;
            indeg[v]--;
            if (indeg[v] === 0) q.push(v);
        }
    }
    if (n === 0) return 0;
    let best = 0;
    for (const d of dist) if (d > best) best = d;
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestRelay(int n, int[][] handoffs) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] h : handoffs) {
            adj.get(h[0]).add(h[1]);
            indeg[h[1]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.addLast(i);
        int[] dist = new int[n];
        while (!q.isEmpty()) {
            int u = q.pollFirst();
            for (int v : adj.get(u)) {
                if (dist[u] + 1 > dist[v]) dist[v] = dist[u] + 1;
                if (--indeg[v] == 0) q.addLast(v);
            }
        }
        if (n == 0) return 0;
        int best = 0;
        for (int d : dist) best = Math.max(best, d);
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRelay(int n, vector<vector<int>>& handoffs) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& h : handoffs) {
            adj[h[0]].push_back(h[1]);
            indeg[h[1]]++;
        }
        deque<int> q;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push_back(i);
        vector<int> dist(n, 0);
        while (!q.empty()) {
            int u = q.front(); q.pop_front();
            for (int v : adj[u]) {
                if (dist[u] + 1 > dist[v]) dist[v] = dist[u] + 1;
                if (--indeg[v] == 0) q.push_back(v);
            }
        }
        if (n == 0) return 0;
        int best = 0;
        for (int d : dist) best = max(best, d);
        return best;
    }
};`,
  },

  // minCapacity(weights: List[int], days: int) -> int — binary search on capacity.
  'pghub-b29-shipping-capacity': {
    javascript: `var minCapacity = function(weights, days) {
    const needed = (cap) => {
        let d = 1, cur = 0;
        for (const w of weights) {
            if (cur + w > cap) {
                d++;
                cur = 0;
            }
            cur += w;
        }
        return d;
    };
    let lo = Math.max(...weights);
    let hi = weights.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    private int needed(int[] weights, int cap) {
        int d = 1, cur = 0;
        for (int w : weights) {
            if (cur + w > cap) {
                d++;
                cur = 0;
            }
            cur += w;
        }
        return d;
    }
    public int minCapacity(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (needed(weights, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int needed(vector<int>& weights, int cap) {
        int d = 1, cur = 0;
        for (int w : weights) {
            if (cur + w > cap) {
                d++;
                cur = 0;
            }
            cur += w;
        }
        return d;
    }
    int minCapacity(vector<int>& weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (needed(weights, mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // countSubsets(nums: List[int], limit: int) -> int — count non-empty subsets with product <= limit.
  'pghub-b29-subset-product': {
    javascript: `var countSubsets = function(nums, limit) {
    const n = nums.length;
    let count = 0;
    const cap = limit + 1; // clamp to avoid runaway products; > limit is enough info
    const bt = (i, prod, used) => {
        if (i === n) {
            if (used > 0 && prod <= limit) count++;
            return;
        }
        bt(i + 1, prod, used);
        bt(i + 1, Math.min(cap, prod * nums[i]), used + 1);
    };
    bt(0, 1, 0);
    return count;
};`,
    java: `class Solution {
    private int n;
    private int count;
    private int limit;
    private int[] nums;
    private void bt(int i, long prod, int used) {
        if (i == n) {
            if (used > 0 && prod <= limit) count++;
            return;
        }
        bt(i + 1, prod, used);
        bt(i + 1, Math.min((long) limit + 1, prod * nums[i]), used + 1);
    }
    public int countSubsets(int[] nums, int limit) {
        this.n = nums.length;
        this.count = 0;
        this.limit = limit;
        this.nums = nums;
        bt(0, 1L, 0);
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int n, count, limit;
    vector<int>* nums;
    void bt(int i, long long prod, int used) {
        if (i == n) {
            if (used > 0 && prod <= limit) count++;
            return;
        }
        bt(i + 1, prod, used);
        bt(i + 1, min((long long) limit + 1, prod * (*nums)[i]), used + 1);
    }
    int countSubsets(vector<int>& nums, int limit) {
        this->n = nums.size();
        this->count = 0;
        this->limit = limit;
        this->nums = &nums;
        bt(0, 1LL, 0);
        return count;
    }
};`,
  },
};
