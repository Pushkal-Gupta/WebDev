BEGIN;

-- Idempotent: clean up any existing data for these problems
DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'plus-one', 'power-of-three', 'integer-to-roman', 'multiply-strings',
  'sum-of-two-integers', 'missing-number-xor', 'reverse-integer', 'power-of-two',
  'valid-square', 'max-points-on-line', 'rectangle-overlap', 'k-closest-origin', 'minimum-area-rectangle'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'plus-one', 'power-of-three', 'integer-to-roman', 'multiply-strings',
  'sum-of-two-integers', 'missing-number-xor', 'reverse-integer', 'power-of-two',
  'valid-square', 'max-points-on-line', 'rectangle-overlap', 'k-closest-origin', 'minimum-area-rectangle'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'plus-one', 'power-of-three', 'integer-to-roman', 'multiply-strings',
  'sum-of-two-integers', 'missing-number-xor', 'reverse-integer', 'power-of-two',
  'valid-square', 'max-points-on-line', 'rectangle-overlap', 'k-closest-origin', 'minimum-area-rectangle'
);

-- ============================================================
-- 1. plus-one (Math, Easy, LeetCode 66)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'plus-one', 'math', 'Plus One', 'Easy',
  $DESC$<p>You are given a <strong>large integer</strong> represented as an integer array <code>digits</code>, where each <code>digits[i]</code> is the <code>i<sup>th</sup></code> digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading <code>0</code>'s.</p>
<p>Increment the large integer by one and return the <em>resulting array of digits</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: digits = [1,2,3]
Output: [1,2,4]
Explanation: The array represents the integer 123. Incrementing by one gives 124.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: digits = [4,3,2,1]
Output: [4,3,2,2]</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: digits = [9]
Output: [1,0]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= digits.length &lt;= 100</code></li>
<li><code>0 &lt;= digits[i] &lt;= 9</code></li>
<li><code>digits</code> does not contain any leading <code>0</code>'s.</li>
</ul>$DESC$,
  '', ARRAY['Start from the rightmost digit and propagate the carry.', 'If a digit becomes 10, set it to 0 and carry 1 to the next digit.', 'If carry remains after processing all digits, prepend 1.'],
  '200', 'https://leetcode.com/problems/plus-one/',
  'plusOne', '[{"name":"digits","type":"List[int]"}]'::jsonb, 'List[int]',
  '[{"inputs":["[1,2,3]"],"expected":"[1,2,4]"},{"inputs":["[4,3,2,1]"],"expected":"[4,3,2,2]"},{"inputs":["[9]"],"expected":"[1,0]"},{"inputs":["[0]"],"expected":"[1]"},{"inputs":["[9,9]"],"expected":"[1,0,0]"},{"inputs":["[9,9,9]"],"expected":"[1,0,0,0]"},{"inputs":["[1,0,0]"],"expected":"[1,0,1]"},{"inputs":["[8,9,9]"],"expected":"[9,0,0]"},{"inputs":["[1]"],"expected":"[2]"},{"inputs":["[5,5,5]"],"expected":"[5,5,6]"},{"inputs":["[2,9]"],"expected":"[3,0]"},{"inputs":["[1,9,9]"],"expected":"[2,0,0]"},{"inputs":["[7,8,9]"],"expected":"[7,9,0]"},{"inputs":["[6,1,4,5,3,9,0,1,9,5,1,8,6,7,0,5,5,4,3]"],"expected":"[6,1,4,5,3,9,0,1,9,5,1,8,6,7,0,5,5,4,4]"},{"inputs":["[3,9,9,9]"],"expected":"[4,0,0,0]"},{"inputs":["[5,0,0,0]"],"expected":"[5,0,0,1]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'plus-one', 1, 'Right-to-Left Carry Propagation',
  'We simulate adding 1 to the number by traversing from the least significant digit. If the digit is less than 9, we simply increment it and return. Otherwise, we set it to 0 and continue propagating the carry. If we finish the loop, all digits were 9, so we prepend a 1.',
  '["Traverse the digits array from right to left.","If the current digit is less than 9, increment it by 1 and return the array immediately.","Otherwise, set the current digit to 0 (carry propagates).","If the loop finishes without returning, all digits were 9. Insert 1 at the beginning.","Return the modified array."]'::jsonb,
  $PY$class Solution:
    def plusOne(self, digits: list[int]) -> list[int]:
        for i in range(len(digits) - 1, -1, -1):
            if digits[i] < 9:
                digits[i] += 1
                return digits
            digits[i] = 0
        return [1] + digits$PY$,
  $JS$var plusOne = function(digits) {
    for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) {
            digits[i]++;
            return digits;
        }
        digits[i] = 0;
    }
    digits.unshift(1);
    return digits;
};$JS$,
  $JAVA$class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;
                return digits;
            }
            digits[i] = 0;
        }
        int[] result = new int[digits.length + 1];
        result[0] = 1;
        return result;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 2. power-of-three (Math, Easy, LeetCode 326)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'power-of-three', 'math', 'Power of Three', 'Easy',
  $DESC$<p>Given an integer <code>n</code>, return <code>true</code> if it is a power of three. Otherwise, return <code>false</code>.</p>
<p>An integer <code>n</code> is a power of three if there exists an integer <code>x</code> such that <code>n == 3<sup>x</sup></code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 27
Output: true
Explanation: 27 = 3^3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 0
Output: false
Explanation: There is no x where 3^x = 0.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: n = -1
Output: false
Explanation: There is no x where 3^x = -1.</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['A power of three is always positive.', 'Repeatedly divide by 3 and check if the remainder is 0.', 'Alternatively, the largest power of 3 within int range is 3^19 = 1162261467. Check if n > 0 and 1162261467 % n == 0.'],
  '200', 'https://leetcode.com/problems/power-of-three/',
  'isPowerOfThree', '[{"name":"n","type":"int"}]'::jsonb, 'bool',
  '[{"inputs":["27"],"expected":"true"},{"inputs":["0"],"expected":"false"},{"inputs":["9"],"expected":"true"},{"inputs":["45"],"expected":"false"},{"inputs":["1"],"expected":"true"},{"inputs":["3"],"expected":"true"},{"inputs":["-3"],"expected":"false"},{"inputs":["81"],"expected":"true"},{"inputs":["243"],"expected":"true"},{"inputs":["100"],"expected":"false"},{"inputs":["729"],"expected":"true"},{"inputs":["2187"],"expected":"true"},{"inputs":["6561"],"expected":"true"},{"inputs":["10"],"expected":"false"},{"inputs":["-27"],"expected":"false"},{"inputs":["1162261467"],"expected":"true"},{"inputs":["1162261468"],"expected":"false"},{"inputs":["2"],"expected":"false"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'power-of-three', 1, 'Iterative Division',
  'If n is a power of three, we can keep dividing it by 3 until we reach 1. If at any point the remainder is not 0, it is not a power of three. We also handle the edge case where n <= 0.',
  '["If n <= 0, return false.","While n > 1, check if n % 3 != 0. If so, return false.","Divide n by 3.","If the loop exits with n == 1, return true."]'::jsonb,
  $PY$class Solution:
    def isPowerOfThree(self, n: int) -> bool:
        if n <= 0:
            return False
        while n > 1:
            if n % 3 != 0:
                return False
            n //= 3
        return True$PY$,
  $JS$var isPowerOfThree = function(n) {
    if (n <= 0) return false;
    while (n > 1) {
        if (n % 3 !== 0) return false;
        n = Math.floor(n / 3);
    }
    return true;
};$JS$,
  $JAVA$class Solution {
    public boolean isPowerOfThree(int n) {
        if (n <= 0) return false;
        while (n > 1) {
            if (n % 3 != 0) return false;
            n /= 3;
        }
        return true;
    }
}$JAVA$,
  'O(log3 n)', 'O(1)'
);

