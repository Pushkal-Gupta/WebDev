// xlate-25: slice [124,155) of unstaged pyReal targets — translate verified
// Python to the missing langs (all here need javascript/java/cpp). Signatures
// match generateTemplate(...) exactly. Skipped: pghub-b49-tree-levelmax and
// pghub-b50-tree-tilt (tree tokens in List[int] with `null` sentinel — the
// java/cpp List[int] drivers stoi/parseInt every token and choke on "null").
export default {
  // shiftVowels(s: str) -> str  — map each vowel to the next in a→e→i→o→u→a.
  'pghub-b49-vowel-shift': {
    javascript: `var shiftVowels = function(s) {
    const nxt = {a:'e', e:'i', i:'o', o:'u', u:'a'};
    let res = '';
    for (const c of s) res += (nxt[c] || c);
    return res;
};`,
    java: `class Solution {
    public String shiftVowels(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            char r = c;
            switch (c) {
                case 'a': r = 'e'; break;
                case 'e': r = 'i'; break;
                case 'i': r = 'o'; break;
                case 'o': r = 'u'; break;
                case 'u': r = 'a'; break;
            }
            sb.append(r);
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftVowels(string s) {
        string res;
        for (char c : s) {
            char r = c;
            switch (c) {
                case 'a': r = 'e'; break;
                case 'e': r = 'i'; break;
                case 'i': r = 'o'; break;
                case 'o': r = 'u'; break;
                case 'u': r = 'a'; break;
            }
            res += r;
        }
        return res;
    }
};`,
  },

  // findSingle(nums: List[int]) -> int  — XOR fold cancels paired values.
  'pghub-b49-xor-toggle': {
    javascript: `var findSingle = function(nums) {
    let acc = 0;
    for (const x of nums) acc ^= x;
    return acc;
};`,
    java: `class Solution {
    public int findSingle(int[] nums) {
        int acc = 0;
        for (int x : nums) acc ^= x;
        return acc;
    }
}`,
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

  // balancedSplits(s: str) -> int  — count prefixes where R/L balance hits 0.
  'pghub-b50-balanced-split': {
    javascript: `var balancedSplits = function(s) {
    let balance = 0, count = 0;
    for (const ch of s) {
        balance += (ch === 'R') ? 1 : -1;
        if (balance === 0) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int balancedSplits(String s) {
        int balance = 0, count = 0;
        for (char ch : s.toCharArray()) {
            balance += (ch == 'R') ? 1 : -1;
            if (balance == 0) count++;
        }
        return count;
    }
}`,
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
    javascript: `var fewestCoins = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++)
        for (const c of coins)
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    return dp[amount] <= amount ? dp[amount] : -1;
};`,
    java: `class Solution {
    public int fewestCoins(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        return dp[amount] <= amount ? dp[amount] : -1;
    }
}`,
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

  // digitSpread(n: int) -> int  — sum over 0..n of (maxDigit - minDigit).
  'pghub-b50-digit-spread': {
    javascript: `var digitSpread = function(n) {
    let total = 0;
    for (let x = 0; x <= n; x++) {
        const d = String(x);
        let mx = d.charCodeAt(0), mn = d.charCodeAt(0);
        for (let i = 1; i < d.length; i++) {
            const cc = d.charCodeAt(i);
            if (cc > mx) mx = cc;
            if (cc < mn) mn = cc;
        }
        total += (mx - mn);
    }
    return total;
};`,
    java: `class Solution {
    public int digitSpread(int n) {
        int total = 0;
        for (int x = 0; x <= n; x++) {
            String d = Integer.toString(x);
            char mx = d.charAt(0), mn = d.charAt(0);
            for (int i = 1; i < d.length(); i++) {
                char c = d.charAt(i);
                if (c > mx) mx = c;
                if (c < mn) mn = c;
            }
            total += (mx - mn);
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int digitSpread(int n) {
        int total = 0;
        for (int x = 0; x <= n; x++) {
            string d = to_string(x);
            char mx = d[0], mn = d[0];
            for (size_t i = 1; i < d.size(); i++) {
                if (d[i] > mx) mx = d[i];
                if (d[i] < mn) mn = d[i];
            }
            total += (mx - mn);
        }
        return total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — 4 per cell, -2 per shared edge.
  'pghub-b50-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (grid[r][c] === 1) {
                perim += 4;
                if (r > 0 && grid[r - 1][c] === 1) perim -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perim -= 2;
            }
    return perim;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
        return perim;
    }
}`,
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

  // knightMoves(n: int, start: List[int], target: List[int]) -> int  — BFS, -1 if unreachable.
  'pghub-b50-knight-min': {
    javascript: `var knightMoves = function(n, start, target) {
    const [sr, sc] = start, [tr, tc] = target;
    if (sr === tr && sc === tc) return 0;
    const moves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
    const visited = new Set([sr * n + sc]);
    let queue = [[sr, sc, 0]];
    while (queue.length) {
        const next = [];
        for (const [r, c, d] of queue) {
            for (const [dr, dc] of moves) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.has(nr * n + nc)) {
                    if (nr === tr && nc === tc) return d + 1;
                    visited.add(nr * n + nc);
                    next.push([nr, nc, d + 1]);
                }
            }
        }
        queue = next;
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int knightMoves(int n, int[] start, int[] target) {
        int sr = start[0], sc = start[1], tr = target[0], tc = target[1];
        if (sr == tr && sc == tc) return 0;
        int[][] moves = {{1,2},{2,1},{-1,2},{-2,1},{1,-2},{2,-1},{-1,-2},{-2,-1}};
        boolean[][] visited = new boolean[n][n];
        visited[sr][sc] = true;
        Deque<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[]{sr, sc, 0});
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int r = cur[0], c = cur[1], d = cur[2];
            for (int[] m : moves) {
                int nr = r + m[0], nc = c + m[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
                    if (nr == tr && nc == tc) return d + 1;
                    visited[nr][nc] = true;
                    queue.offer(new int[]{nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int knightMoves(int n, vector<int>& start, vector<int>& target) {
        int sr = start[0], sc = start[1], tr = target[0], tc = target[1];
        if (sr == tr && sc == tc) return 0;
        int moves[8][2] = {{1,2},{2,1},{-1,2},{-2,1},{1,-2},{2,-1},{-1,-2},{-2,-1}};
        vector<vector<bool>> visited(n, vector<bool>(n, false));
        visited[sr][sc] = true;
        queue<array<int,3>> q;
        q.push({sr, sc, 0});
        while (!q.empty()) {
            auto cur = q.front(); q.pop();
            int r = cur[0], c = cur[1], d = cur[2];
            for (auto& m : moves) {
                int nr = r + m[0], nc = c + m[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
                    if (nr == tr && nc == tc) return d + 1;
                    visited[nr][nc] = true;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // kthDistinct(nums: List[int], k: int) -> int  — kth value appearing exactly once, in order.
  'pghub-b50-kth-distinct': {
    javascript: `var kthDistinct = function(nums, k) {
    const freq = new Map();
    for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);
    let seen = 0;
    for (const x of nums) {
        if (freq.get(x) === 1) {
            seen++;
            if (seen === k) return x;
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int kthDistinct(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        int seen = 0;
        for (int x : nums) {
            if (freq.get(x) == 1) {
                seen++;
                if (seen == k) return x;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthDistinct(vector<int>& nums, int k) {
        unordered_map<int, int> freq;
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

  // distinctInWindows(nums: List[int], k: int) -> List[int]  — distinct count per sliding window.
  'pghub-b50-lru-window': {
    javascript: `var distinctInWindows = function(nums, k) {
    const n = nums.length;
    if (k > n) return [];
    const freq = new Map();
    const res = [];
    for (let i = 0; i < n; i++) {
        freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
        if (i >= k) {
            const old = nums[i - k];
            const f = freq.get(old) - 1;
            if (f === 0) freq.delete(old);
            else freq.set(old, f);
        }
        if (i >= k - 1) res.push(freq.size);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] distinctInWindows(int[] nums, int k) {
        int n = nums.length;
        if (k > n) return new int[0];
        Map<Integer, Integer> freq = new HashMap<>();
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            freq.merge(nums[i], 1, Integer::sum);
            if (i >= k) {
                int old = nums[i - k];
                int f = freq.get(old) - 1;
                if (f == 0) freq.remove(old);
                else freq.put(old, f);
            }
            if (i >= k - 1) res.add(freq.size());
        }
        int[] out = new int[res.size()];
        for (int i = 0; i < out.length; i++) out[i] = res.get(i);
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> distinctInWindows(vector<int>& nums, int k) {
        int n = nums.size();
        if (k > n) return {};
        unordered_map<int, int> freq;
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

  // longestGap(meetings: List[List[int]], dayEnd: int) -> int  — largest free gap on the day.
  'pghub-b50-meeting-gap': {
    javascript: `var longestGap = function(meetings, dayEnd) {
    if (!meetings || meetings.length === 0) return dayEnd;
    const order = meetings.slice().sort((a, b) => a[0] - b[0]);
    let best = 0, cursor = 0;
    for (const [s, e] of order) {
        if (s > cursor) best = Math.max(best, s - cursor);
        cursor = Math.max(cursor, e);
    }
    if (dayEnd > cursor) best = Math.max(best, dayEnd - cursor);
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestGap(int[][] meetings, int dayEnd) {
        if (meetings == null || meetings.length == 0) return dayEnd;
        int[][] order = meetings.clone();
        Arrays.sort(order, (a, b) -> Integer.compare(a[0], b[0]));
        int best = 0, cursor = 0;
        for (int[] m : order) {
            if (m[0] > cursor) best = Math.max(best, m[0] - cursor);
            cursor = Math.max(cursor, m[1]);
        }
        if (dayEnd > cursor) best = Math.max(best, dayEnd - cursor);
        return best;
    }
}`,
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
        for (auto& m : order) {
            if (m[0] > cursor) best = max(best, m[0] - cursor);
            cursor = max(cursor, m[1]);
        }
        if (dayEnd > cursor) best = max(best, dayEnd - cursor);
        return best;
    }
};`,
  },

  // reverseBlocks(nums: List[int], k: int) -> List[int]  — reverse each full k-block, leave tail.
  'pghub-b50-reverse-blocks': {
    javascript: `var reverseBlocks = function(nums, k) {
    const res = nums.slice();
    const n = res.length;
    let i = 0;
    while (i + k <= n) {
        let lo = i, hi = i + k - 1;
        while (lo < hi) {
            const t = res[lo]; res[lo] = res[hi]; res[hi] = t;
            lo++; hi--;
        }
        i += k;
    }
    return res;
};`,
    java: `class Solution {
    public int[] reverseBlocks(int[] nums, int k) {
        int[] res = nums.clone();
        int n = res.length, i = 0;
        while (i + k <= n) {
            int lo = i, hi = i + k - 1;
            while (lo < hi) {
                int t = res[lo]; res[lo] = res[hi]; res[hi] = t;
                lo++; hi--;
            }
            i += k;
        }
        return res;
    }
}`,
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

  // searchMatrix(matrix: List[List[int]], target: int) -> bool  — staircase from top-right.
  'pghub-b50-search-2d': {
    javascript: `var searchMatrix = function(matrix, target) {
    const rows = matrix.length, cols = matrix[0].length;
    let r = 0, c = cols - 1;
    while (r < rows && c >= 0) {
        const v = matrix[r][c];
        if (v === target) return true;
        if (v > target) c--;
        else r++;
    }
    return false;
};`,
    java: `class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int rows = matrix.length, cols = matrix[0].length;
        int r = 0, c = cols - 1;
        while (r < rows && c >= 0) {
            int v = matrix[r][c];
            if (v == target) return true;
            if (v > target) c--;
            else r++;
        }
        return false;
    }
}`,
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

  // sortStack(stack: List[int]) -> List[int]  — sort using one auxiliary stack (ascending).
  'pghub-b50-stack-sort': {
    javascript: `var sortStack = function(stack) {
    const src = stack.slice();
    const aux = [];
    while (src.length) {
        const tmp = src.pop();
        while (aux.length && aux[aux.length - 1] > tmp) src.push(aux.pop());
        aux.push(tmp);
    }
    return aux;
};`,
    java: `import java.util.*;
class Solution {
    public int[] sortStack(int[] stack) {
        Deque<Integer> src = new ArrayDeque<>();
        for (int x : stack) src.push(x);
        Deque<Integer> aux = new ArrayDeque<>();
        while (!src.isEmpty()) {
            int tmp = src.pop();
            while (!aux.isEmpty() && aux.peek() > tmp) src.push(aux.pop());
            aux.push(tmp);
        }
        int[] res = new int[aux.size()];
        for (int i = 0; i < res.length; i++) res[i] = aux.pollLast();
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortStack(vector<int>& stack) {
        vector<int> src(stack);
        vector<int> aux;
        while (!src.empty()) {
            int tmp = src.back(); src.pop_back();
            while (!aux.empty() && aux.back() > tmp) { src.push_back(aux.back()); aux.pop_back(); }
            aux.push_back(tmp);
        }
        return aux;
    }
};`,
  },

  // zeroXorSubsets(nums: List[int]) -> int  — count nonempty zero-XOR subsets = 2^(n-rank)-1 mod p.
  'pghub-b50-subset-xor': {
    javascript: `var zeroXorSubsets = function(nums) {
    const MOD = 1000000007n;
    const basis = [];
    for (const x of nums) {
        let cur = x;
        for (const b of basis) cur = Math.min(cur, cur ^ b);
        if (cur) {
            basis.push(cur);
            basis.sort((a, b) => b - a);
        }
    }
    const free = nums.length - basis.length;
    let pw = 1n;
    for (let i = 0; i < free; i++) pw = (pw * 2n) % MOD;
    return Number(((pw - 1n) % MOD + MOD) % MOD);
};`,
    java: `import java.util.*;
class Solution {
    public int zeroXorSubsets(int[] nums) {
        final long MOD = 1000000007L;
        List<Integer> basis = new ArrayList<>();
        for (int x : nums) {
            int cur = x;
            for (int b : basis) cur = Math.min(cur, cur ^ b);
            if (cur != 0) {
                basis.add(cur);
                basis.sort(Collections.reverseOrder());
            }
        }
        int free = nums.length - basis.size();
        long pw = 1;
        for (int i = 0; i < free; i++) pw = (pw * 2) % MOD;
        return (int)(((pw - 1) % MOD + MOD) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int zeroXorSubsets(vector<int>& nums) {
        const long long MOD = 1000000007LL;
        vector<int> basis;
        for (int x : nums) {
            int cur = x;
            for (int b : basis) cur = min(cur, cur ^ b);
            if (cur) {
                basis.push_back(cur);
                sort(basis.rbegin(), basis.rend());
            }
        }
        int freeCount = (int)nums.size() - (int)basis.size();
        long long pw = 1;
        for (int i = 0; i < freeCount; i++) pw = (pw * 2) % MOD;
        return (int)(((pw - 1) % MOD + MOD) % MOD);
    }
};`,
  },

  // idleSlots(tasks: List[str], cooldown: int) -> int  — minimum idle slots (task scheduler).
  'pghub-b50-task-scheduler': {
    javascript: `var idleSlots = function(tasks, cooldown) {
    const freq = new Map();
    for (const t of tasks) freq.set(t, (freq.get(t) || 0) + 1);
    let maxFreq = 0;
    for (const v of freq.values()) if (v > maxFreq) maxFreq = v;
    let maxCount = 0;
    for (const v of freq.values()) if (v === maxFreq) maxCount++;
    const frame = (maxFreq - 1) * (cooldown + 1) + maxCount;
    const totalSlots = Math.max(frame, tasks.length);
    return totalSlots - tasks.length;
};`,
    java: `import java.util.*;
class Solution {
    public int idleSlots(String[] tasks, int cooldown) {
        Map<String, Integer> freq = new HashMap<>();
        for (String t : tasks) freq.merge(t, 1, Integer::sum);
        int maxFreq = 0;
        for (int v : freq.values()) maxFreq = Math.max(maxFreq, v);
        int maxCount = 0;
        for (int v : freq.values()) if (v == maxFreq) maxCount++;
        int frame = (maxFreq - 1) * (cooldown + 1) + maxCount;
        int totalSlots = Math.max(frame, tasks.length);
        return totalSlots - tasks.length;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int idleSlots(vector<string>& tasks, int cooldown) {
        unordered_map<string, int> freq;
        for (auto& t : tasks) freq[t]++;
        int maxFreq = 0;
        for (auto& p : freq) maxFreq = max(maxFreq, p.second);
        int maxCount = 0;
        for (auto& p : freq) if (p.second == maxFreq) maxCount++;
        int frame = (maxFreq - 1) * (cooldown + 1) + maxCount;
        int totalSlots = max(frame, (int)tasks.size());
        return totalSlots - (int)tasks.size();
    }
};`,
  },

  // transformLength(begin: str, end: str, words: List[str]) -> int  — word-ladder BFS, 0 if no path.
  'pghub-b50-word-ladder-len': {
    javascript: `var transformLength = function(begin, end, words) {
    const wordSet = new Set(words);
    if (!wordSet.has(end)) return 0;
    const visited = new Set([begin]);
    let queue = [[begin, 1]];
    while (queue.length) {
        const next = [];
        for (const [word, steps] of queue) {
            if (word === end) return steps;
            for (let i = 0; i < word.length; i++) {
                for (let cc = 97; cc < 123; cc++) {
                    const ch = String.fromCharCode(cc);
                    if (ch === word[i]) continue;
                    const nxt = word.slice(0, i) + ch + word.slice(i + 1);
                    if (wordSet.has(nxt) && !visited.has(nxt)) {
                        visited.add(nxt);
                        next.push([nxt, steps + 1]);
                    }
                }
            }
        }
        queue = next;
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int transformLength(String begin, String end, String[] words) {
        Set<String> wordSet = new HashSet<>(Arrays.asList(words));
        if (!wordSet.contains(end)) return 0;
        Set<String> visited = new HashSet<>();
        visited.add(begin);
        Deque<String> queue = new ArrayDeque<>();
        Deque<Integer> dist = new ArrayDeque<>();
        queue.offer(begin); dist.offer(1);
        while (!queue.isEmpty()) {
            String word = queue.poll();
            int steps = dist.poll();
            if (word.equals(end)) return steps;
            char[] arr = word.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    arr[i] = ch;
                    String nxt = new String(arr);
                    if (wordSet.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        queue.offer(nxt); dist.offer(steps + 1);
                    }
                }
                arr[i] = orig;
            }
        }
        return 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformLength(string begin, string end, vector<string>& words) {
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(end)) return 0;
        unordered_set<string> visited{begin};
        queue<pair<string,int>> q;
        q.push({begin, 1});
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

  // longestGap(n: int) -> int  — longest run of 0s between two 1s in binary.
  'pghub-b51-binary-gap': {
    javascript: `var longestGap = function(n) {
    let best = 0, current = -1;
    while (n > 0) {
        const bit = n & 1;
        n = Math.floor(n / 2);
        if (bit === 1) {
            if (current > best) best = current;
            current = 0;
        } else if (current >= 0) {
            current++;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int longestGap(int n) {
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
}`,
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

  // changeWays(coins: List[int], amount: int) -> int  — count combinations (unbounded knapsack).
  'pghub-b51-coin-combos': {
    javascript: `var changeWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const coin of coins)
        for (let a = coin; a <= amount; a++)
            dp[a] += dp[a - coin];
    return dp[amount];
};`,
    java: `class Solution {
    public int changeWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int coin : coins)
            for (int a = coin; a <= amount; a++)
                dp[a] += dp[a - coin];
        return (int)dp[amount];
    }
}`,
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

  // totalEnergy(floors: List[int]) -> int  — sum of absolute adjacent differences.
  'pghub-b51-elevator-stops': {
    javascript: `var totalEnergy = function(floors) {
    let total = 0;
    for (let i = 1; i < floors.length; i++) total += Math.abs(floors[i] - floors[i - 1]);
    return total;
};`,
    java: `class Solution {
    public int totalEnergy(int[] floors) {
        int total = 0;
        for (int i = 1; i < floors.length; i++) total += Math.abs(floors[i] - floors[i - 1]);
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalEnergy(vector<int>& floors) {
        int total = 0;
        for (size_t i = 1; i < floors.size(); i++) total += abs(floors[i] - floors[i - 1]);
        return total;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — same perimeter count.
  'pghub-b51-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perimeter = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (grid[r][c] === 1) {
                perimeter += 4;
                if (r > 0 && grid[r - 1][c] === 1) perimeter -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perimeter -= 2;
            }
    return perimeter;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perimeter = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
        return perimeter;
    }
}`,
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

  // canReachEnd(jump: List[int]) -> bool  — greedy jump-game reachability.
  'pghub-b51-jump-reach': {
    javascript: `var canReachEnd = function(jump) {
    let reach = 0;
    const last = jump.length - 1;
    for (let i = 0; i < jump.length; i++) {
        if (i > reach) return false;
        reach = Math.max(reach, i + jump[i]);
        if (reach >= last) return true;
    }
    return true;
};`,
    java: `class Solution {
    public boolean canReachEnd(int[] jump) {
        int reach = 0, last = jump.length - 1;
        for (int i = 0; i < jump.length; i++) {
            if (i > reach) return false;
            reach = Math.max(reach, i + jump[i]);
            if (reach >= last) return true;
        }
        return true;
    }
}`,
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

  // kthLargestAfter(k: int, stream: List[int]) -> List[int]  — running kth-largest via min-heap.
  'pghub-b51-kth-largest': {
    javascript: `var kthLargestAfter = function(k, stream) {
    // Hand-rolled binary min-heap (no built-in priority queue in JS).
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    const res = [];
    for (const x of stream) {
        push(x);
        if (heap.length > k) pop();
        res.push(heap.length < k ? -1 : heap[0]);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] kthLargestAfter(int k, int[] stream) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int[] res = new int[stream.length];
        for (int i = 0; i < stream.length; i++) {
            heap.offer(stream[i]);
            if (heap.size() > k) heap.poll();
            res[i] = (heap.size() < k) ? -1 : heap.peek();
        }
        return res;
    }
}`,
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
            res.push_back((int)heap.size() < k ? -1 : heap.top());
        }
        return res;
    }
};`,
  },

  // editDistance(a: str, b: str) -> int  — Levenshtein with rolling 1D DP.
  'pghub-b51-min-edit': {
    javascript: `var editDistance = function(a, b) {
    const m = a.length, n = b.length;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = dp[j];
            if (a[i - 1] === b[j - 1]) dp[j] = prev;
            else dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
            prev = tmp;
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public int editDistance(String a, String b) {
        int m = a.length(), n = b.length();
        int[] dp = new int[n + 1];
        for (int j = 0; j <= n; j++) dp[j] = j;
        for (int i = 1; i <= m; i++) {
            int prev = dp[0];
            dp[0] = i;
            for (int j = 1; j <= n; j++) {
                int tmp = dp[j];
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[j] = prev;
                else dp[j] = 1 + Math.min(prev, Math.min(dp[j], dp[j - 1]));
                prev = tmp;
            }
        }
        return dp[n];
    }
}`,
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

  // countPairs(nums: List[int], target: int) -> int  — count ordered i<j pairs summing to target.
  'pghub-b51-pair-target': {
    javascript: `var countPairs = function(nums, target) {
    const seen = new Map();
    let count = 0;
    for (const x of nums) {
        count += (seen.get(target - x) || 0);
        seen.set(x, (seen.get(x) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPairs(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        int count = 0;
        for (int x : nums) {
            count += seen.getOrDefault(target - x, 0);
            seen.merge(x, 1, Integer::sum);
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        int count = 0;
        for (int x : nums) {
            auto it = seen.find(target - x);
            if (it != seen.end()) count += it->second;
            seen[x]++;
        }
        return count;
    }
};`,
  },

  // minInsertions(s: str) -> int  — min parens to insert for balance.
  'pghub-b51-paren-balance': {
    javascript: `var minInsertions = function(s) {
    let openCount = 0, inserts = 0;
    for (const ch of s) {
        if (ch === '(') openCount++;
        else {
            if (openCount > 0) openCount--;
            else inserts++;
        }
    }
    return inserts + openCount;
};`,
    java: `class Solution {
    public int minInsertions(String s) {
        int openCount = 0, inserts = 0;
        for (char ch : s.toCharArray()) {
            if (ch == '(') openCount++;
            else {
                if (openCount > 0) openCount--;
                else inserts++;
            }
        }
        return inserts + openCount;
    }
}`,
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

  // countWays(n: int) -> int  — Fibonacci-style step counting.
  'pghub-b51-rabbit-hop': {
    javascript: `var countWays = function(n) {
    if (n <= 1) return 1;
    let prev = 1, cur = 1;
    for (let i = 2; i <= n; i++) {
        const t = prev + cur;
        prev = cur; cur = t;
    }
    return cur;
};`,
    java: `class Solution {
    public int countWays(int n) {
        if (n <= 1) return 1;
        long prev = 1, cur = 1;
        for (int i = 2; i <= n; i++) {
            long t = prev + cur;
            prev = cur; cur = t;
        }
        return (int)cur;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(int n) {
        if (n <= 1) return 1;
        long long prev = 1, cur = 1;
        for (int i = 2; i <= n; i++) {
            long long t = prev + cur;
            prev = cur; cur = t;
        }
        return (int)cur;
    }
};`,
  },

  // countSubarrays(nums: List[int], target: int) -> int  — prefix-sum count of subarrays = target.
  'pghub-b51-subarray-target': {
    javascript: `var countSubarrays = function(nums, target) {
    const seen = new Map();
    seen.set(0, 1);
    let prefix = 0, count = 0;
    for (const x of nums) {
        prefix += x;
        count += (seen.get(prefix - target) || 0);
        seen.set(prefix, (seen.get(prefix) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countSubarrays(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            count += seen.getOrDefault(prefix - target, 0);
            seen.merge(prefix, 1, Integer::sum);
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        seen[0] = 1;
        int prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            auto it = seen.find(prefix - target);
            if (it != seen.end()) count += it->second;
            seen[prefix]++;
        }
        return count;
    }
};`,
  },

  // treeDiameter(tree: List[int]) -> int  — heap-array tree, -1 = absent node.
  'pghub-b51-tree-diameter': {
    javascript: `var treeDiameter = function(tree) {
    const n = tree.length;
    let best = 0;
    const depth = (i) => {
        if (i >= n || tree[i] === -1) return 0;
        const left = depth(2 * i + 1);
        const right = depth(2 * i + 2);
        if (left + right > best) best = left + right;
        return 1 + Math.max(left, right);
    };
    depth(0);
    return best;
};`,
    java: `class Solution {
    private int[] tree;
    private int n;
    private int best;
    public int treeDiameter(int[] tree) {
        this.tree = tree;
        this.n = tree.length;
        this.best = 0;
        depth(0);
        return best;
    }
    private int depth(int i) {
        if (i >= n || tree[i] == -1) return 0;
        int left = depth(2 * i + 1);
        int right = depth(2 * i + 2);
        if (left + right > best) best = left + right;
        return 1 + Math.max(left, right);
    }
}`,
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

  // maxVowels(s: str, k: int) -> int  — max vowels in any window of length k.
  'pghub-b51-vowel-window': {
    javascript: `var maxVowels = function(s, k) {
    const isVowel = (c) => c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';
    const n = s.length;
    if (k >= n) {
        let total = 0;
        for (const c of s) if (isVowel(c)) total++;
        return total;
    }
    let cur = 0;
    for (let i = 0; i < k; i++) if (isVowel(s[i])) cur++;
    let best = cur;
    for (let i = k; i < n; i++) {
        if (isVowel(s[i])) cur++;
        if (isVowel(s[i - k])) cur--;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    private boolean isVowel(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }
    public int maxVowels(String s, int k) {
        int n = s.length();
        if (k >= n) {
            int total = 0;
            for (int i = 0; i < n; i++) if (isVowel(s.charAt(i))) total++;
            return total;
        }
        int cur = 0;
        for (int i = 0; i < k; i++) if (isVowel(s.charAt(i))) cur++;
        int best = cur;
        for (int i = k; i < n; i++) {
            if (isVowel(s.charAt(i))) cur++;
            if (isVowel(s.charAt(i - k))) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxVowels(string s, int k) {
        auto isVowel = [](char c) {
            return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
        };
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
};
