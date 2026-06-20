BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'fibonacci-number', 'pow-x-n', 'reverse-string',
  'merge-sort-array', 'generate-parentheses', 'flatten-nested-list-iterator'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'fibonacci-number', 'pow-x-n', 'reverse-string',
  'merge-sort-array', 'generate-parentheses', 'flatten-nested-list-iterator'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'fibonacci-number', 'pow-x-n', 'reverse-string',
  'merge-sort-array', 'generate-parentheses', 'flatten-nested-list-iterator'
);

-- ============================================================
-- 1. fibonacci-number (Easy, LeetCode 509)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'fibonacci-number', 'recursion', 'Fibonacci Number', 'Easy',
  $DESC$<p>The <strong>Fibonacci numbers</strong>, commonly denoted <code>F(n)</code>, form a sequence such that each number is the sum of the two preceding ones, starting from <code>0</code> and <code>1</code>.</p>
<p><code>F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)</code> for <code>n &gt; 1</code>.</p>
<p>Given <code>n</code>, calculate <code>F(n)</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 2
Output: 1
Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>0 &lt;= n &lt;= 30</code></li></ul>$DESC$,
  '', ARRAY['Think about the base cases: F(0) = 0 and F(1) = 1.', 'Can you store previously computed values to avoid redundant calculations?', 'Try building the answer bottom-up: F(0), F(1), F(2), ... up to F(n).'],
  '200', 'https://leetcode.com/problems/fibonacci-number/',
  'fib', '[{"name":"n","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["0"],"expected":"0"},{"inputs":["1"],"expected":"1"},{"inputs":["2"],"expected":"1"},{"inputs":["3"],"expected":"2"},{"inputs":["4"],"expected":"3"},{"inputs":["5"],"expected":"5"},{"inputs":["6"],"expected":"8"},{"inputs":["7"],"expected":"13"},{"inputs":["8"],"expected":"21"},{"inputs":["9"],"expected":"34"},{"inputs":["10"],"expected":"55"},{"inputs":["11"],"expected":"89"},{"inputs":["12"],"expected":"144"},{"inputs":["13"],"expected":"233"},{"inputs":["14"],"expected":"377"},{"inputs":["15"],"expected":"610"},{"inputs":["20"],"expected":"6765"},{"inputs":["30"],"expected":"832040"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'fibonacci-number', 1, 'Iterative Bottom-Up',
  'Instead of using pure recursion which recalculates the same subproblems many times, we build the answer iteratively from the base cases F(0) and F(1) up to F(n). We only need to keep track of the two most recent values.',
  '["Handle base case: if n <= 1, return n directly.","Initialize a = 0 and b = 1 representing F(0) and F(1).","Iterate from 2 to n, computing next = a + b, then shift: a = b, b = next.","Return b which holds F(n)."]'::jsonb,
  $PY$class Solution:
    def fib(self, n: int) -> int:
        if n <= 1:
            return n
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b$PY$,
  $JS$var fib = function(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
};$JS$,
  $JAVA$class Solution {
    public int fib(int n) {
        if (n <= 1) return n;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 2. pow-x-n (Medium, LeetCode 50)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'pow-x-n', 'recursion', 'Pow(x, n)', 'Medium',
  $DESC$<p>Implement <code>pow(x, n)</code>, which calculates <code>x</code> raised to the power <code>n</code> (i.e., x<sup>n</sup>).</p>
<p><strong>Example 1:</strong></p>
<pre>Input: x = 2.00000, n = 10
Output: 1024.00000</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: x = 2.00000, n = -2
Output: 0.25000</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-100.0 &lt; x &lt; 100.0</code></li>
<li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['Think about how you can halve the exponent at each step.', 'If n is even, x^n = (x^(n/2))^2. If n is odd, x^n = x * x^(n-1).', 'Handle negative exponents by computing pow(1/x, -n).'],
  '200', 'https://leetcode.com/problems/powx-n/',
  'myPow', '[{"name":"x","type":"float"},{"name":"n","type":"int"}]'::jsonb, 'float',
  '[{"inputs":["2.0","10"],"expected":"1024.0"},{"inputs":["2.1","3"],"expected":"9.261"},{"inputs":["2.0","-2"],"expected":"0.25"},{"inputs":["1.0","0"],"expected":"1.0"},{"inputs":["0.0","5"],"expected":"0.0"},{"inputs":["1.0","2147483647"],"expected":"1.0"},{"inputs":["3.0","2"],"expected":"9.0"},{"inputs":["5.0","3"],"expected":"125.0"},{"inputs":["2.0","-3"],"expected":"0.125"},{"inputs":["0.5","4"],"expected":"0.0625"},{"inputs":["0.5","-2"],"expected":"4.0"},{"inputs":["-2.0","3"],"expected":"-8.0"},{"inputs":["-2.0","4"],"expected":"16.0"},{"inputs":["2.0","1"],"expected":"2.0"},{"inputs":["2.0","0"],"expected":"1.0"},{"inputs":["1.5","2"],"expected":"2.25"},{"inputs":["0.1","3"],"expected":"0.001"},{"inputs":["10.0","-1"],"expected":"0.1"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'pow-x-n', 1, 'Fast Exponentiation',
  'We halve the exponent at each step: x^n = (x^(n/2))^2 when n is even, and x * (x^((n-1)/2))^2 when n is odd. For negative n, compute pow(1/x, -n). Round to 5 decimal places for consistent comparison.',
  '["If n is negative, convert to pow(1/x, -n).","Base case: if n == 0, return 1.0.","Recursively compute half = pow(x, n // 2).","If n is even, return half * half. If odd, return half * half * x.","Round to 5 decimal places."]'::jsonb,
  $PY$class Solution:
    def myPow(self, x: float, n: int) -> float:
        def helper(x, n):
            if n == 0:
                return 1.0
            half = helper(x, n // 2)
            if n % 2 == 0:
                return half * half
            else:
                return half * half * x
        if n < 0:
            x = 1 / x
            n = -n
        return round(helper(x, n), 5)$PY$,
  $JS$var myPow = function(x, n) {
    function helper(x, n) {
        if (n === 0) return 1.0;
        let half = helper(x, Math.floor(n / 2));
        if (n % 2 === 0) return half * half;
        else return half * half * x;
    }
    if (n < 0) { x = 1 / x; n = -n; }
    return Math.round(helper(x, n) * 100000) / 100000;
};$JS$,
  $JAVA$class Solution {
    public double myPow(double x, int n) {
        long N = n;
        if (N < 0) { x = 1 / x; N = -N; }
        double result = helper(x, N);
        return Math.round(result * 100000.0) / 100000.0;
    }
    private double helper(double x, long n) {
        if (n == 0) return 1.0;
        double half = helper(x, n / 2);
        if (n % 2 == 0) return half * half;
        else return half * half * x;
    }
}$JAVA$,
  'O(log n)', 'O(log n)'
);

-- ============================================================
-- 3. reverse-string (Easy, LeetCode 344)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'reverse-string', 'recursion', 'Reverse String', 'Easy',
  $DESC$<p>Write a function that reverses an array of characters <code>s</code> in-place and returns it.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>1 &lt;= s.length &lt;= 10<sup>5</sup></code></li></ul>$DESC$,
  '', ARRAY['Use two pointers — one at start and one at end.', 'Swap the characters at the two pointers and move inward.', 'Base case: when left pointer meets or passes right pointer.'],
  '200', 'https://leetcode.com/problems/reverse-string/',
  'reverseString', '[{"name":"s","type":"List[str]"}]'::jsonb, 'List[str]',
  '[{"inputs":["[\"h\",\"e\",\"l\",\"l\",\"o\"]"],"expected":"[\"o\",\"l\",\"l\",\"e\",\"h\"]"},{"inputs":["[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]"],"expected":"[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"},{"inputs":["[\"a\"]"],"expected":"[\"a\"]"},{"inputs":["[\"a\",\"b\"]"],"expected":"[\"b\",\"a\"]"},{"inputs":["[\"A\",\"B\",\"C\",\"D\"]"],"expected":"[\"D\",\"C\",\"B\",\"A\"]"},{"inputs":["[\"x\",\"y\",\"z\"]"],"expected":"[\"z\",\"y\",\"x\"]"},{"inputs":["[\"1\",\"2\",\"3\",\"4\",\"5\"]"],"expected":"[\"5\",\"4\",\"3\",\"2\",\"1\"]"},{"inputs":["[\"a\",\"a\",\"a\"]"],"expected":"[\"a\",\"a\",\"a\"]"},{"inputs":["[\"r\",\"a\",\"c\",\"e\",\"c\",\"a\",\"r\"]"],"expected":"[\"r\",\"a\",\"c\",\"e\",\"c\",\"a\",\"r\"]"},{"inputs":["[\" \"]"],"expected":"[\" \"]"},{"inputs":["[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\"]"],"expected":"[\"f\",\"e\",\"d\",\"c\",\"b\",\"a\"]"},{"inputs":["[\"m\",\"n\"]"],"expected":"[\"n\",\"m\"]"},{"inputs":["[\"p\",\"q\",\"r\",\"s\"]"],"expected":"[\"s\",\"r\",\"q\",\"p\"]"},{"inputs":["[\"z\"]"],"expected":"[\"z\"]"},{"inputs":["[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\",\"g\"]"],"expected":"[\"g\",\"f\",\"e\",\"d\",\"c\",\"b\",\"a\"]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'reverse-string', 1, 'Recursive Two Pointers',
  'We use recursion to swap elements from the outside in. At each call, swap left and right, then recurse inward. Base case: left >= right.',
  '["Define helper(left, right).","Base case: if left >= right, return.","Swap s[left] and s[right].","Recurse with left+1 and right-1.","Start with left=0, right=len(s)-1.","Return modified array."]'::jsonb,
  $PY$class Solution:
    def reverseString(self, s: list) -> list:
        def helper(left, right):
            if left >= right:
                return
            s[left], s[right] = s[right], s[left]
            helper(left + 1, right - 1)
        helper(0, len(s) - 1)
        return s$PY$,
  $JS$var reverseString = function(s) {
    function helper(left, right) {
        if (left >= right) return;
        let temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        helper(left + 1, right - 1);
    }
    helper(0, s.length - 1);
    return s;
};$JS$,
  $JAVA$class Solution {
    public String[] reverseString(String[] s) {
        helper(s, 0, s.length - 1);
        return s;
    }
    private void helper(String[] s, int left, int right) {
        if (left >= right) return;
        String temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        helper(s, left + 1, right - 1);
    }
}$JAVA$,
  'O(n)', 'O(n) recursion stack'
);

-- ============================================================
-- 4. merge-sort-array (Medium, custom)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'merge-sort-array', 'recursion', 'Merge Sort Array', 'Medium',
  $DESC$<p>Given an array of integers <code>nums</code>, sort the array in ascending order using the <strong>merge sort</strong> algorithm and return the sorted array.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [5,2,3,1]
Output: [1,2,3,5]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [5,1,1,2,0,0]
Output: [0,0,1,1,2,5]</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>0 &lt;= nums.length &lt;= 5 * 10<sup>4</sup></code></li><li><code>-5 * 10<sup>4</sup> &lt;= nums[i] &lt;= 5 * 10<sup>4</sup></code></li></ul>$DESC$,
  '', ARRAY['Divide the array into two halves at the midpoint.', 'Recursively sort each half.', 'Merge the two sorted halves by comparing elements one by one.'],
  '200', '',
  'sortArray', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'List[int]',
  '[{"inputs":["[5,2,3,1]"],"expected":"[1,2,3,5]"},{"inputs":["[5,1,1,2,0,0]"],"expected":"[0,0,1,1,2,5]"},{"inputs":["[1]"],"expected":"[1]"},{"inputs":["[]"],"expected":"[]"},{"inputs":["[3,3,3,3]"],"expected":"[3,3,3,3]"},{"inputs":["[1,2,3,4,5]"],"expected":"[1,2,3,4,5]"},{"inputs":["[5,4,3,2,1]"],"expected":"[1,2,3,4,5]"},{"inputs":["[-1,0,1]"],"expected":"[-1,0,1]"},{"inputs":["[10,-10,5,-5,0]"],"expected":"[-10,-5,0,5,10]"},{"inputs":["[2,1]"],"expected":"[1,2]"},{"inputs":["[100,50,75,25]"],"expected":"[25,50,75,100]"},{"inputs":["[-3,-1,-2,-4]"],"expected":"[-4,-3,-2,-1]"},{"inputs":["[7,7,7,1,1,1]"],"expected":"[1,1,1,7,7,7]"},{"inputs":["[9,8,7,6,5,4,3,2,1,0]"],"expected":"[0,1,2,3,4,5,6,7,8,9]"},{"inputs":["[42]"],"expected":"[42]"},{"inputs":["[1,3,2,4,6,5]"],"expected":"[1,2,3,4,5,6]"},{"inputs":["[0,0,0,0,0]"],"expected":"[0,0,0,0,0]"},{"inputs":["[-50000,50000,0]"],"expected":"[-50000,0,50000]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'merge-sort-array', 1, 'Classic Merge Sort',
  'Divide the array in half until each piece has 0 or 1 elements, then merge sorted halves back together. Guaranteed O(n log n) in all cases.',
  '["Base case: array of 0 or 1 elements is sorted.","Find midpoint, recursively sort left and right halves.","Merge: use two pointers to compare and build sorted result.","Return merged array."]'::jsonb,
  $PY$class Solution:
    def sortArray(self, nums: list) -> list:
        if len(nums) <= 1:
            return nums
        mid = len(nums) // 2
        left = self.sortArray(nums[:mid])
        right = self.sortArray(nums[mid:])
        return self.merge(left, right)

    def merge(self, left, right):
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        result.extend(left[i:])
        result.extend(right[j:])
        return result$PY$,
  $JS$var sortArray = function(nums) {
    if (nums.length <= 1) return nums;
    let mid = Math.floor(nums.length / 2);
    let left = sortArray(nums.slice(0, mid));
    let right = sortArray(nums.slice(mid));
    return merge(left, right);
};
function merge(left, right) {
    let result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) result.push(left[i++]);
        else result.push(right[j++]);
    }
    while (i < left.length) result.push(left[i++]);
    while (j < right.length) result.push(right[j++]);
    return result;
}$JS$,
  $JAVA$class Solution {
    public int[] sortArray(int[] nums) {
        if (nums.length <= 1) return nums;
        int mid = nums.length / 2;
        int[] left = new int[mid];
        int[] right = new int[nums.length - mid];
        System.arraycopy(nums, 0, left, 0, mid);
        System.arraycopy(nums, mid, right, 0, nums.length - mid);
        left = sortArray(left);
        right = sortArray(right);
        return merge(left, right);
    }
    private int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) result[k++] = left[i++];
            else result[k++] = right[j++];
        }
        while (i < left.length) result[k++] = left[i++];
        while (j < right.length) result[k++] = right[j++];
        return result;
    }
}$JAVA$,
  'O(n log n)', 'O(n)'
);

