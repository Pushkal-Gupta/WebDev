// C++ translations of verified Python canonicals — cpp-gap-targets slice [212, 265).
// Each cpp body matches generateTemplate(language='cpp', ...) signature exactly:
// containers (vector<...>/string) passed by reference, primitives by value,
// return type via ct(). Idiomatic C++: long long for overflow-prone sums,
// non-negative modulo, ceil-division via (a + b - 1) / b.
export default {
  // letterCombos(digits: str) -> List[str] — keypad backtracking.
  'pghub-b27-keypad-words': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> letterCombos(string& digits) {
        if (digits.empty()) return {};
        unordered_map<char, string> mapping = {
            {'2', "abc"}, {'3', "def"}, {'4', "ghi"}, {'5', "jkl"},
            {'6', "mno"}, {'7', "pqrs"}, {'8', "tuv"}, {'9', "wxyz"}
        };
        vector<string> res;
        string cur;
        function<void(int)> backtrack = [&](int i) {
            if (i == (int)digits.size()) { res.push_back(cur); return; }
            for (char ch : mapping[digits[i]]) {
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

  // longestShared(a: str, b: str) -> int — LCS length, rolling rows.
  'pghub-b27-lcs-length': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestShared(string& a, string& b) {
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

  // longestWindow(nums: List[int], limit: int) -> int — sliding-window sum ≤ limit.
  'pghub-b27-longest-window-sum': {
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

  // maxMeetings(intervals: List[List[int]]) -> int — greedy by end time.
  'pghub-b27-max-meetings': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxMeetings(vector<vector<int>>& intervals) {
        vector<vector<int>> arr = intervals;
        sort(arr.begin(), arr.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int count = 0;
        long long last_end = LLONG_MIN;
        for (auto& iv : arr) {
            if (iv[0] >= last_end) { count++; last_end = iv[1]; }
        }
        return count;
    }
};`,
  },

  // minSpeed(piles: List[int], hours: int) -> int — binary search on eating speed.
  'pghub-b27-min-eat-speed': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpeed(vector<int>& piles, int hours) {
        auto hours_needed = [&](long long v) {
            long long total = 0;
            for (int p : piles) total += (p + v - 1) / v;
            return total;
        };
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours_needed(mid) <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // minPathCost(grid: List[List[int]]) -> int — DP down/diagonal.
  'pghub-b27-min-path-cost': {
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

  // totalSetBits(n: int) -> int — count set bits in 0..n.
  'pghub-b27-popcount-range': {
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
        return (int)total;
    }
};`,
  },

  // minFixes(s: str) -> int — min bracket insertions.
  'pghub-b30-balanced-brackets': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFixes(string& s) {
        int open_count = 0, inserts = 0;
        for (char ch : s) {
            if (ch == '(') open_count++;
            else {
                if (open_count > 0) open_count--;
                else inserts++;
            }
        }
        return inserts + open_count;
    }
};`,
  },

  // cheapestRoute(n, roads: List[List[int]], src, dst) -> int — directed Dijkstra.
  'pghub-b30-warehouse-routes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> graph(n);
        for (auto& r : roads) graph[r[0]].push_back({r[1], r[2]});
        vector<long long> dist(n, LLONG_MAX);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dst) return (int)d;
            for (auto& [v, w] : graph[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        return dist[dst] != LLONG_MAX ? (int)dist[dst] : -1;
    }
};`,
  },

  // cheapestRoute(n, roads: List[List[int]], start, dest) -> int — undirected Dijkstra.
  'pghub-b31-bridge-tolls': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& roads, int start, int dest) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        vector<long long> dist(n, LLONG_MAX);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, start});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dest) return (int)d;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        return dist[dest] == LLONG_MAX ? -1 : (int)dist[dest];
    }
};`,
  },

  // countCombinations(digits: str) -> int — product of keypad letter counts.
  'pghub-b31-keypad-words': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countCombinations(string& digits) {
        if (digits.empty()) return 0;
        unordered_map<char,int> sizes = {
            {'2',3},{'3',3},{'4',3},{'5',3},{'6',3},{'7',4},{'8',3},{'9',4}
        };
        long long total = 1;
        for (char d : digits) total *= sizes[d];
        return (int)total;
    }
};`,
  },

  // countDecodings(s: str) -> int — decode-ways DP.
  'pghub-b32-signal-decode': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countDecodings(string& s) {
        int n = s.size();
        if (n == 0) return 0;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        dp[1] = s[0] != '0' ? 1 : 0;
        for (int i = 2; i <= n; i++) {
            if (s[i - 1] != '0') dp[i] += dp[i - 1];
            int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
        return (int)dp[n];
    }
};`,
  },

  // compress(s: str) -> str — run-length compression.
  'pghub-b33-string-compress': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string compress(string& s) {
        string out;
        int i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            int count = j - i;
            out.push_back(s[i]);
            if (count > 1) out += to_string(count);
            i = j;
        }
        return out;
    }
};`,
  },

  // minPresses(word: str) -> int — assign frequent chars to cheaper presses.
  'pghub-b34-keypad-presses': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPresses(string& word) {
        unordered_map<char,int> cnt;
        for (char c : word) cnt[c]++;
        vector<int> freq;
        for (auto& [k, v] : cnt) freq.push_back(v);
        sort(freq.begin(), freq.end(), greater<int>());
        int total = 0;
        for (int idx = 0; idx < (int)freq.size(); idx++) {
            int cost = idx / 9 + 1;
            total += cost * freq[idx];
        }
        return total;
    }
};`,
  },

  // matchPrefix(routes: List[str], address: str) -> str — longest matching route prefix.
  'pghub-b34-prefix-router': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string matchPrefix(vector<string>& routes, string& address) {
        struct Node { unordered_map<char, Node*> ch; bool end = false; };
        Node* root = new Node();
        for (auto& r : routes) {
            Node* node = root;
            for (char c : r) {
                if (!node->ch.count(c)) node->ch[c] = new Node();
                node = node->ch[c];
            }
            node->end = true;
        }
        Node* node = root;
        string best, cur;
        for (char c : address) {
            if (!node->ch.count(c)) break;
            node = node->ch[c];
            cur.push_back(c);
            if (node->end) best = cur;
        }
        return best;
    }
};`,
  },

  // longestBalanced(s: str) -> int — longest substring with equal a/b via first-seen balance.
  'pghub-b34-token-stream': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestBalanced(string& s) {
        unordered_map<int,int> first;
        first[0] = -1;
        int bal = 0, best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            bal += s[i] == 'a' ? 1 : -1;
            if (first.count(bal)) best = max(best, i - first[bal]);
            else first[bal] = i;
        }
        return best;
    }
};`,
  },

  // maxDepth(parent: List[int]) -> int — deepest path from root via children map.
  'pghub-b35-circuit-tree': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(vector<int>& parent) {
        int n = parent.size();
        if (n == 0) return 0;
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

  // mutationSteps(start, end, bank: List[str]) -> int — BFS over gene mutations.
  'pghub-b35-gene-mutation': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mutationSteps(string& start, string& end, vector<string>& bank) {
        unordered_set<string> bank_set(bank.begin(), bank.end());
        if (!bank_set.count(end)) return -1;
        queue<pair<string,int>> q;
        q.push({start, 0});
        unordered_set<string> seen = {start};
        string chars = "ACGT";
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            if (gene == end) return steps;
            for (int i = 0; i < (int)gene.size(); i++) {
                for (char ch : chars) {
                    if (ch == gene[i]) continue;
                    string nxt = gene;
                    nxt[i] = ch;
                    if (bank_set.count(nxt) && !seen.count(nxt)) {
                        seen.insert(nxt);
                        q.push({nxt, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
};`,
  },

  // cheapestLanterns(n, roads: List[List[int]], start) -> int — undirected Dijkstra to node 0.
  'pghub-b36-festival-lanterns': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestLanterns(int n, vector<vector<int>>& roads, int start) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        vector<long long> dist(n, LLONG_MAX);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> heap;
        heap.push({0, start});
        while (!heap.empty()) {
            auto [d, node] = heap.top(); heap.pop();
            if (d > dist[node]) continue;
            if (node == 0) return (int)d;
            for (auto& [nb, w] : adj[node]) {
                long long nd = d + w;
                if (nd < dist[nb]) { dist[nb] = nd; heap.push({nd, nb}); }
            }
        }
        return dist[0] != LLONG_MAX ? (int)dist[0] : -1;
    }
};`,
  },

  // countPatches(field: List[List[int]]) -> int — count connected 1-regions (4-dir flood).
  'pghub-b36-island-counter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPatches(vector<vector<int>>& field) {
        int rows = field.size(), cols = field[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dx[] = {1, -1, 0, 0}, dy[] = {0, 0, 1, -1};
        auto flood = [&](int r, int c) {
            vector<pair<int,int>> stack = {{r, c}};
            seen[r][c] = true;
            while (!stack.empty()) {
                auto [x, y] = stack.back(); stack.pop_back();
                for (int k = 0; k < 4; k++) {
                    int nx = x + dx[k], ny = y + dy[k];
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !seen[nx][ny] && field[nx][ny] == 1) {
                        seen[nx][ny] = true;
                        stack.push_back({nx, ny});
                    }
                }
            }
        };
        int count = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (field[r][c] == 1 && !seen[r][c]) { count++; flood(r, c); }
        return count;
    }
};`,
  },

  // toggleCost(a: int, b: int) -> int — popcount of xor.
  'pghub-b36-signal-toggle': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int toggleCost(int a, int b) {
        return __builtin_popcount((unsigned)(a ^ b));
    }
};`,
  },

  // isValid(s: str) -> bool — bracket matching.
  'pghub-b36-token-bucket': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isValid(string& s) {
        unordered_map<char,char> pairs = {{')','('},{']','['},{'}','{'}};
        vector<char> stack;
        for (char ch : s) {
            if (pairs.count(ch)) {
                if (stack.empty() || stack.back() != pairs[ch]) return false;
                stack.pop_back();
            } else {
                stack.push_back(ch);
            }
        }
        return stack.empty();
    }
};`,
  },

  // sameFinal(a: str, b: str) -> bool — backspace-string compare.
  'pghub-b36-typist-backspace': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool sameFinal(string& a, string& b) {
        auto build = [](const string& s) {
            string out;
            for (char ch : s) {
                if (ch == '#') { if (!out.empty()) out.pop_back(); }
                else out.push_back(ch);
            }
            return out;
        };
        return build(a) == build(b);
    }
};`,
  },

  // rollingCipher(s: str, k: int) -> str — per-index Caesar shift.
  'pghub-b37-cipher-shift': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rollingCipher(string& s, int k) {
        string out;
        for (int i = 0; i < (int)s.size(); i++) {
            int shift = ((k + i) % 26 + 26) % 26;
            out.push_back((char)(((s[i] - 'a' + shift) % 26) + 'a'));
        }
        return out;
    }
};`,
  },

  // minRecolor(tiles: str) -> int — DP over 3 colors, no two adjacent equal.
  'pghub-b38-color-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRecolor(string& tiles) {
        string colors = "RGB";
        int n = tiles.size();
        unordered_map<char,int> dp;
        for (char c : colors) dp[c] = (tiles[0] == c) ? 0 : 1;
        for (int i = 1; i < n; i++) {
            unordered_map<char,int> ndp;
            for (char c : colors) {
                int cost = (tiles[i] == c) ? 0 : 1;
                int best_prev = INT_MAX;
                for (char p : colors) if (p != c) best_prev = min(best_prev, dp[p]);
                ndp[c] = best_prev + cost;
            }
            dp = ndp;
        }
        int ans = INT_MAX;
        for (char c : colors) ans = min(ans, dp[c]);
        return ans;
    }
};`,
  },

  // compareVersions(a: str, b: str) -> int — dotted version compare.
  'pghub-b38-version-compare': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compareVersions(string& a, string& b) {
        auto parse = [](const string& s) {
            vector<long long> parts;
            stringstream ss(s);
            string tok;
            while (getline(ss, tok, '.')) parts.push_back(stoll(tok));
            return parts;
        };
        vector<long long> pa = parse(a), pb = parse(b);
        int n = max(pa.size(), pb.size());
        pa.resize(n, 0);
        pb.resize(n, 0);
        for (int i = 0; i < n; i++) {
            if (pa[i] < pb[i]) return -1;
            if (pa[i] > pb[i]) return 1;
        }
        return 0;
    }
};`,
  },

  // isBalanced(s: str) -> bool — bracket matching.
  'pghub-b40-bracket-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string& s) {
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

  // shortestRoute(n, roads: List[List[int]], src, dst) -> int — undirected Dijkstra.
  'pghub-b40-courier-routes': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        vector<long long> dist(n, LLONG_MAX);
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
        return dist[dst] != LLONG_MAX ? (int)dist[dst] : -1;
    }
};`,
  },

  // complement(strand: str) -> str — reverse complement of DNA.
  'pghub-b40-dna-complement': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string complement(string& strand) {
        unordered_map<char,char> pair = {{'A','T'},{'T','A'},{'C','G'},{'G','C'}};
        string out;
        for (int i = (int)strand.size() - 1; i >= 0; i--) out.push_back(pair[strand[i]]);
        return out;
    }
};`,
  },

  // longestRun(fence: str, k: int) -> int — longest window with ≤k recolors (char-replacement).
  'pghub-b40-paint-fence-runs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRun(string& fence, int k) {
        unordered_map<char,int> counts;
        int left = 0, best = 0, max_freq = 0;
        for (int right = 0; right < (int)fence.size(); right++) {
            counts[fence[right]]++;
            max_freq = max(max_freq, counts[fence[right]]);
            while ((right - left + 1) - max_freq > k) {
                counts[fence[left]]--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // minSpend(prices: List[int], pass3: int) -> int — DP, single or 3-bundle.
  'pghub-b41-discount-tiers': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpend(vector<int>& prices, int pass3) {
        int n = prices.size();
        vector<long long> dp(n + 1, 0);
        for (int i = n - 1; i >= 0; i--) {
            long long pay = (long long)prices[i] + dp[i + 1];
            long long bundle = (long long)pass3 + dp[min(i + 3, n)];
            dp[i] = min(pay, bundle);
        }
        return (int)dp[0];
    }
};`,
  },

  // minRate(plants: List[int], days: int) -> int — binary search on watering rate.
  'pghub-b41-garden-water-days': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRate(vector<int>& plants, int days) {
        long long budget = (long long)days * 8;
        auto hours = [&](long long r) {
            long long total = 0;
            for (int p : plants) total += (p + r - 1) / r;
            return total;
        };
        int lo = 1, hi = *max_element(plants.begin(), plants.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours(mid) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // countClusters(grid: List[List[int]]) -> int — connected 1-regions.
  'pghub-b41-island-cluster-count': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countClusters(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stack = {{sr, sc}};
                    seen[sr][sc] = true;
                    while (!stack.empty()) {
                        auto [r, c] = stack.back(); stack.pop_back();
                        for (int k = 0; k < 4; k++) {
                            int nr = r + dr[k], nc = c + dc[k];
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

  // finalBalance(ops: List[str]) -> int — apply/undo deltas.
  'pghub-b41-ledger-rollback': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalBalance(vector<string>& ops) {
        long long balance = 0;
        vector<long long> history;
        for (auto& op : ops) {
            if (op == "undo") {
                if (!history.empty()) { balance -= history.back(); history.pop_back(); }
            } else {
                long long delta = stoll(op);
                balance += delta;
                history.push_back(delta);
            }
        }
        return (int)balance;
    }
};`,
  },

  // minJoinCost(ropes: List[int]) -> int — Huffman-style min merge cost.
  'pghub-b41-rope-cut-cost': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minJoinCost(vector<int>& ropes) {
        if (ropes.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap(ropes.begin(), ropes.end());
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

  // heaviestUnder(weights: List[int], cap: int) -> int — max weight ≤ cap, else -1.
  'pghub-b41-shelf-weight-cap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int heaviestUnder(vector<int>& weights, int cap) {
        int best = -1;
        for (int w : weights) if (w <= cap && w > best) best = w;
        return best;
    }
};`,
  },

  // priceSpans(prices: List[int]) -> List[int] — monotonic-stack stock span.
  'pghub-b41-stack-span': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> priceSpans(vector<int>& prices) {
        vector<int> spans;
        vector<pair<int,int>> stack; // (price, span)
        for (int p : prices) {
            int span = 1;
            while (!stack.empty() && stack.back().first <= p) {
                span += stack.back().second;
                stack.pop_back();
            }
            stack.push_back({p, span});
            spans.push_back(span);
        }
        return spans;
    }
};`,
  },

  // countSubarrays(nums: List[int], k: int) -> int — prefix-sum count == k.
  'pghub-b41-subarray-sum-k': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int k) {
        unordered_map<long long,int> counts;
        counts[0] = 1;
        long long prefix = 0;
        int result = 0;
        for (int x : nums) {
            prefix += x;
            auto it = counts.find(prefix - k);
            if (it != counts.end()) result += it->second;
            counts[prefix]++;
        }
        return result;
    }
};`,
  },

  // canBalance(flows: List[int]) -> bool — exists prefix == half of total.
  'pghub-b41-toll-booth-balance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canBalance(vector<int>& flows) {
        long long total = 0;
        for (int x : flows) total += x;
        long long left = 0;
        if (left * 2 == total) return true;
        for (int x : flows) {
            left += x;
            if (left * 2 == total) return true;
        }
        return false;
    }
};`,
  },

  // trappedWater(heights: List[int]) -> int — two-pointer trapping rain water.
  'pghub-b41-trapped-basins': {
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
            if (heights[left] < heights[right]) {
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

  // treeTilt(values: List[int]) -> int — array-encoded tree, -1 sentinel for absent node.
  'pghub-b41-tree-tilt': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int treeTilt(vector<int>& values) {
        int n = values.size();
        long long total = 0;
        function<long long(int)> subtree_sum = [&](int i) -> long long {
            if (i >= n || values[i] == -1) return 0;
            long long left = subtree_sum(2 * i + 1);
            long long right = subtree_sum(2 * i + 2);
            total += llabs(left - right);
            return values[i] + left + right;
        };
        subtree_sum(0);
        return (int)total;
    }
};`,
  },

  // shiftVowels(s: str) -> str — rotate each vowel to the next.
  'pghub-b41-vowel-shift': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftVowels(string& s) {
        unordered_map<char,char> nxt = {{'a','e'},{'e','i'},{'i','o'},{'o','u'},{'u','a'}};
        string out;
        for (char ch : s) out.push_back(nxt.count(ch) ? nxt[ch] : ch);
        return out;
    }
};`,
  },

  // transformSteps(start, end, words: List[str]) -> int — BFS word ladder (any-letter).
  'pghub-b41-word-ladder-len': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformSteps(string& start, string& end, vector<string>& words) {
        if (start == end) return 0;
        unordered_set<string> word_set(words.begin(), words.end());
        if (!word_set.count(end)) return -1;
        queue<pair<string,int>> q;
        q.push({start, 0});
        unordered_set<string> visited = {start};
        while (!q.empty()) {
            auto [word, steps] = q.front(); q.pop();
            if (word == end) return steps;
            for (int i = 0; i < (int)word.size(); i++) {
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == word[i]) continue;
                    string nxt = word;
                    nxt[i] = c;
                    if (word_set.count(nxt) && !visited.count(nxt)) {
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

  // hasXorPair(nums: List[int], target: int) -> bool — seen-set xor complement.
  'pghub-b41-xor-pair-target': {
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

  // balancedSplits(nums: List[int]) -> int — count split points with equal halves.
  'pghub-b43-balanced-split': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int balancedSplits(vector<int>& nums) {
        long long total = 0;
        for (int x : nums) total += x;
        long long left = 0;
        int count = 0;
        for (int i = 0; i < (int)nums.size() - 1; i++) {
            left += nums[i];
            if (left == total - left) count++;
        }
        return count;
    }
};`,
  },

  // elevatorTrips(weights: List[int], capacity: int) -> int — greedy bin packing in order.
  'pghub-b43-elevator-trips': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int elevatorTrips(vector<int>& weights, int capacity) {
        int trips = 0;
        long long cur = 0;
        for (int w : weights) {
            if (cur + w > capacity) { trips++; cur = 0; }
            cur += w;
        }
        if (cur > 0) trips++;
        return trips;
    }
};`,
  },

  // countPlots(grid: List[List[int]]) -> int — connected 1-regions.
  'pghub-b43-island-count': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPlots(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stack = {{sr, sc}};
                    seen[sr][sc] = true;
                    while (!stack.empty()) {
                        auto [r, c] = stack.back(); stack.pop_back();
                        for (int k = 0; k < 4; k++) {
                            int nr = r + dr[k], nc = c + dc[k];
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

  // maxOverlap(meetings: List[List[int]]) -> int — sweep-line max concurrency.
  'pghub-b43-meeting-overlap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxOverlap(vector<vector<int>>& meetings) {
        vector<pair<int,int>> events;
        for (auto& m : meetings) {
            events.push_back({m[0], 1});
            events.push_back({m[1], -1});
        }
        sort(events.begin(), events.end(), [](const pair<int,int>& a, const pair<int,int>& b){
            if (a.first != b.first) return a.first < b.first;
            return a.second < b.second;
        });
        int cur = 0, best = 0;
        for (auto& [t, delta] : events) {
            cur += delta;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // minPlatforms(trains: List[List[int]]) -> int — sort by arrival, heap of departures.
  'pghub-b43-min-platforms': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPlatforms(vector<vector<int>>& trains) {
        vector<vector<int>> order = trains;
        sort(order.begin(), order.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> busy;
        int best = 0;
        for (auto& t : order) {
            int arr = t[0], dep = t[1];
            while (!busy.empty() && busy.top() < arr) busy.pop();
            busy.push(dep);
            if ((int)busy.size() > best) best = busy.size();
        }
        return best;
    }
};`,
  },

  // smallestPrimeGap(lo: int, hi: int) -> int — sieve then min adjacent gap.
  'pghub-b43-prime-gap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int smallestPrimeGap(int lo, int hi) {
        vector<bool> sieve(hi + 1, true);
        sieve[0] = false;
        if (hi >= 1) sieve[1] = false;
        for (long long p = 2; p * p <= hi; p++) {
            if (sieve[p]) {
                for (long long m = p * p; m <= hi; m += p) sieve[m] = false;
            }
        }
        vector<int> primes;
        for (int x = lo; x <= hi; x++) if (x >= 0 && sieve[x]) primes.push_back(x);
        if ((int)primes.size() < 2) return -1;
        int best = INT_MAX;
        for (int i = 0; i + 1 < (int)primes.size(); i++)
            best = min(best, primes[i + 1] - primes[i]);
        return best;
    }
};`,
  },

  // findInRotated(nums: List[int], target: int) -> int — binary search in rotated array.
  'pghub-b43-rotate-search': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findInRotated(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};`,
  },
};
