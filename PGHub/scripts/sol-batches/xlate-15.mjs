// xlate-15 — translations of verified Python solutions to JS/Java/C++.
// Slice [420,450) of pyReal && missingLangs targets (sorted by id ascending).
// Signatures match generateTemplate(language, method_name, params, return_type)
// exactly. The runner grades each language via Judge0 and writes only passing langs.
//
// SKIPPED (not in this map):
//   pghub-b37-tree-tilt — param `root: List[int]` but test inputs carry `None`
//     sentinels (tree-shape tokens), which the int-array drivers cannot parse.

export default {
  // allowedRequests(times: List[int], window: int, cap: int) -> int
  // Sliding window of accepted timestamps within [t-window+1, t], cap per window.
  'pghub-b37-token-bucket': {
    javascript: `var allowedRequests = function(times, window, cap) {
    const accepted = [];
    let head = 0, count = 0;
    for (const t of times) {
        while (head < accepted.length && accepted[head] < t - window + 1) head++;
        if (accepted.length - head < cap) { accepted.push(t); count++; }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int allowedRequests(int[] times, int window, int cap) {
        Deque<Integer> accepted = new ArrayDeque<>();
        int count = 0;
        for (int t : times) {
            while (!accepted.isEmpty() && accepted.peekFirst() < t - window + 1) accepted.pollFirst();
            if (accepted.size() < cap) { accepted.addLast(t); count++; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int allowedRequests(vector<int>& times, int window, int cap) {
        deque<int> accepted;
        int count = 0;
        for (int t : times) {
            while (!accepted.empty() && accepted.front() < t - window + 1) accepted.pop_front();
            if ((int)accepted.size() < cap) { accepted.push_back(t); count++; }
        }
        return count;
    }
};`,
  },

  // busiestMinute(entries: List[int]) -> int  — mode, ties broken by smallest minute.
  'pghub-b37-turnstile-flow': {
    javascript: `var busiestMinute = function(entries) {
    const counts = new Map();
    for (const m of entries) counts.set(m, (counts.get(m) || 0) + 1);
    let bestMinute = null, bestCount = -1;
    for (const [minute, c] of counts) {
        if (c > bestCount || (c === bestCount && minute < bestMinute)) {
            bestCount = c; bestMinute = minute;
        }
    }
    return bestMinute;
};`,
    java: `import java.util.*;
class Solution {
    public int busiestMinute(int[] entries) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int m : entries) counts.merge(m, 1, Integer::sum);
        int bestMinute = 0, bestCount = -1;
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
            int minute = e.getKey(), c = e.getValue();
            if (c > bestCount || (c == bestCount && minute < bestMinute)) {
                bestCount = c; bestMinute = minute;
            }
        }
        return bestMinute;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int busiestMinute(vector<int>& entries) {
        unordered_map<int,int> counts;
        for (int m : entries) counts[m]++;
        int bestMinute = 0, bestCount = -1;
        for (auto& kv : counts) {
            int minute = kv.first, c = kv.second;
            if (c > bestCount || (c == bestCount && minute < bestMinute)) {
                bestCount = c; bestMinute = minute;
            }
        }
        return bestMinute;
    }
};`,
  },

  // countShipments(weights: List[int], limit: int) -> int  — sort + two-pointer pairing.
  'pghub-b37-warehouse-pack': {
    javascript: `var countShipments = function(weights, limit) {
    weights = weights.slice().sort((a, b) => a - b);
    let lo = 0, hi = weights.length - 1, total = 0;
    while (lo < hi) {
        if (weights[lo] + weights[hi] <= limit) { total += hi - lo; lo++; }
        else hi--;
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int countShipments(int[] weights, int limit) {
        int[] w = weights.clone();
        Arrays.sort(w);
        int lo = 0, hi = w.length - 1, total = 0;
        while (lo < hi) {
            if (w[lo] + w[hi] <= limit) { total += hi - lo; lo++; }
            else hi--;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countShipments(vector<int>& weights, int limit) {
        vector<int> w = weights;
        sort(w.begin(), w.end());
        int lo = 0, hi = (int)w.size() - 1, total = 0;
        while (lo < hi) {
            if (w[lo] + w[hi] <= limit) { total += hi - lo; lo++; }
            else hi--;
        }
        return total;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max nesting of parentheses.
  'pghub-b38-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') { depth++; if (depth > best) best = depth; }
        else if (ch === ')') depth--;
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') { depth++; if (depth > best) best = depth; }
            else if (ch == ')') depth--;
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
            if (ch == '(') { depth++; if (depth > best) best = depth; }
            else if (ch == ')') depth--;
        }
        return best;
    }
};`,
  },

  // clockAngle(hour: int, minute: int) -> int  — angle between hands, rounded.
  'pghub-b38-clock-angle': {
    javascript: `var clockAngle = function(hour, minute) {
    const h = hour % 12;
    const minuteAngle = minute * 6;
    const hourAngle = h * 30 + minute * 0.5;
    let diff = Math.abs(hourAngle - minuteAngle);
    diff = Math.min(diff, 360 - diff);
    return Math.round(diff);
};`,
    java: `class Solution {
    public int clockAngle(int hour, int minute) {
        int h = hour % 12;
        double minuteAngle = minute * 6;
        double hourAngle = h * 30 + minute * 0.5;
        double diff = Math.abs(hourAngle - minuteAngle);
        diff = Math.min(diff, 360 - diff);
        return (int) Math.round(diff);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int clockAngle(int hour, int minute) {
        int h = hour % 12;
        double minuteAngle = minute * 6;
        double hourAngle = h * 30 + minute * 0.5;
        double diff = fabs(hourAngle - minuteAngle);
        diff = min(diff, 360 - diff);
        return (int) llround(diff);
    }
};`,
  },

  // minRecolor(tiles: str) -> int  — DP over colors R/G/B, no two adjacent equal.
  'pghub-b38-color-runs': {
    javascript: `var minRecolor = function(tiles) {
    const colors = ['R', 'G', 'B'];
    const n = tiles.length;
    let dp = {};
    for (const c of colors) dp[c] = tiles[0] === c ? 0 : 1;
    for (let i = 1; i < n; i++) {
        const ndp = {};
        for (const c of colors) {
            const cost = tiles[i] === c ? 0 : 1;
            let bestPrev = Infinity;
            for (const p of colors) if (p !== c) bestPrev = Math.min(bestPrev, dp[p]);
            ndp[c] = bestPrev + cost;
        }
        dp = ndp;
    }
    return Math.min(dp['R'], dp['G'], dp['B']);
};`,
    java: `import java.util.*;
class Solution {
    public int minRecolor(String tiles) {
        char[] colors = {'R', 'G', 'B'};
        int n = tiles.length();
        Map<Character, Integer> dp = new HashMap<>();
        for (char c : colors) dp.put(c, tiles.charAt(0) == c ? 0 : 1);
        for (int i = 1; i < n; i++) {
            Map<Character, Integer> ndp = new HashMap<>();
            for (char c : colors) {
                int cost = tiles.charAt(i) == c ? 0 : 1;
                int bestPrev = Integer.MAX_VALUE;
                for (char p : colors) if (p != c) bestPrev = Math.min(bestPrev, dp.get(p));
                ndp.put(c, bestPrev + cost);
            }
            dp = ndp;
        }
        return Math.min(dp.get('R'), Math.min(dp.get('G'), dp.get('B')));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRecolor(string tiles) {
        string colors = "RGB";
        int n = tiles.size();
        map<char,int> dp;
        for (char c : colors) dp[c] = (tiles[0] == c) ? 0 : 1;
        for (int i = 1; i < n; i++) {
            map<char,int> ndp;
            for (char c : colors) {
                int cost = (tiles[i] == c) ? 0 : 1;
                int bestPrev = INT_MAX;
                for (char p : colors) if (p != c) bestPrev = min(bestPrev, dp[p]);
                ndp[c] = bestPrev + cost;
            }
            dp = ndp;
        }
        int ans = INT_MAX;
        for (char c : colors) ans = min(ans, dp[c]);
        return ans;
    }
};`,
  },

  // minCapacity(weights: List[int], shifts: int) -> int  — binary search on capacity.
  'pghub-b38-conveyor-merge': {
    javascript: `var minCapacity = function(weights, shifts) {
    const needed = (cap) => {
        let used = 1, cur = 0;
        for (const w of weights) {
            if (cur + w > cap) { used++; cur = 0; }
            cur += w;
        }
        return used;
    };
    let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= shifts) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minCapacity(int[] weights, int shifts) {
        int lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (needed(weights, mid) <= shifts) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private int needed(int[] weights, int cap) {
        int used = 1, cur = 0;
        for (int w : weights) {
            if (cur + w > cap) { used++; cur = 0; }
            cur += w;
        }
        return used;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& weights, int shifts) {
        auto needed = [&](int cap) {
            int used = 1, cur = 0;
            for (int w : weights) {
                if (cur + w > cap) { used++; cur = 0; }
                cur += w;
            }
            return used;
        };
        int lo = 0; long long hi = 0;
        for (int w : weights) { lo = max(lo, w); hi += w; }
        int hiI = (int)hi;
        while (lo < hiI) {
            int mid = lo + (hiI - lo) / 2;
            if (needed(mid) <= shifts) hiI = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // maxCoupons(n: int, rates: List[List[int]], start: int, amount: int) -> int
  // DFS over multiplicative edges, keep best value reached at each node.
  'pghub-b38-coupon-graph': {
    javascript: `var maxCoupons = function(n, rates, start, amount) {
    const adj = new Map();
    for (const [a, b, mult] of rates) {
        if (!adj.has(a)) adj.set(a, []);
        adj.get(a).push([b, mult]);
    }
    const best = new Map();
    const dfs = (node, have) => {
        if (best.has(node) && best.get(node) >= have) return;
        best.set(node, have);
        for (const [nxt, mult] of (adj.get(node) || [])) dfs(nxt, have * mult);
    };
    dfs(start, amount);
    let ans = -Infinity;
    for (const v of best.values()) ans = Math.max(ans, v);
    return ans;
};`,
    java: `import java.util.*;
class Solution {
    private Map<Integer, List<int[]>> adj = new HashMap<>();
    private Map<Integer, Long> best = new HashMap<>();
    public int maxCoupons(int n, int[][] rates, int start, int amount) {
        for (int[] r : rates) adj.computeIfAbsent(r[0], k -> new ArrayList<>()).add(new int[]{r[1], r[2]});
        dfs(start, (long) amount);
        long ans = Long.MIN_VALUE;
        for (long v : best.values()) ans = Math.max(ans, v);
        return (int) ans;
    }
    private void dfs(int node, long have) {
        if (best.containsKey(node) && best.get(node) >= have) return;
        best.put(node, have);
        for (int[] e : adj.getOrDefault(node, Collections.emptyList())) dfs(e[0], have * e[1]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    unordered_map<int, vector<pair<int,int>>> adj;
    unordered_map<int, long long> best;
    void dfs(int node, long long have) {
        auto it = best.find(node);
        if (it != best.end() && it->second >= have) return;
        best[node] = have;
        for (auto& e : adj[node]) dfs(e.first, have * e.second);
    }
    int maxCoupons(int n, vector<vector<int>>& rates, int start, int amount) {
        for (auto& r : rates) adj[r[0]].push_back({r[1], r[2]});
        dfs(start, (long long)amount);
        long long ans = LLONG_MIN;
        for (auto& kv : best) ans = max(ans, kv.second);
        return (int)ans;
    }
};`,
  },

  // canSplit(gifts: List[int]) -> bool  — subset-sum to half (partition).
  'pghub-b38-gift-split': {
    javascript: `var canSplit = function(gifts) {
    let total = 0;
    for (const g of gifts) total += g;
    if (total % 2 === 1) return false;
    const target = total / 2;
    let reachable = new Set([0]);
    for (const g of gifts) {
        const nxt = new Set(reachable);
        for (const s of reachable) if (s + g <= target) nxt.add(s + g);
        reachable = nxt;
        if (reachable.has(target)) return true;
    }
    return reachable.has(target);
};`,
    java: `import java.util.*;
class Solution {
    public boolean canSplit(int[] gifts) {
        int total = 0;
        for (int g : gifts) total += g;
        if (total % 2 == 1) return false;
        int target = total / 2;
        Set<Integer> reachable = new HashSet<>();
        reachable.add(0);
        for (int g : gifts) {
            Set<Integer> nxt = new HashSet<>(reachable);
            for (int s : reachable) if (s + g <= target) nxt.add(s + g);
            reachable = nxt;
            if (reachable.contains(target)) return true;
        }
        return reachable.contains(target);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplit(vector<int>& gifts) {
        int total = 0;
        for (int g : gifts) total += g;
        if (total % 2 == 1) return false;
        int target = total / 2;
        unordered_set<int> reachable;
        reachable.insert(0);
        for (int g : gifts) {
            unordered_set<int> nxt(reachable);
            for (int s : reachable) if (s + g <= target) nxt.insert(s + g);
            reachable = nxt;
            if (reachable.count(target)) return true;
        }
        return reachable.count(target) > 0;
    }
};`,
  },

  // shoreline(grid: List[List[int]]) -> int  — perimeter contributed by water cells.
  'pghub-b38-island-perimeter': {
    javascript: `var shoreline = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 0) {
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === 1) perim++;
                }
            }
        }
    }
    return perim;
};`,
    java: `class Solution {
    public int shoreline(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 0) {
                    for (int[] d : dirs) {
                        int nr = r + d[0], nc = c + d[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == 1) perim++;
                    }
                }
            }
        }
        return perim;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shoreline(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 0) {
                    for (auto& d : dirs) {
                        int nr = r + d[0], nc = c + d[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == 1) perim++;
                    }
                }
            }
        }
        return perim;
    }
};`,
  },

  // trimToPalindrome(s: str) -> int  — min end-trims to reach a palindrome.
  'pghub-b38-palindrome-trim': {
    javascript: `var trimToPalindrome = function(s) {
    let lo = 0, hi = s.length - 1;
    while (lo < hi && s[lo] === s[hi]) { lo++; hi--; }
    if (lo >= hi) return 0;
    const memo = new Map();
    const best = (left, right) => {
        while (left < right && s[left] === s[right]) { left++; right--; }
        if (left >= right) return 0;
        const key = left * s.length + right;
        if (memo.has(key)) return memo.get(key);
        const r = 1 + Math.min(best(left + 1, right), best(left, right - 1));
        memo.set(key, r);
        return r;
    };
    return best(lo, hi);
};`,
    java: `import java.util.*;
