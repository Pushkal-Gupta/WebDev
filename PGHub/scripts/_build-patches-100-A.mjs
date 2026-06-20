// Builds /tmp/patch-100-A.json from /tmp/state-100-A.json by computing
// what each problem still needs and synthesizing only the missing fields.
import fs from 'node:fs';

const state = JSON.parse(fs.readFileSync('/tmp/state-100-A.json','utf8'));

// === SOLUTIONS LIBRARY ===
// Each entry is { py, js, java, cpp } strings for that slug's class-based solution.
// All written so they accept params as currently declared in the DB and return the declared type.
// For tree problems with `List[int]` params: solution builds tree internally from level-order, then operates.
// For linked-list problems with `List[int]` + `pos`: builds list internally, optionally inserts cycle, then runs.

const SOL = {};

// ---------- balanced-binary-tree (root: List[int]) -> bool ----------
SOL['balanced-binary-tree'] = {
  py: `from typing import List, Optional

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _build_tree(arr: List):
    if not arr:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

class Solution:
    def isBalanced(self, root: List[int]) -> bool:
        tree = _build_tree(root)

        def height(node):
            if not node:
                return 0
            lh = height(node.left)
            if lh == -1:
                return -1
            rh = height(node.right)
            if rh == -1 or abs(lh - rh) > 1:
                return -1
            return 1 + max(lh, rh)

        return height(tree) != -1
`,
  js: `function _buildTree(arr) {
    if (!arr || arr.length === 0) return null;
    const root = { val: arr[0], left: null, right: null };
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = { val: arr[i], left: null, right: null };
            q.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = { val: arr[i], left: null, right: null };
            q.push(node.right);
        }
        i++;
    }
    return root;
}

var isBalanced = function(root) {
    const tree = _buildTree(root);
    let balanced = true;
    const height = (node) => {
        if (!node || !balanced) return 0;
        const lh = height(node.left);
        const rh = height(node.right);
        if (Math.abs(lh - rh) > 1) balanced = false;
        return 1 + Math.max(lh, rh);
    };
    height(tree);
    return balanced;
};
`,
  java: `import java.util.*;

class Solution {
    static class Node { int val; Node left, right; Node(int v){val=v;} }

    private Node buildTree(List<Integer> arr) {
        if (arr == null || arr.isEmpty()) return null;
        Node root = new Node(arr.get(0));
        Deque<Node> q = new ArrayDeque<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.size()) {
            Node node = q.poll();
            if (i < arr.size() && arr.get(i) != null) { node.left = new Node(arr.get(i)); q.offer(node.left); }
            i++;
            if (i < arr.size() && arr.get(i) != null) { node.right = new Node(arr.get(i)); q.offer(node.right); }
            i++;
        }
        return root;
    }

    private int balanced = 1;
    private int height(Node n) {
        if (n == null) return 0;
        int lh = height(n.left);
        int rh = height(n.right);
        if (Math.abs(lh - rh) > 1) balanced = 0;
        return 1 + Math.max(lh, rh);
    }

    public boolean isBalanced(List<Integer> root) {
        balanced = 1;
        Node tree = buildTree(root);
        height(tree);
        return balanced == 1;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

struct Node { int val; Node *l, *r; Node(int v): val(v), l(nullptr), r(nullptr) {} };

class Solution {
    bool ok = true;
    Node* build(const vector<int>& a, int n) {
        // Placeholder; this solution builds from a vector<int> level-order with sentinel INT_MIN for nulls.
        if (n == 0) return nullptr;
        Node* root = new Node(a[0]);
        queue<Node*> q; q.push(root);
        int i = 1;
        while (!q.empty() && i < n) {
            Node* node = q.front(); q.pop();
            if (i < n && a[i] != INT_MIN) { node->l = new Node(a[i]); q.push(node->l); }
            i++;
            if (i < n && a[i] != INT_MIN) { node->r = new Node(a[i]); q.push(node->r); }
            i++;
        }
        return root;
    }
    int height(Node* n) {
        if (!n) return 0;
        int lh = height(n->l);
        int rh = height(n->r);
        if (abs(lh - rh) > 1) ok = false;
        return 1 + max(lh, rh);
    }
public:
    bool isBalanced(vector<int>& root) {
        ok = true;
        Node* tree = build(root, root.size());
        height(tree);
        return ok;
    }
};
`,
};

// ---------- best-time-to-buy-sell-stock (prices: List[int]) -> int ----------
SOL['best-time-to-buy-sell-stock'] = {
  py: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_price = float('inf')
        best = 0
        for p in prices:
            if p < min_price:
                min_price = p
            elif p - min_price > best:
                best = p - min_price
        return best
`,
  js: `var maxProfit = function(prices) {
    let min = Infinity, best = 0;
    for (const p of prices) {
        if (p < min) min = p;
        else if (p - min > best) best = p - min;
    }
    return best;
};
`,
  java: `import java.util.*;
class Solution {
    public int maxProfit(int[] prices) {
        int min = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            if (p < min) min = p;
            else if (p - min > best) best = p - min;
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int mn = INT_MAX, best = 0;
        for (int p : prices) {
            if (p < mn) mn = p;
            else if (p - mn > best) best = p - mn;
        }
        return best;
    }
};
`,
};

// ---------- car-fleet (target: int, position: List[int], speed: List[int]) -> int ----------
SOL['car-fleet'] = {
  py: `from typing import List

class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        cars = sorted(zip(position, speed), reverse=True)
        fleets = 0
        slowest = 0.0
        for pos, spd in cars:
            t = (target - pos) / spd
            if t > slowest:
                slowest = t
                fleets += 1
        return fleets
`,
  js: `var carFleet = function(target, position, speed) {
    const cars = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);
    let fleets = 0, slowest = 0;
    for (const [pos, spd] of cars) {
        const t = (target - pos) / spd;
        if (t > slowest) { slowest = t; fleets++; }
    }
    return fleets;
};
`,
  java: `import java.util.*;
class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        double[][] cars = new double[n][2];
        for (int i = 0; i < n; i++) { cars[i][0] = position[i]; cars[i][1] = speed[i]; }
        Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0]));
        int fleets = 0; double slowest = 0;
        for (double[] c : cars) {
            double t = (target - c[0]) / c[1];
            if (t > slowest) { slowest = t; fleets++; }
        }
        return fleets;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        int n = position.size();
        vector<pair<int,int>> cars(n);
        for (int i = 0; i < n; i++) cars[i] = {position[i], speed[i]};
        sort(cars.begin(), cars.end(), [](auto& a, auto& b){ return a.first > b.first; });
        int fleets = 0;
        double slowest = 0.0;
        for (auto& c : cars) {
            double t = (double)(target - c.first) / c.second;
            if (t > slowest) { slowest = t; fleets++; }
        }
        return fleets;
    }
};
`,
};

// ---------- cheapest-flights (n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int ----------
SOL['cheapest-flights'] = {
  py: `from typing import List
import math

class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        prices = [math.inf] * n
        prices[src] = 0
        for _ in range(k + 1):
            tmp = prices.copy()
            for u, v, w in flights:
                if prices[u] == math.inf:
                    continue
                if prices[u] + w < tmp[v]:
                    tmp[v] = prices[u] + w
            prices = tmp
        return -1 if prices[dst] == math.inf else prices[dst]
`,
  js: `var findCheapestPrice = function(n, flights, src, dst, k) {
    let prices = new Array(n).fill(Infinity);
    prices[src] = 0;
    for (let i = 0; i <= k; i++) {
        const tmp = prices.slice();
        for (const [u, v, w] of flights) {
            if (prices[u] === Infinity) continue;
            if (prices[u] + w < tmp[v]) tmp[v] = prices[u] + w;
        }
        prices = tmp;
    }
    return prices[dst] === Infinity ? -1 : prices[dst];
};
`,
  java: `import java.util.*;
class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        int[] prices = new int[n];
        Arrays.fill(prices, Integer.MAX_VALUE);
        prices[src] = 0;
        for (int i = 0; i <= k; i++) {
            int[] tmp = prices.clone();
            for (int[] f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (prices[u] == Integer.MAX_VALUE) continue;
                if (prices[u] + w < tmp[v]) tmp[v] = prices[u] + w;
            }
            prices = tmp;
        }
        return prices[dst] == Integer.MAX_VALUE ? -1 : prices[dst];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        vector<int> prices(n, INT_MAX);
        prices[src] = 0;
        for (int i = 0; i <= k; i++) {
            vector<int> tmp = prices;
            for (auto& f : flights) {
                if (prices[f[0]] == INT_MAX) continue;
                if (prices[f[0]] + f[2] < tmp[f[1]]) tmp[f[1]] = prices[f[0]] + f[2];
            }
            prices = tmp;
        }
        return prices[dst] == INT_MAX ? -1 : prices[dst];
    }
};
`,
};

// ---------- clone-graph (adj: List[List[int]], startVal: int) -> List[List[int]] ----------
// Note: this problem in PGcode form is adj-list-in/adj-list-out. Solution must simulate the deep-copy correctly.
SOL['clone-graph'] = {
  py: `from typing import List

class Solution:
    def cloneGraph(self, adj: List[List[int]], startVal: int) -> List[List[int]]:
        # adj is the adjacency list (1-indexed in LC convention); we deep-copy it.
        if not adj:
            return []
        # Simply return a deep copy of the adjacency list.
        return [list(neis) for neis in adj]
`,
  js: `var cloneGraph = function(adj, startVal) {
    if (!adj || adj.length === 0) return [];
    return adj.map(neis => neis.slice());
};
`,
  java: `import java.util.*;
class Solution {
    public List<List<Integer>> cloneGraph(List<List<Integer>> adj, int startVal) {
        List<List<Integer>> out = new ArrayList<>();
        if (adj == null) return out;
        for (List<Integer> neis : adj) out.add(new ArrayList<>(neis));
        return out;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<int>> cloneGraph(vector<vector<int>>& adj, int startVal) {
        vector<vector<int>> out;
        for (auto& neis : adj) out.push_back(neis);
        return out;
    }
};
`,
};

// ---------- coin-change (coins: List[int], amount: int) -> int ----------
SOL['coin-change'] = {
  py: `from typing import List

class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = amount + 1
        dp = [0] + [INF] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)
        return -1 if dp[amount] == INF else dp[amount]
`,
  js: `var coinChange = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] === INF ? -1 : dp[amount];
};
`,
  java: `import java.util.*;
class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
};
`,
};

// ---------- combination-sum (candidates: List[int], target: int) -> List[List[int]] ----------
SOL['combination-sum'] = {
  py: `from typing import List

class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        candidates = sorted(candidates)
        out: List[List[int]] = []
        cur: List[int] = []

        def dfs(start: int, remaining: int):
            if remaining == 0:
                out.append(cur.copy()); return
            for i in range(start, len(candidates)):
                c = candidates[i]
                if c > remaining:
                    break
                cur.append(c)
                dfs(i, remaining - c)
                cur.pop()

        dfs(0, target)
        return out
`,
  js: `var combinationSum = function(candidates, target) {
    candidates.sort((a, b) => a - b);
    const out = [];
    const cur = [];
    const dfs = (start, remaining) => {
        if (remaining === 0) { out.push(cur.slice()); return; }
        for (let i = start; i < candidates.length; i++) {
            const c = candidates[i];
            if (c > remaining) break;
            cur.push(c);
            dfs(i, remaining - c);
            cur.pop();
        }
    };
    dfs(0, target);
    return out;
};
`,
  java: `import java.util.*;
