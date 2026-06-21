// batch-medium-2.mjs — next slice of MEDIUM zero-solution canonicals.
//
// Signatures verified against PGcode_problems (id / method_name / params /
// return_type). Each value carries the LeetCode-style method shape that
// wrapWithDriver expects. The backfill runner grades every language through
// Judge0 and only writes the ones that pass all stored test cases.
//
// NOTE on `Any` return types (count-numbers-with-unique-digits,
// solving-questions-with-brainpower, count-the-hidden-sequences): the wrapper
// casts the result to Object/auto and serializes via jsonify, so authoring a
// concrete scalar return type (int / long) compiles and grades correctly — same
// pattern already proven by transpose-matrix / richest-customer-wealth.

export default {
  // minCostConnectPoints(points: List[List[int]]) -> int  — Prim's MST, Manhattan.
  'min-cost-to-connect-all-points': {
    python: `class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        n = len(points)
        if n <= 1:
            return 0
        in_mst = [False] * n
        min_dist = [float('inf')] * n
        min_dist[0] = 0
        total = 0
        for _ in range(n):
            u = -1
            for v in range(n):
                if not in_mst[v] and (u == -1 or min_dist[v] < min_dist[u]):
                    u = v
            in_mst[u] = True
            total += min_dist[u]
            for v in range(n):
                if not in_mst[v]:
                    d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1])
                    if d < min_dist[v]:
                        min_dist[v] = d
        return total`,
    javascript: `var minCostConnectPoints = function(points) {
    const n = points.length;
    if (n <= 1) return 0;
    const inMst = new Array(n).fill(false);
    const minDist = new Array(n).fill(Infinity);
    minDist[0] = 0;
    let total = 0;
    for (let i = 0; i < n; i++) {
        let u = -1;
        for (let v = 0; v < n; v++)
            if (!inMst[v] && (u === -1 || minDist[v] < minDist[u])) u = v;
        inMst[u] = true;
        total += minDist[u];
        for (let v = 0; v < n; v++) {
            if (!inMst[v]) {
                const d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
                if (d < minDist[v]) minDist[v] = d;
            }
        }
    }
    return total;
};`,
    java: `class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        if (n <= 1) return 0;
        boolean[] inMst = new boolean[n];
        int[] minDist = new int[n];
        java.util.Arrays.fill(minDist, Integer.MAX_VALUE);
        minDist[0] = 0;
        int total = 0;
        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int v = 0; v < n; v++)
                if (!inMst[v] && (u == -1 || minDist[v] < minDist[u])) u = v;
            inMst[u] = true;
            total += minDist[u];
            for (int v = 0; v < n; v++) {
                if (!inMst[v]) {
                    int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
                    if (d < minDist[v]) minDist[v] = d;
                }
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCostConnectPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 1) return 0;
        vector<bool> inMst(n, false);
        vector<int> minDist(n, INT_MAX);
        minDist[0] = 0;
        int total = 0;
        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int v = 0; v < n; v++)
                if (!inMst[v] && (u == -1 || minDist[v] < minDist[u])) u = v;
            inMst[u] = true;
            total += minDist[u];
            for (int v = 0; v < n; v++) {
                if (!inMst[v]) {
                    int d = abs(points[u][0] - points[v][0]) + abs(points[u][1] - points[v][1]);
                    if (d < minDist[v]) minDist[v] = d;
                }
            }
        }
        return total;
    }
};`,
  },

  // removeStones(stones: List[List[int]]) -> int  — union-find on rows/cols.
  'most-stones-removed-with-same-row-or-column': {
    python: `class Solution:
    def removeStones(self, stones: List[List[int]]) -> int:
        parent = {}
        def find(x):
            parent.setdefault(x, x)
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        for r, c in stones:
            union(('r', r), ('c', c))
        roots = {find(('r', r)) for r, c in stones}
        return len(stones) - len(roots)`,
    javascript: `var removeStones = function(stones) {
    const parent = new Map();
    const find = (x) => {
        if (!parent.has(x)) parent.set(x, x);
        while (parent.get(x) !== x) {
            parent.set(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent.set(ra, rb);
    };
    for (const [r, c] of stones) union('r' + r, 'c' + c);
    const roots = new Set();
    for (const [r, c] of stones) roots.add(find('r' + r));
    return stones.length - roots.size;
};`,
    java: `import java.util.*;
class Solution {
    private Map<Integer, Integer> parent = new HashMap<>();
    public int removeStones(int[][] stones) {
        for (int[] s : stones) union(s[0], ~s[1]);
        Set<Integer> roots = new HashSet<>();
        for (int[] s : stones) roots.add(find(s[0]));
        return stones.length - roots.size();
    }
    private int find(int x) {
        parent.putIfAbsent(x, x);
        while (parent.get(x) != x) {
            parent.put(x, parent.get(parent.get(x)));
            x = parent.get(x);
        }
        return x;
    }
    private void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent.put(ra, rb);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    unordered_map<int,int> parent;
    int find(int x) {
        if (!parent.count(x)) parent[x] = x;
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    void uni(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }
    int removeStones(vector<vector<int>>& stones) {
        for (auto& s : stones) uni(s[0], ~s[1]);
        unordered_set<int> roots;
        for (auto& s : stones) roots.insert(find(s[0]));
        return (int)stones.size() - (int)roots.size();
    }
};`,
  },

  // findMaximizedCapital(k: int, w: int, profits: List[int], capital: List[int]) -> int
  'ipo': {
    python: `import heapq
class Solution:
    def findMaximizedCapital(self, k: int, w: int, profits: List[int], capital: List[int]) -> int:
        projects = sorted(zip(capital, profits))
        available = []
        i = 0
        n = len(projects)
        for _ in range(k):
            while i < n and projects[i][0] <= w:
                heapq.heappush(available, -projects[i][1])
                i += 1
            if not available:
                break
            w += -heapq.heappop(available)
        return w`,
    javascript: `var findMaximizedCapital = function(k, w, profits, capital) {
    const n = profits.length;
    const idx = Array.from({length: n}, (_, i) => i).sort((a, b) => capital[a] - capital[b]);
    // max-heap of profits via simple array + sift
    const heap = [];
    const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p] >= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; const m = heap.length; while (true) { let l = 2*i+1, r = 2*i+2, b = i; if (l < m && heap[l] > heap[b]) b = l; if (r < m && heap[r] > heap[b]) b = r; if (b === i) break; [heap[b], heap[i]] = [heap[i], heap[b]]; i = b; } } return top; };
    let i = 0;
    for (let j = 0; j < k; j++) {
        while (i < n && capital[idx[i]] <= w) { push(profits[idx[i]]); i++; }
        if (heap.length === 0) break;
        w += pop();
    }
    return w;
};`,
    java: `import java.util.*;
class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        Integer[] idx = new Integer[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> Integer.compare(capital[a], capital[b]));
        PriorityQueue<Integer> avail = new PriorityQueue<>(Collections.reverseOrder());
        int i = 0;
        for (int j = 0; j < k; j++) {
            while (i < n && capital[idx[i]] <= w) { avail.add(profits[idx[i]]); i++; }
            if (avail.isEmpty()) break;
            w += avail.poll();
        }
        return w;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {
        int n = profits.size();
        vector<int> idx(n);
        for (int i = 0; i < n; i++) idx[i] = i;
        sort(idx.begin(), idx.end(), [&](int a, int b){ return capital[a] < capital[b]; });
        priority_queue<int> avail;
        int i = 0;
        for (int j = 0; j < k; j++) {
            while (i < n && capital[idx[i]] <= w) { avail.push(profits[idx[i]]); i++; }
            if (avail.empty()) break;
            w += avail.top(); avail.pop();
        }
        return w;
    }
};`,
  },

  // integerBreak(n: int) -> int  — DP, max product of >=2 parts.
  'integer-break': {
    python: `class Solution:
    def integerBreak(self, n: int) -> int:
        dp = [0] * (n + 1)
        dp[1] = 1
        for i in range(2, n + 1):
            for j in range(1, i):
                dp[i] = max(dp[i], j * (i - j), j * dp[i - j])
        return dp[n]`,
    javascript: `var integerBreak = function(n) {
    const dp = new Array(n + 1).fill(0);
    dp[1] = 1;
    for (let i = 2; i <= n; i++)
        for (let j = 1; j < i; j++)
            dp[i] = Math.max(dp[i], j * (i - j), j * dp[i - j]);
    return dp[n];
};`,
    java: `class Solution {
    public int integerBreak(int n) {
        int[] dp = new int[n + 1];
        dp[1] = 1;
        for (int i = 2; i <= n; i++)
            for (int j = 1; j < i; j++)
                dp[i] = Math.max(dp[i], Math.max(j * (i - j), j * dp[i - j]));
        return dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int integerBreak(int n) {
        vector<int> dp(n + 1, 0);
        dp[1] = 1;
        for (int i = 2; i <= n; i++)
            for (int j = 1; j < i; j++)
                dp[i] = max(dp[i], max(j * (i - j), j * dp[i - j]));
        return dp[n];
    }
};`,
  },

  // minCost(costs: List[List[int]]) -> int  — paint-house DP.
  'paint-house': {
    python: `class Solution:
    def minCost(self, costs: List[List[int]]) -> int:
        if not costs:
            return 0
        a, b, c = costs[0]
        for i in range(1, len(costs)):
            r, g, bl = costs[i]
            a, b, c = r + min(b, c), g + min(a, c), bl + min(a, b)
        return min(a, b, c)`,
    javascript: `var minCost = function(costs) {
    if (!costs || costs.length === 0) return 0;
    let [a, b, c] = costs[0];
    for (let i = 1; i < costs.length; i++) {
        const [r, g, bl] = costs[i];
        const na = r + Math.min(b, c);
        const nb = g + Math.min(a, c);
        const nc = bl + Math.min(a, b);
        a = na; b = nb; c = nc;
    }
    return Math.min(a, b, c);
};`,
    java: `class Solution {
    public int minCost(int[][] costs) {
        if (costs == null || costs.length == 0) return 0;
        int a = costs[0][0], b = costs[0][1], c = costs[0][2];
        for (int i = 1; i < costs.length; i++) {
            int na = costs[i][0] + Math.min(b, c);
            int nb = costs[i][1] + Math.min(a, c);
            int nc = costs[i][2] + Math.min(a, b);
            a = na; b = nb; c = nc;
        }
        return Math.min(a, Math.min(b, c));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<vector<int>>& costs) {
        if (costs.empty()) return 0;
        int a = costs[0][0], b = costs[0][1], c = costs[0][2];
        for (size_t i = 1; i < costs.size(); i++) {
            int na = costs[i][0] + min(b, c);
            int nb = costs[i][1] + min(a, c);
            int nc = costs[i][2] + min(a, b);
            a = na; b = nb; c = nc;
        }
        return min(a, min(b, c));
    }
};`,
  },

  // sortList(head: List[int]) -> List[int]  — stored as plain int arrays; sort ascending.
  'sort-list': {
    python: `class Solution:
    def sortList(self, head: List[int]) -> List[int]:
        return sorted(head)`,
    javascript: `var sortList = function(head) {
    return head.slice().sort((a, b) => a - b);
};`,
    java: `import java.util.*;
class Solution {
    public int[] sortList(int[] head) {
        int[] res = head.clone();
        Arrays.sort(res);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortList(vector<int>& head) {
        vector<int> res = head;
        sort(res.begin(), res.end());
        return res;
    }
};`,
  },

  // reorderList(head: List[int]) -> List[int]  — L0,Ln,L1,Ln-1,...; arrays in/out.
  'reorder-list': {
    python: `class Solution:
    def reorderList(self, head: List[int]) -> List[int]:
        res = []
        i, j = 0, len(head) - 1
        toggle = True
        while i <= j:
            if toggle:
                res.append(head[i])
                i += 1
            else:
                res.append(head[j])
                j -= 1
            toggle = not toggle
        return res`,
    javascript: `var reorderList = function(head) {
    const res = [];
    let i = 0, j = head.length - 1, toggle = true;
    while (i <= j) {
        if (toggle) { res.push(head[i]); i++; }
        else { res.push(head[j]); j--; }
        toggle = !toggle;
    }
    return res;
};`,
    java: `class Solution {
    public int[] reorderList(int[] head) {
        int n = head.length;
        int[] res = new int[n];
        int i = 0, j = n - 1, k = 0;
        boolean toggle = true;
        while (i <= j) {
            if (toggle) res[k++] = head[i++];
            else res[k++] = head[j--];
            toggle = !toggle;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reorderList(vector<int>& head) {
        vector<int> res;
        int i = 0, j = (int)head.size() - 1;
        bool toggle = true;
        while (i <= j) {
            if (toggle) res.push_back(head[i++]);
            else res.push_back(head[j--]);
            toggle = !toggle;
        }
        return res;
    }
};`,
  },

  // deleteMiddle(head: List[int]) -> List[int]  — drop the middle (n/2) element.
  'delete-the-middle-node-of-a-linked-list': {
    python: `class Solution:
    def deleteMiddle(self, head: List[int]) -> List[int]:
        n = len(head)
        if n <= 1:
            return []
        mid = n // 2
        return head[:mid] + head[mid + 1:]`,
    javascript: `var deleteMiddle = function(head) {
    const n = head.length;
    if (n <= 1) return [];
    const mid = Math.floor(n / 2);
    return head.slice(0, mid).concat(head.slice(mid + 1));
};`,
    java: `import java.util.*;
class Solution {
    public int[] deleteMiddle(int[] head) {
        int n = head.length;
        if (n <= 1) return new int[0];
        int mid = n / 2;
        int[] res = new int[n - 1];
        int k = 0;
        for (int i = 0; i < n; i++) if (i != mid) res[k++] = head[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> deleteMiddle(vector<int>& head) {
        int n = head.size();
        if (n <= 1) return {};
        int mid = n / 2;
        vector<int> res;
        for (int i = 0; i < n; i++) if (i != mid) res.push_back(head[i]);
        return res;
    }
};`,
  },

  // cloneGraph(adj: List[List[int]], startVal: int) -> List[List[int]]
  // adj is 1-indexed adjacency; deep-clone and re-emit adjacency in node order.
  'clone-graph': {
    python: `class Solution:
    def cloneGraph(self, adj: List[List[int]], startVal: int) -> List[List[int]]:
        return [list(neighbors) for neighbors in adj]`,
    javascript: `var cloneGraph = function(adj, startVal) {
    return adj.map(neighbors => neighbors.slice());
};`,
    java: `class Solution {
    public int[][] cloneGraph(int[][] adj, int startVal) {
        int[][] res = new int[adj.length][];
        for (int i = 0; i < adj.length; i++) res[i] = adj[i].clone();
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> cloneGraph(vector<vector<int>>& adj, int startVal) {
        return adj;
    }
};`,
  },

  // countNumbersWithUniqueDigits(input: int) -> Any (int)  — combinatorial DP.
  'count-numbers-with-unique-digits': {
    python: `class Solution:
    def countNumbersWithUniqueDigits(self, input: int) -> Any:
        if input == 0:
            return 1
        total = 10
        unique = 9
        available = 9
        for _ in range(2, input + 1):
            unique *= available
            total += unique
            available -= 1
            if available == 0:
                break
        return total`,
    javascript: `var countNumbersWithUniqueDigits = function(input) {
    if (input === 0) return 1;
    let total = 10, unique = 9, available = 9;
    for (let i = 2; i <= input; i++) {
        unique *= available;
        total += unique;
        available--;
        if (available === 0) break;
    }
    return total;
};`,
    java: `class Solution {
    public int countNumbersWithUniqueDigits(int input) {
        if (input == 0) return 1;
        int total = 10, unique = 9, available = 9;
        for (int i = 2; i <= input; i++) {
            unique *= available;
            total += unique;
            available--;
            if (available == 0) break;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countNumbersWithUniqueDigits(int input) {
        if (input == 0) return 1;
        long long total = 10, unique = 9;
        int available = 9;
        for (int i = 2; i <= input; i++) {
            unique *= available;
            total += unique;
            available--;
            if (available == 0) break;
        }
        return (int)total;
    }
};`,
  },

  // minimumTotal(triangle: List[List[int]]) -> int  — bottom-up DP.
  'triangle': {
    python: `class Solution:
    def minimumTotal(self, triangle: List[List[int]]) -> int:
        dp = triangle[-1][:]
        for i in range(len(triangle) - 2, -1, -1):
            for j in range(len(triangle[i])):
                dp[j] = triangle[i][j] + min(dp[j], dp[j + 1])
        return dp[0]`,
    javascript: `var minimumTotal = function(triangle) {
    const dp = triangle[triangle.length - 1].slice();
    for (let i = triangle.length - 2; i >= 0; i--)
        for (let j = 0; j < triangle[i].length; j++)
            dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    return dp[0];
};`,
    java: `class Solution {
    public int minimumTotal(int[][] triangle) {
        int n = triangle.length;
        int[] dp = triangle[n - 1].clone();
        for (int i = n - 2; i >= 0; i--)
            for (int j = 0; j < triangle[i].length; j++)
                dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
        return dp[0];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {
        vector<int> dp = triangle.back();
        for (int i = (int)triangle.size() - 2; i >= 0; i--)
            for (int j = 0; j < (int)triangle[i].size(); j++)
                dp[j] = triangle[i][j] + min(dp[j], dp[j + 1]);
        return dp[0];
    }
};`,
  },

  // isInterleave(s1: str, s2: str, s3: str) -> bool  — 2D DP.
  'interleaving-string': {
    python: `class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        m, n = len(s1), len(s2)
        if m + n != len(s3):
            return False
        dp = [False] * (n + 1)
        dp[0] = True
        for j in range(1, n + 1):
            dp[j] = dp[j - 1] and s2[j - 1] == s3[j - 1]
        for i in range(1, m + 1):
            dp[0] = dp[0] and s1[i - 1] == s3[i - 1]
            for j in range(1, n + 1):
                dp[j] = (dp[j] and s1[i - 1] == s3[i + j - 1]) or \\
                        (dp[j - 1] and s2[j - 1] == s3[i + j - 1])
        return dp[n]`,
    javascript: `var isInterleave = function(s1, s2, s3) {
    const m = s1.length, n = s2.length;
    if (m + n !== s3.length) return false;
    const dp = new Array(n + 1).fill(false);
    dp[0] = true;
    for (let j = 1; j <= n; j++) dp[j] = dp[j - 1] && s2[j - 1] === s3[j - 1];
    for (let i = 1; i <= m; i++) {
        dp[0] = dp[0] && s1[i - 1] === s3[i - 1];
        for (let j = 1; j <= n; j++) {
            dp[j] = (dp[j] && s1[i - 1] === s3[i + j - 1]) ||
                    (dp[j - 1] && s2[j - 1] === s3[i + j - 1]);
        }
    }
    return dp[n];
};`,
    java: `class Solution {
    public boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j - 1] && s2.charAt(j - 1) == s3.charAt(j - 1);
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && s1.charAt(i - 1) == s3.charAt(i - 1);
            for (int j = 1; j <= n; j++) {
                dp[j] = (dp[j] && s1.charAt(i - 1) == s3.charAt(i + j - 1)) ||
                        (dp[j - 1] && s2.charAt(j - 1) == s3.charAt(i + j - 1));
            }
        }
        return dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isInterleave(string s1, string s2, string s3) {
        int m = s1.size(), n = s2.size();
        if (m + n != (int)s3.size()) return false;
        vector<bool> dp(n + 1, false);
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j - 1] && s2[j - 1] == s3[j - 1];
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && s1[i - 1] == s3[i - 1];
            for (int j = 1; j <= n; j++) {
                dp[j] = (dp[j] && s1[i - 1] == s3[i + j - 1]) ||
                        (dp[j - 1] && s2[j - 1] == s3[i + j - 1]);
            }
        }
        return dp[n];
    }
};`,
  },

  // findAndReplacePattern(words: List[str], pattern: str) -> List[str]  — bijection.
  'find-and-replace-pattern': {
    python: `class Solution:
    def findAndReplacePattern(self, words: List[str], pattern: str) -> List[str]:
        def matches(w):
            if len(w) != len(pattern):
                return False
            w2p, p2w = {}, {}
            for a, b in zip(w, pattern):
                if a in w2p and w2p[a] != b:
                    return False
                if b in p2w and p2w[b] != a:
                    return False
                w2p[a] = b
                p2w[b] = a
            return True
        return [w for w in words if matches(w)]`,
    javascript: `var findAndReplacePattern = function(words, pattern) {
    const matches = (w) => {
        if (w.length !== pattern.length) return false;
        const w2p = new Map(), p2w = new Map();
        for (let i = 0; i < w.length; i++) {
            const a = w[i], b = pattern[i];
            if (w2p.has(a) && w2p.get(a) !== b) return false;
            if (p2w.has(b) && p2w.get(b) !== a) return false;
            w2p.set(a, b); p2w.set(b, a);
        }
        return true;
    };
    return words.filter(matches);
};`,
    java: `import java.util.*;
class Solution {
    public List<String> findAndReplacePattern(String[] words, String pattern) {
        List<String> res = new ArrayList<>();
        for (String w : words) if (matches(w, pattern)) res.add(w);
        return res;
    }
    private boolean matches(String w, String pattern) {
        if (w.length() != pattern.length()) return false;
        Map<Character, Character> w2p = new HashMap<>(), p2w = new HashMap<>();
        for (int i = 0; i < w.length(); i++) {
            char a = w.charAt(i), b = pattern.charAt(i);
            if (w2p.containsKey(a) && w2p.get(a) != b) return false;
            if (p2w.containsKey(b) && p2w.get(b) != a) return false;
            w2p.put(a, b); p2w.put(b, a);
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool matches(const string& w, const string& pattern) {
        if (w.size() != pattern.size()) return false;
        unordered_map<char, char> w2p, p2w;
        for (size_t i = 0; i < w.size(); i++) {
            char a = w[i], b = pattern[i];
            if (w2p.count(a) && w2p[a] != b) return false;
            if (p2w.count(b) && p2w[b] != a) return false;
            w2p[a] = b; p2w[b] = a;
        }
        return true;
    }
    vector<string> findAndReplacePattern(vector<string>& words, string pattern) {
        vector<string> res;
        for (auto& w : words) if (matches(w, pattern)) res.push_back(w);
        return res;
    }
};`,
  },

  // numSubarrayProductLessThanK(nums: List[int], k: int) -> int  — sliding window.
  'subarray-product-less-than-k': {
    python: `class Solution:
    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:
        if k <= 1:
            return 0
        prod = 1
        left = 0
        count = 0
        for right in range(len(nums)):
            prod *= nums[right]
            while prod >= k:
                prod //= nums[left]
                left += 1
            count += right - left + 1
        return count`,
    javascript: `var numSubarrayProductLessThanK = function(nums, k) {
    if (k <= 1) return 0;
    let prod = 1, left = 0, count = 0;
    for (let right = 0; right < nums.length; right++) {
        prod *= nums[right];
        while (prod >= k) { prod /= nums[left]; left++; }
        count += right - left + 1;
    }
    return count;
};`,
    java: `class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        if (k <= 1) return 0;
        long prod = 1;
        int left = 0, count = 0;
        for (int right = 0; right < nums.length; right++) {
            prod *= nums[right];
            while (prod >= k) { prod /= nums[left]; left++; }
            count += right - left + 1;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numSubarrayProductLessThanK(vector<int>& nums, int k) {
        if (k <= 1) return 0;
        long long prod = 1;
        int left = 0, count = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            prod *= nums[right];
            while (prod >= k) { prod /= nums[left]; left++; }
            count += right - left + 1;
        }
        return count;
    }
};`,
  },

  // numSubarraysWithSum(nums: List[int], goal: int) -> int  — prefix-count (0/1 array).
  'binary-subarrays-with-sum': {
    python: `class Solution:
    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:
        count = {0: 1}
        prefix = 0
        res = 0
        for x in nums:
            prefix += x
            res += count.get(prefix - goal, 0)
            count[prefix] = count.get(prefix, 0) + 1
        return res`,
    javascript: `var numSubarraysWithSum = function(nums, goal) {
    const count = new Map([[0, 1]]);
    let prefix = 0, res = 0;
    for (const x of nums) {
        prefix += x;
        res += count.get(prefix - goal) || 0;
        count.set(prefix, (count.get(prefix) || 0) + 1);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int numSubarraysWithSum(int[] nums, int goal) {
        Map<Integer, Integer> count = new HashMap<>();
        count.put(0, 1);
        int prefix = 0, res = 0;
        for (int x : nums) {
            prefix += x;
            res += count.getOrDefault(prefix - goal, 0);
            count.put(prefix, count.getOrDefault(prefix, 0) + 1);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numSubarraysWithSum(vector<int>& nums, int goal) {
        unordered_map<int, int> count;
        count[0] = 1;
        int prefix = 0, res = 0;
        for (int x : nums) {
            prefix += x;
            res += count.count(prefix - goal) ? count[prefix - goal] : 0;
            count[prefix]++;
        }
        return res;
    }
};`,
  },

  // minimumRounds(tasks: List[int]) -> int  — count groups, each cleared in 3s/2s; -1 if any singleton.
  'minimum-rounds-to-complete-all-tasks': {
    python: `class Solution:
    def minimumRounds(self, tasks: List[int]) -> int:
        from collections import Counter
        rounds = 0
        for c in Counter(tasks).values():
            if c == 1:
                return -1
            rounds += (c + 2) // 3
        return rounds`,
    javascript: `var minimumRounds = function(tasks) {
    const freq = new Map();
    for (const t of tasks) freq.set(t, (freq.get(t) || 0) + 1);
    let rounds = 0;
    for (const c of freq.values()) {
        if (c === 1) return -1;
        rounds += Math.floor((c + 2) / 3);
    }
    return rounds;
};`,
    java: `import java.util.*;
class Solution {
    public int minimumRounds(int[] tasks) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int t : tasks) freq.put(t, freq.getOrDefault(t, 0) + 1);
        int rounds = 0;
        for (int c : freq.values()) {
            if (c == 1) return -1;
            rounds += (c + 2) / 3;
        }
        return rounds;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minimumRounds(vector<int>& tasks) {
        unordered_map<int, int> freq;
        for (int t : tasks) freq[t]++;
        int rounds = 0;
        for (auto& p : freq) {
            if (p.second == 1) return -1;
            rounds += (p.second + 2) / 3;
        }
        return rounds;
    }
};`,
  },

  // mostPoints(input: List[List[int]]) -> Any (long)  — pick/skip DP from the end.
  'solving-questions-with-brainpower': {
    python: `class Solution:
    def mostPoints(self, input: List[List[int]]) -> Any:
        n = len(input)
        dp = [0] * (n + 1)
        for i in range(n - 1, -1, -1):
            points, brainpower = input[i]
            nxt = i + brainpower + 1
            take = points + (dp[nxt] if nxt <= n else 0)
            dp[i] = max(take, dp[i + 1])
        return dp[0]`,
    javascript: `var mostPoints = function(input) {
    const n = input.length;
    const dp = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        const [points, brainpower] = input[i];
        const nxt = i + brainpower + 1;
        const take = points + (nxt <= n ? dp[nxt] : 0);
        dp[i] = Math.max(take, dp[i + 1]);
    }
    return dp[0];
};`,
    java: `class Solution {
    public long mostPoints(int[][] input) {
        int n = input.length;
        long[] dp = new long[n + 1];
        for (int i = n - 1; i >= 0; i--) {
            int points = input[i][0], brainpower = input[i][1];
            int nxt = i + brainpower + 1;
            long take = points + (nxt <= n ? dp[nxt] : 0);
            dp[i] = Math.max(take, dp[i + 1]);
        }
        return dp[0];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long mostPoints(vector<vector<int>>& input) {
        int n = input.size();
        vector<long long> dp(n + 1, 0);
        for (int i = n - 1; i >= 0; i--) {
            int points = input[i][0], brainpower = input[i][1];
            int nxt = i + brainpower + 1;
            long long take = points + (nxt <= n ? dp[nxt] : 0);
            dp[i] = max(take, dp[i + 1]);
        }
        return dp[0];
    }
};`,
  },

  // maxProbability(n, edges, succProb, start, end) -> float  — Dijkstra on max product.
  'path-with-maximum-probability': {
    python: `import heapq
class Solution:
    def maxProbability(self, n: int, edges: List[List[int]], succProb: List[float], start: int, end: int) -> float:
        graph = [[] for _ in range(n)]
        for (a, b), p in zip(edges, succProb):
            graph[a].append((b, p))
            graph[b].append((a, p))
        best = [0.0] * n
        best[start] = 1.0
        heap = [(-1.0, start)]
        while heap:
            negp, node = heapq.heappop(heap)
            prob = -negp
            if node == end:
                return prob
            if prob < best[node]:
                continue
            for nei, ep in graph[node]:
                np = prob * ep
                if np > best[nei]:
                    best[nei] = np
                    heapq.heappush(heap, (-np, nei))
        return 0.0`,
    javascript: `var maxProbability = function(n, edges, succProb, start, end) {
    const graph = Array.from({length: n}, () => []);
    for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i], p = succProb[i];
        graph[a].push([b, p]);
        graph[b].push([a, p]);
    }
    const best = new Array(n).fill(0);
    best[start] = 1;
    // max-heap by probability
    const heap = [[1, start]];
    const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
    const push = (item) => { heap.push(item); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] >= heap[i][0]) break; swap(p, i); i = p; } };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0, m = heap.length; while (true) { let l = 2*i+1, r = 2*i+2, b = i; if (l < m && heap[l][0] > heap[b][0]) b = l; if (r < m && heap[r][0] > heap[b][0]) b = r; if (b === i) break; swap(b, i); i = b; } } return top; };
    while (heap.length) {
        const [prob, node] = pop();
        if (node === end) return prob;
        if (prob < best[node]) continue;
        for (const [nei, ep] of graph[node]) {
            const np = prob * ep;
            if (np > best[nei]) { best[nei] = np; push([np, nei]); }
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
        List<double[]>[] graph = new List[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            int a = edges[i][0], b = edges[i][1];
            graph[a].add(new double[]{b, succProb[i]});
            graph[b].add(new double[]{a, succProb[i]});
        }
        double[] best = new double[n];
        best[start] = 1.0;
        PriorityQueue<double[]> heap = new PriorityQueue<>((x, y) -> Double.compare(y[0], x[0]));
        heap.add(new double[]{1.0, start});
        while (!heap.isEmpty()) {
            double[] cur = heap.poll();
            double prob = cur[0];
            int node = (int) cur[1];
            if (node == end) return prob;
            if (prob < best[node]) continue;
            for (double[] e : graph[node]) {
                int nei = (int) e[0];
                double np = prob * e[1];
                if (np > best[nei]) { best[nei] = np; heap.add(new double[]{np, nei}); }
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
        for (size_t i = 0; i < edges.size(); i++) {
            int a = edges[i][0], b = edges[i][1];
            graph[a].push_back({b, succProb[i]});
            graph[b].push_back({a, succProb[i]});
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
                if (np > best[nei]) { best[nei] = np; heap.push({np, nei}); }
            }
        }
        return 0.0;
    }
};`,
  },

  // numberOfArrays(nums: List[int], lower: int, upper: int) -> Any (int)
  // nums = differences; count valid start values keeping prefix in [lower, upper].
  'count-the-hidden-sequences': {
    python: `class Solution:
    def numberOfArrays(self, nums: List[int], target: int, k: int) -> Any:
        prefix = 0
        lo = hi = 0
        for d in nums:
            prefix += d
            lo = min(lo, prefix)
            hi = max(hi, prefix)
        return max(0, (k - target) - (hi - lo) + 1)`,
    javascript: `var numberOfArrays = function(nums, target, k) {
    let prefix = 0, lo = 0, hi = 0;
    for (const d of nums) {
        prefix += d;
        lo = Math.min(lo, prefix);
        hi = Math.max(hi, prefix);
    }
    return Math.max(0, (k - target) - (hi - lo) + 1);
};`,
    java: `class Solution {
    public int numberOfArrays(int[] nums, int target, int k) {
        long prefix = 0, lo = 0, hi = 0;
        for (int d : nums) {
            prefix += d;
            lo = Math.min(lo, prefix);
            hi = Math.max(hi, prefix);
        }
        return (int) Math.max(0L, ((long) k - target) - (hi - lo) + 1);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numberOfArrays(vector<int>& nums, int target, int k) {
        long long prefix = 0, lo = 0, hi = 0;
        for (int d : nums) {
            prefix += d;
            lo = min(lo, prefix);
            hi = max(hi, prefix);
        }
        return (int)max(0LL, ((long long)k - target) - (hi - lo) + 1);
    }
};`,
  },

  // divideArray(nums: List[int], k: int) -> List[List[int]]  — sort, group in 3s.
  'divide-array-into-arrays-with-max-difference': {
    python: `class Solution:
    def divideArray(self, nums: List[int], k: int) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(0, len(nums), 3):
            if nums[i + 2] - nums[i] > k:
                return []
            res.append([nums[i], nums[i + 1], nums[i + 2]])
        return res`,
    javascript: `var divideArray = function(nums, k) {
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length; i += 3) {
        if (nums[i + 2] - nums[i] > k) return [];
        res.push([nums[i], nums[i + 1], nums[i + 2]]);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] divideArray(int[] nums, int k) {
        Arrays.sort(nums);
        int groups = nums.length / 3;
        int[][] res = new int[groups][3];
        for (int i = 0, g = 0; i < nums.length; i += 3, g++) {
            if (nums[i + 2] - nums[i] > k) return new int[0][0];
            res[g][0] = nums[i];
            res[g][1] = nums[i + 1];
            res[g][2] = nums[i + 2];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> divideArray(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        for (size_t i = 0; i < nums.size(); i += 3) {
            if (nums[i + 2] - nums[i] > k) return {};
            res.push_back({nums[i], nums[i + 1], nums[i + 2]});
        }
        return res;
    }
};`,
  },
};
