// xlate-cpp-8.mjs — faithful C++ translations of verified Python references for
// cpp-gap-targets indices [371, 422) (the final 51 slugs). Signatures match
// generateTemplate('cpp', method_name, params, return_type) exactly: containers
// (vector<...>, string) passed by `&`, primitives by value.
// Reference = solutions.python in PGcode_problems. Graded by backfill-solutions.mjs
// against stored test_cases via Judge0; only passing cpp is written.
//
// Faithful-porting notes:
//   - `long long` used for accumulating sums / products to dodge int32 overflow.
//   - Integer division/modulo parity preserved; all results here are non-negative
//     or already-correct truncations (e.g. evalPostfix uses int(a/b) → C++ trunc).
//   - heapq → priority_queue<…, greater<…>> (min-heap); topo-sort heap likewise.
//   - Dijkstra uses LLONG_MAX sentinel; -1 returned where Python returned inf→-1.
//   - tree-diameter / flood / zones: tree-as-List[int] with -1 sentinel (NOT a
//     `null` token), so it ports as a plain int array — gradeable.
//
// SKIPPED: none — all 51 slugs have primitive/List-typed gradeable signatures
// (no tree-as-List-with-null, no bare nested List, no List[float] returns).

export default {
  // countPairs(nums: List[int], target: int) -> int  — complement count.
  'pghub-b51-pair-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& nums, int target) {
        unordered_map<long long,int> seen;
        long long count = 0;
        for (int x : nums) {
            count += seen[(long long)target - x];
            seen[x]++;
        }
        return (int)count;
    }
};`,
  },

  // minInsertions(s: str) -> int  — paren balance, single ')' close.
  'pghub-b51-paren-balance': {
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

  // countWays(n: int) -> int  — Fibonacci-style step count.
  'pghub-b51-rabbit-hop': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(int n) {
        if (n <= 1) return 1;
        long long prev = 1, cur = 1;
        for (int i = 2; i <= n; i++) {
            long long nxt = prev + cur;
            prev = cur;
            cur = nxt;
        }
        return (int)cur;
    }
};`,
  },

  // countSubarrays(nums: List[int], target: int) -> int  — prefix-sum hashmap.
  'pghub-b51-subarray-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int target) {
        unordered_map<long long,int> seen;
        seen[0] = 1;
        long long prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            count += seen[prefix - target];
            seen[prefix]++;
        }
        return (int)count;
    }
};`,
  },

  // treeDiameter(tree: List[int]) -> int  — array tree, -1 sentinel.
  'pghub-b51-tree-diameter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int treeDiameter(vector<int>& tree) {
        int n = tree.size(), best = 0;
        function<int(int)> depth = [&](int i) -> int {
            if (i >= n || tree[i] == -1) return 0;
            int left = depth(2 * i + 1);
            int right = depth(2 * i + 2);
            if (left + right > best) best = left + right;
            return 1 + max(left, right);
        };
        depth(0);
        return best;
    }
};`,
  },

  // maxVowels(s: str, k: int) -> int  — sliding-window vowel count.
  'pghub-b51-vowel-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxVowels(string s, int k) {
        auto isVowel = [](char c){ return c=='a'||c=='e'||c=='i'||c=='o'||c=='u'; };
        int n = s.size();
        if (k >= n) {
            int total = 0;
            for (char c : s) if (isVowel(c)) total++;
            return total;
        }
        int cur = 0;
        for (int i = 0; i < k; i++) if (isVowel(s[i])) cur++;
        int best = cur;
        for (int i = k; i < n; i++) {
            if (isVowel(s[i])) cur++;
            if (isVowel(s[i - k])) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // zigzagRead(s: str, rows: int) -> str  — zigzag bucket join.
  'pghub-b51-zigzag-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string zigzagRead(string s, int rows) {
        if (rows == 1 || rows >= (int)s.size()) return s;
        vector<string> buckets(rows);
        int r = 0, step = 1;
        for (char ch : s) {
            buckets[r].push_back(ch);
            if (r == 0) step = 1;
            else if (r == rows - 1) step = -1;
            r += step;
        }
        string out;
        for (auto& b : buckets) out += b;
        return out;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max bracket nesting over ()[]{}.
  'pghub-b52-bracket-depth': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')' || ch == ']' || ch == '}') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // minRepaints(colors: List[int], k: int) -> int  — DP with best/2nd-best carry.
  'pghub-b52-color-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRepaints(vector<int>& colors, int k) {
        const long long INF = LLONG_MAX / 4;
        int n = colors.size();
        vector<long long> prev(k);
        for (int color = 0; color < k; color++)
            prev[color] = (colors[0] == color) ? 0 : 1;
        for (int i = 1; i < n; i++) {
            long long best1 = INF, best2 = INF;
            int arg1 = -1;
            for (int c = 0; c < k; c++) {
                if (prev[c] < best1) { best2 = best1; best1 = prev[c]; arg1 = c; }
                else if (prev[c] < best2) { best2 = prev[c]; }
            }
            vector<long long> cur(k);
            for (int color = 0; color < k; color++) {
                long long base = (color != arg1) ? best1 : best2;
                cur[color] = base + ((colors[i] == color) ? 0 : 1);
            }
            prev = cur;
        }
        return (int)*min_element(prev.begin(), prev.end());
    }
};`,
  },

  // reachableHubs(n: int, roads: List[List[int]], start: int) -> int  — BFS count.
  'pghub-b52-courier-routes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableHubs(int n, vector<vector<int>>& roads, int start) {
        unordered_map<int,vector<int>> adj;
        for (auto& e : roads) adj[e[0]].push_back(e[1]);
        unordered_set<int> visited{start};
        queue<int> q;
        q.push(start);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            for (int nxt : adj[node]) {
                if (!visited.count(nxt)) {
                    visited.insert(nxt);
                    q.push(nxt);
                }
            }
        }
        return (int)visited.size();
    }
};`,
  },

  // canFinish(numCourses: int, prerequisites: List[List[int]]) -> bool  — Kahn topo.
  'pghub-b52-cycle-detect': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);
            indeg[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int taken = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            taken++;
            for (int nxt : adj[node]) {
                if (--indeg[nxt] == 0) q.push(nxt);
            }
        }
        return taken == numCourses;
    }
};`,
  },

  // maxEvents(events: List[List[int]]) -> int  — greedy + min-heap of end days.
  'pghub-b52-event-schedule': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxEvents(vector<vector<int>>& events) {
        sort(events.begin(), events.end());
        priority_queue<int, vector<int>, greater<int>> heap;
        int i = 0, n = events.size(), day = 0, attended = 0;
        while (i < n || !heap.empty()) {
            if (heap.empty()) day = max(day + 1, events[i][0]);
            else day++;
            while (i < n && events[i][0] <= day) { heap.push(events[i][1]); i++; }
            while (!heap.empty() && heap.top() < day) heap.pop();
            if (!heap.empty()) { heap.pop(); attended++; }
        }
        return attended;
    }
};`,
  },

  // minSprinklers(ranges: List[int], n: int) -> int  — jump-game coverage, -1 fail.
  'pghub-b52-garden-water': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSprinklers(vector<int>& ranges, int n) {
        vector<int> maxRight(n + 1, 0);
        for (int i = 0; i < (int)ranges.size(); i++) {
            int left = max(0, i - ranges[i]);
            int right = min(n, i + ranges[i]);
            if (right > maxRight[left]) maxRight[left] = right;
        }
        int count = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < n) {
            while (i <= curEnd) {
                if (maxRight[i] > farthest) farthest = maxRight[i];
                i++;
            }
            if (farthest <= curEnd) return -1;
            count++;
            curEnd = farthest;
        }
        return count;
    }
};`,
  },

  // maxTreasure(grid: List[List[int]]) -> int  — path DP (down/right), 1D rolling.
  'pghub-b52-grid-treasure': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTreasure(vector<vector<int>>& grid) {
        const long long NEG = LLONG_MIN / 4;
        int rows = grid.size(), cols = grid[0].size();
        vector<long long> dp(cols, NEG);
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else {
                    long long best = NEG;
                    if (r > 0) best = max(best, dp[c]);
                    if (c > 0) best = max(best, dp[c - 1]);
                    dp[c] = best + grid[r][c];
                }
            }
        }
        return (int)dp[cols - 1];
    }
};`,
  },

  // maxConcurrent(meetings: List[List[int]]) -> int  — sweep with +1/-1 events.
  'pghub-b52-meeting-overlap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxConcurrent(vector<vector<int>>& meetings) {
        vector<pair<int,int>> events;
        for (auto& m : meetings) {
            events.push_back({m[0], 1});
            events.push_back({m[1], -1});
        }
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

  // longestPalindromeLen(s: str) -> int  — pair counts + one odd center.
  'pghub-b52-palindrome-removal': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestPalindromeLen(string s) {
        unordered_map<char,int> counts;
        for (char c : s) counts[c]++;
        int length = 0;
        bool hasOdd = false;
        for (auto& kv : counts) {
            int c = kv.second;
            length += c - (c & 1);
            if (c & 1) hasOdd = true;
        }
        return length + (hasOdd ? 1 : 0);
    }
};`,
  },

  // signProducts(nums: List[int]) -> List[int]  — running sign of prefix product.
  'pghub-b52-prefix-product': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> signProducts(vector<int>& nums) {
        vector<int> res;
        int sign = 1;
        for (int x : nums) {
            if (x == 0) sign = 0;
            else if (x < 0) sign = (sign != 0) ? -sign : 0;
            res.push_back(sign);
        }
        return res;
    }
};`,
  },

  // maxTeams(speeds: List[int], limit: int) -> int  — sort + two-pointer pairing.
  'pghub-b52-relay-teams': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTeams(vector<int>& speeds, int limit) {
        sort(speeds.begin(), speeds.end());
        int i = 0, j = (int)speeds.size() - 1, teams = 0;
        while (i <= j) {
            if (i < j && speeds[i] + speeds[j] <= limit) i++;
            j--;
            teams++;
        }
        return teams;
    }
};`,
  },

  // minPower(distances: List[int], budget: int) -> int  — binary search on power.
  'pghub-b52-signal-decay': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPower(vector<int>& distances, int budget) {
        long long lo = 1, hi = *max_element(distances.begin(), distances.end());
        auto cost = [&](long long p) -> long long {
            long long total = 0;
            for (int d : distances) {
                if (p < d) return (long long)budget + 1;
                total += (d + p - 1) / p;
                if (total > budget) return total;
            }
            return total;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (cost(mid) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — OR of all, shifted by n-1.
  'pghub-b52-subset-xor': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        long long bitOr = 0;
        for (int x : nums) bitOr |= x;
        return (int)(bitOr << ((int)nums.size() - 1));
    }
};`,
  },

  // finalStack(tokens: List[int]) -> List[int]  — cancel-adjacent-equal stack.
  'pghub-b52-token-stack': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> finalStack(vector<int>& tokens) {
        vector<int> stack;
        for (int t : tokens) {
            if (!stack.empty() && stack.back() == t) stack.pop_back();
            else stack.push_back(t);
        }
        return stack;
    }
};`,
  },

  // wastedSpace(boxes: List[int], shelf: int) -> int  — greedy shelf packing.
  'pghub-b52-warehouse-shelves': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wastedSpace(vector<int>& boxes, int shelf) {
        int used = 0, waste = 0;
        for (int h : boxes) {
            if (used + h <= shelf) used += h;
            else { waste += shelf - used; used = h; }
        }
        waste += shelf - used;
        return waste;
    }
};`,
  },

  // maxDepth(s: str) -> int  — paren-only nesting depth.
  'pghub-b53-bracket-depth': {
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

  // minCapacity(weights: List[int], shifts: int) -> int  — binary search capacity.
  'pghub-b53-conveyor-load': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& weights, int shifts) {
        auto needed = [&](long long cap) -> int {
            int used = 1;
            long long cur = 0;
            for (int w : weights) {
                if (cur + w > cap) { used++; cur = 0; }
                cur += w;
            }
            return used;
        };
        long long lo = *max_element(weights.begin(), weights.end());
        long long hi = 0;
        for (int w : weights) hi += w;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= shifts) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // pickupOrder(n: int, deps: List[List[int]]) -> List[int]  — lexicographic topo.
  'pghub-b53-courier-order': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> pickupOrder(int n, vector<vector<int>>& deps) {
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
            int node = heap.top(); heap.pop();
            order.push_back(node);
            for (int nb : adj[node]) {
                if (--indeg[nb] == 0) heap.push(nb);
            }
        }
        if ((int)order.size() != n) return {};
        return order;
    }
};`,
  },

  // reduceRatio(a: int, b: int) -> List[int]  — divide by gcd.
  'pghub-b53-gear-ratio': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reduceRatio(int a, int b) {
        int g = __gcd(a, b);
        return {a / g, b / g};
    }
};`,
  },

  // decompress(s: str) -> str  — char,count run expansion.
  'pghub-b53-keypad-mash': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decompress(string s) {
        string out;
        for (size_t i = 0; i + 1 < s.size(); i += 2) {
            int cnt = s[i + 1] - '0';
            out.append(cnt, s[i]);
        }
        return out;
    }
};`,
  },

  // minManhattan(points: List[List[int]]) -> int  — min pairwise L1 distance.
  'pghub-b53-laser-cells': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minManhattan(vector<vector<int>>& points) {
        int n = points.size();
        long long best = LLONG_MAX;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                long long d = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1]);
                if (d < best) best = d;
            }
        }
        return (int)best;
    }
};`,
  },

  // minCost(trees: List[int]) -> int  — Huffman-style min-heap merge.
  'pghub-b53-orchard-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<int>& trees) {
        if (trees.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap(trees.begin(), trees.end());
        long long total = 0;
        while (heap.size() > 1) {
            long long a = heap.top(); heap.pop();
            long long b = heap.top(); heap.pop();
            long long merged = a + b;
            total += merged;
            heap.push(merged);
        }
        return (int)total;
    }
};`,
  },

  // minCuts(s: str) -> int  — palindrome-partition min-cut DP.
  'pghub-b53-palindrome-cut': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCuts(string s) {
        int n = s.size();
        vector<vector<char>> pal(n, vector<char>(n, 0));
        for (int i = 0; i < n; i++) pal[i][i] = 1;
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s[i] == s[j] && (length == 2 || pal[i + 1][j - 1])) pal[i][j] = 1;
            }
        }
        vector<int> dp(n, 0);
        for (int i = 0; i < n; i++) {
            if (pal[0][i]) dp[i] = 0;
            else {
                int best = i;
                for (int j = 1; j <= i; j++) {
                    if (pal[j][i] && dp[j - 1] + 1 < best) best = dp[j - 1] + 1;
                }
                dp[i] = best;
            }
        }
        return dp[n - 1];
    }
};`,
  },

  // routeAll(prefixes: List[str], queries: List[str]) -> List[int]  — trie longest match.
  'pghub-b53-prefix-router': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> routeAll(vector<string>& prefixes, vector<string>& queries) {
        struct Node { unordered_map<char,int> next; int len = -1; };
        vector<Node> trie(1);
        for (auto& p : prefixes) {
            int node = 0;
            for (char ch : p) {
                if (!trie[node].next.count(ch)) {
                    trie[node].next[ch] = trie.size();
                    trie.push_back(Node());
                }
                node = trie[node].next[ch];
            }
            trie[node].len = (int)p.size();
        }
        vector<int> res;
        for (auto& q : queries) {
            int node = 0, best = 0;
            for (char ch : q) {
                auto it = trie[node].next.find(ch);
                if (it == trie[node].next.end()) break;
                node = it->second;
                if (trie[node].len >= 0) best = trie[node].len;
            }
            res.push_back(best);
        }
        return res;
    }
};`,
  },

  // countReachable(n: int, edges: List[List[int]]) -> int  — undirected BFS from 0.
  'pghub-b53-relay-rooms': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countReachable(int n, vector<vector<int>>& edges) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<char> visited(n, 0);
        visited[0] = 1;
        queue<int> q;
        q.push(0);
        int count = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            count++;
            for (int nb : adj[node]) {
                if (!visited[nb]) { visited[nb] = 1; q.push(nb); }
            }
        }
        return count;
    }
};`,
  },

  // mergeShelves(shelves: List[List[int]]) -> List[List[int]]  — interval merge.
  'pghub-b53-shelf-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeShelves(vector<vector<int>>& shelves) {
        sort(shelves.begin(), shelves.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        merged.push_back(shelves[0]);
        for (size_t i = 1; i < shelves.size(); i++) {
            int start = shelves[i][0], end = shelves[i][1];
            if (start <= merged.back()[1]) {
                if (end > merged.back()[1]) merged.back()[1] = end;
            } else {
                merged.push_back({start, end});
            }
        }
        return merged;
    }
};`,
  },

  // maxAfterFlip(n: int) -> int  — best single-bit flip within bit_length.
  'pghub-b53-signal-flip': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAfterFlip(int n) {
        if (n == 0) return 1;
        int bits = 0;
        for (long long t = n; t > 0; t >>= 1) bits++;
        long long best = n;
        for (int i = 0; i < bits; i++) {
            long long flipped = (long long)n ^ (1LL << i);
            if (flipped > best) best = flipped;
        }
        return (int)best;
    }
};`,
  },

  // evalPostfix(tokens: List[str]) -> int  — RPN evaluation, truncating division.
  'pghub-b53-stack-evaluate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalPostfix(vector<string>& tokens) {
        vector<long long> stack;
        for (const string& tok : tokens) {
            if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
                long long b = stack.back(); stack.pop_back();
                long long a = stack.back(); stack.pop_back();
                if (tok == "+") stack.push_back(a + b);
                else if (tok == "-") stack.push_back(a - b);
                else if (tok == "*") stack.push_back(a * b);
                else stack.push_back(a / b);
            } else {
                stack.push_back(stoll(tok));
            }
        }
        return (int)stack[0];
    }
};`,
  },

  // longestCalm(wait: List[int], limit: int) -> int  — monotonic-deque window.
  'pghub-b53-ticket-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestCalm(vector<int>& wait, int limit) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)wait.size(); right++) {
            int x = wait[right];
            while (!maxDq.empty() && wait[maxDq.back()] <= x) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && wait[minDq.back()] >= x) minDq.pop_back();
            minDq.push_back(right);
            while (wait[maxDq.front()] - wait[minDq.front()] > limit) {
                left++;
                if (maxDq.front() < left) maxDq.pop_front();
                if (minDq.front() < left) minDq.pop_front();
            }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }
};`,
  },

  // countMarks(levels: List[int]) -> int  — count strict prefix maxima.
  'pghub-b53-tide-marks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countMarks(vector<int>& levels) {
        bool started = false;
        long long best = 0;
        int count = 0;
        for (int x : levels) {
            if (!started || x > best) { count++; best = x; started = true; }
        }
        return count;
    }
};`,
  },

  // cheapestRoute(n, roads: List[List[int]], src, dst) -> int  — Dijkstra, -1 fail.
  'pghub-courier-route-cost': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> graph(n);
        for (auto& r : roads) {
            graph[r[0]].push_back({r[1], r[2]});
            graph[r[1]].push_back({r[0], r[2]});
        }
        const long long INF = LLONG_MAX / 4;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<pair<long long,int>>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, node] = pq.top(); pq.pop();
            if (d > dist[node]) continue;
            if (node == dst) return (int)d;
            for (auto& [nb, w] : graph[node]) {
                long long nd = d + w;
                if (nd < dist[nb]) { dist[nb] = nd; pq.push({nd, nb}); }
            }
        }
        return dist[dst] == INF ? -1 : (int)dist[dst];
    }
};`,
  },

  // largestRegion(grid: List[List[int]]) -> int  — largest 4-connected 1-region.
  'pghub-flood-region-size': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestRegion(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = rows ? grid[0].size() : 0;
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        int best = 0;
        int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    vector<pair<int,int>> stack{{r, c}};
                    seen[r][c] = 1;
                    int size = 0;
                    while (!stack.empty()) {
                        auto [x, y] = stack.back(); stack.pop_back();
                        size++;
                        for (int k = 0; k < 4; k++) {
                            int nx = x + dx[k], ny = y + dy[k];
                            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = 1;
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

  // mutationSteps(start: str, target: str, bank: List[str]) -> int  — BFS over ACGT.
  'pghub-gene-mutation-steps': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mutationSteps(string start, string target, vector<string>& bank) {
        unordered_set<string> bankset(bank.begin(), bank.end());
        if (!bankset.count(target)) return -1;
        if (start == target) return 0;
        const string alphabet = "ACGT";
        queue<pair<string,int>> q;
        q.push({start, 0});
        unordered_set<string> visited{start};
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            for (size_t i = 0; i < gene.size(); i++) {
                char orig = gene[i];
                for (char ch : alphabet) {
                    if (ch == orig) continue;
                    string nxt = gene;
                    nxt[i] = ch;
                    if (bankset.count(nxt) && !visited.count(nxt)) {
                        if (nxt == target) return steps + 1;
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

  // kthSmallestSum(a: List[int], b: List[int], k: int) -> int  — heap of pair sums.
  'pghub-kth-smallest-pair-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSmallestSum(vector<int>& a, vector<int>& b, int k) {
        if (a.empty() || b.empty()) return -1;
        sort(a.begin(), a.end());
        sort(b.begin(), b.end());
        using T = tuple<long long,int,int>;
        priority_queue<T, vector<T>, greater<T>> heap;
        set<pair<int,int>> seen;
        heap.push({(long long)a[0] + b[0], 0, 0});
        seen.insert({0, 0});
        long long res = -1;
        for (int step = 0; step < k; step++) {
            if (heap.empty()) return -1;
            auto [val, i, j] = heap.top(); heap.pop();
            res = val;
            if (i + 1 < (int)a.size() && !seen.count({i + 1, j})) {
                seen.insert({i + 1, j});
                heap.push({(long long)a[i + 1] + b[j], i + 1, j});
            }
            if (j + 1 < (int)b.size() && !seen.count({i, j + 1})) {
                seen.insert({i, j + 1});
                heap.push({(long long)a[i] + b[j + 1], i, j + 1});
            }
        }
        return (int)res;
    }
};`,
  },

  // networkDelay(edges: List[List[int]], n: int, source: int) -> int  — Dijkstra max.
  'pghub-network-delay-time': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelay(vector<vector<int>>& edges, int n, int source) {
        unordered_map<int,vector<pair<int,int>>> graph;
        for (auto& e : edges) graph[e[0]].push_back({e[1], e[2]});
        const long long INF = LLONG_MAX / 4;
        unordered_map<int,long long> dist;
        dist[source] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<pair<long long,int>>> pq;
        pq.push({0, source});
        while (!pq.empty()) {
            auto [d, node] = pq.top(); pq.pop();
            if (d > (dist.count(node) ? dist[node] : INF)) continue;
            for (auto& [nb, w] : graph[node]) {
                long long nd = d + w;
                if (nd < (dist.count(nb) ? dist[nb] : INF)) {
                    dist[nb] = nd;
                    pq.push({nd, nb});
                }
            }
        }
        if ((int)dist.size() < n) return -1;
        long long best = 0;
        for (auto& kv : dist) best = max(best, kv.second);
        return (int)best;
    }
};`,
  },

  // bridgeLength(s: str) -> int  — longest vowel-anchored palindrome (expand center).
  'pghub-palindrome-bridge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bridgeLength(string s) {
        auto isVowel = [](char c){ return c=='a'||c=='e'||c=='i'||c=='o'||c=='u'; };
        int n = s.size(), best = 0;
        auto expand = [&](int l, int r) -> pair<int,int> {
            while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
            return {l + 1, r - 1};
        };
        for (int c = 0; c < n; c++) {
            for (auto [l0, r0] : {make_pair(c, c), make_pair(c, c + 1)}) {
                auto [l, r] = expand(l0, r0);
                if (r - l + 1 >= 2 && s[l] == s[r] && isVowel(s[l])) {
                    best = max(best, r - l + 1);
                }
            }
        }
        return best;
    }
};`,
  },

  // countZones(grid: List[List[int]]) -> int  — count 4-connected 1-components.
  'pghub-warehouse-zones': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countZones(vector<vector<int>>& grid) {
        int r = grid.size(), c = grid[0].size();
        vector<vector<char>> seen(r, vector<char>(c, 0));
        int zones = 0;
        int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (grid[i][j] == 1 && !seen[i][j]) {
                    zones++;
                    vector<pair<int,int>> stack{{i, j}};
                    seen[i][j] = 1;
                    while (!stack.empty()) {
                        auto [x, y] = stack.back(); stack.pop_back();
                        for (int k = 0; k < 4; k++) {
                            int nx = x + dx[k], ny = y + dy[k];
                            if (nx >= 0 && nx < r && ny >= 0 && ny < c && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = 1;
                                stack.push_back({nx, ny});
                            }
                        }
                    }
                }
            }
        }
        return zones;
    }
};`,
  },

  // transformLength(begin: str, end: str, words: List[str]) -> int  — word-ladder BFS.
  'pghub-word-ladder-length': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformLength(string begin, string end, vector<string>& words) {
        unordered_set<string> wordset(words.begin(), words.end());
        if (!wordset.count(end)) return 0;
        queue<pair<string,int>> q;
        q.push({begin, 1});
        unordered_set<string> visited{begin};
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == end) return dist;
            for (size_t i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    string nxt = word;
                    nxt[i] = c;
                    if (wordset.count(nxt) && !visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push({nxt, dist + 1});
                    }
                }
            }
        }
        return 0;
    }
};`,
  },

  // rotateWords(s: str, k: int) -> str  — rotate space-split words by k.
  'pghub-word-rotate': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rotateWords(string s, int k) {
        vector<string> words;
        size_t start = 0;
        while (true) {
            size_t sp = s.find(' ', start);
            if (sp == string::npos) { words.push_back(s.substr(start)); break; }
            words.push_back(s.substr(start, sp - start));
            start = sp + 1;
        }
        int n = words.size();
        k %= n;
        string out;
        for (int i = 0; i < n; i++) {
            if (i) out += ' ';
            out += words[(k + i) % n];
        }
        return out;
    }
};`,
  },

  // hasXorPair(nums: List[int], target: int) -> bool  — complement-via-xor set.
  'pghub-xor-pair-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasXorPair(vector<int>& nums, int target) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (seen.count(x ^ target)) return true;
            seen.insert(x);
        }
        return false;
    }
};`,
  },

  // alternate(a: List[int], b: List[int]) -> List[int]  — interleave by index.
  'pghub-zigzag-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> alternate(vector<int>& a, vector<int>& b) {
        vector<int> out;
        int n = max(a.size(), b.size());
        for (int i = 0; i < n; i++) {
            if (i < (int)a.size()) out.push_back(a[i]);
            if (i < (int)b.size()) out.push_back(b[i]);
        }
        return out;
    }
};`,
  },

  // zigzagEncode(s: str, rows: int) -> str  — zigzag bucket join (same as b51).
  'pghub-zigzag-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string zigzagEncode(string s, int rows) {
        if (rows == 1 || rows >= (int)s.size()) return s;
        vector<string> buckets(rows);
        int r = 0, step = 1;
        for (char ch : s) {
            buckets[r].push_back(ch);
            if (r == 0) step = 1;
            else if (r == rows - 1) step = -1;
            r += step;
        }
        string out;
        for (auto& b : buckets) out += b;
        return out;
    }
};`,
  },

  // checksum(s: str) -> int  — alternating-sign digit sum.
  'pghub-zip-checksum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int checksum(string s) {
        int total = 0;
        for (size_t i = 0; i < s.size(); i++) {
            int d = s[i] - '0';
            if (i % 2 == 0) total += d;
            else total -= d;
        }
        return total;
    }
};`,
  },

  // snakesAndLadders(input: List[List[int]]) -> int  — boustrophedon BFS.
  'snakes-and-ladders': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int snakesAndLadders(vector<vector<int>>& input) {
        auto& board = input;
        int n = board.size();
        int target = n * n;
        auto cell = [&](int num) -> int {
            int r = (num - 1) / n;
            int c = (num - 1) % n;
            if (r % 2 == 1) c = n - 1 - c;
            return board[n - 1 - r][c];
        };
        unordered_set<int> seen{1};
        queue<pair<int,int>> q;
        q.push({1, 0});
        while (!q.empty()) {
            auto [cur, moves] = q.front(); q.pop();
            if (cur == target) return moves;
            for (int nxt = cur + 1; nxt <= min(cur + 6, target); nxt++) {
                int dest = cell(nxt);
                int landing = (dest != -1) ? dest : nxt;
                if (!seen.count(landing)) {
                    seen.insert(landing);
                    q.push({landing, moves + 1});
                }
            }
        }
        return -1;
    }
};`,
  },
};