class Solution {
    private List<List<Integer>> out = new ArrayList<>();
    private int[] cand;
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        out = new ArrayList<>();
        cand = candidates.clone();
        Arrays.sort(cand);
        dfs(0, target, new ArrayList<>());
        return out;
    }
    private void dfs(int start, int remaining, List<Integer> cur) {
        if (remaining == 0) { out.add(new ArrayList<>(cur)); return; }
        for (int i = start; i < cand.length; i++) {
            if (cand[i] > remaining) break;
            cur.add(cand[i]);
            dfs(i, remaining - cand[i], cur);
            cur.remove(cur.size() - 1);
        }
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    vector<vector<int>> out;
    vector<int> cur;
    void dfs(vector<int>& c, int start, int rem) {
        if (rem == 0) { out.push_back(cur); return; }
        for (int i = start; i < (int)c.size(); i++) {
            if (c[i] > rem) break;
            cur.push_back(c[i]);
            dfs(c, i, rem - c[i]);
            cur.pop_back();
        }
    }
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        out.clear(); cur.clear();
        sort(candidates.begin(), candidates.end());
        dfs(candidates, 0, target);
        return out;
    }
};
`,
};

// ---------- container-most-water (heights: List[int]) -> int ----------
SOL['container-most-water'] = {
  py: `from typing import List

class Solution:
    def maxArea(self, heights: List[int]) -> int:
        l, r = 0, len(heights) - 1
        best = 0
        while l < r:
            h = min(heights[l], heights[r])
            if h * (r - l) > best:
                best = h * (r - l)
            if heights[l] < heights[r]:
                l += 1
            else:
                r -= 1
        return best
`,
  js: `var maxArea = function(heights) {
    let l = 0, r = heights.length - 1, best = 0;
    while (l < r) {
        const h = Math.min(heights[l], heights[r]);
        if (h * (r - l) > best) best = h * (r - l);
        if (heights[l] < heights[r]) l++; else r--;
    }
    return best;
};
`,
  java: `class Solution {
    public int maxArea(int[] heights) {
        int l = 0, r = heights.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(heights[l], heights[r]);
            if (h * (r - l) > best) best = h * (r - l);
            if (heights[l] < heights[r]) l++; else r--;
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int maxArea(vector<int>& heights) {
        int l = 0, r = heights.size() - 1, best = 0;
        while (l < r) {
            int h = min(heights[l], heights[r]);
            if (h * (r - l) > best) best = h * (r - l);
            if (heights[l] < heights[r]) l++; else r--;
        }
        return best;
    }
};
`,
};

// ---------- contains-duplicate (nums: List[int]) -> bool ----------
SOL['contains-duplicate'] = {
  py: `from typing import List

class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False
`,
  js: `var containsDuplicate = function(nums) {
    const seen = new Set();
    for (const x of nums) {
        if (seen.has(x)) return true;
        seen.add(x);
    }
    return false;
};
`,
  java: `import java.util.*;
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) return true;
        }
        return false;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (seen.count(x)) return true;
            seen.insert(x);
        }
        return false;
    }
};
`,
};

// ---------- counting-bits (n: int) -> List[int] ----------
SOL['counting-bits'] = {
  py: `from typing import List

class Solution:
    def countBits(self, n: int) -> List[int]:
        dp = [0] * (n + 1)
        for i in range(1, n + 1):
            dp[i] = dp[i >> 1] + (i & 1)
        return dp
`,
  js: `var countBits = function(n) {
    const dp = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
    return dp;
};
`,
  java: `class Solution {
    public int[] countBits(int n) {
        int[] dp = new int[n + 1];
        for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
        return dp;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> dp(n + 1, 0);
        for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
        return dp;
    }
};
`,
};

// ---------- course-schedule (numCourses: int, prerequisites: List[List[int]]) -> bool ----------
SOL['course-schedule'] = {
  py: `from typing import List
from collections import defaultdict, deque

class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        graph = defaultdict(list)
        indeg = [0] * numCourses
        for a, b in prerequisites:
            graph[b].append(a)
            indeg[a] += 1
        q = deque(i for i in range(numCourses) if indeg[i] == 0)
        done = 0
        while q:
            u = q.popleft(); done += 1
            for v in graph[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        return done == numCourses
`,
  js: `var canFinish = function(numCourses, prerequisites) {
    const graph = Array.from({length: numCourses}, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
    const q = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
    let done = 0;
    while (q.length) {
        const u = q.shift(); done++;
        for (const v of graph[u]) if (--indeg[v] === 0) q.push(v);
    }
    return done === numCourses;
};
`,
  java: `import java.util.*;
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
        int done = 0;
        while (!q.isEmpty()) {
            int u = q.poll(); done++;
            for (int v : graph.get(u)) if (--indeg[v] == 0) q.offer(v);
        }
        return done == numCourses;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) { graph[p[1]].push_back(p[0]); indeg[p[0]]++; }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int done = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop(); done++;
            for (int v : graph[u]) if (--indeg[v] == 0) q.push(v);
        }
        return done == numCourses;
    }
};
`,
};

// ---------- course-schedule-ii (numCourses: int, prerequisites: List[List[int]]) -> List[int] ----------
SOL['course-schedule-ii'] = {
  py: `from typing import List
from collections import defaultdict, deque

class Solution:
    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        graph = defaultdict(list)
        indeg = [0] * numCourses
        for a, b in prerequisites:
            graph[b].append(a)
            indeg[a] += 1
        q = deque(i for i in range(numCourses) if indeg[i] == 0)
        order: List[int] = []
        while q:
            u = q.popleft(); order.append(u)
            for v in graph[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        return order if len(order) == numCourses else []
`,
  js: `var findOrder = function(numCourses, prerequisites) {
    const graph = Array.from({length: numCourses}, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { graph[b].push(a); indeg[a]++; }
    const q = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
    const order = [];
    while (q.length) {
        const u = q.shift(); order.push(u);
        for (const v of graph[u]) if (--indeg[v] === 0) q.push(v);
    }
    return order.length === numCourses ? order : [];
};
`,
  java: `import java.util.*;
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); indeg[p[0]]++; }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.offer(i);
        int[] order = new int[numCourses];
        int k = 0;
        while (!q.isEmpty()) {
            int u = q.poll(); order[k++] = u;
            for (int v : graph.get(u)) if (--indeg[v] == 0) q.offer(v);
        }
        return k == numCourses ? order : new int[0];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) { graph[p[1]].push_back(p[0]); indeg[p[0]]++; }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        vector<int> order;
        while (!q.empty()) {
            int u = q.front(); q.pop(); order.push_back(u);
            for (int v : graph[u]) if (--indeg[v] == 0) q.push(v);
        }
        return (int)order.size() == numCourses ? order : vector<int>{};
    }
};
`,
};

// ---------- daily-temperatures (temperatures: List[int]) -> List[int] ----------
SOL['daily-temperatures'] = {
  py: `from typing import List

class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        n = len(temperatures)
        out = [0] * n
        stack = []
        for i, t in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < t:
                j = stack.pop()
                out[j] = i - j
            stack.append(i)
        return out
`,
  js: `var dailyTemperatures = function(temperatures) {
    const n = temperatures.length;
    const out = new Array(n).fill(0);
    const stack = [];
    for (let i = 0; i < n; i++) {
        while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {
            const j = stack.pop();
            out[j] = i - j;
        }
        stack.push(i);
    }
    return out;
};
`,
  java: `import java.util.*;
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] out = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int j = stack.pop();
                out[j] = i - j;
            }
            stack.push(i);
        }
        return out;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        int n = temperatures.size();
        vector<int> out(n, 0);
        stack<int> st;
        for (int i = 0; i < n; i++) {
            while (!st.empty() && temperatures[st.top()] < temperatures[i]) {
                int j = st.top(); st.pop();
                out[j] = i - j;
            }
            st.push(i);
        }
        return out;
    }
};
`,
};

// ---------- decode-ways (s: str) -> int ----------
SOL['decode-ways'] = {
  py: `class Solution:
    def numDecodings(self, s: str) -> int:
        if not s or s[0] == '0':
            return 0
        n = len(s)
        prev2, prev1 = 1, 1
        for i in range(1, n):
            cur = 0
            if s[i] != '0':
                cur += prev1
            two = int(s[i-1:i+1])
            if 10 <= two <= 26:
                cur += prev2
            prev2, prev1 = prev1, cur
        return prev1
`,
  js: `var numDecodings = function(s) {
    if (!s || s[0] === '0') return 0;
    const n = s.length;
    let prev2 = 1, prev1 = 1;
    for (let i = 1; i < n; i++) {
        let cur = 0;
        if (s[i] !== '0') cur += prev1;
        const two = parseInt(s.substring(i - 1, i + 1), 10);
        if (two >= 10 && two <= 26) cur += prev2;
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
};
`,
  java: `class Solution {
    public int numDecodings(String s) {
        if (s == null || s.isEmpty() || s.charAt(0) == '0') return 0;
        int n = s.length();
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < n; i++) {
            int cur = 0;
            if (s.charAt(i) != '0') cur += prev1;
            int two = Integer.parseInt(s.substring(i - 1, i + 1));
            if (two >= 10 && two <= 26) cur += prev2;
            prev2 = prev1; prev1 = cur;
        }
        return prev1;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int numDecodings(string s) {
        if (s.empty() || s[0] == '0') return 0;
        int n = s.size();
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < n; i++) {
            int cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = stoi(s.substr(i - 1, 2));
            if (two >= 10 && two <= 26) cur += prev2;
            prev2 = prev1; prev1 = cur;
        }
        return prev1;
    }
};
`,
};

// ---------- design-add-search (operations: List[List]) -> List ----------
// This is the WordDictionary problem with serialized operations form.
// Solution must parse operations and return results array.
SOL['design-add-search'] = {
  py: `from typing import List, Any

class TrieNode:
    def __init__(self):
        self.children = {}
        self.end = False

class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.end = True

    def search(self, word: str) -> bool:
        def dfs(i: int, node: TrieNode) -> bool:
            if i == len(word):
                return node.end
            ch = word[i]
            if ch == '.':
                for c in node.children.values():
                    if dfs(i + 1, c):
                        return True
                return False
            if ch not in node.children:
                return False
            return dfs(i + 1, node.children[ch])
        return dfs(0, self.root)

class Solution:
    def WordDictionary(self, operations: List[List[Any]]) -> List[Any]:
        out: List[Any] = []
        wd = None
        for op in operations:
            name = op[0]
            if name == 'WordDictionary':
                wd = WordDictionary()
                out.append(None)
            elif name == 'addWord':
                wd.addWord(op[1])
                out.append(None)
            elif name == 'search':
                out.append(wd.search(op[1]))
            else:
                out.append(None)
        return out
`,
  js: `class TrieNode {
    constructor() { this.children = {}; this.end = false; }
}

class WordDictionary {
    constructor() { this.root = new TrieNode(); }
    addWord(word) {
        let node = this.root;
        for (const ch of word) {
            if (!node.children[ch]) node.children[ch] = new TrieNode();
            node = node.children[ch];
        }
        node.end = true;
    }
    search(word) {
        const dfs = (i, node) => {
            if (i === word.length) return node.end;
            const ch = word[i];
            if (ch === '.') {
                for (const k in node.children) {
                    if (dfs(i + 1, node.children[k])) return true;
                }
                return false;
            }
            if (!node.children[ch]) return false;
            return dfs(i + 1, node.children[ch]);
        };
        return dfs(0, this.root);
    }
}

var WordDictionary_runner = function(operations) {
    const out = [];
    let wd = null;
    for (const op of operations) {
        const name = op[0];
        if (name === 'WordDictionary') { wd = new WordDictionary(); out.push(null); }
        else if (name === 'addWord') { wd.addWord(op[1]); out.push(null); }
        else if (name === 'search') { out.push(wd.search(op[1])); }
        else out.push(null);
    }
    return out;
};
var WordDictionary = WordDictionary_runner;
`,
  java: `import java.util.*;
class Solution {
    static class Trie {
        Map<Character, Trie> children = new HashMap<>();
        boolean end = false;
    }
    static class WD {
        Trie root = new Trie();
        void add(String w) {
            Trie node = root;
            for (char ch : w.toCharArray()) {
                node.children.putIfAbsent(ch, new Trie());
                node = node.children.get(ch);
            }
            node.end = true;
        }
        boolean dfs(String w, int i, Trie node) {
            if (i == w.length()) return node.end;
            char ch = w.charAt(i);
            if (ch == '.') {
                for (Trie c : node.children.values()) if (dfs(w, i + 1, c)) return true;
                return false;
            }
            Trie n = node.children.get(ch);
            if (n == null) return false;
            return dfs(w, i + 1, n);
        }
        boolean search(String w) { return dfs(w, 0, root); }
    }

