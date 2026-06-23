// xlate-12 — translations of verified Python solutions to JS/Java/C++.
// Slice [330,360) of pyReal && missingLangs targets. Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.

export default {
  // maxComfort(temps: List[int], k: int) -> int  — fixed-size sliding window.
  'pghub-b31-thermostat-sched': {
    javascript: `var maxComfort = function(temps, k) {
    const n = temps.length;
    if (k > n) return 0;
    let window = 0;
    for (let i = 0; i < k; i++) window += temps[i];
    let best = window;
    for (let i = k; i < n; i++) {
        window += temps[i] - temps[i - k];
        if (window > best) best = window;
    }
    return best;
};`,
    java: `class Solution {
    public int maxComfort(int[] temps, int k) {
        int n = temps.length;
        if (k > n) return 0;
        long window = 0;
        for (int i = 0; i < k; i++) window += temps[i];
        long best = window;
        for (int i = k; i < n; i++) {
            window += temps[i] - temps[i - k];
            if (window > best) best = window;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxComfort(vector<int>& temps, int k) {
        int n = temps.size();
        if (k > n) return 0;
        long long window = 0;
        for (int i = 0; i < k; i++) window += temps[i];
        long long best = window;
        for (int i = k; i < n; i++) {
            window += temps[i] - temps[i - k];
            if (window > best) best = window;
        }
        return (int) best;
    }
};`,
  },

  // roundsNeeded(players: int) -> int  — ceiling-halving count.
  'pghub-b31-tournament-bracket': {
    javascript: `var roundsNeeded = function(players) {
    let rounds = 0;
    while (players > 1) {
        players = Math.floor((players + 1) / 2);
        rounds++;
    }
    return rounds;
};`,
    java: `class Solution {
    public int roundsNeeded(int players) {
        int rounds = 0;
        while (players > 1) {
            players = (players + 1) / 2;
            rounds++;
        }
        return rounds;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int roundsNeeded(int players) {
        int rounds = 0;
        while (players > 1) {
            players = (players + 1) / 2;
            rounds++;
        }
        return rounds;
    }
};`,
  },

  // longestVowelRun(s: str) -> int  — running vowel run length.
  'pghub-b31-vowel-streak': {
    javascript: `var longestVowelRun = function(s) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    let best = 0, cur = 0;
    for (const ch of s) {
        if (vowels.has(ch)) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestVowelRun(String s) {
        Set<Character> vowels = new HashSet<>(Arrays.asList('a', 'e', 'i', 'o', 'u'));
        int best = 0, cur = 0;
        for (int i = 0; i < s.length(); i++) {
            if (vowels.contains(s.charAt(i))) {
                cur++;
                if (cur > best) best = cur;
            } else {
                cur = 0;
            }
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
            if (vowels.find(ch) != string::npos) {
                cur++;
                if (cur > best) best = cur;
            } else {
                cur = 0;
            }
        }
        return best;
    }
};`,
  },

  // groupCount(words: List[str]) -> int  — distinct sorted-letter keys.
  'pghub-b31-word-anagram-groups': {
    javascript: `var groupCount = function(words) {
    const seen = new Set();
    for (const w of words) {
        seen.add(w.split('').sort().join(''));
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int groupCount(String[] words) {
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
    int groupCount(vector<string>& words) {
        set<string> seen;
        for (string w : words) {
            sort(w.begin(), w.end());
            seen.insert(w);
        }
        return seen.size();
    }
};`,
  },

  // largestFamily(words: List[str]) -> int  — max anagram-group size.
  'pghub-b32-anagram-groups': {
    javascript: `var largestFamily = function(words) {
    const groups = new Map();
    let best = 0;
    for (const w of words) {
        const key = w.split('').sort().join('');
        const c = (groups.get(key) || 0) + 1;
        groups.set(key, c);
        if (c > best) best = c;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int largestFamily(String[] words) {
        Map<String, Integer> groups = new HashMap<>();
        int best = 0;
        for (String w : words) {
            char[] a = w.toCharArray();
            Arrays.sort(a);
            String key = new String(a);
            int c = groups.getOrDefault(key, 0) + 1;
            groups.put(key, c);
            if (c > best) best = c;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestFamily(vector<string>& words) {
        unordered_map<string, int> groups;
        int best = 0;
        for (string w : words) {
            sort(w.begin(), w.end());
            int c = ++groups[w];
            if (c > best) best = c;
        }
        return best;
    }
};`,
  },

  // countBridges(n: int, edges: List[List[int]]) -> int  — Tarjan bridge count.
  'pghub-b32-bridge-network': {
    javascript: `var countBridges = function(n, edges) {
    const graph = Array.from({length: n}, () => []);
    for (const [u, v] of edges) {
        graph[u].push(v);
        graph[v].push(u);
    }
    const disc = new Array(n).fill(-1);
    const low = new Array(n).fill(0);
    let timer = 0, bridges = 0;
    const dfs = (u, parent) => {
        disc[u] = low[u] = timer++;
        for (const w of graph[u]) {
            if (w === parent) continue;
            if (disc[w] === -1) {
                dfs(w, u);
                low[u] = Math.min(low[u], low[w]);
                if (low[w] > disc[u]) bridges++;
            } else {
                low[u] = Math.min(low[u], disc[w]);
            }
        }
    };
    for (let i = 0; i < n; i++) if (disc[i] === -1) dfs(i, -1);
    return bridges;
};`,
    java: `import java.util.*;
class Solution {
    private List<List<Integer>> graph;
    private int[] disc, low;
    private int timer = 0, bridges = 0;
    public int countBridges(int n, int[][] edges) {
        graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(e[1]);
            graph.get(e[1]).add(e[0]);
        }
        disc = new int[n];
        low = new int[n];
        Arrays.fill(disc, -1);
        for (int i = 0; i < n; i++) if (disc[i] == -1) dfs(i, -1);
        return bridges;
    }
    private void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        for (int w : graph.get(u)) {
            if (w == parent) continue;
            if (disc[w] == -1) {
                dfs(w, u);
                low[u] = Math.min(low[u], low[w]);
                if (low[w] > disc[u]) bridges++;
            } else {
                low[u] = Math.min(low[u], disc[w]);
            }
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countBridges(int n, vector<vector<int>>& edges) {
        vector<vector<int>> graph(n);
        for (auto& e : edges) {
            graph[e[0]].push_back(e[1]);
            graph[e[1]].push_back(e[0]);
        }
        vector<int> disc(n, -1), low(n, 0);
        int timer = 0, bridges = 0;
        function<void(int,int)> dfs = [&](int u, int parent) {
            disc[u] = low[u] = timer++;
            for (int w : graph[u]) {
                if (w == parent) continue;
                if (disc[w] == -1) {
                    dfs(w, u);
                    low[u] = min(low[u], low[w]);
                    if (low[w] > disc[u]) bridges++;
                } else {
                    low[u] = min(low[u], disc[w]);
                }
            }
        };
        for (int i = 0; i < n; i++) if (disc[i] == -1) dfs(i, -1);
        return bridges;
    }
};`,
  },

  // rangeSum(values: List[int], low: int, high: int) -> int  — heap-indexed BST, -1 sentinel.
  'pghub-b32-bst-range': {
    javascript: `var rangeSum = function(values, low, high) {
    const n = values.length;
    let total = 0;
    const visit = (i) => {
        if (i >= n || values[i] === -1) return;
        const v = values[i];
        if (low <= v && v <= high) total += v;
        if (v > low) visit(2 * i + 1);
        if (v < high) visit(2 * i + 2);
    };
    visit(0);
    return total;
};`,
    java: `class Solution {
    private int[] values;
    private int low, high, n;
    private long total;
    public int rangeSum(int[] values, int low, int high) {
        this.values = values;
        this.low = low;
        this.high = high;
        this.n = values.length;
        this.total = 0;
        visit(0);
        return (int) total;
    }
    private void visit(int i) {
        if (i >= n || values[i] == -1) return;
        int v = values[i];
        if (low <= v && v <= high) total += v;
        if (v > low) visit(2 * i + 1);
        if (v < high) visit(2 * i + 2);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& values, int low, int high) {
        int n = values.size();
        long long total = 0;
        function<void(int)> visit = [&](int i) {
            if (i >= n || values[i] == -1) return;
            int v = values[i];
            if (low <= v && v <= high) total += v;
            if (v > low) visit(2 * i + 1);
            if (v < high) visit(2 * i + 2);
        };
        visit(0);
        return (int) total;
    }
};`,
  },

  // startStation(fuel: List[int], cost: List[int]) -> int  — gas station greedy.
  'pghub-b32-circular-fuel': {
    javascript: `var startStation = function(fuel, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < fuel.length; i++) {
        const diff = fuel[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
};`,
    java: `class Solution {
    public int startStation(int[] fuel, int[] cost) {
        long total = 0, tank = 0;
        int start = 0;
        for (int i = 0; i < fuel.length; i++) {
            int diff = fuel[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int startStation(vector<int>& fuel, vector<int>& cost) {
        long long total = 0, tank = 0;
        int start = 0;
        for (int i = 0; i < (int)fuel.size(); i++) {
            int diff = fuel[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
};`,
  },

  // maxCoins(grid: List[List[int]]) -> int  — top prefix + bottom suffix.
  'pghub-b32-coin-rows': {
    javascript: `var maxCoins = function(grid) {
    const n = grid[0].length;
    const top = grid[0], bottom = grid[1];
    const preTop = new Array(n + 1).fill(0);
    const sufBottom = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) preTop[i + 1] = preTop[i] + top[i];
    for (let i = n - 1; i >= 0; i--) sufBottom[i] = sufBottom[i + 1] + bottom[i];
    let best = -1;
    for (let j = 0; j < n; j++) {
        const total = preTop[j + 1] + sufBottom[j];
        if (total > best) best = total;
    }
    return best;
};`,
    java: `class Solution {
    public int maxCoins(int[][] grid) {
        int n = grid[0].length;
        int[] top = grid[0], bottom = grid[1];
        long[] preTop = new long[n + 1];
        long[] sufBottom = new long[n + 1];
        for (int i = 0; i < n; i++) preTop[i + 1] = preTop[i] + top[i];
        for (int i = n - 1; i >= 0; i--) sufBottom[i] = sufBottom[i + 1] + bottom[i];
        long best = -1;
        for (int j = 0; j < n; j++) {
            long total = preTop[j + 1] + sufBottom[j];
            if (total > best) best = total;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCoins(vector<vector<int>>& grid) {
        int n = grid[0].size();
        vector<int>& top = grid[0];
        vector<int>& bottom = grid[1];
        vector<long long> preTop(n + 1, 0), sufBottom(n + 1, 0);
        for (int i = 0; i < n; i++) preTop[i + 1] = preTop[i] + top[i];
        for (int i = n - 1; i >= 0; i--) sufBottom[i] = sufBottom[i + 1] + bottom[i];
        long long best = -1;
        for (int j = 0; j < n; j++) {
            long long total = preTop[j + 1] + sufBottom[j];
            if (total > best) best = total;
        }
        return (int) best;
    }
};`,
  },

  // minTrips(weights: List[int], limit: int) -> int  — sort + two-pointer.
  'pghub-b32-elevator-trips': {
    javascript: `var minTrips = function(weights, limit) {
    const w = weights.slice().sort((a, b) => a - b);
    let i = 0, j = w.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && w[i] + w[j] <= limit) i++;
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
            if (i < j && w[i] + w[j] <= limit) i++;
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
            if (i < j && w[i] + w[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // openLockers(n: int) -> int  — floor(sqrt(n)).
  'pghub-b32-locker-toggle': {
    javascript: `var openLockers = function(n) {
    if (n <= 0) return 0;
    let r = Math.floor(Math.sqrt(n));
    while ((r + 1) * (r + 1) <= n) r++;
    while (r * r > n) r--;
    return r;
};`,
    java: `class Solution {
    public int openLockers(int n) {
        if (n <= 0) return 0;
        int r = (int) Math.sqrt(n);
        while ((long)(r + 1) * (r + 1) <= n) r++;
        while ((long) r * r > n) r--;
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLockers(int n) {
        if (n <= 0) return 0;
        int r = (int) sqrt((double) n);
        while ((long long)(r + 1) * (r + 1) <= n) r++;
        while ((long long) r * r > n) r--;
        return r;
    }
};`,
  },

  // minTowers(houses: List[int], radius: int) -> int  — interval-cover greedy.
  'pghub-b32-radio-towers': {
    javascript: `var minTowers = function(houses, radius) {
    const pts = houses.slice().sort((a, b) => a - b);
    const n = pts.length;
    let towers = 0, i = 0;
    while (i < n) {
        towers++;
        const towerPos = pts[i] + radius;
        while (i < n && pts[i] <= towerPos + radius) i++;
    }
    return towers;
};`,
    java: `import java.util.*;
class Solution {
    public int minTowers(int[] houses, int radius) {
        int[] pts = houses.clone();
        Arrays.sort(pts);
        int n = pts.length, towers = 0, i = 0;
        while (i < n) {
            towers++;
            long towerPos = (long) pts[i] + radius;
            while (i < n && pts[i] <= towerPos + radius) i++;
        }
        return towers;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTowers(vector<int>& houses, int radius) {
        vector<int> pts = houses;
        sort(pts.begin(), pts.end());
        int n = pts.size(), towers = 0, i = 0;
        while (i < n) {
            towers++;
            long long towerPos = (long long) pts[i] + radius;
            while (i < n && pts[i] <= towerPos + radius) i++;
        }
        return towers;
    }
};`,
  },

  // firstDrop(speeds: List[int], limit: int) -> int  — last in-limit adjacent index.
  'pghub-b32-relay-baton': {
    javascript: `var firstDrop = function(speeds, limit) {
    let last = 0;
    for (let i = 0; i < speeds.length - 1; i++) {
        if (Math.abs(speeds[i] - speeds[i + 1]) <= limit) last = i + 1;
        else break;
    }
    return last;
};`,
    java: `class Solution {
    public int firstDrop(int[] speeds, int limit) {
        int last = 0;
        for (int i = 0; i < speeds.length - 1; i++) {
            if (Math.abs(speeds[i] - speeds[i + 1]) <= limit) last = i + 1;
            else break;
        }
        return last;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstDrop(vector<int>& speeds, int limit) {
        int last = 0;
        for (int i = 0; i + 1 < (int)speeds.size(); i++) {
            if (abs(speeds[i] - speeds[i + 1]) <= limit) last = i + 1;
            else break;
        }
        return last;
    }
};`,
  },

  // paintedLength(segments: List[List[int]]) -> int  — sort + merge length.
  'pghub-b32-segment-paint': {
    javascript: `var paintedLength = function(segments) {
    const segs = segments.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let total = 0;
    let curStart = segs[0][0], curEnd = segs[0][1];
    for (let i = 1; i < segs.length; i++) {
        const s = segs[i][0], e = segs[i][1];
        if (s <= curEnd) {
            curEnd = Math.max(curEnd, e);
        } else {
            total += curEnd - curStart;
            curStart = s; curEnd = e;
        }
    }
    total += curEnd - curStart;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int paintedLength(int[][] segments) {
        int[][] segs = segments.clone();
        Arrays.sort(segs, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        long total = 0;
        int curStart = segs[0][0], curEnd = segs[0][1];
        for (int i = 1; i < segs.length; i++) {
            int s = segs[i][0], e = segs[i][1];
            if (s <= curEnd) {
                curEnd = Math.max(curEnd, e);
            } else {
                total += curEnd - curStart;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart;
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int paintedLength(vector<vector<int>>& segments) {
        vector<vector<int>> segs = segments;
        sort(segs.begin(), segs.end());
        long long total = 0;
        int curStart = segs[0][0], curEnd = segs[0][1];
        for (size_t i = 1; i < segs.size(); i++) {
            int s = segs[i][0], e = segs[i][1];
            if (s <= curEnd) {
                curEnd = max(curEnd, e);
            } else {
                total += curEnd - curStart;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart;
        return (int) total;
    }
};`,
  },

  // finalStack(plates: List[int]) -> List[int]  — monotonic stack.
  'pghub-b32-shelf-stack': {
    javascript: `var finalStack = function(plates) {
    const stack = [];
    for (const p of plates) {
        while (stack.length && p > stack[stack.length - 1]) stack.pop();
        stack.push(p);
    }
    return stack;
};`,
    java: `import java.util.*;
class Solution {
    public int[] finalStack(int[] plates) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int p : plates) {
            while (!stack.isEmpty() && p > stack.peek()) stack.pop();
            stack.push(p);
        }
        int[] res = new int[stack.size()];
        for (int i = res.length - 1; i >= 0; i--) res[i] = stack.pop();
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> finalStack(vector<int>& plates) {
        vector<int> stack;
        for (int p : plates) {
            while (!stack.empty() && p > stack.back()) stack.pop_back();
            stack.push_back(p);
        }
        return stack;
    }
};`,
  },

  // countDecodings(s: str) -> int  — decode-ways DP.
  'pghub-b32-signal-decode': {
    javascript: `var countDecodings = function(s) {
    const n = s.length;
    if (n === 0) return 0;
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    dp[1] = s[0] !== '0' ? 1 : 0;
    for (let i = 2; i <= n; i++) {
        if (s[i - 1] !== '0') dp[i] += dp[i - 1];
        const two = parseInt(s.substring(i - 2, i), 10);
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
    }
    return dp[n];
};`,
    java: `class Solution {
    public int countDecodings(String s) {
        int n = s.length();
        if (n == 0) return 0;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        dp[1] = s.charAt(0) != '0' ? 1 : 0;
        for (int i = 2; i <= n; i++) {
            if (s.charAt(i - 1) != '0') dp[i] += dp[i - 1];
            int two = Integer.parseInt(s.substring(i - 2, i));
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countDecodings(string s) {
        int n = s.size();
        if (n == 0) return 0;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        dp[1] = s[0] != '0' ? 1 : 0;
        for (int i = 2; i <= n; i++) {
            if (s[i - 1] != '0') dp[i] += dp[i - 1];
            int two = stoi(s.substr(i - 2, 2));
            if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        }
        return (int) dp[n];
    }
};`,
  },

  // spiralOrder(matrix: List[List[int]]) -> List[int]  — boundary shrink.
  'pghub-b32-spiral-sum': {
    javascript: `var spiralOrder = function(matrix) {
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
    public List<Integer> spiralOrder(int[][] matrix) {
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
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> res;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;
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

  // wateringSteps(plants: List[int], capacity: int) -> int  — walk-back greedy.
  'pghub-b32-watered-plants': {
    javascript: `var wateringSteps = function(plants, capacity) {
    let steps = 0, water = capacity;
    for (let i = 0; i < plants.length; i++) {
        const need = plants[i];
        if (water >= need) {
            water -= need;
            steps += 1;
        } else {
            steps += i;
            steps += i + 1;
            water = capacity - need;
        }
    }
    return steps;
};`,
    java: `class Solution {
    public int wateringSteps(int[] plants, int capacity) {
        long steps = 0;
        int water = capacity;
        for (int i = 0; i < plants.length; i++) {
            int need = plants[i];
            if (water >= need) {
                water -= need;
                steps += 1;
            } else {
                steps += i;
                steps += i + 1;
                water = capacity - need;
            }
        }
        return (int) steps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wateringSteps(vector<int>& plants, int capacity) {
        long long steps = 0;
        int water = capacity;
        for (int i = 0; i < (int)plants.size(); i++) {
            int need = plants[i];
            if (water >= need) {
                water -= need;
                steps += 1;
            } else {
                steps += i;
                steps += i + 1;
                water = capacity - need;
            }
        }
        return (int) steps;
    }
};`,
  },

  // countZeroXorPairs(nums: List[int]) -> int  — equal-value pair count.
  'pghub-b32-xor-pairs': {
    javascript: `var countZeroXorPairs = function(nums) {
    const counts = new Map();
    for (const x of nums) counts.set(x, (counts.get(x) || 0) + 1);
    let total = 0;
    for (const c of counts.values()) total += c * (c - 1) / 2;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int countZeroXorPairs(int[] nums) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) counts.merge(x, 1, Integer::sum);
        long total = 0;
        for (int c : counts.values()) total += (long) c * (c - 1) / 2;
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countZeroXorPairs(vector<int>& nums) {
        unordered_map<int, long long> counts;
        for (int x : nums) counts[x]++;
        long long total = 0;
        for (auto& kv : counts) total += kv.second * (kv.second - 1) / 2;
        return (int) total;
    }
};`,
  },

  // finalTrays(ops: List[str]) -> List[int]  — stack with parsed push/pop.
  'pghub-b33-cafeteria-queue': {
    javascript: `var finalTrays = function(ops) {
    const stack = [];
    for (const op of ops) {
        if (op === 'pop') {
            if (stack.length) stack.pop();
        } else {
            const parts = op.split(/\\s+/);
            stack.push(parseInt(parts[1], 10));
        }
    }
    return stack;
};`,
    java: `import java.util.*;
class Solution {
    public int[] finalTrays(String[] ops) {
        List<Integer> stack = new ArrayList<>();
        for (String op : ops) {
            if (op.equals("pop")) {
                if (!stack.isEmpty()) stack.remove(stack.size() - 1);
            } else {
                String[] parts = op.split("\\\\s+");
                stack.add(Integer.parseInt(parts[1]));
            }
        }
        int[] res = new int[stack.size()];
        for (int i = 0; i < res.length; i++) res[i] = stack.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> finalTrays(vector<string>& ops) {
        vector<int> stack;
        for (const string& op : ops) {
            if (op == "pop") {
                if (!stack.empty()) stack.pop_back();
            } else {
                stringstream ss(op);
                string cmd; int x;
                ss >> cmd >> x;
                stack.push_back(x);
            }
        }
        return stack;
    }
};`,
  },

  // startStation(fuel: List[int], cost: List[int]) -> int  — gas station greedy.
  'pghub-b33-circular-route': {
    javascript: `var startStation = function(fuel, cost) {
    let total = 0, tank = 0, start = 0;
    for (let i = 0; i < fuel.length; i++) {
        const diff = fuel[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
};`,
    java: `class Solution {
    public int startStation(int[] fuel, int[] cost) {
        long total = 0, tank = 0;
        int start = 0;
        for (int i = 0; i < fuel.length; i++) {
            int diff = fuel[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int startStation(vector<int>& fuel, vector<int>& cost) {
        long long total = 0, tank = 0;
        int start = 0;
        for (int i = 0; i < (int)fuel.size(); i++) {
            int diff = fuel[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int  — unbounded knapsack count.
  'pghub-b33-coin-change-ways': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of coins) {
        for (let a = c; a <= amount; a++) {
            dp[a] += dp[a - c];
        }
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int c : coins) {
            for (int a = c; a <= amount; a++) {
                dp[a] += dp[a - c];
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
            for (int a = c; a <= amount; a++) {
                dp[a] += dp[a - c];
            }
        }
        return (int) dp[amount];
    }
};`,
  },

  // maxLoad(weights: List[int], k: int) -> int  — fixed-size sliding window.
  'pghub-b33-elevator-loads': {
    javascript: `var maxLoad = function(weights, k) {
    const n = weights.length;
    if (k > n) return 0;
    let cur = 0;
    for (let i = 0; i < k; i++) cur += weights[i];
    let best = cur;
    for (let i = k; i < n; i++) {
        cur += weights[i] - weights[i - k];
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int maxLoad(int[] weights, int k) {
        int n = weights.length;
        if (k > n) return 0;
        long cur = 0;
        for (int i = 0; i < k; i++) cur += weights[i];
        long best = cur;
        for (int i = k; i < n; i++) {
            cur += weights[i] - weights[i - k];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxLoad(vector<int>& weights, int k) {
        int n = weights.size();
        if (k > n) return 0;
        long long cur = 0;
        for (int i = 0; i < k; i++) cur += weights[i];
        long long best = cur;
        for (int i = k; i < n; i++) {
            cur += weights[i] - weights[i - k];
            if (cur > best) best = cur;
        }
        return (int) best;
    }
};`,
  },

  // minTaps(length: int, ranges: List[int]) -> int  — jump-game greedy.
  'pghub-b33-garden-watering': {
    javascript: `var minTaps = function(length, ranges) {
    const maxReach = new Array(length + 1).fill(0);
    for (let i = 0; i < ranges.length; i++) {
        const left = Math.max(0, i - ranges[i]);
        const right = Math.min(length, i + ranges[i]);
        if (right > maxReach[left]) maxReach[left] = right;
    }
    let taps = 0, curEnd = 0, farthest = 0, i = 0;
    while (curEnd < length) {
        while (i <= curEnd) {
            if (maxReach[i] > farthest) farthest = maxReach[i];
            i++;
        }
        if (farthest <= curEnd) return -1;
        taps++;
        curEnd = farthest;
    }
    return taps;
};`,
    java: `class Solution {
    public int minTaps(int length, int[] ranges) {
        int[] maxReach = new int[length + 1];
        for (int i = 0; i < ranges.length; i++) {
            int left = Math.max(0, i - ranges[i]);
            int right = Math.min(length, i + ranges[i]);
            if (right > maxReach[left]) maxReach[left] = right;
        }
        int taps = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < length) {
            while (i <= curEnd) {
                if (maxReach[i] > farthest) farthest = maxReach[i];
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
    int minTaps(int length, vector<int>& ranges) {
        vector<int> maxReach(length + 1, 0);
        for (int i = 0; i < (int)ranges.size(); i++) {
            int left = max(0, i - ranges[i]);
            int right = min(length, i + ranges[i]);
            if (right > maxReach[left]) maxReach[left] = right;
        }
        int taps = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < length) {
            while (i <= curEnd) {
                if (maxReach[i] > farthest) farthest = maxReach[i];
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

  // openLockers(n: int) -> int  — floor(sqrt(n)).
  'pghub-b33-locker-toggle': {
    javascript: `var openLockers = function(n) {
    if (n <= 0) return 0;
    let r = Math.floor(Math.sqrt(n));
    while ((r + 1) * (r + 1) <= n) r++;
    while (r * r > n) r--;
    return r;
};`,
    java: `class Solution {
    public int openLockers(int n) {
        if (n <= 0) return 0;
        int r = (int) Math.sqrt(n);
        while ((long)(r + 1) * (r + 1) <= n) r++;
        while ((long) r * r > n) r--;
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int openLockers(int n) {
        if (n <= 0) return 0;
        int r = (int) sqrt((double) n);
        while ((long long)(r + 1) * (r + 1) <= n) r++;
        while ((long long) r * r > n) r--;
        return r;
    }
};`,
  },

  // peakIndex(heights: List[int]) -> int  — binary search on slope.
  'pghub-b33-mountain-peak': {
    javascript: `var peakIndex = function(heights) {
    let lo = 0, hi = heights.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (heights[mid] < heights[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int peakIndex(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
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

  // printOrder(jobs: List[List[int]]) -> List[int]  — max-heap by priority, tie smallest id.
  'pghub-b33-printer-jobs': {
    javascript: `var printOrder = function(jobs) {
    // heap entries [-priority, id]; smaller tuple = higher priority, then smaller id.
    const heap = [];
    const less = (a, b) => a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (less(heap[i], heap[p])) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
            else break;
        }
    };
    const pop = () => {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            const n = heap.length;
            while (true) {
                let s = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < n && less(heap[l], heap[s])) s = l;
                if (r < n && less(heap[r], heap[s])) s = r;
                if (s === i) break;
                [heap[i], heap[s]] = [heap[s], heap[i]];
                i = s;
            }
        }
        return top;
    };
    for (const [jid, p] of jobs) push([-p, jid]);
    const order = [];
    while (heap.length) order.push(pop()[1]);
    return order;
};`,
    java: `import java.util.*;
class Solution {
    public int[] printOrder(int[][] jobs) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
            a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        for (int[] job : jobs) heap.offer(new int[]{-job[1], job[0]});
        int[] order = new int[jobs.length];
        int idx = 0;
        while (!heap.isEmpty()) order[idx++] = heap.poll()[1];
        return order;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> printOrder(vector<vector<int>>& jobs) {
        // min-heap over pair(-priority, id): top = highest priority, smallest id.
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> heap;
        for (auto& job : jobs) heap.push({-job[1], job[0]});
        vector<int> order;
        while (!heap.empty()) {
            order.push_back(heap.top().second);
            heap.pop();
        }
        return order;
    }
};`,
  },

  // lostChannel(channels: List[int]) -> int  — XOR missing number.
  'pghub-b33-radio-frequencies': {
    javascript: `var lostChannel = function(channels) {
    let x = channels.length;
    for (let i = 0; i < channels.length; i++) x ^= i ^ channels[i];
    return x;
};`,
    java: `class Solution {
    public int lostChannel(int[] channels) {
        int x = channels.length;
        for (int i = 0; i < channels.length; i++) x ^= i ^ channels[i];
        return x;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lostChannel(vector<int>& channels) {
        int x = channels.size();
        for (int i = 0; i < (int)channels.size(); i++) x ^= i ^ channels[i];
        return x;
    }
};`,
  },

  // countCircles(friends: List[List[int]]) -> int  — union-find components.
  'pghub-b33-relay-friends': {
    javascript: `var countCircles = function(friends) {
    const n = friends.length;
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[ra] = rb;
    };
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            if (friends[i][j] === 1) union(i, j);
    const roots = new Set();
    for (let i = 0; i < n; i++) roots.add(find(i));
    return roots.size;
};`,
    java: `import java.util.*;
class Solution {
    private int[] parent;
    public int countCircles(int[][] friends) {
        int n = friends.length;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (friends[i][j] == 1) union(i, j);
        Set<Integer> roots = new HashSet<>();
        for (int i = 0; i < n; i++) roots.add(find(i));
        return roots.size();
    }
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    private void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    void unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra != rb) parent[ra] = rb;
    }
    int countCircles(vector<vector<int>>& friends) {
        int n = friends.size();
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                if (friends[i][j] == 1) unite(i, j);
        set<int> roots;
        for (int i = 0; i < n; i++) roots.insert(find(i));
        return roots.size();
    }
};`,
  },

  // compress(s: str) -> str  — run-length compression.
  'pghub-b33-string-compress': {
    javascript: `var compress = function(s) {
    let out = '';
    let i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        const count = j - i;
        out += s[i];
        if (count > 1) out += String(count);
        i = j;
    }
    return out;
};`,
    java: `class Solution {
    public String compress(String s) {
        StringBuilder out = new StringBuilder();
        int i = 0, n = s.length();
        while (i < n) {
            int j = i;
            while (j < n && s.charAt(j) == s.charAt(i)) j++;
            int count = j - i;
            out.append(s.charAt(i));
            if (count > 1) out.append(count);
            i = j;
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string compress(string s) {
        string out;
        int i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            int count = j - i;
            out += s[i];
            if (count > 1) out += to_string(count);
            i = j;
        }
        return out;
    }
};`,
  },
};
