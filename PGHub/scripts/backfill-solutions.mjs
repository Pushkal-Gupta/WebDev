#!/usr/bin/env node
// Backfill PGcode_problems.solutions with VERIFIED 4-language canonicals.
//
// This script does NOT author algorithms blindly. It carries a hand-written,
// human-reviewed canonical (Python / JavaScript / Java / C++) for each problem
// id in CANONICALS below, then PROVES each language against the problem's own
// stored test_cases via Judge0 (wrapWithDriver + buildStdin + compareOutput).
// Only languages that pass EVERY test case are written back to the DB. The
// write touches the `solutions` column ONLY — test_cases is never modified.
//
// Idempotent + resumable: a language already present & non-stub in the row is
// skipped (unless --force), and a problem already complete in all 4 langs is
// reported as "already complete" without re-grading.
//
// Usage:
//   node scripts/backfill-solutions.mjs --dry           # grade, print table, NO db write
//   node scripts/backfill-solutions.mjs                 # grade + write verified langs
//   node scripts/backfill-solutions.mjs --only number-of-islands,merge-intervals
//   node scripts/backfill-solutions.mjs --force         # re-grade + overwrite even if present
//
// Secrets: process.env only (loaded from .env). Never hardcode the service key.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SVC);

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const val = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : d;
};
const DRY = has('dry');
const FORCE = has('force');
const ONLY = val('only') ? val('only').split(',').map(s => s.trim()).filter(Boolean) : null;
const JUDGE0_URL = (val('judge0') || 'https://ce.judge0.com').replace(/\/$/, '');
const PAUSE_MS = Number(val('pause') || 350);

const LANG_ID = { python: 71, javascript: 63, java: 62, cpp: 54 };
const LANGS = ['python', 'javascript', 'java', 'cpp'];

