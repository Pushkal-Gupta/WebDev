// xlate-4.mjs — faithful JS/Java/C++ translations of verified Python references
// for slugs at filtered-targets indices [90, 120). Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
// Reference = solutions.python in PGcode_problems. Graded by backfill-solutions.mjs
// against stored test_cases via Judge0; only passing langs are written.
//
// SKIPPED (reported, not present here):
//   pghub-b15-tree-tilt — params is List[int] "values" but the test inputs carry
//     tree tokens ([1,null,3]); the int[]/vector<int> driver (Integer.parseInt /
//     stoi) cannot represent the `null` gaps, so it is not gradeable.

export default {
  // isBalanced(tokens: str) -> bool  — bracket-matching stack over the chars.
  'pghub-b15-token-stream': {
    javascript: `var isBalanced = function(tokens) {
    const pairs = { ')': '(', ']': '[' };
    const st = [];
    for (const ch of tokens) {
        if (ch === '(' || ch === '[') {
            st.push(ch);
        } else {
            if (st.length === 0 || st[st.length - 1] !== pairs[ch]) return false;
            st.pop();
        }
    }
    return st.length === 0;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isBalanced(String tokens) {
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '(');
        pairs.put(']', '[');
        Deque<Character> st = new ArrayDeque<>();
        for (char ch : tokens.toCharArray()) {
            if (ch == '(' || ch == '[') {
                st.push(ch);
            } else {
                if (st.isEmpty() || st.peek() != pairs.get(ch)) return false;
                st.pop();
            }
        }
        return st.isEmpty();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string tokens) {
        unordered_map<char, char> pairs = {{')', '('}, {']', '['}};
        vector<char> st;
        for (char ch : tokens) {
            if (ch == '(' || ch == '[') {
                st.push_back(ch);
            } else {
                if (st.empty() || st.back() != pairs[ch]) return false;
                st.pop_back();
            }
        }
        return st.empty();
    }
};`,
  },

  // restockCount(stock: List[int], threshold: int) -> int  — count below threshold.
  'pghub-b15-warehouse-aisles': {
    javascript: `var restockCount = function(stock, threshold) {
    let count = 0;
    for (const x of stock) if (x < threshold) count++;
    return count;
};`,
    java: `class Solution {
    public int restockCount(int[] stock, int threshold) {
        int count = 0;
        for (int x : stock) if (x < threshold) count++;
        return count;
    }
}`,
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

  // subsetSums(nums: List[int]) -> List[int]  — all distinct subset sums, sorted.
  'pghub-b15-word-ladder-cost': {
    javascript: `var subsetSums = function(nums) {
    const sums = new Set();
    const backtrack = (i, total) => {
        if (i === nums.length) { sums.add(total); return; }
        backtrack(i + 1, total);
        backtrack(i + 1, total + nums[i]);
    };
    backtrack(0, 0);
    return Array.from(sums).sort((a, b) => a - b);
};`,
    java: `import java.util.*;
class Solution {
    public int[] subsetSums(int[] nums) {
        Set<Integer> sums = new HashSet<>();
        backtrack(nums, 0, 0, sums);
        List<Integer> list = new ArrayList<>(sums);
        Collections.sort(list);
        int[] res = new int[list.size()];
        for (int i = 0; i < res.length; i++) res[i] = list.get(i);
        return res;
    }
    private void backtrack(int[] nums, int i, int total, Set<Integer> sums) {
        if (i == nums.length) { sums.add(total); return; }
        backtrack(nums, i + 1, total, sums);
        backtrack(nums, i + 1, total + nums[i], sums);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> subsetSums(vector<int>& nums) {
        set<int> sums;
        function<void(int,int)> backtrack = [&](int i, int total) {
            if (i == (int)nums.size()) { sums.insert(total); return; }
            backtrack(i + 1, total);
            backtrack(i + 1, total + nums[i]);
        };
        backtrack(0, 0);
        return vector<int>(sums.begin(), sums.end());
    }
};`,
  },

  // litLeds(minutes: int) -> int  — popcount (Brian Kernighan).
  'pghub-b16-binary-clock': {
    javascript: `var litLeds = function(minutes) {
    let count = 0;
    while (minutes) {
        minutes &= minutes - 1;
        count++;
    }
    return count;
};`,
    java: `class Solution {
    public int litLeds(int minutes) {
        int count = 0;
        while (minutes != 0) {
            minutes &= minutes - 1;
            count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int litLeds(int minutes) {
        int count = 0;
        while (minutes) {
            minutes &= minutes - 1;
            count++;
        }
        return count;
    }
};`,
  },

  // maxValue(costs, values, budget) -> int  — 0/1 knapsack, 1-D DP.
  'pghub-b16-budget-pick': {
    javascript: `var maxValue = function(costs, values, budget) {
    const dp = new Array(budget + 1).fill(0);
    for (let i = 0; i < costs.length; i++) {
        const c = costs[i], v = values[i];
        for (let b = budget; b >= c; b--) {
            const cand = dp[b - c] + v;
            if (cand > dp[b]) dp[b] = cand;
        }
    }
    return dp[budget];
};`,
    java: `class Solution {
    public int maxValue(int[] costs, int[] values, int budget) {
        int[] dp = new int[budget + 1];
        for (int i = 0; i < costs.length; i++) {
            int c = costs[i], v = values[i];
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + v;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return dp[budget];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxValue(vector<int>& costs, vector<int>& values, int budget) {
        vector<int> dp(budget + 1, 0);
        for (int i = 0; i < (int)costs.size(); i++) {
            int c = costs[i], v = values[i];
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + v;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return dp[budget];
    }
};`,
  },

  // decode(text: str, shift: int) -> str  — Caesar shift back over lowercase.
  'pghub-b16-cipher-rotate': {
    javascript: `var decode = function(text, shift) {
    const s = ((shift % 26) + 26) % 26;
    let out = '';
    for (const ch of text) {
        const code = (ch.charCodeAt(0) - 97 - s) % 26;
        out += String.fromCharCode(((code % 26) + 26) % 26 + 97);
    }
    return out;
};`,
    java: `class Solution {
    public String decode(String text, int shift) {
        int s = ((shift % 26) + 26) % 26;
        StringBuilder out = new StringBuilder();
        for (char ch : text.toCharArray()) {
            int code = (((ch - 'a' - s) % 26) + 26) % 26;
            out.append((char) (code + 'a'));
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decode(string text, int shift) {
        int s = ((shift % 26) + 26) % 26;
        string out;
        for (char ch : text) {
            int code = (((ch - 'a' - s) % 26) + 26) % 26;
            out += (char) (code + 'a');
        }
        return out;
    }
};`,
  },

  // maxSpan(floors: List[int]) -> int  — monotonic stack accumulating spans.
  'pghub-b16-elevator-floors': {
    javascript: `var maxSpan = function(floors) {
    const stack = []; // [floor, span]
    let best = 0;
    for (const f of floors) {
        let span = 1;
        while (stack.length && stack[stack.length - 1][0] <= f) {
            span += stack.pop()[1];
        }
        stack.push([f, span]);
        if (span > best) best = span;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxSpan(int[] floors) {
        Deque<int[]> stack = new ArrayDeque<>();
        int best = 0;
        for (int f : floors) {
            int span = 1;
            while (!stack.isEmpty() && stack.peek()[0] <= f) {
                span += stack.pop()[1];
            }
            stack.push(new int[]{f, span});
            if (span > best) best = span;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSpan(vector<int>& floors) {
        vector<pair<int,int>> stack; // (floor, span)
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

  // canInterleave(a, b, target) -> bool  — interleaving-string DP (rolling row).
  'pghub-b16-gene-merge': {
    javascript: `var canInterleave = function(a, b, target) {
    if (a.length + b.length !== target.length) return false;
    const m = a.length, n = b.length;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let j = 1; j <= n; j++) dp[j] = dp[j - 1] && b[j - 1] === target[j - 1];
    for (let i = 1; i <= m; i++) {
        dp[0] = dp[0] && a[i - 1] === target[i - 1];
        for (let j = 1; j <= n; j++) {
            dp[j] = (dp[j] && a[i - 1] === target[i + j - 1]) ||
                    (dp[j - 1] && b[j - 1] === target[i + j - 1]);
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public boolean canInterleave(String a, String b, String target) {
        if (a.length() + b.length() != target.length()) return false;
        int m = a.length(), n = b.length();
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j - 1] && b.charAt(j - 1) == target.charAt(j - 1);
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && a.charAt(i - 1) == target.charAt(i - 1);
            for (int j = 1; j <= n; j++) {
                dp[j] = (dp[j] && a.charAt(i - 1) == target.charAt(i + j - 1)) ||
                        (dp[j - 1] && b.charAt(j - 1) == target.charAt(i + j - 1));
            }
        }
        return dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canInterleave(string a, string b, string target) {
        if (a.size() + b.size() != target.size()) return false;
        int m = a.size(), n = b.size();
        vector<char> dp(n + 1, false);
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j - 1] && b[j - 1] == target[j - 1];
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && a[i - 1] == target[i - 1];
            for (int j = 1; j <= n; j++) {
                dp[j] = (dp[j] && a[i - 1] == target[i + j - 1]) ||
                        (dp[j - 1] && b[j - 1] == target[i + j - 1]);
            }
        }
        return dp[n];
    }
};`,
  },

  // countIslands(grid: List[List[int]]) -> int  — iterative DFS flood fill on 1s.
  'pghub-b16-island-count': {
    javascript: `var countIslands = function(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1 && !seen[r][c]) {
                count++;
                const stack = [[r, c]];
                seen[r][c] = true;
                while (stack.length) {
                    const [cr, cc] = stack.pop();
                    for (const [dr, dc] of dirs) {
                        const nr = cr + dr, nc = cc + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countIslands(int[][] grid) {
        if (grid == null || grid.length == 0 || grid[0].length == 0) return 0;
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    count++;
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{r, c});
                    seen[r][c] = true;
                    while (!stack.isEmpty()) {
                        int[] cur = stack.pop();
                        for (int[] d : dirs) {
                            int nr = cur[0] + d[0], nc = cur[1] + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push(new int[]{nr, nc});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countIslands(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    count++;
                    vector<pair<int,int>> stack = {{r, c}};
                    seen[r][c] = true;
                    while (!stack.empty()) {
                        auto [cr, cc] = stack.back(); stack.pop_back();
                        for (auto& d : dirs) {
                            int nr = cr + d[0], nc = cc + d[1];
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

  // mergeBookings(bookings: List[List[int]]) -> List[List[int]]  — sort + sweep.
  'pghub-b16-merge-intervals': {
    javascript: `var mergeBookings = function(bookings) {
    const arr = bookings.map(x => [x[0], x[1]]).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const merged = [];
    for (const [s, e] of arr) {
        if (merged.length && s <= merged[merged.length - 1][1]) {
            if (e > merged[merged.length - 1][1]) merged[merged.length - 1][1] = e;
        } else {
            merged.push([s, e]);
        }
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeBookings(int[][] bookings) {
        int[][] arr = Arrays.stream(bookings).map(int[]::clone).toArray(int[][]::new);
        Arrays.sort(arr, (p, q) -> p[0] != q[0] ? Integer.compare(p[0], q[0]) : Integer.compare(p[1], q[1]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : arr) {
            int s = iv[0], e = iv[1];
            if (!merged.isEmpty() && s <= merged.get(merged.size() - 1)[1]) {
                if (e > merged.get(merged.size() - 1)[1]) merged.get(merged.size() - 1)[1] = e;
            } else {
                merged.add(new int[]{s, e});
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
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

  // countPairs(positions: List[int], reach: int) -> int  — sort + sliding window.
  'pghub-b16-orchard-rows': {
    javascript: `var countPairs = function(positions, reach) {
    const arr = positions.slice().sort((a, b) => a - b);
    let left = 0, total = 0;
    for (let right = 0; right < arr.length; right++) {
        while (arr[right] - arr[left] > reach) left++;
        total += right - left;
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int countPairs(int[] positions, int reach) {
        int[] arr = positions.clone();
        Arrays.sort(arr);
        int left = 0, total = 0;
        for (int right = 0; right < arr.length; right++) {
            while (arr[right] - arr[left] > reach) left++;
            total += right - left;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& positions, int reach) {
        vector<int> arr = positions;
        sort(arr.begin(), arr.end());
        int left = 0, total = 0;
        for (int right = 0; right < (int)arr.size(); right++) {
            while (arr[right] - arr[left] > reach) left++;
            total += right - left;
        }
        return total;
    }
};`,
  },

  // paintWays(posts: int, colors: int) -> int  — paint-fence recurrence, mod 1e9+7.
  'pghub-b16-paint-fence': {
    javascript: `var paintWays = function(posts, colors) {
    const MOD = 1000000007n;
    if (posts === 0) return 0;
    const C = BigInt(colors);
    if (posts === 1) return Number(C % MOD);
    let same = C % MOD;
    let diff = (C * (C - 1n)) % MOD;
    for (let i = 3; i <= posts; i++) {
        const newSame = diff;
        const newDiff = ((same + diff) * (C - 1n)) % MOD;
        same = newSame % MOD;
        diff = newDiff;
    }
    return Number((same + diff) % MOD);
};`,
    java: `class Solution {
    public int paintWays(int posts, int colors) {
        long MOD = 1000000007L;
        if (posts == 0) return 0;
        long c = colors % MOD;
        if (posts == 1) return (int) c;
        long same = c % MOD;
        long diff = (c * ((colors - 1) % MOD)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long newSame = diff;
            long newDiff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = newSame % MOD;
            diff = newDiff;
        }
        return (int) ((same + diff) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        if (posts == 0) return 0;
        long long c = colors % MOD;
        if (posts == 1) return (int) c;
        long long same = c % MOD;
        long long diff = (c * ((colors - 1) % MOD)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD * ((colors - 1) % MOD)) % MOD;
            same = newSame % MOD;
            diff = newDiff;
        }
        return (int) ((same + diff) % MOD);
    }
};`,
  },

  // killSubtree(pid, ppid, kill) -> List[int]  — gather subtree, sorted ids.
  'pghub-b16-process-tree-kill': {
    javascript: `var killSubtree = function(pid, ppid, kill) {
    const children = new Map();
    for (let i = 0; i < pid.length; i++) {
        const c = pid[i], p = ppid[i];
        if (!children.has(p)) children.set(p, []);
        children.get(p).push(c);
    }
    const killed = [];
    const stack = [kill];
    while (stack.length) {
        const cur = stack.pop();
        killed.push(cur);
        for (const ch of (children.get(cur) || [])) stack.push(ch);
    }
    killed.sort((a, b) => a - b);
    return killed;
};`,
    java: `import java.util.*;
class Solution {
    public int[] killSubtree(int[] pid, int[] ppid, int kill) {
        Map<Integer, List<Integer>> children = new HashMap<>();
        for (int i = 0; i < pid.length; i++) {
            children.computeIfAbsent(ppid[i], k -> new ArrayList<>()).add(pid[i]);
        }
        List<Integer> killed = new ArrayList<>();
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(kill);
        while (!stack.isEmpty()) {
            int cur = stack.pop();
            killed.add(cur);
            for (int ch : children.getOrDefault(cur, Collections.emptyList())) stack.push(ch);
        }
        Collections.sort(killed);
        int[] res = new int[killed.size()];
        for (int i = 0; i < res.length; i++) res[i] = killed.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> killSubtree(vector<int>& pid, vector<int>& ppid, int kill) {
        unordered_map<int, vector<int>> children;
        for (size_t i = 0; i < pid.size(); i++) children[ppid[i]].push_back(pid[i]);
        vector<int> killed;
        vector<int> stack = {kill};
        while (!stack.empty()) {
            int cur = stack.back(); stack.pop_back();
            killed.push_back(cur);
            for (int ch : children[cur]) stack.push_back(ch);
        }
        sort(killed.begin(), killed.end());
        return killed;
    }
};`,
  },

  // longestStreak(runners: List[int]) -> int  — longest run of 1s.
  'pghub-b16-relay-baton': {
    javascript: `var longestStreak = function(runners) {
    let best = 0, cur = 0;
    for (const r of runners) {
        if (r === 1) { cur++; if (cur > best) best = cur; }
        else cur = 0;
    }
    return best;
};`,
    java: `class Solution {
    public int longestStreak(int[] runners) {
        int best = 0, cur = 0;
        for (int r : runners) {
            if (r == 1) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestStreak(vector<int>& runners) {
        int best = 0, cur = 0;
        for (int r : runners) {
            if (r == 1) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
};`,
  },

  // bestSegment(track: List[int], k: int) -> int  — max circular window sum of size k.
  'pghub-b16-ring-buffer-max': {
    javascript: `var bestSegment = function(track, k) {
    const n = track.length;
    let cur = 0;
    for (let i = 0; i < k; i++) cur += track[i];
    let best = cur;
    for (let i = 1; i < n; i++) {
        cur += track[(i + k - 1) % n] - track[i - 1];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int bestSegment(int[] track, int k) {
        int n = track.length;
        int cur = 0;
        for (int i = 0; i < k; i++) cur += track[i];
        int best = cur;
        for (int i = 1; i < n; i++) {
            cur += track[(i + k - 1) % n] - track[i - 1];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bestSegment(vector<int>& track, int k) {
        int n = track.size();
        int cur = 0;
        for (int i = 0; i < k; i++) cur += track[i];
        int best = cur;
        for (int i = 1; i < n; i++) {
            cur += track[(i + k - 1) % n] - track[i - 1];
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // allowedRequests(times, window, limit) -> List[int]  — sliding-window rate limit.
  'pghub-b16-token-bucket': {
    javascript: `var allowedRequests = function(times, window, limit) {
    const q = [];
    let head = 0;
    const out = [];
    for (const t of times) {
        while (head < q.length && q[head] <= t - window) head++;
        if (q.length - head < limit) {
            q.push(t);
            out.push(1);
        } else {
            out.push(0);
        }
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] allowedRequests(int[] times, int window, int limit) {
        Deque<Integer> q = new ArrayDeque<>();
        int[] out = new int[times.length];
        for (int i = 0; i < times.length; i++) {
            int t = times[i];
            while (!q.isEmpty() && q.peekFirst() <= t - window) q.pollFirst();
            if (q.size() < limit) {
                q.addLast(t);
                out[i] = 1;
            } else {
                out[i] = 0;
            }
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> allowedRequests(vector<int>& times, int window, int limit) {
        deque<int> q;
        vector<int> out;
        for (int t : times) {
            while (!q.empty() && q.front() <= t - window) q.pop_front();
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

  // minMaxJump(dials, splits) -> int  — binary search on min largest group sum.
  'pghub-b16-vault-combo': {
    javascript: `var minMaxJump = function(dials, splits) {
    const groupsNeeded = (cap) => {
        let groups = 1, cur = 0;
        for (const d of dials) {
            if (cur + d > cap) { groups++; cur = d; }
            else cur += d;
        }
        return groups;
    };
    let lo = Math.max(...dials), hi = dials.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (groupsNeeded(mid) <= splits) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minMaxJump(int[] dials, int splits) {
        int lo = Integer.MIN_VALUE;
        long hi = 0;
        for (int d : dials) { lo = Math.max(lo, d); hi += d; }
        long l = lo, h = hi;
        while (l < h) {
            long mid = l + (h - l) / 2;
            if (groupsNeeded(dials, mid) <= splits) h = mid;
            else l = mid + 1;
        }
        return (int) l;
    }
    private int groupsNeeded(int[] dials, long cap) {
        int groups = 1;
        long cur = 0;
        for (int d : dials) {
            if (cur + d > cap) { groups++; cur = d; }
            else cur += d;
        }
        return groups;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMaxJump(vector<int>& dials, int splits) {
        long long lo = *max_element(dials.begin(), dials.end());
        long long hi = accumulate(dials.begin(), dials.end(), 0LL);
        auto groupsNeeded = [&](long long cap) {
            int groups = 1;
            long long cur = 0;
            for (int d : dials) {
                if (cur + d > cap) { groups++; cur = d; }
                else cur += d;
            }
            return groups;
        };
        while (lo < hi) {
            long long mid = lo + (hi - lo) / 2;
            if (groupsNeeded(mid) <= splits) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // minRestockTrips(shelves, capacity) -> int  — ceil(total / capacity).
  'pghub-b16-warehouse-aisles': {
    javascript: `var minRestockTrips = function(shelves, capacity) {
    let total = 0;
    for (const x of shelves) total += x;
    if (total === 0) return 0;
    return Math.floor((total + capacity - 1) / capacity);
};`,
    java: `class Solution {
    public int minRestockTrips(int[] shelves, int capacity) {
        long total = 0;
        for (int x : shelves) total += x;
        if (total == 0) return 0;
        return (int) ((total + capacity - 1) / capacity);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRestockTrips(vector<int>& shelves, int capacity) {
        long long total = 0;
        for (int x : shelves) total += x;
        if (total == 0) return 0;
        return (int) ((total + capacity - 1) / capacity);
    }
};`,
  },

  // maxDepth(expr: str) -> int  — max nesting of parentheses.
  'pghub-b17-bracket-depth': {
    javascript: `var maxDepth = function(expr) {
    let depth = 0, best = 0;
    for (const ch of expr) {
        if (ch === '(') { depth++; if (depth > best) best = depth; }
        else if (ch === ')') depth--;
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String expr) {
        int depth = 0, best = 0;
        for (char ch : expr.toCharArray()) {
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
    int maxDepth(string expr) {
        int depth = 0, best = 0;
        for (char ch : expr) {
            if (ch == '(') { depth++; if (depth > best) best = depth; }
            else if (ch == ')') depth--;
        }
        return best;
    }
};`,
  },

  // changeWays(coins, amount) -> int  — unbounded-knapsack count of combos.
  'pghub-b17-coin-change-ways': {
    javascript: `var changeWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of coins) {
        for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int changeWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
        }
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int changeWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
        }
        return (int) dp[amount];
    }
};`,
  },

  // hasCycle(n, edges) -> bool  — Kahn topo sort; cycle iff not all nodes drained.
  'pghub-b17-cycle-detect': {
    javascript: `var hasCycle = function(n, edges) {
    const adj = Array.from({ length: n }, () => []);
    const indeg = new Array(n).fill(0);
    for (const [a, b] of edges) {
        adj[a].push(b);
        indeg[b]++;
    }
    const q = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    let head = 0, seen = 0;
    while (head < q.length) {
        const u = q[head++];
        seen++;
        for (const v of adj[u]) {
            if (--indeg[v] === 0) q.push(v);
        }
    }
    return seen !== n;
};`,
    java: `import java.util.*;
class Solution {
    public boolean hasCycle(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indeg[e[1]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
        int seen = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            seen++;
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) q.add(v);
            }
        }
        return seen != n;
    }
}`,
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
        queue<int> q;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
        int seen = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            seen++;
            for (int v : adj[u]) {
                if (--indeg[v] == 0) q.push(v);
            }
        }
        return seen != n;
    }
};`,
  },

  // smallestWithProduct(target) -> int  — greedy factor 9..2, ascending digits.
  'pghub-b17-digit-product-min': {
    javascript: `var smallestWithProduct = function(target) {
    if (target === 1) return 1;
    const digits = [];
    for (let d = 9; d >= 2; d--) {
        while (target % d === 0) {
            digits.push(d);
            target = Math.floor(target / d);
        }
    }
    if (target !== 1) return -1;
    digits.sort((a, b) => a - b);
    let num = 0;
    for (const d of digits) num = num * 10 + d;
    return num;
};`,
    java: `import java.util.*;
class Solution {
    public int smallestWithProduct(int target) {
        if (target == 1) return 1;
        List<Integer> digits = new ArrayList<>();
        for (int d = 9; d >= 2; d--) {
            while (target % d == 0) {
                digits.add(d);
                target /= d;
            }
        }
        if (target != 1) return -1;
        Collections.sort(digits);
        long num = 0;
        for (int d : digits) num = num * 10 + d;
        return (int) num;
    }
}`,
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
        return (int) num;
    }
};`,
  },

  // minTrips(weights, limit) -> int  — greedy two-pointer boat loading.
  'pghub-b17-elevator-trips': {
    javascript: `var minTrips = function(weights, limit) {
    const w = weights.slice().sort((a, b) => a - b);
    let i = 0, j = w.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && w[i] + w[j] <= limit) i++;
        j--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] weights, int limit) {
        int[] w = weights.clone();
        Arrays.sort(w);
        int i = 0, j = w.length - 1, trips = 0;
        while (i <= j) {
            if (i < j && w[i] + w[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
}`,
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

  // bucketKey(timestamp, granularity) -> str  — truncate timestamp at granularity.
  'pghub-b17-log-bucket': {
    javascript: `var bucketKey = function(timestamp, granularity) {
    const parts = timestamp.split(':');
    const order = ['Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'];
    const keep = order.indexOf(granularity) + 1;
    const out = [];
    for (let i = 0; i < 6; i++) out.push(i < keep ? parts[i] : '00');
    return out.join(':');
};`,
    java: `import java.util.*;
class Solution {
    public String bucketKey(String timestamp, String granularity) {
        String[] parts = timestamp.split(":");
        List<String> order = Arrays.asList("Year", "Month", "Day", "Hour", "Minute", "Second");
        int keep = order.indexOf(granularity) + 1;
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            if (i > 0) out.append(':');
            out.append(i < keep ? parts[i] : "00");
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string bucketKey(string timestamp, string granularity) {
        vector<string> parts;
        stringstream ss(timestamp);
        string tok;
        while (getline(ss, tok, ':')) parts.push_back(tok);
        vector<string> order = {"Year", "Month", "Day", "Hour", "Minute", "Second"};
        int keep = (int)(find(order.begin(), order.end(), granularity) - order.begin()) + 1;
        string out;
        for (int i = 0; i < 6; i++) {
            if (i > 0) out += ':';
            out += (i < keep) ? parts[i] : "00";
        }
        return out;
    }
};`,
  },

  // wateredTrees(grid, steps) -> int  — multi-source BFS from sources (2), count
  // reachable trees (1) within `steps`, blocked cells are -1.
  'pghub-b17-orchard-grid': {
    javascript: `var wateredTrees = function(grid, steps) {
    const R = grid.length, C = grid[0].length;
    const dist = Array.from({ length: R }, () => new Array(C).fill(-1));
    const q = [];
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] === 2) { dist[r][c] = 0; q.push([r, c]); }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let head = 0;
    while (head < q.length) {
        const [r, c] = q[head++];
        if (dist[r][c] === steps) continue;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] !== -1 && dist[nr][nc] === -1) {
                dist[nr][nc] = dist[r][c] + 1;
                q.push([nr, nc]);
            }
        }
    }
    let watered = 0;
    for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++)
            if (grid[r][c] === 1 && dist[r][c] >= 0 && dist[r][c] <= steps) watered++;
    return watered;
};`,
    java: `import java.util.*;
class Solution {
    public int wateredTrees(int[][] grid, int steps) {
        int R = grid.length, C = grid[0].length;
        int[][] dist = new int[R][C];
        for (int[] row : dist) Arrays.fill(row, -1);
        Deque<int[]> q = new ArrayDeque<>();
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (grid[r][c] == 2) { dist[r][c] = 0; q.add(new int[]{r, c}); }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1];
            if (dist[r][c] == steps) continue;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] != -1 && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.add(new int[]{nr, nc});
                }
            }
        }
        int watered = 0;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (grid[r][c] == 1 && dist[r][c] >= 0 && dist[r][c] <= steps) watered++;
        return watered;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wateredTrees(vector<vector<int>>& grid, int steps) {
        int R = grid.size(), C = grid[0].size();
        vector<vector<int>> dist(R, vector<int>(C, -1));
        queue<pair<int,int>> q;
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (grid[r][c] == 2) { dist[r][c] = 0; q.push({r, c}); }
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            if (dist[r][c] == steps) continue;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] != -1 && dist[nr][nc] == -1) {
                    dist[nr][nc] = dist[r][c] + 1;
                    q.push({nr, nc});
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

  // topCompletion(words, counts, prefix) -> str  — highest count, lexicographic tie.
  'pghub-b17-prefix-autocomplete': {
    javascript: `var topCompletion = function(words, counts, prefix) {
    let best = null, bestCount = -1;
    for (let i = 0; i < words.length; i++) {
        const w = words[i], c = counts[i];
        if (w.startsWith(prefix)) {
            if (c > bestCount || (c === bestCount && (best === null || w < best))) {
                best = w;
                bestCount = c;
            }
        }
    }
    return best !== null ? best : '';
};`,
    java: `class Solution {
    public String topCompletion(String[] words, int[] counts, String prefix) {
        String best = null;
        int bestCount = -1;
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            int c = counts[i];
            if (w.startsWith(prefix)) {
                if (c > bestCount || (c == bestCount && (best == null || w.compareTo(best) < 0))) {
                    best = w;
                    bestCount = c;
                }
            }
        }
        return best != null ? best : "";
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string topCompletion(vector<string>& words, vector<int>& counts, string prefix) {
        string best;
        bool found = false;
        int bestCount = -1;
        for (size_t i = 0; i < words.size(); i++) {
            const string& w = words[i];
            int c = counts[i];
            if (w.size() >= prefix.size() && w.compare(0, prefix.size(), prefix) == 0) {
                if (c > bestCount || (c == bestCount && (!found || w < best))) {
                    best = w;
                    bestCount = c;
                    found = true;
                }
            }
        }
        return found ? best : "";
    }
};`,
  },

  // twinGapPairs(lo, hi, gap) -> int  — sieve, count primes p with p+gap prime.
  'pghub-b17-prime-gap-pairs': {
    javascript: `var twinGapPairs = function(lo, hi, gap) {
    const sieve = new Uint8Array(hi + 1).fill(1);
    if (hi >= 0) sieve[0] = 0;
    if (hi >= 1) sieve[1] = 0;
    for (let i = 2; i * i <= hi; i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= hi; j += i) sieve[j] = 0;
        }
    }
    let count = 0;
    for (let p = lo; p <= hi - gap; p++) {
        const q = p + gap;
        if (sieve[p] && q <= hi && sieve[q]) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int twinGapPairs(int lo, int hi, int gap) {
        boolean[] composite = new boolean[hi + 1];
        if (hi >= 0) composite[0] = true;
        if (hi >= 1) composite[1] = true;
        for (int i = 2; (long) i * i <= hi; i++) {
            if (!composite[i]) {
                for (int j = i * i; j <= hi; j += i) composite[j] = true;
            }
        }
        int count = 0;
        for (int p = lo; p <= hi - gap; p++) {
            int q = p + gap;
            if (!composite[p] && q <= hi && !composite[q]) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int twinGapPairs(int lo, int hi, int gap) {
        vector<char> sieve(hi + 1, 1);
        if (hi >= 0) sieve[0] = 0;
        if (hi >= 1) sieve[1] = 0;
        for (long long i = 2; i * i <= hi; i++) {
            if (sieve[i]) {
                for (long long j = i * i; j <= hi; j += i) sieve[j] = 0;
            }
        }
        int count = 0;
        for (int p = lo; p <= hi - gap; p++) {
            int q = p + gap;
            if (sieve[p] && q <= hi && sieve[q]) count++;
        }
        return count;
    }
};`,
  },

  // maxLegs(times, budget) -> int  — greedy: take cheapest legs until budget runs out.
  'pghub-b17-relay-schedule': {
    javascript: `var maxLegs = function(times, budget) {
    const sorted = times.slice().sort((a, b) => a - b);
    let total = 0, count = 0;
    for (const t of sorted) {
        if (total + t > budget) break;
        total += t;
        count++;
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int maxLegs(int[] times, int budget) {
        int[] sorted = times.clone();
        Arrays.sort(sorted);
        long total = 0;
        int count = 0;
        for (int t : sorted) {
            if (total + t > budget) break;
            total += t;
            count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxLegs(vector<int>& times, int budget) {
        vector<int> sorted = times;
        sort(sorted.begin(), sorted.end());
        long long total = 0;
        int count = 0;
        for (int t : sorted) {
            if (total + t > budget) break;
            total += t;
            count++;
        }
        return count;
    }
};`,
  },

  // windowMedians(nums, k) -> List[float]  — sliding-window medians. Even-window
  // average is integer-valued where exact (matches the Python `int(avg)` rule).
  'pghub-b17-stream-median-window': {
    javascript: `var windowMedians = function(nums, k) {
    const window = nums.slice(0, k).sort((a, b) => a - b);
    const res = [];
    const med = () => {
        if (k % 2) return window[Math.floor(k / 2)];
        const a = window[k / 2 - 1], b = window[k / 2];
        const avg = (a + b) / 2;
        return avg === Math.trunc(avg) ? Math.trunc(avg) : avg;
    };
    const lowerBound = (arr, x) => {
        let lo = 0, hi = arr.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid] < x) lo = mid + 1; else hi = mid;
        }
        return lo;
    };
    res.push(med());
    for (let i = k; i < nums.length; i++) {
        const out = nums[i - k];
        window.splice(lowerBound(window, out), 1);
        const ins = lowerBound(window, nums[i]);
        window.splice(ins, 0, nums[i]);
        res.push(med());
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public double[] windowMedians(int[] nums, int k) {
        List<Integer> window = new ArrayList<>();
        for (int i = 0; i < k; i++) window.add(nums[i]);
        Collections.sort(window);
        double[] res = new double[nums.length - k + 1];
        int idx = 0;
        res[idx++] = med(window, k);
        for (int i = k; i < nums.length; i++) {
            int out = nums[i - k];
            window.remove(lowerBound(window, out));
            int ins = lowerBound(window, nums[i]);
            window.add(ins, nums[i]);
            res[idx++] = med(window, k);
        }
        return res;
    }
    private int lowerBound(List<Integer> arr, int x) {
        int lo = 0, hi = arr.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (arr.get(mid) < x) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
    private double med(List<Integer> window, int k) {
        if (k % 2 == 1) return window.get(k / 2);
        long a = window.get(k / 2 - 1), b = window.get(k / 2);
        double avg = (a + b) / 2.0;
        return avg == Math.floor(avg) ? (double) (long) avg : avg;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<double> windowMedians(vector<int>& nums, int k) {
        vector<int> window(nums.begin(), nums.begin() + k);
        sort(window.begin(), window.end());
        vector<double> res;
        auto med = [&]() -> double {
            if (k % 2) return window[k / 2];
            long long a = window[k / 2 - 1], b = window[k / 2];
            double avg = (a + b) / 2.0;
            return avg == floor(avg) ? (double)(long long)avg : avg;
        };
        res.push_back(med());
        for (int i = k; i < (int)nums.size(); i++) {
            int out = nums[i - k];
            window.erase(lower_bound(window.begin(), window.end(), out));
            window.insert(lower_bound(window.begin(), window.end(), nums[i]), nums[i]);
            res.push_back(med());
        }
        return res;
    }
};`,
  },
};
