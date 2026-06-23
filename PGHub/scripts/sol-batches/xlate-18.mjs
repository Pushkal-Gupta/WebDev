// xlate-18.mjs — JS/Java/C++ translations of verified Python solutions.
// Slice [510,540) of pyReal && missingLangs>0 targets (sorted by id asc).
// Each language matches generateTemplate(...) signature exactly. Algorithms
// are faithful ports of the stored solutions.python.code. Graded by Judge0
// in backfill-solutions.mjs; only passing langs are written.

export default {
  // maxProduct(nums: List[int]) -> int — running max/min product, swap on negatives.
  'pghub-max-product-subarray': {
    javascript: `var maxProduct = function(nums) {
    let best = nums[0], curMax = nums[0], curMin = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        if (x < 0) { const t = curMax; curMax = curMin; curMin = t; }
        curMax = Math.max(x, curMax * x);
        curMin = Math.min(x, curMin * x);
        if (curMax > best) best = curMax;
    }
    return best;
};`,
    java: `class Solution {
    public int maxProduct(int[] nums) {
        long best = nums[0], curMax = nums[0], curMin = nums[0];
        for (int i = 1; i < nums.length; i++) {
            long x = nums[i];
            if (x < 0) { long t = curMax; curMax = curMin; curMin = t; }
            curMax = Math.max(x, curMax * x);
            curMin = Math.min(x, curMin * x);
            if (curMax > best) best = curMax;
        }
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProduct(vector<int>& nums) {
        long long best = nums[0], curMax = nums[0], curMin = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            long long x = nums[i];
            if (x < 0) swap(curMax, curMin);
            curMax = max(x, curMax * x);
            curMin = min(x, curMin * x);
            if (curMax > best) best = curMax;
        }
        return (int) best;
    }
};`,
  },

  // maxAvgSubtree(parent, val) -> int — build children from parent[], DFS subtree
  // averages, return node index with max average (epsilon tie-break preserved).
  'pghub-maximum-average-subtree': {
    javascript: `var maxAvgSubtree = function(parent, val) {
    const n = parent.length;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    let best = -1.0, bestNode = -1;
    const dfs = (u) => {
        let total = val[u], cnt = 1;
        for (const c of children[u]) {
            const [t, k] = dfs(c);
            total += t; cnt += k;
        }
        const avg = total / cnt;
        if (avg > best + 1e-9) { best = avg; bestNode = u; }
        return [total, cnt];
    };
    dfs(root);
    return bestNode;
};`,
    java: `import java.util.*;
class Solution {
    private List<List<Integer>> children;
    private int[] val;
    private double best;
    private int bestNode;
    public int maxAvgSubtree(int[] parent, int[] val) {
        int n = parent.length;
        this.val = val;
        children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        best = -1.0; bestNode = -1;
        dfs(root);
        return bestNode;
    }
    private long[] dfs(int u) {
        long total = val[u], cnt = 1;
        for (int c : children.get(u)) {
            long[] r = dfs(c);
            total += r[0]; cnt += r[1];
        }
        double avg = (double) total / cnt;
        if (avg > best + 1e-9) { best = avg; bestNode = u; }
        return new long[]{total, cnt};
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAvgSubtree(vector<int>& parent, vector<int>& val) {
        int n = parent.size();
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        double best = -1.0;
        int bestNode = -1;
        function<pair<long long,long long>(int)> dfs = [&](int u) -> pair<long long,long long> {
            long long total = val[u], cnt = 1;
            for (int c : children[u]) {
                auto r = dfs(c);
                total += r.first; cnt += r.second;
            }
            double avg = (double) total / cnt;
            if (avg > best + 1e-9) { best = avg; bestNode = u; }
            return {total, cnt};
        };
        dfs(root);
        return bestNode;
    }
};`,
  },

  // freeSlots(busy, dayStart, dayEnd) -> List[List[int]] — merge busy, gaps = free.
  'pghub-meeting-merge-free': {
    javascript: `var freeSlots = function(busy, dayStart, dayEnd) {
    if (busy.length === 0) return dayStart < dayEnd ? [[dayStart, dayEnd]] : [];
    const intervals = busy.map(x => x.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    for (const [s, e] of intervals) {
        if (merged.length && s <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
        } else {
            merged.push([s, e]);
        }
    }
    const free = [];
    let cur = dayStart;
    for (const [s, e] of merged) {
        if (cur < s) free.push([cur, s]);
        cur = Math.max(cur, e);
    }
    if (cur < dayEnd) free.push([cur, dayEnd]);
    return free;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] freeSlots(int[][] busy, int dayStart, int dayEnd) {
        if (busy.length == 0) {
            if (dayStart < dayEnd) return new int[][]{{dayStart, dayEnd}};
            return new int[0][0];
        }
        int[][] intervals = new int[busy.length][];
        for (int i = 0; i < busy.length; i++) intervals[i] = busy[i].clone();
        Arrays.sort(intervals, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : intervals) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                merged.get(merged.size() - 1)[1] = Math.max(merged.get(merged.size() - 1)[1], iv[1]);
            } else {
                merged.add(new int[]{iv[0], iv[1]});
            }
        }
        List<int[]> free = new ArrayList<>();
        int cur = dayStart;
        for (int[] iv : merged) {
            if (cur < iv[0]) free.add(new int[]{cur, iv[0]});
            cur = Math.max(cur, iv[1]);
        }
        if (cur < dayEnd) free.add(new int[]{cur, dayEnd});
        return free.toArray(new int[free.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> freeSlots(vector<vector<int>>& busy, int dayStart, int dayEnd) {
        if (busy.empty()) {
            if (dayStart < dayEnd) return {{dayStart, dayEnd}};
            return {};
        }
        vector<vector<int>> intervals = busy;
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged;
        for (auto& iv : intervals) {
            if (!merged.empty() && iv[0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], iv[1]);
            } else {
                merged.push_back(iv);
            }
        }
        vector<vector<int>> freeSlots;
        int cur = dayStart;
        for (auto& iv : merged) {
            if (cur < iv[0]) freeSlots.push_back({cur, iv[0]});
            cur = max(cur, iv[1]);
        }
        if (cur < dayEnd) freeSlots.push_back({cur, dayEnd});
        return freeSlots;
    }
};`,
  },

  // maxOverlap(meetings) -> int — sweep line, +1 on start, -1 on end, ends first on tie.
  'pghub-meeting-overlap': {
    javascript: `var maxOverlap = function(meetings) {
    const events = [];
    for (const [s, e] of meetings) {
        events.push([s, 1]);
        events.push([e, -1]);
    }
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cur = 0, best = 0;
    for (const [, delta] of events) {
        cur += delta;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxOverlap(int[][] meetings) {
        int[][] events = new int[meetings.length * 2][2];
        int idx = 0;
        for (int[] m : meetings) {
            events[idx++] = new int[]{m[0], 1};
            events[idx++] = new int[]{m[1], -1};
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
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
    int maxOverlap(vector<vector<int>>& meetings) {
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

  // peakOverlap(intervals) -> int — identical sweep-line as maxOverlap.
  'pghub-meeting-room-overlap-peak': {
    javascript: `var peakOverlap = function(intervals) {
    const events = [];
    for (const [s, e] of intervals) {
        events.push([s, 1]);
        events.push([e, -1]);
    }
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cur = 0, best = 0;
    for (const [, d] of events) {
        cur += d;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int peakOverlap(int[][] intervals) {
        int[][] events = new int[intervals.length * 2][2];
        int idx = 0;
        for (int[] iv : intervals) {
            events[idx++] = new int[]{iv[0], 1};
            events[idx++] = new int[]{iv[1], -1};
        }
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
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
    int peakOverlap(vector<vector<int>>& intervals) {
        vector<pair<int,int>> events;
        for (auto& iv : intervals) {
            events.push_back({iv[0], 1});
            events.push_back({iv[1], -1});
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

  // minCoins(coins, amount) -> int — unbounded coin DP, -1 if impossible.
  'pghub-min-coins-amount': {
    javascript: `var minCoins = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let amt = 1; amt <= amount; amt++) {
        for (const c of coins) {
            if (c <= amt && dp[amt - c] + 1 < dp[amt]) dp[amt] = dp[amt - c] + 1;
        }
    }
    return dp[amount] <= amount ? dp[amount] : -1;
};`,
    java: `class Solution {
    public int minCoins(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int amt = 1; amt <= amount; amt++) {
            for (int c : coins) {
                if (c <= amt && dp[amt - c] + 1 < dp[amt]) dp[amt] = dp[amt - c] + 1;
            }
        }
        return dp[amount] <= amount ? dp[amount] : -1;
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
        for (int amt = 1; amt <= amount; amt++) {
            for (int c : coins) {
                if (c <= amt && dp[amt - c] + 1 < dp[amt]) dp[amt] = dp[amt - c] + 1;
            }
        }
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};`,
  },

  // minCoins(coins, amount) -> int — same unbounded coin DP, -1 if exact impossible.
  'pghub-min-coins-exact': {
    javascript: `var minCoins = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] <= amount ? dp[amount] : -1;
};`,
    java: `class Solution {
    public int minCoins(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] <= amount ? dp[amount] : -1;
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
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};`,
  },

  // minRooms(meetings) -> int — sweep starts vs ends, peak concurrency.
  'pghub-min-meeting-rooms': {
    javascript: `var minRooms = function(meetings) {
    if (meetings.length === 0) return 0;
    const starts = meetings.map(m => m[0]).sort((a, b) => a - b);
    const ends = meetings.map(m => m[1]).sort((a, b) => a - b);
    let i = 0, j = 0, cur = 0, best = 0;
    const n = meetings.length;
    while (i < n) {
        if (starts[i] < ends[j]) { cur++; best = Math.max(best, cur); i++; }
        else { cur--; j++; }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minRooms(int[][] meetings) {
        if (meetings.length == 0) return 0;
        int n = meetings.length;
        int[] starts = new int[n], ends = new int[n];
        for (int k = 0; k < n; k++) { starts[k] = meetings[k][0]; ends[k] = meetings[k][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int i = 0, j = 0, cur = 0, best = 0;
        while (i < n) {
            if (starts[i] < ends[j]) { cur++; best = Math.max(best, cur); i++; }
            else { cur--; j++; }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRooms(vector<vector<int>>& meetings) {
        if (meetings.empty()) return 0;
        int n = meetings.size();
        vector<int> starts(n), ends(n);
        for (int k = 0; k < n; k++) { starts[k] = meetings[k][0]; ends[k] = meetings[k][1]; }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int i = 0, j = 0, cur = 0, best = 0;
        while (i < n) {
            if (starts[i] < ends[j]) { cur++; best = max(best, cur); i++; }
            else { cur--; j++; }
        }
        return best;
    }
};`,
  },

  // minPlatforms(arrivals, departures) -> int — sweep, arrival<=departure shares.
  'pghub-min-platforms': {
    javascript: `var minPlatforms = function(arrivals, departures) {
    const arr = arrivals.slice().sort((a, b) => a - b);
    const dep = departures.slice().sort((a, b) => a - b);
    let i = 0, j = 0, cur = 0, best = 0;
    const n = arr.length;
    while (i < n) {
        if (arr[i] <= dep[j]) { cur++; best = Math.max(best, cur); i++; }
        else { cur--; j++; }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minPlatforms(int[] arrivals, int[] departures) {
        int[] arr = arrivals.clone(), dep = departures.clone();
        Arrays.sort(arr);
        Arrays.sort(dep);
        int i = 0, j = 0, cur = 0, best = 0, n = arr.length;
        while (i < n) {
            if (arr[i] <= dep[j]) { cur++; best = Math.max(best, cur); i++; }
            else { cur--; j++; }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPlatforms(vector<int>& arrivals, vector<int>& departures) {
        vector<int> arr = arrivals, dep = departures;
        sort(arr.begin(), arr.end());
        sort(dep.begin(), dep.end());
        int i = 0, j = 0, cur = 0, best = 0, n = arr.size();
        while (i < n) {
            if (arr[i] <= dep[j]) { cur++; best = max(best, cur); i++; }
            else { cur--; j++; }
        }
        return best;
    }
};`,
  },

  // mirrorSum(nums) -> int — max of nums[i]+nums[n-1-i] over mirrored pairs.
  'pghub-mirror-pair-sum': {
    javascript: `var mirrorSum = function(nums) {
    let i = 0, j = nums.length - 1;
    let best = nums[0] + nums[nums.length - 1];
    while (i <= j) {
        best = Math.max(best, nums[i] + nums[j]);
        i++; j--;
    }
    return best;
};`,
    java: `class Solution {
    public int mirrorSum(int[] nums) {
        int i = 0, j = nums.length - 1;
        int best = nums[0] + nums[nums.length - 1];
        while (i <= j) {
            best = Math.max(best, nums[i] + nums[j]);
            i++; j--;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int mirrorSum(vector<int>& nums) {
        int i = 0, j = nums.size() - 1;
        int best = nums[0] + nums[nums.size() - 1];
        while (i <= j) {
            best = max(best, nums[i] + nums[j]);
            i++; j--;
        }
        return best;
    }
};`,
  },

  // longestGap(nums, lo, hi) -> int — longest run of missing ints in [lo,hi].
  'pghub-missing-streak': {
    javascript: `var longestGap = function(nums, lo, hi) {
    let best = 0, prev = lo - 1;
    for (const x of nums) {
        best = Math.max(best, x - prev - 1);
        prev = x;
    }
    best = Math.max(best, hi - prev);
    return best;
};`,
    java: `class Solution {
    public int longestGap(int[] nums, int lo, int hi) {
        int best = 0, prev = lo - 1;
        for (int x : nums) {
            best = Math.max(best, x - prev - 1);
            prev = x;
        }
        best = Math.max(best, hi - prev);
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestGap(vector<int>& nums, int lo, int hi) {
        int best = 0, prev = lo - 1;
        for (int x : nums) {
            best = max(best, x - prev - 1);
            prev = x;
        }
        best = max(best, hi - prev);
        return best;
    }
};`,
  },

  // borderSum(grid) -> int — sum of border cells of the grid.
  'pghub-mosaic-borders': {
    javascript: `var borderSum = function(grid) {
    const r = grid.length, c = grid[0].length;
    let total = 0;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            if (i === 0 || i === r - 1 || j === 0 || j === c - 1) total += grid[i][j];
        }
    }
    return total;
};`,
    java: `class Solution {
    public int borderSum(int[][] grid) {
        int r = grid.length, c = grid[0].length, total = 0;
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (i == 0 || i == r - 1 || j == 0 || j == c - 1) total += grid[i][j];
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int borderSum(vector<vector<int>>& grid) {
        int r = grid.size(), c = grid[0].size(), total = 0;
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (i == 0 || i == r - 1 || j == 0 || j == c - 1) total += grid[i][j];
            }
        }
        return total;
    }
};`,
  },

  // nearestEqual(words, a, b) -> int — min distance between an 'a' and a 'b'
  // (or two a's when a==b). Returns -1 when no such pair (None -> -1 over driver).
  'pghub-nearest-equal': {
    javascript: `var nearestEqual = function(words, a, b) {
    let best = null;
    if (a === b) {
        let prev = -1;
        for (let i = 0; i < words.length; i++) {
            if (words[i] === a) {
                if (prev !== -1) {
                    const d = i - prev;
                    if (best === null || d < best) best = d;
                }
                prev = i;
            }
        }
        return best === null ? -1 : best;
    }
    let lastA = -1, lastB = -1;
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w === a) {
            lastA = i;
            if (lastB !== -1) {
                const d = i - lastB;
                if (best === null || d < best) best = d;
            }
        } else if (w === b) {
            lastB = i;
            if (lastA !== -1) {
                const d = i - lastA;
                if (best === null || d < best) best = d;
            }
        }
    }
    return best === null ? -1 : best;
};`,
    java: `class Solution {
    public int nearestEqual(String[] words, String a, String b) {
        int best = Integer.MAX_VALUE;
        boolean found = false;
        if (a.equals(b)) {
            int prev = -1;
            for (int i = 0; i < words.length; i++) {
                if (words[i].equals(a)) {
                    if (prev != -1) {
                        int d = i - prev;
                        if (!found || d < best) { best = d; found = true; }
                    }
                    prev = i;
                }
            }
            return found ? best : -1;
        }
        int lastA = -1, lastB = -1;
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            if (w.equals(a)) {
                lastA = i;
                if (lastB != -1) {
                    int d = i - lastB;
                    if (!found || d < best) { best = d; found = true; }
                }
            } else if (w.equals(b)) {
                lastB = i;
                if (lastA != -1) {
                    int d = i - lastA;
                    if (!found || d < best) { best = d; found = true; }
                }
            }
        }
        return found ? best : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int nearestEqual(vector<string>& words, string a, string b) {
        int best = INT_MAX;
        bool found = false;
        if (a == b) {
            int prev = -1;
            for (int i = 0; i < (int)words.size(); i++) {
                if (words[i] == a) {
                    if (prev != -1) {
                        int d = i - prev;
                        if (!found || d < best) { best = d; found = true; }
                    }
                    prev = i;
                }
            }
            return found ? best : -1;
        }
        int lastA = -1, lastB = -1;
        for (int i = 0; i < (int)words.size(); i++) {
            const string& w = words[i];
            if (w == a) {
                lastA = i;
                if (lastB != -1) {
                    int d = i - lastB;
                    if (!found || d < best) { best = d; found = true; }
                }
            } else if (w == b) {
                lastB = i;
                if (lastA != -1) {
                    int d = i - lastA;
                    if (!found || d < best) { best = d; found = true; }
                }
            }
        }
        return found ? best : -1;
    }
};`,
  },

  // networkDelay(edges, n, source) -> int — Dijkstra; -1 if unreachable nodes,
  // else max shortest-distance. Hand-rolled min-heap in JS for heapq parity.
  'pghub-network-delay-time': {
    javascript: `var networkDelay = function(edges, n, source) {
    const graph = new Map();
    for (const [u, v, w] of edges) {
        if (!graph.has(u)) graph.set(u, []);
        graph.get(u).push([v, w]);
    }
    // min-heap of [dist, node]
    const heap = [];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
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
                [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
                i = smallest;
            }
        }
        return top;
    };
    const dist = new Map();
    dist.set(source, 0);
    push([0, source]);
    while (heap.length > 0) {
        const [d, node] = pop();
        if (d > (dist.has(node) ? dist.get(node) : Infinity)) continue;
        for (const [nb, w] of (graph.get(node) || [])) {
            const nd = d + w;
            if (nd < (dist.has(nb) ? dist.get(nb) : Infinity)) {
                dist.set(nb, nd);
                push([nd, nb]);
            }
        }
    }
    if (dist.size < n) return -1;
    let best = 0;
    for (const v of dist.values()) best = Math.max(best, v);
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int networkDelay(int[][] edges, int n, int source) {
        Map<Integer, List<int[]>> graph = new HashMap<>();
        for (int[] e : edges) {
            graph.computeIfAbsent(e[0], k -> new ArrayList<>()).add(new int[]{e[1], e[2]});
        }
        Map<Integer, Long> dist = new HashMap<>();
        dist.put(source, 0L);
        PriorityQueue<long[]> pq = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
        pq.add(new long[]{0, source});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0];
            int node = (int) cur[1];
            if (d > dist.getOrDefault(node, Long.MAX_VALUE)) continue;
            for (int[] nbw : graph.getOrDefault(node, Collections.emptyList())) {
                int nb = nbw[0];
                long nd = d + nbw[1];
                if (nd < dist.getOrDefault(nb, Long.MAX_VALUE)) {
                    dist.put(nb, nd);
                    pq.add(new long[]{nd, nb});
                }
            }
        }
        if (dist.size() < n) return -1;
        long best = 0;
        for (long v : dist.values()) best = Math.max(best, v);
        return (int) best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int networkDelay(vector<vector<int>>& edges, int n, int source) {
        unordered_map<int, vector<pair<int,long long>>> graph;
        for (auto& e : edges) graph[e[0]].push_back({e[1], e[2]});
        unordered_map<int, long long> dist;
        dist[source] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, source});
        while (!pq.empty()) {
            auto [d, node] = pq.top(); pq.pop();
            auto it = dist.find(node);
            if (it != dist.end() && d > it->second) continue;
            if (it == dist.end()) continue;
            for (auto& [nb, w] : graph[node]) {
                long long nd = d + w;
                auto jt = dist.find(nb);
                if (jt == dist.end() || nd < jt->second) {
                    dist[nb] = nd;
                    pq.push({nd, nb});
                }
            }
        }
        if ((int)dist.size() < n) return -1;
        long long best = 0;
        for (auto& kv : dist) best = max(best, kv.second);
        return (int) best;
    }
};`,
  },

  // bestHarvest(yields, k) -> int — max sum of any window of size k (whole if k>=n).
  'pghub-orchard-harvest-window': {
    javascript: `var bestHarvest = function(yields, k) {
    const n = yields.length;
    if (k >= n) { let s = 0; for (const x of yields) s += x; return s; }
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
    public int bestHarvest(int[] yields, int k) {
        int n = yields.length;
        if (k >= n) { int s = 0; for (int x : yields) s += x; return s; }
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
    int bestHarvest(vector<int>& yields, int k) {
        int n = yields.size();
        if (k >= n) { int s = 0; for (int x : yields) s += x; return s; }
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

  // prune(parent, fruit) -> int — keep node if it bears fruit or any kept descendant.
  'pghub-orchard-prune': {
    javascript: `var prune = function(parent, fruit) {
    const n = parent.length;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    const keep = new Array(n).fill(false);
    const order = [];
    const stack = [root];
    while (stack.length) {
        const u = stack.pop();
        order.push(u);
        for (const c of children[u]) stack.push(c);
    }
    for (let idx = order.length - 1; idx >= 0; idx--) {
        const u = order[idx];
        let k = fruit[u] === 1;
        for (const c of children[u]) if (keep[c]) k = true;
        keep[u] = k;
    }
    let cnt = 0;
    for (let u = 0; u < n; u++) if (keep[u]) cnt++;
    return cnt;
};`,
    java: `import java.util.*;
class Solution {
    public int prune(int[] parent, int[] fruit) {
        int n = parent.length;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        boolean[] keep = new boolean[n];
        List<Integer> order = new ArrayList<>();
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            int u = stack.pop();
            order.add(u);
            for (int c : children.get(u)) stack.push(c);
        }
        for (int idx = order.size() - 1; idx >= 0; idx--) {
            int u = order.get(idx);
            boolean k = fruit[u] == 1;
            for (int c : children.get(u)) if (keep[c]) k = true;
            keep[u] = k;
        }
        int cnt = 0;
        for (int u = 0; u < n; u++) if (keep[u]) cnt++;
        return cnt;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int prune(vector<int>& parent, vector<int>& fruit) {
        int n = parent.size();
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        vector<bool> keep(n, false);
        vector<int> order;
        vector<int> stack = {root};
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();
            order.push_back(u);
            for (int c : children[u]) stack.push_back(c);
        }
        for (int idx = (int)order.size() - 1; idx >= 0; idx--) {
            int u = order[idx];
            bool k = fruit[u] == 1;
            for (int c : children[u]) if (keep[c]) k = true;
            keep[u] = k;
        }
        int cnt = 0;
        for (int u = 0; u < n; u++) if (keep[u]) cnt++;
        return cnt;
    }
};`,
  },

  // productSign(nums) -> int — sign of product: 0 if any zero, else +/-1.
  'pghub-pair-product-sign': {
    javascript: `var productSign = function(nums) {
    let sign = 1;
    for (const x of nums) {
        if (x === 0) return 0;
        if (x < 0) sign = -sign;
    }
    return sign;
};`,
    java: `class Solution {
    public int productSign(int[] nums) {
        int sign = 1;
        for (int x : nums) {
            if (x == 0) return 0;
            if (x < 0) sign = -sign;
        }
        return sign;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int productSign(vector<int>& nums) {
        int sign = 1;
        for (int x : nums) {
            if (x == 0) return 0;
            if (x < 0) sign = -sign;
        }
        return sign;
    }
};`,
  },

  // canPalindrome(s) -> bool — palindrome possible after at most one swap of mismatches.
  'pghub-palindrome-after-merge': {
    javascript: `var canPalindrome = function(s) {
    const n = s.length;
    const mism = [];
    for (let i = 0; i < Math.floor(n / 2); i++) {
        if (s[i] !== s[n - 1 - i]) mism.push([i, n - 1 - i]);
    }
    if (mism.length === 0) return true;
    if (mism.length === 1) return false;
    if (mism.length === 2) {
        const [i1, j1] = mism[0], [i2, j2] = mism[1];
        if (s[i1] === s[j2] && s[j1] === s[i2]) return true;
        return false;
    }
    return false;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canPalindrome(String s) {
        int n = s.length();
        List<int[]> mism = new ArrayList<>();
        for (int i = 0; i < n / 2; i++) {
            if (s.charAt(i) != s.charAt(n - 1 - i)) mism.add(new int[]{i, n - 1 - i});
        }
        if (mism.size() == 0) return true;
        if (mism.size() == 1) return false;
        if (mism.size() == 2) {
            int i1 = mism.get(0)[0], j1 = mism.get(0)[1];
            int i2 = mism.get(1)[0], j2 = mism.get(1)[1];
            return s.charAt(i1) == s.charAt(j2) && s.charAt(j1) == s.charAt(i2);
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canPalindrome(string s) {
        int n = s.size();
        vector<pair<int,int>> mism;
        for (int i = 0; i < n / 2; i++) {
            if (s[i] != s[n - 1 - i]) mism.push_back({i, n - 1 - i});
        }
        if (mism.size() == 0) return true;
        if (mism.size() == 1) return false;
        if (mism.size() == 2) {
            int i1 = mism[0].first, j1 = mism[0].second;
            int i2 = mism[1].first, j2 = mism[1].second;
            return s[i1] == s[j2] && s[j1] == s[i2];
        }
        return false;
    }
};`,
  },

  // bridgeLength(s) -> int — longest palindromic substring (len>=2) whose ends are
  // equal vowels, via expand-around-center.
  'pghub-palindrome-bridge': {
    javascript: `var bridgeLength = function(s) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const n = s.length;
    let best = 0;
    const expand = (l, r) => {
        while (l >= 0 && r < n && s[l] === s[r]) { l--; r++; }
        return [l + 1, r - 1];
    };
    for (let c = 0; c < n; c++) {
        for (const [l0, r0] of [[c, c], [c, c + 1]]) {
            const [l, r] = expand(l0, r0);
            if (r - l + 1 >= 2 && vowels.has(s[l]) && s[l] === s[r]) {
                best = Math.max(best, r - l + 1);
            }
        }
    }
    return best;
};`,
    java: `class Solution {
    private int n;
    private String s;
    public int bridgeLength(String s) {
        this.s = s;
        this.n = s.length();
        String vowels = "aeiou";
        int best = 0;
        for (int c = 0; c < n; c++) {
            int[][] pairs = {{c, c}, {c, c + 1}};
            for (int[] p : pairs) {
                int[] lr = expand(p[0], p[1]);
                int l = lr[0], r = lr[1];
                if (r - l + 1 >= 2 && vowels.indexOf(s.charAt(l)) >= 0 && s.charAt(l) == s.charAt(r)) {
                    best = Math.max(best, r - l + 1);
                }
            }
        }
        return best;
    }
    private int[] expand(int l, int r) {
        while (l >= 0 && r < n && s.charAt(l) == s.charAt(r)) { l--; r++; }
        return new int[]{l + 1, r - 1};
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int bridgeLength(string s) {
        string vowels = "aeiou";
        int n = s.size(), best = 0;
        auto expand = [&](int l, int r) -> pair<int,int> {
            while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
            return {l + 1, r - 1};
        };
        for (int c = 0; c < n; c++) {
            vector<pair<int,int>> starts = {{c, c}, {c, c + 1}};
            for (auto& st : starts) {
                auto [l, r] = expand(st.first, st.second);
                if (r - l + 1 >= 2 && vowels.find(s[l]) != string::npos && s[l] == s[r]) {
                    best = max(best, r - l + 1);
                }
            }
        }
        return best;
    }
};`,
  },

  // minHops(n, edges, src, dst) -> int — BFS shortest path on undirected graph.
  'pghub-parcel-routing': {
    javascript: `var minHops = function(n, edges, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of edges) {
        adj[u].push(v);
        adj[v].push(u);
    }
    if (src === dst) return 0;
    const dist = new Array(n).fill(-1);
    dist[src] = 0;
    const q = [src];
    let head = 0;
    while (head < q.length) {
        const u = q[head++];
        for (const w of adj[u]) {
            if (dist[w] === -1) {
                dist[w] = dist[u] + 1;
                if (w === dst) return dist[w];
                q.push(w);
            }
        }
    }
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int minHops(int n, int[][] edges, int src, int dst) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        if (src == dst) return 0;
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[src] = 0;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(src);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int w : adj.get(u)) {
                if (dist[w] == -1) {
                    dist[w] = dist[u] + 1;
                    if (w == dst) return dist[w];
                    q.add(w);
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
    int minHops(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        if (src == dst) return 0;
        vector<int> dist(n, -1);
        dist[src] = 0;
        queue<int> q;
        q.push(src);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int w : adj[u]) {
                if (dist[w] == -1) {
                    dist[w] = dist[u] + 1;
                    if (w == dst) return dist[w];
                    q.push(w);
                }
            }
        }
        return -1;
    }
};`,
  },

  // longestRun(pixels) -> int — longest run of identical consecutive characters.
  'pghub-pixel-runs': {
    javascript: `var longestRun = function(pixels) {
    let best = 1, cur = 1;
    for (let i = 1; i < pixels.length; i++) {
        if (pixels[i] === pixels[i - 1]) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 1;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int longestRun(String pixels) {
        int best = 1, cur = 1;
        for (int i = 1; i < pixels.length(); i++) {
            if (pixels.charAt(i) == pixels.charAt(i - 1)) {
                cur++;
                if (cur > best) best = cur;
            } else {
                cur = 1;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRun(string pixels) {
        int best = 1, cur = 1;
        for (int i = 1; i < (int)pixels.size(); i++) {
            if (pixels[i] == pixels[i - 1]) {
                cur++;
                if (cur > best) best = cur;
            } else {
                cur = 1;
            }
        }
        return best;
    }
};`,
  },

  // countPlateaus(nums) -> int — count maximal runs of equal values with length>=2.
  'pghub-plateau-count': {
    javascript: `var countPlateaus = function(nums) {
    let count = 0, i = 0;
    const n = nums.length;
    while (i < n) {
        let j = i;
        while (j < n && nums[j] === nums[i]) j++;
        if (j - i >= 2) count++;
        i = j;
    }
    return count;
};`,
    java: `class Solution {
    public int countPlateaus(int[] nums) {
        int count = 0, i = 0, n = nums.length;
        while (i < n) {
            int j = i;
            while (j < n && nums[j] == nums[i]) j++;
            if (j - i >= 2) count++;
            i = j;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPlateaus(vector<int>& nums) {
        int count = 0, i = 0, n = nums.size();
        while (i < n) {
            int j = i;
            while (j < n && nums[j] == nums[i]) j++;
            if (j - i >= 2) count++;
            i = j;
        }
        return count;
    }
};`,
  },

  // prefixDivisible(digits, d) -> List[bool] — running prefix value mod d == 0.
  'pghub-prefix-divisible-flags': {
    javascript: `var prefixDivisible = function(digits, d) {
    const res = [];
    let cur = 0;
    for (const x of digits) {
        cur = (cur * 10 + x) % d;
        res.push(cur === 0);
    }
    return res;
};`,
    java: `class Solution {
    public boolean[] prefixDivisible(int[] digits, int d) {
        boolean[] res = new boolean[digits.length];
        int cur = 0;
        for (int i = 0; i < digits.length; i++) {
            cur = (cur * 10 + digits[i]) % d;
            res[i] = cur == 0;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> prefixDivisible(vector<int>& digits, int d) {
        vector<bool> res;
        int cur = 0;
        for (int x : digits) {
            cur = (cur * 10 + x) % d;
            res.push_back(cur == 0);
        }
        return res;
    }
};`,
  },

  // stationsReachable(n, edges, start) -> int — BFS reachable count minus self.
  'pghub-recharge-station-reachable': {
    javascript: `var stationsReachable = function(n, edges, start) {
    const adj = Array.from({length: n}, () => []);
    for (const [a, b] of edges) {
        adj[a].push(b);
        adj[b].push(a);
    }
    const seen = new Array(n).fill(false);
    seen[start] = true;
    const q = [start];
    let head = 0, count = 0;
    while (head < q.length) {
        const u = q[head++];
        count++;
        for (const v of adj[u]) {
            if (!seen[v]) { seen[v] = true; q.push(v); }
        }
    }
    return count - 1;
};`,
    java: `import java.util.*;
class Solution {
    public int stationsReachable(int n, int[][] edges, int start) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        boolean[] seen = new boolean[n];
        seen[start] = true;
        Deque<Integer> q = new ArrayDeque<>();
        q.add(start);
        int count = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            count++;
            for (int v : adj.get(u)) {
                if (!seen[v]) { seen[v] = true; q.add(v); }
            }
        }
        return count - 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int stationsReachable(int n, vector<vector<int>>& edges, int start) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        vector<bool> seen(n, false);
        seen[start] = true;
        queue<int> q;
        q.push(start);
        int count = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            count++;
            for (int v : adj[u]) {
                if (!seen[v]) { seen[v] = true; q.push(v); }
            }
        }
        return count - 1;
    }
};`,
  },

  // handoffs(speeds) -> int — count positions where speed >= running holder max.
  'pghub-relay-handoff': {
    javascript: `var handoffs = function(speeds) {
    let holder = speeds[0], count = 0;
    for (let i = 1; i < speeds.length; i++) {
        if (speeds[i] >= holder) { count++; holder = speeds[i]; }
    }
    return count;
};`,
    java: `class Solution {
    public int handoffs(int[] speeds) {
        int holder = speeds[0], count = 0;
        for (int i = 1; i < speeds.length; i++) {
            if (speeds[i] >= holder) { count++; holder = speeds[i]; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int handoffs(vector<int>& speeds) {
        int holder = speeds[0], count = 0;
        for (int i = 1; i < (int)speeds.size(); i++) {
            if (speeds[i] >= holder) { count++; holder = speeds[i]; }
        }
        return count;
    }
};`,
  },

  // minCuts(a, b) -> int — rotation offset turning a into b, -1 if not a rotation.
  'pghub-rotate-deck-cuts': {
    javascript: `var minCuts = function(a, b) {
    if (a.length !== b.length) return -1;
    if (a === b) return 0;
    const doubled = a + a;
    const idx = doubled.indexOf(b);
    if (idx === -1) return -1;
    if (idx >= a.length) return -1;
    return idx;
};`,
    java: `class Solution {
    public int minCuts(String a, String b) {
        if (a.length() != b.length()) return -1;
        if (a.equals(b)) return 0;
        String doubled = a + a;
        int idx = doubled.indexOf(b);
        if (idx == -1) return -1;
        if (idx >= a.length()) return -1;
        return idx;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCuts(string a, string b) {
        if (a.size() != b.size()) return -1;
        if (a == b) return 0;
        string doubled = a + a;
        size_t idx = doubled.find(b);
        if (idx == string::npos) return -1;
        if (idx >= a.size()) return -1;
        return (int) idx;
    }
};`,
  },

  // rotateGrid(grid) -> List[List[int]] — rotate square grid 90 degrees clockwise.
  'pghub-rotate-grid-90': {
    javascript: `var rotateGrid = function(grid) {
    const n = grid.length;
    const out = Array.from({length: n}, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            out[j][n - 1 - i] = grid[i][j];
        }
    }
    return out;
};`,
    java: `class Solution {
    public int[][] rotateGrid(int[][] grid) {
        int n = grid.length;
        int[][] out = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                out[j][n - 1 - i] = grid[i][j];
            }
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> rotateGrid(vector<vector<int>>& grid) {
        int n = grid.size();
        vector<vector<int>> out(n, vector<int>(n, 0));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                out[j][n - 1 - i] = grid[i][j];
            }
        }
        return out;
    }
};`,
  },

  // rotate(matrix) -> List[List[int]] — return rotated-90-clockwise copy.
  'pghub-rotate-matrix-layers': {
    javascript: `var rotate = function(matrix) {
    const n = matrix.length;
    const out = [];
    for (let r = 0; r < n; r++) {
        const row = [];
        for (let c = 0; c < n; c++) row.push(matrix[n - 1 - c][r]);
        out.push(row);
    }
    return out;
};`,
    java: `class Solution {
    public int[][] rotate(int[][] matrix) {
        int n = matrix.length;
        int[][] out = new int[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                out[r][c] = matrix[n - 1 - c][r];
            }
        }
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        vector<vector<int>> out(n, vector<int>(n));
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                out[r][c] = matrix[n - 1 - c][r];
            }
        }
        return out;
    }
};`,
  },

  // findMin(nums) -> int — min of rotated sorted array via binary search.
  'pghub-rotated-array-min': {
    javascript: `var findMin = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
};`,
    java: `class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findMin(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
};`,
  },

  // maxProfit(prices) -> int — best buy-low sell-high single transaction.
  'pghub-running-max-difference': {
    javascript: `var maxProfit = function(prices) {
    let best = 0, lowest = prices[0];
    for (let i = 1; i < prices.length; i++) {
        const p = prices[i];
        if (p - lowest > best) best = p - lowest;
        if (p < lowest) lowest = p;
    }
    return best;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        int best = 0, lowest = prices[0];
        for (int i = 1; i < prices.length; i++) {
            int p = prices[i];
            if (p - lowest > best) best = p - lowest;
            if (p < lowest) lowest = p;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int best = 0, lowest = prices[0];
        for (size_t i = 1; i < prices.size(); i++) {
            int p = prices[i];
            if (p - lowest > best) best = p - lowest;
            if (p < lowest) lowest = p;
        }
        return best;
    }
};`,
  },
};
