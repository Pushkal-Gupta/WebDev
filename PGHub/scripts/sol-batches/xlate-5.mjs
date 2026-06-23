// xlate-5: JS/Java/C++ translations of verified Python solutions.
// Targets slice [120,150) of solutions-backfill-targets.json
// (pyReal === true && missingLangs.length > 0, sorted by id asc).
// Each value carries only the missing languages (all three here).
// Signatures match generateTemplate() exactly:
//   javascript: var <method> = function(...) { }
//   java:       class Solution { public <ret> <method>(...) { } }
//   cpp:        #include <bits/stdc++.h>; class Solution { public: ... };

export default {
  // divisibleSubarrays(nums: List[int], k: int) -> int
  // Prefix-sum remainder counting. Python % is always non-negative; normalize.
  // Counts can be O(n^2) → long.
  'pghub-b17-subarray-divisible': {
    javascript: `var divisibleSubarrays = function(nums, k) {
    const freq = new Map();
    freq.set(0, 1);
    let prefix = 0, count = 0;
    for (const x of nums) {
        prefix += x;
        let r = prefix % k;
        if (r < 0) r += k;
        count += (freq.get(r) || 0);
        freq.set(r, (freq.get(r) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int divisibleSubarrays(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        freq.put(0, 1);
        long prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            int r = (int)(((prefix % k) + k) % k);
            count += freq.getOrDefault(r, 0);
            freq.merge(r, 1, Integer::sum);
        }
        return (int) count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int divisibleSubarrays(vector<int>& nums, int k) {
        unordered_map<int, int> freq;
        freq[0] = 1;
        long long prefix = 0, count = 0;
        for (int x : nums) {
            prefix += x;
            int r = (int)(((prefix % k) + k) % k);
            count += freq[r];
            freq[r]++;
        }
        return (int) count;
    }
};`,
  },

  // longestBalanced(s: str) -> int  — index stack seeded with -1.
  'pghub-b17-token-balance': {
    javascript: `var longestBalanced = function(s) {
    const stack = [-1];
    let best = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') {
            stack.push(i);
        } else {
            stack.pop();
            if (stack.length === 0) {
                stack.push(i);
            } else {
                best = Math.max(best, i - stack[stack.length - 1]);
            }
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestBalanced(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') {
                stack.push(i);
            } else {
                stack.pop();
                if (stack.isEmpty()) {
                    stack.push(i);
                } else {
                    best = Math.max(best, i - stack.peek());
                }
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestBalanced(string s) {
        vector<int> stack;
        stack.push_back(-1);
        int best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (s[i] == '(') {
                stack.push_back(i);
            } else {
                stack.pop_back();
                if (stack.empty()) {
                    stack.push_back(i);
                } else {
                    best = max(best, i - stack.back());
                }
            }
        }
        return best;
    }
};`,
  },

  // mergeVersions(a: List[int], b: List[int]) -> List[int]  — sorted merge + dedup.
  'pghub-b17-version-merge': {
    javascript: `var mergeVersions = function(a, b) {
    let i = 0, j = 0;
    const out = [];
    while (i < a.length || j < b.length) {
        let v;
        if (j >= b.length || (i < a.length && a[i] <= b[j])) {
            v = a[i]; i++;
        } else {
            v = b[j]; j++;
        }
        if (out.length === 0 || out[out.length - 1] !== v) out.push(v);
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] mergeVersions(int[] a, int[] b) {
        int i = 0, j = 0;
        List<Integer> out = new ArrayList<>();
        while (i < a.length || j < b.length) {
            int v;
            if (j >= b.length || (i < a.length && a[i] <= b[j])) {
                v = a[i]; i++;
            } else {
                v = b[j]; j++;
            }
            if (out.isEmpty() || out.get(out.size() - 1) != v) out.add(v);
        }
        int[] res = new int[out.size()];
        for (int t = 0; t < out.size(); t++) res[t] = out.get(t);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> mergeVersions(vector<int>& a, vector<int>& b) {
        int i = 0, j = 0;
        vector<int> out;
        while (i < (int)a.size() || j < (int)b.size()) {
            int v;
            if (j >= (int)b.size() || (i < (int)a.size() && a[i] <= b[j])) {
                v = a[i]; i++;
            } else {
                v = b[j]; j++;
            }
            if (out.empty() || out.back() != v) out.push_back(v);
        }
        return out;
    }
};`,
  },

  // minLamps(shelves: List[List[int]], reach: int) -> int  — greedy interval cover.
  // covered_until = None sentinel → use a hasCovered flag / sentinel value.
  'pghub-b17-warehouse-aisles': {
    javascript: `var minLamps = function(shelves, reach) {
    const intervals = shelves.map(p => [p[0], p[1]]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const span = 2 * reach + 1;
    let lamps = 0;
    let coveredUntil = null;
    for (const [s, e] of intervals) {
        let pos = (coveredUntil === null || coveredUntil < s) ? s : coveredUntil + 1;
        if (coveredUntil !== null && coveredUntil >= e) continue;
        while (pos <= e) {
            lamps++;
            coveredUntil = pos + span - 1;
            if (coveredUntil >= e) break;
            pos = coveredUntil + 1;
        }
    }
    return lamps;
};`,
    java: `import java.util.*;
class Solution {
    public int minLamps(int[][] shelves, int reach) {
        int[][] intervals = new int[shelves.length][];
        for (int i = 0; i < shelves.length; i++) intervals[i] = new int[]{shelves[i][0], shelves[i][1]};
        Arrays.sort(intervals, (x, y) -> x[0] != y[0] ? Integer.compare(x[0], y[0]) : Integer.compare(x[1], y[1]));
        long span = 2L * reach + 1;
        int lamps = 0;
        boolean hasCovered = false;
        long coveredUntil = 0;
        for (int[] iv : intervals) {
            int s = iv[0], e = iv[1];
            long pos = (!hasCovered || coveredUntil < s) ? s : coveredUntil + 1;
            if (hasCovered && coveredUntil >= e) continue;
            while (pos <= e) {
                lamps++;
                coveredUntil = pos + span - 1;
                hasCovered = true;
                if (coveredUntil >= e) break;
                pos = coveredUntil + 1;
            }
        }
        return lamps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minLamps(vector<vector<int>>& shelves, int reach) {
        vector<vector<int>> intervals = shelves;
        sort(intervals.begin(), intervals.end(), [](const vector<int>& x, const vector<int>& y){
            return x[0] != y[0] ? x[0] < y[0] : x[1] < y[1];
        });
        long long span = 2LL * reach + 1;
        int lamps = 0;
        bool hasCovered = false;
        long long coveredUntil = 0;
        for (auto& iv : intervals) {
            int s = iv[0], e = iv[1];
            long long pos = (!hasCovered || coveredUntil < s) ? s : coveredUntil + 1;
            if (hasCovered && coveredUntil >= e) continue;
            while (pos <= e) {
                lamps++;
                coveredUntil = pos + span - 1;
                hasCovered = true;
                if (coveredUntil >= e) break;
                pos = coveredUntil + 1;
            }
        }
        return lamps;
    }
};`,
  },

  // minRepairs(s: str) -> int  — unmatched-bracket counting.
  'pghub-b18-bracket-repair': {
    javascript: `var minRepairs = function(s) {
    let openCount = 0, insertions = 0;
    for (const ch of s) {
        if (ch === '(') openCount++;
        else {
            if (openCount > 0) openCount--;
            else insertions++;
        }
    }
    return insertions + openCount;
};`,
    java: `class Solution {
    public int minRepairs(String s) {
        int openCount = 0, insertions = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') openCount++;
            else {
                if (openCount > 0) openCount--;
                else insertions++;
            }
        }
        return insertions + openCount;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRepairs(string s) {
        int openCount = 0, insertions = 0;
        for (char ch : s) {
            if (ch == '(') openCount++;
            else {
                if (openCount > 0) openCount--;
                else insertions++;
            }
        }
        return insertions + openCount;
    }
};`,
  },

  // maxBay(arrivals: List[List[int]]) -> int  — two heaps (free bays, in-use by end).
  'pghub-b18-bus-bays': {
    javascript: `var maxBay = function(arrivals) {
    // Min-heap helper.
    const heapPush = (h, v, less) => {
        h.push(v);
        let i = h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (less(h[i], h[p])) { [h[i], h[p]] = [h[p], h[i]]; i = p; } else break;
        }
    };
    const heapPop = (h, less) => {
        const top = h[0], last = h.pop();
        if (h.length > 0) {
            h[0] = last;
            let i = 0;
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, sm = i;
                if (l < h.length && less(h[l], h[sm])) sm = l;
                if (r < h.length && less(h[r], h[sm])) sm = r;
                if (sm === i) break;
                [h[i], h[sm]] = [h[sm], h[i]]; i = sm;
            }
        }
        return top;
    };
    const buses = arrivals.map(x => [x[0], x[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const free = [1];                 // min-heap of free bay numbers
    const inUse = [];                 // min-heap of [end, bay]
    const freeLess = (a, b) => a < b;
    const useLess = (a, b) => a[0] - b[0] || a[1] - b[1];
    let nextBay = 2, maxBay = 0;
    for (const [start, end] of buses) {
        while (inUse.length > 0 && inUse[0][0] <= start) {
            const [, bay] = heapPop(inUse, useLess);
            heapPush(free, bay, freeLess);
        }
        let bay;
        if (free.length > 0) bay = heapPop(free, freeLess);
        else { bay = nextBay; nextBay++; }
        maxBay = Math.max(maxBay, bay);
        heapPush(inUse, [end, bay], useLess);
    }
    return maxBay;
};`,
    java: `import java.util.*;
class Solution {
    public int maxBay(int[][] arrivals) {
        int[][] buses = new int[arrivals.length][];
        for (int i = 0; i < arrivals.length; i++) buses[i] = new int[]{arrivals[i][0], arrivals[i][1]};
        Arrays.sort(buses, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        PriorityQueue<Integer> free = new PriorityQueue<>();
        free.add(1);
        PriorityQueue<int[]> inUse = new PriorityQueue<>((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int nextBay = 2, maxBay = 0;
        for (int[] bus : buses) {
            int start = bus[0], end = bus[1];
            while (!inUse.isEmpty() && inUse.peek()[0] <= start) {
                int bay = inUse.poll()[1];
                free.add(bay);
            }
            int bay;
            if (!free.isEmpty()) bay = free.poll();
            else { bay = nextBay; nextBay++; }
            maxBay = Math.max(maxBay, bay);
            inUse.add(new int[]{end, bay});
        }
        return maxBay;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxBay(vector<vector<int>>& arrivals) {
        vector<vector<int>> buses = arrivals;
        sort(buses.begin(), buses.end(), [](const vector<int>& a, const vector<int>& b){
            return a[0] != b[0] ? a[0] < b[0] : a[1] < b[1];
        });
        priority_queue<int, vector<int>, greater<int>> freeBays;
        freeBays.push(1);
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> inUse;
        int nextBay = 2, maxBay = 0;
        for (auto& bus : buses) {
            int start = bus[0], end = bus[1];
            while (!inUse.empty() && inUse.top().first <= start) {
                int bay = inUse.top().second; inUse.pop();
                freeBays.push(bay);
            }
            int bay;
            if (!freeBays.empty()) { bay = freeBays.top(); freeBays.pop(); }
            else { bay = nextBay; nextBay++; }
            maxBay = max(maxBay, bay);
            inUse.push({end, bay});
        }
        return maxBay;
    }
};`,
  },

  // nearestTidy(color: str) -> str  — per channel pick nearest d*17.
  'pghub-b18-color-blend': {
    javascript: `var nearestTidy = function(color) {
    const hexd = "0123456789abcdef";
    const best = (byte) => {
        let chosen = null;
        for (let d = 0; d < 16; d++) {
            const val = d * 17;
            const dist = (val - byte) * (val - byte);
            if (chosen === null || dist < chosen[0]) chosen = [dist, val, d];
        }
        return chosen[2];
    };
    let out = "#";
    for (let k = 1; k < 7; k += 2) {
        const byte = parseInt(color.substring(k, k + 2), 16);
        const d = best(byte);
        out += hexd[d] + hexd[d];
    }
    return out;
};`,
    java: `class Solution {
    public String nearestTidy(String color) {
        String hexd = "0123456789abcdef";
        StringBuilder out = new StringBuilder("#");
        for (int k = 1; k < 7; k += 2) {
            int byteVal = Integer.parseInt(color.substring(k, k + 2), 16);
            int d = best(byteVal);
            out.append(hexd.charAt(d)).append(hexd.charAt(d));
        }
        return out.toString();
    }
    private int best(int byteVal) {
        int chosenD = -1;
        long chosenDist = Long.MAX_VALUE;
        for (int d = 0; d < 16; d++) {
            int val = d * 17;
            long dist = (long)(val - byteVal) * (val - byteVal);
            if (dist < chosenDist) { chosenDist = dist; chosenD = d; }
        }
        return chosenD;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string nearestTidy(string color) {
        string hexd = "0123456789abcdef";
        auto best = [&](int byteVal) {
            int chosenD = -1;
            long long chosenDist = LLONG_MAX;
            for (int d = 0; d < 16; d++) {
                int val = d * 17;
                long long dist = (long long)(val - byteVal) * (val - byteVal);
                if (dist < chosenDist) { chosenDist = dist; chosenD = d; }
            }
            return chosenD;
        };
        string out = "#";
        for (int k = 1; k < 7; k += 2) {
            int byteVal = stoi(color.substr(k, 2), nullptr, 16);
            int d = best(byteVal);
            out += hexd[d];
            out += hexd[d];
        }
        return out;
    }
};`,
  },

  // minTrips(people: List[int], limit: int) -> int  — sorted two-pointer.
  'pghub-b18-elevator-trips': {
    javascript: `var minTrips = function(people, limit) {
    const p = people.slice().sort((a, b) => a - b);
    let i = 0, j = p.length - 1, trips = 0;
    while (i <= j) {
        if (p[i] + p[j] <= limit) i++;
        j--;
        trips++;
    }
    return trips;
};`,
    java: `import java.util.*;
class Solution {
    public int minTrips(int[] people, int limit) {
        int[] p = people.clone();
        Arrays.sort(p);
        int i = 0, j = p.length - 1, trips = 0;
        while (i <= j) {
            if (p[i] + p[j] <= limit) i++;
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
    int minTrips(vector<int>& people, int limit) {
        vector<int> p = people;
        sort(p.begin(), p.end());
        int i = 0, j = (int)p.size() - 1, trips = 0;
        while (i <= j) {
            if (p[i] + p[j] <= limit) i++;
            j--;
            trips++;
        }
        return trips;
    }
};`,
  },

  // distinctIslands(grid: List[List[int]]) -> int  — BFS shape signature.
  'pghub-b18-island-shapes': {
    javascript: `var distinctIslands = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const seen = new Set();
    const shapes = new Set();
    const key = (r, c) => r * cols + c;
    const bfs = (sr, sc) => {
        const cells = [];
        const q = [[sr, sc]];
        seen.add(key(sr, sc));
        let head = 0;
        while (head < q.length) {
            const [r, c] = q[head++];
            cells.push((r - sr) + ',' + (c - sc));
            for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen.has(key(nr, nc))) {
                    seen.add(key(nr, nc));
                    q.push([nr, nc]);
                }
            }
        }
        cells.sort();
        return cells.join(';');
    };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1 && !seen.has(key(r, c))) {
                shapes.add(bfs(r, c));
            }
        }
    }
    return shapes.size;
};`,
    java: `import java.util.*;
class Solution {
    public int distinctIslands(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        Set<String> shapes = new HashSet<>();
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    List<int[]> cells = new ArrayList<>();
                    Deque<int[]> q = new ArrayDeque<>();
                    q.add(new int[]{r, c});
                    seen[r][c] = true;
                    while (!q.isEmpty()) {
                        int[] cur = q.poll();
                        cells.add(new int[]{cur[0] - r, cur[1] - c});
                        for (int[] d : dirs) {
                            int nr = cur[0] + d[0], nc = cur[1] + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                q.add(new int[]{nr, nc});
                            }
                        }
                    }
                    cells.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
                    StringBuilder sb = new StringBuilder();
                    for (int[] cell : cells) sb.append(cell[0]).append(',').append(cell[1]).append(';');
                    shapes.add(sb.toString());
                }
            }
        }
        return shapes.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctIslands(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        set<string> shapes;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1 && !seen[r][c]) {
                    vector<pair<int,int>> cells;
                    queue<pair<int,int>> q;
                    q.push({r, c});
                    seen[r][c] = true;
                    while (!q.empty()) {
                        auto [cr, cc] = q.front(); q.pop();
                        cells.push_back({cr - r, cc - c});
                        for (auto& d : dirs) {
                            int nr = cr + d[0], nc = cc + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                q.push({nr, nc});
                            }
                        }
                    }
                    sort(cells.begin(), cells.end());
                    string sig;
                    for (auto& cell : cells) { sig += to_string(cell.first); sig += ','; sig += to_string(cell.second); sig += ';'; }
                    shapes.insert(sig);
                }
            }
        }
        return (int) shapes.size();
    }
};`,
  },

  // kthMissing(readings: List[int], k: int) -> int  — binary search on missing count.
  'pghub-b18-missing-meter': {
    javascript: `var kthMissing = function(readings, k) {
    const base = readings[0];
    let lo = 0, hi = readings.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        const missingBefore = readings[mid] - base - mid;
        if (missingBefore < k) lo = mid + 1;
        else hi = mid;
    }
    return base + (lo - 1) + k;
};`,
    java: `class Solution {
    public int kthMissing(int[] readings, int k) {
        int base = readings[0];
        int lo = 0, hi = readings.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            int missingBefore = readings[mid] - base - mid;
            if (missingBefore < k) lo = mid + 1;
            else hi = mid;
        }
        return base + (lo - 1) + k;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthMissing(vector<int>& readings, int k) {
        int base = readings[0];
        int lo = 0, hi = (int)readings.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            int missingBefore = readings[mid] - base - mid;
            if (missingBefore < k) lo = mid + 1;
            else hi = mid;
        }
        return base + (lo - 1) + k;
    }
};`,
  },

  // firstBloomDay(bloom: List[int], gap: int) -> int  — simulate day by day.
  'pghub-b18-orchard-bloom': {
    javascript: `var firstBloomDay = function(bloom, gap) {
    const n = bloom.length;
    const dayPos = new Array(n + 1).fill(0);
    for (let pos = 0; pos < n; pos++) dayPos[bloom[pos]] = pos + 1;
    const bloomed = new Array(n + 2).fill(false);
    for (let d = 1; d <= n; d++) {
        const p = dayPos[d];
        bloomed[p] = true;
        for (const q of [p - gap - 1, p + gap + 1]) {
            if (q >= 1 && q <= n && bloomed[q]) {
                let ok = true;
                for (let mid = Math.min(p, q) + 1; mid < Math.max(p, q); mid++) {
                    if (bloomed[mid]) { ok = false; break; }
                }
                if (ok) return d;
            }
        }
    }
    return -1;
};`,
    java: `class Solution {
    public int firstBloomDay(int[] bloom, int gap) {
        int n = bloom.length;
        int[] dayPos = new int[n + 1];
        for (int pos = 0; pos < n; pos++) dayPos[bloom[pos]] = pos + 1;
        boolean[] bloomed = new boolean[n + 2];
        for (int d = 1; d <= n; d++) {
            int p = dayPos[d];
            bloomed[p] = true;
            int[] cands = {p - gap - 1, p + gap + 1};
            for (int q : cands) {
                if (q >= 1 && q <= n && bloomed[q]) {
                    boolean ok = true;
                    for (int mid = Math.min(p, q) + 1; mid < Math.max(p, q); mid++) {
                        if (bloomed[mid]) { ok = false; break; }
                    }
                    if (ok) return d;
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
    int firstBloomDay(vector<int>& bloom, int gap) {
        int n = bloom.size();
        vector<int> dayPos(n + 1, 0);
        for (int pos = 0; pos < n; pos++) dayPos[bloom[pos]] = pos + 1;
        vector<bool> bloomed(n + 2, false);
        for (int d = 1; d <= n; d++) {
            int p = dayPos[d];
            bloomed[p] = true;
            int cands[2] = {p - gap - 1, p + gap + 1};
            for (int q : cands) {
                if (q >= 1 && q <= n && bloomed[q]) {
                    bool ok = true;
                    for (int mid = min(p, q) + 1; mid < max(p, q); mid++) {
                        if (bloomed[mid]) { ok = false; break; }
                    }
                    if (ok) return d;
                }
            }
        }
        return -1;
    }
};`,
  },

  // paintWays(posts: int, colors: int) -> int  — same/diff DP mod 1e9+7.
  'pghub-b18-paint-fences': {
    javascript: `var paintWays = function(posts, colors) {
    const MOD = 1000000007n;
    if (posts === 1) return Number(BigInt(colors) % MOD);
    let same = BigInt(colors) % MOD;
    let diff = (BigInt(colors) * BigInt(colors - 1)) % MOD;
    for (let i = 3; i <= posts; i++) {
        const newSame = diff;
        const newDiff = ((same + diff) * BigInt(colors - 1)) % MOD;
        same = newSame % MOD;
        diff = newDiff;
    }
    return Number((same + diff) % MOD);
};`,
    java: `class Solution {
    public int paintWays(int posts, int colors) {
        long MOD = 1000000007L;
        if (posts == 1) return (int)(colors % MOD);
        long same = colors % MOD;
        long diff = ((long) colors * (colors - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long newSame = diff;
            long newDiff = ((same + diff) % MOD * (colors - 1)) % MOD;
            same = newSame % MOD;
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
        long long MOD = 1000000007LL;
        if (posts == 1) return (int)(colors % MOD);
        long long same = colors % MOD;
        long long diff = ((long long) colors * (colors - 1)) % MOD;
        for (int i = 3; i <= posts; i++) {
            long long newSame = diff;
            long long newDiff = ((same + diff) % MOD * (colors - 1)) % MOD;
            same = newSame % MOD;
            diff = newDiff;
        }
        return (int)((same + diff) % MOD);
    }
};`,
  },

  // reorderRelay(runners: List[int]) -> List[int]  — inward weave.
  'pghub-b18-relay-batons': {
    javascript: `var reorderRelay = function(runners) {
    let i = 0, j = runners.length - 1;
    const out = [];
    while (i < j) {
        out.push(runners[i]);
        out.push(runners[j]);
        i++; j--;
    }
    if (i === j) out.push(runners[i]);
    return out;
};`,
    java: `class Solution {
    public int[] reorderRelay(int[] runners) {
        int i = 0, j = runners.length - 1;
        int[] out = new int[runners.length];
        int idx = 0;
        while (i < j) {
            out[idx++] = runners[i];
            out[idx++] = runners[j];
            i++; j--;
        }
        if (i == j) out[idx++] = runners[i];
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reorderRelay(vector<int>& runners) {
        int i = 0, j = (int)runners.size() - 1;
        vector<int> out;
        while (i < j) {
            out.push_back(runners[i]);
            out.push_back(runners[j]);
            i++; j--;
        }
        if (i == j) out.push_back(runners[i]);
        return out;
    }
};`,
  },

  // minPlacements(target: str, stock: str) -> int  — greedy subsequence passes.
  'pghub-b18-shelf-restock': {
    javascript: `var minPlacements = function(target, stock) {
    const stockSet = new Set(stock);
    for (const ch of target) if (!stockSet.has(ch)) return -1;
    let placements = 0, i = 0;
    const n = target.length, m = stock.length;
    while (i < n) {
        placements++;
        let j = 0;
        while (i < n && j < m) {
            if (stock[j] === target[i]) i++;
            j++;
        }
    }
    return placements;
};`,
    java: `import java.util.*;
class Solution {
    public int minPlacements(String target, String stock) {
        Set<Character> stockSet = new HashSet<>();
        for (char c : stock.toCharArray()) stockSet.add(c);
        for (char c : target.toCharArray()) if (!stockSet.contains(c)) return -1;
        int placements = 0, i = 0;
        int n = target.length(), m = stock.length();
        while (i < n) {
            placements++;
            int j = 0;
            while (i < n && j < m) {
                if (stock.charAt(j) == target.charAt(i)) i++;
                j++;
            }
        }
        return placements;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPlacements(string target, string stock) {
        set<char> stockSet(stock.begin(), stock.end());
        for (char c : target) if (!stockSet.count(c)) return -1;
        int placements = 0, i = 0;
        int n = (int)target.size(), m = (int)stock.size();
        while (i < n) {
            placements++;
            int j = 0;
            while (i < n && j < m) {
                if (stock[j] == target[i]) i++;
                j++;
            }
        }
        return placements;
    }
};`,
  },

  // longestRepeatLen(s: str) -> int  — longest repeated substring DP (i<j).
  'pghub-b18-stamp-folds': {
    javascript: `var longestRepeatLen = function(s) {
    const n = s.length;
    let prev = new Array(n + 1).fill(0);
    let best = 0;
    for (let i = 1; i <= n; i++) {
        const cur = new Array(n + 1).fill(0);
        for (let j = i + 1; j <= n; j++) {
            if (s[i - 1] === s[j - 1]) {
                cur[j] = prev[j - 1] + 1;
                if (cur[j] > best) best = cur[j];
            }
        }
        prev = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int longestRepeatLen(String s) {
        int n = s.length();
        int[] prev = new int[n + 1];
        int best = 0;
        for (int i = 1; i <= n; i++) {
            int[] cur = new int[n + 1];
            for (int j = i + 1; j <= n; j++) {
                if (s.charAt(i - 1) == s.charAt(j - 1)) {
                    cur[j] = prev[j - 1] + 1;
                    if (cur[j] > best) best = cur[j];
                }
            }
            prev = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRepeatLen(string s) {
        int n = (int)s.size();
        vector<int> prev(n + 1, 0);
        int best = 0;
        for (int i = 1; i <= n; i++) {
            vector<int> cur(n + 1, 0);
            for (int j = i + 1; j <= n; j++) {
                if (s[i - 1] == s[j - 1]) {
                    cur[j] = prev[j - 1] + 1;
                    if (cur[j] > best) best = cur[j];
                }
            }
            prev = cur;
        }
        return best;
    }
};`,
  },

  // maxAccepted(times: List[int], window: int, cap: int) -> int  — sliding window queue.
  'pghub-b18-token-bucket': {
    javascript: `var maxAccepted = function(times, window, cap) {
    const accepted = [];
    let head = 0, count = 0;
    for (const t of times) {
        while (head < accepted.length && accepted[head] <= t - window) head++;
        if (accepted.length - head < cap) {
            accepted.push(t);
            count++;
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int maxAccepted(int[] times, int window, int cap) {
        Deque<Integer> accepted = new ArrayDeque<>();
        int count = 0;
        for (int t : times) {
            while (!accepted.isEmpty() && accepted.peekFirst() <= t - window) accepted.pollFirst();
            if (accepted.size() < cap) {
                accepted.addLast(t);
                count++;
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAccepted(vector<int>& times, int window, int cap) {
        deque<int> accepted;
        int count = 0;
        for (int t : times) {
            while (!accepted.empty() && accepted.front() <= t - window) accepted.pop_front();
            if ((int)accepted.size() < cap) {
                accepted.push_back(t);
                count++;
            }
        }
        return count;
    }
};`,
  },

  // minToll(n: int, edges: List[List[int]], src: int, dst: int) -> int
  // Minimax-path Dijkstra (bottleneck). -1 if unreachable.
  'pghub-b18-toll-roads': {
    javascript: `var minToll = function(n, edges, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v, t] of edges) {
        adj[u].push([v, t]);
        adj[v].push([u, t]);
    }
    const INF = Infinity;
    const best = new Array(n).fill(INF);
    best[src] = 0;
    // Min-heap of [cost, node].
    const heap = [[0, src]];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[i][0] < heap[p][0]) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } else break;
        }
    };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, sm = i;
                if (l < heap.length && heap[l][0] < heap[sm][0]) sm = l;
                if (r < heap.length && heap[r][0] < heap[sm][0]) sm = r;
                if (sm === i) break;
                [heap[i], heap[sm]] = [heap[sm], heap[i]]; i = sm;
            }
        }
        return top;
    };
    while (heap.length > 0) {
        const [cost, u] = pop();
        if (cost > best[u]) continue;
        if (u === dst) return cost;
        for (const [v, t] of adj[u]) {
            const nc = Math.max(cost, t);
            if (nc < best[v]) {
                best[v] = nc;
                push([nc, v]);
            }
        }
    }
    return best[dst] !== INF ? best[dst] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minToll(int n, int[][] edges, int src, int dst) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : edges) {
            adj[e[0]].add(new int[]{e[1], e[2]});
            adj[e[1]].add(new int[]{e[0], e[2]});
        }
        final int INF = Integer.MAX_VALUE;
        int[] best = new int[n];
        Arrays.fill(best, INF);
        best[src] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.add(new int[]{0, src});
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int cost = top[0], u = top[1];
            if (cost > best[u]) continue;
            if (u == dst) return cost;
            for (int[] nb : adj[u]) {
                int v = nb[0], t = nb[1];
                int nc = Math.max(cost, t);
                if (nc < best[v]) {
                    best[v] = nc;
                    pq.add(new int[]{nc, v});
                }
            }
        }
        return best[dst] != INF ? best[dst] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minToll(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back({e[1], e[2]});
            adj[e[1]].push_back({e[0], e[2]});
        }
        const int INF = INT_MAX;
        vector<int> best(n, INF);
        best[src] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [cost, u] = pq.top(); pq.pop();
            if (cost > best[u]) continue;
            if (u == dst) return cost;
            for (auto& [v, t] : adj[u]) {
                int nc = max(cost, t);
                if (nc < best[v]) {
                    best[v] = nc;
                    pq.push({nc, v});
                }
            }
        }
        return best[dst] != INF ? best[dst] : -1;
    }
};`,
  },

  // minTurns(jammed: List[str], target: str) -> int  — BFS over 4-digit codes.
  // Python (d-1)%10 is non-negative; replicate with +9 then %10.
  'pghub-b18-vault-dial': {
    javascript: `var minTurns = function(jammed, target) {
    const dead = new Set(jammed);
    if (dead.has("0000")) return -1;
    if (target === "0000") return 0;
    const visited = new Set(["0000"]);
    const q = [["0000", 0]];
    let head = 0;
    while (head < q.length) {
        const [state, steps] = q[head++];
        for (let i = 0; i < 4; i++) {
            const d = state.charCodeAt(i) - 48;
            for (const nd of [(d + 1) % 10, (d + 9) % 10]) {
                const nxt = state.slice(0, i) + String(nd) + state.slice(i + 1);
                if (nxt === target) return steps + 1;
                if (!dead.has(nxt) && !visited.has(nxt)) {
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
    public int minTurns(String[] jammed, String target) {
        Set<String> dead = new HashSet<>(Arrays.asList(jammed));
        if (dead.contains("0000")) return -1;
        if (target.equals("0000")) return 0;
        Set<String> visited = new HashSet<>();
        visited.add("0000");
        Deque<String> q = new ArrayDeque<>();
        Deque<Integer> steps = new ArrayDeque<>();
        q.add("0000");
        steps.add(0);
        while (!q.isEmpty()) {
            String state = q.poll();
            int st = steps.poll();
            for (int i = 0; i < 4; i++) {
                int d = state.charAt(i) - '0';
                int[] nds = {(d + 1) % 10, (d + 9) % 10};
                for (int nd : nds) {
                    String nxt = state.substring(0, i) + nd + state.substring(i + 1);
                    if (nxt.equals(target)) return st + 1;
                    if (!dead.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        q.add(nxt);
                        steps.add(st + 1);
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
    int minTurns(vector<string>& jammed, string target) {
        unordered_set<string> dead(jammed.begin(), jammed.end());
        if (dead.count("0000")) return -1;
        if (target == "0000") return 0;
        unordered_set<string> visited;
        visited.insert("0000");
        queue<pair<string,int>> q;
        q.push({"0000", 0});
        while (!q.empty()) {
            auto [state, steps] = q.front(); q.pop();
            for (int i = 0; i < 4; i++) {
                int d = state[i] - '0';
                int nds[2] = {(d + 1) % 10, (d + 9) % 10};
                for (int nd : nds) {
                    string nxt = state;
                    nxt[i] = (char)('0' + nd);
                    if (nxt == target) return steps + 1;
                    if (!dead.count(nxt) && !visited.count(nxt)) {
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

  // canSplitEqual(weights: List[int]) -> bool  — prefix-sum balance cut.
  'pghub-b18-warehouse-pallets': {
    javascript: `var canSplitEqual = function(weights) {
    let total = 0;
    for (const w of weights) total += w;
    if (total % 2 !== 0) return false;
    const half = total / 2;
    let running = 0;
    for (let i = 0; i < weights.length - 1; i++) {
        running += weights[i];
        if (running === half) return true;
        if (running > half) return false;
    }
    return false;
};`,
    java: `class Solution {
    public boolean canSplitEqual(int[] weights) {
        long total = 0;
        for (int w : weights) total += w;
        if (total % 2 != 0) return false;
        long half = total / 2;
        long running = 0;
        for (int i = 0; i < weights.length - 1; i++) {
            running += weights[i];
            if (running == half) return true;
            if (running > half) return false;
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitEqual(vector<int>& weights) {
        long long total = 0;
        for (int w : weights) total += w;
        if (total % 2 != 0) return false;
        long long half = total / 2;
        long long running = 0;
        for (int i = 0; i < (int)weights.size() - 1; i++) {
            running += weights[i];
            if (running == half) return true;
            if (running > half) return false;
        }
        return false;
    }
};`,
  },

  // countComplementary(nums: List[int], bits: int) -> int  — complement pair count.
  // Pair count can be O(n^2) → long.
  'pghub-b19-bitmask-pairs': {
    javascript: `var countComplementary = function(nums, bits) {
    const full = (1 << bits) - 1;
    let total = 0;
    const seen = new Map();
    for (const x of nums) {
        const comp = full ^ x;
        total += (seen.get(comp) || 0);
        seen.set(x, (seen.get(x) || 0) + 1);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int countComplementary(int[] nums, int bits) {
        int full = (1 << bits) - 1;
        long total = 0;
        Map<Integer, Integer> seen = new HashMap<>();
        for (int x : nums) {
            int comp = full ^ x;
            total += seen.getOrDefault(comp, 0);
            seen.merge(x, 1, Integer::sum);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countComplementary(vector<int>& nums, int bits) {
        int full = (1 << bits) - 1;
        long long total = 0;
        unordered_map<int, int> seen;
        for (int x : nums) {
            int comp = full ^ x;
            total += seen.count(comp) ? seen[comp] : 0;
            seen[x]++;
        }
        return (int) total;
    }
};`,
  },

  // minCoins(coins: List[int], amount: int) -> int  — unbounded knapsack DP.
  'pghub-b19-coin-change-rolls': {
    javascript: `var minCoins = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] !== INF ? dp[amount] : -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minCoins(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] != INF ? dp[amount] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] != INF ? dp[amount] : -1;
    }
};`,
  },

  // minMergeCost(lengths: List[int]) -> int  — Huffman min-heap. Sum overflows → long.
  'pghub-b19-conveyor-merge': {
    javascript: `var minMergeCost = function(lengths) {
    if (lengths.length <= 1) return 0;
    const heap = lengths.slice();
    const push = (v) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[i] < heap[p]) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } else break;
        }
    };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, sm = i;
                if (l < heap.length && heap[l] < heap[sm]) sm = l;
                if (r < heap.length && heap[r] < heap[sm]) sm = r;
                if (sm === i) break;
                [heap[i], heap[sm]] = [heap[sm], heap[i]]; i = sm;
            }
        }
        return top;
    };
    // Heapify.
    for (let i = (heap.length >> 1) - 1; i >= 0; i--) {
        let j = i;
        while (true) {
            let l = 2 * j + 1, r = 2 * j + 2, sm = j;
            if (l < heap.length && heap[l] < heap[sm]) sm = l;
            if (r < heap.length && heap[r] < heap[sm]) sm = r;
            if (sm === j) break;
            [heap[j], heap[sm]] = [heap[sm], heap[j]]; j = sm;
        }
    }
    let total = 0;
    while (heap.length > 1) {
        const a = pop();
        const b = pop();
        const s = a + b;
        total += s;
        push(s);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int minMergeCost(int[] lengths) {
        if (lengths.length <= 1) return 0;
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int x : lengths) heap.add((long) x);
        long total = 0;
        while (heap.size() > 1) {
            long a = heap.poll();
            long b = heap.poll();
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
    int minMergeCost(vector<int>& lengths) {
        if (lengths.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap;
        for (int x : lengths) heap.push((long long) x);
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

  // countZones(n: int, roads: List[List[int]]) -> int  — union-find components.
  'pghub-b19-courier-zones': {
    javascript: `var countZones = function(n, roads) {
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    const union = (a, b) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[ra] = rb;
    };
    for (const [a, b] of roads) union(a, b);
    const roots = new Set();
    for (let i = 0; i < n; i++) roots.add(find(i));
    return roots.size;
};`,
    java: `import java.util.*;
class Solution {
    private int[] parent;
    public int countZones(int n, int[][] roads) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] r : roads) union(r[0], r[1]);
        Set<Integer> roots = new HashSet<>();
        for (int i = 0; i < n; i++) roots.add(find(i));
        return roots.size();
    }
    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
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
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
public:
    int countZones(int n, vector<vector<int>>& roads) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (auto& r : roads) {
            int ra = find(r[0]), rb = find(r[1]);
            if (ra != rb) parent[ra] = rb;
        }
        set<int> roots;
        for (int i = 0; i < n; i++) roots.insert(find(i));
        return (int) roots.size();
    }
};`,
  },

  // peakIndices(elev: List[int]) -> List[int]  — strict interior peaks.
  'pghub-b19-elevation-peaks': {
    javascript: `var peakIndices = function(elev) {
    const res = [];
    for (let i = 1; i < elev.length - 1; i++) {
        if (elev[i] > elev[i - 1] && elev[i] > elev[i + 1]) res.push(i);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] peakIndices(int[] elev) {
        List<Integer> res = new ArrayList<>();
        for (int i = 1; i < elev.length - 1; i++) {
            if (elev[i] > elev[i - 1] && elev[i] > elev[i + 1]) res.add(i);
        }
        int[] out = new int[res.size()];
        for (int i = 0; i < res.size(); i++) out[i] = res.get(i);
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> peakIndices(vector<int>& elev) {
        vector<int> res;
        for (int i = 1; i < (int)elev.size() - 1; i++) {
            if (elev[i] > elev[i - 1] && elev[i] > elev[i + 1]) res.push_back(i);
        }
        return res;
    }
};`,
  },

  // countPatterns(n: int) -> int  — Fibonacci-style DP mod 1e9+7.
  'pghub-b19-festival-lights': {
    javascript: `var countPatterns = function(n) {
    const MOD = 1000000007;
    let endsOff = 1, endsOn = 1;
    for (let i = 2; i <= n; i++) {
        const newOff = (endsOff + endsOn) % MOD;
        const newOn = endsOff % MOD;
        endsOff = newOff;
        endsOn = newOn;
    }
    return (endsOff + endsOn) % MOD;
};`,
    java: `class Solution {
    public int countPatterns(int n) {
        long MOD = 1000000007L;
        long endsOff = 1, endsOn = 1;
        for (int i = 2; i <= n; i++) {
            long newOff = (endsOff + endsOn) % MOD;
            long newOn = endsOff % MOD;
            endsOff = newOff;
            endsOn = newOn;
        }
        return (int)((endsOff + endsOn) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPatterns(int n) {
        long long MOD = 1000000007LL;
        long long endsOff = 1, endsOn = 1;
        for (int i = 2; i <= n; i++) {
            long long newOff = (endsOff + endsOn) % MOD;
            long long newOn = endsOff % MOD;
            endsOff = newOff;
            endsOn = newOn;
        }
        return (int)((endsOff + endsOn) % MOD);
    }
};`,
  },

  // maxWatered(beds: List[int], k: int) -> int  — max fixed-window sum.
  'pghub-b19-garden-rows': {
    javascript: `var maxWatered = function(beds, k) {
    const n = beds.length;
    if (k >= n) {
        let s = 0;
        for (const x of beds) s += x;
        return s;
    }
    let window = 0;
    for (let i = 0; i < k; i++) window += beds[i];
    let best = window;
    for (let i = k; i < n; i++) {
        window += beds[i] - beds[i - k];
        if (window > best) best = window;
    }
    return best;
};`,
    java: `class Solution {
    public int maxWatered(int[] beds, int k) {
        int n = beds.length;
        if (k >= n) {
            int s = 0;
            for (int x : beds) s += x;
            return s;
        }
        int window = 0;
        for (int i = 0; i < k; i++) window += beds[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += beds[i] - beds[i - k];
            if (window > best) best = window;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxWatered(vector<int>& beds, int k) {
        int n = (int)beds.size();
        if (k >= n) {
            int s = 0;
            for (int x : beds) s += x;
            return s;
        }
        int window = 0;
        for (int i = 0; i < k; i++) window += beds[i];
        int best = window;
        for (int i = k; i < n; i++) {
            window += beds[i] - beds[i - k];
            if (window > best) best = window;
        }
        return best;
    }
};`,
  },

  // finalBalance(ops: List[str]) -> int  — undo/redo stacks.
  // op[1:] parses signed int (e.g. "+5" / "-3"); Python int("+5")=5, int("-3")=-3.
  'pghub-b19-ledger-rollback': {
    javascript: `var finalBalance = function(ops) {
    const history = [];
    const redo = [];
    let balance = 0;
    for (const op of ops) {
        if (op === "undo") {
            if (history.length > 0) {
                const v = history.pop();
                balance -= v;
                redo.push(v);
            }
        } else if (op === "redo") {
            if (redo.length > 0) {
                const v = redo.pop();
                balance += v;
                history.push(v);
            }
        } else {
            const v = parseInt(op.slice(1), 10);
            history.push(v);
            balance += v;
            redo.length = 0;
        }
    }
    return balance;
};`,
    java: `import java.util.*;
class Solution {
    public int finalBalance(String[] ops) {
        Deque<Integer> history = new ArrayDeque<>();
        Deque<Integer> redo = new ArrayDeque<>();
        int balance = 0;
        for (String op : ops) {
            if (op.equals("undo")) {
                if (!history.isEmpty()) {
                    int v = history.pop();
                    balance -= v;
                    redo.push(v);
                }
            } else if (op.equals("redo")) {
                if (!redo.isEmpty()) {
                    int v = redo.pop();
                    balance += v;
                    history.push(v);
                }
            } else {
                int v = Integer.parseInt(op.substring(1));
                history.push(v);
                balance += v;
                redo.clear();
            }
        }
        return balance;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalBalance(vector<string>& ops) {
        vector<int> history;
        vector<int> redo;
        int balance = 0;
        for (const string& op : ops) {
            if (op == "undo") {
                if (!history.empty()) {
                    int v = history.back(); history.pop_back();
                    balance -= v;
                    redo.push_back(v);
                }
            } else if (op == "redo") {
                if (!redo.empty()) {
                    int v = redo.back(); redo.pop_back();
                    balance += v;
                    history.push_back(v);
                }
            } else {
                int v = stoi(op.substr(1));
                history.push_back(v);
                balance += v;
                redo.clear();
            }
        }
        return balance;
    }
};`,
  },

  // minInsertions(s: str) -> int  — palindrome insertions DP O(n^2).
  'pghub-b19-palindrome-pad': {
    javascript: `var minInsertions = function(s) {
    const n = s.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(0));
    for (let length = 2; length <= n; length++) {
        for (let i = 0; i + length - 1 < n; i++) {
            const j = i + length - 1;
            if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i + 1][j], dp[i][j - 1]);
        }
    }
    return dp[0][n - 1];
};`,
    java: `class Solution {
    public int minInsertions(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s.charAt(i) == s.charAt(j)) dp[i][j] = dp[i + 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minInsertions(string s) {
        int n = (int)s.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s[i] == s[j]) dp[i][j] = dp[i + 1][j - 1];
                else dp[i][j] = 1 + min(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }
};`,
  },

  // encodeRuns(s: str) -> str  — run-length encode (omit count for run of 1).
  'pghub-b19-pixel-runs': {
    javascript: `var encodeRuns = function(s) {
    const out = [];
    let i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        const run = j - i;
        if (run >= 2) out.push(s[i] + String(run));
        else out.push(s[i]);
        i = j;
    }
    return out.join('');
};`,
    java: `class Solution {
    public String encodeRuns(String s) {
        StringBuilder out = new StringBuilder();
        int i = 0, n = s.length();
        while (i < n) {
            int j = i;
            while (j < n && s.charAt(j) == s.charAt(i)) j++;
            int run = j - i;
            if (run >= 2) out.append(s.charAt(i)).append(run);
            else out.append(s.charAt(i));
            i = j;
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string encodeRuns(string s) {
        string out;
        int i = 0, n = (int)s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            int run = j - i;
            if (run >= 2) { out += s[i]; out += to_string(run); }
            else out += s[i];
            i = j;
        }
        return out;
    }
};`,
  },

  // prepOrder(n: int, deps: List[List[int]]) -> List[int]  — Kahn topo with min-heap.
  'pghub-b19-recipe-order': {
    javascript: `var prepOrder = function(n, deps) {
    const adj = Array.from({length: n}, () => []);
    const indeg = new Array(n).fill(0);
    for (const [a, b] of deps) {
        adj[a].push(b);
        indeg[b]++;
    }
    // Min-heap of ready nodes.
    const heap = [];
    const push = (v) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[i] < heap[p]) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } else break;
        }
    };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, sm = i;
                if (l < heap.length && heap[l] < heap[sm]) sm = l;
                if (r < heap.length && heap[r] < heap[sm]) sm = r;
                if (sm === i) break;
                [heap[i], heap[sm]] = [heap[sm], heap[i]]; i = sm;
            }
        }
        return top;
    };
    for (let i = 0; i < n; i++) if (indeg[i] === 0) push(i);
    const order = [];
    while (heap.length > 0) {
        const u = pop();
        order.push(u);
        for (const v of adj[u]) {
            indeg[v]--;
            if (indeg[v] === 0) push(v);
        }
    }
    return order.length === n ? order : [];
};`,
    java: `import java.util.*;
class Solution {
    public int[] prepOrder(int n, int[][] deps) {
        List<Integer>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        int[] indeg = new int[n];
        for (int[] d : deps) {
            adj[d[0]].add(d[1]);
            indeg[d[1]]++;
        }
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.add(i);
        List<Integer> order = new ArrayList<>();
        while (!heap.isEmpty()) {
            int u = heap.poll();
            order.add(u);
            for (int v : adj[u]) {
                indeg[v]--;
                if (indeg[v] == 0) heap.add(v);
            }
        }
        if (order.size() != n) return new int[0];
        int[] out = new int[order.size()];
        for (int i = 0; i < order.size(); i++) out[i] = order.get(i);
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> prepOrder(int n, vector<vector<int>>& deps) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& d : deps) {
            adj[d[0]].push_back(d[1]);
            indeg[d[1]]++;
        }
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.push(i);
        vector<int> order;
        while (!heap.empty()) {
            int u = heap.top(); heap.pop();
            order.push_back(u);
            for (int v : adj[u]) {
                indeg[v]--;
                if (indeg[v] == 0) heap.push(v);
            }
        }
        if ((int)order.size() != n) return {};
        return order;
    }
};`,
  },
};
