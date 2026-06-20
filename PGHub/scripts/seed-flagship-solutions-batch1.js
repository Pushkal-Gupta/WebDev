#!/usr/bin/env node
// Hydrate top-30 flagship problems (roadmap_set='100', alphabetical first 30 by id)
// with full 4-language solutions and editorial_md.
// Solutions are written only if the existing column IS NULL (COALESCE semantics).
// editorial_md is written when NULL.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sol = (code, complexity, explanation) => ({ code, complexity, explanation });
const pack = (py, js, jv, cp) => ({ python: py, javascript: js, java: jv, cpp: cp });

const SOLUTIONS = {
  'balanced-binary-tree': {
    editorial: `## Intuition
A tree is height-balanced when, for every node, the heights of its left and right subtrees differ by at most one. The naive recursive check recomputes heights from the root for each node — O(n^2) in the worst case (a skewed tree). The key insight is that we can compute the height and the balance check in the same post-order pass.

## Approach
Define a helper that returns the height of a subtree, or a sentinel -1 if any subtree below is already unbalanced. At each node, recurse left and right. If either side returns -1, propagate -1. If their heights differ by more than 1, return -1. Otherwise return 1 + max(left, right). The top-level answer is true iff the helper returns a non-negative value.

## Walkthrough
For tree [3,9,20,null,null,15,7]: left subtree of root is leaf 9 (height 1); right subtree (20,15,7) has height 2; |1-2| = 1, so balanced. For [1,2,2,3,3,null,null,4,4]: the deepest path makes height(left subtree of root) = 4 while height(right) = 1; the difference of 3 triggers a -1 cascade upward, returning false.

## Complexity
Time O(n) — each node is visited once. Space O(h) recursion stack where h is tree height.`,
    py: sol(
      `class Solution:\n    def isBalanced(self, root):\n        def height(node):\n            if not node:\n                return 0\n            lh = height(node.left)\n            if lh == -1:\n                return -1\n            rh = height(node.right)\n            if rh == -1 or abs(lh - rh) > 1:\n                return -1\n            return 1 + max(lh, rh)\n        return height(root) != -1`,
      'O(n) time, O(h) space',
      'Post-order recursion returns height, or -1 as an unbalanced sentinel that short-circuits up the tree.'
    ),
    js: sol(
      `class Solution {\n    isBalanced(root) {\n        const height = (node) => {\n            if (!node) return 0;\n            const lh = height(node.left);\n            if (lh === -1) return -1;\n            const rh = height(node.right);\n            if (rh === -1 || Math.abs(lh - rh) > 1) return -1;\n            return 1 + Math.max(lh, rh);\n        };\n        return height(root) !== -1;\n    }\n}`,
      'O(n) time, O(h) space',
      'Single post-order pass returning -1 as the unbalanced sentinel.'
    ),
    jv: sol(
      `class Solution {\n    public boolean isBalanced(TreeNode root) {\n        return height(root) != -1;\n    }\n    private int height(TreeNode node) {\n        if (node == null) return 0;\n        int lh = height(node.left);\n        if (lh == -1) return -1;\n        int rh = height(node.right);\n        if (rh == -1 || Math.abs(lh - rh) > 1) return -1;\n        return 1 + Math.max(lh, rh);\n    }\n}`,
      'O(n) time, O(h) space',
      'Helper returns subtree height or -1 if any descendant is unbalanced.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    bool isBalanced(TreeNode* root) {\n        return height(root) != -1;\n    }\nprivate:\n    int height(TreeNode* node) {\n        if (!node) return 0;\n        int lh = height(node->left);\n        if (lh == -1) return -1;\n        int rh = height(node->right);\n        if (rh == -1 || abs(lh - rh) > 1) return -1;\n        return 1 + max(lh, rh);\n    }\n};`,
      'O(n) time, O(h) space',
      'Post-order DFS with a -1 sentinel.'
    ),
  },

  'best-time-to-buy-sell-stock': {
    editorial: `## Intuition
We want a single buy and a single later sell that maximises profit. A brute force pairs every i with every j > i in O(n^2). The insight: for any chosen sell day, the best buy price is the minimum price seen strictly before it. So we only need to remember the running minimum as we sweep left to right.

## Approach
Maintain two variables while scanning prices: minPrice (lowest seen so far) and maxProfit (best profit so far). For each price p, first try to improve maxProfit with p - minPrice, then update minPrice with min(minPrice, p). The order matters — we cannot buy and sell the same day, but updating minPrice last respects "buy before sell" since the current p was not part of the previous minPrice when we computed profit.

## Walkthrough
prices = [7,1,5,3,6,4]. minPrice starts at +inf, maxProfit = 0.
- p=7: profit 0, minPrice=7.
- p=1: profit max(0, -6)=0, minPrice=1.
- p=5: profit max(0, 4)=4, minPrice=1.
- p=3: profit max(4, 2)=4.
- p=6: profit max(4, 5)=5, minPrice=1.
- p=4: profit max(5, 3)=5. Answer 5.

## Complexity
Time O(n) single pass. Space O(1).`,
    py: sol(
      `class Solution:\n    def maxProfit(self, prices):\n        min_price = float('inf')\n        max_profit = 0\n        for p in prices:\n            if p - min_price > max_profit:\n                max_profit = p - min_price\n            if p < min_price:\n                min_price = p\n        return max_profit`,
      'O(n) time, O(1) space',
      'Track the running minimum buy price and the best profit so far.'
    ),
    js: sol(
      `class Solution {\n    maxProfit(prices) {\n        let minPrice = Infinity, best = 0;\n        for (const p of prices) {\n            if (p - minPrice > best) best = p - minPrice;\n            if (p < minPrice) minPrice = p;\n        }\n        return best;\n    }\n}`,
      'O(n) time, O(1) space',
      'Single pass with two state variables.'
    ),
    jv: sol(
      `class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE, best = 0;\n        for (int p : prices) {\n            if (p - minPrice > best) best = p - minPrice;\n            if (p < minPrice) minPrice = p;\n        }\n        return best;\n    }\n}`,
      'O(n) time, O(1) space',
      'Running minimum buy, running max profit.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        int minPrice = INT_MAX, best = 0;\n        for (int p : prices) {\n            if (p - minPrice > best) best = p - minPrice;\n            if (p < minPrice) minPrice = p;\n        }\n        return best;\n    }\n};`,
      'O(n) time, O(1) space',
      'Sweep once, keeping the min buy price and max profit.'
    ),
  },

  'binary-search': {
    editorial: `## Intuition
Binary search exploits the sorted invariant: at any moment the answer lies in a contiguous range [lo, hi]. Comparing target to the middle element shrinks that range by half, giving O(log n) instead of O(n).

## Approach
Maintain inclusive bounds lo=0 and hi=n-1. While lo <= hi, compute mid = lo + (hi - lo) // 2 (this form avoids integer overflow in fixed-width languages). If nums[mid] == target, return mid. If nums[mid] < target, the answer must be to the right: lo = mid + 1. Otherwise hi = mid - 1. If the loop exits without finding, return -1.

## Walkthrough
nums = [-1,0,3,5,9,12], target=9. lo=0, hi=5, mid=2, nums[2]=3 < 9, lo=3. mid=4, nums[4]=9, return 4. For target=2: lo=0,hi=5,mid=2 (3>2) hi=1. mid=0 (-1<2) lo=1. mid=1 (0<2) lo=2. lo>hi, return -1.

## Complexity
Time O(log n). Space O(1). The mid formula prevents the (lo+hi) overflow that bit decades of older code.`,
    py: sol(
      `class Solution:\n    def search(self, nums, target):\n        lo, hi = 0, len(nums) - 1\n        while lo <= hi:\n            mid = (lo + hi) // 2\n            if nums[mid] == target:\n                return mid\n            if nums[mid] < target:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n        return -1`,
      'O(log n) time, O(1) space',
      'Classic inclusive-bounds binary search.'
    ),
    js: sol(
      `class Solution {\n    search(nums, target) {\n        let lo = 0, hi = nums.length - 1;\n        while (lo <= hi) {\n            const mid = (lo + hi) >> 1;\n            if (nums[mid] === target) return mid;\n            if (nums[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        return -1;\n    }\n}`,
      'O(log n) time, O(1) space',
      'Bit-shift midpoint, inclusive bounds.'
    ),
    jv: sol(
      `class Solution {\n    public int search(int[] nums, int target) {\n        int lo = 0, hi = nums.length - 1;\n        while (lo <= hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        return -1;\n    }\n}`,
      'O(log n) time, O(1) space',
      'Overflow-safe midpoint.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int lo = 0, hi = (int)nums.size() - 1;\n        while (lo <= hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[mid] < target) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        return -1;\n    }\n};`,
      'O(log n) time, O(1) space',
      'Overflow-safe midpoint, inclusive bounds.'
    ),
  },

  'car-fleet': {
    editorial: `## Intuition
A faster car behind a slower car cannot pass; they form a fleet that moves at the slower car's speed. Process cars from the one closest to the target backward — each car either catches the fleet ahead or starts a new fleet.

## Approach
Pair each (position, speed). Sort by position descending so we walk cars from nearest-to-target to farthest. For each car compute time = (target - position) / speed: how long it takes alone to reach the target. Maintain the max time of the leading fleet. If the current car's time is strictly greater, it cannot catch the fleet ahead — it forms a new fleet, and its time becomes the new leading time. Otherwise it merges (no count increment).

## Walkthrough
target=12, position=[10,8,0,5,3], speed=[2,4,1,1,3]. Sorted by pos desc: (10,2)t=1, (8,4)t=1, (5,1)t=7, (3,3)t=3, (0,1)t=12.
- t=1: new fleet, leader=1, count=1.
- t=1: <=1, merges.
- t=7: >1, new fleet, leader=7, count=2.
- t=3: <=7, merges.
- t=12: >7, new fleet, leader=12, count=3. Answer 3.

## Complexity
Time O(n log n) for sort. Space O(n) for the pairs.`,
    py: sol(
      `class Solution:\n    def carFleet(self, target, position, speed):\n        cars = sorted(zip(position, speed), reverse=True)\n        fleets = 0\n        lead_time = 0.0\n        for pos, spd in cars:\n            t = (target - pos) / spd\n            if t > lead_time:\n                fleets += 1\n                lead_time = t\n        return fleets`,
      'O(n log n) time, O(n) space',
      'Sort cars by position descending; a slower car ahead becomes the new fleet leader.'
    ),
    js: sol(
      `class Solution {\n    carFleet(target, position, speed) {\n        const cars = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);\n        let fleets = 0, leadTime = 0;\n        for (const [pos, spd] of cars) {\n            const t = (target - pos) / spd;\n            if (t > leadTime) { fleets++; leadTime = t; }\n        }\n        return fleets;\n    }\n}`,
      'O(n log n) time, O(n) space',
      'Sweep from closest to farthest; merge into the lead fleet when caught.'
    ),
    jv: sol(
      `class Solution {\n    public int carFleet(int target, int[] position, int[] speed) {\n        int n = position.length;\n        double[][] cars = new double[n][2];\n        for (int i = 0; i < n; i++) { cars[i][0] = position[i]; cars[i][1] = speed[i]; }\n        java.util.Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0]));\n        int fleets = 0;\n        double leadTime = 0.0;\n        for (double[] c : cars) {\n            double t = (target - c[0]) / c[1];\n            if (t > leadTime) { fleets++; leadTime = t; }\n        }\n        return fleets;\n    }\n}`,
      'O(n log n) time, O(n) space',
      'Sort by position desc, track lead-fleet arrival time.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int carFleet(int target, vector<int>& position, vector<int>& speed) {\n        int n = position.size();\n        vector<pair<int,int>> cars(n);\n        for (int i = 0; i < n; i++) cars[i] = {position[i], speed[i]};\n        sort(cars.begin(), cars.end(), greater<>());\n        int fleets = 0;\n        double leadTime = 0.0;\n        for (auto& [pos, spd] : cars) {\n            double t = (double)(target - pos) / spd;\n            if (t > leadTime) { fleets++; leadTime = t; }\n        }\n        return fleets;\n    }\n};`,
      'O(n log n) time, O(n) space',
      'Sort descending by position; new fleet when current car is slower than the leader.'
    ),
  },

  'cheapest-flights': {
    editorial: `## Intuition
Plain Dijkstra finds the cheapest path but ignores the stop-count cap. We need shortest path with at most K+1 edges. Bellman-Ford relaxes edges in rounds — exactly k+1 rounds bound the number of edges in any path we consider.

## Approach
Initialize dist[src]=0, others=infinity. Repeat k+1 times: take a snapshot of dist (so a single round only uses distances from the prior round, preventing more than one edge per round per node), then for every flight (u,v,w) update next[v] = min(next[v], snapshot[u] + w). Replace dist with next. After k+1 rounds, dist[dst] holds the cheapest cost using at most k stops; return -1 if still infinity.

## Walkthrough
n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1 (so 2 edges).
Round 1 from [0,inf,inf,inf]: relax (0,1,100) -> 100 at node 1. Others stay infinity.
Round 2 from [0,100,inf,inf]: (1,2,100) -> 200 at node 2; (1,3,600) -> 600 at node 3.
After 2 rounds dist[3] = 600... but 700 via 0->1->3 with one stop also valid. Trace shows correct = 700 because (2,3) needs node 2 with finite dist which only happens in round 2 simultaneously. Final dist[3] = 700 from the 1->3 relaxation, since we run k+1 = 2 rounds and the (1,3) edge fires in round 2.

## Complexity
Time O((k+1) * E). Space O(n) for distance arrays.`,
    py: sol(
      `class Solution:\n    def findCheapestPrice(self, n, flights, src, dst, k):\n        INF = float('inf')\n        dist = [INF] * n\n        dist[src] = 0\n        for _ in range(k + 1):\n            nxt = dist[:]\n            for u, v, w in flights:\n                if dist[u] + w < nxt[v]:\n                    nxt[v] = dist[u] + w\n            dist = nxt\n        return -1 if dist[dst] == INF else dist[dst]`,
      'O((k+1)*E) time, O(n) space',
      'Bellman-Ford limited to k+1 edge relaxations using a per-round snapshot.'
    ),
    js: sol(
      `class Solution {\n    findCheapestPrice(n, flights, src, dst, k) {\n        const INF = Infinity;\n        let dist = new Array(n).fill(INF);\n        dist[src] = 0;\n        for (let i = 0; i <= k; i++) {\n            const next = dist.slice();\n            for (const [u, v, w] of flights) {\n                if (dist[u] + w < next[v]) next[v] = dist[u] + w;\n            }\n            dist = next;\n        }\n        return dist[dst] === INF ? -1 : dist[dst];\n    }\n}`,
      'O((k+1)*E) time, O(n) space',
      'Snapshot each round so an edge cannot be used twice in one round.'
    ),
    jv: sol(
      `class Solution {\n    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {\n        int INF = Integer.MAX_VALUE;\n        int[] dist = new int[n];\n        java.util.Arrays.fill(dist, INF);\n        dist[src] = 0;\n        for (int i = 0; i <= k; i++) {\n            int[] next = dist.clone();\n            for (int[] f : flights) {\n                if (dist[f[0]] != INF && dist[f[0]] + f[2] < next[f[1]]) {\n                    next[f[1]] = dist[f[0]] + f[2];\n                }\n            }\n            dist = next;\n        }\n        return dist[dst] == INF ? -1 : dist[dst];\n    }\n}`,
      'O((k+1)*E) time, O(n) space',
      'k+1 rounds of Bellman-Ford with a snapshot.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {\n        const int INF = INT_MAX;\n        vector<int> dist(n, INF);\n        dist[src] = 0;\n        for (int i = 0; i <= k; i++) {\n            vector<int> next = dist;\n            for (auto& f : flights) {\n                if (dist[f[0]] != INF && dist[f[0]] + f[2] < next[f[1]]) {\n                    next[f[1]] = dist[f[0]] + f[2];\n                }\n            }\n            dist = next;\n        }\n        return dist[dst] == INF ? -1 : dist[dst];\n    }\n};`,
      'O((k+1)*E) time, O(n) space',
      'Bellman-Ford bounded by k+1 edge usages.'
    ),
  },

  'climbing-stairs': {
    editorial: `## Intuition
To reach step n you either took a single step from n-1 or a double step from n-2. So ways(n) = ways(n-1) + ways(n-2) — the Fibonacci recurrence with base cases ways(1)=1, ways(2)=2.

## Approach
Avoid recursion (exponential) or memoization (O(n) space). Track only the last two values: a = ways(n-2), b = ways(n-1). Iterate n-2 times computing c = a + b, then shift. Return b at the end (for n=1 return 1 directly).

## Walkthrough
n=5: a=1, b=2.
- c=3, a=2, b=3.
- c=5, a=3, b=5.
- c=8, a=5, b=8.
Return 8. Matches the manual enumeration: 1+1+1+1+1, 2+1+1+1, 1+2+1+1, 1+1+2+1, 1+1+1+2, 2+2+1, 2+1+2, 1+2+2 = 8 ways.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def climbStairs(self, n):\n        if n <= 2:\n            return n\n        a, b = 1, 2\n        for _ in range(n - 2):\n            a, b = b, a + b\n        return b`,
      'O(n) time, O(1) space',
      'Iterative Fibonacci with two rolling variables.'
    ),
    js: sol(
      `class Solution {\n    climbStairs(n) {\n        if (n <= 2) return n;\n        let a = 1, b = 2;\n        for (let i = 0; i < n - 2; i++) { const c = a + b; a = b; b = c; }\n        return b;\n    }\n}`,
      'O(n) time, O(1) space',
      'Roll two variables across n-2 steps.'
    ),
    jv: sol(
      `class Solution {\n    public int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 0; i < n - 2; i++) { int c = a + b; a = b; b = c; }\n        return b;\n    }\n}`,
      'O(n) time, O(1) space',
      'Two rolling variables.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int climbStairs(int n) {\n        if (n <= 2) return n;\n        int a = 1, b = 2;\n        for (int i = 0; i < n - 2; i++) { int c = a + b; a = b; b = c; }\n        return b;\n    }\n};`,
      'O(n) time, O(1) space',
      'Constant-space Fibonacci.'
    ),
  },

  'clone-graph': {
    editorial: `## Intuition
A deep copy must (1) produce a new node for every original node and (2) preserve every edge while never visiting the same node twice. A hash map from original to clone solves both: on first encounter we create the clone; on later encounters we look it up.

## Approach
DFS from the entry node. Maintain a dict cloned mapping original-node -> clone-node. For node u: if it is already in cloned, return cloned[u]. Otherwise create a fresh node with the same val, store it in cloned BEFORE recursing (so cycles terminate), then recurse on each neighbor and append the returned clone to the new node's neighbors list. Return the entry clone. BFS works identically with a queue.

## Walkthrough
adjList = [[2,4],[1,3],[2,4],[1,3]] (4 nodes in a square). Start at 1. Create clone-1, recurse on 2. Create clone-2, recurse on 1 — already cloned, return clone-1 and append to clone-2's neighbors. Recurse on 3. Create clone-3, recurse on 2 (cached), recurse on 4. Create clone-4, recurse on 1 (cached) and 3 (cached). Unwind, building clone-1's neighbor list [clone-2, clone-4]. Return clone-1.

## Complexity
Time O(V + E) — each node and edge handled once. Space O(V) for the map plus recursion.`,
    py: sol(
      `class Solution:\n    def cloneGraph(self, node):\n        if not node:\n            return None\n        cloned = {}\n        def dfs(u):\n            if u in cloned:\n                return cloned[u]\n            copy = Node(u.val)\n            cloned[u] = copy\n            for nei in u.neighbors:\n                copy.neighbors.append(dfs(nei))\n            return copy\n        return dfs(node)`,
      'O(V+E) time, O(V) space',
      'DFS keyed by original node identity; insert the clone before recursing to handle cycles.'
    ),
    js: sol(
      `class Solution {\n    cloneGraph(node) {\n        if (!node) return null;\n        const cloned = new Map();\n        const dfs = (u) => {\n            if (cloned.has(u)) return cloned.get(u);\n            const copy = new Node(u.val);\n            cloned.set(u, copy);\n            for (const nei of u.neighbors) copy.neighbors.push(dfs(nei));\n            return copy;\n        };\n        return dfs(node);\n    }\n}`,
      'O(V+E) time, O(V) space',
      'Map from original to clone, depth-first traversal.'
    ),
    jv: sol(
      `class Solution {\n    private java.util.Map<Node, Node> cloned = new java.util.HashMap<>();\n    public Node cloneGraph(Node node) {\n        if (node == null) return null;\n        if (cloned.containsKey(node)) return cloned.get(node);\n        Node copy = new Node(node.val);\n        cloned.put(node, copy);\n        for (Node nei : node.neighbors) copy.neighbors.add(cloneGraph(nei));\n        return copy;\n    }\n}`,
      'O(V+E) time, O(V) space',
      'Recursive DFS with a HashMap keyed by reference.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    unordered_map<Node*, Node*> cloned;\n    Node* cloneGraph(Node* node) {\n        if (!node) return nullptr;\n        if (cloned.count(node)) return cloned[node];\n        Node* copy = new Node(node->val);\n        cloned[node] = copy;\n        for (Node* nei : node->neighbors) copy->neighbors.push_back(cloneGraph(nei));\n        return copy;\n    }\n};`,
      'O(V+E) time, O(V) space',
      'Recursive DFS with a hash map.'
    ),
  },

  'coin-change': {
    editorial: `## Intuition
We want the fewest coins summing to amount. For each sub-amount a in [0..amount], the optimal count is 1 + min over coins c of dp[a-c]. This is a classic unbounded knapsack: each coin can be reused, so we iterate amounts outer and coins inner.

## Approach
Create dp of size amount+1 filled with sentinel infinity, set dp[0] = 0 (zero coins make 0). For each a from 1 to amount, for each coin c <= a, if dp[a-c] + 1 < dp[a], update. Return dp[amount] if finite else -1.

## Walkthrough
coins=[1,2,5], amount=11. dp[0]=0.
- dp[1] = 1 (coin 1).
- dp[2] = 1 (coin 2).
- dp[3] = dp[1]+1 = 2 or dp[2]+1 = 2 -> 2.
- dp[4] = 2.
- dp[5] = 1.
- dp[6] = 2. ... dp[10] = 2 (5+5). dp[11] = dp[10]+1 = 3.

## Complexity
Time O(amount * len(coins)). Space O(amount).`,
    py: sol(
      `class Solution:\n    def coinChange(self, coins, amount):\n        INF = amount + 1\n        dp = [INF] * (amount + 1)\n        dp[0] = 0\n        for a in range(1, amount + 1):\n            for c in coins:\n                if c <= a and dp[a - c] + 1 < dp[a]:\n                    dp[a] = dp[a - c] + 1\n        return dp[amount] if dp[amount] != INF else -1`,
      'O(amount * len(coins)) time, O(amount) space',
      'Unbounded knapsack DP over sub-amounts.'
    ),
    js: sol(
      `class Solution {\n    coinChange(coins, amount) {\n        const INF = amount + 1;\n        const dp = new Array(amount + 1).fill(INF);\n        dp[0] = 0;\n        for (let a = 1; a <= amount; a++) {\n            for (const c of coins) {\n                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n            }\n        }\n        return dp[amount] === INF ? -1 : dp[amount];\n    }\n}`,
      'O(amount * len(coins)) time, O(amount) space',
      'Bottom-up DP.'
    ),
    jv: sol(
      `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        int INF = amount + 1;\n        int[] dp = new int[amount + 1];\n        java.util.Arrays.fill(dp, INF);\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++) {\n            for (int c : coins) {\n                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n            }\n        }\n        return dp[amount] == INF ? -1 : dp[amount];\n    }\n}`,
      'O(amount * len(coins)) time, O(amount) space',
      'Bottom-up DP.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        int INF = amount + 1;\n        vector<int> dp(amount + 1, INF);\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++) {\n            for (int c : coins) {\n                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;\n            }\n        }\n        return dp[amount] == INF ? -1 : dp[amount];\n    }\n};`,
      'O(amount * len(coins)) time, O(amount) space',
      'Bottom-up DP.'
    ),
  },

  'combination-sum': {
    editorial: `## Intuition
This is unbounded combinations: any candidate can be reused, but we want unique combinations (order does not matter). To avoid duplicates like [2,2,3] and [2,3,2], fix a left-to-right index — never pick a candidate earlier than the previous pick.

## Approach
Sort candidates (optional but enables early pruning). DFS with state (index, remaining, current). Base cases: remaining == 0 -> append a copy of current; remaining < 0 -> backtrack. Otherwise for i in [index..n-1], if candidates[i] > remaining break (sorted prune), else push candidates[i], recurse with same i (reuse allowed), pop.

## Walkthrough
candidates=[2,3,6,7], target=7. Start (0,7,[]).
- Pick 2: (0,5,[2]) -> (0,3,[2,2]) -> (0,1,[2,2,2]) fails, backtrack. (0,3,[2,2]) -> pick 3: (1,0,[2,2,3]) record.
- Pick 3 at root: (1,4,[3]) -> (1,1,[3,3]) fails. Backtrack.
- Pick 7: (3,0,[7]) record. Result [[2,2,3],[7]].

## Complexity
Time O(N^(target / min_candidate)) in the worst case. Space O(target / min_candidate) recursion depth.`,
    py: sol(
      `class Solution:\n    def combinationSum(self, candidates, target):\n        candidates.sort()\n        res = []\n        def dfs(i, remaining, path):\n            if remaining == 0:\n                res.append(path[:])\n                return\n            for j in range(i, len(candidates)):\n                c = candidates[j]\n                if c > remaining:\n                    break\n                path.append(c)\n                dfs(j, remaining - c, path)\n                path.pop()\n        dfs(0, target, [])\n        return res`,
      'O(N^(target/min)) time, O(target/min) space',
      'Backtracking with a non-decreasing index to avoid permutation duplicates.'
    ),
    js: sol(
      `class Solution {\n    combinationSum(candidates, target) {\n        candidates.sort((a, b) => a - b);\n        const res = [];\n        const dfs = (i, remaining, path) => {\n            if (remaining === 0) { res.push(path.slice()); return; }\n            for (let j = i; j < candidates.length; j++) {\n                const c = candidates[j];\n                if (c > remaining) break;\n                path.push(c);\n                dfs(j, remaining - c, path);\n                path.pop();\n            }\n        };\n        dfs(0, target, []);\n        return res;\n    }\n}`,
      'O(N^(target/min)) time, O(target/min) space',
      'DFS with reuse allowed (same j passed down).'
    ),
    jv: sol(
      `class Solution {\n    public java.util.List<java.util.List<Integer>> combinationSum(int[] candidates, int target) {\n        java.util.Arrays.sort(candidates);\n        java.util.List<java.util.List<Integer>> res = new java.util.ArrayList<>();\n        dfs(candidates, 0, target, new java.util.ArrayList<>(), res);\n        return res;\n    }\n    private void dfs(int[] cand, int i, int remaining, java.util.List<Integer> path, java.util.List<java.util.List<Integer>> res) {\n        if (remaining == 0) { res.add(new java.util.ArrayList<>(path)); return; }\n        for (int j = i; j < cand.length; j++) {\n            if (cand[j] > remaining) break;\n            path.add(cand[j]);\n            dfs(cand, j, remaining - cand[j], path, res);\n            path.remove(path.size() - 1);\n        }\n    }\n}`,
      'O(N^(target/min)) time, O(target/min) space',
      'Backtracking with sorted-prune.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        sort(candidates.begin(), candidates.end());\n        vector<vector<int>> res;\n        vector<int> path;\n        dfs(candidates, 0, target, path, res);\n        return res;\n    }\nprivate:\n    void dfs(vector<int>& cand, int i, int remaining, vector<int>& path, vector<vector<int>>& res) {\n        if (remaining == 0) { res.push_back(path); return; }\n        for (int j = i; j < (int)cand.size(); j++) {\n            if (cand[j] > remaining) break;\n            path.push_back(cand[j]);\n            dfs(cand, j, remaining - cand[j], path, res);\n            path.pop_back();\n        }\n    }\n};`,
      'O(N^(target/min)) time, O(target/min) space',
      'Backtracking with sorted-prune.'
    ),
  },

  'container-most-water': {
    editorial: `## Intuition
Area between two lines is min(height[i], height[j]) * (j - i). With two pointers at the ends, the width is maximised. To improve area, move the pointer at the shorter line inward — moving the taller one cannot help (height capped by the still-shorter one and width strictly decreases).

## Approach
Set l=0, r=n-1, best=0. While l<r, compute area = (r-l) * min(h[l], h[r]) and update best. Move the pointer at the shorter side: if h[l] < h[r], l++; else r--. Continue until pointers meet.

## Walkthrough
height=[1,8,6,2,5,4,8,3,7]. l=0,r=8: area=8*min(1,7)=8, move l. l=1: 7*min(8,7)=49, move r. r=7: 6*min(8,3)=18, move r. r=6: 5*min(8,8)=40, move either, say l. l=2: 4*min(6,8)=24, move l. l=3: 3*min(2,8)=6, move l. l=4: 2*min(5,8)=10, move l. l=5: 1*min(4,8)=4, move l. l=6 = r, stop. Best 49.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def maxArea(self, height):\n        l, r = 0, len(height) - 1\n        best = 0\n        while l < r:\n            h = min(height[l], height[r])\n            area = h * (r - l)\n            if area > best:\n                best = area\n            if height[l] < height[r]:\n                l += 1\n            else:\n                r -= 1\n        return best`,
      'O(n) time, O(1) space',
      'Two pointers; always move the shorter side inward.'
    ),
    js: sol(
      `class Solution {\n    maxArea(height) {\n        let l = 0, r = height.length - 1, best = 0;\n        while (l < r) {\n            const h = Math.min(height[l], height[r]);\n            const area = h * (r - l);\n            if (area > best) best = area;\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return best;\n    }\n}`,
      'O(n) time, O(1) space',
      'Move the shorter pointer inward each step.'
    ),
    jv: sol(
      `class Solution {\n    public int maxArea(int[] height) {\n        int l = 0, r = height.length - 1, best = 0;\n        while (l < r) {\n            int h = Math.min(height[l], height[r]);\n            int area = h * (r - l);\n            if (area > best) best = area;\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return best;\n    }\n}`,
      'O(n) time, O(1) space',
      'Two pointers, shrink toward middle.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int l = 0, r = (int)height.size() - 1, best = 0;\n        while (l < r) {\n            int h = min(height[l], height[r]);\n            int area = h * (r - l);\n            if (area > best) best = area;\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return best;\n    }\n};`,
      'O(n) time, O(1) space',
      'Two pointers from both ends inward.'
    ),
  },

  'contains-duplicate': {
    editorial: `## Intuition
A duplicate exists iff some value repeats. Brute force O(n^2). Sorting gives O(n log n). The fastest practical solution is a hash set: insert each element and report duplicate the moment an insert collides.

## Approach
Iterate the array. Maintain a hash set seen. For each x: if x is in seen, return true. Else add x. After the loop, return false. Early exit gives near-constant time on dense duplicates and O(n) worst case.

## Walkthrough
nums=[1,2,3,1]. seen={}. Insert 1 -> {1}. Insert 2 -> {1,2}. Insert 3 -> {1,2,3}. Check 1 -> hit, return true.
nums=[1,2,3,4]. After full pass seen={1,2,3,4}, return false.

## Complexity
Time O(n) average. Space O(n) for the set.`,
    py: sol(
      `class Solution:\n    def containsDuplicate(self, nums):\n        seen = set()\n        for x in nums:\n            if x in seen:\n                return True\n            seen.add(x)\n        return False`,
      'O(n) time, O(n) space',
      'Linear scan with a hash set; early-exit on first collision.'
    ),
    js: sol(
      `class Solution {\n    containsDuplicate(nums) {\n        const seen = new Set();\n        for (const x of nums) {\n            if (seen.has(x)) return true;\n            seen.add(x);\n        }\n        return false;\n    }\n}`,
      'O(n) time, O(n) space',
      'Hash set with early exit.'
    ),
    jv: sol(
      `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        java.util.Set<Integer> seen = new java.util.HashSet<>();\n        for (int x : nums) {\n            if (!seen.add(x)) return true;\n        }\n        return false;\n    }\n}`,
      'O(n) time, O(n) space',
      'HashSet.add returns false on duplicate.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        unordered_set<int> seen;\n        for (int x : nums) {\n            if (!seen.insert(x).second) return true;\n        }\n        return false;\n    }\n};`,
      'O(n) time, O(n) space',
      'unordered_set::insert reports collisions via the returned pair.'
    ),
  },

  'counting-bits': {
    editorial: `## Intuition
We want popcount for every i in [0..n]. Computing each from scratch is O(n log n) total. Observation: i and i >> 1 differ by exactly one bit — the low bit of i. So popcount(i) = popcount(i >> 1) + (i & 1). This lets us fill the array in O(n) using only previously computed values.

## Approach
Allocate dp of size n+1. dp[0] = 0. For i in 1..n, dp[i] = dp[i >> 1] + (i & 1). Return dp.

## Walkthrough
n=5.
- dp[0] = 0.
- dp[1] = dp[0] + 1 = 1.
- dp[2] = dp[1] + 0 = 1.
- dp[3] = dp[1] + 1 = 2.
- dp[4] = dp[2] + 0 = 1.
- dp[5] = dp[2] + 1 = 2.
Result [0,1,1,2,1,2].

## Complexity
Time O(n). Space O(n) for the output. No auxiliary structures.`,
    py: sol(
      `class Solution:\n    def countBits(self, n):\n        dp = [0] * (n + 1)\n        for i in range(1, n + 1):\n            dp[i] = dp[i >> 1] + (i & 1)\n        return dp`,
      'O(n) time, O(n) space',
      'DP using the popcount(i) = popcount(i>>1) + (i & 1) recurrence.'
    ),
    js: sol(
      `class Solution {\n    countBits(n) {\n        const dp = new Array(n + 1).fill(0);\n        for (let i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);\n        return dp;\n    }\n}`,
      'O(n) time, O(n) space',
      'Linear DP on bit shifts.'
    ),
    jv: sol(
      `class Solution {\n    public int[] countBits(int n) {\n        int[] dp = new int[n + 1];\n        for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);\n        return dp;\n    }\n}`,
      'O(n) time, O(n) space',
      'DP using right-shift recurrence.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<int> countBits(int n) {\n        vector<int> dp(n + 1, 0);\n        for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);\n        return dp;\n    }\n};`,
      'O(n) time, O(n) space',
      'DP on right-shift.'
    ),
  },

  'course-schedule': {
    editorial: `## Intuition
A prerequisite list defines a directed graph: edge a -> b means "you must finish b before a". The schedule is feasible iff this graph has no cycle. So the question is "does the directed graph have a cycle?".

## Approach
Kahn's BFS topological sort: build an adjacency list and an in-degree counter. Push every node with in-degree 0 into a queue. Repeatedly pop a node, decrement the in-degree of each successor, enqueue successors whose in-degree drops to 0. Count processed nodes. If the count equals numCourses, the graph was acyclic and feasible; otherwise some nodes never reached in-degree 0 — a cycle exists.

## Walkthrough
numCourses=2, prerequisites=[[1,0]]. Edge 0 -> 1. in_deg=[0,1]. Queue starts with [0]. Pop 0, decrement in_deg[1] to 0, enqueue 1. Pop 1. Processed = 2 = numCourses. Return true.
With prerequisites=[[1,0],[0,1]] (cycle): in_deg=[1,1]. Queue empty. Processed 0 != 2. Return false.

## Complexity
Time O(V + E). Space O(V + E).`,
    py: sol(
      `class Solution:\n    def canFinish(self, numCourses, prerequisites):\n        from collections import deque\n        graph = [[] for _ in range(numCourses)]\n        in_deg = [0] * numCourses\n        for a, b in prerequisites:\n            graph[b].append(a)\n            in_deg[a] += 1\n        q = deque(i for i in range(numCourses) if in_deg[i] == 0)\n        seen = 0\n        while q:\n            u = q.popleft()\n            seen += 1\n            for v in graph[u]:\n                in_deg[v] -= 1\n                if in_deg[v] == 0:\n                    q.append(v)\n        return seen == numCourses`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS topological sort detects cycles by counting reachable nodes."
    ),
    js: sol(
      `class Solution {\n    canFinish(numCourses, prerequisites) {\n        const graph = Array.from({length: numCourses}, () => []);\n        const inDeg = new Array(numCourses).fill(0);\n        for (const [a, b] of prerequisites) { graph[b].push(a); inDeg[a]++; }\n        const q = [];\n        for (let i = 0; i < numCourses; i++) if (inDeg[i] === 0) q.push(i);\n        let seen = 0;\n        while (q.length) {\n            const u = q.shift();\n            seen++;\n            for (const v of graph[u]) {\n                if (--inDeg[v] === 0) q.push(v);\n            }\n        }\n        return seen === numCourses;\n    }\n}`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS; cycle iff processed count < numCourses."
    ),
    jv: sol(
      `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        java.util.List<java.util.List<Integer>> graph = new java.util.ArrayList<>();\n        for (int i = 0; i < numCourses; i++) graph.add(new java.util.ArrayList<>());\n        int[] inDeg = new int[numCourses];\n        for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); inDeg[p[0]]++; }\n        java.util.Deque<Integer> q = new java.util.ArrayDeque<>();\n        for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.offer(i);\n        int seen = 0;\n        while (!q.isEmpty()) {\n            int u = q.poll();\n            seen++;\n            for (int v : graph.get(u)) {\n                if (--inDeg[v] == 0) q.offer(v);\n            }\n        }\n        return seen == numCourses;\n    }\n}`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS in-degree topological sort."
    ),
    cp: sol(
      `class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        vector<vector<int>> graph(numCourses);\n        vector<int> inDeg(numCourses, 0);\n        for (auto& p : prerequisites) { graph[p[1]].push_back(p[0]); inDeg[p[0]]++; }\n        queue<int> q;\n        for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.push(i);\n        int seen = 0;\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            seen++;\n            for (int v : graph[u]) if (--inDeg[v] == 0) q.push(v);\n        }\n        return seen == numCourses;\n    }\n};`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS topological sort."
    ),
  },

  'course-schedule-ii': {
    editorial: `## Intuition
Same graph as Course Schedule I, but instead of yes/no we need an order — a topological sort. Kahn's algorithm directly emits one when the graph is acyclic, and emits a short list (less than n) when a cycle exists.

## Approach
Build adjacency and in-degree from prerequisites where edge b -> a means "b is prerequisite for a". Push all in-degree-0 nodes to a queue. Repeatedly pop u, append u to the order, and for each neighbor v, decrement inDeg[v]; when it hits 0 enqueue v. After processing, return the order if its length equals numCourses, else return [].

## Walkthrough
numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]. Edges 0->1, 0->2, 1->3, 2->3. inDeg=[0,1,1,2]. Queue [0]. Pop 0, order=[0]; decrement 1 and 2, both reach 0, enqueue. Pop 1, order=[0,1]; decrement 3 to 1. Pop 2, order=[0,1,2]; decrement 3 to 0, enqueue. Pop 3, order=[0,1,2,3]. Length 4 == numCourses. Return [0,1,2,3].

## Complexity
Time O(V + E). Space O(V + E).`,
    py: sol(
      `class Solution:\n    def findOrder(self, numCourses, prerequisites):\n        from collections import deque\n        graph = [[] for _ in range(numCourses)]\n        in_deg = [0] * numCourses\n        for a, b in prerequisites:\n            graph[b].append(a)\n            in_deg[a] += 1\n        q = deque(i for i in range(numCourses) if in_deg[i] == 0)\n        order = []\n        while q:\n            u = q.popleft()\n            order.append(u)\n            for v in graph[u]:\n                in_deg[v] -= 1\n                if in_deg[v] == 0:\n                    q.append(v)\n        return order if len(order) == numCourses else []`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS emits a valid topological order; empty list on cycle."
    ),
    js: sol(
      `class Solution {\n    findOrder(numCourses, prerequisites) {\n        const graph = Array.from({length: numCourses}, () => []);\n        const inDeg = new Array(numCourses).fill(0);\n        for (const [a, b] of prerequisites) { graph[b].push(a); inDeg[a]++; }\n        const q = [];\n        for (let i = 0; i < numCourses; i++) if (inDeg[i] === 0) q.push(i);\n        const order = [];\n        while (q.length) {\n            const u = q.shift();\n            order.push(u);\n            for (const v of graph[u]) if (--inDeg[v] === 0) q.push(v);\n        }\n        return order.length === numCourses ? order : [];\n    }\n}`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS topological sort."
    ),
    jv: sol(
      `class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        java.util.List<java.util.List<Integer>> graph = new java.util.ArrayList<>();\n        for (int i = 0; i < numCourses; i++) graph.add(new java.util.ArrayList<>());\n        int[] inDeg = new int[numCourses];\n        for (int[] p : prerequisites) { graph.get(p[1]).add(p[0]); inDeg[p[0]]++; }\n        java.util.Deque<Integer> q = new java.util.ArrayDeque<>();\n        for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.offer(i);\n        int[] order = new int[numCourses];\n        int idx = 0;\n        while (!q.isEmpty()) {\n            int u = q.poll();\n            order[idx++] = u;\n            for (int v : graph.get(u)) if (--inDeg[v] == 0) q.offer(v);\n        }\n        return idx == numCourses ? order : new int[0];\n    }\n}`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS yields the topological order."
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        vector<vector<int>> graph(numCourses);\n        vector<int> inDeg(numCourses, 0);\n        for (auto& p : prerequisites) { graph[p[1]].push_back(p[0]); inDeg[p[0]]++; }\n        queue<int> q;\n        for (int i = 0; i < numCourses; i++) if (inDeg[i] == 0) q.push(i);\n        vector<int> order;\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            order.push_back(u);\n            for (int v : graph[u]) if (--inDeg[v] == 0) q.push(v);\n        }\n        return (int)order.size() == numCourses ? order : vector<int>{};\n    }\n};`,
      'O(V+E) time, O(V+E) space',
      "Kahn's BFS topological sort."
    ),
  },

  'daily-temperatures': {
    editorial: `## Intuition
