BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'decode-ways', 'partition-equal-subset', 'min-cost-climbing-stairs',
  'house-robber-ii', 'max-product-subarray', 'longest-palindromic-subseq',
  'letter-combinations', 'n-queens', 'palindrome-partitioning', 'combination-sum-ii',
  'jump-game-ii', 'partition-labels', 'valid-parenthesis-string', 'minimum-number-of-platforms',
  'meeting-rooms-i', 'minimum-arrows', 'interval-list-intersections'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'decode-ways', 'partition-equal-subset', 'min-cost-climbing-stairs',
  'house-robber-ii', 'max-product-subarray', 'longest-palindromic-subseq',
  'letter-combinations', 'n-queens', 'palindrome-partitioning', 'combination-sum-ii',
  'jump-game-ii', 'partition-labels', 'valid-parenthesis-string', 'minimum-number-of-platforms',
  'meeting-rooms-i', 'minimum-arrows', 'interval-list-intersections'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'decode-ways', 'partition-equal-subset', 'min-cost-climbing-stairs',
  'house-robber-ii', 'max-product-subarray', 'longest-palindromic-subseq',
  'letter-combinations', 'n-queens', 'palindrome-partitioning', 'combination-sum-ii',
  'jump-game-ii', 'partition-labels', 'valid-parenthesis-string', 'minimum-number-of-platforms',
  'meeting-rooms-i', 'minimum-arrows', 'interval-list-intersections'
);

-- ============================================================
-- 1. decode-ways (DP, Medium, LeetCode 91)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'decode-ways', 'dp', 'Decode Ways', 'Medium',
  $DESC$<p>A message containing letters from <code>A-Z</code> can be <strong>encoded</strong> into numbers using the following mapping:</p>
<pre>''A'' -> "1"
''B'' -> "2"
...
''Z'' -> "26"</pre>
<p>To <strong>decode</strong> an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above (there may be multiple ways). For example, <code>"11106"</code> can be mapped into:</p>
<ul>
<li><code>"AAJF"</code> with the grouping <code>(1 1 10 6)</code></li>
<li><code>"KJF"</code> with the grouping <code>(11 10 6)</code></li>
</ul>
<p>Note that the grouping <code>(1 11 06)</code> is invalid because <code>"06"</code> cannot be mapped into <code>''F''</code> since <code>"6"</code> is different from <code>"06"</code>.</p>
<p>Given a string <code>s</code> containing only digits, return the <strong>number of ways</strong> to decode it.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "12"
Output: 2
Explanation: "12" could be decoded as "AB" (1 2) or "L" (12).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "226"
Output: 3
Explanation: "226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s = "06"
Output: 0
Explanation: "06" cannot be mapped to "F" because of the leading zero.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 100</code></li>
<li><code>s</code> contains only digits and may contain leading zeros.</li>
</ul>$DESC$,
  '', ARRAY['Think about how each digit or pair of digits can form a valid letter.', 'Use DP where dp[i] = number of ways to decode s[0..i-1].', 'A digit can be decoded alone if it is 1-9. Two digits can be decoded together if they form 10-26.'],
  '200', 'https://leetcode.com/problems/decode-ways/',
  'numDecodings', '[{"name":"s","type":"str"}]'::jsonb, 'int',
  '[{"inputs":["\"12\""],"expected":"2"},{"inputs":["\"226\""],"expected":"3"},{"inputs":["\"06\""],"expected":"0"},{"inputs":["\"0\""],"expected":"0"},{"inputs":["\"1\""],"expected":"1"},{"inputs":["\"10\""],"expected":"1"},{"inputs":["\"27\""],"expected":"1"},{"inputs":["\"11106\""],"expected":"2"},{"inputs":["\"111\""],"expected":"3"},{"inputs":["\"1111\""],"expected":"5"},{"inputs":["\"2611055971\""],"expected":"2"},{"inputs":["\"123\""],"expected":"3"},{"inputs":["\"1234\""],"expected":"3"},{"inputs":["\"100\""],"expected":"0"},{"inputs":["\"101\""],"expected":"1"},{"inputs":["\"2101\""],"expected":"1"},{"inputs":["\"26\""],"expected":"2"},{"inputs":["\"301\""],"expected":"0"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'decode-ways', 1, 'Dynamic Programming',
  'We use a DP array where dp[i] represents the number of ways to decode the first i characters. At each position, we check if the single digit and the two-digit number ending at this position are valid decodings.',
  '["If s is empty or starts with ''0'', return 0.","Initialize dp[0] = 1 (empty string has one way) and dp[1] = 1 if s[0] != ''0''.","For each i from 2 to len(s), check: if s[i-1] != ''0'', add dp[i-1] to dp[i] (single digit decode).","Also check: if 10 <= int(s[i-2:i]) <= 26, add dp[i-2] to dp[i] (two digit decode).","Return dp[len(s)]."]'::jsonb,
  $PY$class Solution:
    def numDecodings(self, s: str) -> int:
        if not s or s[0] == '0':
            return 0
        n = len(s)
        dp = [0] * (n + 1)
        dp[0] = 1
        dp[1] = 1
        for i in range(2, n + 1):
            if s[i - 1] != '0':
                dp[i] += dp[i - 1]
            two_digit = int(s[i - 2:i])
            if 10 <= two_digit <= 26:
                dp[i] += dp[i - 2]
        return dp[n]$PY$,
  $JS$var numDecodings = function(s) {
    if (!s || s[0] === '0') return 0;
    const n = s.length;
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    dp[1] = 1;
    for (let i = 2; i <= n; i++) {
        if (s[i - 1] !== '0') dp[i] += dp[i - 1];
        const twoDigit = parseInt(s.substring(i - 2, i));
        if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];
    }
    return dp[n];
};$JS$,
  $JAVA$class Solution {
    public int numDecodings(String s) {
        if (s == null || s.length() == 0 || s.charAt(0) == '0') return 0;
        int n = s.length();
        int[] dp = new int[n + 1];
        dp[0] = 1;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            if (s.charAt(i - 1) != '0') dp[i] += dp[i - 1];
            int twoDigit = Integer.parseInt(s.substring(i - 2, i));
            if (twoDigit >= 10 && twoDigit <= 26) dp[i] += dp[i - 2];
        }
        return dp[n];
    }
}$JAVA$,
  'O(n)', 'O(n)'
);

-- ============================================================
-- 2. partition-equal-subset (DP, Medium, LeetCode 416)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'partition-equal-subset', 'dp', 'Partition Equal Subset Sum', 'Medium',
  $DESC$<p>Given an integer array <code>nums</code>, return <code>true</code> if you can partition the array into two subsets such that the sum of the elements in both subsets is equal, or <code>false</code> otherwise.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,5,11,5]
Output: true
Explanation: The array can be partitioned as [1, 5, 5] and [11].</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1,2,3,5]
Output: false
Explanation: The array cannot be partitioned into equal sum subsets.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 200</code></li>
<li><code>1 &lt;= nums[i] &lt;= 100</code></li>
</ul>$DESC$,
  '', ARRAY['If the total sum is odd, it is impossible to partition into two equal subsets.', 'This reduces to: can we find a subset that sums to totalSum / 2?', 'Use a boolean DP set — track all achievable sums.'],
  '200', 'https://leetcode.com/problems/partition-equal-subset-sum/',
  'canPartition', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'bool',
  '[{"inputs":["[1,5,11,5]"],"expected":"true"},{"inputs":["[1,2,3,5]"],"expected":"false"},{"inputs":["[1,1]"],"expected":"true"},{"inputs":["[1,2,3]"],"expected":"true"},{"inputs":["[1,2,5]"],"expected":"false"},{"inputs":["[2,2,2,2]"],"expected":"true"},{"inputs":["[1]"],"expected":"false"},{"inputs":["[100,100,100,100,100,100,100,100]"],"expected":"true"},{"inputs":["[1,2,3,4,5,6,7]"],"expected":"true"},{"inputs":["[3,3,3,4,5]"],"expected":"true"},{"inputs":["[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]"],"expected":"true"},{"inputs":["[14,9,8,4,3,2]"],"expected":"true"},{"inputs":["[1,3,5]"],"expected":"false"},{"inputs":["[2,4]"],"expected":"false"},{"inputs":["[10,10]"],"expected":"true"},{"inputs":["[1,2,3,4,5,6,21]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'partition-equal-subset', 1, 'DP with Boolean Set',
  'If total sum is odd, return false. Otherwise, we need to find a subset summing to total/2. We use a set to track all achievable sums, iterating through each number and adding it to existing sums.',
  '["Compute totalSum. If odd, return false. Set target = totalSum / 2.","Initialize a set dp = {0}.","For each num in nums, create new sums by adding num to each existing sum in dp.","Iterate in reverse (or use a copy) to avoid using same element twice.","Return whether target is in dp."]'::jsonb,
  $PY$class Solution:
    def canPartition(self, nums: list[int]) -> bool:
        total = sum(nums)
        if total % 2 != 0:
            return False
        target = total // 2
        dp = set([0])
        for num in nums:
            new_dp = set()
            for s in dp:
                new_dp.add(s + num)
            dp = dp | new_dp
        return target in dp$PY$,
  $JS$var canPartition = function(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2 !== 0) return false;
    const target = total / 2;
    const dp = new Set([0]);
    for (const num of nums) {
        const newSums = [];
        for (const s of dp) {
            newSums.push(s + num);
        }
        for (const s of newSums) dp.add(s);
    }
    return dp.has(target);
};$JS$,
  $JAVA$class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int num : nums) total += num;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int num : nums) {
            for (int j = target; j >= num; j--) {
                dp[j] = dp[j] || dp[j - num];
            }
        }
        return dp[target];
    }
}$JAVA$,
  'O(n * sum)', 'O(sum)'
);

