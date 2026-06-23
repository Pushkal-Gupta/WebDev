// xlate-9.mjs — translations of verified Python solutions to JS/Java/C++.
// Slice [240,270) of pyReal && missingLangs filtered targets, sorted by id.
// Each value carries ONLY the missing languages (all three here). Signatures
// match generateTemplate(language, method_name, params, return_type) exactly.

export default {
  // minFixes(s: str) -> int  — min flips for balanced brackets.
  'pghub-b25-token-bracket': {
    javascript: `var minFixes = function(s) {
    let openNeed = 0, flips = 0;
    for (const ch of s) {
        if (ch === '(') {
            openNeed++;
        } else {
            if (openNeed > 0) openNeed--;
            else { flips++; openNeed++; }
        }
    }
    flips += Math.floor(openNeed / 2);
    return flips;
};`,
    java: `class Solution {
    public int minFixes(String s) {
        int openNeed = 0, flips = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                openNeed++;
            } else {
                if (openNeed > 0) openNeed--;
                else { flips++; openNeed++; }
            }
        }
        flips += openNeed / 2;
        return flips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFixes(string s) {
        int openNeed = 0, flips = 0;
        for (char ch : s) {
            if (ch == '(') {
                openNeed++;
            } else {
                if (openNeed > 0) openNeed--;
                else { flips++; openNeed++; }
            }
        }
        flips += openNeed / 2;
        return flips;
    }
};`,
  },

  // minRaise(heights: List[int]) -> int  — greedy running-max deficits.
  'pghub-b25-trail-altitude': {
    javascript: `var minRaise = function(heights) {
    let total = 0;
    let prev = heights[0];
    for (let i = 1; i < heights.length; i++) {
        const h = heights[i];
        if (h < prev) total += prev - h;
        else prev = h;
    }
    return total;
};`,
    java: `class Solution {
    public int minRaise(int[] heights) {
        long total = 0;
        int prev = heights[0];
        for (int i = 1; i < heights.length; i++) {
            int h = heights[i];
            if (h < prev) total += prev - h;
            else prev = h;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRaise(vector<int>& heights) {
        long long total = 0;
        int prev = heights[0];
        for (size_t i = 1; i < heights.size(); i++) {
            int h = heights[i];
            if (h < prev) total += prev - h;
            else prev = h;
        }
        return (int) total;
    }
};`,
  },

  // digitRoot(n: int) -> int  — collapse to product of digits.
  'pghub-b25-vault-digits': {
    javascript: `var digitRoot = function(n) {
    while (n >= 10) {
        let prod = 1;
        while (n > 0) {
            prod *= n % 10;
            n = Math.floor(n / 10);
        }
        n = prod;
    }
    return n;
};`,
    java: `class Solution {
    public int digitRoot(int n) {
        while (n >= 10) {
            int prod = 1;
            while (n > 0) {
                prod *= n % 10;
                n /= 10;
            }
            n = prod;
        }
        return n;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitRoot(int n) {
        while (n >= 10) {
            int prod = 1;
            while (n > 0) {
                prod *= n % 10;
                n /= 10;
            }
            n = prod;
        }
        return n;
    }
};`,
  },

  // minCapacity(parcels: List[int], days: int) -> int  — binary search on capacity.
  'pghub-b25-warehouse-bins': {
    javascript: `var minCapacity = function(parcels, days) {
    const need = (cap) => {
        let d = 1, load = 0;
        for (const p of parcels) {
            if (load + p > cap) { d++; load = 0; }
            load += p;
        }
        return d;
    };
    let lo = Math.max(...parcels);
    let hi = parcels.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (need(mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minCapacity(int[] parcels, int days) {
        int lo = 0;
        long hi = 0;
        for (int p : parcels) { lo = Math.max(lo, p); hi += p; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (need(parcels, mid) <= days) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private int need(int[] parcels, long cap) {
        int d = 1;
        long load = 0;
        for (int p : parcels) {
            if (load + p > cap) { d++; load = 0; }
            load += p;
        }
        return d;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& parcels, int days) {
        long long lo = 0, hi = 0;
        for (int p : parcels) { lo = max(lo, (long long)p); hi += p; }
        auto need = [&](long long cap) {
            int d = 1;
            long long load = 0;
            for (int p : parcels) {
                if (load + p > cap) { d++; load = 0; }
                load += p;
            }
            return d;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (need(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // cheapestCrossing(n, bridges: List[List[int]], src, dst) -> int  — Dijkstra.
  'pghub-b26-bridge-toll': {
    javascript: `var cheapestCrossing = function(n, bridges, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of bridges) {
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[src] = 0;
    // min-heap of [d, u]
    const heap = [[0, src]];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const len = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && heap[l][0] < heap[s][0]) s = l;
            if (r < len && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) { heap[0] = last; down(0); }
        return top;
    };
    while (heap.length > 0) {
        const [d, u] = pop();
        if (d > dist[u]) continue;
        if (u === dst) return d;
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; push([nd, v]); }
        }
    }
    return dist[dst] !== INF ? dist[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int cheapestCrossing(int n, int[][] bridges, int src, int dst) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] b : bridges) {
            adj[b[0]].add(new int[]{b[1], b[2]});
            adj[b[1]].add(new int[]{b[0], b[2]});
        }
        long INF = Long.MAX_VALUE;
        long[] dist = new long[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            long d = top[0];
            int u = (int) top[1];
            if (d > dist[u]) continue;
            if (u == dst) return (int) d;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) {
                    dist[e[0]] = nd;
                    pq.add(new long[]{nd, e[0]});
                }
            }
        }
        return dist[dst] != INF ? (int) dist[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestCrossing(int n, vector<vector<int>>& bridges, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& b : bridges) {
            adj[b[0]].push_back({b[1], b[2]});
            adj[b[1]].push_back({b[0], b[2]});
        }
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dst) return (int) d;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        return dist[dst] != INF ? (int) dist[dst] : -1;
    }
};`,
  },

  // canSplitEqual(costs: List[int]) -> bool  — subset-sum to half.
  'pghub-b26-budget-split': {
    javascript: `var canSplitEqual = function(costs) {
    let total = 0;
    for (const c of costs) total += c;
    if (total % 2 === 1) return false;
    const target = total / 2;
    const dp = new Array(target + 1).fill(false);
    dp[0] = true;
    for (const c of costs) {
        for (let s = target; s >= c; s--) {
            if (dp[s - c]) dp[s] = true;
        }
    }
    return dp[target];
};`,
    java: `class Solution {
    public boolean canSplitEqual(int[] costs) {
        int total = 0;
        for (int c : costs) total += c;
        if (total % 2 == 1) return false;
        int target = total / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int c : costs) {
            for (int s = target; s >= c; s--) {
                if (dp[s - c]) dp[s] = true;
            }
        }
        return dp[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitEqual(vector<int>& costs) {
        int total = 0;
        for (int c : costs) total += c;
        if (total % 2 == 1) return false;
        int target = total / 2;
        vector<char> dp(target + 1, 0);
        dp[0] = 1;
        for (int c : costs) {
            for (int s = target; s >= c; s--) {
                if (dp[s - c]) dp[s] = 1;
            }
        }
        return dp[target] != 0;
    }
};`,
  },

  // maxDistinct(visitors: List[int], k: int) -> int  — sliding window distinct count.
  'pghub-b26-cache-window': {
    javascript: `var maxDistinct = function(visitors, k) {
    const n = visitors.length;
    k = Math.min(k, n);
    const freq = new Map();
    for (let i = 0; i < k; i++) {
        freq.set(visitors[i], (freq.get(visitors[i]) || 0) + 1);
    }
    let best = freq.size;
    for (let i = k; i < n; i++) {
        freq.set(visitors[i], (freq.get(visitors[i]) || 0) + 1);
        const out = visitors[i - k];
        const c = freq.get(out) - 1;
        if (c === 0) freq.delete(out);
        else freq.set(out, c);
        if (freq.size > best) best = freq.size;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxDistinct(int[] visitors, int k) {
        int n = visitors.length;
        k = Math.min(k, n);
        Map<Integer, Integer> freq = new HashMap<>();
        for (int i = 0; i < k; i++) {
            freq.merge(visitors[i], 1, Integer::sum);
        }
        int best = freq.size();
        for (int i = k; i < n; i++) {
            freq.merge(visitors[i], 1, Integer::sum);
            int out = visitors[i - k];
            int c = freq.get(out) - 1;
            if (c == 0) freq.remove(out);
            else freq.put(out, c);
            if (freq.size() > best) best = freq.size();
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDistinct(vector<int>& visitors, int k) {
        int n = visitors.size();
        k = min(k, n);
        unordered_map<int,int> freq;
        for (int i = 0; i < k; i++) freq[visitors[i]]++;
        int best = freq.size();
        for (int i = k; i < n; i++) {
            freq[visitors[i]]++;
            int out = visitors[i - k];
            if (--freq[out] == 0) freq.erase(out);
            if ((int)freq.size() > best) best = freq.size();
        }
        return best;
    }
};`,
  },

  // minTrips(weights: List[int], cap: int) -> int  — sort + two pointers.
  'pghub-b26-elevator-trips': {
    javascript: `var minTrips = function(weights, cap) {
    const arr = weights.slice().sort((a, b) => a - b);
    let i = 0, j = arr.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && arr[i] + arr[j] <= cap) i++;
        j--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] weights, int cap) {
        int[] arr = weights.clone();
        Arrays.sort(arr);
        int i = 0, j = arr.length - 1, trips = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= cap) i++;
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
    int minTrips(vector<int>& weights, int cap) {
        vector<int> arr = weights;
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1, trips = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= cap) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // countIslands(grid: List[List[int]]) -> int  — iterative DFS flood fill.
  'pghub-b26-flood-zones': {
    javascript: `var countIslands = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    let count = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let sr = 0; sr < rows; sr++) {
        for (let sc = 0; sc < cols; sc++) {
            if (grid[sr][sc] === 1 && !seen[sr][sc]) {
                count++;
                const stack = [[sr, sc]];
                seen[sr][sc] = true;
                while (stack.length > 0) {
                    const [r, c] = stack.pop();
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countIslands(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int count = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        Deque<int[]> stack = new ArrayDeque<>();
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    stack.push(new int[]{sr, sc});
                    seen[sr][sc] = true;
                    while (!stack.isEmpty()) {
                        int[] cell = stack.pop();
                        int r = cell[0], c = cell[1];
                        for (int[] d : dirs) {
                            int nr = r + d[0], nc = c + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push(new int[]{nr, nc});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countIslands(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        int count = 0;
        int dr[4] = {1,-1,0,0}, dc[4] = {0,0,1,-1};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stack = {{sr, sc}};
                    seen[sr][sc] = 1;
                    while (!stack.empty()) {
                        auto [r, c] = stack.back(); stack.pop_back();
                        for (int k = 0; k < 4; k++) {
                            int nr = r + dr[k], nc = c + dc[k];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = 1;
                                stack.push_back({nr, nc});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
};`,
  },

  // keypadCombos(digits: str) -> List[str]  — backtracking.
  'pghub-b26-keypad-words': {
    javascript: `var keypadCombos = function(digits) {
    if (!digits) return [];
    const mp = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const res = [];
    const bt = (i, cur) => {
        if (i === digits.length) { res.push(cur); return; }
        for (const ch of mp[digits[i]]) {
            bt(i + 1, cur + ch);
        }
    };
    bt(0, '');
    return res;
};`,
    java: `import java.util.*;
class Solution {
    private String[] mp = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    public List<String> keypadCombos(String digits) {
        List<String> res = new ArrayList<>();
        if (digits == null || digits.isEmpty()) return res;
        bt(digits, 0, new StringBuilder(), res);
        return res;
    }
    private void bt(String digits, int i, StringBuilder cur, List<String> res) {
        if (i == digits.length()) { res.add(cur.toString()); return; }
        String letters = mp[digits.charAt(i) - '0'];
        for (int k = 0; k < letters.length(); k++) {
            cur.append(letters.charAt(k));
            bt(digits, i + 1, cur, res);
            cur.deleteCharAt(cur.length() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> keypadCombos(string digits) {
        vector<string> res;
        if (digits.empty()) return res;
        vector<string> mp = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        string cur;
        function<void(int)> bt = [&](int i) {
            if (i == (int)digits.size()) { res.push_back(cur); return; }
            for (char ch : mp[digits[i] - '0']) {
                cur.push_back(ch);
                bt(i + 1);
                cur.pop_back();
            }
        };
        bt(0);
        return res;
    }
};`,
  },

  // runningMedians(stream: List[int]) -> List[int]  — two heaps, lower-median.
  'pghub-b26-median-stream': {
    javascript: `var runningMedians = function(stream) {
    // low: max-heap (store negatives) ; high: min-heap
    const low = [], high = [];
    const up = (h, i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (h[p] <= h[i]) break;
            [h[p], h[i]] = [h[i], h[p]];
            i = p;
        }
    };
    const down = (h, i) => {
        const len = h.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && h[l] < h[s]) s = l;
            if (r < len && h[r] < h[s]) s = r;
            if (s === i) break;
            [h[s], h[i]] = [h[i], h[s]];
            i = s;
        }
    };
    const push = (h, x) => { h.push(x); up(h, h.length - 1); };
    const pop = (h) => {
        const top = h[0];
        const last = h.pop();
        if (h.length > 0) { h[0] = last; down(h, 0); }
        return top;
    };
    const res = [];
    for (const x of stream) {
        if (low.length === 0 || x <= -low[0]) push(low, -x);
        else push(high, x);
        if (low.length > high.length + 1) push(high, -pop(low));
        else if (high.length > low.length) push(low, -pop(high));
        res.push(-low[0]);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] runningMedians(int[] stream) {
        PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<Integer> high = new PriorityQueue<>();
        int[] res = new int[stream.length];
        for (int i = 0; i < stream.length; i++) {
            int x = stream[i];
            if (low.isEmpty() || x <= low.peek()) low.add(x);
            else high.add(x);
            if (low.size() > high.size() + 1) high.add(low.poll());
            else if (high.size() > low.size()) low.add(high.poll());
            res[i] = low.peek();
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> runningMedians(vector<int>& stream) {
        priority_queue<int> low;                                  // max-heap
        priority_queue<int, vector<int>, greater<int>> high;      // min-heap
        vector<int> res;
        for (int x : stream) {
            if (low.empty() || x <= low.top()) low.push(x);
            else high.push(x);
            if (low.size() > high.size() + 1) { high.push(low.top()); low.pop(); }
            else if (high.size() > low.size()) { low.push(high.top()); high.pop(); }
            res.push_back(low.top());
        }
        return res;
    }
};`,
  },

  // paintWays(posts: int, colors: int) -> int  — same/diff DP under mod.
  'pghub-b26-paint-fence': {
    javascript: `var paintWays = function(posts, colors) {
    const MOD = 1000000007n;
    const C = BigInt(colors);
    if (posts === 1) return Number(C % MOD);
    let same = C % MOD;
    let diff = (C * (C - 1n)) % MOD;
    for (let i = 3; i <= posts; i++) {
        const newSame = diff;
        const newDiff = ((same + diff) * (C - 1n)) % MOD;
        same = newSame;
        diff = newDiff;
    }
    return Number((same + diff) % MOD);
};`,
    java: `class Solution {
    public int paintWays(int posts, int colors) {
        long MOD = 1000000007L;
        long c = colors % MOD;
        if (posts == 1) return (int) c;
        long same = c;
        long diff = (c * ((colors - 1) % MOD)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long newSame = diff;
            long newDiff = ((same + diff) % MOD) * ((colors - 1) % MOD) % MOD;
            same = newSame;
            diff = newDiff;
        }
        return (int) ((same + diff) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        long long c = colors % MOD;
        if (posts == 1) return (int) c;
        long long same = c;
        long long diff = (c * ((colors - 1) % MOD)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD) * ((colors - 1) % MOD) % MOD;
            same = newSame;
            diff = newDiff;
        }
        return (int) ((same + diff) % MOD);
    }
};`,
  },

  // canMakePalindrome(s: str) -> bool  — at most one odd-count char.
  'pghub-b26-palindrome-pair': {
    javascript: `var canMakePalindrome = function(s) {
    const counts = new Map();
    for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
    let odd = 0;
    for (const v of counts.values()) if (v % 2 === 1) odd++;
    return odd <= 1;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canMakePalindrome(String s) {
        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) counts.merge(s.charAt(i), 1, Integer::sum);
        int odd = 0;
        for (int v : counts.values()) if (v % 2 == 1) odd++;
        return odd <= 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canMakePalindrome(string s) {
        unordered_map<char,int> counts;
        for (char ch : s) counts[ch]++;
        int odd = 0;
        for (auto& [k, v] : counts) if (v % 2 == 1) odd++;
        return odd <= 1;
    }
};`,
  },

  // maxRunningTotal(amounts: List[int]) -> int  — max prefix sum.
  'pghub-b26-receipt-total': {
    javascript: `var maxRunningTotal = function(amounts) {
    let running = 0, best = null;
    for (const a of amounts) {
        running += a;
        if (best === null || running > best) best = running;
    }
    return best;
};`,
    java: `class Solution {
    public int maxRunningTotal(int[] amounts) {
        long running = 0;
        Long best = null;
        for (int a : amounts) {
            running += a;
            if (best == null || running > best) best = running;
        }
        return best.intValue();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxRunningTotal(vector<int>& amounts) {
        long long running = 0, best = 0;
        bool init = false;
        for (int a : amounts) {
            running += a;
            if (!init || running > best) { best = running; init = true; }
        }
        return (int) best;
    }
};`,
  },

  // spiralOrder(grid: List[List[int]]) -> List[int]  — boundary shrink.
  'pghub-b26-spiral-read': {
    javascript: `var spiralOrder = function(grid) {
    const res = [];
    let top = 0, bottom = grid.length - 1, left = 0, right = grid[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) res.push(grid[top][c]);
        top++;
        for (let r = top; r <= bottom; r++) res.push(grid[r][right]);
        right--;
        if (top <= bottom) { for (let c = right; c >= left; c--) res.push(grid[bottom][c]); bottom--; }
        if (left <= right) { for (let r = bottom; r >= top; r--) res.push(grid[r][left]); left++; }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> spiralOrder(int[][] grid) {
        List<Integer> res = new ArrayList<>();
        int top = 0, bottom = grid.length - 1, left = 0, right = grid[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.add(grid[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.add(grid[r][right]);
            right--;
            if (top <= bottom) { for (int c = right; c >= left; c--) res.add(grid[bottom][c]); bottom--; }
            if (left <= right) { for (int r = bottom; r >= top; r--) res.add(grid[r][left]); left++; }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& grid) {
        vector<int> res;
        int top = 0, bottom = (int)grid.size() - 1, left = 0, right = (int)grid[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.push_back(grid[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.push_back(grid[r][right]);
            right--;
            if (top <= bottom) { for (int c = right; c >= left; c--) res.push_back(grid[bottom][c]); bottom--; }
            if (left <= right) { for (int r = bottom; r >= top; r--) res.push_back(grid[r][left]); left++; }
        }
        return res;
    }
};`,
  },

  // priceSpan(prices: List[int]) -> List[int]  — monotonic stack.
  'pghub-b26-stock-span': {
    javascript: `var priceSpan = function(prices) {
    const res = new Array(prices.length).fill(0);
    const stack = [];
    for (let i = 0; i < prices.length; i++) {
        const p = prices[i];
        while (stack.length > 0 && prices[stack[stack.length - 1]] <= p) stack.pop();
        res[i] = stack.length > 0 ? i - stack[stack.length - 1] : i + 1;
        stack.push(i);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] priceSpan(int[] prices) {
        int[] res = new int[prices.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < prices.length; i++) {
            int p = prices[i];
            while (!stack.isEmpty() && prices[stack.peek()] <= p) stack.pop();
            res[i] = !stack.isEmpty() ? i - stack.peek() : i + 1;
            stack.push(i);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> priceSpan(vector<int>& prices) {
        int n = prices.size();
        vector<int> res(n, 0);
        vector<int> stack;
        for (int i = 0; i < n; i++) {
            int p = prices[i];
            while (!stack.empty() && prices[stack.back()] <= p) stack.pop_back();
            res[i] = !stack.empty() ? i - stack.back() : i + 1;
            stack.push_back(i);
        }
        return res;
    }
};`,
  },

  // countAtLeast(seats: List[int], price: int) -> int  — upper-bound search.
  'pghub-b26-ticket-window': {
    javascript: `var countAtLeast = function(seats, price) {
    let lo = 0, hi = seats.length;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (seats[mid] <= price) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int countAtLeast(int[] seats, int price) {
        int lo = 0, hi = seats.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (seats[mid] <= price) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countAtLeast(vector<int>& seats, int price) {
        int lo = 0, hi = seats.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (seats[mid] <= price) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // minCoins(amount: int) -> int  — greedy canonical coins.
  'pghub-b26-vending-change': {
    javascript: `var minCoins = function(amount) {
    const coins = [25, 10, 5, 1];
    let count = 0;
    for (const c of coins) {
        count += Math.floor(amount / c);
        amount %= c;
    }
    return count;
};`,
    java: `class Solution {
    public int minCoins(int amount) {
        int[] coins = {25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(int amount) {
        int coins[4] = {25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
};`,
  },

  // lonelyReading(readings: List[int]) -> int  — XOR all.
  'pghub-b26-xor-pair': {
    javascript: `var lonelyReading = function(readings) {
    let acc = 0;
    for (const r of readings) acc ^= r;
    return acc;
};`,
    java: `class Solution {
    public int lonelyReading(int[] readings) {
        int acc = 0;
        for (int r : readings) acc ^= r;
        return acc;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lonelyReading(vector<int>& readings) {
        int acc = 0;
        for (int r : readings) acc ^= r;
        return acc;
    }
};`,
  },

  // isBalanced(s: str) -> bool  — stack of brackets.
  'pghub-b27-bracket-balance': {
    javascript: `var isBalanced = function(s) {
    const pairs = {')': '(', ']': '[', '}': '{'};
    const stack = [];
    for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else {
            if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
        }
    }
    return stack.length === 0;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isBalanced(String s) {
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '('); pairs.put(']', '['); pairs.put('}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);
            else {
                if (stack.isEmpty() || stack.pop() != pairs.get(ch)) return false;
            }
        }
        return stack.isEmpty();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string s) {
        unordered_map<char,char> pairs = {{')','('},{']','['},{'}','{'}};
        vector<char> stack;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push_back(ch);
            else {
                if (stack.empty() || stack.back() != pairs[ch]) return false;
                stack.pop_back();
            }
        }
        return stack.empty();
    }
};`,
  },

  // rangeSum(inserts: List[int], lo: int, hi: int) -> int  — BST build + pruned sum.
  'pghub-b27-bst-range-sum': {
    javascript: `var rangeSum = function(inserts, lo, hi) {
    // tree[val] = [left, right]; null means no child
    const tree = new Map();
    let root = null;
    for (const v of inserts) {
        if (root === null) { root = v; tree.set(v, [null, null]); continue; }
        let cur = root;
        while (true) {
            if (v === cur) break;
            const side = v < cur ? 0 : 1;
            const nxt = tree.get(cur)[side];
            if (nxt === null) { tree.get(cur)[side] = v; tree.set(v, [null, null]); break; }
            cur = nxt;
        }
    }
    let total = 0;
    const stack = root !== null ? [root] : [];
    while (stack.length > 0) {
        const node = stack.pop();
        if (node === null) continue;
        if (lo <= node && node <= hi) total += node;
        const [left, right] = tree.get(node);
        if (node > lo && left !== null) stack.push(left);
        if (node < hi && right !== null) stack.push(right);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int rangeSum(int[] inserts, int lo, int hi) {
        // child[v] = {left, right}, MIN_VALUE marker means "no node"; use map of present
        Map<Integer, int[]> tree = new HashMap<>();
        final int NONE = Integer.MIN_VALUE;
        Integer root = null;
        for (int v : inserts) {
            if (root == null) { root = v; tree.put(v, new int[]{NONE, NONE}); continue; }
            int cur = root;
            while (true) {
                if (v == cur) break;
                int side = v < cur ? 0 : 1;
                int nxt = tree.get(cur)[side];
                if (nxt == NONE) { tree.get(cur)[side] = v; tree.put(v, new int[]{NONE, NONE}); break; }
                cur = nxt;
            }
        }
        long total = 0;
        Deque<Integer> stack = new ArrayDeque<>();
        if (root != null) stack.push(root);
        while (!stack.isEmpty()) {
            int node = stack.pop();
            if (lo <= node && node <= hi) total += node;
            int[] ch = tree.get(node);
            if (node > lo && ch[0] != NONE) stack.push(ch[0]);
            if (node < hi && ch[1] != NONE) stack.push(ch[1]);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& inserts, int lo, int hi) {
        const int NONE = INT_MIN;
        unordered_map<int, array<int,2>> tree;
        bool hasRoot = false;
        int root = 0;
        for (int v : inserts) {
            if (!hasRoot) { root = v; hasRoot = true; tree[v] = {NONE, NONE}; continue; }
            int cur = root;
            while (true) {
                if (v == cur) break;
                int side = v < cur ? 0 : 1;
                int nxt = tree[cur][side];
                if (nxt == NONE) { tree[cur][side] = v; tree[v] = {NONE, NONE}; break; }
                cur = nxt;
            }
        }
        long long total = 0;
        vector<int> stack;
        if (hasRoot) stack.push_back(root);
        while (!stack.empty()) {
            int node = stack.back(); stack.pop_back();
            if (lo <= node && node <= hi) total += node;
            auto& ch = tree[node];
            if (node > lo && ch[0] != NONE) stack.push_back(ch[0]);
            if (node < hi && ch[1] != NONE) stack.push_back(ch[1]);
        }
        return (int) total;
    }
};`,
  },

  // buildOrder(n: int, deps: List[List[int]]) -> List[int]  — Kahn topo w/ min-heap.
  'pghub-b27-build-order': {
    javascript: `var buildOrder = function(n, deps) {
    const adj = Array.from({length: n}, () => []);
    const indeg = new Array(n).fill(0);
    for (const [a, b] of deps) {
        adj[a].push(b);
        indeg[b]++;
    }
    // min-heap of node ids
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
        const len = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && heap[l] < heap[s]) s = l;
            if (r < len && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) { heap[0] = last; down(0); }
        return top;
    };
    for (let i = 0; i < n; i++) if (indeg[i] === 0) push(i);
    const order = [];
    while (heap.length > 0) {
        const u = pop();
        order.push(u);
        for (const v of adj[u]) {
            if (--indeg[v] === 0) push(v);
        }
    }
    return order.length === n ? order : [];
};`,
    java: `import java.util.*;
class Solution {
    public int[] buildOrder(int n, int[][] deps) {
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        int[] indeg = new int[n];
        for (int[] d : deps) {
            adj[d[0]].add(d[1]);
            indeg[d[1]]++;
        }
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.add(i);
        List<Integer> order = new ArrayList<>();
        while (!heap.isEmpty()) {
            int u = heap.poll();
            order.add(u);
            for (int v : adj[u]) {
                if (--indeg[v] == 0) heap.add(v);
            }
        }
        if (order.size() != n) return new int[0];
        int[] res = new int[order.size()];
        for (int i = 0; i < res.length; i++) res[i] = order.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> buildOrder(int n, vector<vector<int>>& deps) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& d : deps) {
            adj[d[0]].push_back(d[1]);
            indeg[d[1]]++;
        }
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.push(i);
        vector<int> order;
        while (!heap.empty()) {
            int u = heap.top(); heap.pop();
            order.push_back(u);
            for (int v : adj[u]) {
                if (--indeg[v] == 0) heap.push(v);
            }
        }
        if ((int)order.size() != n) return {};
        return order;
    }
};`,
  },

  // digitalRoot(num: int) -> int  — collapse to digit product.
  'pghub-b27-digital-root-product': {
    javascript: `var digitalRoot = function(num) {
    while (num >= 10) {
        let prod = 1, x = num;
        while (x > 0) {
            prod *= x % 10;
            x = Math.floor(x / 10);
        }
        num = prod;
    }
    return num;
};`,
    java: `class Solution {
    public int digitalRoot(int num) {
        while (num >= 10) {
            int prod = 1, x = num;
            while (x > 0) {
                prod *= x % 10;
                x /= 10;
            }
            num = prod;
        }
        return num;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitalRoot(int num) {
        while (num >= 10) {
            int prod = 1, x = num;
            while (x > 0) {
                prod *= x % 10;
                x /= 10;
            }
            num = prod;
        }
        return num;
    }
};`,
  },

  // pivotIndex(nums: List[int]) -> int  — left/right sum balance.
  'pghub-b27-equilibrium-pivot': {
    javascript: `var pivotIndex = function(nums) {
    let total = 0;
    for (const v of nums) total += v;
    let left = 0;
    for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) return i;
        left += nums[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int pivotIndex(int[] nums) {
        long total = 0;
        for (int v : nums) total += v;
        long left = 0;
        for (int i = 0; i < nums.length; i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int pivotIndex(vector<int>& nums) {
        long long total = 0;
        for (int v : nums) total += v;
        long long left = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
};`,
  },

  // letterCombos(digits: str) -> List[str]  — backtracking.
  'pghub-b27-keypad-words': {
    javascript: `var letterCombos = function(digits) {
    if (!digits) return [];
    const mapping = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const res = [];
    const cur = [];
    const backtrack = (i) => {
        if (i === digits.length) { res.push(cur.join('')); return; }
        for (const ch of mapping[digits[i]]) {
            cur.push(ch);
            backtrack(i + 1);
            cur.pop();
        }
    };
    backtrack(0);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    private String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    public List<String> letterCombos(String digits) {
        List<String> res = new ArrayList<>();
        if (digits == null || digits.isEmpty()) return res;
        backtrack(digits, 0, new StringBuilder(), res);
        return res;
    }
    private void backtrack(String digits, int i, StringBuilder cur, List<String> res) {
        if (i == digits.length()) { res.add(cur.toString()); return; }
        String letters = mapping[digits.charAt(i) - '0'];
        for (int k = 0; k < letters.length(); k++) {
            cur.append(letters.charAt(k));
            backtrack(digits, i + 1, cur, res);
            cur.deleteCharAt(cur.length() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> letterCombos(string digits) {
        vector<string> res;
        if (digits.empty()) return res;
        vector<string> mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        string cur;
        function<void(int)> backtrack = [&](int i) {
            if (i == (int)digits.size()) { res.push_back(cur); return; }
            for (char ch : mapping[digits[i] - '0']) {
                cur.push_back(ch);
                backtrack(i + 1);
                cur.pop_back();
            }
        };
        backtrack(0);
        return res;
    }
};`,
  },

  // longestShared(a: str, b: str) -> int  — LCS length, rolling rows.
  'pghub-b27-lcs-length': {
    javascript: `var longestShared = function(a, b) {
    const m = a.length, n = b.length;
    let prev = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        const cur = new Array(n + 1).fill(0);
        const ai = a[i - 1];
        for (let j = 1; j <= n; j++) {
            if (ai === b[j - 1]) cur[j] = prev[j - 1] + 1;
            else cur[j] = Math.max(prev[j], cur[j - 1]);
        }
        prev = cur;
    }
    return prev[n];
};`,
    java: `class Solution {
    public int longestShared(String a, String b) {
        int m = a.length(), n = b.length();
        int[] prev = new int[n + 1];
        for (int i = 1; i <= m; i++) {
            int[] cur = new int[n + 1];
            char ai = a.charAt(i - 1);
            for (int j = 1; j <= n; j++) {
                if (ai == b.charAt(j - 1)) cur[j] = prev[j - 1] + 1;
                else cur[j] = Math.max(prev[j], cur[j - 1]);
            }
            prev = cur;
        }
        return prev[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestShared(string a, string b) {
        int m = a.size(), n = b.size();
        vector<int> prev(n + 1, 0);
        for (int i = 1; i <= m; i++) {
            vector<int> cur(n + 1, 0);
            char ai = a[i - 1];
            for (int j = 1; j <= n; j++) {
                if (ai == b[j - 1]) cur[j] = prev[j - 1] + 1;
                else cur[j] = max(prev[j], cur[j - 1]);
            }
            prev = cur;
        }
        return prev[n];
    }
};`,
  },

  // longestWindow(nums: List[int], limit: int) -> int  — sliding window sum.
  'pghub-b27-longest-window-sum': {
    javascript: `var longestWindow = function(nums, limit) {
    let left = 0, cur = 0, best = 0;
    for (let right = 0; right < nums.length; right++) {
        cur += nums[right];
        while (cur > limit && left <= right) {
            cur -= nums[left];
            left++;
        }
        if (cur <= limit) best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestWindow(int[] nums, int limit) {
        int left = 0;
        long cur = 0;
        int best = 0;
        for (int right = 0; right < nums.length; right++) {
            cur += nums[right];
            while (cur > limit && left <= right) {
                cur -= nums[left];
                left++;
            }
            if (cur <= limit) best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestWindow(vector<int>& nums, int limit) {
        int left = 0, best = 0;
        long long cur = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            cur += nums[right];
            while (cur > limit && left <= right) {
                cur -= nums[left];
                left++;
            }
            if (cur <= limit) best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // maxMeetings(intervals: List[List[int]]) -> int  — activity selection.
  'pghub-b27-max-meetings': {
    javascript: `var maxMeetings = function(intervals) {
    const arr = intervals.slice().sort((a, b) => a[1] - b[1]);
    let count = 0, lastEnd = -Infinity;
    for (const [s, e] of arr) {
        if (s >= lastEnd) { count++; lastEnd = e; }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int maxMeetings(int[][] intervals) {
        int[][] arr = intervals.clone();
        Arrays.sort(arr, (a, b) -> Integer.compare(a[1], b[1]));
        int count = 0;
        long lastEnd = Long.MIN_VALUE;
        for (int[] m : arr) {
            if (m[0] >= lastEnd) { count++; lastEnd = m[1]; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxMeetings(vector<vector<int>>& intervals) {
        vector<vector<int>> arr = intervals;
        sort(arr.begin(), arr.end(), [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int count = 0;
        long long lastEnd = LLONG_MIN;
        for (auto& m : arr) {
            if (m[0] >= lastEnd) { count++; lastEnd = m[1]; }
        }
        return count;
    }
};`,
  },

  // minSpeed(piles: List[int], hours: int) -> int  — binary search ceil-div.
  'pghub-b27-min-eat-speed': {
    javascript: `var minSpeed = function(piles, hours) {
    const hoursNeeded = (v) => {
        let total = 0;
        for (const p of piles) total += Math.floor((p + v - 1) / v);
        return total;
    };
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (hoursNeeded(mid) <= hours) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minSpeed(int[] piles, int hours) {
        int lo = 1, hi = 1;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursNeeded(piles, mid) <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private long hoursNeeded(int[] piles, int v) {
        long total = 0;
        for (int p : piles) total += (p + (long) v - 1) / v;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpeed(vector<int>& piles, int hours) {
        int lo = 1, hi = 1;
        for (int p : piles) hi = max(hi, p);
        auto hoursNeeded = [&](int v) {
            long long total = 0;
            for (int p : piles) total += (p + (long long)v - 1) / v;
            return total;
        };
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursNeeded(mid) <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // minPathCost(grid: List[List[int]]) -> int  — bottom-up DP over rows.
  'pghub-b27-min-path-cost': {
    javascript: `var minPathCost = function(grid) {
    const n = grid.length, cols = grid[0].length;
    let prev = grid[0].slice();
    for (let r = 1; r < n; r++) {
        const cur = new Array(cols).fill(0);
        for (let c = 0; c < cols; c++) {
            let best = prev[c];
            if (c > 0) best = Math.min(best, prev[c - 1]);
            if (c < cols - 1) best = Math.min(best, prev[c + 1]);
            cur[c] = grid[r][c] + best;
        }
        prev = cur;
    }
    return Math.min(...prev);
};`,
    java: `class Solution {
    public int minPathCost(int[][] grid) {
        int n = grid.length, cols = grid[0].length;
        int[] prev = grid[0].clone();
        for (int r = 1; r < n; r++) {
            int[] cur = new int[cols];
            for (int c = 0; c < cols; c++) {
                int best = prev[c];
                if (c > 0) best = Math.min(best, prev[c - 1]);
                if (c < cols - 1) best = Math.min(best, prev[c + 1]);
                cur[c] = grid[r][c] + best;
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
    int minPathCost(vector<vector<int>>& grid) {
        int n = grid.size(), cols = grid[0].size();
        vector<int> prev = grid[0];
        for (int r = 1; r < n; r++) {
            vector<int> cur(cols, 0);
            for (int c = 0; c < cols; c++) {
                int best = prev[c];
                if (c > 0) best = min(best, prev[c - 1]);
                if (c < cols - 1) best = min(best, prev[c + 1]);
                cur[c] = grid[r][c] + best;
            }
            prev = cur;
        }
        return *min_element(prev.begin(), prev.end());
    }
};`,
  },
};
