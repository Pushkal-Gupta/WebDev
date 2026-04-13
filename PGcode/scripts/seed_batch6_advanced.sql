BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'interleaving-string', 'distinct-subsequences', 'burst-balloons',
  'coin-change-2', 'regular-expression-matching',
  'reconstruct-itinerary', 'min-cost-connect-points',
  'course-schedule-ii', 'accounts-merge'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'interleaving-string', 'distinct-subsequences', 'burst-balloons',
  'coin-change-2', 'regular-expression-matching',
  'reconstruct-itinerary', 'min-cost-connect-points',
  'course-schedule-ii', 'accounts-merge'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'interleaving-string', 'distinct-subsequences', 'burst-balloons',
  'coin-change-2', 'regular-expression-matching',
  'reconstruct-itinerary', 'min-cost-connect-points',
  'course-schedule-ii', 'accounts-merge'
);

-- ============================================================
-- 1. interleaving-string (2D-DP, Medium, LeetCode 97)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'interleaving-string', '2d-dp', 'Interleaving String', 'Medium',
  $DESC$<p>Given strings <code>s1</code>, <code>s2</code>, and <code>s3</code>, find whether <code>s3</code> is formed by an <strong>interleaving</strong> of <code>s1</code> and <code>s2</code>.</p>
<p>An <strong>interleaving</strong> of two strings <code>s</code> and <code>t</code> is a configuration where <code>s</code> and <code>t</code> are divided into <code>n</code> and <code>m</code> substrings respectively, such that:</p>
<ul>
<li><code>s = s1 + s2 + ... + sn</code></li>
<li><code>t = t1 + t2 + ... + tm</code></li>
<li><code>|n - m| &lt;= 1</code></li>
<li>The interleaving is <code>s1 + t1 + s2 + t2 + ...</code> or <code>t1 + s1 + t2 + s2 + ...</code></li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
Output: true
Explanation: One way: aa|dbbcb|c|a|c</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
Output: false</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s1 = "", s2 = "", s3 = ""
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= s1.length, s2.length &lt;= 100</code></li>
<li><code>0 &lt;= s3.length &lt;= 200</code></li>
<li><code>s1</code>, <code>s2</code>, and <code>s3</code> consist of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['If len(s1) + len(s2) != len(s3), return false immediately.', 'Use a 2D DP table where dp[i][j] means s1[0..i-1] and s2[0..j-1] can form s3[0..i+j-1].', 'dp[i][j] is true if dp[i-1][j] and s1[i-1]==s3[i+j-1], or dp[i][j-1] and s2[j-1]==s3[i+j-1].'],
  '200', 'https://leetcode.com/problems/interleaving-string/',
  'isInterleave', '[{"name":"s1","type":"str"},{"name":"s2","type":"str"},{"name":"s3","type":"str"}]'::jsonb, 'bool',
  '[{"inputs":["\"aabcc\"","\"dbbca\"","\"aadbbcbcac\""],"expected":"true"},{"inputs":["\"aabcc\"","\"dbbca\"","\"aadbbbaccc\""],"expected":"false"},{"inputs":["\"\"","\"\"","\"\""],"expected":"true"},{"inputs":["\"\"","\"b\"","\"b\""],"expected":"true"},{"inputs":["\"a\"","\"\"","\"a\""],"expected":"true"},{"inputs":["\"a\"","\"b\"","\"ab\""],"expected":"true"},{"inputs":["\"a\"","\"b\"","\"ba\""],"expected":"true"},{"inputs":["\"a\"","\"b\"","\"c\""],"expected":"false"},{"inputs":["\"ab\"","\"cd\"","\"abcd\""],"expected":"true"},{"inputs":["\"ab\"","\"cd\"","\"acbd\""],"expected":"true"},{"inputs":["\"ab\"","\"cd\"","\"acdb\""],"expected":"true"},{"inputs":["\"ab\"","\"cd\"","\"adcb\""],"expected":"false"},{"inputs":["\"abc\"","\"def\"","\"adbcef\""],"expected":"true"},{"inputs":["\"abc\"","\"def\"","\"abcdef\""],"expected":"true"},{"inputs":["\"aab\"","\"aac\"","\"aaabc\""],"expected":"false"},{"inputs":["\"aab\"","\"aac\"","\"aaaabc\""],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'interleaving-string', 1, '2D Dynamic Programming',
  'We build a 2D DP table where dp[i][j] indicates whether s3[0..i+j-1] can be formed by interleaving s1[0..i-1] and s2[0..j-1]. At each cell, we check if the current character of s3 matches either the next character from s1 or s2.',
  '["If len(s1) + len(s2) != len(s3), return false.","Create dp table of size (len(s1)+1) x (len(s2)+1), initialize dp[0][0] = true.","Fill the first row: dp[0][j] = dp[0][j-1] and s2[j-1] == s3[j-1].","Fill the first column: dp[i][0] = dp[i-1][0] and s1[i-1] == s3[i-1].","For each cell dp[i][j]: set true if (dp[i-1][j] and s1[i-1]==s3[i+j-1]) or (dp[i][j-1] and s2[j-1]==s3[i+j-1]).","Return dp[len(s1)][len(s2)]."]'::jsonb,
  $PY$class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        m, n = len(s1), len(s2)
        if m + n != len(s3):
            return False
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[0][0] = True
        for i in range(1, m + 1):
            dp[i][0] = dp[i - 1][0] and s1[i - 1] == s3[i - 1]
        for j in range(1, n + 1):
            dp[0][j] = dp[0][j - 1] and s2[j - 1] == s3[j - 1]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                dp[i][j] = (dp[i - 1][j] and s1[i - 1] == s3[i + j - 1]) or \
                            (dp[i][j - 1] and s2[j - 1] == s3[i + j - 1])
        return dp[m][n]$PY$,
  $JS$var isInterleave = function(s1, s2, s3) {
    const m = s1.length, n = s2.length;
    if (m + n !== s3.length) return false;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(false));
    dp[0][0] = true;
    for (let i = 1; i <= m; i++) {
        dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
    }
    for (let j = 1; j <= n; j++) {
        dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) ||
                        (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]);
        }
    }
    return dp[m][n];
};$JS$,
  $JAVA$class Solution {
    public boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int i = 1; i <= m; i++) {
            dp[i][0] = dp[i - 1][0] && s1.charAt(i - 1) == s3.charAt(i - 1);
        }
        for (int j = 1; j <= n; j++) {
            dp[0][j] = dp[0][j - 1] && s2.charAt(j - 1) == s3.charAt(j - 1);
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = (dp[i - 1][j] && s1.charAt(i - 1) == s3.charAt(i + j - 1)) ||
                            (dp[i][j - 1] && s2.charAt(j - 1) == s3.charAt(i + j - 1));
            }
        }
        return dp[m][n];
    }
}$JAVA$,
  'O(m * n)', 'O(m * n)'
);

-- ============================================================
-- 2. distinct-subsequences (2D-DP, Hard, LeetCode 115)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'distinct-subsequences', '2d-dp', 'Distinct Subsequences', 'Hard',
  $DESC$<p>Given two strings <code>s</code> and <code>t</code>, return the <strong>number of distinct subsequences</strong> of <code>s</code> which equals <code>t</code>.</p>
