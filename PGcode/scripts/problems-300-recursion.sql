-- Grow catalog 200 → 300: recursion topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'power-of-four','factorial-trailing-zeroes','range-sum-bst',
  'unique-binary-search-trees','different-ways-to-add-parens','predict-the-winner',
  'basic-calculator-ii','integer-to-english-words'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'power-of-four','factorial-trailing-zeroes','range-sum-bst',
  'unique-binary-search-trees','different-ways-to-add-parens','predict-the-winner',
  'basic-calculator-ii','integer-to-english-words'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'power-of-four','factorial-trailing-zeroes','range-sum-bst',
  'unique-binary-search-trees','different-ways-to-add-parens','predict-the-winner',
  'basic-calculator-ii','integer-to-english-words'
);

-- ============================================================
-- 1) power-of-four (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('power-of-four', 'recursion', 'Power of Four', 'Easy',
$$<p>Given an integer <code>n</code>, return <code>true</code> iff it is a power of four (i.e. there exists some integer <code>x</code> such that <code>n == 4^x</code>).</p>$$,
'', ARRAY[
  'Recursive definition: isPowerOfFour(n) is true iff n == 1, or n > 0 and n % 4 == 0 and isPowerOfFour(n / 4).',
  'Non-recursive bit trick: n > 0, n is a power of two ((n & (n - 1)) == 0), and the single set bit sits at an even index (n & 0x55555555).',
  'Negative and zero inputs must return false.'
], '300', 'https://leetcode.com/problems/power-of-four/',
'isPowerOfFour',
'[{"name":"n","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["16"],"expected":"true"},
  {"inputs":["5"],"expected":"false"},
  {"inputs":["1"],"expected":"true"},
  {"inputs":["0"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('power-of-four', 'python',
$PY$class Solution:
    def isPowerOfFour(self, n: int) -> bool:
        $PY$),
('power-of-four', 'javascript',
$JS$var isPowerOfFour = function(n) {

};$JS$),
('power-of-four', 'java',
$JAVA$class Solution {
    public boolean isPowerOfFour(int n) {

    }
}$JAVA$),
('power-of-four', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isPowerOfFour(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('power-of-four', 1, 'Recursive Divide by 4',
'A power of four is either 1 or 4 times a smaller power of four. Recursively divide by 4 while the number stays positive and evenly divisible; bottom out at 1.',
'["If n <= 0, return false.","If n == 1, return true.","If n % 4 != 0, return false.","Return isPowerOfFour(n / 4)."]'::jsonb,
$PY$class Solution:
    def isPowerOfFour(self, n: int) -> bool:
        if n <= 0:
            return False
        if n == 1:
            return True
        if n % 4 != 0:
            return False
        return self.isPowerOfFour(n // 4)
$PY$,
$JS$var isPowerOfFour = function(n) {
    if (n <= 0) return false;
    if (n === 1) return true;
    if (n % 4 !== 0) return false;
    return isPowerOfFour(n / 4);
};
$JS$,
$JAVA$class Solution {
    public boolean isPowerOfFour(int n) {
        if (n <= 0) return false;
        if (n == 1) return true;
        if (n % 4 != 0) return false;
        return isPowerOfFour(n / 4);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isPowerOfFour(int n) {
        if (n <= 0) return false;
        if (n == 1) return true;
        if (n % 4 != 0) return false;
        return isPowerOfFour(n / 4);
    }
};
$CPP$,
'O(log n)', 'O(log n)');

-- ============================================================
-- 2) factorial-trailing-zeroes (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('factorial-trailing-zeroes', 'recursion', 'Factorial Trailing Zeroes', 'Easy',
$$<p>Given an integer <code>n</code>, return the number of trailing zeros in <code>n!</code>.</p>$$,
'', ARRAY[
  'Trailing zeros come from factors of 10 = 2 * 5. In n! there are always more 2s than 5s, so the count of trailing zeros equals the count of 5s in the prime factorization of n!.',
  'Legendre''s formula: count = floor(n/5) + floor(n/25) + floor(n/125) + ...',
  'Compute recursively: trailingZeroes(n) = n/5 + trailingZeroes(n/5).'
], '300', 'https://leetcode.com/problems/factorial-trailing-zeroes/',
'trailingZeroes',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["3"],"expected":"0"},
  {"inputs":["5"],"expected":"1"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["25"],"expected":"6"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('factorial-trailing-zeroes', 'python',
$PY$class Solution:
    def trailingZeroes(self, n: int) -> int:
        $PY$),
('factorial-trailing-zeroes', 'javascript',
$JS$var trailingZeroes = function(n) {

};$JS$),
('factorial-trailing-zeroes', 'java',
$JAVA$class Solution {
    public int trailingZeroes(int n) {

    }
}$JAVA$),
('factorial-trailing-zeroes', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int trailingZeroes(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('factorial-trailing-zeroes', 1, 'Count Factors of Five Recursively',
'Trailing zeros come from paired factors of 2 and 5. In n! there are always more 2s than 5s, so the count equals the number of 5s. Each multiple of 5 contributes one, each multiple of 25 contributes another, and so on — captured elegantly by trailingZeroes(n) = n / 5 + trailingZeroes(n / 5).',
'["If n < 5, return 0.","Return n / 5 + trailingZeroes(n / 5)."]'::jsonb,
$PY$class Solution:
    def trailingZeroes(self, n: int) -> int:
        if n < 5:
            return 0
        return n // 5 + self.trailingZeroes(n // 5)
$PY$,
$JS$var trailingZeroes = function(n) {
    if (n < 5) return 0;
    return Math.floor(n / 5) + trailingZeroes(Math.floor(n / 5));
};
$JS$,
$JAVA$class Solution {
    public int trailingZeroes(int n) {
        if (n < 5) return 0;
        return n / 5 + trailingZeroes(n / 5);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int trailingZeroes(int n) {
        if (n < 5) return 0;
        return n / 5 + trailingZeroes(n / 5);
    }
};
$CPP$,
'O(log n)', 'O(log n)');

-- ============================================================
-- 3) range-sum-bst (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('range-sum-bst', 'recursion', 'Range Sum of BST', 'Easy',
$$<p>Given the root of a binary search tree and integers <code>low</code> and <code>high</code>, return the sum of values of all nodes <code>v</code> with <code>low &lt;= v &lt;= high</code>.</p>$$,
'', ARRAY[
  'BST ordering lets you prune: if node.val < low, only the right subtree can contain in-range values; if node.val > high, only the left subtree can.',
  'Otherwise the current node is in range — include its value and recurse both sides.',
  'Null nodes contribute 0.'
], '300', 'https://leetcode.com/problems/range-sum-of-bst/',
'rangeSumBST',
'[{"name":"root","type":"Optional[TreeNode]"},{"name":"low","type":"int"},{"name":"high","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["[10,5,15,3,7,null,18]","7","15"],"expected":"32"},
  {"inputs":["[10,5,15,3,7,13,18,1,null,6]","6","10"],"expected":"23"},
  {"inputs":["[1]","1","1"],"expected":"1"},
  {"inputs":["[]","1","10"],"expected":"0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('range-sum-bst', 'python',
$PY$class Solution:
    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:
        $PY$),
('range-sum-bst', 'javascript',
$JS$var rangeSumBST = function(root, low, high) {

};$JS$),
('range-sum-bst', 'java',
$JAVA$class Solution {
    public int rangeSumBST(TreeNode root, int low, int high) {

    }
}$JAVA$),
('range-sum-bst', 'cpp',
$CPP$class Solution {
public:
    int rangeSumBST(TreeNode* root, int low, int high) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('range-sum-bst', 1, 'BST-Aware DFS',
'The BST invariant lets you skip entire subtrees. When a node''s value is below the range you can ignore its left subtree entirely; above the range, ignore its right. Only nodes whose value falls in the window contribute their value and also recurse both ways.',
'["If root is null, return 0.","If root.val < low, recurse only right: return rangeSumBST(root.right, low, high).","If root.val > high, recurse only left: return rangeSumBST(root.left, low, high).","Otherwise return root.val + rangeSumBST(root.left) + rangeSumBST(root.right)."]'::jsonb,
$PY$class Solution:
    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:
        if not root:
            return 0
        if root.val < low:
            return self.rangeSumBST(root.right, low, high)
        if root.val > high:
            return self.rangeSumBST(root.left, low, high)
        return root.val + self.rangeSumBST(root.left, low, high) + self.rangeSumBST(root.right, low, high)
$PY$,
$JS$var rangeSumBST = function(root, low, high) {
    if (!root) return 0;
    if (root.val < low) return rangeSumBST(root.right, low, high);
    if (root.val > high) return rangeSumBST(root.left, low, high);
    return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
};
$JS$,
$JAVA$class Solution {
    public int rangeSumBST(TreeNode root, int low, int high) {
        if (root == null) return 0;
        if (root.val < low) return rangeSumBST(root.right, low, high);
        if (root.val > high) return rangeSumBST(root.left, low, high);
        return root.val + rangeSumBST(root.left, low, high) + rangeSumBST(root.right, low, high);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int rangeSumBST(TreeNode* root, int low, int high) {
        if (!root) return 0;
        if (root->val < low) return rangeSumBST(root->right, low, high);
        if (root->val > high) return rangeSumBST(root->left, low, high);
        return root->val + rangeSumBST(root->left, low, high) + rangeSumBST(root->right, low, high);
    }
};
$CPP$,
'O(n) worst case, O(log n + k) average', 'O(h)');

-- ============================================================
-- 4) unique-binary-search-trees (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('unique-binary-search-trees', 'recursion', 'Unique Binary Search Trees', 'Medium',
$$<p>Given an integer <code>n</code>, return the number of structurally unique BSTs that store exactly the values <code>1..n</code>.</p>$$,
'', ARRAY[
  'If value k is the root, values 1..k-1 occupy the left subtree and k+1..n the right — and each side has a count independent of the specific values (only the size matters).',
  'Let G(n) be the number of BSTs with n nodes. G(n) = sum over k in 1..n of G(k - 1) * G(n - k).',
  'G(n) is the n-th Catalan number; compute iteratively with memoization to avoid exponential recursion.'
], '300', 'https://leetcode.com/problems/unique-binary-search-trees/',
'numTrees',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["3"],"expected":"5"},
  {"inputs":["1"],"expected":"1"},
  {"inputs":["5"],"expected":"42"},
  {"inputs":["10"],"expected":"16796"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('unique-binary-search-trees', 'python',
$PY$class Solution:
    def numTrees(self, n: int) -> int:
        $PY$),
('unique-binary-search-trees', 'javascript',
$JS$var numTrees = function(n) {

};$JS$),
('unique-binary-search-trees', 'java',
$JAVA$class Solution {
    public int numTrees(int n) {

    }
}$JAVA$),
('unique-binary-search-trees', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int numTrees(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('unique-binary-search-trees', 1, 'Catalan via Tabulation',
'Picking k as root splits the remaining values into a size-(k - 1) left subtree and size-(n - k) right subtree. The number of BSTs of a given size depends only on the size, giving the recurrence G(n) = Σ G(k - 1) * G(n - k) — the Catalan numbers. Build G iteratively.',
'["Initialize G[0] = G[1] = 1.","For i from 2 to n: G[i] = sum over k in 1..i of G[k - 1] * G[i - k].","Return G[n]."]'::jsonb,
$PY$class Solution:
    def numTrees(self, n: int) -> int:
        G = [0] * (n + 1)
        G[0] = 1
        if n >= 1:
            G[1] = 1
        for i in range(2, n + 1):
            total = 0
            for k in range(1, i + 1):
                total += G[k - 1] * G[i - k]
            G[i] = total
        return G[n]
$PY$,
$JS$var numTrees = function(n) {
    const G = new Array(n + 1).fill(0);
    G[0] = 1;
    if (n >= 1) G[1] = 1;
    for (let i = 2; i <= n; i++) {
        let total = 0;
        for (let k = 1; k <= i; k++) total += G[k - 1] * G[i - k];
        G[i] = total;
    }
    return G[n];
};
$JS$,
$JAVA$class Solution {
    public int numTrees(int n) {
        int[] G = new int[n + 1];
        G[0] = 1;
        if (n >= 1) G[1] = 1;
        for (int i = 2; i <= n; i++) {
            int total = 0;
            for (int k = 1; k <= i; k++) total += G[k - 1] * G[i - k];
            G[i] = total;
        }
        return G[n];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int numTrees(int n) {
        vector<long long> G(n + 1, 0);
        G[0] = 1;
        if (n >= 1) G[1] = 1;
        for (int i = 2; i <= n; i++) {
            long long total = 0;
            for (int k = 1; k <= i; k++) total += G[k - 1] * G[i - k];
            G[i] = total;
        }
        return (int)G[n];
    }
};
$CPP$,
'O(n^2)', 'O(n)');

-- ============================================================
-- 5) different-ways-to-add-parens (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('different-ways-to-add-parens', 'recursion', 'Different Ways to Add Parentheses', 'Medium',
$$<p>Given an expression <code>s</code> made of digits and the operators <code>+</code>, <code>-</code>, <code>*</code>, return every possible result (in any order) obtained by adding parentheses in different ways. Operands fit in 32-bit integers and the expression is well-formed.</p>$$,
'', ARRAY[
  'At every operator position, split the expression into left and right. Recurse on each side to get all possible values, then combine with the current operator.',
  'If the expression has no operators, it is a pure number — return a list containing just that value.',
  'Memoize on the substring to avoid recomputing identical subexpressions.'
], '300', 'https://leetcode.com/problems/different-ways-to-add-parentheses/',
'diffWaysToCompute',
'[{"name":"expression","type":"str"}]'::jsonb,
'List[int]',
'[
  {"inputs":["\"2-1-1\""],"expected":"[0,2]"},
  {"inputs":["\"2*3-4*5\""],"expected":"[-34,-14,-10,-10,10]"},
  {"inputs":["\"1\""],"expected":"[1]"},
  {"inputs":["\"11\""],"expected":"[11]"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('different-ways-to-add-parens', 'python',
$PY$class Solution:
    def diffWaysToCompute(self, expression: str) -> List[int]:
        $PY$),
('different-ways-to-add-parens', 'javascript',
$JS$var diffWaysToCompute = function(expression) {

};$JS$),
('different-ways-to-add-parens', 'java',
$JAVA$class Solution {
    public List<Integer> diffWaysToCompute(String expression) {

    }
}$JAVA$),
('different-ways-to-add-parens', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> diffWaysToCompute(string& expression) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('different-ways-to-add-parens', 1, 'Divide at Each Operator',
'Every possible parenthesization corresponds to picking one operator as the "last" one applied. At each operator index the left and right substrings recurse independently; we combine all pairs with the operator to form the set of results for the full expression.',
$ALGO$["Define dfs(expr):","  If expr contains no operator, return [int(expr)].","  result = [].","  For each index i where expr[i] is +, -, or *: left = dfs(expr[:i]); right = dfs(expr[i+1:]).","    For each a in left, b in right: append apply(a, expr[i], b).","  Memoize on expr. Return result.","Call dfs(expression)."]$ALGO$::jsonb,
$PY$class Solution:
    def diffWaysToCompute(self, expression: str) -> List[int]:
        memo = {}
        def dfs(expr):
            if expr in memo:
                return memo[expr]
            if expr.isdigit():
                return [int(expr)]
            result = []
            for i, c in enumerate(expr):
                if c in "+-*":
                    left = dfs(expr[:i])
                    right = dfs(expr[i+1:])
                    for a in left:
                        for b in right:
                            if c == '+':
                                result.append(a + b)
                            elif c == '-':
                                result.append(a - b)
                            else:
                                result.append(a * b)
            memo[expr] = result
            return result
        return dfs(expression)
$PY$,
$JS$var diffWaysToCompute = function(expression) {
    const memo = new Map();
    const dfs = (expr) => {
        if (memo.has(expr)) return memo.get(expr);
        if (/^\d+$/.test(expr)) return [parseInt(expr)];
        const result = [];
        for (let i = 0; i < expr.length; i++) {
            const c = expr[i];
            if (c === '+' || c === '-' || c === '*') {
                const left = dfs(expr.slice(0, i));
                const right = dfs(expr.slice(i + 1));
                for (const a of left) for (const b of right) {
                    if (c === '+') result.push(a + b);
                    else if (c === '-') result.push(a - b);
                    else result.push(a * b);
                }
            }
        }
        memo.set(expr, result);
        return result;
    };
    return dfs(expression);
};
$JS$,
$JAVA$class Solution {
    private Map<String, List<Integer>> memo = new HashMap<>();
    public List<Integer> diffWaysToCompute(String expression) {
        if (memo.containsKey(expression)) return memo.get(expression);
        List<Integer> result = new ArrayList<>();
        boolean hasOp = false;
        for (int i = 0; i < expression.length(); i++) {
            char c = expression.charAt(i);
            if (c == '+' || c == '-' || c == '*') {
                hasOp = true;
                List<Integer> left = diffWaysToCompute(expression.substring(0, i));
                List<Integer> right = diffWaysToCompute(expression.substring(i + 1));
                for (int a : left) for (int b : right) {
                    if (c == '+') result.add(a + b);
                    else if (c == '-') result.add(a - b);
                    else result.add(a * b);
                }
            }
        }
        if (!hasOp) result.add(Integer.parseInt(expression));
        memo.put(expression, result);
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
    unordered_map<string, vector<int>> memo;
    vector<int>& dfs(const string& expr) {
        auto it = memo.find(expr);
        if (it != memo.end()) return it->second;
        vector<int>& result = memo[expr];
        bool hasOp = false;
        for (int i = 0; i < (int)expr.size(); i++) {
            char c = expr[i];
            if (c == '+' || c == '-' || c == '*') {
                hasOp = true;
                vector<int>& left = dfs(expr.substr(0, i));
                vector<int>& right = dfs(expr.substr(i + 1));
                for (int a : left) for (int b : right) {
                    if (c == '+') result.push_back(a + b);
                    else if (c == '-') result.push_back(a - b);
                    else result.push_back(a * b);
                }
            }
        }
        if (!hasOp) result.push_back(stoi(expr));
        return result;
    }
public:
    vector<int> diffWaysToCompute(string& expression) {
        memo.clear();
        return dfs(expression);
    }
};
$CPP$,
'O(Catalan(n)) worst case, memo reduces it', 'O(exponential memo entries)');

-- ============================================================
-- 6) predict-the-winner (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('predict-the-winner', 'recursion', 'Predict the Winner', 'Medium',
$$<p>Two players alternate picking scores from either end of an integer array <code>nums</code> (Player 1 first). Both play optimally, aiming to maximize their own score. Return <code>true</code> iff Player 1 finishes with a score ≥ Player 2.</p>$$,
'', ARRAY[
  'Track the score differential: Player 1 adds, Player 2 subtracts.',
  'Define dp(l, r) = best attainable differential for the player to move given nums[l..r]. dp(l, r) = max(nums[l] - dp(l+1, r), nums[r] - dp(l, r-1)).',
  'Player 1 wins iff dp(0, n - 1) >= 0.'
], '300', 'https://leetcode.com/problems/predict-the-winner/',
'predictTheWinner',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'bool',
'[
  {"inputs":["[1,5,2]"],"expected":"false"},
  {"inputs":["[1,5,233,7]"],"expected":"true"},
  {"inputs":["[1]"],"expected":"true"},
  {"inputs":["[2,4,55,6,8]"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('predict-the-winner', 'python',
$PY$class Solution:
    def predictTheWinner(self, nums: List[int]) -> bool:
        $PY$),
('predict-the-winner', 'javascript',
$JS$var predictTheWinner = function(nums) {

};$JS$),
('predict-the-winner', 'java',
$JAVA$class Solution {
    public boolean predictTheWinner(int[] nums) {

    }
}$JAVA$),
('predict-the-winner', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool predictTheWinner(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('predict-the-winner', 1, 'Minimax Differential DP',
'Instead of tracking two players'' scores, track the differential (current mover''s score − opponent''s score). The current mover picks whichever end leaves the minimum differential for the opponent, so dp(l, r) = max(nums[l] − dp(l+1, r), nums[r] − dp(l, r−1)). Player 1 wins iff dp(0, n−1) is non-negative.',
'["Memoize dp(l, r). Base case: l == r → return nums[l].","Recurse dp(l, r) = max(nums[l] - dp(l+1, r), nums[r] - dp(l, r-1)).","Return dp(0, n-1) >= 0."]'::jsonb,
$PY$class Solution:
    def predictTheWinner(self, nums: List[int]) -> bool:
        n = len(nums)
        memo = {}
        def dp(l, r):
            if l == r:
                return nums[l]
            if (l, r) in memo:
                return memo[(l, r)]
            result = max(nums[l] - dp(l + 1, r), nums[r] - dp(l, r - 1))
            memo[(l, r)] = result
            return result
        return dp(0, n - 1) >= 0
$PY$,
$JS$var predictTheWinner = function(nums) {
    const n = nums.length;
    const memo = new Map();
    const dp = (l, r) => {
        if (l === r) return nums[l];
        const key = l * 1000 + r;
        if (memo.has(key)) return memo.get(key);
        const result = Math.max(nums[l] - dp(l + 1, r), nums[r] - dp(l, r - 1));
        memo.set(key, result);
        return result;
    };
    return dp(0, n - 1) >= 0;
};
$JS$,
$JAVA$class Solution {
    private Integer[][] memo;
    private int[] arr;
    public boolean predictTheWinner(int[] nums) {
        arr = nums;
        int n = nums.length;
        memo = new Integer[n][n];
        return dp(0, n - 1) >= 0;
    }
    private int dp(int l, int r) {
        if (l == r) return arr[l];
        if (memo[l][r] != null) return memo[l][r];
        int result = Math.max(arr[l] - dp(l + 1, r), arr[r] - dp(l, r - 1));
        memo[l][r] = result;
        return result;
    }
}
$JAVA$,
$CPP$class Solution {
    vector<vector<int>> memo;
    vector<int>* arr;
    int dp(int l, int r) {
        if (l == r) return (*arr)[l];
        if (memo[l][r] != INT_MIN) return memo[l][r];
        int result = max((*arr)[l] - dp(l + 1, r), (*arr)[r] - dp(l, r - 1));
        memo[l][r] = result;
        return result;
    }
public:
    bool predictTheWinner(vector<int>& nums) {
        int n = nums.size();
        arr = &nums;
        memo.assign(n, vector<int>(n, INT_MIN));
        return dp(0, n - 1) >= 0;
    }
};
$CPP$,
'O(n^2)', 'O(n^2)');

-- ============================================================
-- 7) basic-calculator-ii (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('basic-calculator-ii', 'recursion', 'Basic Calculator II', 'Medium',
$$<p>Given a string <code>s</code> representing a simple arithmetic expression with non-negative integers and the operators <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code> (integer division truncating toward zero), return its integer value. The expression contains no parentheses. Whitespace may appear anywhere.</p>$$,
'', ARRAY[
  'Respect precedence by deferring multiplication/division through a running accumulator.',
  'Walk character by character; maintain the last seen operator (initialize to +) and the current number being parsed.',
  'When the next character is an operator or end of string, apply the pending operator: for + and -, push the number onto a stack (negated for -); for * and /, combine with the stack''s top.',
  'Final answer is the sum of the stack.'
], '300', 'https://leetcode.com/problems/basic-calculator-ii/',
'calculate',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"3+2*2\""],"expected":"7"},
  {"inputs":["\" 3/2 \""],"expected":"1"},
  {"inputs":["\" 3+5 / 2 \""],"expected":"5"},
  {"inputs":["\"14-3/2\""],"expected":"13"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('basic-calculator-ii', 'python',
$PY$class Solution:
    def calculate(self, s: str) -> int:
        $PY$),
('basic-calculator-ii', 'javascript',
$JS$var calculate = function(s) {

};$JS$),
('basic-calculator-ii', 'java',
$JAVA$class Solution {
    public int calculate(String s) {

    }
}$JAVA$),
('basic-calculator-ii', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calculate(string& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('basic-calculator-ii', 1, 'Deferred Operator with Stack',
'Apply the PREVIOUS operator once we know the number that follows it. Keep a stack so + and − just push the current number (positive or negative) and * / combine with the top of the stack. The final answer is the sum of the stack — naturally handling precedence without parsing into a tree.',
$ALGO$["Initialize stack = [], num = 0, op = + (plus).","For each char c in s (also trigger at end of string): if c is a digit, num = num * 10 + int(c).","When c is an operator or end of string: apply op with num: + -> push(num); - -> push(-num); * -> push(stack.pop() * num); / -> push(trunc(stack.pop() / num)). Then op = c, num = 0.","Return sum(stack)."]$ALGO$::jsonb,
$PY$class Solution:
    def calculate(self, s: str) -> int:
        stack = []
        num = 0
        op = '+'
        n = len(s)
        for i, c in enumerate(s):
            if c.isdigit():
                num = num * 10 + int(c)
            if i == n - 1 or (c in '+-*/'):
                if op == '+':
                    stack.append(num)
                elif op == '-':
                    stack.append(-num)
                elif op == '*':
                    stack.append(stack.pop() * num)
                else:
                    top = stack.pop()
                    stack.append(int(top / num))
                op = c
                num = 0
        return sum(stack)
$PY$,
$JS$var calculate = function(s) {
    const stack = [];
    let num = 0;
    let op = '+';
    const n = s.length;
    for (let i = 0; i < n; i++) {
        const c = s[i];
        if (c >= '0' && c <= '9') num = num * 10 + (c.charCodeAt(0) - 48);
        if (i === n - 1 || '+-*/'.includes(c)) {
            if (op === '+') stack.push(num);
            else if (op === '-') stack.push(-num);
            else if (op === '*') stack.push(stack.pop() * num);
            else stack.push(Math.trunc(stack.pop() / num));
            op = c;
            num = 0;
        }
    }
    return stack.reduce((a, b) => a + b, 0);
};
$JS$,
$JAVA$class Solution {
    public int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        int num = 0;
        char op = '+';
        int n = s.length();
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) num = num * 10 + (c - '0');
            if (i == n - 1 || "+-*/".indexOf(c) >= 0) {
                if (op == '+') stack.push(num);
                else if (op == '-') stack.push(-num);
                else if (op == '*') stack.push(stack.pop() * num);
                else stack.push(stack.pop() / num);
                op = c;
                num = 0;
            }
        }
        int total = 0;
        for (int v : stack) total += v;
        return total;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calculate(string& s) {
        vector<int> stack;
        int num = 0;
        char op = '+';
        int n = s.size();
        for (int i = 0; i < n; i++) {
            char c = s[i];
            if (isdigit((unsigned char)c)) num = num * 10 + (c - '0');
            if (i == n - 1 || string("+-*/").find(c) != string::npos) {
                if (op == '+') stack.push_back(num);
                else if (op == '-') stack.push_back(-num);
                else if (op == '*') { int t = stack.back(); stack.pop_back(); stack.push_back(t * num); }
                else { int t = stack.back(); stack.pop_back(); stack.push_back(t / num); }
                op = c;
                num = 0;
            }
        }
        int total = 0;
        for (int v : stack) total += v;
        return total;
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 8) integer-to-english-words (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('integer-to-english-words', 'recursion', 'Integer to English Words', 'Hard',
$$<p>Convert a non-negative integer <code>num</code> to its English words representation. <code>num</code> fits in a 32-bit signed integer.</p>$$,
'', ARRAY[
  'Group the number by thousands: billions, millions, thousands, ones. Recursively convert each group.',
  'A helper for numbers under 1000 handles hundreds ("X Hundred"), then tens or teens, then ones.',
  'Join the non-empty group words with the scale labels ("Billion", "Million", "Thousand") and trim trailing whitespace.'
], '300', 'https://leetcode.com/problems/integer-to-english-words/',
'numberToWords',
'[{"name":"num","type":"int"}]'::jsonb,
'str',
'[
  {"inputs":["123"],"expected":"\"One Hundred Twenty Three\""},
  {"inputs":["12345"],"expected":"\"Twelve Thousand Three Hundred Forty Five\""},
  {"inputs":["1234567"],"expected":"\"One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven\""},
  {"inputs":["0"],"expected":"\"Zero\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('integer-to-english-words', 'python',
$PY$class Solution:
    def numberToWords(self, num: int) -> str:
        $PY$),
('integer-to-english-words', 'javascript',
$JS$var numberToWords = function(num) {

};$JS$),
('integer-to-english-words', 'java',
$JAVA$class Solution {
    public String numberToWords(int num) {

    }
}$JAVA$),
('integer-to-english-words', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string numberToWords(int num) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('integer-to-english-words', 1, 'Chunk by Thousands + Sub-1000 Recursion',
'English number names naturally group every three digits with a scale label. A helper that spells any number 0-999 handles "hundreds" then "tens/teens then ones", and the outer routine stitches together the four groups with their scale words, skipping zero groups.',
'["Special case: 0 → \"Zero\".","Constants: LESS_TWENTY (20 words), TENS (Twenty..Ninety), SCALES = [\"\", \"Thousand\", \"Million\", \"Billion\"].","helper(n): if n == 0 return \"\"; if n < 20 return LESS_TWENTY[n]; if n < 100 return TENS[n/10] + (helper(n%10) prefixed with space if nonzero); else return LESS_TWENTY[n/100] + \" Hundred\" + (helper(n%100) prefixed with space if nonzero).","Peel off groups of 1000: for each scale i, words = helper(num % 1000). If non-empty, prepend words + SCALES[i] (with trailing space) to the result.","Return result.strip()."]'::jsonb,
$PY$class Solution:
    def numberToWords(self, num: int) -> str:
        if num == 0:
            return "Zero"
        LESS_TWENTY = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        ]
        TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        SCALES = ["", "Thousand", "Million", "Billion"]
        def helper(n):
            if n == 0:
                return ""
            if n < 20:
                return LESS_TWENTY[n]
            if n < 100:
                return TENS[n // 10] + ("" if n % 10 == 0 else " " + LESS_TWENTY[n % 10])
            return LESS_TWENTY[n // 100] + " Hundred" + ("" if n % 100 == 0 else " " + helper(n % 100))
        result = ""
        i = 0
        while num > 0:
            chunk = num % 1000
            if chunk:
                words = helper(chunk)
                suffix = " " + SCALES[i] if SCALES[i] else ""
                result = words + suffix + (" " + result if result else "")
            num //= 1000
            i += 1
        return result.strip()
$PY$,
$JS$var numberToWords = function(num) {
    if (num === 0) return "Zero";
    const LESS_TWENTY = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const SCALES = ["", "Thousand", "Million", "Billion"];
    const helper = (n) => {
        if (n === 0) return "";
        if (n < 20) return LESS_TWENTY[n];
        if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 === 0 ? "" : " " + LESS_TWENTY[n % 10]);
        return LESS_TWENTY[Math.floor(n / 100)] + " Hundred" + (n % 100 === 0 ? "" : " " + helper(n % 100));
    };
    let result = "";
    let i = 0;
    while (num > 0) {
        const chunk = num % 1000;
        if (chunk) {
            const words = helper(chunk);
            const suffix = SCALES[i] ? " " + SCALES[i] : "";
            result = words + suffix + (result ? " " + result : "");
        }
        num = Math.floor(num / 1000);
        i++;
    }
    return result.trim();
};
$JS$,
$JAVA$class Solution {
    private static final String[] LESS_TWENTY = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };
    private static final String[] TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    private static final String[] SCALES = {"", "Thousand", "Million", "Billion"};

    public String numberToWords(int num) {
        if (num == 0) return "Zero";
        StringBuilder result = new StringBuilder();
        int i = 0;
        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                String words = helper(chunk);
                String suffix = SCALES[i].isEmpty() ? "" : " " + SCALES[i];
                String current = words + suffix;
                if (result.length() > 0) current = current + " ";
                result.insert(0, current);
            }
            num /= 1000;
            i++;
        }
        return result.toString().trim();
    }

    private String helper(int n) {
        if (n == 0) return "";
        if (n < 20) return LESS_TWENTY[n];
        if (n < 100) return TENS[n / 10] + (n % 10 == 0 ? "" : " " + LESS_TWENTY[n % 10]);
        return LESS_TWENTY[n / 100] + " Hundred" + (n % 100 == 0 ? "" : " " + helper(n % 100));
    }
}
$JAVA$,
$CPP$class Solution {
    vector<string> LESS_TWENTY = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };
    vector<string> TENS = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };
    vector<string> SCALES = {"", "Thousand", "Million", "Billion"};

    string helper(int n) {
        if (n == 0) return "";
        if (n < 20) return LESS_TWENTY[n];
        if (n < 100) return TENS[n / 10] + (n % 10 == 0 ? "" : " " + LESS_TWENTY[n % 10]);
        return LESS_TWENTY[n / 100] + " Hundred" + (n % 100 == 0 ? "" : " " + helper(n % 100));
    }
public:
    string numberToWords(int num) {
        if (num == 0) return "Zero";
        string result;
        int i = 0;
        while (num > 0) {
            int chunk = num % 1000;
            if (chunk != 0) {
                string words = helper(chunk);
                string suffix = SCALES[i].empty() ? "" : " " + SCALES[i];
                string current = words + suffix;
                if (!result.empty()) current += " ";
                result = current + result;
            }
            num /= 1000;
            i++;
        }
        // trim trailing space
        while (!result.empty() && result.back() == ' ') result.pop_back();
        return result;
    }
};
$CPP$,
'O(1) (bounded by 10 digits)', 'O(1)');

COMMIT;
