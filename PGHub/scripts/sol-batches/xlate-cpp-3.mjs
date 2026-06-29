// C++ translations of verified Python canonicals for py-present / cpp-missing
// problems (cpp-gap-targets.json indices [106, 159)). Each cpp body is a faithful
// translation of solutions.python.code matching the EXACT generateTemplate
// signature (vectors/strings by &-ref, return type via the C++ TYPE_MAP). Graded
// against the stored test_cases by backfill-solutions.mjs; only passing langs land.

export default {
  // countWays(coins: List[int], amount: int) -> int — unbounded coin-combination DP.
  'pghub-b20-coin-rolls': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins)
            for (int v = c; v <= amount; v++)
                dp[v] += dp[v - c];
        return (int)dp[amount];
    }
};`,
  },

  // countSafeWindows(loads: List[int], k: int, cap: int) -> int — sliding-window count.
  'pghub-b20-conveyor-buffer': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSafeWindows(vector<int>& loads, int k, int cap) {
        int n = loads.size();
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

  // minChargers(sessions: List[List[int]]) -> int — sort by start, min-heap of ends.
  'pghub-b20-fleet-charge': {
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

  // minWaterings(plants: List[int], reach: int) -> int — greedy interval cover.
  'pghub-b20-garden-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minWaterings(vector<int>& plants, int reach) {
        int count = 0, i = 0, n = plants.size();
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

  // finalBalance(ops: List[str]) -> int — undo stack of applied deltas.
  'pghub-b20-ledger-rollback': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalBalance(vector<string>& ops) {
        long long balance = 0;
        vector<int> history;
        for (auto& op : ops) {
            if (op == "undo") {
                if (!history.empty()) { balance -= history.back(); history.pop_back(); }
            } else {
                int v = stoi(op);
                balance += v;
                history.push_back(v);
            }
        }
        return (int)balance;
    }
};`,
  },

  // minStepsOut(grid: List[List[int]]) -> int — BFS shortest path corner to corner.
  'pghub-b20-maze-flood': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minStepsOut(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<bool>> visited(rows, vector<bool>(cols, false));
        visited[0][0] = true;
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
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

  // totalCovered(ranges: List[List[int]]) -> int — merge inclusive ranges, sum lengths.
  'pghub-b20-palette-merge': {
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
        return (int)total;
    }
};`,
  },

  // maxSubtreeBonus(parent: List[int], bonus: List[int]) -> int — subtree sums via post-order.
  'pghub-b20-relay-tree': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSubtreeBonus(vector<int>& parent, vector<int>& bonus) {
        int n = parent.size();
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
        for (int idx = (int)order.size() - 1; idx >= 0; idx--) {
            int u = order[idx];
            subtotal[u] = bonus[u];
            for (int c : children[u]) subtotal[u] += subtotal[c];
        }
        long long best = LLONG_MIN;
        for (int i = 0; i < n; i++) best = max(best, subtotal[i]);
        return (int)best;
    }
};`,
  },

  // rotateRoster(roster: List[int], k: int) -> List[int] — right rotate by k.
  'pghub-b20-roster-rotate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRoster(vector<int>& roster, int k) {
        int n = roster.size();
        k %= n;
        if (k == 0) return roster;
        vector<int> res;
        for (int i = n - k; i < n; i++) res.push_back(roster[i]);
        for (int i = 0; i < n - k; i++) res.push_back(roster[i]);
        return res;
    }
};`,
  },

  // decodeSignal(s: str) -> str — run-length expand: digit count then repeated char.
  'pghub-b20-signal-decode': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decodeSignal(string s) {
        string out;
        int num = 0;
        for (char ch : s) {
            if (isdigit((unsigned char)ch)) {
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

  // countClimbs(n: int, maxStep: int) -> int — bounded-step climbing DP, mod 1e9+7.
  'pghub-b20-stair-paint': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countClimbs(int n, int maxStep) {
        const long long MOD = 1000000007;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        long long window = 0;
        for (int i = 1; i <= n; i++) {
            window = (window + dp[i - 1]) % MOD;
            if (i - maxStep - 1 >= 0)
                window = (window - dp[i - maxStep - 1] % MOD + MOD) % MOD;
            dp[i] = window;
        }
        return (int)(dp[n] % MOD);
    }
};`,
  },

  // countSubarrays(nums: List[int], target: int) -> int — prefix-sum counting map.
  'pghub-b20-subarray-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int target) {
        unordered_map<long long, long long> counts;
        counts[0] = 1;
        long long prefix = 0, result = 0;
        for (int x : nums) {
            prefix += x;
            auto it = counts.find(prefix - target);
            if (it != counts.end()) result += it->second;
            counts[prefix] += 1;
        }
        return (int)result;
    }
};`,
  },

  // countAfterToggle(x: int, lo: int, hi: int) -> int — popcount after XOR mask [lo,hi].
  'pghub-b20-tunnel-bits': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countAfterToggle(int x, int lo, int hi) {
        long long mask = 0;
        for (int b = lo; b <= hi; b++) mask |= (1LL << b);
        return __builtin_popcountll((unsigned long long)((long long)x ^ mask));
    }
};`,
  },

  // minCapacity(packages: List[int], days: int) -> int — binary search on capacity.
  'pghub-b20-warehouse-bsearch': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& packages, int days) {
        auto needed = [&](long long cap) {
            int d = 1;
            long long cur = 0;
            for (int w : packages) {
                if (cur + w > cap) { d++; cur = 0; }
                cur += w;
            }
            return d;
        };
        long long lo = *max_element(packages.begin(), packages.end());
        long long hi = 0;
        for (int w : packages) hi += w;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // totalWait(arrivals: List[int], service: int) -> int — single-server queue wait.
  'pghub-b21-canteen-queue': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalWait(vector<int>& arrivals, int service) {
        long long freeAt = 0, total = 0;
        for (int a : arrivals) {
            long long start = max((long long)a, freeAt);
            total += start - a;
            freeAt = start + service;
        }
        return (int)total;
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int — coin-combination DP.
  'pghub-b21-coin-combos': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int coin : coins)
            for (int total = coin; total <= amount; total++)
                dp[total] += dp[total - coin];
        return (int)dp[amount];
    }
};`,
  },

  // minRefuels(target: int, start: int, stations: List[List[int]]) -> int — greedy max-heap.
  'pghub-b21-courier-fuel': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRefuels(int target, int start, vector<vector<int>>& stations) {
        priority_queue<int> pq;
        long long fuel = start;
        int stops = 0, i = 0, n = stations.size();
        while (fuel < target) {
            while (i < n && stations[i][0] <= fuel) {
                pq.push(stations[i][1]);
                i++;
            }
            if (pq.empty()) return -1;
            fuel += pq.top(); pq.pop();
            stops++;
        }
        return stops;
    }
};`,
  },

  // minGifts(ratings: List[int]) -> int — two-pass candy distribution.
  'pghub-b21-gift-distribution': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minGifts(vector<int>& ratings) {
        int n = ratings.size();
        vector<int> gifts(n, 1);
        for (int i = 1; i < n; i++)
            if (ratings[i] > ratings[i-1]) gifts[i] = gifts[i-1] + 1;
        for (int i = n - 2; i >= 0; i--)
            if (ratings[i] > ratings[i+1]) gifts[i] = max(gifts[i], gifts[i+1] + 1);
        long long total = 0;
        for (int g : gifts) total += g;
        return (int)total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int — count exposed edges.
  'pghub-b21-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int perimeter = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r-1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perimeter -= 2;
                }
        return perimeter;
    }
};`,
  },

  // typingCost(word: str) -> int — keypad position cost per letter.
  'pghub-b21-keypad-words': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int typingCost(string word) {
        vector<string> groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        unordered_map<char, int> cost;
        for (auto& g : groups)
            for (int pos = 0; pos < (int)g.size(); pos++)
                cost[g[pos]] = pos + 1;
        int total = 0;
        for (char ch : word) total += cost[ch];
        return total;
    }
};`,
  },

  // firstZeroDay(deltas: List[int]) -> int — first prefix-sum hitting zero.
  'pghub-b21-ledger-balance': {
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

  // peakIndex(heights: List[int]) -> int — binary search for mountain peak.
  'pghub-b21-mountain-peak': {
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

  // networkDelay(n: int, edges: List[List[int]], source: int) -> int — Dijkstra, max dist.
  'pghub-b21-network-delay': {
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
        long long worst = 0;
        for (int i = 0; i < n; i++) worst = max(worst, dist[i]);
        return worst == INF ? -1 : (int)worst;
    }
};`,
  },

  // longestTwoKinds(trees: List[int]) -> int — sliding window with ≤2 distinct.
  'pghub-b21-orchard-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestTwoKinds(vector<int>& trees) {
        unordered_map<int, int> counts;
        int left = 0, best = 0;
        for (int right = 0; right < (int)trees.size(); right++) {
            counts[trees[right]]++;
            while ((int)counts.size() > 2) {
                int lt = trees[left];
                if (--counts[lt] == 0) counts.erase(lt);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // evalPostfix(tokens: List[str]) -> int — postfix stack evaluator.
  'pghub-b21-stack-machine': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalPostfix(vector<string>& tokens) {
        vector<long long> stack;
        for (auto& tok : tokens) {
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
        return (int)stack.back();
    }
};`,
  },

  // rotateRight(items: List[int], k: int) -> List[int] — right rotate by k.
  'pghub-b21-warehouse-rotate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& items, int k) {
        int n = items.size();
        k %= n;
        if (k == 0) return items;
        vector<int> res;
        for (int i = n - k; i < n; i++) res.push_back(items[i]);
        for (int i = 0; i < n - k; i++) res.push_back(items[i]);
        return res;
    }
};`,
  },

  // maxXorPair(nums: List[int]) -> int — binary trie max-XOR.
  'pghub-b21-xor-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxXorPair(vector<int>& nums) {
        if (nums.size() < 2) return 0;
        const int HIGH = 31;
        struct Node { int child[2] = {-1, -1}; };
        vector<Node> trie(1);
        auto insert = [&](long long x) {
            int node = 0;
            for (int b = HIGH; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (trie[node].child[bit] == -1) {
                    trie.push_back(Node());
                    trie[node].child[bit] = (int)trie.size() - 1;
                }
                node = trie[node].child[bit];
            }
        };
        auto query = [&](long long x) {
            int node = 0;
            long long best = 0;
            for (int b = HIGH; b >= 0; b--) {
                int bit = (x >> b) & 1;
                int want = 1 - bit;
                if (trie[node].child[want] != -1) {
                    best |= (1LL << b);
                    node = trie[node].child[want];
                } else {
                    node = trie[node].child[bit];
                }
            }
            return best;
        };
        insert(nums[0]);
        long long answer = 0;
        for (size_t i = 1; i < nums.size(); i++) {
            answer = max(answer, query(nums[i]));
            insert(nums[i]);
        }
        return (int)answer;
    }
};`,
  },

  // zigzagLevels(tree: List[int]) -> List[List[int]] — compact-tree zigzag BFS.
  'pghub-b21-zigzag-tree': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> zigzagLevels(vector<int>& tree) {
        if (tree.empty() || tree[0] == -1) return {};
        int n = tree.size();
        vector<int> leftCh(n, -1), rightCh(n, -1);
        int child = 1;
        for (int i = 0; i < n; i++) {
            if (tree[i] == -1) continue;
            if (child < n) leftCh[i] = child++;
            if (child < n) rightCh[i] = child++;
        }
        vector<vector<int>> result;
        deque<int> q;
        q.push_back(0);
        bool leftToRight = true;
        while (!q.empty()) {
            vector<int> level;
            int sz = q.size();
            for (int i = 0; i < sz; i++) {
                int node = q.front(); q.pop_front();
                level.push_back(tree[node]);
                if (leftCh[node] != -1 && tree[leftCh[node]] != -1) q.push_back(leftCh[node]);
                if (rightCh[node] != -1 && tree[rightCh[node]] != -1) q.push_back(rightCh[node]);
            }
            if (!leftToRight) reverse(level.begin(), level.end());
            result.push_back(level);
            leftToRight = !leftToRight;
        }
        return result;
    }
};`,
  },

  // litLeds(n: int) -> List[int] — set-bit count 0..n via DP.
  'pghub-b22-binary-clock': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> litLeds(int n) {
        vector<int> res(n + 1, 0);
        for (int i = 1; i <= n; i++)
            res[i] = res[i >> 1] + (i & 1);
        return res;
    }
};`,
  },

  // totalWait(service: List[int]) -> int — cumulative wait sum.
  'pghub-b22-canteen-queue': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalWait(vector<int>& service) {
        long long running = 0, total = 0;
        for (int t : service) {
            total += running;
            running += t;
        }
        return (int)total;
    }
};`,
  },

  // maxDiscount(coupons: List[int], budget: int) -> int — 0/1 knapsack value==weight.
  'pghub-b22-coupon-stack': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDiscount(vector<int>& coupons, int budget) {
        vector<int> dp(budget + 1, 0);
        for (int c : coupons)
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + c;
                if (cand > dp[b]) dp[b] = cand;
            }
        return dp[budget];
    }
};`,
  },

  // shortestRoute(n, roads: List[List[int]], src, dst) -> int — Dijkstra src→dst.
  'pghub-b22-courier-routes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) adj[r[0]].push_back({r[1], r[2]});
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dst) return (int)d;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        return dist[dst] == INF ? -1 : (int)dist[dst];
    }
};`,
  },

  // countPairs(heights: List[int], limit: int) -> int — sorted two-pointer pair count.
  'pghub-b22-festival-lanterns': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& heights, int limit) {
        vector<int> arr = heights;
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1;
        long long count = 0;
        while (i < j) {
            if (arr[i] + arr[j] <= limit) {
                count += j - i;
                i++;
            } else {
                j--;
            }
        }
        return (int)count;
    }
};`,
  },

  // minTaps(length: int, reach: List[int]) -> int — greedy jump-game interval cover.
  'pghub-b22-garden-water': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTaps(int length, vector<int>& reach) {
        vector<int> maxRight(length + 1, 0);
        for (int i = 0; i < (int)reach.size(); i++) {
            int r = reach[i];
            int lo = max(0, i - r);
            int hi = min(length, i + r);
            if (hi > maxRight[lo]) maxRight[lo] = hi;
        }
        int taps = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < length) {
            while (i <= curEnd) {
                if (maxRight[i] > farthest) farthest = maxRight[i];
                i++;
            }
            if (farthest <= curEnd) return -1;
            taps++;
            curEnd = farthest;
        }
        return taps;
    }
};`,
  },

  // maxTreasure(grid: List[List[int]]) -> int — max-path DP (right/down).
  'pghub-b22-grid-treasure': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTreasure(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        const long long NEG = LLONG_MIN / 4;
        vector<long long> dp(cols, NEG);
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else if (r == 0) dp[c] = dp[c-1] + grid[r][c];
                else if (c == 0) dp[c] = dp[c] + grid[r][c];
                else dp[c] = max(dp[c], dp[c-1]) + grid[r][c];
            }
        return (int)dp[cols-1];
    }
};`,
  },

  // openLockers(n: int) -> int — integer sqrt (perfect-square toggle count).
  'pghub-b22-locker-toggle': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLockers(int n) {
        if (n < 0) return 0;
        long long r = (long long)sqrtl((long double)n);
        while (r * r > n) r--;
        while ((r + 1) * (r + 1) <= n) r++;
        return (int)r;
    }
};`,
  },

  // maxDepth(parent: List[int]) -> int — deepest node in parent-array tree.
  'pghub-b22-museum-rooms': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(vector<int>& parent) {
        int n = parent.size();
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        int best = 0;
        vector<pair<int,int>> stack = {{root, 1}};
        while (!stack.empty()) {
            auto [node, d] = stack.back(); stack.pop_back();
            if (d > best) best = d;
            for (int c : children[node]) stack.push_back({c, d + 1});
        }
        return best;
    }
};`,
  },

  // countNetworks(n: int, pipes: List[List[int]]) -> int — union-find component count.
  'pghub-b22-pipe-network': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countNetworks(int n, vector<vector<int>>& pipes) {
        vector<int> parent(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }
            return x;
        };
        int comps = n;
        for (auto& p : pipes) {
            int ra = find(p[0]), rb = find(p[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps;
    }
};`,
  },

  // decodeCount(s: str) -> int — decode-ways DP, mod 1e9+7.
  'pghub-b22-signal-decode': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int decodeCount(string s) {
        const long long MOD = 1000000007;
        int n = s.size();
        long long prev2 = 1;
        long long prev1 = (s[0] != '0') ? 1 : 0;
        if (n == 1) return (int)prev1;
        for (int i = 1; i < n; i++) {
            long long cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = (s[i-1] - '0') * 10 + (s[i] - '0');
            if (two >= 10 && two <= 26) cur += prev2;
            cur %= MOD;
            prev2 = prev1;
            prev1 = cur;
        }
        return (int)prev1;
    }
};`,
  },

  // longestStable(temps: List[int], tol: int) -> int — sliding window, monotonic deques.
  'pghub-b22-thermostat-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestStable(vector<int>& temps, int tol) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)temps.size(); right++) {
            int v = temps[right];
            while (!maxDq.empty() && temps[maxDq.back()] <= v) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && temps[minDq.back()] >= v) minDq.pop_back();
            minDq.push_back(right);
            while (temps[maxDq.front()] - temps[minDq.front()] > tol) {
                left++;
                if (maxDq.front() < left) maxDq.pop_front();
                if (minDq.front() < left) minDq.pop_front();
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // mergeCost(tokens: List[int]) -> int — Huffman-style min-heap merge cost.
  'pghub-b22-token-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mergeCost(vector<int>& tokens) {
        if (tokens.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap(tokens.begin(), tokens.end());
        long long total = 0;
        while (heap.size() > 1) {
            long long a = heap.top(); heap.pop();
            long long b = heap.top(); heap.pop();
            long long s = a + b;
            total += s;
            heap.push(s);
        }
        return (int)total;
    }
};`,
  },

  // visibleBlocks(heights: List[int]) -> List[int] — right-to-left running max stack.
  'pghub-b22-tower-blocks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> visibleBlocks(vector<int>& heights) {
        vector<int> stack;
        for (int i = (int)heights.size() - 1; i >= 0; i--) {
            int h = heights[i];
            if (stack.empty() || h > stack.back()) stack.push_back(h);
        }
        reverse(stack.begin(), stack.end());
        return stack;
    }
};`,
  },

  // rotateShelves(shelf: List[int], k: int) -> List[int] — right rotate by k.
  'pghub-b22-warehouse-rotate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateShelves(vector<int>& shelf, int k) {
        int n = shelf.size();
        k %= n;
        vector<int> res;
        for (int i = n - k; i < n; i++) res.push_back(shelf[i]);
        for (int i = 0; i < n - k; i++) res.push_back(shelf[i]);
        return res;
    }
};`,
  },

  // minInsertions(s: str) -> int — balance parens greedily.
  'pghub-b23-bracket-balance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minInsertions(string s) {
        int openCount = 0, inserts = 0;
        for (char ch : s) {
            if (ch == '(') openCount++;
            else {
                if (openCount > 0) openCount--;
                else inserts++;
            }
        }
        return inserts + openCount;
    }
};`,
  },

  // maxCircularSum(banner: List[int]) -> int — Kadane + total-minus-min for wrap.
  'pghub-b23-circular-subarray-max': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCircularSum(vector<int>& banner) {
        long long total = 0;
        long long curMax = banner[0], bestMax = banner[0];
        long long curMin = banner[0], bestMin = banner[0];
        for (int i = 0; i < (int)banner.size(); i++) {
            int x = banner[i];
            total += x;
            if (i == 0) continue;
            curMax = max((long long)x, curMax + x);
            bestMax = max(bestMax, curMax);
            curMin = min((long long)x, curMin + x);
            bestMin = min(bestMin, curMin);
        }
        if (bestMax < 0) return (int)bestMax;
        return (int)max(bestMax, total - bestMin);
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int — coin-combination DP.
  'pghub-b23-coin-change-ways': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins)
            for (int a = c; a <= amount; a++)
                dp[a] += dp[a - c];
        return (int)dp[amount];
    }
};`,
  },

  // maxWindows(weights: List[int], k: int) -> List[int] — sliding-window maximum.
  'pghub-b23-conveyor-windows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> maxWindows(vector<int>& weights, int k) {
        deque<int> dq;
        vector<int> res;
        for (int i = 0; i < (int)weights.size(); i++) {
            int w = weights[i];
            while (!dq.empty() && weights[dq.back()] <= w) dq.pop_back();
            dq.push_back(i);
            if (dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) res.push_back(weights[dq.front()]);
        }
        return res;
    }
};`,
  },

  // idleFloors(requests: List[int]) -> int — sum of |delta| starting from 0.
  'pghub-b23-elevator-stops': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int idleFloors(vector<int>& requests) {
        long long total = 0, cur = 0;
        for (int f : requests) {
            total += abs(f - cur);
            cur = f;
        }
        return (int)total;
    }
};`,
  },

  // mergeRules(rules: List[List[int]]) -> List[List[int]] — merge overlapping intervals.
  'pghub-b23-firewall-rules': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeRules(vector<vector<int>>& rules) {
        sort(rules.begin(), rules.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        for (auto& r : rules) {
            int s = r[0], e = r[1];
            if (!merged.empty() && s <= merged.back()[1]) {
                if (e > merged.back()[1]) merged.back()[1] = e;
            } else {
                merged.push_back({s, e});
            }
        }
        return merged;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int — count exposed edges.
  'pghub-b23-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int perimeter = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r-1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perimeter -= 2;
                }
        return perimeter;
    }
};`,
  },

  // kthLargestAfterEach(k: int, scores: List[int]) -> List[int] — running kth-largest min-heap.
  'pghub-b23-kth-largest-stream': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargestAfterEach(int k, vector<int>& scores) {
        priority_queue<int, vector<int>, greater<int>> heap;
        vector<int> res;
        for (int s : scores) {
            heap.push(s);
            if ((int)heap.size() > k) heap.pop();
            res.push_back((int)heap.size() == k ? heap.top() : -1);
        }
        return res;
    }
};`,
  },

  // canFormPalindrome(beads: str) -> bool — at most one odd-count char.
  'pghub-b23-palindrome-rearrange': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFormPalindrome(string beads) {
        unordered_map<char, int> counts;
        for (char c : beads) counts[c]++;
        int odd = 0;
        for (auto& [c, n] : counts) if (n % 2 == 1) odd++;
        return odd <= 1;
    }
};`,
  },

  // countPrimes(n: int) -> int — Sieve of Eratosthenes count below n.
  'pghub-b23-prime-sieve-range': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<char> sieve(n, 1);
        sieve[0] = sieve[1] = 0;
        for (int i = 2; (long long)i * i < n; i++)
            if (sieve[i])
                for (long long j = (long long)i * i; j < n; j += i)
                    sieve[j] = 0;
        int total = 0;
        for (int i = 0; i < n; i++) total += sieve[i];
        return total;
    }
};`,
  },
};
