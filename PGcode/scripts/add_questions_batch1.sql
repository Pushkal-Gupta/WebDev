-- Add 14 new gold-bar problems: queue(4) + recursion(4) + geometry(2) + tries(2) + 2d-dp(2)
-- Idempotent: deletes prior rows first.
BEGIN;

DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'implement-queue-stacks','number-of-recent-calls','moving-average','sliding-window-maximum',
  'pow-x-n','fibonacci-number','power-of-two','sum-of-digits',
  'rectangle-overlap','valid-square',
  'longest-word-in-dict','replace-words',
  'unique-paths-ii','minimum-path-sum'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'implement-queue-stacks','number-of-recent-calls','moving-average','sliding-window-maximum',
  'pow-x-n','fibonacci-number','power-of-two','sum-of-digits',
  'rectangle-overlap','valid-square',
  'longest-word-in-dict','replace-words',
  'unique-paths-ii','minimum-path-sum'
);

INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url)
VALUES

-- ============ QUEUE ============

('implement-queue-stacks', 'queue', 'Implement Queue using Stacks', 'Easy', $$
<p>Implement a first in first out (FIFO) <code>queue</code> using only two stacks. The implemented queue should support all the functions of a normal queue: <code>push</code>, <code>peek</code>, <code>pop</code>, and <code>empty</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  ["MyQueue","push","push","peek","pop","empty"]
        [[],[1],[2],[],[],[]]
Output: [null,null,null,1,1,false]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  ["MyQueue","empty"]
        [[]]
Output: [null,true]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= x &lt;= 9</code></li>
  <li>At most 100 calls will be made.</li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Keep two stacks: an input stack for push and an output stack for pop/peek.',
  'When pop or peek is called and output is empty, drain input into output — this reverses the order so the oldest element ends up on top.',
  'Amortized O(1) per operation even though a single pop might be O(n) worst case, because each element is moved at most twice.'
],
'200', 'https://leetcode.com/problems/implement-queue-using-stacks/'),

('number-of-recent-calls', 'queue', 'Number of Recent Calls', 'Easy', $$
<p>You have a <code>RecentCounter</code> class that counts the number of recent requests within a certain time frame. Implement the <code>ping(t)</code> method that records a request at time <code>t</code> (in milliseconds), and returns the number of requests that have happened in the past <code>3000</code> milliseconds (inclusive of <code>t</code>).</p>
<p>It is guaranteed that every call to <code>ping</code> uses a <code>t</code> value strictly larger than the previous call.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  ["RecentCounter","ping","ping","ping","ping"]
        [[],[1],[100],[3001],[3002]]
Output: [null,1,2,3,3]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  ["RecentCounter","ping"]
        [[],[100]]
Output: [null,1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= t &lt;= 10<sup>9</sup></code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Maintain a FIFO queue of timestamps received so far.',
  'On each ping, append the new timestamp to the back and then pop from the front while the front timestamp is older than t - 3000.',
  'Return the queue size. Amortized O(1) per call because each timestamp is pushed and popped exactly once.'
],
'200', 'https://leetcode.com/problems/number-of-recent-calls/'),

('moving-average', 'queue', 'Moving Average from Data Stream', 'Easy', $$
<p>Given a stream of integers and a window size, calculate the moving average of all integers in the sliding window. Implement the <code>MovingAverage</code> class with a single method <code>next(val)</code> that returns the moving average of the last <code>size</code> values including <code>val</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  ["MovingAverage","next","next","next","next"]
        [[3],[1],[10],[3],[5]]
Output: [null,1.0,5.5,4.66667,6.0]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  ["MovingAverage","next"]
        [[1],[5]]
Output: [null,5.0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= size &lt;= 1000</code></li>
  <li><code>-10<sup>5</sup> &lt;= val &lt;= 10<sup>5</sup></code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Use a fixed-size queue that holds at most the last "size" values.',
  'Maintain a running sum: add the new value to the sum, push it into the queue, and if the queue exceeds "size" pop the front and subtract it from the sum.',
  'Return sum / len(queue). O(1) per call.'
],
'200', 'https://leetcode.com/problems/moving-average-from-data-stream/'),

