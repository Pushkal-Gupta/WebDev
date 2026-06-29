// xlate-cpp-7.mjs — C++ translations of verified Python canonicals.
// Slice [318,371) of cpp-gap-targets.json (py-present, cpp-missing).
// Auto-loaded by backfill-solutions.mjs; cpp graded via local Judge0; only
// passing is written to PGcode_problems.solutions.cpp.
//
// SKIPPED (tree-as-List[int]-with-null — _pgc_parse_vi stoi() throws on "null"):
//   pghub-b48-tree-tilt, pghub-b49-tree-levelmax, pghub-b50-tree-tilt

export default {
  // shortestPrefixes(words: List[str]) -> List[str]  — unique shortest prefix.
  'pghub-b47-trie-prefix': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> shortestPrefixes(vector<string>& words) {
        unordered_map<string,int> count;
        for (auto& w : words)
            for (size_t i = 1; i <= w.size(); i++)
                count[w.substr(0, i)]++;
        vector<string> res;
        for (auto& w : words) {
            string chosen = w;
            for (size_t i = 1; i <= w.size(); i++) {
                if (count[w.substr(0, i)] == 1) { chosen = w.substr(0, i); break; }
            }
            res.push_back(chosen);
        }
        return res;
    }
};`,
  },

  // mergeShelves(shelves: List[List[int]]) -> List[List[int]]  — merge with gap<=1.
  'pghub-b47-warehouse-merge': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeShelves(vector<vector<int>>& shelves) {
        vector<vector<int>> order = shelves;
        sort(order.begin(), order.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        for (auto& iv : order) {
            int s = iv[0], e = iv[1];
            if (!merged.empty() && s <= merged.back()[1] + 1) {
                if (e > merged.back()[1]) merged.back()[1] = e;
            } else {
                merged.push_back({s, e});
            }
        }
        return merged;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — OR of all bits, shifted by n-1.
  'pghub-b48-bitset-subsets': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        long long bits = 0;
        for (int x : nums) bits |= x;
        return (int)(bits << (nums.size() - 1));
    }
};`,
  },

  // numDecodings(s: str) -> int  — DP, 1/2-digit decode.
  'pghub-b48-decode-ways': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numDecodings(string s) {
        if (s.empty() || s[0] == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (size_t i = 1; i < s.size(); i++) {
            int cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
            if (two >= 10 && two <= 26) cur += prev2;
            if (cur == 0) return 0;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
};`,
  },

  // restFloor(moves: List[int]) -> int  — sum.
  'pghub-b48-elevator-stops': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restFloor(vector<int>& moves) {
        long long floor = 0;
        for (int m : moves) floor += m;
        return (int)floor;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — count edges.
  'pghub-b48-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
        return perim;
    }
};`,
  },

  // minJumps(nums: List[int]) -> int  — greedy jump game II.
  'pghub-b48-jump-reach': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minJumps(vector<int>& nums) {
        int n = nums.size(), jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            if (i + nums[i] > farthest) farthest = i + nums[i];
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
};`,
  },

  // kthDistinct(arr: List[str], k: int) -> str  — first-seen-order kth unique.
  'pghub-b48-kth-distinct': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string kthDistinct(vector<string>& arr, int k) {
        unordered_map<string,int> freq;
        for (auto& s : arr) freq[s]++;
        for (auto& s : arr) {
            if (freq[s] == 1) {
                k--;
                if (k == 0) return s;
            }
        }
        return "";
    }
};`,
  },

  // countEvictions(capacity: int, accesses: List[int]) -> int  — LRU eviction count.
  'pghub-b48-lru-evictions': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countEvictions(int capacity, vector<int>& accesses) {
        list<int> order;
        unordered_map<int, list<int>::iterator> pos;
        int evictions = 0;
        for (int key : accesses) {
            auto it = pos.find(key);
            if (it != pos.end()) {
                order.erase(it->second);
                order.push_back(key);
                pos[key] = prev(order.end());
            } else {
                if ((int)order.size() >= capacity) {
                    int old = order.front();
                    order.pop_front();
                    pos.erase(old);
                    evictions++;
                }
                order.push_back(key);
                pos[key] = prev(order.end());
            }
        }
        return evictions;
    }
};`,
  },

  // minRooms(meetings: List[List[int]]) -> int  — sweep starts/ends.
  'pghub-b48-meeting-rooms': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRooms(vector<vector<int>>& meetings) {
        vector<int> starts, ends;
        for (auto& m : meetings) { starts.push_back(m[0]); ends.push_back(m[1]); }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0, best = 0, j = 0;
        for (int s : starts) {
            while (j < (int)ends.size() && ends[j] <= s) { rooms--; j++; }
            rooms++;
            if (rooms > best) best = rooms;
        }
        return best;
    }
};`,
  },

  // countPairs(nums: List[int], target: int) -> int  — hashmap complement count.
  'pghub-b48-pair-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        long long count = 0;
        for (int x : nums) {
            count += seen[target - x];
            seen[x]++;
        }
        return (int)count;
    }
};`,
  },

  // sortedSquares(nums: List[int]) -> List[int]  — two-pointer from ends.
  'pghub-b48-sorted-square': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, 0);
        int lo = 0, hi = n - 1;
        for (int pos = n - 1; pos >= 0; pos--) {
            if (abs(nums[lo]) > abs(nums[hi])) {
                res[pos] = nums[lo] * nums[lo];
                lo++;
            } else {
                res[pos] = nums[hi] * nums[hi];
                hi--;
            }
        }
        return res;
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int  — best single buy/sell.
  'pghub-b48-stock-single': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int best = 0, cheapest = prices[0];
        for (int p : prices) {
            if (p < cheapest) cheapest = p;
            else if (p - cheapest > best) best = p - cheapest;
        }
        return best;
    }
};`,
  },

  // trapWater(height: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b48-trapping-water': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trapWater(vector<int>& height) {
        int lo = 0, hi = (int)height.size() - 1;
        int leftMax = 0, rightMax = 0;
        long long total = 0;
        while (lo < hi) {
            if (height[lo] < height[hi]) {
                if (height[lo] >= leftMax) leftMax = height[lo];
                else total += leftMax - height[lo];
                lo++;
            } else {
                if (height[hi] >= rightMax) rightMax = height[hi];
                else total += rightMax - height[hi];
                hi--;
            }
        }
        return (int)total;
    }
};`,
  },

  // shiftVowels(s: str) -> str  — rotate a->e->i->o->u->a.
  'pghub-b48-vowel-shift': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftVowels(string s) {
        unordered_map<char,char> nxt = {{'a','e'},{'e','i'},{'i','o'},{'o','u'},{'u','a'}};
        for (char& ch : s) {
            auto it = nxt.find(ch);
            if (it != nxt.end()) ch = it->second;
        }
        return s;
    }
};`,
  },

  // ladderLength(beginWord, endWord, wordList: List[str]) -> int  — BFS.
  'pghub-b48-word-ladder-len': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;
        queue<pair<string,int>> q;
        q.push({beginWord, 1});
        unordered_set<string> visited = {beginWord};
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == endWord) return dist;
            for (size_t i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    word[i] = ch;
                    if (words.count(word) && !visited.count(word)) {
                        visited.insert(word);
                        q.push({word, dist + 1});
                    }
                }
                word[i] = orig;
            }
        }
        return 0;
    }
};`,
  },

  // blockSum(nums: List[int], k: int) -> int  — alternating block sums.
  'pghub-b49-altsum': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int blockSum(vector<int>& nums, int k) {
        long long total = 0;
        int n = nums.size();
        for (int i = 0; i < n; i += k) {
            long long block = 0;
            for (int j = i; j < i + k && j < n; j++) block += nums[j];
            if ((i / k) % 2 == 0) total += block;
            else total -= block;
        }
        return (int)total;
    }
};`,
  },

  // maxDepth(s: str) -> int  — bracket nesting depth.
  'pghub-b49-bracket-depth': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(string s) {
        string opens = "([{", closes = ")]}";
        int depth = 0, best = 0;
        for (char c : s) {
            if (opens.find(c) != string::npos) {
                depth++;
                if (depth > best) best = depth;
            } else if (closes.find(c) != string::npos) {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // countRegions(grid: List[List[int]]) -> int  — flood fill same-color regions.
  'pghub-b49-color-island': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countRegions(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int count = 0;
        int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (seen[r][c]) continue;
                count++;
                int val = grid[r][c];
                vector<pair<int,int>> stack = {{r, c}};
                seen[r][c] = true;
                while (!stack.empty()) {
                    auto [cr, cc] = stack.back(); stack.pop_back();
                    for (int d = 0; d < 4; d++) {
                        int nr = cr + dr[d], nc = cc + dc[d];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                            && !seen[nr][nc] && grid[nr][nc] == val) {
                            seen[nr][nc] = true;
                            stack.push_back({nr, nc});
                        }
                    }
                }
            }
        }
        return count;
    }
};`,
  },

  // persistence(n: int) -> int  — multiplicative digital persistence.
  'pghub-b49-digit-spiral': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int persistence(int n) {
        int steps = 0;
        while (n >= 10) {
            long long prod = 1;
            for (char ch : to_string(n)) prod *= (ch - '0');
            n = (int)prod;
            steps++;
        }
        return steps;
    }
};`,
  },

  // longestTwoDistinct(s: str) -> int  — longest substring with <=2 distinct.
  'pghub-b49-distinct-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestTwoDistinct(string s) {
        unordered_map<char,int> counts;
        int left = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            counts[s[right]]++;
            while ((int)counts.size() > 2) {
                char d = s[left];
                if (--counts[d] == 0) counts.erase(d);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // minStops(fuel: List[int], tank: int) -> int  — greedy max-heap refuel.
  'pghub-b49-fuel-stops': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minStops(vector<int>& fuel, int tank) {
        int n = fuel.size();
        priority_queue<int> pq;
        int cur = tank, stops = 0;
        for (int i = 0; i < n; i++) {
            if (i > 0) cur -= 1;
            while (cur < 0 && !pq.empty()) {
                cur += pq.top(); pq.pop();
                stops++;
            }
            if (cur < 0) return -1;
            if (fuel[i] > 0) pq.push(fuel[i]);
        }
        return stops;
    }
};`,
  },

  // kthSmallest(lists: List[List[int]], k: int) -> int  — k-way merge heap.
  'pghub-b49-kth-merged': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSmallest(vector<vector<int>>& lists, int k) {
        // (value, listIndex, elemIndex)
        priority_queue<tuple<int,int,int>, vector<tuple<int,int,int>>, greater<>> pq;
        for (int li = 0; li < (int)lists.size(); li++)
            if (!lists[li].empty()) pq.push({lists[li][0], li, 0});
        int result = 0;
        for (int t = 0; t < k; t++) {
            auto [val, li, idx] = pq.top(); pq.pop();
            result = val;
            if (idx + 1 < (int)lists[li].size())
                pq.push({lists[li][idx + 1], li, idx + 1});
        }
        return result;
    }
};`,
  },

  // busyTime(intervals: List[List[int]]) -> int  — merged interval coverage.
  'pghub-b49-merge-busy': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int busyTime(vector<vector<int>>& intervals) {
        vector<vector<int>> order = intervals;
        sort(order.begin(), order.end());
        long long total = 0;
        int cs = order[0][0], ce = order[0][1];
        for (size_t i = 1; i < order.size(); i++) {
            int s = order[i][0], e = order[i][1];
            if (s <= ce) ce = max(ce, e);
            else { total += ce - cs; cs = s; ce = e; }
        }
        total += ce - cs;
        return (int)total;
    }
};`,
  },

  // minSpeed(piles: List[int], hours: int) -> int  — binary search on speed.
  'pghub-b49-min-speed': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpeed(vector<int>& piles, int hours) {
        auto hoursAt = [&](long long v) {
            long long h = 0;
            for (int p : piles) h += (p + v - 1) / v;
            return h;
        };
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursAt(mid) <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // closestPairSum(nums: List[int], target: int) -> int  — two-pointer closest sum.
  'pghub-b49-pair-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairSum(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        int best = nums[0] + nums[1];
        while (lo < hi) {
            int s = nums[lo] + nums[hi];
            if (abs(s - target) < abs(best - target)
                || (abs(s - target) == abs(best - target) && s < best)) {
                best = s;
            }
            if (s == target) return s;
            else if (s < target) lo++;
            else hi--;
        }
        return best;
    }
};`,
  },

  // countSubsets(nums: List[int], target: int) -> int  — DFS subset-sum count.
  'pghub-b49-subset-target': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubsets(vector<int>& nums, int target) {
        int n = nums.size(), count = 0;
        function<void(int,int)> dfs = [&](int i, int remaining) {
            if (remaining == 0) { count++; return; }
            if (i == n || remaining < 0) return;
            dfs(i + 1, remaining - nums[i]);
            dfs(i + 1, remaining);
        };
        dfs(0, target);
        return count;
    }
};`,
  },

  // countWays(n: int, steps: List[int]) -> int  — DP path count mod 1e9+7.
  'pghub-b49-tiling-paths': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(int n, vector<int>& steps) {
        const long long MOD = 1000000007;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            long long total = 0;
            for (int s : steps)
                if (i - s >= 0) total += dp[i - s];
            dp[i] = total % MOD;
        }
        return (int)dp[n];
    }
};`,
  },

  // findSingle(nums: List[int]) -> int  — XOR all.
  'pghub-b49-xor-toggle': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findSingle(vector<int>& nums) {
        int acc = 0;
        for (int x : nums) acc ^= x;
        return acc;
    }
};`,
  },

  // balancedSplits(s: str) -> int  — count zero-balance prefixes.
  'pghub-b50-balanced-split': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int balancedSplits(string s) {
        int balance = 0, count = 0;
        for (char ch : s) {
            balance += (ch == 'R') ? 1 : -1;
            if (balance == 0) count++;
        }
        return count;
    }
};`,
  },

  // fewestCoins(coins: List[int], amount: int) -> int  — min-coin DP, -1 if none.
  'pghub-b50-coin-change-min': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int fewestCoins(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};`,
  },

  // digitSpread(n: int) -> int  — sum of (maxDigit-minDigit) over 0..n.
  'pghub-b50-digit-spread': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitSpread(int n) {
        long long total = 0;
        for (int x = 0; x <= n; x++) {
            string d = to_string(x);
            char mx = *max_element(d.begin(), d.end());
            char mn = *min_element(d.begin(), d.end());
            if (mx != mn) total += (mx - '0') - (mn - '0');
        }
        return (int)total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — count edges.
  'pghub-b50-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
        return perim;
    }
};`,
  },

  // knightMoves(n: int, start: List[int], target: List[int]) -> int  — BFS.
  'pghub-b50-knight-min': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int knightMoves(int n, vector<int>& start, vector<int>& target) {
        int sr = start[0], sc = start[1], tr = target[0], tc = target[1];
        if (sr == tr && sc == tc) return 0;
        int moves[8][2] = {{1,2},{2,1},{-1,2},{-2,1},{1,-2},{2,-1},{-1,-2},{-2,-1}};
        queue<tuple<int,int,int>> q;
        q.push({sr, sc, 0});
        set<pair<int,int>> visited = {{sr, sc}};
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (auto& m : moves) {
                int nr = r + m[0], nc = c + m[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.count({nr, nc})) {
                    if (nr == tr && nc == tc) return d + 1;
                    visited.insert({nr, nc});
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // kthDistinct(nums: List[int], k: int) -> int  — first-order kth unique int.
  'pghub-b50-kth-distinct': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthDistinct(vector<int>& nums, int k) {
        unordered_map<int,int> freq;
        for (int x : nums) freq[x]++;
        int seen = 0;
        for (int x : nums) {
            if (freq[x] == 1) {
                seen++;
                if (seen == k) return x;
            }
        }
        return -1;
    }
};`,
  },

  // distinctInWindows(nums: List[int], k: int) -> List[int]  — distinct per window.
  'pghub-b50-lru-window': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> distinctInWindows(vector<int>& nums, int k) {
        int n = nums.size();
        if (k > n) return {};
        unordered_map<int,int> freq;
        vector<int> res;
        for (int i = 0; i < n; i++) {
            freq[nums[i]]++;
            if (i >= k) {
                int old = nums[i - k];
                if (--freq[old] == 0) freq.erase(old);
            }
            if (i >= k - 1) res.push_back((int)freq.size());
        }
        return res;
    }
};`,
  },

  // longestGap(meetings: List[List[int]], dayEnd: int) -> int  — free gap.
  'pghub-b50-meeting-gap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestGap(vector<vector<int>>& meetings, int dayEnd) {
        if (meetings.empty()) return dayEnd;
        vector<vector<int>> order = meetings;
        sort(order.begin(), order.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        int best = 0, cursor = 0;
        for (auto& iv : order) {
            int s = iv[0], e = iv[1];
            if (s > cursor) best = max(best, s - cursor);
            cursor = max(cursor, e);
        }
        if (dayEnd > cursor) best = max(best, dayEnd - cursor);
        return best;
    }
};`,
  },

  // reverseBlocks(nums: List[int], k: int) -> List[int]  — reverse full k-blocks.
  'pghub-b50-reverse-blocks': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reverseBlocks(vector<int>& nums, int k) {
        vector<int> res = nums;
        int n = res.size(), i = 0;
        while (i + k <= n) {
            int lo = i, hi = i + k - 1;
            while (lo < hi) { swap(res[lo], res[hi]); lo++; hi--; }
            i += k;
        }
        return res;
    }
};`,
  },

  // searchMatrix(matrix: List[List[int]], target: int) -> bool  — staircase search.
  'pghub-b50-search-2d': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int rows = matrix.size(), cols = matrix[0].size();
        int r = 0, c = cols - 1;
        while (r < rows && c >= 0) {
            int v = matrix[r][c];
            if (v == target) return true;
            if (v > target) c--;
            else r++;
        }
        return false;
    }
};`,
  },

  // sortStack(stack: List[int]) -> List[int]  — sort using auxiliary stack.
  'pghub-b50-stack-sort': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortStack(vector<int>& stack) {
        vector<int> src = stack, aux;
        while (!src.empty()) {
            int tmp = src.back(); src.pop_back();
            while (!aux.empty() && aux.back() > tmp) {
                src.push_back(aux.back());
                aux.pop_back();
            }
            aux.push_back(tmp);
        }
        return aux;
    }
};`,
  },

  // zeroXorSubsets(nums: List[int]) -> int  — linear-basis rank, 2^free - 1 mod.
  'pghub-b50-subset-xor': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int zeroXorSubsets(vector<int>& nums) {
        const long long MOD = 1000000007;
        vector<int> basis;
        for (int x : nums) {
            int cur = x;
            for (int b : basis) cur = min(cur, cur ^ b);
            if (cur) {
                basis.push_back(cur);
                sort(basis.begin(), basis.end(), greater<int>());
            }
        }
        int rank = basis.size();
        int freeCount = (int)nums.size() - rank;
        long long pw = 1;
        for (int i = 0; i < freeCount; i++) pw = (pw * 2) % MOD;
        return (int)((pw - 1 + MOD) % MOD);
    }
};`,
  },

  // idleSlots(tasks: List[str], cooldown: int) -> int  — task scheduler idle.
  'pghub-b50-task-scheduler': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int idleSlots(vector<string>& tasks, int cooldown) {
        unordered_map<string,int> freq;
        for (auto& t : tasks) freq[t]++;
        int maxFreq = 0;
        for (auto& [k, v] : freq) maxFreq = max(maxFreq, v);
        int maxCount = 0;
        for (auto& [k, v] : freq) if (v == maxFreq) maxCount++;
        int frame = (maxFreq - 1) * (cooldown + 1) + maxCount;
        int totalSlots = max(frame, (int)tasks.size());
        return totalSlots - (int)tasks.size();
    }
};`,
  },

  // transformLength(begin, end, words: List[str]) -> int  — BFS word ladder.
  'pghub-b50-word-ladder-len': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformLength(string begin, string end, vector<string>& words) {
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(end)) return 0;
        queue<pair<string,int>> q;
        q.push({begin, 1});
        unordered_set<string> visited = {begin};
        while (!q.empty()) {
            auto [word, steps] = q.front(); q.pop();
            if (word == end) return steps;
            for (size_t i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    word[i] = ch;
                    if (wordSet.count(word) && !visited.count(word)) {
                        visited.insert(word);
                        q.push({word, steps + 1});
                    }
                }
                word[i] = orig;
            }
        }
        return 0;
    }
};`,
  },

  // longestGap(n: int) -> int  — longest run of 0s between 1s in binary.
  'pghub-b51-binary-gap': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestGap(int n) {
        int best = 0, current = -1;
        while (n > 0) {
            int bit = n & 1;
            n >>= 1;
            if (bit == 1) {
                if (current > best) best = current;
                current = 0;
            } else if (current >= 0) {
                current++;
            }
        }
        return best;
    }
};`,
  },

  // changeWays(coins: List[int], amount: int) -> int  — coin combination count.
  'pghub-b51-coin-combos': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int changeWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int coin : coins)
            for (int a = coin; a <= amount; a++)
                dp[a] += dp[a - coin];
        return (int)dp[amount];
    }
};`,
  },

  // totalEnergy(floors: List[int]) -> int  — sum abs adjacent diffs.
  'pghub-b51-elevator-stops': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalEnergy(vector<int>& floors) {
        long long total = 0;
        for (size_t i = 1; i < floors.size(); i++)
            total += abs(floors[i] - floors[i - 1]);
        return (int)total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — count edges.
  'pghub-b51-island-perimeter': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perimeter = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
        return perimeter;
    }
};`,
  },

  // canReachEnd(jump: List[int]) -> bool  — jump game reachability.
  'pghub-b51-jump-reach': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReachEnd(vector<int>& jump) {
        int reach = 0, last = (int)jump.size() - 1;
        for (int i = 0; i < (int)jump.size(); i++) {
            if (i > reach) return false;
            reach = max(reach, i + jump[i]);
            if (reach >= last) return true;
        }
        return true;
    }
};`,
  },

  // kthLargestAfter(k: int, stream: List[int]) -> List[int]  — running kth largest.
  'pghub-b51-kth-largest': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargestAfter(int k, vector<int>& stream) {
        priority_queue<int, vector<int>, greater<int>> heap;
        vector<int> res;
        for (int x : stream) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
            if ((int)heap.size() < k) res.push_back(-1);
            else res.push_back(heap.top());
        }
        return res;
    }
};`,
  },

  // editDistance(a: str, b: str) -> int  — Levenshtein DP (rolling row).
  'pghub-b51-min-edit': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int editDistance(string a, string b) {
        int m = a.size(), n = b.size();
        vector<int> dp(n + 1);
        for (int j = 0; j <= n; j++) dp[j] = j;
        for (int i = 1; i <= m; i++) {
            int prev = dp[0];
            dp[0] = i;
            for (int j = 1; j <= n; j++) {
                int tmp = dp[j];
                if (a[i - 1] == b[j - 1]) dp[j] = prev;
                else dp[j] = 1 + min({prev, dp[j], dp[j - 1]});
                prev = tmp;
            }
        }
        return dp[n];
    }
};`,
  },
};