<p>The test cases are generated so that the answer fits on a 32-bit signed integer.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "rabbbit", t = "rabbit"
Output: 3
Explanation:
There are 3 ways you can generate "rabbit" from s (by choosing different 'b's).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "babgbag", t = "bag"
Output: 5
Explanation:
There are 5 ways you can generate "bag" from s.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length, t.length &lt;= 1000</code></li>
<li><code>s</code> and <code>t</code> consist of English letters.</li>
</ul>$DESC$,
  '', ARRAY['Think of dp[i][j] as the number of ways to form t[0..j-1] from s[0..i-1].', 'If s[i-1] == t[j-1], we can either use this character or skip it.', 'dp[i][j] = dp[i-1][j-1] + dp[i-1][j] if characters match, else dp[i][j] = dp[i-1][j].'],
  '200', 'https://leetcode.com/problems/distinct-subsequences/',
  'numDistinct', '[{"name":"s","type":"str"},{"name":"t","type":"str"}]'::jsonb, 'int',
  '[{"inputs":["\"rabbbit\"","\"rabbit\""],"expected":"3"},{"inputs":["\"babgbag\"","\"bag\""],"expected":"5"},{"inputs":["\"a\"","\"a\""],"expected":"1"},{"inputs":["\"a\"","\"b\""],"expected":"0"},{"inputs":["\"aa\"","\"a\""],"expected":"2"},{"inputs":["\"aaa\"","\"a\""],"expected":"3"},{"inputs":["\"aaa\"","\"aa\""],"expected":"3"},{"inputs":["\"aab\"","\"ab\""],"expected":"2"},{"inputs":["\"abc\"","\"abc\""],"expected":"1"},{"inputs":["\"abc\"","\"abcd\""],"expected":"0"},{"inputs":["\"\"","\"a\""],"expected":"0"},{"inputs":["\"abcde\"","\"ace\""],"expected":"1"},{"inputs":["\"aabb\"","\"ab\""],"expected":"4"},{"inputs":["\"aaaa\"","\"aa\""],"expected":"6"},{"inputs":["\"xxyy\"","\"xy\""],"expected":"4"},{"inputs":["\"abab\"","\"ab\""],"expected":"3"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'distinct-subsequences', 1, '2D Dynamic Programming',
  'We define dp[i][j] as the number of distinct subsequences of s[0..i-1] that equal t[0..j-1]. When characters match, we can include or exclude the current character from s. When they do not match, we must skip the current character from s.',
  '["Create dp table of size (len(s)+1) x (len(t)+1).","Initialize dp[i][0] = 1 for all i (empty t is a subsequence of any prefix of s).","For each i from 1 to len(s) and j from 1 to len(t): if s[i-1] == t[j-1], dp[i][j] = dp[i-1][j-1] + dp[i-1][j]; else dp[i][j] = dp[i-1][j].","Return dp[len(s)][len(t)]."]'::jsonb,
  $PY$class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        m, n = len(s), len(t)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = 1
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                dp[i][j] = dp[i - 1][j]
                if s[i - 1] == t[j - 1]:
                    dp[i][j] += dp[i - 1][j - 1]
        return dp[m][n]$PY$,
  $JS$var numDistinct = function(s, t) {
    const m = s.length, n = t.length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = 1;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j];
            if (s[i - 1] === t[j - 1]) {
                dp[i][j] += dp[i - 1][j - 1];
            }
        }
    }
    return dp[m][n];
};$JS$,
  $JAVA$class Solution {
    public int numDistinct(String s, String t) {
        int m = s.length(), n = t.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = 1;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                dp[i][j] = dp[i - 1][j];
                if (s.charAt(i - 1) == t.charAt(j - 1)) {
                    dp[i][j] += dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
}$JAVA$,
  'O(m * n)', 'O(m * n)'
);

-- ============================================================
-- 3. burst-balloons (2D-DP, Hard, LeetCode 312)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'burst-balloons', '2d-dp', 'Burst Balloons', 'Hard',
  $DESC$<p>You are given <code>n</code> balloons, indexed from <code>0</code> to <code>n - 1</code>. Each balloon is painted with a number on it represented by an array <code>nums</code>. You are asked to burst all the balloons.</p>
<p>If you burst the <code>i<sup>th</sup></code> balloon, you will get <code>nums[i - 1] * nums[i] * nums[i + 1]</code> coins. If <code>i - 1</code> or <code>i + 1</code> goes out of bounds, treat it as if there is a balloon with a <code>1</code> painted on it.</p>
<p>Return the <strong>maximum</strong> coins you can collect by bursting the balloons wisely.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,1,5,8]
Output: 167
Explanation:
nums = [3,1,5,8] --> [3,5,8] --> [3,8] --> [8] --> []
coins =  3*1*5    +   3*5*8   +  1*3*8  + 1*8*1 = 15+120+24+8 = 167</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1,5]
Output: 10</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>n == nums.length</code></li>
<li><code>1 &lt;= n &lt;= 300</code></li>
<li><code>0 &lt;= nums[i] &lt;= 100</code></li>
</ul>$DESC$,
  '', ARRAY['Think about which balloon to burst last in a range, not first.', 'Add virtual balloons with value 1 at both ends.', 'dp[i][j] = max coins from bursting all balloons between i and j (exclusive). Try each k in (i,j) as the last balloon to burst.'],
  '200', 'https://leetcode.com/problems/burst-balloons/',
  'maxCoins', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[3,1,5,8]"],"expected":"167"},{"inputs":["[1,5]"],"expected":"10"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[5]"],"expected":"5"},{"inputs":["[3,1,5]"],"expected":"35"},{"inputs":["[1,2,3]"],"expected":"12"},{"inputs":["[1,1,1]"],"expected":"3"},{"inputs":["[2,3]"],"expected":"9"},{"inputs":["[9,76,64,21]"],"expected":"116718"},{"inputs":["[7,9,8,0,7,1,3,5,5,2]"],"expected":"1582"},{"inputs":["[0,0,0]"],"expected":"0"},{"inputs":["[1,2]"],"expected":"4"},{"inputs":["[2,4,8]"],"expected":"88"},{"inputs":["[10]"],"expected":"10"},{"inputs":["[5,10]"],"expected":"60"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'burst-balloons', 1, 'Interval DP',
  'Instead of thinking about which balloon to burst first, we think about which balloon to burst last in each interval. We pad the array with 1s at both ends and define dp[i][j] as the max coins obtainable by bursting all balloons strictly between indices i and j.',
  '["Pad nums with 1 at both ends: arr = [1] + nums + [1].","Create dp table of size len(arr) x len(arr), initialized to 0.","For each window length from 2 to len(arr)-1, for each left boundary i, compute right boundary j = i + length.","For each k in range (i+1, j), dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + arr[i]*arr[k]*arr[j]).","Return dp[0][len(arr)-1]."]'::jsonb,
  $PY$class Solution:
    def maxCoins(self, nums: list[int]) -> int:
        arr = [1] + nums + [1]
        n = len(arr)
        dp = [[0] * n for _ in range(n)]
        for length in range(2, n):
            for i in range(n - length):
                j = i + length
                for k in range(i + 1, j):
                    dp[i][j] = max(dp[i][j], dp[i][k] + dp[k][j] + arr[i] * arr[k] * arr[j])
        return dp[0][n - 1]$PY$,
  $JS$var maxCoins = function(nums) {
    const arr = [1, ...nums, 1];
    const n = arr.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(0));
    for (let length = 2; length < n; length++) {
        for (let i = 0; i < n - length; i++) {
            const j = i + length;
            for (let k = i + 1; k < j; k++) {
                dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + arr[i] * arr[k] * arr[j]);
            }
        }
    }
    return dp[0][n - 1];
};$JS$,
  $JAVA$class Solution {
    public int maxCoins(int[] nums) {
        int[] arr = new int[nums.length + 2];
        arr[0] = 1;
        arr[arr.length - 1] = 1;
        for (int i = 0; i < nums.length; i++) arr[i + 1] = nums[i];
        int n = arr.length;
        int[][] dp = new int[n][n];
        for (int length = 2; length < n; length++) {
            for (int i = 0; i < n - length; i++) {
                int j = i + length;
                for (int k = i + 1; k < j; k++) {
                    dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + arr[i] * arr[k] * arr[j]);
                }
            }
        }
        return dp[0][n - 1];
    }
}$JAVA$,
  'O(n^3)', 'O(n^2)'
);

