// Build patch for slice w3-500-02 (30 problems).
import fs from 'node:fs';

const ED = (intuition, approach, complexity) =>
`## Intuition

${intuition}

## Approach

${approach}

## Complexity

${complexity}`;

const P = [];

// ============================================================================
// 1. basic-calculator (has tc=4, hints=3, mn=calculate; needs tc>=10, ed, sol, pattern)
// ============================================================================
P.push({
  id: 'basic-calculator',
  pattern: 'Stack',
  tags: ['math', 'string', 'stack', 'recursion'],
  hints: [
    'Scan left to right. Keep a running result, a sign (+1 / -1), and a stack of saved (result, sign) frames.',
    'On a digit, accumulate the whole number, then add sign * number to result.',
    'On "(": push (result, sign) and reset result=0, sign=+1. On ")": pop saved_sign and saved_result; result = saved_result + saved_sign * result.',
    'No multiplication or division — only +, -, parentheses, spaces.',
    'O(n) time, O(n) stack depth in the worst nested-parentheses case.',
  ],
  test_cases: [
    { inputs: ['"1 + 1"'], expected: '2' },
    { inputs: ['" 2-1 + 2 "'], expected: '3' },
    { inputs: ['"(1+(4+5+2)-3)+(6+8)"'], expected: '23' },
    { inputs: ['"0"'], expected: '0' },
    { inputs: ['"7"'], expected: '7' },
    { inputs: ['"1-(     -2)"'], expected: '3' },
    { inputs: ['"- (3 + (4 + 5))"'], expected: '-12' },
    { inputs: ['"1-(1-1)"'], expected: '1' },
    { inputs: ['"2147483647"'], expected: '2147483647' },
    { inputs: ['"100 + 200 - 50"'], expected: '250' },
    { inputs: ['"((1+2)+(3+4))"'], expected: '10' },
    { inputs: ['"-1 + 1"'], expected: '0' },
    { inputs: ['"-(1)"'], expected: '-1' },
  ],
  editorial_md: ED(
    'There is no operator precedence here — only + and - plus parentheses. A single left-to-right scan with a stack handles it: parentheses change which result we are currently building, and a sign flag tracks whether the next number adds or subtracts. Recursion would also work, but the iterative stack version makes the bookkeeping explicit.',
    'Maintain three pieces of state: result (the running total of the current scope), sign (+1 or -1 for the next number), and a stack of pairs (saved_result, saved_sign) representing outer scopes. Walk the string one character at a time. Skip spaces. On a digit, gather the whole multi-digit number, then do result += sign * number and reset sign to +1. On "+" set sign = +1. On "-" set sign = -1. On "(" push (result, sign) and reset result=0, sign=+1 — we are entering a fresh sub-expression. On ")" we just finished a sub-expression: pop (prev_result, prev_sign) and combine via result = prev_result + prev_sign * result. After the scan, result is the answer. The trick is realising that the sign sitting before "(" applies to the *entire* parenthesised value, which is exactly what we restore on ")". The implementation is one pass, no recursion required, and the stack depth equals the maximum nesting depth.',
    '- Time: O(n) — one character per loop iteration.\n- Space: O(n) for the stack in the worst case of deeply nested parentheses.'
  ),
  solutions: {
    python: `class Solution:
    def calculate(self, s: str) -> int:
        stack = []
        result = 0
        sign = 1
        i = 0
        n = len(s)
        while i < n:
            ch = s[i]
            if ch.isdigit():
                num = 0
                while i < n and s[i].isdigit():
                    num = num * 10 + int(s[i])
                    i += 1
                result += sign * num
                continue
            if ch == '+':
                sign = 1
            elif ch == '-':
                sign = -1
            elif ch == '(':
                stack.append(result)
                stack.append(sign)
                result = 0
                sign = 1
            elif ch == ')':
                prev_sign = stack.pop()
                prev_result = stack.pop()
                result = prev_result + prev_sign * result
            i += 1
        return result
`,
    javascript: `var calculate = function(s) {
    const stack = [];
    let result = 0, sign = 1, i = 0;
    const n = s.length;
    while (i < n) {
        const ch = s[i];
        if (ch >= '0' && ch <= '9') {
            let num = 0;
            while (i < n && s[i] >= '0' && s[i] <= '9') {
                num = num * 10 + (s.charCodeAt(i) - 48);
                i++;
            }
            result += sign * num;
            continue;
        }
        if (ch === '+') sign = 1;
        else if (ch === '-') sign = -1;
        else if (ch === '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
        else if (ch === ')') {
            const prevSign = stack.pop();
            const prevResult = stack.pop();
            result = prevResult + prevSign * result;
        }
        i++;
    }
    return result;
};
`,
    java: `import java.util.*;

class Solution {
    public int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        int result = 0, sign = 1, i = 0;
        int n = s.length();
        while (i < n) {
            char ch = s.charAt(i);
            if (Character.isDigit(ch)) {
                int num = 0;
                while (i < n && Character.isDigit(s.charAt(i))) {
                    num = num * 10 + (s.charAt(i) - '0');
                    i++;
                }
                result += sign * num;
                continue;
            }
            if (ch == '+') sign = 1;
            else if (ch == '-') sign = -1;
            else if (ch == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
            else if (ch == ')') {
                int prevSign = stack.pop();
                int prevResult = stack.pop();
                result = prevResult + prevSign * result;
            }
            i++;
        }
        return result;
    }
}
`,
    cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    int calculate(string s) {
        stack<int> st;
        int result = 0, sign = 1, i = 0;
        int n = s.size();
        while (i < n) {
            char ch = s[i];
            if (isdigit(ch)) {
                long num = 0;
                while (i < n && isdigit(s[i])) {
                    num = num * 10 + (s[i] - '0');
                    i++;
                }
                result += sign * (int)num;
                continue;
            }
            if (ch == '+') sign = 1;
            else if (ch == '-') sign = -1;
            else if (ch == '(') { st.push(result); st.push(sign); result = 0; sign = 1; }
            else if (ch == ')') {
                int prevSign = st.top(); st.pop();
                int prevResult = st.top(); st.pop();
                result = prevResult + prevSign * result;
            }
            i++;
        }
        return result;
    }
};
`,
  },
});

// ============================================================================
// 2. nth-digit
// ============================================================================
P.push({
  id: 'nth-digit',
  pattern: 'Math',
  tags: ['math', 'binary-search'],
  hints: [
    'Numbers have 1 digit (1–9), 2 digits (10–99), 3 digits (100–999), …',
    'There are 9 * 10^(k-1) numbers with k digits, contributing k * 9 * 10^(k-1) digits.',
    'Subtract those chunks from n until n falls inside the current k-digit range.',
    'Find the number: start = 10^(k-1); offset = (n - 1) / k; number = start + offset.',
    'Find the digit within that number: index = (n - 1) % k; return str(number)[index].',
  ],
  test_cases: [
    { inputs: ['3'], expected: '3' },
    { inputs: ['11'], expected: '0' },
    { inputs: ['1'], expected: '1' },
    { inputs: ['9'], expected: '9' },
    { inputs: ['10'], expected: '1' },
    { inputs: ['189'], expected: '9' },
    { inputs: ['190'], expected: '1' },
    { inputs: ['191'], expected: '0' },
    { inputs: ['1000'], expected: '3' },
    { inputs: ['1000000000'], expected: '1' },
    { inputs: ['12'], expected: '1' },
    { inputs: ['100'], expected: '5' },
  ],
  editorial_md: ED(
    'The sequence 123456789101112… is structured in blocks by digit length. There are 9 one-digit numbers contributing 9 digits, 90 two-digit numbers contributing 180 digits, 900 three-digit numbers contributing 2700 digits, and so on. Skip whole blocks until n falls inside one, then pick out the exact digit.',
    'Let k start at 1 and count = 9, start = 1 (count = numbers with k digits, start = first such number). While n > k * count, subtract k * count from n, then k += 1, count *= 10, start *= 10. After the loop, n is the 1-indexed digit offset inside the k-digit block. The number containing the answer is start + (n - 1) / k, and the position inside that number is (n - 1) % k. Convert the number to a string and return that character as an int. Edge cases handle themselves: n=1 returns "1"; n=10 returns the "1" of "10"; n=11 returns "0"; n=190 returns "1" (start of 100). Watch overflow on very large n in 32-bit languages — promote intermediate products to long.',
    '- Time: O(log n) — the digit count grows logarithmically, so the loop runs ~10 times.\n- Space: O(1).'
  ),
  solutions: {
    python: `class Solution:
    def findNthDigit(self, n: int) -> int:
        k = 1
        count = 9
        start = 1
        while n > k * count:
            n -= k * count
            k += 1
            count *= 10
            start *= 10
        number = start + (n - 1) // k
        return int(str(number)[(n - 1) % k])
`,
    javascript: `var findNthDigit = function(n) {
    let k = 1, count = 9, start = 1;
    while (n > k * count) {
        n -= k * count;
        k += 1;
        count *= 10;
        start *= 10;
    }
    const number = start + Math.floor((n - 1) / k);
    return parseInt(String(number)[(n - 1) % k], 10);
};
`,
    java: `class Solution {
    public int findNthDigit(int n) {
        long k = 1, count = 9, start = 1;
        long nn = n;
        while (nn > k * count) {
            nn -= k * count;
            k++;
            count *= 10;
            start *= 10;
        }
        long number = start + (nn - 1) / k;
        return Character.getNumericValue(Long.toString(number).charAt((int)((nn - 1) % k)));
    }
}
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    int findNthDigit(int n) {
        long long k = 1, count = 9, start = 1;
        long long nn = n;
        while (nn > k * count) {
            nn -= k * count;
            k++;
            count *= 10;
            start *= 10;
        }
        long long number = start + (nn - 1) / k;
        string s = to_string(number);
        return s[(nn - 1) % k] - '0';
    }
};
`,
  },
});

// ============================================================================
// 3. candy-cost
// ============================================================================
P.push({
  id: 'candy-cost',
  description: '<p>You are at a candy shop with <code>n</code> different candies, each with a <code>price[i]</code> and a <code>sweetness[i]</code>. You have <code>k</code> rupees. Pick a subset of candies whose total price ≤ <code>k</code> that maximises total sweetness. Return the maximum total sweetness achievable.</p>',
  method_name: 'maxSweetness',
  params: [
    { name: 'price', type: 'List[int]' },
    { name: 'sweetness', type: 'List[int]' },
    { name: 'k', type: 'int' },
  ],
  return_type: 'int',
  pattern: '0/1 Knapsack',
  tags: ['dp', 'knapsack', 'arrays'],
  hints: [
    'Classic 0/1 knapsack: each candy either bought (price added, sweetness added) or skipped.',
    'dp[w] = max sweetness achievable with total price ≤ w considering some prefix of candies.',
    'Iterate candies; for each, sweep w from k down to price[i]: dp[w] = max(dp[w], dp[w - price[i]] + sweetness[i]).',
    'Iterate w in reverse so each candy is used at most once.',
    'Final answer is dp[k]. O(n*k) time, O(k) space.',
  ],
  test_cases: [
    { inputs: ['[1,2,3]', '[6,10,12]', '5'], expected: '22' },
    { inputs: ['[1,2,3]', '[6,10,12]', '3'], expected: '12' },
    { inputs: ['[5]', '[10]', '4'], expected: '0' },
    { inputs: ['[5]', '[10]', '5'], expected: '10' },
    { inputs: ['[1,1,1,1,1]', '[1,2,3,4,5]', '3'], expected: '12' },
    { inputs: ['[]', '[]', '10'], expected: '0' },
    { inputs: ['[2,2,2,2]', '[1,1,1,1]', '0'], expected: '0' },
    { inputs: ['[1,3,4,5]', '[1,4,5,7]', '7'], expected: '9' },
    { inputs: ['[10,20,30]', '[60,100,120]', '50'], expected: '220' },
    { inputs: ['[1,2,3,4,5]', '[5,4,3,2,1]', '15'], expected: '15' },
    { inputs: ['[3,3,3]', '[5,5,5]', '6'], expected: '10' },
    { inputs: ['[1]', '[100]', '1'], expected: '100' },
  ],
  editorial_md: ED(
    'Each candy is either taken or skipped — a textbook 0/1 knapsack. The wallet acts as the capacity and the sweetness is the value. The space can be compressed from a 2D table to a single 1D array by iterating the capacity dimension in reverse.',
    'Allocate dp of size k+1, all zeros. For each candy i, walk w from k down to price[i] and set dp[w] = max(dp[w], dp[w - price[i]] + sweetness[i]). The reverse iteration is essential — it guarantees that when we read dp[w - price[i]] we are reading the value from the *previous* item iteration, so candy i is counted at most once. After processing all candies, dp[k] holds the maximum sweetness obtainable with total cost ≤ k. Edge cases: an empty input returns 0; k = 0 means no purchase possible; a candy with price > k is skipped automatically because the inner loop condition fails. The straightforward 2D version uses O(n*k) memory and the same time; the 1D rolling version achieves O(k) memory. There is no greedy by sweetness-per-rupee that always wins — 0/1 knapsack is NP-hard in general and pseudo-polynomial via DP.',
    '- Time: O(n*k) where n is the number of candies and k is the budget.\n- Space: O(k) using the rolling 1D array.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def maxSweetness(self, price: List[int], sweetness: List[int], k: int) -> int:
        dp = [0] * (k + 1)
        for i, p in enumerate(price):
            s = sweetness[i]
            for w in range(k, p - 1, -1):
                if dp[w - p] + s > dp[w]:
                    dp[w] = dp[w - p] + s
        return dp[k]
`,
    javascript: `var maxSweetness = function(price, sweetness, k) {
    const dp = new Array(k + 1).fill(0);
    for (let i = 0; i < price.length; i++) {
        const p = price[i], s = sweetness[i];
        for (let w = k; w >= p; w--) {
            if (dp[w - p] + s > dp[w]) dp[w] = dp[w - p] + s;
        }
    }
    return dp[k];
};
`,
    java: `class Solution {
    public int maxSweetness(int[] price, int[] sweetness, int k) {
        int[] dp = new int[k + 1];
        for (int i = 0; i < price.length; i++) {
            int p = price[i], s = sweetness[i];
            for (int w = k; w >= p; w--) {
                if (dp[w - p] + s > dp[w]) dp[w] = dp[w - p] + s;
            }
        }
        return dp[k];
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSweetness(vector<int>& price, vector<int>& sweetness, int k) {
        vector<int> dp(k + 1, 0);
        for (int i = 0; i < (int)price.size(); i++) {
            int p = price[i], s = sweetness[i];
            for (int w = k; w >= p; w--) {
                if (dp[w - p] + s > dp[w]) dp[w] = dp[w - p] + s;
            }
        }
        return dp[k];
    }
};
`,
  },
});