('sliding-window-maximum', 'queue', 'Sliding Window Maximum', 'Hard', $$
<p>You are given an array of integers <code>nums</code>, there is a sliding window of size <code>k</code> which is moving from the very left of the array to the very right. You can only see the <code>k</code> numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [1], k = 1
Output: [1]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>
  <li><code>1 &lt;= k &lt;= nums.length</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Monotonic deque of INDICES. The front always holds the index of the current window''s maximum.',
  'Before pushing i, pop from the back while nums[back] <= nums[i] — those can never be a future max.',
  'Before reading the front, pop it if its index has fallen out of the window (front <= i - k). Amortized O(1) per element.'
],
'200', 'https://leetcode.com/problems/sliding-window-maximum/'),

-- ============ RECURSION ============

('pow-x-n', 'recursion', 'Pow(x, n)', 'Medium', $$
<p>Implement <code>pow(x, n)</code>, which calculates <code>x</code> raised to the power <code>n</code> (i.e., <code>x<sup>n</sup></code>).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  x = 2.00000, n = 10
Output: 1024.00000</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  x = 2.10000, n = 3
Output: 9.26100</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>-100.0 &lt; x &lt; 100.0</code></li>
  <li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Fast exponentiation: x^n = (x^(n/2))^2 when n is even, and x * x^(n-1) when n is odd.',
  'Handle negative n by computing 1 / pow(x, -n). Be careful with n = INT_MIN which can overflow when negated — convert to long first.',
  'O(log n) time — far better than n naive multiplications.'
],
'200', 'https://leetcode.com/problems/powx-n/'),

('fibonacci-number', 'recursion', 'Fibonacci Number', 'Easy', $$
<p>The Fibonacci numbers, commonly denoted <code>F(n)</code>, form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1. That is, <code>F(0) = 0</code>, <code>F(1) = 1</code>, and <code>F(n) = F(n-1) + F(n-2)</code> for <code>n &gt; 1</code>. Given <code>n</code>, calculate <code>F(n)</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 2
Output: 1
Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= n &lt;= 30</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Naive recursion F(n) = F(n-1) + F(n-2) is exponential because of repeated subproblems.',
  'Memoize with a dict or DP array to bring it to O(n).',
  'Iterative bottom-up with just two rolling variables gives O(n) time and O(1) space.'
],
'200', 'https://leetcode.com/problems/fibonacci-number/'),

('power-of-two', 'recursion', 'Power of Two', 'Easy', $$
<p>Given an integer <code>n</code>, return <code>true</code> if it is a power of two. Otherwise, return <code>false</code>. An integer <code>n</code> is a power of two if there exists an integer <code>x</code> such that <code>n == 2<sup>x</sup></code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 1
Output: true
Explanation: 2^0 = 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 16
Output: true
Explanation: 2^4 = 16.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Recursive: base cases n <= 0 → false and n == 1 → true. Otherwise recurse on n / 2 if n is even.',
  'Bit trick: a power of two has exactly one set bit, so n > 0 and n & (n - 1) == 0.',
  'Both approaches run in O(log n) or O(1) respectively.'
],
'200', 'https://leetcode.com/problems/power-of-two/'),

('sum-of-digits', 'recursion', 'Sum of Digits of Integer', 'Easy', $$
<p>Given a non-negative integer <code>n</code>, return the sum of its digits. Solve the problem recursively.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 38
Output: 11
Explanation: 3 + 8 = 11.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 0
Output: 0</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= n &lt;= 10<sup>9</sup></code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Base case: n < 10 → return n.',
  'Recursive case: sumDigits(n) = (n % 10) + sumDigits(n / 10).',
  'O(log n) recursive calls — one per digit.'
],
'200', 'https://leetcode.com/problems/sum-of-digits-of-string-after-convert/'),

-- ============ GEOMETRY ============

