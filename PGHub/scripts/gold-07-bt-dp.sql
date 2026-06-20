-- Gold upgrade: backtracking (4) + dp (6) + 2d-dp (3)
BEGIN;

-- ============== backtracking ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code> of <strong>unique</strong> elements, return all possible <strong>subsets</strong> (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,2,3]
Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0]
Output: [[],[0]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 10</code></li>
  <li><code>-10 &lt;= nums[i] &lt;= 10</code></li>
</ul>
$$,
  hints = ARRAY[
    'Backtracking: at each index decide to either include nums[i] or skip it, then recurse on i + 1.',
    'When i reaches len(nums), append a copy of the current path to the answer.',
    'Iterative variant: start with [[]] and for each new num, append num to every existing subset to produce new subsets.'
  ]
WHERE id = 'subsets';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array of <strong>distinct</strong> integers <code>candidates</code> and a <code>target</code> integer, return a list of all unique combinations of <code>candidates</code> where the chosen numbers sum to <code>target</code>. The same number may be chosen from <code>candidates</code> an unlimited number of times.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= candidates.length &lt;= 30</code></li>
  <li><code>2 &lt;= candidates[i] &lt;= 40</code></li>
</ul>
$$,
  hints = ARRAY[
    'Backtracking: track current path and remaining target. Recursive call branches on either "use candidates[i] again" or "advance to i + 1".',
    'Base case: remaining == 0 → record a copy of the path.',
    'Pruning: if remaining < 0, return immediately. Sorting candidates lets you break early once candidates[i] > remaining.'
  ]
WHERE id = 'combination-sum';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an array <code>nums</code> of <strong>distinct</strong> integers, return all the possible <strong>permutations</strong>. You can return the answer in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0,1]
Output: [[0,1],[1,0]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 6</code></li>
  <li>All values are unique.</li>
</ul>
$$,
  hints = ARRAY[
    'Backtracking with a "used" boolean array. At each level pick any unused element to extend the path.',
    'When path length equals len(nums), append a copy of path to results.',
    'Alternative: swap-in-place — for each i in [start, len), swap nums[start] with nums[i], recurse on start+1, swap back.'
  ]
WHERE id = 'permutations';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an <code>m x n</code> grid of characters <code>board</code> and a string <code>word</code>, return <code>true</code> if <code>word</code> exists in the grid. The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>m == board.length</code>, <code>n == board[i].length</code></li>
  <li><code>1 &lt;= m, n &lt;= 6</code></li>
</ul>
$$,
  hints = ARRAY[
    'DFS from every cell. Maintain an index into word; at each step the cell must equal word[index].',
    'Mark visited cells with a sentinel character before recursing into the 4 neighbors, then restore on backtrack.',
    'Return true the moment index == len(word). Otherwise return false after the DFS exhausts.'
  ]
WHERE id = 'word-search';

-- ============== dp ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are climbing a staircase with <code>n</code> steps. Each time you can climb either <code>1</code> or <code>2</code> steps. In how many distinct ways can you climb to the top?</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  n = 2
Output: 2
Explanation: 1+1 or 2.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  n = 3
Output: 3
Explanation: 1+1+1, 1+2, 2+1.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= n &lt;= 45</code></li>
</ul>
$$,
  hints = ARRAY[
    'Recurrence: ways(n) = ways(n-1) + ways(n-2). It''s the Fibonacci sequence in disguise.',
    'Bottom-up: track only the previous two values, no need for an array. O(n) time, O(1) space.',
    'Closed form: F(n+1) using Binet''s formula, but the iterative version is just as fast for n <= 45.'
  ]
WHERE id = 'climbing-stairs';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed; the only constraint is that adjacent houses have a connected security system, so you cannot rob two adjacent houses. Given an integer array <code>nums</code> representing the amount in each house, return the maximum amount you can rob without alerting the police.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,2,3,1]
Output: 4
Explanation: Rob houses 1 and 3 → 1 + 3 = 4.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [2,7,9,3,1]
Output: 12
Explanation: Rob houses 1, 3, and 5 → 2 + 9 + 1 = 12.</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 100</code></li>
  <li><code>0 &lt;= nums[i] &lt;= 400</code></li>
</ul>
$$,
  hints = ARRAY[
    'At each house i, choose: rob this one (nums[i] + best up to i-2) OR skip it (best up to i-1).',
    'dp[i] = max(dp[i-1], nums[i] + dp[i-2]). Two rolling variables suffice.',
    'O(n) time, O(1) space — a textbook one-dimensional DP.'
  ]
WHERE id = 'house-robber';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount cannot be made up by any combination of the coins, return <code>-1</code>. You may assume that you have an infinite number of each kind of coin.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  coins = [2], amount = 3
Output: -1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= coins.length &lt;= 12</code></li>
  <li><code>0 &lt;= amount &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'Bottom-up DP: dp[a] = min coins to make amount a. dp[0] = 0; everything else starts at infinity.',
    'For each amount a from 1 to amount, dp[a] = min over coins c of (dp[a - c] + 1) when a - c >= 0.',
    'If dp[amount] is still infinity, return -1. O(amount * len(coins)) time.'
  ]
WHERE id = 'coin-change';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given an integer array <code>nums</code>, return the length of the longest <strong>strictly increasing</strong> subsequence.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: The LIS is [2,3,7,101].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [0,1,0,3,2,3]
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 2500</code></li>
  <li><code>-10<sup>4</sup> &lt;= nums[i] &lt;= 10<sup>4</sup></code></li>