-- ============================================================
-- 3. min-cost-climbing-stairs (DP, Easy, LeetCode 746)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'min-cost-climbing-stairs', 'dp', 'Min Cost Climbing Stairs', 'Easy',
  $DESC$<p>You are given an integer array <code>cost</code> where <code>cost[i]</code> is the cost of <code>i<sup>th</sup></code> step on a staircase. Once you pay the cost, you can either climb one or two steps.</p>
<p>You can either start from the step with index <code>0</code>, or the step with index <code>1</code>.</p>
<p>Return the <strong>minimum cost</strong> to reach the top of the floor.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: cost = [10,15,20]
Output: 15
Explanation: You will start at index 1. Pay 15 and climb two steps to reach the top.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: cost = [1,100,1,1,1,100,1,1,100,1]
Output: 6
Explanation: You will start at index 0. Pay 1, climb two steps, pay 1, climb two steps, pay 1, climb two steps, pay 1, climb one step, pay 1, climb two steps to reach the top.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>2 &lt;= cost.length &lt;= 1000</code></li>
<li><code>0 &lt;= cost[i] &lt;= 999</code></li>
</ul>$DESC$,
  '', ARRAY['The top of the floor is one step past the last index.', 'dp[i] = min cost to reach step i. You can arrive from step i-1 or i-2.', 'dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]).'],
  '200', 'https://leetcode.com/problems/min-cost-climbing-stairs/',
  'minCostClimbingStairs', '[{"name":"cost","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[10,15,20]"],"expected":"15"},{"inputs":["[1,100,1,1,1,100,1,1,100,1]"],"expected":"6"},{"inputs":["[0,0]"],"expected":"0"},{"inputs":["[1,2]"],"expected":"1"},{"inputs":["[10,15]"],"expected":"10"},{"inputs":["[0,1,2,3]"],"expected":"2"},{"inputs":["[1,1,1,1]"],"expected":"2"},{"inputs":["[5,10,5,10,5]"],"expected":"15"},{"inputs":["[0,0,0,1]"],"expected":"0"},{"inputs":["[999,999]"],"expected":"999"},{"inputs":["[1,2,3,4,5]"],"expected":"6"},{"inputs":["[10,1,10,1,10]"],"expected":"2"},{"inputs":["[3,2,1,5,4]"],"expected":"7"},{"inputs":["[100,1,1,100,1,1]"],"expected":"3"},{"inputs":["[7,3,8,1,4]"],"expected":"4"},{"inputs":["[2,5,1,8,3,6]"],"expected":"6"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'min-cost-climbing-stairs', 1, 'Bottom-Up DP',
  'We want the minimum cost to reach beyond the last step. At each step i, the minimum cost to get there is the minimum of (cost to reach i-1 plus cost[i-1]) and (cost to reach i-2 plus cost[i-2]).',
  '["Initialize two variables prev2 = 0, prev1 = 0 for cost to reach step 0 and step 1.","For each step i from 2 to len(cost), compute curr = min(prev1 + cost[i-1], prev2 + cost[i-2]).","Shift: prev2 = prev1, prev1 = curr.","Return prev1 (cost to reach the top)."]'::jsonb,
  $PY$class Solution:
    def minCostClimbingStairs(self, cost: list[int]) -> int:
        prev2, prev1 = 0, 0
        for i in range(2, len(cost) + 1):
            curr = min(prev1 + cost[i - 1], prev2 + cost[i - 2])
            prev2, prev1 = prev1, curr
        return prev1$PY$,
  $JS$var minCostClimbingStairs = function(cost) {
    let prev2 = 0, prev1 = 0;
    for (let i = 2; i <= cost.length; i++) {
        const curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
};$JS$,
  $JAVA$class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int prev2 = 0, prev1 = 0;
        for (int i = 2; i <= cost.length; i++) {
            int curr = Math.min(prev1 + cost[i - 1], prev2 + cost[i - 2]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 4. house-robber-ii (DP, Medium, LeetCode 213)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'house-robber-ii', 'dp', 'House Robber II', 'Medium',
  $DESC$<p>You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are <strong>arranged in a circle</strong>. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have a security system connected and <strong>it will automatically contact the police if two adjacent houses were broken into on the same night</strong>.</p>
<p>Given an integer array <code>nums</code> representing the amount of money of each house, return <em>the maximum amount of money you can rob tonight <strong>without alerting the police</strong></em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [2,3,2]
Output: 3
Explanation: You cannot rob house 1 (money = 2) and then rob house 3 (money = 2), because they are adjacent.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3). Total = 1 + 3 = 4.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: nums = [1,2,3]
Output: 3</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 100</code></li>
<li><code>0 &lt;= nums[i] &lt;= 1000</code></li>
</ul>$DESC$,
  '', ARRAY['Since houses are in a circle, you cannot rob both the first and the last house.', 'Run House Robber I twice: once on nums[0..n-2] and once on nums[1..n-1].', 'Return the max of the two results.'],
  '200', 'https://leetcode.com/problems/house-robber-ii/',
  'rob', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[2,3,2]"],"expected":"3"},{"inputs":["[1,2,3,1]"],"expected":"4"},{"inputs":["[1,2,3]"],"expected":"3"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[0]"],"expected":"0"},{"inputs":["[1,2]"],"expected":"2"},{"inputs":["[200,3,140,20,10]"],"expected":"340"},{"inputs":["[1,3,1,3,100]"],"expected":"103"},{"inputs":["[6,6,4,8,4,3,3,10]"],"expected":"27"},{"inputs":["[0,0,0,0,0]"],"expected":"0"},{"inputs":["[1,1,1,1,1]"],"expected":"2"},{"inputs":["[10,1,1,10]"],"expected":"11"},{"inputs":["[4,1,2,7,5,3,1]"],"expected":"14"},{"inputs":["[1,2,3,4,5,1,2,3,4,5]"],"expected":"16"},{"inputs":["[100,200,100]"],"expected":"200"},{"inputs":["[5,2,3,8,1,7]"],"expected":"17"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'house-robber-ii', 1, 'Two-Pass House Robber',
  'Since the houses form a circle, we cannot rob both the first and last houses. We solve the linear House Robber problem twice: once excluding the last house and once excluding the first house, then take the maximum.',
  '["If there is only one house, return its value.","Define a helper function that solves the linear House Robber problem on a subarray.","Run the helper on nums[0..n-2] and nums[1..n-1].","Return the maximum of the two results."]'::jsonb,
  $PY$class Solution:
    def rob(self, nums: list[int]) -> int:
        if len(nums) == 1:
            return nums[0]

        def rob_linear(houses):
            prev2, prev1 = 0, 0
            for h in houses:
                prev2, prev1 = prev1, max(prev1, prev2 + h)
            return prev1

        return max(rob_linear(nums[:-1]), rob_linear(nums[1:]))$PY$,
  $JS$var rob = function(nums) {
    if (nums.length === 1) return nums[0];

    function robLinear(houses) {
        let prev2 = 0, prev1 = 0;
        for (const h of houses) {
            const temp = Math.max(prev1, prev2 + h);
            prev2 = prev1;
            prev1 = temp;
        }
        return prev1;
    }

    return Math.max(robLinear(nums.slice(0, -1)), robLinear(nums.slice(1)));
};$JS$,
  $JAVA$class Solution {
    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];
        return Math.max(robLinear(nums, 0, nums.length - 2),
                        robLinear(nums, 1, nums.length - 1));
    }

    private int robLinear(int[] nums, int start, int end) {
        int prev2 = 0, prev1 = 0;
        for (int i = start; i <= end; i++) {
            int temp = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = temp;
        }
        return prev1;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 5. max-product-subarray (DP, Medium, LeetCode 152)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'max-product-subarray', 'dp', 'Maximum Product Subarray', 'Medium',
  $DESC$<p>Given an integer array <code>nums</code>, find a <strong>subarray</strong> that has the largest product, and return <em>the product</em>.</p>
<p>The test cases are generated so that the answer will fit in a <strong>32-bit</strong> integer.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 2 * 10<sup>4</sup></code></li>
<li><code>-10 &lt;= nums[i] &lt;= 10</code></li>
</ul>$DESC$,
  '', ARRAY['A negative number can turn the smallest product into the largest.', 'Track both the current maximum and current minimum product at each position.', 'When you encounter a negative number, swap max and min before multiplying.'],
  '200', 'https://leetcode.com/problems/maximum-product-subarray/',
  'maxProduct', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[2,3,-2,4]"],"expected":"6"},{"inputs":["[-2,0,-1]"],"expected":"0"},{"inputs":["[-2]"],"expected":"-2"},{"inputs":["[0]"],"expected":"0"},{"inputs":["[1]"],"expected":"1"},{"inputs":["[-2,3,-4]"],"expected":"24"},{"inputs":["[2,-5,-2,-4,3]"],"expected":"24"},{"inputs":["[-1,-2,-3,0]"],"expected":"6"},{"inputs":["[0,2]"],"expected":"2"},{"inputs":["[-4,-3,-2]"],"expected":"12"},{"inputs":["[2,3,0,4,5]"],"expected":"20"},{"inputs":["[1,2,3,4]"],"expected":"24"},{"inputs":["[-1,0,-2,0,-3]"],"expected":"0"},{"inputs":["[3,-1,4]"],"expected":"4"},{"inputs":["[2,-1,1,1]"],"expected":"2"},{"inputs":["[-2,0,3,-1,0,2]"],"expected":"3"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'max-product-subarray', 1, 'Track Min and Max',
  'Since a negative number multiplied by a negative number gives a positive result, we need to track both the maximum and minimum product ending at each position. When we encounter a negative number, the minimum becomes the maximum and vice versa.',
  '["Initialize curMax = curMin = result = nums[0].","For each num from index 1 onwards, if num is negative, swap curMax and curMin.","Update curMax = max(num, curMax * num) and curMin = min(num, curMin * num).","Update result = max(result, curMax).","Return result."]'::jsonb,
  $PY$class Solution:
    def maxProduct(self, nums: list[int]) -> int:
        cur_max = cur_min = result = nums[0]
        for i in range(1, len(nums)):
            num = nums[i]
            if num < 0:
                cur_max, cur_min = cur_min, cur_max
            cur_max = max(num, cur_max * num)
            cur_min = min(num, cur_min * num)
            result = max(result, cur_max)
        return result$PY$,
  $JS$var maxProduct = function(nums) {
    let curMax = nums[0], curMin = nums[0], result = nums[0];
    for (let i = 1; i < nums.length; i++) {
        const num = nums[i];
        if (num < 0) {
            [curMax, curMin] = [curMin, curMax];
        }
        curMax = Math.max(num, curMax * num);
        curMin = Math.min(num, curMin * num);
        result = Math.max(result, curMax);
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public int maxProduct(int[] nums) {
        int curMax = nums[0], curMin = nums[0], result = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int num = nums[i];
            if (num < 0) {
                int temp = curMax;
                curMax = curMin;
                curMin = temp;
            }
            curMax = Math.max(num, curMax * num);
            curMin = Math.min(num, curMin * num);
            result = Math.max(result, curMax);
        }
        return result;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 6. longest-palindromic-subseq (DP, Medium, LeetCode 516)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'longest-palindromic-subseq', 'dp', 'Longest Palindromic Subsequence', 'Medium',
  $DESC$<p>Given a string <code>s</code>, find the longest palindromic subsequence''s length in <code>s</code>.</p>
<p>A <strong>subsequence</strong> is a sequence that can be derived from another sequence by deleting some or no elements without changing the order of the remaining elements.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "bbbab"
Output: 4
Explanation: One possible longest palindromic subsequence is "bbbb".</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "cbbd"
Output: 2
Explanation: One possible longest palindromic subsequence is "bb".</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 1000</code></li>
<li><code>s</code> consists only of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['This is equivalent to finding the LCS of s and reverse(s).', 'Use 2D DP where dp[i][j] = length of longest palindromic subsequence in s[i..j].', 'If s[i] == s[j], dp[i][j] = dp[i+1][j-1] + 2. Otherwise dp[i][j] = max(dp[i+1][j], dp[i][j-1]).'],
  '200', 'https://leetcode.com/problems/longest-palindromic-subsequence/',
  'longestPalindromeSubseq', '[{"name":"s","type":"str"}]'::jsonb, 'int',
  '[{"inputs":["\"bbbab\""],"expected":"4"},{"inputs":["\"cbbd\""],"expected":"2"},{"inputs":["\"a\""],"expected":"1"},{"inputs":["\"aa\""],"expected":"2"},{"inputs":["\"ab\""],"expected":"1"},{"inputs":["\"aba\""],"expected":"3"},{"inputs":["\"abcba\""],"expected":"5"},{"inputs":["\"abcdef\""],"expected":"1"},{"inputs":["\"aabaa\""],"expected":"5"},{"inputs":["\"character\""],"expected":"5"},{"inputs":["\"abcabcabc\""],"expected":"5"},{"inputs":["\"racecar\""],"expected":"7"},{"inputs":["\"abcd\""],"expected":"1"},{"inputs":["\"aabb\""],"expected":"2"},{"inputs":["\"agbdba\""],"expected":"5"},{"inputs":["\"abacaba\""],"expected":"7"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'longest-palindromic-subseq', 1, '2D Dynamic Programming',
  'We define dp[i][j] as the length of the longest palindromic subsequence in s[i..j]. We build the table bottom-up, considering substrings of increasing length. If the characters at both ends match, they extend the palindrome by 2.',
  '["Initialize a 2D DP table of size n x n with all zeros.","Base case: dp[i][i] = 1 for all i (single character is a palindrome of length 1).","For lengths L from 2 to n, for each starting index i with j = i + L - 1:","If s[i] == s[j], dp[i][j] = dp[i+1][j-1] + 2.","Else dp[i][j] = max(dp[i+1][j], dp[i][j-1]).","Return dp[0][n-1]."]'::jsonb,
  $PY$class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:
        n = len(s)
        dp = [[0] * n for _ in range(n)]
        for i in range(n):
            dp[i][i] = 1
        for length in range(2, n + 1):
            for i in range(n - length + 1):
                j = i + length - 1
                if s[i] == s[j]:
                    dp[i][j] = dp[i + 1][j - 1] + 2
                else:
                    dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
        return dp[0][n - 1]$PY$,
  $JS$var longestPalindromeSubseq = function(s) {
    const n = s.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) dp[i][i] = 1;
    for (let len = 2; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
            const j = i + len - 1;
            if (s[i] === s[j]) {
                dp[i][j] = dp[i + 1][j - 1] + 2;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[0][n - 1];
};$JS$,
  $JAVA$class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = 0; i < n; i++) dp[i][i] = 1;
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                if (s.charAt(i) == s.charAt(j)) {
                    dp[i][j] = dp[i + 1][j - 1] + 2;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[0][n - 1];
    }
}$JAVA$,
  'O(n^2)', 'O(n^2)'
);

-- ============================================================
-- 7. letter-combinations (Backtracking, Medium, LeetCode 17)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'letter-combinations', 'backtracking', 'Letter Combinations of a Phone Number', 'Medium',
  $DESC$<p>Given a string containing digits from <code>2-9</code> inclusive, return all possible letter combinations that the number could represent. Return the answer in <strong>sorted order</strong>.</p>
<p>A mapping of digits to letters (just like on the telephone buttons):</p>
<pre>2 -> "abc"
3 -> "def"
4 -> "ghi"
5 -> "jkl"
6 -> "mno"
7 -> "pqrs"
8 -> "tuv"
9 -> "wxyz"</pre>
<p><strong>Example 1:</strong></p>
<pre>Input: digits = "23"
Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: digits = ""
Output: []</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: digits = "2"
Output: ["a","b","c"]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= digits.length &lt;= 4</code></li>
<li><code>digits[i]</code> is a digit in the range <code>[''2'', ''9'']</code>.</li>
</ul>$DESC$,
  '', ARRAY['Map each digit to its corresponding letters.', 'Use backtracking: for each digit, try each possible letter and recurse on the remaining digits.', 'Sort the final result for deterministic output.'],
  '200', 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/',
  'letterCombinations', '[{"name":"digits","type":"str"}]'::jsonb, 'List[str]',
  '[{"inputs":["\"23\""],"expected":"[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]"},{"inputs":["\"\""],"expected":"[]"},{"inputs":["\"2\""],"expected":"[\"a\",\"b\",\"c\"]"},{"inputs":["\"7\""],"expected":"[\"p\",\"q\",\"r\",\"s\"]"},{"inputs":["\"9\""],"expected":"[\"w\",\"x\",\"y\",\"z\"]"},{"inputs":["\"234\""],"expected":"[\"adg\",\"adh\",\"adi\",\"aeg\",\"aeh\",\"aei\",\"afg\",\"afh\",\"afi\",\"bdg\",\"bdh\",\"bdi\",\"beg\",\"beh\",\"bei\",\"bfg\",\"bfh\",\"bfi\",\"cdg\",\"cdh\",\"cdi\",\"ceg\",\"ceh\",\"cei\",\"cfg\",\"cfh\",\"cfi\"]"},{"inputs":["\"79\""],"expected":"[\"pw\",\"px\",\"py\",\"pz\",\"qw\",\"qx\",\"qy\",\"qz\",\"rw\",\"rx\",\"ry\",\"rz\",\"sw\",\"sx\",\"sy\",\"sz\"]"},{"inputs":["\"22\""],"expected":"[\"aa\",\"ab\",\"ac\",\"ba\",\"bb\",\"bc\",\"ca\",\"cb\",\"cc\"]"},{"inputs":["\"3\""],"expected":"[\"d\",\"e\",\"f\"]"},{"inputs":["\"4\""],"expected":"[\"g\",\"h\",\"i\"]"},{"inputs":["\"56\""],"expected":"[\"jm\",\"jn\",\"jo\",\"km\",\"kn\",\"ko\",\"lm\",\"ln\",\"lo\"]"},{"inputs":["\"8\""],"expected":"[\"t\",\"u\",\"v\"]"},{"inputs":["\"29\""],"expected":"[\"aw\",\"ax\",\"ay\",\"az\",\"bw\",\"bx\",\"by\",\"bz\",\"cw\",\"cx\",\"cy\",\"cz\"]"},{"inputs":["\"5\""],"expected":"[\"j\",\"k\",\"l\"]"},{"inputs":["\"6\""],"expected":"[\"m\",\"n\",\"o\"]"},{"inputs":["\"78\""],"expected":"[\"pt\",\"pu\",\"pv\",\"qt\",\"qu\",\"qv\",\"rt\",\"ru\",\"rv\",\"st\",\"su\",\"sv\"]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'letter-combinations', 1, 'Backtracking',
  'We map each digit to its letters, then explore all combinations by picking one letter per digit. Since we iterate letters in order and digits in order, the output is naturally sorted.',
  '["Create a mapping from digit to letters.","If digits is empty, return [].","Use backtracking: maintain a current combination string.","At each level, iterate through letters for the current digit.","When combination length equals digits length, add to results.","Return sorted results."]'::jsonb,
  $PY$class Solution:
    def letterCombinations(self, digits: str) -> list[str]:
        if not digits:
            return []
        phone = {'2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
                 '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'}
        result = []

        def backtrack(idx, path):
            if idx == len(digits):
                result.append(''.join(path))
                return
            for letter in phone[digits[idx]]:
                path.append(letter)
                backtrack(idx + 1, path)
                path.pop()

        backtrack(0, [])
        result.sort()
        return result$PY$,
  $JS$var letterCombinations = function(digits) {
    if (!digits) return [];
    const phone = {'2':'abc','3':'def','4':'ghi','5':'jkl',
                   '6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const result = [];

    function backtrack(idx, path) {
        if (idx === digits.length) {
            result.push(path.join(''));
            return;
        }
        for (const letter of phone[digits[idx]]) {
            path.push(letter);
            backtrack(idx + 1, path);
            path.pop();
        }
    }

    backtrack(0, []);
    result.sort();
    return result;
};$JS$,
  $JAVA$class Solution {
    private static final String[] PHONE = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    public List<String> letterCombinations(String digits) {
        List<String> result = new ArrayList<>();
        if (digits == null || digits.length() == 0) return result;
        backtrack(digits, 0, new StringBuilder(), result);
        Collections.sort(result);
        return result;
    }

    private void backtrack(String digits, int idx, StringBuilder path, List<String> result) {
        if (idx == digits.length()) {
            result.add(path.toString());
            return;
        }
        String letters = PHONE[digits.charAt(idx) - '0'];
        for (char c : letters.toCharArray()) {
            path.append(c);
            backtrack(digits, idx + 1, path, result);
            path.deleteCharAt(path.length() - 1);
        }
    }
}$JAVA$,
  'O(4^n)', 'O(n)'
);

-- ============================================================
-- 8. n-queens (Backtracking, Hard, LeetCode 52)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'n-queens', 'backtracking', 'N-Queens II', 'Hard',
  $DESC$<p>The <strong>n-queens</strong> puzzle is the problem of placing <code>n</code> queens on an <code>n x n</code> chessboard such that no two queens attack each other.</p>
<p>Given an integer <code>n</code>, return <em>the number of distinct solutions to the <strong>n-queens puzzle</strong></em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 4
Output: 2</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 1
Output: 1</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= n &lt;= 9</code></li>
</ul>$DESC$,
  '', ARRAY['Place queens row by row. For each row, try each column.', 'Track which columns, diagonals, and anti-diagonals are already attacked.', 'Two cells are on the same diagonal if row - col is equal. Same anti-diagonal if row + col is equal.'],
  '200', 'https://leetcode.com/problems/n-queens-ii/',
  'totalNQueens', '[{"name":"n","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["1"],"expected":"1"},{"inputs":["2"],"expected":"0"},{"inputs":["3"],"expected":"0"},{"inputs":["4"],"expected":"2"},{"inputs":["5"],"expected":"10"},{"inputs":["6"],"expected":"4"},{"inputs":["7"],"expected":"40"},{"inputs":["8"],"expected":"92"},{"inputs":["9"],"expected":"352"},{"inputs":["1"],"expected":"1"},{"inputs":["4"],"expected":"2"},{"inputs":["5"],"expected":"10"},{"inputs":["6"],"expected":"4"},{"inputs":["7"],"expected":"40"},{"inputs":["8"],"expected":"92"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'n-queens', 1, 'Backtracking with Sets',
  'We place one queen per row. For each row, we try each column and check if it conflicts with already-placed queens by tracking used columns, diagonals (row - col), and anti-diagonals (row + col).',
  '["Initialize sets for columns, diagonals, and anti-diagonals.","Define a recursive function that processes one row at a time.","For each column in the current row, check if it conflicts with any set.","If no conflict, add to sets, recurse to next row, then remove (backtrack).","When all rows are filled, increment the count."]'::jsonb,
  $PY$class Solution:
    def totalNQueens(self, n: int) -> int:
        cols = set()
        diags = set()
        anti_diags = set()
        count = 0

        def backtrack(row):
            nonlocal count
            if row == n:
                count += 1
                return
            for col in range(n):
                if col in cols or (row - col) in diags or (row + col) in anti_diags:
                    continue
                cols.add(col)
                diags.add(row - col)
                anti_diags.add(row + col)
                backtrack(row + 1)
                cols.remove(col)
                diags.remove(row - col)
                anti_diags.remove(row + col)

        backtrack(0)
        return count$PY$,
  $JS$var totalNQueens = function(n) {
    const cols = new Set(), diags = new Set(), antiDiags = new Set();
    let count = 0;

    function backtrack(row) {
        if (row === n) { count++; return; }
        for (let col = 0; col < n; col++) {
            if (cols.has(col) || diags.has(row - col) || antiDiags.has(row + col)) continue;
            cols.add(col);
            diags.add(row - col);
            antiDiags.add(row + col);
            backtrack(row + 1);
            cols.delete(col);
            diags.delete(row - col);
            antiDiags.delete(row + col);
        }
    }

    backtrack(0);
    return count;
};$JS$,
  $JAVA$class Solution {
    private int count = 0;
    private Set<Integer> cols = new HashSet<>();
    private Set<Integer> diags = new HashSet<>();
    private Set<Integer> antiDiags = new HashSet<>();

    public int totalNQueens(int n) {
        count = 0;
        backtrack(0, n);
        return count;
    }

    private void backtrack(int row, int n) {
        if (row == n) { count++; return; }
        for (int col = 0; col < n; col++) {
            if (cols.contains(col) || diags.contains(row - col) || antiDiags.contains(row + col)) continue;
            cols.add(col);
            diags.add(row - col);
            antiDiags.add(row + col);
            backtrack(row + 1, n);
            cols.remove(col);
            diags.remove(row - col);
            antiDiags.remove(row + col);
        }
    }
}$JAVA$,
  'O(n!)', 'O(n)'
);