-- ============================================================
-- 4. coin-change-2 (2D-DP, Medium, LeetCode 518)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'coin-change-2', '2d-dp', 'Coin Change II', 'Medium',
  $DESC$<p>You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money.</p>
<p>Return the <strong>number of combinations</strong> that make up that amount. If that amount of money cannot be made up by any combination of the coins, return <code>0</code>.</p>
<p>You may assume that you have an infinite number of each kind of coin.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: amount = 5, coins = [1,2,5]
Output: 4
Explanation: there are four ways to make up the amount:
5=5
5=2+2+1
5=2+1+1+1
5=1+1+1+1+1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: amount = 3, coins = [2]
Output: 0
Explanation: the amount of 3 cannot be made up just with coins of 2.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: amount = 10, coins = [10]
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= coins.length &lt;= 300</code></li>
<li><code>1 &lt;= coins[i] &lt;= 5000</code></li>
<li><code>0 &lt;= amount &lt;= 5000</code></li>
</ul>$DESC$,
  '', ARRAY['This is an unbounded knapsack problem — order does not matter, only combinations.', 'Use dp[j] = number of ways to make amount j. Iterate coins in outer loop to avoid counting permutations.', 'For each coin, update dp[j] += dp[j - coin] for j from coin to amount.'],
  '200', 'https://leetcode.com/problems/coin-change-ii/',
  'change', '[{"name":"amount","type":"int"},{"name":"coins","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["5","[1,2,5]"],"expected":"4"},{"inputs":["3","[2]"],"expected":"0"},{"inputs":["10","[10]"],"expected":"1"},{"inputs":["0","[1,2,5]"],"expected":"1"},{"inputs":["1","[1]"],"expected":"1"},{"inputs":["2","[1]"],"expected":"1"},{"inputs":["5","[1,2]"],"expected":"3"},{"inputs":["5","[5]"],"expected":"1"},{"inputs":["5","[1]"],"expected":"1"},{"inputs":["3","[1,2]"],"expected":"2"},{"inputs":["4","[1,2,3]"],"expected":"4"},{"inputs":["7","[2,3,5]"],"expected":"2"},{"inputs":["100","[1,5,10,25]"],"expected":"242"},{"inputs":["6","[1,2,3]"],"expected":"7"},{"inputs":["10","[1,2,5]"],"expected":"10"},{"inputs":["10","[2,5]"],"expected":"2"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'coin-change-2', 1, 'Dynamic Programming (Unbounded Knapsack)',
  'We use a 1D DP array where dp[j] stores the number of combinations to make amount j. By iterating over coins in the outer loop and amounts in the inner loop, we ensure each combination is counted only once (avoiding permutations).',
  '["Create dp array of size amount+1, initialize dp[0] = 1 (one way to make amount 0).","For each coin in coins, for each j from coin to amount: dp[j] += dp[j - coin].","Return dp[amount]."]'::jsonb,
  $PY$class Solution:
    def change(self, amount: int, coins: list[int]) -> int:
        dp = [0] * (amount + 1)
        dp[0] = 1
        for coin in coins:
            for j in range(coin, amount + 1):
                dp[j] += dp[j - coin]
        return dp[amount]$PY$,
  $JS$var change = function(amount, coins) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    for (const coin of coins) {
        for (let j = coin; j <= amount; j++) {
            dp[j] += dp[j - coin];
        }
    }
    return dp[amount];
};$JS$,
  $JAVA$class Solution {
    public int change(int amount, int[] coins) {
        int[] dp = new int[amount + 1];
        dp[0] = 1;
        for (int coin : coins) {
            for (int j = coin; j <= amount; j++) {
                dp[j] += dp[j - coin];
            }
        }
        return dp[amount];
    }
}$JAVA$,
  'O(n * amount)', 'O(amount)'
);

-- ============================================================
-- 5. regular-expression-matching (2D-DP, Hard, LeetCode 10)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'regular-expression-matching', '2d-dp', 'Regular Expression Matching', 'Hard',
  $DESC$<p>Given an input string <code>s</code> and a pattern <code>p</code>, implement regular expression matching with support for <code>'.'</code> and <code>'*'</code> where:</p>
