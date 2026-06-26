// batch-z1.mjs — from-scratch 4-language canonicals for zero-solution famous
// problems, slice [0,14) of scripts/zerosol-authorable.json.
//
// Signatures match generateTemplate(language, method_name, params, return_type)
// in src/lib/driverCode.js exactly. The backfill runner auto-loads this file,
// grades each language via Judge0 against the stored test_cases, and writes only
// the languages that pass every case.
//
// Notes on `Any`-return problems (buildTree x2, bulb-switcher, champagne-tower):
// the Java/C++ template return type for `Any` is the literal `Any`, which does
// not compile — so only python + javascript are authored for those. The two
// tree-construction problems return a level-order array (LeetCode tree format,
// internal nulls kept, trailing nulls trimmed) directly, because `Any` does not
// trigger the harness's TreeNode serializer.

export default {
  // checkArithmeticSubarrays(nums, l, r) -> List[bool]
  // For each query [l[i]..r[i]] slice nums, sort, check constant difference.
  'arithmetic-subarrays': {
    python: `class Solution:
    def checkArithmeticSubarrays(self, nums: List[int], l: List[int], r: List[int]) -> List[bool]:
        def ok(sub):
            if len(sub) <= 2:
                return True
            sub = sorted(sub)
            d = sub[1] - sub[0]
            return all(sub[i + 1] - sub[i] == d for i in range(len(sub) - 1))
        return [ok(nums[l[i]:r[i] + 1]) for i in range(len(l))]`,
    javascript: `var checkArithmeticSubarrays = function(nums, l, r) {
    const ok = (sub) => {
        if (sub.length <= 2) return true;
        sub = sub.slice().sort((a, b) => a - b);
        const d = sub[1] - sub[0];
        for (let i = 0; i + 1 < sub.length; i++) if (sub[i + 1] - sub[i] !== d) return false;
        return true;
    };
    const res = [];
    for (let i = 0; i < l.length; i++) res.push(ok(nums.slice(l[i], r[i] + 1)));
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public boolean[] checkArithmeticSubarrays(int[] nums, int[] l, int[] r) {
        boolean[] res = new boolean[l.length];
        for (int q = 0; q < l.length; q++) {
            int n = r[q] - l[q] + 1;
            int[] sub = new int[n];
            for (int i = 0; i < n; i++) sub[i] = nums[l[q] + i];
            Arrays.sort(sub);
            boolean good = true;
            if (n > 2) {
                int d = sub[1] - sub[0];
                for (int i = 1; i + 1 < n; i++) if (sub[i + 1] - sub[i] != d) { good = false; break; }
            }
            res[q] = good;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<bool> checkArithmeticSubarrays(vector<int>& nums, vector<int>& l, vector<int>& r) {
        vector<bool> res;
        for (size_t q = 0; q < l.size(); q++) {
            vector<int> sub(nums.begin() + l[q], nums.begin() + r[q] + 1);
            sort(sub.begin(), sub.end());
            bool good = true;
            if (sub.size() > 2) {
                int d = sub[1] - sub[0];
                for (size_t i = 1; i + 1 < sub.size(); i++)
                    if (sub[i + 1] - sub[i] != d) { good = false; break; }
            }
            res.push_back(good);
        }
        return res;
    }
};`,
  },

  // numSubarraysWithSum(nums, goal) -> int
  // atMost(goal) - atMost(goal-1) on a 0/1 array via sliding window.
  'binary-subarrays-with-sum': {
    python: `class Solution:
    def numSubarraysWithSum(self, nums: List[int], goal: int) -> int:
        def at_most(k):
            if k < 0:
                return 0
            left = 0
            s = 0
            res = 0
            for right in range(len(nums)):
                s += nums[right]
                while s > k:
                    s -= nums[left]
                    left += 1
                res += right - left + 1
            return res
        return at_most(goal) - at_most(goal - 1)`,
    javascript: `var numSubarraysWithSum = function(nums, goal) {
    const atMost = (k) => {
        if (k < 0) return 0;
        let left = 0, s = 0, res = 0;
        for (let right = 0; right < nums.length; right++) {
            s += nums[right];
            while (s > k) { s -= nums[left]; left++; }
            res += right - left + 1;
        }
        return res;
    };
    return atMost(goal) - atMost(goal - 1);
};`,
    java: `class Solution {
    public int numSubarraysWithSum(int[] nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }
    private int atMost(int[] nums, int k) {
        if (k < 0) return 0;
        int left = 0, s = 0, res = 0;
        for (int right = 0; right < nums.length; right++) {
            s += nums[right];
            while (s > k) { s -= nums[left]; left++; }
            res += right - left + 1;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numSubarraysWithSum(vector<int>& nums, int goal) {
        return atMost(nums, goal) - atMost(nums, goal - 1);
    }
private:
    int atMost(vector<int>& nums, int k) {
        if (k < 0) return 0;
        int left = 0, s = 0, res = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            s += nums[right];
            while (s > k) { s -= nums[left]; left++; }
            res += right - left + 1;
        }
        return res;
    }
};`,
  },

  // numRescueBoats(people, limit) -> int  — greedy two-pointer after sort.
  'boats-to-save-people': {
    python: `class Solution:
    def numRescueBoats(self, people: List[int], limit: int) -> int:
        people.sort()
        i, j = 0, len(people) - 1
        boats = 0
        while i <= j:
            if people[i] + people[j] <= limit:
                i += 1
            j -= 1
            boats += 1
        return boats`,
    javascript: `var numRescueBoats = function(people, limit) {
    people.sort((a, b) => a - b);
    let i = 0, j = people.length - 1, boats = 0;
    while (i <= j) {
        if (people[i] + people[j] <= limit) i++;
        j--;
        boats++;
    }
    return boats;
};`,
    java: `import java.util.*;
class Solution {
    public int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int i = 0, j = people.length - 1, boats = 0;
        while (i <= j) {
            if (people[i] + people[j] <= limit) i++;
            j--;
            boats++;
        }
        return boats;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        sort(people.begin(), people.end());
        int i = 0, j = people.size() - 1, boats = 0;
        while (i <= j) {
            if (people[i] + people[j] <= limit) i++;
            j--;
            boats++;
        }
        return boats;
    }
};`,
  },

  // bulbSwitch(n) -> Any (int)  — count of perfect squares <= n = floor(sqrt(n)).
  // Java/C++ skipped: `Any` return type does not compile in those templates.
  'bulb-switcher': {
    python: `class Solution:
    def bulbSwitch(self, input: int) -> Any:
        return int(input ** 0.5)`,
    javascript: `var bulbSwitch = function(input) {
    return Math.floor(Math.sqrt(input));
};`,
  },

  // cellsInRange(s) -> List[str]  — "K1:L2" -> all cells in column/row range.
  'cells-in-a-range-on-an-excel-sheet': {
    python: `class Solution:
    def cellsInRange(self, s: str) -> List[str]:
        c1, r1, c2, r2 = s[0], int(s[1]), s[3], int(s[4])
        res = []
        for c in range(ord(c1), ord(c2) + 1):
            for r in range(r1, r2 + 1):
                res.append(chr(c) + str(r))
        return res`,
    javascript: `var cellsInRange = function(s) {
    const c1 = s.charCodeAt(0), r1 = Number(s[1]);
    const c2 = s.charCodeAt(3), r2 = Number(s[4]);
    const res = [];
    for (let c = c1; c <= c2; c++)
        for (let r = r1; r <= r2; r++)
            res.push(String.fromCharCode(c) + r);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public String[] cellsInRange(String s) {
        char c1 = s.charAt(0), c2 = s.charAt(3);
        int r1 = s.charAt(1) - '0', r2 = s.charAt(4) - '0';
        List<String> res = new ArrayList<>();
        for (char c = c1; c <= c2; c++)
            for (int r = r1; r <= r2; r++)
                res.add("" + c + r);
        return res.toArray(new String[0]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> cellsInRange(string s) {
        char c1 = s[0], c2 = s[3];
        int r1 = s[1] - '0', r2 = s[4] - '0';
        vector<string> res;
        for (char c = c1; c <= c2; c++)
            for (int r = r1; r <= r2; r++)
                res.push_back(string(1, c) + to_string(r));
        return res;
    }
};`,
  },

  // champagneTower(poured, query_row, query_glass) -> Any (float)
  // Params are named nums/target/k in the DB. Simulate overflow row by row.
  // Java/C++ skipped: `Any` return type does not compile in those templates.
  'champagne-tower': {
    python: `class Solution:
    def champagneTower(self, nums: int, target: int, k: int) -> Any:
        row = [float(nums)]
        for r in range(target):
            nxt = [0.0] * (r + 2)
            for i in range(len(row)):
                overflow = (row[i] - 1.0) / 2.0
                if overflow > 0:
                    nxt[i] += overflow
                    nxt[i + 1] += overflow
            row = nxt
        return min(1.0, row[k])`,
    javascript: `var champagneTower = function(nums, target, k) {
    let row = [nums];
    for (let r = 0; r < target; r++) {
        const nxt = new Array(r + 2).fill(0);
        for (let i = 0; i < row.length; i++) {
            const overflow = (row[i] - 1) / 2;
            if (overflow > 0) {
                nxt[i] += overflow;
                nxt[i + 1] += overflow;
            }
        }
        row = nxt;
    }
    return Math.min(1, row[k]);
};`,
  },

  // combinationSum(candidates, target) -> List[List[int]]  — reuse-allowed DFS.
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

  // combinationSum4(nums, target) -> int  — order-counting DP (permutations).
  'combination-sum-iv': {
    python: `class Solution:
    def combinationSum4(self, nums: List[int], target: int) -> int:
        dp = [0] * (target + 1)
        dp[0] = 1
        for t in range(1, target + 1):
            for x in nums:
                if x <= t:
                    dp[t] += dp[t - x]
        return dp[target]`,
    javascript: `var combinationSum4 = function(nums, target) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    for (let t = 1; t <= target; t++)
        for (const x of nums)
            if (x <= t) dp[t] += dp[t - x];
    return dp[target];
};`,
    java: `class Solution {
    public int combinationSum4(int[] nums, int target) {
        long[] dp = new long[target + 1];
        dp[0] = 1;
        for (int t = 1; t <= target; t++)
            for (int x : nums)
                if (x <= t) dp[t] += dp[t - x];
        return (int) dp[target];
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        vector<unsigned long long> dp(target + 1, 0);
        dp[0] = 1;
        for (int t = 1; t <= target; t++)
            for (int x : nums)
                if (x <= t) dp[t] += dp[t - x];
        return (int) dp[target];
    }
};`,
  },

  // combine(n, k) -> List[List[int]]  — choose k from 1..n ascending.
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

  // buildTree(inorder, postorder) -> Any  — returns level-order tree array.
  // DB param names are nums (=inorder), target (=postorder). `Any` return does
  // not trigger the TreeNode serializer, so we BFS-serialize the built tree to a
  // LeetCode-format array (internal nulls kept, trailing nulls trimmed) ourselves.
  // Java/C++ skipped: `Any` return type does not compile in those templates.
  'construct-binary-tree-from-inorder-and-postorder-traversal': {
    python: `class Solution:
    def buildTree(self, nums: List[int], target: List[int]) -> Any:
        inorder, postorder = nums, target
        idx = {v: i for i, v in enumerate(inorder)}
        self.post = len(postorder) - 1
        def build(lo, hi):
            if lo > hi:
                return None
            val = postorder[self.post]
            self.post -= 1
            node = [val, None, None]
            mid = idx[val]
            node[2] = build(mid + 1, hi)
            node[1] = build(lo, mid - 1)
            return node
        root = build(0, len(inorder) - 1)
        if root is None:
            return None
        out = []
        q = [root]
        while q:
            node = q.pop(0)
            if node is None:
                out.append(None)
            else:
                out.append(node[0])
                q.append(node[1])
                q.append(node[2])
        while out and out[-1] is None:
            out.pop()
        return out`,
    javascript: `var buildTree = function(nums, target) {
    const inorder = nums, postorder = target;
    const idx = new Map();
    inorder.forEach((v, i) => idx.set(v, i));
    let post = postorder.length - 1;
    const build = (lo, hi) => {
        if (lo > hi) return null;
        const val = postorder[post--];
        const node = [val, null, null];
        const mid = idx.get(val);
        node[2] = build(mid + 1, hi);
        node[1] = build(lo, mid - 1);
        return node;
    };
    const root = build(0, inorder.length - 1);
    if (root === null) return null;
    const out = [];
    const q = [root];
    while (q.length) {
        const node = q.shift();
        if (node === null) { out.push(null); continue; }
        out.push(node[0]);
        q.push(node[1]);
        q.push(node[2]);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
};`,
  },

  // buildTree(preorder, inorder) -> Any  — returns level-order tree array.
  // DB param names are nums (=preorder), target (=inorder).
  // Java/C++ skipped: `Any` return type does not compile in those templates.
  'construct-binary-tree-from-preorder-and-inorder-traversal': {
    python: `class Solution:
    def buildTree(self, nums: List[int], target: List[int]) -> Any:
        preorder, inorder = nums, target
        idx = {v: i for i, v in enumerate(inorder)}
        self.pre = 0
        def build(lo, hi):
            if lo > hi:
                return None
            val = preorder[self.pre]
            self.pre += 1
            node = [val, None, None]
            mid = idx[val]
            node[1] = build(lo, mid - 1)
            node[2] = build(mid + 1, hi)
            return node
        root = build(0, len(inorder) - 1)
        if root is None:
            return None
        out = []
        q = [root]
        while q:
            node = q.pop(0)
            if node is None:
                out.append(None)
            else:
                out.append(node[0])
                q.append(node[1])
                q.append(node[2])
        while out and out[-1] is None:
            out.pop()
        return out`,
    javascript: `var buildTree = function(nums, target) {
    const preorder = nums, inorder = target;
    const idx = new Map();
    inorder.forEach((v, i) => idx.set(v, i));
    let pre = 0;
    const build = (lo, hi) => {
        if (lo > hi) return null;
        const val = preorder[pre++];
        const node = [val, null, null];
        const mid = idx.get(val);
        node[1] = build(lo, mid - 1);
        node[2] = build(mid + 1, hi);
        return node;
    };
    const root = build(0, inorder.length - 1);
    if (root === null) return null;
    const out = [];
    const q = [root];
    while (q.length) {
        const node = q.shift();
        if (node === null) { out.push(null); continue; }
        out.push(node[0]);
        q.push(node[1]);
        q.push(node[2]);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
};`,
  },

  // checkSubarraySum(nums, k) -> bool  — prefix-mod first-seen index, len >= 2.
  'continuous-subarray-sum': {
    python: `class Solution:
    def checkSubarraySum(self, nums: List[int], k: int) -> bool:
        seen = {0: -1}
        s = 0
        for i, x in enumerate(nums):
            s += x
            r = s % k
            if r in seen:
                if i - seen[r] >= 2:
                    return True
            else:
                seen[r] = i
        return False`,
    javascript: `var checkSubarraySum = function(nums, k) {
    const seen = new Map([[0, -1]]);
    let s = 0;
    for (let i = 0; i < nums.length; i++) {
        s += nums[i];
        const r = ((s % k) + k) % k;
        if (seen.has(r)) {
            if (i - seen.get(r) >= 2) return true;
        } else {
            seen.set(r, i);
        }
    }
    return false;
};`,
    java: `import java.util.*;
class Solution {
    public boolean checkSubarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, -1);
        int s = 0;
        for (int i = 0; i < nums.length; i++) {
            s += nums[i];
            int r = ((s % k) + k) % k;
            if (seen.containsKey(r)) {
                if (i - seen.get(r) >= 2) return true;
            } else {
                seen.put(r, i);
            }
        }
        return false;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool checkSubarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> seen;
        seen[0] = -1;
        int s = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            s += nums[i];
            int r = ((s % k) + k) % k;
            if (seen.count(r)) {
                if (i - seen[r] >= 2) return true;
            } else {
                seen[r] = i;
            }
        }
        return false;
    }
};`,
  },

  // sortedArrayToBST(nums) -> Optional[TreeNode]  — upper-mid root to match the
  // stored LeetCode serialization (e.g. [1,3] -> [3,1]). Returns a real TreeNode;
  // the harness serializes it via _from_tree.
  'convert-sorted-array-to-binary-search-tree': {
    python: `class Solution:
    def sortedArrayToBST(self, nums: List[int]) -> Optional[TreeNode]:
        def build(lo, hi):
            if lo > hi:
                return None
            mid = (lo + hi + 1) // 2
            node = TreeNode(nums[mid])
            node.left = build(lo, mid - 1)
            node.right = build(mid + 1, hi)
            return node
        return build(0, len(nums) - 1)`,
    javascript: `var sortedArrayToBST = function(nums) {
    const build = (lo, hi) => {
        if (lo > hi) return null;
        const mid = Math.floor((lo + hi + 1) / 2);
        const node = new TreeNode(nums[mid]);
        node.left = build(lo, mid - 1);
        node.right = build(mid + 1, hi);
        return node;
    };
    return build(0, nums.length - 1);
};`,
    java: `class Solution {
    public TreeNode sortedArrayToBST(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }
    private TreeNode build(int[] nums, int lo, int hi) {
        if (lo > hi) return null;
        int mid = (lo + hi + 1) / 2;
        TreeNode node = new TreeNode(nums[mid]);
        node.left = build(nums, lo, mid - 1);
        node.right = build(nums, mid + 1, hi);
        return node;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        function<TreeNode*(int,int)> build = [&](int lo, int hi) -> TreeNode* {
            if (lo > hi) return nullptr;
            int mid = (lo + hi + 1) / 2;
            TreeNode* node = new TreeNode(nums[mid]);
            node->left = build(lo, mid - 1);
            node->right = build(mid + 1, hi);
            return node;
        };
        return build(0, (int)nums.size() - 1);
    }
};`,
  },

  // countAndSay(n) -> str  — run-length encode the previous term n-1 times.
  'count-and-say': {
    python: `class Solution:
    def countAndSay(self, n: int) -> str:
        s = "1"
        for _ in range(n - 1):
            res = []
            i = 0
            while i < len(s):
                j = i
                while j < len(s) and s[j] == s[i]:
                    j += 1
                res.append(str(j - i))
                res.append(s[i])
                i = j
            s = ''.join(res)
        return s`,
    javascript: `var countAndSay = function(n) {
    let s = "1";
    for (let t = 1; t < n; t++) {
        let res = "";
        let i = 0;
        while (i < s.length) {
            let j = i;
            while (j < s.length && s[j] === s[i]) j++;
            res += (j - i) + s[i];
            i = j;
        }
        s = res;
    }
    return s;
};`,
    java: `class Solution {
    public String countAndSay(int n) {
        String s = "1";
        for (int t = 1; t < n; t++) {
            StringBuilder sb = new StringBuilder();
            int i = 0;
            while (i < s.length()) {
                int j = i;
                while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
                sb.append(j - i).append(s.charAt(i));
                i = j;
            }
            s = sb.toString();
        }
        return s;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string countAndSay(int n) {
        string s = "1";
        for (int t = 1; t < n; t++) {
            string res;
            int i = 0;
            while (i < (int)s.size()) {
                int j = i;
                while (j < (int)s.size() && s[j] == s[i]) j++;
                res += to_string(j - i) + s[i];
                i = j;
            }
            s = res;
        }
        return s;
    }
};`,
  },
};
