// batch-z3.mjs — authored 4-language canonicals for zero-solution famous problems.
// Slice [28,42) of scripts/zerosol-authorable.json. Signatures match
// generateTemplate(language, method_name, params, return_type) in src/lib/driverCode.js.
// The backfill runner Judge0-grades each language and writes only PASSING langs.

export default {
  // findThePrefixCommonArray(A: List[int], B: List[int]) -> List[int]
  // C[i] = count of values present in BOTH A[0..i] and B[0..i]. Two bitsets/seen-counts.
  'find-the-prefix-common-array-of-two-arrays': {
    python: `class Solution:
    def findThePrefixCommonArray(self, A: List[int], B: List[int]) -> List[int]:
        n = len(A)
        seenA = [False] * (n + 1)
        seenB = [False] * (n + 1)
        res = []
        common = 0
        for i in range(n):
            a, b = A[i], B[i]
            seenA[a] = True
            seenB[b] = True
            if a == b:
                common += 1
            else:
                if seenB[a]:
                    common += 1
                if seenA[b]:
                    common += 1
            res.append(common)
        return res`,
    javascript: `var findThePrefixCommonArray = function(A, B) {
    const n = A.length;
    const seenA = new Array(n + 1).fill(false);
    const seenB = new Array(n + 1).fill(false);
    const res = [];
    let common = 0;
    for (let i = 0; i < n; i++) {
        const a = A[i], b = B[i];
        seenA[a] = true;
        seenB[b] = true;
        if (a === b) common++;
        else {
            if (seenB[a]) common++;
            if (seenA[b]) common++;
        }
        res.push(common);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] findThePrefixCommonArray(int[] A, int[] B) {
        int n = A.length;
        boolean[] seenA = new boolean[n + 1];
        boolean[] seenB = new boolean[n + 1];
        int[] res = new int[n];
        int common = 0;
        for (int i = 0; i < n; i++) {
            int a = A[i], b = B[i];
            seenA[a] = true;
            seenB[b] = true;
            if (a == b) common++;
            else {
                if (seenB[a]) common++;
                if (seenA[b]) common++;
            }
            res[i] = common;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> findThePrefixCommonArray(vector<int>& A, vector<int>& B) {
        int n = A.size();
        vector<bool> seenA(n + 1, false), seenB(n + 1, false);
        vector<int> res;
        int common = 0;
        for (int i = 0; i < n; i++) {
            int a = A[i], b = B[i];
            seenA[a] = true;
            seenB[b] = true;
            if (a == b) common++;
            else {
                if (seenB[a]) common++;
                if (seenA[b]) common++;
            }
            res.push_back(common);
        }
        return res;
    }
};`,
  },

  // totalFruit(fruits: List[int]) -> int  — longest subarray with ≤2 distinct (sliding window).
  'fruit-into-baskets': {
    python: `class Solution:
    def totalFruit(self, fruits: List[int]) -> int:
        count = {}
        left = 0
        best = 0
        for right in range(len(fruits)):
            count[fruits[right]] = count.get(fruits[right], 0) + 1
            while len(count) > 2:
                f = fruits[left]
                count[f] -= 1
                if count[f] == 0:
                    del count[f]
                left += 1
            best = max(best, right - left + 1)
        return best`,
    javascript: `var totalFruit = function(fruits) {
    const count = new Map();
    let left = 0, best = 0;
    for (let right = 0; right < fruits.length; right++) {
        count.set(fruits[right], (count.get(fruits[right]) || 0) + 1);
        while (count.size > 2) {
            const f = fruits[left];
            count.set(f, count.get(f) - 1);
            if (count.get(f) === 0) count.delete(f);
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `import java.util.*;
class Solution {
    public int totalFruit(int[] fruits) {
        Map<Integer, Integer> count = new HashMap<>();
        int left = 0, best = 0;
        for (int right = 0; right < fruits.length; right++) {
            count.merge(fruits[right], 1, Integer::sum);
            while (count.size() > 2) {
                int f = fruits[left];
                count.put(f, count.get(f) - 1);
                if (count.get(f) == 0) count.remove(f);
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
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> count;
        int left = 0, best = 0;
        for (int right = 0; right < (int)fruits.size(); right++) {
            count[fruits[right]]++;
            while ((int)count.size() > 2) {
                int f = fruits[left];
                if (--count[f] == 0) count.erase(f);
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // interpret(command: str) -> str  — replace "()"→"o", "(al)"→"al", keep "G".
  'goal-parser-interpretation': {
    python: `class Solution:
    def interpret(self, command: str) -> str:
        res = []
        i = 0
        n = len(command)
        while i < n:
            if command[i] == 'G':
                res.append('G')
                i += 1
            elif command[i:i+2] == '()':
                res.append('o')
                i += 2
            else:
                res.append('al')
                i += 4
        return ''.join(res)`,
    javascript: `var interpret = function(command) {
    let res = '';
    let i = 0;
    const n = command.length;
    while (i < n) {
        if (command[i] === 'G') { res += 'G'; i += 1; }
        else if (command[i] === '(' && command[i + 1] === ')') { res += 'o'; i += 2; }
        else { res += 'al'; i += 4; }
    }
    return res;
};`,
    java: `class Solution {
    public String interpret(String command) {
        StringBuilder sb = new StringBuilder();
        int i = 0, n = command.length();
        while (i < n) {
            if (command.charAt(i) == 'G') { sb.append('G'); i += 1; }
            else if (command.charAt(i + 1) == ')') { sb.append('o'); i += 2; }
            else { sb.append("al"); i += 4; }
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string interpret(string command) {
        string res;
        int i = 0, n = command.size();
        while (i < n) {
            if (command[i] == 'G') { res += 'G'; i += 1; }
            else if (command[i + 1] == ')') { res += 'o'; i += 2; }
            else { res += "al"; i += 4; }
        }
        return res;
    }
};`,
  },

  // validTree(n: int, edges: List[List[int]]) -> bool  — exactly n-1 edges + connected (union-find).
  'graph-valid-tree': {
    python: `class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        if len(edges) != n - 1:
            return False
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False
            parent[ra] = rb
        return True`,
    javascript: `var validTree = function(n, edges) {
    if (edges.length !== n - 1) return false;
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    for (const [a, b] of edges) {
        const ra = find(a), rb = find(b);
        if (ra === rb) return false;
        parent[ra] = rb;
    }
    return true;
};`,
    java: `class Solution {
    private int[] parent;
    public boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return false;
            parent[ra] = rb;
        }
        return true;
    }
    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }
    bool validTree(int n, vector<vector<int>>& edges) {
        if ((int)edges.size() != n - 1) return false;
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (auto& e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return false;
            parent[ra] = rb;
        }
        return true;
    }
};`,
  },

  // gcdOfStrings(str1: str, str2: str) -> str  — concat-commutes check + gcd-length prefix.
  'greatest-common-divisor-of-strings': {
    python: `class Solution:
    def gcdOfStrings(self, str1: str, str2: str) -> str:
        if str1 + str2 != str2 + str1:
            return ""
        from math import gcd
        return str1[:gcd(len(str1), len(str2))]`,
    javascript: `var gcdOfStrings = function(str1, str2) {
    if (str1 + str2 !== str2 + str1) return "";
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    return str1.slice(0, gcd(str1.length, str2.length));
};`,
    java: `class Solution {
    public String gcdOfStrings(String str1, String str2) {
        if (!(str1 + str2).equals(str2 + str1)) return "";
        return str1.substring(0, gcd(str1.length(), str2.length()));
    }
    private int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string gcdOfStrings(string str1, string str2) {
        if (str1 + str2 != str2 + str1) return "";
        return str1.substr(0, __gcd((int)str1.size(), (int)str2.size()));
    }
};`,
  },

  // kthSmallest(matrix: List[List[int]], k: int) -> int  — binary search on value range.
  'kth-smallest-element-in-a-sorted-matrix': {
    python: `class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        n = len(matrix)
        lo, hi = matrix[0][0], matrix[n - 1][n - 1]
        def countLE(x):
            cnt = 0
            r, c = n - 1, 0
            while r >= 0 and c < n:
                if matrix[r][c] <= x:
                    cnt += r + 1
                    c += 1
                else:
                    r -= 1
            return cnt
        while lo < hi:
            mid = (lo + hi) // 2
            if countLE(mid) < k:
                lo = mid + 1
            else:
                hi = mid
        return lo`,
    javascript: `var kthSmallest = function(matrix, k) {
    const n = matrix.length;
    let lo = matrix[0][0], hi = matrix[n - 1][n - 1];
    const countLE = (x) => {
        let cnt = 0, r = n - 1, c = 0;
        while (r >= 0 && c < n) {
            if (matrix[r][c] <= x) { cnt += r + 1; c++; }
            else r--;
        }
        return cnt;
    };
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (countLE(mid) < k) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countLE(matrix, mid, n) < k) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
    private int countLE(int[][] m, int x, int n) {
        int cnt = 0, r = n - 1, c = 0;
        while (r >= 0 && c < n) {
            if (m[r][c] <= x) { cnt += r + 1; c++; }
            else r--;
        }
        return cnt;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int kthSmallest(vector<vector<int>>& matrix, int k) {
        int n = matrix.size();
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        auto countLE = [&](int x) {
            int cnt = 0, r = n - 1, c = 0;
            while (r >= 0 && c < n) {
                if (matrix[r][c] <= x) { cnt += r + 1; c++; }
                else r--;
            }
            return cnt;
        };
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countLE(mid) < k) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // largestPerimeter(nums: List[int]) -> int  — sort desc, greedy adjacent triple.
  'largest-perimeter-triangle': {
    python: `class Solution:
    def largestPerimeter(self, nums: List[int]) -> int:
        nums.sort(reverse=True)
        for i in range(len(nums) - 2):
            if nums[i] < nums[i + 1] + nums[i + 2]:
                return nums[i] + nums[i + 1] + nums[i + 2]
        return 0`,
    javascript: `var largestPerimeter = function(nums) {
    nums.sort((a, b) => b - a);
    for (let i = 0; i < nums.length - 2; i++) {
        if (nums[i] < nums[i + 1] + nums[i + 2]) {
            return nums[i] + nums[i + 1] + nums[i + 2];
        }
    }
    return 0;
};`,
    java: `import java.util.*;
class Solution {
    public int largestPerimeter(int[] nums) {
        Arrays.sort(nums);
        for (int i = nums.length - 1; i >= 2; i--) {
            if (nums[i] < nums[i - 1] + nums[i - 2]) {
                return nums[i] + nums[i - 1] + nums[i - 2];
            }
        }
        return 0;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestPerimeter(vector<int>& nums) {
        sort(nums.rbegin(), nums.rend());
        for (int i = 0; i + 2 < (int)nums.size(); i++) {
            if (nums[i] < nums[i + 1] + nums[i + 2]) {
                return nums[i] + nums[i + 1] + nums[i + 2];
            }
        }
        return 0;
    }
};`,
  },

  // characterReplacement(s: str, k: int) -> int  — sliding window, window - maxFreq ≤ k.
  'longest-repeating-character-replacement': {
    python: `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = {}
        left = 0
        maxFreq = 0
        best = 0
        for right in range(len(s)):
            count[s[right]] = count.get(s[right], 0) + 1
            maxFreq = max(maxFreq, count[s[right]])
            while (right - left + 1) - maxFreq > k:
                count[s[left]] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,
    javascript: `var characterReplacement = function(s, k) {
    const count = new Array(26).fill(0);
    let left = 0, maxFreq = 0, best = 0;
    for (let right = 0; right < s.length; right++) {
        const idx = s.charCodeAt(right) - 65;
        count[idx]++;
        maxFreq = Math.max(maxFreq, count[idx]);
        while ((right - left + 1) - maxFreq > k) {
            count[s.charCodeAt(left) - 65]--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] count = new int[26];
        int left = 0, maxFreq = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            int idx = s.charAt(right) - 'A';
            count[idx]++;
            maxFreq = Math.max(maxFreq, count[idx]);
            while ((right - left + 1) - maxFreq > k) {
                count[s.charAt(left) - 'A']--;
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
    int characterReplacement(string s, int k) {
        vector<int> count(26, 0);
        int left = 0, maxFreq = 0, best = 0;
        for (int right = 0; right < (int)s.size(); right++) {
            int idx = s[right] - 'A';
            count[idx]++;
            maxFreq = max(maxFreq, count[idx]);
            while ((right - left + 1) - maxFreq > k) {
                count[s[left] - 'A']--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // luckyNumbers(matrix: List[List[int]]) -> List[int]  — min of its row AND max of its column.
  'lucky-numbers-in-a-matrix': {
    python: `class Solution:
    def luckyNumbers(self, matrix: List[List[int]]) -> List[int]:
        rowMins = set(min(row) for row in matrix)
        colMaxs = set(max(col) for col in zip(*matrix))
        return list(rowMins & colMaxs)`,
    javascript: `var luckyNumbers = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    const rowMins = new Set();
    for (const row of matrix) rowMins.add(Math.min(...row));
    const colMaxs = new Set();
    for (let c = 0; c < n; c++) {
        let mx = -Infinity;
        for (let r = 0; r < m; r++) mx = Math.max(mx, matrix[r][c]);
        colMaxs.add(mx);
    }
    const res = [];
    for (const v of rowMins) if (colMaxs.has(v)) res.push(v);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> luckyNumbers(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        Set<Integer> rowMins = new HashSet<>();
        for (int[] row : matrix) {
            int mn = Integer.MAX_VALUE;
            for (int v : row) mn = Math.min(mn, v);
            rowMins.add(mn);
        }
        List<Integer> res = new ArrayList<>();
        for (int c = 0; c < n; c++) {
            int mx = Integer.MIN_VALUE;
            for (int r = 0; r < m; r++) mx = Math.max(mx, matrix[r][c]);
            if (rowMins.contains(mx)) res.add(mx);
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> luckyNumbers(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        set<int> rowMins;
        for (auto& row : matrix) rowMins.insert(*min_element(row.begin(), row.end()));
        vector<int> res;
        for (int c = 0; c < n; c++) {
            int mx = INT_MIN;
            for (int r = 0; r < m; r++) mx = max(mx, matrix[r][c]);
            if (rowMins.count(mx)) res.push_back(mx);
        }
        return res;
    }
};`,
  },

  // maximalSquare(matrix: List[List[str]]) -> int  — DP side length, return area.
  'maximal-square': {
    python: `class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        if not matrix or not matrix[0]:
            return 0
        rows, cols = len(matrix), len(matrix[0])
        dp = [[0] * (cols + 1) for _ in range(rows + 1)]
        best = 0
        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                if matrix[i - 1][j - 1] == '1':
                    dp[i][j] = min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
                    best = max(best, dp[i][j])
        return best * best`,
    javascript: `var maximalSquare = function(matrix) {
    if (!matrix || matrix.length === 0 || matrix[0].length === 0) return 0;
    const rows = matrix.length, cols = matrix[0].length;
    const dp = Array.from({length: rows + 1}, () => new Array(cols + 1).fill(0));
    let best = 0;
    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            if (matrix[i - 1][j - 1] === '1') {
                dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
                best = Math.max(best, dp[i][j]);
            }
        }
    }
    return best * best;
};`,
    java: `class Solution {
    public int maximalSquare(String[][] matrix) {
        if (matrix.length == 0 || matrix[0].length == 0) return 0;
        int rows = matrix.length, cols = matrix[0].length;
        int[][] dp = new int[rows + 1][cols + 1];
        int best = 0;
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                if (matrix[i - 1][j - 1].equals("1")) {
                    dp[i][j] = Math.min(Math.min(dp[i - 1][j], dp[i][j - 1]), dp[i - 1][j - 1]) + 1;
                    best = Math.max(best, dp[i][j]);
                }
            }
        }
        return best * best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximalSquare(vector<vector<string>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return 0;
        int rows = matrix.size(), cols = matrix[0].size();
        vector<vector<int>> dp(rows + 1, vector<int>(cols + 1, 0));
        int best = 0;
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                if (matrix[i - 1][j - 1] == "1") {
                    dp[i][j] = min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]}) + 1;
                    best = max(best, dp[i][j]);
                }
            }
        }
        return best * best;
    }
};`,
  },

  // maximum69Number(num: int) -> int  — flip the first '6' to '9'.
  'maximum-69-number': {
    python: `class Solution:
    def maximum69Number(self, num: int) -> int:
        return int(str(num).replace('6', '9', 1))`,
    javascript: `var maximum69Number = function(num) {
    return parseInt(String(num).replace('6', '9'), 10);
};`,
    java: `class Solution {
    public int maximum69Number(int num) {
        return Integer.parseInt(String.valueOf(num).replaceFirst("6", "9"));
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximum69Number(int num) {
        string s = to_string(num);
        for (char& c : s) {
            if (c == '6') { c = '9'; break; }
        }
        return stoi(s);
    }
};`,
  },

  // maxAscendingSum(nums: List[int]) -> int  — running sum over strictly ascending runs.
  'maximum-ascending-subarray-sum': {
    python: `class Solution:
    def maxAscendingSum(self, nums: List[int]) -> int:
        best = cur = nums[0]
        for i in range(1, len(nums)):
            if nums[i] > nums[i - 1]:
                cur += nums[i]
            else:
                cur = nums[i]
            best = max(best, cur)
        return best`,
    javascript: `var maxAscendingSum = function(nums) {
    let best = nums[0], cur = nums[0];
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i - 1]) cur += nums[i];
        else cur = nums[i];
        best = Math.max(best, cur);
    }
    return best;
};`,
    java: `class Solution {
    public int maxAscendingSum(int[] nums) {
        int best = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] > nums[i - 1]) cur += nums[i];
            else cur = nums[i];
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxAscendingSum(vector<int>& nums) {
        int best = nums[0], cur = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            if (nums[i] > nums[i - 1]) cur += nums[i];
            else cur = nums[i];
            best = max(best, cur);
        }
        return best;
    }
};`,
  },

  // findLongestChain(pairs: List[List[int]]) -> int  — greedy by end, count non-overlapping.
  'maximum-length-of-pair-chain': {
    python: `class Solution:
    def findLongestChain(self, pairs: List[List[int]]) -> int:
        pairs.sort(key=lambda p: p[1])
        count = 0
        cur_end = float('-inf')
        for s, e in pairs:
            if s > cur_end:
                count += 1
                cur_end = e
        return count`,
    javascript: `var findLongestChain = function(pairs) {
    pairs.sort((a, b) => a[1] - b[1]);
    let count = 0, curEnd = -Infinity;
    for (const [s, e] of pairs) {
        if (s > curEnd) { count++; curEnd = e; }
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int findLongestChain(int[][] pairs) {
        Arrays.sort(pairs, (a, b) -> Integer.compare(a[1], b[1]));
        int count = 0;
        long curEnd = Long.MIN_VALUE;
        for (int[] p : pairs) {
            if (p[0] > curEnd) { count++; curEnd = p[1]; }
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findLongestChain(vector<vector<int>>& pairs) {
        sort(pairs.begin(), pairs.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[1] < b[1]; });
        int count = 0;
        long long curEnd = LLONG_MIN;
        for (auto& p : pairs) {
            if (p[0] > curEnd) { count++; curEnd = p[1]; }
        }
        return count;
    }
};`,
  },

  // findLength(nums1: List[int], nums2: List[int]) -> int  — longest common subarray DP.
  'maximum-length-of-repeated-subarray': {
    python: `class Solution:
    def findLength(self, nums1: List[int], nums2: List[int]) -> int:
        m, n = len(nums1), len(nums2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        best = 0
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                if nums1[i] == nums2[j]:
                    dp[i][j] = dp[i + 1][j + 1] + 1
                    best = max(best, dp[i][j])
        return best`,
    javascript: `var findLength = function(nums1, nums2) {
    const m = nums1.length, n = nums2.length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    let best = 0;
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (nums1[i] === nums2[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
                best = Math.max(best, dp[i][j]);
            }
        }
    }
    return best;
};`,
    java: `class Solution {
    public int findLength(int[] nums1, int[] nums2) {
        int m = nums1.length, n = nums2.length;
        int[][] dp = new int[m + 1][n + 1];
        int best = 0;
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                if (nums1[i] == nums2[j]) {
                    dp[i][j] = dp[i + 1][j + 1] + 1;
                    best = Math.max(best, dp[i][j]);
                }
            }
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findLength(vector<int>& nums1, vector<int>& nums2) {
        int m = nums1.size(), n = nums2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        int best = 0;
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                if (nums1[i] == nums2[j]) {
                    dp[i][j] = dp[i + 1][j + 1] + 1;
                    best = max(best, dp[i][j]);
                }
            }
        }
        return best;
    }
};`,
  },
};