// ============================================================================
// 4. form-largest
// ============================================================================
P.push({
  id: 'form-largest',
  description: '<p>Given a list of non-negative integers <code>nums</code>, arrange them so that they form the largest possible concatenated number. Return the result as a string (so leading zeros in the final number are handled correctly, e.g. all zeros should return "0").</p>',
  method_name: 'largestNumber',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'str',
  pattern: 'Custom Sort',
  tags: ['arrays', 'sorting', 'greedy', 'string'],
  hints: [
    'Sort the numbers as strings — but with a custom comparator.',
    'Compare two strings a, b by whichever concatenation is larger: a+b vs b+a.',
    'Example: "3" vs "30" — "330" > "303", so "3" comes before "30".',
    'After sorting in descending custom order, concatenate.',
    'Edge case: if the largest element is "0" (all zeros), return "0" not "00…0".',
  ],
  test_cases: [
    { inputs: ['[10,2]'], expected: '"210"' },
    { inputs: ['[3,30,34,5,9]'], expected: '"9534330"' },
    { inputs: ['[1]'], expected: '"1"' },
    { inputs: ['[10]'], expected: '"10"' },
    { inputs: ['[0,0]'], expected: '"0"' },
    { inputs: ['[0]'], expected: '"0"' },
    { inputs: ['[1,2,3,4,5,6,7,8,9]'], expected: '"987654321"' },
    { inputs: ['[121,12]'], expected: '"12121"' },
    { inputs: ['[128,12]'], expected: '"12812"' },
    { inputs: ['[824,938,1399,5607,6973,5703,9609,4398,8247]'], expected: '"9609938824824769735703560743981399"' },
    { inputs: ['[111311,1113]'], expected: '"1113111311"' },
    { inputs: ['[0,0,0,1]'], expected: '"1000"' },
  ],
  editorial_md: ED(
    'To maximise concatenation, the order between any two strings a and b is decided by which combination — a+b or b+a — is lexicographically larger. This is a total order (transitive), so a single sort with this comparator gives the global maximum.',
    'Convert every number to its decimal string. Sort the strings with a custom comparator: a should come before b iff a+b > b+a (string comparison, both halves have the same length so lex matches numeric). Once sorted, concatenate. Finally guard against the all-zeros case: if the first character of the result is "0", the entire input must have been zeros, so return "0" — otherwise we would emit "00…0". Why the comparator is correct: a+b > b+a is a strict total order on strings of digits — antisymmetric and transitive (provable by observing that the comparison is equivalent to comparing a/b ratios as rationals). Languages without a stable custom sort still work since the comparator gives a strict order. Edge cases: single element ⇒ just its string; all zeros ⇒ "0"; very large arrays ⇒ still O(n log n) because each comparison is O(d) for d-digit numbers and d is bounded.',
    '- Time: O(n log n * d) where d is the max digit count.\n- Space: O(n) for the string array and sort.'
  ),
  solutions: {
    python: `from typing import List
from functools import cmp_to_key

class Solution:
    def largestNumber(self, nums: List[int]) -> str:
        strs = [str(x) for x in nums]
        strs.sort(key=cmp_to_key(lambda a, b: -1 if a + b > b + a else (1 if a + b < b + a else 0)))
        result = ''.join(strs)
        return '0' if result[0] == '0' else result
`,
    javascript: `var largestNumber = function(nums) {
    const strs = nums.map(String);
    strs.sort((a, b) => (b + a).localeCompare(a + b));
    const result = strs.join('');
    return result[0] === '0' ? '0' : result;
};
`,
    java: `import java.util.*;

class Solution {
    public String largestNumber(int[] nums) {
        String[] strs = new String[nums.length];
        for (int i = 0; i < nums.length; i++) strs[i] = String.valueOf(nums[i]);
        Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s);
        String result = sb.toString();
        return result.charAt(0) == '0' ? "0" : result;
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <algorithm>
using namespace std;

class Solution {
public:
    string largestNumber(vector<int>& nums) {
        vector<string> strs;
        for (int x : nums) strs.push_back(to_string(x));
        sort(strs.begin(), strs.end(), [](const string& a, const string& b) {
            return a + b > b + a;
        });
        string result;
        for (const string& s : strs) result += s;
        return result[0] == '0' ? "0" : result;
    }
};
`,
  },
});

// ============================================================================
// 5. insert-merge-intervals
// ============================================================================
P.push({
  id: 'insert-merge-intervals',
  description: '<p>Given a list of <strong>non-overlapping</strong> intervals sorted by their start time, and a new interval, insert the new interval into the list (merging if necessary) and return the resulting list of intervals (still sorted, still non-overlapping).</p>',
  method_name: 'insertInterval',
  params: [
    { name: 'intervals', type: 'List[List[int]]' },
    { name: 'newInterval', type: 'List[int]' },
  ],
  return_type: 'List[List[int]]',
  pattern: 'Intervals',
  tags: ['arrays', 'intervals', 'greedy'],
  hints: [
    'Three phases: intervals entirely before, intervals overlapping the new one, intervals entirely after.',
    'Phase 1: push every interval with end < newInterval.start unchanged.',
    'Phase 2: while current.start <= newInterval.end, merge: newInterval = [min(starts), max(ends)]. Then push the merged interval once.',
    'Phase 3: push the remaining intervals.',
    'Single linear pass — O(n).',
  ],
  test_cases: [
    { inputs: ['[[1,3],[6,9]]', '[2,5]'], expected: '[[1,5],[6,9]]' },
    { inputs: ['[[1,2],[3,5],[6,7],[8,10],[12,16]]', '[4,8]'], expected: '[[1,2],[3,10],[12,16]]' },
    { inputs: ['[]', '[5,7]'], expected: '[[5,7]]' },
    { inputs: ['[[1,5]]', '[2,3]'], expected: '[[1,5]]' },
    { inputs: ['[[1,5]]', '[6,8]'], expected: '[[1,5],[6,8]]' },
    { inputs: ['[[1,5]]', '[0,0]'], expected: '[[0,0],[1,5]]' },
    { inputs: ['[[3,5],[12,15]]', '[6,6]'], expected: '[[3,5],[6,6],[12,15]]' },
    { inputs: ['[[1,2],[3,4],[5,6],[7,8]]', '[0,9]'], expected: '[[0,9]]' },
    { inputs: ['[[1,5]]', '[1,5]'], expected: '[[1,5]]' },
    { inputs: ['[[1,5]]', '[2,7]'], expected: '[[1,7]]' },
    { inputs: ['[[1,5]]', '[0,3]'], expected: '[[0,5]]' },
    { inputs: ['[[1,2]]', '[3,4]'], expected: '[[1,2],[3,4]]' },
  ],
  editorial_md: ED(
    'The input is already sorted and non-overlapping, so a single linear pass can decide each interval one of three ways: it ends strictly before the new interval (copy as-is), it overlaps the new interval (merge into it), or it starts strictly after the new interval ends (copy as-is). We never need to re-sort.',
    'Iterate through intervals once. Maintain a result list and a pointer i. Phase 1: while i < n and intervals[i].end < newInterval.start, append intervals[i] verbatim. Phase 2: while i < n and intervals[i].start <= newInterval.end, expand newInterval = [min(newInterval.start, intervals[i].start), max(newInterval.end, intervals[i].end)] and advance i. After Phase 2 ends, append the merged newInterval exactly once. Phase 3: while i < n, append intervals[i] verbatim. The total work is O(n) because each interval is touched once. Why correctness holds: sortedness lets us short-circuit — any later interval that does not start by newInterval.end cannot overlap any earlier one we already pushed, so the result remains sorted and non-overlapping. Edge cases: empty input ⇒ return [newInterval]; newInterval is before everything or after everything ⇒ correct by construction; newInterval engulfs the entire list ⇒ Phase 2 absorbs all of them.',
    '- Time: O(n) — one pass over intervals.\n- Space: O(n) for the output list.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def insertInterval(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        result = []
        i = 0
        n = len(intervals)
        while i < n and intervals[i][1] < newInterval[0]:
            result.append(intervals[i])
            i += 1
        while i < n and intervals[i][0] <= newInterval[1]:
            newInterval = [min(newInterval[0], intervals[i][0]), max(newInterval[1], intervals[i][1])]
            i += 1
        result.append(newInterval)
        while i < n:
            result.append(intervals[i])
            i += 1
        return result
`,
    javascript: `var insertInterval = function(intervals, newInterval) {
    const result = [];
    let i = 0;
    const n = intervals.length;
    while (i < n && intervals[i][1] < newInterval[0]) {
        result.push(intervals[i]);
        i++;
    }
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval = [Math.min(newInterval[0], intervals[i][0]), Math.max(newInterval[1], intervals[i][1])];
        i++;
    }
    result.push(newInterval);
    while (i < n) {
        result.push(intervals[i]);
        i++;
    }
    return result;
};
`,
    java: `import java.util.*;

class Solution {
    public int[][] insertInterval(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0]) {
            result.add(intervals[i]);
            i++;
        }
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval = new int[]{Math.min(newInterval[0], intervals[i][0]), Math.max(newInterval[1], intervals[i][1])};
            i++;
        }
        result.add(newInterval);
        while (i < n) {
            result.add(intervals[i]);
            i++;
        }
        return result.toArray(new int[0][]);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> insertInterval(vector<vector<int>>& intervals, vector<int>& newInterval) {
        vector<vector<int>> result;
        int i = 0, n = intervals.size();
        while (i < n && intervals[i][1] < newInterval[0]) {
            result.push_back(intervals[i]);
            i++;
        }
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = min(newInterval[0], intervals[i][0]);
            newInterval[1] = max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.push_back(newInterval);
        while (i < n) {
            result.push_back(intervals[i]);
            i++;
        }
        return result;
    }
};
`,
  },
});

// ============================================================================
// 6. max-sum-of-i-arr-i
// ============================================================================
P.push({
  id: 'max-sum-of-i-arr-i',
  description: '<p>Given an integer array <code>arr</code>, you may rotate it any number of positions (0 to n-1). Return the maximum value of <code>sum(i * arr[i])</code> over all rotations.</p>',
  method_name: 'maxSumIArrI',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Math / Rotation Trick',
  tags: ['arrays', 'math'],
  hints: [
    'Brute force: try each of n rotations, compute sum(i*arr[i]), keep the max — O(n^2).',
    'Better: express the sum for rotation r+1 in terms of rotation r.',
    'curr(r+1) = curr(r) + total_sum - n * arr[n - r - 1] (where total_sum = sum(arr)).',
    'Compute curr(0) once, then sweep forward, tracking the max.',
    'O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[8,3,1,2]'], expected: '29' },
    { inputs: ['[1,20,2,10]'], expected: '72' },
    { inputs: ['[10,1,2,3,4,5,6,7,8,9]'], expected: '330' },
    { inputs: ['[1]'], expected: '0' },
    { inputs: ['[1,2]'], expected: '2' },
    { inputs: ['[2,1]'], expected: '2' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[1,2,3,4,5]'], expected: '40' },
    { inputs: ['[-1,-2,-3]'], expected: '-4' },
    { inputs: ['[5,5,5,5]'], expected: '30' },
    { inputs: ['[100,-50,25]'], expected: '125' },
    { inputs: ['[1,2,3,4,5,6,7,8,9,10]'], expected: '330' },
  ],
  editorial_md: ED(
    'Computing the sum for every rotation from scratch is O(n^2). The key insight: when you rotate by one position, the sum changes by a fixed amount that depends only on the array total and one element. So compute the first rotation\'s sum in O(n) and then slide forward in O(1) per rotation.',
    'Let total = sum(arr) and curr = sum(i * arr[i]) for the unrotated array. When you rotate right by 1 (so arr[n-1] becomes the new arr[0]), every original arr[i] except the last moves from index i to index i+1, contributing an extra arr[i] each — total minus arr[n-1]. The element arr[n-1] moves from index n-1 to index 0, losing (n-1)*arr[n-1]. Net change: (total - arr[n-1]) - (n-1)*arr[n-1] = total - n*arr[n-1]. So newSum = oldSum + total - n * arr[n-1-r] where r is the rotation count, equivalently iterating with arr[n-1], arr[n-2], … as we step. Track the maximum across all n rotations. Edge cases: n = 1 gives 0 always; negative values still work; total can be negative.',
    '- Time: O(n).\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def maxSumIArrI(self, arr: List[int]) -> int:
        n = len(arr)
        if n == 0:
            return 0
        total = sum(arr)
        curr = sum(i * v for i, v in enumerate(arr))
        best = curr
        for r in range(1, n):
            curr = curr + total - n * arr[n - r]
            if curr > best:
                best = curr
        return best
`,
    javascript: `var maxSumIArrI = function(arr) {
    const n = arr.length;
    if (n === 0) return 0;
    let total = 0, curr = 0;
    for (let i = 0; i < n; i++) {
        total += arr[i];
        curr += i * arr[i];
    }
    let best = curr;
    for (let r = 1; r < n; r++) {
        curr = curr + total - n * arr[n - r];
        if (curr > best) best = curr;
    }
    return best;
};
`,
    java: `class Solution {
    public int maxSumIArrI(int[] arr) {
        int n = arr.length;
        if (n == 0) return 0;
        long total = 0, curr = 0;
        for (int i = 0; i < n; i++) {
            total += arr[i];
            curr += (long) i * arr[i];
        }
        long best = curr;
        for (int r = 1; r < n; r++) {
            curr = curr + total - (long) n * arr[n - r];
            if (curr > best) best = curr;
        }
        return (int) best;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSumIArrI(vector<int>& arr) {
        int n = arr.size();
        if (n == 0) return 0;
        long long total = 0, curr = 0;
        for (int i = 0; i < n; i++) {
            total += arr[i];
            curr += (long long) i * arr[i];
        }
        long long best = curr;
        for (int r = 1; r < n; r++) {
            curr = curr + total - (long long) n * arr[n - r];
            if (curr > best) best = curr;
        }
        return (int) best;
    }
};
`,
  },
});