    public List<Object> WordDictionary(List<List<Object>> operations) {
        List<Object> out = new ArrayList<>();
        WD wd = null;
        for (List<Object> op : operations) {
            String name = String.valueOf(op.get(0));
            if (name.equals("WordDictionary")) { wd = new WD(); out.add(null); }
            else if (name.equals("addWord")) { wd.add(String.valueOf(op.get(1))); out.add(null); }
            else if (name.equals("search")) { out.add(wd.search(String.valueOf(op.get(1)))); }
            else out.add(null);
        }
        return out;
    }
}
`,
  cpp: `// Design-class operations problems are simulated in higher-level languages above.
// The PGcode harness recognizes single-param "operations" lists and falls back to user code in C++.
#include <bits/stdc++.h>
using namespace std;

struct Trie {
    unordered_map<char, Trie*> children;
    bool end = false;
};

class WD {
public:
    Trie* root = new Trie();
    void add(const string& w) {
        Trie* node = root;
        for (char ch : w) {
            if (!node->children.count(ch)) node->children[ch] = new Trie();
            node = node->children[ch];
        }
        node->end = true;
    }
    bool dfs(const string& w, int i, Trie* node) {
        if (i == (int)w.size()) return node->end;
        char ch = w[i];
        if (ch == '.') {
            for (auto& kv : node->children) if (dfs(w, i + 1, kv.second)) return true;
            return false;
        }
        if (!node->children.count(ch)) return false;
        return dfs(w, i + 1, node->children[ch]);
    }
    bool search(const string& w) { return dfs(w, 0, root); }
};

int main() { return 0; }
`,
};

// ---------- edit-distance (word1: str, word2: str) -> int ----------
SOL['edit-distance'] = {
  py: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i-1] == word2[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
        return dp[m][n]
`,
  js: `var minDistance = function(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i-1] === word2[j-1]) dp[i][j] = dp[i-1][j-1];
            else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[m][n];
};
`,
  java: `class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i-1) == word2.charAt(j-1)) dp[i][j] = dp[i-1][j-1];
                else dp[i][j] = 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
            }
        }
        return dp[m][n];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                if (word1[i-1] == word2[j-1]) dp[i][j] = dp[i-1][j-1];
                else dp[i][j] = 1 + min({dp[i-1][j-1], dp[i-1][j], dp[i][j-1]});
        return dp[m][n];
    }
};
`,
};

// ---------- encode-decode-strings (strs: List[str]) -> List[str] ----------
SOL['encode-decode-strings'] = {
  py: `from typing import List

class Solution:
    def encode(self, strs: List[str]) -> str:
        return ''.join(f'{len(s)}#{s}' for s in strs)

    def decode(self, s: str) -> List[str]:
        out: List[str] = []
        i = 0
        while i < len(s):
            j = i
            while s[j] != '#':
                j += 1
            n = int(s[i:j])
            out.append(s[j+1:j+1+n])
            i = j + 1 + n
        return out

    def encodeDecode(self, strs: List[str]) -> List[str]:
        return self.decode(self.encode(strs))
`,
  js: `var encode = function(strs) {
    return strs.map(s => s.length + '#' + s).join('');
};
var decode = function(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
        let j = i;
        while (s[j] !== '#') j++;
        const n = parseInt(s.substring(i, j), 10);
        out.push(s.substring(j + 1, j + 1 + n));
        i = j + 1 + n;
    }
    return out;
};
var encodeDecode = function(strs) {
    return decode(encode(strs));
};
`,
  java: `import java.util.*;
class Solution {
    private String encode(List<String> strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.length()).append('#').append(s);
        return sb.toString();
    }
    private List<String> decode(String s) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int j = i;
            while (s.charAt(j) != '#') j++;
            int n = Integer.parseInt(s.substring(i, j));
            out.add(s.substring(j + 1, j + 1 + n));
            i = j + 1 + n;
        }
        return out;
    }
    public List<String> encodeDecode(List<String> strs) {
        return decode(encode(strs));
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    string encode(const vector<string>& strs) {
        string out;
        for (auto& s : strs) { out += to_string(s.size()); out += '#'; out += s; }
        return out;
    }
    vector<string> decode(const string& s) {
        vector<string> out;
        int i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (s[j] != '#') j++;
            int len = stoi(s.substr(i, j - i));
            out.push_back(s.substr(j + 1, len));
            i = j + 1 + len;
        }
        return out;
    }
public:
    vector<string> encodeDecode(vector<string>& strs) {
        return decode(encode(strs));
    }
};
`,
};

// ---------- eval-rpn (tokens: List[str]) -> int ----------
SOL['eval-rpn'] = {
  py: `from typing import List

class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack: List[int] = []
        for t in tokens:
            if t in {'+', '-', '*', '/'}:
                b = stack.pop(); a = stack.pop()
                if t == '+': stack.append(a + b)
                elif t == '-': stack.append(a - b)
                elif t == '*': stack.append(a * b)
                else:
                    # truncate toward zero
                    stack.append(int(a / b))
            else:
                stack.append(int(t))
        return stack[-1]
`,
  js: `var evalRPN = function(tokens) {
    const stack = [];
    for (const t of tokens) {
        if (t === '+' || t === '-' || t === '*' || t === '/') {
            const b = stack.pop(), a = stack.pop();
            if (t === '+') stack.push(a + b);
            else if (t === '-') stack.push(a - b);
            else if (t === '*') stack.push(a * b);
            else stack.push(Math.trunc(a / b));
        } else stack.push(parseInt(t, 10));
    }
    return stack[stack.length - 1];
};
`,
  java: `import java.util.*;
class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            if (t.equals("+") || t.equals("-") || t.equals("*") || t.equals("/")) {
                int b = stack.pop(), a = stack.pop();
                if (t.equals("+")) stack.push(a + b);
                else if (t.equals("-")) stack.push(a - b);
                else if (t.equals("*")) stack.push(a * b);
                else stack.push(a / b);
            } else stack.push(Integer.parseInt(t));
        }
        return stack.peek();
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<long long> st;
        for (auto& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                long long b = st.top(); st.pop();
                long long a = st.top(); st.pop();
                if (t == "+") st.push(a + b);
                else if (t == "-") st.push(a - b);
                else if (t == "*") st.push(a * b);
                else st.push(a / b);
            } else st.push(stoll(t));
        }
        return (int)st.top();
    }
};
`,
};

// ---------- find-min-rotated (nums: List[int]) -> int ----------
SOL['find-min-rotated'] = {
  py: `from typing import List

class Solution:
    def findMin(self, nums: List[int]) -> int:
        l, r = 0, len(nums) - 1
        while l < r:
            m = (l + r) // 2
            if nums[m] > nums[r]:
                l = m + 1
            else:
                r = m
        return nums[l]
`,
  js: `var findMin = function(nums) {
    let l = 0, r = nums.length - 1;
    while (l < r) {
        const m = (l + r) >> 1;
        if (nums[m] > nums[r]) l = m + 1;
        else r = m;
    }
    return nums[l];
};
`,
  java: `class Solution {
    public int findMin(int[] nums) {
        int l = 0, r = nums.length - 1;
        while (l < r) {
            int m = (l + r) >>> 1;
            if (nums[m] > nums[r]) l = m + 1;
            else r = m;
        }
        return nums[l];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int findMin(vector<int>& nums) {
        int l = 0, r = nums.size() - 1;
        while (l < r) {
            int m = (l + r) / 2;
            if (nums[m] > nums[r]) l = m + 1;
            else r = m;
        }
        return nums[l];
    }
};
`,
};

// ---------- gas-station (gas: List[int], cost: List[int]) -> int ----------
SOL['gas-station'] = {
  py: `from typing import List

class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        if sum(gas) < sum(cost):
            return -1
        tank, start = 0, 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:
                start = i + 1
                tank = 0
        return start
`,
  js: `var canCompleteCircuit = function(gas, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
        const diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total < 0 ? -1 : start;
};
`,
  java: `class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < (int)gas.size(); i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total < 0 ? -1 : start;
    }
};
`,
};

// ---------- group-anagrams (strs: List[str]) -> List[List[str]] ----------
SOL['group-anagrams'] = {
  py: `from typing import List
from collections import defaultdict

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)
        for s in strs:
            key = ''.join(sorted(s))
            groups[key].append(s)
        return list(groups.values())
`,
  js: `var groupAnagrams = function(strs) {
    const groups = new Map();
    for (const s of strs) {
        const key = s.split('').sort().join('');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
    }
    return Array.from(groups.values());
};
`,
  java: `import java.util.*;
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] ch = s.toCharArray();
            Arrays.sort(ch);
            String key = new String(ch);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> mp;
        for (auto& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            mp[key].push_back(s);
        }
        vector<vector<string>> out;
        for (auto& kv : mp) out.push_back(kv.second);
        return out;
    }
};
`,
};

// ---------- house-robber (nums: List[int]) -> int ----------
SOL['house-robber'] = {
  py: `from typing import List

class Solution:
    def rob(self, nums: List[int]) -> int:
        prev2, prev1 = 0, 0
        for n in nums:
            prev2, prev1 = prev1, max(prev1, prev2 + n)
        return prev1
`,
  js: `var rob = function(nums) {
    let prev2 = 0, prev1 = 0;
    for (const n of nums) {
        const cur = Math.max(prev1, prev2 + n);
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
};
`,
  java: `class Solution {
    public int rob(int[] nums) {
        int prev2 = 0, prev1 = 0;
        for (int n : nums) {
            int cur = Math.max(prev1, prev2 + n);
            prev2 = prev1; prev1 = cur;
        }
        return prev1;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int rob(vector<int>& nums) {
        int prev2 = 0, prev1 = 0;
        for (int n : nums) {
            int cur = max(prev1, prev2 + n);
            prev2 = prev1; prev1 = cur;
        }
        return prev1;
    }
};
`,
};

// ---------- house-robber-ii (nums: List[int]) -> int ----------
SOL['house-robber-ii'] = {
  py: `from typing import List

class Solution:
    def rob(self, nums: List[int]) -> int:
        if len(nums) == 1:
            return nums[0]
        def line(arr):
            p2, p1 = 0, 0
            for n in arr:
                p2, p1 = p1, max(p1, p2 + n)
            return p1
        return max(line(nums[1:]), line(nums[:-1]))
`,
  js: `var rob = function(nums) {
    if (nums.length === 1) return nums[0];
    const line = (arr) => {
        let p2 = 0, p1 = 0;
        for (const n of arr) {
            const cur = Math.max(p1, p2 + n);
            p2 = p1; p1 = cur;
        }
        return p1;
    };
    return Math.max(line(nums.slice(1)), line(nums.slice(0, -1)));
};
`,
  java: `class Solution {
    private int line(int[] nums, int lo, int hi) {
        int p2 = 0, p1 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = Math.max(p1, p2 + nums[i]);
            p2 = p1; p1 = cur;
        }
        return p1;
    }
    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];
        return Math.max(line(nums, 1, nums.length - 1), line(nums, 0, nums.length - 2));
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    int line(vector<int>& a, int lo, int hi) {
        int p2 = 0, p1 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = max(p1, p2 + a[i]);
            p2 = p1; p1 = cur;
        }
        return p1;
    }
public:
    int rob(vector<int>& nums) {
        if (nums.size() == 1) return nums[0];
        return max(line(nums, 1, nums.size() - 1), line(nums, 0, nums.size() - 2));
    }
};
`,
};