<ul>
<li><code>'.'</code> Matches any single character.</li>
<li><code>'*'</code> Matches zero or more of the preceding element.</li>
</ul>
<p>The matching should cover the <strong>entire</strong> input string (not partial).</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "aa", p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "aa", p = "a*"
Output: true
Explanation: '*' means zero or more of the preceding element, 'a'. Therefore, by repeating 'a' once, it becomes "aa".</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s = "ab", p = ".*"
Output: true
Explanation: ".*" means zero or more (*) of any character (.).</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 20</code></li>
<li><code>1 &lt;= p.length &lt;= 20</code></li>
<li><code>s</code> contains only lowercase English letters.</li>
<li><code>p</code> contains only lowercase English letters, <code>'.'</code>, and <code>'*'</code>.</li>
<li>It is guaranteed for each appearance of the character <code>'*'</code>, there will be a previous valid character to match.</li>
</ul>$DESC$,
  '', ARRAY['Use a 2D DP where dp[i][j] means s[0..i-1] matches p[0..j-1].', 'When p[j-1] is ''*'', either use zero occurrences (dp[i][j-2]) or one+ occurrences if the character matches.', 'The ''.'' character matches any single character.'],
  '200', 'https://leetcode.com/problems/regular-expression-matching/',
  'isMatch', '[{"name":"s","type":"str"},{"name":"p","type":"str"}]'::jsonb, 'bool',
  '[{"inputs":["\"aa\"","\"a\""],"expected":"false"},{"inputs":["\"aa\"","\"a*\""],"expected":"true"},{"inputs":["\"ab\"","\".*\""],"expected":"true"},{"inputs":["\"aab\"","\"c*a*b\""],"expected":"true"},{"inputs":["\"mississippi\"","\"mis*is*p*.\""],"expected":"false"},{"inputs":["\"a\"","\"a\""],"expected":"true"},{"inputs":["\"a\"","\"b\""],"expected":"false"},{"inputs":["\"a\"","\".\""],"expected":"true"},{"inputs":["\"a\"","\".*\""],"expected":"true"},{"inputs":["\"\"","\"a*\""],"expected":"true"},{"inputs":["\"\"","\"a*b*c*\""],"expected":"true"},{"inputs":["\"abc\"","\"a.c\""],"expected":"true"},{"inputs":["\"abc\"","\"a.d\""],"expected":"false"},{"inputs":["\"aaa\"","\"a*a\""],"expected":"true"},{"inputs":["\"aaa\"","\"ab*a*c*a\""],"expected":"true"},{"inputs":["\"ab\"","\".*c\""],"expected":"false"},{"inputs":["\"a\"","\"ab*\""],"expected":"true"},{"inputs":["\"bbbba\"","\".*a*a\""],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'regular-expression-matching', 1, '2D Dynamic Programming',
  'We build a DP table where dp[i][j] represents whether s[0..i-1] matches p[0..j-1]. The key insight is handling ''*'': it can match zero occurrences of the preceding character (look at dp[i][j-2]) or one or more occurrences if the preceding character matches s[i-1].',
  '["Create dp table of size (len(s)+1) x (len(p)+1), set dp[0][0] = true.","Initialize first row: dp[0][j] = true if p[j-1] is ''*'' and dp[0][j-2] is true (patterns like a*, a*b*, etc. can match empty string).","For each cell dp[i][j]: if p[j-1] == s[i-1] or p[j-1] == ''.'', then dp[i][j] = dp[i-1][j-1].","If p[j-1] == ''*'': dp[i][j] = dp[i][j-2] (zero occurrences) OR (dp[i-1][j] if p[j-2] matches s[i-1]).","Return dp[len(s)][len(p)]."]'::jsonb,
  $PY$class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        m, n = len(s), len(p)
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[0][0] = True
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                dp[0][j] = dp[0][j - 2]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if p[j - 1] == s[i - 1] or p[j - 1] == '.':
                    dp[i][j] = dp[i - 1][j - 1]
                elif p[j - 1] == '*':
                    dp[i][j] = dp[i][j - 2]
                    if p[j - 2] == s[i - 1] or p[j - 2] == '.':
                        dp[i][j] = dp[i][j] or dp[i - 1][j]
        return dp[m][n]$PY$,
  $JS$var isMatch = function(s, p) {
    const m = s.length, n = p.length;
    const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(false));
    dp[0][0] = true;
    for (let j = 1; j <= n; j++) {
        if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (p[j - 1] === s[i - 1] || p[j - 1] === '.') {
                dp[i][j] = dp[i - 1][j - 1];
            } else if (p[j - 1] === '*') {
                dp[i][j] = dp[i][j - 2];
                if (p[j - 2] === s[i - 1] || p[j - 2] === '.') {
                    dp[i][j] = dp[i][j] || dp[i - 1][j];
                }
            }
        }
    }
    return dp[m][n];
};$JS$,
  $JAVA$class Solution {
    public boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 1; j <= n; j++) {
            if (p.charAt(j - 1) == '*') dp[0][j] = dp[0][j - 2];
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p.charAt(j - 1) == s.charAt(i - 1) || p.charAt(j - 1) == '.') {
                    dp[i][j] = dp[i - 1][j - 1];
                } else if (p.charAt(j - 1) == '*') {
                    dp[i][j] = dp[i][j - 2];
                    if (p.charAt(j - 2) == s.charAt(i - 1) || p.charAt(j - 2) == '.') {
                        dp[i][j] = dp[i][j] || dp[i - 1][j];
                    }
                }
            }
        }
        return dp[m][n];
    }
}$JAVA$,
  'O(m * n)', 'O(m * n)'
);

-- ============================================================
-- 6. reconstruct-itinerary (Advanced Graphs, Hard, LeetCode 332)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'reconstruct-itinerary', 'advanced-graphs', 'Reconstruct Itinerary', 'Hard',
  $DESC$<p>You are given a list of airline <code>tickets</code> where <code>tickets[i] = [from<sub>i</sub>, to<sub>i</sub>]</code> represent the departure and the arrival airports of one flight. Reconstruct the itinerary in order and return it.</p>
