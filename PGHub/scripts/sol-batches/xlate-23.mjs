// xlate-23: slice [62,93) of unstaged+pyReal+missingLangs targets — translate
// each verified Python solution to the missing js/java/cpp. Signatures match
// generateTemplate(...) exactly. All 31 need javascript+java+cpp (python present).
export default {
  // sortStack(stack: List[int]) -> List[int]  — insertion sort via auxiliary stack.
  'pghub-b45-stack-sort': {
    javascript: `var sortStack = function(stack) {
    const src = stack.slice();
    const aux = [];
    while (src.length) {
        const tmp = src.pop();
        while (aux.length && aux[aux.length - 1] > tmp) {
            src.push(aux.pop());
        }
        aux.push(tmp);
    }
    return aux;
};`,
    java: `import java.util.*;
class Solution {
    public int[] sortStack(int[] stack) {
        Deque<Integer> src = new ArrayDeque<>();
        for (int x : stack) src.push(x);
        Deque<Integer> aux = new ArrayDeque<>();
        while (!src.isEmpty()) {
            int tmp = src.pop();
            while (!aux.isEmpty() && aux.peek() > tmp) {
                src.push(aux.pop());
            }
            aux.push(tmp);
        }
        int[] res = new int[aux.size()];
        for (int i = 0; i < res.length; i++) res[i] = aux.pollLast();
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortStack(vector<int>& stack) {
        vector<int> src(stack);
        vector<int> aux;
        while (!src.empty()) {
            int tmp = src.back(); src.pop_back();
            while (!aux.empty() && aux.back() > tmp) {
                src.push_back(aux.back());
                aux.pop_back();
            }
            aux.push_back(tmp);
        }
        return aux;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — OR-of-all << (n-1).
  'pghub-b45-subset-xor-total': {
    javascript: `var subsetXorSum = function(nums) {
    let orAll = 0;
    for (const x of nums) orAll |= x;
    return orAll << (nums.length - 1);
};`,
    java: `class Solution {
    public int subsetXorSum(int[] nums) {
        int orAll = 0;
        for (int x : nums) orAll |= x;
        return orAll << (nums.length - 1);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        int orAll = 0;
        for (int x : nums) orAll |= x;
        return orAll << ((int)nums.size() - 1);
    }
};`,
  },

  // scheduleTime(tasks: List[str], cooldown: int) -> int  — task scheduler formula.
  'pghub-b45-task-cooldown': {
    javascript: `var scheduleTime = function(tasks, cooldown) {
    const counts = new Map();
    for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
    let maxCount = 0;
    for (const v of counts.values()) if (v > maxCount) maxCount = v;
    let numMax = 0;
    for (const v of counts.values()) if (v === maxCount) numMax++;
    const candidate = (maxCount - 1) * (cooldown + 1) + numMax;
    return Math.max(tasks.length, candidate);
};`,
    java: `import java.util.*;
class Solution {
    public int scheduleTime(String[] tasks, int cooldown) {
        Map<String, Integer> counts = new HashMap<>();
        for (String t : tasks) counts.merge(t, 1, Integer::sum);
        int maxCount = 0;
        for (int v : counts.values()) maxCount = Math.max(maxCount, v);
        int numMax = 0;
        for (int v : counts.values()) if (v == maxCount) numMax++;
        int candidate = (maxCount - 1) * (cooldown + 1) + numMax;
        return Math.max(tasks.length, candidate);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int scheduleTime(vector<string>& tasks, int cooldown) {
        unordered_map<string, int> counts;
        for (auto& t : tasks) counts[t]++;
        int maxCount = 0;
        for (auto& kv : counts) maxCount = max(maxCount, kv.second);
        int numMax = 0;
        for (auto& kv : counts) if (kv.second == maxCount) numMax++;
        int candidate = (maxCount - 1) * (cooldown + 1) + numMax;
        return max((int)tasks.size(), candidate);
    }
};`,
  },

  // longestVowelRun(s: str) -> int  — longest consecutive run of vowels.
  'pghub-b45-vowel-runs': {
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
        for (char ch : s.toCharArray()) {
            if (vowels.contains(ch)) {
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

  // maxDistinct(nums: List[int], k: int) -> int  — max distinct in any window of size k.
  'pghub-b45-window-distinct': {
    javascript: `var maxDistinct = function(nums, k) {
    const n = nums.length;
    if (k >= n) return new Set(nums).size;
    const freq = new Map();
    for (let i = 0; i < k; i++) freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
    let best = freq.size;
    for (let i = k; i < n; i++) {
        freq.set(nums[i], (freq.get(nums[i]) || 0) + 1);
        const old = nums[i - k];
        const c = freq.get(old) - 1;
        if (c === 0) freq.delete(old);
        else freq.set(old, c);
        if (freq.size > best) best = freq.size;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int maxDistinct(int[] nums, int k) {
        int n = nums.length;
        if (k >= n) {
            Set<Integer> all = new HashSet<>();
            for (int x : nums) all.add(x);
            return all.size();
        }
        Map<Integer, Integer> freq = new HashMap<>();
        for (int i = 0; i < k; i++) freq.merge(nums[i], 1, Integer::sum);
        int best = freq.size();
        for (int i = k; i < n; i++) {
            freq.merge(nums[i], 1, Integer::sum);
            int old = nums[i - k];
            int c = freq.get(old) - 1;
            if (c == 0) freq.remove(old);
            else freq.put(old, c);
            if (freq.size() > best) best = freq.size();
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxDistinct(vector<int>& nums, int k) {
        int n = nums.size();
        if (k >= n) {
            unordered_set<int> all(nums.begin(), nums.end());
            return (int)all.size();
        }
        unordered_map<int, int> freq;
        for (int i = 0; i < k; i++) freq[nums[i]]++;
        int best = freq.size();
        for (int i = k; i < n; i++) {
            freq[nums[i]]++;
            int old = nums[i - k];
            if (--freq[old] == 0) freq.erase(old);
            if ((int)freq.size() > best) best = freq.size();
        }
        return best;
    }
};`,
  },

  // maxNesting(s: str) -> int  — max parenthesis depth (every non-'(' decrements).
  'pghub-b46-bracket-depth': {
    javascript: `var maxNesting = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxNesting(String s) {
        int depth = 0, best = 0;
        for (char ch : s.toCharArray()) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
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
    int maxNesting(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // maxCoins(coins: List[int]) -> int  — house-robber DP.
  'pghub-b46-coin-rows': {
    javascript: `var maxCoins = function(coins) {
    let take = 0, skip = 0;
    for (const c of coins) {
        const newTake = skip + c;
        const newSkip = Math.max(skip, take);
        take = newTake;
        skip = newSkip;
    }
    return Math.max(take, skip);
};`,
    java: `class Solution {
    public int maxCoins(int[] coins) {
        int take = 0, skip = 0;
        for (int c : coins) {
            int newTake = skip + c;
            int newSkip = Math.max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return Math.max(take, skip);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCoins(vector<int>& coins) {
        int take = 0, skip = 0;
        for (int c : coins) {
            int newTake = skip + c;
            int newSkip = max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return max(take, skip);
    }
};`,
  },

  // minFlips(s: str) -> int  — count adjacent transitions.
  'pghub-b46-flip-segments': {
    javascript: `var minFlips = function(s) {
    let flips = 0;
    for (let i = 1; i < s.length; i++) {
        if (s[i] !== s[i - 1]) flips++;
    }
    return flips;
};`,
    java: `class Solution {
    public int minFlips(String s) {
        int flips = 0;
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) != s.charAt(i - 1)) flips++;
        }
        return flips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFlips(string s) {
        int flips = 0;
        for (int i = 1; i < (int)s.size(); i++) {
            if (s[i] != s[i - 1]) flips++;
        }
        return flips;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — 4 per cell minus 2 per shared edge.
  'pghub-b46-grid-region-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                perim += 4;
                if (r > 0 && grid[r - 1][c] === 1) perim -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perim -= 2;
            }
        }
    }
    return perim;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
            }
        }
        return perim;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int islandPerimeter(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), perim = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
            }
        }
        return perim;
    }
};`,
  },

  // powMod(base: int, exp: int, mod: int) -> int  — fast modular exponentiation.
  'pghub-b46-modular-power': {
    javascript: `var powMod = function(base, exp, mod) {
    if (mod === 1) return 0;
    let result = 1n;
    let b = BigInt(base) % BigInt(mod);
    let e = BigInt(exp);
    const m = BigInt(mod);
    while (e > 0n) {
        if (e & 1n) result = (result * b) % m;
        b = (b * b) % m;
        e >>= 1n;
    }
    return Number(result);
};`,
    java: `class Solution {
    public int powMod(int base, int exp, int mod) {
        if (mod == 1) return 0;
        long result = 1;
        long b = base % mod;
        long e = exp;
        while (e > 0) {
            if ((e & 1) == 1) result = (result * b) % mod;
            b = (b * b) % mod;
            e >>= 1;
        }
        return (int) result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int powMod(int base, int exp, int mod) {
        if (mod == 1) return 0;
        long long result = 1;
        long long b = base % mod;
        long long e = exp;
        while (e > 0) {
            if (e & 1) result = (result * b) % mod;
            b = (b * b) % mod;
            e >>= 1;
        }
        return (int) result;
    }
};`,
  },

  // closestPairDiff(temps: List[int]) -> int  — min adjacent diff after sort.
  'pghub-b46-pair-temperature': {
    javascript: `var closestPairDiff = function(temps) {
    const s = temps.slice().sort((a, b) => a - b);
    let best = Infinity;
    for (let i = 0; i < s.length - 1; i++) {
        const d = s[i + 1] - s[i];
        if (d < best) best = d;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int closestPairDiff(int[] temps) {
        int[] s = temps.clone();
        Arrays.sort(s);
        int best = Integer.MAX_VALUE;
        for (int i = 0; i < s.length - 1; i++) {
            best = Math.min(best, s[i + 1] - s[i]);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairDiff(vector<int>& temps) {
        vector<int> s(temps);
        sort(s.begin(), s.end());
        int best = INT_MAX;
        for (int i = 0; i + 1 < (int)s.size(); i++) {
            best = min(best, s[i + 1] - s[i]);
        }
        return best;
    }
};`,
  },

  // romanToInt(s: str) -> int  — subtract when next symbol is larger.
  'pghub-b46-roman-toll': {
    javascript: `var romanToInt = function(s) {
    const vals = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000};
    let total = 0;
    for (let i = 0; i < s.length; i++) {
        const v = vals[s[i]];
        if (i + 1 < s.length && vals[s[i + 1]] > v) total -= v;
        else total += v;
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int romanToInt(String s) {
        Map<Character, Integer> vals = new HashMap<>();
        vals.put('I', 1); vals.put('V', 5); vals.put('X', 10); vals.put('L', 50);
        vals.put('C', 100); vals.put('D', 500); vals.put('M', 1000);
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int v = vals.get(s.charAt(i));
            if (i + 1 < s.length() && vals.get(s.charAt(i + 1)) > v) total -= v;
            else total += v;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int romanToInt(string s) {
        unordered_map<char, int> vals = {{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};
        int total = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            int v = vals[s[i]];
            if (i + 1 < (int)s.size() && vals[s[i + 1]] > v) total -= v;
            else total += v;
        }
        return total;
    }
};`,
  },

  // findRotation(nums: List[int]) -> int  — binary search for pivot index.
  'pghub-b46-rotate-vault': {
    javascript: `var findRotation = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int findRotation(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findRotation(vector<int>& nums) {
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // longestStable(readings: List[int], limit: int) -> int  — monotonic-deque window.
  'pghub-b46-sensor-window': {
    javascript: `var longestStable = function(readings, limit) {
    const maxDq = [], minDq = [];
    let left = 0, best = 0;
    for (let right = 0; right < readings.length; right++) {
        const v = readings[right];
        while (maxDq.length && readings[maxDq[maxDq.length - 1]] <= v) maxDq.pop();
        maxDq.push(right);
        while (minDq.length && readings[minDq[minDq.length - 1]] >= v) minDq.pop();
        minDq.push(right);
        while (readings[maxDq[0]] - readings[minDq[0]] > limit) {
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
    public int longestStable(int[] readings, int limit) {
        Deque<Integer> maxDq = new ArrayDeque<>();
        Deque<Integer> minDq = new ArrayDeque<>();
        int left = 0, best = 0;
        for (int right = 0; right < readings.length; right++) {
            int v = readings[right];
            while (!maxDq.isEmpty() && readings[maxDq.peekLast()] <= v) maxDq.pollLast();
            maxDq.addLast(right);
            while (!minDq.isEmpty() && readings[minDq.peekLast()] >= v) minDq.pollLast();
            minDq.addLast(right);
            while (readings[maxDq.peekFirst()] - readings[minDq.peekFirst()] > limit) {
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
    int longestStable(vector<int>& readings, int limit) {
        deque<int> maxDq, minDq;
        int left = 0, best = 0;
        for (int right = 0; right < (int)readings.size(); right++) {
            int v = readings[right];
            while (!maxDq.empty() && readings[maxDq.back()] <= v) maxDq.pop_back();
            maxDq.push_back(right);
            while (!minDq.empty() && readings[minDq.back()] >= v) minDq.pop_back();
            minDq.push_back(right);
            while (readings[maxDq.front()] - readings[minDq.front()] > limit) {
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

  // canPartition(nums: List[int]) -> bool  — subset-sum via bitset DP.
  'pghub-b46-subset-equal-sum': {
    javascript: `var canPartition = function(nums) {
    let total = 0;
    for (const x of nums) total += x;
    if (total % 2 !== 0) return false;
    const target = total / 2;
    let reachable = 1n;
    for (const x of nums) reachable |= reachable << BigInt(x);
    return ((reachable >> BigInt(target)) & 1n) === 1n;
};`,
    java: `import java.math.BigInteger;
class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int target = total / 2;
        BigInteger reachable = BigInteger.ONE;
        for (int x : nums) reachable = reachable.or(reachable.shiftLeft(x));
        return reachable.testBit(target);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int target = total / 2;
        vector<char> reachable(target + 1, 0);
        reachable[0] = 1;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                if (reachable[s - x]) reachable[s] = 1;
            }
        }
        return reachable[target] == 1;
    }
};`,
  },

  // maxProfit(jobs: List[List[int]]) -> int  — sort by deadline + min-heap of profits.
  'pghub-b46-task-deadlines': {
    javascript: `var maxProfit = function(jobs) {
    const order = jobs.slice().sort((a, b) => a[0] - b[0]);
    // hand-rolled binary min-heap of profits
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
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
                let smallest = i;
                const l = 2 * i + 1, r = 2 * i + 2;
                if (l < n && heap[l] < heap[smallest]) smallest = l;
                if (r < n && heap[r] < heap[smallest]) smallest = r;
                if (smallest === i) break;
                [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
                i = smallest;
            }
        }
        return top;
    };
    for (const [deadline, profit] of order) {
        push(profit);
        if (heap.length > deadline) pop();
    }
    let sum = 0;
    for (const p of heap) sum += p;
    return sum;
};`,
    java: `import java.util.*;
class Solution {
    public int maxProfit(int[][] jobs) {
        int[][] order = jobs.clone();
        Arrays.sort(order, (a, b) -> Integer.compare(a[0], b[0]));
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int[] j : order) {
            int deadline = j[0], profit = j[1];
            heap.offer(profit);
            if (heap.size() > deadline) heap.poll();
        }
        int sum = 0;
        for (int p : heap) sum += p;
        return sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<vector<int>>& jobs) {
        vector<vector<int>> order(jobs);
        sort(order.begin(), order.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        priority_queue<int, vector<int>, greater<int>> heap;
        for (auto& j : order) {
            int deadline = j[0], profit = j[1];
            heap.push(profit);
            if ((int)heap.size() > deadline) heap.pop();
        }
        int sum = 0;
        while (!heap.empty()) { sum += heap.top(); heap.pop(); }
        return sum;
    }
};`,
  },

  // admitted(arrivals: List[int], rate: int, capacity: int) -> int  — token bucket sim.
  'pghub-b46-token-bucket': {
    javascript: `var admitted = function(arrivals, rate, capacity) {
    let tokens = capacity;
    let prev = arrivals[0];
    let count = 0;
    for (let i = 0; i < arrivals.length; i++) {
        const t = arrivals[i];
        if (i > 0) {
            tokens = Math.min(capacity, tokens + (t - prev) * rate);
            prev = t;
        }
        if (tokens >= 1) {
            tokens -= 1;
            count++;
        }
    }
    return count;
};`,
    java: `class Solution {
    public int admitted(int[] arrivals, int rate, int capacity) {
        int tokens = capacity;
        int prev = arrivals[0];
        int count = 0;
        for (int i = 0; i < arrivals.length; i++) {
            int t = arrivals[i];
            if (i > 0) {
                tokens = Math.min(capacity, tokens + (t - prev) * rate);
                prev = t;
            }
            if (tokens >= 1) {
                tokens -= 1;
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
    int admitted(vector<int>& arrivals, int rate, int capacity) {
        int tokens = capacity;
        int prev = arrivals[0];
        int count = 0;
        for (int i = 0; i < (int)arrivals.size(); i++) {
            int t = arrivals[i];
            if (i > 0) {
                tokens = min(capacity, tokens + (t - prev) * rate);
                prev = t;
            }
            if (tokens >= 1) {
                tokens -= 1;
                count++;
            }
        }
        return count;
    }
};`,
  },

  // verticalSums(tree: List[int]) -> List[int]  — heap-array tree, -1 = absent node.
  // Column sums left-to-right. -1 is the null sentinel (gradeable, not a value).
  'pghub-b46-tree-vertical-sum': {
    javascript: `var verticalSums = function(tree) {
    if (!tree.length || tree[0] === -1) return [];
    const n = tree.length;
    const colSum = new Map();
    const queue = [[0, 0]];
    let head = 0;
    while (head < queue.length) {
        const [idx, col] = queue[head++];
        if (idx >= n || tree[idx] === -1) continue;
        colSum.set(col, (colSum.get(col) || 0) + tree[idx]);
        const left = 2 * idx + 1, right = 2 * idx + 2;
        if (left < n && tree[left] !== -1) queue.push([left, col - 1]);
        if (right < n && tree[right] !== -1) queue.push([right, col + 1]);
    }
    const cols = [...colSum.keys()];
    const lo = Math.min(...cols), hi = Math.max(...cols);
    const res = [];
    for (let c = lo; c <= hi; c++) res.push(colSum.get(c) || 0);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] verticalSums(int[] tree) {
        if (tree.length == 0 || tree[0] == -1) return new int[0];
        int n = tree.length;
        Map<Integer, Integer> colSum = new HashMap<>();
        Deque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0});
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int idx = cur[0], col = cur[1];
            if (idx >= n || tree[idx] == -1) continue;
            colSum.merge(col, tree[idx], Integer::sum);
            int left = 2 * idx + 1, right = 2 * idx + 2;
            if (left < n && tree[left] != -1) queue.add(new int[]{left, col - 1});
            if (right < n && tree[right] != -1) queue.add(new int[]{right, col + 1});
        }
        int lo = Collections.min(colSum.keySet());
        int hi = Collections.max(colSum.keySet());
        int[] res = new int[hi - lo + 1];
        for (int c = lo; c <= hi; c++) res[c - lo] = colSum.getOrDefault(c, 0);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> verticalSums(vector<int>& tree) {
        if (tree.empty() || tree[0] == -1) return {};
        int n = tree.size();
        map<int, int> colSum;
        queue<pair<int,int>> q;
        q.push({0, 0});
        while (!q.empty()) {
            auto [idx, col] = q.front(); q.pop();
            if (idx >= n || tree[idx] == -1) continue;
            colSum[col] += tree[idx];
            int left = 2 * idx + 1, right = 2 * idx + 2;
            if (left < n && tree[left] != -1) q.push({left, col - 1});
            if (right < n && tree[right] != -1) q.push({right, col + 1});
        }
        int lo = colSum.begin()->first;
        int hi = colSum.rbegin()->first;
        vector<int> res;
        for (int c = lo; c <= hi; c++) res.push_back(colSum.count(c) ? colSum[c] : 0);
        return res;
    }
};`,
  },

  // prefixCounts(words: List[str], queries: List[str]) -> List[int]  — trie prefix counts.
  'pghub-b46-trie-autocomplete': {
    javascript: `var prefixCounts = function(words, queries) {
    const root = new Map();
    for (const w of words) {
        let node = root;
        for (const ch of w) {
            if (!node.has(ch)) node.set(ch, {count: 0, next: new Map()});
            const entry = node.get(ch);
            entry.count++;
            node = entry.next;
        }
    }
    const res = [];
    for (const q of queries) {
        let node = root;
        let ok = true;
        let count = 0;
        for (const ch of q) {
            if (!node.has(ch)) { ok = false; break; }
            const entry = node.get(ch);
            count = entry.count;
            node = entry.next;
        }
        res.push(ok ? count : 0);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    static class Node {
        int count = 0;
        Map<Character, Node> next = new HashMap<>();
    }
    public int[] prefixCounts(String[] words, String[] queries) {
        Node root = new Node();
        for (String w : words) {
            Node node = root;
            for (char ch : w.toCharArray()) {
                node = node.next.computeIfAbsent(ch, k -> new Node());
                node.count++;
            }
        }
        int[] res = new int[queries.length];
        for (int i = 0; i < queries.length; i++) {
            Node node = root;
            boolean ok = true;
            int count = 0;
            for (char ch : queries[i].toCharArray()) {
                if (!node.next.containsKey(ch)) { ok = false; break; }
                node = node.next.get(ch);
                count = node.count;
            }
            res[i] = ok ? count : 0;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
    struct Node {
        int count = 0;
        unordered_map<char, Node*> next;
    };
public:
    vector<int> prefixCounts(vector<string>& words, vector<string>& queries) {
        Node* root = new Node();
        for (auto& w : words) {
            Node* node = root;
            for (char ch : w) {
                if (!node->next.count(ch)) node->next[ch] = new Node();
                node = node->next[ch];
                node->count++;
            }
        }
        vector<int> res;
        for (auto& q : queries) {
            Node* node = root;
            bool ok = true;
            int count = 0;
            for (char ch : q) {
                if (!node->next.count(ch)) { ok = false; break; }
                node = node->next[ch];
                count = node->count;
            }
            res.push_back(ok ? count : 0);
        }
        return res;
    }
};`,
  },

  // restockTrips(demands: List[int], cartSize: int) -> int  — greedy bin-packing trips.
  'pghub-b46-warehouse-aisles': {
    javascript: `var restockTrips = function(demands, cartSize) {
    let trips = 0, load = 0;
    for (const d of demands) {
        if (load + d > cartSize) {
            trips++;
            load = 0;
        }
        load += d;
    }
    if (load > 0) trips++;
    return trips;
};`,
    java: `class Solution {
    public int restockTrips(int[] demands, int cartSize) {
        int trips = 0, load = 0;
        for (int d : demands) {
            if (load + d > cartSize) {
                trips++;
                load = 0;
            }
            load += d;
        }
        if (load > 0) trips++;
        return trips;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restockTrips(vector<int>& demands, int cartSize) {
        int trips = 0, load = 0;
        for (int d : demands) {
            if (load + d > cartSize) {
                trips++;
                load = 0;
            }
            load += d;
        }
        if (load > 0) trips++;
        return trips;
    }
};`,
  },

  // maxDepth(s: str) -> int  — parenthesis depth, only '(' and ')' affect it.
  'pghub-b47-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    let depth = 0, best = 0;
    for (const ch of s) {
        if (ch === '(') {
            depth++;
            if (depth > best) best = depth;
        } else if (ch === ')') {
            depth--;
        }
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (char ch : s.toCharArray()) {
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
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
            if (ch == '(') {
                depth++;
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // maxItems(prices: List[int], budget: int) -> int  — greedy cheapest-first.
  'pghub-b47-budget-greedy': {
    javascript: `var maxItems = function(prices, budget) {
    const sorted = prices.slice().sort((a, b) => a - b);
    let spent = 0, bought = 0;
    for (const p of sorted) {
        if (spent + p > budget) break;
        spent += p;
        bought++;
    }
    return bought;
};`,
    java: `import java.util.*;
class Solution {
    public int maxItems(int[] prices, int budget) {
        int[] sorted = prices.clone();
        Arrays.sort(sorted);
        int spent = 0, bought = 0;
        for (int p : sorted) {
            if (spent + p > budget) break;
            spent += p;
            bought++;
        }
        return bought;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxItems(vector<int>& prices, int budget) {
        vector<int> sorted(prices);
        sort(sorted.begin(), sorted.end());
        int spent = 0, bought = 0;
        for (int p : sorted) {
            if (spent + p > budget) break;
            spent += p;
            bought++;
        }
        return bought;
    }
};`,
  },

  // maxCoins(coins: List[int]) -> int  — house-robber DP (allows negatives via max).
  'pghub-b47-coin-rows': {
    javascript: `var maxCoins = function(coins) {
    let take = 0, skip = 0;
    for (const c of coins) {
        const newTake = skip + c;
        const newSkip = Math.max(skip, take);
        take = newTake;
        skip = newSkip;
    }
    return Math.max(take, skip);
};`,
    java: `class Solution {
    public int maxCoins(int[] coins) {
        int take = 0, skip = 0;
        for (int c : coins) {
            int newTake = skip + c;
            int newSkip = Math.max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return Math.max(take, skip);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxCoins(vector<int>& coins) {
        int take = 0, skip = 0;
        for (int c : coins) {
            int newTake = skip + c;
            int newSkip = max(skip, take);
            take = newTake;
            skip = newSkip;
        }
        return max(take, skip);
    }
};`,
  },

  // courseOrder(numCourses: int, prereqs: List[List[int]]) -> List[int]
  // Kahn topological sort with a MIN-HEAP for lexicographically smallest order.
  'pghub-b47-course-order': {
    javascript: `var courseOrder = function(numCourses, prereqs) {
    const adj = Array.from({length: numCourses}, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prereqs) {
        adj[b].push(a);
        indeg[a]++;
    }
    // hand-rolled binary min-heap
    const heap = [];
    const push = (x) => {
        heap.push(x);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
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
                let s = i;
                const l = 2 * i + 1, r = 2 * i + 2;
                if (l < n && heap[l] < heap[s]) s = l;
                if (r < n && heap[r] < heap[s]) s = r;
                if (s === i) break;
                [heap[s], heap[i]] = [heap[i], heap[s]];
                i = s;
            }
        }
        return top;
    };
    for (let c = 0; c < numCourses; c++) if (indeg[c] === 0) push(c);
    const order = [];
    while (heap.length) {
        const c = pop();
        order.push(c);
        for (const nxt of adj[c]) {
            if (--indeg[nxt] === 0) push(nxt);
        }
    }
    return order.length === numCourses ? order : [];
};`,
    java: `import java.util.*;
class Solution {
    public int[] courseOrder(int numCourses, int[][] prereqs) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] e : prereqs) {
            adj.get(e[1]).add(e[0]);
            indeg[e[0]]++;
        }
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int c = 0; c < numCourses; c++) if (indeg[c] == 0) heap.offer(c);
        List<Integer> order = new ArrayList<>();
        while (!heap.isEmpty()) {
            int c = heap.poll();
            order.add(c);
            for (int nxt : adj.get(c)) {
                if (--indeg[nxt] == 0) heap.offer(nxt);
            }
        }
        if (order.size() != numCourses) return new int[0];
        int[] res = new int[order.size()];
        for (int i = 0; i < res.length; i++) res[i] = order.get(i);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> courseOrder(int numCourses, vector<vector<int>>& prereqs) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& e : prereqs) {
            adj[e[1]].push_back(e[0]);
            indeg[e[0]]++;
        }
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int c = 0; c < numCourses; c++) if (indeg[c] == 0) heap.push(c);
        vector<int> order;
        while (!heap.empty()) {
            int c = heap.top(); heap.pop();
            order.push_back(c);
            for (int nxt : adj[c]) {
                if (--indeg[nxt] == 0) heap.push(nxt);
            }
        }
        return (int)order.size() == numCourses ? order : vector<int>{};
    }
};`,
  },

  // longestOnes(bits: List[int], k: int) -> int  — sliding window, ≤k zeros.
  'pghub-b47-flip-streak': {
    javascript: `var longestOnes = function(bits, k) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < bits.length; right++) {
        if (bits[right] === 0) zeros++;
        while (zeros > k) {
            if (bits[left] === 0) zeros--;
            left++;
        }
        const window = right - left + 1;
        if (window > best) best = window;
    }
    return best;
};`,
    java: `class Solution {
    public int longestOnes(int[] bits, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < bits.length; right++) {
            if (bits[right] == 0) zeros++;
            while (zeros > k) {
                if (bits[left] == 0) zeros--;
                left++;
            }
            int window = right - left + 1;
            if (window > best) best = window;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestOnes(vector<int>& bits, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)bits.size(); right++) {
            if (bits[right] == 0) zeros++;
            while (zeros > k) {
                if (bits[left] == 0) zeros--;
                left++;
            }
            int window = right - left + 1;
            if (window > best) best = window;
        }
        return best;
    }
};`,
  },

  // minOpsToOne(nums: List[int]) -> int  — gcd-window operations to make all 1s.
  'pghub-b47-gcd-subarray': {
    javascript: `var minOpsToOne = function(nums) {
    const n = nums.length;
    const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
    let ones = 0;
    for (const x of nums) if (x === 1) ones++;
    if (ones > 0) return n - ones;
    let best = -1;
    for (let i = 0; i < n; i++) {
        let g = nums[i];
        for (let j = i + 1; j < n; j++) {
            g = gcd(g, nums[j]);
            if (g === 1) {
                const span = j - i;
                if (best === -1 || span < best) best = span;
                break;
            }
        }
    }
    if (best === -1) return -1;
    return best + (n - 1);
};`,
    java: `class Solution {
    private int gcd(int a, int b) {
        while (b != 0) { int t = b; b = a % b; a = t; }
        return a;
    }
    public int minOpsToOne(int[] nums) {
        int n = nums.length;
        int ones = 0;
        for (int x : nums) if (x == 1) ones++;
        if (ones > 0) return n - ones;
        int best = -1;
        for (int i = 0; i < n; i++) {
            int g = nums[i];
            for (int j = i + 1; j < n; j++) {
                g = gcd(g, nums[j]);
                if (g == 1) {
                    int span = j - i;
                    if (best == -1 || span < best) best = span;
                    break;
                }
            }
        }
        if (best == -1) return -1;
        return best + (n - 1);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minOpsToOne(vector<int>& nums) {
        int n = nums.size();
        int ones = 0;
        for (int x : nums) if (x == 1) ones++;
        if (ones > 0) return n - ones;
        int best = -1;
        for (int i = 0; i < n; i++) {
            int g = nums[i];
            for (int j = i + 1; j < n; j++) {
                g = __gcd(g, nums[j]);
                if (g == 1) {
                    int span = j - i;
                    if (best == -1 || span < best) best = span;
                    break;
                }
            }
        }
        if (best == -1) return -1;
        return best + (n - 1);
    }
};`,
  },

  // minFallingPath(grid: List[List[int]]) -> int  — DP over adjacent columns.
  'pghub-b47-grid-min-path': {
    javascript: `var minFallingPath = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let dp = grid[0].slice();
    for (let r = 1; r < rows; r++) {
        const next = new Array(cols).fill(0);
        for (let c = 0; c < cols; c++) {
            let best = dp[c];
            if (c > 0 && dp[c - 1] < best) best = dp[c - 1];
            if (c < cols - 1 && dp[c + 1] < best) best = dp[c + 1];
            next[c] = grid[r][c] + best;
        }
        dp = next;
    }
    return Math.min(...dp);
};`,
    java: `class Solution {
    public int minFallingPath(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[] dp = grid[0].clone();
        for (int r = 1; r < rows; r++) {
            int[] next = new int[cols];
            for (int c = 0; c < cols; c++) {
                int best = dp[c];
                if (c > 0) best = Math.min(best, dp[c - 1]);
                if (c < cols - 1) best = Math.min(best, dp[c + 1]);
                next[c] = grid[r][c] + best;
            }
            dp = next;
        }
        int ans = Integer.MAX_VALUE;
        for (int x : dp) ans = Math.min(ans, x);
        return ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minFallingPath(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size();
        vector<int> dp = grid[0];
        for (int r = 1; r < rows; r++) {
            vector<int> next(cols, 0);
            for (int c = 0; c < cols; c++) {
                int best = dp[c];
                if (c > 0) best = min(best, dp[c - 1]);
                if (c < cols - 1) best = min(best, dp[c + 1]);
                next[c] = grid[r][c] + best;
            }
            dp = next;
        }
        return *min_element(dp.begin(), dp.end());
    }
};`,
  },

  // findMin(nums: List[int]) -> int  — minimum of rotated sorted array (binary search).
  'pghub-b47-rotated-min': {
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
            int mid = (lo + hi) >>> 1;
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
        int lo = 0, hi = (int)nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
};`,
  },

  // compressedLength(s: str) -> int  — length of run-length encoding.
  'pghub-b47-run-compress': {
    javascript: `var compressedLength = function(s) {
    if (!s.length) return 0;
    let total = 0, i = 0;
    const n = s.length;
    while (i < n) {
        let j = i;
        while (j < n && s[j] === s[i]) j++;
        const run = j - i;
        total += 1;
        if (run > 1) total += String(run).length;
        i = j;
    }
    return total;
};`,
    java: `class Solution {
    public int compressedLength(String s) {
        if (s.isEmpty()) return 0;
        int total = 0, i = 0, n = s.length();
        while (i < n) {
            int j = i;
            while (j < n && s.charAt(j) == s.charAt(i)) j++;
            int run = j - i;
            total += 1;
            if (run > 1) total += String.valueOf(run).length();
            i = j;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int compressedLength(string s) {
        if (s.empty()) return 0;
        int total = 0, i = 0, n = s.size();
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            int run = j - i;
            total += 1;
            if (run > 1) total += to_string(run).size();
            i = j;
        }
        return total;
    }
};`,
  },

  // visibleBuildings(heights: List[int]) -> int  — count strict left-to-right maxima.
  'pghub-b47-skyline-peaks': {
    javascript: `var visibleBuildings = function(heights) {
    let count = 0, tallest = 0;
    for (const h of heights) {
        if (h > tallest) {
            count++;
            tallest = h;
        }
    }
    return count;
};`,
    java: `class Solution {
    public int visibleBuildings(int[] heights) {
        int count = 0, tallest = 0;
        for (int h : heights) {
            if (h > tallest) {
                count++;
                tallest = h;
            }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int visibleBuildings(vector<int>& heights) {
        int count = 0, tallest = 0;
        for (int h : heights) {
            if (h > tallest) {
                count++;
                tallest = h;
            }
        }
        return count;
    }
};`,
  },

  // survivingStones(stones: List[int]) -> List[int]  — asteroid-collision stack.
  'pghub-b47-snowball-merge': {
    javascript: `var survivingStones = function(stones) {
    const stack = [];
    for (const s of stones) {
        let alive = true;
        while (alive && s < 0 && stack.length && stack[stack.length - 1] > 0) {
            const top = stack[stack.length - 1];
            if (top < -s) {
                stack.pop();
                continue;
            } else if (top === -s) {
                stack.pop();
                alive = false;
            } else {
                alive = false;
            }
        }
        if (alive) stack.push(s);
    }
    return stack;
};`,
    java: `import java.util.*;
class Solution {
    public int[] survivingStones(int[] stones) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int s : stones) {
            boolean alive = true;
            while (alive && s < 0 && !stack.isEmpty() && stack.peek() > 0) {
                int top = stack.peek();
                if (top < -s) {
                    stack.pop();
                    continue;
                } else if (top == -s) {
                    stack.pop();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) stack.push(s);
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
    vector<int> survivingStones(vector<int>& stones) {
        vector<int> stack;
        for (int s : stones) {
            bool alive = true;
            while (alive && s < 0 && !stack.empty() && stack.back() > 0) {
                int top = stack.back();
                if (top < -s) {
                    stack.pop_back();
                    continue;
                } else if (top == -s) {
                    stack.pop_back();
                    alive = false;
                } else {
                    alive = false;
                }
            }
            if (alive) stack.push_back(s);
        }
        return stack;
    }
};`,
  },
};
