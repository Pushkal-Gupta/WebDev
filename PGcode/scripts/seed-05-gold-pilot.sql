-- ============================================================
-- GOLD PILOT: 5 problems at the new LeetCode-style quality bar.
--
-- Covers:
--   stack   : min-stack, eval-rpn, daily-temperatures, largest-rect-histogram
--   strings : longest-palindromic-substring  (rewrite of pilot row)
--
-- Each row ships with:
--   - Full HTML description (problem + Example 1 + Example 2 + Constraints)
--   - 3 actionable hints
--   - Real LeetCode URL + real NeetCode video ID
--   - method_name, params (JSONB), return_type
--   - test_cases JSONB with 6+ cases including edge cases
--   - Python / JavaScript / Java starter templates
--
-- Idempotent: safe to re-run. Deletes children first, then parent,
-- then inserts fresh.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0) Clean any prior versions of the 5 pilot rows
-- ------------------------------------------------------------
DELETE FROM public."PGcode_problem_templates"
WHERE problem_id IN (
  'min-stack', 'eval-rpn', 'daily-temperatures',
  'largest-rect-histogram', 'longest-palindromic-substring'
);

DELETE FROM public."PGcode_problems"
WHERE id IN (
  'min-stack', 'eval-rpn', 'daily-temperatures',
  'largest-rect-histogram', 'longest-palindromic-substring'
);

-- ------------------------------------------------------------
-- 1) Problem rows
-- ------------------------------------------------------------
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url)
VALUES

-- ============ Stack: Min Stack ============
('min-stack', 'stack', 'Min Stack', 'Medium',
$DESC$
<p>Design a stack that supports <code>push</code>, <code>pop</code>, <code>top</code>, and retrieving the minimum element — all in <strong>O(1)</strong> time.</p>
<p>Implement the <code>MinStack</code> class:</p>
<ul>
  <li><code>push(val)</code> pushes <code>val</code> onto the stack.</li>
  <li><code>pop()</code> removes the element on the top of the stack.</li>
  <li><code>top()</code> gets the top element of the stack.</li>
  <li><code>getMin()</code> retrieves the minimum element in the stack.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input:
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]
Output:
[null,null,null,null,-3,null,0,-2]

Explanation:
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin(); // return -3
minStack.pop();
minStack.top();    // return 0
minStack.getMin(); // return -2</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>-2<sup>31</sup> &lt;= val &lt;= 2<sup>31</sup> - 1</code></li>
  <li>Methods <code>pop</code>, <code>top</code>, and <code>getMin</code> are only called on non-empty stacks.</li>
  <li>At most <code>3 * 10<sup>4</sup></code> calls will be made.</li>
</ul>
$DESC$,
 'qkLl7nAwDPo',
 ARRAY[
   'Keep a second stack that stores the running minimum seen so far — its top is always the current min.',
   'On push, compare the new value to the current min (top of the min stack) and push the smaller one.',
   'On pop, pop from both stacks in lockstep so the min stack always mirrors the main stack''s history.'
 ],
 '200', 'https://leetcode.com/problems/min-stack/'),

-- ============ Stack: Evaluate Reverse Polish Notation ============
('eval-rpn', 'stack', 'Evaluate Reverse Polish Notation', 'Medium',
$DESC$
<p>You are given an array of strings <code>tokens</code> that represents an arithmetic expression in <a href="https://en.wikipedia.org/wiki/Reverse_Polish_notation">Reverse Polish Notation</a>. Evaluate the expression and return an integer.</p>
<p>Valid operators are <code>+</code>, <code>-</code>, <code>*</code>, and <code>/</code>. Each operand may be an integer or another expression. Division between two integers truncates toward zero. The input is always a valid expression.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  tokens = ["4","13","5","/","+"]
Output: 6
Explanation: (4 + (13 / 5)) = 6</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= tokens.length &lt;= 10<sup>4</sup></code></li>
  <li><code>tokens[i]</code> is either an operator or an integer in the range <code>[-200, 200]</code>.</li>
</ul>
$DESC$,
 'iu0082c4HDE',
 ARRAY[
   'Scan the tokens left-to-right; push numbers onto a stack as you see them.',
   'When you hit an operator, pop the two most recent operands — remember the order: second pop is the left operand.',
   'Be careful with division: Python''s // rounds toward negative infinity, so use int(a / b) to truncate toward zero.'
 ],
 '200', 'https://leetcode.com/problems/evaluate-reverse-polish-notation/'),