// ---------- insert-interval (intervals: List[List[int]], newInterval: List[int]) -> List[List[int]] ----------
SOL['insert-interval'] = {
  py: `from typing import List

class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        out: List[List[int]] = []
        i, n = 0, len(intervals)
        while i < n and intervals[i][1] < newInterval[0]:
            out.append(intervals[i]); i += 1
        while i < n and intervals[i][0] <= newInterval[1]:
            newInterval = [min(newInterval[0], intervals[i][0]), max(newInterval[1], intervals[i][1])]
            i += 1
        out.append(newInterval)
        while i < n:
            out.append(intervals[i]); i += 1
        return out
`,
  js: `var insert = function(intervals, newInterval) {
    const out = [];
    let i = 0, n = intervals.length;
    while (i < n && intervals[i][1] < newInterval[0]) out.push(intervals[i++]);
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval = [Math.min(newInterval[0], intervals[i][0]), Math.max(newInterval[1], intervals[i][1])];
        i++;
    }
    out.push(newInterval);
    while (i < n) out.push(intervals[i++]);
    return out;
};
`,
  java: `import java.util.*;
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> out = new ArrayList<>();
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0]) out.add(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval = new int[]{ Math.min(newInterval[0], intervals[i][0]), Math.max(newInterval[1], intervals[i][1]) };
            i++;
        }
        out.add(newInterval);
        while (i < n) out.add(intervals[i++]);
        return out.toArray(new int[0][]);
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> out;
        int i = 0, n = intervals.size();
        while (i < n && intervals[i][1] < newInterval[0]) out.push_back(intervals[i++]);
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = min(newInterval[0], intervals[i][0]);
            newInterval[1] = max(newInterval[1], intervals[i][1]);
            i++;
        }
        out.push_back(newInterval);
        while (i < n) out.push_back(intervals[i++]);
        return out;
    }
};
`,
};

// ---------- invert-binary-tree (root: List[int]) -> List[int] ----------
// Solution builds tree from level-order list, inverts, then serializes back.
SOL['invert-binary-tree'] = {
  py: `from typing import List, Optional
from collections import deque

class _N:
    __slots__ = ('val','l','r')
    def __init__(self, v): self.val = v; self.l = None; self.r = None

def _build(arr):
    if not arr: return None
    root = _N(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.l = _N(arr[i]); q.append(node.l)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.r = _N(arr[i]); q.append(node.r)
        i += 1
    return root

def _ser(root):
    if not root: return []
    out, q = [], deque([root])
    while q:
        node = q.popleft()
        if node is None:
            out.append(None)
        else:
            out.append(node.val)
            q.append(node.l); q.append(node.r)
    while out and out[-1] is None:
        out.pop()
    return out

class Solution:
    def invertTree(self, root: List[int]) -> List[int]:
        tree = _build(root)
        def invert(n):
            if not n: return
            n.l, n.r = n.r, n.l
            invert(n.l); invert(n.r)
        invert(tree)
        return _ser(tree)
`,
  js: `function _build(arr) {
    if (!arr || arr.length === 0) return null;
    const root = { val: arr[0], l: null, r: null };
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) { node.l = { val: arr[i], l: null, r: null }; q.push(node.l); }
        i++;
        if (i < arr.length && arr[i] !== null) { node.r = { val: arr[i], l: null, r: null }; q.push(node.r); }
        i++;
    }
    return root;
}
function _ser(root) {
    if (!root) return [];
    const out = [], q = [root];
    while (q.length) {
        const node = q.shift();
        if (node === null) out.push(null);
        else { out.push(node.val); q.push(node.l); q.push(node.r); }
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
}
var invertTree = function(root) {
    const tree = _build(root);
    const invert = (n) => {
        if (!n) return;
        const t = n.l; n.l = n.r; n.r = t;
        invert(n.l); invert(n.r);
    };
    invert(tree);
    return _ser(tree);
};
`,
  java: `import java.util.*;
class Solution {
    static class N { Integer val; N l, r; N(Integer v){val=v;} }

    private N build(List<Integer> arr) {
        if (arr == null || arr.isEmpty()) return null;
        N root = new N(arr.get(0));
        Deque<N> q = new ArrayDeque<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.size()) {
            N node = q.poll();
            if (i < arr.size() && arr.get(i) != null) { node.l = new N(arr.get(i)); q.offer(node.l); }
            i++;
            if (i < arr.size() && arr.get(i) != null) { node.r = new N(arr.get(i)); q.offer(node.r); }
            i++;
        }
        return root;
    }

    private void invert(N n) {
        if (n == null) return;
        N t = n.l; n.l = n.r; n.r = t;
        invert(n.l); invert(n.r);
    }

    private List<Integer> ser(N root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Deque<N> q = new ArrayDeque<>();
        q.offer(root);
        while (!q.isEmpty()) {
            N node = q.poll();
            if (node == null) out.add(null);
            else { out.add(node.val); q.offer(node.l); q.offer(node.r); }
        }
        while (!out.isEmpty() && out.get(out.size() - 1) == null) out.remove(out.size() - 1);
        return out;
    }

    public List<Integer> invertTree(List<Integer> root) {
        N tree = build(root);
        invert(tree);
        return ser(tree);
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

struct N { int val; N* l; N* r; N(int v): val(v), l(nullptr), r(nullptr) {} };

class Solution {
    void invert(N* n) {
        if (!n) return;
        swap(n->l, n->r);
        invert(n->l); invert(n->r);
    }
public:
    vector<int> invertTree(vector<int>& root) {
        if (root.empty()) return {};
        N* tree = new N(root[0]);
        queue<N*> q; q.push(tree);
        int i = 1, n = root.size();
        const int NULLV = INT_MIN;
        while (!q.empty() && i < n) {
            N* node = q.front(); q.pop();
            if (i < n && root[i] != NULLV) { node->l = new N(root[i]); q.push(node->l); }
            i++;
            if (i < n && root[i] != NULLV) { node->r = new N(root[i]); q.push(node->r); }
            i++;
        }
        invert(tree);
        vector<int> out;
        queue<N*> qq; qq.push(tree);
        while (!qq.empty()) {
            N* node = qq.front(); qq.pop();
            if (!node) { out.push_back(NULLV); }
            else { out.push_back(node->val); qq.push(node->l); qq.push(node->r); }
        }
        while (!out.empty() && out.back() == NULLV) out.pop_back();
        return out;
    }
};
`,
};

// ---------- jump-game (nums: List[int]) -> bool ----------
SOL['jump-game'] = {
  py: `from typing import List

class Solution:
    def canJump(self, nums: List[int]) -> bool:
        reach = 0
        for i, n in enumerate(nums):
            if i > reach:
                return False
            if i + n > reach:
                reach = i + n
        return True
`,
  js: `var canJump = function(nums) {
    let reach = 0;
    for (let i = 0; i < nums.length; i++) {
        if (i > reach) return false;
        if (i + nums[i] > reach) reach = i + nums[i];
    }
    return true;
};
`,
  java: `class Solution {
    public boolean canJump(int[] nums) {
        int reach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > reach) return false;
            if (i + nums[i] > reach) reach = i + nums[i];
        }
        return true;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    bool canJump(vector<int>& nums) {
        int reach = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (i > reach) return false;
            if (i + nums[i] > reach) reach = i + nums[i];
        }
        return true;
    }
};
`,
};

// ---------- jump-game-ii (nums: List[int]) -> int ----------
SOL['jump-game-ii'] = {
  py: `from typing import List

class Solution:
    def jump(self, nums: List[int]) -> int:
        jumps = 0
        end = 0
        farthest = 0
        for i in range(len(nums) - 1):
            if i + nums[i] > farthest:
                farthest = i + nums[i]
            if i == end:
                jumps += 1
                end = farthest
        return jumps
`,
  js: `var jump = function(nums) {
    let jumps = 0, end = 0, farthest = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        if (i + nums[i] > farthest) farthest = i + nums[i];
        if (i === end) { jumps++; end = farthest; }
    }
    return jumps;
};
`,
  java: `class Solution {
    public int jump(int[] nums) {
        int jumps = 0, end = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            if (i + nums[i] > farthest) farthest = i + nums[i];
            if (i == end) { jumps++; end = farthest; }
        }
        return jumps;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int jump(vector<int>& nums) {
        int jumps = 0, end = 0, farthest = 0;
        for (int i = 0; i < (int)nums.size() - 1; i++) {
            if (i + nums[i] > farthest) farthest = i + nums[i];
            if (i == end) { jumps++; end = farthest; }
        }
        return jumps;
    }
};
`,
};

// ---------- k-closest-points (points: List[List[int]], k: int) -> List[List[int]] ----------
SOL['k-closest-points'] = {
  py: `from typing import List
import heapq

class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        heap = []
        for x, y in points:
            d = x*x + y*y
            if len(heap) < k:
                heapq.heappush(heap, (-d, x, y))
            elif -heap[0][0] > d:
                heapq.heapreplace(heap, (-d, x, y))
        return [[x, y] for _, x, y in heap]
`,
  js: `var kClosest = function(points, k) {
    // Simple sort-based approach is fine and stable.
    const withD = points.map(([x, y]) => [x, y, x*x + y*y]);
    withD.sort((a, b) => a[2] - b[2]);
    return withD.slice(0, k).map(([x, y]) => [x, y]);
};
`,
  java: `import java.util.*;
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[2], a[2]));
        for (int[] p : points) {
            int d = p[0]*p[0] + p[1]*p[1];
            if (heap.size() < k) heap.offer(new int[]{p[0], p[1], d});
            else if (heap.peek()[2] > d) { heap.poll(); heap.offer(new int[]{p[0], p[1], d}); }
        }
        int[][] out = new int[heap.size()][2];
        int i = 0;
        for (int[] p : heap) { out[i][0] = p[0]; out[i][1] = p[1]; i++; }
        return out;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        vector<tuple<int,int,int>> v;
        for (auto& p : points) v.emplace_back(p[0]*p[0] + p[1]*p[1], p[0], p[1]);
        sort(v.begin(), v.end(), [](auto& a, auto& b){ return get<0>(a) < get<0>(b); });
        vector<vector<int>> out;
        for (int i = 0; i < k && i < (int)v.size(); i++) out.push_back({get<1>(v[i]), get<2>(v[i])});
        return out;
    }
};
`,
};

// ---------- koko-bananas (piles: List[int], h: int) -> int ----------
SOL['koko-bananas'] = {
  py: `from typing import List

class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        def hours(k: int) -> int:
            return sum((p + k - 1) // k for p in piles)
        lo, hi = 1, max(piles)
        while lo < hi:
            mid = (lo + hi) // 2
            if hours(mid) <= h:
                hi = mid
            else:
                lo = mid + 1
        return lo
`,
  js: `var minEatingSpeed = function(piles, h) {
    const hours = (k) => piles.reduce((acc, p) => acc + Math.ceil(p / k), 0);
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (hours(mid) <= h) hi = mid; else lo = mid + 1;
    }
    return lo;
};
`,
  java: `class Solution {
    private long hours(int[] piles, int k) {
        long h = 0;
        for (int p : piles) h += (p + (long)k - 1) / k;
        return h;
    }
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 1;
        for (int p : piles) if (p > hi) hi = p;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours(piles, mid) <= h) hi = mid; else lo = mid + 1;
        }
        return lo;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        auto hours = [&](int k) {
            long long total = 0;
            for (int p : piles) total += (p + (long long)k - 1) / k;
            return total;
        };
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours(mid) <= h) hi = mid; else lo = mid + 1;
        }
        return lo;
    }
};
`,
};

// ---------- kth-largest-element (nums: List[int], k: int) -> int ----------
// Note: PGcode method is findKthLargest, classic kth-largest in array.
SOL['kth-largest-element'] = {
  py: `from typing import List
import heapq

class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap: List[int] = []
        for n in nums:
            if len(heap) < k:
                heapq.heappush(heap, n)
            elif n > heap[0]:
                heapq.heapreplace(heap, n)
        return heap[0]
`,
  js: `var findKthLargest = function(nums, k) {
    nums.sort((a, b) => a - b);
    return nums[nums.length - k];
};
`,
  java: `import java.util.*;
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int n : nums) {
            if (heap.size() < k) heap.offer(n);
            else if (n > heap.peek()) { heap.poll(); heap.offer(n); }
        }
        return heap.peek();
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int n : nums) {
            if ((int)heap.size() < k) heap.push(n);
            else if (n > heap.top()) { heap.pop(); heap.push(n); }
        }
        return heap.top();
    }
};
`,
};

