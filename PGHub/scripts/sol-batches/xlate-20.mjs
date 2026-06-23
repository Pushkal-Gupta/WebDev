// xlate-20: final ~20 targets (slice [570,590)) — translate verified Python to
// the missing langs. Signatures match generateTemplate(...) exactly.
// pghub-* targets need js/java/cpp; the three real-LC slugs at the end need cpp only.
export default {
  // levelMaxes(parent: List[int], values: List[int]) -> List[int]
  // BFS over parent-array tree, max value per level. root = node with parent -1.
  'pghub-tree-level-max': {
    javascript: `var levelMaxes = function(parent, values) {
    const n = parent.length;
    const children = Array.from({length: n}, () => []);
    let root = 0;
    for (let i = 0; i < n; i++) {
        if (parent[i] === -1) root = i;
        else children[parent[i]].push(i);
    }
    const res = [];
    let q = [root];
    while (q.length) {
        let best = -Infinity;
        const next = [];
        for (const node of q) {
            if (values[node] > best) best = values[node];
            for (const ch of children[node]) next.push(ch);
        }
        res.push(best);
        q = next;
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] levelMaxes(int[] parent, int[] values) {
        int n = parent.length;
        List<List<Integer>> children = new ArrayList<>();
        for (int i = 0; i < n; i++) children.add(new ArrayList<>());
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children.get(parent[i]).add(i);
        }
        List<Integer> res = new ArrayList<>();
        Deque<Integer> q = new ArrayDeque<>();
        q.add(root);
        while (!q.isEmpty()) {
            int best = Integer.MIN_VALUE;
            int sz = q.size();
            for (int s = 0; s < sz; s++) {
                int node = q.poll();
                if (values[node] > best) best = values[node];
                for (int ch : children.get(node)) q.add(ch);
            }
            res.add(best);
        }
        int[] out = new int[res.size()];
        for (int i = 0; i < out.length; i++) out[i] = res.get(i);
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> levelMaxes(vector<int>& parent, vector<int>& values) {
        int n = parent.size();
        vector<vector<int>> children(n);
        int root = 0;
        for (int i = 0; i < n; i++) {
            if (parent[i] == -1) root = i;
            else children[parent[i]].push_back(i);
        }
        vector<int> res;
        queue<int> q;
        q.push(root);
        while (!q.empty()) {
            int best = INT_MIN;
            int sz = q.size();
            for (int s = 0; s < sz; s++) {
                int node = q.front(); q.pop();
                if (values[node] > best) best = values[node];
                for (int ch : children[node]) q.push(ch);
            }
            res.push_back(best);
        }
        return res;
    }
};`,
  },

  // survivingNodes(parent: List[int], value: List[int], limit: int) -> int
  // Iteratively prune leaves whose value < limit; count survivors.
  'pghub-trim-tree-leaves': {
    javascript: `var survivingNodes = function(parent, value, limit) {
    const n = parent.length;
    const children = new Array(n).fill(0);
    for (const p of parent) if (p !== -1) children[p]++;
    const alive = new Array(n).fill(true);
    const q = [];
    for (let i = 0; i < n; i++) if (children[i] === 0 && value[i] < limit) q.push(i);
    let head = 0;
    while (head < q.length) {
        const node = q[head++];
        if (!alive[node]) continue;
        alive[node] = false;
        const p = parent[node];
        if (p !== -1) {
            children[p]--;
            if (children[p] === 0 && value[p] < limit && alive[p]) q.push(p);
        }
    }
    let count = 0;
    for (const x of alive) if (x) count++;
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int survivingNodes(int[] parent, int[] value, int limit) {
        int n = parent.length;
        int[] children = new int[n];
        for (int p : parent) if (p != -1) children[p]++;
        boolean[] alive = new boolean[n];
        Arrays.fill(alive, true);
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (children[i] == 0 && value[i] < limit) q.add(i);
        while (!q.isEmpty()) {
            int node = q.poll();
            if (!alive[node]) continue;
            alive[node] = false;
            int p = parent[node];
            if (p != -1) {
                children[p]--;
                if (children[p] == 0 && value[p] < limit && alive[p]) q.add(p);
            }
        }
        int count = 0;
        for (boolean x : alive) if (x) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int survivingNodes(vector<int>& parent, vector<int>& value, int limit) {
        int n = parent.size();
        vector<int> children(n, 0);
        for (int p : parent) if (p != -1) children[p]++;
        vector<bool> alive(n, true);
        queue<int> q;
        for (int i = 0; i < n; i++) if (children[i] == 0 && value[i] < limit) q.push(i);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            if (!alive[node]) continue;
            alive[node] = false;
            int p = parent[node];
            if (p != -1) {
                children[p]--;
                if (children[p] == 0 && value[p] < limit && alive[p]) q.push(p);
            }
        }
        int count = 0;
        for (bool x : alive) if (x) count++;
        return count;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — sum of XOR over all subsets.
  'pghub-unique-bit-subset-xor': {
    javascript: `var subsetXorSum = function(nums) {
    const n = nums.length;
    let total = 0;
    for (let mask = 0; mask < (1 << n); mask++) {
        let x = 0;
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) x ^= nums[i];
        }
        total += x;
    }
    return total;
};`,
    java: `class Solution {
    public int subsetXorSum(int[] nums) {
        int n = nums.length;
        int total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int x = 0;
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) x ^= nums[i];
            }
            total += x;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        int n = nums.size();
        long long total = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int x = 0;
            for (int i = 0; i < n; i++) {
                if (mask & (1 << i)) x ^= nums[i];
            }
            total += x;
        }
        return (int)total;
    }
};`,
  },

  // distinctWidths(heights: List[int]) -> int
  // count distinct frequency-values among the heights.
  'pghub-unique-skyline': {
    javascript: `var distinctWidths = function(heights) {
    const counts = new Map();
    for (const h of heights) counts.set(h, (counts.get(h) || 0) + 1);
    const distinct = new Set();
    for (const v of counts.values()) distinct.add(v);
    return distinct.size;
};`,
    java: `import java.util.*;
