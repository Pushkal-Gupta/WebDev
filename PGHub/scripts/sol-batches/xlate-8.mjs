// xlate-8.mjs — translations of verified Python solutions to JS/Java/C++.
// Slice [210,240) of pyReal targets (sorted by id). Only missing langs emitted.
// Signatures match generateTemplate() exactly. Algorithms preserved faithfully.

export default {
  // minHandoffs(n: int, links: List[List[int]], start: int, finish: int) -> int — BFS shortest path.
  'pghub-b23-relay-baton': {
    javascript: `var minHandoffs = function(n, links, start, finish) {
    if (start === finish) return 0;
    const adj = Array.from({length: n}, () => []);
    for (const [a, b] of links) adj[a].push(b);
    const visited = new Array(n).fill(false);
    visited[start] = true;
    let q = [[start, 0]];
    let head = 0;
    while (head < q.length) {
        const [node, d] = q[head++];
        for (const nxt of adj[node]) {
            if (nxt === finish) return d + 1;
            if (!visited[nxt]) { visited[nxt] = true; q.push([nxt, d + 1]); }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minHandoffs(int n, int[][] links, int start, int finish) {
        if (start == finish) return 0;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : links) adj.get(e[0]).add(e[1]);
        boolean[] visited = new boolean[n];
        visited[start] = true;
        Deque<int[]> q = new ArrayDeque<>();
        q.add(new int[]{start, 0});
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int node = cur[0], d = cur[1];
            for (int nxt : adj.get(node)) {
                if (nxt == finish) return d + 1;
                if (!visited[nxt]) { visited[nxt] = true; q.add(new int[]{nxt, d + 1}); }
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minHandoffs(int n, vector<vector<int>>& links, int start, int finish) {
        if (start == finish) return 0;
        vector<vector<int>> adj(n);
        for (auto& e : links) adj[e[0]].push_back(e[1]);
        vector<bool> visited(n, false);
        visited[start] = true;
        queue<pair<int,int>> q;
        q.push({start, 0});
        while (!q.empty()) {
            auto [node, d] = q.front(); q.pop();
            for (int nxt : adj[node]) {
                if (nxt == finish) return d + 1;
                if (!visited[nxt]) { visited[nxt] = true; q.push({nxt, d + 1}); }
            }
        }
        return -1;
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int — best single buy/sell.
  'pghub-b23-stock-single-trade': {
    javascript: `var maxProfit = function(prices) {
    let minSoFar = Infinity, best = 0;
    for (const p of prices) {
        if (p < minSoFar) minSoFar = p;
        else if (p - minSoFar > best) best = p - minSoFar;
    }
    return best;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        int minSoFar = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            if (p < minSoFar) minSoFar = p;
            else if (p - minSoFar > best) best = p - minSoFar;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minSoFar = INT_MAX, best = 0;
        for (int p : prices) {
            if (p < minSoFar) minSoFar = p;
            else if (p - minSoFar > best) best = p - minSoFar;
        }
        return best;
    }
};`,
  },

  // canReach(vouchers: List[int], target: int) -> bool — subset-sum (bitset → bool DP).
  'pghub-b23-subsequence-sum-target': {
    javascript: `var canReach = function(vouchers, target) {
    if (target < 0) return false;
    const reachable = new Array(target + 1).fill(false);
    reachable[0] = true;
    for (const v of vouchers) {
        if (v <= target) {
            for (let s = target; s >= v; s--) {
                if (reachable[s - v]) reachable[s] = true;
            }
        }
    }
    return reachable[target];
};`,
    java: `class Solution {
    public boolean canReach(int[] vouchers, int target) {
        if (target < 0) return false;
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;
        for (int v : vouchers) {
            if (v <= target) {
                for (int s = target; s >= v; s--) {
                    if (reachable[s - v]) reachable[s] = true;
                }
            }
        }
        return reachable[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReach(vector<int>& vouchers, int target) {
        if (target < 0) return false;
        vector<char> reachable(target + 1, 0);
        reachable[0] = 1;
        for (int v : vouchers) {
            if (v <= target) {
                for (int s = target; s >= v; s--) {
                    if (reachable[s - v]) reachable[s] = 1;
                }
            }
        }
        return reachable[target] == 1;
    }
};`,
  },

  // minMutations(start: str, target: str, bank: List[str]) -> int — BFS gene mutation.
  'pghub-b23-word-ladder-bits': {
    javascript: `var minMutations = function(start, target, bank) {
    const bankSet = new Set(bank);
    if (!bankSet.has(target)) return -1;
    if (start === target) return 0;
    const visited = new Set([start]);
    const letters = "ACGT";
    let q = [[start, 0]];
    let head = 0;
    while (head < q.length) {
        const [gene, steps] = q[head++];
        for (let i = 0; i < gene.length; i++) {
            for (const ch of letters) {
                if (ch === gene[i]) continue;
                const nxt = gene.slice(0, i) + ch + gene.slice(i + 1);
                if (nxt === target) return steps + 1;
                if (bankSet.has(nxt) && !visited.has(nxt)) {
                    visited.add(nxt);
                    q.push([nxt, steps + 1]);
                }
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minMutations(String start, String target, String[] bank) {
        Set<String> bankSet = new HashSet<>(Arrays.asList(bank));
        if (!bankSet.contains(target)) return -1;
        if (start.equals(target)) return 0;
        Set<String> visited = new HashSet<>();
        visited.add(start);
        char[] letters = {'A', 'C', 'G', 'T'};
        Deque<Object[]> q = new ArrayDeque<>();
        q.add(new Object[]{start, 0});
        while (!q.isEmpty()) {
            Object[] cur = q.poll();
            String gene = (String) cur[0];
            int steps = (int) cur[1];
            for (int i = 0; i < gene.length(); i++) {
                for (char ch : letters) {
                    if (ch == gene.charAt(i)) continue;
                    String nxt = gene.substring(0, i) + ch + gene.substring(i + 1);
                    if (nxt.equals(target)) return steps + 1;
                    if (bankSet.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        q.add(new Object[]{nxt, steps + 1});
                    }
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
    int minMutations(string start, string target, vector<string>& bank) {
        unordered_set<string> bankSet(bank.begin(), bank.end());
        if (!bankSet.count(target)) return -1;
        if (start == target) return 0;
        unordered_set<string> visited;
        visited.insert(start);
        string letters = "ACGT";
        queue<pair<string,int>> q;
        q.push({start, 0});
        while (!q.empty()) {
            auto [gene, steps] = q.front(); q.pop();
            for (int i = 0; i < (int)gene.size(); i++) {
                for (char ch : letters) {
                    if (ch == gene[i]) continue;
                    string nxt = gene;
                    nxt[i] = ch;
                    if (nxt == target) return steps + 1;
                    if (bankSet.count(nxt) && !visited.count(nxt)) {
                        visited.insert(nxt);
                        q.push({nxt, steps + 1});
                    }
                }
            }
        }
        return -1;
    }
};`,
  },

  // canSplitFair(costs: List[int]) -> bool — equal partition (bitset → bool DP).
  'pghub-b24-budget-split': {
    javascript: `var canSplitFair = function(costs) {
    let total = 0;
    for (const c of costs) total += c;
    if (total % 2 !== 0) return false;
    const target = total / 2;
    const reachable = new Array(target + 1).fill(false);
    reachable[0] = true;
    for (const c of costs) {
        if (c <= target) {
            for (let s = target; s >= c; s--) {
                if (reachable[s - c]) reachable[s] = true;
            }
        }
    }
    return reachable[target];
};`,
    java: `class Solution {
    public boolean canSplitFair(int[] costs) {
        int total = 0;
        for (int c : costs) total += c;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;
        for (int c : costs) {
            if (c <= target) {
                for (int s = target; s >= c; s--) {
                    if (reachable[s - c]) reachable[s] = true;
                }
            }
        }
        return reachable[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitFair(vector<int>& costs) {
        int total = 0;
        for (int c : costs) total += c;
        if (total % 2 != 0) return false;
        int target = total / 2;
        vector<char> reachable(target + 1, 0);
        reachable[0] = 1;
        for (int c : costs) {
            if (c <= target) {
                for (int s = target; s >= c; s--) {
                    if (reachable[s - c]) reachable[s] = 1;
                }
            }
        }
        return reachable[target] == 1;
    }
};`,
  },

  // rollingShift(s: str, k: int) -> str — per-index Caesar shift.
  'pghub-b24-cipher-shift': {
    javascript: `var rollingShift = function(s, k) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const off = ((s.charCodeAt(i) - 97 + k + i) % 26 + 26) % 26;
        out += String.fromCharCode(97 + off);
    }
    return out;
};`,
    java: `class Solution {
    public String rollingShift(String s, int k) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            int off = (((s.charAt(i) - 97 + k + i) % 26) + 26) % 26;
            out.append((char) (97 + off));
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rollingShift(string s, int k) {
        string out;
        for (int i = 0; i < (int)s.size(); i++) {
            int off = (((s[i] - 97 + k + i) % 26) + 26) % 26;
            out += (char)(97 + off);
        }
        return out;
    }
};`,
  },

  // minTrips(weights: List[int], limit: int) -> int — two-pointer greedy boat.
  'pghub-b24-elevator-load': {
    javascript: `var minTrips = function(weights, limit) {
    const arr = weights.slice().sort((a, b) => a - b);
    let i = 0, j = arr.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && arr[i] + arr[j] <= limit) i++;
        j--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] weights, int limit) {
        int[] arr = weights.clone();
        Arrays.sort(arr);
        int i = 0, j = arr.length - 1, trips = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= limit) i++;
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
        vector<int> arr = weights;
        sort(arr.begin(), arr.end());
        int i = 0, j = (int)arr.size() - 1, trips = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // giftCodes(letters: str, length: int) -> List[str] — backtracking enumeration.
  'pghub-b24-gift-codes': {
    javascript: `var giftCodes = function(letters, length) {
    const out = [], cur = [];
    const build = (pos) => {
        if (pos === length) { out.push(cur.join('')); return; }
        for (const ch of letters) {
            cur.push(ch);
            build(pos + 1);
            cur.pop();
        }
    };
    build(0);
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public List<String> giftCodes(String letters, int length) {
        List<String> out = new ArrayList<>();
        build(letters, length, 0, new StringBuilder(), out);
        return out;
    }
    private void build(String letters, int length, int pos, StringBuilder cur, List<String> out) {
        if (pos == length) { out.add(cur.toString()); return; }
        for (int i = 0; i < letters.length(); i++) {
            cur.append(letters.charAt(i));
            build(letters, length, pos + 1, cur, out);
            cur.deleteCharAt(cur.length() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> giftCodes(string letters, int length) {
        vector<string> out;
        string cur;
        function<void(int)> build = [&](int pos) {
            if (pos == length) { out.push_back(cur); return; }
            for (char ch : letters) {
                cur.push_back(ch);
                build(pos + 1);
                cur.pop_back();
            }
        };
        build(0);
        return out;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int — shared-edge subtraction.
  'pghub-b24-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                perim += 4;
                if (r > 0 && grid[r-1][c] === 1) perim -= 2;
                if (c > 0 && grid[r][c-1] === 1) perim -= 2;
            }
        }
    }
    return perim;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r-1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perim -= 2;
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
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r-1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perim -= 2;
                }
            }
        }
        return perim;
    }
};`,
  },

  // escapeSteps(grid: List[List[int]]) -> int — BFS shortest path on grid.
  'pghub-b24-maze-escape': {
    javascript: `var escapeSteps = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    if (grid[0][0] === 1 || grid[rows-1][cols-1] === 1) return -1;
    if (rows === 1 && cols === 1) return 0;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    seen[0][0] = true;
    let q = [[0, 0, 0]];
    let head = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (head < q.length) {
        const [r, c, d] = q[head++];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] === 0) {
                if (nr === rows - 1 && nc === cols - 1) return d + 1;
                seen[nr][nc] = true;
                q.push([nr, nc, d + 1]);
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int escapeSteps(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        boolean[][] seen = new boolean[rows][cols];
        seen[0][0] = true;
        Deque<int[]> q = new ArrayDeque<>();
        q.add(new int[]{0, 0, 0});
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1], d = cur[2];
            for (int[] dd : dirs) {
                int nr = r + dd[0], nc = c + dd[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] == 0) {
                    if (nr == rows - 1 && nc == cols - 1) return d + 1;
                    seen[nr][nc] = true;
                    q.add(new int[]{nr, nc, d + 1});
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
    int escapeSteps(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        seen[0][0] = true;
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.empty()) {
            auto cur = q.front(); q.pop();
            int r = cur[0], c = cur[1], d = cur[2];
            for (auto& dd : dirs) {
                int nr = r + dd[0], nc = c + dd[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] == 0) {
                    if (nr == rows - 1 && nc == cols - 1) return d + 1;
                    seen[nr][nc] = true;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // maxHarvest(yields: List[int], k: int) -> int — fixed sliding window max sum.
  'pghub-b24-orchard-rows': {
    javascript: `var maxHarvest = function(yields, k) {
    const n = yields.length;
    if (k >= n) {
        let s = 0;
        for (const x of yields) s += x;
        return s;
    }
    let window = 0;
    for (let i = 0; i < k; i++) window += yields[i];
    let best = window;
    for (let i = k; i < n; i++) {
        window += yields[i] - yields[i - k];
        if (window > best) best = window;
    }
    return best;
};`,
    java: `class Solution {
    public int maxHarvest(int[] yields, int k) {
        int n = yields.length;
        if (k >= n) {
            int s = 0;
            for (int x : yields) s += x;
            return s;
        }
        int window = 0;
        for (int i = 0; i < k; i++) window += yields[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += yields[i] - yields[i - k];
            if (window > best) best = window;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxHarvest(vector<int>& yields, int k) {
        int n = yields.size();
        if (k >= n) {
            int s = 0;
            for (int x : yields) s += x;
            return s;
        }
        int window = 0;
        for (int i = 0; i < k; i++) window += yields[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += yields[i] - yields[i - k];
            if (window > best) best = window;
        }
        return best;
    }
};`,
  },

  // paintWays(posts: int, colors: int) -> int — paint-fence DP under MOD.
  'pghub-b24-paint-fence': {
    javascript: `var paintWays = function(posts, colors) {
    const MOD = 1000000007n;
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

  // reverseRelay(order: List[int]) -> List[int] — reverse the sequence.
  'pghub-b24-relay-baton': {
    javascript: `var reverseRelay = function(order) {
    const out = [];
    for (let i = order.length - 1; i >= 0; i--) out.push(order[i]);
    return out;
};`,
    java: `class Solution {
    public int[] reverseRelay(int[] order) {
        int n = order.length;
        int[] out = new int[n];
        for (int i = 0; i < n; i++) out[i] = order[n - 1 - i];
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reverseRelay(vector<int>& order) {
        vector<int> out(order.rbegin(), order.rend());
        return out;
    }
};`,
  },

  // runningMedians(samples: List[int]) -> List[int] — two heaps, lower median.
  'pghub-b24-server-uptime': {
    javascript: `var runningMedians = function(samples) {
    // low: max-heap (smaller half), high: min-heap (larger half).
    const low = [], high = [];
    const swim = (h, i, cmp) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (cmp(h[i], h[p]) < 0) { [h[i], h[p]] = [h[p], h[i]]; i = p; } else break;
        }
    };
    const sink = (h, cmp) => {
        let i = 0;
        const n = h.length;
        while (true) {
            let l = 2*i+1, r = 2*i+2, m = i;
            if (l < n && cmp(h[l], h[m]) < 0) m = l;
            if (r < n && cmp(h[r], h[m]) < 0) m = r;
            if (m === i) break;
            [h[i], h[m]] = [h[m], h[i]]; i = m;
        }
    };
    const push = (h, v, cmp) => { h.push(v); swim(h, h.length - 1, cmp); };
    const pop = (h, cmp) => { const t = h[0]; const last = h.pop(); if (h.length) { h[0] = last; sink(h, cmp); } return t; };
    const maxCmp = (a, b) => b - a; // max-heap
    const minCmp = (a, b) => a - b; // min-heap
    const out = [];
    for (const x of samples) {
        if (low.length === 0 || x <= low[0]) push(low, x, maxCmp);
        else push(high, x, minCmp);
        if (low.length > high.length + 1) push(high, pop(low, maxCmp), minCmp);
        else if (high.length > low.length) push(low, pop(high, minCmp), maxCmp);
        out.push(low[0]);
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] runningMedians(int[] samples) {
        PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
        PriorityQueue<Integer> high = new PriorityQueue<>();
        int[] out = new int[samples.length];
        for (int i = 0; i < samples.length; i++) {
            int x = samples[i];
            if (low.isEmpty() || x <= low.peek()) low.offer(x);
            else high.offer(x);
            if (low.size() > high.size() + 1) high.offer(low.poll());
            else if (high.size() > low.size()) low.offer(high.poll());
            out[i] = low.peek();
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> runningMedians(vector<int>& samples) {
        priority_queue<int> low;                              // max-heap, smaller half
        priority_queue<int, vector<int>, greater<int>> high; // min-heap, larger half
        vector<int> out;
        for (int x : samples) {
            if (low.empty() || x <= low.top()) low.push(x);
            else high.push(x);
            if (low.size() > high.size() + 1) { high.push(low.top()); low.pop(); }
            else if (high.size() > low.size()) { low.push(high.top()); high.pop(); }
            out.push_back(low.top());
        }
        return out;
    }
};`,
  },

  // countVisible(heights: List[int]) -> int — running-max counter.
  'pghub-b24-skyline-peaks': {
    javascript: `var countVisible = function(heights) {
    let count = 0, tallest = -Infinity;
    for (const h of heights) {
        if (h > tallest) { count++; tallest = h; }
    }
    return count;
};`,
    java: `class Solution {
    public int countVisible(int[] heights) {
        int count = 0;
        long tallest = Long.MIN_VALUE;
        for (int h : heights) {
            if (h > tallest) { count++; tallest = h; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countVisible(vector<int>& heights) {
        int count = 0;
        long long tallest = LLONG_MIN;
        for (int h : heights) {
            if (h > tallest) { count++; tallest = h; }
        }
        return count;
    }
};`,
  },

  // fullBatches(tickets: List[int], size: int) -> int — sum of floor divisions.
  'pghub-b24-ticket-batches': {
    javascript: `var fullBatches = function(tickets, size) {
    let total = 0;
    for (const t of tickets) total += Math.floor(t / size);
    return total;
};`,
    java: `class Solution {
    public int fullBatches(int[] tickets, int size) {
        int total = 0;
        for (int t : tickets) total += t / size;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int fullBatches(vector<int>& tickets, int size) {
        int total = 0;
        for (int t : tickets) total += t / size;
        return total;
    }
};`,
  },

  // cheapestWithStops(n, roads: List[List[int]], src, dst, maxStops) -> int — Bellman-Ford bounded.
  'pghub-b24-toll-roads': {
    javascript: `var cheapestWithStops = function(n, roads, src, dst, maxStops) {
    const INF = Infinity;
    let dist = new Array(n).fill(INF);
    dist[src] = 0;
    for (let it = 0; it <= maxStops; it++) {
        const nxt = dist.slice();
        for (const [u, v, w] of roads) {
            if (dist[u] !== INF && dist[u] + w < nxt[v]) nxt[v] = dist[u] + w;
        }
        dist = nxt;
    }
    return dist[dst] !== INF ? dist[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int cheapestWithStops(int n, int[][] roads, int src, int dst, int maxStops) {
        final int INF = Integer.MAX_VALUE;
        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        for (int it = 0; it <= maxStops; it++) {
            int[] nxt = dist.clone();
            for (int[] r : roads) {
                int u = r[0], v = r[1], w = r[2];
                if (dist[u] != INF && dist[u] + w < nxt[v]) nxt[v] = dist[u] + w;
            }
            dist = nxt;
        }
        return dist[dst] != INF ? dist[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestWithStops(int n, vector<vector<int>>& roads, int src, int dst, int maxStops) {
        const int INF = INT_MAX;
        vector<int> dist(n, INF);
        dist[src] = 0;
        for (int it = 0; it <= maxStops; it++) {
            vector<int> nxt = dist;
            for (auto& r : roads) {
                int u = r[0], v = r[1], w = r[2];
                if (dist[u] != INF && dist[u] + w < nxt[v]) nxt[v] = dist[u] + w;
            }
            dist = nxt;
        }
        return dist[dst] != INF ? dist[dst] : -1;
    }
};`,
  },

  // longestVowelRun(s: str) -> int — longest consecutive vowel run.
  'pghub-b24-vowel-runs': {
    javascript: `var longestVowelRun = function(s) {
    const vowels = new Set(['a','e','i','o','u']);
    let best = 0, cur = 0;
    for (const ch of s) {
        if (vowels.has(ch)) { cur++; if (cur > best) best = cur; }
        else cur = 0;
    }
    return best;
};`,
    java: `class Solution {
    public int longestVowelRun(String s) {
        String vowels = "aeiou";
        int best = 0, cur = 0;
        for (int i = 0; i < s.length(); i++) {
            if (vowels.indexOf(s.charAt(i)) >= 0) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestVowelRun(string s) {
        string vowels = "aeiou";
        int best = 0, cur = 0;
        for (char ch : s) {
            if (vowels.find(ch) != string::npos) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
};`,
  },

  // minBinSize(items: List[int], bins: int) -> int — binary search on capacity.
  'pghub-b24-warehouse-bins': {
    javascript: `var minBinSize = function(items, bins) {
    const needed = (cap) => {
        let used = 1, cur = 0;
        for (const x of items) {
            if (cur + x > cap) { used++; cur = x; }
            else cur += x;
        }
        return used;
    };
    let lo = Math.max(...items);
    let hi = items.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= bins) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minBinSize(int[] items, int bins) {
        int lo = 0;
        long sum = 0;
        for (int x : items) { lo = Math.max(lo, x); sum += x; }
        long hi = sum;
        long l = lo;
        while (l < hi) {
            long mid = (l + hi) / 2;
            if (needed(items, mid) <= bins) hi = mid;
            else l = mid + 1;
        }
        return (int) l;
    }
    private int needed(int[] items, long cap) {
        int used = 1;
        long cur = 0;
        for (int x : items) {
            if (cur + x > cap) { used++; cur = x; }
            else cur += x;
        }
        return used;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minBinSize(vector<int>& items, int bins) {
        long long lo = 0, hi = 0;
        for (int x : items) { lo = max(lo, (long long)x); hi += x; }
        auto needed = [&](long long cap) {
            int used = 1;
            long long cur = 0;
            for (int x : items) {
                if (cur + x > cap) { used++; cur = x; }
                else cur += x;
            }
            return used;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= bins) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // cycleLength(next_belt: List[int]) -> int — Floyd cycle detection.
  'pghub-b25-conveyor-cycle': {
    javascript: `var cycleLength = function(next_belt) {
    let slow = 0, fast = 0;
    while (true) {
        if (next_belt[fast] === -1) return 0;
        fast = next_belt[fast];
        if (next_belt[fast] === -1) return 0;
        fast = next_belt[fast];
        slow = next_belt[slow];
        if (slow === fast) break;
    }
    let length = 1;
    let cur = next_belt[slow];
    while (cur !== slow) { cur = next_belt[cur]; length++; }
    return length;
};`,
    java: `class Solution {
    public int cycleLength(int[] next_belt) {
        int slow = 0, fast = 0;
        while (true) {
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            slow = next_belt[slow];
            if (slow == fast) break;
        }
        int length = 1;
        int cur = next_belt[slow];
        while (cur != slow) { cur = next_belt[cur]; length++; }
        return length;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cycleLength(vector<int>& next_belt) {
        int slow = 0, fast = 0;
        while (true) {
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            if (next_belt[fast] == -1) return 0;
            fast = next_belt[fast];
            slow = next_belt[slow];
            if (slow == fast) break;
        }
        int length = 1;
        int cur = next_belt[slow];
        while (cur != slow) { cur = next_belt[cur]; length++; }
        return length;
    }
};`,
  },

  // reachableFloors(floors: int, up: int, down: int) -> int — DFS flood fill.
  'pghub-b25-elevator-floors': {
    javascript: `var reachableFloors = function(floors, up, down) {
    const seen = new Array(floors).fill(false);
    seen[0] = true;
    const stack = [0];
    let count = 1;
    while (stack.length) {
        const f = stack.pop();
        for (const nf of [f + up, f - down]) {
            if (nf >= 0 && nf < floors && !seen[nf]) {
                seen[nf] = true;
                count++;
                stack.push(nf);
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int reachableFloors(int floors, int up, int down) {
        boolean[] seen = new boolean[floors];
        seen[0] = true;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        int count = 1;
        while (!stack.isEmpty()) {
            int f = stack.pop();
            int[] cand = {f + up, f - down};
            for (int nf : cand) {
                if (nf >= 0 && nf < floors && !seen[nf]) {
                    seen[nf] = true;
                    count++;
                    stack.push(nf);
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
    int reachableFloors(int floors, int up, int down) {
        vector<bool> seen(floors, false);
        seen[0] = true;
        vector<int> stack = {0};
        int count = 1;
        while (!stack.empty()) {
            int f = stack.back(); stack.pop_back();
            for (int nf : {f + up, f - down}) {
                if (nf >= 0 && nf < floors && !seen[nf]) {
                    seen[nf] = true;
                    count++;
                    stack.push_back(nf);
                }
            }
        }
        return count;
    }
};`,
  },

  // minTrips(weights: List[int], cap: int) -> int — sequential greedy loading.
  'pghub-b25-ferry-loading': {
    javascript: `var minTrips = function(weights, cap) {
    let trips = 1, load = 0;
    for (const w of weights) {
        if (load + w <= cap) load += w;
        else { trips++; load = w; }
    }
    return trips;
};`,
    java: `class Solution {
    public int minTrips(int[] weights, int cap) {
        int trips = 1, load = 0;
        for (int w : weights) {
            if (load + w <= cap) load += w;
            else { trips++; load = w; }
        }
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int cap) {
        int trips = 1, load = 0;
        for (int w : weights) {
            if (load + w <= cap) load += w;
            else { trips++; load = w; }
        }
        return trips;
    }
};`,
  },

  // lastSeated(rows: int, order: List[int]) -> int — min-heap of (count, row).
  'pghub-b25-festival-seats': {
    javascript: `var lastSeated = function(rows, order) {
    // min-heap keyed by (count, row).
    const heap = [];
    for (let r = 0; r < rows; r++) heap.push([0, r]);
    const cmp = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);
    const swim = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (cmp(heap[i], heap[p]) < 0) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } else break;
        }
    };
    const sink = (i) => {
        const n = heap.length;
        while (true) {
            let l = 2*i+1, r = 2*i+2, m = i;
            if (l < n && cmp(heap[l], heap[m]) < 0) m = l;
            if (r < n && cmp(heap[r], heap[m]) < 0) m = r;
            if (m === i) break;
            [heap[i], heap[m]] = [heap[m], heap[i]]; i = m;
        }
    };
    for (let i = Math.floor(rows / 2) - 1; i >= 0; i--) sink(i);
    let last = -1;
    for (let i = 0; i < order.length; i++) {
        const top = heap[0];
        last = top[1];
        heap[0] = [top[0] + 1, top[1]];
        sink(0);
    }
    return last;
};`,
    java: `import java.util.*;
class Solution {
    public int lastSeated(int rows, int[] order) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
            a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        for (int r = 0; r < rows; r++) heap.offer(new int[]{0, r});
        int last = -1;
        for (int i = 0; i < order.length; i++) {
            int[] top = heap.poll();
            last = top[1];
            heap.offer(new int[]{top[0] + 1, top[1]});
        }
        return last;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastSeated(int rows, vector<int>& order) {
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> heap;
        for (int r = 0; r < rows; r++) heap.push({0, r});
        int last = -1;
        for (size_t i = 0; i < order.size(); i++) {
            auto top = heap.top(); heap.pop();
            last = top.second;
            heap.push({top.first + 1, top.second});
        }
        return last;
    }
};`,
  },

  // escapeRoutes(grid: List[List[int]]) -> int — unique-paths DP with walls, MOD.
  'pghub-b25-grid-escape': {
    javascript: `var escapeRoutes = function(grid) {
    const MOD = 1000000007;
    const rows = grid.length, cols = grid[0].length;
    if (grid[0][0] === 1 || grid[rows-1][cols-1] === 1) return 0;
    const dp = new Array(cols).fill(0);
    dp[0] = 1;
    for (let r = 0; r < rows; r++) {
        if (grid[r][0] === 1) dp[0] = 0;
        for (let c = 1; c < cols; c++) {
            if (grid[r][c] === 1) dp[c] = 0;
            else dp[c] = (dp[c] + dp[c-1]) % MOD;
        }
    }
    return dp[cols-1];
};`,
    java: `class Solution {
    public int escapeRoutes(int[][] grid) {
        final long MOD = 1000000007L;
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return 0;
        long[] dp = new long[cols];
        dp[0] = 1;
        for (int r = 0; r < rows; r++) {
            if (grid[r][0] == 1) dp[0] = 0;
            for (int c = 1; c < cols; c++) {
                if (grid[r][c] == 1) dp[c] = 0;
                else dp[c] = (dp[c] + dp[c-1]) % MOD;
            }
        }
        return (int) dp[cols-1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int escapeRoutes(vector<vector<int>>& grid) {
        const long long MOD = 1000000007LL;
        int rows = grid.size(), cols = grid[0].size();
        if (grid[0][0] == 1 || grid[rows-1][cols-1] == 1) return 0;
        vector<long long> dp(cols, 0);
        dp[0] = 1;
        for (int r = 0; r < rows; r++) {
            if (grid[r][0] == 1) dp[0] = 0;
            for (int c = 1; c < cols; c++) {
                if (grid[r][c] == 1) dp[c] = 0;
                else dp[c] = (dp[c] + dp[c-1]) % MOD;
            }
        }
        return (int) dp[cols-1];
    }
};`,
  },

  // orchardDiameter(n: int, edges: List[List[int]]) -> int — double BFS tree diameter.
  'pghub-b25-orchard-prune': {
    javascript: `var orchardDiameter = function(n, edges) {
    if (n === 1) return 0;
    const adj = Array.from({length: n}, () => []);
    for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
    const bfs = (src) => {
        const dist = new Array(n).fill(-1);
        dist[src] = 0;
        let q = [src], head = 0, far = src;
        while (head < q.length) {
            const u = q[head++];
            for (const v of adj[u]) {
                if (dist[v] === -1) {
                    dist[v] = dist[u] + 1;
                    if (dist[v] > dist[far]) far = v;
                    q.push(v);
                }
            }
        }
        return [far, dist[far]];
    };
    const [a] = bfs(0);
    const [, d] = bfs(a);
    return d;
};`,
    java: `import java.util.*;
class Solution {
    private List<List<Integer>> adj;
    private int n;
    public int orchardDiameter(int n, int[][] edges) {
        if (n == 1) return 0;
        this.n = n;
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] first = bfs(0);
        int[] second = bfs(first[0]);
        return second[1];
    }
    private int[] bfs(int src) {
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[src] = 0;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(src);
        int far = src;
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    if (dist[v] > dist[far]) far = v;
                    q.add(v);
                }
            }
        }
        return new int[]{far, dist[far]};
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int orchardDiameter(int n, vector<vector<int>>& edges) {
        if (n == 1) return 0;
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        auto bfs = [&](int src) -> pair<int,int> {
            vector<int> dist(n, -1);
            dist[src] = 0;
            queue<int> q; q.push(src);
            int far = src;
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int v : adj[u]) {
                    if (dist[v] == -1) {
                        dist[v] = dist[u] + 1;
                        if (dist[v] > dist[far]) far = v;
                        q.push(v);
                    }
                }
            }
            return {far, dist[far]};
        };
        auto first = bfs(0);
        auto second = bfs(first.first);
        return second.second;
    }
};`,
  },

  // paintedLength(strokes: List[List[int]]) -> int — merge intervals, sum coverage.
  'pghub-b25-paint-rollers': {
    javascript: `var paintedLength = function(strokes) {
    const arr = strokes.map(s => s.slice()).sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    let total = 0;
    let curLo = arr[0][0], curHi = arr[0][1];
    for (let i = 1; i < arr.length; i++) {
        const [lo, hi] = arr[i];
        if (lo <= curHi) {
            if (hi > curHi) curHi = hi;
        } else {
            total += curHi - curLo;
            curLo = lo; curHi = hi;
        }
    }
    total += curHi - curLo;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int paintedLength(int[][] strokes) {
        int[][] arr = new int[strokes.length][];
        for (int i = 0; i < strokes.length; i++) arr[i] = strokes[i].clone();
        Arrays.sort(arr, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int total = 0;
        int curLo = arr[0][0], curHi = arr[0][1];
        for (int i = 1; i < arr.length; i++) {
            int lo = arr[i][0], hi = arr[i][1];
            if (lo <= curHi) {
                if (hi > curHi) curHi = hi;
            } else {
                total += curHi - curLo;
                curLo = lo; curHi = hi;
            }
        }
        total += curHi - curLo;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintedLength(vector<vector<int>>& strokes) {
        vector<vector<int>> arr = strokes;
        sort(arr.begin(), arr.end());
        int total = 0;
        int curLo = arr[0][0], curHi = arr[0][1];
        for (size_t i = 1; i < arr.size(); i++) {
            int lo = arr[i][0], hi = arr[i][1];
            if (lo <= curHi) {
                if (hi > curHi) curHi = hi;
            } else {
                total += curHi - curLo;
                curLo = lo; curHi = hi;
            }
        }
        total += curHi - curLo;
        return total;
    }
};`,
  },

  // countDrops(lanes: List[int]) -> int — count descents.
  'pghub-b25-relay-baton': {
    javascript: `var countDrops = function(lanes) {
    let drops = 0;
    for (let i = 1; i < lanes.length; i++) {
        if (lanes[i] < lanes[i-1]) drops++;
    }
    return drops;
};`,
    java: `class Solution {
    public int countDrops(int[] lanes) {
        int drops = 0;
        for (int i = 1; i < lanes.length; i++) {
            if (lanes[i] < lanes[i-1]) drops++;
        }
        return drops;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countDrops(vector<int>& lanes) {
        int drops = 0;
        for (size_t i = 1; i < lanes.size(); i++) {
            if (lanes[i] < lanes[i-1]) drops++;
        }
        return drops;
    }
};`,
  },

  // longestRun(stock: List[int], k: int) -> int — sliding window, at most k zeros.
  'pghub-b25-shelf-stock': {
    javascript: `var longestRun = function(stock, k) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < stock.length; right++) {
        if (stock[right] === 0) zeros++;
        while (zeros > k) {
            if (stock[left] === 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestRun(int[] stock, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < stock.length; right++) {
            if (stock[right] == 0) zeros++;
            while (zeros > k) {
                if (stock[left] == 0) zeros--;
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
    int longestRun(vector<int>& stock, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)stock.size(); right++) {
            if (stock[right] == 0) zeros++;
            while (zeros > k) {
                if (stock[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // sparseDot(a: List[int], b: List[int]) -> int — non-zero dot product.
  'pghub-b25-sparse-dot': {
    javascript: `var sparseDot = function(a, b) {
    let total = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== 0 && b[i] !== 0) total += a[i] * b[i];
    }
    return total;
};`,
    java: `class Solution {
    public int sparseDot(int[] a, int[] b) {
        long total = 0;
        for (int i = 0; i < a.length; i++) {
            if (a[i] != 0 && b[i] != 0) total += (long) a[i] * b[i];
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sparseDot(vector<int>& a, vector<int>& b) {
        long long total = 0;
        for (size_t i = 0; i < a.size(); i++) {
            if (a[i] != 0 && b[i] != 0) total += (long long) a[i] * b[i];
        }
        return (int) total;
    }
};`,
  },

  // totalXorSum(codes: List[int]) -> int — OR(codes) * 2^(n-1).
  'pghub-b25-spy-codes': {
    javascript: `var totalXorSum = function(codes) {
    const n = codes.length;
    let orAll = 0;
    for (const c of codes) orAll |= c;
    return orAll * Math.pow(2, n - 1);
};`,
    java: `class Solution {
    public int totalXorSum(int[] codes) {
        int n = codes.length;
        long orAll = 0;
        for (int c : codes) orAll |= c;
        return (int) (orAll * (1L << (n - 1)));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalXorSum(vector<int>& codes) {
        int n = codes.size();
        long long orAll = 0;
        for (int c : codes) orAll |= c;
        return (int) (orAll * (1LL << (n - 1)));
    }
};`,
  },
};