</ul>
$$,
  hints = ARRAY[
    'O(n^2) DP: dp[i] = length of LIS that ENDS at i. dp[i] = 1 + max(dp[j]) for all j < i where nums[j] < nums[i].',
    'Answer is max(dp). Easy to write, easy to explain in interviews.',
    'O(n log n): maintain a "tails" array where tails[k] = the smallest possible tail of an increasing subsequence of length k+1. Use binary search to update.'
  ]
WHERE id = 'longest-increasing-subseq';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given a string <code>s</code> and a dictionary of strings <code>wordDict</code>, return <code>true</code> if <code>s</code> can be segmented into a space-separated sequence of one or more dictionary words. The same word in the dictionary may be reused multiple times.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  s = "leetcode", wordDict = ["leet","code"]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  s = "applepenapple", wordDict = ["apple","pen"]
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= s.length &lt;= 300</code></li>
  <li><code>1 &lt;= wordDict.length &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'dp[i] = true iff s[0:i] can be segmented. dp[0] = true (empty string).',
    'For each i, scan j from 0 to i; dp[i] = true if dp[j] is true AND s[j:i] is in the dictionary set.',
    'Convert wordDict to a set up front for O(1) lookups. Total time O(n^2 * average word length).'
  ]
WHERE id = 'word-break';

UPDATE public."PGcode_problems" SET
  description = $$
<p>There is a robot on an <code>m x n</code> grid. The robot is initially located at the top-left corner. The robot tries to move to the bottom-right corner. The robot can only move either down or right at any point in time. Given the two integers <code>m</code> and <code>n</code>, return the number of possible unique paths.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  m = 3, n = 7
Output: 28</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  m = 3, n = 2
Output: 3</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= m, n &lt;= 100</code></li>
</ul>
$$,
  hints = ARRAY[
    'dp[i][j] = paths to reach cell (i,j) = dp[i-1][j] + dp[i][j-1]. The first row and column are all 1.',
    'Space optimization: only the previous row is needed, so a 1D array of length n suffices.',
    'Closed form: C(m+n-2, m-1) — pure combinatorics.'
  ]
WHERE id = 'unique-paths';

-- ============== 2d-dp ==============

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>text1</code> and <code>text2</code>, return the length of their <strong>longest common subsequence</strong>. If there is no common subsequence, return <code>0</code>. A subsequence keeps the relative order of characters but may skip any number of them.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  text1 = "abcde", text2 = "ace"
Output: 3
Explanation: The LCS is "ace" with length 3.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  text1 = "abc", text2 = "abc"
Output: 3</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= text1.length, text2.length &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'dp[i][j] = LCS length of text1[:i] and text2[:j]. The 0th row and column are all 0.',
    'If text1[i-1] == text2[j-1], dp[i][j] = dp[i-1][j-1] + 1.',
    'Otherwise dp[i][j] = max(dp[i-1][j], dp[i][j-1]). Answer is dp[m][n].'
  ]
WHERE id = 'longest-common-subseq';

UPDATE public."PGcode_problems" SET
  description = $$
<p>Given two strings <code>word1</code> and <code>word2</code>, return the minimum number of operations required to convert <code>word1</code> to <code>word2</code>. The allowed operations are: insert a character, delete a character, or replace a character.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  word1 = "horse", word2 = "ros"
Output: 3
Explanation: horse → rorse (replace h) → rose (delete r) → ros (delete e).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  word1 = "intention", word2 = "execution"
Output: 5</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>0 &lt;= word1.length, word2.length &lt;= 500</code></li>
</ul>
$$,
  hints = ARRAY[
    'Levenshtein DP: dp[i][j] = edit distance between word1[:i] and word2[:j]. Base: dp[i][0]=i and dp[0][j]=j.',
    'If chars match: dp[i][j] = dp[i-1][j-1].',
    'Else dp[i][j] = 1 + min(insert dp[i][j-1], delete dp[i-1][j], replace dp[i-1][j-1]).'
  ]
WHERE id = 'edit-distance';

UPDATE public."PGcode_problems" SET
  description = $$
<p>You are given an integer array <code>nums</code> and an integer <code>target</code>. You want to build an expression by adding either <code>+</code> or <code>-</code> in front of every integer in <code>nums</code> and concatenating them. Return the number of different expressions whose value equals <code>target</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input:  nums = [1,1,1,1,1], target = 3
Output: 5
Explanation: There are 5 ways to assign signs that yield 3.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input:  nums = [1], target = 1
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
  <li><code>1 &lt;= nums.length &lt;= 20</code></li>
  <li><code>0 &lt;= sum(nums) &lt;= 1000</code></li>
</ul>
$$,
  hints = ARRAY[
    'Memoized DFS over (index, current_sum). Return 1 if index == n and current_sum == target.',
    'Reframe: assigning signs is the same as partitioning nums into two subsets P and N where sum(P) - sum(N) = target. Then sum(P) = (target + total) / 2, which is a 0/1 subset-sum DP.',
    'Subset-sum DP: dp[s] = number of subsets that sum to s. Initialize dp[0] = 1, then for each num iterate s downward. Answer = dp[(target + total) / 2].'
  ]
WHERE id = 'target-sum';

COMMIT;

SELECT topic_id, COUNT(*) FILTER (WHERE position('Example' in description) > 0) AS gold_count, COUNT(*) AS total
FROM public."PGcode_problems"
WHERE topic_id IN ('backtracking','dp','2d-dp')
GROUP BY topic_id ORDER BY topic_id;