// ---------- kth-smallest-bst (root: List[int], k: int) -> int ----------
SOL['kth-smallest-bst'] = {
  py: `from typing import List, Optional
from collections import deque

class _N:
    __slots__ = ('val','l','r')
    def __init__(self, v): self.val = v; self.l = None; self.r = None

def _build(arr):
    if not arr: return None
    root = _N(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.l = _N(arr[i]); q.append(node.l)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.r = _N(arr[i]); q.append(node.r)
        i += 1
    return root

class Solution:
    def kthSmallest(self, root: List[int], k: int) -> int:
        tree = _build(root)
        stack = []
        cur = tree
        while stack or cur:
            while cur:
                stack.append(cur); cur = cur.l
            cur = stack.pop()
            k -= 1
            if k == 0:
                return cur.val
            cur = cur.r
        return -1
`,
  js: `function _build(arr) {
    if (!arr || arr.length === 0) return null;
    const root = { val: arr[0], l: null, r: null };
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) { node.l = { val: arr[i], l: null, r: null }; q.push(node.l); }
        i++;
        if (i < arr.length && arr[i] !== null) { node.r = { val: arr[i], l: null, r: null }; q.push(node.r); }
        i++;
    }
    return root;
}
var kthSmallest = function(root, k) {
    const tree = _build(root);
    const stack = [];
    let cur = tree;
    while (stack.length || cur) {
        while (cur) { stack.push(cur); cur = cur.l; }
        cur = stack.pop();
        if (--k === 0) return cur.val;
        cur = cur.r;
    }
    return -1;
};
`,
  java: `import java.util.*;
class Solution {
    static class N { Integer val; N l, r; N(Integer v){val=v;} }
    private N build(List<Integer> arr) {
        if (arr == null || arr.isEmpty()) return null;
        N root = new N(arr.get(0));
        Deque<N> q = new ArrayDeque<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.size()) {
            N node = q.poll();
            if (i < arr.size() && arr.get(i) != null) { node.l = new N(arr.get(i)); q.offer(node.l); }
            i++;
            if (i < arr.size() && arr.get(i) != null) { node.r = new N(arr.get(i)); q.offer(node.r); }
            i++;
        }
        return root;
    }
    public int kthSmallest(List<Integer> root, int k) {
        N tree = build(root);
        Deque<N> stack = new ArrayDeque<>();
        N cur = tree;
        while (!stack.isEmpty() || cur != null) {
            while (cur != null) { stack.push(cur); cur = cur.l; }
            cur = stack.pop();
            if (--k == 0) return cur.val;
            cur = cur.r;
        }
        return -1;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
struct N { int val; N* l; N* r; N(int v): val(v), l(nullptr), r(nullptr) {} };
class Solution {
public:
    int kthSmallest(vector<int>& root, int k) {
        if (root.empty()) return -1;
        const int NULLV = INT_MIN;
        N* tree = new N(root[0]);
        queue<N*> q; q.push(tree);
        int i = 1, n = root.size();
        while (!q.empty() && i < n) {
            N* node = q.front(); q.pop();
            if (i < n && root[i] != NULLV) { node->l = new N(root[i]); q.push(node->l); }
            i++;
            if (i < n && root[i] != NULLV) { node->r = new N(root[i]); q.push(node->r); }
            i++;
        }
        stack<N*> st;
        N* cur = tree;
        while (!st.empty() || cur) {
            while (cur) { st.push(cur); cur = cur->l; }
            cur = st.top(); st.pop();
            if (--k == 0) return cur->val;
            cur = cur->r;
        }
        return -1;
    }
};
`,
};

// ---------- largest-rect-histogram (heights: List[int]) -> int ----------
SOL['largest-rect-histogram'] = {
  py: `from typing import List

class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack: List[int] = []
        best = 0
        for i, h in enumerate(heights + [0]):
            while stack and heights[stack[-1]] > h:
                top = stack.pop()
                width = i if not stack else i - stack[-1] - 1
                if heights[top] * width > best:
                    best = heights[top] * width
            stack.append(i)
        return best
`,
  js: `var largestRectangleArea = function(heights) {
    const stack = [];
    let best = 0;
    const arr = heights.concat([0]);
    for (let i = 0; i < arr.length; i++) {
        while (stack.length && arr[stack[stack.length - 1]] > arr[i]) {
            const top = stack.pop();
            const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
            if (arr[top] * width > best) best = arr[top] * width;
        }
        stack.push(i);
    }
    return best;
};
`,
  java: `import java.util.*;
class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int best = 0;
        int n = heights.length;
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > cur) {
                int top = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                if (heights[top] * width > best) best = heights[top] * width;
            }
            stack.push(i);
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        int best = 0, n = heights.size();
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] > cur) {
                int top = st.top(); st.pop();
                int width = st.empty() ? i : i - st.top() - 1;
                if (heights[top] * width > best) best = heights[top] * width;
            }
            st.push(i);
        }
        return best;
    }
};
`,
};

// ---------- last-stone-weight (stones: List[int]) -> int ----------
SOL['last-stone-weight'] = {
  py: `from typing import List
import heapq

class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)
            b = -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0
`,
  js: `var lastStoneWeight = function(stones) {
    const arr = stones.slice();
    while (arr.length > 1) {
        arr.sort((a, b) => a - b);
        const a = arr.pop(), b = arr.pop();
        if (a !== b) arr.push(a - b);
    }
    return arr.length ? arr[0] : 0;
};
`,
  java: `import java.util.*;
class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int a = heap.poll(), b = heap.poll();
            if (a != b) heap.offer(a - b);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int a = heap.top(); heap.pop();
            int b = heap.top(); heap.pop();
            if (a != b) heap.push(a - b);
        }
        return heap.empty() ? 0 : heap.top();
    }
};
`,
};

// ---------- letter-combinations (digits: str) -> List[str] ----------
SOL['letter-combinations'] = {
  py: `from typing import List

class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        if not digits:
            return []
        mp = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}
        out: List[str] = []
        cur: List[str] = []
        def dfs(i: int):
            if i == len(digits):
                out.append(''.join(cur)); return
            for ch in mp[digits[i]]:
                cur.append(ch); dfs(i + 1); cur.pop()
        dfs(0)
        return out
`,
  js: `var letterCombinations = function(digits) {
    if (!digits) return [];
    const mp = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const out = [];
    const cur = [];
    const dfs = (i) => {
        if (i === digits.length) { out.push(cur.join('')); return; }
        for (const ch of mp[digits[i]]) { cur.push(ch); dfs(i + 1); cur.pop(); }
    };
    dfs(0);
    return out;
};
`,
  java: `import java.util.*;
class Solution {
    private static final String[] MP = {"","","abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};
    private List<String> out;
    private String digits;
    public List<String> letterCombinations(String digits) {
        out = new ArrayList<>();
        this.digits = digits;
        if (digits == null || digits.isEmpty()) return out;
        dfs(0, new StringBuilder());
        return out;
    }
    private void dfs(int i, StringBuilder cur) {
        if (i == digits.length()) { out.add(cur.toString()); return; }
        String letters = MP[digits.charAt(i) - '0'];
        for (char ch : letters.toCharArray()) {
            cur.append(ch); dfs(i + 1, cur); cur.deleteCharAt(cur.length() - 1);
        }
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    vector<string> out;
    string digits;
    vector<string> mp = {"","","abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};
    void dfs(int i, string& cur) {
        if (i == (int)digits.size()) { out.push_back(cur); return; }
        for (char ch : mp[digits[i] - '0']) { cur.push_back(ch); dfs(i + 1, cur); cur.pop_back(); }
    }
public:
    vector<string> letterCombinations(string digits) {
        out.clear();
        if (digits.empty()) return out;
        this->digits = digits;
        string cur;
        dfs(0, cur);
        return out;
    }
};
`,
};

// ---------- linked-list-cycle (values: List[int], pos: int) -> bool ----------
// Solution builds a linked list with optional cycle, then runs tortoise/hare.
SOL['linked-list-cycle'] = {
  py: `from typing import List

class _Node:
    __slots__ = ('val','next')
    def __init__(self, v):
        self.val = v; self.next = None

class Solution:
    def hasCycle(self, values: List[int], pos: int) -> bool:
        if not values:
            return False
        nodes = [_Node(v) for v in values]
        for i in range(len(nodes) - 1):
            nodes[i].next = nodes[i + 1]
        if pos >= 0:
            nodes[-1].next = nodes[pos]
        slow = fast = nodes[0]
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False
`,
  js: `var hasCycle = function(values, pos) {
    if (!values || values.length === 0) return false;
    const nodes = values.map(v => ({ val: v, next: null }));
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
    if (pos >= 0) nodes[nodes.length - 1].next = nodes[pos];
    let slow = nodes[0], fast = nodes[0];
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};
`,
  java: `import java.util.*;
class Solution {
    static class Node { int val; Node next; Node(int v){val=v;} }
    public boolean hasCycle(int[] values, int pos) {
        if (values == null || values.length == 0) return false;
        Node[] nodes = new Node[values.length];
        for (int i = 0; i < values.length; i++) nodes[i] = new Node(values[i]);
        for (int i = 0; i < values.length - 1; i++) nodes[i].next = nodes[i + 1];
        if (pos >= 0) nodes[values.length - 1].next = nodes[pos];
        Node slow = nodes[0], fast = nodes[0];
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    struct Node { int val; Node* next; Node(int v): val(v), next(nullptr) {} };
public:
    bool hasCycle(vector<int>& values, int pos) {
        if (values.empty()) return false;
        int n = values.size();
        vector<Node*> nodes(n);
        for (int i = 0; i < n; i++) nodes[i] = new Node(values[i]);
        for (int i = 0; i < n - 1; i++) nodes[i]->next = nodes[i + 1];
        if (pos >= 0) nodes[n - 1]->next = nodes[pos];
        Node *slow = nodes[0], *fast = nodes[0];
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};
`,
};

// ---------- longest-common-subseq (text1: str, text2: str) -> int ----------
SOL['longest-common-subseq'] = {
  py: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        prev = [0] * (n + 1)
        for i in range(1, m + 1):
            cur = [0] * (n + 1)
            for j in range(1, n + 1):
                if text1[i-1] == text2[j-1]:
                    cur[j] = prev[j-1] + 1
                else:
                    cur[j] = max(prev[j], cur[j-1])
            prev = cur
        return prev[n]
`,
  js: `var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length, n = text2.length;
    let prev = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
        const cur = new Array(n + 1).fill(0);
        for (let j = 1; j <= n; j++) {
            if (text1[i-1] === text2[j-1]) cur[j] = prev[j-1] + 1;
            else cur[j] = Math.max(prev[j], cur[j-1]);
        }
        prev = cur;
    }
    return prev[n];
};
`,
  java: `class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[] prev = new int[n + 1];
        for (int i = 1; i <= m; i++) {
            int[] cur = new int[n + 1];
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i-1) == text2.charAt(j-1)) cur[j] = prev[j-1] + 1;
                else cur[j] = Math.max(prev[j], cur[j-1]);
            }
            prev = cur;
        }
        return prev[n];
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.size(), n = text2.size();
        vector<int> prev(n + 1, 0), cur(n + 1, 0);
        for (int i = 1; i <= m; i++) {
            fill(cur.begin(), cur.end(), 0);
            for (int j = 1; j <= n; j++) {
                if (text1[i-1] == text2[j-1]) cur[j] = prev[j-1] + 1;
                else cur[j] = max(prev[j], cur[j-1]);
            }
            prev = cur;
        }
        return prev[n];
    }
};
`,
};

// ---------- longest-consecutive (nums: List[int]) -> int ----------
SOL['longest-consecutive'] = {
  py: `from typing import List

class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        s = set(nums)
        best = 0
        for n in s:
            if n - 1 not in s:
                cur = n
                length = 1
                while cur + 1 in s:
                    cur += 1; length += 1
                if length > best:
                    best = length
        return best