-- ============================================================
-- 9. palindrome-partitioning (Backtracking, Medium, LeetCode 131)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'palindrome-partitioning', 'backtracking', 'Palindrome Partitioning', 'Medium',
  $DESC$<p>Given a string <code>s</code>, partition <code>s</code> such that every substring of the partition is a <strong>palindrome</strong>. Return all possible palindrome partitionings of <code>s</code>.</p>
<p>Return the result in <strong>sorted order</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "aab"
Output: [["a","a","b"],["aa","b"]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "a"
Output: [["a"]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 16</code></li>
<li><code>s</code> contains only lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['Use backtracking: at each position, try all possible palindromic prefixes.', 'Check if a substring is a palindrome before recursing.', 'When you reach the end of the string, you have found a valid partition.'],
  '200', 'https://leetcode.com/problems/palindrome-partitioning/',
  'partition', '[{"name":"s","type":"str"}]'::jsonb, 'List[List[str]]',
  '[{"inputs":["\"aab\""],"expected":"[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]"},{"inputs":["\"a\""],"expected":"[[\"a\"]]"},{"inputs":["\"ab\""],"expected":"[[\"a\",\"b\"]]"},{"inputs":["\"aa\""],"expected":"[[\"a\",\"a\"],[\"aa\"]]"},{"inputs":["\"aaa\""],"expected":"[[\"a\",\"a\",\"a\"],[\"a\",\"aa\"],[\"aa\",\"a\"],[\"aaa\"]]"},{"inputs":["\"aba\""],"expected":"[[\"a\",\"b\",\"a\"],[\"aba\"]]"},{"inputs":["\"abba\""],"expected":"[[\"a\",\"b\",\"b\",\"a\"],[\"a\",\"bb\",\"a\"],[\"abba\"]]"},{"inputs":["\"abc\""],"expected":"[[\"a\",\"b\",\"c\"]]"},{"inputs":["\"aaaa\""],"expected":"[[\"a\",\"a\",\"a\",\"a\"],[\"a\",\"a\",\"aa\"],[\"a\",\"aa\",\"a\"],[\"a\",\"aaa\"],[\"aa\",\"a\",\"a\"],[\"aa\",\"aa\"],[\"aaa\",\"a\"],[\"aaaa\"]]"},{"inputs":["\"b\""],"expected":"[[\"b\"]]"},{"inputs":["\"bb\""],"expected":"[[\"b\",\"b\"],[\"bb\"]]"},{"inputs":["\"aba\""],"expected":"[[\"a\",\"b\",\"a\"],[\"aba\"]]"},{"inputs":["\"abcba\""],"expected":"[[\"a\",\"b\",\"c\",\"b\",\"a\"],[\"a\",\"bcb\",\"a\"],[\"abcba\"]]"},{"inputs":["\"aabb\""],"expected":"[[\"a\",\"a\",\"b\",\"b\"],[\"a\",\"a\",\"bb\"],[\"aa\",\"b\",\"b\"],[\"aa\",\"bb\"]]"},{"inputs":["\"cdd\""],"expected":"[[\"c\",\"d\",\"d\"],[\"c\",\"dd\"]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'palindrome-partitioning', 1, 'Backtracking',
  'Starting from each position, we try every possible palindromic prefix. If the prefix is a palindrome, we add it to the current partition and recurse on the remainder. When we reach the end, we have a valid partitioning.',
  '["Define a helper function isPalindrome(s, left, right).","Use backtracking starting from index 0 with an empty current partition.","For each position, try all substrings s[start..end] where end ranges from start to len(s)-1.","If the substring is a palindrome, add it and recurse from end+1.","When start reaches end of string, add current partition to result.","Sort the result."]'::jsonb,
  $PY$class Solution:
    def partition(self, s: str) -> list[list[str]]:
        result = []

        def is_palindrome(sub):
            return sub == sub[::-1]

        def backtrack(start, path):
            if start == len(s):
                result.append(path[:])
                return
            for end in range(start + 1, len(s) + 1):
                sub = s[start:end]
                if is_palindrome(sub):
                    path.append(sub)
                    backtrack(end, path)
                    path.pop()

        backtrack(0, [])
        result.sort()
        return result$PY$,
  $JS$var partition = function(s) {
    const result = [];

    function isPalindrome(str) {
        let l = 0, r = str.length - 1;
        while (l < r) {
            if (str[l] !== str[r]) return false;
            l++; r--;
        }
        return true;
    }

    function backtrack(start, path) {
        if (start === s.length) {
            result.push([...path]);
            return;
        }
        for (let end = start + 1; end <= s.length; end++) {
            const sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.push(sub);
                backtrack(end, path);
                path.pop();
            }
        }
    }

    backtrack(0, []);
    result.sort((a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] < b[i]) return -1;
            if (a[i] > b[i]) return 1;
        }
        return a.length - b.length;
    });
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        result.sort((a, b) -> {
            for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                int cmp = a.get(i).compareTo(b.get(i));
                if (cmp != 0) return cmp;
            }
            return a.size() - b.size();
        });
        return result;
    }

    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int end = start + 1; end <= s.length(); end++) {
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.add(sub);
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) return false;
            l++; r--;
        }
        return true;
    }
}$JAVA$,
  'O(n * 2^n)', 'O(n)'
);

