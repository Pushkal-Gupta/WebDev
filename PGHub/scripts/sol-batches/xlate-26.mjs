// xlate-26.mjs — JS/Java/C++ translations of verified Python canonicals.
// Slice [155,187) of unstaged && pyReal && missingLangs>0, sorted by id.
// Auto-loaded by backfill-solutions.mjs; each lang graded via Judge0; only
// passing langs (skipping present) are written to PGcode_problems.solutions.

export default {
  // transformLength(begin, end, words: List[str]) -> int  — BFS word ladder length.
  'pghub-b51-word-ladder-len': {
    javascript: `var transformLength = function(begin, end, words) {
    const wordSet = new Set(words);
    if (!wordSet.has(end)) return 0;
    let queue = [[begin, 1]];
    const visited = new Set([begin]);
    let qi = 0;
    while (qi < queue.length) {
        const [word, steps] = queue[qi++];
        if (word === end) return steps;
        for (let i = 0; i < word.length; i++) {
            for (let c = 97; c <= 122; c++) {
                const ch = String.fromCharCode(c);
                if (ch === word[i]) continue;
                const nxt = word.slice(0, i) + ch + word.slice(i + 1);
                if (wordSet.has(nxt) && !visited.has(nxt)) {
                    visited.add(nxt);
                    queue.push([nxt, steps + 1]);
                }
            }
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int transformLength(String begin, String end, String[] words) {
        Set<String> wordSet = new HashSet<>(Arrays.asList(words));
        if (!wordSet.contains(end)) return 0;
        Deque<String> queue = new ArrayDeque<>();
        Map<String, Integer> dist = new HashMap<>();
        queue.add(begin);
        dist.put(begin, 1);
        Set<String> visited = new HashSet<>();
        visited.add(begin);
        while (!queue.isEmpty()) {
            String word = queue.poll();
            int steps = dist.get(word);
            if (word.equals(end)) return steps;
            char[] arr = word.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    arr[i] = c;
                    String nxt = new String(arr);
                    if (wordSet.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        dist.put(nxt, steps + 1);
                        queue.add(nxt);
                    }
                }
                arr[i] = orig;
            }
        }
        return 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformLength(string begin, string end, vector<string>& words) {
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(end)) return 0;
        queue<pair<string,int>> q;
        q.push({begin, 1});
        unordered_set<string> visited;
        visited.insert(begin);
        while (!q.empty()) {
            auto [word, steps] = q.front(); q.pop();
            if (word == end) return steps;
            for (int i = 0; i < (int)word.size(); i++) {
                char orig = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    word[i] = c;
                    if (wordSet.count(word) && !visited.count(word)) {
                        visited.insert(word);
                        q.push({word, steps + 1});
                    }
                }
                word[i] = orig;
            }
        }
        return 0;
    }
};`,
  },

  // zigzagRead(s: str, rows: int) -> str  — zigzag conversion.
  'pghub-b51-zigzag-rows': {
    javascript: `var zigzagRead = function(s, rows) {
    if (rows === 1 || rows >= s.length) return s;
    const buckets = Array.from({length: rows}, () => []);
    let r = 0, step = 1;
    for (const ch of s) {
        buckets[r].push(ch);
        if (r === 0) step = 1;
        else if (r === rows - 1) step = -1;
        r += step;
    }
    return buckets.map(b => b.join('')).join('');
};`,
    java: `class Solution {
    public String zigzagRead(String s, int rows) {
        if (rows == 1 || rows >= s.length()) return s;
        StringBuilder[] buckets = new StringBuilder[rows];
        for (int i = 0; i < rows; i++) buckets[i] = new StringBuilder();
        int r = 0, step = 1;
        for (int i = 0; i < s.length(); i++) {
            buckets[r].append(s.charAt(i));
            if (r == 0) step = 1;
            else if (r == rows - 1) step = -1;
            r += step;
        }
        StringBuilder res = new StringBuilder();
        for (StringBuilder b : buckets) res.append(b);
        return res.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string zigzagRead(string s, int rows) {
        if (rows == 1 || rows >= (int)s.size()) return s;
        vector<string> buckets(rows);
        int r = 0, step = 1;
        for (char ch : s) {
            buckets[r] += ch;
            if (r == 0) step = 1;
            else if (r == rows - 1) step = -1;
            r += step;
        }
        string res;
        for (auto& b : buckets) res += b;
        return res;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max nesting depth of brackets ([{.
  'pghub-b52-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    const opens = new Set(['(', '[', '{']);
    const closes = new Set([')', ']', '}']);
    let depth = 0, best = 0;
    for (const ch of s) {
        if (opens.has(ch)) {
            depth++;
            if (depth > best) best = depth;
        } else if (closes.has(ch)) {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(' || ch == '[' || ch == '{') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')' || ch == ']' || ch == '}') {
                depth--;
            }
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
            if (ch == '(' || ch == '[' || ch == '{') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')' || ch == ']' || ch == '}') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // minRepaints(colors: List[int], k: int) -> int  — DP keeping two best columns.
  'pghub-b52-color-runs': {
    javascript: `var minRepaints = function(colors, k) {
    const INF = Infinity;
    const n = colors.length;
    let prev = new Array(k).fill(0);
    for (let color = 0; color < k; color++) prev[color] = colors[0] === color ? 0 : 1;
    for (let i = 1; i < n; i++) {
        let best1 = INF, best2 = INF, arg1 = -1;
        for (let c = 0; c < k; c++) {
            if (prev[c] < best1) { best2 = best1; best1 = prev[c]; arg1 = c; }
            else if (prev[c] < best2) { best2 = prev[c]; }
        }
        const cur = new Array(k).fill(0);
        for (let color = 0; color < k; color++) {
            const base = color !== arg1 ? best1 : best2;
            cur[color] = base + (colors[i] === color ? 0 : 1);
        }
        prev = cur;
    }
    return Math.min(...prev);
};`,
    java: `class Solution {
    public int minRepaints(int[] colors, int k) {
        final int INF = Integer.MAX_VALUE;
        int n = colors.length;
        int[] prev = new int[k];
        for (int color = 0; color < k; color++) prev[color] = colors[0] == color ? 0 : 1;
        for (int i = 1; i < n; i++) {
            int best1 = INF, best2 = INF, arg1 = -1;
            for (int c = 0; c < k; c++) {
                if (prev[c] < best1) { best2 = best1; best1 = prev[c]; arg1 = c; }
                else if (prev[c] < best2) { best2 = prev[c]; }
            }
            int[] cur = new int[k];
            for (int color = 0; color < k; color++) {
                int base = color != arg1 ? best1 : best2;
                cur[color] = base + (colors[i] == color ? 0 : 1);
            }
            prev = cur;
        }
        int ans = INF;
        for (int x : prev) ans = Math.min(ans, x);
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRepaints(vector<int>& colors, int k) {
        const int INF = INT_MAX;
        int n = colors.size();
        vector<int> prev(k, 0);
        for (int color = 0; color < k; color++) prev[color] = colors[0] == color ? 0 : 1;
        for (int i = 1; i < n; i++) {
            int best1 = INF, best2 = INF, arg1 = -1;
            for (int c = 0; c < k; c++) {
                if (prev[c] < best1) { best2 = best1; best1 = prev[c]; arg1 = c; }
                else if (prev[c] < best2) { best2 = prev[c]; }
            }
            vector<int> cur(k, 0);
            for (int color = 0; color < k; color++) {
                int base = color != arg1 ? best1 : best2;
                cur[color] = base + (colors[i] == color ? 0 : 1);
            }
            prev = cur;
        }
        return *min_element(prev.begin(), prev.end());
    }
};`,
  },

  // reachableHubs(n: int, roads: List[List[int]], start: int) -> int  — directed BFS reach count.
  'pghub-b52-courier-routes': {
    javascript: `var reachableHubs = function(n, roads, start) {
    const adj = new Map();
    for (const [u, v] of roads) {
        if (!adj.has(u)) adj.set(u, []);
        adj.get(u).push(v);
    }
    const visited = new Set([start]);
    let queue = [start], qi = 0;
    while (qi < queue.length) {
        const node = queue[qi++];
        for (const nxt of (adj.get(node) || [])) {
            if (!visited.has(nxt)) { visited.add(nxt); queue.push(nxt); }
        }
    }
    return visited.size;
};`,
    java: `import java.util.*;
class Solution {
    public int reachableHubs(int n, int[][] roads, int start) {
        Map<Integer, List<Integer>> adj = new HashMap<>();
        for (int[] r : roads) adj.computeIfAbsent(r[0], x -> new ArrayList<>()).add(r[1]);
        Set<Integer> visited = new HashSet<>();
        visited.add(start);
        Deque<Integer> queue = new ArrayDeque<>();
        queue.add(start);
        while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int nxt : adj.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(nxt)) { visited.add(nxt); queue.add(nxt); }
            }
        }
        return visited.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int reachableHubs(int n, vector<vector<int>>& roads, int start) {
        unordered_map<int, vector<int>> adj;
        for (auto& r : roads) adj[r[0]].push_back(r[1]);
        unordered_set<int> visited;
        visited.insert(start);
        queue<int> q;
        q.push(start);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            for (int nxt : adj[node]) {
                if (!visited.count(nxt)) { visited.insert(nxt); q.push(nxt); }
            }
        }
        return visited.size();
    }
};`,
  },

  // canFinish(numCourses: int, prerequisites: List[List[int]]) -> bool  — Kahn topo sort.
  'pghub-b52-cycle-detect': {
    javascript: `var canFinish = function(numCourses, prerequisites) {
    const adj = Array.from({length: numCourses}, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
    let queue = [], qi = 0;
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
    let taken = 0;
    while (qi < queue.length) {
        const node = queue[qi++];
        taken++;
        for (const nxt of adj[node]) {
            indeg[nxt]--;
            if (indeg[nxt] === 0) queue.push(nxt);
        }
    }
    return taken === numCourses;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }
        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) queue.add(i);
        int taken = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            taken++;
            for (int nxt : adj.get(node)) {
                if (--indeg[nxt] == 0) queue.add(nxt);
            }
        }
        return taken == numCourses;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) { adj[p[1]].push_back(p[0]); indeg[p[0]]++; }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int taken = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            taken++;
            for (int nxt : adj[node]) {
                if (--indeg[nxt] == 0) q.push(nxt);
            }
        }
        return taken == numCourses;
    }
};`,
  },

  // maxEvents(events: List[List[int]]) -> int  — greedy + min-heap of end days.
  'pghub-b52-event-schedule': {
    javascript: `var maxEvents = function(events) {
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const heap = [];
    const push = v => { heap.push(v); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p] <= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; const n = heap.length; while (true) { let l = 2*i+1, r = 2*i+2, sm = i; if (l < n && heap[l] < heap[sm]) sm = l; if (r < n && heap[r] < heap[sm]) sm = r; if (sm === i) break; [heap[sm], heap[i]] = [heap[i], heap[sm]]; i = sm; } } return top; };
    let i = 0;
    const n = events.length;
    let day = 0, attended = 0;
    while (i < n || heap.length) {
        if (heap.length === 0) day = Math.max(day + 1, events[i][0]);
        else day++;
        while (i < n && events[i][0] <= day) { push(events[i][1]); i++; }
        while (heap.length && heap[0] < day) pop();
        if (heap.length) { pop(); attended++; }
    }
    return attended;
};`,
    java: `import java.util.*;
