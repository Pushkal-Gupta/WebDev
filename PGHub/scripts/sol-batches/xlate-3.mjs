// xlate-3.mjs — translations of verified Python solutions → JS / Java / C++.
// Slice [60,90) of solutions-backfill-targets.json (pyReal && missingLangs).
// Each slug carries ONLY its missing languages (all three: javascript/java/cpp;
// python is already present in the DB). Signatures match
// generateTemplate(language, method_name, params, return_type) from
// src/lib/driverCode.js exactly. Graded by backfill-solutions.mjs before write.
//
// SKIPPED: pghub-b15-rolling-median — return_type is List[float], which the
// driver's template/serializer does not support (it emits an invalid
// `List[float]` Java/C++ type and has no jsonify path for it). Ungradeable.

export default {
  // reachableHubs(n: int, roads: List[List[int]], start: int) -> int  — BFS reach count.
  'pghub-b13-courier-routes': {
    javascript: `var reachableHubs = function(n, roads, start) {
    const adj = new Map();
    for (const [u, v] of roads) {
        if (!adj.has(u)) adj.set(u, []);
        adj.get(u).push(v);
    }
    const seen = new Set([start]);
    const q = [start];
    let head = 0;
    while (head < q.length) {
        const node = q[head++];
        for (const nxt of (adj.get(node) || [])) {
            if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }
        }
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int reachableHubs(int n, int[][] roads, int start) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        for (int[] r : roads) adj.computeIfAbsent(r[0], k -> new ArrayList<>()).add(r[1]);
        Set<Integer> seen = new HashSet<>();
        seen.add(start);
        Deque<Integer> q = new ArrayDeque<>();
        q.add(start);
        while (!q.isEmpty()) {
            int node = q.poll();
            for (int nxt : adj.getOrDefault(node, Collections.emptyList())) {
                if (seen.add(nxt)) q.add(nxt);
            }
        }
        return seen.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableHubs(int n, vector<vector<int>>& roads, int start) {
        unordered_map<int, vector<int>> adj;
        for (auto& r : roads) adj[r[0]].push_back(r[1]);
        unordered_set<int> seen{start};
        queue<int> q;
        q.push(start);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            for (int nxt : adj[node]) {
                if (!seen.count(nxt)) { seen.insert(nxt); q.push(nxt); }
            }
        }
        return (int)seen.size();
    }
};`,
  },

  // minSeatGap(groups: List[int], rooms: int) -> int  — min-heap load balancing.
  'pghub-b13-festival-seats': {
    javascript: `var minSeatGap = function(groups, rooms) {
    const heap = new Array(rooms).fill(0);
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
    for (const g of groups) {
        const smallest = heap[0];
        heap[0] = smallest + g;
        down(0);
    }
    return Math.max(...heap) - Math.min(...heap);
};`,
    java: `import java.util.*;
class Solution {
    public int minSeatGap(int[] groups, int rooms) {
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int i = 0; i < rooms; i++) heap.add(0L);
        for (int g : groups) {
            long smallest = heap.poll();
            heap.add(smallest + g);
        }
        long mx = Long.MIN_VALUE, mn = Long.MAX_VALUE;
        for (long load : heap) { mx = Math.max(mx, load); mn = Math.min(mn, load); }
        return (int)(mx - mn);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSeatGap(vector<int>& groups, int rooms) {
        priority_queue<long long, vector<long long>, greater<long long>> heap;
        for (int i = 0; i < rooms; i++) heap.push(0);
        vector<long long> loads;
        for (int g : groups) {
            long long smallest = heap.top(); heap.pop();
            heap.push(smallest + g);
        }
        while (!heap.empty()) { loads.push_back(heap.top()); heap.pop(); }
        long long mx = *max_element(loads.begin(), loads.end());
        long long mn = *min_element(loads.begin(), loads.end());
        return (int)(mx - mn);
    }
};`,
  },

  // countSetAfter(value: int, toggles: List[int]) -> int  — XOR bit masks, popcount.
  'pghub-b13-flag-masks': {
    javascript: `var countSetAfter = function(value, toggles) {
    let v = BigInt(value);
    for (const b of toggles) v ^= (1n << BigInt(b));
    let count = 0;
    while (v > 0n) { count += Number(v & 1n); v >>= 1n; }
    return count;
};`,
    java: `class Solution {
    public int countSetAfter(int value, int[] toggles) {
        long v = value;
        for (int b : toggles) v ^= (1L << b);
        return Long.bitCount(v);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSetAfter(int value, vector<int>& toggles) {
        long long v = value;
        for (int b : toggles) v ^= (1LL << b);
        return __builtin_popcountll((unsigned long long)v);
    }
};`,
  },

  // typingCost(word: str) -> int  — keypad press cost sum.
  'pghub-b13-keypad-words': {
    javascript: `var typingCost = function(word) {
    const groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
    const cost = {};
    for (const g of groups) {
        for (let i = 0; i < g.length; i++) cost[g[i]] = i + 1;
    }
    let total = 0;
    for (const c of word) total += cost[c];
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int typingCost(String word) {
        String[] groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        Map<Character, Integer> cost = new HashMap<>();
        for (String g : groups)
            for (int i = 0; i < g.length(); i++) cost.put(g.charAt(i), i + 1);
        int total = 0;
        for (char c : word.toCharArray()) total += cost.get(c);
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int typingCost(string word) {
        vector<string> groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        unordered_map<char, int> cost;
        for (auto& g : groups)
            for (int i = 0; i < (int)g.size(); i++) cost[g[i]] = i + 1;
        int total = 0;
        for (char c : word) total += cost[c];
        return total;
    }
};`,
  },

  // minToll(grid: List[List[int]]) -> int  — min-path-sum DP.
  'pghub-b13-lattice-paths': {
    javascript: `var minToll = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const best = grid[r][c];
            if (r === 0 && c === 0) dp[r][c] = best;
            else if (r === 0) dp[r][c] = best + dp[r][c - 1];
            else if (c === 0) dp[r][c] = best + dp[r - 1][c];
            else dp[r][c] = best + Math.min(dp[r - 1][c], dp[r][c - 1]);
        }
    }
    return dp[rows - 1][cols - 1];
};`,
    java: `class Solution {
    public int minToll(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dp = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int best = grid[r][c];
                if (r == 0 && c == 0) dp[r][c] = best;
                else if (r == 0) dp[r][c] = best + dp[r][c - 1];
                else if (c == 0) dp[r][c] = best + dp[r - 1][c];
                else dp[r][c] = best + Math.min(dp[r - 1][c], dp[r][c - 1]);
            }
        }
        return dp[rows - 1][cols - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minToll(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> dp(rows, vector<int>(cols, 0));
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int best = grid[r][c];
                if (r == 0 && c == 0) dp[r][c] = best;
                else if (r == 0) dp[r][c] = best + dp[r][c - 1];
                else if (c == 0) dp[r][c] = best + dp[r - 1][c];
                else dp[r][c] = best + min(dp[r - 1][c], dp[r][c - 1]);
            }
        }
        return dp[rows - 1][cols - 1];
    }
};`,
  },

  // longestRise(notes: List[int]) -> int  — longest strictly increasing run.
  'pghub-b13-melody-runs': {
    javascript: `var longestRise = function(notes) {
    let best = 1, cur = 1;
    for (let i = 1; i < notes.length; i++) {
        if (notes[i] > notes[i - 1]) { cur++; if (cur > best) best = cur; }
        else cur = 1;
    }
    return best;
};`,
    java: `class Solution {
    public int longestRise(int[] notes) {
        int best = 1, cur = 1;
        for (int i = 1; i < notes.length; i++) {
            if (notes[i] > notes[i - 1]) { cur++; if (cur > best) best = cur; }
            else cur = 1;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRise(vector<int>& notes) {
        int best = 1, cur = 1;
        for (int i = 1; i < (int)notes.size(); i++) {
            if (notes[i] > notes[i - 1]) { cur++; if (cur > best) best = cur; }
            else cur = 1;
        }
        return best;
    }
};`,
  },

  // totalHarvested(spans: List[List[int]]) -> int  — merge touching ranges, sum sizes.
  'pghub-b13-orchard-spans': {
    javascript: `var totalHarvested = function(spans) {
    spans = spans.map(s => s.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let total = 0;
    let curStart = spans[0][0], curEnd = spans[0][1];
    for (let i = 1; i < spans.length; i++) {
        const [s, e] = spans[i];
        if (s <= curEnd + 1) curEnd = Math.max(curEnd, e);
        else { total += curEnd - curStart + 1; curStart = s; curEnd = e; }
    }
    total += curEnd - curStart + 1;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int totalHarvested(int[][] spans) {
        Arrays.sort(spans, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int total = 0;
        int curStart = spans[0][0], curEnd = spans[0][1];
        for (int i = 1; i < spans.length; i++) {
            int s = spans[i][0], e = spans[i][1];
            if (s <= curEnd + 1) curEnd = Math.max(curEnd, e);
            else { total += curEnd - curStart + 1; curStart = s; curEnd = e; }
        }
        total += curEnd - curStart + 1;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalHarvested(vector<vector<int>>& spans) {
        sort(spans.begin(), spans.end());
        int total = 0;
        int curStart = spans[0][0], curEnd = spans[0][1];
        for (size_t i = 1; i < spans.size(); i++) {
            int s = spans[i][0], e = spans[i][1];
            if (s <= curEnd + 1) curEnd = max(curEnd, e);
            else { total += curEnd - curStart + 1; curStart = s; curEnd = e; }
        }
        total += curEnd - curStart + 1;
        return total;
    }
};`,
  },

  // countPrimes(lengths: List[int]) -> int  — trial-division primality count.
  'pghub-b13-prime-fence': {
    javascript: `var countPrimes = function(lengths) {
    const isPrime = (x) => {
        if (x < 2) return false;
        if (x < 4) return true;
        if (x % 2 === 0) return false;
        for (let d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
        return true;
    };
    let count = 0;
    for (const x of lengths) if (isPrime(x)) count++;
    return count;
};`,
    java: `class Solution {
    public int countPrimes(int[] lengths) {
        int count = 0;
        for (int x : lengths) if (isPrime(x)) count++;
        return count;
    }
    private boolean isPrime(int x) {
        if (x < 2) return false;
        if (x < 4) return true;
        if (x % 2 == 0) return false;
        for (int d = 3; (long) d * d <= x; d += 2) if (x % d == 0) return false;
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimes(vector<int>& lengths) {
        auto isPrime = [](int x) {
            if (x < 2) return false;
            if (x < 4) return true;
            if (x % 2 == 0) return false;
            for (long long d = 3; d * d <= x; d += 2) if (x % d == 0) return false;
            return true;
        };
        int count = 0;
        for (int x : lengths) if (isPrime(x)) count++;
        return count;
    }
};`,
  },

  // strongestWindow(signal: List[int], k: int) -> int  — max sliding-window sum.
  'pghub-b13-signal-decay': {
    javascript: `var strongestWindow = function(signal, k) {
    const n = signal.length;
    if (k >= n) return signal.reduce((a, b) => a + b, 0);
    let cur = 0;
    for (let i = 0; i < k; i++) cur += signal[i];
    let best = cur;
    for (let i = k; i < n; i++) {
        cur += signal[i] - signal[i - k];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int strongestWindow(int[] signal, int k) {
        int n = signal.length;
        if (k >= n) {
            int sum = 0;
            for (int x : signal) sum += x;
            return sum;
        }
        int cur = 0;
        for (int i = 0; i < k; i++) cur += signal[i];
        int best = cur;
        for (int i = k; i < n; i++) {
            cur += signal[i] - signal[i - k];
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int strongestWindow(vector<int>& signal, int k) {
        int n = signal.size();
        if (k >= n) return accumulate(signal.begin(), signal.end(), 0);
        int cur = 0;
        for (int i = 0; i < k; i++) cur += signal[i];
        int best = cur;
        for (int i = k; i < n; i++) {
            cur += signal[i] - signal[i - k];
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // totalEnergy(s: str) -> int  — bracketed energy via stack frames.
  'pghub-b13-spell-energy': {
    javascript: `var totalEnergy = function(s) {
    const stack = [0];
    let i = 0;
    const n = s.length;
    while (i < n) {
        const ch = s[i];
        if (ch === '[') { stack.push(0); i++; }
        else if (ch === ']') {
            const inner = stack.pop();
            stack[stack.length - 1] += 2 * inner;
            i++;
        } else {
            let j = i;
            while (j < n && s[j] >= '0' && s[j] <= '9') j++;
            stack[stack.length - 1] += parseInt(s.slice(i, j), 10);
            i = j;
        }
    }
    return stack[0];
};`,
    java: `import java.util.*;
class Solution {
    public int totalEnergy(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        int i = 0, n = s.length();
        while (i < n) {
            char ch = s.charAt(i);
            if (ch == '[') { stack.push(0); i++; }
            else if (ch == ']') {
                int inner = stack.pop();
                stack.push(stack.pop() + 2 * inner);
                i++;
            } else {
                int j = i;
                while (j < n && Character.isDigit(s.charAt(j))) j++;
                stack.push(stack.pop() + Integer.parseInt(s.substring(i, j)));
                i = j;
            }
        }
        return stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalEnergy(string s) {
        vector<long long> stack{0};
        int i = 0, n = s.size();
        while (i < n) {
            char ch = s[i];
            if (ch == '[') { stack.push_back(0); i++; }
            else if (ch == ']') {
                long long inner = stack.back(); stack.pop_back();
                stack.back() += 2 * inner;
                i++;
            } else {
                int j = i;
                while (j < n && isdigit(s[j])) j++;
                stack.back() += stoll(s.substr(i, j - i));
                i = j;
            }
        }
        return (int)stack[0];
    }
};`,
  },

  // maxBridges(left: List[int], right: List[int], gap: int) -> int  — two-pointer match.
  'pghub-b13-token-bridge': {
    javascript: `var maxBridges = function(left, right, gap) {
    let i = 0, j = 0, count = 0;
    while (i < left.length && j < right.length) {
        if (Math.abs(left[i] - right[j]) <= gap) { count++; i++; j++; }
        else if (left[i] < right[j]) i++;
        else j++;
    }
    return count;
};`,
    java: `class Solution {
    public int maxBridges(int[] left, int[] right, int gap) {
        int i = 0, j = 0, count = 0;
        while (i < left.length && j < right.length) {
            if (Math.abs(left[i] - right[j]) <= gap) { count++; i++; j++; }
            else if (left[i] < right[j]) i++;
            else j++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxBridges(vector<int>& left, vector<int>& right, int gap) {
        int i = 0, j = 0, count = 0;
        while (i < (int)left.size() && j < (int)right.size()) {
            if (abs(left[i] - right[j]) <= gap) { count++; i++; j++; }
            else if (left[i] < right[j]) i++;
            else j++;
        }
        return count;
    }
};`,
  },

  // allCodes(digits: List[int], length: int) -> List[List[int]]  — combination backtracking.
  'pghub-b13-vault-codes': {
    javascript: `var allCodes = function(digits, length) {
    const res = [], combo = [];
    const backtrack = (start) => {
        if (combo.length === length) { res.push(combo.slice()); return; }
        for (let i = start; i < digits.length; i++) {
            combo.push(digits[i]);
            backtrack(i + 1);
            combo.pop();
        }
    };
    backtrack(0);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> allCodes(int[] digits, int length) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(digits, length, 0, new ArrayList<>(), res);
        return res;
    }
    private void backtrack(int[] digits, int length, int start, List<Integer> combo, List<List<Integer>> res) {
        if (combo.size() == length) { res.add(new ArrayList<>(combo)); return; }
        for (int i = start; i < digits.length; i++) {
            combo.add(digits[i]);
            backtrack(digits, length, i + 1, combo, res);
            combo.remove(combo.size() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> allCodes(vector<int>& digits, int length) {
        vector<vector<int>> res;
        vector<int> combo;
        function<void(int)> backtrack = [&](int start) {
            if ((int)combo.size() == length) { res.push_back(combo); return; }
            for (int i = start; i < (int)digits.size(); i++) {
                combo.push_back(digits[i]);
                backtrack(i + 1);
                combo.pop_back();
            }
        };
        backtrack(0);
        return res;
    }
};`,
  },

  // restockCount(stock: List[int], threshold: int) -> int  — count below threshold.
  'pghub-b13-warehouse-aisles': {
    javascript: `var restockCount = function(stock, threshold) {
    let count = 0;
    for (const s of stock) if (s < threshold) count++;
    return count;
};`,
    java: `class Solution {
    public int restockCount(int[] stock, int threshold) {
        int count = 0;
        for (int s : stock) if (s < threshold) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockCount(vector<int>& stock, int threshold) {
        int count = 0;
        for (int s : stock) if (s < threshold) count++;
        return count;
    }
};`,
  },

  // maxStacks(coins: int) -> int  — largest k with k*(k+1)/2 <= coins (binary search).
  'pghub-b14-coin-tower': {
    javascript: `var maxStacks = function(coins) {
    let lo = 0, hi = coins;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (mid * (mid + 1) / 2 <= coins) lo = mid;
        else hi = mid - 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int maxStacks(int coins) {
        long lo = 0, hi = coins;
        while (lo < hi) {
            long mid = (lo + hi + 1) / 2;
            if (mid * (mid + 1) / 2 <= coins) lo = mid;
            else hi = mid - 1;
        }
        return (int) lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxStacks(int coins) {
        long long lo = 0, hi = coins;
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            if (mid * (mid + 1) / 2 <= coins) lo = mid;
            else hi = mid - 1;
        }
        return (int) lo;
    }
};`,
  },

  // cheapestReach(n: int, roads: List[List[int]], start: int) -> List[int]  — Dijkstra.
  'pghub-b14-festival-routes': {
    javascript: `var cheapestReach = function(n, roads, start) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of roads) {
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[start] = 0;
    // simple binary min-heap of [dist, node]
    const heap = [[0, start]];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
        }
    };
    const down = (i) => {
        const sz = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < sz && heap[l][0] < heap[s][0]) s = l;
            if (r < sz && heap[r][0] < heap[s][0]) s = r;
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
        for (const [v, w] of adj[u]) {
            const nd = d + w;
            if (nd < dist[v]) { dist[v] = nd; push([nd, v]); }
        }
    }
    return dist.map(x => x === INF ? -1 : x);
};`,
    java: `import java.util.*;
class Solution {
    public int[] cheapestReach(int n, int[][] roads, int start) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) {
            adj[r[0]].add(new int[]{r[1], r[2]});
            adj[r[1]].add(new int[]{r[0], r[2]});
        }
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[start] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, start});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0];
            int u = (int) cur[1];
            if (d > dist[u]) continue;
            for (int[] e : adj[u]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
            }
        }
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[i] = dist[i] == Long.MAX_VALUE ? -1 : (int) dist[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> cheapestReach(int n, vector<vector<int>>& roads, int start) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[start] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, start});
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue;
            for (auto& [v, w] : adj[u]) {
                long long nd = d + w;
                if (nd < dist[v]) { dist[v] = nd; pq.push({nd, v}); }
            }
        }
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[i] = dist[i] == INF ? -1 : (int)dist[i];
        return res;
    }
};`,
  },

  // finalText(keys: str) -> str  — backspace-stack typing.
  'pghub-b14-keystroke-undo': {
    javascript: `var finalText = function(keys) {
    const out = [];
    for (const ch of keys) {
        if (ch === '#') { if (out.length) out.pop(); }
        else out.push(ch);
    }
    return out.join('');
};`,
    java: `class Solution {
    public String finalText(String keys) {
        StringBuilder out = new StringBuilder();
        for (char ch : keys.toCharArray()) {
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
    string finalText(string keys) {
        string out;
        for (char ch : keys) {
            if (ch == '#') { if (!out.empty()) out.pop_back(); }
            else out.push_back(ch);
        }
        return out;
    }
};`,
  },

  // minTransfers(balances: List[int]) -> int  — zero-sum subset bitmask DP.
  'pghub-b14-ledger-rebalance': {
    javascript: `var minTransfers = function(balances) {
    const debts = balances.filter(b => b !== 0);
    const n = debts.length;
    const full = (1 << n) - 1;
    const subsetSum = new Array(1 << n).fill(0);
    for (let mask = 1; mask <= full; mask++) {
        const low = mask & -mask;
        const i = Math.log2(low) | 0;
        subsetSum[mask] = subsetSum[mask ^ low] + debts[i];
    }
    const memo = new Map();
    const maxZeroGroups = (mask) => {
        if (mask === 0) return 0;
        if (memo.has(mask)) return memo.get(mask);
        const low = mask & -mask;
        const rest = mask ^ low;
        let best = -1;
        let sub = mask;
        while (sub) {
            if ((sub & low) && subsetSum[sub] === 0) {
                best = Math.max(best, 1 + maxZeroGroups(mask ^ sub));
            }
            sub = (sub - 1) & mask;
        }
        if (best === -1) best = maxZeroGroups(rest);
        memo.set(mask, best);
        return best;
    };
    const groups = maxZeroGroups(full);
    return n - groups;
};`,
    java: `import java.util.*;
class Solution {
    public int minTransfers(int[] balances) {
        List<Integer> debtsList = new ArrayList<>();
        for (int b : balances) if (b != 0) debtsList.add(b);
        int n = debtsList.size();
        int full = (1 << n) - 1;
        int[] subsetSum = new int[1 << n];
        for (int mask = 1; mask <= full; mask++) {
            int low = mask & -mask;
            int i = Integer.numberOfTrailingZeros(low);
            subsetSum[mask] = subsetSum[mask ^ low] + debtsList.get(i);
        }
        Map<Integer, Integer> memo = new HashMap<>();
        int groups = maxZeroGroups(full, subsetSum, memo);
        return n - groups;
    }
    private int maxZeroGroups(int mask, int[] subsetSum, Map<Integer, Integer> memo) {
        if (mask == 0) return 0;
        if (memo.containsKey(mask)) return memo.get(mask);
        int low = mask & -mask;
        int rest = mask ^ low;
        int best = -1;
        int sub = mask;
        while (sub != 0) {
            if ((sub & low) != 0 && subsetSum[sub] == 0) {
                best = Math.max(best, 1 + maxZeroGroups(mask ^ sub, subsetSum, memo));
            }
            sub = (sub - 1) & mask;
        }
        if (best == -1) best = maxZeroGroups(rest, subsetSum, memo);
        memo.put(mask, best);
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTransfers(vector<int>& balances) {
        vector<int> debts;
        for (int b : balances) if (b != 0) debts.push_back(b);
        int n = debts.size();
        int full = (1 << n) - 1;
        vector<long long> subsetSum(1 << n, 0);
        for (int mask = 1; mask <= full; mask++) {
            int low = mask & -mask;
            int i = __builtin_ctz(low);
            subsetSum[mask] = subsetSum[mask ^ low] + debts[i];
        }
        unordered_map<int, int> memo;
        function<int(int)> maxZeroGroups = [&](int mask) -> int {
            if (mask == 0) return 0;
            auto it = memo.find(mask);
            if (it != memo.end()) return it->second;
            int low = mask & -mask;
            int rest = mask ^ low;
            int best = -1;
            int sub = mask;
            while (sub) {
                if ((sub & low) && subsetSum[sub] == 0) {
                    best = max(best, 1 + maxZeroGroups(mask ^ sub));
                }
                sub = (sub - 1) & mask;
            }
            if (best == -1) best = maxZeroGroups(rest);
            memo[mask] = best;
            return best;
        };
        int groups = maxZeroGroups(full);
        return n - groups;
    }
};`,
  },

  // longestStable(signal: List[int], drift: int) -> int  — monotonic-deque window.
  'pghub-b14-signal-decay': {
    javascript: `var longestStable = function(signal, drift) {
    const maxq = [], minq = [];
    let left = 0, best = 0;
    for (let right = 0; right < signal.length; right++) {
        const v = signal[right];
        while (maxq.length && signal[maxq[maxq.length - 1]] <= v) maxq.pop();
        maxq.push(right);
        while (minq.length && signal[minq[minq.length - 1]] >= v) minq.pop();
        minq.push(right);
        while (signal[maxq[0]] - signal[minq[0]] > drift) {
            left++;
            if (maxq[0] < left) maxq.shift();
            if (minq[0] < left) minq.shift();
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestStable(int[] signal, int drift) {
        Deque<Integer> maxq = new ArrayDeque<>();
        Deque<Integer> minq = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < signal.length; right++) {
            int v = signal[right];
            while (!maxq.isEmpty() && signal[maxq.peekLast()] <= v) maxq.pollLast();
            maxq.addLast(right);
            while (!minq.isEmpty() && signal[minq.peekLast()] >= v) minq.pollLast();
            minq.addLast(right);
            while (signal[maxq.peekFirst()] - signal[minq.peekFirst()] > drift) {
                left++;
                if (maxq.peekFirst() < left) maxq.pollFirst();
                if (minq.peekFirst() < left) minq.pollFirst();
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
    int longestStable(vector<int>& signal, int drift) {
        deque<int> maxq, minq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)signal.size(); right++) {
            int v = signal[right];
            while (!maxq.empty() && signal[maxq.back()] <= v) maxq.pop_back();
            maxq.push_back(right);
            while (!minq.empty() && signal[minq.back()] >= v) minq.pop_back();
            minq.push_back(right);
            while (signal[maxq.front()] - signal[minq.front()] > drift) {
                left++;
                if (maxq.front() < left) maxq.pop_front();
                if (minq.front() < left) minq.pop_front();
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // trappedWater(walls: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b14-tidal-pools': {
    javascript: `var trappedWater = function(walls) {
    let left = 0, right = walls.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (left < right) {
        if (walls[left] < walls[right]) {
            leftMax = Math.max(leftMax, walls[left]);
            total += leftMax - walls[left];
            left++;
        } else {
            rightMax = Math.max(rightMax, walls[right]);
            total += rightMax - walls[right];
            right--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trappedWater(int[] walls) {
        int left = 0, right = walls.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (walls[left] < walls[right]) {
                leftMax = Math.max(leftMax, walls[left]);
                total += leftMax - walls[left];
                left++;
            } else {
                rightMax = Math.max(rightMax, walls[right]);
                total += rightMax - walls[right];
                right--;
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trappedWater(vector<int>& walls) {
        int left = 0, right = (int)walls.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (walls[left] < walls[right]) {
                leftMax = max(leftMax, walls[left]);
                total += leftMax - walls[left];
                left++;
            } else {
                rightMax = max(rightMax, walls[right]);
                total += rightMax - walls[right];
                right--;
            }
        }
        return total;
    }
};`,
  },

  // flipsToEven(masks: List[int]) -> int  — count rows with odd popcount.
  'pghub-b15-bit-parity-grid': {
    javascript: `var flipsToEven = function(masks) {
    let count = 0;
    for (let m of masks) {
        let bits = 0;
        while (m) { bits += m & 1; m >>>= 1; }
        count += bits & 1;
    }
    return count;
};`,
    java: `class Solution {
    public int flipsToEven(int[] masks) {
        int count = 0;
        for (int m : masks) count += Integer.bitCount(m) & 1;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int flipsToEven(vector<int>& masks) {
        int count = 0;
        for (int m : masks) count += __builtin_popcount((unsigned)m) & 1;
        return count;
    }
};`,
  },

  // countWays(tokens: List[int], target: int) -> int  — unbounded coin-change count.
  'pghub-b15-coin-change-ways': {
    javascript: `var countWays = function(tokens, target) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    for (const t of tokens)
        for (let amt = t; amt <= target; amt++)
            dp[amt] += dp[amt - t];
    return dp[target];
};`,
    java: `class Solution {
    public int countWays(int[] tokens, int target) {
        long[] dp = new long[target + 1];
        dp[0] = 1;
        for (int t : tokens)
            for (int amt = t; amt <= target; amt++)
                dp[amt] += dp[amt - t];
        return (int) dp[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& tokens, int target) {
        vector<long long> dp(target + 1, 0);
        dp[0] = 1;
        for (int t : tokens)
            for (int amt = t; amt <= target; amt++)
                dp[amt] += dp[amt - t];
        return (int) dp[target];
    }
};`,
  },

  // maxPairs(weights: List[int], limit: int) -> int  — greedy two-pointer bagging.
  'pghub-b15-courier-zones': {
    javascript: `var maxPairs = function(weights, limit) {
    weights = weights.slice().sort((a, b) => a - b);
    let lo = 0, hi = weights.length - 1, bags = 0;
    while (lo <= hi) {
        if (lo < hi && weights[lo] + weights[hi] <= limit) lo++;
        hi--;
        bags++;
    }
    return bags;
};`,
    java: `import java.util.*;
class Solution {
    public int maxPairs(int[] weights, int limit) {
        Arrays.sort(weights);
        int lo = 0, hi = weights.length - 1, bags = 0;
        while (lo <= hi) {
            if (lo < hi && weights[lo] + weights[hi] <= limit) lo++;
            hi--;
            bags++;
        }
        return bags;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPairs(vector<int>& weights, int limit) {
        sort(weights.begin(), weights.end());
        int lo = 0, hi = (int)weights.size() - 1, bags = 0;
        while (lo <= hi) {
            if (lo < hi && weights[lo] + weights[hi] <= limit) lo++;
            hi--;
            bags++;
        }
        return bags;
    }
};`,
  },

  // peakIndex(heights: List[int]) -> int  — binary search on slope.
  'pghub-b15-elevation-search': {
    javascript: `var peakIndex = function(heights) {
    let lo = 0, hi = heights.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (heights[mid] < heights[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int peakIndex(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (heights[mid] < heights[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int peakIndex(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (heights[mid] < heights[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // shoreline(grid: List[List[int]]) -> int  — island perimeter via shared edges.
  'pghub-b15-island-perimeter': {
    javascript: `var shoreline = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let per = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                per += 4;
                if (r > 0 && grid[r - 1][c] === 1) per -= 2;
                if (c > 0 && grid[r][c - 1] === 1) per -= 2;
            }
        }
    }
    return per;
};`,
    java: `class Solution {
    public int shoreline(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int per = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    per += 4;
                    if (r > 0 && grid[r - 1][c] == 1) per -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) per -= 2;
                }
            }
        }
        return per;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shoreline(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        int per = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    per += 4;
                    if (r > 0 && grid[r - 1][c] == 1) per -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) per -= 2;
                }
            }
        }
        return per;
    }
};`,
  },

  // mergeBookings(bookings: List[List[int]]) -> List[List[int]]  — sort + sweep merge.
  'pghub-b15-meeting-merge': {
    javascript: `var mergeBookings = function(bookings) {
    bookings = bookings.map(b => b.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    for (const [s, e] of bookings) {
        if (merged.length && s <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
        } else {
            merged.push([s, e]);
        }
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeBookings(int[][] bookings) {
        Arrays.sort(bookings, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        List<int[]> merged = new ArrayList<>();
        for (int[] bk : bookings) {
            if (!merged.isEmpty() && bk[0] <= merged.get(merged.size() - 1)[1]) {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], bk[1]);
            } else {
                merged.add(new int[]{bk[0], bk[1]});
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
        sort(bookings.begin(), bookings.end());
        vector<vector<int>> merged;
        for (auto& bk : bookings) {
            if (!merged.empty() && bk[0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], bk[1]);
            } else {
                merged.push_back({bk[0], bk[1]});
            }
        }
        return merged;
    }
};`,
  },

  // buildMirror(s: str) -> str  — s + reverse(s without last char).
  'pghub-b15-palindrome-merge': {
    javascript: `var buildMirror = function(s) {
    return s + s.slice(0, -1).split('').reverse().join('');
};`,
    java: `class Solution {
    public String buildMirror(String s) {
        StringBuilder sb = new StringBuilder(s.substring(0, s.length() - 1));
        return s + sb.reverse().toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string buildMirror(string s) {
        string tail = s.substr(0, s.size() - 1);
        reverse(tail.begin(), tail.end());
        return s + tail;
    }
};`,
  },

  // canReach(n: int, links: List[List[int]], src: int, dst: int) -> bool  — BFS reachability.
  'pghub-b15-relay-chain': {
    javascript: `var canReach = function(n, links, src, dst) {
    const adj = new Map();
    for (const [a, b] of links) {
        if (!adj.has(a)) adj.set(a, []);
        adj.get(a).push(b);
    }
    const seen = new Set([src]);
    const q = [src];
    let head = 0;
    while (head < q.length) {
        const u = q[head++];
        if (u === dst) return true;
        for (const v of (adj.get(u) || [])) {
            if (!seen.has(v)) { seen.add(v); q.push(v); }
        }
    }
    return seen.has(dst);
};`,
    java: `import java.util.*;
class Solution {
    public boolean canReach(int n, int[][] links, int src, int dst) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        for (int[] e : links) adj.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
        Set<Integer> seen = new HashSet<>();
        seen.add(src);
        Deque<Integer> q = new ArrayDeque<>();
        q.add(src);
        while (!q.isEmpty()) {
            int u = q.poll();
            if (u == dst) return true;
            for (int v : adj.getOrDefault(u, Collections.emptyList())) {
                if (seen.add(v)) q.add(v);
            }
        }
        return seen.contains(dst);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canReach(int n, vector<vector<int>>& links, int src, int dst) {
        unordered_map<int, vector<int>> adj;
        for (auto& e : links) adj[e[0]].push_back(e[1]);
        unordered_set<int> seen{src};
        queue<int> q;
        q.push(src);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            if (u == dst) return true;
            for (int v : adj[u]) {
                if (!seen.count(v)) { seen.insert(v); q.push(v); }
            }
        }
        return seen.count(dst) > 0;
    }
};`,
  },

  // spiralRead(matrix: List[List[int]]) -> List[int]  — boundary-shrink spiral.
  'pghub-b15-spiral-readout': {
    javascript: `var spiralRead = function(matrix) {
    const res = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) res.push(matrix[top][c]);
        top++;
        for (let r = top; r <= bottom; r++) res.push(matrix[r][right]);
        right--;
        if (top <= bottom) {
            for (let c = right; c >= left; c--) res.push(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {
            for (let r = bottom; r >= top; r--) res.push(matrix[r][left]);
            left++;
        }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> spiralRead(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.add(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.add(matrix[r][right]);
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) res.add(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) res.add(matrix[r][left]);
                left++;
            }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> spiralRead(vector<vector<int>>& matrix) {
        vector<int> res;
        int top = 0, bottom = (int)matrix.size() - 1;
        int left = 0, right = (int)matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.push_back(matrix[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) res.push_back(matrix[r][right]);
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) res.push_back(matrix[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) res.push_back(matrix[r][left]);
                left++;
            }
        }
        return res;
    }
};`,
  },

  // longestComfort(temps: List[int], lo: int, hi: int) -> int  — longest in-range run.
  'pghub-b15-thermostat-window': {
    javascript: `var longestComfort = function(temps, lo, hi) {
    let best = 0, cur = 0;
    for (const t of temps) {
        if (t >= lo && t <= hi) { cur++; if (cur > best) best = cur; }
        else cur = 0;
    }
    return best;
};`,
    java: `class Solution {
    public int longestComfort(int[] temps, int lo, int hi) {
        int best = 0, cur = 0;
        for (int t : temps) {
            if (t >= lo && t <= hi) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestComfort(vector<int>& temps, int lo, int hi) {
        int best = 0, cur = 0;
        for (int t : temps) {
            if (t >= lo && t <= hi) { cur++; if (cur > best) best = cur; }
            else cur = 0;
        }
        return best;
    }
};`,
  },
};