<p>All of the tickets belong to a man who departs from <code>"JFK"</code>, thus, the itinerary must begin with <code>"JFK"</code>. If there are multiple valid itineraries, you should return the itinerary that has the <strong>smallest lexical order</strong> when read as a single string.</p>
<p>You may assume all tickets form at least one valid itinerary. You must use all the tickets once and only once.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]
Output: ["JFK","MUC","LHR","SFO","SJC"]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]
Output: ["JFK","ATL","JFK","SFO","ATL","SFO"]
Explanation: Another possible reconstruction is ["JFK","SFO","ATL","JFK","ATL","SFO"] but it is larger in lexical order.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= tickets.length &lt;= 300</code></li>
<li><code>tickets[i].length == 2</code></li>
<li><code>from<sub>i</sub>.length == 3</code></li>
<li><code>to<sub>i</sub>.length == 3</code></li>
<li><code>from<sub>i</sub></code> and <code>to<sub>i</sub></code> consist of uppercase English letters.</li>
<li><code>from<sub>i</sub> != to<sub>i</sub></code></li>
</ul>$DESC$,
  '', ARRAY['Use Hierholzer''s algorithm to find an Eulerian path.', 'Sort adjacency lists in reverse order so you can pop the smallest destination.', 'Build the result in reverse by appending airports after all their edges are visited.'],
  '200', 'https://leetcode.com/problems/reconstruct-itinerary/',
  'findItinerary', '[{"name":"tickets","type":"List[List[str]]"}]'::jsonb, 'List[str]',
  '[{"inputs":["[[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]"],"expected":"[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]"},{"inputs":["[[\"JFK\",\"SFO\"],[\"JFK\",\"ATL\"],[\"SFO\",\"ATL\"],[\"ATL\",\"JFK\"],[\"ATL\",\"SFO\"]]"],"expected":"[\"JFK\",\"ATL\",\"JFK\",\"SFO\",\"ATL\",\"SFO\"]"},{"inputs":["[[\"JFK\",\"A\"],[\"A\",\"JFK\"],[\"JFK\",\"B\"]]"],"expected":"[\"JFK\",\"A\",\"JFK\",\"B\"]"},{"inputs":["[[\"JFK\",\"B\"],[\"JFK\",\"A\"],[\"A\",\"JFK\"]]"],"expected":"[\"JFK\",\"A\",\"JFK\",\"B\"]"},{"inputs":["[[\"JFK\",\"AAA\"]]"],"expected":"[\"JFK\",\"AAA\"]"},{"inputs":["[[\"JFK\",\"BBB\"],[\"BBB\",\"JFK\"],[\"JFK\",\"AAA\"]]"],"expected":"[\"JFK\",\"BBB\",\"JFK\",\"AAA\"]"},{"inputs":["[[\"JFK\",\"AAA\"],[\"AAA\",\"BBB\"],[\"BBB\",\"JFK\"],[\"JFK\",\"CCC\"]]"],"expected":"[\"JFK\",\"AAA\",\"BBB\",\"JFK\",\"CCC\"]"},{"inputs":["[[\"JFK\",\"A\"],[\"A\",\"B\"],[\"B\",\"JFK\"],[\"JFK\",\"C\"],[\"C\",\"A\"],[\"A\",\"D\"]]"],"expected":"[\"JFK\",\"A\",\"B\",\"JFK\",\"C\",\"A\",\"D\"]"},{"inputs":["[[\"JFK\",\"SFO\"],[\"SFO\",\"JFK\"]]"],"expected":"[\"JFK\",\"SFO\",\"JFK\"]"},{"inputs":["[[\"JFK\",\"A\"],[\"A\",\"B\"],[\"B\",\"A\"],[\"A\",\"C\"]]"],"expected":"[\"JFK\",\"A\",\"B\",\"A\",\"C\"]"},{"inputs":["[[\"JFK\",\"C\"],[\"C\",\"JFK\"],[\"JFK\",\"B\"],[\"B\",\"JFK\"],[\"JFK\",\"A\"]]"],"expected":"[\"JFK\",\"B\",\"JFK\",\"C\",\"JFK\",\"A\"]"},{"inputs":["[[\"JFK\",\"A\"],[\"A\",\"B\"]]"],"expected":"[\"JFK\",\"A\",\"B\"]"},{"inputs":["[[\"JFK\",\"Z\"],[\"Z\",\"A\"],[\"A\",\"JFK\"],[\"JFK\",\"M\"]]"],"expected":"[\"JFK\",\"Z\",\"A\",\"JFK\",\"M\"]"},{"inputs":["[[\"JFK\",\"A\"],[\"A\",\"B\"],[\"B\",\"C\"],[\"C\",\"A\"],[\"A\",\"D\"]]"],"expected":"[\"JFK\",\"A\",\"B\",\"C\",\"A\",\"D\"]"},{"inputs":["[[\"JFK\",\"D\"],[\"JFK\",\"A\"],[\"A\",\"JFK\"]]"],"expected":"[\"JFK\",\"A\",\"JFK\",\"D\"]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'reconstruct-itinerary', 1, 'Hierholzer''s Algorithm (Eulerian Path)',
  'We treat the tickets as a directed graph and find an Eulerian path starting from JFK. By sorting destinations in reverse and using a stack-based DFS that appends to the result only when all outgoing edges are exhausted, we get the lexically smallest valid itinerary.',
  '["Build an adjacency list from tickets. Sort each destination list in reverse order.","Use a stack initialized with \"JFK\".","While the stack is not empty: peek at the top. If it has remaining destinations, push the next (popped from sorted list). Otherwise, pop it and add to the result.","Reverse the result to get the correct order."]'::jsonb,
  $PY$from collections import defaultdict

class Solution:
    def findItinerary(self, tickets: list[list[str]]) -> list[str]:
        graph = defaultdict(list)
        for src, dst in sorted(tickets, reverse=True):
            graph[src].append(dst)
        stack = ["JFK"]
        result = []
        while stack:
            while graph[stack[-1]]:
                stack.append(graph[stack[-1]].pop())
            result.append(stack.pop())
        return result[::-1]$PY$,
  $JS$var findItinerary = function(tickets) {
    const graph = {};
    tickets.sort((a, b) => a[1] < b[1] ? 1 : -1);
    for (const [src, dst] of tickets) {
        if (!graph[src]) graph[src] = [];
        graph[src].push(dst);
    }
    const stack = ["JFK"];
    const result = [];
    while (stack.length > 0) {
        while (graph[stack[stack.length - 1]] && graph[stack[stack.length - 1]].length > 0) {
            stack.push(graph[stack[stack.length - 1]].pop());
        }
        result.push(stack.pop());
    }
    return result.reverse();
};$JS$,
  $JAVA$import java.util.*;

class Solution {
    public List<String> findItinerary(List<List<String>> tickets) {
        Map<String, PriorityQueue<String>> graph = new HashMap<>();
        for (List<String> ticket : tickets) {
            graph.computeIfAbsent(ticket.get(0), k -> new PriorityQueue<>()).add(ticket.get(1));
        }
        LinkedList<String> result = new LinkedList<>();
        Deque<String> stack = new ArrayDeque<>();
        stack.push("JFK");
        while (!stack.isEmpty()) {
            while (graph.containsKey(stack.peek()) && !graph.get(stack.peek()).isEmpty()) {
                stack.push(graph.get(stack.peek()).poll());
            }
            result.addFirst(stack.pop());
        }
        return result;
    }
}$JAVA$,
  'O(E log E)', 'O(E)'
);

-- ============================================================
-- 7. min-cost-connect-points (Advanced Graphs, Medium, LeetCode 1584)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'min-cost-connect-points', 'advanced-graphs', 'Min Cost to Connect All Points', 'Medium',
  $DESC$<p>You are given an array <code>points</code> representing integer coordinates of some points on a 2D-plane, where <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code>.</p>