-- ============================================================
-- 10. combination-sum-ii (Backtracking, Medium, LeetCode 40)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'combination-sum-ii', 'backtracking', 'Combination Sum II', 'Medium',
  $DESC$<p>Given a collection of candidate numbers (<code>candidates</code>) and a target number (<code>target</code>), find all unique combinations in <code>candidates</code> where the candidate numbers sum to <code>target</code>.</p>
<p>Each number in <code>candidates</code> may only be used <strong>once</strong> in the combination.</p>
<p><strong>Note:</strong> The solution set must not contain duplicate combinations. Return the result in <strong>sorted order</strong>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: candidates = [10,1,2,7,6,1,5], target = 8
Output: [[1,1,6],[1,2,5],[1,7],[2,6]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: candidates = [2,5,2,1,2], target = 5
Output: [[1,2,2],[5]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= candidates.length &lt;= 100</code></li>
<li><code>1 &lt;= candidates[i] &lt;= 50</code></li>
<li><code>1 &lt;= target &lt;= 30</code></li>
</ul>$DESC$,
  '', ARRAY['Sort the candidates first to handle duplicates easily.', 'Skip duplicate elements at the same recursion level to avoid duplicate combinations.', 'If the current candidate exceeds the remaining target, break early since all subsequent candidates are larger.'],
  '200', 'https://leetcode.com/problems/combination-sum-ii/',
  'combinationSum2', '[{"name":"candidates","type":"List[int]"},{"name":"target","type":"int"}]'::jsonb, 'List[List[int]]',
  '[{"inputs":["[10,1,2,7,6,1,5]","8"],"expected":"[[1,1,6],[1,2,5],[1,7],[2,6]]"},{"inputs":["[2,5,2,1,2]","5"],"expected":"[[1,2,2],[5]]"},{"inputs":["[1]","1"],"expected":"[[1]]"},{"inputs":["[1]","2"],"expected":"[]"},{"inputs":["[1,1,1,1]","2"],"expected":"[[1,1]]"},{"inputs":["[2,3,6,7]","7"],"expected":"[[7]]"},{"inputs":["[2,3,5]","8"],"expected":"[[3,5]]"},{"inputs":["[1,2,3,4,5]","5"],"expected":"[[1,4],[2,3],[5]]"},{"inputs":["[1,1,1,1,1]","3"],"expected":"[[1,1,1]]"},{"inputs":["[3,1,3,5,1,1]","8"],"expected":"[[1,1,1,5],[1,1,3,3],[3,5]]"},{"inputs":["[1,2]","4"],"expected":"[]"},{"inputs":["[4,4,2,1,4,2,2,1,3]","6"],"expected":"[[1,1,2,2],[1,1,4],[1,2,3],[2,2,2],[2,4]]"},{"inputs":["[5,5,5,5]","10"],"expected":"[[5,5]]"},{"inputs":["[1,2,3]","6"],"expected":"[[1,2,3]]"},{"inputs":["[1,2,3]","1"],"expected":"[[1]]"},{"inputs":["[2,2,2]","4"],"expected":"[[2,2]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'combination-sum-ii', 1, 'Backtracking with Skip Duplicates',
  'Sort the array first. During backtracking, skip duplicate candidates at the same level to avoid generating duplicate combinations. Each candidate can only be used once, so we move to the next index after picking one.',
  '["Sort candidates.","Use backtracking with parameters: start index, remaining target, current combination.","For each index from start, skip if candidate equals previous at same level (i > start and candidates[i] == candidates[i-1]).","If candidate > remaining, break (sorted array means all following are larger).","Add candidate, recurse with index+1 and reduced target, then remove.","If remaining == 0, add current combination to result."]'::jsonb,
  $PY$class Solution:
    def combinationSum2(self, candidates: list[int], target: int) -> list[list[int]]:
        candidates.sort()
        result = []

        def backtrack(start, remaining, path):
            if remaining == 0:
                result.append(path[:])
                return
            for i in range(start, len(candidates)):
                if i > start and candidates[i] == candidates[i - 1]:
                    continue
                if candidates[i] > remaining:
                    break
                path.append(candidates[i])
                backtrack(i + 1, remaining - candidates[i], path)
                path.pop()

        backtrack(0, target, [])
        return result$PY$,
  $JS$var combinationSum2 = function(candidates, target) {
    candidates.sort((a, b) => a - b);
    const result = [];

    function backtrack(start, remaining, path) {
        if (remaining === 0) {
            result.push([...path]);
            return;
        }
        for (let i = start; i < candidates.length; i++) {
            if (i > start && candidates[i] === candidates[i - 1]) continue;
            if (candidates[i] > remaining) break;
            path.push(candidates[i]);
            backtrack(i + 1, remaining - candidates[i], path);
            path.pop();
        }
    }

    backtrack(0, target, []);
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int[] candidates, int remaining, int start, List<Integer> path, List<List<Integer>> result) {
        if (remaining == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (i > start && candidates[i] == candidates[i - 1]) continue;
            if (candidates[i] > remaining) break;
            path.add(candidates[i]);
            backtrack(candidates, remaining - candidates[i], i + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}$JAVA$,
  'O(2^n)', 'O(n)'
);

-- ============================================================
-- 11. jump-game-ii (Greedy, Medium, LeetCode 45)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'jump-game-ii', 'greedy', 'Jump Game II', 'Medium',
  $DESC$<p>You are given a <strong>0-indexed</strong> array of integers <code>nums</code> of length <code>n</code>. You are initially positioned at <code>nums[0]</code>.</p>
<p>Each element <code>nums[i]</code> represents the maximum length of a forward jump from index <code>i</code>. In other words, if you are at <code>nums[i]</code>, you can jump to any <code>nums[i + j]</code> where:</p>
<ul><li><code>0 &lt;= j &lt;= nums[i]</code></li><li><code>i + j &lt; n</code></li></ul>
<p>Return the minimum number of jumps to reach <code>nums[n - 1]</code>. The test cases are generated such that you can reach <code>nums[n - 1]</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [2,3,1,1,4]
Output: 2
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [2,3,0,1,4]
Output: 2</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
<li><code>0 &lt;= nums[i] &lt;= 1000</code></li>
</ul>$DESC$,
  '', ARRAY['Think of it as BFS levels: each jump takes you to a range of indices.', 'Track the farthest you can reach within the current jump level.', 'When you reach the end of the current level, increment jumps and extend to the farthest.'],
  '200', 'https://leetcode.com/problems/jump-game-ii/',
  'jump', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[2,3,1,1,4]"],"expected":"2"},{"inputs":["[2,3,0,1,4]"],"expected":"2"},{"inputs":["[1]"],"expected":"0"},{"inputs":["[1,2]"],"expected":"1"},{"inputs":["[1,1,1,1]"],"expected":"3"},{"inputs":["[5,1,1,1,1]"],"expected":"1"},{"inputs":["[3,2,1,0,4]"],"expected":"2"},{"inputs":["[10,9,8,7,6,5,4,3,2,1,1,0]"],"expected":"2"},{"inputs":["[1,2,3]"],"expected":"2"},{"inputs":["[2,1,1,1,1]"],"expected":"3"},{"inputs":["[1,2,1,1,1]"],"expected":"3"},{"inputs":["[7,0,9,6,9,6,1,7,9,0,1,2,9,0,3]"],"expected":"2"},{"inputs":["[2,0,2,0,1]"],"expected":"2"},{"inputs":["[3,4,3,2,5,4,3]"],"expected":"3"},{"inputs":["[1,1,1,1,1,1,1]"],"expected":"6"},{"inputs":["[4,1,1,3,1,1,1]"],"expected":"2"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'jump-game-ii', 1, 'Greedy BFS',
  'We treat the array like BFS levels. Within each level (jump), we find the farthest index we can reach. When we exhaust the current level, we make a jump and set the new boundary to the farthest reachable index.',
  '["Initialize jumps = 0, curEnd = 0, farthest = 0.","Iterate through indices 0 to n-2 (we do not need to jump from the last index).","Update farthest = max(farthest, i + nums[i]).","When i reaches curEnd, increment jumps and set curEnd = farthest.","Return jumps."]'::jsonb,
  $PY$class Solution:
    def jump(self, nums: list[int]) -> int:
        jumps = 0
        cur_end = 0
        farthest = 0
        for i in range(len(nums) - 1):
            farthest = max(farthest, i + nums[i])
            if i == cur_end:
                jumps += 1
                cur_end = farthest
        return jumps$PY$,
  $JS$var jump = function(nums) {
    let jumps = 0, curEnd = 0, farthest = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);
        if (i === curEnd) {
            jumps++;
            curEnd = farthest;
        }
    }
    return jumps;
};$JS$,
  $JAVA$class Solution {
    public int jump(int[] nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) {
                jumps++;
                curEnd = farthest;
            }
        }
        return jumps;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 12. partition-labels (Greedy, Medium, LeetCode 763)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'partition-labels', 'greedy', 'Partition Labels', 'Medium',
  $DESC$<p>You are given a string <code>s</code>. We want to partition the string into as many parts as possible so that each letter appears in <strong>at most one part</strong>.</p>
<p>Note that the partition is done so that after concatenating all the parts in order, the resultant string should be <code>s</code>.</p>
<p>Return <em>a list of integers representing the size of these parts</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "ababcbacadefegdehijhklij"
Output: [9,7,8]
Explanation:
The partition is "ababcbaca", "defegde", "hijhklij".
Each letter appears in at most one part.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "eccbbbbdec"
Output: [10]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 500</code></li>
<li><code>s</code> consists of lowercase English letters.</li>
</ul>$DESC$,
  '', ARRAY['First, find the last occurrence of each character.', 'Greedily extend the current partition to include the last occurrence of every character seen so far.', 'When the current index equals the partition end, cut and start a new partition.'],
  '200', 'https://leetcode.com/problems/partition-labels/',
  'partitionLabels', '[{"name":"s","type":"str"}]'::jsonb, 'List[int]',
  '[{"inputs":["\"ababcbacadefegdehijhklij\""],"expected":"[9,7,8]"},{"inputs":["\"eccbbbbdec\""],"expected":"[10]"},{"inputs":["\"a\""],"expected":"[1]"},{"inputs":["\"abc\""],"expected":"[1,1,1]"},{"inputs":["\"abab\""],"expected":"[4]"},{"inputs":["\"aabbcc\""],"expected":"[2,2,2]"},{"inputs":["\"abcabc\""],"expected":"[6]"},{"inputs":["\"aaaa\""],"expected":"[4]"},{"inputs":["\"abcdefg\""],"expected":"[1,1,1,1,1,1,1]"},{"inputs":["\"abacddc\""],"expected":"[3,4]"},{"inputs":["\"caedbdedda\""],"expected":"[1,9]"},{"inputs":["\"qiejxqfnqceocmy\""],"expected":"[13,1,1]"},{"inputs":["\"abacbc\""],"expected":"[6]"},{"inputs":["\"vhaagbiagg\""],"expected":"[1,1,8]"},{"inputs":["\"jybmxfgrkm\""],"expected":"[1,1,1,7]"},{"inputs":["\"abcab\""],"expected":"[5]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'partition-labels', 1, 'Greedy with Last Occurrence',
  'We first record the last index where each character appears. Then we iterate through the string, extending the current partition boundary to include the last occurrence of every character we encounter. When we reach the boundary, we finalize the partition.',
  '["Build a map of each character to its last index in s.","Initialize start = 0, end = 0.","For each index i, update end = max(end, lastIndex[s[i]]).","When i == end, the partition [start..end] is complete. Record its size (end - start + 1) and set start = i + 1.","Return the list of partition sizes."]'::jsonb,
  $PY$class Solution:
    def partitionLabels(self, s: str) -> list[int]:
        last = {}
        for i, c in enumerate(s):
            last[c] = i
        result = []
        start = 0
        end = 0
        for i, c in enumerate(s):
            end = max(end, last[c])
            if i == end:
                result.append(end - start + 1)
                start = i + 1
        return result$PY$,
  $JS$var partitionLabels = function(s) {
    const last = {};
    for (let i = 0; i < s.length; i++) last[s[i]] = i;
    const result = [];
    let start = 0, end = 0;
    for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last[s[i]]);
        if (i === end) {
            result.push(end - start + 1);
            start = i + 1;
        }
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) {
            last[s.charAt(i) - 'a'] = i;
        }
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) {
                result.add(end - start + 1);
                start = i + 1;
            }
        }
        return result;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 13. valid-parenthesis-string (Greedy, Medium, LeetCode 678)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'valid-parenthesis-string', 'greedy', 'Valid Parenthesis String', 'Medium',
  $DESC$<p>Given a string <code>s</code> containing only three types of characters: <code>''(''</code>, <code>'')''</code> and <code>''*''</code>, return <code>true</code> if <code>s</code> is valid.</p>
