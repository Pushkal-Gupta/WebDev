-- Add 5 new problems: valid-sudoku, majority-element, missing-number, pascals-triangle, valid-palindrome-ii
-- Each problem has full metadata, test cases, and one solution approach with Python/JS/Java code.
BEGIN;

-- Clean up any prior rows for idempotency
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'valid-sudoku','majority-element','missing-number','pascals-triangle','valid-palindrome-ii'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'valid-sudoku','majority-element','missing-number','pascals-triangle','valid-palindrome-ii'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'valid-sudoku','majority-element','missing-number','pascals-triangle','valid-palindrome-ii'
);

-- ============================================================
-- PROBLEMS
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES

-- ============ 1. valid-sudoku ============
('valid-sudoku', 'arrays', 'Valid Sudoku', 'Medium',
$$<p>Determine if a <code>9 x 9</code> Sudoku board is valid. Only the filled cells need to be validated according to the following rules:</p>
<ul>
  <li>Each row must contain the digits <code>1-9</code> without repetition.</li>
  <li>Each column must contain the digits <code>1-9</code> without repetition.</li>
  <li>Each of the nine <code>3 x 3</code> sub-boxes of the grid must contain the digits <code>1-9</code> without repetition.</li>
</ul>
<p><strong>Note:</strong> A Sudoku board (partially filled) could be valid but is not necessarily solvable. Only the filled cells need to be validated.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: board =
[["5","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: board =
[["8","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output: false
Explanation: Same as Example 1, except the 5 in the top left corner is replaced with an 8. Since there are two 8''s in the top left 3x3 sub-box, it is invalid.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>board.length == 9</code></li>
  <li><code>board[i].length == 9</code></li>
  <li><code>board[i][j]</code> is a digit <code>1-9</code> or <code>''.''</code>.</li>
</ul>$$,
'', ARRAY[
  'Use a set for each row, column, and 3x3 box to track seen digits.',
  'For each cell, compute which box it belongs to using (row // 3, col // 3).',
  'If a digit is already in the corresponding row, column, or box set, the board is invalid.'
], '200', 'https://leetcode.com/problems/valid-sudoku/',
'isValidSudoku',
'[{"name":"board","type":"List[List[str]]"}]'::jsonb,
'bool',
'[
  {"inputs":["[[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"],[\"6\",\".\",\".\",\"1\",\"9\",\"5\",\".\",\".\",\".\"],[\".\",\"9\",\"8\",\".\",\".\",\".\",\".\",\"6\",\".\"],[\"8\",\".\",\".\",\".\",\"6\",\".\",\".\",\".\",\"3\"],[\"4\",\".\",\".\",\"8\",\".\",\"3\",\".\",\".\",\"1\"],[\"7\",\".\",\".\",\".\",\"2\",\".\",\".\",\".\",\"6\"],[\".\",\"6\",\".\",\".\",\".\",\".\",\"2\",\"8\",\".\"],[\".\",\".\",\".\",\"4\",\"1\",\"9\",\".\",\".\",\"5\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\"7\",\"9\"]]"],"expected":"true"},
  {"inputs":["[[\"8\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"],[\"6\",\".\",\".\",\"1\",\"9\",\"5\",\".\",\".\",\".\"],[\".\",\"9\",\"8\",\".\",\".\",\".\",\".\",\"6\",\".\"],[\"8\",\".\",\".\",\".\",\"6\",\".\",\".\",\".\",\"3\"],[\"4\",\".\",\".\",\"8\",\".\",\"3\",\".\",\".\",\"1\"],[\"7\",\".\",\".\",\".\",\"2\",\".\",\".\",\".\",\"6\"],[\".\",\"6\",\".\",\".\",\".\",\".\",\"2\",\"8\",\".\"],[\".\",\".\",\".\",\"4\",\"1\",\"9\",\".\",\".\",\"5\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\"7\",\"9\"]]"],"expected":"false"},
  {"inputs":["[[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"true"},
  {"inputs":["[[\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\"],[\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"1\",\"2\",\"3\"],[\"7\",\"8\",\"9\",\"1\",\"2\",\"3\",\"4\",\"5\",\"6\"],[\"2\",\"3\",\"1\",\"5\",\"6\",\"4\",\"8\",\"9\",\"7\"],[\"5\",\"6\",\"4\",\"8\",\"9\",\"7\",\"2\",\"3\",\"1\"],[\"8\",\"9\",\"7\",\"2\",\"3\",\"1\",\"5\",\"6\",\"4\"],[\"3\",\"1\",\"2\",\"6\",\"4\",\"5\",\"9\",\"7\",\"8\"],[\"6\",\"4\",\"5\",\"9\",\"7\",\"8\",\"3\",\"1\",\"2\"],[\"9\",\"7\",\"8\",\"3\",\"1\",\"2\",\"6\",\"4\",\"5\"]]"],"expected":"true"},
  {"inputs":["[[\"1\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\"1\"]]"],"expected":"true"},
  {"inputs":["[[\"1\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\"1\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"false"},
  {"inputs":["[[\"1\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\"1\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"false"},
  {"inputs":["[[\".\",\".\",\".\",\".\",\"5\",\".\",\".\",\"1\",\".\"],[\".\",\"4\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"true"},
  {"inputs":["[[\".\",\".\",\"4\",\".\",\".\",\".\",\"6\",\"3\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\"5\",\".\",\".\",\".\",\".\",\".\",\".\",\"9\",\".\"],[\".\",\".\",\".\",\"5\",\"6\",\".\",\".\",\".\",\".\"],[\"4\",\".\",\"3\",\".\",\".\",\".\",\".\",\".\",\"1\"],[\".\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\"5\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"false"},
  {"inputs":["[[\".\",\".\",\".\",\".\",\".\",\".\",\"5\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\"9\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\"9\"]]"],"expected":"true"},
  {"inputs":["[[\"5\",\"3\",\".\",\".\",\"7\",\".\",\".\",\".\",\".\"],[\"6\",\".\",\".\",\"1\",\"9\",\"5\",\".\",\".\",\".\"],[\".\",\"9\",\"8\",\".\",\".\",\".\",\".\",\"6\",\".\"],[\"8\",\".\",\".\",\".\",\"6\",\".\",\".\",\".\",\"3\"],[\"4\",\".\",\".\",\"8\",\".\",\"3\",\".\",\".\",\"1\"],[\"7\",\".\",\".\",\".\",\"2\",\".\",\".\",\".\",\"6\"],[\".\",\"6\",\".\",\".\",\".\",\".\",\"2\",\"8\",\".\"],[\".\",\".\",\".\",\"4\",\"1\",\"9\",\".\",\".\",\"5\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\"7\",\"9\"]]"],"expected":"true"},
  {"inputs":["[[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\"8\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"true"},
  {"inputs":["[[\"1\",\"2\",\".\",\".\",\"3\",\".\",\".\",\".\",\".\"],[\"4\",\".\",\".\",\"5\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"true"},
  {"inputs":["[[\"1\",\"1\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"false"},
  {"inputs":["[[\"9\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\"9\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"],[\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\",\".\"]]"],"expected":"false"}
]'::jsonb),

-- ============ 2. majority-element ============
('majority-element', 'arrays', 'Majority Element', 'Easy',
$$<p>Given an array <code>nums</code> of size <code>n</code>, return the <em>majority element</em>.</p>
<p>The majority element is the element that appears more than <code>&lfloor;n / 2&rfloor;</code> times. You may assume that the majority element always exists in the array.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,2,3]
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [2,2,1,1,1,2,2]
Output: 2</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == nums.length</code></li>
  <li><code>1 &lt;= n &lt;= 5 * 10<sup>4</sup></code></li>
  <li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
</ul>$$,
'', ARRAY[
  'Think about Boyer-Moore Voting Algorithm: maintain a candidate and a count.',
  'When count drops to 0, pick the current element as the new candidate.',
  'The majority element will always survive because it has more than n/2 votes.'
], '200', 'https://leetcode.com/problems/majority-element/',
'majorityElement',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,2,3]"],"expected":"3"},
  {"inputs":["[2,2,1,1,1,2,2]"],"expected":"2"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[1,1,1]"],"expected":"1"},
  {"inputs":["[6,5,5]"],"expected":"5"},
  {"inputs":["[1,2,1,2,1]"],"expected":"1"},
  {"inputs":["[3,3,4]"],"expected":"3"},
  {"inputs":["[10,10,10,10,2]"],"expected":"10"},
  {"inputs":["[0,0,0]"],"expected":"0"},
  {"inputs":["[-1,-1,-1,2,2]"],"expected":"-1"},
  {"inputs":["[100]"],"expected":"100"},
  {"inputs":["[1,1,2]"],"expected":"1"},
  {"inputs":["[5,5,5,5,5]"],"expected":"5"},
  {"inputs":["[1,2,1]"],"expected":"1"},
  {"inputs":["[7,7,7,3,3]"],"expected":"7"},
  {"inputs":["[-1000000000,-1000000000,1000000000]"],"expected":"-1000000000"},
  {"inputs":["[4,4,4,4,1,2,3]"],"expected":"4"},
  {"inputs":["[9,9,9,1,2,3,9]"],"expected":"9"},
  {"inputs":["[2,2,2,2,2,1,1,1,1]"],"expected":"2"},
  {"inputs":["[0]"],"expected":"0"}
]'::jsonb),

-- ============ 3. missing-number ============
('missing-number', 'arrays', 'Missing Number', 'Easy',
$$<p>Given an array <code>nums</code> containing <code>n</code> distinct numbers in the range <code>[0, n]</code>, return the <em>only number in the range that is missing from the array</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,0,1]
Output: 2
Explanation: n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number since it does not appear in nums.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0,1]
Output: 2</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: nums = [9,6,4,2,3,5,7,0,1]
Output: 8</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>n == nums.length</code></li>
  <li><code>1 &lt;= n &lt;= 10<sup>4</sup></code></li>
  <li><code>0 &lt;= nums[i] &lt;= n</code></li>
  <li>All the numbers of <code>nums</code> are <strong>unique</strong>.</li>
</ul>$$,
'', ARRAY[
  'The sum of 0 to n is n*(n+1)/2. Subtract the array sum to find the missing number.',
  'Alternatively, XOR all indices 0..n with all array values — the missing number remains.',
  'Both approaches are O(n) time and O(1) space.'
], '200', 'https://leetcode.com/problems/missing-number/',
'missingNumber',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,0,1]"],"expected":"2"},
  {"inputs":["[0,1]"],"expected":"2"},
  {"inputs":["[9,6,4,2,3,5,7,0,1]"],"expected":"8"},
  {"inputs":["[0]"],"expected":"1"},
  {"inputs":["[1]"],"expected":"0"},
  {"inputs":["[1,2]"],"expected":"0"},
  {"inputs":["[0,2]"],"expected":"1"},
  {"inputs":["[0,1,3]"],"expected":"2"},
  {"inputs":["[0,1,2,3,4,5,6,7,9]"],"expected":"8"},
  {"inputs":["[0,1,2,3,5]"],"expected":"4"},
  {"inputs":["[1,2,3,4,5]"],"expected":"0"},
  {"inputs":["[0,1,2,3,4]"],"expected":"5"},
  {"inputs":["[2,0]"],"expected":"1"},
  {"inputs":["[5,3,0,1,4]"],"expected":"2"},
  {"inputs":["[8,6,4,2,3,5,7,0]"],"expected":"1"},
  {"inputs":["[0,2,3]"],"expected":"1"},
  {"inputs":["[3,2,0]"],"expected":"1"},
  {"inputs":["[4,1,0,2]"],"expected":"3"},
  {"inputs":["[0,1,2]"],"expected":"3"},
  {"inputs":["[7,5,3,1,0,2,4]"],"expected":"6"}
]'::jsonb),

-- ============ 4. pascals-triangle ============
('pascals-triangle', 'arrays', 'Pascal''s Triangle', 'Easy',
$$<p>Given an integer <code>numRows</code>, return the first <code>numRows</code> of <strong>Pascal''s triangle</strong>.</p>
<p>In Pascal''s triangle, each number is the sum of the two numbers directly above it.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: numRows = 5
Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: numRows = 1
Output: [[1]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= numRows &lt;= 30</code></li>
</ul>$$,
'', ARRAY[
  'Start with [[1]]. For each new row, the first and last elements are 1.',
  'Each inner element is the sum of the two elements above it from the previous row.',
  'Build each row iteratively using the previous row.'
], '200', 'https://leetcode.com/problems/pascals-triangle/',
'generate',
'[{"name":"numRows","type":"int"}]'::jsonb,
'List[List[int]]',
'[
  {"inputs":["5"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]"},
  {"inputs":["1"],"expected":"[[1]]"},
  {"inputs":["2"],"expected":"[[1],[1,1]]"},
  {"inputs":["3"],"expected":"[[1],[1,1],[1,2,1]]"},
  {"inputs":["4"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1]]"},
  {"inputs":["6"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1]]"},
  {"inputs":["7"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1]]"},
  {"inputs":["8"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1]]"},
  {"inputs":["9"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1]]"},
  {"inputs":["10"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1]]"},
  {"inputs":["11"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1],[1,10,45,120,210,252,210,120,45,10,1]]"},
  {"inputs":["12"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1],[1,10,45,120,210,252,210,120,45,10,1],[1,11,55,165,330,462,462,330,165,55,11,1]]"},
  {"inputs":["13"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1],[1,10,45,120,210,252,210,120,45,10,1],[1,11,55,165,330,462,462,330,165,55,11,1],[1,12,66,220,495,792,924,792,495,220,66,12,1]]"},
  {"inputs":["14"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1],[1,10,45,120,210,252,210,120,45,10,1],[1,11,55,165,330,462,462,330,165,55,11,1],[1,12,66,220,495,792,924,792,495,220,66,12,1],[1,13,78,286,715,1287,1716,1716,1287,715,286,78,13,1]]"},
  {"inputs":["15"],"expected":"[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1],[1,7,21,35,35,21,7,1],[1,8,28,56,70,56,28,8,1],[1,9,36,84,126,126,84,36,9,1],[1,10,45,120,210,252,210,120,45,10,1],[1,11,55,165,330,462,462,330,165,55,11,1],[1,12,66,220,495,792,924,792,495,220,66,12,1],[1,13,78,286,715,1287,1716,1716,1287,715,286,78,13,1],[1,14,91,364,1001,2002,3003,3432,3003,2002,1001,364,91,14,1]]"}
]'::jsonb),

-- ============ 5. valid-palindrome-ii ============
('valid-palindrome-ii', 'strings', 'Valid Palindrome II', 'Easy',
$$<p>Given a string <code>s</code>, return <code>true</code> if the <code>s</code> can be palindrome after deleting <strong>at most one</strong> character from it.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "aba"
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "abca"
Output: true
Explanation: You could delete the character ''c''.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s = "abc"
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 10<sup>5</sup></code></li>
  <li><code>s</code> consists of lowercase English letters.</li>
</ul>$$,
'', ARRAY[
  'Use two pointers from both ends moving toward the center.',
  'When a mismatch is found, try skipping either the left or the right character.',
  'Check if the remaining substring (after skipping one) is a palindrome.'
], '200', 'https://leetcode.com/problems/valid-palindrome-ii/',
'validPalindrome',
'[{"name":"s","type":"str"}]'::jsonb,
'bool',
'[
  {"inputs":["\"aba\""],"expected":"true"},
  {"inputs":["\"abca\""],"expected":"true"},
  {"inputs":["\"abc\""],"expected":"false"},
  {"inputs":["\"a\""],"expected":"true"},
  {"inputs":["\"ab\""],"expected":"true"},
  {"inputs":["\"aa\""],"expected":"true"},
  {"inputs":["\"racecar\""],"expected":"true"},
  {"inputs":["\"raceecar\""],"expected":"true"},
  {"inputs":["\"abcba\""],"expected":"true"},
  {"inputs":["\"abcda\""],"expected":"false"},
  {"inputs":["\"deeee\""],"expected":"true"},
  {"inputs":["\"abcbxa\""],"expected":"false"},
  {"inputs":["\"cbbcc\""],"expected":"true"},
  {"inputs":["\"aaa\""],"expected":"true"},
  {"inputs":["\"abba\""],"expected":"true"},
  {"inputs":["\"abbca\""],"expected":"true"},
  {"inputs":["\"eeccccbebaeeabebccceea\""],"expected":"false"},
  {"inputs":["\"aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgsymdjgpfdhooxfuupuculmgmqfvnbgtapekouga\""],"expected":"true"},
  {"inputs":["\"ebcbbececabbacecbbcbe\""],"expected":"true"},
  {"inputs":["\"z\""],"expected":"true"}
]'::jsonb);

-- ============================================================
-- SOLUTION APPROACHES
-- ============================================================

-- ============ valid-sudoku ============
INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES
('valid-sudoku', 1, 'Hash Sets for Rows, Columns, and Boxes',
'We need to check three constraints: no duplicate in any row, column, or 3x3 box. By maintaining a set for each row, column, and box, we can detect duplicates in a single pass through all 81 cells.',
'["Create 9 sets for rows, 9 sets for columns, and 9 sets for 3x3 boxes.","Iterate through each cell (r, c) of the board.","Skip cells containing ''.''.","Compute the box index as (r // 3) * 3 + (c // 3).","If the digit is already in the corresponding row, column, or box set, return false.","Otherwise add the digit to all three sets.","If no conflict is found after scanning all cells, return true."]'::jsonb,
$PY$class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]

        for r in range(9):
            for c in range(9):
                val = board[r][c]
                if val == '.':
                    continue
                box_idx = (r // 3) * 3 + (c // 3)
                if val in rows[r] or val in cols[c] or val in boxes[box_idx]:
                    return False
                rows[r].add(val)
                cols[c].add(val)
                boxes[box_idx].add(val)

        return True
$PY$,
$JS$var isValidSudoku = function(board) {
    const rows = Array.from({length: 9}, () => new Set());
    const cols = Array.from({length: 9}, () => new Set());
    const boxes = Array.from({length: 9}, () => new Set());

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = board[r][c];
            if (val === '.') continue;
            const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            if (rows[r].has(val) || cols[c].has(val) || boxes[boxIdx].has(val)) {
                return false;
            }
            rows[r].add(val);
            cols[c].add(val);
            boxes[boxIdx].add(val);
        }
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<Character>[] rows = new HashSet[9];
        Set<Character>[] cols = new HashSet[9];
        Set<Character>[] boxes = new HashSet[9];
        for (int i = 0; i < 9; i++) {
            rows[i] = new HashSet<>();
            cols[i] = new HashSet<>();
            boxes[i] = new HashSet<>();
        }
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                char val = board[r][c];
                if (val == '.') continue;
                int boxIdx = (r / 3) * 3 + (c / 3);
                if (!rows[r].add(val) || !cols[c].add(val) || !boxes[boxIdx].add(val)) {
                    return false;
                }
            }
        }
        return true;
    }
}
$JAVA$,
'O(81) = O(1)', 'O(81) = O(1)'),

-- ============ majority-element ============
('majority-element', 1, 'Boyer-Moore Voting Algorithm',
'The key insight is that the majority element occurs more than n/2 times, so if we pair each occurrence of the majority with a different element they would still have leftovers. We maintain a candidate and a count: increment when we see the candidate, decrement otherwise. When count hits 0, we pick a new candidate. The true majority always survives.',
'["Initialize candidate = nums[0], count = 0.","For each num in nums: if count == 0, set candidate = num.","If num == candidate, increment count; else decrement count.","Return candidate (guaranteed to be the majority element)."]'::jsonb,
$PY$class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        candidate = 0
        count = 0
        for num in nums:
            if count == 0:
                candidate = num
            count += 1 if num == candidate else -1
        return candidate
$PY$,
$JS$var majorityElement = function(nums) {
    let candidate = 0;
    let count = 0;
    for (const num of nums) {
        if (count === 0) candidate = num;
        count += (num === candidate) ? 1 : -1;
    }
    return candidate;
};
$JS$,
$JAVA$class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0;
        int count = 0;
        for (int num : nums) {
            if (count == 0) candidate = num;
            count += (num == candidate) ? 1 : -1;
        }
        return candidate;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ============ missing-number ============
('missing-number', 1, 'Sum Formula',
'The numbers [0, n] should sum to n*(n+1)/2. By subtracting the actual array sum from this expected sum, we get the missing number. This avoids sorting or extra space.',
'["Compute n = len(nums).","Compute expected_sum = n * (n + 1) // 2.","Compute actual_sum = sum(nums).","Return expected_sum - actual_sum."]'::jsonb,
$PY$class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        n = len(nums)
        return n * (n + 1) // 2 - sum(nums)
$PY$,
$JS$var missingNumber = function(nums) {
    const n = nums.length;
    const expectedSum = n * (n + 1) / 2;
    const actualSum = nums.reduce((a, b) => a + b, 0);
    return expectedSum - actualSum;
};
$JS$,
$JAVA$class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length;
        int expectedSum = n * (n + 1) / 2;
        int actualSum = 0;
        for (int num : nums) actualSum += num;
        return expectedSum - actualSum;
    }
}
$JAVA$,
'O(n)', 'O(1)'),

-- ============ pascals-triangle ============
('pascals-triangle', 1, 'Iterative Row Construction',
'Each row of Pascal''s triangle can be built from the previous one. The first and last elements are always 1, and every inner element is the sum of the two elements directly above it. We build row by row starting from [1].',
'["Initialize result with the first row [[1]].","For each row i from 1 to numRows-1: create a new row starting with 1.","For each inner position j from 1 to i-1: new_row[j] = prev_row[j-1] + prev_row[j].","Append 1 at the end of the new row.","Add the new row to result and continue.","Return result."]'::jsonb,
$PY$class Solution:
    def generate(self, numRows: int) -> List[List[int]]:
        result = [[1]]
        for i in range(1, numRows):
            prev = result[-1]
            row = [1]
            for j in range(1, i):
                row.append(prev[j - 1] + prev[j])
            row.append(1)
            result.append(row)
        return result
$PY$,
$JS$var generate = function(numRows) {
    const result = [[1]];
    for (let i = 1; i < numRows; i++) {
        const prev = result[i - 1];
        const row = [1];
        for (let j = 1; j < i; j++) {
            row.push(prev[j - 1] + prev[j]);
        }
        row.push(1);
        result.push(row);
    }
    return result;
};
$JS$,
$JAVA$class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> result = new ArrayList<>();
        result.add(List.of(1));
        for (int i = 1; i < numRows; i++) {
            List<Integer> prev = result.get(i - 1);
            List<Integer> row = new ArrayList<>();
            row.add(1);
            for (int j = 1; j < i; j++) {
                row.add(prev.get(j - 1) + prev.get(j));
            }
            row.add(1);
            result.add(row);
        }
        return result;
    }
}
$JAVA$,
'O(numRows^2)', 'O(1) extra (output is O(numRows^2))'),

-- ============ valid-palindrome-ii ============
('valid-palindrome-ii', 1, 'Two Pointers with One Skip',
'Use two pointers from both ends. If characters match, move inward. On a mismatch, we get one chance: try skipping the left character or the right character and check if the remaining substring is a palindrome. If either works, the answer is true.',
'["Define a helper isPalin(s, lo, hi) that checks if s[lo..hi] is a palindrome.","Set lo = 0, hi = len(s) - 1.","While lo < hi: if s[lo] == s[hi], move both pointers inward.","On mismatch, return isPalin(s, lo+1, hi) or isPalin(s, lo, hi-1).","If the loop completes without mismatch, return true."]'::jsonb,
$PY$class Solution:
    def validPalindrome(self, s: str) -> bool:
        def is_palin(lo: int, hi: int) -> bool:
            while lo < hi:
                if s[lo] != s[hi]:
                    return False
                lo += 1
                hi -= 1
            return True

        lo, hi = 0, len(s) - 1
        while lo < hi:
            if s[lo] != s[hi]:
                return is_palin(lo + 1, hi) or is_palin(lo, hi - 1)
            lo += 1
            hi -= 1
        return True
$PY$,
$JS$var validPalindrome = function(s) {
    function isPalin(lo, hi) {
        while (lo < hi) {
            if (s[lo] !== s[hi]) return false;
            lo++;
            hi--;
        }
        return true;
    }

    let lo = 0, hi = s.length - 1;
    while (lo < hi) {
        if (s[lo] !== s[hi]) {
            return isPalin(lo + 1, hi) || isPalin(lo, hi - 1);
        }
        lo++;
        hi--;
    }
    return true;
};
$JS$,
$JAVA$class Solution {
    public boolean validPalindrome(String s) {
        int lo = 0, hi = s.length() - 1;
        while (lo < hi) {
            if (s.charAt(lo) != s.charAt(hi)) {
                return isPalin(s, lo + 1, hi) || isPalin(s, lo, hi - 1);
            }
            lo++;
            hi--;
        }
        return true;
    }

    private boolean isPalin(String s, int lo, int hi) {
        while (lo < hi) {
            if (s.charAt(lo) != s.charAt(hi)) return false;
            lo++;
            hi--;
        }
        return true;
    }
}
$JAVA$,
'O(n)', 'O(1)');

COMMIT;