For each day we want the wait until a warmer day. A naive O(n^2) scan looks ahead for each i. A monotonic decreasing stack of indices solves this in O(n): we keep indices whose answer is still unknown; the next strictly larger temperature resolves them.

## Approach
Initialize answer array of zeros. Walk i from 0 to n-1. While the stack is non-empty AND temperatures[stack.top()] < temperatures[i], pop j and set answer[j] = i - j (the wait). Push i. Indices left on the stack at the end have no future warmer day and remain 0.

## Walkthrough
temperatures=[73,74,75,71,69,72,76,73]. Stack starts empty.
- i=0(73): stack=[0].
- i=1(74): 73<74 pop 0, answer[0]=1. Push 1. stack=[1].
- i=2(75): 74<75 pop 1, answer[1]=1. Push 2. stack=[2].
- i=3(71): 75>=71, push. stack=[2,3].
- i=4(69): push. stack=[2,3,4].
- i=5(72): 69<72 pop 4 answer[4]=1; 71<72 pop 3 answer[3]=2. Push 5. stack=[2,5].
- i=6(76): 72<76 pop 5 answer[5]=1; 75<76 pop 2 answer[2]=4. Push 6.
- i=7(73): push. Leftover [6,7] -> answers stay 0.
Result [1,1,4,2,1,1,0,0].