-- ============ Stack: Daily Temperatures ============
('daily-temperatures', 'stack', 'Daily Temperatures', 'Medium',
$DESC$
<p>Given an array of integers <code>temperatures</code> representing daily temperatures, return an array <code>answer</code> such that <code>answer[i]</code> is the number of days you have to wait after day <code>i</code> to get a warmer temperature. If there is no future day for which this is possible, set <code>answer[i] = 0</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  temperatures = [30,40,50,60]
Output: [1,1,1,0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= temperatures.length &lt;= 10<sup>5</sup></code></li>
  <li><code>30 &lt;= temperatures[i] &lt;= 100</code></li>
</ul>
$DESC$,
 'cTBiBSnjO60',
 ARRAY[
   'Use a monotonic decreasing stack that holds indices of days still waiting for a warmer one.',
   'When the current day is warmer than the day at the top of the stack, pop it and record the index difference into answer.',
   'Every index is pushed and popped at most once, so the total work is O(n) even though the inner while looks quadratic.'
 ],
 '200', 'https://leetcode.com/problems/daily-temperatures/'),

-- ============ Stack: Largest Rectangle in Histogram ============
('largest-rect-histogram', 'stack', 'Largest Rectangle in Histogram', 'Hard',
$DESC$
<p>Given an array of integers <code>heights</code> representing the histogram''s bar height where the width of each bar is <code>1</code>, return the area of the largest rectangle that can be formed within the histogram.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  heights = [2,1,5,6,2,3]
Output: 10
Explanation: The bars of heights 5 and 6 form a rectangle of area 5 * 2 = 10.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  heights = [2,4]
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= heights.length &lt;= 10<sup>5</sup></code></li>
  <li><code>0 &lt;= heights[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$DESC$,
 'zx5Sw9130L0',
 ARRAY[
   'Use a monotonic increasing stack of (start_index, height) pairs — each stack entry represents a rectangle that could still grow rightward.',
   'When you encounter a bar shorter than the stack''s top, pop and compute area = popped_height * (current_index - popped_start).',
   'Don''t forget to flush the remaining stack at the end — those rectangles extend all the way to len(heights).'
 ],
 '200', 'https://leetcode.com/problems/largest-rectangle-in-histogram/'),

-- ============ Strings: Longest Palindromic Substring (rewrite) ============
('longest-palindromic-substring', 'strings', 'Longest Palindromic Substring', 'Medium',
$DESC$
<p>Given a string <code>s</code>, return <em>the longest palindromic substring</em> in <code>s</code>. A string is a <strong>palindrome</strong> when it reads the same forward and backward.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "babad"
Output: "bab"
Explanation: "aba" is also a valid answer.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "cbbd"
Output: "bb"</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 1000</code></li>
  <li><code>s</code> consists of only digits and English letters.</li>
</ul>
$DESC$,
 'XYQecbcd6_c',
 ARRAY[
   'A palindrome mirrors around its center. There are 2n - 1 possible centers: n single-character centers plus n - 1 between-character centers for even-length palindromes.',
   'For each center, expand two pointers outward while the characters match and track the longest span seen so far.',
   'Store just the best (start, length) and slice at the end — avoid building new substrings inside the loop for O(n^2) time and O(1) extra space.'
 ],
 '200', 'https://leetcode.com/problems/longest-palindromic-substring/');


-- ------------------------------------------------------------
-- 2) Signatures + test cases
-- ------------------------------------------------------------

-- Min Stack — special: class-based, use "MinStack" as method_name sentinel
UPDATE public."PGcode_problems" SET
  method_name = 'MinStack',
  params = '[{"name":"operations","type":"List[List]"}]'::jsonb,
  return_type = 'List',
  test_cases = '[
    {"inputs":["[[\"MinStack\"],[\"push\",-2],[\"push\",0],[\"push\",-3],[\"getMin\"],[\"pop\"],[\"top\"],[\"getMin\"]]"],"expected":"[null,null,null,null,-3,null,0,-2]"},
    {"inputs":["[[\"MinStack\"],[\"push\",5],[\"getMin\"],[\"push\",3],[\"getMin\"],[\"push\",7],[\"getMin\"]]"],"expected":"[null,null,5,null,3,null,3]"},
    {"inputs":["[[\"MinStack\"],[\"push\",1],[\"push\",1],[\"push\",1],[\"getMin\"],[\"pop\"],[\"getMin\"]]"],"expected":"[null,null,null,null,1,null,1]"},
    {"inputs":["[[\"MinStack\"],[\"push\",-10],[\"push\",-20],[\"top\"],[\"getMin\"],[\"pop\"],[\"getMin\"],[\"top\"]]"],"expected":"[null,null,null,-20,-20,null,-10,-10]"},
    {"inputs":["[[\"MinStack\"],[\"push\",0],[\"push\",0],[\"getMin\"],[\"pop\"],[\"getMin\"]]"],"expected":"[null,null,null,0,null,0]"},
    {"inputs":["[[\"MinStack\"],[\"push\",2147483647],[\"push\",-2147483648],[\"getMin\"],[\"pop\"],[\"getMin\"]]"],"expected":"[null,null,null,-2147483648,null,2147483647]"}
  ]'::jsonb