-- ============================================================
-- 3. integer-to-roman (Math, Medium, LeetCode 12)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'integer-to-roman', 'math', 'Integer to Roman', 'Medium',
  $DESC$<p>Given an integer, convert it to a Roman numeral.</p>
<p>Roman numerals are formed by appending the conversions of decimal place values from highest to lowest. Converting a decimal place value into a Roman numeral has the following rules:</p>
<ul>
<li>If the value does not start with 4 or 9, select the symbol of the maximal value that can be subtracted from the input, append that symbol and subtract its value, and convert the remainder.</li>
<li>If the value starts with 4 or 9, use the <strong>subtractive form</strong> representing one symbol subtracted from the following symbol, for example, 4 is <code>IV</code> (1 before 5) and 9 is <code>IX</code> (1 before 10).</li>
</ul>
<table>
<tr><th>Symbol</th><th>Value</th></tr>
<tr><td>I</td><td>1</td></tr>
<tr><td>V</td><td>5</td></tr>
<tr><td>X</td><td>10</td></tr>
<tr><td>L</td><td>50</td></tr>
<tr><td>C</td><td>100</td></tr>
<tr><td>D</td><td>500</td></tr>
<tr><td>M</td><td>1000</td></tr>
</table>
<p><strong>Example 1:</strong></p>
<pre>Input: num = 3749
Output: "MMMDCCXLIX"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: num = 58
Output: "LVIII"</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: num = 1994
Output: "MCMXCIV"</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= num &lt;= 3999</code></li>
</ul>$DESC$,
  '', ARRAY['Use a greedy approach with a value-symbol mapping that includes subtractive forms.', 'The mapping should include: 1000=M, 900=CM, 500=D, 400=CD, 100=C, 90=XC, 50=L, 40=XL, 10=X, 9=IX, 5=V, 4=IV, 1=I.', 'Repeatedly subtract the largest possible value and append its symbol.'],
  '200', 'https://leetcode.com/problems/integer-to-roman/',
  'intToRoman', '[{"name":"num","type":"int"}]'::jsonb, 'str',
  '[{"inputs":["3749"],"expected":"\"MMMDCCXLIX\""},{"inputs":["58"],"expected":"\"LVIII\""},{"inputs":["1994"],"expected":"\"MCMXCIV\""},{"inputs":["1"],"expected":"\"I\""},{"inputs":["4"],"expected":"\"IV\""},{"inputs":["9"],"expected":"\"IX\""},{"inputs":["40"],"expected":"\"XL\""},{"inputs":["90"],"expected":"\"XC\""},{"inputs":["400"],"expected":"\"CD\""},{"inputs":["900"],"expected":"\"CM\""},{"inputs":["3999"],"expected":"\"MMMCMXCIX\""},{"inputs":["1000"],"expected":"\"M\""},{"inputs":["444"],"expected":"\"CDXLIV\""},{"inputs":["3"],"expected":"\"III\""},{"inputs":["14"],"expected":"\"XIV\""},{"inputs":["100"],"expected":"\"C\""},{"inputs":["621"],"expected":"\"DCXXI\""},{"inputs":["2024"],"expected":"\"MMXXIV\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'integer-to-roman', 1, 'Greedy with Value-Symbol Pairs',
  'We define all 13 value-symbol pairs (including subtractive forms like 900=CM, 400=CD, etc.) in descending order. We greedily subtract the largest possible value and append the corresponding symbol until the number is reduced to 0.',
  '["Create a list of (value, symbol) pairs in descending order: [(1000,\"M\"),(900,\"CM\"),(500,\"D\"),(400,\"CD\"),(100,\"C\"),(90,\"XC\"),(50,\"L\"),(40,\"XL\"),(10,\"X\"),(9,\"IX\"),(5,\"V\"),(4,\"IV\"),(1,\"I\")].","Initialize an empty result string.","For each (value, symbol) pair, while num >= value, append symbol to result and subtract value from num.","Return the result string."]'::jsonb,
  $PY$class Solution:
    def intToRoman(self, num: int) -> str:
        pairs = [
            (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
            (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
            (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")
        ]
        result = []
        for value, symbol in pairs:
            while num >= value:
                result.append(symbol)
                num -= value
        return "".join(result)$PY$,
  $JS$var intToRoman = function(num) {
    const pairs = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
        [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
        [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
    ];
    let result = "";
    for (const [value, symbol] of pairs) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public String intToRoman(int num) {
        int[] values = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
        String[] symbols = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            while (num >= values[i]) {
                sb.append(symbols[i]);
                num -= values[i];
            }
        }
        return sb.toString();
    }
}$JAVA$,
  'O(1)', 'O(1)'
);

-- ============================================================
-- 4. multiply-strings (Math, Medium, LeetCode 43)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'multiply-strings', 'math', 'Multiply Strings', 'Medium',
  $DESC$<p>Given two non-negative integers <code>num1</code> and <code>num2</code> represented as strings, return the product of <code>num1</code> and <code>num2</code>, also represented as a string.</p>
<p><strong>Note:</strong> You must not use any built-in BigInteger library or convert the inputs to integer directly.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: num1 = "2", num2 = "3"
Output: "6"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: num1 = "123", num2 = "456"
Output: "56088"</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= num1.length, num2.length &lt;= 200</code></li>
<li><code>num1</code> and <code>num2</code> consist of digits only.</li>
<li>Both <code>num1</code> and <code>num2</code> do not contain any leading zero, except the number 0 itself.</li>
</ul>$DESC$,
  '', ARRAY['Use grade-school multiplication: multiply each digit pair and accumulate at the correct position.', 'The product of digit at index i and digit at index j contributes to positions i+j and i+j+1 in the result.', 'Handle the carry as you go and strip leading zeros.'],
  '200', 'https://leetcode.com/problems/multiply-strings/',
  'multiply', '[{"name":"num1","type":"str"},{"name":"num2","type":"str"}]'::jsonb, 'str',
  '[{"inputs":["\"2\"","\"3\""],"expected":"\"6\""},{"inputs":["\"123\"","\"456\""],"expected":"\"56088\""},{"inputs":["\"0\"","\"0\""],"expected":"\"0\""},{"inputs":["\"0\"","\"12345\""],"expected":"\"0\""},{"inputs":["\"1\"","\"1\""],"expected":"\"1\""},{"inputs":["\"99\"","\"99\""],"expected":"\"9801\""},{"inputs":["\"10\"","\"10\""],"expected":"\"100\""},{"inputs":["\"999\"","\"999\""],"expected":"\"998001\""},{"inputs":["\"12\"","\"12\""],"expected":"\"144\""},{"inputs":["\"100\"","\"100\""],"expected":"\"10000\""},{"inputs":["\"9133\"","\"0\""],"expected":"\"0\""},{"inputs":["\"498828660196\"","\"840477629533\""],"expected":"\"419254329864656431168468\""},{"inputs":["\"25\"","\"4\""],"expected":"\"100\""},{"inputs":["\"111\"","\"111\""],"expected":"\"12321\""},{"inputs":["\"37\"","\"29\""],"expected":"\"1073\""},{"inputs":["\"50\"","\"20\""],"expected":"\"1000\""}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'multiply-strings', 1, 'Grade-School Multiplication',
  'We simulate the manual multiplication process. For each pair of digits (one from each number), we multiply them and add the result to the appropriate position in a result array. The key insight is that digit at index i in num1 multiplied by digit at index j in num2 contributes to position i+j and i+j+1 in the result.',
  '["Create a result array of size len(num1) + len(num2), initialized to 0.","Iterate i from right to left over num1, and j from right to left over num2.","Multiply digits: product = digit1 * digit2 + result[i+j+1].","Set result[i+j+1] = product % 10 and add product // 10 to result[i+j].","Convert the result array to a string, stripping leading zeros.","Return \"0\" if the result is empty after stripping."]'::jsonb,
  $PY$class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        m, n = len(num1), len(num2)
        result = [0] * (m + n)
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                mul = int(num1[i]) * int(num2[j])
                p1, p2 = i + j, i + j + 1
                total = mul + result[p2]
                result[p2] = total % 10
                result[p1] += total // 10
        result_str = "".join(str(d) for d in result).lstrip("0")
        return result_str if result_str else "0"$PY$,
  $JS$var multiply = function(num1, num2) {
    const m = num1.length, n = num2.length;
    const result = new Array(m + n).fill(0);
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            const mul = Number(num1[i]) * Number(num2[j]);
            const p1 = i + j, p2 = i + j + 1;
            const total = mul + result[p2];
            result[p2] = total % 10;
            result[p1] += Math.floor(total / 10);
        }
    }
    let str = result.join("").replace(/^0+/, "");
    return str || "0";
};$JS$,
  $JAVA$class Solution {
    public String multiply(String num1, String num2) {
        int m = num1.length(), n = num2.length();
        int[] result = new int[m + n];
        for (int i = m - 1; i >= 0; i--) {
            for (int j = n - 1; j >= 0; j--) {
                int mul = (num1.charAt(i) - '0') * (num2.charAt(j) - '0');
                int p1 = i + j, p2 = i + j + 1;
                int total = mul + result[p2];
                result[p2] = total % 10;
                result[p1] += total / 10;
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int d : result) {
            if (!(sb.length() == 0 && d == 0)) {
                sb.append(d);
            }
        }
        return sb.length() == 0 ? "0" : sb.toString();
    }
}$JAVA$,
  'O(m * n)', 'O(m + n)'
);

