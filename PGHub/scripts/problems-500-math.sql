-- Grow catalog 400 → 500: math topic (+8 problems: 3E, 3M, 2H).
BEGIN;

DELETE FROM public."PGcode_solution_approaches" WHERE problem_id IN (
  'add-digits','base-7','ugly-number',
  'angle-between-hands','water-and-jug','string-to-integer',
  'basic-calculator','nth-digit'
);
DELETE FROM public."PGcode_problem_templates" WHERE problem_id IN (
  'add-digits','base-7','ugly-number',
  'angle-between-hands','water-and-jug','string-to-integer',
  'basic-calculator','nth-digit'
);
DELETE FROM public."PGcode_problems" WHERE id IN (
  'add-digits','base-7','ugly-number',
  'angle-between-hands','water-and-jug','string-to-integer',
  'basic-calculator','nth-digit'
);

-- ============================================================
-- 1) add-digits (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('add-digits', 'math', 'Add Digits', 'Easy',
$$<p>Given an integer <code>num</code>, repeatedly add all its digits until the result has only one digit, and return it.</p>$$,
'', ARRAY[
  'You can simulate by looping: while num >= 10, sum its digits.',
  'There is a mathematical O(1) solution using the digital root formula.',
  'Digital root: if num == 0 return 0; else return 1 + (num - 1) % 9.'
], '500', 'https://leetcode.com/problems/add-digits/',
'addDigits',
'[{"name":"num","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["38"],"expected":"2"},
  {"inputs":["0"],"expected":"0"},
  {"inputs":["9"],"expected":"9"},
  {"inputs":["199"],"expected":"1"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('add-digits', 'python',
$PY$class Solution:
    def addDigits(self, num: int) -> int:
        $PY$),
('add-digits', 'javascript',
$JS$var addDigits = function(num) {

};$JS$),
('add-digits', 'java',
$JAVA$class Solution {
    public int addDigits(int num) {

    }
}$JAVA$),
('add-digits', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int addDigits(int num) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('add-digits', 1, 'Digital Root Formula',
'The digital root of any non-zero number equals 1 + (num - 1) % 9. This is because repeatedly summing digits is equivalent to computing the number modulo 9, with the special case that multiples of 9 map to 9 rather than 0.',
'["If num is 0, return 0.","Return 1 + (num - 1) % 9."]'::jsonb,
$PY$class Solution:
    def addDigits(self, num: int) -> int:
        if num == 0:
            return 0
        return 1 + (num - 1) % 9
$PY$,
$JS$var addDigits = function(num) {
    if (num === 0) return 0;
    return 1 + (num - 1) % 9;
};
$JS$,
$JAVA$class Solution {
    public int addDigits(int num) {
        if (num == 0) return 0;
        return 1 + (num - 1) % 9;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int addDigits(int num) {
        if (num == 0) return 0;
        return 1 + (num - 1) % 9;
    }
};
$CPP$,
'O(1)', 'O(1)');

-- ============================================================
-- 2) base-7 (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('base-7', 'math', 'Base 7', 'Easy',
$$<p>Given an integer <code>num</code>, return a string of its base 7 representation.</p>$$,
'', ARRAY[
  'Handle 0 and negative numbers as special cases.',
  'Repeatedly divide by 7, collecting remainders.',
  'Reverse the collected digits and prepend a minus sign if needed.'
], '500', 'https://leetcode.com/problems/base-7/',
'convertToBase7',
'[{"name":"num","type":"int"}]'::jsonb,
'str',
'[
  {"inputs":["100"],"expected":"\"202\""},
  {"inputs":["-7"],"expected":"\"-10\""},
  {"inputs":["0"],"expected":"\"0\""},
  {"inputs":["49"],"expected":"\"100\""}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('base-7', 'python',
$PY$class Solution:
    def convertToBase7(self, num: int) -> str:
        $PY$),
('base-7', 'javascript',
$JS$var convertToBase7 = function(num) {

};$JS$),
('base-7', 'java',
$JAVA$class Solution {
    public String convertToBase7(int num) {

    }
}$JAVA$),
('base-7', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string convertToBase7(int num) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('base-7', 1, 'Repeated Division',
'Any base conversion works by repeatedly dividing by the base and collecting remainders. The remainders, read in reverse, give the digits of the number in the new base.',
'["If num is 0, return \"0\".","Record sign and work with abs(num).","While n > 0: append n % 7 to digits; n = n // 7.","Reverse digits, join, prepend \"-\" if negative."]'::jsonb,
$PY$class Solution:
    def convertToBase7(self, num: int) -> str:
        if num == 0:
            return "0"
        negative = num < 0
        n = abs(num)
        digits = []
        while n > 0:
            digits.append(str(n % 7))
            n //= 7
        result = "".join(reversed(digits))
        return "-" + result if negative else result
$PY$,
$JS$var convertToBase7 = function(num) {
    if (num === 0) return "0";
    const negative = num < 0;
    let n = Math.abs(num);
    const digits = [];
    while (n > 0) {
        digits.push(n % 7);
        n = Math.floor(n / 7);
    }
    const result = digits.reverse().join("");
    return negative ? "-" + result : result;
};
$JS$,
$JAVA$class Solution {
    public String convertToBase7(int num) {
        if (num == 0) return "0";
        boolean negative = num < 0;
        int n = Math.abs(num);
        StringBuilder sb = new StringBuilder();
        while (n > 0) {
            sb.append(n % 7);
            n /= 7;
        }
        if (negative) sb.append("-");
        return sb.reverse().toString();
    }
}
$JAVA$,
$CPP$class Solution {
public:
    string convertToBase7(int num) {
        if (num == 0) return "0";
        bool negative = num < 0;
        int n = abs(num);
        string digits;
        while (n > 0) {
            digits += to_string(n % 7);
            n /= 7;
        }
        if (negative) digits += "-";
        reverse(digits.begin(), digits.end());
        return digits;
    }
};
$CPP$,
'O(log num)', 'O(log num)');

-- ============================================================
-- 3) ugly-number (Easy)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('ugly-number', 'math', 'Ugly Number', 'Easy',
$$<p>An <strong>ugly number</strong> is a positive integer whose prime factors are limited to <code>2</code>, <code>3</code>, and <code>5</code>. Given an integer <code>n</code>, return <code>true</code> if <code>n</code> is an ugly number.</p>$$,
'', ARRAY[
  'Divide out all factors of 2, then 3, then 5.',
  'If the remaining number is 1, it is ugly.',
  'Non-positive numbers are never ugly.'
], '500', 'https://leetcode.com/problems/ugly-number/',
'isUgly',
'[{"name":"n","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["6"],"expected":"true"},
  {"inputs":["1"],"expected":"true"},
  {"inputs":["14"],"expected":"false"},
  {"inputs":["-6"],"expected":"false"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('ugly-number', 'python',
$PY$class Solution:
    def isUgly(self, n: int) -> bool:
        $PY$),
('ugly-number', 'javascript',
$JS$var isUgly = function(n) {

};$JS$),
('ugly-number', 'java',
$JAVA$class Solution {
    public boolean isUgly(int n) {

    }
}$JAVA$),
('ugly-number', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isUgly(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('ugly-number', 1, 'Factor Division',
'An ugly number has no prime factors other than 2, 3, and 5. So we divide out each of these factors as many times as possible. If we are left with 1, the number is ugly; otherwise it has other prime factors.',
'["If n <= 0, return false.","While n is divisible by 2, divide by 2.","While n is divisible by 3, divide by 3.","While n is divisible by 5, divide by 5.","Return n == 1."]'::jsonb,
$PY$class Solution:
    def isUgly(self, n: int) -> bool:
        if n <= 0:
            return False
        for p in [2, 3, 5]:
            while n % p == 0:
                n //= p
        return n == 1
$PY$,
$JS$var isUgly = function(n) {
    if (n <= 0) return false;
    for (const p of [2, 3, 5]) {
        while (n % p === 0) n /= p;
    }
    return n === 1;
};
$JS$,
$JAVA$class Solution {
    public boolean isUgly(int n) {
        if (n <= 0) return false;
        for (int p : new int[]{2, 3, 5}) {
            while (n % p == 0) n /= p;
        }
        return n == 1;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool isUgly(int n) {
        if (n <= 0) return false;
        for (int p : {2, 3, 5}) {
            while (n % p == 0) n /= p;
        }
        return n == 1;
    }
};
$CPP$,
'O(log n)', 'O(1)');

-- ============================================================
-- 4) angle-between-hands (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('angle-between-hands', 'math', 'Angle Between Hands of a Clock', 'Medium',
$$<p>Given two numbers, <code>hour</code> and <code>minutes</code>, return the smaller angle (in degrees) formed between the hour and the minute hand of a clock. Answers within <code>10^-5</code> of the actual value will be accepted.</p>$$,
'', ARRAY[
  'The minute hand moves 6 degrees per minute (360 / 60).',
  'The hour hand moves 0.5 degrees per minute (30 degrees per hour / 60 minutes).',
  'Compute both angles from 12 o''clock, find the absolute difference, and take the minimum with 360 - difference.'
], '500', 'https://leetcode.com/problems/angle-between-hands-of-a-clock/',
'angleClock',
'[{"name":"hour","type":"int"},{"name":"minutes","type":"int"}]'::jsonb,
'float',
'[
  {"inputs":["12","30"],"expected":"165.0"},
  {"inputs":["3","30"],"expected":"75.0"},
  {"inputs":["3","15"],"expected":"7.5"},
  {"inputs":["12","0"],"expected":"0.0"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('angle-between-hands', 'python',
$PY$class Solution:
    def angleClock(self, hour: int, minutes: int) -> float:
        $PY$),
('angle-between-hands', 'javascript',
$JS$var angleClock = function(hour, minutes) {

};$JS$),
('angle-between-hands', 'java',
$JAVA$class Solution {
    public double angleClock(int hour, int minutes) {

    }
}$JAVA$),
('angle-between-hands', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    double angleClock(int hour, int minutes) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('angle-between-hands', 1, 'Direct Angle Calculation',
'Both hands rotate from the 12 o''clock position. The minute hand moves at 6 degrees per minute, the hour hand at 0.5 degrees per minute (plus 30 degrees per hour). Compute both angles, take the absolute difference, and return the smaller of the two possible arcs.',
$ALGO$["Compute minute angle: minutes * 6.","Compute hour angle: (hour % 12) * 30 + minutes * 0.5.","diff = abs(hour_angle - minute_angle).","Return min(diff, 360 - diff)."]$ALGO$::jsonb,
$PY$class Solution:
    def angleClock(self, hour: int, minutes: int) -> float:
        minute_angle = minutes * 6
        hour_angle = (hour % 12) * 30 + minutes * 0.5
        diff = abs(hour_angle - minute_angle)
        return min(diff, 360 - diff)
$PY$,
$JS$var angleClock = function(hour, minutes) {
    const minuteAngle = minutes * 6;
    const hourAngle = (hour % 12) * 30 + minutes * 0.5;
    const diff = Math.abs(hourAngle - minuteAngle);
    return Math.min(diff, 360 - diff);
};
$JS$,
$JAVA$class Solution {
    public double angleClock(int hour, int minutes) {
        double minuteAngle = minutes * 6.0;
        double hourAngle = (hour % 12) * 30.0 + minutes * 0.5;
        double diff = Math.abs(hourAngle - minuteAngle);
        return Math.min(diff, 360.0 - diff);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    double angleClock(int hour, int minutes) {
        double minuteAngle = minutes * 6.0;
        double hourAngle = (hour % 12) * 30.0 + minutes * 0.5;
        double diff = fabs(hourAngle - minuteAngle);
        return min(diff, 360.0 - diff);
    }
};
$CPP$,
'O(1)', 'O(1)');

-- ============================================================
-- 5) power-of-four (Medium) -- already exists, use water-and-jug instead
-- ============================================================
-- 5) water-and-jug (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('water-and-jug', 'math', 'Water and Jug Problem', 'Medium',
$$<p>You are given two jugs with capacities <code>x</code> litres and <code>y</code> litres. There is an infinite amount of water supply available. Determine whether it is possible to measure exactly <code>target</code> litres using these two jugs.</p><p>You can fill either jug completely, empty either jug, or pour water from one jug into the other until it is full or the source is empty.</p>$$,
'', ARRAY[
  'By Bezout''s identity, you can measure exactly target litres iff target is a multiple of gcd(x, y).',
  'Also ensure target <= x + y (you cannot hold more water than both jugs combined).',
  'Edge case: if x + y == 0 then target must be 0.'
], '500', 'https://leetcode.com/problems/water-and-jug-problem/',
'canMeasureWater',
'[{"name":"x","type":"int"},{"name":"y","type":"int"},{"name":"target","type":"int"}]'::jsonb,
'bool',
'[
  {"inputs":["3","5","4"],"expected":"true"},
  {"inputs":["2","6","5"],"expected":"false"},
  {"inputs":["1","1","12"],"expected":"false"},
  {"inputs":["0","0","0"],"expected":"true"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('water-and-jug', 'python',
$PY$class Solution:
    def canMeasureWater(self, x: int, y: int, target: int) -> bool:
        $PY$),
('water-and-jug', 'javascript',
$JS$var canMeasureWater = function(x, y, target) {

};$JS$),
('water-and-jug', 'java',
$JAVA$class Solution {
    public boolean canMeasureWater(int x, int y, int target) {

    }
}$JAVA$),
('water-and-jug', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool canMeasureWater(int x, int y, int target) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('water-and-jug', 1, 'GCD (Bezout Identity)',
'By Bezout''s identity, all achievable water amounts are multiples of gcd(x, y). So the target is measurable iff it is at most x + y and is divisible by gcd(x, y).',
$ALGO$["If target > x + y, return false.","If x + y == 0, return target == 0.","Return target % gcd(x, y) == 0."]$ALGO$::jsonb,
$PY$class Solution:
    def canMeasureWater(self, x: int, y: int, target: int) -> bool:
        if target > x + y:
            return False
        if x + y == 0:
            return target == 0
        from math import gcd
        return target % gcd(x, y) == 0
$PY$,
$JS$var canMeasureWater = function(x, y, target) {
    if (target > x + y) return false;
    if (x + y === 0) return target === 0;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    return target % gcd(x, y) === 0;
};
$JS$,
$JAVA$class Solution {
    public boolean canMeasureWater(int x, int y, int target) {
        if (target > x + y) return false;
        if (x + y == 0) return target == 0;
        return target % gcd(x, y) == 0;
    }
    private int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }
}
$JAVA$,
$CPP$class Solution {
public:
    bool canMeasureWater(int x, int y, int target) {
        if (target > x + y) return false;
        if (x + y == 0) return target == 0;
        return target % __gcd(x, y) == 0;
    }
};
$CPP$,
'O(log(min(x,y)))', 'O(1)');

-- ============================================================
-- 6) string-to-integer (Medium)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('string-to-integer', 'math', 'String to Integer (atoi)', 'Medium',
$$<p>Implement the <code>myAtoi(string s)</code> function, which converts a string to a 32-bit signed integer. Steps: discard leading whitespace, read optional sign, read digits and form the number, clamp to [−2^31, 2^31 − 1].</p>$$,
'', ARRAY[
  'Skip whitespace, then check for + or - sign.',
  'Read consecutive digits and build the number, checking for overflow at each step.',
  'Clamp the result to 32-bit signed integer range.'
], '500', 'https://leetcode.com/problems/string-to-integer-atoi/',
'myAtoi',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"42\""],"expected":"42"},
  {"inputs":["\"   -42\""],"expected":"-42"},
  {"inputs":["\"4193 with words\""],"expected":"4193"},
  {"inputs":["\"words and 987\""],"expected":"0"},
  {"inputs":["\"-91283472332\""],"expected":"-2147483648"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('string-to-integer', 'python',
$PY$class Solution:
    def myAtoi(self, s: str) -> int:
        $PY$),
('string-to-integer', 'javascript',
$JS$var myAtoi = function(s) {

};$JS$),
('string-to-integer', 'java',
$JAVA$class Solution {
    public int myAtoi(String s) {

    }
}$JAVA$),
('string-to-integer', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int myAtoi(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('string-to-integer', 1, 'Linear Scan with Overflow Check',
'Walk through the string once: skip whitespace, detect the sign, then accumulate digits. Before adding each digit check if the result would exceed INT_MAX to avoid overflow.',
$ALGO$["Strip leading whitespace by advancing index i.","If s[i] is + or -, record sign and advance.","While s[i] is a digit: check overflow before updating result = result * 10 + digit; advance i.","Return sign * result clamped to [-2^31, 2^31 - 1]."]$ALGO$::jsonb,
$PY$class Solution:
    def myAtoi(self, s: str) -> int:
        INT_MAX, INT_MIN = 2**31 - 1, -(2**31)
        i, n = 0, len(s)
        while i < n and s[i] == ' ':
            i += 1
        sign = 1
        if i < n and s[i] in ('+', '-'):
            sign = -1 if s[i] == '-' else 1
            i += 1
        result = 0
        while i < n and s[i].isdigit():
            digit = int(s[i])
            if result > (INT_MAX - digit) // 10:
                return INT_MIN if sign == -1 else INT_MAX
            result = result * 10 + digit
            i += 1
        return sign * result
$PY$,
$JS$var myAtoi = function(s) {
    const INT_MAX = 2147483647, INT_MIN = -2147483648;
    let i = 0;
    while (i < s.length && s[i] === ' ') i++;
    let sign = 1;
    if (i < s.length && (s[i] === '+' || s[i] === '-')) {
        sign = s[i] === '-' ? -1 : 1;
        i++;
    }
    let result = 0;
    while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        const digit = s.charCodeAt(i) - 48;
        if (result > Math.floor((INT_MAX - digit) / 10)) {
            return sign === -1 ? INT_MIN : INT_MAX;
        }
        result = result * 10 + digit;
        i++;
    }
    return sign * result;
};
$JS$,
$JAVA$class Solution {
    public int myAtoi(String s) {
        int i = 0, n = s.length();
        while (i < n && s.charAt(i) == ' ') i++;
        int sign = 1;
        if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
            sign = s.charAt(i) == '-' ? -1 : 1;
            i++;
        }
        int result = 0;
        while (i < n && Character.isDigit(s.charAt(i))) {
            int digit = s.charAt(i) - '0';
            if (result > (Integer.MAX_VALUE - digit) / 10) {
                return sign == -1 ? Integer.MIN_VALUE : Integer.MAX_VALUE;
            }
            result = result * 10 + digit;
            i++;
        }
        return sign * result;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int myAtoi(string s) {
        int i = 0, n = s.size();
        while (i < n && s[i] == ' ') i++;
        int sign = 1;
        if (i < n && (s[i] == '+' || s[i] == '-')) {
            sign = s[i++] == '-' ? -1 : 1;
        }
        long long result = 0;
        while (i < n && isdigit(s[i])) {
            result = result * 10 + (s[i++] - '0');
            if (result * sign <= INT_MIN) return INT_MIN;
            if (result * sign >= INT_MAX) return INT_MAX;
        }
        return (int)(sign * result);
    }
};
$CPP$,
'O(n)', 'O(1)');

-- ============================================================
-- 7) basic-calculator (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('basic-calculator', 'math', 'Basic Calculator', 'Hard',
$$<p>Given a string <code>s</code> representing a valid expression containing digits, <code>'+'</code>, <code>'-'</code>, <code>'('</code>, <code>')'</code>, and spaces, evaluate it and return the result. You may assume the expression is always valid.</p>$$,
'', ARRAY[
  'Use a stack to handle parentheses: push current result and sign when you see "(".',
  'When you see ")", pop the sign and previous result, and combine.',
  'Process digits to form numbers, applying the current sign.'
], '500', 'https://leetcode.com/problems/basic-calculator/',
'calculate',
'[{"name":"s","type":"str"}]'::jsonb,
'int',
'[
  {"inputs":["\"1 + 1\""],"expected":"2"},
  {"inputs":["\" 2-1 + 2 \""],"expected":"3"},
  {"inputs":["\"(1+(4+5+2)-3)+(6+8)\""],"expected":"23"},
  {"inputs":["\"-(3+(4+5))\""],"expected":"-12"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('basic-calculator', 'python',
$PY$class Solution:
    def calculate(self, s: str) -> int:
        $PY$),
('basic-calculator', 'javascript',
$JS$var calculate = function(s) {

};$JS$),
('basic-calculator', 'java',
$JAVA$class Solution {
    public int calculate(String s) {

    }
}$JAVA$),
('basic-calculator', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int calculate(string s) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('basic-calculator', 1, 'Stack-Based Evaluation',
'Track a running result and a sign. When encountering an opening parenthesis, push the current result and sign onto a stack and reset. On closing parenthesis, pop and combine. This naturally handles nested expressions.',
$ALGO$["Initialize result = 0, sign = 1, stack = [].","For each character: if digit, build the number; if +, add num*sign to result, sign=1; if -, add num*sign, sign=-1; if (, push result and sign, reset both; if ), add num*sign, pop sign and prev result, result = prev + popped_sign * result.","Add any remaining number and return result."]$ALGO$::jsonb,
$PY$class Solution:
    def calculate(self, s: str) -> int:
        stack = []
        result = 0
        sign = 1
        num = 0
        for c in s:
            if c.isdigit():
                num = num * 10 + int(c)
            elif c == '+':
                result += sign * num
                num = 0
                sign = 1
            elif c == '-':
                result += sign * num
                num = 0
                sign = -1
            elif c == '(':
                stack.append(result)
                stack.append(sign)
                result = 0
                sign = 1
            elif c == ')':
                result += sign * num
                num = 0
                result *= stack.pop()
                result += stack.pop()
        result += sign * num
        return result
$PY$,
$JS$var calculate = function(s) {
    const stack = [];
    let result = 0, sign = 1, num = 0;
    for (const c of s) {
        if (c >= '0' && c <= '9') {
            num = num * 10 + Number(c);
        } else if (c === '+') {
            result += sign * num;
            num = 0;
            sign = 1;
        } else if (c === '-') {
            result += sign * num;
            num = 0;
            sign = -1;
        } else if (c === '(') {
            stack.push(result);
            stack.push(sign);
            result = 0;
            sign = 1;
        } else if (c === ')') {
            result += sign * num;
            num = 0;
            result *= stack.pop();
            result += stack.pop();
        }
    }
    return result + sign * num;
};
$JS$,
$JAVA$class Solution {
    public int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        int result = 0, sign = 1, num = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '+') {
                result += sign * num;
                num = 0;
                sign = 1;
            } else if (c == '-') {
                result += sign * num;
                num = 0;
                sign = -1;
            } else if (c == '(') {
                stack.push(result);
                stack.push(sign);
                result = 0;
                sign = 1;
            } else if (c == ')') {
                result += sign * num;
                num = 0;
                result *= stack.pop();
                result += stack.pop();
            }
        }
        return result + sign * num;
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int calculate(string s) {
        stack<int> stk;
        int result = 0, sign = 1, num = 0;
        for (char c : s) {
            if (isdigit(c)) {
                num = num * 10 + (c - '0');
            } else if (c == '+') {
                result += sign * num;
                num = 0;
                sign = 1;
            } else if (c == '-') {
                result += sign * num;
                num = 0;
                sign = -1;
            } else if (c == '(') {
                stk.push(result);
                stk.push(sign);
                result = 0;
                sign = 1;
            } else if (c == ')') {
                result += sign * num;
                num = 0;
                result *= stk.top(); stk.pop();
                result += stk.top(); stk.pop();
            }
        }
        return result + sign * num;
    }
};
$CPP$,
'O(n)', 'O(n)');

-- ============================================================
-- 8) nth-digit (Hard)
-- ============================================================
INSERT INTO public."PGcode_problems"
  (id, topic_id, name, difficulty, description, solution_video_url, hints, roadmap_set, leetcode_url, method_name, params, return_type, test_cases)
VALUES
('nth-digit', 'math', 'Nth Digit', 'Hard',
$$<p>Given an integer <code>n</code>, return the n-th digit of the infinite integer sequence <code>1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...</code>.</p>$$,
'', ARRAY[
  '1-digit numbers (1-9) contribute 9 digits, 2-digit (10-99) contribute 180 digits, 3-digit 2700, etc.',
  'First determine which digit-length range n falls into.',
  'Then find the exact number and digit position within that number.'
], '500', 'https://leetcode.com/problems/nth-digit/',
'findNthDigit',
'[{"name":"n","type":"int"}]'::jsonb,
'int',
'[
  {"inputs":["3"],"expected":"3"},
  {"inputs":["11"],"expected":"0"},
  {"inputs":["1000"],"expected":"3"},
  {"inputs":["15"],"expected":"2"}
]'::jsonb);

INSERT INTO public."PGcode_problem_templates" (problem_id, language, code) VALUES
('nth-digit', 'python',
$PY$class Solution:
    def findNthDigit(self, n: int) -> int:
        $PY$),
('nth-digit', 'javascript',
$JS$var findNthDigit = function(n) {

};$JS$),
('nth-digit', 'java',
$JAVA$class Solution {
    public int findNthDigit(int n) {

    }
}$JAVA$),
('nth-digit', 'cpp',
$CPP$#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findNthDigit(int n) {

    }
};$CPP$);

INSERT INTO public."PGcode_solution_approaches"
  (problem_id, approach_number, approach_name, intuition, algorithm_steps,
   code_python, code_javascript, code_java, code_cpp, time_complexity, space_complexity)
VALUES
('nth-digit', 1, 'Digit Length Ranges',
'Numbers with d digits span from 10^(d-1) to 10^d - 1 and contribute 9 * 10^(d-1) * d total digits. Subtract each range from n until n fits within the current range, then compute the exact number and digit position.',
$ALGO$["digits = 1, count = 9, start = 1.","While n > digits * count: n -= digits * count; digits++; count *= 10; start *= 10.","num = start + (n - 1) / digits.","Return the ((n - 1) % digits)-th digit of num (from left)."]$ALGO$::jsonb,
$PY$class Solution:
    def findNthDigit(self, n: int) -> int:
        digits = 1
        count = 9
        start = 1
        while n > digits * count:
            n -= digits * count
            digits += 1
            count *= 10
            start *= 10
        num = start + (n - 1) // digits
        return int(str(num)[(n - 1) % digits])
$PY$,
$JS$var findNthDigit = function(n) {
    let digits = 1, count = 9, start = 1;
    while (n > digits * count) {
        n -= digits * count;
        digits++;
        count *= 10;
        start *= 10;
    }
    const num = start + Math.floor((n - 1) / digits);
    return Number(String(num)[(n - 1) % digits]);
};
$JS$,
$JAVA$class Solution {
    public int findNthDigit(int n) {
        int digits = 1;
        long count = 9, start = 1;
        while (n > digits * count) {
            n -= digits * count;
            digits++;
            count *= 10;
            start *= 10;
        }
        long num = start + (n - 1) / digits;
        return String.valueOf(num).charAt((n - 1) % digits) - '0';
    }
}
$JAVA$,
$CPP$class Solution {
public:
    int findNthDigit(int n) {
        long long digits = 1, count = 9, start = 1;
        while (n > digits * count) {
            n -= digits * count;
            digits++;
            count *= 10;
            start *= 10;
        }
        long long num = start + (n - 1) / digits;
        string s = to_string(num);
        return s[(n - 1) % digits] - '0';
    }
};
$CPP$,
'O(log n)', 'O(1)');

COMMIT;
