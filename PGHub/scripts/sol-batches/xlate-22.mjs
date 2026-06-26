// xlate-22: slice [31,62) of unstaged+pyReal targets — translate verified Python
// to the missing js/java/cpp langs. Signatures match generateTemplate(...) exactly.
// Tree problems use a -1 sentinel inside List[int] (gradeable), not null/None.
export default {
  // deepestLeafSum(tree: List[int]) -> int  — BFS heap-array tree (-1 = absent), sum deepest level.
  'pghub-b43-tree-leaf-depth': {
    javascript: `var deepestLeafSum = function(tree) {
    if (!tree || tree.length === 0 || tree[0] === -1) return 0;
    const n = tree.length;
    let bestDepth = -1, bestSum = 0;
    const queue = [[0, 0]];
    let qi = 0;
    while (qi < queue.length) {
        const [idx, depth] = queue[qi++];
        if (idx >= n || tree[idx] === -1) continue;
        const left = 2 * idx + 1, right = 2 * idx + 2;
        const hasLeft = left < n && tree[left] !== -1;
        const hasRight = right < n && tree[right] !== -1;
        if (!hasLeft && !hasRight) {
            if (depth > bestDepth) { bestDepth = depth; bestSum = tree[idx]; }
            else if (depth === bestDepth) bestSum += tree[idx];
        } else {
            if (hasLeft) queue.push([left, depth + 1]);
            if (hasRight) queue.push([right, depth + 1]);
        }
    }
    return bestSum;
};`,
    java: `import java.util.*;
class Solution {
    public int deepestLeafSum(int[] tree) {
        if (tree == null || tree.length == 0 || tree[0] == -1) return 0;
        int n = tree.length, bestDepth = -1, bestSum = 0;
        Deque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0});
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int idx = cur[0], depth = cur[1];
            if (idx >= n || tree[idx] == -1) continue;
            int left = 2 * idx + 1, right = 2 * idx + 2;
            boolean hasLeft = left < n && tree[left] != -1;
            boolean hasRight = right < n && tree[right] != -1;
            if (!hasLeft && !hasRight) {
                if (depth > bestDepth) { bestDepth = depth; bestSum = tree[idx]; }
                else if (depth == bestDepth) bestSum += tree[idx];
            } else {
                if (hasLeft) queue.add(new int[]{left, depth + 1});
                if (hasRight) queue.add(new int[]{right, depth + 1});
            }
        }
        return bestSum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int deepestLeafSum(vector<int>& tree) {
        if (tree.empty() || tree[0] == -1) return 0;
        int n = tree.size(), bestDepth = -1, bestSum = 0;
        queue<pair<int,int>> q;
        q.push({0, 0});
        while (!q.empty()) {
            auto [idx, depth] = q.front(); q.pop();
            if (idx >= n || tree[idx] == -1) continue;
            int left = 2 * idx + 1, right = 2 * idx + 2;
            bool hasLeft = left < n && tree[left] != -1;
            bool hasRight = right < n && tree[right] != -1;
            if (!hasLeft && !hasRight) {
                if (depth > bestDepth) { bestDepth = depth; bestSum = tree[idx]; }
                else if (depth == bestDepth) bestSum += tree[idx];
            } else {
                if (hasLeft) q.push({left, depth + 1});
                if (hasRight) q.push({right, depth + 1});
            }
        }
        return bestSum;
    }
};`,
  },

  // finalLength(ops: List[str]) -> int  — "A x" pushes x; "U" pops; running total.
  'pghub-b43-undo-stack': {
    javascript: `var finalLength = function(ops) {
    const stack = [];
    let total = 0;
    for (const op of ops) {
        if (op === 'U') {
            if (stack.length) total -= stack.pop();
        } else {
            const x = parseInt(op.split(/\\s+/)[1], 10);
            stack.push(x);
            total += x;
        }
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int finalLength(String[] ops) {
        Deque<Integer> stack = new ArrayDeque<>();
        int total = 0;
        for (String op : ops) {
            if (op.equals("U")) {
                if (!stack.isEmpty()) total -= stack.pop();
            } else {
                int x = Integer.parseInt(op.split("\\\\s+")[1]);
                stack.push(x);
                total += x;
            }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int finalLength(vector<string>& ops) {
        vector<int> stack;
        int total = 0;
        for (const string& op : ops) {
            if (op == "U") {
                if (!stack.empty()) { total -= stack.back(); stack.pop_back(); }
            } else {
                int sp = op.find(' ');
                int x = stoi(op.substr(sp + 1));
                stack.push_back(x);
                total += x;
            }
        }
        return total;
    }
};`,
  },

  // trappedWater(heights: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b43-water-fill': {
    javascript: `var trappedWater = function(heights) {
    if (!heights || heights.length === 0) return 0;
    let left = 0, right = heights.length - 1;
    let leftMax = 0, rightMax = 0, total = 0;
    while (left < right) {
        if (heights[left] <= heights[right]) {
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
        if (heights == null || heights.length == 0) return 0;
        int left = 0, right = heights.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
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
        int left = 0, right = (int)heights.size() - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
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

  // chainLength(start: str, goal: str, words: List[str]) -> int  — word-ladder BFS.
  'pghub-b43-word-ladder-len': {
    javascript: `var chainLength = function(start, goal, words) {
    const wordSet = new Set(words);
    if (!wordSet.has(goal)) return 0;
    const queue = [[start, 1]];
    let qi = 0;
    const visited = new Set([start]);
    while (qi < queue.length) {
        const [word, dist] = queue[qi++];
        if (word === goal) return dist;
        for (let i = 0; i < word.length; i++) {
            for (let c = 97; c < 123; c++) {
                const ch = String.fromCharCode(c);
                if (ch === word[i]) continue;
                const nxt = word.slice(0, i) + ch + word.slice(i + 1);
                if (wordSet.has(nxt) && !visited.has(nxt)) {
                    visited.add(nxt);
                    queue.push([nxt, dist + 1]);
                }
            }
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int chainLength(String start, String goal, String[] words) {
        Set<String> wordSet = new HashSet<>(Arrays.asList(words));
        if (!wordSet.contains(goal)) return 0;
        Deque<int[]> q = new ArrayDeque<>();
        List<String> nodes = new ArrayList<>();
        nodes.add(start);
        q.add(new int[]{0, 1});
        Set<String> visited = new HashSet<>();
        visited.add(start);
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            String word = nodes.get(cur[0]);
            int dist = cur[1];
            if (word.equals(goal)) return dist;
            char[] arr = word.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    arr[i] = c;
                    String nxt = new String(arr);
                    if (wordSet.contains(nxt) && !visited.contains(nxt)) {
                        visited.add(nxt);
                        nodes.add(nxt);
                        q.add(new int[]{nodes.size() - 1, dist + 1});
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
    int chainLength(string start, string goal, vector<string>& words) {
        unordered_set<string> wordSet(words.begin(), words.end());
        if (!wordSet.count(goal)) return 0;
        queue<pair<string,int>> q;
        q.push({start, 1});
        unordered_set<string> visited;
        visited.insert(start);
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == goal) return dist;
            for (size_t i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == orig) continue;
                    word[i] = c;
                    if (wordSet.count(word) && !visited.count(word)) {
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

  // equalXorPairs(nums: List[int], target: int) -> int  — count pairs with xor==target.
  'pghub-b43-xor-pairs': {
    javascript: `var equalXorPairs = function(nums, target) {
    const seen = new Map();
    let count = 0;
    for (const x of nums) {
        count += seen.get(x ^ target) || 0;
        seen.set(x, (seen.get(x) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int equalXorPairs(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        long count = 0;
        for (int x : nums) {
            count += seen.getOrDefault(x ^ target, 0);
            seen.merge(x, 1, Integer::sum);
        }
        return (int) count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int equalXorPairs(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        long long count = 0;
        for (int x : nums) {
            auto it = seen.find(x ^ target);
            if (it != seen.end()) count += it->second;
            seen[x]++;
        }
        return (int)count;
    }
};`,
  },

  // zigzagMerge(a: List[int], b: List[int]) -> List[int]  — interleave, append remainder.
  'pghub-b43-zigzag-merge': {
    javascript: `var zigzagMerge = function(a, b) {
    const res = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
        if (i < a.length) { res.push(a[i]); i++; }
        if (j < b.length) { res.push(b[j]); j++; }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] zigzagMerge(int[] a, int[] b) {
        List<Integer> res = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.length || j < b.length) {
            if (i < a.length) { res.add(a[i]); i++; }
            if (j < b.length) { res.add(b[j]); j++; }
        }
        int[] out = new int[res.size()];
        for (int k = 0; k < out.length; k++) out[k] = res.get(k);
        return out;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> zigzagMerge(vector<int>& a, vector<int>& b) {
        vector<int> res;
        size_t i = 0, j = 0;
        while (i < a.size() || j < b.size()) {
            if (i < a.size()) { res.push_back(a[i]); i++; }
            if (j < b.size()) { res.push_back(b[j]); j++; }
        }
        return res;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max nesting depth of parentheses.
  'pghub-b44-bracket-depth': {
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

  // countInRange(tree: List[int], lo: int, hi: int) -> int  — count vals in [lo,hi], skip -1.
  'pghub-b44-bst-range-count': {
    javascript: `var countInRange = function(tree, lo, hi) {
    let count = 0;
    for (const v of tree) {
        if (v !== -1 && v >= lo && v <= hi) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countInRange(int[] tree, int lo, int hi) {
        int count = 0;
        for (int v : tree) {
            if (v != -1 && v >= lo && v <= hi) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countInRange(vector<int>& tree, int lo, int hi) {
        int count = 0;
        for (int v : tree) {
            if (v != -1 && v >= lo && v <= hi) count++;
        }
        return count;
    }
};`,
  },

  // circularRob(houses: List[int]) -> int  — house robber on a circle.
  'pghub-b44-circular-rob': {
    javascript: `var circularRob = function(houses) {
    const n = houses.length;
    if (n === 1) return houses[0];
    const robLine = (lo, hi) => {
        let prev = 0, cur = 0;
        for (let i = lo; i < hi; i++) {
            const t = Math.max(cur, prev + houses[i]);
            prev = cur; cur = t;
        }
        return cur;
    };
    return Math.max(robLine(0, n - 1), robLine(1, n));
};`,
    java: `class Solution {
    public int circularRob(int[] houses) {
        int n = houses.length;
        if (n == 1) return houses[0];
        return Math.max(robLine(houses, 0, n - 1), robLine(houses, 1, n));
    }
    private int robLine(int[] houses, int lo, int hi) {
        int prev = 0, cur = 0;
        for (int i = lo; i < hi; i++) {
            int t = Math.max(cur, prev + houses[i]);
            prev = cur; cur = t;
        }
        return cur;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int circularRob(vector<int>& houses) {
        int n = houses.size();
        if (n == 1) return houses[0];
        auto robLine = [&](int lo, int hi) {
            int prev = 0, cur = 0;
            for (int i = lo; i < hi; i++) {
                int t = max(cur, prev + houses[i]);
                prev = cur; cur = t;
            }
            return cur;
        };
        return max(robLine(0, n - 1), robLine(1, n));
    }
};`,
  },

  // closestPairSum(nums: List[int], target: int) -> int  — two-pointer closest pair sum (ties: smaller sum).
  'pghub-b44-closest-pair-sum': {
    javascript: `var closestPairSum = function(nums, target) {
    const arr = nums.slice().sort((a, b) => a - b);
    let lo = 0, hi = arr.length - 1;
    let best = null;
    while (lo < hi) {
        const s = arr[lo] + arr[hi];
        if (best === null || Math.abs(s - target) < Math.abs(best - target) ||
            (Math.abs(s - target) === Math.abs(best - target) && s < best)) {
            best = s;
        }
        if (s < target) lo++;
        else if (s > target) hi--;
        else return s;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int closestPairSum(int[] nums, int target) {
        int[] arr = nums.clone();
        Arrays.sort(arr);
        int lo = 0, hi = arr.length - 1;
        Integer best = null;
        while (lo < hi) {
            int s = arr[lo] + arr[hi];
            if (best == null || Math.abs(s - target) < Math.abs(best - target) ||
                (Math.abs(s - target) == Math.abs(best - target) && s < best)) {
                best = s;
            }
            if (s < target) lo++;
            else if (s > target) hi--;
            else return s;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairSum(vector<int>& nums, int target) {
        vector<int> arr = nums;
        sort(arr.begin(), arr.end());
        int lo = 0, hi = (int)arr.size() - 1;
        bool has = false;
        int best = 0;
        while (lo < hi) {
            int s = arr[lo] + arr[hi];
            if (!has || abs(s - target) < abs(best - target) ||
                (abs(s - target) == abs(best - target) && s < best)) {
                best = s; has = true;
            }
            if (s < target) lo++;
            else if (s > target) hi--;
            else return s;
        }
        return best;
    }
};`,
  },

  // distinctPerms(s: str) -> int  — count distinct permutations via char-count backtrack.
  'pghub-b44-distinct-perms': {
    javascript: `var distinctPerms = function(s) {
    const counts = new Map();
    for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
    const keys = [...counts.keys()];
    let result = 0;
    const backtrack = (remaining) => {
        if (remaining === 0) { result++; return; }
        for (const ch of keys) {
            if (counts.get(ch) > 0) {
                counts.set(ch, counts.get(ch) - 1);
                backtrack(remaining - 1);
                counts.set(ch, counts.get(ch) + 1);
            }
        }
    };
    backtrack(s.length);
    return result;
};`,
    java: `import java.util.*;
class Solution {
    private int result = 0;
    public int distinctPerms(String s) {
        Map<Character, Integer> counts = new LinkedHashMap<>();
        for (char ch : s.toCharArray()) counts.merge(ch, 1, Integer::sum);
        List<Character> keys = new ArrayList<>(counts.keySet());
        backtrack(s.length(), keys, counts);
        return result;
    }
    private void backtrack(int remaining, List<Character> keys, Map<Character, Integer> counts) {
        if (remaining == 0) { result++; return; }
        for (char ch : keys) {
            if (counts.get(ch) > 0) {
                counts.put(ch, counts.get(ch) - 1);
                backtrack(remaining - 1, keys, counts);
                counts.put(ch, counts.get(ch) + 1);
            }
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int distinctPerms(string s) {
        map<char,int> counts;
        for (char ch : s) counts[ch]++;
        vector<char> keys;
        for (auto& kv : counts) keys.push_back(kv.first);
        int result = 0;
        function<void(int)> backtrack = [&](int remaining) {
            if (remaining == 0) { result++; return; }
            for (char ch : keys) {
                if (counts[ch] > 0) {
                    counts[ch]--;
                    backtrack(remaining - 1);
                    counts[ch]++;
                }
            }
        };
        backtrack((int)s.size());
        return result;
    }
};`,
  },

  // trailingZeros(n: int) -> int  — count factors of 5 in n!.
  'pghub-b44-factorial-zeros': {
    javascript: `var trailingZeros = function(n) {
    let count = 0, p = 5;
    while (p <= n) {
        count += Math.floor(n / p);
        p *= 5;
    }
    return count;
};`,
    java: `class Solution {
    public int trailingZeros(int n) {
        int count = 0;
        long p = 5;
        while (p <= n) {
            count += n / p;
            p *= 5;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trailingZeros(int n) {
        int count = 0;
        long long p = 5;
        while (p <= n) {
            count += n / p;
            p *= 5;
        }
        return count;
    }
};`,
  },

  // intSqrt(x: int) -> int  — integer sqrt via binary search.
  'pghub-b44-int-sqrt': {
    javascript: `var intSqrt = function(x) {
    if (x < 2) return x;
    let lo = 1, hi = x, ans = 1;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (mid * mid <= x) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
};`,
    java: `class Solution {
    public int intSqrt(int x) {
        if (x < 2) return x;
        long lo = 1, hi = x, ans = 1;
        while (lo <= hi) {
            long mid = (lo + hi) / 2;
            if (mid * mid <= x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int) ans;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int intSqrt(int x) {
        if (x < 2) return x;
        long long lo = 1, hi = x, ans = 1;
        while (lo <= hi) {
            long long mid = (lo + hi) / 2;
            if (mid * mid <= (long long)x) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return (int) ans;
    }
};`,
  },

  // kthLargest(nums: List[int], k: int) -> int  — min-heap of size k.
  'pghub-b44-kth-largest': {
    javascript: `var kthLargest = function(nums, k) {
    const heap = [];
    const up = (i) => {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] <= heap[i]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const down = (i) => {
        const n = heap.length;
        while (true) {
            let s = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && heap[l] < heap[s]) s = l;
            if (r < n && heap[r] < heap[s]) s = r;
            if (s === i) break;
            [heap[s], heap[i]] = [heap[i], heap[s]];
            i = s;
        }
    };
    for (const x of nums) {
        heap.push(x); up(heap.length - 1);
        if (heap.length > k) {
            heap[0] = heap[heap.length - 1];
            heap.pop();
            down(0);
        }
    }
    return heap[0];
};`,
    java: `import java.util.*;
class Solution {
    public int kthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int x : nums) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();
        }
        return heap.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap;
        for (int x : nums) {
            heap.push(x);
            if ((int)heap.size() > k) heap.pop();
        }
        return heap.top();
    }
};`,
  },

  // longestAtMostK(nums: List[int], k: int) -> int  — longest window with sum<=k (non-neg).
  'pghub-b44-longest-le-k': {
    javascript: `var longestAtMostK = function(nums, k) {
    let left = 0, cur = 0, best = 0;
    for (let right = 0; right < nums.length; right++) {
        cur += nums[right];
        while (cur > k) { cur -= nums[left]; left++; }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestAtMostK(int[] nums, int k) {
        int left = 0, cur = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            cur += nums[right];
            while (cur > k) { cur -= nums[left]; left++; }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestAtMostK(vector<int>& nums, int k) {
        int left = 0, cur = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            cur += nums[right];
            while (cur > k) { cur -= nums[left]; left++; }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // coveredLength(intervals: List[List[int]]) -> int  — total covered length after merge.
  'pghub-b44-merged-coverage': {
    javascript: `var coveredLength = function(intervals) {
    const order = intervals.slice().sort((a, b) => a[0] - b[0]);
    let total = 0;
    let curStart = order[0][0], curEnd = order[0][1];
    for (let i = 1; i < order.length; i++) {
        const s = order[i][0], e = order[i][1];
        if (s <= curEnd) {
            if (e > curEnd) curEnd = e;
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
    public int coveredLength(int[][] intervals) {
        int[][] order = intervals.clone();
        Arrays.sort(order, (a, b) -> Integer.compare(a[0], b[0]));
        int total = 0;
        int curStart = order[0][0], curEnd = order[0][1];
        for (int i = 1; i < order.length; i++) {
            int s = order[i][0], e = order[i][1];
            if (s <= curEnd) {
                if (e > curEnd) curEnd = e;
            } else {
                total += curEnd - curStart;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int coveredLength(vector<vector<int>>& intervals) {
        vector<vector<int>> order = intervals;
        sort(order.begin(), order.end(), [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        int total = 0;
        int curStart = order[0][0], curEnd = order[0][1];
        for (size_t i = 1; i < order.size(); i++) {
            int s = order[i][0], e = order[i][1];
            if (s <= curEnd) {
                if (e > curEnd) curEnd = e;
            } else {
                total += curEnd - curStart;
                curStart = s; curEnd = e;
            }
        }
        total += curEnd - curStart;
        return total;
    }
};`,
  },

  // minCoins(amount: int) -> int  — greedy US coins.
  'pghub-b44-min-coins-greedy': {
    javascript: `var minCoins = function(amount) {
    const coins = [25, 10, 5, 1];
    let count = 0;
    for (const c of coins) {
        count += Math.floor(amount / c);
        amount %= c;
    }
    return count;
};`,
    java: `class Solution {
    public int minCoins(int amount) {
        int[] coins = {25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCoins(int amount) {
        int coins[] = {25, 10, 5, 1};
        int count = 0;
        for (int c : coins) {
            count += amount / c;
            amount %= c;
        }
        return count;
    }
};`,
  },

  // runLength(s: str) -> str  — run-length encode.
  'pghub-b44-run-length': {
    javascript: `var runLength = function(s) {
    if (!s) return "";
    const out = [];
    let cur = s[0], count = 1;
    for (let i = 1; i < s.length; i++) {
        const ch = s[i];
        if (ch === cur) count++;
        else { out.push(cur + count); cur = ch; count = 1; }
    }
    out.push(cur + count);
    return out.join("");
};`,
    java: `class Solution {
    public String runLength(String s) {
        if (s == null || s.isEmpty()) return "";
        StringBuilder out = new StringBuilder();
        char cur = s.charAt(0);
        int count = 1;
        for (int i = 1; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == cur) count++;
            else { out.append(cur).append(count); cur = ch; count = 1; }
        }
        out.append(cur).append(count);
        return out.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string runLength(string s) {
        if (s.empty()) return "";
        string out;
        char cur = s[0];
        int count = 1;
        for (size_t i = 1; i < s.size(); i++) {
            char ch = s[i];
            if (ch == cur) count++;
            else { out += cur; out += to_string(count); cur = ch; count = 1; }
        }
        out += cur; out += to_string(count);
        return out;
    }
};`,
  },

  // secondLargest(nums: List[int]) -> int  — distinct 2nd largest or -1.
  'pghub-b44-second-largest': {
    javascript: `var secondLargest = function(nums) {
    let first = null, second = null;
    for (const x of nums) {
        if (first === null || x > first) {
            if (first !== null) second = first;
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
                if (first != null) second = first;
                first = x;
            } else if (x != first && (second == null || x > second)) {
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
        int first = 0, second = 0;
        for (int x : nums) {
            if (!hasFirst || x > first) {
                if (hasFirst) { second = first; hasSecond = true; }
                first = x; hasFirst = true;
            } else if (x != first && (!hasSecond || x > second)) {
                second = x; hasSecond = true;
            }
        }
        return hasSecond ? second : -1;
    }
};`,
  },

  // shortestHops(n: int, edges: List[List[int]], src: int, dst: int) -> int  — undirected BFS.
  'pghub-b44-shortest-path-len': {
    javascript: `var shortestHops = function(n, edges, src, dst) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const dist = new Array(n).fill(-1);
    dist[src] = 0;
    const queue = [src];
    let qi = 0;
    while (qi < queue.length) {
        const node = queue[qi++];
        if (node === dst) return dist[node];
        for (const nxt of adj[node]) {
            if (dist[nxt] === -1) { dist[nxt] = dist[node] + 1; queue.push(nxt); }
        }
    }
    return dist[dst];
};`,
    java: `import java.util.*;
class Solution {
    public int shortestHops(int n, int[][] edges, int src, int dst) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[src] = 0;
        Deque<Integer> queue = new ArrayDeque<>();
        queue.add(src);
        while (!queue.isEmpty()) {
            int node = queue.poll();
            if (node == dst) return dist[node];
            for (int nxt : adj.get(node)) {
                if (dist[nxt] == -1) { dist[nxt] = dist[node] + 1; queue.add(nxt); }
            }
        }
        return dist[dst];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int shortestHops(int n, vector<vector<int>>& edges, int src, int dst) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        vector<int> dist(n, -1);
        dist[src] = 0;
        queue<int> q;
        q.push(src);
        while (!q.empty()) {
            int node = q.front(); q.pop();
            if (node == dst) return dist[node];
            for (int nxt : adj[node]) {
                if (dist[nxt] == -1) { dist[nxt] = dist[node] + 1; q.push(nxt); }
            }
        }
        return dist[dst];
    }
};`,
  },

  // totalSetBits(nums: List[int]) -> int  — sum of popcounts via Brian Kernighan.
  'pghub-b44-total-set-bits': {
    javascript: `var totalSetBits = function(nums) {
    let total = 0;
    for (let x of nums) {
        while (x) { x &= x - 1; total++; }
    }
    return total;
};`,
    java: `class Solution {
    public int totalSetBits(int[] nums) {
        int total = 0;
        for (int x : nums) {
            while (x != 0) { x &= x - 1; total++; }
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalSetBits(vector<int>& nums) {
        int total = 0;
        for (int x : nums) {
            while (x) { x &= x - 1; total++; }
        }
        return total;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max paren nesting depth (b45 variant).
  'pghub-b45-bracket-depth': {
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

  // rangeSum(tree: List[int], lo: int, hi: int) -> int  — heap-array DFS, sum vals in [lo,hi].
  'pghub-b45-bst-range-sum': {
    javascript: `var rangeSum = function(tree, lo, hi) {
    if (!tree || tree.length === 0 || tree[0] === -1) return 0;
    const n = tree.length;
    let total = 0;
    const stack = [0];
    while (stack.length) {
        const idx = stack.pop();
        if (idx >= n || tree[idx] === -1) continue;
        const val = tree[idx];
        if (val >= lo && val <= hi) total += val;
        stack.push(2 * idx + 1);
        stack.push(2 * idx + 2);
    }
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int rangeSum(int[] tree, int lo, int hi) {
        if (tree == null || tree.length == 0 || tree[0] == -1) return 0;
        int n = tree.length, total = 0;
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(0);
        while (!stack.isEmpty()) {
            int idx = stack.pop();
            if (idx >= n || tree[idx] == -1) continue;
            int val = tree[idx];
            if (val >= lo && val <= hi) total += val;
            stack.push(2 * idx + 1);
            stack.push(2 * idx + 2);
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rangeSum(vector<int>& tree, int lo, int hi) {
        if (tree.empty() || tree[0] == -1) return 0;
        int n = tree.size(), total = 0;
        vector<int> stack = {0};
        while (!stack.empty()) {
            int idx = stack.back(); stack.pop_back();
            if (idx >= n || tree[idx] == -1) continue;
            int val = tree[idx];
            if (val >= lo && val <= hi) total += val;
            stack.push_back(2 * idx + 1);
            stack.push_back(2 * idx + 2);
        }
        return total;
    }
};`,
  },

  // minCoins(coins: List[int], amount: int) -> int  — coin-change DP, -1 if impossible.
  'pghub-b45-coin-min': {
    javascript: `var minCoins = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++) {
        for (const c of coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
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
        return dp[amount] > amount ? -1 : dp[amount];
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
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
  },

  // diagonalDiff(matrix: List[List[int]]) -> int  — |primary diag - secondary diag|.
  'pghub-b45-diagonal-sum': {
    javascript: `var diagonalDiff = function(matrix) {
    const n = matrix.length;
    let primary = 0, secondary = 0;
    for (let i = 0; i < n; i++) {
        primary += matrix[i][i];
        secondary += matrix[i][n - 1 - i];
    }
    return Math.abs(primary - secondary);
};`,
    java: `class Solution {
    public int diagonalDiff(int[][] matrix) {
        int n = matrix.length;
        int primary = 0, secondary = 0;
        for (int i = 0; i < n; i++) {
            primary += matrix[i][i];
            secondary += matrix[i][n - 1 - i];
        }
        return Math.abs(primary - secondary);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int diagonalDiff(vector<vector<int>>& matrix) {
        int n = matrix.size();
        int primary = 0, secondary = 0;
        for (int i = 0; i < n; i++) {
            primary += matrix[i][i];
            secondary += matrix[i][n - 1 - i];
        }
        return abs(primary - secondary);
    }
};`,
  },

  // editDistance(a: str, b: str) -> int  — Levenshtein DP, rolling rows.
  'pghub-b45-edit-distance': {
    javascript: `var editDistance = function(a, b) {
    const m = a.length, n = b.length;
    let prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        const cur = new Array(n + 1);
        cur[0] = i;
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) cur[j] = prev[j - 1];
            else cur[j] = 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
        }
        prev = cur;
    }
    return prev[n];
};`,
    java: `class Solution {
    public int editDistance(String a, String b) {
        int m = a.length(), n = b.length();
        int[] prev = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            int[] cur = new int[n + 1];
            cur[0] = i;
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) cur[j] = prev[j - 1];
                else cur[j] = 1 + Math.min(prev[j], Math.min(cur[j - 1], prev[j - 1]));
            }
            prev = cur;
        }
        return prev[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int editDistance(string a, string b) {
        int m = a.size(), n = b.size();
        vector<int> prev(n + 1);
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            vector<int> cur(n + 1);
            cur[0] = i;
            for (int j = 1; j <= n; j++) {
                if (a[i - 1] == b[j - 1]) cur[j] = prev[j - 1];
                else cur[j] = 1 + min({prev[j], cur[j - 1], prev[j - 1]});
            }
            prev = cur;
        }
        return prev[n];
    }
};`,
  },

  // minMaxBox(gifts: List[int], boxes: int) -> int  — binary search on max box capacity.
  'pghub-b45-gift-distribution': {
    javascript: `var minMaxBox = function(gifts, boxes) {
    const feasible = (cap) => {
        let used = 1, cur = 0;
        for (const g of gifts) {
            if (cur + g > cap) { used++; cur = 0; }
            cur += g;
        }
        return used <= boxes;
    };
    let lo = Math.max(...gifts), hi = gifts.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (feasible(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minMaxBox(int[] gifts, int boxes) {
        int lo = 0; long hi = 0;
        for (int g : gifts) { lo = Math.max(lo, g); hi += g; }
        long l = lo, h = hi;
        while (l < h) {
            long mid = (l + h) / 2;
            if (feasible(gifts, boxes, mid)) h = mid;
            else l = mid + 1;
        }
        return (int) l;
    }
    private boolean feasible(int[] gifts, int boxes, long cap) {
        int used = 1; long cur = 0;
        for (int g : gifts) {
            if (cur + g > cap) { used++; cur = 0; }
            cur += g;
        }
        return used <= boxes;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minMaxBox(vector<int>& gifts, int boxes) {
        long long lo = 0, hi = 0;
        for (int g : gifts) { lo = max(lo, (long long)g); hi += g; }
        auto feasible = [&](long long cap) {
            int used = 1; long long cur = 0;
            for (int g : gifts) {
                if (cur + g > cap) { used++; cur = 0; }
                cur += g;
            }
            return used <= boxes;
        };
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (feasible(mid)) hi = mid;
            else lo = mid + 1;
        }
        return (int) lo;
    }
};`,
  },

  // isBipartite(edges: List[List[int]], n: int) -> bool  — BFS 2-coloring.
  'pghub-b45-graph-bipartite': {
    javascript: `var isBipartite = function(edges, n) {
    const adj = Array.from({length: n}, () => []);
    for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
    const color = new Array(n).fill(-1);
    for (let start = 0; start < n; start++) {
        if (color[start] !== -1) continue;
        color[start] = 0;
        const queue = [start];
        let qi = 0;
        while (qi < queue.length) {
            const u = queue[qi++];
            for (const w of adj[u]) {
                if (color[w] === -1) { color[w] = 1 - color[u]; queue.push(w); }
                else if (color[w] === color[u]) return false;
            }
        }
    }
    return true;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isBipartite(int[][] edges, int n) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        int[] color = new int[n];
        Arrays.fill(color, -1);
        for (int start = 0; start < n; start++) {
            if (color[start] != -1) continue;
            color[start] = 0;
            Deque<Integer> queue = new ArrayDeque<>();
            queue.add(start);
            while (!queue.isEmpty()) {
                int u = queue.poll();
                for (int w : adj.get(u)) {
                    if (color[w] == -1) { color[w] = 1 - color[u]; queue.add(w); }
                    else if (color[w] == color[u]) return false;
                }
            }
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isBipartite(vector<vector<int>>& edges, int n) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        vector<int> color(n, -1);
        for (int start = 0; start < n; start++) {
            if (color[start] != -1) continue;
            color[start] = 0;
            queue<int> q;
            q.push(start);
            while (!q.empty()) {
                int u = q.front(); q.pop();
                for (int w : adj[u]) {
                    if (color[w] == -1) { color[w] = 1 - color[u]; q.push(w); }
                    else if (color[w] == color[u]) return false;
                }
            }
        }
        return true;
    }
};`,
  },

  // totalPresses(text: str) -> int  — sum keypad press cost per char.
  'pghub-b45-keypad-presses': {
    javascript: `var totalPresses = function(text) {
    const groups = ["abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
    const cost = {};
    for (const g of groups) {
        for (let i = 0; i < g.length; i++) cost[g[i]] = i + 1;
    }
    let total = 0;
    for (const c of text) total += cost[c];
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int totalPresses(String text) {
        String[] groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        Map<Character, Integer> cost = new HashMap<>();
        for (String g : groups) {
            for (int i = 0; i < g.length(); i++) cost.put(g.charAt(i), i + 1);
        }
        int total = 0;
        for (int i = 0; i < text.length(); i++) total += cost.get(text.charAt(i));
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int totalPresses(string text) {
        vector<string> groups = {"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        unordered_map<char,int> cost;
        for (const string& g : groups) {
            for (int i = 0; i < (int)g.size(); i++) cost[g[i]] = i + 1;
        }
        int total = 0;
        for (char c : text) total += cost[c];
        return total;
    }
};`,
  },

  // clampSum(nums: List[int], lo: int, hi: int) -> int  — sum after clamping each to [lo,hi].
  'pghub-b45-roman-clamp': {
    javascript: `var clampSum = function(nums, lo, hi) {
    let total = 0;
    for (const x of nums) {
        if (x < lo) total += lo;
        else if (x > hi) total += hi;
        else total += x;
    }
    return total;
};`,
    java: `class Solution {
    public int clampSum(int[] nums, int lo, int hi) {
        int total = 0;
        for (int x : nums) {
            if (x < lo) total += lo;
            else if (x > hi) total += hi;
            else total += x;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int clampSum(vector<int>& nums, int lo, int hi) {
        int total = 0;
        for (int x : nums) {
            if (x < lo) total += lo;
            else if (x > hi) total += hi;
            else total += x;
        }
        return total;
    }
};`,
  },

  // rotateRight(nums: List[int], k: int) -> List[int]  — rotate array right by k.
  'pghub-b45-rotate-array': {
    javascript: `var rotateRight = function(nums, k) {
    const n = nums.length;
    k %= n;
    if (k === 0) return nums.slice();
    return nums.slice(n - k).concat(nums.slice(0, n - k));
};`,
    java: `class Solution {
    public int[] rotateRight(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[(i + k) % n] = nums[i];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> rotateRight(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;
        vector<int> res(n);
        for (int i = 0; i < n; i++) res[(i + k) % n] = nums[i];
        return res;
    }
};`,
  },
};