-- ============================================================
-- 5. sum-of-two-integers (Bit Manipulation, Medium, LeetCode 371)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'sum-of-two-integers', 'bit-manipulation', 'Sum of Two Integers', 'Medium',
  $DESC$<p>Given two integers <code>a</code> and <code>b</code>, return the <strong>sum of the two integers</strong> without using the operators <code>+</code> and <code>-</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: a = 1, b = 2
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: a = 2, b = 3
Output: 5</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-1000 &lt;= a, b &lt;= 1000</code></li>
</ul>$DESC$,
  '', ARRAY['XOR gives the sum without carry. AND followed by left shift gives the carry.', 'Repeat until carry is 0: new a = a XOR b, new b = (a AND b) << 1.', 'In Python, use a 32-bit mask (0xFFFFFFFF) since Python integers have arbitrary precision.'],
  '200', 'https://leetcode.com/problems/sum-of-two-integers/',
  'getSum', '[{"name":"a","type":"int"},{"name":"b","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["1","2"],"expected":"3"},{"inputs":["2","3"],"expected":"5"},{"inputs":["0","0"],"expected":"0"},{"inputs":["0","5"],"expected":"5"},{"inputs":["5","0"],"expected":"5"},{"inputs":["-1","1"],"expected":"0"},{"inputs":["-1","-1"],"expected":"-2"},{"inputs":["10","20"],"expected":"30"},{"inputs":["-10","-20"],"expected":"-30"},{"inputs":["100","200"],"expected":"300"},{"inputs":["-100","100"],"expected":"0"},{"inputs":["1000","-1000"],"expected":"0"},{"inputs":["7","8"],"expected":"15"},{"inputs":["-5","3"],"expected":"-2"},{"inputs":["3","-5"],"expected":"-2"},{"inputs":["-999","999"],"expected":"0"},{"inputs":["123","456"],"expected":"579"},{"inputs":["-50","-75"],"expected":"-125"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'sum-of-two-integers', 1, 'Bit Manipulation with Carry',
  'Addition can be decomposed into two operations: XOR gives the sum without considering carry, and AND followed by left shift gives the carry. We repeat this until the carry is 0. In Python, we must mask to 32 bits since Python integers have unlimited precision.',
  '["Use a 32-bit mask: mask = 0xFFFFFFFF.","While b is not 0 (after masking): compute carry = (a AND b) << 1, then a = a XOR b, then b = carry. Mask both a and b with the 32-bit mask.","After the loop, if a > 0x7FFFFFFF (the max positive 32-bit int), convert from unsigned to signed by computing a - (mask + 1).","Return a."]'::jsonb,
  $PY$class Solution:
    def getSum(self, a: int, b: int) -> int:
        mask = 0xFFFFFFFF
        max_int = 0x7FFFFFFF
        a &= mask
        b &= mask
        while b != 0:
            carry = (a & b) << 1 & mask
            a = a ^ b
            b = carry
        return a if a <= max_int else a - mask - 1$PY$,
  $JS$var getSum = function(a, b) {
    while (b !== 0) {
        const carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
    }
    return a;
};$JS$,
  $JAVA$class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
}$JAVA$,
  'O(1)', 'O(1)'
);

-- ============================================================
-- 6. missing-number-xor (Bit Manipulation, Easy, LeetCode 268)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'missing-number-xor', 'bit-manipulation', 'Missing Number (XOR)', 'Easy',
  $DESC$<p>Given an array <code>nums</code> containing <code>n</code> distinct numbers in the range <code>[0, n]</code>, return the <em>only number in the range that is missing from the array</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,0,1]