-- ============================================================
-- 5. generate-parentheses (Medium, LeetCode 22)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'generate-parentheses', 'recursion', 'Generate Parentheses', 'Medium',
  $DESC$<p>Given <code>n</code> pairs of parentheses, write a function to generate all combinations of well-formed parentheses.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 3
Output: ["((()))","(()())","(())()","()(())","()()()"]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 1
Output: ["()"]</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>0 &lt;= n &lt;= 8</code></li></ul>$DESC$,
  '', ARRAY['Use backtracking to build the string one character at a time.', 'Add open paren if open count < n. Add close if close count < open count.', 'When string length equals 2*n, you have a complete valid combination.'],
  '200', 'https://leetcode.com/problems/generate-parentheses/',
  'generateParenthesis', '[{"name":"n","type":"int"}]'::jsonb, 'List[str]',
  '[{"inputs":["0"],"expected":"[\"\"]"},{"inputs":["1"],"expected":"[\"()\"]"},{"inputs":["2"],"expected":"[\"(())\",\"()()\"]"},{"inputs":["3"],"expected":"[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]"},{"inputs":["4"],"expected":"[\"(((())))\",\"((()()))\",\"((())())\",\"((()))()\",\"(()(()))\",\"(()()())\",\"(()())()\",\"(())(())\",\"(())()()\",\"()((()))\",\"()(()())\",\"()(())()\",\"()()(())\",\"()()()()\"]"},{"inputs":["1"],"expected":"[\"()\"]"},{"inputs":["2"],"expected":"[\"(())\",\"()()\"]"},{"inputs":["3"],"expected":"[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]"},{"inputs":["0"],"expected":"[\"\"]"},{"inputs":["4"],"expected":"[\"(((())))\",\"((()()))\",\"((())())\",\"((()))()\",\"(()(()))\",\"(()()())\",\"(()())()\",\"(())(())\",\"(())()()\",\"()((()))\",\"()(()())\",\"()(())()\",\"()()(())\",\"()()()()\"]"},{"inputs":["1"],"expected":"[\"()\"]"},{"inputs":["2"],"expected":"[\"(())\",\"()()\"]"},{"inputs":["0"],"expected":"[\"\"]"},{"inputs":["3"],"expected":"[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]"},{"inputs":["5"],"expected":"[\"((((()))))\",\"(((()())))\",\"(((())()))\",\"(((()))())\",\"(((())))()\",\"((()(())))\",\"((()()()))\",\"((()())())\",\"((()()))()\",\"((())(()))\",\"((())()())\",\"((())())()\",\"((()))(())\",\"((()))()()\",\"(()((())))\",\"(()(()()))\",\"(()(())())\",\"(()(()))()\",\"(()()(()))\",\"(()()()())\",\"(()()())()\",\"(()())(())\",\"(()())()()\",\"(())((()))\",\"(())(()())\",\"(())(())()\",\"(())()(())\",\"(())()()()\",\"()(((())))\" ,\"()((()()))\",\"()((())())\",\"()((()))()\",\"()(()(()))\",\"()(()()())\",\"()(()())()\",\"()(())(())\",\"()(())()()\",\"()()((()))\",\"()()(()())\",\"()()(())()\",\"()()()(())\",\"()()()()()\"]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'generate-parentheses', 1, 'Backtracking',
  'Build valid parentheses strings character by character. At each step, add ( if open count < n, or ) if close count < open count. Sort result for deterministic output.',
  '["Initialize empty result list.","Define backtrack(current, openCount, closeCount).","If length == 2*n, add to results.","If openCount < n, add ( and recurse.","If closeCount < openCount, add ) and recurse.","Sort and return results."]'::jsonb,
  $PY$class Solution:
    def generateParenthesis(self, n: int) -> list:
        result = []
        def backtrack(current, openCount, closeCount):
            if len(current) == 2 * n:
                result.append(current)
                return
            if openCount < n:
                backtrack(current + '(', openCount + 1, closeCount)
            if closeCount < openCount:
                backtrack(current + ')', openCount, closeCount + 1)
        backtrack('', 0, 0)
        result.sort()
        return result$PY$,
  $JS$var generateParenthesis = function(n) {
    let result = [];
    function backtrack(current, openCount, closeCount) {
        if (current.length === 2 * n) {
            result.push(current);
            return;
        }
        if (openCount < n) backtrack(current + '(', openCount + 1, closeCount);
        if (closeCount < openCount) backtrack(current + ')', openCount, closeCount + 1);
    }
    backtrack('', 0, 0);
    result.sort();
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(result, "", 0, 0, n);
        Collections.sort(result);
        return result;
    }
    private void backtrack(List<String> result, String current, int open, int close, int n) {
        if (current.length() == 2 * n) { result.add(current); return; }
        if (open < n) backtrack(result, current + "(", open + 1, close, n);
        if (close < open) backtrack(result, current + ")", open, close + 1, n);
    }
}$JAVA$,
  'O(4^n / sqrt(n))', 'O(n)'
);