<p>The cost of connecting two points <code>[x<sub>i</sub>, y<sub>i</sub>]</code> and <code>[x<sub>j</sub>, y<sub>j</sub>]</code> is the <strong>manhattan distance</strong> between them: <code>|x<sub>i</sub> - x<sub>j</sub>| + |y<sub>i</sub> - y<sub>j</sub>|</code>.</p>
<p>Return the <strong>minimum cost</strong> to make all points connected. All points are connected if there is exactly one simple path between any two points.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: points = [[0,0],[2,2],[3,10],[5,2],[7,0]]
Output: 20
Explanation: We can connect the points as shown to get the minimum cost of 20.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: points = [[3,12],[-2,5],[-4,1]]
Output: 18</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= points.length &lt;= 1000</code></li>
<li><code>-10<sup>6</sup> &lt;= x<sub>i</sub>, y<sub>i</sub> &lt;= 10<sup>6</sup></code></li>
<li>All pairs <code>(x<sub>i</sub>, y<sub>i</sub>)</code> are distinct.</li>
</ul>$DESC$,
  '', ARRAY['This is a Minimum Spanning Tree problem.', 'Use Prim''s algorithm with a min-heap starting from any point.', 'Manhattan distance between two points is |x1-x2| + |y1-y2|.'],
  '200', 'https://leetcode.com/problems/min-cost-to-connect-all-points/',
  'minCostConnectPoints', '[{"name":"points","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["[[0,0],[2,2],[3,10],[5,2],[7,0]]"],"expected":"20"},{"inputs":["[[3,12],[-2,5],[-4,1]]"],"expected":"18"},{"inputs":["[[0,0]]"],"expected":"0"},{"inputs":["[[0,0],[1,1]]"],"expected":"2"},{"inputs":["[[0,0],[1,0],[2,0]]"],"expected":"2"},{"inputs":["[[0,0],[0,1],[1,0],[1,1]]"],"expected":"3"},{"inputs":["[[-1,0],[0,0],[1,0]]"],"expected":"2"},{"inputs":["[[0,0],[10,10]]"],"expected":"20"},{"inputs":["[[0,0],[3,0],[0,4]]"],"expected":"7"},{"inputs":["[[1,1],[2,2],[3,3],[4,4]]"],"expected":"6"},{"inputs":["[[0,0],[5,0],[0,5],[5,5]]"],"expected":"15"},{"inputs":["[[-5,-5],[5,5]]"],"expected":"20"},{"inputs":["[[0,0],[1,1],[1,0],[0,1]]"],"expected":"3"},{"inputs":["[[2,3],[5,7],[1,1]]"],"expected":"10"},{"inputs":["[[0,0],[100,0],[0,100],[100,100]]"],"expected":"300"},{"inputs":["[[0,0],[2,0],[4,0],[6,0],[8,0]]"],"expected":"8"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'min-cost-connect-points', 1, 'Prim''s Algorithm',
  'We treat each point as a node in a complete graph where edge weights are Manhattan distances. Using Prim''s algorithm with a min-heap, we greedily add the cheapest edge that connects an unvisited point to the growing MST.',
  '["Start from point 0. Add (0, 0) to min-heap (cost, index).","While the MST has fewer than n nodes: pop the minimum cost edge. If the point is already visited, skip.","Mark the point as visited, add its cost to the total.","For each unvisited point, compute Manhattan distance and push to heap.","Return total cost."]'::jsonb,
  $PY$import heapq

class Solution:
    def minCostConnectPoints(self, points: list[list[int]]) -> int:
        n = len(points)
        visited = set()
        heap = [(0, 0)]
        total = 0
        while len(visited) < n:
            cost, i = heapq.heappop(heap)
            if i in visited:
                continue
            visited.add(i)
            total += cost
            for j in range(n):
                if j not in visited:
                    dist = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1])
                    heapq.heappush(heap, (dist, j))
        return total$PY$,
  $JS$var minCostConnectPoints = function(points) {
    const n = points.length;
    const visited = new Set();
    // Simple min-heap using array
    const heap = [[0, 0]]; // [cost, index]
    let total = 0;
    const dist = (i, j) => Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
    while (visited.size < n) {
        heap.sort((a, b) => a[0] - b[0]);
        const [cost, i] = heap.shift();
        if (visited.has(i)) continue;
        visited.add(i);
        total += cost;
        for (let j = 0; j < n; j++) {
            if (!visited.has(j)) {
                heap.push([dist(i, j), j]);
            }
        }
    }
    return total;
};$JS$,
  $JAVA$import java.util.*;

class Solution {
    public int minCostConnectPoints(int[][] points) {
        int n = points.length;
        boolean[] visited = new boolean[n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        heap.offer(new int[]{0, 0});
        int total = 0, count = 0;
        while (count < n) {
            int[] curr = heap.poll();
            int cost = curr[0], i = curr[1];
            if (visited[i]) continue;
            visited[i] = true;
            total += cost;
            count++;
            for (int j = 0; j < n; j++) {
                if (!visited[j]) {
                    int dist = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
                    heap.offer(new int[]{dist, j});
                }
            }
        }
        return total;
    }
}$JAVA$,
  'O(n^2 log n)', 'O(n^2)'
);

-- ============================================================
-- 8. course-schedule-ii (Advanced Graphs, Medium, LeetCode 210)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'course-schedule-ii', 'advanced-graphs', 'Course Schedule II', 'Medium',
  $DESC$<p>There are a total of <code>numCourses</code> courses you have to take, labeled from <code>0</code> to <code>numCourses - 1</code>. You are given an array <code>prerequisites</code> where <code>prerequisites[i] = [a<sub>i</sub>, b<sub>i</sub>]</code> indicates that you <strong>must</strong> take course <code>b<sub>i</sub></code> first if you want to take course <code>a<sub>i</sub></code>.</p>
<p>Return the ordering of courses you should take to finish all courses. If there are many valid answers, return <strong>any of them</strong>. If it is impossible to finish all courses, return <strong>an empty array</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: numCourses = 2, prerequisites = [[1,0]]
Output: [0,1]
Explanation: There are 2 courses. To take course 1 you should have finished course 0. So the correct order is [0,1].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
Output: [0,1,2,3] or [0,2,1,3]
Explanation: There are 4 courses. To take course 3 you should have finished both courses 1 and 2.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: numCourses = 1, prerequisites = []
Output: [0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= numCourses &lt;= 2000</code></li>
<li><code>0 &lt;= prerequisites.length &lt;= numCourses * (numCourses - 1)</code></li>
<li><code>prerequisites[i].length == 2</code></li>
<li><code>0 &lt;= a<sub>i</sub>, b<sub>i</sub> &lt; numCourses</code></li>
<li><code>a<sub>i</sub> != b<sub>i</sub></code></li>
<li>All the pairs <code>[a<sub>i</sub>, b<sub>i</sub>]</code> are <strong>distinct</strong>.</li>
</ul>$DESC$,
  '', ARRAY['Use topological sort (Kahn''s algorithm) with BFS.', 'Track in-degree for each course. Start with courses that have in-degree 0.', 'If the result has fewer courses than numCourses, there is a cycle — return [].'],
  '200', 'https://leetcode.com/problems/course-schedule-ii/',
  'findOrder', '[{"name":"numCourses","type":"int"},{"name":"prerequisites","type":"List[List[int]]"}]'::jsonb, 'List[int]',
  '[{"inputs":["2","[[1,0]]"],"expected":"[0,1]"},{"inputs":["4","[[1,0],[2,0],[3,1],[3,2]]"],"expected":"[0,1,2,3]"},{"inputs":["1","[]"],"expected":"[0]"},{"inputs":["2","[]"],"expected":"[0,1]"},{"inputs":["2","[[0,1]]"],"expected":"[1,0]"},{"inputs":["2","[[1,0],[0,1]]"],"expected":"[]"},{"inputs":["3","[[1,0],[2,1]]"],"expected":"[0,1,2]"},{"inputs":["3","[[0,1],[0,2],[1,2]]"],"expected":"[2,1,0]"},{"inputs":["3","[[1,0]]"],"expected":"[0,1,2]"},{"inputs":["4","[[1,0],[2,1],[3,2]]"],"expected":"[0,1,2,3]"},{"inputs":["3","[[0,1],[1,2],[2,0]]"],"expected":"[]"},{"inputs":["5","[[1,0],[2,0],[3,1],[4,2]]"],"expected":"[0,1,2,3,4]"},{"inputs":["4","[[1,0],[2,0],[3,0]]"],"expected":"[0,1,2,3]"},{"inputs":["4","[[3,0],[3,1],[3,2]]"],"expected":"[0,1,2,3]"},{"inputs":["3","[]"],"expected":"[0,1,2]"},{"inputs":["5","[[1,0],[2,1],[3,2],[4,3]]"],"expected":"[0,1,2,3,4]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'course-schedule-ii', 1, 'BFS Topological Sort (Kahn''s Algorithm)',
  'We use Kahn''s algorithm: compute in-degrees, start BFS from nodes with in-degree 0, and process them in order. By using a sorted queue (or processing from node 0 upward), we get a deterministic topological order. If we cannot process all nodes, a cycle exists.',
  '["Build adjacency list and compute in-degree for each course.","Add all courses with in-degree 0 to a queue (sorted for determinism).","While queue is not empty: dequeue a course, add to result, decrement in-degree of its neighbors. If any neighbor reaches in-degree 0, add to queue.","If result length equals numCourses, return result; otherwise return []."]'::jsonb,
  $PY$import heapq
from collections import defaultdict

class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        graph = defaultdict(list)
        in_degree = [0] * numCourses
        for course, prereq in prerequisites:
            graph[prereq].append(course)
            in_degree[course] += 1
        heap = []
        for i in range(numCourses):
            if in_degree[i] == 0:
                heapq.heappush(heap, i)
        result = []
        while heap:
            node = heapq.heappop(heap)
            result.append(node)
            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    heapq.heappush(heap, neighbor)
        return result if len(result) == numCourses else []$PY$,
  $JS$var findOrder = function(numCourses, prerequisites) {
    const graph = Array.from({length: numCourses}, () => []);
    const inDegree = new Array(numCourses).fill(0);
    for (const [course, prereq] of prerequisites) {
        graph[prereq].push(course);
        inDegree[course]++;
    }
    const heap = [];
    for (let i = 0; i < numCourses; i++) {
        if (inDegree[i] === 0) heap.push(i);
    }
    const result = [];
    while (heap.length > 0) {
        heap.sort((a, b) => a - b);
        const node = heap.shift();
        result.push(node);
        for (const neighbor of graph[node]) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] === 0) heap.push(neighbor);
        }
    }
    return result.length === numCourses ? result : [];
};$JS$,
  $JAVA$import java.util.*;