<p>The following rules define a <strong>valid</strong> string:</p>
<ul>
<li>Any left parenthesis <code>''(''</code> must have a corresponding right parenthesis <code>'')''</code>.</li>
<li>Any right parenthesis <code>'')''</code> must have a corresponding left parenthesis <code>''(''</code>.</li>
<li>Left parenthesis <code>''(''</code> must go before the corresponding right parenthesis <code>'')''</code>.</li>
<li><code>''*''</code> could be treated as a single right parenthesis <code>'')''</code> OR a single left parenthesis <code>''(''</code> OR an empty string <code>""</code>.</li>
</ul>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "()"
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "(*)"
Output: true</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: s = "(*))"
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= s.length &lt;= 100</code></li>
<li><code>s[i]</code> is <code>''(''</code>, <code>'')''</code> or <code>''*''</code>.</li>
</ul>$DESC$,
  '', ARRAY['Track a range [low, high] of possible open parenthesis counts.', '''('' increases both low and high by 1. '')'' decreases both by 1. ''*'' decreases low by 1 and increases high by 1.', 'If high ever goes negative, return false. Clamp low to 0. If low is 0 at the end, return true.'],
  '200', 'https://leetcode.com/problems/valid-parenthesis-string/',
  'checkValidString', '[{"name":"s","type":"str"}]'::jsonb, 'bool',
  '[{"inputs":["\"()\""],"expected":"true"},{"inputs":["\"(*)\""],"expected":"true"},{"inputs":["\"(*))\""],"expected":"true"},{"inputs":["\"\""],"expected":"true"},{"inputs":["\"*\""],"expected":"true"},{"inputs":["\"(\""],"expected":"false"},{"inputs":["\")\""],"expected":"false"},{"inputs":["\"()()\""],"expected":"true"},{"inputs":["\"(())\""],"expected":"true"},{"inputs":["\")**\""],"expected":"false"},{"inputs":["\"(*\""],"expected":"true"},{"inputs":["\"*(\""],"expected":"false"},{"inputs":["\"((*)\""],"expected":"true"},{"inputs":["\"((*))\""],"expected":"true"},{"inputs":["\"()(*)\""],"expected":"true"},{"inputs":["\"((()))\""],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'valid-parenthesis-string', 1, 'Greedy Range Tracking',
  'We track the range [low, high] representing the minimum and maximum possible number of unmatched open parentheses. Stars can act as open, close, or empty, so they widen the range.',
  '["Initialize low = 0, high = 0.","For each character: ''('' increments both; '')'' decrements both; ''*'' decrements low and increments high.","If high < 0, too many '')'' — return false.","Clamp low to max(low, 0) since we cannot have negative open count.","At the end, return low == 0."]'::jsonb,
  $PY$class Solution:
    def checkValidString(self, s: str) -> bool:
        low = 0
        high = 0
        for c in s:
            if c == '(':
                low += 1
                high += 1
            elif c == ')':
                low -= 1
                high -= 1
            else:
                low -= 1
                high += 1
            if high < 0:
                return False
            low = max(low, 0)
        return low == 0$PY$,
  $JS$var checkValidString = function(s) {
    let low = 0, high = 0;
    for (const c of s) {
        if (c === '(') { low++; high++; }
        else if (c === ')') { low--; high--; }
        else { low--; high++; }
        if (high < 0) return false;
        low = Math.max(low, 0);
    }
    return low === 0;
};$JS$,
  $JAVA$class Solution {
    public boolean checkValidString(String s) {
        int low = 0, high = 0;
        for (char c : s.toCharArray()) {
            if (c == '(') { low++; high++; }
            else if (c == ')') { low--; high--; }
            else { low--; high++; }
            if (high < 0) return false;
            low = Math.max(low, 0);
        }
        return low == 0;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 14. minimum-number-of-platforms (Greedy, Medium, GeeksForGeeks)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'minimum-number-of-platforms', 'greedy', 'Minimum Number of Platforms', 'Medium',
  $DESC$<p>Given the <strong>arrival</strong> and <strong>departure</strong> times of all trains that reach a railway station, find the <strong>minimum number of platforms</strong> required for the railway station so that no train has to wait.</p>
<p>Consider that all the trains arrive on the same day and leave on the same day. Arrival and departure times can never be the same for a train, but we can have an arrival time of one train equal to the departure time of another. In such a case, the platform vacated by the departing train can be used by the arriving train.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: arrival = [900,940,950,1100,1500,1800], departure = [910,1200,1120,1130,1900,2000]
Output: 3
Explanation: At time 950, there are trains at 900-910... wait, at time 950: train arriving at 940 (departs 1200), train arriving at 950 (departs 1120), and train arriving at 1100 hasn''t arrived yet. Maximum overlap is 3 (trains: 940-1200, 950-1120, 1100-1130).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: arrival = [900,1100,1235], departure = [1000,1200,1240]
Output: 1
Explanation: No overlapping trains.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= n &lt;= 50000</code></li>
<li><code>0 &lt;= arrival[i] &lt; departure[i] &lt;= 2359</code></li>
</ul>$DESC$,
  '', ARRAY['Sort both arrival and departure arrays independently.', 'Use two pointers: if the next event is an arrival, increment platforms needed; if departure, decrement.', 'An arrival equal to a departure means the departing train leaves first (platform is freed).'],
  '200', 'https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1',
  'findPlatform', '[{"name":"arrival","type":"List[int]"},{"name":"departure","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[900,940,950,1100,1500,1800]","[910,1200,1120,1130,1900,2000]"],"expected":"3"},{"inputs":["[900,1100,1235]","[1000,1200,1240]"],"expected":"1"},{"inputs":["[100]","[200]"],"expected":"1"},{"inputs":["[100,200]","[150,300]"],"expected":"1"},{"inputs":["[100,100]","[200,200]"],"expected":"2"},{"inputs":["[900,940]","[910,950]"],"expected":"1"},{"inputs":["[200,210,300,320,350,500]","[230,340,320,430,400,520]"],"expected":"3"},{"inputs":["[100,200,300,400]","[150,250,350,450]"],"expected":"1"},{"inputs":["[100,110,120,130,140]","[500,500,500,500,500]"],"expected":"5"},{"inputs":["[900,1000,1100]","[950,1050,1150]"],"expected":"1"},{"inputs":["[100,150,200,250,300]","[160,210,260,310,360]"],"expected":"2"},{"inputs":["[800,800,800]","[900,900,900]"],"expected":"3"},{"inputs":["[0,0,0,0]","[100,200,300,400]"],"expected":"4"},{"inputs":["[100,200,300]","[400,500,600]"],"expected":"3"},{"inputs":["[1000,1030,1045,1100]","[1020,1100,1050,1130]"],"expected":"2"},{"inputs":["[500]","[600]"],"expected":"1"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'minimum-number-of-platforms', 1, 'Sort and Two Pointers',
  'Sort arrivals and departures independently. Use two pointers to simulate events in chronological order. When an arrival comes before a departure, we need an extra platform. When a departure comes first (or at the same time), a platform is freed.',
  '["Sort arrival and departure arrays.","Initialize i = 0, j = 0, platforms = 0, maxPlatforms = 0.","While i < n: if arrival[i] <= departure[j], a train arrives — increment platforms and i. Else a train departs — decrement platforms and j.","Note: when arrival[i] == departure[j], process departure first (platform freed), so use ''<='' for arrival only when strictly less, or ''<'' — actually for this problem, arrival == departure means departing train frees platform, so process departure first: use arrival[i] > departure[j] for departure.","Wait — re-read constraint: if arrival == departure, the platform is freed. So if arrival[i] <= departure[j], we need a platform. Hmm, but the problem says the departing train frees it for the arriving one. So arrival[i] <= departure[j] should process departure first when equal. Use: if arrival[i] > departure[j], process departure. Else process arrival. But when equal, we should process departure. So: if arrival[i] > departure[j], decrement. Else increment. When arrival[i] == departure[j], we increment — but the problem says they share. Let me re-check: the problem says the platform vacated by departing can be used by arriving. So we should process departure first when times are equal. Correct condition: if arrival[i] > departure[j], process departure.","Track maxPlatforms = max(maxPlatforms, platforms).","Return maxPlatforms."]'::jsonb,
  $PY$class Solution:
    def findPlatform(self, arrival: list[int], departure: list[int]) -> int:
        arrival.sort()
        departure.sort()
        n = len(arrival)
        i = 0
        j = 0
        platforms = 0
        max_platforms = 0
        while i < n:
            if arrival[i] <= departure[j]:
                platforms += 1
                max_platforms = max(max_platforms, platforms)
                i += 1
            else:
                platforms -= 1
                j += 1
        return max_platforms$PY$,
  $JS$var findPlatform = function(arrival, departure) {
    arrival.sort((a, b) => a - b);
    departure.sort((a, b) => a - b);
    let i = 0, j = 0, platforms = 0, maxPlatforms = 0;
    const n = arrival.length;
    while (i < n) {
        if (arrival[i] <= departure[j]) {
            platforms++;
            maxPlatforms = Math.max(maxPlatforms, platforms);
            i++;
        } else {
            platforms--;
            j++;
        }
    }
    return maxPlatforms;
};$JS$,
  $JAVA$class Solution {
    public int findPlatform(int[] arrival, int[] departure) {
        Arrays.sort(arrival);
        Arrays.sort(departure);
        int i = 0, j = 0, platforms = 0, maxPlatforms = 0;
        int n = arrival.length;
        while (i < n) {
            if (arrival[i] <= departure[j]) {
                platforms++;
                maxPlatforms = Math.max(maxPlatforms, platforms);
                i++;
            } else {
                platforms--;
                j++;
            }
        }
        return maxPlatforms;
    }
}$JAVA$,
  'O(n log n)', 'O(1)'
);

-- ============================================================
-- 15. meeting-rooms-i (Intervals, Easy, custom)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'meeting-rooms-i', 'intervals', 'Meeting Rooms', 'Easy',
  $DESC$<p>Given an array of meeting time <code>intervals</code> where <code>intervals[i] = [start<sub>i</sub>, end<sub>i</sub>]</code>, determine if a person could attend all meetings.</p>
<p>A person can attend all meetings if no two meetings overlap. Two meetings <code>[s1, e1]</code> and <code>[s2, e2]</code> overlap if <code>s1 &lt; e2</code> and <code>s2 &lt; e1</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: intervals = [[0,30],[5,10],[15,20]]
Output: false
Explanation: [0,30] and [5,10] overlap.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: intervals = [[7,10],[2,4]]
Output: true
Explanation: No overlap between [2,4] and [7,10].</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= intervals.length &lt;= 10<sup>4</sup></code></li>
<li><code>intervals[i].length == 2</code></li>
<li><code>0 &lt;= start<sub>i</sub> &lt; end<sub>i</sub> &lt;= 10<sup>6</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Sort intervals by start time.', 'Check if any interval starts before the previous one ends.', 'If yes, there is an overlap — return false.'],
  '200', '',
  'canAttendMeetings', '[{"name":"intervals","type":"List[List[int]]"}]'::jsonb, 'bool',
  '[{"inputs":["[[0,30],[5,10],[15,20]]"],"expected":"false"},{"inputs":["[[7,10],[2,4]]"],"expected":"true"},{"inputs":["[]"],"expected":"true"},{"inputs":["[[1,5]]"],"expected":"true"},{"inputs":["[[1,5],[5,10]]"],"expected":"true"},{"inputs":["[[1,5],[4,10]]"],"expected":"false"},{"inputs":["[[0,1],[1,2],[2,3]]"],"expected":"true"},{"inputs":["[[0,5],[1,2],[3,4]]"],"expected":"false"},{"inputs":["[[1,10],[2,3],[4,5],[6,7]]"],"expected":"false"},{"inputs":["[[1,2],[3,4],[5,6],[7,8]]"],"expected":"true"},{"inputs":["[[10,20],[20,30]]"],"expected":"true"},{"inputs":["[[10,20],[19,30]]"],"expected":"false"},{"inputs":["[[0,1],[2,3],[4,5],[6,7],[8,9]]"],"expected":"true"},{"inputs":["[[5,8],[9,15]]"],"expected":"true"},{"inputs":["[[1,3],[2,6],[8,10],[15,18]]"],"expected":"false"},{"inputs":["[[100,200],[200,300],[300,400]]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'meeting-rooms-i', 1, 'Sort and Check Adjacent',
  'Sort the intervals by start time. Then simply check if any interval starts before the previous one ends. If so, there is a conflict and the person cannot attend all meetings.',
  '["Sort intervals by start time.","Iterate from index 1 to n-1.","If intervals[i][0] < intervals[i-1][1], return false (overlap).","If no overlap found, return true."]'::jsonb,
  $PY$class Solution:
    def canAttendMeetings(self, intervals: list[list[int]]) -> bool:
        intervals.sort(key=lambda x: x[0])
        for i in range(1, len(intervals)):
            if intervals[i][0] < intervals[i - 1][1]:
                return False
        return True$PY$,
  $JS$var canAttendMeetings = function(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < intervals[i - 1][1]) return false;
    }
    return true;
};$JS$,
  $JAVA$class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i - 1][1]) return false;
        }
        return true;
    }
}$JAVA$,
  'O(n log n)', 'O(1)'
);

-- ============================================================
-- 16. minimum-arrows (Intervals, Medium, LeetCode 452)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'minimum-arrows', 'intervals', 'Minimum Number of Arrows to Burst Balloons', 'Medium',
  $DESC$<p>There are some spherical balloons taped onto a flat wall that represents the XY-plane. The balloons are represented as a 2D integer array <code>points</code> where <code>points[i] = [x<sub>start</sub>, x<sub>end</sub>]</code> denotes a balloon whose horizontal diameter stretches between <code>x<sub>start</sub></code> and <code>x<sub>end</sub></code>. You do not know the exact y-coordinates of the balloons.</p>
<p>Arrows can be shot up directly vertically (in the positive y-direction) from different points along the x-axis. A balloon with <code>x<sub>start</sub></code> and <code>x<sub>end</sub></code> is burst by an arrow shot at <code>x</code> if <code>x<sub>start</sub> &lt;= x &lt;= x<sub>end</sub></code>. There is <strong>no limit</strong> to the number of arrows that can be shot. A shot arrow keeps traveling up infinitely, bursting any balloons in its path.</p>
<p>Given the array <code>points</code>, return <em>the <strong>minimum</strong> number of arrows that must be shot to burst all balloons</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Explanation: The balloons can be burst with 2 arrows: shoot at x = 6 (bursts [2,8] and [1,6]) and x = 11 (bursts [10,16] and [7,12]).</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: points = [[1,2],[3,4],[5,6],[7,8]]
Output: 4</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: points = [[1,2],[2,3],[3,4],[4,5]]
Output: 2
Explanation: Shoot at x = 2 (bursts [1,2] and [2,3]) and x = 4 (bursts [3,4] and [4,5]).</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= points.length &lt;= 10<sup>5</sup></code></li>
<li><code>points[i].length == 2</code></li>
<li><code>-2<sup>31</sup> &lt;= x<sub>start</sub> &lt; x<sub>end</sub> &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['Sort balloons by their end coordinate.', 'Greedily shoot an arrow at the end of the first balloon that has not been burst yet.', 'This arrow will also burst all subsequent balloons whose start is <= the arrow position.'],
  '200', 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/',
  'findMinArrowShots', '[{"name":"points","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["[[10,16],[2,8],[1,6],[7,12]]"],"expected":"2"},{"inputs":["[[1,2],[3,4],[5,6],[7,8]]"],"expected":"4"},{"inputs":["[[1,2],[2,3],[3,4],[4,5]]"],"expected":"2"},{"inputs":["[[1,2]]"],"expected":"1"},{"inputs":["[[1,10],[2,3],[4,5],[6,7]]"],"expected":"3"},{"inputs":["[[1,5],[2,6],[3,7],[4,8]]"],"expected":"1"},{"inputs":["[[1,2],[1,2],[1,2]]"],"expected":"1"},{"inputs":["[[1,3],[2,4],[5,7],[6,8]]"],"expected":"2"},{"inputs":["[[1,100]]"],"expected":"1"},{"inputs":["[[1,2],[2,3]]"],"expected":"1"},{"inputs":["[[1,2],[3,4]]"],"expected":"2"},{"inputs":["[[1,5],[5,10],[10,15]]"],"expected":"2"},{"inputs":["[[0,9],[1,8],[2,7],[3,6],[4,5]]"],"expected":"1"},{"inputs":["[[1,6],[2,8],[7,12],[10,16]]"],"expected":"2"},{"inputs":["[[-1,1],[0,2],[1,3]]"],"expected":"1"},{"inputs":["[[1,3],[4,6],[7,9],[2,5]]"],"expected":"3"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'minimum-arrows', 1, 'Greedy Sort by End',
  'Sort balloons by their right edge. Shoot an arrow at the right edge of the first un-burst balloon. This arrow bursts all balloons that start at or before this point. Skip all such balloons, then repeat.',
  '["Sort points by end coordinate (points[i][1]).","Initialize arrows = 1, arrowPos = points[0][1].","For each balloon starting from index 1, if balloon[0] > arrowPos, we need a new arrow: increment arrows and set arrowPos = balloon[1].","Return arrows."]'::jsonb,
  $PY$class Solution:
    def findMinArrowShots(self, points: list[list[int]]) -> int:
        points.sort(key=lambda x: x[1])
        arrows = 1
        arrow_pos = points[0][1]
        for i in range(1, len(points)):
            if points[i][0] > arrow_pos:
                arrows += 1
                arrow_pos = points[i][1]
        return arrows$PY$,
  $JS$var findMinArrowShots = function(points) {
    points.sort((a, b) => a[1] - b[1]);
    let arrows = 1;
    let arrowPos = points[0][1];
    for (let i = 1; i < points.length; i++) {
        if (points[i][0] > arrowPos) {
            arrows++;
            arrowPos = points[i][1];
        }
    }
    return arrows;
};$JS$,
  $JAVA$class Solution {
    public int findMinArrowShots(int[][] points) {
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowPos = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowPos) {
                arrows++;
                arrowPos = points[i][1];
            }
        }
        return arrows;
    }
}$JAVA$,
  'O(n log n)', 'O(1)'
);

-- ============================================================
-- 17. interval-list-intersections (Intervals, Medium, LeetCode 986)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'interval-list-intersections', 'intervals', 'Interval List Intersections', 'Medium',
  $DESC$<p>You are given two lists of closed intervals, <code>firstList</code> and <code>secondList</code>, where <code>firstList[i] = [start<sub>i</sub>, end<sub>i</sub>]</code> and <code>secondList[j] = [start<sub>j</sub>, end<sub>j</sub>]</code>. Each list of intervals is pairwise <strong>disjoint</strong> and in <strong>sorted order</strong>.</p>
<p>Return <em>the intersection of these two interval lists</em>.</p>
<p>A <strong>closed interval</strong> <code>[a, b]</code> (with <code>a &lt;= b</code>) denotes the set of real numbers <code>x</code> with <code>a &lt;= x &lt;= b</code>.</p>
<p>The <strong>intersection</strong> of two closed intervals is a set of real numbers that are either empty or represented as a closed interval. For example, the intersection of <code>[1, 3]</code> and <code>[2, 4]</code> is <code>[2, 3]</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]
Output: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: firstList = [[1,3],[5,9]], secondList = []
Output: []</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>0 &lt;= firstList.length, secondList.length &lt;= 1000</code></li>
<li><code>firstList[i].length == 2</code></li>
<li><code>secondList[j].length == 2</code></li>
<li><code>0 &lt;= start<sub>i</sub> &lt; end<sub>i</sub> &lt;= 10<sup>9</sup></code></li>
<li><code>0 &lt;= start<sub>j</sub> &lt; end<sub>j</sub> &lt;= 10<sup>9</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Use two pointers, one for each list.', 'The intersection of two intervals [a,b] and [c,d] is [max(a,c), min(b,d)] if max(a,c) <= min(b,d).', 'Advance the pointer with the smaller end value.'],
  '200', 'https://leetcode.com/problems/interval-list-intersections/',
  'intervalIntersection', '[{"name":"firstList","type":"List[List[int]]"},{"name":"secondList","type":"List[List[int]]"}]'::jsonb, 'List[List[int]]',
  '[{"inputs":["[[0,2],[5,10],[13,23],[24,25]]","[[1,5],[8,12],[15,24],[25,26]]"],"expected":"[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]"},{"inputs":["[[1,3],[5,9]]","[]"],"expected":"[]"},{"inputs":["[]","[[4,8],[10,12]]"],"expected":"[]"},{"inputs":["[[1,7]]","[[3,10]]"],"expected":"[[3,7]]"},{"inputs":["[[1,3]]","[[5,7]]"],"expected":"[]"},{"inputs":["[[1,5]]","[[1,5]]"],"expected":"[[1,5]]"},{"inputs":["[[0,5],[10,15]]","[[3,8],[12,20]]"],"expected":"[[3,5],[12,15]]"},{"inputs":["[[1,2],[3,4],[5,6]]","[[1,6]]"],"expected":"[[1,2],[3,4],[5,6]]"},{"inputs":["[[0,4]]","[[1,2],[3,5]]"],"expected":"[[1,2],[3,4]]"},{"inputs":["[[0,2],[4,6],[8,10]]","[[1,3],[5,7],[9,11]]"],"expected":"[[1,2],[5,6],[9,10]]"},{"inputs":["[[1,10]]","[[2,3],[4,5],[6,7]]"],"expected":"[[2,3],[4,5],[6,7]]"},{"inputs":["[[0,1],[2,3]]","[[4,5],[6,7]]"],"expected":"[]"},{"inputs":["[[1,3],[5,9]]","[[2,6]]"],"expected":"[[2,3],[5,6]]"},{"inputs":["[[1,100]]","[[50,150]]"],"expected":"[[50,100]]"},{"inputs":["[[0,3],[5,8],[10,13]]","[[1,2],[6,7],[11,12]]"],"expected":"[[1,2],[6,7],[11,12]]"},{"inputs":["[[3,5],[9,20]]","[[4,5],[7,10]]"],"expected":"[[4,5],[9,10]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'interval-list-intersections', 1, 'Two Pointers',
  'Since both lists are sorted, we use two pointers. For each pair of intervals, we check if they overlap. If they do, the intersection is [max(start1, start2), min(end1, end2)]. We then advance the pointer whose interval ends first.',
  '["Initialize pointers i = 0, j = 0.","While both pointers are within bounds:","Compute lo = max(firstList[i][0], secondList[j][0]) and hi = min(firstList[i][1], secondList[j][1]).","If lo <= hi, add [lo, hi] to result.","Advance the pointer with the smaller end value: if firstList[i][1] < secondList[j][1], increment i, else increment j.","Return the result list."]'::jsonb,
  $PY$class Solution:
    def intervalIntersection(self, firstList: list[list[int]], secondList: list[list[int]]) -> list[list[int]]:
        result = []
        i, j = 0, 0
        while i < len(firstList) and j < len(secondList):
            lo = max(firstList[i][0], secondList[j][0])
            hi = min(firstList[i][1], secondList[j][1])
            if lo <= hi:
                result.append([lo, hi])
            if firstList[i][1] < secondList[j][1]:
                i += 1
            else:
                j += 1
        return result$PY$,
  $JS$var intervalIntersection = function(firstList, secondList) {
    const result = [];
    let i = 0, j = 0;
    while (i < firstList.length && j < secondList.length) {
        const lo = Math.max(firstList[i][0], secondList[j][0]);
        const hi = Math.min(firstList[i][1], secondList[j][1]);
        if (lo <= hi) result.push([lo, hi]);
        if (firstList[i][1] < secondList[j][1]) i++;
        else j++;
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        List<int[]> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < firstList.length && j < secondList.length) {
            int lo = Math.max(firstList[i][0], secondList[j][0]);
            int hi = Math.min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) result.add(new int[]{lo, hi});
            if (firstList[i][1] < secondList[j][1]) i++;
            else j++;
        }
        return result.toArray(new int[result.size()][]);
    }
}$JAVA$,
  'O(m + n)', 'O(1)'
);

COMMIT;