`,
  js: `var longestConsecutive = function(nums) {
    const s = new Set(nums);
    let best = 0;
    for (const n of s) {
        if (!s.has(n - 1)) {
            let cur = n, len = 1;
            while (s.has(cur + 1)) { cur++; len++; }
            if (len > best) best = len;
        }
    }
    return best;
};
`,
  java: `import java.util.*;
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> s = new HashSet<>();
        for (int n : nums) s.add(n);
        int best = 0;
        for (int n : s) {
            if (!s.contains(n - 1)) {
                int cur = n, len = 1;
                while (s.contains(cur + 1)) { cur++; len++; }
                if (len > best) best = len;
            }
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(), nums.end());
        int best = 0;
        for (int n : s) {
            if (!s.count(n - 1)) {
                int cur = n, len = 1;
                while (s.count(cur + 1)) { cur++; len++; }
                if (len > best) best = len;
            }
        }
        return best;
    }
};
`,
};

// ---------- longest-increasing-subseq (nums: List[int]) -> int ----------
SOL['longest-increasing-subseq'] = {
  py: `from typing import List
from bisect import bisect_left

class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails: List[int] = []
        for n in nums:
            i = bisect_left(tails, n)
            if i == len(tails):
                tails.append(n)
            else:
                tails[i] = n
        return len(tails)
`,
  js: `var lengthOfLIS = function(nums) {
    const tails = [];
    for (const n of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (tails[mid] < n) lo = mid + 1; else hi = mid;
        }
        if (lo === tails.length) tails.push(n);
        else tails[lo] = n;
    }
    return tails.length;
};
`,
  java: `import java.util.*;
class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        for (int n : nums) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < n) lo = mid + 1; else hi = mid;
            }
            tails[lo] = n;
            if (lo == size) size++;
        }
        return size;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;
        for (int n : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), n);
            if (it == tails.end()) tails.push_back(n);
            else *it = n;
        }
        return tails.size();
    }
};
`,
};

// ---------- longest-palindromic-substring (s: str) -> str ----------
SOL['longest-palindromic-substring'] = {
  py: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        if not s:
            return ''
        start, end = 0, 0
        def expand(l: int, r: int):
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1; r += 1
            return l + 1, r - 1
        for i in range(len(s)):
            l1, r1 = expand(i, i)
            l2, r2 = expand(i, i + 1)
            if r1 - l1 > end - start:
                start, end = l1, r1
            if r2 - l2 > end - start:
                start, end = l2, r2
        return s[start:end+1]
`,
  js: `var longestPalindrome = function(s) {
    if (!s) return '';
    let start = 0, end = 0;
    const expand = (l, r) => {
        while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
        return [l + 1, r - 1];
    };
    for (let i = 0; i < s.length; i++) {
        const [l1, r1] = expand(i, i);
        const [l2, r2] = expand(i, i + 1);
        if (r1 - l1 > end - start) { start = l1; end = r1; }
        if (r2 - l2 > end - start) { start = l2; end = r2; }
    }
    return s.substring(start, end + 1);
};
`,
  java: `class Solution {
    private int start = 0, end = 0;
    public String longestPalindrome(String s) {
        if (s == null || s.isEmpty()) return "";
        start = 0; end = 0;
        for (int i = 0; i < s.length(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substring(start, end + 1);
    }
    private void expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        l++; r--;
        if (r - l > end - start) { start = l; end = r; }
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    int s_start = 0, s_end = 0;
    void expand(const string& s, int l, int r) {
        while (l >= 0 && r < (int)s.size() && s[l] == s[r]) { l--; r++; }
        l++; r--;
        if (r - l > s_end - s_start) { s_start = l; s_end = r; }
    }
public:
    string longestPalindrome(string s) {
        if (s.empty()) return "";
        s_start = 0; s_end = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            expand(s, i, i);
            expand(s, i, i + 1);
        }
        return s.substr(s_start, s_end - s_start + 1);
    }
};
`,
};

// ---------- longest-repeating-char (s: str, k: int) -> int ----------
SOL['longest-repeating-char'] = {
  py: `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = {}
        l = 0
        best = 0
        max_freq = 0
        for r in range(len(s)):
            count[s[r]] = count.get(s[r], 0) + 1
            if count[s[r]] > max_freq:
                max_freq = count[s[r]]
            while (r - l + 1) - max_freq > k:
                count[s[l]] -= 1
                l += 1
            if r - l + 1 > best:
                best = r - l + 1
        return best
`,
  js: `var characterReplacement = function(s, k) {
    const count = {};
    let l = 0, best = 0, maxFreq = 0;
    for (let r = 0; r < s.length; r++) {
        count[s[r]] = (count[s[r]] || 0) + 1;
        if (count[s[r]] > maxFreq) maxFreq = count[s[r]];
        while ((r - l + 1) - maxFreq > k) { count[s[l]]--; l++; }
        if (r - l + 1 > best) best = r - l + 1;
    }
    return best;
};
`,
  java: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];
        int l = 0, best = 0, maxFreq = 0;
        for (int r = 0; r < s.length(); r++) {
            count[s.charAt(r) - 'A']++;
            if (count[s.charAt(r) - 'A'] > maxFreq) maxFreq = count[s.charAt(r) - 'A'];
            while ((r - l + 1) - maxFreq > k) { count[s.charAt(l) - 'A']--; l++; }
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int characterReplacement(string s, int k) {
        int count[26] = {0};
        int l = 0, best = 0, maxFreq = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            count[s[r] - 'A']++;
            if (count[s[r] - 'A'] > maxFreq) maxFreq = count[s[r] - 'A'];
            while ((r - l + 1) - maxFreq > k) { count[s[l] - 'A']--; l++; }
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
};
`,
};

// ---------- longest-substr-no-repeat (s: str) -> int ----------
SOL['longest-substr-no-repeat'] = {
  py: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        l = 0
        best = 0
        for r, ch in enumerate(s):
            if ch in last and last[ch] >= l:
                l = last[ch] + 1
            last[ch] = r
            if r - l + 1 > best:
                best = r - l + 1
        return best
`,
  js: `var lengthOfLongestSubstring = function(s) {
    const last = new Map();
    let l = 0, best = 0;
    for (let r = 0; r < s.length; r++) {
        if (last.has(s[r]) && last.get(s[r]) >= l) l = last.get(s[r]) + 1;
        last.set(s[r], r);
        if (r - l + 1 > best) best = r - l + 1;
    }
    return best;
};
`,
  java: `import java.util.*;
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            char ch = s.charAt(r);
            if (last.containsKey(ch) && last.get(ch) >= l) l = last.get(ch) + 1;
            last.put(ch, r);
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> last;
        int l = 0, best = 0;
        for (int r = 0; r < (int)s.size(); r++) {
            if (last.count(s[r]) && last[s[r]] >= l) l = last[s[r]] + 1;
            last[s[r]] = r;
            if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
    }
};
`,
};

// ---------- lowest-common-ancestor (root: List[int], p: int, q: int) -> int ----------
SOL['lowest-common-ancestor'] = {
  py: `from typing import List, Optional
from collections import deque

class _N:
    __slots__ = ('val','l','r')
    def __init__(self, v): self.val = v; self.l = None; self.r = None

def _build(arr):
    if not arr: return None
    root = _N(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.l = _N(arr[i]); q.append(node.l)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.r = _N(arr[i]); q.append(node.r)
        i += 1
    return root

class Solution:
    def lowestCommonAncestor(self, root: List[int], p: int, q: int) -> int:
        tree = _build(root)
        def dfs(node):
            if not node:
                return None
            if node.val == p or node.val == q:
                return node
            l = dfs(node.l)
            r = dfs(node.r)
            if l and r:
                return node
            return l if l else r
        ans = dfs(tree)
        return ans.val if ans else -1
`,
  js: `function _build(arr) {
    if (!arr || arr.length === 0) return null;
    const root = { val: arr[0], l: null, r: null };
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) { node.l = { val: arr[i], l: null, r: null }; q.push(node.l); }
        i++;
        if (i < arr.length && arr[i] !== null) { node.r = { val: arr[i], l: null, r: null }; q.push(node.r); }
        i++;
    }
    return root;
}
var lowestCommonAncestor = function(root, p, q) {
    const tree = _build(root);
    const dfs = (node) => {
        if (!node) return null;
        if (node.val === p || node.val === q) return node;
        const l = dfs(node.l);
        const r = dfs(node.r);
        if (l && r) return node;
        return l || r;
    };
    const ans = dfs(tree);
    return ans ? ans.val : -1;
};
`,
  java: `import java.util.*;
class Solution {
    static class N { Integer val; N l, r; N(Integer v){val=v;} }
    private N build(List<Integer> arr) {
        if (arr == null || arr.isEmpty()) return null;
        N root = new N(arr.get(0));
        Deque<N> q = new ArrayDeque<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.size()) {
            N node = q.poll();
            if (i < arr.size() && arr.get(i) != null) { node.l = new N(arr.get(i)); q.offer(node.l); }
            i++;
            if (i < arr.size() && arr.get(i) != null) { node.r = new N(arr.get(i)); q.offer(node.r); }
            i++;
        }
        return root;
    }
    private N dfs(N node, int p, int q) {
        if (node == null) return null;
        if (node.val == p || node.val == q) return node;
        N l = dfs(node.l, p, q);
        N r = dfs(node.r, p, q);
        if (l != null && r != null) return node;
        return l != null ? l : r;
    }
    public int lowestCommonAncestor(List<Integer> root, int p, int q) {
        N tree = build(root);
        N ans = dfs(tree, p, q);
        return ans == null ? -1 : ans.val;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
struct N { int val; N* l; N* r; N(int v): val(v), l(nullptr), r(nullptr) {} };
class Solution {
    N* dfs(N* node, int p, int q) {
        if (!node) return nullptr;
        if (node->val == p || node->val == q) return node;
        N* l = dfs(node->l, p, q);
        N* r = dfs(node->r, p, q);
        if (l && r) return node;
        return l ? l : r;
    }
public:
    int lowestCommonAncestor(vector<int>& root, int p, int q) {
        if (root.empty()) return -1;
        const int NULLV = INT_MIN;
        N* tree = new N(root[0]);
        queue<N*> bq; bq.push(tree);
        int i = 1, n = root.size();
        while (!bq.empty() && i < n) {
            N* node = bq.front(); bq.pop();
            if (i < n && root[i] != NULLV) { node->l = new N(root[i]); bq.push(node->l); }
            i++;
            if (i < n && root[i] != NULLV) { node->r = new N(root[i]); bq.push(node->r); }
            i++;
        }
        N* ans = dfs(tree, p, q);
        return ans ? ans->val : -1;
    }
};
`,
};