Output: 2
Explanation: n = 3 since there are 3 numbers, so all numbers are in the range [0,3]. 2 is the missing number.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [0,1]
Output: 2
Explanation: n = 2 since there are 2 numbers, so all numbers are in the range [0,2]. 2 is the missing number.</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: nums = [9,6,4,2,3,5,7,0,1]
Output: 8</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>n == nums.length</code></li>
<li><code>1 &lt;= n &lt;= 10<sup>4</sup></code></li>
<li><code>0 &lt;= nums[i] &lt;= n</code></li>
<li>All the numbers of <code>nums</code> are <strong>unique</strong>.</li>
</ul>$DESC$,
  '', ARRAY['XOR of a number with itself is 0. XOR of a number with 0 is itself.', 'XOR all numbers from 0 to n together with all numbers in the array.', 'Every number that appears in the array cancels out, leaving only the missing number.'],
  '200', 'https://leetcode.com/problems/missing-number/',
  'missingNumber', '[{"name":"nums","type":"List[int]"}]'::jsonb, 'int',
  '[{"inputs":["[3,0,1]"],"expected":"2"},{"inputs":["[0,1]"],"expected":"2"},{"inputs":["[9,6,4,2,3,5,7,0,1]"],"expected":"8"},{"inputs":["[0]"],"expected":"1"},{"inputs":["[1]"],"expected":"0"},{"inputs":["[0,1,2,3,4,5,6,7,9]"],"expected":"8"},{"inputs":["[1,2,3]"],"expected":"0"},{"inputs":["[0,2,3]"],"expected":"1"},{"inputs":["[0,1,3]"],"expected":"2"},{"inputs":["[0,1,2]"],"expected":"3"},{"inputs":["[5,3,0,1,4]"],"expected":"2"},{"inputs":["[2,0,1,4,3,6]"],"expected":"5"},{"inputs":["[8,6,4,2,3,5,7,0]"],"expected":"1"},{"inputs":["[0,1,2,3,5]"],"expected":"4"},{"inputs":["[1,0,3,4,2,6]"],"expected":"5"},{"inputs":["[3,2,0]"],"expected":"1"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'missing-number-xor', 1, 'XOR Approach',
  'XOR has the property that a ^ a = 0 and a ^ 0 = a. If we XOR all indices 0 to n with all values in the array, every number that is present cancels out, leaving only the missing number.',
  '["Initialize result = n (the length of the array).","For each index i from 0 to n-1, XOR result with both i and nums[i].","The final result is the missing number."]'::jsonb,
  $PY$class Solution:
    def missingNumber(self, nums: list[int]) -> int:
        result = len(nums)
        for i in range(len(nums)):
            result ^= i ^ nums[i]
        return result$PY$,
  $JS$var missingNumber = function(nums) {
    let result = nums.length;
    for (let i = 0; i < nums.length; i++) {
        result ^= i ^ nums[i];
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public int missingNumber(int[] nums) {
        int result = nums.length;
        for (int i = 0; i < nums.length; i++) {
            result ^= i ^ nums[i];
        }
        return result;
    }
}$JAVA$,
  'O(n)', 'O(1)'
);

-- ============================================================
-- 7. reverse-integer (Bit Manipulation, Medium, LeetCode 7)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'reverse-integer', 'bit-manipulation', 'Reverse Integer', 'Medium',
  $DESC$<p>Given a signed 32-bit integer <code>x</code>, return <code>x</code> with its digits reversed. If reversing <code>x</code> causes the value to go outside the signed 32-bit integer range <code>[-2<sup>31</sup>, 2<sup>31</sup> - 1]</code>, then return <code>0</code>.</p>
<p><strong>Assume the environment does not allow you to store 64-bit integers (signed or unsigned).</strong></p>
<p><strong>Example 1:</strong></p>
<pre>Input: x = 123
Output: 321</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: x = -123
Output: -321</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: x = 120
Output: 21</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-2<sup>31</sup> &lt;= x &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['Pop digits one by one from x using modulo 10 and push them to the result.', 'Check for overflow before multiplying result by 10 or adding the new digit.', 'Handle negative numbers by tracking the sign separately or using the fact that Python modulo preserves sign.'],
  '200', 'https://leetcode.com/problems/reverse-integer/',
  'reverse', '[{"name":"x","type":"int"}]'::jsonb, 'int',
  '[{"inputs":["123"],"expected":"321"},{"inputs":["-123"],"expected":"-321"},{"inputs":["120"],"expected":"21"},{"inputs":["0"],"expected":"0"},{"inputs":["1"],"expected":"1"},{"inputs":["-1"],"expected":"-1"},{"inputs":["100"],"expected":"1"},{"inputs":["1534236469"],"expected":"0"},{"inputs":["-2147483648"],"expected":"0"},{"inputs":["2147483647"],"expected":"0"},{"inputs":["1463847412"],"expected":"2147483641"},{"inputs":["-1463847412"],"expected":"-2147483641"},{"inputs":["10"],"expected":"1"},{"inputs":["1000000003"],"expected":"0"},{"inputs":["900000"],"expected":"9"},{"inputs":["-10"],"expected":"-1"},{"inputs":["1200"],"expected":"21"},{"inputs":["-2100"],"expected":"-12"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'reverse-integer', 1, 'Digit-by-Digit Reversal with Overflow Check',
  'We pop the last digit of x using modulo and division, and push it to the result by multiplying by 10 and adding. Before each push, we check if the result would overflow the 32-bit signed integer range.',
  '["Define INT_MAX = 2^31 - 1 = 2147483647 and INT_MIN = -2^31 = -2147483648.","Initialize result = 0.","While x != 0: pop the last digit (digit = x % 10, x = x // 10 toward zero).","Before pushing, check overflow: if result > INT_MAX/10 or (result == INT_MAX/10 and digit > 7), return 0. Similarly for negative overflow.","Push digit: result = result * 10 + digit.","Return result."]'::jsonb,
  $PY$class Solution:
    def reverse(self, x: int) -> int:
        INT_MAX = 2147483647
        INT_MIN = -2147483648
        result = 0
        sign = 1 if x >= 0 else -1
        x = abs(x)
        while x != 0:
            digit = x % 10
            x //= 10
            if result > INT_MAX // 10 or (result == INT_MAX // 10 and digit > 7):
                return 0
            result = result * 10 + digit
        return sign * result$PY$,
  $JS$var reverse = function(x) {
    const INT_MAX = 2147483647;
    const INT_MIN = -2147483648;
    let result = 0;
    while (x !== 0) {
        const digit = x % 10 | 0;
        x = (x / 10) | 0;
        if (result > Math.floor(INT_MAX / 10) || (result === Math.floor(INT_MAX / 10) && digit > 7)) return 0;
        if (result < Math.ceil(INT_MIN / 10) || (result === Math.ceil(INT_MIN / 10) && digit < -8)) return 0;
        result = result * 10 + digit;
    }
    return result;
};$JS$,
  $JAVA$class Solution {
    public int reverse(int x) {
        int result = 0;
        while (x != 0) {
            int digit = x % 10;
            x /= 10;
            if (result > Integer.MAX_VALUE / 10 || (result == Integer.MAX_VALUE / 10 && digit > 7)) return 0;
            if (result < Integer.MIN_VALUE / 10 || (result == Integer.MIN_VALUE / 10 && digit < -8)) return 0;
            result = result * 10 + digit;
        }
        return result;
    }
}$JAVA$,
  'O(log x)', 'O(1)'
);

-- ============================================================
-- 8. power-of-two (Bit Manipulation, Easy, LeetCode 231)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'power-of-two', 'bit-manipulation', 'Power of Two', 'Easy',
  $DESC$<p>Given an integer <code>n</code>, return <code>true</code> if it is a power of two. Otherwise, return <code>false</code>.</p>