-- ============================================================
-- 6. flatten-nested-list-iterator (Medium, LeetCode 341)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'flatten-nested-list-iterator', 'recursion', 'Flatten Nested List', 'Medium',
  $DESC$<p>Given a nested list of integers <code>nestedList</code>, each element is either an integer or a list whose elements may also be integers or other lists. Flatten it into a single list of integers.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nestedList = [[1,1],2,[1,1]]
Output: [1,1,2,1,1]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nestedList = [1,[4,[6]]]
Output: [1,4,6]</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>1 &lt;= nestedList.length &lt;= 500</code></li><li>Nesting depth at most 50.</li></ul>$DESC$,
  '', ARRAY['Iterate through each element.', 'If integer, add to result. If list, recursively flatten it.', 'Use isinstance(item, list) to check type.'],
  '200', 'https://leetcode.com/problems/flatten-nested-list-iterator/',
  'flatten', '[{"name":"nestedList","type":"List"}]'::jsonb, 'List[int]',
  '[{"inputs":["[[1,1],2,[1,1]]"],"expected":"[1,1,2,1,1]"},{"inputs":["[1,[4,[6]]]"],"expected":"[1,4,6]"},{"inputs":["[[1,[2]],3,[4,[5,[6]]]]"],"expected":"[1,2,3,4,5,6]"},{"inputs":["[1,2,3]"],"expected":"[1,2,3]"},{"inputs":["[[1],[2],[3]]"],"expected":"[1,2,3]"},{"inputs":["[[[1]]]"],"expected":"[1]"},{"inputs":["[[[]],1]"],"expected":"[1]"},{"inputs":["[0]"],"expected":"[0]"},{"inputs":["[-1,[-2,[-3]]]"],"expected":"[-1,-2,-3]"},{"inputs":["[[1,2],[3,4],[5,6]]"],"expected":"[1,2,3,4,5,6]"},{"inputs":["[1,[2,3],[4,[5,6]],7]"],"expected":"[1,2,3,4,5,6,7]"},{"inputs":["[[],[],[1]]"],"expected":"[1]"},{"inputs":["[10,[20,[30,[40]]]]"],"expected":"[10,20,30,40]"},{"inputs":["[[1,2,3],[],[4,5]]"],"expected":"[1,2,3,4,5]"},{"inputs":["[[[[[1]]]]]"],"expected":"[1]"},{"inputs":["[1,[],2,[],3]"],"expected":"[1,2,3]"},{"inputs":["[[1,2],[3,[4,5]],[6]]"],"expected":"[1,2,3,4,5,6]"},{"inputs":["[100,[-100,[200,[-200]]]]"],"expected":"[100,-100,200,-200]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'flatten-nested-list-iterator', 1, 'Recursive Flatten',
  'Process each element: if integer, add to result. If list, recursively flatten and extend result. Handles any depth of nesting naturally.',
  '["Create empty result list.","For each element in nestedList:","  If it is a list, recursively flatten and extend result.","  If it is an integer, append to result.","Return result."]'::jsonb,
  $PY$class Solution:
    def flatten(self, nestedList: list) -> list:
        result = []
        for item in nestedList:
            if isinstance(item, list):
                result.extend(self.flatten(item))
            else:
                result.append(item)
        return result$PY$,
  $JS$var flatten = function(nestedList) {
    let result = [];
    for (let item of nestedList) {
        if (Array.isArray(item)) result.push(...flatten(item));
        else result.push(item);
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<Integer> flatten(List<Object> nestedList) {
        List<Integer> result = new ArrayList<>();
        for (Object item : nestedList) {
            if (item instanceof List) result.addAll(flatten((List<Object>) item));
            else result.add((Integer) item);
        }
        return result;
    }
}$JAVA$,
  'O(n)', 'O(d) nesting depth'
);

COMMIT;