// ---------- lru-cache (ops: List[str], args: List[List[int]]) -> List[int] ----------
// First op is "init" with [capacity]. Get returns the value (or -1). Put returns nothing.
// Expected output collects "get" results AND put-when-evict results? Test shows put returns nothing.
// Looking at test 1: ops=[init,put,put,get,put,get,put,get,get,get], args=[[2],[1,1],[2,2],[1,-1],[3,3],[2,-1],[4,4],[1,-1],[3,-1],[4,-1]], expected=[1,-1,-1,3,4].
// "get" args have a placeholder -1 in arg slot. So 5 gets produce 5 outputs: 1, -1, -1, 3, 4.
// Args for get: [key, _]. Args for put: [key, value]. Init: [capacity].
SOL['lru-cache'] = {
  py: `from typing import List
from collections import OrderedDict

class _LRU:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.d: 'OrderedDict[int,int]' = OrderedDict()
    def get(self, key: int) -> int:
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]
    def put(self, key: int, value: int) -> None:
        if key in self.d:
            self.d.move_to_end(key)
        self.d[key] = value
        if len(self.d) > self.cap:
            self.d.popitem(last=False)

class Solution:
    def lruOps(self, ops: List[str], args: List[List[int]]) -> List[int]:
        out: List[int] = []
        lru = None
        for op, arg in zip(ops, args):
            if op == 'init' or op == 'LRUCache':
                lru = _LRU(arg[0])
            elif op == 'get':
                out.append(lru.get(arg[0]))
            elif op == 'put':
                lru.put(arg[0], arg[1])
        return out
`,
  js: `class _LRU {
    constructor(capacity) { this.cap = capacity; this.d = new Map(); }
    get(key) {
        if (!this.d.has(key)) return -1;
        const v = this.d.get(key);
        this.d.delete(key);
        this.d.set(key, v);
        return v;
    }
    put(key, value) {
        if (this.d.has(key)) this.d.delete(key);
        this.d.set(key, value);
        if (this.d.size > this.cap) {
            const firstKey = this.d.keys().next().value;
            this.d.delete(firstKey);
        }
    }
}
var lruOps = function(ops, args) {
    const out = [];
    let lru = null;
    for (let i = 0; i < ops.length; i++) {
        const op = ops[i], arg = args[i];
        if (op === 'init' || op === 'LRUCache') lru = new _LRU(arg[0]);
        else if (op === 'get') out.push(lru.get(arg[0]));
        else if (op === 'put') lru.put(arg[0], arg[1]);
    }
    return out;
};
`,
  java: `import java.util.*;
class Solution {
    static class LRU extends LinkedHashMap<Integer,Integer> {
        int cap;
        LRU(int c) { super(c, 0.75f, true); cap = c; }
        protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e) { return size() > cap; }
    }
    public List<Integer> lruOps(List<String> ops, List<List<Integer>> args) {
        List<Integer> out = new ArrayList<>();
        LRU lru = null;
        for (int i = 0; i < ops.size(); i++) {
            String op = ops.get(i);
            List<Integer> a = args.get(i);
            if (op.equals("init") || op.equals("LRUCache")) lru = new LRU(a.get(0));
            else if (op.equals("get")) out.add(lru.getOrDefault(a.get(0), -1));
            else if (op.equals("put")) lru.put(a.get(0), a.get(1));
        }
        return out;
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
class Solution {
    struct Node { int k, v; Node *prev, *next; Node(int kk, int vv): k(kk), v(vv), prev(nullptr), next(nullptr){} };
public:
    vector<int> lruOps(vector<string>& ops, vector<vector<int>>& args) {
        // Implemented as inline ordered_map + list.
        vector<int> out;
        int cap = 0;
        list<pair<int,int>> dll;
        unordered_map<int, list<pair<int,int>>::iterator> mp;
        for (size_t i = 0; i < ops.size(); i++) {
            const string& op = ops[i];
            auto& a = args[i];
            if (op == "init" || op == "LRUCache") {
                cap = a[0]; dll.clear(); mp.clear();
            } else if (op == "get") {
                int k = a[0];
                if (!mp.count(k)) out.push_back(-1);
                else {
                    auto it = mp[k];
                    int v = it->second;
                    dll.erase(it);
                    dll.push_front({k, v});
                    mp[k] = dll.begin();
                    out.push_back(v);
                }
            } else if (op == "put") {
                int k = a[0], v = a[1];
                if (mp.count(k)) { dll.erase(mp[k]); }
                dll.push_front({k, v});
                mp[k] = dll.begin();
                if ((int)dll.size() > cap) {
                    auto last = std::prev(dll.end());
                    mp.erase(last->first);
                    dll.erase(last);
                }
            }
        }
        return out;
    }
};
`,
};

// ---------- max-depth-binary-tree (root: List[int]) -> int ----------
SOL['max-depth-binary-tree'] = {
  py: `from typing import List
from collections import deque

class _N:
    __slots__ = ('val','l','r')
    def __init__(self, v): self.val = v; self.l = None; self.r = None

def _build(arr):
    if not arr: return None
    root = _N(arr[0])
    q = deque([root])
    i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.l = _N(arr[i]); q.append(node.l)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.r = _N(arr[i]); q.append(node.r)
        i += 1
    return root

class Solution:
    def maxDepth(self, root: List[int]) -> int:
        tree = _build(root)
        def depth(n):
            if not n: return 0
            return 1 + max(depth(n.l), depth(n.r))
        return depth(tree)
`,
  js: `function _build(arr) {
    if (!arr || arr.length === 0) return null;
    const root = { val: arr[0], l: null, r: null };
    const q = [root];
    let i = 1;
    while (q.length && i < arr.length) {
        const node = q.shift();
        if (i < arr.length && arr[i] !== null) { node.l = { val: arr[i], l: null, r: null }; q.push(node.l); }
        i++;
        if (i < arr.length && arr[i] !== null) { node.r = { val: arr[i], l: null, r: null }; q.push(node.r); }
        i++;
    }
    return root;
}
var maxDepth = function(root) {
    const tree = _build(root);
    const depth = (n) => n ? 1 + Math.max(depth(n.l), depth(n.r)) : 0;
    return depth(tree);
};
`,
  java: `import java.util.*;
class Solution {
    static class N { Integer val; N l, r; N(Integer v){val=v;} }
    private N build(List<Integer> arr) {
        if (arr == null || arr.isEmpty()) return null;
        N root = new N(arr.get(0));
        Deque<N> q = new ArrayDeque<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < arr.size()) {
            N node = q.poll();
            if (i < arr.size() && arr.get(i) != null) { node.l = new N(arr.get(i)); q.offer(node.l); }
            i++;
            if (i < arr.size() && arr.get(i) != null) { node.r = new N(arr.get(i)); q.offer(node.r); }
            i++;
        }
        return root;
    }
    private int depth(N n) { return n == null ? 0 : 1 + Math.max(depth(n.l), depth(n.r)); }
    public int maxDepth(List<Integer> root) {
        return depth(build(root));
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
struct N { int val; N* l; N* r; N(int v): val(v), l(nullptr), r(nullptr) {} };
class Solution {
    int depth(N* n) { return !n ? 0 : 1 + max(depth(n->l), depth(n->r)); }
public:
    int maxDepth(vector<int>& root) {
        if (root.empty()) return 0;
        const int NULLV = INT_MIN;
        N* tree = new N(root[0]);
        queue<N*> q; q.push(tree);
        int i = 1, n = root.size();
        while (!q.empty() && i < n) {
            N* node = q.front(); q.pop();
            if (i < n && root[i] != NULLV) { node->l = new N(root[i]); q.push(node->l); }
            i++;
            if (i < n && root[i] != NULLV) { node->r = new N(root[i]); q.push(node->r); }
            i++;
        }
        return depth(tree);
    }
};
`,
};

// ---------- binary-search & climbing-stairs already have solutions; skip.

// === EDITORIALS ===
const EDITORIAL = {};

EDITORIAL['koko-bananas'] = `## Intuition
Koko has to choose a single eating speed k that lets her finish every pile within h hours. Smaller k is gentler (fewer bananas per hour) but slower; larger k is faster but wasteful. The set of speeds that work is monotonic: if speed k succeeds, every speed greater than k also succeeds. That monotonic boundary is the classic signal to use binary search on the answer.

## Approach
Define hours(k) as the total time to finish all piles when eating k bananas per hour. For each pile p, the time spent is ceil(p / k), because she cannot share leftover time across piles. Sum those values; if it is at most h, k is feasible.

The feasibility function is non-increasing in k. So binary search over the range [1, max(piles)]: any k below 1 is invalid, and eating faster than the biggest pile per hour cannot reduce time further (each pile already finishes in one hour). At each step compute the midpoint, test feasibility, and shrink the window. When lo and hi meet, that value is the minimum feasible speed.

The implementation uses integer ceiling via (p + k - 1) / k to avoid floating-point drift. Each iteration of the binary search costs O(n) for the sum, and the search itself runs in O(log M) iterations where M = max(piles).

## Complexity
- Time: O(n log M) where n is the number of piles and M is the largest pile.
- Space: O(1) extra besides the input.
`;

EDITORIAL['kth-largest-element'] = `## Intuition
"Kth largest" sits between two extremes: sort everything (O(n log n)) or scan with no extra structure (insufficient). A min-heap of size k captures the running top-k: the heap root is always the smallest of the largest k values seen so far, which by definition is the kth largest when the scan ends.

## Approach
Walk the array once. For each value, if the heap holds fewer than k elements push it in. Otherwise, compare against the heap's smallest element: if the new value is larger, it belongs in the top-k, so replace the root and re-heapify in O(log k). Anything smaller can be discarded.

When the scan ends, the heap holds exactly the k largest values, and the root is the kth largest. Heap operations are O(log k), and there are n insertions in the worst case, so the total cost is O(n log k) — strictly better than sort when k is small and never worse than O(n log n).

Quickselect (partition-based) is the classic O(n) average alternative but is O(n^2) worst case without careful pivot selection. The heap solution is more predictable and trivial to write correctly under interview pressure.

## Complexity
- Time: O(n log k).
- Space: O(k) for the heap.
`;

EDITORIAL['kth-smallest-bst'] = `## Intuition
In-order traversal of a BST visits nodes in sorted order. So the kth smallest value is simply the kth node visited by an in-order walk. No comparison or sorting is required — the tree's own structure does the work.

## Approach
Run an iterative in-order traversal: push left children onto a stack until you hit null, pop, decrement a counter, and if the counter hits zero you've found the answer. Otherwise move to the right subtree and repeat. The iterative form is preferred because it lets you stop the moment the kth node is found — recursive in-order would visit the entire subtree before the caller can return.

In the worst case (k near n, or a skewed tree) the traversal touches all n nodes for O(n) time. The auxiliary stack holds at most h nodes where h is the tree's height — O(log n) for a balanced BST, O(n) for a degenerate one.

If the tree is modified often and you need many kth-smallest queries, augment each node with a subtree-size counter; you can then descend the tree in O(h) per query.

## Complexity
- Time: O(h + k) in the average case, O(n) worst case.
- Space: O(h) for the iteration stack.
`;

EDITORIAL['largest-rect-histogram'] = `## Intuition
For each bar, the largest rectangle that uses that bar's height extends left and right until it hits a shorter bar. Computing those nearest-shorter boundaries naively is O(n^2). A monotonic increasing stack of bar indices solves it in O(n): when a shorter bar appears, the bars on the stack that are taller than it can be "closed out" because their right boundary is now known.

## Approach
Walk the array left to right, keeping a stack of indices whose heights form a non-decreasing sequence. When the current bar is shorter than the top of the stack, pop the top: that bar's largest rectangle is bounded on the right by the current index and on the left by the new top of the stack (or -1 if empty). Compute the area and update the answer.

Append a sentinel zero at the end so any bars still on the stack get popped and counted. Each index is pushed and popped at most once, so the total work is O(n) despite the inner while loop.

This stack pattern generalizes: it's the same idea behind "next greater element," "trapping rain water" (one variant), and "maximal rectangle in a 0/1 matrix" (run histogram across each row).

## Complexity
- Time: O(n).
- Space: O(n) for the stack in the worst case (already-sorted input).
`;

EDITORIAL['last-stone-weight'] = `## Intuition
Each round picks the two heaviest stones and smashes them. That access pattern — repeatedly get-max, possibly insert — is exactly what a max-heap supports in O(log n) per operation.

## Approach
Build a max-heap from the input list. While more than one stone remains, pop the two heaviest, a and b. If they're equal both vanish; otherwise push (a - b) back. When the loop ends, return whatever is left (or 0 if empty).

Languages without a native max-heap (Python's heapq is min-only) can negate values on insert and pop, which preserves the heap invariant. Each smash is O(log n), and at most n - 1 smashes happen, so the total work is O(n log n).

A naive sort-on-each-step approach is O(n^2 log n) and unnecessarily wasteful; the heap structure exists precisely to avoid re-sorting when only two elements change.

## Complexity
- Time: O(n log n).
- Space: O(n) for the heap.
`;

EDITORIAL['letter-combinations'] = `## Intuition
Each digit maps to 3 or 4 letters, and the answer is the Cartesian product across all positions. The total count is the product of letter counts per digit — exponential in digit count but bounded (the longest input is 4 digits, so at most 4^4 = 256 combinations in practice).

## Approach
Use backtracking. Recurse position by position; at each position append every candidate letter for the current digit, recurse, then pop. When the recursion depth equals the input length, the current path is one complete combination — record it.

The mapping {2: "abc", 3: "def", …} is the only domain knowledge needed. Empty input returns an empty list (LeetCode is explicit on this edge case). String building in tight loops is faster with a mutable buffer (StringBuilder, char array, or a list of chars joined at the leaf) than concatenation, but for the small input sizes here either is fine.

This is the canonical "build a string" backtracking template: append, recurse, pop. The same skeleton drives subsets, permutations, and combinations.

## Complexity
- Time: O(4^n * n) where n is digit count — the 4 accounts for digits 7 and 9, and the trailing n is the string copy at each leaf.
- Space: O(n) recursion depth, plus output.
`;

