-- Grow catalog 200 → 300: dp topic (+8 problems).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'n-th-tribonacci','divisor-game','paint-house','delete-and-earn',
  'best-sightseeing-pair','integer-break','longest-valid-parentheses','frog-jump'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'n-th-tribonacci','divisor-game','paint-house','delete-and-earn',
  'best-sightseeing-pair','integer-break','longest-valid-parentheses','frog-jump'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'n-th-tribonacci','divisor-game','paint-house','delete-and-earn',
  'best-sightseeing-pair','integer-break','longest-valid-parentheses','frog-jump'
);

-- ============================================================
-- 1) n-th-tribonacci (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('n-th-tribonacci', 'dp', 'N-th Tribonacci Number', 'Easy',
$$<p>The Tribonacci sequence is defined as <code>T0 = 0</code>, <code>T1 = T2 = 1</code>, and <code>T(n+3) = T(n) + T(n+1) + T(n+2)</code> for <code>n &gt;= 0</code>. Given <code>n</code>, return the value of <code>T(n)</code>.</p>$$,
'', ARRAY[
  'Only the last three values are needed at any step — no need for an array.',
  'Iterate n times, updating three rolling variables (a, b, c) → (b, c, a + b + c).',
  'Handle small cases (n <= 2) separately because the recurrence only kicks in at n >= 3.'
], '300', 'https://leetcode.com/problems/n-th-tribonacci-number/',
'tribonacci',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["4"],"expected":"4"},
  {"inputs":["25"],"expected":"1389537"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["1"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('n-th-tribonacci', 'python',
$PY$class Solution:
    def tribonacci(self, n: int) -> int:
        $PY$),
('n-th-tribonacci', 'javascript',
$JS$/**
 * @param {number} n
 * @return {number}
 */
var tribonacci = function(n) {

};$JS$),
('n-th-tribonacci', 'java',
$JAVA$class Solution {
    public int tribonacci(int n) {

    }
}$JAVA$),
('n-th-tribonacci', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int tribonacci(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('n-th-tribonacci', 1, 'Rolling Three Variables',
'The recurrence only depends on the last three values, so we keep a window of size 3 and slide it forward n - 2 times. Constant memory, linear time.',
'["If n == 0 return 0; if n <= 2 return 1.","Set a = 0, b = 1, c = 1.","Repeat n - 2 times: d = a + b + c; shift (a, b, c) = (b, c, d).","Return c."]'::jsonb,
$PY$class Solution:
    def tribonacci(self, n: int) -> int:
        if n == 0: return 0
        if n <= 2: return 1
        a, b, c = 0, 1, 1
        for _ in range(n - 2):
            a, b, c = b, c, a + b + c
        return c
$PY$,
$JS$var tribonacci = function(n) {
    if (n === 0) return 0;
    if (n <= 2) return 1;
    let a = 0, b = 1, c = 1;
    for (let i = 0; i < n - 2; i++) {
        const d = a + b + c;
        a = b; b = c; c = d;
    }
    return c;
};
$JS$,
$JAVA$class Solution {
    public int tribonacci(int n) {
        if (n == 0) return 0;
        if (n <= 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 0; i < n - 2; i++) {
            int d = a + b + c;
            a = b; b = c; c = d;
        }
        return c;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int tribonacci(int n) {
        if (n == 0) return 0;
        if (n <= 2) return 1;
        int a = 0, b = 1, c = 1;
        for (int i = 0; i < n - 2; i++) {
            int d = a + b + c;
            a = b; b = c; c = d;
        }
        return c;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 2) divisor-game (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('divisor-game', 'dp', 'Divisor Game', 'Easy',
$$<p>Alice and Bob take turns starting with Alice. On each turn a player chooses any <code>0 &lt; x &lt; n</code> with <code>n % x == 0</code> and replaces <code>n</code> with <code>n - x</code>. A player loses if they cannot make a move. Both play optimally — return <code>true</code> if Alice wins.</p>$$,
'', ARRAY[
  'Compute f(n) = "current player wins from n" by DP: f(n) is true iff some divisor choice leaves the opponent in a losing position.',
  'Tabulating for small n reveals a pattern: Alice wins iff n is even.',
  'Intuition for the parity: from an even n Alice can always play x = 1 and hand Bob an odd number; from any odd n every proper divisor is odd, so subtracting produces an even number.'
], '300', 'https://leetcode.com/problems/divisor-game/',
'divisorGame',
'[{"name":"n","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["2"],"expected":"true"},
  {"inputs":["3"],"expected":"false"},
  {"inputs":["4"],"expected":"true"},
  {"inputs":["5"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('divisor-game', 'python',
$PY$class Solution:
    def divisorGame(self, n: int) -> bool:
        $PY$),
('divisor-game', 'javascript',
$JS$/**
 * @param {number} n
 * @return {boolean}
 */
var divisorGame = function(n) {

};$JS$),
('divisor-game', 'java',
$JAVA$class Solution {
    public boolean divisorGame(int n) {

    }
}$JAVA$),
('divisor-game', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool divisorGame(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('divisor-game', 1, 'Parity Shortcut',
'From an even n, Alice can always play x = 1, giving Bob an odd number. Every proper divisor of an odd number is itself odd, and odd − odd = even, so Bob is forced to return an even number to Alice. Induction: Alice wins exactly when n is even.',
'["Return n % 2 == 0."]'::jsonb,
$PY$class Solution:
    def divisorGame(self, n: int) -> bool:
        return n % 2 == 0
$PY$,
$JS$var divisorGame = function(n) {
    return n % 2 === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean divisorGame(int n) {
        return n % 2 == 0;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool divisorGame(int n) {
        return n % 2 == 0;
    }
};
$CPP$,
'O(1)', 'O(1)');

-- ============================================================
-- 3) paint-house (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('paint-house', 'dp', 'Paint House', 'Medium',
$$<p>You have <code>n</code> houses in a row and three paint colors: red, blue, green. No two adjacent houses may share a color. <code>costs[i] = [red, blue, green]</code> gives the cost to paint house <code>i</code> each color. Return the minimum total paint cost.</p>$$,
'', ARRAY[
  'Let dp[i][c] be the min cost to paint houses 0..i with house i painted color c.',
  'Transition: dp[i][c] = costs[i][c] + min(dp[i-1][c1], dp[i-1][c2]) for the two other colors.',
  'Only the previous row of 3 values is needed → O(1) extra memory after costs is read.'
], '300', 'https://leetcode.com/problems/paint-house/',
'minCost',
'[{"name":"costs","type":"List[List[int]]"}]'::jsonb,
'int',
'[
  {"inputs":["[[17,2,17],[16,16,5],[14,3,19]]"],"expected":"10"},
  {"inputs":["[[7,6,2]]"],"expected":"2"},
  {"inputs":["[[1,2,3],[1,4,6]]"],"expected":"3"},
  {"inputs":["[[20,18,20]]"],"expected":"18"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('paint-house', 'python',
$PY$class Solution:
    def minCost(self, costs: List[List[int]]) -> int:
        $PY$),
('paint-house', 'javascript',
$JS$/**
 * @param {number[][]} costs
 * @return {number}
 */
var minCost = function(costs) {

};$JS$),
('paint-house', 'java',
$JAVA$class Solution {
    public int minCost(int[][] costs) {

    }
}$JAVA$),
('paint-house', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int minCost(vector<vector<int>>& costs) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('paint-house', 1, 'Rolling DP Across Three Colors',
'At each house the cheapest way to end on color c is cost[i][c] plus the minimum among the other two colors at the previous house. Only the last row matters, so keep three running values and overwrite them.',
'["Initialize r, b, g = costs[0][0], costs[0][1], costs[0][2].","For each subsequent house i: compute nr = costs[i][0] + min(b, g), nb = costs[i][1] + min(r, g), ng = costs[i][2] + min(r, b); then (r, b, g) = (nr, nb, ng).","Return min(r, b, g)."]'::jsonb,
$PY$class Solution:
    def minCost(self, costs: List[List[int]]) -> int:
        r, b, g = costs[0]
        for i in range(1, len(costs)):
            r, b, g = (
                costs[i][0] + min(b, g),
                costs[i][1] + min(r, g),
                costs[i][2] + min(r, b),
            )
        return min(r, b, g)
$PY$,
$JS$var minCost = function(costs) {
    let [r, b, g] = costs[0];
    for (let i = 1; i < costs.length; i++) {
        const nr = costs[i][0] + Math.min(b, g);
        const nb = costs[i][1] + Math.min(r, g);
        const ng = costs[i][2] + Math.min(r, b);
        r = nr; b = nb; g = ng;
    }
    return Math.min(r, b, g);
};
$JS$,
$JAVA$class Solution {
    public int minCost(int[][] costs) {
        int r = costs[0][0], b = costs[0][1], g = costs[0][2];
        for (int i = 1; i < costs.length; i++) {
            int nr = costs[i][0] + Math.min(b, g);
            int nb = costs[i][1] + Math.min(r, g);
            int ng = costs[i][2] + Math.min(r, b);
            r = nr; b = nb; g = ng;
        }
        return Math.min(r, Math.min(b, g));
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int minCost(vector<vector<int>>& costs) {
        int r = costs[0][0], b = costs[0][1], g = costs[0][2];
        for (int i = 1; i < (int)costs.size(); i++) {
            int nr = costs[i][0] + min(b, g);
            int nb = costs[i][1] + min(r, g);
            int ng = costs[i][2] + min(r, b);
            r = nr; b = nb; g = ng;
        }
        return min({r, b, g});
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 4) delete-and-earn (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('delete-and-earn', 'dp', 'Delete and Earn', 'Medium',
$$<p>Given an integer array <code>nums</code>, pick any element to earn <code>nums[i]</code> points but you then must delete every occurrence of <code>nums[i] - 1</code> and <code>nums[i] + 1</code>. Repeat until the array is empty. Return the maximum total points.</p>$$,
'', ARRAY[
  'The exact occurrences do not matter — only the total points available at each value matter.',
  'Build an array points[v] = v * count(v) for every value v from 0 to max(nums). The problem reduces to House Robber on points (cannot take adjacent values).',
  'Classic rolling DP: prev1 = max(prev1, prev2 + points[v]); slide window.'
], '300', 'https://leetcode.com/problems/delete-and-earn/',
'deleteAndEarn',
'[{"name":"nums","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[3,4,2]"],"expected":"6"},
  {"inputs":["[2,2,3,3,3,4]"],"expected":"9"},
  {"inputs":["[1]"],"expected":"1"},
  {"inputs":["[1,1,1,2,4,5,5,5,6]"],"expected":"18"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('delete-and-earn', 'python',
$PY$class Solution:
    def deleteAndEarn(self, nums: List[int]) -> int:
        $PY$),
('delete-and-earn', 'javascript',
$JS$/**
 * @param {number[]} nums
 * @return {number}
 */
var deleteAndEarn = function(nums) {

};$JS$),
('delete-and-earn', 'java',
$JAVA$class Solution {
    public int deleteAndEarn(int[] nums) {

    }
}$JAVA$),
('delete-and-earn', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int deleteAndEarn(vector<int>& nums) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('delete-and-earn', 1, 'House Robber on Points Array',
'Taking any copy of v deletes every v-1 and v+1 the same as taking all copies of v. So bucket the input by value and ask "pick a subset of distinct values, no two adjacent, maximize total points" — that is House Robber over points[v] = v * count[v].',
'["Find M = max(nums) and build points[0..M] where points[v] = v * (number of times v appears).","Run rolling DP: prev2 = 0, prev1 = 0. For v in 0..M: (prev1, prev2) = (max(prev1, prev2 + points[v]), prev1).","Return prev1."]'::jsonb,
$PY$class Solution:
    def deleteAndEarn(self, nums: List[int]) -> int:
        if not nums:
            return 0
        M = max(nums)
        points = [0] * (M + 1)
        for x in nums:
            points[x] += x
        prev1, prev2 = 0, 0
        for v in range(M + 1):
            prev1, prev2 = max(prev1, prev2 + points[v]), prev1
        return prev1
$PY$,
$JS$var deleteAndEarn = function(nums) {
    if (!nums.length) return 0;
    const M = Math.max(...nums);
    const points = new Array(M + 1).fill(0);
    for (const x of nums) points[x] += x;
    let prev1 = 0, prev2 = 0;
    for (let v = 0; v <= M; v++) {
        const curr = Math.max(prev1, prev2 + points[v]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
};
$JS$,
$JAVA$class Solution {
    public int deleteAndEarn(int[] nums) {
        if (nums.length == 0) return 0;
        int M = 0;
        for (int x : nums) if (x > M) M = x;
        int[] points = new int[M + 1];
        for (int x : nums) points[x] += x;
        int prev1 = 0, prev2 = 0;
        for (int v = 0; v <= M; v++) {
            int curr = Math.max(prev1, prev2 + points[v]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int deleteAndEarn(vector<int>& nums) {
        if (nums.empty()) return 0;
        int M = *max_element(nums.begin(), nums.end());
        vector<int> points(M + 1, 0);
        for (int x : nums) points[x] += x;
        int prev1 = 0, prev2 = 0;
        for (int v = 0; v <= M; v++) {
            int curr = max(prev1, prev2 + points[v]);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
};
$CPP$,
'O(n + M)', 'O(M)');

-- ============================================================
-- 5) best-sightseeing-pair (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('best-sightseeing-pair', 'dp', 'Best Sightseeing Pair', 'Medium',
$$<p>Given an array <code>values</code>, the score of a pair <code>(i, j)</code> with <code>i &lt; j</code> is <code>values[i] + values[j] + i - j</code>. Return the maximum such score.</p>$$,
'', ARRAY[
  'Rewrite the score as (values[i] + i) + (values[j] - j). The two halves depend on different indices.',
  'Sweep j left to right, tracking best_left = max over i < j of (values[i] + i).',
  'At each j, candidate answer = best_left + (values[j] - j). Then update best_left with values[j] + j.'
], '300', 'https://leetcode.com/problems/best-sightseeing-pair/',
'maxScoreSightseeingPair',
'[{"name":"values","type":"List[int]"}]'::jsonb,
'int',
'[
  {"inputs":["[8,1,5,2,6]"],"expected":"11"},
  {"inputs":["[1,2]"],"expected":"2"},
  {"inputs":["[2,2,2]"],"expected":"3"},
  {"inputs":["[1,3,5]"],"expected":"7"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('best-sightseeing-pair', 'python',
$PY$class Solution:
    def maxScoreSightseeingPair(self, values: List[int]) -> int:
        $PY$),
('best-sightseeing-pair', 'javascript',
$JS$/**
 * @param {number[]} values
 * @return {number}
 */
var maxScoreSightseeingPair = function(values) {

};$JS$),
('best-sightseeing-pair', 'java',
$JAVA$class Solution {
    public int maxScoreSightseeingPair(int[] values) {

    }
}$JAVA$),
('best-sightseeing-pair', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxScoreSightseeingPair(vector<int>& values) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('best-sightseeing-pair', 1, 'Track Best Left Contribution',
'The score values[i] + values[j] + i - j = (values[i] + i) + (values[j] - j). Sweep j and keep a running maximum of values[i] + i over all i < j — the best candidate for the left half.',
'["Initialize best_left = values[0] + 0 and best = 0.","For j from 1 to n - 1: best = max(best, best_left + values[j] - j); best_left = max(best_left, values[j] + j).","Return best."]'::jsonb,
$PY$class Solution:
    def maxScoreSightseeingPair(self, values: List[int]) -> int:
        best_left = values[0]
        best = 0
        for j in range(1, len(values)):
            best = max(best, best_left + values[j] - j)
            best_left = max(best_left, values[j] + j)
        return best
$PY$,
$JS$var maxScoreSightseeingPair = function(values) {
    let bestLeft = values[0];
    let best = 0;
    for (let j = 1; j < values.length; j++) {
        best = Math.max(best, bestLeft + values[j] - j);
        bestLeft = Math.max(bestLeft, values[j] + j);
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int maxScoreSightseeingPair(int[] values) {
        int bestLeft = values[0];
        int best = 0;
        for (int j = 1; j < values.length; j++) {
            best = Math.max(best, bestLeft + values[j] - j);
            bestLeft = Math.max(bestLeft, values[j] + j);
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int maxScoreSightseeingPair(vector<int>& values) {
        int bestLeft = values[0];
        int best = 0;
        for (int j = 1; j < (int)values.size(); j++) {
            best = max(best, bestLeft + values[j] - j);
            bestLeft = max(bestLeft, values[j] + j);
        }
        return best;
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 6) integer-break (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('integer-break', 'dp', 'Integer Break', 'Medium',
$$<p>Break a positive integer <code>n</code> into the sum of at least two positive integers and maximize the product of those parts. Return the largest product achievable.</p>$$,
'', ARRAY[
  'Define dp[i] = max product when i is broken into >= 2 parts. For the first split position j in 1..i-1, dp[i] = max(dp[i], j * (i - j), j * dp[i - j]).',
  'The (j * (i - j)) term covers the case where i - j is not broken further; dp[i - j] covers the case where it is.',
  'Greedy insight (proves optimality): use as many 3s as possible, then 2s. For n <= 3 special-case because n = 2 must split to 1 * 1, n = 3 to 1 * 2.'
], '300', 'https://leetcode.com/problems/integer-break/',
'integerBreak',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["2"],"expected":"1"},
  {"inputs":["10"],"expected":"36"},
  {"inputs":["4"],"expected":"4"},
  {"inputs":["8"],"expected":"18"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('integer-break', 'python',
$PY$class Solution:
    def integerBreak(self, n: int) -> int:
        $PY$),
('integer-break', 'javascript',
$JS$/**
 * @param {number} n
 * @return {number}
 */
var integerBreak = function(n) {

};$JS$),
('integer-break', 'java',
$JAVA$class Solution {
    public int integerBreak(int n) {

    }
}$JAVA$),
('integer-break', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int integerBreak(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('integer-break', 1, 'Bottom-Up DP',
'dp[i] stores the maximum product obtainable by breaking i into 2+ parts. For each i, try every first cut j; the remaining i - j can either stay whole or be broken further (whichever is larger), so dp[i] = max over j of j * max(i - j, dp[i - j]).',
'["Handle n <= 3 explicitly: integerBreak(2) = 1, integerBreak(3) = 2.","Otherwise build dp of size n + 1 with dp[1] = 1, dp[2] = 2, dp[3] = 3 (these are the \"leave whole\" baselines for the subproblem).","For i from 4 to n: dp[i] = max over j in 1..i/2 of dp[j] * dp[i - j].","Return dp[n]."]'::jsonb,
$PY$class Solution:
    def integerBreak(self, n: int) -> int:
        if n <= 3:
            return n - 1
        dp = [0] * (n + 1)
        dp[1], dp[2], dp[3] = 1, 2, 3
        for i in range(4, n + 1):
            best = 0
            for j in range(1, i // 2 + 1):
                best = max(best, dp[j] * dp[i - j])
            dp[i] = best
        return dp[n]
$PY$,
$JS$var integerBreak = function(n) {
    if (n <= 3) return n - 1;
    const dp = new Array(n + 1).fill(0);
    dp[1] = 1; dp[2] = 2; dp[3] = 3;
    for (let i = 4; i <= n; i++) {
        let best = 0;
        for (let j = 1; j <= Math.floor(i / 2); j++) {
            best = Math.max(best, dp[j] * dp[i - j]);
        }
        dp[i] = best;
    }
    return dp[n];
};
$JS$,
$JAVA$class Solution {
    public int integerBreak(int n) {
        if (n <= 3) return n - 1;
        int[] dp = new int[n + 1];
        dp[1] = 1; dp[2] = 2; dp[3] = 3;
        for (int i = 4; i <= n; i++) {
            int best = 0;
            for (int j = 1; j <= i / 2; j++) {
                best = Math.max(best, dp[j] * dp[i - j]);
            }
            dp[i] = best;
        }
        return dp[n];
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int integerBreak(int n) {
        if (n <= 3) return n - 1;
        vector<int> dp(n + 1, 0);
        dp[1] = 1; dp[2] = 2; dp[3] = 3;
        for (int i = 4; i <= n; i++) {
            int best = 0;
            for (int j = 1; j <= i / 2; j++) {
                best = max(best, dp[j] * dp[i - j]);
            }
            dp[i] = best;
        }
        return dp[n];
    }
};
$CPP$,
'O(n^2)', 'O(n)');

-- ============================================================
-- 7) longest-valid-parentheses (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('longest-valid-parentheses', 'dp', 'Longest Valid Parentheses', 'Hard',
$$<p>Given a string <code>s</code> containing only <code>(</code> and <code>)</code>, return the length of the longest substring that is a valid (well-formed) parentheses sequence.</p>$$,
'', ARRAY[
  'Let dp[i] = the length of the longest valid substring ending at index i. It is 0 whenever s[i] == ''('' because a valid sequence must end with )".',
  'If s[i] == '')'' and s[i - 1] == ''('' then dp[i] = dp[i - 2] + 2.',
  'If s[i] == '')'' and s[i - 1] == '')'' then the match for this close is at i - dp[i - 1] - 1. If that character is ''('', dp[i] = dp[i - 1] + 2 + dp[i - dp[i - 1] - 2].'
], '300', 'https://leetcode.com/problems/longest-valid-parentheses/',
'longestValidParentheses',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"(()\""],"expected":"2"},
  {"inputs":["\")()())\""],"expected":"4"},
  {"inputs":["\"\""],"expected":"0"},
  {"inputs":["\"()(()\""],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('longest-valid-parentheses', 'python',
$PY$class Solution:
    def longestValidParentheses(self, s: str) -> int:
        $PY$),
('longest-valid-parentheses', 'javascript',
$JS$/**
 * @param {string} s
 * @return {number}
 */
var longestValidParentheses = function(s) {

};$JS$),
('longest-valid-parentheses', 'java',
$JAVA$class Solution {
    public int longestValidParentheses(String s) {

    }
}$JAVA$),
('longest-valid-parentheses', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int longestValidParentheses(string& s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('longest-valid-parentheses', 1, 'DP by End Position',
'Every valid substring must end with '')''. For an ending '')'', either the previous character is ''('' (making an isolated pair we can extend with the valid prefix at i - 2), or it is '')'' and we must jump past the existing valid run to the matching ''(''. Tracking the best valid length ending at each index in one left-to-right sweep gives O(n).',
'["Create dp of length n, filled with 0.","For i from 1 to n - 1, only when s[i] == '')'':","  Case A: s[i-1] == ''('' — dp[i] = (i >= 2 ? dp[i-2] : 0) + 2.","  Case B: s[i-1] == '')'' and i - dp[i-1] - 1 >= 0 and s[i - dp[i-1] - 1] == ''('' — dp[i] = dp[i-1] + 2 + (i - dp[i-1] - 2 >= 0 ? dp[i - dp[i-1] - 2] : 0).","Return max(dp)."]'::jsonb,
$PY$class Solution:
    def longestValidParentheses(self, s: str) -> int:
        n = len(s)
        dp = [0] * n
        best = 0
        for i in range(1, n):
            if s[i] == ')':
                if s[i - 1] == '(':
                    dp[i] = (dp[i - 2] if i >= 2 else 0) + 2
                else:
                    j = i - dp[i - 1] - 1
                    if j >= 0 and s[j] == '(':
                        dp[i] = dp[i - 1] + 2 + (dp[j - 1] if j - 1 >= 0 else 0)
                if dp[i] > best:
                    best = dp[i]
        return best
$PY$,
$JS$var longestValidParentheses = function(s) {
    const n = s.length;
    const dp = new Array(n).fill(0);
    let best = 0;
    for (let i = 1; i < n; i++) {
        if (s[i] === ')') {
            if (s[i - 1] === '(') {
                dp[i] = (i >= 2 ? dp[i - 2] : 0) + 2;
            } else {
                const j = i - dp[i - 1] - 1;
                if (j >= 0 && s[j] === '(') {
                    dp[i] = dp[i - 1] + 2 + (j - 1 >= 0 ? dp[j - 1] : 0);
                }
            }
            if (dp[i] > best) best = dp[i];
        }
    }
    return best;
};
$JS$,
$JAVA$class Solution {
    public int longestValidParentheses(String s) {
        int n = s.length();
        int[] dp = new int[n];
        int best = 0;
        for (int i = 1; i < n; i++) {
            if (s.charAt(i) == ')') {
                if (s.charAt(i - 1) == '(') {
                    dp[i] = (i >= 2 ? dp[i - 2] : 0) + 2;
                } else {
                    int j = i - dp[i - 1] - 1;
                    if (j >= 0 && s.charAt(j) == '(') {
                        dp[i] = dp[i - 1] + 2 + (j - 1 >= 0 ? dp[j - 1] : 0);
                    }
                }
                if (dp[i] > best) best = dp[i];
            }
        }
        return best;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int longestValidParentheses(string& s) {
        int n = s.size();
        vector<int> dp(n, 0);
        int best = 0;
        for (int i = 1; i < n; i++) {
            if (s[i] == ')') {
                if (s[i - 1] == '(') {
                    dp[i] = (i >= 2 ? dp[i - 2] : 0) + 2;
                } else {
                    int j = i - dp[i - 1] - 1;
                    if (j >= 0 && s[j] == '(') {
                        dp[i] = dp[i - 1] + 2 + (j - 1 >= 0 ? dp[j - 1] : 0);
                    }
                }
                if (dp[i] > best) best = dp[i];
            }
        }
        return best;
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 8) frog-jump (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('frog-jump', 'dp', 'Frog Jump', 'Hard',
$$<p>A frog is crossing a river on stones at positions <code>stones</code> (sorted ascending, starting at 0). The frog starts on the first stone with a last jump of <code>0</code> and can only jump to a stone forward. If its last jump was <code>k</code>, the next jump must be <code>k - 1</code>, <code>k</code>, or <code>k + 1</code> units — and only if that lands on another stone. Return whether the frog can reach the last stone.</p>$$,
'', ARRAY[
  'State = (stone index, last jump size). The frog succeeds from the last stone regardless of the jump.',
  'Memoize "can reach the end from this state?" as a hash of (position, k).',
  'Fast early exit: if stones[i+1] - stones[i] > i + 1 for any i, impossible (max jump after i steps is i + 1).'
], '300', 'https://leetcode.com/problems/frog-jump/',
'canCross',
'[{"name":"stones","type":"List[int]"}]'::jsonb,
'bool',
'[
  {"inputs":["[0,1,3,5,6,8,12,17]"],"expected":"true"},
  {"inputs":["[0,1,2,3,4,8,9,11]"],"expected":"false"},
  {"inputs":["[0,1]"],"expected":"true"},
  {"inputs":["[0,2]"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('frog-jump', 'python',
$PY$class Solution:
    def canCross(self, stones: List[int]) -> bool:
        $PY$),
('frog-jump', 'javascript',
$JS$/**
 * @param {number[]} stones
 * @return {boolean}
 */
var canCross = function(stones) {

};$JS$),
('frog-jump', 'java',
$JAVA$class Solution {
    public boolean canCross(int[] stones) {

    }
}$JAVA$),
('frog-jump', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canCross(vector<int>& stones) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('frog-jump', 1, 'Stone → Reachable-Jump-Sizes Map',
'For every stone, we maintain the set of jump lengths that could have landed on it. From a stone s with a set of incoming jumps, the frog can next jump k-1, k, k+1 for each k in that set — if the resulting position is itself a stone, add that jump length to that stone''s set. The last stone is reachable iff its jump set is non-empty at the end.',
'["Build a hash map positions[stone] → set of jump sizes that can arrive there. Initialize positions[0] = {0}.","Walk each stone s in ascending order. For every k in positions[s] and every step in {k - 1, k, k + 1} with step > 0: if s + step is a known stone, add step to positions[s + step].","Return true iff positions[stones[-1]] is non-empty."]'::jsonb,
$PY$class Solution:
    def canCross(self, stones: List[int]) -> bool:
        positions = {stone: set() for stone in stones}
        positions[0].add(0)
        for s in stones:
            for k in positions[s]:
                for step in (k - 1, k, k + 1):
                    if step > 0 and (s + step) in positions:
                        positions[s + step].add(step)
        return bool(positions[stones[-1]])
$PY$,
$JS$var canCross = function(stones) {
    const positions = new Map();
    for (const s of stones) positions.set(s, new Set());
    positions.get(0).add(0);
    for (const s of stones) {
        for (const k of positions.get(s)) {
            for (const step of [k - 1, k, k + 1]) {
                if (step > 0 && positions.has(s + step)) {
                    positions.get(s + step).add(step);
                }
            }
        }
    }
    return positions.get(stones[stones.length - 1]).size > 0;
};
$JS$,
$JAVA$class Solution {
    public boolean canCross(int[] stones) {
        Map<Integer, Set<Integer>> positions = new HashMap<>();
        for (int s : stones) positions.put(s, new HashSet<>());
        positions.get(0).add(0);
        for (int s : stones) {
            for (int k : positions.get(s)) {
                for (int step : new int[]{k - 1, k, k + 1}) {
                    if (step > 0 && positions.containsKey(s + step)) {
                        positions.get(s + step).add(step);
                    }
                }
            }
        }
        return !positions.get(stones[stones.length - 1]).isEmpty();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool canCross(vector<int>& stones) {
        unordered_map<int, unordered_set<int>> positions;
        for (int s : stones) positions[s];
        positions[0].insert(0);
        for (int s : stones) {
            vector<int> jumps(positions[s].begin(), positions[s].end());
            for (int k : jumps) {
                for (int step : {k - 1, k, k + 1}) {
                    if (step > 0 && positions.count(s + step)) {
                        positions[s + step].insert(step);
                    }
                }
            }
        }
        return !positions[stones.back()].empty();
    }
};
$CPP$,
'O(n^2)', 'O(n^2)');

COMMIT;