WHERE id = 'min-stack';

-- Evaluate RPN
UPDATE public."PGcode_problems" SET
  method_name = 'evalRPN',
  params = '[{"name":"tokens","type":"List[str]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[\"2\",\"1\",\"+\",\"3\",\"*\"]"],"expected":"9"},
    {"inputs":["[\"4\",\"13\",\"5\",\"/\",\"+\"]"],"expected":"6"},
    {"inputs":["[\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"]"],"expected":"22"},
    {"inputs":["[\"3\",\"-4\",\"+\"]"],"expected":"-1"},
    {"inputs":["[\"5\"]"],"expected":"5"},
    {"inputs":["[\"7\",\"-3\",\"/\"]"],"expected":"-2"},
    {"inputs":["[\"-2\",\"3\",\"*\"]"],"expected":"-6"}
  ]'::jsonb
WHERE id = 'eval-rpn';

-- Daily Temperatures
UPDATE public."PGcode_problems" SET
  method_name = 'dailyTemperatures',
  params = '[{"name":"temperatures","type":"List[int]"}]'::jsonb,
  return_type = 'List[int]',
  test_cases = '[
    {"inputs":["[73,74,75,71,69,72,76,73]"],"expected":"[1,1,4,2,1,1,0,0]"},
    {"inputs":["[30,40,50,60]"],"expected":"[1,1,1,0]"},
    {"inputs":["[30,60,90]"],"expected":"[1,1,0]"},
    {"inputs":["[100,99,98,97]"],"expected":"[0,0,0,0]"},
    {"inputs":["[55]"],"expected":"[0]"},
    {"inputs":["[89,62,70,58,47,47,46,76,100,70]"],"expected":"[8,1,5,4,3,2,1,1,0,0]"}
  ]'::jsonb
WHERE id = 'daily-temperatures';

-- Largest Rectangle in Histogram
UPDATE public."PGcode_problems" SET
  method_name = 'largestRectangleArea',
  params = '[{"name":"heights","type":"List[int]"}]'::jsonb,
  return_type = 'int',
  test_cases = '[
    {"inputs":["[2,1,5,6,2,3]"],"expected":"10"},
    {"inputs":["[2,4]"],"expected":"4"},
    {"inputs":["[1,1,1,1]"],"expected":"4"},
    {"inputs":["[6,2,5,4,5,1,6]"],"expected":"12"},
    {"inputs":["[0]"],"expected":"0"},
    {"inputs":["[5]"],"expected":"5"},
    {"inputs":["[3,6,5,7,4,8,1,0]"],"expected":"20"}
  ]'::jsonb
WHERE id = 'largest-rect-histogram';

-- Longest Palindromic Substring
UPDATE public."PGcode_problems" SET
  method_name = 'longestPalindrome',
  params = '[{"name":"s","type":"str"}]'::jsonb,
  return_type = 'str',
  test_cases = '[
    {"inputs":["\"babad\""],"expected":"\"bab\""},
    {"inputs":["\"cbbd\""],"expected":"\"bb\""},
    {"inputs":["\"a\""],"expected":"\"a\""},
    {"inputs":["\"ac\""],"expected":"\"a\""},
    {"inputs":["\"racecar\""],"expected":"\"racecar\""},
    {"inputs":["\"abacdfgdcaba\""],"expected":"\"aba\""},
    {"inputs":["\"bananas\""],"expected":"\"anana\""}
  ]'::jsonb