('rectangle-overlap', 'geometry', 'Rectangle Overlap', 'Easy', $$
<p>An axis-aligned rectangle is represented as a list <code>[x1, y1, x2, y2]</code>, where <code>(x1, y1)</code> is the coordinate of its bottom-left corner, and <code>(x2, y2)</code> is the coordinate of its top-right corner. Two rectangles overlap if the area of their intersection is <strong>positive</strong>. To be clear, two rectangles that only touch at the corner or edges do not overlap.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  rec1 = [0,0,2,2], rec2 = [1,1,3,3]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  rec1 = [0,0,1,1], rec2 = [1,0,2,1]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li>Both rectangles are valid (<code>x1 &lt; x2</code> and <code>y1 &lt; y2</code>).</li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Two rectangles overlap iff their projections on BOTH the x-axis and the y-axis overlap with positive length.',
  'On the x-axis: max(rec1.x1, rec2.x1) < min(rec1.x2, rec2.x2). Same idea on y.',
  'Negate the non-overlap conditions: rec1 is entirely left/right/above/below rec2. Either formulation works.'
],
'200', 'https://leetcode.com/problems/rectangle-overlap/'),

('valid-square', 'geometry', 'Valid Square', 'Medium', $$
<p>Given the coordinates of four points in 2D space <code>p1, p2, p3, p4</code>, return <code>true</code> if the four points construct a square. The coordinate of a point is represented as an integer array with two integers. A valid square has four equal sides with positive length and four equal angles (90-degree angles).</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  p1 = [0,0], p2 = [1,1], p3 = [1,0], p4 = [0,1]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  p1 = [0,0], p2 = [1,1], p3 = [1,0], p4 = [0,12]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>p1.length == p2.length == p3.length == p4.length == 2</code></li>
  <li><code>-10<sup>4</sup> &lt;= xi, yi &lt;= 10<sup>4</sup></code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Compute all 6 squared distances between pairs of the 4 points.',
  'A square has exactly 2 distinct squared distances: the side length (appearing 4 times) and the diagonal (appearing 2 times).',
  'Also verify the non-zero side length to reject the degenerate case where all four points coincide.'
],
'200', 'https://leetcode.com/problems/valid-square/'),

-- ============ TRIES TOP-UP ============

('longest-word-in-dict', 'tries', 'Longest Word in Dictionary', 'Medium', $$
<p>Given an array of strings <code>words</code> representing an English Dictionary, return the longest word in <code>words</code> that can be built one character at a time by other words in <code>words</code>. If there is more than one possible answer, return the longest word with the smallest lexicographical order. If there is no answer, return the empty string.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  words = ["w","wo","wor","worl","world"]
Output: "world"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  words = ["a","banana","app","appl","ap","apply","apple"]
Output: "apple"</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= words.length &lt;= 1000</code></li>
  <li><code>1 &lt;= words[i].length &lt;= 30</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Insert every word into a trie, marking end-of-word nodes.',
  'DFS the trie; only descend into children whose end-of-word flag is set (meaning every prefix is also a word).',
  'Track the longest valid string seen so far, breaking lex ties by ignoring any candidate that is not strictly longer than the current best.'
],
'200', 'https://leetcode.com/problems/longest-word-in-dictionary/'),

('replace-words', 'tries', 'Replace Words', 'Medium', $$
<p>In English, we have a concept called <strong>root</strong>, which can be followed by some other word to form another longer word — let''s call this word a <strong>successor</strong>. Given a <code>dictionary</code> of many roots and a <code>sentence</code> consisting of words separated by spaces, replace all the successors in the sentence with the root forming it. If a successor can be replaced by more than one root, replace it with the root that has the shortest length.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"
Output: "the cat was rat by the bat"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  dictionary = ["a","b","c"], sentence = "aadsfasf absbs bbab cadsfafs"
Output: "a a b c"</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= dictionary.length &lt;= 1000</code></li>
  <li><code>1 &lt;= sentence.length &lt;= 10<sup>6</sup></code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Build a trie from the dictionary roots.',
  'For each word in the sentence, walk the trie character by character and stop as soon as you hit an end-of-word node — the prefix so far is the shortest root.',
  'If you walk past the end of the word without hitting a root, keep the original word. Join with spaces.'
],
'200', 'https://leetcode.com/problems/replace-words/'),