## Complexity
Time O(n) — each index pushed and popped at most once. Space O(n) stack.`,
    py: sol(
      `class Solution:\n    def dailyTemperatures(self, temperatures):\n        n = len(temperatures)\n        answer = [0] * n\n        stack = []\n        for i, t in enumerate(temperatures):\n            while stack and temperatures[stack[-1]] < t:\n                j = stack.pop()\n                answer[j] = i - j\n            stack.append(i)\n        return answer`,
      'O(n) time, O(n) space',
      'Monotonic decreasing stack of indices.'
    ),
    js: sol(
      `class Solution {\n    dailyTemperatures(temperatures) {\n        const n = temperatures.length;\n        const answer = new Array(n).fill(0);\n        const stack = [];\n        for (let i = 0; i < n; i++) {\n            while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) {\n                const j = stack.pop();\n                answer[j] = i - j;\n            }\n            stack.push(i);\n        }\n        return answer;\n    }\n}`,
      'O(n) time, O(n) space',
      'Stack of indices in decreasing-temperature order.'
    ),
    jv: sol(
      `class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        int n = temperatures.length;\n        int[] answer = new int[n];\n        java.util.Deque<Integer> stack = new java.util.ArrayDeque<>();\n        for (int i = 0; i < n; i++) {\n            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {\n                int j = stack.pop();\n                answer[j] = i - j;\n            }\n            stack.push(i);\n        }\n        return answer;\n    }\n}`,
      'O(n) time, O(n) space',
      'Monotonic stack of unresolved-day indices.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        int n = temperatures.size();\n        vector<int> answer(n, 0);\n        stack<int> st;\n        for (int i = 0; i < n; i++) {\n            while (!st.empty() && temperatures[st.top()] < temperatures[i]) {\n                int j = st.top(); st.pop();\n                answer[j] = i - j;\n            }\n            st.push(i);\n        }\n        return answer;\n    }\n};`,
      'O(n) time, O(n) space',
      'Monotonic stack.'
    ),
  },

  'decode-ways': {
    editorial: `## Intuition
Each step we either decode one digit (if non-zero) into a letter A..I or two digits (if in 10..26) into a letter J..Z. So the count of decodings of the first i characters equals the count when we decode the last 1 or 2 chars validly: dp[i] = dp[i-1]*(s[i-1] != '0') + dp[i-2]*(10 <= int(s[i-2:i]) <= 26).

## Approach
Track only the last two values: prev2 (ways to decode prefix of length i-2), prev1 (length i-1). Iterate i from 1 to n. cur = 0. If s[i-1] != '0', add prev1. If i >= 2 and 10 <= int(s[i-2:i]) <= 26, add prev2. Shift prev2 = prev1, prev1 = cur. Return prev1.

## Walkthrough
s = "226".
- i=1: '2' OK, cur = prev1(=1). prev2=1, prev1=1.
- i=2: '2' OK -> +prev1=1. Pair "22" in [10,26] -> +prev2=1. cur=2. prev2=1, prev1=2.
- i=3: '6' OK -> +prev1=2. Pair "26" in [10,26] -> +prev2=1. cur=3. Return 3.

s = "06" returns 0 since the first digit '0' has no decoding.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def numDecodings(self, s):\n        if not s or s[0] == '0':\n            return 0\n        n = len(s)\n        prev2, prev1 = 1, 1\n        for i in range(2, n + 1):\n            cur = 0\n            if s[i - 1] != '0':\n                cur += prev1\n            two = int(s[i - 2:i])\n            if 10 <= two <= 26:\n                cur += prev2\n            prev2, prev1 = prev1, cur\n        return prev1`,
      'O(n) time, O(1) space',
      'Roll two DP variables across the string.'
    ),
    js: sol(
      `class Solution {\n    numDecodings(s) {\n        if (!s || s[0] === '0') return 0;\n        const n = s.length;\n        let prev2 = 1, prev1 = 1;\n        for (let i = 2; i <= n; i++) {\n            let cur = 0;\n            if (s[i - 1] !== '0') cur += prev1;\n            const two = parseInt(s.substring(i - 2, i), 10);\n            if (two >= 10 && two <= 26) cur += prev2;\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Constant-space DP.'
    ),
    jv: sol(
      `class Solution {\n    public int numDecodings(String s) {\n        if (s == null || s.isEmpty() || s.charAt(0) == '0') return 0;\n        int n = s.length();\n        int prev2 = 1, prev1 = 1;\n        for (int i = 2; i <= n; i++) {\n            int cur = 0;\n            if (s.charAt(i - 1) != '0') cur += prev1;\n            int two = Integer.parseInt(s.substring(i - 2, i));\n            if (two >= 10 && two <= 26) cur += prev2;\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Two-variable DP.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int numDecodings(string s) {\n        if (s.empty() || s[0] == '0') return 0;\n        int n = s.size();\n        int prev2 = 1, prev1 = 1;\n        for (int i = 2; i <= n; i++) {\n            int cur = 0;\n            if (s[i - 1] != '0') cur += prev1;\n            int two = (s[i - 2] - '0') * 10 + (s[i - 1] - '0');\n            if (two >= 10 && two <= 26) cur += prev2;\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n};`,
      'O(n) time, O(1) space',
      'Two-variable DP.'
    ),
  },

  'design-add-search': {
    editorial: `## Intuition
A Trie supports prefix queries in O(L). To also support wildcards ('.'), the search routine recursively tries every child at a '.' position. The exponential blowup is bounded because real input keeps words short.

## Approach
Each Trie node has up to 26 children and a boolean end. addWord walks/creates child nodes letter by letter, marking the last node end=true. search recursively walks the trie. At a literal char go to that child, returning false if missing. At a '.' recurse into every existing child; return true if any branch succeeds. At end of pattern return node.end.

## Walkthrough
addWord("bad"), addWord("dad"), addWord("mad"). Trie has roots for b/d/m, each leading to 'a' -> 'd' (end).
search("pad"): root has no 'p' child -> false.
search("bad"): root.b.a.d.end -> true.
search(".ad"): for child in root.children (b, d, m), recurse with "ad". Each finds 'a' then 'd' end -> true.
search("b.."): root.b -> recurse with ".." at 'a' node. At first '.': recurse into 'a' (only child); at second '.': recurse into 'd' (only child, end). -> true.

## Complexity
addWord O(L). search O(L) literal, O(26^k * L) worst case with k wildcards. Space O(total letters).`,
    py: sol(
      `class WordDictionary:\n    def __init__(self):\n        self.children = {}\n        self.end = False\n    def addWord(self, word):\n        node = self\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = WordDictionary()\n            node = node.children[ch]\n        node.end = True\n    def search(self, word):\n        def dfs(node, i):\n            if i == len(word):\n                return node.end\n            ch = word[i]\n            if ch == '.':\n                for child in node.children.values():\n                    if dfs(child, i + 1):\n                        return True\n                return False\n            if ch not in node.children:\n                return False\n            return dfs(node.children[ch], i + 1)\n        return dfs(self, 0)`,
      'O(L) add, O(L) literal search, O(26^k * L) wildcard',
      'Trie with recursive DFS for the . wildcard.'
    ),
    js: sol(
      `class WordDictionary {\n    constructor() { this.children = {}; this.end = false; }\n    addWord(word) {\n        let node = this;\n        for (const ch of word) {\n            if (!node.children[ch]) node.children[ch] = new WordDictionary();\n            node = node.children[ch];\n        }\n        node.end = true;\n    }\n    search(word) {\n        const dfs = (node, i) => {\n            if (i === word.length) return node.end;\n            const ch = word[i];\n            if (ch === '.') {\n                for (const child of Object.values(node.children)) {\n                    if (dfs(child, i + 1)) return true;\n                }\n                return false;\n            }\n            if (!node.children[ch]) return false;\n            return dfs(node.children[ch], i + 1);\n        };\n        return dfs(this, 0);\n    }\n}`,
      'O(L) add, O(L) literal search, O(26^k * L) wildcard',
      'Trie with object children; recursive search.'
    ),
    jv: sol(
      `class WordDictionary {\n    private WordDictionary[] children = new WordDictionary[26];\n    private boolean end = false;\n    public WordDictionary() {}\n    public void addWord(String word) {\n        WordDictionary node = this;\n        for (char ch : word.toCharArray()) {\n            int idx = ch - 'a';\n            if (node.children[idx] == null) node.children[idx] = new WordDictionary();\n            node = node.children[idx];\n        }\n        node.end = true;\n    }\n    public boolean search(String word) {\n        return dfs(this, word, 0);\n    }\n    private boolean dfs(WordDictionary node, String word, int i) {\n        if (i == word.length()) return node.end;\n        char ch = word.charAt(i);\n        if (ch == '.') {\n            for (WordDictionary child : node.children) {\n                if (child != null && dfs(child, word, i + 1)) return true;\n            }\n            return false;\n        }\n        int idx = ch - 'a';\n        if (node.children[idx] == null) return false;\n        return dfs(node.children[idx], word, i + 1);\n    }\n}`,
      'O(L) add, O(L) literal search, O(26^k * L) wildcard',
      'Trie with fixed-size 26 child array.'
    ),
    cp: sol(
      `class WordDictionary {\npublic:\n    WordDictionary* children[26] = {nullptr};\n    bool end = false;\n    WordDictionary() {}\n    void addWord(string word) {\n        WordDictionary* node = this;\n        for (char ch : word) {\n            int idx = ch - 'a';\n            if (!node->children[idx]) node->children[idx] = new WordDictionary();\n            node = node->children[idx];\n        }\n        node->end = true;\n    }\n    bool search(string word) { return dfs(this, word, 0); }\nprivate:\n    bool dfs(WordDictionary* node, const string& word, int i) {\n        if (i == (int)word.size()) return node->end;\n        char ch = word[i];\n        if (ch == '.') {\n            for (auto child : node->children) {\n                if (child && dfs(child, word, i + 1)) return true;\n            }\n            return false;\n        }\n        int idx = ch - 'a';\n        if (!node->children[idx]) return false;\n        return dfs(node->children[idx], word, i + 1);\n    }\n};`,
      'O(L) add, O(L) literal search, O(26^k * L) wildcard',
      'Trie with 26-wide child array; DFS handles wildcards.'
    ),
  },

  'edit-distance': {
    editorial: `## Intuition
Define dp[i][j] = the minimum edits to turn word1[:i] into word2[:j]. If the last characters match, no operation is needed at that position: dp[i][j] = dp[i-1][j-1]. If they differ, we are free to pick the cheapest of three single-character edits: insert (dp[i][j-1]), delete (dp[i-1][j]), replace (dp[i-1][j-1]).

## Approach
Allocate a (m+1) x (n+1) dp. Initialize dp[i][0] = i (delete all i chars), dp[0][j] = j (insert all j chars). Fill row by row using the recurrence. Answer is dp[m][n].

## Walkthrough
word1="horse", word2="ros".
- dp[1][1]: 'h' vs 'r' -> 1 + min(dp[0][0],dp[0][1],dp[1][0]) = 1.
- Continue filling: dp[2][1]='o' vs 'r' = 1+min(1,1,1)=2; dp[2][2]='o' vs 'o' = dp[1][1]=1; etc.
- Final dp[5][3] = 3 (replace h->r, delete r, delete e: horse -> rorse -> rose -> ros).

## Complexity
Time O(m*n). Space O(m*n); can be reduced to O(min(m,n)) by keeping only the prior row.`,
    py: sol(
      `class Solution:\n    def minDistance(self, word1, word2):\n        m, n = len(word1), len(word2)\n        dp = [[0] * (n + 1) for _ in range(m + 1)]\n        for i in range(m + 1):\n            dp[i][0] = i\n        for j in range(n + 1):\n            dp[0][j] = j\n        for i in range(1, m + 1):\n            for j in range(1, n + 1):\n                if word1[i - 1] == word2[j - 1]:\n                    dp[i][j] = dp[i - 1][j - 1]\n                else:\n                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n        return dp[m][n]`,
      'O(m*n) time, O(m*n) space',
      '2D DP over prefixes of both strings.'
    ),
    js: sol(
      `class Solution {\n    minDistance(word1, word2) {\n        const m = word1.length, n = word2.length;\n        const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));\n        for (let i = 0; i <= m; i++) dp[i][0] = i;\n        for (let j = 0; j <= n; j++) dp[0][j] = j;\n        for (let i = 1; i <= m; i++) {\n            for (let j = 1; j <= n; j++) {\n                if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];\n                else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);\n            }\n        }\n        return dp[m][n];\n    }\n}`,
      'O(m*n) time, O(m*n) space',
      'Tabular DP.'
    ),
    jv: sol(
      `class Solution {\n    public int minDistance(String word1, String word2) {\n        int m = word1.length(), n = word2.length();\n        int[][] dp = new int[m + 1][n + 1];\n        for (int i = 0; i <= m; i++) dp[i][0] = i;\n        for (int j = 0; j <= n; j++) dp[0][j] = j;\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];\n                else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], Math.min(dp[i - 1][j], dp[i][j - 1]));\n            }\n        }\n        return dp[m][n];\n    }\n}`,
      'O(m*n) time, O(m*n) space',
      'Tabular DP.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        int m = word1.size(), n = word2.size();\n        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));\n        for (int i = 0; i <= m; i++) dp[i][0] = i;\n        for (int j = 0; j <= n; j++) dp[0][j] = j;\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];\n                else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});\n            }\n        }\n        return dp[m][n];\n    }\n};`,
      'O(m*n) time, O(m*n) space',
      'Tabular DP.'
    ),
  },

  'encode-decode-strings': {
    editorial: `## Intuition
We must serialize a list of strings into one string and recover the exact list. Any chosen delimiter could itself appear in the data, so we prefix each string by its length and a sentinel like '#'. The number is unambiguous because it ends at the '#'.

## Approach
Encode: for each s, append str(len(s)) + '#' + s. Decode: scan i from 0; find the next '#' from i, parse the integer length L between them, take the next L characters as one string, append, advance i to L characters past '#'. Repeat until i == n.

## Walkthrough
strs=["hello","world",""] -> "5#hello5#world0#".
Decode: i=0, hash at 1, L=5, take "hello" (chars 2..6), i=7. hash at 8, L=5, take "world", i=14. hash at 15, L=0, take "", i=16. Done. Result ["hello","world",""].

## Complexity
Time O(N) where N is total length. Space O(N).`,
    py: sol(
      `class Solution:\n    def encode(self, strs):\n        return ''.join(f"{len(s)}#{s}" for s in strs)\n    def decode(self, s):\n        res = []\n        i = 0\n        while i < len(s):\n            j = s.index('#', i)\n            L = int(s[i:j])\n            res.append(s[j + 1:j + 1 + L])\n            i = j + 1 + L\n        return res`,
      'O(N) time, O(N) space',
      'Length-prefix framing with a # sentinel.'
    ),
    js: sol(
      `class Solution {\n    encode(strs) {\n        return strs.map(s => s.length + '#' + s).join('');\n    }\n    decode(s) {\n        const res = [];\n        let i = 0;\n        while (i < s.length) {\n            const j = s.indexOf('#', i);\n            const L = parseInt(s.substring(i, j), 10);\n            res.push(s.substring(j + 1, j + 1 + L));\n            i = j + 1 + L;\n        }\n        return res;\n    }\n}`,
      'O(N) time, O(N) space',
      'Length-prefix encoding.'
    ),
    jv: sol(
      `class Solution {\n    public String encode(java.util.List<String> strs) {\n        StringBuilder sb = new StringBuilder();\n        for (String s : strs) sb.append(s.length()).append('#').append(s);\n        return sb.toString();\n    }\n    public java.util.List<String> decode(String s) {\n        java.util.List<String> res = new java.util.ArrayList<>();\n        int i = 0;\n        while (i < s.length()) {\n            int j = s.indexOf('#', i);\n            int L = Integer.parseInt(s.substring(i, j));\n            res.add(s.substring(j + 1, j + 1 + L));\n            i = j + 1 + L;\n        }\n        return res;\n    }\n}`,
      'O(N) time, O(N) space',
      'Length-prefix encoding.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    string encode(vector<string>& strs) {\n        string out;\n        for (auto& s : strs) { out += to_string(s.size()) + "#" + s; }\n        return out;\n    }\n    vector<string> decode(string s) {\n        vector<string> res;\n        int i = 0, n = s.size();\n        while (i < n) {\n            int j = s.find('#', i);\n            int L = stoi(s.substr(i, j - i));\n            res.push_back(s.substr(j + 1, L));\n            i = j + 1 + L;\n        }\n        return res;\n    }\n};`,
      'O(N) time, O(N) space',
      'Length-prefix encoding.'
    ),
  },

  'eval-rpn': {
    editorial: `## Intuition
Reverse Polish Notation puts operators after their operands, exactly matching a stack's LIFO discipline: when we see an operator, the two most recent values are its operands. No parsing precedence, no parentheses.

## Approach
Scan tokens. If a token is a number, push it. Otherwise pop b then a (order matters for - and /), compute a op b, push the result. After processing, the stack holds one value: the answer. For Python's // truncated toward zero on negatives, use int(a / b) (Python's // floors).

## Walkthrough
tokens=["2","1","+","3","*"]. Push 2, push 1. '+' -> pop 1,2, push 3. Push 3. '*' -> pop 3,3, push 9. Result 9.
tokens=["4","13","5","/","+"]. Push 4, 13, 5. '/' -> pop 5,13, push 13/5=2 (truncate). Push... actually wait, we push 2 then '+' pops 2,4, pushes 6. Result 6.

## Complexity
Time O(n). Space O(n) worst case stack.`,
    py: sol(
      `class Solution:\n    def evalRPN(self, tokens):\n        stack = []\n        for tok in tokens:\n            if tok in ('+', '-', '*', '/'):\n                b = stack.pop()\n                a = stack.pop()\n                if tok == '+':\n                    stack.append(a + b)\n                elif tok == '-':\n                    stack.append(a - b)\n                elif tok == '*':\n                    stack.append(a * b)\n                else:\n                    stack.append(int(a / b))\n            else:\n                stack.append(int(tok))\n        return stack[0]`,
      'O(n) time, O(n) space',
      'Stack evaluation; int(a/b) truncates toward zero like the LC spec.'
    ),
    js: sol(
      `class Solution {\n    evalRPN(tokens) {\n        const stack = [];\n        for (const tok of tokens) {\n            if (tok === '+' || tok === '-' || tok === '*' || tok === '/') {\n                const b = stack.pop();\n                const a = stack.pop();\n                let v;\n                if (tok === '+') v = a + b;\n                else if (tok === '-') v = a - b;\n                else if (tok === '*') v = a * b;\n                else v = Math.trunc(a / b);\n                stack.push(v);\n            } else {\n                stack.push(parseInt(tok, 10));\n            }\n        }\n        return stack[0];\n    }\n}`,
      'O(n) time, O(n) space',
      'Stack evaluation with Math.trunc for division.'
    ),
    jv: sol(
      `class Solution {\n    public int evalRPN(String[] tokens) {\n        java.util.Deque<Integer> stack = new java.util.ArrayDeque<>();\n        for (String tok : tokens) {\n            switch (tok) {\n                case "+": { int b = stack.pop(); int a = stack.pop(); stack.push(a + b); break; }\n                case "-": { int b = stack.pop(); int a = stack.pop(); stack.push(a - b); break; }\n                case "*": { int b = stack.pop(); int a = stack.pop(); stack.push(a * b); break; }\n                case "/": { int b = stack.pop(); int a = stack.pop(); stack.push(a / b); break; }\n                default: stack.push(Integer.parseInt(tok));\n            }\n        }\n        return stack.pop();\n    }\n}`,
      'O(n) time, O(n) space',
      'Stack evaluation; Java int division already truncates toward zero.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int evalRPN(vector<string>& tokens) {\n        stack<int> st;\n        for (auto& tok : tokens) {\n            if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {\n                int b = st.top(); st.pop();\n                int a = st.top(); st.pop();\n                if (tok == "+") st.push(a + b);\n                else if (tok == "-") st.push(a - b);\n                else if (tok == "*") st.push(a * b);\n                else st.push(a / b);\n            } else {\n                st.push(stoi(tok));\n            }\n        }\n        return st.top();\n    }\n};`,
      'O(n) time, O(n) space',
      'Stack evaluation; C++ int division truncates toward zero.'
    ),
  },

  'find-min-rotated': {
    editorial: `## Intuition
A rotated sorted array of distinct values has exactly one inflection — the minimum. Binary search exploits the fact that comparing the middle to the right end localises which half contains the minimum.

## Approach
lo=0, hi=n-1. While lo < hi, mid = (lo + hi) / 2. If nums[mid] > nums[hi], the minimum lies strictly right of mid: lo = mid + 1. Else (nums[mid] <= nums[hi]) the minimum is at or left of mid: hi = mid. When the loop ends, lo == hi and points at the minimum.

## Walkthrough
nums=[4,5,6,7,0,1,2]. lo=0,hi=6. mid=3 nums[3]=7 > nums[6]=2 -> lo=4. mid=5 nums[5]=1 < nums[6]=2 -> hi=5. mid=4 nums[4]=0 < nums[5]=1 -> hi=4. lo==hi==4. Return nums[4]=0.
nums=[3,1,2]. lo=0,hi=2. mid=1 nums[1]=1 < nums[2]=2 -> hi=1. mid=0 nums[0]=3 > nums[1]=1 -> lo=1. Done. Return 1.

## Complexity
Time O(log n). Space O(1).`,
    py: sol(
      `class Solution:\n    def findMin(self, nums):\n        lo, hi = 0, len(nums) - 1\n        while lo < hi:\n            mid = (lo + hi) // 2\n            if nums[mid] > nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid\n        return nums[lo]`,
      'O(log n) time, O(1) space',
      'Binary search on the inflection point; compare mid against right end.'
    ),
    js: sol(
      `class Solution {\n    findMin(nums) {\n        let lo = 0, hi = nums.length - 1;\n        while (lo < hi) {\n            const mid = (lo + hi) >> 1;\n            if (nums[mid] > nums[hi]) lo = mid + 1;\n            else hi = mid;\n        }\n        return nums[lo];\n    }\n}`,
      'O(log n) time, O(1) space',
      'Half-open binary search.'
    ),
    jv: sol(
      `class Solution {\n    public int findMin(int[] nums) {\n        int lo = 0, hi = nums.length - 1;\n        while (lo < hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] > nums[hi]) lo = mid + 1;\n            else hi = mid;\n        }\n        return nums[lo];\n    }\n}`,
      'O(log n) time, O(1) space',
      'Half-open binary search.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        int lo = 0, hi = (int)nums.size() - 1;\n        while (lo < hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] > nums[hi]) lo = mid + 1;\n            else hi = mid;\n        }\n        return nums[lo];\n    }\n};`,
      'O(log n) time, O(1) space',
      'Half-open binary search.'
    ),
  },

  'gas-station': {
    editorial: `## Intuition
If the total gas is at least the total cost, a unique starting station exists. The greedy argument: when the running tank dips below zero at station i, no station between the previous start and i can be a valid start either (each would dip even sooner). So skip past i+1.

## Approach
Compute total = sum(gas) - sum(cost). If total < 0, return -1. Otherwise sweep i from 0 to n-1 tracking tank = sum of (gas[i] - cost[i]). When tank goes negative, set start = i + 1 and reset tank to 0. Return start.

## Walkthrough
gas=[1,2,3,4,5], cost=[3,4,5,1,2]. Diffs [-2,-2,-2,3,3]. Total=0 >= 0.
- i=0 tank=-2 <0 -> start=1, tank=0.
- i=1 tank=-2 <0 -> start=2, tank=0.
- i=2 tank=-2 <0 -> start=3, tank=0.
- i=3 tank=3.
- i=4 tank=6.
Return 3. Verify: from 3, 4-1=3, +5-2=6, +1-3=4, +2-4=2, +3-5=0. OK.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def canCompleteCircuit(self, gas, cost):\n        total = 0\n        tank = 0\n        start = 0\n        for i in range(len(gas)):\n            diff = gas[i] - cost[i]\n            total += diff\n            tank += diff\n            if tank < 0:\n                start = i + 1\n                tank = 0\n        return start if total >= 0 else -1`,
      'O(n) time, O(1) space',
      'Greedy single pass; reset start when tank goes negative.'
    ),
    js: sol(
      `class Solution {\n    canCompleteCircuit(gas, cost) {\n        let total = 0, tank = 0, start = 0;\n        for (let i = 0; i < gas.length; i++) {\n            const diff = gas[i] - cost[i];\n            total += diff;\n            tank += diff;\n            if (tank < 0) { start = i + 1; tank = 0; }\n        }\n        return total >= 0 ? start : -1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Greedy reset on negative tank.'
    ),
    jv: sol(
      `class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        int total = 0, tank = 0, start = 0;\n        for (int i = 0; i < gas.length; i++) {\n            int diff = gas[i] - cost[i];\n            total += diff;\n            tank += diff;\n            if (tank < 0) { start = i + 1; tank = 0; }\n        }\n        return total >= 0 ? start : -1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Greedy single pass.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n        int total = 0, tank = 0, start = 0;\n        for (int i = 0; i < (int)gas.size(); i++) {\n            int diff = gas[i] - cost[i];\n            total += diff;\n            tank += diff;\n            if (tank < 0) { start = i + 1; tank = 0; }\n        }\n        return total >= 0 ? start : -1;\n    }\n};`,
      'O(n) time, O(1) space',
      'Greedy reset.'
    ),
  },

  'group-anagrams': {
    editorial: `## Intuition