<p>An integer <code>n</code> is a power of two if there exists an integer <code>x</code> such that <code>n == 2<sup>x</sup></code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: n = 1
Output: true
Explanation: 2^0 = 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: n = 16
Output: true
Explanation: 2^4 = 16</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: n = 3
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>-2<sup>31</sup> &lt;= n &lt;= 2<sup>31</sup> - 1</code></li>
</ul>$DESC$,
  '', ARRAY['A power of two in binary has exactly one 1-bit.', 'n & (n - 1) clears the lowest set bit. For a power of two, this results in 0.', 'Make sure n is positive before checking.'],
  '200', 'https://leetcode.com/problems/power-of-two/',
  'isPowerOfTwo', '[{"name":"n","type":"int"}]'::jsonb, 'bool',
  '[{"inputs":["1"],"expected":"true"},{"inputs":["16"],"expected":"true"},{"inputs":["3"],"expected":"false"},{"inputs":["0"],"expected":"false"},{"inputs":["2"],"expected":"true"},{"inputs":["4"],"expected":"true"},{"inputs":["8"],"expected":"true"},{"inputs":["32"],"expected":"true"},{"inputs":["64"],"expected":"true"},{"inputs":["128"],"expected":"true"},{"inputs":["256"],"expected":"true"},{"inputs":["1024"],"expected":"true"},{"inputs":["-1"],"expected":"false"},{"inputs":["-16"],"expected":"false"},{"inputs":["6"],"expected":"false"},{"inputs":["10"],"expected":"false"},{"inputs":["100"],"expected":"false"},{"inputs":["1073741824"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'power-of-two', 1, 'Bit Manipulation (n & n-1)',
  'A power of two has exactly one set bit in its binary representation (e.g., 1=1, 2=10, 4=100). The expression n & (n-1) turns off the lowest set bit. So for powers of two, n & (n-1) == 0. We also need n > 0 since 0 and negative numbers are not powers of two.',
  '["Check if n > 0.","Compute n & (n - 1). If it equals 0, n is a power of two.","Return n > 0 and n & (n - 1) == 0."]'::jsonb,
  $PY$class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and (n & (n - 1)) == 0$PY$,
  $JS$var isPowerOfTwo = function(n) {
    return n > 0 && (n & (n - 1)) === 0;
};$JS$,
  $JAVA$class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}$JAVA$,
  'O(1)', 'O(1)'
);

-- ============================================================
-- 9. valid-square (Geometry, Medium, LeetCode 593)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'valid-square', 'geometry', 'Valid Square', 'Medium',
  $DESC$<p>Given the coordinates of four points in 2D space <code>p1</code>, <code>p2</code>, <code>p3</code>, <code>p4</code>, return <code>true</code> if the four points construct a valid square.</p>
<p>A valid square has four equal sides with positive length and four equal angles (each 90 degrees).</p>
<p>The coordinate of a point <code>p<sub>i</sub></code> is represented as <code>[x<sub>i</sub>, y<sub>i</sub>]</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: p1 = [0,0], p2 = [1,1], p3 = [1,0], p4 = [0,1]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: p1 = [0,0], p2 = [1,1], p3 = [1,0], p4 = [0,12]
Output: false</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: p1 = [1,0], p2 = [-1,0], p3 = [0,1], p4 = [0,-1]
Output: true</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>p1.length == p2.length == p3.length == p4.length == 2</code></li>
<li><code>-10<sup>4</sup> &lt;= x<sub>i</sub>, y<sub>i</sub> &lt;= 10<sup>4</sup></code></li>
</ul>$DESC$,
  '', ARRAY['Compute all 6 pairwise squared distances between the 4 points.', 'A valid square has exactly 2 distinct positive distance values: 4 equal sides and 2 equal diagonals.', 'The diagonal distance should be exactly twice the side distance (Pythagorean theorem on 45-degree right triangle).'],
  '200', 'https://leetcode.com/problems/valid-square/',
  'validSquare', '[{"name":"p1","type":"List[int]"},{"name":"p2","type":"List[int]"},{"name":"p3","type":"List[int]"},{"name":"p4","type":"List[int]"}]'::jsonb, 'bool',
  '[{"inputs":["[0,0]","[1,1]","[1,0]","[0,1]"],"expected":"true"},{"inputs":["[0,0]","[1,1]","[1,0]","[0,12]"],"expected":"false"},{"inputs":["[1,0]","[-1,0]","[0,1]","[0,-1]"],"expected":"true"},{"inputs":["[0,0]","[0,0]","[0,0]","[0,0]"],"expected":"false"},{"inputs":["[0,0]","[1,0]","[1,1]","[0,1]"],"expected":"true"},{"inputs":["[0,0]","[2,0]","[2,2]","[0,2]"],"expected":"true"},{"inputs":["[0,0]","[5,0]","[5,5]","[0,5]"],"expected":"true"},{"inputs":["[0,0]","[1,0]","[0,1]","[1,2]"],"expected":"false"},{"inputs":["[0,0]","[0,1]","[1,0]","[1,1]"],"expected":"true"},{"inputs":["[1,1]","[2,2]","[3,3]","[4,4]"],"expected":"false"},{"inputs":["[0,0]","[1,0]","[2,0]","[0,1]"],"expected":"false"},{"inputs":["[0,0]","[3,4]","[7,1]","[4,-3]"],"expected":"true"},{"inputs":["[0,0]","[0,2]","[2,2]","[2,0]"],"expected":"true"},{"inputs":["[1,1]","[1,1]","[1,1]","[2,2]"],"expected":"false"},{"inputs":["[0,0]","[1,0]","[1,1]","[0,2]"],"expected":"false"},{"inputs":["[0,0]","[0,1]","[1,1]","[1,0]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'valid-square', 1, 'Distance-Based Validation',
  'A valid square has exactly 4 equal sides and 2 equal diagonals, giving exactly 2 distinct squared-distance values among all 6 pairwise distances. The smaller value (side) must appear 4 times and the larger (diagonal) must appear 2 times. We also need all distances to be positive (no coincident points).',
  '["Compute all 6 pairwise squared distances between the 4 points.","Sort the distances.","Check: the smallest 4 distances are equal (sides) and the largest 2 are equal (diagonals).","Also check that the side length is positive (> 0).","Additionally verify that diagonal = 2 * side (Pythagorean property of squares)."]'::jsonb,
  $PY$class Solution:
    def validSquare(self, p1: list[int], p2: list[int], p3: list[int], p4: list[int]) -> bool:
        def dist_sq(a, b):
            return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
        points = [p1, p2, p3, p4]
        dists = []
        for i in range(4):
            for j in range(i + 1, 4):
                dists.append(dist_sq(points[i], points[j]))
        dists.sort()
        return (dists[0] > 0 and
                dists[0] == dists[1] == dists[2] == dists[3] and
                dists[4] == dists[5] and
                dists[4] == 2 * dists[0])$PY$,
  $JS$var validSquare = function(p1, p2, p3, p4) {
    function distSq(a, b) {
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    }
    const points = [p1, p2, p3, p4];
    const dists = [];
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            dists.push(distSq(points[i], points[j]));
        }
    }
    dists.sort((a, b) => a - b);
    return dists[0] > 0 &&
           dists[0] === dists[1] && dists[1] === dists[2] && dists[2] === dists[3] &&
           dists[4] === dists[5] &&
           dists[4] === 2 * dists[0];
};$JS$,
  $JAVA$class Solution {
    public boolean validSquare(int[] p1, int[] p2, int[] p3, int[] p4) {
        int[][] points = {p1, p2, p3, p4};
        int[] dists = new int[6];
        int idx = 0;
        for (int i = 0; i < 4; i++) {
            for (int j = i + 1; j < 4; j++) {
                dists[idx++] = distSq(points[i], points[j]);
            }
        }
        java.util.Arrays.sort(dists);
        return dists[0] > 0 &&
               dists[0] == dists[1] && dists[1] == dists[2] && dists[2] == dists[3] &&
               dists[4] == dists[5] &&
               dists[4] == 2 * dists[0];
    }

    private int distSq(int[] a, int[] b) {
        return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
    }
}$JAVA$,
  'O(1)', 'O(1)'
);

-- ============================================================
-- 10. max-points-on-line (Geometry, Hard, LeetCode 149)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'max-points-on-line', 'geometry', 'Max Points on a Line', 'Hard',
  $DESC$<p>Given an array of <code>points</code> where <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code> represents a point on the X-Y plane, return the <em>maximum number of points that lie on the same straight line</em>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: points = [[1,1],[2,2],[3,3]]