WHERE id = 'longest-palindromic-substring';


-- ------------------------------------------------------------
-- 3) Starter templates (python / javascript / java)
-- ------------------------------------------------------------
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES

-- ---------- Min Stack ----------
('min-stack', 'python',
$PY$class MinStack:
    def __init__(self):
        # Write your code here
        pass

    def push(self, val: int) -> None:
        # Write your code here
        pass

    def pop(self) -> None:
        # Write your code here
        pass

    def top(self) -> int:
        # Write your code here
        pass

    def getMin(self) -> int:
        # Write your code here
        pass
$PY$),
('min-stack', 'javascript',
$JS$var MinStack = function() {
    // Write your code here
};

MinStack.prototype.push = function(val) {
    // Write your code here
};

MinStack.prototype.pop = function() {
    // Write your code here
};

MinStack.prototype.top = function() {
    // Write your code here
};

MinStack.prototype.getMin = function() {
    // Write your code here
};
$JS$),
('min-stack', 'java',
$JAVA$class MinStack {
    public MinStack() {
        // Write your code here
    }

    public void push(int val) {
        // Write your code here
    }

    public void pop() {
        // Write your code here
    }

    public int top() {
        // Write your code here
        return 0;
    }

    public int getMin() {
        // Write your code here
        return 0;
    }
}
$JAVA$),

-- ---------- Evaluate RPN ----------
('eval-rpn', 'python',
$PY$class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        # Write your code here
        pass
$PY$),
('eval-rpn', 'javascript',
$JS$/**
 * @param {string[]} tokens
 * @return {number}
 */
var evalRPN = function(tokens) {
    // Write your code here
};
$JS$),
('eval-rpn', 'java',
$JAVA$class Solution {
    public int evalRPN(String[] tokens) {
        // Write your code here
        return 0;
    }
}
$JAVA$),

-- ---------- Daily Temperatures ----------
('daily-temperatures', 'python',
$PY$class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        # Write your code here
        pass
$PY$),
('daily-temperatures', 'javascript',
$JS$/**
 * @param {number[]} temperatures
 * @return {number[]}
 */
var dailyTemperatures = function(temperatures) {
    // Write your code here
};
$JS$),
('daily-temperatures', 'java',
$JAVA$class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        // Write your code here
        return new int[0];
    }
}
$JAVA$),

-- ---------- Largest Rectangle in Histogram ----------
('largest-rect-histogram', 'python',
$PY$class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        # Write your code here
        pass
$PY$),
('largest-rect-histogram', 'javascript',
$JS$/**
 * @param {number[]} heights
 * @return {number}
 */
var largestRectangleArea = function(heights) {
    // Write your code here
};
$JS$),
('largest-rect-histogram', 'java',
$JAVA$class Solution {
    public int largestRectangleArea(int[] heights) {
        // Write your code here
        return 0;
    }
}
$JAVA$),

-- ---------- Longest Palindromic Substring ----------
('longest-palindromic-substring', 'python',
$PY$class Solution:
    def longestPalindrome(self, s: str) -> str:
        # Write your code here
        pass
$PY$),
('longest-palindromic-substring', 'javascript',
$JS$/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    // Write your code here
};
$JS$),
('longest-palindromic-substring', 'java',
$JAVA$class Solution {
    public String longestPalindrome(String s) {
        // Write your code here
        return "";
    }
}
$JAVA$);

COMMIT;

-- ------------------------------------------------------------
-- 4) Verification — should return 5 rows, all with has_* = true
-- ------------------------------------------------------------
SELECT
  id,
  topic_id,
  (test_cases IS NOT NULL AND jsonb_array_length(test_cases) >= 6) AS has_6_plus_tests,
  (method_name IS NOT NULL) AS has_signature,
  array_length(hints, 1) AS hint_count,
  LENGTH(description) AS desc_len
FROM public."PGcode_problems"
WHERE id IN (
  'min-stack', 'eval-rpn', 'daily-temperatures',
  'largest-rect-histogram', 'longest-palindromic-substring'
)
ORDER BY topic_id, id;