-- ============ 2D-DP TOP-UP ============

('unique-paths-ii', '2d-dp', 'Unique Paths II', 'Medium', $$
<p>You are given an <code>m x n</code> integer array <code>obstacleGrid</code>. There is a robot initially located at the top-left corner which can only move down or right. The robot tries to reach the bottom-right corner. An obstacle and space are marked as <code>1</code> or <code>0</code> respectively in <code>obstacleGrid</code>. A path that the robot takes cannot include any square that is an obstacle.</p>
<p>Return the number of possible unique paths that the robot can take to reach the bottom-right corner.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]
Output: 2</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  obstacleGrid = [[0,1],[0,0]]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == obstacleGrid.length</code></li>
  <li><code>1 &lt;= m, n &lt;= 100</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'Classic 2D DP: dp[i][j] = paths to reach (i,j) = dp[i-1][j] + dp[i][j-1].',
  'If obstacleGrid[i][j] == 1, force dp[i][j] = 0 — no path goes through an obstacle.',
  'Space-optimize to a 1D array of length n since each row only depends on the previous row and the cell to the left.'
],
'200', 'https://leetcode.com/problems/unique-paths-ii/'),

('minimum-path-sum', '2d-dp', 'Minimum Path Sum', 'Medium', $$
<p>Given an <code>m x n</code> grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path. You can only move either down or right at any point in time.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  grid = [[1,3,1],[1,5,1],[4,2,1]]
Output: 7
Explanation: 1 → 3 → 1 → 1 → 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  grid = [[1,2,3],[4,5,6]]
Output: 12</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == grid.length</code>, <code>n == grid[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 200</code></li>
</ul>
$$, '3OamzN90kPg',
ARRAY[
  'dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). First row uses only left, first column uses only above.',
  'You can safely overwrite the input grid in place — no extra space needed.',
  'Answer is dp[m-1][n-1].'
],
'200', 'https://leetcode.com/problems/minimum-path-sum/');

-- ========================================================
-- Signatures + test cases
-- ========================================================

UPDATE public."PGcode_problems" SET
  method_name='MyQueue', params='[{"name":"operations","type":"List[List]"}]'::jsonb, return_type='List',
  test_cases='[
    {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"peek\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,null,1,1,false]"},
    {"inputs":["[[\"MyQueue\"],[\"empty\"]]"],"expected":"[null,true]"},
    {"inputs":["[[\"MyQueue\"],[\"push\",5],[\"empty\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,false,5,true]"},
    {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"push\",2],[\"push\",3],[\"pop\"],[\"peek\"]]"],"expected":"[null,null,null,null,1,2]"},
    {"inputs":["[[\"MyQueue\"],[\"push\",9],[\"peek\"],[\"pop\"],[\"empty\"]]"],"expected":"[null,null,9,9,true]"},
    {"inputs":["[[\"MyQueue\"],[\"push\",1],[\"pop\"],[\"push\",2],[\"peek\"]]"],"expected":"[null,null,1,null,2]"}
  ]'::jsonb
WHERE id='implement-queue-stacks';

UPDATE public."PGcode_problems" SET
  method_name='RecentCounter', params='[{"name":"operations","type":"List[List]"}]'::jsonb, return_type='List',
  test_cases='[
    {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",100],[\"ping\",3001],[\"ping\",3002]]"],"expected":"[null,1,2,3,3]"},
    {"inputs":["[[\"RecentCounter\"],[\"ping\",100]]"],"expected":"[null,1]"},
    {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",2],[\"ping\",3],[\"ping\",4000]]"],"expected":"[null,1,2,3,2]"},
    {"inputs":["[[\"RecentCounter\"],[\"ping\",642],[\"ping\",1849],[\"ping\",4921],[\"ping\",5936]]"],"expected":"[null,1,2,2,3]"},
    {"inputs":["[[\"RecentCounter\"],[\"ping\",0]]"],"expected":"[null,1]"},
    {"inputs":["[[\"RecentCounter\"],[\"ping\",1],[\"ping\",3001],[\"ping\",6002]]"],"expected":"[null,1,2,2]"}
  ]'::jsonb
