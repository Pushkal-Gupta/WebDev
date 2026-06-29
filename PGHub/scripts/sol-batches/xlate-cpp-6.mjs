// xlate-cpp-6.mjs — Python→C++ translations for problems that already have a
// verified-correct Python solution but are missing the C++ language.
// Slice [265,318) of scripts/cpp-gap-targets.json.
// Signatures match generateTemplate('cpp', method_name, params, return_type) exactly.
// The runner grades cpp via Judge0 and writes only passing solutions.

export default {
  // longestTrail(grid: List[List[int]]) -> int — memoized DFS longest increasing path.
  'pghub-b43-snake-path': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestTrail(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> memo(rows, vector<int>(cols, 0));
        function<int(int,int)> dfs = [&](int r, int c) -> int {
            if (memo[r][c]) return memo[r][c];
            int best = 1;
            int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] > grid[r][c])
                    best = max(best, 1 + dfs(nr, nc));
            }
            memo[r][c] = best;
            return best;
        };
        int ans = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                ans = max(ans, dfs(r, c));
        return ans;
    }
};`,
  },

  // stampWays(stamps: List[int], amount: int) -> int — unbounded combination count DP.
  'pghub-b43-stamp-ways': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int stampWays(vector<int>& stamps, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int s : stamps)
            for (int a = s; a <= amount; a++)
                dp[a] += dp[a - s];
        return (int)dp[amount];
    }
};`,
  },

  // finalLength(ops: List[str]) -> int — stack of pushed values, U pops/subtracts.
  'pghub-b43-undo-stack': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalLength(vector<string>& ops) {
        vector<long long> st;
        long long total = 0;
        for (const string& op : ops) {
            if (op == "U") {
                if (!st.empty()) { total -= st.back(); st.pop_back(); }
            } else {
                long long x = 0;
                stringstream ss(op);
                string tok;
                ss >> tok >> x;
                st.push_back(x);
                total += x;
            }
        }
        return (int)total;
    }
};`,
  },

  // trappedWater(heights: List[int]) -> int — two-pointer water trapping.
  'pghub-b43-water-fill': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& heights) {
        if (heights.empty()) return 0;
        int left = 0, right = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0;
        long long total = 0;
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
        return (int)total;
    }
};`,
  },

  // chainLength(start: str, goal: str, words: List[str]) -> int — word-ladder BFS.
  'pghub-b43-word-ladder-len': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int chainLength(string start, string goal, vector<string>& words) {
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(goal)) return 0;
        queue<pair<string,int>> q;
        q.push({start, 1});
        unordered_set<string> visited;
        visited.insert(start);
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == goal) return dist;
            for (int i = 0; i < (int)word.size(); i++) {
                string nxt = word;
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == word[i]) continue;
                    nxt[i] = c;
                    if (wordSet.count(nxt) && !visited.count(nxt)) {
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

  // equalXorPairs(nums: List[int], target: int) -> int — count pairs xor==target via hash.
  'pghub-b43-xor-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int equalXorPairs(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        long long count = 0;
        for (int x : nums) {
            auto it = seen.find(x ^ target);
            if (it != seen.end()) count += it->second;
            seen[x]++;
        }
        return (int)count;
    }
};`,
  },

  // zigzagMerge(a: List[int], b: List[int]) -> List[int] — interleave two arrays.
  'pghub-b43-zigzag-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> zigzagMerge(vector<int>& a, vector<int>& b) {
        vector<int> res;
        size_t i = 0, j = 0;
        while (i < a.size() || j < b.size()) {
            if (i < a.size()) res.push_back(a[i++]);
            if (j < b.size()) res.push_back(b[j++]);
        }
        return res;
    }
};`,
  },

  // maxDepth(s: str) -> int — max paren nesting.
  'pghub-b44-bracket-depth': {
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

  // countInRange(tree: List[int], lo: int, hi: int) -> int — count non-sentinel values in [lo,hi].
  'pghub-b44-bst-range-count': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countInRange(vector<int>& tree, int lo, int hi) {
        int count = 0;
        for (int v : tree)
            if (v != -1 && lo <= v && v <= hi) count++;
        return count;
    }
};`,
  },

  // circularRob(houses: List[int]) -> int — house robber on a circle.
  'pghub-b44-circular-rob': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int circularRob(vector<int>& houses) {
        int n = houses.size();
        if (n == 1) return houses[0];
        auto robLine = [](const vector<int>& arr, int lo, int hi) -> long long {
            long long prev = 0, cur = 0;
            for (int i = lo; i < hi; i++) {
                long long t = max(cur, prev + arr[i]);
                prev = cur; cur = t;
            }
            return cur;
        };
        return (int)max(robLine(houses, 0, n - 1), robLine(houses, 1, n));
    }
};`,
  },

  // closestPairSum(nums: List[int], target: int) -> int — sorted two-pointer closest sum.
  'pghub-b44-closest-pair-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairSum(vector<int>& nums, int target) {
        vector<int> arr = nums;
        sort(arr.begin(), arr.end());
        int lo = 0, hi = (int)arr.size() - 1;
        bool has = false;
        long long best = 0;
        while (lo < hi) {
            long long s = (long long)arr[lo] + arr[hi];
            if (!has || llabs(s - target) < llabs(best - target) ||
                (llabs(s - target) == llabs(best - target) && s < best)) {
                best = s; has = true;
            }
            if (s < target) lo++;
            else if (s > target) hi--;
            else return (int)s;
        }
        return (int)best;
    }
};`,
  },

  // distinctPerms(s: str) -> int — count distinct permutations via multiset backtracking.
  'pghub-b44-distinct-perms': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctPerms(string s) {
        unordered_map<char,int> counts;
        for (char c : s) counts[c]++;
        long long result = 0;
        int n = s.size();
        function<void(int)> backtrack = [&](int remaining) {
            if (remaining == 0) { result++; return; }
            for (auto& kv : counts) {
                if (kv.second > 0) {
                    kv.second--;
                    backtrack(remaining - 1);
                    kv.second++;
                }
            }
        };
        backtrack(n);
        return (int)result;
    }
};`,
  },

  // trailingZeros(n: int) -> int — count factors of 5 in n!.
  'pghub-b44-factorial-zeros': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trailingZeros(int n) {
        long long count = 0, p = 5;
        while (p <= n) {
            count += n / p;
            p *= 5;
        }
        return (int)count;
    }
};`,
  },

  // intSqrt(x: int) -> int — integer square root via binary search.
  'pghub-b44-int-sqrt': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int intSqrt(int x) {
        if (x < 2) return x;
        long long lo = 1, hi = x, ans = 1;
        while (lo <= hi) {
            long long mid = (lo + hi) / 2;
            if (mid * mid <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int)ans;
    }
};`,
  },

  // kthLargest(nums: List[int], k: int) -> int — min-heap of size k.
  'pghub-b44-kth-largest': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
        }
        return heap.top();
    }
};`,
  },

  // longestAtMostK(nums: List[int], k: int) -> int — longest window with sum<=k (non-negatives).
  'pghub-b44-longest-le-k': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestAtMostK(vector<int>& nums, int k) {
        int left = 0, best = 0;
        long long cur = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            cur += nums[right];
            while (cur > k) { cur -= nums[left]; left++; }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // coveredLength(intervals: List[List[int]]) -> int — total covered length after merge.
  'pghub-b44-merged-coverage': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int coveredLength(vector<vector<int>>& intervals) {
        vector<vector<int>> order = intervals;
        sort(order.begin(), order.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        long long total = 0;
        int curStart = order[0][0], curEnd = order[0][1];
        for (size_t i = 1; i < order.size(); i++) {
            int s = order[i][0], e = order[i][1];
            if (s <= curEnd) { if (e > curEnd) curEnd = e; }
            else { total += curEnd - curStart; curStart = s; curEnd = e; }
        }
        total += curEnd - curStart;
        return (int)total;
    }
};`,
  },

  // minCoins(amount: int) -> int — greedy US coin count.
  'pghub-b44-min-coins-greedy': {
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

  // runLength(s: str) -> str — run-length encode.
  'pghub-b44-run-length': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string runLength(string s) {
        if (s.empty()) return "";
        string out;
        char cur = s[0];
        int count = 1;
        for (size_t i = 1; i < s.size(); i++) {
            if (s[i] == cur) count++;
            else {
                out += cur;
                out += to_string(count);
                cur = s[i];
                count = 1;
            }
        }
        out += cur;
        out += to_string(count);
        return out;
    }
};`,
  },

  // secondLargest(nums: List[int]) -> int — second distinct max, -1 if none.
  'pghub-b44-second-largest': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int secondLargest(vector<int>& nums) {
        bool hasFirst = false, hasSecond = false;
        long long first = 0, second = 0;
        for (int x : nums) {
            if (!hasFirst || x > first) {
                if (hasFirst) { second = first; hasSecond = true; }
                first = x; hasFirst = true;
            } else if (x != first && (!hasSecond || x > second)) {
                second = x; hasSecond = true;
            }
        }
        return hasSecond ? (int)second : -1;
    }
};`,
  },

  // shortestHops(n, edges: List[List[int]], src, dst) -> int — undirected BFS shortest path.
  'pghub-b44-shortest-path-len': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestHops(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<int> dist(n, -1);
        dist[src] = 0;
        queue<int> q;
        q.push(src);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            if (node == dst) return dist[node];
            for (int nxt : adj[node]) {
                if (dist[nxt] == -1) {
                    dist[nxt] = dist[node] + 1;
                    q.push(nxt);
                }
            }
        }
        return dist[dst];
    }
};`,
  },

  // totalSetBits(nums: List[int]) -> int — popcount sum (Kernighan).
  'pghub-b44-total-set-bits': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalSetBits(vector<int>& nums) {
        long long total = 0;
        for (int x : nums) {
            unsigned int u = (unsigned int)x;
            while (u) { u &= u - 1; total++; }
        }
        return (int)total;
    }
};`,
  },

  // maxDepth(s: str) -> int — max paren nesting.
  'pghub-b45-bracket-depth': {
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

  // rangeSum(tree: List[int], lo: int, hi: int) -> int — array-tree DFS sum in range.
  'pghub-b45-bst-range-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& tree, int lo, int hi) {
        if (tree.empty() || tree[0] == -1) return 0;
        int n = tree.size();
        long long total = 0;
        vector<int> stack;
        stack.push_back(0);
        while (!stack.empty()) {
            int idx = stack.back(); stack.pop_back();
            if (idx >= n || tree[idx] == -1) continue;
            int val = tree[idx];
            if (lo <= val && val <= hi) total += val;
            stack.push_back(2 * idx + 1);
            stack.push_back(2 * idx + 2);
        }
        return (int)total;
    }
};`,
  },

  // minCoins(coins: List[int], amount: int) -> int — min-coin DP, -1 if impossible.
  'pghub-b45-coin-min': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(vector<int>& coins, int amount) {
        const int INF = INT_MAX;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] != INF && dp[a - c] + 1 < dp[a])
                    dp[a] = dp[a - c] + 1;
        return dp[amount] == INF ? -1 : dp[amount];
    }
};`,
  },

  // diagonalDiff(matrix: List[List[int]]) -> int — |primary - secondary| diagonal sum.
  'pghub-b45-diagonal-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int diagonalDiff(vector<vector<int>>& matrix) {
        int n = matrix.size();
        long long primary = 0, secondary = 0;
        for (int i = 0; i < n; i++) {
            primary += matrix[i][i];
            secondary += matrix[i][n - 1 - i];
        }
        return (int)llabs(primary - secondary);
    }
};`,
  },

  // editDistance(a: str, b: str) -> int — Levenshtein DP (rolling rows).
  'pghub-b45-edit-distance': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int editDistance(string a, string b) {
        int m = a.size(), n = b.size();
        vector<int> prev(n + 1), cur(n + 1);
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            cur[0] = i;
            for (int j = 1; j <= n; j++) {
                if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1];
                else cur[j] = 1 + min({prev[j], cur[j - 1], prev[j - 1]});
            }
            swap(prev, cur);
        }
        return prev[n];
    }
};`,
  },

  // minMaxBox(gifts: List[int], boxes: int) -> int — minimize max box load (binary search).
  'pghub-b45-gift-distribution': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMaxBox(vector<int>& gifts, int boxes) {
        auto feasible = [&](long long cap) -> bool {
            int used = 1;
            long long cur = 0;
            for (int g : gifts) {
                if (cur + g > cap) { used++; cur = 0; }
                cur += g;
            }
            return used <= boxes;
        };
        long long lo = *max_element(gifts.begin(), gifts.end());
        long long hi = 0;
        for (int g : gifts) hi += g;
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // isBipartite(edges: List[List[int]], n: int) -> bool — BFS 2-coloring.
  'pghub-b45-graph-bipartite': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBipartite(vector<vector<int>>& edges, int n) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<int> color(n, -1);
        for (int start = 0; start < n; start++) {
            if (color[start] != -1) continue;
            color[start] = 0;
            queue<int> q;
            q.push(start);
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int w : adj[u]) {
                    if (color[w] == -1) { color[w] = 1 - color[u]; q.push(w); }
                    else if (color[w] == color[u]) return false;
                }
            }
        }
        return true;
    }
};`,
  },

  // totalPresses(text: str) -> int — T9 keypad press cost.
  'pghub-b45-keypad-presses': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalPresses(string text) {
        vector<string> groups = {"abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};
        unordered_map<char,int> cost;
        for (const string& g : groups)
            for (int i = 0; i < (int)g.size(); i++)
                cost[g[i]] = i + 1;
        long long total = 0;
        for (char c : text) total += cost[c];
        return (int)total;
    }
};`,
  },

  // clampSum(nums: List[int], lo: int, hi: int) -> int — sum of clamped values.
  'pghub-b45-roman-clamp': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int clampSum(vector<int>& nums, int lo, int hi) {
        long long total = 0;
        for (int x : nums) {
            if (x < lo) total += lo;
            else if (x > hi) total += hi;
            else total += x;
        }
        return (int)total;
    }
};`,
  },

  // rotateRight(nums: List[int], k: int) -> List[int] — rotate array right by k.
  'pghub-b45-rotate-array': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        if (k == 0) return nums;
        vector<int> res;
        res.reserve(n);
        for (int i = n - k; i < n; i++) res.push_back(nums[i]);
        for (int i = 0; i < n - k; i++) res.push_back(nums[i]);
        return res;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int — sum of all subset XORs = OR << (n-1).
  'pghub-b45-subset-xor-total': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        long long orAll = 0;
        for (int x : nums) orAll |= x;
        return (int)(orAll << (nums.size() - 1));
    }
};`,
  },

  // scheduleTime(tasks: List[str], cooldown: int) -> int — task scheduler interval count.
  'pghub-b45-task-cooldown': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int scheduleTime(vector<string>& tasks, int cooldown) {
        unordered_map<string,int> counts;
        for (const string& t : tasks) counts[t]++;
        int maxCount = 0;
        for (auto& kv : counts) maxCount = max(maxCount, kv.second);
        int numMax = 0;
        for (auto& kv : counts) if (kv.second == maxCount) numMax++;
        long long candidate = (long long)(maxCount - 1) * (cooldown + 1) + numMax;
        return (int)max((long long)tasks.size(), candidate);
    }
};`,
  },

  // longestVowelRun(s: str) -> int — longest consecutive vowel run.
  'pghub-b45-vowel-runs': {
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
            } else cur = 0;
        }
        return best;
    }
};`,
  },

  // maxDistinct(nums: List[int], k: int) -> int — max distinct in window size k.
  'pghub-b45-window-distinct': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDistinct(vector<int>& nums, int k) {
        int n = nums.size();
        if (k >= n) {
            unordered_set<int> all(nums.begin(), nums.end());
            return (int)all.size();
        }
        unordered_map<int,int> freq;
        for (int i = 0; i < k; i++) freq[nums[i]]++;
        int best = freq.size();
        for (int i = k; i < n; i++) {
            freq[nums[i]]++;
            int old = nums[i - k];
            if (--freq[old] == 0) freq.erase(old);
            if ((int)freq.size() > best) best = freq.size();
        }
        return best;
    }
};`,
  },

  // maxNesting(s: str) -> int — max paren nesting (no closing guard needed).
  'pghub-b46-bracket-depth': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxNesting(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') { depth++; if (depth > best) best = depth; }
            else depth--;
        }
        return best;
    }
};`,
  },

  // maxCoins(coins: List[int]) -> int — house-robber style max non-adjacent sum.
  'pghub-b46-coin-rows': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCoins(vector<int>& coins) {
        long long take = 0, skip = 0;
        for (int c : coins) {
            long long newTake = skip + c;
            long long newSkip = max(skip, take);
            take = newTake; skip = newSkip;
        }
        return (int)max(take, skip);
    }
};`,
  },

  // minFlips(s: str) -> int — count adjacent differing transitions.
  'pghub-b46-flip-segments': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFlips(string s) {
        int flips = 0;
        for (size_t i = 1; i < s.size(); i++)
            if (s[i] != s[i - 1]) flips++;
        return flips;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int — perimeter of land cells.
  'pghub-b46-grid-region-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
            }
        }
        return perim;
    }
};`,
  },

  // powMod(base: int, exp: int, mod: int) -> int — fast modular exponentiation.
  'pghub-b46-modular-power': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int powMod(int base, int exp, int mod) {
        if (mod == 1) return 0;
        long long result = 1;
        long long b = ((long long)base % mod + mod) % mod;
        long long e = exp;
        while (e > 0) {
            if (e & 1) result = (result * b) % mod;
            b = (b * b) % mod;
            e >>= 1;
        }
        return (int)result;
    }
};`,
  },

  // closestPairDiff(temps: List[int]) -> int — min adjacent diff after sort.
  'pghub-b46-pair-temperature': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairDiff(vector<int>& temps) {
        vector<int> s = temps;
        sort(s.begin(), s.end());
        int best = INT_MAX;
        for (size_t i = 0; i + 1 < s.size(); i++)
            best = min(best, s[i + 1] - s[i]);
        return best;
    }
};`,
  },

  // romanToInt(s: str) -> int — roman numeral to integer.
  'pghub-b46-roman-toll': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int romanToInt(string s) {
        unordered_map<char,int> vals = {{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};
        int total = 0;
        for (size_t i = 0; i < s.size(); i++) {
            int v = vals[s[i]];
            if (i + 1 < s.size() && vals[s[i + 1]] > v) total -= v;
            else total += v;
        }
        return total;
    }
};`,
  },

  // findRotation(nums: List[int]) -> int — index of min in rotated sorted array.
  'pghub-b46-rotate-vault': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findRotation(vector<int>& nums) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // longestStable(readings: List[int], limit: int) -> int — longest window max-min<=limit (monotonic deques).
  'pghub-b46-sensor-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestStable(vector<int>& readings, int limit) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)readings.size(); right++) {
            int v = readings[right];
            while (!maxDq.empty() && readings[maxDq.back()] <= v) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && readings[minDq.back()] >= v) minDq.pop_back();
            minDq.push_back(right);
            while (readings[maxDq.front()] - readings[minDq.front()] > limit) {
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

  // canPartition(nums: List[int]) -> bool — subset equal partition via bitset.
  'pghub-b46-subset-equal-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int target = total / 2;
        vector<char> dp(target + 1, 0);
        dp[0] = 1;
        for (int x : nums)
            for (int a = target; a >= x; a--)
                if (dp[a - x]) dp[a] = 1;
        return dp[target] == 1;
    }
};`,
  },

  // maxProfit(jobs: List[List[int]]) -> int — deadline scheduling, max total profit.
  'pghub-b46-task-deadlines': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<vector<int>>& jobs) {
        vector<vector<int>> order = jobs;
        sort(order.begin(), order.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& j : order) {
            int deadline = j[0], profit = j[1];
            heap.push(profit);
            if ((int)heap.size() > deadline) heap.pop();
        }
        long long total = 0;
        while (!heap.empty()) { total += heap.top(); heap.pop(); }
        return (int)total;
    }
};`,
  },

  // admitted(arrivals: List[int], rate: int, capacity: int) -> int — token-bucket admission count.
  'pghub-b46-token-bucket': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int admitted(vector<int>& arrivals, int rate, int capacity) {
        long long tokens = capacity;
        long long prev = arrivals[0];
        int count = 0;
        for (int i = 0; i < (int)arrivals.size(); i++) {
            long long t = arrivals[i];
            if (i > 0) {
                tokens = min((long long)capacity, tokens + (t - prev) * rate);
                prev = t;
            }
            if (tokens >= 1) { tokens -= 1; count++; }
        }
        return count;
    }
};`,
  },

  // verticalSums(tree: List[int]) -> List[int] — array-tree BFS vertical column sums.
  'pghub-b46-tree-vertical-sum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> verticalSums(vector<int>& tree) {
        if (tree.empty() || tree[0] == -1) return {};
        int n = tree.size();
        map<int,long long> colSum;
        queue<pair<int,int>> q;
        q.push({0, 0});
        while (!q.empty()) {
            auto [idx, col] = q.front(); q.pop();
            if (idx >= n || tree[idx] == -1) continue;
            colSum[col] += tree[idx];
            int left = 2 * idx + 1, right = 2 * idx + 2;
            if (left < n && tree[left] != -1) q.push({left, col - 1});
            if (right < n && tree[right] != -1) q.push({right, col + 1});
        }
        int lo = colSum.begin()->first, hi = colSum.rbegin()->first;
        vector<int> res;
        for (int c = lo; c <= hi; c++) res.push_back((int)colSum[c]);
        return res;
    }
};`,
  },

  // prefixCounts(words: List[str], queries: List[str]) -> List[int] — trie prefix counts.
  'pghub-b46-trie-autocomplete': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> prefixCounts(vector<string>& words, vector<string>& queries) {
        struct Node { int count = 0; unordered_map<char, Node*> next; };
        Node* root = new Node();
        for (const string& w : words) {
            Node* node = root;
            for (char ch : w) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
                node->count++;
            }
        }
        vector<int> res;
        for (const string& q : queries) {
            Node* node = root;
            bool ok = true;
            for (char ch : q) {
                if (!node->next.count(ch)) { ok = false; break; }
                node = node->next[ch];
            }
            res.push_back(ok ? node->count : 0);
        }
        return res;
    }
};`,
  },

  // restockTrips(demands: List[int], cartSize: int) -> int — first-fit trip count.
  'pghub-b46-warehouse-aisles': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockTrips(vector<int>& demands, int cartSize) {
        int trips = 0, load = 0;
        for (int d : demands) {
            if (load + d > cartSize) { trips++; load = 0; }
            load += d;
        }
        if (load > 0) trips++;
        return trips;
    }
};`,
  },

  // maxDepth(s: str) -> int — max paren nesting.
  'pghub-b47-bracket-depth': {
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

  // maxItems(prices: List[int], budget: int) -> int — greedy buy cheapest first.
  'pghub-b47-budget-greedy': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxItems(vector<int>& prices, int budget) {
        vector<int> sorted = prices;
        sort(sorted.begin(), sorted.end());
        long long spent = 0;
        int bought = 0;
        for (int p : sorted) {
            if (spent + p > budget) break;
            spent += p;
            bought++;
        }
        return bought;
    }
};`,
  },
};