class Solution {
    public int distinctWidths(int[] heights) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int h : heights) counts.merge(h, 1, Integer::sum);
        Set<Integer> distinct = new HashSet<>(counts.values());
        return distinct.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctWidths(vector<int>& heights) {
        unordered_map<int,int> counts;
        for (int h : heights) counts[h]++;
        unordered_set<int> distinct;
        for (auto& kv : counts) distinct.insert(kv.second);
        return distinct.size();
    }
};`,
  },

  // dialSteps(start: int, target: int, size: int) -> int  — min circular distance.
  'pghub-vault-rotation': {
    javascript: `var dialSteps = function(start, target, size) {
    const d = Math.abs(start - target);
    return Math.min(d, size - d);
};`,
    java: `class Solution {
    public int dialSteps(int start, int target, int size) {
        int d = Math.abs(start - target);
        return Math.min(d, size - d);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int dialSteps(int start, int target, int size) {
        int d = abs(start - target);
        return min(d, size - d);
    }
};`,
  },

  // vowelScore(s: str) -> int  — sum of 1-based positions of vowels.
  'pghub-vowel-position-score': {
    javascript: `var vowelScore = function(s) {
    const vowels = new Set(['a','e','i','o','u']);
    let total = 0;
    for (let i = 0; i < s.length; i++) {
        if (vowels.has(s[i])) total += i + 1;
    }
    return total;
};`,
    java: `class Solution {
    public int vowelScore(String s) {
        String vowels = "aeiou";
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            if (vowels.indexOf(s.charAt(i)) >= 0) total += i + 1;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int vowelScore(string s) {
        string vowels = "aeiou";
        int total = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            if (vowels.find(s[i]) != string::npos) total += i + 1;
        }
        return total;
    }
};`,
  },

  // maxVowels(s: str, k: int) -> int  — max vowels in any window of size k.
  'pghub-vowel-window': {
    javascript: `var maxVowels = function(s, k) {
    const vowels = new Set(['a','e','i','o','u']);
    let cur = 0;
    for (let i = 0; i < k; i++) if (vowels.has(s[i])) cur++;
    let best = cur;
    for (let i = k; i < s.length; i++) {
        if (vowels.has(s[i])) cur++;
        if (vowels.has(s[i - k])) cur--;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int maxVowels(String s, int k) {
        String vowels = "aeiou";
        int cur = 0;
        for (int i = 0; i < k; i++) if (vowels.indexOf(s.charAt(i)) >= 0) cur++;
        int best = cur;
        for (int i = k; i < s.length(); i++) {
            if (vowels.indexOf(s.charAt(i)) >= 0) cur++;
            if (vowels.indexOf(s.charAt(i - k)) >= 0) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxVowels(string s, int k) {
        string vowels = "aeiou";
        int cur = 0;
        for (int i = 0; i < k; i++) if (vowels.find(s[i]) != string::npos) cur++;
        int best = cur;
        for (int i = k; i < (int)s.size(); i++) {
            if (vowels.find(s[i]) != string::npos) cur++;
            if (vowels.find(s[i - k]) != string::npos) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // maxVowels(s: str, k: int) -> int  — same as above with k >= n guard.
  'pghub-vowel-window-max': {
    javascript: `var maxVowels = function(s, k) {
    const vowels = new Set(['a','e','i','o','u']);
    const n = s.length;
    if (k >= n) {
        let c = 0;
        for (const ch of s) if (vowels.has(ch)) c++;
        return c;
    }
    let cur = 0;
    for (let i = 0; i < k; i++) if (vowels.has(s[i])) cur++;
    let best = cur;
    for (let i = k; i < n; i++) {
        if (vowels.has(s[i])) cur++;
        if (vowels.has(s[i - k])) cur--;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int maxVowels(String s, int k) {
        String vowels = "aeiou";
        int n = s.length();
        if (k >= n) {
            int c = 0;
            for (int i = 0; i < n; i++) if (vowels.indexOf(s.charAt(i)) >= 0) c++;
            return c;
        }
        int cur = 0;
        for (int i = 0; i < k; i++) if (vowels.indexOf(s.charAt(i)) >= 0) cur++;
        int best = cur;
        for (int i = k; i < n; i++) {
            if (vowels.indexOf(s.charAt(i)) >= 0) cur++;
            if (vowels.indexOf(s.charAt(i - k)) >= 0) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxVowels(string s, int k) {
        string vowels = "aeiou";
        int n = s.size();
        if (k >= n) {
            int c = 0;
            for (char ch : s) if (vowels.find(ch) != string::npos) c++;
            return c;
        }
        int cur = 0;
        for (int i = 0; i < k; i++) if (vowels.find(s[i]) != string::npos) cur++;
        int best = cur;
        for (int i = k; i < n; i++) {
            if (vowels.find(s[i]) != string::npos) cur++;
            if (vowels.find(s[i - k]) != string::npos) cur--;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // restockDays(stock, demand, cap) -> int  — binary-search max survivable days.
  'pghub-warehouse-restock': {
    javascript: `var restockDays = function(stock, demand, cap) {
    let totalDemand = 0;
    for (const d of demand) totalDemand += d;
    if (cap >= totalDemand) return -1;
    const survives = (days) => {
        let deficit = 0;
        for (let i = 0; i < stock.length; i++) {
            const need = days * demand[i];
            if (need > stock[i]) deficit += need - stock[i];
        }
        return deficit <= days * cap;
    };
    let lo = 0, hi = 1;
    while (survives(hi)) hi *= 2;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (survives(mid)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
};`,
    java: `class Solution {
    private int[] stock, demand;
    private int cap;
    public int restockDays(int[] stock, int[] demand, int cap) {
        this.stock = stock; this.demand = demand; this.cap = cap;
        long totalDemand = 0;
        for (int d : demand) totalDemand += d;
        if (cap >= totalDemand) return -1;
        long lo = 0, hi = 1;
        while (survives(hi)) hi *= 2;
        while (lo < hi) {
            long mid = (lo + hi + 1) / 2;
            if (survives(mid)) lo = mid;
            else hi = mid - 1;
        }
        return (int) lo;
    }
    private boolean survives(long days) {
        long deficit = 0;
        for (int i = 0; i < stock.length; i++) {
            long need = days * demand[i];
            if (need > stock[i]) deficit += need - stock[i];
        }
        return deficit <= days * (long) cap;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockDays(vector<int>& stock, vector<int>& demand, int cap) {
        long long totalDemand = 0;
        for (int d : demand) totalDemand += d;
        if (cap >= totalDemand) return -1;
        auto survives = [&](long long days) {
            long long deficit = 0;
            for (size_t i = 0; i < stock.size(); i++) {
                long long need = days * demand[i];
                if (need > stock[i]) deficit += need - stock[i];
            }
            return deficit <= days * (long long)cap;
        };
        long long lo = 0, hi = 1;
        while (survives(hi)) hi *= 2;
        while (lo < hi) {
            long long mid = (lo + hi + 1) / 2;
            if (survives(mid)) lo = mid;
            else hi = mid - 1;
        }
        return (int)lo;
    }
};`,
  },

  // tiltIndex(weights: List[int]) -> int  — pivot where left sum == right sum.
  'pghub-warehouse-tilt-balance': {
    javascript: `var tiltIndex = function(weights) {
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
    public int tiltIndex(int[] weights) {
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
    int tiltIndex(vector<int>& weights) {
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

  // countZones(grid: List[List[int]]) -> int  — connected components of 1s (DFS).
  'pghub-warehouse-zones': {
    javascript: `var countZones = function(grid) {
    const r = grid.length, c = grid[0].length;
    const seen = Array.from({length: r}, () => new Array(c).fill(false));
    let zones = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            if (grid[i][j] === 1 && !seen[i][j]) {
                zones++;
                const stack = [[i, j]];
                seen[i][j] = true;
                while (stack.length) {
                    const [x, y] = stack.pop();
                    for (const [dx, dy] of dirs) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < r && ny >= 0 && ny < c && grid[nx][ny] === 1 && !seen[nx][ny]) {
                            seen[nx][ny] = true;
                            stack.push([nx, ny]);
                        }
                    }
                }
            }
        }
    }
    return zones;
};`,
    java: `import java.util.*;
class Solution {
    public int countZones(int[][] grid) {
        int r = grid.length, c = grid[0].length;
        boolean[][] seen = new boolean[r][c];
        int zones = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (grid[i][j] == 1 && !seen[i][j]) {
                    zones++;
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{i, j});
                    seen[i][j] = true;
                    while (!stack.isEmpty()) {
                        int[] cell = stack.pop();
                        int x = cell[0], y = cell[1];
                        for (int[] d : dirs) {
                            int nx = x + d[0], ny = y + d[1];
                            if (nx >= 0 && nx < r && ny >= 0 && ny < c && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = true;
                                stack.push(new int[]{nx, ny});
                            }
                        }
                    }
                }
            }
        }
        return zones;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countZones(vector<vector<int>>& grid) {
        int r = grid.size(), c = grid[0].size();
        vector<vector<bool>> seen(r, vector<bool>(c, false));
        int zones = 0;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (grid[i][j] == 1 && !seen[i][j]) {
                    zones++;
                    vector<pair<int,int>> stack;
                    stack.push_back({i, j});
                    seen[i][j] = true;
                    while (!stack.empty()) {
                        auto [x, y] = stack.back(); stack.pop_back();
                        for (auto& d : dirs) {
                            int nx = x + d[0], ny = y + d[1];
                            if (nx >= 0 && nx < r && ny >= 0 && ny < c && grid[nx][ny] == 1 && !seen[nx][ny]) {
                                seen[nx][ny] = true;
                                stack.push_back({nx, ny});
                            }
                        }
                    }
                }
            }
        }
        return zones;
    }
};`,
  },

  // transformLength(begin, end, words) -> int  — word-ladder BFS, length or 0.
  'pghub-word-ladder-length': {
    javascript: `var transformLength = function(begin, end, words) {
    const wordset = new Set(words);
    if (!wordset.has(end)) return 0;
    const visited = new Set([begin]);
    let q = [[begin, 1]];
    let head = 0;
    while (head < q.length) {
        const [word, dist] = q[head++];
        if (word === end) return dist;
        for (let i = 0; i < word.length; i++) {
            for (let cc = 97; cc < 123; cc++) {
                const c = String.fromCharCode(cc);
                if (c === word[i]) continue;
                const nxt = word.slice(0, i) + c + word.slice(i + 1);
                if (wordset.has(nxt) && !visited.has(nxt)) {
                    visited.add(nxt);
                    q.push([nxt, dist + 1]);
                }
            }
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int transformLength(String begin, String end, String[] words) {
        Set<String> wordset = new HashSet<>(Arrays.asList(words));
        if (!wordset.contains(end)) return 0;
        Set<String> visited = new HashSet<>();
        visited.add(begin);
        Deque<String> q = new ArrayDeque<>();
        Deque<Integer> dq = new ArrayDeque<>();
        q.add(begin); dq.add(1);
        while (!q.isEmpty()) {
            String word = q.poll();
            int dist = dq.poll();
            if (word.equals(end)) return dist;
            char[] arr = word.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    arr[i] = c;
                    String nxt = new String(arr);
                    if (wordset.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        q.add(nxt); dq.add(dist + 1);
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
        unordered_set<string> wordset(words.begin(), words.end());
        if (!wordset.count(end)) return 0;
        unordered_set<string> visited;
        visited.insert(begin);
        queue<pair<string,int>> q;
        q.push({begin, 1});
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == end) return dist;
            for (int i = 0; i < (int)word.size(); i++) {
                char orig = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    word[i] = c;
                    if (wordset.count(word) && !visited.count(word)) {
                        visited.insert(word);
                        q.push({word, dist + 1});
                    }
                }
                word[i] = orig;
            }
        }
        return 0;
    }
};`,
  },

  // rotateWords(s: str, k: int) -> str  — rotate space-separated words left by k.
  'pghub-word-rotate': {
    javascript: `var rotateWords = function(s, k) {
    const words = s.split(' ');
    const n = words.length;
    k = ((k % n) + n) % n;
    return words.slice(k).concat(words.slice(0, k)).join(' ');
};`,
    java: `class Solution {
    public String rotateWords(String s, int k) {
        String[] words = s.split(" ");
        int n = words.length;
        k = ((k % n) + n) % n;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(words[(k + i) % n]);
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string rotateWords(string s, int k) {
        vector<string> words;
        stringstream ss(s);
        string w;
        while (getline(ss, w, ' ')) words.push_back(w);
        int n = words.size();
        k = ((k % n) + n) % n;
        string res;
        for (int i = 0; i < n; i++) {
            if (i > 0) res += ' ';
            res += words[(k + i) % n];
        }
        return res;
    }
};`,
  },

  // hasXorPair(nums: List[int], target: int) -> bool  — two numbers XOR to target.
  'pghub-xor-pair-target': {
    javascript: `var hasXorPair = function(nums, target) {
    const seen = new Set();
    for (const x of nums) {
        if (seen.has(x ^ target)) return true;
        seen.add(x);
    }
    return false;
};`,
    java: `import java.util.*;
class Solution {
    public boolean hasXorPair(int[] nums, int target) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (seen.contains(x ^ target)) return true;
            seen.add(x);
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool hasXorPair(vector<int>& nums, int target) {
        unordered_set<int> seen;
        for (int x : nums) {
            if (seen.count(x ^ target)) return true;
            seen.insert(x);
        }
        return false;
    }
};`,
  },

  // alternate(a: List[int], b: List[int]) -> List[int]  — interleave a,b.
  'pghub-zigzag-merge': {
    javascript: `var alternate = function(a, b) {
    const out = [];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        if (i < a.length) out.push(a[i]);
        if (i < b.length) out.push(b[i]);
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] alternate(int[] a, int[] b) {
        List<Integer> out = new ArrayList<>();
        int n = Math.max(a.length, b.length);
        for (int i = 0; i < n; i++) {
            if (i < a.length) out.add(a[i]);
            if (i < b.length) out.add(b[i]);
        }
        int[] res = new int[out.size()];
        for (int i = 0; i < res.length; i++) res[i] = out.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> alternate(vector<int>& a, vector<int>& b) {
        vector<int> out;
        int n = max(a.size(), b.size());
        for (int i = 0; i < n; i++) {
            if (i < (int)a.size()) out.push_back(a[i]);
            if (i < (int)b.size()) out.push_back(b[i]);
        }
        return out;
    }
};`,
  },

  // zigzagEncode(s: str, rows: int) -> str  — LeetCode ZigZag conversion.
  'pghub-zigzag-rows': {
    javascript: `var zigzagEncode = function(s, rows) {
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
    public String zigzagEncode(String s, int rows) {
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
    string zigzagEncode(string s, int rows) {
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

  // checksum(s: str) -> int  — alternating add/subtract of digit values.
  'pghub-zip-checksum': {
    javascript: `var checksum = function(s) {
    let total = 0;
    for (let i = 0; i < s.length; i++) {
        const d = s.charCodeAt(i) - 48;
        if (i % 2 === 0) total += d;
        else total -= d;
    }
    return total;
};`,
    java: `class Solution {
    public int checksum(String s) {
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int d = s.charAt(i) - '0';
            if (i % 2 == 0) total += d;
            else total -= d;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int checksum(string s) {
        int total = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            int d = s[i] - '0';
            if (i % 2 == 0) total += d;
            else total -= d;
        }
        return total;
    }
};`,
  },

  // stringMatching(nums: List[str]) -> Any (List[str])  — substrings of others.
  // cpp only (js/java already present).
  'string-matching-in-an-array': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> stringMatching(vector<string>& nums) {
        vector<string> res;
        for (size_t i = 0; i < nums.size(); i++) {
            for (size_t j = 0; j < nums.size(); j++) {
                if (i != j && nums[j].find(nums[i]) != string::npos) {
                    res.push_back(nums[i]);
                    break;
                }
            }
        }
        return res;
    }
};`,
  },

  // sumOfUnique(input: List[int]) -> Any (int)  — sum of elements appearing once.
  // cpp only.
  'sum-of-unique-elements': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sumOfUnique(vector<int>& input) {
        unordered_map<int,int> freq;
        for (int x : input) freq[x]++;
        int sum = 0;
        for (auto& kv : freq) if (kv.second == 1) sum += kv.first;
        return sum;
    }
};`,
  },

  // transpose(grid: List[List[int]]) -> Any (List[List[int]])  — matrix transpose.
  // cpp only.
  'transpose-matrix': {
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> transpose(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<vector<int>> res(n, vector<int>(m));
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                res[j][i] = grid[i][j];
        return res;
    }
};`,
  },
};