WHERE id='number-of-recent-calls';

UPDATE public."PGcode_problems" SET
  method_name='MovingAverage', params='[{"name":"operations","type":"List[List]"}]'::jsonb, return_type='List',
  test_cases='[
    {"inputs":["[[\"MovingAverage\",3],[\"next\",1],[\"next\",10],[\"next\",3],[\"next\",5]]"],"expected":"[null,1.0,5.5,4.66667,6.0]"},
    {"inputs":["[[\"MovingAverage\",1],[\"next\",5]]"],"expected":"[null,5.0]"},
    {"inputs":["[[\"MovingAverage\",2],[\"next\",1],[\"next\",2],[\"next\",3]]"],"expected":"[null,1.0,1.5,2.5]"},
    {"inputs":["[[\"MovingAverage\",5],[\"next\",10],[\"next\",20]]"],"expected":"[null,10.0,15.0]"},
    {"inputs":["[[\"MovingAverage\",3],[\"next\",0],[\"next\",0],[\"next\",0]]"],"expected":"[null,0.0,0.0,0.0]"},
    {"inputs":["[[\"MovingAverage\",4],[\"next\",1],[\"next\",2],[\"next\",3],[\"next\",4],[\"next\",5]]"],"expected":"[null,1.0,1.5,2.0,2.5,3.5]"}
  ]'::jsonb
WHERE id='moving-average';

UPDATE public."PGcode_problems" SET
  method_name='maxSlidingWindow', params='[{"name":"nums","type":"List[int]"},{"name":"k","type":"int"}]'::jsonb, return_type='List[int]',
  test_cases='[
    {"inputs":["[1,3,-1,-3,5,3,6,7]","3"],"expected":"[3,3,5,5,6,7]"},
    {"inputs":["[1]","1"],"expected":"[1]"},
    {"inputs":["[1,-1]","1"],"expected":"[1,-1]"},
    {"inputs":["[9,11]","2"],"expected":"[11]"},
    {"inputs":["[4,-2]","2"],"expected":"[4]"},
    {"inputs":["[7,2,4]","2"],"expected":"[7,4]"},
    {"inputs":["[1,3,1,2,0,5]","3"],"expected":"[3,3,2,5]"}
  ]'::jsonb
WHERE id='sliding-window-maximum';

UPDATE public."PGcode_problems" SET
  method_name='myPow', params='[{"name":"x","type":"float"},{"name":"n","type":"int"}]'::jsonb, return_type='float',
  test_cases='[
    {"inputs":["2.00000","10"],"expected":"1024.00000"},
    {"inputs":["2.10000","3"],"expected":"9.26100"},
    {"inputs":["2.00000","-2"],"expected":"0.25000"},
    {"inputs":["1.00000","2147483647"],"expected":"1.00000"},
    {"inputs":["0.00001","2147483647"],"expected":"0.00000"},
    {"inputs":["3.00000","5"],"expected":"243.00000"},
    {"inputs":["2.00000","0"],"expected":"1.00000"}
  ]'::jsonb
WHERE id='pow-x-n';

UPDATE public."PGcode_problems" SET
  method_name='fib', params='[{"name":"n","type":"int"}]'::jsonb, return_type='int',
  test_cases='[
    {"inputs":["2"],"expected":"1"},
    {"inputs":["3"],"expected":"2"},
    {"inputs":["4"],"expected":"3"},
    {"inputs":["0"],"expected":"0"},
    {"inputs":["1"],"expected":"1"},
    {"inputs":["10"],"expected":"55"},
    {"inputs":["20"],"expected":"6765"}
  ]'::jsonb
WHERE id='fibonacci-number';

UPDATE public."PGcode_problems" SET
  method_name='isPowerOfTwo', params='[{"name":"n","type":"int"}]'::jsonb, return_type='bool',
  test_cases='[
    {"inputs":["1"],"expected":"true"},
    {"inputs":["16"],"expected":"true"},
    {"inputs":["3"],"expected":"false"},
    {"inputs":["0"],"expected":"false"},
    {"inputs":["-16"],"expected":"false"},
    {"inputs":["1024"],"expected":"true"},
    {"inputs":["1023"],"expected":"false"}
  ]'::jsonb