// ── hand-authored, human-reviewed canonicals ────────────────────────────────
// Each value is the METHOD BODY ONLY in the LeetCode-style class/function shape
// that wrapWithDriver expects (it calls Solution().<method>(...) for py/java/cpp,
// and the bare `var <method> = function(){}` for js). Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
const CANONICALS = {
  // numIslands(grid: List[List[str]]) -> int  — DFS flood fill on '1' cells.
  'number-of-islands': {
    python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid or not grid[0]:
            return 0
        rows, cols = len(grid), len(grid[0])
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1
                    dfs(r, c)
        return count`,
    javascript: `var numIslands = function(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) return 0;
    const rows = grid.length, cols = grid[0].length;
    const dfs = (r, c) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') { count++; dfs(r, c); }
        }
    }
    return count;
};`,
    java: `class Solution {
    private int rows, cols;
    public int numIslands(String[][] grid) {
        if (grid == null || grid.length == 0 || grid[0].length == 0) return 0;
        rows = grid.length; cols = grid[0].length;
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c].equals("1")) { count++; dfs(grid, r, c); }
            }
        }
        return count;
    }
    private void dfs(String[][] grid, int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || !grid[r][c].equals("1")) return;
        grid[r][c] = "0";
        dfs(grid, r + 1, c); dfs(grid, r - 1, c); dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<string>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;
        int rows = grid.size(), cols = grid[0].size(), count = 0;
        function<void(int,int)> dfs = [&](int r, int c) {
            if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != "1") return;
            grid[r][c] = "0";
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
        };
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (grid[r][c] == "1") { count++; dfs(r, c); }
        return count;
    }
};`,
  },

  // merge(intervals: List[List[int]]) -> List[List[int]]  — sort + sweep.
  'merge-intervals': {
    python: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0][:]]
        for s, e in intervals[1:]:
            if s <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], e)
            else:
                merged.append([s, e])
        return merged`,
    javascript: `var merge = function(intervals) {
    if (!intervals || intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [[intervals[0][0], intervals[0][1]]];
    for (let i = 1; i < intervals.length; i++) {
        const [s, e] = intervals[i];
        const last = merged[merged.length - 1];
        if (s <= last[1]) last[1] = Math.max(last[1], e);
        else merged.push([s, e]);
    }
    return merged;
};`,
    java: `import java.util.*;
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length == 0) return new int[0][0];
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        int[] cur = new int[]{intervals[0][0], intervals[0][1]};
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] <= cur[1]) {
                cur[1] = Math.max(cur[1], intervals[i][1]);
            } else {
                merged.add(cur);
                cur = new int[]{intervals[i][0], intervals[i][1]};
            }
        }
        merged.add(cur);
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end(),
             [](const vector<int>& a, const vector<int>& b){ return a[0] < b[0]; });
        vector<vector<int>> merged;
        merged.push_back(intervals[0]);
        for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1])
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            else
                merged.push_back(intervals[i]);
        }
        return merged;
    }
};`,
  },

  // uniquePaths(m: int, n: int) -> int  — DP grid count.
  'unique-paths': {
    python: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        dp = [1] * n
        for _ in range(1, m):
            for j in range(1, n):
                dp[j] += dp[j - 1]
        return dp[n - 1]`,
    javascript: `var uniquePaths = function(m, n) {
    const dp = new Array(n).fill(1);
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp[n - 1];
};`,
    java: `class Solution {
    public int uniquePaths(int m, int n) {
        int[] dp = new int[n];
        java.util.Arrays.fill(dp, 1);
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[j] += dp[j - 1];
            }
        }
        return dp[n - 1];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<long long> dp(n, 1);
        for (int i = 1; i < m; i++)
            for (int j = 1; j < n; j++)
                dp[j] += dp[j - 1];
        return (int)dp[n - 1];
    }
};`,
  },

  // longestOnes(nums: List[int], k: int) -> int  — sliding window, ≤k zeros.
  'max-consecutive-ones-iii': {
    python: `class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        left = 0
        zeros = 0
        best = 0
        for right in range(len(nums)):
            if nums[right] == 0:
                zeros += 1
            while zeros > k:
                if nums[left] == 0:
                    zeros -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,
    javascript: `var longestOnes = function(nums, k) {
    let left = 0, zeros = 0, best = 0;
    for (let right = 0; right < nums.length; right++) {
        if (nums[right] === 0) zeros++;
        while (zeros > k) {
            if (nums[left] === 0) zeros--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
};`,
    java: `class Solution {
    public int longestOnes(int[] nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < nums.length; right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
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
    int longestOnes(vector<int>& nums, int k) {
        int left = 0, zeros = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            if (nums[right] == 0) zeros++;
            while (zeros > k) {
                if (nums[left] == 0) zeros--;
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
  },

  // kClosest(points: List[List[int]], k: int) -> List[List[int]]
  // Sorted by squared distance ascending, take k. Stable to preserve input
  // order on ties (matches the stored expectations).
  'k-closest-points-to-origin': {
    python: `class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        return sorted(points, key=lambda p: p[0] * p[0] + p[1] * p[1])[:k]`,
    javascript: `var kClosest = function(points, k) {
    const d = p => p[0] * p[0] + p[1] * p[1];
    return points
        .map((p, i) => [p, i])
        .sort((a, b) => (d(a[0]) - d(b[0])) || (a[1] - b[1]))
        .slice(0, k)
        .map(x => x[0]);
};`,
    java: `import java.util.*;
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        Integer[] idx = new Integer[points.length];
        for (int i = 0; i < points.length; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> {
            long da = (long) points[a][0] * points[a][0] + (long) points[a][1] * points[a][1];
            long db = (long) points[b][0] * points[b][0] + (long) points[b][1] * points[b][1];
            if (da != db) return Long.compare(da, db);
            return Integer.compare(a, b);
        });
        int[][] res = new int[k][];
        for (int i = 0; i < k; i++) res[i] = points[idx[i]];
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> kClosest(vector<vector<int>>& points, int k) {
        int n = points.size();
        vector<int> idx(n);
        for (int i = 0; i < n; i++) idx[i] = i;
        auto dist = [&](int i){ return (long long)points[i][0]*points[i][0] + (long long)points[i][1]*points[i][1]; };
        stable_sort(idx.begin(), idx.end(), [&](int a, int b){ return dist(a) < dist(b); });
        vector<vector<int>> res;
        for (int i = 0; i < k && i < n; i++) res.push_back(points[idx[i]]);
        return res;
    }
};`,
  },

  // ── batch 2: 25 famous targets (primitive types; signatures verified vs DB) ──

  // moveZeroes(nums: List[int]) -> List[int]  — in-place compaction, returns array.
  'move-zeroes': {
    python: `class Solution:
    def moveZeroes(self, nums: List[int]) -> List[int]:
        j = 0
        for i in range(len(nums)):
            if nums[i] != 0:
                nums[j], nums[i] = nums[i], nums[j]
                j += 1
        return nums`,
    javascript: `var moveZeroes = function(nums) {
    let j = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== 0) { [nums[j], nums[i]] = [nums[i], nums[j]]; j++; }
    }
    return nums;
};`,
    java: `class Solution {
    public int[] moveZeroes(int[] nums) {
        int j = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != 0) { int t = nums[j]; nums[j] = nums[i]; nums[i] = t; j++; }
        }
        return nums;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> moveZeroes(vector<int>& nums) {
        int j = 0;
        for (int i = 0; i < (int)nums.size(); i++)
            if (nums[i] != 0) swap(nums[j++], nums[i]);
        return nums;
    }
};`,
  },

  // majorityElement(nums: List[int]) -> int  — Boyer-Moore vote.
  'majority-element': {
    python: `class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        count = 0
        cand = None
        for x in nums:
            if count == 0:
                cand = x
            count += 1 if x == cand else -1
        return cand`,
    javascript: `var majorityElement = function(nums) {
    let count = 0, cand = null;
    for (const x of nums) {
        if (count === 0) cand = x;
        count += (x === cand) ? 1 : -1;
    }
    return cand;
};`,
    java: `class Solution {
    public int majorityElement(int[] nums) {
        int count = 0, cand = 0;
        for (int x : nums) {
            if (count == 0) cand = x;
            count += (x == cand) ? 1 : -1;
        }
        return cand;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int count = 0, cand = 0;
        for (int x : nums) {
            if (count == 0) cand = x;
            count += (x == cand) ? 1 : -1;
        }
        return cand;
    }
};`,
  },

  // missingNumber(nums: List[int]) -> int  — Gauss sum.
  'missing-number': {
    python: `class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        n = len(nums)
        return n * (n + 1) // 2 - sum(nums)`,
    javascript: `var missingNumber = function(nums) {
    const n = nums.length;
    let sum = n * (n + 1) / 2;
    for (const x of nums) sum -= x;
    return sum;
};`,
    java: `class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length, sum = n * (n + 1) / 2;
        for (int x : nums) sum -= x;
        return sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size();
        long long sum = (long long)n * (n + 1) / 2;
        for (int x : nums) sum -= x;
        return (int)sum;
    }
};`,
  },

  // transpose(grid: List[List[int]]) -> Any  — matrix transpose.
  'transpose-matrix': {
    python: `class Solution:
    def transpose(self, grid: List[List[int]]) -> Any:
        return [list(row) for row in zip(*grid)]`,
    javascript: `var transpose = function(grid) {
    const m = grid.length, n = grid[0].length;
    const res = Array.from({length: n}, () => new Array(m));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            res[j][i] = grid[i][j];
    return res;
};`,
    java: `class Solution {
    public int[][] transpose(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[][] res = new int[n][m];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                res[j][i] = grid[i][j];
        return res;
    }
}`,
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

  // coinChange(coins: List[int], amount: int) -> int  — DP, -1 if impossible.
  'coin-change': {
    python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        INF = amount + 1
        dp = [0] + [INF] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)
        return dp[amount] if dp[amount] <= amount else -1`,
    javascript: `var coinChange = function(coins, amount) {
    const INF = amount + 1;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    for (let a = 1; a <= amount; a++)
        for (const c of coins)
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] <= amount ? dp[amount] : -1;
};`,
    java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        return dp[amount] <= amount ? dp[amount] : -1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};`,
  },

  // rob(nums: List[int]) -> int  — house robber DP.
  'house-robber': {
    python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        prev, cur = 0, 0
        for x in nums:
            prev, cur = cur, max(cur, prev + x)
        return cur`,
    javascript: `var rob = function(nums) {
    let prev = 0, cur = 0;
    for (const x of nums) {
        const t = Math.max(cur, prev + x);
        prev = cur; cur = t;
    }
    return cur;
};`,
    java: `class Solution {
    public int rob(int[] nums) {
        int prev = 0, cur = 0;
        for (int x : nums) {
            int t = Math.max(cur, prev + x);
            prev = cur; cur = t;
        }
        return cur;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int rob(vector<int>& nums) {
        int prev = 0, cur = 0;
        for (int x : nums) {
            int t = max(cur, prev + x);
            prev = cur; cur = t;
        }
        return cur;
    }
};`,
  },

  // subsets(nums: List[int]) -> List[List[int]]  — DFS start-index order.
  'subsets': {
    python: `class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        res = []
        path = []
        def dfs(start):
            res.append(path[:])
            for i in range(start, len(nums)):
                path.append(nums[i])
                dfs(i + 1)
                path.pop()
        dfs(0)
        return res`,
    javascript: `var subsets = function(nums) {
    const res = [], path = [];
    const dfs = (start) => {
        res.push(path.slice());
        for (let i = start; i < nums.length; i++) {
            path.push(nums[i]);
            dfs(i + 1);
            path.pop();
        }
    };
    dfs(0);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, 0, new ArrayList<>(), res);
        return res;
    }
    private void dfs(int[] nums, int start, List<Integer> path, List<List<Integer>> res) {
        res.add(new ArrayList<>(path));
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            dfs(nums, i + 1, path, res);
            path.remove(path.size() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        function<void(int)> dfs = [&](int start) {
            res.push_back(path);
            for (int i = start; i < (int)nums.size(); i++) {
                path.push_back(nums[i]);
                dfs(i + 1);
                path.pop_back();
            }
        };
        dfs(0);
        return res;
    }
};`,
  },

  // permute(nums: List[int]) -> List[List[int]]  — fix-position DFS (index order).
  'permutations': {
    python: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        res = []
        used = [False] * len(nums)
        path = []
        def dfs():
            if len(path) == len(nums):
                res.append(path[:])
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                used[i] = True
                path.append(nums[i])
                dfs()
                path.pop()
                used[i] = False
        dfs()
        return res`,
    javascript: `var permute = function(nums) {
    const res = [], path = [], used = new Array(nums.length).fill(false);
    const dfs = () => {
        if (path.length === nums.length) { res.push(path.slice()); return; }
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true; path.push(nums[i]);
            dfs();
            path.pop(); used[i] = false;
        }
    };
    dfs();
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        dfs(nums, used, new ArrayList<>(), res);
        return res;
    }
    private void dfs(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true; path.add(nums[i]);
            dfs(nums, used, path, res);
            path.remove(path.size() - 1); used[i] = false;
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        function<void()> dfs = [&]() {
            if (path.size() == nums.size()) { res.push_back(path); return; }
            for (int i = 0; i < (int)nums.size(); i++) {
                if (used[i]) continue;
                used[i] = true; path.push_back(nums[i]);
                dfs();
                path.pop_back(); used[i] = false;
            }
        };
        dfs();
        return res;
    }
};`,
  },

  // combine(n: int, k: int) -> List[List[int]]  — choose k from 1..n, ascending.
  'combinations': {
    python: `class Solution:
    def combine(self, n: int, k: int) -> List[List[int]]:
        res = []
        path = []
        def dfs(start):
            if len(path) == k:
                res.append(path[:])
                return
            for i in range(start, n + 1):
                path.append(i)
                dfs(i + 1)
                path.pop()
        dfs(1)
        return res`,
    javascript: `var combine = function(n, k) {
    const res = [], path = [];
    const dfs = (start) => {
        if (path.length === k) { res.push(path.slice()); return; }
        for (let i = start; i <= n; i++) {
            path.push(i);
            dfs(i + 1);
            path.pop();
        }
    };
    dfs(1);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(n, k, 1, new ArrayList<>(), res);
        return res;
    }
    private void dfs(int n, int k, int start, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == k) { res.add(new ArrayList<>(path)); return; }
        for (int i = start; i <= n; i++) {
            path.add(i);
            dfs(n, k, i + 1, path, res);
            path.remove(path.size() - 1);
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> combine(int n, int k) {
        vector<vector<int>> res;
        vector<int> path;
        function<void(int)> dfs = [&](int start) {
            if ((int)path.size() == k) { res.push_back(path); return; }
            for (int i = start; i <= n; i++) {
                path.push_back(i);
                dfs(i + 1);
                path.pop_back();
            }
        };
        dfs(1);
        return res;
    }
};`,
  },

  // spiralOrder(matrix: List[List[int]]) -> List[int]  — boundary shrink.
  'spiral-matrix': {
    python: `class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        if not matrix or not matrix[0]:
            return []
        res = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for j in range(left, right + 1):
                res.append(matrix[top][j])
            top += 1
            for i in range(top, bottom + 1):
                res.append(matrix[i][right])
            right -= 1
            if top <= bottom:
                for j in range(right, left - 1, -1):
                    res.append(matrix[bottom][j])
                bottom -= 1
            if left <= right:
                for i in range(bottom, top - 1, -1):
                    res.append(matrix[i][left])
                left += 1
        return res`,
    javascript: `var spiralOrder = function(matrix) {
    if (!matrix || matrix.length === 0 || matrix[0].length === 0) return [];
    const res = [];
    let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) res.push(matrix[top][j]);
        top++;
        for (let i = top; i <= bottom; i++) res.push(matrix[i][right]);
        right--;
        if (top <= bottom) { for (let j = right; j >= left; j--) res.push(matrix[bottom][j]); bottom--; }
        if (left <= right) { for (let i = bottom; i >= top; i--) res.push(matrix[i][left]); left++; }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        if (matrix.length == 0 || matrix[0].length == 0) return res;
        int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) res.add(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) res.add(matrix[i][right]);
            right--;
            if (top <= bottom) { for (int j = right; j >= left; j--) res.add(matrix[bottom][j]); bottom--; }
            if (left <= right) { for (int i = bottom; i >= top; i--) res.add(matrix[i][left]); left++; }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> res;
        if (matrix.empty() || matrix[0].empty()) return res;
        int top = 0, bottom = matrix.size() - 1, left = 0, right = matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) res.push_back(matrix[top][j]);
            top++;
            for (int i = top; i <= bottom; i++) res.push_back(matrix[i][right]);
            right--;
            if (top <= bottom) { for (int j = right; j >= left; j--) res.push_back(matrix[bottom][j]); bottom--; }
            if (left <= right) { for (int i = bottom; i >= top; i--) res.push_back(matrix[i][left]); left++; }
        }
        return res;
    }
};`,
  },

  // rotate(matrix: List[List[int]]) -> List[List[int]]  — transpose + reverse rows.
  'rotate-image': {
    python: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> List[List[int]]:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()
        return matrix`,
    javascript: `var rotate = function(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    for (const row of matrix) row.reverse();
    return matrix;
};`,
    java: `class Solution {
    public int[][] rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
            }
        for (int[] row : matrix)
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int t = row[l]; row[l] = row[r]; row[r] = t;
            }
        return matrix;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++)
                swap(matrix[i][j], matrix[j][i]);
        for (auto& row : matrix) reverse(row.begin(), row.end());
        return matrix;
    }
};`,
  },

  // setZeroes(matrix: List[List[int]]) -> List[List[int]]  — O(1) markers.
  'set-matrix-zeroes': {
    python: `class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> List[List[int]]:
        rows, cols = len(matrix), len(matrix[0])
        first_row = any(matrix[0][j] == 0 for j in range(cols))
        first_col = any(matrix[i][0] == 0 for i in range(rows))
        for i in range(1, rows):
            for j in range(1, cols):
                if matrix[i][j] == 0:
                    matrix[i][0] = 0
                    matrix[0][j] = 0
        for i in range(1, rows):
            for j in range(1, cols):
                if matrix[i][0] == 0 or matrix[0][j] == 0:
                    matrix[i][j] = 0
        if first_row:
            for j in range(cols):
                matrix[0][j] = 0
        if first_col:
            for i in range(rows):
                matrix[i][0] = 0
        return matrix`,
    javascript: `var setZeroes = function(matrix) {
    const rows = matrix.length, cols = matrix[0].length;
    let firstRow = false, firstCol = false;
    for (let j = 0; j < cols; j++) if (matrix[0][j] === 0) firstRow = true;
    for (let i = 0; i < rows; i++) if (matrix[i][0] === 0) firstCol = true;
    for (let i = 1; i < rows; i++)
        for (let j = 1; j < cols; j++)
            if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
    for (let i = 1; i < rows; i++)
        for (let j = 1; j < cols; j++)
            if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0;
    if (firstRow) for (let j = 0; j < cols; j++) matrix[0][j] = 0;
    if (firstCol) for (let i = 0; i < rows; i++) matrix[i][0] = 0;
    return matrix;
};`,
    java: `class Solution {
    public int[][] setZeroes(int[][] matrix) {
        int rows = matrix.length, cols = matrix[0].length;
        boolean firstRow = false, firstCol = false;
        for (int j = 0; j < cols; j++) if (matrix[0][j] == 0) firstRow = true;
        for (int i = 0; i < rows; i++) if (matrix[i][0] == 0) firstCol = true;
        for (int i = 1; i < rows; i++)
            for (int j = 1; j < cols; j++)
                if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (int i = 1; i < rows; i++)
            for (int j = 1; j < cols; j++)
                if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (firstRow) for (int j = 0; j < cols; j++) matrix[0][j] = 0;
        if (firstCol) for (int i = 0; i < rows; i++) matrix[i][0] = 0;
        return matrix;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> setZeroes(vector<vector<int>>& matrix) {
        int rows = matrix.size(), cols = matrix[0].size();
        bool firstRow = false, firstCol = false;
        for (int j = 0; j < cols; j++) if (matrix[0][j] == 0) firstRow = true;
        for (int i = 0; i < rows; i++) if (matrix[i][0] == 0) firstCol = true;
        for (int i = 1; i < rows; i++)
            for (int j = 1; j < cols; j++)
                if (matrix[i][j] == 0) { matrix[i][0] = 0; matrix[0][j] = 0; }
        for (int i = 1; i < rows; i++)
            for (int j = 1; j < cols; j++)
                if (matrix[i][0] == 0 || matrix[0][j] == 0) matrix[i][j] = 0;
        if (firstRow) for (int j = 0; j < cols; j++) matrix[0][j] = 0;
        if (firstCol) for (int i = 0; i < rows; i++) matrix[i][0] = 0;
        return matrix;
    }
};`,
  },

  // wordPattern(pattern: str, s: str) -> bool  — bijection check.
  'word-pattern': {
    python: `class Solution:
    def wordPattern(self, pattern: str, s: str) -> bool:
        words = s.split()
        if len(pattern) != len(words):
            return False
        p2w, w2p = {}, {}
        for c, w in zip(pattern, words):
            if c in p2w and p2w[c] != w:
                return False
            if w in w2p and w2p[w] != c:
                return False
            p2w[c] = w
            w2p[w] = c
        return True`,
    javascript: `var wordPattern = function(pattern, s) {
    const words = s.split(/\\s+/).filter(Boolean);
    if (pattern.length !== words.length) return false;
    const p2w = new Map(), w2p = new Map();
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i], w = words[i];
        if (p2w.has(c) && p2w.get(c) !== w) return false;
        if (w2p.has(w) && w2p.get(w) !== c) return false;
        p2w.set(c, w); w2p.set(w, c);
    }
    return true;
};`,
    java: `import java.util.*;
