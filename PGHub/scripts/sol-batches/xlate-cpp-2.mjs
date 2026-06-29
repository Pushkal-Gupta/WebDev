// C++ translations of verified Python canonicals for py-present cpp-missing
// problems. Slice [53, 106) of scripts/cpp-gap-targets.json.
// Signatures match generateTemplate('cpp', ...) exactly: containers (vector<...>
// / string) pass by reference. The runner grades each cpp via local Judge0 and
// writes only passing solutions. Skipped: pghub-b17-stream-median-window
// (List[float] return — excluded per task rules).
export default {
  'pghub-b16-merge-intervals': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeBookings(vector<vector<int>>& bookings) {
        vector<vector<int>> arr = bookings;
        sort(arr.begin(), arr.end());
        vector<vector<int>> merged;
        for (auto& iv : arr) {
            int s = iv[0], e = iv[1];
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

  'pghub-b16-orchard-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& positions, int reach) {
        vector<int> arr = positions;
        sort(arr.begin(), arr.end());
        int left = 0;
        long long total = 0;
        for (int right = 0; right < (int)arr.size(); right++) {
            while (arr[right] - arr[left] > reach) left++;
            total += right - left;
        }
        return (int)total;
    }
};`,
  },

  'pghub-b16-paint-fence': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        if (posts == 0) return 0;
        if (posts == 1) return (int)((long long)colors % MOD);
        long long same = (long long)colors % MOD;
        long long diff = ((long long)colors * (colors - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long new_same = diff;
            long long new_diff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = new_same % MOD;
            diff = new_diff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  'pghub-b16-process-tree-kill': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> killSubtree(vector<int>& pid, vector<int>& ppid, int kill) {
        unordered_map<int, vector<int>> children;
        for (size_t i = 0; i < pid.size(); i++)
            children[ppid[i]].push_back(pid[i]);
        vector<int> killed;
        vector<int> stk = {kill};
        while (!stk.empty()) {
            int cur = stk.back(); stk.pop_back();
            killed.push_back(cur);
            for (int ch : children[cur]) stk.push_back(ch);
        }
        sort(killed.begin(), killed.end());
        return killed;
    }
};`,
  },

  'pghub-b16-relay-baton': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestStreak(vector<int>& runners) {
        int best = 0, cur = 0;
        for (int r : runners) {
            if (r == 1) {
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

  'pghub-b16-ring-buffer-max': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bestSegment(vector<int>& track, int k) {
        int n = track.size();
        long long cur = 0;
        for (int i = 0; i < k; i++) cur += track[i];
        long long best = cur;
        for (int i = 1; i < n; i++) {
            cur += (long long)track[(i + k - 1) % n] - track[i - 1];
            if (cur > best) best = cur;
        }
        return (int)best;
    }
};`,
  },

  'pghub-b16-token-bucket': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> allowedRequests(vector<int>& times, int window, int limit) {
        deque<long long> q;
        vector<int> out;
        for (int t : times) {
            while (!q.empty() && q.front() <= (long long)t - window) q.pop_front();
            if ((int)q.size() < limit) {
                q.push_back(t);
                out.push_back(1);
            } else {
                out.push_back(0);
            }
        }
        return out;
    }
};`,
  },

  'pghub-b16-vault-combo': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMaxJump(vector<int>& dials, int splits) {
        auto groups_needed = [&](long long cap) {
            int groups = 1;
            long long cur = 0;
            for (int d : dials) {
                if (cur + d > cap) { groups++; cur = d; }
                else cur += d;
            }
            return groups;
        };
        long long lo = *max_element(dials.begin(), dials.end());
        long long hi = 0;
        for (int d : dials) hi += d;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (groups_needed(mid) <= splits) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  'pghub-b16-warehouse-aisles': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRestockTrips(vector<int>& shelves, int capacity) {
        long long total = 0;
        for (int x : shelves) total += x;
        if (total == 0) return 0;
        return (int)((total + capacity - 1) / capacity);
    }
};`,
  },

  'pghub-b17-bracket-depth': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(string expr) {
        int depth = 0, best = 0;
        for (char ch : expr) {
            if (ch == '(') {
                depth++;
                best = max(best, depth);
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  'pghub-b17-coin-change-ways': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int changeWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins)
            for (int a = c; a <= amount; a++)
                dp[a] += dp[a - c];
        return (int)dp[amount];
    }
};`,
  },

  'pghub-b17-cycle-detect': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasCycle(int n, vector<vector<int>>& edges) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            indeg[e[1]]++;
        }
        deque<int> q;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push_back(i);
        int seen = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop_front();
            seen++;
            for (int v : adj[u]) {
                if (--indeg[v] == 0) q.push_back(v);
            }
        }
        return seen != n;
    }
};`,
  },

  'pghub-b17-digit-product-min': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int smallestWithProduct(int target) {
        if (target == 1) return 1;
        vector<int> digits;
        for (int d = 9; d >= 2; d--) {
            while (target % d == 0) {
                digits.push_back(d);
                target /= d;
            }
        }
        if (target != 1) return -1;
        sort(digits.begin(), digits.end());
        long long num = 0;
        for (int d : digits) num = num * 10 + d;
        return (int)num;
    }
};`,
  },

  'pghub-b17-elevator-trips': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int limit) {
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

  'pghub-b17-log-bucket': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string bucketKey(string timestamp, string granularity) {
        vector<string> parts;
        {
            string cur;
            for (char c : timestamp) {
                if (c == ':') { parts.push_back(cur); cur.clear(); }
                else cur += c;
            }
            parts.push_back(cur);
        }
        vector<string> order = {"Year", "Month", "Day", "Hour", "Minute", "Second"};
        int keep = 0;
        for (int i = 0; i < (int)order.size(); i++)
            if (order[i] == granularity) { keep = i + 1; break; }
        string out;
        for (int i = 0; i < 6; i++) {
            if (i) out += ":";
            out += (i < keep) ? parts[i] : "00";
        }
        return out;
    }
};`,
  },

  'pghub-b17-orchard-grid': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wateredTrees(vector<vector<int>>& grid, int steps) {
        int R = grid.size(), C = grid[0].size();
        vector<vector<int>> dist(R, vector<int>(C, -1));
        deque<pair<int,int>> q;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (grid[r][c] == 2) { dist[r][c] = 0; q.push_back({r, c}); }
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop_front();
            if (dist[r][c] == steps) continue;
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] != -1 && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.push_back({nr, nc});
                }
            }
        }
        int watered = 0;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (grid[r][c] == 1 && dist[r][c] >= 0 && dist[r][c] <= steps) watered++;
        return watered;
    }
};`,
  },

  'pghub-b17-prefix-autocomplete': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string topCompletion(vector<string>& words, vector<int>& counts, string prefix) {
        string best;
        bool found = false;
        int best_count = -1;
        for (size_t i = 0; i < words.size(); i++) {
            const string& w = words[i];
            int c = counts[i];
            if (w.size() >= prefix.size() && w.compare(0, prefix.size(), prefix) == 0) {
                if (c > best_count || (c == best_count && (!found || w < best))) {
                    best = w;
                    best_count = c;
                    found = true;
                }
            }
        }
        return found ? best : "";
    }
};`,
  },

  'pghub-b17-prime-gap-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int twinGapPairs(int lo, int hi, int gap) {
        if (hi < 0) return 0;
        vector<char> sieve(hi + 1, 1);
        if (hi >= 0) sieve[0] = 0;
        if (hi >= 1) sieve[1] = 0;
        for (long long i = 2; i * i <= hi; i++)
            if (sieve[i])
                for (long long j = i * i; j <= hi; j += i) sieve[j] = 0;
        int count = 0;
        for (int p = lo; p <= hi - gap; p++) {
            int q = p + gap;
            if (p >= 0 && sieve[p] && q <= hi && sieve[q]) count++;
        }
        return count;
    }
};`,
  },

  'pghub-b17-relay-schedule': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxLegs(vector<int>& times, int budget) {
        vector<int> t = times;
        sort(t.begin(), t.end());
        long long total = 0;
        int count = 0;
        for (int x : t) {
            if (total + x > budget) break;
            total += x;
            count++;
        }
        return count;
    }
};`,
  },

  'pghub-b17-token-balance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestBalanced(string s) {
        vector<int> stk = {-1};
        int best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') {
                stk.push_back(i);
            } else {
                stk.pop_back();
                if (stk.empty()) stk.push_back(i);
                else best = max(best, i - stk.back());
            }
        }
        return best;
    }
};`,
  },

  'pghub-b17-version-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mergeVersions(vector<int>& a, vector<int>& b) {
        int i = 0, j = 0;
        int na = a.size(), nb = b.size();
        vector<int> out;
        while (i < na || j < nb) {
            int v;
            if (j >= nb || (i < na && a[i] <= b[j])) { v = a[i]; i++; }
            else { v = b[j]; j++; }
            if (out.empty() || out.back() != v) out.push_back(v);
        }
        return out;
    }
};`,
  },

  'pghub-b17-warehouse-aisles': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minLamps(vector<vector<int>>& shelves, int reach) {
        vector<vector<int>> intervals = shelves;
        sort(intervals.begin(), intervals.end());
        long long span = 2LL * reach + 1;
        int lamps = 0;
        bool has_cover = false;
        long long covered_until = 0;
        for (auto& iv : intervals) {
            long long s = iv[0], e = iv[1];
            long long pos = (!has_cover || covered_until < s) ? s : covered_until + 1;
            if (has_cover && covered_until >= e) continue;
            while (pos <= e) {
                lamps++;
                covered_until = pos + span - 1;
                has_cover = true;
                if (covered_until >= e) break;
                pos = covered_until + 1;
            }
        }
        return lamps;
    }
};`,
  },

  'pghub-b18-bracket-repair': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRepairs(string s) {
        int open_count = 0, insertions = 0;
        for (char ch : s) {
            if (ch == '(') open_count++;
            else {
                if (open_count > 0) open_count--;
                else insertions++;
            }
        }
        return insertions + open_count;
    }
};`,
  },

  'pghub-b18-bus-bays': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxBay(vector<vector<int>>& arrivals) {
        vector<vector<int>> buses = arrivals;
        sort(buses.begin(), buses.end(), [](const vector<int>& a, const vector<int>& b) {
            if (a[0] != b[0]) return a[0] < b[0];
            return a[1] < b[1];
        });
        priority_queue<int, vector<int>, greater<int>> freeBays;
        freeBays.push(1);
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> inUse;
        int next_bay = 2, max_bay = 0;
        for (auto& bus : buses) {
            int start = bus[0], end = bus[1];
            while (!inUse.empty() && inUse.top().first <= start) {
                int bay = inUse.top().second; inUse.pop();
                freeBays.push(bay);
            }
            int bay;
            if (!freeBays.empty()) { bay = freeBays.top(); freeBays.pop(); }
            else { bay = next_bay++; }
            max_bay = max(max_bay, bay);
            inUse.push({end, bay});
        }
        return max_bay;
    }
};`,
  },

  'pghub-b18-color-blend': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string nearestTidy(string color) {
        string hexd = "0123456789abcdef";
        auto best = [](int byte) {
            int chosen = -1;
            long long bestDist = 0;
            for (int d = 0; d < 16; d++) {
                int val = d * 17;
                long long dist = (long long)(val - byte) * (val - byte);
                if (chosen == -1 || dist < bestDist) { bestDist = dist; chosen = d; }
            }
            return chosen;
        };
        string out = "#";
        for (int k = 1; k < 7; k += 2) {
            int byte = (int)strtol(color.substr(k, 2).c_str(), nullptr, 16);
            int d = best(byte);
            out += hexd[d];
            out += hexd[d];
        }
        return out;
    }
};`,
  },

  'pghub-b18-elevator-trips': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& people, int limit) {
        vector<int> p = people;
        sort(p.begin(), p.end());
        int i = 0, j = (int)p.size() - 1, trips = 0;
        while (i <= j) {
            if (p[i] + p[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  'pghub-b18-island-shapes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctIslands(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        set<vector<pair<int,int>>> shapes;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        auto bfs = [&](int sr, int sc) {
            vector<pair<int,int>> cells;
            deque<pair<int,int>> q;
            q.push_back({sr, sc});
            seen[sr][sc] = 1;
            while (!q.empty()) {
                auto [r, c] = q.front(); q.pop_front();
                cells.push_back({r - sr, c - sc});
                for (int k = 0; k < 4; k++) {
                    int nr = r + dr[k], nc = c + dc[k];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                        seen[nr][nc] = 1;
                        q.push_back({nr, nc});
                    }
                }
            }
            sort(cells.begin(), cells.end());
            return cells;
        };
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1 && !seen[r][c])
                    shapes.insert(bfs(r, c));
        return (int)shapes.size();
    }
};`,
  },

  'pghub-b18-missing-meter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthMissing(vector<int>& readings, int k) {
        long long base = readings[0];
        int lo = 0, hi = (int)readings.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            long long missing_before = (long long)readings[mid] - base - mid;
            if (missing_before < k) lo = mid + 1;
            else hi = mid;
        }
        return (int)(base + (lo - 1) + k);
    }
};`,
  },

  'pghub-b18-orchard-bloom': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstBloomDay(vector<int>& bloom, int gap) {
        int n = bloom.size();
        vector<int> day_pos(n + 1, 0);
        for (int pos = 0; pos < n; pos++) day_pos[bloom[pos]] = pos + 1;
        vector<char> bloomed(n + 2, 0);
        for (int d = 1; d <= n; d++) {
            int p = day_pos[d];
            bloomed[p] = 1;
            int qs[] = {p - gap - 1, p + gap + 1};
            for (int q : qs) {
                if (q >= 1 && q <= n && bloomed[q]) {
                    bool ok = true;
                    for (int mid = min(p, q) + 1; mid < max(p, q); mid++) {
                        if (bloomed[mid]) { ok = false; break; }
                    }
                    if (ok) return d;
                }
            }
        }
        return -1;
    }
};`,
  },

  'pghub-b18-paint-fences': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        if (posts == 1) return (int)((long long)colors % MOD);
        long long same = (long long)colors % MOD;
        long long diff = ((long long)colors * (colors - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long new_same = diff;
            long long new_diff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = new_same % MOD;
            diff = new_diff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  'pghub-b18-relay-batons': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reorderRelay(vector<int>& runners) {
        int i = 0, j = (int)runners.size() - 1;
        vector<int> out;
        while (i < j) {
            out.push_back(runners[i]);
            out.push_back(runners[j]);
            i++;
            j--;
        }
        if (i == j) out.push_back(runners[i]);
        return out;
    }
};`,
  },

  'pghub-b18-shelf-restock': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPlacements(string target, string stock) {
        set<char> stock_set(stock.begin(), stock.end());
        for (char ch : target)
            if (!stock_set.count(ch)) return -1;
        int placements = 0;
        int i = 0, n = target.size(), m = stock.size();
        while (i < n) {
            placements++;
            int j = 0;
            while (i < n && j < m) {
                if (stock[j] == target[i]) i++;
                j++;
            }
        }
        return placements;
    }
};`,
  },

  'pghub-b18-stamp-folds': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRepeatLen(string s) {
        int n = s.size();
        vector<int> prev(n + 1, 0);
        int best = 0;
        for (int i = 1; i <= n; i++) {
            vector<int> cur(n + 1, 0);
            for (int j = i + 1; j <= n; j++) {
                if (s[i-1] == s[j-1]) {
                    cur[j] = prev[j-1] + 1;
                    if (cur[j] > best) best = cur[j];
                }
            }
            prev = cur;
        }
        return best;
    }
};`,
  },

  'pghub-b18-token-bucket': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAccepted(vector<int>& times, int window, int cap) {
        deque<long long> accepted;
        int count = 0;
        for (int t : times) {
            while (!accepted.empty() && accepted.front() <= (long long)t - window) accepted.pop_front();
            if ((int)accepted.size() < cap) {
                accepted.push_back(t);
                count++;
            }
        }
        return count;
    }
};`,
  },

  'pghub-b18-toll-roads': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minToll(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& e : edges) {
            int u = e[0], v = e[1], t = e[2];
            adj[u].push_back({v, t});
            adj[v].push_back({u, t});
        }
        const long long INF = LLONG_MAX;
        vector<long long> best(n, INF);
        best[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<pair<long long,int>>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [cost, u] = pq.top(); pq.pop();
            if (cost > best[u]) continue;
            if (u == dst) return (int)cost;
            for (auto& [v, t] : adj[u]) {
                long long nc = max(cost, (long long)t);
                if (nc < best[v]) {
                    best[v] = nc;
                    pq.push({nc, v});
                }
            }
        }
        return best[dst] != INF ? (int)best[dst] : -1;
    }
};`,
  },

  'pghub-b18-vault-dial': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTurns(vector<string>& jammed, string target) {
        set<string> dead(jammed.begin(), jammed.end());
        if (dead.count("0000")) return -1;
        if (target == "0000") return 0;
        set<string> visited = {"0000"};
        deque<pair<string,int>> q;
        q.push_back({"0000", 0});
        while (!q.empty()) {
            auto [state, steps] = q.front(); q.pop_front();
            for (int i = 0; i < 4; i++) {
                int d = state[i] - '0';
                int nds[] = {(d + 1) % 10, (d + 9) % 10};
                for (int nd : nds) {
                    string nxt = state;
                    nxt[i] = char('0' + nd);
                    if (nxt == target) return steps + 1;
                    if (!dead.count(nxt) && !visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push_back({nxt, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
};`,
  },

  'pghub-b18-warehouse-pallets': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitEqual(vector<int>& weights) {
        long long total = 0;
        for (int x : weights) total += x;
        if (total % 2 != 0) return false;
        long long half = total / 2;
        long long running = 0;
        for (int i = 0; i < (int)weights.size() - 1; i++) {
            running += weights[i];
            if (running == half) return true;
            if (running > half) return false;
        }
        return false;
    }
};`,
  },

  'pghub-b19-bitmask-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countComplementary(vector<int>& nums, int bits) {
        long long full = (1LL << bits) - 1;
        long long total = 0;
        unordered_map<long long, long long> seen;
        for (int x : nums) {
            long long comp = full ^ (long long)x;
            auto it = seen.find(comp);
            if (it != seen.end()) total += it->second;
            seen[x]++;
        }
        return (int)total;
    }
};`,
  },

  'pghub-b19-coin-change-rolls': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        return dp[amount] != INF ? dp[amount] : -1;
    }
};`,
  },

  'pghub-b19-conveyor-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMergeCost(vector<int>& lengths) {
        if (lengths.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap;
        for (int x : lengths) heap.push(x);
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

  'pghub-b19-courier-zones': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countZones(int n, vector<vector<int>>& roads) {
        vector<int> parent(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) {
                parent[x] = parent[parent[x]];
                x = parent[x];
            }
            return x;
        };
        for (auto& r : roads) {
            int ra = find(r[0]), rb = find(r[1]);
            if (ra != rb) parent[ra] = rb;
        }
        set<int> roots;
        for (int i = 0; i < n; i++) roots.insert(find(i));
        return (int)roots.size();
    }
};`,
  },

  'pghub-b19-elevation-peaks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> peakIndices(vector<int>& elev) {
        vector<int> res;
        for (int i = 1; i < (int)elev.size() - 1; i++)
            if (elev[i] > elev[i-1] && elev[i] > elev[i+1]) res.push_back(i);
        return res;
    }
};`,
  },

  'pghub-b19-festival-lights': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPatterns(int n) {
        const long long MOD = 1000000007LL;
        long long ends_off = 1, ends_on = 1;
        for (int i = 2; i <= n; i++) {
            long long new_off = (ends_off + ends_on) % MOD;
            long long new_on = ends_off % MOD;
            ends_off = new_off;
            ends_on = new_on;
        }
        return (int)((ends_off + ends_on) % MOD);
    }
};`,
  },

  'pghub-b19-garden-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxWatered(vector<int>& beds, int k) {
        int n = beds.size();
        if (k >= n) {
            long long s = 0;
            for (int x : beds) s += x;
            return (int)s;
        }
        long long window = 0;
        for (int i = 0; i < k; i++) window += beds[i];
        long long best = window;
        for (int i = k; i < n; i++) {
            window += (long long)beds[i] - beds[i - k];
            if (window > best) best = window;
        }
        return (int)best;
    }
};`,
  },

  'pghub-b19-ledger-rollback': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalBalance(vector<string>& ops) {
        vector<long long> history, redo;
        long long balance = 0;
        for (auto& op : ops) {
            if (op == "undo") {
                if (!history.empty()) {
                    long long v = history.back(); history.pop_back();
                    balance -= v;
                    redo.push_back(v);
                }
            } else if (op == "redo") {
                if (!redo.empty()) {
                    long long v = redo.back(); redo.pop_back();
                    balance += v;
                    history.push_back(v);
                }
            } else {
                long long v = stoll(op.substr(1));
                history.push_back(v);
                balance += v;
                redo.clear();
            }
        }
        return (int)balance;
    }
};`,
  },

  'pghub-b19-palindrome-pad': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minInsertions(string s) {
        int n = s.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s[i] == s[j]) dp[i][j] = dp[i+1][j-1];
                else dp[i][j] = 1 + min(dp[i+1][j], dp[i][j-1]);
            }
        }
        return n > 0 ? dp[0][n-1] : 0;
    }
};`,
  },

  'pghub-b19-pixel-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string encodeRuns(string s) {
        string out;
        int i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            int run = j - i;
            out += s[i];
            if (run >= 2) out += to_string(run);
            i = j;
        }
        return out;
    }
};`,
  },

  'pghub-b19-recipe-order': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> prepOrder(int n, vector<vector<int>>& deps) {
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
            for (int v : adj[u])
                if (--indeg[v] == 0) heap.push(v);
        }
        return (int)order.size() == n ? order : vector<int>{};
    }
};`,
  },

  'pghub-b19-tide-pools': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& heights) {
        if (heights.empty()) return 0;
        int left = 0, right = (int)heights.size() - 1;
        int left_max = 0, right_max = 0;
        long long total = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
                if (heights[left] >= left_max) left_max = heights[left];
                else total += left_max - heights[left];
                left++;
            } else {
                if (heights[right] >= right_max) right_max = heights[right];
                else total += right_max - heights[right];
                right--;
            }
        }
        return (int)total;
    }
};`,
  },

  'pghub-b19-token-ring': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastSurvivor(int n, int k) {
        int res = 0;
        for (int i = 2; i <= n; i++) res = (res + k) % i;
        return res + 1;
    }
};`,
  },

  'pghub-b19-water-balloons': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& sizes) {
        vector<int> vals;
        vals.push_back(1);
        for (int x : sizes) vals.push_back(x);
        vals.push_back(1);
        int n = vals.size();
        vector<vector<long long>> dp(n, vector<long long>(n, 0));
        for (int length = 2; length < n; length++) {
            for (int left = 0; left + length < n; left++) {
                int right = left + length;
                long long best = 0;
                for (int k = left + 1; k < right; k++) {
                    long long gain = (long long)vals[left] * vals[k] * vals[right] + dp[left][k] + dp[k][right];
                    if (gain > best) best = gain;
                }
                dp[left][right] = best;
            }
        }
        return (int)dp[0][n - 1];
    }
};`,
  },

  'pghub-b20-cipher-shift': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string encode(string s, int k) {
        string out;
        for (int i = 0; i < (int)s.size(); i++) {
            char ch = s[i];
            if (ch >= 'a' && ch <= 'z') {
                int shift = ((k + i) % 26 + 26) % 26;
                out += char((ch - 'a' + shift) % 26 + 'a');
            } else {
                out += ch;
            }
        }
        return out;
    }
};`,
  },
};