WHERE id='power-of-two';

UPDATE public."PGcode_problems" SET
  method_name='sumOfDigits', params='[{"name":"n","type":"int"}]'::jsonb, return_type='int',
  test_cases='[
    {"inputs":["38"],"expected":"11"},
    {"inputs":["0"],"expected":"0"},
    {"inputs":["9"],"expected":"9"},
    {"inputs":["100"],"expected":"1"},
    {"inputs":["999"],"expected":"27"},
    {"inputs":["123456"],"expected":"21"}
  ]'::jsonb
WHERE id='sum-of-digits';

UPDATE public."PGcode_problems" SET
  method_name='isRectangleOverlap', params='[{"name":"rec1","type":"List[int]"},{"name":"rec2","type":"List[int]"}]'::jsonb, return_type='bool',
  test_cases='[
    {"inputs":["[0,0,2,2]","[1,1,3,3]"],"expected":"true"},
    {"inputs":["[0,0,1,1]","[1,0,2,1]"],"expected":"false"},
    {"inputs":["[0,0,1,1]","[2,2,3,3]"],"expected":"false"},
    {"inputs":["[7,8,13,15]","[10,8,12,20]"],"expected":"true"},
    {"inputs":["[-5,-5,5,5]","[-1,-1,1,1]"],"expected":"true"},
    {"inputs":["[0,0,3,3]","[3,0,6,3]"],"expected":"false"}
  ]'::jsonb
WHERE id='rectangle-overlap';

UPDATE public."PGcode_problems" SET
  method_name='validSquare', params='[{"name":"p1","type":"List[int]"},{"name":"p2","type":"List[int]"},{"name":"p3","type":"List[int]"},{"name":"p4","type":"List[int]"}]'::jsonb, return_type='bool',
  test_cases='[
    {"inputs":["[0,0]","[1,1]","[1,0]","[0,1]"],"expected":"true"},
    {"inputs":["[0,0]","[1,1]","[1,0]","[0,12]"],"expected":"false"},
    {"inputs":["[1,0]","[-1,0]","[0,1]","[0,-1]"],"expected":"true"},
    {"inputs":["[0,0]","[0,0]","[0,0]","[0,0]"],"expected":"false"},
    {"inputs":["[0,0]","[2,0]","[2,2]","[0,2]"],"expected":"true"},
    {"inputs":["[0,0]","[1,1]","[0,1]","[1,0]"],"expected":"true"}
  ]'::jsonb
WHERE id='valid-square';

UPDATE public."PGcode_problems" SET
  method_name='longestWord', params='[{"name":"words","type":"List[str]"}]'::jsonb, return_type='str',
  test_cases='[
    {"inputs":["[\"w\",\"wo\",\"wor\",\"worl\",\"world\"]"],"expected":"\"world\""},
    {"inputs":["[\"a\",\"banana\",\"app\",\"appl\",\"ap\",\"apply\",\"apple\"]"],"expected":"\"apple\""},
    {"inputs":["[\"a\"]"],"expected":"\"a\""},
    {"inputs":["[\"yo\",\"ew\",\"fc\",\"zrc\",\"yodn\",\"fcm\",\"qm\"]"],"expected":"\"\""},
    {"inputs":["[\"m\",\"mo\",\"moc\",\"moch\",\"mocha\",\"l\",\"la\",\"lat\",\"latt\",\"latte\"]"],"expected":"\"latte\""},
    {"inputs":["[\"k\",\"ka\",\"kat\"]"],"expected":"\"kat\""}
  ]'::jsonb
WHERE id='longest-word-in-dict';

