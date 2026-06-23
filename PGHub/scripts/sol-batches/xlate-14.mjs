// xlate-14.mjs — Python→{JS/Java/C++} translations for problems that already
// have a verified-correct Python solution but are missing other languages.
// Slice [390,420) of solutions-backfill-targets.json filtered to pyReal && missingLangs>0,
// sorted by id ascending. Only the missing languages are authored per slug.
// Signatures match generateTemplate(language, method_name, params, return_type) exactly.
// The runner grades each language via Judge0 and writes only passing langs.
//
// SKIPPED: pghub-b36-thermostat-convert (return_type List[float] — driver can't grade floats).

export default {
  // toll-booths — minCoins(amount: int) -> int. Greedy coin counting, integer division.
  'pghub-b35-toll-booths': {
    javascript: `var minCoins = function(amount) {
    const coins = [100, 25, 10, 5, 1];
    let count = 0;
    for (const c of coins) {
        count += Math.floor(amount / c);
        amount %= c;
    }
    return count;
};`,
    java: `class Solution {
    public int minCoins(int amount) {
        int[] coins = {100, 25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(int amount) {
        int coins[] = {100, 25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
};`,
  },

  // treasure-grid — countPaths(grid: List[List[int]]) -> int. DP grid count, 1 = blocked.
  'pghub-b35-treasure-grid': {
    javascript: `var countPaths = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    if (grid[0][0] === 1 || grid[rows - 1][cols - 1] === 1) return 0;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    dp[0][0] = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
            if (r > 0) dp[r][c] += dp[r - 1][c];
            if (c > 0) dp[r][c] += dp[r][c - 1];
        }
    }
    return dp[rows - 1][cols - 1];
};`,
    java: `class Solution {
    public int countPaths(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return 0;
        long[][] dp = new long[rows][cols];
        dp[0][0] = 1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) { dp[r][c] = 0; continue; }
                if (r > 0) dp[r][c] += dp[r - 1][c];
                if (c > 0) dp[r][c] += dp[r][c - 1];
            }
        }
        return (int) dp[rows - 1][cols - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPaths(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows - 1][cols - 1] == 1) return 0;
        vector<vector<long long>> dp(rows, vector<long long>(cols, 0));
        dp[0][0] = 1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) { dp[r][c] = 0; continue; }
                if (r > 0) dp[r][c] += dp[r - 1][c];
                if (c > 0) dp[r][c] += dp[r][c - 1];
            }
        }
        return (int) dp[rows - 1][cols - 1];
    }
};`,
  },

  // warehouse-aisles (b35) — busiestAisle(stock: List[int]) -> int. Index of first max.
  'pghub-b35-warehouse-aisles': {
    javascript: `var busiestAisle = function(stock) {
    let bestIdx = 0;
    for (let i = 1; i < stock.length; i++) {
        if (stock[i] > stock[bestIdx]) bestIdx = i;
    }
    return bestIdx;
};`,
    java: `class Solution {
    public int busiestAisle(int[] stock) {
        int bestIdx = 0;
        for (int i = 1; i < stock.length; i++) {
            if (stock[i] > stock[bestIdx]) bestIdx = i;
        }
        return bestIdx;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int busiestAisle(vector<int>& stock) {
        int bestIdx = 0;
        for (int i = 1; i < (int)stock.size(); i++) {
            if (stock[i] > stock[bestIdx]) bestIdx = i;
        }
        return bestIdx;
    }
};`,
  },

  // water-tanks — trappedWater(heights: List[int]) -> int. Two-pointer rainwater.
  'pghub-b35-water-tanks': {
    javascript: `var trappedWater = function(heights) {
    if (heights.length === 0) return 0;
    let lo = 0, hi = heights.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (lo < hi) {
        if (heights[lo] <= heights[hi]) {
            leftMax = Math.max(leftMax, heights[lo]);
            total += leftMax - heights[lo];
            lo++;
        } else {
            rightMax = Math.max(rightMax, heights[hi]);
            total += rightMax - heights[hi];
            hi--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trappedWater(int[] heights) {
        if (heights.length == 0) return 0;
        int lo = 0, hi = heights.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (heights[lo] <= heights[hi]) {
                leftMax = Math.max(leftMax, heights[lo]);
                total += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = Math.max(rightMax, heights[hi]);
                total += rightMax - heights[hi];
                hi--;
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& heights) {
        if (heights.empty()) return 0;
        int lo = 0, hi = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (heights[lo] <= heights[hi]) {
                leftMax = max(leftMax, heights[lo]);
                total += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = max(rightMax, heights[hi]);
                total += rightMax - heights[hi];
                hi--;
            }
        }
        return total;
    }
};`,
  },

  // cache-evict — evictionOrder(accesses: List[int]) -> List[int].
  // Order pages by (access count asc, first-seen index asc).
  'pghub-b36-cache-evict': {
    javascript: `var evictionOrder = function(accesses) {
    const count = new Map(), first = new Map();
    for (let i = 0; i < accesses.length; i++) {
        const p = accesses[i];
        count.set(p, (count.get(p) || 0) + 1);
        if (!first.has(p)) first.set(p, i);
    }
    const pages = [...count.keys()];
    pages.sort((a, b) => (count.get(a) - count.get(b)) || (first.get(a) - first.get(b)));
    return pages;
};`,
    java: `import java.util.*;
class Solution {
    public int[] evictionOrder(int[] accesses) {
        Map<Integer, Integer> count = new HashMap<>(), first = new HashMap<>();
        for (int i = 0; i < accesses.length; i++) {
            int p = accesses[i];
            count.merge(p, 1, Integer::sum);
            first.putIfAbsent(p, i);
        }
        List<Integer> pages = new ArrayList<>(count.keySet());
        pages.sort((a, b) -> {
            int c = Integer.compare(count.get(a), count.get(b));
            if (c != 0) return c;
            return Integer.compare(first.get(a), first.get(b));
        });
        int[] res = new int[pages.size()];
        for (int i = 0; i < res.length; i++) res[i] = pages.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> evictionOrder(vector<int>& accesses) {
        unordered_map<int,int> count, first;
        for (int i = 0; i < (int)accesses.size(); i++) {
            int p = accesses[i];
            count[p]++;
            if (!first.count(p)) first[p] = i;
        }
        vector<int> pages;
        for (auto& kv : count) pages.push_back(kv.first);
        sort(pages.begin(), pages.end(), [&](int a, int b) {
            if (count[a] != count[b]) return count[a] < count[b];
            return first[a] < first[b];
        });
        return pages;
    }
};`,
  },

  // cargo-balance — balancePoint(weights: List[int]) -> int. Pivot/balance index.
  'pghub-b36-cargo-balance': {
    javascript: `var balancePoint = function(weights) {
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
    public int balancePoint(int[] weights) {
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
    int balancePoint(vector<int>& weights) {
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

  // discount-codes — distinctCodes(digits: List[int]) -> int.
  // Count distinct permutations of a multiset (multinomial via dedup backtracking).
  'pghub-b36-discount-codes': {
    javascript: `var distinctCodes = function(digits) {
    const counts = new Map();
    for (const d of digits) counts.set(d, (counts.get(d) || 0) + 1);
    const n = digits.length;
    const seen = new Set();
    const path = [];
    const keys = [...counts.keys()];
    const backtrack = () => {
        if (path.length === n) { seen.add(path.join(',')); return; }
        for (const d of keys) {
            if (counts.get(d) > 0) {
                counts.set(d, counts.get(d) - 1);
                path.push(d);
                backtrack();
                path.pop();
                counts.set(d, counts.get(d) + 1);
            }
        }
    };
    backtrack();
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int distinctCodes(int[] digits) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int d : digits) counts.merge(d, 1, Integer::sum);
        int n = digits.length;
        Set<String> seen = new HashSet<>();
        List<Integer> keys = new ArrayList<>(counts.keySet());
        int[] path = new int[n];
        backtrack(counts, keys, path, 0, n, seen);
        return seen.size();
    }
    private void backtrack(Map<Integer,Integer> counts, List<Integer> keys,
                           int[] path, int depth, int n, Set<String> seen) {
        if (depth == n) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) { sb.append(path[i]); sb.append(','); }
            seen.add(sb.toString());
            return;
        }
        for (int d : keys) {
            if (counts.get(d) > 0) {
                counts.put(d, counts.get(d) - 1);
                path[depth] = d;
                backtrack(counts, keys, path, depth + 1, n, seen);
                counts.put(d, counts.get(d) + 1);
            }
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctCodes(vector<int>& digits) {
        map<int,int> counts;
        for (int d : digits) counts[d]++;
        int n = digits.size();
        set<vector<int>> seen;
        vector<int> path;
        vector<int> keys;
        for (auto& kv : counts) keys.push_back(kv.first);
        function<void()> backtrack = [&]() {
            if ((int)path.size() == n) { seen.insert(path); return; }
            for (int d : keys) {
                if (counts[d] > 0) {
                    counts[d]--;
                    path.push_back(d);
                    backtrack();
                    path.pop_back();
                    counts[d]++;
                }
            }
        };
        backtrack();
        return (int)seen.size();
    }
};`,
  },

  // festival-lanterns — cheapestLanterns(n, roads: List[List[int]], start) -> int.
  // Dijkstra from start to node 0 on undirected weighted graph. Hand-rolled JS min-heap.
  'pghub-b36-festival-lanterns': {
    javascript: `var cheapestLanterns = function(n, roads, start) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of roads) {
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[start] = 0;
    // min-heap of [d, node] keyed on d
    const heap = [];
    const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            swap(p, i); i = p;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            const len = heap.length;
            while (true) {
                let smallest = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < len && heap[l][0] < heap[smallest][0]) smallest = l;
                if (r < len && heap[r][0] < heap[smallest][0]) smallest = r;
                if (smallest === i) break;
                swap(i, smallest); i = smallest;
            }
        }
        return top;
    };
    push([0, start]);
    while (heap.length > 0) {
        const [d, node] = pop();
        if (d > dist[node]) continue;
        if (node === 0) return d;
        for (const [nb, w] of adj[node]) {
            const nd = d + w;
            if (nd < dist[nb]) {
                dist[nb] = nd;
                push([nd, nb]);
            }
        }
    }
    return dist[0] !== INF ? dist[0] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int cheapestLanterns(int n, int[][] roads, int start) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) {
            adj[r[0]].add(new int[]{r[1], r[2]});
            adj[r[1]].add(new int[]{r[0], r[2]});
        }
        long INF = Long.MAX_VALUE;
        long[] dist = new long[n];
        Arrays.fill(dist, INF);
        dist[start] = 0;
        PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        heap.add(new long[]{0, start});
        while (!heap.isEmpty()) {
            long[] cur = heap.poll();
            long d = cur[0];
            int node = (int) cur[1];
            if (d > dist[node]) continue;
            if (node == 0) return (int) d;
            for (int[] e : adj[node]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) {
                    dist[e[0]] = nd;
                    heap.add(new long[]{nd, e[0]});
                }
            }
        }
        return dist[0] != INF ? (int) dist[0] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestLanterns(int n, vector<vector<int>>& roads, int start) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> heap;
        heap.push({0, start});
        while (!heap.empty()) {
            auto [d, node] = heap.top(); heap.pop();
            if (d > dist[node]) continue;
            if (node == 0) return (int) d;
            for (auto& [nb, w] : adj[node]) {
                long long nd = d + w;
                if (nd < dist[nb]) {
                    dist[nb] = nd;
                    heap.push({nd, nb});
                }
            }
        }
        return dist[0] != INF ? (int) dist[0] : -1;
    }
};`,
  },

  // island-counter — countPatches(field: List[List[int]]) -> int. Flood-fill connected 1s.
  'pghub-b36-island-counter': {
    javascript: `var countPatches = function(field) {
    const rows = field.length, cols = field[0].length;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const flood = (r, c) => {
        const stack = [[r, c]];
        seen[r][c] = true;
        while (stack.length) {
            const [x, y] = stack.pop();
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !seen[nx][ny] && field[nx][ny] === 1) {
                    seen[nx][ny] = true;
                    stack.push([nx, ny]);
                }
            }
        }
    };
    let count = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (field[r][c] === 1 && !seen[r][c]) { count++; flood(r, c); }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPatches(int[][] field) {
        int rows = field.length, cols = field[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (field[r][c] == 1 && !seen[r][c]) {
                    count++;
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{r, c});
                    seen[r][c] = true;
                    while (!stack.isEmpty()) {
                        int[] p = stack.pop();
                        for (int[] d : dirs) {
                            int nx = p[0] + d[0], ny = p[1] + d[1];
                            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !seen[nx][ny] && field[nx][ny] == 1) {
                                seen[nx][ny] = true;
                                stack.push(new int[]{nx, ny});
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
    int countPatches(vector<vector<int>>& field) {
        int rows = field.size(), cols = field[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (field[r][c] == 1 && !seen[r][c]) {
                    count++;
                    stack<pair<int,int>> st;
                    st.push({r, c});
                    seen[r][c] = true;
                    while (!st.empty()) {
                        auto [x, y] = st.top(); st.pop();
                        for (auto& d : dirs) {
                            int nx = x + d[0], ny = y + d[1];
                            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && !seen[nx][ny] && field[nx][ny] == 1) {
                                seen[nx][ny] = true;
                                st.push({nx, ny});
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

  // orchard-trees — widestLevel(tree: List[int]) -> int. -1 is the null sentinel (gradeable).
  // BFS over an array-encoded binary tree, widest non-null level.
  'pghub-b36-orchard-trees': {
    javascript: `var widestLevel = function(tree) {
    const n = tree.length;
    let best = 0;
    let q = [0];
    while (q.length) {
        const size = q.length;
        let present = 0;
        const next = [];
        for (let k = 0; k < size; k++) {
            const i = q[k];
            if (i >= n || tree[i] === -1) continue;
            present++;
            const left = 2 * i + 1, right = 2 * i + 2;
            if (left < n && tree[left] !== -1) next.push(left);
            if (right < n && tree[right] !== -1) next.push(right);
        }
        q = next;
        best = Math.max(best, present);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int widestLevel(int[] tree) {
        int n = tree.length;
        int best = 0;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(0);
        while (!q.isEmpty()) {
            int size = q.size();
            int present = 0;
            for (int k = 0; k < size; k++) {
                int i = q.poll();
                if (i >= n || tree[i] == -1) continue;
                present++;
                int left = 2 * i + 1, right = 2 * i + 2;
                if (left < n && tree[left] != -1) q.add(left);
                if (right < n && tree[right] != -1) q.add(right);
            }
            best = Math.max(best, present);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int widestLevel(vector<int>& tree) {
        int n = tree.size();
        int best = 0;
        queue<int> q;
        q.push(0);
        while (!q.empty()) {
            int size = q.size();
            int present = 0;
            for (int k = 0; k < size; k++) {
                int i = q.front(); q.pop();
                if (i >= n || tree[i] == -1) continue;
                present++;
                int left = 2 * i + 1, right = 2 * i + 2;
                if (left < n && tree[left] != -1) q.push(left);
                if (right < n && tree[right] != -1) q.push(right);
            }
            best = max(best, present);
        }
        return best;
    }
};`,
  },

  // paint-fence — paintWays(posts: int, colors: int) -> int. DP with MOD; long for overflow.
  'pghub-b36-paint-fence': {
    javascript: `var paintWays = function(posts, colors) {
    const MOD = 1000000007n;
    const C = BigInt(colors);
    if (posts === 1) return Number(C % MOD);
    let same = C % MOD;
    let diff = (C * (C - 1n)) % MOD;
    for (let i = 3; i <= posts; i++) {
        const newSame = diff;
        const newDiff = ((same + diff) * (C - 1n)) % MOD;
        same = newSame;
        diff = newDiff;
    }
    return Number((same + diff) % MOD);
};`,
    java: `class Solution {
    public int paintWays(int posts, int colors) {
        long MOD = 1000000007L;
        long c = colors;
        if (posts == 1) return (int)(c % MOD);
        long same = c % MOD;
        long diff = (c * (c - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long newSame = diff;
            long newDiff = ((same + diff) % MOD * ((c - 1) % MOD)) % MOD;
            same = newSame;
            diff = newDiff;
        }
        return (int)((same + diff) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintWays(int posts, int colors) {
        const long long MOD = 1000000007LL;
        long long c = colors;
        if (posts == 1) return (int)(c % MOD);
        long long same = c % MOD;
        long long diff = (c * (c - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD * ((c - 1) % MOD)) % MOD;
            same = newSame;
            diff = newDiff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  // shipping-days — minCapacity(packages: List[int], days: int) -> int. Binary search on capacity.
  'pghub-b36-shipping-days': {
    javascript: `var minCapacity = function(packages, days) {
    const feasible = (cap) => {
        let used = 1, load = 0;
        for (const w of packages) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used <= days;
    };
    let lo = Math.max(...packages);
    let hi = packages.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minCapacity(int[] packages, int days) {
        int lo = 0;
        long hi = 0;
        for (int w : packages) { lo = Math.max(lo, w); hi += w; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (feasible(packages, days, mid)) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private boolean feasible(int[] packages, int days, long cap) {
        int used = 1;
        long load = 0;
        for (int w : packages) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used <= days;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& packages, int days) {
        long long lo = 0, hi = 0;
        for (int w : packages) { lo = max(lo, (long long)w); hi += w; }
        auto feasible = [&](long long cap) {
            int used = 1;
            long long load = 0;
            for (int w : packages) {
                if (load + w > cap) { used++; load = 0; }
                load += w;
            }
            return used <= days;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // signal-toggle — toggleCost(a: int, b: int) -> int. Hamming distance (popcount of xor).
  'pghub-b36-signal-toggle': {
    javascript: `var toggleCost = function(a, b) {
    let x = a ^ b;
    let count = 0;
    while (x !== 0) {
        count += x & 1;
        x >>>= 1;
    }
    return count;
};`,
    java: `class Solution {
    public int toggleCost(int a, int b) {
        return Integer.bitCount(a ^ b);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int toggleCost(int a, int b) {
        return __builtin_popcount((unsigned)(a ^ b));
    }
};`,
  },

  // subscriber-streak — longestStreak(active: List[int], k: int) -> int. Sliding window, <=k zeros.
  'pghub-b36-subscriber-streak': {
    javascript: `var longestStreak = function(active, k) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < active.length; right++) {
        if (active[right] === 0) zeros++;
        while (zeros > k) {
            if (active[left] === 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestStreak(int[] active, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < active.length; right++) {
            if (active[right] == 0) zeros++;
            while (zeros > k) {
                if (active[left] == 0) zeros--;
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
    int longestStreak(vector<int>& active, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)active.size(); right++) {
            if (active[right] == 0) zeros++;
            while (zeros > k) {
                if (active[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // ticket-windows — lastFinish(durations: List[int], windows: int) -> int.
  // Greedy min-heap of window free-times. Hand-rolled JS min-heap.
  'pghub-b36-ticket-windows': {
    javascript: `var lastFinish = function(durations, windows) {
    const size = Math.min(windows, durations.length);
    const heap = new Array(size).fill(0); // already a valid min-heap of zeros
    const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
    const push = (v) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            swap(p, i); i = p;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            const len = heap.length;
            while (true) {
                let smallest = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < len && heap[l] < heap[smallest]) smallest = l;
                if (r < len && heap[r] < heap[smallest]) smallest = r;
                if (smallest === i) break;
                swap(i, smallest); i = smallest;
            }
        }
        return top;
    };
    let last = 0;
    for (const d of durations) {
        const free = pop();
        const finish = free + d;
        if (finish > last) last = finish;
        push(finish);
    }
    return last;
};`,
    java: `import java.util.*;
class Solution {
    public int lastFinish(int[] durations, int windows) {
        int size = Math.min(windows, durations.length);
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int i = 0; i < size; i++) heap.add(0L);
        long last = 0;
        for (int d : durations) {
            long free = heap.poll();
            long finish = free + d;
            last = Math.max(last, finish);
            heap.add(finish);
        }
        return (int) last;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastFinish(vector<int>& durations, int windows) {
        int size = min(windows, (int)durations.size());
        priority_queue<long long, vector<long long>, greater<>> heap;
        for (int i = 0; i < size; i++) heap.push(0);
        long long last = 0;
        for (int d : durations) {
            long long free = heap.top(); heap.pop();
            long long finish = free + d;
            last = max(last, finish);
            heap.push(finish);
        }
        return (int) last;
    }
};`,
  },

  // token-bucket — isValid(s: str) -> bool. Balanced brackets stack.
  'pghub-b36-token-bucket': {
    javascript: `var isValid = function(s) {
    const pairs = {')': '(', ']': '[', '}': '{'};
    const stack = [];
    for (const ch of s) {
        if (ch in pairs) {
            if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.length === 0;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isValid(String s) {
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '('); pairs.put(']', '['); pairs.put('}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (pairs.containsKey(ch)) {
                if (stack.isEmpty() || stack.pop() != pairs.get(ch)) return false;
            } else {
                stack.push(ch);
            }
        }
        return stack.isEmpty();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};
        stack<char> st;
        for (char ch : s) {
            if (pairs.count(ch)) {
                if (st.empty() || st.top() != pairs[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};`,
  },

  // typist-backspace — sameFinal(a: str, b: str) -> bool. Build final strings, compare.
  'pghub-b36-typist-backspace': {
    javascript: `var sameFinal = function(a, b) {
    const build = (s) => {
        const out = [];
        for (const ch of s) {
            if (ch === '#') { if (out.length) out.pop(); }
            else out.push(ch);
        }
        return out.join('');
    };
    return build(a) === build(b);
};`,
    java: `class Solution {
    public boolean sameFinal(String a, String b) {
        return build(a).equals(build(b));
    }
    private String build(String s) {
        StringBuilder out = new StringBuilder();
        for (char ch : s.toCharArray()) {
            if (ch == '#') { if (out.length() > 0) out.deleteCharAt(out.length() - 1); }
            else out.append(ch);
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool sameFinal(string a, string b) {
        return build(a) == build(b);
    }
private:
    string build(const string& s) {
        string out;
        for (char ch : s) {
            if (ch == '#') { if (!out.empty()) out.pop_back(); }
            else out.push_back(ch);
        }
        return out;
    }
};`,
  },

  // warehouse-aisles (b36) — minAisles(shelves: List[int]) -> int.
  // New aisle whenever a value repeats within the current aisle.
  'pghub-b36-warehouse-aisles': {
    javascript: `var minAisles = function(shelves) {
    let aisles = 1;
    let seen = new Set();
    for (const x of shelves) {
        if (seen.has(x)) { aisles++; seen = new Set(); }
        seen.add(x);
    }
    return aisles;
};`,
    java: `import java.util.*;
class Solution {
    public int minAisles(int[] shelves) {
        int aisles = 1;
        Set<Integer> seen = new HashSet<>();
        for (int x : shelves) {
            if (seen.contains(x)) { aisles++; seen = new HashSet<>(); }
            seen.add(x);
        }
        return aisles;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minAisles(vector<int>& shelves) {
        int aisles = 1;
        unordered_set<int> seen;
        for (int x : shelves) {
            if (seen.count(x)) { aisles++; seen.clear(); }
            seen.insert(x);
        }
        return aisles;
    }
};`,
  },

  // bracket-depth — maxDepth(s: str) -> int. Max nesting of parentheses.
  'pghub-b37-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') { depth++; if (depth > best) best = depth; }
        else if (ch === ')') depth--;
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (char ch : s.toCharArray()) {
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
    int maxDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') { depth++; if (depth > best) best = depth; }
            else if (ch == ')') depth--;
        }
        return best;
    }
};`,
  },

  // cipher-shift — rollingCipher(s: str, k: int) -> str. Position-dependent Caesar shift.
  'pghub-b37-cipher-shift': {
    javascript: `var rollingCipher = function(s, k) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const shift = (k + i) % 26;
        const code = (s.charCodeAt(i) - 97 + shift) % 26 + 97;
        out += String.fromCharCode(code);
    }
    return out;
};`,
    java: `class Solution {
    public String rollingCipher(String s, int k) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            int shift = (k + i) % 26;
            int code = (s.charAt(i) - 97 + shift) % 26 + 97;
            out.append((char) code);
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rollingCipher(string s, int k) {
        string out;
        for (int i = 0; i < (int)s.size(); i++) {
            int shift = (k + i) % 26;
            int code = (s[i] - 97 + shift) % 26 + 97;
            out.push_back((char) code);
        }
        return out;
    }
};`,
  },

  // coin-change-ways — changeWays(coins: List[int], amount: int) -> int. Unbounded knapsack count.
  'pghub-b37-coin-change-ways': {
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
        for (int coin : coins)
            for (int a = coin; a <= amount; a++)
                dp[a] += dp[a - coin];
        return (int) dp[amount];
    }
};`,
  },

  // gift-distribution — maxPerChild(piles: List[int], children: int) -> int. Binary search on size.
  'pghub-b37-gift-distribution': {
    javascript: `var maxPerChild = function(piles, children) {
    const feasible = (x) => {
        let total = 0;
        for (const p of piles) {
            total += Math.floor(p / x);
            if (total >= children) return true;
        }
        return total >= children;
    };
    let lo = 1, hi = Math.max(...piles), ans = 0;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
};`,
    java: `class Solution {
    public int maxPerChild(int[] piles, int children) {
        int lo = 1, hi = 0, ans = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(piles, children, mid)) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
    private boolean feasible(int[] piles, int children, int x) {
        long total = 0;
        for (int p : piles) {
            total += p / x;
            if (total >= children) return true;
        }
        return total >= children;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPerChild(vector<int>& piles, int children) {
        int lo = 1, hi = 0, ans = 0;
        for (int p : piles) hi = max(hi, p);
        auto feasible = [&](int x) {
            long long total = 0;
            for (int p : piles) {
                total += p / x;
                if (total >= children) return true;
            }
            return total >= (long long)children;
        };
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(mid)) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }
};`,
  },

  // island-perimeter — shoreline(grid: List[List[int]]) -> int. Count exposed land edges.
  'pghub-b37-island-perimeter': {
    javascript: `var shoreline = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
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

  // meeting-overlap — maxConcurrent(meetings: List[List[int]]) -> int.
  // Sweep line; on ties an end (-1) sorts before a start (+1).
  'pghub-b37-meeting-overlap': {
    javascript: `var maxConcurrent = function(meetings) {
    const events = [];
    for (const [s, e] of meetings) {
        events.push([s, 1]);
        events.push([e, -1]);
    }
    events.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
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
        List<int[]> events = new ArrayList<>();
        for (int[] m : meetings) {
            events.add(new int[]{m[0], 1});
            events.add(new int[]{m[1], -1});
        }
        events.sort((a, b) -> (a[0] != b[0]) ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
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
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // package-merge — mergeWindows(windows: List[List[int]]) -> List[List[int]]. Sort + sweep merge.
  'pghub-b37-package-merge': {
    javascript: `var mergeWindows = function(windows) {
    const sorted = windows.slice().sort((a, b) => a[0] - b[0]);
    const merged = [[sorted[0][0], sorted[0][1]]];
    for (let i = 1; i < sorted.length; i++) {
        const [s, e] = sorted[i];
        const last = merged[merged.length - 1];
        if (s <= last[1]) last[1] = Math.max(last[1], e);
        else merged.push([s, e]);
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeWindows(int[][] windows) {
        int[][] sorted = windows.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        merged.add(new int[]{sorted[0][0], sorted[0][1]});
        for (int i = 1; i < sorted.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]);
            else merged.add(new int[]{sorted[i][0], sorted[i][1]});
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeWindows(vector<vector<int>>& windows) {
        vector<vector<int>> sorted = windows;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        merged.push_back(sorted[0]);
        for (size_t i = 1; i < sorted.size(); i++) {
            if (sorted[i][0] <= merged.back()[1])
                merged.back()[1] = max(merged.back()[1], sorted[i][1]);
            else
                merged.push_back(sorted[i]);
        }
        return merged;
    }
};`,
  },

  // power-set-size — distinctXorCount(nums: List[int]) -> int. Count distinct subset XORs.
  'pghub-b37-power-set-size': {
    javascript: `var distinctXorCount = function(nums) {
    let seen = new Set([0]);
    for (const x of nums) {
        const next = new Set(seen);
        for (const v of seen) next.add(v ^ x);
        seen = next;
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int distinctXorCount(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        seen.add(0);
        for (int x : nums) {
            Set<Integer> next = new HashSet<>(seen);
            for (int v : seen) next.add(v ^ x);
            seen = next;
        }
        return seen.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctXorCount(vector<int>& nums) {
        unordered_set<int> seen;
        seen.insert(0);
        for (int x : nums) {
            unordered_set<int> next(seen);
            for (int v : seen) next.insert(v ^ x);
            seen = next;
        }
        return (int)seen.size();
    }
};`,
  },

  // river-crossing — minHops(stones: List[int], reach: int) -> int. Greedy jump-game (positions).
  'pghub-b37-river-crossing': {
    javascript: `var minHops = function(stones, reach) {
    const n = stones.length;
    let jumps = 0, cur = 0;
    while (cur < n - 1) {
        let farthest = cur, nxt = cur;
        while (nxt + 1 < n && stones[nxt + 1] - stones[cur] <= reach) {
            nxt++;
            farthest = nxt;
        }
        if (farthest === cur) return -1;
        cur = farthest;
        jumps++;
    }
    return jumps;
};`,
    java: `class Solution {
    public int minHops(int[] stones, int reach) {
        int n = stones.length, jumps = 0, cur = 0;
        while (cur < n - 1) {
            int farthest = cur, nxt = cur;
            while (nxt + 1 < n && stones[nxt + 1] - stones[cur] <= reach) {
                nxt++;
                farthest = nxt;
            }
            if (farthest == cur) return -1;
            cur = farthest;
            jumps++;
        }
        return jumps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minHops(vector<int>& stones, int reach) {
        int n = stones.size(), jumps = 0, cur = 0;
        while (cur < n - 1) {
            int farthest = cur, nxt = cur;
            while (nxt + 1 < n && stones[nxt + 1] - stones[cur] <= reach) {
                nxt++;
                farthest = nxt;
            }
            if (farthest == cur) return -1;
            cur = farthest;
            jumps++;
        }
        return jumps;
    }
};`,
  },

  // server-load — maxWindowSum(load: List[int], w: int) -> int. Fixed-window max sum.
  'pghub-b37-server-load': {
    javascript: `var maxWindowSum = function(load, w) {
    const n = load.length;
    if (w >= n) return load.reduce((a, b) => a + b, 0);
    let cur = 0;
    for (let i = 0; i < w; i++) cur += load[i];
    let best = cur;
    for (let i = w; i < n; i++) {
        cur += load[i] - load[i - w];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int maxWindowSum(int[] load, int w) {
        int n = load.length;
        if (w >= n) {
            long s = 0;
            for (int x : load) s += x;
            return (int) s;
        }
        long cur = 0;
        for (int i = 0; i < w; i++) cur += load[i];
        long best = cur;
        for (int i = w; i < n; i++) {
            cur += load[i] - load[i - w];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxWindowSum(vector<int>& load, int w) {
        int n = load.size();
        if (w >= n) {
            long long s = 0;
            for (int x : load) s += x;
            return (int) s;
        }
        long long cur = 0;
        for (int i = 0; i < w; i++) cur += load[i];
        long long best = cur;
        for (int i = w; i < n; i++) {
            cur += load[i] - load[i - w];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
};`,
  },

  // task-cooldown — minIntervals(tasks: List[str], cooldown: int) -> int. Scheduling formula.
  'pghub-b37-task-cooldown': {
    javascript: `var minIntervals = function(tasks, cooldown) {
    const counts = new Map();
    for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
    let maxFreq = 0;
    for (const c of counts.values()) maxFreq = Math.max(maxFreq, c);
    let numMax = 0;
    for (const c of counts.values()) if (c === maxFreq) numMax++;
    const frame = (maxFreq - 1) * (cooldown + 1) + numMax;
    return Math.max(frame, tasks.length);
};`,
    java: `import java.util.*;
class Solution {
    public int minIntervals(String[] tasks, int cooldown) {
        Map<String, Integer> counts = new HashMap<>();
        for (String t : tasks) counts.merge(t, 1, Integer::sum);
        int maxFreq = 0;
        for (int c : counts.values()) maxFreq = Math.max(maxFreq, c);
        int numMax = 0;
        for (int c : counts.values()) if (c == maxFreq) numMax++;
        int frame = (maxFreq - 1) * (cooldown + 1) + numMax;
        return Math.max(frame, tasks.length);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minIntervals(vector<string>& tasks, int cooldown) {
        unordered_map<string, int> counts;
        for (auto& t : tasks) counts[t]++;
        int maxFreq = 0;
        for (auto& kv : counts) maxFreq = max(maxFreq, kv.second);
        int numMax = 0;
        for (auto& kv : counts) if (kv.second == maxFreq) numMax++;
        int frame = (maxFreq - 1) * (cooldown + 1) + numMax;
        return max(frame, (int)tasks.size());
    }
};`,
  },
};