class Solution {
    public int maxEvents(int[][] events) {
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int i = 0, n = events.length, day = 0, attended = 0;
        while (i < n || !heap.isEmpty()) {
            if (heap.isEmpty()) day = Math.max(day + 1, events[i][0]);
            else day++;
            while (i < n && events[i][0] <= day) { heap.add(events[i][1]); i++; }
            while (!heap.isEmpty() && heap.peek() < day) heap.poll();
            if (!heap.isEmpty()) { heap.poll(); attended++; }
        }
        return attended;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxEvents(vector<vector<int>>& events) {
        sort(events.begin(), events.end());
        priority_queue<int, vector<int>, greater<int>> heap;
        int i = 0, n = events.size(), day = 0, attended = 0;
        while (i < n || !heap.empty()) {
            if (heap.empty()) day = max(day + 1, events[i][0]);
            else day++;
            while (i < n && events[i][0] <= day) { heap.push(events[i][1]); i++; }
            while (!heap.empty() && heap.top() < day) heap.pop();
            if (!heap.empty()) { heap.pop(); attended++; }
        }
        return attended;
    }
};`,
  },

  // minSprinklers(ranges: List[int], n: int) -> int  — greedy jump-game interval cover.
  'pghub-b52-garden-water': {
    javascript: `var minSprinklers = function(ranges, n) {
    const maxRight = new Array(n + 1).fill(0);
    for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i];
        const left = Math.max(0, i - r);
        const right = Math.min(n, i + r);
        if (right > maxRight[left]) maxRight[left] = right;
    }
    let count = 0, curEnd = 0, farthest = 0, i = 0;
    while (curEnd < n) {
        while (i <= curEnd) { if (maxRight[i] > farthest) farthest = maxRight[i]; i++; }
        if (farthest <= curEnd) return -1;
        count++;
        curEnd = farthest;
    }
    return count;
};`,
    java: `class Solution {
    public int minSprinklers(int[] ranges, int n) {
        int[] maxRight = new int[n + 1];
        for (int i = 0; i < ranges.length; i++) {
            int r = ranges[i];
            int left = Math.max(0, i - r);
            int right = Math.min(n, i + r);
            if (right > maxRight[left]) maxRight[left] = right;
        }
        int count = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < n) {
            while (i <= curEnd) { if (maxRight[i] > farthest) farthest = maxRight[i]; i++; }
            if (farthest <= curEnd) return -1;
            count++;
            curEnd = farthest;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSprinklers(vector<int>& ranges, int n) {
        vector<int> maxRight(n + 1, 0);
        for (int i = 0; i < (int)ranges.size(); i++) {
            int r = ranges[i];
            int left = max(0, i - r);
            int right = min(n, i + r);
            if (right > maxRight[left]) maxRight[left] = right;
        }
        int count = 0, curEnd = 0, farthest = 0, i = 0;
        while (curEnd < n) {
            while (i <= curEnd) { if (maxRight[i] > farthest) farthest = maxRight[i]; i++; }
            if (farthest <= curEnd) return -1;
            count++;
            curEnd = farthest;
        }
        return count;
    }
};`,
  },

  // maxTreasure(grid: List[List[int]]) -> int  — min/max path DP (down/right).
  'pghub-b52-grid-treasure': {
    javascript: `var maxTreasure = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const dp = new Array(cols).fill(-Infinity);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === 0 && c === 0) dp[c] = grid[0][0];
            else {
                let best = -Infinity;
                if (r > 0) best = Math.max(best, dp[c]);
                if (c > 0) best = Math.max(best, dp[c - 1]);
                dp[c] = best + grid[r][c];
            }
        }
    }
    return dp[cols - 1];
};`,
    java: `class Solution {
    public int maxTreasure(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        long[] dp = new long[cols];
        java.util.Arrays.fill(dp, Long.MIN_VALUE);
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else {
                    long best = Long.MIN_VALUE;
                    if (r > 0) best = Math.max(best, dp[c]);
                    if (c > 0) best = Math.max(best, dp[c - 1]);
                    dp[c] = best + grid[r][c];
                }
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
        vector<long long> dp(cols, LLONG_MIN);
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) dp[c] = grid[0][0];
                else {
                    long long best = LLONG_MIN;
                    if (r > 0) best = max(best, dp[c]);
                    if (c > 0) best = max(best, dp[c - 1]);
                    dp[c] = best + grid[r][c];
                }
            }
        }
        return (int) dp[cols - 1];
    }
};`,
  },

  // maxConcurrent(meetings: List[List[int]]) -> int  — sweep line max overlap.
  'pghub-b52-meeting-overlap': {
    javascript: `var maxConcurrent = function(meetings) {
    const events = [];
    for (const [s, e] of meetings) { events.push([s, 1]); events.push([e, -1]); }
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cur = 0, best = 0;
    for (const [, delta] of events) { cur += delta; if (cur > best) best = cur; }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxConcurrent(int[][] meetings) {
        List<int[]> events = new ArrayList<>();
        for (int[] m : meetings) { events.add(new int[]{m[0], 1}); events.add(new int[]{m[1], -1}); }
        events.sort((a, b) -> a[0] != b[0] ? a[0] - b[0] : a[1] - b[1]);
        int cur = 0, best = 0;
        for (int[] e : events) { cur += e[1]; if (cur > best) best = cur; }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxConcurrent(vector<vector<int>>& meetings) {
        vector<pair<int,int>> events;
        for (auto& m : meetings) { events.push_back({m[0], 1}); events.push_back({m[1], -1}); }
        sort(events.begin(), events.end());
        int cur = 0, best = 0;
        for (auto& e : events) { cur += e.second; if (cur > best) best = cur; }
        return best;
    }
};`,
  },

  // longestPalindromeLen(s: str) -> int  — longest palindrome from char counts.
  'pghub-b52-palindrome-removal': {
    javascript: `var longestPalindromeLen = function(s) {
    const counts = new Map();
    for (const c of s) counts.set(c, (counts.get(c) || 0) + 1);
    let length = 0, hasOdd = false;
    for (const c of counts.values()) {
        length += c - (c & 1);
        if (c & 1) hasOdd = true;
    }
    return length + (hasOdd ? 1 : 0);
};`,
    java: `import java.util.*;
class Solution {
    public int longestPalindromeLen(String s) {
        Map<Character, Integer> counts = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            counts.merge(c, 1, Integer::sum);
        }
        int length = 0;
        boolean hasOdd = false;
        for (int c : counts.values()) {
            length += c - (c & 1);
            if ((c & 1) == 1) hasOdd = true;
        }
        return length + (hasOdd ? 1 : 0);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestPalindromeLen(string s) {
        unordered_map<char, int> counts;
        for (char c : s) counts[c]++;
        int length = 0;
        bool hasOdd = false;
        for (auto& kv : counts) {
            int c = kv.second;
            length += c - (c & 1);
            if (c & 1) hasOdd = true;
        }
        return length + (hasOdd ? 1 : 0);
    }
};`,
  },

  // signProducts(nums: List[int]) -> List[int]  — running sign of prefix product.
  'pghub-b52-prefix-product': {
    javascript: `var signProducts = function(nums) {
    const res = [];
    let sign = 1;
    for (const x of nums) {
        if (x === 0) sign = 0;
        else if (x < 0) sign = sign !== 0 ? -sign : 0;
        res.push(sign);
    }
    return res;
};`,
    java: `class Solution {
    public int[] signProducts(int[] nums) {
        int[] res = new int[nums.length];
        int sign = 1;
        for (int i = 0; i < nums.length; i++) {
            int x = nums[i];
            if (x == 0) sign = 0;
            else if (x < 0) sign = sign != 0 ? -sign : 0;
            res[i] = sign;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> signProducts(vector<int>& nums) {
        vector<int> res;
        int sign = 1;
        for (int x : nums) {
            if (x == 0) sign = 0;
            else if (x < 0) sign = sign != 0 ? -sign : 0;
            res.push_back(sign);
        }
        return res;
    }
};`,
  },

  // maxTeams(speeds: List[int], limit: int) -> int  — two-pointer greedy pairing.
  'pghub-b52-relay-teams': {
    javascript: `var maxTeams = function(speeds, limit) {
    speeds = speeds.slice().sort((a, b) => a - b);
    let i = 0, j = speeds.length - 1, teams = 0;
    while (i <= j) {
        if (i < j && speeds[i] + speeds[j] <= limit) i++;
        j--;
        teams++;
    }
    return teams;
};`,
    java: `import java.util.*;
class Solution {
    public int maxTeams(int[] speeds, int limit) {
        int[] arr = speeds.clone();
        Arrays.sort(arr);
        int i = 0, j = arr.length - 1, teams = 0;
        while (i <= j) {
            if (i < j && arr[i] + arr[j] <= limit) i++;
            j--;
            teams++;
        }
        return teams;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxTeams(vector<int>& speeds, int limit) {
        sort(speeds.begin(), speeds.end());
        int i = 0, j = (int)speeds.size() - 1, teams = 0;
        while (i <= j) {
            if (i < j && speeds[i] + speeds[j] <= limit) i++;
            j--;
            teams++;
        }
        return teams;
    }
};`,
  },

  // minPower(distances: List[int], budget: int) -> int  — binary search on min power.
  'pghub-b52-signal-decay': {
    javascript: `var minPower = function(distances, budget) {
    let lo = 1, hi = Math.max(...distances);
    const cost = p => {
        let total = 0;
        for (const d of distances) {
            if (p < d) return budget + 1;
            total += Math.ceil(d / p);
            if (total > budget) return total;
        }
        return total;
    };
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (cost(mid) <= budget) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minPower(int[] distances, int budget) {
        int lo = 1, hi = 0;
        for (int d : distances) hi = Math.max(hi, d);
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (cost(distances, mid, budget) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private long cost(int[] distances, int p, int budget) {
        long total = 0;
        for (int d : distances) {
            if (p < d) return budget + 1L;
            total += (d + p - 1) / p;
            if (total > budget) return total;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPower(vector<int>& distances, int budget) {
        int lo = 1, hi = *max_element(distances.begin(), distances.end());
        auto cost = [&](int p) -> long long {
            long long total = 0;
            for (int d : distances) {
                if (p < d) return (long long)budget + 1;
                total += (d + p - 1) / p;
                if (total > budget) return total;
            }
            return total;
        };
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (cost(mid) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — OR of all bits << (n-1).
  'pghub-b52-subset-xor': {
    javascript: `var subsetXorSum = function(nums) {
    let bitOr = 0;
    for (const x of nums) bitOr |= x;
    return bitOr * Math.pow(2, nums.length - 1);
};`,
    java: `class Solution {
    public int subsetXorSum(int[] nums) {
        long bitOr = 0;
        for (int x : nums) bitOr |= x;
        return (int) (bitOr << (nums.length - 1));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        long long bitOr = 0;
        for (int x : nums) bitOr |= x;
        return (int) (bitOr << (nums.size() - 1));
    }
};`,
  },

  // finalStack(tokens: List[int]) -> List[int]  — adjacent-equal cancel stack.
  'pghub-b52-token-stack': {
    javascript: `var finalStack = function(tokens) {
    const stack = [];
    for (const t of tokens) {
        if (stack.length && stack[stack.length - 1] === t) stack.pop();
        else stack.push(t);
    }
    return stack;
};`,
    java: `import java.util.*;
class Solution {
    public int[] finalStack(int[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int t : tokens) {
            if (!stack.isEmpty() && stack.peekLast() == t) stack.pollLast();
            else stack.addLast(t);
        }
        int[] res = new int[stack.size()];
        int i = 0;
        for (int x : stack) res[i++] = x;
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> finalStack(vector<int>& tokens) {
        vector<int> stack;
        for (int t : tokens) {
            if (!stack.empty() && stack.back() == t) stack.pop_back();
            else stack.push_back(t);
        }
        return stack;
    }
};`,
  },

  // wastedSpace(boxes: List[int], shelf: int) -> int  — greedy bin fill waste.
  'pghub-b52-warehouse-shelves': {
    javascript: `var wastedSpace = function(boxes, shelf) {
    let used = 0, waste = 0;
    for (const h of boxes) {
        if (used + h <= shelf) used += h;
        else { waste += shelf - used; used = h; }
    }
    waste += shelf - used;
    return waste;
};`,
    java: `class Solution {
    public int wastedSpace(int[] boxes, int shelf) {
        int used = 0, waste = 0;
        for (int h : boxes) {
            if (used + h <= shelf) used += h;
            else { waste += shelf - used; used = h; }
        }
        waste += shelf - used;
        return waste;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int wastedSpace(vector<int>& boxes, int shelf) {
        int used = 0, waste = 0;
        for (int h : boxes) {
            if (used + h <= shelf) used += h;
            else { waste += shelf - used; used = h; }
        }
        waste += shelf - used;
        return waste;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max paren nesting depth.
  'pghub-b53-bracket-depth': {
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
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
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

  // minCapacity(weights: List[int], shifts: int) -> int  — binary search ship capacity.
  'pghub-b53-conveyor-load': {
    javascript: `var minCapacity = function(weights, shifts) {
    const needed = cap => {
        let used = 1, cur = 0;
        for (const w of weights) {
            if (cur + w > cap) { used++; cur = 0; }
            cur += w;
        }
        return used;
    };
    let lo = Math.max(...weights);
    let hi = weights.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (needed(mid) <= shifts) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minCapacity(int[] weights, int shifts) {
        int lo = 0;
        long hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (needed(weights, mid) <= shifts) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private int needed(int[] weights, long cap) {
        int used = 1;
        long cur = 0;
        for (int w : weights) {
            if (cur + w > cap) { used++; cur = 0; }
            cur += w;
        }
        return used;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCapacity(vector<int>& weights, int shifts) {
        long long lo = 0, hi = 0;
        for (int w : weights) { lo = max(lo, (long long)w); hi += w; }
        auto needed = [&](long long cap) {
            int used = 1;
            long long cur = 0;
            for (int w : weights) {
                if (cur + w > cap) { used++; cur = 0; }
                cur += w;
            }
            return used;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (needed(mid) <= shifts) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // pickupOrder(n: int, deps: List[List[int]]) -> List[int]  — lexicographic topo sort.
  'pghub-b53-courier-order': {
    javascript: `var pickupOrder = function(n, deps) {
    const adj = Array.from({length: n}, () => []);
    const indeg = new Array(n).fill(0);
    for (const [a, b] of deps) { adj[a].push(b); indeg[b]++; }
    const heap = [];
    const push = v => { heap.push(v); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p] <= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; const m = heap.length; while (true) { let l = 2*i+1, r = 2*i+2, sm = i; if (l < m && heap[l] < heap[sm]) sm = l; if (r < m && heap[r] < heap[sm]) sm = r; if (sm === i) break; [heap[sm], heap[i]] = [heap[i], heap[sm]]; i = sm; } } return top; };
    for (let i = 0; i < n; i++) if (indeg[i] === 0) push(i);
    const order = [];
    while (heap.length) {
        const node = pop();
        order.push(node);
        for (const nb of adj[node]) {
            indeg[nb]--;
            if (indeg[nb] === 0) push(nb);
        }
    }
    return order.length === n ? order : [];
};`,
    java: `import java.util.*;
class Solution {
    public int[] pickupOrder(int n, int[][] deps) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] d : deps) { adj.get(d[0]).add(d[1]); indeg[d[1]]++; }
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.add(i);
        List<Integer> order = new ArrayList<>();
        while (!heap.isEmpty()) {
            int node = heap.poll();
            order.add(node);
            for (int nb : adj.get(node)) {
                if (--indeg[nb] == 0) heap.add(nb);
            }
        }
        if (order.size() != n) return new int[0];
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[i] = order.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> pickupOrder(int n, vector<vector<int>>& deps) {
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& d : deps) { adj[d[0]].push_back(d[1]); indeg[d[1]]++; }
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) heap.push(i);
        vector<int> order;
        while (!heap.empty()) {
            int node = heap.top(); heap.pop();
            order.push_back(node);
            for (int nb : adj[node]) {
                if (--indeg[nb] == 0) heap.push(nb);
            }
        }
        return (int)order.size() == n ? order : vector<int>{};
    }
};`,
  },

  // reduceRatio(a: int, b: int) -> List[int]  — reduce fraction by gcd.
  'pghub-b53-gear-ratio': {
    javascript: `var reduceRatio = function(a, b) {
    const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
    const g = gcd(a, b);
    return [a / g, b / g];
};`,
    java: `class Solution {
    public int[] reduceRatio(int a, int b) {
        int g = gcd(a, b);
        return new int[]{a / g, b / g};
    }
    private int gcd(int x, int y) {
        while (y != 0) { int t = x % y; x = y; y = t; }
        return x;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> reduceRatio(int a, int b) {
        int g = __gcd(a, b);
        return {a / g, b / g};
    }
};`,
  },

  // decompress(s: str) -> str  — run-length expand char+digit pairs.
  'pghub-b53-keypad-mash': {
    javascript: `var decompress = function(s) {
    let out = '';
    for (let i = 0; i < s.length; i += 2) {
        out += s[i].repeat(parseInt(s[i + 1], 10));
    }
    return out;
};`,
    java: `class Solution {
    public String decompress(String s) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < s.length(); i += 2) {
            int count = s.charAt(i + 1) - '0';
            for (int k = 0; k < count; k++) out.append(s.charAt(i));
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decompress(string s) {
        string out;
        for (size_t i = 0; i < s.size(); i += 2) {
            int count = s[i + 1] - '0';
            out.append(count, s[i]);
        }
        return out;
    }
};`,
  },

  // minManhattan(points: List[List[int]]) -> int  — min pairwise Manhattan distance.
  'pghub-b53-laser-cells': {
    javascript: `var minManhattan = function(points) {
    let best = null;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const d = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
            if (best === null || d < best) best = d;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int minManhattan(int[][] points) {
        int best = Integer.MAX_VALUE;
        int n = points.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int d = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
                if (d < best) best = d;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minManhattan(vector<vector<int>>& points) {
        int best = INT_MAX;
        int n = points.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int d = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1]);
                if (d < best) best = d;
            }
        }
        return best;
    }
};`,
  },

  // minCost(trees: List[int]) -> int  — Huffman-style min merge cost.
  'pghub-b53-orchard-rows': {
    javascript: `var minCost = function(trees) {
    if (trees.length <= 1) return 0;
    const heap = trees.slice();
    const heapify = () => { for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i); };
    const down = i => { const n = heap.length; while (true) { let l = 2*i+1, r = 2*i+2, sm = i; if (l < n && heap[l] < heap[sm]) sm = l; if (r < n && heap[r] < heap[sm]) sm = r; if (sm === i) break; [heap[sm], heap[i]] = [heap[i], heap[sm]]; i = sm; } };
    const push = v => { heap.push(v); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p] <= heap[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; down(0); } return top; };
    heapify();
    let total = 0;
    while (heap.length > 1) {
        const a = pop(), b = pop();
        const merged = a + b;
        total += merged;
        push(merged);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int minCost(int[] trees) {
        if (trees.length <= 1) return 0;
        PriorityQueue<Long> heap = new PriorityQueue<>();
        for (int t : trees) heap.add((long) t);
        long total = 0;
        while (heap.size() > 1) {
            long a = heap.poll(), b = heap.poll();
            long merged = a + b;
            total += merged;
            heap.add(merged);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<int>& trees) {
        if (trees.size() <= 1) return 0;
        priority_queue<long long, vector<long long>, greater<long long>> heap;
        for (int t : trees) heap.push(t);
        long long total = 0;
        while (heap.size() > 1) {
            long long a = heap.top(); heap.pop();
            long long b = heap.top(); heap.pop();
            long long merged = a + b;
            total += merged;
            heap.push(merged);
        }
        return (int) total;
    }
};`,
  },

  // minCuts(s: str) -> int  — palindrome partitioning min cuts DP.
  'pghub-b53-palindrome-cut': {
    javascript: `var minCuts = function(s) {
    const n = s.length;
    const pal = Array.from({length: n}, () => new Array(n).fill(false));
    for (let i = 0; i < n; i++) pal[i][i] = true;
    for (let length = 2; length <= n; length++) {
        for (let i = 0; i + length - 1 < n; i++) {
            const j = i + length - 1;
            if (s[i] === s[j] && (length === 2 || pal[i + 1][j - 1])) pal[i][j] = true;
        }
    }
    const dp = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        if (pal[0][i]) dp[i] = 0;
        else {
            let best = i;
            for (let j = 1; j <= i; j++) {
                if (pal[j][i] && dp[j - 1] + 1 < best) best = dp[j - 1] + 1;
            }
            dp[i] = best;
        }
    }
    return dp[n - 1];
};`,
    java: `class Solution {
    public int minCuts(String s) {
        int n = s.length();
        boolean[][] pal = new boolean[n][n];
        for (int i = 0; i < n; i++) pal[i][i] = true;
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s.charAt(i) == s.charAt(j) && (length == 2 || pal[i + 1][j - 1])) pal[i][j] = true;
            }
        }
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            if (pal[0][i]) dp[i] = 0;
            else {
                int best = i;
                for (int j = 1; j <= i; j++) {
                    if (pal[j][i] && dp[j - 1] + 1 < best) best = dp[j - 1] + 1;
                }
                dp[i] = best;
            }
        }
        return dp[n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCuts(string s) {
        int n = s.size();
        vector<vector<bool>> pal(n, vector<bool>(n, false));
        for (int i = 0; i < n; i++) pal[i][i] = true;
        for (int length = 2; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                if (s[i] == s[j] && (length == 2 || pal[i + 1][j - 1])) pal[i][j] = true;
            }
        }
        vector<int> dp(n, 0);
        for (int i = 0; i < n; i++) {
            if (pal[0][i]) dp[i] = 0;
            else {
                int best = i;
                for (int j = 1; j <= i; j++) {
                    if (pal[j][i] && dp[j - 1] + 1 < best) best = dp[j - 1] + 1;
                }
                dp[i] = best;
            }
        }
        return dp[n - 1];
    }
};`,
  },

  // routeAll(prefixes: List[str], queries: List[str]) -> List[int]  — trie longest-prefix match.
  'pghub-b53-prefix-router': {
    javascript: `var routeAll = function(prefixes, queries) {
    const root = {};
    for (const p of prefixes) {
        let node = root;
        for (const ch of p) {
            if (!(ch in node)) node[ch] = {};
            node = node[ch];
        }
        node['#'] = p.length;
    }
    const res = [];
    for (const q of queries) {
        let node = root, best = 0;
        for (const ch of q) {
            if (!(ch in node)) break;
            node = node[ch];
            if ('#' in node) best = node['#'];
        }
        res.push(best);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] routeAll(String[] prefixes, String[] queries) {
        Map<Character, Object> root = new HashMap<>();
        for (String p : prefixes) {
            Map<Character, Object> node = root;
            for (int i = 0; i < p.length(); i++) {
                char ch = p.charAt(i);
                node.putIfAbsent(ch, new HashMap<Character, Object>());
                node = (Map<Character, Object>) node.get(ch);
            }
            node.put('#', p.length());
        }
        int[] res = new int[queries.length];
        for (int qi = 0; qi < queries.length; qi++) {
            String q = queries[qi];
            Map<Character, Object> node = root;
            int best = 0;
            for (int i = 0; i < q.length(); i++) {
                char ch = q.charAt(i);
                if (!node.containsKey(ch)) break;
                node = (Map<Character, Object>) node.get(ch);
                if (node.containsKey('#')) best = (Integer) node.get('#');
            }
            res[qi] = best;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
    struct Node {
        unordered_map<char, Node*> next;
        int len = -1;
    };
public:
    vector<int> routeAll(vector<string>& prefixes, vector<string>& queries) {
        Node* root = new Node();
        for (auto& p : prefixes) {
            Node* node = root;
            for (char ch : p) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
            }
            node->len = (int)p.size();
        }
        vector<int> res;
        for (auto& q : queries) {
            Node* node = root;
            int best = 0;
            for (char ch : q) {
                auto it = node->next.find(ch);
                if (it == node->next.end()) break;
                node = it->second;
                if (node->len >= 0) best = node->len;
            }
            res.push_back(best);
        }
        return res;
    }
};`,
  },

  // countReachable(n: int, edges: List[List[int]]) -> int  — undirected BFS reach from 0.
  'pghub-b53-relay-rooms': {
    javascript: `var countReachable = function(n, edges) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const visited = new Array(n).fill(false);
    visited[0] = true;
    let queue = [0], qi = 0, count = 0;
    while (qi < queue.length) {
        const node = queue[qi++];
        count++;
        for (const nb of adj[node]) {
            if (!visited[nb]) { visited[nb] = true; queue.push(nb); }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countReachable(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        boolean[] visited = new boolean[n];
        visited[0] = true;
        Deque<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        int count = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            count++;
            for (int nb : adj.get(node)) {
                if (!visited[nb]) { visited[nb] = true; queue.add(nb); }
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countReachable(int n, vector<vector<int>>& edges) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        vector<bool> visited(n, false);
        visited[0] = true;
        queue<int> q;
        q.push(0);
        int count = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            count++;
            for (int nb : adj[node]) {
                if (!visited[nb]) { visited[nb] = true; q.push(nb); }
            }
        }
        return count;
    }
};`,
  },

  // mergeShelves(shelves: List[List[int]]) -> List[List[int]]  — merge overlapping intervals.
  'pghub-b53-shelf-merge': {
    javascript: `var mergeShelves = function(shelves) {
    shelves.sort((a, b) => a[0] - b[0]);
    const merged = [[shelves[0][0], shelves[0][1]]];
    for (let i = 1; i < shelves.length; i++) {
        const [start, end] = shelves[i];
        const last = merged[merged.length - 1];
        if (start <= last[1]) {
            if (end > last[1]) last[1] = end;
        } else {
            merged.push([start, end]);
        }
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeShelves(int[][] shelves) {
        Arrays.sort(shelves, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        merged.add(new int[]{shelves[0][0], shelves[0][1]});
        for (int i = 1; i < shelves.length; i++) {
            int start = shelves[i][0], end = shelves[i][1];
            int[] last = merged.get(merged.size() - 1);
            if (start <= last[1]) {
                if (end > last[1]) last[1] = end;
            } else {
                merged.add(new int[]{start, end});
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeShelves(vector<vector<int>>& shelves) {
        sort(shelves.begin(), shelves.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        merged.push_back({shelves[0][0], shelves[0][1]});
        for (size_t i = 1; i < shelves.size(); i++) {
            int start = shelves[i][0], end = shelves[i][1];
            if (start <= merged.back()[1]) {
                if (end > merged.back()[1]) merged.back()[1] = end;
            } else {
                merged.push_back({start, end});
            }
        }
        return merged;
    }
};`,
  },

  // maxAfterFlip(n: int) -> int  — max value from flipping one bit.
  'pghub-b53-signal-flip': {
    javascript: `var maxAfterFlip = function(n) {
    if (n === 0) return 1;
    const bits = n.toString(2).length;
    let best = n;
    for (let i = 0; i < bits; i++) {
        const flipped = n ^ (1 << i);
        if (flipped > best) best = flipped;
    }
    return best;
};`,
    java: `class Solution {
    public int maxAfterFlip(int n) {
        if (n == 0) return 1;
        int bits = 32 - Integer.numberOfLeadingZeros(n);
        int best = n;
        for (int i = 0; i < bits; i++) {
            int flipped = n ^ (1 << i);
            if (flipped > best) best = flipped;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAfterFlip(int n) {
        if (n == 0) return 1;
        int bits = 0;
        for (int x = n; x > 0; x >>= 1) bits++;
        int best = n;
        for (int i = 0; i < bits; i++) {
            int flipped = n ^ (1 << i);
            if (flipped > best) best = flipped;
        }
        return best;
    }
};`,
  },

  // evalPostfix(tokens: List[str]) -> int  — RPN evaluation (int truncation toward zero).
  'pghub-b53-stack-evaluate': {
    javascript: `var evalPostfix = function(tokens) {
    const ops = new Set(['+', '-', '*', '/']);
    const stack = [];
    for (const tok of tokens) {
        if (ops.has(tok)) {
            const b = stack.pop();
            const a = stack.pop();
            if (tok === '+') stack.push(a + b);
            else if (tok === '-') stack.push(a - b);
            else if (tok === '*') stack.push(a * b);
            else stack.push(Math.trunc(a / b));
        } else {
            stack.push(parseInt(tok, 10));
        }
    }
    return stack[0];
};`,
    java: `import java.util.*;
class Solution {
    public int evalPostfix(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String tok : tokens) {
            if (tok.equals("+") || tok.equals("-") || tok.equals("*") || tok.equals("/")) {
                int b = stack.pop();
                int a = stack.pop();
                if (tok.equals("+")) stack.push(a + b);
                else if (tok.equals("-")) stack.push(a - b);
                else if (tok.equals("*")) stack.push(a * b);
                else stack.push(a / b);
            } else {
                stack.push(Integer.parseInt(tok));
            }
        }
        return stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalPostfix(vector<string>& tokens) {
        vector<int> stack;
        for (auto& tok : tokens) {
            if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
                int b = stack.back(); stack.pop_back();
                int a = stack.back(); stack.pop_back();
                if (tok == "+") stack.push_back(a + b);
                else if (tok == "-") stack.push_back(a - b);
                else if (tok == "*") stack.push_back(a * b);
                else stack.push_back(a / b);
            } else {
                stack.push_back(stoi(tok));
            }
        }
        return stack[0];
    }
};`,
  },

  // longestCalm(wait: List[int], limit: int) -> int  — monotonic-deque sliding window.
  'pghub-b53-ticket-window': {
    javascript: `var longestCalm = function(wait, limit) {
    const maxDq = [], minDq = [];
    let left = 0, best = 0;
    for (let right = 0; right < wait.length; right++) {
        const x = wait[right];
        while (maxDq.length && wait[maxDq[maxDq.length - 1]] <= x) maxDq.pop();
        maxDq.push(right);
        while (minDq.length && wait[minDq[minDq.length - 1]] >= x) minDq.pop();
        minDq.push(right);
        while (wait[maxDq[0]] - wait[minDq[0]] > limit) {
            left++;
            if (maxDq[0] < left) maxDq.shift();
            if (minDq[0] < left) minDq.shift();
        }
        if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestCalm(int[] wait, int limit) {
        Deque<Integer> maxDq = new ArrayDeque<>();
        Deque<Integer> minDq = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < wait.length; right++) {
            int x = wait[right];
            while (!maxDq.isEmpty() && wait[maxDq.peekLast()] <= x) maxDq.pollLast();
            maxDq.addLast(right);
            while (!minDq.isEmpty() && wait[minDq.peekLast()] >= x) minDq.pollLast();
            minDq.addLast(right);
            while (wait[maxDq.peekFirst()] - wait[minDq.peekFirst()] > limit) {
                left++;
                if (maxDq.peekFirst() < left) maxDq.pollFirst();
                if (minDq.peekFirst() < left) minDq.pollFirst();
            }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestCalm(vector<int>& wait, int limit) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)wait.size(); right++) {
            int x = wait[right];
            while (!maxDq.empty() && wait[maxDq.back()] <= x) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && wait[minDq.back()] >= x) minDq.pop_back();
            minDq.push_back(right);
            while (wait[maxDq.front()] - wait[minDq.front()] > limit) {
                left++;
                if (maxDq.front() < left) maxDq.pop_front();
                if (minDq.front() < left) minDq.pop_front();
            }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }
};`,
  },

  // countMarks(levels: List[int]) -> int  — count strictly-increasing prefix maxima.
  'pghub-b53-tide-marks': {
    javascript: `var countMarks = function(levels) {
    let best = null, count = 0;
    for (const x of levels) {
        if (best === null || x > best) { count++; best = x; }
    }
    return count;
};`,
    java: `class Solution {
    public int countMarks(int[] levels) {
        boolean has = false;
        int best = 0, count = 0;
        for (int x : levels) {
            if (!has || x > best) { count++; best = x; has = true; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countMarks(vector<int>& levels) {
        bool has = false;
        int best = 0, count = 0;
        for (int x : levels) {
            if (!has || x > best) { count++; best = x; has = true; }
        }
        return count;
    }
};`,
  },
};
