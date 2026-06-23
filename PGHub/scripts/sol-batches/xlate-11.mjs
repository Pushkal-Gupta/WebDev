// xlate-11.mjs — translations of verified Python solutions to JS/Java/C++.
// Slice [300,330) of pyReal targets (sorted by id). Only missing langs emitted
// (all three of javascript/java/cpp for every slug in this slice).
// Signatures match generateTemplate() exactly. Algorithms preserved faithfully.

export default {
  // busiestWindow(cars: List[int], k: int) -> int — sliding-window max sum.
  'pghub-b29-toll-booth-peak': {
    javascript: `var busiestWindow = function(cars, k) {
    const n = cars.length;
    k = Math.min(k, n);
    let cur = 0;
    for (let i = 0; i < k; i++) cur += cars[i];
    let best = cur;
    for (let i = k; i < n; i++) {
        cur += cars[i] - cars[i - k];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int busiestWindow(int[] cars, int k) {
        int n = cars.length;
        k = Math.min(k, n);
        long cur = 0;
        for (int i = 0; i < k; i++) cur += cars[i];
        long best = cur;
        for (int i = k; i < n; i++) {
            cur += cars[i] - cars[i - k];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int busiestWindow(vector<int>& cars, int k) {
        int n = cars.size();
        k = min(k, n);
        long long cur = 0;
        for (int i = 0; i < k; i++) cur += cars[i];
        long long best = cur;
        for (int i = k; i < n; i++) {
            cur += cars[i] - cars[i - k];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
};`,
  },

  // isBalanced(tree: List[int]) -> bool — level-order array (-1 null), BFS parse + height DFS.
  'pghub-b29-tree-balance': {
    javascript: `var isBalanced = function(tree) {
    const n = tree.length;
    if (n === 0 || tree[0] === -1) return true;
    const left = {}, right = {};
    const q = [0];
    let head = 0, idx = 1;
    while (head < q.length && idx < n) {
        const node = q[head++];
        if (idx < n) {
            if (tree[idx] !== -1) { left[node] = idx; q.push(idx); }
            idx++;
        }
        if (idx < n) {
            if (tree[idx] !== -1) { right[node] = idx; q.push(idx); }
            idx++;
        }
    }
    let balanced = true;
    const height = (node) => {
        if (node === undefined) return 0;
        const lh = height(left[node]);
        const rh = height(right[node]);
        if (Math.abs(lh - rh) > 1) balanced = false;
        return 1 + Math.max(lh, rh);
    };
    height(0);
    return balanced;
};`,
    java: `import java.util.*;
class Solution {
    private Map<Integer,Integer> left = new HashMap<>();
    private Map<Integer,Integer> right = new HashMap<>();
    private boolean balanced = true;
    public boolean isBalanced(int[] tree) {
        int n = tree.length;
        if (n == 0 || tree[0] == -1) return true;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(0);
        int idx = 1;
        while (!q.isEmpty() && idx < n) {
            int node = q.poll();
            if (idx < n) {
                if (tree[idx] != -1) { left.put(node, idx); q.add(idx); }
                idx++;
            }
            if (idx < n) {
                if (tree[idx] != -1) { right.put(node, idx); q.add(idx); }
                idx++;
            }
        }
        height(0);
        return balanced;
    }
    private int height(Integer node) {
        if (node == null) return 0;
        int lh = height(left.get(node));
        int rh = height(right.get(node));
        if (Math.abs(lh - rh) > 1) balanced = false;
        return 1 + Math.max(lh, rh);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(vector<int>& tree) {
        int n = tree.size();
        if (n == 0 || tree[0] == -1) return true;
        unordered_map<int,int> left, right;
        queue<int> q;
        q.push(0);
        int idx = 1;
        while (!q.empty() && idx < n) {
            int node = q.front(); q.pop();
            if (idx < n) {
                if (tree[idx] != -1) { left[node] = idx; q.push(idx); }
                idx++;
            }
            if (idx < n) {
                if (tree[idx] != -1) { right[node] = idx; q.push(idx); }
                idx++;
            }
        }
        bool balanced = true;
        function<int(int)> height = [&](int node) -> int {
            if (node < 0) return 0;
            int lh = left.count(node) ? height(left[node]) : 0;
            int rh = right.count(node) ? height(right[node]) : 0;
            if (abs(lh - rh) > 1) balanced = false;
            return 1 + max(lh, rh);
        };
        height(0);
        return balanced;
    }
};`,
  },

  // countLowStock(stock: List[int], threshold: int) -> int — count below threshold.
  'pghub-b29-warehouse-restock': {
    javascript: `var countLowStock = function(stock, threshold) {
    let count = 0;
    for (const q of stock) if (q < threshold) count++;
    return count;
};`,
    java: `class Solution {
    public int countLowStock(int[] stock, int threshold) {
        int count = 0;
        for (int q : stock) if (q < threshold) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countLowStock(vector<int>& stock, int threshold) {
        int count = 0;
        for (int q : stock) if (q < threshold) count++;
        return count;
    }
};`,
  },

  // mergeAlternating(a: List[int], b: List[int]) -> List[int] — interleave then append remainder.
  'pghub-b29-zigzag-merge': {
    javascript: `var mergeAlternating = function(a, b) {
    const res = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        res.push(a[i++]);
        res.push(b[j++]);
    }
    while (i < a.length) res.push(a[i++]);
    while (j < b.length) res.push(b[j++]);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] mergeAlternating(int[] a, int[] b) {
        int[] res = new int[a.length + b.length];
        int idx = 0, i = 0, j = 0;
        while (i < a.length && j < b.length) {
            res[idx++] = a[i++];
            res[idx++] = b[j++];
        }
        while (i < a.length) res[idx++] = a[i++];
        while (j < b.length) res[idx++] = b[j++];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mergeAlternating(vector<int>& a, vector<int>& b) {
        vector<int> res;
        int i = 0, j = 0;
        while (i < (int)a.size() && j < (int)b.size()) {
            res.push_back(a[i++]);
            res.push_back(b[j++]);
        }
        while (i < (int)a.size()) res.push_back(a[i++]);
        while (j < (int)b.size()) res.push_back(b[j++]);
        return res;
    }
};`,
  },

  // minFixes(s: str) -> int — balance parentheses with running open count.
  'pghub-b30-balanced-brackets': {
    javascript: `var minFixes = function(s) {
    let open = 0, inserts = 0;
    for (const ch of s) {
        if (ch === '(') open++;
        else {
            if (open > 0) open--;
            else inserts++;
        }
    }
    return inserts + open;
};`,
    java: `class Solution {
    public int minFixes(String s) {
        int open = 0, inserts = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') open++;
            else {
                if (open > 0) open--;
                else inserts++;
            }
        }
        return inserts + open;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFixes(string s) {
        int open = 0, inserts = 0;
        for (char ch : s) {
            if (ch == '(') open++;
            else {
                if (open > 0) open--;
                else inserts++;
            }
        }
        return inserts + open;
    }
};`,
  },

  // longestGap(n: int) -> int — longest run of zeros bounded by ones in binary.
  'pghub-b30-binary-gap': {
    javascript: `var longestGap = function(n) {
    const bits = n.toString(2);
    let best = 0, cur = -1;
    for (const b of bits) {
        if (b === '1') {
            if (cur >= 0) best = Math.max(best, cur);
            cur = 0;
        } else if (cur >= 0) {
            cur++;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int longestGap(int n) {
        String bits = Integer.toBinaryString(n);
        int best = 0, cur = -1;
        for (int i = 0; i < bits.length(); i++) {
            char b = bits.charAt(i);
            if (b == '1') {
                if (cur >= 0) best = Math.max(best, cur);
                cur = 0;
            } else if (cur >= 0) {
                cur++;
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
        string bits;
        if (n == 0) bits = "0";
        else { int m = n; while (m > 0) { bits += char('0' + (m & 1)); m >>= 1; } reverse(bits.begin(), bits.end()); }
        int best = 0, cur = -1;
        for (char b : bits) {
            if (b == '1') {
                if (cur >= 0) best = max(best, cur);
                cur = 0;
            } else if (cur >= 0) {
                cur++;
            }
        }
        return best;
    }
};`,
  },

  // rollerStrokes(wall: List[int]) -> int — count color-change boundaries plus one.
  'pghub-b30-color-runs': {
    javascript: `var rollerStrokes = function(wall) {
    if (wall.length === 0) return 0;
    let strokes = 1;
    for (let i = 1; i < wall.length; i++) {
        if (wall[i] !== wall[i - 1]) strokes++;
    }
    return strokes;
};`,
    java: `class Solution {
    public int rollerStrokes(int[] wall) {
        if (wall.length == 0) return 0;
        int strokes = 1;
        for (int i = 1; i < wall.length; i++) {
            if (wall[i] != wall[i - 1]) strokes++;
        }
        return strokes;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rollerStrokes(vector<int>& wall) {
        if (wall.empty()) return 0;
        int strokes = 1;
        for (int i = 1; i < (int)wall.size(); i++) {
            if (wall[i] != wall[i - 1]) strokes++;
        }
        return strokes;
    }
};`,
  },

  // decodeStrand(s: str) -> str — run-length decode (count then letter).
  'pghub-b30-dna-decode': {
    javascript: `var decodeStrand = function(s) {
    let out = '';
    let num = 0;
    for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
            num = num * 10 + (ch.charCodeAt(0) - 48);
        } else {
            out += ch.repeat(num);
            num = 0;
        }
    }
    return out;
};`,
    java: `class Solution {
    public String decodeStrand(String s) {
        StringBuilder out = new StringBuilder();
        int num = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch >= '0' && ch <= '9') {
                num = num * 10 + (ch - '0');
            } else {
                for (int j = 0; j < num; j++) out.append(ch);
                num = 0;
            }
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decodeStrand(string s) {
        string out;
        int num = 0;
        for (char ch : s) {
            if (ch >= '0' && ch <= '9') {
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

  // fairSplit(alice: List[int], bob: List[int]) -> List[int] — swap to equalize sums.
  'pghub-b30-fair-candy': {
    javascript: `var fairSplit = function(alice, bob) {
    let sa = 0, sb = 0;
    for (const x of alice) sa += x;
    for (const x of bob) sb += x;
    const diff = sa - sb;
    if (((diff % 2) + 2) % 2 !== 0) return [];
    const half = Math.trunc(diff / 2);
    const bobSet = new Set(bob);
    let best = null;
    for (const a of alice) {
        const b = a - half;
        if (bobSet.has(b)) {
            if (best === null || a < best[0] || (a === best[0] && b < best[1])) {
                best = [a, b];
            }
        }
    }
    return best !== null ? best : [];
};`,
    java: `import java.util.*;
class Solution {
    public int[] fairSplit(int[] alice, int[] bob) {
        long sa = 0, sb = 0;
        for (int x : alice) sa += x;
        for (int x : bob) sb += x;
        long diff = sa - sb;
        if (diff % 2 != 0) return new int[]{};
        long half = diff / 2;
        Set<Long> bobSet = new HashSet<>();
        for (int x : bob) bobSet.add((long) x);
        int[] best = null;
        for (int a : alice) {
            long b = a - half;
            if (bobSet.contains(b)) {
                int bi = (int) b;
                if (best == null || a < best[0] || (a == best[0] && bi < best[1])) {
                    best = new int[]{a, bi};
                }
            }
        }
        return best != null ? best : new int[]{};
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> fairSplit(vector<int>& alice, vector<int>& bob) {
        long long sa = 0, sb = 0;
        for (int x : alice) sa += x;
        for (int x : bob) sb += x;
        long long diff = sa - sb;
        if (diff % 2 != 0) return {};
        long long half = diff / 2;
        unordered_set<long long> bobSet(bob.begin(), bob.end());
        bool found = false;
        vector<int> best;
        for (int a : alice) {
            long long b = (long long)a - half;
            if (bobSet.count(b)) {
                int bi = (int) b;
                if (!found || a < best[0] || (a == best[0] && bi < best[1])) {
                    best = {a, bi};
                    found = true;
                }
            }
        }
        return found ? best : vector<int>{};
    }
};`,
  },

  // shoreline(grid: List[List[int]]) -> int — island perimeter by exposed edges.
  'pghub-b30-island-perimeter': {
    javascript: `var shoreline = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === 0) perim++;
                }
            }
        }
    }
    return perim;
};`,
    java: `class Solution {
    public int shoreline(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    for (int[] d : dirs) {
                        int nr = r + d[0], nc = c + d[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == 0) perim++;
                    }
                }
            }
        }
        return perim;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shoreline(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    for (auto& d : dirs) {
                        int nr = r + d[0], nc = c + d[1];
                        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] == 0) perim++;
                    }
                }
            }
        }
        return perim;
    }
};`,
  },

  // kthDistinct(visitors: List[str], k: int) -> str — k-th name occurring exactly once.
  'pghub-b30-kth-distinct': {
    javascript: `var kthDistinct = function(visitors, k) {
    const counts = new Map();
    for (const name of visitors) counts.set(name, (counts.get(name) || 0) + 1);
    let seen = 0;
    for (const name of visitors) {
        if (counts.get(name) === 1) {
            seen++;
            if (seen === k) return name;
        }
    }
    return '';
};`,
    java: `import java.util.*;