UPDATE public."PGcode_problems" SET
  method_name='replaceWords', params='[{"name":"dictionary","type":"List[str]"},{"name":"sentence","type":"str"}]'::jsonb, return_type='str',
  test_cases='[
    {"inputs":["[\"cat\",\"bat\",\"rat\"]","\"the cattle was rattled by the battery\""],"expected":"\"the cat was rat by the bat\""},
    {"inputs":["[\"a\",\"b\",\"c\"]","\"aadsfasf absbs bbab cadsfafs\""],"expected":"\"a a b c\""},
    {"inputs":["[\"catt\",\"cat\",\"bat\",\"rat\"]","\"the cattle was rattled by the battery\""],"expected":"\"the cat was rat by the bat\""},
    {"inputs":["[]","\"hello world\""],"expected":"\"hello world\""},
    {"inputs":["[\"ab\"]","\"abc abd\""],"expected":"\"ab ab\""},
    {"inputs":["[\"xyz\"]","\"hello world\""],"expected":"\"hello world\""}
  ]'::jsonb
WHERE id='replace-words';

UPDATE public."PGcode_problems" SET
  method_name='uniquePathsWithObstacles', params='[{"name":"obstacleGrid","type":"List[List[int]]"}]'::jsonb, return_type='int',
  test_cases='[
    {"inputs":["[[0,0,0],[0,1,0],[0,0,0]]"],"expected":"2"},
    {"inputs":["[[0,1],[0,0]]"],"expected":"1"},
    {"inputs":["[[1]]"],"expected":"0"},
    {"inputs":["[[0]]"],"expected":"1"},
    {"inputs":["[[0,0],[1,1],[0,0]]"],"expected":"0"},
    {"inputs":["[[0,0,0,0],[0,0,0,0],[0,0,0,0]]"],"expected":"10"}
  ]'::jsonb
WHERE id='unique-paths-ii';

UPDATE public."PGcode_problems" SET
  method_name='minPathSum', params='[{"name":"grid","type":"List[List[int]]"}]'::jsonb, return_type='int',
  test_cases='[
    {"inputs":["[[1,3,1],[1,5,1],[4,2,1]]"],"expected":"7"},
    {"inputs":["[[1,2,3],[4,5,6]]"],"expected":"12"},
    {"inputs":["[[1]]"],"expected":"1"},
    {"inputs":["[[1,2],[1,1]]"],"expected":"3"},
    {"inputs":["[[5,4,3],[2,1,0],[1,1,1]]"],"expected":"9"},
    {"inputs":["[[0,0,0],[0,0,0],[0,0,0]]"],"expected":"0"}
  ]'::jsonb
WHERE id='minimum-path-sum';


-- ========================================================
-- Starter templates
-- ========================================================
INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES

('implement-queue-stacks','python',$PY$class MyQueue:
    def __init__(self):
        pass

    def push(self, x: int) -> None:
        pass

    def pop(self) -> int:
        pass

    def peek(self) -> int:
        pass

    def empty(self) -> bool:
        pass
$PY$),
('implement-queue-stacks','javascript',$JS$var MyQueue = function() {};
MyQueue.prototype.push = function(x) {};
MyQueue.prototype.pop = function() {};
MyQueue.prototype.peek = function() {};
MyQueue.prototype.empty = function() {};
$JS$),
('implement-queue-stacks','java',$JAVA$class MyQueue {
    public MyQueue() {}
    public void push(int x) {}
    public int pop() { return 0; }
    public int peek() { return 0; }
    public boolean empty() { return true; }
}
$JAVA$),

('number-of-recent-calls','python',$PY$class RecentCounter:
    def __init__(self):
        pass

    def ping(self, t: int) -> int:
        pass
$PY$),
('number-of-recent-calls','javascript',$JS$var RecentCounter = function() {};
RecentCounter.prototype.ping = function(t) {};
$JS$),
('number-of-recent-calls','java',$JAVA$class RecentCounter {
    public RecentCounter() {}
    public int ping(int t) { return 0; }
}
$JAVA$),

('moving-average','python',$PY$class MovingAverage:
    def __init__(self, size: int):
        pass

    def next(self, val: int) -> float:
        pass
$PY$),
('moving-average','javascript',$JS$var MovingAverage = function(size) {};
MovingAverage.prototype.next = function(val) {};
$JS$),
('moving-average','java',$JAVA$class MovingAverage {
    public MovingAverage(int size) {}
    public double next(int val) { return 0.0; }
}
$JAVA$),

