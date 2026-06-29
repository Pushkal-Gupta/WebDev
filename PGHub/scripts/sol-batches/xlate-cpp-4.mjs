// xlate-cpp-4.mjs — C++ translations of verified Python canonicals.
// Slice [159,212) of cpp-gap-targets.json (py present, cpp missing).
// Auto-loaded by backfill-solutions.mjs; cpp graded via local Judge0; written
// to PGcode_problems.solutions.cpp only on a full test-case pass.
// Signatures match generateTemplate('cpp', ...): containers passed by ref (&).

export default {
  // trapped(heights: List[int]) -> int  — two-pointer trapping water.
  'pghub-b23-rainfall-trap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trapped(vector<int>& heights) {
        int left = 0, right = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (heights[left] < heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else water += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else water += rightMax - heights[right];
                right--;
            }
        }
        return water;
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int  — best single buy/sell.
  'pghub-b23-stock-single-trade': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        long long minSoFar = LLONG_MAX;
        int best = 0;
        for (int p : prices) {
            if (p < minSoFar) minSoFar = p;
            else if (p - minSoFar > best) best = (int)(p - minSoFar);
        }
        return best;
    }
};`,
  },

  // canReach(vouchers: List[int], target: int) -> bool  — subset-sum DP (bitset port).
  'pghub-b23-subsequence-sum-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReach(vector<int>& vouchers, int target) {
        if (target < 0) return false;
        vector<char> reachable(target + 1, 0);
        reachable[0] = 1;
        for (int v : vouchers) {
            if (v <= target) {
                for (int s = target; s >= v; s--)
                    if (reachable[s - v]) reachable[s] = 1;
            }
        }
        return reachable[target] != 0;
    }
};`,
  },

  // minMutations(start: str, target: str, bank: List[str]) -> int  — BFS gene ladder.
  'pghub-b23-word-ladder-bits': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMutations(string start, string target, vector<string>& bank) {
        unordered_set<string> bankSet(bank.begin(), bank.end());
        if (!bankSet.count(target)) return -1;
        if (start == target) return 0;
        unordered_set<string> visited{start};
        queue<pair<string,int>> q;
        q.push({start, 0});
        string letters = "ACGT";
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            for (size_t i = 0; i < gene.size(); i++) {
                for (char ch : letters) {
                    if (ch == gene[i]) continue;
                    string nxt = gene;
                    nxt[i] = ch;
                    if (nxt == target) return steps + 1;
                    if (bankSet.count(nxt) && !visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push({nxt, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
};`,
  },

  // canSplitFair(costs: List[int]) -> bool  — partition into equal halves (subset-sum).
  'pghub-b24-budget-split': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitFair(vector<int>& costs) {
        long long total = 0;
        for (int c : costs) total += c;
        if (total % 2 != 0) return false;
        int target = (int)(total / 2);
        vector<char> reachable(target + 1, 0);
        reachable[0] = 1;
        for (int c : costs) {
            if (c <= target)
                for (int s = target; s >= c; s--)
                    if (reachable[s - c]) reachable[s] = 1;
        }
        return reachable[target] != 0;
    }
};`,
  },

  // rollingShift(s: str, k: int) -> str  — per-index Caesar shift.
  'pghub-b24-cipher-shift': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rollingShift(string s, int k) {
        string out;
        out.reserve(s.size());
        for (int i = 0; i < (int)s.size(); i++) {
            int off = (((s[i] - 97 + k + i) % 26) + 26) % 26;
            out.push_back((char)(97 + off));
        }
        return out;
    }
};`,
  },

  // minTrips(weights: List[int], limit: int) -> int  — two-pointer pairing.
  'pghub-b24-elevator-load': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int limit) {
        vector<int> arr(weights);
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1, trips = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // giftCodes(letters: str, length: int) -> List[str]  — full enumeration.
  'pghub-b24-gift-codes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> giftCodes(string letters, int length) {
        vector<string> out;
        string cur;
        function<void(int)> build = [&](int pos) {
            if (pos == length) { out.push_back(cur); return; }
            for (char ch : letters) {
                cur.push_back(ch);
                build(pos + 1);
                cur.pop_back();
            }
        };
        build(0);
        return out;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — count exposed edges.
  'pghub-b24-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r-1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perim -= 2;
                }
            }
        }
        return perim;
    }
};`,
  },

  // escapeSteps(grid: List[List[int]]) -> int  — BFS shortest path, -1 blocked.
  'pghub-b24-maze-escape': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int escapeSteps(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        seen[0][0] = 1;
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (auto& dd : dirs) {
                int nr = r + dd[0], nc = c + dd[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] == 0) {
                    if (nr == rows - 1 && nc == cols - 1) return d + 1;
                    seen[nr][nc] = 1;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // maxHarvest(yields: List[int], k: int) -> int  — max window sum.
  'pghub-b24-orchard-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxHarvest(vector<int>& yields, int k) {
        int n = yields.size();
        if (k >= n) { int s = 0; for (int x : yields) s += x; return s; }
        int window = 0;
        for (int i = 0; i < k; i++) window += yields[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += yields[i] - yields[i - k];
            if (window > best) best = window;
        }
        return best;
    }
};`,
  },

  // paintWays(posts: int, colors: int) -> int  — paint-fence DP, mod 1e9+7.
  'pghub-b24-paint-fence': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        if (posts == 1) return (int)(colors % MOD);
        long long same = colors % MOD;
        long long diff = ((long long)colors * (colors - 1)) % MOD;
        for (int p = 3; p <= posts; p++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = newSame % MOD;
            diff = newDiff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  // reverseRelay(order: List[int]) -> List[int]  — reverse the sequence.
  'pghub-b24-relay-baton': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reverseRelay(vector<int>& order) {
        vector<int> out(order.rbegin(), order.rend());
        return out;
    }
};`,
  },

  // runningMedians(samples: List[int]) -> List[int]  — two-heap streaming median.
  'pghub-b24-server-uptime': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> runningMedians(vector<int>& samples) {
        priority_queue<int> low;                           // max-heap: smaller half
        priority_queue<int, vector<int>, greater<int>> high; // min-heap: larger half
        vector<int> out;
        for (int x : samples) {
            if (low.empty() || x <= low.top()) low.push(x);
            else high.push(x);
            if (low.size() > high.size() + 1) { high.push(low.top()); low.pop(); }
            else if (high.size() > low.size()) { low.push(high.top()); high.pop(); }
            out.push_back(low.top());
        }
        return out;
    }
};`,
  },

  // countVisible(heights: List[int]) -> int  — running-max prefix count.
  'pghub-b24-skyline-peaks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countVisible(vector<int>& heights) {
        int count = 0;
        long long tallest = LLONG_MIN;
        for (int h : heights) {
            if (h > tallest) { count++; tallest = h; }
        }
        return count;
    }
};`,
  },

  // fullBatches(tickets: List[int], size: int) -> int  — sum of floor divisions.
  'pghub-b24-ticket-batches': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int fullBatches(vector<int>& tickets, int size) {
        long long total = 0;
        for (int t : tickets) total += t / size;
        return (int)total;
    }
};`,
  },

  // cheapestWithStops(n, roads: List[List[int]], src, dst, maxStops) -> int  — Bellman-Ford k stops.
  'pghub-b24-toll-roads': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestWithStops(int n, vector<vector<int>>& roads, int src, int dst, int maxStops) {
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        for (int it = 0; it < maxStops + 1; it++) {
            vector<long long> nxt = dist;
            for (auto& e : roads) {
                int u = e[0], v = e[1], w = e[2];
                if (dist[u] != INF && dist[u] + w < nxt[v])
                    nxt[v] = dist[u] + w;
            }
            dist = nxt;
        }
        return dist[dst] != INF ? (int)dist[dst] : -1;
    }
};`,
  },

  // longestVowelRun(s: str) -> int  — longest contiguous vowel run.
  'pghub-b24-vowel-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestVowelRun(string s) {
        string vowels = "aeiou";
        int best = 0, cur = 0;
        for (char ch : s) {
            if (vowels.find(ch) != string::npos) {
                cur++;
                if (cur > best) best = cur;
            } else {
                cur = 0;
            }
        }
        return best;
    }
};`,
  },

  // minBinSize(items: List[int], bins: int) -> int  — binary search on capacity.
  'pghub-b24-warehouse-bins': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minBinSize(vector<int>& items, int bins) {
        auto needed = [&](long long cap) {
            int used = 1; long long cur = 0;
            for (int x : items) {
                if (cur + x > cap) { used++; cur = x; }
                else cur += x;
            }
            return used;
        };
        long long lo = *max_element(items.begin(), items.end());
        long long hi = 0;
        for (int x : items) hi += x;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= bins) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // cycleLength(next_belt: List[int]) -> int  — Floyd cycle length, 0 if terminates.
  'pghub-b25-conveyor-cycle': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cycleLength(vector<int>& next_belt) {
        int slow = 0, fast = 0;
        while (true) {
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            slow = next_belt[slow];
            if (slow == fast) break;
        }
        int length = 1;
        int cur = next_belt[slow];
        while (cur != slow) {
            cur = next_belt[cur];
            length++;
        }
        return length;
    }
};`,
  },

  // reachableFloors(floors, up, down) -> int  — DFS over reachable floors.
  'pghub-b25-elevator-floors': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableFloors(int floors, int up, int down) {
        vector<char> seen(floors, 0);
        seen[0] = 1;
        vector<int> stk{0};
        int count = 1;
        while (!stk.empty()) {
            int f = stk.back(); stk.pop_back();
            for (int nf : {f + up, f - down}) {
                if (nf >= 0 && nf < floors && !seen[nf]) {
                    seen[nf] = 1;
                    count++;
                    stk.push_back(nf);
                }
            }
        }
        return count;
    }
};`,
  },

  // minTrips(weights: List[int], cap: int) -> int  — sequential greedy loading.
  'pghub-b25-ferry-loading': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int cap) {
        int trips = 1, load = 0;
        for (int w : weights) {
            if (load + w <= cap) load += w;
            else { trips++; load = w; }
        }
        return trips;
    }
};`,
  },

  // lastSeated(rows: int, order: List[int]) -> int  — min-heap by (count, row).
  'pghub-b25-festival-seats': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastSeated(int rows, vector<int>& order) {
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> heap;
        for (int r = 0; r < rows; r++) heap.push({0, r});
        int last = -1;
        for (size_t i = 0; i < order.size(); i++) {
            auto [cnt, r] = heap.top(); heap.pop();
            last = r;
            heap.push({cnt + 1, r});
        }
        return last;
    }
};`,
  },

  // escapeRoutes(grid: List[List[int]]) -> int  — unique-paths DP with obstacles, mod 1e9+7.
  'pghub-b25-grid-escape': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int escapeRoutes(vector<vector<int>>& grid) {
        const long long MOD = 1000000007LL;
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return 0;
        vector<long long> dp(cols, 0);
        dp[0] = 1;
        for (int r = 0; r < rows; r++) {
            if (grid[r][0] == 1) dp[0] = 0;
            for (int c = 1; c < cols; c++) {
                if (grid[r][c] == 1) dp[c] = 0;
                else dp[c] = (dp[c] + dp[c-1]) % MOD;
            }
        }
        return (int)dp[cols-1];
    }
};`,
  },

  // orchardDiameter(n: int, edges: List[List[int]]) -> int  — double-BFS tree diameter.
  'pghub-b25-orchard-prune': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int orchardDiameter(int n, vector<vector<int>>& edges) {
        if (n == 1) return 0;
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        auto bfs = [&](int src) {
            vector<int> dist(n, -1);
            dist[src] = 0;
            queue<int> dq;
            dq.push(src);
            int far = src;
            while (!dq.empty()) {
                int u = dq.front(); dq.pop();
                for (int v : adj[u]) {
                    if (dist[v] == -1) {
                        dist[v] = dist[u] + 1;
                        if (dist[v] > dist[far]) far = v;
                        dq.push(v);
                    }
                }
            }
            return pair<int,int>{far, dist[far]};
        };
        auto [a, d0] = bfs(0);
        auto [b, d] = bfs(a);
        return d;
    }
};`,
  },

  // paintedLength(strokes: List[List[int]]) -> int  — merge intervals, sum covered length.
  'pghub-b25-paint-rollers': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintedLength(vector<vector<int>>& strokes) {
        vector<vector<int>> arr(strokes);
        sort(arr.begin(), arr.end());
        int total = 0;
        int curLo = arr[0][0], curHi = arr[0][1];
        for (size_t i = 1; i < arr.size(); i++) {
            int lo = arr[i][0], hi = arr[i][1];
            if (lo <= curHi) {
                if (hi > curHi) curHi = hi;
            } else {
                total += curHi - curLo;
                curLo = lo; curHi = hi;
            }
        }
        total += curHi - curLo;
        return total;
    }
};`,
  },

  // countDrops(lanes: List[int]) -> int  — count descents.
  'pghub-b25-relay-baton': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countDrops(vector<int>& lanes) {
        int drops = 0;
        for (size_t i = 1; i < lanes.size(); i++)
            if (lanes[i] < lanes[i-1]) drops++;
        return drops;
    }
};`,
  },

  // longestRun(stock: List[int], k: int) -> int  — sliding window with ≤k zeros.
  'pghub-b25-shelf-stock': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRun(vector<int>& stock, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)stock.size(); right++) {
            if (stock[right] == 0) zeros++;
            while (zeros > k) {
                if (stock[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // sparseDot(a: List[int], b: List[int]) -> int  — sparse dot product.
  'pghub-b25-sparse-dot': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sparseDot(vector<int>& a, vector<int>& b) {
        long long total = 0;
        for (size_t i = 0; i < a.size(); i++)
            if (a[i] != 0 && b[i] != 0) total += (long long)a[i] * b[i];
        return (int)total;
    }
};`,
  },

  // totalXorSum(codes: List[int]) -> int  — OR of all * 2^(n-1).
  'pghub-b25-spy-codes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalXorSum(vector<int>& codes) {
        int n = codes.size();
        long long orAll = 0;
        for (int c : codes) orAll |= c;
        return (int)(orAll * (1LL << (n - 1)));
    }
};`,
  },

  // minRaise(heights: List[int]) -> int  — make non-decreasing, count raises.
  'pghub-b25-trail-altitude': {
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
        return (int)total;
    }
};`,
  },

  // digitRoot(n: int) -> int  — repeated digit-product root.
  'pghub-b25-vault-digits': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitRoot(int n) {
        while (n >= 10) {
            long long prod = 1;
            while (n > 0) {
                prod *= n % 10;
                n /= 10;
            }
            n = (int)prod;
        }
        return n;
    }
};`,
  },

  // minCapacity(parcels: List[int], days: int) -> int  — binary search ship capacity.
  'pghub-b25-warehouse-bins': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& parcels, int days) {
        auto need = [&](long long cap) {
            int d = 1; long long load = 0;
            for (int p : parcels) {
                if (load + p > cap) { d++; load = 0; }
                load += p;
            }
            return d;
        };
        long long lo = *max_element(parcels.begin(), parcels.end());
        long long hi = 0;
        for (int p : parcels) hi += p;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (need(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // cheapestCrossing(n, bridges: List[List[int]], src, dst) -> int  — Dijkstra.
  'pghub-b26-bridge-toll': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestCrossing(int n, vector<vector<int>>& bridges, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& e : bridges) {
            adj[e[0]].push_back({e[1], e[2]});
            adj[e[1]].push_back({e[0], e[2]});
        }
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<pair<long long,int>>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dst) return (int)d;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) {
                    dist[v] = nd;
                    pq.push({nd, v});
                }
            }
        }
        return dist[dst] != INF ? (int)dist[dst] : -1;
    }
};`,
  },

  // canSplitEqual(costs: List[int]) -> bool  — partition equal-sum subsets.
  'pghub-b26-budget-split': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitEqual(vector<int>& costs) {
        long long total = 0;
        for (int c : costs) total += c;
        if (total % 2 == 1) return false;
        int target = (int)(total / 2);
        vector<char> dp(target + 1, 0);
        dp[0] = 1;
        for (int c : costs) {
            if (c <= target)
                for (int s = target; s >= c; s--)
                    if (dp[s - c]) dp[s] = 1;
        }
        return dp[target] != 0;
    }
};`,
  },

  // maxDistinct(visitors: List[int], k: int) -> int  — max distinct in window k.
  'pghub-b26-cache-window': {
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

  // minTrips(weights: List[int], cap: int) -> int  — two-pointer pairing.
  'pghub-b26-elevator-trips': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int cap) {
        vector<int> arr(weights);
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
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countIslands(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        int count = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stk{{sr, sc}};
                    seen[sr][sc] = 1;
                    while (!stk.empty()) {
                        auto [r, c] = stk.back(); stk.pop_back();
                        for (auto& dd : dirs) {
                            int nr = r + dd[0], nc = c + dd[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = 1;
                                stk.push_back({nr, nc});
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

  // keypadCombos(digits: str) -> List[str]  — phone-keypad backtracking.
  'pghub-b26-keypad-words': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> keypadCombos(string digits) {
        if (digits.empty()) return {};
        unordered_map<char,string> mp = {
            {'2',"abc"},{'3',"def"},{'4',"ghi"},{'5',"jkl"},
            {'6',"mno"},{'7',"pqrs"},{'8',"tuv"},{'9',"wxyz"}
        };
        vector<string> res;
        function<void(int,string)> bt = [&](int i, string cur) {
            if (i == (int)digits.size()) { res.push_back(cur); return; }
            for (char ch : mp[digits[i]]) bt(i + 1, cur + ch);
        };
        bt(0, "");
        return res;
    }
};`,
  },

  // runningMedians(stream: List[int]) -> List[int]  — two-heap streaming median.
  'pghub-b26-median-stream': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> runningMedians(vector<int>& stream) {
        priority_queue<int> low;
        priority_queue<int, vector<int>, greater<int>> high;
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

  // paintWays(posts: int, colors: int) -> int  — paint-fence DP, mod 1e9+7.
  'pghub-b26-paint-fence': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        if (posts == 1) return (int)(colors % MOD);
        long long same = colors % MOD;
        long long diff = ((long long)colors * (colors - 1)) % MOD;
        for (int p = 3; p <= posts; p++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = newSame;
            diff = newDiff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  // canMakePalindrome(s: str) -> bool  — at most one odd-count char.
  'pghub-b26-palindrome-pair': {
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

  // maxRunningTotal(amounts: List[int]) -> int  — best running prefix sum.
  'pghub-b26-receipt-total': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxRunningTotal(vector<int>& amounts) {
        long long running = 0;
        long long best = LLONG_MIN;
        for (int a : amounts) {
            running += a;
            if (running > best) best = running;
        }
        return (int)best;
    }
};`,
  },

  // spiralOrder(grid: List[List[int]]) -> List[int]  — boundary-shrink spiral.
  'pghub-b26-spiral-read': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& grid) {
        vector<int> res;
        int top = 0, bottom = (int)grid.size() - 1;
        int left = 0, right = (int)grid[0].size() - 1;
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

  // priceSpan(prices: List[int]) -> List[int]  — monotonic-stack stock span.
  'pghub-b26-stock-span': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> priceSpan(vector<int>& prices) {
        int n = prices.size();
        vector<int> res(n, 0);
        vector<int> stk;
        for (int i = 0; i < n; i++) {
            while (!stk.empty() && prices[stk.back()] <= prices[i]) stk.pop_back();
            res[i] = stk.empty() ? i + 1 : i - stk.back();
            stk.push_back(i);
        }
        return res;
    }
};`,
  },

  // countAtLeast(seats: List[int], price: int) -> int  — lower-bound count > price.
  'pghub-b26-ticket-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countAtLeast(vector<int>& seats, int price) {
        int lo = 0, hi = (int)seats.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (seats[mid] <= price) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // minCoins(amount: int) -> int  — greedy US coin change.
  'pghub-b26-vending-change': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(int amount) {
        int coins[] = {25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
};`,
  },

  // lonelyReading(readings: List[int]) -> int  — XOR all to find single.
  'pghub-b26-xor-pair': {
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

  // isBalanced(s: str) -> bool  — bracket-matching stack.
  'pghub-b27-bracket-balance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string s) {
        unordered_map<char,char> pairs = {{')','('},{']','['},{'}','{'}};
        vector<char> stk;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stk.push_back(ch);
            } else {
                if (stk.empty() || stk.back() != pairs[ch]) return false;
                stk.pop_back();
            }
        }
        return stk.empty();
    }
};`,
  },

  // rangeSum(inserts: List[int], lo: int, hi: int) -> int  — BST build + range sum.
  'pghub-b27-bst-range-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& inserts, int lo, int hi) {
        // tree[v] = {left, right}; sentinel INT_MIN means "no child".
        const int NONE = INT_MIN;
        unordered_map<int, array<int,2>> tree;
        int root = NONE;
        for (int v : inserts) {
            if (root == NONE) { root = v; tree[v] = {NONE, NONE}; continue; }
            int cur = root;
            while (true) {
                if (v == cur) break;
                int side = (v < cur) ? 0 : 1;
                int nxt = tree[cur][side];
                if (nxt == NONE) { tree[cur][side] = v; tree[v] = {NONE, NONE}; break; }
                cur = nxt;
            }
        }
        long long total = 0;
        vector<int> stk;
        if (root != NONE) stk.push_back(root);
        while (!stk.empty()) {
            int node = stk.back(); stk.pop_back();
            if (lo <= node && node <= hi) total += node;
            int left = tree[node][0], right = tree[node][1];
            if (node > lo && left != NONE) stk.push_back(left);
            if (node < hi && right != NONE) stk.push_back(right);
        }
        return (int)total;
    }
};`,
  },

  // buildOrder(n: int, deps: List[List[int]]) -> List[int]  — lexicographic topo sort.
  'pghub-b27-build-order': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> buildOrder(int n, vector<vector<int>>& deps) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& e : deps) {
            adj[e[0]].push_back(e[1]);
            indeg[e[1]]++;
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
        return (int)order.size() == n ? order : vector<int>{};
    }
};`,
  },

  // digitalRoot(num: int) -> int  — repeated digit-product root.
  'pghub-b27-digital-root-product': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitalRoot(int num) {
        while (num >= 10) {
            long long prod = 1;
            int x = num;
            while (x > 0) {
                prod *= x % 10;
                x /= 10;
            }
            num = (int)prod;
        }
        return num;
    }
};`,
  },

  // pivotIndex(nums: List[int]) -> int  — equilibrium index.
  'pghub-b27-equilibrium-pivot': {
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
};
