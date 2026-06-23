// xlate-7.mjs — faithful JS/Java/C++ translations of verified Python references
// for slugs at filtered-targets indices [180, 210). Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
// Reference = solutions.python in PGcode_problems. Graded by backfill-solutions.mjs
// against stored test_cases via Judge0; only passing langs are written.
//
// Notes on faithful porting:
//   - pghub-b21-zigzag-tree: tree is List[int] using -1 as the null sentinel
//     (NOT Python `null` tokens), so it grades cleanly as a plain int array.
//   - heapq → hand-rolled binary min-heap in JS; PriorityQueue / priority_queue
//     (min via greater<>) in Java/C++.
//   - integer-division / modulo parity preserved; non-negative results only here.
//
// SKIPPED: none — all 30 slugs have primitive/List-typed gradeable signatures.

export default {
  // distinctSums(nums: List[int]) -> List[int]  — power-set sums, sorted distinct.
  'pghub-b21-subset-sum-recur': {
    javascript: `var distinctSums = function(nums) {
    const sums = new Set();
    const recurse = (idx, total) => {
        if (idx === nums.length) { sums.add(total); return; }
        recurse(idx + 1, total);
        recurse(idx + 1, total + nums[idx]);
    };
    recurse(0, 0);
    return Array.from(sums).sort((a, b) => a - b);
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> distinctSums(int[] nums) {
        Set<Integer> sums = new HashSet<>();
        recurse(nums, 0, 0, sums);
        List<Integer> res = new ArrayList<>(sums);
        Collections.sort(res);
        return res;
    }
    private void recurse(int[] nums, int idx, int total, Set<Integer> sums) {
        if (idx == nums.length) { sums.add(total); return; }
        recurse(nums, idx + 1, total, sums);
        recurse(nums, idx + 1, total + nums[idx], sums);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> distinctSums(vector<int>& nums) {
        set<int> sums;
        function<void(int,int)> recurse = [&](int idx, int total) {
            if (idx == (int)nums.size()) { sums.insert(total); return; }
            recurse(idx + 1, total);
            recurse(idx + 1, total + nums[idx]);
        };
        recurse(0, 0);
        return vector<int>(sums.begin(), sums.end());
    }
};`,
  },

  // rotateRight(items: List[int], k: int) -> List[int]  — right-rotate by k%n.
  'pghub-b21-warehouse-rotate': {
    javascript: `var rotateRight = function(items, k) {
    const n = items.length;
    k %= n;
    if (k === 0) return items.slice();
    return items.slice(n - k).concat(items.slice(0, n - k));
};`,
    java: `class Solution {
    public int[] rotateRight(int[] items, int k) {
        int n = items.length;
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[(i + k) % n] = items[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& items, int k) {
        int n = items.size();
        k %= n;
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[(i + k) % n] = items[i];
        return res;
    }
};`,
  },

  // maxXorPair(nums: List[int]) -> int  — bitwise trie, max XOR over pairs.
  'pghub-b21-xor-pairs': {
    javascript: `var maxXorPair = function(nums) {
    if (nums.length < 2) return 0;
    const HIGH = 31;
    const root = {};
    const insert = (x) => {
        let node = root;
        for (let b = HIGH; b >= 0; b--) {
            const bit = (x >> b) & 1;
            if (!(bit in node)) node[bit] = {};
            node = node[bit];
        }
    };
    const query = (x) => {
        let node = root, best = 0;
        for (let b = HIGH; b >= 0; b--) {
            const bit = (x >> b) & 1;
            const want = 1 - bit;
            if (want in node) { best |= (1 << b); node = node[want]; }
            else node = node[bit];
        }
        return best;
    };
    insert(nums[0]);
    let answer = 0;
    for (let i = 1; i < nums.length; i++) {
        answer = Math.max(answer, query(nums[i]));
        insert(nums[i]);
    }
    return answer;
};`,
    java: `import java.util.*;
class Solution {
    static class Node { Node[] ch = new Node[2]; }
    public int maxXorPair(int[] nums) {
        if (nums.length < 2) return 0;
        final int HIGH = 31;
        Node root = new Node();
        insert(root, nums[0], HIGH);
        int answer = 0;
        for (int i = 1; i < nums.length; i++) {
            answer = Math.max(answer, query(root, nums[i], HIGH));
            insert(root, nums[i], HIGH);
        }
        return answer;
    }
    private void insert(Node root, int x, int HIGH) {
        Node node = root;
        for (int b = HIGH; b >= 0; b--) {
            int bit = (x >> b) & 1;
            if (node.ch[bit] == null) node.ch[bit] = new Node();
            node = node.ch[bit];
        }
    }
    private int query(Node root, int x, int HIGH) {
        Node node = root;
        int best = 0;
        for (int b = HIGH; b >= 0; b--) {
            int bit = (x >> b) & 1;
            int want = 1 - bit;
            if (node.ch[want] != null) { best |= (1 << b); node = node.ch[want]; }
            else node = node.ch[bit];
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
    struct Node { Node* ch[2] = {nullptr, nullptr}; };
public:
    int maxXorPair(vector<int>& nums) {
        if (nums.size() < 2) return 0;
        const int HIGH = 31;
        Node* root = new Node();
        auto insert = [&](int x) {
            Node* node = root;
            for (int b = HIGH; b >= 0; b--) {
                int bit = (x >> b) & 1;
                if (!node->ch[bit]) node->ch[bit] = new Node();
                node = node->ch[bit];
            }
        };
        auto query = [&](int x) {
            Node* node = root;
            int best = 0;
            for (int b = HIGH; b >= 0; b--) {
                int bit = (x >> b) & 1;
                int want = 1 - bit;
                if (node->ch[want]) { best |= (1 << b); node = node->ch[want]; }
                else node = node->ch[bit];
            }
            return best;
        };
        insert(nums[0]);
        int answer = 0;
        for (size_t i = 1; i < nums.size(); i++) {
            answer = max(answer, query(nums[i]));
            insert(nums[i]);
        }
        return answer;
    }
};`,
  },

  // zigzagLevels(tree: List[int]) -> List[List[int]]  — compact level-order array
  // with -1 as null sentinel; BFS levels alternating direction.
  'pghub-b21-zigzag-tree': {
    javascript: `var zigzagLevels = function(tree) {
    if (!tree || tree.length === 0 || tree[0] === -1) return [];
    const n = tree.length;
    const left = new Array(n).fill(-1), right = new Array(n).fill(-1);
    let child = 1;
    for (let i = 0; i < n; i++) {
        if (tree[i] === -1) continue;
        if (child < n) { left[i] = child; child++; }
        if (child < n) { right[i] = child; child++; }
    }
    const result = [];
    let q = [0];
    let leftToRight = true;
    while (q.length) {
        const level = [];
        const next = [];
        for (const i of q) {
            level.push(tree[i]);
            if (left[i] !== -1 && tree[left[i]] !== -1) next.push(left[i]);
            if (right[i] !== -1 && tree[right[i]] !== -1) next.push(right[i]);
        }
        result.push(leftToRight ? level : level.slice().reverse());
        leftToRight = !leftToRight;
        q = next;
    }
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> zigzagLevels(int[] tree) {
        List<List<Integer>> result = new ArrayList<>();
        int n = tree.length;
        if (n == 0 || tree[0] == -1) return result;
        int[] left = new int[n], right = new int[n];
        Arrays.fill(left, -1); Arrays.fill(right, -1);
        int child = 1;
        for (int i = 0; i < n; i++) {
            if (tree[i] == -1) continue;
            if (child < n) { left[i] = child; child++; }
            if (child < n) { right[i] = child; child++; }
        }
        Deque<Integer> q = new ArrayDeque<>();
        q.add(0);
        boolean leftToRight = true;
        while (!q.isEmpty()) {
            List<Integer> level = new ArrayList<>();
            Deque<Integer> next = new ArrayDeque<>();
            for (int i : q) {
                level.add(tree[i]);
                if (left[i] != -1 && tree[left[i]] != -1) next.add(left[i]);
                if (right[i] != -1 && tree[right[i]] != -1) next.add(right[i]);
            }
            if (!leftToRight) Collections.reverse(level);
            result.add(level);
            leftToRight = !leftToRight;
            q = next;
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> zigzagLevels(vector<int>& tree) {
        vector<vector<int>> result;
        int n = tree.size();
        if (n == 0 || tree[0] == -1) return result;
        vector<int> left(n, -1), right(n, -1);
        int child = 1;
        for (int i = 0; i < n; i++) {
            if (tree[i] == -1) continue;
            if (child < n) { left[i] = child; child++; }
            if (child < n) { right[i] = child; child++; }
        }
        vector<int> q = {0};
        bool leftToRight = true;
        while (!q.empty()) {
            vector<int> level, next;
            for (int i : q) {
                level.push_back(tree[i]);
                if (left[i] != -1 && tree[left[i]] != -1) next.push_back(left[i]);
                if (right[i] != -1 && tree[right[i]] != -1) next.push_back(right[i]);
            }
            if (!leftToRight) reverse(level.begin(), level.end());
            result.push_back(level);
            leftToRight = !leftToRight;
            q = next;
        }
        return result;
    }
};`,
  },

  // litLeds(n: int) -> List[int]  — popcount prefix (counting bits).
  'pghub-b22-binary-clock': {
    javascript: `var litLeds = function(n) {
    const res = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
    return res;
};`,
    java: `class Solution {
    public int[] litLeds(int n) {
        int[] res = new int[n + 1];
        for (int i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> litLeds(int n) {
        vector<int> res(n + 1, 0);
        for (int i = 1; i <= n; i++) res[i] = res[i >> 1] + (i & 1);
        return res;
    }
};`,
  },

  // totalWait(service: List[int]) -> int  — cumulative running-sum of prefixes.
  'pghub-b22-canteen-queue': {
    javascript: `var totalWait = function(service) {
    let running = 0, total = 0;
    for (const t of service) { total += running; running += t; }
    return total;
};`,
    java: `class Solution {
    public int totalWait(int[] service) {
        int running = 0, total = 0;
        for (int t : service) { total += running; running += t; }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalWait(vector<int>& service) {
        long long running = 0, total = 0;
        for (int t : service) { total += running; running += t; }
        return (int)total;
    }
};`,
  },

  // maxDiscount(coupons: List[int], budget: int) -> int  — 0/1 knapsack (value==weight).
  'pghub-b22-coupon-stack': {
    javascript: `var maxDiscount = function(coupons, budget) {
    const dp = new Array(budget + 1).fill(0);
    for (const c of coupons) {
        for (let b = budget; b >= c; b--) {
            const cand = dp[b - c] + c;
            if (cand > dp[b]) dp[b] = cand;
        }
    }
    return dp[budget];
};`,
    java: `class Solution {
    public int maxDiscount(int[] coupons, int budget) {
        int[] dp = new int[budget + 1];
        for (int c : coupons) {
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + c;
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
    int maxDiscount(vector<int>& coupons, int budget) {
        vector<int> dp(budget + 1, 0);
        for (int c : coupons) {
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + c;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return dp[budget];
    }
};`,
  },

  // shortestRoute(n, roads: List[List[int]], src, dst) -> int  — Dijkstra (heap).
  'pghub-b22-courier-routes': {
    javascript: `var shortestRoute = function(n, roads, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of roads) adj[u].push([v, w]);
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[src] = 0;
    // hand-rolled binary min-heap of [dist, node]
    const heap = [[0, src]];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const m = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < m && heap[l][0] < heap[s][0]) s = l;
            if (r < m && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    while (heap.length) {
        const [d, u] = pop();
        if (d > dist[u]) continue;
        if (u === dst) return d;
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; push([nd, v]); }
        }
    }
    return dist[dst] !== INF ? dist[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int shortestRoute(int n, int[][] roads, int src, int dst) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) adj[r[0]].add(new int[]{r[1], r[2]});
        final long INF = Long.MAX_VALUE;
        long[] dist = new long[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            long d = top[0]; int u = (int) top[1];
            if (d > dist[u]) continue;
            if (u == dst) return (int) d;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
            }
        }
        return dist[dst] != INF ? (int) dist[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) adj[r[0]].push_back({r[1], r[2]});
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
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
        return dist[dst] != INF ? (int)dist[dst] : -1;
    }
};`,
  },

  // countPairs(heights: List[int], limit: int) -> int  — sorted two-pointer count.
  'pghub-b22-festival-lanterns': {
    javascript: `var countPairs = function(heights, limit) {
    const arr = heights.slice().sort((a, b) => a - b);
    let i = 0, j = arr.length - 1, count = 0;
    while (i < j) {
        if (arr[i] + arr[j] <= limit) { count += j - i; i++; }
        else j--;
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPairs(int[] heights, int limit) {
        int[] arr = heights.clone();
        Arrays.sort(arr);
        int i = 0, j = arr.length - 1, count = 0;
        while (i < j) {
            if (arr[i] + arr[j] <= limit) { count += j - i; i++; }
            else j--;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& heights, int limit) {
        vector<int> arr = heights;
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1, count = 0;
        while (i < j) {
            if (arr[i] + arr[j] <= limit) { count += j - i; i++; }
            else j--;
        }
        return count;
    }
};`,
  },

  // minTaps(length: int, reach: List[int]) -> int  — greedy interval jump-game.
  'pghub-b22-garden-water': {
    javascript: `var minTaps = function(length, reach) {
    const maxRight = new Array(length + 1).fill(0);
    for (let i = 0; i < reach.length; i++) {
        const lo = Math.max(0, i - reach[i]);
        const hi = Math.min(length, i + reach[i]);
        if (hi > maxRight[lo]) maxRight[lo] = hi;
    }
    let taps = 0, curEnd = 0, farthest = 0, i = 0;
    while (curEnd < length) {
        while (i <= curEnd) {
            if (maxRight[i] > farthest) farthest = maxRight[i];
            i++;
        }
        if (farthest <= curEnd) return -1;
        taps++;
        curEnd = farthest;
    }
    return taps;
};`,
    java: `class Solution {
    public int minTaps(int length, int[] reach) {
        int[] maxRight = new int[length + 1];
        for (int i = 0; i < reach.length; i++) {
            int lo = Math.max(0, i - reach[i]);
            int hi = Math.min(length, i + reach[i]);
            if (hi > maxRight[lo]) maxRight[lo] = hi;
        }
        int taps = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < length) {
            while (i <= curEnd) {
                if (maxRight[i] > farthest) farthest = maxRight[i];
                i++;
            }
            if (farthest <= curEnd) return -1;
            taps++;
            curEnd = farthest;
        }
        return taps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTaps(int length, vector<int>& reach) {
        vector<int> maxRight(length + 1, 0);
        for (int i = 0; i < (int)reach.size(); i++) {
            int lo = max(0, i - reach[i]);
            int hi = min(length, i + reach[i]);
            if (hi > maxRight[lo]) maxRight[lo] = hi;
        }
        int taps = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < length) {
            while (i <= curEnd) {
                if (maxRight[i] > farthest) farthest = maxRight[i];
                i++;
            }
            if (farthest <= curEnd) return -1;
            taps++;
            curEnd = farthest;
        }
        return taps;
    }
};`,
  },

  // maxTreasure(grid: List[List[int]]) -> int  — DP, only down/right moves.
  'pghub-b22-grid-treasure': {
    javascript: `var maxTreasure = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const NEG = -Infinity;
    const dp = new Array(cols).fill(NEG);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 && c === 0) dp[c] = grid[0][0];
            else if (r === 0) dp[c] = dp[c - 1] + grid[r][c];
            else if (c === 0) dp[c] = dp[c] + grid[r][c];
            else dp[c] = Math.max(dp[c], dp[c - 1]) + grid[r][c];
        }
    }
    return dp[cols - 1];
};`,
    java: `class Solution {
    public int maxTreasure(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        final long NEG = Long.MIN_VALUE / 4;
        long[] dp = new long[cols];
        java.util.Arrays.fill(dp, NEG);
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else if (r == 0) dp[c] = dp[c - 1] + grid[r][c];
                else if (c == 0) dp[c] = dp[c] + grid[r][c];
                else dp[c] = Math.max(dp[c], dp[c - 1]) + grid[r][c];
            }
        }
        return (int) dp[cols - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTreasure(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        const long long NEG = LLONG_MIN / 4;
        vector<long long> dp(cols, NEG);
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else if (r == 0) dp[c] = dp[c - 1] + grid[r][c];
                else if (c == 0) dp[c] = dp[c] + grid[r][c];
                else dp[c] = max(dp[c], dp[c - 1]) + grid[r][c];
            }
        }
        return (int)dp[cols - 1];
    }
};`,
  },

  // openLockers(n: int) -> int  — floor(sqrt(n)) perfect squares ≤ n.
  'pghub-b22-locker-toggle': {
    javascript: `var openLockers = function(n) {
    return Math.floor(Math.sqrt(n));
};`,
    java: `class Solution {
    public int openLockers(int n) {
        int r = (int) Math.sqrt((double) n);
        while ((long) (r + 1) * (r + 1) <= n) r++;
        while ((long) r * r > n) r--;
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLockers(int n) {
        long long r = (long long) sqrt((double) n);
        while ((r + 1) * (r + 1) <= n) r++;
        while (r * r > n) r--;
        return (int) r;
    }
};`,
  },

  // maxDepth(parent: List[int]) -> int  — deepest chain in a parent-array forest/tree.
  'pghub-b22-museum-rooms': {
    javascript: `var maxDepth = function(parent) {
    const n = parent.length;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    let best = 0;
    const stack = [[root, 1]];
    while (stack.length) {
        const [node, d] = stack.pop();
        if (d > best) best = d;
        for (const c of children[node]) stack.push([c, d + 1]);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxDepth(int[] parent) {
        int n = parent.length;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        int best = 0;
        Deque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[]{root, 1});
        while (!stack.isEmpty()) {
            int[] cur = stack.pop();
            int node = cur[0], d = cur[1];
            if (d > best) best = d;
            for (int c : children.get(node)) stack.push(new int[]{c, d + 1});
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDepth(vector<int>& parent) {
        int n = parent.size();
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

  // countNetworks(n: int, pipes: List[List[int]]) -> int  — union-find components.
  'pghub-b22-pipe-network': {
    javascript: `var countNetworks = function(n, pipes) {
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    let comps = n;
    for (const [a, b] of pipes) {
        const ra = find(a), rb = find(b);
        if (ra !== rb) { parent[ra] = rb; comps--; }
    }
    return comps;
};`,
    java: `class Solution {
    private int[] parent;
    public int countNetworks(int n, int[][] pipes) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int comps = n;
        for (int[] p : pipes) {
            int ra = find(p[0]), rb = find(p[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps;
    }
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countNetworks(int n, vector<vector<int>>& pipes) {
        vector<int> parent(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        int comps = n;
        for (auto& p : pipes) {
            int ra = find(p[0]), rb = find(p[1]);
            if (ra != rb) { parent[ra] = rb; comps--; }
        }
        return comps;
    }
};`,
  },

  // decodeCount(s: str) -> int  — DP decode-ways mod 1e9+7.
  'pghub-b22-signal-decode': {
    javascript: `var decodeCount = function(s) {
    const MOD = 1000000007;
    const n = s.length;
    let prev2 = 1;
    let prev1 = s[0] !== '0' ? 1 : 0;
    if (n === 1) return prev1;
    for (let i = 1; i < n; i++) {
        let cur = 0;
        if (s[i] !== '0') cur += prev1;
        const two = parseInt(s.slice(i - 1, i + 1), 10);
        if (two >= 10 && two <= 26) cur += prev2;
        cur %= MOD;
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
};`,
    java: `class Solution {
    public int decodeCount(String s) {
        final int MOD = 1000000007;
        int n = s.length();
        long prev2 = 1;
        long prev1 = s.charAt(0) != '0' ? 1 : 0;
        if (n == 1) return (int) prev1;
        for (int i = 1; i < n; i++) {
            long cur = 0;
            if (s.charAt(i) != '0') cur += prev1;
            int two = Integer.parseInt(s.substring(i - 1, i + 1));
            if (two >= 10 && two <= 26) cur += prev2;
            cur %= MOD;
            prev2 = prev1; prev1 = cur;
        }
        return (int) prev1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int decodeCount(string s) {
        const long long MOD = 1000000007;
        int n = s.size();
        long long prev2 = 1;
        long long prev1 = s[0] != '0' ? 1 : 0;
        if (n == 1) return (int) prev1;
        for (int i = 1; i < n; i++) {
            long long cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = stoi(s.substr(i - 1, 2));
            if (two >= 10 && two <= 26) cur += prev2;
            cur %= MOD;
            prev2 = prev1; prev1 = cur;
        }
        return (int) prev1;
    }
};`,
  },

  // longestStable(temps: List[int], tol: int) -> int  — sliding window with
  // monotonic max/min deques, window range ≤ tol.
  'pghub-b22-thermostat-runs': {
    javascript: `var longestStable = function(temps, tol) {
    const maxDq = [], minDq = [];
    let left = 0, best = 0;
    for (let right = 0; right < temps.length; right++) {
        const v = temps[right];
        while (maxDq.length && temps[maxDq[maxDq.length - 1]] <= v) maxDq.pop();
        maxDq.push(right);
        while (minDq.length && temps[minDq[minDq.length - 1]] >= v) minDq.pop();
        minDq.push(right);
        while (temps[maxDq[0]] - temps[minDq[0]] > tol) {
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
    public int longestStable(int[] temps, int tol) {
        Deque<Integer> maxDq = new ArrayDeque<>(), minDq = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < temps.length; right++) {
            int v = temps[right];
            while (!maxDq.isEmpty() && temps[maxDq.peekLast()] <= v) maxDq.pollLast();
            maxDq.addLast(right);
            while (!minDq.isEmpty() && temps[minDq.peekLast()] >= v) minDq.pollLast();
            minDq.addLast(right);
            while (temps[maxDq.peekFirst()] - temps[minDq.peekFirst()] > tol) {
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
    int longestStable(vector<int>& temps, int tol) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)temps.size(); right++) {
            int v = temps[right];
            while (!maxDq.empty() && temps[maxDq.back()] <= v) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && temps[minDq.back()] >= v) minDq.pop_back();
            minDq.push_back(right);
            while (temps[maxDq.front()] - temps[minDq.front()] > tol) {
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

  // mergeCost(tokens: List[int]) -> int  — Huffman-style min-heap merge total.
  'pghub-b22-token-merge': {
    javascript: `var mergeCost = function(tokens) {
    if (tokens.length <= 1) return 0;
    const heap = tokens.slice();
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const m = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < m && heap[l] < heap[s]) s = l;
            if (r < m && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
        }
    };
    for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i);
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    let total = 0;
    while (heap.length > 1) {
        const a = pop(), b = pop();
        const s = a + b;
        total += s;
        push(s);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int mergeCost(int[] tokens) {
        if (tokens.length <= 1) return 0;
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int t : tokens) heap.add((long) t);
        long total = 0;
        while (heap.size() > 1) {
            long a = heap.poll(), b = heap.poll();
            long s = a + b;
            total += s;
            heap.add(s);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mergeCost(vector<int>& tokens) {
        if (tokens.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<>> heap;
        for (int t : tokens) heap.push(t);
        long long total = 0;
        while (heap.size() > 1) {
            long long a = heap.top(); heap.pop();
            long long b = heap.top(); heap.pop();
            long long s = a + b;
            total += s;
            heap.push(s);
        }
        return (int) total;
    }
};`,
  },

  // visibleBlocks(heights: List[int]) -> List[int]  — right-to-left strictly-greater stack.
  'pghub-b22-tower-blocks': {
    javascript: `var visibleBlocks = function(heights) {
    const stack = [];
    for (let i = heights.length - 1; i >= 0; i--) {
        const h = heights[i];
        if (stack.length === 0 || h > stack[stack.length - 1]) stack.push(h);
    }
    return stack.reverse();
};`,
    java: `import java.util.*;
class Solution {
    public int[] visibleBlocks(int[] heights) {
        List<Integer> stack = new ArrayList<>();
        for (int i = heights.length - 1; i >= 0; i--) {
            int h = heights[i];
            if (stack.isEmpty() || h > stack.get(stack.size() - 1)) stack.add(h);
        }
        Collections.reverse(stack);
        int[] res = new int[stack.size()];
        for (int i = 0; i < res.length; i++) res[i] = stack.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> visibleBlocks(vector<int>& heights) {
        vector<int> stack;
        for (int i = (int)heights.size() - 1; i >= 0; i--) {
            int h = heights[i];
            if (stack.empty() || h > stack.back()) stack.push_back(h);
        }
        reverse(stack.begin(), stack.end());
        return stack;
    }
};`,
  },

  // rotateShelves(shelf: List[int], k: int) -> List[int]  — right-rotate by k%n.
  'pghub-b22-warehouse-rotate': {
    javascript: `var rotateShelves = function(shelf, k) {
    const n = shelf.length;
    k %= n;
    return shelf.slice(n - k).concat(shelf.slice(0, n - k));
};`,
    java: `class Solution {
    public int[] rotateShelves(int[] shelf, int k) {
        int n = shelf.length;
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[(i + k) % n] = shelf[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateShelves(vector<int>& shelf, int k) {
        int n = shelf.size();
        k %= n;
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[(i + k) % n] = shelf[i];
        return res;
    }
};`,
  },

  // minInsertions(s: str) -> int  — greedy bracket balance.
  'pghub-b23-bracket-balance': {
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
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
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

  // maxCircularSum(banner: List[int]) -> int  — Kadane (max) + total - min-Kadane.
  'pghub-b23-circular-subarray-max': {
    javascript: `var maxCircularSum = function(banner) {
    let total = 0;
    let curMax = banner[0], bestMax = banner[0];
    let curMin = banner[0], bestMin = banner[0];
    for (let i = 0; i < banner.length; i++) {
        const x = banner[i];
        total += x;
        if (i === 0) continue;
        curMax = Math.max(x, curMax + x);
        bestMax = Math.max(bestMax, curMax);
        curMin = Math.min(x, curMin + x);
        bestMin = Math.min(bestMin, curMin);
    }
    if (bestMax < 0) return bestMax;
    return Math.max(bestMax, total - bestMin);
};`,
    java: `class Solution {
    public int maxCircularSum(int[] banner) {
        long total = 0;
        long curMax = banner[0], bestMax = banner[0];
        long curMin = banner[0], bestMin = banner[0];
        for (int i = 0; i < banner.length; i++) {
            int x = banner[i];
            total += x;
            if (i == 0) continue;
            curMax = Math.max(x, curMax + x);
            bestMax = Math.max(bestMax, curMax);
            curMin = Math.min(x, curMin + x);
            bestMin = Math.min(bestMin, curMin);
        }
        if (bestMax < 0) return (int) bestMax;
        return (int) Math.max(bestMax, total - bestMin);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCircularSum(vector<int>& banner) {
        long long total = 0;
        long long curMax = banner[0], bestMax = banner[0];
        long long curMin = banner[0], bestMin = banner[0];
        for (int i = 0; i < (int)banner.size(); i++) {
            int x = banner[i];
            total += x;
            if (i == 0) continue;
            curMax = max((long long)x, curMax + x);
            bestMax = max(bestMax, curMax);
            curMin = min((long long)x, curMin + x);
            bestMin = min(bestMin, curMin);
        }
        if (bestMax < 0) return (int) bestMax;
        return (int) max(bestMax, total - bestMin);
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int  — unbounded-coin combination DP.
  'pghub-b23-coin-change-ways': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of coins) {
        for (let a = c; a <= amount; a++) dp[a] += dp[a - c];
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
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
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
        }
        return (int) dp[amount];
    }
};`,
  },

  // maxWindows(weights: List[int], k: int) -> List[int]  — sliding-window maximum.
  'pghub-b23-conveyor-windows': {
    javascript: `var maxWindows = function(weights, k) {
    const dq = [], res = [];
    for (let i = 0; i < weights.length; i++) {
        const w = weights[i];
        while (dq.length && weights[dq[dq.length - 1]] <= w) dq.pop();
        dq.push(i);
        if (dq[0] <= i - k) dq.shift();
        if (i >= k - 1) res.push(weights[dq[0]]);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] maxWindows(int[] weights, int k) {
        Deque<Integer> dq = new ArrayDeque<>();
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < weights.length; i++) {
            int w = weights[i];
            while (!dq.isEmpty() && weights[dq.peekLast()] <= w) dq.pollLast();
            dq.addLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            if (i >= k - 1) res.add(weights[dq.peekFirst()]);
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
    vector<int> maxWindows(vector<int>& weights, int k) {
        deque<int> dq;
        vector<int> res;
        for (int i = 0; i < (int)weights.size(); i++) {
            int w = weights[i];
            while (!dq.empty() && weights[dq.back()] <= w) dq.pop_back();
            dq.push_back(i);
            if (dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) res.push_back(weights[dq.front()]);
        }
        return res;
    }
};`,
  },

  // idleFloors(requests: List[int]) -> int  — total absolute travel from floor 0.
  'pghub-b23-elevator-stops': {
    javascript: `var idleFloors = function(requests) {
    let total = 0, cur = 0;
    for (const f of requests) { total += Math.abs(f - cur); cur = f; }
    return total;
};`,
    java: `class Solution {
    public int idleFloors(int[] requests) {
        long total = 0; int cur = 0;
        for (int f : requests) { total += Math.abs(f - cur); cur = f; }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int idleFloors(vector<int>& requests) {
        long long total = 0; int cur = 0;
        for (int f : requests) { total += abs(f - cur); cur = f; }
        return (int) total;
    }
};`,
  },

  // mergeRules(rules: List[List[int]]) -> List[List[int]]  — sort + merge intervals.
  'pghub-b23-firewall-rules': {
    javascript: `var mergeRules = function(rules) {
    rules.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [s, e] of rules) {
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
    public int[][] mergeRules(int[][] rules) {
        Arrays.sort(rules, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] r : rules) {
            if (!merged.isEmpty() && r[0] <= merged.get(merged.size() - 1)[1]) {
                if (r[1] > merged.get(merged.size() - 1)[1]) merged.get(merged.size() - 1)[1] = r[1];
            } else {
                merged.add(new int[]{r[0], r[1]});
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeRules(vector<vector<int>>& rules) {
        sort(rules.begin(), rules.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        for (auto& r : rules) {
            if (!merged.empty() && r[0] <= merged.back()[1]) {
                if (r[1] > merged.back()[1]) merged.back()[1] = r[1];
            } else {
                merged.push_back({r[0], r[1]});
            }
        }
        return merged;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — count exposed cell edges.
  'pghub-b23-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perimeter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                perimeter += 4;
                if (r > 0 && grid[r - 1][c] === 1) perimeter -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perimeter -= 2;
            }
        }
    }
    return perimeter;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
            }
        }
        return perimeter;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perimeter -= 2;
                }
            }
        }
        return perimeter;
    }
};`,
  },

  // kthLargestAfterEach(k: int, scores: List[int]) -> List[int]  — running k-th
  // largest via size-k min-heap; -1 until the heap holds k elements.
  'pghub-b23-kth-largest-stream': {
    javascript: `var kthLargestAfterEach = function(k, scores) {
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const m = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < m && heap[l] < heap[s]) s = l;
            if (r < m && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    const res = [];
    for (const s of scores) {
        push(s);
        if (heap.length > k) pop();
        res.push(heap.length === k ? heap[0] : -1);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] kthLargestAfterEach(int k, int[] scores) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int[] res = new int[scores.length];
        for (int i = 0; i < scores.length; i++) {
            heap.add(scores[i]);
            if (heap.size() > k) heap.poll();
            res[i] = heap.size() == k ? heap.peek() : -1;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> kthLargestAfterEach(int k, vector<int>& scores) {
        priority_queue<int, vector<int>, greater<>> heap;
        vector<int> res;
        for (int s : scores) {
            heap.push(s);
            if ((int)heap.size() > k) heap.pop();
            res.push_back((int)heap.size() == k ? heap.top() : -1);
        }
        return res;
    }
};`,
  },

  // canFormPalindrome(beads: str) -> bool  — at most one odd-count character.
  'pghub-b23-palindrome-rearrange': {
    javascript: `var canFormPalindrome = function(beads) {
    const counts = {};
    for (const c of beads) counts[c] = (counts[c] || 0) + 1;
    let odd = 0;
    for (const c in counts) if (counts[c] % 2 === 1) odd++;
    return odd <= 1;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canFormPalindrome(String beads) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char c : beads.toCharArray()) counts.merge(c, 1, Integer::sum);
        int odd = 0;
        for (int v : counts.values()) if (v % 2 == 1) odd++;
        return odd <= 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFormPalindrome(string beads) {
        unordered_map<char, int> counts;
        for (char c : beads) counts[c]++;
        int odd = 0;
        for (auto& [c, v] : counts) if (v % 2 == 1) odd++;
        return odd <= 1;
    }
};`,
  },

  // countPrimes(n: int) -> int  — Sieve of Eratosthenes count below n.
  'pghub-b23-prime-sieve-range': {
    javascript: `var countPrimes = function(n) {
    if (n < 3) return 0;
    const sieve = new Uint8Array(n).fill(1);
    sieve[0] = sieve[1] = 0;
    for (let i = 2; i * i < n; i++) {
        if (sieve[i]) {
            for (let j = i * i; j < n; j += i) sieve[j] = 0;
        }
    }
    let count = 0;
    for (let i = 0; i < n; i++) count += sieve[i];
    return count;
};`,
    java: `class Solution {
    public int countPrimes(int n) {
        if (n < 3) return 0;
        boolean[] sieve = new boolean[n];
        java.util.Arrays.fill(sieve, true);
        sieve[0] = sieve[1] = false;
        for (int i = 2; (long) i * i < n; i++) {
            if (sieve[i]) {
                for (int j = i * i; j < n; j += i) sieve[j] = false;
            }
        }
        int count = 0;
        for (int i = 0; i < n; i++) if (sieve[i]) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimes(int n) {
        if (n < 3) return 0;
        vector<char> sieve(n, 1);
        sieve[0] = sieve[1] = 0;
        for (long long i = 2; i * i < n; i++) {
            if (sieve[i]) {
                for (long long j = i * i; j < n; j += i) sieve[j] = 0;
            }
        }
        int count = 0;
        for (int i = 0; i < n; i++) count += sieve[i];
        return count;
    }
};`,
  },

  // trapped(heights: List[int]) -> int  — two-pointer rainwater trap.
  'pghub-b23-rainfall-trap': {
    javascript: `var trapped = function(heights) {
    let left = 0, right = heights.length - 1;
    let leftMax = 0, rightMax = 0, water = 0;
    while (left < right) {
        if (heights[left] < heights[right]) {
            if (heights[left] >= leftMax) leftMax = heights[left];
            else water += leftMax - heights[left];
            left++;
        } else {
            if (heights[right] >= rightMax) rightMax = heights[right];
            else water += rightMax - heights[right];
            right--;
        }
    }
    return water;
};`,
    java: `class Solution {
    public int trapped(int[] heights) {
        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (heights[left] < heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else water += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else water += rightMax - heights[right];
                right--;
            }
        }
        return water;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trapped(vector<int>& heights) {
        int left = 0, right = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            if (heights[left] < heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else water += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else water += rightMax - heights[right];
                right--;
            }
        }
        return water;
    }
};`,
  },
};
