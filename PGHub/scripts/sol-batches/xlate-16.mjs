// xlate-16.mjs — JS/Java/C++ translations of verified Python solutions.
// Slice [450,480) of pyReal && missingLangs>0 targets (sorted by id asc).
// Each language matches generateTemplate(...) signature exactly. Algorithms
// are faithful ports of the stored solutions.python.code. Graded by Judge0
// in backfill-solutions.mjs; only passing langs are written.

export default {
  // litCount(n: int, toggles: List[int]) -> int — divisor-multiple flip sieve.
  'pghub-b40-toggle-switches': {
    javascript: `var litCount = function(n, toggles) {
    const flips = new Array(n + 1).fill(0);
    for (const d of toggles) {
        for (let x = d; x <= n; x += d) flips[x] ^= 1;
    }
    let sum = 0;
    for (let i = 1; i <= n; i++) sum += flips[i];
    return sum;
};`,
    java: `class Solution {
    public int litCount(int n, int[] toggles) {
        int[] flips = new int[n + 1];
        for (int d : toggles)
            for (int x = d; x <= n; x += d) flips[x] ^= 1;
        int sum = 0;
        for (int i = 1; i <= n; i++) sum += flips[i];
        return sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int litCount(int n, vector<int>& toggles) {
        vector<int> flips(n + 1, 0);
        for (int d : toggles)
            for (int x = d; x <= n; x += d) flips[x] ^= 1;
        int sum = 0;
        for (int i = 1; i <= n; i++) sum += flips[i];
        return sum;
    }
};`,
  },

  // deepestLeafSum(values: List[int]) -> int — complete-array tree, -1 = absent.
  'pghub-b40-tree-leaf-depths': {
    javascript: `var deepestLeafSum = function(values) {
    const n = values.length;
    let bestDepth = -1, bestSum = 0;
    for (let i = 0; i < n; i++) {
        if (values[i] === -1) continue;
        let depth = 0, j = i;
        while (j > 0) { j = Math.floor((j - 1) / 2); depth++; }
        if (depth > bestDepth) { bestDepth = depth; bestSum = values[i]; }
        else if (depth === bestDepth) bestSum += values[i];
    }
    return bestSum;
};`,
    java: `class Solution {
    public int deepestLeafSum(int[] values) {
        int n = values.length, bestDepth = -1, bestSum = 0;
        for (int i = 0; i < n; i++) {
            if (values[i] == -1) continue;
            int depth = 0, j = i;
            while (j > 0) { j = (j - 1) / 2; depth++; }
            if (depth > bestDepth) { bestDepth = depth; bestSum = values[i]; }
            else if (depth == bestDepth) bestSum += values[i];
        }
        return bestSum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int deepestLeafSum(vector<int>& values) {
        int n = values.size(), bestDepth = -1, bestSum = 0;
        for (int i = 0; i < n; i++) {
            if (values[i] == -1) continue;
            int depth = 0, j = i;
            while (j > 0) { j = (j - 1) / 2; depth++; }
            if (depth > bestDepth) { bestDepth = depth; bestSum = values[i]; }
            else if (depth == bestDepth) bestSum += values[i];
        }
        return bestSum;
    }
};`,
  },

  // maxFulfilled(stock: List[int], trucks: int) -> int — max-heap, double the top.
  'pghub-b40-warehouse-restock': {
    javascript: `var maxFulfilled = function(stock, trucks) {
    // max-heap via negation in a binary heap of negatives
    const heap = stock.map(x => -x);
    const heapify = () => { for (let i = (heap.length >> 1) - 1; i >= 0; i--) siftDown(i); };
    const siftDown = (i) => {
        const n = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]];
            i = s;
        }
    };
    const siftUp = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[i], heap[p]] = [heap[p], heap[i]];
            i = p;
        }
    };
    heapify();
    for (let t = 0; t < trucks; t++) {
        const top = -heap[0];
        heap[0] = -(top * 2);
        siftDown(0);
    }
    let sum = 0;
    for (const v of heap) sum += v;
    return -sum;
};`,
    java: `import java.util.*;
class Solution {
    public int maxFulfilled(int[] stock, int trucks) {
        PriorityQueue<Long> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int x : stock) heap.add((long) x);
        for (int t = 0; t < trucks; t++) {
            long top = heap.poll();
            heap.add(top * 2);
        }
        long sum = 0;
        for (long v : heap) sum += v;
        return (int) sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxFulfilled(vector<int>& stock, int trucks) {
        priority_queue<long long> heap;
        for (int x : stock) heap.push(x);
        for (int t = 0; t < trucks; t++) {
            long long top = heap.top(); heap.pop();
            heap.push(top * 2);
        }
        long long sum = 0;
        while (!heap.empty()) { sum += heap.top(); heap.pop(); }
        return (int) sum;
    }
};`,
  },

  // minPours(tanks: List[int]) -> int — count tanks differing from integer mean.
  'pghub-b40-water-tanks': {
    javascript: `var minPours = function(tanks) {
    let total = 0;
    for (const t of tanks) total += t;
    const avg = Math.floor(total / tanks.length);
    let cnt = 0;
    for (const t of tanks) if (t !== avg) cnt++;
    return cnt;
};`,
    java: `class Solution {
    public int minPours(int[] tanks) {
        long total = 0;
        for (int t : tanks) total += t;
        long avg = Math.floorDiv(total, tanks.length);
        int cnt = 0;
        for (int t : tanks) if (t != avg) cnt++;
        return cnt;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minPours(vector<int>& tanks) {
        long long total = 0;
        for (int t : tanks) total += t;
        long long avg = total / (long long) tanks.size();
        int cnt = 0;
        for (int t : tanks) if (t != avg) cnt++;
        return cnt;
    }
};`,
  },

  // kthPairSum(a: List[int], b: List[int], k: int) -> int — k-smallest pair sums.
  'pghub-b9-kth-pair-sum-1950': {
    javascript: `var kthPairSum = function(a, b, k) {
    a = a.slice().sort((x, y) => x - y);
    b = b.slice().sort((x, y) => x - y);
    // min-heap of [sum, i, j]
    const heap = [];
    const less = (x, y) => x[0] < y[0];
    const siftUp = (n) => {
        while (n > 0) {
            const p = (n - 1) >> 1;
            if (less(heap[n], heap[p])) { [heap[n], heap[p]] = [heap[p], heap[n]]; n = p; }
            else break;
        }
    };
    const siftDown = (n) => {
        const len = heap.length;
        while (true) {
            let s = n, l = 2 * n + 1, r = 2 * n + 2;
            if (l < len && less(heap[l], heap[s])) s = l;
            if (r < len && less(heap[r], heap[s])) s = r;
            if (s === n) break;
            [heap[n], heap[s]] = [heap[s], heap[n]];
            n = s;
        }
    };
    const push = (v) => { heap.push(v); siftUp(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) { heap[0] = last; siftDown(0); }
        return top;
    };
    for (let i = 0; i < a.length; i++) push([a[i] + b[0], i, 0]);
    let result = 0;
    for (let t = 0; t < k; t++) {
        const [s, i, j] = pop();
        result = s;
        if (j + 1 < b.length) push([a[i] + b[j + 1], i, j + 1]);
    }
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public int kthPairSum(int[] a, int[] b, int k) {
        a = a.clone(); b = b.clone();
        Arrays.sort(a); Arrays.sort(b);
        // [sum, i, j]
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) -> Integer.compare(x[0], y[0]));
        for (int i = 0; i < a.length; i++) heap.add(new int[]{a[i] + b[0], i, 0});
        int result = 0;
        for (int t = 0; t < k; t++) {
            int[] cur = heap.poll();
            result = cur[0];
            int i = cur[1], j = cur[2];
            if (j + 1 < b.length) heap.add(new int[]{a[i] + b[j + 1], i, j + 1});
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthPairSum(vector<int>& a, vector<int>& b, int k) {
        vector<int> sa = a, sb = b;
        sort(sa.begin(), sa.end());
        sort(sb.begin(), sb.end());
        // min-heap of (sum, i, j)
        priority_queue<array<int,3>, vector<array<int,3>>, greater<array<int,3>>> heap;
        for (int i = 0; i < (int)sa.size(); i++) heap.push({sa[i] + sb[0], i, 0});
        int result = 0;
        for (int t = 0; t < k; t++) {
            auto cur = heap.top(); heap.pop();
            result = cur[0];
            int i = cur[1], j = cur[2];
            if (j + 1 < (int)sb.size()) heap.push({sa[i] + sb[j + 1], i, j + 1});
        }
        return result;
    }
};`,
  },

  // balanceIndex(nums: List[int]) -> int — pivot index (left sum == right sum).
  'pghub-balance-point': {
    javascript: `var balanceIndex = function(nums) {
    let total = 0;
    for (const x of nums) total += x;
    let left = 0;
    for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) return i;
        left += nums[i];
    }
    return -1;
};`,
    java: `class Solution {
    public int balanceIndex(int[] nums) {
        long total = 0;
        for (int x : nums) total += x;
        long left = 0;
        for (int i = 0; i < nums.length; i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int balanceIndex(vector<int>& nums) {
        long long total = 0;
        for (int x : nums) total += x;
        long long left = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            if (left == total - left - nums[i]) return i;
            left += nums[i];
        }
        return -1;
    }
};`,
  },

  // isBalanced(s: str) -> bool — multi-type bracket stack.
  'pghub-balanced-brackets-types': {
    javascript: `var isBalanced = function(s) {
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else if (ch === ')' || ch === ']' || ch === '}') {
            if (stack.length === 0 || stack[stack.length - 1] !== pairs[ch]) return false;
            stack.pop();
        }
    }
    return stack.length === 0;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isBalanced(String s) {
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '('); pairs.put(']', '['); pairs.put('}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);
            else if (ch == ')' || ch == ']' || ch == '}') {
                if (stack.isEmpty() || stack.peek() != pairs.get(ch)) return false;
                stack.pop();
            }
        }
        return stack.isEmpty();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string s) {
        unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};
        vector<char> stack;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push_back(ch);
            else if (ch == ')' || ch == ']' || ch == '}') {
                if (stack.empty() || stack.back() != pairs[ch]) return false;
                stack.pop_back();
            }
        }
        return stack.empty();
    }
};`,
  },

  // isBalanced(s: str) -> bool — same multi-bracket stack.
  'pghub-balanced-multibracket-758': {
    javascript: `var isBalanced = function(s) {
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const ch of s) {
        if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else if (ch === ')' || ch === ']' || ch === '}') {
            if (stack.length === 0 || stack[stack.length - 1] !== pairs[ch]) return false;
            stack.pop();
        }
    }
    return stack.length === 0;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isBalanced(String s) {
        Map<Character, Character> pairs = new HashMap<>();
        pairs.put(')', '('); pairs.put(']', '['); pairs.put('}', '{');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);
            else if (ch == ')' || ch == ']' || ch == '}') {
                if (stack.isEmpty() || stack.peek() != pairs.get(ch)) return false;
                stack.pop();
            }
        }
        return stack.isEmpty();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBalanced(string s) {
        unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};
        vector<char> stack;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') stack.push_back(ch);
            else if (ch == ')' || ch == ']' || ch == '}') {
                if (stack.empty() || stack.back() != pairs[ch]) return false;
                stack.pop_back();
            }
        }
        return stack.empty();
    }
};`,
  },

  // compress(s: str) -> str — run-length: runs >= 3 become char+count, else literal.
  'pghub-band-compression': {
    javascript: `var compress = function(s) {
    let out = '';
    let i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        const run = j - i;
        if (run >= 3) out += s[i] + String(run);
        else out += s[i].repeat(run);
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
            int run = j - i;
            if (run >= 3) out.append(s.charAt(i)).append(run);
            else for (int t = 0; t < run; t++) out.append(s.charAt(i));
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
            int run = j - i;
            if (run >= 3) { out += s[i]; out += to_string(run); }
            else out += string(run, s[i]);
            i = j;
        }
        return out;
    }
};`,
  },

  // widestGap(n: int) -> int — widest run of zeros between two 1-bits.
  'pghub-binary-gap': {
    javascript: `var widestGap = function(n) {
    const bits = n.toString(2);
    let best = 0, cur = -1;
    for (const b of bits) {
        if (b === '1') {
            if (cur >= 0 && cur > best) best = cur;
            cur = 0;
        } else if (cur >= 0) {
            cur += 1;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int widestGap(int n) {
        String bits = Integer.toBinaryString(n);
        int best = 0, cur = -1;
        for (char b : bits.toCharArray()) {
            if (b == '1') {
                if (cur >= 0 && cur > best) best = cur;
                cur = 0;
            } else if (cur >= 0) {
                cur += 1;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int widestGap(int n) {
        string bits = n == 0 ? "0" : "";
        unsigned int u = (unsigned int) n;
        if (u != 0) { while (u) { bits = char('0' + (u & 1)) + bits; u >>= 1; } }
        int best = 0, cur = -1;
        for (char b : bits) {
            if (b == '1') {
                if (cur >= 0 && cur > best) best = cur;
                cur = 0;
            } else if (cur >= 0) {
                cur += 1;
            }
        }
        return best;
    }
};`,
  },

  // maxDepth(s: str) -> int — max parenthesis nesting depth.
  'pghub-bracket-depth': {
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

  // depthScore(s: str) -> int — recursive bracket scoring (max(2*inner,1)).
  'pghub-bracket-depth-score': {
    javascript: `var depthScore = function(s) {
    const stack = [0];
    for (const ch of s) {
        if (ch === '(') stack.push(0);
        else {
            const top = stack.pop();
            stack[stack.length - 1] += Math.max(2 * top, 1);
        }
    }
    return stack[0];
};`,
    java: `import java.util.*;
class Solution {
    public int depthScore(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(0);
            else {
                int top = stack.pop();
                int cur = stack.pop();
                stack.push(cur + Math.max(2 * top, 1));
            }
        }
        return stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int depthScore(string s) {
        vector<int> stack = {0};
        for (char ch : s) {
            if (ch == '(') stack.push_back(0);
            else {
                int top = stack.back(); stack.pop_back();
                stack.back() += max(2 * top, 1);
            }
        }
        return stack[0];
    }
};`,
  },

  // depthScore(s: str) -> int — same recursive scoring.
  'pghub-bracket-depth-score-b8': {
    javascript: `var depthScore = function(s) {
    const stack = [0];
    for (const ch of s) {
        if (ch === '(') stack.push(0);
        else {
            const v = stack.pop();
            stack[stack.length - 1] += Math.max(2 * v, 1);
        }
    }
    return stack[0];
};`,
    java: `import java.util.*;
class Solution {
    public int depthScore(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(0);
            else {
                int v = stack.pop();
                int cur = stack.pop();
                stack.push(cur + Math.max(2 * v, 1));
            }
        }
        return stack.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int depthScore(string s) {
        vector<int> stack = {0};
        for (char ch : s) {
            if (ch == '(') stack.push_back(0);
            else {
                int v = stack.back(); stack.pop_back();
                stack.back() += max(2 * v, 1);
            }
        }
        return stack[0];
    }
};`,
  },

  // maxValue(costs: List[int], values: List[int], budget: int) -> int — 0/1 knapsack.
  'pghub-budget-knapsack-items': {
    javascript: `var maxValue = function(costs, values, budget) {
    const dp = new Array(budget + 1).fill(0);
    for (let k = 0; k < costs.length; k++) {
        const c = costs[k], v = values[k];
        for (let b = budget; b >= c; b--) {
            const cand = dp[b - c] + v;
            if (cand > dp[b]) dp[b] = cand;
        }
    }
    return dp[budget];
};`,
    java: `class Solution {
    public int maxValue(int[] costs, int[] values, int budget) {
        int[] dp = new int[budget + 1];
        for (int k = 0; k < costs.length; k++) {
            int c = costs[k], v = values[k];
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + v;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return dp[budget];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxValue(vector<int>& costs, vector<int>& values, int budget) {
        vector<int> dp(budget + 1, 0);
        for (size_t k = 0; k < costs.size(); k++) {
            int c = costs[k], v = values[k];
            for (int b = budget; b >= c; b--) {
                int cand = dp[b - c] + v;
                if (cand > dp[b]) dp[b] = cand;
            }
        }
        return dp[budget];
    }
};`,
  },

  // longestRun(costs: List[int], budget: int) -> int — longest subarray sum <= budget.
  'pghub-budget-subarray': {
    javascript: `var longestRun = function(costs, budget) {
    let left = 0, cur = 0, best = 0;
    for (let right = 0; right < costs.length; right++) {
        cur += costs[right];
        while (cur > budget) { cur -= costs[left]; left++; }
        if (right - left + 1 > best) best = right - left + 1;
    }
    return best;
};`,
    java: `class Solution {
    public int longestRun(int[] costs, int budget) {
        int left = 0, best = 0;
        long cur = 0;
        for (int right = 0; right < costs.length; right++) {
            cur += costs[right];
            while (cur > budget) { cur -= costs[left]; left++; }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRun(vector<int>& costs, int budget) {
        int left = 0, best = 0;
        long long cur = 0;
        for (int right = 0; right < (int)costs.size(); right++) {
            cur += costs[right];
            while (cur > budget) { cur -= costs[left]; left++; }
            if (right - left + 1 > best) best = right - left + 1;
        }
        return best;
    }
};`,
  },

  // countWays(coins: List[int], amount: int) -> int — unbounded combination count.
  'pghub-coin-change-ways': {
    javascript: `var countWays = function(coins, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const coin of coins)
        for (let a = coin; a <= amount; a++)
            dp[a] += dp[a - coin];
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] coins, int amount) {
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
    int countWays(vector<int>& coins, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int coin : coins)
            for (int a = coin; a <= amount; a++)
                dp[a] += dp[a - coin];
        return (int) dp[amount];
    }
};`,
  },

  // firstPlayerWins(piles: List[int]) -> bool — Nim XOR.
  'pghub-coin-pile-parity-game': {
    javascript: `var firstPlayerWins = function(piles) {
    let x = 0;
    for (const p of piles) x ^= p;
    return x !== 0;
};`,
    java: `class Solution {
    public boolean firstPlayerWins(int[] piles) {
        int x = 0;
        for (int p : piles) x ^= p;
        return x != 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool firstPlayerWins(vector<int>& piles) {
        int x = 0;
        for (int p : piles) x ^= p;
        return x != 0;
    }
};`,
  },

  // canMake(coins: List[int], target: int) -> bool — reachable-sum DP.
  'pghub-coin-reach': {
    javascript: `var canMake = function(coins, target) {
    const reachable = new Array(target + 1).fill(false);
    reachable[0] = true;
    for (let amt = 1; amt <= target; amt++) {
        for (const c of coins) {
            if (c <= amt && reachable[amt - c]) { reachable[amt] = true; break; }
        }
    }
    return reachable[target];
};`,
    java: `class Solution {
    public boolean canMake(int[] coins, int target) {
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;
        for (int amt = 1; amt <= target; amt++) {
            for (int c : coins) {
                if (c <= amt && reachable[amt - c]) { reachable[amt] = true; break; }
            }
        }
        return reachable[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canMake(vector<int>& coins, int target) {
        vector<char> reachable(target + 1, false);
        reachable[0] = true;
        for (int amt = 1; amt <= target; amt++) {
            for (int c : coins) {
                if (c <= amt && reachable[amt - c]) { reachable[amt] = true; break; }
            }
        }
        return reachable[target];
    }
};`,
  },

  // countWays(denoms: List[int], amount: int) -> int — unbounded combination count.
  'pghub-coin-rolls': {
    javascript: `var countWays = function(denoms, amount) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const c of denoms)
        for (let a = c; a <= amount; a++)
            dp[a] += dp[a - c];
    return dp[amount];
};`,
    java: `class Solution {
    public int countWays(int[] denoms, int amount) {
        long[] dp = new long[amount + 1];
        dp[0] = 1;
        for (int c : denoms)
            for (int a = c; a <= amount; a++)
                dp[a] += dp[a - c];
        return (int) dp[amount];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(vector<int>& denoms, int amount) {
        vector<long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : denoms)
            for (int a = c; a <= amount; a++)
                dp[a] += dp[a - c];
        return (int) dp[amount];
    }
};`,
  },

  // minRepaint(s: str, k: int) -> int — min repaints in any window of size k.
  'pghub-color-blocks': {
    javascript: `var minRepaint = function(s, k) {
    let ans = k;
    for (let i = k - 1; i < s.length; i++) {
        const window = s.slice(i - k + 1, i + 1);
        const wc = {};
        let m = 0;
        for (const c of window) {
            wc[c] = (wc[c] || 0) + 1;
            if (wc[c] > m) m = wc[c];
        }
        ans = Math.min(ans, k - m);
    }
    return ans;
};`,
    java: `import java.util.*;
class Solution {
    public int minRepaint(String s, int k) {
        int ans = k;
        for (int i = k - 1; i < s.length(); i++) {
            Map<Character, Integer> wc = new HashMap<>();
            int m = 0;
            for (int t = i - k + 1; t <= i; t++) {
                char c = s.charAt(t);
                int v = wc.getOrDefault(c, 0) + 1;
                wc.put(c, v);
                if (v > m) m = v;
            }
            ans = Math.min(ans, k - m);
        }
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRepaint(string s, int k) {
        int ans = k;
        for (int i = k - 1; i < (int)s.size(); i++) {
            unordered_map<char, int> wc;
            int m = 0;
            for (int t = i - k + 1; t <= i; t++) {
                int v = ++wc[s[t]];
                if (v > m) m = v;
            }
            ans = min(ans, k - m);
        }
        return ans;
    }
};`,
  },

  // compressRuns(colors: List[int]) -> List[List[int]] — run-length [value, count].
  'pghub-compress-color-runs': {
    javascript: `var compressRuns = function(colors) {
    const out = [];
    let i = 0;
    const n = colors.length;
    while (i < n) {
        let j = i;
        while (j < n && colors[j] === colors[i]) j++;
        out.push([colors[i], j - i]);
        i = j;
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] compressRuns(int[] colors) {
        List<int[]> out = new ArrayList<>();
        int i = 0, n = colors.length;
        while (i < n) {
            int j = i;
            while (j < n && colors[j] == colors[i]) j++;
            out.add(new int[]{colors[i], j - i});
            i = j;
        }
        return out.toArray(new int[out.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> compressRuns(vector<int>& colors) {
        vector<vector<int>> out;
        int i = 0, n = colors.size();
        while (i < n) {
            int j = i;
            while (j < n && colors[j] == colors[i]) j++;
            out.push_back({colors[i], j - i});
            i = j;
        }
        return out;
    }
};`,
  },

  // longestRun(colors: List[int]) -> int — longest run of equal adjacent values.
  'pghub-conveyor-color-runs': {
    javascript: `var longestRun = function(colors) {
    let best = 1, cur = 1;
    for (let i = 1; i < colors.length; i++) {
        if (colors[i] === colors[i - 1]) cur++;
        else cur = 1;
        if (cur > best) best = cur;
    }
    return best;
};`,
    java: `class Solution {
    public int longestRun(int[] colors) {
        int best = 1, cur = 1;
        for (int i = 1; i < colors.length; i++) {
            if (colors[i] == colors[i - 1]) cur++;
            else cur = 1;
            if (cur > best) best = cur;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestRun(vector<int>& colors) {
        int best = 1, cur = 1;
        for (int i = 1; i < (int)colors.size(); i++) {
            if (colors[i] == colors[i - 1]) cur++;
            else cur = 1;
            if (cur > best) best = cur;
        }
        return best;
    }
};`,
  },

  // countComponents(n: int, edges: List[List[int]]) -> int — union-find.
  'pghub-count-components': {
    javascript: `var countComponents = function(n, edges) {
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    let comps = n;
    for (const [u, v] of edges) {
        const ru = find(u), rv = find(v);
        if (ru !== rv) { parent[ru] = rv; comps--; }
    }
    return comps;
};`,
    java: `class Solution {
    private int[] parent;
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int countComponents(int n, int[][] edges) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int comps = n;
        for (int[] e : edges) {
            int ru = find(e[0]), rv = find(e[1]);
            if (ru != rv) { parent[ru] = rv; comps--; }
        }
        return comps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countComponents(int n, vector<vector<int>>& edges) {
        vector<int> parent(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        function<int(int)> find = [&](int x) {
            while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
            return x;
        };
        int comps = n;
        for (auto& e : edges) {
            int ru = find(e[0]), rv = find(e[1]);
            if (ru != rv) { parent[ru] = rv; comps--; }
        }
        return comps;
    }
};`,
  },

  // cheapestRoute(n, roads: List[List[int]], src, dst) -> int — Dijkstra, -1 if none.
  'pghub-courier-route-cost': {
    javascript: `var cheapestRoute = function(n, roads, src, dst) {
    const graph = Array.from({ length: n }, () => []);
    for (const [u, v, w] of roads) {
        graph[u].push([v, w]);
        graph[v].push([u, w]);
    }
    const INF = Infinity;
    const dist = new Array(n).fill(INF);
    dist[src] = 0;
    // min-heap of [d, node]
    const heap = [[0, src]];
    const siftUp = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[i], heap[p]] = [heap[p], heap[i]]; i = p;
        }
    };
    const siftDown = (i) => {
        const len = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && heap[l][0] < heap[s][0]) s = l;
            if (r < len && heap[r][0] < heap[s][0]) s = r;
            if (s === i) break;
            [heap[i], heap[s]] = [heap[s], heap[i]]; i = s;
        }
    };
    const push = (v) => { heap.push(v); siftUp(heap.length - 1); };
    const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) { heap[0] = last; siftDown(0); }
        return top;
    };
    while (heap.length > 0) {
        const [d, node] = pop();
        if (d > dist[node]) continue;
        if (node === dst) return d;
        for (const [nb, w] of graph[node]) {
            const nd = d + w;
            if (nd < dist[nb]) { dist[nb] = nd; push([nd, nb]); }
        }
    }
    return dist[dst] === INF ? -1 : dist[dst];
};`,
    java: `import java.util.*;
class Solution {
    public int cheapestRoute(int n, int[][] roads, int src, int dst) {
        List<int[]>[] graph = new List[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        for (int[] r : roads) {
            graph[r[0]].add(new int[]{r[1], r[2]});
            graph[r[1]].add(new int[]{r[0], r[2]});
        }
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        pq.add(new long[]{0, src});
        while (!pq.isEmpty()) {
            long[] cur = pq.poll();
            long d = cur[0];
            int node = (int) cur[1];
            if (d > dist[node]) continue;
            if (node == dst) return (int) d;
            for (int[] e : graph[node]) {
                long nd = d + e[1];
                if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
            }
        }
        return dist[dst] == Long.MAX_VALUE ? -1 : (int) dist[dst];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int cheapestRoute(int n, vector<vector<int>>& roads, int src, int dst) {
        vector<vector<pair<int,int>>> graph(n);
        for (auto& r : roads) {
            graph[r[0]].push_back({r[1], r[2]});
            graph[r[1]].push_back({r[0], r[2]});
        }
        const long long INF = LLONG_MAX;
        vector<long long> dist(n, INF);
        dist[src] = 0;
        priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
        pq.push({0, src});
        while (!pq.empty()) {
            auto [d, node] = pq.top(); pq.pop();
            if (d > dist[node]) continue;
            if (node == dst) return (int) d;
            for (auto& [nb, w] : graph[node]) {
                long long nd = d + w;
                if (nd < dist[nb]) { dist[nb] = nd; pq.push({nd, nb}); }
            }
        }
        return dist[dst] == INF ? -1 : (int) dist[dst];
    }
};`,
  },

  // productDepth(n: int) -> int — digit-product multiplicative persistence.
  'pghub-digit-product-depth': {
    javascript: `var productDepth = function(n) {
    let steps = 0;
    while (n >= 10) {
        let prod = 1, x = n;
        while (x > 0) { prod *= x % 10; x = Math.floor(x / 10); }
        n = prod;
        steps++;
    }
    return steps;
};`,
    java: `class Solution {
    public int productDepth(int n) {
        int steps = 0;
        while (n >= 10) {
            long prod = 1;
            int x = n;
            while (x > 0) { prod *= x % 10; x /= 10; }
            n = (int) prod;
            steps++;
        }
        return steps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int productDepth(int n) {
        int steps = 0;
        while (n >= 10) {
            long long prod = 1;
            int x = n;
            while (x > 0) { prod *= x % 10; x /= 10; }
            n = (int) prod;
            steps++;
        }
        return steps;
    }
};`,
  },

  // spiralSum(n: int) -> int — sum of digital roots 1..n.
  'pghub-digit-spiral': {
    javascript: `var spiralSum = function(n) {
    const root = (k) => k === 0 ? 0 : 1 + (k - 1) % 9;
    let sum = 0;
    for (let k = 1; k <= n; k++) sum += root(k);
    return sum;
};`,
    java: `class Solution {
    public int spiralSum(int n) {
        long sum = 0;
        for (int k = 1; k <= n; k++) sum += (k == 0 ? 0 : 1 + (k - 1) % 9);
        return (int) sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int spiralSum(int n) {
        long long sum = 0;
        for (int k = 1; k <= n; k++) sum += (k == 0 ? 0 : 1 + (k - 1) % 9);
        return (int) sum;
    }
};`,
  },

  // digitStaircase(n: int) -> bool — strictly increasing digits.
  'pghub-digit-staircase': {
    javascript: `var digitStaircase = function(n) {
    const s = String(n);
    for (let i = 1; i < s.length; i++) {
        if (s[i] <= s[i - 1]) return false;
    }
    return true;
};`,
    java: `class Solution {
    public boolean digitStaircase(int n) {
        String s = String.valueOf(n);
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) <= s.charAt(i - 1)) return false;
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool digitStaircase(int n) {
        string s = to_string(n);
        for (size_t i = 1; i < s.size(); i++) {
            if (s[i] <= s[i - 1]) return false;
        }
        return true;
    }
};`,
  },

  // echoCount(s: str) -> int — distinct substrings that are a doubled half.
  'pghub-distinct-echo-substrings': {
    javascript: `var echoCount = function(s) {
    const seen = new Set();
    const n = s.length;
    for (let length = 2; length <= n; length += 2) {
        const half = length / 2;
        for (let i = 0; i + length <= n; i++) {
            if (s.slice(i, i + half) === s.slice(i + half, i + length)) {
                seen.add(s.slice(i, i + length));
            }
        }
    }
    return seen.size;
};`,
    java: `import java.util.*;
class Solution {
    public int echoCount(String s) {
        Set<String> seen = new HashSet<>();
        int n = s.length();
        for (int length = 2; length <= n; length += 2) {
            int half = length / 2;
            for (int i = 0; i + length <= n; i++) {
                if (s.substring(i, i + half).equals(s.substring(i + half, i + length))) {
                    seen.add(s.substring(i, i + length));
                }
            }
        }
        return seen.size();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int echoCount(string s) {
        unordered_set<string> seen;
        int n = s.size();
        for (int length = 2; length <= n; length += 2) {
            int half = length / 2;
            for (int i = 0; i + length <= n; i++) {
                if (s.substr(i, half) == s.substr(i + half, half)) {
                    seen.insert(s.substr(i, length));
                }
            }
        }
        return seen.size();
    }
};`,
  },

  // distinctSubseq(s: str, t: str) -> int — count distinct subsequences equal to t.
  'pghub-distinct-subseq-count': {
    javascript: `var distinctSubseq = function(s, t) {
    const m = t.length;
    const dp = new Array(m + 1).fill(0);
    dp[0] = 1;
    for (const ch of s) {
        for (let j = m; j >= 1; j--) {
            if (t[j - 1] === ch) dp[j] += dp[j - 1];
        }
    }
    return dp[m];
};`,
    java: `class Solution {
    public int distinctSubseq(String s, String t) {
        int m = t.length();
        long[] dp = new long[m + 1];
        dp[0] = 1;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            for (int j = m; j >= 1; j--) {
                if (t.charAt(j - 1) == ch) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[m];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctSubseq(string s, string t) {
        int m = t.size();
        vector<long long> dp(m + 1, 0);
        dp[0] = 1;
        for (char ch : s) {
            for (int j = m; j >= 1; j--) {
                if (t[j - 1] == ch) dp[j] += dp[j - 1];
            }
        }
        return (int) dp[m];
    }
};`,
  },

  // distinctCounts(nums: List[int], k: int) -> List[int] — distinct count per window.
  'pghub-distinct-window-count': {
    javascript: `var distinctCounts = function(nums, k) {
    const n = nums.length;
    if (k >= n) return [new Set(nums).size];
    const freq = new Map();
    for (let i = 0; i < k; i++) freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
    const res = [freq.size];
    for (let i = k; i < n; i++) {
        freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
        const out = nums[i - k];
        const nv = freq.get(out) - 1;
        if (nv === 0) freq.delete(out);
        else freq.set(out, nv);
        res.push(freq.size);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] distinctCounts(int[] nums, int k) {
        int n = nums.length;
        if (k >= n) {
            Set<Integer> set = new HashSet<>();
            for (int x : nums) set.add(x);
            return new int[]{set.size()};
        }
        Map<Integer, Integer> freq = new HashMap<>();
        for (int i = 0; i < k; i++) freq.merge(nums[i], 1, Integer::sum);
        List<Integer> res = new ArrayList<>();
        res.add(freq.size());
        for (int i = k; i < n; i++) {
            freq.merge(nums[i], 1, Integer::sum);
            int out = nums[i - k];
            int nv = freq.get(out) - 1;
            if (nv == 0) freq.remove(out);
            else freq.put(out, nv);
            res.add(freq.size());
        }
        int[] arr = new int[res.size()];
        for (int i = 0; i < arr.length; i++) arr[i] = res.get(i);
        return arr;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> distinctCounts(vector<int>& nums, int k) {
        int n = nums.size();
        if (k >= n) {
            unordered_set<int> s(nums.begin(), nums.end());
            return { (int) s.size() };
        }
        unordered_map<int, int> freq;
        for (int i = 0; i < k; i++) freq[nums[i]]++;
        vector<int> res = { (int) freq.size() };
        for (int i = k; i < n; i++) {
            freq[nums[i]]++;
            int out = nums[i - k];
            if (--freq[out] == 0) freq.erase(out);
            res.push_back((int) freq.size());
        }
        return res;
    }
};`,
  },
};