class Solution {
    public boolean wordPattern(String pattern, String s) {
        String[] words = s.split("\\\\s+");
        if (pattern.length() != words.length) return false;
        Map<Character, String> p2w = new HashMap<>();
        Map<String, Character> w2p = new HashMap<>();
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            String w = words[i];
            if (p2w.containsKey(c) && !p2w.get(c).equals(w)) return false;
            if (w2p.containsKey(w) && w2p.get(w) != c) return false;
            p2w.put(c, w); w2p.put(w, c);
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool wordPattern(string pattern, string s) {
        vector<string> words;
        stringstream ss(s);
        string w;
        while (ss >> w) words.push_back(w);
        if (pattern.size() != words.size()) return false;
        unordered_map<char, string> p2w;
        unordered_map<string, char> w2p;
        for (size_t i = 0; i < pattern.size(); i++) {
            char c = pattern[i];
            if (p2w.count(c) && p2w[c] != words[i]) return false;
            if (w2p.count(words[i]) && w2p[words[i]] != c) return false;
            p2w[c] = words[i]; w2p[words[i]] = c;
        }
        return true;
    }
};`,
  },

  // isIsomorphic(s: str, t: str) -> bool  — two-way mapping.
  'isomorphic-strings': {
    python: `class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        s2t, t2s = {}, {}
        for a, b in zip(s, t):
            if a in s2t and s2t[a] != b:
                return False
            if b in t2s and t2s[b] != a:
                return False
            s2t[a] = b
            t2s[b] = a
        return True`,
    javascript: `var isIsomorphic = function(s, t) {
    if (s.length !== t.length) return false;
    const s2t = new Map(), t2s = new Map();
    for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i];
        if (s2t.has(a) && s2t.get(a) !== b) return false;
        if (t2s.has(b) && t2s.get(b) !== a) return false;
        s2t.set(a, b); t2s.set(b, a);
    }
    return true;
};`,
    java: `import java.util.*;