class Solution {
    public String kthDistinct(String[] visitors, int k) {
        Map<String,Integer> counts = new HashMap<>();
        for (String name : visitors) counts.merge(name, 1, Integer::sum);
        int seen = 0;
        for (String name : visitors) {
            if (counts.get(name) == 1) {
                seen++;
                if (seen == k) return name;
            }
        }
        return "";
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string kthDistinct(vector<string>& visitors, int k) {
        unordered_map<string,int> counts;
        for (auto& name : visitors) counts[name]++;
        int seen = 0;
        for (auto& name : visitors) {
            if (counts[name] == 1) {
                seen++;
                if (seen == k) return name;
            }
        }
        return "";
    }
};`,
  },

  // maxConcurrent(meetings: List[List[int]]) -> int — sweep line on start/end events.
  'pghub-b30-meeting-rooms': {
    javascript: `var maxConcurrent = function(meetings) {
    const events = [];
    for (const [s, e] of meetings) {
        events.push([s, 1]);
        events.push([e, -1]);
    }
    events.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let cur = 0, best = 0;
    for (const [, delta] of events) {
        cur += delta;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxConcurrent(int[][] meetings) {
        int[][] events = new int[meetings.length * 2][2];
        int idx = 0;
        for (int[] m : meetings) {
            events[idx++] = new int[]{m[0], 1};
            events[idx++] = new int[]{m[1], -1};
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int cur = 0, best = 0;
        for (int[] ev : events) {
            cur += ev[1];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
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
        for (auto& ev : events) {
            cur += ev.second;
            best = max(best, cur);
        }
        return best;
    }
};`,
  },

  // minJumps(stones: List[int]) -> int — greedy jump-game layers.
  'pghub-b30-river-crossing': {
    javascript: `var minJumps = function(stones) {
    const n = stones.length;
    if (n === 1) return 0;
    let jumps = 0, curEnd = 0, farthest = 0;
    for (let i = 0; i < n - 1; i++) {
        farthest = Math.max(farthest, i + stones[i]);
        if (i === curEnd) {
            if (farthest <= i) return -1;
            jumps++;
            curEnd = farthest;
            if (curEnd >= n - 1) return jumps;
        }
    }
    return curEnd >= n - 1 ? jumps : -1;
};`,
    java: `class Solution {
    public int minJumps(int[] stones) {
        int n = stones.length;
        if (n == 1) return 0;
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            farthest = Math.max(farthest, i + stones[i]);
            if (i == curEnd) {
                if (farthest <= i) return -1;
                jumps++;
                curEnd = farthest;
                if (curEnd >= n - 1) return jumps;
            }
        }
        return curEnd >= n - 1 ? jumps : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minJumps(vector<int>& stones) {
        int n = stones.size();
        if (n == 1) return 0;
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            farthest = max(farthest, i + stones[i]);
            if (i == curEnd) {
                if (farthest <= i) return -1;
                jumps++;
                curEnd = farthest;
                if (curEnd >= n - 1) return jumps;
            }
        }
        return curEnd >= n - 1 ? jumps : -1;
    }
};`,
  },

  // climbWays(n: int, maxStep: int) -> int — DP count of ways to climb.
  'pghub-b30-staircase-paint': {
    javascript: `var climbWays = function(n, maxStep) {
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= n; i++) {
        for (let s = 1; s <= maxStep; s++) {
            if (i - s >= 0) dp[i] += dp[i - s];
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public int climbWays(int n, int maxStep) {
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            for (int s = 1; s <= maxStep; s++) {
                if (i - s >= 0) dp[i] += dp[i - s];
            }
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int climbWays(int n, int maxStep) {
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            for (int s = 1; s <= maxStep; s++) {
                if (i - s >= 0) dp[i] += dp[i - s];
            }
        }
        return (int) dp[n];
    }
};`,
  },

  // waitTime(positions: List[int], k: int) -> int — prefix sum through index k.
  'pghub-b30-ticket-window': {
    javascript: `var waitTime = function(positions, k) {
    let total = 0;
    for (let i = 0; i <= k; i++) total += positions[i];
    return total;
};`,
    java: `class Solution {
    public int waitTime(int[] positions, int k) {
        long total = 0;
        for (int i = 0; i <= k; i++) total += positions[i];
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int waitTime(vector<int>& positions, int k) {
        long long total = 0;
        for (int i = 0; i <= k; i++) total += positions[i];
        return (int) total;
    }
};`,
  },

  // rotateRing(tokens: List[int], k: int) -> List[int] — right rotation by k.
  'pghub-b30-token-rotation': {
    javascript: `var rotateRing = function(tokens, k) {
    const n = tokens.length;
    k %= n;
    if (k === 0) return tokens.slice();
    return tokens.slice(n - k).concat(tokens.slice(0, n - k));
};`,
    java: `import java.util.*;
class Solution {
    public int[] rotateRing(int[] tokens, int k) {
        int n = tokens.length;
        k %= n;
        int[] res = new int[n];
        if (k == 0) return tokens.clone();
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = tokens[i];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRing(vector<int>& tokens, int k) {
        int n = tokens.size();
        k %= n;
        if (k == 0) return tokens;
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[(i + k) % n] = tokens[i];
        return res;
    }
};`,
  },

  // totalTilt(values: List[int]) -> int — heap-indexed tree tilt sum (-1 null).
  'pghub-b30-tree-tilt': {
    javascript: `var totalTilt = function(values) {
    const n = values.length;
    let total = 0;
    const subtreeSum = (i) => {
        if (i >= n || values[i] === -1) return 0;
        const left = subtreeSum(2 * i + 1);
        const right = subtreeSum(2 * i + 2);
        total += Math.abs(left - right);
        return values[i] + left + right;
    };
    subtreeSum(0);
    return total;
};`,
    java: `class Solution {
    private int[] values;
    private int n;
    private long total;
    public int totalTilt(int[] values) {
        this.values = values;
        this.n = values.length;
        this.total = 0;
        subtreeSum(0);
        return (int) total;
    }
    private long subtreeSum(int i) {
        if (i >= n || values[i] == -1) return 0;
        long left = subtreeSum(2 * i + 1);
        long right = subtreeSum(2 * i + 2);
        total += Math.abs(left - right);
        return values[i] + left + right;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalTilt(vector<int>& values) {
        int n = values.size();
        long long total = 0;
        function<long long(int)> subtreeSum = [&](int i) -> long long {
            if (i >= n || values[i] == -1) return 0;
            long long left = subtreeSum(2 * i + 1);
            long long right = subtreeSum(2 * i + 2);
            total += llabs(left - right);
            return (long long)values[i] + left + right;
        };
        subtreeSum(0);
        return (int) total;
    }
};`,
  },

  // longestAisle(shelves: List[int], limit: int) -> int — sliding window with monotonic deques.
  'pghub-b30-warehouse-aisles': {
    javascript: `var longestAisle = function(shelves, limit) {
    const maxDq = [], minDq = [];
    let left = 0, best = 0;
    for (let right = 0; right < shelves.length; right++) {
        const v = shelves[right];
        while (maxDq.length && shelves[maxDq[maxDq.length - 1]] <= v) maxDq.pop();
        maxDq.push(right);
        while (minDq.length && shelves[minDq[minDq.length - 1]] >= v) minDq.pop();
        minDq.push(right);
        while (shelves[maxDq[0]] - shelves[minDq[0]] > limit) {
            left++;
            if (maxDq[0] < left) maxDq.shift();
            if (minDq[0] < left) minDq.shift();
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestAisle(int[] shelves, int limit) {
        Deque<Integer> maxDq = new ArrayDeque<>();
        Deque<Integer> minDq = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < shelves.length; right++) {
            int v = shelves[right];
            while (!maxDq.isEmpty() && shelves[maxDq.peekLast()] <= v) maxDq.pollLast();
            maxDq.addLast(right);
            while (!minDq.isEmpty() && shelves[minDq.peekLast()] >= v) minDq.pollLast();
            minDq.addLast(right);
            while (shelves[maxDq.peekFirst()] - shelves[minDq.peekFirst()] > limit) {
                left++;
                if (maxDq.peekFirst() < left) maxDq.pollFirst();
                if (minDq.peekFirst() < left) minDq.pollFirst();
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
    int longestAisle(vector<int>& shelves, int limit) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)shelves.size(); right++) {
            int v = shelves[right];
            while (!maxDq.empty() && shelves[maxDq.back()] <= v) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && shelves[minDq.back()] >= v) minDq.pop_back();
            minDq.push_back(right);
            while (shelves[maxDq.front()] - shelves[minDq.front()] > limit) {
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

  // cheapestRoute(n, roads: List[List[int]], src, dst) -> int — Dijkstra directed.
  'pghub-b30-warehouse-routes': {
    javascript: `var cheapestRoute = function(n, roads, src, dst) {
    const graph = Array.from({length: n}, () => []);
    for (const [f, t, c] of roads) graph[f].push([t, c]);
    const dist = new Array(n).fill(Infinity);
    dist[src] = 0;
    const pq = new MinHeap();
    pq.push([0, src]);
    while (pq.size() > 0) {
        const [d, u] = pq.pop();
        if (d > dist[u]) continue;
        if (u === dst) return d;
        for (const [v, w] of graph[u]) {
            const nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                pq.push([nd, v]);
            }
        }
    }
    return dist[dst] !== Infinity ? dist[dst] : -1;
};
class MinHeap {
    constructor() { this.a = []; }
    size() { return this.a.length; }
    push(x) {
        const a = this.a; a.push(x);
        let i = a.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (a[p][0] <= a[i][0]) break;
            [a[p], a[i]] = [a[i], a[p]]; i = p;
        }
    }
    pop() {
        const a = this.a, top = a[0], last = a.pop();
        if (a.length) {
            a[0] = last;
            let i = 0;
            while (true) {
                let l = 2*i+1, r = 2*i+2, s = i;
                if (l < a.length && a[l][0] < a[s][0]) s = l;
                if (r < a.length && a[r][0] < a[s][0]) s = r;
                if (s === i) break;
                [a[s], a[i]] = [a[i], a[s]]; i = s;
            }
        }
        return top;
    }
}`,
    java: `import java.util.*;
class Solution {
    public int cheapestRoute(int n, int[][] roads, int src, int dst) {
        List<int[]>[] graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        for (int[] r : roads) graph[r[0]].add(new int[]{r[1], r[2]});
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0]; int u = (int) cur[1];
            if (d > dist[u]) continue;
            if (u == dst) return (int) d;
            for (int[] e : graph[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) {
                    dist[e[0]] = nd;
                    pq.add(new long[]{nd, e[0]});
                }
            }
        }
        return dist[dst] != Long.MAX_VALUE ? (int) dist[dst] : -1;
    }
}`,
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
            if (u == dst) return (int) d;
            for (auto& [v, w] : graph[u]) {
                long long nd = d + w;
                if (nd < dist[v]) {
                    dist[v] = nd;
                    pq.push({nd, v});
                }
            }
        }
        return dist[dst] != LLONG_MAX ? (int) dist[dst] : -1;
    }
};`,
  },

  // cheapestRoute(n, roads: List[List[int]], start, dest) -> int — Dijkstra undirected.
  'pghub-b31-bridge-tolls': {
    javascript: `var cheapestRoute = function(n, roads, start, dest) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of roads) { adj[u].push([v, w]); adj[v].push([u, w]); }
    const dist = new Array(n).fill(Infinity);
    dist[start] = 0;
    const pq = new MinHeap();
    pq.push([0, start]);
    while (pq.size() > 0) {
        const [d, u] = pq.pop();
        if (d > dist[u]) continue;
        if (u === dest) return d;
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; pq.push([nd, v]); }
        }
    }
    return dist[dest] === Infinity ? -1 : dist[dest];
};
class MinHeap {
    constructor() { this.a = []; }
    size() { return this.a.length; }
    push(x) {
        const a = this.a; a.push(x);
        let i = a.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (a[p][0] <= a[i][0]) break;
            [a[p], a[i]] = [a[i], a[p]]; i = p;
        }
    }
    pop() {
        const a = this.a, top = a[0], last = a.pop();
        if (a.length) {
            a[0] = last;
            let i = 0;
            while (true) {
                let l = 2*i+1, r = 2*i+2, s = i;
                if (l < a.length && a[l][0] < a[s][0]) s = l;
                if (r < a.length && a[r][0] < a[s][0]) s = r;
                if (s === i) break;
                [a[s], a[i]] = [a[i], a[s]]; i = s;
            }
        }
        return top;
    }
}`,
    java: `import java.util.*;
class Solution {
    public int cheapestRoute(int n, int[][] roads, int start, int dest) {
        List<int[]>[] adj = new ArrayList[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) { adj[r[0]].add(new int[]{r[1], r[2]}); adj[r[1]].add(new int[]{r[0], r[2]}); }
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[start] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, start});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0]; int u = (int) cur[1];
            if (d > dist[u]) continue;
            if (u == dest) return (int) d;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
            }
        }
        return dist[dest] == Long.MAX_VALUE ? -1 : (int) dist[dest];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& roads, int start, int dest) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) { adj[r[0]].push_back({r[1], r[2]}); adj[r[1]].push_back({r[0], r[2]}); }
        vector<long long> dist(n, LLONG_MAX);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, start});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            if (u == dest) return (int) d;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        return dist[dest] == LLONG_MAX ? -1 : (int) dist[dest];
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int — unbounded knapsack combinations.
  'pghub-b31-coin-change-ways': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of coins) {
        for (let x = c; x <= amount; x++) {
            dp[x] += dp[x - c];
        }
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int c : coins) {
            for (int x = c; x <= amount; x++) {
                dp[x] += dp[x - c];
            }
        }
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins) {
            for (int x = c; x <= amount; x++) {
                dp[x] += dp[x - c];
            }
        }
        return (int) dp[amount];
    }
};`,
  },

  // minTrips(weights: List[int], limit: int) -> int — two-pointer greedy pairing.
  'pghub-b31-elevator-trips': {
    javascript: `var minTrips = function(weights, limit) {
    weights = weights.slice().sort((a, b) => a - b);
    let i = 0, j = weights.length - 1, trips = 0;
    while (i <= j) {
        if (weights[i] + weights[j] <= limit) i++;
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
            if (w[i] + w[j] <= limit) i++;
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
            if (w[i] + w[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // countLeaves(parent: List[int]) -> int — leaves = nodes never named as a parent.
  'pghub-b31-garden-prune': {
    javascript: `var countLeaves = function(parent) {
    const n = parent.length;
    const hasChild = new Array(n).fill(false);
    for (const p of parent) {
        if (p !== -1) hasChild[p] = true;
    }
    let count = 0;
    for (let i = 0; i < n; i++) if (!hasChild[i]) count++;
    return count;
};`,
    java: `class Solution {
    public int countLeaves(int[] parent) {
        int n = parent.length;
        boolean[] hasChild = new boolean[n];
        for (int p : parent) {
            if (p != -1) hasChild[p] = true;
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (!hasChild[i]) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countLeaves(vector<int>& parent) {
        int n = parent.size();
        vector<bool> hasChild(n, false);
        for (int p : parent) {
            if (p != -1) hasChild[p] = true;
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (!hasChild[i]) count++;
        return count;
    }
};`,
  },

  // countCombinations(digits: str) -> int — product of per-digit letter counts.
  'pghub-b31-keypad-words': {
    javascript: `var countCombinations = function(digits) {
    if (digits.length === 0) return 0;
    const sizes = {'2':3,'3':3,'4':3,'5':3,'6':3,'7':4,'8':3,'9':4};
    let total = 1;
    for (const d of digits) total *= sizes[d];
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int countCombinations(String digits) {
        if (digits.isEmpty()) return 0;
        Map<Character,Integer> sizes = new HashMap<>();
        sizes.put('2',3); sizes.put('3',3); sizes.put('4',3); sizes.put('5',3);
        sizes.put('6',3); sizes.put('7',4); sizes.put('8',3); sizes.put('9',4);
        long total = 1;
        for (int i = 0; i < digits.length(); i++) total *= sizes.get(digits.charAt(i));
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countCombinations(string digits) {
        if (digits.empty()) return 0;
        unordered_map<char,int> sizes = {{'2',3},{'3',3},{'4',3},{'5',3},{'6',3},{'7',4},{'8',3},{'9',4}};
        long long total = 1;
        for (char d : digits) total *= sizes[d];
        return (int) total;
    }
};`,
  },

  // totalClicks(start: List[int], target: List[int]) -> int — min wheel rotations.
  'pghub-b31-lock-rotations': {
    javascript: `var totalClicks = function(start, target) {
    let total = 0;
    for (let i = 0; i < start.length; i++) {
        const diff = Math.abs(start[i] - target[i]);
        total += Math.min(diff, 10 - diff);
    }
    return total;
};`,
    java: `class Solution {
    public int totalClicks(int[] start, int[] target) {
        int total = 0;
        for (int i = 0; i < start.length; i++) {
            int diff = Math.abs(start[i] - target[i]);
            total += Math.min(diff, 10 - diff);
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalClicks(vector<int>& start, vector<int>& target) {
        int total = 0;
        for (int i = 0; i < (int)start.size(); i++) {
            int diff = abs(start[i] - target[i]);
            total += min(diff, 10 - diff);
        }
        return total;
    }
};`,
  },

  // maxDepth(s: str) -> int — max parenthesis nesting depth.
  'pghub-b31-paren-depth': {
    javascript: `var maxDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else if (ch === ')') {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // mergeSorted(a: List[int], b: List[int]) -> List[int] — two-pointer merge.
  'pghub-b31-server-merge': {
    javascript: `var mergeSorted = function(a, b) {
    let i = 0, j = 0;
    const out = [];
    while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) out.push(a[i++]);
        else out.push(b[j++]);
    }
    while (i < a.length) out.push(a[i++]);
    while (j < b.length) out.push(b[j++]);
    return out;
};`,
    java: `class Solution {
    public int[] mergeSorted(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, idx = 0;
        while (i < a.length && j < b.length) {
            if (a[i] <= b[j]) out[idx++] = a[i++];
            else out[idx++] = b[j++];
        }
        while (i < a.length) out[idx++] = a[i++];
        while (j < b.length) out[idx++] = b[j++];
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mergeSorted(vector<int>& a, vector<int>& b) {
        vector<int> out;
        int i = 0, j = 0;
        while (i < (int)a.size() && j < (int)b.size()) {
            if (a[i] <= b[j]) out.push_back(a[i++]);
            else out.push_back(b[j++]);
        }
        while (i < (int)a.size()) out.push_back(a[i++]);
        while (j < (int)b.size()) out.push_back(b[j++]);
        return out;
    }
};`,
  },

  // pivotIndex(weights: List[int]) -> int — balance point with running prefix sum.
  'pghub-b31-shelf-balance': {
    javascript: `var pivotIndex = function(weights) {
    let total = 0;
    for (const w of weights) total += w;
    let left = 0;
    for (let i = 0; i < weights.length; i++) {
        if (left === total - left - weights[i]) return i;
        left += weights[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int pivotIndex(int[] weights) {
        long total = 0;
        for (int w : weights) total += w;
        long left = 0;
        for (int i = 0; i < weights.length; i++) {
            if (left == total - left - weights[i]) return i;
            left += weights[i];
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int pivotIndex(vector<int>& weights) {
        long long total = 0;
        for (int w : weights) total += w;
        long long left = 0;
        for (int i = 0; i < (int)weights.size(); i++) {
            if (left == total - left - weights[i]) return i;
            left += weights[i];
        }
        return -1;
    }
};`,
  },

  // pagesNeeded(stamps: int, perPage: int) -> int — ceiling division.
  'pghub-b31-stamp-pages': {
    javascript: `var pagesNeeded = function(stamps, perPage) {
    return Math.trunc((stamps + perPage - 1) / perPage);
};`,
    java: `class Solution {
    public int pagesNeeded(int stamps, int perPage) {
        return (stamps + perPage - 1) / perPage;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int pagesNeeded(int stamps, int perPage) {
        return (stamps + perPage - 1) / perPage;
    }
};`,
  },

  // canReach(nums: List[int], target: int) -> bool — subset-sum decision via reachable set.
  'pghub-b31-subset-sum-reach': {
    javascript: `var canReach = function(nums, target) {
    if (target === 0) return true;
    let reachable = new Set([0]);
    for (const x of nums) {
        const nxt = new Set(reachable);
        for (const r of reachable) {
            const s = r + x;
            if (s === target) return true;
            if (s < target) nxt.add(s);
        }
        reachable = nxt;
    }
    return reachable.has(target);
};`,
    java: `import java.util.*;
class Solution {
    public boolean canReach(int[] nums, int target) {
        if (target == 0) return true;
        Set<Integer> reachable = new HashSet<>();
        reachable.add(0);
        for (int x : nums) {
            Set<Integer> nxt = new HashSet<>(reachable);
            for (int r : reachable) {
                int s = r + x;
                if (s == target) return true;
                if (s < target) nxt.add(s);
            }
            reachable = nxt;
        }
        return reachable.contains(target);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReach(vector<int>& nums, int target) {
        if (target == 0) return true;
        unordered_set<int> reachable;
        reachable.insert(0);
        for (int x : nums) {
            unordered_set<int> nxt(reachable);
            for (int r : reachable) {
                int s = r + x;
                if (s == target) return true;
                if (s < target) nxt.insert(s);
            }
            reachable = nxt;
        }
        return reachable.count(target) > 0;
    }
};`,
  },
};