class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] pre : prerequisites) {
            graph.get(pre[1]).add(pre[0]);
            inDegree[pre[0]]++;
        }
        PriorityQueue<Integer> queue = new PriorityQueue<>();
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) queue.offer(i);
        }
        int[] result = new int[numCourses];
        int idx = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            result[idx++] = node;
            for (int neighbor : graph.get(node)) {
                inDegree[neighbor]--;
                if (inDegree[neighbor] == 0) queue.offer(neighbor);
            }
        }
        return idx == numCourses ? result : new int[0];
    }
}$JAVA$,
  'O(V + E)', 'O(V + E)'
);

-- ============================================================
-- 9. accounts-merge (Advanced Graphs, Medium, LeetCode 721)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'accounts-merge', 'advanced-graphs', 'Accounts Merge', 'Medium',
  $DESC$<p>Given a list of <code>accounts</code> where each element <code>accounts[i]</code> is a list of strings, where the first element <code>accounts[i][0]</code> is a name, and the rest of the elements are <strong>emails</strong> representing emails of the account.</p>
<p>Now, we would like to merge these accounts. Two accounts definitely belong to the same person if there is some common email to both accounts. Note that even if two accounts have the same name, they may belong to different people as people could have the same name. A person can have any number of accounts initially, but all of their accounts definitely have the same name.</p>
<p>After merging the accounts, return the accounts in the following format: the first element of each account is the name, and the rest of the elements are emails in <strong>sorted order</strong>. The accounts themselves can be returned in <strong>any order</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]
Output: [["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["John","johnnybravo@mail.com"],["Mary","mary@mail.com"]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: accounts = [["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]]
Output: [["Ethan","Ethan0@m.co","Ethan4@m.co","Ethan5@m.co"],["Fern","Fern0@m.co","Fern1@m.co","Fern5@m.co"],["Gabe","Gabe0@m.co","Gabe1@m.co","Gabe3@m.co"],["Hanzo","Hanzo0@m.co","Hanzo1@m.co","Hanzo3@m.co"],["Kevin","Kevin0@m.co","Kevin3@m.co","Kevin5@m.co"]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= accounts.length &lt;= 1000</code></li>
<li><code>2 &lt;= accounts[i].length &lt;= 10</code></li>
<li><code>1 &lt;= accounts[i][j].length &lt;= 30</code></li>
<li><code>accounts[i][0]</code> consists of English letters.</li>
<li><code>accounts[i][j] (j &gt; 0)</code> is a valid email.</li>
</ul>$DESC$,
  '', ARRAY['Use Union-Find to group emails that belong to the same person.', 'Map each email to the first account index where it appears, then union accounts that share emails.', 'After union-find, group emails by their root, sort them, and prepend the name.'],
  '200', 'https://leetcode.com/problems/accounts-merge/',
  'accountsMerge', '[{"name":"accounts","type":"List[List[str]]"}]'::jsonb, 'List[List[str]]',
  '[{"inputs":["[[\"John\",\"johnsmith@mail.com\",\"john_newyork@mail.com\"],[\"John\",\"johnsmith@mail.com\",\"john00@mail.com\"],[\"Mary\",\"mary@mail.com\"],[\"John\",\"johnnybravo@mail.com\"]]"],"expected":"[[\"John\",\"john00@mail.com\",\"john_newyork@mail.com\",\"johnsmith@mail.com\"],[\"John\",\"johnnybravo@mail.com\"],[\"Mary\",\"mary@mail.com\"]]"},{"inputs":["[[\"Gabe\",\"Gabe0@m.co\",\"Gabe3@m.co\",\"Gabe1@m.co\"],[\"Kevin\",\"Kevin3@m.co\",\"Kevin5@m.co\",\"Kevin0@m.co\"],[\"Ethan\",\"Ethan5@m.co\",\"Ethan4@m.co\",\"Ethan0@m.co\"],[\"Hanzo\",\"Hanzo3@m.co\",\"Hanzo1@m.co\",\"Hanzo0@m.co\"],[\"Fern\",\"Fern5@m.co\",\"Fern1@m.co\",\"Fern0@m.co\"]]"],"expected":"[[\"Ethan\",\"Ethan0@m.co\",\"Ethan4@m.co\",\"Ethan5@m.co\"],[\"Fern\",\"Fern0@m.co\",\"Fern1@m.co\",\"Fern5@m.co\"],[\"Gabe\",\"Gabe0@m.co\",\"Gabe1@m.co\",\"Gabe3@m.co\"],[\"Hanzo\",\"Hanzo0@m.co\",\"Hanzo1@m.co\",\"Hanzo3@m.co\"],[\"Kevin\",\"Kevin0@m.co\",\"Kevin3@m.co\",\"Kevin5@m.co\"]]"},{"inputs":["[[\"Alex\",\"a@co\"]]"],"expected":"[[\"Alex\",\"a@co\"]]"},{"inputs":["[[\"A\",\"a@co\"],[\"A\",\"b@co\"]]"],"expected":"[[\"A\",\"a@co\"],[\"A\",\"b@co\"]]"},{"inputs":["[[\"A\",\"a@co\"],[\"A\",\"a@co\",\"b@co\"]]"],"expected":"[[\"A\",\"a@co\",\"b@co\"]]"},{"inputs":["[[\"A\",\"a@co\",\"b@co\"],[\"A\",\"b@co\",\"c@co\"],[\"A\",\"c@co\",\"d@co\"]]"],"expected":"[[\"A\",\"a@co\",\"b@co\",\"c@co\",\"d@co\"]]"},{"inputs":["[[\"A\",\"a@co\"],[\"B\",\"b@co\"],[\"A\",\"c@co\"]]"],"expected":"[[\"A\",\"a@co\"],[\"A\",\"c@co\"],[\"B\",\"b@co\"]]"},{"inputs":["[[\"A\",\"x@co\",\"y@co\"],[\"A\",\"y@co\",\"z@co\"]]"],"expected":"[[\"A\",\"x@co\",\"y@co\",\"z@co\"]]"},{"inputs":["[[\"D\",\"d@co\"],[\"D\",\"d@co\"]]"],"expected":"[[\"D\",\"d@co\"]]"},{"inputs":["[[\"A\",\"a1@co\",\"a2@co\"],[\"B\",\"b1@co\"],[\"A\",\"a2@co\",\"a3@co\"]]"],"expected":"[[\"A\",\"a1@co\",\"a2@co\",\"a3@co\"],[\"B\",\"b1@co\"]]"},{"inputs":["[[\"A\",\"e1@co\"],[\"A\",\"e2@co\"],[\"A\",\"e3@co\"]]"],"expected":"[[\"A\",\"e1@co\"],[\"A\",\"e2@co\"],[\"A\",\"e3@co\"]]"},{"inputs":["[[\"A\",\"a@co\",\"b@co\"],[\"A\",\"c@co\",\"d@co\"],[\"A\",\"b@co\",\"c@co\"]]"],"expected":"[[\"A\",\"a@co\",\"b@co\",\"c@co\",\"d@co\"]]"},{"inputs":["[[\"X\",\"x1@co\"],[\"Y\",\"y1@co\"],[\"X\",\"x2@co\"],[\"Y\",\"y2@co\"]]"],"expected":"[[\"X\",\"x1@co\"],[\"X\",\"x2@co\"],[\"Y\",\"y1@co\"],[\"Y\",\"y2@co\"]]"},{"inputs":["[[\"A\",\"z@co\",\"a@co\"]]"],"expected":"[[\"A\",\"a@co\",\"z@co\"]]"},{"inputs":["[[\"A\",\"a@co\",\"b@co\"],[\"A\",\"c@co\",\"a@co\"],[\"A\",\"d@co\",\"c@co\"]]"],"expected":"[[\"A\",\"a@co\",\"b@co\",\"c@co\",\"d@co\"]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'accounts-merge', 1, 'Union-Find',
  'We use Union-Find to group accounts that share at least one email. Each email is mapped to the account index where it first appears. When an email is seen again in a different account, we union those two account indices. Finally, we collect all emails per root account, sort them, and prepend the name.',
  '["Create a Union-Find structure for account indices.","For each account, for each email: if the email was seen before, union the current account with the previous account. Record email -> first account index.","After processing all accounts, group emails by their root account index.","For each group, sort the emails, prepend the account name, and add to result.","Sort the result by name then first email for deterministic output."]'::jsonb,
  $PY$from collections import defaultdict

class Solution:
    def accountsMerge(self, accounts: list[list[str]]) -> list[list[str]]:
        n = len(accounts)
        parent = list(range(n))
        rank = [0] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(x, y):
            px, py = find(x), find(y)
            if px == py:
                return
            if rank[px] < rank[py]:
                px, py = py, px
            parent[py] = px
            if rank[px] == rank[py]:
                rank[px] += 1

        email_to_account = {}
        for i, account in enumerate(accounts):
            for email in account[1:]:
                if email in email_to_account:
                    union(i, email_to_account[email])
                else:
                    email_to_account[email] = i

        groups = defaultdict(set)
        for email, idx in email_to_account.items():
            groups[find(idx)].add(email)

        result = []
        for idx, emails in groups.items():
            result.append([accounts[idx][0]] + sorted(emails))
        result.sort(key=lambda x: (x[0], x[1]))
        return result$PY$,
  $JS$var accountsMerge = function(accounts) {
    const n = accounts.length;
    const parent = Array.from({length: n}, (_, i) => i);
    const rankArr = new Array(n).fill(0);

    function find(x) {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    function union(x, y) {
        let px = find(x), py = find(y);
        if (px === py) return;
        if (rankArr[px] < rankArr[py]) [px, py] = [py, px];
        parent[py] = px;
        if (rankArr[px] === rankArr[py]) rankArr[px]++;
    }

    const emailToAccount = {};
    for (let i = 0; i < n; i++) {
        for (let j = 1; j < accounts[i].length; j++) {
            const email = accounts[i][j];
            if (email in emailToAccount) {
                union(i, emailToAccount[email]);
            } else {
                emailToAccount[email] = i;
            }
        }
    }

    const groups = {};
    for (const [email, idx] of Object.entries(emailToAccount)) {
        const root = find(idx);
        if (!groups[root]) groups[root] = new Set();
        groups[root].add(email);
    }

    const result = [];
    for (const [idx, emails] of Object.entries(groups)) {
        const sorted = [...emails].sort();
        result.push([accounts[idx][0], ...sorted]);
    }
    result.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    return result;
};$JS$,
  $JAVA$import java.util.*;

class Solution {
    int[] parent, rank;

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;
        if (rank[px] < rank[py]) { int tmp = px; px = py; py = tmp; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
    }

    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        int n = accounts.size();
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;

        Map<String, Integer> emailToAccount = new HashMap<>();
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < accounts.get(i).size(); j++) {
                String email = accounts.get(i).get(j);
                if (emailToAccount.containsKey(email)) {
                    union(i, emailToAccount.get(email));
                } else {
                    emailToAccount.put(email, i);
                }
            }
        }

        Map<Integer, TreeSet<String>> groups = new HashMap<>();
        for (Map.Entry<String, Integer> entry : emailToAccount.entrySet()) {
            int root = find(entry.getValue());
            groups.computeIfAbsent(root, k -> new TreeSet<>()).add(entry.getKey());
        }

        List<List<String>> result = new ArrayList<>();
        for (Map.Entry<Integer, TreeSet<String>> entry : groups.entrySet()) {
            List<String> account = new ArrayList<>();
            account.add(accounts.get(entry.getKey()).get(0));
            account.addAll(entry.getValue());
            result.add(account);
        }
        result.sort((a, b) -> {
            int cmp = a.get(0).compareTo(b.get(0));
            return cmp != 0 ? cmp : a.get(1).compareTo(b.get(1));
        });
        return result;
    }
}$JAVA$,
  'O(n * k * alpha(n))', 'O(n * k)'
);

COMMIT;