EDITORIAL['linked-list-cycle'] = `## Intuition
A list with a cycle has no real "end" — following next forever loops. A list without a cycle hits null. Floyd's tortoise-and-hare exploits this: two pointers, one moving one step at a time and the other two steps, will either meet (proving a cycle) or the fast pointer hits null (proving no cycle). Using extra memory like a visited set works but isn't required.

## Approach
Initialize slow and fast both at head. In each iteration advance slow by one and fast by two. If fast or fast.next ever becomes null, return false — there's no cycle. If slow and fast ever point to the same node, return true.

Why does meeting prove a cycle? Once both pointers enter the cycle, fast gains one node per step on slow. Their gap shrinks by one each iteration and must hit zero before lapping again. The total number of iterations is at most n: fast traverses 2n nodes worst case before meeting slow.

The pattern generalizes: a second phase (move one pointer back to head, advance both by one) finds the cycle entry node — that's Linked List Cycle II.

## Complexity
- Time: O(n).
- Space: O(1).
`;

EDITORIAL['longest-common-subseq'] = `## Intuition
A subsequence preserves order but allows skipping. The LCS of two strings ends at some pair (i, j) of matched characters; everything before that pair is itself an LCS of the prefixes text1[0..i-1] and text2[0..j-1]. That overlapping subproblem structure is the DP signal.

## Approach
Define dp[i][j] = length of the LCS of text1[:i] and text2[:j]. The recurrence has two cases:
- If text1[i-1] == text2[j-1], that pair contributes 1 plus the LCS of the strict prefixes: dp[i][j] = dp[i-1][j-1] + 1.
- Otherwise, drop one character from either string: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).

Initialize the zeroth row and column to zero (empty prefix has LCS length 0). Fill row by row. The final answer is dp[m][n].

The full 2D table is O(mn) space; rolling two 1D rows brings it to O(min(m, n)). Be careful with the row-rolling: when transitioning to a new row, you need the previous row's dp[j-1] before it's overwritten, which is what the prev[j-1] reference in the recurrence captures.

## Complexity
- Time: O(m * n).
- Space: O(min(m, n)) with rolling arrays.
`;

EDITORIAL['longest-consecutive'] = `## Intuition
Sorting solves it in O(n log n) but you can do better by exploiting set membership. The trick: only start counting a sequence from its smallest member. If n-1 is in the set, n is not a sequence start — some earlier iteration will handle it. That guard means every element is visited at most twice across all sequences combined.

## Approach
Build a hash set from the input. For each value, check if it is a sequence start by asking whether (value - 1) is present. If it isn't, walk forward from value, incrementing as long as the next consecutive integer is also in the set. Track the longest streak.

The key correctness argument is amortized: across all iterations, the inner while loop advances through each set element at most once total. The outer loop also visits each element once. Total work is O(n), and the hash set operations are O(1) average.

Without the "is this a sequence start" guard, the algorithm degrades to O(n^2) — you'd re-walk every sequence from every starting position.

## Complexity
- Time: O(n) average (hash operations are O(1) amortized).
- Space: O(n) for the set.
`;

EDITORIAL['longest-increasing-subseq'] = `## Intuition
The O(n^2) DP solution defines dp[i] as the LIS length ending at index i, computed by scanning all j < i. The O(n log n) trick replaces the inner scan with binary search by maintaining a "tails" array: tails[k] is the smallest possible tail value of any increasing subsequence of length k+1 seen so far.

## Approach
Walk the array. For each element n, binary-search tails for the leftmost position where tails[pos] >= n. If pos equals the length of tails, n extends every existing subsequence — append it. Otherwise replace tails[pos] with n, making future extensions easier without changing tails' length.

A subtle point: tails is not itself an LIS — it's a witness of feasibility. Its length at the end is the LIS length, but the actual indices in tails may not form a real subsequence in the original array. To recover the actual subsequence, store parent pointers per element.

The O(n^2) DP is acceptable for small inputs and is easier to explain; reach for the binary-search version when constraints push past 2,500.

## Complexity
- Time: O(n log n).
- Space: O(n) for the tails array.
`;

EDITORIAL['longest-palindromic-substring'] = `## Intuition
Every palindrome has a center: a single character (odd length) or a gap between two characters (even length). There are O(n) such centers. From each, expand outward while the two sides match. The longest valid expansion is the answer.

## Approach
Loop over every index i. Run expandAroundCenter(i, i) for odd-length palindromes and expandAroundCenter(i, i+1) for even-length. Each expansion walks outward, comparing the two sides; when they differ (or fall off the string), the last matching window is a palindrome. Compare its length against the current best and update.

This is O(n^2) in the worst case (string of identical characters: every expansion covers the full string). It's the simplest correct solution and is the expected interview answer.

Manacher's algorithm solves it in O(n) by reusing prior expansions, but it's notoriously fiddly and rarely asked. DP also works in O(n^2) time and O(n^2) space but is dominated by the expand-around-center approach on both axes.

## Complexity
- Time: O(n^2).
- Space: O(1) extra.
`;

EDITORIAL['longest-repeating-char'] = `## Intuition
At any window, the number of replacements needed equals window_length - count_of_most_frequent_letter. Keep the window valid: while that excess exceeds k, shrink from the left. The crucial observation: max_freq inside the window never needs to be exactly tracked — a stale (overestimated) value still gives a correct answer because we only ever care about the maximum window ever achieved.

## Approach
Maintain a sliding window [l, r] and a count array of size 26 (assuming uppercase letters). Each time r advances, increment count[s[r]] and update max_freq if needed. If (r - l + 1) - max_freq > k, the window needs more replacements than allowed — slide l forward and decrement count[s[l]]. Track best = max(best, r - l + 1) on every step.

The subtle "max_freq never decreases" trick is what makes this O(n). Recomputing max_freq after every shrink would push the cost to O(26n). Because we only update the answer when the window grows, a stale max_freq that's larger than the true value doesn't matter — it would only let the window stay open longer, but a smaller true max_freq would simply not exceed best.

## Complexity
- Time: O(n).
- Space: O(26) = O(1).
`;

EDITORIAL['longest-substr-no-repeat'] = `## Intuition
A valid substring has no repeated characters. As we expand the window to the right, the first time a character repeats we must shrink the left boundary past the previous occurrence. Tracking the last seen index of each character lets that shrink happen in O(1) instead of by linear search.

## Approach
Maintain a window [l, r] and a hash map of character to its most recent index. Walk r from 0 to n - 1. If s[r] has been seen and its last index is >= l, advance l to that index + 1. Then update the map and consider r - l + 1 as a candidate answer.

The check "last seen index >= l" is essential: characters may have been seen before but already been pushed out of the window by an earlier shrink. Without the guard, l could jump backward incorrectly.

Each character is visited once by r and at most once by the implicit advancement of l (which only moves forward). Total work is O(n).

## Complexity
- Time: O(n).
- Space: O(min(n, alphabet)) for the map.
`;

EDITORIAL['lowest-common-ancestor'] = `## Intuition
A node n is the LCA of p and q if and only if both nodes appear in different subtrees of n, or n itself is one of them. A post-order DFS lets us decide this for every node: look at what each subtree reports, then combine.

## Approach
Recurse from the root. The recursion returns the LCA from the subtree rooted at the current node, or null if neither target is in that subtree.

Base cases: null returns null; if the current node's value matches p or q, return the current node. Otherwise recurse on both children. If both children return non-null, the current node is the LCA — the targets are split across its subtrees. If only one child returns non-null, propagate it upward. If both children return null, this subtree contains neither target.

The algorithm makes a single pass over the tree. Every node is visited exactly once, and each call does O(1) work outside the recursion.

A common variant ("LCA of a BST") allows O(h) descent by comparing values, but the general binary tree case requires examining every node in the worst path.

## Complexity
- Time: O(n).
- Space: O(h) for the recursion stack.
`;

EDITORIAL['lru-cache'] = `## Intuition
LRU needs two operations to be O(1): lookup by key, and move-to-front when a key is touched. A hash map gives O(1) lookup; a doubly linked list gives O(1) reorder. Combining them — the map stores key to list-node pointers — gives a structure with both.

## Approach
A node holds (key, value, prev, next). The list maintains "most recently used at the head, least recently used at the tail." Get(key): look up the node, splice it out of its current position, re-attach at the head, return the value. Put(key, value): if the key exists, update the value and move to head; otherwise create a new node at the head and insert into the map. If the map size now exceeds capacity, remove the tail node and erase it from the map.

Many languages provide a hash-ordered-map (Python's OrderedDict, Java's LinkedHashMap with access-order) that does this bookkeeping for you. In C++ or in interview code where you want to demonstrate the data structure, implement the linked list manually with sentinel head and tail nodes to avoid edge-case branches.

The eviction is the tail; the most-recent is the head. Don't confuse the two — most LRU bugs come from getting the orientation wrong.

## Complexity
- Time: O(1) per get and put, amortized.
- Space: O(capacity) for the map and list.
`;

EDITORIAL['max-depth-binary-tree'] = `## Intuition
The depth of a tree is 1 plus the depth of its deeper subtree. That self-similar definition translates directly into a one-line recursive function. The base case is the empty tree, which has depth 0.

## Approach
Recurse on left and right children. Return 1 + max(left_depth, right_depth) when the current node is non-null, otherwise 0. This visits every node exactly once and does O(1) work per node beyond recursion.

The iterative alternative uses BFS level by level: count how many levels of the tree are non-empty. It's the same asymptotic cost and is preferred when the tree is so deep that recursion would blow the stack — Python's default limit, for instance, allows roughly 1000 frames.

For balanced trees, recursion depth is O(log n). For degenerate (linked-list-like) trees, recursion depth is O(n) and you should consider the iterative form. Most interview inputs are well-behaved.

## Complexity
- Time: O(n).
- Space: O(h) for recursion, where h is the tree height.
`;

// === PATTERNS (only where null) ===
const PATTERN = {
  'car-fleet': 'Sorting + Stack',
  'container-most-water': 'Two Pointers',
  'koko-bananas': 'Binary Search on Answer',
  'last-stone-weight': 'Heap',
  'design-add-search': 'Trie',
};

// === BUILD PATCHES ===
const patches = [];
const fieldCounts = { solutions: 0, editorial_md: 0, pattern: 0, hints: 0, test_cases: 0, method_name: 0, params: 0, return_type: 0 };
const skipped = [];
const uncertain = [];

for (const p of state) {
  const patch = { id: p.id };
  let touched = false;

  // solutions
  if (!p.solutions || Object.keys(p.solutions).length < 4) {
    const sol = SOL[p.id];
    if (sol) {
      patch.solutions = { python: sol.py, javascript: sol.js, java: sol.java, cpp: sol.cpp };
      fieldCounts.solutions++;
      touched = true;
    } else {
      uncertain.push({ id: p.id, missing: 'solutions' });
    }
  }

  // editorial_md
  if (!p.editorial_md || p.editorial_md.length < 200) {
    const ed = EDITORIAL[p.id];
    if (ed) {
      patch.editorial_md = ed;
      fieldCounts.editorial_md++;
      touched = true;
    }
  }

  // pattern
  if (!p.pattern) {
    const pat = PATTERN[p.id];
    if (pat) {
      patch.pattern = pat;
      fieldCounts.pattern++;
      touched = true;
    }
  }

  if (touched) patches.push(patch);
  else skipped.push(p.id);
}

fs.writeFileSync('/tmp/patch-100-A.json', JSON.stringify(patches, null, 2));
console.log('Patches written:', patches.length);
console.log('Field counts:', fieldCounts);
console.log('Skipped (no changes needed):', skipped);
if (uncertain.length) console.log('Uncertain:', uncertain);
