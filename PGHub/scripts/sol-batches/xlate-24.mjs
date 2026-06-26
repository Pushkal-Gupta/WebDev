// xlate-24: slice [93,124) of unstaged pyReal targets missing js/java/cpp.
// Faithful translations of each verified Python canonical. Signatures match
// generateTemplate(...) exactly (camelCase methods; cpp vectors/strings by &).
// SKIPPED: pghub-b48-tree-tilt — its List[int] param is an array-encoded tree
// whose test inputs carry the `null` sentinel (e.g. [4,2,9,3,5,null,7]); the
// int-array driver can't represent null, so it's not gradeable.
export default {
  // partitionParity(nums: List[int]) -> List[int]  — evens preserved, then odds.
  'pghub-b47-stable-partition': {
    javascript: `var partitionParity = function(nums) {
    const evens = [], odds = [];
    for (const x of nums) {
        if (x % 2 === 0) evens.push(x);
        else odds.push(x);
    }
    return evens.concat(odds);
};`,
    java: `import java.util.*;
class Solution {
    public int[] partitionParity(int[] nums) {
        int[] res = new int[nums.length];
        int p = 0;
        for (int x : nums) if (x % 2 == 0) res[p++] = x;
        for (int x : nums) if (x % 2 != 0) res[p++] = x;
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> partitionParity(vector<int>& nums) {
        vector<int> evens, odds;
        for (int x : nums) {
            if (x % 2 == 0) evens.push_back(x);
            else odds.push_back(x);
        }
        for (int x : odds) evens.push_back(x);
        return evens;
    }
};`,
  },

  // droppedRequests(arrivals: List[int], capacity: int) -> int  — token bucket.
  'pghub-b47-token-bucket': {
    javascript: `var droppedRequests = function(arrivals, capacity) {
    let tokens = 0, dropped = 0;
    for (const a of arrivals) {
        tokens = Math.min(tokens + 1, capacity);
        const served = Math.min(tokens, a);
        tokens -= served;
        dropped += a - served;
    }
    return dropped;
};`,
    java: `class Solution {
    public int droppedRequests(int[] arrivals, int capacity) {
        int tokens = 0, dropped = 0;
        for (int a : arrivals) {
            tokens = Math.min(tokens + 1, capacity);
            int served = Math.min(tokens, a);
            tokens -= served;
            dropped += a - served;
        }
        return dropped;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int droppedRequests(vector<int>& arrivals, int capacity) {
        int tokens = 0, dropped = 0;
        for (int a : arrivals) {
            tokens = min(tokens + 1, capacity);
            int served = min(tokens, a);
            tokens -= served;
            dropped += a - served;
        }
        return dropped;
    }
};`,
  },

  // shortestPrefixes(words: List[str]) -> List[str]  — unique-prefix per word.
  'pghub-b47-trie-prefix': {
    javascript: `var shortestPrefixes = function(words) {
    const count = new Map();
    for (const w of words) {
        for (let i = 1; i <= w.length; i++) {
            const p = w.slice(0, i);
            count.set(p, (count.get(p) || 0) + 1);
        }
    }
    const res = [];
    for (const w of words) {
        let chosen = w;
        for (let i = 1; i <= w.length; i++) {
            const p = w.slice(0, i);
            if (count.get(p) === 1) { chosen = p; break; }
        }
        res.push(chosen);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public String[] shortestPrefixes(String[] words) {
        Map<String, Integer> count = new HashMap<>();
        for (String w : words)
            for (int i = 1; i <= w.length(); i++) {
                String p = w.substring(0, i);
                count.merge(p, 1, Integer::sum);
            }
        String[] res = new String[words.length];
        for (int j = 0; j < words.length; j++) {
            String w = words[j];
            String chosen = w;
            for (int i = 1; i <= w.length(); i++) {
                String p = w.substring(0, i);
                if (count.get(p) == 1) { chosen = p; break; }
            }
            res[j] = chosen;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> shortestPrefixes(vector<string>& words) {
        unordered_map<string, int> count;
        for (auto& w : words)
            for (size_t i = 1; i <= w.size(); i++)
                count[w.substr(0, i)]++;
        vector<string> res;
        for (auto& w : words) {
            string chosen = w;
            for (size_t i = 1; i <= w.size(); i++) {
                string p = w.substr(0, i);
                if (count[p] == 1) { chosen = p; break; }
            }
            res.push_back(chosen);
        }
        return res;
    }
};`,
  },

  // mergeShelves(shelves: List[List[int]]) -> List[List[int]]  — merge touching+overlapping (gap<=1).
  'pghub-b47-warehouse-merge': {
    javascript: `var mergeShelves = function(shelves) {
    const order = shelves.slice().sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [s, e] of order) {
        if (merged.length && s <= merged[merged.length - 1][1] + 1) {
            if (e > merged[merged.length - 1][1]) merged[merged.length - 1][1] = e;
        } else {
            merged.push([s, e]);
        }
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeShelves(int[][] shelves) {
        int[][] order = shelves.clone();
        Arrays.sort(order, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : order) {
            int s = iv[0], e = iv[1];
            if (!merged.isEmpty() && s <= merged.get(merged.size() - 1)[1] + 1) {
                if (e > merged.get(merged.size() - 1)[1]) merged.get(merged.size() - 1)[1] = e;
            } else {
                merged.add(new int[]{s, e});
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
        vector<vector<int>> order = shelves;
        sort(order.begin(), order.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        for (auto& iv : order) {
            int s = iv[0], e = iv[1];
            if (!merged.empty() && s <= merged.back()[1] + 1) {
                if (e > merged.back()[1]) merged.back()[1] = e;
            } else {
                merged.push_back({s, e});
            }
        }
        return merged;
    }
};`,
  },

  // subsetXorSum(nums: List[int]) -> int  — OR of all, shifted by n-1.
  'pghub-b48-bitset-subsets': {
    javascript: `var subsetXorSum = function(nums) {
    let bits = 0;
    for (const x of nums) bits |= x;
    return bits * Math.pow(2, nums.length - 1);
};`,
    java: `class Solution {
    public int subsetXorSum(int[] nums) {
        int bits = 0;
        for (int x : nums) bits |= x;
        return bits << (nums.length - 1);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subsetXorSum(vector<int>& nums) {
        int bits = 0;
        for (int x : nums) bits |= x;
        return bits << ((int)nums.size() - 1);
    }
};`,
  },

  // numDecodings(s: str) -> int  — DP.
  'pghub-b48-decode-ways': {
    javascript: `var numDecodings = function(s) {
    if (!s || s[0] === '0') return 0;
    let prev2 = 1, prev1 = 1;
    for (let i = 1; i < s.length; i++) {
        let cur = 0;
        if (s[i] !== '0') cur += prev1;
        const two = parseInt(s.slice(i - 1, i + 1), 10);
        if (two >= 10 && two <= 26) cur += prev2;
        if (cur === 0) return 0;
        prev2 = prev1;
        prev1 = cur;
    }
    return prev1;
};`,
    java: `class Solution {
    public int numDecodings(String s) {
        if (s == null || s.isEmpty() || s.charAt(0) == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < s.length(); i++) {
            int cur = 0;
            if (s.charAt(i) != '0') cur += prev1;
            int two = Integer.parseInt(s.substring(i - 1, i + 1));
            if (two >= 10 && two <= 26) cur += prev2;
            if (cur == 0) return 0;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numDecodings(string s) {
        if (s.empty() || s[0] == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (size_t i = 1; i < s.size(); i++) {
            int cur = 0;
            if (s[i] != '0') cur += prev1;
            int two = stoi(s.substr(i - 1, 2));
            if (two >= 10 && two <= 26) cur += prev2;
            if (cur == 0) return 0;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
};`,
  },

  // restFloor(moves: List[int]) -> int  — running sum.
  'pghub-b48-elevator-stops': {
    javascript: `var restFloor = function(moves) {
    let floor = 0;
    for (const m of moves) floor += m;
    return floor;
};`,
    java: `class Solution {
    public int restFloor(int[] moves) {
        int floor = 0;
        for (int m : moves) floor += m;
        return floor;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int restFloor(vector<int>& moves) {
        int floor = 0;
        for (int m : moves) floor += m;
        return floor;
    }
};`,
  },

  // islandPerimeter(grid: List[List[int]]) -> int  — +4 per cell, -2 per shared edge.
  'pghub-b48-island-perimeter': {
    javascript: `var islandPerimeter = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let perim = 0;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            if (grid[r][c] === 1) {
                perim += 4;
                if (r > 0 && grid[r - 1][c] === 1) perim -= 2;
                if (c > 0 && grid[r][c - 1] === 1) perim -= 2;
            }
    return perim;
};`,
    java: `class Solution {
    public int islandPerimeter(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, perim = 0;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
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
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == 1) {
                    perim += 4;
                    if (r > 0 && grid[r - 1][c] == 1) perim -= 2;
                    if (c > 0 && grid[r][c - 1] == 1) perim -= 2;
                }
        return perim;
    }
};`,
  },

  // minJumps(nums: List[int]) -> int  — greedy jump-game II.
  'pghub-b48-jump-reach': {
    javascript: `var minJumps = function(nums) {
    const n = nums.length;
    let jumps = 0, curEnd = 0, farthest = 0;
    for (let i = 0; i < n - 1; i++) {
        if (i + nums[i] > farthest) farthest = i + nums[i];
        if (i === curEnd) { jumps++; curEnd = farthest; }
    }
    return jumps;
};`,
    java: `class Solution {
    public int minJumps(int[] nums) {
        int n = nums.length, jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            if (i + nums[i] > farthest) farthest = i + nums[i];
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minJumps(vector<int>& nums) {
        int n = nums.size(), jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            if (i + nums[i] > farthest) farthest = i + nums[i];
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
};`,
  },

  // kthDistinct(arr: List[str], k: int) -> str  — kth string with freq 1, "" if none.
  'pghub-b48-kth-distinct': {
    javascript: `var kthDistinct = function(arr, k) {
    const freq = new Map();
    for (const s of arr) freq.set(s, (freq.get(s) || 0) + 1);
    for (const s of arr) {
        if (freq.get(s) === 1) {
            k--;
            if (k === 0) return s;
        }
    }
    return "";
};`,
    java: `import java.util.*;
class Solution {
    public String kthDistinct(String[] arr, int k) {
        Map<String, Integer> freq = new HashMap<>();
        for (String s : arr) freq.merge(s, 1, Integer::sum);
        for (String s : arr) {
            if (freq.get(s) == 1) {
                k--;
                if (k == 0) return s;
            }
        }
        return "";
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string kthDistinct(vector<string>& arr, int k) {
        unordered_map<string, int> freq;
        for (auto& s : arr) freq[s]++;
        for (auto& s : arr) {
            if (freq[s] == 1) {
                k--;
                if (k == 0) return s;
            }
        }
        return "";
    }
};`,
  },

  // countEvictions(capacity: int, accesses: List[int]) -> int  — LRU evictions count.
  'pghub-b48-lru-evictions': {
    javascript: `var countEvictions = function(capacity, accesses) {
    const cache = new Map();
    let evictions = 0;
    for (const key of accesses) {
        if (cache.has(key)) {
            cache.delete(key);
            cache.set(key, true);
        } else {
            if (cache.size >= capacity) {
                const oldest = cache.keys().next().value;
                cache.delete(oldest);
                evictions++;
            }
            cache.set(key, true);
        }
    }
    return evictions;
};`,
    java: `import java.util.*;
class Solution {
    public int countEvictions(int capacity, int[] accesses) {
        LinkedHashMap<Integer, Boolean> cache = new LinkedHashMap<>();
        int evictions = 0;
        for (int key : accesses) {
            if (cache.containsKey(key)) {
                cache.remove(key);
                cache.put(key, true);
            } else {
                if (cache.size() >= capacity) {
                    int oldest = cache.keySet().iterator().next();
                    cache.remove(oldest);
                    evictions++;
                }
                cache.put(key, true);
            }
        }
        return evictions;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countEvictions(int capacity, vector<int>& accesses) {
        list<int> order;
        unordered_map<int, list<int>::iterator> pos;
        int evictions = 0;
        for (int key : accesses) {
            auto it = pos.find(key);
            if (it != pos.end()) {
                order.erase(it->second);
                order.push_back(key);
                pos[key] = prev(order.end());
            } else {
                if ((int)order.size() >= capacity) {
                    int oldest = order.front();
                    order.pop_front();
                    pos.erase(oldest);
                    evictions++;
                }
                order.push_back(key);
                pos[key] = prev(order.end());
            }
        }
        return evictions;
    }
};`,
  },

  // minRooms(meetings: List[List[int]]) -> int  — sweep starts vs sorted ends.
  'pghub-b48-meeting-rooms': {
    javascript: `var minRooms = function(meetings) {
    const starts = meetings.map(m => m[0]).sort((a, b) => a - b);
    const ends = meetings.map(m => m[1]).sort((a, b) => a - b);
    let rooms = 0, best = 0, j = 0;
    for (const s of starts) {
        while (j < ends.length && ends[j] <= s) { rooms--; j++; }
        rooms++;
        if (rooms > best) best = rooms;
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int minRooms(int[][] meetings) {
        int n = meetings.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) { starts[i] = meetings[i][0]; ends[i] = meetings[i][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, best = 0, j = 0;
        for (int s : starts) {
            while (j < n && ends[j] <= s) { rooms--; j++; }
            rooms++;
            if (rooms > best) best = rooms;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minRooms(vector<vector<int>>& meetings) {
        vector<int> starts, ends;
        for (auto& m : meetings) { starts.push_back(m[0]); ends.push_back(m[1]); }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0, best = 0, j = 0;
        for (int s : starts) {
            while (j < (int)ends.size() && ends[j] <= s) { rooms--; j++; }
            rooms++;
            if (rooms > best) best = rooms;
        }
        return best;
    }
};`,
  },

  // countPairs(nums: List[int], target: int) -> int  — hash count complements.
  'pghub-b48-pair-target': {
    javascript: `var countPairs = function(nums, target) {
    const seen = new Map();
    let count = 0;
    for (const x of nums) {
        count += seen.get(target - x) || 0;
        seen.set(x, (seen.get(x) || 0) + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countPairs(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        int count = 0;
        for (int x : nums) {
            count += seen.getOrDefault(target - x, 0);
            seen.merge(x, 1, Integer::sum);
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPairs(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        int count = 0;
        for (int x : nums) {
            auto it = seen.find(target - x);
            if (it != seen.end()) count += it->second;
            seen[x]++;
        }
        return count;
    }
};`,
  },

  // sortedSquares(nums: List[int]) -> List[int]  — two-pointer from ends.
  'pghub-b48-sorted-square': {
    javascript: `var sortedSquares = function(nums) {
    const n = nums.length;
    const res = new Array(n);
    let lo = 0, hi = n - 1;
    for (let pos = n - 1; pos >= 0; pos--) {
        if (Math.abs(nums[lo]) > Math.abs(nums[hi])) {
            res[pos] = nums[lo] * nums[lo];
            lo++;
        } else {
            res[pos] = nums[hi] * nums[hi];
            hi--;
        }
    }
    return res;
};`,
    java: `class Solution {
    public int[] sortedSquares(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        int lo = 0, hi = n - 1;
        for (int pos = n - 1; pos >= 0; pos--) {
            if (Math.abs(nums[lo]) > Math.abs(nums[hi])) {
                res[pos] = nums[lo] * nums[lo];
                lo++;
            } else {
                res[pos] = nums[hi] * nums[hi];
                hi--;
            }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n);
        int lo = 0, hi = n - 1;
        for (int pos = n - 1; pos >= 0; pos--) {
            if (abs(nums[lo]) > abs(nums[hi])) {
                res[pos] = nums[lo] * nums[lo];
                lo++;
            } else {
                res[pos] = nums[hi] * nums[hi];
                hi--;
            }
        }
        return res;
    }
};`,
  },

  // maxProfit(prices: List[int]) -> int  — best single buy/sell.
  'pghub-b48-stock-single': {
    javascript: `var maxProfit = function(prices) {
    let best = 0, cheapest = prices[0];
    for (const p of prices) {
        if (p < cheapest) cheapest = p;
        else if (p - cheapest > best) best = p - cheapest;
    }
    return best;
};`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        int best = 0, cheapest = prices[0];
        for (int p : prices) {
            if (p < cheapest) cheapest = p;
            else if (p - cheapest > best) best = p - cheapest;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int best = 0, cheapest = prices[0];
        for (int p : prices) {
            if (p < cheapest) cheapest = p;
            else if (p - cheapest > best) best = p - cheapest;
        }
        return best;
    }
};`,
  },

  // trapWater(height: List[int]) -> int  — two-pointer trapping rain water.
  'pghub-b48-trapping-water': {
    javascript: `var trapWater = function(height) {
    let lo = 0, hi = height.length - 1, leftMax = 0, rightMax = 0, total = 0;
    while (lo < hi) {
        if (height[lo] < height[hi]) {
            if (height[lo] >= leftMax) leftMax = height[lo];
            else total += leftMax - height[lo];
            lo++;
        } else {
            if (height[hi] >= rightMax) rightMax = height[hi];
            else total += rightMax - height[hi];
            hi--;
        }
    }
    return total;
};`,
    java: `class Solution {
    public int trapWater(int[] height) {
        int lo = 0, hi = height.length - 1, leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (height[lo] < height[hi]) {
                if (height[lo] >= leftMax) leftMax = height[lo];
                else total += leftMax - height[lo];
                lo++;
            } else {
                if (height[hi] >= rightMax) rightMax = height[hi];
                else total += rightMax - height[hi];
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
    int trapWater(vector<int>& height) {
        int lo = 0, hi = (int)height.size() - 1, leftMax = 0, rightMax = 0, total = 0;
        while (lo < hi) {
            if (height[lo] < height[hi]) {
                if (height[lo] >= leftMax) leftMax = height[lo];
                else total += leftMax - height[lo];
                lo++;
            } else {
                if (height[hi] >= rightMax) rightMax = height[hi];
                else total += rightMax - height[hi];
                hi--;
            }
        }
        return total;
    }
};`,
  },

  // shiftVowels(s: str) -> str  — rotate each vowel a->e->i->o->u->a.
  'pghub-b48-vowel-shift': {
    javascript: `var shiftVowels = function(s) {
    const nxt = {a: 'e', e: 'i', i: 'o', o: 'u', u: 'a'};
    let res = '';
    for (const ch of s) res += (nxt[ch] !== undefined ? nxt[ch] : ch);
    return res;
};`,
    java: `class Solution {
    public String shiftVowels(String s) {
        StringBuilder sb = new StringBuilder();
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case 'a': sb.append('e'); break;
                case 'e': sb.append('i'); break;
                case 'i': sb.append('o'); break;
                case 'o': sb.append('u'); break;
                case 'u': sb.append('a'); break;
                default: sb.append(ch);
            }
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string shiftVowels(string s) {
        string res;
        for (char ch : s) {
            switch (ch) {
                case 'a': res += 'e'; break;
                case 'e': res += 'i'; break;
                case 'i': res += 'o'; break;
                case 'o': res += 'u'; break;
                case 'u': res += 'a'; break;
                default: res += ch;
            }
        }
        return res;
    }
};`,
  },

  // ladderLength(beginWord: str, endWord: str, wordList: List[str]) -> int  — BFS.
  'pghub-b48-word-ladder-len': {
    javascript: `var ladderLength = function(beginWord, endWord, wordList) {
    const words = new Set(wordList);
    if (!words.has(endWord)) return 0;
    const queue = [[beginWord, 1]];
    const visited = new Set([beginWord]);
    let qi = 0;
    while (qi < queue.length) {
        const [word, dist] = queue[qi++];
        if (word === endWord) return dist;
        for (let i = 0; i < word.length; i++) {
            for (let c = 0; c < 26; c++) {
                const ch = String.fromCharCode(97 + c);
                if (ch === word[i]) continue;
                const cand = word.slice(0, i) + ch + word.slice(i + 1);
                if (words.has(cand) && !visited.has(cand)) {
                    visited.add(cand);
                    queue.push([cand, dist + 1]);
                }
            }
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int ladderLength(String beginWord, String endWord, String[] wordList) {
        Set<String> words = new HashSet<>(Arrays.asList(wordList));
        if (!words.contains(endWord)) return 0;
        Queue<String> queue = new ArrayDeque<>();
        Map<String, Integer> dist = new HashMap<>();
        queue.add(beginWord);
        dist.put(beginWord, 1);
        while (!queue.isEmpty()) {
            String word = queue.poll();
            int d = dist.get(word);
            if (word.equals(endWord)) return d;
            char[] arr = word.toCharArray();
            for (int i = 0; i < arr.length; i++) {
                char orig = arr[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    arr[i] = ch;
                    String cand = new String(arr);
                    if (words.contains(cand) && !dist.containsKey(cand)) {
                        dist.put(cand, d + 1);
                        queue.add(cand);
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
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;
        queue<pair<string,int>> q;
        unordered_set<string> visited;
        q.push({beginWord, 1});
        visited.insert(beginWord);
        while (!q.empty()) {
            auto [word, dist] = q.front(); q.pop();
            if (word == endWord) return dist;
            for (size_t i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char ch = 'a'; ch <= 'z'; ch++) {
                    if (ch == orig) continue;
                    word[i] = ch;
                    if (words.count(word) && !visited.count(word)) {
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

  // blockSum(nums: List[int], k: int) -> int  — alternating signed block sums.
  'pghub-b49-altsum': {
    javascript: `var blockSum = function(nums, k) {
    let total = 0;
    for (let i = 0; i < nums.length; i += k) {
        let block = 0;
        for (let j = i; j < Math.min(i + k, nums.length); j++) block += nums[j];
        if (Math.floor(i / k) % 2 === 0) total += block;
        else total -= block;
    }
    return total;
};`,
    java: `class Solution {
    public int blockSum(int[] nums, int k) {
        int total = 0;
        for (int i = 0; i < nums.length; i += k) {
            int block = 0;
            for (int j = i; j < Math.min(i + k, nums.length); j++) block += nums[j];
            if ((i / k) % 2 == 0) total += block;
            else total -= block;
        }
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int blockSum(vector<int>& nums, int k) {
        int total = 0, n = nums.size();
        for (int i = 0; i < n; i += k) {
            int block = 0;
            for (int j = i; j < min(i + k, n); j++) block += nums[j];
            if ((i / k) % 2 == 0) total += block;
            else total -= block;
        }
        return total;
    }
};`,
  },

  // maxDepth(s: str) -> int  — max bracket nesting depth.
  'pghub-b49-bracket-depth': {
    javascript: `var maxDepth = function(s) {
    const opens = new Set(['(', '[', '{']);
    const closes = new Set([')', ']', '}']);
    let depth = 0, best = 0;
    for (const c of s) {
        if (opens.has(c)) { depth++; if (depth > best) best = depth; }
        else if (closes.has(c)) depth--;
    }
    return best;
};`,
    java: `class Solution {
    public int maxDepth(String s) {
        int depth = 0, best = 0;
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                depth++;
                if (depth > best) best = depth;
            } else if (c == ')' || c == ']' || c == '}') {
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
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') {
                depth++;
                if (depth > best) best = depth;
            } else if (c == ')' || c == ']' || c == '}') {
                depth--;
            }
        }
        return best;
    }
};`,
  },

  // countRegions(grid: List[List[int]]) -> int  — flood-fill same-value regions.
  'pghub-b49-color-island': {
    javascript: `var countRegions = function(grid) {
    if (!grid || !grid[0]) return 0;
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    let count = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (seen[r][c]) continue;
            count++;
            const val = grid[r][c];
            const stack = [[r, c]];
            seen[r][c] = true;
            while (stack.length) {
                const [cr, cc] = stack.pop();
                for (const [dr, dc] of dirs) {
                    const nr = cr + dr, nc = cc + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] === val) {
                        seen[nr][nc] = true;
                        stack.push([nr, nc]);
                    }
                }
            }
        }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countRegions(int[][] grid) {
        if (grid.length == 0 || grid[0].length == 0) return 0;
        int rows = grid.length, cols = grid[0].length, count = 0;
        boolean[][] seen = new boolean[rows][cols];
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (seen[r][c]) continue;
                count++;
                int val = grid[r][c];
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{r, c});
                seen[r][c] = true;
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();
                    for (int[] d : dirs) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] == val) {
                            seen[nr][nc] = true;
                            stack.push(new int[]{nr, nc});
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
    int countRegions(vector<vector<int>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        vector<vector<bool>> seen(rows, vector<bool>(cols, false));
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (seen[r][c]) continue;
                count++;
                int val = grid[r][c];
                vector<pair<int,int>> stack = {{r, c}};
                seen[r][c] = true;
                while (!stack.empty()) {
                    auto [cr, cc] = stack.back(); stack.pop_back();
                    for (auto& d : dirs) {
                        int nr = cr + d[0], nc = cc + d[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc] && grid[nr][nc] == val) {
                            seen[nr][nc] = true;
                            stack.push_back({nr, nc});
                        }
                    }
                }
            }
        }
        return count;
    }
};`,
  },

  // persistence(n: int) -> int  — multiplicative digital persistence.
  'pghub-b49-digit-spiral': {
    javascript: `var persistence = function(n) {
    let steps = 0;
    while (n >= 10) {
        let prod = 1;
        for (const ch of String(n)) prod *= Number(ch);
        n = prod;
        steps++;
    }
    return steps;
};`,
    java: `class Solution {
    public int persistence(int n) {
        int steps = 0;
        while (n >= 10) {
            int prod = 1;
            for (char ch : String.valueOf(n).toCharArray()) prod *= (ch - '0');
            n = prod;
            steps++;
        }
        return steps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int persistence(int n) {
        int steps = 0;
        while (n >= 10) {
            int prod = 1;
            for (char ch : to_string(n)) prod *= (ch - '0');
            n = prod;
            steps++;
        }
        return steps;
    }
};`,
  },

  // longestTwoDistinct(s: str) -> int  — longest substring with <=2 distinct chars.
  'pghub-b49-distinct-window': {
    javascript: `var longestTwoDistinct = function(s) {
    const counts = new Map();
    let left = 0, best = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        counts.set(c, (counts.get(c) || 0) + 1);
        while (counts.size > 2) {
            const d = s[left];
            counts.set(d, counts.get(d) - 1);
            if (counts.get(d) === 0) counts.delete(d);
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int longestTwoDistinct(String s) {
        Map<Character, Integer> counts = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            counts.merge(c, 1, Integer::sum);
            while (counts.size() > 2) {
                char d = s.charAt(left);
                counts.merge(d, -1, Integer::sum);
                if (counts.get(d) == 0) counts.remove(d);
                left++;
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
    int longestTwoDistinct(string s) {
        unordered_map<char, int> counts;
        int left = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            counts[s[right]]++;
            while ((int)counts.size() > 2) {
                char d = s[left];
                if (--counts[d] == 0) counts.erase(d);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // minStops(fuel: List[int], tank: int) -> int  — max-heap greedy refuel, -1 if stuck.
  'pghub-b49-fuel-stops': {
    javascript: `var minStops = function(fuel, tank) {
    const n = fuel.length;
    // max-heap of available fuel pickups
    const heap = [];
    const push = (v) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p] >= heap[i]) break;
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
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, big = i;
                if (l < heap.length && heap[l] > heap[big]) big = l;
                if (r < heap.length && heap[r] > heap[big]) big = r;
                if (big === i) break;
                [heap[big], heap[i]] = [heap[i], heap[big]];
                i = big;
            }
        }
        return top;
    };
    let cur = tank, stops = 0;
    for (let i = 0; i < n; i++) {
        if (i > 0) cur -= 1;
        while (cur < 0 && heap.length) { cur += pop(); stops++; }
        if (cur < 0) return -1;
        if (fuel[i] > 0) push(fuel[i]);
    }
    return stops;
};`,
    java: `import java.util.*;
class Solution {
    public int minStops(int[] fuel, int tank) {
        int n = fuel.length;
        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());
        int cur = tank, stops = 0;
        for (int i = 0; i < n; i++) {
            if (i > 0) cur -= 1;
            while (cur < 0 && !pq.isEmpty()) { cur += pq.poll(); stops++; }
            if (cur < 0) return -1;
            if (fuel[i] > 0) pq.offer(fuel[i]);
        }
        return stops;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minStops(vector<int>& fuel, int tank) {
        int n = fuel.size();
        priority_queue<int> pq;
        int cur = tank, stops = 0;
        for (int i = 0; i < n; i++) {
            if (i > 0) cur -= 1;
            while (cur < 0 && !pq.empty()) { cur += pq.top(); pq.pop(); stops++; }
            if (cur < 0) return -1;
            if (fuel[i] > 0) pq.push(fuel[i]);
        }
        return stops;
    }
};`,
  },

  // kthSmallest(lists: List[List[int]], k: int) -> int  — k-way merge via min-heap.
  'pghub-b49-kth-merged': {
    javascript: `var kthSmallest = function(lists, k) {
    // min-heap of [val, listIdx, idx]
    const heap = [];
    const less = (a, b) => a[0] < b[0];
    const push = (item) => {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (!less(heap[i], heap[p])) break;
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
            while (true) {
                let l = 2 * i + 1, r = 2 * i + 2, sm = i;
                if (l < heap.length && less(heap[l], heap[sm])) sm = l;
                if (r < heap.length && less(heap[r], heap[sm])) sm = r;
                if (sm === i) break;
                [heap[sm], heap[i]] = [heap[i], heap[sm]];
                i = sm;
            }
        }
        return top;
    };
    for (let li = 0; li < lists.length; li++) {
        if (lists[li].length) push([lists[li][0], li, 0]);
    }
    let result = 0;
    for (let step = 0; step < k; step++) {
        const [val, li, idx] = pop();
        result = val;
        if (idx + 1 < lists[li].length) push([lists[li][idx + 1], li, idx + 1]);
    }
    return result;
};`,
    java: `import java.util.*;
class Solution {
    public int kthSmallest(int[][] lists, int k) {
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        for (int li = 0; li < lists.length; li++)
            if (lists[li].length > 0) pq.offer(new int[]{lists[li][0], li, 0});
        int result = 0;
        for (int step = 0; step < k; step++) {
            int[] top = pq.poll();
            result = top[0];
            int li = top[1], idx = top[2];
            if (idx + 1 < lists[li].length) pq.offer(new int[]{lists[li][idx + 1], li, idx + 1});
        }
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSmallest(vector<vector<int>>& lists, int k) {
        priority_queue<array<int,3>, vector<array<int,3>>, greater<array<int,3>>> pq;
        for (int li = 0; li < (int)lists.size(); li++)
            if (!lists[li].empty()) pq.push({lists[li][0], li, 0});
        int result = 0;
        for (int step = 0; step < k; step++) {
            auto top = pq.top(); pq.pop();
            result = top[0];
            int li = top[1], idx = top[2];
            if (idx + 1 < (int)lists[li].size()) pq.push({lists[li][idx + 1], li, idx + 1});
        }
        return result;
    }
};`,
  },

  // busyTime(intervals: List[List[int]]) -> int  — total covered length after merge.
  'pghub-b49-merge-busy': {
    javascript: `var busyTime = function(intervals) {
    const sorted = intervals.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let total = 0;
    let cs = sorted[0][0], ce = sorted[0][1];
    for (let i = 1; i < sorted.length; i++) {
        const [s, e] = sorted[i];
        if (s <= ce) ce = Math.max(ce, e);
        else { total += ce - cs; cs = s; ce = e; }
    }
    total += ce - cs;
    return total;
};`,
    java: `import java.util.*;
class Solution {
    public int busyTime(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int total = 0, cs = sorted[0][0], ce = sorted[0][1];
        for (int i = 1; i < sorted.length; i++) {
            int s = sorted[i][0], e = sorted[i][1];
            if (s <= ce) ce = Math.max(ce, e);
            else { total += ce - cs; cs = s; ce = e; }
        }
        total += ce - cs;
        return total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int busyTime(vector<vector<int>>& intervals) {
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end());
        int total = 0, cs = sorted[0][0], ce = sorted[0][1];
        for (size_t i = 1; i < sorted.size(); i++) {
            int s = sorted[i][0], e = sorted[i][1];
            if (s <= ce) ce = max(ce, e);
            else { total += ce - cs; cs = s; ce = e; }
        }
        total += ce - cs;
        return total;
    }
};`,
  },

  // minSpeed(piles: List[int], hours: int) -> int  — binary search on eating speed.
  'pghub-b49-min-speed': {
    javascript: `var minSpeed = function(piles, hours) {
    const hoursAt = (v) => {
        let h = 0;
        for (const p of piles) h += Math.floor((p + v - 1) / v);
        return h;
    };
    let lo = 1, hi = Math.max(...piles);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (hoursAt(mid) <= hours) hi = mid;
        else lo = mid + 1;
    }
    return lo;
};`,
    java: `class Solution {
    public int minSpeed(int[] piles, int hours) {
        int hi = 1;
        for (int p : piles) hi = Math.max(hi, p);
        int lo = 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            long h = 0;
            for (int p : piles) h += (p + mid - 1) / mid;
            if (h <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minSpeed(vector<int>& piles, int hours) {
        int lo = 1, hi = *max_element(piles.begin(), piles.end());
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            long long h = 0;
            for (int p : piles) h += (p + mid - 1) / mid;
            if (h <= hours) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};`,
  },

  // closestPairSum(nums: List[int], target: int) -> int  — sorted two-pointer closest sum.
  'pghub-b49-pair-target': {
    javascript: `var closestPairSum = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    let best = nums[0] + nums[1];
    while (lo < hi) {
        const s = nums[lo] + nums[hi];
        if (Math.abs(s - target) < Math.abs(best - target) ||
            (Math.abs(s - target) === Math.abs(best - target) && s < best)) {
            best = s;
        }
        if (s === target) return s;
        else if (s < target) lo++;
        else hi--;
    }
    return best;
};`,
    java: `class Solution {
    public int closestPairSum(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        int best = nums[0] + nums[1];
        while (lo < hi) {
            int s = nums[lo] + nums[hi];
            if (Math.abs(s - target) < Math.abs(best - target) ||
                (Math.abs(s - target) == Math.abs(best - target) && s < best)) {
                best = s;
            }
            if (s == target) return s;
            else if (s < target) lo++;
            else hi--;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int closestPairSum(vector<int>& nums, int target) {
        int lo = 0, hi = (int)nums.size() - 1;
        int best = nums[0] + nums[1];
        while (lo < hi) {
            int s = nums[lo] + nums[hi];
            if (abs(s - target) < abs(best - target) ||
                (abs(s - target) == abs(best - target) && s < best)) {
                best = s;
            }
            if (s == target) return s;
            else if (s < target) lo++;
            else hi--;
        }
        return best;
    }
};`,
  },

  // countSubsets(nums: List[int], target: int) -> int  — count subsets summing to target.
  'pghub-b49-subset-target': {
    javascript: `var countSubsets = function(nums, target) {
    const n = nums.length;
    let count = 0;
    const dfs = (i, remaining) => {
        if (remaining === 0) { count++; return; }
        if (i === n || remaining < 0) return;
        dfs(i + 1, remaining - nums[i]);
        dfs(i + 1, remaining);
    };
    dfs(0, target);
    return count;
};`,
    java: `class Solution {
    private int count;
    public int countSubsets(int[] nums, int target) {
        count = 0;
        dfs(nums, 0, target);
        return count;
    }
    private void dfs(int[] nums, int i, int remaining) {
        if (remaining == 0) { count++; return; }
        if (i == nums.length || remaining < 0) return;
        dfs(nums, i + 1, remaining - nums[i]);
        dfs(nums, i + 1, remaining);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countSubsets(vector<int>& nums, int target) {
        int n = nums.size(), count = 0;
        function<void(int,int)> dfs = [&](int i, int remaining) {
            if (remaining == 0) { count++; return; }
            if (i == n || remaining < 0) return;
            dfs(i + 1, remaining - nums[i]);
            dfs(i + 1, remaining);
        };
        dfs(0, target);
        return count;
    }
};`,
  },

  // countWays(n: int, steps: List[int]) -> int  — DP count of ordered step compositions, mod 1e9+7.
  'pghub-b49-tiling-paths': {
    javascript: `var countWays = function(n, steps) {
    const MOD = 1000000007;
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= n; i++) {
        let total = 0;
        for (const s of steps) {
            if (i - s >= 0) total += dp[i - s];
        }
        dp[i] = total % MOD;
    }
    return dp[n];
};`,
    java: `class Solution {
    public int countWays(int n, int[] steps) {
        final int MOD = 1000000007;
        long[] dp = new long[n + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            long total = 0;
            for (int s : steps) {
                if (i - s >= 0) total += dp[i - s];
            }
            dp[i] = total % MOD;
        }
        return (int) dp[n];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countWays(int n, vector<int>& steps) {
        const long long MOD = 1000000007;
        vector<long long> dp(n + 1, 0);
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            long long total = 0;
            for (int s : steps) {
                if (i - s >= 0) total += dp[i - s];
            }
            dp[i] = total % MOD;
        }
        return (int) dp[n];
    }
};`,
  },
};
