// xlate-1.mjs — Python→{JS/Java/C++} translations for problems that already
// have a verified-correct Python solution but are missing other languages.
// Slice [0,30) of solutions-backfill-targets.json filtered to pyReal && missingLangs>0.
// Only the missing languages are authored per slug. Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
// The runner grades each language via Judge0 and writes only passing langs.

export default {
  // find-pivot-index — pivotIndex(nums: List[int]) -> int. Prefix-sum scan.
  'find-pivot-index': {
    javascript: `var pivotIndex = function(nums) {
    let total = 0;
    for (const v of nums) total += v;
    let left = 0;
    for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) return i;
        left += nums[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int pivotIndex(int[] nums) {
        long total = 0;
        for (int v : nums) total += v;
        long left = 0;
        for (int i = 0; i < nums.length; i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
}`,
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

  // max-number-of-k-sum-pairs — maxOperations(nums, k) -> int. Counter pairing.
  'max-number-of-k-sum-pairs': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxOperations(vector<int>& nums, int k) {
        unordered_map<int,int> cnt;
        for (int x : nums) cnt[x]++;
        int ops = 0;
        for (auto& kv : cnt) {
            int x = kv.first, y = k - x;
            auto it = cnt.find(y);
            if (it == cnt.end()) continue;
            if (x == y) ops += kv.second / 2;
            else if (x < y) ops += min(kv.second, it->second);
        }
        return ops;
    }
};`,
  },

  // maximum-profit-in-job-scheduling — jobScheduling(startTime,endTime,profit) -> int.
  // Sort jobs by end time; dp[i+1]=max(skip, take + dp[count of jobs ending <= start]).
  // bisect_right(ends, s, hi=i) → first index in [0,i) with ends[idx] > s.
  'maximum-profit-in-job-scheduling': {
    java: `import java.util.*;
class Solution {
    public int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
        int n = startTime.length;
        int[][] jobs = new int[n][3];
        for (int i = 0; i < n; i++) {
            jobs[i][0] = endTime[i];
            jobs[i][1] = startTime[i];
            jobs[i][2] = profit[i];
        }
        Arrays.sort(jobs, (a, b) -> {
            if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
            if (a[1] != b[1]) return Integer.compare(a[1], b[1]);
            return Integer.compare(a[2], b[2]);
        });
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) ends[i] = jobs[i][0];
        long[] dp = new long[n + 1];
        for (int i = 0; i < n; i++) {
            int s = jobs[i][1], p = jobs[i][2];
            // bisect_right(ends, s, hi=i): first idx in [0,i) with ends[idx] > s
            int lo = 0, hi = i;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (ends[mid] <= s) lo = mid + 1;
                else hi = mid;
            }
            dp[i + 1] = Math.max(dp[i], dp[lo] + p);
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
        int n = startTime.size();
        vector<array<int,3>> jobs(n);
        for (int i = 0; i < n; i++) jobs[i] = {endTime[i], startTime[i], profit[i]};
        sort(jobs.begin(), jobs.end());
        vector<int> ends(n);
        for (int i = 0; i < n; i++) ends[i] = jobs[i][0];
        vector<long long> dp(n + 1, 0);
        for (int i = 0; i < n; i++) {
            int s = jobs[i][1], p = jobs[i][2];
            // bisect_right(ends, s, hi=i): first idx in [0,i) with ends[idx] > s
            int k = (int)(upper_bound(ends.begin(), ends.begin() + i, s) - ends.begin());
            dp[i + 1] = max(dp[i], dp[k] + p);
        }
        return (int)dp[n];
    }
};`,
  },

  // merge-similar-items — mergeSimilarItems(items1, items2) -> List[List[int]].
  // Sum weights per value, emit sorted by value.
  'merge-similar-items': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeSimilarItems(vector<vector<int>>& items1, vector<vector<int>>& items2) {
        map<int,int> total;
        for (auto& it : items1) total[it[0]] += it[1];
        for (auto& it : items2) total[it[0]] += it[1];
        vector<vector<int>> res;
        for (auto& kv : total) res.push_back({kv.first, kv.second});
        return res;
    }
};`,
  },

  // network-delay-time — networkDelayTime(times, n, k) -> int. Dijkstra.
  'network-delay-time': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int,int>>> graph(n + 1);
        for (auto& t : times) graph[t[0]].push_back({t[1], t[2]});
        vector<long long> dist(n + 1, LLONG_MAX);
        dist[k] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
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
        long long ans = 0;
        for (int i = 1; i <= n; i++) ans = max(ans, dist[i]);
        return ans == LLONG_MAX ? -1 : (int)ans;
    }
};`,
  },

  // number-of-islands — numIslands(grid: List[List[str]]) -> int. DFS flood fill.
  'number-of-islands': {
    java: `class Solution {
    private int rows, cols;
    public int numIslands(String[][] grid) {
        if (grid == null || grid.length == 0 || grid[0].length == 0) return 0;
        rows = grid.length; cols = grid[0].length;
        int count = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c].equals("1")) { count++; dfs(grid, r, c); }
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

  // path-with-maximum-probability — maxProbability(n, edges, succProb, start, end) -> float.
  // Dijkstra on max-product (negate for min-heap behaviour).
  'path-with-maximum-probability': {
    java: `import java.util.*;
class Solution {
    public double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
        List<double[]>[] graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            int a = edges[i][0], b = edges[i][1];
            double p = succProb[i];
            graph[a].add(new double[]{b, p});
            graph[b].add(new double[]{a, p});
        }
        double[] best = new double[n];
        best[start] = 1.0;
        PriorityQueue<double[]> heap = new PriorityQueue<>((x, y) -> Double.compare(y[0], x[0]));
        heap.add(new double[]{1.0, start});
        while (!heap.isEmpty()) {
            double[] top = heap.poll();
            double prob = top[0];
            int node = (int) top[1];
            if (node == end) return prob;
            if (prob < best[node]) continue;
            for (double[] e : graph[node]) {
                int nei = (int) e[0];
                double np = prob * e[1];
                if (np > best[nei]) {
                    best[nei] = np;
                    heap.add(new double[]{np, nei});
                }
            }
        }
        return 0.0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double maxProbability(int n, vector<vector<int>>& edges, vector<double>& succProb, int start, int end) {
        vector<vector<pair<int,double>>> graph(n);
        for (int i = 0; i < (int)edges.size(); i++) {
            int a = edges[i][0], b = edges[i][1];
            double p = succProb[i];
            graph[a].push_back({b, p});
            graph[b].push_back({a, p});
        }
        vector<double> best(n, 0.0);
        best[start] = 1.0;
        priority_queue<pair<double,int>> heap;
        heap.push({1.0, start});
        while (!heap.empty()) {
            auto [prob, node] = heap.top(); heap.pop();
            if (node == end) return prob;
            if (prob < best[node]) continue;
            for (auto& [nei, ep] : graph[node]) {
                double np = prob * ep;
                if (np > best[nei]) {
                    best[nei] = np;
                    heap.push({np, nei});
                }
            }
        }
        return 0.0;
    }
};`,
  },

  // pghub-anagram-groups-count — countGroups(words: List[str]) -> int.
  'pghub-anagram-groups-count': {
    javascript: `var countGroups = function(words) {
    const seen = new Set();
    for (const w of words) {
        seen.add(w.split('').sort().join(''));
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int countGroups(String[] words) {
        Set<String> seen = new HashSet<>();
        for (String w : words) {
            char[] a = w.toCharArray();
            Arrays.sort(a);
            seen.add(new String(a));
        }
        return seen.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countGroups(vector<string>& words) {
        unordered_set<string> seen;
        for (string w : words) {
            sort(w.begin(), w.end());
            seen.insert(w);
        }
        return (int)seen.size();
    }
};`,
  },

  // pghub-asteroid-settle — asteroidSettle(rocks: List[int]) -> List[int]. Stack collision.
  'pghub-asteroid-settle': {
    javascript: `var asteroidSettle = function(rocks) {
    const stack = [];
    for (const r of rocks) {
        let alive = true;
        while (alive && stack.length && stack[stack.length - 1] > 0 && r < 0) {
            const top = stack[stack.length - 1];
            if (top < -r) {
                stack.pop();
            } else if (top === -r) {
                stack.pop();
                alive = false;
            } else {
                alive = false;
            }
        }
        if (alive) stack.push(r);
    }
    return stack;
};`,
    java: `import java.util.*;
class Solution {
    public int[] asteroidSettle(int[] rocks) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int r : rocks) {
            boolean alive = true;
            while (alive && !stack.isEmpty() && stack.peekLast() > 0 && r < 0) {
                int top = stack.peekLast();
                if (top < -r) {
                    stack.pollLast();
                } else if (top == -r) {
                    stack.pollLast();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) stack.addLast(r);
        }
        int[] res = new int[stack.size()];
        int i = 0;
        for (int v : stack) res[i++] = v;
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> asteroidSettle(vector<int>& rocks) {
        vector<int> stack;
        for (int r : rocks) {
            bool alive = true;
            while (alive && !stack.empty() && stack.back() > 0 && r < 0) {
                int top = stack.back();
                if (top < -r) {
                    stack.pop_back();
                } else if (top == -r) {
                    stack.pop_back();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) stack.push_back(r);
        }
        return stack;
    }
};`,
  },

  // pghub-b10-bracelet-beads — minRecolor(beads: str) -> int. Palindrome mismatch count.
  'pghub-b10-bracelet-beads': {
    javascript: `var minRecolor = function(beads) {
    let i = 0, j = beads.length - 1, changes = 0;
    while (i < j) {
        if (beads[i] !== beads[j]) changes++;
        i++; j--;
    }
    return changes;
};`,
    java: `class Solution {
    public int minRecolor(String beads) {
        int i = 0, j = beads.length() - 1, changes = 0;
        while (i < j) {
            if (beads.charAt(i) != beads.charAt(j)) changes++;
            i++; j--;
        }
        return changes;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRecolor(string beads) {
        int i = 0, j = (int)beads.size() - 1, changes = 0;
        while (i < j) {
            if (beads[i] != beads[j]) changes++;
            i++; j--;
        }
        return changes;
    }
};`,
  },

  // pghub-b10-canyon-echo — maxEchoDepth(s: str) -> int. Max paren depth, -1 if unbalanced.
  'pghub-b10-canyon-echo': {
    javascript: `var maxEchoDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else {
            depth--;
            if (depth < 0) return -1;
        }
    }
    return depth === 0 ? best : -1;
};`,
    java: `class Solution {
    public int maxEchoDepth(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
                depth--;
                if (depth < 0) return -1;
            }
        }
        return depth == 0 ? best : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxEchoDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
                depth--;
                if (depth < 0) return -1;
            }
        }
        return depth == 0 ? best : -1;
    }
};`,
  },

  // pghub-b10-cipher-shift-band — shiftBand(s: str, k: int) -> str. Caesar shift, lowercase.
  'pghub-b10-cipher-shift-band': {
    javascript: `var shiftBand = function(s, k) {
    k = ((k % 26) + 26) % 26;
    let res = '';
    for (const c of s) {
        const code = (c.charCodeAt(0) - 97 + k) % 26 + 97;
        res += String.fromCharCode(code);
    }
    return res;
};`,
    java: `class Solution {
    public String shiftBand(String s, int k) {
        k = ((k % 26) + 26) % 26;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            int code = (s.charAt(i) - 97 + k) % 26 + 97;
            sb.append((char) code);
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftBand(string s, int k) {
        k = ((k % 26) + 26) % 26;
        string res;
        for (char c : s) {
            int code = (c - 97 + k) % 26 + 97;
            res += (char) code;
        }
        return res;
    }
};`,
  },

  // pghub-b10-conveyor-defect — maxCleanRun(belt, k) -> int. Sliding window, <=k ones.
  'pghub-b10-conveyor-defect': {
    javascript: `var maxCleanRun = function(belt, k) {
    let left = 0, ones = 0, best = 0;
    for (let right = 0; right < belt.length; right++) {
        if (belt[right] === 1) ones++;
        while (ones > k) {
            if (belt[left] === 1) ones--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int maxCleanRun(int[] belt, int k) {
        int left = 0, ones = 0, best = 0;
        for (int right = 0; right < belt.length; right++) {
            if (belt[right] == 1) ones++;
            while (ones > k) {
                if (belt[left] == 1) ones--;
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
    int maxCleanRun(vector<int>& belt, int k) {
        int left = 0, ones = 0, best = 0;
        for (int right = 0; right < (int)belt.size(); right++) {
            if (belt[right] == 1) ones++;
            while (ones > k) {
                if (belt[left] == 1) ones--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // pghub-b10-frost-grid-spread — frostTime(grid: List[List[int]]) -> int. Multi-source BFS.
  'pghub-b10-frost-grid-spread': {
    javascript: `var frostTime = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const q = [];
    let fresh = 0, head = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 2) q.push([r, c, 0]);
            else if (grid[r][c] === 1) fresh++;
        }
    if (fresh === 0) return 0;
    let elapsed = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (head < q.length) {
        const [r, c, t] = q[head++];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
                grid[nr][nc] = 2;
                fresh--;
                elapsed = t + 1;
                q.push([nr, nc, t + 1]);
            }
        }
    }
    return fresh === 0 ? elapsed : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int frostTime(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        Deque<int[]> q = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.add(new int[]{r, c, 0});
                else if (grid[r][c] == 1) fresh++;
            }
        if (fresh == 0) return 0;
        int elapsed = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1], t = cur[2];
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    elapsed = t + 1;
                    q.add(new int[]{nr, nc, t + 1});
                }
            }
        }
        return fresh == 0 ? elapsed : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int frostTime(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        queue<array<int,3>> q;
        int fresh = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.push({r, c, 0});
                else if (grid[r][c] == 1) fresh++;
            }
        if (fresh == 0) return 0;
        int elapsed = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.empty()) {
            auto cur = q.front(); q.pop();
            int r = cur[0], c = cur[1], t = cur[2];
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    fresh--;
                    elapsed = t + 1;
                    q.push({nr, nc, t + 1});
                }
            }
        }
        return fresh == 0 ? elapsed : -1;
    }
};`,
  },

  // pghub-b10-glacier-melt-trees — rangeSum(preorder, lo, hi) -> int.
  // Build a BST by inserting preorder values, then sum nodes in [lo,hi] with pruning.
  'pghub-b10-glacier-melt-trees': {
    javascript: `var rangeSum = function(preorder, lo, hi) {
    let root = null;
    const insert = (node, v) => {
        if (node === null) return { val: v, left: null, right: null };
        if (v < node.val) node.left = insert(node.left, v);
        else node.right = insert(node.right, v);
        return node;
    };
    for (const v of preorder) root = insert(root, v);
    let total = 0;
    const stack = [root];
    while (stack.length) {
        const node = stack.pop();
        if (node === null) continue;
        if (lo <= node.val && node.val <= hi) total += node.val;
        if (node.val > lo) stack.push(node.left);
        if (node.val < hi) stack.push(node.right);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    static class Node {
        int val; Node left, right;
        Node(int v) { val = v; }
    }
    private Node insert(Node node, int v) {
        if (node == null) return new Node(v);
        if (v < node.val) node.left = insert(node.left, v);
        else node.right = insert(node.right, v);
        return node;
    }
    public int rangeSum(int[] preorder, int lo, int hi) {
        Node root = null;
        for (int v : preorder) root = insert(root, v);
        int total = 0;
        Deque<Node> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            Node node = stack.pop();
            if (node == null) continue;
            if (lo <= node.val && node.val <= hi) total += node.val;
            if (node.val > lo && node.left != null) stack.push(node.left);
            if (node.val < hi && node.right != null) stack.push(node.right);
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    struct Node { int val; Node* left; Node* right; Node(int v): val(v), left(nullptr), right(nullptr) {} };
    Node* insert(Node* node, int v) {
        if (!node) return new Node(v);
        if (v < node->val) node->left = insert(node->left, v);
        else node->right = insert(node->right, v);
        return node;
    }
    int rangeSum(vector<int>& preorder, int lo, int hi) {
        Node* root = nullptr;
        for (int v : preorder) root = insert(root, v);
        int total = 0;
        vector<Node*> stack;
        stack.push_back(root);
        while (!stack.empty()) {
            Node* node = stack.back(); stack.pop_back();
            if (!node) continue;
            if (lo <= node->val && node->val <= hi) total += node->val;
            if (node->val > lo) stack.push_back(node->left);
            if (node->val < hi) stack.push_back(node->right);
        }
        return total;
    }
};`,
  },

  // pghub-b10-lantern-glow — minLanterns(street, radius) -> int. Ceiling division.
  'pghub-b10-lantern-glow': {
    javascript: `var minLanterns = function(street, radius) {
    const span = 2 * radius + 1;
    return Math.floor((street + span - 1) / span);
};`,
    java: `class Solution {
    public int minLanterns(int street, int radius) {
        int span = 2 * radius + 1;
        return (street + span - 1) / span;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minLanterns(int street, int radius) {
        int span = 2 * radius + 1;
        return (street + span - 1) / span;
    }
};`,
  },

  // pghub-b10-mosaic-tiles — matchingPairs(colors: List[int]) -> int. Sum count//2.
  'pghub-b10-mosaic-tiles': {
    javascript: `var matchingPairs = function(colors) {
    const counts = new Map();
    for (const c of colors) counts.set(c, (counts.get(c) || 0) + 1);
    let total = 0;
    for (const v of counts.values()) total += Math.floor(v / 2);
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int matchingPairs(int[] colors) {
        Map<Integer,Integer> counts = new HashMap<>();
        for (int c : colors) counts.merge(c, 1, Integer::sum);
        int total = 0;
        for (int v : counts.values()) total += v / 2;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int matchingPairs(vector<int>& colors) {
        unordered_map<int,int> counts;
        for (int c : colors) counts[c]++;
        int total = 0;
        for (auto& kv : counts) total += kv.second / 2;
        return total;
    }
};`,
  },

  // pghub-b10-orchard-harvest — harvest(trees, days) -> int. Max-heap greedy, halve top.
  'pghub-b10-orchard-harvest': {
    javascript: `var harvest = function(trees, days) {
    // Max-heap via array kept sorted-on-demand is fine for small inputs;
    // use a binary max-heap for correctness/efficiency.
    const heap = trees.slice();
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] >= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let l = 2 * i + 1, r = 2 * i + 2, big = i;
            if (l < n && heap[l] > heap[big]) big = l;
            if (r < n && heap[r] > heap[big]) big = r;
            if (big === i) break;
            [heap[big], heap[i]] = [heap[i], heap[big]];
            i = big;
        }
    };
    for (let i = 1; i < heap.length; i++) up(i);
    let total = 0;
    for (let d = 0; d < days; d++) {
        const top = heap[0];
        total += top;
        heap[0] = Math.floor(top / 2);
        down(0);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int harvest(int[] trees, int days) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int t : trees) heap.add(t);
        long total = 0;
        for (int d = 0; d < days; d++) {
            int top = heap.poll();
            total += top;
            heap.add(top / 2);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int harvest(vector<int>& trees, int days) {
        priority_queue<int> heap(trees.begin(), trees.end());
        long long total = 0;
        for (int d = 0; d < days; d++) {
            int top = heap.top(); heap.pop();
            total += top;
            heap.push(top / 2);
        }
        return (int) total;
    }
};`,
  },

  // pghub-b10-pipe-pressure — minMaxLoad(jobs, workers) -> int.
  // Binary search on the max load; feasibility via backtracking placement.
  'pghub-b10-pipe-pressure': {
    javascript: `var minMaxLoad = function(jobs, workers) {
    jobs = jobs.slice().sort((a, b) => b - a);
    const feasible = (limit) => {
        const loads = new Array(workers).fill(0);
        const place = (i) => {
            if (i === jobs.length) return true;
            const seen = new Set();
            for (let w = 0; w < workers; w++) {
                if (seen.has(loads[w])) continue;
                if (loads[w] + jobs[i] <= limit) {
                    seen.add(loads[w]);
                    loads[w] += jobs[i];
                    if (place(i + 1)) return true;
                    loads[w] -= jobs[i];
                }
                if (loads[w] === 0) break;
            }
            return false;
        };
        return place(0);
    };
    let lo = Math.max(...jobs), hi = jobs.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `import java.util.*;
class Solution {
    private int[] jobs;
    private int workers;
    public int minMaxLoad(int[] jobsIn, int workers) {
        this.jobs = jobsIn.clone();
        this.workers = workers;
        Arrays.sort(jobs);
        for (int i = 0, j = jobs.length - 1; i < j; i++, j--) {
            int t = jobs[i]; jobs[i] = jobs[j]; jobs[j] = t;
        }
        int lo = jobs[0], hi = 0; // jobs[0] is the max after reverse sort
        for (int x : jobs) hi += x;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private boolean feasible(int limit) {
        int[] loads = new int[workers];
        return place(0, limit, loads);
    }
    private boolean place(int i, int limit, int[] loads) {
        if (i == jobs.length) return true;
        Set<Integer> seen = new HashSet<>();
        for (int w = 0; w < workers; w++) {
            if (seen.contains(loads[w])) continue;
            if (loads[w] + jobs[i] <= limit) {
                seen.add(loads[w]);
                loads[w] += jobs[i];
                if (place(i + 1, limit, loads)) return true;
                loads[w] -= jobs[i];
            }
            if (loads[w] == 0) break;
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> jobs;
    int workers;
    bool place(int i, int limit, vector<int>& loads) {
        if (i == (int)jobs.size()) return true;
        set<int> seen;
        for (int w = 0; w < workers; w++) {
            if (seen.count(loads[w])) continue;
            if (loads[w] + jobs[i] <= limit) {
                seen.insert(loads[w]);
                loads[w] += jobs[i];
                if (place(i + 1, limit, loads)) return true;
                loads[w] -= jobs[i];
            }
            if (loads[w] == 0) break;
        }
        return false;
    }
    bool feasible(int limit) {
        vector<int> loads(workers, 0);
        return place(0, limit, loads);
    }
    int minMaxLoad(vector<int>& jobsIn, int workers_) {
        jobs = jobsIn;
        workers = workers_;
        sort(jobs.rbegin(), jobs.rend());
        int lo = jobs[0], hi = 0;
        for (int x : jobs) hi += x;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // pghub-b10-relay-baton — countHandoffs(speeds: List[int]) -> int. Ascending-step count.
  'pghub-b10-relay-baton': {
    javascript: `var countHandoffs = function(speeds) {
    let count = 0;
    for (let i = 1; i < speeds.length; i++) {
        if (speeds[i] > speeds[i - 1]) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countHandoffs(int[] speeds) {
        int count = 0;
        for (int i = 1; i < speeds.length; i++) {
            if (speeds[i] > speeds[i - 1]) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countHandoffs(vector<int>& speeds) {
        int count = 0;
        for (int i = 1; i < (int)speeds.size(); i++) {
            if (speeds[i] > speeds[i - 1]) count++;
        }
        return count;
    }
};`,
  },

  // pghub-b10-river-stepping — minWetSteps(stones, jump) -> int. DP over reachable stones.
  'pghub-b10-river-stepping': {
    javascript: `var minWetSteps = function(stones, jump) {
    const n = stones.length;
    const INF = Infinity;
    const dp = new Array(n).fill(INF);
    for (let i = 0; i < n; i++) {
        const cost = stones[i];
        let bestPrev = i < jump ? 0 : INF;
        for (let j = Math.max(0, i - jump); j < i; j++) {
            if (dp[j] < bestPrev) bestPrev = dp[j];
        }
        dp[i] = bestPrev !== INF ? bestPrev + cost : INF;
    }
    return dp[n - 1];
};`,
    java: `class Solution {
    public int minWetSteps(int[] stones, int jump) {
        int n = stones.length;
        final int INF = Integer.MAX_VALUE;
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            int cost = stones[i];
            int bestPrev = i < jump ? 0 : INF;
            for (int j = Math.max(0, i - jump); j < i; j++) {
                if (dp[j] < bestPrev) bestPrev = dp[j];
            }
            dp[i] = bestPrev != INF ? bestPrev + cost : INF;
        }
        return dp[n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minWetSteps(vector<int>& stones, int jump) {
        int n = stones.size();
        const int INF = INT_MAX;
        vector<int> dp(n, INF);
        for (int i = 0; i < n; i++) {
            int cost = stones[i];
            int bestPrev = i < jump ? 0 : INF;
            for (int j = max(0, i - jump); j < i; j++) {
                if (dp[j] < bestPrev) bestPrev = dp[j];
            }
            dp[i] = bestPrev != INF ? bestPrev + cost : INF;
        }
        return dp[n - 1];
    }
};`,
  },

  // pghub-b10-summit-visibility — visibleSummits(heights: List[int]) -> int.
  // Scan right-to-left, count strictly increasing running max.
  'pghub-b10-summit-visibility': {
    javascript: `var visibleSummits = function(heights) {
    let count = 0, tallest = 0;
    for (let i = heights.length - 1; i >= 0; i--) {
        if (heights[i] > tallest) {
            count++;
            tallest = heights[i];
        }
    }
    return count;
};`,
    java: `class Solution {
    public int visibleSummits(int[] heights) {
        int count = 0, tallest = 0;
        for (int i = heights.length - 1; i >= 0; i--) {
            if (heights[i] > tallest) {
                count++;
                tallest = heights[i];
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int visibleSummits(vector<int>& heights) {
        int count = 0, tallest = 0;
        for (int i = (int)heights.size() - 1; i >= 0; i--) {
            if (heights[i] > tallest) {
                count++;
                tallest = heights[i];
            }
        }
        return count;
    }
};`,
  },

  // pghub-b10-treasure-split — canSplit(coins: List[int]) -> bool. Subset-sum to total/2.
  'pghub-b10-treasure-split': {
    javascript: `var canSplit = function(coins) {
    let total = 0;
    for (const c of coins) total += c;
    if (total % 2 !== 0) return false;
    const target = total / 2;
    let reachable = new Set([0]);
    for (const c of coins) {
        const nxt = new Set(reachable);
        for (const r of reachable) {
            if (r + c <= target) nxt.add(r + c);
        }
        reachable = nxt;
        if (reachable.has(target)) return true;
    }
    return reachable.has(target);
};`,
    java: `import java.util.*;
class Solution {
    public boolean canSplit(int[] coins) {
        int total = 0;
        for (int c : coins) total += c;
        if (total % 2 != 0) return false;
        int target = total / 2;
        Set<Integer> reachable = new HashSet<>();
        reachable.add(0);
        for (int c : coins) {
            Set<Integer> nxt = new HashSet<>(reachable);
            for (int r : reachable) {
                if (r + c <= target) nxt.add(r + c);
            }
            reachable = nxt;
            if (reachable.contains(target)) return true;
        }
        return reachable.contains(target);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplit(vector<int>& coins) {
        int total = 0;
        for (int c : coins) total += c;
        if (total % 2 != 0) return false;
        int target = total / 2;
        unordered_set<int> reachable;
        reachable.insert(0);
        for (int c : coins) {
            unordered_set<int> nxt(reachable);
            for (int r : reachable) {
                if (r + c <= target) nxt.insert(r + c);
            }
            reachable = nxt;
            if (reachable.count(target)) return true;
        }
        return reachable.count(target) > 0;
    }
};`,
  },

  // pghub-b10-vault-combination — comboScore(code: str) -> int. Alternating digit sum.
  'pghub-b10-vault-combination': {
    javascript: `var comboScore = function(code) {
    let total = 0;
    for (let i = 0; i < code.length; i++) {
        const d = code.charCodeAt(i) - 48;
        total += i % 2 === 0 ? d : -d;
    }
    return total;
};`,
    java: `class Solution {
    public int comboScore(String code) {
        int total = 0;
        for (int i = 0; i < code.length(); i++) {
            int d = code.charAt(i) - 48;
            total += (i % 2 == 0) ? d : -d;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int comboScore(string code) {
        int total = 0;
        for (int i = 0; i < (int)code.size(); i++) {
            int d = code[i] - 48;
            total += (i % 2 == 0) ? d : -d;
        }
        return total;
    }
};`,
  },

  // pghub-b11-bit-pairs — hammingPairsSum(nums: List[int]) -> int.
  // Per-bit: ones*(n-ones) pairs differ. Sum can exceed 32-bit → long.
  'pghub-b11-bit-pairs': {
    javascript: `var hammingPairsSum = function(nums) {
    let total = 0;
    const n = nums.length;
    for (let bit = 0; bit < 31; bit++) {
        let ones = 0;
        for (const x of nums) ones += (x >> bit) & 1;
        total += ones * (n - ones);
    }
    return total;
};`,
    java: `class Solution {
    public int hammingPairsSum(int[] nums) {
        long total = 0;
        int n = nums.length;
        for (int bit = 0; bit < 31; bit++) {
            long ones = 0;
            for (int x : nums) ones += (x >> bit) & 1;
            total += ones * (n - ones);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int hammingPairsSum(vector<int>& nums) {
        long long total = 0;
        int n = nums.size();
        for (int bit = 0; bit < 31; bit++) {
            long long ones = 0;
            for (int x : nums) ones += (x >> bit) & 1;
            total += ones * (n - ones);
        }
        return (int) total;
    }
};`,
  },

  // pghub-b11-coupon-stack — nextBetterCoupon(discounts: List[int]) -> List[int].
  // Next-greater-element via monotonic stack.
  'pghub-b11-coupon-stack': {
    javascript: `var nextBetterCoupon = function(discounts) {
    const n = discounts.length;
    const ans = new Array(n).fill(-1);
    const stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length && discounts[stack[stack.length - 1]] < discounts[i]) {
            ans[stack.pop()] = discounts[i];
        }
        stack.push(i);
    }
    return ans;
};`,
    java: `import java.util.*;
class Solution {
    public int[] nextBetterCoupon(int[] discounts) {
        int n = discounts.length;
        int[] ans = new int[n];
        Arrays.fill(ans, -1);
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && discounts[stack.peek()] < discounts[i]) {
                ans[stack.pop()] = discounts[i];
            }
            stack.push(i);
        }
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> nextBetterCoupon(vector<int>& discounts) {
        int n = discounts.size();
        vector<int> ans(n, -1);
        vector<int> stack;
        for (int i = 0; i < n; i++) {
            while (!stack.empty() && discounts[stack.back()] < discounts[i]) {
                ans[stack.back()] = discounts[i];
                stack.pop_back();
            }
            stack.push_back(i);
        }
        return ans;
    }
};`,
  },
};