class Solution {
    private String s;
    private Map<Long, Integer> memo = new HashMap<>();
    public int trimToPalindrome(String s) {
        this.s = s;
        int lo = 0, hi = s.length() - 1;
        while (lo < hi && s.charAt(lo) == s.charAt(hi)) { lo++; hi--; }
        if (lo >= hi) return 0;
        return best(lo, hi);
    }
    private int best(int left, int right) {
        while (left < right && s.charAt(left) == s.charAt(right)) { left++; right--; }
        if (left >= right) return 0;
        long key = (long) left * s.length() + right;
        if (memo.containsKey(key)) return memo.get(key);
        int r = 1 + Math.min(best(left + 1, right), best(left, right - 1));
        memo.put(key, r);
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string s;
    unordered_map<long long, int> memo;
    int best(int left, int right) {
        while (left < right && s[left] == s[right]) { left++; right--; }
        if (left >= right) return 0;
        long long key = (long long)left * (long long)s.size() + right;
        auto it = memo.find(key);
        if (it != memo.end()) return it->second;
        int r = 1 + min(best(left + 1, right), best(left, right - 1));
        memo[key] = r;
        return r;
    }
    int trimToPalindrome(string s) {
        this->s = s;
        int lo = 0, hi = (int)s.size() - 1;
        while (lo < hi && s[lo] == s[hi]) { lo++; hi--; }
        if (lo >= hi) return 0;
        return best(lo, hi);
    }
};`,
  },

  // tierRevenue(hours: List[int], rate: int) -> int  — base rate up to 3h, 2x beyond.
  'pghub-b38-parking-tiers': {
    javascript: `var tierRevenue = function(hours, rate) {
    let total = 0;
    for (const h of hours) {
        const base = Math.min(h, 3);
        const extra = Math.max(0, h - 3);
        total += base * rate + extra * rate * 2;
    }
    return total;
};`,
    java: `class Solution {
    public int tierRevenue(int[] hours, int rate) {
        long total = 0;
        for (int h : hours) {
            int base = Math.min(h, 3);
            int extra = Math.max(0, h - 3);
            total += (long) base * rate + (long) extra * rate * 2;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int tierRevenue(vector<int>& hours, int rate) {
        long long total = 0;
        for (int h : hours) {
            int base = min(h, 3);
            int extra = max(0, h - 3);
            total += (long long)base * rate + (long long)extra * rate * 2;
        }
        return (int)total;
    }
};`,
  },

  // circularMax(nums: List[int], k: int) -> List[int]
  // Sliding-window maximum over the circular extension; monotonic deque of indices.
  'pghub-b38-ring-buffer-max': {
    javascript: `var circularMax = function(nums, k) {
    const n = nums.length;
    const ext = nums.concat(nums.slice(0, k - 1));
    const dq = [];
    const res = new Array(n).fill(0);
    for (let i = 0; i < ext.length; i++) {
        const v = ext[i];
        while (dq.length && ext[dq[dq.length - 1]] <= v) dq.pop();
        dq.push(i);
        const start = i - k + 1;
        if (dq[0] < start) dq.shift();
        if (start >= 0 && start < n) res[start] = ext[dq[0]];
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] circularMax(int[] nums, int k) {
        int n = nums.length;
        int[] ext = new int[n + k - 1];
        for (int i = 0; i < n; i++) ext[i] = nums[i];
        for (int i = 0; i < k - 1; i++) ext[n + i] = nums[i];
        Deque<Integer> dq = new ArrayDeque<>();
        int[] res = new int[n];
        for (int i = 0; i < ext.length; i++) {
            int v = ext[i];
            while (!dq.isEmpty() && ext[dq.peekLast()] <= v) dq.pollLast();
            dq.addLast(i);
            int start = i - k + 1;
            if (dq.peekFirst() < start) dq.pollFirst();
            if (start >= 0 && start < n) res[start] = ext[dq.peekFirst()];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> circularMax(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> ext = nums;
        for (int i = 0; i < k - 1; i++) ext.push_back(nums[i]);
        deque<int> dq;
        vector<int> res(n, 0);
        for (int i = 0; i < (int)ext.size(); i++) {
            int v = ext[i];
            while (!dq.empty() && ext[dq.back()] <= v) dq.pop_back();
            dq.push_back(i);
            int start = i - k + 1;
            if (dq.front() < start) dq.pop_front();
            if (start >= 0 && start < n) res[start] = ext[dq.front()];
        }
        return res;
    }
};`,
  },

  // borderSum(grid: List[List[int]]) -> int  — sum of cells on the grid border.
  'pghub-b38-spiral-sum': {
    javascript: `var borderSum = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let total = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) total += grid[r][c];
        }
    }
    return total;
};`,
    java: `class Solution {
    public int borderSum(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        long total = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 || r == rows - 1 || c == 0 || c == cols - 1) total += grid[r][c];
            }
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int borderSum(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        long long total = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 || r == rows - 1 || c == 0 || c == cols - 1) total += grid[r][c];
            }
        }
        return (int)total;
    }
};`,
  },

  // maxTradeProfit(prices: List[int]) -> int  — best time to buy/sell with cooldown DP.
  'pghub-b38-stock-cooldown': {
    javascript: `var maxTradeProfit = function(prices) {
    if (!prices.length) return 0;
    let hold = -Infinity, sold = -Infinity, rest = 0;
    for (const p of prices) {
        const prevSold = sold;
        sold = hold + p;
        hold = Math.max(hold, rest - p);
        rest = Math.max(rest, prevSold);
    }
    return Math.max(rest, sold);
};`,
    java: `class Solution {
    public int maxTradeProfit(int[] prices) {
        if (prices.length == 0) return 0;
        final int NEG = Integer.MIN_VALUE / 2;
        int hold = NEG, sold = NEG, rest = 0;
        for (int p : prices) {
            int prevSold = sold;
            sold = hold + p;
            hold = Math.max(hold, rest - p);
            rest = Math.max(rest, prevSold);
        }
        return Math.max(rest, sold);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTradeProfit(vector<int>& prices) {
        if (prices.empty()) return 0;
        const int NEG = INT_MIN / 2;
        int hold = NEG, sold = NEG, rest = 0;
        for (int p : prices) {
            int prevSold = sold;
            sold = hold + p;
            hold = max(hold, rest - p);
            rest = max(rest, prevSold);
        }
        return max(rest, sold);
    }
};`,
  },

  // allowedRequests(times: List[int], window: int, limit: int) -> int
  // Half-open window: drop timestamps <= t - window, accept up to `limit` per window.
  'pghub-b38-token-bucket': {
    javascript: `var allowedRequests = function(times, window, limit) {
    const accepted = [];
    let head = 0, count = 0;
    for (const t of times) {
        while (head < accepted.length && accepted[head] <= t - window) head++;
        if (accepted.length - head < limit) { accepted.push(t); count++; }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int allowedRequests(int[] times, int window, int limit) {
        Deque<Integer> accepted = new ArrayDeque<>();
        int count = 0;
        for (int t : times) {
            while (!accepted.isEmpty() && accepted.peekFirst() <= t - window) accepted.pollFirst();
            if (accepted.size() < limit) { accepted.addLast(t); count++; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int allowedRequests(vector<int>& times, int window, int limit) {
        deque<int> accepted;
        int count = 0;
        for (int t : times) {
            while (!accepted.empty() && accepted.front() <= t - window) accepted.pop_front();
            if ((int)accepted.size() < limit) { accepted.push_back(t); count++; }
        }
        return count;
    }
};`,
  },

  // compareVersions(a: str, b: str) -> int  — dotted version compare, -1/0/1.
  'pghub-b38-version-compare': {
    javascript: `var compareVersions = function(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
        const x = i < pa.length ? pa[i] : 0;
        const y = i < pb.length ? pb[i] : 0;
        if (x < y) return -1;
        if (x > y) return 1;
    }
    return 0;
};`,
    java: `class Solution {
    public int compareVersions(String a, String b) {
        String[] pa = a.split("\\\\.");
        String[] pb = b.split("\\\\.");
        int n = Math.max(pa.length, pb.length);
        for (int i = 0; i < n; i++) {
            int x = i < pa.length ? Integer.parseInt(pa[i]) : 0;
            int y = i < pb.length ? Integer.parseInt(pb[i]) : 0;
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compareVersions(string a, string b) {
        auto parse = [](const string& s) {
            vector<int> out;
            stringstream ss(s);
            string part;
            while (getline(ss, part, '.')) out.push_back(stoi(part));
            return out;
        };
        vector<int> pa = parse(a), pb = parse(b);
        int n = max(pa.size(), pb.size());
        for (int i = 0; i < n; i++) {
            int x = i < (int)pa.size() ? pa[i] : 0;
            int y = i < (int)pb.size() ? pb[i] : 0;
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 0;
    }
};`,
  },

  // minFuel(cost: List[List[int]]) -> int  — min-path-sum DP (right/down moves).
  'pghub-b38-warehouse-robot': {
    javascript: `var minFuel = function(cost) {
    const rows = cost.length, cols = cost[0].length;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let best;
            if (r === 0 && c === 0) best = 0;
            else if (r === 0) best = dp[r][c - 1];
            else if (c === 0) best = dp[r - 1][c];
            else best = Math.min(dp[r - 1][c], dp[r][c - 1]);
            dp[r][c] = best + cost[r][c];
        }
    }
    return dp[rows - 1][cols - 1];
};`,
    java: `class Solution {
    public int minFuel(int[][] cost) {
        int rows = cost.length, cols = cost[0].length;
        int[][] dp = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int best;
                if (r == 0 && c == 0) best = 0;
                else if (r == 0) best = dp[r][c - 1];
                else if (c == 0) best = dp[r - 1][c];
                else best = Math.min(dp[r - 1][c], dp[r][c - 1]);
                dp[r][c] = best + cost[r][c];
            }
        }
        return dp[rows - 1][cols - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFuel(vector<vector<int>>& cost) {
        int rows = cost.size(), cols = cost[0].size();
        vector<vector<int>> dp(rows, vector<int>(cols, 0));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int best;
                if (r == 0 && c == 0) best = 0;
                else if (r == 0) best = dp[r][c - 1];
                else if (c == 0) best = dp[r - 1][c];
                else best = min(dp[r - 1][c], dp[r][c - 1]);
                dp[r][c] = best + cost[r][c];
            }
        }
        return dp[rows - 1][cols - 1];
    }
};`,
  },

  // isBalanced(s: str) -> bool  — bracket matching with a stack.
  'pghub-b40-bracket-pairs': {
    javascript: `var isBalanced = function(s) {
    const pairs = {')': '(', ']': '[', '}': '{'};
    const stack = [];
    for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else {
            if (!stack.length || stack[stack.length - 1] !== pairs[ch]) return false;
            stack.pop();
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
                if (stack.isEmpty() || stack.peek() != pairs.get(ch)) return false;
                stack.pop();
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

  // shortestRoute(n: int, roads: List[List[int]], src: int, dst: int) -> int
  // Dijkstra (undirected). JS heap is hand-rolled as a binary min-heap.
  'pghub-b40-courier-routes': {
    javascript: `var shortestRoute = function(n, roads, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of roads) { adj[u].push([v, w]); adj[v].push([u, w]); }
    const dist = new Array(n).fill(Infinity);
    dist[src] = 0;
    // binary min-heap of [dist, node]
    const heap = [[0, src]];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const len = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && heap[l][0] < heap[s][0]) s = l;
            if (r < len && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    while (heap.length) {
        const [d, u] = pop();
        if (d > dist[u]) continue;
        if (u === dst) return d;
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; push([nd, v]); }
        }
    }
    return dist[dst] !== Infinity ? dist[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int shortestRoute(int n, int[][] roads, int src, int dst) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) { adj[r[0]].add(new int[]{r[1], r[2]}); adj[r[1]].add(new int[]{r[0], r[2]}); }
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0]; int u = (int) cur[1];
            if (d > dist[u]) continue;
            if (u == dst) return (int) d;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
            }
        }
        return dist[dst] != Long.MAX_VALUE ? (int) dist[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) { adj[r[0]].push_back({r[1], r[2]}); adj[r[1]].push_back({r[0], r[2]}); }
        vector<long long> dist(n, LLONG_MAX);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dst) return (int)d;
            for (auto& e : adj[u]) {
                long long nd = d + e.second;
                if (nd < dist[e.first]) { dist[e.first] = nd; pq.push({nd, e.first}); }
            }
        }
        return dist[dst] != LLONG_MAX ? (int)dist[dst] : -1;
    }
};`,
  },

  // complement(strand: str) -> str  — reverse-complement of a DNA strand.
  'pghub-b40-dna-complement': {
    javascript: `var complement = function(strand) {
    const pair = {A: 'T', T: 'A', C: 'G', G: 'C'};
    let res = '';
    for (let i = strand.length - 1; i >= 0; i--) res += pair[strand[i]];
    return res;
};`,
    java: `class Solution {
    public String complement(String strand) {
        StringBuilder sb = new StringBuilder();
        for (int i = strand.length() - 1; i >= 0; i--) {
            char ch = strand.charAt(i);
            char p = ch == 'A' ? 'T' : ch == 'T' ? 'A' : ch == 'C' ? 'G' : 'C';
            sb.append(p);
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string complement(string strand) {
        string res;
        for (int i = (int)strand.size() - 1; i >= 0; i--) {
            char ch = strand[i];
            char p = ch == 'A' ? 'T' : ch == 'T' ? 'A' : ch == 'C' ? 'G' : 'C';
            res += p;
        }
        return res;
    }
};`,
  },

  // energyUsed(floors: List[int]) -> int  — sum of absolute consecutive differences.
  'pghub-b40-elevator-stops': {
    javascript: `var energyUsed = function(floors) {
    let total = 0;
    for (let i = 1; i < floors.length; i++) total += Math.abs(floors[i] - floors[i - 1]);
    return total;
};`,
    java: `class Solution {
    public int energyUsed(int[] floors) {
        long total = 0;
        for (int i = 1; i < floors.length; i++) total += Math.abs(floors[i] - floors[i - 1]);
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int energyUsed(vector<int>& floors) {
        long long total = 0;
        for (int i = 1; i < (int)floors.size(); i++) total += abs(floors[i] - floors[i - 1]);
        return (int)total;
    }
};`,
  },

  // keyPresses(word: str) -> int  — presses per letter on a 3-per-key phone keypad.
  'pghub-b40-keypad-letters': {
    javascript: `var keyPresses = function(word) {
    let total = 0;
    for (const ch of word) total += (ch.charCodeAt(0) - 97) % 3 + 1;
    return total;
};`,
    java: `class Solution {
    public int keyPresses(String word) {
        int total = 0;
        for (int i = 0; i < word.length(); i++) total += (word.charAt(i) - 'a') % 3 + 1;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int keyPresses(string word) {
        int total = 0;
        for (char ch : word) total += (ch - 'a') % 3 + 1;
        return total;
    }
};`,
  },

  // maxConcurrent(meetings: List[List[int]]) -> int  — sweep-line peak overlap.
  // Sort events by (time, delta); end (-1) sorts before start (+1) at equal time.
  'pghub-b40-meeting-rooms-peak': {
    javascript: `var maxConcurrent = function(meetings) {
    const events = [];
    for (const [s, e] of meetings) { events.push([s, 1]); events.push([e, -1]); }
    events.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    let cur = 0, best = 0;
    for (const [, delta] of events) {
        cur += delta;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxConcurrent(int[][] meetings) {
        int[][] events = new int[meetings.length * 2][2];
        int idx = 0;
        for (int[] m : meetings) {
            events[idx++] = new int[]{m[0], 1};
            events[idx++] = new int[]{m[1], -1};
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int cur = 0, best = 0;
        for (int[] e : events) {
            cur += e[1];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxConcurrent(vector<vector<int>>& meetings) {
        vector<pair<int,int>> events;
        for (auto& m : meetings) { events.push_back({m[0], 1}); events.push_back({m[1], -1}); }
        sort(events.begin(), events.end());
        int cur = 0, best = 0;
        for (auto& e : events) {
            cur += e.second;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // longestRun(fence: str, k: int) -> int  — longest window with <= k repaints
  // (window length minus most-frequent char count must stay <= k).
  'pghub-b40-paint-fence-runs': {
    javascript: `var longestRun = function(fence, k) {
    const counts = {};
    let left = 0, best = 0, maxFreq = 0;
    for (let right = 0; right < fence.length; right++) {
        const ch = fence[right];
        counts[ch] = (counts[ch] || 0) + 1;
        maxFreq = Math.max(maxFreq, counts[ch]);
        while ((right - left + 1) - maxFreq > k) {
            counts[fence[left]]--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestRun(String fence, int k) {
        Map<Character, Integer> counts = new HashMap<>();
        int left = 0, best = 0, maxFreq = 0;
        for (int right = 0; right < fence.length(); right++) {
            char ch = fence.charAt(right);
            counts.merge(ch, 1, Integer::sum);
            maxFreq = Math.max(maxFreq, counts.get(ch));
            while ((right - left + 1) - maxFreq > k) {
                char lc = fence.charAt(left);
                counts.put(lc, counts.get(lc) - 1);
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
    int longestRun(string fence, int k) {
        unordered_map<char,int> counts;
        int left = 0, best = 0, maxFreq = 0;
        for (int right = 0; right < (int)fence.size(); right++) {
            char ch = fence[right];
            counts[ch]++;
            maxFreq = max(maxFreq, counts[ch]);
            while ((right - left + 1) - maxFreq > k) {
                counts[fence[left]]--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // roundedTotal(cents: List[int]) -> int  — round sum to nearest multiple of 5.
  'pghub-b40-receipt-rounding': {
    javascript: `var roundedTotal = function(cents) {
    let total = 0;
    for (const c of cents) total += c;
    const rem = total % 5;
    if (rem === 0) return total;
    if (rem <= 2) return total - rem;
    return total + (5 - rem);
};`,
    java: `class Solution {
    public int roundedTotal(int[] cents) {
        long total = 0;
        for (int c : cents) total += c;
        long rem = total % 5;
        if (rem == 0) return (int) total;
        if (rem <= 2) return (int) (total - rem);
        return (int) (total + (5 - rem));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int roundedTotal(vector<int>& cents) {
        long long total = 0;
        for (int c : cents) total += c;
        long long rem = total % 5;
        if (rem == 0) return (int)total;
        if (rem <= 2) return (int)(total - rem);
        return (int)(total + (5 - rem));
    }
};`,
  },

  // rotateDeck(cards: List[int], k: int) -> List[int]  — left rotation by k.
  'pghub-b40-rotate-deck': {
    javascript: `var rotateDeck = function(cards, k) {
    const n = cards.length;
    k %= n;
    return cards.slice(k).concat(cards.slice(0, k));
};`,
    java: `class Solution {
    public int[] rotateDeck(int[] cards, int k) {
        int n = cards.length;
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[i] = cards[(i + k) % n];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateDeck(vector<int>& cards, int k) {
        int n = cards.size();
        k %= n;
        vector<int> res;
        for (int i = k; i < n; i++) res.push_back(cards[i]);
        for (int i = 0; i < k; i++) res.push_back(cards[i]);
        return res;
    }
};`,
  },

  // firstWeakDay(start: int, threshold: int) -> int  — days of halving until below threshold.
  'pghub-b40-signal-decay': {
    javascript: `var firstWeakDay = function(start, threshold) {
    let day = 0, s = start;
    while (s >= threshold) { s = Math.floor(s / 2); day++; }
    return day;
};`,
    java: `class Solution {
    public int firstWeakDay(int start, int threshold) {
        int day = 0, s = start;
        while (s >= threshold) { s /= 2; day++; }
        return day;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstWeakDay(int start, int threshold) {
        int day = 0, s = start;
        while (s >= threshold) { s /= 2; day++; }
        return day;
    }
};`,
  },

  // minCost(cost: List[int], maxStep: int) -> int  — min toll to climb, jumps up to
  // maxStep; monotonic deque keeps the cheapest reachable previous step.
  'pghub-b40-stair-tickets': {
    javascript: `var minCost = function(cost, maxStep) {
    const n = cost.length;
    const INF = Infinity;
    const dp = new Array(n).fill(INF);
    const dq = []; // indices, dp increasing
    for (let i = 0; i < n; i++) {
        const ground = i < maxStep ? 0 : INF;
        const bestPrev = dq.length ? dp[dq[0]] : INF;
        dp[i] = cost[i] + Math.min(ground, bestPrev);
        while (dq.length && dp[dq[dq.length - 1]] >= dp[i]) dq.pop();
        dq.push(i);
        if (dq[0] <= i - maxStep) dq.shift();
    }
    let ans = n <= maxStep ? 0 : INF;
    for (let i = Math.max(0, n - maxStep); i < n; i++) ans = Math.min(ans, dp[i]);
    return ans;
};`,
    java: `import java.util.*;
class Solution {
    public int minCost(int[] cost, int maxStep) {
        int n = cost.length;
        final long INF = Long.MAX_VALUE / 4;
        long[] dp = new long[n];
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            long ground = i < maxStep ? 0 : INF;
            long bestPrev = dq.isEmpty() ? INF : dp[dq.peekFirst()];
            dp[i] = cost[i] + Math.min(ground, bestPrev);
            while (!dq.isEmpty() && dp[dq.peekLast()] >= dp[i]) dq.pollLast();
            dq.addLast(i);
            if (dq.peekFirst() <= i - maxStep) dq.pollFirst();
        }
        long ans = n <= maxStep ? 0 : INF;
        for (int i = Math.max(0, n - maxStep); i < n; i++) ans = Math.min(ans, dp[i]);
        return (int) ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<int>& cost, int maxStep) {
        int n = cost.size();
        const long long INF = LLONG_MAX / 4;
        vector<long long> dp(n, INF);
        deque<int> dq;
        for (int i = 0; i < n; i++) {
            long long ground = i < maxStep ? 0 : INF;
            long long bestPrev = dq.empty() ? INF : dp[dq.front()];
            dp[i] = cost[i] + min(ground, bestPrev);
            while (!dq.empty() && dp[dq.back()] >= dp[i]) dq.pop_back();
            dq.push_back(i);
            if (dq.front() <= i - maxStep) dq.pop_front();
        }
        long long ans = n <= maxStep ? 0 : INF;
        for (int i = max(0, n - maxStep); i < n; i++) ans = min(ans, dp[i]);
        return (int)ans;
    }
};`,
  },
};