Output: 3</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]
Output: 4</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= points.length &lt;= 300</code></li>
<li><code>points[i].length == 2</code></li>
<li><code>-10<sup>4</sup> &lt;= x<sub>i</sub>, y<sub>i</sub> &lt;= 10<sup>4</sup></code></li>
<li>All the <code>points</code> are <strong>unique</strong>.</li>
</ul>$DESC$,
  '', ARRAY['For each point, compute the slope to every other point and group by slope.', 'Use a hashmap of slopes. The key insight is representing slope as a reduced fraction (dx/gcd, dy/gcd) to avoid floating-point issues.', 'Handle vertical lines (dx=0) and horizontal lines (dy=0) as special cases in the slope representation.'],
  '200', 'https://leetcode.com/problems/max-points-on-a-line/',
  'maxPoints', '[{"name":"points","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"3"},{"inputs":["[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]"],"expected":"4"},{"inputs":["[[0,0]]"],"expected":"1"},{"inputs":["[[0,0],[1,0]]"],"expected":"2"},{"inputs":["[[0,0],[0,1],[0,2],[0,3]]"],"expected":"4"},{"inputs":["[[1,0],[2,0],[3,0],[4,0],[5,0]]"],"expected":"5"},{"inputs":["[[0,0],[1,1],[2,2],[3,3],[4,4]]"],"expected":"5"},{"inputs":["[[1,1],[2,2],[3,3],[1,2],[2,3]]"],"expected":"3"},{"inputs":["[[0,0],[1,0],[0,1]]"],"expected":"2"},{"inputs":["[[0,0],[1,1],[0,1],[1,0]]"],"expected":"2"},{"inputs":["[[1,1],[2,1],[3,1],[4,1],[1,2],[1,3]]"],"expected":"4"},{"inputs":["[[0,0],[4,5],[7,8],[8,9],[5,6],[3,4],[1,1]]"],"expected":"5"},{"inputs":["[[1,2],[2,4],[3,6]]"],"expected":"3"},{"inputs":["[[0,0],[1,2],[2,4],[3,6],[4,8]]"],"expected":"5"},{"inputs":["[[0,0],[0,0]]"],"expected":"2"},{"inputs":["[[1,1],[1,1],[1,1]]"],"expected":"3"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'max-points-on-line', 1, 'Slope Hashmap',
  'For each point, we calculate the slope to every other point and use a hashmap to count how many points share the same slope. The slope is represented as a reduced fraction (dy/gcd, dx/gcd) to avoid floating-point precision issues. The maximum count plus 1 (for the point itself) gives us the answer for that anchor point.',
  '["For each point i (the anchor), create a slope hashmap.","For each other point j, compute dx = xj - xi, dy = yj - yi.","Reduce the fraction by dividing by GCD. Normalize the sign so dx is always non-negative (or if dx=0, dy is positive).","Increment the count for this slope in the hashmap.","Track the maximum count across all slopes, then add 1 for the anchor point.","Return the global maximum."]'::jsonb,
  $PY$class Solution:
    def maxPoints(self, points: list[list[int]]) -> int:
        from math import gcd
        n = len(points)
        if n <= 2:
            return n
        best = 2
        for i in range(n):
            slopes = {}
            for j in range(i + 1, n):
                dx = points[j][0] - points[i][0]
                dy = points[j][1] - points[i][1]
                g = gcd(abs(dx), abs(dy))
                if g != 0:
                    dx //= g
                    dy //= g
                if dx < 0:
                    dx, dy = -dx, -dy
                elif dx == 0:
                    dy = abs(dy)
                key = (dx, dy)
                slopes[key] = slopes.get(key, 0) + 1
                best = max(best, slopes[key] + 1)
        return best$PY$,
  $JS$var maxPoints = function(points) {
    const n = points.length;
    if (n <= 2) return n;
    function gcd(a, b) {
        a = Math.abs(a); b = Math.abs(b);
        while (b) { [a, b] = [b, a % b]; }
        return a;
    }
    let best = 2;
    for (let i = 0; i < n; i++) {
        const slopes = new Map();
        for (let j = i + 1; j < n; j++) {
            let dx = points[j][0] - points[i][0];
            let dy = points[j][1] - points[i][1];
            const g = gcd(dx, dy);
            if (g !== 0) { dx /= g; dy /= g; }
            if (dx < 0) { dx = -dx; dy = -dy; }
            else if (dx === 0) { dy = Math.abs(dy); }
            const key = dx + "," + dy;
            const count = (slopes.get(key) || 0) + 1;
            slopes.set(key, count);
            best = Math.max(best, count + 1);
        }
    }
    return best;
};$JS$,
  $JAVA$class Solution {
    public int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int best = 2;
        for (int i = 0; i < n; i++) {
            java.util.Map<String, Integer> slopes = new java.util.HashMap<>();
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = gcd(Math.abs(dx), Math.abs(dy));
                if (g != 0) { dx /= g; dy /= g; }
                if (dx < 0) { dx = -dx; dy = -dy; }
                else if (dx == 0) { dy = Math.abs(dy); }
                String key = dx + "," + dy;
                int count = slopes.getOrDefault(key, 0) + 1;
                slopes.put(key, count);
                best = Math.max(best, count + 1);
            }
        }
        return best;
    }

    private int gcd(int a, int b) {
        while (b != 0) { int t = b; b = a % b; a = t; }
        return a;
    }
}$JAVA$,
  'O(n^2)', 'O(n)'
);

-- ============================================================
-- 11. rectangle-overlap (Geometry, Easy, LeetCode 836)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'rectangle-overlap', 'geometry', 'Rectangle Overlap', 'Easy',
  $DESC$<p>An axis-aligned rectangle is represented as a list <code>[x1, y1, x2, y2]</code>, where <code>(x1, y1)</code> is the coordinate of its bottom-left corner, and <code>(x2, y2)</code> is the coordinate of its top-right corner. Its top and bottom edges are parallel to the X axis, and its left and right edges are parallel to the Y axis.</p>
