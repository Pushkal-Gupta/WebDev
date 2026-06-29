// C++ translations of verified Python canonicals — slice [0, 53) of cpp-gap-targets.json.
// cpp only. Signatures match generateTemplate(language, method_name, params, return_type):
// containers (vector<...>/string) by &, primitives by value.
export default {
  // bulbSwitch(int input) -> int  — floor(sqrt(input)).
  'bulb-switcher': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bulbSwitch(int input) {
        return (int)sqrtl((long double)input);
    }
};`,
  },

  // combinationSum4(nums: List[int], target: int) -> int  — order-counting DP. long long guards overflow of count.
  'combination-sum-iv': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        vector<unsigned long long> dp(target + 1, 0);
        dp[0] = 1;
        for (int t = 1; t <= target; t++)
            for (int x : nums)
                if (x <= t) dp[t] += dp[t - x];
        return (int)dp[target];
    }
};`,
  },

  // networkDelayTime(times: List[List[int]], n: int, k: int) -> int  — Dijkstra.
  'network-delay-time': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        const long long INF = LLONG_MAX / 4;
        vector<vector<pair<int,int>>> graph(n + 1);
        for (auto& e : times) graph[e[0]].push_back({e[1], e[2]});
        vector<long long> dist(n + 1, INF);
        dist[k] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, k});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : graph[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    pq.push({dist[v], v});
                }
            }
        }
        long long ans = 0;
        for (int i = 1; i <= n; i++) ans = max(ans, dist[i]);
        return ans >= INF ? -1 : (int)ans;
    }
};`,
  },

  // numIslands(grid: List[List[str]]) -> int  — DFS flood fill on "1".
  'number-of-islands': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<string>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        function<void(int,int)> dfs = [&](int r, int c) {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != "1") return;
            grid[r][c] = "0";
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
        };
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == "1") { count++; dfs(r, c); }
        return count;
    }
};`,
  },

  // shortestEscape(maze: List[List[int]]) -> int  — BFS shortest path 0-cells.
  'pghub-b12-maze-escape': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestEscape(vector<vector<int>>& maze) {
        int rows = maze.size(), cols = maze[0].size();
        if (maze[0][0] == 1 || maze[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        seen[0][0] = true;
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && maze[nr][nc] == 0) {
                    if (nr == rows-1 && nc == cols-1) return d + 1;
                    seen[nr][nc] = true;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // distinctPrimeFactors(n: int) -> int  — trial division.
  'pghub-b12-prime-gear': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctPrimeFactors(int n) {
        int count = 0;
        long long d = 2, m = n;
        while (d * d <= m) {
            if (m % d == 0) {
                count++;
                while (m % d == 0) m /= d;
            }
            d++;
        }
        if (m > 1) count++;
        return count;
    }
};`,
  },

  // largestColony(grid: List[List[int]]) -> int  — iterative DFS, largest connected component of 1s.
  'pghub-b12-spore-spread': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestColony(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), best = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] != 1) continue;
                int size = 0;
                vector<pair<int,int>> stack = {{sr, sc}};
                grid[sr][sc] = 0;
                while (!stack.empty()) {
                    auto [r, c] = stack.back(); stack.pop_back();
                    size++;
                    for (int k = 0; k < 4; k++) {
                        int nr = r + dr[k], nc = c + dc[k];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                            grid[nr][nc] = 0;
                            stack.push_back({nr, nc});
                        }
                    }
                }
                best = max(best, size);
            }
        }
        return best;
    }
};`,
  },

  // minSeatGap(groups: List[int], rooms: int) -> int  — min-heap load balancing, max-min spread.
  'pghub-b13-festival-seats': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSeatGap(vector<int>& groups, int rooms) {
        priority_queue<long long, vector<long long>, greater<>> heap;
        for (int i = 0; i < rooms; i++) heap.push(0);
        for (int g : groups) {
            long long smallest = heap.top(); heap.pop();
            heap.push(smallest + g);
        }
        long long mx = LLONG_MIN, mn = LLONG_MAX;
        while (!heap.empty()) {
            long long v = heap.top(); heap.pop();
            mx = max(mx, v); mn = min(mn, v);
        }
        return (int)(mx - mn);
    }
};`,
  },

  // countSetAfter(value: int, toggles: List[int]) -> int  — xor bit toggles, popcount.
  'pghub-b13-flag-masks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSetAfter(int value, vector<int>& toggles) {
        long long v = value;
        for (int b : toggles) v ^= (1LL << b);
        return __builtin_popcountll((unsigned long long)v);
    }
};`,
  },

  // typingCost(word: str) -> int  — keypad press cost.
  'pghub-b13-keypad-words': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int typingCost(string& word) {
        vector<string> groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        unordered_map<char,int> cost;
        for (auto& g : groups)
            for (int i = 0; i < (int)g.size(); i++) cost[g[i]] = i + 1;
        int total = 0;
        for (char c : word) total += cost[c];
        return total;
    }
};`,
  },

  // minToll(grid: List[List[int]]) -> int  — min-cost path DP (down/right).
  'pghub-b13-lattice-paths': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minToll(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<long long>> dp(rows, vector<long long>(cols, 0));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                long long best = grid[r][c];
                if (r == 0 && c == 0) dp[r][c] = best;
                else if (r == 0) dp[r][c] = best + dp[r][c-1];
                else if (c == 0) dp[r][c] = best + dp[r-1][c];
                else dp[r][c] = best + min(dp[r-1][c], dp[r][c-1]);
            }
        }
        return (int)dp[rows-1][cols-1];
    }
};`,
  },

  // longestRise(notes: List[int]) -> int  — longest strictly increasing run.
  'pghub-b13-melody-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRise(vector<int>& notes) {
        int best = 1, cur = 1;
        for (int i = 1; i < (int)notes.size(); i++) {
            if (notes[i] > notes[i-1]) { cur++; if (cur > best) best = cur; }
            else cur = 1;
        }
        return best;
    }
};`,
  },

  // totalHarvested(spans: List[List[int]]) -> int  — merge intervals (touching), total covered length.
  'pghub-b13-orchard-spans': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalHarvested(vector<vector<int>>& spans) {
        sort(spans.begin(), spans.end());
        long long total = 0;
        long long cur_start = spans[0][0], cur_end = spans[0][1];
        for (size_t i = 1; i < spans.size(); i++) {
            long long s = spans[i][0], e = spans[i][1];
            if (s <= cur_end + 1) cur_end = max(cur_end, e);
            else { total += cur_end - cur_start + 1; cur_start = s; cur_end = e; }
        }
        total += cur_end - cur_start + 1;
        return (int)total;
    }
};`,
  },

  // countPrimes(lengths: List[int]) -> int  — count primes via trial division.
  'pghub-b13-prime-fence': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimes(vector<int>& lengths) {
        auto isPrime = [](long long x) {
            if (x < 2) return false;
            if (x < 4) return true;
            if (x % 2 == 0) return false;
            for (long long d = 3; d * d <= x; d += 2)
                if (x % d == 0) return false;
            return true;
        };
        int count = 0;
        for (int x : lengths) if (isPrime(x)) count++;
        return count;
    }
};`,
  },

  // strongestWindow(signal: List[int], k: int) -> int  — max window sum.
  'pghub-b13-signal-decay': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int strongestWindow(vector<int>& signal, int k) {
        int n = signal.size();
        if (k >= n) {
            long long s = 0;
            for (int x : signal) s += x;
            return (int)s;
        }
        long long cur = 0;
        for (int i = 0; i < k; i++) cur += signal[i];
        long long best = cur;
        for (int i = k; i < n; i++) {
            cur += signal[i] - signal[i - k];
            if (cur > best) best = cur;
        }
        return (int)best;
    }
};`,
  },

  // totalEnergy(s: str) -> int  — nested-bracket weight, [..] doubles inner sum.
  'pghub-b13-spell-energy': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalEnergy(string& s) {
        vector<long long> stack = {0};
        int i = 0, n = s.size();
        while (i < n) {
            char ch = s[i];
            if (ch == '[') { stack.push_back(0); i++; }
            else if (ch == ']') {
                long long inner = stack.back(); stack.pop_back();
                stack.back() += 2 * inner;
                i++;
            } else {
                int j = i;
                while (j < n && isdigit((unsigned char)s[j])) j++;
                stack.back() += stoll(s.substr(i, j - i));
                i = j;
            }
        }
        return (int)stack[0];
    }
};`,
  },

  // maxBridges(left: List[int], right: List[int], gap: int) -> int  — two-pointer pairing.
  'pghub-b13-token-bridge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxBridges(vector<int>& left, vector<int>& right, int gap) {
        int i = 0, j = 0, count = 0;
        while (i < (int)left.size() && j < (int)right.size()) {
            if (abs((long long)left[i] - right[j]) <= gap) { count++; i++; j++; }
            else if (left[i] < right[j]) i++;
            else j++;
        }
        return count;
    }
};`,
  },

  // allCodes(digits: List[int], length: int) -> List[List[int]]  — start-index combinations.
  'pghub-b13-vault-codes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> allCodes(vector<int>& digits, int length) {
        vector<vector<int>> res;
        vector<int> combo;
        function<void(int)> backtrack = [&](int start) {
            if ((int)combo.size() == length) { res.push_back(combo); return; }
            for (int i = start; i < (int)digits.size(); i++) {
                combo.push_back(digits[i]);
                backtrack(i + 1);
                combo.pop_back();
            }
        };
        backtrack(0);
        return res;
    }
};`,
  },

  // restockCount(stock: List[int], threshold: int) -> int  — count below threshold.
  'pghub-b13-warehouse-aisles': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockCount(vector<int>& stock, int threshold) {
        int count = 0;
        for (int s : stock) if (s < threshold) count++;
        return count;
    }
};`,
  },

  // maxStacks(coins: int) -> int  — max k with k(k+1)/2 <= coins (binary search).
  'pghub-b14-coin-tower': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxStacks(int coins) {
        long long lo = 0, hi = coins;
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            if (mid * (mid + 1) / 2 <= coins) lo = mid;
            else hi = mid - 1;
        }
        return (int)lo;
    }
};`,
  },

  // cheapestReach(n: int, roads: List[List[int]], start: int) -> List[int]  — Dijkstra, -1 if unreachable.
  'pghub-b14-festival-routes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> cheapestReach(int n, vector<vector<int>>& roads, int start) {
        const long long INF = LLONG_MAX / 4;
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        vector<long long> dist(n, INF);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, start});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[i] = (dist[i] >= INF) ? -1 : (int)dist[i];
        return res;
    }
};`,
  },

  // finalText(keys: str) -> str  — backspace stack.
  'pghub-b14-keystroke-undo': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string finalText(string& keys) {
        string out;
        for (char ch : keys) {
            if (ch == '#') { if (!out.empty()) out.pop_back(); }
            else out.push_back(ch);
        }
        return out;
    }
};`,
  },

  // minTransfers(balances: List[int]) -> int  — bitmask DP, max zero-sum groups.
  'pghub-b14-ledger-rebalance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTransfers(vector<int>& balances) {
        vector<int> debts;
        for (int b : balances) if (b != 0) debts.push_back(b);
        int n = debts.size();
        int full = (1 << n) - 1;
        vector<long long> subset_sum(1 << n, 0);
        for (int mask = 1; mask < (1 << n); mask++) {
            int low = mask & (-mask);
            int i = __builtin_ctz(low);
            subset_sum[mask] = subset_sum[mask ^ low] + debts[i];
        }
        vector<int> memo(1 << n, -2);
        function<int(int)> maxZeroGroups = [&](int mask) -> int {
            if (mask == 0) return 0;
            if (memo[mask] != -2) return memo[mask];
            int low = mask & (-mask);
            int rest = mask ^ low;
            int best = -1;
            int sub = mask;
            while (sub) {
                if ((sub & low) && subset_sum[sub] == 0)
                    best = max(best, 1 + maxZeroGroups(mask ^ sub));
                sub = (sub - 1) & mask;
            }
            if (best == -1) best = maxZeroGroups(rest);
            memo[mask] = best;
            return best;
        };
        int groups = maxZeroGroups(full);
        return n - groups;
    }
};`,
  },

  // longestStable(signal: List[int], drift: int) -> int  — longest window with max-min <= drift (monotonic deques).
  'pghub-b14-signal-decay': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestStable(vector<int>& signal, int drift) {
        deque<int> maxq, minq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)signal.size(); right++) {
            int v = signal[right];
            while (!maxq.empty() && signal[maxq.back()] <= v) maxq.pop_back();
            maxq.push_back(right);
            while (!minq.empty() && signal[minq.back()] >= v) minq.pop_back();
            minq.push_back(right);
            while (signal[maxq.front()] - signal[minq.front()] > drift) {
                left++;
                if (maxq.front() < left) maxq.pop_front();
                if (minq.front() < left) minq.pop_front();
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // trappedWater(walls: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b14-tidal-pools': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& walls) {
        int left = 0, right = (int)walls.size() - 1;
        int left_max = 0, right_max = 0;
        long long total = 0;
        while (left < right) {
            if (walls[left] < walls[right]) {
                left_max = max(left_max, walls[left]);
                total += left_max - walls[left];
                left++;
            } else {
                right_max = max(right_max, walls[right]);
                total += right_max - walls[right];
                right--;
            }
        }
        return (int)total;
    }
};`,
  },

  // flipsToEven(masks: List[int]) -> int  — count masks with odd popcount.
  'pghub-b15-bit-parity-grid': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int flipsToEven(vector<int>& masks) {
        int total = 0;
        for (int m : masks) total += __builtin_popcount((unsigned int)m) & 1;
        return total;
    }
};`,
  },

  // countWays(tokens: List[int], target: int) -> int  — unbounded combination count (order-insensitive).
  'pghub-b15-coin-change-ways': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& tokens, int target) {
        vector<unsigned long long> dp(target + 1, 0);
        dp[0] = 1;
        for (int t : tokens)
            for (int amt = t; amt <= target; amt++)
                dp[amt] += dp[amt - t];
        return (int)dp[target];
    }
};`,
  },

  // maxPairs(weights: List[int], limit: int) -> int  — greedy two-pointer bag count.
  'pghub-b15-courier-zones': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPairs(vector<int>& weights, int limit) {
        sort(weights.begin(), weights.end());
        int lo = 0, hi = (int)weights.size() - 1, bags = 0;
        while (lo <= hi) {
            if (lo < hi && weights[lo] + weights[hi] <= limit) lo++;
            hi--;
            bags++;
        }
        return bags;
    }
};`,
  },

  // peakIndex(heights: List[int]) -> int  — binary search for peak.
  'pghub-b15-elevation-search': {
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

  // shoreline(grid: List[List[int]]) -> int  — island perimeter.
  'pghub-b15-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shoreline(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), per = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    per += 4;
                    if (r > 0 && grid[r-1][c] == 1) per -= 2;
                    if (c > 0 && grid[r][c-1] == 1) per -= 2;
                }
            }
        }
        return per;
    }
};`,
  },

  // mergeBookings(bookings: List[List[int]]) -> List[List[int]]  — sort + merge overlapping.
  'pghub-b15-meeting-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeBookings(vector<vector<int>>& bookings) {
        sort(bookings.begin(), bookings.end());
        vector<vector<int>> merged;
        for (auto& bk : bookings) {
            int s = bk[0], e = bk[1];
            if (!merged.empty() && s <= merged.back()[1])
                merged.back()[1] = max(merged.back()[1], e);
            else
                merged.push_back({s, e});
        }
        return merged;
    }
};`,
  },

  // buildMirror(s: str) -> str  — s + reverse(s without last char).
  'pghub-b15-palindrome-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string buildMirror(string& s) {
        string res = s;
        if (s.size() >= 1) {
            for (int i = (int)s.size() - 2; i >= 0; i--) res.push_back(s[i]);
        }
        return res;
    }
};`,
  },

  // canReach(n: int, links: List[List[int]], src: int, dst: int) -> bool  — BFS reachability.
  'pghub-b15-relay-chain': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReach(int n, vector<vector<int>>& links, int src, int dst) {
        unordered_map<int, vector<int>> adj;
        for (auto& l : links) adj[l[0]].push_back(l[1]);
        unordered_set<int> seen = {src};
        queue<int> dq;
        dq.push(src);
        while (!dq.empty()) {
            int u = dq.front(); dq.pop();
            if (u == dst) return true;
            for (int v : adj[u]) {
                if (!seen.count(v)) { seen.insert(v); dq.push(v); }
            }
        }
        return seen.count(dst) > 0;
    }
};`,
  },

  // spiralRead(matrix: List[List[int]]) -> List[int]  — boundary-shrink spiral.
  'pghub-b15-spiral-readout': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> spiralRead(vector<vector<int>>& matrix) {
        vector<int> res;
        if (matrix.empty() || matrix[0].empty()) return res;
        int top = 0, bottom = (int)matrix.size() - 1, left = 0, right = (int)matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.push_back(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.push_back(matrix[r][right]);
            right--;
            if (top <= bottom) { for (int c = right; c >= left; c--) res.push_back(matrix[bottom][c]); bottom--; }
            if (left <= right) { for (int r = bottom; r >= top; r--) res.push_back(matrix[r][left]); left++; }
        }
        return res;
    }
};`,
  },

  // longestComfort(temps: List[int], lo: int, hi: int) -> int  — longest run within [lo,hi].
  'pghub-b15-thermostat-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestComfort(vector<int>& temps, int lo, int hi) {
        int best = 0, cur = 0;
        for (int t : temps) {
            if (t >= lo && t <= hi) { cur++; best = max(best, cur); }
            else cur = 0;
        }
        return best;
    }
};`,
  },

  // restockCount(stock: List[int], threshold: int) -> int  — count below threshold.
  'pghub-b15-warehouse-aisles': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockCount(vector<int>& stock, int threshold) {
        int count = 0;
        for (int x : stock) if (x < threshold) count++;
        return count;
    }
};`,
  },

  // subsetSums(nums: List[int]) -> List[int]  — distinct subset sums, sorted ascending.
  'pghub-b15-word-ladder-cost': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> subsetSums(vector<int>& nums) {
        set<long long> sums;
        int n = nums.size();
        function<void(int,long long)> backtrack = [&](int i, long long total) {
            if (i == n) { sums.insert(total); return; }
            backtrack(i + 1, total);
            backtrack(i + 1, total + nums[i]);
        };
        backtrack(0, 0);
        vector<int> res;
        for (long long v : sums) res.push_back((int)v);
        return res;
    }
};`,
  },

  // litLeds(minutes: int) -> int  — popcount.
  'pghub-b16-binary-clock': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int litLeds(int minutes) {
        return __builtin_popcount((unsigned int)minutes);
    }
};`,
  },

  // maxValue(costs: List[int], values: List[int], budget: int) -> int  — 0/1 knapsack.
  'pghub-b16-budget-pick': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxValue(vector<int>& costs, vector<int>& values, int budget) {
        vector<long long> dp(budget + 1, 0);
        for (int i = 0; i < (int)costs.size(); i++) {
            int c = costs[i], v = values[i];
            for (int b = budget; b >= c; b--) {
                long long cand = dp[b - c] + v;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return (int)dp[budget];
    }
};`,
  },

  // decode(text: str, shift: int) -> str  — Caesar decode (lowercase), normalize modulo.
  'pghub-b16-cipher-rotate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decode(string& text, int shift) {
        int s = ((shift % 26) + 26) % 26;
        string out;
        for (char ch : text) {
            int v = (((ch - 'a' - s) % 26) + 26) % 26;
            out.push_back((char)(v + 'a'));
        }
        return out;
    }
};`,
  },

  // maxSpan(floors: List[int]) -> int  — monotonic-stack consumed span.
  'pghub-b16-elevator-floors': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSpan(vector<int>& floors) {
        vector<pair<int,int>> stack;
        int best = 0;
        for (int f : floors) {
            int span = 1;
            while (!stack.empty() && stack.back().first <= f) {
                span += stack.back().second;
                stack.pop_back();
            }
            stack.push_back({f, span});
            if (span > best) best = span;
        }
        return best;
    }
};`,
  },

  // canInterleave(a: str, b: str, target: str) -> bool  — interleaving-string DP (rolling).
  'pghub-b16-gene-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canInterleave(string& a, string& b, string& target) {
        if (a.size() + b.size() != target.size()) return false;
        int m = a.size(), n = b.size();
        vector<char> dp(n + 1, false);
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j-1] && b[j-1] == target[j-1];
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && a[i-1] == target[i-1];
            for (int j = 1; j <= n; j++) {
                dp[j] = (dp[j] && a[i-1] == target[i+j-1]) ||
                        (dp[j-1] && b[j-1] == target[i+j-1]);
            }
        }
        return dp[n];
    }
};`,
  },

  // countIslands(grid: List[List[int]]) -> int  — iterative DFS connected components of 1s.
  'pghub-b16-island-count': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countIslands(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    count++;
                    vector<pair<int,int>> stack = {{r, c}};
                    seen[r][c] = true;
                    while (!stack.empty()) {
                        auto [cr, cc] = stack.back(); stack.pop_back();
                        for (int k = 0; k < 4; k++) {
                            int nr = cr + dr[k], nc = cc + dc[k];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
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
};