Two words are anagrams iff their character multisets match. A canonical representation of that multiset gives an O(1) hash-map key per word. Two common choices: sorted-string (O(L log L) per word) or a 26-length count tuple (O(L) per word, faster for long strings).

## Approach
Maintain a dict keyed by the canonical form. For each word, compute its 26-length lowercase letter count, convert to a tuple (hashable), append the original word to dict[key]. Return the dict's values.

## Walkthrough
strs=["eat","tea","tan","ate","nat","bat"].
- "eat" -> (1,0,...e,a,t...). Key A. Group=["eat"].
- "tea" -> same key A. Group=["eat","tea"].
- "tan" -> different key B. Group=["tan"].
- "ate" -> key A. Group=["eat","tea","ate"].
- "nat" -> key B. Group=["tan","nat"].
- "bat" -> key C. Group=["bat"].
Return [["eat","tea","ate"],["tan","nat"],["bat"]].

## Complexity
Time O(N*L) where L is average word length. Space O(N*L).`,
    py: sol(
      `class Solution:\n    def groupAnagrams(self, strs):\n        from collections import defaultdict\n        groups = defaultdict(list)\n        for s in strs:\n            count = [0] * 26\n            for ch in s:\n                count[ord(ch) - ord('a')] += 1\n            groups[tuple(count)].append(s)\n        return list(groups.values())`,
      'O(N*L) time, O(N*L) space',
      '26-length count tuple as a canonical anagram key.'
    ),
    js: sol(
      `class Solution {\n    groupAnagrams(strs) {\n        const groups = new Map();\n        for (const s of strs) {\n            const count = new Array(26).fill(0);\n            for (const ch of s) count[ch.charCodeAt(0) - 97]++;\n            const key = count.join(',');\n            if (!groups.has(key)) groups.set(key, []);\n            groups.get(key).push(s);\n        }\n        return Array.from(groups.values());\n    }\n}`,
      'O(N*L) time, O(N*L) space',
      'Use a joined 26-length count vector as the hash key.'
    ),
    jv: sol(
      `class Solution {\n    public java.util.List<java.util.List<String>> groupAnagrams(String[] strs) {\n        java.util.Map<String, java.util.List<String>> groups = new java.util.HashMap<>();\n        for (String s : strs) {\n            int[] count = new int[26];\n            for (char ch : s.toCharArray()) count[ch - 'a']++;\n            StringBuilder sb = new StringBuilder();\n            for (int c : count) { sb.append(c); sb.append(','); }\n            String key = sb.toString();\n            groups.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(s);\n        }\n        return new java.util.ArrayList<>(groups.values());\n    }\n}`,
      'O(N*L) time, O(N*L) space',
      'Count-vector key in a HashMap.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        unordered_map<string, vector<string>> groups;\n        for (auto& s : strs) {\n            string key(26, 0);\n            for (char ch : s) key[ch - 'a']++;\n            groups[key].push_back(s);\n        }\n        vector<vector<string>> res;\n        for (auto& kv : groups) res.push_back(kv.second);\n        return res;\n    }\n};`,
      'O(N*L) time, O(N*L) space',
      'Fixed-length 26 char string as a compact anagram key.'
    ),
  },

  'house-robber': {
    editorial: `## Intuition
Define dp[i] as the maximum money obtainable considering houses 0..i. At house i you either skip it (dp[i-1]) or rob it and add to dp[i-2] (cannot rob i-1). Take the max.

## Approach
Use two rolling variables: prev2 = best up to i-2, prev1 = best up to i-1. Iterate over nums computing cur = max(prev1, prev2 + nums[i]). Then shift. Return prev1.

## Walkthrough
nums=[2,7,9,3,1].
- i=0: prev2=0, prev1=0. cur = max(0, 0+2)=2. prev2=0, prev1=2.
- i=1: cur = max(2, 0+7)=7. prev2=2, prev1=7.
- i=2: cur = max(7, 2+9)=11. prev2=7, prev1=11.
- i=3: cur = max(11, 7+3)=11. prev2=11, prev1=11.
- i=4: cur = max(11, 11+1)=12. Return 12.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def rob(self, nums):\n        prev2, prev1 = 0, 0\n        for x in nums:\n            cur = max(prev1, prev2 + x)\n            prev2, prev1 = prev1, cur\n        return prev1`,
      'O(n) time, O(1) space',
      'Two-variable rolling DP.'
    ),
    js: sol(
      `class Solution {\n    rob(nums) {\n        let prev2 = 0, prev1 = 0;\n        for (const x of nums) {\n            const cur = Math.max(prev1, prev2 + x);\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Rolling DP.'
    ),
    jv: sol(
      `class Solution {\n    public int rob(int[] nums) {\n        int prev2 = 0, prev1 = 0;\n        for (int x : nums) {\n            int cur = Math.max(prev1, prev2 + x);\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Rolling DP.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        int prev2 = 0, prev1 = 0;\n        for (int x : nums) {\n            int cur = max(prev1, prev2 + x);\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n};`,
      'O(n) time, O(1) space',
      'Rolling DP.'
    ),
  },

  'house-robber-ii': {
    editorial: `## Intuition
Houses are now arranged in a circle, so house 0 and house n-1 are adjacent. A robbery plan that includes both is illegal. So the answer is the max of two linear sub-problems: rob houses [0..n-2] (excluding the last), or rob houses [1..n-1] (excluding the first).

## Approach
Define a helper robLinear(a,b) that solves House Robber I on nums[a..b] using two rolling variables. Edge cases: if n == 0 return 0; if n == 1 return nums[0]. Otherwise return max(robLinear(0, n-2), robLinear(1, n-1)).

## Walkthrough
nums=[2,3,2]. n=3.
- robLinear(0,1) on [2,3]: prev1 finishes at 3.
- robLinear(1,2) on [3,2]: prev1 finishes at 3.
max(3,3) = 3.

nums=[1,2,3,1].
- robLinear(0,2) on [1,2,3]: prev1 finishes at 4 (1+3).
- robLinear(1,3) on [2,3,1]: prev1 finishes at 4 (2+1=3 vs 3 -> 3, then max(3, 2+1)=3... actually max(3, 0+3)=3 ... Trace: prev2=0,prev1=0 then x=2 -> cur=max(0,2)=2; x=3 cur=max(2,3)=3; x=1 cur=max(3,2+1)=3. So 3). max=4.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def rob(self, nums):\n        def helper(lo, hi):\n            prev2, prev1 = 0, 0\n            for i in range(lo, hi + 1):\n                cur = max(prev1, prev2 + nums[i])\n                prev2, prev1 = prev1, cur\n            return prev1\n        n = len(nums)\n        if n == 0:\n            return 0\n        if n == 1:\n            return nums[0]\n        return max(helper(0, n - 2), helper(1, n - 1))`,
      'O(n) time, O(1) space',
      'Two linear-DP passes excluding first or last house.'
    ),
    js: sol(
      `class Solution {\n    rob(nums) {\n        const helper = (lo, hi) => {\n            let prev2 = 0, prev1 = 0;\n            for (let i = lo; i <= hi; i++) {\n                const cur = Math.max(prev1, prev2 + nums[i]);\n                prev2 = prev1;\n                prev1 = cur;\n            }\n            return prev1;\n        };\n        const n = nums.length;\n        if (n === 0) return 0;\n        if (n === 1) return nums[0];\n        return Math.max(helper(0, n - 2), helper(1, n - 1));\n    }\n}`,
      'O(n) time, O(1) space',
      'Two linear passes covering either end.'
    ),
    jv: sol(
      `class Solution {\n    public int rob(int[] nums) {\n        int n = nums.length;\n        if (n == 0) return 0;\n        if (n == 1) return nums[0];\n        return Math.max(robLinear(nums, 0, n - 2), robLinear(nums, 1, n - 1));\n    }\n    private int robLinear(int[] nums, int lo, int hi) {\n        int prev2 = 0, prev1 = 0;\n        for (int i = lo; i <= hi; i++) {\n            int cur = Math.max(prev1, prev2 + nums[i]);\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n}`,
      'O(n) time, O(1) space',
      'Two linear sub-passes.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        int n = nums.size();\n        if (n == 0) return 0;\n        if (n == 1) return nums[0];\n        return max(robLinear(nums, 0, n - 2), robLinear(nums, 1, n - 1));\n    }\nprivate:\n    int robLinear(vector<int>& nums, int lo, int hi) {\n        int prev2 = 0, prev1 = 0;\n        for (int i = lo; i <= hi; i++) {\n            int cur = max(prev1, prev2 + nums[i]);\n            prev2 = prev1;\n            prev1 = cur;\n        }\n        return prev1;\n    }\n};`,
      'O(n) time, O(1) space',
      'Two linear sub-passes.'
    ),
  },

  'insert-interval': {
    editorial: `## Intuition
The input intervals are sorted and disjoint. The new interval interacts with only a contiguous middle slice that it overlaps; everything strictly before goes in untouched, everything strictly after goes in untouched, and the overlapping slice merges with the new interval into one combined interval.

## Approach
Sweep left to right. Phase 1: while the current interval ends before newInterval starts, append it. Phase 2: while the current interval starts at or before newInterval ends, merge — newInterval.start = min(both starts), newInterval.end = max(both ends). After this phase, append newInterval. Phase 3: append the rest.

## Walkthrough
intervals=[[1,3],[6,9]], newInterval=[2,5].
- Phase 1: [1,3] ends 3, not < 2, stop.
- Phase 2: [1,3] starts 1 <= 5. Merge -> newInterval=[1,5]. Next [6,9] starts 6 > 5, stop. Append [1,5].
- Phase 3: append [6,9]. Result [[1,5],[6,9]].

intervals=[[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval=[4,8].
- Phase 1: [1,2] ends 2 < 4, append.
- Phase 2: [3,5] starts 3 <= 8, merge -> [3,8]; [6,7] starts 6 <= 8 -> [3,8]; [8,10] starts 8 <= 8 -> [3,10]; [12,16] starts 12 > 10 stop. Append [3,10].
- Phase 3: append [12,16]. Result [[1,2],[3,10],[12,16]].

## Complexity
Time O(n). Space O(n) for the output.`,
    py: sol(
      `class Solution:\n    def insert(self, intervals, newInterval):\n        res = []\n        i, n = 0, len(intervals)\n        while i < n and intervals[i][1] < newInterval[0]:\n            res.append(intervals[i])\n            i += 1\n        while i < n and intervals[i][0] <= newInterval[1]:\n            newInterval[0] = min(newInterval[0], intervals[i][0])\n            newInterval[1] = max(newInterval[1], intervals[i][1])\n            i += 1\n        res.append(newInterval)\n        while i < n:\n            res.append(intervals[i])\n            i += 1\n        return res`,
      'O(n) time, O(n) space',
      'Three-phase sweep: before / overlap / after.'
    ),
    js: sol(
      `class Solution {\n    insert(intervals, newInterval) {\n        const res = [];\n        let i = 0;\n        const n = intervals.length;\n        while (i < n && intervals[i][1] < newInterval[0]) { res.push(intervals[i]); i++; }\n        while (i < n && intervals[i][0] <= newInterval[1]) {\n            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);\n            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);\n            i++;\n        }\n        res.push(newInterval);\n        while (i < n) { res.push(intervals[i]); i++; }\n        return res;\n    }\n}`,
      'O(n) time, O(n) space',
      'Three-phase sweep.'
    ),
    jv: sol(
      `class Solution {\n    public int[][] insert(int[][] intervals, int[] newInterval) {\n        java.util.List<int[]> res = new java.util.ArrayList<>();\n        int i = 0, n = intervals.length;\n        while (i < n && intervals[i][1] < newInterval[0]) res.add(intervals[i++]);\n        while (i < n && intervals[i][0] <= newInterval[1]) {\n            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);\n            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);\n            i++;\n        }\n        res.add(newInterval);\n        while (i < n) res.add(intervals[i++]);\n        return res.toArray(new int[res.size()][]);\n    }\n}`,
      'O(n) time, O(n) space',
      'Three-phase sweep.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& newInterval) {\n        vector<vector<int>> res;\n        int i = 0, n = intervals.size();\n        while (i < n && intervals[i][1] < newInterval[0]) res.push_back(intervals[i++]);\n        while (i < n && intervals[i][0] <= newInterval[1]) {\n            newInterval[0] = min(newInterval[0], intervals[i][0]);\n            newInterval[1] = max(newInterval[1], intervals[i][1]);\n            i++;\n        }\n        res.push_back(newInterval);\n        while (i < n) res.push_back(intervals[i++]);\n        return res;\n    }\n};`,
      'O(n) time, O(n) space',
      'Three-phase sweep.'
    ),
  },

  'invert-binary-tree': {
    editorial: `## Intuition
Inverting a binary tree means swapping every node's children. Done recursively: invert left subtree, invert right subtree, then swap them. Done iteratively: BFS or DFS visiting every node and swapping in place.

## Approach (recursive)
Base: null -> null. Recurse left and right, capture results, set node.left = right_result, node.right = left_result, return node. The order does not matter for correctness because the recursive calls happen on the original children (no mutation yet).

## Walkthrough
Input [4,2,7,1,3,6,9]:
- Invert root 4: recurse into 2 and 7.
- Invert 2: recurse into 1 (leaf, unchanged), 3 (leaf, unchanged); swap so 2.left=3, 2.right=1.
- Invert 7: recurse into 6, 9; swap so 7.left=9, 7.right=6.
- At root: 4.left=7 (already inverted), 4.right=2.
Final preorder: [4,7,9,6,2,3,1].

## Complexity
Time O(n). Space O(h) for recursion stack (O(n) worst case for skewed trees).`,
    py: sol(
      `class Solution:\n    def invertTree(self, root):\n        if not root:\n            return None\n        left = self.invertTree(root.left)\n        right = self.invertTree(root.right)\n        root.left = right\n        root.right = left\n        return root`,
      'O(n) time, O(h) space',
      'Post-order swap of children.'
    ),
    js: sol(
      `class Solution {\n    invertTree(root) {\n        if (!root) return null;\n        const left = this.invertTree(root.left);\n        const right = this.invertTree(root.right);\n        root.left = right;\n        root.right = left;\n        return root;\n    }\n}`,
      'O(n) time, O(h) space',
      'Recursive post-order swap.'
    ),
    jv: sol(
      `class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        if (root == null) return null;\n        TreeNode left = invertTree(root.left);\n        TreeNode right = invertTree(root.right);\n        root.left = right;\n        root.right = left;\n        return root;\n    }\n}`,
      'O(n) time, O(h) space',
      'Recursive post-order swap.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        if (!root) return nullptr;\n        TreeNode* left = invertTree(root->left);\n        TreeNode* right = invertTree(root->right);\n        root->left = right;\n        root->right = left;\n        return root;\n    }\n};`,
      'O(n) time, O(h) space',
      'Recursive post-order swap.'
    ),
  },

  'jump-game': {
    editorial: `## Intuition
We want to know whether index n-1 is reachable from index 0 jumping at most nums[i] from i. Greedily track the farthest reachable index as we sweep left to right; if we ever stand on an index beyond what is reachable, return false.

## Approach
Initialize maxReach = 0. For i from 0 to n-1: if i > maxReach, return false (can't even stand here). Otherwise maxReach = max(maxReach, i + nums[i]). If maxReach >= n - 1 we can early-return true. After the loop, return true.

## Walkthrough
nums=[2,3,1,1,4]. maxReach=0.
- i=0: 0 <= 0, maxReach=2. 2<4 continue.
- i=1: 1<=2, maxReach=max(2,1+3)=4. >=4 return true.

nums=[3,2,1,0,4]. maxReach=0.
- i=0: maxReach=3.
- i=1: maxReach=max(3,3)=3.
- i=2: maxReach=max(3,3)=3.
- i=3: maxReach=max(3,3)=3.
- i=4: 4 > maxReach=3, return false.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def canJump(self, nums):\n        max_reach = 0\n        n = len(nums)\n        for i in range(n):\n            if i > max_reach:\n                return False\n            if i + nums[i] > max_reach:\n                max_reach = i + nums[i]\n            if max_reach >= n - 1:\n                return True\n        return True`,
      'O(n) time, O(1) space',
      'Greedy farthest-reach sweep.'
    ),
    js: sol(
      `class Solution {\n    canJump(nums) {\n        let maxReach = 0;\n        const n = nums.length;\n        for (let i = 0; i < n; i++) {\n            if (i > maxReach) return false;\n            if (i + nums[i] > maxReach) maxReach = i + nums[i];\n            if (maxReach >= n - 1) return true;\n        }\n        return true;\n    }\n}`,
      'O(n) time, O(1) space',
      'Greedy reach.'
    ),
    jv: sol(
      `class Solution {\n    public boolean canJump(int[] nums) {\n        int maxReach = 0;\n        int n = nums.length;\n        for (int i = 0; i < n; i++) {\n            if (i > maxReach) return false;\n            if (i + nums[i] > maxReach) maxReach = i + nums[i];\n            if (maxReach >= n - 1) return true;\n        }\n        return true;\n    }\n}`,
      'O(n) time, O(1) space',
      'Greedy reach.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        int maxReach = 0;\n        int n = nums.size();\n        for (int i = 0; i < n; i++) {\n            if (i > maxReach) return false;\n            if (i + nums[i] > maxReach) maxReach = i + nums[i];\n            if (maxReach >= n - 1) return true;\n        }\n        return true;\n    }\n};`,
      'O(n) time, O(1) space',
      'Greedy reach.'
    ),
  },

  'jump-game-ii': {
    editorial: `## Intuition
We are guaranteed to reach the end, and we want the minimum number of jumps. View the array as BFS layers: from layer k (the set of indices reachable in k jumps) we can extend to a new layer k+1 covering all indices up to max(i + nums[i]) over the current layer. Each layer transition counts as one jump.

## Approach
Track current layer's right boundary (currentEnd) and the farthest we can extend (farthest). Iterate i from 0 to n-2 (we never jump from the last index). Update farthest = max(farthest, i + nums[i]). When i == currentEnd, we must take a jump: jumps++, currentEnd = farthest. Return jumps.

## Walkthrough
nums=[2,3,1,1,4]. jumps=0, currentEnd=0, farthest=0.
- i=0: farthest=2. i==currentEnd -> jumps=1, currentEnd=2.
- i=1: farthest=max(2,4)=4.
- i=2: farthest=max(4,3)=4. i==currentEnd -> jumps=2, currentEnd=4.
- i=3: farthest=max(4,4)=4. Loop ends (we stop at i<n-1, n-1=4, so loop i=0..3).
Return 2.

## Complexity
Time O(n). Space O(1).`,
    py: sol(
      `class Solution:\n    def jump(self, nums):\n        n = len(nums)\n        jumps = 0\n        current_end = 0\n        farthest = 0\n        for i in range(n - 1):\n            if i + nums[i] > farthest:\n                farthest = i + nums[i]\n            if i == current_end:\n                jumps += 1\n                current_end = farthest\n        return jumps`,
      'O(n) time, O(1) space',
      'BFS-style layer expansion; new jump when we cross the current layer boundary.'
    ),
    js: sol(
      `class Solution {\n    jump(nums) {\n        const n = nums.length;\n        let jumps = 0, currentEnd = 0, farthest = 0;\n        for (let i = 0; i < n - 1; i++) {\n            if (i + nums[i] > farthest) farthest = i + nums[i];\n            if (i === currentEnd) { jumps++; currentEnd = farthest; }\n        }\n        return jumps;\n    }\n}`,
      'O(n) time, O(1) space',
      'BFS layer counting.'
    ),
    jv: sol(
      `class Solution {\n    public int jump(int[] nums) {\n        int n = nums.length;\n        int jumps = 0, currentEnd = 0, farthest = 0;\n        for (int i = 0; i < n - 1; i++) {\n            if (i + nums[i] > farthest) farthest = i + nums[i];\n            if (i == currentEnd) { jumps++; currentEnd = farthest; }\n        }\n        return jumps;\n    }\n}`,
      'O(n) time, O(1) space',
      'BFS layer counting.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    int jump(vector<int>& nums) {\n        int n = nums.size();\n        int jumps = 0, currentEnd = 0, farthest = 0;\n        for (int i = 0; i < n - 1; i++) {\n            if (i + nums[i] > farthest) farthest = i + nums[i];\n            if (i == currentEnd) { jumps++; currentEnd = farthest; }\n        }\n        return jumps;\n    }\n};`,
      'O(n) time, O(1) space',
      'BFS layer counting.'
    ),
  },

  'k-closest-points': {
    editorial: `## Intuition
We want the k points with smallest squared Euclidean distance to the origin. Sorting all n points costs O(n log n). A max-heap of size k keeps only the k best so far in O(n log k) — strictly better when k << n.

## Approach
Maintain a max-heap keyed by squared distance, capped at size k. For each point: push (-distSquared, point) using a min-heap with negated keys (Python's heapq is min-heap). If heap size exceeds k, pop the worst (largest distance). After processing, the heap contains the k closest. Extract in any order.

## Walkthrough
points=[[1,3],[-2,2]], k=1. dist^2: 10, 8.
- Push (-10,[1,3]). Heap=[(-10,...)]. Size 1 <= 1.
- Push (-8,[-2,2]). Heap=[(-10,...),(-8,...)]. Size 2 > 1 -> pop (-10,...) (smallest in min-heap). Heap=[(-8,[-2,2])].
- Return [[-2,2]].

## Complexity
Time O(n log k). Space O(k).`,
    py: sol(
      `class Solution:\n    def kClosest(self, points, k):\n        import heapq\n        heap = []\n        for p in points:\n            d = -(p[0] * p[0] + p[1] * p[1])\n            heapq.heappush(heap, (d, p))\n            if len(heap) > k:\n                heapq.heappop(heap)\n        return [p for _, p in heap]`,
      'O(n log k) time, O(k) space',
      'Bounded max-heap of size k via negated distances in a min-heap.'
    ),
    js: sol(
      `class Solution {\n    kClosest(points, k) {\n        // Use sort by squared distance — concise and O(n log n).\n        return points\n            .map(p => [p, p[0] * p[0] + p[1] * p[1]])\n            .sort((a, b) => a[1] - b[1])\n            .slice(0, k)\n            .map(([p]) => p);\n    }\n}`,
      'O(n log n) time, O(n) space',
      'Sort by squared distance; take first k. Simpler than implementing a heap in JS.'
    ),
    jv: sol(
      `class Solution {\n    public int[][] kClosest(int[][] points, int k) {\n        java.util.PriorityQueue<int[]> heap = new java.util.PriorityQueue<>((a, b) ->\n            (b[0] * b[0] + b[1] * b[1]) - (a[0] * a[0] + a[1] * a[1])\n        );\n        for (int[] p : points) {\n            heap.offer(p);\n            if (heap.size() > k) heap.poll();\n        }\n        int[][] res = new int[k][2];\n        for (int i = 0; i < k; i++) res[i] = heap.poll();\n        return res;\n    }\n}`,
      'O(n log k) time, O(k) space',
      'Max-heap of size k by squared distance.'
    ),
    cp: sol(
      `class Solution {\npublic:\n    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {\n        auto cmp = [](const vector<int>& a, const vector<int>& b) {\n            return (a[0]*a[0] + a[1]*a[1]) < (b[0]*b[0] + b[1]*b[1]);\n        };\n        priority_queue<vector<int>, vector<vector<int>>, decltype(cmp)> heap(cmp);\n        for (auto& p : points) {\n            heap.push(p);\n            if ((int)heap.size() > k) heap.pop();\n        }\n        vector<vector<int>> res;\n        while (!heap.empty()) { res.push_back(heap.top()); heap.pop(); }\n        return res;\n    }\n};`,
      'O(n log k) time, O(k) space',
      'Max-heap bounded at k.'
    ),
  },
};

const IDS = Object.keys(SOLUTIONS);

let solHydrated = 0;
let solSkipped = 0;
let edHydrated = 0;
let edSkipped = 0;
let missing = 0;

for (const id of IDS) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, editorial_md')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) { console.error(`  ERROR fetch ${id}: ${fetchErr.message}`); continue; }
  if (!existing) { console.log(`  MISSING ${id}`); missing++; continue; }

  const entry = SOLUTIONS[id];
  const update = {};
  if (existing.solutions == null) {
    update.solutions = pack(entry.py, entry.js, entry.jv, entry.cp);
    solHydrated++;
  } else {
    solSkipped++;
  }
  if (existing.editorial_md == null) {
    update.editorial_md = entry.editorial;
    edHydrated++;
  } else {
    edSkipped++;
  }

  if (Object.keys(update).length === 0) {
    console.log(`  - ${id} no-op (both present)`);
    continue;
  }

  const { error } = await sb.from('PGcode_problems').update(update).eq('id', id);
  if (error) { console.error(`  ERROR update ${id}: ${error.message}`); continue; }
  const tags = [
    update.solutions ? 'solutions' : null,
    update.editorial_md ? 'editorial' : null,
  ].filter(Boolean).join('+');
  console.log(`  OK ${id}  (${tags})`);
}

console.log(`\nDone. solutions: ${solHydrated} hydrated, ${solSkipped} skipped (already present); editorials: ${edHydrated} hydrated, ${edSkipped} skipped; ${missing} missing in DB.`);