class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> s2t = new HashMap<>(), t2s = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (s2t.containsKey(a) && s2t.get(a) != b) return false;
            if (t2s.containsKey(b) && t2s.get(b) != a) return false;
            s2t.put(a, b); t2s.put(b, a);
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isIsomorphic(string s, string t) {
        if (s.size() != t.size()) return false;
        unordered_map<char, char> s2t, t2s;
        for (size_t i = 0; i < s.size(); i++) {
            char a = s[i], b = t[i];
            if (s2t.count(a) && s2t[a] != b) return false;
            if (t2s.count(b) && t2s[b] != a) return false;
            s2t[a] = b; t2s[b] = a;
        }
        return true;
    }
};`,
  },

  // combinationSum(candidates: List[int], target: int) -> List[List[int]]
  'combination-sum': {
    python: `class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        res = []
        path = []
        def dfs(start, remain):
            if remain == 0:
                res.append(path[:])
                return
            for i in range(start, len(candidates)):
                if candidates[i] <= remain:
                    path.append(candidates[i])
                    dfs(i, remain - candidates[i])
                    path.pop()
        dfs(0, target)
        return res`,
    javascript: `var combinationSum = function(candidates, target) {
    const res = [], path = [];
    const dfs = (start, remain) => {
        if (remain === 0) { res.push(path.slice()); return; }
        for (let i = start; i < candidates.length; i++) {
            if (candidates[i] <= remain) {
                path.push(candidates[i]);
                dfs(i, remain - candidates[i]);
                path.pop();
            }
        }
    };
    dfs(0, target);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(candidates, 0, target, new ArrayList<>(), res);
        return res;
    }
    private void dfs(int[] c, int start, int remain, List<Integer> path, List<List<Integer>> res) {
        if (remain == 0) { res.add(new ArrayList<>(path)); return; }
        for (int i = start; i < c.length; i++) {
            if (c[i] <= remain) {
                path.add(c[i]);
                dfs(c, i, remain - c[i], path, res);
                path.remove(path.size() - 1);
            }
        }
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> res;
        vector<int> path;
        function<void(int,int)> dfs = [&](int start, int remain) {
            if (remain == 0) { res.push_back(path); return; }
            for (int i = start; i < (int)candidates.size(); i++) {
                if (candidates[i] <= remain) {
                    path.push_back(candidates[i]);
                    dfs(i, remain - candidates[i]);
                    path.pop_back();
                }
            }
        };
        dfs(0, target);
        return res;
    }
};`,
  },

  // findDuplicates(nums: List[int]) -> List[int]  — index-sign marking.
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

  // fizzBuzz(n: int) -> List[str]
  'fizz-buzz': {
    python: `class Solution:
    def fizzBuzz(self, n: int) -> List[str]:
        res = []
        for i in range(1, n + 1):
            if i % 15 == 0:
                res.append("FizzBuzz")
            elif i % 3 == 0:
                res.append("Fizz")
            elif i % 5 == 0:
                res.append("Buzz")
            else:
                res.append(str(i))
        return res`,
    javascript: `var fizzBuzz = function(n) {
    const res = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push("FizzBuzz");
        else if (i % 3 === 0) res.push("Fizz");
        else if (i % 5 === 0) res.push("Buzz");
        else res.push(String(i));
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<String> fizzBuzz(int n) {
        List<String> res = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) res.add("FizzBuzz");
            else if (i % 3 == 0) res.add("Fizz");
            else if (i % 5 == 0) res.add("Buzz");
            else res.add(String.valueOf(i));
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> fizzBuzz(int n) {
        vector<string> res;
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) res.push_back("FizzBuzz");
            else if (i % 3 == 0) res.push_back("Fizz");
            else if (i % 5 == 0) res.push_back("Buzz");
            else res.push_back(to_string(i));
        }
        return res;
    }
};`,
  },

  // toLowerCase(s: str) -> str
  'to-lower-case': {
    python: `class Solution:
    def toLowerCase(self, s: str) -> str:
        return ''.join(chr(ord(c) + 32) if 'A' <= c <= 'Z' else c for c in s)`,
    javascript: `var toLowerCase = function(s) {
    let res = '';
    for (const c of s) {
        const code = c.charCodeAt(0);
        res += (code >= 65 && code <= 90) ? String.fromCharCode(code + 32) : c;
    }
    return res;
};`,
    java: `class Solution {
    public String toLowerCase(String s) {
        char[] a = s.toCharArray();
        for (int i = 0; i < a.length; i++)
            if (a[i] >= 'A' && a[i] <= 'Z') a[i] = (char)(a[i] + 32);
        return new String(a);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string toLowerCase(string s) {
        for (char& c : s)
            if (c >= 'A' && c <= 'Z') c = c + 32;
        return s;
    }
};`,
  },

  // maximumWealth(input: List[List[int]]) -> Any  — max row sum.
  'richest-customer-wealth': {
    python: `class Solution:
    def maximumWealth(self, input: List[List[int]]) -> Any:
        return max(sum(row) for row in input)`,
    javascript: `var maximumWealth = function(input) {
    let best = -Infinity;
    for (const row of input) {
        let s = 0;
        for (const x of row) s += x;
        if (s > best) best = s;
    }
    return best;
};`,
    java: `class Solution {
    public int maximumWealth(int[][] input) {
        int best = Integer.MIN_VALUE;
        for (int[] row : input) {
            int s = 0;
            for (int x : row) s += x;
            best = Math.max(best, s);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maximumWealth(vector<vector<int>>& input) {
        int best = INT_MIN;
        for (auto& row : input) {
            int s = 0;
            for (int x : row) s += x;
            best = max(best, s);
        }
        return best;
    }
};`,
  },

  // lemonadeChange(bills: List[int]) -> bool
  'lemonade-change': {
    python: `class Solution:
    def lemonadeChange(self, bills: List[int]) -> bool:
        five = ten = 0
        for b in bills:
            if b == 5:
                five += 1
            elif b == 10:
                if five == 0:
                    return False
                five -= 1
                ten += 1
            else:
                if ten > 0 and five > 0:
                    ten -= 1
                    five -= 1
                elif five >= 3:
                    five -= 3
                else:
                    return False
        return True`,
    javascript: `var lemonadeChange = function(bills) {
    let five = 0, ten = 0;
    for (const b of bills) {
        if (b === 5) five++;
        else if (b === 10) { if (five === 0) return false; five--; ten++; }
        else {
            if (ten > 0 && five > 0) { ten--; five--; }
            else if (five >= 3) five -= 3;
            else return false;
        }
    }
    return true;
};`,
    java: `class Solution {
    public boolean lemonadeChange(int[] bills) {
        int five = 0, ten = 0;
        for (int b : bills) {
            if (b == 5) five++;
            else if (b == 10) { if (five == 0) return false; five--; ten++; }
            else {
                if (ten > 0 && five > 0) { ten--; five--; }
                else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool lemonadeChange(vector<int>& bills) {
        int five = 0, ten = 0;
        for (int b : bills) {
            if (b == 5) five++;
            else if (b == 10) { if (five == 0) return false; five--; ten++; }
            else {
                if (ten > 0 && five > 0) { ten--; five--; }
                else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
};`,
  },

  // findContentChildren(g: List[int], s: List[int]) -> int  — greedy two-pointer.
  'assign-cookies': {
    python: `class Solution:
    def findContentChildren(self, g: List[int], s: List[int]) -> int:
        g.sort()
        s.sort()
        i = j = 0
        while i < len(g) and j < len(s):
            if s[j] >= g[i]:
                i += 1
            j += 1
        return i`,
    javascript: `var findContentChildren = function(g, s) {
    g.sort((a, b) => a - b);
    s.sort((a, b) => a - b);
    let i = 0, j = 0;
    while (i < g.length && j < s.length) {
        if (s[j] >= g[i]) i++;
        j++;
    }
    return i;
};`,
    java: `import java.util.*;
class Solution {
    public int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g);
        Arrays.sort(s);
        int i = 0, j = 0;
        while (i < g.length && j < s.length) {
            if (s[j] >= g[i]) i++;
            j++;
        }
        return i;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int i = 0, j = 0;
        while (i < (int)g.size() && j < (int)s.size()) {
            if (s[j] >= g[i]) i++;
            j++;
        }
        return i;
    }
};`,
  },

  // minCostClimbingStairs(cost: List[int]) -> int
  'min-cost-climbing-stairs': {
    python: `class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        a, b = 0, 0
        for i in range(2, len(cost) + 1):
            a, b = b, min(b + cost[i - 1], a + cost[i - 2])
        return b`,
    javascript: `var minCostClimbingStairs = function(cost) {
    let a = 0, b = 0;
    for (let i = 2; i <= cost.length; i++) {
        const c = Math.min(b + cost[i - 1], a + cost[i - 2]);
        a = b; b = c;
    }
    return b;
};`,
    java: `class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int a = 0, b = 0;
        for (int i = 2; i <= cost.length; i++) {
            int c = Math.min(b + cost[i - 1], a + cost[i - 2]);
            a = b; b = c;
        }
        return b;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int a = 0, b = 0;
        for (int i = 2; i <= (int)cost.size(); i++) {
            int c = min(b + cost[i - 1], a + cost[i - 2]);
            a = b; b = c;
        }
        return b;
    }
};`,
  },

  // evalRPN(tokens: List[str]) -> int  — stack, truncate-toward-zero division.
  'evaluate-reverse-polish-notation': {
    python: `class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []
        for t in tokens:
            if t in ('+', '-', '*', '/'):
                b = stack.pop()
                a = stack.pop()
                if t == '+':
                    stack.append(a + b)
                elif t == '-':
                    stack.append(a - b)
                elif t == '*':
                    stack.append(a * b)
                else:
                    stack.append(int(a / b))
            else:
                stack.append(int(t))
        return stack[0]`,
    javascript: `var evalRPN = function(tokens) {
    const stack = [];
    for (const t of tokens) {
        if (t === '+' || t === '-' || t === '*' || t === '/') {
            const b = stack.pop(), a = stack.pop();
            if (t === '+') stack.push(a + b);
            else if (t === '-') stack.push(a - b);
            else if (t === '*') stack.push(a * b);
            else stack.push(Math.trunc(a / b));
        } else stack.push(parseInt(t, 10));
    }
    return stack[0];
};`,
    java: `import java.util.*;
class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            switch (t) {
                case "+": { int b = stack.pop(), a = stack.pop(); stack.push(a + b); break; }
                case "-": { int b = stack.pop(), a = stack.pop(); stack.push(a - b); break; }
                case "*": { int b = stack.pop(), a = stack.pop(); stack.push(a * b); break; }
                case "/": { int b = stack.pop(), a = stack.pop(); stack.push(a / b); break; }
                default: stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<long long> st;
        for (auto& t : tokens) {
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                long long b = st.top(); st.pop();
                long long a = st.top(); st.pop();
                if (t == "+") st.push(a + b);
                else if (t == "-") st.push(a - b);
                else if (t == "*") st.push(a * b);
                else st.push(a / b);
            } else st.push(stoll(t));
        }
        return (int)st.top();
    }
};`,
  },

  // decodeString(s: str) -> str  — stack of (count, prefix).
  'decode-string': {
    python: `class Solution:
    def decodeString(self, s: str) -> str:
        stack = []
        cur = ""
        num = 0
        for c in s:
            if c.isdigit():
                num = num * 10 + int(c)
            elif c == '[':
                stack.append((cur, num))
                cur = ""
                num = 0
            elif c == ']':
                prev, k = stack.pop()
                cur = prev + cur * k
            else:
                cur += c
        return cur`,
    javascript: `var decodeString = function(s) {
    const stack = [];
    let cur = "", num = 0;
    for (const c of s) {
        if (c >= '0' && c <= '9') num = num * 10 + (c.charCodeAt(0) - 48);
        else if (c === '[') { stack.push([cur, num]); cur = ""; num = 0; }
        else if (c === ']') { const [prev, k] = stack.pop(); cur = prev + cur.repeat(k); }
        else cur += c;
    }
    return cur;
};`,
    java: `import java.util.*;
class Solution {
    public String decodeString(String s) {
        Deque<String> strs = new ArrayDeque<>();
        Deque<Integer> nums = new ArrayDeque<>();
        StringBuilder cur = new StringBuilder();
        int num = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) num = num * 10 + (c - '0');
            else if (c == '[') { strs.push(cur.toString()); nums.push(num); cur = new StringBuilder(); num = 0; }
            else if (c == ']') {
                int k = nums.pop();
                StringBuilder tmp = new StringBuilder(strs.pop());
                for (int i = 0; i < k; i++) tmp.append(cur);
                cur = tmp;
            } else cur.append(c);
        }
        return cur.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string decodeString(string s) {
        stack<string> strs;
        stack<int> nums;
        string cur = "";
        int num = 0;
        for (char c : s) {
            if (isdigit(c)) num = num * 10 + (c - '0');
            else if (c == '[') { strs.push(cur); nums.push(num); cur = ""; num = 0; }
            else if (c == ']') {
                int k = nums.top(); nums.pop();
                string prev = strs.top(); strs.pop();
                string rep = "";
                for (int i = 0; i < k; i++) rep += cur;
                cur = prev + rep;
            } else cur += c;
        }
        return cur;
    }
};`,
  },

  // singleNumber(nums: List[int]) -> int  — XOR.
  'single-number': {
    python: `class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        res = 0
        for x in nums:
            res ^= x
        return res`,
    javascript: `var singleNumber = function(nums) {
    let res = 0;
    for (const x of nums) res ^= x;
    return res;
};`,
    java: `class Solution {
    public int singleNumber(int[] nums) {
        int res = 0;
        for (int x : nums) res ^= x;
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int res = 0;
        for (int x : nums) res ^= x;
        return res;
    }
};`,
  },
};

// ── Judge0 client ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function judgeRun(languageId, sourceCode, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language_id: languageId,
          source_code: sourceCode,
          stdin,
          cpu_time_limit: 6,
          wall_time_limit: 12,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
      }
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      if (status && status !== 'accepted') {
        const detail = (data.stderr || data.compile_output || data.message || status).toString().slice(0, 220);
        return { ok: false, stdout: '', error: `${data?.status?.description}: ${detail}` };
      }
      return { ok: true, stdout: (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''), error: null };
    } catch (e) {
      lastErr = e;
      await sleep(600 * attempt * attempt);
    }
  }
  return { ok: false, stdout: '', error: `judge0 unreachable: ${lastErr?.message || 'unknown'}` };
}

// ── stub detection (same heuristic as audit) ─────────────────────────────────
function codeOf(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && typeof entry.code === 'string') return entry.code;
  return '';
}
function isStub(code) {
  if (!code) return true;
  const body = code.trim();
  if (body.length < 12) return true;
  const stripped = body
    .replace(/(^|\n)\s*(#|\/\/).*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  if (stripped.length < 12) return true;
  if (/^\s*(pass|\.\.\.|return\s*(None|null|0|;)?\s*)$/i.test(stripped)) return true;
  return false;
}

// ── grade one language against every test case ───────────────────────────────
async function gradeLanguage(problem, language, code) {
  const { method_name, params, return_type, test_cases } = problem;
  let wrapped;
  try {
    wrapped = wrapWithDriver(code, language, method_name, params, return_type);
  } catch (e) {
    return { lang: language, pass: false, passed: 0, total: (test_cases || []).length, reason: `wrap error: ${e.message.slice(0, 80)}` };
  }
  const cases = Array.isArray(test_cases) ? test_cases : [];
  let passed = 0;
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const stdin = buildStdin(tc.inputs) + '\n';
    const r = await judgeRun(LANG_ID[language], wrapped, stdin);
    if (!r.ok) {
      return { lang: language, pass: false, passed, total: cases.length, reason: `case ${i}: ${r.error?.slice(0, 100)}`, failInputs: tc.inputs };
    }
    if (!compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: ORDER_INSENSITIVE.has(problem.id) })) {
      return {
        lang: language, pass: false, passed, total: cases.length,
        reason: `case ${i} WA: got ${JSON.stringify(r.stdout).slice(0, 60)} want ${JSON.stringify(tc.expected).slice(0, 60)}`,
        failInputs: tc.inputs,
      };
    }
    passed++;
    await sleep(PAUSE_MS);
  }
  return { lang: language, pass: true, passed, total: cases.length, reason: null };
}

// ── per-problem driver ───────────────────────────────────────────────────────
async function processProblem(id) {
  const { data: problem, error } = await sb.from('PGcode_problems')
    .select('id, name, method_name, params, return_type, test_cases, solutions')
    .eq('id', id)
    .maybeSingle();
  if (error || !problem) {
    return { id, status: 'error', note: error?.message || 'not found', rows: [] };
  }
  const cases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  if (cases.length === 0) {
    return { id, status: 'no-tests', note: 'test_cases empty — cannot grade; needs test cases first', rows: [] };
  }
  const canon = CANONICALS[id];
  if (!canon) {
    return { id, status: 'no-canonical', note: 'no hand-authored canonical for this id', rows: [] };
  }

  const existing = problem.solutions && typeof problem.solutions === 'object' ? problem.solutions : {};
  const rows = [];
  const verifiedToWrite = {};

  for (const lang of LANGS) {
    const present = codeOf(existing[lang]) && !isStub(codeOf(existing[lang]));
    if (present && !FORCE) {
      rows.push({ lang, action: 'skip-present', pass: true, passed: cases.length, total: cases.length, reason: 'already present (non-stub)' });
      continue;
    }
    if (!canon[lang]) {
      rows.push({ lang, action: 'no-code', pass: false, passed: 0, total: cases.length, reason: 'canonical missing this lang' });
      continue;
    }
    const g = await gradeLanguage(problem, lang, canon[lang]);
    if (g.pass) {
      verifiedToWrite[lang] = { code: canon[lang] };
      rows.push({ lang, action: 'graded-pass', ...g });
    } else {
      rows.push({ lang, action: 'graded-fail', ...g });
    }
  }

  const wroteLangs = Object.keys(verifiedToWrite);
  if (wroteLangs.length > 0 && !DRY) {
    const mergedSolutions = { ...existing };
    for (const [lang, payload] of Object.entries(verifiedToWrite)) {
      mergedSolutions[lang] = payload;
    }
    const { error: upErr } = await sb.from('PGcode_problems')
      .update({ solutions: mergedSolutions })
      .eq('id', id);
    if (upErr) {
      return { id, status: 'db-error', note: upErr.message, rows };
    }
  }

  return {
    id, name: problem.name, status: DRY ? 'graded-dry' : 'written',
    wrote: wroteLangs, rows,
  };
}

// Auto-merge every authored batch file under sol-batches/ (batch-*.mjs) into the
// canonical map (keyed by problem id == slug, same shape). Adding a new batch file
// needs ZERO wiring — it's picked up here. Later files override on key collision.
{
  const batchDir = path.join(__dirname, 'sol-batches');
  const batchFiles = fs.readdirSync(batchDir)
    .filter((f) => /^batch-.*\.mjs$/.test(f))
    .sort();
  for (const f of batchFiles) {
    const mod = await import(path.join(batchDir, f));
    if (mod.default && typeof mod.default === 'object') {
      Object.assign(CANONICALS, mod.default);
    }
  }
  console.log(`merged ${batchFiles.length} batch file(s): ${batchFiles.join(', ')}`);
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const ids = ONLY || Object.keys(CANONICALS);
  console.log(`backfill-solutions ${DRY ? '(DRY — no writes)' : '(LIVE — will UPDATE solutions)'}`);
  console.log(`Judge0: ${JUDGE0_URL} | targets: ${ids.length}\n`);

  const results = [];
  for (const id of ids) {
    process.stdout.write(`▶ ${id} ... `);
    const r = await processProblem(id);
    results.push(r);
    console.log(r.status + (r.note ? ` (${r.note})` : ''));
    for (const row of r.rows || []) {
      const tag = row.pass ? 'PASS' : 'FAIL';
      console.log(`    ${row.lang.padEnd(11)} ${row.action.padEnd(14)} ${tag} ${row.passed}/${row.total}${row.reason ? `  ${row.reason}` : ''}`);
    }
    if (r.wrote && r.wrote.length) console.log(`    → wrote: ${r.wrote.join(', ')}`);
    console.log('');
  }

  // Summary table
  console.log('================ SUMMARY ================');
  for (const r of results) {
    const langStates = LANGS.map(L => {
      const row = (r.rows || []).find(x => x.lang === L);
      if (!row) return `${L}:-`;
      if (row.pass) return `${L}:ok`;
      return `${L}:FAIL`;
    }).join('  ');
    console.log(`${(r.id || '').padEnd(34)} ${r.status.padEnd(11)} ${langStates}`);
  }
  console.log('========================================');
}

main().catch(e => { console.error(e); process.exit(1); });
