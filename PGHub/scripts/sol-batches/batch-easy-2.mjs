// batch-easy-2.mjs — next slice of EASY zero-solution canonicals.
// Auto-loaded by backfill-solutions.mjs. Signatures match
// generateTemplate(language, method_name, params, return_type) exactly.
// Each language is Judge0-graded vs the problem's stored test_cases before write.
//
// SKIPPED from this slice:
//   average-of-levels-in-binary-tree — param typed List[Optional[int]] but the
//   stored inputs are level-order tree serializations containing `null` tokens.
//   The Java/C++ drivers have no parser for List[Optional[int]] (falls to a
//   `// TODO` and won't compile), so it is ungradeable in 4 langs. (Tree-typed
//   variants Optional[TreeNode] ARE gradeable and are included below.)

export default {
  // validPath(n: int, edges: List[List[int]], source: int, destination: int) -> bool
  // Union-Find connectivity check.
  'find-if-path-exists-in-graph': {
    python: `class Solution:
    def validPath(self, n: int, edges: List[List[int]], source: int, destination: int) -> bool:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in edges:
            parent[find(a)] = find(b)
        return find(source) == find(destination)`,
    javascript: `var validPath = function(n, edges, source, destination) {
    const parent = Array.from({length: n}, (_, i) => i);
    const find = (x) => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    };
    for (const [a, b] of edges) parent[find(a)] = find(b);
    return find(source) === find(destination);
};`,
    java: `class Solution {
    private int[] parent;
    public boolean validPath(int n, int[][] edges, int source, int destination) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) parent[find(e[0])] = find(e[1]);
        return find(source) == find(destination);
    }
    private int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> parent;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    bool validPath(int n, vector<vector<int>>& edges, int source, int destination) {
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
        for (auto& e : edges) parent[find(e[0])] = find(e[1]);
        return find(source) == find(destination);
    }
};`,
  },

  // validPalindrome(s: str) -> bool  — allow at most one deletion.
  'valid-palindrome-ii': {
    python: `class Solution:
    def validPalindrome(self, s: str) -> bool:
        def isPal(i, j):
            while i < j:
                if s[i] != s[j]:
                    return False
                i += 1
                j -= 1
            return True
        i, j = 0, len(s) - 1
        while i < j:
            if s[i] != s[j]:
                return isPal(i + 1, j) or isPal(i, j - 1)
            i += 1
            j -= 1
        return True`,
    javascript: `var validPalindrome = function(s) {
    const isPal = (i, j) => {
        while (i < j) {
            if (s[i] !== s[j]) return false;
            i++; j--;
        }
        return true;
    };
    let i = 0, j = s.length - 1;
    while (i < j) {
        if (s[i] !== s[j]) return isPal(i + 1, j) || isPal(i, j - 1);
        i++; j--;
    }
    return true;
};`,
    java: `class Solution {
    public boolean validPalindrome(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i) != s.charAt(j))
                return isPal(s, i + 1, j) || isPal(s, i, j - 1);
            i++; j--;
        }
        return true;
    }
    private boolean isPal(String s, int i, int j) {
        while (i < j) {
            if (s.charAt(i) != s.charAt(j)) return false;
            i++; j--;
        }
        return true;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPal(const string& s, int i, int j) {
        while (i < j) {
            if (s[i] != s[j]) return false;
            i++; j--;
        }
        return true;
    }
    bool validPalindrome(string s) {
        int i = 0, j = s.size() - 1;
        while (i < j) {
            if (s[i] != s[j]) return isPal(s, i + 1, j) || isPal(s, i, j - 1);
            i++; j--;
        }
        return true;
    }
};`,
  },

  // countConsistentStrings(nums: str, target: List[str]) -> Any  — allowed-char filter.
  // Note: the DB names the allowed-chars param `nums` and the word list `target`.
  'count-the-number-of-consistent-strings': {
    python: `class Solution:
    def countConsistentStrings(self, nums: str, target: List[str]) -> Any:
        allowed = set(nums)
        return sum(1 for w in target if all(c in allowed for c in w))`,
    javascript: `var countConsistentStrings = function(nums, target) {
    const allowed = new Set(nums);
    let count = 0;
    for (const w of target) {
        let ok = true;
        for (const c of w) if (!allowed.has(c)) { ok = false; break; }
        if (ok) count++;
    }
    return count;
};`,
    java: `class Solution {
    public int countConsistentStrings(String nums, String[] target) {
        boolean[] allowed = new boolean[26];
        for (char c : nums.toCharArray()) allowed[c - 'a'] = true;
        int count = 0;
        for (String w : target) {
            boolean ok = true;
            for (char c : w.toCharArray()) if (!allowed[c - 'a']) { ok = false; break; }
            if (ok) count++;
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countConsistentStrings(string nums, vector<string>& target) {
        vector<bool> allowed(26, false);
        for (char c : nums) allowed[c - 'a'] = true;
        int count = 0;
        for (auto& w : target) {
            bool ok = true;
            for (char c : w) if (!allowed[c - 'a']) { ok = false; break; }
            if (ok) count++;
        }
        return count;
    }
};`,
  },

  // isSymmetric(root: Optional[TreeNode]) -> bool  — mirror check.
  'symmetric-tree': {
    python: `class Solution:
    def isSymmetric(self, root: Optional[TreeNode]) -> bool:
        def mirror(a, b):
            if not a and not b:
                return True
            if not a or not b or a.val != b.val:
                return False
            return mirror(a.left, b.right) and mirror(a.right, b.left)
        return mirror(root, root) if root else True`,
    javascript: `var isSymmetric = function(root) {
    const mirror = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b || a.val !== b.val) return false;
        return mirror(a.left, b.right) && mirror(a.right, b.left);
    };
    return root ? mirror(root.left, root.right) : true;
};`,
    java: `class Solution {
    public boolean isSymmetric(TreeNode root) {
        if (root == null) return true;
        return mirror(root.left, root.right);
    }
    private boolean mirror(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null || a.val != b.val) return false;
        return mirror(a.left, b.right) && mirror(a.right, b.left);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool mirror(TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b || a->val != b->val) return false;
        return mirror(a->left, b->right) && mirror(a->right, b->left);
    }
    bool isSymmetric(TreeNode* root) {
        if (!root) return true;
        return mirror(root->left, root->right);
    }
};`,
  },

  // isUgly(n: int) -> bool  — only factors 2,3,5.
  'ugly-number': {
    python: `class Solution:
    def isUgly(self, n: int) -> bool:
        if n <= 0:
            return False
        for f in (2, 3, 5):
            while n % f == 0:
                n //= f
        return n == 1`,
    javascript: `var isUgly = function(n) {
    if (n <= 0) return false;
    for (const f of [2, 3, 5]) {
        while (n % f === 0) n = Math.floor(n / f);
    }
    return n === 1;
};`,
    java: `class Solution {
    public boolean isUgly(int n) {
        if (n <= 0) return false;
        for (int f : new int[]{2, 3, 5}) {
            while (n % f == 0) n /= f;
        }
        return n == 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isUgly(int n) {
        if (n <= 0) return false;
        for (int f : {2, 3, 5}) {
            while (n % f == 0) n /= f;
        }
        return n == 1;
    }
};`,
  },

  // numIdenticalPairs(nums: List[int]) -> int  — count equal pairs via frequency.
  'number-of-good-pairs': {
    python: `class Solution:
    def numIdenticalPairs(self, nums: List[int]) -> int:
        from collections import Counter
        return sum(c * (c - 1) // 2 for c in Counter(nums).values())`,
    javascript: `var numIdenticalPairs = function(nums) {
    const freq = new Map();
    let count = 0;
    for (const x of nums) {
        const c = freq.get(x) || 0;
        count += c;
        freq.set(x, c + 1);
    }
    return count;
};`,
    java: `import java.util.*;
class Solution {
    public int numIdenticalPairs(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        int count = 0;
        for (int x : nums) {
            int c = freq.getOrDefault(x, 0);
            count += c;
            freq.put(x, c + 1);
        }
        return count;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numIdenticalPairs(vector<int>& nums) {
        unordered_map<int,int> freq;
        int count = 0;
        for (int x : nums) {
            count += freq[x];
            freq[x]++;
        }
        return count;
    }
};`,
  },

  // binaryTreePaths(root: Optional[TreeNode]) -> List[str]  — root-to-leaf DFS.
  'binary-tree-paths': {
    python: `class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        res = []
        def dfs(node, path):
            if not node:
                return
            path = path + str(node.val)
            if not node.left and not node.right:
                res.append(path)
                return
            dfs(node.left, path + "->")
            dfs(node.right, path + "->")
        dfs(root, "")
        return res`,
    javascript: `var binaryTreePaths = function(root) {
    const res = [];
    const dfs = (node, path) => {
        if (!node) return;
        path = path + node.val;
        if (!node.left && !node.right) { res.push(path); return; }
        dfs(node.left, path + "->");
        dfs(node.right, path + "->");
    };
    dfs(root, "");
    return res;
};`,
    java: `import java.util.*;
class Solution {
    public List<String> binaryTreePaths(TreeNode root) {
        List<String> res = new ArrayList<>();
        dfs(root, "", res);
        return res;
    }
    private void dfs(TreeNode node, String path, List<String> res) {
        if (node == null) return;
        path = path + node.val;
        if (node.left == null && node.right == null) { res.add(path); return; }
        dfs(node.left, path + "->", res);
        dfs(node.right, path + "->", res);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void dfs(TreeNode* node, string path, vector<string>& res) {
        if (!node) return;
        path += to_string(node->val);
        if (!node->left && !node->right) { res.push_back(path); return; }
        dfs(node->left, path + "->", res);
        dfs(node->right, path + "->", res);
    }
    vector<string> binaryTreePaths(TreeNode* root) {
        vector<string> res;
        dfs(root, "", res);
        return res;
    }
};`,
  },

  // canThreePartsEqualSum(arr: List[int]) -> bool  — three equal-sum parts.
  'partition-array-into-three-parts-with-equal-sum': {
    python: `class Solution:
    def canThreePartsEqualSum(self, arr: List[int]) -> bool:
        total = sum(arr)
        if total % 3 != 0:
            return False
        part = total // 3
        count = 0
        running = 0
        for x in arr:
            running += x
            if running == part:
                count += 1
                running = 0
        return count >= 3`,
    javascript: `var canThreePartsEqualSum = function(arr) {
    const total = arr.reduce((a, b) => a + b, 0);
    if (total % 3 !== 0) return false;
    const part = total / 3;
    let count = 0, running = 0;
    for (const x of arr) {
        running += x;
        if (running === part) { count++; running = 0; }
    }
    return count >= 3;
};`,
    java: `class Solution {
    public boolean canThreePartsEqualSum(int[] arr) {
        int total = 0;
        for (int x : arr) total += x;
        if (total % 3 != 0) return false;
        int part = total / 3, count = 0, running = 0;
        for (int x : arr) {
            running += x;
            if (running == part) { count++; running = 0; }
        }
        return count >= 3;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canThreePartsEqualSum(vector<int>& arr) {
        int total = 0;
        for (int x : arr) total += x;
        if (total % 3 != 0) return false;
        int part = total / 3, count = 0, running = 0;
        for (int x : arr) {
            running += x;
            if (running == part) { count++; running = 0; }
        }
        return count >= 3;
    }
};`,
  },

  // mergeSimilarItems(items1: List[List[int]], items2: List[List[int]]) -> List[List[int]]
  // Sum weights by value, output sorted ascending by value.
  'merge-similar-items': {
    python: `class Solution:
    def mergeSimilarItems(self, items1: List[List[int]], items2: List[List[int]]) -> List[List[int]]:
        from collections import defaultdict
        total = defaultdict(int)
        for v, w in items1:
            total[v] += w
        for v, w in items2:
            total[v] += w
        return [[v, total[v]] for v in sorted(total)]`,
    javascript: `var mergeSimilarItems = function(items1, items2) {
    const total = new Map();
    for (const [v, w] of items1) total.set(v, (total.get(v) || 0) + w);
    for (const [v, w] of items2) total.set(v, (total.get(v) || 0) + w);
    return [...total.keys()].sort((a, b) => a - b).map(v => [v, total.get(v)]);
};`,
    java: `import java.util.*;
class Solution {
    public int[][] mergeSimilarItems(int[][] items1, int[][] items2) {
        TreeMap<Integer, Integer> total = new TreeMap<>();
        for (int[] it : items1) total.merge(it[0], it[1], Integer::sum);
        for (int[] it : items2) total.merge(it[0], it[1], Integer::sum);
        int[][] res = new int[total.size()][2];
        int i = 0;
        for (Map.Entry<Integer, Integer> e : total.entrySet()) {
            res[i][0] = e.getKey();
            res[i][1] = e.getValue();
            i++;
        }
        return res;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeSimilarItems(vector<vector<int>>& items1, vector<vector<int>>& items2) {
        map<int,int> total;
        for (auto& it : items1) total[it[0]] += it[1];
        for (auto& it : items2) total[it[0]] += it[1];
        vector<vector<int>> res;
        for (auto& [v, w] : total) res.push_back({v, w});
        return res;
    }
};`,
  },

  // sumOfUnique(input: List[int]) -> Any  — sum of values that appear exactly once.
  'sum-of-unique-elements': {
    python: `class Solution:
    def sumOfUnique(self, input: List[int]) -> Any:
        from collections import Counter
        c = Counter(input)
        return sum(v for v, cnt in c.items() if cnt == 1)`,
    javascript: `var sumOfUnique = function(input) {
    const freq = new Map();
    for (const x of input) freq.set(x, (freq.get(x) || 0) + 1);
    let sum = 0;
    for (const [v, cnt] of freq) if (cnt === 1) sum += v;
    return sum;
};`,
    java: `import java.util.*;
class Solution {
    public int sumOfUnique(int[] input) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : input) freq.merge(x, 1, Integer::sum);
        int sum = 0;
        for (Map.Entry<Integer, Integer> e : freq.entrySet())
            if (e.getValue() == 1) sum += e.getKey();
        return sum;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int sumOfUnique(vector<int>& input) {
        unordered_map<int,int> freq;
        for (int x : input) freq[x]++;
        int sum = 0;
        for (auto& [v, cnt] : freq) if (cnt == 1) sum += v;
        return sum;
    }
};`,
  },

  // replaceDigits(s: str) -> str  — shift each letter by following digit.
  'replace-all-digits-with-characters': {
    python: `class Solution:
    def replaceDigits(self, s: str) -> str:
        res = list(s)
        for i in range(1, len(s), 2):
            res[i] = chr(ord(s[i - 1]) + int(s[i]))
        return ''.join(res)`,
    javascript: `var replaceDigits = function(s) {
    const res = s.split('');
    for (let i = 1; i < s.length; i += 2) {
        res[i] = String.fromCharCode(s.charCodeAt(i - 1) + Number(s[i]));
    }
    return res.join('');
};`,
    java: `class Solution {
    public String replaceDigits(String s) {
        char[] res = s.toCharArray();
        for (int i = 1; i < res.length; i += 2) {
            res[i] = (char)(res[i - 1] + (res[i] - '0'));
        }
        return new String(res);
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string replaceDigits(string s) {
        for (size_t i = 1; i < s.size(); i += 2) {
            s[i] = s[i - 1] + (s[i] - '0');
        }
        return s;
    }
};`,
  },

  // lastStoneWeight(stones: List[int]) -> int  — max-heap smash simulation.
  'last-stone-weight': {
    python: `class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        import heapq
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)
            b = -heapq.heappop(heap)
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0`,
    javascript: `var lastStoneWeight = function(stones) {
    const heap = [...stones];
    while (heap.length > 1) {
        heap.sort((a, b) => a - b);
        const a = heap.pop();
        const b = heap.pop();
        if (a !== b) heap.push(a - b);
    }
    return heap.length ? heap[0] : 0;
};`,
    java: `import java.util.*;
class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int a = heap.poll();
            int b = heap.poll();
            if (a != b) heap.offer(a - b);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int a = heap.top(); heap.pop();
            int b = heap.top(); heap.pop();
            if (a != b) heap.push(a - b);
        }
        return heap.empty() ? 0 : heap.top();
    }
};`,
  },

  // numberOfSteps(num: int) -> int  — halve if even, else subtract 1.
  'number-of-steps-to-reduce-a-number-to-zero': {
    python: `class Solution:
    def numberOfSteps(self, num: int) -> int:
        steps = 0
        while num > 0:
            num = num // 2 if num % 2 == 0 else num - 1
            steps += 1
        return steps`,
    javascript: `var numberOfSteps = function(num) {
    let steps = 0;
    while (num > 0) {
        num = (num % 2 === 0) ? num / 2 : num - 1;
        steps++;
    }
    return steps;
};`,
    java: `class Solution {
    public int numberOfSteps(int num) {
        int steps = 0;
        while (num > 0) {
            num = (num % 2 == 0) ? num / 2 : num - 1;
            steps++;
        }
        return steps;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numberOfSteps(int num) {
        int steps = 0;
        while (num > 0) {
            num = (num % 2 == 0) ? num / 2 : num - 1;
            steps++;
        }
        return steps;
    }
};`,
  },

  // subtractProductAndSum(input: int) -> Any  — product of digits minus sum.
  'subtract-the-product-and-sum-of-digits-of-an-integer': {
    python: `class Solution:
    def subtractProductAndSum(self, input: int) -> Any:
        prod, total = 1, 0
        for ch in str(input):
            d = int(ch)
            prod *= d
            total += d
        return prod - total`,
    javascript: `var subtractProductAndSum = function(input) {
    let prod = 1, total = 0;
    for (const ch of String(input)) {
        const d = Number(ch);
        prod *= d;
        total += d;
    }
    return prod - total;
};`,
    java: `class Solution {
    public int subtractProductAndSum(int input) {
        int prod = 1, total = 0;
        while (input > 0) {
            int d = input % 10;
            prod *= d;
            total += d;
            input /= 10;
        }
        return prod - total;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int subtractProductAndSum(int input) {
        int prod = 1, total = 0;
        while (input > 0) {
            int d = input % 10;
            prod *= d;
            total += d;
            input /= 10;
        }
        return prod - total;
    }
};`,
  },

  // largestAltitude(gain: List[int]) -> int  — max prefix sum (starting at 0).
  'find-the-highest-altitude': {
    python: `class Solution:
    def largestAltitude(self, gain: List[int]) -> int:
        best = cur = 0
        for g in gain:
            cur += g
            best = max(best, cur)
        return best`,
    javascript: `var largestAltitude = function(gain) {
    let best = 0, cur = 0;
    for (const g of gain) {
        cur += g;
        best = Math.max(best, cur);
    }
    return best;
};`,
    java: `class Solution {
    public int largestAltitude(int[] gain) {
        int best = 0, cur = 0;
        for (int g : gain) {
            cur += g;
            best = Math.max(best, cur);
        }
        return best;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int largestAltitude(vector<int>& gain) {
        int best = 0, cur = 0;
        for (int g : gain) {
            cur += g;
            best = max(best, cur);
        }
        return best;
    }
};`,
  },

  // isPowerOfFour(n: int) -> bool
  'power-of-four': {
    python: `class Solution:
    def isPowerOfFour(self, n: int) -> bool:
        if n <= 0:
            return False
        while n % 4 == 0:
            n //= 4
        return n == 1`,
    javascript: `var isPowerOfFour = function(n) {
    if (n <= 0) return false;
    while (n % 4 === 0) n = Math.floor(n / 4);
    return n === 1;
};`,
    java: `class Solution {
    public boolean isPowerOfFour(int n) {
        if (n <= 0) return false;
        while (n % 4 == 0) n /= 4;
        return n == 1;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPowerOfFour(int n) {
        if (n <= 0) return false;
        while (n % 4 == 0) n /= 4;
        return n == 1;
    }
};`,
  },

  // getDecimalValue(nums: List[int]) -> Any  — binary digits to int.
  // Driver supplies the bit list directly under name `nums` (List[int]).
  'convert-binary-number-in-a-linked-list-to-integer': {
    python: `class Solution:
    def getDecimalValue(self, nums: List[int]) -> Any:
        result = 0
        for bit in nums:
            result = result * 2 + bit
        return result`,
    javascript: `var getDecimalValue = function(nums) {
    let result = 0;
    for (const bit of nums) result = result * 2 + bit;
    return result;
};`,
    java: `class Solution {
    public int getDecimalValue(int[] nums) {
        int result = 0;
        for (int bit : nums) result = result * 2 + bit;
        return result;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int getDecimalValue(vector<int>& nums) {
        int result = 0;
        for (int bit : nums) result = result * 2 + bit;
        return result;
    }
};`,
  },

  // peakIndexInMountainArray(arr: List[int]) -> int  — binary search for peak.
  'peak-index-in-a-mountain-array': {
    python: `class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        lo, hi = 0, len(arr) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1
            else:
                hi = mid
        return lo`,
    javascript: `var peakIndexInMountainArray = function(arr) {
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] < arr[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};`,
    java: `class Solution {
    public int peakIndexInMountainArray(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int peakIndexInMountainArray(vector<int>& arr) {
        int lo = 0, hi = arr.size() - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
};`,
  },

  // findTilt(root: Optional[TreeNode]) -> int  — sum of |left subtree - right subtree|.
  'binary-tree-tilt': {
    python: `class Solution:
    def findTilt(self, root: Optional[TreeNode]) -> int:
        self.total = 0
        def subSum(node):
            if not node:
                return 0
            left = subSum(node.left)
            right = subSum(node.right)
            self.total += abs(left - right)
            return left + right + node.val
        subSum(root)
        return self.total`,
    javascript: `var findTilt = function(root) {
    let total = 0;
    const subSum = (node) => {
        if (!node) return 0;
        const left = subSum(node.left);
        const right = subSum(node.right);
        total += Math.abs(left - right);
        return left + right + node.val;
    };
    subSum(root);
    return total;
};`,
    java: `class Solution {
    private int total = 0;
    public int findTilt(TreeNode root) {
        subSum(root);
        return total;
    }
    private int subSum(TreeNode node) {
        if (node == null) return 0;
        int left = subSum(node.left);
        int right = subSum(node.right);
        total += Math.abs(left - right);
        return left + right + node.val;
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int total = 0;
    int subSum(TreeNode* node) {
        if (!node) return 0;
        int left = subSum(node->left);
        int right = subSum(node->right);
        total += abs(left - right);
        return left + right + node->val;
    }
    int findTilt(TreeNode* root) {
        total = 0;
        subSum(root);
        return total;
    }
};`,
  },
};