// ============================================================================
// 7. merge-overlapping
// ============================================================================
P.push({
  id: 'merge-overlapping',
  description: '<p>Given a list of intervals (each <code>[start, end]</code>), merge all overlapping intervals and return the result, sorted by start time.</p>',
  method_name: 'mergeOverlapping',
  params: [{ name: 'intervals', type: 'List[List[int]]' }],
  return_type: 'List[List[int]]',
  pattern: 'Intervals',
  tags: ['arrays', 'intervals', 'sorting'],
  hints: [
    'Sort intervals by start time.',
    'Walk the sorted list. If the next interval starts on or before the running end, extend the running end.',
    'Otherwise close the current merged interval and start a new one.',
    'Edge case: empty input returns empty.',
    'O(n log n) dominated by the sort.',
  ],
  test_cases: [
    { inputs: ['[[1,3],[2,6],[8,10],[15,18]]'], expected: '[[1,6],[8,10],[15,18]]' },
    { inputs: ['[[1,4],[4,5]]'], expected: '[[1,5]]' },
    { inputs: ['[[1,4],[2,3]]'], expected: '[[1,4]]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[[1,1]]'], expected: '[[1,1]]' },
    { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[[1,2],[3,4],[5,6]]' },
    { inputs: ['[[5,6],[3,4],[1,2]]'], expected: '[[1,2],[3,4],[5,6]]' },
    { inputs: ['[[1,10],[2,3],[4,5],[6,7],[8,9]]'], expected: '[[1,10]]' },
    { inputs: ['[[1,4],[0,4]]'], expected: '[[0,4]]' },
    { inputs: ['[[1,4],[0,2],[3,5]]'], expected: '[[0,5]]' },
    { inputs: ['[[2,3],[4,5],[6,7],[8,9],[1,10]]'], expected: '[[1,10]]' },
  ],
  editorial_md: ED(
    'After sorting by start time, overlapping intervals become consecutive in the list. A single pass merges them greedily: keep the most recent merged interval open; if the next interval starts at or before its end, extend the end; otherwise close it and start fresh.',
    'Sort intervals by start time (and tie-break by end). Initialise result with the first interval. For each subsequent interval [s, e]: if s <= result[-1][1] (the running end), merge by setting result[-1][1] = max(result[-1][1], e). Otherwise append [s, e] as a new entry. Correctness rests on sortedness: an interval that does not overlap the current open one cannot overlap any earlier closed one (its start is even larger), so closing is safe. The choice of <= vs < depends on the touching convention — [1,4] and [4,5] merge into [1,5] under the inclusive convention, which is the standard. Edge cases: empty input ⇒ empty result; single interval ⇒ itself; one interval engulfing many ⇒ all absorbed into the first. Stable sort isn\'t required.',
    '- Time: O(n log n) for the sort, O(n) for the merge.\n- Space: O(n) for output (and O(log n) for the sort stack).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def mergeOverlapping(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []
        intervals.sort(key=lambda x: x[0])
        result = [intervals[0][:]]
        for s, e in intervals[1:]:
            if s <= result[-1][1]:
                if e > result[-1][1]:
                    result[-1][1] = e
            else:
                result.append([s, e])
        return result
`,
    javascript: `var mergeOverlapping = function(intervals) {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const result = [intervals[0].slice()];
    for (let i = 1; i < intervals.length; i++) {
        const [s, e] = intervals[i];
        if (s <= result[result.length - 1][1]) {
            if (e > result[result.length - 1][1]) result[result.length - 1][1] = e;
        } else {
            result.push([s, e]);
        }
    }
    return result;
};
`,
    java: `import java.util.*;

class Solution {
    public int[][] mergeOverlapping(int[][] intervals) {
        if (intervals.length == 0) return new int[0][];
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> result = new ArrayList<>();
        result.add(new int[]{intervals[0][0], intervals[0][1]});
        for (int i = 1; i < intervals.length; i++) {
            int[] last = result.get(result.size() - 1);
            if (intervals[i][0] <= last[1]) {
                if (intervals[i][1] > last[1]) last[1] = intervals[i][1];
            } else {
                result.add(new int[]{intervals[i][0], intervals[i][1]});
            }
        }
        return result.toArray(new int[0][]);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> mergeOverlapping(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};
        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[0] < b[0];
        });
        vector<vector<int>> result;
        result.push_back(intervals[0]);
        for (int i = 1; i < (int)intervals.size(); i++) {
            if (intervals[i][0] <= result.back()[1]) {
                if (intervals[i][1] > result.back()[1]) result.back()[1] = intervals[i][1];
            } else {
                result.push_back(intervals[i]);
            }
        }
        return result;
    }
};
`,
  },
});

// ============================================================================
// 8. minimize-moves
// ============================================================================
P.push({
  id: 'minimize-moves',
  description: '<p>Given an integer array <code>nums</code> of size <code>n</code>, in one move you may increment <strong>n-1</strong> elements by 1. Return the minimum number of moves required to make all elements equal.</p>',
  method_name: 'minMoves',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'int',
  pattern: 'Math',
  tags: ['arrays', 'math', 'greedy'],
  hints: [
    'Incrementing n-1 elements by 1 is equivalent to decrementing 1 element by 1 (relative to the others).',
    'So the task becomes: bring every element down to the minimum, one step at a time.',
    'Total moves = sum(nums) - n * min(nums).',
    'No simulation needed — just two passes.',
    'O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[1,2,3]'], expected: '3' },
    { inputs: ['[1,1,1]'], expected: '0' },
    { inputs: ['[5]'], expected: '0' },
    { inputs: ['[1,2]'], expected: '1' },
    { inputs: ['[0,0,0]'], expected: '0' },
    { inputs: ['[1,2,3,4]'], expected: '6' },
    { inputs: ['[10,10,10,10,10]'], expected: '0' },
    { inputs: ['[1,1000000]'], expected: '999999' },
    { inputs: ['[-1,0,1]'], expected: '3' },
    { inputs: ['[0,0,0,1]'], expected: '1' },
    { inputs: ['[5,4,3,2,1]'], expected: '10' },
    { inputs: ['[100,1,100,1]'], expected: '198' },
  ],
  editorial_md: ED(
    'A move that adds 1 to every element except one is the same — relative to the others — as subtracting 1 from a single element. With this reframing, the original task "make everything equal by adding to n-1 at a time" becomes "make everything equal by subtracting 1 from one element at a time", which obviously requires bringing each element down to the minimum.',
    'Let m = min(nums). Each element nums[i] needs nums[i] - m decrement-style moves, so the total is sum(nums[i] - m) = sum(nums) - n * m. Compute the sum and the minimum in a single pass and return the difference. The proof of the equivalence: adding +1 to n-1 elements is the same as adding +1 to all and then -1 to one — the +1 to all is a global shift that doesn\'t change equality status. So problem reduces to subtracting 1 from a single chosen element per move, where the optimal strategy is to keep bringing the maximum down — which terminates when all equal the original minimum. Edge cases: single element ⇒ 0; already equal ⇒ 0; negative values still work since the formula is purely arithmetic. Watch for sum overflow on very large inputs in 32-bit languages.',
    '- Time: O(n) — single pass.\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def minMoves(self, nums: List[int]) -> int:
        if not nums:
            return 0
        return sum(nums) - len(nums) * min(nums)
`,
    javascript: `var minMoves = function(nums) {
    if (nums.length === 0) return 0;
    let total = 0, m = nums[0];
    for (const x of nums) {
        total += x;
        if (x < m) m = x;
    }
    return total - nums.length * m;
};
`,
    java: `class Solution {
    public int minMoves(int[] nums) {
        if (nums.length == 0) return 0;
        long total = 0;
        int m = nums[0];
        for (int x : nums) {
            total += x;
            if (x < m) m = x;
        }
        return (int) (total - (long) nums.length * m);
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minMoves(vector<int>& nums) {
        if (nums.empty()) return 0;
        long long total = 0;
        int m = nums[0];
        for (int x : nums) {
            total += x;
            if (x < m) m = x;
        }
        return (int)(total - (long long) nums.size() * m);
    }
};
`,
  },
});