<p>Two rectangles overlap if the area of their intersection is <strong>positive</strong>. To be clear, two rectangles that only touch at the corner or edges do <strong>not</strong> overlap.</p>
<p>Given two axis-aligned rectangles <code>rec1</code> and <code>rec2</code>, return <code>true</code> if they overlap, otherwise return <code>false</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: rec1 = [0,0,2,2], rec2 = [1,1,3,3]
Output: true</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: rec1 = [0,0,1,1], rec2 = [1,0,2,1]
Output: false</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: rec1 = [0,0,1,1], rec2 = [2,2,3,3]
Output: false</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>rec1.length == 4</code></li>
<li><code>rec2.length == 4</code></li>
<li><code>-10<sup>9</sup> &lt;= rec1[i], rec2[i] &lt;= 10<sup>9</sup></code></li>
<li><code>rec1</code> and <code>rec2</code> represent a valid rectangle with a non-zero area.</li>
</ul>$DESC$,
  '', ARRAY['Two rectangles overlap if and only if their projections on both the X-axis and Y-axis overlap with positive length.', 'X-axis overlap: max(x1_a, x1_b) < min(x2_a, x2_b). Similarly for Y-axis.', 'Alternatively, check that one rectangle is NOT entirely to the left, right, above, or below the other.'],
  '200', 'https://leetcode.com/problems/rectangle-overlap/',
  'isRectangleOverlap', '[{"name":"rec1","type":"List[int]"},{"name":"rec2","type":"List[int]"}]'::jsonb, 'bool',
  '[{"inputs":["[0,0,2,2]","[1,1,3,3]"],"expected":"true"},{"inputs":["[0,0,1,1]","[1,0,2,1]"],"expected":"false"},{"inputs":["[0,0,1,1]","[2,2,3,3]"],"expected":"false"},{"inputs":["[0,0,4,4]","[1,1,3,3]"],"expected":"true"},{"inputs":["[0,0,2,2]","[0,0,2,2]"],"expected":"true"},{"inputs":["[0,0,1,1]","[0,1,1,2]"],"expected":"false"},{"inputs":["[0,0,3,3]","[1,1,2,2]"],"expected":"true"},{"inputs":["[0,0,1,1]","[-1,-1,0,0]"],"expected":"false"},{"inputs":["[-1,-1,1,1]","[0,0,2,2]"],"expected":"true"},{"inputs":["[0,0,5,5]","[5,0,10,5]"],"expected":"false"},{"inputs":["[0,0,5,5]","[4,0,10,5]"],"expected":"true"},{"inputs":["[0,0,10,10]","[3,3,7,7]"],"expected":"true"},{"inputs":["[0,0,1,1]","[0,2,1,3]"],"expected":"false"},{"inputs":["[-5,-5,5,5]","[-3,-3,3,3]"],"expected":"true"},{"inputs":["[0,0,2,2]","[2,2,4,4]"],"expected":"false"},{"inputs":["[0,0,3,3]","[2,2,5,5]"],"expected":"true"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'rectangle-overlap', 1, 'Projection Overlap Check',
  'Two rectangles overlap if and only if their projections overlap on both axes. The X-axis projection of rec1 is [x1, x2] and rec2 is [x3, x4]. They overlap if max(x1, x3) < min(x2, x4). Same logic applies to the Y-axis.',
  '["Extract coordinates: rec1 = [x1, y1, x2, y2], rec2 = [x3, y3, x4, y4].","Check X-axis overlap: max(x1, x3) < min(x2, x4).","Check Y-axis overlap: max(y1, y3) < min(y2, y4).","Return true only if both axes overlap."]'::jsonb,
  $PY$class Solution:
    def isRectangleOverlap(self, rec1: list[int], rec2: list[int]) -> bool:
        return (max(rec1[0], rec2[0]) < min(rec1[2], rec2[2]) and
                max(rec1[1], rec2[1]) < min(rec1[3], rec2[3]))$PY$,
  $JS$var isRectangleOverlap = function(rec1, rec2) {
    return Math.max(rec1[0], rec2[0]) < Math.min(rec1[2], rec2[2]) &&
           Math.max(rec1[1], rec2[1]) < Math.min(rec1[3], rec2[3]);
};$JS$,
  $JAVA$class Solution {
    public boolean isRectangleOverlap(int[] rec1, int[] rec2) {
        return Math.max(rec1[0], rec2[0]) < Math.min(rec1[2], rec2[2]) &&
               Math.max(rec1[1], rec2[1]) < Math.min(rec1[3], rec2[3]);
    }
}$JAVA$,
  'O(1)', 'O(1)'
);

-- ============================================================
-- 12. k-closest-origin (Geometry, Medium, LeetCode 973)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'k-closest-origin', 'geometry', 'K Closest Points to Origin', 'Medium',
  $DESC$<p>Given an array of <code>points</code> where <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code> represents a point on the X-Y plane and an integer <code>k</code>, return the <code>k</code> closest points to the origin <code>(0, 0)</code>.</p>
<p>The distance between two points on the X-Y plane is the Euclidean distance (i.e., <code>&radic;(x<sub>1</sub><sup>2</sup> + y<sub>1</sub><sup>2</sup>)</code>).</p>
<p>You may return the answer in <strong>any order</strong>. The answer is <strong>guaranteed to be unique</strong> (except for the order that it is in).</p>
<p>Return the result sorted by distance, then by x-coordinate, then by y-coordinate for deterministic output.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: points = [[1,3],[-2,2]], k = 1
Output: [[-2,2]]
Explanation: Distance of (1,3) from origin = sqrt(10). Distance of (-2,2) from origin = sqrt(8). Since sqrt(8) &lt; sqrt(10), (-2,2) is closer.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: points = [[3,3],[5,-1],[-2,4]], k = 2
Output: [[-2,4],[3,3]]</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= k &lt;= points.length &lt;= 10<sup>4</sup></code></li>
<li><code>-10<sup>4</sup> &lt;= x<sub>i</sub>, y<sub>i</sub> &lt;= 10<sup>4</sup></code></li>
</ul>$DESC$,
  '', ARRAY['You do not need to compute the actual Euclidean distance. Comparing squared distances (x^2 + y^2) is sufficient.', 'Sort all points by their squared distance and return the first k.', 'For a more efficient approach, use a max-heap of size k or the quickselect algorithm.'],
  '200', 'https://leetcode.com/problems/k-closest-points-to-origin/',
  'kClosest', '[{"name":"points","type":"List[List[int]]"},{"name":"k","type":"int"}]'::jsonb, 'List[List[int]]',
  '[{"inputs":["[[1,3],[-2,2]]","1"],"expected":"[[-2,2]]"},{"inputs":["[[3,3],[5,-1],[-2,4]]","2"],"expected":"[[3,3],[-2,4]]"},{"inputs":["[[0,1],[1,0]]","2"],"expected":"[[0,1],[1,0]]"},{"inputs":["[[1,1]]","1"],"expected":"[[1,1]]"},{"inputs":["[[1,0],[0,1],[-1,0],[0,-1]]","2"],"expected":"[[-1,0],[0,-1]]"},{"inputs":["[[2,2],[1,1],[3,3]]","1"],"expected":"[[1,1]]"},{"inputs":["[[10,10],[5,5],[1,1],[3,3]]","2"],"expected":"[[1,1],[3,3]]"},{"inputs":["[[0,0],[1,1],[2,2]]","1"],"expected":"[[0,0]]"},{"inputs":["[[3,4],[5,12],[0,1]]","2"],"expected":"[[0,1],[3,4]]"},{"inputs":["[[-1,-1],[1,1],[-1,1],[1,-1]]","4"],"expected":"[[-1,-1],[-1,1],[1,-1],[1,1]]"},{"inputs":["[[1,2],[1,-2],[-1,2],[-1,-2]]","2"],"expected":"[[-1,-2],[-1,2]]"},{"inputs":["[[6,8],[3,4],[0,0]]","3"],"expected":"[[0,0],[3,4],[6,8]]"},{"inputs":["[[10,0],[0,10],[-10,0],[0,-10]]","1"],"expected":"[[-10,0]]"},{"inputs":["[[2,3],[4,1],[1,4]]","2"],"expected":"[[2,3],[1,4]]"},{"inputs":["[[5,5],[3,3],[7,7],[1,1]]","3"],"expected":"[[1,1],[3,3],[5,5]]"},{"inputs":["[[-3,4],[5,0],[2,-2]]","2"],"expected":"[[2,-2],[-3,4]]"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'k-closest-origin', 1, 'Sort by Squared Distance',
  'We sort all points by their squared Euclidean distance from the origin (x^2 + y^2). We do not need to compute the actual square root since we are only comparing distances. After sorting, we take the first k points. We sort the result by distance, then x, then y for deterministic output.',
  '["Compute squared distance for each point: dist = x^2 + y^2.","Sort points by (squared distance, x-coordinate, y-coordinate).","Return the first k points from the sorted array."]'::jsonb,
  $PY$class Solution:
    def kClosest(self, points: list[list[int]], k: int) -> list[list[int]]:
        points.sort(key=lambda p: (p[0] ** 2 + p[1] ** 2, p[0], p[1]))
        return points[:k]$PY$,
  $JS$var kClosest = function(points, k) {
    points.sort((a, b) => {
        const distA = a[0] * a[0] + a[1] * a[1];
        const distB = b[0] * b[0] + b[1] * b[1];
        if (distA !== distB) return distA - distB;
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
    });
    return points.slice(0, k);
};$JS$,
  $JAVA$class Solution {
    public int[][] kClosest(int[][] points, int k) {
        java.util.Arrays.sort(points, (a, b) -> {
            int distA = a[0] * a[0] + a[1] * a[1];
            int distB = b[0] * b[0] + b[1] * b[1];
            if (distA != distB) return distA - distB;
            if (a[0] != b[0]) return a[0] - b[0];
            return a[1] - b[1];
        });
        return java.util.Arrays.copyOfRange(points, 0, k);
    }
}$JAVA$,
  'O(n log n)', 'O(1)'
);