('sliding-window-maximum','python',$PY$class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        pass
$PY$),
('sliding-window-maximum','javascript',$JS$var maxSlidingWindow = function(nums, k) {};
$JS$),
('sliding-window-maximum','java',$JAVA$class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) { return new int[0]; }
}
$JAVA$),

('pow-x-n','python',$PY$class Solution:
    def myPow(self, x: float, n: int) -> float:
        pass
$PY$),
('pow-x-n','javascript',$JS$var myPow = function(x, n) {};
$JS$),
('pow-x-n','java',$JAVA$class Solution {
    public double myPow(double x, int n) { return 0.0; }
}
$JAVA$),

('fibonacci-number','python',$PY$class Solution:
    def fib(self, n: int) -> int:
        pass
$PY$),
('fibonacci-number','javascript',$JS$var fib = function(n) {};
$JS$),
('fibonacci-number','java',$JAVA$class Solution {
    public int fib(int n) { return 0; }
}
$JAVA$),

('power-of-two','python',$PY$class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        pass
$PY$),
('power-of-two','javascript',$JS$var isPowerOfTwo = function(n) {};
$JS$),
('power-of-two','java',$JAVA$class Solution {
    public boolean isPowerOfTwo(int n) { return false; }
}
$JAVA$),

('sum-of-digits','python',$PY$class Solution:
    def sumOfDigits(self, n: int) -> int:
        pass
$PY$),
('sum-of-digits','javascript',$JS$var sumOfDigits = function(n) {};
$JS$),
('sum-of-digits','java',$JAVA$class Solution {
    public int sumOfDigits(int n) { return 0; }
}
$JAVA$),

('rectangle-overlap','python',$PY$class Solution:
    def isRectangleOverlap(self, rec1: List[int], rec2: List[int]) -> bool:
        pass
$PY$),
('rectangle-overlap','javascript',$JS$var isRectangleOverlap = function(rec1, rec2) {};
$JS$),
('rectangle-overlap','java',$JAVA$class Solution {
    public boolean isRectangleOverlap(int[] rec1, int[] rec2) { return false; }
}
$JAVA$),

('valid-square','python',$PY$class Solution:
    def validSquare(self, p1: List[int], p2: List[int], p3: List[int], p4: List[int]) -> bool:
        pass
$PY$),
('valid-square','javascript',$JS$var validSquare = function(p1, p2, p3, p4) {};
$JS$),
('valid-square','java',$JAVA$class Solution {
    public boolean validSquare(int[] p1, int[] p2, int[] p3, int[] p4) { return false; }
}
$JAVA$),

('longest-word-in-dict','python',$PY$class Solution:
    def longestWord(self, words: List[str]) -> str:
        pass
$PY$),
('longest-word-in-dict','javascript',$JS$var longestWord = function(words) {};
$JS$),
('longest-word-in-dict','java',$JAVA$class Solution {
    public String longestWord(String[] words) { return ""; }
}
$JAVA$),

('replace-words','python',$PY$class Solution:
    def replaceWords(self, dictionary: List[str], sentence: str) -> str:
        pass
$PY$),
('replace-words','javascript',$JS$var replaceWords = function(dictionary, sentence) {};
$JS$),
('replace-words','java',$JAVA$class Solution {
    public String replaceWords(List<String> dictionary, String sentence) { return ""; }
}
$JAVA$),

('unique-paths-ii','python',$PY$class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:
        pass
$PY$),
('unique-paths-ii','javascript',$JS$var uniquePathsWithObstacles = function(obstacleGrid) {};
$JS$),
('unique-paths-ii','java',$JAVA$class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) { return 0; }
}
$JAVA$),

('minimum-path-sum','python',$PY$class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        pass
$PY$),
('minimum-path-sum','javascript',$JS$var minPathSum = function(grid) {};
$JS$),
('minimum-path-sum','java',$JAVA$class Solution {
    public int minPathSum(int[][] grid) { return 0; }
}
$JAVA$);

COMMIT;

SELECT topic_id, COUNT(*) FROM public."PGcode_problems" GROUP BY topic_id ORDER BY topic_id;
