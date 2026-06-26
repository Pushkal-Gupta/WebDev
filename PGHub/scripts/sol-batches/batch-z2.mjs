// batch-z2 — zero-solution authorables, slice [14,28) of zerosol-authorable.json.
// Signatures match generateTemplate(language, method_name, params, return_type)
// exactly; arg order is positional (param NAMES are cosmetic). Each language is
// graded against the problem's own stored test_cases by backfill-solutions.mjs;
// only passing langs are written. Authored from scratch + checked vs 2-3 cases.

export default {
  // countGoodTriplets(nums, target, k, n) -> Any  (LC count-good-triplets:
  // arr=nums, a=target, b=k, c=n). Brute-force O(n^3) triple loop counting
  // triplets i<j<k with |ai-aj|<=a, |aj-ak|<=b, |ai-ak|<=c.
  'count-good-triplets': {
    python: `class Solution:
    def countGoodTriplets(self, nums: List[int], target: int, k: int, n: int) -> Any:
        a, b, c = target, k, n
        L = len(nums)
        count = 0
        for i in range(L):
            for j in range(i + 1, L):
                if abs(nums[i] - nums[j]) > a:
                    continue
                for m in range(j + 1, L):
                    if abs(nums[j] - nums[m]) <= b and abs(nums[i] - nums[m]) <= c:
                        count += 1
        return count`,
    javascript: `var countGoodTriplets = function(nums, target, k, n) {
    const a = target, b = k, c = n, L = nums.length;
    let count = 0;
    for (let i = 0; i < L; i++) {
        for (let j = i + 1; j < L; j++) {
            if (Math.abs(nums[i] - nums[j]) > a) continue;
            for (let m = j + 1; m < L; m++) {
                if (Math.abs(nums[j] - nums[m]) <= b && Math.abs(nums[i] - nums[m]) <= c) count++;
            }
        }
    }
    return count;
};`,
    java: `class Solution {
    public int countGoodTriplets(int[] nums, int target, int k, int n) {
        int a = target, b = k, c = n, L = nums.length, count = 0;
        for (int i = 0; i < L; i++) {
            for (int j = i + 1; j < L; j++) {
                if (Math.abs(nums[i] - nums[j]) > a) continue;
                for (int m = j + 1; m < L; m++) {
                    if (Math.abs(nums[j] - nums[m]) <= b && Math.abs(nums[i] - nums[m]) <= c) count++;
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
    int countGoodTriplets(vector<int>& nums, int target, int k, int n) {
        int a = target, b = k, c = n, L = nums.size(), count = 0;
        for (int i = 0; i < L; i++) {
            for (int j = i + 1; j < L; j++) {
                if (abs(nums[i] - nums[j]) > a) continue;
                for (int m = j + 1; m < L; m++) {
                    if (abs(nums[j] - nums[m]) <= b && abs(nums[i] - nums[m]) <= c) count++;
                }
            }
        }
        return count;
    }
};`,
  },

  // countNegatives(grid) -> int  — rows/cols sorted descending; staircase walk
  // from bottom-left counting negatives. O(m+n).
  'count-negative-numbers-in-a-sorted-matrix': {
    python: `class Solution:
    def countNegatives(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        count = 0
        c = cols - 1
        for r in range(rows):
            while c >= 0 and grid[r][c] < 0:
                c -= 1
            count += cols - 1 - c
        return count`,
    javascript: `var countNegatives = function(grid) {
    const rows = grid.length, cols = grid[0].length;
    let count = 0, c = cols - 1;
    for (let r = 0; r < rows; r++) {
        while (c >= 0 && grid[r][c] < 0) c--;
        count += cols - 1 - c;
    }
    return count;
};`,
    java: `class Solution {
    public int countNegatives(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, count = 0, c = cols - 1;
        for (int r = 0; r < rows; r++) {
            while (c >= 0 && grid[r][c] < 0) c--;
            count += cols - 1 - c;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countNegatives(vector<vector<int>>& grid) {
        int rows = grid.size(), cols = grid[0].size(), count = 0, c = cols - 1;
        for (int r = 0; r < rows; r++) {
            while (c >= 0 && grid[r][c] < 0) c--;
            count += cols - 1 - c;
        }
        return count;
    }
};`,
  },

  // countBadPairs(input) -> Any  — bad pairs = total pairs - good pairs, where
  // good pair satisfies j-i == nums[j]-nums[i] i.e. nums[i]-i == nums[j]-j.
  'count-number-of-bad-pairs': {
    python: `class Solution:
    def countBadPairs(self, input: List[int]) -> Any:
        n = len(input)
        total = n * (n - 1) // 2
        from collections import Counter
        cnt = Counter()
        good = 0
        for i, x in enumerate(input):
            key = x - i
            good += cnt[key]
            cnt[key] += 1
        return total - good`,
    javascript: `var countBadPairs = function(input) {
    const n = input.length;
    let total = n * (n - 1) / 2, good = 0;
    const cnt = new Map();
    for (let i = 0; i < n; i++) {
        const key = input[i] - i;
        good += cnt.get(key) || 0;
        cnt.set(key, (cnt.get(key) || 0) + 1);
    }
    return total - good;
};`,
    java: `import java.util.*;
class Solution {
    public long countBadPairs(int[] input) {
        int n = input.length;
        long total = (long) n * (n - 1) / 2, good = 0;
        Map<Integer, Integer> cnt = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int key = input[i] - i;
            good += cnt.getOrDefault(key, 0);
            cnt.merge(key, 1, Integer::sum);
        }
        return total - good;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    long long countBadPairs(vector<int>& input) {
        int n = input.size();
        long long total = (long long) n * (n - 1) / 2, good = 0;
        unordered_map<int, int> cnt;
        for (int i = 0; i < n; i++) {
            int key = input[i] - i;
            good += cnt[key];
            cnt[key]++;
        }
        return total - good;
    }
};`,
  },

  // vowelStrings(words, queries) -> List[int]  — prefix count of words that
  // start & end with a vowel; answer each [l,r] by prefix diff.
  'count-vowel-strings-in-ranges': {
    python: `class Solution:
    def vowelStrings(self, words: List[str], queries: List[List[int]]) -> List[int]:
        vowels = set('aeiou')
        n = len(words)
        prefix = [0] * (n + 1)
        for i, w in enumerate(words):
            ok = 1 if w and w[0] in vowels and w[-1] in vowels else 0
            prefix[i + 1] = prefix[i] + ok
        return [prefix[r + 1] - prefix[l] for l, r in queries]`,
    javascript: `var vowelStrings = function(words, queries) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const n = words.length;
    const prefix = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        const w = words[i];
        const ok = (w.length > 0 && vowels.has(w[0]) && vowels.has(w[w.length - 1])) ? 1 : 0;
        prefix[i + 1] = prefix[i] + ok;
    }
    return queries.map(([l, r]) => prefix[r + 1] - prefix[l]);
};`,
    java: `import java.util.*;
class Solution {
    public int[] vowelStrings(String[] words, int[][] queries) {
        String vowels = "aeiou";
        int n = words.length;
        int[] prefix = new int[n + 1];
        for (int i = 0; i < n; i++) {
            String w = words[i];
            boolean ok = w.length() > 0
                && vowels.indexOf(w.charAt(0)) >= 0
                && vowels.indexOf(w.charAt(w.length() - 1)) >= 0;
            prefix[i + 1] = prefix[i] + (ok ? 1 : 0);
        }
        int[] res = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            res[q] = prefix[queries[q][1] + 1] - prefix[queries[q][0]];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> vowelStrings(vector<string>& words, vector<vector<int>>& queries) {
        string vowels = "aeiou";
        int n = words.size();
        vector<int> prefix(n + 1, 0);
        for (int i = 0; i < n; i++) {
            const string& w = words[i];
            bool ok = !w.empty()
                && vowels.find(w.front()) != string::npos
                && vowels.find(w.back()) != string::npos;
            prefix[i + 1] = prefix[i] + (ok ? 1 : 0);
        }
        vector<int> res;
        for (auto& q : queries) res.push_back(prefix[q[1] + 1] - prefix[q[0]]);
        return res;
    }
};`,
  },

  // canFinish(numCourses, prerequisites) -> bool  — Kahn topological sort;
  // true iff no cycle.
  'course-schedule': {
    python: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        from collections import deque
        adj = [[] for _ in range(numCourses)]
        indeg = [0] * numCourses
        for a, b in prerequisites:
            adj[b].append(a)
            indeg[a] += 1
        q = deque(i for i in range(numCourses) if indeg[i] == 0)
        seen = 0
        while q:
            node = q.popleft()
            seen += 1
            for nxt in adj[node]:
                indeg[nxt] -= 1
                if indeg[nxt] == 0:
                    q.append(nxt)
        return seen == numCourses`,
    javascript: `var canFinish = function(numCourses, prerequisites) {
    const adj = Array.from({length: numCourses}, () => []);
    const indeg = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
    const q = [];
    for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
    let seen = 0;
    while (q.length) {
        const node = q.shift();
        seen++;
        for (const nxt of adj[node]) {
            if (--indeg[nxt] === 0) q.push(nxt);
        }
    }
    return seen === numCourses;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[numCourses];
        for (int[] p : prerequisites) { adj.get(p[1]).add(p[0]); indeg[p[0]]++; }
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.add(i);
        int seen = 0;
        while (!q.isEmpty()) {
            int node = q.poll();
            seen++;
            for (int nxt : adj.get(node)) if (--indeg[nxt] == 0) q.add(nxt);
        }
        return seen == numCourses;
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
        int seen = 0;
        while (!q.empty()) {
            int node = q.front(); q.pop();
            seen++;
            for (int nxt : adj[node]) if (--indeg[nxt] == 0) q.push(nxt);
        }
        return seen == numCourses;
    }
};`,
  },

  // decompressRLElist(nums) -> List[int]  — for each pair (freq, val), append
  // val freq times.
  'decompress-run-length-encoded-list': {
    python: `class Solution:
    def decompressRLElist(self, nums: List[int]) -> List[int]:
        res = []
        for i in range(0, len(nums), 2):
            freq, val = nums[i], nums[i + 1]
            res.extend([val] * freq)
        return res`,
    javascript: `var decompressRLElist = function(nums) {
    const res = [];
    for (let i = 0; i < nums.length; i += 2) {
        const freq = nums[i], val = nums[i + 1];
        for (let j = 0; j < freq; j++) res.push(val);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] decompressRLElist(int[] nums) {
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < nums.length; i += 2) {
            int freq = nums[i], val = nums[i + 1];
            for (int j = 0; j < freq; j++) res.add(val);
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
    vector<int> decompressRLElist(vector<int>& nums) {
        vector<int> res;
        for (size_t i = 0; i + 1 < nums.size(); i += 2) {
            int freq = nums[i], val = nums[i + 1];
            for (int j = 0; j < freq; j++) res.push_back(val);
        }
        return res;
    }
};`,
  },

  // deleteAndEarn(nums) -> int  — bucket points by value, then house-robber DP
  // over value line (can't take adjacent values).
  'delete-and-earn': {
    python: `class Solution:
    def deleteAndEarn(self, nums: List[int]) -> int:
        if not nums:
            return 0
        mx = max(nums)
        points = [0] * (mx + 1)
        for x in nums:
            points[x] += x
        prev, cur = 0, 0
        for v in range(mx + 1):
            prev, cur = cur, max(cur, prev + points[v])
        return cur`,
    javascript: `var deleteAndEarn = function(nums) {
    if (nums.length === 0) return 0;
    const mx = Math.max(...nums);
    const points = new Array(mx + 1).fill(0);
    for (const x of nums) points[x] += x;
    let prev = 0, cur = 0;
    for (let v = 0; v <= mx; v++) {
        const t = Math.max(cur, prev + points[v]);
        prev = cur; cur = t;
    }
    return cur;
};`,
    java: `class Solution {
    public int deleteAndEarn(int[] nums) {
        if (nums.length == 0) return 0;
        int mx = 0;
        for (int x : nums) mx = Math.max(mx, x);
        long[] points = new long[mx + 1];
        for (int x : nums) points[x] += x;
        long prev = 0, cur = 0;
        for (int v = 0; v <= mx; v++) {
            long t = Math.max(cur, prev + points[v]);
            prev = cur; cur = t;
        }
        return (int) cur;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int deleteAndEarn(vector<int>& nums) {
        if (nums.empty()) return 0;
        int mx = *max_element(nums.begin(), nums.end());
        vector<long long> points(mx + 1, 0);
        for (int x : nums) points[x] += x;
        long long prev = 0, cur = 0;
        for (int v = 0; v <= mx; v++) {
            long long t = max(cur, prev + points[v]);
            prev = cur; cur = t;
        }
        return (int) cur;
    }
};`,
  },

  // minDeletionSize(strs) -> int  — count columns that are not non-decreasing
  // top-to-bottom.
  'delete-columns-to-make-sorted': {
    python: `class Solution:
    def minDeletionSize(self, strs: List[str]) -> int:
        if not strs:
            return 0
        cols = len(strs[0])
        deletions = 0
        for c in range(cols):
            for r in range(1, len(strs)):
                if strs[r][c] < strs[r - 1][c]:
                    deletions += 1
                    break
        return deletions`,
    javascript: `var minDeletionSize = function(strs) {
    if (strs.length === 0) return 0;
    const cols = strs[0].length;
    let deletions = 0;
    for (let c = 0; c < cols; c++) {
        for (let r = 1; r < strs.length; r++) {
            if (strs[r][c] < strs[r - 1][c]) { deletions++; break; }
        }
    }
    return deletions;
};`,
    java: `class Solution {
    public int minDeletionSize(String[] strs) {
        if (strs.length == 0) return 0;
        int cols = strs[0].length(), deletions = 0;
        for (int c = 0; c < cols; c++) {
            for (int r = 1; r < strs.length; r++) {
                if (strs[r].charAt(c) < strs[r - 1].charAt(c)) { deletions++; break; }
            }
        }
        return deletions;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minDeletionSize(vector<string>& strs) {
        if (strs.empty()) return 0;
        int cols = strs[0].size(), deletions = 0;
        for (int c = 0; c < cols; c++) {
            for (size_t r = 1; r < strs.size(); r++) {
                if (strs[r][c] < strs[r - 1][c]) { deletions++; break; }
            }
        }
        return deletions;
    }
};`,
  },

  // findDuplicates(nums) -> List[int]  — index-sign marking; values in 1..n.
  // Output order = order of second sighting (matches stored expectations).
  'find-all-duplicates-in-an-array': {
    python: `class Solution:
    def findDuplicates(self, nums: List[int]) -> List[int]:
        res = []
        for x in nums:
            i = abs(x) - 1
            if nums[i] < 0:
                res.append(abs(x))
            else:
                nums[i] = -nums[i]
        return res`,
    javascript: `var findDuplicates = function(nums) {
    const res = [];
    for (const x of nums) {
        const i = Math.abs(x) - 1;
        if (nums[i] < 0) res.push(Math.abs(x));
        else nums[i] = -nums[i];
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> findDuplicates(int[] nums) {
        List<Integer> res = new ArrayList<>();
        for (int x : nums) {
            int i = Math.abs(x) - 1;
            if (nums[i] < 0) res.add(Math.abs(x));
            else nums[i] = -nums[i];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {
        vector<int> res;
        for (int x : nums) {
            int i = abs(x) - 1;
            if (nums[i] < 0) res.push_back(abs(x));
            else nums[i] = -nums[i];
        }
        return res;
    }
};`,
  },

  // searchRange(nums, target) -> List[int]  — two binary searches for the
  // first and last index of target; [-1,-1] if absent.
  'find-first-and-last-position-of-element-in-sorted-array': {
    python: `class Solution:
    def searchRange(self, nums: List[int], target: int) -> List[int]:
        import bisect
        lo = bisect.bisect_left(nums, target)
        if lo == len(nums) or nums[lo] != target:
            return [-1, -1]
        hi = bisect.bisect_right(nums, target) - 1
        return [lo, hi]`,
    javascript: `var searchRange = function(nums, target) {
    const lower = (t) => {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (nums[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    };
    const l = lower(target);
    if (l === nums.length || nums[l] !== target) return [-1, -1];
    const r = lower(target + 1) - 1;
    return [l, r];
};`,
    java: `class Solution {
    public int[] searchRange(int[] nums, int target) {
        int l = lower(nums, target);
        if (l == nums.length || nums[l] != target) return new int[]{-1, -1};
        int r = lower(nums, target + 1) - 1;
        return new int[]{l, r};
    }
    private int lower(int[] nums, int t) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] < t) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int l = lower_bound(nums.begin(), nums.end(), target) - nums.begin();
        if (l == (int)nums.size() || nums[l] != target) return {-1, -1};
        int r = upper_bound(nums.begin(), nums.end(), target) - nums.begin() - 1;
        return {l, r};
    }
};`,
  },

  // findNumbers(nums) -> int  — count numbers with an even digit count.
  'find-numbers-with-even-number-of-digits': {
    python: `class Solution:
    def findNumbers(self, nums: List[int]) -> int:
        return sum(1 for x in nums if len(str(abs(x))) % 2 == 0)`,
    javascript: `var findNumbers = function(nums) {
    let count = 0;
    for (const x of nums) {
        if (String(Math.abs(x)).length % 2 === 0) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int findNumbers(int[] nums) {
        int count = 0;
        for (int x : nums) {
            if (Integer.toString(Math.abs(x)).length() % 2 == 0) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findNumbers(vector<int>& nums) {
        int count = 0;
        for (int x : nums) {
            if (to_string(abs((long long)x)).size() % 2 == 0) count++;
        }
        return count;
    }
};`,
  },

  // findPeakElement(nums) -> int  — binary search moving toward the larger
  // neighbor; returns an index that is a strict local max.
  'find-peak-element': {
    python: `class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < nums[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo`,
    javascript: `var findPeakElement = function(nums) {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int lo = 0, hi = nums.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // findTheLongestSubstring(s) -> int  — bitmask of vowel parities + first-seen
  // index map; longest window with all-even vowel counts.
  'find-the-longest-substring-containing-vowels-in-even-counts': {
    python: `class Solution:
    def findTheLongestSubstring(self, s: str) -> int:
        idx = {'a': 0, 'e': 1, 'i': 2, 'o': 3, 'u': 4}
        first = {0: -1}
        mask = 0
        best = 0
        for i, ch in enumerate(s):
            if ch in idx:
                mask ^= (1 << idx[ch])
            if mask in first:
                best = max(best, i - first[mask])
            else:
                first[mask] = i
        return best`,
    javascript: `var findTheLongestSubstring = function(s) {
    const idx = {a: 0, e: 1, i: 2, o: 3, u: 4};
    const first = new Map([[0, -1]]);
    let mask = 0, best = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch in idx) mask ^= (1 << idx[ch]);
        if (first.has(mask)) best = Math.max(best, i - first.get(mask));
        else first.set(mask, i);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int findTheLongestSubstring(String s) {
        String vowels = "aeiou";
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);
        int mask = 0, best = 0;
        for (int i = 0; i < s.length(); i++) {
            int p = vowels.indexOf(s.charAt(i));
            if (p >= 0) mask ^= (1 << p);
            if (first.containsKey(mask)) best = Math.max(best, i - first.get(mask));
            else first.put(mask, i);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findTheLongestSubstring(string s) {
        string vowels = "aeiou";
        unordered_map<int, int> first;
        first[0] = -1;
        int mask = 0, best = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            size_t p = vowels.find(s[i]);
            if (p != string::npos) mask ^= (1 << p);
            if (first.count(mask)) best = max(best, i - first[mask]);
            else first[mask] = i;
        }
        return best;
    }
};`,
  },

  // findArray(pref) -> List[int]  — arr[0]=pref[0], arr[i]=pref[i]^pref[i-1].
  'find-the-original-array-of-prefix-xor': {
    python: `class Solution:
    def findArray(self, pref: List[int]) -> List[int]:
        res = [pref[0]]
        for i in range(1, len(pref)):
            res.append(pref[i] ^ pref[i - 1])
        return res`,
    javascript: `var findArray = function(pref) {
    const res = [pref[0]];
    for (let i = 1; i < pref.length; i++) {
        res.push(pref[i] ^ pref[i - 1]);
    }
    return res;
};`,
    java: `class Solution {
    public int[] findArray(int[] pref) {
        int[] res = new int[pref.length];
        res[0] = pref[0];
        for (int i = 1; i < pref.length; i++) {
            res[i] = pref[i] ^ pref[i - 1];
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findArray(vector<int>& pref) {
        vector<int> res;
        res.push_back(pref[0]);
        for (size_t i = 1; i < pref.size(); i++) {
            res.push_back(pref[i] ^ pref[i - 1]);
        }
        return res;
    }
};`,
  },
};
