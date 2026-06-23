// xlate-19.mjs — translations of verified Python solutions to JS/Java/C++.
// Slice [540,570) of pyReal && missingLangs, sorted by id ascending.
// Signatures match generateTemplate(language, method_name, params, return_type).

export default {
  // secondLargest(nums: List[int]) -> int — track top two distinct, -1 if none.
  'pghub-second-largest-distinct': {
    javascript: `var secondLargest = function(nums) {
    let first = null, second = null;
    for (const x of nums) {
        if (first === null || x > first) {
            if (first !== null && first !== x) second = first;
            first = x;
        } else if (x !== first && (second === null || x > second)) {
            second = x;
        }
    }
    return second !== null ? second : -1;
};`,
    java: `class Solution {
    public int secondLargest(int[] nums) {
        Integer first = null, second = null;
        for (int x : nums) {
            if (first == null || x > first) {
                if (first != null && first != x) second = first;
                first = x;
            } else if ((first == null || x != first) && (second == null || x > second)) {
                second = x;
            }
        }
        return second != null ? second : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int secondLargest(vector<int>& nums) {
        bool hasFirst = false, hasSecond = false;
        long long first = 0, second = 0;
        for (int x : nums) {
            if (!hasFirst || x > first) {
                if (hasFirst && first != x) { second = first; hasSecond = true; }
                first = x; hasFirst = true;
            } else if (x != first && (!hasSecond || x > second)) {
                second = x; hasSecond = true;
            }
        }
        return hasSecond ? (int)second : -1;
    }
};`,
  },

  // maxBooks(widths: List[int], shelf: int) -> int — sort, greedily fit by width.
  'pghub-shelf-stacking': {
    javascript: `var maxBooks = function(widths, shelf) {
    const w = widths.slice().sort((a, b) => a - b);
    let used = 0, count = 0;
    for (const x of w) {
        if (used + x <= shelf) { used += x; count++; }
        else break;
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int maxBooks(int[] widths, int shelf) {
        int[] w = widths.clone();
        Arrays.sort(w);
        int used = 0, count = 0;
        for (int x : w) {
            if (used + x <= shelf) { used += x; count++; }
            else break;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxBooks(vector<int>& widths, int shelf) {
        vector<int> w = widths;
        sort(w.begin(), w.end());
        int used = 0, count = 0;
        for (int x : w) {
            if (used + x <= shelf) { used += x; count++; }
            else break;
        }
        return count;
    }
};`,
  },

  // shipCapacity(weights: List[int], days: int) -> int — binary search on capacity.
  'pghub-ship-capacity': {
    javascript: `var shipCapacity = function(weights, days) {
    let lo = Math.max(...weights);
    let hi = weights.reduce((a, b) => a + b, 0);
    const need = (cap) => {
        let d = 1, cur = 0;
        for (const w of weights) {
            if (cur + w > cap) { d++; cur = 0; }
            cur += w;
        }
        return d;
    };
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (need(mid) <= days) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int shipCapacity(int[] weights, int days) {
        int lo = 0;
        long hi = 0;
        for (int w : weights) { lo = Math.max(lo, w); hi += w; }
        long loL = lo;
        while (loL < hi) {
            long mid = (loL + hi) / 2;
            if (need(weights, mid) <= days) hi = mid;
            else loL = mid + 1;
        }
        return (int) loL;
    }
    private int need(int[] weights, long cap) {
        int d = 1;
        long cur = 0;
        for (int w : weights) {
            if (cur + w > cap) { d++; cur = 0; }
            cur += w;
        }
        return d;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shipCapacity(vector<int>& weights, int days) {
        long long lo = *max_element(weights.begin(), weights.end());
        long long hi = accumulate(weights.begin(), weights.end(), 0LL);
        auto need = [&](long long cap) {
            int d = 1; long long cur = 0;
            for (int w : weights) {
                if (cur + w > cap) { d++; cur = 0; }
                cur += w;
            }
            return d;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (need(mid) <= days) hi = mid;
            else lo = mid + 1;
        }
        return (int)lo;
    }
};`,
  },

  // shoutOddWords(s: str) -> str — uppercase words of odd length, space-joined.
  'pghub-shout-odd-words': {
    javascript: `var shoutOddWords = function(s) {
    const words = s.split(" ");
    const out = [];
    for (const w of words) {
        out.push(w.length % 2 === 1 ? w.toUpperCase() : w);
    }
    return out.join(" ");
};`,
    java: `class Solution {
    public String shoutOddWords(String s) {
        String[] words = s.split(" ", -1);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) out.append(" ");
            out.append(words[i].length() % 2 == 1 ? words[i].toUpperCase() : words[i]);
        }
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shoutOddWords(string s) {
        vector<string> words;
        string cur;
        size_t start = 0;
        while (true) {
            size_t pos = s.find(' ', start);
            if (pos == string::npos) { words.push_back(s.substr(start)); break; }
            words.push_back(s.substr(start, pos - start));
            start = pos + 1;
        }
        string out;
        for (size_t i = 0; i < words.size(); i++) {
            if (i) out += " ";
            string w = words[i];
            if (w.size() % 2 == 1)
                for (char& c : w) c = toupper((unsigned char)c);
            out += w;
        }
        return out;
    }
};`,
  },

  // longestStable(signal: List[int], tol: int) -> int — monotonic-deque window.
  'pghub-signal-decay': {
    javascript: `var longestStable = function(signal, tol) {
    const maxd = [], mind = []; // store indices
    let left = 0, best = 0;
    for (let right = 0; right < signal.length; right++) {
        const v = signal[right];
        while (maxd.length && signal[maxd[maxd.length - 1]] <= v) maxd.pop();
        maxd.push(right);
        while (mind.length && signal[mind[mind.length - 1]] >= v) mind.pop();
        mind.push(right);
        while (signal[maxd[0]] - signal[mind[0]] > tol) {
            left++;
            if (maxd[0] < left) maxd.shift();
            if (mind[0] < left) mind.shift();
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestStable(int[] signal, int tol) {
        Deque<Integer> maxd = new ArrayDeque<>();
        Deque<Integer> mind = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < signal.length; right++) {
            int v = signal[right];
            while (!maxd.isEmpty() && signal[maxd.peekLast()] <= v) maxd.pollLast();
            maxd.addLast(right);
            while (!mind.isEmpty() && signal[mind.peekLast()] >= v) mind.pollLast();
            mind.addLast(right);
            while (signal[maxd.peekFirst()] - signal[mind.peekFirst()] > tol) {
                left++;
                if (maxd.peekFirst() < left) maxd.pollFirst();
                if (mind.peekFirst() < left) mind.pollFirst();
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
    int longestStable(vector<int>& signal, int tol) {
        deque<int> maxd, mind;
        int left = 0, best = 0;
        for (int right = 0; right < (int)signal.size(); right++) {
            int v = signal[right];
            while (!maxd.empty() && signal[maxd.back()] <= v) maxd.pop_back();
            maxd.push_back(right);
            while (!mind.empty() && signal[mind.back()] >= v) mind.pop_back();
            mind.push_back(right);
            while (signal[maxd.front()] - signal[mind.front()] > tol) {
                left++;
                if (maxd.front() < left) maxd.pop_front();
                if (mind.front() < left) mind.pop_front();
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // denoise(signal: List[int]) -> List[int] — 3-window median smoothing.
  'pghub-signal-denoise': {
    javascript: `var denoise = function(signal) {
    const n = signal.length;
    if (n < 3) return signal.slice();
    const out = [signal[0]];
    for (let i = 1; i < n - 1; i++) {
        const window = [signal[i - 1], signal[i], signal[i + 1]].sort((a, b) => a - b);
        out.push(window[1]);
    }
    out.push(signal[n - 1]);
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] denoise(int[] signal) {
        int n = signal.length;
        if (n < 3) return signal.clone();
        int[] out = new int[n];
        out[0] = signal[0];
        for (int i = 1; i < n - 1; i++) {
            int[] w = {signal[i - 1], signal[i], signal[i + 1]};
            Arrays.sort(w);
            out[i] = w[1];
        }
        out[n - 1] = signal[n - 1];
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> denoise(vector<int>& signal) {
        int n = signal.size();
        if (n < 3) return signal;
        vector<int> out;
        out.push_back(signal[0]);
        for (int i = 1; i < n - 1; i++) {
            int w[3] = {signal[i - 1], signal[i], signal[i + 1]};
            sort(w, w + 3);
            out.push_back(w[1]);
        }
        out.push_back(signal[n - 1]);
        return out;
    }
};`,
  },

  // snakeRead(grid: List[List[int]]) -> List[int] — boustrophedon row scan.
  'pghub-snake-decode': {
    javascript: `var snakeRead = function(grid) {
    const out = [];
    for (let i = 0; i < grid.length; i++) {
        if (i % 2 === 0) {
            for (const x of grid[i]) out.push(x);
        } else {
            for (let j = grid[i].length - 1; j >= 0; j--) out.push(grid[i][j]);
        }
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[] snakeRead(int[][] grid) {
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < grid.length; i++) {
            if (i % 2 == 0) {
                for (int x : grid[i]) out.add(x);
            } else {
                for (int j = grid[i].length - 1; j >= 0; j--) out.add(grid[i][j]);
            }
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
    vector<int> snakeRead(vector<vector<int>>& grid) {
        vector<int> out;
        for (int i = 0; i < (int)grid.size(); i++) {
            if (i % 2 == 0) {
                for (int x : grid[i]) out.push_back(x);
            } else {
                for (int j = (int)grid[i].size() - 1; j >= 0; j--) out.push_back(grid[i][j]);
            }
        }
        return out;
    }
};`,
  },

  // ringSum(grid: List[List[int]], k: int) -> int — sum of k-th square ring.
  'pghub-spiral-ring-sum': {
    javascript: `var ringSum = function(grid, k) {
    const n = grid.length;
    const lo = k, hi = n - 1 - k;
    if (lo > hi) return 0;
    if (lo === hi) return grid[lo][lo];
    let total = 0;
    for (let c = lo; c <= hi; c++) { total += grid[lo][c]; total += grid[hi][c]; }
    for (let r = lo + 1; r < hi; r++) { total += grid[r][lo]; total += grid[r][hi]; }
    return total;
};`,
    java: `class Solution {
    public int ringSum(int[][] grid, int k) {
        int n = grid.length;
        int lo = k, hi = n - 1 - k;
        if (lo > hi) return 0;
        if (lo == hi) return grid[lo][lo];
        int total = 0;
        for (int c = lo; c <= hi; c++) { total += grid[lo][c]; total += grid[hi][c]; }
        for (int r = lo + 1; r < hi; r++) { total += grid[r][lo]; total += grid[r][hi]; }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int ringSum(vector<vector<int>>& grid, int k) {
        int n = grid.size();
        int lo = k, hi = n - 1 - k;
        if (lo > hi) return 0;
        if (lo == hi) return grid[lo][lo];
        int total = 0;
        for (int c = lo; c <= hi; c++) { total += grid[lo][c]; total += grid[hi][c]; }
        for (int r = lo + 1; r < hi; r++) { total += grid[r][lo]; total += grid[r][hi]; }
        return total;
    }
};`,
  },

  // canSplitIncreasing(nums: List[int]) -> bool — greedy strictly-increasing pieces.
  'pghub-split-into-increasing-pieces': {
    javascript: `var canSplitIncreasing = function(nums) {
    const n = nums.length;
    if (n < 2) return false;
    let prevSum = -Infinity, pieces = 0, cur = 0;
    for (let i = 0; i < n; i++) {
        cur += nums[i];
        if (cur > prevSum) {
            prevSum = cur;
            pieces++;
            cur = 0;
        }
    }
    if (cur !== 0) return false;
    return pieces >= 2;
};`,
    java: `class Solution {
    public boolean canSplitIncreasing(int[] nums) {
        int n = nums.length;
        if (n < 2) return false;
        long prevSum = Long.MIN_VALUE;
        int pieces = 0;
        long cur = 0;
        for (int i = 0; i < n; i++) {
            cur += nums[i];
            if (cur > prevSum) {
                prevSum = cur;
                pieces++;
                cur = 0;
            }
        }
        if (cur != 0) return false;
        return pieces >= 2;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canSplitIncreasing(vector<int>& nums) {
        int n = nums.size();
        if (n < 2) return false;
        long long prevSum = LLONG_MIN;
        int pieces = 0;
        long long cur = 0;
        for (int i = 0; i < n; i++) {
            cur += nums[i];
            if (cur > prevSum) {
                prevSum = cur;
                pieces++;
                cur = 0;
            }
        }
        if (cur != 0) return false;
        return pieces >= 2;
    }
};`,
  },

  // perfectSquares(lo: int, hi: int) -> int — count squares in [lo,hi] via isqrt.
  'pghub-square-count-range': {
    javascript: `var perfectSquares = function(lo, hi) {
    if (hi < lo) return 0;
    const isqrt = (x) => {
        if (x < 0) return 0;
        let r = Math.floor(Math.sqrt(x));
        while (r * r > x) r--;
        while ((r + 1) * (r + 1) <= x) r++;
        return r;
    };
    const a = isqrt(Math.max(0, lo - 1));
    const b = isqrt(hi);
    return b - a;
};`,
    java: `class Solution {
    public int perfectSquares(int lo, int hi) {
        if (hi < lo) return 0;
        long a = isqrt(Math.max(0L, (long) lo - 1));
        long b = isqrt(hi);
        return (int) (b - a);
    }
    private long isqrt(long x) {
        if (x < 0) return 0;
        long r = (long) Math.sqrt((double) x);
        while (r * r > x) r--;
        while ((r + 1) * (r + 1) <= x) r++;
        return r;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int perfectSquares(int lo, int hi) {
        if (hi < lo) return 0;
        long long a = isqrt(max(0LL, (long long)lo - 1));
        long long b = isqrt(hi);
        return (int)(b - a);
    }
private:
    long long isqrt(long long x) {
        if (x < 0) return 0;
        long long r = (long long)sqrtl((long double)x);
        while (r * r > x) r--;
        while ((r + 1) * (r + 1) <= x) r++;
        return r;
    }
};`,
  },

  // stableShift(nums: List[int]) -> List[int] — stable evens-then-odds partition.
  'pghub-stable-shift': {
    javascript: `var stableShift = function(nums) {
    const evens = [], odds = [];
    for (const x of nums) {
        if (((x % 2) + 2) % 2 === 0) evens.push(x);
        else odds.push(x);
    }
    return evens.concat(odds);
};`,
    java: `import java.util.*;
class Solution {
    public int[] stableShift(int[] nums) {
        List<Integer> evens = new ArrayList<>(), odds = new ArrayList<>();
        for (int x : nums) {
            if (((x % 2) + 2) % 2 == 0) evens.add(x);
            else odds.add(x);
        }
        int[] res = new int[nums.length];
        int i = 0;
        for (int x : evens) res[i++] = x;
        for (int x : odds) res[i++] = x;
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> stableShift(vector<int>& nums) {
        vector<int> evens, odds;
        for (int x : nums) {
            if (((x % 2) + 2) % 2 == 0) evens.push_back(x);
            else odds.push_back(x);
        }
        for (int x : odds) evens.push_back(x);
        return evens;
    }
};`,
  },

  // minCost(cost: List[int]) -> int — staircase DP, jump up to 3 steps.
  'pghub-staircase-cost': {
    javascript: `var minCost = function(cost) {
    const n = cost.length;
    const dp = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let base;
        if (i <= 2) base = 0;
        else base = Math.min(dp[i - 1], dp[i - 2], dp[i - 3]);
        dp[i] = base + cost[i];
    }
    const options = [];
    for (let i = Math.max(0, n - 3); i < n; i++) options.push(dp[i]);
    if (n <= 3) options.push(0);
    return Math.min(...options);
};`,
    java: `class Solution {
    public int minCost(int[] cost) {
        int n = cost.length;
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            int base;
            if (i <= 2) base = 0;
            else base = Math.min(dp[i - 1], Math.min(dp[i - 2], dp[i - 3]));
            dp[i] = base + cost[i];
        }
        int best = Integer.MAX_VALUE;
        for (int i = Math.max(0, n - 3); i < n; i++) best = Math.min(best, dp[i]);
        if (n <= 3) best = Math.min(best, 0);
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<int>& cost) {
        int n = cost.size();
        vector<int> dp(n, 0);
        for (int i = 0; i < n; i++) {
            int base;
            if (i <= 2) base = 0;
            else base = min(dp[i - 1], min(dp[i - 2], dp[i - 3]));
            dp[i] = base + cost[i];
        }
        int best = INT_MAX;
        for (int i = max(0, n - 3); i < n; i++) best = min(best, dp[i]);
        if (n <= 3) best = min(best, 0);
        return best;
    }
};`,
  },

  // countWays(n: int, maxStep: int) -> int — bounded step DP with sliding sum, mod.
  'pghub-staircase-ways-step': {
    javascript: `var countWays = function(n, maxStep) {
    const MOD = 1000000007n;
    const dp = new Array(n + 1).fill(0n);
    dp[0] = 1n;
    let running = 0n;
    for (let i = 1; i <= n; i++) {
        const lo = i - maxStep;
        running = (running + dp[i - 1]) % MOD;
        if (lo - 1 >= 0) running = (running - dp[lo - 1] + MOD) % MOD;
        dp[i] = running % MOD;
    }
    return Number(((dp[n] % MOD) + MOD) % MOD);
};`,
    java: `class Solution {
    public int countWays(int n, int maxStep) {
        long MOD = 1000000007L;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        long running = 0;
        for (int i = 1; i <= n; i++) {
            int lo = i - maxStep;
            running = (running + dp[i - 1]) % MOD;
            if (lo - 1 >= 0) running = ((running - dp[lo - 1]) % MOD + MOD) % MOD;
            dp[i] = running % MOD;
        }
        return (int) (((dp[n] % MOD) + MOD) % MOD);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(int n, int maxStep) {
        const long long MOD = 1000000007LL;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        long long running = 0;
        for (int i = 1; i <= n; i++) {
            int lo = i - maxStep;
            running = (running + dp[i - 1]) % MOD;
            if (lo - 1 >= 0) running = ((running - dp[lo - 1]) % MOD + MOD) % MOD;
            dp[i] = running % MOD;
        }
        return (int)(((dp[n] % MOD) + MOD) % MOD);
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int — best single buy/sell.
  'pghub-stock-single-trade': {
    javascript: `var maxProfit = function(prices) {
    let best = 0, lowest = null;
    for (const p of prices) {
        if (lowest === null || p < lowest) lowest = p;
        else if (p - lowest > best) best = p - lowest;
    }
    return best;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        int best = 0;
        Integer lowest = null;
        for (int p : prices) {
            if (lowest == null || p < lowest) lowest = p;
            else if (p - lowest > best) best = p - lowest;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int best = 0;
        bool hasLow = false;
        int lowest = 0;
        for (int p : prices) {
            if (!hasLow || p < lowest) { lowest = p; hasLow = true; }
            else if (p - lowest > best) best = p - lowest;
        }
        return best;
    }
};`,
  },

  // stockSpans(prices: List[int]) -> List[int] — monotonic stack of (price, span).
  'pghub-stock-span-peaks': {
    javascript: `var stockSpans = function(prices) {
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
    public int[] stockSpans(int[] prices) {
        int[] spans = new int[prices.length];
        Deque<int[]> stack = new ArrayDeque<>(); // {price, span}
        for (int i = 0; i < prices.length; i++) {
            int p = prices[i];
            int span = 1;
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
    vector<int> stockSpans(vector<int>& prices) {
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

  // subarraySumK(nums: List[int], k: int) -> int — prefix-sum counting.
  'pghub-subarray-sum-count': {
    javascript: `var subarraySumK = function(nums, k) {
    const prefix = new Map();
    prefix.set(0, 1);
    let s = 0, count = 0;
    for (const x of nums) {
        s += x;
        count += prefix.get(s - k) || 0;
        prefix.set(s, (prefix.get(s) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int subarraySumK(int[] nums, int k) {
        Map<Long, Integer> prefix = new HashMap<>();
        prefix.put(0L, 1);
        long s = 0;
        int count = 0;
        for (int x : nums) {
            s += x;
            count += prefix.getOrDefault(s - k, 0);
            prefix.merge(s, 1, Integer::sum);
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subarraySumK(vector<int>& nums, int k) {
        unordered_map<long long, int> prefix;
        prefix[0] = 1;
        long long s = 0;
        int count = 0;
        for (int x : nums) {
            s += x;
            auto it = prefix.find(s - k);
            if (it != prefix.end()) count += it->second;
            prefix[s]++;
        }
        return count;
    }
};`,
  },

  // countSubsets(nums: List[int], target: int) -> int — 0/1 subset-sum count, zeros double.
  'pghub-subset-target-count': {
    javascript: `var countSubsets = function(nums, target) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    for (const x of nums) {
        if (x === 0) {
            for (let s = 0; s <= target; s++) dp[s] *= 2;
        } else {
            for (let s = target; s >= x; s--) dp[s] += dp[s - x];
        }
    }
    return dp[target];
};`,
    java: `class Solution {
    public int countSubsets(int[] nums, int target) {
        long[] dp = new long[target + 1];
        dp[0] = 1;
        for (int x : nums) {
            if (x == 0) {
                for (int s = 0; s <= target; s++) dp[s] *= 2;
            } else {
                for (int s = target; s >= x; s--) dp[s] += dp[s - x];
            }
        }
        return (int) dp[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubsets(vector<int>& nums, int target) {
        vector<long long> dp(target + 1, 0);
        dp[0] = 1;
        for (int x : nums) {
            if (x == 0) {
                for (int s = 0; s <= target; s++) dp[s] *= 2;
            } else {
                for (int s = target; s >= x; s--) dp[s] += dp[s - x];
            }
        }
        return (int)dp[target];
    }
};`,
  },

  // pairSum(nums: List[int], target: int) -> List[int] — two-pointer on sorted input.
  'pghub-target-pair-sorted': {
    javascript: `var pairSum = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const s = nums[lo] + nums[hi];
        if (s === target) return [lo, hi];
        if (s < target) lo++;
        else hi--;
    }
    return [];
};`,
    java: `class Solution {
    public int[] pairSum(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int s = nums[lo] + nums[hi];
            if (s == target) return new int[]{lo, hi};
            if (s < target) lo++;
            else hi--;
        }
        return new int[]{};
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> pairSum(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int s = nums[lo] + nums[hi];
            if (s == target) return {lo, hi};
            if (s < target) lo++;
            else hi--;
        }
        return {};
    }
};`,
  },

  // totalTime(tasks: List[int], cooldown: int) -> int — cooldown scheduling clock.
  'pghub-task-cooldown-time': {
    javascript: `var totalTime = function(tasks, cooldown) {
    const last = new Map();
    let t = 0;
    for (const x of tasks) {
        if (last.has(x) && t < last.get(x) + cooldown + 1) {
            t = last.get(x) + cooldown + 1;
        }
        last.set(x, t);
        t++;
    }
    return t;
};`,
    java: `import java.util.*;
class Solution {
    public int totalTime(int[] tasks, int cooldown) {
        Map<Integer, Integer> last = new HashMap<>();
        int t = 0;
        for (int x : tasks) {
            if (last.containsKey(x) && t < last.get(x) + cooldown + 1) {
                t = last.get(x) + cooldown + 1;
            }
            last.put(x, t);
            t++;
        }
        return t;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalTime(vector<int>& tasks, int cooldown) {
        unordered_map<int, int> last;
        int t = 0;
        for (int x : tasks) {
            auto it = last.find(x);
            if (it != last.end() && t < it->second + cooldown + 1) {
                t = it->second + cooldown + 1;
            }
            last[x] = t;
            t++;
        }
        return t;
    }
};`,
  },

  // longestWarming(temps: List[int]) -> int — longest strictly increasing run.
  'pghub-temperature-streak': {
    javascript: `var longestWarming = function(temps) {
    let best = 1, cur = 1;
    for (let i = 1; i < temps.length; i++) {
        if (temps[i] > temps[i - 1]) { cur++; best = Math.max(best, cur); }
        else cur = 1;
    }
    return best;
};`,
    java: `class Solution {
    public int longestWarming(int[] temps) {
        int best = 1, cur = 1;
        for (int i = 1; i < temps.length; i++) {
            if (temps[i] > temps[i - 1]) { cur++; best = Math.max(best, cur); }
            else cur = 1;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestWarming(vector<int>& temps) {
        int best = 1, cur = 1;
        for (int i = 1; i < (int)temps.size(); i++) {
            if (temps[i] > temps[i - 1]) { cur++; best = max(best, cur); }
            else cur = 1;
        }
        return best;
    }
};`,
  },

  // tidalBlocks(heights: List[int], level: int) -> int — count below level.
  'pghub-tidal-water-blocks': {
    javascript: `var tidalBlocks = function(heights, level) {
    let count = 0;
    for (const h of heights) if (h < level) count++;
    return count;
};`,
    java: `class Solution {
    public int tidalBlocks(int[] heights, int level) {
        int count = 0;
        for (int h : heights) if (h < level) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int tidalBlocks(vector<int>& heights, int level) {
        int count = 0;
        for (int h : heights) if (h < level) count++;
        return count;
    }
};`,
  },

  // countMarks(heights: List[int]) -> int — count new running maxima.
  'pghub-tide-levels': {
    javascript: `var countMarks = function(heights) {
    let best = null, count = 0;
    for (const h of heights) {
        if (best === null || h > best) { count++; best = h; }
    }
    return count;
};`,
    java: `class Solution {
    public int countMarks(int[] heights) {
        boolean has = false;
        int best = 0, count = 0;
        for (int h : heights) {
            if (!has || h > best) { count++; best = h; has = true; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countMarks(vector<int>& heights) {
        bool has = false;
        int best = 0, count = 0;
        for (int h : heights) {
            if (!has || h > best) { count++; best = h; has = true; }
        }
        return count;
    }
};`,
  },

  // mergeRanges(ranges: List[List[int]]) -> List[List[int]] — sort + sweep merge.
  'pghub-tidy-range-merge': {
    javascript: `var mergeRanges = function(ranges) {
    const sorted = ranges.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const out = [];
    for (const [s, e] of sorted) {
        if (out.length && s <= out[out.length - 1][1]) {
            out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
        } else {
            out.push([s, e]);
        }
    }
    return out;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeRanges(int[][] ranges) {
        int[][] sorted = ranges.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        List<int[]> out = new ArrayList<>();
        for (int[] r : sorted) {
            if (!out.isEmpty() && r[0] <= out.get(out.size() - 1)[1]) {
                out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], r[1]);
            } else {
                out.add(new int[]{r[0], r[1]});
            }
        }
        return out.toArray(new int[out.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeRanges(vector<vector<int>>& ranges) {
        vector<vector<int>> sorted = ranges;
        sort(sorted.begin(), sorted.end());
        vector<vector<int>> out;
        for (auto& r : sorted) {
            if (!out.empty() && r[0] <= out.back()[1]) {
                out.back()[1] = max(out.back()[1], r[1]);
            } else {
                out.push_back({r[0], r[1]});
            }
        }
        return out;
    }
};`,
  },

  // allowed(times: List[int], capacity: int, rate: int) -> List[bool] — token bucket.
  'pghub-token-bucket-allow': {
    javascript: `var allowed = function(times, capacity, rate) {
    let tokens = capacity;
    let last = times.length ? times[0] : 0;
    const res = [];
    for (const t of times) {
        const elapsed = t - last;
        tokens = Math.min(capacity, tokens + elapsed * rate);
        last = t;
        if (tokens >= 1) { tokens -= 1; res.push(true); }
        else res.push(false);
    }
    return res;
};`,
    java: `class Solution {
    public boolean[] allowed(int[] times, int capacity, int rate) {
        long tokens = capacity;
        long last = times.length > 0 ? times[0] : 0;
        boolean[] res = new boolean[times.length];
        for (int i = 0; i < times.length; i++) {
            long t = times[i];
            long elapsed = t - last;
            tokens = Math.min((long) capacity, tokens + elapsed * rate);
            last = t;
            if (tokens >= 1) { tokens -= 1; res[i] = true; }
            else res[i] = false;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> allowed(vector<int>& times, int capacity, int rate) {
        long long tokens = capacity;
        long long last = times.empty() ? 0 : times[0];
        vector<bool> res;
        for (int t : times) {
            long long elapsed = t - last;
            tokens = min((long long)capacity, tokens + elapsed * rate);
            last = t;
            if (tokens >= 1) { tokens -= 1; res.push_back(true); }
            else res.push_back(false);
        }
        return res;
    }
};`,
  },

  // topToken(tokens: List[str]) -> str — most frequent, lexicographic tiebreak.
  'pghub-token-frequency-rank': {
    javascript: `var topToken = function(tokens) {
    const counts = new Map();
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
    let best = null, bestCount = -1;
    for (const [t, c] of counts) {
        if (c > bestCount || (c === bestCount && t < best)) {
            best = t;
            bestCount = c;
        }
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public String topToken(String[] tokens) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String t : tokens) counts.merge(t, 1, Integer::sum);
        String best = null;
        int bestCount = -1;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            int c = e.getValue();
            String t = e.getKey();
            if (c > bestCount || (c == bestCount && t.compareTo(best) < 0)) {
                best = t;
                bestCount = c;
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string topToken(vector<string>& tokens) {
        unordered_map<string, int> counts;
        for (auto& t : tokens) counts[t]++;
        string best = "";
        int bestCount = -1;
        bool has = false;
        for (auto& kv : counts) {
            int c = kv.second;
            const string& t = kv.first;
            if (!has || c > bestCount || (c == bestCount && t < best)) {
                best = t;
                bestCount = c;
                has = true;
            }
        }
        return best;
    }
};`,
  },

  // collapseTokens(tokens: List[str]) -> List[str] — adjacent-equal stack cancel.
  'pghub-token-stack-collapse': {
    javascript: `var collapseTokens = function(tokens) {
    const st = [];
    for (const t of tokens) {
        if (st.length && st[st.length - 1] === t) st.pop();
        else st.push(t);
    }
    return st;
};`,
    java: `import java.util.*;
class Solution {
    public String[] collapseTokens(String[] tokens) {
        List<String> st = new ArrayList<>();
        for (String t : tokens) {
            if (!st.isEmpty() && st.get(st.size() - 1).equals(t)) st.remove(st.size() - 1);
            else st.add(t);
        }
        return st.toArray(new String[0]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> collapseTokens(vector<string>& tokens) {
        vector<string> st;
        for (auto& t : tokens) {
            if (!st.empty() && st.back() == t) st.pop_back();
            else st.push_back(t);
        }
        return st;
    }
};`,
  },

  // totalSetBits(n: int) -> int — count set bits across 0..n via per-bit cycles.
  'pghub-total-set-bits': {
    javascript: `var totalSetBits = function(n) {
    let total = 0;
    let bit = 1;
    while (bit <= n) {
        const full = Math.floor((n + 1) / (bit * 2));
        total += full * bit;
        const rem = (n + 1) % (bit * 2);
        total += Math.max(0, rem - bit);
        bit *= 2;
    }
    return total;
};`,
    java: `class Solution {
    public int totalSetBits(int n) {
        long total = 0;
        long bit = 1;
        while (bit <= n) {
            long full = (n + 1) / (bit * 2);
            total += full * bit;
            long rem = (n + 1) % (bit * 2);
            total += Math.max(0L, rem - bit);
            bit *= 2;
        }
        return (int) total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalSetBits(int n) {
        long long total = 0;
        long long bit = 1;
        while (bit <= n) {
            long long full = ((long long)n + 1) / (bit * 2);
            total += full * bit;
            long long rem = ((long long)n + 1) % (bit * 2);
            total += max(0LL, rem - bit);
            bit *= 2;
        }
        return (int)total;
    }
};`,
  },

  // totalGames(n: int) -> int — single-elimination games = n - 1.
  'pghub-tournament-byes': {
    javascript: `var totalGames = function(n) {
    return n - 1;
};`,
    java: `class Solution {
    public int totalGames(int n) {
        return n - 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalGames(int n) {
        return n - 1;
    }
};`,
  },

  // visibleTowers(heights: List[int]) -> int — count left-to-right new maxima.
  'pghub-tower-visible': {
    javascript: `var visibleTowers = function(heights) {
    let tallest = -1, count = 0;
    for (const h of heights) {
        if (h > tallest) { count++; tallest = h; }
    }
    return count;
};`,
    java: `class Solution {
    public int visibleTowers(int[] heights) {
        int tallest = -1, count = 0;
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
    int visibleTowers(vector<int>& heights) {
        int tallest = -1, count = 0;
        for (int h : heights) {
            if (h > tallest) { count++; tallest = h; }
        }
        return count;
    }
};`,
  },

  // trapWater(heights: List[int]) -> int — two-pointer trapping rainwater.
  'pghub-trapped-rainwater': {
    javascript: `var trapWater = function(heights) {
    let lo = 0, hi = heights.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (lo < hi) {
        if (heights[lo] <= heights[hi]) {
            leftMax = Math.max(leftMax, heights[lo]);
            total += leftMax - heights[lo];
            lo++;
        } else {
            rightMax = Math.max(rightMax, heights[hi]);
            total += rightMax - heights[hi];
            hi--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trapWater(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (heights[lo] <= heights[hi]) {
                leftMax = Math.max(leftMax, heights[lo]);
                total += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = Math.max(rightMax, heights[hi]);
                total += rightMax - heights[hi];
                hi--;
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trapWater(vector<int>& heights) {
        int lo = 0, hi = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (heights[lo] <= heights[hi]) {
                leftMax = max(leftMax, heights[lo]);
                total += leftMax - heights[lo];
                lo++;
            } else {
                rightMax = max(rightMax, heights[hi]);
                total += rightMax - heights[hi];
                hi--;
            }
        }
        return total;
    }
};`,
  },
};
