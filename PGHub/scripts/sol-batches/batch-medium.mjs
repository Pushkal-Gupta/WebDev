// Batch: first 20 Medium / presentCount===0 targets from
// scripts/solutions-backfill-targets.json. Each value is the METHOD BODY ONLY
// in the LeetCode-style class/function shape that wrapWithDriver expects, with
// signatures matching generateTemplate(language, method_name, params, return_type)
// exactly (verified against PGcode_problems in the DB).
//
// Skipped (see report): remove-duplicates-from-sorted-array-ii (expected output
// is a non-JSON LeetCode display string "k, nums = [...]"), unique-binary-
// search-trees-ii (order/serialization-sensitive array of trees, return Any),
// find-bottom-left-tree-value (param typed List[int] but inputs contain `null`
// tokens that the int-array parser cannot parse), flatten-binary-tree-to-linked-
// list (return None — driver prints "null" and never re-serializes the mutated
// root, so it can never match the expected flattened-tree output).

export default {
  // numSmallerByFrequency(nums: List[str], target: List[str]) -> Any (List[int])
  // f(s) = count of the lexicographically smallest char. For each query word,
  // count how many words in `target` have strictly greater f-value.
  'compare-strings-by-frequency-of-the-smallest-character': {
    python: `class Solution:
    def numSmallerByFrequency(self, nums: List[str], target: List[str]) -> Any:
        def f(s):
            m = min(s)
            return s.count(m)
        word_f = sorted(f(w) for w in target)
        import bisect
        res = []
        for q in nums:
            fq = f(q)
            res.append(len(word_f) - bisect.bisect_right(word_f, fq))
        return res`,
    javascript: `var numSmallerByFrequency = function(nums, target) {
    const f = (s) => {
        let m = s[0];
        for (const c of s) if (c < m) m = c;
        let cnt = 0;
        for (const c of s) if (c === m) cnt++;
        return cnt;
    };
    const wordF = target.map(f).sort((a, b) => a - b);
    const upper = (x) => {
        let lo = 0, hi = wordF.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (wordF[mid] <= x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    };
    return nums.map(q => wordF.length - upper(f(q)));
};`,
    java: `import java.util.*;
class Solution {
    private int f(String s) {
        char m = s.charAt(0);
        for (char c : s.toCharArray()) if (c < m) m = c;
        int cnt = 0;
        for (char c : s.toCharArray()) if (c == m) cnt++;
        return cnt;
    }
    public int[] numSmallerByFrequency(String[] nums, String[] target) {
        int[] wordF = new int[target.length];
        for (int i = 0; i < target.length; i++) wordF[i] = f(target[i]);
        Arrays.sort(wordF);
        int[] res = new int[nums.length];
        for (int i = 0; i < nums.length; i++) {
            int fq = f(nums[i]);
            int lo = 0, hi = wordF.length;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (wordF[mid] <= fq) lo = mid + 1; else hi = mid;
            }
            res[i] = wordF.length - lo;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int f(const string& s) {
        char m = s[0];
        for (char c : s) if (c < m) m = c;
        int cnt = 0;
        for (char c : s) if (c == m) cnt++;
        return cnt;
    }
    vector<int> numSmallerByFrequency(vector<string>& nums, vector<string>& target) {
        vector<int> wordF;
        for (auto& w : target) wordF.push_back(f(w));
        sort(wordF.begin(), wordF.end());
        vector<int> res;
        for (auto& q : nums) {
            int fq = f(q);
            int idx = upper_bound(wordF.begin(), wordF.end(), fq) - wordF.begin();
            res.push_back((int)wordF.size() - idx);
        }
        return res;
    }
};`,
  },

  // rangeSum(nums: List[int], n: int, left: int, right: int) -> int
  // Build all subarray sums, sort, return 1-indexed inclusive [left,right] sum mod 1e9+7.
  'range-sum-of-sorted-subarray-sums': {
    python: `class Solution:
    def rangeSum(self, nums: List[int], n: int, left: int, right: int) -> int:
        MOD = 10**9 + 7
        sums = []
        for i in range(n):
            s = 0
            for j in range(i, n):
                s += nums[j]
                sums.append(s)
        sums.sort()
        return sum(sums[left - 1:right]) % MOD`,
    javascript: `var rangeSum = function(nums, n, left, right) {
    const MOD = 1000000007n;
    const sums = [];
    for (let i = 0; i < n; i++) {
        let s = 0;
        for (let j = i; j < n; j++) { s += nums[j]; sums.push(s); }
    }
    sums.sort((a, b) => a - b);
    let total = 0n;
    for (let i = left - 1; i < right; i++) total += BigInt(sums[i]);
    return Number(total % MOD);
};`,
    java: `import java.util.*;
class Solution {
    public int rangeSum(int[] nums, int n, int left, int right) {
        final int MOD = 1000000007;
        int[] sums = new int[n * (n + 1) / 2];
        int idx = 0;
        for (int i = 0; i < n; i++) {
            int s = 0;
            for (int j = i; j < n; j++) { s += nums[j]; sums[idx++] = s; }
        }
        Arrays.sort(sums);
        long total = 0;
        for (int i = left - 1; i < right; i++) total += sums[i];
        return (int)(total % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& nums, int n, int left, int right) {
        const long long MOD = 1000000007;
        vector<long long> sums;
        for (int i = 0; i < n; i++) {
            long long s = 0;
            for (int j = i; j < n; j++) { s += nums[j]; sums.push_back(s); }
        }
        sort(sums.begin(), sums.end());
        long long total = 0;
        for (int i = left - 1; i < right; i++) total += sums[i];
        return (int)(total % MOD);
    }
};`,
  },

  // uniquePaths(m: int, n: int) -> int  — DP grid count.
  'unique-paths': {
    python: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        dp = [1] * n
        for _ in range(1, m):
            for j in range(1, n):
                dp[j] += dp[j - 1]
        return dp[n - 1]`,
    javascript: `var uniquePaths = function(m, n) {
    const dp = new Array(n).fill(1);
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp[n - 1];
};`,
    java: `class Solution {
    public int uniquePaths(int m, int n) {
        int[] dp = new int[n];
        java.util.Arrays.fill(dp, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[j] += dp[j - 1];
            }
        }
        return dp[n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<long long> dp(n, 1);
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                dp[j] += dp[j - 1];
        return (int)dp[n - 1];
    }
};`,
  },

  // numberOfArithmeticSlices(nums: List[int]) -> int  — count arithmetic subarrays len>=3.
  'arithmetic-slices': {
    python: `class Solution:
    def numberOfArithmeticSlices(self, nums: List[int]) -> int:
        total = 0
        cur = 0
        for i in range(2, len(nums)):
            if nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]:
                cur += 1
                total += cur
            else:
                cur = 0
        return total`,
    javascript: `var numberOfArithmeticSlices = function(nums) {
    let total = 0, cur = 0;
    for (let i = 2; i < nums.length; i++) {
        if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) {
            cur++;
            total += cur;
        } else cur = 0;
    }
    return total;
};`,
    java: `class Solution {
    public int numberOfArithmeticSlices(int[] nums) {
        int total = 0, cur = 0;
        for (int i = 2; i < nums.length; i++) {
            if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {
                cur++;
                total += cur;
            } else cur = 0;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numberOfArithmeticSlices(vector<int>& nums) {
        int total = 0, cur = 0;
        for (int i = 2; i < (int)nums.size(); i++) {
            if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {
                cur++;
                total += cur;
            } else cur = 0;
        }
        return total;
    }
};`,
  },

  // maxOperations(nums: List[int], k: int) -> int  — count pairs summing to k.
  'max-number-of-k-sum-pairs': {
    python: `class Solution:
    def maxOperations(self, nums: List[int], k: int) -> int:
        from collections import Counter
        cnt = Counter(nums)
        ops = 0
        for x in list(cnt.keys()):
            y = k - x
            if y not in cnt:
                continue
            if x == y:
                ops += cnt[x] // 2
            elif x < y:
                ops += min(cnt[x], cnt[y])
        return ops`,
    javascript: `var maxOperations = function(nums, k) {
    const cnt = new Map();
    for (const x of nums) cnt.set(x, (cnt.get(x) || 0) + 1);
    let ops = 0;
    for (const [x, c] of cnt) {
        const y = k - x;
        if (!cnt.has(y)) continue;
        if (x === y) ops += Math.floor(c / 2);
        else if (x < y) ops += Math.min(c, cnt.get(y));
    }
    return ops;
};`,
    java: `import java.util.*;
class Solution {
    public int maxOperations(int[] nums, int k) {
        Map<Integer, Integer> cnt = new HashMap<>();
        for (int x : nums) cnt.merge(x, 1, Integer::sum);
        int ops = 0;
        for (Map.Entry<Integer, Integer> e : cnt.entrySet()) {
            int x = e.getKey(), c = e.getValue(), y = k - x;
            if (!cnt.containsKey(y)) continue;
            if (x == y) ops += c / 2;
            else if (x < y) ops += Math.min(c, cnt.get(y));
        }
        return ops;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxOperations(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        for (int x : nums) cnt[x]++;
        int ops = 0;
        for (auto& [x, c] : cnt) {
            int y = k - x;
            if (!cnt.count(y)) continue;
            if (x == y) ops += c / 2;
            else if (x < y) ops += min(c, cnt[y]);
        }
        return ops;
    }
};`,
  },

  // numIslands(grid: List[List[str]]) -> int  — DFS flood fill on '1' cells.
  'number-of-islands': {
    python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid or not grid[0]:
            return 0
        rows, cols = len(grid), len(grid[0])
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1
                    dfs(r, c)
        return count`,
    javascript: `var numIslands = function(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
    const rows = grid.length, cols = grid[0].length;
    const dfs = (r, c) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') { count++; dfs(r, c); }
        }
    }
    return count;
};`,
    java: `class Solution {
    private int rows, cols;
    public int numIslands(String[][] grid) {
        if (grid == null || grid.length == 0 || grid[0].length == 0) return 0;
        rows = grid.length; cols = grid[0].length;
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c].equals("1")) { count++; dfs(grid, r, c); }
            }
        }
        return count;
    }
    private void dfs(String[][] grid, int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || !grid[r][c].equals("1")) return;
        grid[r][c] = "0";
        dfs(grid, r + 1, c); dfs(grid, r - 1, c); dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
}`,
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

  // longestOnes(nums: List[int], k: int) -> int  — sliding window, <=k zeros.
  'max-consecutive-ones-iii': {
    python: `class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        left = 0
        zeros = 0
        best = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zeros += 1
            while zeros > k:
                if nums[left] == 0:
                    zeros -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,
    javascript: `var longestOnes = function(nums, k) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < nums.length; right++) {
        if (nums[right] === 0) zeros++;
        while (zeros > k) {
            if (nums[left] === 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
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
    int longestOnes(vector<int>& nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // kClosest(points: List[List[int]], k: int) -> List[List[int]]  — stable sort by sq dist.
  'k-closest-points-to-origin': {
    python: `class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        return sorted(points, key=lambda p: p[0] * p[0] + p[1] * p[1])[:k]`,
    javascript: `var kClosest = function(points, k) {
    const d = p => p[0] * p[0] + p[1] * p[1];
    return points
        .map((p, i) => [p, i])
        .sort((a, b) => (d(a[0]) - d(b[0])) || (a[1] - b[1]))
        .slice(0, k)
        .map(x => x[0]);
};`,
    java: `import java.util.*;
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        Integer[] idx = new Integer[points.length];
        for (int i = 0; i < points.length; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> {
            long da = (long) points[a][0] * points[a][0] + (long) points[a][1] * points[a][1];
            long db = (long) points[b][0] * points[b][0] + (long) points[b][1] * points[b][1];
            if (da != db) return Long.compare(da, db);
            return Integer.compare(a, b);
        });
        int[][] res = new int[k][];
        for (int i = 0; i < k; i++) res[i] = points[idx[i]];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        int n = points.size();
        vector<int> idx(n);
        for (int i = 0; i < n; i++) idx[i] = i;
        auto dist = [&](int i){ return (long long)points[i][0]*points[i][0] + (long long)points[i][1]*points[i][1]; };
        stable_sort(idx.begin(), idx.end(), [&](int a, int b){ return dist(a) < dist(b); });
        vector<vector<int>> res;
        for (int i = 0; i < k && i < n; i++) res.push_back(points[idx[i]]);
        return res;
    }
};`,
  },

  // merge(intervals: List[List[int]]) -> List[List[int]]  — sort + sweep.
  'merge-intervals': {
    python: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0][:]]
        for s, e in intervals[1:]:
            if s <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], e)
            else:
                merged.append([s, e])
        return merged`,
    javascript: `var merge = function(intervals) {
    if (!intervals || intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [[intervals[0][0], intervals[0][1]]];
    for (let i = 1; i < intervals.length; i++) {
        const [s, e] = intervals[i];
        const last = merged[merged.length - 1];
        if (s <= last[1]) last[1] = Math.max(last[1], e);
        else merged.push([s, e]);
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length == 0) return new int[0][0];
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        int[] cur = new int[]{intervals[0][0], intervals[0][1]};
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] <= cur[1]) {
                cur[1] = Math.max(cur[1], intervals[i][1]);
            } else {
                merged.add(cur);
                cur = new int[]{intervals[i][0], intervals[i][1]};
            }
        }
        merged.add(cur);
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        merged.push_back(intervals[0]);
        for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1])
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            else
                merged.push_back(intervals[i]);
        }
        return merged;
    }
};`,
  },

  // minAddToMakeValid(s: str) -> int  — count unmatched parens.
  'minimum-add-to-make-parentheses-valid': {
    python: `class Solution:
    def minAddToMakeValid(self, s: str) -> int:
        open_needed = 0
        balance = 0
        for c in s:
            if c == '(':
                balance += 1
            else:
                balance -= 1
                if balance < 0:
                    open_needed += 1
                    balance = 0
        return open_needed + balance`,
    javascript: `var minAddToMakeValid = function(s) {
    let openNeeded = 0, balance = 0;
    for (const c of s) {
        if (c === '(') balance++;
        else {
            balance--;
            if (balance < 0) { openNeeded++; balance = 0; }
        }
    }
    return openNeeded + balance;
};`,
    java: `class Solution {
    public int minAddToMakeValid(String s) {
        int openNeeded = 0, balance = 0;
        for (char c : s.toCharArray()) {
            if (c == '(') balance++;
            else {
                balance--;
                if (balance < 0) { openNeeded++; balance = 0; }
            }
        }
        return openNeeded + balance;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minAddToMakeValid(string s) {
        int openNeeded = 0, balance = 0;
        for (char c : s) {
            if (c == '(') balance++;
            else {
                balance--;
                if (balance < 0) { openNeeded++; balance = 0; }
            }
        }
        return openNeeded + balance;
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int  — DP with cooldown (3 states).
  'best-time-to-buy-and-sell-stock-with-cooldown': {
    python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        if not prices:
            return 0
        hold = float('-inf')
        sold = 0
        rest = 0
        for p in prices:
            prev_sold = sold
            sold = hold + p
            hold = max(hold, rest - p)
            rest = max(rest, prev_sold)
        return max(sold, rest)`,
    javascript: `var maxProfit = function(prices) {
    if (prices.length === 0) return 0;
    let hold = -Infinity, sold = 0, rest = 0;
    for (const p of prices) {
        const prevSold = sold;
        sold = hold + p;
        hold = Math.max(hold, rest - p);
        rest = Math.max(rest, prevSold);
    }
    return Math.max(sold, rest);
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        if (prices.length == 0) return 0;
        int hold = Integer.MIN_VALUE / 2, sold = 0, rest = 0;
        for (int p : prices) {
            int prevSold = sold;
            sold = hold + p;
            hold = Math.max(hold, rest - p);
            rest = Math.max(rest, prevSold);
        }
        return Math.max(sold, rest);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        if (prices.empty()) return 0;
        int hold = INT_MIN / 2, sold = 0, rest = 0;
        for (int p : prices) {
            int prevSold = sold;
            sold = hold + p;
            hold = max(hold, rest - p);
            rest = max(rest, prevSold);
        }
        return max(sold, rest);
    }
};`,
  },

  // maxAlternatingSum(nums: List[int]) -> int  — DP even/odd index parity.
  'maximum-alternating-subsequence-sum': {
    python: `class Solution:
    def maxAlternatingSum(self, nums: List[int]) -> int:
        even = 0
        odd = 0
        for x in nums:
            even, odd = max(even, odd + x), max(odd, even - x)
        return even`,
    javascript: `var maxAlternatingSum = function(nums) {
    let even = 0, odd = 0;
    for (const x of nums) {
        const newEven = Math.max(even, odd + x);
        const newOdd = Math.max(odd, even - x);
        even = newEven;
        odd = newOdd;
    }
    return even;
};`,
    java: `class Solution {
    public long maxAlternatingSum(int[] nums) {
        long even = 0, odd = 0;
        for (int x : nums) {
            long newEven = Math.max(even, odd + x);
            long newOdd = Math.max(odd, even - x);
            even = newEven;
            odd = newOdd;
        }
        return even;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long maxAlternatingSum(vector<int>& nums) {
        long long even = 0, odd = 0;
        for (int x : nums) {
            long long newEven = max(even, odd + x);
            long long newOdd = max(odd, even - x);
            even = newEven;
            odd = newOdd;
        }
        return even;
    }
};`,
  },

  // knightProbability(n: int, k: int, row: int, column: int) -> float  — DP over moves.
  'knight-probability-in-chessboard': {
    python: `class Solution:
    def knightProbability(self, n: int, k: int, row: int, column: int) -> float:
        moves = [(1, 2), (1, -2), (-1, 2), (-1, -2),
                 (2, 1), (2, -1), (-2, 1), (-2, -1)]
        dp = [[0.0] * n for _ in range(n)]
        dp[row][column] = 1.0
        for _ in range(k):
            ndp = [[0.0] * n for _ in range(n)]
            for r in range(n):
                for c in range(n):
                    if dp[r][c] == 0:
                        continue
                    for dr, dc in moves:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < n and 0 <= nc < n:
                            ndp[nr][nc] += dp[r][c] / 8.0
            dp = ndp
        return sum(sum(row_vals) for row_vals in dp)`,
    javascript: `var knightProbability = function(n, k, row, column) {
    const moves = [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]];
    let dp = Array.from({length: n}, () => new Array(n).fill(0));
    dp[row][column] = 1.0;
    for (let step = 0; step < k; step++) {
        const ndp = Array.from({length: n}, () => new Array(n).fill(0));
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (dp[r][c] === 0) continue;
                for (const [dr, dc] of moves) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                        ndp[nr][nc] += dp[r][c] / 8.0;
                    }
                }
            }
        }
        dp = ndp;
    }
    let total = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) total += dp[r][c];
    return total;
};`,
    java: `class Solution {
    public double knightProbability(int n, int k, int row, int column) {
        int[][] moves = {{1,2},{1,-2},{-1,2},{-1,-2},{2,1},{2,-1},{-2,1},{-2,-1}};
        double[][] dp = new double[n][n];
        dp[row][column] = 1.0;
        for (int step = 0; step < k; step++) {
            double[][] ndp = new double[n][n];
            for (int r = 0; r < n; r++) {
                for (int c = 0; c < n; c++) {
                    if (dp[r][c] == 0) continue;
                    for (int[] m : moves) {
                        int nr = r + m[0], nc = c + m[1];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                            ndp[nr][nc] += dp[r][c] / 8.0;
                        }
                    }
                }
            }
            dp = ndp;
        }
        double total = 0;
        for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) total += dp[r][c];
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double knightProbability(int n, int k, int row, int column) {
        int moves[8][2] = {{1,2},{1,-2},{-1,2},{-1,-2},{2,1},{2,-1},{-2,1},{-2,-1}};
        vector<vector<double>> dp(n, vector<double>(n, 0.0));
        dp[row][column] = 1.0;
        for (int step = 0; step < k; step++) {
            vector<vector<double>> ndp(n, vector<double>(n, 0.0));
            for (int r = 0; r < n; r++) {
                for (int c = 0; c < n; c++) {
                    if (dp[r][c] == 0) continue;
                    for (auto& m : moves) {
                        int nr = r + m[0], nc = c + m[1];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                            ndp[nr][nc] += dp[r][c] / 8.0;
                        }
                    }
                }
            }
            dp = ndp;
        }
        double total = 0;
        for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) total += dp[r][c];
        return total;
    }
};`,
  },

  // networkDelayTime(times: List[List[int]], n: int, k: int) -> int  — Dijkstra.
  'network-delay-time': {
    python: `class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        import heapq
        graph = [[] for _ in range(n + 1)]
        for u, v, w in times:
            graph[u].append((v, w))
        dist = [float('inf')] * (n + 1)
        dist[k] = 0
        pq = [(0, k)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            for v, w in graph[u]:
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(pq, (dist[v], v))
        ans = max(dist[1:])
        return -1 if ans == float('inf') else ans`,
    javascript: `var networkDelayTime = function(times, n, k) {
    const graph = Array.from({length: n + 1}, () => []);
    for (const [u, v, w] of times) graph[u].push([v, w]);
    const dist = new Array(n + 1).fill(Infinity);
    dist[k] = 0;
    // simple array-based priority selection (n is small)
    const pq = [[0, k]];
    while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, u] = pq.shift();
        if (d > dist[u]) continue;
        for (const [v, w] of graph[u]) {
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.push([dist[v], v]);
            }
        }
    }
    let ans = 0;
    for (let i = 1; i <= n; i++) ans = Math.max(ans, dist[i]);
    return ans === Infinity ? -1 : ans;
};`,
    java: `import java.util.*;
