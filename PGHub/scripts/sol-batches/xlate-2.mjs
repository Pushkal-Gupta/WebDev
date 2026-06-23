// xlate-2.mjs — Python→JS/Java/C++ translations for solutions-backfill slice [30,60).
// Faithful ports of the verified solutions.python reference for each slug.
// Signatures match generateTemplate(language, method_name, params, return_type).
// Only the missing languages are provided per slug (all three here: js/java/cpp).
// The backfill runner grades each language via Judge0 and writes only passers.

export default {
  // cheapestRoute(n, routes: List[List[int]], src, dst) -> int — Dijkstra min-heap.
  'pghub-b11-courier-route': {
    javascript: `var cheapestRoute = function(n, routes, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, w] of routes) adj[u].push([v, w]);
    const dist = new Array(n).fill(Infinity);
    dist[src] = 0;
    // simple binary min-heap of [d, node]
    const heap = [[0, src]];
    const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const down = (i) => { const n2 = heap.length; for (;;) { let s = i, l = 2*i+1, r = 2*i+2; if (l < n2 && heap[l][0] < heap[s][0]) s = l; if (r < n2 && heap[r][0] < heap[s][0]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    while (heap.length) {
        const [d, node] = pop();
        if (d > dist[node]) continue;
        if (node === dst) return d;
        for (const [nxt, w] of adj[node]) {
            const nd = d + w;
            if (nd < dist[nxt]) { dist[nxt] = nd; push([nd, nxt]); }
        }
    }
    return dist[dst] !== Infinity ? dist[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int cheapestRoute(int n, int[][] routes, int src, int dst) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : routes) adj[r[0]].add(new int[]{r[1], r[2]});
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[]{0, src});
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            int d = cur[0], node = cur[1];
            if (d > dist[node]) continue;
            if (node == dst) return d;
            for (int[] e : adj[node]) {
                int nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; heap.offer(new int[]{nd, e[0]}); }
            }
        }
        return dist[dst] != Integer.MAX_VALUE ? dist[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& routes, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& r : routes) adj[r[0]].push_back({r[1], r[2]});
        vector<int> dist(n, INT_MAX);
        dist[src] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> heap;
        heap.push({0, src});
        while (!heap.empty()) {
            auto [d, node] = heap.top(); heap.pop();
            if (d > dist[node]) continue;
            if (node == dst) return d;
            for (auto& [nxt, w] : adj[node]) {
                int nd = d + w;
                if (nd < dist[nxt]) { dist[nxt] = nd; heap.push({nd, nxt}); }
            }
        }
        return dist[dst] != INT_MAX ? dist[dst] : -1;
    }
};`,
  },

  // minTrips(weights: List[int], limit) -> int — two-pointer greedy.
  'pghub-b11-elevator-load': {
    javascript: `var minTrips = function(weights, limit) {
    const ws = [...weights].sort((a, b) => a - b);
    let i = 0, j = ws.length - 1, trips = 0;
    while (i <= j) {
        if (i < j && ws[i] + ws[j] <= limit) i++;
        j--; trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] weights, int limit) {
        int[] ws = weights.clone();
        Arrays.sort(ws);
        int i = 0, j = ws.length - 1, trips = 0;
        while (i <= j) {
            if (i < j && ws[i] + ws[j] <= limit) i++;
            j--; trips++;
        }
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTrips(vector<int>& weights, int limit) {
        vector<int> ws = weights;
        sort(ws.begin(), ws.end());
        int i = 0, j = (int)ws.size() - 1, trips = 0;
        while (i <= j) {
            if (i < j && ws[i] + ws[j] <= limit) i++;
            j--; trips++;
        }
        return trips;
    }
};`,
  },

  // minTaps(reach: List[int]) -> int — interval-cover greedy jump game.
  'pghub-b11-garden-water': {
    javascript: `var minTaps = function(reach) {
    const n = reach.length - 1;
    const farthest = new Array(n + 1).fill(0);
    for (let i = 0; i < reach.length; i++) {
        const left = Math.max(0, i - reach[i]);
        const right = Math.min(n, i + reach[i]);
        farthest[left] = Math.max(farthest[left], right);
    }
    let taps = 0, curEnd = 0, nextEnd = 0, i = 0;
    while (curEnd < n) {
        while (i <= curEnd) { nextEnd = Math.max(nextEnd, farthest[i]); i++; }
        if (nextEnd <= curEnd) return -1;
        taps++; curEnd = nextEnd;
    }
    return taps;
};`,
    java: `class Solution {
    public int minTaps(int[] reach) {
        int n = reach.length - 1;
        int[] farthest = new int[n + 1];
        for (int i = 0; i < reach.length; i++) {
            int left = Math.max(0, i - reach[i]);
            int right = Math.min(n, i + reach[i]);
            farthest[left] = Math.max(farthest[left], right);
        }
        int taps = 0, curEnd = 0, nextEnd = 0, i = 0;
        while (curEnd < n) {
            while (i <= curEnd) { nextEnd = Math.max(nextEnd, farthest[i]); i++; }
            if (nextEnd <= curEnd) return -1;
            taps++; curEnd = nextEnd;
        }
        return taps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minTaps(vector<int>& reach) {
        int n = (int)reach.size() - 1;
        vector<int> farthest(n + 1, 0);
        for (int i = 0; i < (int)reach.size(); i++) {
            int left = max(0, i - reach[i]);
            int right = min(n, i + reach[i]);
            farthest[left] = max(farthest[left], right);
        }
        int taps = 0, curEnd = 0, nextEnd = 0, i = 0;
        while (curEnd < n) {
            while (i <= curEnd) { nextEnd = max(nextEnd, farthest[i]); i++; }
            if (nextEnd <= curEnd) return -1;
            taps++; curEnd = nextEnd;
        }
        return taps;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int — count land edges.
  'pghub-b11-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perimeter = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                perimeter += 4;
                if (r > 0 && grid[r-1][c] === 1) perimeter -= 2;
                if (c > 0 && grid[r][c-1] === 1) perimeter -= 2;
            }
        }
    }
    return perimeter;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r-1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perimeter -= 2;
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
        int rows = grid.size(), cols = grid[0].size(), perimeter = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perimeter += 4;
                    if (r > 0 && grid[r-1][c] == 1) perimeter -= 2;
                    if (c > 0 && grid[r][c-1] == 1) perimeter -= 2;
                }
            }
        }
        return perimeter;
    }
};`,
  },

  // pivotIndex(ledger: List[int]) -> int — running-sum balance point.
  'pghub-b11-ledger-balance': {
    javascript: `var pivotIndex = function(ledger) {
    let total = 0;
    for (const v of ledger) total += v;
    let left = 0;
    for (let i = 0; i < ledger.length; i++) {
        if (left === total - left - ledger[i]) return i;
        left += ledger[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int pivotIndex(int[] ledger) {
        long total = 0;
        for (int v : ledger) total += v;
        long left = 0;
        for (int i = 0; i < ledger.length; i++) {
            if (left == total - left - ledger[i]) return i;
            left += ledger[i];
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int pivotIndex(vector<int>& ledger) {
        long long total = 0;
        for (int v : ledger) total += v;
        long long left = 0;
        for (int i = 0; i < (int)ledger.size(); i++) {
            if (left == total - left - ledger[i]) return i;
            left += ledger[i];
        }
        return -1;
    }
};`,
  },

  // countPrimesBelow(n) -> int — Sieve of Eratosthenes.
  'pghub-b11-prime-factory': {
    javascript: `var countPrimesBelow = function(n) {
    if (n < 3) return 0;
    const sieve = new Uint8Array(n).fill(1);
    sieve[0] = 0; sieve[1] = 0;
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
    public int countPrimesBelow(int n) {
        if (n < 3) return 0;
        boolean[] composite = new boolean[n];
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (!composite[i]) {
                count++;
                if ((long) i * i < n) {
                    for (int j = i * i; j < n; j += i) composite[j] = true;
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
    int countPrimesBelow(int n) {
        if (n < 3) return 0;
        vector<char> composite(n, 0);
        int count = 0;
        for (int i = 2; i < n; i++) {
            if (!composite[i]) {
                count++;
                if ((long long) i * i < n) {
                    for (int j = i * i; j < n; j += i) composite[j] = 1;
                }
            }
        }
        return count;
    }
};`,
  },

  // ticketTime(tickets: List[int], target) -> int — capped contributions.
  'pghub-b11-queue-tickets': {
    javascript: `var ticketTime = function(tickets, target) {
    let time = 0;
    for (let i = 0; i < tickets.length; i++) {
        if (i <= target) time += Math.min(tickets[i], tickets[target]);
        else time += Math.min(tickets[i], tickets[target] - 1);
    }
    return time;
};`,
    java: `class Solution {
    public int ticketTime(int[] tickets, int target) {
        int time = 0;
        for (int i = 0; i < tickets.length; i++) {
            if (i <= target) time += Math.min(tickets[i], tickets[target]);
            else time += Math.min(tickets[i], tickets[target] - 1);
        }
        return time;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ticketTime(vector<int>& tickets, int target) {
        int time = 0;
        for (int i = 0; i < (int)tickets.size(); i++) {
            if (i <= target) time += min(tickets[i], tickets[target]);
            else time += min(tickets[i], tickets[target] - 1);
        }
        return time;
    }
};`,
  },

  // longestRising(relics: List[int]) -> int — LIS via patience/binary search.
  'pghub-b11-relic-subseq': {
    javascript: `var longestRising = function(relics) {
    const tails = [];
    for (const x of relics) {
        // bisect_left
        let lo = 0, hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (tails[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        if (lo === tails.length) tails.push(x);
        else tails[lo] = x;
    }
    return tails.length;
};`,
    java: `class Solution {
    public int longestRising(int[] relics) {
        int[] tails = new int[relics.length];
        int size = 0;
        for (int x : relics) {
            int lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = x;
            if (lo == size) size++;
        }
        return size;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRising(vector<int>& relics) {
        vector<int> tails;
        for (int x : relics) {
            auto it = lower_bound(tails.begin(), tails.end(), x);
            if (it == tails.end()) tails.push_back(x);
            else *it = x;
        }
        return (int)tails.size();
    }
};`,
  },

  // compress(s: str) -> str — run-length encoding.
  'pghub-b11-signal-runs': {
    javascript: `var compress = function(s) {
    let out = '';
    let i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        out += s[i] + (j - i);
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
            out.append(s.charAt(i)).append(j - i);
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
        int i = 0, n = (int)s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            out += s[i];
            out += to_string(j - i);
            i = j;
        }
        return out;
    }
};`,
  },

  // maxMergeValue(tokens: List[int]) -> int — Huffman optimal merge via min-heap.
  'pghub-b11-token-merge': {
    javascript: `var maxMergeValue = function(tokens) {
    if (tokens.length <= 1) return 0;
    const heap = [...tokens];
    const n = heap.length;
    const down = (i) => { const len = heap.length; for (;;) { let s = i, l = 2*i+1, r = 2*i+2; if (l < len && heap[l] < heap[s]) s = l; if (r < len && heap[r] < heap[s]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } };
    const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (heap[p] <= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    for (let i = (n >> 1) - 1; i >= 0; i--) down(i);
    const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    let cost = 0;
    while (heap.length > 1) {
        const a = pop(), b = pop();
        const s = a + b;
        cost += s;
        push(s);
    }
    return cost;
};`,
    java: `import java.util.*;
class Solution {
    public int maxMergeValue(int[] tokens) {
        if (tokens.length <= 1) return 0;
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int t : tokens) heap.offer((long) t);
        long cost = 0;
        while (heap.size() > 1) {
            long a = heap.poll(), b = heap.poll();
            long s = a + b;
            cost += s;
            heap.offer(s);
        }
        return (int) cost;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxMergeValue(vector<int>& tokens) {
        if (tokens.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<>> heap;
        for (int t : tokens) heap.push((long long) t);
        long long cost = 0;
        while (heap.size() > 1) {
            long long a = heap.top(); heap.pop();
            long long b = heap.top(); heap.pop();
            long long s = a + b;
            cost += s;
            heap.push(s);
        }
        return (int) cost;
    }
};`,
  },

  // reachableTowns(n, roads: List[List[int]], start) -> int — BFS component size.
  'pghub-b11-toll-booth': {
    javascript: `var reachableTowns = function(n, roads, start) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of roads) { adj[u].push(v); adj[v].push(u); }
    const seen = new Array(n).fill(false);
    seen[start] = true;
    const q = [start];
    let head = 0, count = 0;
    while (head < q.length) {
        const node = q[head++];
        count++;
        for (const nxt of adj[node]) {
            if (!seen[nxt]) { seen[nxt] = true; q.push(nxt); }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int reachableTowns(int n, int[][] roads, int start) {
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] r : roads) { adj[r[0]].add(r[1]); adj[r[1]].add(r[0]); }
        boolean[] seen = new boolean[n];
        seen[start] = true;
        Deque<Integer> q = new ArrayDeque<>();
        q.offer(start);
        int count = 0;
        while (!q.isEmpty()) {
            int node = q.poll();
            count++;
            for (int nxt : adj[node]) {
                if (!seen[nxt]) { seen[nxt] = true; q.offer(nxt); }
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableTowns(int n, vector<vector<int>>& roads, int start) {
        vector<vector<int>> adj(n);
        for (auto& r : roads) { adj[r[0]].push_back(r[1]); adj[r[1]].push_back(r[0]); }
        vector<char> seen(n, 0);
        seen[start] = 1;
        queue<int> q;
        q.push(start);
        int count = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            count++;
            for (int nxt : adj[node]) {
                if (!seen[nxt]) { seen[nxt] = 1; q.push(nxt); }
            }
        }
        return count;
    }
};`,
  },

  // findSmallest(dial: List[int]) -> int — rotated-array min via binary search.
  'pghub-b11-vault-rotate': {
    javascript: `var findSmallest = function(dial) {
    let lo = 0, hi = dial.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (dial[mid] > dial[hi]) lo = mid + 1;
        else hi = mid;
    }
    return dial[lo];
};`,
    java: `class Solution {
    public int findSmallest(int[] dial) {
        int lo = 0, hi = dial.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (dial[mid] > dial[hi]) lo = mid + 1;
            else hi = mid;
        }
        return dial[lo];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findSmallest(vector<int>& dial) {
        int lo = 0, hi = (int)dial.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (dial[mid] > dial[hi]) lo = mid + 1;
            else hi = mid;
        }
        return dial[lo];
    }
};`,
  },

  // minRefills(stock: List[int], cap) -> int — sum of clamped deficits.
  'pghub-b11-warehouse-shelf': {
    javascript: `var minRefills = function(stock, cap) {
    let total = 0;
    for (const s of stock) total += Math.max(0, cap - s);
    return total;
};`,
    java: `class Solution {
    public int minRefills(int[] stock, int cap) {
        long total = 0;
        for (int s : stock) total += Math.max(0, cap - s);
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRefills(vector<int>& stock, int cap) {
        long long total = 0;
        for (int s : stock) total += max(0, cap - s);
        return (int) total;
    }
};`,
  },

  // countAnagramWindows(text: str, pattern: str) -> int — fixed sliding window.
  'pghub-b12-anagram-windows': {
    javascript: `var countAnagramWindows = function(text, pattern) {
    const m = pattern.length, n = text.length;
    if (m > n) return 0;
    const need = new Array(128).fill(0), window = new Array(128).fill(0);
    for (let i = 0; i < m; i++) {
        need[pattern.charCodeAt(i)]++;
        window[text.charCodeAt(i)]++;
    }
    const matches = () => { for (let i = 0; i < 128; i++) if (need[i] !== window[i]) return false; return true; };
    let count = matches() ? 1 : 0;
    for (let i = m; i < n; i++) {
        window[text.charCodeAt(i)]++;
        window[text.charCodeAt(i - m)]--;
        if (matches()) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countAnagramWindows(String text, String pattern) {
        int m = pattern.length(), n = text.length();
        if (m > n) return 0;
        int[] need = new int[128], window = new int[128];
        for (int i = 0; i < m; i++) {
            need[pattern.charAt(i)]++;
            window[text.charAt(i)]++;
        }
        int count = java.util.Arrays.equals(need, window) ? 1 : 0;
        for (int i = m; i < n; i++) {
            window[text.charAt(i)]++;
            window[text.charAt(i - m)]--;
            if (java.util.Arrays.equals(need, window)) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countAnagramWindows(string text, string pattern) {
        int m = (int)pattern.size(), n = (int)text.size();
        if (m > n) return 0;
        array<int,128> need{}, window{};
        for (int i = 0; i < m; i++) {
            need[(unsigned char)pattern[i]]++;
            window[(unsigned char)text[i]]++;
        }
        int count = (need == window) ? 1 : 0;
        for (int i = m; i < n; i++) {
            window[(unsigned char)text[i]]++;
            window[(unsigned char)text[i - m]]--;
            if (need == window) count++;
        }
        return count;
    }
};`,
  },

  // maxReserve(fuel: List[int]) -> int — non-adjacent max-sum DP.
  'pghub-b12-caravan-fuel': {
    javascript: `var maxReserve = function(fuel) {
    let take = 0, skip = 0;
    for (const v of fuel) {
        const newTake = skip + v;
        const newSkip = Math.max(skip, take);
        take = newTake; skip = newSkip;
    }
    return Math.max(take, skip);
};`,
    java: `class Solution {
    public int maxReserve(int[] fuel) {
        long take = 0, skip = 0;
        for (int v : fuel) {
            long newTake = skip + v;
            long newSkip = Math.max(skip, take);
            take = newTake; skip = newSkip;
        }
        return (int) Math.max(take, skip);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxReserve(vector<int>& fuel) {
        long long take = 0, skip = 0;
        for (int v : fuel) {
            long long newTake = skip + v;
            long long newSkip = max(skip, take);
            take = newTake; skip = newSkip;
        }
        return (int) max(take, skip);
    }
};`,
  },

  // countWays(coins: List[int], amount) -> int — unbounded knapsack count.
  'pghub-b12-coin-combos': {
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

  // totalWet(drops: List[List[int]]) -> int — merge intervals, sum lengths.
  'pghub-b12-dewdrop-merge': {
    javascript: `var totalWet = function(drops) {
    const sorted = [...drops].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let total = 0;
    let curS = sorted[0][0], curE = sorted[0][1];
    for (let i = 1; i < sorted.length; i++) {
        const [s, e] = sorted[i];
        if (s <= curE) curE = Math.max(curE, e);
        else { total += curE - curS; curS = s; curE = e; }
    }
    total += curE - curS;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int totalWet(int[][] drops) {
        int[][] sorted = drops.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        long total = 0;
        int curS = sorted[0][0], curE = sorted[0][1];
        for (int i = 1; i < sorted.length; i++) {
            int s = sorted[i][0], e = sorted[i][1];
            if (s <= curE) curE = Math.max(curE, e);
            else { total += curE - curS; curS = s; curE = e; }
        }
        total += curE - curS;
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalWet(vector<vector<int>>& drops) {
        vector<vector<int>> sorted = drops;
        sort(sorted.begin(), sorted.end());
        long long total = 0;
        int curS = sorted[0][0], curE = sorted[0][1];
        for (size_t i = 1; i < sorted.size(); i++) {
            int s = sorted[i][0], e = sorted[i][1];
            if (s <= curE) curE = max(curE, e);
            else { total += curE - curS; curS = s; curE = e; }
        }
        total += curE - curS;
        return (int) total;
    }
};`,
  },

  // maxHappiness(joy: List[int], rounds) -> int — greedy max-heap decrement.
  'pghub-b12-festival-seating': {
    javascript: `var maxHappiness = function(joy, rounds) {
    const heap = [...joy];
    const down = (i) => { const len = heap.length; for (;;) { let s = i, l = 2*i+1, r = 2*i+2; if (l < len && heap[l] > heap[s]) s = l; if (r < len && heap[r] > heap[s]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } };
    const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (heap[p] >= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i);
    let total = 0;
    for (let r = 0; r < rounds; r++) {
        const top = heap[0];
        total += top;
        heap[0] = Math.max(0, top - 1);
        down(0);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int maxHappiness(int[] joy, int rounds) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int j : joy) heap.offer(j);
        long total = 0;
        for (int r = 0; r < rounds; r++) {
            int top = heap.poll();
            total += top;
            heap.offer(Math.max(0, top - 1));
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxHappiness(vector<int>& joy, int rounds) {
        priority_queue<int> heap(joy.begin(), joy.end());
        long long total = 0;
        for (int r = 0; r < rounds; r++) {
            int top = heap.top(); heap.pop();
            total += top;
            heap.push(max(0, top - 1));
        }
        return (int) total;
    }
};`,
  },

  // prefixCounts(words: List[str], queries: List[str]) -> List[int] — trie prefix count.
  'pghub-b12-glyph-trie': {
    javascript: `var prefixCounts = function(words, queries) {
    const root = { ch: {}, count: 0 };
    for (const w of words) {
        let node = root;
        for (const c of w) {
            if (!node.ch[c]) node.ch[c] = { ch: {}, count: 0 };
            node = node.ch[c];
            node.count++;
        }
    }
    const res = [];
    for (const q of queries) {
        let node = root, ok = true;
        for (const c of q) {
            if (!node.ch[c]) { ok = false; break; }
            node = node.ch[c];
        }
        res.push(ok ? node.count : 0);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    static class Node { Map<Character, Node> ch = new HashMap<>(); int count = 0; }
    public List<Integer> prefixCounts(String[] words, String[] queries) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char c : w.toCharArray()) {
                node = node.ch.computeIfAbsent(c, k -> new Node());
                node.count++;
            }
        }
        List<Integer> res = new ArrayList<>();
        for (String q : queries) {
            Node node = root;
            boolean ok = true;
            for (char c : q.toCharArray()) {
                if (!node.ch.containsKey(c)) { ok = false; break; }
                node = node.ch.get(c);
            }
            res.add(ok ? node.count : 0);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    struct Node { unordered_map<char, Node*> ch; int count = 0; };
    vector<int> prefixCounts(vector<string>& words, vector<string>& queries) {
        Node* root = new Node();
        for (auto& w : words) {
            Node* node = root;
            for (char c : w) {
                if (!node->ch.count(c)) node->ch[c] = new Node();
                node = node->ch[c];
                node->count++;
            }
        }
        vector<int> res;
        for (auto& q : queries) {
            Node* node = root;
            bool ok = true;
            for (char c : q) {
                if (!node->ch.count(c)) { ok = false; break; }
                node = node->ch[c];
            }
            res.push_back(ok ? node->count : 0);
        }
        return res;
    }
};`,
  },

  // reverseAbove(threads: List[int], cutoff) -> List[int] — reverse selected values in place.
  'pghub-b12-loom-thread': {
    javascript: `var reverseAbove = function(threads, cutoff) {
    const big = threads.filter(v => v > cutoff);
    const res = [...threads];
    let k = big.length - 1;
    for (let i = 0; i < res.length; i++) {
        if (res[i] > cutoff) { res[i] = big[k]; k--; }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] reverseAbove(int[] threads, int cutoff) {
        List<Integer> big = new ArrayList<>();
        for (int v : threads) if (v > cutoff) big.add(v);
        int[] res = threads.clone();
        int k = big.size() - 1;
        for (int i = 0; i < res.length; i++) {
            if (res[i] > cutoff) { res[i] = big.get(k); k--; }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reverseAbove(vector<int>& threads, int cutoff) {
        vector<int> big;
        for (int v : threads) if (v > cutoff) big.push_back(v);
        vector<int> res = threads;
        int k = (int)big.size() - 1;
        for (size_t i = 0; i < res.size(); i++) {
            if (res[i] > cutoff) { res[i] = big[k]; k--; }
        }
        return res;
    }
};`,
  },

  // shortestEscape(maze: List[List[int]]) -> int — BFS shortest path.
  'pghub-b12-maze-escape': {
    javascript: `var shortestEscape = function(maze) {
    const rows = maze.length, cols = maze[0].length;
    if (maze[0][0] === 1 || maze[rows-1][cols-1] === 1) return -1;
    if (rows === 1 && cols === 1) return 0;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    seen[0][0] = true;
    const q = [[0, 0, 0]];
    let head = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (head < q.length) {
        const [r, c, d] = q[head++];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && maze[nr][nc] === 0) {
                if (nr === rows-1 && nc === cols-1) return d + 1;
                seen[nr][nc] = true;
                q.push([nr, nc, d + 1]);
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int shortestEscape(int[][] maze) {
        int rows = maze.length, cols = maze[0].length;
        if (maze[0][0] == 1 || maze[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        boolean[][] seen = new boolean[rows][cols];
        seen[0][0] = true;
        Deque<int[]> q = new ArrayDeque<>();
        q.offer(new int[]{0, 0, 0});
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            int r = cur[0], c = cur[1], d = cur[2];
            for (int[] dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && maze[nr][nc] == 0) {
                    if (nr == rows-1 && nc == cols-1) return d + 1;
                    seen[nr][nc] = true;
                    q.offer(new int[]{nr, nc, d + 1});
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
    int shortestEscape(vector<vector<int>>& maze) {
        int rows = maze.size(), cols = maze[0].size();
        if (maze[0][0] == 1 || maze[rows-1][cols-1] == 1) return -1;
        if (rows == 1 && cols == 1) return 0;
        vector<vector<char>> seen(rows, vector<char>(cols, 0));
        seen[0][0] = 1;
        queue<array<int,3>> q;
        q.push({0, 0, 0});
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!q.empty()) {
            auto [r, c, d] = q.front(); q.pop();
            for (auto& dir : dirs) {
                int nr = r + dir[0], nc = c + dir[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && maze[nr][nc] == 0) {
                    if (nr == rows-1 && nc == cols-1) return d + 1;
                    seen[nr][nc] = 1;
                    q.push({nr, nc, d + 1});
                }
            }
        }
        return -1;
    }
};`,
  },

  // distinctPrimeFactors(n) -> int — trial division.
  'pghub-b12-prime-gear': {
    javascript: `var distinctPrimeFactors = function(n) {
    let count = 0, d = 2;
    while (d * d <= n) {
        if (n % d === 0) {
            count++;
            while (n % d === 0) n = Math.floor(n / d);
        }
        d++;
    }
    if (n > 1) count++;
    return count;
};`,
    java: `class Solution {
    public int distinctPrimeFactors(int n) {
        int count = 0;
        long d = 2;
        while (d * d <= n) {
            if (n % d == 0) {
                count++;
                while (n % d == 0) n /= d;
            }
            d++;
        }
        if (n > 1) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctPrimeFactors(int n) {
        int count = 0;
        long long d = 2;
        while (d * d <= n) {
            if (n % d == 0) {
                count++;
                while (n % d == 0) n /= d;
            }
            d++;
        }
        if (n > 1) count++;
        return count;
    }
};`,
  },

  // lonelyRelic(relics: List[int]) -> int — XOR all.
  'pghub-b12-relic-xor': {
    javascript: `var lonelyRelic = function(relics) {
    let acc = 0;
    for (const v of relics) acc ^= v;
    return acc;
};`,
    java: `class Solution {
    public int lonelyRelic(int[] relics) {
        int acc = 0;
        for (int v : relics) acc ^= v;
        return acc;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lonelyRelic(vector<int>& relics) {
        int acc = 0;
        for (int v : relics) acc ^= v;
        return acc;
    }
};`,
  },

  // cancelRunes(s: str) -> str — stack adjacent-pair cancellation.
  'pghub-b12-rune-stack': {
    javascript: `var cancelRunes = function(s) {
    const stack = [];
    for (const ch of s) {
        if (stack.length && stack[stack.length - 1] === ch) stack.pop();
        else stack.push(ch);
    }
    return stack.join('');
};`,
    java: `class Solution {
    public String cancelRunes(String s) {
        StringBuilder stack = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (stack.length() > 0 && stack.charAt(stack.length() - 1) == ch) stack.deleteCharAt(stack.length() - 1);
            else stack.append(ch);
        }
        return stack.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string cancelRunes(string s) {
        string stack;
        for (char ch : s) {
            if (!stack.empty() && stack.back() == ch) stack.pop_back();
            else stack.push_back(ch);
        }
        return stack;
    }
};`,
  },

  // firstBelow(readings: List[int], threshold) -> int — binary search on monotone predicate.
  'pghub-b12-signal-decay': {
    javascript: `var firstBelow = function(readings, threshold) {
    let lo = 0, hi = readings.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (readings[mid] < threshold) hi = mid;
        else lo = mid + 1;
    }
    return lo < readings.length ? lo : -1;
};`,
    java: `class Solution {
    public int firstBelow(int[] readings, int threshold) {
        int lo = 0, hi = readings.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (readings[mid] < threshold) hi = mid;
            else lo = mid + 1;
        }
        return lo < readings.length ? lo : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int firstBelow(vector<int>& readings, int threshold) {
        int lo = 0, hi = (int)readings.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (readings[mid] < threshold) hi = mid;
            else lo = mid + 1;
        }
        return lo < (int)readings.size() ? lo : -1;
    }
};`,
  },

  // largestColony(grid: List[List[int]]) -> int — iterative DFS flood fill, max size.
  'pghub-b12-spore-spread': {
    javascript: `var largestColony = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let sr = 0; sr < rows; sr++) {
        for (let sc = 0; sc < cols; sc++) {
            if (grid[sr][sc] !== 1) continue;
            let size = 0;
            const stack = [[sr, sc]];
            grid[sr][sc] = 0;
            while (stack.length) {
                const [r, c] = stack.pop();
                size++;
                for (const [dr, dc] of dirs) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
                        grid[nr][nc] = 0;
                        stack.push([nr, nc]);
                    }
                }
            }
            best = Math.max(best, size);
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int largestColony(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, best = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] != 1) continue;
                int size = 0;
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{sr, sc});
                grid[sr][sc] = 0;
                while (!stack.isEmpty()) {
                    int[] cur = stack.pop();
                    int r = cur[0], c = cur[1];
                    size++;
                    for (int[] dir : dirs) {
                        int nr = r + dir[0], nc = c + dir[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                            grid[nr][nc] = 0;
                            stack.push(new int[]{nr, nc});
                        }
                    }
                }
                best = Math.max(best, size);
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestColony(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), best = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] != 1) continue;
                int size = 0;
                vector<pair<int,int>> stack{{sr, sc}};
                grid[sr][sc] = 0;
                while (!stack.empty()) {
                    auto [r, c] = stack.back(); stack.pop_back();
                    size++;
                    for (auto& dir : dirs) {
                        int nr = r + dir[0], nc = c + dir[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                            grid[nr][nc] = 0;
                            stack.push_back({nr, nc});
                        }
                    }
                }
                best = max(best, size);
            }
        }
        return best;
    }
};`,
  },

  // refundTotal(prices: List[int], budget) -> int — first unaffordable cutoff.
  'pghub-b12-ticket-queue': {
    javascript: `var refundTotal = function(prices, budget) {
    for (let i = 0; i < prices.length; i++) {
        if (prices[i] > budget) return prices.length - i;
        budget -= prices[i];
    }
    return 0;
};`,
    java: `class Solution {
    public int refundTotal(int[] prices, int budget) {
        for (int i = 0; i < prices.length; i++) {
            if (prices[i] > budget) return prices.length - i;
            budget -= prices[i];
        }
        return 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int refundTotal(vector<int>& prices, int budget) {
        for (int i = 0; i < (int)prices.size(); i++) {
            if (prices[i] > budget) return (int)prices.size() - i;
            budget -= prices[i];
        }
        return 0;
    }
};`,
  },

  // minStacks(weights: List[int], limit) -> int — two-pointer greedy, -1 if any > limit.
  'pghub-b12-warehouse-stamp': {
    javascript: `var minStacks = function(weights, limit) {
    for (const w of weights) if (w > limit) return -1;
    const ws = [...weights].sort((a, b) => a - b);
    let i = 0, j = ws.length - 1, stacks = 0;
    while (i <= j) {
        if (i < j && ws[i] + ws[j] <= limit) i++;
        j--; stacks++;
    }
    return stacks;
};`,
    java: `import java.util.*;
class Solution {
    public int minStacks(int[] weights, int limit) {
        for (int w : weights) if (w > limit) return -1;
        int[] ws = weights.clone();
        Arrays.sort(ws);
        int i = 0, j = ws.length - 1, stacks = 0;
        while (i <= j) {
            if (i < j && ws[i] + ws[j] <= limit) i++;
            j--; stacks++;
        }
        return stacks;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minStacks(vector<int>& weights, int limit) {
        for (int w : weights) if (w > limit) return -1;
        vector<int> ws = weights;
        sort(ws.begin(), ws.end());
        int i = 0, j = (int)ws.size() - 1, stacks = 0;
        while (i <= j) {
            if (i < j && ws[i] + ws[j] <= limit) i++;
            j--; stacks++;
        }
        return stacks;
    }
};`,
  },

  // minCapacity(weights: List[int], trips) -> int — binary search on capacity.
  'pghub-b13-budget-search': {
    javascript: `var minCapacity = function(weights, trips) {
    const needed = (cap) => {
        let used = 1, load = 0;
        for (const w of weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used;
    };
    let lo = Math.max(...weights);
    let hi = weights.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= trips) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    private int needed(int[] weights, int cap) {
        int used = 1, load = 0;
        for (int w : weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used;
    }
    public int minCapacity(int[] weights, int trips) {
        long lo = 0, hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        while (lo < hi) {
            long mid = (lo + hi) / 2;
            if (needed(weights, (int) mid) <= trips) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int needed(vector<int>& weights, long long cap) {
        int used = 1; long long load = 0;
        for (int w : weights) {
            if (load + w > cap) { used++; load = 0; }
            load += w;
        }
        return used;
    }
    int minCapacity(vector<int>& weights, int trips) {
        long long lo = 0, hi = 0;
        for (int w : weights) { lo = max(lo, (long long) w); hi += w; }
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(weights, mid) <= trips) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // serviceOrder(patients: List[List[int]]) -> List[int] — max-severity, stable by arrival.
  'pghub-b13-clinic-queue': {
    javascript: `var serviceOrder = function(patients) {
    const indexed = patients.map((p, idx) => [p[1], idx, p[0]]);
    // sort by severity desc, then arrival index asc
    indexed.sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
    return indexed.map(x => x[2]);
};`,
    java: `import java.util.*;
class Solution {
    public int[] serviceOrder(int[][] patients) {
        Integer[] idx = new Integer[patients.length];
        for (int i = 0; i < patients.length; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> {
            if (patients[a][1] != patients[b][1]) return Integer.compare(patients[b][1], patients[a][1]);
            return Integer.compare(a, b);
        });
        int[] res = new int[patients.length];
        for (int i = 0; i < idx.length; i++) res[i] = patients[idx[i]][0];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> serviceOrder(vector<vector<int>>& patients) {
        int n = patients.size();
        vector<int> idx(n);
        for (int i = 0; i < n; i++) idx[i] = i;
        stable_sort(idx.begin(), idx.end(), [&](int a, int b) {
            return patients[a][1] > patients[b][1];
        });
        vector<int> res;
        for (int i : idx) res.push_back(patients[i][0]);
        return res;
    }
};`,
  },
};