-- ============================================================
-- 13. minimum-area-rectangle (Geometry, Medium, LeetCode 939)
-- ============================================================
INSERT INTO public."PGcode_problems" (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES (
  'minimum-area-rectangle', 'geometry', 'Minimum Area Rectangle', 'Medium',
  $DESC$<p>You are given an array of points in the X-Y plane <code>points</code> where <code>points[i] = [x<sub>i</sub>, y<sub>i</sub>]</code>.</p>
<p>Return the <em>minimum area of a rectangle</em> formed from these points, with sides <strong>parallel to the X and Y axes</strong>. If there is not any such rectangle, return <code>0</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: points = [[1,1],[1,3],[3,1],[3,3],[2,2]]
Output: 4</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: points = [[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]
Output: 2</pre>
<p><strong>Constraints:</strong></p>
<ul>
<li><code>1 &lt;= points.length &lt;= 500</code></li>
<li><code>points[i].length == 2</code></li>
<li><code>0 &lt;= x<sub>i</sub>, y<sub>i</sub> &lt;= 4 * 10<sup>4</sup></code></li>
<li>All the given points are <strong>unique</strong>.</li>
</ul>$DESC$,
  '', ARRAY['For a rectangle with sides parallel to axes, we need two pairs of points sharing the same x-coordinates and two pairs sharing the same y-coordinates.', 'For each pair of points that could form a diagonal, check if the other two corners exist.', 'Use a set for O(1) point lookup.'],
  '200', 'https://leetcode.com/problems/minimum-area-rectangle/',
  'minAreaRect', '[{"name":"points","type":"List[List[int]]"}]'::jsonb, 'int',
  '[{"inputs":["[[1,1],[1,3],[3,1],[3,3],[2,2]]"],"expected":"4"},{"inputs":["[[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]"],"expected":"2"},{"inputs":["[[1,1],[2,2],[3,3]]"],"expected":"0"},{"inputs":["[[0,0],[0,1],[1,0],[1,1]]"],"expected":"1"},{"inputs":["[[0,0],[1,0],[2,0],[3,0]]"],"expected":"0"},{"inputs":["[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]"],"expected":"1"},{"inputs":["[[1,1],[1,5],[5,1],[5,5],[3,3]]"],"expected":"16"},{"inputs":["[[0,0],[0,3],[3,0],[3,3],[0,1],[3,1]]"],"expected":"3"},{"inputs":["[[0,0],[4,0],[4,3],[0,3],[2,0],[2,3]]"],"expected":"6"},{"inputs":["[[1,2],[3,2],[1,4],[3,4],[1,6],[3,6]]"],"expected":"4"},{"inputs":["[[0,0],[10,0],[10,10],[0,10]]"],"expected":"100"},{"inputs":["[[0,0],[1,1],[2,0],[1,0],[0,1],[2,1]]"],"expected":"1"},{"inputs":["[[5,5]]"],"expected":"0"},{"inputs":["[[0,0],[0,2],[2,0],[2,2],[0,1],[2,1],[1,0],[1,2]]"],"expected":"1"},{"inputs":["[[0,0],[3,0],[3,5],[0,5],[1,0],[1,5]]"],"expected":"5"},{"inputs":["[[0,0],[100,0],[100,100],[0,100]]"],"expected":"10000"}]'::jsonb
);

INSERT INTO public."PGcode_solution_approaches" (problem_id, approach_number, approach_name, intuition, algorithm_steps, code_python, code_javascript, code_java, time_complexity, space_complexity)
VALUES (
  'minimum-area-rectangle', 1, 'Diagonal Pair with Set Lookup',
  'For an axis-aligned rectangle, any two diagonally opposite corners (x1,y1) and (x2,y2) where x1 != x2 and y1 != y2 determine the rectangle. The other two corners must be (x1,y2) and (x2,y1). We iterate over all pairs of points as potential diagonal corners and check if the other two corners exist in a set.',
  '["Store all points in a set for O(1) lookup.","Iterate over all pairs of points (i, j).","For each pair where x1 != x2 AND y1 != y2 (potential diagonal corners), check if (x1, y2) and (x2, y1) exist in the set.","If they do, compute the area = |x1 - x2| * |y1 - y2| and track the minimum.","Return the minimum area found, or 0 if no rectangle exists."]'::jsonb,
  $PY$class Solution:
    def minAreaRect(self, points: list[list[int]]) -> int:
        point_set = set(map(tuple, points))
        min_area = float('inf')
        n = len(points)
        for i in range(n):
            for j in range(i + 1, n):
                x1, y1 = points[i]
                x2, y2 = points[j]
                if x1 != x2 and y1 != y2:
                    if (x1, y2) in point_set and (x2, y1) in point_set:
                        area = abs(x1 - x2) * abs(y1 - y2)
                        min_area = min(min_area, area)
        return min_area if min_area != float('inf') else 0$PY$,
  $JS$var minAreaRect = function(points) {
    const pointSet = new Set(points.map(p => p[0] + "," + p[1]));
    let minArea = Infinity;
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[j];
            if (x1 !== x2 && y1 !== y2) {
                if (pointSet.has(x1 + "," + y2) && pointSet.has(x2 + "," + y1)) {
                    const area = Math.abs(x1 - x2) * Math.abs(y1 - y2);
                    minArea = Math.min(minArea, area);
                }
            }
        }
    }
    return minArea === Infinity ? 0 : minArea;
};$JS$,
  $JAVA$class Solution {
    public int minAreaRect(int[][] points) {
        java.util.Set<String> pointSet = new java.util.HashSet<>();
        for (int[] p : points) {
            pointSet.add(p[0] + "," + p[1]);
        }
        int minArea = Integer.MAX_VALUE;
        for (int i = 0; i < points.length; i++) {
            for (int j = i + 1; j < points.length; j++) {
                int x1 = points[i][0], y1 = points[i][1];
                int x2 = points[j][0], y2 = points[j][1];
                if (x1 != x2 && y1 != y2) {
                    if (pointSet.contains(x1 + "," + y2) && pointSet.contains(x2 + "," + y1)) {
                        int area = Math.abs(x1 - x2) * Math.abs(y1 - y2);
                        minArea = Math.min(minArea, area);
                    }
                }
            }
        }
        return minArea == Integer.MAX_VALUE ? 0 : minArea;
    }
}$JAVA$,
  'O(n^2)', 'O(n)'
);

COMMIT;
