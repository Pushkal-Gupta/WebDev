// xlate-21 — faithful JS/Java/C++ translations of verified Python canonicals.
// Slice [0,31) of unstaged ∩ pyReal ∩ missingLangs. Only missing langs per slug.
// Signatures match generateTemplate(language, method_name, params, return_type).

export default {
  // mergeConveyors(belts: List[List[int]]) -> List[int]  — k-way merge via min-heap.
  'pghub-b41-conveyor-merge': {
    javascript: `var mergeConveyors = function(belts) {
    // min-heap of [val, beltIdx, idx]
    const heap = [];
    const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (cmp(heap[i], heap[p]) < 0) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
            else break;
        }
    };
    const down = (i) => {
        const n = heap.length;
        for (;;) {
            let l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < n && cmp(heap[l], heap[s]) < 0) s = l;
            if (r < n && cmp(heap[r], heap[s]) < 0) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    for (let bi = 0; bi < belts.length; bi++) {
        if (belts[bi].length) push([belts[bi][0], bi, 0]);
    }
    const out = [];
    while (heap.length) {
        const [val, bi, idx] = pop();
        out.push(val);
        if (idx + 1 < belts[bi].length) push([belts[bi][idx + 1], bi, idx + 1]);
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] mergeConveyors(int[][] belts) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> {
            if (a[0] != b[0]) return Integer.compare(a[0], b[0]);
            if (a[1] != b[1]) return Integer.compare(a[1], b[1]);
            return Integer.compare(a[2], b[2]);
        });
        for (int bi = 0; bi < belts.length; bi++)
            if (belts[bi].length > 0) heap.offer(new int[]{belts[bi][0], bi, 0});
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            int val = cur[0], bi = cur[1], idx = cur[2];
            out.add(val);
            if (idx + 1 < belts[bi].length) heap.offer(new int[]{belts[bi][idx + 1], bi, idx + 1});
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
    vector<int> mergeConveyors(vector<vector<int>>& belts) {
        // min-heap of {val, beltIdx, idx}
        auto cmp = [](const array<int,3>& a, const array<int,3>& b) {
            if (a[0] != b[0]) return a[0] > b[0];
            if (a[1] != b[1]) return a[1] > b[1];
            return a[2] > b[2];
        };
        priority_queue<array<int,3>, vector<array<int,3>>, decltype(cmp)> heap(cmp);
        for (int bi = 0; bi < (int)belts.size(); bi++)
            if (!belts[bi].empty()) heap.push({belts[bi][0], bi, 0});
        vector<int> out;
        while (!heap.empty()) {
            auto cur = heap.top(); heap.pop();
            int val = cur[0], bi = cur[1], idx = cur[2];
            out.push_back(val);
            if (idx + 1 < (int)belts[bi].size()) heap.push({belts[bi][idx + 1], bi, idx + 1});
        }
        return out;
    }
};`,
  },

  // minSpend(prices: List[int], pass3: int) -> int  — DP from the back.
  'pghub-b41-discount-tiers': {
    javascript: `var minSpend = function(prices, pass3) {
    const n = prices.length;
    const dp = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        const pay = prices[i] + dp[i + 1];
        const bundle = pass3 + dp[Math.min(i + 3, n)];
        dp[i] = Math.min(pay, bundle);
    }
    return dp[0];
};`,
    java: `class Solution {
    public int minSpend(int[] prices, int pass3) {
        int n = prices.length;
        int[] dp = new int[n + 1];
        for (int i = n - 1; i >= 0; i--) {
            int pay = prices[i] + dp[i + 1];
            int bundle = pass3 + dp[Math.min(i + 3, n)];
            dp[i] = Math.min(pay, bundle);
        }
        return dp[0];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpend(vector<int>& prices, int pass3) {
        int n = prices.size();
        vector<int> dp(n + 1, 0);
        for (int i = n - 1; i >= 0; i--) {
            int pay = prices[i] + dp[i + 1];
            int bundle = pass3 + dp[min(i + 3, n)];
            dp[i] = min(pay, bundle);
        }
        return dp[0];
    }
};`,
  },

  // minRate(plants: List[int], days: int) -> int  — binary search on rate.
  'pghub-b41-garden-water-days': {
    javascript: `var minRate = function(plants, days) {
    const budget = days * 8;
    const hours = (r) => {
        let s = 0;
        for (const p of plants) s += Math.floor((p + r - 1) / r);
        return s;
    };
    let lo = 1, hi = Math.max(...plants);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (hours(mid) <= budget) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minRate(int[] plants, int days) {
        long budget = (long) days * 8;
        int lo = 1, hi = 0;
        for (int p : plants) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours(plants, mid) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
    private long hours(int[] plants, int r) {
        long s = 0;
        for (int p : plants) s += (p + r - 1) / r;
        return s;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRate(vector<int>& plants, int days) {
        long long budget = (long long) days * 8;
        auto hours = [&](int r) {
            long long s = 0;
            for (int p : plants) s += (p + r - 1) / r;
            return s;
        };
        int lo = 1, hi = *max_element(plants.begin(), plants.end());
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hours(mid) <= budget) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // countClusters(grid: List[List[int]]) -> int  — iterative DFS flood fill.
  'pghub-b41-island-cluster-count': {
    javascript: `var countClusters = function(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let count = 0;
    for (let sr = 0; sr < rows; sr++) {
        for (let sc = 0; sc < cols; sc++) {
            if (grid[sr][sc] === 1 && !seen[sr][sc]) {
                count++;
                const stack = [[sr, sc]];
                seen[sr][sc] = true;
                while (stack.length) {
                    const [r, c] = stack.pop();
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countClusters(int[][] grid) {
        if (grid.length == 0 || grid[0].length == 0) return 0;
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{sr, sc});
                    seen[sr][sc] = true;
                    while (!stack.isEmpty()) {
                        int[] cur = stack.pop();
                        for (int[] d : dirs) {
                            int nr = cur[0] + d[0], nc = cur[1] + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push(new int[]{nr, nc});
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
    int countClusters(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stack = {{sr, sc}};
                    seen[sr][sc] = true;
                    while (!stack.empty()) {
                        auto [r, c] = stack.back(); stack.pop_back();
                        for (auto& d : dirs) {
                            int nr = r + d[0], nc = c + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push_back({nr, nc});
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

  // finalBalance(ops: List[str]) -> int  — stack of signed deltas with undo.
  'pghub-b41-ledger-rollback': {
    javascript: `var finalBalance = function(ops) {
    let balance = 0;
    const history = [];
    for (const op of ops) {
        if (op === 'undo') {
            if (history.length) balance -= history.pop();
        } else {
            const delta = parseInt(op, 10);
            balance += delta;
            history.push(delta);
        }
    }
    return balance;
};`,
    java: `import java.util.*;
class Solution {
    public int finalBalance(String[] ops) {
        int balance = 0;
        Deque<Integer> history = new ArrayDeque<>();
        for (String op : ops) {
            if (op.equals("undo")) {
                if (!history.isEmpty()) balance -= history.pop();
            } else {
                int delta = Integer.parseInt(op);
                balance += delta;
                history.push(delta);
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
        int balance = 0;
        vector<int> history;
        for (auto& op : ops) {
            if (op == "undo") {
                if (!history.empty()) { balance -= history.back(); history.pop_back(); }
            } else {
                int delta = stoi(op);
                balance += delta;
                history.push_back(delta);
            }
        }
        return balance;
    }
};`,
  },

  // minJoinCost(ropes: List[int]) -> int  — Huffman-style min-heap merge.
  'pghub-b41-rope-cut-cost': {
    javascript: `var minJoinCost = function(ropes) {
    if (ropes.length <= 1) return 0;
    // binary min-heap
    const heap = ropes.slice();
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[i] < heap[p]) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
            else break;
        }
    };
    const down = (i) => {
        const n = heap.length;
        for (;;) {
            let l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    for (let i = (heap.length >> 1) - 1; i >= 0; i--) down(i);
    let total = 0;
    while (heap.length > 1) {
        const a = pop(), b = pop();
        const s = a + b;
        total += s;
        push(s);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int minJoinCost(int[] ropes) {
        if (ropes.length <= 1) return 0;
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int r : ropes) heap.offer(r);
        long total = 0;
        while (heap.size() > 1) {
            int a = heap.poll(), b = heap.poll();
            int s = a + b;
            total += s;
            heap.offer(s);
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minJoinCost(vector<int>& ropes) {
        if (ropes.size() <= 1) return 0;
        priority_queue<int, vector<int>, greater<int>> heap(ropes.begin(), ropes.end());
        long long total = 0;
        while (heap.size() > 1) {
            int a = heap.top(); heap.pop();
            int b = heap.top(); heap.pop();
            int s = a + b;
            total += s;
            heap.push(s);
        }
        return (int) total;
    }
};`,
  },

  // heaviestUnder(weights: List[int], cap: int) -> int  — max weight ≤ cap, else -1.
  'pghub-b41-shelf-weight-cap': {
    javascript: `var heaviestUnder = function(weights, cap) {
    let best = -1;
    for (const w of weights) {
        if (w <= cap && w > best) best = w;
    }
    return best;
};`,
    java: `class Solution {
    public int heaviestUnder(int[] weights, int cap) {
        int best = -1;
        for (int w : weights) {
            if (w <= cap && w > best) best = w;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int heaviestUnder(vector<int>& weights, int cap) {
        int best = -1;
        for (int w : weights) {
            if (w <= cap && w > best) best = w;
        }
        return best;
    }
};`,
  },

  // priceSpans(prices: List[int]) -> List[int]  — monotonic stack of (price, span).
  'pghub-b41-stack-span': {
    javascript: `var priceSpans = function(prices) {
    const spans = [];
    const stack = []; // [price, span]
    for (const p of prices) {
        let span = 1;
        while (stack.length && stack[stack.length - 1][0] <= p) {
            span += stack.pop()[1];
        }
        stack.push([p, span]);
        spans.push(span);
    }
    return spans;
};`,
    java: `import java.util.*;
class Solution {
    public int[] priceSpans(int[] prices) {
        int[] spans = new int[prices.length];
        Deque<int[]> stack = new ArrayDeque<>(); // {price, span}
        for (int i = 0; i < prices.length; i++) {
            int p = prices[i], span = 1;
            while (!stack.isEmpty() && stack.peek()[0] <= p) {
                span += stack.pop()[1];
            }
            stack.push(new int[]{p, span});
            spans[i] = span;
        }
        return spans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> priceSpans(vector<int>& prices) {
        vector<int> spans;
        vector<pair<int,int>> stack; // (price, span)
        for (int p : prices) {
            int span = 1;
            while (!stack.empty() && stack.back().first <= p) {
                span += stack.back().second;
                stack.pop_back();
            }
            stack.push_back({p, span});
            spans.push_back(span);
        }
        return spans;
    }
};`,
  },

  // countSubarrays(nums: List[int], k: int) -> int  — prefix-sum hashmap.
  'pghub-b41-subarray-sum-k': {
    javascript: `var countSubarrays = function(nums, k) {
    const counts = new Map();
    counts.set(0, 1);
    let prefix = 0, result = 0;
    for (const x of nums) {
        prefix += x;
        result += counts.get(prefix - k) || 0;
        counts.set(prefix, (counts.get(prefix) || 0) + 1);
    }
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public int countSubarrays(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        counts.put(0, 1);
        int prefix = 0, result = 0;
        for (int x : nums) {
            prefix += x;
            result += counts.getOrDefault(prefix - k, 0);
            counts.merge(prefix, 1, Integer::sum);
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubarrays(vector<int>& nums, int k) {
        unordered_map<int, int> counts;
        counts[0] = 1;
        int prefix = 0, result = 0;
        for (int x : nums) {
            prefix += x;
            auto it = counts.find(prefix - k);
            if (it != counts.end()) result += it->second;
            counts[prefix]++;
        }
        return result;
    }
};`,
  },

  // canBalance(flows: List[int]) -> bool  — split point where 2*left == total.
  'pghub-b41-toll-booth-balance': {
    javascript: `var canBalance = function(flows) {
    let total = 0;
    for (const x of flows) total += x;
    let left = 0;
    if (left * 2 === total) return true;
    for (const x of flows) {
        left += x;
        if (left * 2 === total) return true;
    }
    return false;
};`,
    java: `class Solution {
    public boolean canBalance(int[] flows) {
        long total = 0;
        for (int x : flows) total += x;
        long left = 0;
        if (left * 2 == total) return true;
        for (int x : flows) {
            left += x;
            if (left * 2 == total) return true;
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canBalance(vector<int>& flows) {
        long long total = 0;
        for (int x : flows) total += x;
        long long left = 0;
        if (left * 2 == total) return true;
        for (int x : flows) {
            left += x;
            if (left * 2 == total) return true;
        }
        return false;
    }
};`,
  },

  // trappedWater(heights: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b41-trapped-basins': {
    javascript: `var trappedWater = function(heights) {
    if (!heights || heights.length === 0) return 0;
    let left = 0, right = heights.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (left < right) {
        if (heights[left] < heights[right]) {
            if (heights[left] >= leftMax) leftMax = heights[left];
            else total += leftMax - heights[left];
            left++;
        } else {
            if (heights[right] >= rightMax) rightMax = heights[right];
            else total += rightMax - heights[right];
            right--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trappedWater(int[] heights) {
        if (heights.length == 0) return 0;
        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] < heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else total += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else total += rightMax - heights[right];
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
    int trappedWater(vector<int>& heights) {
        if (heights.empty()) return 0;
        int left = 0, right = heights.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] < heights[right]) {
                if (heights[left] >= leftMax) leftMax = heights[left];
                else total += leftMax - heights[left];
                left++;
            } else {
                if (heights[right] >= rightMax) rightMax = heights[right];
                else total += rightMax - heights[right];
                right--;
            }
        }
        return total;
    }
};`,
  },

  // treeTilt(values: List[int]) -> int  — complete-binary-tree, -1 marks absent node.
  'pghub-b41-tree-tilt': {
    javascript: `var treeTilt = function(values) {
    const n = values.length;
    let total = 0;
    const subtreeSum = (i) => {
        if (i >= n || values[i] === -1) return 0;
        const left = subtreeSum(2 * i + 1);
        const right = subtreeSum(2 * i + 2);
        total += Math.abs(left - right);
        return values[i] + left + right;
    };
    subtreeSum(0);
    return total;
};`,
    java: `class Solution {
    private int total = 0;
    public int treeTilt(int[] values) {
        subtreeSum(values, 0);
        return total;
    }
    private int subtreeSum(int[] values, int i) {
        if (i >= values.length || values[i] == -1) return 0;
        int left = subtreeSum(values, 2 * i + 1);
        int right = subtreeSum(values, 2 * i + 2);
        total += Math.abs(left - right);
        return values[i] + left + right;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int treeTilt(vector<int>& values) {
        int n = values.size();
        int total = 0;
        function<int(int)> subtreeSum = [&](int i) -> int {
            if (i >= n || values[i] == -1) return 0;
            int left = subtreeSum(2 * i + 1);
            int right = subtreeSum(2 * i + 2);
            total += abs(left - right);
            return values[i] + left + right;
        };
        subtreeSum(0);
        return total;
    }
};`,
  },

  // shiftVowels(s: str) -> str  — rotate each vowel to the next (u -> a).
  'pghub-b41-vowel-shift': {
    javascript: `var shiftVowels = function(s) {
    const nxt = {a: 'e', e: 'i', i: 'o', o: 'u', u: 'a'};
    let res = '';
    for (const ch of s) res += (nxt[ch] || ch);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public String shiftVowels(String s) {
        Map<Character, Character> nxt = new HashMap<>();
        nxt.put('a', 'e'); nxt.put('e', 'i'); nxt.put('i', 'o');
        nxt.put('o', 'u'); nxt.put('u', 'a');
        StringBuilder sb = new StringBuilder();
        for (char ch : s.toCharArray()) sb.append(nxt.getOrDefault(ch, ch));
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftVowels(string s) {
        unordered_map<char, char> nxt = {{'a','e'},{'e','i'},{'i','o'},{'o','u'},{'u','a'}};
        string res;
        for (char ch : s) {
            auto it = nxt.find(ch);
            res += (it != nxt.end()) ? it->second : ch;
        }
        return res;
    }
};`,
  },

  // transformSteps(start: str, end: str, words: List[str]) -> int  — BFS word ladder.
  'pghub-b41-word-ladder-len': {
    javascript: `var transformSteps = function(start, end, words) {
    if (start === end) return 0;
    const wordSet = new Set(words);
    if (!wordSet.has(end)) return -1;
    const queue = [[start, 0]];
    const visited = new Set([start]);
    let qi = 0;
    while (qi < queue.length) {
        const [word, steps] = queue[qi++];
        if (word === end) return steps;
        for (let i = 0; i < word.length; i++) {
            for (let c = 97; c < 123; c++) {
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
    return -1;
};`,
    java: `import java.util.*;
class Solution {
    public int transformSteps(String start, String end, String[] words) {
        if (start.equals(end)) return 0;
        Set<String> wordSet = new HashSet<>(Arrays.asList(words));
        if (!wordSet.contains(end)) return -1;
        Deque<String> queue = new ArrayDeque<>();
        Map<String, Integer> dist = new HashMap<>();
        queue.offer(start);
        dist.put(start, 0);
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
                    if (wordSet.contains(nxt) && !dist.containsKey(nxt)) {
                        dist.put(nxt, steps + 1);
                        queue.offer(nxt);
                    }
                }
                arr[i] = orig;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int transformSteps(string start, string end, vector<string>& words) {
        if (start == end) return 0;
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(end)) return -1;
        queue<pair<string,int>> q;
        unordered_set<string> visited;
        q.push({start, 0});
        visited.insert(start);
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
        return -1;
    }
};`,
  },

  // hasXorPair(nums: List[int], target: int) -> bool  — complement set lookup.
  'pghub-b41-xor-pair-target': {
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

  // balancedSplits(nums: List[int]) -> int  — count prefix==suffix split points.
  'pghub-b43-balanced-split': {
    javascript: `var balancedSplits = function(nums) {
    let total = 0;
    for (const x of nums) total += x;
    let left = 0, count = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        left += nums[i];
        if (left === total - left) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int balancedSplits(int[] nums) {
        long total = 0;
        for (int x : nums) total += x;
        long left = 0;
        int count = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            left += nums[i];
            if (left == total - left) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int balancedSplits(vector<int>& nums) {
        long long total = 0;
        for (int x : nums) total += x;
        long long left = 0;
        int count = 0;
        for (int i = 0; i + 1 < (int)nums.size(); i++) {
            left += nums[i];
            if (left == total - left) count++;
        }
        return count;
    }
};`,
  },

  // elevatorTrips(weights: List[int], capacity: int) -> int  — greedy fill in order.
  'pghub-b43-elevator-trips': {
    javascript: `var elevatorTrips = function(weights, capacity) {
    let trips = 0, cur = 0;
    for (const w of weights) {
        if (cur + w > capacity) { trips++; cur = 0; }
        cur += w;
    }
    if (cur > 0) trips++;
    return trips;
};`,
    java: `class Solution {
    public int elevatorTrips(int[] weights, int capacity) {
        int trips = 0, cur = 0;
        for (int w : weights) {
            if (cur + w > capacity) { trips++; cur = 0; }
            cur += w;
        }
        if (cur > 0) trips++;
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int elevatorTrips(vector<int>& weights, int capacity) {
        int trips = 0, cur = 0;
        for (int w : weights) {
            if (cur + w > capacity) { trips++; cur = 0; }
            cur += w;
        }
        if (cur > 0) trips++;
        return trips;
    }
};`,
  },

  // countPlots(grid: List[List[int]]) -> int  — iterative DFS flood fill.
  'pghub-b43-island-count': {
    javascript: `var countPlots = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let count = 0;
    for (let sr = 0; sr < rows; sr++) {
        for (let sc = 0; sc < cols; sc++) {
            if (grid[sr][sc] === 1 && !seen[sr][sc]) {
                count++;
                const stack = [[sr, sc]];
                seen[sr][sc] = true;
                while (stack.length) {
                    const [r, c] = stack.pop();
                    for (const [dr, dc] of dirs) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1 && !seen[nr][nc]) {
                            seen[nr][nc] = true;
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPlots(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{sr, sc});
                    seen[sr][sc] = true;
                    while (!stack.isEmpty()) {
                        int[] cur = stack.pop();
                        for (int[] d : dirs) {
                            int nr = cur[0] + d[0], nc = cur[1] + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push(new int[]{nr, nc});
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
    int countPlots(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        int count = 0;
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                if (grid[sr][sc] == 1 && !seen[sr][sc]) {
                    count++;
                    vector<pair<int,int>> stack = {{sr, sc}};
                    seen[sr][sc] = true;
                    while (!stack.empty()) {
                        auto [r, c] = stack.back(); stack.pop_back();
                        for (auto& d : dirs) {
                            int nr = r + d[0], nc = c + d[1];
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1 && !seen[nr][nc]) {
                                seen[nr][nc] = true;
                                stack.push_back({nr, nc});
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

  // maxOverlap(meetings: List[List[int]]) -> int  — sweep line, end before start on tie.
  'pghub-b43-meeting-overlap': {
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
        List<int[]> events = new ArrayList<>();
        for (int[] m : meetings) {
            events.add(new int[]{m[0], 1});
            events.add(new int[]{m[1], -1});
        }
        events.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
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

  // minPlatforms(trains: List[List[int]]) -> int  — sort by arrival, min-heap of departures.
  'pghub-b43-min-platforms': {
    javascript: `var minPlatforms = function(trains) {
    const order = trains.slice().sort((a, b) => a[0] - b[0]);
    // binary min-heap of departure times
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[i] < heap[p]) { [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
            else break;
        }
    };
    const down = (i) => {
        const n = heap.length;
        for (;;) {
            let l = 2 * i + 1, r = 2 * i + 2, s = i;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]]; i = s;
        }
    };
    const push = (x) => { heap.push(x); up(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; down(0); }
        return top;
    };
    let best = 0;
    for (const [arr, dep] of order) {
        while (heap.length && heap[0] < arr) pop();
        push(dep);
        if (heap.length > best) best = heap.length;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minPlatforms(int[][] trains) {
        int[][] order = trains.clone();
        Arrays.sort(order, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> busy = new PriorityQueue<>();
        int best = 0;
        for (int[] t : order) {
            int arr = t[0], dep = t[1];
            while (!busy.isEmpty() && busy.peek() < arr) busy.poll();
            busy.offer(dep);
            if (busy.size() > best) best = busy.size();
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPlatforms(vector<vector<int>>& trains) {
        vector<vector<int>> order = trains;
        sort(order.begin(), order.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> busy;
        int best = 0;
        for (auto& t : order) {
            int arr = t[0], dep = t[1];
            while (!busy.empty() && busy.top() < arr) busy.pop();
            busy.push(dep);
            if ((int)busy.size() > best) best = busy.size();
        }
        return best;
    }
};`,
  },

  // smallestPrimeGap(lo: int, hi: int) -> int  — sieve, min consecutive prime gap.
  'pghub-b43-prime-gap': {
    javascript: `var smallestPrimeGap = function(lo, hi) {
    const sieve = new Array(hi + 1).fill(true);
    sieve[0] = false;
    if (hi >= 1) sieve[1] = false;
    for (let p = 2; p * p <= hi; p++) {
        if (sieve[p]) {
            for (let m = p * p; m <= hi; m += p) sieve[m] = false;
        }
    }
    const primes = [];
    for (let x = lo; x <= hi; x++) if (sieve[x]) primes.push(x);
    if (primes.length < 2) return -1;
    let best = Infinity;
    for (let i = 0; i < primes.length - 1; i++) {
        best = Math.min(best, primes[i + 1] - primes[i]);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int smallestPrimeGap(int lo, int hi) {
        boolean[] sieve = new boolean[hi + 1];
        Arrays.fill(sieve, true);
        sieve[0] = false;
        if (hi >= 1) sieve[1] = false;
        for (int p = 2; (long) p * p <= hi; p++) {
            if (sieve[p]) {
                for (int m = p * p; m <= hi; m += p) sieve[m] = false;
            }
        }
        List<Integer> primes = new ArrayList<>();
        for (int x = lo; x <= hi; x++) if (sieve[x]) primes.add(x);
        if (primes.size() < 2) return -1;
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < primes.size() - 1; i++) {
            best = Math.min(best, primes.get(i + 1) - primes.get(i));
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int smallestPrimeGap(int lo, int hi) {
        vector<bool> sieve(hi + 1, true);
        sieve[0] = false;
        if (hi >= 1) sieve[1] = false;
        for (long long p = 2; p * p <= hi; p++) {
            if (sieve[p]) {
                for (long long m = p * p; m <= hi; m += p) sieve[m] = false;
            }
        }
        vector<int> primes;
        for (int x = lo; x <= hi; x++) if (sieve[x]) primes.push_back(x);
        if (primes.size() < 2) return -1;
        int best = INT_MAX;
        for (int i = 0; i + 1 < (int)primes.size(); i++) {
            best = min(best, primes[i + 1] - primes[i]);
        }
        return best;
    }
};`,
  },

  // findInRotated(nums: List[int], target: int) -> int  — binary search in rotated array.
  'pghub-b43-rotate-search': {
    javascript: `var findInRotated = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] === target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
};`,
    java: `class Solution {
    public int findInRotated(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findInRotated(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
};`,
  },

  // longestTrail(grid: List[List[int]]) -> int  — DFS + memo longest increasing path.
  'pghub-b43-snake-path': {
    javascript: `var longestTrail = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    const memo = Array.from({length: rows}, () => new Array(cols).fill(0));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const dfs = (r, c) => {
        if (memo[r][c]) return memo[r][c];
        let best = 1;
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] > grid[r][c]) {
                best = Math.max(best, 1 + dfs(nr, nc));
            }
        }
        memo[r][c] = best;
        return best;
    };
    let ans = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            ans = Math.max(ans, dfs(r, c));
    return ans;
};`,
    java: `class Solution {
    private int rows, cols;
    private int[][] memo;
    private static final int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};
    public int longestTrail(int[][] grid) {
        rows = grid.length; cols = grid[0].length;
        memo = new int[rows][cols];
        int ans = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                ans = Math.max(ans, dfs(grid, r, c));
        return ans;
    }
    private int dfs(int[][] grid, int r, int c) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] > grid[r][c]) {
                best = Math.max(best, 1 + dfs(grid, nr, nc));
            }
        }
        memo[r][c] = best;
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestTrail(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<vector<int>> memo(rows, vector<int>(cols, 0));
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        function<int(int,int)> dfs = [&](int r, int c) -> int {
            if (memo[r][c]) return memo[r][c];
            int best = 1;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] > grid[r][c]) {
                    best = max(best, 1 + dfs(nr, nc));
                }
            }
            memo[r][c] = best;
            return best;
        };
        int ans = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                ans = max(ans, dfs(r, c));
        return ans;
    }
};`,
  },

  // stampWays(stamps: List[int], amount: int) -> int  — unbounded coin-change count.
  'pghub-b43-stamp-ways': {
    javascript: `var stampWays = function(stamps, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const s of stamps) {
        for (let a = s; a <= amount; a++) {
            dp[a] += dp[a - s];
        }
    }
    return dp[amount];
};`,
    java: `class Solution {
    public int stampWays(int[] stamps, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int s : stamps) {
            for (int a = s; a <= amount; a++) {
                dp[a] += dp[a - s];
            }
        }
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int stampWays(vector<int>& stamps, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int s : stamps) {
            for (int a = s; a <= amount; a++) {
                dp[a] += dp[a - s];
            }
        }
        return (int) dp[amount];
    }
};`,
  },
};