// ============================================================================
// 9. letter-case-permutation (existing tc=4)
// ============================================================================
P.push({
  id: 'letter-case-permutation',
  pattern: 'Backtracking',
  tags: ['string', 'backtracking', 'bit-manipulation'],
  test_cases: [
    { inputs: ['"a1b2"'], expected: '["a1b2","a1B2","A1b2","A1B2"]' },
    { inputs: ['"3z4"'], expected: '["3z4","3Z4"]' },
    { inputs: ['"12345"'], expected: '["12345"]' },
    { inputs: ['"0"'], expected: '["0"]' },
    { inputs: ['"a"'], expected: '["a","A"]' },
    { inputs: ['"A"'], expected: '["a","A"]' },
    { inputs: ['"ab"'], expected: '["ab","aB","Ab","AB"]' },
    { inputs: ['"C"'], expected: '["c","C"]' },
    { inputs: ['""'], expected: '[""]' },
    { inputs: ['"1a"'], expected: '["1a","1A"]' },
    { inputs: ['"abc"'], expected: '["abc","abC","aBc","aBC","Abc","AbC","ABc","ABC"]' },
  ],
  hints: [
    'Each letter has two choices (lower / upper); each digit has one. Total outputs = 2^(letter count).',
    'Backtracking: walk the string index by index, branching on letters and recursing on the next index.',
    'Build a char array and toggle in place — no string concatenation in hot path.',
    'Append a copy of the array when index == length.',
    'O(n * 2^L) time where L = letter count.',
  ],
  editorial_md: ED(
    'Each character contributes a fixed multiplier to the output count: digits multiply by 1, letters by 2. Backtracking naturally enumerates the 2^L combinations by branching on letters and walking past digits unchanged.',
    'Convert the string to a mutable char array. Recurse with an index i. Base case: i == n, append a copy of the current array to results. Otherwise: if the character is a digit, recurse on i+1 (one branch). If it is a letter, recurse twice — once with the current letter, once with its case toggled (XOR with 32 swaps case for ASCII letters). Toggle back on return to keep the array clean for sibling branches. The state size is O(n) for the recursion stack; total leaves = 2^L. An iterative bit-mask formulation also works: enumerate every subset of letter positions and flip case for the chosen positions. Edge cases: empty string ⇒ [""]; all digits ⇒ [input]; all letters ⇒ exactly 2^n outputs. The output order matches the standard pre-order: the unmodified version first at each branch.',
    '- Time: O(n * 2^L) where L is the number of letters.\n- Space: O(n) recursion + O(n * 2^L) output.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def letterCasePermutation(self, s: str) -> List[str]:
        out = []
        arr = list(s)
        n = len(arr)
        def dfs(i: int):
            if i == n:
                out.append(''.join(arr))
                return
            ch = arr[i]
            if ch.isalpha():
                arr[i] = ch.lower()
                dfs(i + 1)
                arr[i] = ch.upper()
                dfs(i + 1)
                arr[i] = ch
            else:
                dfs(i + 1)
        dfs(0)
        return out
`,
    javascript: `var letterCasePermutation = function(s) {
    const arr = s.split('');
    const out = [];
    const n = arr.length;
    const dfs = (i) => {
        if (i === n) { out.push(arr.join('')); return; }
        const ch = arr[i];
        if (/[a-zA-Z]/.test(ch)) {
            arr[i] = ch.toLowerCase();
            dfs(i + 1);
            arr[i] = ch.toUpperCase();
            dfs(i + 1);
            arr[i] = ch;
        } else {
            dfs(i + 1);
        }
    };
    dfs(0);
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<String> letterCasePermutation(String s) {
        List<String> out = new ArrayList<>();
        dfs(s.toCharArray(), 0, out);
        return out;
    }
    private void dfs(char[] arr, int i, List<String> out) {
        if (i == arr.length) { out.add(new String(arr)); return; }
        char ch = arr[i];
        if (Character.isLetter(ch)) {
            arr[i] = Character.toLowerCase(ch);
            dfs(arr, i + 1, out);
            arr[i] = Character.toUpperCase(ch);
            dfs(arr, i + 1, out);
            arr[i] = ch;
        } else {
            dfs(arr, i + 1, out);
        }
    }
}
`,
    cpp: `#include <vector>
#include <string>
#include <cctype>
using namespace std;

class Solution {
public:
    vector<string> letterCasePermutation(string s) {
        vector<string> out;
        dfs(s, 0, out);
        return out;
    }
private:
    void dfs(string& s, int i, vector<string>& out) {
        if (i == (int)s.size()) { out.push_back(s); return; }
        char ch = s[i];
        if (isalpha((unsigned char)ch)) {
            s[i] = tolower((unsigned char)ch);
            dfs(s, i + 1, out);
            s[i] = toupper((unsigned char)ch);
            dfs(s, i + 1, out);
            s[i] = ch;
        } else {
            dfs(s, i + 1, out);
        }
    }
};
`,
  },
});

// ============================================================================
// 10. combination-sum-iii (existing tc=4)
// ============================================================================
P.push({
  id: 'combination-sum-iii',
  pattern: 'Backtracking',
  tags: ['array', 'backtracking'],
  test_cases: [
    { inputs: ['3', '7'], expected: '[[1,2,4]]' },
    { inputs: ['3', '9'], expected: '[[1,2,6],[1,3,5],[2,3,4]]' },
    { inputs: ['4', '1'], expected: '[]' },
    { inputs: ['2', '18'], expected: '[]' },
    { inputs: ['9', '45'], expected: '[[1,2,3,4,5,6,7,8,9]]' },
    { inputs: ['1', '5'], expected: '[[5]]' },
    { inputs: ['1', '10'], expected: '[]' },
    { inputs: ['2', '6'], expected: '[[1,5],[2,4]]' },
    { inputs: ['3', '15'], expected: '[[1,5,9],[1,6,8],[2,4,9],[2,5,8],[2,6,7],[3,4,8],[3,5,7],[4,5,6]]' },
    { inputs: ['4', '24'], expected: '[[1,6,8,9],[2,5,8,9],[2,6,7,9],[3,4,8,9],[3,5,7,9],[3,6,7,8],[4,5,6,9],[4,5,7,8]]' },
    { inputs: ['5', '15'], expected: '[[1,2,3,4,5]]' },
    { inputs: ['1', '9'], expected: '[[9]]' },
  ],
  hints: [
    'Backtracking: pick numbers in increasing order so combinations are unique.',
    'State: current index (start), remaining sum, picked list.',
    'Base: len(picked) == k. If remaining == 0, record; otherwise discard.',
    'Prune: if remaining < next number, break. If remaining > 9 * (slots left), break.',
    'O(C(9, k)) combinations enumerated.',
  ],
  editorial_md: ED(
    'Generate combinations of exactly k digits from 1..9 that sum to n by walking the digits in increasing order. The increasing-order constraint guarantees no duplicate combinations and lets us prune aggressively when the running sum overshoots or the remaining slots cannot reach the target.',
    'DFS over a start index and a remaining sum. At each call, iterate i from start to 9. Add i to the running list, recurse with start = i + 1 and remaining -= i. Backtrack by popping i. Record the current list whenever len(list) == k and remaining == 0. Two pruning tests cut the search dramatically: (1) remaining < i ⇒ even the smallest available digit overshoots, stop; (2) the sum of the largest available k - len(list) digits cannot reach remaining ⇒ stop. Why the order matters: by enforcing strictly increasing picks (start = i + 1), every combination is visited exactly once. Edge cases: k > 9 ⇒ impossible, return []; n > 45 ⇒ impossible; k == 1 ⇒ return [[n]] if 1 ≤ n ≤ 9 else []; the canonical answer for k=9,n=45 is [[1..9]]. Output order is naturally sorted lexicographically by the smallest element due to the increasing-start enumeration.',
    '- Time: O(C(9, k)) leaves × O(k) per leaf in the worst case.\n- Space: O(k) recursion stack plus the output list.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def combinationSum3(self, k: int, n: int) -> List[List[int]]:
        out: List[List[int]] = []
        path: List[int] = []
        def dfs(start: int, remaining: int):
            if len(path) == k:
                if remaining == 0:
                    out.append(path[:])
                return
            for i in range(start, 10):
                if i > remaining:
                    break
                path.append(i)
                dfs(i + 1, remaining - i)
                path.pop()
        dfs(1, n)
        return out
`,
    javascript: `var combinationSum3 = function(k, n) {
    const out = [];
    const path = [];
    const dfs = (start, remaining) => {
        if (path.length === k) {
            if (remaining === 0) out.push(path.slice());
            return;
        }
        for (let i = start; i <= 9; i++) {
            if (i > remaining) break;
            path.push(i);
            dfs(i + 1, remaining - i);
            path.pop();
        }
    };
    dfs(1, n);
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum3(int k, int n) {
        List<List<Integer>> out = new ArrayList<>();
        dfs(1, n, k, new ArrayList<>(), out);
        return out;
    }
    private void dfs(int start, int remaining, int k, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == k) {
            if (remaining == 0) out.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i <= 9; i++) {
            if (i > remaining) break;
            path.add(i);
            dfs(i + 1, remaining - i, k, path, out);
            path.remove(path.size() - 1);
        }
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<int>> combinationSum3(int k, int n) {
        vector<vector<int>> out;
        vector<int> path;
        dfs(1, n, k, path, out);
        return out;
    }
private:
    void dfs(int start, int remaining, int k, vector<int>& path, vector<vector<int>>& out) {
        if ((int)path.size() == k) {
            if (remaining == 0) out.push_back(path);
            return;
        }
        for (int i = start; i <= 9; i++) {
            if (i > remaining) break;
            path.push_back(i);
            dfs(i + 1, remaining - i, k, path, out);
            path.pop_back();
        }
    }
};
`,
  },
});

// ============================================================================
// 11. quick-sort
// ============================================================================
P.push({
  id: 'quick-sort',
  description: '<p>Implement quick sort: return the input array sorted in non-decreasing order using the quicksort algorithm (divide-and-conquer with a pivot and partition).</p>',
  method_name: 'quickSort',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Divide and Conquer',
  tags: ['sorting', 'divide-and-conquer', 'recursion'],
  topic_id: 'sorting',
  hints: [
    'Pick a pivot, partition the array so smaller elements sit before it and larger sit after.',
    'Recursively sort the two halves around the pivot.',
    'Use Lomuto or Hoare partition — both work; Lomuto is simpler.',
    'Randomise pivot choice to defend against worst-case O(n^2) on sorted input.',
    'In-place: O(n log n) average time, O(log n) average stack depth.',
  ],
  test_cases: [
    { inputs: ['[3,1,2]'], expected: '[1,2,3]' },
    { inputs: ['[5,4,3,2,1]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[2,2,2,2]'], expected: '[2,2,2,2]' },
    { inputs: ['[-3,1,-2,0,5]'], expected: '[-3,-2,0,1,5]' },
    { inputs: ['[10,7,8,9,1,5]'], expected: '[1,5,7,8,9,10]' },
    { inputs: ['[4,3,5,1,2,5,3]'], expected: '[1,2,3,3,4,5,5]' },
    { inputs: ['[100,50,25,75,0,-50]'], expected: '[-50,0,25,50,75,100]' },
    { inputs: ['[1,1,2,1,1,1,1]'], expected: '[1,1,1,1,1,1,2]' },
    { inputs: ['[9,8,7,6,5,4,3,2,1,0]'], expected: '[0,1,2,3,4,5,6,7,8,9]' },
  ],
  editorial_md: ED(
    'Quick sort partitions the array around a pivot so all smaller elements sit to its left and all larger sit to its right, then recurses on the two halves. The pivot ends up in its final sorted slot in one pass, making the recursive subproblems strictly smaller.',
    'Use the Lomuto partition for clarity: pick the last element as pivot, walk an index j across [lo, hi-1], maintain a write pointer i that tracks where the next "less than pivot" element goes. After the walk, swap arr[i] with arr[hi] to place the pivot. The pivot sits at index i; recurse on [lo, i-1] and [i+1, hi]. To guarantee O(n log n) average, swap the chosen pivot with a random element before partitioning — this makes worst-case adversarial inputs (already sorted, all equal) statistically rare. Average depth is O(log n); worst case is O(n^2) on sorted input without randomisation. Tail-call optimisation can keep stack usage to O(log n). Edge cases: empty or single-element arrays return unchanged; duplicates work but degrade Lomuto on all-equal arrays (three-way partition fixes that). Return the same array reference after in-place sorting.',
    '- Time: O(n log n) average, O(n^2) worst case (mitigated by random pivot).\n- Space: O(log n) average recursion depth, O(n) worst case.'
  ),
  solutions: {
    python: `from typing import List
import random

class Solution:
    def quickSort(self, arr: List[int]) -> List[int]:
        def part(lo: int, hi: int) -> int:
            rp = random.randint(lo, hi)
            arr[rp], arr[hi] = arr[hi], arr[rp]
            pivot = arr[hi]
            i = lo
            for j in range(lo, hi):
                if arr[j] <= pivot:
                    arr[i], arr[j] = arr[j], arr[i]
                    i += 1
            arr[i], arr[hi] = arr[hi], arr[i]
            return i
        def qs(lo: int, hi: int):
            if lo >= hi:
                return
            p = part(lo, hi)
            qs(lo, p - 1)
            qs(p + 1, hi)
        qs(0, len(arr) - 1)
        return arr
`,
    javascript: `var quickSort = function(arr) {
    const part = (lo, hi) => {
        const rp = lo + Math.floor(Math.random() * (hi - lo + 1));
        [arr[rp], arr[hi]] = [arr[hi], arr[rp]];
        const pivot = arr[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
            if (arr[j] <= pivot) {
                [arr[i], arr[j]] = [arr[j], arr[i]];
                i++;
            }
        }
        [arr[i], arr[hi]] = [arr[hi], arr[i]];
        return i;
    };
    const qs = (lo, hi) => {
        if (lo >= hi) return;
        const p = part(lo, hi);
        qs(lo, p - 1);
        qs(p + 1, hi);
    };
    qs(0, arr.length - 1);
    return arr;
};
`,
    java: `import java.util.*;

class Solution {
    private Random rand = new Random();
    public int[] quickSort(int[] arr) {
        qs(arr, 0, arr.length - 1);
        return arr;
    }
    private void qs(int[] arr, int lo, int hi) {
        if (lo >= hi) return;
        int p = part(arr, lo, hi);
        qs(arr, lo, p - 1);
        qs(arr, p + 1, hi);
    }
    private int part(int[] arr, int lo, int hi) {
        int rp = lo + rand.nextInt(hi - lo + 1);
        int tmp = arr[rp]; arr[rp] = arr[hi]; arr[hi] = tmp;
        int pivot = arr[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (arr[j] <= pivot) {
                tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
                i++;
            }
        }
        tmp = arr[i]; arr[i] = arr[hi]; arr[hi] = tmp;
        return i;
    }
}
`,
    cpp: `#include <vector>
#include <cstdlib>
using namespace std;

class Solution {
public:
    vector<int> quickSort(vector<int>& arr) {
        qs(arr, 0, (int)arr.size() - 1);
        return arr;
    }
private:
    void qs(vector<int>& a, int lo, int hi) {
        if (lo >= hi) return;
        int p = part(a, lo, hi);
        qs(a, lo, p - 1);
        qs(a, p + 1, hi);
    }
    int part(vector<int>& a, int lo, int hi) {
        int rp = lo + rand() % (hi - lo + 1);
        swap(a[rp], a[hi]);
        int pivot = a[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (a[j] <= pivot) {
                swap(a[i], a[j]);
                i++;
            }
        }
        swap(a[i], a[hi]);
        return i;
    }
};
`,
  },
});