class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<int[]>[] graph = new List[n + 1];
        for (int i = 0; i <= n; i++) graph[i] = new ArrayList<>();
        for (int[] t : times) graph[t[0]].add(new int[]{t[1], t[2]});
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.offer(new int[]{0, k});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int d = cur[0], u = cur[1];
            if (d > dist[u]) continue;
            for (int[] e : graph[u]) {
                int v = e[0], w = e[1];
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    pq.offer(new int[]{dist[v], v});
                }
            }
        }
        int ans = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            ans = Math.max(ans, dist[i]);
        }
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int,int>>> graph(n + 1);
        for (auto& t : times) graph[t[0]].push_back({t[1], t[2]});
        vector<int> dist(n + 1, INT_MAX);
        dist[k] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
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
        int ans = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == INT_MAX) return -1;
            ans = max(ans, dist[i]);
        }
        return ans;
    }
};`,
  },

  // coinChange(coins: List[int], amount: int) -> int  — DP, -1 if impossible.
  'coin-change': {
    python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = amount + 1
        dp = [0] + [INF] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)
        return dp[amount] if dp[amount] <= amount else -1`,
    javascript: `var coinChange = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++)
        for (const c of coins)
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] <= amount ? dp[amount] : -1;
};`,
    java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        return dp[amount] <= amount ? dp[amount] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};`,
  },

  // countVowelStrings(n: int) -> int  — combinations C(n+4, 4).
  'count-sorted-vowel-strings': {
    python: `class Solution:
    def countVowelStrings(self, n: int) -> int:
        return (n + 1) * (n + 2) * (n + 3) * (n + 4) // 24`,
    javascript: `var countVowelStrings = function(n) {
    return (n + 1) * (n + 2) * (n + 3) * (n + 4) / 24;
};`,
    java: `class Solution {
    public int countVowelStrings(int n) {
        return (int)((long)(n + 1) * (n + 2) * (n + 3) * (n + 4) / 24);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countVowelStrings(int n) {
        return (int)((long long)(n + 1) * (n + 2) * (n + 3) * (n + 4) / 24);
    }
};`,
  },
};
