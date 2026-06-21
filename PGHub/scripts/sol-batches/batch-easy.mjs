// Batch: 20 EASY problems with ZERO existing solutions.
// Keyed by problem slug → { python, javascript, java, cpp }.
// Signatures match generateTemplate(language, method_name, params, return_type)
// from src/lib/driverCode.js exactly. Method bodies are LeetCode-style classes
// (py/java/cpp call Solution().<method>(...); js uses bare `var <method> = ...`).
// Graded by scripts/backfill-solutions.mjs before any DB write.

export default {
  // luckyNumbers(matrix: List[List[int]]) -> List[int]
  // min of its row AND max of its column.
  'lucky-numbers-in-a-matrix': {
    python: `class Solution:
    def luckyNumbers(self, matrix: List[List[int]]) -> List[int]:
        row_min = {min(row) for row in matrix}
        col_max = {max(col) for col in zip(*matrix)}
        return list(row_min & col_max)`,
    javascript: `var luckyNumbers = function(matrix) {
    const m = matrix.length, n = matrix[0].length;
    const res = [];
    for (let i = 0; i < m; i++) {
        let minVal = matrix[i][0], minCol = 0;
        for (let j = 1; j < n; j++) if (matrix[i][j] < minVal) { minVal = matrix[i][j]; minCol = j; }
        let isMax = true;
        for (let r = 0; r < m; r++) if (matrix[r][minCol] > minVal) { isMax = false; break; }
        if (isMax) res.push(minVal);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public int[] luckyNumbers(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        List<Integer> res = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            int minVal = matrix[i][0], minCol = 0;
            for (int j = 1; j < n; j++) if (matrix[i][j] < minVal) { minVal = matrix[i][j]; minCol = j; }
            boolean isMax = true;
            for (int r = 0; r < m; r++) if (matrix[r][minCol] > minVal) { isMax = false; break; }
            if (isMax) res.add(minVal);
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
    vector<int> luckyNumbers(vector<vector<int>>& matrix) {
        int m = matrix.size(), n = matrix[0].size();
        vector<int> res;
        for (int i = 0; i < m; i++) {
            int minVal = matrix[i][0], minCol = 0;
            for (int j = 1; j < n; j++) if (matrix[i][j] < minVal) { minVal = matrix[i][j]; minCol = j; }
            bool isMax = true;
            for (int r = 0; r < m; r++) if (matrix[r][minCol] > minVal) { isMax = false; break; }
            if (isMax) res.push_back(minVal);
        }
        return res;
    }
};`,
  },

  // numberOfMatches(input: int) -> Any  — n teams ⇒ n-1 matches total.
  'count-of-matches-in-tournament': {
    python: `class Solution:
    def numberOfMatches(self, input: int) -> Any:
        return input - 1`,
    javascript: `var numberOfMatches = function(input) {
    return input - 1;
};`,
    java: `class Solution {
    public int numberOfMatches(int input) {
        return input - 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numberOfMatches(int input) {
        return input - 1;
    }
};`,
  },

  // maxPower(s: str) -> int  — longest run of one character.
  'consecutive-characters': {
    python: `class Solution:
    def maxPower(self, s: str) -> int:
        best = 1
        run = 1
        for i in range(1, len(s)):
            if s[i] == s[i - 1]:
                run += 1
                best = max(best, run)
            else:
                run = 1
        return best`,
    javascript: `var maxPower = function(s) {
    let best = 1, run = 1;
    for (let i = 1; i < s.length; i++) {
        if (s[i] === s[i - 1]) { run++; best = Math.max(best, run); }
        else run = 1;
    }
    return best;
};`,
    java: `class Solution {
    public int maxPower(String s) {
        int best = 1, run = 1;
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i - 1)) { run++; best = Math.max(best, run); }
            else run = 1;
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxPower(string s) {
        int best = 1, run = 1;
        for (int i = 1; i < (int)s.size(); i++) {
            if (s[i] == s[i - 1]) { run++; best = max(best, run); }
            else run = 1;
        }
        return best;
    }
};`,
  },

  // stoneGame(piles: List[int]) -> bool  — first player always wins.
  'stone-game': {
    python: `class Solution:
    def stoneGame(self, piles: List[int]) -> bool:
        return True`,
    javascript: `var stoneGame = function(piles) {
    return true;
};`,
    java: `class Solution {
    public boolean stoneGame(int[] piles) {
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool stoneGame(vector<int>& piles) {
        return true;
    }
};`,
  },

  // canBeEqual(target: List[int], arr: List[int]) -> bool  — same multiset.
  'make-two-arrays-equal-by-reversing-subarrays': {
    python: `class Solution:
    def canBeEqual(self, target: List[int], arr: List[int]) -> bool:
        return sorted(target) == sorted(arr)`,
    javascript: `var canBeEqual = function(target, arr) {
    const a = [...target].sort((x, y) => x - y);
    const b = [...arr].sort((x, y) => x - y);
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
};`,
    java: `import java.util.*;
class Solution {
    public boolean canBeEqual(int[] target, int[] arr) {
        int[] a = target.clone(), b = arr.clone();
        Arrays.sort(a); Arrays.sort(b);
        return Arrays.equals(a, b);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canBeEqual(vector<int>& target, vector<int>& arr) {
        sort(target.begin(), target.end());
        sort(arr.begin(), arr.end());
        return target == arr;
    }
};`,
  },

  // findWords(words: List[str]) -> List[str]  — words typeable on one keyboard row.
  'keyboard-row': {
    python: `class Solution:
    def findWords(self, words: List[str]) -> List[str]:
        rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
        belong = {}
        for i, r in enumerate(rows):
            for c in r:
                belong[c] = i
        res = []
        for w in words:
            rset = {belong[c] for c in w.lower()}
            if len(rset) == 1:
                res.append(w)
        return res`,
    javascript: `var findWords = function(words) {
    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    const belong = {};
    for (let i = 0; i < rows.length; i++) for (const c of rows[i]) belong[c] = i;
    const res = [];
    for (const w of words) {
        const lw = w.toLowerCase();
        const r0 = belong[lw[0]];
        let ok = true;
        for (const c of lw) if (belong[c] !== r0) { ok = false; break; }
        if (ok) res.push(w);
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public String[] findWords(String[] words) {
        String[] rows = {"qwertyuiop", "asdfghjkl", "zxcvbnm"};
        int[] belong = new int[26];
        for (int i = 0; i < rows.length; i++)
            for (char c : rows[i].toCharArray()) belong[c - 'a'] = i;
        List<String> res = new ArrayList<>();
        for (String w : words) {
            String lw = w.toLowerCase();
            int r0 = belong[lw.charAt(0) - 'a'];
            boolean ok = true;
            for (char c : lw.toCharArray()) if (belong[c - 'a'] != r0) { ok = false; break; }
            if (ok) res.add(w);
        }
        return res.toArray(new String[0]);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> findWords(vector<string>& words) {
        string rows[3] = {"qwertyuiop", "asdfghjkl", "zxcvbnm"};
        int belong[26];
        for (int i = 0; i < 3; i++) for (char c : rows[i]) belong[c - 'a'] = i;
        vector<string> res;
        for (auto& w : words) {
            string lw = w;
            for (char& c : lw) c = tolower(c);
            int r0 = belong[lw[0] - 'a'];
            bool ok = true;
            for (char c : lw) if (belong[c - 'a'] != r0) { ok = false; break; }
            if (ok) res.push_back(w);
        }
        return res;
    }
};`,
  },

  // trailingZeroes(n: int) -> int  — count factors of 5 in n!.
  'factorial-trailing-zeroes': {
    python: `class Solution:
    def trailingZeroes(self, n: int) -> int:
        count = 0
        while n > 0:
            n //= 5
            count += n
        return count`,
    javascript: `var trailingZeroes = function(n) {
    let count = 0;
    while (n > 0) {
        n = Math.floor(n / 5);
        count += n;
    }
    return count;
};`,
    java: `class Solution {
    public int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) {
            n /= 5;
            count += n;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trailingZeroes(int n) {
        int count = 0;
        while (n > 0) {
            n /= 5;
            count += n;
        }
        return count;
    }
};`,
  },

  // inorderTraversal(root: Optional[TreeNode]) -> List[int]
  'binary-tree-inorder-traversal': {
    python: `class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node:
                return
            dfs(node.left)
            res.append(node.val)
            dfs(node.right)
        dfs(root)
        return res`,
    javascript: `var inorderTraversal = function(root) {
    const res = [];
    const dfs = (node) => {
        if (!node) return;
        dfs(node.left);
        res.push(node.val);
        dfs(node.right);
    };
    dfs(root);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, res);
        return res;
    }
    private void dfs(TreeNode node, List<Integer> res) {
        if (node == null) return;
        dfs(node.left, res);
        res.add(node.val);
        dfs(node.right, res);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> res;
        function<void(TreeNode*)> dfs = [&](TreeNode* node) {
            if (!node) return;
            dfs(node->left);
            res.push_back(node->val);
            dfs(node->right);
        };
        dfs(root);
        return res;
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

  // countBinarySubstrings(s: str) -> Any  — group consecutive run lengths.
  'count-binary-substrings': {
    python: `class Solution:
    def countBinarySubstrings(self, s: str) -> Any:
        prev = 0
        cur = 1
        res = 0
        for i in range(1, len(s)):
            if s[i] == s[i - 1]:
                cur += 1
            else:
                res += min(prev, cur)
                prev = cur
                cur = 1
        res += min(prev, cur)
        return res`,
    javascript: `var countBinarySubstrings = function(s) {
    let prev = 0, cur = 1, res = 0;
    for (let i = 1; i < s.length; i++) {
        if (s[i] === s[i - 1]) cur++;
        else { res += Math.min(prev, cur); prev = cur; cur = 1; }
    }
    res += Math.min(prev, cur);
    return res;
};`,
    java: `class Solution {
    public int countBinarySubstrings(String s) {
        int prev = 0, cur = 1, res = 0;
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i - 1)) cur++;
            else { res += Math.min(prev, cur); prev = cur; cur = 1; }
        }
        res += Math.min(prev, cur);
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countBinarySubstrings(string s) {
        int prev = 0, cur = 1, res = 0;
        for (int i = 1; i < (int)s.size(); i++) {
            if (s[i] == s[i - 1]) cur++;
            else { res += min(prev, cur); prev = cur; cur = 1; }
        }
        res += min(prev, cur);
        return res;
    }
};`,
  },

  // mergeAlternately(word1: str, word2: str) -> str
  'merge-strings-alternately': {
    python: `class Solution:
    def mergeAlternately(self, word1: str, word2: str) -> str:
        res = []
        i = 0
        n = max(len(word1), len(word2))
        while i < n:
            if i < len(word1):
                res.append(word1[i])
            if i < len(word2):
                res.append(word2[i])
            i += 1
        return ''.join(res)`,
    javascript: `var mergeAlternately = function(word1, word2) {
    let res = '';
    const n = Math.max(word1.length, word2.length);
    for (let i = 0; i < n; i++) {
        if (i < word1.length) res += word1[i];
        if (i < word2.length) res += word2[i];
    }
    return res;
};`,
    java: `class Solution {
    public String mergeAlternately(String word1, String word2) {
        StringBuilder sb = new StringBuilder();
        int n = Math.max(word1.length(), word2.length());
        for (int i = 0; i < n; i++) {
            if (i < word1.length()) sb.append(word1.charAt(i));
            if (i < word2.length()) sb.append(word2.charAt(i));
        }
        return sb.toString();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string mergeAlternately(string word1, string word2) {
        string res;
        int n = max(word1.size(), word2.size());
        for (int i = 0; i < n; i++) {
            if (i < (int)word1.size()) res += word1[i];
            if (i < (int)word2.size()) res += word2[i];
        }
        return res;
    }
};`,
  },

  // hammingWeight(n: int) -> int  — popcount.
  'number-of-1-bits': {
    python: `class Solution:
    def hammingWeight(self, n: int) -> int:
        count = 0
        while n:
            n &= n - 1
            count += 1
        return count`,
    javascript: `var hammingWeight = function(n) {
    n = n >>> 0;
    let count = 0;
    while (n) {
        n &= n - 1;
        count++;
    }
    return count;
};`,
    java: `class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int hammingWeight(int n) {
        unsigned int u = (unsigned int)n;
        int count = 0;
        while (u) {
            u &= (u - 1);
            count++;
        }
        return count;
    }
};`,
  },

  // merge(nums1, m, nums2, n) -> List[int]  — merge nums2 into nums1, return nums1.
  'merge-sorted-array': {
    python: `class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> List[int]:
        i, j, k = m - 1, n - 1, m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[k] = nums1[i]
                i -= 1
            else:
                nums1[k] = nums2[j]
                j -= 1
            k -= 1
        return nums1`,
    javascript: `var merge = function(nums1, m, nums2, n) {
    let i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
        else nums1[k--] = nums2[j--];
    }
    return nums1;
};`,
    java: `class Solution {
    public int[] merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
            else nums1[k--] = nums2[j--];
        }
        return nums1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
            else nums1[k--] = nums2[j--];
        }
        return nums1;
    }
};`,
  },

  // wordPattern(pattern: str, s: str) -> bool  — bijection.
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

  // countMatches(nums: List[List[str]], target: str, key: str) -> Any
  // Each item is [type, color, name]; ruleKey "type"/"color"/"name" → index 0/1/2.
  'count-items-matching-a-rule': {
    python: `class Solution:
    def countMatches(self, nums: List[List[str]], target: str, k: str) -> Any:
        idx = {"type": 0, "color": 1, "name": 2}[target]
        return sum(1 for item in nums if item[idx] == k)`,
    javascript: `var countMatches = function(nums, target, k) {
    const idx = {type: 0, color: 1, name: 2}[target];
    let count = 0;
    for (const item of nums) if (item[idx] === k) count++;
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int countMatches(String[][] nums, String target, String k) {
        int idx = target.equals("type") ? 0 : target.equals("color") ? 1 : 2;
        int count = 0;
        for (String[] item : nums) if (item[idx].equals(k)) count++;
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countMatches(vector<vector<string>>& nums, string target, string k) {
        int idx = target == "type" ? 0 : target == "color" ? 1 : 2;
        int count = 0;
        for (auto& item : nums) if (item[idx] == k) count++;
        return count;
    }
};`,
  },

  // findTheDifference(s: str, t: str) -> str  — extra char in t.
  'find-the-difference': {
    python: `class Solution:
    def findTheDifference(self, s: str, t: str) -> str:
        x = 0
        for c in s:
            x ^= ord(c)
        for c in t:
            x ^= ord(c)
        return chr(x)`,
    javascript: `var findTheDifference = function(s, t) {
    let x = 0;
    for (const c of s) x ^= c.charCodeAt(0);
    for (const c of t) x ^= c.charCodeAt(0);
    return String.fromCharCode(x);
};`,
    java: `class Solution {
    public String findTheDifference(String s, String t) {
        int x = 0;
        for (char c : s.toCharArray()) x ^= c;
        for (char c : t.toCharArray()) x ^= c;
        return String.valueOf((char) x);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string findTheDifference(string s, string t) {
        int x = 0;
        for (char c : s) x ^= c;
        for (char c : t) x ^= c;
        return string(1, (char) x);
    }
};`,
  },

  // moveZeroes(nums: List[int]) -> List[int]  — in-place compaction, return array.
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

  // isSubtree(root, subRoot) -> bool  — DFS + identical-tree check.
  'subtree-of-another-tree': {
    python: `class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def same(a, b):
            if not a and not b:
                return True
            if not a or not b or a.val != b.val:
                return False
            return same(a.left, b.left) and same(a.right, b.right)
        def dfs(node):
            if not node:
                return False
            if same(node, subRoot):
                return True
            return dfs(node.left) or dfs(node.right)
        return dfs(root)`,
    javascript: `var isSubtree = function(root, subRoot) {
    const same = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b || a.val !== b.val) return false;
        return same(a.left, b.left) && same(a.right, b.right);
    };
    const dfs = (node) => {
        if (!node) return false;
        if (same(node, subRoot)) return true;
        return dfs(node.left) || dfs(node.right);
    };
    return dfs(root);
};`,
    java: `class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        if (same(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }
    private boolean same(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;
        return same(a.left, b.left) && same(a.right, b.right);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!root) return false;
        if (same(root, subRoot)) return true;
        return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }
private:
    bool same(TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b || a->val != b->val) return false;
        return same(a->left, b->left) && same(a->right, b->right);
    }
};`,
  },

  // preorderTraversal(root: Optional[TreeNode]) -> List[int]
  'binary-tree-preorder-traversal': {
    python: `class Solution:
    def preorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node:
                return
            res.append(node.val)
            dfs(node.left)
            dfs(node.right)
        dfs(root)
        return res`,
    javascript: `var preorderTraversal = function(root) {
    const res = [];
    const dfs = (node) => {
        if (!node) return;
        res.push(node.val);
        dfs(node.left);
        dfs(node.right);
    };
    dfs(root);
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, res);
        return res;
    }
    private void dfs(TreeNode node, List<Integer> res) {
        if (node == null) return;
        res.add(node.val);
        dfs(node.left, res);
        dfs(node.right, res);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> preorderTraversal(TreeNode* root) {
        vector<int> res;
        function<void(TreeNode*)> dfs = [&](TreeNode* node) {
            if (!node) return;
            res.push_back(node->val);
            dfs(node->left);
            dfs(node->right);
        };
        dfs(root);
        return res;
    }
};`,
  },

  // stringMatching(nums: List[str]) -> Any  — words that are substrings of another.
  'string-matching-in-an-array': {
    python: `class Solution:
    def stringMatching(self, nums: List[str]) -> Any:
        res = []
        for i, w in enumerate(nums):
            for j, other in enumerate(nums):
                if i != j and w in other:
                    res.append(w)
                    break
        return res`,
    javascript: `var stringMatching = function(nums) {
    const res = [];
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
            if (i !== j && nums[j].includes(nums[i])) { res.push(nums[i]); break; }
        }
    }
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<String> stringMatching(String[] nums) {
        List<String> res = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            for (int j = 0; j < nums.length; j++) {
                if (i != j && nums[j].contains(nums[i])) { res.add(nums[i]); break; }
            }
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> stringMatching(vector<string>& nums) {
        vector<string> res;
        for (size_t i = 0; i < nums.size(); i++) {
            for (size_t j = 0; j < nums.size(); j++) {
                if (i != j && nums[j].find(nums[i]) != string::npos) { res.push_back(nums[i]); break; }
            }
        }
        return res;
    }
};`,
  },
};