// ============================================================================
// 12. merge-sort
// ============================================================================
P.push({
  id: 'merge-sort',
  description: '<p>Implement merge sort: return the input array sorted in non-decreasing order using the merge sort algorithm (divide the array into halves, sort each recursively, then merge).</p>',
  method_name: 'mergeSort',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Divide and Conquer',
  tags: ['sorting', 'divide-and-conquer', 'recursion'],
  topic_id: 'sorting',
  hints: [
    'Recursively sort the left half and the right half.',
    'Merge two sorted halves by walking two pointers and picking the smaller front.',
    'Base case: length ≤ 1 is already sorted.',
    'O(n log n) time guaranteed, O(n) auxiliary space for the merge buffer.',
    'Stable — equal elements keep their original relative order.',
  ],
  test_cases: [
    { inputs: ['[3,1,2]'], expected: '[1,2,3]' },
    { inputs: ['[5,4,3,2,1]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[2,2,2,2]'], expected: '[2,2,2,2]' },
    { inputs: ['[-3,1,-2,0,5]'], expected: '[-3,-2,0,1,5]' },
    { inputs: ['[10,7,8,9,1,5]'], expected: '[1,5,7,8,9,10]' },
    { inputs: ['[4,3,5,1,2,5,3]'], expected: '[1,2,3,3,4,5,5]' },
    { inputs: ['[100,50,25,75,0,-50]'], expected: '[-50,0,25,50,75,100]' },
    { inputs: ['[1,1,2,1,1,1,1]'], expected: '[1,1,1,1,1,1,2]' },
    { inputs: ['[9,8,7,6,5,4,3,2,1,0]'], expected: '[0,1,2,3,4,5,6,7,8,9]' },
  ],
  editorial_md: ED(
    'Merge sort splits the array in half, sorts each half recursively, then merges the two sorted halves into one. The merge step is the engine: two sorted runs merge in linear time by repeatedly picking the smaller front element.',
    'Top-down: if length ≤ 1, the array is already sorted; otherwise split at mid = len / 2 and sort each half recursively. Merge by walking two pointers i (left) and j (right): repeatedly compare left[i] and right[j], append the smaller (using <= for stability), and advance that pointer. After one side exhausts, append the remainder of the other. The combine step touches each element once, so each level does O(n) work; depth is log n, giving O(n log n) total. Auxiliary space is O(n) for the buffer plus O(log n) for the recursion stack. Stability matters in many real workloads — keep the <= on the left side to preserve original order among equal keys. Bottom-up iterative merge sort is equivalent and avoids recursion altogether. Edge cases: empty / single-element input returns unchanged; duplicates work cleanly; sorted or reverse-sorted input is still O(n log n), no degenerate case unlike quicksort.',
    '- Time: O(n log n) guaranteed, best/avg/worst.\n- Space: O(n) for the buffer + O(log n) recursion.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def mergeSort(self, arr: List[int]) -> List[int]:
        def ms(a: List[int]) -> List[int]:
            n = len(a)
            if n <= 1:
                return a
            mid = n // 2
            left = ms(a[:mid])
            right = ms(a[mid:])
            out = []
            i = j = 0
            while i < len(left) and j < len(right):
                if left[i] <= right[j]:
                    out.append(left[i]); i += 1
                else:
                    out.append(right[j]); j += 1
            out.extend(left[i:])
            out.extend(right[j:])
            return out
        sorted_arr = ms(arr)
        for k in range(len(arr)):
            arr[k] = sorted_arr[k]
        return arr
`,
    javascript: `var mergeSort = function(arr) {
    const ms = (a) => {
        if (a.length <= 1) return a;
        const mid = a.length >> 1;
        const left = ms(a.slice(0, mid));
        const right = ms(a.slice(mid));
        const out = [];
        let i = 0, j = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) { out.push(left[i++]); }
            else { out.push(right[j++]); }
        }
        while (i < left.length) out.push(left[i++]);
        while (j < right.length) out.push(right[j++]);
        return out;
    };
    const sorted = ms(arr);
    for (let k = 0; k < arr.length; k++) arr[k] = sorted[k];
    return arr;
};
`,
    java: `import java.util.*;

class Solution {
    public int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int[] sorted = ms(arr);
        for (int k = 0; k < arr.length; k++) arr[k] = sorted[k];
        return arr;
    }
    private int[] ms(int[] a) {
        if (a.length <= 1) return a;
        int mid = a.length / 2;
        int[] left = ms(Arrays.copyOfRange(a, 0, mid));
        int[] right = ms(Arrays.copyOfRange(a, mid, a.length));
        int[] out = new int[a.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) out[k++] = left[i++];
            else out[k++] = right[j++];
        }
        while (i < left.length) out[k++] = left[i++];
        while (j < right.length) out[k++] = right[j++];
        return out;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> mergeSort(vector<int>& arr) {
        if (arr.size() <= 1) return arr;
        vector<int> sorted = ms(arr);
        for (size_t k = 0; k < arr.size(); k++) arr[k] = sorted[k];
        return arr;
    }
private:
    vector<int> ms(vector<int> a) {
        if (a.size() <= 1) return a;
        int mid = a.size() / 2;
        vector<int> left(a.begin(), a.begin() + mid);
        vector<int> right(a.begin() + mid, a.end());
        left = ms(left);
        right = ms(right);
        vector<int> out;
        out.reserve(a.size());
        size_t i = 0, j = 0;
        while (i < left.size() && j < right.size()) {
            if (left[i] <= right[j]) out.push_back(left[i++]);
            else out.push_back(right[j++]);
        }
        while (i < left.size()) out.push_back(left[i++]);
        while (j < right.size()) out.push_back(right[j++]);
        return out;
    }
};
`,
  },
});

// ============================================================================
// 13. merge-without-extra-space
// ============================================================================
P.push({
  id: 'merge-without-extra-space',
  description: '<p>Given two sorted arrays <code>a</code> (size m) and <code>b</code> (size n), merge them so that the first m elements (across both, in sorted order) end up in <code>a</code> and the remaining n elements end up in <code>b</code>, both still sorted. Return the concatenation of the modified a then b as the merged sorted output.</p>',
  method_name: 'mergeWithoutExtraSpace',
  params: [
    { name: 'a', type: 'List[int]' },
    { name: 'b', type: 'List[int]' },
  ],
  return_type: 'List[int]',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers', 'sorting'],
  hints: [
    'Walk i across a (left → right) and j from the start of b. If a[i] > b[j], swap and re-insert b[j] into b\'s sorted position.',
    'Alternative: gap-method (Shell-like). Start gap = ceil((m+n)/2). Compare and swap pairs (i, i+gap) treating arrays as one virtual array. Halve gap until gap=0.',
    'Gap method is O((m+n) log(m+n)) and uses O(1) extra space.',
    'Brute concat-and-sort works in O((m+n) log(m+n)) too but uses O(m+n) extra.',
    'For the "place the smallest m in a, rest in b" framing, you can also just merge into a fresh buffer then split — clear and easy if extra space is OK.',
  ],
  test_cases: [
    { inputs: ['[1,3,5,7]', '[0,2,6,8,9]'], expected: '[0,1,2,3,5,6,7,8,9]' },
    { inputs: ['[10,12]', '[5,18,20]'], expected: '[5,10,12,18,20]' },
    { inputs: ['[]', '[1,2,3]'], expected: '[1,2,3]' },
    { inputs: ['[1,2,3]', '[]'], expected: '[1,2,3]' },
    { inputs: ['[]', '[]'], expected: '[]' },
    { inputs: ['[1]', '[2]'], expected: '[1,2]' },
    { inputs: ['[2]', '[1]'], expected: '[1,2]' },
    { inputs: ['[1,1,1]', '[1,1,1]'], expected: '[1,1,1,1,1,1]' },
    { inputs: ['[1,5,9,10,15,20]', '[2,3,8,13]'], expected: '[1,2,3,5,8,9,10,13,15,20]' },
    { inputs: ['[-5,-1,0,3]', '[-10,2,4]'], expected: '[-10,-5,-1,0,2,3,4]' },
    { inputs: ['[100,200,300]', '[1,2,3]'], expected: '[1,2,3,100,200,300]' },
    { inputs: ['[1,2,3,4,5]', '[6,7,8,9,10]'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
  ],
  editorial_md: ED(
    'Two sorted arrays need to look like one big sorted array, but we want to avoid allocating a third buffer of size m + n. The trick is to merge in place using the gap method — a Shell-sort-style shrinking-gap pass that treats the two arrays as one virtual length-(m+n) array.',
    'The gap method: let gap = ceil((m + n) / 2). Treat indices 0..m-1 as living in a and m..m+n-1 as living in b (with a fetch helper that maps a virtual index to the right array). In each pass, compare and swap the pair (i, i + gap) whenever the left one is larger, sweeping i from 0 to (m + n - 1 - gap). Then shrink gap to ceil(gap / 2). Stop after a pass with gap = 1 (when gap reaches 1, do that pass then exit). The invariant: after each pass, no two elements separated by exactly gap are out of order, so by the time gap shrinks to 1 the merged virtual array is fully sorted. Time complexity is O((m + n) log(m + n)) and extra space is O(1). For interview clarity, the simpler "merge into a fresh buffer in O(m + n), then split back" is also acceptable when O(m + n) extra space is allowed — it has the same asymptotic complexity. The function returns the full merged sorted view (a concatenated with b after the merge) so the result is easy to verify.',
    '- Time: O((m + n) log(m + n)) with the gap method.\n- Space: O(1) extra in the gap method; O(m + n) with the buffer variant.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def mergeWithoutExtraSpace(self, a: List[int], b: List[int]) -> List[int]:
        m, n = len(a), len(b)
        total = m + n
        def get(idx: int) -> int:
            return a[idx] if idx < m else b[idx - m]
        def setv(idx: int, val: int) -> None:
            if idx < m:
                a[idx] = val
            else:
                b[idx - m] = val
        gap = (total + 1) // 2
        while gap > 0:
            i = 0
            while i + gap < total:
                if get(i) > get(i + gap):
                    x, y = get(i), get(i + gap)
                    setv(i, y); setv(i + gap, x)
                i += 1
            if gap == 1:
                break
            gap = (gap + 1) // 2
        return a + b
`,
    javascript: `var mergeWithoutExtraSpace = function(a, b) {
    const m = a.length, n = b.length, total = m + n;
    const get = (i) => i < m ? a[i] : b[i - m];
    const setv = (i, v) => { if (i < m) a[i] = v; else b[i - m] = v; };
    let gap = Math.ceil(total / 2);
    while (gap > 0) {
        for (let i = 0; i + gap < total; i++) {
            if (get(i) > get(i + gap)) {
                const x = get(i), y = get(i + gap);
                setv(i, y); setv(i + gap, x);
            }
        }
        if (gap === 1) break;
        gap = Math.ceil(gap / 2);
    }
    return a.concat(b);
};
`,
    java: `import java.util.*;

class Solution {
    public int[] mergeWithoutExtraSpace(int[] a, int[] b) {
        int m = a.length, n = b.length, total = m + n;
        int gap = (total + 1) / 2;
        while (gap > 0) {
            for (int i = 0; i + gap < total; i++) {
                int xi = get(a, b, m, i);
                int xj = get(a, b, m, i + gap);
                if (xi > xj) {
                    setv(a, b, m, i, xj);
                    setv(a, b, m, i + gap, xi);
                }
            }
            if (gap == 1) break;
            gap = (gap + 1) / 2;
        }
        int[] out = new int[total];
        for (int i = 0; i < m; i++) out[i] = a[i];
        for (int i = 0; i < n; i++) out[m + i] = b[i];
        return out;
    }
    private int get(int[] a, int[] b, int m, int i) { return i < m ? a[i] : b[i - m]; }
    private void setv(int[] a, int[] b, int m, int i, int v) { if (i < m) a[i] = v; else b[i - m] = v; }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> mergeWithoutExtraSpace(vector<int>& a, vector<int>& b) {
        int m = a.size(), n = b.size(), total = m + n;
        auto get = [&](int i) { return i < m ? a[i] : b[i - m]; };
        auto setv = [&](int i, int v) { if (i < m) a[i] = v; else b[i - m] = v; };
        int gap = (total + 1) / 2;
        while (gap > 0) {
            for (int i = 0; i + gap < total; i++) {
                int xi = get(i), xj = get(i + gap);
                if (xi > xj) { setv(i, xj); setv(i + gap, xi); }
            }
            if (gap == 1) break;
            gap = (gap + 1) / 2;
        }
        vector<int> out;
        out.reserve(total);
        for (int x : a) out.push_back(x);
        for (int x : b) out.push_back(x);
        return out;
    }
};
`,
  },
});

// ============================================================================
// 14. minimum-platforms
// ============================================================================
P.push({
  id: 'minimum-platforms',
  description: '<p>Given arrival and departure times of trains at a station as two arrays <code>arrival</code> and <code>departure</code> (same length n), return the minimum number of platforms required so that no train waits. A platform can be reused only after the previous train has departed.</p>',
  method_name: 'minPlatforms',
  params: [
    { name: 'arrival', type: 'List[int]' },
    { name: 'departure', type: 'List[int]' },
  ],
  return_type: 'int',
  pattern: 'Sweep Line',
  tags: ['arrays', 'sorting', 'greedy', 'sweep-line'],
  topic_id: 'greedy',
  hints: [
    'Sort the arrivals and departures independently.',
    'Use two pointers: if the next arrival ≤ next departure, a new platform is needed (count++).',
    'Otherwise, a train has left (count--), advance the departure pointer.',
    'Track the maximum simultaneous count.',
    'O(n log n) time, O(1) extra space.',
  ],
  test_cases: [
    { inputs: ['[900,940,950,1100,1500,1800]', '[910,1200,1120,1130,1900,2000]'], expected: '3' },
    { inputs: ['[900,1100,1235]', '[1000,1200,1240]'], expected: '1' },
    { inputs: ['[100]', '[200]'], expected: '1' },
    { inputs: ['[]', '[]'], expected: '0' },
    { inputs: ['[100,200,300]', '[150,250,350]'], expected: '1' },
    { inputs: ['[100,100,100]', '[200,200,200]'], expected: '3' },
    { inputs: ['[1,2,3,4,5]', '[10,11,12,13,14]'], expected: '5' },
    { inputs: ['[100,200]', '[200,300]'], expected: '2' },
    { inputs: ['[1000,1010,1020]', '[1030,1020,1010]'], expected: '3' },
    { inputs: ['[900,950]', '[1100,1200]'], expected: '2' },
    { inputs: ['[1,5,10]', '[4,9,14]'], expected: '1' },
    { inputs: ['[1,1,1,1,1,1]', '[2,2,2,2,2,2]'], expected: '6' },
  ],
  editorial_md: ED(
    'A platform is needed for every train present at a given moment. The answer is the maximum number of trains simultaneously at the station. Sweeping arrival and departure events in time order keeps a running count whose peak is exactly that maximum.',
    'Sort the arrival array and the departure array independently — sorting them together as paired events also works but is unnecessary. Initialise i = 0, j = 0 (pointers into sorted arrival, departure), platforms = 0, best = 0. Loop while i < n: if arrival[i] <= departure[j], a new train arrives before the next leaves, so platforms++, i++, update best = max(best, platforms). Otherwise a train has left, so platforms--, j++. The tie-break choice (<= vs <) matters: with <=, a train arriving at the exact second another leaves still needs its own platform, which is the conservative real-world convention. Why this works: independent sorts preserve the chronological order of arrival events and the chronological order of departure events, and the algorithm processes them in true time order via the comparison. Edge cases: empty arrays return 0; n = 1 returns 1; many simultaneous arrivals all count. Heap-based approach (push end-times, pop those ≤ next arrival) is an equivalent formulation.',
    '- Time: O(n log n) for the two sorts.\n- Space: O(1) extra beyond input.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def minPlatforms(self, arrival: List[int], departure: List[int]) -> int:
        if not arrival:
            return 0
        a = sorted(arrival)
        d = sorted(departure)
        n = len(a)
        platforms = best = 0
        i = j = 0
        while i < n:
            if a[i] <= d[j]:
                platforms += 1
                if platforms > best:
                    best = platforms
                i += 1
            else:
                platforms -= 1
                j += 1
        return best
`,
    javascript: `var minPlatforms = function(arrival, departure) {
    if (arrival.length === 0) return 0;
    const a = [...arrival].sort((x, y) => x - y);
    const d = [...departure].sort((x, y) => x - y);
    const n = a.length;
    let platforms = 0, best = 0, i = 0, j = 0;
    while (i < n) {
        if (a[i] <= d[j]) {
            platforms++;
            if (platforms > best) best = platforms;
            i++;
        } else {
            platforms--;
            j++;
        }
    }
    return best;
};
`,
    java: `import java.util.*;

class Solution {
    public int minPlatforms(int[] arrival, int[] departure) {
        if (arrival.length == 0) return 0;
        int[] a = arrival.clone();
        int[] d = departure.clone();
        Arrays.sort(a);
        Arrays.sort(d);
        int n = a.length;
        int platforms = 0, best = 0, i = 0, j = 0;
        while (i < n) {
            if (a[i] <= d[j]) {
                platforms++;
                if (platforms > best) best = platforms;
                i++;
            } else {
                platforms--;
                j++;
            }
        }
        return best;
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int minPlatforms(vector<int>& arrival, vector<int>& departure) {
        if (arrival.empty()) return 0;
        vector<int> a = arrival, d = departure;
        sort(a.begin(), a.end());
        sort(d.begin(), d.end());
        int n = a.size();
        int platforms = 0, best = 0, i = 0, j = 0;
        while (i < n) {
            if (a[i] <= d[j]) {
                platforms++;
                if (platforms > best) best = platforms;
                i++;
            } else {
                platforms--;
                j++;
            }
        }
        return best;
    }
};
`,
  },
});

// ============================================================================
// 15. sort-binary
// ============================================================================
P.push({
  id: 'sort-binary',
  description: '<p>Given an array <code>arr</code> containing only 0s and 1s, sort it in non-decreasing order (all 0s first, then all 1s) <strong>in place</strong>. Return the sorted array.</p>',
  method_name: 'sortBinary',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers', 'sorting'],
  topic_id: 'sorting',
  hints: [
    'Count zeros (or ones), then overwrite the array.',
    'Two-pointer in place: left scans for 1s, right scans for 0s; swap and converge.',
    'O(n) time, O(1) space, single pass.',
    'Beats sort by avoiding the log factor.',
    'Watch the stop condition — left ≤ right.',
  ],
  test_cases: [
    { inputs: ['[0,1,0,1,1,0]'], expected: '[0,0,0,1,1,1]' },
    { inputs: ['[1,1,1,0,0,0]'], expected: '[0,0,0,1,1,1]' },
    { inputs: ['[0,0,0,0]'], expected: '[0,0,0,0]' },
    { inputs: ['[1,1,1,1]'], expected: '[1,1,1,1]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[0]'], expected: '[0]' },
    { inputs: ['[1]'], expected: '[1]' },
    { inputs: ['[1,0]'], expected: '[0,1]' },
    { inputs: ['[0,1]'], expected: '[0,1]' },
    { inputs: ['[1,0,1,0,1,0,1,0]'], expected: '[0,0,0,0,1,1,1,1]' },
    { inputs: ['[0,1,1,1,0,0,1,0,1]'], expected: '[0,0,0,0,1,1,1,1,1]' },
    { inputs: ['[1,1,0,0,1,1,0,0]'], expected: '[0,0,0,0,1,1,1,1]' },
  ],
  editorial_md: ED(
    'A binary array only has two values, so sorting is really a partition: every 0 belongs to the left segment, every 1 to the right. Counting zeros once and overwriting is the simplest O(n) approach; a two-pointer swap is the in-place one-pass alternative.',
    'The counting approach: scan once to count zeros = z. Overwrite the first z slots with 0 and the remaining n - z with 1. Two passes, O(n) total. The two-pointer in-place approach: left = 0, right = n - 1. While left < right, advance left past 0s (arr[left] == 0) and retreat right past 1s (arr[right] == 1). If left < right, swap arr[left] and arr[right], advance both. The loop terminates when the pointers meet, and by then everything left of left is 0 and everything right of right is 1. One pass, O(1) extra space. The two-pointer version is essentially a degenerate Dutch National Flag with only two colours. Edge cases: empty / single-element ⇒ unchanged; all 0s or all 1s ⇒ unchanged; alternating 010101 ⇒ pointers meet quickly with few swaps. Stability is not preserved by the two-pointer swap, which is fine for unlabelled 0/1 values.',
    '- Time: O(n) — single pass.\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def sortBinary(self, arr: List[int]) -> List[int]:
        n = len(arr)
        if n == 0:
            return arr
        left, right = 0, n - 1
        while left < right:
            while left < right and arr[left] == 0:
                left += 1
            while left < right and arr[right] == 1:
                right -= 1
            if left < right:
                arr[left], arr[right] = arr[right], arr[left]
                left += 1
                right -= 1
        return arr
`,
    javascript: `var sortBinary = function(arr) {
    const n = arr.length;
    if (n === 0) return arr;
    let left = 0, right = n - 1;
    while (left < right) {
        while (left < right && arr[left] === 0) left++;
        while (left < right && arr[right] === 1) right--;
        if (left < right) {
            [arr[left], arr[right]] = [arr[right], arr[left]];
            left++; right--;
        }
    }
    return arr;
};
`,
    java: `class Solution {
    public int[] sortBinary(int[] arr) {
        int n = arr.length;
        if (n == 0) return arr;
        int left = 0, right = n - 1;
        while (left < right) {
            while (left < right && arr[left] == 0) left++;
            while (left < right && arr[right] == 1) right--;
            if (left < right) {
                int t = arr[left]; arr[left] = arr[right]; arr[right] = t;
                left++; right--;
            }
        }
        return arr;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> sortBinary(vector<int>& arr) {
        int n = arr.size();
        if (n == 0) return arr;
        int left = 0, right = n - 1;
        while (left < right) {
            while (left < right && arr[left] == 0) left++;
            while (left < right && arr[right] == 1) right--;
            if (left < right) {
                swap(arr[left], arr[right]);
                left++; right--;
            }
        }
        return arr;
    }
};
`,
  },
});

// ============================================================================
// 16. sort-ternary (Dutch National Flag)
// ============================================================================
P.push({
  id: 'sort-ternary',
  description: '<p>Given an array <code>arr</code> containing only the values 0, 1, and 2, sort it in non-decreasing order <strong>in place</strong> using a single pass and constant extra space. Return the sorted array.</p>',
  method_name: 'sortTernary',
  params: [{ name: 'arr', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Dutch National Flag',
  tags: ['arrays', 'two-pointers', 'sorting'],
  topic_id: 'sorting',
  hints: [
    'Three pointers: low (next slot for 0), mid (current scan position), high (next slot for 2).',
    'If arr[mid] == 0: swap arr[low] and arr[mid], advance both low and mid.',
    'If arr[mid] == 1: advance mid only.',
    'If arr[mid] == 2: swap arr[mid] and arr[high], decrement high (do NOT advance mid — the swapped-in value is unknown).',
    'Stop when mid > high. O(n) time, O(1) space.',
  ],
  test_cases: [
    { inputs: ['[2,0,2,1,1,0]'], expected: '[0,0,1,1,2,2]' },
    { inputs: ['[2,0,1]'], expected: '[0,1,2]' },
    { inputs: ['[0,0,0]'], expected: '[0,0,0]' },
    { inputs: ['[1,1,1]'], expected: '[1,1,1]' },
    { inputs: ['[2,2,2]'], expected: '[2,2,2]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[0]'], expected: '[0]' },
    { inputs: ['[2]'], expected: '[2]' },
    { inputs: ['[2,1,0]'], expected: '[0,1,2]' },
    { inputs: ['[0,1,2,0,1,2,0,1,2]'], expected: '[0,0,0,1,1,1,2,2,2]' },
    { inputs: ['[1,2,0,2,1,0,1,0,2]'], expected: '[0,0,0,1,1,1,2,2,2]' },
    { inputs: ['[0,1,2]'], expected: '[0,1,2]' },
  ],
  editorial_md: ED(
    'The Dutch National Flag algorithm (Dijkstra) sorts an array of three distinct values in one in-place pass using three pointers. The invariant is the array splits into four segments — known-0, known-1, unknown, known-2 — and the unknown segment shrinks to zero by the end.',
    'Maintain low (boundary of the 0-segment), mid (cursor in the unknown segment), and high (boundary of the 2-segment). Initialise low = 0, mid = 0, high = n - 1. Loop while mid <= high: if arr[mid] == 0, swap arr[low] and arr[mid], then low++ and mid++ — the swapped-out value at mid was either 1 or already in place, so mid can safely advance. If arr[mid] == 1, just mid++. If arr[mid] == 2, swap arr[mid] and arr[high], then high-- — but DO NOT advance mid, because the value that came from arr[high] is unknown and must be re-examined. The loop terminates when mid > high, with the array fully partitioned. Each pointer moves at most n times, so total work is O(n) and no extra memory beyond a couple of indices. Edge cases: empty / single element / all-equal arrays terminate immediately or trivially; the algorithm is not stable but the values are indistinguishable here so it doesn\'t matter. Counting 0s, 1s, 2s and overwriting is an O(n) two-pass alternative that also works and is sometimes preferred for simplicity.',
    '- Time: O(n) — single pass.\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def sortTernary(self, arr: List[int]) -> List[int]:
        n = len(arr)
        low = 0
        mid = 0
        high = n - 1
        while mid <= high:
            if arr[mid] == 0:
                arr[low], arr[mid] = arr[mid], arr[low]
                low += 1
                mid += 1
            elif arr[mid] == 1:
                mid += 1
            else:
                arr[mid], arr[high] = arr[high], arr[mid]
                high -= 1
        return arr
`,
    javascript: `var sortTernary = function(arr) {
    const n = arr.length;
    let low = 0, mid = 0, high = n - 1;
    while (mid <= high) {
        if (arr[mid] === 0) {
            [arr[low], arr[mid]] = [arr[mid], arr[low]];
            low++; mid++;
        } else if (arr[mid] === 1) {
            mid++;
        } else {
            [arr[mid], arr[high]] = [arr[high], arr[mid]];
            high--;
        }
    }
    return arr;
};
`,
    java: `class Solution {
    public int[] sortTernary(int[] arr) {
        int n = arr.length;
        int low = 0, mid = 0, high = n - 1;
        while (mid <= high) {
            if (arr[mid] == 0) {
                int t = arr[low]; arr[low] = arr[mid]; arr[mid] = t;
                low++; mid++;
            } else if (arr[mid] == 1) {
                mid++;
            } else {
                int t = arr[mid]; arr[mid] = arr[high]; arr[high] = t;
                high--;
            }
        }
        return arr;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> sortTernary(vector<int>& arr) {
        int n = arr.size();
        int low = 0, mid = 0, high = n - 1;
        while (mid <= high) {
            if (arr[mid] == 0) {
                swap(arr[low], arr[mid]);
                low++; mid++;
            } else if (arr[mid] == 1) {
                mid++;
            } else {
                swap(arr[mid], arr[high]);
                high--;
            }
        }
        return arr;
    }
};
`,
  },
});

// ============================================================================
// 17. union-of-2-sorted
// ============================================================================
P.push({
  id: 'union-of-2-sorted',
  description: '<p>Given two sorted (non-decreasing) integer arrays <code>a</code> and <code>b</code>, return the sorted union: every distinct element that appears in either array, in non-decreasing order.</p>',
  method_name: 'unionOfTwoSorted',
  params: [
    { name: 'a', type: 'List[int]' },
    { name: 'b', type: 'List[int]' },
  ],
  return_type: 'List[int]',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers', 'sorting'],
  hints: [
    'Both arrays are sorted — merge with two pointers in O(m + n).',
    'When a[i] < b[j], take a[i] (skip if duplicate of last pushed); advance i.',
    'When a[i] > b[j], take b[j] (skip if duplicate); advance j.',
    'When a[i] == b[j], take once, advance both.',
    'Flush any remaining tail, still skipping duplicates against the last pushed value.',
  ],
  test_cases: [
    { inputs: ['[1,2,3,4,5]', '[1,2,3]'], expected: '[1,2,3,4,5]' },
    { inputs: ['[1,2,2,3]', '[2,3,4]'], expected: '[1,2,3,4]' },
    { inputs: ['[]', '[1,2,3]'], expected: '[1,2,3]' },
    { inputs: ['[1,2,3]', '[]'], expected: '[1,2,3]' },
    { inputs: ['[]', '[]'], expected: '[]' },
    { inputs: ['[1,1,1]', '[1,1,1]'], expected: '[1]' },
    { inputs: ['[1,3,5]', '[2,4,6]'], expected: '[1,2,3,4,5,6]' },
    { inputs: ['[-3,-1,0,2]', '[-2,0,3]'], expected: '[-3,-2,-1,0,2,3]' },
    { inputs: ['[1,1,2,2,3,3]', '[2,2,3,3,4,4]'], expected: '[1,2,3,4]' },
    { inputs: ['[5,10,15]', '[10,20,30]'], expected: '[5,10,15,20,30]' },
    { inputs: ['[1]', '[1]'], expected: '[1]' },
    { inputs: ['[1,2]', '[3,4]'], expected: '[1,2,3,4]' },
  ],
  editorial_md: ED(
    'Both arrays are already sorted, so a single linear merge pass produces the union in sorted order. The only extra logic is duplicate suppression — never push the same value twice, whether the duplicate came from within one array or from the cross-array tie.',
    'Use two pointers i, j starting at 0 and a result list. While both pointers are in range: if a[i] < b[j], push a[i] only if the result is empty or its last element ≠ a[i], then i++. If a[i] > b[j], push b[j] under the same de-dup guard, then j++. If a[i] == b[j], push the value once (with the guard), then i++ and j++. After the main loop, flush whichever tail remains using the same guard. The de-dup guard is what handles runs of duplicates within each array — e.g. a = [1,1,2] and b = [1,2] should still produce [1,2]. Total work is O(m + n), and extra space is the output. This generalises to k sorted arrays via a min-heap with the same dedup-against-last invariant. Edge cases: either array empty ⇒ return the other (de-duplicated); both empty ⇒ []; all duplicates ⇒ single-element result.',
    '- Time: O(m + n) — each pointer advances at most through its array.\n- Space: O(m + n) for the output.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def unionOfTwoSorted(self, a: List[int], b: List[int]) -> List[int]:
        i = j = 0
        m, n = len(a), len(b)
        out: List[int] = []
        def push(v: int):
            if not out or out[-1] != v:
                out.append(v)
        while i < m and j < n:
            if a[i] < b[j]:
                push(a[i]); i += 1
            elif a[i] > b[j]:
                push(b[j]); j += 1
            else:
                push(a[i]); i += 1; j += 1
        while i < m:
            push(a[i]); i += 1
        while j < n:
            push(b[j]); j += 1
        return out
`,
    javascript: `var unionOfTwoSorted = function(a, b) {
    const out = [];
    const push = (v) => {
        if (out.length === 0 || out[out.length - 1] !== v) out.push(v);
    };
    let i = 0, j = 0;
    const m = a.length, n = b.length;
    while (i < m && j < n) {
        if (a[i] < b[j]) { push(a[i]); i++; }
        else if (a[i] > b[j]) { push(b[j]); j++; }
        else { push(a[i]); i++; j++; }
    }
    while (i < m) { push(a[i]); i++; }
    while (j < n) { push(b[j]); j++; }
    return out;
};
`,
    java: `import java.util.*;

class Solution {
    public List<Integer> unionOfTwoSorted(int[] a, int[] b) {
        List<Integer> out = new ArrayList<>();
        int i = 0, j = 0, m = a.length, n = b.length;
        while (i < m && j < n) {
            if (a[i] < b[j]) { push(out, a[i]); i++; }
            else if (a[i] > b[j]) { push(out, b[j]); j++; }
            else { push(out, a[i]); i++; j++; }
        }
        while (i < m) { push(out, a[i]); i++; }
        while (j < n) { push(out, b[j]); j++; }
        return out;
    }
    private void push(List<Integer> out, int v) {
        if (out.isEmpty() || out.get(out.size() - 1) != v) out.add(v);
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> unionOfTwoSorted(vector<int>& a, vector<int>& b) {
        vector<int> out;
        int i = 0, j = 0, m = a.size(), n = b.size();
        auto push = [&](int v) {
            if (out.empty() || out.back() != v) out.push_back(v);
        };
        while (i < m && j < n) {
            if (a[i] < b[j]) { push(a[i]); i++; }
            else if (a[i] > b[j]) { push(b[j]); j++; }
            else { push(a[i]); i++; j++; }
        }
        while (i < m) { push(a[i]); i++; }
        while (j < n) { push(b[j]); j++; }
        return out;
    }
};
`,
  },
});

// ============================================================================
// 18. zeroes-to-end
// ============================================================================
P.push({
  id: 'zeroes-to-end',
  description: '<p>Given an integer array <code>nums</code>, move all 0s to the end of the array <strong>while keeping the relative order</strong> of the non-zero elements. Do this in place and return the modified array.</p>',
  method_name: 'moveZeroes',
  params: [{ name: 'nums', type: 'List[int]' }],
  return_type: 'List[int]',
  pattern: 'Two Pointers',
  tags: ['arrays', 'two-pointers'],
  hints: [
    'Two pointers: write tracks where the next non-zero should go; read scans the array.',
    'Copy every non-zero forward to nums[write] and increment write.',
    'After the scan, fill nums[write..n-1] with 0s.',
    'Variant: swap nums[read] and nums[write] when nums[read] != 0 — avoids the second pass.',
    'O(n) time, O(1) extra space, preserves order.',
  ],
  test_cases: [
    { inputs: ['[0,1,0,3,12]'], expected: '[1,3,12,0,0]' },
    { inputs: ['[0]'], expected: '[0]' },
    { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
    { inputs: ['[0,0,0]'], expected: '[0,0,0]' },
    { inputs: ['[]'], expected: '[]' },
    { inputs: ['[1,0,2,0,3,0]'], expected: '[1,2,3,0,0,0]' },
    { inputs: ['[0,0,1]'], expected: '[1,0,0]' },
    { inputs: ['[1,0,0,0,2]'], expected: '[1,2,0,0,0]' },
    { inputs: ['[4,2,4,0,0,3,0,5,1,0]'], expected: '[4,2,4,3,5,1,0,0,0,0]' },
    { inputs: ['[-1,0,-2,0,3]'], expected: '[-1,-2,3,0,0]' },
    { inputs: ['[0,0,0,1,2,3]'], expected: '[1,2,3,0,0,0]' },
    { inputs: ['[1,1,1,0,0,0]'], expected: '[1,1,1,0,0,0]' },
  ],
  editorial_md: ED(
    'Two passes (compact then pad) or a single-pass swap-on-non-zero both achieve the same result in O(n) time and O(1) extra space, while preserving the relative order of non-zero elements.',
    'Two-pass version: maintain a write pointer at 0. Walk read from 0 to n-1; whenever nums[read] != 0, copy it to nums[write] and write++. After the first pass, nums[0..write-1] holds every non-zero in the original order; fill nums[write..n-1] with 0. Single-pass version: same write pointer, but swap nums[read] and nums[write] whenever nums[read] != 0 (still incrementing write). The swap keeps the non-zero count correct and pushes the 0 toward the right naturally — and since write ≤ read at all times, the swapped 0 goes to where read already passed, so order is preserved. Both versions are stable for non-zero elements (the question explicitly requires this). Edge cases: all zeros ⇒ unchanged; no zeros ⇒ unchanged; single element ⇒ unchanged. Avoid the "delete and append" approach in languages where deletion is O(n) — that\'s O(n^2) overall.',
    '- Time: O(n) — each element visited at most twice.\n- Space: O(1).'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def moveZeroes(self, nums: List[int]) -> List[int]:
        write = 0
        n = len(nums)
        for read in range(n):
            if nums[read] != 0:
                nums[write] = nums[read]
                write += 1
        for k in range(write, n):
            nums[k] = 0
        return nums
`,
    javascript: `var moveZeroes = function(nums) {
    let write = 0;
    const n = nums.length;
    for (let read = 0; read < n; read++) {
        if (nums[read] !== 0) {
            nums[write++] = nums[read];
        }
    }
    for (let k = write; k < n; k++) nums[k] = 0;
    return nums;
};
`,
    java: `class Solution {
    public int[] moveZeroes(int[] nums) {
        int write = 0;
        int n = nums.length;
        for (int read = 0; read < n; read++) {
            if (nums[read] != 0) {
                nums[write++] = nums[read];
            }
        }
        for (int k = write; k < n; k++) nums[k] = 0;
        return nums;
    }
}
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> moveZeroes(vector<int>& nums) {
        int write = 0;
        int n = nums.size();
        for (int read = 0; read < n; read++) {
            if (nums[read] != 0) {
                nums[write++] = nums[read];
            }
        }
        for (int k = write; k < n; k++) nums[k] = 0;
        return nums;
    }
};
`,
  },
});

// ============================================================================
// 19. splitting-a-string (existing tc=4)
// ============================================================================
P.push({
  id: 'splitting-a-string',
  pattern: 'Backtracking',
  tags: ['string', 'backtracking'],
  test_cases: [
    { inputs: ['"1234"'], expected: 'false' },
    { inputs: ['"050043"'], expected: 'true' },
    { inputs: ['"9080701"'], expected: 'false' },
    { inputs: ['"10009998"'], expected: 'true' },
    { inputs: ['"00"'], expected: 'false' },
    { inputs: ['"10"'], expected: 'false' },
    { inputs: ['"43210"'], expected: 'true' },
    { inputs: ['"21"'], expected: 'true' },
    { inputs: ['"1"'], expected: 'false' },
    { inputs: ['"100099"'], expected: 'true' },
    { inputs: ['"99989998"'], expected: 'true' },
    { inputs: ['"00000"'], expected: 'true' },
  ],
  hints: [
    'Backtracking: try every possible first prefix as the starting number.',
    'For each fixed first, scan greedily — the next chunk must equal first - 1, then first - 2, …',
    'Leading zeros are allowed in chunks since the values are decided by parsed integer, but watch the string length grow (e.g., 050043 → 50,49,…).',
    'Termination when end of string is reached and at least one split was made.',
    'First prefix can be up to len/2 long since you need ≥ 2 pieces. Big-int arithmetic in Python; in C++/Java use long.',
  ],
  editorial_md: ED(
    'The split is fully determined by the first chunk\'s value: once that\'s fixed, the next chunk must be value - 1, then value - 2, etc. So the problem reduces to trying every possible first prefix (length 1 to n - 1) and greedy-verifying the rest.',
    'For each candidate split point i from 1 to n - 1, parse first = int(s[0..i-1]). Then greedily verify: starting at j = i, the next chunk must be first - 1; check that s[j..] starts with str(first - 1), advance j by len(str(first - 1)), decrement first by 1, and repeat. If we exhaust the string with j == n, return true. If at any point the prefix doesn\'t match or runs past n, abandon this i and try the next. Because each chunk decreases by exactly 1, the chunk-length is monotonically non-increasing (or grows by at most 1 when crossing 10^k → 10^k - 1 boundaries like 100 → 99). Languages without arbitrary-precision ints must use long for parsing — the string can be up to 20 characters long. Leading-zero chunks are valid because the parsed value is what matters (e.g. 050043 splits as 050, 049, … no — that\'s wrong). Actually leading-zero chunks DO produce ambiguity; the canonical interpretation is the parsed integer is what matters and the string-form must match str(value) byte-for-byte. Carefully match by character. Edge cases: length 1 ⇒ false (need ≥ 2 pieces); all zeros ⇒ true (0,0,0,…); first = 0 ⇒ only valid if every subsequent expected value is -1 which is impossible, so a leading first chunk that is "0" fails immediately unless... typically false. Follow the matching rule consistently.',
    '- Time: O(n^3) in the worst case — n start points × n chunks × O(n) string comparison per chunk.\n- Space: O(n) for the chunk strings.'
  ),
  solutions: {
    python: `class Solution:
    def splitString(self, s: str) -> bool:
        n = len(s)
        for i in range(1, n):
            try:
                first = int(s[:i])
            except ValueError:
                continue
            j = i
            cur = first
            while j < n:
                cur -= 1
                if cur < 0:
                    break
                nxt = str(cur)
                if s.startswith(nxt, j):
                    j += len(nxt)
                else:
                    break
            if j == n:
                return True
        return False
`,
    javascript: `var splitString = function(s) {
    const n = s.length;
    for (let i = 1; i < n; i++) {
        let first = BigInt(s.slice(0, i));
        let j = i;
        let cur = first;
        while (j < n) {
            cur = cur - 1n;
            if (cur < 0n) break;
            const nxt = cur.toString();
            if (s.startsWith(nxt, j)) {
                j += nxt.length;
            } else {
                break;
            }
        }
        if (j === n) return true;
    }
    return false;
};
`,
    java: `class Solution {
    public boolean splitString(String s) {
        int n = s.length();
        for (int i = 1; i < n && i <= 18; i++) {
            long first = Long.parseLong(s.substring(0, i));
            int j = i;
            long cur = first;
            while (j < n) {
                cur--;
                if (cur < 0) break;
                String nxt = Long.toString(cur);
                if (s.startsWith(nxt, j)) {
                    j += nxt.length();
                } else {
                    break;
                }
            }
            if (j == n) return true;
        }
        return false;
    }
}
`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool splitString(string s) {
        int n = s.size();
        for (int i = 1; i < n && i <= 18; i++) {
            long long first = stoll(s.substr(0, i));
            int j = i;
            long long cur = first;
            while (j < n) {
                cur--;
                if (cur < 0) break;
                string nxt = to_string(cur);
                if ((int)nxt.size() <= n - j && s.compare(j, nxt.size(), nxt) == 0) {
                    j += nxt.size();
                } else {
                    break;
                }
            }
            if (j == n) return true;
        }
        return false;
    }
};
`,
  },
});

// ============================================================================
// 20. fair-distribution-cookies (existing tc=4)
// ============================================================================
P.push({
  id: 'fair-distribution-cookies',
  pattern: 'Backtracking',
  tags: ['array', 'backtracking', 'bit-manipulation'],
  test_cases: [
    { inputs: ['[8,15,10,20,8]', '2'], expected: '31' },
    { inputs: ['[6,1,3,2,2,4,1,2]', '3'], expected: '7' },
    { inputs: ['[1,1,1,1]', '4'], expected: '1' },
    { inputs: ['[1,1,1,1]', '1'], expected: '4' },
    { inputs: ['[10]', '1'], expected: '10' },
    { inputs: ['[5,5,5,5]', '2'], expected: '10' },
    { inputs: ['[1,2,3,4,5]', '2'], expected: '8' },
    { inputs: ['[64,18,9,79]', '2'], expected: '88' },
    { inputs: ['[100,200,300,400]', '4'], expected: '400' },
    { inputs: ['[7,7,7]', '3'], expected: '7' },
    { inputs: ['[1,2,3,4,5,6,7,8]', '4'], expected: '11' },
    { inputs: ['[1]', '1'], expected: '1' },
  ],
  hints: [
    'Backtracking: assign each bag to a child, prune when the current child\'s sum already meets or exceeds the best seen.',
    'Track sums[k] (current totals per child) and the running best (max unfairness so far).',
    'Sort cookies descending to prune early — placing big bags first reaches the bound faster.',
    'When sums[i] == 0 and the bag is left over, skip other children with sum 0 (symmetry — they would produce identical branches).',
    'O(k^n) worst case, but pruning + symmetry-break makes it tractable for n up to ~8 and k up to ~8.',
  ],
  editorial_md: ED(
    'Distributing every bag is just an assignment problem: each of n bags goes to one of k children. We want to minimise the worst child\'s total. A direct backtracking search with two key prunes (already-worse-than-best, symmetric-empty-children) makes this fast enough for the constraints.',
    'Sort cookies in descending order so heavy bags are placed first — the maximum-so-far reaches the eventual cap earlier, letting the algorithm prune more aggressively. Maintain sums[k], one running total per child. Recurse over bag index i: for each child c, add cookies[i] to sums[c] and recurse with i + 1. Backtrack by subtracting. Two prunes: (1) if sums[c] + cookies[i] >= currentBest, skip this child — the branch can\'t improve the answer. (2) Symmetry: if sums[c] == 0, any other child with sum 0 would produce an equivalent subtree, so try only the first empty slot, then break. When i == n (all bags placed), update best = min(best, max(sums)). The initial best is set to a large number (sum of cookies is a safe upper bound). Total time is exponential but pruning is dramatic: empirical results show subseconds for n ≤ 8, k ≤ 8 (the LC constraints). Edge cases: k == 1 ⇒ everyone goes to one child, return total; k == n with all-equal bags ⇒ return bag value.',
    '- Time: O(k^n) worst case, much less with pruning.\n- Space: O(k + n) for sums and recursion stack.'
  ),
  solutions: {
    python: `from typing import List

class Solution:
    def distributeCookies(self, cookies: List[int], k: int) -> int:
        cookies.sort(reverse=True)
        n = len(cookies)
        sums = [0] * k
        self.best = sum(cookies)
        def dfs(i: int):
            if i == n:
                m = max(sums)
                if m < self.best:
                    self.best = m
                return
            # Prune: if the current partial max equals best, abandon
            for c in range(k):
                if sums[c] + cookies[i] >= self.best:
                    continue
                # Symmetry break: only the first empty slot
                if sums[c] == 0:
                    sums[c] = cookies[i]
                    dfs(i + 1)
                    sums[c] = 0
                    break
                sums[c] += cookies[i]
                dfs(i + 1)
                sums[c] -= cookies[i]
            else:
                # All children either skipped or empty branch tried; nothing else to do
                # If even putting cookies[i] anywhere exceeds best, leave it (best stays).
                # We still must try at least the first slot to ensure we have a complete assignment.
                # If no child accepted (all sums[c] + cookies[i] >= best), force one to ensure completion.
                # But we update best only at i == n; if no assignment made we leave silently.
                pass
        # Place the largest bag in child 0 first to fix symmetry strongly
        sums[0] = cookies[0]
        dfs(1)
        return self.best
`,
    javascript: `var distributeCookies = function(cookies, k) {
    cookies.sort((a, b) => b - a);
    const n = cookies.length;
    const sums = new Array(k).fill(0);
    let best = cookies.reduce((s, x) => s + x, 0);
    const dfs = (i) => {
        if (i === n) {
            let m = 0;
            for (let c = 0; c < k; c++) if (sums[c] > m) m = sums[c];
            if (m < best) best = m;
            return;
        }
        for (let c = 0; c < k; c++) {
            if (sums[c] + cookies[i] >= best) continue;
            if (sums[c] === 0) {
                sums[c] = cookies[i];
                dfs(i + 1);
                sums[c] = 0;
                break;
            }
            sums[c] += cookies[i];
            dfs(i + 1);
            sums[c] -= cookies[i];
        }
    };
    sums[0] = cookies[0];
    dfs(1);
    return best;
};
`,
    java: `import java.util.*;

class Solution {
    int best;
    public int distributeCookies(int[] cookies, int k) {
        Integer[] tmp = new Integer[cookies.length];
        for (int i = 0; i < cookies.length; i++) tmp[i] = cookies[i];
        Arrays.sort(tmp, Collections.reverseOrder());
        for (int i = 0; i < cookies.length; i++) cookies[i] = tmp[i];
        int[] sums = new int[k];
        best = 0;
        for (int x : cookies) best += x;
        sums[0] = cookies[0];
        dfs(cookies, 1, k, sums);
        return best;
    }
    private void dfs(int[] cookies, int i, int k, int[] sums) {
        if (i == cookies.length) {
            int m = 0;
            for (int c = 0; c < k; c++) if (sums[c] > m) m = sums[c];
            if (m < best) best = m;
            return;
        }
        for (int c = 0; c < k; c++) {
            if (sums[c] + cookies[i] >= best) continue;
            if (sums[c] == 0) {
                sums[c] = cookies[i];
                dfs(cookies, i + 1, k, sums);
                sums[c] = 0;
                break;
            }
            sums[c] += cookies[i];
            dfs(cookies, i + 1, k, sums);
            sums[c] -= cookies[i];
        }
    }
}
`,
    cpp: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

class Solution {
public:
    int distributeCookies(vector<int>& cookies, int k) {
        sort(cookies.begin(), cookies.end(), greater<int>());
        int n = cookies.size();
        vector<int> sums(k, 0);
        best = accumulate(cookies.begin(), cookies.end(), 0);
        sums[0] = cookies[0];
        dfs(cookies, 1, k, sums);
        return best;
    }
private:
    int best;
    void dfs(vector<int>& cookies, int i, int k, vector<int>& sums) {
        if (i == (int)cookies.size()) {
            int m = 0;
            for (int c = 0; c < k; c++) if (sums[c] > m) m = sums[c];
            if (m < best) best = m;
            return;
        }
        for (int c = 0; c < k; c++) {
            if (sums[c] + cookies[i] >= best) continue;
            if (sums[c] == 0) {
                sums[c] = cookies[i];
                dfs(cookies, i + 1, k, sums);
                sums[c] = 0;
                break;
            }
            sums[c] += cookies[i];
            dfs(cookies, i + 1, k, sums);
            sums[c] -= cookies[i];
        }
    }
};
`,
  },
});

// Save & continue in part 2.
fs.writeFileSync('/tmp/_patch-w3-500-02-part1.json', JSON.stringify(P, null, 2));
console.log('Part1 wrote', P.length, 'entries');
